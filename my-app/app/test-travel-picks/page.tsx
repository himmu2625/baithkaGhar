"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestTravelPicksPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [propertiesDebug, setPropertiesDebug] = useState<any>(null);
  const [forceUpdateResult, setForceUpdateResult] = useState<any>(null);
  const [fixResult, setFixResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDebugEndpoint = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/travel-picks/debug');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Debug endpoint error:', error);
      setDebugInfo({ error: 'Failed to fetch debug info' });
    } finally {
      setLoading(false);
    }
  };

  const testPropertiesDebug = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug-properties');
      const data = await response.json();
      setPropertiesDebug(data);
    } catch (error) {
      console.error('Properties debug error:', error);
      setPropertiesDebug({ error: 'Failed to fetch properties debug' });
    } finally {
      setLoading(false);
    }
  };

  const testForceUpdate = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/travel-picks/force-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      setForceUpdateResult(data);
    } catch (error) {
      console.error('Force update error:', error);
      setForceUpdateResult({ error: 'Failed to force update' });
    } finally {
      setLoading(false);
    }
  };

  const testFixTravelPicks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fix-travel-picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      setFixResult(data);
    } catch (error) {
      console.error('Fix travel picks error:', error);
      setFixResult({ error: 'Failed to fix travel picks' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Travel Picks Test Page</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button onClick={testPropertiesDebug} disabled={loading}>
          1. Check All Properties
        </Button>
        <Button onClick={testDebugEndpoint} disabled={loading}>
          2. Check Travel Picks
        </Button>
        <Button onClick={testFixTravelPicks} disabled={loading} className="bg-red-600 hover:bg-red-700">
          3. FIX EVERYTHING
        </Button>
        <Button onClick={testForceUpdate} disabled={loading}>
          4. Test Force Update
        </Button>
      </div>

      {propertiesDebug && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Properties Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto bg-gray-100 p-4 rounded max-h-96">
              {JSON.stringify(propertiesDebug, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {debugInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Travel Picks Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto bg-gray-100 p-4 rounded max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {fixResult && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fix Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto bg-gray-100 p-4 rounded max-h-96">
              {JSON.stringify(fixResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {forceUpdateResult && (
        <Card>
          <CardHeader>
            <CardTitle>Force Update Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto bg-gray-100 p-4 rounded max-h-96">
              {JSON.stringify(forceUpdateResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 