import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  UserCog,
  CreditCard,
  LogOut,
  ChevronRight,
  Settings,
  Inbox,
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Usuários", url: "/admin/usuarios", icon: UserCog, adminOnly: true },
  { title: "Clientes", url: "/admin/clientes", icon: Users },
  { title: "Cartas", url: "/admin/cartas", icon: CreditCard },
  { title: "Solicitações", url: "/admin/leads", icon: Inbox },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings, adminOnly: true },
];


export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, signOut } = useAdminAuth();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <Sidebar collapsible="icon" className="border-r border-border">
          <SidebarContent>
            <div className="px-4 py-6">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">B</div>
                <span className="font-display font-bold text-primary">BBC Admin</span>
              </div>
            </div>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    if (item.adminOnly && role !== "admin") return null;
                    const active = currentPath === item.url || currentPath.startsWith(item.url + "/");
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link to={item.url} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto border-t border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
            <button
              onClick={() =>
                signOut().then(() => router.navigate({ to: "/login-admin" }))
              }
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-background/80 backdrop-blur">
            <SidebarTrigger />
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Painel Administrativo</span>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
