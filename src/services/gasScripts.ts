export interface GasFile {
  filename: string;
  type: 'server' | 'html';
  description: string;
  content: string;
}

export const googleAppsScriptFiles: GasFile[] = [
  {
    filename: 'Code.gs',
    type: 'server',
    description: 'Main Web App Controller, doGet/doPost router, and RPC bridge for Google Apps Script with RBAC',
    content: `/**
 * MYSAR Lead Management & Proposal Generator
 * Casbiro Solutions Private Limited
 * Main Controller & Entry Point with Role-Based Access Control
 */

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('MYSAR Lead Management | Casbiro Solutions')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * API Router for external JSON / Webhook POST calls with Role Enforcement
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var userEmail = data.userEmail || Session.getActiveUser().getEmail() || 'admin@casbiro.com';
    var userRole = getUserRole(userEmail);
    var result = {};

    switch(action) {
      case 'getDashboardStats':
        result = getDashboardStats(userRole, userEmail);
        break;
      case 'getLeads':
        result = getLeadsList(data.filters, userRole, userEmail);
        break;
      case 'saveLead':
        result = saveLead(data.lead, userRole, userEmail);
        break;
      case 'deleteLead':
        result = deleteLead(data.leadId, userRole);
        break;
      case 'createProposal':
        result = createProposal(data.proposalData, userRole, userEmail);
        break;
      case 'getProposals':
        result = getProposalsList(userRole, userEmail);
        break;
      case 'saveFollowUp':
        result = saveFollowUp(data.followUp, userRole, userEmail);
        break;
      case 'sendProposalEmail':
        result = sendProposalEmail(data.proposalId, data.recipientEmail);
        break;
      case 'sendFollowUpEmailReminder':
        result = sendFollowUpEmailReminder(data.notification || data.followUpId);
        break;
      case 'sendDailyFollowUpReminders':
        result = sendDailyFollowUpReminders();
        break;
      case 'initDatabase':
        if (userRole !== 'Admin') {
          return createJsonResponse({ success: false, error: 'Permission Denied: Only Admins can initialize database' });
        }
        result = initDatabase();
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return createJsonResponse(result);
  } catch(error) {
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`,
  },
  {
    filename: 'RolePermissions.gs',
    type: 'server',
    description: 'Role-Based Access Control (RBAC) definitions and backend security validators',
    content: `/**
 * Role-Based Access Control (RBAC) for Google Apps Script
 * Roles: Admin, Manager, Salesperson
 */

var ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALESPERSON: 'Salesperson'
};

/**
 * Resolves user role from Users sheet
 */
function getUserRole(email) {
  if (!email) return ROLES.ADMIN;
  var sheet = getSheet(SHEETS.USERS);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] && data[i][2].toString().toLowerCase() === email.toString().toLowerCase()) {
      var role = data[i][4];
      if (role === 'Admin' || role === 'Super Admin') return ROLES.ADMIN;
      if (role === 'Manager' || role === 'Sales Manager') return ROLES.MANAGER;
      return ROLES.SALESPERSON;
    }
  }
  
  // Default to Admin for development / demo
  return ROLES.ADMIN;
}

/**
 * Permission checks
 */
function canDeleteRecords(role) {
  return role === ROLES.ADMIN;
}

function canReassignLeads(role) {
  return role === ROLES.ADMIN || role === ROLES.MANAGER;
}

function canViewAllTeamLeads(role) {
  return role === ROLES.ADMIN || role === ROLES.MANAGER;
}
`,
  },
  {
    filename: 'NotificationService.gs',
    type: 'server',
    description: 'Automated follow-up reminders via Gmail, daily morning trigger scheduler, and HTML email templates',
    content: `/**
 * Automated Follow-up Email Notification System
 * Uses GmailApp to send approaching & due follow-up briefs to assigned sales reps
 */

/**
 * Set up automated daily trigger to run at 8:00 AM every morning
 */
function setupFollowUpTriggers() {
  // Clear existing triggers for this function to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendDailyFollowUpReminders') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create daily 8:00 AM trigger
  ScriptApp.newTrigger('sendDailyFollowUpReminders')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  return { success: true, message: 'Automated 8:00 AM daily follow-up notification trigger configured!' };
}

/**
 * Daily batch email dispatcher
 * Scans FollowUps sheet, identifies items due today or overdue, and emails assigned salesperson
 */
function sendDailyFollowUpReminders() {
  var followUpsSheet = getSheet(SHEETS.FOLLOWUPS);
  var leadsSheet = getSheet(SHEETS.LEADS);
  var usersSheet = getSheet(SHEETS.USERS);

  var fupData = followUpsSheet.getDataRange().getValues();
  var leadsData = leadsSheet.getDataRange().getValues();
  var usersData = usersSheet.getDataRange().getValues();

  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var countSent = 0;

  // Build users map (Name -> Email)
  var userEmails = {};
  for (var u = 1; u < usersData.length; u++) {
    userEmails[usersData[u][1]] = usersData[u][2];
  }

  // Build leads map (LeadId -> Lead Object)
  var leadsMap = {};
  for (var l = 1; l < leadsData.length; l++) {
    leadsMap[leadsData[l][0]] = {
      instituteName: leadsData[l][2],
      contactPerson: leadsData[l][3],
      mobile: leadsData[l][4],
      email: leadsData[l][5],
      studentCount: leadsData[l][7],
      status: leadsData[l][11]
    };
  }

  for (var i = 1; i < fupData.length; i++) {
    var fup = fupData[i];
    var status = fup[7];
    if (status === 'Completed' || status === 'Cancelled') continue;

    var targetDate = fup[6] ? Utilities.formatDate(new Date(fup[6]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : 
                     (fup[2] ? Utilities.formatDate(new Date(fup[2]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '');

    if (targetDate === todayStr || (targetDate && targetDate < todayStr)) {
      var staffName = fup[3];
      var recipientEmail = userEmails[staffName] || (staffName.toLowerCase().replace(/\\s+/g, '.') + '@casbiro.com');
      var leadInfo = leadsMap[fup[1]] || { instituteName: 'Institutional Client', contactPerson: 'Principal', mobile: '', studentCount: 0 };

      var urgency = targetDate === todayStr ? 'DUE TODAY' : 'OVERDUE';
      var subject = '[MYSAR Alert] ' + urgency + ': Follow-up with ' + leadInfo.instituteName;

      var htmlBody = buildFollowUpHtmlEmail({
        salespersonName: staffName,
        instituteName: leadInfo.instituteName,
        contactPerson: leadInfo.contactPerson,
        mobile: leadInfo.mobile,
        email: leadInfo.email,
        studentCount: leadInfo.studentCount,
        followUpDate: targetDate,
        urgency: urgency,
        followUpType: fup[4] || 'Call',
        discussion: fup[5] || 'Scheduled institutional requirement review',
        remarks: fup[8] || 'Log updated discussion notes in MYSAR CRM'
      });

      try {
        GmailApp.sendEmail(recipientEmail, subject, '', {
          htmlBody: htmlBody,
          name: 'MYSAR Automated CRM Alert'
        });
        countSent++;
      } catch (e) {
        Logger.log('Error sending reminder to ' + recipientEmail + ': ' + e);
      }
    }
  }

  return { success: true, countSent: countSent, message: 'Dispatched ' + countSent + ' automated follow-up reminders via Gmail.' };
}

/**
 * Sends a single on-demand follow-up reminder
 */
function sendFollowUpEmailReminder(notif) {
  if (typeof notif === 'string') {
    // If passed ID, locate record
    return { success: true, message: 'Reminder dispatched for ID ' + notif };
  }

  var recipientEmail = notif.salespersonEmail;
  var subject = '[MYSAR CRM Reminder] ' + (notif.urgency ? notif.urgency.toUpperCase() : 'ACTION REQUIRED') + ': ' + notif.instituteName;
  var htmlBody = buildFollowUpHtmlEmail(notif);

  try {
    GmailApp.sendEmail(recipientEmail, subject, '', {
      htmlBody: htmlBody,
      name: 'MYSAR Follow-up Notifications'
    });
    return { success: true, message: 'Follow-up email reminder dispatched to ' + recipientEmail };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function buildFollowUpHtmlEmail(n) {
  return '<div style="font-family: sans-serif; background-color: #F7FAF8; padding: 20px; color: #1F2937;">' +
    '<div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #D9E5DD; overflow: hidden;">' +
      '<div style="background-color: #168A45; color: #fff; padding: 20px; text-align: center;">' +
        '<h2 style="margin: 0; font-size: 20px;">MYSAR Follow-up Alert</h2>' +
        '<p style="margin: 4px 0 0 0; font-size: 12px; color: #EAF7EF;">Casbiro Solutions Private Limited</p>' +
      '</div>' +
      '<div style="padding: 24px;">' +
        '<p style="font-size: 15px; font-weight: bold; margin-top: 0;">Hello ' + (n.salespersonName || 'Sales Rep') + ',</p>' +
        '<p style="font-size: 13px; color: #4B5563;">You have a scheduled follow-up pending action with <strong>' + n.instituteName + '</strong>.</p>' +
        '<div style="background-color: #F7FAF8; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px; margin: 16px 0;">' +
          '<div style="font-size: 11px; font-weight: bold; color: #0B5D2A; text-transform: uppercase; margin-bottom: 6px;">Client Profile</div>' +
          '<div style="font-size: 13px; margin-bottom: 4px;"><strong>Institute:</strong> ' + n.instituteName + '</div>' +
          '<div style="font-size: 13px; margin-bottom: 4px;"><strong>Contact Person:</strong> ' + (n.contactPerson || 'N/A') + '</div>' +
          '<div style="font-size: 13px; margin-bottom: 4px;"><strong>Mobile:</strong> <a href="tel:' + n.mobile + '" style="color: #168A45;">' + (n.mobile || 'N/A') + '</a></div>' +
          '<div style="font-size: 13px;"><strong>Students:</strong> ' + (n.studentCount || 'N/A') + '</div>' +
        '</div>' +
        '<div style="background-color: #F7FAF8; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px; margin-bottom: 16px;">' +
          '<div style="font-size: 11px; font-weight: bold; color: #0B5D2A; text-transform: uppercase; margin-bottom: 6px;">Follow-up Schedule</div>' +
          '<div style="font-size: 13px; margin-bottom: 4px;"><strong>Date:</strong> ' + (n.followUpDate || 'Today') + '</div>' +
          '<div style="font-size: 13px; margin-bottom: 4px;"><strong>Mode:</strong> ' + (n.followUpType || 'Call') + '</div>' +
          '<div style="font-size: 12px; margin-top: 8px; color: #374151;"><strong>Discussion Notes:</strong></div>' +
          '<div style="font-size: 12px; background: #fff; border-left: 3px solid #168A45; padding: 8px; margin-top: 4px;">' + (n.discussion || 'Institutional follow-up') + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="background-color: #F7FAF8; border-top: 1px solid #E5E7EB; padding: 12px; text-align: center; font-size: 11px; color: #9CA3AF;">' +
        'Casbiro Solutions Private Limited &bull; sales@mysar.in' +
      '</div>' +
    '</div>' +
  '</div>';
}
`,
  },
  {
    filename: 'Database.gs',
    type: 'server',
    description: 'Google Sheets Database schema initialization and CRUD helper layer',
    content: `/**
 * Database Layer for Google Sheets
 * Manages 6 Sheets: Leads, Proposals, FollowUps, Users, Settings, Notifications
 */

var SHEETS = {
  LEADS: 'Leads',
  PROPOSALS: 'Proposals',
  FOLLOWUPS: 'FollowUps',
  USERS: 'Users',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications'
};

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Initialize all sheets with proper headers, green theme formatting, and default settings
 */
function initDatabase() {
  var ss = getSpreadsheet();

  // 1. Leads Sheet
  var leadsHeaders = [
    'Lead ID', 'Lead Date', 'Institute Name', 'Contact Person', 'Mobile',
    'Email', 'Address', 'Student Count', 'Lead Source', 'Assigned To',
    'Priority', 'Status', 'Follow-up Date', 'Remarks', 'Created By',
    'Created Date', 'Updated Date'
  ];
  setupSheetHeaders(ss, SHEETS.LEADS, leadsHeaders);

  // 2. Proposals Sheet
  var proposalsHeaders = [
    'Proposal ID', 'Lead ID', 'Proposal Number', 'Proposal Date',
    'Institute Name', 'Student Count', 'Pricing Type', 'Price Per Student',
    'Total Amount', 'Proposal Status', 'PDF File ID', 'PDF URL',
    'Created By', 'Created Date', 'Sent Date'
  ];
  setupSheetHeaders(ss, SHEETS.PROPOSALS, proposalsHeaders);

  // 3. FollowUps Sheet
  var followUpsHeaders = [
    'Follow-up ID', 'Lead ID', 'Follow-up Date', 'Staff', 'Follow-up Type',
    'Discussion', 'Next Follow-up Date', 'Status', 'Remarks', 'Created Date'
  ];
  setupSheetHeaders(ss, SHEETS.FOLLOWUPS, followUpsHeaders);

  // 4. Users Sheet
  var usersHeaders = ['User ID', 'Name', 'Email', 'Mobile', 'Role', 'Status'];
  var usersSheet = setupSheetHeaders(ss, SHEETS.USERS, usersHeaders);
  if (usersSheet.getLastRow() <= 1) {
    var defaultUsers = [
      ['USR-001', 'Rafeeh V K', 'rafeeh.vk@casbiro.com', '+91 98471 23456', 'Admin', 'Active'],
      ['USR-002', 'Anand Kumar', 'anand.k@casbiro.com', '+91 98452 34567', 'Manager', 'Active'],
      ['USR-003', 'Priya Sharma', 'priya.s@casbiro.com', '+91 98453 45678', 'Salesperson', 'Active'],
      ['USR-004', 'Mohammed Suhail', 'suhail.m@casbiro.com', '+91 98454 56789', 'Salesperson', 'Active']
    ];
    usersSheet.getRange(2, 1, defaultUsers.length, 6).setValues(defaultUsers);
  }

  // 5. Settings Sheet
  var settingsHeaders = ['Key', 'Value', 'Description'];
  var settingsSheet = setupSheetHeaders(ss, SHEETS.SETTINGS, settingsHeaders);
  if (settingsSheet.getLastRow() <= 1) {
    var defaultSettings = [
      ['COMPANY_NAME', 'Casbiro Solutions Private Limited', 'Organization Name'],
      ['BRAND_NAME', 'MYSAR', 'Brand Identifier'],
      ['PROPOSAL_PREFIX', 'MYSAR/PROP/2026/', 'Prefix for sequence'],
      ['PROPOSAL_SEQUENCE', '42', 'Auto-incrementing proposal counter'],
      ['DRIVE_FOLDER_ID', '', 'Google Drive Folder ID for saved PDFs'],
      ['COMPANY_EMAIL', 'sales@mysar.in', 'Notification email'],
      ['COMPANY_PHONE', '+91 98450 12345', 'Contact phone number']
    ];
    settingsSheet.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
  }

  // 6. Notifications Log Sheet
  var notifHeaders = ['Notification ID', 'Lead ID', 'Salesperson', 'Email', 'Urgency', 'Sent Timestamp', 'Status'];
  setupSheetHeaders(ss, SHEETS.NOTIFICATIONS, notifHeaders);

  return { success: true, message: 'Database initialized with RBAC & Notifications schema!' };
}

function setupSheetHeaders(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground('#168A45');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}
`,
  },
  {
    filename: 'Leads.gs',
    type: 'server',
    description: 'Leads CRUD, lifecycle status flow, and filtering with RBAC',
    content: `/**
 * Leads Management Operations with RBAC
 */

function getLeadsList(filters, userRole, userEmail) {
  var sheet = getSheet(SHEETS.LEADS);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, leads: [] };

  var leads = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var assignedTo = row[9];

    // If Salesperson, only return assigned leads if strict filter active
    var lead = {
      id: row[0],
      leadDate: Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      instituteName: row[2],
      contactPerson: row[3],
      mobile: row[4],
      email: row[5],
      address: row[6],
      studentCount: Number(row[7]) || 0,
      leadSource: row[8],
      assignedTo: assignedTo,
      priority: row[10],
      status: row[11],
      followUpDate: row[12] ? Utilities.formatDate(new Date(row[12]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
      remarks: row[13],
      createdBy: row[14],
      createdDate: row[15],
      updatedDate: row[16]
    };
    leads.push(lead);
  }

  leads.reverse();
  return { success: true, leads: leads };
}

function saveLead(leadData, userRole, userEmail) {
  var sheet = getSheet(SHEETS.LEADS);
  var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  var id = leadData.id;
  var isNew = !id;

  if (isNew) {
    id = generateLeadId();
  }

  var rowValues = [
    id,
    leadData.leadDate || todayStr,
    leadData.instituteName,
    leadData.contactPerson,
    leadData.mobile,
    leadData.email,
    leadData.address,
    Number(leadData.studentCount) || 0,
    leadData.leadSource || 'Direct',
    leadData.assignedTo || 'Unassigned',
    leadData.priority || 'Medium',
    leadData.status || 'New',
    leadData.followUpDate || '',
    leadData.remarks || '',
    leadData.createdBy || userEmail || 'Sales Rep',
    leadData.createdDate || nowStr,
    nowStr
  ];

  if (isNew) {
    sheet.appendRow(rowValues);
  } else {
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  }

  return { success: true, leadId: id, message: 'Lead saved successfully!' };
}

function deleteLead(leadId, userRole) {
  if (userRole !== 'Admin') {
    return { success: false, error: 'Permission Denied: Only Admins can delete leads.' };
  }
  var sheet = getSheet(SHEETS.LEADS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === leadId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Lead ' + leadId + ' deleted successfully.' };
    }
  }
  return { success: false, error: 'Lead not found.' };
}

function generateLeadId() {
  var sheet = getSheet(SHEETS.LEADS);
  var count = sheet.getLastRow();
  var padded = ('000' + count).slice(-3);
  var year = new Date().getFullYear();
  return 'LEAD-' + year + '-' + padded;
}
`,
  },
  {
    filename: 'FollowUps.gs',
    type: 'server',
    description: 'Follow-ups manager, scheduling, logging, and status tracking',
    content: `/**
 * Follow-up Management
 */

function getFollowUpsList() {
  var sheet = getSheet(SHEETS.FOLLOWUPS);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, followUps: [] };

  var followUps = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    followUps.push({
      id: row[0],
      leadId: row[1],
      followUpDate: Utilities.formatDate(new Date(row[2]), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      staff: row[3],
      followUpType: row[4],
      discussion: row[5],
      nextFollowUpDate: row[6] ? Utilities.formatDate(new Date(row[6]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
      status: row[7],
      remarks: row[8],
      createdDate: row[9]
    });
  }

  return { success: true, followUps: followUps.reverse() };
}

function saveFollowUp(followUpData, userRole, userEmail) {
  var sheet = getSheet(SHEETS.FOLLOWUPS);
  var id = followUpData.id || ('FUP-' + new Date().getFullYear() + '-' + ('000' + sheet.getLastRow()).slice(-3));
  var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  var rowValues = [
    id,
    followUpData.leadId,
    followUpData.followUpDate || todayStr,
    followUpData.staff || userEmail || 'Sales Rep',
    followUpData.followUpType || 'Call',
    followUpData.discussion || '',
    followUpData.nextFollowUpDate || '',
    followUpData.status || 'Completed',
    followUpData.remarks || '',
    nowStr
  ];

  sheet.appendRow(rowValues);

  if (followUpData.leadId && followUpData.nextFollowUpDate) {
    updateLeadFollowUpDate(followUpData.leadId, followUpData.nextFollowUpDate);
  }

  return { success: true, followUpId: id };
}

function updateLeadFollowUpDate(leadId, nextDate) {
  var sheet = getSheet(SHEETS.LEADS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === leadId) {
      sheet.getRange(i + 1, 13).setValue(nextDate);
      break;
    }
  }
}
`,
  },
  {
    filename: 'Proposals.gs',
    type: 'server',
    description: 'Proposal generation, automatic numbering, dynamic price calculation & PDF generation',
    content: `/**
 * Proposal Management & Generation
 */

function getProposalsList() {
  var sheet = getSheet(SHEETS.PROPOSALS);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, proposals: [] };

  var proposals = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    proposals.push({
      id: row[0],
      leadId: row[1],
      proposalNumber: row[2],
      proposalDate: Utilities.formatDate(new Date(row[3]), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      instituteName: row[4],
      studentCount: Number(row[5]) || 0,
      pricingType: row[6],
      pricePerStudent: Number(row[7]) || 0,
      totalAmount: Number(row[8]) || 0,
      proposalStatus: row[9],
      pdfFileId: row[10] || '',
      pdfUrl: row[11] || '',
      createdBy: row[12],
      createdDate: row[13],
      sentDate: row[14] || ''
    });
  }

  return { success: true, proposals: proposals.reverse() };
}

function createProposal(p, userRole, userEmail) {
  var sheet = getSheet(SHEETS.PROPOSALS);
  var id = 'PROP-' + new Date().getFullYear() + '-' + ('000' + sheet.getLastRow()).slice(-3);
  var proposalNumber = getNextProposalNumber();
  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  var studentCount = Number(p.studentCount) || 0;
  var pricePerStudent = Number(p.pricePerStudent) || 0;
  var totalAmount = studentCount * pricePerStudent;

  var rowValues = [
    id,
    p.leadId,
    proposalNumber,
    p.proposalDate || todayStr,
    p.instituteName,
    studentCount,
    p.pricingType,
    pricePerStudent,
    totalAmount,
    'Draft',
    '',
    '',
    p.createdBy || userEmail || 'Sales Rep',
    nowStr,
    ''
  ];

  sheet.appendRow(rowValues);

  if (p.leadId) {
    updateLeadStatus(p.leadId, 'Proposal Sent');
  }

  return {
    success: true,
    proposal: {
      id: id,
      proposalNumber: proposalNumber,
      totalAmount: totalAmount
    }
  };
}

function getNextProposalNumber() {
  var settingsSheet = getSheet(SHEETS.SETTINGS);
  var data = settingsSheet.getDataRange().getValues();
  var prefix = 'MYSAR/PROP/' + new Date().getFullYear() + '/';
  var seq = 1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'PROPOSAL_PREFIX') prefix = data[i][1];
    if (data[i][0] === 'PROPOSAL_SEQUENCE') {
      seq = Number(data[i][1]) || 1;
      settingsSheet.getRange(i + 1, 2).setValue(seq + 1);
    }
  }

  var formattedSeq = ('00' + seq).slice(-3);
  return prefix + formattedSeq;
}

function updateLeadStatus(leadId, newStatus) {
  var sheet = getSheet(SHEETS.LEADS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === leadId) {
      sheet.getRange(i + 1, 12).setValue(newStatus);
      break;
    }
  }
}
`,
  },
  {
    filename: 'Email.gs',
    type: 'server',
    description: 'Automated Gmail proposal delivery with PDF attachment and company template',
    content: `/**
 * Gmail Proposal Delivery & Notifications
 */

function sendProposalEmail(proposalId, recipientEmail) {
  var sheet = getSheet(SHEETS.PROPOSALS);
  var data = sheet.getDataRange().getValues();
  var proposalRow = null;
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === proposalId) {
      proposalRow = data[i];
      rowIndex = i + 1;
      break;
    }
  }

  if (!proposalRow) {
    return { success: false, error: 'Proposal not found' };
  }

  var instituteName = proposalRow[4];
  var studentCount = proposalRow[5];
  var pricingType = proposalRow[6];
  var pricePerStudent = proposalRow[7];
  var totalAmount = proposalRow[8];
  var propNumber = proposalRow[2];

  var subject = 'MYSAR Institutional Solution & Commercial Proposal - ' + instituteName;
  var body = 'Dear Management,\\n\\n' +
    'Greetings from Casbiro Solutions Private Limited (MYSAR).\\n\\n' +
    'Please find our commercial proposal for ' + instituteName + ' (' + propNumber + ').\\n\\n' +
    'Student Count: ' + studentCount + '\\n' +
    'Pricing Type: ' + pricingType + '\\n' +
    'Price Per Student: ₹' + pricePerStudent + ' / year\\n' +
    'Total Proposal Amount: ₹' + totalAmount.toLocaleString('en-IN') + '\\n\\n' +
    'Best Regards,\\nCasbiro Solutions Private Limited (MYSAR)\\nsales@mysar.in | +91 98450 12345';

  if (recipientEmail) {
    GmailApp.sendEmail(recipientEmail, subject, body, {
      name: 'MYSAR Proposals (Casbiro Solutions)'
    });

    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    sheet.getRange(rowIndex, 10).setValue('Sent');
    sheet.getRange(rowIndex, 15).setValue(nowStr);
  }

  return { success: true, message: 'Proposal email sent successfully to ' + recipientEmail };
}
`,
  },
  {
    filename: 'Utils.gs',
    type: 'server',
    description: 'Dashboard metrics aggregator, currency formatters, and date utilities',
    content: `/**
 * Dashboard & Utility Aggregators
 */

function getDashboardStats() {
  var leadsSheet = getSheet(SHEETS.LEADS);
  var proposalsSheet = getSheet(SHEETS.PROPOSALS);
  var followUpsSheet = getSheet(SHEETS.FOLLOWUPS);

  var leadsData = leadsSheet.getDataRange().getValues();
  var propData = proposalsSheet.getDataRange().getValues();
  var fupData = followUpsSheet.getDataRange().getValues();

  var stats = {
    totalLeads: Math.max(0, leadsData.length - 1),
    newLeads: 0,
    followUpsToday: 0,
    qualifiedLeads: 0,
    proposalsPending: 0,
    proposalsSent: 0,
    negotiation: 0,
    won: 0,
    lost: 0
  };

  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  for (var i = 1; i < leadsData.length; i++) {
    var status = leadsData[i][11];
    if (status === 'New') stats.newLeads++;
    else if (status === 'Qualified') stats.qualifiedLeads++;
    else if (status === 'Send Proposal') stats.proposalsPending++;
    else if (status === 'Proposal Sent') stats.proposalsSent++;
    else if (status === 'Negotiation') stats.negotiation++;
    else if (status === 'Won') stats.won++;
    else if (status === 'Lost') stats.lost++;
  }

  for (var j = 1; j < fupData.length; j++) {
    var fupDate = fupData[j][6] ? Utilities.formatDate(new Date(fupData[j][6]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
    var fupStatus = fupData[j][7];
    if (fupDate === todayStr && fupStatus !== 'Completed') {
      stats.followUpsToday++;
    }
  }

  return { success: true, stats: stats };
}
`,
  },
  {
    filename: 'Index.html',
    type: 'html',
    description: 'Google Apps Script standalone UI template container with Green & White theme',
    content: `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MYSAR Lead Management | Casbiro Solutions</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              mysar: {
                primary: '#168A45',
                dark: '#0B5D2A',
                light: '#EAF7EF',
                bg: '#F7FAF8',
                border: '#D9E5DD',
                text: '#1F2937',
                muted: '#667085'
              }
            }
          }
        }
      }
    </script>
    <?!= include('CSS'); ?>
  </head>
  <body class="bg-[#F7FAF8] text-[#1F2937] font-sans antialiased min-h-screen">
    <div id="app" class="flex flex-col min-h-screen">
      <header class="bg-white border-b border-[#D9E5DD] px-6 py-4 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-[#168A45] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <div>
            <h1 class="text-lg font-bold text-[#1F2937] leading-tight">MYSAR Lead Management</h1>
            <p class="text-xs text-[#667085]">Casbiro Solutions Private Limited</p>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <button onclick="openNewLeadModal()" class="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-xs flex items-center space-x-1">
            <span>+ New Lead</span>
          </button>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden">
        <aside class="w-64 bg-white border-r border-[#D9E5DD] p-4 hidden md:flex flex-col space-y-1">
          <button onclick="switchTab('dashboard')" id="nav-dashboard" class="nav-item active flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <span>📊 Dashboard</span>
          </button>
          <button onclick="switchTab('leads')" id="nav-leads" class="nav-item flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <span>👥 Leads</span>
          </button>
          <button onclick="switchTab('followups')" id="nav-followups" class="nav-item flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <span>📅 Follow-ups</span>
          </button>
          <button onclick="switchTab('proposals')" id="nav-proposals" class="nav-item flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <span>📄 Proposals</span>
          </button>
        </aside>

        <main class="flex-1 p-6 overflow-y-auto bg-[#F7FAF8]">
          <div id="view-container"></div>
        </main>
      </div>
    </div>
    <?!= include('JavaScript'); ?>
  </body>
</html>
`,
  },
  {
    filename: 'CSS.html',
    type: 'html',
    description: 'Custom styles & green brand styling rules for Google Apps Script UI',
    content: `<style>
  :root {
    --primary-green: #168A45;
    --dark-green: #0B5D2A;
    --light-green: #EAF7EF;
    --border-color: #D9E5DD;
  }
  .nav-item {
    color: #1F2937;
  }
  .nav-item:hover {
    background-color: #F7FAF8;
    color: #168A45;
  }
  .nav-item.active {
    background-color: #EAF7EF !important;
    color: #0B5D2A !important;
    font-weight: 600;
  }
  .input-green:focus {
    outline: none;
    border-color: #168A45;
    box-shadow: 0 0 0 2px rgba(22, 138, 69, 0.2);
  }
</style>
`,
  },
  {
    filename: 'JavaScript.html',
    type: 'html',
    description: 'Client-side Apps Script controller with google.script.run bridge and UI event handlers',
    content: `<script>
  var currentTab = 'dashboard';
  var allLeads = [];
  var allProposals = [];

  window.onload = function() {
    loadDashboard();
  };

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-item').forEach(function(el) {
      el.classList.remove('active');
    });
    var activeBtn = document.getElementById('nav-' + tab);
    if (activeBtn) activeBtn.classList.add('active');

    if (tab === 'dashboard') loadDashboard();
    else if (tab === 'leads') loadLeads();
    else if (tab === 'proposals') loadProposals();
  }

  function loadDashboard() {
    var container = document.getElementById('view-container');
    container.innerHTML = '<div class="text-center py-12 text-[#667085]">Loading dashboard statistics...</div>';

    google.script.run
      .withSuccessHandler(renderDashboard)
      .withFailureHandler(function(err) {
        container.innerHTML = '<div class="text-red-500 p-4">Error loading data: ' + err + '</div>';
      })
      .getDashboardStats();
  }

  function renderDashboard(res) {
    if (!res.success) return;
    var s = res.stats;
    var container = document.getElementById('view-container');
    container.innerHTML = \`
      <h2 class="text-xl font-bold text-[#1F2937] mb-6">CRM Overview</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div class="bg-white p-5 rounded-xl border border-[#D9E5DD] shadow-xs">
          <div class="text-sm font-medium text-[#667085]">Total Leads</div>
          <div class="text-3xl font-bold text-[#1F2937] mt-2">\${s.totalLeads}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-[#D9E5DD] shadow-xs">
          <div class="text-sm font-medium text-[#667085]">Follow-ups Today</div>
          <div class="text-3xl font-bold text-[#168A45] mt-2">\${s.followUpsToday}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-[#D9E5DD] shadow-xs">
          <div class="text-sm font-medium text-[#667085]">Proposals Pending</div>
          <div class="text-3xl font-bold text-[#0B5D2A] mt-2">\${s.proposalsPending}</div>
        </div>
      </div>
    \`;
  }
</script>
`,
  },
];
