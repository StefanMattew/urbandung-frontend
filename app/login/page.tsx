'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      localStorage.setItem('geshare_user', JSON.stringify(data));
      
      alert(isRegister ? '🎉 Pendaftaran Berhasil! Selamat datang.' : ' Login Berhasil! Selamat datang, ' + data.name);
      
      window.location.href = '/'; 
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">UrBandung</Link>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">
            {isRegister ? 'Buat Akun Baru' : 'Selamat Datang Kembali'}
          </h2>
          <p className="text-gray-500 mt-2">
            {isRegister ? 'Daftar untuk menyimpan kafe favoritmu.' : 'Masuk untuk melanjutkan eksplorasi.'}
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-6 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masukkan namamu" />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="nama@email.com" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mendaftar Sebagai</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="USER">Mahasiswa / Pengunjung Kafe</option>
                <option value="OWNER">Pemilik / Pengelola Kafe</option>
              </select>
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors mt-4">
            {isRegister ? 'Daftar Sekarang' : 'Masuk'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-blue-600 font-bold hover:underline">
              {isRegister ? 'Masuk di sini' : 'Daftar sekarang'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}