'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const purposeOptions = [
  'Nugas / WFC',
  'Nongkrong Santai',
  'Estetik / Spot Foto',
  'Meeting / Diskusi'
];

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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/owner/cafes/${ownerId}`)
      .then(res => res.json())
      .then(data => setMyCafes(data));
  };

  const updateCrowdStatus = async (cafeId: number, status: string) => {
    setMyCafes(prev => prev.map(cafe => cafe.id === cafeId ? { ...cafe, crowdStatus: status } : cafe));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cafes/${cafeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crowdStatus: status })
      });
      if (!res.ok) {
        fetchMyCafes(user.id);
        alert("Gagal mengupdate status keramaian.");
      }
    } catch (err) {
      fetchMyCafes(user.id);
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

  const togglePurpose = (purp: string) => {
    setFormData(prev => ({ 
      ...prev, 
      purpose: prev.purpose.includes(purp) ? prev.purpose.filter(p => p !== purp) : [...prev.purpose, purp] 
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
    let loadedPurpose = cafe.purpose || ['Nugas / WFC'];
    if (typeof loadedPurpose === 'string') {
        try { loadedPurpose = JSON.parse(loadedPurpose); } 
        catch (e) { loadedPurpose = [loadedPurpose]; }
    }
    setFormData({
      name: cafe.name, description: cafe.description || '', address: cafe.address, 
      latitude: cafe.latitude.toString(), longitude: cafe.longitude.toString(),
      priceRange: cafe.priceRange, imageUrl: cafe.imageUrl || '', 
      isTaxInc: cafe.isTaxInc || false, purpose: loadedPurpose, viewType: cafe.viewType || 'City',
      areaTypes: loadedAreas, facilities: regularFacs, is24Hours: cafe.is24Hours, operationalHours: loadedHours
    });
    setMapLinkInput(`https://www.google.com/maps/search/?api=1&query=${cafe.latitude},${cafe.longitude}`);
    const existingGallery = (cafe.gallery || []).map((url: string) => ({ id: url, type: 'link', data: url }));
    setGalleryItems(existingGallery); setMenus(cafe.menuItems || []); setEditingId(cafe.id); setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (cafeId: number) => {
    if (!confirm(`Hapus kafe?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cafes/${cafeId}`, { method: 'DELETE' });
      if (res.ok) fetchMyCafes(user.id);
    } catch (err) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) return alert("Lokasi belum valid.");
    let finalImageUrl = formData.imageUrl; let finalGalleryUrls: string[] = [];
    try {
      if (imageFile) {
        const uploadData = new FormData(); uploadData.append('file', imageFile);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, { method: 'POST', body: uploadData });
        finalImageUrl = (await res.json()).url;
      }
      for (const item of galleryItems) {
        if (item.type === 'file') {
          const uploadData = new FormData(); uploadData.append('file', item.data);
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, { method: 'POST', body: uploadData });
          finalGalleryUrls.push((await res.json()).url);
        } else { finalGalleryUrls.push(item.data); }
      }
      const combinedFacilities = [...formData.areaTypes, ...formData.facilities];
      const { areaTypes, ...dataToSubmit } = formData;
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `${process.env.NEXT_PUBLIC_API_URL}/api/cafes/${editingId}` : `${process.env.NEXT_PUBLIC_API_URL}/api/cafes`;
      const res = await fetch(endpoint, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dataToSubmit, facilities: combinedFacilities, imageUrl: finalImageUrl, ownerId: user.id, gallery: finalGalleryUrls, menuItems: menus })
      });
      if (res.ok) { resetForm(); setIsAdding(false); fetchMyCafes(user.id); }
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-sans pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end border-b pb-6 border-gray-200">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Area Pengelola</h1>
            <p className="text-gray-500 italic text-sm">Update status keramaian secara Real-Time.</p>
          </div>
          <button onClick={() => { setIsAdding(!isAdding); if(isAdding) resetForm(); }} 
            className={`font-bold px-6 py-3 rounded-full shadow-sm transition-all ${isAdding ? 'bg-red-100 text-red-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {isAdding ? '× Batal' : '+ Tambah Kafe'}
          </button>
        </header>

        {isAdding && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-10">
            <h2 className="text-2xl font-bold mb-6 border-b pb-4 text-blue-900">{editingId ? 'Edit Kafe' : 'Kafe Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-10">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold border-b pb-2">1. Info Dasar</h3>
                  <input required type="text" className="w-full border rounded-xl px-4 py-2 outline-none" placeholder="Nama Kafe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <textarea className="w-full border rounded-xl px-4 py-2 outline-none h-20 resize-none text-sm" placeholder="Deskripsi" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <select className="w-full border rounded-xl px-4 py-2 bg-white text-sm" value={formData.viewType} onChange={e => setFormData({...formData, viewType: e.target.value})}>
                      <option value="City">City View</option><option value="Nature">Nature View</option><option value="None">Indoor</option>
                    </select>
                    <input type="text" className="w-full border rounded-xl px-4 py-2 text-sm" placeholder="Harga" value={formData.priceRange} onChange={e => setFormData({...formData, priceRange: e.target.value})} />
                  </div>
                  <div className="pt-2">
                    <label className="block text-xs font-black mb-2 text-gray-400 uppercase tracking-widest">Tujuan Kafe</label>
                    <div className="flex flex-wrap gap-2">
                      {purposeOptions.map(purp => {
                        const isSelected = formData.purpose.includes(purp);
                        return (
                          <button key={purp} type="button" onClick={() => togglePurpose(purp)} className={`px-4 py-2 rounded-full text-[10px] font-bold border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>{purp}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="space-y-3 bg-blue-50/30 p-5 rounded-2xl border border-blue-100 flex flex-col">
                  <h3 className="text-lg font-bold border-b border-blue-200 pb-2 mb-3 text-blue-900">📍 Lokasi</h3>
                  <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none mb-3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Alamat..." />
                  <input type="text" className="w-full border-2 border-blue-300 rounded-xl px-4 py-3 text-sm outline-none mb-3" value={mapLinkInput} onChange={handlePasteMapLink} placeholder="Paste Link Google Maps..." />
                  {formData.latitude && (
                    <div className="h-40 rounded-xl overflow-hidden border-2 border-blue-200 relative">
                      <iframe className="w-full h-full absolute inset-0" src={`https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=${formData.latitude},${formData.longitude}&zoom=16`} allowFullScreen></iframe>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                <h3 className="text-xl font-bold border-b border-purple-200 pb-4 mb-6 text-purple-900">🛋️ Area & Fasilitas</h3>
                <div className="mb-6">
                   <p className="text-[10px] font-black text-purple-400 mb-3 uppercase tracking-widest">Tipe Area</p>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                     {areaOptions.map(area => (
                       <button key={area} type="button" onClick={() => toggleAreaType(area)} className={`px-3 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${formData.areaTypes.includes(area) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-500 border-gray-200'}`}>{area}</button>
                     ))}
                   </div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-purple-400 mb-3 uppercase tracking-widest">Fasilitas</p>
                   <div className="flex flex-wrap gap-2">
                     {commonFacilities.map(fac => (
                       <button key={fac} type="button" onClick={() => toggleFacility(fac)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${formData.facilities.includes(fac) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-500 border-gray-200'}`}>{fac}</button>
                     ))}
                   </div>
                </div>
              </section>

              <section className="bg-green-50/30 p-6 rounded-2xl border border-green-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-green-900">🕒 Jam Operasional</h3>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.is24Hours} onChange={e => setFormData({...formData, is24Hours: e.target.checked})} />
                    <label className="text-xs font-black uppercase text-green-800">24 Jam</label>
                  </div>
                </div>
                {!formData.is24Hours && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => {
                      const h = (formData.operationalHours as any)[day];
                      return (
                        <div key={day} className="flex items-center justify-between p-2 bg-white rounded-lg border border-green-100">
                          <div className="flex items-center gap-2 w-20">
                            <input type="checkbox" checked={h.isOpen} onChange={e => handleHourChange(day, 'isOpen', e.target.checked)} />
                            <span className="text-[10px] font-black uppercase">{day}</span>
                          </div>
                          {h.isOpen && (
                            <div className="flex items-center gap-1">
                              <input type="time" value={h.open} onChange={e => handleHourChange(day, 'open', e.target.value)} className="border text-[10px] p-1 rounded" />
                              <span className="text-gray-300">-</span>
                              <input type="time" value={h.close} onChange={e => handleHourChange(day, 'close', e.target.value)} className="border text-[10px] p-1 rounded" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-xl font-bold border-b border-blue-200 pb-4 mb-6">📸 Galeri Foto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-4 rounded-xl border border-blue-200">
                    <p className="text-[10px] font-black uppercase mb-3 text-gray-400">Sampul Utama</p>
                    <div onClick={() => document.getElementById('main-up')?.click()} className="aspect-video w-full bg-gray-50 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden mb-3">
                      {imageFile || formData.imageUrl ? <img src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">PILIH FOTO</span>}
                    </div>
                    <input id="main-up" type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setImageFile(e.target.files[0])} />
                    <input type="text" className="w-full border rounded-lg p-2 text-xs" placeholder="Atau Link..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-200">
                    <p className="text-[10px] font-black uppercase mb-3 text-gray-400">Foto Suasana</p>
                    <div onClick={() => document.getElementById('gal-up')?.click()} className="w-full py-4 border-2 border-dashed rounded-xl text-center cursor-pointer mb-3">
                      <span className="text-[10px] font-bold">TAMBAH FOTO</span>
                    </div>
                    <input id="gal-up" type="file" multiple accept="image/*" className="hidden" onChange={e => { if (e.target.files) { const files = Array.from(e.target.files).map(f => ({ id: Math.random().toString(), type: 'file' as const, data: f })); setGalleryItems([...galleryItems, ...files]); } }} />
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={galleryItems.map(i => i.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                          {galleryItems.map(item => <SortablePhoto key={item.id} id={item.id} item={item} onRemove={() => setGalleryItems(galleryItems.filter(i => i.id !== item.id))} />)}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </section>

              <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all text-sm uppercase tracking-widest shadow-lg">🚀 Simpan Data</button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCafes.map((cafe: any) => (
            <div key={cafe.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex gap-4 items-center mb-4">
                <img src={cafe.imageUrl || 'https://via.placeholder.com/150'} className="w-14 h-14 object-cover rounded-xl border shadow-sm" />
                <div className="overflow-hidden">
                  <h3 className="font-black text-gray-900 uppercase italic truncate">{cafe.name}</h3>
                  <p className="text-[9px] text-gray-400 uppercase truncate font-bold">{cafe.address}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1">Kapasitas Saat Ini</p>
                <div className="grid grid-cols-2 gap-2">
                  {['sepi', 'normal', 'ramai', 'penuh'].map(s => (
                    <button key={s} onClick={() => updateCrowdStatus(cafe.id, s)} className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${cafe.crowdStatus === s ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-white text-gray-400 border-gray-200'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t">
                <button onClick={() => handleEditClick(cafe)} className="flex-1 bg-gray-100 text-gray-600 font-black py-2 rounded-xl text-[9px] uppercase">Edit</button>
                <button onClick={() => handleDeleteClick(cafe.id)} className="flex-1 bg-red-50 text-red-400 font-black py-2 rounded-xl text-[9px] uppercase">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}