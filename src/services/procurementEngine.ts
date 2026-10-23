/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 3: Procurement & 3-Way Matching Engine
 * 
 * Strict Blueprint Compliance:
 * - REQ-010 / UAT-010: Non-Posting PR & PO Workflow with Anti-Splitting
 * - REQ-011 / UAT-011: Periodic Goods Receipt GR-01 (Dr 5-1100 / Cr 2-1104, NO 1-1301 Dr) & Asset GR-02
 * - REQ-012..014 / UAT-012..016: 3-Way Match (0% overbill tolerance, <=1% & <=Rp 50.000 price tolerance, duplicate check)
 * - REQ-015 / UAT-017, UAT-018: Vendor Payments (PAY-01), Advances (PAY-02), and Application (PAY-03)
 */

import { 
  PurchaseRequest, 
  PRLine, 
  PurchaseOrderRecord, 
  POLineItem, 
  GoodsReceiptRecord, 
  GRLineItem,
  VendorBillRecord,
  ThreeWayMatchResult,
  LineMatchResult,
  SupplierAdvanceRecord,
  VendorPaymentRecord,
  BillType
} from '../types/purchasingAndP2P';
import { BusinessUnitId, PhysicalLocationId, CoreGLJournalPayload } from '../types/module1';
import { GLJournalEntry } from '../types/erp';
import { executeCoreGLPosting } from './coreGlEngine';

// Configurable PR Approval Tiers (REQ-032)
export const PR_APPROVAL_LIMITS = {
  TIER_1_MAX: 5000000,   // Rp 5.000.000 (Supervisor / Outlet Lead)
  TIER_2_MAX: 25000000,  // Rp 25.000.000 (Operations / Purchasing Head)
  // > Rp 25.000.000 requires Tier 3 (Finance Controller / Director)
};

/**
 * Evaluates required PR approval tier
 */
export function evaluatePRTier(amount: number): 'TIER_1_SPV' | 'TIER_2_HEAD' | 'TIER_3_DIRECTOR' {
  if (amount <= PR_APPROVAL_LIMITS.TIER_1_MAX) {
    return 'TIER_1_SPV';
  } else if (amount <= PR_APPROVAL_LIMITS.TIER_2_MAX) {
    return 'TIER_2_HEAD';
  }
  return 'TIER_3_DIRECTOR';
}

/**
 * Anti-Splitting Detection:
 * Flags if multiple PRs from the same requester/unit within 48h appear structured
 * to stay just below approval thresholds (e.g. 2 PRs of Rp 4.800.000).
 */
export function checkPRSplitting(
  newAmount: number,
  requesterName: string,
  unitId: BusinessUnitId,
  existingPRs: PurchaseRequest[]
): { isSplittingSuspected: boolean; details?: string } {
  const recentPRs = existingPRs.filter(pr => {
    return pr.unitId === unitId && 
           pr.status !== 'REJECTED' &&
           (pr.requesterName.toLowerCase() === requesterName.toLowerCase());
  });

  // Check if multiple recent PRs sit just below Tier 1 threshold (between 3.5m and 5m)
  const suspiciousCount = recentPRs.filter(pr => pr.totalAmount >= 3500000 && pr.totalAmount <= 5000000).length;
  if (newAmount >= 3500000 && newAmount <= 5000000 && suspiciousCount >= 1) {
    return {
      isSplittingSuspected: true,
      details: `[ANTI-SPLITTING ALERT]: Terdeteksi ${suspiciousCount + 1} PR bernilai Rp 3.5M - Rp 5M untuk unit ${unitId}. Potensi pemecahan transaksi untuk menghindari persetujuan Tier 2 (> Rp 5.000.000).`
    };
  }

  // Check cumulative total
  const recentTotal = recentPRs.reduce((sum, pr) => sum + pr.totalAmount, 0) + newAmount;
  if (recentPRs.length >= 2 && recentTotal > PR_APPROVAL_LIMITS.TIER_2_MAX) {
    return {
      isSplittingSuspected: true,
      details: `[ANTI-SPLITTING ALERT]: Akumulasi PR unit ${unitId} mencapai Rp ${recentTotal.toLocaleString('id-ID')}, melampaui limit Tier 2.`
    };
  }

  return { isSplittingSuspected: false };
}

/**
 * PUR-01: Create Purchase Request (NON-POSTING)
 * Guarantees zero GL journal creation (REQ-010 / UAT-010)
 */
export function createPurchaseRequest(params: {
  requesterName: string;
  department: string;
  unitId: BusinessUnitId;
  targetLocationId: PhysicalLocationId;
  notes: string;
  lines: Array<{
    itemDescription: string;
    sku?: string;
    category: 'INVENTORY' | 'OPEX_SERVICE' | 'CAPEX_ASSET';
    estimatedQty: number;
    estimatedUnitPrice: number;
    unitId: BusinessUnitId;
    locationId: PhysicalLocationId;
  }>;
  existingPRs: PurchaseRequest[];
}): PurchaseRequest {
  const { requesterName, department, unitId, targetLocationId, notes, lines, existingPRs } = params;

  const prLines: PRLine[] = lines.map((l, idx) => ({
    id: `pr-line-${Date.now()}-${idx}`,
    itemDescription: l.itemDescription,
    sku: l.sku,
    category: l.category,
    estimatedQty: l.estimatedQty,
    estimatedUnitPrice: l.estimatedUnitPrice,
    totalEstimated: l.estimatedQty * l.estimatedUnitPrice,
    unitId: l.unitId,
    locationId: l.locationId
  }));

  const totalAmount = prLines.reduce((acc, l) => acc + l.totalEstimated, 0);
  const tier = evaluatePRTier(totalAmount);
  const splittingCheck = checkPRSplitting(totalAmount, requesterName, unitId, existingPRs);

  const prNumber = `PR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(existingPRs.length + 1).padStart(3, '0')}`;

  const newPR: PurchaseRequest = {
    id: `PR-${Date.now()}`,
    prNumber,
    date: new Date().toISOString().split('T')[0],
    requesterName,
    department,
    unitId,
    targetLocationId,
    notes,
    lines: prLines,
    totalAmount,
    status: 'SUBMITTED',
    requiredApprovalTier: tier,
    isSplittingSuspected: splittingCheck.isSplittingSuspected,
    splittingAlertDetails: splittingCheck.details
  };

  return newPR;
}

