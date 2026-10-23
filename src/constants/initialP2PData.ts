/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 3 Initial Seed Data: PR, PO, GR (Periodic & Asset), 3-Way Match Bills, and Payments.
 */

import { 
  PurchaseRequest, 
  PurchaseOrderRecord, 
  GoodsReceiptRecord, 
  VendorBillRecord, 
  SupplierAdvanceRecord, 
  VendorPaymentRecord 
} from '../types/purchasingAndP2P';

export const INITIAL_P2P_PRS: PurchaseRequest[] = [
  {
    id: 'PR-2026-09-001',
    prNumber: 'PR-2026-09-001',
    date: '2026-09-01',
    requesterName: 'Andi Saputra',
    department: 'Bar & Beverage',
    unitId: 'U002',
    targetLocationId: 'L003',
    notes: 'Restock biji kopi house blend untuk Bar JB',
    lines: [
      {
        id: 'pr-line-1',
        itemDescription: 'Biji Kopi Arabika House Blend 1kg',
        sku: 'INV-COFFEE-01',
        category: 'INVENTORY',
        estimatedQty: 30,
        estimatedUnitPrice: 120000,
        totalEstimated: 3600000,
        unitId: 'U002',
        locationId: 'L003'
      }
    ],
    totalAmount: 3600000,
    status: 'CONVERTED_TO_PO',
    requiredApprovalTier: 'TIER_1_SPV',
    approvedBy: 'Head Barista JB',
    approvedAt: '2026-09-01T10:00:00Z',
    isSplittingSuspected: false,
    poId: 'PO-2026-09-001'
  },
  {
    id: 'PR-2026-09-002',
    prNumber: 'PR-2026-09-002',
    date: '2026-09-02',
    requesterName: 'Chef Dimas',
    department: 'Kitchen Salatiga',
    unitId: 'U002',
    targetLocationId: 'L004',
    notes: 'Pengadaan bahan daging sirloin Batch 1',
    lines: [
      {
        id: 'pr-line-2',
        itemDescription: 'Wagyu Striploin MB5 Frozen 1kg',
        sku: 'INV-RESTO-01',
        category: 'INVENTORY',
        estimatedQty: 20,
        estimatedUnitPrice: 235000,
        totalEstimated: 4700000,
        unitId: 'U002',
        locationId: 'L004'
      }
    ],
    totalAmount: 4700000,
    status: 'SUBMITTED',
    requiredApprovalTier: 'TIER_1_SPV',
    isSplittingSuspected: true,
    splittingAlertDetails: '[ANTI-SPLITTING ALERT]: Terdeteksi 2 PR bernilai Rp 4.700.000 dan Rp 4.900.000 dalam 24 jam untuk Kitchen Salatiga. Potensi pemecahan transaksi untuk menghindari otorisasi Tier 2 (> Rp 5.000.000)!'
  },
  {
    id: 'PR-2026-09-003',
    prNumber: 'PR-2026-09-003',
    date: '2026-09-02',
    requesterName: 'Chef Dimas',
    department: 'Kitchen Salatiga',
    unitId: 'U002',
    targetLocationId: 'L004',
    notes: 'Pengadaan bahan salmon & seafood Batch 2',
    lines: [
      {
        id: 'pr-line-3',
        itemDescription: 'Norwegian Fresh Salmon Whole 10kg',
        sku: 'INV-RESTO-02',
        category: 'INVENTORY',
        estimatedQty: 2,
        estimatedUnitPrice: 2450000,
        totalEstimated: 4900000,
        unitId: 'U002',
        locationId: 'L004'
      }
    ],
    totalAmount: 4900000,
    status: 'SUBMITTED',
    requiredApprovalTier: 'TIER_1_SPV',
    isSplittingSuspected: true,
    splittingAlertDetails: '[ANTI-SPLITTING ALERT]: Terdeteksi 2 PR bernilai Rp 4.700.000 dan Rp 4.900.000 dalam 24 jam untuk Kitchen Salatiga. Total kumulatif Rp 9.600.000 mewajibkan otorisasi Tier 2.'
  }
];

