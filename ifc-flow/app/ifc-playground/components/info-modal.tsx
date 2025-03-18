"use client";

import { FC } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="bg-black/90 border border-pink-500/50 dark:border-cyan-500/50 text-white max-w-3xl relative">
        <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-pink-500/50 dark:from-blue-900/50 dark:to-cyan-900/50 dark:border-cyan-500/50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 dark:text-blue-400">
              IFC Playground Information
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Learn about IFC, IfcOpenShell, and the available scripts
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-pink-950/50 dark:hover:bg-cyan-950/50"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="p-6 max-h-[60vh]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-2">
                About IFC
              </h3>
              <p className="text-gray-300 dark:text-gray-200">
                Industry Foundation Classes (IFC) is an open standard for
                exchanging building and construction industry data between
                different software applications.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-2">
                IfcOpenShell
              </h3>
              <p className="text-gray-300 dark:text-gray-200">
                IfcOpenShell is an open source software library that helps users
                and software developers to work with the IFC file format. The
                library features a Python interface, a C++ geometric modeling
                kernel and a Blender add-on.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-2">
                Available Scripts
              </h3>
              <ul className="list-disc list-inside text-gray-300 dark:text-gray-200 space-y-2">
                <li>
                  Extract Geometry - Extracts all geometric data from an IFC
                  file
                </li>
                <li>
                  Count Elements - Counts all elements by type in an IFC file
                </li>
                <li>
                  Extract Properties - Extracts all properties from elements
                </li>
                <li>
                  Spatial Structure - Analyzes the spatial structure of a
                  building
                </li>
                <li>
                  Material Analysis - Extracts and analyzes materials used
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-pink-500/50 dark:border-cyan-500/50 bg-gradient-to-r from-purple-900/50 to-pink-900/50 dark:from-blue-900/50 dark:to-cyan-900/50 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white dark:from-blue-500 dark:to-cyan-600 dark:hover:from-blue-600 dark:hover:to-cyan-700"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};
