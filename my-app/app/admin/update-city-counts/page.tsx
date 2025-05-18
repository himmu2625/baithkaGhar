'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export default function UpdateCityCountsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateCityCounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      setResults(null);

      const response = await fetch('/api/update-city-counts');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update city counts');
      }

      setResults(data.results);
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating city counts');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Update City Property Counts</h1>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>City Property Count Utility</CardTitle>
          <CardDescription>
            This utility updates the property counts for all cities based on the actual number of properties in the database.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {results && results.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Results:</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result) => (
                      <tr key={result.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.oldCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.newCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.success ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Updated
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            onClick={updateCityCounts} 
            disabled={isLoading}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update City Counts
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 