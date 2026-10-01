// ============================================================================
// Document Conversion Helpers for MYSAR Sales & Purchase ERP Documents
// Converts raw ERP document records into ThemedDocumentData for Print, PDF,
// and Full-Screen Viewers with GST breakup, party information & company branding
// ============================================================================

import { erpFinanceStorage } from '../services/finance/erpFinanceStorage';
import {
  SalesRequest,
  SalesQuotation,
  SalesOrder,
  SalesDelivery,
  SalesInvoiceRecord,
  SalesReturnRequest,
  SalesReturnRecord,
  CreditNoteRecord,
  PurchaseRequest,
  PurchaseQuotation,
  PurchaseOrder,
  GoodsReceiptPO,
  PurchaseInvoiceRecord,
  PurchaseReturnRequest,
  PurchaseReturnRecord,
  DebitNoteRecord,
  PartyMaster,
  StockMovement,
  ItemMaster,
} from '../types/finance';
import { Asset, PurchaseOrder as AssetPO, AssetMovement } from '../types/asset';
import { ThemedDocumentData } from '../components/finance/themes/ThemedDocumentRenderer';

function findParty(nameOrId?: string): PartyMaster | undefined {
  if (!nameOrId) return undefined;
  const parties = erpFinanceStorage.getParties();
  return parties.find(
    (p) =>
      p.id === nameOrId ||
      p.name.toLowerCase() === nameOrId.toLowerCase() ||
      (p.legalName && p.legalName.toLowerCase() === nameOrId.toLowerCase())
  );
}

function getPartyAddress(party?: PartyMaster, fallback?: string): string {
  return party?.billingAddress || party?.shippingAddress || fallback || 'Commercial Address';
}

export function convertSalesRequestToDoc(sr: SalesRequest): ThemedDocumentData {
  const party = findParty(sr.customerId || sr.customerName);
  const estTotal = sr.estimatedTotal || (sr as any).estimatedValue || 0;
  return {
    documentNumber: sr.requestNumber,
    documentType: 'Sales Inquiry / Order Requisition',
    date: sr.date,
    referenceNumber: sr.id,
    paymentMethod: 'Standard Sales Terms',
    partyName: sr.customerName || party?.name || 'Valued Customer',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Customer Commercial Location'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (sr.items || []).map((it, idx) => {
      const itemRate = (it as any).rate || (it as any).estimatedPrice || 0;
      return {
        id: it.itemId || `sr-it-${idx}`,
        name: it.itemName,
        description: `Requirement Priority: ${sr.priority} | Est Price: ₹${itemRate}`,
        hsn: it.hsnCode || '998313',
        quantity: it.quantity || 1,
        unit: it.unit || 'NOS',
        rate: itemRate,
        taxable: (it.quantity || 1) * itemRate,
        taxPercent: 18,
        taxTotal: Math.round((it.quantity || 1) * itemRate * 0.18),
        total: Math.round((it.quantity || 1) * itemRate * 1.18),
      };
    }),
    subtotal: estTotal ? Math.round(estTotal / 1.18) : 0,
    cgst: estTotal ? Math.round((estTotal / 1.18) * 0.09) : 0,
    sgst: estTotal ? Math.round((estTotal / 1.18) * 0.09) : 0,
    igst: 0,
    grandTotal: estTotal,
  };
}

export function convertSalesQuotationToDoc(sq: SalesQuotation): ThemedDocumentData {
  const party = findParty(sq.customerId || sq.customerName);
  const isInterState = party?.state && !party.state.toLowerCase().includes('kerala');
  const taxTotal = sq.taxTotal || 0;

  return {
    documentNumber: sq.quotationNumber,
    documentType: 'Sales Quotation (Commercial Proposal)',
    date: sq.date,
    dueDate: sq.validUntil,
    referenceNumber: sq.requestNumber || sq.requestRefId,
    paymentMethod: 'Bank Transfer / Cheque / Online',
    partyName: sq.customerName || party?.name || 'Client Representative',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Registered Office Address'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (sq.items || []).map((it, idx) => {
      const rate = it.rate || (it as any).unitPrice || 0;
      const qty = it.quantity || 1;
      const taxable = qty * rate;
      const taxPercent = it.taxPercent || (it as any).taxRate || 18;
      const taxAmount = (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0) || Math.round(taxable * (taxPercent / 100));
      return {
        id: it.itemId || `sq-it-${idx}`,
        name: it.itemName,
        description: it.itemCode ? `SKU: ${it.itemCode}` : undefined,
        hsn: it.hsnCode || '998313',
        quantity: qty,
        unit: it.unit || 'NOS',
        rate,
        taxable,
        taxPercent,
        taxTotal: taxAmount,
        total: it.total || taxable + taxAmount,
      };
    }),
    subtotal: sq.subtotal,
    cgst: isInterState ? 0 : Math.round(taxTotal / 2),
    sgst: isInterState ? 0 : Math.round(taxTotal / 2),
    igst: isInterState ? taxTotal : 0,
    grandTotal: sq.grandTotal,
  };
}

