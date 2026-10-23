/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 4 Type Definitions: Cash Advance Subledger (CA-01 s/d CA-03) &
 * Rekonsiliasi Bank + Eliminasi Non-Omzet (FIN-01, FIN-02).
 * 
 * Compliant with Blueprint V1.3: FLOW-11, REQ-016, REQ-037, REQ-040, UAT-029, UAT-035, UAT-038.
 */

import { BusinessUnitId, PhysicalLocationId } from './module1';

export type CAPurpose = 'OPERATIONAL_MONTHLY' | 'EVENT_TOURNAMENT';
export type CABatchStatus = 'ACTIVE' | 'SETTLED';

export interface CARealizationItem {
  id: string;
  date: string;
  receiptNumber: string;
  vendorOrMerchant: string;
  description: string;
  itemCategory: 
    | 'RAW_MATERIAL_STOCK' 
    | 'CREW_MEAL' 
    | 'GAS_LPG' 
    | 'FREIGHT' 
    | 'SMALL_SUPPLIES' 
    | 'EVENT_OPEX' 
    | 'OTHER_OPEX';
  targetAccountKey: string;
  targetAccountCode: string;
  amount: number;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  isStockItem: boolean;
  sku?: string;
  qty?: number;
  unitPrice?: number;
}

export interface CashAdvanceBatch {
  id: string;
  caBatchId: string; // e.g. 'CA-2026-09-ABE'
  picName: string; // e.g. 'Abe Riza Kurniawan'
  purpose: CAPurpose;
  dateDisbursed: string;
  disbursedBank: 'BANK_MANDIRI' | 'BANK_BNI';
  topUpAmount: number;
  realizedAmount: number;
  returnedAmount: number;
  remainingBalance: number; // topUpAmount - realizedAmount - returnedAmount
  status: CABatchStatus;
  ca01JournalId: string;
  realizationItems: CARealizationItem[];
  ca02JournalIds: string[];
  ca03JournalIds: string[];
  notes?: string;
}

export type BankMutationCategory = 
  | 'PENDAPATAN_TURNEY'
  | 'PENDAPATAN_OPERASIONAL_NON_TURNEY'
  | 'PENERIMAAN_NON_OMZET'
  | 'PENGELUARAN_OPERASIONAL'
  | 'UNKNOWN';

export type NonRevenueSubtype = 
  | 'LOAN_PT_DKSI'
  | 'OWNER_ADVANCE'
  | 'INTERBANK_TRANSFER'
  | 'BANK_INTEREST'
  | 'CA_RETURN';

export interface BankStatementLine {
  id: string;
  bankAccount: 'BANK_BNI' | 'BANK_MANDIRI';
  accountNumber: '2017204912' | '1360036961297';
  date: string;
  description: string;
  mutationType: 'CR' | 'DB';
  amount: number;
  balanceAfter: number;
  referenceNo: string;
  category: BankMutationCategory;
  nonRevenueSubtype?: NonRevenueSubtype;
  reconciliationStatus: 'UNRECONCILED' | 'RECONCILED' | 'POSTED_GL';
  glJournalId?: string;
  isEliminatedFromRevenue: boolean; // Confirms UAT-029/035/038 compliance
}

export interface NonRevenuePostingResult {
  success: boolean;
  ruleCode: 'FIN-01' | 'FIN-02';
  statementLineId: string;
  glJournalId?: string;
  creditAccountKey: string;
  creditAccountCode: string;
  amount: number;
  error?: string;
}
