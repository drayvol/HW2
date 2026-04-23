"use client"

import { useState } from "react"
import { Wallet, Plus, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface BalanceCardProps {
  balance: number
  onTopUp: (amount: number) => void
}

export function BalanceCard({ balance, onTopUp }: BalanceCardProps) {
  const [amount, setAmount] = useState("")
  const [open, setOpen] = useState(false)

  const handleTopUp = () => {
    const value = parseInt(amount)
    if (value > 0) {
      onTopUp(value)
      setAmount("")
      setOpen(false)
    }
  }

  const quickAmounts = [100, 500, 1000]

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Credit Balance
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">
            {balance.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">credits</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3 text-primary" />
          <span>5 credits per prediction</span>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Top Up Credits
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Credits</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex gap-2">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt.toString())}
                    className="flex-1 border-border text-foreground hover:bg-accent"
                  >
                    {amt}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-border bg-background text-foreground"
              />
              <Button
                onClick={handleTopUp}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!amount || parseInt(amount) <= 0}
              >
                Add {amount || 0} Credits
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
