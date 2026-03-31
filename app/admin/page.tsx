'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  
  const [cafes, setCafes] = useState<any[]>([]);
  const [kuliners, setKuliners] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'cafe' | 'kuliner' | 'users'>('cafe');
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedUser = localStorage.getItem('geshare_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role !== 'ADMIN') {
        alert('⛔ AKSES DITOLAK! Halaman ini dikunci secara ketat hanya untuk Super Admin.');
        router.push('/');
      } else {
        setAdmin(parsedUser);
        fetchData();
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchData = () => {
    // Fetch Users
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`)
      .then(res => res.json())
      .then(data => { if (!data.error) setUsers(data); })
      .catch(() => console.log('Gagal muat users'));
    
    // Fetch Cafes
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/cafes`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCafes(data);
          setScores(prev => {
            const newScores = { ...prev };
            data.forEach((c: any) => newScores[`cafe_${c.id}`] = c.popularityScore || 0);
            return newScores;
          });
        }
      }).catch(() => console.log('Gagal muat cafes'));

    // Fetch Kuliners (Asumsi kamu sudah/akan buat endpoint admin/kuliners)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kuliners`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setKuliners(data);
          setScores(prev => {
            const newScores = { ...prev };
            data.forEach((k: any) => newScores[`kuliner_${k.id}`] = k.popularityScore || 0);
            return newScores;
          });
        }
      }).catch(() => console.log('Endpoint kuliners admin mungkin belum ada'));
  };

  const handleUpdateScore = async (id: number, type: 'cafe' | 'kuliner') => {
    const newScore = scores[`${type}_${id}`];
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${type}s/${id}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ popularityScore: newScore })
      });
      if (res.ok) {
        alert(`✅ Skor Popularitas ${type.toUpperCase()} berhasil diperbarui!`);
        fetchData();
      } else {
        alert('Gagal mengupdate skor.');
      }
    } catch (err) { alert('Terjadi kesalahan koneksi.'); }
  };

  const handleDeletePlace = async (id: number, name: string, type: 'cafe' | 'kuliner') => {
    if (!window.confirm(`⚠️ HAPUS PAKSA ${type.toUpperCase()} "${name}"? Tindakan Admin tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${type}s/${id}`, { method: 'DELETE' });
      if (res.ok) { 
        alert(`🗑️ ${type.toUpperCase()} berhasil diberantas!`); 
        fetchData(); 
      }
    } catch (err) { alert(`Gagal menghapus ${type}.`); }
  };

  const handleTransfer = async (id: number, newOwnerId: string, type: 'cafe' | 'kuliner') => {
    if (!newOwnerId) return;
    if (!window.confirm(`Serahkan hak milik tempat ini ke User #${newOwnerId}?`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/${type}s/${id}/transfer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId })
      });
      if (res.ok) { 
        alert('🤝 Kepemilikan berhasil ditransfer!'); 
        fetchData();
      }
    } catch (err) { alert('Gagal mentransfer kepemilikan.'); }
  };

  const handleChangeRole = async (userId: number, currentRole: string) => {
    if (currentRole === 'ADMIN') return alert('Tidak bisa mengubah role sesama Admin.');
    const newRole = currentRole === 'USER' ? 'OWNER' : 'USER';
    if (!window.confirm(`Ubah role pengguna ini menjadi ${newRole}?`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) { alert('✨ Role berhasil diubah!'); fetchData(); }
    } catch (err) { alert('Gagal mengubah role.'); }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!window.confirm(`⚠️ PERINGATAN! Hapus permanen akun "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('🗑️ Akun berhasil dihapus dari sistem!');
        fetchData();
      }
    } catch (err) { alert('Gagal menghapus akun.'); }
  };

  if (!admin) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-black tracking-widest animate-pulse">VERIFIKASI OTORITAS...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER ADMIN --- */}
        <header className="bg-gray-900 rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-2xl flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block shadow-lg shadow-red-500/50">Level Otoritas: Super Admin</span>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">Pusat Komando</h1>
            <p className="text-gray-400 mt-2 italic font-medium">Kendali penuh atas seluruh data aplikasi.</p>
          </div>
          <Link href="/">
            <button className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl transition-all text-xs uppercase tracking-widest border border-white/10">Kembali ke App</button>
          </Link>
        </header>

        {/* --- TABS NAVIGATION --- */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <button onClick={() => setActiveTab('cafe')} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-xs md:text-sm border ${activeTab === 'cafe' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
            ☕ Moderasi Kafe ({cafes.length})
          </button>
          <button onClick={() => setActiveTab('kuliner')} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-xs md:text-sm border ${activeTab === 'kuliner' ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30 border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
            🍲 Moderasi Kuliner ({kuliners.length})
          </button>
          <button onClick={() => setActiveTab('users')} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-xs md:text-sm border ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
            👥 Data Pengguna ({users.length})
          </button>
        </div>

        {/* --- KONTEN MODERASI KAFE & KULINER --- */}
        {(activeTab === 'cafe' || activeTab === 'kuliner') && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-gray-400 uppercase tracking-widest text-[10px]">
                    <th className="pb-4 font-black px-2">ID</th>
                    <th className="pb-4 font-black px-2">Tempat & Lokasi</th>
                    <th className="pb-4 font-black px-2">🔥 Skor Promo</th>
                    <th className="pb-4 font-black px-2">Pemilik (ID)</th>
                    <th className="pb-4 font-black px-2 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'cafe' ? cafes : kuliners).map((place: any) => (
                    <tr key={place.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-2 font-black text-gray-400 text-xs">#{place.id}</td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-gray-100">
                            <img src={place.imageUrl || 'https://via.placeholder.com/50'} className="w-full h-full object-cover" alt="thumb" />
                          </div>
                          <div>
                            <div className="font-black text-gray-900 uppercase italic leading-tight">{place.name}</div>
                            <div className="text-[10px] font-bold text-gray-500 line-clamp-1 max-w-[200px] mt-0.5 uppercase tracking-wider">{place.address}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={scores[`${activeTab}_${place.id}`] ?? 0}
                            onChange={(e) => setScores({...scores, [`${activeTab}_${place.id}`]: parseInt(e.target.value) || 0})}
                            className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1.5 text-xs font-black text-center outline-none focus:border-red-500 bg-white transition-all"
                          />
                          <button 
                            onClick={() => handleUpdateScore(place.id, activeTab)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${scores[`${activeTab}_${place.id}`] !== (place.popularityScore || 0) ? 'bg-red-500 text-white shadow-md animate-pulse' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                          >
                            {scores[`${activeTab}_${place.id}`] !== (place.popularityScore || 0) ? 'Simpan' : 'Tersimpan'}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-2 font-bold text-gray-600 text-xs">
                        {place.owner ? (
                          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 inline-block">
                            {place.owner.name} <span className="opacity-50">(#{place.ownerId})</span>
                          </span>
                        ) : (
                          <span className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg border border-red-100 font-black text-[10px] uppercase tracking-widest inline-block">
                            Tanpa Pemilik
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-2 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <select 
                            className="border-2 border-gray-200 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none bg-gray-50 focus:border-blue-500 max-w-[140px] text-gray-600 cursor-pointer"
                            onChange={(e) => handleTransfer(place.id, e.target.value, activeTab)}
                            defaultValue=""
                          >
                            <option value="" disabled>🤝 Transfer Ke...</option>
                            {users.filter((u:any) => u.role !== 'USER').map((u: any) => (
                              <option key={u.id} value={u.id}>{u.name} (#{u.id})</option>
                            ))}
                          </select>

                          <button onClick={() => handleDeletePlace(place.id, place.name, activeTab)} className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border border-red-100 hover:border-red-500">
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(activeTab === 'cafe' ? cafes : kuliners).length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-bold italic">Belum ada data {activeTab} di sistem.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- KONTEN DATA PENGGUNA --- */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-gray-400 uppercase tracking-widest text-[10px]">
                    <th className="pb-4 font-black px-2">ID</th>
                    <th className="pb-4 font-black px-2">Nama & Email</th>
                    <th className="pb-4 font-black px-2">Role Saat Ini</th>
                    <th className="pb-4 font-black px-2 text-right">Ubah Otoritas & Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-2 font-black text-gray-400 text-xs">#{u.id}</td>
                      <td className="py-4 px-2">
                        <div className="font-black text-gray-900 uppercase">{u.name}</div>
                        <div className="text-xs text-gray-500 font-bold">{u.email}</div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${u.role === 'ADMIN' ? 'bg-red-50 text-red-600 border-red-100' : u.role === 'OWNER' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          {u.role !== 'ADMIN' ? (
                            <>
                              <button onClick={() => handleChangeRole(u.id, u.role)} className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border border-indigo-100 hover:border-indigo-600">
                                Jadikan {u.role === 'USER' ? 'Owner' : 'User'}
                              </button>
                              <button onClick={() => handleDeleteUser(u.id, u.name)} className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border border-red-100 hover:border-red-600">
                                Hapus Akun
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2 block bg-gray-50 px-4 py-2 rounded-lg">Otoritas Tertinggi</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-bold italic">Data pengguna belum dimuat.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}