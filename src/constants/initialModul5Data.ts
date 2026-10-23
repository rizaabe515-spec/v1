/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 5 Initial Seed Data: Master Items, Recipe BOM, Transfers,
 * Non-Sale Consumptions, and Pre-configured Stock Opname Sessions.
 */

import {
  MasterItemRecord,
  RecipeBOM,
  StockTransferRecord,
  NonSaleConsumptionRecord,
  StockOpnameSessionRecord,
  MonthlyHppClosingRecord
} from '../types/inventoryAndHpp';

export const INITIAL_MASTER_ITEMS: MasterItemRecord[] = [
  {
    id: 'item-01',
    sku: 'INV-COF-001',
    itemName: 'Biji Kopi Arabica Single Origin (Java Temanggung)',
    category: 'COFFEE',
    baseUom: 'gram',
    purchaseUom: 'kg',
    conversionFactor: 1000,
    inventoryAccountKey: 'INV_COFFEE',
    inventoryAccountCode: '1-1301',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1101', // Bar
    averageUnitCost: 140, // Rp 140 / gram (Rp 140.000 / kg)
    minStockLevel: 5000, // 5 kg
    blockNegativeStock: true, // DEC-10
    stockByLocation: {
      L001: 0,
      L002: 45000, // 45 kg di Gudang Pusat
      L003: 12500, // 12.5 kg di Bar Salatiga
      L004: 0,
      L005: 8000   // 8 kg di Coffee Benteng
    }
  },
  {
    id: 'item-02',
    sku: 'INV-COF-002',
    itemName: 'Biji Kopi House Blend Padel Beans (70/30)',
    category: 'COFFEE',
    baseUom: 'gram',
    purchaseUom: 'kg',
    conversionFactor: 1000,
    inventoryAccountKey: 'INV_COFFEE',
    inventoryAccountCode: '1-1301',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1101', // Bar
    averageUnitCost: 110, // Rp 110 / gram (Rp 110.000 / kg)
    minStockLevel: 10000,
    blockNegativeStock: true,
    stockByLocation: {
      L001: 0,
      L002: 80000, // 80 kg
      L003: 24000, // 24 kg
      L004: 0,
      L005: 15000  // 15 kg
    }
  },
  {
    id: 'item-03',
    sku: 'INV-RST-001',
    itemName: 'Susu Segar Pasteurisasi Greenfields',
    category: 'RESTO',
    baseUom: 'ml',
    purchaseUom: 'liter',
    conversionFactor: 1000,
    inventoryAccountKey: 'INV_RESTO',
    inventoryAccountCode: '1-1302',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1101', // Bar beverage
    averageUnitCost: 22, // Rp 22 / ml (Rp 22.000 / liter)
    minStockLevel: 20000, // 20 liter
    blockNegativeStock: true,
    stockByLocation: {
      L001: 0,
      L002: 120000, // 120 liter
      L003: 45000,  // 45 liter
      L004: 10000,  // 10 liter
      L005: 30000   // 30 liter
    }
  },
  {
    id: 'item-04',
    sku: 'INV-RST-002',
    itemName: 'Sirup Gula Aren Organik Cair',
    category: 'RESTO',
    baseUom: 'ml',
    purchaseUom: 'liter',
    conversionFactor: 1000,
    inventoryAccountKey: 'INV_RESTO',
    inventoryAccountCode: '1-1302',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1101',
    averageUnitCost: 35, // Rp 35 / ml (Rp 35.000 / liter)
    minStockLevel: 5000,
    blockNegativeStock: true,
    stockByLocation: {
      L001: 0,
      L002: 30000,
      L003: 15000,
      L004: 0,
      L005: 8000
    }
  },
  {
    id: 'item-05',
    sku: 'INV-RST-003',
    itemName: 'Beras Premium Rojolele Salatiga',
    category: 'RESTO',
    baseUom: 'gram',
    purchaseUom: 'kg',
    conversionFactor: 1000,
    inventoryAccountKey: 'INV_RESTO',
    inventoryAccountCode: '1-1302',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1102', // Kitchen food
    averageUnitCost: 16, // Rp 16 / gram (Rp 16.000 / kg)
    minStockLevel: 25000, // 25 kg
    blockNegativeStock: true,
    stockByLocation: {
      L001: 0,
      L002: 150000, // 150 kg
      L003: 0,
      L004: 60000,  // 60 kg
      L005: 0
    }
  },
  {
    id: 'item-06',
    sku: 'INV-RST-004',
    itemName: 'Daging Wagyu Meltique Cube 200g Cut',
    category: 'RESTO',
    baseUom: 'gram',
    purchaseUom: 'kg',
    conversionFactor: 1000,
    inventoryAccountKey: 'INV_RESTO',
    inventoryAccountCode: '1-1302',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1102', // Kitchen
    averageUnitCost: 175, // Rp 175 / gram (Rp 175.000 / kg)
    minStockLevel: 10000, // 10 kg
    blockNegativeStock: true,
    stockByLocation: {
      L001: 0,
      L002: 50000, // 50 kg
      L003: 0,
      L004: 25000, // 25 kg
      L005: 0
    }
  },
  {
    id: 'item-07',
    sku: 'INV-RST-005',
    itemName: 'Filet Dada Ayam Segar (Fillet)',
    category: 'RESTO',
    baseUom: 'gram',
    purchaseUom: 'kg',
    conversionFactor: 1000,
    inventoryAccountKey: 'INV_RESTO',
    inventoryAccountCode: '1-1302',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1102', // Kitchen
    averageUnitCost: 45, // Rp 45 / gram (Rp 45.000 / kg)
    minStockLevel: 15000,
    blockNegativeStock: true,
    stockByLocation: {
      L001: 0,
      L002: 80000, // 80 kg
      L003: 0,
      L004: 30000, // 30 kg
      L005: 0
    }
  },
  {
    id: 'item-08',
    sku: 'INV-PKG-001',
    itemName: 'Paper Cup Cold 16oz Padel Beans Custom Print',
    category: 'PACKAGING',
    baseUom: 'pcs',
    purchaseUom: 'pack',
    conversionFactor: 50,
    inventoryAccountKey: 'INV_PACKAGING',
    inventoryAccountCode: '1-1303',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1101',
    averageUnitCost: 750, // Rp 750 / pcs
    minStockLevel: 500,
    blockNegativeStock: true,
    stockByLocation: {
      L001: 0,
      L002: 5000,
      L003: 1500,
      L004: 200,
      L005: 1200
    }
  },
  {
    id: 'item-09',
    sku: 'INV-PKG-002',
    itemName: 'Lid Datar & Paper Straw Biodegradable',
    category: 'PACKAGING',
    baseUom: 'pcs',
    purchaseUom: 'pack',
    conversionFactor: 100,
    inventoryAccountKey: 'INV_PACKAGING',
    inventoryAccountCode: '1-1303',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1101',
    averageUnitCost: 250, // Rp 250 / pcs
    minStockLevel: 1000,
    blockNegativeStock: true,
    stockByLocation: {
      L001: 0,
      L002: 8000,
      L003: 2000,
      L004: 100,
      L005: 1500
    }
  },
  {
    id: 'item-10',
    sku: 'INV-MRC-001',
    itemName: 'Bola Padel Head Pro Ball (Can isi 3)',
    category: 'MERCH',
    baseUom: 'can',
    purchaseUom: 'box',
    conversionFactor: 24,
    inventoryAccountKey: 'INV_MERCH',
    inventoryAccountCode: '1-1304',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1101',
    averageUnitCost: 95000, // Rp 95.000 / can
    minStockLevel: 24,
    blockNegativeStock: true,
    stockByLocation: {
      L001: 48,  // Pro shop court
      L002: 120, // Gudang pusat
      L003: 0,
      L004: 0,
      L005: 0
    }
  },
  {
    id: 'item-11',
    sku: 'INV-SUP-001',
    itemName: 'Gas Elpiji Komersial 50kg Heavy Duty Kitchen',
    category: 'SUPPLIES',
    baseUom: 'tabung',
    purchaseUom: 'tabung',
    conversionFactor: 1,
    inventoryAccountKey: 'INV_SUPPLIES',
    inventoryAccountCode: '1-1305',
    cogsAccountKey: 'COGS_SALES',
    cogsAccountCode: '5-1102',
    averageUnitCost: 850000, // Rp 850.000 / tabung
    minStockLevel: 2,
    blockNegativeStock: true,
    stockByLocation: {
      L001: 0,
      L002: 4,
      L003: 0,
      L004: 2,
      L005: 1
    }
  }
];

