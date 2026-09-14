import React, { useState } from 'react';
import {
  Layers,
  ListFilter,
  FileCheck,
  ShoppingBag,
  PackageCheck,
  ArrowRightLeft,
  Wrench,
  ShieldCheck,
  Trash2,
  BarChart3,
  Settings,
  Plus,
  QrCode,
} from 'lucide-react';
import { Asset, AssetStatus, PurchaseOrder } from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';

// Views
import { AssetOverviewView } from './AssetOverviewView';
import { AssetRegisterView } from './AssetRegisterView';
import {
  AssetRequestsView,
  PurchaseOrdersView,
  AssetReceivingView,
} from './AssetProcurementViews';
import { AssetMovementRegisterView } from './AssetMovementRegisterView';
import {
  AssetMaintenanceView,
  AssetWarrantyView,
  AssetDocumentsView,
  AssetRetirementView,
} from './AssetLifecycleViews';
import { AssetReportsView } from './AssetReportsView';
import {
  AssetCategoriesView,
  AssetLocationsView,
  AssetVendorsView,
  AssetSettingsView,
} from './AssetMastersView';

// Modals
import { AssetCreateModal } from './AssetCreateModal';
import { AssetDetailModal } from './AssetDetailModal';
import { AssetQrModal } from './AssetQrModal';
import {
  AllocateAssetModal,
  TransferAssetModal,
  ReturnAssetModal,
  CheckOutAssetModal,
  CheckInAssetModal,
  MaintenanceModal,
  RetireAssetModal,
} from './AssetActionModals';

export type AssetSubTab =
  | 'overview'
  | 'register'
  | 'requests'
  | 'pos'
  | 'receiving'
  | 'movements'
  | 'maintenance'
  | 'warranties'
  | 'retirements'
  | 'reports'
  | 'categories'
  | 'locations'
  | 'vendors'
  | 'settings';

interface AssetModuleProps {
  actorName?: string;
  initialSubTab?: AssetSubTab;
  onSubTabChange?: (subTab: AssetSubTab) => void;
}

