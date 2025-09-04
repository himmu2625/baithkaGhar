'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, FileSpreadsheet, FileType, Settings, Info } from 'lucide-react'
import { exportData, SupportedFileType } from '@/lib/utils/fileProcessor'

interface ExportField {
  key: string
  label: string
  required?: boolean
  description?: string
}

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  data: any[]
  availableFields: ExportField[]
  defaultFilename: string
  onExportComplete?: () => void
}

export function ExportDialog({
  open,
  onOpenChange,
  title,
  description,
  data,
  availableFields,
  defaultFilename,
  onExportComplete
}: ExportDialogProps) {
  const [filename, setFilename] = useState(defaultFilename)
  const [format, setFormat] = useState<SupportedFileType>('xlsx')
  const [selectedFields, setSelectedFields] = useState<string[]>(
    availableFields.filter(field => field.required !== false).map(field => field.key)
  )
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [customSheetName, setCustomSheetName] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    const field = availableFields.find(f => f.key === fieldKey)
    if (field?.required && !checked) return // Don't allow unchecking required fields

    if (checked) {
      setSelectedFields(prev => [...prev, fieldKey])
    } else {
      setSelectedFields(prev => prev.filter(key => key !== fieldKey))
    }
  }

  const handleSelectAll = () => {
    setSelectedFields(availableFields.map(field => field.key))
  }

  const handleSelectNone = () => {
    setSelectedFields(availableFields.filter(field => field.required).map(field => field.key))
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      alert('Please select at least one field to export')
      return
    }

    setExporting(true)
    try {
      // Filter data to include only selected fields
      const filteredData = data.map(item => {
        const filtered: any = {}
        selectedFields.forEach(fieldKey => {
          const field = availableFields.find(f => f.key === fieldKey)
          if (field) {
            filtered[field.label] = item[fieldKey] || ''
          }
        })
        return filtered
      })

      const exportOptions = {
        filename: filename || defaultFilename,
        format,
        sheetName: customSheetName || title.replace(/\s+/g, ''),
        headers: selectedFields.map(key => availableFields.find(f => f.key === key)?.label || key),
        includeMetadata
      }

      exportData(filteredData, exportOptions)
      
      setTimeout(() => {
        setExporting(false)
        onExportComplete?.()
        onOpenChange(false)
      }, 1000)
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setExporting(false)
    }
  }

  const getFormatIcon = (fmt: SupportedFileType) => {
    switch (fmt) {
      case 'xlsx':
      case 'xls':
        return FileSpreadsheet
      case 'csv':
        return FileText
      case 'json':
        return FileType
      default:
        return FileText
    }
  }

  const getFormatDescription = (fmt: SupportedFileType) => {
    switch (fmt) {
      case 'xlsx':
        return 'Excel format with multiple sheets support'
      case 'xls':
        return 'Legacy Excel format'
      case 'csv':
        return 'Comma-separated values, compatible with all spreadsheet apps'
      case 'json':
        return 'JSON format for programmatic use'
      default:
        return ''
    }
  }

  const resetDialog = () => {
    setFilename(defaultFilename)
    setFormat('xlsx')
    setSelectedFields(availableFields.filter(field => field.required !== false).map(field => field.key))
    setIncludeMetadata(true)
    setCustomSheetName('')
    setExporting(false)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen)
      if (!newOpen) resetDialog()
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Ready to export</p>
              <p className="text-sm text-muted-foreground">
                {data.length} record{data.length !== 1 ? 's' : ''} with {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {data.length}
            </Badge>
          </div>

          {/* File Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h3 className="font-medium">Export Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Enter filename"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={(value: SupportedFileType) => setFormat(value)}>
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['xlsx', 'csv', 'json'] as SupportedFileType[]).map(fmt => {
                      const Icon = getFormatIcon(fmt)
                      return (
                        <SelectItem key={fmt} value={fmt}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {fmt.toUpperCase()}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getFormatDescription(format)}
                </p>
              </div>
            </div>

            {format === 'xlsx' && (
              <div className="space-y-2">
                <Label htmlFor="sheetName">Sheet Name (Optional)</Label>
                <Input
                  id="sheetName"
                  value={customSheetName}
                  onChange={(e) => setCustomSheetName(e.target.value)}
                  placeholder="Leave blank for default"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              />
              <Label htmlFor="metadata" className="text-sm">
                Include export metadata (date, record count, etc.)
              </Label>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Select Fields to Export</h3>
              <div className="flex gap-2">
                <Button onClick={handleSelectAll} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={handleSelectNone} variant="outline" size="sm">
                  Select None
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-md p-4">
              {availableFields.map(field => (
                <div key={field.key} className="flex items-start space-x-2 py-2">
                  <Checkbox
                    id={field.key}
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={(checked) => handleFieldToggle(field.key, checked as boolean)}
                    disabled={field.required}
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={field.key} className="text-sm font-medium flex items-center gap-1">
                      {field.label}
                      {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                    </Label>
                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedFields.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please select at least one field to export.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={exporting || selectedFields.length === 0 || data.length === 0}
          >
            {exporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}