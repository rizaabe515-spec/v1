/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 1: Role-Based Access Control (RBAC) & Segregation of Duties (SoD) Service
 * Sesuai REQ-026 dan UAT-002.
 */

import { UserAccount, UserRole, Permission } from '../types/module1';

export const SYSTEM_USERS: UserAccount[] = [
  {
    userId: 'USR-001',
    username: 'maya.pertiwi',
    fullName: 'Maya Pertiwi, SE, Ak',
    role: 'FINANCE_CONTROLLER',
    assignedUnitId: 'U009',
    assignedLocationId: 'L002',
    permissions: [
      'APPROVE_JOURNAL',
      'REVERSE_JOURNAL',
      'CLOSE_PERIOD',
      'OPEN_PERIOD',
      'OVERRIDE_HOLD',
      'APPROVE_OPNAME',
      'MANAGE_COA',
      'VIEW_REPORTS',
      'VIEW_AUDIT_LOGS',
      'VIEW_ALL'
    ],
    isActive: true
  },
  {
    userId: 'USR-002',
    username: 'rizky.maker',
    fullName: 'Rizky Ramadhan (Accounting Staff)',
    role: 'ACCOUNTING_STAFF',
    assignedUnitId: 'U009',
    assignedLocationId: 'L002',
    permissions: [
      'DRAFT_JOURNAL',
      'POST_JOURNAL',
      'CREATE_PO',
      'VIEW_REPORTS',
      'VIEW_ALL'
    ],
    isActive: true
  },
  {
    userId: 'USR-003',
    username: 'arya.barista',
    fullName: 'Arya Saputra (Head Barista Salatiga)',
    role: 'CASHIER_OPERATOR',
    assignedUnitId: 'U002',
    assignedLocationId: 'L003',
    permissions: [
      'POS_TRANSACTION',
      'DRAFT_JOURNAL'
    ],
    isActive: true
  },
  {
    userId: 'USR-004',
    username: 'budi.gudang',
    fullName: 'Budi Santoso (Logistik & Gudang Pusat)',
    role: 'WAREHOUSE_STAFF',
    assignedUnitId: 'U009',
    assignedLocationId: 'L002',
    permissions: [
      'CREATE_GR',
      'DRAFT_JOURNAL'
    ],
    isActive: true
  },
  {
    userId: 'USR-005',
    username: 'hendra.auditor',
    fullName: 'Dr. Hendra Wijaya (Komisaris & Auditor)',
    role: 'AUDITOR_COMMISSIONER',
    assignedUnitId: 'U009',
    permissions: [
      'VIEW_REPORTS',
      'VIEW_AUDIT_LOGS',
      'VIEW_ALL'
    ],
    isActive: true
  }
];

export const USER_MAP = new Map<string, UserAccount>(
  SYSTEM_USERS.map(u => [u.userId, u])
);

export function getUserById(userId: string): UserAccount | undefined {
  return USER_MAP.get(userId);
}

export function getUserByUsername(username: string): UserAccount | undefined {
  return SYSTEM_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function hasPermission(user: UserAccount, permission: Permission): boolean {
  if (!user.isActive) return false;
  return user.permissions.includes(permission) || user.permissions.includes('VIEW_ALL');
}

/**
 * Enforces Segregation of Duties (SoD) - Rule UAT-002
 * Maker and Approver cannot be the same user for transactions requiring approval.
 */
export function assertSegregationOfDuties(makerUserId: string, approverUserId?: string): void {
  if (!approverUserId) {
    return; // Transaction does not have an approver assigned yet
  }

  if (makerUserId.trim() === approverUserId.trim()) {
    throw new Error(
      `[UAT-002 SoD Violation] Segregation of Duties failed: Maker cannot approve their own journal posting (Maker: '${makerUserId}', Approver: '${approverUserId}'). Maker and Approver must be distinct authorized users.`
    );
  }

  const approver = getUserById(approverUserId);
  if (approver && !approver.permissions.includes('APPROVE_JOURNAL')) {
    throw new Error(
      `[UAT-002 Permission Error] Approver user '${approver.fullName}' does not hold 'APPROVE_JOURNAL' permission.`
    );
  }
}
