const { spawn } = require("child_process")
const net = require("net")

function findAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer()

    server.listen(startPort, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(findAvailablePort(startPort + 1))
      } else {
        reject(err)
      }
    })
  })
}

async function startDevServer() {
  try {
    const port = await findAvailablePort(3000)
    console.log(`🚀 Starting development server on port ${port}...`)

    const child = spawn("npm", ["run", "dev"], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: { ...process.env, PORT: port.toString() },
    })

    child.on("error", (error) => {
      console.error("❌ Failed to start development server:", error)
    })

    child.on("exit", (code) => {
      if (code !== 0) {
        console.error(`❌ Development server exited with code ${code}`)
      }
    })
  } catch (error) {
    console.error("❌ Error starting development server:", error)
  }
}

startDevServer()
