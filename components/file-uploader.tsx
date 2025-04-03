"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, X, FileText } from "lucide-react"

interface FileUploaderProps {
  onFileSelected: (file: File) => void
}

export function FileUploader({ onFileSelected }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Check if file is an image or PDF
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      setFileName(file.name)
      onFileSelected(file)
    }
  }

  const removeFile = () => {
    setFileName(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="w-full">
      {!fileName ? (
        <div
          className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept="image/*,application/pdf"
          />

          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
            <h3 className="mb-1 font-semibold">Upload historical document</h3>
            <p className="text-sm text-muted-foreground mb-3">Support for images (JPG, PNG, TIFF) and PDF documents</p>
            <Button type="button" variant="secondary" size="sm">
              Select File
            </Button>
          </div>
        </div>
      ) : (
        <Card className="relative p-4 flex items-center">
          <div className="mr-4 flex-shrink-0">
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{fileName}</p>
            <p className="text-sm text-muted-foreground">Ready for processing</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="ml-2 text-muted-foreground hover:text-foreground"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </Card>
      )}
    </div>
  )
}

