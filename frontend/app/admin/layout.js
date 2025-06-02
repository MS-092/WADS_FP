import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function AdminLayout({ children }) {
  return <DashboardSidebar isAdmin={true}>{children}</DashboardSidebar>
}
