'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const cafePurposeOptions = ['Nugas / WFC', 'Nongkrong Santai', 'Estetik / Spot Foto', 'Meeting / Diskusi'];
const kulinerPurposeOptions = ['Comfort Food', 'Sarapan', 'Makan Siang', 'Makan Malam', 'Kuliner Malam / Begadang', 'Makan Keluarga', 'Date / Romantis', 'Murah Meriah', 'Cepat Saji'];

const foodCategories = ['Aneka Nasi', 'Aneka Mie & Bakso', 'Sunda / Nusantara', 'Western', 'Asian', 'Seafood', 'Street Food', 'Dessert', 'Seblak & Jajanan Pedas'];
const diningTypes = ['Dine-in', 'Takeaway', 'Drive-thru', 'Lesehan'];

const areaOptions = ['❄️ Indoor AC (Non-Smoking)', '🚬 Indoor AC (Smoking)', '⛅ Semi-Outdoor (Beratap)', '☀️ Outdoor (Terbuka)'];
const commonFacilities = [
  'WiFi Ngebut', 'Colokan Banyak', 'Mushola', 'Toilet Bersih', 'Parkir Luas', 'Sofa Nyaman', 'Live Music', 'Pet Friendly', 'VIP Room', 'High Chair',
  'Cashless Only', 'Cash Only', 'Cashless dan Cash', 'Menu Vegetarian'
];

