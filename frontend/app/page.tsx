"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar, type PageId } from "@/components/dashboard/sidebar"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { UploadPanel } from "@/components/dashboard/upload-panel"
import { PredictionResult } from "@/components/dashboard/prediction-result"
import { HistoryTable } from "@/components/dashboard/history-table"
import { SettingsPage } from "@/components/dashboard/settings-page"
import { HelpPage } from "@/components/dashboard/help-page"
import { BillingPage } from "@/components/dashboard/billing-page"
import { AuthPage } from "@/components/auth/auth-page"

const API_BASE = "/api"

export interface PredictionData {
  taskId: number
  status: string
  model: string
  creditsCharged: number
  result?: string
}

function getToken() {
  return localStorage.getItem("token")
}

function getUserEmail() {
  const token = getToken()
  if (!token) return ""
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.user || ""
  } catch {
    return ""
  }
}
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activePage, setActivePage] = useState<PageId>("dashboard")
  const [balance, setBalance] = useState(0)
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const token = getToken()
    if (token) {
      fetchBalance().then(() => setIsAuthenticated(true)).catch(() => {
        localStorage.removeItem("token")
      })
    }
  }, [])

  // Поллинг результата задачи
  useEffect(() => {
    if (prediction && prediction.status === "pending") {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/predict/${prediction.taskId}/result`, {
            headers: authHeaders(),
          })
          if (!res.ok) return
          const data = await res.json()
          if (data.status === "completed" || data.status === "failed") {
            setPrediction((prev) => prev ? { ...prev, status: data.status, result: data.result } : prev)
            await fetchBalance()
            if (pollRef.current) clearInterval(pollRef.current)
          }
        } catch {}
      }, 3000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [prediction?.taskId, prediction?.status])

  const fetchBalance = async () => {
    const res = await fetch(`${API_BASE}/balance/me`, { headers: authHeaders() })
    if (!res.ok) throw new Error("Unauthorized")
    const data = await res.json()
    setBalance(data.balance)
  }

  const handleLogin = async (email: string, password: string) => {
    setError(null)
    const formData = new FormData()
    formData.append("username", email)
    formData.append("password", password)
    const res = await fetch(`${API_BASE}/auth/signin`, { method: "POST", body: formData })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data?.error?.message || "Ошибка входа")
    }
    const data = await res.json()
    localStorage.setItem("token", data.access_token)
    await fetchBalance()
    setIsAuthenticated(true)
  }

  const handleSignup = async (email: string, password: string) => {
    setError(null)
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data?.error?.message || "Ошибка регистрации")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    setBalance(0)
    setPrediction(null)
  }

  const handlePrediction = async (file: File, modelId: number, taskName: string) => {
    setIsLoading(true)
    setPrediction(null)
    setError(null)
    const formData = new FormData()
    formData.append("model_id", modelId.toString())
    formData.append("task_name", taskName)
    formData.append("image", file)
    try {
      const res = await fetch(`${API_BASE}/predict/me`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error?.message || "Ошибка предсказания")
      }
      const data = await res.json()
      setPrediction({
        taskId: data.task_id,
        status: data.status,
        model: data.model,
        creditsCharged: data.credits_charged,
        result: undefined,
      })
      setBalance(data.balance)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTopUp = async (amount: number) => {
    const res = await fetch(`${API_BASE}/balance/me/top-up`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data?.error?.message || "Ошибка пополнения")
    }
    const data = await res.json()
    setBalance(data.balance)
  }

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} onSignup={handleSignup} />
  }

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <>
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Upload images and get ML predictions</p>
              </div>
              <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground">
                Выйти
              </button>
            </header>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <BalanceCard balance={balance} onTopUp={handleTopUp} />
              </div>
              <div className="lg:col-span-2">
                <UploadPanel onSubmit={handlePrediction} isLoading={isLoading} />
              </div>
            </div>

            {(prediction || isLoading) && (
              <PredictionResult prediction={prediction} isLoading={isLoading} />
            )}
          </>
        )

      case "upload":
        return (
          <>
            <header>
              <h1 className="text-2xl font-semibold text-foreground">Upload</h1>
              <p className="text-sm text-muted-foreground">Upload files for prediction</p>
            </header>
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="max-w-2xl">
              <UploadPanel onSubmit={handlePrediction} isLoading={isLoading} />
            </div>
            {(prediction || isLoading) && (
              <PredictionResult prediction={prediction} isLoading={isLoading} />
            )}
          </>
        )

      case "history":
        return (
          <>
            <header>
              <h1 className="text-2xl font-semibold text-foreground">History</h1>
              <p className="text-sm text-muted-foreground">View your prediction history</p>
            </header>
            <HistoryTable token={getToken()!} apiBase={API_BASE} />
          </>
        )

      case "billing":
            return <BillingPage balance={balance} onTopUp={handleTopUp} token={getToken()!} apiBase={API_BASE} />

      case "settings":
        return  <SettingsPage email={getUserEmail()} />

      case "help":
        return <HelpPage />

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}