import { ExpiryDocument, DocumentRenewalRecord } from '../types/documentExpiry';

/**
 * Clean isolated iframe printing helper for Document & Expiry Management
 */
export function printHtmlDocument(htmlBodyContent: string, documentTitle = 'Document Expiry Report'): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  // Active styles from parent
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${documentTitle}</title>
        ${headStyles}
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            background-color: #FFFFFF !important;
            color: #0F172A !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            font-size: 11pt !important;
            line-height: 1.45 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            background: #ffffff !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            padding: 6px 10px !important;
            border-bottom: 1px solid #E2E8F0 !important;
          }
          th {
            background-color: #F8FAFC !important;
            font-size: 9pt !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            color: #64748B !important;
            font-weight: 700 !important;
          }
          .badge {
            display: inline-block !important;
            padding: 2px 8px !important;
            border-radius: 9999px !important;
            font-size: 8.5pt !important;
            font-weight: 700 !important;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${htmlBodyContent}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print failed, falling back to window.print', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 350);
}

/**
 * Print an existing DOM element by its ID
 */
export function printElementById(elementId: string, title = 'Document Print'): void {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }
  printHtmlDocument(element.outerHTML, title);
}

/**
 * Generates and prints an official Compliance & Validity Certificate for a single document
 */
export function printDocumentCertificate(doc: ExpiryDocument): void {
  const nowStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'background-color: #DEF7EC; color: #03543F; border: 1px solid #BCF0DA;';
      case 'Expiring':
        return 'background-color: #FEF08A; color: #854D0E; border: 1px solid #FDE047;';
      case 'Expired':
        return 'background-color: #FDE8E8; color: #9B1C1C; border: 1px solid #F8B4B4;';
      case 'Renewed':
        return 'background-color: #E1EFFE; color: #1E429F; border: 1px solid #B4C6FC;';
      default:
        return 'background-color: #F3F4F6; color: #374151;';
    }
  };

  const renewalRows =
    doc.renewalHistory && doc.renewalHistory.length > 0
      ? doc.renewalHistory
          .map(
            (r, idx) => `
        <tr>
          <td style="font-weight: 600; font-family: monospace;">#${idx + 1}</td>
          <td>${r.renewalDate || r.createdAt?.split('T')[0]}</td>
          <td>${r.renewedBy}</td>
          <td style="font-family: monospace;">${r.previousStartDate} → ${r.previousExpiryDate}</td>
          <td style="font-family: monospace; font-weight: 600; color: #0B5D2A;">${r.newStartDate} → ${r.newExpiryDate}</td>
          <td style="font-weight: 700;">₹ ${(r.newAmount || 0).toLocaleString()}</td>
          <td>${r.invoiceOrReceiptNumber || '—'}</td>
        </tr>
      `
          )
          .join('')
      : `<tr><td colspan="7" style="text-align: center; color: #94A3B8; padding: 16px;">No renewals logged yet. Operating on primary registered term.</td></tr>`;

  const html = `
    <div style="padding: 24px; border: 2px solid #0B5D2A; border-radius: 12px; margin-bottom: 20px;">
      <!-- Header Banner -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <div style="display: inline-block; font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #0B5D2A; background-color: #EAF7EF; padding: 4px 10px; border-radius: 9999px; margin-bottom: 6px;">
            Enterprise Compliance & Continuity Registry
          </div>
          <h1 style="font-size: 18pt; font-weight: 800; color: #0F172A; margin: 4px 0 2px 0;">
            Document Validity & Expiry Certificate
          </h1>
          <p style="font-size: 9pt; color: #64748B; margin: 0;">
            Casbiro ERP System &bull; Official Compliance Record &bull; Generated on ${nowStr}
          </p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; font-size: 11pt; font-weight: 800; padding: 6px 14px; border-radius: 8px; ${getStatusColor(
            doc.status
          )}">
            ${doc.status.toUpperCase()}
          </span>
          <div style="font-size: 8.5pt; color: #64748B; margin-top: 4px; font-family: monospace;">
            REF: ${doc.referenceNumber}
          </div>
        </div>
      </div>

      <!-- Main Document Details Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background-color: #F8FAFC; padding: 14px; border-radius: 8px; border: 1px solid #E2E8F0;">
          <h3 style="font-size: 10pt; font-weight: 700; color: #334155; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px;">
            Document Identification
          </h3>
          <table style="width: 100%; font-size: 9.5pt;">
            <tr>
              <td style="color: #64748B; width: 40%; font-weight: 500;">Document Title:</td>
              <td style="font-weight: 700; color: #0F172A;">${doc.documentName}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 500;">Category / Type:</td>
              <td style="font-weight: 600; color: #0B5D2A;">${doc.documentTypeName}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 500;">Reference / Contract:</td>
              <td style="font-family: monospace; font-weight: 600;">${doc.referenceNumber}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 500;">Related Party:</td>
              <td style="font-weight: 600;">${doc.relatedParty} <span style="color: #64748B; font-size: 8pt;">(${doc.relatedPartyType || 'Vendor'})</span></td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 500;">Attachment:</td>
              <td style="color: #334155;">${doc.attachmentName || 'Registered Electronic Document'}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #F8FAFC; padding: 14px; border-radius: 8px; border: 1px solid #E2E8F0;">
          <h3 style="font-size: 10pt; font-weight: 700; color: #334155; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px;">
            Validity & Governance
          </h3>
          <table style="width: 100%; font-size: 9.5pt;">
            <tr>
              <td style="color: #64748B; width: 40%; font-weight: 500;">Start Date:</td>
              <td style="font-weight: 600; font-family: monospace;">${doc.startDate}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 500;">Expiry Date:</td>
              <td style="font-weight: 800; font-family: monospace; color: #B91C1C;">${doc.expiryDate}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 500;">Renewal Amount:</td>
              <td style="font-weight: 700; color: #0B5D2A;">₹ ${(doc.amount || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 500;">Department:</td>
              <td style="font-weight: 600;">${doc.department}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 500;">Responsible Person:</td>
              <td style="font-weight: 600;">${doc.responsiblePerson} ${doc.responsiblePhone ? `(${doc.responsiblePhone})` : ''}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Reminder Protocol -->
      <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 9pt;">
        <div style="font-weight: 700; color: #166534; margin-bottom: 4px;">
          Configured Alert Schedule & Multi-Channel Escalation
        </div>
        <div style="color: #15803D; font-size: 8.5pt;">
          <strong>Intervals:</strong> Triggering alerts at ${(doc.reminderDays || [60, 30, 15, 7, 0]).join(', ')} days prior to expiry &bull; 
          <strong>Channels:</strong> ${(doc.notificationChannels || ['email', 'system']).join(', ').toUpperCase()} &bull; 
          <strong>Primary Recipient:</strong> ${doc.responsibleEmail || 'compliance@casbiro.com'}
        </div>
      </div>

      <!-- Renewal History Audit Trail -->
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="font-size: 11pt; font-weight: 800; color: #0F172A; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">
            Complete Renewal History & Audit Ledger (${doc.renewalCount || 0} Renewals)
          </h3>
          <span style="font-size: 8pt; color: #64748B;">Immutable Audit Log</span>
        </div>
        <table style="width: 100%; font-size: 8.5pt;">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Authorized By</th>
              <th>Prior Validity</th>
              <th>Renewed Term</th>
              <th>Amount</th>
              <th>Invoice / Ref</th>
            </tr>
          </thead>
          <tbody>
            ${renewalRows}
          </tbody>
        </table>
      </div>

      ${
        doc.remarks
          ? `
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; margin-bottom: 24px; font-size: 9pt;">
          <strong>Document Remarks & Notes:</strong>
          <p style="margin: 4px 0 0 0; color: #475569;">${doc.remarks}</p>
        </div>
      `
          : ''
      }

      <!-- Signatures & Verification Seal -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #CBD5E1;">
        <div style="text-align: center; width: 200px;">
          <div style="height: 45px; border-bottom: 1px solid #94A3B8; margin-bottom: 6px;"></div>
          <div style="font-size: 9pt; font-weight: 700; color: #334155;">Department Head</div>
          <div style="font-size: 8pt; color: #64748B;">${doc.department}</div>
        </div>

        <div style="text-align: center; border: 2px dashed #0B5D2A; border-radius: 50%; width: 90px; height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0B5D2A; font-size: 7pt; font-weight: 800; text-transform: uppercase;">
          <span>CASBIRO ERP</span>
          <span style="font-size: 6.5pt; color: #166534;">VERIFIED</span>
          <span>COMPLIANCE</span>
        </div>

        <div style="text-align: center; width: 200px;">
          <div style="height: 45px; border-bottom: 1px solid #94A3B8; margin-bottom: 6px;"></div>
          <div style="font-size: 9pt; font-weight: 700; color: #334155;">Compliance Officer</div>
          <div style="font-size: 8pt; color: #64748B;">Authorized Signatory</div>
        </div>
      </div>
    </div>
  `;

  printHtmlDocument(html, `Certificate_${doc.referenceNumber}_${doc.documentName}`);
}