export function convertSalesOrderToDoc(so: SalesOrder): ThemedDocumentData {
  const party = findParty(so.customerId || so.customerName);
  const isInterState = party?.state && !party.state.toLowerCase().includes('kerala');
  const taxTotal = so.taxTotal || 0;

  return {
    documentNumber: so.orderNumber,
    documentType: 'Sales Order Confirmation (SO)',
    date: so.date,
    dueDate: so.deliveryDate,
    referenceNumber: so.quotationNumber || so.quotationRefId,
    paymentMethod: 'Confirmed Customer Terms',
    partyName: so.customerName || party?.name || 'Customer Organization',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Site Delivery Location'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (so.items || []).map((it, idx) => {
      const rate = it.rate || (it as any).unitPrice || 0;
      const qty = it.quantity || 1;
      const taxable = qty * rate;
      const taxPercent = it.taxPercent || (it as any).taxRate || 18;
      const taxAmount = (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0) || Math.round(taxable * (taxPercent / 100));
      return {
        id: it.itemId || `so-it-${idx}`,
        name: it.itemName,
        description: it.itemCode ? `SKU: ${it.itemCode}` : undefined,
        hsn: it.hsnCode || '998313',
        quantity: qty,
        unit: it.unit || 'NOS',
        rate,
        taxable,
        taxPercent,
        taxTotal: taxAmount,
        total: it.total || taxable + taxAmount,
      };
    }),
    subtotal: so.subtotal,
    cgst: isInterState ? 0 : Math.round(taxTotal / 2),
    sgst: isInterState ? 0 : Math.round(taxTotal / 2),
    igst: isInterState ? taxTotal : 0,
    grandTotal: so.grandTotal,
  };
}

export function convertSalesDeliveryToDoc(sd: SalesDelivery): ThemedDocumentData {
  const party = findParty(sd.customerId || sd.customerName);

  return {
    documentNumber: sd.deliveryNumber,
    documentType: 'Delivery Challan / Goods Issue Note',
    date: sd.date,
    referenceNumber: sd.salesOrderNumber || sd.salesOrderId,
    paymentMethod: 'Delivery Against Order',
    partyName: sd.customerName || party?.name || 'Recipient Consignee',
    partyGstin: party?.gstin,
    partyAddress: sd.shippingAddress || getPartyAddress(party, 'Site Dispatch Address'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (sd.items || []).map((it, idx) => {
      const qty = (it as any).deliveredQty || (it as any).orderedQty || it.quantity || 1;
      const rate = it.rate || (it as any).unitPrice || 0;
      const taxable = qty * rate;
      const taxPercent = it.taxPercent || 18;
      const taxTotal = Math.round(taxable * (taxPercent / 100));
      return {
        id: it.itemId || `sd-it-${idx}`,
        name: it.itemName,
        description: `Delivery Status: Dispatched / Shipped (${it.unit || 'NOS'})`,
        hsn: it.hsnCode || '998313',
        quantity: qty,
        unit: it.unit || 'NOS',
        rate,
        taxable,
        taxPercent,
        taxTotal,
        total: it.total || taxable + taxTotal,
      };
    }),
    subtotal: sd.totalAmount ? Math.round(sd.totalAmount / 1.18) : 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: sd.totalAmount || 0,
  };
}

export function convertSalesInvoiceToDoc(inv: SalesInvoiceRecord): ThemedDocumentData {
  const party = findParty(inv.customerId || inv.customerName);

  return {
    documentNumber: inv.invoiceNumber,
    documentType: 'A/R GST Tax Invoice (Original for Recipient)',
    date: inv.date,
    dueDate: inv.dueDate,
    referenceNumber: inv.orderNumber || inv.deliveryNumber || inv.id,
    paymentMethod: inv.balanceAmount === 0 ? 'Full Payment Settled' : 'Payment Due via Bank/UPI',
    partyName: inv.customerName || party?.name || 'Customer Organization',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Commercial Billing Address'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (inv.items || []).map((it, idx) => {
      const rate = it.rate || (it as any).unitPrice || 0;
      const qty = it.quantity || 1;
      const taxable = qty * rate;
      const taxPercent = it.taxPercent || 18;
      const taxTotal = (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0) || Math.round(taxable * (taxPercent / 100));
      return {
        id: it.itemId || `inv-it-${idx}`,
        name: it.itemName,
        description: it.itemCode ? `Code: ${it.itemCode}` : undefined,
        hsn: it.hsnCode || '998313',
        quantity: qty,
        unit: it.unit || 'NOS',
        rate,
        taxable,
        taxPercent,
        taxTotal,
        total: it.total || taxable + taxTotal,
      };
    }),
    subtotal: inv.subtotal,
    cgst: inv.cgstTotal || 0,
    sgst: inv.sgstTotal || 0,
    igst: inv.igstTotal || 0,
    grandTotal: inv.grandTotal,
  };
}

