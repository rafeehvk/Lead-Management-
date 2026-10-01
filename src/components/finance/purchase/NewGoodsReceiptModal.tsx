import React, { useState } from 'react';
import {
  X,
  Package,
  Truck,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { PurchaseOrder, GoodsReceiptPO } from '../../../types/finance';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface NewGoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder?: PurchaseOrder;
  onGRPOCreated?: () => void;
  onSuccess?: () => void;
}

export const NewGoodsReceiptModal: React.FC<NewGoodsReceiptModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onGRPOCreated,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <NewGoodsReceiptModalContent
      onClose={onClose}
      purchaseOrder={purchaseOrder}
      onGRPOCreated={onGRPOCreated || onSuccess || (() => {})}
    />
  );
};

const NewGoodsReceiptModalContent: React.FC<{
  onClose: () => void;
  purchaseOrder?: PurchaseOrder;
  onGRPOCreated: () => void;
}> = ({ onClose, purchaseOrder, onGRPOCreated }) => {
  const allOrders = erpFinanceStorage
    .getPurchaseOrders()
    .filter((o) => o.status !== 'Closed' && o.status !== 'Cancelled');

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    purchaseOrder?.id || (allOrders[0]?.id || '')
  );

  const activePO = purchaseOrder || allOrders.find((o) => o.id === selectedOrderId);

  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [warehouse, setWarehouse] = useState('Central Warehouse (Kochi)');
  const [vehicleNo, setVehicleNo] = useState('KL-07-CD-4192');
  const [trackingNumber, setTrackingNumber] = useState(`LR-${Date.now().toString().slice(-6)}`);
  const [receivedBy, setReceivedBy] = useState('Anand V. (Warehouse Inward Lead)');
  const [remarks, setRemarks] = useState(
    `Materials inspected and received against PO ${activePO?.poNumber || ''}`
  );

  // Quantities for items
  const [itemQuantities, setItemQuantities] = useState<
    Array<{
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
    }>
  >(() => {
    if (!activePO || !activePO.items) return [];
    return activePO.items.map((i) => ({
      receivedQty: i.quantity,
      acceptedQty: i.quantity,
      rejectedQty: 0,
    }));
  });

  // When selected PO changes, reset items
  React.useEffect(() => {
    if (activePO && activePO.items) {
      setItemQuantities(
        activePO.items.map((i) => ({
          receivedQty: i.quantity,
          acceptedQty: i.quantity,
          rejectedQty: 0,
        }))
      );
      setRemarks(`Materials inspected and received against PO ${activePO.poNumber || ''}`);
    }
  }, [selectedOrderId, activePO?.id]);

  const handleQtyChange = (index: number, field: 'receivedQty' | 'acceptedQty' | 'rejectedQty', val: number) => {
    setItemQuantities((prev) => {
      const next = [...prev];
      const current = { ...next[index], [field]: val };
      if (field === 'acceptedQty') {
        current.rejectedQty = Math.max(0, current.receivedQty - val);
      }
      next[index] = current;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePO) {
      alert('Please select an active Purchase Order.');
      return;
    }

    try {
      const grpoItems = activePO.items.map((i, idx) => {
        const q = itemQuantities[idx] || {
          receivedQty: i.quantity,
          acceptedQty: i.quantity,
          rejectedQty: 0,
        };
        return {
          ...i,
          orderedQty: i.quantity,
          receivedQty: q.receivedQty,
          acceptedQty: q.acceptedQty,
          rejectedQty: q.rejectedQty,
        };
      });

      erpFinanceStorage.saveGoodsReceiptPO({
        poId: activePO.id,
        poNumber: activePO.poNumber || activePO.orderNumber,
        vendorId: activePO.vendorId,
        vendorName: activePO.vendorName,
        date: receiptDate,
        warehouse,
        vendorChallanNo: `DC-VEND-${Date.now().toString().slice(-5)}`,
        vehicleNo,
        trackingNumber,
        receivedBy,
        remarks,
        items: grpoItems,
      });

      alert(`Warehouse Goods Receipt PO successfully created and stock added to inventory!`);
      onGRPOCreated();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to save Goods Receipt PO.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-800 border border-emerald-200/60">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Add Goods Receipt PO (Warehouse Delivery)</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  SAP B1 GRPO
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect inward shipment, accept physical inventory into warehouse, and log stock movement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Logistics and PO Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Purchase Order <span className="text-rose-500">*</span>
              </label>
              {purchaseOrder ? (
                <div className="p-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900">
                  {purchaseOrder.poNumber} ({purchaseOrder.vendorName})
                </div>
              ) : (
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  required
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                >
                  {allOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.poNumber} - {o.vendorName} ({formatINR(o.grandTotal)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Receipt Date</label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                required
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Warehouse</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Central Warehouse (Kochi)">Central Warehouse (Kochi)</option>
                <option value="Main Tech Storage - Bay A">Main Tech Storage - Bay A</option>
                <option value="Trivandrum Distribution Center">Trivandrum Distribution Center</option>
                <option value="Calicut Hub">Calicut Hub</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Vehicle / Docket #</label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="e.g. KL-07-CD-4192"
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Additional details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Received & Inspected By</label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">LR / Consignment Tracking #</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Items Receipt Verification Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Inward Physical Inspection & Accepted Quantities
              </h4>
              <span className="text-[11px] text-slate-500">
                Accepted quantities will be immediately added to inventory stock.
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-bold">
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 w-24 text-center">Ordered Qty</th>
                      <th className="p-2.5 w-28 text-center">Received Qty</th>
                      <th className="p-2.5 w-28 text-center text-emerald-700">Accepted Qty</th>
                      <th className="p-2.5 w-28 text-center text-rose-600">Rejected Qty</th>
                      <th className="p-2.5 w-28 text-right">PO Rate</th>
                      <th className="p-2.5 w-32 text-right">Accepted Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activePO?.items.map((item, idx) => {
                      const q = itemQuantities[idx] || {
                        receivedQty: item.quantity,
                        acceptedQty: item.quantity,
                        rejectedQty: 0,
                      };
                      const acceptedVal = q.acceptedQty * item.rate;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block">{item.itemName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {item.itemCode} ({item.unit})
                            </span>
                          </td>

                          <td className="p-2.5 text-center font-semibold text-slate-800">{item.quantity}</td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity * 2}
                              value={q.receivedQty}
                              onChange={(e) =>
                                handleQtyChange(idx, 'receivedQty', Number(e.target.value))
                              }
                              className="w-full text-center px-2 py-1 border border-slate-300 rounded text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              max={q.receivedQty}
                              value={q.acceptedQty}
                              onChange={(e) =>
                                handleQtyChange(idx, 'acceptedQty', Number(e.target.value))
                              }
                              className="w-full text-center px-2 py-1 border border-emerald-400 bg-emerald-50/50 rounded text-xs font-bold text-emerald-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              value={q.rejectedQty}
                              onChange={(e) =>
                                handleQtyChange(idx, 'rejectedQty', Number(e.target.value))
                              }
                              className="w-full text-center px-2 py-1 border border-rose-300 bg-rose-50/50 rounded text-xs font-medium text-rose-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                            />
                          </td>

                          <td className="p-2.5 text-right text-slate-600 font-medium">{formatINR(item.rate)}</td>

                          <td className="p-2.5 text-right font-bold text-emerald-800">{formatINR(acceptedVal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Warehouse Remarks */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Quality Inspection & Warehouse Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Record any package damage, seal verification, or batch numbers..."
              className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Confirm Goods Receipt & Update Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
