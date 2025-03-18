"use client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DebugConsoleProps {
  logs: string[]
  onClose: () => void
}

export function DebugConsole({ logs, onClose }: DebugConsoleProps) {
  return (
    <div className="fixed bottom-0 right-0 w-full md:w-1/2 lg:w-1/3 z-50 bg-black border-t border-l border-pink-500 shadow-lg">
      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-900 to-pink-900 border-b border-pink-500">
        <h3 className="text-sm font-bold text-white">Debug Console</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-white hover:bg-pink-800">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-64 p-2 text-xs font-mono">
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">No debug logs yet</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-gray-300">
                <span className="text-pink-400">[{index}] </span>
                {log}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

