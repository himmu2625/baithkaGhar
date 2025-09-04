import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import FBInventory from "@/models/FBInventory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get inventory categories for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Get unique categories from inventory items
    const categoriesFromDB = await FBInventory.aggregate([
      {
        $match: {
          propertyId: new Types.ObjectId(propertyId),
          isActive: true
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          subcategories: { $addToSet: '$subCategory' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    // Transform to expected format and add comprehensive categories
    const standardCategories = [
      {
        id: 'produce',
        name: 'Produce',
        description: 'Fresh vegetables, fruits and produce',
        subcategories: ['Vegetables', 'Fruits', 'Herbs', 'Leafy Greens']
      },
      {
        id: 'meat_poultry',
        name: 'Meat & Poultry',
        description: 'Fresh meat, chicken and poultry',
        subcategories: ['Chicken', 'Mutton', 'Beef', 'Pork', 'Game']
      },
      {
        id: 'seafood',
        name: 'Seafood',
        description: 'Fresh and frozen seafood',
        subcategories: ['Fish', 'Prawns', 'Crab', 'Lobster', 'Shellfish']
      },
      {
        id: 'dairy',
        name: 'Dairy & Eggs',
        description: 'Milk, cheese, eggs and dairy products',
        subcategories: ['Milk Products', 'Cheese', 'Eggs', 'Butter', 'Yogurt']
      },
      {
        id: 'dry_goods',
        name: 'Dry Goods',
        description: 'Rice, grains, pulses and cereals',
        subcategories: ['Rice', 'Wheat', 'Lentils', 'Cereals', 'Flour']
      },
      {
        id: 'spices_condiments',
        name: 'Spices & Condiments',
        description: 'Spices, herbs and condiments',
        subcategories: ['Whole Spices', 'Ground Spices', 'Herbs', 'Sauces', 'Condiments']
      },
      {
        id: 'beverages',
        name: 'Beverages',
        description: 'Juices, soft drinks and other beverages',
        subcategories: ['Soft Drinks', 'Juices', 'Water', 'Hot Beverages', 'Energy Drinks']
      },
      {
        id: 'alcohol',
        name: 'Alcohol',
        description: 'Wine, beer, spirits and cocktail ingredients',
        subcategories: ['Wine', 'Beer', 'Spirits', 'Cocktail Mix', 'Liqueurs']
      },
      {
        id: 'frozen',
        name: 'Frozen Items',
        description: 'Frozen foods and ice cream',
        subcategories: ['Frozen Vegetables', 'Frozen Meat', 'Ice Cream', 'Frozen Snacks']
      },
      {
        id: 'bakery',
        name: 'Bakery',
        description: 'Bread, pastries and baking ingredients',
        subcategories: ['Bread', 'Pastries', 'Baking Flour', 'Yeast', 'Baking Supplies']
      },
      {
        id: 'cleaning_supplies',
        name: 'Cleaning Supplies',
        description: 'Kitchen and restaurant cleaning supplies',
        subcategories: ['Detergents', 'Sanitizers', 'Dish Soap', 'Floor Cleaners']
      },
      {
        id: 'disposables',
        name: 'Disposables',
        description: 'Disposable plates, cups and packaging',
        subcategories: ['Plates', 'Cups', 'Takeaway Boxes', 'Napkins', 'Straws']
      }
    ]

    // Merge with database categories
    const categories = standardCategories.map(stdCat => {
      const dbCat = categoriesFromDB.find(cat => cat._id === stdCat.id)
      return {
        ...stdCat,
        count: dbCat?.count || 0,
        subcategories: dbCat?.subcategories?.filter(Boolean) || stdCat.subcategories
      }
    })

    // Add any additional categories found in database that aren't in standard list
    categoriesFromDB.forEach(dbCat => {
      if (dbCat._id && !standardCategories.some(std => std.id === dbCat._id)) {
        categories.push({
          id: dbCat._id,
          name: dbCat._id.charAt(0).toUpperCase() + dbCat._id.slice(1).replace(/_/g, ' '),
          description: `${dbCat._id} items`,
          subcategories: dbCat.subcategories?.filter(Boolean) || [],
          count: dbCat.count || 0
        })
      }
    })

    return NextResponse.json({
      success: true,
      categories: categories.filter(cat => cat.count > 0 || standardCategories.some(std => std.id === cat.id))
    })

  } catch (error) {
    console.error('Error fetching inventory categories:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch inventory categories" },
      { status: 500 }
    )
  }
})