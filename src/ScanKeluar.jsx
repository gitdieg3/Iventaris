import { useState, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { ScanLine, CheckCircle2, PackageMinus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from './supabase'

export default function ScanKeluar() {
  const [scannedCode, setScannedCode] = useState('')
  const [scannedBarang, setScannedBarang] = useState(null)
  const [isScanning, setIsScanning] = useState(true)
  const [jasaList, setJasaList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    jumlah: 1,
    id_jasa: '',
    catatan: ''
  })

  useEffect(() => {
    fetchJasa()
  }, [])

  const fetchJasa = async () => {
    const { data } = await supabase.from('jasa_pengirim').select('*').order('nama_jasa', { ascending: true })
    if (data) setJasaList(data)
  }

  const handleScan = async (result) => {
    if (result) {
      const code = typeof result === 'string' ? result : (result[0]?.rawValue || result.text || result)
      
      if (code && isScanning) {
        setIsScanning(false)
        
        // Cek barang di Supabase berdasarkan Kode QR
        const { data, error } = await supabase.from('barang').select('*').eq('kode_unik', code).single()
        
        if (error || !data) {
          toast.error(`QR Code ${code} tidak terdaftar di sistem!`)
          setTimeout(() => setIsScanning(true), 2500) // Nyalakan kamera lagi setelah 2.5 detik
        } else {
          setScannedCode(code)
          setScannedBarang(data)
          toast.success(`Barang terdeteksi: ${data.nama_barang} (Sisa Stok: ${data.stok})`)
        }
      }
    }
  }

  const handleInput = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const prosesBarangKeluar = async () => {
    if (!formData.id_jasa) return toast.error('Pilih jasa pengirim dulu!')
    if (formData.jumlah < 1) return toast.error('Jumlah minimal 1')
    if (formData.jumlah > scannedBarang.stok) return toast.error(`Stok tidak cukup! Sisa stok hanya ${scannedBarang.stok}`)
    
    setIsLoading(true)

    // 1. Kurangi stok di tabel barang
    const sisaStokBaru = scannedBarang.stok - formData.jumlah
    const { error: errUpdate } = await supabase.from('barang').update({ stok: sisaStokBaru }).eq('id', scannedBarang.id)

    if (errUpdate) {
      toast.error('Gagal mengurangi stok database')
      setIsLoading(false)
      return
    }

    // 2. Catat transaksi ke tabel barang_keluar
    const { error: errInsert } = await supabase.from('barang_keluar').insert([{
      id_barang: scannedBarang.id,
      jumlah: parseInt(formData.jumlah),
      id_jasa_pengirim: parseInt(formData.id_jasa),
      catatan: formData.catatan
    }])

    if (errInsert) {
      toast.error(`Error mencatat riwayat: ${errInsert.message}`)
    } else {
      toast.success(`Berhasil! ${formData.jumlah} unit ${scannedBarang.nama_barang} dikeluarkan.`)
      // Reset form
      setScannedCode('')
      setScannedBarang(null)
      setFormData({ jumlah: 1, id_jasa: '', catatan: '' })
      setIsScanning(true)
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Scan Barang Keluar</h2>
        <p className="text-zinc-500 text-sm mt-1">Arahkan kamera ke QR Code, sistem akan otomatis memotong stok</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner Kamera */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-zinc-800">
            <ScanLine size={20} className="text-blue-600" />
            <h3 className="font-semibold text-lg">Kamera Scanner</h3>
          </div>
          
          <div className="flex-1 bg-zinc-900 rounded-xl overflow-hidden relative flex items-center justify-center min-h-[300px] border border-zinc-800">
            {isScanning ? (
              <Scanner 
                onScan={handleScan}
                components={{ audio: false, finder: false }}
              />
            ) : (
              <div className="text-center p-6 flex flex-col items-center">
                <CheckCircle2 size={48} className="text-emerald-400 mb-3" />
                <p className="text-white font-medium text-lg">Berhasil Terdeteksi</p>
                <p className="text-emerald-400 font-bold mt-2">{scannedBarang?.nama_barang}</p>
                <p className="text-zinc-400 text-sm mt-1">Sisa Stok: {scannedBarang?.stok}</p>
                
                <button 
                  onClick={() => {
                    setScannedCode('')
                    setScannedBarang(null)
                    setIsScanning(true)
                  }}
                  className="mt-6 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
                >
                  <RefreshCcw size={16} /> Batal & Scan Ulang
                </button>
              </div>
            )}
            
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/30 rounded-xl">
                <div className="w-full h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-[scan_2s_ease-in-out_infinite]" style={{ animation: 'scan 2s ease-in-out infinite' }}></div>
              </div>
            )}
          </div>
        </div>

        {/* Form Barang Keluar */}
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 ${!scannedCode ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 mb-6 text-zinc-800">
            <PackageMinus size={20} className="text-amber-600" />
            <h3 className="font-semibold text-lg">Detail Barang Keluar</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Barang Terpilih</label>
              <input 
                type="text" 
                readOnly
                value={scannedBarang ? `${scannedCode} - ${scannedBarang.nama_barang}` : ''}
                placeholder="Menunggu hasil scan..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Jumlah Keluar</label>
                <input 
                  type="number" 
                  name="jumlah"
                  min="1"
                  max={scannedBarang?.stok || 1}
                  value={formData.jumlah}
                  onChange={handleInput}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Jasa Pengirim</label>
                <select 
                  name="id_jasa"
                  value={formData.id_jasa}
                  onChange={handleInput}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="">-- Pilih --</option>
                  {jasaList.map(jasa => (
                    <option key={jasa.id} value={jasa.id}>{jasa.nama_jasa}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Catatan (Tujuan / Pembeli)</label>
              <textarea 
                name="catatan"
                value={formData.catatan}
                onChange={handleInput}
                rows="3"
                placeholder="Misal: Sewa untuk acara nikahan di gedung A..." 
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
              ></textarea>
            </div>

            <button 
              onClick={prosesBarangKeluar} 
              disabled={isLoading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl transition-colors font-medium mt-2 disabled:opacity-70"
            >
              {isLoading ? 'Memproses...' : 'Proses & Kurangi Stok'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes scan { 0% { transform: translateY(0); } 50% { transform: translateY(300px); } 100% { transform: translateY(0); } }`}</style>
    </div>
  )
}