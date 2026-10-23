/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 1: Account Resolver Service
 * 
 * Mengimplementasikan aturan REQ-023 dan G-11:
 * - Mengambil nomor COA definitif berdasarkan AccountKey logis dari sheet Mapping_COA_Final.
 * - Melempar Blocking Exception [G-11] jika AccountKey belum terpetakan atau tidak aktif.
 * - Mendukung Contextual Dynamic Account Resolution (misal PBJT_PAYABLE, COGS_SALES, REV_BANK_INTEREST).
 */

import { MAPPING_COA_MAP, DEFINITIVE_CODE_MAP } from '../constants/mappingCoaFinal';
import { AccountKeyConfig, AccountResolutionContext } from '../types/module1';

export class BlockingAccountException extends Error {
  public code: string;
  public accountKey: string;

  constructor(message: string, accountKey: string) {
    super(`[G-11 Blocking Exception] ${message}`);
    this.name = 'BlockingAccountException';
    this.code = 'G-11';
    this.accountKey = accountKey;
  }
}

export interface ResolvedAccountInfo {
  accountCode: string;
  accountKey: string;
  accountName: string;
  category: string;
  normalBalance: 'DEBIT' | 'CREDIT';
  description: string;
  isContextResolved: boolean;
  contextRuleApplied?: string;
}

/**
 * Resolves logical AccountKey into definitive COA Code and metadata
 * Enforces Rule G-11: Throws Blocking Exception if key does not exist or is inactive.
 */
export function resolveAccount(
  accountKey: string,
  context?: AccountResolutionContext
): ResolvedAccountInfo {
  if (!accountKey || typeof accountKey !== 'string') {
    throw new BlockingAccountException('AccountKey cannot be empty or undefined.', accountKey || 'EMPTY');
  }

  const normalizedKey = accountKey.trim().toUpperCase();
  const config = MAPPING_COA_MAP.get(normalizedKey);

  if (!config) {
    throw new BlockingAccountException(
      `AccountKey '${normalizedKey}' is not mapped in Mapping_COA_Final V1.3. Operation blocked to prevent ledger corruption.`,
      normalizedKey
    );
  }

  if (!config.isActive) {
    throw new BlockingAccountException(
      `AccountKey '${normalizedKey}' exists but is marked as INACTIVE. Posting prohibited.`,
      normalizedKey
    );
  }

  let finalCode = config.definitiveAccountCode;
  let finalName = config.accountName;
  let isContextResolved = false;
  let contextRuleApplied: string | undefined = undefined;

  // Contextual Dynamic Rules Resolution
  if (config.hasContextualResolution && context) {
    // 1. PBJT_PAYABLE context resolution
    if (normalizedKey === 'PBJT_PAYABLE') {
      if (context.unitId === 'U001') {
        finalCode = '2-1201';
        finalName = 'Hutang PBJT Lapangan Padel (U001)';
        contextRuleApplied = 'Resolved to 2-1201 based on unit U001 (Padel Court)';
        isContextResolved = true;
      } else if (context.unitId === 'U002' || context.unitId === 'U003') {
        finalCode = '2-1202';
        finalName = 'Hutang PBJT Resto / F&B (U002/U003)';
        contextRuleApplied = 'Resolved to 2-1202 based on F&B unit (Resto/Cafe)';
        isContextResolved = true;
      }
    }

    // 2. COGS_SALES context resolution (Bar vs Kitchen)
    if (normalizedKey === 'COGS_SALES') {
      if (context.locationId === 'L003') {
        finalCode = '5-1101';
        finalName = 'HPP Penjualan Minuman Bar Salatiga';
        contextRuleApplied = 'Resolved to 5-1101 for Bar location L003';
        isContextResolved = true;
      } else if (context.locationId === 'L004') {
        finalCode = '5-1102';
        finalName = 'HPP Penjualan Makanan Kitchen Salatiga';
        contextRuleApplied = 'Resolved to 5-1102 for Kitchen location L004';
        isContextResolved = true;
      } else if (context.locationId === 'L005') {
        finalCode = '5-1101';
        finalName = 'HPP Penjualan F&B Coffee Benteng';
        contextRuleApplied = 'Resolved to 5-1101 for Coffee Benteng L005';
        isContextResolved = true;
      }
    }

    // 3. REV_BANK_INTEREST (Income vs Administrative Expense)
    if (normalizedKey === 'REV_BANK_INTEREST') {
      if (context.transactionSide === 'CREDIT') {
        finalCode = '7-1101';
        finalName = 'Pendapatan Bunga Jasa Giro Bank';
        contextRuleApplied = 'Resolved to 7-1101 (Income) on CREDIT';
        isContextResolved = true;
      } else if (context.transactionSide === 'DEBIT') {
        finalCode = '7-2101';
        finalName = 'Beban Administrasi Bank Lainnya';
        contextRuleApplied = 'Resolved to 7-2101 (Expense) on DEBIT';
        isContextResolved = true;
      }
    }
  }

  return {
    accountCode: finalCode,
    accountKey: config.accountKey,
    accountName: finalName,
    category: config.category,
    normalBalance: config.normalBalance,
    description: config.description,
    isContextResolved,
    contextRuleApplied
  };
}

/**
 * Reverse-lookup: resolves account code back to its logical key
 */
export function resolveCodeToKey(accountCode: string): AccountKeyConfig | undefined {
  return DEFINITIVE_CODE_MAP.get(accountCode);
}
