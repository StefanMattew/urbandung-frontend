'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Import DND Kit
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- DAFTAR OPSI TIPE AREA & FASILITAS ---
const areaOptions = [
  '❄️ Indoor AC (Non-Smoking)', 
  '🚬 Indoor AC (Smoking)', 
  '⛅ Semi-Outdoor (Beratap)', 
  '☀️ Outdoor (Terbuka)'
];

const commonFacilities = [
  'WiFi Ngebut', 'Colokan Banyak', 'Mushola', 'Toilet Bersih', 
  'Parkir Luas', 'Sofa Nyaman', 'Live Music', 'Pet Friendly', 'Board Games'
];

function SortablePhoto({ id, item, onRemove }: { id: string, item: any, onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.6 : 1,
    scale: isDragging ? '1.05' : '1',
  };

  const imageUrl = item.type === 'file' ? URL.createObjectURL(item.data) : item.data;

  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group bg-gray-200 touch-none">
      <img src={imageUrl} className="w-full h-full object-cover cursor-grab active:cursor-grabbing" alt="Preview" {...attributes} {...listeners} />
      <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} 
        className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold shadow-lg z-20 hover:scale-110 transition-transform">×</button>
      <div className={`absolute bottom-0 left-0 right-0 text-[8px] text-white text-center py-0.5 font-bold uppercase ${item.type === 'link' ? 'bg-blue-600/80' : 'bg-green-600/80'}`}>
        {item.type}
      </div>
    </div>
  );
}

const defaultHours = {
  Senin: { isOpen: true, open: '08:00', close: '22:00' },
  Selasa: { isOpen: true, open: '08:00', close: '22:00' },
  Rabu: { isOpen: true, open: '08:00', close: '22:00' },
  Kamis: { isOpen: true, open: '08:00', close: '22:00' },
  Jumat: { isOpen: true, open: '08:00', close: '23:59' }, 
  Sabtu: { isOpen: true, open: '08:00', close: '02:00' }, 
  Minggu: { isOpen: true, open: '08:00', close: '22:00' }
};

