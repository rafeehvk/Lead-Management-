import {
  Asset,
  AssetMovement,
  AssetPurchaseOrder,
  AssetPurchaseRecord,
  AssetRequest,
  AssetMaintenanceRecord,
  AssetRetirementRecord,
  AssetCategory,
  AssetLocation,
  AssetVendor,
  AssetStatus,
  AssetCondition,
  MovementType,
  AssetSettingsConfig,
  AssetMetrics,
} from '../types/asset';

const STORAGE_KEYS = {
  ASSETS: 'mysar_assets_list_v1',
  MOVEMENTS: 'mysar_asset_movements_v1',
  PURCHASE_ORDERS: 'mysar_asset_pos_v1',
  PURCHASES: 'mysar_asset_purchases_v1',
  REQUESTS: 'mysar_asset_requests_v1',
  MAINTENANCE: 'mysar_asset_maintenance_v1',
  RETIREMENTS: 'mysar_asset_retirements_v1',
  CATEGORIES: 'mysar_asset_categories_v1',
  LOCATIONS: 'mysar_asset_locations_v1',
  VENDORS: 'mysar_asset_vendors_v1',
  SETTINGS: 'mysar_asset_settings_v1',
};

const INITIAL_SETTINGS: AssetSettingsConfig = {
  autoGenerateId: true,
  idPrefix: 'AST',
  qrPrefix: 'SAR-ASSET',
  enableAuditTrail: true,
  defaultWarrantyMonths: 12,
  maintenanceReminderDays: 7,
  approvalRequiredForAllocation: true,
  enableDepreciationCalculation: true,
  allowTemporaryCheckOutOutsideOffice: true,
};

// Seed Categories
const INITIAL_CATEGORIES: AssetCategory[] = [
  { id: 'CAT-01', name: 'Laptop', code: 'LAP', description: 'Portable workstations & ultrabooks', usefulLifeYears: 4, depreciationMethod: 'Straight Line', defaultDepreciationRate: 25, isActive: true },
  { id: 'CAT-02', name: 'Desktop', code: 'DSK', description: 'Office desktop computers & towers', usefulLifeYears: 5, depreciationMethod: 'Straight Line', defaultDepreciationRate: 20, isActive: true },
  { id: 'CAT-03', name: 'Monitor', code: 'MON', description: 'External display units & 4K screens', usefulLifeYears: 5, depreciationMethod: 'Straight Line', defaultDepreciationRate: 20, isActive: true },
  { id: 'CAT-04', name: 'Printer', code: 'PRN', description: 'Laser & multifunction networked printers', usefulLifeYears: 5, depreciationMethod: 'Straight Line', defaultDepreciationRate: 20, isActive: true },
  { id: 'CAT-05', name: 'Mobile', code: 'MOB', description: 'Company smartphones for field operations', usefulLifeYears: 3, depreciationMethod: 'Straight Line', defaultDepreciationRate: 33.3, isActive: true },
  { id: 'CAT-06', name: 'Tablet', code: 'TAB', description: 'Tablets for admissions & campus verification', usefulLifeYears: 3, depreciationMethod: 'Straight Line', defaultDepreciationRate: 33.3, isActive: true },
  { id: 'CAT-07', name: 'Server', code: 'SRV', description: 'Rackmount servers & datacenter hardware', usefulLifeYears: 6, depreciationMethod: 'Written Down Value', defaultDepreciationRate: 25, isActive: true },
  { id: 'CAT-08', name: 'Networking Equipment', code: 'NET', description: 'Cisco routers, switches, and enterprise APs', usefulLifeYears: 5, depreciationMethod: 'Straight Line', defaultDepreciationRate: 20, isActive: true },
  { id: 'CAT-09', name: 'Vehicle', code: 'VEH', description: 'Campus transport vans & official executive cars', usefulLifeYears: 8, depreciationMethod: 'Straight Line', defaultDepreciationRate: 15, isActive: true },
  { id: 'CAT-10', name: 'Furniture', code: 'FUR', description: 'Executive desks, ergonomic chairs, board tables', usefulLifeYears: 10, depreciationMethod: 'Straight Line', defaultDepreciationRate: 10, isActive: true },
  { id: 'CAT-11', name: 'Machinery', code: 'MAC', description: 'Campus power backup generators & AC plants', usefulLifeYears: 10, depreciationMethod: 'Straight Line', defaultDepreciationRate: 10, isActive: true },
  { id: 'CAT-12', name: 'Office Equipment', code: 'OFE', description: 'Smart projectors, interactive boards, bio scanners', usefulLifeYears: 5, depreciationMethod: 'Straight Line', defaultDepreciationRate: 20, isActive: true },
  { id: 'CAT-13', name: 'IT Accessories', code: 'ACC', description: 'Docking stations, webcams, noise-canceling headsets', usefulLifeYears: 2, depreciationMethod: 'Straight Line', defaultDepreciationRate: 50, isActive: true },
  { id: 'CAT-14', name: 'Other', code: 'OTH', description: 'General capital & operational tools', usefulLifeYears: 5, depreciationMethod: 'Straight Line', defaultDepreciationRate: 20, isActive: true },
];

// Seed Locations
const INITIAL_LOCATIONS: AssetLocation[] = [
  { id: 'LOC-01', branch: 'Kochi Campus', building: 'Tech Block A', floor: '3rd Floor', department: 'IT & Systems', room: 'Server Room 302', storageLocation: 'Rack A1', isOffice: true },
  { id: 'LOC-02', branch: 'Kochi Campus', building: 'Tech Block A', floor: '2nd Floor', department: 'Sales & Marketing', room: 'Executive Bay 201', storageLocation: 'Cabinet B', isOffice: true },
  { id: 'LOC-03', branch: 'Kochi Campus', building: 'Admin Block', floor: '1st Floor', department: 'Human Resources', room: 'HR Suite 105', storageLocation: 'Asset Locker 1', isOffice: true },
  { id: 'LOC-04', branch: 'Trivandrum Office', building: 'Valley Towers', floor: '5th Floor', department: 'Operations', room: 'Regional Office 510', storageLocation: 'Bay Desk 4', isOffice: true },
  { id: 'LOC-05', branch: 'Calicut Center', building: 'Central Plaza', floor: 'Ground Floor', department: 'Academic', room: 'Training Lab 1', storageLocation: 'Storage Unit 03', isOffice: true },
  { id: 'LOC-06', branch: 'Central Warehouse', building: 'Logistics Facility', floor: 'Ground Floor', department: 'Administration', room: 'Main Depot', storageLocation: 'Aisle 4 - Shelf C', isOffice: false },
];

// Seed Vendors
const INITIAL_VENDORS: AssetVendor[] = [
  { id: 'VND-01', vendorCode: 'VND-DELL', vendorName: 'Dell Technologies India Pvt Ltd', contactPerson: 'Arun Varma', phone: '+91 98450 11223', email: 'sales@dell-india-corporate.com', address: 'Inner Ring Road, Domlur, Bangalore - 560071', gstNumber: '29AAACD1234F1Z5', productCategories: ['Laptop', 'Desktop', 'Server', 'Monitor'], paymentTerms: 'Net 30 Days', status: 'Active' },
  { id: 'VND-02', vendorCode: 'VND-APPL', vendorName: 'Apple Enterprise Solutions (Unicorn Retail)', contactPerson: 'Siddharth Menon', phone: '+91 98451 44556', email: 'enterprise@unicornapple.com', address: 'MG Road, Kochi - 682016', gstNumber: '32AAACU5678K1Z2', productCategories: ['Laptop', 'Tablet', 'Mobile'], paymentTerms: '100% Advance', status: 'Active' },
  { id: 'VND-03', vendorCode: 'VND-CSCO', vendorName: 'Cisco Networking Systems Partner', contactPerson: 'Pooja Iyer', phone: '+91 98452 77889', email: 'pooja.i@cisconetworks.in', address: 'Cyberpark, Calicut - 673016', gstNumber: '32AABCC9012M1Z8', productCategories: ['Networking Equipment', 'Server'], paymentTerms: 'Net 45 Days', status: 'Active' },
  { id: 'VND-04', vendorCode: 'VND-EPSC', vendorName: 'Epson Business Imaging Hub', contactPerson: 'Ramanathan K.', phone: '+91 98453 99001', email: 'corporate@epson-hub.in', address: 'Technopark, Trivandrum - 695581', gstNumber: '32AADDE3456L1Z4', productCategories: ['Printer', 'Office Equipment'], paymentTerms: 'Net 15 Days', status: 'Active' },
  { id: 'VND-05', vendorCode: 'VND-FURN', vendorName: 'Featherlite Ergonomic Furniture', contactPerson: 'Reena Thomas', phone: '+91 98454 22334', email: 'sales@featherlite-kochi.com', address: 'NH Bypass, Edappally, Kochi - 682024', gstNumber: '32AABCF7890N1Z9', productCategories: ['Furniture'], paymentTerms: '50% Advance, 50% on Delivery', status: 'Active' },
];

