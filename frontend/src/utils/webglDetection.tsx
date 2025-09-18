// src/utils/webglDetection.tsx
import React from "react";

/**
 * Check if WebGL1 is available
 */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Check if WebGL2 is available
 */
export function isWebGL2Available(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGL2RenderingContext && canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

/**
 * Detect device capabilities for ResourceManager optimizations
 */
export function detectWebGLCapabilities() {
  const webglAvailable = isWebGLAvailable();
  const webgl2Available = isWebGL2Available();

  // Simple heuristic for low-power devices (could be extended)
  const isLowPowerDevice =
    navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency <= 2
      : false;

  return {
    webglSupport: webglAvailable,
    webgl2Support: webgl2Available,
    isLowPowerDevice,
  };
}

/**
 * Fallback React component if WebGL is not supported
 */
export function WebGLFallbackMessage() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: "20px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        zIndex: 9999,
      }}
    >
      <h2 style={{ marginBottom: "10px" }}>WebGL Not Supported</h2>
      <p>
        Your browser or device does not support WebGL, which is required for 3D
        visualizations. Please update your browser or switch to a WebGL-compatible
        one (like Chrome, Edge, or Firefox).
      </p>
    </div>
  );
}
