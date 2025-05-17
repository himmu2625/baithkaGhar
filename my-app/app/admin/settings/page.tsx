"use client";

import { useState, useEffect } from "react";
import { Loader2, Settings } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space y-6 mt-12">
      <div className="flex justify-between items-center">
       <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-darkGreen" />
          <span className="ml-2">Loading settings...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center p-10">
            <div className="flex justify-center mb-4">
              <Settings className="h-8 w-8 text-gray-600" />
            </div>
            <h2 className="text-xl font-medium mb-4">Application Settings</h2>
            <p className="text-gray-500">
              System configuration and settings will be available here. This feature is currently under development.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">General Settings</h3>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Email Configuration</h3>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Payment Settings</h3>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Security Settings</h3>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 