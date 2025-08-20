const http = require("http")

const req = http.request(
  {
    hostname: "localhost",
    port: 3000,
    path: "/os/login/simple-page",
    method: "GET",
  },
  (res) => {
    console.log(`Status: ${res.statusCode}`)

    let data = ""
    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      console.log(`Content length: ${data.length}`)

      // Look for specific content
      const checks = [
        { name: "Baithaka GHAR OS", found: data.includes("Baithaka GHAR OS") },
        { name: "Sign In", found: data.includes("Sign In") },
        {
          name: "Property Management System",
          found: data.includes("Property Management System"),
        },
        { name: "form", found: data.includes("<form") },
        { name: "input", found: data.includes("<input") },
        { name: "button", found: data.includes("<button") },
        { name: "Username", found: data.includes("Username") },
        { name: "Password", found: data.includes("Password") },
      ]

      checks.forEach((check) => {
        console.log(`${check.found ? "✅" : "❌"} ${check.name}`)
      })

      console.log("\nTest completed!")
    })
  }
)

req.on("error", (error) => {
  console.error("Error:", error.message)
})

req.end()














