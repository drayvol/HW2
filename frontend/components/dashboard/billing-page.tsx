"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet, CreditCard, Receipt, TrendingUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface BillingPageProps {
  balance: number
  onTopUp: (amount: number) => Promise<void>
  token: string
  apiBase: string
}

interface Transaction {
  id: number
  transaction_type: string
  amount: number
  task_id: number | null
  created_at: string
}

const pricingPlans = [
  { credits: 100, popular: false },
  { credits: 500, popular: true },
  { credits: 1000, popular: false },
  { credits: 5000, popular: false },
]

export function BillingPage({ balance, onTopUp, token, apiBase }: BillingPageProps) {
  const [customAmount, setCustomAmount] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`${apiBase}/history/me/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setTransactions(data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const handlePurchase = async (credits: number) => {
    await onTopUp(credits)
    setDialogOpen(false)
    // обновить транзакции после пополнения
    fetch(`${apiBase}/history/me/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setTransactions(data))
      .catch(() => {})
  }

  const totalCharged = transactions
    .filter((t) => t.transaction_type === "charge")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalTopUp = transactions
    .filter((t) => t.transaction_type === "top_up")
    .reduce((sum, t) => sum + t.amount, 0)

  const predictionsCount = transactions.filter((t) => t.transaction_type === "charge").length

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage credits and view usage</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Current Balance</CardDescription>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{balance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">credits available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Spent</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totalCharged}</p>
            <p className="text-xs text-muted-foreground">credits used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Predictions</CardDescription>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{predictionsCount}</p>
            <p className="text-xs text-muted-foreground">total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Top Up</CardDescription>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totalTopUp}</p>
            <p className="text-xs text-muted-foreground">credits purchased</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Credits</CardTitle>
          <CardDescription>Choose a plan that fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.credits}
                className={`relative rounded-lg border p-4 transition-colors hover:border-primary/50 ${
                  plan.popular ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Popular
                  </span>
                )}
                <div className="mb-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{plan.credits.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">credits</p>
                </div>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePurchase(plan.credits)}
                >
                  Top Up
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <p className="mb-3 text-sm font-medium text-foreground">Custom Amount</p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter credits..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="max-w-xs"
              />
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!customAmount || parseInt(customAmount) < 1}>
                    Purchase Custom
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Purchase</DialogTitle>
                    <DialogDescription>
                      Top up {parseInt(customAmount || "0").toLocaleString()} credits?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => handlePurchase(parseInt(customAmount))}>Confirm</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent credits activity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Транзакций пока нет</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {tx.transaction_type === "top_up" ? "Пополнение баланса" : `Списание${tx.task_id ? ` — задача #${tx.task_id}` : ""}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${tx.transaction_type === "top_up" ? "text-green-500" : "text-foreground"}`}>
                    {tx.transaction_type === "top_up" ? "+" : "-"}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}