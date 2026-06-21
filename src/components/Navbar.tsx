"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Shield } from 'lucide-react';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className="print:hidden sticky top-0 z-50 backdrop-blur-md bg-[#f4f0e6]/85 border-b border-gray-200/50 shadow-sm transition-all duration-200">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo e Título */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <Image 
            src="/logo-principal.png" 
            alt="Cifras Litúrgicas" 
            width={34} 
            height={34} 
            className="object-contain"
            priority
          />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg md:text-xl text-gray-800 tracking-wide select-none leading-none">
              Cifras Litúrgicas
            </span>
            <span className="text-[8px] md:text-[9px] text-primary-700/80 font-sans tracking-wider uppercase font-bold select-none mt-0.5">
              Paróquia de Santo Antônio • Antônio Martins
            </span>
          </div>
        </Link>

        {/* Link para o painel se logado */}
        {user && (
          <Link 
            href="/admin/dashboard" 
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#e4ded0] hover:bg-[#d4cdbd] text-gray-800 transition-colors border border-gray-300/40 shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-primary-700" />
            <span className="hidden sm:inline">Painel Admin</span>
            <span className="sm:hidden">Painel</span>
          </Link>
        )}
        
      </div>
    </nav>
  );
}
