"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Search,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  X,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

interface HelpArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  difficulty: "beginner" | "intermediate" | "advanced"
  lastUpdated: string
  videoUrl?: string
  relatedArticles?: string[]
}

interface HelpCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  articles: string[]
}

// Sample help articles
const helpArticles: HelpArticle[] = [
  {
    id: "getting-started",
    title: "Getting Started with Baithaka GHAR OS",
    content: `
      <h2>Welcome to Baithaka GHAR OS</h2>
      <p>Baithaka GHAR OS is your comprehensive property management system designed to streamline your operations.</p>
      
      <h3>First Steps</h3>
      <ol>
        <li>Complete your property profile</li>
        <li>Set up your room inventory</li>
        <li>Configure your pricing</li>
        <li>Start accepting bookings</li>
      </ol>
      
      <h3>Key Features</h3>
      <ul>
        <li>Real-time booking management</li>
        <li>Inventory tracking</li>
        <li>Financial reporting</li>
        <li>Staff management</li>
      </ul>
    `,
    category: "getting-started",
    tags: ["setup", "first-time", "configuration"],
    difficulty: "beginner",
    lastUpdated: "2024-01-15",
  },
  {
    id: "booking-management",
    title: "Managing Bookings",
    content: `
      <h2>Booking Management Guide</h2>
      <p>Learn how to efficiently manage your property bookings.</p>
      
      <h3>Creating a New Booking</h3>
      <ol>
        <li>Navigate to the Bookings module</li>
        <li>Click "New Booking"</li>
        <li>Fill in guest details</li>
        <li>Select room and dates</li>
        <li>Confirm booking</li>
      </ol>
      
      <h3>Booking Statuses</h3>
      <ul>
        <li><strong>Confirmed:</strong> Booking is confirmed and payment received</li>
        <li><strong>Pending:</strong> Awaiting payment or confirmation</li>
        <li><strong>Cancelled:</strong> Booking has been cancelled</li>
        <li><strong>Completed:</strong> Guest has checked out</li>
      </ul>
    `,
    category: "bookings",
    tags: ["bookings", "reservations", "guests"],
    difficulty: "beginner",
    lastUpdated: "2024-01-10",
  },
  {
    id: "inventory-setup",
    title: "Setting Up Your Inventory",
    content: `
      <h2>Inventory Management</h2>
      <p>Properly setting up your inventory is crucial for efficient operations.</p>
      
      <h3>Room Types</h3>
      <p>Define different room types with their amenities and pricing:</p>
      <ul>
        <li>Standard Rooms</li>
        <li>Deluxe Rooms</li>
        <li>Suites</li>
        <li>Family Rooms</li>
      </ul>
      
      <h3>Room Configuration</h3>
      <ol>
        <li>Add room numbers</li>
        <li>Assign room types</li>
        <li>Set base pricing</li>
        <li>Configure amenities</li>
      </ol>
    `,
    category: "inventory",
    tags: ["inventory", "rooms", "setup"],
    difficulty: "intermediate",
    lastUpdated: "2024-01-12",
  },
  {
    id: "financial-reports",
    title: "Understanding Financial Reports",
    content: `
      <h2>Financial Reporting</h2>
      <p>Track your property's financial performance with detailed reports.</p>
      
      <h3>Key Reports</h3>
      <ul>
        <li><strong>Revenue Report:</strong> Track daily, weekly, and monthly revenue</li>
        <li><strong>Occupancy Report:</strong> Monitor room occupancy rates</li>
        <li><strong>Commission Report:</strong> Track partner commissions</li>
        <li><strong>Tax Report:</strong> Generate tax-related reports</li>
      </ul>
      
      <h3>Export Options</h3>
      <p>All reports can be exported in PDF, Excel, or CSV formats.</p>
    `,
    category: "financial",
    tags: ["reports", "finance", "analytics"],
    difficulty: "intermediate",
    lastUpdated: "2024-01-08",
  },
  {
    id: "staff-management",
    title: "Staff Management Features",
    content: `
      <h2>Staff Management</h2>
      <p>Manage your team efficiently with our comprehensive staff tools.</p>
      
      <h3>Staff Roles</h3>
      <ul>
        <li><strong>Manager:</strong> Full system access</li>
        <li><strong>Receptionist:</strong> Booking and guest management</li>
        <li><strong>Housekeeping:</strong> Room status updates</li>
        <li><strong>Maintenance:</strong> Maintenance requests</li>
      </ul>
      
      <h3>Features</h3>
      <ul>
        <li>Staff scheduling</li>
        <li>Performance tracking</li>
        <li>Payroll management</li>
        <li>Task assignment</li>
      </ul>
    `,
    category: "staff",
    tags: ["staff", "employees", "management"],
    difficulty: "advanced",
    lastUpdated: "2024-01-05",
  },
]

