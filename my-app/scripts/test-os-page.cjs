const http = require("http")

function testOSPage() {
  console.log("🧪 Testing OS Login Page...")

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/os/login",
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  }

  const req = http.request(options, (res) => {
    console.log(`📱 Status: ${res.statusCode}`)
    console.log(`📱 Headers:`, res.headers)

    let data = ""
    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      console.log(`📱 Response length: ${data.length} characters`)

      // Check for common issues
      if (data.includes("Error")) {
        console.log("❌ ERROR: Found error in response")
        console.log("Error content:", data.substring(0, 500))
      }

      if (data.includes("Baithaka GHAR OS")) {
        console.log("✅ SUCCESS: OS branding found")
      } else {
        console.log("❌ ERROR: OS branding not found")
      }

      if (data.includes("Sign In")) {
        console.log("✅ SUCCESS: Login form found")
      } else {
        console.log("❌ ERROR: Login form not found")
      }

      if (data.includes("Property Management System")) {
        console.log("✅ SUCCESS: Page title found")
      } else {
        console.log("❌ ERROR: Page title not found")
      }

      // Check if page is completely empty
      if (data.trim().length < 100) {
        console.log("❌ ERROR: Page appears to be empty or very short")
        console.log("Page content preview:", data.substring(0, 200))
      }

      console.log("\n🎉 Test completed!")
    })
  })

  req.on("error", (error) => {
    console.error("❌ Test failed:", error.message)
  })

  req.end()
}

testOSPage()