export const AssetModule: React.FC<AssetModuleProps> = ({
  actorName = 'Admin / IT Officer',
  initialSubTab = 'overview',
  onSubTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AssetSubTab>(initialSubTab);
  const [registerFilter, setRegisterFilter] = useState<{ category?: string; status?: string }>({});

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (subTab: AssetSubTab) => {
    setActiveSubTab(subTab);
    onSubTabChange?.(subTab);
  };

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);
  const [selectedAssetForQr, setSelectedAssetForQr] = useState<Asset | null>(null);
  const [selectedMovementAssetId, setSelectedMovementAssetId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Transaction modals
  const [allocateAsset, setAllocateAsset] = useState<Asset | null>(null);
  const [transferAsset, setTransferAsset] = useState<Asset | null>(null);
  const [returnAsset, setReturnAsset] = useState<Asset | null>(null);
  const [checkOutAsset, setCheckOutAsset] = useState<Asset | null>(null);
  const [checkInAsset, setCheckInAsset] = useState<Asset | null>(null);
  const [maintenanceAsset, setMaintenanceAsset] = useState<Asset | null>(null);
  const [retireAsset, setRetireAsset] = useState<Asset | null>(null);

  // Receiving PO
  const [selectedPoForReceiving, setSelectedPoForReceiving] = useState<PurchaseOrder | null>(null);

  // Navigate to Register with filter
  const handleNavigateToRegisterWithFilter = (filter?: { category?: string; status?: string }) => {
    if (filter) setRegisterFilter(filter);
    setActiveSubTab('register');
  };

  const handleActionCompleted = () => {
    // Refresh modal targets if needed
    if (selectedAssetForDetail) {
      const refreshed = assetStorage.getAssetById(selectedAssetForDetail.id);
      setSelectedAssetForDetail(refreshed || null);
    }
    setAllocateAsset(null);
    setTransferAsset(null);
    setReturnAsset(null);
    setCheckOutAsset(null);
    setCheckInAsset(null);
    setMaintenanceAsset(null);
    setRetireAsset(null);
    setRefreshKey((prev) => prev + 1);
  };

  const navItems = [
    { id: 'overview', label: 'Overview & KPIs', icon: Layers },
    { id: 'register', label: 'Asset Register', icon: ListFilter },
    { id: 'requests', label: 'Requisitions', icon: FileCheck },
    { id: 'pos', label: 'Purchase Orders', icon: ShoppingBag },
    { id: 'receiving', label: 'Goods Intake (GRN)', icon: PackageCheck },
    { id: 'movements', label: 'Movement Ledger', icon: ArrowRightLeft },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'warranties', label: 'Warranties & AMC', icon: ShieldCheck },
    { id: 'retirements', label: 'Decommissioned', icon: Trash2 },
    { id: 'reports', label: 'Compliance Reports', icon: BarChart3 },
    { id: 'categories', label: 'Categories', icon: Settings },
    { id: 'locations', label: 'Locations', icon: Settings },
    { id: 'vendors', label: 'Vendors', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Sub-Navigation Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar scroll-smooth">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSubTabChange(tab.id as AssetSubTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#168A45] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Sub-Tab Content Views */}
      <div>
        {activeSubTab === 'overview' && (
          <AssetOverviewView
            onNavigateToTab={handleNavigateToRegisterWithFilter}
            onOpenCreateAsset={() => setCreateModalOpen(true)}
            onSelectAsset={(asset) => setSelectedAssetForDetail(asset)}
          />
        )}

        {activeSubTab === 'register' && (
          <AssetRegisterView
            key={refreshKey}
            initialFilter={registerFilter}
            actorName={actorName}
            onSelectAsset={(asset) => setSelectedAssetForDetail(asset)}
            onOpenCreateAsset={() => setCreateModalOpen(true)}
            onOpenQrTag={(asset) => setSelectedAssetForQr(asset)}
            onAllocate={(asset) => setAllocateAsset(asset)}
            onTransfer={(asset) => setTransferAsset(asset)}
            onReturn={(asset) => setReturnAsset(asset)}
            onMaintenance={(asset) => setMaintenanceAsset(asset)}
            onRetire={(asset) => setRetireAsset(asset)}
            onViewMovements={(assetId) => {
              setSelectedMovementAssetId(assetId);
              handleSubTabChange('movements');
            }}
          />
        )}

        {activeSubTab === 'requests' && (
          <AssetRequestsView
            actorName={actorName}
            onAllocateRequestedAsset={() => setActiveSubTab('register')}
          />
        )}

        {activeSubTab === 'pos' && (
          <PurchaseOrdersView
            actorName={actorName}
            onReceivePO={(po) => {
              setSelectedPoForReceiving(po);
              setActiveSubTab('receiving');
            }}
          />
        )}

        {activeSubTab === 'receiving' && (
          <AssetReceivingView
            initialPO={selectedPoForReceiving}
            actorName={actorName}
            onSuccessReceived={() => {
              // Switch to register to view newly received assets
            }}
          />
        )}

        {activeSubTab === 'movements' && (
          <AssetMovementRegisterView
            actorName={actorName}
            initialAssetId={selectedMovementAssetId || undefined}
            onSelectAssetId={(id) => {
              const a = assetStorage.getAssetById(id);
              if (a) setSelectedAssetForDetail(a);
            }}
            onViewAssetDetail={(asset) => setSelectedAssetForDetail(asset)}
            onAllocate={(asset) => setAllocateAsset(asset)}
            onTransfer={(asset) => setTransferAsset(asset)}
            onReturn={(asset) => setReturnAsset(asset)}
          />
        )}

        {activeSubTab === 'maintenance' && (
          <AssetMaintenanceView
            actorName={actorName}
            onSelectAsset={(a) => setSelectedAssetForDetail(a)}
          />
        )}

        {activeSubTab === 'warranties' && <AssetWarrantyView />}

        {activeSubTab === 'retirements' && <AssetRetirementView />}

        {activeSubTab === 'reports' && <AssetReportsView />}

        {activeSubTab === 'categories' && <AssetCategoriesView />}

        {activeSubTab === 'locations' && <AssetLocationsView />}

        {activeSubTab === 'vendors' && <AssetVendorsView />}

        {activeSubTab === 'settings' && <AssetSettingsView />}
      </div>

      {/* 3. Global Modal Overlays */}
      {createModalOpen && (
        <AssetCreateModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={(newAsset) => {
            setCreateModalOpen(false);
            setSelectedAssetForDetail(newAsset);
          }}
          actorName={actorName}
        />
      )}

      {selectedAssetForDetail && (
        <AssetDetailModal
          asset={selectedAssetForDetail}
          isOpen={true}
          onClose={() => setSelectedAssetForDetail(null)}
          onOpenQrModal={(asset) => setSelectedAssetForQr(asset)}
          onAllocate={(asset) => setAllocateAsset(asset)}
          onTransfer={(asset) => setTransferAsset(asset)}
          onReturn={(asset) => setReturnAsset(asset)}
          onCheckOut={(asset) => setCheckOutAsset(asset)}
          onCheckIn={(asset) => setCheckInAsset(asset)}
          onMaintenance={(asset) => setMaintenanceAsset(asset)}
          onRetire={(asset) => setRetireAsset(asset)}
        />
      )}

      {selectedAssetForQr && (
        <AssetQrModal
          asset={selectedAssetForQr}
          isOpen={true}
          onClose={() => setSelectedAssetForQr(null)}
        />
      )}

      {/* Action Modals */}
      {allocateAsset && (
        <AllocateAssetModal
          asset={allocateAsset}
          isOpen={true}
          onClose={() => setAllocateAsset(null)}
          onSuccess={handleActionCompleted}
          actorName={actorName}
        />
      )}

      {transferAsset && (
        <TransferAssetModal
          asset={transferAsset}
          isOpen={true}
          onClose={() => setTransferAsset(null)}
          onSuccess={handleActionCompleted}
          onViewMovementLedger={(assetId) => {
            setTransferAsset(null);
            setSelectedMovementAssetId(assetId);
            handleSubTabChange('movements');
          }}
          actorName={actorName}
        />
      )}

      {returnAsset && (
        <ReturnAssetModal
          asset={returnAsset}
          isOpen={true}
          onClose={() => setReturnAsset(null)}
          onSuccess={handleActionCompleted}
          actorName={actorName}
        />
      )}

      {checkOutAsset && (
        <CheckOutAssetModal
          asset={checkOutAsset}
          isOpen={true}
          onClose={() => setCheckOutAsset(null)}
          onSuccess={handleActionCompleted}
          actorName={actorName}
        />
      )}

      {checkInAsset && (
        <CheckInAssetModal
          asset={checkInAsset}
          isOpen={true}
          onClose={() => setCheckInAsset(null)}
          onSuccess={handleActionCompleted}
          actorName={actorName}
        />
      )}

      {maintenanceAsset && (
        <MaintenanceModal
          asset={maintenanceAsset}
          isOpen={true}
          onClose={() => setMaintenanceAsset(null)}
          onSuccess={handleActionCompleted}
          actorName={actorName}
        />
      )}

      {retireAsset && (
        <RetireAssetModal
          asset={retireAsset}
          isOpen={true}
          onClose={() => setRetireAsset(null)}
          onSuccess={handleActionCompleted}
          actorName={actorName}
        />
      )}
    </div>
  );
};
