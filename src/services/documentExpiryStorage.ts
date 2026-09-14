// ============================================================================
// Document & Expiry Management - Storage & Business Logic Service
// ============================================================================

import {
  CustomDocumentType,
  DocumentRenewalRecord,
  ExpiryDashboardMetrics,
  ExpiryDocument,
  NotificationChannel,
  ReminderNotificationLog,
  calculateDaysRemaining,
  getUrgencyLevel,
} from '../types/documentExpiry';
import {
  initialDocumentTypes,
  initialExpiryDocuments,
  initialReminderLogs,
} from '../data/documentExpiryMockData';

const STORAGE_KEYS = {
  DOCUMENTS: 'mysar_expiry_documents',
  DOCUMENT_TYPES: 'mysar_document_types',
  REMINDER_LOGS: 'mysar_reminder_logs',
};

class DocumentExpiryStorageService {
  private getStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return fallback;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
    }
  }

  // --------------------------------------------------------------------------
  // Documents Management
  // --------------------------------------------------------------------------

  public getDocuments(): ExpiryDocument[] {
    const docs = this.getStorage<ExpiryDocument[]>(
      STORAGE_KEYS.DOCUMENTS,
      initialExpiryDocuments
    );

    // Dynamic auto-evaluation of status based on current date
    const todayStr = new Date().toISOString().split('T')[0];
    return docs.map((doc) => {
      // If already marked renewed and still within new validity, keep Renewed or Active
      const days = calculateDaysRemaining(doc.expiryDate, todayStr);
      let evaluatedStatus = doc.status;

      if (doc.status !== 'Renewed') {
        if (days < 0) {
          evaluatedStatus = 'Expired';
        } else if (days <= 30) {
          evaluatedStatus = 'Expiring';
        } else {
          evaluatedStatus = 'Active';
        }
      } else {
        // If renewed but now new expiry date has elapsed, it becomes expired
        if (days < 0) {
          evaluatedStatus = 'Expired';
        }
      }

      return {
        ...doc,
        status: evaluatedStatus,
      };
    });
  }

  public getDocumentById(id: string): ExpiryDocument | undefined {
    return this.getDocuments().find((d) => d.id === id);
  }

  public addDocument(docData: Partial<ExpiryDocument>): ExpiryDocument {
    return this.saveDocument(docData);
  }

  public updateDocument(id: string, docData: Partial<ExpiryDocument>): ExpiryDocument {
    return this.saveDocument({ ...docData, id });
  }

  public saveDocument(docData: Partial<ExpiryDocument>): ExpiryDocument {
    const docs = this.getDocuments();
    const now = new Date().toISOString();

    if (docData.id) {
      // Update existing
      const index = docs.findIndex((d) => d.id === docData.id);
      if (index >= 0) {
        const updatedDoc: ExpiryDocument = {
          ...docs[index],
          ...docData,
          updatedAt: now,
        };
        docs[index] = updatedDoc;
        this.setStorage(STORAGE_KEYS.DOCUMENTS, docs);
        this.notifyChange();
        return updatedDoc;
      }
    }

    // Create new document
    const newDoc: ExpiryDocument = {
      id: `doc-${Date.now()}`,
      documentTypeId: docData.documentTypeId || 'dt-18',
      documentTypeName: docData.documentTypeName || 'Other / Custom Expiry',
      documentName: docData.documentName || 'Untitled Document',
      referenceNumber: docData.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      relatedParty: docData.relatedParty || 'Internal / Self',
      relatedPartyType: docData.relatedPartyType || 'Other',
      startDate: docData.startDate || now.split('T')[0],
      expiryDate: docData.expiryDate || now.split('T')[0],
      amount: docData.amount || 0,
      currency: docData.currency || 'INR',
      responsiblePerson: docData.responsiblePerson || 'Admin',
      responsibleEmail: docData.responsibleEmail || '',
      responsiblePhone: docData.responsiblePhone || '',
      department: docData.department || 'Admin',
      attachmentUrl: docData.attachmentUrl,
      attachmentName: docData.attachmentName,
      attachmentSize: docData.attachmentSize,
      remarks: docData.remarks || '',
      status: docData.status || 'Active',
      reminderDays: docData.reminderDays || [60, 30, 15, 7, 1, 0],
      notificationChannels: docData.notificationChannels || ['email', 'system', 'dashboard'],
      renewalCount: 0,
      renewalHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    docs.unshift(newDoc);
    this.setStorage(STORAGE_KEYS.DOCUMENTS, docs);
    this.notifyChange();
    return newDoc;
  }

  public deleteDocument(id: string): boolean {
    const docs = this.getDocuments();
    const filtered = docs.filter((d) => d.id !== id);
    if (filtered.length !== docs.length) {
      this.setStorage(STORAGE_KEYS.DOCUMENTS, filtered);
      this.notifyChange();
      return true;
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // Renewal Management: Maintain Complete History
  // --------------------------------------------------------------------------

  public renewDocument(params: {
    documentId: string;
    newStartDate: string;
    newExpiryDate: string;
    newAmount?: number;
    renewedBy: string;
    vendorOrIssuer?: string;
    invoiceOrReceiptNumber?: string;
    newAttachmentName?: string;
    newAttachmentUrl?: string;
    remarks?: string;
  }): ExpiryDocument | null {
    const docs = this.getDocuments();
    const docIndex = docs.findIndex((d) => d.id === params.documentId);
    if (docIndex < 0) return null;

    const oldDoc = docs[docIndex];
    const now = new Date().toISOString();

    // Create a new historical renewal record from prior state
    const renewalRecord: DocumentRenewalRecord = {
      id: `ren-${Date.now()}`,
      documentId: oldDoc.id,
      renewalDate: now.split('T')[0],
      renewedBy: params.renewedBy || 'Administrator',
      previousStartDate: oldDoc.startDate,
      previousExpiryDate: oldDoc.expiryDate,
      newStartDate: params.newStartDate,
      newExpiryDate: params.newExpiryDate,
      previousAmount: oldDoc.amount,
      newAmount: params.newAmount !== undefined ? params.newAmount : oldDoc.amount,
      currency: oldDoc.currency || 'INR',
      vendorOrIssuer: params.vendorOrIssuer || oldDoc.relatedParty,
      invoiceOrReceiptNumber: params.invoiceOrReceiptNumber || '',
      previousAttachmentName: oldDoc.attachmentName,
      previousAttachmentUrl: oldDoc.attachmentUrl,
      newAttachmentName: params.newAttachmentName || oldDoc.attachmentName,
      newAttachmentUrl: params.newAttachmentUrl || oldDoc.attachmentUrl,
      remarks: params.remarks || 'Document successfully renewed with updated validity terms.',
      createdAt: now,
    };

    // Update the live document with new dates and append to renewal history
    const updatedDoc: ExpiryDocument = {
      ...oldDoc,
      startDate: params.newStartDate,
      expiryDate: params.newExpiryDate,
      amount: params.newAmount !== undefined ? params.newAmount : oldDoc.amount,
      attachmentName: params.newAttachmentName || oldDoc.attachmentName,
      attachmentUrl: params.newAttachmentUrl || oldDoc.attachmentUrl,
      status: 'Renewed',
      renewalCount: (oldDoc.renewalCount || 0) + 1,
      renewalHistory: [renewalRecord, ...(oldDoc.renewalHistory || [])],
      updatedAt: now,
    };

    docs[docIndex] = updatedDoc;
    this.setStorage(STORAGE_KEYS.DOCUMENTS, docs);

    // Log the renewal event
    this.addReminderLog({
      documentId: updatedDoc.id,
      documentName: updatedDoc.documentName,
      documentTypeName: updatedDoc.documentTypeName,
      referenceNumber: updatedDoc.referenceNumber,
      recipient: updatedDoc.responsibleEmail || updatedDoc.responsiblePerson,
      channel: 'system',
      triggerDays: 0,
      status: 'Delivered',
      messagePreview: `Document '${updatedDoc.documentName}' successfully renewed until ${updatedDoc.expiryDate} by ${params.renewedBy}.`,
    });

    this.notifyChange();
    return updatedDoc;
  }

  // --------------------------------------------------------------------------
  // Custom Document Types Management
  // --------------------------------------------------------------------------

  public getDocumentTypes(): CustomDocumentType[] {
    return this.getStorage<CustomDocumentType[]>(
      STORAGE_KEYS.DOCUMENT_TYPES,
      initialDocumentTypes
    );
  }

  public addCustomDocumentType(
    typeData: Omit<CustomDocumentType, 'id' | 'isStandard' | 'createdAt'>
  ): CustomDocumentType {
    return this.saveDocumentType(typeData);
  }

  public updateDocumentType(type: CustomDocumentType): CustomDocumentType {
    return this.saveDocumentType(type);
  }

  public saveDocumentType(typeData: Partial<CustomDocumentType>): CustomDocumentType {
    const types = this.getDocumentTypes();
    const now = new Date().toISOString();

    if (typeData.id) {
      const index = types.findIndex((t) => t.id === typeData.id);
      if (index >= 0) {
        const updated = { ...types[index], ...typeData, updatedAt: now };
        types[index] = updated;
        this.setStorage(STORAGE_KEYS.DOCUMENT_TYPES, types);
        this.notifyChange();
        return updated;
      }
    }

    const newType: CustomDocumentType = {
      id: `dt-custom-${Date.now()}`,
      name: typeData.name || 'New Custom Expiry Type',
      category: 'Custom',
      code: (typeData.code || typeData.name?.slice(0, 3) || 'CUS').toUpperCase(),
      description: typeData.description || '',
      defaultDepartment: typeData.defaultDepartment || 'Admin',
      defaultReminders: typeData.defaultReminders || [30, 15, 7, 1, 0],
      defaultNotificationChannels: typeData.defaultNotificationChannels || [
        'email',
        'whatsapp',
        'system',
        'dashboard',
      ],
      responsiblePerson: typeData.responsiblePerson || '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    types.push(newType);
    this.setStorage(STORAGE_KEYS.DOCUMENT_TYPES, types);
    this.notifyChange();
    return newType;
  }

  public deleteDocumentType(id: string): boolean {
    const types = this.getDocumentTypes();
    // Do not allow deleting active standard types
    const target = types.find((t) => t.id === id);
    if (target?.category === 'Standard') {
      return false;
    }
    const filtered = types.filter((t) => t.id !== id);
    if (filtered.length !== types.length) {
      this.setStorage(STORAGE_KEYS.DOCUMENT_TYPES, filtered);
      this.notifyChange();
      return true;
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // Reminder Notification Logs & Test Triggers
  // --------------------------------------------------------------------------

  public getNotificationLogs(): ReminderNotificationLog[] {
    return this.getReminderLogs();
  }

  public getReminderLogs(): ReminderNotificationLog[] {
    return this.getStorage<ReminderNotificationLog[]>(
      STORAGE_KEYS.REMINDER_LOGS,
      initialReminderLogs
    );
  }

  public logNotification(log: Omit<ReminderNotificationLog, 'id' | 'sentAt'>): ReminderNotificationLog {
    return this.addReminderLog(log);
  }

  public addReminderLog(log: Omit<ReminderNotificationLog, 'id' | 'sentAt'>): ReminderNotificationLog {
    const logs = this.getReminderLogs();
    const newLog: ReminderNotificationLog = {
      ...log,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sentAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.setStorage(STORAGE_KEYS.REMINDER_LOGS, logs);
    this.notifyChange();
    return newLog;
  }

  public triggerTestNotification(
    doc: ExpiryDocument,
    channel: NotificationChannel
  ): ReminderNotificationLog {
    const days = calculateDaysRemaining(doc.expiryDate);
    const urgency = getUrgencyLevel(doc);

    let message = '';
    switch (channel) {
      case 'whatsapp':
        message = `MYSAR ERP WhatsApp Alert: "${doc.documentName}" (${doc.documentTypeName}) ${
          days <= 0 ? 'has expired' : `expires in ${days} days on ${doc.expiryDate}`
        }. Responsible: ${doc.responsiblePerson}.`;
        break;
      case 'email':
        message = `[Official Expiry Notice] "${doc.documentName}" is due for renewal on ${doc.expiryDate}. Amount: ${doc.currency} ${(doc.amount || 0).toLocaleString()}. Please upload renewed documentation.`;
        break;
      case 'sms':
        message = `MYSAR Alert: Ref #${doc.referenceNumber} (${doc.documentName}) expires on ${doc.expiryDate}. Contact ${doc.department} Dept for renewal.`;
        break;
      case 'dashboard':
        message = `High Priority Dashboard Alert: ${doc.documentName} requires executive renewal action. Urgency: ${urgency.toUpperCase()}.`;
        break;
      case 'system':
      default:
        message = `System Renewal Reminder: ${doc.documentName} expires in ${days} days (${doc.expiryDate}).`;
        break;
    }

    const log = this.addReminderLog({
      documentId: doc.id,
      documentName: doc.documentName,
      documentTypeName: doc.documentTypeName,
      referenceNumber: doc.referenceNumber,
      recipient:
        channel === 'email'
          ? doc.responsibleEmail || 'admin@casbiro.com'
          : channel === 'whatsapp' || channel === 'sms'
          ? doc.responsiblePhone || '+91 98470 00000'
          : doc.responsiblePerson,
      channel,
      triggerDays: Math.max(0, days),
      status: 'Delivered',
      messagePreview: message,
    });

    return log;
  }

  // --------------------------------------------------------------------------
  // Dashboard Metrics Computation
  // --------------------------------------------------------------------------

  public getDashboardMetrics(): ExpiryDashboardMetrics {
    return this.calculateMetrics();
  }

  public calculateMetrics(): ExpiryDashboardMetrics {
    const docs = this.getDocuments();
    let expiredCount = 0;
    let expiringTodayCount = 0;
    let expiring7dCount = 0;
    let expiring30dCount = 0;
    let expiring90dCount = 0;
    let renewedCount = 0;
    let activeCount = 0;
    let totalRenewalCostExposure = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    docs.forEach((doc) => {
      const urgency = getUrgencyLevel(doc, todayStr);
      const days = calculateDaysRemaining(doc.expiryDate, todayStr);

      if (urgency === 'expired') {
        expiredCount++;
        totalRenewalCostExposure += doc.amount || 0;
      } else if (urgency === 'expiring_today') {
        expiringTodayCount++;
        totalRenewalCostExposure += doc.amount || 0;
      } else if (urgency === 'expiring_7d') {
        expiring7dCount++;
        totalRenewalCostExposure += doc.amount || 0;
      } else if (urgency === 'expiring_30d') {
        expiring30dCount++;
        totalRenewalCostExposure += doc.amount || 0;
      } else if (urgency === 'expiring_90d') {
        expiring90dCount++;
        totalRenewalCostExposure += doc.amount || 0;
      } else if (urgency === 'renewed') {
        renewedCount++;
      } else {
        activeCount++;
      }
    });

    return {
      totalDocuments: docs.length,
      expiredCount,
      expiringTodayCount,
      expiring7dCount,
      expiring30dCount,
      expiring90dCount,
      renewedCount,
      activeCount,
      totalRenewalCostExposure,
      currency: 'INR',
    };
  }

  // --------------------------------------------------------------------------
  // Reset & Change Events
  // --------------------------------------------------------------------------

  public resetToDefaults(): void {
    this.setStorage(STORAGE_KEYS.DOCUMENTS, initialExpiryDocuments);
    this.setStorage(STORAGE_KEYS.DOCUMENT_TYPES, initialDocumentTypes);
    this.setStorage(STORAGE_KEYS.REMINDER_LOGS, initialReminderLogs);
    this.notifyChange();
  }

  private notifyChange(): void {
    try {
      window.dispatchEvent(new CustomEvent('mysar_doc_expiry_changed'));
    } catch {}
  }
}

export const documentExpiryStorage = new DocumentExpiryStorageService();