export default function PengelolaDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [myCafes, setMyCafes] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', description: '', address: '', latitude: '', longitude: '',
    priceRange: '', imageUrl: '', isTaxInc: false, 
    purpose: ['Nugas / WFC'] as string[],
    areaTypes: [] as string[],
    facilities: [] as string[],
    viewType: 'City',
    is24Hours: false,
    operationalHours: JSON.parse(JSON.stringify(defaultHours)) 
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryItems, setGalleryItems] = useState<{id: string, type: 'link' | 'file', data: any}[]>([]);
  const [galInput, setGalInput] = useState('');
  
  const [facInput, setFacInput] = useState(''); 
  const [mapLinkInput, setMapLinkInput] = useState(''); 
  const [menus, setMenus] = useState<{name: string, price: number}[]>([]);
  const [menuInput, setMenuInput] = useState({name: '', price: ''});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const savedUser = localStorage.getItem('geshare_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role !== 'OWNER' && parsedUser.role !== 'ADMIN') {
        router.push('/');
      } else { 
        setUser(parsedUser); 
        fetchMyCafes(parsedUser.id); 
      }
    } else router.push('/login');
  }, [router]);

  const fetchMyCafes = (ownerId: number) => {
    fetch(`http://localhost:5000/api/owner/cafes/${ownerId}`)
      .then(res => res.json())
      .then(data => setMyCafes(data));
  };

  // --- FUNGSI UPDATE STATUS KERAMAIAN (LIVE UPDATE) ---
  const updateCrowdStatus = async (cafeId: number, status: string) => {
    // Optimistic UI Update (Ubah di layar dulu biar terasa instan)
    setMyCafes(prev => prev.map(cafe => cafe.id === cafeId ? { ...cafe, crowdStatus: status } : cafe));
    
    try {
      // Mengirim data ke backend (Menggunakan PATCH untuk update 1 field saja)
      const res = await fetch(`http://localhost:5000/api/cafes/${cafeId}`, {
        method: 'PATCH', // Asumsi backend mendukung PATCH, jika tidak ubah ke PUT dan kirim full data
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crowdStatus: status })
      });
      
      if (!res.ok) {
        // Jika gagal, kembalikan data (fetch ulang)
        fetchMyCafes(user.id);
        alert("Gagal mengupdate status keramaian. Coba lagi.");
      }
    } catch (err) {
      fetchMyCafes(user.id);
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const handlePasteMapLink = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setMapLinkInput(url);

    const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/; 
    const regexQ = /q=(-?\d+\.\d+),(-?\d+\.\d+)/; 
    const regexEmbed = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/; 

    let lat = ''; let lng = '';

    if (regexAt.test(url)) {
      const match = url.match(regexAt);
      if (match) { lat = match[1]; lng = match[2]; }
    } else if (regexQ.test(url)) {
      const match = url.match(regexQ);
      if (match) { lat = match[1]; lng = match[2]; }
    } else if (regexEmbed.test(url)) {
      const match = url.match(regexEmbed);
      if (match) { lat = match[1]; lng = match[2]; }
    } else if (url.includes(',') && !url.includes('http')) {
      const parts = url.split(',');
      if (!isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
        lat = parts[0].trim(); lng = parts[1].trim();
      }
    }

    if (lat && lng) setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setGalleryItems((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleHourChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev, operationalHours: { ...prev.operationalHours, [day]: { ...(prev.operationalHours as any)[day], [field]: value } }
    }));
  };

  const toggleAreaType = (area: string) => {
    setFormData(prev => ({ ...prev, areaTypes: prev.areaTypes.includes(area) ? prev.areaTypes.filter(a => a !== area) : [...prev.areaTypes, area] }));
  };

  const toggleFacility = (fac: string) => {
    setFormData(prev => ({ ...prev, facilities: prev.facilities.includes(fac) ? prev.facilities.filter(f => f !== fac) : [...prev.facilities, fac] }));
  };

  const resetForm = () => {
    setFormData({ 
      name: '', description: '', address: '', latitude: '', longitude: '', priceRange: '', imageUrl: '', 
      is24Hours: false, operationalHours: JSON.parse(JSON.stringify(defaultHours)), 
      isTaxInc: false, purpose: ['Nugas / WFC'], viewType: 'City', areaTypes: [], facilities: [] 
    });
    setGalleryItems([]); setMenus([]); setImageFile(null); setEditingId(null); setFacInput(''); setMapLinkInput('');
  };

  const handleEditClick = (cafe: any) => {
    const loadedHours = cafe.operationalHours && Object.keys(cafe.operationalHours).length > 0 
      ? cafe.operationalHours : JSON.parse(JSON.stringify(defaultHours));

    const rawFacs = cafe.facilities || [];
    const parsedFacs = typeof rawFacs === 'string' ? JSON.parse(rawFacs) : rawFacs;
    const loadedAreas = parsedFacs.filter((f: string) => areaOptions.includes(f));
    const regularFacs = parsedFacs.filter((f: string) => !areaOptions.includes(f));

    setFormData({
      name: cafe.name, description: cafe.description || '', address: cafe.address, 
      latitude: cafe.latitude.toString(), longitude: cafe.longitude.toString(),
      priceRange: cafe.priceRange, imageUrl: cafe.imageUrl || '', 
      isTaxInc: cafe.isTaxInc || false, purpose: cafe.purpose || ['Nugas / WFC'], viewType: cafe.viewType || 'City',
      areaTypes: loadedAreas, facilities: regularFacs, is24Hours: cafe.is24Hours, operationalHours: loadedHours
    });
    
    setMapLinkInput(`https://www.google.com/maps?q=${cafe.latitude},${cafe.longitude}`);
    const existingGallery = (cafe.gallery || []).map((url: string) => ({ id: url, type: 'link', data: url }));
    setGalleryItems(existingGallery); setMenus(cafe.menuItems || []); setEditingId(cafe.id); setIsAdding(true); setFacInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (cafeId: number, cafeName: string) => {
    if (!confirm(`Hapus kafe "${cafeName}"?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/cafes/${cafeId}`, { method: 'DELETE' });
      if (res.ok) { alert("Kafe berhasil dihapus!"); fetchMyCafes(user.id); } else alert("Gagal menghapus kafe.");    
    } catch (err) { alert("Terjadi kesalahan."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) return alert("Titik Google Maps belum ditemukan! Silakan paste link Google Maps yang valid.");
    
    let finalImageUrl = formData.imageUrl; let finalGalleryUrls: string[] = [];

    try {
      if (imageFile) {
        const uploadData = new FormData(); uploadData.append('file', imageFile);
        const res = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: uploadData });
        finalImageUrl = (await res.json()).url;
      }

      for (const item of galleryItems) {
        if (item.type === 'file') {
          const uploadData = new FormData(); uploadData.append('file', item.data);
          const res = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: uploadData });
          finalGalleryUrls.push((await res.json()).url);
        } else { finalGalleryUrls.push(item.data); }
      }

      const combinedFacilities = [...formData.areaTypes, ...formData.facilities];
      const { areaTypes, ...dataToSubmit } = formData;

      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `http://localhost:5000/api/cafes/${editingId}` : 'http://localhost:5000/api/cafes';
      
      const res = await fetch(endpoint, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dataToSubmit, facilities: combinedFacilities, imageUrl: finalImageUrl, ownerId: user.id, gallery: finalGalleryUrls, menuItems: menus })
      });
      
      if (res.ok) { alert("💾 Data Kafe berhasil disimpan!"); resetForm(); setIsAdding(false); fetchMyCafes(user.id); }
    } catch (err) { alert("Terjadi kesalahan saat menyimpan."); }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans pb-20">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10 flex justify-between items-end border-b pb-6 border-gray-200">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Area Pengelola</h1>
            <p className="text-gray-500 italic">Kelola kafe dan update status keramaian secara Real-Time.</p>
          </div>
          <button onClick={() => { setIsAdding(!isAdding); if(isAdding) resetForm(); }} 
            className={`font-bold px-6 py-3 rounded-full shadow-sm transition-colors ${isAdding ? 'bg-red-100 text-red-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {isAdding ? '× Batal / Tutup Form' : '+ Tambah Kafe Baru'}
          </button>
        </header>

        {isAdding && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-10 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 border-b pb-4 text-blue-900">
              {editingId ? `✏️ Edit: ${formData.name}` : '✨ Kafe Baru'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* --- INFO DASAR & LOKASI --- */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold border-b pb-2">1. Info Dasar</h3>
                  <input required type="text" className="w-full border rounded-xl px-4 py-2 outline-none" placeholder="Nama Kafe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <textarea className="w-full border rounded-xl px-4 py-2 outline-none h-20 resize-none text-sm" placeholder="Deskripsi Singkat" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1 text-gray-700">Pemandangan</label>
                      <select className="w-full border rounded-xl px-4 py-2 bg-white text-sm" value={formData.viewType} onChange={e => setFormData({...formData, viewType: e.target.value})}>
                        <option value="City">City View</option><option value="Nature">Nature View</option><option value="None">Indoor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-gray-700">Rentang Harga</label>
                      <input type="text" className="w-full border rounded-xl px-4 py-2 text-sm" placeholder="Misal: Rp 20rb - 50rb" value={formData.priceRange} onChange={e => setFormData({...formData, priceRange: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-blue-50/30 p-5 rounded-2xl border border-blue-100 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold border-b border-blue-200 pb-2 mb-3 text-blue-900">📍 Lokasi & Google Maps</h3>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Alamat Lengkap (Ditampilkan ke User)</label>
                    <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none mb-4 bg-white focus:border-blue-500" 
                      value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Jl. Braga No. 99, Bandung..." />
                    
                    <label className="block text-[10px] font-black uppercase text-blue-600 mb-1">🔗 Paste Link Google Maps Di Sini</label>
                    <input type="text" className="w-full border-2 border-blue-300 rounded-xl px-4 py-3 text-sm outline-none bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all mb-3 shadow-inner" 
                      value={mapLinkInput} onChange={handlePasteMapLink} placeholder="Paste link dari Google Maps / Kordinat GPS..." />

                    <div className="flex gap-2">
                      <div className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border ${formData.latitude ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                        {formData.latitude ? `LAT: ${formData.latitude}` : 'LAT: Kosong'}
                      </div>
                      <div className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border ${formData.longitude ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                        {formData.longitude ? `LNG: ${formData.longitude}` : 'LNG: Kosong'}
                      </div>
                    </div>
                  </div>

                  {formData.latitude && formData.longitude && (
                    <div className="h-full min-h-[140px] mt-4 rounded-xl overflow-hidden border-2 border-blue-200 shadow-sm relative">
                      <iframe className="w-full h-full absolute inset-0" src={`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&hl=id&z=16&output=embed`} allowFullScreen loading="lazy"></iframe>
                    </div>
                  )}
                </div>
              </section>

              {/* --- BAGIAN KAPASITAS AREA & FASILITAS BARU --- */}
              <section className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                <h3 className="text-xl font-bold border-b border-purple-200 pb-4 mb-6 italic text-purple-900">🛋️ Kapasitas Area & Fasilitas</h3>
                
                {/* 1. TIPE AREA */}
                <div className="mb-8">
                  <p className="text-sm font-black text-purple-800 mb-3 uppercase tracking-widest">1. Tipe Area Tempat Duduk (Bisa pilih lebih dari 1)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {areaOptions.map(area => {
                      const isSelected = formData.areaTypes.includes(area);
                      return (
                        <button key={area} type="button" onClick={() => toggleAreaType(area)}
                          className={`px-4 py-3 rounded-xl text-xs font-bold text-left transition-all border-2 ${
                            isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                          }`}>
                          {isSelected ? '✅ ' : '⬜ '}{area}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. FASILITAS UMUM */}
                <div className="mb-6 border-t border-purple-200 pt-6">
                  <p className="text-sm font-black text-purple-800 mb-3 uppercase tracking-widest">2. Fasilitas Pelengkap</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {commonFacilities.map(fac => {
                      const isSelected = formData.facilities.includes(fac);
                      return (
                        <button key={fac} type="button" onClick={() => toggleFacility(fac)}
                          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                            isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-gray-500 border-gray-300 hover:bg-purple-50 hover:border-purple-300'
                          }`}>
                          {isSelected ? '✓ ' : '+ '}{fac}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex gap-3">
                    <input type="text" className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none focus:border-purple-500 bg-white" placeholder="Fasilitas Khusus Lainnya (Ketik & Enter...)" 
                      value={facInput} onChange={e => setFacInput(e.target.value)} 
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (facInput.trim() && !formData.facilities.includes(facInput.trim())) { toggleFacility(facInput.trim()); setFacInput(''); } } }} />
                    <button type="button" onClick={() => { if(facInput.trim() && !formData.facilities.includes(facInput.trim())) { toggleFacility(facInput.trim()); setFacInput(''); } }} 
                      className="bg-purple-500 text-white px-5 rounded-xl font-bold text-xs uppercase tracking-tighter hover:bg-purple-600 transition-colors">
                      Tambah
                    </button>
                  </div>
                </div>
                
                {/* 3. REVIEW TAGS */}
                {(formData.areaTypes.length > 0 || formData.facilities.length > 0) && (
                  <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl border border-purple-200 shadow-sm mt-4">
                    <span className="w-full text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Data yang akan tersimpan:</span>
                    
                    {formData.areaTypes.map((area, idx) => (
                      <span key={`area-${idx}`} className="bg-purple-100 border border-purple-300 text-purple-800 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 tracking-wide">
                        {area}
                        <button type="button" onClick={() => toggleAreaType(area)} className="text-purple-400 hover:text-red-500 font-black text-sm">×</button>
                      </span>
                    ))}

                    {formData.facilities.map((fac, idx) => (
                      <span key={`fac-${idx}`} className="bg-gray-100 border border-gray-300 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 uppercase tracking-widest">
                        {fac}
                        <button type="button" onClick={() => toggleFacility(fac)} className="text-gray-400 hover:text-red-500 font-black text-sm">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* --- BAGIAN JADWAL (HARI & JAM) --- */}
              <section className="bg-green-50/30 p-6 rounded-2xl border border-green-100">
                <div className="flex justify-between items-center border-b border-green-200 pb-4 mb-4">
                  <h3 className="text-xl font-bold text-green-900">🕒 Jadwal Operasional</h3>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-green-200 shadow-sm">
                    <input type="checkbox" id="is24" className="w-4 h-4 accent-green-600 cursor-pointer" checked={formData.is24Hours} onChange={e => setFormData({...formData, is24Hours: e.target.checked})} />
                    <label htmlFor="is24" className="text-xs font-black text-green-800 uppercase cursor-pointer tracking-widest">Buka 24 Jam Non-Stop</label>
                  </div>
                </div>

                {!formData.is24Hours && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-fade-in">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => {
                      const hours = (formData.operationalHours as any)[day];
                      return (
                        <div key={day} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${hours.isOpen ? 'bg-white border-green-200 shadow-sm' : 'bg-red-50/50 border-red-100'}`}>
                          
                          <div className="flex items-center gap-3 w-28">
                            <input type="checkbox" id={`open-${day}`} checked={hours.isOpen} onChange={e => handleHourChange(day, 'isOpen', e.target.checked)} className="w-4 h-4 accent-green-600 cursor-pointer" />
                            <label htmlFor={`open-${day}`} className={`text-sm font-black uppercase cursor-pointer ${hours.isOpen ? 'text-gray-800' : 'text-red-400 line-through'}`}>{day}</label>
                          </div>

                          {hours.isOpen ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input type="time" value={hours.open} onChange={e => handleHourChange(day, 'open', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-green-500 bg-gray-50 text-center" />
                              <span className="text-gray-400 text-xs font-black">-</span>
                              <input type="time" value={hours.close} onChange={e => handleHourChange(day, 'close', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-green-500 bg-gray-50 text-center" />
                            </div>
                          ) : (
                            <div className="flex-1 bg-red-100 text-red-600 text-xs font-black py-1.5 rounded-lg text-center uppercase tracking-widest">Tutup</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* --- BAGIAN FOTO & GALERI --- */}
              <section className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-xl font-bold border-b border-blue-200 pb-4 mb-6">📸 Foto Utama & Galeri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col items-center">
                    <label className="block text-xs font-bold mb-3 uppercase self-start">Foto Sampul Utama *</label>
                    <div className="aspect-video w-full max-w-[300px] bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 relative mb-4">
                      {imageFile || formData.imageUrl ? (
                        <img src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl} className="w-full h-full object-cover" alt="Main" />
                      ) : <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-[10px] font-bold">BELUM ADA FOTO</span>}
                    </div>
                    <input type="file" accept="image/*" className="w-full text-[10px]" onChange={e => { if (e.target.files && e.target.files[0]) { setImageFile(e.target.files[0]); setFormData({...formData, imageUrl: ''}); } }} />
                    <input type="text" className="w-full border rounded-lg px-3 py-2 text-xs mt-2" placeholder="Atau Link URL..." value={formData.imageUrl} onChange={e => { setFormData({...formData, imageUrl: e.target.value}); setImageFile(null); }} />
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
                    <label className="block text-xs font-bold mb-3 uppercase">Galeri (Multi-Upload & Drag)</label>
                    <input type="file" multiple accept="image/*" className="w-full text-[10px] mb-3" onChange={e => { if (e.target.files) { const files = Array.from(e.target.files).map(f => ({ id: Math.random().toString(), type: 'file' as const, data: f })); setGalleryItems(prev => [...prev, ...files]); e.target.value = ''; } }} />
                    <div className="flex gap-2 mb-4">
                      <input type="text" className="flex-1 border rounded-lg px-3 py-2 text-xs" placeholder="Link Foto..." value={galInput} onChange={e => setGalInput(e.target.value)} />
                      <button type="button" onClick={() => { if(galInput) { setGalleryItems([...galleryItems, { id: Math.random().toString(), type: 'link', data: galInput }]); setGalInput(''); } }} className="bg-gray-800 text-white px-3 rounded-lg text-[10px] font-bold uppercase">Tambah</button>
                    </div>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={galleryItems.map(i => i.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto pr-1">
                          {galleryItems.map((item) => <SortablePhoto key={item.id} id={item.id} item={item} onRemove={() => setGalleryItems(galleryItems.filter(i => i.id !== item.id))} />)}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </section>

              {/* --- KATALOG MENU --- */}
              <section className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                <div className="flex justify-between items-center border-b border-orange-200 pb-4 mb-6">
                  <h3 className="text-xl font-bold italic">🍕 Menu & Harga</h3>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="tax" className="w-4 h-4 accent-orange-500" checked={formData.isTaxInc} onChange={e => setFormData({...formData, isTaxInc: e.target.checked})} />
                    <label htmlFor="tax" className="text-xs font-bold text-gray-700">Sudah Termasuk Pajak</label>
                  </div>
                </div>
                <div className="flex gap-3 mb-6">
                  <input type="text" className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500" placeholder="Nama Menu" value={menuInput.name} onChange={e => setMenuInput({...menuInput, name: e.target.value})} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (menuInput.name && menuInput.price) { setMenus([...menus, { name: menuInput.name, price: parseInt(menuInput.price) }]); setMenuInput({name: '', price: ''}); } } }}/>
                  <input type="number" className="w-32 border rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500" placeholder="Harga" value={menuInput.price} onChange={e => setMenuInput({...menuInput, price: e.target.value})} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (menuInput.name && menuInput.price) { setMenus([...menus, { name: menuInput.name, price: parseInt(menuInput.price) }]); setMenuInput({name: '', price: ''}); } } }}/>
                  <button type="button" onClick={() => { if(menuInput.name && menuInput.price) { setMenus([...menus, { name: menuInput.name, price: parseInt(menuInput.price) }]); setMenuInput({name: '', price: ''}); } }} className="bg-orange-500 text-white px-5 rounded-xl font-bold text-xs uppercase tracking-tighter hover:bg-orange-600 transition-colors">Tambah</button>
                </div>
                {menus.length > 0 && (
                  <div className="bg-white rounded-xl border border-orange-100 p-4 space-y-2">
                    {menus.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                        <span className="font-bold text-xs text-gray-800">{m.name} - Rp {m.price.toLocaleString('id-ID')}</span>
                        <button type="button" onClick={() => setMenus(menus.filter((_, i) => i !== idx))} className="text-red-500 text-[10px] font-black uppercase hover:text-red-700">Hapus</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all text-xl uppercase tracking-widest shadow-xl">
                🚀 SIMPAN KE SISTEM
              </button>
            </form>
          </div>
        )}

        {/* --- DAFTAR KAFE & PANEL LIVE UPDATE (BARU) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myCafes.map((cafe: any) => {
            const currentCrowd = cafe.crowdStatus || 'normal'; // Default Normal

            return (
              <div key={cafe.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-xl transition-all">
                
                <div className="flex gap-4 items-center mb-4">
                  <img src={cafe.imageUrl || 'https://via.placeholder.com/150'} className="w-16 h-16 object-cover rounded-xl border" alt={cafe.name} />
                  <div>
                    <h3 className="font-black text-lg text-gray-900 line-clamp-1 uppercase tracking-tighter italic">{cafe.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{cafe.address}</p>
                  </div>
                </div>

                {/* --- PANEL LIVE UPDATE KERAMAIAN --- */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Live Update Kapasitas
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateCrowdStatus(cafe.id, 'sepi')} 
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border-2 ${currentCrowd === 'sepi' ? 'bg-green-100 border-green-500 text-green-700 shadow-sm scale-105' : 'bg-white border-gray-200 text-gray-500 hover:border-green-300'}`}>
                      🟢 Sepi
                    </button>
                    <button onClick={() => updateCrowdStatus(cafe.id, 'normal')} 
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border-2 ${currentCrowd === 'normal' ? 'bg-yellow-100 border-yellow-500 text-yellow-700 shadow-sm scale-105' : 'bg-white border-gray-200 text-gray-500 hover:border-yellow-300'}`}>
                      🟡 Normal
                    </button>
                    <button onClick={() => updateCrowdStatus(cafe.id, 'ramai')} 
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border-2 ${currentCrowd === 'ramai' ? 'bg-orange-100 border-orange-500 text-orange-700 shadow-sm scale-105' : 'bg-white border-gray-200 text-gray-500 hover:border-orange-300'}`}>
                      🟠 Ramai
                    </button>
                    <button onClick={() => updateCrowdStatus(cafe.id, 'penuh')} 
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border-2 ${currentCrowd === 'penuh' ? 'bg-red-100 border-red-500 text-red-700 shadow-sm scale-105' : 'bg-white border-gray-200 text-gray-500 hover:border-red-300'}`}>
                      🔴 Penuh
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => handleEditClick(cafe)} className="flex-1 bg-gray-100 text-gray-700 font-black py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all text-[10px] uppercase tracking-tighter">Edit Data</button>
                  <button onClick={() => handleDeleteClick(cafe.id, cafe.name)} className="flex-1 bg-red-50 text-red-600 font-black py-2.5 rounded-xl hover:bg-red-100 transition-all text-[10px] uppercase tracking-tighter">Hapus</button>
                </div>
              </div>
            );
          })}
        </div>  

      </div>
    </div>
  );
}