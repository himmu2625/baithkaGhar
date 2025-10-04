"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText, FileJson } from "lucide-react"
import { exportToCSV } from "@/lib/utils/export/csv-exporter"
import { exportToPDF } from "@/lib/utils/export/pdf-exporter"
import { exportToJSON } from "@/lib/utils/export/json-exporter"
import { useState } from "react"

interface ExportButtonProps {
  data: any[]
  filename: string
  title?: string
  disabled?: boolean
}

export function ExportButton({ data, filename, title, disabled = false }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportCSV = () => {
    try {
      setIsExporting(true)
      exportToCSV(data, filename)
    } catch (error) {
      console.error('Export to CSV failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = () => {
    try {
      setIsExporting(true)
      exportToPDF(data, title || filename, filename)
    } catch (error) {
      console.error('Export to PDF failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJSON = () => {
    try {
      setIsExporting(true)
      exportToJSON(data, filename)
    } catch (error) {
      console.error('Export to JSON failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting || data.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
