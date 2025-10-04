"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PlanBasedRevenueReport } from "@/components/reports/PlanBasedRevenueReport"
import { CalendarIcon } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"

export default function PlanBasedAnalyticsPage() {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))
  const [showReport, setShowReport] = useState(false)

  const handleQuickSelect = (days: number) => {
    setEndDate(new Date())
    setStartDate(subDays(new Date(), days))
    setShowReport(true)
  }

  const handleGenerateReport = () => {
    setShowReport(true)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Plan-Based Revenue Analytics</h1>
        <p className="text-gray-600">
          Analyze revenue breakdown by meal plans, occupancy types, and room categories
        </p>
      </div>

      {/* Date Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
          <CardDescription>Choose a period to analyze plan-based revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Start Date */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateReport}
              className="bg-green-600 hover:bg-green-700"
            >
              Generate Report
            </Button>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <p className="text-sm text-gray-600 w-full mb-2">Quick select:</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(7)}
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(30)}
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(90)}
            >
              Last 90 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(startOfMonth(new Date()))
                setEndDate(endOfMonth(new Date()))
                setShowReport(true)
              }}
            >
              This Month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {showReport && (
        <PlanBasedRevenueReport
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {!showReport && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No Report Generated</p>
              <p className="text-sm">Select a date range and click "Generate Report" to view analytics</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
