export type AssetStatus =
  | 'Active'
  | 'Deployed'
  | 'In Maintenance'
  | 'Retired'
  | 'Available'
  | 'Allocated'
  | 'Checked Out'
  | 'Under Maintenance'
  | 'Damaged'
  | 'Lost'
  | 'Returned'
  | 'Disposed'
  | 'Pending Allocation';

export type AssetCondition = 'New' | 'Excellent' | 'Good' | 'Fair' | 'Damaged' | 'Critical';

export type MovementDirection = 'IN' | 'OUT';

export type MovementType =
  // IN types
  | 'Purchase Received'
  | 'Returned by Employee'
  | 'Returned from Maintenance'
  | 'Returned from Branch'
  | 'Returned from External Location'
  | 'Stock Received'
  | 'Transfer In'
  | 'Check-In'
  // OUT types
  | 'Allocated to Employee'
  | 'Checked Out'
  | 'Sent for Maintenance'
  | 'Sent to Branch'
  | 'Sent to External Location'
  | 'Transfer Out'
  | 'Returned to Vendor'
  | 'Disposed'
  | 'Sold';

export interface AssetPurchaseInfo {
  vendorId?: string;
  vendorName: string;
  poNumber?: string;
  poId?: string;
  invoiceNumber?: string;
  purchaseDate: string;
  purchaseCost: number;
  tax?: number;
  totalCost?: number;
  currentBookValue: number;
  depreciationRate?: number; // annual %
}

export interface AssetWarranty {
  provider: string;
  warrantyNumber: string;
  startDate: string;
  endDate: string;
  documentUrl?: string;
  status: 'Active' | 'Expiring Soon' | 'Expired';
}

export interface AssetLocationInfo {
  branch: string;
  building: string;
  floor: string;
  department: string;
  room: string;
  storageLocation?: string;
}

export interface AssetCurrentAssignment {
  employeeId: string;
  employeeName: string;
  department: string;
  allocationDate: string;
  expectedReturnDate?: string;
  conditionAtAllocation: AssetCondition;
  accessories: string[];
  handoverDocument?: string;
  employeeAcknowledgement?: boolean;
  remarks?: string;
}

export interface AssetTemporaryCheckOut {
  person: string;
  employeeId?: string;
  department?: string;
  destination: string;
  checkOutDate: string;
  checkOutTime: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  purpose: string;
  condition: AssetCondition;
  accessories: string[];
  approvedBy: string;
  remarks?: string;
  isOutsideOffice: boolean;
}

export interface AssetDocument {
  id: string;
  title: string;
  type: 'Invoice' | 'PO' | 'Warranty Certificate' | 'Manual' | 'Handover Form' | 'Inspection Sheet' | 'Photo' | 'Other';
  fileUrl: string;
  uploadDate: string;
  uploadedBy: string;
  size?: string;
}

export interface Asset {
  id: string; // e.g. "LAP-00025" or "AST-2026-0001"
  name: string;
  category: string;
  subCategory?: string;
  brand: string;
  model: string;
  serialNumber: string;
  description?: string;
  purchaseInfo: AssetPurchaseInfo;
  warranty: AssetWarranty;
  location: AssetLocationInfo;
  currentAssignment?: AssetCurrentAssignment;
  temporaryCheckOut?: AssetTemporaryCheckOut;
  status: AssetStatus;
  condition: AssetCondition;
  accessories: string[]; // standard accessories
  qrCodeHash: string;
  documents?: AssetDocument[];
  photos?: string[];
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedDate: string;
}

export interface AssetMovement {
  id: string; // e.g. "MOV-2026-001"
  assetId: string;
  assetName: string;
  movementType: MovementType;
  direction: MovementDirection;
  fromEmployee?: string;
  fromEmployeeId?: string;
  toEmployee?: string;
  toEmployeeId?: string;
  fromLocation?: string;
  toLocation?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  condition: AssetCondition;
  accessoriesIssued?: string[];
  accessoriesReturned?: string[];
  missingAccessories?: string[];
  reason: string;
  referenceNumber: string; // e.g. PO-001, ALC-002, RTN-003
  approvedBy?: string;
  createdBy: string;
  status: 'Completed' | 'Reversed' | 'Pending';
  reversalReason?: string;
  reversedBy?: string;
  reversedAt?: string;
  notes?: string;
}

export interface AssetPurchaseOrderItem {
  id: string;
  category: string;
  name: string;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  lineTotal?: number;
}

