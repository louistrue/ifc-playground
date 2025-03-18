"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  CuboidIcon as Cube,
  Layers,
  Trash2,
} from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { IfcAPI } from "web-ifc";

// Define the WebIFC interface as expected by the window object
interface WindowWithWebIFC extends Window {
  WebIFC?: {
    IfcAPI: {
      new (): IfcAPI;
    };
  };
}

// Add global debug property to Window
declare global {
  interface Window {
    __debugChecked?: boolean;
  }
}

interface IFCViewerProps {
  ifcData?: File | null;
  isVisible?: boolean;
}

// Define IFCModel interface to fix TypeScript errors
interface IFCModel extends THREE.Group {
  modelID?: number;
}

// Helper functions outside the component
function processTypeCounts(typeCounts: any) {
  // Process and return formatted data
}

function processMaterialCounts(materialCounts: any) {
  // Process and return formatted data
}

export function IFCViewer({ ifcData, isVisible = true }: IFCViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"3d" | "wireframe">("3d");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);

  // References for scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const ifcApiRef = useRef<IfcAPI | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scriptLoadedRef = useRef(false);

  // Track initialization with a ref to ensure it persists across rerenders
  const hasInitializedRef = useRef(false);

  // Add a ref to track the animation running state
  const isAnimatingRef = useRef(true);

  // Helper function to get THREE geometry from web-ifc - defined here before it's used
  const getBufferGeometry = (
    api: IfcAPI,
    modelID: number,
    placedGeometry: {
      geometryExpressID: number;
      color: { x: number; y: number; z: number; w: number };
      flatTransformation: number[];
    }
  ): THREE.BufferGeometry => {
    const ifcGeometry = api.GetGeometry(
      modelID,
      placedGeometry.geometryExpressID
    );

    const verts = api.GetVertexArray(
      ifcGeometry.GetVertexData(),
      ifcGeometry.GetVertexDataSize()
    );

    const indices = api.GetIndexArray(
      ifcGeometry.GetIndexData(),
      ifcGeometry.GetIndexDataSize()
    );

    const bufferGeometry = new THREE.BufferGeometry();
    const posFloats = new Float32Array(verts.length / 2);
    const normFloats = new Float32Array(verts.length / 2);

    for (let i = 0; i < verts.length; i += 6) {
      posFloats[i / 2] = verts[i];
      posFloats[i / 2 + 1] = verts[i + 1];
      posFloats[i / 2 + 2] = verts[i + 2];

      normFloats[i / 2] = verts[i + 3];
      normFloats[i / 2 + 1] = verts[i + 4];
      normFloats[i / 2 + 2] = verts[i + 5];
    }

    bufferGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posFloats, 3)
    );
    bufferGeometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(normFloats, 3)
    );
    bufferGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

    ifcGeometry.delete();
    return bufferGeometry;
  };

  // Function to load the web-ifc script
  const loadWebIfcScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (scriptLoadedRef.current) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "/web-ifc-api-iife.js";
      script.async = true;
      script.onload = () => {
        console.log("web-ifc script loaded successfully");
        scriptLoadedRef.current = true;
        resolve();
      };
      script.onerror = (e) => {
        console.error("Failed to load web-ifc script", e);
        reject(new Error("Failed to load web-ifc script"));
      };
      document.head.appendChild(script);
    });
  };

  // Initialize three.js scene and IFC API
  useEffect(() => {
    if (!containerRef.current) return;
    if (hasInitializedRef.current && rendererRef.current && sceneRef.current) {
      console.log("Three.js scene already initialized");
      return;
    }

    console.log("Initializing Three.js scene and IFC API");

    // Initialize Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a3b4c); // Medium blue-gray background for better contrast
    sceneRef.current = scene;

    // Create camera with proper aspect ratio
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      logarithmicDepthBuffer: true, // Better for large models with varying scales
      preserveDrawingBuffer: true, // Required for Firefox to render properly
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Critical for performance with large models
    renderer.setClearColor(0x2a3b4c, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add a debug message directly to the canvas to confirm it's working
    const ctx = renderer.getContext();
    if (ctx && ctx.canvas instanceof HTMLCanvasElement) {
      ctx.canvas.style.border = "2px solid red";
      console.log("Added red border to canvas for visibility debugging");
    }

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Add directional lights from multiple angles for better coverage
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-5, 8, -5);
    directionalLight2.castShadow = true;
    scene.add(directionalLight2);

    // Add a hemisphere light for more natural lighting
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x303050, 0.6);
    scene.add(hemisphereLight);

    // Add grid and make it visible by default
    const grid = new THREE.GridHelper(50, 50, 0x0099ff, 0x333366);
    grid.visible = true; // Explicitly set visibility
    scene.add(grid);

    // Add axes at origin to help with orientation
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.visible = true;
    scene.add(axesHelper);

    // Add some default objects to make the empty scene more interesting
    const defaultObjects = new THREE.Group();
    defaultObjects.name = "DefaultSceneObjects";

    // Add a simple cube
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 4),
      new THREE.MeshStandardMaterial({
        color: generatePleasingColor(),
        metalness: 0.2,
        roughness: 0.5,
      })
    );
    cube.position.set(0, 2, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    defaultObjects.add(cube);

    // Add a ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -0.01; // Slightly below origin to avoid z-fighting with grid
    ground.receiveShadow = true;
    defaultObjects.add(ground);

    scene.add(defaultObjects);
    console.log("Added default scene objects");

    // Mark the scene as ready before IFC API initialization
    setIsSceneReady(true);

    // Add controls with better configuration
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 1.0;
    controls.rotateSpeed = 1.0;
    controls.minDistance = 1;
    controls.maxDistance = 1000;

    // Configure mouse buttons
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.DOLLY, // This enables right-click to zoom
    };

    // Mouse wheel for zooming is enabled by default
    // but we can explicitly set it to ensure it works
    controls.enableZoom = true;

    controls.update(); // Important: initialize controls
    controlsRef.current = controls;

    // Initialize IFC API
    const initializeIfcApi = async () => {
      try {
        setIsLoading(true);

        // First load the web-ifc script
        await loadWebIfcScript();

        // Try to access WebIFC from window object after script is loaded
        if (
          typeof window !== "undefined" &&
          (window as WindowWithWebIFC).WebIFC
        ) {
          console.log("WebIFC found in window object");
          const WebIFC = (window as WindowWithWebIFC).WebIFC;
          const ifcApi = new WebIFC!.IfcAPI();

          // Set WASM path to root - this path must match where web-ifc.wasm is located
          console.log("Setting WASM path to root directory");
          ifcApi.SetWasmPath("/", true);

          console.log("Initializing IFC API...");
          await ifcApi.Init();

          ifcApiRef.current = ifcApi;
          console.log("IFC API initialized successfully");
          setIsInitialized(true);
          hasInitializedRef.current = true;
        } else {
          // Fallback to direct import
          console.log("WebIFC not found in window, trying direct import");
          const ifcApi = new IfcAPI();
          ifcApi.SetWasmPath("/", true);
          await ifcApi.Init();

          ifcApiRef.current = ifcApi;
          console.log("IFC API initialized via direct import");
          setIsInitialized(true);
          hasInitializedRef.current = true;
        }
      } catch (error) {
        console.error("All initialization attempts failed:", error);
        alert(
          "Failed to initialize IFC API. Please check if web-ifc.wasm is in the public folder."
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeIfcApi();

    // Animation loop with debugging
    const animate = () => {
      if (!isAnimatingRef.current) {
        // Only request next frame, don't do expensive rendering
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Add this check to ensure objects in scene are visible
        if (sceneRef.current.children.length > 0 && !window.__debugChecked) {
          window.__debugChecked = true;
          console.log(
            "Render frame check - Scene has",
            sceneRef.current.children.length,
            "children"
          );

          // Check if any meshes have zero scale
          sceneRef.current.traverse((object) => {
            if ((object as THREE.Mesh).isMesh) {
              if (
                object.scale.x === 0 ||
                object.scale.y === 0 ||
                object.scale.z === 0
              ) {
                console.warn("Found mesh with zero scale:", object.name);
              }
            }
          });
        }

        // Firefox-specific fix: Force redraw on the first frame
        if (!rendererRef.current.domElement.dataset.firefoxFixApplied) {
          // Only apply once
          rendererRef.current.domElement.dataset.firefoxFixApplied = "true";

          // Force a small change to trigger proper rendering
          const originalClearColor = rendererRef.current.getClearColor(
            new THREE.Color()
          );
          const originalClearAlpha = rendererRef.current.getClearAlpha();

          // Change clear color slightly and render
          rendererRef.current.setClearColor(0xf0f0f1, 1);
          rendererRef.current.render(sceneRef.current, cameraRef.current);

          // Change back and render again
          rendererRef.current.setClearColor(
            originalClearColor,
            originalClearAlpha
          );
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Add a frustum helper to visualize camera view
    const frustumHelper = new THREE.CameraHelper(cameraRef.current);
    frustumHelper.name = "CameraFrustumHelper";
    sceneRef.current.add(frustumHelper);
    console.log("Added camera frustum helper");

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current)
        return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Trigger initial resize to ensure correct sizing
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [hasInitializedRef]);

  // Log when file changes
  useEffect(() => {
    if (ifcData) {
      console.log(
        `[IFCViewer] File selected: ${ifcData.name}, size: ${ifcData.size} bytes`
      );
    }
  }, [ifcData]);

  // Load IFC file when ifcData changes
  useEffect(() => {
    if (!ifcData || !isInitialized || !ifcApiRef.current || !sceneRef.current)
      return;

    const loadIfc = async () => {
      try {
        setIsLoading(true);
        console.log(`Loading IFC file: ${ifcData.name}`);

        // Clean up the scene before loading a new model
        cleanupScene();

        // Read file
        const data = await ifcData.arrayBuffer();
        console.log("File read as ArrayBuffer, size:", data.byteLength);

        const api = ifcApiRef.current;
        if (!api) {
          throw new Error("IFC API not initialized");
        }

        // Open model
        console.log("Opening IFC model");
        const modelID = api.OpenModel(new Uint8Array(data), {
          COORDINATE_TO_ORIGIN: true,
          USE_FAST_BOOLS: true,
        });
        console.log("Model opened with ID:", modelID);

        // Create container for the model
        const model = new THREE.Group() as IFCModel;
        model.name = ifcData.name;
        model.modelID = modelID;
        model.visible = true;
        modelRef.current = model;

        let elementCount = 0;
        let geometryCount = 0;

        // Load all meshes
        console.log("Streaming IFC meshes");

        try {
          console.log("Processing actual IFC geometry from model");

          // Extract all meshes from the IFC model
          api.StreamAllMeshes(modelID, (mesh) => {
            console.log(
              `Processing IFC element ${
                mesh.expressID
              } with ${mesh.geometries.size()} geometries`
            );

            // Process each placed geometry
            for (let i = 0; i < mesh.geometries.size(); i++) {
              const placedGeometry = mesh.geometries.get(i);

              // Get the geometry
              const geometry = getBufferGeometry(api, modelID, placedGeometry);

              // Create material
              const color = new THREE.Color(
                placedGeometry.color.x,
                placedGeometry.color.y,
                placedGeometry.color.z
              );

              const material = new THREE.MeshPhongMaterial({
                color: color,
                side: THREE.DoubleSide,
                transparent: placedGeometry.color.w !== 1,
                opacity: placedGeometry.color.w,
                wireframe: viewMode === "wireframe",
              });

              // Create mesh
              const mesh3js = new THREE.Mesh(geometry, material);

              // Apply transformation from IFC
              const matrix = new THREE.Matrix4();
              matrix.fromArray(placedGeometry.flatTransformation);
              mesh3js.applyMatrix4(matrix);

              // Add to model
              model.add(mesh3js);

              // Count
              geometryCount++;
            }

            elementCount++;
          });

          console.log(`Extracted geometry from ${elementCount} IFC elements`);
        } catch (error) {
          console.error("Error extracting IFC geometry:", error);

          // Fallback to a simple representation if geometry extraction fails
          const fallbackGroup = new THREE.Group();
          fallbackGroup.name = "FallbackGeometry";

          // Create a simple cube with warning color
          const cubeGeom = new THREE.BoxGeometry(10, 10, 10);
          const cubeMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            wireframe: true,
          });
          const cube = new THREE.Mesh(cubeGeom, cubeMat);
          cube.name = "FallbackCube";
          fallbackGroup.add(cube);

          // Add a text label to indicate there was an error
          const textSprite = createTextSprite("Error loading IFC geometry");
          textSprite.position.set(0, 12, 0);
          fallbackGroup.add(textSprite);

          model.add(fallbackGroup);
          console.warn("Using fallback geometry due to error");
        }

        // Log the processing results
        console.log(
          `Successfully processed ${elementCount} elements with ${geometryCount} geometries from IFC model`
        );

        // Add model to scene
        if (sceneRef.current) {
          sceneRef.current.add(model);
        }

        // Count meshes for performance optimization decisions
        let meshCount = 0;
        model.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            meshCount++;
          }
        });
        console.log(`Model contains ${meshCount} meshes`);

        // Center camera on model with improved positioning
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Calculate a good camera position based on model dimensions
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = cameraRef.current!.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;

        // Ensure minimum reasonable distance even for small models
        cameraZ = Math.max(cameraZ, 10);

        // Only add center marker for small models
        if (meshCount < 100) {
          const centerSphere = new THREE.Mesh(
            new THREE.SphereGeometry(maxDim * 0.02, 16, 16), // Scale relative to model
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
          );
          centerSphere.position.copy(center);
          centerSphere.name = "ModelCenterMarker";
          sceneRef.current!.add(centerSphere);
        }

        // Set camera position with better viewing angle
        const distanceMultiplier = 1.8; // Balanced view distance
        cameraRef.current!.position.set(
          center.x + cameraZ * 0.5, // More offset on X for better angle
          center.y + cameraZ * 0.6, // Some height but not too much
          center.z + cameraZ * distanceMultiplier // Further back
        );

        // Set controls target to model center
        controlsRef.current!.target.copy(center);
        cameraRef.current!.lookAt(center);
        controlsRef.current!.update();

        console.log("IFC file loaded successfully");

        // Debug position information
        console.log("Camera position:", cameraRef.current!.position);
        console.log("Model center:", center);
        console.log("Model size:", size);

        // Add visualization helpers for small/medium models
        if (meshCount < 1000) {
          // Add a helper box to visualize the model bounds
          const boxHelper = new THREE.Box3Helper(box, 0xff00ff);
          boxHelper.name = "ModelBoundingBox";
          sceneRef.current!.add(boxHelper);

          // Create axes helper at model center
          const axesHelper = new THREE.AxesHelper(
            Math.max(size.x, size.y, size.z) * 0.5
          );
          axesHelper.position.copy(center);
          axesHelper.name = "ModelAxesHelper";
          sceneRef.current!.add(axesHelper);

          // Add wireframe for very small models (less than 100 meshes)
          if (meshCount < 100) {
            const wireframeMaterial = new THREE.MeshBasicMaterial({
              color: 0x00ff00,
              wireframe: true,
              transparent: true,
              opacity: 0.3,
            });

            const debugModel = new THREE.Group();
            debugModel.name = "DebugWireframeModel";

            // Only process a sample of meshes if we have more than 20
            const processingLimit = meshCount > 20 ? 20 : meshCount;
            let processed = 0;

            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh && processed < processingLimit) {
                const originalMesh = child as THREE.Mesh;
                const debugMesh = new THREE.Mesh(
                  originalMesh.geometry, // Reference original geometry
                  wireframeMaterial
                );
                debugMesh.position.copy(originalMesh.position);
                debugMesh.rotation.copy(originalMesh.rotation);
                debugMesh.scale.copy(originalMesh.scale);
                debugMesh.matrix.copy(originalMesh.matrix);
                debugModel.add(debugMesh);
                processed++;
              }
            });

            sceneRef.current!.add(debugModel);
            console.log(`Added wireframe for ${processed} sample meshes`);
          }

          console.log("Added model visualization helpers");
        } else {
          console.log(
            `Skipped debug helpers for large model with ${meshCount} meshes`
          );
        }

        // Force visibility update on all scene objects
        sceneRef.current!.traverse((object) => {
          if (object.visible !== undefined) {
            object.visible = true;
          }
        });

        // Add a test cube to verify rendering is working
        const testCube = new THREE.Mesh(
          new THREE.BoxGeometry(5, 5, 5),
          new THREE.MeshBasicMaterial({ color: 0x00ffff })
        );
        testCube.position.set(0, 0, 0);
        testCube.name = "TestCube";
        sceneRef.current!.add(testCube);
        console.log("Added test cube at origin");

        // Try scaling the model to ensure it's visible
        console.log("Applying scale factor to model");
        model.scale.set(1, 1, 1); // Try default scale first

        // Ensure model has default scale
        console.log("Confirming model has correct scale");
        model.scale.set(1, 1, 1);

        // Dump scene graph for debugging
        console.log("Scene graph:");
        dumpSceneGraph(sceneRef.current!);
      } catch (error) {
        console.error("Error loading IFC file:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadIfc();
  }, [ifcData, isInitialized, viewMode]);

  // Toggle wireframe/solid view mode
  const toggleViewMode = () => {
    const newMode = viewMode === "3d" ? "wireframe" : "3d";
    setViewMode(newMode);

    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const material = (child as THREE.Mesh)
            .material as THREE.MeshPhongMaterial;
          if (material) {
            material.wireframe = newMode === "wireframe";
          }
        }
      });
    }
  };

  // Reset camera to original position
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;

    // If we have a model, center on it, otherwise use default position
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;

      cameraRef.current.position.set(
        center.x + cameraZ * 0.5,
        center.y + cameraZ * 0.5,
        center.z + cameraZ
      );
      controlsRef.current.target.copy(center);
    } else {
      cameraRef.current.position.set(10, 10, 10);
      controlsRef.current.target.set(0, 0, 0);
    }

    cameraRef.current.lookAt(controlsRef.current.target);
    controlsRef.current.update();
  };

  // Zoom functions
  const zoomIn = () => {
    if (!cameraRef.current || !controlsRef.current) return;

    // Get current distance to target
    const direction = new THREE.Vector3();
    direction.subVectors(
      cameraRef.current.position,
      controlsRef.current.target
    );
    const currentDistance = direction.length();

    // Calculate zoom factor - proportional to current distance
    // This makes zooming feel more natural at different distances
    const zoomFactor = Math.max(currentDistance * 0.1, 0.5);

    direction.normalize().multiplyScalar(zoomFactor);
    cameraRef.current.position.sub(direction);

    // Update controls but maintain orientation
    controlsRef.current.update();
  };

  const zoomOut = () => {
    if (!cameraRef.current || !controlsRef.current) return;

    // Get current distance to target
    const direction = new THREE.Vector3();
    direction.subVectors(
      cameraRef.current.position,
      controlsRef.current.target
    );
    const currentDistance = direction.length();

    // Calculate zoom factor - proportional to current distance
    const zoomFactor = Math.max(currentDistance * 0.1, 0.5);

    direction.normalize().multiplyScalar(zoomFactor);
    cameraRef.current.position.add(direction);

    // Update controls but maintain orientation
    controlsRef.current.update();
  };

  // Improved zoomExtents that preserves camera direction
  const zoomExtents = () => {
    if (!cameraRef.current || !controlsRef.current || !sceneRef.current) return;

    // Create bounding box to encompass all visible objects
    const box = new THREE.Box3();

    // If we have a model, use it
    if (modelRef.current) {
      box.setFromObject(modelRef.current);
    } else {
      // Otherwise use all visible objects in scene
      sceneRef.current.traverse((object) => {
        if ((object as THREE.Mesh).isMesh && object.visible) {
          box.expandByObject(object);
        }
      });
    }

    // Check if box is valid
    if (box.isEmpty() || !isFinite(box.min.x) || !isFinite(box.max.x)) {
      console.warn("Cannot zoom extents on empty scene");
      return;
    }

    // Get box center and size
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    // Set the controls target to the center of the model
    controlsRef.current.target.copy(center);

    // Calculate the distance needed to fit the object in view
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    const fitHeightDistance = maxDim / (2 * Math.tan(fov / 2));
    const fitWidthDistance = fitHeightDistance / cameraRef.current.aspect;
    const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.2; // 1.2 for padding

    // Get the current direction from target to camera (normalized)
    const direction = new THREE.Vector3()
      .subVectors(cameraRef.current.position, controlsRef.current.target)
      .normalize();

    // Set the camera position at the right distance along current view direction
    cameraRef.current.position
      .copy(center)
      .add(direction.multiplyScalar(distance));

    // Update controls
    controlsRef.current.update();

    console.log("Zoomed to extents while preserving camera direction");
  };

  // Helper function to dump scene graph for debugging
  const dumpSceneGraph = (obj: THREE.Object3D, indent: string = ""): void => {
    console.log(
      `${indent}${obj.name || "unnamed"} [${obj.type}] visible=${
        obj.visible
      } pos=(${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(
        2
      )}, ${obj.position.z.toFixed(2)}) scale=(${obj.scale.x.toFixed(
        2
      )}, ${obj.scale.y.toFixed(2)}, ${obj.scale.z.toFixed(2)})`
    );
    obj.children.forEach((child) => dumpSceneGraph(child, indent + "  "));
  };

  // Helper function to create a text sprite for error messages
  const createTextSprite = (message: string): THREE.Sprite => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 512;
    canvas.height = 128;

    if (context) {
      context.fillStyle = "rgba(0, 0, 0, 0.7)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.font = "24px Arial";
      context.fillStyle = "red";
      context.textAlign = "center";
      context.fillText(message, canvas.width / 2, canvas.height / 2);

      context.strokeStyle = "#FF4444";
      context.lineWidth = 4;
      context.strokeRect(0, 0, canvas.width, canvas.height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 2.5, 1);

    return sprite;
  };

  // Helper function to reset the scene to the default view
  const resetToDefaultView = () => {
    cleanupScene();
    console.log("Reset to default view");
  };

  // Reset to default view when ifcData becomes null or undefined
  useEffect(() => {
    if (!ifcData && isInitialized) {
      resetToDefaultView();
    }
  }, [ifcData, isInitialized]);

  // Add this function after the other helper functions
  const cleanupScene = () => {
    if (!sceneRef.current) return;

    // Remove the current model if it exists
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    // Remove all model-related debug helpers and objects
    const objectsToRemove: THREE.Object3D[] = [];
    sceneRef.current.traverse((object) => {
      // List of objects to remove (check by name)
      const debugObjectNames = [
        "ModelCenterMarker",
        "ModelBoundingBox",
        "ModelAxesHelper",
        "DebugWireframeModel",
        "TestCube",
        "CameraToCenterLine",
        "FallbackGeometry",
        "OriginMarker",
        "LargeAxesHelper",
        "ReferenceGrid",
      ];

      if (debugObjectNames.includes(object.name)) {
        objectsToRemove.push(object);
      }
    });

    // Remove all identified objects
    objectsToRemove.forEach((obj) => {
      sceneRef.current!.remove(obj);
    });

    // Restore default objects
    const defaultObjects = sceneRef.current.getObjectByName(
      "DefaultSceneObjects"
    );
    if (defaultObjects) {
      defaultObjects.visible = true;
    }

    // Reset camera position
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(10, 10, 10);
      controlsRef.current.target.set(0, 0, 0);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.update();
    }

    console.log(
      "Scene cleanup complete, removed",
      objectsToRemove.length,
      "objects"
    );
  };

  // Function to generate aesthetically pleasing random colors
  const generatePleasingColor = () => {
    // Use golden ratio for nice color distribution
    const goldenRatioConjugate = 0.618033988749895;

    // Start with a random hue
    let hue = Math.random();

    // Use the golden ratio to get a new hue value
    hue += goldenRatioConjugate;
    hue %= 1;

    // Convert HSL to RGB (with fixed saturation and lightness for pleasing colors)
    const h = hue;
    const s = 0.6; // Moderate saturation
    const l = 0.55; // Moderate lightness

    // HSL to RGB conversion
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    // Helper function for conversion
    const hueToRgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const r = hueToRgb(p, q, h + 1 / 3);
    const g = hueToRgb(p, q, h);
    const b = hueToRgb(p, q, h - 1 / 3);

    // Convert to hex format
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return parseInt(`0x${toHex(r)}${toHex(g)}${toHex(b)}`, 16);
  };

  // Effect to pause rendering when not visible
  useEffect(() => {
    isAnimatingRef.current = isVisible;
  }, [isVisible]);

  // Browser detection for compatibility notice
  const [isUnsupportedBrowser, setIsUnsupportedBrowser] = useState(false);

  useEffect(() => {
    // Check if browser is Firefox or Safari/Apple
    const userAgent = navigator.userAgent.toLowerCase();
    const isFirefox = userAgent.indexOf("firefox") !== -1;
    const isSafari =
      userAgent.indexOf("safari") !== -1 && userAgent.indexOf("chrome") === -1;
    const isApple = /(ipad|iphone|ipod|mac)/i.test(userAgent);

    setIsUnsupportedBrowser(isFirefox || isSafari || isApple);
  }, []);

  return (
    <div
      className="relative w-full h-full flex-grow"
      ref={containerRef}
      style={{
        minHeight: "500px",
        touchAction: "none", // Helps with touch events
        outline: "none", // Remove focus outline
        position: "relative", // Ensure proper positioning
        overflow: "hidden", // Prevent scroll issues
      }}
      tabIndex={0} // Make div focusable to capture keyboard events
    >
      {/* Browser compatibility notice - only for Firefox/Safari/Apple */}
      {isUnsupportedBrowser && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm border-b-2 border-pink-500/70 text-center py-3 px-4 text-base font-medium shadow-lg">
          <span className="text-cyan-400 text-xl">🌙</span>{" "}
          <span className="text-white text-lg">
            It was late at night when this browser&apos;s 3D support was being
            added...
          </span>{" "}
          <span className="text-pink-400 font-bold text-lg">
            Chrome works great for now!
          </span>{" "}
          <span className="text-purple-400 block mt-1 text-sm">
            (Full support coming soon 😴)
          </span>
        </div>
      )}

      {isLoading && !isSceneReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-pink-500 border-b-purple-500 border-l-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-cyan-400 animate-pulse">
            Initializing 3D viewer...
          </p>
        </div>
      )}

      {isLoading && isSceneReady && ifcData && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center bg-black/60 p-3 rounded-lg z-10">
          <div className="w-8 h-8 border-4 border-t-cyan-500 border-r-pink-500 border-b-purple-500 border-l-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-cyan-400 text-sm">
            {isInitialized ? "Loading IFC Model..." : "Initializing IFC API..."}
          </p>
        </div>
      )}

      {isSceneReady && !ifcData && !isLoading && (
        <div className="absolute bottom-20 right-5 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg max-w-xs text-center pointer-events-auto">
            <h3 className="text-lg font-bold text-cyan-400 mb-1">Ready</h3>
            <p className="text-white text-sm">
              Use file picker to load IFC model
            </p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm p-2 rounded-full border border-pink-500/50 z-10">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8 border-cyan-400 text-cyan-400 hover:bg-cyan-950"
          onClick={zoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8 border-cyan-400 text-cyan-400 hover:bg-cyan-950"
          onClick={zoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8 border-cyan-400 text-cyan-400 hover:bg-cyan-950"
          onClick={resetCamera}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8 border-cyan-400 text-cyan-400 hover:bg-cyan-950"
          onClick={zoomExtents}
          title="Zoom Extents"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8 border-red-400 text-red-400 hover:bg-red-950"
          onClick={() => {
            cleanupScene();
            // Also reset ifcData if you have access to the setter
            // setSelectedFile(null); // If you have this from a parent component
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full h-8 w-8 ${
            viewMode === "3d"
              ? "border-pink-400 text-pink-400 hover:bg-pink-950"
              : "border-cyan-400 text-cyan-400 hover:bg-cyan-950"
          }`}
          onClick={toggleViewMode}
        >
          {viewMode === "3d" ? (
            <Layers className="h-4 w-4" />
          ) : (
            <Cube className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
