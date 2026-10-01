import React, { useState } from 'react';
import {
  FileText,
  ShoppingBag,
  PackageCheck,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Calendar,
  DollarSign,
  User,
  Building,
  Check,
  Download,
  AlertCircle,
} from 'lucide-react';
import {
  AssetRequest,
  PurchaseOrder,
  AssetPurchase,
  AssetCategory,
} from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';
import { hrStorage } from '../../services/hrStorageService';
import { DocumentPrintPdfModal } from '../common/DocumentPrintPdfModal';
import { convertAssetPoToDoc } from '../../utils/documentConversionHelpers';
import { ThemedDocumentData } from '../finance/themes/ThemedDocumentRenderer';

// ==========================================
// 1. ASSET REQUESTS VIEW (Section 4)
// ==========================================
export const AssetRequestsView: React.FC<{
  onAllocateRequestedAsset?: (category: string, empName: string) => void;
  actorName?: string;
}> = ({ onAllocateRequestedAsset, actorName = 'Admin' }) => {
  const [requests, setRequests] = useState<AssetRequest[]>(() =>
    assetStorage.getRequests()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const staff = hrStorage.getStaff();
  const categories = assetStorage.getCategories();

  // Form
  const [employeeId, setEmployeeId] = useState(staff[0]?.id || '');
  const [category, setCategory] = useState(categories[0]?.name || 'IT Equipment');
  const [itemDescription, setItemDescription] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');

  const selectedStaff = staff.find((s) => s.id === employeeId) || staff[0];

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDescription.trim()) return;

    assetStorage.saveRequest(
      {
        employeeId: selectedStaff?.id || 'EMP-001',
        employeeName: selectedStaff?.fullName || 'Staff',
        department: selectedStaff?.department || 'Operations',
        category,
        assetTypeRequested: itemDescription,
        reason,
        priority,
        status: 'Pending Approval',
        requestedDate: new Date().toISOString().split('T')[0],
      },
      actorName
    );

    setRequests(assetStorage.getRequests());
    setIsModalOpen(false);
    setItemDescription('');
    setSpecifications('');
    setReason('');
  };

  const handleUpdateStatus = (id: string, status: 'Approved' | 'Rejected') => {
    assetStorage.updateRequestStatus(id, status, actorName);
    setRequests(assetStorage.getRequests());
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Staff Asset Requisitions</h2>
          <p className="text-xs text-slate-500">
            Internal procurement and allocation requests submitted by team members
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#168A45] hover:bg-[#0B5D2A] rounded-lg shadow-2xs flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Req ID</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Item & Specs</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-[#F7FAF8]">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{req.id}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 block">{req.employeeName}</span>
                    <span className="text-[10px] text-slate-400">{req.department}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{req.category}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 block">{req.itemDescription}</span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                      {req.specifications || req.reason}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{req.requestDate}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.priority === 'Urgent'
                          ? 'bg-red-100 text-red-800'
                          : req.priority === 'High'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {req.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {req.status === 'Pending' ? (
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'Approved')}
                          className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded text-[11px] shadow-2xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-[11px]"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        Reviewed by {req.approvedBy || 'Admin'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Submit Asset Requisition</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Requesting Staff Member *</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Title / Requirement *</label>
                <input
                  type="text"
                  placeholder="e.g. Ergonomic Office Chair or 4K Monitor"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specifications & Justification</label>
                <textarea
                  rows={2}
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  placeholder="Technical requirements and business need..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. PURCHASE ORDERS VIEW (Section 5)
// ==========================================
export const PurchaseOrdersView: React.FC<{
  onReceivePO?: (po: PurchaseOrder) => void;
  actorName?: string;
}> = ({ onReceivePO, actorName = 'Admin' }) => {
  const [pos, setPos] = useState<PurchaseOrder[]>(() => assetStorage.getPurchaseOrders());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [activeDocData, setActiveDocData] = useState<ThemedDocumentData | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const vendors = assetStorage.getVendors();
  const categories = assetStorage.getCategories();

  const openPoDocViewer = (po: PurchaseOrder, fullScreen = false) => {
    setActiveDocData(convertAssetPoToDoc(po));
    setIsFullScreen(fullScreen);
    setIsDocModalOpen(true);
  };

  // PO Form
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [itemDesc, setItemDesc] = useState('');
  const [itemCategory, setItemCategory] = useState(categories[0]?.name || 'IT Equipment');
  const [qty, setQty] = useState(5);
  const [unitPrice, setUnitPrice] = useState(62000);

  const selectedVendor = vendors.find((v) => v.id === vendorId) || vendors[0];

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDesc.trim()) return;

    const subTotal = qty * unitPrice;
    const tax = Math.round(subTotal * 0.18);
    const totalAmount = subTotal + tax;

    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    assetStorage.savePurchaseOrder(
      {
        poNumber,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.vendorName || selectedVendor.name || 'Vendor',
        expectedDeliveryDate,
        items: [
          {
            id: `item-${Date.now()}`,
            name: itemDesc,
            description: itemDesc,
            category: itemCategory,
            quantity: qty,
            receivedQuantity: 0,
            unitPrice,
            discount: 0,
            tax,
            total: totalAmount,
            lineTotal: totalAmount,
          },
        ],
        totalAmount,
        status: 'Approved',
        paymentTerms: 'Net 30 Days',
        approvedBy: actorName,
      },
      actorName
    );

    setPos(assetStorage.getPurchaseOrders());
    setIsModalOpen(false);
    setItemDesc('');
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Purchase Orders (CapEx Procurement)</h2>
          <p className="text-xs text-slate-500">
            Track authorized vendor purchase orders, delivery statuses, and contract fulfillment
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#168A45] hover:bg-[#0B5D2A] rounded-lg shadow-2xs flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate PO</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4">Line Items</th>
                <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pos.map((po) => (
                <tr key={po.id} className="hover:bg-[#F7FAF8]">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-800">{po.poNumber}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{po.vendorName}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{po.orderDate}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{po.expectedDeliveryDate}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700 block">
                      {po.items.map((it) => `${it.quantity}x ${it.description}`).join(', ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{po.totalAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        po.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : po.status === 'Issued'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => openPoDocViewer(po, false)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        title="Open Document View with Print/PDF dialogue and full-screen layout optimization"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Print/PDF</span>
                      </button>
                      {po.status !== 'Completed' && onReceivePO && (
                        <button
                          onClick={() => onReceivePO(po)}
                          className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded text-[10px]"
                        >
                          Receive Goods
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate PO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Create New Purchase Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Authorized Vendor *</label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName || v.name} ({v.gstNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expected Delivery Date *</label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Line Item Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Dell Latitude 5530 i7 16GB RAM"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Price Excl. Tax (₹) *</label>
                <input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between font-mono font-bold text-slate-800">
                <span>Total Estimated (incl. 18% GST):</span>
                <span>₹{Math.round(qty * unitPrice * 1.18).toLocaleString()}</span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Document Print/PDF Modal */}
      <DocumentPrintPdfModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        documentData={activeDocData}
        category="asset"
        initialFullScreen={isFullScreen}
      />
    </div>
  );
};

// ===============================================================
// 3. ASSET RECEIVING / GOODS RECEIVED NOTE (GRN) (Section 7)
// Automatically generates individual serialized asset records!
// ===============================================================
export const AssetReceivingView: React.FC<{
  initialPO?: PurchaseOrder | null;
  onSuccessReceived?: () => void;
  actorName?: string;
}> = ({ initialPO, onSuccessReceived, actorName = 'Admin' }) => {
  const purchaseOrders = assetStorage.getPurchaseOrders().filter((po) => po.status !== 'Fully Received' && po.status !== 'Closed');
  const [selectedPoId, setSelectedPoId] = useState<string>(
    initialPO?.id || purchaseOrders[0]?.id || ''
  );
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantityToReceive, setQuantityToReceive] = useState(2);
  const [brand, setBrand] = useState('Dell');
  const [model, setModel] = useState('Latitude 5530');
  const [serialPrefix, setSerialPrefix] = useState('DL-2026-');
  const [successGenerated, setSuccessGenerated] = useState<string[]>([]);

  const selectedPO = purchaseOrders.find((p) => p.id === selectedPoId) || purchaseOrders[0];

  const handleReceiveGoods = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    const generatedAssetIds: string[] = [];
    const item = selectedPO.items[0];

    for (let i = 1; i <= quantityToReceive; i++) {
      const serial = `${serialPrefix}${Math.floor(1000 + Math.random() * 9000)}`;
      const newAsset = assetStorage.saveAsset(
        {
          name: `${item?.description || 'Asset'} - Unit #${i}`,
          category: item?.category || 'IT Equipment',
          brand,
          model,
          serialNumber: serial,
          status: 'Available',
          condition: 'New',
          location: {
            branch: 'Headquarters',
            building: 'Main Tower',
            floor: '3rd Floor',
            department: 'Store',
            room: 'Central Inventory Bay',
            storageLocation: 'Shelf A1',
          },
          purchaseInfo: {
            vendorName: selectedPO.vendorName,
            poNumber: selectedPO.poNumber,
            invoiceNumber,
            purchaseDate: receivedDate,
            purchaseCost: item?.unitPrice || 60000,
            totalCost: item?.unitPrice || 60000,
            currentBookValue: item?.unitPrice || 60000,
            depreciationRate: 20,
          },
          warranty: {
            provider: selectedPO.vendorName,
            warrantyNumber: `WAR-${serial.slice(-6)}`,
            startDate: receivedDate,
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Active',
          },
          accessories: ['Power Cable / Charger', 'Laptop Bag', 'Documentation Manual'],
        },
        actorName
      );

      // Record Intake Movement
      assetStorage.recordMovement({
        assetId: newAsset.id,
        assetName: newAsset.name,
        movementType: 'Purchase Received',
        direction: 'IN',
        toLocation: 'Central Inventory Bay',
        condition: 'New',
        date: receivedDate,
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        referenceNumber: `GRN-${selectedPO.poNumber}`,
        reason: `Goods Received against PO #${selectedPO.poNumber} and Invoice #${invoiceNumber}`,
        status: 'Completed',
        createdBy: actorName,
      });

      generatedAssetIds.push(newAsset.id);
    }

    // Mark PO completed if all received
    assetStorage.savePurchaseOrder(
      {
        ...selectedPO,
        status: 'Fully Received',
      },
      actorName
    );

    setSuccessGenerated(generatedAssetIds);
    if (onSuccessReceived) onSuccessReceived();
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in max-w-3xl">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900">Goods Receiving / GRN (Intake Verification)</h2>
        <p className="text-xs text-slate-500">
          Verify physical delivery against purchase order and auto-generate serialized asset records
        </p>
      </div>

      {successGenerated.length > 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>Success: Generated {successGenerated.length} New Inventory Assets!</span>
          </div>
          <p className="text-xs text-emerald-700">
            Serialized records created: {successGenerated.join(', ')}. All assets are marked as Available in store.
          </p>
        </div>
      )}

      <form onSubmit={handleReceiveGoods} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Select Purchase Order *</label>
          <select
            value={selectedPoId}
            onChange={(e) => setSelectedPoId(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            required
          >
            {purchaseOrders.map((po) => (
              <option key={po.id} value={po.id}>
                {po.poNumber} — {po.vendorName} (₹{po.totalAmount.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Vendor Invoice / Challan No *</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Goods Receiving Date *</label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Qty Received *</label>
            <input
              type="number"
              value={quantityToReceive}
              onChange={(e) => setQuantityToReceive(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
              min={1}
              max={20}
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Brand *</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Model *</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Serial Number Prefix</label>
          <input
            type="text"
            value={serialPrefix}
            onChange={(e) => setSerialPrefix(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
            placeholder="e.g. DL-2026-"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            The system will append a unique numerical suffix for each serialized item.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm flex items-center space-x-2"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Generate GRN & Register {quantityToReceive} Assets</span>
          </button>
        </div>
      </form>
    </div>
  );
};
