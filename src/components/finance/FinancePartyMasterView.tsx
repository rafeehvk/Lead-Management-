import React, { useState, useEffect } from 'react';
import { Users, Plus, FileCheck, Receipt, Download, Building2 } from 'lucide-react';
import { PartyMaster } from '../../types/finance';
import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';
import { PartyDirectoryTable } from './parties/PartyDirectoryTable';
import { PartyFormModal } from './parties/PartyFormModal';
import { PartyProfileModal } from './parties/PartyProfileModal';
import { OpeningBalanceEntryModal } from './parties/OpeningBalanceEntryModal';
import { PartyReportsModal } from './parties/PartyReportsModal';

export const FinancePartyMasterView: React.FC = () => {
  const [parties, setParties] = useState<PartyMaster[]>([]);
  const [selectedParty, setSelectedParty] = useState<PartyMaster | null>(null);
  const [editingParty, setEditingParty] = useState<PartyMaster | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOpeningBalancesOpen, setIsOpeningBalancesOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [reportTab, setReportTab] = useState<'receivables' | 'payables' | 'statement'>('receivables');

  const loadParties = () => {
    const list = erpFinanceStorage.getParties();
    setParties(list);
  };

  useEffect(() => {
    loadParties();

    const handleDataChange = () => {
      loadParties();
    };

    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => {
      window.removeEventListener('mysar_finance_data_changed', handleDataChange);
    };
  }, []);

  const handleSelectParty = (party: PartyMaster) => {
    setSelectedParty(party);
    setIsProfileOpen(true);
  };

  const handleEditParty = (party: PartyMaster) => {
    setEditingParty(party);
    setIsFormOpen(true);
  };

  const handleNewParty = () => {
    setEditingParty(null);
    setIsFormOpen(true);
  };

  const handleOpenReports = (tab: 'receivables' | 'payables' | 'statement' = 'receivables') => {
    setReportTab(tab);
    setIsReportsOpen(true);
  };

  const handleOpenStatementFromProfile = (party: PartyMaster) => {
    setSelectedParty(party);
    setReportTab('statement');
    setIsReportsOpen(true);
  };

  // Export full party directory CSV
  const handleExportAllPartiesCSV = () => {
    const headers = [
      'Party Code',
      'Party Name',
      'Legal Name',
      'Type',
      'Category',
      'Contact Person',
      'Phone',
      'Email',
      'GSTIN',
      'PAN',
      'GST Type',
      'Place of Supply',
      'Credit Limit',
      'Credit Rule',
      'Payment Terms',
      'Current Balance',
      'Status',
    ];

    const rows = parties.map((p) => [
      p.code,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.legalName || '').replace(/"/g, '""')}"`,
      p.type,
      p.category,
      `"${(p.contactPerson || '').replace(/"/g, '""')}"`,
      p.phone,
      p.email,
      p.gstin || '',
      p.pan || '',
      p.gstType,
      p.placeOfSupply,
      p.creditLimit,
      p.creditLimitAction,
      p.paymentTerms,
      p.currentBalance,
      p.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'MYSAR_Unified_Party_Master_Directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Party Master & Subledgers
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Section 21 • Unified Master
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Single unified entity master for Customers, Vendors, and dual-trading partners. Features checksum-validated GSTINs, Credit Limit enforcement (Block, Warning, Approval), opening balance locks, and subledger reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportAllPartiesCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Directory (CSV)
          </button>
          <button
            onClick={() => handleOpenReports('receivables')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" /> Aging & Statements
          </button>
          <button
            onClick={handleNewParty}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Party
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <PartyDirectoryTable
        parties={parties}
        onSelectParty={handleSelectParty}
        onEditParty={handleEditParty}
        onNewParty={handleNewParty}
        onOpenOpeningBalances={() => setIsOpeningBalancesOpen(true)}
        onOpenReports={handleOpenReports}
      />

      {/* Party Form Modal (Create / Edit) */}
      <PartyFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingParty(null);
        }}
        initialParty={editingParty}
        onSave={(saved) => {
          loadParties();
          if (selectedParty && selectedParty.id === saved.id) {
            setSelectedParty(saved);
          }
        }}
      />

      {/* Party Profile Modal */}
      <PartyProfileModal
        party={selectedParty}
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedParty(null);
        }}
        onEdit={(party) => {
          setIsProfileOpen(false);
          handleEditParty(party);
        }}
        onOpenStatement={handleOpenStatementFromProfile}
      />

      {/* Opening Balance Entry Modal */}
      <OpeningBalanceEntryModal
        isOpen={isOpeningBalancesOpen}
        onClose={() => setIsOpeningBalancesOpen(false)}
        onSaved={loadParties}
      />

      {/* Party Reports Modal */}
      <PartyReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        initialTab={reportTab}
        selectedParty={selectedParty}
      />
    </div>
  );
};
