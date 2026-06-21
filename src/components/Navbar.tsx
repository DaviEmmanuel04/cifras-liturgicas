"use client";

import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
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
        
      </div>
    </nav>
  );
}
