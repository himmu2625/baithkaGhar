"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-lightYellow/10 dark:bg-lightGreen/10 relative overflow-hidden group h-7 w-7 xs:h-8 xs:w-8 p-0"
          >
            <Sun className="h-4 w-4 xs:h-5 xs:w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-500 group-hover:text-amber-600" />
            <Moon className="absolute h-4 w-4 xs:h-5 xs:w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-lightYellow group-hover:text-white" />
            <span className="sr-only">Toggle theme</span>
            
            {/* Circle background animation */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-300 to-amber-100 dark:from-blue-900 dark:to-purple-900 opacity-0 group-hover:opacity-20 transition-opacity" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[120px] xs:min-w-[130px] rounded-lg p-1 xs:p-1.5">
        <ThemeMenuItem 
          onClick={() => setTheme("light")}
          icon={<Sun className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-amber-500 mr-1.5 xs:mr-2" />}
          text="Light"
          active={theme === "light"}
        />
        <ThemeMenuItem 
          onClick={() => setTheme("dark")}
          icon={<Moon className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-indigo-400 mr-1.5 xs:mr-2" />}
          text="Dark"
          active={theme === "dark"}
        />
        <ThemeMenuItem 
          onClick={() => setTheme("system")}
          icon={
            <div className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 flex items-center justify-center">
              <span className="h-2.5 w-2.5 xs:h-3 xs:w-3 rounded-full border-2 border-current" />
            </div>
          }
          text="System"
          active={theme === "system"}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ThemeMenuItemProps {
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
  active: boolean;
}

function ThemeMenuItem({ onClick, icon, text, active }: ThemeMenuItemProps) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={`flex items-center px-2 xs:px-2.5 py-1.5 xs:py-2 text-xs xs:text-sm rounded-md cursor-pointer transition-colors ${
        active 
          ? "bg-lightGreen/10 text-lightGreen dark:bg-lightGreen/20" 
          : "hover:bg-slate-100 dark:hover:bg-darkGreen/50"
      }`}
    >
      {icon}
      <span>{text}</span>
      {active && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full bg-lightGreen"
        />
      )}
    </DropdownMenuItem>
  )
} 
