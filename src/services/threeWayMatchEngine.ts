/**
 * PT Sport Universal Indonesia (Padel Beans)
 * 3-Way Matching Engine (PO - Goods Receipt - Vendor Bill)
 * Strict Compliance:
 * 1. 0% Over-Billing Tolerance on Quantities (Invoiced Qty <= Received Unbilled GR Qty)
 * 2. Auto-Pass Price Tolerance: Price Variance <= 1% AND <= Rp 50.000 per PO line cumulatively
 * 3. Violations trigger automated EXCEPTION_HOLD requiring Finance/Purchasing approval
 */

import { PurchaseOrder, GoodsReceipt, VendorBill, VendorBillLine } from '../types/erp';

export interface MatchingResult {
  status: 'AUTO_PASSED' | 'EXCEPTION_HOLD';
  lines: VendorBillLine[];
  holdReasons: string[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export function performThreeWayMatch(
  po: PurchaseOrder,
  gr: GoodsReceipt,
  invoiceLines: Array<{
    poLineId: string;
    grLineId: string;
    invoicedQty: number;
    invoicedUnitPrice: number;
  }>,
  taxRatePercent: number = 0
): MatchingResult {
  const evaluatedLines: VendorBillLine[] = [];
  const holdReasons: string[] = [];

  let subtotal = 0;

  for (const invLine of invoiceLines) {
    const poLine = po.lines.find(l => l.id === invLine.poLineId);
    const grLine = gr.lines.find(l => l.id === invLine.grLineId);

    if (!poLine || !grLine) {
      holdReasons.push(`Invalid line reference for PO line ${invLine.poLineId} or GR line ${invLine.grLineId}`);
      continue;
    }

    const invoicedQty = Number(invLine.invoicedQty) || 0;
    const invoicedUnitPrice = Number(invLine.invoicedUnitPrice) || 0;
    const grQty = grLine.receivedQty;
    const poUnitPrice = poLine.unitPrice;

    const lineTotal = invoicedQty * invoicedUnitPrice;
    subtotal += lineTotal;

    // 1. Quantity Validation (0% Over-Billing tolerance)
    const qtyVariance = invoicedQty - grQty;
    const hasQtyViolation = invoicedQty > grQty;

    if (hasQtyViolation) {
      holdReasons.push(
        `Quantity Over-Billing on SKU [${poLine.sku} ${poLine.itemName}]: Invoiced ${invoicedQty} ${poLine.unit} exceeds received GR quantity of ${grQty} ${poLine.unit}. (0% Over-billing tolerance violation)`
      );
    }

    // 2. Price Validation (<= 1% AND <= Rp 50.000 per line)
    const priceVariance = (invoicedUnitPrice - poUnitPrice) * invoicedQty;
    const priceVariancePercent = poUnitPrice > 0 
      ? ((invoicedUnitPrice - poUnitPrice) / poUnitPrice) * 100 
      : 0;

    let hasPriceViolation = false;

    if (priceVariance > 0) {
      // If invoice price is higher than PO price, check strict tolerance
      const exceedsPercent = priceVariancePercent > 1.0;
      const exceedsNominal = priceVariance > 50000;

      if (exceedsPercent || exceedsNominal) {
        hasPriceViolation = true;
        holdReasons.push(
          `Price Variance on SKU [${poLine.sku} ${poLine.itemName}]: Invoiced price Rp ${invoicedUnitPrice.toLocaleString('id-ID')} vs PO price Rp ${poUnitPrice.toLocaleString('id-ID')} (+${priceVariancePercent.toFixed(2)}%, selisih Rp ${priceVariance.toLocaleString('id-ID')}). Exceeds tolerance (Max 1% and Max Rp 50.000).`
        );
      }
    }

    evaluatedLines.push({
      id: `bill-line-${Date.now()}-${poLine.sku}`,
      poLineId: poLine.id,
      grLineId: grLine.id,
      sku: poLine.sku,
      itemName: poLine.itemName,
      invoicedQty,
      invoicedUnitPrice,
      grQty,
      poUnitPrice,
      priceVariance,
      priceVariancePercent,
      qtyVariance,
      hasPriceViolation,
      hasQtyViolation
    });
  }

  const taxAmount = (subtotal * taxRatePercent) / 100;
  const totalAmount = subtotal + taxAmount;
  const status = holdReasons.length === 0 ? 'AUTO_PASSED' : 'EXCEPTION_HOLD';

  return {
    status,
    lines: evaluatedLines,
    holdReasons,
    subtotal,
    taxAmount,
    totalAmount
  };
}
