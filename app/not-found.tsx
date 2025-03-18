import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black to-purple-950 text-white font-mono flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(255,0,255,0.5)] mb-6">
          404
        </h1>
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">Page Not Found</h2>
        <p className="text-gray-300 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/ifc-playground">
          <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
            <Home className="mr-2 h-4 w-4" />
            Go to IFC Playground
          </Button>
        </Link>
      </div>
    </div>
  )
}

