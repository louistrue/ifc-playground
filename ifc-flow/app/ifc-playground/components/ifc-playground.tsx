"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  FileUp,
  Play,
  Settings,
  Code,
  Layers,
  Download,
  Zap,
  Info,
  Trash2,
  BarChart,
  Edit,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IFCViewer } from "./ifc-viewer";
import { ScriptSelector } from "./script-selector";
import { FileManager, FileManagerRef } from "./file-manager";
import { Console } from "./console";
import { ThemeToggle } from "./theme-toggle";
import { useIfcWorker } from "../hooks/use-ifc-worker";
import { SCRIPTS, type ScriptKey } from "../scripts";
import { ResultsViewer } from "./results-viewer";
import { DebugConsole } from "./debug-console";
import { FallbackLoader } from "./fallback-loader";
// Import the new FallbackMode component
import { FallbackMode } from "./fallback-mode";
import { ScriptEditor } from "./script-editor";
import { SettingsModal, type SettingsData } from "./settings-modal";
import { InfoModal } from "./info-modal";

export function IFCPlayground() {
  const [activeTab, setActiveTab] = useState("viewer");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    "IFC Playground initialized...",
    "Ready to process IFC files!",
    "Select a script and upload an IFC file to begin.",
  ]);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<ScriptKey | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [showSimpleFallback, setShowSimpleFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [customScripts, setCustomScripts] = useState<Record<ScriptKey, string>>(
    { ...SCRIPTS }
  );

  // Add settings state
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    defaultTab: "viewer",
  });

  // Add a ref for the FileManager component
  const fileManagerRef = useRef<FileManagerRef>(null);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Apply dark mode to the document
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Store preference
    if (typeof window !== "undefined") {
      localStorage.setItem("darkMode", newDarkMode ? "true" : "false");
    }
  };

  // Add the useIfcWorker hook
  const ifcWorker = useIfcWorker();

  // Initialize dark mode based on system preference or stored preference
  useEffect(() => {
    // Check for stored preference
    const storedPreference = localStorage.getItem("darkMode");

    if (storedPreference !== null) {
      const prefersDark = storedPreference === "true";
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      }
    }

    // Initialize the IFC worker
    ifcWorker.initializeWorker();

    // Load settings from localStorage if available
    const storedSettings = localStorage.getItem("ifcPlaygroundSettings");
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        // Only apply the defaultTab setting from stored settings
        if (parsedSettings.defaultTab) {
          setSettings((prev) => ({
            ...prev,
            defaultTab: parsedSettings.defaultTab,
          }));
          setActiveTab(parsedSettings.defaultTab);
        }
      } catch (e) {
        console.error("Failed to parse stored settings:", e);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem("ifcPlaygroundSettings", JSON.stringify(settings));
  }, [settings]);

  // Add a function to sanitize scripts
  const sanitizeScript = (script: string): string => {
    // Remove any cursor position marker or other invisible characters
    return script
      .replace(/<CURRENT_CURSOR_POSITION>/g, "")
      .replace(/\uFEFF/g, "") // Remove BOM
      .replace(/\u200B/g, ""); // Remove zero-width space
  };

  // Handle script execution
  const runScript = () => {
    if (!selectedScriptId) {
      addToConsole("Error: Please select a script.");
      return;
    }

    if (!selectedFile) {
      // Try to access the FileManager's file list through a ref
      if (fileManagerRef.current) {
        const files = fileManagerRef.current.getFiles();

        if (files.length === 1) {
          // If there's exactly one file, select it automatically
          const onlyFile = files[0];
          addToConsole(
            `Auto-selected the only available file: ${onlyFile.name}`
          );

          // Set the selected file
          handleFileSelected(onlyFile);

          // Continue with script execution after a small delay to ensure state updates
          setTimeout(() => {
            setIsProcessing(true);
            addToConsole(`Running script: ${selectedScript}`);
            addToConsole(`Processing file: ${onlyFile.name}`);
            runScriptWithFile(onlyFile);
          }, 100);

          return;
        } else if (files.length === 0) {
          addToConsole("Error: Please upload an IFC file.");
          return;
        } else {
          addToConsole("Error: Please select an IFC file from the list.");
          return;
        }
      } else {
        addToConsole("Error: Please select an IFC file.");
        return;
      }
    }

    // If we already have a selected file, proceed normally
    setIsProcessing(true);
    addToConsole(`Running script: ${selectedScript}`);
    addToConsole(`Processing file: ${selectedFile.name}`);
    runScriptWithFile(selectedFile);
  };

  // Helper function to run a script with a specific file
  const runScriptWithFile = (file: File) => {
    // Get the script content from customScripts
    let scriptContent = customScripts[selectedScriptId!];

    if (!scriptContent) {
      addToConsole("Error: Script content not found.");
      setIsProcessing(false);
      return;
    }

    // For count-elements, use a known properly indented version
    if (selectedScriptId === "count-elements") {
      scriptContent = `
# Count elements by type
try:
    print("Counting elements by type...")

    # Get all entity types
    entity_types = ifc_file.wrapped_data.schema.declarations.keys()

    # Count instances of each type
    type_counts = {}
    for entity_type in entity_types:
        instances = ifc_file.by_type(entity_type)
        if instances:
            type_counts[entity_type] = len(instances)

    # Sort by count (descending)
    sorted_counts = dict(sorted(type_counts.items(), key=lambda x: x[1], reverse=True))

    # Print the top 20 most common types
    print("Top 20 most common element types:")
    for i, (entity_type, count) in enumerate(list(sorted_counts.items())[:20]):
        print(f"{entity_type}: {count}")

    results["type_counts"] = sorted_counts
except Exception as e:
    print(f"Error: {e}")
    results["error"] = str(e)
`;
    }

    // Sanitize script before running it
    const cleanScript = sanitizeScript(scriptContent);

    // Debug: Print the full script content to console
    addToConsole("--- BEGIN PYTHON SCRIPT ---");
    cleanScript.split("\n").forEach((line, index) => {
      addToConsole(`${index + 1}: ${line}`);
    });
    addToConsole("--- END PYTHON SCRIPT ---");

    // Run the script using the worker
    ifcWorker.runScript(cleanScript, file);
  };

  // Add message to console
  const addToConsole = (message: string) => {
    setConsoleOutput((prev) => {
      const newConsole = [...prev, message];
      // Limit console lines based on settings
      if (newConsole.length > settings.maxConsoleLines) {
        return newConsole.slice(newConsole.length - settings.maxConsoleLines);
      }
      return newConsole;
    });
  };

  // Handle file selection
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    console.log(
      `[IFCPlayground] File selected for viewer: ${file.name}, size: ${file.size} bytes`
    );
    addToConsole(`File selected: ${file.name}`);

    // Switch to viewer tab
    setActiveTab("viewer");
  };

  // Handle script selection
  const handleScriptSelected = (scriptName: string, scriptId: ScriptKey) => {
    setSelectedScript(scriptName);
    setSelectedScriptId(scriptId);
    addToConsole(`Script selected: ${scriptName}`);
  };

  // Handle script editing
  const handleScriptChange = (scriptId: ScriptKey, newScript: string) => {
    setCustomScripts((prev) => ({
      ...prev,
      [scriptId]: newScript,
    }));
    addToConsole(`Script "${scriptId}" updated`);
  };

  // Handle settings save
  const handleSaveSettings = (newSettings: SettingsData) => {
    // Preserve the existing settings values except for defaultTab
    const updatedSettings = {
      ...settings,
      defaultTab: newSettings.defaultTab,
    };

    setSettings(updatedSettings);
    addToConsole("Settings updated");

    // Apply default tab setting if needed
    if (updatedSettings.defaultTab !== settings.defaultTab) {
      setActiveTab(updatedSettings.defaultTab);
    }
  };

  // Update the useEffect for worker status to set the results
  useEffect(() => {
    if (ifcWorker.status === "ready" && isProcessing) {
      setIsProcessing(false);
      addToConsole("Processing complete!");
    }

    if (ifcWorker.progress) {
      addToConsole(ifcWorker.progress);
    }

    if (ifcWorker.error) {
      addToConsole(`Error: ${ifcWorker.error}`);
      setIsProcessing(false);
    }

    if (ifcWorker.result) {
      // Handle the result data
      addToConsole("Results received from Python script");
      setResults(ifcWorker.result.results);

      // You can process the results here
      if (ifcWorker.result.results.geometry) {
        addToConsole(
          `Found ${ifcWorker.result.results.product_count} products with geometry`
        );
      }

      if (ifcWorker.result.results.type_counts) {
        const counts = ifcWorker.result.results.type_counts;
        const topTypes = Object.entries(counts).slice(0, 5);
        addToConsole("Top 5 element types:");
        topTypes.forEach(([type, count]) => {
          addToConsole(`- ${type}: ${count}`);
        });
      }

      // Always switch to results tab when we have results
      setActiveTab("results");
    }
  }, [
    ifcWorker.status,
    ifcWorker.progress,
    ifcWorker.error,
    ifcWorker.result,
    settings.autoRunScripts,
  ]);

  // Add this effect after the other useEffect hooks
  useEffect(() => {
    // Add a timeout to detect if the worker is taking too long
    const timeoutId = setTimeout(() => {
      if (ifcWorker.status === "initializing") {
        console.error("Worker initialization timeout");
        addToConsole(
          "Error: Worker initialization is taking too long. Check the debug console for details."
        );
        if (settings.showDebugInfo) {
          setShowDebugConsole(true);
        }
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeoutId);
  }, [ifcWorker.status, settings.showDebugInfo]);

  // Add this effect after the other useEffect hooks
  useEffect(() => {
    // Show fallback after 15 seconds if still initializing
    const fallbackId = setTimeout(() => {
      if (ifcWorker.status === "initializing") {
        console.error("Worker initialization failed, showing fallback");
        setShowFallback(true);
      }
    }, 15000); // 15 seconds timeout

    return () => clearTimeout(fallbackId);
  }, [ifcWorker.status]);

  // Add this effect to handle error state
  useEffect(() => {
    if (ifcWorker.status === "error" && retryCount >= 2) {
      // If we've tried multiple times and still have errors, show the simple fallback
      setShowSimpleFallback(true);
    }
  }, [ifcWorker.status, retryCount]);

  // Add this function to handle retry
  const handleRetryInitialization = () => {
    setShowFallback(false);
    setRetryCount((prev) => prev + 1);
    console.log("Retrying worker initialization");
    addToConsole("Retrying environment initialization...");
    ifcWorker.initializeWorker();
  };

  // Add this function to close the simple fallback
  const handleCloseSimpleFallback = () => {
    setShowSimpleFallback(false);
  };

  return (
    <div
      className={cn(
        "min-h-screen w-full bg-gradient-to-b from-black to-purple-950 dark:from-gray-900 dark:to-blue-950",
        "text-white font-mono relative overflow-hidden flex flex-col h-full"
      )}
    >
      {/* Grid background */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=2&width=2')] bg-repeat opacity-10 pointer-events-none"></div>

      {/* Neon header */}
      <header className="relative z-10 p-4 md:p-6 border-b-2 border-pink-500 dark:border-cyan-500 shadow-lg shrink-0">
        <div className="container-fluid mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 dark:from-blue-400 dark:via-cyan-500 dark:to-teal-400 text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(255,0,255,0.5)] dark:drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            IFC Playground
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle isDark={isDarkMode} onToggle={toggleDarkMode} />
            <Button
              variant="outline"
              size="sm"
              className="border-pink-400 text-pink-400 hover:bg-pink-950 hover:text-pink-300 dark:border-cyan-400 dark:text-cyan-400 dark:hover:bg-cyan-950 dark:hover:text-cyan-300"
              onClick={() => setShowInfo(true)}
            >
              <Info className="sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Info</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-cyan-400 text-cyan-400 hover:bg-cyan-950 hover:text-cyan-300 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full p-3 md:p-6 relative z-10 flex-grow flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6 h-full">
          {/* Sidebar */}
          <Card className="lg:col-span-3 bg-black/50 border border-pink-500/50 backdrop-blur-sm rounded-xl overflow-hidden dark:bg-gray-900/50 dark:border-cyan-500/50 flex flex-col h-full">
            <div className="p-3 md:p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-pink-500/50 dark:from-blue-900/50 dark:to-cyan-900/50 dark:border-cyan-500/50 shrink-0">
              <h2 className="text-xl font-bold text-cyan-400 dark:text-blue-400">
                Scripts & Files
              </h2>
            </div>

            <div className="flex flex-col flex-grow min-h-0 overflow-hidden">
              {/* Scripts section - takes only the space it needs */}
              <div className="flex flex-col shrink-0">
                <div className="p-3 md:p-4 pb-1 shrink-0">
                  <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-1 flex items-center">
                    <Code className="mr-2 h-4 w-4" /> Python Scripts
                  </h3>
                </div>

                <div className="px-3 md:px-4 pb-3">
                  <ScriptSelector onScriptSelected={handleScriptSelected} />
                </div>
              </div>

              {/* Separator */}
              <div className="px-3 md:px-4 py-1 shrink-0">
                <Separator className="bg-pink-500/30 dark:bg-cyan-500/30" />
              </div>

              {/* Files section - fills remaining space */}
              <div className="flex flex-col flex-grow min-h-0">
                <div className="p-3 md:p-4 pb-1 pt-2 shrink-0">
                  <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-1 flex items-center">
                    <FileUp className="mr-2 h-4 w-4" /> IFC Files
                  </h3>
                </div>

                <div className="px-3 md:px-4 pb-6 flex-grow min-h-0 overflow-y-auto">
                  <FileManager
                    ref={fileManagerRef}
                    onFileSelected={handleFileSelected}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Main content */}
          <div className="lg:col-span-9 space-y-3 md:space-y-6 flex flex-col h-full">
            <Tabs
              defaultValue="viewer"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full flex flex-col h-full"
            >
              <TabsList className="w-full bg-black/50 border border-pink-500/50 p-1 rounded-xl dark:bg-gray-900/50 dark:border-cyan-500/50 shrink-0 flex-wrap">
                <TabsTrigger
                  value="viewer"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 dark:data-[state=active]:from-blue-500/20 dark:data-[state=active]:to-cyan-500/20 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400"
                >
                  <Layers className="mr-2 h-4 w-4" />
                  3D Viewer
                </TabsTrigger>
                <TabsTrigger
                  value="console"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 dark:data-[state=active]:from-blue-500/20 dark:data-[state=active]:to-cyan-500/20 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400"
                >
                  <Code className="mr-2 h-4 w-4" />
                  Console
                </TabsTrigger>
                <TabsTrigger
                  value="editor"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 dark:data-[state=active]:from-blue-500/20 dark:data-[state=active]:to-cyan-500/20 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Script Editor
                </TabsTrigger>
                {/* Add a new tab for results in the TabsList */}
                <TabsTrigger
                  value="results"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 dark:data-[state=active]:from-blue-500/20 dark:data-[state=active]:to-cyan-500/20 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400"
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Results
                </TabsTrigger>
              </TabsList>

              <div className="mt-3 md:mt-4 flex-grow flex flex-col min-h-0">
                <div
                  className={`flex-grow h-full ${
                    activeTab === "viewer" ? "block" : "hidden"
                  }`}
                >
                  <Card className="bg-black/50 border border-pink-500/50 backdrop-blur-sm rounded-xl overflow-hidden dark:bg-gray-900/50 dark:border-cyan-500/50 h-full flex flex-col">
                    <div className="p-3 md:p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-pink-500/50 dark:from-blue-900/50 dark:to-cyan-900/50 dark:border-cyan-500/50 flex justify-between items-center shrink-0">
                      <h2 className="text-xl font-bold text-cyan-400 dark:text-blue-400">
                        IFC Viewer
                      </h2>
                    </div>
                    <div className="relative flex-grow min-h-0">
                      <IFCViewer ifcData={selectedFile} />
                    </div>
                  </Card>
                </div>

                <div
                  className={`flex-grow h-full ${
                    activeTab === "console" ? "block" : "hidden"
                  }`}
                >
                  <Card className="bg-black/50 border border-pink-500/50 backdrop-blur-sm rounded-xl overflow-hidden dark:bg-gray-900/50 dark:border-cyan-500/50 h-full flex flex-col">
                    <div className="p-3 md:p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-pink-500/50 dark:from-blue-900/50 dark:to-cyan-900/50 dark:border-cyan-500/50 flex justify-between items-center shrink-0">
                      <h2 className="text-xl font-bold text-cyan-400 dark:text-blue-400">
                        Console Output
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-pink-400 text-pink-400 hover:bg-pink-950 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/30"
                        onClick={() => setConsoleOutput([])}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-grow overflow-hidden max-h-[70vh]">
                      <Console messages={consoleOutput} />
                      {ifcWorker.status === "error" && (
                        <div className="mt-4 p-4 bg-red-900/30 border border-red-500 rounded-md">
                          <h3 className="text-red-400 font-bold mb-2">
                            Error Initializing Environment
                          </h3>
                          <p className="text-gray-300 mb-2">
                            There was a problem loading the Python environment:
                          </p>
                          <p className="text-red-300">{ifcWorker.error}</p>
                          <Button
                            className="mt-4 bg-red-800 hover:bg-red-700 text-white"
                            onClick={() => setShowDebugConsole(true)}
                          >
                            Show Debug Console
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Add the new Script Editor tab */}
                <div
                  className={`flex-grow h-full ${
                    activeTab === "editor" ? "block" : "hidden"
                  }`}
                >
                  <Card className="bg-black/50 dark:bg-gray-900/50 border border-pink-500/50 dark:border-cyan-500/50 backdrop-blur-sm rounded-xl overflow-hidden h-full flex flex-col min-h-[calc(100vh-150px)]">
                    <ScriptEditor
                      scriptId={selectedScriptId}
                      onScriptChange={handleScriptChange}
                    />
                  </Card>
                </div>

                {/* Add the TabsContent for results */}
                <div
                  className={`flex-grow h-full ${
                    activeTab === "results" ? "block" : "hidden"
                  }`}
                >
                  <ResultsViewer results={results} />
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
      {showFallback && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <FallbackLoader onRetry={handleRetryInitialization} />
        </div>
      )}
      {showSimpleFallback && (
        <FallbackMode file={selectedFile} onClose={handleCloseSimpleFallback} />
      )}
      <footer className="relative z-10 p-3 md:p-4 border-t border-pink-500/50 dark:border-cyan-500/50 bg-black/50 dark:bg-gray-900/50 backdrop-blur-sm shrink-0">
        <div className="container-fluid mx-auto flex justify-end items-center text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/louistrue/ifc-playground"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-green-400 hover:text-cyan-400 dark:text-green-400 dark:hover:text-blue-400 transition-colors mr-3"
            >
              <Github className="h-4 w-4 mr-1" />
              <span>IFC Playground</span>
            </a>
            <span>Powered by</span>
            <a
              href="https://docs.ifcopenshell.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-pink-400 dark:text-blue-400 dark:hover:text-cyan-400 transition-colors"
            >
              IfcOpenShell
            </a>{" "}
            <a
              href="https://github.com/IfcOpenShell/wasm-wheels"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-cyan-400 dark:text-amber-400 dark:hover:text-blue-400 transition-colors"
            >
              WASM
            </a>{" "}
            <a
              href="https://github.com/ThatOpen/engine_web-ifc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-cyan-400 dark:text-green-400 dark:hover:text-blue-400 transition-colors"
            >
              Engine web-ifc
            </a>{" "}
            <a
              href="https://threejs.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-cyan-400 dark:text-blue-400 dark:hover:text-blue-400 transition-colors"
            >
              Three.js
            </a>{" "}
            | Created by{" "}
            <a
              href="https://www.lt.plus/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-blue-400 transition-colors"
            >
              lt.plus
            </a>
          </div>
        </div>
      </footer>
      {showDebugConsole && (
        <DebugConsole
          logs={ifcWorker.debugLogs || []}
          onClose={() => setShowDebugConsole(false)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        initialSettings={settings}
      />

      {/* Info Modal */}
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />

      {/* Fixed Run Script button with floating animation and glow effect */}
      <div className="fixed bottom-32 left-12 lg:left-12 z-50 animate-float w-auto lg:w-[calc(25%-6rem)]">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-cyan-500/30 rounded-xl blur-md animate-pulse opacity-70"></div>
        <Button
          className="w-full px-5 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white dark:from-blue-500 dark:to-cyan-600 dark:hover:from-blue-600 dark:hover:to-cyan-700 shadow-xl border-2 border-pink-500/50 dark:border-cyan-500/50 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105 font-bold relative"
          onClick={runScript}
          disabled={
            isProcessing ||
            !selectedScript ||
            (!selectedFile &&
              (!fileManagerRef.current ||
                fileManagerRef.current.getFiles().length === 0))
          }
        >
          <span className="relative z-10 flex items-center justify-center">
            {isProcessing ? (
              <>
                <Zap className="mr-2 h-5 w-5 animate-pulse text-yellow-300" />
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5 text-cyan-300" />
                Run Script
              </>
            )}
          </span>
        </Button>
      </div>
    </div>
  );
}
