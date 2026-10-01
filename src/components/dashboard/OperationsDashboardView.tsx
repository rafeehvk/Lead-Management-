import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Boxes,
  Receipt,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Package,
  Layers,
  Users,
  FileSpreadsheet,
  Building2,
  Calendar,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft,
  FileCheck,
  Check,
  CreditCard,
  Wallet,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';
import {
  ItemMaster,
  SalesOrder,
  SalesInvoiceRecord,
  SalesQuotation,
  PurchaseOrder,
  PurchaseInvoiceRecord,
  PurchaseRequest,
  GoodsReceiptPO,
  StockMovement,
  PartyMaster,
} from '../../types/finance';
import { NavTab } from '../Sidebar';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export type DashboardSection = 'all' | 'sales' | 'purchase' | 'inventory';
export type TimeframeFilter = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'ytd';

interface OperationsDashboardViewProps {
  initialSection?: DashboardSection;
  onNavigateToTab?: (tab: NavTab) => void;
  currentUserName?: string;
}

export const OperationsDashboardView: React.FC<OperationsDashboardViewProps> = ({
  initialSection = 'all',
  onNavigateToTab,
  currentUserName = 'Operations Director',
}) => {
  // Navigation & View Mode
  const [activeSection, setActiveSection] = useState<DashboardSection>(initialSection);
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real data loaded from erpFinanceStorage
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [salesQuotations, setSalesQuotations] = useState<SalesQuotation[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoiceRecord[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoiceRecord[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptPO[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [parties, setParties] = useState<PartyMaster[]>([]);

  // Action / toast state
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showNotice = (text: string, type: 'success' | 'info' = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 3500);
  };

  const loadData = () => {
    setItems(erpFinanceStorage.getItems());
    setSalesQuotations(erpFinanceStorage.getSalesQuotations());
    setSalesOrders(erpFinanceStorage.getSalesOrders());
    setSalesInvoices(erpFinanceStorage.getSalesInvoices());
    setPurchaseRequests(erpFinanceStorage.getPurchaseRequests());
    setPurchaseOrders(erpFinanceStorage.getPurchaseOrders());
    setPurchaseInvoices(erpFinanceStorage.getPurchaseInvoices());
    setGoodsReceipts(erpFinanceStorage.getGoodsReceiptPOs());
    setStockMovements(erpFinanceStorage.getStockMovements());
    setParties(erpFinanceStorage.getParties());
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleDataChange);
  }, []);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  // Categories list from physical items
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [items]);

  // Date filtering helper
  const filterByDate = (dateStr: string) => {
    if (timeframe === 'all' || !dateStr) return true;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (timeframe === 'today') {
      return itemDate.toDateString() === now.toDateString();
    }
    if (timeframe === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return itemDate >= oneWeekAgo && itemDate <= now;
    }
    if (timeframe === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (timeframe === 'quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const qStart = new Date(now.getFullYear(), qMonth, 1);
      return itemDate >= qStart && itemDate <= now;
    }
    if (timeframe === 'ytd') {
      // Financial year starts April 1st in India
      const fiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const fyStart = new Date(fiscalYear, 3, 1);
      return itemDate >= fyStart;
    }
    return true;
  };

  // Filtered collections
  const filteredSalesInvoices = useMemo(
    () => salesInvoices.filter((inv) => filterByDate(inv.date)),
    [salesInvoices, timeframe]
  );
  const filteredSalesOrders = useMemo(
    () => salesOrders.filter((ord) => filterByDate(ord.date)),
    [salesOrders, timeframe]
  );
  const filteredPurchaseOrders = useMemo(
    () => purchaseOrders.filter((po) => filterByDate(po.date)),
    [purchaseOrders, timeframe]
  );
  const filteredPurchaseInvoices = useMemo(
    () => purchaseInvoices.filter((pi) => filterByDate(pi.date)),
    [purchaseInvoices, timeframe]
  );
  const filteredStockMovements = useMemo(
    () => stockMovements.filter((m) => filterByDate(m.date)),
    [stockMovements, timeframe]
  );

  // -------------------------------------------------------------
  // METRICS COMPUTATIONS
  // -------------------------------------------------------------

  // 1. Sales Metrics
  const salesMetrics = useMemo(() => {
    const totalRevenue = filteredSalesInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const totalCollected = filteredSalesInvoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const outstandingAR = filteredSalesInvoices.reduce(
      (s, i) => s + (i.status !== 'Cancelled' ? i.balanceAmount || 0 : 0),
      0
    );

    const activeOrders = filteredSalesOrders.filter(
      (o) => o.status === 'Confirmed' || o.status === 'Processing' || o.status === 'Partially Delivered'
    );
    const deliveredOrders = filteredSalesOrders.filter((o) => o.status === 'Fully Delivered' || o.status === 'Closed');
    const orderFulfillmentRate =
      filteredSalesOrders.length > 0
        ? Math.round((deliveredOrders.length / filteredSalesOrders.length) * 100)
        : 100;

    const acceptedQuotes = salesQuotations.filter((q) => q.status === 'Accepted' || q.status === 'Converted');
    const quoteWinRate =
      salesQuotations.length > 0
        ? Math.round((acceptedQuotes.length / salesQuotations.length) * 100)
        : 0;

    const overdueAR = filteredSalesInvoices
      .filter((i) => i.status === 'Overdue' || (i.balanceAmount > 0 && new Date(i.dueDate) < new Date()))
      .reduce((s, i) => s + i.balanceAmount, 0);

    return {
      totalRevenue,
      totalCollected,
      outstandingAR,
      overdueAR,
      activeOrdersCount: activeOrders.length,
      totalOrdersCount: filteredSalesOrders.length,
      orderFulfillmentRate,
      quoteWinRate,
      averageOrderValue:
        filteredSalesOrders.length > 0 ? Math.round(totalRevenue / filteredSalesOrders.length) : 0,
    };
  }, [filteredSalesInvoices, filteredSalesOrders, salesQuotations]);

  // 2. Purchase Metrics
  const purchaseMetrics = useMemo(() => {
    const totalSpend = filteredPurchaseInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const totalPaid = filteredPurchaseInvoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const pendingAP = filteredPurchaseInvoices.reduce((s, i) => s + (i.balanceAmount || 0), 0);

    const openPOs = filteredPurchaseOrders.filter(
      (po) =>
        po.status === 'Approved' ||
        po.status === 'Sent to Vendor' ||
        po.status === 'Partially Received'
    );
    const openPOValue = openPOs.reduce((s, po) => s + (po.grandTotal - (po.invoicedAmount || 0)), 0);

    const openPRs = purchaseRequests.filter((pr) => pr.status === 'Approved' || pr.status === 'Submitted');

    const pendingGRNs = goodsReceipts.filter((gr) => gr.status === 'Open' || gr.status === 'Partially Invoiced');

    return {
      totalSpend,
      totalPaid,
      pendingAP,
      openPOsCount: openPOs.length,
      openPOValue,
      openPRsCount: openPRs.length,
      pendingGRNsCount: pendingGRNs.length,
    };
  }, [filteredPurchaseInvoices, filteredPurchaseOrders, purchaseRequests, goodsReceipts]);

  // 3. Inventory Metrics
  const inventoryMetrics = useMemo(() => {
    const physicalItems = items.filter((i) => !i.isService);
    const totalValuation = physicalItems.reduce(
      (sum, i) => sum + (i.currentStock || 0) * (i.purchasePrice || 0),
      0
    );
    const lowStockItems = physicalItems.filter(
      (i) => (i.currentStock || 0) <= (i.reorderLevel || 10) && (i.currentStock || 0) > 0
    );
    const outOfStockItems = physicalItems.filter((i) => (i.currentStock || 0) <= 0);

    // Valuation by category
    const catMap: Record<string, { count: number; value: number }> = {};
    physicalItems.forEach((item) => {
      const cat = item.category || 'General';
      if (!catMap[cat]) catMap[cat] = { count: 0, value: 0 };
      catMap[cat].count += 1;
      catMap[cat].value += (item.currentStock || 0) * (item.purchasePrice || 0);
    });

    const categoryBreakdown = Object.entries(catMap).map(([category, val]) => ({
      category,
      count: val.count,
      value: val.value,
      percentage: totalValuation > 0 ? Math.round((val.value / totalValuation) * 100) : 0,
    }));

    return {
      totalValuation,
      totalSKUs: physicalItems.length,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems,
      outOfStockItems,
      categoryBreakdown,
    };
  }, [items]);

  // 4. Combined Operational Health
  const operationalHealth = useMemo(() => {
    const netOperationalMargin = salesMetrics.totalRevenue - purchaseMetrics.totalSpend;
    const marginPercent =
      salesMetrics.totalRevenue > 0
        ? Math.round((netOperationalMargin / salesMetrics.totalRevenue) * 100)
        : 0;

    return {
      netOperationalMargin,
      marginPercent,
    };
  }, [salesMetrics, purchaseMetrics]);

  // Fast-trigger to auto-create Purchase Request for low stock items
  const handleAutoCreatePR = (item: ItemMaster) => {
    const qtyToOrder = Math.max(item.reorderLevel * 2 - item.currentStock, 10);
    try {
      erpFinanceStorage.savePurchaseRequest({
        requestedBy: currentUserName,
        department: 'Operations & Inventory',
        branch: item.warehouse || 'Kochi Campus Warehouse',
        priority: item.currentStock <= 0 ? 'Urgent' : 'High',
        reason: `Auto-generated Reorder Trigger: Stock (${item.currentStock} ${item.baseUnit}) below reorder threshold (${item.reorderLevel})`,
        items: [
          {
            itemId: item.id,
            itemCode: item.code,
            itemName: item.name,
            quantity: qtyToOrder,
            unit: item.baseUnit,
            estimatedPrice: item.purchasePrice,
            estimatedTotal: qtyToOrder * item.purchasePrice,
          },
        ],
      });
      loadData();
      showNotice(`Purchase Request created for ${qtyToOrder} ${item.baseUnit} of ${item.name}`);
    } catch (e) {
      showNotice('Failed to generate PR. Please try again.', 'info');
    }
  };

  // Top Customers by Revenue
  const topCustomers = useMemo(() => {
    const custMap: Record<string, { name: string; revenue: number; ordersCount: number; balance: number }> = {};
    salesInvoices.forEach((inv) => {
      const id = inv.customerId || inv.customerName;
      if (!custMap[id]) {
        custMap[id] = { name: inv.customerName, revenue: 0, ordersCount: 0, balance: 0 };
      }
      custMap[id].revenue += inv.grandTotal || 0;
      custMap[id].ordersCount += 1;
      custMap[id].balance += inv.balanceAmount || 0;
    });
    return Object.values(custMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [salesInvoices]);

  // Top Suppliers by Spend
  const topVendors = useMemo(() => {
    const vendMap: Record<string, { name: string; spend: number; billsCount: number; pending: number }> = {};
    purchaseInvoices.forEach((inv) => {
      const id = inv.vendorId || inv.vendorName;
      if (!vendMap[id]) {
        vendMap[id] = { name: inv.vendorName, spend: 0, billsCount: 0, pending: 0 };
      }
      vendMap[id].spend += inv.grandTotal || 0;
      vendMap[id].billsCount += 1;
      vendMap[id].pending += inv.balanceAmount || 0;
    });
    return Object.values(vendMap)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);
  }, [purchaseInvoices]);

  // Top Selling Items
  const topSellingItems = useMemo(() => {
    const itemMap: Record<string, { code: string; name: string; qty: number; revenue: number }> = {};
    salesInvoices.forEach((inv) => {
      inv.items?.forEach((item) => {
        if (!itemMap[item.itemId]) {
          itemMap[item.itemId] = { code: item.itemCode, name: item.itemName, qty: 0, revenue: 0 };
        }
        itemMap[item.itemId].qty += item.quantity;
        itemMap[item.itemId].revenue += item.total;
      });
    });
    return Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [salesInvoices]);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & CONTROLS */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-[#168A45] to-emerald-600 text-white shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <span>Supply Chain & Operations Dashboard</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0B5D2A] border border-emerald-200">
                    Live ERP
                  </span>
                </h2>
                <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                  <span>Sales Revenue & Demand</span>
                  <span aria-hidden="true">·</span>
                  <span>Procurement Spend</span>
                  <span aria-hidden="true">·</span>
                  <span>Warehouse Inventory (GL 1300)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeframe & Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeframe('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeframe === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('month')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeframe === 'month' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('quarter')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeframe === 'quarter' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This Quarter
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('ytd')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeframe === 'ytd' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                FY 2026-27
              </button>
            </div>

            <button
              type="button"
              onClick={loadData}
              title="Refresh Data"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST BANNER */}
        {actionNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#168A45]" />
              <span>{actionNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* PERSPECTIVE NAVIGATION TABS */}
        {/* ----------------------------------------------------------- */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSection('all')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'all'
                ? 'bg-[#168A45] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Unified Supply Chain Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('sales')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'sales'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales Dashboard</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeSection === 'sales' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {salesMetrics.activeOrdersCount} Open
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('purchase')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'purchase'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Purchase Dashboard</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeSection === 'purchase' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {purchaseMetrics.openPOsCount} POs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('inventory')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'inventory'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Inventory Dashboard</span>
            {inventoryMetrics.lowStockCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black animate-pulse">
                {inventoryMetrics.lowStockCount} Reorder
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. UNIFIED OPERATIONS OVERVIEW (Active When 'all') */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'all' && (
        <div className="space-y-6">
          {/* TOP TRI-STREAM KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-blue-700 flex items-center space-x-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Sales Revenue</span>
                </span>
                <span className="text-[11px] text-slate-400">Total Billed</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatINR(salesMetrics.totalRevenue)}
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Collections: <strong className="text-emerald-700">{formatINR(salesMetrics.totalCollected)}</strong></span>
                <span>AR: <strong className="text-amber-700">{formatINR(salesMetrics.outstandingAR)}</strong></span>
              </div>
            </div>

            {/* Purchase Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Procurement Spend</span>
                </span>
                <span className="text-[11px] text-slate-400">Total Invoiced</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatINR(purchaseMetrics.totalSpend)}
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Paid: <strong className="text-emerald-700">{formatINR(purchaseMetrics.totalPaid)}</strong></span>
                <span>AP Due: <strong className="text-rose-700">{formatINR(purchaseMetrics.pendingAP)}</strong></span>
              </div>
            </div>

            {/* Inventory Valuation Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1.5">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Stock Valuation (GL 1300)</span>
                </span>
                <span className="text-[11px] text-slate-400">Warehouse Assets</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatINR(inventoryMetrics.totalValuation)}
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Active SKUs: <strong>{inventoryMetrics.totalSKUs}</strong></span>
                {inventoryMetrics.lowStockCount > 0 ? (
                  <span className="text-rose-700 font-bold">{inventoryMetrics.lowStockCount} Need Reorder</span>
                ) : (
                  <span className="text-emerald-700 font-bold">All Stocked</span>
                )}
              </div>
            </div>

            {/* Net Operating Spread */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-emerald-800">
                <span className="font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Net Operating Spread</span>
                </span>
                <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-full text-emerald-800 shadow-2xs">
                  {operationalHealth.marginPercent}% Margin
                </span>
              </div>
              <div className="text-2xl font-black text-[#0B5D2A] mt-2">
                {formatINR(operationalHealth.netOperationalMargin)}
              </div>
              <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800">
                <span>Fulfillment: <strong>{salesMetrics.orderFulfillmentRate}%</strong></span>
                <span>Open POs: <strong>{purchaseMetrics.openPOsCount}</strong></span>
              </div>
            </div>
          </div>

          {/* CROSS-MODULE VALUE CHAIN PIPELINE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-[#168A45]" />
                <span>End-to-End Operational Pipeline & Inventory Balancing</span>
              </h3>
              <span className="text-xs text-slate-500">Live order status across Sales, Warehouse & Procurement</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              {/* Stage 1: Demand */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span>1. Sales Demand</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Inbound</span>
                </div>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div className="flex justify-between">
                    <span>Quotations Active:</span>
                    <strong className="text-slate-900">{salesQuotations.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Confirmed Orders:</span>
                    <strong className="text-slate-900">{salesMetrics.totalOrdersCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Awaiting Fulfillment:</span>
                    <strong className="text-blue-700">{salesMetrics.activeOrdersCount}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('sales-order')}
                  className="w-full text-center py-1 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors text-[11px] cursor-pointer"
                >
                  View Sales Orders &rarr;
                </button>
              </div>

              {/* Stage 2: Inventory */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>2. Warehouse Stock</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Holding</span>
                </div>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div className="flex justify-between">
                    <span>Available SKUs:</span>
                    <strong className="text-slate-900">{inventoryMetrics.totalSKUs}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Below Reorder Level:</span>
                    <strong className="text-rose-700 font-black">{inventoryMetrics.lowStockCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock Move Logs:</span>
                    <strong className="text-slate-900">{stockMovements.length}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('inventory-items')}
                  className="w-full text-center py-1 bg-white hover:bg-amber-50 text-amber-800 font-bold rounded-lg border border-amber-200 transition-colors text-[11px] cursor-pointer"
                >
                  View Inventory &rarr;
                </button>
              </div>

              {/* Stage 3: Procurement */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span>3. Supplier Pipeline</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Replenish</span>
                </div>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div className="flex justify-between">
                    <span>Active Requisitions:</span>
                    <strong className="text-slate-900">{purchaseMetrics.openPRsCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Dispatched POs:</span>
                    <strong className="text-slate-900">{purchaseMetrics.openPOsCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Committed PO Value:</span>
                    <strong className="text-emerald-800">{formatINR(purchaseMetrics.openPOValue)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('purchase-order')}
                  className="w-full text-center py-1 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition-colors text-[11px] cursor-pointer"
                >
                  View Purchase Orders &rarr;
                </button>
              </div>

              {/* Stage 4: Financial Settlement */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-purple-900">
                  <span>4. Cashflow Settlement</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">Liquidity</span>
                </div>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div className="flex justify-between">
                    <span>Receivable Inflow:</span>
                    <strong className="text-emerald-700">{formatINR(salesMetrics.totalCollected)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Payable Outflow:</span>
                    <strong className="text-rose-700">{formatINR(purchaseMetrics.totalPaid)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Operating Cash:</span>
                    <strong className="text-purple-800">
                      {formatINR(salesMetrics.totalCollected - purchaseMetrics.totalPaid)}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('sales-ar')}
                  className="w-full text-center py-1 bg-white hover:bg-purple-50 text-purple-800 font-bold rounded-lg border border-purple-200 transition-colors text-[11px] cursor-pointer"
                >
                  View Settlement Ledgers &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* CRITICAL ACTION WORKBENCH: LOW STOCK TRIGGERS */}
          {inventoryMetrics.lowStockCount > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-black text-rose-900">
                      Critical Stock Replenishment Warnings ({inventoryMetrics.lowStockCount} SKUs below threshold)
                    </h4>
                    <p className="text-xs text-rose-700">
                      These warehouse items risk holding up sales delivery. One-click create instant Purchase Requests.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {inventoryMetrics.lowStockItems.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-900">{item.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{item.code}</div>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {item.currentStock} {item.baseUnit} Left
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Reorder Threshold:</span>
                          <strong>{item.reorderLevel} {item.baseUnit}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated Unit Cost:</span>
                          <strong>{formatINR(item.purchasePrice)}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAutoCreatePR(item)}
                      className="mt-3 w-full py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Auto-Generate Purchase Request</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TWO-COLUMN BREAKDOWN: TOP CUSTOMERS VS TOP VENDORS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Customers */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Top Revenue Customers</span>
                </h4>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('party-directory')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {topCustomers.map((cust, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-400">{cust.ordersCount} invoices billed</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">{formatINR(cust.revenue)}</div>
                      {cust.balance > 0 ? (
                        <div className="text-[10px] text-amber-700 font-semibold">
                          Due: {formatINR(cust.balance)}
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-700 font-semibold">Settled</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Vendors */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>Top Procurement Vendors</span>
                </h4>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('purchase-payments')}
                  className="text-xs font-bold text-[#168A45] hover:text-[#0B5D2A] cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {topVendors.map((vend, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">{vend.name}</div>
                      <div className="text-[11px] text-slate-400">{vend.billsCount} bills booked</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">{formatINR(vend.spend)}</div>
                      {vend.pending > 0 ? (
                        <div className="text-[10px] text-rose-700 font-semibold">
                          Payable: {formatINR(vend.pending)}
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-700 font-semibold">Clear</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. DEDICATED SALES DASHBOARD (Active When 'sales') */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'sales' && (
        <div className="space-y-6">
          {/* Sales KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Billed Revenue</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatINR(salesMetrics.totalRevenue)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                From {filteredSalesInvoices.length} sales invoices
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-emerald-700">Cash Collections</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {formatINR(salesMetrics.totalCollected)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Settled & deposited</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-amber-700">Receivables Outstanding</div>
              <div className="text-2xl font-black text-amber-800 mt-1">
                {formatINR(salesMetrics.outstandingAR)}
              </div>
              <div className="text-[11px] text-rose-600 mt-1">
                Overdue: {formatINR(salesMetrics.overdueAR)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-blue-700">Order Fulfillment</div>
              <div className="text-2xl font-black text-blue-900 mt-1">
                {salesMetrics.orderFulfillmentRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Quote Win Rate: {salesMetrics.quoteWinRate}%
              </div>
            </div>
          </div>

          {/* Quick Actions Bar for Sales */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="font-extrabold text-blue-950 flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Sales Operations Quick Workflows:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToTab?.('sales-quotation')}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Sales Quotation</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('sales-order')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Sales Order</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('sales-invoice')}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors shadow-2xs cursor-pointer"
              >
                Generate Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('sales-receipts')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Receipt</span>
              </button>
            </div>
          </div>

          {/* Top Selling Items & Recent Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Products */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-extrabold text-slate-900">Best-Selling Products &amp; SKUs</h4>
                <span className="text-xs text-slate-500">By Billed Revenue</span>
              </div>
              <div className="divide-y divide-slate-100">
                {topSellingItems.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">{item.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{item.code} • {item.qty} units sold</div>
                    </div>
                    <div className="text-right font-black text-slate-900">
                      {formatINR(item.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sales Invoices */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-extrabold text-slate-900">Recent Sales Invoices</h4>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('sales-invoice')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {salesInvoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-500">{inv.customerName} • {inv.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">{formatINR(inv.grandTotal)}</div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. DEDICATED PURCHASE DASHBOARD (Active When 'purchase') */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'purchase' && (
        <div className="space-y-6">
          {/* Purchase KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Procurement Spend</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatINR(purchaseMetrics.totalSpend)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                From {filteredPurchaseInvoices.length} vendor bills
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-emerald-800">Settled Payments</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {formatINR(purchaseMetrics.totalPaid)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Disbursed to suppliers</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-rose-700">Accounts Payable (AP)</div>
              <div className="text-2xl font-black text-rose-800 mt-1">
                {formatINR(purchaseMetrics.pendingAP)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Pending vendor settlements</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-blue-700">Committed PO Pipeline</div>
              <div className="text-2xl font-black text-blue-900 mt-1">
                {formatINR(purchaseMetrics.openPOValue)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Across {purchaseMetrics.openPOsCount} active POs
              </div>
            </div>
          </div>

          {/* Quick Actions Bar for Purchase */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="font-extrabold text-emerald-950 flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-[#168A45]" />
              <span>Procurement Operations Quick Workflows:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToTab?.('purchase-request')}
                className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition-colors shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Purchase Request</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('purchase-order')}
                className="px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Purchase Order</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('goods-receipt')}
                className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
              >
                Record Goods Receipt (GRN)
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('purchase-payments')}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Vendor Payment Advice</span>
              </button>
            </div>
          </div>

          {/* Open Purchase Orders & Open Goods Receipts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Open POs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-extrabold text-slate-900">Active Purchase Orders</h4>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('purchase-order')}
                  className="text-xs font-bold text-[#168A45] hover:text-[#0B5D2A] cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {purchaseOrders.slice(0, 5).map((po) => (
                  <div key={po.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">{po.poNumber}</div>
                      <div className="text-[11px] text-slate-500">{po.vendorName} • {po.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">{formatINR(po.grandTotal)}</div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {po.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goods Receipts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-extrabold text-slate-900">Recent Goods Receipts (GRN)</h4>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('goods-receipt')}
                  className="text-xs font-bold text-[#168A45] hover:text-[#0B5D2A] cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {goodsReceipts.slice(0, 5).map((gr) => (
                  <div key={gr.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">{gr.grpoNumber}</div>
                      <div className="text-[11px] text-slate-500">{gr.vendorName} • PO: {gr.poNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">{gr.totalReceivedQty} units</div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {gr.inspectionStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. DEDICATED INVENTORY DASHBOARD (Active When 'inventory') */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Stock Valuation</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatINR(inventoryMetrics.totalValuation)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">GL Account 1300</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-emerald-700">Active SKUs Catalog</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {inventoryMetrics.totalSKUs}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Physical stock items</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-amber-700">Below Reorder Level</div>
              <div className="text-2xl font-black text-amber-800 mt-1">
                {inventoryMetrics.lowStockCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Need procurement action</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-rose-700">Zero Stock Outages</div>
              <div className="text-2xl font-black text-rose-800 mt-1">
                {inventoryMetrics.outOfStockCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Immediate stockout risk</div>
            </div>
          </div>

          {/* Quick Actions Bar for Inventory */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="font-extrabold text-amber-950 flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-amber-600" />
              <span>Inventory &amp; Warehouse Operations:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToTab?.('inventory-items')}
                className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 font-bold rounded-lg border border-amber-200 transition-colors shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Item SKU</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('inventory-valuation')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                Valuation &amp; FIFO Analysis
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('inventory-movements')}
                className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 font-bold rounded-lg border border-amber-200 transition-colors shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Stock Movement Ledger</span>
              </button>
            </div>
          </div>

          {/* Category Valuation Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900">Inventory Valuation by Category</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {inventoryMetrics.categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 truncate">{cat.category}</span>
                    <span className="text-[10px] font-bold text-slate-500">{cat.count} Items</span>
                  </div>
                  <div className="text-base font-black text-[#168A45]">{formatINR(cat.value)}</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#168A45] h-full rounded-full"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">{cat.percentage}% of total</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Stock Movements Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                <span>Recent Stock Movements</span>
              </h4>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('inventory-movements')}
                className="text-xs font-bold text-[#168A45] hover:text-[#0B5D2A] cursor-pointer"
              >
                View Ledger &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Movement Type</th>
                    <th className="py-2 px-3 text-right">Quantity</th>
                    <th className="py-2 px-3 text-right">Unit Value</th>
                    <th className="py-2 px-3 text-right">Total Value</th>
                    <th className="py-2 px-3">Warehouse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No recent stock movements recorded.
                      </td>
                    </tr>
                  ) : (
                    stockMovements.slice(0, 8).map((m) => {
                      const isInward = m.type.includes('In');
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{m.date}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-extrabold text-slate-900">{m.itemName}</div>
                            <div className="font-mono text-[10px] text-slate-400">{m.itemCode}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isInward ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">
                            {isInward ? `+${m.quantity}` : `-${m.quantity}`} {m.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{formatINR(m.unitCost)}</td>
                          <td className="py-2.5 px-3 text-right font-black text-[#168A45]">
                            {formatINR(m.totalValue)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 truncate max-w-[140px]">
                            {m.warehouse || 'Central'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
