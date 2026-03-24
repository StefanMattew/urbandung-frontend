'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [cafes, setCafes] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('cafes');
  const [scores, setScores] = useState<Record<number, number>>({});

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
  }, []);

  const fetchData = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`).then(res => res.json()).then(setUsers);
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/cafes`)
      .then(res => res.json())
      .then(data => {
        setCafes(data);
        const initialScores: Record<number, number> = {};
        data.forEach((c: any) => {
          initialScores[c.id] = c.popularityScore || 0;
        });
        setScores(initialScores);
      });
  };

  const handleUpdateScore = async (cafeId: number) => {
    const newScore = scores[cafeId];
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cafes/${cafeId}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ popularityScore: newScore })
      });
      if (res.ok) {
        alert('✅ Skor Popularitas berhasil diperbarui!');
        fetchData();
      } else {
        alert('Gagal mengupdate skor.');
      }
    } catch (err) { alert('Terjadi kesalahan koneksi.'); }
  };

  const handleDeleteCafe = async (id: number, name: string) => {
    if (!window.confirm(`⚠️ HAPUS PAKSA kafe "${name}"? Tindakan Admin tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cafes/${id}`, { method: 'DELETE' });
      if (res.ok) { alert('🗑️ Kafe berhasil diberantas!'); fetchData(); }
    } catch (err) { alert('Gagal menghapus kafe.'); }
  };

  const handleTransfer = async (cafeId: number, newOwnerId: string) => {
    if (!newOwnerId) return;
    if (!window.confirm(`Serahkan hak milik kafe ini ke User #${newOwnerId}?`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/cafes/${cafeId}/transfer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId })
      });
      if (res.ok) { 
        alert('🤝 Kepemilikan berhasil ditransfer!'); 
        fetchData();
      }
    } catch (err) { alert('Gagal mentransfer kafe.'); }
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
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="bg-gray-900 rounded-3xl p-10 mb-8 shadow-2xl flex justify-between items-end">
          <div>
            <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block shadow-lg shadow-red-500/50">Level Otoritas: Super Admin</span>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Pusat Komando</h1>
            <p className="text-gray-400 mt-2 italic">Kendali penuh atas seluruh data aplikasi.</p>
          </div>
          <Link href="/">
            <button className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs uppercase tracking-widest">Kembali ke App</button>
          </Link>
        </header>

        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('cafes')} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${activeTab === 'cafes' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
            🏪 Moderasi Kafe ({cafes.length})
          </button>
          <button onClick={() => setActiveTab('users')} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
            👥 Data Pengguna ({users.length})
          </button>
        </div>

        {activeTab === 'cafes' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-gray-400 uppercase tracking-widest text-[10px]">
                    <th className="pb-4 font-black">ID</th>
                    <th className="pb-4 font-black">Kafe & Lokasi</th>
                    <th className="pb-4 font-black">🔥 Skor Promo</th>
                    <th className="pb-4 font-black">Pemilik (ID)</th>
                    <th className="pb-4 font-black text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {cafes.map((cafe: any) => (
                    <tr key={cafe.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-black text-gray-400">#{cafe.id}</td>
                      <td className="py-4">
                        <div className="font-bold text-gray-900">{cafe.name}</div>
                        <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{cafe.address}</div>
                      </td>
                      
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={scores[cafe.id] ?? 0}
                            onChange={(e) => setScores({...scores, [cafe.id]: parseInt(e.target.value) || 0})}
                            className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-bold text-center outline-none focus:border-blue-500 bg-white"
                          />
                          <button 
                            onClick={() => handleUpdateScore(cafe.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${scores[cafe.id] !== cafe.popularityScore ? 'bg-blue-600 text-white shadow-md animate-pulse' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                          >
                            {scores[cafe.id] !== cafe.popularityScore ? 'Simpan' : 'Tersimpan'}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 font-bold text-blue-600 text-xs">
                        {cafe.owner ? `${cafe.owner.name} (#${cafe.ownerId})` : 'Tanpa Pemilik'}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <select 
                            className="border border-gray-300 rounded-lg px-2 py-2 text-[10px] font-bold outline-none bg-gray-50 max-w-[150px]"
                            onChange={(e) => handleTransfer(cafe.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled>🤝 Transfer Hak Milik...</option>
                            {users.filter((u:any) => u.role !== 'USER').map((u: any) => (
                              <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>
                            ))}
                          </select>

                          <button onClick={() => handleDeleteCafe(cafe.id, cafe.name)} className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all">
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-gray-400 uppercase tracking-widest text-[10px]">
                    <th className="pb-4 font-black">ID</th>
                    <th className="pb-4 font-black">Nama & Email</th>
                    <th className="pb-4 font-black">Role Saat Ini</th>
                    <th className="pb-4 font-black text-right">Ubah Otoritas & Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-black text-gray-400">#{u.id}</td>
                      <td className="py-4">
                        <div className="font-bold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-red-100 text-red-600' : u.role === 'OWNER' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {u.role !== 'ADMIN' ? (
                            <>
                              <button onClick={() => handleChangeRole(u.id, u.role)} className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all">
                                Jadikan {u.role === 'USER' ? 'Owner' : 'User'}
                              </button>
                              <button onClick={() => handleDeleteUser(u.id, u.name)} className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all">
                                Hapus
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">Otoritas Tertinggi</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}