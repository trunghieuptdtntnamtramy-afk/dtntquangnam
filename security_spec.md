# Security Specification — EDU SMART

## 1. Data Invariants
1. **Identity Ownership**: Every learning document (`studyPlans`, `thinkFirstEntries`, `aiCoachSessions`, `factChecks`, `selfTests`) must carry a `userId` strictly matching `request.auth.uid` on creation and immutable on update.
2. **Email Verification Gate**: All authenticated read/write operations require `request.auth.token.email_verified == true`.
3. **No Self-Role Escalation**: Standard users creating `/users/{userId}` can only assign `role == 'student'` unless they are the verified bootstrap admin (`trunghieuptdtntnamtramy@gmail.com`) or present in `/admins/{uid}`. Users cannot update `role` on `/users/{userId}`.
4. **Master Gate Parent Integrity**: `/aiCoachSessions/{sessionId}` creation requires `exists(/databases/$(database)/documents/thinkFirstEntries/$(incoming().thinkFirstId))` owned by `request.auth.uid` with `unlockedAiCoach == true`. Every `/aiCoachSessions/{sessionId}/messages/{messageId}` must validate parent ownership via `get(/databases/$(database)/documents/aiCoachSessions/$(sessionId))`.
5. **Terminal State Locking**: Once a `selfTests/{testId}` reaches `status == 'submitted'`, non-admin users cannot overwrite the score or answers.
6. **PII Isolation & Query Enforcement**: `/users/{userId}` restricts `get` to owner or admin and forbids `list` to non-admins. All learning collection `list` rules enforce `resource.data.userId == request.auth.uid` or verified bootstrap admin email without `get()`/`exists()` inside `allow list`.
7. **Strict Schema & Timestamp Integrity**: Every write validates exact key sets (`hasAll` + `hasOnly` on create, `affectedKeys().hasOnly(...)` on update), string `.size()` bounds, ID regex `^[a-zA-Z0-9_\-]+$`, and server timestamps (`request.time`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Ghost Field Shadow Update**: Creating a `studyPlans` doc with `{ ..., isVerifiedByAdmin: true }` -> `PERMISSION_DENIED`.
2. **Identity Spoofing**: Creating a `thinkFirstEntries` doc with `userId: "other-uid"` -> `PERMISSION_DENIED`.
3. **Self-Role Escalation**: Creating `/users/{uid}` with `role: "teacher"` by a non-admin student -> `PERMISSION_DENIED`.
4. **Role Mutation**: Updating `role` from `"student"` to `"teacher"` in `/users/{uid}` -> `PERMISSION_DENIED`.
5. **Unverified Email Bypass**: Attempting a write with `email_verified: false` (even matching admin email) -> `PERMISSION_DENIED`.
6. **AI Coach Bypass (Missing Think First)**: Creating `aiCoachSessions` referencing a non-existent `thinkFirstId` -> `PERMISSION_DENIED`.
7. **Think First Short-Circuit**: Creating `thinkFirstEntries` with `studentHypothesis` shorter than 20 characters -> `PERMISSION_DENIED`.
8. **Terminal State Tampering**: Updating a `selfTests` document after `status == "submitted"` -> `PERMISSION_DENIED`.
9. **Path Poisoning**: Writing to `/studyPlans/../../invalid` or a 500-char ID -> `PERMISSION_DENIED`.
10. **PII Cross-Read**: User A reading `/users/userB` -> `PERMISSION_DENIED`.
11. **Unrestricted List Scraping**: User A listing `/studyPlans` without `where("userId", "==", userA)` -> `PERMISSION_DENIED`.
12. **Client Timestamp Forgery**: Creating a record with `createdAt` set to a past client date instead of `serverTimestamp()` -> `PERMISSION_DENIED`.
