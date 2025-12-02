/**
 * Quick test script to verify review API is working
 * Usage: node scripts/test-review-api.cjs [propertyId]
 */

const propertyId = process.argv[2] || '68c2e6093d28e0dc2432d886'; // Default to the property with reviews

console.log('🧪 Testing Review API...\n');
console.log(`Property ID: ${propertyId}\n`);

// Test the API endpoint
async function testReviewAPI() {
  try {
    const url = `http://localhost:3001/api/reviews?propertyId=${propertyId}&includeStats=true`;
    console.log(`📡 Calling: ${url}\n`);

    const response = await fetch(url);
    const data = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ API Test PASSED!');
      console.log(`   - Found ${data.reviews?.length || 0} reviews`);
      if (data.statistics) {
        console.log(`   - Average Rating: ${data.statistics.averageRating}`);
        console.log(`   - Total Reviews: ${data.statistics.totalReviews}`);
      }
    } else {
      console.log('\n❌ API Test FAILED!');
      console.log(`   - Error: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n❌ API Test ERROR!');
    console.error('   - Error:', error.message);
    console.log('\n💡 Make sure the dev server is running on port 3001');
    console.log('   Run: npm run dev');
  }
}

testReviewAPI();
