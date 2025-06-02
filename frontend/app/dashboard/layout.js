import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <DashboardSidebar>{children}</DashboardSidebar>
    </AuthGuard>
  )
}
