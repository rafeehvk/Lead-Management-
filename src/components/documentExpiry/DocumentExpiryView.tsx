import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
} from 'lucide-react';
import {
  documentExpiryStorage,
} from '../../services/documentExpiryStorage';
import {
  CustomDocumentType,
  ExpiryDashboardMetrics,
  ExpiryDocument,
  NotificationChannel,
  ReminderNotificationLog,
} from '../../types/documentExpiry';
import { ExpiryDashboardTab } from './ExpiryDashboardTab';
import { DocumentsRegistryTab } from './DocumentsRegistryTab';
import { ExpiryCalendarTab } from './ExpiryCalendarTab';
import { RemindersTab } from './RemindersTab';
import { RenewalsHistoryTab } from './RenewalsHistoryTab';
import { DocumentTypesSettingsTab } from './DocumentTypesSettingsTab';
import { DocumentFormModal } from './DocumentFormModal';
import { DocumentDetailsModal } from './DocumentDetailsModal';
import { RenewalModal } from './RenewalModal';

export type DocumentExpirySubTab = 'dashboard' | 'documents' | 'calendar' | 'reminders' | 'renewals' | 'types';

interface DocumentExpiryViewProps {
  currentUserName?: string;
  activeSubTab?: DocumentExpirySubTab;
  onSubTabChange?: (tab: DocumentExpirySubTab) => void;
}

