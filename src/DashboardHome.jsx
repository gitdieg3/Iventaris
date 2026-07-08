import { useState, useEffect } from 'react'
import { Package, ArrowUpRight, ArrowDownRight, Activity, Loader2, TrendingUp, AlertTriangle, Calendar, Lightbulb } from 'lucide-react'
import { supabase } from './supabase'

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalAset: 0,
    keluarBulanIni: 0,
    stokMenipis: 0
  })
  const [topItems, setTopItems] = useState([])
  const [monthlyStats, setMonthlyStats] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    
    try {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth()

      // 1. Tarik Data Dasar Barang
      const { data: dataBarang, count: totalAset } = await supabase
        .from('barang')
        .select('nama_barang, stok', { count: 'exact' })
        .order('stok', { ascending: true })

      // 2. Tarik Data Riwayat Keluar buat Analisis
      const { data: dataKeluar } = await supabase
        .from('barang_keluar')
        .select('jumlah, tanggal_keluar, barang(nama_barang)')

      // --- PROSES ANALISIS DATA ---
      let keluarBulanIni = 0
      const itemMap = {}
      const monthArr = Array(12).fill(0)
      const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

      if (dataKeluar) {
        dataKeluar.forEach(tx => {
          const txDate = new Date(tx.tanggal_keluar)
          const qty = tx.jumlah
          const nama = tx.barang?.nama_barang || 'Barang Dihapus'

          // Hitung Top Items
          itemMap[nama] = (itemMap[nama] || 0) + qty

          // Hitung per Bulan (hanya untuk tahun ini)
          if (txDate.getFullYear() === currentYear) {
            monthArr[txDate.getMonth()] += qty
            
            // Hitung spesifik bulan ini
            if (txDate.getMonth() === currentMonth) {
              keluarBulanIni += qty
            }
          }
        })
      }

      // Format Top 5 Barang
      const sortedTop = Object.entries(itemMap)
        .map(([nama, jumlah]) => ({ nama, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah)
        .slice(0, 5)

      // Format Statistik Bulanan
      const formattedMonthly = monthArr.map((total, index) => ({
        bulan: namaBulan[index],
        total: total
      }))

      // Rekomendasi Restock (Barang dengan stok di bawah 5)
      const lowStock = dataBarang ? dataBarang.filter(b => b.stok < 5).slice(0, 5) : []

      // --- SET STATE ---
      setStats({
        totalAset: totalAset || 0,
        keluarBulanIni,
        stokMenipis: lowStock.length
      })
      setTopItems(sortedTop)
      setMonthlyStats(formattedMonthly)
      setRecommendations(lowStock)

    } catch (error) {
      console.error("Gagal memuat data dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cari angka tertinggi untuk bikin Bar Chart (persentase)
  const maxTopItem = topItems.length > 0 ? Math.max(...topItems.map(i => i.jumlah)) : 1

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Dashboard & Analisis</h2>
          <p className="text-zinc-500 text-sm mt-1">Ringkasan stok dan analisis sirkulasi aset secara real-time</p>
        </div>
      </div>

      {/* --- GRID SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-100 p-5 rounded-2xl border border-purple-200/50 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-purple-600/80 text-sm font-semibold mb-1">Total Macam Barang</p>
              <h3 className="text-3xl font-bold text-purple-950 flex items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin text-purple-400" size={24} /> : stats.totalAset}
              </h3>
            </div>
            <div className="bg-purple-200/70 p-2.5 rounded-xl text-purple-700">
              <Package size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-purple-700 font-medium">
            <Activity size={16} /><span>Terdaftar di sistem</span>
          </div>
        </div>

        <div className="bg-emerald-100 p-5 rounded-2xl border border-emerald-200/50 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-emerald-600/80 text-sm font-semibold mb-1">Barang Keluar (Bulan Ini)</p>
              <h3 className="text-3xl font-bold text-emerald-950 flex items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin text-emerald-400" size={24} /> : stats.keluarBulanIni}
              </h3>
            </div>
            <div className="bg-emerald-200/70 p-2.5 rounded-xl text-emerald-700">
              <ArrowUpRight size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
            <span>Unit barang disewa/keluar</span>
          </div>
        </div>

        <div className="bg-amber-100 p-5 rounded-2xl border border-amber-200/50 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-amber-600/80 text-sm font-semibold mb-1">Peringatan Stok (&lt; 5 unit)</p>
              <h3 className="text-3xl font-bold text-amber-950 flex items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin text-amber-400" size={24} /> : stats.stokMenipis}
              </h3>
            </div>
            <div className="bg-amber-200/70 p-2.5 rounded-xl text-amber-700">
              <AlertTriangle size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-amber-700 font-medium">
            <span>Butuh perhatian segera</span>
          </div>
        </div>
      </div>

      {/* --- BAGIAN ANALISIS CERDAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* TOP 5 BARANG PALING LARIS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6 text-zinc-800">
            <TrendingUp size={20} className="text-blue-600" />
            <h3 className="font-semibold text-lg">Top 5 Barang Paling Sering Keluar</h3>
          </div>
          
          <div className="space-y-5">
            {isLoading ? (
              <div className="text-center py-10 text-zinc-400"><Loader2 className="animate-spin mx-auto mb-2" /> Memuat data...</div>
            ) : topItems.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 bg-slate-50 rounded-xl border border-slate-100">Belum ada riwayat barang keluar.</div>
            ) : (
              topItems.map((item, index) => {
                const percentage = Math.round((item.jumlah / maxTopItem) * 100)
                return (
                  <div key={index} className="relative">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-zinc-800">{item.nama}</span>
                      <span className="text-zinc-600 font-semibold">{item.jumlah} unit</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* SMART RECOMMENDATIONS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-zinc-800">
            <Lightbulb size={20} className="text-amber-500" />
            <h3 className="font-semibold text-lg">Rekomendasi Restock Cerdas</h3>
          </div>
          
          <div className="flex-1 bg-amber-50/50 rounded-xl p-5 border border-amber-100/50">
            {isLoading ? (
               <div className="text-center py-8 text-zinc-400"><Loader2 className="animate-spin mx-auto mb-2" /> Analisis data...</div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center">
                <div className="bg-emerald-100 p-3 rounded-full mb-3 text-emerald-600"><Activity size={24} /></div>
                <p className="font-medium text-emerald-800">Stok Aman Terkendali!</p>
                <p className="text-sm text-emerald-600/80 mt-1">Tidak ada aset yang mendesak untuk di-restock saat ini.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-amber-800 font-medium mb-2">Barang berikut hampir habis, pertimbangkan untuk melengkapi stok:</p>
                <ul className="space-y-3">
                  {recommendations.map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-amber-100">
                      <span className="font-medium text-zinc-700">{item.nama_barang}</span>
                      <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-md text-xs font-bold">
                        Sisa {item.stok}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- STATISTIK TABEL PER BULAN --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
         <div className="flex items-center gap-2 mb-6 text-zinc-800">
            <Calendar size={20} className="text-indigo-600" />
            <h3 className="font-semibold text-lg">Statistik Barang Keluar Tahun {new Date().getFullYear()}</h3>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
               <div className="text-center py-10 text-zinc-400"><Loader2 className="animate-spin mx-auto mb-2" /> Menyiapkan statistik...</div>
            ) : (
              <table className="w-full text-center text-sm text-zinc-600">
                <thead className="bg-slate-50 text-zinc-500 font-medium">
                  <tr>
                    {monthlyStats.map((stat, i) => (
                      <th key={i} className="px-3 py-3 border-b border-slate-100 min-w-[60px]">{stat.bulan}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    {monthlyStats.map((stat, i) => (
                      <td key={i} className="px-3 py-4 font-semibold text-zinc-800 border-b border-slate-50">
                        {stat.total > 0 ? (
                          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                            {stat.total}
                          </span>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
          </div>
      </div>

    </div>
  )
}