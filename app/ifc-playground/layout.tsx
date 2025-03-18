import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "IFC Playground - Interactive IFC File Processing",
  description:
    "A retro-styled playground for interacting with IFC files using pre-made Python scripts via ifcopenshell WASM",
}

export default function IFCPlaygroundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen">{children}</div>
}

