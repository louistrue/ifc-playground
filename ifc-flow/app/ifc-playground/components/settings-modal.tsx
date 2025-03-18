"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Save } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: SettingsData) => void;
  initialSettings: SettingsData;
}

export interface SettingsData {
  defaultTab: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSave,
  initialSettings,
}: SettingsModalProps) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-black/80 border border-pink-500 dark:bg-gray-900/90 dark:border-cyan-500">
        <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-pink-500/50 dark:from-blue-900/50 dark:to-cyan-900/50 dark:border-cyan-500/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400 dark:text-cyan-300">
            Settings
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-pink-400 dark:text-blue-400">
              Application Settings
            </h3>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="default-tab"
                className="text-gray-300 dark:text-gray-200"
              >
                Default Tab
              </Label>
              <Select
                value={settings.defaultTab}
                onValueChange={(value) =>
                  setSettings({ ...settings, defaultTab: value })
                }
              >
                <SelectTrigger className="w-[180px] bg-black/50 border-pink-500/50 text-white dark:bg-gray-800 dark:border-cyan-500/50">
                  <SelectValue placeholder="Select tab" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-pink-500 text-white dark:bg-gray-800 dark:border-cyan-500">
                  <SelectItem value="viewer">3D Viewer</SelectItem>
                  <SelectItem value="console">Console</SelectItem>
                  <SelectItem value="editor">Script Editor</SelectItem>
                  <SelectItem value="results">Results</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-pink-500/30 dark:border-cyan-500/30 flex justify-end">
          <Button
            variant="outline"
            className="mr-2 border-pink-500 text-pink-400 hover:bg-pink-950/30 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/30"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white dark:from-blue-500 dark:to-cyan-600 dark:hover:from-blue-600 dark:hover:to-cyan-700"
            onClick={handleSave}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
