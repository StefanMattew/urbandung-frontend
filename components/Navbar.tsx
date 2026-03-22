'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const pathname = usePathname();

  useEffect(() => {
    const savedUser = localStorage.getItem('geshare_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('geshare_user');
    setUser(null);
    window.location.href = '/'; 
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm relative">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex justify-between items-center py-2 md:py-1.5"> 
          
          <Link href="/" className="flex items-center gap-2 z-50">
            <Image 
                src="/images/Urbandung2.png" 
                alt="Urbandung Logo" 
                width={140}   
                height={60} 
                className="h-10 md:h-12 w-auto object-contain hover:scale-105 transition-transform" 
                priority
            />
          </Link>

          <div className="hidden md:flex space-x-6 items-center h-full">
            <Link href="/" className={`relative py-4 text-sm font-bold transition-all ${isActive('/') ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>
              Eksplor
              {isActive('/') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>}
            </Link>
            
            <Link href="/favorit" className={`relative py-4 text-sm font-bold transition-all ${isActive('/favorit') ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>
              Favorit
              {isActive('/favorit') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>}
            </Link>
            
            {user?.role === 'ADMIN' && (
            <Link href="/admin" className={`relative py-4 text-[11px] font-black flex items-center gap-1 transition-all ${isActive('/admin') ? 'text-amber-600 bg-amber-50 px-3 rounded-lg' : 'text-amber-500 hover:text-amber-700 opacity-80'}`}>
                👑 Pusat Komando
                {isActive('/admin') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600 rounded-full"></span>}
            </Link>
            )}

            {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
            <Link href="/pengelola" className={`relative py-4 text-sm font-bold transition-all border-l pl-6 border-gray-300 ${isActive('/pengelola') ? 'text-indigo-700' : 'text-gray-500 hover:text-indigo-600'}`}>
                Area Pengelola
                {isActive('/pengelola') && <span className="absolute bottom-0 left-6 w-[calc(100%-24px)] h-0.5 bg-indigo-700 rounded-full"></span>}
            </Link>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-4 z-50">
            {user ? (
              <>
                <div className="text-[13px] font-bold text-gray-700 hidden md:block">
                  Halo, <span className="text-blue-600">{user.name}</span> 
                  <span className={`text-[9px] ml-2 px-2 py-0.5 rounded-full font-black text-white uppercase ${user.role === 'ADMIN' ? 'bg-red-500' : 'bg-gray-400'}`}>
                    {user.role}
                  </span>
                </div>
                <button onClick={handleLogout} className="hidden md:block text-red-600 font-bold hover:underline text-[13px] border-l border-gray-300 pl-4">
                  Keluar
                </button>
              </>
            ) : (
              <Link href="/login" className="hidden md:block">
                <button className="bg-gray-900 text-white px-4 py-1.5 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-sm text-xs">
                  Masuk / Daftar
                </button>
              </Link>
            )}

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden bg-gray-50 p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none border border-gray-200"
            >
              <span className="text-xl leading-none">{isMobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
          
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl py-4 px-6 flex flex-col gap-4 animate-fade-in z-40">
          {user && (
            <div className="border-b border-gray-100 pb-4 mb-2">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Masuk Sebagai</p>
              <p className="text-lg font-black text-gray-900">{user.name}</p>
              <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md font-black text-white uppercase ${user.role === 'ADMIN' ? 'bg-red-500' : 'bg-gray-400'}`}>
                {user.role}
              </span>
            </div>
          )}

          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`font-black text-lg ${isActive('/') ? 'text-blue-600' : 'text-gray-800'}`}>📍 Eksplor Bandung</Link>
          <Link href="/favorit" onClick={() => setIsMobileMenuOpen(false)} className={`font-black text-lg ${isActive('/favorit') ? 'text-blue-600' : 'text-gray-800'}`}>❤️ Favorit Saya</Link>
          
          {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
            <Link href="/pengelola" onClick={() => setIsMobileMenuOpen(false)} className={`font-black text-lg ${isActive('/pengelola') ? 'text-blue-600' : 'text-gray-800'}`}>🏪 Area Pengelola</Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className={`font-black text-lg ${isActive('/admin') ? 'text-red-600' : 'text-gray-800'}`}>👑 Pusat Komando</Link>
          )}

          <div className="pt-4 border-t border-gray-100 mt-2">
            {user ? (
              <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-black uppercase tracking-widest">Keluar Akun</button>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full bg-gray-900 text-white py-3 rounded-xl font-black uppercase tracking-widest">Masuk / Daftar</button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}