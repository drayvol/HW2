"use client"

import { useState, useCallback } from "react"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface UploadPanelProps {
  onSubmit: (file: File, modelId: number, taskName: string) => void
  isLoading: boolean
}

const models = [
  { id: 1, name: "OCR", description: "Распознавание формул с изображения" },
]

export function UploadPanel({ onSubmit, isLoading }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [modelId, setModelId] = useState<string>("1")
  const [taskName, setTaskName] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((selectedFile: File) => {
    if (selectedFile.type.startsWith("image/")) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(selectedFile)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFile(droppedFile)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const clearFile = () => {
    setFile(null)
    setPreview(null)
  }

  const handleSubmit = () => {
    if (file && taskName) {
      onSubmit(file, parseInt(modelId), taskName)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">New Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground",
            preview && "border-solid border-border"
          )}
        >
          {preview ? (
            <div className="relative w-full p-4">
              <img
                src={preview}
                alt="Preview"
                className="mx-auto max-h-32 rounded-lg object-contain"
              />
              <button
                onClick={clearFile}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {file?.name}
              </p>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 p-6">
              <div className="rounded-full bg-accent p-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drop your image here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Task Name
            </label>
            <Input
              placeholder="e.g., Math equation scan"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="border-border bg-background text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Model</label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger className="border-border bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {models.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id.toString()}
                    className="text-foreground focus:bg-accent"
                  >
                    <div>
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {model.description}
                      </p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!file || !taskName || isLoading}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" />
              Run Prediction
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
