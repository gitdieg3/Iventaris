import { useState, useEffect, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react' 
import { Package, QrCode, Save, Printer, Trash2, LayoutList, Edit, Search, ChevronLeft, ChevronRight, Eye, X, Download } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from './supabase'

export default function MasterBarang() {
  const [formData, setFormData] = useState({
    nama: '',
    id_kategori: '',
    deskripsi: '',
    stok: 0
  })
  const [kodeUnik, setKodeUnik] = useState('')
  const [barangList, setBarangList] = useState([])
  const [kategoriList, setKategoriList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  // State untuk Mode Edit
  const [editId, setEditId] = useState(null)

  // State untuk Pencarian & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // State untuk Modal QR
  const [selectedQR, setSelectedQR] = useState(null)
  const qrRef = useRef(null)

  useEffect(() => {
    fetchBarang()
    fetchKategori()
  }, [])

  const fetchKategori = async () => {
    const { data, error } = await supabase.from('kategori').select('id, nama_kategori').order('nama_kategori', { ascending: true })
    if (!error && data) setKategoriList(data)
  }

  const fetchBarang = async () => {
    const { data, error } = await supabase.from('barang').select('*, kategori(nama_kategori)').order('created_at', { ascending: false })
    if (!error && data) setBarangList(data)
  }

  const generateKode = () => {
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase()
    return `SND-${randomStr}`
  }

  const handleInput = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Generate kode unik otomatis HANYA JIKA mode tambah baru (bukan edit)
    if (!editId) {
      if (name === 'nama' && value.length > 0 && !kodeUnik) {
        setKodeUnik(generateKode())
      } else if (name === 'nama' && value.length === 0) {
        setKodeUnik('')
      }
    }
  }

  // --- LOGIKA SIMPAN & UPDATE ---
  const simpanBarang = async () => {
    if (!formData.nama || formData.stok === '' || !formData.id_kategori) {
      toast.error('Nama barang, Kategori, dan Stok wajib diisi!')
      return
    }

    // --- FITUR ANTI-DUPLIKAT (Ditambahkan di sini) ---
    const isDuplicate = barangList.some(
      (item) => item.nama_barang.toLowerCase() === formData.nama.toLowerCase() && item.id !== editId
    )

    if (isDuplicate) {
      toast.error(`Gagal: Barang "${formData.nama}" sudah terdaftar di sistem!`)
      return 
    }
    // --------------------------------------------------

    setIsLoading(true)
    
    if (editId) {
      // PROSES UPDATE
      const { error } = await supabase
        .from('barang')
        .update({
          nama_barang: formData.nama,
          id_kategori: parseInt(formData.id_kategori), 
          stok: parseInt(formData.stok),
          deskripsi: formData.deskripsi
        })
        .eq('id', editId)

      if (error) {
        toast.error(`Gagal update: ${error.message}`)
      } else {
        toast.success(`Barang berhasil diupdate!`)
        batalkanEdit()
        fetchBarang()
      }
    } else {
      // PROSES SIMPAN BARU
      const { error } = await supabase
        .from('barang')
        .insert([{
          kode_unik: kodeUnik,
          nama_barang: formData.nama,
          id_kategori: parseInt(formData.id_kategori), 
          stok: parseInt(formData.stok),
          deskripsi: formData.deskripsi
        }])

      if (error) {
        toast.error(`Gagal simpan: ${error.message}`)
      } else {
        toast.success(`Barang ${formData.nama} berhasil disimpan!`)
        batalkanEdit()
        fetchBarang()
      }
    }
    setIsLoading(false)
  }

  const siapkanEdit = (item) => {
    setEditId(item.id)
    setKodeUnik(item.kode_unik)
    setFormData({
      nama: item.nama_barang,
      id_kategori: item.id_kategori || '',
      deskripsi: item.deskripsi || '',
      stok: item.stok
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const batalkanEdit = () => {
    setEditId(null)
    setKodeUnik('')
    setFormData({ nama: '', id_kategori: '', deskripsi: '', stok: 0 })
  }

  const hapusBarang = async (id, nama) => {
    const confirmDelete = window.confirm(`Yakin mau hapus ${nama}?`)
    if (!confirmDelete) return

    const { error } = await supabase.from('barang').delete().eq('id', id)
    if (error) {
      toast.error(`Gagal menghapus: ${error.message}`)
    } else {
      toast.success('Barang dihapus')
      fetchBarang()
    }
  }

  // --- LOGIKA FILTER & PAGINATION ---
  const filteredBarang = barangList.filter(item => 
    item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.kode_unik.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredBarang.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredBarang.slice(indexOfFirstItem, indexOfLastItem)

  // --- LOGIKA DOWNLOAD QR ---
  const downloadQR = () => {
    const canvas = qrRef.current.querySelector('canvas')
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
      let downloadLink = document.createElement("a")
      downloadLink.href = pngUrl
      downloadLink.download = `QR_${selectedQR.kode_unik}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{editId ? 'Edit Data Barang' : 'Input Barang Baru'}</h2>
        <p className="text-zinc-500 text-sm mt-1">{editId ? `Mengubah data untuk ${kodeUnik}` : 'Daftarkan barang dan cetak QR Code'}</p>
      </div>

      {/* --- FORM INPUT --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nama Barang</label>
              <input type="text" name="nama" value={formData.nama} onChange={handleInput} placeholder="Contoh: Speaker 15 Inch Yamaha" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Kategori</label>
                <select name="id_kategori" value={formData.id_kategori} onChange={handleInput} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                  <option value="">-- Pilih Kategori --</option>
                  {kategoriList.map(kat => <option key={kat.id} value={kat.id}>{kat.nama_kategori}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Stok Saat Ini</label>
                <input type="number" name="stok" min="0" value={formData.stok} onChange={handleInput} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Catatan / Deskripsi</label>
              <textarea name="deskripsi" value={formData.deskripsi} onChange={handleInput} rows="2" placeholder="Spesifikasi atau kondisi barang..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"></textarea>
            </div>

            <div className="flex gap-3">
              <button onClick={simpanBarang} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl transition-colors font-medium disabled:opacity-70">
                <Save size={18} /> {isLoading ? 'Menyimpan...' : (editId ? 'Update Barang' : 'Simpan Barang')}
              </button>
              {editId && (
                <button onClick={batalkanEdit} className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors font-medium">
                  Batal
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PREVIEW QR FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-slate-50 w-full rounded-xl p-8 flex flex-col items-center justify-center border border-slate-100 mb-4 min-h-[250px]">
            {kodeUnik ? (
              <div className="animate-in zoom-in duration-300 flex flex-col items-center">
                <div className="bg-white p-3 rounded-xl shadow-sm mb-3">
                  <QRCodeCanvas value={kodeUnik} size={140} level="H" />
                </div>
                <p className="font-mono font-bold text-zinc-800 tracking-wider">{kodeUnik}</p>
              </div>
            ) : (
              <div className="text-zinc-400 flex flex-col items-center">
                <QrCode size={48} strokeWidth={1} className="mb-2 opacity-50" />
                <p className="text-sm">QR Code akan muncul<br/>saat nama barang diisi</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- TABEL DATA --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-800">
            <LayoutList size={20} className="text-blue-600" />
            <h3 className="font-semibold text-lg">Daftar Stok Aset</h3>
          </div>
          
          {/* Pencarian (Filter) */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Cari nama / kode QR..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-slate-50 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Kode QR</th>
                <th className="px-6 py-4 border-b border-slate-100">Nama Barang</th>
                <th className="px-6 py-4 border-b border-slate-100">Kategori</th>
                <th className="px-6 py-4 border-b border-slate-100">Stok</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-zinc-400">Tidak ada data ditemukan.</td></tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="px-6 py-4 font-mono text-zinc-800 font-medium">{item.kode_unik}</td>
                    <td className="px-6 py-4 text-zinc-900">{item.nama_barang}</td>
                    <td className="px-6 py-4 text-purple-700">{item.kategori?.nama_kategori || '-'}</td>
                    <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md font-semibold">{item.stok}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedQR(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat QR">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => siapkanEdit(item)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Barang">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => hapusBarang(item.id, item.nama_barang)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Barang">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-zinc-500">
            <span>Halaman {currentPage} dari {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft size={18} />
              </button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL VIEW & DOWNLOAD QR --- */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-semibold text-zinc-900">QR Code Barang</h3>
              <button onClick={() => setSelectedQR(null)} className="text-zinc-400 hover:text-zinc-600"><X size={20}/></button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center bg-slate-50" ref={qrRef}>
              <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <QRCodeCanvas value={selectedQR.kode_unik} size={180} level="H" includeMargin={true} />
              </div>
              <p className="font-mono font-bold text-xl text-zinc-800 tracking-wider mb-1">{selectedQR.kode_unik}</p>
              <p className="text-sm text-zinc-500 text-center">{selectedQR.nama_barang}</p>
            </div>
            <div className="p-5 border-t border-gray-100 bg-white">
              <button onClick={downloadQR} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl transition-colors font-medium">
                <Download size={18} /> Download Gambar QR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}