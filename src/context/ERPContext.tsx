import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GLJournalEntry, 
  StockItem, 
  PurchaseOrder, 
  GoodsReceipt, 
  VendorBill, 
  TournamentEvent, 
  CourtBooking, 
  POSTransaction, 
  NonRevenueTransaction, 
  StockOpnameSession,
  BusinessUnitId,
  PhysicalLocationId,
  POLine,
  GRLine
} from '../types/erp';
import { 
  INITIAL_GL_JOURNALS, 
  INITIAL_STOCK_ITEMS, 
  INITIAL_PURCHASE_ORDERS, 
  INITIAL_GOODS_RECEIPTS, 
  INITIAL_VENDOR_BILLS, 
  INITIAL_TOURNAMENTS, 
  INITIAL_COURT_BOOKINGS, 
  INITIAL_POS_ORDERS, 
  INITIAL_NON_REVENUE_TRANSACTIONS, 
  INITIAL_STOCK_OPNAME_SESSIONS 
} from '../constants/initialData';
import { 
  validateJournalEntry, 
  createJournalEntry, 
  createReversalJournal, 
  PostJournalPayload 
} from '../services/glEngine';
import { performThreeWayMatch } from '../services/threeWayMatchEngine';
import { generateStk07JournalLines, calculateNonGlEstimatedHpp } from '../services/periodicHppEngine';
import { ACCOUNT_KEYS, getAccountByCode } from '../constants/coaData';
import { PHYSICAL_LOCATIONS, SHARED_COST_ALLOCATION_WEIGHTS } from '../constants/dimensions';

export type UserRole = 'FINANCE_CONTROLLER' | 'OPERATIONS_CASHIER' | 'AUDITOR_COMMISSIONER';

