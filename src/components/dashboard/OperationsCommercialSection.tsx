import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Boxes,
  Receipt,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  Plus,
  Layers,
  ChevronRight,
  PackageCheck,
  Landmark,
  BadgeAlert,
} from 'lucide-react';
import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';
import { NavTab } from '../Sidebar';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

interface OperationsCommercialSectionProps {
  onNavigateToTab: (tab: NavTab) => void;
}

export const OperationsCommercialSection: React.FC<OperationsCommercialSectionProps> = ({
  onNavigateToTab,
}) => {
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const handleDataChange = () => setDataVersion((v) => v + 1);
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleDataChange);
  }, []);

  // Compute live metrics from erpFinanceStorage
  const metrics = useMemo(() => {
    // 1. Sales
    const salesInvoices = erpFinanceStorage.getSalesInvoices();
    const salesOrders = erpFinanceStorage.getSalesOrders();
    const salesQuotations = erpFinanceStorage.getSalesQuotations();

    const salesRevenue = salesInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const outstandingAR = salesInvoices.reduce(
      (s, i) => s + (i.status !== 'Cancelled' ? i.balanceAmount || 0 : 0),
      0
    );
    const activeSalesOrders = salesOrders.filter(
      (o) => o.status === 'Confirmed' || o.status === 'Processing' || o.status === 'Partially Delivered'
    );
    const wonQuotations = salesQuotations.filter((q) => q.status === 'Accepted' || q.status === 'Converted');
    const quoteWinRate =
      salesQuotations.length > 0 ? Math.round((wonQuotations.length / salesQuotations.length) * 100) : 75;

    // 2. Purchase
    const purchaseInvoices = erpFinanceStorage.getPurchaseInvoices();
    const purchaseOrders = erpFinanceStorage.getPurchaseOrders();
    const purchaseRequests = erpFinanceStorage.getPurchaseRequests();
    const goodsReceipts = erpFinanceStorage.getGoodsReceiptPOs();

    const purchaseSpend = purchaseInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const pendingAP = purchaseInvoices.reduce((s, i) => s + (i.balanceAmount || 0), 0);
    const openPOs = purchaseOrders.filter(
      (po) =>
        po.status === 'Approved' ||
        po.status === 'Sent to Vendor' ||
        po.status === 'Partially Received'
    );
    const openPOValue = openPOs.reduce((s, po) => s + (po.grandTotal - (po.invoicedAmount || 0)), 0);
    const pendingGRNs = goodsReceipts.filter((gr) => gr.status === 'Open' || gr.status === 'Partially Invoiced');

    // 3. Inventory
    const items = erpFinanceStorage.getItems().filter((i) => !i.isService);
    const stockValuation = items.reduce(
      (sum, i) => sum + (i.currentStock || 0) * (i.purchasePrice || 0),
      0
    );
    const lowStockItems = items.filter(
      (i) => (i.currentStock || 0) <= (i.reorderLevel || 10) && (i.currentStock || 0) > 0
    );
    const outOfStockItems = items.filter((i) => (i.currentStock || 0) <= 0);

    // Operational Net Margin
    const netMargin = salesRevenue - purchaseSpend;
    const marginPercent = salesRevenue > 0 ? Math.round((netMargin / salesRevenue) * 100) : 0;

    return {
      salesRevenue,
      outstandingAR,
      activeOrdersCount: activeSalesOrders.length,
      quoteWinRate,
      purchaseSpend,
      pendingAP,
      openPOsCount: openPOs.length,
      openPOValue,
      pendingGRNsCount: pendingGRNs.length,
      stockValuation,
      totalSKUs: items.length,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      netMargin,
      marginPercent,
    };
  }, [dataVersion]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-2xs space-y-6">
      {/* Header with Unified Tri-Pillar Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#0B5D2A] to-[#168A45] text-white shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Commercial & Supply Chain Operations
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0B5D2A] border border-emerald-200">
                Sales · Purchase · Inventory
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified command center with real-time operational KPI tracking across commercial lifecycles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateToTab('operations-dashboard')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span>Open Operations Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* 3 Dedicated Dashboard Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: SALES DASHBOARD */}
        <div className="bg-gradient-to-b from-blue-50/40 via-white to-white border border-blue-100/90 rounded-2xl p-4.5 hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Sales Dashboard</h4>
                  <p className="text-[11px] text-slate-500">Revenue, Orders & AR</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {metrics.quoteWinRate}% Win Rate
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Revenue</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {formatINR(metrics.salesRevenue)}
                </div>
                <div className="text-[10px] font-medium text-emerald-600 mt-0.5 flex items-center">
                  <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> Invoiced YTD
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Outstanding AR</div>
                <div className="text-base font-black text-blue-700 mt-0.5">
                  {formatINR(metrics.outstandingAR)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {metrics.activeOrdersCount} Active Orders
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-blue-50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigateToTab('sales-quotation')}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New Quotation</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('sales-dashboard')}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 group-hover:text-blue-900 transition-colors cursor-pointer"
            >
              <span>Explore Sales</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* CARD 2: PURCHASE DASHBOARD */}
        <div className="bg-gradient-to-b from-emerald-50/40 via-white to-white border border-emerald-100/90 rounded-2xl p-4.5 hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-[#0B5D2A]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Purchase Dashboard</h4>
                  <p className="text-[11px] text-slate-500">Procurement, POs & AP</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0B5D2A] border border-emerald-200">
                {metrics.openPOsCount} Open POs
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Spend</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {formatINR(metrics.purchaseSpend)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  PO: {formatINR(metrics.openPOValue)}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Pending AP</div>
                <div className="text-base font-black text-emerald-800 mt-0.5">
                  {formatINR(metrics.pendingAP)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {metrics.pendingGRNsCount} Pending GRNs
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-emerald-50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigateToTab('purchase-request')}
              className="text-[11px] font-semibold text-[#0B5D2A] hover:text-[#168A45] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New PR</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('purchase-dashboard')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0B5D2A] group-hover:text-[#168A45] transition-colors cursor-pointer"
            >
              <span>Explore Purchase</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* CARD 3: INVENTORY DASHBOARD */}
        <div className="bg-gradient-to-b from-amber-50/40 via-white to-white border border-amber-100/90 rounded-2xl p-4.5 hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Inventory Dashboard</h4>
                  <p className="text-[11px] text-slate-500">Valuation, SKUs & Stock</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                GL 1300 Asset
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Stock Valuation</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {formatINR(metrics.stockValuation)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {metrics.totalSKUs} Total SKUs
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Stock Alerts</div>
                <div className="text-base font-black text-amber-700 mt-0.5 flex items-center gap-1.5">
                  <span>{metrics.lowStockCount} Low</span>
                  {metrics.outOfStockCount > 0 && (
                    <span className="text-xs px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-md font-bold">
                      {metrics.outOfStockCount} Out
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Reorder Thresholds
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-amber-50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigateToTab('inventory-items')}
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Item Master</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('inventory-dashboard')}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 group-hover:text-amber-950 transition-colors cursor-pointer"
            >
              <span>Explore Inventory</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
