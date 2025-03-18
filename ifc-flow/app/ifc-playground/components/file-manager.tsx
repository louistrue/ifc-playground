"use client";

import type React from "react";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUp, File, Trash2, ChevronRight } from "lucide-react";

interface FileManagerProps {
  onFileSelected: (file: File) => void;
}

// Define the ref type
export interface FileManagerRef {
  getFiles: () => File[];
}

export const FileManager = forwardRef<FileManagerRef, FileManagerProps>(
  ({ onFileSelected }, ref) => {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(
      null
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Expose the files array through the ref
    useImperativeHandle(ref, () => ({
      getFiles: () => files,
    }));

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...newFiles]);
      }
    };

    const handleSelectFile = (index: number) => {
      setSelectedFileIndex(index);
      onFileSelected(files[index]);
    };

    const handleDeleteFile = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newFiles = [...files];
      newFiles.splice(index, 1);
      setFiles(newFiles);

      if (selectedFileIndex === index) {
        setSelectedFileIndex(null);
      } else if (selectedFileIndex !== null && selectedFileIndex > index) {
        setSelectedFileIndex(selectedFileIndex - 1);
      }
    };

    const triggerFileInput = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    return (
      <div className="space-y-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".ifc"
          className="hidden"
          multiple
        />

        <Button
          variant="outline"
          className="w-full border-pink-500 text-pink-400 hover:bg-pink-950/30 hover:text-pink-300"
          onClick={triggerFileInput}
        >
          <FileUp className="mr-2 h-4 w-4" />
          Upload IFC File
        </Button>

        {files.length > 0 ? (
          <ScrollArea className="max-h-[300px] rounded-md border border-pink-500/30 bg-black/30">
            <div className="p-1 space-y-1 pb-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className={`flex items-center p-2 rounded-md cursor-pointer ${
                    selectedFileIndex === index
                      ? "bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border-l-2 border-cyan-400"
                      : "hover:bg-white/5"
                  }`}
                  onClick={() => handleSelectFile(index)}
                >
                  <File
                    className={`h-4 w-4 mr-2 shrink-0 ${
                      selectedFileIndex === index
                        ? "text-cyan-400"
                        : "text-pink-400"
                    }`}
                  />
                  <span
                    className={`text-sm flex-1 truncate max-w-[calc(100%-40px)] ${
                      selectedFileIndex === index
                        ? "text-cyan-400"
                        : "text-white"
                    }`}
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <div className="flex space-x-1 shrink-0 ml-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-pink-950/30 text-pink-400"
                      onClick={(e) => handleDeleteFile(index, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {selectedFileIndex === index && (
                    <ChevronRight className="h-4 w-4 text-cyan-400 ml-1 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="min-h-[80px] rounded-md border border-pink-500/30 bg-black/30 flex items-center justify-center">
            <p className="text-gray-400 text-sm text-center px-4">
              No IFC files uploaded yet.
              <br />
              Upload a file to begin.
            </p>
          </div>
        )}
      </div>
    );
  }
);

// Add display name
FileManager.displayName = "FileManager";
