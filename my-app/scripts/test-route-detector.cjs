const http = require("http")

function testRouteDetector() {
  console.log("🧪 Testing RouteDetector...")

  // Test OS route
  const osOptions = {
    hostname: "localhost",
    port: 3000,
    path: "/os/login",
    method: "GET",
  }

  const osReq = http.request(osOptions, (res) => {
    console.log(`📱 OS Login Status: ${res.statusCode}`)

    let data = ""
    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      // Check if main website header is NOT present
      if (
        data.includes("City, region or hotel") ||
        data.includes("Check-in Add date")
      ) {
        console.log("❌ ERROR: Main website header is still showing on OS page")
      } else {
        console.log("✅ SUCCESS: Main website header is hidden on OS page")
      }

      // Check if OS branding is present
      if (data.includes("Baithaka GHAR OS")) {
        console.log("✅ SUCCESS: OS branding found")
      } else {
        console.log("❌ ERROR: OS branding not found")
      }

      // Test main website route
      testMainWebsite()
    })
  })

  osReq.on("error", (error) => {
    console.error("❌ OS route test failed:", error.message)
  })

  osReq.end()
}

function testMainWebsite() {
  console.log("\n🌐 Testing main website route...")

  const mainOptions = {
    hostname: "localhost",
    port: 3000,
    path: "/",
    method: "GET",
  }

  const mainReq = http.request(mainOptions, (res) => {
    console.log(`📱 Main Website Status: ${res.statusCode}`)

    let data = ""
    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      // Check if main website header IS present
      if (
        data.includes("City, region or hotel") ||
        data.includes("Check-in Add date")
      ) {
        console.log("✅ SUCCESS: Main website header is showing on main page")
      } else {
        console.log("❌ ERROR: Main website header not found on main page")
      }

      console.log("\n🎉 RouteDetector test completed!")
    })
  })

  mainReq.on("error", (error) => {
    console.error("❌ Main website test failed:", error.message)
  })

  mainReq.end()
}

testRouteDetector()













