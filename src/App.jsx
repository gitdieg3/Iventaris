import { useState } from 'react'
import { Toaster } from 'sonner'
import { LayoutDashboard, Package, Tags, ScanLine, AudioLines, History, ArrowLeft } from 'lucide-react'

// Import Semua Halaman
import Portal from './Portal'
import MobileApp from './MobileApp'
import DashboardHome from './DashboardHome'
import MasterBarang from './MasterBarang'
import KategoriJasa from './KategoriJasa'
import RiwayatKeluar from './RiwayatKeluar'
import ScanKeluar from './ScanKeluar'

export default function App() {
  // State untuk mengontrol tampilan utama (portal | admin | mobile)
  const [appMode, setAppMode] = useState('portal')
  
  // State untuk menu aktif khusus mode admin
  const [activeTab, setActiveTab] = useState('dashboard')

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'barang', label: 'Master Barang & QR', icon: Package },
    { id: 'kategori', label: 'Kategori & Jasa', icon: Tags },
    { id: 'scan', label: 'Scan Keluar (PC)', icon: ScanLine },
    { id: 'riwayat', label: 'Riwayat Keluar', icon: History },
  ]

  // Jika di portal, tampilkan Portal Component
  if (appMode === 'portal') {
    return <Portal onSelectMode={setAppMode} />
  }

  // Jika di mode mobile, tampilkan MobileApp Component
  if (appMode === 'mobile') {
    return (
      <>
        <Toaster position="top-center" richColors />
        <MobileApp onBack={() => setAppMode('portal')} />
      </>
    )
  }

  // Jika di mode Admin, tampilkan Dashboard PC yang lama
  return (
    <div className="flex h-screen bg-slate-50 font-sans p-2">
      <Toaster position="top-right" richColors />

      <aside className="w-64 bg-zinc-950 text-zinc-400 flex flex-col rounded-2xl shadow-xl">
        <div className="p-6 flex items-center gap-3 text-white border-b border-zinc-800/50 mb-4">
          <div className="bg-zinc-800 p-2 rounded-xl text-white">
            <AudioLines size={24} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide text-white leading-tight">SoundSys</h1>
            <p className="text-xs text-zinc-500">Admin Inventory</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Tombol Kembali ke Portal dari Admin */}
        <div className="p-4 border-t border-zinc-800/50">
          <button 
            onClick={() => setAppMode('portal')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> Kembali ke Portal
          </button>
        </div>
      </aside>

      <main className="flex-1 px-8 py-6 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardHome />}
        {activeTab === 'barang' && <MasterBarang />}
        {activeTab === 'kategori' && <KategoriJasa />}
        {activeTab === 'scan' && <ScanKeluar />}
        {activeTab === 'riwayat' && <RiwayatKeluar />}
      </main>
    </div>
  )
}