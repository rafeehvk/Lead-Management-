import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Landmark,
  ArrowRightLeft,
  SlidersHorizontal,
  LayoutDashboard,
} from 'lucide-react';
import { FinanceItemMasterView } from '../finance/FinanceItemMasterView';
import { InventoryValuationView } from './InventoryValuationView';
import { StockMovementLedgerView } from './StockMovementLedgerView';
import { OperationsDashboardView } from '../dashboard/OperationsDashboardView';

export type InventorySubTab = 'dashboard' | 'items' | 'valuation' | 'movements';

interface InventoryModuleProps {
  currentTab?: InventorySubTab;
  currentUserName?: string;
  userRole?: string;
  onTabChange?: (tab: string) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  currentTab = 'dashboard',
  currentUserName = 'Inventory & Cost Controller',
  userRole = 'Admin',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<InventorySubTab>(currentTab);

  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  const handleTabSelect = (tab: InventorySubTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      if (tab === 'dashboard') onTabChange('inventory-dashboard');
      else if (tab === 'items') onTabChange('inventory-items');
      else if (tab === 'valuation') onTabChange('inventory-valuation');
      else if (tab === 'movements') onTabChange('inventory-movements');
    }
  };

  const tabs: Array<{
    id: InventorySubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Inventory Dashboard',
      icon: LayoutDashboard,
      badge: 'KPIs',
    },
    {
      id: 'items',
      label: 'Item Master Catalog',
      icon: Boxes,
      badge: 'SKUs',
    },
    {
      id: 'valuation',
      label: 'Inventory Valuation',
      icon: Landmark,
      badge: 'GL 1300',
    },
    {
      id: 'movements',
      label: 'Stock Movement Ledger',
      icon: ArrowRightLeft,
      badge: 'Live',
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Module Subnavigation Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 px-2 text-xs text-slate-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Perpetual Stock Tracking</span>
          </div>
        </div>
      </div>

      {/* Main View Body */}
      <div>
        {activeTab === 'dashboard' && (
          <OperationsDashboardView
            initialSection="inventory"
            onNavigateToTab={(navTab) => {
              if (onTabChange) onTabChange(navTab);
            }}
            currentUserName={currentUserName}
          />
        )}

        {activeTab === 'items' && (
          <FinanceItemMasterView currentUserName={currentUserName} userRole={userRole} />
        )}

        {activeTab === 'valuation' && <InventoryValuationView />}

        {activeTab === 'movements' && <StockMovementLedgerView />}
      </div>
    </div>
  );
};