/**
 * Generates and prints the full Documents Registry tabular report
 */
export function printRegistryReport(documents: ExpiryDocument[], filterMeta?: { filterDescription?: string }): void {
  const nowStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const totalAmount = documents.reduce((acc, d) => acc + (d.amount || 0), 0);
  const expiredCount = documents.filter((d) => d.status === 'Expired').length;
  const expiringCount = documents.filter((d) => d.status === 'Expiring').length;
  const activeCount = documents.filter((d) => d.status === 'Active' || d.status === 'Renewed').length;

  const rows = documents
    .map(
      (d, idx) => `
      <tr>
        <td style="font-family: monospace; font-size: 8pt; font-weight: 600;">${idx + 1}</td>
        <td>
          <div style="font-weight: 700; color: #0F172A;">${d.documentName}</div>
          <div style="font-size: 7.5pt; color: #64748B;">Ref: ${d.referenceNumber}</div>
        </td>
        <td><span style="font-weight: 600; color: #0B5D2A;">${d.documentTypeName}</span></td>
        <td>
          <div>${d.relatedParty}</div>
          <div style="font-size: 7.5pt; color: #64748B;">${d.department}</div>
        </td>
        <td style="font-family: monospace; font-size: 8.5pt;">${d.startDate}</td>
        <td style="font-family: monospace; font-size: 8.5pt; font-weight: 700; color: ${
          d.status === 'Expired' ? '#DC2626' : d.status === 'Expiring' ? '#D97706' : '#0F172A'
        };">
          ${d.expiryDate}
        </td>
        <td>
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5pt; font-weight: 700; ${
            d.status === 'Active'
              ? 'background: #DEF7EC; color: #03543F;'
              : d.status === 'Expiring'
              ? 'background: #FEF08A; color: #854D0E;'
              : d.status === 'Expired'
              ? 'background: #FDE8E8; color: #9B1C1C;'
              : 'background: #E1EFFE; color: #1E429F;'
          }">
            ${d.status}
          </span>
        </td>
        <td style="font-weight: 700; text-align: right;">₹ ${(d.amount || 0).toLocaleString()}</td>
        <td style="font-size: 8pt;">${d.responsiblePerson}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0B5D2A; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 16pt; font-weight: 800; color: #0F172A; margin: 0 0 4px 0;">
            Document & Expiry Management Registry Report
          </h1>
          <p style="font-size: 8.5pt; color: #64748B; margin: 0;">
            Casbiro ERP &bull; Generated: ${nowStr} ${filterMeta?.filterDescription ? `&bull; Scope: ${filterMeta.filterDescription}` : ''}
          </p>
        </div>
        <div style="text-align: right; font-size: 8.5pt;">
          <div style="font-weight: 700; color: #0B5D2A;">Total Registered: ${documents.length} Records</div>
          <div style="color: #64748B;">Total Renewal Exposure: ₹ ${totalAmount.toLocaleString()}</div>
        </div>
      </div>

      <!-- Quick Summary Stats Bar -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; font-size: 8.5pt;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 12px; border-radius: 6px;">
          <span style="color: #64748B;">Total Documents:</span> <strong style="color: #0F172A;">${documents.length}</strong>
        </div>
        <div style="background: #DEF7EC; border: 1px solid #BCF0DA; padding: 8px 12px; border-radius: 6px;">
          <span style="color: #03543F;">Active / Renewed:</span> <strong style="color: #03543F;">${activeCount}</strong>
        </div>
        <div style="background: #FEF08A; border: 1px solid #FDE047; padding: 8px 12px; border-radius: 6px;">
          <span style="color: #854D0E;">Expiring Soon:</span> <strong style="color: #854D0E;">${expiringCount}</strong>
        </div>
        <div style="background: #FDE8E8; border: 1px solid #F8B4B4; padding: 8px 12px; border-radius: 6px;">
          <span style="color: #9B1C1C;">Lapsed / Expired:</span> <strong style="color: #9B1C1C;">${expiredCount}</strong>
        </div>
      </div>

      <table style="width: 100%; font-size: 8.5pt; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th>Document & Reference</th>
            <th>Type</th>
            <th>Related Party & Dept</th>
            <th>Start Date</th>
            <th>Expiry Date</th>
            <th>Status</th>
            <th style="text-align: right;">Amount</th>
            <th>Responsible</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #CBD5E1; display: flex; justify-content: space-between; font-size: 8pt; color: #94A3B8;">
        <span>CONFIDENTIAL &bull; Internal ERP Compliance Report &bull; Casbiro Group</span>
        <span>Printed by ERP Authorized User</span>
      </div>
    </div>
  `;

  printHtmlDocument(html, `Document_Registry_Report_${nowStr}`);
}

/**
 * Generates and prints the complete Renewal Audit Trail History Ledger
 */
export function printRenewalLedgerReport(
  renewals: Array<{ record: DocumentRenewalRecord; parentDoc: ExpiryDocument }>
): void {
  const nowStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const totalSpend = renewals.reduce((acc, r) => acc + (r.record.newAmount || 0), 0);

  const rows = renewals
    .map(
      (item, idx) => `
      <tr>
        <td style="font-family: monospace; font-size: 8pt; font-weight: 600;">${idx + 1}</td>
        <td>
          <div style="font-weight: 700; color: #0F172A;">${item.parentDoc.documentName}</div>
          <div style="font-size: 7.5pt; color: #64748B;">Type: ${item.parentDoc.documentTypeName} &bull; Ref: ${item.parentDoc.referenceNumber}</div>
        </td>
        <td style="font-family: monospace; font-size: 8pt;">${item.record.renewalDate || item.record.createdAt?.split('T')[0]}</td>
        <td>
          <div style="font-weight: 600;">${item.record.renewedBy}</div>
          <div style="font-size: 7.5pt; color: #64748B;">${item.record.vendorOrIssuer || item.parentDoc.relatedParty}</div>
        </td>
        <td style="font-family: monospace; font-size: 8pt; color: #64748B;">${item.record.previousStartDate} → ${item.record.previousExpiryDate}</td>
        <td style="font-family: monospace; font-size: 8pt; font-weight: 700; color: #0B5D2A;">${item.record.newStartDate} → ${item.record.newExpiryDate}</td>
        <td style="font-weight: 700; text-align: right;">₹ ${(item.record.newAmount || 0).toLocaleString()}</td>
        <td style="font-family: monospace; font-size: 8pt;">${item.record.invoiceOrReceiptNumber || '—'}</td>
        <td style="font-size: 7.5pt; color: #475569; max-width: 140px;">${item.record.remarks || '—'}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0B5D2A; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 16pt; font-weight: 800; color: #0F172A; margin: 0 0 4px 0;">
            Document Renewal History & Audit Ledger
          </h1>
          <p style="font-size: 8.5pt; color: #64748B; margin: 0;">
            Casbiro ERP &bull; Cumulative Transaction Audit &bull; Generated: ${nowStr}
          </p>
        </div>
        <div style="text-align: right; font-size: 8.5pt;">
          <div style="font-weight: 700; color: #0B5D2A;">Total Renewals: ${renewals.length} Records</div>
          <div style="color: #64748B;">Cumulative Spend: ₹ ${totalSpend.toLocaleString()}</div>
        </div>
      </div>

      <table style="width: 100%; font-size: 8pt; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="width: 25px;">#</th>
            <th>Document Name & Details</th>
            <th>Date</th>
            <th>Authorized Approver & Issuer</th>
            <th>Prior Term</th>
            <th>Renewed Term</th>
            <th style="text-align: right;">Amount</th>
            <th>Invoice / Ref</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #CBD5E1; display: flex; justify-content: space-between; font-size: 8pt; color: #94A3B8;">
        <span>CONFIDENTIAL &bull; Complete Audit Trail Ledger &bull; Casbiro Group ERP</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  `;

  printHtmlDocument(html, `Renewal_Audit_Ledger_${nowStr}`);
}
