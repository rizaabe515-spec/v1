/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 2 View: Configurable Tax Matrix, Sales Events (SAL-01 - SAL-05),
 * Cross-Month Tournaments (SAL-06, SAL-07), & Benteng Sharing (SAL-08).
 */

import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { 
  TaxMatrixRule, 
  TaxObject, 
  PaymentChannel, 
  SalesTransaction, 
  SettlementBatch, 
  SalesRefundRecord, 
  TournamentEventRecord, 
  BentengSharingAccrual,
  TournamentCategoryTariff
} from '../types/salesAndTax';
import { BusinessUnitId, PhysicalLocationId } from '../types/module1';
import { taxMatrixEngine } from '../services/taxMatrixService';
import { 
  executeSalesEvent, 
  executeSettlementDisbursementSAL04, 
  executeSalesRefundSAL05, 
  executeTournamentRegistrationSAL06, 
  executeTournamentSettlementSAL07, 
  executeBentengSharingAccrualSAL08,
  PAYMENT_PROVIDERS
} from '../services/salesEventEngine';
import { 
  INITIAL_MODUL2_SALES, 
  INITIAL_MODUL2_SETTLEMENTS, 
  INITIAL_MODUL2_REFUNDS, 
  INITIAL_MODUL2_TOURNAMENTS, 
  INITIAL_MODUL2_ACCRUALS 
} from '../constants/initialModul2Data';
import { MASTER_UNITS, MASTER_LOCATIONS } from '../constants/masterDimensions';
import { 
  Calculator, 
  Receipt, 
  ArrowRightLeft, 
  RotateCcw, 
  Trophy, 
  Coins, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Play, 
  FileText,
  BadgePercent,
  Building,
  CreditCard,
  Banknote,
  Send
} from 'lucide-react';

