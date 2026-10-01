import React, { useState } from 'react';
import {
  X,
  Truck,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { SalesOrder, SalesDelivery } from '../../../types/finance';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface NewSalesDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrder?: SalesOrder;
  onDeliveryCreated?: () => void;
  onSuccess?: () => void;
}

export const NewSalesDeliveryModal: React.FC<NewSalesDeliveryModalProps> = ({
  isOpen,
  onClose,
  salesOrder,
  onDeliveryCreated,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <NewSalesDeliveryModalContent
      onClose={onClose}
      salesOrder={salesOrder}
      onDeliveryCreated={onDeliveryCreated || onSuccess || (() => {})}
    />
  );
};

const NewSalesDeliveryModalContent: React.FC<{
  onClose: () => void;
  salesOrder?: SalesOrder;
  onDeliveryCreated: () => void;
}> = ({ onClose, salesOrder, onDeliveryCreated }) => {
  const allOrders = erpFinanceStorage
    .getSalesOrders()
    .filter((o) => o.status !== 'Closed' && o.status !== 'Cancelled');

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    salesOrder?.id || (allOrders[0]?.id || '')
  );

  const activeSO = salesOrder || allOrders.find((o) => o.id === selectedOrderId);

  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [shippingAddress, setShippingAddress] = useState(
    activeSO?.deliveryAddress || 'Client Delivery Address, Kochi, Kerala'
  );
  const [warehouse, setWarehouse] = useState('Central Finished Goods Warehouse');
  const [dispatchVehicleNo, setDispatchVehicleNo] = useState('KL-07-CD-4192');
  const [trackingNumber, setTrackingNumber] = useState(`TRACK-${Date.now().toString().slice(-6)}`);
  const [dispatchedBy, setDispatchedBy] = useState('Suresh Menon (Dispatch Supervisor)');
  const [remarks, setRemarks] = useState(
    `Dispatched goods against Sales Order ${activeSO?.orderNumber || ''}`
  );

  // Delivered quantities
  const [deliveredQuantities, setDeliveredQuantities] = useState<number[]>(() => {
    if (!activeSO || !activeSO.items) return [];
    return activeSO.items.map((i) => i.quantity);
  });

  React.useEffect(() => {
    if (activeSO && activeSO.items) {
      setDeliveredQuantities(activeSO.items.map((i) => i.quantity));
      setShippingAddress(activeSO.deliveryAddress || 'Client Delivery Address, Kochi, Kerala');
      setRemarks(`Dispatched goods against Sales Order ${activeSO.orderNumber || ''}`);
    }
  }, [selectedOrderId, activeSO?.id]);

  const handleQtyChange = (index: number, val: number) => {
    setDeliveredQuantities((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSO) {
      alert('Please select an active Sales Order.');
      return;
    }

    try {
      const deliveryItems = activeSO.items.map((i, idx) => ({
        ...i,
        orderedQty: i.quantity,
        deliveredQty: deliveredQuantities[idx] !== undefined ? deliveredQuantities[idx] : i.quantity,
      }));

      erpFinanceStorage.saveSalesDelivery({
        salesOrderId: activeSO.id,
        salesOrderNumber: activeSO.orderNumber,
        customerId: activeSO.customerId,
        customerName: activeSO.customerName,
        date: deliveryDate,
        shippingAddress,
        warehouse,
        dispatchVehicleNo,
        trackingNumber,
        dispatchedBy,
        remarks,
        items: deliveryItems,
      });

      alert(`Delivery Note successfully issued! Stock deducted from inventory.`);
      onDeliveryCreated();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to record Delivery Note.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-800 border border-emerald-200/60">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Add Sales Delivery Note (Warehouse Dispatch)</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  SAP B1 Delivery
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate delivery challan, dispatch goods to client, and decrement warehouse inventory stock
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
          {/* Order selection & Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Sales Order <span className="text-rose-500">*</span>
              </label>
              {salesOrder ? (
                <div className="p-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900">
                  {salesOrder.orderNumber} ({salesOrder.customerName})
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
                      {o.orderNumber} - {o.customerName} ({formatINR(o.grandTotal)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Dispatch Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Dispatch Warehouse</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Central Finished Goods Warehouse">Central Finished Goods Warehouse</option>
                <option value="Main Tech Storage - Bay A">Main Tech Storage - Bay A</option>
                <option value="Kochi Campus Logistics Depot">Kochi Campus Logistics Depot</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Dispatch Vehicle No</label>
              <input
                type="text"
                value={dispatchVehicleNo}
                onChange={(e) => setDispatchVehicleNo(e.target.value)}
                placeholder="e.g. KL-07-CD-4192"
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Shipping Address & Dispatch Supervisor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Shipping / Delivery Address</label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tracking Number / AWB</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Dispatch Quantity Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Dispatched Quantity Verification
              </h4>
              <span className="text-[11px] text-slate-500">
                Dispatched items will be deducted from active physical inventory stock.
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-bold">
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 w-24 text-center">Ordered Qty</th>
                      <th className="p-2.5 w-32 text-center text-emerald-700">Dispatched Qty</th>
                      <th className="p-2.5 w-28 text-right">Unit Rate</th>
                      <th className="p-2.5 w-32 text-right">Delivered Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSO?.items.map((item, idx) => {
                      const dQty =
                        deliveredQuantities[idx] !== undefined ? deliveredQuantities[idx] : item.quantity;
                      const lineTotal = dQty * item.rate;

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
                              max={item.quantity}
                              value={dQty}
                              onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                              className="w-full text-center px-2 py-1 border border-emerald-400 bg-emerald-50/40 rounded text-xs font-bold text-emerald-950 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          <td className="p-2.5 text-right text-slate-600 font-medium">{formatINR(item.rate)}</td>

                          <td className="p-2.5 text-right font-bold text-emerald-800">{formatINR(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Dispatch Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Record driver name, seal number, or gate pass reference..."
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
              <PackageCheck className="w-4 h-4" />
              <span>Confirm Delivery & Dispatch Goods</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
