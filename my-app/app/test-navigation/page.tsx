"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TestNavigationPage() {
  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Navigation Test</h1>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Stay Types Links:</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <Link href="/stay-types/corporate-stay">
              <Button className="w-full">Corporate Stay</Button>
            </Link>
            
            <Link href="/stay-types/family-stay">
              <Button className="w-full">Family Stay</Button>
            </Link>
            
            <Link href="/stay-types/couple-stay">
              <Button className="w-full">Couple Stay</Button>
            </Link>
            
            <Link href="/stay-types/banquet-events">
              <Button className="w-full">Banquet & Events</Button>
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Test API Endpoints:</h2>
            <Button 
              onClick={() => {
                fetch('/api/properties/by-stay-type?stayType=corporate-stay')
                  .then(res => res.json())
                  .then(data => {
                    console.log('API Response:', data)
                    alert(`API Test: ${data.success ? 'Success' : 'Failed'} - Found ${data.properties?.length || 0} properties`)
                  })
                  .catch(err => {
                    console.error('API Error:', err)
                    alert('API Test Failed: ' + err.message)
                  })
              }}
              variant="outline"
            >
              Test Corporate Stay API
            </Button>
          </div>

          <div className="mt-8">
            <Link href="/">
              <Button variant="secondary">← Back to Homepage</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
} 