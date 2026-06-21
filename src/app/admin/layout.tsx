"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (pathname !== "/admin/login") {
          // Redireciona e mantém desautorizado/carregando para esconder as telas protegidas
          router.push("/admin/login");
          setAuthorized(false);
        } else {
          // Permite visualizar a tela de login
          setAuthorized(true);
          setLoading(false);
        }
      } else {
        if (pathname === "/admin/login") {
          // Redireciona logados para o dashboard e esconde a tela de login
          router.push("/admin/dashboard");
          setAuthorized(false);
        } else {
          // Permite ver o dashboard e outras telas protegidas
          setAuthorized(true);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f0e6]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return <div className="min-h-screen bg-[#f4f0e6]">{children}</div>;
}
