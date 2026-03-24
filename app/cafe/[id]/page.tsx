'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const areaOptions = [
  '❄️ Indoor AC (Non-Smoking)', 
  '🚬 Indoor AC (Smoking)', 
  '⛅ Semi-Outdoor (Beratap)', 
  '☀️ Outdoor (Terbuka)'
];



export default function CafeDetail() {
  const params = useParams();
  const router = useRouter();
  
  const [cafe, setCafe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5); 
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);

  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const jsDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDayName = jsDays[new Date().getDay()];

  useEffect(() => {
    const savedUser = localStorage.getItem('geshare_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cafes/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) router.push('/');
        else setCafe(data);
      });

    fetchReviews();
  }, [params.id, router]);

  const fetchReviews = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cafes/${params.id}/reviews`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("⚠️ Silakan login terlebih dahulu untuk memberikan ulasan!");
    if (!newComment.trim()) return alert("Komentar tidak boleh kosong!");

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cafes/${params.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, rating: newRating, comment: newComment })
      });
      if (res.ok) {
        setNewComment('');
        setNewRating(5);
        fetchReviews(); 
        alert("✨ Terima kasih atas ulasanmu!");
      }
    } catch (err) {
      alert("Gagal mengirim ulasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; const dLat = (lat2 - lat1) * (Math.PI / 180); const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    return (R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))).toFixed(1);
  };

  const allPhotos = cafe ? [cafe.imageUrl, ...(cafe.gallery || [])].filter(Boolean) : [];
  const nextImage = useCallback(() => setCurrentImageIndex(p => p === null ? null : (p === allPhotos.length - 1 ? 0 : p + 1)), [allPhotos.length]);
  const prevImage = useCallback(() => setCurrentImageIndex(p => p === null ? null : (p === 0 ? allPhotos.length - 1 : p - 1)), [allPhotos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentImageIndex === null) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') setCurrentImageIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex, nextImage, prevImage]);

  const checkCafeStatus = (cafeData: any) => {
    if (cafeData.is24Hours) return { isOpenNow: true, statusText: '🟢 Buka Sekarang' };
    let opHours = cafeData.operationalHours;
    if (!opHours) return { isOpenNow: false, statusText: '⚪ Cek Info' };
    if (typeof opHours === 'string') { try { opHours = JSON.parse(opHours); } catch(e) { return { isOpenNow: false, statusText: '⚪ Cek Info' }; } }

    const now = new Date(); const todayIndex = now.getDay(); const yesterdayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
    const todayHours = opHours[jsDays[todayIndex]] || {}; const yesterdayHours = opHours[jsDays[yesterdayIndex]] || {};
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    let isOpenNow = false;

    if (yesterdayHours?.isOpen && yesterdayHours.open && yesterdayHours.close && yesterdayHours.open > yesterdayHours.close) {
      if (currentTime < yesterdayHours.close) isOpenNow = true;
    }
    if (!isOpenNow && todayHours?.isOpen && todayHours.open && todayHours.close) {
      if (todayHours.open <= todayHours.close) { if (currentTime >= todayHours.open && currentTime < todayHours.close) isOpenNow = true;
      } else { if (currentTime >= todayHours.open || currentTime < todayHours.close) isOpenNow = true; }
    }
    return { isOpenNow, statusText: isOpenNow ? '🟢 Buka Sekarang' : '🔴 Tutup Sekarang' };
  };


  const getCrowdBadge = (status: string) => {
    switch(status) {
      case 'sepi': return { label: '🟢 AREA KOSONG', className: 'bg-green-500 text-white shadow-green-500/50' };
      case 'ramai': return { label: '🟠 MULAI RAMAI', className: 'bg-orange-500 text-white shadow-orange-500/50' };
      case 'penuh': return { label: '🔴 MEJA PENUH', className: 'bg-red-600 text-white shadow-red-600/50 animate-pulse border-2 border-white' };
      case 'normal': return { label: '🟡 NORMAL', className: 'bg-yellow-400 text-gray-900 shadow-yellow-400/50' };
      default: return null;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black tracking-widest animate-pulse text-gray-400 uppercase">Memuat Ruang...</div>;
  if (!cafe) return null;

  const handleNavigation = () => window.open(`https://maps.google.com/?q={cafe.latitude},${cafe.longitude}`, '_blank');
  const statusInfo = checkCafeStatus(cafe);
  

  const crowdBadge = getCrowdBadge(cafe.crowdStatus);

  const rawFacs = cafe.facilities || [];
  const parsedFacs = typeof rawFacs === 'string' ? JSON.parse(rawFacs) : rawFacs;
  const cafeAreas = parsedFacs.filter((f: string) => areaOptions.includes(f));
  const regularFacs = parsedFacs.filter((f: string) => !areaOptions.includes(f));

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 pt-[70px] md:pt-[80px] font-sans relative">      

      {currentImageIndex !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" onClick={() => setCurrentImageIndex(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white text-5xl font-black hover:scale-110 transition-all z-50">×</button>
          {allPhotos.length > 1 && <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 md:left-10 text-white/50 hover:text-white text-5xl md:text-7xl font-light hover:scale-110 transition-all z-50 p-4">❮</button>}
          <img src={allPhotos[currentImageIndex]} alt="Zoom" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl animate-scale-in object-contain" onClick={(e) => e.stopPropagation()} />
          {allPhotos.length > 1 && <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 md:right-10 text-white/50 hover:text-white text-5xl md:text-7xl font-light hover:scale-110 transition-all z-50 p-4">❯</button>}
          <div className="absolute bottom-8 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full text-white font-bold tracking-widest text-sm">{currentImageIndex + 1} / {allPhotos.length}</div>
        </div>
      )}

    <div className="w-full h-[250px] md:h-[350px] bg-black relative overflow-hidden">        <img src={cafe.imageUrl || '/placeholder-cafe.jpg'} alt={cafe.name} className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] via-black/50 flex items-end p-10">
          <div className="max-w-6xl mx-auto w-full relative z-10 pb-8 flex justify-between items-end">
            <div>
              <Link href="/" className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold mb-6 hover:bg-white hover:text-black transition-all uppercase tracking-widest inline-block">← Kembali Ke Eksplor</Link>
              <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">{cafe.name}</h1>
              
              <div className="flex flex-wrap items-center gap-3">

                <span className={`text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg ${statusInfo.isOpenNow ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {statusInfo.statusText}
                </span>


                {crowdBadge && statusInfo.isOpenNow && (
                  <span className={`text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg flex items-center gap-2 ${crowdBadge.className}`}>
                    <span className="w-2 h-2 rounded-full bg-white opacity-70 animate-ping"></span> 
                    {crowdBadge.label}
                  </span>
                )}


                {userLoc && cafe.latitude && cafe.longitude && (
                  <span className="text-xs font-black bg-blue-600 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg animate-fade-in">
                    🚗 {calculateDistance(userLoc.lat, userLoc.lng, Number(cafe.latitude), Number(cafe.longitude))} KM DARI SINI
                  </span>
                )}
                
                <span className="text-xs font-black bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg uppercase tracking-widest hidden md:inline-block">📍 {cafe.address}</span>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl shadow-2xl">
              <span className="text-4xl font-black text-yellow-400 drop-shadow-lg">⭐ {avgRating}</span>
              <span className="text-white text-xs font-bold tracking-widest uppercase mt-1">({reviews.length} Ulasan)</span>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-10 mt-[-40px] relative z-20">
        
        <div className="lg:col-span-2 space-y-8">
          
          {cafe.description && (
            <section className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="text-9xl">📖</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 border-l-8 border-indigo-600 pl-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-gray-950">Cerita Singkat</h2>
                </div>
                <p className="text-gray-600 text-base leading-relaxed font-medium">
                  {cafe.description}
                </p>
              </div>
            </section>
          )}
          
          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 mb-6 border-l-8 border-blue-600 pl-4">
               <h2 className="text-2xl font-black uppercase tracking-tight text-gray-950">📸 Suasana Kafe</h2>
            </div>
            
            {allPhotos.length > 0 ? (
              <>
                <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory gap-3 pb-2 pt-2 scrollbar-hide">
                  {allPhotos.map((photo: string, idx: number) => (
                    <div 
                      key={idx} 
                      /* aspect-[4/3] membuat foto proporsional seperti foto normal, bukan memaksanya jadi kotak */
                      className="w-[85%] shrink-0 aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer relative snap-center shadow-md"
                      onClick={() => setCurrentImageIndex(idx)}
                    >
                      <img src={photo} alt={`Suasana ${idx + 1}`} className="w-full h-full object-cover active:scale-95 transition-transform" />
                      <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold tracking-widest">
                        {idx + 1} / {allPhotos.length}
                      </div>
                    </div>
                  ))}
                </div>

                {/* --- Indikator Titik (HP) --- */}
                {allPhotos.length > 1 && (
                  <div className="flex md:hidden justify-center gap-1.5 mt-3 mb-2 z-20 pointer-events-none">
                    {allPhotos.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${currentImageIndex === idx ? 'w-4 bg-blue-600 shadow-sm' : 'w-1.5 bg-blue-100'}`}
                      ></div>
                    ))}
                  </div>
                )}

                {/* --- 💻 TAMPILAN DESKTOP (Grid estetik) --- */}
                <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3 aspect-[2/1]">
                  <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden cursor-pointer relative group" onClick={() => setCurrentImageIndex(0)}>
                    <img src={allPhotos[0]} alt="Main" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                  </div>
                  {allPhotos[1] && <div className="rounded-2xl overflow-hidden cursor-pointer relative group" onClick={() => setCurrentImageIndex(1)}><img src={allPhotos[1]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>}
                  {allPhotos[2] && <div className="rounded-2xl overflow-hidden cursor-pointer relative group" onClick={() => setCurrentImageIndex(2)}><img src={allPhotos[2]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>}
                  {allPhotos[3] && (
                    <div className="rounded-2xl overflow-hidden col-span-2 cursor-pointer relative group" onClick={() => setCurrentImageIndex(3)}>
                      <img src={allPhotos[3]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      {allPhotos.length > 4 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:bg-black/80"><span className="text-white font-black tracking-widest uppercase text-lg">+ {allPhotos.length - 4} Foto</span></div>}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="aspect-[2/1] bg-gray-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 text-gray-400">
                <span className="text-5xl mb-2">📷</span><p className="font-bold uppercase text-xs tracking-widest">Belum ada foto galeri.</p>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 h-fit">
              <h2 className="text-xl font-black mb-6 border-l-8 border-teal-500 pl-4 uppercase text-gray-950">🛋️ Tipe Area</h2>
              {cafeAreas.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {cafeAreas.map((area: string) => (
                    <div key={area} className="bg-teal-50 border border-teal-100 text-teal-800 font-bold px-4 py-3 rounded-xl text-sm tracking-wide flex items-center shadow-sm">
                      {area}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm font-bold italic">Info tipe area belum tersedia.</p>
              )}

              <h2 className="text-xl font-black mt-8 mb-4 border-l-8 border-purple-600 pl-4 uppercase text-gray-950">⚡ Fasilitas</h2>
              {regularFacs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {regularFacs.map((f: string) => (
                    <span key={f} className="bg-purple-50 text-purple-700 font-bold px-4 py-2 rounded-xl text-xs border border-purple-100 uppercase tracking-wider">
                      ✓ {f}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm font-bold italic">Fasilitas umum belum ditambahkan.</p>
              )}
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 h-fit">
              <div className="flex justify-between items-center mb-6 border-l-8 border-orange-500 pl-4">
                 <h2 className="text-xl font-black uppercase text-gray-950">🍕 Menu</h2>
              </div>
              <div className="space-y-3">
                {cafe.menuItems && cafe.menuItems.length > 0 ? cafe.menuItems.map((menu: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <p className="font-bold text-gray-800 text-sm">{menu.name}</p>
                    <span className="font-black text-orange-600 text-sm">Rp {menu.price?.toLocaleString('id-ID')}</span>
                  </div>
                )) : (
                  <p className="text-gray-400 text-sm font-bold italic">Katalog menu belum ditambahkan.</p>
                )}
              </div>
            </section>
          </div>

          <section className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <div className="flex justify-between items-end mb-8 border-l-8 border-yellow-400 pl-4">
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tight text-gray-950">Review</h2>
                 <p className="text-gray-500 text-sm font-bold mt-1">Bagaimana pengalaman mereka di sini?</p>
               </div>
               <div className="text-right">
                 <span className="text-3xl font-black text-gray-900">{avgRating}</span>
                 <span className="text-yellow-400 text-2xl ml-1">★</span>
                 <p className="text-xs text-gray-400 font-bold">{reviews.length} Ulasan</p>
               </div>
            </div>

            {currentUser ? (
              <form onSubmit={handleSubmitReview} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tulis Ulasanmu Sebagai <span className="text-blue-600">{currentUser.name}</span></p>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button type="button" key={star} onClick={() => setNewRating(star)} className={`text-3xl transition-all hover:scale-125 ${newRating >= star ? 'text-yellow-400 drop-shadow-md' : 'text-gray-300'}`}>★</button>
                  ))}
                </div>
                <textarea required placeholder="Ceritakan pengalaman nongkrong atau nugasmu di sini..." value={newComment} onChange={e => setNewComment(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 ring-blue-100 resize-none h-24 mb-3"></textarea>
                <button type="submit" disabled={isSubmitting} className="bg-gray-900 text-white font-black px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors uppercase tracking-widest text-xs disabled:opacity-50">
                  {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
              </form>
            ) : (
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center mb-8">
                <p className="text-blue-800 font-bold mb-3">Ingin berbagi pengalamanmu di kafe ini?</p>
                <Link href="/login"><button className="bg-blue-600 text-white font-black px-6 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-blue-700">Login untuk Mengulas</button></Link>
              </div>
            )}

            <div className="space-y-4">
              {reviews.length > 0 ? reviews.map((rev) => (
                <div key={rev.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black shadow-md">
                        {rev.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-none">{rev.user?.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                          {new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-yellow-400 text-sm tracking-widest">
                      {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed pl-13 mt-2 bg-gray-50 p-3 rounded-tr-2xl rounded-b-2xl rounded-tl-sm border border-gray-100 inline-block">
                    "{rev.comment}"
                  </p>
                </div>
              )) : (
                <p className="text-center text-gray-400 font-bold py-10 italic">Belum ada ulasan. Jadilah yang pertama!</p>
              )}
            </div>
          </section>

        </div>


        <div className="space-y-8 sticky top-24 h-fit hidden lg:block">
          
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-6">🕒 Jam Operasional</h3>
            
            {cafe.is24Hours ? (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl text-center">
                <span className="text-2xl block mb-2">🔥</span>
                <span className="font-black uppercase tracking-widest text-sm block">Buka 24 Jam</span>
              </div>
            ) : cafe.operationalHours ? (
              <div className="space-y-2">
                {daysOrder.map(day => {
                  const isToday = day === currentDayName;
                  let hoursObj = cafe.operationalHours;
                  if (typeof hoursObj === 'string') { try { hoursObj = JSON.parse(hoursObj); } catch(e) { hoursObj = {}; } }
                  const hours = hoursObj[day];

                  return (
                    <div key={day} className={`flex justify-between items-center p-3 rounded-xl transition-all ${isToday ? 'bg-blue-600 text-white shadow-md scale-105 my-3' : 'bg-gray-50 text-gray-600'}`}>
                      <span className={`font-black text-sm uppercase tracking-widest ${isToday ? 'text-white' : 'text-gray-900'}`}>
                        {day} {isToday && <span className="text-[9px] bg-white text-blue-600 px-2 py-0.5 rounded ml-2">HARI INI</span>}
                      </span>
                      <span className={`font-bold text-sm ${!hours?.isOpen && !isToday && 'text-red-500'}`}>
                        {hours?.isOpen ? `${hours.open} - ${hours.close}` : 'TUTUP'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 font-bold text-sm text-center">Jadwal belum diatur.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 sticky top-24">
            <h3 className="text-xl font-black mb-4 uppercase italic text-gray-950">🗺️ Rute Lokasi</h3>
            <div className="aspect-square rounded-2xl overflow-hidden mb-6 border bg-gray-100 shadow-inner">
               <iframe className="w-full h-full border-0 pointer-events-none" src={`https://maps.google.com/?q=${cafe.latitude},${cafe.longitude}&hl=id&z=15&output=embed`}></iframe>
            </div>
            <button onClick={handleNavigation} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black hover:bg-blue-700 transition-all uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95">
              🚀 MULAI NAVIGASI
            </button>
          </div>

        </div>

      </div>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}