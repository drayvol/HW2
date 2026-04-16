"use client"

import { useState, useEffect } from "react"
import { History, ChevronDown, CheckCircle2, Clock, XCircle, Search, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type TaskStatus = "completed" | "pending" | "failed"

interface HistoryItem {
  id: number
  name: string
  status: TaskStatus
  model: string
  createdAt: string
  credits: number
  result?: string
}

interface HistoryTableProps {
  token: string
  apiBase: string
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    className: "text-primary bg-primary/10",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    className: "text-amber-500 bg-amber-500/10",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "text-destructive bg-destructive/10",
  },
}

export function HistoryTable({ token, apiBase }: HistoryTableProps) {
  const [search, setSearch] = useState("")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/history/me/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Ошибка загрузки истории")
      const data = await res.json()
      const mapped: HistoryItem[] = data.map((task: any) => ({
        id: task.id,
        name: task.name,
        status: task.status as TaskStatus,
        model: task.model_name,
        createdAt: new Date(task.created_at).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        credits: task.status === "completed" ? 10 : 0,
        result: task.result,
      }))
      setHistory(mapped)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const filteredHistory = history.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <History className="h-5 w-5 text-muted-foreground" />
          Prediction History
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border bg-background pl-9 text-foreground"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHistory}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Загрузка...
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Task ID</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Model</TableHead>
                    <TableHead className="text-muted-foreground">Result</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-right text-muted-foreground">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                        {search ? "Задачи не найдены" : "Истории задач пока нет"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory.map((item) => {
                      const status = statusConfig[item.status] ?? statusConfig["pending"]
                      const StatusIcon = status.icon
                      return (
                        <TableRow key={item.id} className="border-border hover:bg-accent/50">
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            #{item.id}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {item.name}
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                              status.className
                            )}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.model}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-mono text-xs text-muted-foreground" title={item.result}>
                            {item.result ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.createdAt}
                          </TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            {item.credits > 0 ? `-${item.credits}` : "0"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {filteredHistory.length} of {history.length} tasks</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}