function SortablePhoto({ id, item, onRemove }: { id: string, item: any, onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.6 : 1, scale: isDragging ? '1.05' : '1' };
  const imageUrl = item.type === 'file' ? URL.createObjectURL(item.data) : item.data;
  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group bg-gray-200 touch-none">
      <img src={imageUrl} className="w-full h-full object-cover cursor-grab active:cursor-grabbing" alt="Preview" {...attributes} {...listeners} />
      <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold shadow-lg z-20 hover:scale-110 transition-transform">×</button>
      <div className={`absolute bottom-0 left-0 right-0 text-[8px] text-white text-center py-0.5 font-bold uppercase ${item.type === 'link' ? 'bg-blue-600/80' : 'bg-green-600/80'}`}>{item.type}</div>
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
  
  const [activeTab, setActiveTab] = useState<'cafe' | 'kuliner'>('cafe');
  const [myCafes, setMyCafes] = useState<any[]>([]);
  const [myKuliners, setMyKuliners] = useState<any[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', description: '', address: '', latitude: '', longitude: '', priceRange: '', imageUrl: '', isTaxInc: false, 
    purpose: [] as string[], areaTypes: [] as string[], facilities: [] as string[], viewType: 'City', is24Hours: false,
    operationalHours: JSON.parse(JSON.stringify(defaultHours)),
    isHalal: true, foodCategory: [] as string[], diningType: [] as string[],
    deliveryLinks: { gojek: '', grab: '', shopeeFood: '' }
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryItems, setGalleryItems] = useState<{id: string, type: 'link' | 'file', data: any}[]>([]);
  const [galInput, setGalInput] = useState('');
  const [facInput, setFacInput] = useState(''); 
  const [mapLinkInput, setMapLinkInput] = useState(''); 
  const [menus, setMenus] = useState<{name: string, price: string}>({name: '', price: ''});
  const [menuList, setMenuList] = useState<{name: string, price: number}[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    const savedUser = localStorage.getItem('geshare_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role !== 'OWNER' && parsedUser.role !== 'ADMIN') router.push('/');
      else { setUser(parsedUser); fetchData(parsedUser.id); }
    } else router.push('/login');
  }, [router]);

  const fetchData = (ownerId: number) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/owner/cafes/${ownerId}`).then(res => res.json()).then(data => setMyCafes(data));
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/owner/kuliners/${ownerId}`).then(res => res.json()).then(data => setMyKuliners(data));
  };

  const updateCrowdStatus = async (id: number, status: string, type: 'cafe' | 'kuliner') => {
    if (type === 'cafe') setMyCafes(prev => prev.map(item => item.id === id ? { ...item, crowdStatus: status } : item));
    else setMyKuliners(prev => prev.map(item => item.id === id ? { ...item, crowdStatus: status } : item));

    try {
      const endpoint = type === 'cafe' ? `/api/cafes/${id}` : `/api/kuliners/${id}`;
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crowdStatus: status })
      });
    } catch (err) { fetchData(user.id); }
  };

  const handlePasteMapLink = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value; setMapLinkInput(url);
    const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/; const regexQ = /q=(-?\d+\.\d+),(-?\d+\.\d+)/; const regexEmbed = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/; 
    let lat = ''; let lng = '';
    if (regexAt.test(url)) { const match = url.match(regexAt); if (match) { lat = match[1]; lng = match[2]; } } 
    else if (regexQ.test(url)) { const match = url.match(regexQ); if (match) { lat = match[1]; lng = match[2]; } } 
    else if (regexEmbed.test(url)) { const match = url.match(regexEmbed); if (match) { lat = match[1]; lng = match[2]; } }
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

  const toggleArrayItem = (field: 'purpose' | 'areaTypes' | 'facilities' | 'foodCategory' | 'diningType', value: string) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter(item => item !== value) : [...prev[field], value] }));
  };

  const addMenu = () => {
    if (menus.name && menus.price) {
      setMenuList([...menuList, { name: menus.name, price: parseInt(menus.price) }]);
      setMenus({ name: '', price: '' });
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', description: '', address: '', latitude: '', longitude: '', priceRange: '', imageUrl: '', 
      is24Hours: false, operationalHours: JSON.parse(JSON.stringify(defaultHours)), isTaxInc: false, purpose: [], 
      viewType: 'City', areaTypes: [], facilities: [], isHalal: true, foodCategory: [], diningType: [],
      deliveryLinks: { gojek: '', grab: '', shopeeFood: '' }
    });
    setGalleryItems([]); setMenuList([]); setImageFile(null); setEditingId(null); setFacInput(''); setMapLinkInput(''); setMenus({name: '', price: ''});
  };

  const handleEditClick = (item: any, type: 'cafe' | 'kuliner') => {
    setActiveTab(type);
    const loadedHours = item.operationalHours || JSON.parse(JSON.stringify(defaultHours));
    const rawFacs = item.facilities || [];
    const parsedFacs = typeof rawFacs === 'string' ? JSON.parse(rawFacs) : rawFacs;
    const loadedAreas = parsedFacs.filter((f: string) => areaOptions.includes(f));
    const regularFacs = parsedFacs.filter((f: string) => !areaOptions.includes(f));
    let parsedPurpose = item.purpose || []; if (typeof parsedPurpose === 'string') try { parsedPurpose = JSON.parse(parsedPurpose); } catch(e) { parsedPurpose = [parsedPurpose]; }
    let parsedFoodCat = item.foodCategory || []; if (typeof parsedFoodCat === 'string') try { parsedFoodCat = JSON.parse(parsedFoodCat); } catch(e) { parsedFoodCat = []; }
    let parsedDiningType = item.diningType || []; if (typeof parsedDiningType === 'string') try { parsedDiningType = JSON.parse(parsedDiningType); } catch(e) { parsedDiningType = []; }
    
    let parsedDelivery = item.deliveryLinks || { gojek: '', grab: '', shopeeFood: '' };
    if (typeof parsedDelivery === 'string') {
      try { parsedDelivery = JSON.parse(parsedDelivery); } catch(e) { parsedDelivery = { gojek: '', grab: '', shopeeFood: '' }; }
    }

    setFormData({
      name: item.name, description: item.description || '', address: item.address, latitude: item.latitude.toString(), longitude: item.longitude.toString(),
      priceRange: item.priceRange, imageUrl: item.imageUrl || '', isTaxInc: item.isTaxInc || false, purpose: parsedPurpose, viewType: item.viewType || 'City',
      areaTypes: loadedAreas, facilities: regularFacs, is24Hours: item.is24Hours, operationalHours: loadedHours,
      isHalal: item.isHalal ?? true, foodCategory: parsedFoodCat, diningType: parsedDiningType, deliveryLinks: parsedDelivery
    });
    setMapLinkInput(`https://maps.google.com/?q=${item.latitude},${item.longitude}`);
    setGalleryItems((item.gallery || []).map((url: string) => ({ id: url, type: 'link', data: url })));
    setMenuList(item.menuItems || []); setEditingId(item.id); setIsAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: number, name: string, type: 'cafe' | 'kuliner') => {
    if (!confirm(`Hapus ${type} "${name}"?`)) return;
    try {
      const endpoint = type === 'cafe' ? `/api/cafes/${id}` : `/api/kuliners/${id}`;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, { method: 'DELETE' });
      if (res.ok) fetchData(user.id);
    } catch (err) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) return alert("Lokasi Peta belum valid.");
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
      const { areaTypes, foodCategory, diningType, isHalal, viewType, ...baseData } = formData;
      
      let dataToSubmit: any = { ...baseData, facilities: combinedFacilities, imageUrl: finalImageUrl, ownerId: user.id, gallery: finalGalleryUrls, menuItems: menuList };
      
      if (activeTab === 'kuliner') {
        dataToSubmit = { ...dataToSubmit, foodCategory, diningType, isHalal };
      } else {
        dataToSubmit = { ...dataToSubmit, viewType };
      }

      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `${process.env.NEXT_PUBLIC_API_URL}/api/${activeTab}s/${editingId}` : `${process.env.NEXT_PUBLIC_API_URL}/api/${activeTab}s`;

      const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSubmit) });
      if (res.ok) { alert("Data berhasil disimpan!"); resetForm(); setIsAdding(false); fetchData(user.id); }
      else { alert("Gagal menyimpan. Pastikan database backend sudah di-update."); }
    } catch (err) { alert("Terjadi kesalahan koneksi."); }
  };

  const currentList = activeTab === 'cafe' ? myCafes : myKuliners;
  const currentPurposeList = activeTab === 'cafe' ? cafePurposeOptions : kulinerPurposeOptions;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 font-sans pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end border-b pb-6 border-gray-200 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 uppercase italic tracking-tighter">Area Pengelola</h1>
            <p className="text-gray-500 italic text-xs md:text-sm">Atur bisnis dan pantau keramaian secara Real-Time.</p>
          </div>
          <button onClick={() => { setIsAdding(!isAdding); if(isAdding) resetForm(); }} 
            className={`font-black px-6 py-3 rounded-2xl shadow-lg transition-all text-xs uppercase tracking-widest ${isAdding ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {isAdding ? '× Batal' : `+ Tambah ${activeTab === 'cafe' ? 'Kafe' : 'Kuliner'}`}
          </button>
        </header>

        {!isAdding && (
          <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-sm mx-auto md:mx-0">
            <button onClick={() => setActiveTab('cafe')} className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'cafe' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>☕ Kafe</button>
            <button onClick={() => setActiveTab('kuliner')} className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'kuliner' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>🍛 Kuliner</button>
          </div>
        )}

        {isAdding && (
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 mb-12 animate-fade-in">
            <h2 className="text-3xl font-black mb-8 border-b pb-6 text-gray-900 uppercase italic tracking-tighter">
              {editingId ? `Edit Data ${activeTab === 'cafe' ? 'Kafe' : 'Kuliner'}` : `Daftarkan ${activeTab === 'cafe' ? 'Kafe' : 'Kuliner'} Baru`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-12">
              
              <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className={`text-xl font-black border-l-8 pl-4 uppercase tracking-tight text-gray-900 ${activeTab === 'cafe' ? 'border-blue-600' : 'border-orange-500'}`}>1. Identitas Bisnis</h3>
                  <input required type="text" className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 transition-all font-bold" placeholder={`Nama ${activeTab === 'cafe' ? 'Kafe' : 'Tempat Makan'}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <textarea className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 outline-none h-32 resize-none text-sm font-medium" placeholder="Ceritakan keunikannya..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  
                  <div>
                    <label className="block text-[10px] font-black mb-3 text-gray-400 uppercase tracking-[0.2em]">Tujuan / Vibes</label>
                    <div className="flex flex-wrap gap-2">
                      {currentPurposeList.map(purp => (
                        <button key={purp} type="button" onClick={() => toggleArrayItem('purpose', purp)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.purpose.includes(purp) ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}>{purp}</button>
                      ))}
                    </div>
                  </div>

                  <div className={`grid gap-4 pt-2 ${activeTab === 'cafe' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {activeTab === 'cafe' && (
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest">Pemandangan</label>
                        <select className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 bg-white text-xs font-bold outline-none focus:border-blue-500" value={formData.viewType} onChange={e => setFormData({...formData, viewType: e.target.value})}>
                          <option value="City">🌆 City View</option><option value="Nature">🍃 Nature View</option><option value="None">🏠 Indoor Only</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest">Estimasi Harga</label>
                      <input type="text" className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" placeholder="Rp 20k - 50k" value={formData.priceRange} onChange={e => setFormData({...formData, priceRange: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-gray-50 p-6 md:p-8 rounded-[2rem] border border-gray-100 flex flex-col">
                  <h3 className="text-xl font-black border-l-8 border-green-500 pl-4 uppercase tracking-tight text-gray-900">📍 Lokasi Maps</h3>
                  <input required type="text" className="w-full border-2 border-white rounded-2xl px-5 py-3 text-sm outline-none shadow-sm focus:border-green-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Alamat lengkap..." />
                  <div className="relative">
                    <input type="text" className="w-full border-2 border-blue-200 rounded-2xl px-5 py-4 text-xs outline-none shadow-md bg-white focus:border-blue-500 pr-12 font-bold" value={mapLinkInput} onChange={handlePasteMapLink} placeholder="Paste Link Google Maps..." />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">🔗</span>
                  </div>
                  {formData.latitude && (
                    <div className="flex-1 min-h-[200px] rounded-2xl overflow-hidden border-4 border-white shadow-lg relative mt-2">
                      <iframe className="w-full h-full absolute inset-0" src={`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&output=embed`} allowFullScreen></iframe>
                    </div>
                  )}
                </div>
              </section>

              {activeTab === 'kuliner' && (
                <section className="bg-orange-50/50 p-6 md:p-10 rounded-[2.5rem] border border-orange-100 animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black border-l-8 border-orange-500 pl-4 uppercase tracking-tight text-gray-900">🍲 Spesifikasi Kuliner</h3>
                    <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-orange-200">
                      <input type="checkbox" className="w-5 h-5 accent-orange-600 cursor-pointer" checked={formData.isHalal} onChange={e => setFormData({...formData, isHalal: e.target.checked})} />
                      <label className="text-xs font-black uppercase text-orange-800 tracking-widest cursor-pointer">Sertifikasi Halal</label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-[11px] font-black text-orange-500 mb-4 uppercase tracking-[0.2em]">Kategori Makanan</p>
                      <div className="flex flex-wrap gap-2">
                        {foodCategories.map(cat => (
                          <button key={cat} type="button" onClick={() => toggleArrayItem('foodCategory', cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.foodCategory.includes(cat) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-400 border-gray-100'}`}>{cat}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-orange-500 mb-4 uppercase tracking-[0.2em]">Tipe Pelayanan (Dining)</p>
                      <div className="flex flex-wrap gap-2">
                        {diningTypes.map(type => (
                          <button key={type} type="button" onClick={() => toggleArrayItem('diningType', type)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.diningType.includes(type) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-400 border-gray-100'}`}>{type}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <section className="bg-yellow-50/50 p-6 md:p-10 rounded-[2.5rem] border border-yellow-100">
                <h3 className="text-xl font-black border-l-8 border-yellow-500 pl-4 uppercase tracking-tight text-gray-900 mb-8">🛵 Link Pesan Antar (Opsional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-green-700">Link GoFood</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-[10px]">GF</span>
                      <input type="text" className="w-full border-2 border-white rounded-xl pl-12 pr-4 py-3 text-xs outline-none focus:border-green-500 shadow-sm" placeholder="Paste link..." value={formData.deliveryLinks.gojek} onChange={e => setFormData(p => ({...p, deliveryLinks: {...p.deliveryLinks, gojek: e.target.value}}))} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-green-800">Link GrabFood</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-[10px]">GR</span>
                      <input type="text" className="w-full border-2 border-white rounded-xl pl-12 pr-4 py-3 text-xs outline-none focus:border-green-600 shadow-sm" placeholder="Paste link..." value={formData.deliveryLinks.grab} onChange={e => setFormData(p => ({...p, deliveryLinks: {...p.deliveryLinks, grab: e.target.value}}))} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-600">Link ShopeeFood</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">SF</span>
                      <input type="text" className="w-full border-2 border-white rounded-xl pl-12 pr-4 py-3 text-xs outline-none focus:border-orange-500 shadow-sm" placeholder="Paste link..." value={formData.deliveryLinks.shopeeFood} onChange={e => setFormData(p => ({...p, deliveryLinks: {...p.deliveryLinks, shopeeFood: e.target.value}}))} />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-purple-50/50 p-6 md:p-10 rounded-[2.5rem] border border-purple-100">
                <h3 className="text-xl font-black border-l-8 border-purple-600 pl-4 uppercase tracking-tight text-gray-900 mb-8">🛋️ Fasilitas & Area</h3>
                <div className="mb-10">
                   <p className="text-[11px] font-black text-purple-400 mb-4 uppercase tracking-[0.2em]">Pilihan Tipe Area</p>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     {areaOptions.map(area => (
                       <button key={area} type="button" onClick={() => toggleArrayItem('areaTypes', area)} className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all text-left flex items-center justify-between ${formData.areaTypes.includes(area) ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-purple-200'}`}>
                         {area} {formData.areaTypes.includes(area) && '✓'}
                       </button>
                     ))}
                   </div>
                </div>
                <div>
                   <p className="text-[11px] font-black text-purple-400 mb-4 uppercase tracking-[0.2em]">Fasilitas Ekstra & Pembayaran</p>
                   <div className="flex flex-wrap gap-2 mb-6">
                     {commonFacilities.map(fac => (
                       <button key={fac} type="button" onClick={() => toggleArrayItem('facilities', fac)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.facilities.includes(fac) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}>{fac}</button>
                     ))}
                   </div>
                   <div className="relative max-w-md">
                    <input type="text" className="w-full border-2 border-purple-100 rounded-2xl px-5 py-3 text-sm outline-none bg-white focus:border-purple-500 font-bold" placeholder="Ketik fasilitas lain lalu tekan Enter..." value={facInput} onChange={e => setFacInput(e.target.value)} onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); if(facInput.trim()){ toggleArrayItem('facilities', facInput.trim()); setFacInput(''); } } }} />
                    <button type="button" onClick={() => { if(facInput.trim()){ toggleArrayItem('facilities', facInput.trim()); setFacInput(''); } }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white p-2 rounded-xl text-[10px] font-bold">ADD</button>
                   </div>
                </div>
              </section>

              <section className="bg-red-50/50 p-6 md:p-10 rounded-[2.5rem] border border-red-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black border-l-8 border-red-500 pl-4 uppercase tracking-tight text-gray-900">📝 Daftar Menu </h3>
                  <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-red-200">
                    <input type="checkbox" className="w-5 h-5 accent-red-600 cursor-pointer" checked={formData.isTaxInc} onChange={e => setFormData({...formData, isTaxInc: e.target.checked})} />
                    <label className="text-xs font-black uppercase text-red-800 tracking-widest cursor-pointer">Harga Termasuk Pajak</label>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 mb-8">
                  <input type="text" className="flex-1 border-2 border-red-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-red-500" placeholder="Nama Menu (Misal: Nasi Goreng Spesial)" value={menus.name} onChange={e => setMenus({...menus, name: e.target.value})} onKeyDown={e => { if(e.key === 'Enter'){ e.preventDefault(); addMenu(); } }} />
                  <input type="number" className="w-full md:w-48 border-2 border-red-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-red-500" placeholder="Harga (Misal: 25000)" value={menus.price} onChange={e => setMenus({...menus, price: e.target.value})} onKeyDown={e => { if(e.key === 'Enter'){ e.preventDefault(); addMenu(); } }} />
                  <button type="button" onClick={addMenu} className="bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors">Tambah</button>
                </div>

                {menuList.length > 0 && (
                  <div className="bg-white rounded-2xl border border-red-100 p-5 space-y-3 shadow-sm">
                    {menuList.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <span className="font-bold text-sm text-gray-800">{m.name} <span className="text-red-500 ml-2">Rp {m.price.toLocaleString('id-ID')}</span></span>
                        <button type="button" onClick={() => setMenuList(menuList.filter((_, i) => i !== idx))} className="text-red-400 bg-red-50 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-colors">Hapus</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-green-50/50 p-6 md:p-10 rounded-[2.5rem] border border-green-100">
                <div className="flex justify-between items-center mb-8 border-b border-green-100 pb-6">
                  <h3 className="text-xl font-black border-l-8 border-green-600 pl-4 uppercase tracking-tight text-gray-900">🕒 Jam Operasional</h3>
                  <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-green-200">
                    <input type="checkbox" className="w-5 h-5 accent-green-600 cursor-pointer" checked={formData.is24Hours} onChange={e => setFormData({...formData, is24Hours: e.target.checked})} />
                    <label className="text-xs font-black uppercase text-green-800 tracking-widest cursor-pointer">Buka 24 Jam</label>
                  </div>
                </div>
                {!formData.is24Hours && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => {
                      const h = (formData.operationalHours as any)[day];
                      return (
                        <div key={day} className={`flex flex-col p-5 rounded-[1.5rem] border-2 transition-all ${h.isOpen ? 'bg-white border-green-200 shadow-md' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`text-xs font-black uppercase tracking-widest ${h.isOpen ? 'text-green-700' : 'text-gray-300'}`}>{day}</span>
                            <input type="checkbox" className="w-4 h-4 accent-green-600" checked={h.isOpen} onChange={e => setFormData(p => ({...p, operationalHours: {...p.operationalHours, [day]: {...h, isOpen: e.target.checked}}}))} />
                          </div>
                          {h.isOpen && (
                            <div className="flex items-center gap-2">
                              <input type="time" value={h.open} onChange={e => setFormData(p => ({...p, operationalHours: {...p.operationalHours, [day]: {...h, open: e.target.value}}}))} className="border-2 border-gray-50 bg-gray-50 rounded-xl text-center text-[10px] font-bold p-2 w-full focus:bg-white focus:border-green-200 transition-all outline-none" />
                              <span className="text-gray-300 font-bold">-</span>
                              <input type="time" value={h.close} onChange={e => setFormData(p => ({...p, operationalHours: {...p.operationalHours, [day]: {...h, close: e.target.value}}}))} className="border-2 border-gray-50 bg-gray-50 rounded-xl text-center text-[10px] font-bold p-2 w-full focus:bg-white focus:border-green-200 transition-all outline-none" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="bg-blue-50/50 p-6 md:p-10 rounded-[2.5rem] border border-blue-100">
                <h3 className="text-xl font-black border-l-8 border-blue-600 pl-4 uppercase tracking-tight text-gray-900 mb-8">📸 Galeri Suasana</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-100 shadow-sm">
                    <p className="text-[11px] font-black uppercase mb-4 text-gray-400 tracking-widest">Foto Sampul Utama *</p>
                    <div onClick={() => document.getElementById('main-up')?.click()} className="aspect-video w-full bg-gray-50 rounded-[1.5rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden mb-4 hover:bg-blue-50 hover:border-blue-400 transition-all group">
                      {imageFile || formData.imageUrl ? <img src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl} className="w-full h-full object-cover" alt="Main" /> : (
                        <div className="text-center group-hover:scale-110 transition-transform"><span className="text-4xl block mb-2">🖼️</span><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Tap Untuk Upload</span></div>
                      )}
                    </div>
                    <input id="main-up" type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setImageFile(e.target.files[0])} />
                    <input type="text" className="w-full border-2 border-gray-50 rounded-xl p-3 text-xs outline-none focus:border-blue-300 font-medium" placeholder="Atau paste link URL gambar..." value={formData.imageUrl} onChange={e => {setFormData({...formData, imageUrl: e.target.value}); setImageFile(null);}} />
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-100 shadow-sm">
                    <p className="text-[11px] font-black uppercase mb-4 text-gray-400 tracking-widest">Koleksi Galeri Suasana</p>
                    <div onClick={() => document.getElementById('gal-up')?.click()} className="w-full py-6 border-4 border-dashed border-gray-100 rounded-[1.5rem] text-center cursor-pointer mb-5 hover:bg-blue-50 hover:border-blue-400 transition-all group">
                      <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">📸</span><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tambah Foto Galeri</span>
                    </div>
                    <input id="gal-up" type="file" multiple accept="image/*" className="hidden" onChange={e => { if (e.target.files) { const files = Array.from(e.target.files).map(f => ({ id: Math.random().toString(), type: 'file' as const, data: f })); setGalleryItems([...galleryItems, ...files]); } }} />
                    <div className="flex gap-2 mb-4">
                        <input type="text" className="flex-1 border-2 border-gray-50 rounded-xl p-3 text-xs outline-none focus:border-blue-300 font-medium" placeholder="Tambah via Link URL..." value={galInput} onChange={e => setGalInput(e.target.value)} />
                        <button type="button" onClick={() => { if(galInput){ setGalleryItems([...galleryItems, {id: Math.random().toString(), type:'link', data: galInput}]); setGalInput(''); } }} className="bg-gray-900 text-white px-5 rounded-xl text-[10px] font-black">ADD</button>
                    </div>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={galleryItems.map(i => i.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                          {galleryItems.map(item => <SortablePhoto key={item.id} id={item.id} item={item} onRemove={() => setGalleryItems(galleryItems.filter(i => i.id !== item.id))} />)}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </section>

              <button type="submit" className={`w-full text-white font-black py-6 rounded-[2rem] transition-all text-lg uppercase tracking-[0.3em] shadow-2xl active:scale-95 ${activeTab === 'cafe' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'}`}>🚀 Simpan Data {activeTab === 'cafe' ? 'Kafe' : 'Kuliner'}</button>
            </form>
          </div>
        )}

        {!isAdding && currentList.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100">
            <span className="text-6xl block mb-4">{activeTab === 'cafe' ? '☕' : '🍲'}</span>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-widest">Belum Ada Data</h3>
            <p className="text-gray-400 mt-2 text-sm">Ayo mulai daftarkan bisnis {activeTab} milikmu!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {!isAdding && currentList.map((item: any) => (
            <div key={item.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 flex flex-col justify-between hover:shadow-2xl transition-all group">
              <div className="flex gap-5 items-center mb-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white shrink-0 relative">
                  <img src={item.imageUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                  {activeTab === 'kuliner' && item.isHalal && <span className="absolute bottom-0 right-0 bg-green-500 text-white text-[8px] font-black px-1.5 rounded-tl-lg">HALAL</span>}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-black text-gray-900 uppercase italic truncate text-xl tracking-tighter leading-none mb-1">{item.name}</h3>
                  <p className="text-[10px] text-gray-400 uppercase truncate font-bold tracking-widest">{item.address}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-[1.5rem] p-5 mb-6 border border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-ping ${activeTab === 'cafe' ? 'bg-blue-500' : 'bg-orange-500'}`}></span> Live Update Kapasitas
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['sepi', 'normal', 'ramai', 'penuh'].map(s => (
                    <button key={s} onClick={() => updateCrowdStatus(item.id, s, activeTab)} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${item.crowdStatus === s ? (activeTab === 'cafe' ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-orange-500 text-white border-orange-500 shadow-lg scale-105') : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button onClick={() => handleEditClick(item, activeTab)} className="flex-1 bg-stone-100 text-stone-600 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Edit Data</button>
                <button onClick={() => handleDeleteClick(item.id, item.name, activeTab)} className="flex-1 bg-red-50 text-red-400 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}