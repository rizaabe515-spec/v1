/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Periodic Inventory & HPP Valuation Engine
 * 
 * Rules:
 * 1. COGS Perpetual (Rule STK-06) is STRICTLY DISABLED.
 * 2. Daily (03:00 WIB) & Weekly (Senin 04:00 WIB) HPP are NON-GL ESTIMATIONS.
 * 3. Official GL HPP posting occurs once a month via STK-07 after approved Stock Opname.
 * 4. Valuation Method: Weighted Average per SKU and Location.
 */

import { StockItem, StockOpnameSession, PhysicalLocationId, GLJournalLine } from '../types/erp';
import { ACCOUNT_KEYS, getAccountByKey } from '../constants/coaData';
import { PHYSICAL_LOCATIONS } from '../constants/dimensions';

export interface DailyHppEstimation {
  date: string;
  runTimestamp: string;
  type: 'DAILY_0300_WIB' | 'WEEKLY_MON_0400_WIB';
  estimatedSalesValue: number;
  estimatedTheoreticalUsageCost: number;
  estimatedHppRatio: number; // e.g. 32.4%
  isPostedToGL: false; // Always false!
  notes: string;
}

/**
 * Calculates theoretical non-GL daily/weekly HPP estimate for management tracking
 */
export function calculateNonGlEstimatedHpp(
  salesTurnover: number,
  estimatedCostRatio: number = 0.315
): DailyHppEstimation {
  const estimatedCost = salesTurnover * estimatedCostRatio;
  return {
    date: new Date().toISOString().split('T')[0],
    runTimestamp: '03:00 WIB (Automated Cron Job)',
    type: 'DAILY_0300_WIB',
    estimatedSalesValue: salesTurnover,
    estimatedTheoreticalUsageCost: estimatedCost,
    estimatedHppRatio: Number((estimatedCostRatio * 100).toFixed(1)),
    isPostedToGL: false,
    notes: 'Perhitungan estimasi operasional harian non-GL. Tidak mempengaruhi buku besar / Neraca Saldo.'
  };
}

/**
 * Generates the official monthly STK-07 GL Journal lines post-Stock Opname
 * Using Periodic Accounting formula:
 * HPP = Beginning Inventory + Net Purchases (5-1100) - Ending Physical Inventory
 */
export function generateStk07JournalLines(
  opnameSession: StockOpnameSession,
  stockItems: StockItem[],
  totalPurchasesPeriod: number // Balance in 5-1100 for the period
): {
  lines: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    unitId: any;
    locationId?: PhysicalLocationId;
    description: string;
  }>;
  totalHppCalculated: number;
  endingStockPhysicalValue: number;
} {
  const location = PHYSICAL_LOCATIONS[opnameSession.locationId];
  const unitId = location ? location.parentUnitId : 'U002';

  // Calculate physical ending inventory value from approved opname lines
  let endingStockPhysicalValue = 0;
  for (const line of opnameSession.lines) {
    endingStockPhysicalValue += line.physicalQty * line.unitCost;
  }

  // Calculate system theoretical value
  let systemStockValue = 0;
  for (const line of opnameSession.lines) {
    systemStockValue += line.systemQty * line.unitCost;
  }

  // Net variance (Shrinkage/Surplus)
  const varianceValue = endingStockPhysicalValue - systemStockValue;

  // Periodic HPP = Purchases (5-1100) - Net physical adjustment
  // In classic periodic:
  // 1. Dr 5-1200 Beban HPP Penyesuaian Stock Opname (Calculated HPP)
  // 2. Cr 5-1100 Pembelian Persediaan Periodik (Close purchase account to 0)
  // 3. Adjust Inventory Asset 1-1301..1-1305 to reflect physical ending count
  const calculatedHpp = Math.max(0, totalPurchasesPeriod - varianceValue);

  const lines: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    unitId: any;
    locationId?: PhysicalLocationId;
    description: string;
  }> = [
    // Line 1: Debit Official GL HPP Account 5-1200
    {
      accountCode: ACCOUNT_KEYS.COGS_STOCK_OPNAME, // '5-1200'
      debit: calculatedHpp,
      credit: 0,
      unitId,
      locationId: opnameSession.locationId,
      description: `STK-07: Beban HPP Periodik Hasil Stock Opname Fisik ${opnameSession.periodMonth} - ${location.name}`
    },
    // Line 2: Credit Periodic Purchases Account 5-1100 (Closing purchase pool)
    {
      accountCode: ACCOUNT_KEYS.PURCHASE_PERIODIC, // '5-1100'
      debit: 0,
      credit: totalPurchasesPeriod,
      unitId,
      locationId: opnameSession.locationId,
      description: `STK-07: Penutupan Pembelian Persediaan Periodik Periode ${opnameSession.periodMonth}`
    }
  ];

  // Line 3: Inventory asset adjustment line to keep journal strictly balanced
  if (varianceValue !== 0) {
    // If ending stock is higher than system (surplus) -> Debit inventory, credit HPP
    // If ending stock is lower than system (shrinkage) -> Credit inventory, debit HPP
    if (varianceValue > 0) {
      lines.push({
        accountCode: ACCOUNT_KEYS.INV_RAW_MATERIALS, // '1-1301'
        debit: varianceValue,
        credit: 0,
        unitId,
        locationId: opnameSession.locationId,
        description: `STK-07: Penyesuaian Surplus Fisik Persediaan ${opnameSession.periodMonth}`
      });
    } else {
      lines.push({
        accountCode: ACCOUNT_KEYS.INV_RAW_MATERIALS, // '1-1301'
        debit: 0,
        credit: Math.abs(varianceValue),
        unitId,
        locationId: opnameSession.locationId,
        description: `STK-07: Penyesuaian Selisih Kurang/Wastage Fisik Persediaan ${opnameSession.periodMonth}`
      });
    }
  }

  // Verify journal balance
  const sumDebit = lines.reduce((acc, l) => acc + l.debit, 0);
  const sumCredit = lines.reduce((acc, l) => acc + l.credit, 0);
  const roundingDiff = sumDebit - sumCredit;

  if (Math.abs(roundingDiff) > 0.01) {
    // Balance with fine rounding line
    if (roundingDiff > 0) {
      lines[1].credit += roundingDiff;
    } else {
      lines[0].debit += Math.abs(roundingDiff);
    }
  }

  return {
    lines,
    totalHppCalculated: calculatedHpp,
    endingStockPhysicalValue
  };
}
