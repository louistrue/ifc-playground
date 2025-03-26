"use client";

import { useState, useEffect, useRef } from "react";

type WorkerStatus = "idle" | "initializing" | "ready" | "processing" | "error";

type WorkerMessage = {
  type: "init" | "run" | "progress" | "result" | "error" | "debug";
  script?: string;
  file?: ArrayBuffer;
  message?: string;
  data?: any;
};

type WorkerResult = {
  output: string;
  results: Record<string, any>;
};

export function useIfcWorker() {
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [progress, setProgress] = useState<string>("");
  const [result, setResult] = useState<WorkerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);

  // Initialize the worker
  useEffect(() => {
    // Create the worker
    if (typeof window !== "undefined" && window.Worker) {
      try {
        console.log("Creating worker...");
        
        // Check if we're on a mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        workerRef.current = new Worker(
          new URL("../workers/ifc-worker.ts", import.meta.url)
        );
        console.log("Worker created successfully", isMobile ? "(mobile mode)" : "");

        // For mobile devices, set up a periodic worker cleanup
        if (isMobile) {
          setDebugLogs((prev) => [...prev, "Mobile device detected, enabling worker memory safeguards"]);
        }

        // Set up message handler
        workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
          const { type, message, data } = event.data;

          switch (type) {
            case "progress":
              setProgress(message || "");
              console.log("Worker progress:", message);
              break;
            case "result":
              setResult(data);
              setStatus("ready");
              console.log("Worker result received");
              
              // On mobile, consider terminating and recreating the worker after successful operation
              // to prevent memory buildup
              if (isMobile && status === "processing") {
                console.log("Mobile safeguard: Scheduling worker cleanup after successful operation");
                setTimeout(() => {
                  if (workerRef.current && status === "ready") {
                    console.log("Mobile safeguard: Performing scheduled worker cleanup");
                    const oldWorker = workerRef.current;
                    
                    // Create a new worker first
                    workerRef.current = new Worker(
                      new URL("../workers/ifc-worker.ts", import.meta.url)
                    );
                    
                    // Set up the same handlers
                    workerRef.current.onmessage = oldWorker.onmessage;
                    workerRef.current.onerror = oldWorker.onerror;
                    
                    // Terminate the old one
                    oldWorker.terminate();
                    
                    console.log("Mobile safeguard: Worker replaced successfully");
                    setDebugLogs((prev) => [...prev, "Mobile safeguard: Worker replaced successfully"]);
                  }
                }, 2000);
              }
              break;
            case "ready":
              setStatus("ready");
              console.log("Worker ready:", message);
              break;
            case "error":
              setError(message || "Unknown error");
              setStatus("error");
              console.error("Worker error:", message);
              break;
            case "debug":
              console.log("Worker debug:", message);
              setDebugLogs((prev) => [...prev, message || ""]);
              break;
          }
        };

        // Handle worker errors
        workerRef.current.onerror = (error) => {
          console.error("Worker error event:", error);
          setError(error.message);
          setStatus("error");
          setDebugLogs((prev) => [...prev, `Worker error: ${error.message}`]);
        };
      } catch (err) {
        console.error("Error creating worker:", err);
        setError(err instanceof Error ? err.message : String(err));
        setDebugLogs((prev) => [
          ...prev,
          `Error creating worker: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ]);
      }
    } else {
      console.error("Web Workers not supported");
      setError("Web Workers are not supported in your browser.");
      setDebugLogs((prev) => [
        ...prev,
        "Web Workers not supported in this browser",
      ]);
    }

    // Clean up the worker when the component unmounts
    return () => {
      if (workerRef.current) {
        console.log("Terminating worker");
        workerRef.current.terminate();
      }
    };
  }, []);

  // Initialize the Python environment
  const initializeWorker = async () => {
    if (!workerRef.current) {
      const errorMsg = "Web Workers are not supported in your browser.";
      console.error(errorMsg);
      setError(errorMsg);
      setDebugLogs((prev) => [...prev, errorMsg]);
      return;
    }

    try {
      console.log("Initializing worker...");
      setStatus("initializing");
      setProgress("Initializing Python environment...");
      setError(null);
      setDebugLogs((prev) => [...prev, "Sending init message to worker"]);

      workerRef.current.postMessage({ type: "init" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Error initializing worker:", errorMsg);
      setError(errorMsg);
      setStatus("error");
      setDebugLogs((prev) => [
        ...prev,
        `Error initializing worker: ${errorMsg}`,
      ]);
    }
  };

  // Run a script on an IFC file
  const runScript = async (script: string, file: File) => {
    if (!workerRef.current) {
      const errorMsg = "Web Workers are not supported in your browser.";
      console.error(errorMsg);
      setError(errorMsg);
      setDebugLogs((prev) => [...prev, errorMsg]);
      return;
    }

    if (status !== "ready" && status !== "idle") {
      const errorMsg =
        "Worker is not ready. Please initialize first or wait for current operation to complete.";
      console.error(errorMsg);
      setError(errorMsg);
      setDebugLogs((prev) => [...prev, errorMsg]);
      return;
    }

    try {
      console.log("Running script...");
      setStatus("processing");
      setProgress("Reading file...");
      setError(null);
      setResult(null);

      // Read the file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      console.log(
        `File read successfully: ${file.name}, size: ${fileBuffer.byteLength} bytes`
      );
      setDebugLogs((prev) => [
        ...prev,
        `File read: ${file.name}, size: ${fileBuffer.byteLength} bytes`,
      ]);

      // Send the script and file to the worker
      workerRef.current.postMessage({
        type: "run",
        script,
        file: fileBuffer,
      });
      console.log("Sent script and file to worker");
      setDebugLogs((prev) => [...prev, "Sent script and file to worker"]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Error running script:", errorMsg);
      setError(errorMsg);
      setStatus("error");
      setDebugLogs((prev) => [...prev, `Error running script: ${errorMsg}`]);
    }
  };

  return {
    status,
    progress,
    result,
    error,
    debugLogs,
    initializeWorker,
    runScript,
  };
}
