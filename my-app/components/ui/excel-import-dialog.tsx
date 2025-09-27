'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface ExcelImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  onImportComplete: (result: any) => void;
}

interface ImportResult {
  success: boolean;
  summary?: any;
  importResult?: any;
  previewData?: any[];
  errors?: string[];
}

export default function ExcelImportDialog({
  isOpen,
  onClose,
  propertyId,
  onImportComplete
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel' ||
        selectedFile.name.endsWith('.xlsx') ||
        selectedFile.name.endsWith('.xls')) {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert('Please select a valid Excel file (.xlsx or .xls)');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/pricing/import', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();

        // Create CSV content
        const csvContent = data.template.map((row: string[]) =>
          row.map(cell => `"${cell}"`).join(',')
        ).join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pricing-template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('propertyId', propertyId);
      formData.append('replaceExisting', replaceExisting.toString());

      const response = await fetch('/api/pricing/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        onImportComplete(result);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        errors: ['Failed to import file. Please try again.']
      });
    } finally {
      setImporting(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setImportResult(null);
    setReplaceExisting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Import Pricing Data from Excel</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Need a template?</h4>
                <p className="text-sm text-blue-700">Download our Excel template with sample data and format guidelines.</p>
              </div>
              <Button variant="outline" onClick={downloadTemplate} className="border-blue-300 text-blue-700 hover:bg-blue-100">
                <FileText className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
              ${file ? 'border-green-400 bg-green-50' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {file ? (
              <div className="space-y-2">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <div className="font-medium text-green-900">{file.name}</div>
                <div className="text-sm text-green-700">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="mt-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div className="font-medium text-gray-700">
                  Drop your Excel file here, or click to browse
                </div>
                <div className="text-sm text-gray-500">
                  Supports .xlsx and .xls files
                </div>
              </div>
            )}
          </div>

          {/* Import Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="replace-existing"
                checked={replaceExisting}
                onCheckedChange={(checked) => setReplaceExisting(checked as boolean)}
              />
              <Label htmlFor="replace-existing" className="text-sm">
                Replace existing pricing data
              </Label>
            </div>

            {replaceExisting && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  This will delete all existing pricing data for this property and replace it with the imported data.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing Excel file...</span>
                <span>Please wait</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              {importResult.success ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-800">
                    <div className="font-medium">Import successful!</div>
                    {importResult.summary && (
                      <div className="mt-2 space-y-1 text-sm">
                        <div>Total rows processed: {importResult.summary.totalRows}</div>
                        <div>Valid rows: {importResult.summary.validRows}</div>
                        {importResult.summary.invalidRows > 0 && (
                          <div>Invalid rows: {importResult.summary.invalidRows}</div>
                        )}
                        <div>Properties: {importResult.summary.propertyNames.join(', ')}</div>
                        <div>Room categories: {importResult.summary.roomCategories.join(', ')}</div>
                        <div>Date range: {importResult.summary.dateRange.min} to {importResult.summary.dateRange.max}</div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    <div className="font-medium">Import failed</div>
                    {importResult.errors && (
                      <div className="mt-2 space-y-1 text-sm">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                        {importResult.errors.length > 5 && (
                          <div>... and {importResult.errors.length - 5} more errors</div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Import Summary */}
              {importResult.importResult && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {importResult.importResult.created}
                    </div>
                    <div className="text-sm text-green-700">Created</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {importResult.importResult.updated}
                    </div>
                    <div className="text-sm text-blue-700">Updated</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {importResult.importResult.errors}
                    </div>
                    <div className="text-sm text-red-700">Errors</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      {importResult.importResult.conflicts?.length || 0}
                    </div>
                    <div className="text-sm text-orange-700">Conflicts</div>
                  </div>
                </div>
              )}

              {/* Preview Data */}
              {importResult.previewData && importResult.previewData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Preview of imported data:</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    {importResult.previewData.map((row: any, index: number) => (
                      <div key={index} className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                        <Badge variant="outline">{row.roomCategory}</Badge>
                        <Badge variant="outline">{row.planType}</Badge>
                        <Badge variant="outline">{row.occupancyType}</Badge>
                        <Badge variant="outline">₹{row.price}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {row.startDate} to {row.endDate}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {!importResult?.success && (
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Pricing Data
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}