export const INITIAL_RECIPES: RecipeBOM[] = [
  {
    id: 'bom-01',
    menuSku: 'MENU-BAR-01',
    menuName: 'Es Kopi Susu Padel Aren',
    unitId: 'U002',
    station: 'BAR',
    servingPortion: 1,
    ingredients: [
      { itemSku: 'INV-COF-002', itemName: 'Biji Kopi House Blend Padel Beans', qtyNeeded: 18, baseUom: 'gram' },
      { itemSku: 'INV-RST-001', itemName: 'Susu Segar Greenfields', qtyNeeded: 120, baseUom: 'ml' },
      { itemSku: 'INV-RST-002', itemName: 'Sirup Gula Aren Organik', qtyNeeded: 20, baseUom: 'ml' },
      { itemSku: 'INV-PKG-001', itemName: 'Paper Cup Cold 16oz', qtyNeeded: 1, baseUom: 'pcs' },
      { itemSku: 'INV-PKG-002', itemName: 'Lid & Paper Straw', qtyNeeded: 1, baseUom: 'pcs' }
    ]
  },
  {
    id: 'bom-02',
    menuSku: 'MENU-BAR-02',
    menuName: 'Manual Brew V60 Single Origin Temanggung',
    unitId: 'U002',
    station: 'BAR',
    servingPortion: 1,
    ingredients: [
      { itemSku: 'INV-COF-001', itemName: 'Biji Kopi Arabica Single Origin', qtyNeeded: 15, baseUom: 'gram' },
      { itemSku: 'INV-PKG-001', itemName: 'Paper Cup Cold 16oz', qtyNeeded: 1, baseUom: 'pcs' }
    ]
  },
  {
    id: 'bom-03',
    menuSku: 'MENU-KIT-01',
    menuName: 'Nasi Goreng Padel Special (Ayam & Telur)',
    unitId: 'U002',
    station: 'KITCHEN',
    servingPortion: 1,
    ingredients: [
      { itemSku: 'INV-RST-003', itemName: 'Beras Premium Rojolele', qtyNeeded: 180, baseUom: 'gram' },
      { itemSku: 'INV-RST-005', itemName: 'Filet Dada Ayam Segar', qtyNeeded: 100, baseUom: 'gram' }
    ]
  },
  {
    id: 'bom-04',
    menuSku: 'MENU-KIT-02',
    menuName: 'Wagyu Steak Bites Garlic Butter',
    unitId: 'U002',
    station: 'KITCHEN',
    servingPortion: 1,
    ingredients: [
      { itemSku: 'INV-RST-004', itemName: 'Daging Wagyu Meltique Cube', qtyNeeded: 180, baseUom: 'gram' }
    ]
  },
  {
    id: 'bom-05',
    menuSku: 'MENU-BAR-03',
    menuName: 'Americano Benteng Ice',
    unitId: 'U003',
    station: 'BAR',
    servingPortion: 1,
    ingredients: [
      { itemSku: 'INV-COF-001', itemName: 'Biji Kopi Arabica Single Origin', qtyNeeded: 18, baseUom: 'gram' },
      { itemSku: 'INV-PKG-001', itemName: 'Paper Cup Cold 16oz', qtyNeeded: 1, baseUom: 'pcs' },
      { itemSku: 'INV-PKG-002', itemName: 'Lid & Paper Straw', qtyNeeded: 1, baseUom: 'pcs' }
    ]
  }
];

