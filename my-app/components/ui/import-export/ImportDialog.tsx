'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Download, AlertCircle, CheckCircle, FileText, FileSpreadsheet, FileType } from 'lucide-react'
import { processImportFile, generateImportTemplate, ImportResult, SupportedFileType } from '@/lib/utils/fileProcessor'
import { getValidator, getTransformer } from '@/lib/utils/importValidators'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  importType: 'menu-items' | 'categories' | 'inventory' | 'staff' | 'customers'
  onImportComplete: (result: ImportResult, transformedData: any[]) => void
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  description,
  importType,
  onImportComplete
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    const validExtensions = ['xlsx', 'xls', 'csv', 'json']
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      alert('Please select a valid file (Excel, CSV, or JSON)')
      return
    }

    setFile(selectedFile)
    setImportResult(null)
    setActiveTab('preview')
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    try {
      const validator = getValidator(importType)
      const result = await processImportFile(file, validator)
      
      setImportResult(result)
      
      if (result.success && result.data.length > 0) {
        const transformer = getTransformer(importType)
        const transformedData = result.data.map(transformer)
        onImportComplete(result, transformedData)
        setActiveTab('results')
      } else {
        setActiveTab('results')
      }
    } catch (error) {
      setImportResult({
        success: false,
        data: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: [],
        summary: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          processedAt: new Date().toISOString()
        }
      })
      setActiveTab('results')
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = (format: SupportedFileType) => {
    generateImportTemplate(importType, format)
  }

  const resetDialog = () => {
    setFile(null)
    setImportResult(null)
    setActiveTab('upload')
  }

  const getSupportedFormats = () => [
    { name: 'Excel', extension: 'xlsx', icon: FileSpreadsheet },
    { name: 'CSV', extension: 'csv', icon: FileText },
    { name: 'JSON', extension: 'json', icon: FileType }
  ]

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen)
      if (!newOpen) resetDialog()
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="preview" disabled={!file}>Preview</TabsTrigger>
            <TabsTrigger value="results" disabled={!importResult}>Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {/* Template Download Section */}
            <div className="space-y-3">
              <h4 className="font-medium">Download Import Template</h4>
              <p className="text-sm text-muted-foreground">
                Download a template file with the correct format and sample data.
              </p>
              <div className="flex gap-2 flex-wrap">
                {getSupportedFormats().map(({ name, extension, icon: Icon }) => (
                  <Button
                    key={extension}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadTemplate(extension as SupportedFileType)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <Download className="h-3 w-3" />
                    {name} Template
                  </Button>
                ))}
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-3">
              <h4 className="font-medium">Upload Import File</h4>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports Excel (.xlsx, .xls), CSV (.csv), and JSON (.json) files
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <FileText className="h-4 w-4" />
                  <span className="flex-1 text-sm">{file.name}</span>
                  <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {file && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">File Selected</h4>
                  <Button onClick={() => setActiveTab('upload')} variant="outline" size="sm">
                    Change File
                  </Button>
                </div>
                
                <div className="p-4 bg-muted rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {file.name}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {(file.size / 1024).toFixed(1)} KB
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {file.type || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Modified:</span> {new Date(file.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ready to import. Click "Start Import" to process your file.
                    The import will validate each row and show you detailed results.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing import...</span>
                </div>
                <Progress value={undefined} className="w-full" />
              </div>
            )}

            {importResult && !importing && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <h4 className="font-medium">
                    Import {importResult.success ? 'Completed' : 'Failed'}
                  </h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-md">
                    <div className="text-lg font-bold">{importResult.summary.totalRows}</div>
                    <div className="text-sm text-muted-foreground">Total Rows</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <div className="text-lg font-bold text-green-700">{importResult.summary.validRows}</div>
                    <div className="text-sm text-green-600">Valid</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-md">
                    <div className="text-lg font-bold text-red-700">{importResult.summary.invalidRows}</div>
                    <div className="text-sm text-red-600">Invalid</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-md">
                    <div className="text-lg font-bold text-yellow-700">{importResult.warnings.length}</div>
                    <div className="text-sm text-yellow-600">Warnings</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-red-700">Errors:</h5>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, index) => (
                        <Alert key={index} className="border-red-200">
                          <AlertDescription className="text-sm text-red-700">
                            {error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-yellow-700">Warnings:</h5>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.warnings.map((warning, index) => (
                        <Alert key={index} className="border-yellow-200">
                          <AlertDescription className="text-sm text-yellow-700">
                            {warning}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          {activeTab === 'preview' && file && !importing && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importing...' : 'Start Import'}
            </Button>
          )}
          {activeTab === 'results' && importResult && importResult.success && (
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}