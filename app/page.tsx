'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic'; 

const CafeMap = dynamic(() => import('@/components/CafeMap'), { 
  ssr: false, 
  loading: () => <div className="h-[600px] w-full bg-stone-200 animate-pulse rounded-3xl flex items-center justify-center font-black text-stone-400 tracking-widest uppercase">Memuat Satelit... 🛰️</div> 
});

export default function ExplorePage() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState(''); 
  const [activePurpose, setActivePurpose] = useState('Semua');
  const [is24Hours, setIs24Hours] = useState(false);
  const [radius, setRadius] = useState(5); 
  const [sortBy, setSortBy] = useState('rekomendasi'); 
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [userLoc, setUserLoc] = useState({ lat: -6.914744, lng: 107.609810 });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  const purposeOptions = [
    { name: 'Semua', icon: '✨' },
    { name: 'Nugas / WFC', icon: '💻' },
    { name: 'Nongkrong Santai', icon: '🛋️' },
    { name: 'Estetik / Spot Foto', icon: '📸' },
    { name: 'Meeting / Diskusi', icon: '🤝' }
  ];

  const facilityOptions = ['WiFi', 'Colokan', 'AC', 'Smoking Area', 'Outdoor'];

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
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${parsedUser.id}/favorites`)
        .then(res => res.json())
        .then(data => { if (!data.error) setFavorites(data.map((c: any) => c.id)); })
        .catch(err => console.error(err));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/cafes?lat=${userLoc.lat}&lng=${userLoc.lng}&radius=${radius}`;
    if (activePurpose !== 'Semua') url += `&purpose=${encodeURIComponent(activePurpose)}`;
    if (is24Hours) url += `&is24Hours=true`;

    fetch(url)
      .then(res => res.json())
      .then(data => { setCafes(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [userLoc, activePurpose, is24Hours, radius]);

  const toggleFavorite = async (e: any, cafeId: number) => {
    e.preventDefault(); 
    if (!userId) return alert("⚠️ Silakan login terlebih dahulu untuk menyimpan kafe favorit!");

    const isFav = favorites.includes(cafeId);
    setFavorites(isFav ? favorites.filter(id => id !== cafeId) : [...favorites, cafeId]);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId })
      });
    } catch (err) { console.error(err); }
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities(prev => prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]);
  };

  let displayedCafes = [...cafes];

  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    displayedCafes = displayedCafes.filter((cafe: any) => 
      cafe.name.toLowerCase().includes(query) || 
      (cafe.address && cafe.address.toLowerCase().includes(query))
    );
  }

  if (selectedFacilities.length > 0) {
    displayedCafes = displayedCafes.filter((cafe: any) => {
      if (!cafe.facilities) return false;
      const cafeFacs = typeof cafe.facilities === 'string' ? JSON.parse(cafe.facilities) : cafe.facilities;
      return selectedFacilities.every(sf => cafeFacs.some((cf: string) => cf.toLowerCase().includes(sf.toLowerCase())));
    });
  }

  displayedCafes.sort((a: any, b: any) => {
    if (sortBy === 'rekomendasi') {
      const scoreA = (a.popularityScore || 0) + ((parseFloat(a.avgRating) || 0) * 10) - (((a.distance || 0) / 1000) * 5);
      const scoreB = (b.popularityScore || 0) + ((parseFloat(b.avgRating) || 0) * 10) - (((b.distance || 0) / 1000) * 5);
      return scoreB - scoreA;
    } else if (sortBy === 'populer') {
      return (b.popularityScore || 0) - (a.popularityScore || 0); 
    } else if (sortBy === 'rating') {
      return (parseFloat(b.avgRating) || 0) - (parseFloat(a.avgRating) || 0); 
    } else {
      return (a.distance || 0) - (b.distance || 0); 
    }
  });

  const checkCafeStatus = (cafe: any) => {
    if (cafe.is24Hours) return { isOpenNow: true, statusText: '🟢 Buka', timeText: '24 Jam Non-Stop' };
    if (!cafe.operationalHours) return { isOpenNow: false, statusText: '⚪ Cek Info', timeText: 'Jadwal belum diatur' };

    let opHours = cafe.operationalHours;
    if (typeof opHours === 'string') { try { opHours = JSON.parse(opHours); } catch(e) { return { isOpenNow: false, statusText: '⚪ Cek Info', timeText: 'Jadwal error' }; } }
    if (Object.keys(opHours).length === 0) return { isOpenNow: false, statusText: '⚪ Cek Info', timeText: 'Jadwal kosong' };

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date(); 
    const todayIndex = now.getDay(); 
    const yesterdayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
    const todayHours = opHours[days[todayIndex]] || {}; 
    const yesterdayHours = opHours[days[yesterdayIndex]] || {};
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    let isOpenNow = false;

    if (yesterdayHours.isOpen && yesterdayHours.open && yesterdayHours.close && yesterdayHours.open > yesterdayHours.close) {
      if (currentTime < yesterdayHours.close) isOpenNow = true;
    }
    if (!isOpenNow && todayHours.isOpen && todayHours.open && todayHours.close) {
      if (todayHours.open <= todayHours.close) { 
        if (currentTime >= todayHours.open && currentTime < todayHours.close) isOpenNow = true;
      } else { 
        if (currentTime >= todayHours.open || currentTime < todayHours.close) isOpenNow = true; 
      }
    }

    let timeText = '🔴 Tutup Hari Ini';
    if (todayHours.isOpen && todayHours.open && todayHours.close) timeText = `🕒 ${todayHours.open} - ${todayHours.close} WIB`;

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
      
      <div className="bg-stone-50 border-b border-stone-200 sticky top-[56px] md:top-[60px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
            
            <div className="flex bg-stone-200/50 p-1 rounded-xl w-fit border border-stone-200">
              <button 
                onClick={() => setViewMode('list')} 
                className={`flex items-center gap-2 px-5 py-1.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
              >
                📋 Daftar
              </button>
              <button 
                onClick={() => setViewMode('map')} 
                className={`flex items-center gap-2 px-5 py-1.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' : 'text-stone-500 hover:text-stone-900'}`}
              >
                🗺️ Peta
              </button>
            </div>

            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-stone-400">🔍</span>
              </div>
              <input 
                type="text" 
                className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-xl leading-5 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm" 
                placeholder="Cari nama kafe atau jalan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-red-500 font-black">
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden snap-x">
            {purposeOptions.map((opt) => (
              <button key={opt.name} onClick={() => setActivePurpose(opt.name)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-[11px] whitespace-nowrap transition-all shadow-sm snap-start border ${activePurpose === opt.name ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'}`}>
                <span className="text-base">{opt.icon}</span> {opt.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              
              <div className="flex items-center gap-2 bg-white border border-stone-200 px-3 py-1 rounded-lg shadow-sm">
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Jarak:</span>
                <input type="range" min="1" max="20" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-16 md:w-20 accent-blue-600" />
                <span className="text-xs font-black text-blue-600">{radius} km</span>
              </div>
              
              <button onClick={() => setIs24Hours(!is24Hours)} className={`flex items-center gap-2 px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all border shadow-sm ${is24Hours ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100'}`}>
                <div className={`w-2 h-2 rounded-full ${is24Hours ? 'bg-blue-600 animate-pulse' : 'bg-stone-300'}`}></div> 24 Jam
              </button>

              <div className="flex items-center gap-2 bg-white border border-stone-200 px-3 py-1 rounded-lg hover:bg-stone-100 transition-colors shadow-sm">
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Urutkan:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-[9px] font-black text-gray-900 outline-none cursor-pointer uppercase tracking-widest">
                  <option value="rekomendasi">🌟 Rekomendasi</option>
                  <option value="jarak">📍 Terdekat</option>
                  <option value="populer">🔥 Terpopuler</option>
                  <option value="rating">⭐ Rating Tertinggi</option>
                </select>
              </div>

            </div>

            <div className="hidden md:block w-px h-6 bg-stone-300 mx-1"></div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto [&::-webkit-scrollbar]:hidden">
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest mr-1">Fasilitas:</span>
              {facilityOptions.map(fac => (
                <button key={fac} onClick={() => toggleFacility(fac)}
                  className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm ${selectedFacilities.includes(fac) ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100'}`}>
                  {selectedFacilities.includes(fac) ? '✓ ' : ''}{fac}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="bg-stone-200 h-[400px] rounded-3xl"></div>)}
          </div>
        ) : displayedCafes.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl text-center border-2 border-dashed border-stone-200 mt-8 shadow-sm">
            <span className="text-6xl mb-4 block animate-bounce">🕵️‍♂️</span>
            <h3 className="text-xl font-black text-gray-900 uppercase">
              {searchQuery ? `"${searchQuery}" Tidak Ditemukan` : 'Kafe Tidak Ditemukan'}
            </h3>
            <p className="text-stone-500 mt-2">
              Coba kurangi filter fasilitas atau perbesar radius jarak pencarian.
            </p>
          </div>
        ) : viewMode === 'map' ? (
          
          <div className="animate-fade-in">
             <CafeMap cafes={displayedCafes} userLoc={userLoc} />
          </div>

        ) : (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {displayedCafes.map((cafe: any) => {
              const isFav = favorites.includes(cafe.id);
              const statusInfo = checkCafeStatus(cafe);
              const crowdBadge = getCrowdBadge(cafe.crowdStatus || 'normal'); 

              return (
                <Link href={`/cafe/${cafe.id}`} key={cafe.id} className="group cursor-pointer">
                  <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-stone-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative h-full flex flex-col">
                    
                    <button onClick={(e) => toggleFavorite(e, cafe.id)} className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95">
                      <span className="text-xl leading-none block mt-[2px]">{isFav ? '❤️' : '🤍'}</span>
                    </button>

                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                      {cafe.distance !== undefined && (
                        <div className="bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md">
                          📍 {(cafe.distance / 1000).toFixed(1)} KM
                        </div>
                      )}
                      {cafe.avgRating && parseFloat(cafe.avgRating) > 0 ? (
                        <div className="bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 w-fit">
                          ⭐ {parseFloat(cafe.avgRating).toFixed(1)}
                        </div>
                      ) : null}
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
                        {selectedFacilities.length > 0 && selectedFacilities.map(sf => {
                          const hasFac = (cafe.facilities || []).some((cf:string) => cf.toLowerCase().includes(sf.toLowerCase()));
                          return hasFac ? <span key={sf} className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-1 rounded uppercase tracking-widest">{sf}</span> : null;
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
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