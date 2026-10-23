/**
 * PT Sport Universal Indonesia (Padel Beans)
 * Modul 1: Master Dimensi Unit Bisnis & Lokasi Fisik
 * Sesuai Blueprint V1.3: Master_Unit, Master_Lokasi, dan Map_Unit_Lokasi.
 */

import { MasterUnit, MasterLokasi, MapUnitLokasi, BusinessUnitId, PhysicalLocationId } from '../types/module1';

export const MASTER_UNITS: MasterUnit[] = [
  {
    unitId: 'U001',
    unitCode: 'U001',
    unitName: 'Padel Court & Event',
    unitType: 'REVENUE',
    description: 'Unit Pendapatan Operasional Sewa Lapangan, Turnamen, dan Event Olahraga Padel',
    historicalAliases: ['Padel Court', 'Padel Salatiga', 'Event Padel'],
    isActive: true
  },
  {
    unitId: 'U002',
    unitCode: 'U002',
    unitName: 'Coffee & Resto Salatiga',
    unitType: 'REVENUE',
    description: 'Unit Pendapatan Food & Beverage Outlet Salatiga (Mencakup alias historis Coffee & Resto JB dan Coffee Resto Salatiga)',
    historicalAliases: ['Coffee & Resto JB', 'Coffee Resto Salatiga', 'JB Salatiga', 'Resto Salatiga'],
    isActive: true
  },
  {
    unitId: 'U003',
    unitCode: 'U003',
    unitName: 'Coffee Benteng',
    unitType: 'REVENUE',
    description: 'Unit Pendapatan Coffee Shop Cabang Benteng Pendem Ambarawa',
    historicalAliases: ['Coffee Benteng Ambarawa', 'Benteng Coffee', 'Benteng Outlet'],
    isActive: true
  },
  {
    unitId: 'U009',
    unitCode: 'U009',
    unitName: 'Shared / Common Costs',
    unitType: 'SHARED_COST',
    description: 'Bucket Biaya Bersama Non-Revenue (Dialokasikan secara Report-Only pada laporan manajemen tanpa menduplikasi jurnal GL)',
    historicalAliases: ['Head Office Overhead', 'Shared Expenses', 'Biaya Bersama PT SUI'],
    isActive: true
  }
];

export const MASTER_LOCATIONS: MasterLokasi[] = [
  {
    locationId: 'L001',
    locationCode: 'L001',
    locationName: 'Padel Court — Lokasi Operasional',
    primaryParentUnitId: 'U001',
    hasStockControl: false,
    addressCity: 'Salatiga',
    description: 'Area fisik lapangan padel untuk sewa lapangan dan pelaksanaan event turnamen',
    isActive: true
  },
  {
    locationId: 'L002',
    locationCode: 'L002',
    locationName: 'Gudang Pusat Salatiga',
    primaryParentUnitId: 'U009',
    hasStockControl: true,
    addressCity: 'Salatiga',
    description: 'Gudang penyimpanan persediaan transit dan logistik bersama lintas unit bisnis',
    isActive: true
  },
  {
    locationId: 'L003',
    locationCode: 'L003',
    locationName: 'Bar Salatiga (JB)',
    primaryParentUnitId: 'U002',
    hasStockControl: true,
    addressCity: 'Salatiga',
    description: 'Stasiun operasional Bar minuman kopi & non-kopi serta penyimpanan bahan baku bar di outlet Salatiga',
    isActive: true
  },
  {
    locationId: 'L004',
    locationCode: 'L004',
    locationName: 'Kitchen Salatiga',
    primaryParentUnitId: 'U002',
    hasStockControl: true,
    addressCity: 'Salatiga',
    description: 'Lokasi operasional dan penyimpanan stok fisik terpisah untuk makanan & bahan olahan dapur di bawah U002',
    isActive: true
  },
  {
    locationId: 'L005',
    locationCode: 'L005',
    locationName: 'Coffee Benteng',
    primaryParentUnitId: 'U003',
    hasStockControl: true,
    addressCity: 'Ambarawa',
    description: 'Stasiun operasional dan stok produk F&B outlet Coffee Benteng di Ambarawa',
    isActive: true
  }
];

export const MAP_UNIT_LOKASI: MapUnitLokasi[] = [
  {
    id: 'MAP-01',
    unitId: 'U001',
    locationId: 'L001',
    relationshipType: 'PRIMARY_OPERATION',
    stockControlEnabled: false,
    notes: 'Lapangan operasional utama unit U001 (Padel Court & Event)'
  },
  {
    id: 'MAP-02',
    unitId: 'U001',
    locationId: 'L002',
    relationshipType: 'SHARED_WAREHOUSE',
    stockControlEnabled: true,
    notes: 'Penyimpanan bola padel, raket, dan merchandise di Gudang Pusat'
  },
  {
    id: 'MAP-03',
    unitId: 'U002',
    locationId: 'L002',
    relationshipType: 'SHARED_WAREHOUSE',
    stockControlEnabled: true,
    notes: 'Penerimaan bahan baku grosir dan kemasan di Gudang Pusat'
  },
  {
    id: 'MAP-04',
    unitId: 'U002',
    locationId: 'L003',
    relationshipType: 'DEDICATED_STATION',
    stockControlEnabled: true,
    notes: 'Stasiun Bar minuman kopi/non-kopi di bawah U002 (Coffee & Resto Salatiga)'
  },
  {
    id: 'MAP-05',
    unitId: 'U002',
    locationId: 'L004',
    relationshipType: 'DEDICATED_STATION',
    stockControlEnabled: true,
    notes: 'Stasiun Kitchen dapur terpisah di bawah U002 (Coffee & Resto Salatiga)'
  },
  {
    id: 'MAP-06',
    unitId: 'U003',
    locationId: 'L005',
    relationshipType: 'PRIMARY_OPERATION',
    stockControlEnabled: true,
    notes: 'Outlet fisik operasional & stok Coffee Benteng Ambarawa di bawah U003'
  },
  {
    id: 'MAP-07',
    unitId: 'U009',
    locationId: 'L002',
    relationshipType: 'SHARED_WAREHOUSE',
    stockControlEnabled: true,
    notes: 'Gudang Pusat Salatiga dikelola di bawah bucket fasilitas bersama U009'
  }
];

export const MASTER_UNIT_MAP = new Map<BusinessUnitId, MasterUnit>(
  MASTER_UNITS.map(u => [u.unitId, u])
);

export const MASTER_LOCATION_MAP = new Map<PhysicalLocationId, MasterLokasi>(
  MASTER_LOCATIONS.map(l => [l.locationId, l])
);

export function getUnitById(id: BusinessUnitId): MasterUnit | undefined {
  return MASTER_UNIT_MAP.get(id);
}

export function getLocationById(id: PhysicalLocationId): MasterLokasi | undefined {
  return MASTER_LOCATION_MAP.get(id);
}
