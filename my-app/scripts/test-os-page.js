const puppeteer = require("puppeteer")

async function testOSLoginPage() {
  console.log("🧪 Testing OS Login Page...")

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
  })

  try {
    const page = await browser.newPage()

    // Navigate to OS login page
    console.log("📱 Navigating to OS login page...")
    await page.goto("http://localhost:3000/os/login", {
      waitUntil: "networkidle2",
      timeout: 10000,
    })

    // Wait for the page to load
    await page.waitForSelector("h1", { timeout: 5000 })

    // Check if the main website header is NOT present
    const mainHeader = await page.$("header")
    if (mainHeader) {
      console.log("❌ ERROR: Main website header is still showing on OS page")
    } else {
      console.log("✅ SUCCESS: Main website header is hidden on OS page")
    }

    // Check if OS branding is present
    const osTitle = await page.$eval("h1", (el) => el.textContent)
    if (osTitle.includes("Baithaka GHAR OS")) {
      console.log("✅ SUCCESS: OS branding is displayed correctly")
    } else {
      console.log("❌ ERROR: OS branding not found")
    }

    // Check if login form is present
    const loginForm = await page.$("form")
    if (loginForm) {
      console.log("✅ SUCCESS: Login form is present")
    } else {
      console.log("❌ ERROR: Login form not found")
    }

    // Take a screenshot
    await page.screenshot({
      path: "os-login-test.png",
      fullPage: true,
    })
    console.log("📸 Screenshot saved as os-login-test.png")

    // Test debug page
    console.log("\n🔍 Testing debug page...")
    await page.goto("http://localhost:3000/os/debug", {
      waitUntil: "networkidle2",
      timeout: 10000,
    })

    await page.waitForSelector("h1", { timeout: 5000 })
    const debugTitle = await page.$eval("h1", (el) => el.textContent)
    if (debugTitle.includes("Debug")) {
      console.log("✅ SUCCESS: Debug page is working")
    } else {
      console.log("❌ ERROR: Debug page not loading correctly")
    }

    console.log("\n🎉 OS Login Page Test Completed!")
  } catch (error) {
    console.error("❌ Test failed:", error.message)
  } finally {
    await browser.close()
  }
}

testOSLoginPage()












