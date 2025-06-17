"use client"

import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-base font-semibold text-gray-800",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-white border-gray-200 hover:bg-lightGreen hover:text-white hover:border-lightGreen p-0 transition-all duration-200 text-gray-700",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-gray-600 font-medium rounded-md w-9 font-normal text-[0.8rem] text-center",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }), 
          "h-9 w-9 p-0 font-medium text-gray-800 hover:text-darkGreen hover:bg-lightGreen/20 hover:scale-105 aria-selected:opacity-100 transition-all duration-200 rounded-lg"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-darkGreen text-white hover:bg-darkGreen hover:text-white focus:bg-darkGreen focus:text-white font-semibold shadow-md",
        day_today: "bg-lightYellow/30 text-darkGreen font-semibold border-2 border-lightYellow",
        day_outside:
          "day-outside text-gray-300 opacity-50 aria-selected:bg-accent/50 aria-selected:text-gray-300 aria-selected:opacity-30",
        day_disabled: "text-gray-300 opacity-40 cursor-not-allowed",
        day_range_middle: "aria-selected:bg-lightGreen/20 aria-selected:text-darkGreen hover:aria-selected:bg-lightGreen/30",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