export const INITIAL_TRANSFERS: StockTransferRecord[] = [
  {
    id: 'trf-001',
    transferNumber: 'TRF-STK-20260902-001',
    ruleCode: 'STK-01',
    date: '2026-09-02',
    sourceLocationId: 'L002', // Gudang Pusat
    destinationLocationId: 'L003', // Bar Salatiga
    sourceUnitId: 'U002',
    destinationUnitId: 'U002',
    items: [
      {
        sku: 'INV-COF-002',
        name: 'Biji Kopi House Blend Padel Beans',
        qty: 15000, // 15 kg
        unitCost: 110,
        totalValuation: 1650000
      },
      {
        sku: 'INV-PKG-001',
        name: 'Paper Cup Cold 16oz',
        qty: 1000,
        unitCost: 750,
        totalValuation: 750000
      }
    ],
    totalValuation: 2400000,
    status: 'RECEIVED_COMPLETED',
    isGlNonPostingVerified: true,
    dispatchedBy: 'Surya (Gudang Pusat)',
    receivedBy: 'Rian (Head Barista JB)',
    receivedAt: '2026-09-02T10:30:00Z',
    notes: 'Transfer rutin mingguan pasokan Bar Salatiga.'
  },
  {
    id: 'trf-002',
    transferNumber: 'TRF-STK-20260905-002',
    ruleCode: 'STK-01',
    date: '2026-09-05',
    sourceLocationId: 'L002', // Gudang Pusat
    destinationLocationId: 'L005', // Benteng Ambarawa
    sourceUnitId: 'U002',
    destinationUnitId: 'U003',
    items: [
      {
        sku: 'INV-COF-001',
        name: 'Biji Kopi Arabica Single Origin',
        qty: 6000, // 6 kg
        unitCost: 140,
        totalValuation: 840000
      },
      {
        sku: 'INV-RST-001',
        name: 'Susu Segar Greenfields',
        qty: 20000, // 20 liter
        unitCost: 22,
        totalValuation: 440000
      }
    ],
    totalValuation: 1280000,
    status: 'DISPATCHED_IN_TRANSIT',
    isGlNonPostingVerified: true,
    dispatchedBy: 'Surya (Gudang Pusat)',
    notes: 'Kirim via kurir internal ke outlet Benteng.'
  }
];

