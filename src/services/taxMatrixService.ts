/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 2: Configurable Tax Matrix Engine
 * Sesuai REQ-007, REQ-008, UAT-006, UAT-007, dan UAT-034.
 */

import { TaxMatrixRule, TaxObject, TaxCalculationResult } from '../types/salesAndTax';
import { BusinessUnitId, PhysicalLocationId } from '../types/module1';

export const INITIAL_TAX_MATRIX: TaxMatrixRule[] = [
  {
    id: 'TAX-001',
    taxCode: 'PBJT-PADEL-10',
    taxObject: 'PBJT_PADEL',
    unitId: 'U001',
    locationId: 'L001',
    rate: 0.10, // 10% PBJT Hiburan/Olahraga Padel
    isInclusive: false, // Default exclusive
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    liabilityAccountKey: 'PBJT_PAYABLE', // Resolves to 2-1201 for U001
    description: 'Pajak Barang & Jasa Tertentu (PBJT) 10% atas Sewa Lapangan Padel Salatiga',
    isActive: true
  },
  {
    id: 'TAX-002',
    taxCode: 'PBJT-RESTO-BAR-10',
    taxObject: 'PBJT_FNB_RESTO',
    unitId: 'U002',
    locationId: 'L003',
    rate: 0.10, // 10% PBJT Resto Bar Salatiga
    isInclusive: true, // Inclusive pricing mode: DPP = Gross / 1.1
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    liabilityAccountKey: 'PBJT_PAYABLE', // Resolves to 2-1202 for U002
    description: 'PBJT 10% F&B Bar Salatiga (Mode Harga Termasuk Pajak / Inclusive)',
    isActive: true
  },
  {
    id: 'TAX-003',
    taxCode: 'PBJT-RESTO-KIT-10',
    taxObject: 'PBJT_FNB_RESTO',
    unitId: 'U002',
    locationId: 'L004',
    rate: 0.10, // 10% PBJT Resto Kitchen Salatiga
    isInclusive: false, // Exclusive mode: DPP + 10% Tax
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    liabilityAccountKey: 'PBJT_PAYABLE', // Resolves to 2-1202 for U002
    description: 'PBJT 10% F&B Kitchen Salatiga (Mode Harga Belum Termasuk Pajak / Exclusive)',
    isActive: true
  },
  {
    id: 'TAX-004',
    taxCode: 'PBJT-BENTENG-10',
    taxObject: 'PBJT_FNB_RESTO',
    unitId: 'U003',
    locationId: 'L005',
    rate: 0.10,
    isInclusive: true,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    liabilityAccountKey: 'PBJT_PAYABLE', // Resolves to 2-1202 for U003
    description: 'PBJT 10% F&B Coffee Benteng Ambarawa (Mode Inclusive)',
    isActive: true
  }
];

class TaxMatrixEngine {
  private rules: TaxMatrixRule[] = [...INITIAL_TAX_MATRIX];

  public getRules(): TaxMatrixRule[] {
    return [...this.rules];
  }

  public getAllRules(): TaxMatrixRule[] {
    return this.getRules();
  }

  /**
   * Enforces Rule UAT-034: Anti-Overlap Effective Date Validation
   */
  public validateNoOverlap(newRule: Omit<TaxMatrixRule, 'id'>, excludeId?: string): void {
    const overlapping = this.rules.find(r => {
      if (excludeId && r.id === excludeId) return false;
      if (!r.isActive) return false;

      // Scope match: same taxObject + same unitId + matching location
      const isSameObject = r.taxObject === newRule.taxObject;
      const isSameUnit = r.unitId === newRule.unitId;
      const isSameLoc = (!r.locationId && !newRule.locationId) || (r.locationId === newRule.locationId);

      if (isSameObject && isSameUnit && isSameLoc) {
        // Date overlap check: NOT (newEnd < existStart OR newStart > existEnd)
        const hasOverlap = !(newRule.effectiveTo < r.effectiveFrom || newRule.effectiveFrom > r.effectiveTo);
        return hasOverlap;
      }
      return false;
    });

    if (overlapping) {
      throw new Error(
        `[UAT-034 Tax Overlap Error] Overlap tanggal efektif terdeteksi untuk objek pajak '${newRule.taxObject}' pada unit '${newRule.unitId}'! Periode baru (${newRule.effectiveFrom} s/d ${newRule.effectiveTo}) bertabrakan dengan aturan aktif '${overlapping.taxCode}' (${overlapping.effectiveFrom} s/d ${overlapping.effectiveTo}).`
      );
    }
  }

