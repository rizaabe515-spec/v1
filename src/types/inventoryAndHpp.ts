/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 5 Type Definitions: Master Item & Resep (BOM), Subledger Stok,
 * Transfer Antar-Lokasi (STK-01), Pemakaian Non-Penjualan (STK-02..05),
 * dan Engine HPP Periodik Bertingkat (STK-06, STK-07).
 * 
 * Strict Blueprint Compliance: REQ-017..021, REQ-033, DEC-10, UAT-012, UAT-019..024.
 */

import { BusinessUnitId, PhysicalLocationId } from './module1';

export type InventoryCategory = 'COFFEE' | 'RESTO' | 'PACKAGING' | 'MERCH' | 'SUPPLIES';

export interface MasterItemRecord {
  id: string;
  sku: string;
  itemName: string;
  category: InventoryCategory;
  baseUom: string; // e.g. 'gram', 'ml', 'pcs'
  purchaseUom: string; // e.g. 'kg', 'liter', 'box'
  conversionFactor: number; // e.g. 1 kg = 1000 gram
  inventoryAccountKey: 'INV_COFFEE' | 'INV_RESTO' | 'INV_PACKAGING' | 'INV_MERCH' | 'INV_SUPPLIES';
  inventoryAccountCode: '1-1301' | '1-1302' | '1-1303' | '1-1304' | '1-1305';
  cogsAccountKey: 'COGS_SALES';
  cogsAccountCode: '5-1101' | '5-1102'; // Bar (5-1101) or Kitchen (5-1102)
  stockByLocation: Record<PhysicalLocationId, number>; // in baseUom
  averageUnitCost: number; // per baseUom (Weighted Average)
  minStockLevel: number;
  blockNegativeStock: boolean; // DEC-10: true by default
}

export interface RecipeIngredient {
  itemSku: string;
  itemName: string;
  qtyNeeded: number; // in baseUom
  baseUom: string;
}

export interface RecipeBOM {
  id: string;
  menuSku: string;
  menuName: string;
  unitId: BusinessUnitId;
  station: 'BAR' | 'KITCHEN';
  ingredients: RecipeIngredient[];
  servingPortion: number;
}

export type TransferStatus = 'DISPATCHED_IN_TRANSIT' | 'RECEIVED_COMPLETED' | 'CANCELLED';

export interface StockTransferRecord {
  id: string;
  transferNumber: string; // e.g. 'TRF-STK-20260905-01'
  ruleCode: 'STK-01';
  date: string;
  sourceLocationId: PhysicalLocationId;
  destinationLocationId: PhysicalLocationId;
  sourceUnitId: BusinessUnitId;
  destinationUnitId: BusinessUnitId;
  items: Array<{
    sku: string;
    name: string;
    qty: number; // baseUom
    unitCost: number;
    totalValuation: number;
  }>;
  totalValuation: number;
  status: TransferStatus;
  isGlNonPostingVerified: boolean; // UAT-019: Prohibits 4-xxxx or 5-xxxx GL entries
  dispatchedBy: string;
  receivedBy?: string;
  receivedAt?: string;
  notes?: string;
}

export type NonSaleReasonCode = 
  | 'STK-04_WASTE_SPOILAGE'      // Rusak, basi, expired -> 5-1107
  | 'STK-04_SPILLAGE_CALIBRATE'  // Tumpah, kalibrasi grinder -> 5-1107
  | 'STK-05_CREW_MEAL'           // Konsumsi jatah makan karyawan -> 6-1104
  | 'STK-05_PROMO_SAMPLING';     // Tester pelanggan, promo event -> 6-1308

export interface NonSaleConsumptionRecord {
  id: string;
  docNumber: string; // e.g. 'NSC-20260906-01'
  ruleCode: 'STK-04' | 'STK-05';
  date: string;
  reasonCode: NonSaleReasonCode;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  targetAccountKey: 'STOCK_SHRINKAGE' | 'CREW_MEAL' | 'PROMO_EXPENSE';
  targetAccountCode: '5-1107' | '6-1104' | '6-1308';
  sku: string;
  itemName: string;
  qtyConsumed: number;
  unitCost: number;
  totalEstimatedValue: number;
  recordedBy: string;
  approvedBy: string;
  notes: string;
  isGlDeferredToPeriodEnd: boolean; // UAT-024: Not posted individually, deferred to STK-07
}

export interface StockOpnameSessionRecord {
  id: string;
  sessionNumber: string; // e.g. 'OPN-2026-09-L003'
  periodMonth: string; // YYYY-MM
  locationId: PhysicalLocationId;
  date: string;
  status: 'DRAFT' | 'APPROVED' | 'POSTED_TO_HPP';
  conductedBy: string;
  approvedBy?: string;
  lines: Array<{
    sku: string;
    itemName: string;
    systemQty: number;
    physicalQty: number;
    varianceQty: number; // physicalQty - systemQty (STK-02 shortage / STK-03 overage)
    unitCost: number;
    varianceValue: number;
  }>;
  totalVarianceValue: number;
}

export interface DailyHppEstimateResult {
  date: string;
  runTimestamp: string; // default 03:00 WIB
  label: 'ESTIMATE (NON-GL)';
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  totalSalesRevenue: number;
  estimatedHppAmount: number;
  estimatedMarginPct: number;
  breakdownByMenu: Array<{
    menuName: string;
    qtySold: number;
    unitPrice: number;
    recipeCost: number;
    totalHpp: number;
  }>;
  isGlJournalCreated: false; // Confirms UAT-020
}

export interface WeeklyHppProvisionalResult {
  weekRange: string; // e.g. '2026-W37 (08 Sep - 14 Sep)'
  runTimestamp: string; // default Monday 04:00 WIB
  label: 'PROVISIONAL (NON-GL)';
  provisionalHppAmount: number;
  weeklySalesRevenue: number;
  varianceCycleCountTotal: number;
  isGlJournalCreated: false; // Confirms UAT-021
}

export interface MonthlyHppClosingRecord {
  id: string;
  runKey: string; // e.g. 'PADELBEANS-2026-09' (anti double-execution)
  ruleCode: 'STK-07';
  periodMonth: string; // '2026-09'
  closingDate: string;
  approver: string;
  beginningInventoryValue: number; // Cr 1-1301..1-1305
  periodicPurchasesTotal: number;   // Cr 5-1100 (emptied to 0)
  netTransfersAdjustment: number;
  endingInventoryValue: number;    // Dr 1-1301..1-1305 (from approved Opname)
  nonSaleConsumptionBreakdown: {
    stockShrinkageWaste51107: number; // Dr 5-1107
    crewMeal61104: number;            // Dr 6-1104
    promoSampling61308: number;       // Dr 6-1308
  };
  officialCogsBar51101: number;      // Dr 5-1101
  officialCogsKitchen51102: number;  // Dr 5-1102
  totalOfficialCogs: number;
  glJournalId: string;
  isBalanced: boolean;
  postedAt: string;
}
