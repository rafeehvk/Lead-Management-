import { Proposal } from '../types';

/**
 * Builds the direct customer acceptance & digital signature link
 * e.g. https://.../?signProposal=PROP-2026-001
 */
export const getProposalSignatureUrl = (proposalOrId: Proposal | string): string => {
  const proposalId = typeof proposalOrId === 'string' ? proposalOrId : proposalOrId.id;
  if (typeof window === 'undefined') {
    return `/?signProposal=${encodeURIComponent(proposalId)}`;
  }
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?signProposal=${encodeURIComponent(proposalId)}`;
};

/**
 * Generates a verifiable legal digital signature code
 * e.g. MYSAR-SIG-749281
 */
export const generateSignatureVerificationCode = (): string => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `MYSAR-ESIGN-${randomNum}`;
};

/**
 * Copies the signature link to clipboard with reliable fallback
 */
export const copySignatureLinkToClipboard = async (
  proposalOrId: Proposal | string
): Promise<boolean> => {
  const url = getProposalSignatureUrl(proposalOrId);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch (e) {
    console.warn('Navigator clipboard error, falling back to textarea execCommand', e);
  }

  // Fallback for iframe restrictions
  try {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
};