export function convertSalesReturnRequestToDoc(srr: SalesReturnRequest): ThemedDocumentData {
  const party = findParty(srr.customerId || srr.customerName);

  return {
    documentNumber: srr.returnRequestNumber,
    documentType: 'Sales Return Request / RMA Note',
    date: srr.date,
    referenceNumber: srr.originalInvoiceNumber,
    paymentMethod: 'Credit Note / Refund Authorization',
    partyName: srr.customerName || party?.name || 'Customer Account',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Customer Premise'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (srr.items || []).length > 0
      ? srr.items.map((it, idx) => {
          const rate = it.rate || (it as any).unitPrice || 0;
          const qty = it.quantity || 1;
          const taxable = qty * rate;
          const taxPercent = it.taxPercent || 18;
          const taxTotal = Math.round(taxable * (taxPercent / 100));
          return {
            id: it.itemId || `srr-it-${idx}`,
            name: it.itemName,
            description: `Return Reason: ${srr.reason} | Condition: ${(srr as any).condition || 'Inspected'}`,
            hsn: it.hsnCode || '998313',
            quantity: qty,
            unit: it.unit || 'NOS',
            rate,
            taxable,
            taxPercent,
            taxTotal,
            total: it.total || taxable + taxTotal,
          };
        })
      : [
          {
            id: 'srr-1',
            name: `Returned Goods against Invoice #${srr.originalInvoiceNumber}`,
            description: `Reason: ${srr.reason} | Remarks: ${srr.remarks || 'Returned by customer for credit adjustment'}`,
            hsn: '998313',
            quantity: 1,
            unit: 'NOS',
            rate: srr.totalAmount || 0,
            taxable: srr.totalAmount ? Math.round(srr.totalAmount / 1.18) : 0,
            taxPercent: 18,
            taxTotal: srr.totalAmount ? Math.round((srr.totalAmount / 1.18) * 0.18) : 0,
            total: srr.totalAmount || 0,
          },
        ],
    subtotal: srr.totalAmount ? Math.round(srr.totalAmount / 1.18) : 0,
    cgst: srr.totalAmount ? Math.round((srr.totalAmount / 1.18) * 0.09) : 0,
    sgst: srr.totalAmount ? Math.round((srr.totalAmount / 1.18) * 0.09) : 0,
    igst: 0,
    grandTotal: srr.totalAmount || 0,
  };
}

export function convertSalesReturnToDoc(srt: SalesReturnRecord | CreditNoteRecord): ThemedDocumentData {
  const isCreditNote = 'creditNoteNumber' in srt;
  const docNumber = isCreditNote ? (srt as any).creditNoteNumber : (srt as SalesReturnRecord).returnNumber;
  const party = findParty((srt as any).customerId || srt.customerName);

  return {
    documentNumber: docNumber,
    documentType: isCreditNote ? 'Credit Note (Sec 34 GST Act)' : 'Sales Return Note',
    date: srt.date,
    referenceNumber: srt.originalInvoiceNumber,
    paymentMethod: 'Credit Adjustment against A/R',
    partyName: srt.customerName || party?.name || 'Customer Consignee',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Billing Location'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (srt.items || []).map((it, idx) => {
      const rate = it.rate || (it as any).unitPrice || 0;
      const qty = it.quantity || 1;
      const taxable = qty * rate;
      const taxPercent = it.taxPercent || 18;
      const taxTotal = (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0) || Math.round(taxable * (taxPercent / 100));
      return {
        id: it.itemId || `cn-it-${idx}`,
        name: it.itemName,
        description: `Returned Material Credit Adjustment | Reason: ${(srt as any).reason || 'Goods Return'}`,
        hsn: it.hsnCode || '998313',
        quantity: qty,
        unit: it.unit || 'NOS',
        rate,
        taxable,
        taxPercent,
        taxTotal,
        total: it.total || taxable + taxTotal,
      };
    }),
    subtotal: srt.subtotal || 0,
    cgst: Math.round(((srt as any).taxTotal || 0) / 2),
    sgst: Math.round(((srt as any).taxTotal || 0) / 2),
    igst: 0,
    grandTotal: srt.grandTotal,
  };
}

// ----------------------------------------------------------------------------
// Purchase Documents Converters
// ----------------------------------------------------------------------------

