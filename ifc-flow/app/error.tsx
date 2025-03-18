"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black to-purple-950 text-white font-mono flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(255,0,255,0.5)] mb-6">
          Something went wrong!
        </h1>
        <p className="text-gray-300 mb-8">An unexpected error occurred. Please try again or return to the home page.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Link href="/ifc-playground">
            <Button variant="outline" className="border-pink-500 text-pink-400 hover:bg-pink-950/30">
              <Home className="mr-2 h-4 w-4" />
              Go to IFC Playground
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

