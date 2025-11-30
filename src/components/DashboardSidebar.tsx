import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { QrCode, List, Users, BarChart3, LogOut } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

interface DashboardSidebarProps {
  isAdmin: boolean
  userName?: string | null
}

export function DashboardSidebar({ isAdmin, userName }: DashboardSidebarProps) {
  const navigate = useNavigate()

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => navigate({ to: '/' }),
      },
    })
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <QrCode className="size-5" />
          <div className="flex flex-col">
            <span className="font-semibold">QR Generator</span>
            {userName && (
              <span className="text-xs text-muted-foreground">{userName}</span>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage Codes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/dashboard/codes/new"
                    activeOptions={{ exact: true }}
                    activeProps={{ 'data-active': true }}
                  >
                    <QrCode className="size-4" />
                    <span>Create New QR Code</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/dashboard/codes"
                    activeOptions={{ exact: true }}
                    activeProps={{ 'data-active': true }}
                  >
                    <List className="size-4" />
                    <span>Existing Codes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/dashboard/admin/users"
                      activeOptions={{ exact: true }}
                      activeProps={{ 'data-active': true }}
                    >
                      <Users className="size-4" />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/dashboard/admin/stats"
                      activeOptions={{ exact: true }}
                      activeProps={{ 'data-active': true }}
                    >
                      <BarChart3 className="size-4" />
                      <span>Stats</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
                <span>Sign out</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
