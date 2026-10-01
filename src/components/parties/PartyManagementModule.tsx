import React, { useState, useEffect } from 'react';
import { Users, Receipt, Building2 } from 'lucide-react';
import { FinancePartyMasterView } from '../finance/FinancePartyMasterView';
import { PartyLedgerView } from '../finance/parties/PartyLedgerView';

export interface PartyManagementModuleProps {
  currentTab?: 'directory' | 'ledger';
  onTabChange?: (tab: 'party-management' | 'party-ledger') => void;
}

export const PartyManagementModule: React.FC<PartyManagementModuleProps> = ({
  currentTab = 'directory',
  onTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'ledger'>(currentTab);

  useEffect(() => {
    setActiveSubTab(currentTab);
  }, [currentTab]);

  const handleTabSelect = (tab: 'directory' | 'ledger') => {
    setActiveSubTab(tab);
    if (onTabChange) {
      onTabChange(tab === 'directory' ? 'party-management' : 'party-ledger');
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      {/* Module Header Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleTabSelect('directory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'directory'
                  ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeSubTab === 'directory' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Party Directory & Master</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Unified
              </span>
            </button>

            <button
              onClick={() => handleTabSelect('ledger')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'ledger'
                  ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Receipt className={`w-3.5 h-3.5 ${activeSubTab === 'ledger' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Party Sub-Ledger & Statements</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                PDF
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Party Master System
            </span>
          </div>
        </div>
      </div>

      {/* Sub-view Content */}
      {activeSubTab === 'directory' ? (
        <FinancePartyMasterView />
      ) : (
        <PartyLedgerView />
      )}
    </div>
  );
};
