'use client';
import { useEffect, useState, useRef,Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';


const PlaceCard = ({ place, mode, removeFavorite, checkStatus, getCrowdBadge, userLoc, calculateDistance }: any) => {
  const statusInfo = checkStatus(place);
  const crowdBadge = getCrowdBadge(place.crowdStatus || 'normal'); 
  const router = useRouter();
  
  const rawGallery = typeof place.gallery === 'string' ? JSON.parse(place.gallery) : (place.gallery || []);
  const allPhotos = [place.imageUrl, ...rawGallery].filter(Boolean);
  if (allPhotos.length === 0) allPhotos.push('https://via.placeholder.com/600x400');

  const [activeImg, setActiveImg] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: any) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.clientWidth;
    setActiveImg(Math.round(scrollLeft / width));
  };

  const scrollPrev = (e: any) => {
    e.preventDefault(); e.stopPropagation();
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -scrollRef.current.clientWidth, behavior: 'smooth' });
  };

  const scrollNext = (e: any) => {
    e.preventDefault(); e.stopPropagation();
    if (scrollRef.current) scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth, behavior: 'smooth' });
  };

  const safeParse = (data: any, fallback: any) => {
    if (!data) return fallback;
    if (typeof data === 'string') { try { return JSON.parse(data); } catch (e) { return fallback; } }
    return data;
  };
  const parsedPurpose = safeParse(place.purpose, []);
  const themeTextAccent = mode === 'cafe' ? 'text-blue-600' : 'text-orange-500';

  return (
    <div onClick={() => router.push(`/${mode}/${place.id}`)} className="group cursor-pointer bg-white rounded-[2rem] overflow-hidden shadow-sm border border-stone-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative h-full flex flex-col">
      
      {/* Tombol Hapus Favorit */}
      <button onClick={(e) => removeFavorite(e, place.id)} className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95">
        <span className="text-xl leading-none block mt-[2px]">❤️</span>
      </button>

      {/* Badge Atas Kiri */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        {userLoc && place.latitude && place.longitude && (
          <div className="bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md">
            📍 {calculateDistance(userLoc.lat, userLoc.lng, parseFloat(place.latitude), parseFloat(place.longitude))} KM
          </div>
        )}
        {place.avgRating && parseFloat(place.avgRating) > 0 ? (
          <div className="bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 w-fit">
            ⭐ {parseFloat(place.avgRating).toFixed(1)}
          </div>
        ) : (
          <div className="bg-gray-100 text-gray-400 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 w-fit">
            ⭐ 0.0
          </div>
        )}
        {mode === 'kuliner' && place.isHalal && (
          <div className="bg-green-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 w-fit">
            ✅ Halal
          </div>
        )}
      </div>

      {/* Galeri Swipeable */}
      <div className="h-[280px] w-full relative bg-stone-100 group/carousel">
        <div ref={scrollRef} onScroll={handleScroll} className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {allPhotos.map((photo: string, idx: number) => (
            <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
              <img src={photo} alt={`${place.name} ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {allPhotos.length > 1 && (
          <>
            <button onClick={scrollPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-md flex items-center justify-center text-gray-900 opacity-0 group-hover/carousel:opacity-100 transition-opacity active:scale-90 z-20 hidden md:flex">❮</button>
            <button onClick={scrollNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-md flex items-center justify-center text-gray-900 opacity-0 group-hover/carousel:opacity-100 transition-opacity active:scale-90 z-20 hidden md:flex">❯</button>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
              {allPhotos.map((_, idx) => <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${activeImg === idx ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/60'}`}></div>)}
            </div>
          </>
        )}
      </div>

      {/* Info Konten Bawah */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic line-clamp-1 mb-2">{place.name}</h2>
          
          <div className="flex items-center flex-wrap gap-2 mb-4">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${statusInfo.isOpenNow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {statusInfo.statusText}
            </span>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border ${crowdBadge.className}`}>
              {crowdBadge.label}
            </span>
            <span className="text-xs font-bold text-stone-500">{statusInfo.timeText}</span>
          </div>

          <p className={`${themeTextAccent} font-black text-sm mb-4`}>{place.priceRange}</p>
          
          <div className="flex flex-wrap gap-1.5 mb-4">
            {parsedPurpose.slice(0, 3).map((p: string) => (
              <span key={p} className="bg-stone-50 text-stone-600 text-[10px] font-bold px-2 py-1.5 rounded-lg uppercase tracking-widest border border-stone-200">{p}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-stone-100">
          <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2.5 py-1 rounded uppercase tracking-widest">
            {place.viewType || 'Indoor'} View
          </span>
        </div>
      </div>
    </div>
  );
};

function FavoritContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'cafe' | 'kuliner'>('cafe');
  const [favoritePlaces, setFavoritePlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  const themeTextAccent = mode === 'cafe' ? 'text-blue-600' : 'text-orange-500';
  const themeBgAccent = mode === 'cafe' ? 'bg-blue-600' : 'bg-orange-500';
  const themeHoverBtn = mode === 'cafe' ? 'hover:bg-blue-600' : 'hover:bg-orange-500';

  useEffect(() => {
    const currentMode = searchParams.get('mode') === 'kuliner' ? 'kuliner' : 'cafe';
    setMode(currentMode);
  }, [searchParams]);

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
      loadFavoritesFromDB(parsedUser.id, searchParams.get('mode') === 'kuliner' ? 'kuliner' : 'cafe');
    } else {
      router.push('/login');
    }
  }, [router, searchParams]);

  const loadFavoritesFromDB = async (uId: number, currentMode: string) => {
    setLoading(true);
    try {
      const resFav = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${uId}/favorites`);
      const favData = await resFav.json();
      
      if (!favData.error) {
        const favIds = favData.map((c: any) => c.id);
        const endpoint = currentMode === 'cafe' ? '/api/cafes' : '/api/kuliners';
        const resPlaces = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
        const allPlaces = await resPlaces.json();

        const myFavorites = allPlaces.filter((p: any) => favIds.includes(p.id));
        setFavoritePlaces(myFavorites);
      }
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

  const removeFavorite = async (e: any, placeId: number) => {
    e.preventDefault();
    if (!userId) return;
    
    setFavoritePlaces(prev => prev.filter(place => place.id !== placeId));
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, type: mode })
      });
    } catch (err) {
      console.error("Gagal menghapus dari DB");
    }
  };

  const checkStatus = (place: any) => {
    if (place.is24Hours) return { isOpenNow: true, statusText: '🟢 Buka', timeText: '24 Jam Non-Stop' };
    if (!place.operationalHours) return { isOpenNow: false, statusText: '⚪ Cek Info', timeText: 'Jadwal belum diatur' };
    let opHours = place.operationalHours;
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

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      
      {/* HEADER PUTIH ESTETIK */}
      <div className="bg-white border-b border-gray-200 sticky top-[56px] md:top-[64px] z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 md:py-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">
              Koleksi <span className={`${themeTextAccent} italic`}>Favoritmu.</span>
            </h1>
            <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              Daftar {mode === 'cafe' ? 'tempat nongkrong' : 'tempat makan'} andalan yang telah kamu simpan.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md ${themeBgAccent}`}>
              Mode: {mode === 'cafe' ? '☕ Kafe' : '🍲 Kuliner'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 relative z-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="bg-stone-200 h-[400px] rounded-[2rem]"></div>)}
          </div>
        ) : favoritePlaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {favoritePlaces.map((place: any) => (
              <PlaceCard 
                key={place.id} 
                place={place} 
                mode={mode}
                removeFavorite={removeFavorite} 
                checkStatus={checkStatus} 
                getCrowdBadge={getCrowdBadge} 
                userLoc={userLoc}
                calculateDistance={calculateDistance}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[2.5rem] text-center border-2 border-dashed border-stone-200 shadow-sm animate-fade-in">
            <span className="text-6xl mb-4 block animate-bounce">💔</span>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Koleksimu Masih Kosong</h3>
            <p className="text-stone-500 mt-2 mb-8 font-bold uppercase text-xs tracking-widest">Kamu belum menandai {mode === 'cafe' ? 'kafe' : 'tempat kuliner'} manapun sebagai favorit.</p>
            <Link href={`/explore?mode=${mode}`}>
              <button className={`bg-gray-900 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest ${themeHoverBtn} transition-all shadow-xl active:scale-95`}>
                Mulai Eksplorasi
              </button>
            </Link>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
export default function FavoritPage() {
    return (
        <Suspense fallback={<div className="text-center py-10">Memuat favoritmu... ❤️</div>}>
            <FavoritContent />
        </Suspense>
    )
}