export const DocumentExpiryView: React.FC<DocumentExpiryViewProps> = ({
  currentUserName = 'Administrator',
  activeSubTab = 'dashboard',
  onSubTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<DocumentExpirySubTab>(activeSubTab);

  useEffect(() => {
    if (activeSubTab && activeSubTab !== activeTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabChange = (tab: DocumentExpirySubTab) => {
    setActiveTab(tab);
    onSubTabChange?.(tab);
  };
  const [documents, setDocuments] = useState<ExpiryDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<CustomDocumentType[]>([]);
  const [metrics, setMetrics] = useState<ExpiryDashboardMetrics>({
    expiredCount: 0,
    expiringTodayCount: 0,
    expiring7dCount: 0,
    expiring30dCount: 0,
    expiring90dCount: 0,
    renewedCount: 0,
    activeCount: 0,
    totalDocuments: 0,
    totalRenewalCostExposure: 0,
  });
  const [logs, setLogs] = useState<ReminderNotificationLog[]>([]);

  // Navigation filter passing
  const [initialUrgencyFilter, setInitialUrgencyFilter] = useState<string | undefined>(undefined);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ExpiryDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<ExpiryDocument | null>(null);
  const [renewingDoc, setRenewingDoc] = useState<ExpiryDocument | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(
    null
  );

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = () => {
    const docs = documentExpiryStorage.getDocuments();
    const types = documentExpiryStorage.getDocumentTypes();
    const calculatedMetrics = documentExpiryStorage.getDashboardMetrics();
    const notificationLogs = documentExpiryStorage.getNotificationLogs();

    setDocuments(docs);
    setDocumentTypes(types);
    setMetrics(calculatedMetrics);
    setLogs(notificationLogs);
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('mysar_doc_expiry_changed', handleStorageChange);
    return () => {
      window.removeEventListener('mysar_doc_expiry_changed', handleStorageChange);
    };
  }, []);

  // Handlers
  const handleSaveDocument = (docData: Partial<ExpiryDocument>) => {
    if (docData.id) {
      documentExpiryStorage.updateDocument(docData.id, docData);
      showToast(`Document "${docData.documentName}" updated successfully!`);
    } else {
      documentExpiryStorage.addDocument(docData);
      showToast(`Document "${docData.documentName}" registered and reminders activated!`);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    documentExpiryStorage.deleteDocument(docId);
    showToast(`Document "${doc?.documentName || docId}" removed from tracking.`, 'info');
  };

  const handleRenewalComplete = (renewedDoc: ExpiryDocument) => {
    showToast(
      `Document "${renewedDoc.documentName}" renewed until ${renewedDoc.expiryDate}. Prior terms archived to audit trail!`
    );
    // If viewing this document, update the modal
    if (viewingDoc && viewingDoc.id === renewedDoc.id) {
      setViewingDoc(renewedDoc);
    }
  };

  const handleTriggerTestNotification = (doc: ExpiryDocument, channel: NotificationChannel) => {
    documentExpiryStorage.logNotification({
      documentId: doc.id,
      documentName: doc.documentName,
      documentTypeName: doc.documentTypeName,
      referenceNumber: doc.referenceNumber,
      channel,
      recipient:
        channel === 'email'
          ? doc.responsibleEmail || 'compliance@casbiro.com'
          : channel === 'whatsapp' || channel === 'sms'
          ? doc.responsiblePhone || '+91 98470 00000'
          : doc.responsiblePerson,
      triggerDays: 15,
      messagePreview: `Reminder: ${doc.documentName} (#${doc.referenceNumber}) is expiring on ${doc.expiryDate}. Immediate renewal action requested.`,
      status: 'Delivered',
    });
  };

  const handleNavigateToDocuments = (urgencyFilter?: string) => {
    setInitialUrgencyFilter(urgencyFilter);
    handleTabChange('documents');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Tab Views */}
      {activeTab === 'dashboard' && (
        <ExpiryDashboardTab
          metrics={metrics}
          documents={documents}
          documentTypes={documentTypes}
          onSelectDocument={(doc) => setViewingDoc(doc)}
          onOpenRenew={(doc) => setRenewingDoc(doc)}
          onNavigateToDocuments={handleNavigateToDocuments}
          onOpenNewDocument={() => {
            setEditingDoc(null);
            setIsFormOpen(true);
          }}
        />
      )}

      {activeTab === 'documents' && (
        <DocumentsRegistryTab
          documents={documents}
          documentTypes={documentTypes}
          onSelectDocument={(doc) => setViewingDoc(doc)}
          onOpenRenew={(doc) => setRenewingDoc(doc)}
          onOpenEdit={(doc) => {
            setEditingDoc(doc);
            setIsFormOpen(true);
          }}
          onDeleteDocument={handleDeleteDocument}
          onOpenNewDocument={() => {
            setEditingDoc(null);
            setIsFormOpen(true);
          }}
          initialUrgencyFilter={initialUrgencyFilter}
        />
      )}

      {activeTab === 'calendar' && (
        <ExpiryCalendarTab
          documents={documents}
          onSelectDocument={(doc) => setViewingDoc(doc)}
          onOpenRenew={(doc) => setRenewingDoc(doc)}
        />
      )}

      {activeTab === 'reminders' && (
        <RemindersTab
          documents={documents}
          logs={logs}
          onTriggerTestNotification={handleTriggerTestNotification}
        />
      )}

      {activeTab === 'renewals' && (
        <RenewalsHistoryTab
          documents={documents}
          onSelectDocument={(doc) => setViewingDoc(doc)}
          onOpenRenew={(doc) => setRenewingDoc(doc)}
        />
      )}

      {activeTab === 'types' && (
        <DocumentTypesSettingsTab
          documentTypes={documentTypes}
          documents={documents}
          onAddCustomType={(typeData) => {
            documentExpiryStorage.addCustomDocumentType(typeData);
            showToast(`Custom Document Type "${typeData.name}" created successfully!`);
          }}
          onUpdateCustomType={(type) => {
            documentExpiryStorage.updateDocumentType(type);
            showToast(`Document Type "${type.name}" updated.`);
          }}
          onDeleteCustomType={(id) => {
            documentExpiryStorage.deleteDocumentType(id);
            showToast(`Document Type removed.`, 'info');
          }}
        />
      )}

      {/* Global Modals */}
      <DocumentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDoc(null);
        }}
        onSave={handleSaveDocument}
        editDocument={editingDoc}
        documentTypes={documentTypes}
        currentUserName={currentUserName}
      />

      <DocumentDetailsModal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
        onOpenRenew={(doc) => {
          setViewingDoc(null);
          setRenewingDoc(doc);
        }}
      />

      <RenewalModal
        isOpen={!!renewingDoc}
        onClose={() => setRenewingDoc(null)}
        document={renewingDoc}
        onRenewalComplete={handleRenewalComplete}
        currentUserName={currentUserName}
      />
    </div>
  );
};
