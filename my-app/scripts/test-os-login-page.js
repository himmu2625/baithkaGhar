const puppeteer = require("puppeteer")

async function testOSLoginPage() {
  let browser

  try {
    console.log("🚀 Starting browser...")
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
    })

    const page = await browser.newPage()

    console.log("📱 Navigating to OS login page...")
    await page.goto("http://localhost:3000/os/login", {
      waitUntil: "networkidle0",
    })

    // Wait for the page to load
    await page.waitForTimeout(2000)

    // Check if the main website header is present
    const headerExists = await page.$("header")
    if (headerExists) {
      console.log("❌ Main website header is still showing on OS login page")
    } else {
      console.log("✅ Main website header is correctly hidden on OS login page")
    }

    // Check if the OS login form is present
    const loginForm = await page.$("form")
    if (loginForm) {
      console.log("✅ OS login form is present")
    } else {
      console.log("❌ OS login form is missing")
    }

    // Check for the OS branding
    const osBranding = await page.$("h1")
    if (osBranding) {
      const brandingText = await osBranding.evaluate((el) => el.textContent)
      if (brandingText.includes("Baithaka GHAR OS")) {
        console.log("✅ OS branding is correct")
      } else {
        console.log("❌ OS branding is incorrect:", brandingText)
      }
    } else {
      console.log("❌ OS branding is missing")
    }

    // Take a screenshot
    await page.screenshot({
      path: "os-login-test.png",
      fullPage: true,
    })
    console.log("📸 Screenshot saved as os-login-test.png")

    console.log("✅ OS login page test completed successfully!")
  } catch (error) {
    console.error("❌ Error testing OS login page:", error)
  } finally {
    if (browser) {
      await browser.close()
      console.log("🔌 Browser closed")
    }
  }
}

// Run the test
testOSLoginPage()
