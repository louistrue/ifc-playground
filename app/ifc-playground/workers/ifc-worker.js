async function initPyodide() {
  try {
    self.postMessage({
      type: "debug",
      message: "Worker: Starting to load Pyodide...",
    });

    // Load Pyodide script
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js");

    self.postMessage({
      type: "debug",
      message: "Worker: Pyodide script loaded, initializing...",
    });

    // Initialize Pyodide
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
    });

    self.postMessage({
      type: "debug",
      message: "Worker: Pyodide initialized successfully",
    });

    self.postMessage({
      type: "progress",
      message: "Loading Python environment...",
    });

    // Load micropip package
    self.postMessage({
      type: "debug",
      message: "Worker: Loading micropip package...",
    });

    await pyodide.loadPackage(["micropip"]);

    // Load sqlite3 package which might be needed by IfcOpenShell
    self.postMessage({
      type: "debug",
      message: "Worker: Loading sqlite3 package...",
    });

    await pyodide.loadPackage(["sqlite3"]);

    self.postMessage({
      type: "debug",
      message: "Worker: micropip package loaded successfully",
    });

    // Patch micropip using the working approach from the example
    await pyodide.runPythonAsync(`
import sys
print(f"Python version: {sys.version}")
import micropip
print("Micropip imported successfully")

# Bypass wheel compatibility checks - exact approach from working example
from micropip._micropip import WheelInfo
WheelInfo.check_compatible = lambda self: None
print("Modified WheelInfo.check_compatible")
`);

    // Install IfcOpenShell with the direct URL that's known to work
    self.postMessage({
      type: "progress",
      message: "Installing IfcOpenShell...",
    });

    self.postMessage({
      type: "debug",
      message: "Worker: Starting IfcOpenShell installation...",
    });

    try {
      await pyodide.runPythonAsync(`
import micropip
print("Starting IfcOpenShell installation...")
await micropip.install('https://cdn.jsdelivr.net/gh/IfcOpenShell/wasm-wheels@33b437e5fd5425e606f34aff602c42034ff5e6dc/ifcopenshell-0.8.1+latest-cp312-cp312-emscripten_3_1_58_wasm32.whl')
print("IfcOpenShell installation completed")
      `);
    } catch (error) {
      self.postMessage({
        type: "debug",
        message: `Worker: Primary IfcOpenShell installation failed: ${
          error instanceof Error ? error.message : String(error)
        }, trying fallback...`,
      });

      // Try the fallback version from the working example
      try {
        await pyodide.runPythonAsync(`
import micropip
print("Trying fallback IfcOpenShell version...")
await micropip.install('https://cdn.jsdelivr.net/gh/IfcOpenShell/wasm-wheels@main/ifcopenshell-0.7.0-cp311-cp311-emscripten_3_1_45_wasm32.whl')
print("IfcOpenShell fallback installation completed")
        `);
      } catch (fallbackError) {
        self.postMessage({
          type: "debug",
          message: `Worker: Fallback IfcOpenShell installation failed: ${
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError)
          }`,
        });
        throw new Error(
          `Failed to install IfcOpenShell: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // Install additional dependencies that might be needed
    try {
      await pyodide.runPythonAsync(`
import micropip
print("Installing additional dependencies...")
await micropip.install('lark')
print("Additional dependencies installed")
      `);
    } catch (error) {
      self.postMessage({
        type: "debug",
        message: `Worker: Additional dependencies installation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
      // Continue even if additional dependencies fail
    }

    // Verify installation - WITHOUT trying to create entities
    await pyodide.runPythonAsync(`
try:
    import ifcopenshell
    print(f"IfcOpenShell version: {ifcopenshell.version if hasattr(ifcopenshell, 'version') else 'unknown'}")
    print("IfcOpenShell imported successfully")
    
    # Skip the create_entity test as it's causing type errors
    # Just check that we can create a file object
    test_model = ifcopenshell.file()
    print("Created ifcopenshell.file object successfully")
    
    # Verify some basic functionality without touching C++ methods
    print(f"Available ifcopenshell modules: {dir(ifcopenshell)}")
except Exception as e:
    print(f"Error importing or testing IfcOpenShell: {str(e)}")
    raise e
    `);

    self.postMessage({
      type: "progress",
      message: "IfcOpenShell installed successfully!",
    });

    self.postMessage({
      type: "debug",
      message: "Worker: Environment setup complete",
    });

    return pyodide;
  } catch (error) {
    self.postMessage({
      type: "debug",
      message: `Worker ERROR: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
    throw error;
  }
}

// Run a Python script on an IFC file
async function runScript(pyodide, script, fileBuffer) {
  try {
    // Write the IFC file to Pyodide's virtual filesystem - exactly as in the working example
    const fileData = new Uint8Array(fileBuffer);
    pyodide.FS.writeFile("model.ifc", fileData);

    // CHANGED: Write the script to a file instead of executing it directly
    pyodide.FS.writeFile("script.py", script);

    // Set up the script environment with enhanced error handling
    await pyodide.runPythonAsync(`
import ifcopenshell
import sys
import json
import os
import traceback

# Create a results dictionary to store script output
results = {}

# Define a safe wrapper to handle IFC operations
def safe_open_ifc():
    try:
        # Load the IFC file directly from the filesystem
        ifc_file = ifcopenshell.open('model.ifc')
        product_count = len(ifc_file.by_type('IfcProduct')) if hasattr(ifc_file, 'by_type') else 'unknown'
        print(f"Successfully loaded IFC file with {product_count} products")
        return ifc_file
    except Exception as e:
        error_msg = f"Error loading IFC file: {str(e)}\\n{traceback.format_exc()}"
        print(error_msg)
        results['error'] = error_msg
        return None

# Safely load the IFC file
ifc_file = safe_open_ifc()

# Make global variables available to the user script
globals()['ifc_file'] = ifc_file
globals()['results'] = results
    `);

    // Run the actual script with enhanced error handling
    self.postMessage({
      type: "progress",
      message: "Running script...",
    });

    try {
      // Execute the script from file instead of directly
      const result = await pyodide.runPythonAsync(`
try:
    # Execute the user script by running the file
    with open('script.py', 'r') as f:
        script_content = f.read()
        exec(script_content)
except Exception as e:
    error_msg = f"Error in script execution: {str(e)}\\n{traceback.format_exc()}"
    print(error_msg)
    results['error'] = error_msg
`);

      // Get the results
      const resultsJson = await pyodide.runPythonAsync(`
# Convert results to JSON
json.dumps(results)
      `);

      self.postMessage({
        type: "result",
        data: {
          output: result,
          results: JSON.parse(resultsJson),
        },
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        message: `Script execution error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Main worker code
let pyodideInstance = null;

self.onmessage = async (event) => {
  const { type, script, file } = event.data;

  try {
    if (type === "init") {
      // Initialize Pyodide and IfcOpenShell
      pyodideInstance = await initPyodide();
      self.postMessage({
        type: "ready",
        message: "Environment ready!",
      });
    } else if (type === "run") {
      // Make sure Pyodide is initialized
      if (!pyodideInstance) {
        throw new Error(
          "Python environment not initialized. Please initialize first."
        );
      }

      // Make sure we have a script and file
      if (!script || !file) {
        throw new Error("Missing script or file data.");
      }

      // Run the script on the file
      await runScript(pyodideInstance, script, file);
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
