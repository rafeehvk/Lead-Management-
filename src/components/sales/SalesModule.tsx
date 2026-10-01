import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Users,
  CreditCard,
  ShoppingCart,
  FileText,
  Clock,
  RotateCcw,
  FileSpreadsheet,
  LayoutDashboard,
} from 'lucide-react';
import { SalesWorkflowView } from '../finance/sales/SalesWorkflowView';
import { SalesCustomerLedgerView } from '../finance/SalesCustomerLedgerView';
import { ReceiptManagementView } from '../finance/payments/ReceiptManagementView';
import { SalesReportsView, SalesReportType } from './SalesReportsView';
import { OperationsDashboardView } from '../dashboard/OperationsDashboardView';

export type SalesSubTab =
  | 'dashboard'
  | 'quotation'
  | 'order'
  | 'invoice'
  | 'return-request'
  | 'return'
  | 'ar-ledger'
  | 'receipts'
  | 'report-quotation'
  | 'report-order'
  | 'report-invoice'
  | 'report-return-request'
  | 'report-return';

export interface SalesModuleProps {
  currentTab?: SalesSubTab;
  currentUserName?: string;
  userRole?: string;
  onTabChange?: (tab: string) => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  currentTab = 'dashboard',
  currentUserName = 'Sales Manager',
  userRole = 'Admin',
  onTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SalesSubTab>(currentTab);

  useEffect(() => {
    setActiveSubTab(currentTab);
  }, [currentTab]);

  const handleTabSelect = (tab: SalesSubTab) => {
    setActiveSubTab(tab);
    if (onTabChange) {
      let targetNavTab: string = 'sales';
      switch (tab) {
        case 'dashboard':
          targetNavTab = 'sales-dashboard';
          break;
        case 'quotation':
          targetNavTab = 'sales-quotation';
          break;
        case 'order':
          targetNavTab = 'sales-order';
          break;
        case 'invoice':
          targetNavTab = 'sales-invoice';
          break;
        case 'return-request':
          targetNavTab = 'sales-return-request';
          break;
        case 'return':
          targetNavTab = 'sales-return';
          break;
        case 'ar-ledger':
          targetNavTab = 'sales-ar';
          break;
        case 'receipts':
          targetNavTab = 'finance-receipts';
          break;
        case 'report-quotation':
          targetNavTab = 'sales-quotation-report';
          break;
        case 'report-order':
          targetNavTab = 'sales-order-report';
          break;
        case 'report-invoice':
          targetNavTab = 'sales-invoice-report';
          break;
        case 'report-return-request':
          targetNavTab = 'sales-return-request-report';
          break;
        case 'report-return':
          targetNavTab = 'sales-return-report';
          break;
      }
      onTabChange(targetNavTab);
    }
  };

  // Convert tab to SalesWorkflowView stage
  const workflowInitialStage =
    activeSubTab === 'quotation'
      ? 'quotations'
      : activeSubTab === 'order'
      ? 'orders'
      : activeSubTab === 'invoice'
      ? 'invoices'
      : activeSubTab === 'return-request' || activeSubTab === 'return'
      ? 'returns'
      : 'orders';

  // Check if report tab
  const isReportTab = activeSubTab.startsWith('report-');
  const reportTypeMap: Record<string, SalesReportType> = {
    'report-quotation': 'sales-quotation-report',
    'report-order': 'sales-order-report',
    'report-invoice': 'sales-invoice-report',
    'report-return-request': 'sales-return-request-report',
    'report-return': 'sales-return-report',
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      {/* Module Navigation Tabs Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleTabSelect('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-xs border border-gray-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${activeSubTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Sales Dashboard</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                KPIs
              </span>
            </button>

            <button
              onClick={() => handleTabSelect('quotation')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'quotation'
                  ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeSubTab === 'quotation' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Sales Quotation</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                SQ
              </span>
            </button>

            <button
              onClick={() => handleTabSelect('order')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'order'
                  ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Receipt className={`w-3.5 h-3.5 ${activeSubTab === 'order' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Sales Order</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-[#0B5D2A] border border-emerald-200">
                SO
              </span>
            </button>

            <button
              onClick={() => handleTabSelect('invoice')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'invoice'
                  ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Receipt className={`w-3.5 h-3.5 ${activeSubTab === 'invoice' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Sales Invoice</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                SI
              </span>
            </button>

            <button
              onClick={() => handleTabSelect('return-request')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'return-request'
                  ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${activeSubTab === 'return-request' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Return Request</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                SRR
              </span>
            </button>

            <button
              onClick={() => handleTabSelect('return')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'return'
                  ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${activeSubTab === 'return' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Sales Return</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                SR
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
              Sales Lifecycle
            </span>
          </div>
        </div>
      </div>

      {/* Sub-view Content */}
      {activeSubTab === 'dashboard' ? (
        <OperationsDashboardView
          initialSection="sales"
          onNavigateToTab={(navTab) => {
            if (onTabChange) onTabChange(navTab);
          }}
          currentUserName={currentUserName}
        />
      ) : isReportTab ? (
        <SalesReportsView
          reportType={reportTypeMap[activeSubTab] || 'sales-quotation-report'}
          onNavigateTab={(docTab) => {
            if (docTab === 'sales-quotation') handleTabSelect('quotation');
            else if (docTab === 'sales-order') handleTabSelect('order');
            else if (docTab === 'sales-invoice') handleTabSelect('invoice');
            else if (docTab === 'sales-return-request') handleTabSelect('return-request');
            else if (docTab === 'sales-return') handleTabSelect('return');
          }}
        />
      ) : activeSubTab === 'ar-ledger' ? (
        <SalesCustomerLedgerView currentUserName={currentUserName} userRole={userRole} />
      ) : activeSubTab === 'receipts' ? (
        <ReceiptManagementView currentUserName={currentUserName} userRole={userRole} />
      ) : (
        <SalesWorkflowView initialStage={workflowInitialStage} />
      )}
    </div>
  );
};
