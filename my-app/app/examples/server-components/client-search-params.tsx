'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ClientSearchParamsExample() {
  const searchParams = useSearchParams()
  const query = searchParams?.get('query') || ''
  const [localQuery, setLocalQuery] = useState('')
  
  // Update local state when URL changes
  useEffect(() => {
    setLocalQuery(query)
  }, [query])
  
  // Display the current search params
  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-6">
      <h2 className="text-xl font-semibold mb-2">Client Component: useSearchParams Example</h2>
      
      <div className="mb-4">
        <p><strong>Current query parameter:</strong> {query || 'None'}</p>
      </div>
      
      <form 
        action={`/examples/server-components?query=${encodeURIComponent(localQuery)}`}
        method="GET"
        className="flex gap-2"
      >
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Enter search query"
          className="px-3 py-2 border rounded flex-grow"
        />
        <button 
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Update URL
        </button>
      </form>
      
      <p className="mt-4 text-sm text-gray-600">
        This component demonstrates using useSearchParams in a client component.
        Try adding a query parameter like: <code>?query=test</code> to the URL.
      </p>
    </div>
  )
} 