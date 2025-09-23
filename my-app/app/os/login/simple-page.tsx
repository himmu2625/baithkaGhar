"use client"

import React from "react"

export default function SimpleOSLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <div className="w-8 h-8 text-white">🏢</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Baithaka GHAR OS
          </h1>
          <p className="text-gray-600">Property Management System</p>
        </div>

        {/* Simple Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
            Sign In
          </h2>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-sm text-gray-600"
              >
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Forgot your password?
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0">🔒</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Security Notice</p>
              <p className="text-blue-700">
                This system is protected by enterprise-grade security. All login
                attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




































