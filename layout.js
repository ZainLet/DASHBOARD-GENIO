import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  Target, 
  LogOut,
  Menu,
  X,
  GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Influenciadores",
    url: createPageUrl("Influencers"),
    icon: Users,
  },
  {
    title: "CRM Pipeline",
    url: createPageUrl("CRM"),
    icon: GitBranch,
  },
  {
    title: "Farm de Perfis",
    url: createPageUrl("Farm"),
    icon: Bot,
  },
  {
    title: "Rotina & Metas",
    url: createPageUrl("Assistant"),
    icon: Target,
  }
];

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Usuário não autenticado");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
        <style>
          {`
            :root {
              --background: 220 13% 9%;
              --foreground: 220 9% 95%;
              --card: 220 13% 9%;
              --card-foreground: 220 9% 95%;
              --popover: 220 13% 9%;
              --popover-foreground: 220 9% 95%;
              --primary: 142 76% 36%;
              --primary-foreground: 220 9% 95%;
              --secondary: 220 13% 15%;
              --secondary-foreground: 220 9% 95%;
              --muted: 220 13% 15%;
              --muted-foreground: 220 9% 65%;
              --accent: 220 13% 15%;
              --accent-foreground: 220 9% 95%;
              --destructive: 0 84% 60%;
              --destructive-foreground: 220 9% 95%;
              --border: 220 13% 15%;
              --input: 220 13% 15%;
              --ring: 142 76% 36%;
              --radius: 0.75rem;
              --sidebar-background: 220 13% 11%;
              --sidebar-foreground: 220 9% 95%;
              --sidebar-primary: 142 76% 36%;
              --sidebar-primary-foreground: 220 9% 95%;
              --sidebar-accent: 220 13% 16%;
              --sidebar-accent-foreground: 220 9% 95%;
              --sidebar-border: 220 13% 15%;
              --sidebar-ring: 142 76% 36%;
            }
            
            .dark {
              --background: 220 13% 9%;
              --foreground: 220 9% 95%;
              --card: 220 13% 9%;
              --card-foreground: 220 9% 95%;
              --popover: 220 13% 9%;
              --popover-foreground: 220 9% 95%;
              --primary: 142 76% 36%;
              --primary-foreground: 220 9% 95%;
              --secondary: 220 13% 15%;
              --secondary-foreground: 220 9% 95%;
              --muted: 220 13% 15%;
              --muted-foreground: 220 9% 65%;
              --accent: 220 13% 15%;
              --accent-foreground: 220 9% 95%;
              --destructive: 0 84% 60%;
              --destructive-foreground: 220 9% 95%;
              --border: 220 13% 15%;
              --input: 220 13% 15%;
              --ring: 142 76% 36%;
              --sidebar-background: 220 13% 11%;
              --sidebar-foreground: 220 9% 95%;
              --sidebar-primary: 142 76% 36%;
              --sidebar-primary-foreground: 220 9% 95%;
              --sidebar-accent: 220 13% 16%;
              --sidebar-accent-foreground: 220 9% 95%;
              --sidebar-border: 220 13% 15%;
              --sidebar-ring: 142 76% 36%;
            }
            
            * {
              border-color: hsl(var(--border));
            }
            
            body {
              background-color: hsl(var(--background));
              color: hsl(var(--foreground));
            }
          `}
        </style>
        
        <Sidebar className="border-r border-slate-700 bg-slate-900/90 backdrop-blur-xl">
          <SidebarHeader className="border-b border-slate-700 p-6 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-slate-900 font-bold text-lg">G</span>
              </div>
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Gênio IA
                </h2>
                <p className="text-xs text-slate-400">Sistema de Gestão</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3 bg-slate-900/30">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">
                Navegação
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-slate-800/60 hover:text-emerald-400 transition-all duration-300 rounded-xl p-3 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg' 
                            : 'text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-700 p-4 bg-slate-900/50">
            {user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl backdrop-blur-sm border border-slate-700/50">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                    <span className="text-slate-900 font-medium text-sm">
                      {user.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 text-sm truncate">{user.full_name || 'Usuário'}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    {user.role === 'admin' && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full mt-1 border border-emerald-500/30">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full border-slate-600 hover:bg-slate-800/60 hover:border-slate-500 text-slate-300 hover:text-slate-200 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-slate-900/40 backdrop-blur-xl border-b border-slate-700 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200 text-slate-300" />
              <h1 className="text-xl font-semibold text-slate-200">Gênio IA</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}