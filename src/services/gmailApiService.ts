import { getAccessToken } from './gmailAuthService';

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  labelIds: string[];
  date: string;
  from: string;
  to: string;
  subject: string;
  isUnread: boolean;
  bodyText?: string;
  bodyHtml?: string;
}

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

// Utility to decode base64url data safely
function decodeBase64Url(str: string): string {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    try {
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return str;
    }
  }
}

// Utility to encode text to base64url for RFC 2822 transmission
function encodeBase64Url(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Fetch authenticated user's Gmail profile information
 */
export async function getGmailProfile(): Promise<GmailUserProfile> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Gmail');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Gmail profile: ${res.statusText}`);
  }

  return res.json();
}

/**
 * List messages matching an optional search query or label
 */
export async function listGmailMessages(options?: {
  query?: string;
  maxResults?: number;
  labelIds?: string[];
}): Promise<{ messages: { id: string; threadId: string }[]; nextPageToken?: string; resultSizeEstimate: number }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Gmail');

  const params = new URLSearchParams();
  if (options?.query) params.append('q', options.query);
  if (options?.maxResults) params.append('maxResults', options.maxResults.toString());
  if (options?.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach((l) => params.append('labelIds', l));
  }

  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list messages: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    messages: data.messages || [],
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate || 0,
  };
}

/**
 * Fetch full message details and parsed bodies
 */
export async function getGmailMessage(messageId: string): Promise<GmailMessageSummary> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Gmail');

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to get message: ${res.statusText}`);
  }

  const msg = await res.json();
  const headers: GmailHeader[] = msg.payload?.headers || [];

  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const subject = getHeader('Subject') || '(No Subject)';
  const from = getHeader('From') || '(Unknown Sender)';
  const to = getHeader('To') || '';
  const date = getHeader('Date') || new Date().toISOString();
  const isUnread = (msg.labelIds || []).includes('UNREAD');

  // Extract body parts
  let bodyText = '';
  let bodyHtml = '';

  const extractBody = (part: any) => {
    if (!part) return;
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText += decodeBase64Url(part.body.data) + '\n';
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml += decodeBase64Url(part.body.data);
    }
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(extractBody);
    }
  };

  if (msg.payload) {
    extractBody(msg.payload);
  }

  if (!bodyText && !bodyHtml && msg.snippet) {
    bodyText = msg.snippet;
  }

  return {
    id: msg.id,
    threadId: msg.threadId,
    snippet: msg.snippet || '',
    labelIds: msg.labelIds || [],
    date,
    from,
    to,
    subject,
    isUnread,
    bodyText,
    bodyHtml,
  };
}

/**
 * Send an email directly using Gmail API
 */
export async function sendGmailEmail({
  to,
  cc,
  bcc,
  subject,
  bodyText,
  bodyHtml,
  threadId,
}: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  threadId?: string;
}): Promise<{ id: string; threadId: string; labelIds: string[] }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Gmail');

  // Build RFC 2822 message format
  const boundary = `__boundary_mysar_${Date.now()}__`;
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  let emailLines: string[] = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : '',
    bcc ? `Bcc: ${bcc}` : '',
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
    '',
  ];

  if (bodyHtml) {
    emailLines = emailLines.concat([
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      bodyHtml,
      '',
    ]);
  }

  emailLines.push(`--${boundary}--`);

  const rawEmail = emailLines.filter((l) => l !== '').join('\r\n');
  const encodedRaw = encodeBase64Url(rawEmail);

  const payload: { raw: string; threadId?: string } = {
    raw: encodedRaw,
  };
  if (threadId) {
    payload.threadId = threadId;
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Save draft in user's Gmail account
 */
export async function createGmailDraft({
  to,
  subject,
  bodyText,
  bodyHtml,
}: {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
}): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Gmail');

  const boundary = `__boundary_mysar_draft_${Date.now()}__`;
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
    '',
    bodyHtml ? `--${boundary}` : '',
    bodyHtml ? 'Content-Type: text/html; charset=UTF-8' : '',
    bodyHtml ? 'Content-Transfer-Encoding: 7bit' : '',
    bodyHtml ? '' : '',
    bodyHtml ? bodyHtml : '',
    `--${boundary}--`,
  ];

  const rawEmail = emailLines.filter(Boolean).join('\r\n');
  const encodedRaw = encodeBase64Url(rawEmail);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: { raw: encodedRaw },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create draft: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Delete a message from Gmail
 */
export async function deleteGmailMessage(messageId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Gmail');

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete message: ${res.statusText}`);
  }
}
