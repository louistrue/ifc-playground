"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, RefreshCw } from "lucide-react";
import { SCRIPTS, type ScriptKey } from "../scripts";

interface ScriptEditorProps {
  scriptId: ScriptKey | null;
  onScriptChange: (scriptId: ScriptKey, newScript: string) => void;
}

export function ScriptEditor({ scriptId, onScriptChange }: ScriptEditorProps) {
  const [scriptContent, setScriptContent] = useState<string>("");
  const [isEdited, setIsEdited] = useState(false);

  // Load the script content when the scriptId changes
  useEffect(() => {
    if (scriptId && SCRIPTS[scriptId]) {
      setScriptContent(SCRIPTS[scriptId]);
      setIsEdited(false);
    } else {
      setScriptContent("");
      setIsEdited(false);
    }
  }, [scriptId]);

  // Clean script content of any invisible markers or problematic characters
  const sanitizeScript = (script: string): string => {
    // Remove any cursor position marker or other invisible characters
    return script
      .replace(/<CURRENT_CURSOR_POSITION>/g, "")
      .replace(/\uFEFF/g, "") // Remove BOM
      .replace(/\u200B/g, ""); // Remove zero-width space
  };

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScriptContent(e.target.value);
    setIsEdited(true);
  };

  const handleSave = () => {
    if (scriptId) {
      // Sanitize script before saving
      const cleanScript = sanitizeScript(scriptContent);
      onScriptChange(scriptId, cleanScript);
      setIsEdited(false);
    }
  };

  const handleReset = () => {
    if (scriptId && SCRIPTS[scriptId]) {
      setScriptContent(SCRIPTS[scriptId]);
      setIsEdited(false);
    }
  };

  if (!scriptId) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <p className="text-gray-400">Select a script to edit</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 dark:from-blue-900/50 dark:to-cyan-900/50 border-b border-pink-500/50 dark:border-cyan-500/50 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold text-cyan-400 dark:text-blue-400">
          Editing:{" "}
          {scriptId
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-yellow-400 text-yellow-400 hover:bg-yellow-950/30 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950/30"
            onClick={handleReset}
            disabled={!isEdited}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-cyan-400 text-cyan-400 hover:bg-cyan-950/30 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/30"
            onClick={handleSave}
            disabled={!isEdited}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
      <div className="flex-grow overflow-hidden flex flex-col h-full">
        <ScrollArea className="h-full flex-grow">
          <div className="p-4 h-full">
            <textarea
              value={scriptContent}
              onChange={handleScriptChange}
              className="w-full h-full min-h-[60vh] bg-black/70 dark:bg-gray-900/70 text-gray-300 dark:text-gray-200 font-mono text-sm p-4 border border-pink-500/30 dark:border-cyan-500/30 rounded-md focus:outline-none focus:border-cyan-500 dark:focus:border-blue-500"
              spellCheck={false}
            />
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
