"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck } from "lucide-react"
import { authAPI } from "@/lib/api"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.target)
    const firstName = formData.get("firstName")
    const lastName = formData.get("lastName")
    const username = formData.get("username")
    const email = formData.get("email")
    const password = formData.get("password")
    const confirmPassword = formData.get("confirmPassword")

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    // Check password requirements
    if (!/(?=.*[a-z])/.test(password)) {
      setError("Password must contain at least one lowercase letter")
      setIsLoading(false)
      return
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      setError("Password must contain at least one uppercase letter")
      setIsLoading(false)
      return
    }

    if (!/(?=.*\d)/.test(password)) {
      setError("Password must contain at least one digit")
      setIsLoading(false)
      return
    }

    try {
      const userData = {
        username,
        email,
        password,
        full_name: `${firstName} ${lastName}`,
        role: "customer"
      }

      console.log('🚀 Starting registration with data:', { ...userData, password: '[REDACTED]' });
      
      const response = await authAPI.register(userData);
      console.log('✅ Registration response:', response);
      
      setSuccess("Registration successful! Please log in.")
      
      // Redirect to login after short delay
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      console.error('❌ Registration error:', err)
      console.error('❌ Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      
      // The API client now handles error formatting, so we can use the message directly
      setError(err.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter your information to create an account</p>
        </div>
        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-500 bg-green-50 border border-green-200 rounded-md">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" name="firstName" placeholder="John" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" name="lastName" placeholder="Doe" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  name="username" 
                  placeholder="johndoe" 
                  required 
                  minLength={3}
                  maxLength={50}
                  pattern="[a-zA-Z0-9_-]+"
                  title="Username must contain only letters, numbers, underscores, and hyphens (3-50 characters)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" placeholder="name@example.com" required type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" required type="password" />
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" name="confirmPassword" required type="password" />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link className="underline" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
