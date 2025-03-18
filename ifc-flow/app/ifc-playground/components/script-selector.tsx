"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  ChevronRight,
  Building,
  BarChart,
  Box,
  Paintbrush,
} from "lucide-react";
import { SCRIPTS, type ScriptKey } from "../scripts";

// Map script IDs to icons
const SCRIPT_ICONS: Record<string, any> = {
  "extract-geometry": Box,
  "count-elements": BarChart,
  "extract-properties": FileText,
  "spatial-structure": Building,
  "material-analysis": Paintbrush,
};

// Create script objects from the SCRIPTS constant
const AVAILABLE_SCRIPTS = Object.keys(SCRIPTS).map((id) => ({
  id,
  name: id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" "),
  description: SCRIPTS[id as keyof typeof SCRIPTS]
    .split("\n")[1]
    .replace("# ", ""),
  icon: SCRIPT_ICONS[id] || FileText,
}));

interface ScriptSelectorProps {
  onScriptSelected: (scriptName: string, scriptId: ScriptKey) => void;
}

export function ScriptSelector({ onScriptSelected }: ScriptSelectorProps) {
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  const handleSelectScript = (scriptId: string) => {
    setSelectedScriptId(scriptId);
    const script = AVAILABLE_SCRIPTS.find((s) => s.id === scriptId);
    if (script) {
      onScriptSelected(script.name, scriptId as ScriptKey);
    }
  };

  return (
    <ScrollArea className="rounded-md border border-pink-500/30 bg-black/30">
      <div className="p-2 space-y-1 pb-4">
        {AVAILABLE_SCRIPTS.map((script) => {
          const Icon = script.icon;
          return (
            <Button
              key={script.id}
              variant="ghost"
              className={`w-full justify-start text-left h-auto py-2 px-3 ${
                selectedScriptId === script.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border-l-2 border-cyan-400"
                  : "hover:bg-white/5"
              }`}
              onClick={() => handleSelectScript(script.id)}
            >
              <div className="flex items-start">
                <div
                  className={`mr-3 mt-0.5 text-${
                    selectedScriptId === script.id ? "cyan" : "pink"
                  }-400`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div
                    className={`font-medium ${
                      selectedScriptId === script.id
                        ? "text-cyan-400"
                        : "text-white"
                    }`}
                  >
                    {script.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {script.description}
                  </div>
                </div>
                {selectedScriptId === script.id && (
                  <ChevronRight className="h-4 w-4 text-cyan-400 self-center" />
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
