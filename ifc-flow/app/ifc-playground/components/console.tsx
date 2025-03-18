"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConsoleProps {
  messages: string[];
}

export function Console({ messages }: ConsoleProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <ScrollArea className="h-full w-full bg-black/70 dark:bg-gray-900/70 font-mono text-sm">
      <div className="p-4 space-y-1">
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">Console is empty</p>
        ) : (
          messages.map((message, index) => {
            // Determine if it's an error message
            const isError = message.toLowerCase().includes("error");
            // Determine if it's a success message
            const isSuccess =
              message.toLowerCase().includes("complete") ||
              message.toLowerCase().includes("success");
            // Determine if it's a processing message
            const isProcessing = message.toLowerCase().includes("processing");

            let messageClass = "text-gray-300 dark:text-gray-200";
            if (isError) messageClass = "text-red-400";
            if (isSuccess) messageClass = "text-green-400";
            if (isProcessing)
              messageClass = "text-yellow-400 dark:text-amber-400";

            return (
              <div key={index} className={`${messageClass}`}>
                <span className="text-pink-400 dark:text-cyan-400">&gt; </span>
                {message}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