  public addRule(ruleData: Omit<TaxMatrixRule, 'id'>): TaxMatrixRule {
    this.validateNoOverlap(ruleData);
    const newRule: TaxMatrixRule = {
      ...ruleData,
      id: `TAX-${Date.now().toString(36).toUpperCase()}`
    };
    this.rules.push(newRule);
    return newRule;
  }

  public updateRule(id: string, updates: Partial<TaxMatrixRule>): TaxMatrixRule {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) throw new Error(`Tax Rule with ID ${id} not found.`);

    const existing = this.rules[index];
    const updated = { ...existing, ...updates };
    this.validateNoOverlap(updated, id);

    this.rules[index] = updated;
    return updated;
  }

  /**
   * Resolves the active tax rule for a given scope and date
   */
  public findActiveRule(
    unitId: BusinessUnitId,
    locationId: PhysicalLocationId | undefined,
    taxObject: TaxObject,
    dateStr: string
  ): TaxMatrixRule | undefined {
    return this.rules.find(r => {
      if (!r.isActive) return false;
      if (r.taxObject !== taxObject) return false;
      if (r.unitId !== unitId) return false;
      if (r.locationId && locationId && r.locationId !== locationId) return false;
      return dateStr >= r.effectiveFrom && dateStr <= r.effectiveTo;
    });
  }

  /**
   * Calculates DPP and Tax supporting both Inclusive and Exclusive modes
   * REQ-007 / UAT-006 / UAT-007
   */
  public calculateTax(
    unitId: BusinessUnitId,
    locationId: PhysicalLocationId | undefined,
    taxObject: TaxObject,
    amount: number, // If inclusive: Gross amount. If exclusive: Net DPP amount.
    dateStr: string,
    overrideInclusive?: boolean
  ): TaxCalculationResult {
    const rule = this.findActiveRule(unitId, locationId, taxObject, dateStr);

    if (!rule) {
      // Fallback default: 0% tax if non-taxable or no rule
      return {
        ruleApplied: {
          id: 'TAX-ZERO',
          taxCode: 'NON-TAX',
          taxObject,
          unitId,
          rate: 0,
          isInclusive: false,
          effectiveFrom: '2026-01-01',
          effectiveTo: '2099-12-31',
          liabilityAccountKey: 'PBJT_PAYABLE',
          description: 'Non-Taxable',
          isActive: true
        },
        grossAmount: amount,
        dppNetAmount: amount,
        taxAmount: 0,
        isInclusive: false
      };
    }

    const isInclusive = overrideInclusive !== undefined ? overrideInclusive : rule.isInclusive;

    if (isInclusive) {
      // Inclusive Mode: DPP = Gross / (1 + rate), Tax = Gross - DPP
      // Example: Gross Rp 110.000 -> DPP = Rp 100.000, Tax = Rp 10.000
      const dpp = Math.round(amount / (1 + rule.rate));
      const tax = amount - dpp;
      return {
        ruleApplied: rule,
        grossAmount: amount,
        dppNetAmount: dpp,
        taxAmount: tax,
        isInclusive: true
      };
    } else {
      // Exclusive Mode: Net DPP = Amount, Tax = Net * rate, Gross = Net + Tax
      // Example: Net Rp 100.000 -> Tax = Rp 10.000, Gross = Rp 110.000
      const tax = Math.round(amount * rule.rate);
      const gross = amount + tax;
      return {
        ruleApplied: rule,
        grossAmount: gross,
        dppNetAmount: amount,
        taxAmount: tax,
        isInclusive: false
      };
    }
  }
}

export const taxMatrixEngine = new TaxMatrixEngine();
