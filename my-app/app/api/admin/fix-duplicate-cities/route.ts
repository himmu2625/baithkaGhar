import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectMongo } from '@/lib/db/mongodb';
import Property from '@/models/Property';
import City from '@/models/city';
import { normalizeCityName, getCityRegex } from '@/lib/utils/city-utils';

// GET /api/admin/fix-duplicate-cities - Fix all duplicate cities with case sensitivity issues
export async function GET(req: NextRequest) {
  try {
    // Check for admin authentication
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cityName = searchParams.get('city');
    const dryRun = searchParams.get('dryRun') === 'true';

    await connectMongo();
    
    const results = {
      stepsCompleted: [],
      errors: [],
      dryRun,
      duplicatesFound: [],
      summary: {
        totalDuplicateGroups: 0,
        totalCitiesProcessed: 0,
        propertiesUpdated: 0,
        citiesDeleted: 0
      }
    };

    let citiesToCheck = [];

    if (cityName) {
      // Fix specific city
      const targetCities = await City.find({
        name: { $regex: new RegExp(`^${cityName}$`, 'i') }
      });
      if (targetCities.length > 0) {
        citiesToCheck.push({ _id: cityName, cities: targetCities });
      }
      results.stepsCompleted.push(`Checking for duplicates of city: ${cityName}`);
    } else {
      // Find all duplicate cities by grouping case-insensitive names
      const cityGroups = await City.aggregate([
        {
          $group: {
            _id: { $toLower: '$name' },
            cities: { $push: '$$ROOT' },
            count: { $sum: 1 }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ]);

      citiesToCheck = cityGroups;
      results.stepsCompleted.push(`Found ${cityGroups.length} groups of duplicate cities`);
    }

    results.summary.totalDuplicateGroups = citiesToCheck.length;

    if (citiesToCheck.length === 0) {
      results.stepsCompleted.push('No duplicate cities found');
      return NextResponse.json({
        success: true,
        message: 'No duplicate cities found',
        results
      });
    }

    // Process each group of duplicate cities
    for (const group of citiesToCheck) {
      const duplicateCities = group.cities;
      const cityBaseName = group._id;
      
      results.duplicatesFound.push({
        baseName: cityBaseName,
        variants: duplicateCities.map(c => ({ name: c.name, properties: c.properties, id: c._id }))
      });

      results.stepsCompleted.push(`Processing duplicate group for "${cityBaseName}" with ${duplicateCities.length} variants`);

      if (dryRun) {
        results.stepsCompleted.push(`[DRY RUN] Would merge ${duplicateCities.length} cities for "${cityBaseName}"`);
        continue;
      }

      // Find the preferred city (proper title case or the one with most properties)
      const normalizedName = normalizeCityName(cityBaseName);
      let preferredCity = duplicateCities.find(city => 
        city.name.toLowerCase() === normalizedName.toLowerCase()
      );
      
      if (!preferredCity) {
        // Use the city with the most properties
        preferredCity = duplicateCities.reduce((max, city) => 
          city.properties > max.properties ? city : max
        );
        
        // Rename it to proper case
        await City.findByIdAndUpdate(preferredCity._id, {
          name: normalizedName,
          updatedAt: new Date()
        });
        results.stepsCompleted.push(`Renamed "${preferredCity.name}" to "${normalizedName}"`);
      }

      // Get all properties from cities to be merged
      const citiesToMerge = duplicateCities.filter(city => 
        city._id.toString() !== preferredCity._id.toString()
      );

      let propertiesUpdatedForGroup = 0;

      for (const cityToMerge of citiesToMerge) {
        // Find properties associated with this city
        const properties = await Property.find({
          $or: [
            { 'address.city': { $regex: new RegExp(`^${cityToMerge.name}$`, 'i') } },
            { city: { $regex: new RegExp(`^${cityToMerge.name}$`, 'i') } }
          ]
        });

        // Update each property to use the preferred city name
        for (const property of properties) {
          const updateData: any = {};
          
          if (property.address && property.address.city) {
            updateData['address.city'] = normalizedName;
          }
          if (property.city) {
            updateData.city = normalizedName;
          }

          if (Object.keys(updateData).length > 0) {
            await Property.findByIdAndUpdate(property._id, updateData);
            propertiesUpdatedForGroup++;
          }
        }

        // Delete the duplicate city
        await City.findByIdAndDelete(cityToMerge._id);
        results.summary.citiesDeleted++;
        results.stepsCompleted.push(`Merged city "${cityToMerge.name}" with ${properties.length} properties into "${normalizedName}"`);
      }

      results.summary.propertiesUpdated += propertiesUpdatedForGroup;

      // Recalculate property count for the final city
      const finalCity = await City.findById(preferredCity._id);
      if (finalCity) {
        const cityRegex = getCityRegex(normalizedName);
        const activePropertyCount = await Property.countDocuments({
          $and: [
            {
              $or: [
                { 'address.city': { $regex: cityRegex } },
                { city: { $regex: cityRegex } }
              ]
            },
            {
              isPublished: true,
              verificationStatus: 'approved',
              status: 'available'
            }
          ]
        });

        await City.findByIdAndUpdate(finalCity._id, {
          properties: activePropertyCount,
          updatedAt: new Date()
        });

        results.stepsCompleted.push(`Updated "${normalizedName}" city property count to: ${activePropertyCount}`);
      }

      results.summary.totalCitiesProcessed++;
    }

    const message = dryRun 
      ? `Dry run completed. Found ${results.summary.totalDuplicateGroups} groups of duplicate cities`
      : `Successfully fixed ${results.summary.totalDuplicateGroups} groups of duplicate cities`;

    return NextResponse.json({
      success: true,
      message,
      results
    });

  } catch (error) {
    console.error('Error fixing duplicate cities:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fix duplicate cities',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 