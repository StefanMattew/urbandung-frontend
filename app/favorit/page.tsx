'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FavoritPage() {
  const [favoriteCafes, setFavoriteCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }

    const savedUser = localStorage.getItem('geshare_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUserId(parsedUser.id);
      loadFavoritesFromDB(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadFavoritesFromDB = async (uId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${uId}/favorites`);
      const data = await res.json();
      if (!data.error) setFavoriteCafes(data);
    } catch (error) {
      console.error("Gagal memuat favorit:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const removeFavorite = async (e: any, cafeId: number) => {
    e.preventDefault();
    if (!userId) return;
    setFavoriteCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/favorites`, {        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId })
      });
    } catch (err) {
      console.error("Gagal menghapus dari DB");
    }
  };

  const checkCafeStatus = (cafe: any) => {
    if (cafe.is24Hours) return { isOpenNow: true, statusText: '🟢 Buka', timeText: '24 Jam Non-Stop' };
    if (!cafe.operationalHours) return { isOpenNow: false, statusText: '⚪ Cek Info', timeText: 'Jadwal belum diatur' };
    let opHours = cafe.operationalHours;
    if (typeof opHours === 'string') {
      try { opHours = JSON.parse(opHours); } catch(e) { return { isOpenNow: false, statusText: '⚪ Cek Info', timeText: 'Jadwal error' }; }
    }
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const todayIndex = now.getDay();
    const yesterdayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
    const todayHours = opHours[days[todayIndex]] || {};
    const yesterdayHours = opHours[days[yesterdayIndex]] || {};
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    let isOpenNow = false;
    if (yesterdayHours?.isOpen && yesterdayHours.open > yesterdayHours.close && currentTime < yesterdayHours.close) isOpenNow = true;
    if (!isOpenNow && todayHours?.isOpen) {
      if (todayHours.open <= todayHours.close) {
        if (currentTime >= todayHours.open && currentTime < todayHours.close) isOpenNow = true;
      } else {
        if (currentTime >= todayHours.open || currentTime < todayHours.close) isOpenNow = true;
      }
    }
    let timeText = '🔴 Tutup Hari Ini';
    if (todayHours?.isOpen) timeText = `🕒 ${todayHours.open} - ${todayHours.close} WIB`;
    return { isOpenNow, statusText: isOpenNow ? '🟢 Buka' : '🔴 Tutup', timeText };
  };

  const getCrowdBadge = (status: string) => {
    switch(status) {
      case 'sepi': return { label: '🟢 AREA KOSONG', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'ramai': return { label: '🟠 MULAI RAMAI', className: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'penuh': return { label: '🔴 MEJA PENUH', className: 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' };
      default: return { label: '🟡 NORMAL', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-[56px] md:top-[64px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 md:py-5">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">
            Koleksi <span className="text-red-500 italic">Favoritmu.</span>
          </h1>
          <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Daftar tempat nongkrong andalan yang telah kamu simpan.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="bg-stone-200 h-[400px] rounded-[2rem]"></div>)}
          </div>
        ) : favoriteCafes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favoriteCafes.map((cafe: any) => {
              const statusInfo = checkCafeStatus(cafe);
              const crowdBadge = getCrowdBadge(cafe.crowdStatus || 'normal');

              return (
                <Link href={`/cafe/${cafe.id}`} key={cafe.id} className="group cursor-pointer">
                  <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-stone-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative h-full flex flex-col">
                    
                    <button onClick={(e) => removeFavorite(e, cafe.id)} className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95">
                      <span className="text-xl leading-none block mt-[2px]">❤️</span>
                    </button>

                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                      {userLoc && cafe.latitude && cafe.longitude && (
                        <div className="bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md">
                          📍 {calculateDistance(userLoc.lat, userLoc.lng, parseFloat(cafe.latitude), parseFloat(cafe.longitude))} KM
                        </div>
                      )}
                      {cafe.avgRating && parseFloat(cafe.avgRating) > 0 ? (
                        <div className="bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 w-fit">
                          ⭐ {parseFloat(cafe.avgRating).toFixed(1)}
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-400 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 w-fit">
                          ⭐ 0.0
                        </div>
                      )}
                    </div>

                    <div className="h-[280px] w-full overflow-hidden relative bg-stone-100">
                      <img src={cafe.imageUrl || 'https://via.placeholder.com/600x400'} alt={cafe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic line-clamp-1 mb-2">{cafe.name}</h2>
                        
                        <div className="flex items-center flex-wrap gap-2 mb-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${statusInfo.isOpenNow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {statusInfo.statusText}
                          </span>
                          
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border ${crowdBadge.className}`}>
                            {crowdBadge.label}
                          </span>

                          <span className="text-xs font-bold text-stone-500">{statusInfo.timeText}</span>
                        </div>

                        <p className="text-blue-600 font-black text-sm mb-4">{cafe.priceRange}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {cafe.purpose?.slice(0, 3).map((p: string) => (
                            <span key={p} className="bg-stone-50 text-stone-600 text-[10px] font-bold px-2 py-1.5 rounded-lg uppercase tracking-widest border border-stone-200">{p}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-stone-100">
                        <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2.5 py-1 rounded uppercase tracking-widest">
                          {cafe.viewType} View
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[2.5rem] text-center border-2 border-dashed border-stone-200 shadow-sm animate-fade-in">
            <span className="text-6xl mb-4 block animate-bounce">💔</span>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Koleksimu Masih Kosong</h3>
            <p className="text-stone-500 mt-2 mb-8 font-bold uppercase text-xs tracking-widest">Kamu belum menandai kafe manapun sebagai favorit.</p>
            <Link href="/">
              <button className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                Mulai Eksplorasi
              </button>
            </Link>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}