"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface FallbackLoaderProps {
  onRetry: () => void
}

export function FallbackLoader({ onRetry }: FallbackLoaderProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleRetry = () => {
    setIsLoading(true)
    onRetry()
    // Reset loading state after a timeout
    setTimeout(() => setIsLoading(false), 3000)
  }

  return (
    <Card className="p-6 bg-black/70 border border-red-500 max-w-md mx-auto">
      <div className="flex flex-col items-center text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Environment Loading Failed</h2>
        <p className="text-gray-300 mb-4">There was a problem loading the Python environment for the IFC Playground.</p>
        <div className="space-y-4 w-full">
          <Button
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            onClick={handleRetry}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Loading
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