// Seed Purchase Orders
const INITIAL_POS: AssetPurchaseOrder[] = [
  {
    id: 'PO-2026-0045',
    poNumber: 'PO-2026-0045',
    poDate: '2026-08-10',
    vendorId: 'VND-01',
    vendorName: 'Dell Technologies India Pvt Ltd',
    requestedBy: 'Anand Kumar',
    department: 'IT & Systems',
    expectedDeliveryDate: '2026-08-25',
    deliveryLocation: 'Kochi Campus - Tech Block A',
    paymentTerms: 'Net 30 Days',
    notes: 'Bulk refresh for senior engineering and ERP consultants.',
    items: [
      { id: 'POI-1', category: 'Laptop', name: 'Dell Latitude 5440 Core i7 16GB 512GB SSD', description: 'Enterprise 14-inch Business Laptop with vPro', quantity: 5, receivedQuantity: 5, unitPrice: 85000, discount: 5000, tax: 72000, total: 472000 },
      { id: 'POI-2', category: 'Monitor', name: 'Dell UltraSharp 27-inch 4K USB-C Hub Monitor (U2723QE)', description: 'Color accurate 4K IPS with RJ45 & USB-C hub', quantity: 3, receivedQuantity: 3, unitPrice: 38000, discount: 2000, tax: 20160, total: 132160 },
    ],
    status: 'Fully Received',
    totalAmount: 604160,
    createdBy: 'Anand Kumar',
    createdAt: '2026-08-10 10:00:00',
    approvedBy: 'Dr. Ramesh Narayan',
    approvedAt: '2026-08-11 14:30:00',
  },
  {
    id: 'PO-2026-0046',
    poNumber: 'PO-2026-0046',
    poDate: '2026-09-02',
    vendorId: 'VND-02',
    vendorName: 'Apple Enterprise Solutions (Unicorn Retail)',
    requestedBy: 'Priya Sharma',
    department: 'Sales & Marketing',
    expectedDeliveryDate: '2026-09-18',
    deliveryLocation: 'Kochi Campus - Admin Block',
    paymentTerms: '100% Advance',
    notes: 'MacBook Pro M3 units for mobile app team and field presentations.',
    items: [
      { id: 'POI-3', category: 'Laptop', name: 'MacBook Pro 14" M3 Pro 18GB 512GB', description: 'Space Black with 3-year AppleCare+ for Enterprise', quantity: 2, receivedQuantity: 2, unitPrice: 199900, discount: 10000, tax: 68364, total: 448164 },
    ],
    status: 'Fully Received',
    totalAmount: 448164,
    createdBy: 'Priya Sharma',
    createdAt: '2026-09-02 11:20:00',
    approvedBy: 'Director Office',
    approvedAt: '2026-09-03 09:15:00',
  },
  {
    id: 'PO-2026-0047',
    poNumber: 'PO-2026-0047',
    poDate: '2026-09-08',
    vendorId: 'VND-03',
    vendorName: 'Cisco Networking Systems Partner',
    requestedBy: 'Mohammed Suhail',
    department: 'IT & Systems',
    expectedDeliveryDate: '2026-09-24',
    deliveryLocation: 'Kochi Campus - Server Room 302',
    paymentTerms: 'Net 45 Days',
    notes: 'Core switch upgrade for multi-tenant high availability.',
    items: [
      { id: 'POI-4', category: 'Networking Equipment', name: 'Cisco Catalyst 9300 48-Port PoE+ Gigabit Switch', description: 'Network Essentials License with redundant power', quantity: 2, receivedQuantity: 0, unitPrice: 220000, discount: 20000, tax: 72000, total: 472000 },
    ],
    status: 'Pending Approval',
    totalAmount: 472000,
    createdBy: 'Mohammed Suhail',
    createdAt: '2026-09-08 16:45:00',
  },
];

// Seed Purchases
const INITIAL_PURCHASES: AssetPurchaseRecord[] = [
  {
    id: 'PUR-2026-001',
    poNumber: 'PO-2026-0045',
    poId: 'PO-2026-0045',
    vendorId: 'VND-01',
    vendorName: 'Dell Technologies India Pvt Ltd',
    invoiceNumber: 'INV-DELL-889921',
    invoiceDate: '2026-08-18',
    purchaseDate: '2026-08-18',
    purchaseAmount: 512000,
    tax: 92160,
    discount: 7000,
    totalAmount: 604160,
    paymentStatus: 'Paid',
    receivedStatus: 'Fully Received',
    notes: 'Delivered in sealed cartons with inspection pass stamps.',
    createdBy: 'Anand Kumar',
  },
  {
    id: 'PUR-2026-002',
    poNumber: 'PO-2026-0046',
    poId: 'PO-2026-0046',
    vendorId: 'VND-02',
    vendorName: 'Apple Enterprise Solutions (Unicorn Retail)',
    invoiceNumber: 'INV-UNI-55441',
    invoiceDate: '2026-09-04',
    purchaseDate: '2026-09-04',
    purchaseAmount: 379800,
    tax: 68364,
    discount: 10000,
    totalAmount: 448164,
    paymentStatus: 'Paid',
    receivedStatus: 'Fully Received',
    notes: 'Warranty registered under MYSAR corporate apple ID.',
    createdBy: 'Priya Sharma',
  },
];

