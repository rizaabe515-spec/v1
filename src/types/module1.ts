/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 1 Type Definitions: Master Data Dimensi, Konfigurasi 58 AccountKey COA,
 * Role-Based Access Control (RBAC), Periode Akuntansi, dan Core GL Posting Engine.
 * 
 * Compliant with Blueprint_ERP_PadelBeans_Mapping_COA_Finalisasi_V1_3_Ready_For_Coding.xlsx
 */

export type BusinessUnitId = 'U001' | 'U002' | 'U003' | 'U009';
export type PhysicalLocationId = 'L001' | 'L002' | 'L003' | 'L004' | 'L005';

export interface MasterUnit {
  unitId: BusinessUnitId;
  unitCode: string;
  unitName: string;
  unitType: 'REVENUE' | 'SHARED_COST';
  description: string;
  historicalAliases: string[];
  isActive: boolean;
}

export interface MasterLokasi {
  locationId: PhysicalLocationId;
  locationCode: string;
  locationName: string;
  primaryParentUnitId: BusinessUnitId;
  hasStockControl: boolean;
  addressCity: string;
  description: string;
  isActive: boolean;
}

export interface MapUnitLokasi {
  id: string;
  unitId: BusinessUnitId;
  locationId: PhysicalLocationId;
  relationshipType: 'PRIMARY_OPERATION' | 'SHARED_WAREHOUSE' | 'DEDICATED_STATION';
  stockControlEnabled: boolean;
  notes: string;
}

export type NormalBalance = 'DEBIT' | 'CREDIT';

export type AccountCategory = 
  | 'ASSET_CURRENT' 
  | 'ASSET_NON_CURRENT' 
  | 'LIABILITY_CURRENT' 
  | 'LIABILITY_NON_CURRENT' 
  | 'EQUITY' 
  | 'REVENUE' 
  | 'COGS_PERIODIC' 
  | 'EXPENSE_OPERATIONAL' 
  | 'OTHER_INCOME_EXPENSE';

export interface AccountKeyConfig {
  accountKey: string;
  definitiveAccountCode: string;
  accountName: string;
  category: AccountCategory;
  normalBalance: NormalBalance;
  description: string;
  hasContextualResolution?: boolean;
  contextRulesNotes?: string;
  isActive: boolean;
  isBankCash?: boolean;
  isRevenue?: boolean;
  isInventoryAsset?: boolean;
}

export interface AccountResolutionContext {
  unitId?: BusinessUnitId;
  locationId?: PhysicalLocationId;
  transactionSide?: 'DEBIT' | 'CREDIT';
  lineType?: 'FOOD' | 'BEVERAGE' | 'PADEL' | 'OTHER';
}

export type UserRole = 
  | 'ADMIN_FINANCE' 
  | 'FINANCE_CONTROLLER' 
  | 'ACCOUNTING_STAFF' 
  | 'CASHIER_OPERATOR' 
  | 'WAREHOUSE_STAFF' 
  | 'AUDITOR_COMMISSIONER';

export type Permission = 
  | 'POST_JOURNAL' 
  | 'APPROVE_JOURNAL' 
  | 'REVERSE_JOURNAL' 
  | 'DRAFT_JOURNAL' 
  | 'CLOSE_PERIOD' 
  | 'OPEN_PERIOD' 
  | 'OVERRIDE_HOLD' 
  | 'APPROVE_OPNAME' 
  | 'CREATE_PO' 
  | 'CREATE_GR' 
  | 'POS_TRANSACTION' 
  | 'MANAGE_COA' 
  | 'VIEW_REPORTS' 
  | 'VIEW_AUDIT_LOGS' 
  | 'VIEW_ALL';

export interface UserAccount {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
  assignedUnitId?: BusinessUnitId;
  assignedLocationId?: PhysicalLocationId;
  permissions: Permission[];
  isActive: boolean;
}

export type AccountingPeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

export interface AccountingPeriod {
  periodMonth: string; // format 'YYYY-MM'
  startDate: string;
  endDate: string;
  status: AccountingPeriodStatus;
  closedAt?: string;
  closedBy?: string;
  lockedReason?: string;
}

export interface CoreGLLinePayload {
  accountKey?: string;
  accountCode?: string; // either accountKey or direct accountCode must be provided
  debit: number;
  credit: number;
  unitId: BusinessUnitId;
  locationId?: PhysicalLocationId;
  description: string;
}

export interface CoreGLJournalPayload {
  sourceEventId: string; // e.g. 'EVT-GR-20260901-01'
  sourceDocNo: string;    // e.g. 'GR-2026-09-001'
  ruleCode: string;       // e.g. 'GR-01', 'AP-01', 'SAL-06', 'STK-07'
  date: string;           // YYYY-MM-DD
  reference: string;
  description: string;
  lines: CoreGLLinePayload[];
  makerUserId: string;
  approverUserId?: string;
  requiresApproval?: boolean;
}

export interface JournalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  ruleCode: string;
  balanceDiff: number;
}
