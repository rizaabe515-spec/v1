import { BusinessUnit, PhysicalLocation, BusinessUnitId, PhysicalLocationId } from '../types/erp';

export const BUSINESS_UNITS: Record<BusinessUnitId, BusinessUnit> = {
  U001: {
    id: 'U001',
    code: 'U001',
    name: 'Padel Court & Event',
    type: 'REVENUE',
    description: 'Unit Pendapatan Operasional Lapangan & Turnamen Padel'
  },
  U002: {
    id: 'U002',
    code: 'U002',
    name: 'Coffee & Resto Salatiga',
    type: 'REVENUE',
    description: 'Unit Pendapatan F&B Salatiga (Mencakup alias historis Coffee & Resto JB)',
    historicalAlias: 'Coffee & Resto JB'
  },
  U003: {
    id: 'U003',
    code: 'U003',
    name: 'Coffee Benteng',
    type: 'REVENUE',
    description: 'Unit Pendapatan Coffee Shop Cabang Benteng Ambarawa'
  },
  U009: {
    id: 'U009',
    code: 'U009',
    name: 'Shared / Common Costs',
    type: 'SHARED_COST',
    description: 'Bucket Biaya Bersama Non-Revenue (Dialokasikan secara Report-Only pada laporan manajemen)'
  }
};

export const PHYSICAL_LOCATIONS: Record<PhysicalLocationId, PhysicalLocation> = {
  L001: {
    id: 'L001',
    code: 'L001',
    name: 'Padel Court — Lokasi Operasional',
    parentUnitId: 'U001',
    hasStockControl: false,
    description: 'Area lapangan padel untuk sewa dan pelaksanaan event'
  },
  L002: {
    id: 'L002',
    code: 'L002',
    name: 'Gudang Pusat Salatiga',
    parentUnitId: 'U009',
    hasStockControl: true,
    description: 'Gudang penyimpanan persediaan bersama lintas unit'
  },
  L003: {
    id: 'L003',
    code: 'L003',
    name: 'Bar Salatiga (JB)',
    parentUnitId: 'U002',
    hasStockControl: true,
    description: 'Stasiun Bar dan penyimpanan bahan minuman Salatiga'
  },
  L004: {
    id: 'L004',
    code: 'L004',
    name: 'Kitchen Salatiga',
    parentUnitId: 'U002',
    hasStockControl: true,
    description: 'Stasiun Dapur dan penyimpanan bahan makanan Salatiga'
  },
  L005: {
    id: 'L005',
    code: 'L005',
    name: 'Coffee Benteng',
    parentUnitId: 'U003',
    hasStockControl: true,
    description: 'Stasiun operasional dan stok Coffee Benteng Ambarawa'
  }
};

/**
 * Report-Only Overhead Allocation Percentages for U009 (Shared Costs)
 * Does NOT generate synthetic GL entries; used purely for management P&L reporting.
 */
export const SHARED_COST_ALLOCATION_WEIGHTS: Record<Exclude<BusinessUnitId, 'U009'>, number> = {
  U001: 0.40, // 40% Padel Court & Event
  U002: 0.35, // 35% Coffee & Resto Salatiga
  U003: 0.25  // 25% Coffee Benteng
};