// Seed Assets
const INITIAL_ASSETS: Asset[] = [
  {
    id: 'LAP-00025',
    name: 'Dell Latitude 5440 Core i7',
    category: 'Laptop',
    subCategory: 'Ultrabook',
    brand: 'Dell',
    model: 'Latitude 5440',
    serialNumber: 'DL-5440-98821B',
    description: '14" FHD IPS, Intel Core i7 13th Gen, 16GB DDR5, 512GB PCIe NVMe SSD, Backlit Keyboard, Fingerprint Reader',
    purchaseInfo: {
      vendorId: 'VND-01',
      vendorName: 'Dell Technologies India Pvt Ltd',
      poNumber: 'PO-2026-0045',
      poId: 'PO-2026-0045',
      invoiceNumber: 'INV-DELL-889921',
      purchaseDate: '2026-08-18',
      purchaseCost: 85000,
      tax: 15300,
      totalCost: 100300,
      currentBookValue: 82000,
      depreciationRate: 25,
    },
    warranty: {
      provider: 'Dell ProSupport Plus with Accidental Damage',
      warrantyNumber: 'W-DELL-5440-988',
      startDate: '2026-08-18',
      endDate: '2029-08-17',
      status: 'Active',
    },
    location: {
      branch: 'Kochi Campus',
      building: 'Tech Block A',
      floor: '2nd Floor',
      department: 'Sales & Marketing',
      room: 'Executive Bay 201',
      storageLocation: 'Desk 12',
    },
    currentAssignment: {
      employeeId: 'EMP-001',
      employeeName: 'Anand Kumar',
      department: 'Sales & Marketing',
      allocationDate: '2026-08-20',
      expectedReturnDate: '2027-08-20',
      conditionAtAllocation: 'New',
      accessories: ['65W Type-C Charger', 'Dell Pro Eco-Loop Backpack', 'Wireless Mouse WM126', 'HDMI Cable'],
      employeeAcknowledgement: true,
      remarks: 'Issued for ERP institutional product demonstrations and travel.',
    },
    status: 'Allocated',
    condition: 'Excellent',
    accessories: ['65W Type-C Charger', 'Dell Pro Eco-Loop Backpack', 'Wireless Mouse WM126', 'HDMI Cable'],
    qrCodeHash: 'MYSAR-ASSET-LAP-00025-QR',
    notes: 'Configured with BitLocker encryption and MDM enrollment.',
    createdBy: 'Anand Kumar',
    createdAt: '2026-08-18 14:00:00',
    updatedDate: '2026-08-20',
  },
  {
    id: 'LAP-00026',
    name: 'MacBook Pro 14" M3 Pro',
    category: 'Laptop',
    subCategory: 'Mobile Workstation',
    brand: 'Apple',
    model: 'MacBook Pro 14-inch (2024)',
    serialNumber: 'APP-MBP14-M3-9021',
    description: 'Liquid Retina XDR display, Apple M3 Pro 11-core CPU 14-core GPU, 18GB Unified Memory, 512GB SSD Storage',
    purchaseInfo: {
      vendorId: 'VND-02',
      vendorName: 'Apple Enterprise Solutions (Unicorn Retail)',
      poNumber: 'PO-2026-0046',
      poId: 'PO-2026-0046',
      invoiceNumber: 'INV-UNI-55441',
      purchaseDate: '2026-09-04',
      purchaseCost: 199900,
      tax: 35982,
      totalCost: 235882,
      currentBookValue: 198000,
      depreciationRate: 25,
    },
    warranty: {
      provider: 'AppleCare+ for Enterprise',
      warrantyNumber: 'AC-ENT-992100',
      startDate: '2026-09-04',
      endDate: '2027-09-03',
      status: 'Active',
    },
    location: {
      branch: 'Kochi Campus',
      building: 'Tech Block A',
      floor: '2nd Floor',
      department: 'Sales & Marketing',
      room: 'Executive Bay 201',
      storageLocation: 'Desk 14',
    },
    currentAssignment: {
      employeeId: 'EMP-002',
      employeeName: 'Priya Sharma',
      department: 'Sales & Marketing',
      allocationDate: '2026-09-06',
      expectedReturnDate: '2027-09-06',
      conditionAtAllocation: 'New',
      accessories: ['70W USB-C Power Adapter', 'USB-C to MagSafe 3 Cable (2m)', 'Magic Mouse (Space Black)', 'Timbuk2 Laptop Sleeve'],
      employeeAcknowledgement: true,
      remarks: 'Assigned for high-priority executive demos and marketing.',
    },
    status: 'Allocated',
    condition: 'New',
    accessories: ['70W USB-C Power Adapter', 'USB-C to MagSafe 3 Cable (2m)', 'Magic Mouse (Space Black)', 'Timbuk2 Laptop Sleeve'],
    qrCodeHash: 'MYSAR-ASSET-LAP-00026-QR',
    notes: 'FileVault enabled. Registered under Apple Business Manager.',
    createdBy: 'Anand Kumar',
    createdAt: '2026-09-04 16:00:00',
    updatedDate: '2026-09-06',
  },
  {
    id: 'MON-00010',
    name: 'Dell UltraSharp 27" 4K USB-C Monitor',
    category: 'Monitor',
    subCategory: 'Display',
    brand: 'Dell',
    model: 'U2723QE',
    serialNumber: 'DL-MON-U2723-551',
    description: '27-inch 4K IPS Black Technology, 98% DCI-P3, USB-C 90W power delivery hub, RJ45 ethernet port',
    purchaseInfo: {
      vendorId: 'VND-01',
      vendorName: 'Dell Technologies India Pvt Ltd',
      poNumber: 'PO-2026-0045',
      poId: 'PO-2026-0045',
      invoiceNumber: 'INV-DELL-889921',
      purchaseDate: '2026-08-18',
      purchaseCost: 38000,
      tax: 6840,
      totalCost: 44840,
      currentBookValue: 37000,
      depreciationRate: 20,
    },
    warranty: {
      provider: 'Dell Premium Panel Exchange 3-Year Warranty',
      warrantyNumber: 'W-DL-MON-551',
      startDate: '2026-08-18',
      endDate: '2029-08-17',
      status: 'Active',
    },
    location: {
      branch: 'Kochi Campus',
      building: 'Tech Block A',
      floor: '2nd Floor',
      department: 'Sales & Marketing',
      room: 'Executive Bay 201',
      storageLocation: 'Desk 12',
    },
    currentAssignment: {
      employeeId: 'EMP-001',
      employeeName: 'Anand Kumar',
      department: 'Sales & Marketing',
      allocationDate: '2026-08-20',
      conditionAtAllocation: 'New',
      accessories: ['Power Cable', 'USB-C to USB-C 1m Cable', 'DisplayPort Cable', 'Monitor Stand'],
      employeeAcknowledgement: true,
      remarks: 'Paired with Dell Latitude 5440.',
    },
    status: 'Allocated',
    condition: 'Excellent',
    accessories: ['Power Cable', 'USB-C to USB-C 1m Cable', 'DisplayPort Cable', 'Monitor Stand'],
    qrCodeHash: 'MYSAR-ASSET-MON-00010-QR',
    createdBy: 'Anand Kumar',
    createdAt: '2026-08-18 14:00:00',
    updatedDate: '2026-08-20',
  },
  {
    id: 'PRJ-00004',
    name: 'Epson EB-FH52 Full HD Wireless Projector',
    category: 'Office Equipment',
    subCategory: 'Projector',
    brand: 'Epson',
    model: 'EB-FH52',
    serialNumber: 'EP-PRJ-FH52-119',
    description: '4,000 lumens, Full HD 1080p, built-in Wi-Fi and Miracast for mobile presentation',
    purchaseInfo: {
      vendorId: 'VND-04',
      vendorName: 'Epson Business Imaging Hub',
      invoiceNumber: 'INV-EP-3321',
      purchaseDate: '2026-07-10',
      purchaseCost: 72000,
      tax: 12960,
      totalCost: 84960,
      currentBookValue: 68000,
      depreciationRate: 20,
    },
    warranty: {
      provider: 'Epson India On-Site 2-Year Warranty',
      warrantyNumber: 'EP-WAR-99011',
      startDate: '2026-07-10',
      endDate: '2028-07-09',
      status: 'Active',
    },
    location: {
      branch: 'Kochi Campus',
      building: 'Tech Block A',
      floor: '3rd Floor',
      department: 'Administration',
      room: 'Conference Hall A',
      storageLocation: 'Media Rack 1',
    },
    temporaryCheckOut: {
      person: 'Mohammed Suhail',
      employeeId: 'EMP-003',
      department: 'IT & Systems',
      destination: 'St. Mary Higher Secondary School - Client Hall',
      checkOutDate: '2026-09-10',
      checkOutTime: '09:00',
      expectedReturnDate: '2026-09-11', // Passed expected date -> Overdue Return!
      purpose: 'On-site ERP interactive presentation for board members.',
      condition: 'Good',
      accessories: ['Power Cable', 'HDMI 5m Cable', 'Remote Controller', 'Protective Padded Bag'],
      approvedBy: 'Anand Kumar',
      remarks: 'Client session extended by 1 day as per principal request.',
      isOutsideOffice: true,
    },
    status: 'Checked Out',
    condition: 'Good',
    accessories: ['Power Cable', 'HDMI 5m Cable', 'Remote Controller', 'Protective Padded Bag'],
    qrCodeHash: 'MYSAR-ASSET-PRJ-00004-QR',
    notes: 'High brightness unit dedicated for external demonstrations.',
    createdBy: 'Anand Kumar',
    createdAt: '2026-07-10 11:00:00',
    updatedDate: '2026-09-10',
  },
  {
    id: 'PRN-00008',
    name: 'HP LaserJet Enterprise MFP M528dn',
    category: 'Printer',
    subCategory: 'Network Printer',
    brand: 'HP',
    model: 'LaserJet MFP M528dn',
    serialNumber: 'HP-M528-77443A',
    description: 'Duplex printing, 45 ppm, secure PIN printing, 100-sheet automatic document feeder',
    purchaseInfo: {
      vendorId: 'VND-04',
      vendorName: 'Epson Business Imaging Hub',
      invoiceNumber: 'INV-EP-2098',
      purchaseDate: '2026-05-15',
      purchaseCost: 95000,
      tax: 17100,
      totalCost: 112100,
      currentBookValue: 88000,
      depreciationRate: 20,
    },
    warranty: {
      provider: 'HP Enterprise Care Pack 3-Year',
      warrantyNumber: 'HP-CP-55442',
      startDate: '2026-05-15',
      endDate: '2026-09-25', // Expiring in < 30 days!
      status: 'Expiring Soon',
    },
    location: {
      branch: 'Kochi Campus',
      building: 'Admin Block',
      floor: '1st Floor',
      department: 'Human Resources',
      room: 'HR Suite 105',
      storageLocation: 'Corner Printer Stand',
    },
    status: 'Available',
    condition: 'Excellent',
    accessories: ['Power Cord', 'High Yield Toner Cartridge 89X (installed)', 'USB Printer Cable', 'Network Patch Cord'],
    qrCodeHash: 'MYSAR-ASSET-PRN-00008-QR',
    notes: 'Configured on static IP 192.168.1.50 with LDAP user authentication.',
    createdBy: 'Anand Kumar',
    createdAt: '2026-05-15 10:00:00',
    updatedDate: '2026-05-15',
  },
  {
    id: 'SRV-00002',
    name: 'Dell PowerEdge R750xs Rack Server',
    category: 'Server',
    subCategory: 'Rackmount Server',
    brand: 'Dell',
    model: 'PowerEdge R750xs',
    serialNumber: 'DL-R750-887711',
    description: '2x Intel Xeon Silver 4314 (16C/32T), 128GB RDIMM, 4x 1.92TB Enterprise NVMe SSD in RAID 10, Dual 1100W Redundant PSU',
    purchaseInfo: {
      vendorId: 'VND-01',
      vendorName: 'Dell Technologies India Pvt Ltd',
      invoiceNumber: 'INV-DELL-77210',
      purchaseDate: '2025-11-20',
      purchaseCost: 480000,
      tax: 86400,
      totalCost: 566400,
      currentBookValue: 420000,
      depreciationRate: 25,
    },
    warranty: {
      provider: 'Dell ProSupport Mission Critical 4-Hour On-site',
      warrantyNumber: 'W-DL-SRV-887',
      startDate: '2025-11-20',
      endDate: '2028-11-19',
      status: 'Active',
    },
    location: {
      branch: 'Kochi Campus',
      building: 'Tech Block A',
      floor: '3rd Floor',
      department: 'IT & Systems',
      room: 'Server Room 302',
      storageLocation: 'Rack A1 - U22-U24',
    },
    status: 'Available',
    condition: 'Excellent',
    accessories: ['ReadyRails Sliding Rails', 'Cable Management Arm', '2x C13 to C14 Power Cords', 'Bezel with Key'],
    qrCodeHash: 'MYSAR-ASSET-SRV-00002-QR',
    notes: 'Hosts staging databases and local caching cluster.',
    createdBy: 'Anand Kumar',
    createdAt: '2025-11-20 12:00:00',
    updatedDate: '2025-11-20',
  },
  {
    id: 'MOB-00012',
    name: 'Samsung Galaxy A55 5G (Enterprise Edition)',
    category: 'Mobile',
    subCategory: 'Smartphone',
    brand: 'Samsung',
    model: 'Galaxy A55 5G',
    serialNumber: 'SM-A556-990022',
    description: '128GB Storage, 8GB RAM, Knox Security, Dual SIM, IP67 Water Resistant',
    purchaseInfo: {
      vendorId: 'VND-01',
      vendorName: 'Dell Technologies India Pvt Ltd',
      invoiceNumber: 'INV-MOB-4412',
      purchaseDate: '2026-06-01',
      purchaseCost: 32000,
      tax: 5760,
      totalCost: 37760,
      currentBookValue: 28000,
      depreciationRate: 33.3,
    },
    warranty: {
      provider: 'Samsung Knox Enterprise Care 2-Year',
      warrantyNumber: 'KNX-A55-9900',
      startDate: '2026-06-01',
      endDate: '2028-05-31',
      status: 'Active',
    },
    location: {
      branch: 'Kochi Campus',
      building: 'Tech Block A',
      floor: '3rd Floor',
      department: 'IT & Systems',
      room: 'IT Service Center',
      storageLocation: 'Bench 2',
    },
    status: 'Under Maintenance',
    condition: 'Damaged',
    accessories: ['25W Fast Charger', 'Type-C Cable', 'Spigen Rugged Armor Case'],
    qrCodeHash: 'MYSAR-ASSET-MOB-00012-QR',
    notes: 'Sent to Samsung Authorized Service Center for screen replacement following a field drop.',
    createdBy: 'Anand Kumar',
    createdAt: '2026-06-01 10:00:00',
    updatedDate: '2026-09-08',
  },
  {
    id: 'TAB-00007',
    name: 'Apple iPad 10th Gen 64GB Wi-Fi',
    category: 'Tablet',
    subCategory: 'Tablet',
    brand: 'Apple',
    model: 'iPad (10th Generation)',
    serialNumber: 'APP-IPD10-3321A',
    description: '10.9" Liquid Retina display, A14 Bionic chip, Silver, Touch ID',
    purchaseInfo: {
      vendorId: 'VND-02',
      vendorName: 'Apple Enterprise Solutions (Unicorn Retail)',
      invoiceNumber: 'INV-UNI-4410',
      purchaseDate: '2026-04-12',
      purchaseCost: 39900,
      tax: 7182,
      totalCost: 47082,
      currentBookValue: 33000,
      depreciationRate: 33.3,
    },
    warranty: {
      provider: 'Apple 1-Year Limited Warranty',
      warrantyNumber: 'APP-WAR-3321',
      startDate: '2026-04-12',
      endDate: '2027-04-11',
      status: 'Active',
    },
    location: {
      branch: 'Kochi Campus',
      building: 'Tech Block A',
      floor: '2nd Floor',
      department: 'Sales & Marketing',
      room: 'Executive Bay 201',
      storageLocation: 'Desk 12',
    },
    currentAssignment: {
      employeeId: 'EMP-001',
      employeeName: 'Anand Kumar',
      department: 'Sales & Marketing',
      allocationDate: '2026-04-15',
      conditionAtAllocation: 'New',
      accessories: ['20W USB-C Power Adapter', 'USB-C Charge Cable (1m)', 'Apple Smart Folio Case', 'Apple Pencil USB-C'],
      employeeAcknowledgement: true,
      remarks: 'Used for student batch registration walkthroughs.',
    },
    status: 'Allocated',
    condition: 'Excellent',
    accessories: ['20W USB-C Power Adapter', 'USB-C Charge Cable (1m)', 'Apple Smart Folio Case', 'Apple Pencil USB-C'],
    qrCodeHash: 'MYSAR-ASSET-TAB-00007-QR',
    createdBy: 'Anand Kumar',
    createdAt: '2026-04-12 11:00:00',
    updatedDate: '2026-04-15',
  },
  {
    id: 'LAP-00019',
    name: 'Lenovo ThinkPad E14 Gen 4',
    category: 'Laptop',
    subCategory: 'Business Notebook',
    brand: 'Lenovo',
    model: 'ThinkPad E14 Gen 4',
    serialNumber: 'LN-E14-44332B',
    description: 'AMD Ryzen 5 5625U, 16GB RAM, 512GB SSD, TrackPoint, MIL-STD-810H durability',
    purchaseInfo: {
      vendorId: 'VND-01',
      vendorName: 'Dell Technologies India Pvt Ltd',
      invoiceNumber: 'INV-LN-9921',
      purchaseDate: '2024-02-10',
      purchaseCost: 62000,
      tax: 11160,
      totalCost: 73160,
      currentBookValue: 12000,
      depreciationRate: 25,
    },
    warranty: {
      provider: 'Lenovo Premier Support 3-Year',
      warrantyNumber: 'LN-PS-44332',
      startDate: '2024-02-10',
      endDate: '2026-08-01', // Expired!
      status: 'Expired',
    },
    location: {
      branch: 'Central Warehouse',
      building: 'Logistics Facility',
      floor: 'Ground Floor',
      department: 'Administration',
      room: 'E-Waste Depot',
      storageLocation: 'Disposal Bin D2',
    },
    status: 'Retired',
    condition: 'Damaged',
    accessories: ['65W AC Adapter'],
    qrCodeHash: 'MYSAR-ASSET-LAP-00019-QR',
    notes: 'Motherboard failure after 2.5 years of active duty. Replaced by Dell Latitude 5440.',
    createdBy: 'Anand Kumar',
    createdAt: '2024-02-10 10:00:00',
    updatedDate: '2026-08-15',
  },
];

