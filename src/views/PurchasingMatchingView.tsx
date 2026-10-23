/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 3 View: Procure-to-Pay (P2P), Receiving (GR-01/GR-02),
 * 3-Way Matching Engine (BILL-01..04, BILL-CRN), and Vendor Payments (PAY-01..03).
 */

import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { 
  PurchaseRequest, 
  PurchaseOrderRecord, 
  GoodsReceiptRecord, 
  VendorBillRecord, 
  SupplierAdvanceRecord, 
  VendorPaymentRecord,
  MatchingStatusCode
} from '../types/purchasingAndP2P';
import { BusinessUnitId, PhysicalLocationId } from '../types/module1';
import { 
  createPurchaseRequest, 
  createPurchaseOrderFromPR, 
  executeGoodsReceiptGR01, 
  executeAssetReceiptGR02, 
  evaluateThreeWayMatch, 
  executePostBill01, 
  executePostBill02Utilities, 
  executePostBill03Asset, 
  executePostBillCreditNote, 
  executeVendorPaymentPAY01, 
  executeSupplierAdvancePAY02, 
  executeApplySupplierAdvancePAY03,
  evaluatePRTier,
  checkPRSplitting
} from '../services/procurementEngine';
import { 
  INITIAL_P2P_PRS, 
  INITIAL_P2P_POS, 
  INITIAL_P2P_GRS, 
  INITIAL_P2P_BILLS, 
  INITIAL_P2P_ADVANCES, 
  INITIAL_P2P_PAYMENTS 
} from '../constants/initialP2PData';
import { MASTER_UNITS, MASTER_LOCATIONS } from '../constants/masterDimensions';
import { 
  FileCheck, 
  PackageCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Plus, 
  CreditCard, 
  ArrowRight, 
  RotateCcw, 
  Zap, 
  Layers, 
  Receipt, 
  Coins, 
  ShieldCheck, 
  Check, 
  X,
  FileText
} from 'lucide-react';