export function convertPurchaseRequestToDoc(pr: PurchaseRequest): ThemedDocumentData {
  return {
    documentNumber: pr.requestNumber,
    documentType: 'Purchase Requisition / Indent (PR)',
    date: pr.date,
    dueDate: pr.requiredDate,
    referenceNumber: pr.id,
    paymentMethod: 'Internal Requisition Allocation',
    partyName: `Requisitioner: ${pr.requestedBy} (${pr.department})`,
    partyGstin: undefined,
    partyAddress: `${pr.branch || 'Main HQ'} | Priority: ${pr.priority}`,
    partyState: 'Kerala (32)',
    partyPhone: undefined,
    items: (pr.items || []).map((it, idx) => {
      const estPrice = (it as any).estimatedPrice || (it as any).rate || 0;
      return {
        id: it.itemId || `pr-it-${idx}`,
        name: it.itemName,
        description: `SKU: ${it.itemCode} | Priority: ${pr.priority}`,
        hsn: (it as any).hsnCode || '847130',
        quantity: it.quantity,
        unit: it.unit || 'NOS',
        rate: estPrice,
        taxable: it.quantity * estPrice,
        taxPercent: 18,
        taxTotal: Math.round(it.quantity * estPrice * 0.18),
        total: Math.round(it.quantity * estPrice * 1.18),
      };
    }),
    subtotal: pr.estimatedTotal ? Math.round(pr.estimatedTotal / 1.18) : 0,
    cgst: pr.estimatedTotal ? Math.round((pr.estimatedTotal / 1.18) * 0.09) : 0,
    sgst: pr.estimatedTotal ? Math.round((pr.estimatedTotal / 1.18) * 0.09) : 0,
    igst: 0,
    grandTotal: pr.estimatedTotal || 0,
  };
}

export function convertPurchaseQuotationToDoc(pq: PurchaseQuotation): ThemedDocumentData {
  const party = findParty(pq.vendorId || pq.vendorName);
  const isInterState = party?.state && !party.state.toLowerCase().includes('kerala');
  const taxTotal = pq.taxTotal || 0;

  return {
    documentNumber: pq.quotationNumber,
    documentType: 'Vendor Quotation / Price Bid (RFQ)',
    date: pq.date,
    dueDate: pq.validUntil,
    referenceNumber: pq.requestNumber || pq.requestRefId,
    paymentMethod: 'Vendor Credit Terms',
    partyName: pq.vendorName || party?.name || 'Supplier Vendor',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Vendor Manufacturing/Distribution Depot'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (pq.items || []).map((it, idx) => {
      const rate = it.rate || (it as any).unitPrice || 0;
      const qty = it.quantity || 1;
      const taxable = qty * rate;
      const taxPercent = it.taxPercent || 18;
      const taxAmount = (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0) || Math.round(taxable * (taxPercent / 100));
      return {
        id: it.itemId || `pq-it-${idx}`,
        name: it.itemName,
        description: it.itemCode ? `Code: ${it.itemCode} | Lead time: ${pq.deliveryDate || 'Normal'}` : undefined,
        hsn: it.hsnCode || '847130',
        quantity: qty,
        unit: it.unit || 'NOS',
        rate,
        taxable,
        taxPercent,
        taxTotal: taxAmount,
        total: it.total || taxable + taxAmount,
      };
    }),
    subtotal: pq.subtotal,
    cgst: isInterState ? 0 : Math.round(taxTotal / 2),
    sgst: isInterState ? 0 : Math.round(taxTotal / 2),
    igst: isInterState ? taxTotal : 0,
    grandTotal: pq.grandTotal,
  };
}

export function convertPurchaseOrderToDoc(po: PurchaseOrder): ThemedDocumentData {
  const party = findParty(po.vendorId || po.vendorName);
  const isInterState = party?.state && !party.state.toLowerCase().includes('kerala');
  const taxTotal = po.taxTotal || 0;

  return {
    documentNumber: po.poNumber,
    documentType: 'Official Purchase Order (PO)',
    date: po.date,
    dueDate: po.expectedDeliveryDate,
    referenceNumber: po.quotationNumber || po.requestNumber,
    paymentMethod: 'Bank Transfer / Purchase Order Terms',
    partyName: po.vendorName || party?.name || 'Authorized Supplier',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Vendor Billing Depot'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (po.items || []).map((it, idx) => {
      const rate = it.rate || (it as any).unitPrice || 0;
      const qty = it.quantity || 1;
      const taxable = qty * rate;
      const taxPercent = it.taxPercent || 18;
      const taxAmount = (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0) || Math.round(taxable * (taxPercent / 100));
      return {
        id: it.itemId || `po-it-${idx}`,
        name: it.itemName,
        description: it.itemCode ? `Item Code: ${it.itemCode}` : undefined,
        hsn: it.hsnCode || '847130',
        quantity: qty,
        unit: it.unit || 'NOS',
        rate,
        taxable,
        taxPercent,
        taxTotal: taxAmount,
        total: it.total || taxable + taxAmount,
      };
    }),
    subtotal: po.subtotal,
    cgst: isInterState ? 0 : Math.round(taxTotal / 2),
    sgst: isInterState ? 0 : Math.round(taxTotal / 2),
    igst: isInterState ? taxTotal : 0,
    grandTotal: po.grandTotal,
  };
}

