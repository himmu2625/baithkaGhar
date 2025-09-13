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

      if (data.includes("Baithaka GHAR OS")) {
        console.log("✅ OS branding found!")
      } else {
        console.log("❌ OS branding not found")
      }

      if (data.includes("Sign In")) {
        console.log("✅ Login form found!")
      } else {
        console.log("❌ Login form not found")
      }

      if (data.includes("Property Management System")) {
        console.log("✅ Page title found!")
      } else {
        console.log("❌ Page title not found")
      }

      console.log("Test completed!")
    })
  }
)

req.on("error", (error) => {
  console.error("Error:", error.message)
})

req.end()
































