# CareerNest — Production Cutover Runbook (v1.2.0-rc1)

**Target Production Frontend**: `https://career-nest-amber.vercel.app/`  
**Target Production Backend**: Generic Node.js Web Service (host to be verified in owner dashboard, e.g. Render / Railway / Heroku / AWS)  
**Execution Condition**: **STRICTLY BLOCKED — Awaiting Explicit Owner Cutover Authorization**  
**Estimated Downtime**: **0 seconds** (Zero-downtime rolling update)  
**Audit Status**: Verified by Phase 7.1 & Phase 7.2 Release-Safety Audits  

---

## 1. Release Candidate Scope & Artifacts

### Release Candidate: `v1.2.0-rc1` (Phases 5, 6, 7, 7.1 & 7.2)
The release candidate consolidates all security, performance, and functionality hardening:

1. **Phase 5 Hardening & Security Remediation**:
   - Seed script execution protection against non-local and production targets (`ALLOW_SEED=true` required).
   - `CareerProfile` Mongoose `VersionError` fix via atomic `$set` updates in `recalculateReadiness`.
   - StudyPod message authorization (HTTP 403 for non-members).
   - Strict course creation authorization (approved mentors and admins only).
   - Certificate issuer verification preventing unauthorized student self-issuance.
   - Forum post like toggling ObjectId/string harmonization via atomic `$addToSet` and `$pull`.
   - Admin analytics resilience against incomplete career profiles.
   - Remote token refresh targeting configured backend URL with loop prevention.
2. **Phase 6 Performance & Routing Optimization**:
   - React code splitting with `React.lazy()` and `Suspense` across all 35 routes.
   - Initial JavaScript download reduced to ~168 kB gzipped (including preloaded vendor chunks).
   - `client/vercel.json` SPA edge rewrite fallback eliminating 404s on deep links.
   - 100% elimination of legacy "Aura" branding across all UI and metadata.
   - Mentorship room server-side access control with WebRTC signaling disclosure.
3. **Phase 7 Enrollment & Verified Certificate Issuance**:
   - `CourseEnrollment` model with compound unique index `{ student: 1, course: 1 }`.
   - Server-verified module completion against embedded `course.modules` subdocuments.
   - Anti-spoofing module verification rejecting arbitrary IDs with HTTP 400.
   - Idempotent certificate claims returning existing certificates without duplicate generation.
   - CourseDetail interactive UI with enrollment state, progress tracking, and certificate claiming.
4. **Phase 7.1 & 7.2 Release-Safety & Legacy Compatibility Hardening**:
   - Zero-module course certificate qualification guard (rejects empty curriculums with HTTP 400).
   - **Partial Unique Index on `Certificate`**: Configured `{ student: 1, course: 1 }` with `partialFilterExpression: { course: { $type: "objectId" } }` under index name `unique_student_course_partial`.
   - **Legacy Certificate Compatibility**: Safely bypasses legacy certificates missing `course` or having `course: null`, preventing duplicate key collisions (`E11000`) for students with multiple legacy credentials.
   - Public certificate verification privacy protection (restricted strictly to `name` and `profileImage`; `email` and sensitive student profile fields excluded).
   - OTP production leak prevention (`devOtp` suppressed whenever `NODE_ENV === 'production'`; SMTP logging silenced).
   - Platform manual certificate issuance links `course: course._id` and supports idempotent responses.

---

## 2. Actual Deployment Topology & Environment Verification

### Frontend Hosting (Vercel)
- **Provider**: Vercel
- **Project Root**: `client`
- **Configuration File**: `client/vercel.json` (Edge rewrites for SPA routing)
- **Environment Variables Required**:
  - `VITE_BACKEND_URL`: Production backend API base URL (e.g. `https://api.careernest.example.com` or backend provider domain)
  - `VITE_SOCKET_URL`: Production WebSocket/Socket.IO base URL (typically identical to backend URL)

### Backend Hosting (Generic Node.js Web Service)
- **Provider**: Cloud Web Service (Render / Railway / Heroku / AWS App Runner / Fly.io — must be confirmed by owner)
- **Project Root**: `server`
- **Start Command**: `npm start` (`node server.js`)
- **Node Engine**: `>= 18.0.0`
- **Environment Variables Required**:
  - `PORT`: e.g. `5000` (auto-assigned by PaaS)
  - `NODE_ENV`: `production`
  - `MONGO_URI`: Remote MongoDB Atlas production cluster connection string
  - `JWT_SECRET`: High-entropy 64+ character secret
  - `JWT_REFRESH_SECRET`: High-entropy 64+ character secret (must differ from `JWT_SECRET`)
  - `CLIENT_URL`: `https://career-nest-amber.vercel.app`
  - `GEMINI_API_KEY`: Google Gemini API Key with production quota
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Media storage credentials
  - `EMAIL_USER`, `EMAIL_PASS`: Production SMTP credentials
  - `ALLOW_SEED`: Must remain **unset** or `false`

