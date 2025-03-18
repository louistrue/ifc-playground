"use client";

import { FC } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  X,
  ExternalLink,
  Github,
  Code,
  Building2,
  Layers,
  Box as Cube,
  BookOpen,
  Heart,
} from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TechLinkProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const TechLink: FC<TechLinkProps> = ({
  href,
  title,
  icon,
  color,
  description,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex items-start p-3 rounded-lg transition-all duration-300 hover:scale-105 bg-black/30 border border-${color}/30 hover:border-${color} group backdrop-blur-sm`}
  >
    <div
      className={`mr-3 p-2 rounded-full bg-${color}/20 text-${color} group-hover:bg-${color}/30`}
    >
      {icon}
    </div>
    <div>
      <div className="flex items-center">
        <h4 className={`text-${color} font-semibold`}>{title}</h4>
        <ExternalLink
          className={`ml-1 h-3 w-3 text-${color}/70 group-hover:text-${color}`}
        />
      </div>
      <p className="text-gray-400 text-sm group-hover:text-gray-300">
        {description}
      </p>
    </div>
  </a>
);

export const InfoModal: FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-pink-500/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      <Card
        className="bg-black/90 border-2 border-pink-500/50 dark:border-cyan-500/50 text-white max-w-4xl relative overflow-hidden shadow-[0_0_25px_rgba(255,0,255,0.2)] dark:shadow-[0_0_25px_rgba(0,255,255,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br from-pink-500/20 to-transparent rounded-full blur-xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-full blur-xl"></div>

        <div className="p-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b-2 border-pink-500/50 dark:from-blue-900/50 dark:to-cyan-900/50 dark:border-cyan-500/50 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500 dark:from-blue-400 dark:via-cyan-500 dark:to-teal-400 text-transparent bg-clip-text drop-shadow-[0_0_5px_rgba(255,0,255,0.5)] dark:drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
              IFC Playground
            </h2>
            <p className="text-gray-300 mt-2 text-base">
              Explore, analyze and visualize BIM models with powerful web
              technologies
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-pink-950/50 dark:hover:bg-cyan-950/50 rounded-full h-10 w-10 transition-all duration-300"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <Building2 className="mr-2 h-6 w-6 text-pink-400 dark:text-cyan-400" />
                <h3 className="text-xl font-semibold text-pink-400 dark:text-cyan-400">
                  About IFC
                </h3>
              </div>
              <div className="pl-8 border-l-2 border-pink-500/30 dark:border-cyan-500/30">
                <p className="text-gray-300 dark:text-gray-200 leading-relaxed">
                  Industry Foundation Classes (IFC) is an open standard for
                  exchanging Building Information Modeling (BIM) data between
                  different software applications used in architecture,
                  engineering and construction. This standard enables
                  interoperability and collaboration across different
                  disciplines in the construction industry.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TechLink
                href="https://docs.ifcopenshell.org/"
                title="IfcOpenShell"
                icon={<Code className="h-5 w-5" />}
                color="cyan-400"
                description="Open source software library that processes IFC files with Python and C++ interfaces"
              />

              <TechLink
                href="https://github.com/IfcOpenShell/wasm-wheels"
                title="IFC WASM"
                icon={<Cube className="h-5 w-5" />}
                color="yellow-400"
                description="WebAssembly implementation of IfcOpenShell for browser-based processing"
              />

              <TechLink
                href="https://github.com/ThatOpen/engine_web-ifc"
                title="ThatOpen Engine"
                icon={<Github className="h-5 w-5" />}
                color="green-400"
                description="Web-based IFC parsing and rendering engine for 3D visualization"
              />

              <TechLink
                href="https://threejs.org/"
                title="Three.js"
                icon={<Layers className="h-5 w-5" />}
                color="blue-400"
                description="JavaScript 3D library powering the interactive model visualization"
              />
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex items-center">
                <BookOpen className="mr-2 h-6 w-6 text-pink-400 dark:text-cyan-400" />
                <h3 className="text-xl font-semibold text-pink-400 dark:text-cyan-400">
                  Available Scripts
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8 border-l-2 border-pink-500/30 dark:border-cyan-500/30">
                <div className="bg-black/30 p-4 rounded-lg border border-pink-500/30 dark:border-cyan-500/30 hover:border-pink-500/70 dark:hover:border-cyan-500/70 transition-colors">
                  <h4 className="font-semibold text-pink-400 dark:text-cyan-400">
                    Extract Geometry
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Extracts all geometric data from an IFC file for detailed
                    analysis
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-lg border border-pink-500/30 dark:border-cyan-500/30 hover:border-pink-500/70 dark:hover:border-cyan-500/70 transition-colors">
                  <h4 className="font-semibold text-pink-400 dark:text-cyan-400">
                    Count Elements
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Counts all elements by type for quantitative analysis
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-lg border border-pink-500/30 dark:border-cyan-500/30 hover:border-pink-500/70 dark:hover:border-cyan-500/70 transition-colors">
                  <h4 className="font-semibold text-pink-400 dark:text-cyan-400">
                    Extract Properties
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Extracts all properties from elements for comprehensive
                    review
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-lg border border-pink-500/30 dark:border-cyan-500/30 hover:border-pink-500/70 dark:hover:border-cyan-500/70 transition-colors">
                  <h4 className="font-semibold text-pink-400 dark:text-cyan-400">
                    Spatial Structure
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Analyzes the hierarchical spatial structure of a building
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-lg border border-pink-500/30 dark:border-cyan-500/30 hover:border-pink-500/70 dark:hover:border-cyan-500/70 transition-colors">
                  <h4 className="font-semibold text-pink-400 dark:text-cyan-400">
                    Material Analysis
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Extracts and analyzes all materials used in the model
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-pink-500/30 dark:border-cyan-500/30">
              <div className="flex items-center justify-center gap-2 text-center">
                <Heart className="h-4 w-4 text-pink-500 animate-pulse" />
                <p className="text-gray-400 text-sm">
                  Created with passion by{" "}
                  <a
                    href="https://www.lt.plus/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
                  >
                    lt.plus
                  </a>
                </p>
                <Heart className="h-4 w-4 text-pink-500 animate-pulse" />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t-2 border-pink-500/50 dark:border-cyan-500/50 bg-gradient-to-r from-purple-900/50 to-pink-900/50 dark:from-blue-900/50 dark:to-cyan-900/50 flex justify-end items-center">
          <a
            href="https://github.com/louistrue/ifc-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-pink-400 dark:hover:text-cyan-400 flex items-center transition-colors"
          >
            <Github className="h-4 w-4 mr-1" />
            View on GitHub
          </a>
        </div>
      </Card>
    </div>
  );
};