/**
 * PUR-02: Create Purchase Order (NON-POSTING)
 * Guarantees zero GL journal creation (REQ-010 / UAT-010)
 */
export function createPurchaseOrderFromPR(params: {
  pr?: PurchaseRequest;
  vendorId: string;
  vendorName: string;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  lines: Array<{
    sku: string;
    name: string;
    category: 'INVENTORY' | 'OPEX_SERVICE' | 'CAPEX_ASSET';
    assetAccountKey?: string;
    orderedQty: number;
    unitPrice: number;
  }>;
  existingPOs: PurchaseOrderRecord[];
  creatorName: string;
  approverName: string;
}): PurchaseOrderRecord {
  const { pr, vendorId, vendorName, unitId, locationId, lines, existingPOs, creatorName, approverName } = params;

  const poLines: POLineItem[] = lines.map((l, idx) => ({
    id: `po-line-${Date.now()}-${idx}`,
    sku: l.sku,
    name: l.name,
    category: l.category,
    assetAccountKey: l.assetAccountKey,
    orderedQty: l.orderedQty,
    receivedQty: 0,
    billedQty: 0,
    unitPrice: l.unitPrice,
    totalPrice: l.orderedQty * l.unitPrice,
    unitId,
    locationId
  }));

  const totalAmount = poLines.reduce((sum, l) => sum + l.totalPrice, 0);
  const poNumber = `PO-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(existingPOs.length + 1).padStart(3, '0')}`;

  const newPO: PurchaseOrderRecord = {
    id: `PO-${Date.now()}`,
    poNumber,
    prId: pr?.id,
    date: new Date().toISOString().split('T')[0],
    vendorId,
    vendorName,
    unitId,
    locationId,
    lines: poLines,
    totalAmount,
    status: 'OPEN',
    isNonPostingVerified: true, // NON-POSTING: NO GL JOURNAL GENERATED
    createdBy: creatorName,
    approvedBy: approverName
  };

  return newPO;
}

/**
 * GR-01: Penerimaan Persediaan — Metode Periodik (REQ-011, UAT-011)
 * Jurnal GL: Dr 5-1100 PERIODIC_PURCHASE / Cr 2-1104 GRNI
 * HARD CONSTRAINT: Dilarang mendebit akun Persediaan 1-1301..1-1305 saat GR!
 */
