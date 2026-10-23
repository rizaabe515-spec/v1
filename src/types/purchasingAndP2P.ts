/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 3 Type Definitions: Procure-to-Pay (P2P), Receiving (GR-01 / GR-02),
 * 3-Way Matching Engine (BILL-01..04, BILL-CRN), and Vendor Payments (PAY-01..03).
 * 
 * Strict Blueprint Compliance: REQ-010..014, REQ-032, UAT-010..018.
 */

import { BusinessUnitId, PhysicalLocationId } from './module1';

export type PRStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CONVERTED_TO_PO';

export interface PRLine {
  id: string;
  itemDescription: string;
  sku?: string;
  category: 'INVENTORY' | 'OPEX_SERVICE' | 'CAPEX_ASSET';
  estimatedQty: number;
  estimatedUnitPrice: number;
  totalEstimated: number;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
}

export interface PurchaseRequest {
  id: string;
  prNumber: string; // e.g. 'PR-2026-09-001'
  date: string;
  requesterName: string;
  department: string;
  unitId: BusinessUnitId;
  targetLocationId: PhysicalLocationId;
  notes: string;
  lines: PRLine[];
  totalAmount: number;
  status: PRStatus;
  requiredApprovalTier: 'TIER_1_SPV' | 'TIER_2_HEAD' | 'TIER_3_DIRECTOR';
  approvedBy?: string;
  approvedAt?: string;
  isSplittingSuspected?: boolean;
  splittingAlertDetails?: string;
  poId?: string;
}

export type POStatus = 'OPEN' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'INVOICED' | 'CANCELLED';

export interface POLineItem {
  id: string;
  sku: string;
  name: string;
  category: 'INVENTORY' | 'OPEX_SERVICE' | 'CAPEX_ASSET';
  assetAccountKey?: string; // e.g. 'ASSET_FNB_EQUIPMENT' for CAPEX
  orderedQty: number;
  receivedQty: number;
  billedQty: number;
  unitPrice: number;
  totalPrice: number;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
}

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string; // e.g. 'PO-2026-09-001'
  prId?: string;
  date: string;
  vendorId: string;
  vendorName: string;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  lines: POLineItem[];
  totalAmount: number;
  status: POStatus;
  notes?: string;
  isNonPostingVerified: boolean; // Confirms PUR-02 never creates GL journal
  createdBy: string;
  approvedBy: string;
}

export type GRType = 'GR-01' | 'GR-02';

export interface GRLineItem {
  id: string;
  poLineId: string;
  sku: string;
  name: string;
  receivedQty: number;
  unitPrice: number; // PO net price
  totalValue: number;
  locationId: PhysicalLocationId;
  assetAccountKey?: string; // For GR-02
}

export interface GoodsReceiptRecord {
  id: string;
  grNumber: string; // e.g. 'GR-2026-09-001'
  ruleCode: GRType;
  date: string;
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  unitId: BusinessUnitId;
  destinationLocationId: PhysicalLocationId;
  lines: GRLineItem[];
  totalValue: number;
  isBilled: boolean;
  glJournalId: string;
  receivedBy: string;
  verifiedPeriodicHppConstraint: boolean; // True: Dr 5-1100 / Cr 2-1104, NO 1-1301..1-1305 debit
}

export type MatchingStatusCode = 
  | 'AUTO_PASSED' 
  | 'HOLD_OVERBILL_QTY' 
  | 'HOLD_PRICE_VARIANCE' 
  | 'APPROVED_OVERRIDE';

export interface LineMatchResult {
  poLineId: string;
  grLineId?: string;
  sku: string;
  name: string;
  orderedQty: number;
  acceptedUnbilledGrQty: number;
  invoicedQty: number;
  poUnitPrice: number;
  invoicedUnitPrice: number;
  qtyVariance: number; // invoicedQty - acceptedUnbilledGrQty
  priceVarianceNominal: number; // (invoicedUnitPrice - poUnitPrice) * invoicedQty
  priceVariancePct: number; // (invoicedUnitPrice - poUnitPrice) / poUnitPrice
  isQtyOverbilled: boolean;
  isPriceVarianceWithinTolerance: boolean; // <= 1% and <= Rp 50.000
}

export interface ThreeWayMatchResult {
  status: MatchingStatusCode;
  lines: LineMatchResult[];
  subtotalGrAmount: number; // At original GR rate
  priceVarianceSubtotal: number; // Net variance debited/credited to 5-1100
  taxAmount: number; // Claimable PPN Masukan (1-1403)
  totalInvoiceAmount: number; // Total payable
  holdReasons: string[];
}

export type BillType = 
  | 'BILL-01' // Inventory Trade Bill (3-way match against PO & GR)
  | 'BILL-02' // General OpEx / Utility Bill (PLN, WiFi, LPG, Water)
  | 'BILL-03' // Capex / Fixed Asset / Project Construction Bill
  | 'BILL-CRN'; // Purchase Return / Credit Note to Supplier

export interface VendorBillRecord {
  id: string;
  billNumber: string; // Internal: BILL-2026-09-001
  vendorInvoiceNumber: string; // Supplier external invoice no.
  ruleCode: BillType;
  date: string;
  dueDate: string;
  vendorId: string;
  vendorName: string;
  unitId: BusinessUnitId;
  locationId?: PhysicalLocationId;
  poId?: string;
  poNumber?: string;
  grId?: string;
  grNumber?: string;
  lines: LineMatchResult[];
  subtotal: number;
  priceVarianceTotal: number;
  isVatClaimable: boolean;
  vatTaxInvoiceNo?: string;
  taxAmount: number;
  totalAmount: number;
  matchingStatus: MatchingStatusCode;
  holdReasons: string[];
  overrideApprovedBy?: string;
  overrideNotes?: string;
  appliedAdvanceAmount: number; // Deducted from PAY-02 supplier advance
  remainingPayableAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  glJournalId?: string;
  createdAt: string;
}

export interface SupplierAdvanceRecord {
  id: string;
  advanceNumber: string; // e.g. 'ADV-SUPP-2026-09-001'
  ruleCode: 'PAY-02';
  date: string;
  vendorId: string;
  vendorName: string;
  unitId: BusinessUnitId;
  totalAdvanceAmount: number;
  remainingBalance: number; // Initially totalAdvanceAmount, reduced on PAY-03
  bankAccountKey: 'BANK_BNI' | 'BANK_MANDIRI';
  referencePoId?: string;
  notes: string;
  glJournalId: string;
  status: 'ACTIVE' | 'FULLY_APPLIED';
}

export interface VendorPaymentRecord {
  id: string;
  paymentNumber: string; // e.g. 'PAY-2026-09-001'
  ruleCode: 'PAY-01' | 'PAY-03';
  date: string;
  vendorId: string;
  vendorName: string;
  unitId: BusinessUnitId;
  billId: string;
  billNumber: string;
  billType: BillType;
  amountPaid: number;
  paymentMethod: 'BANK_MANDIRI' | 'BANK_BNI' | 'ADVANCE_APPLICATION';
  bankAccountKey?: 'BANK_BNI' | 'BANK_MANDIRI';
  adminFee: number;
  advanceId?: string; // If PAY-03
  glJournalId: string;
  notes?: string;
  processedBy: string;
}
