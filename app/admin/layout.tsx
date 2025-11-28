"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  type MenuItem = {
    name: string;
    icon: any;
    href: string;
    roles: string[];
    className?: string;
  };

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      roles: ["ADMIN", "OPERADOR"],
    },
    {
      name: "Mensajes WhatsApp",
      icon: MessageCircle,
      href: "/admin/mensajes",
      roles: ["ADMIN", "OPERADOR"],
    },
    {
      name: "Citas",
      icon: Calendar,
      href: "/admin/citas",
      roles: ["ADMIN", "OPERADOR"],
    },
    {
      name: "Pacientes",
      icon: Users,
      href: "/admin/pacientes",
      roles: ["ADMIN", "OPERADOR"],
    },
    {
      name: "Usuarios",
      icon: Users,
      href: "/admin/usuarios",
      roles: ["ADMIN"],
    },
    {
      name: "Estadísticas",
      icon: BarChart3,
      href: "/admin/estadisticas",
      roles: ["ADMIN", "OPERADOR"],
    },
    {
      name: "Plantillas",
      icon: FileText,
      href: "/admin/plantillas",
      roles: ["ADMIN", "OPERADOR"],
    },
    {
      name: "Profesionales",
      icon: Users,
      href: "/admin/profesionales",
      roles: ["ADMIN"],
    },
    {
      name: "Configuración",
      icon: Settings,
      href: "/admin/configuracion",
      roles: ["ADMIN"],
    },
  ];

  const userRole = (user?.rol || "").toUpperCase();
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
            <div className="flex items-center gap-3">
              <Image src="/schedbot-logo.svg" alt="SchedBot Solutions" width={140} height={36} />
              <span className="hidden sm:inline text-sm text-gray-600">Panel de Administración</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-800">{user?.nombre}</p>
              <p className="text-xs text-gray-500">{user?.rol}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-white border-r transition-all duration-300 z-20 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="pt-20 pb-4">
          {/* Logo/Título */}
          <div className="px-6 mb-6">
            <div className="flex items-center gap-3">
              <Image src="/schedbot-logo.svg" alt="SchedBot Solutions" width={160} height={40} />
            </div>
          </div>

          {/* Menú */}
          <nav className="px-3">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isDisabled = item.className === "disabled";

              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                    active
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-16 ${
          sidebarOpen ? "ml-64" : "ml-0"
        } h-[calc(100vh-4rem)] flex flex-col`}
      >
        {/* Contenido interno ocupa todo el alto */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-800 border-t shadow-sm fixed bottom-0 left-0 right-0 z-30 h-16 flex items-center justify-center text-sm text-gray-300">
        © 2025 SchedBot Solutions - Sistema Administracion de Citas
      </footer>
    </div>
  );
}
