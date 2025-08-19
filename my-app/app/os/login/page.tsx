"use client"

import { useState, useEffect } from "react"
import { useOSAuth } from "@/hooks/use-os-auth"

export default function OSLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const { login } = useOSAuth()

  // Toggle fullscreen function
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true)
        })
        .catch((err) => {
          console.log("Error attempting to enable fullscreen:", err)
        })
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false)
        })
        .catch((err) => {
          console.log("Error attempting to exit fullscreen:", err)
        })
    }
  }

  // Listen for fullscreen changes (no auto-fullscreen, only manual toggle)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(username, password)
      if (!success) {
        setError("Invalid username or password")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        margin: 0,
        zIndex: 9999999,
        visibility: "visible",
        opacity: 1,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "white",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          padding: "40px",
          position: "relative",
        }}
      >
        {/* Fullscreen Toggle Button */}
        <div style={{ position: "absolute", top: "10px", right: "10px" }}>
          <button
            onClick={toggleFullscreen}
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#3b82f6",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <span>{isFullscreen ? "🗗" : "🔲"}</span>
            {isFullscreen ? "Exit" : "Full"}
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              backgroundColor: "#3b82f6",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "24px",
            }}
          >
            🏢
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1f2937",
              margin: "0 0 8px 0",
            }}
          >
            Baithaka GHAR OS
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              margin: 0,
            }}
          >
            Hotel Management Software
          </p>
        </div>

        {/* Login Form */}
        <form style={{ marginBottom: "20px" }} onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: "10px",
                marginBottom: "15px",
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "14px",
                color: "#6b7280",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  marginRight: "8px",
                  width: "16px",
                  height: "16px",
                }}
              />
              Remember me for 30 days
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: isLoading ? "#93c5fd" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              fontSize: "14px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Forgot your password?
          </button>
        </div>

        {/* Security Notice */}
        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            backgroundColor: "#eff6ff",
            borderRadius: "6px",
            border: "1px solid #dbeafe",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <span style={{ marginRight: "12px", fontSize: "16px" }}>🔒</span>
            <div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#1e40af",
                  margin: "0 0 4px 0",
                }}
              >
                Security Notice
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#1e40af",
                  margin: "0 0 8px 0",
                  lineHeight: "1.4",
                }}
              >
                This system is protected by enterprise-grade security. All login
                attempts are logged and monitored.
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#1e40af",
                  margin: 0,
                  lineHeight: "1.3",
                  opacity: 0.8,
                }}
              >
                💡 The OS dashboard will automatically launch in fullscreen mode
                after login
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
