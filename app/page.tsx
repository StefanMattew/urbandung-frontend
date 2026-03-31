'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col md:flex-row relative">
      
      {/* --- OPSI KAFE (KIRI / ATAS) --- */}
      <Link 
        href="/explore?mode=cafe" 
        className="flex-1 relative overflow-hidden group flex items-center justify-center min-h-[50vh] md:min-h-full bg-blue-600 cursor-pointer"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2000')] bg-cover bg-center opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent"></div>
        
        <div className="relative z-10 text-center p-8 transform group-hover:-translate-y-4 transition-transform duration-500">
          <div className="w-20 h-20 md:w-28 md:h-28 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/30 group-hover:bg-white transition-colors duration-500">
            <span className="text-4xl md:text-6xl group-hover:scale-110 transition-transform duration-500">☕</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4">
            Cari Kafe
          </h2>
          <p className="text-blue-100 font-bold tracking-widest uppercase text-xs md:text-sm max-w-xs mx-auto">
            Temukan spot nugas, nongkrong, dan wfc paling asyik di Bandung.
          </p>
          <div className="mt-8 inline-block px-8 py-3 rounded-full bg-white text-blue-600 font-black uppercase tracking-widest text-xs shadow-xl group-hover:bg-blue-900 group-hover:text-white transition-colors">
            Eksplor Kafe →
          </div>
        </div>
      </Link>

      {/* --- GARIS PEMISAH TENGAH (OPTIONAL AESTHETIC) --- */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex w-16 h-16 bg-white rounded-full items-center justify-center font-black text-xl shadow-2xl border-4 border-gray-100 text-gray-900 italic">
        VS
      </div>

      {/* --- OPSI KULINER (KANAN / BAWAH) --- */}
      <Link 
        href="/explore?mode=kuliner" 
        className="flex-1 relative overflow-hidden group flex items-center justify-center min-h-[50vh] md:min-h-full bg-orange-500 cursor-pointer"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000')] bg-cover bg-center opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/80 to-transparent"></div>
        
        <div className="relative z-10 text-center p-8 transform group-hover:-translate-y-4 transition-transform duration-500">
          <div className="w-20 h-20 md:w-28 md:h-28 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/30 group-hover:bg-white transition-colors duration-500">
            <span className="text-4xl md:text-6xl group-hover:scale-110 transition-transform duration-500">🍲</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4">
            Cari Makan
          </h2>
          <p className="text-orange-100 font-bold tracking-widest uppercase text-xs md:text-sm max-w-xs mx-auto">
            Dari street food legendaris sampai restoran keluarga paling hits.
          </p>
          <div className="mt-8 inline-block px-8 py-3 rounded-full bg-white text-orange-500 font-black uppercase tracking-widest text-xs shadow-xl group-hover:bg-orange-900 group-hover:text-white transition-colors">
            Eksplor Kuliner →
          </div>
        </div>
      </Link>

    </div>
  );
}