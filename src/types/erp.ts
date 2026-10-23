/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Core ERP Type Definitions
 * Compliant with Blueprint_ERP_PadelBeans_Mapping_COA_Finalisasi_V1_3
 */

export type BusinessUnitId = 'U001' | 'U002' | 'U003' | 'U009';

export interface BusinessUnit {
  id: BusinessUnitId;
  code: string;
  name: string;
  type: 'REVENUE' | 'SHARED_COST';
  description: string;
  historicalAlias?: string;
}

export type PhysicalLocationId = 'L001' | 'L002' | 'L003' | 'L004' | 'L005';

export interface PhysicalLocation {
  id: PhysicalLocationId;
  code: string;
  name: string;
  parentUnitId: BusinessUnitId;
  hasStockControl: boolean;
  description: string;
}

export type AccountCategory = 
  | 'ASSET_CURRENT' 
  | 'ASSET_NON_CURRENT' 
  | 'LIABILITY_CURRENT' 
  | 'LIABILITY_NON_CURRENT' 
  | 'EQUITY' 
  | 'REVENUE' 
  | 'COGS_PERIODIC' 
  | 'EXPENSE_OPERATIONAL' 
  | 'EXPENSE_TAX_OTHER';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface ChartOfAccount {
  accountCode: string;
  accountKey: string;
  accountName: string;
  category: AccountCategory;
  normalBalance: NormalBalance;
  description: string;
  isBankCash?: boolean;
  isRevenue?: boolean;
}

export type JournalStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export interface GLJournalLine {
  id: string;
  journalId: string;
  accountCode: string;
  accountKey: string;
  accountName: string;
  debit: number;
  credit: number;
  unitId: BusinessUnitId;
  locationId?: PhysicalLocationId;
  description: string;
}

export interface GLJournalEntry {
  id: string;
  journalNumber: string;
  date: string;
  ruleCode: string; // e.g. GR-01, AP-01, SAL-01, SAL-06, SAL-07, STK-07, CA-03, FIN-01
  reference: string;
  description: string;
  idempotencyKey: string;
  status: JournalStatus;
  lines: GLJournalLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  isReversal?: boolean;
  reversalOfJournalId?: string;
  reversalJournalId?: string;
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
}

// 3-Way Matching Data Types
export interface POLine {
  id: string;
  sku: string;
  itemName: string;
  orderedQty: number;
  unitPrice: number;
  unit: string;
  targetLocationId: PhysicalLocationId;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  vendorName: string;
  unitId: BusinessUnitId;
  lines: POLine[];
  status: 'OPEN' | 'PARTIAL' | 'RECEIVED' | 'CLOSED';
  totalAmount: number;
}

export interface GRLine {
  id: string;
  poLineId: string;
  sku: string;
  itemName: string;
  receivedQty: number;
  unitPrice: number;
  locationId: PhysicalLocationId;
}

export interface GoodsReceipt {
  id: string;
  grNumber: string;
  poId: string;
  poNumber: string;
  date: string;
  vendorName: string;
  lines: GRLine[];
  glJournalId?: string;
  totalValue: number;
  isBilled: boolean;
  status: 'RECEIVED' | 'INVOICED';
}

export interface VendorBillLine {
  id: string;
  poLineId: string;
  grLineId: string;
  sku: string;
  itemName: string;
  invoicedQty: number;
  invoicedUnitPrice: number;
  grQty: number;
  poUnitPrice: number;
  priceVariance: number;
  priceVariancePercent: number;
  qtyVariance: number;
  hasPriceViolation: boolean;
  hasQtyViolation: boolean;
}

export interface VendorBill {
  id: string;
  billNumber: string;
  vendorInvoiceNumber: string;
  poId: string;
  poNumber: string;
  grId: string;
  grNumber: string;
  date: string;
  vendorName: string;
  lines: VendorBillLine[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  matchingStatus: 'AUTO_PASSED' | 'EXCEPTION_HOLD' | 'APPROVED';
  glJournalId?: string;
  holdReasons?: string[];
  approvedBy?: string;
  approvalNotes?: string;
}

// Inventory Subledger & Stock Opname
export interface StockItem {
  sku: string;
  name: string;
  category: 'RAW_MATERIALS' | 'BEVERAGES' | 'FOOD' | 'MERCHANDISE' | 'SUPPLIES';
  unit: string;
  costAccountKey: string; // 1-1301..1-1305
  stockByLocation: Record<PhysicalLocationId, number>;
  averageUnitCost: number; // Weighted Average Cost
}

export interface StockOpnameLine {
  sku: string;
  itemName: string;
  locationId: PhysicalLocationId;
  systemQty: number;
  physicalQty: number;
  varianceQty: number;
  unitCost: number;
  varianceValue: number;
}

export interface StockOpnameSession {
  id: string;
  sessionNumber: string;
  periodMonth: string; // e.g. "2026-09"
  locationId: PhysicalLocationId;
  date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED';
  lines: StockOpnameLine[];
  totalVarianceValue: number;
  glJournalId?: string;
  conductedBy: string;
  approvedBy?: string;
}

// Tournament & Anti-Fake-Revenue
export interface TournamentEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'SETTLED';
  entryFeePerParticipant: number;
  totalRegisteredParticipants: number;
  totalCollectedPrepayment: number; // Credited to 2-1301
  totalRefunds: number;
  netRevenue: number; // Transferred to 4-1102 on settlement
  sal06JournalIds: string[];
  sal07JournalId?: string;
}

// Court Booking
export interface CourtBooking {
  id: string;
  bookingCode: string;
  courtName: string;
  customerName: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  rentalFee: number;
  equipmentFee: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'MANDIRI_TRANSFER' | 'QRIS_BNI';
  glJournalId?: string;
  status: 'CONFIRMED' | 'PLAYED' | 'CANCELLED';
}

// POS Transaction
export interface POSOrderItem {
  sku: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
}

export interface POSTransaction {
  id: string;
  receiptNumber: string;
  timestamp: string;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  cashierName: string;
  items: POSOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentAccountCode: string;
  revenueAccountCode: string;
  glJournalId: string;
  cogsRuleStatus: 'DISABLED_PERIODIC_ACTIVE';
}

// Anti-Fraud Audit Record
export interface NonRevenueTransaction {
  id: string;
  date: string;
  type: 'CASH_ADVANCE_RETURN' | 'DKSI_RELATED_LOAN' | 'OWNER_FUNDING' | 'INTERBANK_TRANSFER';
  amount: number;
  fromAccount: string;
  toAccount: string;
  glJournalId: string;
  isRevenueAccountInvolved: boolean; // Must be false!
  auditVerified: boolean;
}
