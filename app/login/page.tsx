'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  useEffect(() => {
  if (searchParams.get('mode') === 'register') {
    setIsRegister(true);
  } else {
    setIsRegister(false);
  }
}, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
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
            
                <div className="mt-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">
                    Mendaftar Sebagai
                </label>
                <div className="grid grid-cols-2 gap-4">
                   
                    <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'USER'})}
                    className={`relative p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 group ${
                        formData.role === 'USER' 
                        ? 'border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-100 scale-105' 
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                    }`}
                    >
                    <div className={`text-4xl transition-transform duration-500 ${formData.role === 'USER' ? 'scale-110 rotate-[-5deg]' : 'group-hover:scale-110'}`}>
                        🎒
                    </div>
                    <div className="text-center">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${formData.role === 'USER' ? 'text-blue-600' : 'text-gray-400'}`}>
                        Penjelajah
                        </p>
                        <p className="text-[8px] font-bold opacity-60 leading-tight mt-1">Cari Kafe & Makan</p>
                    </div>
                    {formData.role === 'USER' && (
                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg animate-bounce">
                        ✓
                        </div>
                    )}
                    </button>

                    {/* --- OPSI OWNER (MITRA) --- */}
                    <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'OWNER'})}
                    className={`relative p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 group ${
                        formData.role === 'OWNER' 
                        ? 'border-orange-500 bg-orange-50/50 shadow-xl shadow-orange-100 scale-105' 
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                    }`}
                    >
                    <div className={`text-4xl transition-transform duration-500 ${formData.role === 'OWNER' ? 'scale-110 rotate-[5deg]' : 'group-hover:scale-110'}`}>
                        🏪
                    </div>
                    <div className="text-center">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${formData.role === 'OWNER' ? 'text-orange-600' : 'text-gray-400'}`}>
                        Mitra Bisnis
                        </p>
                        <p className="text-[8px] font-bold opacity-60 leading-tight mt-1">Kelola Tempatmu</p>
                    </div>
                    {formData.role === 'OWNER' && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg animate-bounce">
                        ✓
                        </div>
                    )}
                    </button>
                </div>
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