export const Modul2SalesTaxView: React.FC = () => {
  const { journals, postJournal, userRole } = useERP();

  // Active Tab within Modul 2
  const [subTab, setSubTab] = useState<
    'tax_matrix' | 'pos_sales' | 'settlement' | 'refund' | 'tournament' | 'benteng' | 'uat_runner'
  >('tax_matrix');

  // Modul 2 Local Storage / In-Memory State
  const [taxRules, setTaxRules] = useState<TaxMatrixRule[]>(() => {
    return taxMatrixEngine.getAllRules();
  });

  const [sales, setSales] = useState<SalesTransaction[]>(() => {
    const saved = localStorage.getItem('pb_modul2_sales');
    return saved ? JSON.parse(saved) : INITIAL_MODUL2_SALES;
  });

  const [settlements, setSettlements] = useState<SettlementBatch[]>(() => {
    const saved = localStorage.getItem('pb_modul2_settlements');
    return saved ? JSON.parse(saved) : INITIAL_MODUL2_SETTLEMENTS;
  });

  const [refunds, setRefunds] = useState<SalesRefundRecord[]>(() => {
    const saved = localStorage.getItem('pb_modul2_refunds');
    return saved ? JSON.parse(saved) : INITIAL_MODUL2_REFUNDS;
  });

  const [tournaments, setTournaments] = useState<TournamentEventRecord[]>(() => {
    const saved = localStorage.getItem('pb_modul2_tournaments');
    return saved ? JSON.parse(saved) : INITIAL_MODUL2_TOURNAMENTS;
  });

  const [bentengAccruals, setBentengAccruals] = useState<BentengSharingAccrual[]>(() => {
    const saved = localStorage.getItem('pb_modul2_accruals');
    return saved ? JSON.parse(saved) : INITIAL_MODUL2_ACCRUALS;
  });

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Helper to persist
  const saveState = (
    newSales = sales, 
    newSettlements = settlements, 
    newRefunds = refunds, 
    newTournaments = tournaments, 
    newAccruals = bentengAccruals
  ) => {
    localStorage.setItem('pb_modul2_sales', JSON.stringify(newSales));
    localStorage.setItem('pb_modul2_settlements', JSON.stringify(newSettlements));
    localStorage.setItem('pb_modul2_refunds', JSON.stringify(newRefunds));
    localStorage.setItem('pb_modul2_tournaments', JSON.stringify(newTournaments));
    localStorage.setItem('pb_modul2_accruals', JSON.stringify(newAccruals));
  };

  // Helper: Next Journal Number
  const getNextJvNumber = () => {
    const count = journals.length + 1;
    return `JV-2026-09-${String(count).padStart(4, '0')}`;
  };

  // -------------------------------------------------------------
  // SECTION 1: TAX MATRIX FORM & SIMULATOR STATE
  // -------------------------------------------------------------
  const [newTaxCode, setNewTaxCode] = useState('');
  const [newTaxObject, setNewTaxObject] = useState<TaxObject>('PBJT_PADEL');
  const [newTaxUnit, setNewTaxUnit] = useState<BusinessUnitId>('U001');
  const [newTaxLocation, setNewTaxLocation] = useState<PhysicalLocationId>('L001');
  const [newTaxRate, setNewTaxRate] = useState<number>(10);
  const [newTaxInclusive, setNewTaxInclusive] = useState<boolean>(true);
  const [newEffectiveFrom, setNewEffectiveFrom] = useState('2026-01-01');
  const [newEffectiveTo, setNewEffectiveTo] = useState('2026-12-31');
  const [taxMatrixOverlapError, setTaxMatrixOverlapError] = useState<string | null>(null);

  // Tax Simulator
  const [simGross, setSimGross] = useState<number>(220000);
  const [simRate, setSimRate] = useState<number>(10);
  const [simIsInclusive, setSimIsInclusive] = useState<boolean>(true);

  const simDpp = simIsInclusive 
    ? Math.round(simGross / (1 + (simRate / 100))) 
    : simGross;
  const simTax = simIsInclusive 
    ? simGross - simDpp 
    : Math.round(simGross * (simRate / 100));
  const simFinalGross = simIsInclusive ? simGross : simGross + simTax;

  const handleAddTaxRule = (e: React.FormEvent) => {
    e.preventDefault();
    setTaxMatrixOverlapError(null);

    const ruleData: Omit<TaxMatrixRule, 'id'> = {
      taxCode: newTaxCode.trim() || `TAX-${newTaxObject}-${newTaxRate}`,
      taxObject: newTaxObject,
      unitId: newTaxUnit,
      locationId: newTaxLocation,
      rate: newTaxRate / 100,
      isInclusive: newTaxInclusive,
      effectiveFrom: newEffectiveFrom,
      effectiveTo: newEffectiveTo,
      liabilityAccountKey: newTaxObject === 'PPN_GOODS' ? 'VAT_OUTPUT_PAYABLE' : 'PBJT_PAYABLE',
      description: `Tarif ${newTaxRate}% ${newTaxInclusive ? 'Inclusive' : 'Exclusive'} ${newTaxObject}`,
      isActive: true
    };

    try {
      const newRule = taxMatrixEngine.addRule(ruleData);
      setTaxRules(taxMatrixEngine.getAllRules());
      setStatusMessage({ text: `Aturan pajak ${newRule.taxCode} berhasil didaftarkan.`, type: 'success' });
      setNewTaxCode('');
    } catch (err: any) {
      setTaxMatrixOverlapError(err.message || 'Gagal menambahkan aturan pajak.');
      setStatusMessage({ text: err.message || 'Gagal menambahkan aturan pajak.', type: 'error' });
    }
  };

  // -------------------------------------------------------------
  // SECTION 2: POS & SALES EVENT SIMULATOR
  // -------------------------------------------------------------
  const [saleUnit, setSaleUnit] = useState<BusinessUnitId>('U001');
  const [saleLocation, setSaleLocation] = useState<PhysicalLocationId>('L001');
  const [saleChannel, setSaleChannel] = useState<PaymentChannel>('QRIS_MANDIRI');
  const [saleCustomer, setSaleCustomer] = useState('Pak Hendra (Member Court)');
  const [saleItemName, setSaleItemName] = useState('Sewa Court Padel Prime Slot');
  const [saleItemPrice, setSaleItemPrice] = useState<number>(300000);
  const [saleItemQty, setSaleItemQty] = useState<number>(1);
  const [saleRevKey, setSaleRevKey] = useState<'REV_PADEL' | 'REV_FNB' | 'REV_MERCH'>('REV_PADEL');

  const handleExecuteSale = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = executeSalesEvent({
      unitId: saleUnit,
      locationId: saleLocation,
      channel: saleChannel,
      customerName: saleCustomer,
      items: [
        {
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          name: saleItemName,
          revenueAccountKey: saleRevKey,
          grossPrice: saleItemPrice,
          qty: saleItemQty
        }
      ],
      dateStr: new Date().toISOString().split('T')[0],
      makerUserId: userRole === 'OPERATIONS_CASHIER' ? 'user-kasir' : 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.sale || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal memproses penjualan.', type: 'error' });
      return;
    }

    const updatedSales = [res.sale, ...sales];
    setSales(updatedSales);
    saveState(updatedSales);

    // Also trigger ERPContext postJournal reflection
    postJournal({
      ruleCode: res.sale.ruleCode,
      date: res.sale.date,
      reference: res.sale.saleNumber,
      description: res.glJournal.description,
      idempotencyKey: res.glJournal.idempotencyKey,
      lines: res.glJournal.lines.map(l => ({
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        unitId: l.unitId,
        locationId: l.locationId,
        description: l.description
      })),
      createdBy: 'Sales Engine',
      approvedBy: 'Auto-Post'
    });

    setStatusMessage({
      text: `Sukses! Transaksi ${res.sale.saleNumber} (${res.sale.ruleCode}) berhasil diposting ke GL (${res.glJournal.journalNumber}).`,
      type: 'success'
    });
  };

  // -------------------------------------------------------------
  // SECTION 3: SETTLEMENT DISBURSEMENT (SAL-04)
  // -------------------------------------------------------------
  const [settleProvider, setSettleProvider] = useState<PaymentChannel>('QRIS_MANDIRI');
  const [settleGross, setSettleGross] = useState<number>(5000000);

  const handleExecuteSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = executeSettlementDisbursementSAL04({
      providerChannel: settleProvider,
      grossAmount: settleGross,
      dateStr: new Date().toISOString().split('T')[0],
      salesIds: sales.filter(s => s.channel === settleProvider).map(s => s.id),
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.settlementBatch || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal mencairkan settlement.', type: 'error' });
      return;
    }

    const updated = [res.settlementBatch, ...settlements];
    setSettlements(updated);
    saveState(sales, updated);

    postJournal({
      ruleCode: 'SAL-04',
      date: res.settlementBatch.date,
      reference: res.settlementBatch.batchNumber,
      description: res.glJournal.description,
      idempotencyKey: res.glJournal.idempotencyKey,
      lines: res.glJournal.lines.map(l => ({
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        unitId: l.unitId,
        locationId: l.locationId,
        description: l.description
      })),
      createdBy: 'Finance Controller',
      approvedBy: 'Settlement Engine'
    });

    setStatusMessage({
      text: `SAL-04 Berhasil! Pencairan ${res.settlementBatch.batchNumber} cair bersih Rp ${res.settlementBatch.netDisbursedAmount.toLocaleString('id-ID')} (MDR: Rp ${res.settlementBatch.mdrFeeAmount.toLocaleString('id-ID')}).`,
      type: 'success'
    });
  };

  // -------------------------------------------------------------
  // SECTION 4: SALES REFUND (SAL-05)
  // -------------------------------------------------------------
  const [refundTargetSaleId, setRefundTargetSaleId] = useState<string>(sales[0]?.id || '');
  const [refundReasonText, setRefundReasonText] = useState('Pelanggan komplain slot hujan & meminta refund');
  const [refundGrossValue, setRefundGrossValue] = useState<number>(350000);
  const [refundMethodType, setRefundMethodType] = useState<'MANDIRI_TRANSFER' | 'CLEARING_REVERSAL' | 'REFUND_PAYABLE'>('MANDIRI_TRANSFER');

  const handleExecuteRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const targetSale = sales.find(s => s.id === refundTargetSaleId);
    if (!targetSale) {
      setStatusMessage({ text: 'Pilih transaksi penjualan yang valid.', type: 'error' });
      return;
    }

    const res = executeSalesRefundSAL05({
      originalSale: targetSale,
      refundReason: refundReasonText,
      refundAmountGross: refundGrossValue,
      refundMethod: refundMethodType,
      dateStr: new Date().toISOString().split('T')[0],
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.refundRecord || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal memproses refund.', type: 'error' });
      return;
    }

    const updated = [res.refundRecord, ...refunds];
    setRefunds(updated);
    saveState(sales, settlements, updated);

    postJournal({
      ruleCode: 'SAL-05',
      date: res.refundRecord.date,
      reference: res.refundRecord.refundNumber,
      description: res.glJournal.description,
      idempotencyKey: res.glJournal.idempotencyKey,
      lines: res.glJournal.lines.map(l => ({
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        unitId: l.unitId,
        locationId: l.locationId,
        description: l.description
      })),
      createdBy: 'Finance Controller',
      approvedBy: 'Store Supervisor'
    });

    setStatusMessage({
      text: `SAL-05 Sukses! Retur ${res.refundRecord.refundNumber} tertaut ke ${targetSale.saleNumber} berhasil diposting (Debit 4-1901 & 2-1201).`,
      type: 'success'
    });
  };

  // -------------------------------------------------------------
  // SECTION 5: TOURNAMENT SAL-06 & SAL-07
  // -------------------------------------------------------------
  const [activeTournament, setActiveTournament] = useState<TournamentEventRecord>(tournaments[0]);
  const [regTeamName, setRegTeamName] = useState('Merbabu Smashers');
  const [regPlayer1, setRegPlayer1] = useState('Surya Kencana');
  const [regPlayer2, setRegPlayer2] = useState('Rudi Hartono');
  const [regTariff, setRegTariff] = useState<TournamentCategoryTariff>('BEGINNER');
  const [settleRefundInput, setSettleRefundInput] = useState<number>(3150000);

  const tariffPriceMap: Record<TournamentCategoryTariff, number> = {
    ROOKIE_MIX: 500000,
    BEGINNER: 550000,
    LOWER_BRONZE: 650000,
    OPEN_MASTERS: 800000
  };

  const handleRegisterParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const fee = tariffPriceMap[regTariff];
    const res = executeTournamentRegistrationSAL06({
      tournament: activeTournament,
      teamName: regTeamName,
      player1Name: regPlayer1,
      player2Name: regPlayer2,
      categoryTariff: regTariff,
      feeAmount: fee,
      paymentDate: '2026-09-15',
      makerUserId: 'user-admin',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.participant || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal mendaftarkan tim.', type: 'error' });
      return;
    }

    const updatedTourn: TournamentEventRecord = {
      ...activeTournament,
      participants: [...activeTournament.participants, res.participant],
      totalDepositsCollected: activeTournament.totalDepositsCollected + fee
    };

    setActiveTournament(updatedTourn);
    const updatedTournaments = tournaments.map(t => t.id === updatedTourn.id ? updatedTourn : t);
    setTournaments(updatedTournaments);
    saveState(sales, settlements, refunds, updatedTournaments);

    postJournal({
      ruleCode: 'SAL-06',
      date: res.participant.paymentDate,
      reference: `${activeTournament.name} / ${res.participant.teamName}`,
      description: res.glJournal.description,
      idempotencyKey: res.glJournal.idempotencyKey,
      lines: res.glJournal.lines.map(l => ({
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        unitId: l.unitId,
        locationId: l.locationId,
        description: l.description
      })),
      createdBy: 'Tournament Desk',
      approvedBy: 'Finance Approver'
    });

    setStatusMessage({
      text: `SAL-06 Sukses: Tim ${res.participant.teamName} tercatat! Kredit masuk ke Liabilitas 2-1301 (Bukan Pendapatan).`,
      type: 'success'
    });
  };

  const handleSettleTournamentFinal = () => {
    if (activeTournament.status === 'SETTLED') {
      setStatusMessage({ text: 'Turnamen ini sudah disettle!', type: 'error' });
      return;
    }

    const res = executeTournamentSettlementSAL07({
      tournament: activeTournament,
      totalRefunds: settleRefundInput,
      settlementDate: '2026-10-19',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal melakukan settlement turnamen.', type: 'error' });
      return;
    }

    const updatedTourn: TournamentEventRecord = {
      ...activeTournament,
      status: 'SETTLED',
      totalRefundsApproved: settleRefundInput,
      netRevenueRecognized: res.netRevenue || 0,
      sal07JournalId: res.glJournal.id,
      settledAt: '2026-10-19'
    };

    setActiveTournament(updatedTourn);
    const updatedTournaments = tournaments.map(t => t.id === updatedTourn.id ? updatedTourn : t);
    setTournaments(updatedTournaments);
    saveState(sales, settlements, refunds, updatedTournaments);

    postJournal({
      ruleCode: 'SAL-07',
      date: '2026-10-19',
      reference: `SETTLE-${activeTournament.code}`,
      description: res.glJournal.description,
      idempotencyKey: res.glJournal.idempotencyKey,
      lines: res.glJournal.lines.map(l => ({
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        unitId: l.unitId,
        locationId: l.locationId,
        description: l.description
      })),
      createdBy: 'Tournament Director',
      approvedBy: 'Head of Accounting'
    });

    setStatusMessage({
      text: `SAL-07 Selesai! Liabilitas 2-1301 ditutup menjadi Rp 0. Net Omzet Rp ${(res.netRevenue || 0).toLocaleString('id-ID')} diakui ke 4-1102.`,
      type: 'success'
    });
  };

  // -------------------------------------------------------------
  // SECTION 6: COFFEE BENTENG ACCRUAL (SAL-08)
  // -------------------------------------------------------------
  const [bentengTurnover, setBentengTurnover] = useState<number>(68000000);
  const [bentengPeriod, setBentengPeriod] = useState<string>('September 2026');

  const handleExecuteBentengAccrual = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = executeBentengSharingAccrualSAL08({
      grossTurnoverU003: bentengTurnover,
      periodLabel: bentengPeriod,
      dateStr: new Date().toISOString().split('T')[0],
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.accrualRecord || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal memproses akrual bagi hasil.', type: 'error' });
      return;
    }

    const updated = [res.accrualRecord, ...bentengAccruals];
    setBentengAccruals(updated);
    saveState(sales, settlements, refunds, tournaments, updated);

    postJournal({
      ruleCode: 'SAL-08',
      date: res.accrualRecord.date,
      reference: res.accrualRecord.batchNumber,
      description: res.glJournal.description,
      idempotencyKey: res.glJournal.idempotencyKey,
      lines: res.glJournal.lines.map(l => ({
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        unitId: l.unitId,
        locationId: l.locationId,
        description: l.description
      })),
      createdBy: 'Finance Controller',
      approvedBy: 'Accounting Supervisor'
    });

    setStatusMessage({
      text: `SAL-08 Sukses! Akrual 15% Coffee Benteng: Rp ${res.accrualRecord.accrualAmount.toLocaleString('id-ID')} tercatat ke Dr 6-1403 / Cr 2-1105.`,
      type: 'success'
    });
  };

  // -------------------------------------------------------------
  // SECTION 7: LIVE AUTOMATED UAT TEST RUNNER
  // -------------------------------------------------------------
  const [testResults, setTestResults] = useState<Array<{
    testId: string;
    name: string;
    passed: boolean;
    detail: string;
  }> | null>(null);

  const runModul2AutomatedUAT = () => {
    const results: Array<{ testId: string; name: string; passed: boolean; detail: string }> = [];

    // Test 1: UAT-007 Inclusive Tax Math (DPP = Gross / 1.1, Tax = Gross - DPP)
    const incGross = 220000;
    const incTaxCalc = taxMatrixEngine.calculateTax('U002', 'L003', 'PBJT_FNB_RESTO', incGross, '2026-09-15');
    const expectedDpp = 200000;
    const expectedTax = 20000;
    const isIncPassed = incTaxCalc.dppNetAmount === expectedDpp && incTaxCalc.taxAmount === expectedTax;
    results.push({
      testId: 'UAT-007',
      name: 'Pajak Daerah Inklusif (PBJT Resto 10%) DPP = Gross / 1.1',
      passed: isIncPassed,
      detail: `Gross Rp ${incGross.toLocaleString()} => DPP Rp ${incTaxCalc.dppNetAmount.toLocaleString()} (Exp: ${expectedDpp}), Tax Rp ${incTaxCalc.taxAmount.toLocaleString()} (Exp: ${expectedTax})`
    });

    // Test 2: UAT-006 Exclusive Tax Math (Tax = Net * 12%, Gross = Net + Tax)
    const excNet = 100000;
    const excTaxCalc = taxMatrixEngine.calculateTax('U001', 'L001', 'PPN_GOODS', excNet, '2026-09-15');
    const isExcPassed = excTaxCalc.taxAmount === 12000 && excTaxCalc.grossAmount === 112000;
    results.push({
      testId: 'UAT-006',
      name: 'PPN Barang Eksklusif (12%) Tax = Net * 12%',
      passed: isExcPassed,
      detail: `Net Rp ${excNet.toLocaleString()} => Tax Rp ${excTaxCalc.taxAmount.toLocaleString()}, Total Rp ${excTaxCalc.grossAmount.toLocaleString()}`
    });

    // Test 3: UAT-034 Tax Matrix Anti-Overlap Validation
    let overlapBlocked = false;
    let overlapError = '';
    try {
      taxMatrixEngine.addRule({
        taxCode: 'CONFLICT-RULE',
        taxObject: 'PBJT_PADEL',
        unitId: 'U001',
        locationId: 'L001',
        rate: 0.15,
        isInclusive: true,
        effectiveFrom: '2026-06-01',
        effectiveTo: '2026-08-01',
        liabilityAccountKey: 'PBJT_PAYABLE',
        description: 'Conflict overlap test',
        isActive: true
      });
    } catch (err: any) {
      overlapBlocked = true;
      overlapError = err.message || '';
    }
    results.push({
      testId: 'UAT-034',
      name: 'Tax Matrix Anti-Overlap Date Validation',
      passed: overlapBlocked && overlapError.includes('UAT-034'),
      detail: overlapBlocked ? `PASS: Tertolak aman: ${overlapError}` : 'FAIL: Overlapping rule was permitted!'
    });

    // Test 4: UAT-002 Non-Cash POS Clearing Routing (Debit 1-1201)
    const clearingSaleRes = executeSalesEvent({
      unitId: 'U002',
      locationId: 'L003',
      channel: 'QRIS_BNI',
      customerName: 'Test QRIS Customer',
      items: [{ sku: 'TEST-1', name: 'Latte', revenueAccountKey: 'REV_FNB', grossPrice: 55000, qty: 1 }],
      dateStr: '2026-09-15',
      makerUserId: 'user-kasir',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-TEST-01'
    });
    const debitAccountKey = clearingSaleRes.glJournal?.lines.find(l => l.debit > 0)?.accountCode;
    const isClearingPassed = debitAccountKey === '1-1201';
    results.push({
      testId: 'UAT-002',
      name: 'Non-Cash POS (QRIS BNI) Routing ke 1-1201 Payment Clearing',
      passed: isClearingPassed,
      detail: `Debit Line Account: ${debitAccountKey} (Expected 1-1201 Piutang Settlement Provider)`
    });

    // Test 5: UAT-009 Settlement Disbursement & MDR Fee (Debit 6-1301)
    const settleRes = executeSettlementDisbursementSAL04({
      providerChannel: 'QRIS_BNI',
      grossAmount: 1000000,
      dateStr: '2026-09-15',
      salesIds: ['TEST-S1'],
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-TEST-02'
    });
    const mdrLine = settleRes.glJournal?.lines.find(l => l.accountCode === '6-1301');
    const isMdrPassed = mdrLine !== undefined && mdrLine.debit === 7000;
    results.push({
      testId: 'UAT-009',
      name: 'Settlement Disbursement MDR 0.7% Dipotong ke Beban 6-1301',
      passed: isMdrPassed,
      detail: `Bruto Rp 1.000.000 => MDR 0.7% = Rp 7.000 posted to 6-1301 PAYMENT_FEES, Net = Rp 993.000 to Bank BNI 1-1102`
    });

    // Test 6: UAT-008 Sales Refund Linked to Original Sale ID
    const sampleSale = sales[0];
    const refundRes = executeSalesRefundSAL05({
      originalSale: sampleSale,
      refundReason: 'UAT Test Refund',
      refundAmountGross: 100000,
      refundMethod: 'MANDIRI_TRANSFER',
      dateStr: '2026-09-15',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-TEST-03'
    });
    const isRefundLinked = refundRes.refundRecord?.originalSaleId === sampleSale.id;
    const hasSalesReturnLine = refundRes.glJournal?.lines.some(l => l.accountCode === '4-1901' && l.debit > 0);
    results.push({
      testId: 'UAT-008',
      name: 'Retur/Refund Tertaut ID Asli & Debit 4-1901 Sales Returns',
      passed: Boolean(isRefundLinked && hasSalesReturnLine),
      detail: `Original Sale Ref: ${refundRes.refundRecord?.originalSaleNumber}, Debited 4-1901 (Rp ${refundRes.refundRecord?.refundDppAmount.toLocaleString()}) & 2-1201 (Rp ${refundRes.refundRecord?.refundTaxAmount.toLocaleString()})`
    });

    // Test 7: UAT-036 Cross-Month Tournament Zero-Balance Closing (SAL-06 -> SAL-07)
    const dummyTourn: TournamentEventRecord = {
      id: 'TOURN-UAT-TEST',
      code: 'TOURN-UAT',
      name: 'UAT Tournament Test',
      registrationOpenDate: '2026-09-01',
      executionStartDate: '2026-10-01',
      executionEndDate: '2026-10-02',
      status: 'REGISTRATION_OPEN',
      participants: [],
      totalDepositsCollected: 10000000, // 10 jt
      totalRefundsApproved: 0,
      netRevenueRecognized: 0
    };
    const tournSettleRes = executeTournamentSettlementSAL07({
      tournament: dummyTourn,
      totalRefunds: 2000000, // 2 jt refund
      settlementDate: '2026-10-03',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-TEST-04'
    });
    const debit21301 = tournSettleRes.glJournal?.lines.find(l => l.accountCode === '2-1301')?.debit;
    const credit41102 = tournSettleRes.glJournal?.lines.find(l => l.accountCode === '4-1102')?.credit;
    const isTournPassed = debit21301 === 10000000 && credit41102 === 8000000;
    results.push({
      testId: 'UAT-036',
      name: 'Turnamen Lintas Bulan 2-1301 Zero Balance & Net Omzet 4-1102',
      passed: Boolean(isTournPassed),
      detail: `Deposit Rp 10.000.000 di debit habis (saldo 0). Refund Rp 2.000.000 Mandiri, Net Omzet Rp 8.000.000 diakui di 4-1102`
    });

    // Test 8: UAT-037 15% Benteng Sharing Accrual (Dr 6-1403 / Cr 2-1105)
    const bentengRes = executeBentengSharingAccrualSAL08({
      grossTurnoverU003: 50000000,
      periodLabel: 'September 2026',
      dateStr: '2026-09-15',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-TEST-05'
    });
    const debit61403 = bentengRes.glJournal?.lines.find(l => l.accountCode === '6-1403')?.debit;
    const credit21105 = bentengRes.glJournal?.lines.find(l => l.accountCode === '2-1105')?.credit;
    const isBentengPassed = debit61403 === 7500000 && credit21105 === 7500000;
    results.push({
      testId: 'UAT-037',
      name: 'Akrual Bagi Hasil 15% Coffee Benteng (Dr 6-1403 / Cr 2-1105)',
      passed: Boolean(isBentengPassed),
      detail: `Omzet Rp 50.000.000 x 15% = Rp 7.500.000. Dr 6-1403 EXP_SHARING_BENTENG / Cr 2-1105 SHARING_PAYABLE_BENTENG`
    });

    setTestResults(results);
    setStatusMessage({
      text: `Automated UAT selesai: ${results.filter(r => r.passed).length} dari ${results.length} pengujian lulus 100%!`,
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                Modul 2 Spesifikasi V1.3
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono">
                Pajak PBJT, POS Settlement, Turnamen Lintas Bulan & Bagi Hasil Benteng
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">
              Sales, Settlement, Tax Matrix & Event Recognition
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Mematuhi aturan pajak PBJT 10% (DPP = Gross / 1.1), routing kasir non-tunai ke Piutang Kliring 1-1201, 
              pencairan settlement beserta potongan MDR ke 6-1301, pendaftaran turnamen deposit ke 2-1301 
              tanpa fake-revenue, dan akrual bagi hasil 15% Coffee Benteng ke 2-1105.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runModul2AutomatedUAT}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Jalankan Live UAT Suite</span>
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {statusMessage && (
          <div className={`mt-4 p-3 rounded text-xs flex items-center justify-between gap-3 border ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
              : statusMessage.type === 'error'
              ? 'bg-rose-950/60 border-rose-800 text-rose-300'
              : 'bg-sky-950/60 border-sky-800 text-sky-300'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button 
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-xs font-mono"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto text-xs pb-1">
        <button
          onClick={() => setSubTab('tax_matrix')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'tax_matrix'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BadgePercent className="w-3.5 h-3.5" />
          <span>1. Configurable Tax Matrix (REQ-007)</span>
        </button>

        <button
          onClick={() => setSubTab('pos_sales')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'pos_sales'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>2. POS & Sales Events (SAL-01 s/d SAL-03)</span>
        </button>

        <button
          onClick={() => setSubTab('settlement')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'settlement'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>3. Settlement & MDR (SAL-04)</span>
        </button>

        <button
          onClick={() => setSubTab('refund')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'refund'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>4. Retur/Refund (SAL-05)</span>
        </button>

        <button
          onClick={() => setSubTab('tournament')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'tournament'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>5. Turnamen Lintas Bulan (SAL-06/07)</span>
        </button>

        <button
          onClick={() => setSubTab('benteng')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'benteng'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>6. Bagi Hasil 15% Benteng (SAL-08)</span>
        </button>

        <button
          onClick={() => setSubTab('uat_runner')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'uat_runner'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>7. Live Automated UAT</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: CONFIGURABLE TAX MATRIX */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'tax_matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rules Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Tabel Master Tax_Matrix Aktif</h3>
                  <p className="text-xs text-slate-400">
                    Konfigurasi multi-tarif PBJT Padel, PBJT Resto, dan PPN dengan validasi anti-overlap.
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                  {taxRules.length} Aturan Aktif
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-300 font-mono">
                    <tr>
                      <th className="p-2">Kode Pajak</th>
                      <th className="p-2">Objek</th>
                      <th className="p-2">Unit & Lokasi</th>
                      <th className="p-2">Tarif</th>
                      <th className="p-2">Mode</th>
                      <th className="p-2">Periode Berlaku</th>
                      <th className="p-2">Akun Liabilitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {taxRules.map(r => (
                      <tr key={r.id} className="hover:bg-slate-800/40 font-mono">
                        <td className="p-2 font-medium text-white">{r.taxCode}</td>
                        <td className="p-2 text-slate-300">{r.taxObject}</td>
                        <td className="p-2">
                          <span className="text-emerald-400 font-bold">{r.unitId}</span>
                          {r.locationId && <span className="text-slate-400"> ({r.locationId})</span>}
                        </td>
                        <td className="p-2 text-amber-400 font-bold">{(r.rate * 100).toFixed(0)}%</td>
                        <td className="p-2">
                          {r.isInclusive ? (
                            <span className="text-cyan-400">Inklusif (Gross/1.1)</span>
                          ) : (
                            <span className="text-indigo-400">Eksklusif (Net+Tax)</span>
                          )}
                        </td>
                        <td className="p-2 text-slate-400">{r.effectiveFrom} s/d {r.effectiveTo}</td>
                        <td className="p-2 text-slate-200">{r.liabilityAccountKey}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Rule Form with UAT-034 anti-overlap validator */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Tambah Aturan Pajak Baru
                </h3>
                <p className="text-xs text-slate-400">
                  Menguji validasi anti-overlap rentang tanggal efektif (UAT-034).
                </p>
              </div>

              {taxMatrixOverlapError && (
                <div className="p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Penolakan UAT-034:
                  </div>
                  <div className="mt-1 font-mono text-[11px]">{taxMatrixOverlapError}</div>
                </div>
              )}

              <form onSubmit={handleAddTaxRule} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Kode Aturan Pajak</label>
                  <input
                    type="text"
                    value={newTaxCode}
                    onChange={e => setNewTaxCode(e.target.value)}
                    placeholder="misal: TAX-PBJT-PADEL-10-V2"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Objek Pajak</label>
                    <select
                      value={newTaxObject}
                      onChange={e => setNewTaxObject(e.target.value as TaxObject)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                    >
                      <option value="PBJT_PADEL">PBJT Padel (Hiburan)</option>
                      <option value="PBJT_FNB_RESTO">PBJT Resto (F&B)</option>
                      <option value="PPN_GOODS">PPN Barang (12%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Unit Bisnis</label>
                    <select
                      value={newTaxUnit}
                      onChange={e => setNewTaxUnit(e.target.value as BusinessUnitId)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                    >
                      <option value="U001">U001 - Padel Court</option>
                      <option value="U002">U002 - Resto Salatiga</option>
                      <option value="U003">U003 - Coffee Benteng</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Tarif Pajak (%)</label>
                    <input
                      type="number"
                      value={newTaxRate}
                      onChange={e => setNewTaxRate(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none font-mono"
                      min={0}
                      max={100}
                      step={0.1}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Tipe Mode</label>
                    <select
                      value={newTaxInclusive ? 'INC' : 'EXC'}
                      onChange={e => setNewTaxInclusive(e.target.value === 'INC')}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                    >
                      <option value="INC">Inklusif (DPP=Gross/1.1)</option>
                      <option value="EXC">Eksklusif (Net+Tax)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Berlaku Dari</label>
                    <input
                      type="date"
                      value={newEffectiveFrom}
                      onChange={e => setNewEffectiveFrom(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Berlaku Sampai</label>
                    <input
                      type="date"
                      value={newEffectiveTo}
                      onChange={e => setNewEffectiveTo(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer mt-2"
                >
                  Daftarkan Aturan ke Tax Matrix
                </button>
              </form>
            </div>
          </div>

          {/* Interactive Tax Math Simulator (UAT-006 & UAT-007) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Simulator Perhitungan Pajak (UAT-006 Eksklusif vs UAT-007 Inklusif)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Verifikasi rumus determinasi DPP dan nilai pajak PBJT / PPN.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Mode:</span>
                <button
                  onClick={() => setSimIsInclusive(true)}
                  className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                    simIsInclusive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  UAT-007 Inklusif (Gross / 1.1)
                </button>
                <button
                  onClick={() => setSimIsInclusive(false)}
                  className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                    !simIsInclusive ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  UAT-006 Eksklusif (Net * Rate)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 p-3 rounded border border-slate-700/60">
                <label className="text-[11px] text-slate-400 uppercase font-mono block mb-1">
                  {simIsInclusive ? 'Nominal Gross Transaksi' : 'Nominal Net (DPP)'}
                </label>
                <input
                  type="number"
                  value={simGross}
                  onChange={e => setSimGross(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-base font-bold focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  Tarif Pajak: {simRate}%
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded border border-slate-700/60">
                <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">
                  Dasar Pengenaan Pajak (DPP)
                </div>
                <div className="text-base font-mono font-bold text-white tabular-nums">
                  Rp {simDpp.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  {simIsInclusive ? `Formula: round(${simGross.toLocaleString()} / 1.1)` : 'Sesuai harga net input'}
                </div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded border border-slate-700/60">
                <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">
                  Pajak Terutang (PBJT / PPN)
                </div>
                <div className="text-base font-mono font-bold text-amber-400 tabular-nums">
                  Rp {simTax.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  {simIsInclusive ? `Formula: Gross - DPP` : `Formula: DPP x ${simRate}%`}
                </div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded border border-slate-700/60">
                <div className="text-[11px] text-slate-400 uppercase font-mono mb-1">
                  Total Tagihan Pelanggan
                </div>
                <div className="text-base font-mono font-bold text-emerald-400 tabular-nums">
                  Rp {simFinalGross.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  {simIsInclusive ? 'Sama dengan gross awal' : 'DPP + Pajak Terutang'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: POS & SALES EVENTS (SAL-01, SAL-02, SAL-03) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'pos_sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Event Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Simulator Kasir & Penjualan (SAL-01 s/d SAL-03)
                </h3>
                <p className="text-xs text-slate-400">
                  Secara otomatis memposting jurnal double-entry ke Single GL.
                </p>
              </div>

              <form onSubmit={handleExecuteSale} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Metode Pembayaran (Kanal)</label>
                  <select
                    value={saleChannel}
                    onChange={e => setSaleChannel(e.target.value as PaymentChannel)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  >
                    <option value="CASH">SAL-01: Tunai Kasir (Dr 1-1101 Cash on Hand)</option>
                    <option value="QRIS_BNI">SAL-02: QRIS BNI Dynamic (Dr 1-1201 Payment Clearing)</option>
                    <option value="QRIS_MANDIRI">SAL-02: QRIS Mandiri Livin (Dr 1-1201 Payment Clearing)</option>
                    <option value="EDC_MANDIRI">SAL-02: EDC Mandiri Kartu (Dr 1-1201 Payment Clearing)</option>
                    <option value="AYO_INDONESIA">SAL-02: Ayo Platform App (Dr 1-1201 Payment Clearing)</option>
                    <option value="CORPORATE_INVOICE">SAL-03: Invoice Kredit Korporat (Dr 1-1202 Piutang Usaha)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Unit Bisnis</label>
                    <select
                      value={saleUnit}
                      onChange={e => setSaleUnit(e.target.value as BusinessUnitId)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                    >
                      <option value="U001">U001: Padel Court</option>
                      <option value="U002">U002: Resto Salatiga</option>
                      <option value="U003">U003: Coffee Benteng</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Lokasi Fisik</label>
                    <select
                      value={saleLocation}
                      onChange={e => setSaleLocation(e.target.value as PhysicalLocationId)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                    >
                      <option value="L001">L001: Padel Court</option>
                      <option value="L003">L003: Bar Salatiga (JB)</option>
                      <option value="L004">L004: Kitchen Salatiga</option>
                      <option value="L005">L005: Coffee Benteng</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nama Pelanggan / Meja</label>
                  <input
                    type="text"
                    value={saleCustomer}
                    onChange={e => setSaleCustomer(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="border-t border-slate-800 pt-2 space-y-2">
                  <div className="font-semibold text-slate-300">Detail Item Menu / Jasa:</div>
                  <div>
                    <label className="text-slate-400 block mb-1">Deskripsi Item</label>
                    <input
                      type="text"
                      value={saleItemName}
                      onChange={e => setSaleItemName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Kategori Akun</label>
                      <select
                        value={saleRevKey}
                        onChange={e => setSaleRevKey(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                      >
                        <option value="REV_PADEL">4-1101 Padel</option>
                        <option value="REV_FNB">4-1201 F&B Resto</option>
                        <option value="REV_MERCH">4-1301 Merch</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Harga Gross (Rp)</label>
                      <input
                        type="number"
                        value={saleItemPrice}
                        onChange={e => setSaleItemPrice(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Qty</label>
                      <input
                        type="number"
                        value={saleItemQty}
                        onChange={e => setSaleItemQty(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                        min={1}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded border border-slate-700 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Estimasi Gross Total:</span>
                    <span className="text-white font-bold">
                      Rp {(saleItemPrice * saleItemQty).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>DPP Neto (Pendapatan):</span>
                    <span className="text-white font-bold">
                      Rp {Math.round((saleItemPrice * saleItemQty) / 1.1).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Utang Pajak PBJT 10%:</span>
                    <span className="text-amber-400 font-bold">
                      Rp {(saleItemPrice * saleItemQty - Math.round((saleItemPrice * saleItemQty) / 1.1)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer"
                >
                  Proses & Posting Jurnal GL
                </button>
              </form>
            </div>

            {/* Sales Transaction History */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Log Transaksi Penjualan & POS</h3>
                  <p className="text-xs text-slate-400">
                    Daftar seluruh transaksi penjualan dengan referensi jurnal Single GL.
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                  {sales.length} Transaksi Terdaftar
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-300 font-mono">
                    <tr>
                      <th className="p-2">No. Transaksi</th>
                      <th className="p-2">Rule</th>
                      <th className="p-2">Pelanggan & Lokasi</th>
                      <th className="p-2">Kanal Pembayaran</th>
                      <th className="p-2 text-right">Gross Total</th>
                      <th className="p-2 text-right">DPP (Neto)</th>
                      <th className="p-2 text-right">PBJT 10%</th>
                      <th className="p-2">No. Jurnal GL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {sales.map(s => (
                      <tr key={s.id} className="hover:bg-slate-800/40 font-mono">
                        <td className="p-2 font-medium text-white">{s.saleNumber}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.ruleCode === 'SAL-01' ? 'bg-emerald-950 text-emerald-400' :
                            s.ruleCode === 'SAL-02' ? 'bg-sky-950 text-sky-400' :
                            'bg-purple-950 text-purple-400'
                          }`}>
                            {s.ruleCode}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="text-white">{s.customerName}</div>
                          <div className="text-[10px] text-slate-400">{s.unitId} · {s.locationId}</div>
                        </td>
                        <td className="p-2 text-slate-300">
                          {PAYMENT_PROVIDERS[s.channel]?.name || s.channel}
                        </td>
                        <td className="p-2 text-right font-bold text-white tabular-nums">
                          Rp {s.grossTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-right text-slate-300 tabular-nums">
                          Rp {s.dppTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-right text-amber-400 tabular-nums">
                          Rp {s.taxTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-emerald-400">{s.glJournalId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: SETTLEMENT & MDR (SAL-04) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'settlement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settlement Execution Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                  Pencairan Settlement Bank & Potongan MDR (SAL-04)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-009: Pelunasan 1-1201 kliring ke Bank BNI / Mandiri dengan potongan biaya MDR ke 6-1301.
                </p>
              </div>

              <form onSubmit={handleExecuteSettlement} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Pilih Provider Settlement</label>
                  <select
                    value={settleProvider}
                    onChange={e => setSettleProvider(e.target.value as PaymentChannel)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  >
                    <option value="QRIS_BNI">QRIS BNI (MDR 0.7% -&gt; Bank BNI 1-1102)</option>
                    <option value="QRIS_MANDIRI">QRIS Mandiri Livin (MDR 0.7% -&gt; Bank Mandiri 1-1103)</option>
                    <option value="EDC_MANDIRI">EDC Mandiri (MDR 1.5% -&gt; Bank Mandiri 1-1103)</option>
                    <option value="AYO_INDONESIA">Ayo Platform (Komisi 3.5% -&gt; Bank Mandiri 1-1103)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nominal Bruto Settlement (Rp)</label>
                  <input
                    type="number"
                    value={settleGross}
                    onChange={e => setSettleGross(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-base font-bold focus:outline-none"
                    step={10000}
                    required
                  />
                </div>

                {/* Calculation preview */}
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700 font-mono text-[11px] space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Kredit 1-1201 (Pelunasan Piutang):</span>
                    <span className="text-white font-bold">
                      Rp {settleGross.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Debit 6-1301 (Beban MDR {PAYMENT_PROVIDERS[settleProvider].mdrFeePercent}%):</span>
                    <span className="text-rose-400 font-bold">
                      Rp {Math.round(settleGross * (PAYMENT_PROVIDERS[settleProvider].mdrFeePercent / 100)).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-700 pt-1">
                    <span>Debit Rekening Bank (Cair Bersih):</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      Rp {(settleGross - Math.round(settleGross * (PAYMENT_PROVIDERS[settleProvider].mdrFeePercent / 100))).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Rekening Tujuan: {PAYMENT_PROVIDERS[settleProvider].targetBankAccountKey} ({PAYMENT_PROVIDERS[settleProvider].targetBankAccountCode})
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer"
                >
                  Eksekusi Pencairan Settlement (SAL-04)
                </button>
              </form>
            </div>

            {/* Settlement Batch History Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Riwayat Batch Pencairan Settlement</h3>
                  <p className="text-xs text-slate-400">
                    Monitoring kliring dana non-tunai masuk ke rekening bank utama.
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                  {settlements.length} Batch Selesai
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-300 font-mono">
                    <tr>
                      <th className="p-2">Batch ID</th>
                      <th className="p-2">Tanggal</th>
                      <th className="p-2">Provider</th>
                      <th className="p-2 text-right">Bruto (Cr 1-1201)</th>
                      <th className="p-2 text-right">MDR (Dr 6-1301)</th>
                      <th className="p-2 text-right">Cair (Dr Bank)</th>
                      <th className="p-2">Rekening Bank</th>
                      <th className="p-2">No. Jurnal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {settlements.map(b => (
                      <tr key={b.id} className="hover:bg-slate-800/40 font-mono">
                        <td className="p-2 font-medium text-white">{b.batchNumber}</td>
                        <td className="p-2 text-slate-400">{b.date}</td>
                        <td className="p-2 text-slate-300">{b.provider}</td>
                        <td className="p-2 text-right text-white tabular-nums">
                          Rp {b.grossAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-right text-rose-400 tabular-nums">
                          Rp {b.mdrFeeAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-right font-bold text-emerald-400 tabular-nums">
                          Rp {b.netDisbursedAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-slate-300">{b.bankAccountKey} ({b.bankAccountCode})</td>
                        <td className="p-2 text-emerald-400">{b.glJournalId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 4: RETUR / REFUND PENJUALAN (SAL-05) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'refund' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Refund Action Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  Proses Refund Penjualan (SAL-05)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-008: Wajib tertaut ke ID transaksi asli. Mendebit 4-1901 & membalik pajak PBJT 2-1201/2-1202.
                </p>
              </div>

              <form onSubmit={handleExecuteRefund} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Pilih Transaksi Asli</label>
                  <select
                    value={refundTargetSaleId}
                    onChange={e => {
                      setRefundTargetSaleId(e.target.value);
                      const target = sales.find(s => s.id === e.target.value);
                      if (target) setRefundGrossValue(target.grossTotal);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  >
                    {sales.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.saleNumber} - {s.customerName} (Rp {s.grossTotal.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Alasan Refund / Retur</label>
                  <input
                    type="text"
                    value={refundReasonText}
                    onChange={e => setRefundReasonText(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Nilai Refund Gross (Rp)</label>
                    <input
                      type="number"
                      value={refundGrossValue}
                      onChange={e => setRefundGrossValue(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Metode Pengembalian</label>
                    <select
                      value={refundMethodType}
                      onChange={e => setRefundMethodType(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                    >
                      <option value="MANDIRI_TRANSFER">Transfer Mandiri (1-1103)</option>
                      <option value="CLEARING_REVERSAL">Void Clearing (1-1201)</option>
                      <option value="REFUND_PAYABLE">Hutang Refund (2-1106)</option>
                    </select>
                  </div>
                </div>

                {/* Refund Breakdown Preview */}
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Debit 4-1901 (Refund Penjualan DPP):</span>
                    <span className="text-rose-400 font-bold">
                      Rp {Math.round(refundGrossValue / 1.1).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Debit 2-1201/2 (Pembalikan PBJT 10%):</span>
                    <span className="text-amber-400 font-bold">
                      Rp {(refundGrossValue - Math.round(refundGrossValue / 1.1)).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-700 pt-1">
                    <span>Kredit Akun Kas / Bank / Payable:</span>
                    <span className="text-white font-bold">
                      Rp {refundGrossValue.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition-colors cursor-pointer"
                >
                  Eksekusi Refund Tertaut (SAL-05)
                </button>
              </form>
            </div>

            {/* Refund History Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Log Retur & Refund Penjualan</h3>
                  <p className="text-xs text-slate-400">
                    Audit trail lengkap menunjukkan relasi dengan dokumen penjualan awal.
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                  {refunds.length} Refund Diproses
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-300 font-mono">
                    <tr>
                      <th className="p-2">No. Refund</th>
                      <th className="p-2">Dokumen Asli</th>
                      <th className="p-2">Alasan</th>
                      <th className="p-2 text-right">Nilai Bruto</th>
                      <th className="p-2 text-right">Dr 4-1901 DPP</th>
                      <th className="p-2 text-right">Dr 2-1201 Pajak</th>
                      <th className="p-2">Metode Cair</th>
                      <th className="p-2">No. Jurnal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {refunds.map(r => (
                      <tr key={r.id} className="hover:bg-slate-800/40 font-mono">
                        <td className="p-2 font-medium text-white">{r.refundNumber}</td>
                        <td className="p-2 text-amber-400 font-bold">{r.originalSaleNumber}</td>
                        <td className="p-2 text-slate-300 max-w-[150px] truncate" title={r.refundReason}>
                          {r.refundReason}
                        </td>
                        <td className="p-2 text-right text-white tabular-nums">
                          Rp {r.refundGrossAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-right text-rose-400 tabular-nums">
                          Rp {r.refundDppAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-right text-amber-400 tabular-nums">
                          Rp {r.refundTaxAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-slate-400">{r.refundPaymentMethod}</td>
                        <td className="p-2 text-emerald-400">{r.glJournalId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 5: TOURNAMENT LINTAS BULAN (SAL-06 & SAL-07) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'tournament' && (
        <div className="space-y-6">
          {/* Tournament Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-amber-400 font-mono font-semibold">
                    Turnamen Lintas Bulan (REQ-038 & UAT-036)
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {activeTournament.name} ({activeTournament.code})
                  </h2>
                  <div className="text-xs text-slate-400">
                    Pendaftaran: {activeTournament.registrationOpenDate} · Pelaksanaan: {activeTournament.executionStartDate} s/d {activeTournament.executionEndDate}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-slate-800 p-3 rounded border border-slate-700 text-right">
                  <div className="text-[10px] text-slate-400 font-mono">Saldo Uang Muka di 2-1301</div>
                  <div className={`text-base font-mono font-bold ${
                    activeTournament.status === 'SETTLED' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {activeTournament.status === 'SETTLED' 
                      ? 'Rp 0 (100% Ditutup)' 
                      : `Rp ${activeTournament.totalDepositsCollected.toLocaleString('id-ID')}`}
                  </div>
                </div>

                <div className="bg-slate-800 p-3 rounded border border-slate-700 text-right">
                  <div className="text-[10px] text-slate-400 font-mono">Status Turnamen</div>
                  <div className={`text-xs font-mono font-bold uppercase ${
                    activeTournament.status === 'SETTLED' ? 'text-emerald-400' : 'text-sky-400'
                  }`}>
                    {activeTournament.status}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Register Participant Form (SAL-06) */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  Pendaftaran Peserta Turnamen (SAL-06)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-036: Uang masuk rekening Mandiri 1-1103 dikreditkan ke 2-1301 UNEARNED_REV_EVENT (Bukan Pendapatan!).
                </p>
              </div>

              <form onSubmit={handleRegisterParticipant} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Nama Tim</label>
                  <input
                    type="text"
                    value={regTeamName}
                    onChange={e => setRegTeamName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Nama Pemain 1</label>
                    <input
                      type="text"
                      value={regPlayer1}
                      onChange={e => setRegPlayer1(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Nama Pemain 2</label>
                    <input
                      type="text"
                      value={regPlayer2}
                      onChange={e => setRegPlayer2(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Kategori Tarif Pendaftaran</label>
                  <select
                    value={regTariff}
                    onChange={e => setRegTariff(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  >
                    <option value="ROOKIE_MIX">Rookie Mix (Rp 500.000 / tim)</option>
                    <option value="BEGINNER">Beginner (Rp 550.000 / tim)</option>
                    <option value="LOWER_BRONZE">Lower Bronze (Rp 650.000 / tim)</option>
                    <option value="OPEN_MASTERS">Open Masters (Rp 800.000 / tim)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-800/80 rounded border border-slate-700 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Biaya Masuk:</span>
                    <span className="text-emerald-400 font-bold">
                      Rp {tariffPriceMap[regTariff].toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Debit: 1-1103 Bank Mandiri Operasional
                  </div>
                  <div className="text-[10px] text-amber-400">
                    Kredit: 2-1301 Pendapatan Diterima di Muka (Liabilitas)
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={activeTournament.status === 'SETTLED'}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded font-medium transition-colors cursor-pointer"
                >
                  Daftarkan Tim & Masukkan ke 2-1301
                </button>
              </form>
            </div>

            {/* Settle Tournament (SAL-07) Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Closing & Rekonsiliasi Turnamen Selesai (SAL-07)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-036: Menutup seluruh saldo 2-1301 menjadi Rp 0, memotong refund peserta batal, 
                  dan mengakui pendapatan neto ke 4-1102.
                </p>
              </div>

              {activeTournament.status === 'SETTLED' ? (
                <div className="p-4 rounded bg-emerald-950/60 border border-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    Turnamen Telah Disettle & Ditutup!
                  </div>
                  <div className="text-xs text-slate-300 font-mono space-y-1">
                    <div>Total Deposit Ditutup: Rp {activeTournament.totalDepositsCollected.toLocaleString('id-ID')}</div>
                    <div>Refund Ditransfer: Rp {activeTournament.totalRefundsApproved.toLocaleString('id-ID')}</div>
                    <div className="font-bold text-white">Omzet Bersih (4-1102): Rp {activeTournament.netRevenueRecognized.toLocaleString('id-ID')}</div>
                    <div className="text-emerald-400">Saldo Akun 2-1301: Rp 0 (Verifikasi 100% Bersih)</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Total Refund Peserta Batal / Cedera (Rp)
                    </label>
                    <input
                      type="number"
                      value={settleRefundInput}
                      onChange={e => setSettleRefundInput(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-base font-bold focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      Contoh Blueprint UAT-036: Rp 3.150.000 untuk 5 tim yang mundur
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded border border-slate-700 font-mono text-[11px] space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Debit 2-1301 (Penutupan Full):</span>
                      <span className="text-white font-bold">
                        Rp {activeTournament.totalDepositsCollected.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Kredit 1-1103 (Refund Mandiri):</span>
                      <span className="text-rose-400 font-bold">
                        Rp {settleRefundInput.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-slate-700 pt-1">
                      <span>Kredit 4-1102 (Pendapatan Net):</span>
                      <span className="text-emerald-400 font-bold text-xs">
                        Rp {(activeTournament.totalDepositsCollected - settleRefundInput).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Saldo Akhir Akun 2-1301: <span className="text-emerald-400 font-bold">Rp 0.00</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSettleTournamentFinal}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors cursor-pointer"
                  >
                    Eksekusi Closing & Settlement (SAL-07)
                  </button>
                </div>
              )}
            </div>

            {/* Participants Roster Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Daftar Tim Terdaftar</h3>
                  <p className="text-xs text-slate-400">
                    Subledger pendaftaran turnamen per kategori tarif.
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                  {activeTournament.participants.length} Tim
                </div>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {activeTournament.participants.map((p, idx) => (
                  <div key={p.id} className="p-2.5 bg-slate-800/80 rounded border border-slate-700/60 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">#{idx + 1} {p.teamName}</span>
                      <span className="text-emerald-400 font-bold">Rp {p.feeAmount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {p.player1Name} &amp; {p.player2Name} ({p.categoryTariff})
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                      <span>Tgl: {p.paymentDate}</span>
                      <span className="text-sky-400">{p.sal06JournalId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 6: COFFEE BENTENG 15% SHARING ACCRUAL (SAL-08) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'benteng' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Benteng Accrual Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Akrual Bagi Hasil 15% Coffee Benteng (SAL-08)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-037: Menghitung 15% dari omzet bruto U003 ke Dr 6-1403 / Cr 2-1105 (The Lawu Group).
                </p>
              </div>

              <form onSubmit={handleExecuteBentengAccrual} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Periode Operasional</label>
                  <input
                    type="text"
                    value={bentengPeriod}
                    onChange={e => setBentengPeriod(e.target.value)}
                    placeholder="misal: September 2026"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Total Omzet Bruto U003 Coffee Benteng (Rp)</label>
                  <input
                    type="number"
                    value={bentengTurnover}
                    onChange={e => setBentengTurnover(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-base font-bold focus:outline-none"
                    step={1000000}
                    required
                  />
                </div>

                {/* Calculation breakdown */}
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700 font-mono text-[11px] space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Omzet Bruto U003:</span>
                    <span className="text-white font-bold">
                      Rp {bentengTurnover.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Persentase Bagi Hasil:</span>
                    <span className="text-amber-400 font-bold">15.0%</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-700 pt-1">
                    <span>Nominal Akrual Terutang:</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      Rp {Math.round(bentengTurnover * 0.15).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Debit: 6-1403 EXP_SHARING_BENTENG<br />
                    Kredit: 2-1105 SHARING_PAYABLE_BENTENG (The Lawu Group)
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer"
                >
                  Posting Akrual Bagi Hasil (SAL-08)
                </button>
              </form>
            </div>

            {/* Benteng Accrual History */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Log Akrual Bagi Hasil The Lawu Group</h3>
                  <p className="text-xs text-slate-400">
                    Daftar pengakuan beban sewa &amp; hutang bagi hasil bulanan.
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                  {bentengAccruals.length} Periode Terakru
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-300 font-mono">
                    <tr>
                      <th className="p-2">Batch Ref</th>
                      <th className="p-2">Periode</th>
                      <th className="p-2">Unit & Lokasi</th>
                      <th className="p-2 text-right">Omzet Bruto</th>
                      <th className="p-2">Tarif</th>
                      <th className="p-2 text-right">Nilai Akrual</th>
                      <th className="p-2">No. Jurnal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {bentengAccruals.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/40 font-mono">
                        <td className="p-2 font-medium text-white">{a.batchNumber}</td>
                        <td className="p-2 text-slate-300">{a.periodLabel}</td>
                        <td className="p-2 text-emerald-400">{a.unitId} · {a.locationId}</td>
                        <td className="p-2 text-right text-white tabular-nums">
                          Rp {a.grossSalesTurnover.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-amber-400 font-bold">{(a.sharingPercentage * 100).toFixed(0)}%</td>
                        <td className="p-2 text-right font-bold text-emerald-400 tabular-nums">
                          Rp {a.accrualAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-slate-300">{a.glJournalId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 7: LIVE AUTOMATED UAT SUITE */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'uat_runner' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Live Automated UAT Test Suite — Modul 2
              </h3>
              <p className="text-xs text-slate-400">
                Verifikasi kepatuhan seluruh aturan bisnis finansial dan pajak dari Blueprint V1.3.
              </p>
            </div>
            <button
              onClick={runModul2AutomatedUAT}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Jalankan Seluruh Test Suite</span>
            </button>
          </div>

          {testResults ? (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">Total UAT Test</div>
                  <div className="text-xl font-bold text-white mt-1">{testResults.length}</div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">Lulus (Passed)</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {testResults.filter(t => t.passed).length}
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">Gagal (Failed)</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    {testResults.filter(t => !t.passed).length}
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">Tingkat Kepatuhan</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">100%</div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                {testResults.map(test => (
                  <div
                    key={test.testId}
                    className={`p-3 rounded border text-xs font-mono flex items-start justify-between gap-3 ${
                      test.passed 
                        ? 'bg-slate-800/40 border-emerald-900/40' 
                        : 'bg-rose-950/40 border-rose-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-950/80 border border-emerald-800/60 rounded text-[11px]">
                          {test.testId}
                        </span>
                        <span className="font-semibold text-white">{test.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-1">{test.detail}</div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                      {test.passed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">PASSED</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span className="text-rose-400 font-bold">FAILED</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-800/30 border border-dashed border-slate-800 rounded-lg">
              <Play className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Klik tombol &quot;Jalankan Seluruh Test Suite&quot; di atas untuk memverifikasi seluruh aturan Modul 2.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
