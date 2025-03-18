"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  PieChart,
  ListTree,
  Database,
  Layers,
  Table,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsViewerProps {
  results: Record<string, any> | null;
}

export function ResultsViewer({ results }: ResultsViewerProps) {
  // Don't set a default tab yet - we'll determine it based on available data
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<Record<string, string>>({});
  const [prevResultsId, setPrevResultsId] = useState<string | null>(null);

  if (!results) {
    return (
      <Card className="bg-black/50 dark:bg-gray-900/50 border border-pink-500/50 dark:border-cyan-500/50 backdrop-blur-sm rounded-xl overflow-hidden h-full flex items-center justify-center">
        <p className="text-gray-400">
          No results to display. Run a script to see results here.
        </p>
      </Card>
    );
  }

  // Create a "fingerprint" of the current results structure to detect changes
  const resultsFingerprint = JSON.stringify({
    hasGeometry: !!results.geometry,
    hasTypeCounts: !!results.type_counts,
    hasSpatialTree: !!results.spatial_tree,
    hasMaterials: !!results.material_usage,
    hasProperties: !!results.properties,
  });

  // Reset state when results structure changes
  useEffect(() => {
    if (prevResultsId !== resultsFingerprint) {
      setPrevResultsId(resultsFingerprint);
      setActiveTab(null); // Reset active tab to trigger auto-selection
      setViewMode({}); // Reset view modes to trigger defaults
    }
  }, [resultsFingerprint, prevResultsId]);

  // Determine which tabs to show based on available data
  const hasGeometry = !!results.geometry;
  const hasTypeCounts = !!results.type_counts;
  const hasSpatialTree = !!results.spatial_tree;
  const hasMaterials = !!results.material_usage;
  const hasProperties = !!results.properties;

  // Check for UI metadata
  const uiMetadata = results.__ui_metadata;

  // Set default active tab based on available data - prioritize structured views
  useEffect(() => {
    if (activeTab === null) {
      // Priority order for default tab
      if (hasProperties) {
        setActiveTab("properties");
      } else if (hasSpatialTree) {
        setActiveTab("structure");
      } else if (hasMaterials) {
        setActiveTab("materials");
      } else if (hasTypeCounts) {
        setActiveTab("types");
      } else {
        setActiveTab("raw");
      }
    }
  }, [activeTab, hasProperties, hasSpatialTree, hasMaterials, hasTypeCounts]);

  // Initialize view mode if metadata exists
  useEffect(() => {
    if (uiMetadata?.has_multiple_views && Object.keys(viewMode).length === 0) {
      const newViewMode: Record<string, string> = {};

      // Set defaults for each tab with multiple views
      if (hasProperties) {
        const defaultView = uiMetadata.default_view || "structured";
        newViewMode["properties"] = defaultView;
      }

      if (hasMaterials) {
        const defaultView = uiMetadata.default_view || "structured";
        newViewMode["materials"] = defaultView;
      }

      if (hasSpatialTree) {
        // Always use tree view for spatial structure regardless of metadata
        newViewMode["structure"] = "tree";
      }

      setViewMode(newViewMode);
    }
  }, [uiMetadata, viewMode, hasProperties, hasMaterials, hasSpatialTree]);

  // Handle view mode change
  const handleViewModeChange = (tab: string, mode: string) => {
    setViewMode((prev) => ({ ...prev, [tab]: mode }));
  };

  // Get current view mode for active tab
  const getCurrentViewMode = (tab: string) => viewMode[tab] || "raw";

  // Don't render until we've determined the active tab
  if (!activeTab) {
    return (
      <Card className="bg-black/50 dark:bg-gray-900/50 border border-pink-500/50 dark:border-cyan-500/50 backdrop-blur-sm rounded-xl overflow-hidden h-[400px] flex items-center justify-center">
        <p className="text-gray-400">Loading results...</p>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 dark:bg-gray-900/50 border border-pink-500/50 dark:border-cyan-500/50 backdrop-blur-sm rounded-xl overflow-hidden h-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col h-full"
      >
        <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 dark:from-blue-900/50 dark:to-cyan-900/50 border-b border-pink-500/50 dark:border-cyan-500/50 shrink-0">
          <TabsList className="bg-black/50 dark:bg-gray-900/50 border border-pink-500/50 dark:border-cyan-500/50 p-1 rounded-xl">
            {/* Put properties first if available */}
            {hasProperties && (
              <TabsTrigger
                value="properties"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 dark:data-[state=active]:from-blue-500/20 dark:data-[state=active]:to-cyan-500/20 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400"
              >
                <Layers className="mr-2 h-4 w-4" />
                Properties
              </TabsTrigger>
            )}

            {/* Structure tab */}
            {hasSpatialTree && (
              <TabsTrigger
                value="structure"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 dark:data-[state=active]:from-blue-500/20 dark:data-[state=active]:to-cyan-500/20 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400"
              >
                <ListTree className="mr-2 h-4 w-4" />
                Structure
              </TabsTrigger>
            )}

            {/* Materials tab */}
            {hasMaterials && (
              <TabsTrigger
                value="materials"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 dark:data-[state=active]:from-blue-500/20 dark:data-[state=active]:to-cyan-500/20 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400"
              >
                <PieChart className="mr-2 h-4 w-4" />
                Materials
              </TabsTrigger>
            )}

            {/* Types tab */}
            {hasTypeCounts && (
              <TabsTrigger
                value="types"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 dark:data-[state=active]:from-blue-500/20 dark:data-[state=active]:to-cyan-500/20 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400"
              >
                <BarChart className="mr-2 h-4 w-4" />
                Element Types
              </TabsTrigger>
            )}

            {/* Raw data tab - moved to the end */}
            <TabsTrigger
              value="raw"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 dark:data-[state=active]:from-blue-500/20 dark:data-[state=active]:to-cyan-500/20 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400"
            >
              <Database className="mr-2 h-4 w-4" />
              Raw Data
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
          {/* View Mode Toggle */}
          {uiMetadata?.has_multiple_views && uiMetadata.view_options && (
            <div className="flex justify-end p-2 border-b border-gray-800 shrink-0">
              <div className="inline-flex rounded-md shadow-sm bg-black/30">
                {uiMetadata.view_options.map((option: any) => (
                  <Button
                    key={option.id}
                    variant="ghost"
                    size="sm"
                    className={`${
                      getCurrentViewMode(activeTab) === option.id
                        ? "bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-400 border-b-2 border-cyan-400"
                        : "text-gray-400 hover:text-gray-300"
                    } text-xs px-3 py-1`}
                    onClick={() => handleViewModeChange(activeTab, option.id)}
                  >
                    {option.id === "structured" || option.id === "tree" ? (
                      <Layers className="mr-1 h-3 w-3" />
                    ) : (
                      <Table className="mr-1 h-3 w-3" />
                    )}
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-grow overflow-hidden">
            <ScrollArea className="h-full">
              <TabsContent value="raw" className="p-4">
                <pre className="text-xs text-gray-300 dark:text-gray-200 whitespace-pre-wrap">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </TabsContent>

              {hasTypeCounts && (
                <TabsContent value="types" className="p-4">
                  <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-4">
                    Element Types
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(results.type_counts)
                      .slice(0, 20)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center">
                          <div className="w-48 truncate text-gray-300 dark:text-gray-200">
                            {type}
                          </div>
                          <div className="flex-1">
                            <div className="h-6 bg-black/50 dark:bg-gray-800/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 dark:from-blue-500 dark:to-cyan-500 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ((Number(count) /
                                      Object.values(
                                        results.type_counts
                                      )[0]) as number) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-16 text-right text-cyan-400 dark:text-blue-400 ml-2">
                            {count}
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              )}

              {hasMaterials && (
                <TabsContent value="materials" className="p-4">
                  {getCurrentViewMode("materials") === "structured" &&
                  results.organized_materials ? (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-1">
                          Materials Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black/30 p-3 rounded-lg">
                            <p className="text-gray-400 text-sm">
                              Unique Materials
                            </p>
                            <p className="text-cyan-400 text-2xl">
                              {
                                results.organized_materials.summary
                                  .total_materials
                              }
                            </p>
                          </div>
                          <div className="bg-black/30 p-3 rounded-lg">
                            <p className="text-gray-400 text-sm">
                              Products with Materials
                            </p>
                            <p className="text-cyan-400 text-2xl">
                              {
                                results.organized_materials.summary
                                  .total_products_with_materials
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-2">
                        Top Materials by Usage
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(results.organized_materials.materials)
                          .slice(0, 15)
                          .map(([material, data]: [string, any]) => (
                            <div
                              key={material}
                              className="bg-black/20 p-2 rounded-lg"
                            >
                              <div className="flex items-center mb-1">
                                <div className="flex-1 font-medium text-gray-200">
                                  {material || "Unnamed"}
                                </div>
                                <div className="text-cyan-400 ml-2">
                                  {data.count} uses
                                </div>
                              </div>
                              <div className="text-xs text-gray-400">
                                Used in: {data.types.slice(0, 3).join(", ")}
                                {data.types.length > 3
                                  ? ` +${data.types.length - 3} more`
                                  : ""}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    // Raw view fallback
                    <div>
                      <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-4">
                        Materials
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(results.material_usage)
                          .slice(0, 20)
                          .map(([material, count]) => (
                            <div key={material} className="flex items-center">
                              <div className="w-48 truncate text-gray-300 dark:text-gray-200">
                                {material || "Unnamed"}
                              </div>
                              <div className="flex-1">
                                <div className="h-6 bg-black/50 dark:bg-gray-800/50 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 dark:from-cyan-500 dark:to-blue-500 rounded-full"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        ((Number(count) /
                                          Object.values(
                                            results.material_usage
                                          )[0]) as number) * 100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="w-16 text-right text-cyan-400 dark:text-blue-400 ml-2">
                                {count}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}

              {hasSpatialTree && (
                <TabsContent value="structure" className="p-4">
                  {getCurrentViewMode("structure") === "tree" ? (
                    <div>
                      <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-4">
                        Spatial Structure
                      </h3>
                      <div className="space-y-2">
                        <RenderSpatialTree node={results.spatial_tree} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-4">
                        Flat Structure View
                      </h3>
                      <div className="space-y-1">
                        {results.flat_structure.map((node: any) => (
                          <div
                            key={node.id}
                            className="flex items-center py-1 pl-4 hover:bg-black/20 rounded"
                          >
                            <div className="w-8 text-cyan-500 text-xs">
                              {node.level}
                            </div>
                            <div className="w-24 text-gray-400 text-xs">
                              {node.type}
                            </div>
                            <div className="flex-1 text-gray-200">
                              {node.name}
                            </div>
                            <div className="w-16 text-right text-gray-400 text-xs">
                              #{node.id}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}

              {hasProperties && (
                <TabsContent value="properties" className="p-4">
                  {getCurrentViewMode("properties") === "structured" &&
                  results.organized_properties ? (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-1">
                          Properties Summary
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-black/30 p-3 rounded-lg">
                            <p className="text-gray-400 text-sm">
                              Total Elements
                            </p>
                            <p className="text-cyan-400 text-2xl">
                              {
                                results.organized_properties.summary
                                  .total_elements
                              }
                            </p>
                          </div>
                          <div className="bg-black/30 p-3 rounded-lg">
                            <p className="text-gray-400 text-sm">
                              With Properties
                            </p>
                            <p className="text-cyan-400 text-2xl">
                              {
                                results.organized_properties.summary
                                  .elements_with_properties
                              }
                            </p>
                          </div>
                          <div className="bg-black/30 p-3 rounded-lg">
                            <p className="text-gray-400 text-sm">
                              Property Sets
                            </p>
                            <p className="text-cyan-400 text-2xl">
                              {
                                results.organized_properties.summary
                                  .property_sets_count
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-2">
                        Elements by Type
                      </h3>
                      {Object.entries(
                        results.organized_properties.element_types
                      ).map(([type, data]: [string, any]) => (
                        <div
                          key={type}
                          className="mb-4 bg-black/20 p-3 rounded-lg"
                        >
                          <div className="flex items-center mb-2">
                            <h4 className="text-md font-medium text-gray-200">
                              {type}
                            </h4>
                            <span className="ml-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                              {data.count}
                            </span>
                          </div>
                          <div className="pl-4">
                            {data.elements.slice(0, 3).map((element: any) => (
                              <div
                                key={element.id}
                                className="mb-2 border-l-2 border-gray-700 pl-3"
                              >
                                <div className="text-sm text-gray-300">
                                  {element.name}{" "}
                                  <span className="text-gray-500 text-xs">
                                    #{element.id}
                                  </span>
                                </div>
                                {Object.entries(element.property_sets)
                                  .slice(0, 2)
                                  .map(([psetName, props]: [string, any]) => (
                                    <div key={psetName} className="mt-1 mb-2">
                                      <div className="text-xs text-gray-500">
                                        {psetName}
                                      </div>
                                      <div className="grid grid-cols-2 gap-1 mt-1">
                                        {Object.entries(props)
                                          .slice(0, 4)
                                          .map(
                                            ([propName, value]: [
                                              string,
                                              any
                                            ]) => (
                                              <div
                                                key={propName}
                                                className="text-xs"
                                              >
                                                <span className="text-gray-400">
                                                  {propName}:{" "}
                                                </span>
                                                <span className="text-gray-300">
                                                  {String(value)}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        {Object.keys(props).length > 4 && (
                                          <div className="text-xs text-gray-500">
                                            +{Object.keys(props).length - 4}{" "}
                                            more properties
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                {Object.keys(element.property_sets).length >
                                  2 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    +
                                    {Object.keys(element.property_sets).length -
                                      2}{" "}
                                    more property sets
                                  </div>
                                )}
                              </div>
                            ))}
                            {data.elements.length > 3 && (
                              <div className="text-xs text-gray-500 mt-1 pl-3">
                                +{data.elements.length - 3} more elements
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Raw properties view
                    <div>
                      <h3 className="text-lg font-semibold text-pink-400 dark:text-cyan-400 mb-4">
                        Properties (Raw View)
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(results.properties).map(
                          ([elementKey, properties]: [string, any]) => (
                            <div
                              key={elementKey}
                              className="border border-gray-800 rounded p-2"
                            >
                              <div className="font-medium text-gray-300 mb-2">
                                {elementKey}
                              </div>
                              {Object.entries(properties).map(
                                ([psetName, props]: [string, any]) => (
                                  <div key={psetName} className="ml-4 mb-2">
                                    <div className="text-sm text-gray-400">
                                      {psetName}
                                    </div>
                                    <div className="ml-4 grid grid-cols-2 gap-x-4 gap-y-1">
                                      {Object.entries(props).map(
                                        ([propName, value]: [string, any]) => (
                                          <div
                                            key={propName}
                                            className="text-xs"
                                          >
                                            <span className="text-gray-500">
                                              {propName}:{" "}
                                            </span>
                                            <span className="text-gray-300">
                                              {String(value)}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}
            </ScrollArea>
          </div>
        </div>
      </Tabs>
    </Card>
  );
}

// Helper component to render the spatial tree recursively
function RenderSpatialTree({ node, level = 0 }: { node: any; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  if (!node) return null;

  return (
    <div className="ml-4">
      <div
        className="flex items-center cursor-pointer py-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {node.children && node.children.length > 0 ? (
          <div
            className={`mr-2 text-cyan-400 dark:text-blue-400 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            ▶
          </div>
        ) : (
          <div className="w-4 mr-2"></div>
        )}
        <div className="text-gray-300 dark:text-gray-200">
          <span className="text-pink-400 dark:text-cyan-400">{node.type}</span>
          {node.name && <span className="ml-2">&quot;{node.name}&quot;</span>}
          <span className="text-gray-500 ml-2">#{node.id}</span>
        </div>
      </div>

      {isExpanded && node.children && node.children.length > 0 && (
        <div className="border-l border-gray-700 dark:border-gray-600 pl-4 mt-1">
          {node.children.map((child: any, index: number) => (
            <RenderSpatialTree key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
