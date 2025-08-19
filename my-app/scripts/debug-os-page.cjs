const http = require("http")

const req = http.request(
  {
    hostname: "localhost",
    port: 3000,
    path: "/os/login",
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
        { name: "Card", found: data.includes("Card") },
        { name: "useOSAuth", found: data.includes("useOSAuth") },
        { name: "Building2", found: data.includes("Building2") },
        { name: "Shield", found: data.includes("Shield") },
      ]

      checks.forEach((check) => {
        console.log(`${check.found ? "✅" : "❌"} ${check.name}`)
      })

      // Show a snippet of the content around the form area
      const formIndex = data.indexOf("<form")
      if (formIndex !== -1) {
        console.log("\nForm snippet:")
        console.log(data.substring(formIndex, formIndex + 200))
      } else {
        console.log("\nNo form found in HTML")
      }

      console.log("\nTest completed!")
    })
  }
)

req.on("error", (error) => {
  console.error("Error:", error.message)
})

req.end()













