const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

// Import models
const PropertyLogin = require("../models/PropertyLogin")
const Property = require("../models/Property")

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/baithakaghar"

async function testOSLogin() {
  try {
    console.log("🔗 Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    // Find a property to create credentials for
    const property = await Property.findOne({ verificationStatus: "approved" })

    if (!property) {
      console.log(
        "❌ No approved properties found. Please create a property first."
      )
      return
    }

    console.log(
      `📋 Found property: ${property.name || property.title} (ID: ${
        property._id
      })`
    )

    // Check if property already has credentials
    const existingLogin = await PropertyLogin.findOne({
      propertyId: property._id,
    })

    if (existingLogin) {
      console.log(
        `✅ Property already has credentials: ${existingLogin.username}`
      )
      console.log("🔐 Testing login...")

      // Test password verification
      const testPassword = "testpassword123"
      const isValid = await existingLogin.comparePassword(testPassword)

      if (isValid) {
        console.log("✅ Password verification works correctly")
      } else {
        console.log("❌ Password verification failed")
      }

      return
    }

    // Create test credentials
    const username = `test_${property._id.toString().slice(-6)}`
    const password = "testpassword123"
    const passwordHash = await bcrypt.hash(password, 12)

    const newPropertyLogin = new PropertyLogin({
      propertyId: property._id,
      username,
      passwordHash,
      isActive: true,
    })

    await newPropertyLogin.save()
    console.log(
      `✅ Created test credentials for property: ${
        property.name || property.title
      }`
    )
    console.log(`👤 Username: ${username}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`🏢 Property ID: ${property._id}`)

    // Test the credentials
    console.log("🔐 Testing login...")
    const testLogin = await PropertyLogin.findOne({ username })
    const isValid = await testLogin.comparePassword(password)

    if (isValid) {
      console.log("✅ Login test successful!")
    } else {
      console.log("❌ Login test failed")
    }
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await mongoose.disconnect()
    console.log("🔌 Disconnected from MongoDB")
  }
}

// Run the test
testOSLogin()
