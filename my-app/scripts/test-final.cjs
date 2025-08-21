const http = require("http")

const req = http.request(
  {
    hostname: "localhost",
    port: 3000,
    path: "/os/login",
    method: "GET",
  },
  (res) => {
    console.log(`📱 Status: ${res.statusCode}`)

    let data = ""
    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      console.log(`📱 Content length: ${data.length} characters`)

      // Check for all expected content
      const checks = [
        { name: "Baithaka GHAR OS", found: data.includes("Baithaka GHAR OS") },
        {
          name: "Property Management System",
          found: data.includes("Property Management System"),
        },
        { name: "Sign In", found: data.includes("Sign In") },
        { name: "Username", found: data.includes("Username") },
        { name: "Password", found: data.includes("Password") },
        { name: "Remember me", found: data.includes("Remember me") },
        { name: "Security Notice", found: data.includes("Security Notice") },
        {
          name: "Forgot your password",
          found: data.includes("Forgot your password"),
        },
        { name: "Building emoji", found: data.includes("🏢") },
        { name: "Lock emoji", found: data.includes("🔒") },
        { name: "form tag", found: data.includes("<form") },
        { name: "input tags", found: data.includes("<input") },
        { name: "button tags", found: data.includes("<button") },
      ]

      console.log("\n🔍 Content Check Results:")
      checks.forEach((check) => {
        console.log(`${check.found ? "✅" : "❌"} ${check.name}`)
      })

      // Count successful checks
      const successCount = checks.filter((check) => check.found).length
      const totalCount = checks.length

      console.log(`\n📊 Summary: ${successCount}/${totalCount} checks passed`)

      if (successCount === totalCount) {
        console.log("🎉 SUCCESS: OS Login page is working perfectly!")
      } else {
        console.log("⚠️  WARNING: Some content may be missing")
      }

      console.log("\n🌐 You can now visit: http://localhost:3000/os/login")
    })
  }
)

req.on("error", (error) => {
  console.error("❌ Error:", error.message)
})

req.end()




















