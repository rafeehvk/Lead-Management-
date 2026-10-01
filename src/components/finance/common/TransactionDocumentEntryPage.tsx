import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Receipt,
  ShoppingBag,
  Building2,
  Calendar,
  Layers,
  Trash2,
  DollarSign,
  Plus,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Truck,
  Package,
  Clock,
  RotateCcw,
  ArrowLeft,
  Printer,
  Save,
  CheckCircle2,
  Search,
  ExternalLink,
  ChevronDown,
  Info,
  CreditCard,
  Banknote,
  Send,
  HelpCircle,
  Copy,
  Sliders,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  User,
  ArrowRight,
  RefreshCw,
  QrCode,
  Palette,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import {
  PartyMaster,
  ItemMaster,
  SalesItemLine,
  PurchaseItemLine,
  SalesInvoiceRecord,
  SalesOrder,
  SalesQuotation,
  PurchaseInvoiceRecord,
  PurchaseOrder,
  PurchaseQuotation,
} from '../../../types/finance';
import { GST_STATE_CODES } from '../../../utils/gstUtils';
import { PartyFormModal } from '../parties/PartyFormModal';
import { ThemedDocumentRenderer, ThemedDocumentData } from '../themes/ThemedDocumentRenderer';
import { invoiceThemeStorage } from '../../../services/finance/invoiceThemeStorage';
import {
  DocumentThemeConfig,
  InvoiceThemeStyle,
  InvoiceThemeColor,
  THEME_COLOR_PALETTES,
} from '../../../types/invoiceTheme';

export type EntryPartyType = 'Customer' | 'Supplier';

export type EntryDocumentType =
  | 'sales-invoice'
  | 'sales-order'
  | 'sales-quotation'
  | 'sales-return'
  | 'purchase-invoice'
  | 'purchase-order'
  | 'purchase-quotation'
  | 'purchase-return';

export interface TransactionDocumentEntryPageProps {
  initialPartyType?: EntryPartyType;
  initialDocType?: EntryDocumentType;
  onBack?: () => void;
  onSuccess?: (docNumber: string, docType: string) => void;
  currentUserName?: string;
  isModal?: boolean;
  onClose?: () => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
};

// Convert number to Indian words
function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teen = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return single[n];
    if (n < 20) return teen[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + single[n % 10] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) res += single[hundred] + ' Hundred';
    if (rest > 0) {
      if (res !== '') res += ' and ';
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let crore = Math.floor(rounded / 10000000);
  let lakh = Math.floor((rounded % 10000000) / 100000);
  let thousand = Math.floor((rounded % 100000) / 1000);
  let hundred = rounded % 1000;

  let words = '';
  if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertThreeDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertThreeDigits(thousand) + ' Thousand ';
  if (hundred > 0) words += convertThreeDigits(hundred);

  return 'Rupees ' + words.trim() + ' Only';
}

