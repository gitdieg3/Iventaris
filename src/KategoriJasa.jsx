import { useState, useEffect } from 'react'
import { Tags, Truck, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from './supabase'

export default function KategoriJasa() {
  const [kategoriList, setKategoriList] = useState([])
  const [jasaList, setJasaList] = useState([])
  
  const [inputKategori, setInputKategori] = useState('')
  const [inputJasa, setInputJasa] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Ambil data saat halaman pertama kali dibuka
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Tarik data Kategori
    const { data: dataKategori, error: errKategori } = await supabase
      .from('kategori')
      .select('*')
      .order('id', { ascending: true })
    
    if (!errKategori && dataKategori) setKategoriList(dataKategori)

    // Tarik data Jasa Pengirim
    const { data: dataJasa, error: errJasa } = await supabase
      .from('jasa_pengirim')
      .select('*')
      .order('id', { ascending: true })
    
    if (!errJasa && dataJasa) setJasaList(dataJasa)
  }

  // --- LOGIKA KATEGORI ---
  const tambahKategori = async () => {
    if (!inputKategori) return
    setIsLoading(true)

    const { error } = await supabase
      .from('kategori')
      .insert([{ nama_kategori: inputKategori }])

    if (error) {
      toast.error(`Gagal tambah kategori: ${error.message}`)
    } else {
      toast.success('Kategori berhasil ditambahkan')
      setInputKategori('')
      fetchData() // Refresh tabel
    }
    setIsLoading(false)
  }

  const hapusKategori = async (id) => {
    const confirmDelete = window.confirm('Yakin mau hapus kategori ini?')
    if (!confirmDelete) return

    const { error } = await supabase.from('kategori').delete().eq('id', id)
    if (error) {
      toast.error('Gagal menghapus (mungkin kategori ini sedang dipakai di Master Barang)')
    } else {
      toast.success('Kategori dihapus')
      fetchData()
    }
  }

  // --- LOGIKA JASA PENGIRIM ---
  const tambahJasa = async () => {
    if (!inputJasa) return
    setIsLoading(true)

    const { error } = await supabase
      .from('jasa_pengirim')
      .insert([{ nama_jasa: inputJasa }])

    if (error) {
      toast.error(`Gagal tambah jasa: ${error.message}`)
    } else {
      toast.success('Jasa pengirim berhasil ditambahkan')
      setInputJasa('')
      fetchData() // Refresh tabel
    }
    setIsLoading(false)
  }

  const hapusJasa = async (id) => {
    const confirmDelete = window.confirm('Yakin mau hapus jasa ini?')
    if (!confirmDelete) return

    const { error } = await supabase.from('jasa_pengirim').delete().eq('id', id)
    if (error) {
      toast.error('Gagal menghapus jasa pengirim')
    } else {
      toast.success('Jasa pengirim dihapus')
      fetchData()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Master Kategori & Jasa</h2>
        <p className="text-zinc-500 text-sm mt-1">Kelola data referensi (Database Real-time)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom Kategori */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-zinc-800">
            <Tags size={20} className="text-purple-600" />
            <h3 className="font-semibold text-lg">Kategori Barang</h3>
          </div>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={inputKategori}
              onChange={(e) => setInputKategori(e.target.value)}
              placeholder="Contoh: Amplifier..." 
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              onKeyDown={(e) => e.key === 'Enter' && tambahKategori()}
            />
            <button 
              onClick={tambahKategori} 
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <ul className="space-y-2">
            {kategoriList.map((item) => (
              <li key={item.id} className="bg-slate-50 px-4 py-2.5 rounded-lg text-sm text-zinc-700 border border-slate-100 flex justify-between items-center group">
                <span>{item.nama_kategori}</span>
                <button onClick={() => hapusKategori(item.id)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
            {kategoriList.length === 0 && <li className="text-center text-sm text-zinc-400 py-2">Belum ada kategori</li>}
          </ul>
        </div>

        {/* Kolom Jasa Pengirim */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-zinc-800">
            <Truck size={20} className="text-emerald-600" />
            <h3 className="font-semibold text-lg">Jasa Pengirim</h3>
          </div>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={inputJasa}
              onChange={(e) => setInputJasa(e.target.value)}
              placeholder="Contoh: Lalamove..." 
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              onKeyDown={(e) => e.key === 'Enter' && tambahJasa()}
            />
            <button 
              onClick={tambahJasa} 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2 rounded-xl transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <ul className="space-y-2">
            {jasaList.map((item) => (
              <li key={item.id} className="bg-slate-50 px-4 py-2.5 rounded-lg text-sm text-zinc-700 border border-slate-100 flex justify-between items-center group">
                <span>{item.nama_jasa}</span>
                <button onClick={() => hapusJasa(item.id)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
            {jasaList.length === 0 && <li className="text-center text-sm text-zinc-400 py-2">Belum ada jasa pengirim</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}