// Seed Movement Records (Historical Audit Trail)
const INITIAL_MOVEMENTS: AssetMovement[] = [
  {
    id: 'MOV-2026-0001',
    assetId: 'LAP-00025',
    assetName: 'Dell Latitude 5440 Core i7',
    movementType: 'Purchase Received',
    direction: 'IN',
    toLocation: 'Kochi Campus - Central Store',
    date: '2026-08-18',
    time: '11:30',
    condition: 'New',
    accessoriesIssued: ['65W Type-C Charger', 'Dell Pro Eco-Loop Backpack', 'Wireless Mouse WM126', 'HDMI Cable'],
    reason: 'Initial intake against Purchase Order PO-2026-0045 from Dell Technologies.',
    referenceNumber: 'PO-2026-0045',
    approvedBy: 'Dr. Ramesh Narayan',
    createdBy: 'Anand Kumar',
    status: 'Completed',
  },
  {
    id: 'MOV-2026-0002',
    assetId: 'LAP-00025',
    assetName: 'Dell Latitude 5440 Core i7',
    movementType: 'Allocated to Employee',
    direction: 'OUT',
    fromLocation: 'Kochi Campus - Central Store',
    toEmployee: 'Anand Kumar',
    toEmployeeId: 'EMP-001',
    toLocation: 'Kochi Campus - Executive Bay 201',
    date: '2026-08-20',
    time: '14:00',
    condition: 'New',
    accessoriesIssued: ['65W Type-C Charger', 'Dell Pro Eco-Loop Backpack', 'Wireless Mouse WM126', 'HDMI Cable'],
    reason: 'Official laptop allocation for institutional ERP sales operations.',
    referenceNumber: 'ALC-2026-001',
    approvedBy: 'HR Manager',
    createdBy: 'HR Manager',
    status: 'Completed',
  },
  {
    id: 'MOV-2026-0003',
    assetId: 'PRJ-00004',
    assetName: 'Epson EB-FH52 Full HD Wireless Projector',
    movementType: 'Checked Out',
    direction: 'OUT',
    fromLocation: 'Kochi Campus - Conference Hall A',
    toEmployee: 'Mohammed Suhail',
    toEmployeeId: 'EMP-003',
    toLocation: 'St. Mary Higher Secondary School - Client Hall',
    date: '2026-09-10',
    time: '09:00',
    condition: 'Good',
    accessoriesIssued: ['Power Cable', 'HDMI 5m Cable', 'Remote Controller', 'Protective Padded Bag'],
    reason: 'Client presentation and demo on school premises.',
    referenceNumber: 'CHK-2026-004',
    approvedBy: 'Anand Kumar',
    createdBy: 'Anand Kumar',
    status: 'Completed',
  },
  {
    id: 'MOV-2026-0004',
    assetId: 'MOB-00012',
    assetName: 'Samsung Galaxy A55 5G',
    movementType: 'Sent for Maintenance',
    direction: 'OUT',
    fromLocation: 'Kochi Campus - IT & Systems',
    toLocation: 'Samsung Authorized Service Center, MG Road',
    date: '2026-09-08',
    time: '15:30',
    condition: 'Damaged',
    accessoriesIssued: ['Spigen Rugged Armor Case'],
    reason: 'Accidental display glass crack during client field visit. Sent for warranty screen panel replacement.',
    referenceNumber: 'MNT-2026-001',
    approvedBy: 'Anand Kumar',
    createdBy: 'Mohammed Suhail',
    status: 'Completed',
  },
  {
    id: 'MOV-2026-0005',
    assetId: 'LAP-00019',
    assetName: 'Lenovo ThinkPad E14 Gen 4',
    movementType: 'Disposed',
    direction: 'OUT',
    fromLocation: 'Kochi Campus - Central Store',
    toLocation: 'Central Warehouse - E-Waste Depot',
    date: '2026-08-15',
    time: '16:00',
    condition: 'Damaged',
    reason: 'End-of-life retirement after motherboard burnout. Disposed via certified e-waste partner.',
    referenceNumber: 'RET-2026-001',
    approvedBy: 'Dr. Ramesh Narayan',
    createdBy: 'Anand Kumar',
    status: 'Completed',
  },
];

// Seed Asset Requests
const INITIAL_REQUESTS: AssetRequest[] = [
  {
    id: 'REQ-2026-001',
    employeeId: 'EMP-003',
    employeeName: 'Mohammed Suhail',
    department: 'IT & Systems',
    category: 'IT Accessories',
    assetTypeRequested: 'Noise-Canceling Wireless Headset with Mic',
    quantity: 1,
    reason: 'Required for daily client implementation calls and remote customer onboarding.',
    priority: 'Medium',
    status: 'Approved',
    requestedDate: '2026-09-08',
    approvedBy: 'Anand Kumar',
    approvedAt: '2026-09-09 11:00',
    remarks: 'Approved under Q3 IT accessories allocation.',
  },
  {
    id: 'REQ-2026-002',
    employeeId: 'EMP-002',
    employeeName: 'Priya Sharma',
    department: 'Sales & Marketing',
    category: 'Tablet',
    assetTypeRequested: 'Apple iPad Air with Apple Pencil',
    quantity: 1,
    reason: 'Digital proposal signing and on-site executive wireframe reviews.',
    priority: 'High',
    status: 'Pending Approval',
    requestedDate: '2026-09-11',
  },
];

// Seed Maintenance Records
const INITIAL_MAINTENANCE: AssetMaintenanceRecord[] = [
  {
    id: 'MNT-2026-001',
    assetId: 'MOB-00012',
    assetName: 'Samsung Galaxy A55 5G (Enterprise Edition)',
    maintenanceType: 'Corrective',
    issue: 'Cracked Front Display Panel',
    serviceProvider: 'Samsung Official Authorized Service Plaza',
    serviceDate: '2026-09-08',
    cost: 4500,
    partsReplaced: 'Original Super AMOLED Display Assembly & Water Seal Gasket',
    description: 'Accidental display fracture during field deployment. Being repaired under Knox Enterprise Accidental cover.',
    nextServiceDate: '2027-03-08',
    warrantyClaim: true,
    invoiceNumber: 'SM-REP-9081',
    status: 'Under Maintenance',
    createdBy: 'Mohammed Suhail',
  },
];

// Seed Retirement Records
const INITIAL_RETIREMENTS: AssetRetirementRecord[] = [
  {
    id: 'RET-2026-001',
    assetId: 'LAP-00019',
    assetName: 'Lenovo ThinkPad E14 Gen 4',
    retirementDate: '2026-08-15',
    reason: 'Damaged Beyond Repair',
    currentValue: 12000,
    disposalValue: 2500,
    disposalMethod: 'E-Waste Recycling',
    approvedBy: 'Dr. Ramesh Narayan',
    status: 'Disposed',
    remarks: 'Board burned out; recovered scrap salvage value credited to office account.',
  },
];

