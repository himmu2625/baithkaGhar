'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Upload, Download, FileDown, FileUp, ChevronDown } from 'lucide-react'
import { ImportDialog } from './ImportDialog'
import { ExportDialog } from './ExportDialog'
import { ImportResult } from '@/lib/utils/fileProcessor'

interface ExportField {
  key: string
  label: string
  required?: boolean
  description?: string
}

interface ImportExportButtonsProps {
  // Import props
  importTitle?: string
  importDescription?: string
  importType?: 'menu-items' | 'categories' | 'inventory' | 'staff' | 'customers'
  onImportComplete?: (result: ImportResult, transformedData: any[]) => void
  disableImport?: boolean

  // Export props
  exportTitle?: string
  exportDescription?: string
  exportData?: any[]
  exportFields?: ExportField[]
  exportFilename?: string
  onExportComplete?: () => void
  disableExport?: boolean

  // UI props
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  showLabels?: boolean
  splitButtons?: boolean
}

export function ImportExportButtons({
  // Import props
  importTitle = "Import Data",
  importDescription = "Upload a file to import data",
  importType = 'menu-items',
  onImportComplete,
  disableImport = false,

  // Export props
  exportTitle = "Export Data",
  exportDescription = "Download your data in various formats",
  exportData = [],
  exportFields = [],
  exportFilename = "export",
  onExportComplete,
  disableExport = false,

  // UI props
  variant = 'outline',
  size = 'default',
  showLabels = true,
  splitButtons = false
}: ImportExportButtonsProps) {
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  if (splitButtons) {
    return (
      <div className="flex gap-2">
        {!disableImport && (
          <Button
            variant={variant}
            size={size}
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {showLabels && 'Import'}
          </Button>
        )}

        {!disableExport && exportData.length > 0 && (
          <Button
            variant={variant}
            size={size}
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {showLabels && 'Export'}
          </Button>
        )}

        {/* Import Dialog */}
        {!disableImport && onImportComplete && (
          <ImportDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
            title={importTitle}
            description={importDescription}
            importType={importType}
            onImportComplete={onImportComplete}
          />
        )}

        {/* Export Dialog */}
        {!disableExport && exportData.length > 0 && exportFields.length > 0 && (
          <ExportDialog
            open={showExportDialog}
            onOpenChange={setShowExportDialog}
            title={exportTitle}
            description={exportDescription}
            data={exportData}
            availableFields={exportFields}
            defaultFilename={exportFilename}
            onExportComplete={onExportComplete}
          />
        )}
      </div>
    )
  }

  // Combined dropdown button
  const hasImport = !disableImport
  const hasExport = !disableExport && exportData.length > 0
  
  if (!hasImport && !hasExport) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            {showLabels && 'Import/Export'}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasImport && (
            <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </DropdownMenuItem>
          )}
          
          {hasExport && (
            <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </DropdownMenuItem>
          )}
          
          {hasImport && hasExport && <DropdownMenuSeparator />}
          
          <DropdownMenuItem onClick={() => window.open('/api/docs/import-export', '_blank')}>
            <FileDown className="h-4 w-4 mr-2" />
            View Documentation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Dialog */}
      {hasImport && onImportComplete && (
        <ImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          title={importTitle}
          description={importDescription}
          importType={importType}
          onImportComplete={onImportComplete}
        />
      )}

      {/* Export Dialog */}
      {hasExport && exportFields.length > 0 && (
        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          title={exportTitle}
          description={exportDescription}
          data={exportData}
          availableFields={exportFields}
          defaultFilename={exportFilename}
          onExportComplete={onExportComplete}
        />
      )}
    </>
  )
}

