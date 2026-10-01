import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CreditCard,
  Layers,
  Truck,
  FileText,
  FileCheck,
  Award,
  PackageCheck,
  Receipt,
  Clock,
  RotateCcw,
  FileSpreadsheet,
  LayoutDashboard,
} from 'lucide-react';
import { PurchaseWorkflowView } from '../finance/purchase/PurchaseWorkflowView';
import { PaymentManagementView } from '../finance/payments/PaymentManagementView';
import { AdvanceAdjustmentManagementView } from '../finance/payments/AdvanceAdjustmentManagementView';
import { PurchaseReportsView, PurchaseReportType } from './PurchaseReportsView';
import { OperationsDashboardView } from '../dashboard/OperationsDashboardView';

export type PurchaseSubTab =
  | 'dashboard'
  | 'request'
  | 'quotation'
  | 'comparison'
  | 'order'
  | 'goods-receipt'
  | 'invoice'
  | 'return-request'
  | 'return'
  | 'payments'
  | 'advances'
  | 'report-request'
  | 'report-quotation'
  | 'report-comparison'
  | 'report-order'
  | 'report-goods-receipt'
  | 'report-invoice'
  | 'report-return-request'
  | 'report-return';

export interface PurchaseModuleProps {
  currentTab?: PurchaseSubTab;
  currentUserName?: string;
  userRole?: string;
  onTabChange?: (tab: string) => void;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({
  currentTab = 'dashboard',
  currentUserName = 'Purchase Manager',
  userRole = 'Admin',
  onTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<PurchaseSubTab>(currentTab);

  useEffect(() => {
    setActiveSubTab(currentTab);
  }, [currentTab]);

  const handleTabSelect = (tab: PurchaseSubTab) => {
    setActiveSubTab(tab);
    if (onTabChange) {
      let targetNavTab = 'purchase';
      switch (tab) {
        case 'dashboard':
          targetNavTab = 'purchase-dashboard';
          break;
        case 'request':
          targetNavTab = 'purchase-request';
          break;
        case 'quotation':
          targetNavTab = 'purchase-quotation';
          break;
        case 'comparison':
          targetNavTab = 'purchase-quotation-comparison';
          break;
        case 'order':
          targetNavTab = 'purchase-order';
          break;
        case 'goods-receipt':
          targetNavTab = 'goods-receipt';
          break;
        case 'invoice':
          targetNavTab = 'purchase-invoice';
          break;
        case 'return-request':
          targetNavTab = 'purchase-return-request';
          break;
        case 'return':
          targetNavTab = 'purchase-return';
          break;
        case 'payments':
          targetNavTab = 'finance-payments';
          break;
        case 'advances':
          targetNavTab = 'finance-advances';
          break;
        case 'report-request':
          targetNavTab = 'purchase-request-report';
          break;
        case 'report-quotation':
          targetNavTab = 'purchase-quotation-report';
          break;
        case 'report-comparison':
          targetNavTab = 'purchase-quotation-comparison-report';
          break;
        case 'report-order':
          targetNavTab = 'purchase-order-report';
          break;
        case 'report-goods-receipt':
          targetNavTab = 'goods-receipt-report';
          break;
        case 'report-invoice':
          targetNavTab = 'purchase-invoice-report';
          break;
        case 'report-return-request':
          targetNavTab = 'purchase-return-request-report';
          break;
        case 'report-return':
          targetNavTab = 'purchase-return-report';
          break;
      }
      onTabChange(targetNavTab);
    }
  };

  // Convert tab to PurchaseWorkflowView stage
  const workflowInitialStage =
    activeSubTab === 'request'
      ? 'requests'
      : activeSubTab === 'quotation' || activeSubTab === 'comparison'
      ? 'quotations'
      : activeSubTab === 'order'
      ? 'orders'
      : activeSubTab === 'goods-receipt'
      ? 'grpo'
      : activeSubTab === 'invoice'
      ? 'invoices'
      : activeSubTab === 'return-request' || activeSubTab === 'return'
      ? 'returns'
      : 'requests';

  // Check if report tab
  const isReportTab = activeSubTab.startsWith('report-');
  const reportTypeMap: Record<string, PurchaseReportType> = {
    'report-request': 'purchase-request-report',
    'report-quotation': 'purchase-quotation-report',
    'report-comparison': 'purchase-quotation-comparison-report',
    'report-order': 'purchase-order-report',
    'report-goods-receipt': 'goods-receipt-report',
    'report-invoice': 'purchase-invoice-report',
    'report-return-request': 'purchase-return-request-report',
    'report-return': 'purchase-return-report',
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      {/* Module Header Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleTabSelect('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'dashboard'
                  ? 'bg-white text-emerald-800 shadow-xs border border-gray-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${activeSubTab === 'dashboard' ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span>Purchase Dashboard</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                KPIs
              </span>
            </button>

            <button
              onClick={() => handleTabSelect('request')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'request'
                  ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeSubTab === 'request' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Purchase Request</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                PR
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
              <FileCheck className={`w-3.5 h-3.5 ${activeSubTab === 'quotation' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Purchase Quotation</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                PQ
              </span>
            </button>

            <button
              onClick={() => handleTabSelect('comparison')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'comparison'
                  ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Award className={`w-3.5 h-3.5 ${activeSubTab === 'comparison' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Quotation Comparison</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                L1
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
              <ShoppingBag className={`w-3.5 h-3.5 ${activeSubTab === 'order' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Purchase Order</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-[#0B5D2A] border border-emerald-200">
                PO
              </span>
            </button>

            <button
              onClick={() => handleTabSelect('goods-receipt')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'goods-receipt'
                  ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <PackageCheck className={`w-3.5 h-3.5 ${activeSubTab === 'goods-receipt' ? 'text-[#168A45]' : 'text-slate-400'}`} />
              <span>Goods Receipt</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                GRPO
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
              <span>Purchase Invoice</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                PI
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
                PRR
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
              <span>Purchase Return</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                DN
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              Procurement Lifecycle
            </span>
          </div>
        </div>
      </div>

      {/* Sub-view Content */}
      {activeSubTab === 'dashboard' ? (
        <OperationsDashboardView
          initialSection="purchase"
          onNavigateToTab={(navTab) => {
            if (onTabChange) onTabChange(navTab);
          }}
          currentUserName={currentUserName}
        />
      ) : isReportTab ? (
        <PurchaseReportsView
          reportType={reportTypeMap[activeSubTab] || 'purchase-request-report'}
          onNavigateTab={(docTab) => {
            if (docTab === 'purchase-request') handleTabSelect('request');
            else if (docTab === 'purchase-quotation') handleTabSelect('quotation');
            else if (docTab === 'purchase-quotation-comparison') handleTabSelect('comparison');
            else if (docTab === 'purchase-order') handleTabSelect('order');
            else if (docTab === 'goods-receipt') handleTabSelect('goods-receipt');
            else if (docTab === 'purchase-invoice') handleTabSelect('invoice');
            else if (docTab === 'purchase-return-request') handleTabSelect('return-request');
            else if (docTab === 'purchase-return') handleTabSelect('return');
          }}
        />
      ) : activeSubTab === 'payments' ? (
        <PaymentManagementView currentUserName={currentUserName} userRole={userRole} />
      ) : activeSubTab === 'advances' ? (
        <AdvanceAdjustmentManagementView />
      ) : (
        <PurchaseWorkflowView
          initialStage={workflowInitialStage}
          autoOpenComparison={activeSubTab === 'comparison'}
        />
      )}
    </div>
  );
};