export interface AssetPurchaseOrder {
  id: string; // e.g. "PO-2026-0045"
  poNumber: string;
  poDate: string;
  vendorId: string;
  vendorName: string;
  requestedBy: string;
  department: string;
  expectedDeliveryDate: string;
  deliveryLocation: string;
  paymentTerms: string;
  notes?: string;
  items: AssetPurchaseOrderItem[];
  status:
    | 'Draft'
    | 'Pending Approval'
    | 'Approved'
    | 'Ordered'
    | 'Partially Received'
    | 'Fully Received'
    | 'Cancelled'
    | 'Closed';
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AssetPurchaseRecord {
  id: string;
  poNumber?: string;
  poId?: string;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  purchaseDate: string;
  purchaseAmount: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  invoiceAttachment?: string;
  receivedStatus: 'Pending GRN' | 'Partially Received' | 'Fully Received';
  notes?: string;
  createdBy: string;
}

export interface AssetRequest {
  id: string; // e.g. "REQ-2026-001"
  employeeId: string;
  employeeName: string;
  department: string;
  category: string;
  assetTypeRequested: string;
  quantity: number;
  reason: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Fulfilled' | 'Cancelled';
  requestedDate: string;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  allocatedAssetId?: string;
}

export interface AssetMaintenanceRecord {
  id: string; // e.g. "MNT-2026-001"
  assetId: string;
  assetName: string;
  maintenanceType: 'Preventive' | 'Corrective' | 'Upgradation' | 'Inspection' | 'Warranty Claim';
  issue: string;
  serviceProvider: string;
  serviceDate: string;
  cost: number;
  partsReplaced?: string;
  description: string;
  nextServiceDate?: string;
  warrantyClaim: boolean;
  invoiceNumber?: string;
  status:
    | 'Requested'
    | 'Approved'
    | 'Sent for Maintenance'
    | 'Under Maintenance'
    | 'Received'
    | 'Completed'
    | 'Cancelled';
  completedDate?: string;
  verifiedBy?: string;
  remarks?: string;
  createdBy: string;
}

export interface AssetRetirementRecord {
  id: string; // e.g. "RET-2026-001"
  assetId: string;
  assetName: string;
  retirementDate: string;
  reason: 'End of Life' | 'Damaged Beyond Repair' | 'Obsolete' | 'Lost' | 'Sold' | 'Scrapped' | 'Other';
  currentValue: number;
  disposalValue: number;
  disposalMethod: 'E-Waste Recycling' | 'Scrap Auction' | 'Donation' | 'Employee Sale' | 'Write-Off' | 'Returned to Lessor';
  approvedBy: string;
  status: 'Retirement Requested' | 'Approved' | 'Retired' | 'Disposed';
  supportingDocuments?: string[];
  remarks?: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  usefulLifeYears: number;
  depreciationMethod: 'Straight Line' | 'Written Down Value' | 'Double Declining';
  defaultDepreciationRate: number; // annual %
  depreciationRate?: number;
  isActive: boolean;
}

export interface AssetLocation {
  id: string;
  branch: string;
  building: string;
  floor: string;
  department: string;
  room: string;
  storageLocation: string;
  isOffice: boolean;
}

export interface AssetVendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  name?: string; // alias for vendorName
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  productCategories: string[];
  paymentTerms: string;
  status: 'Active' | 'Inactive';
}

// Aliases and additional module types
export type PurchaseOrder = AssetPurchaseOrder;
export type AssetPurchase = AssetPurchaseRecord;
export type AssetMaintenance = AssetMaintenanceRecord;
export type AssetRetirement = AssetRetirementRecord;

export interface AssetSettingsConfig {
  autoGenerateId: boolean;
  idPrefix: string;
  qrPrefix: string;
  enableAuditTrail: boolean;
  defaultWarrantyMonths: number;
  maintenanceReminderDays: number;
  approvalRequiredForAllocation: boolean;
  enableDepreciationCalculation: boolean;
  allowTemporaryCheckOutOutsideOffice: boolean;
}

export interface AssetMetrics {
  totalAssets: number;
  activeAssets: number;
  availableAssets: number;
  allocatedAssets: number;
  checkedOutAssets: number;
  underMaintenanceAssets: number;
  damagedAssets: number;
  lostAssets: number;
  retiredAssets: number;
  disposedAssets: number;
  totalPurchaseValue: number;
  totalPurchaseCost: number;
  currentBookValue: number;
  totalBookValue: number;
  totalDepreciation: number;
  thisMonthPurchaseValue: number;
  fyPurchaseValue: number;
  pendingAssetRequests: number;
  pendingPurchaseOrders: number;
  pendingAllocations: number;
  warrantyExpiringSoon: number;
  expiredWarrantyCount: number;
  overdueReturns: number;
  assetsOutsideOffice: number;
  maintenanceDueCount: number;
  // convenience aliases
  inMaintenanceCount?: number;
  maintenanceAssets: number;
  checkedOutCount?: number;
  retiredCount?: number;
}
