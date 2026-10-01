import React, { useState, useMemo, useEffect } from 'react';
import {
  Landmark,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Boxes,
  ArrowDownToLine,
  Download,
  Printer,
  FileText,
} from 'lucide-react';
import { ItemMaster } from '../../types/finance';
import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';
import { DocumentPrintPdfModal } from '../common/DocumentPrintPdfModal';
import { ThemedDocumentData } from '../finance/themes/ThemedDocumentRenderer';
import { convertInventoryValuationToDoc } from '../../utils/documentConversionHelpers';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const InventoryValuationView: React.FC = () => {
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');

  // Document View State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [activeDocData, setActiveDocData] = useState<ThemedDocumentData | null>(null);
  const [isDocFullScreen, setIsDocFullScreen] = useState(false);

  const handleOpenPrintPdf = (fullScreen = false) => {
    setActiveDocData(convertInventoryValuationToDoc(filteredItems));
    setIsDocFullScreen(fullScreen);
    setIsDocModalOpen(true);
  };

  const loadData = () => {
    setItems(erpFinanceStorage.getItems());
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleDataChange);
  }, []);

  const physicalItems = useMemo(() => {
    return items.filter((item) => !item.isService);
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set(physicalItems.map((i) => i.category));
    return ['All', ...Array.from(set)];
  }, [physicalItems]);

  const filteredItems = useMemo(() => {
    return physicalItems.filter((item) => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (methodFilter !== 'All' && item.valuationMethod !== methodFilter) return false;
      if (statusFilter === 'Low' && item.currentStock > item.reorderLevel) return false;
      if (statusFilter === 'Out' && item.currentStock > 0) return false;
      if (statusFilter === 'InStock' && item.currentStock <= 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.hsnCode.includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [physicalItems, categoryFilter, methodFilter, statusFilter, searchQuery]);

  // Overall inventory metrics
  const metrics = useMemo(() => {
    let totalAssetValue = 0;
    let totalSalesValue = 0;
    let totalQuantity = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const categoryBreakdown: Record<string, { count: number; value: number }> = {};

    physicalItems.forEach((item) => {
      const stock = Math.max(0, item.currentStock);
      const val = stock * item.purchasePrice;
      const retailVal = stock * item.salesPrice;

      totalAssetValue += val;
      totalSalesValue += retailVal;
      totalQuantity += stock;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= item.reorderLevel) {
        lowStockCount++;
      }

      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { count: 0, value: 0 };
      }
      categoryBreakdown[item.category].count += 1;
      categoryBreakdown[item.category].value += val;
    });

    const potentialMargin = totalSalesValue - totalAssetValue;
    const marginPercent = totalSalesValue > 0 ? (potentialMargin / totalSalesValue) * 100 : 0;

    return {
      totalAssetValue,
      totalSalesValue,
      totalQuantity,
      lowStockCount,
      outOfStockCount,
      potentialMargin,
      marginPercent,
      categoryBreakdown,
    };
  }, [physicalItems]);

  const handleExportCSV = () => {
    const headers = [
      'Item Code',
      'Item Name',
      'Category',
      'HSN Code',
      'UOM',
      'Valuation Method',
      'Purchase Cost (INR)',
      'Current Stock',
      'Reorder Level',
      'Total Asset Valuation (INR)',
      'Sales Price (INR)',
      'Potential Retail Value (INR)',
      'Status',
    ];

    const rows = filteredItems.map((item) => {
      const stock = item.currentStock;
      const assetVal = stock * item.purchasePrice;
      const retailVal = stock * item.salesPrice;
      let status = 'In Stock';
      if (stock === 0) status = 'Out of Stock';
      else if (stock <= item.reorderLevel) status = 'Low Stock';

      return [
        `"${item.code}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        `"${item.hsnCode}"`,
        `"${item.baseUnit}"`,
        `"${item.valuationMethod || 'FIFO'}"`,
        item.purchasePrice,
        stock,
        item.reorderLevel,
        assetVal,
        item.salesPrice,
        retailVal,
        `"${status}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Valuation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Valuation KPIs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-emerald-50 rounded-xl text-[#168A45] border border-emerald-200/80">
                <Landmark className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Live Inventory Valuation & Asset Breakdown
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#0B5D2A] border border-emerald-200">
                GL 1300 Synced
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Perpetual inventory accounting synced with FIFO / Weighted Average methods. Calculates closing stock assets
              against real-time purchase rates.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleOpenPrintPdf(false)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer ring-1 ring-emerald-500/30"
              title="Open official Inventory Valuation document with Print/PDF dialogue and full-screen layout optimization"
            >
              <Printer className="w-4 h-4" />
              <span>Print/PDF Report</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3.5 bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 rounded-xl border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Total Stock Valuation
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-[#0B5D2A] border border-emerald-200">
                Cost Basis
              </span>
            </div>
            <div className="text-xl font-extrabold font-mono text-[#0B5D2A] mt-1.5">
              {formatINR(metrics.totalAssetValue)}
            </div>
            <p className="text-[11px] text-emerald-800/80 mt-1">Carried on Balance Sheet (Asset 1300)</p>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-blue-50/70 to-blue-100/30 rounded-xl border border-blue-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                Retail / Selling Value
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-blue-800 border border-blue-200">
                Sales Basis
              </span>
            </div>
            <div className="text-xl font-extrabold font-mono text-blue-900 mt-1.5">
              {formatINR(metrics.totalSalesValue)}
            </div>
            <p className="text-[11px] text-blue-800/80 mt-1">Potential gross realization at list rates</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Stock On Hand
              </span>
              <Boxes className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900 mt-1.5">
              {metrics.totalQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-500">Units</span>
            </div>
            <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-600">
              <span>{physicalItems.length} Physical SKUs</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Unrealized Margin
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold font-mono text-emerald-700 mt-1.5">
              {metrics.marginPercent.toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Spread: {formatINR(metrics.potentialMargin)}
            </p>
          </div>
        </div>

        {/* Category breakdown bar */}
        {metrics.totalAssetValue > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-700">Valuation Distribution by Category</span>
              <span className="text-slate-500 font-mono">100% Allocated</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              {(Object.entries(metrics.categoryBreakdown) as [string, { count: number; value: number }][]).map(([cat, data], idx) => {
                const pct = metrics.totalAssetValue > 0 ? (data.value / metrics.totalAssetValue) * 100 : 0;
                if (pct <= 0) return null;
                const colors = [
                  'bg-emerald-600',
                  'bg-blue-600',
                  'bg-purple-600',
                  'bg-amber-600',
                  'bg-indigo-600',
                  'bg-cyan-600',
                ];
                return (
                  <div
                    key={cat}
                    style={{ width: `${pct}%` }}
                    className={`${colors[idx % colors.length]} h-full transition-all`}
                    title={`${cat}: ${formatINR(data.value)} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[11px]">
              {(Object.entries(metrics.categoryBreakdown) as [string, { count: number; value: number }][]).map(([cat, data], idx) => {
                const pct = metrics.totalAssetValue > 0 ? (data.value / metrics.totalAssetValue) * 100 : 0;
                const dotColors = [
                  'bg-emerald-600',
                  'bg-blue-600',
                  'bg-purple-600',
                  'bg-amber-600',
                  'bg-indigo-600',
                  'bg-cyan-600',
                ];
                return (
                  <div key={cat} className="flex items-center space-x-1.5 text-slate-600">
                    <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                    <span className="font-medium">{cat}:</span>
                    <span className="font-mono font-bold text-slate-800">{formatINR(data.value)}</span>
                    <span className="text-slate-400">({pct.toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Valuation Breakdown Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="All">All Valuation Methods</option>
              <option value="FIFO">FIFO (First-In, First-Out)</option>
              <option value="Weighted Average">Weighted Average</option>
              <option value="Standard Cost">Standard Cost</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="All">All Stock Levels</option>
              <option value="InStock">Healthy Stock (&gt; Reorder)</option>
              <option value="Low">Low Stock (&le; Reorder)</option>
              <option value="Out">Out of Stock (0)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800">{filteredItems.length}</span> SKUs
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Item Code & Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Method</th>
                <th className="py-3 px-4 text-right">Unit Cost (Buy)</th>
                <th className="py-3 px-4 text-right">Selling Rate</th>
                <th className="py-3 px-4 text-right">On-Hand Qty</th>
                <th className="py-3 px-4 text-right">Asset Valuation</th>
                <th className="py-3 px-4 text-right">Retail Potential</th>
                <th className="py-3 px-4 text-center">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No inventory items match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const stock = item.currentStock;
                  const assetVal = stock * item.purchasePrice;
                  const retailVal = stock * item.salesPrice;
                  const isOut = stock === 0;
                  const isLow = !isOut && stock <= item.reorderLevel;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="font-mono text-[11px] text-blue-700 font-semibold">{item.code}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.category}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {item.valuationMethod || 'FIFO'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">
                        {formatINR(item.purchasePrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatINR(item.salesPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="font-bold text-slate-900">
                          {stock.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{item.baseUnit}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Reorder at {item.reorderLevel}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0B5D2A]">
                        {formatINR(assetVal)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-blue-900">
                        {formatINR(retailVal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Stockout</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Healthy</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Inventory Valuation Document Modal */}
      <DocumentPrintPdfModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        documentData={activeDocData}
        category="inventory"
        initialFullScreen={isDocFullScreen}
      />
    </div>
  );
};