export const INITIAL_NON_SALES: NonSaleConsumptionRecord[] = [
  {
    id: 'nsc-001',
    docNumber: 'NSC-20260904-001',
    ruleCode: 'STK-04',
    date: '2026-09-04',
    reasonCode: 'STK-04_SPILLAGE_CALIBRATE',
    unitId: 'U002',
    locationId: 'L003',
    targetAccountKey: 'STOCK_SHRINKAGE',
    targetAccountCode: '5-1107',
    sku: 'INV-COF-002',
    itemName: 'Biji Kopi House Blend Padel Beans',
    qtyConsumed: 350, // 350 gram
    unitCost: 110,
    totalEstimatedValue: 38500,
    recordedBy: 'Rian (Barista)',
    approvedBy: 'Dimas (SPV Bar)',
    notes: 'Dial-in espresso grinder pagi & setting rasio ekstraksi.',
    isGlDeferredToPeriodEnd: true
  },
  {
    id: 'nsc-002',
    docNumber: 'NSC-20260905-002',
    ruleCode: 'STK-05',
    date: '2026-09-05',
    reasonCode: 'STK-05_CREW_MEAL',
    unitId: 'U002',
    locationId: 'L004',
    targetAccountKey: 'CREW_MEAL',
    targetAccountCode: '6-1104',
    sku: 'INV-RST-005',
    itemName: 'Filet Dada Ayam Segar',
    qtyConsumed: 800, // 800 gram
    unitCost: 45,
    totalEstimatedValue: 36000,
    recordedBy: 'Chef Joko',
    approvedBy: 'Dimas (SPV Kitchen)',
    notes: 'Jatah makan kru kitchen & bar shift sore.',
    isGlDeferredToPeriodEnd: true
  },
  {
    id: 'nsc-003',
    docNumber: 'NSC-20260906-003',
    ruleCode: 'STK-05',
    date: '2026-09-06',
    reasonCode: 'STK-05_PROMO_SAMPLING',
    unitId: 'U002',
    locationId: 'L003',
    targetAccountKey: 'PROMO_EXPENSE',
    targetAccountCode: '6-1308',
    sku: 'INV-COF-001',
    itemName: 'Biji Kopi Arabica Single Origin',
    qtyConsumed: 300, // 300 gram
    unitCost: 140,
    totalEstimatedValue: 42000,
    recordedBy: 'Rian (Barista)',
    approvedBy: 'Marketing Lead',
    notes: 'Tester cupping gratis untuk peserta coaching clinic padel.',
    isGlDeferredToPeriodEnd: true
  }
];

