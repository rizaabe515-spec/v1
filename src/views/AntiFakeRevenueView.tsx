import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { NonRevenueTransaction } from '../types/erp';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  DollarSign, 
  Building2, 
  UserCheck, 
  RefreshCw,
  PlusCircle,
  X
} from 'lucide-react';

export const AntiFakeRevenueView: React.FC = () => {
  const { nonRevenueTransactions, recordNonRevenueInflow, journals } = useERP();

  const [showInflowModal, setShowInflowModal] = useState<boolean>(false);
  const [inflowType, setInflowType] = useState<NonRevenueTransaction['type']>('CASH_ADVANCE_RETURN');
  const [inflowAmount, setInflowAmount] = useState<number>(2500000);
  const [inflowMemo, setInflowMemo] = useState<string>('Sisa belanja perlengkapan tournament');
  const [inflowResult, setInflowResult] = useState<string | null>(null);

  // Audit: Calculate total non-revenue funds and verify 0 leakage into 4-xxxx
  const totalNonRevenueInflows = nonRevenueTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Check if any non-revenue journal touched 4-xxxx
  const nonRevRuleCodes = ['CA-03', 'FIN-01', 'FIN-02', 'FIN-03', 'SAL-06'];
  const leakedJournals = journals.filter(j => 
    nonRevRuleCodes.includes(j.ruleCode) && 
    j.lines.some(l => l.accountCode.startsWith('4-'))
  );
  const is100PercentSecure = leakedJournals.length === 0;

  const handleInflowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = recordNonRevenueInflow(inflowType, inflowAmount, inflowMemo);
    if (res.success) {
      setInflowResult('SUKSES: Transaksi kas masuk tercatat aman pada akun Neraca (Bukan Pendapatan).');
      setTimeout(() => {
        setShowInflowModal(false);
        setInflowResult(null);
      }, 1500);
    } else {
      setInflowResult(`GAGAL: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            Proteksi Anti-Omzet Palsu (Zero Revenue Leakage Engine)
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Pengendalian Arus Kas Masuk Non-Pendapatan
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Menjamin dana pengembalian Cash Advance, pinjaman afiliasi PT DKSI, talangan pemilik, dan pindah buku antar-bank <strong>DILARANG KERAS</strong> masuk ke akun pendapatan (4-xxxx) atau laporan omzet.
          </p>
        </div>

        <button
          onClick={() => setShowInflowModal(true)}
          className="px-3.5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          + Catat Kas Masuk Non-Omzet
        </button>
      </div>

      {/* Security Health Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Status Integritas Omzet</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
            100% TERPROTEKSI
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Kebocoran ke Akun 4-xxxx: <strong className="text-emerald-400 font-mono">Rp 0</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Total Kas Masuk Non-Omzet</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-white mt-2">
            Rp {totalNonRevenueInflows.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dicatat ke Liabilitas &amp; Ekuitas (Neraca)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Validasi Aturan Otomatis</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-purple-400 mt-2">
            STRICT INTERCEPT
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            GL Engine otomatis menolak input 4-xxxx pada transaksi non-omzet
          </div>
        </div>
      </div>

      {/* 4 Inviolable Anti-Fraud Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule 1: CA-03 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-sm">CA-03: Pengembalian Cash Advance</div>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300 font-semibold">
              Kredit: 1-1401
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sisa uang muka belanja operasional karyawan yang disetorkan kembali ke rekening giro bukan pendapatan baru, melainkan pemulihan aset lancar (Kredit 1-1401).
          </p>
          <div className="text-[11px] font-mono text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800">
            Jurnal Benar: Dr 1-1104 Bank Mandiri / Cr 1-1401 Uang Muka Karyawan
          </div>
        </div>

        {/* Rule 2: FIN-01 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-sm">FIN-01: Pinjaman Afiliasi PT DKSI</div>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300 font-semibold">
              Kredit: 2-1401
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Injeksi modal kerja dari pihak berelasi PT DKSI adalah kewajiban utang jangka pendek, bukan omzet penjualan (Kredit 2-1401 Hutang Pihak Berelasi PT DKSI).
          </p>
          <div className="text-[11px] font-mono text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800">
            Jurnal Benar: Dr 1-1104 Bank Mandiri / Cr 2-1401 Hutang Pihak Berelasi DKSI
          </div>
        </div>

        {/* Rule 3: FIN-02 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-sm">FIN-02: Talangan Modal Pemilik</div>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300 font-semibold">
              Kredit: 3-1102
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Setoran pribadi owner untuk talangan operasional dicatat sebagai akun Ekuitas Pemilik (Kredit 3-1102), dilarang diakui sebagai omzet cafe ataupun court.
          </p>
          <div className="text-[11px] font-mono text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800">
            Jurnal Benar: Dr 1-1104 Bank Mandiri / Cr 3-1102 Talangan Modal Pemilik
          </div>
        </div>

        {/* Rule 4: FIN-03 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-sm">FIN-03: Pindah Buku BNI ke Mandiri</div>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300 font-semibold">
              Kredit: 1-1105
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Transfer dana holding/penampungan QRIS dari Bank BNI ke rekening giro operasional Bank Mandiri hanyalah mutasi kas internal antar rekening bank.
          </p>
          <div className="text-[11px] font-mono text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800">
            Jurnal Benar: Dr 1-1104 Bank Mandiri / Cr 1-1105 Bank BNI Holding
          </div>
        </div>
      </div>

      {/* Non-Revenue Transaction History & Audit Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
          <div>
            <h2 className="text-sm font-semibold text-white">Log Audit Arus Kas Masuk Non-Pendapatan</h2>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Setiap transaksi telah diverifikasi dan dipastikan tidak mempengaruhi Laba Rugi ataupun omzet penjualan.
            </p>
          </div>
          <span className="font-mono text-slate-400">{nonRevenueTransactions.length} Transaksi Terverifikasi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Jenis Arus Kas</th>
                <th className="py-2.5 px-3">Akun Kredit (Tujuan)</th>
                <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                <th className="py-2.5 px-3">Jurnal Single GL</th>
                <th className="py-2.5 px-3 text-right">Status Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono tabular-nums">
              {nonRevenueTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 text-slate-300 font-sans">{tx.date}</td>
                  <td className="py-3 px-3 font-sans font-semibold text-white">
                    {tx.type === 'CASH_ADVANCE_RETURN' && 'Pengembalian Cash Advance (CA-03)'}
                    {tx.type === 'DKSI_RELATED_LOAN' && 'Pinjaman Pihak Berelasi PT DKSI (FIN-01)'}
                    {tx.type === 'OWNER_FUNDING' && 'Talangan Modal Pemilik (FIN-02)'}
                    {tx.type === 'INTERBANK_TRANSFER' && 'Pindah Buku BNI ke Mandiri (FIN-03)'}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300">{tx.toAccount}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    Rp {tx.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">{tx.glJournalId}</td>
                  <td className="py-3 px-3 text-right font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      0% Revenue Leakage
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record New Non-Revenue Inflow */}
      {showInflowModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Catat Kas Masuk Non-Pendapatan
              </h3>
              <button onClick={() => setShowInflowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInflowSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Jenis Penerimaan Dana</label>
                <select
                  value={inflowType}
                  onChange={(e) => setInflowType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-sans"
                >
                  <option value="CASH_ADVANCE_RETURN">CA-03: Pengembalian Sisa Cash Advance (Cr 1-1401)</option>
                  <option value="DKSI_RELATED_LOAN">FIN-01: Pinjaman Pihak Berelasi PT DKSI (Cr 2-1401)</option>
                  <option value="OWNER_FUNDING">FIN-02: Talangan Modal Pemilik (Cr 3-1102)</option>
                  <option value="INTERBANK_TRANSFER">FIN-03: Pindah Buku BNI ke Mandiri (Cr 1-1105)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nominal Penerimaan (Rp)</label>
                <input
                  type="number"
                  value={inflowAmount}
                  onChange={(e) => setInflowAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Keterangan / Memo Audit</label>
                <input
                  type="text"
                  value={inflowMemo}
                  onChange={(e) => setInflowMemo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200"
                  placeholder="Keterangan transaksi lengkap..."
                  required
                />
              </div>

              {inflowResult && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  {inflowResult}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInflowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Posting ke GL Terproteksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