### Staging Topology Clarification
- **Staging Mode**: **Local Staging Only** (`http://localhost:5173` frontend, `http://localhost:5001` backend, `mongodb://127.0.0.1:27017/ai-mentor-staging`).
- **Network Isolation**: The staging database is bound to the local loopback interface and is physically incapable of connecting to or polluting production.
- **Remote Staging**: No remote preview staging backend currently exists. Do NOT attempt to run production migrations or tests against local staging.

---

## 3. Database Pre-Release Backup & Verification Plan

### Step 3.1: Pre-Deployment Full Backup (Outside Repository)
Run the backup from an authorized administrator machine into a secure, external backup directory. **Never store backups inside the git repository**:

```bash
# 1. Define secure external backup directory outside repository
BACKUP_DIR="$HOME/.careernest_backups/pre_release_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# 2. Execute full mongodump with gzip compression
mongodump --uri="$PROD_MONGO_URI" --gzip --out="$BACKUP_DIR"
```

### Step 3.2: Backup Integrity Verification
Verify that the dump completed successfully and all core collections are populated before deploying any code:

```bash
# 1. Verify archive creation and non-zero size
ls -lh "$BACKUP_DIR"/*

# 2. Verify collection archives exist for all actual CareerNest collections
for col in users courses certificates courseenrollments careerprofiles communities forumposts studypods notifications; do
  if ls "$BACKUP_DIR"/*/"$col".bson.gz 1> /dev/null 2>&1; then
    echo "✓ Backup verified for collection: $col"
  else
    echo "✗ MISSING BACKUP FOR: $col — STOP CUTOVER!"
    exit 1
  fi
done

# 3. Test gzip integrity of all dumped collection archives
gzip -t "$BACKUP_DIR"/*/*.bson.gz && echo "✓ All BSON gzip archives are uncorrupted"

# 4. Test BSON structure on decompressed stream (without writing to database)
gzip -dc "$BACKUP_DIR"/*/users.bson.gz | bsondump --num 1 > /dev/null && echo "✓ BSON record structure verified"
```

---

## 4. Schema Evolution & Additive Recovery Strategy

### Schema Evolution Characteristics
- `CourseEnrollment` is a **purely additive** collection. No existing documents are modified or removed.
- `Certificate` additions (`course` ObjectId reference and `unique_student_course_partial` index) are non-destructive and backward-compatible.
- **Partial Unique Index**:
  ```javascript
  CertificateSchema.index(
    { student: 1, course: 1 },
    {
      unique: true,
      name: 'unique_student_course_partial',
      partialFilterExpression: { course: { $type: 'objectId' } }
    }
  );
  ```
  Only documents with a valid ObjectId `course` are indexed. Legacy documents with missing `course` or `course: null` are ignored by the index, preventing duplicate key errors (`E11000`) for students with multiple legacy credentials.

### Preflight Deprecated Index Cleanup
If an older index named `student_1_course_1` was previously created on the target database (e.g. from early staging tests), it must be dropped prior to startup to prevent `IndexKeySpecsConflict`:
```bash
mongosh "$PROD_MONGO_URI" --eval '
  const idxs = db.certificates.getIndexes();
  const oldIdx = idxs.find(i => i.name === "student_1_course_1");
  if (oldIdx) {
    print("Dropping deprecated student_1_course_1 index...");
    db.certificates.dropIndex("student_1_course_1");
    print("Dropped.");
  } else {
    print("Clean state: student_1_course_1 does not exist.");
  }
'
```

### Non-Destructive Recovery Strategy
If new enrollments, module completions, or certificates are created during the release window:
- **NEVER run `mongorestore --drop`**: Running `--drop` against production will irreversibly destroy newly written student enrollment and completion records.
- If code rollback is required, simply deploy the previous backend tag. Older backend code does not query `courseenrollments` and handles existing `certificates` without breaking.
- If a specific collection is corrupted, restore that single collection to a temporary database, inspect the difference, and selectively backport without dropping active data:
  ```bash
  # Restore to an isolated temporary scratch database ONLY:
  mongorestore --uri="$PROD_MONGO_URI" --gzip --nsInclude="ai-mentor.courses" --nsFrom="ai-mentor.*" --nsTo="ai-mentor-recovery.*" "$BACKUP_DIR"
  ```

