"use client"

import { Sparkles, ThumbsUp, ThumbsDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Highlight {
  text: string
  count: number
  sentiment: "positive" | "negative"
}

interface ReviewHighlightsProps {
  positiveHighlights: Highlight[]
  negativeHighlights?: Highlight[]
}

export function ReviewHighlights({
  positiveHighlights,
  negativeHighlights = [],
}: ReviewHighlightsProps) {
  if (positiveHighlights.length === 0 && negativeHighlights.length === 0) {
    return null
  }

  return (
    <Card className="mb-6 border-emerald-200 shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-darkGreen mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          What Guests Are Saying
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive Highlights */}
          {positiveHighlights.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-gray-900">Most Loved</h4>
              </div>
              <div className="space-y-2">
                {positiveHighlights.slice(0, 6).map((highlight, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-green-900">
                      {highlight.text}
                    </span>
                    <Badge className="bg-green-600 hover:bg-green-700 text-white">
                      {highlight.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Negative Highlights */}
          {negativeHighlights.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ThumbsDown className="h-4 w-4 text-orange-600" />
                <h4 className="font-semibold text-gray-900">Areas for Improvement</h4>
              </div>
              <div className="space-y-2">
                {negativeHighlights.slice(0, 6).map((highlight, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-orange-900">
                      {highlight.text}
                    </span>
                    <Badge className="bg-orange-600 hover:bg-orange-700 text-white">
                      {highlight.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            <Sparkles className="h-3 w-3 inline mr-1" />
            These highlights are extracted from verified guest reviews to help you make informed decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
