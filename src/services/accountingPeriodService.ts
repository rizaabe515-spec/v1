/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 1: Accounting Period Service (Validasi Periode Terbuka)
 * Sesuai REQ-025 dan UAT-031.
 */

import { AccountingPeriod } from '../types/module1';

export const INITIAL_ACCOUNTING_PERIODS: AccountingPeriod[] = [
  {
    periodMonth: '2026-07',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'CLOSED',
    closedAt: '2026-07-31T23:59:59Z',
    closedBy: 'USR-001 (Maya Pertiwi)'
  },
  {
    periodMonth: '2026-08',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'CLOSED',
    closedAt: '2026-08-31T23:59:59Z',
    closedBy: 'USR-001 (Maya Pertiwi)'
  },
  {
    periodMonth: '2026-09',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'OPEN'
  },
  {
    periodMonth: '2026-10',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    status: 'OPEN'
  },
  {
    periodMonth: '2026-11',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    status: 'OPEN'
  }
];

class AccountingPeriodManager {
  private periods: AccountingPeriod[] = [...INITIAL_ACCOUNTING_PERIODS];

  public getPeriods(): AccountingPeriod[] {
    return [...this.periods];
  }

  public getPeriod(periodMonth: string): AccountingPeriod | undefined {
    return this.periods.find(p => p.periodMonth === periodMonth);
  }

  public extractPeriodFromDate(dateStr: string): string {
    // Expected date format YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1]}`;
    }
    return dateStr.substring(0, 7);
  }

  public isPeriodOpen(dateStrOrPeriod: string): boolean {
    const periodMonth = dateStrOrPeriod.length > 7 
      ? this.extractPeriodFromDate(dateStrOrPeriod) 
      : dateStrOrPeriod;

    const period = this.getPeriod(periodMonth);
    // If period is not registered yet, default to OPEN for future periods, but check registered ones
    if (!period) return true;
    return period.status === 'OPEN';
  }

  /**
   * Enforces Rule UAT-031: Throws blocking error if period is CLOSED
   */
  public assertPeriodIsOpen(dateStr: string): void {
    const periodMonth = this.extractPeriodFromDate(dateStr);
    const period = this.getPeriod(periodMonth);

    if (period && period.status === 'CLOSED') {
      throw new Error(
        `[UAT-031 Period Error] Cannot post journal to date '${dateStr}'. Accounting period '${periodMonth}' is CLOSED (Closed by ${period.closedBy || 'Finance'}). Posting to closed periods is strictly forbidden.`
      );
    }
  }

  public closePeriod(periodMonth: string, actorName: string): { success: boolean; error?: string } {
    const period = this.getPeriod(periodMonth);
    if (!period) {
      return { success: false, error: `Period ${periodMonth} not found.` };
    }
    if (period.status === 'CLOSED') {
      return { success: false, error: `Period ${periodMonth} is already CLOSED.` };
    }

    period.status = 'CLOSED';
    period.closedAt = new Date().toISOString();
    period.closedBy = actorName;
    return { success: true };
  }

  public openPeriod(periodMonth: string): { success: boolean; error?: string } {
    const period = this.getPeriod(periodMonth);
    if (!period) {
      return { success: false, error: `Period ${periodMonth} not found.` };
    }
    period.status = 'OPEN';
    period.closedAt = undefined;
    period.closedBy = undefined;
    return { success: true };
  }
}

export const accountingPeriodManager = new AccountingPeriodManager();
