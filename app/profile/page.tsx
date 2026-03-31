'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ favorites: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('geshare_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchUserStats(parsedUser.id);
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchUserStats = async (userId: number) => {
    try {
      // Ambil jumlah favorit
      const resFav = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/favorites`);
      const favData = await resFav.json();
      
      // Ambil jumlah review (Asumsi endpoint ini ada atau kita hitung dari total review global)
      // Kalau belum ada endpoint khusus, kita set default atau dummy dulu biar UI cantik
      setStats({
        favorites: favData.length || 0,
        reviews: 0 // Kamu bisa tambahkan logic fetch review nanti jika sudah ada API-nya
      });
    } catch (error) {
      console.error("Gagal load stats profil");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
      
      {/* --- BACKGROUND DEKORATIF --- */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500 w-full relative">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="relative -mt-24 md:-mt-32">
          
          {/* --- KARTU PROFIL UTAMA --- */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white p-8 md:p-12 text-center animate-fade-in">
            <div className="relative inline-block mb-6">
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] flex items-center justify-center text-white font-black text-5xl md:text-6xl shadow-2xl transform -rotate-3 transition-transform hover:rotate-0 duration-500 ${user.role === 'ADMIN' ? 'bg-purple-600' : user.role === 'OWNER' ? 'bg-green-600' : 'bg-blue-600'}`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-gray-900 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg border-2 border-white rotate-3">
                {user.role}
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">
              {user.name}
            </h1>
            <p className="text-gray-400 font-bold text-sm md:text-base mb-8 uppercase tracking-widest leading-none">
              {user.email}
            </p>

            {/* --- BOX STATISTIK --- */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <Link href="/favorit" className="bg-stone-50 p-6 rounded-3xl border border-stone-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all group">
                <p className="text-2xl md:text-3xl font-black text-gray-900 mb-1">{loading ? '...' : stats.favorites}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Favorit Disimpan</p>
              </Link>
              <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 transition-all opacity-60">
                <p className="text-2xl md:text-3xl font-black text-gray-900 mb-1">{loading ? '...' : stats.reviews}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ulasan Ditulis</p>
              </div>
            </div>
          </div>

          {/* --- MENU SETTINGS & INFO --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                <span className="text-blue-600">🛡️</span> Keamanan Akun
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Verifikasi</p>
                    <p className="text-sm font-bold text-green-600 uppercase">Akun Aktif</p>
                  </div>
                  <span className="text-xl">✅</span>
                </div>
                <button className="w-full py-4 rounded-2xl border-2 border-gray-100 text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all">
                  Ubah Kata Sandi
                </button>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                  <span className="text-orange-500">✨</span> Kontribusi Kamu
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                  "Terima kasih sudah menjadi bagian dari komunitas UrBandung. Setiap tempat yang kamu simpan membantu kami memetakan spot terbaik di Kota Kembang!"
                </p>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('geshare_user');
                  router.push('/login');
                }}
                className="w-full mt-8 py-4 rounded-2xl bg-red-50 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                Keluar Dari Akun
              </button>
            </section>

          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}