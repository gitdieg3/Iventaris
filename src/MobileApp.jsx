import { useState, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { ScanLine, History, LogOut, CheckCircle2, RefreshCcw, PlusCircle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from './supabase'

export default function MobileApp({ onBack }) {
  const [activeTab, setActiveTab] = useState('scan') 
  const [scannedCode, setScannedCode] = useState('')
  const [scannedBarang, setScannedBarang] = useState(null)
  const [isScanning, setIsScanning] = useState(true)
  
  const [jasaList, setJasaList] = useState([])
  const [kategoriList, setKategoriList] = useState([]) 
  const [riwayatHariIni, setRiwayatHariIni] = useState([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [manualCode, setManualCode] = useState('') 
  
  const [formData, setFormData] = useState({ jumlah: 1, id_jasa: '', catatan: '' })
  const [inputForm, setInputForm] = useState({ nama: '', id_kategori: '', stok: 0, deskripsi: '' })

  useEffect(() => {
    fetchJasa()
    fetchKategori()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') fetchRiwayatHariIni()
  }, [activeTab])

  const fetchJasa = async () => {
    const { data } = await supabase.from('jasa_pengirim').select('*').order('nama_jasa', { ascending: true })
    if (data) setJasaList(data)
  }

  const fetchKategori = async () => {
    const { data } = await supabase.from('kategori').select('id, nama_kategori').order('nama_kategori', { ascending: true })
    if (data) setKategoriList(data)
  }

  // LOGIKA RIWAYAT GABUNGAN (SCAN KELUAR & INPUT BARU)
  const fetchRiwayatHariIni = async () => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const isoStart = startOfDay.toISOString()
    
    // 1. Ambil data barang keluar (Scan)
    const { data: dataKeluar } = await supabase
      .from('barang_keluar')
      .select('*, barang(nama_barang), jasa_pengirim(nama_jasa)')
      .gte('tanggal_keluar', isoStart)

    // 2. Ambil data input barang baru (Input)
    const { data: dataMasuk } = await supabase
      .from('barang')
      .select('id, nama_barang, stok, created_at')
      .gte('created_at', isoStart)

    // 3. Format biar seragam
    const formatKeluar = (dataKeluar || []).map(item => ({
      id: `out_${item.id}`,
      tipe: 'keluar',
      nama: item.barang?.nama_barang || 'Barang Dihapus',
      waktu: item.tanggal_keluar,
      detail: item.jasa_pengirim?.nama_jasa || '-',
      jumlah: item.jumlah
    }))

    const formatMasuk = (dataMasuk || []).map(item => ({
      id: `in_${item.id}`,
      tipe: 'masuk',
      nama: item.nama_barang,
      waktu: item.created_at,
      detail: 'Input Data Baru',
      jumlah: item.stok
    }))

    // 4. Gabungin dan urutin dari yang terbaru ke terlama
    const gabungan = [...formatKeluar, ...formatMasuk].sort((a, b) => new Date(b.waktu) - new Date(a.waktu))
      
    setRiwayatHariIni(gabungan)
  }

  const handleManualSubmit = async () => {
    if (!manualCode) return toast.error('Masukkan kode!')
    const { data, error } = await supabase.from('barang').select('*').eq('kode_unik', manualCode).single()
    if (error || !data) {
      toast.error('Kode tidak ditemukan!')
    } else {
      setScannedCode(manualCode)
      setScannedBarang(data)
      setIsScanning(false)
    }
  }

  const handleScan = async (result) => {
    if (!isScanning) return
    if (result) {
      const code = typeof result === 'string' ? result : (result[0]?.rawValue || result.text || result)
      setIsScanning(false) 
      
      const { data, error } = await supabase.from('barang').select('*').eq('kode_unik', code).single()
      if (error || !data) {
        toast.error('QR tidak valid!')
        setTimeout(() => setIsScanning(true), 2000)
      } else {
        setScannedCode(code)
        setScannedBarang(data)
      }
    }
  }

  const prosesKeluar = async () => {
    if (!formData.id_jasa) return toast.error('Pilih jasa pengirim!')
    if (parseInt(formData.jumlah) > scannedBarang.stok) return toast.error('Stok tidak cukup!')
    
    setIsLoading(true)
    const sisaStokBaru = scannedBarang.stok - parseInt(formData.jumlah)
    await supabase.from('barang').update({ stok: sisaStokBaru }).eq('id', scannedBarang.id)
    await supabase.from('barang_keluar').insert([{
      id_barang: scannedBarang.id, jumlah: parseInt(formData.jumlah), id_jasa_pengirim: parseInt(formData.id_jasa), catatan: formData.catatan
    }])
    
    toast.success('Stok berhasil dipotong!')
    setScannedCode('')
    setScannedBarang(null)
    setManualCode('')
    setFormData({ jumlah: 1, id_jasa: '', catatan: '' })
    setIsScanning(true)
    setIsLoading(false)
  }

  const simpanBarangBaru = async () => {
    if (!inputForm.nama || !inputForm.id_kategori || inputForm.stok === '') {
      return toast.error('Nama, Kategori, dan Stok wajib diisi!')
    }
    
    setIsLoading(true)
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase()
    const kodeUnikBaru = `SND-${randomStr}`

    const { error } = await supabase.from('barang').insert([{
      kode_unik: kodeUnikBaru,
      nama_barang: inputForm.nama,
      id_kategori: parseInt(inputForm.id_kategori),
      stok: parseInt(inputForm.stok),
      deskripsi: inputForm.deskripsi
    }])

    if (error) {
      toast.error(`Gagal menyimpan: ${error.message}`)
    } else {
      toast.success(`Barang baru berhasil ditambahkan!`)
      setInputForm({ nama: '', id_kategori: '', stok: 0, deskripsi: '' }) 
      // Otomatis arahkan bapak lu ke tab history biar dia liat hasilnya
      setActiveTab('history')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 w-full max-w-md mx-auto relative shadow-2xl overflow-hidden">
      <div className="bg-zinc-900 text-white px-5 py-4 flex justify-between items-center shadow-md z-10">
        <div>
          <h1 className="font-bold text-lg">SoundSys App</h1>
          <p className="text-xs text-zinc-400">Mode Mobile Scanner</p>
        </div>
        <button onClick={onBack} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 text-zinc-300">
          <LogOut size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 p-4">
        
        {/* TAB SCAN */}
        {activeTab === 'scan' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-zinc-900 rounded-2xl overflow-hidden relative min-h-[300px] flex items-center justify-center">
              {isScanning ? (
                <Scanner onScan={handleScan} components={{ audio: false, finder: false }} />
              ) : (
                <div className="text-center p-6 text-white flex flex-col items-center">
                  <CheckCircle2 size={48} className="text-emerald-400 mb-2" />
                  <p className="font-bold text-lg text-emerald-400">{scannedBarang?.nama_barang}</p>
                  <p className="text-sm text-zinc-400">Sisa Stok: {scannedBarang?.stok}</p>
                  <button onClick={() => { setScannedCode(''); setIsScanning(true); setManualCode('') }} className="mt-4 flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg text-sm">
                    <RefreshCcw size={16} /> Ulangi
                  </button>
                </div>
              )}
            </div>

            {isScanning && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex gap-2">
                  <input type="text" placeholder="Atau masukkan kode unik..." value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="flex-1 border rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"/>
                  <button onClick={handleManualSubmit} className="bg-zinc-900 text-white px-4 rounded-xl text-sm font-bold">Cari</button>
                </div>
              </div>
            )}

            {scannedCode && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-semibold text-zinc-800 text-center border-b pb-3">Proses Barang Keluar</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500">Jumlah</label>
                    <input type="number" value={formData.jumlah} onChange={(e) => setFormData({...formData, jumlah: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none mt-1" />
                  </div>
                  <div className="flex-[2]">
                    <label className="text-xs text-zinc-500">Kurir / Jasa</label>
                    <select value={formData.id_jasa} onChange={(e) => setFormData({...formData, id_jasa: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none mt-1">
                      <option value="">Pilih</option>
                      {jasaList.map(j => <option key={j.id} value={j.id}>{j.nama_jasa}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Catatan</label>
                  <input type="text" value={formData.catatan} onChange={(e) => setFormData({...formData, catatan: e.target.value})} placeholder="Tujuan..." className="w-full border rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none mt-1" />
                </div>
                <button onClick={prosesKeluar} disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium mt-2">
                  {isLoading ? 'Memproses...' : 'Potong Stok'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB INPUT */}
        {activeTab === 'input' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                <PlusCircle size={20} className="text-emerald-600" />
                <h3 className="font-semibold text-zinc-800">Daftar Barang Baru</h3>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500">Nama Barang</label>
                <input type="text" value={inputForm.nama} onChange={(e) => setInputForm({...inputForm, nama: e.target.value})} placeholder="Contoh: Kabel Audio 10m" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 outline-none mt-1" />
              </div>
              <div className="flex gap-3">
                <div className="flex-[2]">
                  <label className="text-xs font-medium text-zinc-500">Kategori</label>
                  <select value={inputForm.id_kategori} onChange={(e) => setInputForm({...inputForm, id_kategori: e.target.value})} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 outline-none mt-1 bg-white">
                    <option value="">Pilih Kategori</option>
                    {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-zinc-500">Stok Awal</label>
                  <input type="number" min="0" value={inputForm.stok} onChange={(e) => setInputForm({...inputForm, stok: e.target.value})} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 outline-none mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500">Catatan / Deskripsi</label>
                <textarea value={inputForm.deskripsi} onChange={(e) => setInputForm({...inputForm, deskripsi: e.target.value})} placeholder="Spesifikasi barang..." rows="2" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 outline-none mt-1 resize-none"></textarea>
              </div>
              <button onClick={simpanBarangBaru} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl font-medium mt-4 transition-colors disabled:opacity-70">
                {isLoading ? 'Menyimpan...' : <><Save size={18} /> Simpan Data</>}
              </button>
            </div>
          </div>
        )}

        {/* TAB HISTORY GABUNGAN */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="font-bold text-zinc-800 mb-4 px-1">Aktivitas Hari Ini</h2>
            {riwayatHariIni.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Belum ada aktivitas hari ini.</div>
            ) : (
              <div className="space-y-3">
                {riwayatHariIni.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm">{item.nama}</p>
                      <p className="text-xs text-zinc-500 mt-1">{new Date(item.waktu).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} • {item.detail}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg font-bold text-sm ${item.tipe === 'keluar' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {item.tipe === 'keluar' ? '-' : '+'}{item.jumlah}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 flex justify-around items-center pb-safe pt-2 pb-3 z-20">
        <button onClick={() => setActiveTab('scan')} className="flex flex-col items-center gap-1 p-2 w-20">
          <ScanLine size={24} className={activeTab === 'scan' ? 'text-emerald-600' : 'text-zinc-400'} />
          <span className={`text-[10px] font-medium ${activeTab === 'scan' ? 'text-emerald-600' : 'text-zinc-400'}`}>Scan</span>
        </button>
        <button onClick={() => setActiveTab('input')} className="flex flex-col items-center gap-1 p-2 w-20">
          <PlusCircle size={24} className={activeTab === 'input' ? 'text-emerald-600' : 'text-zinc-400'} />
          <span className={`text-[10px] font-medium ${activeTab === 'input' ? 'text-emerald-600' : 'text-zinc-400'}`}>Input</span>
        </button>
        <button onClick={() => setActiveTab('history')} className="flex flex-col items-center gap-1 p-2 w-20">
          <History size={24} className={activeTab === 'history' ? 'text-emerald-600' : 'text-zinc-400'} />
          <span className={`text-[10px] font-medium ${activeTab === 'history' ? 'text-emerald-600' : 'text-zinc-400'}`}>Hari Ini</span>
        </button>
      </div>
    </div>
  )
}