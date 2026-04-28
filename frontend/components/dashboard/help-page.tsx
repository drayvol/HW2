"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, MessageCircle, FileText, ExternalLink } from "lucide-react"

const faqs = [
  {
    question: "How do I get started with predictions?",
    answer: "Upload an image file on the Dashboard or Upload page, select a model, and click 'Start Prediction'. Results will appear within seconds."
  },
  {
    question: "What file formats are supported?",
    answer: "We support PNG, JPG, JPEG, and WebP image formats up to 10MB in size."
  },
  {
    question: "How are credits charged?",
    answer: "Credits are deducted per prediction. LaTeX OCR v2 costs 5 credits, Math Formula Detector costs 8 credits per prediction."
  },
  {
    question: "Can I get a refund for failed predictions?",
    answer: "Yes, if a prediction fails due to a server error, credits are automatically refunded to your account."
  },
]

export function HelpPage() {
  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Help Center</h1>
        <p className="text-sm text-muted-foreground">Get help with ML Predict</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-base">Documentation</CardTitle>
            <CardDescription>Learn how to use the API</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="gap-2">
              View Docs <ExternalLink className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-base">Support</CardTitle>
            <CardDescription>Contact our support team</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="gap-2">
              Open Ticket <ExternalLink className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-base">API Reference</CardTitle>
            <CardDescription>Explore endpoints and schemas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="gap-2">
              View API <ExternalLink className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
                {index < faqs.length - 1 && <div className="border-b border-border pt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
