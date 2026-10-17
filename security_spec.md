# MYSAR ERP Security Specification & Data Invariants

## 1. Core Invariants
- Leads must possess valid non-empty IDs, Institute Name, Contact Person, Mobile, and Status.
- FollowUps must possess valid leadId and status.
- Proposals must be tied to a valid lead and have a valid status.
- System Users can be listed and retrieved by authenticated system sessions.
- In multi-system environments, any authenticated client can read leads, submit new leads, and update lead statuses.

## 2. Dirty Dozen Threat Vectors
1. Malformed Lead without instituteName (missing mandatory business identifier).
2. Malformed Lead ID containing illegal path traversal tokens (`../`).
3. Lead record injecting script payload in remarks or contact person.
4. Attempted deletion of lead without valid identifier.
5. Follow-up created with non-existent or blank leadId.
6. Proposal created with negative amount values or NaN.
7. Unauthenticated write attempt to /settings.
8. Injection of 500KB garbage payload into Lead document.
9. Privilege escalation attempt to set admin permissions via client-side write.
10. Rapid duplicate write with corrupted timestamps.
11. Attempted read of non-existent collection outside blueprint schema.
12. Attempt to overwrite another user's assigned credentials with null values.
