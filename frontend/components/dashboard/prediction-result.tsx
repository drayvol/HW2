"use client"

import { CheckCircle2, Copy, Loader2, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import type { PredictionData } from "@/app/page"

interface PredictionResultProps {
  prediction: PredictionData | null
  isLoading: boolean
}

export function PredictionResult({ prediction, isLoading }: PredictionResultProps) {
  const [copied, setCopied] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prediction?.result && previewRef.current) {
      import("katex").then((katex) => {
        try {
          katex.default.render(prediction.result!, previewRef.current!, {
            throwOnError: false,
            displayMode: true,
          })
        } catch {
          if (previewRef.current) {
            previewRef.current.textContent = prediction.result!
          }
        }
      })
    }
  }, [prediction?.result])

  const handleCopy = () => {
    if (prediction?.result) {
      navigator.clipboard.writeText(prediction.result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          Prediction Result
        </CardTitle>
        {prediction && (
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {prediction.status}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">Task #{prediction.taskId}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Processing your image...</p>
          </div>
        ) : prediction ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Model: {prediction.model}</span>
              <span>Credits used: {prediction.creditsCharged}</span>
            </div>

            {/* Сырой LaTeX */}
            <div className="relative rounded-lg bg-background p-4">
              <pre className="overflow-x-auto text-sm text-foreground">
                <code>{prediction.result ?? "Ожидание результата..."}</code>
              </pre>
              {prediction.result && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="absolute right-2 top-2 h-8 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>

            {/* Rendered Preview через KaTeX */}
            {prediction.result && (
              <div className="rounded-lg border border-border bg-accent/50 p-4">
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Rendered Preview
                </p>
                <div
                  ref={previewRef}
                  className="flex items-center justify-center py-4 text-foreground overflow-x-auto"
                />
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}