export const INITIAL_P2P_POS: PurchaseOrderRecord[] = [
  {
    id: 'PO-2026-09-001',
    poNumber: 'PO-2026-09-001',
    prId: 'PR-2026-09-001',
    date: '2026-09-02',
    vendorId: 'VEND-ROASTERY-01',
    vendorName: 'CV Salatiga Coffee Roastery',
    unitId: 'U002',
    locationId: 'L002',
    lines: [
      {
        id: 'po-line-1',
        sku: 'INV-COFFEE-01',
        name: 'Biji Kopi Arabika House Blend 1kg',
        category: 'INVENTORY',
        orderedQty: 50,
        receivedQty: 50,
        billedQty: 50,
        unitPrice: 120000,
        totalPrice: 6000000,
        unitId: 'U002',
        locationId: 'L002'
      }
    ],
    totalAmount: 6000000,
    status: 'INVOICED',
    isNonPostingVerified: true,
    createdBy: 'Purchasing Staff',
    approvedBy: 'Operations Manager'
  },
  {
    id: 'PO-2026-09-002',
    poNumber: 'PO-2026-09-002',
    date: '2026-09-03',
    vendorId: 'VEND-DAIRY-01',
    vendorName: 'PT Greenfields Dairy Indonesia',
    unitId: 'U002',
    locationId: 'L004',
    lines: [
      {
        id: 'po-line-2',
        sku: 'INV-MILK-01',
        name: 'Fresh Milk Pasteurized 1 Liter',
        category: 'INVENTORY',
        orderedQty: 100,
        receivedQty: 100,
        billedQty: 0,
        unitPrice: 22000,
        totalPrice: 2200000,
        unitId: 'U002',
        locationId: 'L004'
      }
    ],
    totalAmount: 2200000,
    status: 'RECEIVED',
    isNonPostingVerified: true,
    createdBy: 'Purchasing Staff',
    approvedBy: 'Operations Manager'
  },
  {
    id: 'PO-2026-09-003',
    poNumber: 'PO-2026-09-003',
    date: '2026-09-04',
    vendorId: 'VEND-SANREMO-01',
    vendorName: 'PT Espresso Prima Italia',
    unitId: 'U002',
    locationId: 'L003',
    lines: [
      {
        id: 'po-line-3',
        sku: 'ASSET-ESPRESSO',
        name: 'Commercial Espresso Machine Sanremo Cafe Racer 3-Group',
        category: 'CAPEX_ASSET',
        assetAccountKey: 'ASSET_FNB_EQUIPMENT', // 1-1504
        orderedQty: 1,
        receivedQty: 1,
        billedQty: 0,
        unitPrice: 85000000,
        totalPrice: 85000000,
        unitId: 'U002',
        locationId: 'L003'
      }
    ],
    totalAmount: 85000000,
    status: 'RECEIVED',
    isNonPostingVerified: true,
    createdBy: 'Finance Controller',
    approvedBy: 'Managing Director'
  }
];

export const INITIAL_P2P_GRS: GoodsReceiptRecord[] = [
  {
    id: 'GR-2026-09-001',
    grNumber: 'GR-2026-09-001',
    ruleCode: 'GR-01',
    date: '2026-09-03',
    poId: 'PO-2026-09-001',
    poNumber: 'PO-2026-09-001',
    vendorId: 'VEND-ROASTERY-01',
    vendorName: 'CV Salatiga Coffee Roastery',
    unitId: 'U002',
    destinationLocationId: 'L002',
    lines: [
      {
        id: 'gr-line-1',
        poLineId: 'po-line-1',
        sku: 'INV-COFFEE-01',
        name: 'Biji Kopi Arabika House Blend 1kg',
        receivedQty: 50,
        unitPrice: 120000,
        totalValue: 6000000,
        locationId: 'L002'
      }
    ],
    totalValue: 6000000,
    isBilled: true,
    glJournalId: 'JV-2026-09-0030',
    receivedBy: 'Warehouse Staff L002',
    verifiedPeriodicHppConstraint: true
  },
  {
    id: 'GR-2026-09-002',
    grNumber: 'GR-2026-09-002',
    ruleCode: 'GR-01',
    date: '2026-09-04',
    poId: 'PO-2026-09-002',
    poNumber: 'PO-2026-09-002',
    vendorId: 'VEND-DAIRY-01',
    vendorName: 'PT Greenfields Dairy Indonesia',
    unitId: 'U002',
    destinationLocationId: 'L004',
    lines: [
      {
        id: 'gr-line-2',
        poLineId: 'po-line-2',
        sku: 'INV-MILK-01',
        name: 'Fresh Milk Pasteurized 1 Liter',
        receivedQty: 100,
        unitPrice: 22000,
        totalValue: 2200000,
        locationId: 'L004'
      }
    ],
    totalValue: 2200000,
    isBilled: false,
    glJournalId: 'JV-2026-09-0031',
    receivedBy: 'Kitchen Salatiga Staff',
    verifiedPeriodicHppConstraint: true
  },
  {
    id: 'GR-2026-09-003',
    grNumber: 'GR-AST-2026-09-003',
    ruleCode: 'GR-02',
    date: '2026-09-05',
    poId: 'PO-2026-09-003',
    poNumber: 'PO-2026-09-003',
    vendorId: 'VEND-SANREMO-01',
    vendorName: 'PT Espresso Prima Italia',
    unitId: 'U002',
    destinationLocationId: 'L003',
    lines: [
      {
        id: 'gr-line-3',
        poLineId: 'po-line-3',
        sku: 'ASSET-ESPRESSO',
        name: 'Commercial Espresso Machine Sanremo Cafe Racer 3-Group',
        receivedQty: 1,
        unitPrice: 85000000,
        totalValue: 85000000,
        locationId: 'L003',
        assetAccountKey: 'ASSET_FNB_EQUIPMENT' // 1-1504
      }
    ],
    totalValue: 85000000,
    isBilled: false,
    glJournalId: 'JV-2026-09-0032',
    receivedBy: 'Head Barista JB',
    verifiedPeriodicHppConstraint: false
  }
];

