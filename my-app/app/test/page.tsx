"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestPage() {
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  const testGet = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test")
      const rawText = await response.text()
      console.log("Raw GET response:", rawText)
      
      try {
        const data = JSON.parse(rawText)
        setResult(JSON.stringify(data, null, 2))
      } catch (e) {
        setResult("Failed to parse JSON: " + rawText)
      }
    } catch (error) {
      console.error("Test GET failed:", error)
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const testPost = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ test: "data" }),
      })
      
      const rawText = await response.text()
      console.log("Raw POST response:", rawText)
      
      try {
        const data = JSON.parse(rawText)
        setResult(JSON.stringify(data, null, 2))
      } catch (e) {
        setResult("Failed to parse JSON: " + rawText)
      }
    } catch (error) {
      console.error("Test POST failed:", error)
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="space-y-4">
        <div className="space-x-4">
          <Button onClick={testGet} disabled={loading}>
            Test GET Request
          </Button>
          
          <Button onClick={testPost} disabled={loading}>
            Test POST Request
          </Button>
        </div>
        
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {loading ? "Loading..." : result || "No result yet"}
          </pre>
        </div>
      </div>
    </div>
  )
} 