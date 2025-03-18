"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className={cn(
        "relative rounded-full transition-all duration-300 overflow-hidden border-2",
        isDark
          ? "border-cyan-400 hover:border-cyan-300 bg-blue-950/70 text-yellow-300 hover:text-yellow-200"
          : "border-purple-400 hover:border-pink-300 bg-purple-950/70 text-purple-200 hover:text-purple-100"
      )}
    >
      <div className="absolute inset-0 pointer-events-none">
        {isDark ? (
          <>
            {/* Glow effect for dark mode (cool/blue colors) */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/30 via-cyan-500/30 to-teal-500/30 opacity-80"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 opacity-40 blur-sm rounded-full animate-pulse"></div>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-full"></div>
          </>
        ) : (
          <>
            {/* Glow effect for light mode (warm/pink colors) */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-fuchsia-500/30 opacity-80"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 via-purple-300 to-pink-500 opacity-40 blur-sm rounded-full animate-pulse"></div>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-full"></div>
          </>
        )}
      </div>
      <div className="relative z-10 flex items-center justify-center">
        {isDark ? (
          <Sun
            className="h-5 w-5 text-yellow-200 drop-shadow-[0_0_3px_rgba(250,204,21,0.8)]"
            style={{ animation: "spin 8s linear infinite" }}
          />
        ) : (
          <Moon
            className="h-6 w-6 text-white drop-shadow-[0_0_3px_rgba(233,213,255,0.8)]"
            style={{ animation: "pulse 3s ease-in-out infinite" }}
          />
        )}
      </div>
    </Button>
  );
}