// Preset configurations for common use cases
export function MenuImportExportButtons(props: Omit<ImportExportButtonsProps, 'importType'>) {
  const defaultExportFields: ExportField[] = [
    { key: 'name', label: 'Item Name', required: true },
    { key: 'description', label: 'Description' },
    { key: 'categoryName', label: 'Category', required: true },
    { key: 'basePrice', label: 'Base Price', required: true },
    { key: 'costPrice', label: 'Cost Price' },
    { key: 'preparationTime', label: 'Prep Time (min)' },
    { key: 'spicyLevel', label: 'Spicy Level' },
    { key: 'isVegetarian', label: 'Vegetarian' },
    { key: 'isAvailable', label: 'Available' }
  ]

  return (
    <ImportExportButtons
      {...props}
      importType="menu-items"
      importTitle="Import Menu Items"
      importDescription="Upload menu items from Excel, CSV, or JSON file"
      exportTitle="Export Menu Items"
      exportDescription="Download menu items in your preferred format"
      exportFields={props.exportFields || defaultExportFields}
      exportFilename={props.exportFilename || "menu-items"}
    />
  )
}

export function InventoryImportExportButtons(props: Omit<ImportExportButtonsProps, 'importType'>) {
  const defaultExportFields: ExportField[] = [
    { key: 'itemCode', label: 'Item Code', required: true },
    { key: 'itemName', label: 'Item Name', required: true },
    { key: 'category', label: 'Category', required: true },
    { key: 'currentStock', label: 'Current Stock', required: true },
    { key: 'minimumStock', label: 'Minimum Stock' },
    { key: 'maximumStock', label: 'Maximum Stock' },
    { key: 'unitCost', label: 'Unit Cost' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'location', label: 'Location' }
  ]

  return (
    <ImportExportButtons
      {...props}
      importType="inventory"
      importTitle="Import Inventory Items"
      importDescription="Upload inventory items from Excel, CSV, or JSON file"
      exportTitle="Export Inventory"
      exportDescription="Download inventory data in your preferred format"
      exportFields={props.exportFields || defaultExportFields}
      exportFilename={props.exportFilename || "inventory"}
    />
  )
}

export function CategoryImportExportButtons(props: Omit<ImportExportButtonsProps, 'importType'>) {
  const defaultExportFields: ExportField[] = [
    { key: 'name', label: 'Category Name', required: true },
    { key: 'description', label: 'Description' },
    { key: 'displayOrder', label: 'Display Order' },
    { key: 'isActive', label: 'Active' }
  ]

  return (
    <ImportExportButtons
      {...props}
      importType="categories"
      importTitle="Import Categories"
      importDescription="Upload categories from Excel, CSV, or JSON file"
      exportTitle="Export Categories"
      exportDescription="Download categories in your preferred format"
      exportFields={props.exportFields || defaultExportFields}
      exportFilename={props.exportFilename || "categories"}
    />
  )
}

export function StaffImportExportButtons(props: Omit<ImportExportButtonsProps, 'importType'>) {
  const defaultExportFields: ExportField[] = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'role', label: 'Role', required: true },
    { key: 'department', label: 'Department' },
    { key: 'salary', label: 'Salary' },
    { key: 'joinDate', label: 'Join Date' },
    { key: 'isActive', label: 'Active' }
  ]

  return (
    <ImportExportButtons
      {...props}
      importType="staff"
      importTitle="Import Staff"
      importDescription="Upload staff members from Excel, CSV, or JSON file"
      exportTitle="Export Staff"
      exportDescription="Download staff data in your preferred format"
      exportFields={props.exportFields || defaultExportFields}
      exportFilename={props.exportFilename || "staff"}
    />
  )
}

export function CustomerImportExportButtons(props: Omit<ImportExportButtonsProps, 'importType'>) {
  const defaultExportFields: ExportField[] = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'membershipLevel', label: 'Membership' },
    { key: 'joinDate', label: 'Join Date' },
    { key: 'isActive', label: 'Active' }
  ]

  return (
    <ImportExportButtons
      {...props}
      importType="customers"
      importTitle="Import Customers"
      importDescription="Upload customers from Excel, CSV, or JSON file"
      exportTitle="Export Customers"
      exportDescription="Download customer data in your preferred format"
      exportFields={props.exportFields || defaultExportFields}
      exportFilename={props.exportFilename || "customers"}
    />
  )
}