export function convertGoodsReceiptToDoc(gr: GoodsReceiptPO): ThemedDocumentData {
  const party = findParty(gr.vendorId || gr.vendorName);

  return {
    documentNumber: gr.grpoNumber,
    documentType: 'Goods Receipt Note / Intake (GRN / GRPO)',
    date: gr.date,
    referenceNumber: gr.poNumber || gr.poId,
    paymentMethod: 'Warehouse Intake Receipt',
    partyName: gr.vendorName || party?.name || 'Supply Partner',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Warehouse Dock / Receipt Bay'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (gr.items || []).map((it, idx) => {
      const qty = it.acceptedQty || it.receivedQty || 1;
      const rate = it.rate || 0;
      const taxPercent = it.taxPercent || 18;
      const taxable = qty * rate;
      const taxTotal = Math.round((taxable * taxPercent) / 100);
      return {
        id: it.itemId || `gr-it-${idx}`,
        name: it.itemName,
        description: it.rejectedQty
          ? `Accepted: ${it.acceptedQty} / Received: ${it.receivedQty} (Rejected: ${it.rejectedQty})`
          : `Accepted: ${it.acceptedQty} / Received: ${it.receivedQty} | Quality Inspected`,
        hsn: it.hsnCode || '847130',
        quantity: qty,
        unit: it.unit || 'NOS',
        rate,
        taxable,
        taxPercent,
        taxTotal,
        total: it.total || taxable + taxTotal,
      };
    }),
    subtotal: gr.totalAmount ? Math.round(gr.totalAmount / 1.18) : 0,
    cgst: gr.totalAmount ? Math.round((gr.totalAmount / 1.18) * 0.09) : 0,
    sgst: gr.totalAmount ? Math.round((gr.totalAmount / 1.18) * 0.09) : 0,
    igst: 0,
    grandTotal: gr.totalAmount || 0,
  };
}

export function convertPurchaseInvoiceToDoc(pi: PurchaseInvoiceRecord): ThemedDocumentData {
  const party = findParty(pi.vendorId || pi.vendorName);

  return {
    documentNumber: pi.invoiceNumber,
    documentType: 'A/P Vendor Bill / Tax Invoice Entry',
    date: pi.date,
    dueDate: pi.dueDate,
    referenceNumber: pi.poNumber || pi.grpoNumber || pi.id,
    paymentMethod: pi.balanceAmount === 0 ? 'Fully Paid & Discharged' : 'A/P Payable Outstanding',
    partyName: pi.vendorName || party?.name || 'Vendor Organization',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Vendor Billing Address'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (pi.items || []).map((it, idx) => {
      const rate = it.rate || 0;
      const qty = it.quantity || 1;
      const taxable = qty * rate;
      const taxPercent = it.taxPercent || 18;
      const taxTotal = (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0) || Math.round((taxable * taxPercent) / 100);
      return {
        id: it.itemId || `pi-it-${idx}`,
        name: it.itemName,
        description: it.itemCode ? `Code: ${it.itemCode}` : undefined,
        hsn: it.hsnCode || '847130',
        quantity: qty,
        unit: it.unit || 'NOS',
        rate,
        taxable,
        taxPercent,
        taxTotal,
        total: it.total || taxable + taxTotal,
      };
    }),
    subtotal: pi.subtotal,
    cgst: pi.cgstTotal || 0,
    sgst: pi.sgstTotal || 0,
    igst: pi.igstTotal || 0,
    grandTotal: pi.grandTotal,
  };
}

export function convertPurchaseReturnRequestToDoc(prr: PurchaseReturnRequest): ThemedDocumentData {
  const party = findParty(prr.vendorId || prr.vendorName);

  return {
    documentNumber: prr.returnRequestNumber,
    documentType: 'Purchase Return Request Note',
    date: prr.date,
    referenceNumber: prr.originalInvoiceNumber,
    paymentMethod: 'Debit Note / Vendor Refund Claim',
    partyName: prr.vendorName || party?.name || 'Vendor Payee',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Vendor Registered Address'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (prr.items || []).length > 0
      ? prr.items.map((it, idx) => {
          const rate = it.rate || 0;
          const qty = it.quantity || 1;
          const taxable = qty * rate;
          const taxPercent = it.taxPercent || 18;
          const taxTotal = Math.round((taxable * taxPercent) / 100);
          return {
            id: it.itemId || `prr-it-${idx}`,
            name: it.itemName,
            description: `Discrepancy: ${prr.reason} | Notes: ${prr.remarks || 'Debit Note initiated'}`,
            hsn: it.hsnCode || '847130',
            quantity: qty,
            unit: it.unit || 'NOS',
            rate,
            taxable,
            taxPercent,
            taxTotal,
            total: it.total || taxable + taxTotal,
          };
        })
      : [
          {
            id: 'prr-1',
            name: `Goods Returned to Vendor against Bill ${prr.originalInvoiceNumber}`,
            description: `Reason: ${prr.reason} | Remarks: ${prr.remarks || 'Goods rejected at inspection'}`,
            hsn: '847130',
            quantity: 1,
            unit: 'NOS',
            rate: prr.totalAmount || 0,
            taxable: prr.totalAmount ? Math.round(prr.totalAmount / 1.18) : 0,
            taxPercent: 18,
            taxTotal: prr.totalAmount ? Math.round((prr.totalAmount / 1.18) * 0.18) : 0,
            total: prr.totalAmount || 0,
          },
        ],
    subtotal: prr.totalAmount ? Math.round(prr.totalAmount / 1.18) : 0,
    cgst: prr.totalAmount ? Math.round((prr.totalAmount / 1.18) * 0.09) : 0,
    sgst: prr.totalAmount ? Math.round((prr.totalAmount / 1.18) * 0.09) : 0,
    igst: 0,
    grandTotal: prr.totalAmount || 0,
  };
}