export class AssetStorageService {
  private getStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('mysar_asset_changed'));
    } catch (e) {
      console.error('Error saving asset storage', key, e);
    }
  }

  // --- ASSETS ---
  public getAssets(): Asset[] {
    return this.getStorage<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
  }

  public getAssetById(id: string): Asset | undefined {
    return this.getAssets().find((a) => a.id === id);
  }

  public saveAsset(assetData: Partial<Asset>, actorName: string = 'Admin'): Asset {
    const assets = this.getAssets();
    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].slice(0, 5);

    if (assetData.id) {
      const index = assets.findIndex((a) => a.id === assetData.id);
      if (index !== -1) {
        const updatedAsset: Asset = {
          ...assets[index],
          ...assetData,
          updatedDate: now,
        };
        assets[index] = updatedAsset;
        this.setStorage(STORAGE_KEYS.ASSETS, assets);
        return updatedAsset;
      }
    }

    // Generate new unique Asset ID
    const catCode = assetData.category ? assetData.category.slice(0, 3).toUpperCase() : 'AST';
    const year = new Date().getFullYear();
    const count = assets.length + 1;
    const generatedId = `${catCode}-${year}-${String(count).padStart(4, '0')}`;

    const newAsset: Asset = {
      id: assetData.id || generatedId,
      name: assetData.name || 'New Enterprise Asset',
      category: assetData.category || 'Laptop',
      subCategory: assetData.subCategory || '',
      brand: assetData.brand || 'Generic',
      model: assetData.model || 'Standard Edition',
      serialNumber: assetData.serialNumber || `SN-${Date.now().toString().slice(-6)}`,
      description: assetData.description || '',
      purchaseInfo: assetData.purchaseInfo || {
        vendorName: 'Direct Supplier',
        purchaseDate: now,
        purchaseCost: 0,
        totalCost: 0,
        currentBookValue: 0,
        depreciationRate: 20,
      },
      warranty: assetData.warranty || {
        provider: 'Standard 1-Year Manufacturer Warranty',
        warrantyNumber: `WAR-${Date.now().toString().slice(-6)}`,
        startDate: now,
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Active',
      },
      location: assetData.location || {
        branch: 'Kochi Campus',
        building: 'Tech Block A',
        floor: '2nd Floor',
        department: 'IT & Systems',
        room: 'Asset Depot',
        storageLocation: 'Shelf 1',
      },
      currentAssignment: assetData.currentAssignment,
      temporaryCheckOut: assetData.temporaryCheckOut,
      status: assetData.status || 'Available',
      condition: assetData.condition || 'New',
      accessories: assetData.accessories || ['Power Cable', 'Standard Accessories'],
      qrCodeHash: `MYSAR-ASSET-${assetData.id || generatedId}-QR`,
      documents: assetData.documents || [],
      photos: assetData.photos || [],
      notes: assetData.notes || '',
      createdBy: actorName,
      createdAt: `${now} ${time}`,
      updatedDate: now,
    };

    assets.unshift(newAsset);
    this.setStorage(STORAGE_KEYS.ASSETS, assets);

    // Record Registration Movement
    this.recordMovement({
      assetId: newAsset.id,
      assetName: newAsset.name,
      movementType: 'Stock Received',
      direction: 'IN',
      toLocation: `${newAsset.location.branch} - ${newAsset.location.room}`,
      date: now,
      time,
      condition: newAsset.condition,
      accessoriesIssued: newAsset.accessories,
      reason: 'Asset registered in system directory.',
      referenceNumber: `REG-${newAsset.id}`,
      approvedBy: actorName,
      createdBy: actorName,
      status: 'Completed',
    });

    return newAsset;
  }

  // --- ASSET STATUS UPDATE & PERSISTENCE ---
  public updateAssetStatus(
    assetId: string,
    newStatus: AssetStatus,
    actorName: string = 'Admin / IT Officer',
    remarks?: string
  ): { success: boolean; message: string; asset?: Asset } {
    const assets = this.getAssets();
    const index = assets.findIndex((a) => a.id === assetId);
    if (index === -1) {
      return { success: false, message: `Asset ${assetId} not found` };
    }

    const currentAsset = assets[index];
    const oldStatus = currentAsset.status;
    if (oldStatus === newStatus) {
      return { success: true, message: `Status is already ${newStatus}`, asset: currentAsset };
    }

    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].slice(0, 5);

    let updatedAssignment = currentAsset.currentAssignment;
    let updatedCheckOut = currentAsset.temporaryCheckOut;

    if (newStatus === 'Available' || newStatus === 'Active') {
      if (oldStatus === 'Allocated' || oldStatus === 'Deployed') {
        updatedAssignment = undefined;
      }
      if (oldStatus === 'Checked Out') {
        updatedCheckOut = undefined;
      }
    } else if (newStatus === 'Retired' || newStatus === 'Disposed') {
      updatedAssignment = undefined;
      updatedCheckOut = undefined;
    }

    const updatedAsset: Asset = {
      ...currentAsset,
      status: newStatus,
      currentAssignment: updatedAssignment,
      temporaryCheckOut: updatedCheckOut,
      updatedDate: now,
    };

    assets[index] = updatedAsset;
    this.setStorage(STORAGE_KEYS.ASSETS, assets);

    // Record movement audit
    const isOut = ['In Maintenance', 'Under Maintenance', 'Retired', 'Disposed', 'Checked Out'].includes(newStatus);
    const movementType: MovementType =
      newStatus === 'In Maintenance' || newStatus === 'Under Maintenance'
        ? 'Sent for Maintenance'
        : newStatus === 'Retired' || newStatus === 'Disposed'
        ? 'Disposed'
        : newStatus === 'Deployed' || newStatus === 'Allocated'
        ? 'Allocated to Employee'
        : 'Stock Received';

    this.recordMovement({
      assetId: updatedAsset.id,
      assetName: updatedAsset.name,
      movementType,
      direction: isOut ? 'OUT' : 'IN',
      fromLocation: `${currentAsset.location.branch} - ${currentAsset.location.room}`,
      toLocation:
        newStatus === 'In Maintenance' || newStatus === 'Under Maintenance'
          ? 'Maintenance Bay / Service Center'
          : newStatus === 'Retired' || newStatus === 'Disposed'
          ? 'E-Waste / Scrap Depository'
          : `${currentAsset.location.branch} - ${currentAsset.location.room}`,
      date: now,
      time,
      condition: updatedAsset.condition,
      accessoriesIssued: updatedAsset.accessories,
      reason: remarks || `Status updated from ${oldStatus} to ${newStatus}`,
      referenceNumber: `STAT-${updatedAsset.id}`,
      approvedBy: actorName,
      createdBy: actorName,
      status: 'Completed',
    });

    return {
      success: true,
      message: `Asset ${updatedAsset.id} status successfully updated to ${newStatus}`,
      asset: updatedAsset,
    };
  }

  // --- ALLOCATION WORKFLOW ---
  public allocateAsset(
    assetId: string,
    allocation: {
      employeeId: string;
      employeeName: string;
      department: string;
      condition: AssetCondition;
      accessories: string[];
      expectedReturnDate?: string;
      remarks?: string;
    },
    actorName: string = 'Admin'
  ): { success: boolean; message: string; asset?: Asset } {
    const assets = this.getAssets();
    const asset = assets.find((a) => a.id === assetId);

    if (!asset) return { success: false, message: 'Asset not found' };

    // Business Rules Validation
    if (asset.status === 'Under Maintenance') {
      return { success: false, message: 'Cannot allocate an asset that is Under Maintenance.' };
    }
    if (asset.status === 'Retired' || asset.status === 'Disposed') {
      return { success: false, message: 'Cannot allocate a Retired or Disposed asset.' };
    }
    if (asset.status === 'Lost') {
      return { success: false, message: 'Cannot allocate a Lost asset.' };
    }
    if (asset.status === 'Allocated') {
      return {
        success: false,
        message: `Asset is already allocated to ${asset.currentAssignment?.employeeName}. Please perform a transfer or return first.`,
      };
    }

    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].slice(0, 5);

    asset.status = 'Allocated';
    asset.condition = allocation.condition;
    asset.currentAssignment = {
      employeeId: allocation.employeeId,
      employeeName: allocation.employeeName,
      department: allocation.department,
      allocationDate: now,
      expectedReturnDate: allocation.expectedReturnDate,
      conditionAtAllocation: allocation.condition,
      accessories: allocation.accessories,
      employeeAcknowledgement: true,
      remarks: allocation.remarks,
    };
    asset.updatedDate = now;

    this.setStorage(STORAGE_KEYS.ASSETS, assets);

    // Record Movement
    this.recordMovement({
      assetId: asset.id,
      assetName: asset.name,
      movementType: 'Allocated to Employee',
      direction: 'OUT',
      fromLocation: `${asset.location.branch} - ${asset.location.room}`,
      toEmployee: allocation.employeeName,
      toEmployeeId: allocation.employeeId,
      toLocation: `${asset.location.branch} - ${allocation.department}`,
      date: now,
      time,
      condition: allocation.condition,
      accessoriesIssued: allocation.accessories,
      reason: allocation.remarks || `Allocated to ${allocation.employeeName} (${allocation.department})`,
      referenceNumber: `ALC-${asset.id}-${Date.now().toString().slice(-4)}`,
      approvedBy: actorName,
      createdBy: actorName,
      status: 'Completed',
    });

    return { success: true, message: `Asset ${asset.id} successfully allocated to ${allocation.employeeName}`, asset };
  }

  // --- TRANSFER WORKFLOW (Employee A -> Employee B or Location A -> Location B) ---
  public transferAsset(
    assetId: string,
    transferData: {
      newEmployeeId: string;
      newEmployeeName: string;
      newDepartment: string;
      newLocation?: Partial<Asset['location']>;
      condition: AssetCondition;
      accessories: string[];
      reason: string;
    },
    actorName: string = 'Admin'
  ): { success: boolean; message: string; asset?: Asset; movement?: AssetMovement } {
    const assets = this.getAssets();
    const asset = assets.find((a) => a.id === assetId);

    if (!asset) return { success: false, message: 'Asset not found' };

    const oldEmployee = asset.currentAssignment?.employeeName || 'Previous Custodian';
    const oldEmployeeId = asset.currentAssignment?.employeeId;
    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].slice(0, 5);

    // Update Asset
    asset.status = 'Allocated';
    asset.condition = transferData.condition;
    asset.currentAssignment = {
      employeeId: transferData.newEmployeeId,
      employeeName: transferData.newEmployeeName,
      department: transferData.newDepartment,
      allocationDate: now,
      conditionAtAllocation: transferData.condition,
      accessories: transferData.accessories,
      employeeAcknowledgement: true,
      remarks: `Transferred from ${oldEmployee}. Reason: ${transferData.reason}`,
    };

    if (transferData.newLocation) {
      asset.location = {
        ...asset.location,
        ...transferData.newLocation,
      };
    }
    asset.updatedDate = now;

    this.setStorage(STORAGE_KEYS.ASSETS, assets);

    // Record Movement
    const mov = this.recordMovement({
      assetId: asset.id,
      assetName: asset.name,
      movementType: 'Transfer Out',
      direction: 'OUT',
      fromEmployee: oldEmployee,
      fromEmployeeId: oldEmployeeId,
      toEmployee: transferData.newEmployeeName,
      toEmployeeId: transferData.newEmployeeId,
      fromLocation: `${asset.location.branch}`,
      toLocation: transferData.newLocation?.branch || asset.location.branch,
      date: now,
      time,
      condition: transferData.condition,
      accessoriesIssued: transferData.accessories,
      reason: `Custodian transfer: ${oldEmployee} -> ${transferData.newEmployeeName}. ${transferData.reason}`,
      referenceNumber: `TRF-${asset.id}-${Date.now().toString().slice(-4)}`,
      approvedBy: actorName,
      createdBy: actorName,
      status: 'Completed',
    });

    return {
      success: true,
      message: `Asset ${asset.id} transferred from ${oldEmployee} to ${transferData.newEmployeeName}`,
      asset,
      movement: mov,
    };
  }

  // --- RETURN WORKFLOW ---
  public returnAsset(
    assetId: string,
    returnData: {
      condition: AssetCondition;
      accessoriesReturned: string[];
      missingAccessories: string[];
      verifiedBy: string;
      remarks?: string;
      returnLocation?: string;
    },
    actorName: string = 'Admin'
  ): { success: boolean; message: string; asset?: Asset } {
    const assets = this.getAssets();
    const asset = assets.find((a) => a.id === assetId);

    if (!asset) return { success: false, message: 'Asset not found' };

    const previousEmployee = asset.currentAssignment?.employeeName || 'Staff';
    const previousEmployeeId = asset.currentAssignment?.employeeId;
    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].slice(0, 5);

    // If damaged -> Under Maintenance, else Available
    const newStatus: AssetStatus = returnData.condition === 'Damaged' || returnData.condition === 'Critical'
      ? 'Under Maintenance'
      : 'Available';

    asset.status = newStatus;
    asset.condition = returnData.condition;
    asset.currentAssignment = undefined; // Cleared from current employee!
    asset.temporaryCheckOut = undefined;
    if (returnData.returnLocation) {
      asset.location.storageLocation = returnData.returnLocation;
    }
    asset.updatedDate = now;

    this.setStorage(STORAGE_KEYS.ASSETS, assets);

    // Record Movement
    this.recordMovement({
      assetId: asset.id,
      assetName: asset.name,
      movementType: 'Returned by Employee',
      direction: 'IN',
      fromEmployee: previousEmployee,
      fromEmployeeId: previousEmployeeId,
      toLocation: `${asset.location.branch} - ${returnData.returnLocation || asset.location.room}`,
      date: now,
      time,
      condition: returnData.condition,
      accessoriesReturned: returnData.accessoriesReturned,
      missingAccessories: returnData.missingAccessories,
      reason: returnData.remarks || `Returned by ${previousEmployee}. Condition: ${returnData.condition}`,
      referenceNumber: `RTN-${asset.id}-${Date.now().toString().slice(-4)}`,
      approvedBy: returnData.verifiedBy,
      createdBy: actorName,
      status: 'Completed',
    });

    return {
      success: true,
      message: `Asset ${asset.id} returned by ${previousEmployee}. Current Status: ${newStatus}`,
      asset,
    };
  }

  // --- CHECK-OUT WORKFLOW (Temporary Movement) ---
  public checkOutAsset(
    assetId: string,
    checkOutData: {
      person: string;
      employeeId?: string;
      department?: string;
      destination: string;
      expectedReturnDate: string;
      purpose: string;
      accessories: string[];
      condition: AssetCondition;
      approvedBy: string;
      remarks?: string;
      isOutsideOffice?: boolean;
    },
    actorName: string = 'Admin'
  ): { success: boolean; message: string; asset?: Asset } {
    const assets = this.getAssets();
    const asset = assets.find((a) => a.id === assetId);

    if (!asset) return { success: false, message: 'Asset not found' };
    if (asset.status !== 'Available') {
      return { success: false, message: `Cannot check-out asset with status: ${asset.status}` };
    }

    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].slice(0, 5);

    asset.status = 'Checked Out';
    asset.condition = checkOutData.condition;
    asset.temporaryCheckOut = {
      person: checkOutData.person,
      employeeId: checkOutData.employeeId,
      department: checkOutData.department,
      destination: checkOutData.destination,
      checkOutDate: now,
      checkOutTime: time,
      expectedReturnDate: checkOutData.expectedReturnDate,
      purpose: checkOutData.purpose,
      condition: checkOutData.condition,
      accessories: checkOutData.accessories,
      approvedBy: checkOutData.approvedBy,
      remarks: checkOutData.remarks,
      isOutsideOffice: checkOutData.isOutsideOffice ?? true,
    };
    asset.updatedDate = now;

    this.setStorage(STORAGE_KEYS.ASSETS, assets);

    // Record Movement
    this.recordMovement({
      assetId: asset.id,
      assetName: asset.name,
      movementType: 'Checked Out',
      direction: 'OUT',
      fromLocation: `${asset.location.branch} - ${asset.location.room}`,
      toEmployee: checkOutData.person,
      toEmployeeId: checkOutData.employeeId,
      toLocation: checkOutData.destination,
      date: now,
      time,
      condition: checkOutData.condition,
      accessoriesIssued: checkOutData.accessories,
      reason: `Check-out for: ${checkOutData.purpose}. Destination: ${checkOutData.destination}`,
      referenceNumber: `CHK-${asset.id}-${Date.now().toString().slice(-4)}`,
      approvedBy: checkOutData.approvedBy,
      createdBy: actorName,
      status: 'Completed',
    });

    return { success: true, message: `Asset ${asset.id} checked out to ${checkOutData.person}`, asset };
  }

  // --- CHECK-IN WORKFLOW ---
  public checkInAsset(
    assetId: string,
    checkInData: {
      condition: AssetCondition;
      accessoriesReturned: string[];
      missingAccessories: string[];
      verifiedBy: string;
      remarks?: string;
    },
    actorName: string = 'Admin'
  ): { success: boolean; message: string; asset?: Asset } {
    const assets = this.getAssets();
    const asset = assets.find((a) => a.id === assetId);

    if (!asset) return { success: false, message: 'Asset not found' };

    const person = asset.temporaryCheckOut?.person || 'Staff';
    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].slice(0, 5);

    const newStatus: AssetStatus =
      checkInData.condition === 'Damaged' || checkInData.condition === 'Critical'
        ? 'Under Maintenance'
        : 'Available';

    asset.status = newStatus;
    asset.condition = checkInData.condition;
    asset.temporaryCheckOut = undefined;
    asset.updatedDate = now;

    this.setStorage(STORAGE_KEYS.ASSETS, assets);

    // Record Movement
    this.recordMovement({
      assetId: asset.id,
      assetName: asset.name,
      movementType: 'Check-In',
      direction: 'IN',
      fromEmployee: person,
      toLocation: `${asset.location.branch} - ${asset.location.room}`,
      date: now,
      time,
      condition: checkInData.condition,
      accessoriesReturned: checkInData.accessoriesReturned,
      missingAccessories: checkInData.missingAccessories,
      reason: checkInData.remarks || `Checked in by ${person}. Condition: ${checkInData.condition}`,
      referenceNumber: `CKI-${asset.id}-${Date.now().toString().slice(-4)}`,
      approvedBy: checkInData.verifiedBy,
      createdBy: actorName,
      status: 'Completed',
    });

    return { success: true, message: `Asset ${asset.id} checked in successfully.`, asset };
  }

  // --- MAINTENANCE WORKFLOW ---
  public sendForMaintenance(
    assetId: string,
    maintenanceData: {
      maintenanceType: AssetMaintenanceRecord['maintenanceType'];
      issue: string;
      serviceProvider: string;
      cost: number;
      isWarrantyClaim: boolean;
      nextServiceDate?: string;
      description?: string;
    },
    actorName: string = 'Admin'
  ): { success: boolean; message: string; asset?: Asset } {
    const assets = this.getAssets();
    const asset = assets.find((a) => a.id === assetId);

    if (!asset) return { success: false, message: 'Asset not found' };

    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].slice(0, 5);

    asset.status = 'Under Maintenance';
    asset.condition = 'Damaged';
    asset.updatedDate = now;

    this.setStorage(STORAGE_KEYS.ASSETS, assets);

    // Save Maintenance Record
    const maintenanceRecords = this.getMaintenanceRecords();
    const mntId = `MNT-${Date.now().toString().slice(-6)}`;
    const newRecord: AssetMaintenanceRecord = {
      id: mntId,
      assetId: asset.id,
      assetName: asset.name,
      maintenanceType: maintenanceData.maintenanceType,
      issue: maintenanceData.issue,
      serviceProvider: maintenanceData.serviceProvider,
      serviceDate: now,
      cost: maintenanceData.cost,
      description: maintenanceData.description || maintenanceData.issue,
      nextServiceDate: maintenanceData.nextServiceDate,
      warrantyClaim: maintenanceData.isWarrantyClaim,
      status: 'Under Maintenance',
      createdBy: actorName,
    };
    maintenanceRecords.unshift(newRecord);
    this.setStorage(STORAGE_KEYS.MAINTENANCE, maintenanceRecords);

    // Record Movement
    this.recordMovement({
      assetId: asset.id,
      assetName: asset.name,
      movementType: 'Sent for Maintenance',
      direction: 'OUT',
      fromLocation: `${asset.location.branch} - ${asset.location.room}`,
      toLocation: maintenanceData.serviceProvider,
      date: now,
      time,
      condition: 'Damaged',
      reason: `Maintenance: ${maintenanceData.issue}`,
      referenceNumber: mntId,
      approvedBy: actorName,
      createdBy: actorName,
      status: 'Completed',
    });

    return { success: true, message: `Asset ${asset.id} sent for maintenance to ${maintenanceData.serviceProvider}`, asset };
  }

  public completeMaintenance(
    maintenanceId: string,
    completionData: {
      finalCost: number;
      partsReplaced?: string;
      verifiedBy: string;
      remarks?: string;
    },
    actorName: string = 'Admin'
  ): { success: boolean; message: string } {
    const maintenanceRecords = this.getMaintenanceRecords();
    const mnt = maintenanceRecords.find((m) => m.id === maintenanceId);
    if (!mnt) return { success: false, message: 'Maintenance record not found' };

    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].slice(0, 5);

    mnt.status = 'Completed';
    mnt.completedDate = now;
    mnt.cost = completionData.finalCost;
    mnt.partsReplaced = completionData.partsReplaced;
    mnt.verifiedBy = completionData.verifiedBy;
    mnt.remarks = completionData.remarks;

    this.setStorage(STORAGE_KEYS.MAINTENANCE, maintenanceRecords);

    // Update Asset
    const assets = this.getAssets();
    const asset = assets.find((a) => a.id === mnt.assetId);
    if (asset) {
      asset.status = 'Available';
      asset.condition = 'Good';
      asset.updatedDate = now;
      this.setStorage(STORAGE_KEYS.ASSETS, assets);

      // Record Movement
      this.recordMovement({
        assetId: asset.id,
        assetName: asset.name,
        movementType: 'Returned from Maintenance',
        direction: 'IN',
        fromLocation: mnt.serviceProvider,
        toLocation: `${asset.location.branch} - ${asset.location.room}`,
        date: now,
        time,
        condition: 'Good',
        reason: `Maintenance completed by ${mnt.serviceProvider}. Parts: ${completionData.partsReplaced || 'None'}`,
        referenceNumber: mnt.id,
        approvedBy: completionData.verifiedBy,
        createdBy: actorName,
        status: 'Completed',
      });
    }

    return { success: true, message: `Maintenance for ${mnt.assetId} marked completed.` };
  }

  // --- RETIREMENT & DISPOSAL WORKFLOW ---
  public retireAsset(
    assetId: string,
    retirementData: {
      reason: AssetRetirementRecord['reason'];
      disposalMethod: AssetRetirementRecord['disposalMethod'];
      disposalValue: number;
      approvedBy: string;
      remarks?: string;
    },
    actorName: string = 'Admin'
  ): { success: boolean; message: string; asset?: Asset } {
    const assets = this.getAssets();
    const asset = assets.find((a) => a.id === assetId);

    if (!asset) return { success: false, message: 'Asset not found' };

    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].slice(0, 5);

    asset.status = retirementData.disposalMethod === 'Scrap Auction' || retirementData.disposalMethod === 'E-Waste Recycling' ? 'Disposed' : 'Retired';
    asset.currentAssignment = undefined;
    asset.temporaryCheckOut = undefined;
    asset.updatedDate = now;

    this.setStorage(STORAGE_KEYS.ASSETS, assets);

    // Save Retirement Record
    const retirements = this.getRetirementRecords();
    const retId = `RET-${Date.now().toString().slice(-6)}`;
    const newRecord: AssetRetirementRecord = {
      id: retId,
      assetId: asset.id,
      assetName: asset.name,
      retirementDate: now,
      reason: retirementData.reason,
      currentValue: asset.purchaseInfo.currentBookValue,
      disposalValue: retirementData.disposalValue,
      disposalMethod: retirementData.disposalMethod,
      approvedBy: retirementData.approvedBy,
      status: asset.status === 'Disposed' ? 'Disposed' : 'Retired',
      remarks: retirementData.remarks,
    };
    retirements.unshift(newRecord);
    this.setStorage(STORAGE_KEYS.RETIREMENTS, retirements);

    // Record Movement
    this.recordMovement({
      assetId: asset.id,
      assetName: asset.name,
      movementType: asset.status === 'Disposed' ? 'Disposed' : 'Returned to Vendor',
      direction: 'OUT',
      fromLocation: `${asset.location.branch} - ${asset.location.room}`,
      toLocation: retirementData.disposalMethod,
      date: now,
      time,
      condition: asset.condition,
      reason: `Asset retired/disposed. Reason: ${retirementData.reason}. Method: ${retirementData.disposalMethod}`,
      referenceNumber: retId,
      approvedBy: retirementData.approvedBy,
      createdBy: actorName,
      status: 'Completed',
    });

    return { success: true, message: `Asset ${asset.id} retired and status set to ${asset.status}`, asset };
  }

  // --- MOVEMENTS & AUDIT TRAIL (Rule 47: DO NOT DELETE TRANSACTION HISTORY) ---
  public getAllMovements(): AssetMovement[] {
    return this.getStorage<AssetMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  }

  public getMovementsForAsset(assetId: string): AssetMovement[] {
    return this.getAllMovements().filter((m) => m.assetId === assetId);
  }

  public recordMovement(movementData: Omit<AssetMovement, 'id'>): AssetMovement {
    const movements = this.getAllMovements();
    const count = movements.length + 1;
    const year = new Date().getFullYear();
    const newMovement: AssetMovement = {
      id: `MOV-${year}-${String(count).padStart(4, '0')}`,
      ...movementData,
    };
    movements.unshift(newMovement);
    this.setStorage(STORAGE_KEYS.MOVEMENTS, movements);
    return newMovement;
  }

  // Correction without deletion
  public reverseMovement(movementId: string, reversalReason: string, actorName: string = 'Admin'): boolean {
    const movements = this.getAllMovements();
    const mov = movements.find((m) => m.id === movementId);
    if (!mov) return false;

    mov.status = 'Reversed';
    mov.reversalReason = reversalReason;
    mov.reversedBy = actorName;
    mov.reversedAt = new Date().toISOString();

    this.setStorage(STORAGE_KEYS.MOVEMENTS, movements);
    return true;
  }

  // --- HR / STAFF MANAGEMENT INTEGRATION (Rule 13-16) ---
  public getAssetsForEmployee(employeeId: string): {
    currentAssets: Asset[];
    historicalMovements: AssetMovement[];
    totalAssetValue: number;
    pendingReturnsCount: number;
    underMaintenanceCount: number;
  } {
    const allAssets = this.getAssets();
    const allMovements = this.getAllMovements();

    // Current assets
    const currentAssets = allAssets.filter(
      (a) => a.currentAssignment?.employeeId === employeeId && a.status === 'Allocated'
    );

    // Historical movements where employee was from or to
    const historicalMovements = allMovements.filter(
      (m) => m.toEmployeeId === employeeId || m.fromEmployeeId === employeeId
    );

    const totalAssetValue = currentAssets.reduce((sum, a) => sum + (a.purchaseInfo.purchaseCost || 0), 0);

    const now = new Date().toISOString().split('T')[0];
    const pendingReturnsCount = currentAssets.filter(
      (a) => a.currentAssignment?.expectedReturnDate && a.currentAssignment.expectedReturnDate < now
    ).length;

    const underMaintenanceCount = allAssets.filter(
      (a) => a.currentAssignment?.employeeId === employeeId && a.status === 'Under Maintenance'
    ).length;

    return {
      currentAssets,
      historicalMovements,
      totalAssetValue,
      pendingReturnsCount,
      underMaintenanceCount,
    };
  }

  // Employee Exit Asset Clearance (Rule 33)
  public getEmployeeAssetClearance(employeeId: string) {
    const { currentAssets } = this.getAssetsForEmployee(employeeId);
    return currentAssets.map((asset) => ({
      assetId: asset.id,
      assetName: asset.name,
      category: asset.category,
      serialNumber: asset.serialNumber,
      accessories: asset.accessories,
      condition: asset.condition,
      status: 'Pending Return',
    }));
  }

  // --- PROCUREMENT WORKFLOWS ---
  public getPurchaseOrders(): AssetPurchaseOrder[] {
    return this.getStorage<AssetPurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, INITIAL_POS);
  }

  public savePurchaseOrder(poData: Partial<AssetPurchaseOrder>, actorName: string = 'Admin'): AssetPurchaseOrder {
    const pos = this.getPurchaseOrders();
    const now = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0];

    if (poData.id) {
      const idx = pos.findIndex((p) => p.id === poData.id);
      if (idx !== -1) {
        pos[idx] = { ...pos[idx], ...poData };
        this.setStorage(STORAGE_KEYS.PURCHASE_ORDERS, pos);
        return pos[idx];
      }
    }

    const year = new Date().getFullYear();
    const count = pos.length + 48;
    const poNumber = `PO-${year}-${String(count).padStart(4, '0')}`;

    const newPO: AssetPurchaseOrder = {
      id: poNumber,
      poNumber,
      poDate: poData.poDate || now,
      vendorId: poData.vendorId || 'VND-01',
      vendorName: poData.vendorName || 'Dell Technologies',
      requestedBy: poData.requestedBy || actorName,
      department: poData.department || 'IT & Systems',
      expectedDeliveryDate: poData.expectedDeliveryDate || now,
      deliveryLocation: poData.deliveryLocation || 'Kochi Campus - Tech Block A',
      paymentTerms: poData.paymentTerms || 'Net 30 Days',
      notes: poData.notes || '',
      items: poData.items || [],
      status: poData.status || 'Draft',
      totalAmount: poData.totalAmount || 0,
      createdBy: actorName,
      createdAt: `${now} ${time}`,
    };

    pos.unshift(newPO);
    this.setStorage(STORAGE_KEYS.PURCHASE_ORDERS, pos);
    return newPO;
  }

  // GRN / Asset Receiving: Automatically generates individual serialized asset records!
  public receivePurchaseOrderGoods(
    poId: string,
    receivingData: {
      vendorInvoiceNumber: string;
      receivedDate: string;
      itemsReceived: Array<{
        poItemId: string;
        category: string;
        name: string;
        brand: string;
        model: string;
        quantity: number;
        costPerUnit: number;
        serialNumbers: string[];
      }>;
      verifiedBy: string;
      remarks?: string;
    },
    actorName: string = 'Admin'
  ): { success: boolean; generatedAssetIds: string[] } {
    const pos = this.getPurchaseOrders();
    const po = pos.find((p) => p.id === poId);
    if (!po) return { success: false, generatedAssetIds: [] };

    const generatedAssetIds: string[] = [];

    // Create Asset Record for each received serialized item
    receivingData.itemsReceived.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        const serial = item.serialNumbers[i] || `SN-${item.name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}-${i + 1}`;
        const newAsset = this.saveAsset(
          {
            name: item.name,
            category: item.category,
            brand: item.brand || 'Enterprise OEM',
            model: item.model || 'Standard',
            serialNumber: serial,
            purchaseInfo: {
              vendorId: po.vendorId,
              vendorName: po.vendorName,
              poNumber: po.poNumber,
              poId: po.id,
              invoiceNumber: receivingData.vendorInvoiceNumber,
              purchaseDate: receivingData.receivedDate,
              purchaseCost: item.costPerUnit,
              totalCost: item.costPerUnit,
              currentBookValue: item.costPerUnit,
              depreciationRate: 20,
            },
            status: 'Available',
            condition: 'New',
          },
          actorName
        );
        generatedAssetIds.push(newAsset.id);
      }

      // Update PO item received quantity
      const poItem = po.items.find((it) => it.id === item.poItemId);
      if (poItem) {
        poItem.receivedQuantity = (poItem.receivedQuantity || 0) + item.quantity;
      }
    });

    // Check if fully or partially received
    const totalOrdered = po.items.reduce((sum, it) => sum + it.quantity, 0);
    const totalReceived = po.items.reduce((sum, it) => sum + (it.receivedQuantity || 0), 0);

    po.status = totalReceived >= totalOrdered ? 'Fully Received' : 'Partially Received';
    this.setStorage(STORAGE_KEYS.PURCHASE_ORDERS, pos);

    // Save Purchase invoice entry
    const purchases = this.getPurchases();
    const purId = `PUR-${Date.now().toString().slice(-6)}`;
    purchases.unshift({
      id: purId,
      poNumber: po.poNumber,
      poId: po.id,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      invoiceNumber: receivingData.vendorInvoiceNumber,
      invoiceDate: receivingData.receivedDate,
      purchaseDate: receivingData.receivedDate,
      purchaseAmount: po.totalAmount,
      tax: Math.round(po.totalAmount * 0.18),
      discount: 0,
      totalAmount: Math.round(po.totalAmount * 1.18),
      paymentStatus: 'Pending',
      receivedStatus: po.status === 'Fully Received' ? 'Fully Received' : 'Partially Received',
      notes: receivingData.remarks,
      createdBy: actorName,
    });
    this.setStorage(STORAGE_KEYS.PURCHASES, purchases);

    return { success: true, generatedAssetIds };
  }

  public getPurchases(): AssetPurchaseRecord[] {
    return this.getStorage<AssetPurchaseRecord[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  }

  // --- ASSET REQUESTS ---
  public getAssetRequests(): AssetRequest[] {
    return this.getStorage<AssetRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
  }

  public saveAssetRequest(reqData: Partial<AssetRequest>, actorName: string = 'Staff'): AssetRequest {
    const requests = this.getAssetRequests();
    const now = new Date().toISOString().split('T')[0];

    const newReq: AssetRequest = {
      id: `REQ-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`,
      employeeId: reqData.employeeId || 'EMP-001',
      employeeName: reqData.employeeName || actorName,
      department: reqData.department || 'General',
      category: reqData.category || 'Laptop',
      assetTypeRequested: reqData.assetTypeRequested || 'Standard Hardware',
      quantity: reqData.quantity || 1,
      reason: reqData.reason || '',
      priority: reqData.priority || 'Medium',
      status: 'Pending Approval',
      requestedDate: now,
      remarks: reqData.remarks || '',
    };

    requests.unshift(newReq);
    this.setStorage(STORAGE_KEYS.REQUESTS, requests);
    return newReq;
  }

  public updateAssetRequestStatus(
    requestId: string,
    status: AssetRequest['status'],
    approvedBy: string,
    remarks?: string
  ): boolean {
    const requests = this.getAssetRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return false;

    req.status = status;
    req.approvedBy = approvedBy;
    req.approvedAt = new Date().toISOString();
    if (remarks) req.remarks = remarks;

    this.setStorage(STORAGE_KEYS.REQUESTS, requests);
    return true;
  }

  // --- MAINTENANCE & RETIREMENT ---
  public getMaintenanceRecords(): AssetMaintenanceRecord[] {
    return this.getStorage<AssetMaintenanceRecord[]>(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE);
  }

  public getRetirementRecords(): AssetRetirementRecord[] {
    return this.getStorage<AssetRetirementRecord[]>(STORAGE_KEYS.RETIREMENTS, INITIAL_RETIREMENTS);
  }

  // --- MASTERS: CATEGORIES, LOCATIONS, VENDORS ---
  public getCategories(): AssetCategory[] {
    return this.getStorage<AssetCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  public saveCategory(cat: AssetCategory): void {
    const cats = this.getCategories();
    const idx = cats.findIndex((c) => c.id === cat.id);
    if (idx !== -1) {
      cats[idx] = cat;
    } else {
      cats.push(cat);
    }
    this.setStorage(STORAGE_KEYS.CATEGORIES, cats);
  }

  public getLocations(): AssetLocation[] {
    return this.getStorage<AssetLocation[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
  }

  public saveLocation(loc: AssetLocation): void {
    const locs = this.getLocations();
    const idx = locs.findIndex((l) => l.id === loc.id);
    if (idx !== -1) {
      locs[idx] = loc;
    } else {
      locs.push(loc);
    }
    this.setStorage(STORAGE_KEYS.LOCATIONS, locs);
  }

  public getVendors(): AssetVendor[] {
    return this.getStorage<AssetVendor[]>(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
  }

  public saveVendor(v: AssetVendor): void {
    const vendors = this.getVendors();
    const idx = vendors.findIndex((it) => it.id === v.id);
    if (idx !== -1) {
      vendors[idx] = v;
    } else {
      vendors.push(v);
    }
    this.setStorage(STORAGE_KEYS.VENDORS, vendors);
  }

  // --- DASHBOARD METRICS (Sections 2 & 3) ---
  public getDashboardMetrics() {
    const assets = this.getAssets();
    const pos = this.getPurchaseOrders();
    const requests = this.getAssetRequests();
    const maintenance = this.getMaintenanceRecords();
    const now = new Date().toISOString().split('T')[0];

    // Counts by status
    const totalAssets = assets.length;
    const activeAssets = assets.filter((a) => a.status !== 'Retired' && a.status !== 'Disposed').length;
    const availableAssets = assets.filter((a) => a.status === 'Available' || a.status === 'Active').length;
    const allocatedAssets = assets.filter((a) => a.status === 'Allocated' || a.status === 'Deployed').length;
    const checkedOutAssets = assets.filter((a) => a.status === 'Checked Out').length;
    const underMaintenanceAssets = assets.filter(
      (a) => a.status === 'Under Maintenance' || a.status === 'In Maintenance'
    ).length;
    const damagedAssets = assets.filter((a) => a.condition === 'Damaged' || a.condition === 'Critical').length;
    const lostAssets = assets.filter((a) => a.status === 'Lost').length;
    const retiredAssets = assets.filter((a) => a.status === 'Retired').length;
    const disposedAssets = assets.filter((a) => a.status === 'Disposed').length;

    // Financial Metrics
    const totalPurchaseValue = assets.reduce((sum, a) => sum + (a.purchaseInfo?.purchaseCost || 0), 0);
    const currentBookValue = assets.reduce((sum, a) => sum + (a.purchaseInfo?.currentBookValue || 0), 0);
    const totalDepreciation = Math.max(0, totalPurchaseValue - currentBookValue);

    // This Month and FY Purchase Value
    const currentMonth = now.slice(0, 7);
    const currentYear = now.slice(0, 4);
    const thisMonthPurchaseValue = assets
      .filter((a) => a.purchaseInfo?.purchaseDate?.startsWith(currentMonth))
      .reduce((sum, a) => sum + (a.purchaseInfo?.purchaseCost || 0), 0);
    const fyPurchaseValue = assets
      .filter((a) => a.purchaseInfo?.purchaseDate?.startsWith(currentYear))
      .reduce((sum, a) => sum + (a.purchaseInfo?.purchaseCost || 0), 0);

    // Pending / Action Required
    const pendingAssetRequests = requests.filter((r) => r.status === 'Pending Approval').length;
    const pendingPurchaseOrders = pos.filter((p) => p.status === 'Pending Approval' || p.status === 'Ordered').length;
    const pendingAllocations = assets.filter((a) => a.status === 'Pending Allocation').length;

    // 30-day warranty check
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const warrantyExpiringSoon = assets.filter(
      (a) => a.warranty?.endDate && a.warranty.endDate >= now && a.warranty.endDate <= thirtyDaysLater
    ).length;
    const expiredWarrantyCount = assets.filter(
      (a) => a.warranty?.endDate && a.warranty.endDate < now
    ).length;

    // Overdue Returns
    const overdueReturns = assets.filter((a) => {
      if (a.status === 'Checked Out' && a.temporaryCheckOut?.expectedReturnDate) {
        return a.temporaryCheckOut.expectedReturnDate < now;
      }
      if (a.status === 'Allocated' && a.currentAssignment?.expectedReturnDate) {
        return a.currentAssignment.expectedReturnDate < now;
      }
      return false;
    }).length;

    // Assets outside office
    const assetsOutsideOffice = assets.filter(
      (a) => a.status === 'Checked Out' && a.temporaryCheckOut?.isOutsideOffice
    ).length;

    const maintenanceDueCount = maintenance.filter((m) => m.status === 'Under Maintenance' || m.status === 'Requested').length;

    return {
      totalAssets,
      activeAssets,
      availableAssets,
      allocatedAssets,
      checkedOutAssets,
      underMaintenanceAssets,
      damagedAssets,
      lostAssets,
      retiredAssets,
      disposedAssets,
      totalPurchaseValue,
      totalPurchaseCost: totalPurchaseValue,
      currentBookValue,
      totalBookValue: currentBookValue,
      totalDepreciation,
      thisMonthPurchaseValue,
      fyPurchaseValue,
      pendingAssetRequests,
      pendingPurchaseOrders,
      pendingAllocations,
      warrantyExpiringSoon,
      expiredWarrantyCount,
      overdueReturns,
      assetsOutsideOffice,
      maintenanceDueCount,
      inMaintenanceCount: underMaintenanceAssets,
      maintenanceAssets: underMaintenanceAssets,
      checkedOutCount: checkedOutAssets,
      retiredCount: retiredAssets,
    };
  }

  // Aliases & convenience helpers
  public getMetrics(): AssetMetrics {
    return this.getDashboardMetrics();
  }

  public getMovements(): AssetMovement[] {
    return this.getAllMovements();
  }

  public getRequests(): AssetRequest[] {
    return this.getAssetRequests();
  }

  public saveRequest(reqData: Partial<AssetRequest>, actorName: string = 'Staff'): AssetRequest {
    return this.saveAssetRequest(reqData, actorName);
  }

  public updateRequestStatus(
    requestId: string,
    status: AssetRequest['status'],
    approvedBy: string,
    remarks?: string
  ): boolean {
    return this.updateAssetRequestStatus(requestId, status, approvedBy, remarks);
  }

  public getRetirements(): AssetRetirementRecord[] {
    return this.getRetirementRecords();
  }

  public getSettings(): AssetSettingsConfig {
    return this.getStorage<AssetSettingsConfig>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public saveSettings(config: AssetSettingsConfig): void {
    this.setStorage(STORAGE_KEYS.SETTINGS, config);
  }

  public getAssetsOutsideOffice(): Asset[] {
    return this.getAssets().filter(
      (a) => a.status === 'Checked Out' && a.temporaryCheckOut?.isOutsideOffice
    );
  }

  public getOverdueReturns(): Asset[] {
    const now = new Date().toISOString().split('T')[0];
    return this.getAssets().filter((a) => {
      if (a.status === 'Checked Out' && a.temporaryCheckOut?.expectedReturnDate) {
        return a.temporaryCheckOut.expectedReturnDate < now;
      }
      if (a.status === 'Allocated' && a.currentAssignment?.expectedReturnDate) {
        return a.currentAssignment.expectedReturnDate < now;
      }
      return false;
    });
  }

  public getExpiringWarranties(days: number = 30): Asset[] {
    const now = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return this.getAssets().filter(
      (a) => a.warranty?.endDate && a.warranty.endDate >= now && a.warranty.endDate <= futureDate
    );
  }

  public exportAssetsToCSV(): string {
    const assets = this.getAssets();
    const headers = [
      'Asset ID',
      'Name',
      'Category',
      'Brand',
      'Model',
      'Serial Number',
      'Status',
      'Condition',
      'Branch',
      'Building',
      'Floor',
      'Department',
      'Room',
      'Assigned To',
      'Purchase Cost',
      'Current Book Value',
      'Warranty End',
    ];
    const rows = assets.map((a) => [
      a.id,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      a.category || '',
      a.brand || '',
      a.model || '',
      a.serialNumber || '',
      a.status,
      a.condition,
      a.location?.branch || '',
      a.location?.building || '',
      a.location?.floor || '',
      a.location?.department || '',
      a.location?.room || '',
      a.currentAssignment?.employeeName || a.temporaryCheckOut?.person || '',
      a.purchaseInfo?.purchaseCost || 0,
      a.purchaseInfo?.currentBookValue || 0,
      a.warranty?.endDate || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  }

  public exportMovementsToCSV(): string {
    const movements = this.getAllMovements();
    const headers = [
      'Movement ID',
      'Asset ID',
      'Asset Name',
      'Type',
      'Direction',
      'Date',
      'Time',
      'From Person',
      'To Person',
      'From Location',
      'To Location',
      'Condition',
      'Reason',
      'Ref Number',
      'Status',
    ];
    const rows = movements.map((m) => [
      m.id,
      m.assetId,
      `"${(m.assetName || '').replace(/"/g, '""')}"`,
      m.movementType,
      m.direction,
      m.date,
      m.time,
      m.fromEmployee || '',
      m.toEmployee || '',
      m.fromLocation || '',
      m.toLocation || '',
      m.condition,
      `"${(m.reason || '').replace(/"/g, '""')}"`,
      m.referenceNumber || '',
      m.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  }
}

export const assetStorage = new AssetStorageService();
