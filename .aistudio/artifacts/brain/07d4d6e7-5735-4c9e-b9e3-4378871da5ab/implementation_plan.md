# PT Sport Universal Indonesia (Padel Beans) ERP — Multi-Unit Financial, Inventory & Operations Architecture

A single-ledger, multi-dimensional ERP system engineered for PT Sport Universal Indonesia (Padel Beans), strictly compliant with `Blueprint_ERP_PadelBeans_Mapping_COA_Finalisasi_V1_3_Ready_For_Coding.xlsx`. It unifies sports court booking, multi-station cafe and kitchen POS, tournament management, inventory procurement with 3-way matching, and periodic HPP valuation under an immutable General Ledger.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following system decisions have been confirmed and incorporated into the design:

- **Confirmed Decision 1 (Sample Data)**: Initialized with comprehensive realistic demo transactions across U001, U002, U003, and U009—including cross-month tournament registrations, PO-to-GR-to-Bill matching, and month-end Stock Opname cycles to demonstrate the accounting engine immediately.
- **Confirmed Decision 2 (Operational Modules)**: Full front-office integration alongside the back-office core: Court Booking & Schedule Manager, Multi-station Bar/Kitchen POS, and Tournament Registration with Cross-Month Deferred Revenue accounting.
- **Confirmed Decision 3 (Aesthetic Direction)**: High-density corporate ERP cockpit with dark mode toggle, tabular typography (`tabular-nums`), subtle 1px dividers, and strict 60-30-10 palette discipline without decorative clutter.

---

## 1. Overview & Core Concept

### What It Does
The Padel Beans ERP serves as the authoritative operational and financial backbone for PT Sport Universal Indonesia. It enforces:
1. **Single General Ledger (Single GL)**: All transactions feed one unified double-entry ledger tagged with Business Unit (`U001`–`U009`) and Physical Location (`L001`–`L005`).
2. **Periodic Inventory & Disabled Perpetual COGS**: Strictly deactivates perpetual POS COGS (`STK-06`). Inbound goods debit `5-1100 Pembelian Persediaan Periodik` against `2-1104 GRNI`. Official GL HPP posting occurs once a month via `STK-07` after physical Stock Opname approval using Weighted Average valuation.
3. **Automated 3-Way Matching (PO — GR — Bill)**: Strict auto-pass tolerance ($\le 1\%$ and $\le \text{Rp } 50.000$ variance, $0\%$ over-billing on unbilled received quantities).
4. **Anti-Fake-Revenue Protections**: Enforces liability booking (`2-1301`) for tournament pre-payments, reclassifying to revenue (`4-1102`) only post-event net of refunds. Prohibits non-revenue inflows (cash advance refunds `1-1401`, related-party loans `2-1401`, owner equity/talangan `3-1102`, interbank transfers `1-1104`) from inflating revenue accounts or POS turnover.
5. **Maker-Checker Governance & Immutability**: All postings are append-only with idempotency keys; adjustments require linked reversal journals (`REV-xxxx`).

### Target Audience & Personas
- **Finance Controller / Head of Accounting**: Validates 3-way matching exceptions, approves monthly stock opnames, posts `STK-07` HPP journals, and audits multi-unit trial balances.
- **Unit Operational Managers (Court, Bar, Kitchen, Benteng)**: Oversees court bookings, manages POS shifts, executes daily transfers from Central Warehouse, and performs physical stock counts.
- **Executive Directors / Owners**: Reviews consolidated P&L, per-unit contribution margins with report-only common cost allocation (`U009`), and real-time cash position.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Financial Overview & Single GL Explorer**:
   - Consolidated Balance Sheet, Multi-Unit P&L (with `U009` allocation matrix), and Drill-Down General Ledger with real-time balance checks ($\sum \text{Debit} = \sum \text{Credit}$).
2. **Purchasing & 3-Way Matching Cockpit**:
   - Purchase Order creation $\rightarrow$ Goods Receipt (`GR-01`: Dr 5-1100 / Cr 2-1104) $\rightarrow$ Vendor Bill Entry with tolerance check ($\le 1\%$ & $\le \text{Rp } 50.000$). Over-billing triggers automated HOLD status requiring Finance sign-off.
3. **Periodic Inventory & Stock Opname Hub**:
   - Stock subledger by SKU and location (`L001`–`L005`), non-GL daily/weekly estimated HPP previews, and month-end Stock Opname discrepancy review that generates the formal `STK-07` GL journal.