export const INITIAL_OPNAME_SESSIONS: StockOpnameSessionRecord[] = [
  {
    id: 'opn-sess-001',
    sessionNumber: 'OPN-2026-09-L003',
    periodMonth: '2026-09',
    locationId: 'L003', // Bar Salatiga JB
    date: '2026-09-28',
    status: 'APPROVED',
    conductedBy: 'Rian (Head Barista) & Joko (Internal Audit)',
    approvedBy: 'Dimas (Operations Manager)',
    lines: [
      {
        sku: 'INV-COF-001',
        itemName: 'Biji Kopi Arabica Single Origin',
        systemQty: 12500,
        physicalQty: 12400,
        varianceQty: -100, // minus 100g
        unitCost: 140,
        varianceValue: -14000
      },
      {
        sku: 'INV-COF-002',
        itemName: 'Biji Kopi House Blend Padel Beans',
        systemQty: 24000,
        physicalQty: 23850,
        varianceQty: -150,
        unitCost: 110,
        varianceValue: -16500
      },
      {
        sku: 'INV-RST-001',
        itemName: 'Susu Segar Greenfields',
        systemQty: 45000,
        physicalQty: 44800,
        varianceQty: -200,
        unitCost: 22,
        varianceValue: -4400
      },
      {
        sku: 'INV-PKG-001',
        itemName: 'Paper Cup Cold 16oz',
        systemQty: 1500,
        physicalQty: 1490,
        varianceQty: -10,
        unitCost: 750,
        varianceValue: -7500
      }
    ],
    totalVarianceValue: -42400
  },
  {
    id: 'opn-sess-002',
    sessionNumber: 'OPN-2026-09-L004',
    periodMonth: '2026-09',
    locationId: 'L004', // Kitchen Salatiga
    date: '2026-09-28',
    status: 'APPROVED',
    conductedBy: 'Chef Joko & Surya (Gudang)',
    approvedBy: 'Dimas (Operations Manager)',
    lines: [
      {
        sku: 'INV-RST-003',
        itemName: 'Beras Premium Rojolele',
        systemQty: 60000,
        physicalQty: 59800,
        varianceQty: -200,
        unitCost: 16,
        varianceValue: -3200
      },
      {
        sku: 'INV-RST-004',
        itemName: 'Daging Wagyu Meltique Cube',
        systemQty: 25000,
        physicalQty: 24950,
        varianceQty: -50,
        unitCost: 175,
        varianceValue: -8750
      },
      {
        sku: 'INV-RST-005',
        itemName: 'Filet Dada Ayam Segar',
        systemQty: 30000,
        physicalQty: 29900,
        varianceQty: -100,
        unitCost: 45,
        varianceValue: -4500
      }
    ],
    totalVarianceValue: -16450
  }
];

export const INITIAL_HPP_CONFIG = {
  periodMonth: '2026-09',
  beginningInventoryValue: 35000000, // Rp 35.000.000 saldo awal 1 Sep 2026
  periodicPurchasesBalance: 48500000, // Rp 48.500.000 akumulasi di 5-1100 per Bill/GR
  defaultSalesTurnover: 125000000 // Rp 125.000.000 penjualan F&B bulan berjalan
};
