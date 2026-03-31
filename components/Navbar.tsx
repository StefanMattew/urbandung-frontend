'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [activeMode, setActiveMode] = useState<'cafe' | 'kuliner'>('cafe');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('geshare_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    const modeParam = searchParams.get('mode');
    if (modeParam === 'kuliner') setActiveMode('kuliner');
    else if (modeParam === 'cafe') setActiveMode('cafe');
  }, [searchParams]);

  const toggleMode = (mode: 'cafe' | 'kuliner') => {
    setActiveMode(mode);
    if (pathname.includes('/explore') || pathname.includes('/favorit')) {
      router.push(`${pathname}?mode=${mode}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('geshare_user');
    setUser(null);
    setIsProfileOpen(false);
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 z-50">
                <Image 
                    src="/images/Urbandung4.png" 
                    alt="Urbandung Logo" 
                    width={240}   
                    height={80} 
                    className="h-12 md:h-16 w-auto object-contain hover:scale-105 transition-transform" 
                    priority
                />
            </Link>

            <div className="hidden md:flex bg-gray-100 p-1 rounded-2xl shadow-inner border border-gray-200">
              <button 
                onClick={() => toggleMode('cafe')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === 'cafe' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ☕ Cari Kafe
              </button>
              <button 
                onClick={() => toggleMode('kuliner')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === 'kuliner' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                🍛 Cari Makan
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <Link 
              href={`/explore?mode=${activeMode}`} 
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${pathname.includes('/explore') ? (activeMode === 'cafe' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600') : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Explore {activeMode}
            </Link>
            
            {user && (
              <Link 
                href={`/favorit?mode=${activeMode}`} 
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${pathname.includes('/favorit') ? (activeMode === 'cafe' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600') : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Favorit {activeMode}
              </Link>
            )}

            {!user ? (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                <Link href="/login" className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-gray-900 transition-colors">Masuk</Link>
                <Link href="/login?mode=register" className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md transition-transform hover:scale-105 ${activeMode === 'cafe' ? 'bg-blue-600' : 'bg-orange-500'}`}>Daftar</Link>
              </div>
            ) : (
              <div className="relative ml-4 pl-4 border-l border-gray-200">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)} 
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-wider">{user.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm ${user.role === 'ADMIN' ? 'bg-purple-600' : user.role === 'OWNER' ? 'bg-green-600' : 'bg-gray-800'}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col animate-fade-in">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs font-black text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] font-bold text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <div className="p-2 flex flex-col gap-1">
                      {user.role === 'ADMIN' && (
                        <Link href="/admin" onClick={() => setIsProfileOpen(false)} className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-purple-600 hover:bg-purple-50 rounded-xl transition-colors">👑 Area Admin</Link>
                      )}
                      {(user.role === 'OWNER' || user.role === 'ADMIN') && (
                        <Link href="/pengelola" onClick={() => setIsProfileOpen(false)} className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-green-600 hover:bg-green-50 rounded-xl transition-colors">🏪 Area Pengelola</Link>
                      )}
                      <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">👤 Profil Saya</Link>
                    </div>

                    <div className="p-2 border-t border-gray-100">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-colors">Keluar Akun</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
              <span className="text-2xl">{isMobileOpen ? '×' : '≡'}</span>
            </button>
          </div>
        </div>
      </div>

      {isMobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 shadow-lg animate-fade-in">
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
            <button onClick={() => toggleMode('cafe')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === 'cafe' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>☕ Kafe</button>
            <button onClick={() => toggleMode('kuliner')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMode === 'kuliner' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'}`}>🍛 Kuliner</button>
          </div>

          <div className="flex flex-col space-y-2 mb-6">
            <Link href={`/explore?mode=${activeMode}`} onClick={() => setIsMobileOpen(false)} className="px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-gray-50 text-gray-800">Explore {activeMode}</Link>
            {user && <Link href={`/favorit?mode=${activeMode}`} onClick={() => setIsMobileOpen(false)} className="px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-gray-50 text-gray-800">Favorit {activeMode}</Link>}
          </div>

          {user ? (
            <div className="border-t border-gray-100 pt-4 flex flex-col space-y-2">
              <div className="px-4 py-2 mb-2">
                <p className="text-sm font-black text-gray-900">{user.name}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase">{user.role}</p>
              </div>
              {user.role === 'ADMIN' && <Link href="/admin/dashboard" onClick={() => setIsMobileOpen(false)} className="px-4 py-3 text-xs font-black uppercase tracking-widest text-purple-600 bg-purple-50 rounded-xl">👑 Area Admin</Link>}
              {(user.role === 'OWNER' || user.role === 'ADMIN') && <Link href="/pengelola/dashboard" onClick={() => setIsMobileOpen(false)} className="px-4 py-3 text-xs font-black uppercase tracking-widest text-green-600 bg-green-50 rounded-xl">🏪 Area Pengelola</Link>}
              <Link href="/profile" onClick={() => setIsMobileOpen(false)} className="px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-600 bg-gray-50 rounded-xl">👤 Profil Saya</Link>
              <button onClick={handleLogout} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-red-500 bg-red-50 rounded-xl mt-4">Keluar Akun</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <Link href="/login" onClick={() => setIsMobileOpen(false)} className="text-center px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-gray-100 text-gray-800">Masuk</Link>
              <Link href="/login?mode=register" onClick={() => setIsMobileOpen(false)} className={`text-center px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white ${activeMode === 'cafe' ? 'bg-blue-600' : 'bg-orange-500'}`}>Daftar</Link>
            </div>
          )}
        </div>
      )}
      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </nav>
  );
}