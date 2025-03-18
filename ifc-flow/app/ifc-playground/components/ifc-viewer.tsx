"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RotateCw, ZoomIn, ZoomOut, Move, CuboidIcon as Cube } from "lucide-react"

// Add a method to update the viewer with IFC data
export function IFCViewer({ ifcData }: { ifcData?: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"3d" | "wireframe">("3d")

  useEffect(() => {
    // Simulate loading the IFC viewer
    const timer = setTimeout(() => {
      setIsLoading(false)
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          drawPlaceholderScene(ctx)
        }
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Update the viewer when ifcData changes
  useEffect(() => {
    if (ifcData && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        // If we have real IFC data, we could use it to draw a more accurate representation
        // For now, we'll just redraw the placeholder scene
        drawPlaceholderScene(ctx)
      }
    }
  }, [ifcData])

  // Draw a placeholder 3D scene
  const drawPlaceholderScene = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = "#1e1e3f"
    ctx.lineWidth = 1

    const gridSize = 30
    const centerX = width / 2
    const centerY = height / 2

    // Horizontal grid lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Vertical grid lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Draw a simple building shape
    ctx.fillStyle = viewMode === "3d" ? "#4f46e5" : "transparent"
    ctx.strokeStyle = "#06b6d4"
    ctx.lineWidth = viewMode === "wireframe" ? 2 : 1

    // Base
    ctx.beginPath()
    ctx.rect(centerX - 100, centerY - 50, 200, 150)
    ctx.fill()
    ctx.stroke()

    // Roof
    ctx.beginPath()
    ctx.moveTo(centerX - 120, centerY - 50)
    ctx.lineTo(centerX, centerY - 120)
    ctx.lineTo(centerX + 120, centerY - 50)
    ctx.closePath()
    ctx.fillStyle = viewMode === "3d" ? "#8b5cf6" : "transparent"
    ctx.fill()
    ctx.stroke()

    // Door
    ctx.beginPath()
    ctx.rect(centerX - 20, centerY + 50, 40, 50)
    ctx.fillStyle = viewMode === "3d" ? "#1e1e3f" : "transparent"
    ctx.fill()
    ctx.stroke()

    // Windows
    ctx.beginPath()
    ctx.rect(centerX - 70, centerY - 20, 30, 30)
    ctx.rect(centerX + 40, centerY - 20, 30, 30)
    ctx.fillStyle = viewMode === "3d" ? "#06b6d4" : "transparent"
    ctx.fill()
    ctx.stroke()

    // Add some neon glow effect
    ctx.shadowColor = "#06b6d4"
    ctx.shadowBlur = 15
    ctx.strokeStyle = "#06b6d4"
    ctx.lineWidth = 2
    ctx.strokeRect(centerX - 105, centerY - 55, 210, 160)
    ctx.shadowBlur = 0
  }

  const toggleViewMode = () => {
    const newMode = viewMode === "3d" ? "wireframe" : "3d"
    setViewMode(newMode)

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        drawPlaceholderScene(ctx)
      }
    }
  }

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-pink-500 border-b-purple-500 border-l-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-cyan-400 animate-pulse">Loading IFC Viewer...</p>
        </div>
      ) : (
        <>
          <canvas ref={canvasRef} className="w-full h-full" width={800} height={500} />

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm p-2 rounded-full border border-pink-500/50">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-8 w-8 border-cyan-400 text-cyan-400 hover:bg-cyan-950"
              onClick={() => {}}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-8 w-8 border-cyan-400 text-cyan-400 hover:bg-cyan-950"
              onClick={() => {}}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-8 w-8 border-cyan-400 text-cyan-400 hover:bg-cyan-950"
              onClick={() => {}}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-8 w-8 border-cyan-400 text-cyan-400 hover:bg-cyan-950"
              onClick={() => {}}
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full h-8 w-8 ${
                viewMode === "3d"
                  ? "border-pink-400 text-pink-400 hover:bg-pink-950"
                  : "border-cyan-400 text-cyan-400 hover:bg-cyan-950"
              }`}
              onClick={toggleViewMode}
            >
              <Cube className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

