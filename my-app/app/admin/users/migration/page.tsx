"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Users, RefreshCw, Check, AlertTriangle, Info, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function UserMigration() {
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportedData, setExportedData] = useState<any>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [importJson, setImportJson] = useState("");
  const [activeTab, setActiveTab] = useState("export");
  const [error, setError] = useState<string | null>(null);

  // Export users from the current database
  const handleExport = async () => {
    setExportLoading(true);
    setError(null);
    try {
      console.log('Starting export request');
      const response = await fetch('/api/admin/users/export');
      console.log('Export response status:', response.status);
      const data = await response.json();
      console.log('Export response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to export users');
      }

      setExportedData(data);
      toast({
        title: "Users Exported",
        description: `Successfully exported ${data.count} users.`,
      });
    } catch (error: any) {
      console.error('Error exporting users:', error);
      setError(error.message || "Failed to export users");
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export users.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Import users to the database
  const handleImport = async () => {
    setImportLoading(true);
    setError(null);
    try {
      // Validate JSON
      let userData;
      try {
        userData = JSON.parse(importJson);
      } catch (e) {
        throw new Error("Invalid JSON format");
      }

      if (!userData.users || !Array.isArray(userData.users)) {
        throw new Error("Data must contain a 'users' array");
      }

      console.log('Starting import request with', userData.users.length, 'users');
      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          users: userData.users,
          exportToken: userData.exportToken || 'local-import',
        }),
      });

      console.log('Import response status:', response.status);
      const result = await response.json();
      console.log('Import response data:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to import users');
      }

      setImportResults(result);
      toast({
        title: "Users Imported",
        description: result.message,
      });
      
      // Switch to results tab
      setActiveTab("results");
    } catch (error: any) {
      console.error('Error importing users:', error);
      setError(error.message || "Failed to import users");
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import users.",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Download exported data as JSON file
  const downloadJson = () => {
    if (!exportedData) return;
    
    const dataStr = JSON.stringify(exportedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.href = url;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center">
          <Users className="mr-2 h-6 w-6" />
          User Migration
        </h1>
      </div>

      <Tabs defaultValue="export" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="export">Export Users</TabsTrigger>
          <TabsTrigger value="import">Import Users</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export User Data</CardTitle>
              <CardDescription>
                Export all users from the database for migration to another environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  This will export all user data from the current database. 
                  Passwords will not be included for security reasons.
                </AlertDescription>
              </Alert>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleExport} 
                  disabled={exportLoading}
                  className="bg-darkGreen hover:bg-darkGreen/90"
                >
                  {exportLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Users
                    </>
                  )}
                </Button>
                
                {exportedData && (
                  <Button onClick={downloadJson} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download JSON
                  </Button>
                )}
              </div>
              
              {exportedData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Export Summary</h3>
                    <Badge variant="outline">{exportedData.count} users</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Exported at: {new Date(exportedData.exportedAt).toLocaleString()}
                  </p>
                  
                  <div className="mt-4 max-h-60 overflow-y-auto border rounded-md p-2">
                    <pre className="text-xs">{JSON.stringify(exportedData.users?.slice(0, 2), null, 2)}</pre>
                    {exportedData.users?.length > 2 && <p className="text-xs text-center text-gray-500 mt-2">...and {exportedData.users.length - 2} more users</p>}
                  </div>
                </div>
              )}
              
              {!exportedData && !exportLoading && !error && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md text-center">
                  <p className="text-gray-500">No users have been exported yet. Click "Export Users" to begin.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import User Data</CardTitle>
              <CardDescription>
                Import users from JSON data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This will import users from the provided JSON data. 
                  Existing users will be updated if their email matches.
                </AlertDescription>
              </Alert>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Paste JSON Data</label>
                <Textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='{"users": [...], "exportToken": "..."}'
                  className="h-64 font-mono text-sm"
                />
              </div>
              
              <Button 
                onClick={handleImport} 
                disabled={importLoading || !importJson.trim()}
                className="bg-darkGreen hover:bg-darkGreen/90"
              >
                {importLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
              <CardDescription>
                Results of the latest import operation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importResults ? (
                <div className="space-y-4">
                  <Alert variant={importResults.success ? "default" : "destructive"}>
                    {importResults.success ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <AlertTitle>{importResults.success ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{importResults.message}</AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold">{importResults.results?.total || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md">
                      <p className="text-sm text-green-600">Imported</p>
                      <p className="text-2xl font-bold text-green-700">{importResults.results?.imported || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <p className="text-sm text-yellow-600">Skipped</p>
                      <p className="text-2xl font-bold text-yellow-700">{importResults.results?.skipped || 0}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-md">
                      <p className="text-sm text-red-600">Errors</p>
                      <p className="text-2xl font-bold text-red-700">{importResults.results?.errors || 0}</p>
                    </div>
                  </div>
                  
                  {importResults.results?.details?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Details</h3>
                      <div className="max-h-64 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        <ul className="text-xs space-y-1">
                          {importResults.results.details.map((detail: string, index: number) => (
                            <li key={index} className={
                              detail.includes("Error") 
                                ? "text-red-600" 
                                : detail.includes("Skipped") 
                                  ? "text-yellow-600" 
                                  : "text-green-600"
                            }>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No import has been performed yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 