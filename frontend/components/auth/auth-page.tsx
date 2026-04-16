"use client"

import { useState } from "react"
import { Cpu, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>
  onSignup: (email: string, password: string) => Promise<void>
}

export function AuthPage({ onLogin, onSignup }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isLogin && password !== confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    if (!isLogin && password.length < 6) {
      setError("Пароль должен быть не менее 6 символов")
      return
    }

    setIsLoading(true)
    try {
      if (isLogin) {
        await onLogin(email, password)
      } else {
        await onSignup(email, password)
        // после регистрации сразу входим
        await onLogin(email, password)
      }
    } catch (e: any) {
      setError(e.message || "Произошла ошибка")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-card border-r border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">ML Predict</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Transform images into<br />
            <span className="text-primary">actionable insights</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Upload your images and let our ML models extract LaTeX formulas, detect patterns, and provide accurate predictions in seconds.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">99.2%</div>
              <div className="text-sm text-muted-foreground">Accuracy rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{"<"}2s</div>
              <div className="text-sm text-muted-foreground">Avg response</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground">Predictions</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Trusted by researchers and developers worldwide
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Cpu className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">ML Predict</span>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold">
                {isLogin ? "Welcome back" : "Create account"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Enter your credentials to access your account"
                  : "Fill in your details to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Блок ошибки */}
                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{isLogin ? "Sign in" : "Create account"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(null) }}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}