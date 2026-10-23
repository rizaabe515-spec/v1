import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { PhysicalLocationId, BusinessUnitId } from '../types/erp';
import { PHYSICAL_LOCATIONS, BUSINESS_UNITS } from '../constants/dimensions';
import { 
  Trophy, 
  Calendar, 
  Coffee, 
  Utensils, 
  CreditCard, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  UserPlus, 
  ArrowRight,
  Check,
  X,
  Receipt
} from 'lucide-react';

export const OperationsView: React.FC = () => {
  const { 
    courtBookings, 
    bookCourt, 
    tournaments, 
    registerTournamentPlayer, 
    settleTournamentEvent, 
    posTransactions, 
    processPOSSale 
  } = useERP();

  const [opsTab, setOpsTab] = useState<'COURT_TOURNAMENT' | 'POS_STATIONS'>('COURT_TOURNAMENT');

  // Court Booking Form State
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [courtName, setCourtName] = useState<string>('Court 1 (Panoramic Central)');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState<string>('16:00 - 18:00');
  const [rentalFee, setRentalFee] = useState<number>(450000);
  const [equipmentFee, setEquipmentFee] = useState<number>(50000);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MANDIRI_TRANSFER' | 'QRIS_BNI'>('QRIS_BNI');

  // Tournament Form State
  const [showRegisterPlayerModal, setShowRegisterPlayerModal] = useState<boolean>(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');

  const [showSettleModal, setShowSettleModal] = useState<boolean>(false);
  const [settleTournamentId, setSettleTournamentId] = useState<string>('');
  const [settleRefundTotal, setSettleRefundTotal] = useState<number>(0);

  // POS State
  const [posStation, setPosStation] = useState<PhysicalLocationId>('L003'); // L003 Bar, L004 Kitchen, L005 Benteng
  const [posCart, setPosCart] = useState<Array<{ sku: string; name: string; price: number; qty: number }>>([]);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'MANDIRI' | 'QRIS'>('QRIS');
  const [posSuccessMsg, setPosSuccessMsg] = useState<string | null>(null);

  // Sample Menu Catalog by Station
  const menuCatalog: Record<PhysicalLocationId, Array<{ sku: string; name: string; price: number; category: string }>> = {
    L001: [],
    L002: [],
    L003: [
      { sku: 'BEV-COF-001', name: 'Iced Spanish Latte', price: 32000, category: 'Coffee' },
      { sku: 'BEV-COF-002', name: 'Caramel Macchiato', price: 35000, category: 'Coffee' },
      { sku: 'BEV-ISO-001', name: 'Pocari Sweat Can 330ml', price: 15000, category: 'Isotonic' },
      { sku: 'BEV-SYR-001', name: 'Vanilla Sparkling Cooler', price: 28000, category: 'Mocktail' }
    ],
    L004: [
      { sku: 'KIT-MEAT-001', name: 'Beef Padel Rice Bowl', price: 48000, category: 'Kitchen' },
      { sku: 'KIT-SNK-001', name: 'Crispy Truffle Fries', price: 28000, category: 'Snack' },
      { sku: 'KIT-PAS-001', name: 'Almond Croissant', price: 26000, category: 'Pastry' }
    ],
    L005: [
      { sku: 'BEV-COF-001', name: 'Benteng Cold Brew Special', price: 28000, category: 'Coffee' },
      { sku: 'BEV-COF-003', name: 'Ambarawa Heritage Coffee', price: 25000, category: 'Coffee' },
      { sku: 'BEV-ISO-001', name: 'Pocari Sweat Can 330ml', price: 15000, category: 'Beverage' }
    ]
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    bookCourt({
      courtName,
      customerName,
      phone: customerPhone || '08123456789',
      date: bookingDate,
      startTime: bookingTime.split(' - ')[0],
      endTime: bookingTime.split(' - ')[1] || '18:00',
      rentalFee,
      equipmentFee,
      paymentMethod
    });

    setShowBookingModal(false);
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleRegisterPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !selectedTournamentId) return;

    const res = registerTournamentPlayer(selectedTournamentId, playerName);
    if (res.success) {
      setShowRegisterPlayerModal(false);
      setPlayerName('');
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  const handleSettleTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTournamentId) return;

    const res = settleTournamentEvent(settleTournamentId, settleRefundTotal);
    if (res.success) {
      setShowSettleModal(false);
      setSettleRefundTotal(0);
    } else {
      alert(`Gagal: ${res.error}`);
    }
  };

  const addToCart = (item: { sku: string; name: string; price: number }) => {
    setPosCart(prev => {
      const existing = prev.find(i => i.sku === item.sku);
      if (existing) {
        return prev.map(i => i.sku === item.sku ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (sku: string) => {
    setPosCart(prev => prev.filter(i => i.sku !== sku));
  };

  const handlePOSCheckout = () => {
    if (posCart.length === 0) return;

    const subtotal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const tax = Math.round(subtotal * 0.10); // PB1 10%
    const total = subtotal + tax;

    // Determine unit and location
    const targetLoc = PHYSICAL_LOCATIONS[posStation];
    const unitId = targetLoc.parentUnitId;

    // Revenue account based on station
    let revenueAcc = '4-1103'; // Bar
    if (posStation === 'L004') revenueAcc = '4-1104'; // Kitchen
    if (posStation === 'L005') revenueAcc = '4-1105'; // Benteng

    // Payment account
    let paymentAcc = '1-1102'; // Kas Bar
    if (posStation === 'L005') paymentAcc = '1-1106'; // Kas Benteng
    if (posPaymentMethod === 'MANDIRI') paymentAcc = '1-1104';
    if (posPaymentMethod === 'QRIS') paymentAcc = '1-1105';

    const orderItems = posCart.map(i => ({
      sku: i.sku,
      name: i.name,
      price: i.price,
      qty: i.qty,
      subtotal: i.price * i.qty
    }));

    const tx = processPOSSale({
      unitId,
      locationId: posStation,
      cashierName: `Kasir Shift (${targetLoc.name.split(' ')[0]})`,
      items: orderItems,
      subtotal,
      tax,
      total,
      paymentAccountCode: paymentAcc,
      revenueAccountCode: revenueAcc
    });

    setPosSuccessMsg(`Struk ${tx.receiptNumber} berhasil diproses! Jurnal SAL-02 diposting ke GL.`);
    setPosCart([]);
    setTimeout(() => setPosSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Trophy className="w-4 h-4" />
            Operasi Front-Office &amp; Penjualan Multi-Unit
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Reservasi Lapangan, Turnamen Lintas Bulan &amp; Multi-Station POS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Semua transaksi front-office terintegrasi ke Single GL dengan pemisahan tegas antara pendapatan sewa, penampungan uang muka turnamen (2-1301), dan penjualan F&amp;B.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0 text-xs">
          <button
            onClick={() => setOpsTab('COURT_TOURNAMENT')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              opsTab === 'COURT_TOURNAMENT'
                ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Padel Court &amp; Turnamen (U001)
          </button>
          <button
            onClick={() => setOpsTab('POS_STATIONS')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              opsTab === 'POS_STATIONS'
                ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Station Cafe POS (U002 / U003)
          </button>
        </div>
      </div>

      {/* Tab 1: Padel Court & Tournaments */}
      {opsTab === 'COURT_TOURNAMENT' && (
        <div className="space-y-6">
          {/* Section 1: Court Booking */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Jadwal &amp; Reservasi Lapangan Padel (Rule SAL-01)
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Pendapatan sewa diakui ke 4-1101 (Lapangan) dan 4-1201 (Sewa Raket/Bola).
                </p>
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                + Booking Lapangan Baru
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Kode &amp; Tanggal</th>
                    <th className="py-2.5 px-3">Lapangan</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Jam Main</th>
                    <th className="py-2.5 px-3 text-right">Sewa Lapangan</th>
                    <th className="py-2.5 px-3 text-right">Sewa Raket</th>
                    <th className="py-2.5 px-3 text-right">Total Bayar</th>
                    <th className="py-2.5 px-3">Metode Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono tabular-nums">
                  {courtBookings.map(bk => (
                    <tr key={bk.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-slate-200">
                        <div className="font-bold text-emerald-400">{bk.bookingCode}</div>
                        <div className="text-[11px] text-slate-400 font-sans">{bk.date}</div>
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-100">{bk.courtName}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">
                        <div>{bk.customerName}</div>
                        <div className="text-[10px] text-slate-500">{bk.phone}</div>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 text-xs">
                        {bk.startTime} - {bk.endTime}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        Rp {bk.rentalFee.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {bk.equipmentFee > 0 ? `Rp ${bk.equipmentFee.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        Rp {bk.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {bk.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Tournament Management & Cross-Month Deferred Revenue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  Turnamen Padel &amp; Rekayasa Omzet Lintas Bulan (SAL-06 / SAL-07)
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Uang pendaftaran wajib dikreditkan ke <strong className="text-blue-300">2-1301 (Liabilitas)</strong> saat diterima, dan baru direklasifikasi ke <strong className="text-emerald-300">4-1102 (Pendapatan Event)</strong> saat turnamen selesai setelah dikurangi refund.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map(t => {
                const isSettled = t.status === 'SETTLED';

                return (
                  <div key={t.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-mono text-slate-500">ID: {t.id}</div>
                        <h3 className="text-sm font-bold text-white mt-0.5">{t.name}</h3>
                        <div className="text-xs text-slate-400 mt-1">
                          Periode: {t.startDate} s/d {t.endDate}
                        </div>
                      </div>

                      {isSettled ? (
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          SETTLED (SAL-07)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          DI LIABILITAS 2-1301
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
                      <div>
                        <div className="text-slate-500 text-[11px]">Total Peserta Terdaftar:</div>
                        <div className="text-white font-mono font-bold mt-0.5">{t.totalRegisteredParticipants} Pasang</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Biaya per Peserta:</div>
                        <div className="text-white font-mono mt-0.5">Rp {t.entryFeePerParticipant.toLocaleString('id-ID')}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Saldo Akun 2-1301:</div>
                        <div className="text-amber-400 font-mono font-bold mt-0.5">
                          Rp {t.totalCollectedPrepayment.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Omzet Diakui (4-1102):</div>
                        <div className="text-emerald-400 font-mono font-bold mt-0.5">
                          Rp {t.netRevenue.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    {!isSettled ? (
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => {
                            setSelectedTournamentId(t.id);
                            setShowRegisterPlayerModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Daftarkan Peserta (SAL-06)
                        </button>
                        <button
                          onClick={() => {
                            setSettleTournamentId(t.id);
                            setSettleRefundTotal(0);
                            setShowSettleModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Closing Event (SAL-07)
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Turnamen selesai · Jurnal SAL-07: {t.sal07JournalId}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Multi-Station F&B POS */}
      {opsTab === 'POS_STATIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Station Selector & Menu Catalog (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Station Selector Strip */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Pilih Stasiun Kasir:</span>
                <button
                  onClick={() => { setPosStation('L003'); setPosCart([]); }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    posStation === 'L003'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Bar Salatiga (JB) — L003
                </button>
                <button
                  onClick={() => { setPosStation('L004'); setPosCart([]); }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    posStation === 'L004'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Kitchen Salatiga — L004
                </button>
                <button
                  onClick={() => { setPosStation('L005'); setPosCart([]); }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    posStation === 'L005'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Coffee Benteng — L005
                </button>
              </div>

              <span className="text-slate-500 font-mono text-[11px]">
                Unit: {PHYSICAL_LOCATIONS[posStation]?.parentUnitId}
              </span>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(menuCatalog[posStation] || []).map(item => (
                <div 
                  key={item.sku}
                  onClick={() => addToCart(item)}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-850 flex flex-col justify-between select-none"
                >
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">{item.category}</span>
                    <h4 className="text-sm font-semibold text-white mt-1 leading-snug">{item.name}</h4>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-emerald-400">Rp {item.price.toLocaleString('id-ID')}</span>
                    <span className="text-slate-500 font-sans text-[11px]">+ Tambah</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Anti-Perpetual Notice Badge */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-slate-200">Rule STK-06 Nonaktif:</strong> Transaksi kasir POS hanya membukukan <strong>Dr Kas/Bank / Cr Pendapatan &amp; Pajak PB1</strong>. HPP persediaan tidak dihitung perpetual saat order kasir, melainkan dihitung periodik pasca Stock Opname bulanan.
              </div>
            </div>
          </div>

          {/* Right: Active Cart & Checkout (4-5 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Pesanan Kasir Aktif
                </h3>
                <span className="text-xs text-slate-400 font-mono">{posCart.length} Item</span>
              </div>

              {posCart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Keranjang kosong. Klik menu di sebelah kiri untuk menambahkan pesanan.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 my-2 max-h-64 overflow-y-auto pr-1">
                  {posCart.map(i => (
                    <div key={i.sku} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-200">{i.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {i.qty} x Rp {i.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="font-bold text-white">Rp {(i.price * i.qty).toLocaleString('id-ID')}</span>
                        <button
                          onClick={() => removeFromCart(i.sku)}
                          className="text-rose-400 hover:text-rose-300 font-sans text-xs"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {posCart.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                {/* Payment Method Selector */}
                <div>
                  <label className="block text-slate-400 mb-1">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod('QRIS')}
                      className={`p-2 rounded text-center font-medium ${
                        posPaymentMethod === 'QRIS'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      QRIS BNI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod('MANDIRI')}
                      className={`p-2 rounded text-center font-medium ${
                        posPaymentMethod === 'MANDIRI'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Transfer Mandiri
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod('CASH')}
                      className={`p-2 rounded text-center font-medium ${
                        posPaymentMethod === 'CASH'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Tunai Kasir
                    </button>
                  </div>
                </div>

                {/* Calculation Summary */}
                {(() => {
                  const subtotal = posCart.reduce((s, i) => s + (i.price * i.qty), 0);
                  const pb1Tax = Math.round(subtotal * 0.10);
                  const grandTotal = subtotal + pb1Tax;

                  return (
                    <div className="space-y-1.5 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal Makanan &amp; Minuman:</span>
                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Pajak Resto PB1 (10%):</span>
                        <span>Rp {pb1Tax.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800">
                        <span>Total Bayar:</span>
                        <span className="text-emerald-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  );
                })()}

                {posSuccessMsg && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                    {posSuccessMsg}
                  </div>
                )}

                <button
                  onClick={handlePOSCheckout}
                  className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
                >
                  Bayar &amp; Posting ke Single GL
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Court Booking */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Booking Lapangan Padel (SAL-01)
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Pilih Lapangan</label>
                <select
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-sans"
                >
                  <option value="Court 1 (Panoramic Central)">Court 1 (Panoramic Central) - Rp 450rb</option>
                  <option value="Court 2 (Standard Pro)">Court 2 (Standard Pro) - Rp 400rb</option>
                  <option value="Court 3 (Rooftop Open)">Court 3 (Rooftop Open) - Rp 350rb</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Penyewa</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200"
                    placeholder="Nama lengkap"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                    placeholder="08123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Sewa Raket &amp; Bola (Rp)</label>
                  <input
                    type="number"
                    value={equipmentFee}
                    onChange={(e) => setEquipmentFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-sans"
                >
                  <option value="QRIS_BNI">QRIS BNI (1-1105)</option>
                  <option value="MANDIRI_TRANSFER">Transfer Mandiri Operasional (1-1104)</option>
                  <option value="CASH">Tunai Kasir Padel (1-1101)</option>
                </select>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs flex justify-between font-mono">
                <span className="text-slate-400 font-sans">Total Pembayaran:</span>
                <span className="font-bold text-emerald-400">Rp {(rentalFee + equipmentFee).toLocaleString('id-ID')}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Konfirmasi Booking &amp; Jurnal SAL-01
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Tournament Player (SAL-06) */}
      {showRegisterPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Registrasi Peserta Turnamen (SAL-06)
              </h3>
              <button onClick={() => setShowRegisterPlayerModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <strong>Aturan Anti-Omzet Palsu (SAL-06):</strong> Uang masuk dicatat ke <strong>2-1301 (Pendapatan Diterima di Muka)</strong>. Sistem melarang keras membukukan ke akun omzet 4-1102 sebelum event dinyatakan selesai.
            </div>

            <form onSubmit={handleRegisterPlayer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Pasangan / Peserta</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200"
                  placeholder="Contoh: Kevin / Marcus"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterPlayerModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Catat ke Akun 2-1301 (SAL-06)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Settle Tournament Event (SAL-07) */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                Closing Turnamen &amp; Reklasifikasi (SAL-07)
              </h3>
              <button onClick={() => setShowSettleModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <strong>Closing Resmi (SAL-07):</strong> Menutup saldo uang muka di <strong>2-1301</strong>, mengembalikan refund yang disetujui (jika ada), dan mengakui sisa bersih sebagai omzet resmi di <strong>4-1102</strong>.
            </div>

            <form onSubmit={handleSettleTournament} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Total Refund Peserta Batal / Cedera (Rp)</label>
                <input
                  type="number"
                  value={settleRefundTotal}
                  onChange={(e) => setSettleRefundTotal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                  min="0"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">Refund akan ditransfer balik via Bank Mandiri (1-1104).</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Posting Reklasifikasi SAL-07
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
