/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 2 Type Definitions: Configurable Tax Matrix, Sales & Settlements (SAL-01 - SAL-05),
 * Cross-Month Tournaments (SAL-06, SAL-07), and 15% Benteng Profit-Sharing Accrual (SAL-08).
 * 
 * Compliant with Blueprint V1.3: REQ-007, REQ-008, REQ-038, REQ-039, UAT-006, UAT-007, UAT-008, UAT-009, UAT-034, UAT-036, UAT-037.
 */

import { BusinessUnitId, PhysicalLocationId } from './module1';

export type TaxObject = 'PBJT_PADEL' | 'PBJT_FNB_RESTO' | 'PPN_GOODS' | 'NON_TAXABLE';

export interface TaxMatrixRule {
  id: string;
  taxCode: string; // e.g. 'TAX-PBJT-PADEL-10', 'TAX-PBJT-RESTO-10'
  taxObject: TaxObject;
  unitId: BusinessUnitId;
  locationId?: PhysicalLocationId;
  rate: number; // e.g. 0.10 for 10%
  isInclusive: boolean; // true = inclusive (DPP = Gross / 1.1), false = exclusive (Tax = Net * 0.1)
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string;   // YYYY-MM-DD
  liabilityAccountKey: string; // 'PBJT_PAYABLE' or 'VAT_OUTPUT_PAYABLE'
  description: string;
  isActive: boolean;
}

export interface TaxCalculationResult {
  ruleApplied: TaxMatrixRule;
  grossAmount: number;
  dppNetAmount: number;
  taxAmount: number;
  isInclusive: boolean;
}

export type PaymentChannel = 
  | 'CASH' 
  | 'QRIS_BNI' 
  | 'QRIS_MANDIRI' 
  | 'EDC_MANDIRI' 
  | 'AYO_INDONESIA' 
  | 'CORPORATE_INVOICE';

export interface PaymentProviderConfig {
  channel: PaymentChannel;
  name: string;
  clearingAccountKey: string; // 1-1201 for providers, 1-1101 for cash, 1-1202 for corporate invoice
  clearingAccountCode: string;
  targetBankAccountKey: string; // 'BANK_BNI' or 'BANK_MANDIRI'
  targetBankAccountCode: string;
  mdrFeePercent: number; // e.g. 0.7 for QRIS, 1.5 for EDC, 3.5 for Ayo
}

export interface SalesItemLine {
  sku: string;
  name: string;
  revenueAccountKey: 'REV_PADEL' | 'REV_FNB' | 'REV_MERCH';
  grossPrice: number;
  qty: number;
  totalGross: number;
}

export interface SalesTransaction {
  id: string;
  saleNumber: string; // e.g. 'POS-20260920-001'
  ruleCode: 'SAL-01' | 'SAL-02' | 'SAL-03';
  date: string;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  customerName: string;
  channel: PaymentChannel;
  items: SalesItemLine[];
  grossTotal: number;
  dppTotal: number;
  taxTotal: number;
  glJournalId: string;
  settlementStatus?: 'SETTLED' | 'PENDING_CLEARING' | 'NOT_APPLICABLE';
  settlementBatchId?: string;
  createdAt: string;
  cashierOrActor: string;
}

export interface SettlementBatch {
  id: string;
  batchNumber: string; // e.g. 'SETTLE-QRIS-20260921-01'
  ruleCode: 'SAL-04';
  date: string;
  provider: PaymentChannel;
  grossAmount: number; // Credited to 1-1201
  mdrFeeAmount: number; // Debited to 6-1301
  netDisbursedAmount: number; // Debited to 1-1102 (BNI) or 1-1103 (Mandiri)
  bankAccountKey: 'BANK_BNI' | 'BANK_MANDIRI';
  bankAccountCode: string;
  salesTransactionIds: string[];
  glJournalId: string;
  disbursedAt: string;
  processedBy: string;
}

export interface SalesRefundRecord {
  id: string;
  refundNumber: string; // e.g. 'REF-20260922-001'
  ruleCode: 'SAL-05';
  originalSaleId: string;
  originalSaleNumber: string;
  date: string;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  refundReason: string;
  refundGrossAmount: number;
  refundDppAmount: number;
  refundTaxAmount: number;
  refundPaymentMethod: 'MANDIRI_TRANSFER' | 'CLEARING_REVERSAL' | 'REFUND_PAYABLE';
  refundDisbursedAccountCode: string;
  glJournalId: string;
  processedBy: string;
}

export type TournamentCategoryTariff = 
  | 'ROOKIE_MIX' 
  | 'BEGINNER' 
  | 'LOWER_BRONZE' 
  | 'OPEN_MASTERS';

export interface TournamentRegistrationParticipant {
  id: string;
  tournamentId: string;
  teamName: string;
  player1Name: string;
  player2Name: string;
  categoryTariff: TournamentCategoryTariff;
  feeAmount: number; // e.g. 500.000, 550.000, 650.000
  paymentDate: string;
  bankReference: string;
  status: 'PAID_ACTIVE' | 'REFUNDED' | 'WITHDRAWN';
  sal06JournalId: string;
}

export interface TournamentEventRecord {
  id: string;
  code: string; // e.g. 'TOURNAMENT-PB-OCT2026'
  name: string;
  registrationOpenDate: string;
  executionStartDate: string;
  executionEndDate: string;
  status: 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'SETTLED';
  participants: TournamentRegistrationParticipant[];
  totalDepositsCollected: number; // Total credited to 2-1301
  totalRefundsApproved: number;    // Refunded to Mandiri via SAL-07
  netRevenueRecognized: number;    // Reclassified to 4-1102 via SAL-07
  sal07JournalId?: string;
  settledAt?: string;
}

export interface BentengSharingAccrual {
  id: string;
  batchNumber: string; // e.g. 'SHR-BTG-20260920-01'
  ruleCode: 'SAL-08';
  date: string;
  unitId: 'U003';
  locationId: 'L005';
  periodLabel: string;
  grossSalesTurnover: number;
  sharingPercentage: number; // 0.15 (15%)
  accrualAmount: number; // 15% * grossSalesTurnover
  glJournalId: string;
  processedBy: string;
}
