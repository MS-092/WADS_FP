"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { authAPI } from "@/lib/api"

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  })

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: "", text: "" }), 5000)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      showMessage("error", "New passwords don't match")
      return
    }
    
    if (passwordData.new_password.length < 8) {
      showMessage("error", "Password must be at least 8 characters")
      return
    }
    
    setLoading(true)
    
    try {
      // Use the /change-password endpoint
      await authAPI.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      })
      showMessage("success", "Password changed successfully!")
    } catch (error) {
      showMessage("error", error.message || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security settings.
        </p>
      </div>

      {message.text && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <Tabs defaultValue="security" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Ensure your account is secure by using a strong password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      current_password: e.target.value
                    }))}
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        new_password: e.target.value
                      }))}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        confirm_password: e.target.value
                      }))}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Password requirements:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>At least 8 characters long</li>
                    <li>Include uppercase and lowercase letters</li>
                    <li>Include at least one number</li>
                  </ul>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 