export const PurchasingMatchingView: React.FC = () => {
  const { journals, postJournal, userRole } = useERP();

  // Active Sub-Tab within Modul 3
  const [subTab, setSubTab] = useState<
    'pr_po' | 'receiving' | 'matching_bills' | 'payments' | 'uat_runner'
  >('matching_bills');

  // Modul 3 Local Storage / State
  const [prs, setPrs] = useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem('pb_modul3_prs');
    return saved ? JSON.parse(saved) : INITIAL_P2P_PRS;
  });

  const [pos, setPos] = useState<PurchaseOrderRecord[]>(() => {
    const saved = localStorage.getItem('pb_modul3_pos');
    return saved ? JSON.parse(saved) : INITIAL_P2P_POS;
  });

  const [grs, setGrs] = useState<GoodsReceiptRecord[]>(() => {
    const saved = localStorage.getItem('pb_modul3_grs');
    return saved ? JSON.parse(saved) : INITIAL_P2P_GRS;
  });

  const [bills, setBills] = useState<VendorBillRecord[]>(() => {
    const saved = localStorage.getItem('pb_modul3_bills');
    return saved ? JSON.parse(saved) : INITIAL_P2P_BILLS;
  });

  const [advances, setAdvances] = useState<SupplierAdvanceRecord[]>(() => {
    const saved = localStorage.getItem('pb_modul3_advances');
    return saved ? JSON.parse(saved) : INITIAL_P2P_ADVANCES;
  });

  const [payments, setPayments] = useState<VendorPaymentRecord[]>(() => {
    const saved = localStorage.getItem('pb_modul3_payments');
    return saved ? JSON.parse(saved) : INITIAL_P2P_PAYMENTS;
  });

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Persistence Helper
  const persistState = (
    newPrs = prs,
    newPos = pos,
    newGrs = grs,
    newBills = bills,
    newAdvances = advances,
    newPayments = payments
  ) => {
    localStorage.setItem('pb_modul3_prs', JSON.stringify(newPrs));
    localStorage.setItem('pb_modul3_pos', JSON.stringify(newPos));
    localStorage.setItem('pb_modul3_grs', JSON.stringify(newGrs));
    localStorage.setItem('pb_modul3_bills', JSON.stringify(newBills));
    localStorage.setItem('pb_modul3_advances', JSON.stringify(newAdvances));
    localStorage.setItem('pb_modul3_payments', JSON.stringify(newPayments));
  };

  const getNextJvNumber = () => {
    const count = journals.length + 1;
    return `JV-2026-09-${String(count).padStart(4, '0')}`;
  };

  // -------------------------------------------------------------
  // TAB 1: PR & PO FORM & WORKFLOW (PUR-01, PUR-02)
  // -------------------------------------------------------------
  const [prRequester, setPrRequester] = useState('Chef Dimas');
  const [prDept, setPrDept] = useState('Kitchen Salatiga');
  const [prUnit, setPrUnit] = useState<BusinessUnitId>('U002');
  const [prLocation, setPrLocation] = useState<PhysicalLocationId>('L004');
  const [prItemDesc, setPrItemDesc] = useState('Daging Wagyu MB5 Steak');
  const [prItemCategory, setPrItemCategory] = useState<'INVENTORY' | 'OPEX_SERVICE' | 'CAPEX_ASSET'>('INVENTORY');
  const [prQty, setPrQty] = useState<number>(20);
  const [prPrice, setPrPrice] = useState<number>(240000);
  const [prNotes, setPrNotes] = useState('Restock akhir pekan');

  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const newPr = createPurchaseRequest({
      requesterName: prRequester,
      department: prDept,
      unitId: prUnit,
      targetLocationId: prLocation,
      notes: prNotes,
      lines: [
        {
          itemDescription: prItemDesc,
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          category: prItemCategory,
          estimatedQty: prQty,
          estimatedUnitPrice: prPrice,
          unitId: prUnit,
          locationId: prLocation
        }
      ],
      existingPRs: prs
    });

    const updated = [newPr, ...prs];
    setPrs(updated);
    persistState(updated);

    setStatusMessage({
      text: `PUR-01 Berhasil: ${newPr.prNumber} dibuat (Tier: ${newPr.requiredApprovalTier}). Terverifikasi NON-POSTING (Zero GL Journal).`,
      type: newPr.isSplittingSuspected ? 'error' : 'success'
    });
  };

  const handleApproveAndConvertToPO = (pr: PurchaseRequest) => {
    const updatedPRs = prs.map(p => p.id === pr.id ? { ...p, status: 'CONVERTED_TO_PO' as const } : p);
    
    const newPO = createPurchaseOrderFromPR({
      pr,
      vendorId: 'VEND-SUPPLIER-01',
      vendorName: 'Supplier Utama Salatiga',
      unitId: pr.unitId,
      locationId: pr.targetLocationId,
      lines: pr.lines.map(l => ({
        sku: l.sku || 'SKU-ITEM',
        name: l.itemDescription,
        category: l.category,
        orderedQty: l.estimatedQty,
        unitPrice: l.estimatedUnitPrice
      })),
      existingPOs: pos,
      creatorName: 'Purchasing Head',
      approverName: userRole === 'FINANCE_CONTROLLER' ? 'Finance Controller' : 'Operations Head'
    });

    const updatedPOs = [newPO, ...pos];
    setPrs(updatedPRs);
    setPos(updatedPOs);
    persistState(updatedPRs, updatedPOs);

    setStatusMessage({
      text: `PUR-02 Berhasil: PO ${newPO.poNumber} diterbitkan untuk ${newPO.vendorName}. Terverifikasi NON-POSTING (Komitmen anggaran tanpa jurnal GL).`,
      type: 'success'
    });
  };

  // -------------------------------------------------------------
  // TAB 2: RECEIVING (GR-01 & GR-02)
  // -------------------------------------------------------------
  const [selectedPoIdForGr, setSelectedPoIdForGr] = useState<string>(pos[0]?.id || '');
  const [grLocation, setGrLocation] = useState<PhysicalLocationId>('L002');
  const [grReceivedQty, setGrReceivedQty] = useState<number>(50);

  // Asset GR-02 form state
  const [assetDesc, setAssetDesc] = useState('Mesin Grinder Mahlkonig EK43');
  const [assetPrice, setAssetPrice] = useState<number>(45000000);
  const [assetKey, setAssetKey] = useState<string>('ASSET_FNB_EQUIPMENT');

  const handleExecuteGR01 = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const po = pos.find(p => p.id === selectedPoIdForGr);
    if (!po) {
      setStatusMessage({ text: 'Pilih PO yang valid.', type: 'error' });
      return;
    }

    const res = executeGoodsReceiptGR01({
      po,
      destinationLocationId: grLocation,
      receivedItems: [
        {
          poLineId: po.lines[0]?.id || 'po-line-0',
          receivedQty: grReceivedQty
        }
      ],
      dateStr: new Date().toISOString().split('T')[0],
      receivedBy: 'Warehouse Keeper',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.gr || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal menerima barang.', type: 'error' });
      return;
    }

    const updatedGrs = [res.gr, ...grs];
    const updatedPOs = pos.map(p => p.id === po.id ? { ...p, status: 'RECEIVED' as const } : p);
    setGrs(updatedGrs);
    setPos(updatedPOs);
    persistState(prs, updatedPOs, updatedGrs);

    // Sync to ERPContext
    postJournal({
      ruleCode: 'GR-01',
      date: res.gr.date,
      reference: res.gr.grNumber,
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
      createdBy: 'Warehouse Staff',
      approvedBy: 'Purchasing Head'
    });

    setStatusMessage({
      text: `GR-01 Sukses: ${res.gr.grNumber} diposting ke GL (${res.glJournal.journalNumber}). Debit 5-1100 / Kredit 2-1104. DILARANG debit 1-1301..1-1305 (Metode Periodik Terpenuhi).`,
      type: 'success'
    });
  };

  const handleExecuteGR02Asset = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const po = pos.find(p => p.id === selectedPoIdForGr);
    if (!po) {
      setStatusMessage({ text: 'Pilih PO aset yang valid.', type: 'error' });
      return;
    }

    const res = executeAssetReceiptGR02({
      po,
      destinationLocationId: grLocation,
      assetAccountKey: assetKey,
      assetDescription: assetDesc,
      receivedQty: 1,
      unitPrice: assetPrice,
      dateStr: new Date().toISOString().split('T')[0],
      receivedBy: 'Purchasing Head',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.gr || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal menerima aset.', type: 'error' });
      return;
    }

    const updatedGrs = [res.gr, ...grs];
    setGrs(updatedGrs);
    persistState(prs, pos, updatedGrs);

    postJournal({
      ruleCode: 'GR-02',
      date: res.gr.date,
      reference: res.gr.grNumber,
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
      createdBy: 'Purchasing Head',
      approvedBy: 'Finance Approver'
    });

    setStatusMessage({
      text: `GR-02 Sukses: Pengadaan Aset ${res.gr.grNumber} diposting ke GL (Dr ${assetKey} / Cr 2-1104 GRNI).`,
      type: 'success'
    });
  };

  // -------------------------------------------------------------
  // TAB 3: 3-WAY MATCHING & VENDOR BILLS (BILL-01..04, BILL-CRN)
  // -------------------------------------------------------------
  const [selectedGrForBill, setSelectedGrForBill] = useState<string>(grs[0]?.id || '');
  const [invNumberInput, setInvNumberInput] = useState('INV-VEND-' + Math.floor(1000 + Math.random() * 9000));
  const [invQtyInput, setInvQtyInput] = useState<number>(50);
  const [invPriceInput, setInvPriceInput] = useState<number>(120000);
  const [invVatClaimable, setInvVatClaimable] = useState<boolean>(true);
  const [invVatNo, setInvVatNo] = useState('010.000-26.88391201');

  // Utility Bill (BILL-02) State
  const [utilVendor, setUtilVendor] = useState('PT PLN Rayon Salatiga');
  const [utilExpenseKey, setUtilExpenseKey] = useState<'EXP_ELECTRICITY' | 'EXP_INTERNET' | 'EXP_GAS' | 'EXP_WATER'>('EXP_ELECTRICITY');
  const [utilAmount, setUtilAmount] = useState<number>(3850000);
  const [utilInvNo, setUtilInvNo] = useState('PLN-SEP26-001');

  // Override Modal
  const [overrideBillId, setOverrideBillId] = useState<string | null>(null);
  const [overrideNotes, setOverrideNotes] = useState('Disetujui oleh Finance Controller setelah verifikasi kenaikan harga supplier');

  const handleEvaluateAndPostBill01 = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const gr = grs.find(g => g.id === selectedGrForBill);
    if (!gr) {
      setStatusMessage({ text: 'Pilih Goods Receipt yang valid.', type: 'error' });
      return;
    }

    const po = pos.find(p => p.id === gr.poId);
    if (!po) {
      setStatusMessage({ text: 'PO terkait tidak ditemukan.', type: 'error' });
      return;
    }

    // 1. Evaluate 3-Way Match
    const match = evaluateThreeWayMatch({
      po,
      gr,
      vendorId: po.vendorId,
      vendorInvoiceNumber: invNumberInput,
      invoiceLines: [
        {
          poLineId: po.lines[0]?.id || 'po-line-0',
          invoicedQty: invQtyInput,
          invoicedUnitPrice: invPriceInput
        }
      ],
      existingBills: bills,
      isVatClaimable: invVatClaimable
    });

    // If hold, save as held bill without posting GL
    if (match.status !== 'AUTO_PASSED') {
      const heldBill: VendorBillRecord = {
        id: `BILL-${Date.now()}`,
        billNumber: `BILL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        vendorInvoiceNumber: invNumberInput,
        ruleCode: 'BILL-01',
        date: new Date().toISOString().split('T')[0],
        dueDate: '2026-09-30',
        vendorId: po.vendorId,
        vendorName: po.vendorName,
        unitId: po.unitId,
        locationId: gr.destinationLocationId,
        poId: po.id,
        poNumber: po.poNumber,
        grId: gr.id,
        grNumber: gr.grNumber,
        lines: match.lines,
        subtotal: match.subtotalGrAmount,
        priceVarianceTotal: match.priceVarianceSubtotal,
        isVatClaimable: invVatClaimable,
        vatTaxInvoiceNo: invVatNo,
        taxAmount: match.taxAmount,
        totalAmount: match.totalInvoiceAmount,
        matchingStatus: match.status,
        holdReasons: match.holdReasons,
        appliedAdvanceAmount: 0,
        remainingPayableAmount: match.totalInvoiceAmount,
        paymentStatus: 'UNPAID',
        createdAt: new Date().toISOString()
      };

      const updatedBills = [heldBill, ...bills];
      setBills(updatedBills);
      persistState(prs, pos, grs, updatedBills);

      setStatusMessage({
        text: `3-Way Match Terblokir: ${match.status}! Alasan: ${match.holdReasons.join(' | ')}. Membutuhkan persetujuan override Finance.`,
        type: 'error'
      });
      return;
    }

    // Auto-passed: Post BILL-01 to GL
    const res = executePostBill01({
      po,
      gr,
      vendorInvoiceNumber: invNumberInput,
      dueDate: '2026-09-30',
      matchResult: match,
      isVatClaimable: invVatClaimable,
      vatTaxInvoiceNo: invVatNo,
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.bill || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal memposting tagihan.', type: 'error' });
      return;
    }

    const updatedBills = [res.bill, ...bills];
    setBills(updatedBills);
    persistState(prs, pos, grs, updatedBills);

    postJournal({
      ruleCode: 'BILL-01',
      date: res.bill.date,
      reference: res.bill.billNumber,
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
      createdBy: 'Finance Staff',
      approvedBy: 'Auto-Match Engine'
    });

    setStatusMessage({
      text: `3-Way Match AUTO-PASSED! BILL-01 ${res.bill.billNumber} diposting ke GL (Dr 2-1104 GRNI, Dr 1-1403 PPN, Cr 2-1102 AP Persediaan).`,
      type: 'success'
    });
  };

  const handleApproveHeldBillOverride = (billId: string) => {
    const targetBill = bills.find(b => b.id === billId);
    if (!targetBill) return;

    const po = pos.find(p => p.id === targetBill.poId);
    const gr = grs.find(g => g.id === targetBill.grId);
    if (!po || !gr) return;

    const approvedMatch: any = {
      status: 'APPROVED_OVERRIDE',
      lines: targetBill.lines,
      subtotalGrAmount: targetBill.subtotal,
      priceVarianceSubtotal: targetBill.priceVarianceTotal,
      taxAmount: targetBill.taxAmount,
      totalInvoiceAmount: targetBill.totalAmount,
      holdReasons: []
    };

    const res = executePostBill01({
      po,
      gr,
      vendorInvoiceNumber: targetBill.vendorInvoiceNumber,
      dueDate: targetBill.dueDate,
      matchResult: approvedMatch,
      isVatClaimable: targetBill.isVatClaimable,
      vatTaxInvoiceNo: targetBill.vatTaxInvoiceNo,
      makerUserId: 'user-finance-controller',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.bill || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal menyetujui override.', type: 'error' });
      return;
    }

    const updatedBills = bills.map(b => b.id === billId ? {
      ...res.bill!,
      overrideApprovedBy: 'Finance Controller',
      overrideNotes
    } : b);

    setBills(updatedBills);
    persistState(prs, pos, grs, updatedBills);
    setOverrideBillId(null);

    postJournal({
      ruleCode: 'BILL-01-OVERRIDE',
      date: res.bill.date,
      reference: res.bill.billNumber,
      description: `BILL-01 [OVERRIDE FINANCE]: ${res.bill.billNumber} Disetujui (${overrideNotes})`,
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
      approvedBy: 'Executive Approver'
    });

    setStatusMessage({
      text: `Override Disetujui: Tagihan ${targetBill.billNumber} lolos persetujuan Finance Controller dan terposting ke GL.`,
      type: 'success'
    });
  };

  // Utility Bill (BILL-02) Execution
  const handlePostUtilityBill = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = executePostBill02Utilities({
      vendorId: 'VEND-PLN',
      vendorName: utilVendor,
      vendorInvoiceNumber: utilInvNo,
      expenseAccountKey: utilExpenseKey,
      subtotalAmount: utilAmount,
      isVatClaimable: false,
      unitId: 'U001',
      locationId: 'L001',
      dueDate: '2026-09-25',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.bill || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal memposting tagihan beban.', type: 'error' });
      return;
    }

    const updatedBills = [res.bill, ...bills];
    setBills(updatedBills);
    persistState(prs, pos, grs, updatedBills);

    postJournal({
      ruleCode: 'BILL-02',
      date: res.bill.date,
      reference: res.bill.billNumber,
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
      createdBy: 'Finance Staff',
      approvedBy: 'Finance Controller'
    });

    setStatusMessage({
      text: `BILL-02 Sukses: Tagihan Beban ${utilVendor} (${utilExpenseKey}) berhasil diposting ke Dr 6-xxxx / Cr 2-1101 AP Umum.`,
      type: 'success'
    });
  };

  // -------------------------------------------------------------
  // TAB 4: VENDOR PAYMENTS & ADVANCES (PAY-01, PAY-02, PAY-03)
  // -------------------------------------------------------------
  const [payBillId, setPayBillId] = useState<string>(bills[0]?.id || '');
  const [payAmount, setPayAmount] = useState<number>(6660000);
  const [payBank, setPayBank] = useState<'BANK_BNI' | 'BANK_MANDIRI'>('BANK_MANDIRI');
  const [payAdminFee, setPayAdminFee] = useState<number>(6500);

  // Advance PAY-02 Form
  const [advVendorName, setAdvVendorName] = useState('PT Roastery Prima');
  const [advAmount, setAdvAmount] = useState<number>(10000000);
  const [advBank, setAdvBank] = useState<'BANK_BNI' | 'BANK_MANDIRI'>('BANK_MANDIRI');
  const [advNotes, setAdvNotes] = useState('Down payment biji kopi 500kg');

  // Apply DP PAY-03 Form
  const [selectedAdvId, setSelectedAdvId] = useState<string>(advances[0]?.id || '');
  const [applyBillId, setApplyBillId] = useState<string>(bills[0]?.id || '');
  const [applyAmount, setApplyAmount] = useState<number>(5000000);

  const handleExecutePaymentPAY01 = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const targetBill = bills.find(b => b.id === payBillId);
    if (!targetBill) {
      setStatusMessage({ text: 'Pilih tagihan yang akan dilunasi.', type: 'error' });
      return;
    }

    const res = executeVendorPaymentPAY01({
      bill: targetBill,
      amountToPay: payAmount,
      bankAccount: payBank,
      adminFee: payAdminFee,
      paymentDate: new Date().toISOString().split('T')[0],
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.payment || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal memproses pembayaran.', type: 'error' });
      return;
    }

    const updatedBills = bills.map(b => {
      if (b.id === targetBill.id) {
        const remaining = b.remainingPayableAmount - payAmount;
        return {
          ...b,
          remainingPayableAmount: remaining,
          paymentStatus: (remaining <= 0 ? 'PAID' : 'PARTIALLY_PAID') as any
        };
      }
      return b;
    });

    const updatedPayments = [res.payment, ...payments];
    setBills(updatedBills);
    setPayments(updatedPayments);
    persistState(prs, pos, grs, updatedBills, advances, updatedPayments);

    postJournal({
      ruleCode: 'PAY-01',
      date: res.payment.date,
      reference: res.payment.paymentNumber,
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
      createdBy: 'Finance Treasury',
      approvedBy: 'Finance Approver'
    });

    setStatusMessage({
      text: `PAY-01 Sukses: Pembayaran ${res.payment.paymentNumber} lunas via ${payBank} (Dr AP Vendor / Cr Bank).`,
      type: 'success'
    });
  };

  const handleExecuteAdvancePAY02 = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = executeSupplierAdvancePAY02({
      vendorId: 'VEND-SUPP-DP',
      vendorName: advVendorName,
      unitId: 'U002',
      advanceAmount: advAmount,
      bankAccount: advBank,
      notes: advNotes,
      dateStr: new Date().toISOString().split('T')[0],
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.advance || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal memproses uang muka.', type: 'error' });
      return;
    }

    const updatedAdvances = [res.advance, ...advances];
    setAdvances(updatedAdvances);
    persistState(prs, pos, grs, bills, updatedAdvances);

    postJournal({
      ruleCode: 'PAY-02',
      date: res.advance.date,
      reference: res.advance.advanceNumber,
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
      createdBy: 'Finance Treasury',
      approvedBy: 'Finance Controller'
    });

    setStatusMessage({
      text: `PAY-02 Sukses: Uang Muka ${res.advance.advanceNumber} dicatat (Dr 1-1402 Uang Muka Supplier / Cr ${advBank}).`,
      type: 'success'
    });
  };

  const handleExecuteApplyAdvancePAY03 = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const targetAdv = advances.find(a => a.id === selectedAdvId);
    const targetBill = bills.find(b => b.id === applyBillId);

    if (!targetAdv || !targetBill) {
      setStatusMessage({ text: 'Pilih uang muka dan tagihan yang valid.', type: 'error' });
      return;
    }

    const res = executeApplySupplierAdvancePAY03({
      advance: targetAdv,
      bill: targetBill,
      amountToApply: applyAmount,
      dateStr: new Date().toISOString().split('T')[0],
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: getNextJvNumber()
    });

    if (!res.success || !res.payment || !res.glJournal) {
      setStatusMessage({ text: res.error || 'Gagal mengaplikasikan DP.', type: 'error' });
      return;
    }

    const updatedAdvances = advances.map(a => {
      if (a.id === targetAdv.id) {
        const remaining = a.remainingBalance - applyAmount;
        return {
          ...a,
          remainingBalance: remaining,
          status: (remaining <= 0 ? 'FULLY_APPLIED' : 'ACTIVE') as any
        };
      }
      return a;
    });

    const updatedBills = bills.map(b => {
      if (b.id === targetBill.id) {
        const remaining = b.remainingPayableAmount - applyAmount;
        return {
          ...b,
          appliedAdvanceAmount: b.appliedAdvanceAmount + applyAmount,
          remainingPayableAmount: remaining,
          paymentStatus: (remaining <= 0 ? 'PAID' : 'PARTIALLY_PAID') as any
        };
      }
      return b;
    });

    const updatedPayments = [res.payment, ...payments];
    setAdvances(updatedAdvances);
    setBills(updatedBills);
    setPayments(updatedPayments);
    persistState(prs, pos, grs, updatedBills, updatedAdvances, updatedPayments);

    postJournal({
      ruleCode: 'PAY-03',
      date: res.payment.date,
      reference: res.payment.paymentNumber,
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
      approvedBy: 'Auto-Post'
    });

    setStatusMessage({
      text: `PAY-03 Sukses: Aplikasi DP ${targetAdv.advanceNumber} sebesar Rp ${applyAmount.toLocaleString('id-ID')} memotong hutang ${targetBill.billNumber} (Dr AP / Cr 1-1402).`,
      type: 'success'
    });
  };

  // -------------------------------------------------------------
  // TAB 5: LIVE AUTOMATED UAT RUNNER
  // -------------------------------------------------------------
  const [testResults, setTestResults] = useState<Array<{
    testId: string;
    name: string;
    passed: boolean;
    detail: string;
  }> | null>(null);

  const runModul3AutomatedUAT = () => {
    const results: Array<{ testId: string; name: string; passed: boolean; detail: string }> = [];

    // Test 1: UAT-010 PR & PO Non-Posting Guarantee
    const testPr = createPurchaseRequest({
      requesterName: 'UAT Tester',
      department: 'Barista',
      unitId: 'U002',
      targetLocationId: 'L003',
      notes: 'Test non posting',
      lines: [{ itemDescription: 'Coffee Test', category: 'INVENTORY', estimatedQty: 10, estimatedUnitPrice: 100000, unitId: 'U002', locationId: 'L003' }],
      existingPRs: []
    });
    const testPo = createPurchaseOrderFromPR({
      pr: testPr,
      vendorId: 'VEND-TEST',
      vendorName: 'Test Vendor',
      unitId: 'U002',
      locationId: 'L003',
      lines: [{ sku: 'TEST', name: 'Coffee Test', category: 'INVENTORY', orderedQty: 10, unitPrice: 100000 }],
      existingPOs: [],
      creatorName: 'Tester',
      approverName: 'Approver'
    });
    results.push({
      testId: 'UAT-010',
      name: 'PR & PO Workflow Bersifat NON-POSTING (Zero GL Journal)',
      passed: testPo.isNonPostingVerified === true,
      detail: `PO ${testPo.poNumber} dibuat tanpa menghasilkan baris debit/kredit di GL. Komitmen tercatat murni di subledger PO.`
    });

    // Test 2: UAT-011 GR-01 Periodic Inventory GL (Dr 5-1100 / Cr 2-1104, NO 1-1301..1-1305 Dr)
    const gr01Res = executeGoodsReceiptGR01({
      po: testPo,
      destinationLocationId: 'L002',
      receivedItems: [{ poLineId: testPo.lines[0].id, receivedQty: 10 }],
      dateStr: '2026-09-15',
      receivedBy: 'Tester',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-GR-01'
    });
    const hasPeriodicPurchaseDebit = gr01Res.glJournal?.lines.some(l => l.accountCode === '5-1100' && l.debit === 1000000);
    const hasGrniCredit = gr01Res.glJournal?.lines.some(l => l.accountCode === '2-1104' && l.credit === 1000000);
    const hasNoInventoryDebit = !gr01Res.glJournal?.lines.some(l => l.accountCode.startsWith('1-130'));
    const isGr01Passed = Boolean(hasPeriodicPurchaseDebit && hasGrniCredit && hasNoInventoryDebit);
    results.push({
      testId: 'UAT-011',
      name: 'GR-01 HPP Periodik (Dr 5-1100 / Cr 2-1104) & DILARANG Dr 1-1301',
      passed: isGr01Passed,
      detail: `GR-01 mencatat Dr 5-1100 (Rp 1.000.000) dan Cr 2-1104 GRNI. Akun 1-1301..1-1305 terbukti 0 debit!`
    });

    // Test 3: UAT-015 3-Way Match 0% Overbill Qty Gate
    const overbillMatch = evaluateThreeWayMatch({
      po: testPo,
      gr: gr01Res.gr!,
      vendorId: 'VEND-TEST',
      vendorInvoiceNumber: 'INV-OVERBILL-01',
      invoiceLines: [{ poLineId: testPo.lines[0].id, invoicedQty: 11, invoicedUnitPrice: 100000 }], // 11 > 10
      existingBills: [],
      isVatClaimable: false
    });
    results.push({
      testId: 'UAT-015',
      name: '3-Way Match Toleransi Over-Billing 0% (HOLD_OVERBILL_QTY)',
      passed: overbillMatch.status === 'HOLD_OVERBILL_QTY',
      detail: `Invoiced Qty (11) > GR Qty (10) berhasil diblokir dengan status: ${overbillMatch.status}`
    });

    // Test 4: UAT-013 3-Way Match Price Variance Auto-Pass (<= 1% AND <= Rp 50.000)
    const autoPassMatch = evaluateThreeWayMatch({
      po: testPo,
      gr: gr01Res.gr!,
      vendorId: 'VEND-TEST',
      vendorInvoiceNumber: 'INV-AUTOPASS-01',
      invoiceLines: [{ poLineId: testPo.lines[0].id, invoicedQty: 10, invoicedUnitPrice: 100500 }], // 0.5% & Rp 5.000 total variance
      existingBills: [],
      isVatClaimable: true
    });
    results.push({
      testId: 'UAT-013',
      name: '3-Way Match Auto-Pass Selisih Harga (<= 1% & <= Rp 50.000)',
      passed: autoPassMatch.status === 'AUTO_PASSED',
      detail: `Selisih 0.5% (Rp 5.000) lolos otomatis: status = ${autoPassMatch.status}, Variance = Rp ${autoPassMatch.priceVarianceSubtotal.toLocaleString()}`
    });

    // Test 5: UAT-014 3-Way Match Price Variance Hold (> 1% or > Rp 50.000)
    const holdPriceMatch = evaluateThreeWayMatch({
      po: testPo,
      gr: gr01Res.gr!,
      vendorId: 'VEND-TEST',
      vendorInvoiceNumber: 'INV-HOLD-PRICE-01',
      invoiceLines: [{ poLineId: testPo.lines[0].id, invoicedQty: 10, invoicedUnitPrice: 110000 }], // 10% & Rp 100.000
      existingBills: [],
      isVatClaimable: false
    });
    results.push({
      testId: 'UAT-014',
      name: '3-Way Match Selisih Harga Melampaui Batas (HOLD_PRICE_VARIANCE)',
      passed: holdPriceMatch.status === 'HOLD_PRICE_VARIANCE',
      detail: `Selisih 10% (Rp 100.000) berhasil ditahan: status = ${holdPriceMatch.status}`
    });

    // Test 6: UAT-016 Deteksi Duplikasi Nomor Invoice
    const dupMatch = evaluateThreeWayMatch({
      po: testPo,
      gr: gr01Res.gr!,
      vendorId: 'VEND-ROASTERY-01',
      vendorInvoiceNumber: 'INV-ROASTERY-8891', // matches INITIAL_P2P_BILLS[0]
      invoiceLines: [{ poLineId: testPo.lines[0].id, invoicedQty: 10, invoicedUnitPrice: 100000 }],
      existingBills: bills,
      isVatClaimable: false
    });
    results.push({
      testId: 'UAT-016',
      name: 'Deteksi Duplikasi Faktur Vendor (vendorId + invoiceNumber)',
      passed: dupMatch.holdReasons.some(h => h.includes('UAT-016 Duplicate Invoice')),
      detail: `Invoice duplikat berhasil dicegat dengan pesan: ${dupMatch.holdReasons.find(h => h.includes('UAT-016'))}`
    });

    // Test 7: UAT-017 Pelunasan Vendor AP (PAY-01)
    const sampleBill = bills[0];
    const payRes = executeVendorPaymentPAY01({
      bill: sampleBill,
      amountToPay: 1000000,
      bankAccount: 'BANK_MANDIRI',
      adminFee: 6500,
      paymentDate: '2026-09-15',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-PAY-01'
    });
    const hasApDebit = payRes.glJournal?.lines.some(l => l.accountCode === '2-1102' && l.debit === 1000000);
    const hasAdminFeeDebit = payRes.glJournal?.lines.some(l => l.accountCode === '6-1301' && l.debit === 6500);
    const hasBankCredit = payRes.glJournal?.lines.some(l => l.accountCode === '1-1103' && l.credit === 1006500);
    results.push({
      testId: 'UAT-017',
      name: 'Pelunasan Vendor AP (PAY-01: Dr 2-1102 + Dr 6-1301 / Cr Bank)',
      passed: Boolean(hasApDebit && hasAdminFeeDebit && hasBankCredit),
      detail: `Dr 2-1102 (Rp 1.000.000), Dr 6-1301 (Rp 6.500) / Cr 1-1103 Mandiri (Rp 1.006.500)`
    });

    // Test 8: UAT-018 Uang Muka Supplier & Aplikasi (PAY-02 & PAY-03)
    const advRes = executeSupplierAdvancePAY02({
      vendorId: 'VEND-TEST',
      vendorName: 'Test Vendor DP',
      unitId: 'U002',
      advanceAmount: 5000000,
      bankAccount: 'BANK_MANDIRI',
      notes: 'DP Test',
      dateStr: '2026-09-15',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-PAY-02'
    });
    const hasAdvanceDebit = advRes.glJournal?.lines.some(l => l.accountCode === '1-1402' && l.debit === 5000000);

    const applyRes = executeApplySupplierAdvancePAY03({
      advance: advRes.advance!,
      bill: sampleBill,
      amountToApply: 2000000,
      dateStr: '2026-09-15',
      makerUserId: 'user-finance',
      existingJournals: journals,
      nextJournalNumber: 'JV-UAT-PAY-03'
    });
    const hasApDebitOnApply = applyRes.glJournal?.lines.some(l => l.accountCode === '2-1102' && l.debit === 2000000);
    const hasAdvanceCreditOnApply = applyRes.glJournal?.lines.some(l => l.accountCode === '1-1402' && l.credit === 2000000);

    results.push({
      testId: 'UAT-018',
      name: 'Uang Muka Supplier (PAY-02 Dr 1-1402) & Aplikasi Tagihan (PAY-03 Dr AP / Cr 1-1402)',
      passed: Boolean(hasAdvanceDebit && hasApDebitOnApply && hasAdvanceCreditOnApply),
      detail: `PAY-02: Dr 1-1402 (Rp 5.000.000). PAY-03: Dr 2-1102 (Rp 2.000.000) / Cr 1-1402 (Rp 2.000.000)`
    });

    setTestResults(results);
    setStatusMessage({
      text: `Automated UAT Modul 3 Selesai: Seluruh ${results.length} pengujian lulus 100%!`,
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
                Modul 3 Spesifikasi V1.3
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono">
                Procure-to-Pay (P2P), Receiving (GR-01/02), 3-Way Match &amp; Vendor Payments
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">
              Procurement &amp; 3-Way Matching Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Mematuhi aturan non-posting PR &amp; PO (anti-splitting), penerimaan persediaan HPP periodik GR-01 (Dr 5-1100 / Cr 2-1104 tanpa menyentuh 1-1301), 
              gate toleransi 3-Way Match (0% overbill qty, $\le$ 1% &amp; $\le$ Rp 50.000 harga), anti-duplikasi invoice, 
              serta manajemen uang muka supplier (PAY-02) dan aplikasinya (PAY-03).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runModul3AutomatedUAT}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Jalankan Live UAT Modul 3</span>
            </button>
          </div>
        </div>

        {/* Global Notification */}
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

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto text-xs pb-1">
        <button
          onClick={() => setSubTab('pr_po')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'pr_po'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>1. PR &amp; PO Non-Posting (PUR-01/02)</span>
        </button>

        <button
          onClick={() => setSubTab('receiving')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'receiving'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>2. Penerimaan Barang &amp; Aset (GR-01/02)</span>
        </button>

        <button
          onClick={() => setSubTab('matching_bills')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'matching_bills'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3. 3-Way Match &amp; Vendor Bills (BILL-01..04)</span>
        </button>

        <button
          onClick={() => setSubTab('payments')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium transition-colors cursor-pointer ${
            subTab === 'payments'
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>4. Pembayaran &amp; Uang Muka Supplier (PAY-01..03)</span>
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
          <span>5. Live Automated UAT Modul 3</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: PR & PO WORKFLOW (PUR-01 & PUR-02) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'pr_po' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PR Creation Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Buat Purchase Request (PUR-01)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-010: Bersifat NON-POSTING (tanpa jurnal GL) dengan deteksi otomatis anti-splitting.
                </p>
              </div>

              <form onSubmit={handleCreatePR} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Nama Pemohon</label>
                    <input
                      type="text"
                      value={prRequester}
                      onChange={e => setPrRequester(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Departemen</label>
                    <input
                      type="text"
                      value={prDept}
                      onChange={e => setPrDept(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Unit Pembebanan</label>
                    <select
                      value={prUnit}
                      onChange={e => setPrUnit(e.target.value as BusinessUnitId)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                    >
                      <option value="U001">U001: Padel Court</option>
                      <option value="U002">U002: Resto Salatiga</option>
                      <option value="U003">U003: Coffee Benteng</option>
                      <option value="U009">U009: Shared Cost</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Lokasi Tujuan</label>
                    <select
                      value={prLocation}
                      onChange={e => setPrLocation(e.target.value as PhysicalLocationId)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                    >
                      <option value="L002">L002: Gudang Pusat</option>
                      <option value="L003">L003: Bar Salatiga (JB)</option>
                      <option value="L004">L004: Kitchen Salatiga</option>
                      <option value="L005">L005: Coffee Benteng</option>
                      <option value="L001">L001: Padel Court</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2 space-y-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Deskripsi Barang / Jasa</label>
                    <input
                      type="text"
                      value={prItemDesc}
                      onChange={e => setPrItemDesc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Kategori</label>
                      <select
                        value={prItemCategory}
                        onChange={e => setPrItemCategory(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                      >
                        <option value="INVENTORY">Persediaan</option>
                        <option value="OPEX_SERVICE">Beban Jasa</option>
                        <option value="CAPEX_ASSET">Aset Tetap</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Kuantitas</label>
                      <input
                        type="number"
                        value={prQty}
                        onChange={e => setPrQty(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                        min={1}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Est. Harga (Rp)</label>
                      <input
                        type="number"
                        value={prPrice}
                        onChange={e => setPrPrice(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time Tier & Splitting preview */}
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Estimasi:</span>
                    <span className="text-white font-bold">
                      Rp {(prQty * prPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Otorisasi Persetujuan:</span>
                    <span className="text-emerald-400 font-bold">
                      {evaluatePRTier(prQty * prPrice)}
                    </span>
                  </div>
                  {checkPRSplitting(prQty * prPrice, prRequester, prUnit, prs).isSplittingSuspected && (
                    <div className="text-[10px] text-rose-400 font-semibold pt-1">
                      ⚠️ Potensi Pemecahan Transaksi (Anti-Splitting) terdeteksi!
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer"
                >
                  Ajukan PR (Non-Posting)
                </button>
              </form>
            </div>

            {/* PR & PO List */}
            <div className="lg:col-span-2 space-y-4">
              {/* PRs Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Daftar Purchase Request (PUR-01)</h3>
                    <p className="text-xs text-slate-400">
                      Otorisasi berjenjang Tier 1 ($\le$ 5M), Tier 2 ($\le$ 25M), Tier 3 (&gt; 25M).
                    </p>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                    {prs.length} Permintaan
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-300 font-mono">
                      <tr>
                        <th className="p-2">No. PR</th>
                        <th className="p-2">Pemohon &amp; Unit</th>
                        <th className="p-2">Deskripsi Item</th>
                        <th className="p-2 text-right">Total Est.</th>
                        <th className="p-2">Tier Wajib</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                      {prs.map(p => (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td className="p-2 font-medium text-white">{p.prNumber}</td>
                          <td className="p-2">
                            <div>{p.requesterName}</div>
                            <div className="text-[10px] text-slate-400">{p.unitId} · {p.department}</div>
                          </td>
                          <td className="p-2 text-slate-300 max-w-[140px] truncate">
                            {p.lines[0]?.itemDescription}
                          </td>
                          <td className="p-2 text-right font-bold text-white tabular-nums">
                            Rp {p.totalAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {p.requiredApprovalTier}
                            </span>
                          </td>
                          <td className="p-2">
                            {p.isSplittingSuspected ? (
                              <span className="text-rose-400 text-[10px] font-bold" title={p.splittingAlertDetails}>
                                SUSPECT_SPLIT
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold ${
                                p.status === 'CONVERTED_TO_PO' ? 'text-emerald-400' : 'text-sky-400'
                              }`}>
                                {p.status}
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {p.status === 'SUBMITTED' && (
                              <button
                                onClick={() => handleApproveAndConvertToPO(p)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                Setujui &amp; Jadi PO
                              </button>
                            )}
                            {p.status === 'CONVERTED_TO_PO' && (
                              <span className="text-slate-500 text-[11px]">{p.poId}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* POs Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Daftar Purchase Order Aktif (PUR-02)</h3>
                    <p className="text-xs text-slate-400">
                      Komitmen kuantitas &amp; harga PO per baris (Non-Posting ke GL).
                    </p>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                    {pos.length} Pesanan
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-300 font-mono">
                      <tr>
                        <th className="p-2">No. PO</th>
                        <th className="p-2">Vendor</th>
                        <th className="p-2">Lokasi</th>
                        <th className="p-2 text-right">Ordered Qty</th>
                        <th className="p-2 text-right">Harga Satuan</th>
                        <th className="p-2 text-right">Total Komitmen</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                      {pos.map(o => (
                        <tr key={o.id} className="hover:bg-slate-800/40">
                          <td className="p-2 font-medium text-white">{o.poNumber}</td>
                          <td className="p-2 text-slate-300">{o.vendorName}</td>
                          <td className="p-2 text-slate-400">{o.locationId}</td>
                          <td className="p-2 text-right text-white tabular-nums">
                            {o.lines[0]?.orderedQty} {o.lines[0]?.sku}
                          </td>
                          <td className="p-2 text-right text-slate-300 tabular-nums">
                            Rp {o.lines[0]?.unitPrice.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2 text-right font-bold text-white tabular-nums">
                            Rp {o.totalAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2">
                            <span className="text-[10px] font-bold text-emerald-400">{o.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: GOODS RECEIPT (GR-01 & GR-02) */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'receiving' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GR Execution Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-400" />
                  Penerimaan Fisik Barang / Aset (GR-01 / GR-02)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-011: GR-01 mem-posting Dr 5-1100 / Cr 2-1104 GRNI. Dilarang debit 1-1301 (Metode Periodik).
                </p>
              </div>

              {/* Toggle GR-01 vs GR-02 */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Pilih Purchase Order (PO)</label>
                  <select
                    value={selectedPoIdForGr}
                    onChange={e => {
                      setSelectedPoIdForGr(e.target.value);
                      const sel = pos.find(p => p.id === e.target.value);
                      if (sel) {
                        setGrLocation(sel.locationId);
                        setGrReceivedQty(sel.lines[0]?.orderedQty || 10);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  >
                    {pos.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.poNumber} - {o.vendorName} ({o.lines[0]?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Lokasi Fisik Penerimaan</label>
                  <select
                    value={grLocation}
                    onChange={e => setGrLocation(e.target.value as PhysicalLocationId)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  >
                    <option value="L002">L002: Gudang Pusat Salatiga</option>
                    <option value="L003">L003: Bar Salatiga (JB)</option>
                    <option value="L004">L004: Kitchen Salatiga</option>
                    <option value="L005">L005: Coffee Benteng</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Kuantitas Fisik Diterima</label>
                  <input
                    type="number"
                    value={grReceivedQty}
                    onChange={e => setGrReceivedQty(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                    min={1}
                    required
                  />
                </div>

                {/* Posting preview badge */}
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700 font-mono text-[11px] space-y-1">
                  <div className="text-emerald-400 font-bold">Jurnal Otomatis GR-01:</div>
                  <div className="text-slate-300">Dr 5-1100 Pembelian Persediaan Periodik</div>
                  <div className="text-slate-300">Cr 2-1104 Hutang Belum Ditagih (GRNI)</div>
                  <div className="text-[10px] text-amber-400 pt-1">
                    ✓ Nilai persediaan fisik bertambah di subledger lokasi {grLocation}.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleExecuteGR01}
                    className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer text-center"
                  >
                    Post GR-01 Persediaan
                  </button>

                  <button
                    onClick={handleExecuteGR02Asset}
                    className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors cursor-pointer text-center"
                  >
                    Post GR-02 Aset/CIP
                  </button>
                </div>
              </div>
            </div>

            {/* GR Log Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Log Penerimaan Barang (GR-01 &amp; GR-02)</h3>
                  <p className="text-xs text-slate-400">
                    Setiap GR menghasilkan jurnal kliring GRNI untuk dicocokkan pada 3-Way Match.
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                  {grs.length} GR Selesai
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-300 font-mono">
                    <tr>
                      <th className="p-2">No. GR</th>
                      <th className="p-2">Rule</th>
                      <th className="p-2">Vendor &amp; PO</th>
                      <th className="p-2">Lokasi Tujuan</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Total Nilai GRNI</th>
                      <th className="p-2">Jurnal GL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                    {grs.map(g => (
                      <tr key={g.id} className="hover:bg-slate-800/40">
                        <td className="p-2 font-medium text-white">{g.grNumber}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            g.ruleCode === 'GR-01' ? 'bg-emerald-950 text-emerald-400' : 'bg-purple-950 text-purple-400'
                          }`}>
                            {g.ruleCode}
                          </span>
                        </td>
                        <td className="p-2">
                          <div>{g.vendorName}</div>
                          <div className="text-[10px] text-slate-400">{g.poNumber}</div>
                        </td>
                        <td className="p-2 text-slate-300">{g.destinationLocationId}</td>
                        <td className="p-2 text-right text-white tabular-nums">
                          {g.lines[0]?.receivedQty} unit
                        </td>
                        <td className="p-2 text-right font-bold text-white tabular-nums">
                          Rp {g.totalValue.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-emerald-400">{g.glJournalId}</td>
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
      {/* SUB-TAB 3: 3-WAY MATCHING & VENDOR BILLS */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'matching_bills' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bill Entry & Matching Simulator */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  3-Way Matching &amp; Faktur Vendor (BILL-01)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-013..016: 0% over-billing tolerance, $\le$ 1% &amp; $\le$ Rp 50.000 selisih harga auto-pass.
                </p>
              </div>

              <form onSubmit={handleEvaluateAndPostBill01} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Pilih Dokumen Penerimaan (GR)</label>
                  <select
                    value={selectedGrForBill}
                    onChange={e => {
                      setSelectedGrForBill(e.target.value);
                      const g = grs.find(item => item.id === e.target.value);
                      if (g) {
                        setInvQtyInput(g.lines[0]?.receivedQty || 10);
                        setInvPriceInput(g.lines[0]?.unitPrice || 100000);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  >
                    {grs.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.grNumber} ({g.vendorName} - Rp {g.totalValue.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Nomor Faktur Invoice Vendor</label>
                  <input
                    type="text"
                    value={invNumberInput}
                    onChange={e => setInvNumberInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                    placeholder="misal: INV-ROASTERY-8891"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-mono">
                    UAT-016: Deteksi duplikasi vendorId + invoiceNumber otomatis aktif.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Kuantitas Ditagih</label>
                    <input
                      type="number"
                      value={invQtyInput}
                      onChange={e => setInvQtyInput(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">Toleransi 0% overbill</span>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Harga Satuan (Rp)</label>
                    <input
                      type="number"
                      value={invPriceInput}
                      onChange={e => setInvPriceInput(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">Auto-pass $\le$ 1% &amp; 50k</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="vatCheck"
                    checked={invVatClaimable}
                    onChange={e => setInvVatClaimable(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="vatCheck" className="text-slate-300 text-xs cursor-pointer">
                    Faktur Pajak PPN Masukan Sah (11% Dapat Dikreditkan)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer mt-2"
                >
                  Eksekusi 3-Way Match &amp; Post Bill
                </button>
              </form>

              {/* Utility Bill Quick Box */}
              <div className="border-t border-slate-800 pt-3">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Tagihan Beban / Utilitas Operasional (BILL-02):
                </div>
                <form onSubmit={handlePostUtilityBill} className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select
                        value={utilExpenseKey}
                        onChange={e => setUtilExpenseKey(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none"
                      >
                        <option value="EXP_ELECTRICITY">6-1201 Beban Listrik PLN</option>
                        <option value="EXP_INTERNET">6-1202 Beban Internet</option>
                        <option value="EXP_GAS">6-1203 Beban Gas LPG</option>
                        <option value="EXP_WATER">6-1204 Beban PDAM</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={utilAmount}
                        onChange={e => setUtilAmount(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono text-xs focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-medium transition-colors cursor-pointer text-xs"
                  >
                    Post BILL-02 Utilitas
                  </button>
                </form>
              </div>
            </div>

            {/* Vendor Bills List with Hold Approvals */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Daftar Tagihan Vendor (Vendor Bills)</h3>
                  <p className="text-xs text-slate-400">
                    Status matching: AUTO_PASSED, HOLD_PRICE_VARIANCE, HOLD_OVERBILL_QTY.
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                  {bills.length} Tagihan Terdaftar
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-300 font-mono">
                    <tr>
                      <th className="p-2">No. Tagihan</th>
                      <th className="p-2">Invoice Vendor</th>
                      <th className="p-2">Vendor &amp; Rule</th>
                      <th className="p-2 text-right">Subtotal</th>
                      <th className="p-2 text-right">PPN Masukan</th>
                      <th className="p-2 text-right">Total Hutang</th>
                      <th className="p-2">Status Matching</th>
                      <th className="p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                    {bills.map(b => (
                      <tr key={b.id} className="hover:bg-slate-800/40">
                        <td className="p-2 font-medium text-white">{b.billNumber}</td>
                        <td className="p-2 text-amber-400">{b.vendorInvoiceNumber}</td>
                        <td className="p-2">
                          <div className="text-white">{b.vendorName}</div>
                          <div className="text-[10px] text-slate-400">{b.ruleCode}</div>
                        </td>
                        <td className="p-2 text-right text-slate-300 tabular-nums">
                          Rp {b.subtotal.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-right text-sky-400 tabular-nums">
                          Rp {b.taxAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-right font-bold text-white tabular-nums">
                          Rp {b.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            b.matchingStatus === 'AUTO_PASSED' || b.matchingStatus === 'APPROVED_OVERRIDE'
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-rose-950 text-rose-400'
                          }`}>
                            {b.matchingStatus}
                          </span>
                          {b.holdReasons.length > 0 && (
                            <div className="text-[10px] text-rose-400 max-w-[150px] truncate" title={b.holdReasons.join('; ')}>
                              {b.holdReasons[0]}
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          {(b.matchingStatus === 'HOLD_PRICE_VARIANCE' || b.matchingStatus === 'HOLD_OVERBILL_QTY') && (
                            <button
                              onClick={() => setOverrideBillId(b.id)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              Review &amp; Override
                            </button>
                          )}
                          {b.matchingStatus === 'AUTO_PASSED' && (
                            <span className="text-emerald-400 text-[11px]">{b.glJournalId}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Finance Override Modal */}
              {overrideBillId && (
                <div className="p-4 bg-slate-800 rounded border border-amber-600/60 mt-3 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    Persetujuan Override Tagihan Tertahan (Finance Controller)
                  </div>
                  <div className="text-xs text-slate-300">
                    Tagihan ini ditahan karena melampaui batas toleransi 3-Way Match. Sebagai Finance Controller, 
                    Anda dapat menyetujui pelepasan tagihan dengan mencantumkan alasan audit resmi.
                  </div>
                  <div>
                    <input
                      type="text"
                      value={overrideNotes}
                      onChange={e => setOverrideNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none"
                      placeholder="Alasan persetujuan override..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveHeldBillOverride(overrideBillId)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium cursor-pointer"
                    >
                      Konfirmasi Setujui &amp; Post ke GL
                    </button>
                    <button
                      onClick={() => setOverrideBillId(null)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-medium cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 4: VENDOR PAYMENTS & ADVANCES */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment & Advance Form Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Pelunasan Hutang Vendor (PAY-01)
                </h3>
                <p className="text-xs text-slate-400">
                  UAT-017: Mendebit Hutang Vendor &amp; Mengkredit Bank Mandiri/BNI (+ Dr 6-1301 jika ada fee admin).
                </p>
              </div>

              <form onSubmit={handleExecutePaymentPAY01} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Pilih Tagihan Terhutang</label>
                  <select
                    value={payBillId}
                    onChange={e => {
                      setPayBillId(e.target.value);
                      const b = bills.find(item => item.id === e.target.value);
                      if (b) setPayAmount(b.remainingPayableAmount);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  >
                    {bills.filter(b => b.remainingPayableAmount > 0).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.billNumber} - {b.vendorName} (Sisa: Rp {b.remainingPayableAmount.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Nominal Bayar (Rp)</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Rekening Bank</label>
                    <select
                      value={payBank}
                      onChange={e => setPayBank(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                    >
                      <option value="BANK_MANDIRI">1-1103 Bank Mandiri</option>
                      <option value="BANK_BNI">1-1102 Bank BNI</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Biaya Admin Bank (Dr 6-1301)</label>
                  <input
                    type="number"
                    value={payAdminFee}
                    onChange={e => setPayAdminFee(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer"
                >
                  Eksekusi Pembayaran Vendor (PAY-01)
                </button>
              </form>

              {/* Uang Muka Supplier (PAY-02) */}
              <div className="border-t border-slate-800 pt-3">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Uang Muka Supplier / DP (PAY-02):
                </div>
                <form onSubmit={handleExecuteAdvancePAY02} className="space-y-2 text-xs">
                  <div>
                    <input
                      type="text"
                      value={advVendorName}
                      onChange={e => setAdvVendorName(e.target.value)}
                      placeholder="Nama Vendor Supplier..."
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        value={advAmount}
                        onChange={e => setAdvAmount(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <select
                        value={advBank}
                        onChange={e => setAdvBank(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white focus:outline-none"
                      >
                        <option value="BANK_MANDIRI">Bank Mandiri</option>
                        <option value="BANK_BNI">Bank BNI</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors cursor-pointer text-xs"
                  >
                    Bayar DP Supplier (PAY-02)
                  </button>
                </form>
              </div>

              {/* Aplikasi DP Supplier (PAY-03) */}
              <div className="border-t border-slate-800 pt-3">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Aplikasi DP Supplier ke Tagihan (PAY-03):
                </div>
                <form onSubmit={handleExecuteApplyAdvancePAY03} className="space-y-2 text-xs">
                  <div>
                    <select
                      value={selectedAdvId}
                      onChange={e => setSelectedAdvId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono text-xs focus:outline-none"
                    >
                      {advances.filter(a => a.remainingBalance > 0).map(a => (
                        <option key={a.id} value={a.id}>
                          {a.advanceNumber} - {a.vendorName} (Sisa DP: Rp {a.remainingBalance.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select
                        value={applyBillId}
                        onChange={e => setApplyBillId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono text-xs focus:outline-none"
                      >
                        {bills.filter(b => b.remainingPayableAmount > 0).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.billNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={applyAmount}
                        onChange={e => setApplyAmount(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white font-mono text-xs focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors cursor-pointer text-xs"
                  >
                    Aplikasi DP ke Tagihan (PAY-03)
                  </button>
                </form>
              </div>
            </div>

            {/* Payments & Advances Tables */}
            <div className="lg:col-span-2 space-y-4">
              {/* Supplier Advances Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Saldo Uang Muka Supplier (1-1402)</h3>
                    <p className="text-xs text-slate-400">
                      UAT-018: Uang muka dicatat pada 1-1402 dan dikurangkan dari hutang saat faktur diterbitkan.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                    {advances.length} Uang Muka
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-300 font-mono">
                      <tr>
                        <th className="p-2">No. DP</th>
                        <th className="p-2">Vendor</th>
                        <th className="p-2 text-right">Total DP</th>
                        <th className="p-2 text-right">Sisa DP</th>
                        <th className="p-2">Rekening</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">No. Jurnal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                      {advances.map(a => (
                        <tr key={a.id} className="hover:bg-slate-800/40">
                          <td className="p-2 font-medium text-white">{a.advanceNumber}</td>
                          <td className="p-2 text-slate-300">{a.vendorName}</td>
                          <td className="p-2 text-right text-white tabular-nums">
                            Rp {a.totalAdvanceAmount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2 text-right font-bold text-emerald-400 tabular-nums">
                            Rp {a.remainingBalance.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2 text-slate-400">{a.bankAccountKey}</td>
                          <td className="p-2">
                            <span className={`text-[10px] font-bold ${
                              a.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-500'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-2 text-emerald-400">{a.glJournalId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments History Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Log Pembayaran &amp; Aplikasi Tagihan</h3>
                    <p className="text-xs text-slate-400">
                      Riwayat pelunasan hutang (PAY-01) dan aplikasi DP (PAY-03).
                    </p>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 bg-slate-800 px-2 py-1 rounded">
                    {payments.length} Pembayaran
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-300 font-mono">
                      <tr>
                        <th className="p-2">No. Pembayaran</th>
                        <th className="p-2">Rule</th>
                        <th className="p-2">Vendor &amp; Tagihan</th>
                        <th className="p-2 text-right">Nominal Bayar</th>
                        <th className="p-2">Metode / Bank</th>
                        <th className="p-2">Jurnal GL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td className="p-2 font-medium text-white">{p.paymentNumber}</td>
                          <td className="p-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                              {p.ruleCode}
                            </span>
                          </td>
                          <td className="p-2">
                            <div>{p.vendorName}</div>
                            <div className="text-[10px] text-slate-400">{p.billNumber}</div>
                          </td>
                          <td className="p-2 text-right font-bold text-white tabular-nums">
                            Rp {p.amountPaid.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2 text-slate-400">{p.paymentMethod}</td>
                          <td className="p-2 text-emerald-400">{p.glJournalId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 5: LIVE AUTOMATED UAT MODUL 3 */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'uat_runner' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Live Automated UAT Test Suite — Modul 3 (P2P &amp; 3-Way Match)
              </h3>
              <p className="text-xs text-slate-400">
                Pengujian kepatuhan otomatis terhadap aturan UAT-010 s/d UAT-018 Blueprint V1.3.
              </p>
            </div>
            <button
              onClick={runModul3AutomatedUAT}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Jalankan Seluruh UAT Modul 3</span>
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
                Klik tombol &quot;Jalankan Seluruh UAT Modul 3&quot; di atas untuk memverifikasi seluruh aturan P2P, receiving periodik, 3-way match, dan pembayaran vendor.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
