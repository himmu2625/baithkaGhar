"use client"

import React from "react"
import { useOSAuth } from "@/hooks/use-os-auth"

export default function DebugPage() {
  const { user, isAuthenticated, isLoading } = useOSAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OS Debug Information</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Authentication Status</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
            </div>
            <div>
              <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
            </div>
          </div>

          {user && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">User Information</h3>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Local Storage</h3>
            <div className="bg-gray-50 p-4 rounded">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>os-logged-in:</strong>{" "}
                  {localStorage.getItem("os-logged-in") || "null"}
                </div>
                <div>
                  <strong>os-username:</strong>{" "}
                  {localStorage.getItem("os-username") || "null"}
                </div>
                <div>
                  <strong>os-property-id:</strong>{" "}
                  {localStorage.getItem("os-property-id") || "null"}
                </div>
                <div>
                  <strong>os-property-name:</strong>{" "}
                  {localStorage.getItem("os-property-name") || "null"}
                </div>
                <div>
                  <strong>os-login-time:</strong>{" "}
                  {localStorage.getItem("os-login-time") || "null"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-x-4">
              <button
                onClick={() => (window.location.href = "/os/login")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Login
              </button>
              <button
                onClick={() => localStorage.clear()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Local Storage
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



















