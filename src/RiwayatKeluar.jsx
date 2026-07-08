import { useState, useEffect } from 'react'
import { History, Search, FileDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { supabase } from './supabase'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function RiwayatKeluar() {
  const [riwayatList, setRiwayatList] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    fetchRiwayat()
  }, [])

  const fetchRiwayat = async () => {
    // Tarik data dengan relasi ke tabel barang (nama, kode) dan jasa_pengirim (nama_jasa)
    const { data, error } = await supabase
      .from('barang_keluar')
      .select(`
        id, jumlah, catatan, tanggal_keluar,
        barang (kode_unik, nama_barang, kategori(nama_kategori)),
        jasa_pengirim (nama_jasa)
      `)
      .order('tanggal_keluar', { ascending: false })
    
    if (!error && data) setRiwayatList(data)
  }

  // --- LOGIKA FILTER ---
  const filteredData = riwayatList.filter(item => {
    const matchName = item.barang?.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      item.barang?.kode_unik.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filter by Date
    const itemDate = new Date(item.tanggal_keluar).setHours(0,0,0,0)
    const filterStart = startDate ? new Date(startDate).setHours(0,0,0,0) : null
    const filterEnd = endDate ? new Date(endDate).setHours(0,0,0,0) : null

    let matchDate = true
    if (filterStart && filterEnd) matchDate = itemDate >= filterStart && itemDate <= filterEnd
    else if (filterStart) matchDate = itemDate >= filterStart
    else if (filterEnd) matchDate = itemDate <= filterEnd

    return matchName && matchDate
  })

  // --- LOGIKA PAGINATION ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)

  // --- LOGIKA CETAK PDF ---
  const exportPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text("Laporan Riwayat Barang Keluar - SoundSys", 14, 20)
    doc.setFontSize(10)
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28)

    const tableColumn = ["Tanggal", "Kode QR", "Nama Barang", "Jumlah", "Jasa Pengirim", "Catatan"]
    const tableRows = []

    filteredData.forEach(item => {
      const rowData = [
        new Date(item.tanggal_keluar).toLocaleDateString('id-ID'),
        item.barang?.kode_unik || '-',
        item.barang?.nama_barang || '-',
        item.jumlah.toString(),
        item.jasa_pengirim?.nama_jasa || '-',
        item.catatan || '-'
      ]
      tableRows.push(rowData)
    })

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [39, 39, 42] } // Warna header zinc-900
    })

    doc.save(`Laporan_Barang_Keluar_${new Date().getTime()}.pdf`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Riwayat Barang Keluar</h2>
          <p className="text-zinc-500 text-sm mt-1">Pantau dan cetak laporan sirkulasi aset</p>
        </div>
        <button onClick={exportPDF} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm">
          <FileDown size={18} /> Cetak Laporan PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* --- FILTER SECTION --- */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Cari nama barang atau kode QR..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1) }}
                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-zinc-900 w-full sm:w-40"
              />
            </div>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1) }}
                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-zinc-900 w-full sm:w-40"
              />
            </div>
          </div>
        </div>

        {/* --- TABEL --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-slate-50 text-zinc-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Tanggal Keluar</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Jml</th>
                <th className="px-6 py-4">Jasa Pengirim</th>
                <th className="px-6 py-4">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-zinc-400">Tidak ada riwayat transaksi.</td></tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(item.tanggal_keluar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900">{item.barang?.nama_barang}</p>
                      <p className="font-mono text-xs text-zinc-500 mt-0.5">{item.barang?.kode_unik}</p>
                    </td>
                    <td className="px-6 py-4"><span className="bg-red-100 text-red-700 px-2 py-1 rounded-md font-semibold">-{item.jumlah}</span></td>
                    <td className="px-6 py-4 text-emerald-700">{item.jasa_pengirim?.nama_jasa}</td>
                    <td className="px-6 py-4 text-zinc-500 italic max-w-[200px] truncate">{item.catatan || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION --- */}
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
    </div>
  )
}