export const INITIAL_P2P_BILLS: VendorBillRecord[] = [
  {
    id: 'BILL-2026-09-001',
    billNumber: 'BILL-2026-09-001',
    vendorInvoiceNumber: 'INV-ROASTERY-8891',
    ruleCode: 'BILL-01',
    date: '2026-09-04',
    dueDate: '2026-09-18',
    vendorId: 'VEND-ROASTERY-01',
    vendorName: 'CV Salatiga Coffee Roastery',
    unitId: 'U002',
    locationId: 'L002',
    poId: 'PO-2026-09-001',
    poNumber: 'PO-2026-09-001',
    grId: 'GR-2026-09-001',
    grNumber: 'GR-2026-09-001',
    lines: [
      {
        poLineId: 'po-line-1',
        grLineId: 'gr-line-1',
        sku: 'INV-COFFEE-01',
        name: 'Biji Kopi Arabika House Blend 1kg',
        orderedQty: 50,
        acceptedUnbilledGrQty: 50,
        invoicedQty: 50,
        poUnitPrice: 120000,
        invoicedUnitPrice: 120000,
        qtyVariance: 0,
        priceVarianceNominal: 0,
        priceVariancePct: 0,
        isQtyOverbilled: false,
        isPriceVarianceWithinTolerance: true
      }
    ],
    subtotal: 6000000,
    priceVarianceTotal: 0,
    isVatClaimable: true,
    vatTaxInvoiceNo: '010.000-26.99281144',
    taxAmount: 660000, // 11% PPN Masukan
    totalAmount: 6660000,
    matchingStatus: 'AUTO_PASSED',
    holdReasons: [],
    appliedAdvanceAmount: 0,
    remainingPayableAmount: 6660000,
    paymentStatus: 'UNPAID',
    glJournalId: 'JV-2026-09-0033',
    createdAt: '2026-09-04T14:20:00Z'
  },
  {
    id: 'BILL-2026-09-002',
    billNumber: 'BILL-UTL-2026-09-002',
    vendorInvoiceNumber: 'PLN-REK-0926-8812',
    ruleCode: 'BILL-02',
    date: '2026-09-05',
    dueDate: '2026-09-20',
    vendorId: 'VEND-PLN',
    vendorName: 'PT PLN (Persero) Rayon Salatiga',
    unitId: 'U001',
    locationId: 'L001',
    lines: [],
    subtotal: 4250000,
    priceVarianceTotal: 0,
    isVatClaimable: false,
    taxAmount: 0,
    totalAmount: 4250000,
    matchingStatus: 'AUTO_PASSED',
    holdReasons: [],
    appliedAdvanceAmount: 0,
    remainingPayableAmount: 4250000,
    paymentStatus: 'UNPAID',
    glJournalId: 'JV-2026-09-0034',
    createdAt: '2026-09-05T09:10:00Z'
  }
];

export const INITIAL_P2P_ADVANCES: SupplierAdvanceRecord[] = [
  {
    id: 'ADV-SUPP-001',
    advanceNumber: 'ADV-20260901-01',
    ruleCode: 'PAY-02',
    date: '2026-09-01',
    vendorId: 'VEND-SANREMO-01',
    vendorName: 'PT Espresso Prima Italia',
    unitId: 'U002',
    totalAdvanceAmount: 20000000,
    remainingBalance: 20000000,
    bankAccountKey: 'BANK_MANDIRI',
    referencePoId: 'PO-2026-09-003',
    notes: 'Down Payment 25% pengadaan mesin espresso Sanremo Cafe Racer',
    glJournalId: 'JV-2026-09-0035',
    status: 'ACTIVE'
  }
];

export const INITIAL_P2P_PAYMENTS: VendorPaymentRecord[] = [];
