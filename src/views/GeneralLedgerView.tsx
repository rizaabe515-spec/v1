import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { BUSINESS_UNITS, PHYSICAL_LOCATIONS } from '../constants/dimensions';
import { CHART_OF_ACCOUNTS } from '../constants/coaData';
import { GLJournalEntry, BusinessUnitId, PhysicalLocationId } from '../types/erp';
import { 
  FileText, 
  Search, 
  Filter, 
  RotateCcw, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  X
} from 'lucide-react';

export const GeneralLedgerView: React.FC = () => {
  const { journals, postJournal, reverseJournal, userRole } = useERP();

  // Filters
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedRuleCode, setSelectedRuleCode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);

  // Reversal Modal
  const [reversalTarget, setReversalTarget] = useState<GLJournalEntry | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');
  const [reversalMessage, setReversalMessage] = useState<string | null>(null);

  // Manual Journal Modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualRuleCode, setManualRuleCode] = useState<string>('MANUAL-ADJ');
  const [manualReference, setManualReference] = useState<string>('MEMO-ADJ-001');
  const [manualDescription, setManualDescription] = useState<string>('');
  const [manualLines, setManualLines] = useState<Array<{
    accountCode: string;
    debit: number;
    credit: number;
    unitId: BusinessUnitId;
    locationId?: PhysicalLocationId;
    description: string;
  }>>([
    { accountCode: '6-1206', debit: 150000, credit: 0, unitId: 'U002', locationId: 'L003', description: 'Beli kertas struk kasir' },
    { accountCode: '1-1102', debit: 0, credit: 150000, unitId: 'U002', locationId: 'L003', description: 'Pengeluaran kas kecil kasir' }
  ]);
  const [manualErrors, setManualErrors] = useState<string[]>([]);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Filter Journals
  const filteredJournals = journals.filter(jnl => {
    if (selectedUnit !== 'ALL') {
      const touchesUnit = jnl.lines.some(l => l.unitId === selectedUnit);
      if (!touchesUnit) return false;
    }
    if (selectedRuleCode !== 'ALL' && jnl.ruleCode !== selectedRuleCode) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchHeader = jnl.journalNumber.toLowerCase().includes(q) ||
                          jnl.reference.toLowerCase().includes(q) ||
                          jnl.description.toLowerCase().includes(q) ||
                          jnl.ruleCode.toLowerCase().includes(q);
      const matchLines = jnl.lines.some(l => 
        l.accountCode.toLowerCase().includes(q) || 
        l.accountName.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
      if (!matchHeader && !matchLines) return false;
    }
    return true;
  });

  // Calculate Cumulative GL Balances
  const totalGlDebit = journals.filter(j => j.status === 'POSTED').reduce((s, j) => s + j.totalDebit, 0);
  const totalGlCredit = journals.filter(j => j.status === 'POSTED').reduce((s, j) => s + j.totalCredit, 0);
  const isBalanced = Math.abs(totalGlDebit - totalGlCredit) < 0.01;

  // Manual Line Helpers
  const addManualLine = () => {
    setManualLines(prev => [
      ...prev,
      { accountCode: '1-1104', debit: 0, credit: 0, unitId: 'U002', description: '' }
    ]);
  };

  const updateManualLine = (index: number, field: string, value: any) => {
    setManualLines(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeManualLine = (index: number) => {
    if (manualLines.length <= 2) return;
    setManualLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualErrors([]);
    setManualSuccess(null);

    const res = postJournal({
      ruleCode: manualRuleCode,
      date: manualDate,
      reference: manualReference,
      description: manualDescription || 'Jurnal Penyesuaian Manual',
      idempotencyKey: `idemp-manual-${Date.now()}`,
      lines: manualLines,
      createdBy: 'Finance Maker',
      approvedBy: userRole === 'FINANCE_CONTROLLER' ? 'Finance Controller (Approved)' : undefined
    });

    if (!res.success) {
      setManualErrors(res.errors || ['Gagal memposting jurnal.']);
    } else {
      setManualSuccess(`Jurnal berhasil diposting: ${res.journal?.journalNumber}`);
      setTimeout(() => {
        setShowManualModal(false);
        setManualSuccess(null);
      }, 1200);
    }
  };

  const handleReversalSubmit = () => {
    if (!reversalTarget) return;
    if (!reversalReason.trim()) {
      setReversalMessage('Alasan koreksi/reversal wajib diisi.');
      return;
    }

    const res = reverseJournal(reversalTarget.id, reversalReason);
    if (!res.success) {
      setReversalMessage(res.error || 'Gagal membalikkan jurnal.');
    } else {
      setReversalMessage(`Jurnal koreksi terbit: ${res.reversal?.journalNumber}`);
      setTimeout(() => {
        setReversalTarget(null);
        setReversalReason('');
        setReversalMessage(null);
      }, 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Verification Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            Buku Besar Tunggal (Single GL) — PT Sport Universal Indonesia
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            General Ledger Explorer &amp; Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Setiap baris transaksi wajib mencantumkan Dimensi Unit Bisnis &amp; Lokasi Fisik. Tidak ada penghapusan data; koreksi dilakukan melalui jurnal reversal otomatis.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800 text-xs font-mono">
            <div className="text-slate-400 text-[10px]">Total Debit / Kredit GL</div>
            <div className="text-emerald-400 font-bold mt-0.5">
              Rp {totalGlDebit.toLocaleString('id-ID')}
            </div>
          </div>

          <button
            onClick={() => setShowManualModal(true)}
            className="px-3.5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Posting Jurnal Manual
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Unit Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="ALL">Semua Unit Bisnis</option>
              <option value="U001">U001 - Padel Court &amp; Event</option>
              <option value="U002">U002 - Coffee &amp; Resto Salatiga</option>
              <option value="U003">U003 - Coffee Benteng</option>
              <option value="U009">U009 - Shared / Common Costs</option>
            </select>
          </div>

          {/* Rule Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedRuleCode}
              onChange={(e) => setSelectedRuleCode(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="ALL">Semua Aturan Transaksi</option>
              <option value="GR-01">GR-01 (Penerimaan Stok Periodik)</option>
              <option value="AP-01">AP-01 (Tagihan Vendor 3-Way Match)</option>
              <option value="SAL-01">SAL-01 (Booking Lapangan)</option>
              <option value="SAL-02">SAL-02 (Penjualan POS Kasir)</option>
              <option value="SAL-06">SAL-06 (Uang Muka Turnamen 2-1301)</option>
              <option value="SAL-07">SAL-07 (Closing Turnamen Net Refund)</option>
              <option value="STK-07">STK-07 (HPP Periodik Stock Opname)</option>
              <option value="CA-03">CA-03 (Pengembalian Cash Advance)</option>
              <option value="FIN-01">FIN-01 (Pinjaman Afiliasi PT DKSI)</option>
              <option value="FIN-02">FIN-02 (Talangan Pemilik)</option>
            </select>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari nomor jurnal, akun, memo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Journal List */}
      <div className="space-y-3">
        {filteredJournals.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <div className="font-medium text-slate-300">Tidak ada jurnal yang sesuai kriteria pencarian.</div>
            <div className="text-xs text-slate-500 mt-1">Coba sesuaikan filter unit bisnis atau kata kunci pencarian.</div>
          </div>
        ) : (
          filteredJournals.map(jnl => {
            const isExpanded = expandedJournalId === jnl.id;
            const isReversed = jnl.status === 'REVERSED';

            return (
              <div 
                key={jnl.id} 
                className={`bg-slate-900 border transition-all rounded-xl overflow-hidden ${
                  isReversed ? 'border-rose-900/50 bg-slate-900/60' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Journal Card Header */}
                <div 
                  onClick={() => setExpandedJournalId(isExpanded ? null : jnl.id)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded">
                      {jnl.journalNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-400">
                      {jnl.ruleCode}
                    </span>
                    <span className="text-slate-400 font-mono">{jnl.date}</span>
                    <span className="text-slate-200 font-medium truncate max-w-xs md:max-w-md">
                      {jnl.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Total Nominal</div>
                      <div className="font-bold text-slate-100 tabular-nums">
                        Rp {jnl.totalDebit.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {isReversed ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        REVERSED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        POSTED
                      </span>
                    )}

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Lines Table */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/70 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-3">
                        <span>Ref: <strong className="text-slate-200 font-mono">{jnl.reference}</strong></span>
                        <span>Maker: <strong className="text-slate-200">{jnl.createdBy}</strong></span>
                        <span>Approver: <strong className="text-slate-200">{jnl.approvedBy || '-'}</strong></span>
                      </div>
                      <div className="font-mono text-slate-500">
                        Idempotency: {jnl.idempotencyKey}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                            <th className="py-2 px-2.5">Kode &amp; Nama Akun</th>
                            <th className="py-2 px-2.5">Unit Bisnis</th>
                            <th className="py-2 px-2.5">Lokasi Fisik</th>
                            <th className="py-2 px-2.5">Deskripsi Baris</th>
                            <th className="py-2 px-2.5 text-right">Debit (Rp)</th>
                            <th className="py-2 px-2.5 text-right">Kredit (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 font-mono tabular-nums">
                          {jnl.lines.map((l, idx) => (
                            <tr key={l.id || idx} className="hover:bg-slate-900/50">
                              <td className="py-2 px-2.5 text-slate-200">
                                <span className="font-bold text-emerald-400 mr-2">{l.accountCode}</span>
                                <span className="font-sans text-slate-300">{l.accountName}</span>
                              </td>
                              <td className="py-2 px-2.5 font-sans">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] font-medium text-slate-300">
                                  {l.unitId} - {BUSINESS_UNITS[l.unitId]?.name.split(' ')[0]}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 font-sans text-slate-400 text-[11px]">
                                {l.locationId ? PHYSICAL_LOCATIONS[l.locationId]?.name : '-'}
                              </td>
                              <td className="py-2 px-2.5 font-sans text-slate-400 text-xs">
                                {l.description}
                              </td>
                              <td className="py-2 px-2.5 text-right font-semibold text-slate-100">
                                {l.debit > 0 ? l.debit.toLocaleString('id-ID') : '-'}
                              </td>
                              <td className="py-2 px-2.5 text-right font-semibold text-slate-100">
                                {l.credit > 0 ? l.credit.toLocaleString('id-ID') : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-800 font-mono font-bold text-white bg-slate-900/40">
                            <td colSpan={4} className="py-2.5 px-2.5 text-right font-sans">Total Jurnal:</td>
                            <td className="py-2.5 px-2.5 text-right text-emerald-400">
                              Rp {jnl.totalDebit.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-2.5 text-right text-emerald-400">
                              Rp {jnl.totalCredit.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Action Bar for this Journal */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[11px] text-slate-500">
                        {jnl.isReversal ? (
                          <span className="text-amber-400">Jurnal ini merupakan pembalik dari ref {jnl.reversalOfJournalId}</span>
                        ) : jnl.reversalJournalId ? (
                          <span className="text-rose-400">Jurnal ini telah dibatalkan oleh {jnl.reversalJournalId}</span>
                        ) : (
                          <span>Status GL: Valid dan Tersimpan Permanen</span>
                        )}
                      </div>

                      {!isReversed && !jnl.isReversal && (
                        <button
                          onClick={() => {
                            setReversalTarget(jnl);
                            setReversalReason('');
                            setReversalMessage(null);
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Koreksi / Reversal Jurnal Ini
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reversal Confirmation Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                Koreksi / Reversal Jurnal
              </h3>
              <button 
                onClick={() => setReversalTarget(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
              <div>Nomor Jurnal: <strong className="text-white font-mono">{reversalTarget.journalNumber}</strong></div>
              <div>Deskripsi: <span className="text-slate-300">{reversalTarget.description}</span></div>
              <div>Total: <span className="text-emerald-400 font-mono font-bold">Rp {reversalTarget.totalDebit.toLocaleString('id-ID')}</span></div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Sesuai prinsip GL Immutable Padel Beans, jurnal tidak dapat dihapus. Sistem akan menerbitkan <strong>Jurnal Pembalik Otomatis</strong> yang menukar posisi Debit dan Kredit dengan penanda referensi audit tertaut.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Alasan Koreksi / Reversal (Wajib dicatat audit):
              </label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="Contoh: Salah alokasi unit bisnis, revisi faktur supplier, dsb."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            {reversalMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {reversalMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReversalTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReversalSubmit}
                className="px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                Posting Jurnal Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Balanced Journal Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-400" />
                  Posting Jurnal Umum Manual (Balanced Double-Entry)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Wajib balance (Debit == Kredit) dan menyertakan Dimensi Unit Bisnis pada setiap baris.
                </p>
              </div>
              <button 
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Kode Aturan / Rule</label>
                  <input
                    type="text"
                    value={manualRuleCode}
                    onChange={(e) => setManualRuleCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nomor Referensi Dokumen</label>
                  <input
                    type="text"
                    value={manualReference}
                    onChange={(e) => setManualReference(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Uraian / Deskripsi Jurnal</label>
                <input
                  type="text"
                  placeholder="Keterangan transaksi lengkap..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200"
                  required
                />
              </div>

              {/* Dynamic Lines Table */}
              <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Rincian Baris Debit &amp; Kredit</span>
                  <button
                    type="button"
                    onClick={addManualLine}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    + Tambah Baris
                  </button>
                </div>

                <div className="space-y-2">
                  {manualLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs bg-slate-900/80 p-2 rounded border border-slate-800">
                      {/* Account Selector */}
                      <div className="col-span-4">
                        <select
                          value={line.accountCode}
                          onChange={(e) => updateManualLine(idx, 'accountCode', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 text-xs"
                        >
                          {CHART_OF_ACCOUNTS.map(coa => (
                            <option key={coa.accountCode} value={coa.accountCode}>
                              {coa.accountCode} - {coa.accountName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Business Unit Selector */}
                      <div className="col-span-2">
                        <select
                          value={line.unitId}
                          onChange={(e) => updateManualLine(idx, 'unitId', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 text-xs font-mono"
                        >
                          <option value="U001">U001 (Padel)</option>
                          <option value="U002">U002 (Salatiga)</option>
                          <option value="U003">U003 (Benteng)</option>
                          <option value="U009">U009 (Shared)</option>
                        </select>
                      </div>

                      {/* Debit */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Debit"
                          value={line.debit || ''}
                          onChange={(e) => updateManualLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 text-right font-mono"
                        />
                      </div>

                      {/* Credit */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Kredit"
                          value={line.credit || ''}
                          onChange={(e) => updateManualLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 text-right font-mono"
                        />
                      </div>

                      {/* Line Remove */}
                      <div className="col-span-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeManualLine(idx)}
                          disabled={manualLines.length <= 2}
                          className="text-xs text-rose-400 hover:text-rose-300 disabled:opacity-30"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Balance Verifier Strip */}
                {(() => {
                  const deb = manualLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
                  const cre = manualLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
                  const isBal = Math.abs(deb - cre) < 0.01 && deb > 0;

                  return (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-mono text-xs">
                      <div>Total Debit: <strong className="text-emerald-400">Rp {deb.toLocaleString('id-ID')}</strong></div>
                      <div>Total Kredit: <strong className="text-emerald-400">Rp {cre.toLocaleString('id-ID')}</strong></div>
                      <div>
                        {isBal ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 font-sans">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                          </span>
                        ) : (
                          <span className="text-rose-400 font-semibold font-sans">
                            Selisih: Rp {Math.abs(deb - cre).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {manualErrors.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                  {manualErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {manualSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  {manualSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-semibold"
                >
                  Posting ke Single GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
