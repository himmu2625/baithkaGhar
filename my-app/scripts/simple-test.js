const http = require("http")

function testOSLoginPage() {
  console.log("🧪 Testing OS Login Page...")

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/os/login",
    method: "GET",
  }

  const req = http.request(options, (res) => {
    console.log(`📱 Status: ${res.statusCode}`)

    if (res.statusCode === 200) {
      console.log("✅ SUCCESS: OS login page is accessible")
    } else {
      console.log("❌ ERROR: OS login page returned status", res.statusCode)
    }

    let data = ""
    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      // Check if the page contains OS branding
      if (data.includes("Baithaka GHAR OS")) {
        console.log("✅ SUCCESS: OS branding found on page")
      } else {
        console.log("❌ ERROR: OS branding not found")
      }

      // Check if login form is present
      if (data.includes("Sign In") || data.includes("login")) {
        console.log("✅ SUCCESS: Login form found on page")
      } else {
        console.log("❌ ERROR: Login form not found")
      }

      console.log("\n🎉 Simple test completed!")
    })
  })

  req.on("error", (error) => {
    console.error("❌ Test failed:", error.message)
  })

  req.end()
}

testOSLoginPage()













