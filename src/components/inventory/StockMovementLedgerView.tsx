import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRightLeft,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  Filter,
  X,
  CheckCircle,
  Printer,
  FileText,
  Eye,
} from 'lucide-react';
import { StockMovement, ItemMaster } from '../../types/finance';
import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';
import { DocumentPrintPdfModal } from '../common/DocumentPrintPdfModal';
import { ThemedDocumentData } from '../finance/themes/ThemedDocumentRenderer';
import { convertStockMovementToDoc } from '../../utils/documentConversionHelpers';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const StockMovementLedgerView: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [itemFilter, setItemFilter] = useState('All');

  // Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [adjustmentDirection, setAdjustmentDirection] = useState<'IN' | 'OUT'>('IN');
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [reason, setReason] = useState<'Physical Stock Difference' | 'Damaged' | 'Lost' | 'Found'>(
    'Physical Stock Difference'
  );
  const [notes, setNotes] = useState('');

  // Document View State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [activeDocData, setActiveDocData] = useState<ThemedDocumentData | null>(null);
  const [isDocFullScreen, setIsDocFullScreen] = useState(false);

  const openMovementDocViewer = (m: StockMovement, fullScreen = false) => {
    setActiveDocData(convertStockMovementToDoc(m));
    setIsDocFullScreen(fullScreen);
    setIsDocModalOpen(true);
  };

  const loadData = () => {
    setMovements(erpFinanceStorage.getStockMovements());
    setItems(erpFinanceStorage.getItems().filter((i) => !i.isService));
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleDataChange);
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (typeFilter !== 'All' && m.type !== typeFilter) return false;
      if (itemFilter !== 'All' && m.itemId !== itemFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.movementNumber.toLowerCase().includes(q) ||
          m.itemCode.toLowerCase().includes(q) ||
          m.itemName.toLowerCase().includes(q) ||
          (m.referenceNumber && m.referenceNumber.toLowerCase().includes(q)) ||
          (m.notes && m.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [movements, typeFilter, itemFilter, searchQuery]);

  const movementStats = useMemo(() => {
    let inwardCount = 0;
    let outwardCount = 0;
    let adjustmentCount = 0;
    let totalMovedValue = 0;

    movements.forEach((m) => {
      totalMovedValue += m.totalValue || 0;
      if (m.type === 'Purchase In' || m.type === 'Sales Return' || m.type === 'Adjustment In' || m.type === 'Opening') {
        inwardCount++;
      } else if (m.type === 'Sales Out' || m.type === 'Purchase Return' || m.type === 'Adjustment Out') {
        outwardCount++;
      }
      if (m.type.startsWith('Adjustment')) {
        adjustmentCount++;
      }
    });

    return { inwardCount, outwardCount, adjustmentCount, totalMovedValue };
  }, [movements]);

  const activeSelectedItem = items.find((i) => i.id === selectedItemId);

  const handleRecordAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedItem) return;

    const qty = parseFloat(adjustmentQty) || 0;
    if (qty <= 0) return;

    const currentStock = activeSelectedItem.currentStock;
    const newQty = adjustmentDirection === 'IN' ? currentStock + qty : Math.max(0, currentStock - qty);

    erpFinanceStorage.recordStockAdjustment({
      date: new Date().toISOString().split('T')[0],
      itemId: activeSelectedItem.id,
      itemName: activeSelectedItem.name,
      location: 'Central Inventory Bay',
      currentQty: currentStock,
      adjustmentQty: adjustmentDirection === 'IN' ? qty : -qty,
      direction: adjustmentDirection,
      newQty,
      reason,
      remarks: notes,
    });

    setIsAdjustmentModalOpen(false);
    setSelectedItemId('');
    setAdjustmentQty('');
    setNotes('');
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Quick Stats */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-blue-50 rounded-xl text-blue-700 border border-blue-200/80">
                <ArrowRightLeft className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Stock Movements & Inventory Ledger
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Audit Trail
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Complete chronological audit trail of all receipts (PO Inward), dispatches (Sales Invoices), returns, and
              physical reconciliation adjustments.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {filteredMovements.length > 0 && (
              <button
                type="button"
                onClick={() => openMovementDocViewer(filteredMovements[0], false)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer border border-slate-700"
                title="Open Document View with persistent Print/PDF and full-screen layout optimization"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print/PDF Voucher</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (items.length > 0) setSelectedItemId(items[0].id);
                setIsAdjustmentModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Stock Adjustment</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Total Movements Logged
              </span>
              <ArrowRightLeft className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900 mt-1.5">{movements.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Lifetime transaction entries</p>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Inward Transactions
              </span>
              <ArrowDownLeft className="w-4 h-4 text-[#168A45]" />
            </div>
            <div className="text-xl font-extrabold font-mono text-[#0B5D2A] mt-1.5">
              {movementStats.inwardCount}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">Procurements & Returns</p>
          </div>

          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                Outward Dispatches
              </span>
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-extrabold font-mono text-blue-900 mt-1.5">
              {movementStats.outwardCount}
            </div>
            <p className="text-[11px] text-blue-700/80 mt-1">Customer Delivery & Issues</p>
          </div>

          <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                Reconciliation Adjustments
              </span>
              <Sliders className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-extrabold font-mono text-purple-900 mt-1.5">
              {movementStats.adjustmentCount}
            </div>
            <p className="text-[11px] text-purple-700/80 mt-1">Physical count variances</p>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search movement #, SKU, doc #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="All">All Movement Types</option>
              <option value="Purchase In">Purchase In (PO)</option>
              <option value="Sales Out">Sales Out (Invoice)</option>
              <option value="Adjustment In">Adjustment In (+)</option>
              <option value="Adjustment Out">Adjustment Out (-)</option>
              <option value="Opening">Opening Balance</option>
            </select>

            <select
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer max-w-[200px] truncate"
            >
              <option value="All">All Items / SKUs</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.code} - {i.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800">{filteredMovements.length}</span> movements
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Date & Movement #</th>
                <th className="py-3 px-4">Item Code & Name</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-right">Quantity Change</th>
                <th className="py-3 px-4 text-right">Unit Rate</th>
                <th className="py-3 px-4 text-right">Total Trans. Value</th>
                <th className="py-3 px-4">Reference Document</th>
                <th className="py-3 px-4">Notes / Warehouse</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No stock movements found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isInward =
                    m.type === 'Purchase In' ||
                    m.type === 'Sales Return' ||
                    m.type === 'Adjustment In' ||
                    m.type === 'Opening';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{m.date}</div>
                        <div className="font-mono text-[11px] text-slate-500">{m.movementNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.itemName}</div>
                        <div className="font-mono text-[11px] text-blue-700 font-semibold">{m.itemCode}</div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isInward
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isInward ? (
                            <ArrowDownLeft className="w-3 h-3 text-[#168A45]" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-blue-600" />
                          )}
                          <span>{m.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isInward ? 'text-[#0B5D2A]' : 'text-slate-800'
                          }`}
                        >
                          {isInward ? '+' : '-'}
                          {Math.abs(m.quantity)} {m.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">
                        {formatINR(m.unitCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(m.totalValue)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {m.referenceNumber || m.referenceType || 'Direct'}
                        </div>
                        <div className="text-[10px] text-slate-400">{m.referenceType}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                        {m.notes || m.warehouse || 'Central Inventory Bay'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => openMovementDocViewer(m, false)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            title="Open Document View with Print/PDF dialogue and full-screen layout optimization"
                          >
                            <Printer className="w-3 h-3 text-emerald-700" />
                            <span>Print/PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUSTMENT MODAL */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-purple-50 rounded-lg text-purple-700">
                  <Sliders className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900">Record Stock Adjustment</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordAdjustment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Item SKU</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-800"
                  required
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.code} - {i.name} (Current: {i.currentStock} {i.baseUnit})
                    </option>
                  ))}
                </select>
              </div>

              {activeSelectedItem && (
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Current On-Hand:</span>{' '}
                    <span className="font-bold text-slate-900">
                      {activeSelectedItem.currentStock} {activeSelectedItem.baseUnit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Unit Cost:</span>{' '}
                    <span className="font-bold text-[#0B5D2A]">{formatINR(activeSelectedItem.purchasePrice)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type</label>
                  <select
                    value={adjustmentDirection}
                    onChange={(e) => setAdjustmentDirection(e.target.value as 'IN' | 'OUT')}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="IN">Increase Stock (+ IN)</option>
                    <option value="OUT">Decrease Stock (- OUT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Qty to adjust"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                >
                  <option value="Physical Stock Difference">Physical Stock Difference / Reconciliation</option>
                  <option value="Damaged">Damaged Goods Write-off</option>
                  <option value="Lost">Lost or Misplaced Stock</option>
                  <option value="Found">Found Unrecorded Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Audit Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Annual physical count conducted on 22-Sep-2026..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Document View Print/PDF Modal */}
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
