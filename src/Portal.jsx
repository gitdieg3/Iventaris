import { MonitorDot, Smartphone } from 'lucide-react'

export default function Portal({ onSelectMode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center p-3 bg-zinc-900 rounded-2xl mb-4">
             <MonitorDot size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Portal SoundSys</h1>
          <p className="text-zinc-500 mt-2">Pilih mode aplikasi yang ingin Anda gunakan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tombol Admin Panel */}
          <button 
            onClick={() => onSelectMode('admin')}
            className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left animate-in slide-in-from-bottom-8 duration-700"
          >
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MonitorDot size={32} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Admin Dashboard</h2>
            <p className="text-sm text-zinc-500">Akses penuh kelola barang, kategori, dan laporan PDF.</p>
          </button>

          {/* Tombol Mobile Scanner */}
          <button 
            onClick={() => onSelectMode('mobile')}
            className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all text-left animate-in slide-in-from-bottom-8 duration-700 delay-100"
          >
            <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Smartphone size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Mobile Scanner</h2>
            <p className="text-sm text-zinc-500">Khusus HP. Scan QR Code cepat & cek riwayat hari ini.</p>
          </button>
        </div>
      </div>
    </div>
  )
}