interface ERPContextType {
  // State
  journals: GLJournalEntry[];
  stockItems: StockItem[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  vendorBills: VendorBill[];
  tournaments: TournamentEvent[];
  courtBookings: CourtBooking[];
  posTransactions: POSTransaction[];
  nonRevenueTransactions: NonRevenueTransaction[];
  stockOpnameSessions: StockOpnameSession[];
  
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Actions
  postJournal: (payload: PostJournalPayload) => { success: boolean; journal?: GLJournalEntry; errors?: string[] };
  reverseJournal: (journalId: string, reason: string) => { success: boolean; reversal?: GLJournalEntry; error?: string };
  
  // Purchasing & 3-Way Match
  createPO: (vendorName: string, unitId: BusinessUnitId, lines: POLine[]) => PurchaseOrder;
  createGR: (poId: string, lines: GRLine[]) => { success: boolean; gr?: GoodsReceipt; error?: string };
  submitBill: (
    poId: string, 
    grId: string, 
    vendorInvoiceNumber: string, 
    lines: Array<{ poLineId: string; grLineId: string; invoicedQty: number; invoicedUnitPrice: number }>,
    taxPercent?: number
  ) => { success: boolean; bill?: VendorBill; error?: string };
  approveHeldBill: (billId: string, notes: string) => { success: boolean; bill?: VendorBill; error?: string };
  
  // Periodic Inventory
  createOpnameSession: (locationId: PhysicalLocationId, periodMonth: string, lines: any[]) => StockOpnameSession;
  approveAndPostOpname: (sessionId: string) => { success: boolean; error?: string };
  
  // Operations & Anti-Fraud
  bookCourt: (booking: Omit<CourtBooking, 'id' | 'bookingCode' | 'glJournalId' | 'status' | 'totalAmount'>) => CourtBooking;
  processPOSSale: (sale: Omit<POSTransaction, 'id' | 'receiptNumber' | 'glJournalId' | 'cogsRuleStatus' | 'timestamp'>) => POSTransaction;
  registerTournamentPlayer: (tournamentId: string, playerName: string) => { success: boolean; error?: string };
  settleTournamentEvent: (tournamentId: string, refundTotal: number) => { success: boolean; error?: string };
  
  // Non-Revenue inflows
  recordNonRevenueInflow: (type: NonRevenueTransaction['type'], amount: number, memo: string) => { success: boolean; error?: string };
  
  // Reset
  resetToDemoData: () => void;
}

const ERPContext = createContext<ERPContextType | null>(null);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or use defaults
  const [journals, setJournals] = useState<GLJournalEntry[]>(() => {
    const saved = localStorage.getItem('padel_erp_journals');
    return saved ? JSON.parse(saved) : INITIAL_GL_JOURNALS;
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('padel_erp_stock');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('padel_erp_pos');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(() => {
    const saved = localStorage.getItem('padel_erp_grs');
    return saved ? JSON.parse(saved) : INITIAL_GOODS_RECEIPTS;
  });

  const [vendorBills, setVendorBills] = useState<VendorBill[]>(() => {
    const saved = localStorage.getItem('padel_erp_bills');
    return saved ? JSON.parse(saved) : INITIAL_VENDOR_BILLS;
  });

  const [tournaments, setTournaments] = useState<TournamentEvent[]>(() => {
    const saved = localStorage.getItem('padel_erp_tournaments');
    return saved ? JSON.parse(saved) : INITIAL_TOURNAMENTS;
  });

  const [courtBookings, setCourtBookings] = useState<CourtBooking[]>(() => {
    const saved = localStorage.getItem('padel_erp_bookings');
    return saved ? JSON.parse(saved) : INITIAL_COURT_BOOKINGS;
  });

  const [posTransactions, setPosTransactions] = useState<POSTransaction[]>(() => {
    const saved = localStorage.getItem('padel_erp_pos_orders');
    return saved ? JSON.parse(saved) : INITIAL_POS_ORDERS;
  });

  const [nonRevenueTransactions, setNonRevenueTransactions] = useState<NonRevenueTransaction[]>(() => {
    const saved = localStorage.getItem('padel_erp_nonrev');
    return saved ? JSON.parse(saved) : INITIAL_NON_REVENUE_TRANSACTIONS;
  });

  const [stockOpnameSessions, setStockOpnameSessions] = useState<StockOpnameSession[]>(() => {
    const saved = localStorage.getItem('padel_erp_opname');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_OPNAME_SESSIONS;
  });

  const [userRole, setUserRole] = useState<UserRole>('FINANCE_CONTROLLER');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('padel_erp_journals', JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem('padel_erp_stock', JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem('padel_erp_pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('padel_erp_grs', JSON.stringify(goodsReceipts));
  }, [goodsReceipts]);

  useEffect(() => {
    localStorage.setItem('padel_erp_bills', JSON.stringify(vendorBills));
  }, [vendorBills]);

  useEffect(() => {
    localStorage.setItem('padel_erp_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    localStorage.setItem('padel_erp_bookings', JSON.stringify(courtBookings));
  }, [courtBookings]);

  useEffect(() => {
    localStorage.setItem('padel_erp_pos_orders', JSON.stringify(posTransactions));
  }, [posTransactions]);

  useEffect(() => {
    localStorage.setItem('padel_erp_nonrev', JSON.stringify(nonRevenueTransactions));
  }, [nonRevenueTransactions]);

  useEffect(() => {
    localStorage.setItem('padel_erp_opname', JSON.stringify(stockOpnameSessions));
  }, [stockOpnameSessions]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const getNextJournalNumber = () => {
    const count = journals.length + 1;
    return `JV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count).padStart(4, '0')}`;
  };

  /**
   * Post GL Journal with invariant validation
   */
  const postJournal = (payload: PostJournalPayload): { success: boolean; journal?: GLJournalEntry; errors?: string[] } => {
    const validation = validateJournalEntry(payload, journals);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const newJournal = createJournalEntry(payload, getNextJournalNumber());
    setJournals(prev => [newJournal, ...prev]);
    return { success: true, journal: newJournal };
  };

  /**
   * Reverse an existing journal with an immutable counter-journal
   */
  const reverseJournal = (journalId: string, reason: string): { success: boolean; reversal?: GLJournalEntry; error?: string } => {
    const target = journals.find(j => j.id === journalId);
    if (!target) {
      return { success: false, error: 'Journal not found' };
    }
    if (target.status === 'REVERSED') {
      return { success: false, error: 'Journal has already been reversed' };
    }

    const reversal = createReversalJournal(target, reason, 'Finance Approver', getNextJournalNumber());
    
    setJournals(prev => {
      const updated = prev.map(j => {
        if (j.id === journalId) {
          return { ...j, status: 'REVERSED' as const, reversalJournalId: reversal.id };
        }
        return j;
      });
      return [reversal, ...updated];
    });

    return { success: true, reversal };
  };

  /**
   * 3-Way Match Workflow 1: Create PO
   */
  const createPO = (vendorName: string, unitId: BusinessUnitId, lines: POLine[]): PurchaseOrder => {
    const poNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
    const totalAmount = lines.reduce((acc, l) => acc + (l.orderedQty * l.unitPrice), 0);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      date: new Date().toISOString().split('T')[0],
      vendorName,
      unitId,
      lines,
      status: 'OPEN',
      totalAmount
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    return newPO;
  };

  /**
   * 3-Way Match Workflow 2: Goods Receipt (GR-01)
   * Hard Rule: Dr 5-1100 Pembelian Persediaan Periodik / Cr 2-1104 GRNI
   * Do NOT touch 1-1301..1-1305 in GL during GR!
   */
  const createGR = (poId: string, lines: GRLine[]): { success: boolean; gr?: GoodsReceipt; error?: string } => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return { success: false, error: 'Purchase Order not found.' };

    const grNumber = `GR-${new Date().getFullYear()}-${String(goodsReceipts.length + 1).padStart(3, '0')}`;
    const totalValue = lines.reduce((acc, l) => acc + (l.receivedQty * l.unitPrice), 0);
    const grId = `gr-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    // Post GR-01 Journal to GL
    const journalRes = postJournal({
      ruleCode: 'GR-01',
      date: dateStr,
      reference: grNumber,
      description: `GR-01: Penerimaan Barang PO ${po.poNumber} dari ${po.vendorName} (Metode Periodik)`,
      idempotencyKey: `idemp-gr-${grId}`,
      lines: [
        {
          accountCode: ACCOUNT_KEYS.PURCHASE_PERIODIC, // 5-1100
          debit: totalValue,
          credit: 0,
          unitId: po.unitId,
          locationId: lines[0]?.locationId || 'L002',
          description: `Pembelian persediaan periodik ${lines.length} item`
        },
        {
          accountCode: ACCOUNT_KEYS.GRNI, // 2-1104
          debit: 0,
          credit: totalValue,
          unitId: po.unitId,
          locationId: lines[0]?.locationId || 'L002',
          description: `GRNI kliring penerimaan barang PO ${po.poNumber}`
        }
      ],
      createdBy: 'Warehouse Staff',
      approvedBy: 'Purchasing Head'
    });

    if (!journalRes.success) {
      return { success: false, error: journalRes.errors?.join(', ') };
    }

    const newGR: GoodsReceipt = {
      id: grId,
      grNumber,
      poId: po.id,
      poNumber: po.poNumber,
      date: dateStr,
      vendorName: po.vendorName,
      lines,
      totalValue,
      isBilled: false,
      status: 'RECEIVED',
      glJournalId: journalRes.journal?.id
    };

    setGoodsReceipts(prev => [newGR, ...prev]);

    // Update physical subledger qty and cost
    setStockItems(prev => {
      return prev.map(item => {
        const matchingGrLine = lines.find(l => l.sku === item.sku);
        if (matchingGrLine) {
          const loc = matchingGrLine.locationId;
          const currentLocQty = item.stockByLocation[loc] || 0;
          const newLocQty = currentLocQty + matchingGrLine.receivedQty;
          
          // Recompute weighted average
          const totalExistingQty = Object.values(item.stockByLocation).reduce((a, b) => a + b, 0);
          const totalExistingVal = totalExistingQty * item.averageUnitCost;
          const newBatchVal = matchingGrLine.receivedQty * matchingGrLine.unitPrice;
          const newTotalQty = totalExistingQty + matchingGrLine.receivedQty;
          const newAvgCost = newTotalQty > 0 ? (totalExistingVal + newBatchVal) / newTotalQty : item.averageUnitCost;

          return {
            ...item,
            averageUnitCost: Math.round(newAvgCost),
            stockByLocation: {
              ...item.stockByLocation,
              [loc]: newLocQty
            }
          };
        }
        return item;
      });
    });

    // Mark PO received
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'RECEIVED' } : p));

    return { success: true, gr: newGR };
  };

  /**
   * 3-Way Match Workflow 3: Submit Vendor Bill
   * Hard Rule: 0% Over-Billing, <=1% & <=Rp 50.000 price tolerance
   */
  const submitBill = (
    poId: string, 
    grId: string, 
    vendorInvoiceNumber: string, 
    lines: Array<{ poLineId: string; grLineId: string; invoicedQty: number; invoicedUnitPrice: number }>,
    taxPercent: number = 0
  ): { success: boolean; bill?: VendorBill; error?: string } => {
    const po = purchaseOrders.find(p => p.id === poId);
    const gr = goodsReceipts.find(g => g.id === grId);

    if (!po || !gr) return { success: false, error: 'PO or Goods Receipt not found.' };

    const matchResult = performThreeWayMatch(po, gr, lines, taxPercent);
    const billNumber = `BILL-${new Date().getFullYear()}-${String(vendorBills.length + 1).padStart(3, '0')}`;
    const dateStr = new Date().toISOString().split('T')[0];

    let glJournalId: string | undefined = undefined;

    // If auto-passed, immediately post AP-01 to GL
    if (matchResult.status === 'AUTO_PASSED') {
      const journalRes = postJournal({
        ruleCode: 'AP-01',
        date: dateStr,
        reference: billNumber,
        description: `AP-01: Tagihan Vendor ${po.vendorName} (3-Way Match AUTO-PASSED) Ref: ${vendorInvoiceNumber}`,
        idempotencyKey: `idemp-bill-${billNumber}`,
        lines: [
          {
            accountCode: ACCOUNT_KEYS.GRNI, // 2-1104
            debit: matchResult.subtotal,
            credit: 0,
            unitId: po.unitId,
            description: `Pelepasan GRNI atas faktur ${vendorInvoiceNumber}`
          },
          {
            accountCode: ACCOUNT_KEYS.AP_TRADE, // 2-1101
            debit: 0,
            credit: matchResult.totalAmount,
            unitId: po.unitId,
            description: `Hutang Dagang Vendor ${po.vendorName}`
          }
        ],
        createdBy: 'AP Staff',
        approvedBy: 'Auto-Match Engine'
      });

      if (journalRes.success) {
        glJournalId = journalRes.journal?.id;
      }
    }

    const newBill: VendorBill = {
      id: `bill-${Date.now()}`,
      billNumber,
      vendorInvoiceNumber,
      poId: po.id,
      poNumber: po.poNumber,
      grId: gr.id,
      grNumber: gr.grNumber,
      date: dateStr,
      vendorName: po.vendorName,
      lines: matchResult.lines,
      subtotal: matchResult.subtotal,
      taxAmount: matchResult.taxAmount,
      totalAmount: matchResult.totalAmount,
      matchingStatus: matchResult.status,
      glJournalId,
      holdReasons: matchResult.holdReasons
    };

    setVendorBills(prev => [newBill, ...prev]);

    if (matchResult.status === 'AUTO_PASSED') {
      setGoodsReceipts(prev => prev.map(g => g.id === grId ? { ...g, isBilled: true, status: 'INVOICED' } : g));
    }

    return { success: true, bill: newBill };
  };

  /**
   * Finance override approval for Held Vendor Bill
   */
  const approveHeldBill = (billId: string, notes: string): { success: boolean; bill?: VendorBill; error?: string } => {
    const bill = vendorBills.find(b => b.id === billId);
    if (!bill) return { success: false, error: 'Bill not found.' };
    if (bill.matchingStatus !== 'EXCEPTION_HOLD') return { success: false, error: 'Bill is not on HOLD.' };

    const dateStr = new Date().toISOString().split('T')[0];
    const po = purchaseOrders.find(p => p.id === bill.poId);

    // Post AP-01 override to GL
    const journalRes = postJournal({
      ruleCode: 'AP-01-OVERRIDE',
      date: dateStr,
      reference: bill.billNumber,
      description: `AP-01 [OVERRIDE]: Persetujuan Manual Tagihan ${bill.billNumber}. Alasan: ${notes}`,
      idempotencyKey: `idemp-bill-override-${bill.id}`,
      lines: [
        {
          accountCode: ACCOUNT_KEYS.GRNI, // 2-1104
          debit: bill.subtotal,
          credit: 0,
          unitId: po?.unitId || 'U002',
          description: `Pelepasan GRNI override persetujuan Finance`
        },
        {
          accountCode: ACCOUNT_KEYS.AP_TRADE, // 2-1101
          debit: 0,
          credit: bill.totalAmount,
          unitId: po?.unitId || 'U002',
          description: `Hutang Dagang disetujui manual: ${bill.vendorName}`
        }
      ],
      createdBy: 'Finance Controller',
      approvedBy: 'Head of Finance & Accounting'
    });

    if (!journalRes.success) {
      return { success: false, error: journalRes.errors?.join(', ') };
    }

    const updatedBill: VendorBill = {
      ...bill,
      matchingStatus: 'APPROVED',
      glJournalId: journalRes.journal?.id,
      approvedBy: 'Finance Controller',
      approvalNotes: notes
    };

    setVendorBills(prev => prev.map(b => b.id === billId ? updatedBill : b));
    setGoodsReceipts(prev => prev.map(g => g.id === bill.grId ? { ...g, isBilled: true, status: 'INVOICED' } : g));

    return { success: true, bill: updatedBill };
  };

  /**
   * Periodic Stock Opname Creation
   */
  const createOpnameSession = (locationId: PhysicalLocationId, periodMonth: string, lines: any[]): StockOpnameSession => {
    const sessionNumber = `OPN-${periodMonth}-${locationId}`;
    const totalVarianceValue = lines.reduce((acc, l) => acc + (l.varianceValue || 0), 0);

    const session: StockOpnameSession = {
      id: `opn-${Date.now()}`,
      sessionNumber,
      periodMonth,
      locationId,
      date: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      lines,
      totalVarianceValue,
      conductedBy: 'Operational Lead'
    };

    setStockOpnameSessions(prev => [session, ...prev]);
    return session;
  };

  /**
   * Approve Stock Opname and post official STK-07 Periodic HPP journal
   */
  const approveAndPostOpname = (sessionId: string): { success: boolean; error?: string } => {
    const session = stockOpnameSessions.find(s => s.id === sessionId);
    if (!session) return { success: false, error: 'Opname session not found.' };

    // Calculate total purchases in 5-1100 for this period
    const totalPurchases = journals
      .filter(j => j.status === 'POSTED')
      .flatMap(j => j.lines)
      .filter(l => l.accountCode === ACCOUNT_KEYS.PURCHASE_PERIODIC)
      .reduce((sum, l) => sum + (l.debit - l.credit), 0);

    const stk07 = generateStk07JournalLines(session, stockItems, Math.max(0, totalPurchases));

    const journalRes = postJournal({
      ruleCode: 'STK-07',
      date: new Date().toISOString().split('T')[0],
      reference: session.sessionNumber,
      description: `STK-07: Jurnal Resmi HPP Periodik Pasca Stock Opname ${session.periodMonth} - ${PHYSICAL_LOCATIONS[session.locationId].name}`,
      idempotencyKey: `idemp-stk07-${session.id}`,
      lines: stk07.lines,
      createdBy: 'Store Manager',
      approvedBy: 'Head of Accounting'
    });

    if (!journalRes.success) {
      return { success: false, error: journalRes.errors?.join(', ') };
    }

    setStockOpnameSessions(prev => prev.map(s => s.id === sessionId ? {
      ...s,
      status: 'POSTED',
      glJournalId: journalRes.journal?.id,
      approvedBy: 'Head of Accounting'
    } : s));

    // Update physical subledger qty to match physical count
    setStockItems(prev => {
      return prev.map(item => {
        const line = session.lines.find(l => l.sku === item.sku);
        if (line) {
          return {
            ...item,
            stockByLocation: {
              ...item.stockByLocation,
              [session.locationId]: line.physicalQty
            }
          };
        }
        return item;
      });
    });

    return { success: true };
  };

  /**
   * Court Booking Operational Flow
   * Posts SAL-01 to GL
   */
  const bookCourt = (booking: Omit<CourtBooking, 'id' | 'bookingCode' | 'glJournalId' | 'status' | 'totalAmount'>): CourtBooking => {
    const count = courtBookings.length + 1;
    const bookingCode = `PB-BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count).padStart(3, '0')}`;
    const bookingId = `bk-${Date.now()}`;
    const totalAmount = booking.rentalFee + booking.equipmentFee;

    // Determine cash/bank account
    let paymentAccCode: string = ACCOUNT_KEYS.CASH_PADEL; // '1-1101'
    if (booking.paymentMethod === 'MANDIRI_TRANSFER') paymentAccCode = ACCOUNT_KEYS.BANK_MANDIRI;
    if (booking.paymentMethod === 'QRIS_BNI') paymentAccCode = ACCOUNT_KEYS.BANK_BNI;

    const lines: Array<{
      accountCode: string;
      debit: number;
      credit: number;
      unitId: BusinessUnitId;
      locationId?: PhysicalLocationId;
      description: string;
    }> = [
      {
        accountCode: paymentAccCode,
        debit: totalAmount,
        credit: 0,
        unitId: 'U001',
        locationId: 'L001',
        description: `Penerimaan sewa lapangan ${booking.courtName} (${booking.customerName})`
      },
      {
        accountCode: ACCOUNT_KEYS.REVENUE_PADEL_COURT, // 4-1101
        debit: 0,
        credit: booking.rentalFee,
        unitId: 'U001',
        locationId: 'L001',
        description: `Pendapatan sewa slot lapangan padel`
      }
    ];

    if (booking.equipmentFee > 0) {
      lines.push({
        accountCode: ACCOUNT_KEYS.REVENUE_EQUIPMENT_RENTAL, // 4-1201
        debit: 0,
        credit: booking.equipmentFee,
        unitId: 'U001',
        locationId: 'L001',
        description: `Sewa raket & bola padel di venue`
      });
    }

    const journalRes = postJournal({
      ruleCode: 'SAL-01',
      date: booking.date,
      reference: bookingCode,
      description: `SAL-01: Booking Lapangan ${booking.courtName} - ${booking.customerName}`,
      idempotencyKey: `idemp-bk-${bookingId}`,
      lines,
      createdBy: 'Court Receptionist',
      approvedBy: 'Operations Manager'
    });

    const newBooking: CourtBooking = {
      ...booking,
      id: bookingId,
      bookingCode,
      totalAmount,
      status: 'CONFIRMED',
      glJournalId: journalRes.journal?.id
    };

    setCourtBookings(prev => [newBooking, ...prev]);
    return newBooking;
  };

  /**
   * POS Order Processing
   * Hard Rule: Rule STK-06 (Perpetual COGS) is deactivated. NO COGS GL ENTRIES!
   */
  const processPOSSale = (sale: Omit<POSTransaction, 'id' | 'receiptNumber' | 'glJournalId' | 'cogsRuleStatus' | 'timestamp'>): POSTransaction => {
    const count = posTransactions.length + 1;
    const prefix = sale.locationId === 'L003' ? 'BAR' : sale.locationId === 'L004' ? 'KIT' : 'BTG';
    const receiptNumber = `POS-${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count).padStart(3, '0')}`;
    const posId = `pos-${Date.now()}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const lines = [
      // 1. Debit Cash/Bank
      {
        accountCode: sale.paymentAccountCode,
        debit: sale.total,
        credit: 0,
        unitId: sale.unitId,
        locationId: sale.locationId,
        description: `Penerimaan kasir POS ${receiptNumber}`
      },
      // 2. Credit Revenue
      {
        accountCode: sale.revenueAccountCode,
        debit: 0,
        credit: sale.subtotal,
        unitId: sale.unitId,
        locationId: sale.locationId,
        description: `Penjualan menu F&B POS`
      }
    ];

    // 3. PB1 Tax (if any)
    if (sale.tax > 0) {
      lines.push({
        accountCode: ACCOUNT_KEYS.TAX_PAYABLE_PB1, // 2-1201
        debit: 0,
        credit: sale.tax,
        unitId: sale.unitId,
        locationId: sale.locationId,
        description: `Pajak Resto PB1 (10%)`
      });
    }

    const journalRes = postJournal({
      ruleCode: 'SAL-02',
      date: new Date().toISOString().split('T')[0],
      reference: receiptNumber,
      description: `SAL-02: Penjualan POS Kasir ${receiptNumber} (${PHYSICAL_LOCATIONS[sale.locationId]?.name})`,
      idempotencyKey: `idemp-pos-${posId}`,
      lines,
      createdBy: sale.cashierName,
      approvedBy: 'Shift Supervisor'
    });

    const newTx: POSTransaction = {
      ...sale,
      id: posId,
      receiptNumber,
      timestamp,
      cogsRuleStatus: 'DISABLED_PERIODIC_ACTIVE',
      glJournalId: journalRes.journal?.id || ''
    };

    setPosTransactions(prev => [newTx, ...prev]);
    return newTx;
  };

  /**
   * Tournament Flow 1: SAL-06 (Deposit into Liability 2-1301)
   */
  const registerTournamentPlayer = (tournamentId: string, playerName: string): { success: boolean; error?: string } => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return { success: false, error: 'Tournament not found.' };

    const fee = tournament.entryFeePerParticipant;
    const dateStr = new Date().toISOString().split('T')[0];
    const journalKey = `idemp-sal06-${tournament.id}-${Date.now()}`;

    // SAL-06: Dr 1-1104 / Cr 2-1301 (NOT 4-1102!)
    const journalRes = postJournal({
      ruleCode: 'SAL-06',
      date: dateStr,
      reference: tournament.name,
      description: `SAL-06: Uang Muka Registrasi Turnamen (${playerName}) - ${tournament.name}`,
      idempotencyKey: journalKey,
      lines: [
        {
          accountCode: ACCOUNT_KEYS.BANK_MANDIRI, // 1-1104
          debit: fee,
          credit: 0,
          unitId: 'U001',
          locationId: 'L001',
          description: `Transfer pendaftaran ${playerName}`
        },
        {
          accountCode: ACCOUNT_KEYS.DEFERRED_REVENUE_TOURNAMENT, // 2-1301
          debit: 0,
          credit: fee,
          unitId: 'U001',
          locationId: 'L001',
          description: `Pendapatan diterima di muka turnamen (Liabilitas)`
        }
      ],
      createdBy: 'Tournament Desk',
      approvedBy: 'Finance Supervisor'
    });

    if (!journalRes.success) {
      return { success: false, error: journalRes.errors?.join(', ') };
    }

    setTournaments(prev => prev.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          totalRegisteredParticipants: t.totalRegisteredParticipants + 1,
          totalCollectedPrepayment: t.totalCollectedPrepayment + fee,
          sal06JournalIds: [...t.sal06JournalIds, journalRes.journal!.id]
        };
      }
      return t;
    }));

    return { success: true };
  };

  /**
   * Tournament Flow 2: SAL-07 (Reclassify 2-1301 to 4-1102 post-completion net of refund)
   */
  const settleTournamentEvent = (tournamentId: string, refundTotal: number): { success: boolean; error?: string } => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return { success: false, error: 'Tournament not found.' };
    if (tournament.status === 'SETTLED') return { success: false, error: 'Tournament is already settled.' };

    const totalCollected = tournament.totalCollectedPrepayment;
    const netRevenue = totalCollected - refundTotal;
    const dateStr = new Date().toISOString().split('T')[0];

    const lines: Array<{
      accountCode: string;
      debit: number;
      credit: number;
      unitId: BusinessUnitId;
      locationId?: PhysicalLocationId;
      description: string;
    }> = [
      {
        accountCode: ACCOUNT_KEYS.DEFERRED_REVENUE_TOURNAMENT, // 2-1301
        debit: totalCollected,
        credit: 0,
        unitId: 'U001',
        locationId: 'L001',
        description: `Penutupan akun uang muka turnamen selesai ${tournament.name}`
      }
    ];

    if (refundTotal > 0) {
      lines.push({
        accountCode: ACCOUNT_KEYS.BANK_MANDIRI, // 1-1104
        debit: 0,
        credit: refundTotal,
        unitId: 'U001',
        locationId: 'L001',
        description: `Pengembalian refund peserta turnamen batal/cedera`
      });
    }

    lines.push({
      accountCode: ACCOUNT_KEYS.REVENUE_PADEL_EVENT, // 4-1102
      debit: 0,
      credit: netRevenue,
      unitId: 'U001',
      locationId: 'L001',
      description: `SAL-07: Pengakuan resmi omzet turnamen bersih setelah refund`
    });

    const journalRes = postJournal({
      ruleCode: 'SAL-07',
      date: dateStr,
      reference: `SETTLEMENT-${tournament.name}`,
      description: `SAL-07: Reklasifikasi Penutupan Turnamen ${tournament.name} ke Omzet Resmi`,
      idempotencyKey: `idemp-sal07-${tournament.id}`,
      lines,
      createdBy: 'Tournament Director',
      approvedBy: 'Head of Accounting'
    });

    if (!journalRes.success) {
      return { success: false, error: journalRes.errors?.join(', ') };
    }

    setTournaments(prev => prev.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          status: 'SETTLED',
          totalRefunds: refundTotal,
          netRevenue,
          sal07JournalId: journalRes.journal?.id
        };
      }
      return t;
    }));

    return { success: true };
  };

  /**
   * Anti-Fraud Non-Revenue Transaction Inflows
   * Strictly verifies zero leakage into 4-xxxx
   */
  const recordNonRevenueInflow = (
    type: NonRevenueTransaction['type'], 
    amount: number, 
    memo: string
  ): { success: boolean; error?: string } => {
    const dateStr = new Date().toISOString().split('T')[0];
    let ruleCode = '';
    let targetCreditAccount = '';
    let typeName = '';

    if (type === 'CASH_ADVANCE_RETURN') {
      ruleCode = 'CA-03';
      targetCreditAccount = ACCOUNT_KEYS.ADVANCE_EMPLOYEE; // 1-1401
      typeName = 'Pengembalian Sisa Cash Advance Karyawan';
    } else if (type === 'DKSI_RELATED_LOAN') {
      ruleCode = 'FIN-01';
      targetCreditAccount = ACCOUNT_KEYS.DUE_RELATED_DKSI; // 2-1401
      typeName = 'Penerimaan Pinjaman Pihak Berelasi PT DKSI';
    } else if (type === 'OWNER_FUNDING') {
      ruleCode = 'FIN-02';
      targetCreditAccount = ACCOUNT_KEYS.OWNER_CAPITAL_ADVANCE; // 3-1102
      typeName = 'Setoran Talangan Modal Pemilik';
    } else if (type === 'INTERBANK_TRANSFER') {
      ruleCode = 'FIN-03';
      targetCreditAccount = ACCOUNT_KEYS.BANK_BNI; // 1-1105
      typeName = 'Pindah Buku BNI ke Mandiri';
    }

    const journalRes = postJournal({
      ruleCode,
      date: dateStr,
      reference: `REF-${ruleCode}-${Date.now()}`,
      description: `${ruleCode}: ${typeName} (${memo}) [STRICT NON-REVENUE]`,
      idempotencyKey: `idemp-${ruleCode}-${Date.now()}`,
      lines: [
        {
          accountCode: ACCOUNT_KEYS.BANK_MANDIRI, // 1-1104
          debit: amount,
          credit: 0,
          unitId: 'U009',
          locationId: 'L002',
          description: `Penerimaan kas masuk ke rekening giro Mandiri`
        },
        {
          accountCode: targetCreditAccount,
          debit: 0,
          credit: amount,
          unitId: 'U009',
          locationId: 'L002',
          description: `Kredit akun non-omzet (${targetCreditAccount})`
        }
      ],
      createdBy: 'Finance Admin',
      approvedBy: 'Head of Accounting'
    });

    if (!journalRes.success) {
      return { success: false, error: journalRes.errors?.join(', ') };
    }

    const nonRevRecord: NonRevenueTransaction = {
      id: `nonrev-${Date.now()}`,
      date: dateStr,
      type,
      amount,
      fromAccount: '1-1104 Bank Mandiri Operasional',
      toAccount: targetCreditAccount,
      glJournalId: journalRes.journal!.id,
      isRevenueAccountInvolved: false,
      auditVerified: true
    };

    setNonRevenueTransactions(prev => [nonRevRecord, ...prev]);
    return { success: true };
  };

  /**
   * Reset all data to initial demo state
   */
  const resetToDemoData = () => {
    localStorage.removeItem('padel_erp_journals');
    localStorage.removeItem('padel_erp_stock');
    localStorage.removeItem('padel_erp_pos');
    localStorage.removeItem('padel_erp_grs');
    localStorage.removeItem('padel_erp_bills');
    localStorage.removeItem('padel_erp_tournaments');
    localStorage.removeItem('padel_erp_bookings');
    localStorage.removeItem('padel_erp_pos_orders');
    localStorage.removeItem('padel_erp_nonrev');
    localStorage.removeItem('padel_erp_opname');

    setJournals(INITIAL_GL_JOURNALS);
    setStockItems(INITIAL_STOCK_ITEMS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setGoodsReceipts(INITIAL_GOODS_RECEIPTS);
    setVendorBills(INITIAL_VENDOR_BILLS);
    setTournaments(INITIAL_TOURNAMENTS);
    setCourtBookings(INITIAL_COURT_BOOKINGS);
    setPosTransactions(INITIAL_POS_ORDERS);
    setNonRevenueTransactions(INITIAL_NON_REVENUE_TRANSACTIONS);
    setStockOpnameSessions(INITIAL_STOCK_OPNAME_SESSIONS);
  };

  return (
    <ERPContext.Provider value={{
      journals,
      stockItems,
      purchaseOrders,
      goodsReceipts,
      vendorBills,
      tournaments,
      courtBookings,
      posTransactions,
      nonRevenueTransactions,
      stockOpnameSessions,
      userRole,
      setUserRole,
      isDarkMode,
      toggleDarkMode,
      postJournal,
      reverseJournal,
      createPO,
      createGR,
      submitBill,
      approveHeldBill,
      createOpnameSession,
      approveAndPostOpname,
      bookCourt,
      processPOSSale,
      registerTournamentPlayer,
      settleTournamentEvent,
      recordNonRevenueInflow,
      resetToDemoData
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
