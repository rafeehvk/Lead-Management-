import { getAccessToken } from './gmailAuthService';
import { GoogleMeetSpace, GoogleMeetConferenceRecord } from '../types';

/**
 * Create a new Google Meet space using Google Meet v2 API
 */
export async function createMeetSpace(options?: {
  accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
  entryPointAccess?: 'ALL' | 'CREATOR_APP_ONLY';
}): Promise<GoogleMeetSpace> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace. Please sign in first.');

  const bodyPayload: any = {};
  if (options?.accessType || options?.entryPointAccess) {
    bodyPayload.config = {
      ...(options.accessType ? { accessType: options.accessType } : { accessType: 'OPEN' }),
      ...(options.entryPointAccess ? { entryPointAccess: options.entryPointAccess } : { entryPointAccess: 'ALL' }),
    };
  }

  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `Failed to create Google Meet space: ${res.statusText} (${res.status})`
    );
  }

  const data = await res.json();
  return {
    name: data.name,
    meetingUri: data.meetingUri,
    meetingCode: data.meetingCode,
    config: data.config,
    activeConference: data.activeConference,
  };
}

/**
 * Get details of an existing Google Meet space
 */
export async function getMeetSpace(spaceName: string): Promise<GoogleMeetSpace> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace.');

  // If spaceName doesn't start with spaces/, prepend it
  const formattedName = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;

  const res = await fetch(`https://meet.googleapis.com/v2/${formattedName}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `Failed to get Google Meet space: ${res.statusText}`
    );
  }

  const data = await res.json();
  return {
    name: data.name,
    meetingUri: data.meetingUri,
    meetingCode: data.meetingCode,
    config: data.config,
    activeConference: data.activeConference,
  };
}

/**
 * List past Conference Records (logs, meeting duration, history)
 */
export async function listConferenceRecords(pageSize: number = 15): Promise<GoogleMeetConferenceRecord[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace.');

  try {
    const res = await fetch(
      `https://meet.googleapis.com/v2/conferenceRecords?pageSize=${pageSize}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('Could not fetch conference records:', err);
      return [];
    }

    const data = await res.json();
    return (data.conferenceRecords || []).map((cr: any) => ({
      name: cr.name,
      startTime: cr.startTime,
      endTime: cr.endTime,
      expireTime: cr.expireTime,
      space: cr.space,
    }));
  } catch (e) {
    console.warn('Error querying conference records:', e);
    return [];
  }
}

/**
 * Fetch participants for a specific conference record
 */
export async function getConferenceParticipants(conferenceRecordName: string): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const res = await fetch(`https://meet.googleapis.com/v2/${conferenceRecordName}/participants`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.participants || [];
  } catch {
    return [];
  }
}
