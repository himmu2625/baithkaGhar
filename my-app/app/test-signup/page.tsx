"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestSignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  const testRegularSignup = async () => {
    setLoading(true)
    setResult("")
    
    try {
      console.log("Testing regular signup...")
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone: "1234567890", password }),
      })
      
      console.log("Response status:", response.status)
      console.log("Content-Type:", response.headers.get("content-type"))
      
      const rawText = await response.text()
      console.log("Raw response:", rawText)
      
      try {
        const data = JSON.parse(rawText)
        setResult("REGULAR API: " + JSON.stringify(data, null, 2))
      } catch (e) {
        setResult("REGULAR API - Failed to parse JSON: " + rawText)
      }
    } catch (error) {
      console.error("Regular signup failed:", error)
      setResult(`REGULAR API - Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const testSimpleSignup = async () => {
    setLoading(true)
    setResult("")
    
    try {
      console.log("Testing simplified signup...")
      
      const response = await fetch("/api/auth/register-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })
      
      console.log("Response status:", response.status)
      console.log("Content-Type:", response.headers.get("content-type"))
      
      const rawText = await response.text()
      console.log("Raw response:", rawText)
      
      try {
        const data = JSON.parse(rawText)
        setResult("SIMPLE API: " + JSON.stringify(data, null, 2))
      } catch (e) {
        setResult("SIMPLE API - Failed to parse JSON: " + rawText)
      }
    } catch (error) {
      console.error("Simple signup failed:", error)
      setResult(`SIMPLE API - Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Signup Page</h1>
      
      <div className="max-w-md space-y-4 mb-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Your name"
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Your email"
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Your password"
          />
        </div>
      </div>
      
      <div className="space-x-4 mb-6">
        <Button onClick={testRegularSignup} disabled={loading || !name || !email || !password}>
          Test Regular Signup
        </Button>
        
        <Button onClick={testSimpleSignup} disabled={loading || !name || !email || !password}>
          Test Simple Signup
        </Button>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Result:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {loading ? "Loading..." : result || "No result yet"}
        </pre>
      </div>
    </div>
  )
} 