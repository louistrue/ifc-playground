"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Save } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: SettingsData) => void
  initialSettings: SettingsData
}

export interface SettingsData {
  autoRunScripts: boolean
  defaultTab: string
  pythonVersion: string
  showDebugInfo: boolean
  maxConsoleLines: number
}

export function SettingsModal({ isOpen, onClose, onSave, initialSettings }: SettingsModalProps) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings)

  if (!isOpen) return null

  const handleSave = () => {
    onSave(settings)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-black/80 border border-pink-500 dark:bg-gray-900/90 dark:border-cyan-500">
        <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-pink-500/50 dark:from-blue-900/50 dark:to-cyan-900/50 dark:border-cyan-500/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400 dark:text-cyan-300">Settings</h2>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-pink-400 dark:text-blue-400">General</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="default-tab" className="text-gray-300 dark:text-gray-200">
                Default Tab
              </Label>
              <Select
                value={settings.defaultTab}
                onValueChange={(value) => setSettings({ ...settings, defaultTab: value })}
              >
                <SelectTrigger className="w-[180px] bg-black/50 border-pink-500/50 text-white dark:bg-gray-800 dark:border-cyan-500/50">
                  <SelectValue placeholder="Select tab" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-pink-500 text-white dark:bg-gray-800 dark:border-cyan-500">
                  <SelectItem value="viewer">3D Viewer</SelectItem>
                  <SelectItem value="console">Console</SelectItem>
                  <SelectItem value="editor">Script Editor</SelectItem>
                  <SelectItem value="results">Results</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-run" className="text-gray-300 dark:text-gray-200">
                Auto-run scripts
              </Label>
              <Switch
                id="auto-run"
                checked={settings.autoRunScripts}
                onCheckedChange={(checked) => setSettings({ ...settings, autoRunScripts: checked })}
                className="data-[state=checked]:bg-cyan-500"
              />
            </div>
          </div>

          <Separator className="bg-pink-500/30 dark:bg-cyan-500/30" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-pink-400 dark:text-blue-400">Developer</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="python-version" className="text-gray-300 dark:text-gray-200">
                Python Version
              </Label>
              <Select
                value={settings.pythonVersion}
                onValueChange={(value) => setSettings({ ...settings, pythonVersion: value })}
              >
                <SelectTrigger className="w-[180px] bg-black/50 border-pink-500/50 text-white dark:bg-gray-800 dark:border-cyan-500/50">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-pink-500 text-white dark:bg-gray-800 dark:border-cyan-500">
                  <SelectItem value="3.10">Python 3.10</SelectItem>
                  <SelectItem value="3.11">Python 3.11</SelectItem>
                  <SelectItem value="3.12">Python 3.12</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="debug-info" className="text-gray-300 dark:text-gray-200">
                Show debug information
              </Label>
              <Switch
                id="debug-info"
                checked={settings.showDebugInfo}
                onCheckedChange={(checked) => setSettings({ ...settings, showDebugInfo: checked })}
                className="data-[state=checked]:bg-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="console-lines" className="text-gray-300 dark:text-gray-200">
                Max console lines
              </Label>
              <Select
                value={settings.maxConsoleLines.toString()}
                onValueChange={(value) => setSettings({ ...settings, maxConsoleLines: Number.parseInt(value) })}
              >
                <SelectTrigger className="w-[180px] bg-black/50 border-pink-500/50 text-white dark:bg-gray-800 dark:border-cyan-500/50">
                  <SelectValue placeholder="Select limit" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-pink-500 text-white dark:bg-gray-800 dark:border-cyan-500">
                  <SelectItem value="100">100 lines</SelectItem>
                  <SelectItem value="500">500 lines</SelectItem>
                  <SelectItem value="1000">1000 lines</SelectItem>
                  <SelectItem value="5000">5000 lines</SelectItem>
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
  )
}

