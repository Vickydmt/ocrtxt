"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface DocumentPreviewProps {
  imageUrl: string | null
  isProcessing?: boolean
}

export function DocumentPreview({ imageUrl, isProcessing = false }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 50))
  }

  const handleRotate = () => {
    setRotation((rotation + 90) % 360)
  }

  return (
    <Card className="flex flex-col h-full border overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Slider
            value={[zoom]}
            min={50}
            max={200}
            step={5}
            className="w-24"
            onValueChange={(value) => setZoom(value[0])}
          />
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="icon" onClick={handleRotate}>
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        {imageUrl ? (
          <div
            className="relative transition-transform duration-200 ease-in-out"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          >
            <img
              src={imageUrl || "/placeholder.svg"}
              alt="Document preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>No document uploaded</p>
            <p className="text-sm">Upload a document to see preview</p>
          </div>
        )}
      </div>
    </Card>
  )
}