export function convertPurchaseReturnToDoc(prt: PurchaseReturnRecord | DebitNoteRecord): ThemedDocumentData {
  const isDebitNote = 'noteNumber' in prt;
  const docNumber = isDebitNote ? (prt as DebitNoteRecord).noteNumber : (prt as PurchaseReturnRecord).returnNumber;
  const party = findParty((prt as any).vendorId || prt.vendorName);

  return {
    documentNumber: docNumber,
    documentType: isDebitNote ? 'Debit Note (Sec 34 GST Act)' : 'Purchase Return Voucher',
    date: prt.date,
    referenceNumber: prt.originalInvoiceNumber,
    paymentMethod: 'Debit Adjustment Against Vendor Ledger',
    partyName: prt.vendorName || party?.name || 'Vendor Payee',
    partyGstin: party?.gstin,
    partyAddress: getPartyAddress(party, 'Vendor Billing Depot'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (prt.items || []).map((it, idx) => {
      const rate = it.rate || 0;
      const qty = it.quantity || 1;
      const taxable = qty * rate;
      const taxPercent = it.taxPercent || 18;
      const taxTotal = (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0) || Math.round((taxable * taxPercent) / 100);
      return {
        id: it.itemId || `dn-it-${idx}`,
        name: it.itemName,
        description: `Purchase Return Debit Adjustment | Reason: ${(prt as any).reason || 'Goods Return'}`,
        hsn: it.hsnCode || '847130',
        quantity: qty,
        unit: it.unit || 'NOS',
        rate,
        taxable,
        taxPercent,
        taxTotal,
        total: it.total || taxable + taxTotal,
      };
    }),
    subtotal: prt.subtotal || 0,
    cgst: Math.round(((prt as any).taxTotal || 0) / 2),
    sgst: Math.round(((prt as any).taxTotal || 0) / 2),
    igst: 0,
    grandTotal: prt.grandTotal,
  };
}

// ============================================================================
// INVENTORY DOCUMENT CONVERTERS
// ============================================================================

export function convertStockMovementToDoc(m: StockMovement): ThemedDocumentData {
  const isInward =
    m.type === 'Purchase In' ||
    m.type === 'Sales Return' ||
    m.type === 'Adjustment In' ||
    m.type === 'Opening';

  const docTypeName =
    m.type === 'Purchase In'
      ? 'Goods Receipt Note (Material Intake)'
      : m.type === 'Sales Out'
      ? 'Goods Delivery Slip (Outward Movement)'
      : m.type === 'Adjustment In' || m.type === 'Adjustment Out'
      ? 'Physical Stock Adjustment Voucher'
      : m.type === 'Sales Return'
      ? 'Customer Return Material Inward Slip'
      : m.type === 'Purchase Return'
      ? 'Vendor Return Outward Dispatch Note'
      : 'Stock Transfer & Movement Voucher';

  const absQty = Math.abs(m.quantity);
  const totalVal = m.totalValue || absQty * (m.unitCost || 0);

  return {
    documentNumber: m.movementNumber,
    documentType: docTypeName,
    date: m.date,
    referenceNumber: m.referenceNumber || m.referenceType || 'Direct Store Ledger',
    paymentMethod: isInward ? 'Material Inward Intake' : 'Material Outward Dispatch',
    partyName: m.warehouse || 'Central Inventory & Distribution Bay',
    partyGstin: '32AABCM1234F1Z8',
    partyAddress: `Warehouse: ${m.warehouse || 'Main Bay'} | Location Ref: ${m.referenceType || 'Inventory General Ledger'}`,
    partyState: 'Kerala (32)',
    partyPhone: `Authorized By: ${m.createdBy || 'Inventory Controller'}`,
    items: [
      {
        id: m.itemId || 'itm-mov',
        name: m.itemName,
        description: `Movement Type: ${m.type} | Ref: ${m.referenceNumber || 'N/A'} | Notes: ${m.notes || 'Routine Inventory Operation'}`,
        hsn: '847160',
        quantity: absQty,
        unit: m.unit || 'NOS',
        rate: m.unitCost || 0,
        taxable: totalVal,
        taxPercent: 0,
        taxTotal: 0,
        total: totalVal,
      },
    ],
    subtotal: totalVal,
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: totalVal,
  };
}

export function convertInventoryValuationToDoc(items: ItemMaster[]): ThemedDocumentData {
  const dateStr = new Date().toISOString().split('T')[0];
  let totalValuation = 0;

  const docItems = items.map((it, idx) => {
    const stock = Math.max(0, it.currentStock);
    const assetVal = stock * (it.purchasePrice || 0);
    totalValuation += assetVal;
    return {
      id: it.id || `val-it-${idx}`,
      name: `${it.name} (${it.code})`,
      description: `Category: ${it.category} | Method: ${it.valuationMethod || 'FIFO'} | Min Reorder: ${it.reorderLevel} ${it.baseUnit}`,
      hsn: it.hsnCode || '847130',
      quantity: stock,
      unit: it.baseUnit || 'NOS',
      rate: it.purchasePrice || 0,
      taxable: assetVal,
      taxPercent: 0,
      taxTotal: 0,
      total: assetVal,
    };
  });

  return {
    documentNumber: `VAL-STK-${dateStr.replace(/-/g, '')}`,
    documentType: 'Official Inventory Valuation Statement & Stock Audit',
    date: dateStr,
    referenceNumber: 'GL-1300-PERPETUAL-STOCK',
    paymentMethod: 'Perpetual Balance Sheet Audit Statement',
    partyName: 'Internal Inventory & Cost Accounting Authority',
    partyGstin: '32AABCM1234F1Z8',
    partyAddress: 'Central Stores & Logistics Division, Corporate Headquarters, Kochi, Kerala',
    partyState: 'Kerala (32)',
    partyPhone: `Total SKUs: ${items.length}`,
    items: docItems,
    subtotal: totalValuation,
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: totalValuation,
  };
}

export function convertItemToDoc(item: ItemMaster): ThemedDocumentData {
  const dateStr = new Date().toISOString().split('T')[0];
  const stock = Math.max(0, item.currentStock);
  const totalVal = stock * (item.purchasePrice || 0);

  return {
    documentNumber: `SKU-${item.code}`,
    documentType: 'Item Master Specification & Stock Card Dossier',
    date: dateStr,
    referenceNumber: item.id,
    paymentMethod: `Valuation Method: ${item.valuationMethod || 'FIFO'}`,
    partyName: `${item.name} (${item.code})`,
    partyGstin: `HSN Code: ${item.hsnCode}`,
    partyAddress: `Category: ${item.category} | Primary Unit: ${item.baseUnit} | Reorder Level: ${item.reorderLevel} ${item.baseUnit}`,
    partyState: 'Kerala (32)',
    partyPhone: `Purchase Cost: ₹${item.purchasePrice} | Selling Price: ₹${item.salesPrice}`,
    items: [
      {
        id: item.id,
        name: `${item.name} [On-Hand Inventory]`,
        description: `Current Stock: ${stock} ${item.baseUnit} | Tax Rate: ${(item as any).taxRate || 18}% | Min Reorder: ${item.reorderLevel} ${item.baseUnit}`,
        hsn: item.hsnCode,
        quantity: stock,
        unit: item.baseUnit,
        rate: item.purchasePrice,
        taxable: totalVal,
        taxPercent: (item as any).taxRate || 18,
        taxTotal: Math.round(totalVal * (((item as any).taxRate || 18) / 100)),
        total: Math.round(totalVal * (1 + ((item as any).taxRate || 18) / 100)),
      },
    ],
    subtotal: totalVal,
    cgst: Math.round(totalVal * 0.09),
    sgst: Math.round(totalVal * 0.09),
    igst: 0,
    grandTotal: Math.round(totalVal * 1.18),
  };
}

// ============================================================================
// ASSET DOCUMENT CONVERTERS
// ============================================================================

export function convertAssetToDoc(asset: Asset): ThemedDocumentData {
  const dateStr = new Date().toISOString().split('T')[0];
  const purchaseCost = asset.purchaseInfo?.purchaseCost || 0;
  const currentVal = asset.purchaseInfo?.currentBookValue || purchaseCost;

  return {
    documentNumber: asset.id,
    documentType: 'Fixed Asset Certificate & Specification Dossier',
    date: asset.purchaseInfo?.purchaseDate || dateStr,
    referenceNumber: asset.serialNumber || `SN-${asset.id}`,
    paymentMethod: `Status: ${asset.status} (${asset.condition})`,
    partyName: asset.currentAssignment?.employeeName
      ? `${asset.currentAssignment.employeeName} (${asset.currentAssignment.department || 'Staff'})`
      : 'Central Asset Repository / Unassigned',
    partyGstin: `Serial No: ${asset.serialNumber || 'N/A'}`,
    partyAddress: `Location: ${asset.location.branch} - ${asset.location.building}, Room ${asset.location.room}`,
    partyState: 'Kerala (32)',
    partyPhone: `Custodian Contact: ${asset.currentAssignment?.allocationDate || 'Unallocated'}`,
    items: [
      {
        id: asset.id,
        name: `${asset.name} [${asset.category}]`,
        description: `Brand: ${asset.brand || 'Enterprise Grade'} | Model: ${asset.model || 'Standard'} | Vendor: ${asset.purchaseInfo?.vendorName || 'Authorized Supplier'} | Warranty Until: ${asset.warranty?.endDate || 'N/A'}`,
        hsn: '847130',
        quantity: 1,
        unit: 'UNIT',
        rate: purchaseCost,
        taxable: purchaseCost,
        taxPercent: 18,
        taxTotal: Math.round(purchaseCost * 0.18),
        total: Math.round(purchaseCost * 1.18),
      },
    ],
    subtotal: purchaseCost,
    cgst: Math.round(purchaseCost * 0.09),
    sgst: Math.round(purchaseCost * 0.09),
    igst: 0,
    grandTotal: Math.round(purchaseCost * 1.18),
    previousBalance: currentVal,
  };
}

export function convertAssetPoToDoc(po: AssetPO): ThemedDocumentData {
  const dateStr = (po as any).orderDate || (po as any).createdAt || new Date().toISOString().split('T')[0];
  const party = findParty(po.vendorId || po.vendorName);

  return {
    documentNumber: po.poNumber,
    documentType: 'Asset Purchase Order (Capital Expenditure)',
    date: dateStr,
    dueDate: po.expectedDeliveryDate,
    referenceNumber: po.id,
    paymentMethod: 'Capital Expenditure Terms (Net 30)',
    partyName: po.vendorName || party?.name || 'Authorized Equipment Vendor',
    partyGstin: party?.gstin || '32AABCV5555Z1Z9',
    partyAddress: getPartyAddress(party, 'Vendor Commercial Office'),
    partyState: party?.state || 'Kerala (32)',
    partyPhone: party?.phone,
    items: (po.items || []).map((it, idx) => {
      const rate = it.unitPrice || 0;
      const qty = it.quantity || 1;
      const taxable = qty * rate;
      const total = taxable * 1.18;
      return {
        id: `po-it-${idx}`,
        name: it.description || 'Capital Asset Equipment',
        description: `Category: ${it.category || 'Fixed Assets'} | Delivery Expectation: ${po.expectedDeliveryDate || 'Standard Delivery'}`,
        hsn: '847130',
        quantity: qty,
        unit: 'NOS',
        rate,
        taxable,
        taxPercent: 18,
        taxTotal: Math.round(taxable * 0.18),
        total: Math.round(total),
      };
    }),
    subtotal: po.totalAmount ? Math.round(po.totalAmount / 1.18) : 0,
    cgst: po.totalAmount ? Math.round((po.totalAmount / 1.18) * 0.09) : 0,
    sgst: po.totalAmount ? Math.round((po.totalAmount / 1.18) * 0.09) : 0,
    igst: 0,
    grandTotal: po.totalAmount,
  };
}

export function convertAssetMovementToDoc(m: AssetMovement): ThemedDocumentData {
  const toPerson = (m as any).toEmployee || (m as any).toEmployeeName;
  const fromPerson = (m as any).fromEmployee || (m as any).fromEmployeeName;

  return {
    documentNumber: `MV-${m.referenceNumber || m.id.slice(0, 8).toUpperCase()}`,
    documentType: 'Asset Custody Transfer & Gate Pass Voucher',
    date: m.date,
    referenceNumber: m.referenceNumber || m.assetId,
    paymentMethod: `Custody Transfer (${m.movementType})`,
    partyName: toPerson ? `Recipient: ${toPerson}` : `Destination: ${m.toLocation}`,
    partyGstin: `Asset ID: ${m.assetId}`,
    partyAddress: `From: ${fromPerson || m.fromLocation || 'Store'} → To: ${toPerson || m.toLocation}`,
    partyState: 'Kerala (32)',
    partyPhone: `Authorized By: ${m.createdBy || 'Asset Custodian'}`,
    items: [
      {
        id: m.assetId,
        name: `${m.assetName} [ID: ${m.assetId}]`,
        description: `Movement Type: ${m.movementType} | Condition: ${m.condition || 'Good'} | Reason: ${m.reason || 'Official Allocation'}`,
        hsn: '847130',
        quantity: 1,
        unit: 'NOS',
        rate: 0,
        taxable: 0,
        taxPercent: 0,
        taxTotal: 0,
        total: 0,
      },
    ],
    subtotal: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: 0,
  };
}

