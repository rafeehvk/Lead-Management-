import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  X,
} from 'lucide-react';

import { ItemMaster } from '../../types/finance';
import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface FinanceItemMasterViewProps {
  currentUserName?: string;
  userRole?: string;
}

export const FinanceItemMasterView: React.FC<FinanceItemMasterViewProps> = ({
  currentUserName = 'Inventory & Cost Controller',
  userRole = 'Admin',
}) => {
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // New Item Modal
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    code: '',
    name: '',
    isService: false,
    category: 'Hardware & IT Goods',
    hsnCode: '84713010',
    baseUnit: 'NOS',
    purchasePrice: '',
    salesPrice: '',
    taxRatePercent: '18',
    openingStock: '0',
    reorderLevel: '5',
    valuationMethod: 'FIFO' as 'FIFO' | 'Weighted Average' | 'Standard Cost',
  });

  const loadData = () => {
    setItems(erpFinanceStorage.getItems());
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleDataChange);
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter === 'Product' && item.isService) return false;
      if (typeFilter === 'Service' && !item.isService) return false;
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
  }, [items, typeFilter, searchQuery]);

  // Inventory Metrics
  const inventoryMetrics = useMemo(() => {
    const totalInventoryValue = items.reduce((sum, item) => sum + item.currentStock * item.purchasePrice, 0);
    const lowStockCount = items.filter(
      (item) => !item.isService && item.currentStock <= item.reorderLevel
    ).length;
    const totalSKUs = items.length;

    return { totalInventoryValue, lowStockCount, totalSKUs };
  }, [items]);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const pRate = parseFloat(newItemForm.purchasePrice) || 0;
    const sRate = parseFloat(newItemForm.salesPrice) || 0;
    const stock = parseFloat(newItemForm.openingStock) || 0;
    const reorder = parseFloat(newItemForm.reorderLevel) || 0;
    const gst = parseFloat(newItemForm.taxRatePercent) || 18;

    erpFinanceStorage.saveItem({
      code: newItemForm.code || `ITM-${items.length + 101}`,
      name: newItemForm.name,
      isService: newItemForm.isService,
      category: newItemForm.category,
      hsnCode: newItemForm.hsnCode,
      baseUnit: newItemForm.baseUnit,
      purchaseUnit: newItemForm.baseUnit,
      salesUnit: newItemForm.baseUnit,
      purchasePrice: pRate,
      salesPrice: sRate,
      taxRatePercent: gst,
      openingStock: stock,
      currentStock: stock,
      reorderLevel: reorder,
      valuationMethod: newItemForm.valuationMethod,
    });

    setIsNewItemOpen(false);
    setNewItemForm({
      code: '',
      name: '',
      isService: false,
      category: 'Hardware & IT Goods',
      hsnCode: '84713010',
      baseUnit: 'NOS',
      purchasePrice: '',
      salesPrice: '',
      taxRatePercent: '18',
      openingStock: '0',
      reorderLevel: '5',
      valuationMethod: 'FIFO',
    });
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-amber-50 rounded-xl text-amber-800 border border-amber-200/80">
                <Boxes className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Item Master & Inventory Valuation
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                Live Stock Reconciled
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-2xl">
              Catalog of all procured materials, service offerings, and capital assets. Enforces HSN/SAC codes, UOM
              quantities, and FIFO stock valuation synced to GL inventory accounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewItemOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Master Item</span>
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active SKUs</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{inventoryMetrics.totalSKUs}</div>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Total Stock Asset Valuation (GL 1300)
            </div>
            <div className="text-base font-bold font-mono text-[#0B5D2A] mt-0.5">
              {formatINR(inventoryMetrics.totalInventoryValue)}
            </div>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Reorder Level Alerts</div>
            <div className="text-base font-bold font-mono text-rose-700 mt-0.5">
              {inventoryMetrics.lowStockCount} Items Low
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="All">All Item Types</option>
              <option value="Product">Physical Goods / Inventory</option>
              <option value="Service">Services</option>
            </select>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU code, name, HSN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800">{filteredItems.length}</span> items
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Item Code & Name</th>
                <th className="py-3 px-4">Type & Category</th>
                <th className="py-3 px-4">HSN / SAC</th>
                <th className="py-3 px-4">Base UOM</th>
                <th className="py-3 px-4 text-right">Purchase Cost</th>
                <th className="py-3 px-4 text-right">Selling Rate</th>
                <th className="py-3 px-4 text-right">On Hand Stock</th>
                <th className="py-3 px-4 text-right">Total Stock Value</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const isLow = !item.isService && item.currentStock <= item.reorderLevel;
                const stockVal = item.currentStock * item.purchasePrice;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="font-mono text-[11px] text-blue-700 font-semibold">{item.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          !item.isService
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-purple-50 text-purple-800'
                        }`}
                      >
                        {item.isService ? 'Service' : 'Product / Goods'}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.category}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{item.hsnCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600">{item.baseUnit}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800">{formatINR(item.purchasePrice)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.salesPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {!item.isService ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <span className={`font-bold ${isLow ? 'text-rose-700' : 'text-slate-900'}`}>
                            {item.currentStock}
                          </span>
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" title="Low stock" />}
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0B5D2A]">
                      {!item.isService ? formatINR(stockVal) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ITEM MODAL */}
      {isNewItemOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-amber-50 rounded-lg text-amber-800">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Onboard New Item Master</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewItemOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Item Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ITM-201 (auto if empty)"
                    value={newItemForm.code}
                    onChange={(e) => setNewItemForm({ ...newItemForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Classification *</label>
                  <select
                    value={newItemForm.isService ? 'Service' : 'Product'}
                    onChange={(e) => setNewItemForm({ ...newItemForm, isService: e.target.value === 'Service' })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="Product">Physical Good / Inventory</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Item / SKU Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell PowerEdge R750 Rack Server"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">HSN / SAC Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="8471"
                    value={newItemForm.hsnCode}
                    onChange={(e) => setNewItemForm({ ...newItemForm, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={newItemForm.baseUnit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, baseUnit: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="NOS">NOS (Numbers / Units)</option>
                    <option value="KG">KG (Kilograms)</option>
                    <option value="BOX">BOX (Packaging boxes)</option>
                    <option value="LITRE">LITRE (Liquid volume)</option>
                    <option value="HOUR">HOUR (Consulting)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Default Purchase Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 120000"
                    value={newItemForm.purchasePrice}
                    onChange={(e) => setNewItemForm({ ...newItemForm, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Default Selling Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 150000"
                    value={newItemForm.salesPrice}
                    onChange={(e) => setNewItemForm({ ...newItemForm, salesPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {!newItemForm.isService && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Opening Physical Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={newItemForm.openingStock}
                      onChange={(e) => setNewItemForm({ ...newItemForm, openingStock: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Reorder Safety Level</label>
                    <input
                      type="number"
                      min="0"
                      value={newItemForm.reorderLevel}
                      onChange={(e) => setNewItemForm({ ...newItemForm, reorderLevel: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewItemOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs"
                >
                  Register Master Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
