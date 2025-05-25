"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestAdminBookingsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testBookingsAPI = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log("🔍 Testing admin bookings API...");
      
      const response = await fetch('/api/admin/bookings');
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        setResult({ error: `HTTP ${response.status}: ${errorText}` });
        return;
      }
      
      const data = await response.json();
      console.log("API response:", data);
      setResult(data);
      
    } catch (error: any) {
      console.error("Test error:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testDirectBookingCount = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log("🔍 Testing direct booking count...");
      
      const response = await fetch('/api/bookings');
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        setResult({ error: `HTTP ${response.status}: ${errorText}` });
        return;
      }
      
      const data = await response.json();
      console.log("Direct bookings API response:", data);
      setResult({ message: "Direct bookings API", data });
      
    } catch (error: any) {
      console.error("Test error:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <h1 className="text-3xl font-bold mb-8">Test Admin Bookings API</h1>
      
      <div className="space-y-4 mb-8">
        <Button 
          onClick={testBookingsAPI}
          disabled={loading}
          className="mr-4"
        >
          {loading ? "Testing..." : "Test Admin Bookings API"}
        </Button>
        
        <Button 
          onClick={testDirectBookingCount}
          disabled={loading}
          variant="outline"
        >
          {loading ? "Testing..." : "Test Direct Bookings API"}
        </Button>
      </div>
      
      {result && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 