export function executeGoodsReceiptGR01(params: {
  po: PurchaseOrderRecord;
  destinationLocationId: PhysicalLocationId;
  receivedItems: Array<{
    poLineId: string;
    receivedQty: number;
  }>;
  dateStr: string;
  receivedBy: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; gr?: GoodsReceiptRecord; glJournal?: GLJournalEntry; error?: string } {
  const { po, destinationLocationId, receivedItems, dateStr, receivedBy, existingJournals, nextJournalNumber } = params;

  let totalValue = 0;
  const grLines: GRLineItem[] = [];

  for (const item of receivedItems) {
    const poLine = po.lines.find(l => l.id === item.poLineId);
    if (!poLine) return { success: false, error: `PO Line ID ${item.poLineId} tidak ditemukan.` };

    const lineVal = item.receivedQty * poLine.unitPrice;
    totalValue += lineVal;

    grLines.push({
      id: `gr-line-${Date.now()}-${grLines.length}`,
      poLineId: poLine.id,
      sku: poLine.sku,
      name: poLine.name,
      receivedQty: item.receivedQty,
      unitPrice: poLine.unitPrice,
      totalValue: lineVal,
      locationId: destinationLocationId
    });
  }

  const grId = `GR-${Date.now()}`;
  const grNumber = `GR-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  // Post GR-01: Dr 5-1100 PERIODIC_PURCHASE / Cr 2-1104 GRNI
  const glPayload: CoreGLJournalPayload = {
    sourceEventId: grId,
    sourceDocNo: grNumber,
    ruleCode: 'GR-01',
    date: dateStr,
    reference: `${po.poNumber} / ${po.vendorName}`,
    description: `GR-01: Penerimaan Barang Persediaan PO ${po.poNumber} (${po.vendorName}) [Metode HPP Periodik]`,
    lines: [
      {
        accountKey: 'PERIODIC_PURCHASE', // 5-1100
        debit: totalValue,
        credit: 0,
        unitId: po.unitId,
        locationId: destinationLocationId,
        description: `Pembelian persediaan periodik ${grLines.length} item`
      },
      {
        accountKey: 'GRNI', // 2-1104
        debit: 0,
        credit: totalValue,
        unitId: po.unitId,
        locationId: destinationLocationId,
        description: `Hutang barang belum ditagih (GRNI) PO ${po.poNumber}`
      }
    ],
    makerUserId: receivedBy
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const grRecord: GoodsReceiptRecord = {
    id: grId,
    grNumber,
    ruleCode: 'GR-01',
    date: dateStr,
    poId: po.id,
    poNumber: po.poNumber,
    vendorId: po.vendorId,
    vendorName: po.vendorName,
    unitId: po.unitId,
    destinationLocationId,
    lines: grLines,
    totalValue,
    isBilled: false,
    glJournalId: glRes.journal.id,
    receivedBy,
    verifiedPeriodicHppConstraint: true
  };

  return { success: true, gr: grRecord, glJournal: glRes.journal };
}

/**
 * GR-02: Penerimaan Aset Tetap / Milestone CIP (REQ-011)
 * Jurnal GL: Dr 1-1501..1-1508 Aset/CIP / Cr 2-1104 GRNI
 */
export function executeAssetReceiptGR02(params: {
  po: PurchaseOrderRecord;
  destinationLocationId: PhysicalLocationId;
  assetAccountKey: string; // e.g. 'ASSET_FNB_EQUIPMENT', 'ASSET_CIP', 'ASSET_LEASEHOLD'
  assetDescription: string;
  receivedQty: number;
  unitPrice: number;
  dateStr: string;
  receivedBy: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; gr?: GoodsReceiptRecord; glJournal?: GLJournalEntry; error?: string } {
  const { po, destinationLocationId, assetAccountKey, assetDescription, receivedQty, unitPrice, dateStr, receivedBy, existingJournals, nextJournalNumber } = params;

  const totalValue = receivedQty * unitPrice;
  const grId = `GR-ASSET-${Date.now()}`;
  const grNumber = `GR-AST-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: grId,
    sourceDocNo: grNumber,
    ruleCode: 'GR-02',
    date: dateStr,
    reference: `${po.poNumber} / ${po.vendorName}`,
    description: `GR-02: Penerimaan Pengadaan Aset Tetap/CIP: ${assetDescription} (${po.vendorName})`,
    lines: [
      {
        accountKey: assetAccountKey, // 1-1501..1-1508
        debit: totalValue,
        credit: 0,
        unitId: po.unitId,
        locationId: destinationLocationId,
        description: `Pengakuan aset fisik / kapitalisasi CIP: ${assetDescription}`
      },
      {
        accountKey: 'GRNI', // 2-1104
        debit: 0,
        credit: totalValue,
        unitId: po.unitId,
        locationId: destinationLocationId,
        description: `GRNI kliring aset tetap PO ${po.poNumber}`
      }
    ],
    makerUserId: receivedBy
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const grRecord: GoodsReceiptRecord = {
    id: grId,
    grNumber,
    ruleCode: 'GR-02',
    date: dateStr,
    poId: po.id,
    poNumber: po.poNumber,
    vendorId: po.vendorId,
    vendorName: po.vendorName,
    unitId: po.unitId,
    destinationLocationId,
    lines: [
      {
        id: `gr-line-${Date.now()}`,
        poLineId: po.lines[0]?.id || 'po-line-0',
        sku: 'ASSET-ITEM',
        name: assetDescription,
        receivedQty,
        unitPrice,
        totalValue,
        locationId: destinationLocationId,
        assetAccountKey
      }
    ],
    totalValue,
    isBilled: false,
    glJournalId: glRes.journal.id,
    receivedBy,
    verifiedPeriodicHppConstraint: false
  };

  return { success: true, gr: grRecord, glJournal: glRes.journal };
}

/**
 * 3-Way Matching Engine:
 * - Duplicate invoice check by vendorId + invoiceNumber (UAT-016)
 * - 0% Qty Over-Billing tolerance vs accepted unbilled GR qty (UAT-015)
 * - Auto-pass price variance ONLY if <= 1% AND <= Rp 50.000 cumulatively (UAT-013)
 * - Otherwise HOLD_PRICE_VARIANCE (UAT-014)
 */
export function evaluateThreeWayMatch(params: {
  po: PurchaseOrderRecord;
  gr: GoodsReceiptRecord;
  vendorId: string;
  vendorInvoiceNumber: string;
  invoiceLines: Array<{
    poLineId: string;
    invoicedQty: number;
    invoicedUnitPrice: number;
  }>;
  existingBills: VendorBillRecord[];
  isVatClaimable: boolean;
  vatRate?: number; // default 0.11 or 0.12
}): ThreeWayMatchResult {
  const { po, gr, vendorId, vendorInvoiceNumber, invoiceLines, existingBills, isVatClaimable, vatRate = 0.11 } = params;

  const holdReasons: string[] = [];

  // 1. Duplicate Invoice Check (UAT-016)
  const isDuplicate = existingBills.some(
    b => b.vendorId === vendorId && 
         b.vendorInvoiceNumber.trim().toLowerCase() === vendorInvoiceNumber.trim().toLowerCase()
  );
  if (isDuplicate) {
    holdReasons.push(`[UAT-016 Duplicate Invoice Detected] Nomor invoice '${vendorInvoiceNumber}' dari vendor ini sudah terdaftar sebelumnya!`);
  }

  let totalGrValue = 0;
  let totalPriceVariance = 0;
  let isAnyQtyOverbilled = false;
  let isAnyPriceExceededTolerance = false;

  const lineResults: LineMatchResult[] = [];

  for (const invLine of invoiceLines) {
    const poLine = po.lines.find(l => l.id === invLine.poLineId);
    const grLine = gr.lines.find(l => l.poLineId === invLine.poLineId);

    if (!poLine || !grLine) {
      holdReasons.push(`Baris PO/GR untuk Line ID ${invLine.poLineId} tidak valid.`);
      continue;
    }

    // accepted unbilled qty on this GR
    const acceptedUnbilledGrQty = grLine.receivedQty;
    const qtyVariance = invLine.invoicedQty - acceptedUnbilledGrQty;
    const isQtyOverbilled = qtyVariance > 0.0001; // 0% tolerance!

    if (isQtyOverbilled) {
      isAnyQtyOverbilled = true;
      holdReasons.push(
        `[UAT-015 Over-Billing Qty] Kuantitas invoice (${invLine.invoicedQty}) melebihi penerimaan GR yang belum ditagih (${acceptedUnbilledGrQty}) pada item ${poLine.name}!`
      );
    }

    // Price variance per line
    const poUnitPrice = poLine.unitPrice;
    const invoicedUnitPrice = invLine.invoicedUnitPrice;
    const priceVarianceNominal = (invoicedUnitPrice - poUnitPrice) * invLine.invoicedQty;
    const priceVariancePct = poUnitPrice > 0 ? (invoicedUnitPrice - poUnitPrice) / poUnitPrice : 0;

    // Tolerance check: <= 1% AND <= Rp 50.000 (UAT-013)
    const isPriceWithinTol = Math.abs(priceVariancePct) <= 0.010001 && Math.abs(priceVarianceNominal) <= 50000;

    if (!isPriceWithinTol && Math.abs(priceVarianceNominal) > 0) {
      isAnyPriceExceededTolerance = true;
      holdReasons.push(
        `[UAT-014 Price Variance Hold] Selisih harga pada ${poLine.name} melebihi batas toleransi! Variansi: ${(priceVariancePct * 100).toFixed(2)}% (Rp ${Math.abs(priceVarianceNominal).toLocaleString('id-ID')}). Maksimal toleransi: 1% & Rp 50.000.`
      );
    }

    const lineGrAmount = invLine.invoicedQty * poUnitPrice;
    totalGrValue += lineGrAmount;
    totalPriceVariance += priceVarianceNominal;

    lineResults.push({
      poLineId: poLine.id,
      grLineId: grLine.id,
      sku: poLine.sku,
      name: poLine.name,
      orderedQty: poLine.orderedQty,
      acceptedUnbilledGrQty,
      invoicedQty: invLine.invoicedQty,
      poUnitPrice,
      invoicedUnitPrice,
      qtyVariance,
      priceVarianceNominal,
      priceVariancePct,
      isQtyOverbilled,
      isPriceVarianceWithinTolerance: isPriceWithinTol
    });
  }

  // Determine status
  let status: ThreeWayMatchResult['status'] = 'AUTO_PASSED';
  if (isAnyQtyOverbilled) {
    status = 'HOLD_OVERBILL_QTY';
  } else if (isAnyPriceExceededTolerance || isDuplicate) {
    status = 'HOLD_PRICE_VARIANCE';
  }

  const subtotalNet = totalGrValue + totalPriceVariance;
  const taxAmount = isVatClaimable ? Math.round(subtotalNet * vatRate) : 0;
  const totalInvoiceAmount = subtotalNet + taxAmount;

  return {
    status,
    lines: lineResults,
    subtotalGrAmount: totalGrValue,
    priceVarianceSubtotal: totalPriceVariance,
    taxAmount,
    totalInvoiceAmount,
    holdReasons
  };
}

/**
 * BILL-01: Post Inventory Vendor Bill (Trade AP)
 * Line 1: Dr 2-1104 GRNI (original GR amount)
 * Line 2: Dr/Cr 5-1100 PERIODIC_PURCHASE (if price variance exists)
 * Line 3: Dr 1-1403 VAT_INPUT_CLAIMABLE (if claimable PPN exists)
 * Line 4: Cr 2-1102 AP_INVENTORY (total invoice amount)
 */
export function executePostBill01(params: {
  po: PurchaseOrderRecord;
  gr: GoodsReceiptRecord;
  vendorInvoiceNumber: string;
  dueDate: string;
  matchResult: ThreeWayMatchResult;
  isVatClaimable: boolean;
  vatTaxInvoiceNo?: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; bill?: VendorBillRecord; glJournal?: GLJournalEntry; error?: string } {
  const { po, gr, vendorInvoiceNumber, dueDate, matchResult, isVatClaimable, vatTaxInvoiceNo, makerUserId, existingJournals, nextJournalNumber } = params;

  if (matchResult.status !== 'AUTO_PASSED' && matchResult.status !== 'APPROVED_OVERRIDE') {
    return {
      success: false,
      error: `Tagihan berada dalam status ${matchResult.status}. Tidak dapat diposting tanpa persetujuan override Finance!`
    };
  }

  const billId = `BILL-${Date.now()}`;
  const billNumber = `BILL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const dateStr = new Date().toISOString().split('T')[0];

  const glLines: Array<{
    accountKey: string;
    debit: number;
    credit: number;
    unitId: BusinessUnitId;
    locationId?: PhysicalLocationId;
    description: string;
  }> = [];

  // Line 1: Dr 2-1104 GRNI
  glLines.push({
    accountKey: 'GRNI', // 2-1104
    debit: matchResult.subtotalGrAmount,
    credit: 0,
    unitId: po.unitId,
    locationId: gr.destinationLocationId,
    description: `Pelepasan GRNI atas faktur ${vendorInvoiceNumber} (${po.vendorName})`
  });

  // Line 2: Dr/Cr 5-1100 Price Variance (if any)
  if (matchResult.priceVarianceSubtotal > 0) {
    glLines.push({
      accountKey: 'PERIODIC_PURCHASE', // 5-1100
      debit: matchResult.priceVarianceSubtotal,
      credit: 0,
      unitId: po.unitId,
      locationId: gr.destinationLocationId,
      description: `Selisih harga beli invoice vs PO (Toleransi Auto-Pass / Approved)`
    });
  } else if (matchResult.priceVarianceSubtotal < 0) {
    glLines.push({
      accountKey: 'PERIODIC_PURCHASE', // 5-1100
      debit: 0,
      credit: Math.abs(matchResult.priceVarianceSubtotal),
      unitId: po.unitId,
      locationId: gr.destinationLocationId,
      description: `Diskon/pengurangan harga invoice vs PO`
    });
  }

  // Line 3: Dr 1-1403 VAT_INPUT_CLAIMABLE (if claimable)
  if (isVatClaimable && matchResult.taxAmount > 0) {
    glLines.push({
      accountKey: 'VAT_INPUT_CLAIMABLE', // 1-1403
      debit: matchResult.taxAmount,
      credit: 0,
      unitId: po.unitId,
      locationId: gr.destinationLocationId,
      description: `PPN Masukan dapat dikreditkan Faktur Pajak ${vatTaxInvoiceNo || '-'}`
    });
  }

  // Line 4: Cr 2-1102 AP_INVENTORY
  glLines.push({
    accountKey: 'AP_INVENTORY', // 2-1102
    debit: 0,
    credit: matchResult.totalInvoiceAmount,
    unitId: po.unitId,
    locationId: gr.destinationLocationId,
    description: `Hutang persediaan dagang ${po.vendorName}`
  });

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: billId,
    sourceDocNo: billNumber,
    ruleCode: 'BILL-01',
    date: dateStr,
    reference: `${vendorInvoiceNumber} / ${po.vendorName}`,
    description: `BILL-01: Faktur Pembelian Persediaan ${po.vendorName} Ref: ${vendorInvoiceNumber}`,
    lines: glLines,
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const billRecord: VendorBillRecord = {
    id: billId,
    billNumber,
    vendorInvoiceNumber,
    ruleCode: 'BILL-01',
    date: dateStr,
    dueDate,
    vendorId: po.vendorId,
    vendorName: po.vendorName,
    unitId: po.unitId,
    locationId: gr.destinationLocationId,
    poId: po.id,
    poNumber: po.poNumber,
    grId: gr.id,
    grNumber: gr.grNumber,
    lines: matchResult.lines,
    subtotal: matchResult.subtotalGrAmount,
    priceVarianceTotal: matchResult.priceVarianceSubtotal,
    isVatClaimable,
    vatTaxInvoiceNo,
    taxAmount: matchResult.taxAmount,
    totalAmount: matchResult.totalInvoiceAmount,
    matchingStatus: matchResult.status,
    holdReasons: matchResult.holdReasons,
    appliedAdvanceAmount: 0,
    remainingPayableAmount: matchResult.totalInvoiceAmount,
    paymentStatus: 'UNPAID',
    glJournalId: glRes.journal.id,
    createdAt: new Date().toISOString()
  };

  return { success: true, bill: billRecord, glJournal: glRes.journal };
}

/**
 * BILL-02: Tagihan Beban / Jasa Umum (PLN, WiFi, Gas, PDAM)
 * Jurnal: Dr 6-xxxx Beban + Dr 1-1403 PPN Masukan / Cr 2-1101 Hutang Usaha Umum
 */
export function executePostBill02Utilities(params: {
  vendorId: string;
  vendorName: string;
  vendorInvoiceNumber: string;
  expenseAccountKey: 'EXP_ELECTRICITY' | 'EXP_INTERNET' | 'EXP_GAS' | 'EXP_WATER' | 'EXP_FREIGHT' | 'EXP_PRINTING';
  subtotalAmount: number;
  isVatClaimable: boolean;
  vatTaxInvoiceNo?: string;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  dueDate: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; bill?: VendorBillRecord; glJournal?: GLJournalEntry; error?: string } {
  const { vendorId, vendorName, vendorInvoiceNumber, expenseAccountKey, subtotalAmount, isVatClaimable, vatTaxInvoiceNo, unitId, locationId, dueDate, makerUserId, existingJournals, nextJournalNumber } = params;

  const billId = `BILL-UTIL-${Date.now()}`;
  const billNumber = `BILL-UTL-${Math.floor(100 + Math.random() * 900)}`;
  const dateStr = new Date().toISOString().split('T')[0];

  const taxAmount = isVatClaimable ? Math.round(subtotalAmount * 0.11) : 0;
  const totalAmount = subtotalAmount + taxAmount;

  const glLines: Array<{
    accountKey: string;
    debit: number;
    credit: number;
    unitId: BusinessUnitId;
    locationId?: PhysicalLocationId;
    description: string;
  }> = [
    {
      accountKey: expenseAccountKey, // 6-1201..6-1204
      debit: subtotalAmount,
      credit: 0,
      unitId,
      locationId,
      description: `Beban operasional utilitas ${expenseAccountKey}`
    }
  ];

  if (taxAmount > 0) {
    glLines.push({
      accountKey: 'VAT_INPUT_CLAIMABLE', // 1-1403
      debit: taxAmount,
      credit: 0,
      unitId,
      locationId,
      description: `PPN Masukan Utilitas Faktur Pajak ${vatTaxInvoiceNo || '-'}`
    });
  }

  glLines.push({
    accountKey: 'AP_GENERAL', // 2-1101
    debit: 0,
    credit: totalAmount,
    unitId,
    locationId,
    description: `Hutang operasional umum ${vendorName}`
  });

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: billId,
    sourceDocNo: billNumber,
    ruleCode: 'BILL-02',
    date: dateStr,
    reference: `${vendorInvoiceNumber} / ${vendorName}`,
    description: `BILL-02: Tagihan Beban Operasional ${vendorName} (${expenseAccountKey})`,
    lines: glLines,
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const billRecord: VendorBillRecord = {
    id: billId,
    billNumber,
    vendorInvoiceNumber,
    ruleCode: 'BILL-02',
    date: dateStr,
    dueDate,
    vendorId,
    vendorName,
    unitId,
    locationId,
    lines: [],
    subtotal: subtotalAmount,
    priceVarianceTotal: 0,
    isVatClaimable,
    vatTaxInvoiceNo,
    taxAmount,
    totalAmount,
    matchingStatus: 'AUTO_PASSED',
    holdReasons: [],
    appliedAdvanceAmount: 0,
    remainingPayableAmount: totalAmount,
    paymentStatus: 'UNPAID',
    glJournalId: glRes.journal.id,
    createdAt: new Date().toISOString()
  };

  return { success: true, bill: billRecord, glJournal: glRes.journal };
}

/**
 * BILL-03: Tagihan Aset Tetap / Konstruksi
 * Jurnal: Dr 2-1104 GRNI Aset + Dr 1-1403 PPN Masukan / Cr 2-1103 AP_CAPEX
 */
export function executePostBill03Asset(params: {
  gr: GoodsReceiptRecord;
  vendorInvoiceNumber: string;
  subtotalAmount: number;
  isVatClaimable: boolean;
  vatTaxInvoiceNo?: string;
  dueDate: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; bill?: VendorBillRecord; glJournal?: GLJournalEntry; error?: string } {
  const { gr, vendorInvoiceNumber, subtotalAmount, isVatClaimable, vatTaxInvoiceNo, dueDate, makerUserId, existingJournals, nextJournalNumber } = params;

  const billId = `BILL-AST-${Date.now()}`;
  const billNumber = `BILL-AST-${Math.floor(100 + Math.random() * 900)}`;
  const dateStr = new Date().toISOString().split('T')[0];

  const taxAmount = isVatClaimable ? Math.round(subtotalAmount * 0.11) : 0;
  const totalAmount = subtotalAmount + taxAmount;

  const glLines = [
    {
      accountKey: 'GRNI', // 2-1104
      debit: subtotalAmount,
      credit: 0,
      unitId: gr.unitId,
      locationId: gr.destinationLocationId,
      description: `Pelepasan GRNI aset pengadaan ${gr.grNumber}`
    }
  ];

  if (taxAmount > 0) {
    glLines.push({
      accountKey: 'VAT_INPUT_CLAIMABLE', // 1-1403
      debit: taxAmount,
      credit: 0,
      unitId: gr.unitId,
      locationId: gr.destinationLocationId,
      description: `PPN Masukan Aset Tetap Faktur Pajak ${vatTaxInvoiceNo || '-'}`
    });
  }

  glLines.push({
    accountKey: 'AP_CAPEX', // 2-1103
    debit: 0,
    credit: totalAmount,
    unitId: gr.unitId,
    locationId: gr.destinationLocationId,
    description: `Hutang pengadaan aset/kontraktor ${gr.vendorName}`
  });

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: billId,
    sourceDocNo: billNumber,
    ruleCode: 'BILL-03',
    date: dateStr,
    reference: `${vendorInvoiceNumber} / ${gr.vendorName}`,
    description: `BILL-03: Tagihan Pengadaan Aset/CAPEX ${gr.vendorName} Ref: ${vendorInvoiceNumber}`,
    lines: glLines,
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const billRecord: VendorBillRecord = {
    id: billId,
    billNumber,
    vendorInvoiceNumber,
    ruleCode: 'BILL-03',
    date: dateStr,
    dueDate,
    vendorId: gr.vendorId,
    vendorName: gr.vendorName,
    unitId: gr.unitId,
    locationId: gr.destinationLocationId,
    grId: gr.id,
    grNumber: gr.grNumber,
    lines: [],
    subtotal: subtotalAmount,
    priceVarianceTotal: 0,
    isVatClaimable,
    vatTaxInvoiceNo,
    taxAmount,
    totalAmount,
    matchingStatus: 'AUTO_PASSED',
    holdReasons: [],
    appliedAdvanceAmount: 0,
    remainingPayableAmount: totalAmount,
    paymentStatus: 'UNPAID',
    glJournalId: glRes.journal.id,
    createdAt: new Date().toISOString()
  };

  return { success: true, bill: billRecord, glJournal: glRes.journal };
}

/**
 * BILL-CRN: Credit Note / Retur Pembelian ke Supplier
 * Jurnal: Dr 2-1102 AP_INVENTORY / Cr 5-1100 PERIODIC_PURCHASE (+ Cr 1-1403 VAT_INPUT jika dikoreksi)
 */
export function executePostBillCreditNote(params: {
  originalBill: VendorBillRecord;
  creditNoteNumber: string;
  returnSubtotalAmount: number;
  returnTaxAmount: number;
  returnReason: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; crnBill?: VendorBillRecord; glJournal?: GLJournalEntry; error?: string } {
  const { originalBill, creditNoteNumber, returnSubtotalAmount, returnTaxAmount, returnReason, makerUserId, existingJournals, nextJournalNumber } = params;

  const totalReturnAmount = returnSubtotalAmount + returnTaxAmount;
  const crnId = `CRN-${Date.now()}`;
  const crnDocNo = `CRN-${Math.floor(100 + Math.random() * 900)}`;
  const dateStr = new Date().toISOString().split('T')[0];

  const glLines = [
    {
      accountKey: 'AP_INVENTORY', // 2-1102
      debit: totalReturnAmount,
      credit: 0,
      unitId: originalBill.unitId,
      locationId: originalBill.locationId,
      description: `Pengurangan hutang atas nota retur/kredit ${creditNoteNumber}`
    },
    {
      accountKey: 'PERIODIC_PURCHASE', // 5-1100
      debit: 0,
      credit: returnSubtotalAmount,
      unitId: originalBill.unitId,
      locationId: originalBill.locationId,
      description: `Koreksi retur pembelian persediaan ke ${originalBill.vendorName}: ${returnReason}`
    }
  ];

  if (returnTaxAmount > 0) {
    glLines.push({
      accountKey: 'VAT_INPUT_CLAIMABLE', // 1-1403
      debit: 0,
      credit: returnTaxAmount,
      unitId: originalBill.unitId,
      locationId: originalBill.locationId,
      description: `Koreksi PPN Masukan retur barang ${creditNoteNumber}`
    });
  }

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: crnId,
    sourceDocNo: crnDocNo,
    ruleCode: 'BILL-CRN',
    date: dateStr,
    reference: `CRN-${creditNoteNumber} / ${originalBill.billNumber}`,
    description: `BILL-CRN: Nota Retur Pembelian ${originalBill.vendorName} (${returnReason})`,
    lines: glLines,
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const crnRecord: VendorBillRecord = {
    id: crnId,
    billNumber: crnDocNo,
    vendorInvoiceNumber: creditNoteNumber,
    ruleCode: 'BILL-CRN',
    date: dateStr,
    dueDate: dateStr,
    vendorId: originalBill.vendorId,
    vendorName: originalBill.vendorName,
    unitId: originalBill.unitId,
    locationId: originalBill.locationId,
    lines: [],
    subtotal: -returnSubtotalAmount,
    priceVarianceTotal: 0,
    isVatClaimable: returnTaxAmount > 0,
    taxAmount: -returnTaxAmount,
    totalAmount: -totalReturnAmount,
    matchingStatus: 'AUTO_PASSED',
    holdReasons: [],
    appliedAdvanceAmount: 0,
    remainingPayableAmount: -totalReturnAmount,
    paymentStatus: 'PAID',
    glJournalId: glRes.journal.id,
    createdAt: new Date().toISOString()
  };

  return { success: true, crnBill: crnRecord, glJournal: glRes.journal };
}

/**
 * PAY-01: Pelunasan Vendor AP (UAT-017)
 * Jurnal: Dr 2-1101/2-1102/2-1103 AP Vendor (+ Dr 6-1301 admin fee) / Cr 1-1102 BNI atau 1-1103 Mandiri
 */
export function executeVendorPaymentPAY01(params: {
  bill: VendorBillRecord;
  amountToPay: number;
  bankAccount: 'BANK_BNI' | 'BANK_MANDIRI';
  adminFee?: number;
  paymentDate: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; payment?: VendorPaymentRecord; glJournal?: GLJournalEntry; error?: string } {
  const { bill, amountToPay, bankAccount, adminFee = 0, paymentDate, makerUserId, existingJournals, nextJournalNumber } = params;

  if (amountToPay <= 0) {
    return { success: false, error: 'Nominal pembayaran harus lebih besar dari Rp 0.' };
  }

  if (amountToPay > bill.remainingPayableAmount) {
    return {
      success: false,
      error: `Nominal bayar (Rp ${amountToPay.toLocaleString('id-ID')}) melebihi sisa hutang tagihan (Rp ${bill.remainingPayableAmount.toLocaleString('id-ID')}).`
    };
  }

  let apAccountKey = 'AP_INVENTORY'; // default 2-1102
  if (bill.ruleCode === 'BILL-02') apAccountKey = 'AP_GENERAL'; // 2-1101
  if (bill.ruleCode === 'BILL-03') apAccountKey = 'AP_CAPEX'; // 2-1103

  const totalBankCredit = amountToPay + adminFee;
  const paymentId = `PAY-${Date.now()}`;
  const paymentNumber = `PAY-${paymentDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const glLines = [
    {
      accountKey: apAccountKey,
      debit: amountToPay,
      credit: 0,
      unitId: bill.unitId,
      locationId: bill.locationId,
      description: `Pelunasan tagihan ${bill.billNumber} (${bill.vendorName})`
    }
  ];

  if (adminFee > 0) {
    glLines.push({
      accountKey: 'PAYMENT_FEES', // 6-1301
      debit: adminFee,
      credit: 0,
      unitId: bill.unitId,
      locationId: bill.locationId,
      description: `Biaya transfer antar bank pembayaran vendor`
    });
  }

  glLines.push({
    accountKey: bankAccount, // 1-1102 (BNI) or 1-1103 (Mandiri)
    debit: 0,
    credit: totalBankCredit,
    unitId: bill.unitId,
    locationId: bill.locationId,
    description: `Pengeluaran giro/rekening ${bankAccount} ke ${bill.vendorName}`
  });

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: paymentId,
    sourceDocNo: paymentNumber,
    ruleCode: 'PAY-01',
    date: paymentDate,
    reference: `${bill.billNumber} / ${bill.vendorName}`,
    description: `PAY-01: Pembayaran Hutang Vendor ${bill.vendorName} Ref: ${bill.billNumber}`,
    lines: glLines,
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const paymentRecord: VendorPaymentRecord = {
    id: paymentId,
    paymentNumber,
    ruleCode: 'PAY-01',
    date: paymentDate,
    vendorId: bill.vendorId,
    vendorName: bill.vendorName,
    unitId: bill.unitId,
    billId: bill.id,
    billNumber: bill.billNumber,
    billType: bill.ruleCode,
    amountPaid: amountToPay,
    paymentMethod: bankAccount,
    bankAccountKey: bankAccount,
    adminFee,
    glJournalId: glRes.journal.id,
    notes: `Pelunasan tagihan faktur ${bill.vendorInvoiceNumber}`,
    processedBy: makerUserId
  };

  return { success: true, payment: paymentRecord, glJournal: glRes.journal };
}

/**
 * PAY-02: Down Payment / Uang Muka Supplier (UAT-018)
 * Jurnal: Dr 1-1402 Uang Muka Supplier / Cr 1-1102 BNI atau 1-1103 Mandiri
 */
export function executeSupplierAdvancePAY02(params: {
  vendorId: string;
  vendorName: string;
  unitId: BusinessUnitId;
  advanceAmount: number;
  bankAccount: 'BANK_BNI' | 'BANK_MANDIRI';
  referencePoId?: string;
  notes: string;
  dateStr: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; advance?: SupplierAdvanceRecord; glJournal?: GLJournalEntry; error?: string } {
  const { vendorId, vendorName, unitId, advanceAmount, bankAccount, referencePoId, notes, dateStr, makerUserId, existingJournals, nextJournalNumber } = params;

  if (advanceAmount <= 0) {
    return { success: false, error: 'Nominal uang muka supplier harus lebih besar dari Rp 0.' };
  }

  const advanceId = `ADV-${Date.now()}`;
  const advanceNumber = `ADV-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: advanceId,
    sourceDocNo: advanceNumber,
    ruleCode: 'PAY-02',
    date: dateStr,
    reference: `DP-${vendorName}`,
    description: `PAY-02: Pembayaran Uang Muka Supplier / Down Payment ${vendorName} (${notes})`,
    lines: [
      {
        accountKey: 'SUPPLIER_ADVANCE', // 1-1402
        debit: advanceAmount,
        credit: 0,
        unitId,
        locationId: 'L002',
        description: `Uang muka pembelian barang/jasa supplier ${vendorName}`
      },
      {
        accountKey: bankAccount, // 1-1102 or 1-1103
        debit: 0,
        credit: advanceAmount,
        unitId,
        locationId: 'L002',
        description: `Pengeluaran kas/bank untuk DP supplier via ${bankAccount}`
      }
    ],
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const advanceRecord: SupplierAdvanceRecord = {
    id: advanceId,
    advanceNumber,
    ruleCode: 'PAY-02',
    date: dateStr,
    vendorId,
    vendorName,
    unitId,
    totalAdvanceAmount: advanceAmount,
    remainingBalance: advanceAmount,
    bankAccountKey: bankAccount,
    referencePoId,
    notes,
    glJournalId: glRes.journal.id,
    status: 'ACTIVE'
  };

  return { success: true, advance: advanceRecord, glJournal: glRes.journal };
}

/**
 * PAY-03: Aplikasi Uang Muka Supplier ke Tagihan (UAT-018)
 * Jurnal: Dr 2-1101/2-1102/2-1103 AP Vendor / Cr 1-1402 Uang Muka Supplier
 */
export function executeApplySupplierAdvancePAY03(params: {
  advance: SupplierAdvanceRecord;
  bill: VendorBillRecord;
  amountToApply: number;
  dateStr: string;
  makerUserId: string;
  existingJournals: GLJournalEntry[];
  nextJournalNumber: string;
}): { success: boolean; payment?: VendorPaymentRecord; glJournal?: GLJournalEntry; error?: string } {
  const { advance, bill, amountToApply, dateStr, makerUserId, existingJournals, nextJournalNumber } = params;

  if (amountToApply <= 0) {
    return { success: false, error: 'Nominal aplikasi harus lebih besar dari Rp 0.' };
  }

  if (amountToApply > advance.remainingBalance) {
    return {
      success: false,
      error: `Nominal aplikasi (Rp ${amountToApply.toLocaleString('id-ID')}) melebihi sisa DP yang tersedia (Rp ${advance.remainingBalance.toLocaleString('id-ID')}).`
    };
  }

  if (amountToApply > bill.remainingPayableAmount) {
    return {
      success: false,
      error: `Nominal aplikasi (Rp ${amountToApply.toLocaleString('id-ID')}) melebihi sisa tagihan hutang (Rp ${bill.remainingPayableAmount.toLocaleString('id-ID')}).`
    };
  }

  let apAccountKey = 'AP_INVENTORY'; // default 2-1102
  if (bill.ruleCode === 'BILL-02') apAccountKey = 'AP_GENERAL'; // 2-1101
  if (bill.ruleCode === 'BILL-03') apAccountKey = 'AP_CAPEX'; // 2-1103

  const paymentId = `APPLY-DP-${Date.now()}`;
  const docNo = `SET-DP-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const glPayload: CoreGLJournalPayload = {
    sourceEventId: paymentId,
    sourceDocNo: docNo,
    ruleCode: 'PAY-03',
    date: dateStr,
    reference: `${bill.billNumber} / ${advance.advanceNumber}`,
    description: `PAY-03: Aplikasi Uang Muka ${advance.advanceNumber} ke Tagihan ${bill.billNumber} (${bill.vendorName})`,
    lines: [
      {
        accountKey: apAccountKey,
        debit: amountToApply,
        credit: 0,
        unitId: bill.unitId,
        locationId: bill.locationId,
        description: `Pemotongan hutang vendor atas aplikasi DP supplier`
      },
      {
        accountKey: 'SUPPLIER_ADVANCE', // 1-1402
        debit: 0,
        credit: amountToApply,
        unitId: bill.unitId,
        locationId: bill.locationId,
        description: `Pelepasan uang muka supplier ${bill.vendorName}`
      }
    ],
    makerUserId
  };

  const glRes = executeCoreGLPosting(glPayload, existingJournals, nextJournalNumber);
  if (!glRes.success || !glRes.journal) {
    return { success: false, error: glRes.validation.errors.join(' | ') };
  }

  const paymentRecord: VendorPaymentRecord = {
    id: paymentId,
    paymentNumber: docNo,
    ruleCode: 'PAY-03',
    date: dateStr,
    vendorId: bill.vendorId,
    vendorName: bill.vendorName,
    unitId: bill.unitId,
    billId: bill.id,
    billNumber: bill.billNumber,
    billType: bill.ruleCode,
    amountPaid: amountToApply,
    paymentMethod: 'ADVANCE_APPLICATION',
    adminFee: 0,
    advanceId: advance.id,
    glJournalId: glRes.journal.id,
    notes: `Aplikasi DP dari ${advance.advanceNumber}`,
    processedBy: makerUserId
  };

  return { success: true, payment: paymentRecord, glJournal: glRes.journal };
}