4. **Operations: Court Booking & Cross-Month Tournaments**:
   - Court reservation calendar, participant registration with upfront fee posting to `2-1301`, and tournament closing settlement engine (`SAL-07`) calculating net revenue post-refunds.
5. **Front-Office POS (Bar, Kitchen, Benteng)**:
   - Fast-service order entry recording sales to respective revenue accounts (`4-1103`, `4-1104`, `4-1105`) and Cash/Bank accounts, completely decoupled from perpetual inventory GL deductions.

### Visual Identity & Theme
- **Aesthetic Direction**: High-density corporate ERP cockpit. Flat surfaces, hairline borders (`border-slate-800`), dark slate canvas (`#0b0f17` in dark mode, `#f8fafc` in light mode).
- **Color Discipline (60-30-10)**:
  - 60% Canvas: Neutral dark slate (`#0B0F17`)
  - 30% Structural: Card/Table surface (`#111827`), dividers (`#1F2937`), muted labels (`#94A3B8`)
  - 10% Accent: Padel Beans Emerald (`#10B981`) for approved states, Amber (`#F59E0B`) for matching review/HOLD, Crimson (`#EF4444`) for variance alerts.
- **Typography**: Display headings in `Plus Jakarta Sans` / `Outfit`, body in `DM Sans`, and all financial metrics, journal accounts, and ledger rows strictly in monospace tabular figures (`font-mono tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Strict Logical AccountKey Mapping Engine**
  - *Approach*: Implement a centralized dictionary of 58 standard AccountKeys conforming to the Padel Beans COA blueprint. All transaction generators query logical keys (e.g., `ACCOUNT_KEYS.PURCHASE_PERIODIC = "5-1100"`, `ACCOUNT_KEYS.GRNI = "2-1104"`), preventing hardcoded string drift.
  - *Why*: Eliminates ledger corruptions, ensures auditability, and allows seamless COA revisions.
- **Decision 2: Periodic HPP vs Perpetual Simulation**
  - *Approach*: Hard lock disabling `STK-06`. POS transactions do not write GL cost entries. An in-memory analytics engine calculates real-time estimated HPP for management dashboards, while the GL remains pristine until `STK-07` is posted.
  - *Why*: Direct compliance with client mandate and Indonesian F&B / sports club operational reality where recipe variance and kitchen waste make perpetual GL posting inaccurate.
- **Decision 3: Report-Only Common Cost Allocation (`U009`)**
  - *Approach*: Shared overheads tagged with `U009` are recorded in the GL under `U009`. On management P&L reports, an allocation matrix dynamically distributes `U009` expenses across revenue units (`U001` 40%, `U002` 35%, `U003` 25%) without generating synthetic GL journals.
  - *Why*: Maintains a clean, single audit trail in the General Ledger while providing realistic unit-level profitability.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│               PT Sport Universal Indonesia (Padel Beans)               │
│                     Unified Single GL ERP Engine                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ Front-Office Ops      │ │ Purchasing & Matching │ │ Inventory & HPP       │
│ • Court Booking       │ │ • Purchase Orders     │ │ • Multi-Location Stock│
│ • F&B Multi-POS       │ │ • Goods Receipt(GR-01)│ │ • Non-GL Daily HPP    │
│ • Tournament (SAL-06) │ │ • 3-Way Match Engine  │ │ • Monthly Opname      │
└───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
            │                         │                         │
            ▼                         ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Logical AccountKey Mapping Layer                    │
│             (58 Blueprint AccountKeys & Anti-Fraud Rules)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Single General Ledger (Immutable Store)                 │
│  • Balanced Dr = Cr   • Idempotency Keys   • Maker != Approver Rules   │
│  • Business Unit (U001-U009)               • Physical Location (L001-L005)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Financial Statements & Management Deck                 │
│  • Consolidated Balance Sheet              • Multi-Unit P&L Matrix    │
│  • Report-Only U009 Overhead Allocation    • Audit Trail & Reversals  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Core Entities
1. **Dimensions**:
   - `BusinessUnit`: `U001` (Padel Court), `U002` (Coffee & Resto Salatiga), `U003` (Coffee Benteng), `U009` (Shared/Common).
   - `PhysicalLocation`: `L001` (Court Ops), `L002` (Gudang Pusat), `L003` (Bar Salatiga), `L004` (Kitchen Salatiga), `L005` (Coffee Benteng).
2. **Ledger**:
   - `GLJournalEntry`: `id`, `journalNumber`, `date`, `ruleCode` (e.g., `GR-01`, `SAL-06`, `STK-07`), `reference`, `idempotencyKey`, `status` (`DRAFT`, `POSTED`, `REVERSED`), `createdDate`, `createdBy`, `approvedBy`.
   - `GLJournalLine`: `id`, `journalId`, `accountCode`, `accountName`, `accountKey`, `debit`, `credit`, `unitId`, `locationId`, `description`.
3. **Purchasing & 3-Way Match**:
   - `PurchaseOrder`, `GoodsReceipt`, `VendorBill`. Lines track PO unit price, GR received quantity, and Bill invoiced price/quantity. Statuses: `MATCHED`, `EXCEPTION_HOLD`, `APPROVED`.
4. **Tournaments & Anti-Fraud Registry**:
   - `TournamentEvent`: Track upfront payments credited to `2-1301`, participants, refunds, and closing journal to `4-1102`.
   - Prohibited revenue inflow validation intercepts all deposit types.

---

## 5. Implementation Phases & Milestones

- **Phase 1: Modul 1 — Master Dimensi, 58 AccountKey COA, RBAC & Core GL Posting Engine (COMPLETED)**
  - Implemented `src/constants/masterDimensions.ts` (`U001`, `U002`, `U003`, `U009`, `L001`–`L005`).
  - Implemented `src/constants/mappingCoaFinal.ts` (Full 58 Logical AccountKeys).
  - Implemented `src/services/accountResolver.ts` (G-11 Blocking Exception, contextual resolution).
  - Implemented `src/services/rbacService.ts` and `src/services/accountingPeriodService.ts` (UAT-031).
  - Implemented `src/services/coreGlEngine.ts` (Double-entry balance zero-tolerance, idempotency, append-only reversal).
  - Interactive Modul 1 cockpit & live UAT test runner in `src/views/Modul1EngineView.tsx`.

- **Phase 2: Modul 2 — Configurable Tax Matrix, Sales & Settlement, Tournaments & Benteng Accrual (COMPLETED)**
  - Implemented `src/services/taxMatrixService.ts` with anti-overlap date range validation (UAT-034), inclusive (`DPP = Gross / 1.1`, UAT-007) and exclusive (UAT-006) calculation.
  - Implemented `src/services/salesEventEngine.ts` with:
    * `SAL-01`: Cash POS (Dr 1-1101 / Cr Rev + Cr PBJT 2-1201/2-1202)
    * `SAL-02`: Non-Cash POS (Dr 1-1201 Payment Clearing / Cr Rev + Cr PBJT)
    * `SAL-03`: Corporate Credit Invoice (Dr 1-1202 Piutang Usaha)
    * `SAL-04`: Settlement Disbursement with MDR Fee (Dr Bank 1-1102/1-1103 + Dr 6-1301 MDR / Cr 1-1201 Clearing)
    * `SAL-05`: Sales Refund linked to original sale ID (Dr 4-1901 + Dr 2-1201/2 / Cr Bank/Clearing/Refund Payable 2-1106)
    * `SAL-06` & `SAL-07`: Cross-Month Tournament upfront fee into 2-1301 liability, and post-event zero-balance reconciliation net of refunds
    * `SAL-08`: 15% Coffee Benteng turnover sharing accrual into Dr 6-1403 / Cr 2-1105
  - Interactive Modul 2 cockpit & automated UAT test runner in `src/views/Modul2SalesTaxView.tsx`.

- **Phase 3: Modul 3 — Procure-to-Pay (P2P), Receiving Periodik, 3-Way Match & Vendor Payments (COMPLETED)**
  - Implemented `src/types/purchasingAndP2P.ts` and `src/services/procurementEngine.ts`.
  - Non-Posting PR & PO Workflow (`PUR-01`, `PUR-02`) with approval tiers (Tier 1 $\le$ 5M, Tier 2 $\le$ 25M, Tier 3 $>$ 25M) and anti-splitting alert detection (`REQ-010`, `REQ-032`, `UAT-010`). Zero GL journal entry generated.
  - Inbound Receiving (`GR-01`, `GR-02`):
    * `GR-01`: Dr 5-1100 `PERIODIC_PURCHASE` / Cr 2-1104 `GRNI`. STRICT RULE: Never debiting 1-1301..1-1305 during receiving (`REQ-011`, `UAT-011`). Subledger stock updated at receiving location.
    * `GR-02`: Dr 1-150x Aset/CIP / Cr 2-1104 `GRNI`.
  - 3-Way Matching Engine (`REQ-012..014`, `UAT-012..016`):
    * Duplicate invoice shield (`vendorId + invoiceNumber`, `UAT-016`).
    * 0% Qty Over-Billing tolerance vs accepted unbilled GR quantity (`UAT-015`, status `HOLD_OVERBILL_QTY`).
    * Cumulative Price tolerance: Auto-pass ONLY if $\le 1\%$ AND $\le \text{Rp } 50.000$ (`UAT-013`), otherwise `HOLD_PRICE_VARIANCE` requiring Finance approval override (`UAT-014`).
    * `BILL-01`: Dr 2-1104 GRNI, Dr/Cr 5-1100 Price Variance, Dr 1-1403 PPN Masukan, Cr 2-1102 AP Persediaan.
    * `BILL-02`: Dr 6-xxxx Beban (PLN `6-1201`, WiFi `6-1202`, Gas `6-1203`, Water `6-1204`) / Cr 2-1101 AP Umum.
    * `BILL-03`: Dr 2-1104 GRNI Aset / Cr 2-1103 AP Capex.
    * `BILL-CRN`: Dr 2-1102 AP Persediaan / Cr 5-1100 + Cr 1-1403, and stock subledger deduction.
  - Vendor Payments & Advances (`REQ-015`, `UAT-017`, `UAT-018`):
    * `PAY-01`: Dr 2-1101/2-1102/2-1103 AP Vendor + Dr 6-1301 Bank Fee / Cr Bank 1-1102/1-1103.
    * `PAY-02`: Dr 1-1402 Supplier Advance / Cr Bank 1-1102/1-1103.
    * `PAY-03`: Dr 2-1101/2-1102/2-1103 AP Vendor / Cr 1-1402 Supplier Advance.
  - Interactive Cockpit & Automated UAT Test Suite in `src/views/PurchasingMatchingView.tsx`.

- **Phase 4: Modul 4 — Cash Advance Subledger (CA-01..03) & Rekonsiliasi Bank + Eliminasi Non-Omzet (COMPLETED)**
  - Implemented `src/types/cashAdvanceAndBanking.ts`, `src/services/cashAdvanceService.ts`, and `src/services/bankReconciliationService.ts`.
  - Cash Advance Lifecycle (`FLOW-11`, `REQ-037`):
    * `CA-01`: Top-Up pencairan Dr 1-1401 `EMPLOYEE_ADVANCE` / Cr 1-1103 Mandiri. Zero expense recognition upon top-up.
    * `CA-02`: Realisasi nota belanja per item: Dr 5-1100 `PERIODIC_PURCHASE` (stok) + Dr 6-xxxx (OpEx: `6-1104` crew meal, `6-1203` gas, `6-1303` freight, `6-1305` small supplies, `6-1307` event) / Cr 1-1401. Real-time subledger inventory update.
    * `CA-03`: Setoran pengembalian sisa kas: Dr 1-1103 Mandiri / Cr 1-1401 `EMPLOYEE_ADVANCE`.
    * STRICT RULE (`UAT-035`): Hardcoded protection blocking CA returns from ever crediting revenue accounts (`4-xxxx`).
  - Bank Reconciliation & Non-Revenue Elimination (`REQ-016`, `REQ-040`, `UAT-029`, `UAT-038`):
    * Bank BNI (`2017204912`) & Bank Mandiri (`1360036961297`) statement parsers with anti-duplicate import protection.
    * 3-Pillar auto-classification: `PENDAPATAN_TURNEY` (SAL-06/07), `PENDAPATAN_OPERASIONAL_NON_TURNEY` (SAL-04), and `PENERIMAAN_NON_OMZET` (FIN-01/02).
    * `FIN-01`: PT DKSI loan elimination (Cr 2-1401 `LOAN_RELATED_PARTY`), Owner advance (Cr 3-1102 `OWNER_ADVANCE_EQUITY`), Inter-bank transit (Cr 1-1104 `BANK_TRANSFER_TRANSIT` with net zero balance).
    * `FIN-02`: Bank interest credit (Cr 7-1101 `REV_BANK_INTEREST`) and withholding tax (Dr 7-2101 Pajak Bunga 20%).
  - Interactive Cockpit & Automated UAT Test Suite in `src/views/Modul4CashAdvanceBankingView.tsx`.