// Help categories
const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    description: "Essential guides for new users",
    icon: BookOpen,
    articles: ["getting-started"],
  },
  {
    id: "bookings",
    name: "Booking Management",
    description: "Learn how to manage reservations",
    icon: FileText,
    articles: ["booking-management"],
  },
  {
    id: "inventory",
    name: "Inventory Management",
    description: "Set up and manage your property inventory",
    icon: FileText,
    articles: ["inventory-setup"],
  },
  {
    id: "financial",
    name: "Financial Management",
    description: "Reports and financial tracking",
    icon: FileText,
    articles: ["financial-reports"],
  },
  {
    id: "staff",
    name: "Staff Management",
    description: "Manage your team and operations",
    icon: FileText,
    articles: ["staff-management"],
  },
]

// Help system context
interface HelpContextType {
  isHelpOpen: boolean
  openHelp: () => void
  closeHelp: () => void
  currentArticle: HelpArticle | null
  setCurrentArticle: (article: HelpArticle | null) => void
}

const HelpContext = React.createContext<HelpContextType | null>(null)

export const useHelp = () => {
  const context = React.useContext(HelpContext)
  if (!context) {
    throw new Error("useHelp must be used within HelpProvider")
  }
  return context
}

// Help provider
interface HelpProviderProps {
  children: React.ReactNode
}

export const HelpProvider: React.FC<HelpProviderProps> = ({ children }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [currentArticle, setCurrentArticle] = useState<HelpArticle | null>(null)

  const openHelp = () => setIsHelpOpen(true)
  const closeHelp = () => {
    setIsHelpOpen(false)
    setCurrentArticle(null)
  }

  return (
    <HelpContext.Provider
      value={{
        isHelpOpen,
        openHelp,
        closeHelp,
        currentArticle,
        setCurrentArticle,
      }}
    >
      {children}
    </HelpContext.Provider>
  )
}

// Help modal component
export const HelpModal: React.FC = () => {
  const { isHelpOpen, closeHelp, currentArticle, setCurrentArticle } = useHelp()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  )

  const filteredArticles = useMemo(() => {
    return helpArticles.filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )

      const matchesCategory =
        !selectedCategory || article.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  if (!isHelpOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={closeHelp}
        />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Help & Documentation
            </h2>
            <button
              onClick={closeHelp}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close help"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex h-96">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                {helpCategories.map((category) => {
                  const isExpanded = expandedCategories.has(category.id)
                  const categoryArticles = helpArticles.filter(
                    (article) => article.category === category.id
                  )
                  const Icon = category.icon

                  return (
                    <div
                      key={category.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-md"
                    >
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center space-x-2">
                          <Icon size={16} className="text-gray-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {category.name}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-200 dark:border-gray-700">
                          {categoryArticles.map((article) => (
                            <button
                              key={article.id}
                              onClick={() => setCurrentArticle(article)}
                              className="w-full text-left p-3 pl-8 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-300"
                            >
                              {article.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {currentArticle ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {currentArticle.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          currentArticle.difficulty === "beginner"
                            ? "bg-green-100 text-green-800"
                            : currentArticle.difficulty === "intermediate"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {currentArticle.difficulty}
                      </span>
                      <span className="text-sm text-gray-500">
                        Updated{" "}
                        {new Date(
                          currentArticle.lastUpdated
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: currentArticle.content }}
                  />

                  {currentArticle.videoUrl && (
                    <div className="mt-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Video Tutorial
                      </h4>
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Video size={48} className="text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle
                    size={64}
                    className="mx-auto text-gray-400 mb-4"
                  />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Welcome to Help & Documentation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Select a category from the sidebar or search for specific
                    topics to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Help trigger button
export const HelpTrigger: React.FC = () => {
  const { openHelp } = useHelp()

  return (
    <button
      onClick={openHelp}
      className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-40"
      aria-label="Open help and documentation"
    >
      <HelpCircle size={24} />
    </button>
  )
}

// Quick help component
interface QuickHelpProps {
  topic: string
  children: React.ReactNode
}

export const QuickHelp: React.FC<QuickHelpProps> = ({ topic, children }) => {
  const { openHelp, setCurrentArticle } = useHelp()

  const handleHelpClick = () => {
    const article = helpArticles.find((a) => a.id === topic)
    if (article) {
      setCurrentArticle(article)
      openHelp()
    }
  }

  return (
    <div className="group relative">
      {children}
      <button
        onClick={handleHelpClick}
        className="absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Get help with ${topic}`}
      >
        <HelpCircle size={12} />
      </button>
    </div>
  )
}