export const TransactionDocumentEntryPage: React.FC<TransactionDocumentEntryPageProps> = ({
  initialPartyType = 'Customer',
  initialDocType,
  onBack,
  onSuccess,
  currentUserName = 'Finance Officer',
  isModal = false,
  onClose,
}) => {
  // 1. Nature / Party selection
  const [partyType, setPartyType] = useState<EntryPartyType>(initialPartyType);

  // 2. Document Type
  const [docType, setDocType] = useState<EntryDocumentType>(() => {
    if (initialDocType) return initialDocType;
    return initialPartyType === 'Customer' ? 'sales-invoice' : 'purchase-invoice';
  });

  // Switch docType default when partyType flips
  const handlePartyTypeChange = (newType: EntryPartyType) => {
    setPartyType(newType);
    if (newType === 'Customer') {
      if (!docType.startsWith('sales-')) {
        setDocType('sales-invoice');
      }
    } else {
      if (!docType.startsWith('purchase-')) {
        setDocType('purchase-invoice');
      }
    }
  };

  // Parties & Items data from storage
  const [partiesList, setPartiesList] = useState<PartyMaster[]>(() => erpFinanceStorage.getParties());
  const [itemsMaster, setItemsMaster] = useState<ItemMaster[]>(() => erpFinanceStorage.getItems());
  const bankAccounts = useMemo(() => erpFinanceStorage.getBankAccounts(), []);
  const cashAccounts = useMemo(() => erpFinanceStorage.getCashAccounts(), []);

  // Filtered party list according to party type
  const availableParties = useMemo(() => {
    return partiesList.filter((p) => {
      if (partyType === 'Customer') {
        return p.type === 'Customer' || p.type === 'Customer & Vendor';
      } else {
        return p.type === 'Vendor' || p.type === 'Customer & Vendor';
      }
    });
  }, [partiesList, partyType]);

  // Selected party
  const [selectedPartyId, setSelectedPartyId] = useState<string>(() => availableParties[0]?.id || '');
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);

  // Sync selectedPartyId when availableParties change
  useEffect(() => {
    if (!availableParties.some((p) => p.id === selectedPartyId)) {
      setSelectedPartyId(availableParties[0]?.id || '');
    }
  }, [availableParties, selectedPartyId]);

  const selectedParty = useMemo(() => {
    return partiesList.find((p) => p.id === selectedPartyId) || availableParties[0] || null;
  }, [partiesList, selectedPartyId, availableParties]);

  // Document Number & Auto-generation
  const generateDocNumber = (type: EntryDocumentType): string => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    switch (type) {
      case 'sales-invoice':
        return `INV-2026-${rand}`;
      case 'sales-order':
        return `SO-2026-${rand}`;
      case 'sales-quotation':
        return `SQ-2026-${rand}`;
      case 'sales-return':
        return `CN-2026-${rand}`;
      case 'purchase-invoice':
        return `PI-2026-${rand}`;
      case 'purchase-order':
        return `PO-2026-${rand}`;
      case 'purchase-quotation':
        return `PQ-2026-${rand}`;
      case 'purchase-return':
        return `DN-2026-${rand}`;
    }
  };

  const [documentNumber, setDocumentNumber] = useState<string>(() => generateDocNumber(docType));
  const [isDocNumberCustom, setIsDocNumberCustom] = useState(false);

  // Update doc number when docType changes if not manually customized
  useEffect(() => {
    if (!isDocNumberCustom) {
      setDocumentNumber(generateDocNumber(docType));
    }
  }, [docType, isDocNumberCustom]);

  // Dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [docDate, setDocDate] = useState<string>(todayStr);
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30');
  const [dueDate, setDueDate] = useState<string>(() => {
    return new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  });

  // Calculate Due Date based on Payment Terms
  const handlePaymentTermsChange = (terms: string) => {
    setPaymentTerms(terms);
    const baseDate = new Date(docDate || todayStr);
    let daysToAdd = 30;
    if (terms === 'Immediate') daysToAdd = 0;
    else if (terms === 'Net 7') daysToAdd = 7;
    else if (terms === 'Net 15') daysToAdd = 15;
    else if (terms === 'Net 30') daysToAdd = 30;
    else if (terms === 'Net 45') daysToAdd = 45;
    else if (terms === 'Net 60') daysToAdd = 60;
    else if (terms === 'Net 90') daysToAdd = 90;

    const newDue = new Date(baseDate.getTime() + daysToAdd * 86400000);
    setDueDate(newDue.toISOString().split('T')[0]);
  };

  // Payment Type
  const [paymentType, setPaymentType] = useState<string>('Credit / On Account');

  // References
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [referenceDate, setReferenceDate] = useState<string>('');
  const [costCenter, setCostCenter] = useState<string>('CC-OPERATIONS');

  // Shipping & Addresses
  const [sameAsBilling, setSameAsBilling] = useState<boolean>(true);
  const [billingAddress, setBillingAddress] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState<string>('32'); // Default Kerala (32)

  // Populate address when selectedParty changes
  useEffect(() => {
    if (selectedParty) {
      const addr = [
        selectedParty.address?.street,
        selectedParty.address?.city,
        selectedParty.address?.state,
        selectedParty.address?.pincode ? `PIN: ${selectedParty.address.pincode}` : '',
      ]
        .filter(Boolean)
        .join(', ');
      setBillingAddress(addr || `${selectedParty.name} Registered Address, Kochi, Kerala`);
      if (sameAsBilling) {
        setShippingAddress(addr || `${selectedParty.name} Delivery Site, Kochi, Kerala`);
      }
      if (selectedParty.address?.stateCode) {
        setPlaceOfSupplyCode(selectedParty.address.stateCode);
      }
    }
  }, [selectedParty, sameAsBilling]);

  // Is Intra-state (Kerala 32)
  const isIntraState = placeOfSupplyCode === '32';

  // Line items state
  interface TableLineItem {
    id: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    rate: number;
    discountPercent: number;
    taxPercent: number;
    customDescription?: string;
  }

  const [lineItems, setLineItems] = useState<TableLineItem[]>(() => {
    const firstItem = itemsMaster[0];
    return [
      {
        id: `line-${Date.now()}-1`,
        itemId: firstItem?.id || 'itm-default-1',
        itemCode: firstItem?.code || 'LAP-DELL-XPS',
        itemName: firstItem?.name || 'Dell XPS 15 Workstation Laptop',
        hsnCode: firstItem?.hsnCode || '8471',
        quantity: 1,
        unit: firstItem?.baseUnit || firstItem?.salesUnit || 'NOS',
        rate: partyType === 'Customer' ? firstItem?.salesPrice || 145000 : firstItem?.purchasePrice || 120000,
        discountPercent: 0,
        taxPercent: firstItem?.taxRatePercent || 18,
        customDescription: 'Standard commercial deployment with warranty SLA',
      },
    ];
  });

  const handleAddLineItem = (presetItem?: ItemMaster) => {
    const itemToAdd = presetItem || itemsMaster[0];
    const newLine: TableLineItem = {
      id: `line-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
      itemId: itemToAdd?.id || `itm-custom-${Date.now()}`,
      itemCode: itemToAdd?.code || 'GEN-ITEM',
      itemName: itemToAdd?.name || 'Custom Product / Service Line',
      hsnCode: itemToAdd?.hsnCode || '8471',
      quantity: 1,
      unit: itemToAdd?.baseUnit || itemToAdd?.salesUnit || 'NOS',
      rate: partyType === 'Customer' ? itemToAdd?.salesPrice || 10000 : itemToAdd?.purchasePrice || 8500,
      discountPercent: 0,
      taxPercent: itemToAdd?.taxRatePercent || 18,
      customDescription: '',
    };
    setLineItems((prev) => [...prev, newLine]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) {
      alert('Document must contain at least one line item.');
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, field: keyof TableLineItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // If user selected a new item from dropdown
      if (field === 'itemId') {
        const found = itemsMaster.find((i) => i.id === value);
        if (found) {
          target.itemCode = found.code;
          target.itemName = found.name;
          target.hsnCode = found.hsnCode || '8471';
          target.unit = found.baseUnit || found.salesUnit || 'NOS';
          target.rate = partyType === 'Customer' ? found.salesPrice || 0 : found.purchasePrice || 0;
          target.taxPercent = found.taxRatePercent || 18;
        }
      }

      updated[index] = target;
      return updated;
    });
  };

  // Calculations
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [extraDiscountPercent, setExtraDiscountPercent] = useState<number>(0);
  const [notes, setNotes] = useState<string>(
    partyType === 'Customer'
      ? 'Thank you for your business. Please remit payment as per agreed credit terms.'
      : 'Purchase order subject to standard inspection and quality acceptance upon delivery.'
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    '1. Goods once sold are subject to standard return policy within 7 days.\n2. Interest @ 18% p.a. will be levied on overdue invoices.\n3. All disputes subject to Kochi jurisdiction.'
  );

  // Immediate Settlement (Mark as Paid)
  const [isMarkAsPaid, setIsMarkAsPaid] = useState<boolean>(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [settlementAccountId, setSettlementAccountId] = useState<string>(() => {
    return bankAccounts[0]?.id || cashAccounts[0]?.id || '';
  });
  const [settlementRef, setSettlementRef] = useState<string>('');

  // Modals & UI States
  const [isNewPartyModalOpen, setIsNewPartyModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Themed Document (My Billbook Style)
  const currentCategory = partyType === 'Customer' ? 'sales' : 'purchase';
  const [docThemeConfig, setDocThemeConfig] = useState<DocumentThemeConfig>(() =>
    invoiceThemeStorage.getThemeForDocument(partyType === 'Customer' ? 'sales' : 'purchase')
  );
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  useEffect(() => {
    setDocThemeConfig(invoiceThemeStorage.getThemeForDocument(partyType === 'Customer' ? 'sales' : 'purchase'));
  }, [partyType]);

  // Compute calculated amounts for all lines
  const calculatedItems = useMemo(() => {
    return lineItems.map((item) => {
      const gross = item.rate * item.quantity;
      const discountVal = (gross * (item.discountPercent || 0)) / 100;
      const taxable = gross - discountVal;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isIntraState) {
        cgst = Math.round(((taxable * (item.taxPercent / 2)) / 100) * 100) / 100;
        sgst = Math.round(((taxable * (item.taxPercent / 2)) / 100) * 100) / 100;
      } else {
        igst = Math.round(((taxable * item.taxPercent) / 100) * 100) / 100;
      }

      const total = taxable + cgst + sgst + igst;
      return {
        ...item,
        gross,
        discountVal,
        taxable,
        cgst,
        sgst,
        igst,
        taxTotal: cgst + sgst + igst,
        total,
      };
    });
  }, [lineItems, isIntraState]);

  // Financial totals
  const subtotalGross = useMemo(() => calculatedItems.reduce((acc, i) => acc + i.gross, 0), [calculatedItems]);
  const totalItemDiscount = useMemo(() => calculatedItems.reduce((acc, i) => acc + i.discountVal, 0), [calculatedItems]);
  const subtotalTaxable = useMemo(() => calculatedItems.reduce((acc, i) => acc + i.taxable, 0), [calculatedItems]);
  const extraDiscountVal = useMemo(() => (subtotalTaxable * (extraDiscountPercent || 0)) / 100, [subtotalTaxable, extraDiscountPercent]);
  const totalCGST = useMemo(() => calculatedItems.reduce((acc, i) => acc + i.cgst, 0), [calculatedItems]);
  const totalSGST = useMemo(() => calculatedItems.reduce((acc, i) => acc + i.sgst, 0), [calculatedItems]);
  const totalIGST = useMemo(() => calculatedItems.reduce((acc, i) => acc + i.igst, 0), [calculatedItems]);
  const totalTax = totalCGST + totalSGST + totalIGST;

  const rawGrandTotal = subtotalTaxable - extraDiscountVal + totalTax + (otherCharges || 0);
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOffAmount = Math.round((roundedGrandTotal - rawGrandTotal) * 100) / 100;

  // Auto-sync paid amount if "Mark as Paid" is ticked and paidAmount wasn't manually edited
  useEffect(() => {
    if (isMarkAsPaid) {
      setPaidAmount(roundedGrandTotal);
    }
  }, [isMarkAsPaid, roundedGrandTotal]);

  // Save / Post Document
  const handleSaveDocument = (options?: { andCreateNew?: boolean; andPrint?: boolean }) => {
    if (!selectedParty) {
      setErrorMessage(`Please select a valid ${partyType}.`);
      return;
    }
    if (calculatedItems.length === 0) {
      setErrorMessage('Please add at least one line item.');
      return;
    }
    if (roundedGrandTotal <= 0) {
      setErrorMessage('Total document amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const itemsPayload: SalesItemLine[] = calculatedItems.map((item) => ({
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        discount: item.discountPercent,
        taxPercent: item.taxPercent,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        total: item.total,
      }));

      let createdDocNumber = documentNumber;

      if (partyType === 'Customer') {
        // Sales Documents
        if (docType === 'sales-invoice') {
          const inv = erpFinanceStorage.postSalesInvoice({
            invoiceNumber: documentNumber,
            date: docDate,
            dueDate: dueDate,
            customerId: selectedParty.id,
            customerName: selectedParty.name,
            costCenter: costCenter,
            paymentTerms: paymentTerms,
            items: itemsPayload,
          });
          createdDocNumber = inv.invoiceNumber;

          // If immediate payment
          if (isMarkAsPaid && paidAmount > 0) {
            erpFinanceStorage.postReceipt({
              partyId: selectedParty.id,
              partyName: selectedParty.name,
              amount: paidAmount,
              date: docDate,
              paymentMethod: (paymentType.includes('Cash')
                ? 'Cash'
                : paymentType.includes('UPI')
                ? 'UPI'
                : paymentType.includes('Cheque')
                ? 'Cheque'
                : 'Bank Transfer') as any,
              accountId: settlementAccountId || 'acc-1',
              accountName:
                bankAccounts.find((b) => b.id === settlementAccountId)?.accountName ||
                cashAccounts.find((c) => c.id === settlementAccountId)?.accountName ||
                'Primary Operating A/c',
              referenceNumber: settlementRef || `REC-${inv.invoiceNumber}`,
              allocations: [{ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, amount: paidAmount }],
              isAdvance: false,
            });
          }
        } else if (docType === 'sales-order') {
          const so = erpFinanceStorage.saveSalesOrder({
            orderNumber: documentNumber,
            date: docDate,
            deliveryDate: dueDate || docDate,
            costCenter: 'General',
            customerId: selectedParty.id,
            customerName: selectedParty.name,
            items: itemsPayload,
            deliveryAddress: shippingAddress || 'Client Campus',
          });
          createdDocNumber = so.orderNumber;
        } else if (docType === 'sales-quotation') {
          const sq = erpFinanceStorage.saveSalesQuotation({
            quotationNumber: documentNumber,
            date: docDate,
            validUntil: dueDate,
            customerId: selectedParty.id,
            customerName: selectedParty.name,
            paymentTerms: paymentTerms,
            deliveryTerms: 'Door Delivery',
            items: itemsPayload,
            notes: notes,
          });
          createdDocNumber = sq.quotationNumber;
        } else if (docType === 'sales-return') {
          const srr = erpFinanceStorage.saveSalesReturnRequest({
            returnRequestNumber: documentNumber,
            date: docDate,
            customerId: selectedParty.id,
            customerName: selectedParty.name,
            originalInvoiceId: referenceNumber || 'inv-direct',
            originalInvoiceNumber: referenceNumber || 'INV-DIRECT',
            totalAmount: roundedGrandTotal,
            reason: 'Defective Goods',
            condition: 'Resaleable',
            items: itemsPayload,
            remarks: notes,
          });
          createdDocNumber = srr.returnRequestNumber;
        }
      } else {
        // Purchase Documents
        const purchaseItemsPayload: PurchaseItemLine[] = calculatedItems.map((item) => ({
          itemId: item.itemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount: item.discountPercent,
          taxPercent: item.taxPercent,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          total: item.total,
        }));

        if (docType === 'purchase-invoice') {
          const pi = erpFinanceStorage.postPurchaseInvoice({
            invoiceNumber: documentNumber,
            date: docDate,
            dueDate: dueDate,
            vendorId: selectedParty.id,
            vendorName: selectedParty.name,
            costCenter: costCenter,
            paymentTerms: paymentTerms,
            items: purchaseItemsPayload,
          });
          createdDocNumber = pi.invoiceNumber;

          // If immediate payment
          if (isMarkAsPaid && paidAmount > 0) {
            erpFinanceStorage.postPayment({
              partyId: selectedParty.id,
              partyName: selectedParty.name,
              amount: paidAmount,
              netPaid: paidAmount,
              date: docDate,
              paymentMethod: (paymentType.includes('Cash')
                ? 'Cash'
                : paymentType.includes('UPI')
                ? 'UPI'
                : paymentType.includes('Cheque')
                ? 'Cheque'
                : 'Bank Transfer') as any,
              accountId: settlementAccountId || 'acc-1',
              accountName:
                bankAccounts.find((b) => b.id === settlementAccountId)?.accountName ||
                cashAccounts.find((c) => c.id === settlementAccountId)?.accountName ||
                'Primary Operating A/c',
              referenceNumber: settlementRef || `PAY-${pi.invoiceNumber}`,
              allocations: [{ invoiceId: pi.id, invoiceNumber: pi.invoiceNumber, amount: paidAmount }],
              isAdvance: false,
            });
          }
        } else if (docType === 'purchase-order') {
          const po = erpFinanceStorage.savePurchaseOrder({
            poNumber: documentNumber,
            date: docDate,
            expectedDeliveryDate: dueDate,
            vendorId: selectedParty.id,
            vendorName: selectedParty.name,
            paymentTerms: paymentTerms,
            items: purchaseItemsPayload,
          });
          createdDocNumber = po.poNumber;
        } else if (docType === 'purchase-quotation') {
          const pq = erpFinanceStorage.savePurchaseQuotation({
            quotationNumber: documentNumber,
            date: docDate,
            validUntil: dueDate,
            vendorId: selectedParty.id,
            vendorName: selectedParty.name,
            paymentTerms: paymentTerms,
            items: purchaseItemsPayload,
            remarks: notes,
          });
          createdDocNumber = pq.quotationNumber;
        } else if (docType === 'purchase-return') {
          const prr = erpFinanceStorage.savePurchaseReturnRequest({
            returnRequestNumber: documentNumber,
            date: docDate,
            vendorId: selectedParty.id,
            vendorName: selectedParty.name,
            originalInvoiceId: referenceNumber || 'po-direct',
            originalInvoiceNumber: referenceNumber || 'PO-DIRECT',
            totalAmount: roundedGrandTotal,
            reason: 'Quality Issue',
            items: purchaseItemsPayload,
            remarks: notes,
          });
          createdDocNumber = prr.returnRequestNumber;
        }
      }

      // Success handling
      setSubmitSuccessMsg(
        `Document ${createdDocNumber} successfully created and posted to general ledger & ledgers!`
      );
      setIsSubmitting(false);

      if (options?.andPrint) {
        setIsPreviewModalOpen(true);
      }

      if (onSuccess) {
        onSuccess(createdDocNumber, docType);
      }

      if (options?.andCreateNew) {
        // Reset form for next entry
        setDocumentNumber(generateDocNumber(docType));
        setIsDocNumberCustom(false);
        setReferenceNumber('');
        setIsMarkAsPaid(false);
        setPaidAmount(0);
        setTimeout(() => setSubmitSuccessMsg(null), 4000);
      } else if (!options?.andPrint) {
        // Back to list after brief success
        setTimeout(() => {
          if (onBack) onBack();
          if (onClose) onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Error posting document:', err);
      setErrorMessage(err.message || 'Failed to save document. Please check credit limits or form fields.');
      setIsSubmitting(false);
    }
  };

  // State display string for place of supply
  const placeOfSupplyName = useMemo(() => {
    const found = GST_STATE_CODES.find((s) => s.code === placeOfSupplyCode);
    return found ? `${found.code} - ${found.name}` : `${placeOfSupplyCode} - Other State`;
  }, [placeOfSupplyCode]);

  return (
    <div className={`bg-slate-50 min-h-screen text-slate-800 pb-24 ${isModal ? 'p-0' : 'p-3 md:p-6'}`}>
      {/* Top Banner / Breadcrumb & Actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                type="button"
                className="p-2 rounded-xl border border-gray-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B5D2A] border border-emerald-200 uppercase tracking-wide">
                  New Transaction
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Standard Voucher Entry Page</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {partyType === 'Customer' ? 'Create Sales Voucher' : 'Create Purchase Voucher'}
              </h1>
            </div>
          </div>

          {/* Customer vs Supplier Segmented Control */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-gray-200 shadow-inner">
              <button
                type="button"
                onClick={() => handlePartyTypeChange('Customer')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  partyType === 'Customer'
                    ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200/80 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#168A45]" />
                <span>Customer (Sales)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePartyTypeChange('Supplier')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  partyType === 'Supplier'
                    ? 'bg-white text-blue-700 shadow-xs border border-gray-200/80 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Supplier (Purchase)</span>
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                type="button"
                className="p-2 rounded-xl border border-gray-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Document Type Selector Sub-bar */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 mr-1 whitespace-nowrap">Document Type:</span>

            {partyType === 'Customer' ? (
              <>
                <button
                  type="button"
                  onClick={() => setDocType('sales-invoice')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    docType === 'sales-invoice'
                      ? 'bg-[#0B5D2A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tax Invoice (INV)
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('sales-order')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    docType === 'sales-order'
                      ? 'bg-[#0B5D2A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Sales Order (SO)
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('sales-quotation')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    docType === 'sales-quotation'
                      ? 'bg-[#0B5D2A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Sales Quotation (SQ)
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('sales-return')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    docType === 'sales-return'
                      ? 'bg-[#0B5D2A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Credit Note / Return (CN)
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setDocType('purchase-invoice')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    docType === 'purchase-invoice'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Purchase Bill / Invoice (PI)
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('purchase-order')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    docType === 'purchase-order'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Purchase Order (PO)
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('purchase-quotation')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    docType === 'purchase-quotation'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Purchase Quotation (PQ)
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('purchase-return')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    docType === 'purchase-return'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Debit Note / Return (DN)
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium">Series:</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-800 border border-slate-200">
              FY 2026-27
            </span>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {submitSuccessMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{submitSuccessMsg}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-3 animate-in shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-xs font-bold text-rose-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 3-Box Header Section (Bill To, Ship To, Document & Payment Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Box 1: Bill To (Customer or Supplier Party) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    partyType === 'Customer' ? 'bg-emerald-100 text-[#0B5D2A]' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Bill To ({partyType === 'Customer' ? 'Customer' : 'Supplier'})
                  </h3>
                  <p className="text-[11px] text-slate-500">Select party ledger account</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewPartyModalOpen(true)}
                className="text-xs font-bold text-[#0B5D2A] hover:text-[#08461F] flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Party</span>
              </button>
            </div>

            {/* Searchable Party Picker */}
            <div className="relative mb-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select {partyType === 'Customer' ? 'Customer' : 'Supplier'}:
              </label>
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0B5D2A] transition-all cursor-pointer"
              >
                {availableParties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.gstin ? `(${p.gstin})` : ''} - Bal: {formatINR(p.currentBalance || 0)}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Party Summary Card */}
            {selectedParty && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-200/80 space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-snug">{selectedParty.name}</h4>
                    <p className="text-slate-500 text-[11px]">
                      {selectedParty.contactPerson ? `Contact: ${selectedParty.contactPerson}` : selectedParty.code}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-gray-200">
                    {selectedParty.category || 'General'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">GSTIN / Tax ID:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedParty.gstin || 'Unregistered'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone:</span>
                    <span className="text-slate-700 font-medium">{selectedParty.phone || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Billing Address:</span>
                  <p className="text-slate-600 line-clamp-2 mt-0.5">{billingAddress}</p>
                </div>

                {/* Balance & Credit Limit Status */}
                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Current Balance:</span>
                    <span
                      className={`font-bold font-mono ${
                        selectedParty.currentBalance > 0
                          ? 'text-emerald-700'
                          : selectedParty.currentBalance < 0
                          ? 'text-rose-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {formatINR(selectedParty.currentBalance || 0)}
                    </span>
                  </div>
                  {partyType === 'Customer' && selectedParty.creditLimit ? (
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Credit Limit:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {formatINR(selectedParty.creditLimit)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 text-right">
            <button
              type="button"
              onClick={() => {
                const other = availableParties.find((p) => p.id !== selectedPartyId);
                if (other) setSelectedPartyId(other.id);
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer underline"
            >
              [Change Party]
            </button>
          </div>
        </div>

        {/* Box 2: Ship To & Place of Supply */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Ship To / Delivery Destination</h3>
                  <p className="text-[11px] text-slate-500">Shipping destination & Place of supply</p>
                </div>
              </div>

              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="rounded text-[#0B5D2A] focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Same as Bill To</span>
              </label>
            </div>

            {/* Place of Supply selector */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Place of Supply (GST Jurisdiction):
              </label>
              <select
                value={placeOfSupplyCode}
                onChange={(e) => setPlaceOfSupplyCode(e.target.value)}
                className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0B5D2A] transition-all cursor-pointer"
              >
                {GST_STATE_CODES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.code} - {state.name} {state.code === '32' ? '(Intra-State: CGST + SGST)' : '(Inter-State: IGST)'}
                  </option>
                ))}
              </select>
              <p className="text-[10px] mt-1 text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                {isIntraState ? (
                  <span className="text-emerald-700 font-bold">
                    Intra-State transaction: CGST & SGST will apply equally.
                  </span>
                ) : (
                  <span className="text-indigo-700 font-bold">
                    Inter-State transaction: IGST will apply full rate.
                  </span>
                )}
              </p>
            </div>

            {/* Shipping Address Textarea */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Shipping / Delivery Address:</label>
              <textarea
                rows={2}
                disabled={sameAsBilling}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter destination delivery address..."
                className={`w-full rounded-xl px-3 py-2 text-xs border border-gray-300 transition-all ${
                  sameAsBilling ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0B5D2A]'
                }`}
              />
            </div>

            {/* Transport & Dispatch Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Reference / PO No:</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. PO-84920"
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Ref Date:</label>
                <input
                  type="date"
                  value={referenceDate}
                  onChange={(e) => setReferenceDate(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Destination: {placeOfSupplyName}</span>
            <span className="font-semibold text-slate-700">Dispatch: By Road / Courier</span>
          </div>
        </div>

        {/* Box 3: Document Number, Dates & Payment Type */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Document & Payment Details</h3>
                  <p className="text-[11px] text-slate-500">Voucher number, terms & due dates</p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 font-mono uppercase">
                {docType.replace('sales-', 'SO:').replace('purchase-', 'PO:')}
              </span>
            </div>

            {/* Document Number with toggle to customize */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Document Number:</label>
                <button
                  type="button"
                  onClick={() => setIsDocNumberCustom(!isDocNumberCustom)}
                  className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  {isDocNumberCustom ? 'Auto Sequence' : 'Custom Number'}
                </button>
              </div>
              <input
                type="text"
                readOnly={!isDocNumberCustom}
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-sm font-mono font-bold tracking-wide border transition-all ${
                  isDocNumberCustom
                    ? 'bg-amber-50/50 border-amber-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500'
                    : 'bg-slate-100 border-gray-200 text-slate-800'
                }`}
              />
            </div>

            {/* Document Date & Due Date */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Date:</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => {
                    setDocDate(e.target.value);
                    // re-trigger payment terms calculation
                    handlePaymentTermsChange(paymentTerms);
                  }}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0B5D2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Due Date:</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0B5D2A]"
                />
              </div>
            </div>

            {/* Payment Terms & Payment Type */}
            <div className="grid grid-cols-2 gap-2.5 mb-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms:</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => handlePaymentTermsChange(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0B5D2A] cursor-pointer"
                >
                  <option value="Immediate">Due on Receipt (0 days)</option>
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days (Standard)</option>
                  <option value="Net 45">Net 45 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="Net 90">Net 90 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Type:</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0B5D2A] cursor-pointer"
                >
                  <option value="Credit / On Account">Credit / On Account</option>
                  <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI / QR">UPI / QR</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Cost Center:</span>
            <select
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 border-none p-0 text-[11px] focus:ring-0 cursor-pointer"
            >
              <option value="CC-OPERATIONS">CC-OPERATIONS</option>
              <option value="CC-REV-EDUTECH">CC-REV-EDUTECH</option>
              <option value="CC-ADMIN">CC-ADMIN</option>
              <option value="CC-MARKETING">CC-MARKETING</option>
            </select>
          </div>
        </div>
      </div>

      {/* Line Items Table Section */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#0B5D2A] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Line Items & Services</h2>
              <p className="text-[11px] text-slate-500">Add products, quantities, tax slabs and discounts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick preset item button */}
            <button
              type="button"
              onClick={() => handleAddLineItem()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B5D2A] text-white text-xs font-bold hover:bg-[#08461F] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Row</span>
            </button>
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[220px]">Item Description & Code</th>
                <th className="py-3 px-2 w-24">HSN/SAC</th>
                <th className="py-3 px-2 w-20 text-right">Qty</th>
                <th className="py-3 px-2 w-20">Unit</th>
                <th className="py-3 px-2 w-28 text-right">Rate (₹)</th>
                <th className="py-3 px-2 w-20 text-right">Disc %</th>
                <th className="py-3 px-2 w-28 text-right">Taxable (₹)</th>
                <th className="py-3 px-2 w-24">GST %</th>
                <th className="py-3 px-2 w-28 text-right">Tax (₹)</th>
                <th className="py-3 px-3 w-32 text-right">Total (₹)</th>
                <th className="py-3 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {calculatedItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* # */}
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 text-[11px]">
                    {index + 1}
                  </td>

                  {/* Item Description & Code */}
                  <td className="py-2.5 px-3">
                    <div className="space-y-1">
                      <select
                        value={item.itemId}
                        onChange={(e) => handleUpdateLineItem(index, 'itemId', e.target.value)}
                        className="w-full bg-slate-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        {itemsMaster.map((im) => (
                          <option key={im.id} value={im.id}>
                            [{im.code}] {im.name} - Stock: {im.currentStock} {im.baseUnit || 'NOS'}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={item.customDescription || ''}
                        onChange={(e) => handleUpdateLineItem(index, 'customDescription', e.target.value)}
                        placeholder="Add specs, serial no, or warranty notes..."
                        className="w-full bg-transparent border-0 border-b border-transparent focus:border-slate-300 px-1 py-0.5 text-[11px] text-slate-500 placeholder-slate-400 focus:ring-0"
                      />
                    </div>
                  </td>

                  {/* HSN/SAC */}
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={(e) => handleUpdateLineItem(index, 'hsnCode', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </td>

                  {/* Qty */}
                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateLineItem(index, 'quantity', Math.max(0.01, parseFloat(e.target.value) || 0))
                      }
                      className="w-full bg-slate-50 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-bold text-right text-slate-800"
                    />
                  </td>

                  {/* Unit */}
                  <td className="py-2.5 px-2">
                    <select
                      value={item.unit}
                      onChange={(e) => handleUpdateLineItem(index, 'unit', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-300 rounded-lg px-1.5 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      <option value="NOS">NOS</option>
                      <option value="PCS">PCS</option>
                      <option value="BOX">BOX</option>
                      <option value="KG">KG</option>
                      <option value="MTR">MTR</option>
                      <option value="SET">SET</option>
                      <option value="PKT">PKT</option>
                      <option value="HRS">HRS</option>
                    </select>
                  </td>

                  {/* Rate */}
                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.rate}
                      onChange={(e) =>
                        handleUpdateLineItem(index, 'rate', Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="w-full bg-slate-50 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-right text-slate-800"
                    />
                  </td>

                  {/* Discount % */}
                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onChange={(e) =>
                        handleUpdateLineItem(index, 'discountPercent', Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="w-full bg-slate-50 border border-gray-300 rounded-lg px-1.5 py-1.5 text-xs font-mono text-right text-slate-800"
                    />
                  </td>

                  {/* Taxable Amount */}
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">
                    {formatINR(item.taxable)}
                  </td>

                  {/* GST % */}
                  <td className="py-2.5 px-2">
                    <select
                      value={item.taxPercent}
                      onChange={(e) => handleUpdateLineItem(index, 'taxPercent', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-gray-300 rounded-lg px-1 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      <option value="0">0% (Nil)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                      <option value="28">28% GST</option>
                    </select>
                  </td>

                  {/* Tax Amount */}
                  <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                    <div>{formatINR(item.taxTotal)}</div>
                    <span className="text-[10px] text-slate-400">
                      {isIntraState ? 'CGST+SGST' : 'IGST'}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-sm">
                    {formatINR(item.total)}
                  </td>

                  {/* Delete action */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row Bar */}
        <div className="p-3 border-t border-gray-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => handleAddLineItem()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-slate-700 font-bold hover:border-emerald-500 hover:text-[#0B5D2A] transition-colors cursor-pointer bg-white"
          >
            <Plus className="w-4 h-4 text-[#168A45]" />
            <span>+ Add Another Line Item</span>
          </button>

          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>Total Items: <b className="text-slate-800">{lineItems.length}</b></span>
            <span>Total Units: <b className="text-slate-800">{lineItems.reduce((acc, i) => acc + (i.quantity || 0), 0)}</b></span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Notes & Terms (Left) + Settlement & Financial Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Left Side: Notes, Terms, and Immediate Payment */}
        <div className="lg:col-span-7 space-y-5">
          {/* Immediate Payment Settlement Box */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#0B5D2A] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Payment Settlement</h3>
                  <p className="text-[11px] text-slate-500">Record immediate receipt or vendor payment</p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isMarkAsPaid}
                  onChange={(e) => setIsMarkAsPaid(e.target.checked)}
                  className="rounded text-[#0B5D2A] focus:ring-emerald-500 w-4 h-4"
                />
                <span>Mark as Paid Immediately</span>
              </label>
            </div>

            {isMarkAsPaid ? (
              <div className="space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Paid Amount (₹):</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-1.5 text-sm font-bold font-mono text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {partyType === 'Customer' ? 'Deposit To Account:' : 'Paid From Account:'}
                    </label>
                    <select
                      value={settlementAccountId}
                      onChange={(e) => setSettlementAccountId(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      <optgroup label="Bank Accounts">
                        {bankAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} - {b.accountNumber.slice(-4)} (Bal: {formatINR(b.currentBalance)})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Cash Accounts">
                        {cashAccounts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Bal: {formatINR(c.currentBalance)})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / UTR:</label>
                    <input
                      type="text"
                      value={settlementRef}
                      onChange={(e) => setSettlementRef(e.target.value)}
                      placeholder="e.g. UTR-9381726"
                      className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
                  <span>
                    Settlement Status: <b>{paidAmount >= roundedGrandTotal ? 'Fully Paid' : 'Partially Paid'}</b>
                  </span>
                  <span>
                    Balance Due:{' '}
                    <b className="font-mono">{formatINR(Math.max(0, roundedGrandTotal - paidAmount))}</b>
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Invoice will be saved with status <b>Pending / Unpaid</b> on account. You can record payments later
                from the Receivables / Payables ledger.
              </p>
            )}
          </div>

          {/* Customer / Supplier Notes & Remarks */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 mb-1">Party Notes & Remarks</h3>
            <p className="text-[11px] text-slate-500 mb-3">Visible on the printed document</p>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes to recipient..."
              className="w-full bg-slate-50 border border-gray-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0B5D2A]"
            />

            <div className="mt-3">
              <h4 className="text-xs font-bold text-slate-700 mb-1">Terms & Conditions</h4>
              <textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Terms & Conditions..."
                className="w-full bg-slate-50 border border-gray-300 rounded-xl p-3 text-xs text-slate-800 font-mono text-[11px] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0B5D2A]"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Financial Calculation Summary Box */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs sticky top-4">
            <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>Financial Summary</span>
              <span className="text-xs text-slate-500 font-medium">GST Calculation Engine</span>
            </h3>

            <div className="space-y-3 py-3 text-xs border-b border-gray-100">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal (Gross Items):</span>
                <span className="font-mono font-bold text-slate-800">{formatINR(subtotalGross)}</span>
              </div>

              {totalItemDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-medium">
                  <span>Item Discounts:</span>
                  <span className="font-mono font-bold">-{formatINR(totalItemDiscount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span>Net Taxable Amount:</span>
                <span className="font-mono font-black">{formatINR(subtotalTaxable)}</span>
              </div>

              {/* Extra Document Discount */}
              <div className="flex items-center justify-between gap-3 text-slate-600">
                <span className="whitespace-nowrap">Extra Overall Discount (%):</span>
                <div className="flex items-center gap-1 w-28">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={extraDiscountPercent}
                    onChange={(e) => setExtraDiscountPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono text-right"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              {/* Shipping / Other charges */}
              <div className="flex items-center justify-between gap-3 text-slate-600">
                <span className="whitespace-nowrap">Shipping & Freight Charges (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-28 bg-slate-50 border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono text-right"
                />
              </div>
            </div>

            {/* GST Breakdown */}
            <div className="py-3 border-b border-gray-100 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>GST Tax Breakdown:</span>
                <span className="text-[11px] font-mono text-slate-500">
                  {isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                </span>
              </div>

              {isIntraState ? (
                <>
                  <div className="flex items-center justify-between text-slate-600 pl-2">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono font-medium text-slate-800">{formatINR(totalCGST)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pl-2">
                    <span>State GST (SGST):</span>
                    <span className="font-mono font-medium text-slate-800">{formatINR(totalSGST)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-slate-600 pl-2">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono font-medium text-slate-800">{formatINR(totalIGST)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-700 font-semibold pl-2 pt-1 border-t border-dashed border-gray-200">
                <span>Total GST Amount:</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(totalTax)}</span>
              </div>
            </div>

            {/* Round off & Grand Total */}
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Round Off:</span>
                <span className="font-mono font-medium">{formatINR(roundOffAmount)}</span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Grand Total (Net Payable)
                </span>
                <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-emerald-400 mt-1">
                  {formatINR(roundedGrandTotal)}
                </div>
                <div className="text-[11px] text-slate-300 italic mt-2 leading-relaxed">
                  {numberToWordsINR(roundedGrandTotal)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3 px-4 md:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="font-mono font-bold text-slate-900 px-2 py-1 rounded bg-slate-100 border border-slate-200">
              {documentNumber}
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline truncate max-w-[200px] font-semibold text-slate-800">
              {selectedParty?.name || 'Party'}
            </span>
            <span>•</span>
            <span>
              Net: <b className="font-mono text-emerald-700 text-sm">{formatINR(roundedGrandTotal)}</b>
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveDocument({ andCreateNew: true })}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-bold text-[#0B5D2A] hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save & New</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveDocument()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0B5D2A] text-white text-xs font-black hover:bg-[#08461F] transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Post Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* New Party Modal Shortcut */}
      {isNewPartyModalOpen && (
        <PartyFormModal
          isOpen={isNewPartyModalOpen}
          onClose={() => setIsNewPartyModalOpen(false)}
          onSave={(newParty) => {
            setPartiesList(erpFinanceStorage.getParties());
            setSelectedPartyId(newParty.id);
            setIsNewPartyModalOpen(false);
          }}
          initialParty={null}
        />
      )}

      {/* Print / Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full p-4 md:p-6 max-h-[94vh] overflow-y-auto shadow-2xl relative border border-gray-200">
            {/* Modal Header */}
            <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0B5D2A] flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-slate-900">Document Print Preview</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-gray-200 capitalize">
                      Theme: {docThemeConfig.themeStyle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    My Billbook Theme Format for {partyType === 'Customer' ? 'Sales' : 'Purchase'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Quick Theme Switcher */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer border border-gray-200"
                  >
                    <Palette className="w-3.5 h-3.5 text-slate-600" />
                    <span className="capitalize">{docThemeConfig.themeStyle}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isThemePickerOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-30 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Theme Template
                        </span>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {(['classic', 'stylish', 'advanced', 'minimal', 'corporate', 'thermal'] as InvoiceThemeStyle[]).map(
                            (st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  const updated = { ...docThemeConfig, themeStyle: st };
                                  setDocThemeConfig(updated);
                                  invoiceThemeStorage.saveThemeForCategory(currentCategory, updated);
                                }}
                                className={`p-1.5 rounded-lg text-left capitalize transition-colors ${
                                  docThemeConfig.themeStyle === st
                                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                                    : 'hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Accent Palette
                        </span>
                        <div className="flex items-center gap-1.5">
                          {(['emerald', 'blue', 'purple', 'red', 'teal', 'slate', 'amber'] as InvoiceThemeColor[]).map(
                            (col) => {
                              const pal = THEME_COLOR_PALETTES[col];
                              return (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() => {
                                    const updated = { ...docThemeConfig, primaryColor: col };
                                    setDocThemeConfig(updated);
                                    invoiceThemeStorage.saveThemeForCategory(currentCategory, updated);
                                  }}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                                    docThemeConfig.primaryColor === col ? 'ring-2 ring-slate-800 scale-110' : ''
                                  }`}
                                  style={{ backgroundColor: pal.hex }}
                                  title={pal.name}
                                >
                                  {docThemeConfig.primaryColor === col && (
                                    <span className="text-white text-[10px]">✓</span>
                                  )}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B5D2A] text-white text-xs font-bold hover:bg-[#168A45] transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Themed Document Sheet */}
            {(() => {
              const previewData: ThemedDocumentData = {
                documentNumber,
                documentType:
                  docType === 'sales-invoice'
                    ? 'Tax Invoice'
                    : docType === 'sales-order'
                    ? 'Sales Order'
                    : docType === 'sales-quotation'
                    ? 'Sales Quotation'
                    : docType === 'purchase-invoice'
                    ? 'Purchase Bill'
                    : docType === 'purchase-order'
                    ? 'Purchase Order'
                    : 'Official Document',
                date: docDate,
                dueDate: dueDate,
                referenceNumber: referenceNumber,
                paymentMethod: paymentTerms,
                partyName: selectedParty?.name || 'Party Name',
                partyGstin: selectedParty?.gstin,
                partyAddress: billingAddress || selectedParty?.address,
                partyState: placeOfSupplyName,
                partyPhone: selectedParty?.phone,
                items: calculatedItems.map((item) => ({
                  id: item.id,
                  name: item.itemName,
                  description: item.customDescription,
                  hsn: item.hsnCode,
                  quantity: item.quantity,
                  unit: item.unit,
                  rate: item.rate,
                  taxable: item.taxable,
                  taxPercent: item.taxPercent,
                  taxTotal: item.taxTotal,
                  total: item.total,
                })),
                subtotal: subtotalTaxable,
                cgst: totalCGST,
                sgst: totalSGST,
                igst: totalIGST,
                otherCharges: otherCharges,
                discount: totalItemDiscount + extraDiscountVal,
                grandTotal: roundedGrandTotal,
              };

              return (
                <div className="bg-white p-2 rounded-xl shadow-xs">
                  <ThemedDocumentRenderer
                    category={currentCategory}
                    themeConfig={docThemeConfig}
                    data={previewData}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
