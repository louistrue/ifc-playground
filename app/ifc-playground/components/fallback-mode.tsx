"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, FileText, Code } from "lucide-react"

interface FallbackModeProps {
  file: File | null
  onClose: () => void
}

export function FallbackMode({ file, onClose }: FallbackModeProps) {
  const [activeTab, setActiveTab] = useState<string>("info")
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const readFile = async () => {
    if (!file) return

    setIsLoading(true)
    try {
      const text = await file.text()
      setFileContent(text)
      setActiveTab("content")
    } catch (error) {
      console.error("Error reading file:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-black/70 border border-pink-500 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-pink-500/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400">Fallback Mode - Limited Functionality</h2>
          <Button
            variant="outline"
            size="sm"
            className="border-pink-400 text-pink-400 hover:bg-pink-950"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        <div className="p-4">
          <div className="flex items-start mb-6">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mr-4 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">IfcOpenShell Could Not Be Loaded</h3>
              <p className="text-gray-300 mb-4">
                The Python environment could not be initialized with IfcOpenShell. We've switched to a limited fallback
                mode that allows you to view basic information about your IFC file, but advanced processing is not
                available.
              </p>
              {file && (
                <div className="mb-4">
                  <p className="text-pink-400 font-semibold">Selected file: {file.name}</p>
                  <p className="text-gray-400">Size: {(file.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-black/50 border border-pink-500/50 p-1 rounded-xl mb-4">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Information
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400"
                disabled={!file}
              >
                <FileText className="mr-2 h-4 w-4" />
                File Content
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-0">
              <Card className="bg-black/30 border border-pink-500/30 p-4">
                <h3 className="text-lg font-semibold text-pink-400 mb-4">About IFC Files</h3>
                <p className="text-gray-300 mb-4">
                  Industry Foundation Classes (IFC) is an open standard for exchanging building and construction
                  industry data between different software applications. IFC files are typically in a text-based format
                  that follows the STEP file structure (ISO 10303-21).
                </p>

                <h3 className="text-lg font-semibold text-pink-400 mb-4">Troubleshooting</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                  <li>Try refreshing the page and trying again</li>
                  <li>Check if your browser supports WebAssembly</li>
                  <li>Try a different browser (Chrome or Firefox recommended)</li>
                  <li>Check your internet connection</li>
                </ul>

                {file && (
                  <Button
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 mt-4"
                    onClick={readFile}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "View File Content"}
                  </Button>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <Card className="bg-black/30 border border-pink-500/30">
                <ScrollArea className="h-[400px] p-4">
                  {fileContent ? (
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                      {fileContent.slice(0, 10000)}
                      {fileContent.length > 10000 && (
                        <div className="mt-4 p-2 bg-black/50 border border-yellow-500/30 rounded">
                          <p className="text-yellow-400">File truncated. Showing first 10,000 characters only.</p>
                        </div>
                      )}
                    </pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Code className="h-12 w-12 text-gray-500 mb-4" />
                      <p className="text-gray-500">Click "View File Content" to see the raw IFC file data</p>
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}