---

## 5. Reversibility & Rollback Matrix

| Component / Action | Reversibility | Rollback Time | Rollback Procedure | Data Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Deployment (Vercel)** | **100% Reversible** | < 30 seconds | Vercel Dashboard → Deployments → Select previous deployment → **Promote to Production** | None. Pure client bundle switch. |
| **Backend Deployment (Node.js)** | **100% Reversible** | 1–3 minutes | Redeploy previous Git commit or tag `v1.1.0` in backend PaaS dashboard | None. Older code works transparently. |
| **Database Schema Additions** | **100% Backward Compatible** | N/A | No rollback needed. New collections/fields are ignored by older backend | None. Additive only. Newly created certificates & enrollments are preserved. |
| **Database Restore (`mongorestore`)** | **IRREVERSIBLE / HIGH RISK** | 15–30 minutes | Target collection restore without `--drop` into isolated namespace | **High risk**: overwriting active database loses transactions created post-cutover. |
| **Certificate Issuance** | **Operationally Irreversible** | N/A | Revocation flag if invalid certificate was issued | Certificates once issued to students or downloaded cannot be silently erased. |

---

## 6. Cutover Execution Procedure (When Authorized)

When explicitly authorized by the project owner:

### Step 6.1: Owner Hosting Dashboard Verification
Perform Gate C manual checks:
- Confirm `NODE_ENV=production`.
- Confirm `CLIENT_URL=https://career-nest-amber.vercel.app`.
- Confirm `ALLOW_SEED` is unset or false.
- Confirm SMTP credentials point to a production service and `devOtp` is not exposed.

### Step 6.2: Database Backup & Preflight Check
1. Execute Step 3.1 and Step 3.2. Record the backup directory path.
2. Run Step 4 preflight index cleanup check on production database.

### Step 6.3: Deploy Backend Service
1. Push release branch or tag `v1.2.0-rc1` to GitHub.
2. Trigger backend deployment in PaaS dashboard.
3. Inspect backend startup logs:
   - Confirm successful MongoDB connection.
   - Confirm partial index `unique_student_course_partial` builds cleanly.
   - Confirm seed script refuses execution (`NODE_ENV=production`).
   - Confirm CORS and Socket.IO origin authorization are active.

### Step 6.4: Deploy Frontend Service (Vercel)
1. Verify clean build: `npm run build` in `client/`.
2. Deploy to production via Vercel dashboard or CLI (`vercel --prod`).
3. Verify edge rewrite deployment from `client/vercel.json`.

---

## 7. Immediate Post-Cutover Verification Checklist

Perform within 10 minutes of cutover:

- [ ] **1. Public Availability & Performance**:
  - Visit `https://career-nest-amber.vercel.app/`.
  - Verify HTTP 200 and initial load bundle is split (~168 kB gzip transfer).
- [ ] **2. Authentication & Security**:
  - Log in with existing account.
  - Verify access token issuance and `/api/auth/refresh` execution.
  - Confirm no OTPs are leaked in console or response payloads.
- [ ] **3. Deep Linking & SPA Navigation**:
  - Directly open `https://career-nest-amber.vercel.app/study-pods`.
  - Perform hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`). Confirm zero 404s.
- [ ] **4. Course Enrollment & Module Completion**:
  - Navigate to `/courses`.
  - Enroll in a course.
  - Complete a module. Verify progress persists on server.
- [ ] **5. Certificate Claim & Public Verification**:
  - Verify certificate claim flow.
  - Open `/verify-certificate/<id>` in an incognito window.
  - Confirm public view shows student name and course, but suppresses student email and profile details.
- [ ] **6. AI Transparency**:
  - Visit `/ai-skill-gap`. Confirm live AI response or graceful fallback notice.

---

## 8. Rollback Triggers & Execution Checklist

### Rollback Triggers
Initiate immediate rollback if within 30 minutes of cutover:
1. User login failure rate exceeds 1%.
2. Backend HTTP 5xx error rate exceeds 0.5%.
3. Vercel SPA routing returns 404 on direct route refreshes.
4. Database connection drops or index creation blocks writes.

### Rollback Action Plan
1. **Frontend**: Instant Rollback in Vercel Dashboard (30 seconds).
2. **Backend**: Redeploy previous Git release commit in backend PaaS dashboard (2 minutes).
3. **Database**: Do **NOT** run `mongorestore --drop`. If corrupt records were created, contact database administrator to run targeted update queries.
