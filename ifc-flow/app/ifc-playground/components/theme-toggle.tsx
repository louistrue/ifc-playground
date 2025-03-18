"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
  isDark: boolean
  onToggle: () => void
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className={`rounded-full ${
        isDark
          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500 hover:bg-yellow-950/30 hover:text-yellow-300"
          : "bg-purple-500/20 text-purple-400 border-purple-500 hover:bg-purple-950/30 hover:text-purple-300"
      }`}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

