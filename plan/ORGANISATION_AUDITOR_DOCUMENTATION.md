# PayGuard Organisation/Auditor Experience - Complete Documentation

**Version:** 1.2  
**Last Updated:** January 3, 2026  
**Purpose:** Reference documentation for the Organisation/Auditor workflow - NO CODE CHANGES

---

## Table of Contents

1. [Navigation Diagram](#a-navigation-diagram)
2. [Route Table](#b-route-table)
3. [Page → TSX Ownership Map](#c-page--tsx-ownership-map)
4. [Authentication & Sign Up Flow](#d-authentication--sign-up-flow)
5. [Interaction Map](#e-interaction-map)
6. [Data Model Reference](#f-data-model-reference)
7. [Implementation Guidelines](#g-implementation-guidelines)

---

## A) Navigation Diagram

### Overview
The Organisation/Auditor experience is a state-based single-page application managed by `/components/dashboards/OrganisationDashboardWrapper.tsx`. Navigation between pages is handled through React state changes (within `OrganisationDashboardWrapper.tsx`), not traditional routing. The workflow enables bulk audits of employee payrolls, reviewing results, and managing human-in-the-loop (HITL) review queues.

### Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Landing Page                              │
│                       (Not in scope)                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    Sign In → Select User Type
                               │
                    Login as "Organisation/Auditor"
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌───────────────────┐          ┌──────────────────┐
    │   LOGIN PAGE      │          │  SIGN UP PAGE    │
    │   /components/    │◄─────────│  /components/    │
    │   LoginForm.tsx   │ "Sign In │  auth/Organis-   │
    │                   │  Instead"│  ationSignUp.tsx │
    │ • Enter creds     │          │                  │
    │ • "Sign up" link  │          │ • Org name       │
    │ • "Reset here"    │          │ • Org type       │
    │ • Demo button     │          │ • Contact name   │
    └─────────┬─────────┘          │ • Email          │
              │                    │ • Phone (opt)    │
              │                    │ • Password       │
              │                    │ • Confirm pass   │
              │                    │ • Accept terms   │
              │                    └────────┬─────────┘
              │                             │
              │  After sign up success ────┘
              │  (redirects to login)
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD (Main Hub)                          │
│  File: /components/dashboards/OrganisationDashboardPage.tsx     │
│  Wrapper: /components/dashboards/OrganisationDashboardWrapper.tsx│
│  State: 'dashboard'                                              │
│                                                                   │
│  Key Metrics (uses /components/ui/card.tsx):                    │
│  • Total Employees: 143                                          │
│  • Underpaid Employees: 12 (uses /components/design-system/     │
│    SeverityBadge.tsx)                                            │
│  • Review Queue: 8 items                                         │
│  • Total At Risk: $4,284                                         │
│                                                                   │
│  Employee Table (uses /components/ui/table.tsx):                │
│  • 12 employees with status badges                               │
│  • Filter controls (uses /components/ui/select.tsx)             │
│  • Status badges use /components/design-system/SeverityBadge.tsx│
│                                                                   │
│  Charts (uses recharts library):                                │
│  • Root cause analysis (BarChart)                                │
│  • Weekly trend (LineChart)                                      │
│                                                                   │
│  Actions Available (all use /components/ui/button.tsx):         │
│  [New Bulk Audit] → /components/organisation/BulkAuditWizard.tsx│
│  [View All Results] → /components/organisation/AuditResultsPage.tsx│
│  [View History] → /components/organisation/AuditHistoryPage.tsx │
│  [Review Now] → /components/organisation/ReviewQueuePage.tsx    │
│  Employee row click → (Conceptual) Employee detail modal         │
└──────────────────────────┬───────────────────┬──────────────────┘
                           │                   │
        ┌──────────────────┴────┐             │
        │                       │             │
        ▼                       ▼             ▼
┌──────────────┐   ┌───────────────┐   ┌─────────────┐
│ BULK AUDIT   │   │ AUDIT HISTORY │   │ REVIEW      │
│ WIZARD       │   │               │   │ QUEUE       │
│ (5 steps)    │   │ List of past  │   │             │
│              │   │ audit runs    │   │ HITL items  │
│ BulkAudit-   │   │ AuditHistory- │   │ ReviewQueue-│
│ Wizard.tsx   │   │ Page.tsx      │   │ Page.tsx    │
│              │   │               │   │             │
│ Uses:        │   │ Uses:         │   │ Uses:       │
│ Progress-    │   │ /components/  │   │ /components/│
│ Stepper.tsx  │   │ ui/table.tsx  │   │ ui/table.tsx│
└──────┬───────┘   └───────┬───────┘   └─────────────┘
       │                   │
       │ Complete          │ Click row
       ▼                   ▼
┌──────────────────┐  ┌────────────────┐
│ COMPREHENSIVE    │  │ AUDIT DETAIL   │
│ AUDIT REVIEW     │  │ PAGE           │
│                  │  │ (6 tabs)       │
│ Comprehensive-   │  │ AuditDetail-   │
│ AuditReview.tsx  │  │ Page.tsx       │
│                  │  │                │
│ 3 Tabs:          │  │ 6 Tabs:        │
│ • All Employees  │  │ • Inputs       │
│ • Analytics &    │  │ • Processing   │
│   Insights       │  │ • Employees    │
│ • Human Review   │  │ • Analytics    │
│   (HITL)         │  │ • HITL         │
│                  │  │ • Timeline     │
│ Uses:            │  │                │
│ /components/ui/  │  │ Uses:          │
│ tabs.tsx         │  │ /components/ui/│
└──────────────────┘  │ tabs.tsx       │
                      └────────────────┘

All pages use:
- /components/ui/button.tsx for buttons
- /components/ui/card.tsx for content containers
- /components/ui/table.tsx for data tables
- /components/design-system/StatusBadge.tsx for status
- /components/design-system/SeverityBadge.tsx for payment status
```

### Entry Points from Dashboard
**File:** `/components/dashboards/OrganisationDashboardPage.tsx`
**State Manager:** `/components/dashboards/OrganisationDashboardWrapper.tsx`

| Button/Link | Target View | Target File | State Change | Handler | Button Component |
|-------------|-------------|-------------|--------------|---------|------------------|
| "New Bulk Audit" (header button) | Bulk Audit Wizard | `/components/organisation/BulkAuditWizard.tsx` | `setCurrentView('bulk-audit-wizard')` | `handleNewBulkAudit()` | `/components/ui/button.tsx` with Upload icon |
| "View All Results" (in dashboard) | Audit Results | `/components/organisation/AuditResultsPage.tsx` | `setCurrentView('audit-results')` | `handleViewAuditResults()` | `/components/ui/button.tsx` |
| "View History" link | Audit History | `/components/organisation/AuditHistoryPage.tsx` | `setCurrentView('audit-history')` | Direct state change | Text link button |
| "Review Now" button | Review Queue | `/components/organisation/ReviewQueuePage.tsx` | `setCurrentView('review-queue')` | Direct state change | `/components/ui/button.tsx` |
| Employee table row | (Conceptual) Employee modal | N/A | Would open modal overlay | Not implemented yet | Table row with cursor-pointer |

### Back Navigation Patterns

| From Page | From File | Back Button → Target | Handler | Back Button Uses |
|-----------|-----------|----------------------|---------|------------------|
| Bulk Audit Wizard | `/components/organisation/BulkAuditWizard.tsx` | Dashboard | `onClose()` closes wizard | X button (Close icon) |
| Comprehensive Audit Review | `/components/organisation/ComprehensiveAuditReview.tsx` | Dashboard | `onBack()` sets view to 'dashboard' | `/components/ui/button.tsx` with ArrowLeft icon |
| Audit Results | `/components/organisation/AuditResultsPage.tsx` | Dashboard | `onBack()` | `/components/ui/button.tsx` with ArrowLeft icon |
| Audit History | `/components/organisation/AuditHistoryPage.tsx` | Dashboard | `onBack()` | `/components/ui/button.tsx` with ArrowLeft icon |
| Audit Detail | `/components/organisation/AuditDetailPage.tsx` | Audit History | `onBack()` | `/components/ui/button.tsx` with ArrowLeft icon |
| Review Queue | `/components/organisation/ReviewQueuePage.tsx` | Dashboard | `onBack()` | `/components/ui/button.tsx` with ArrowLeft icon |

---

## B) Route Table

**Note:** The application uses React state-based navigation in `/components/dashboards/OrganisationDashboardWrapper.tsx`, NOT URL-based routing. The "routes" below are conceptual paths representing different application states.

| State Value | Page Name | File | Purpose | Required Params | Conceptual URL (if routed) |
|-------------|-----------|------|---------|-----------------|----------------------------|
| `'dashboard'` | Organisation Dashboard | `/components/dashboards/OrganisationDashboardPage.tsx` | Main overview with metrics, employees, charts | None | `/organisation` |
| `'bulk-audit-wizard'` | Bulk Audit Wizard | `/components/organisation/BulkAuditWizard.tsx` | 5-step flow to run bulk audit | None | `/organisation/audit/new` |
| `'audit-results'` | Audit Results Page | `/components/organisation/AuditResultsPage.tsx` | View most recent audit results | `auditId` (optional) | `/organisation/audit/:id/results` |
| `'comprehensive-review'` | Comprehensive Audit Review | `/components/organisation/ComprehensiveAuditReview.tsx` | Post-wizard 3-tab review (shown after wizard completes) | None | `/organisation/audit/:id/review` |
| `'audit-history'` | Audit History | `/components/organisation/AuditHistoryPage.tsx` | List of all past audits with filters | None | `/organisation/audit/history` |
| `'audit-detail'` | Audit Detail Page | `/components/organisation/AuditDetailPage.tsx` | 6-tab detailed view of single audit | `auditId` (required) | `/organisation/audit/:id` |
| `'review-queue'` | Review Queue | `/components/organisation/ReviewQueuePage.tsx` | Human-in-the-loop review queue | None | `/organisation/review-queue` |

### State Management

**Current implementation in `/components/dashboards/OrganisationDashboardWrapper.tsx`:**
```typescript
// File: /components/dashboards/OrganisationDashboardWrapper.tsx
const [currentView, setCurrentView] = useState<ViewType>('dashboard');
const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

type ViewType = 
  | 'dashboard' 
  | 'bulk-audit-wizard' 
  | 'audit-results' 
  | 'comprehensive-review' 
  | 'audit-history' 
  | 'audit-detail' 
  | 'review-queue';
```

**Rendering logic in `/components/dashboards/OrganisationDashboardWrapper.tsx`:**
```typescript
// Returns different components based on currentView state:
if (currentView === 'bulk-audit-wizard') 
  return <BulkAuditWizard onClose={...} />; // /components/organisation/BulkAuditWizard.tsx

if (currentView === 'comprehensive-review') 
  return <ComprehensiveAuditReview onBack={...} />; // /components/organisation/ComprehensiveAuditReview.tsx

if (currentView === 'audit-results') 
  return <AuditResultsPage onBack={...} />; // /components/organisation/AuditResultsPage.tsx

if (currentView === 'audit-history') 
  return <AuditHistoryPage onBack={...} onViewDetail={...} />; // /components/organisation/AuditHistoryPage.tsx

if (currentView === 'audit-detail') 
  return <AuditDetailPage auditId={selectedAuditId} onBack={...} />; // /components/organisation/AuditDetailPage.tsx

if (currentView === 'review-queue') 
  return <ReviewQueuePage onBack={...} />; // /components/organisation/ReviewQueuePage.tsx

return <OrganisationDashboardPage {...props} />; // Default: /components/dashboards/OrganisationDashboardPage.tsx
```

**To convert to URL routing (future):**
- Use React Router or Next.js App Router
- Map each `currentView` state to a URL path
- Pass `auditId` as URL parameter: `/organisation/audit/:id`
- Enable browser back/forward navigation
- Enable direct linking to specific audits
- Preserve wizard state in URL query params

---

## C) Page → TSX Ownership Map

### Primary Components

| Page/View | TSX File | Purpose | Props Interface | UI Components Used |
|-----------|----------|---------|-----------------|-------------------|
| **Login Form** | `/components/LoginForm.tsx` | Organisation login page | `{ userType: 'organisation'; onLogin: () => void; onBack: () => void; onSignUp?: () => void }` | `button.tsx`, `input.tsx`, `card.tsx` |
| **Sign Up Page** | `/components/auth/OrganisationSignUp.tsx` | Organisation registration | `{ onBack: () => void; onSignUpSuccess: () => void; onSwitchToLogin: () => void }` | `button.tsx`, `input.tsx`, `card.tsx`, `checkbox.tsx`, `select.tsx` |
| **Main Page Wrapper** | `/components/dashboards/OrganisationDashboardWrapper.tsx` | State orchestrator, renders all views based on `currentView` | `{ onLogout: () => void }` | N/A (wrapper only) |
| **Dashboard** | `/components/dashboards/OrganisationDashboardPage.tsx` | Main overview with KPIs, employee table, charts | Props passed from wrapper | `card.tsx`, `table.tsx`, `button.tsx`, `select.tsx`, Recharts |
| **Dashboard (old)** | `/components/dashboards/OrganisationDashboard.tsx` | Legacy component (may not be used) | N/A | N/A |
| **Bulk Audit Wizard** | `/components/organisation/BulkAuditWizard.tsx` | 5-step modal wizard for bulk audits | `{ onClose: () => void; onComplete: (auditId: string) => void }` | `ProgressStepper.tsx`, `button.tsx`, `input.tsx`, `select.tsx` |
| **Comprehensive Audit Review** | `/components/organisation/ComprehensiveAuditReview.tsx` | 3-tab post-wizard review (All Employees, Analytics, HITL) | `{ onBack: () => void; auditId?: string }` | `tabs.tsx`, `table.tsx`, `card.tsx`, Recharts |
| **Audit Results Page** | `/components/organisation/AuditResultsPage.tsx` | View results of most recent audit | `{ onBack: () => void; auditId?: string }` | `table.tsx`, `card.tsx`, `button.tsx` |
| **Audit History** | `/components/organisation/AuditHistoryPage.tsx` | List of past audit requests with filters | `{ onBack: () => void; onViewDetail: (id: string) => void }` | `table.tsx`, `card.tsx`, `input.tsx`, `select.tsx`, `checkbox.tsx` |
| **Audit Detail Page** | `/components/organisation/AuditDetailPage.tsx` | 6-tab detailed view of single audit | `{ auditId: string; onBack: () => void }` | `tabs.tsx`, `table.tsx`, `card.tsx`, `progress.tsx` |
| **Review Queue** | `/components/organisation/ReviewQueuePage.tsx` | Human-in-the-loop review queue | `{ onBack: () => void }` | `table.tsx`, `card.tsx`, `button.tsx`, `dialog.tsx` |
| **Reports & Insights** | `/components/organisation/ReportsInsightsPage.tsx` | (May be deprecated or future feature) | Props defined in file | Various |

### Shared Components (Design System)

| Component | File | Purpose | Used By |
|-----------|------|---------|---------|
| **StatusBadge** | `/components/design-system/StatusBadge.tsx` | Done/Running/Pending/Failed badges | Agent status, processing timelines, audit status |
| **SeverityBadge** | `/components/design-system/SeverityBadge.tsx` | OK/Underpaid/Needs Review status | Payment status in employee tables, dashboard metrics |
| **AnomalyScorePill** | `/components/design-system/AnomalyScorePill.tsx` | 0-100 confidence score display | Employee results, detail pages |
| **PageHeader** | `/components/design-system/PageHeader.tsx` | Page title + actions | Dashboard, detail pages |
| **ProgressStepper** | `/components/design-system/ProgressStepper.tsx` | Visual step indicator | Wizard left sidebar in `BulkAuditWizard.tsx` |
| **EmptyState** | `/components/design-system/EmptyState.tsx` | No data message | Tables when no data available |
| **Card** | `/components/ui/card.tsx` | Card container (shadcn/ui) | All pages for content grouping |
| **Table** | `/components/ui/table.tsx` | Data table (shadcn/ui) | Employee tables, audit history, results tables |
| **Tabs** | `/components/ui/tabs.tsx` | Tab navigation | `ComprehensiveAuditReview.tsx`, `AuditDetailPage.tsx` |
| **Button** | `/components/ui/button.tsx` | All buttons | Everywhere across all components |
| **Input** | `/components/ui/input.tsx` | Text input | Search fields, filters, form inputs |
| **Select** | `/components/ui/select.tsx` | Dropdown select | Filters, form fields |
| **Checkbox** | `/components/ui/checkbox.tsx` | Checkbox input | Filters (e.g., "Show underpaid only") |
| **Dialog** | `/components/ui/dialog.tsx` | Modal dialogs | HITL review modals |
| **Progress** | `/components/ui/progress.tsx` | Progress bar | Agent processing displays |

### Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| **OrganisationDashboardShell** | `/components/shells/OrganisationDashboardShell.tsx` | Sidebar + top bar wrapper (not used by all pages) |

**Note:** `/components/dashboards/OrganisationDashboardWrapper.tsx` manages the entire experience and renders different pages without using the shell wrapper.

### Sample Data Location

All pages currently use **inline sample data** defined as constants within each component file:

| File | Data Description |
|------|------------------|
| `/components/dashboards/OrganisationDashboardPage.tsx` | Dashboard KPIs, employee list (12 employees), root cause data, trend data |
| `/components/organisation/AuditHistoryPage.tsx` | List of past audit requests (7 sample audits) |
| `/components/organisation/AuditDetailPage.tsx` | Detailed audit data with 6 tabs of information |
| `/components/organisation/ComprehensiveAuditReview.tsx` | Employee results, analytics charts, HITL queue |
| `/components/organisation/BulkAuditWizard.tsx` | Sample CSV data for bulk imports |

**To wire to real data:**
- Create `/services/auditApi.ts` for API calls
- Create `/hooks/useAuditData.ts` for data fetching hooks
- Replace inline constants with API responses
- Add loading/error states using `/components/ui/skeleton.tsx` and `/components/ui/alert.tsx`

---

## D) Authentication & Sign Up Flow

### Authentication Pages (Before Dashboard Access)

#### 1. Organisation Login Page
**File:** `/components/LoginForm.tsx` (shared component, `userType='organisation'`)

**Purpose:** Authenticate existing organisation users with username/password or demo credentials

**UI Elements:**
- Email/Username input field (uses `/components/ui/input.tsx`)
- Password input field with show/hide toggle (Eye/EyeOff icons from `lucide-react`)
- "Sign In" button (uses `/components/ui/button.tsx`)
- "Use Demo" button to auto-fill credentials
- "Sign up" link → navigates to Organisation Sign Up page
- "Reset here" link → password reset flow (placeholder)
- "Back" button → returns to user type selection

**Demo Credentials:**
- Email: `jane.davis@littlelearners.edu.au`
- Password: `demo123`
- Role: HR Manager at Little Learners Early Education

**Navigation:**
- **onLogin()** → Sets `currentView='organisation'` in `/App.tsx` → Shows Organisation Dashboard
- **onBack()** → Sets `currentView='signin'` → Returns to user type selection
- **onSignUp()** → Sets `currentView='signup'` → Shows Organisation Sign Up page

#### 2. Organisation Sign Up Page
**File:** `/components/auth/OrganisationSignUp.tsx`

**Purpose:** Create new organisation account for HR managers, auditors, and compliance officers

**Required Fields:**

1. **Organisation Name** (Text input)
   - Component: `/components/ui/input.tsx` with Building2 icon
   - Validation: Cannot be empty
   - Example: "Little Learners Early Education"

2. **Organisation Type** (Dropdown select)
   - Component: `/components/ui/select.tsx`
   - Options:
     - Childcare / Early Learning
     - Retail
     - Hospitality
     - Healthcare
     - Education
     - Construction
     - Other
   - Validation: Must select an option
   - Purpose: Industry-specific award matching

3. **Contact Person Name** (Text input)
   - Component: `/components/ui/input.tsx` with User icon
   - Validation: Cannot be empty
   - Example: "Jane Davis"
   - Purpose: Primary contact for the organisation

4. **Email Address** (Email input)
   - Component: `/components/ui/input.tsx` with Mail icon
   - Validation: Must be valid email format (regex check)
   - Example: "jane.davis@littlelearners.edu.au"
   - Purpose: Organisation email (not personal email)

5. **Phone Number** (Tel input, Optional)
   - Component: `/components/ui/input.tsx` with Phone icon
   - Validation: None (optional field)
   - Example: "+61 3 9876 5432"
   - Purpose: Contact number for account verification

6. **Password** (Password input with toggle)
   - Component: `/components/ui/input.tsx` with Lock icon and Eye/EyeOff toggle
   - Validation: Minimum 8 characters
   - Features: 
     - Show/hide toggle button
     - Real-time password strength indicator (5-level bar)
     - Strength labels: Weak (red) → Fair (amber) → Good (blue) → Strong (green)
   - Strength criteria:
     - Length: 8+ chars (1 point), 12+ chars (2 points)
     - Mixed case (upper + lower)
     - Numbers
     - Special characters

7. **Confirm Password** (Password input with toggle)
   - Component: `/components/ui/input.tsx` with Lock icon
   - Validation: Must match Password field exactly
   - Shows green checkmark when passwords match
   - Shows red error if passwords don't match

8. **Terms & Conditions** (Checkbox)
   - Component: `/components/ui/checkbox.tsx`
   - Label: "I agree to the Terms of Service and Privacy Policy, and confirm that I have authority to register this organisation"
   - Validation: Must be checked to submit
   - Links to Terms (placeholder) and Privacy Policy (placeholder)
   - **Authority Confirmation:** Ensures user has permission to register on behalf of organisation

**Form Layout:**
- 2-column grid for compact display (organisation name + type on same row)
- Email + phone number on same row
- Password fields on same row
- Wider form (max-w-2xl) vs Employee (max-w-md) to accommodate more fields

**Form Validation:**
- All validation happens on submit (`handleSignUp`)
- Individual field errors shown as red text below each input
- Errors clear when user starts typing in that field
- Submit button disabled during account creation (shows loading spinner)

**Validation Rules:**
```typescript
{
  organisationName: 'Organisation name is required',
  organisationType: 'Organisation type is required',
  contactName: 'Contact person name is required',
  email: 'Please enter a valid email address',
  password: 'Password must be at least 8 characters',
  confirmPassword: 'Passwords do not match',
  terms: 'You must agree to the terms and conditions'
}
```

**Password Strength Calculator:**
```typescript
// Returns: { strength: 0-5, label: string, color: string }
- strength 0-2: Weak (bg-red-500)
- strength 3: Fair (bg-amber-500)
- strength 4: Good (bg-blue-500)
- strength 5: Strong (bg-green-500)
```

**Buttons:**
- **"Create Organisation Account"** (Primary button)
  - Shows loading spinner during submit
  - Simulates 1.5s API call
  - On success: calls `onSignUpSuccess()` → returns to login page
  
- **"Sign In Instead"** (Outline button)
  - Calls `onSwitchToLogin()` → returns to login page

- **"Back to User Type"** (Ghost button, top-left)
  - Calls `onBack()` → returns to user type selection

**UI Components Used:**
- `/components/ui/card.tsx` - Main form container
- `/components/ui/input.tsx` - All text/password/email/tel inputs
- `/components/ui/label.tsx` - Field labels
- `/components/ui/button.tsx` - All buttons
- `/components/ui/checkbox.tsx` - Terms checkbox
- `/components/ui/select.tsx` - Organisation type dropdown
- Icons from `lucide-react`: Shield, ArrowLeft, Mail, Lock, User, Building2, Eye, EyeOff, CheckCircle2, Phone

**Current Implementation:**
- Simulated sign up (no real API call)
- 1.5 second timeout to simulate account creation
- Success redirects to login page

**Intended Implementation:**
- Call API: `POST /api/auth/signup-organisation`
- Request body:
  ```typescript
  {
    organisationName: string,
    organisationType: string,
    contactName: string,
    email: string,
    phone?: string,
    password: string
  }
  ```
- Response:
  ```typescript
  {
    success: boolean,
    organisationId?: string,
    requiresApproval?: boolean, // Admin approval needed
    message?: string
  }
  ```
- On success: Redirect to login with success message (may require admin approval)
- On error: Show error message (organisation already exists, invalid details, etc.)

**Footer Note:**
"PayGuard helps organisations ensure fair pay practices and compliance. Not for collecting PII or securing sensitive data."

### Sign Up User Journey

**Complete Flow:**
```
Landing Page
  ↓ Click "Sign In"
  
User Type Selection (/components/SignInPage.tsx)
  ↓ Select "Organisation / Auditor"
  
Login Page (/components/LoginForm.tsx)
  ↓ Click "Sign up" link
  
Sign Up Page (/components/auth/OrganisationSignUp.tsx)
  ↓ Fill form:
    - Organisation Name: "Little Learners Early Education"
    - Organisation Type: "Childcare / Early Learning"
    - Contact Person: "Jane Davis"
    - Email: "jane.davis@littlelearners.edu.au"
    - Phone: "+61 3 9876 5432" (optional)
    - Password: "SecurePass123!"
    - Confirm Password: "SecurePass123!"
    - ✓ Agree to terms and confirm authority
  ↓ Click "Create Organisation Account"
  ↓ 1.5s loading...
  ↓ Account created successfully (may require admin approval)
  
Login Page (/components/LoginForm.tsx)
  ↓ Enter new credentials:
    - Email: "jane.davis@littlelearners.edu.au"
    - Password: "SecurePass123!"
  ↓ Click "Sign In"
  
Organisation Dashboard (/components/dashboards/OrganisationDashboardPage.tsx)
  ✓ Authenticated, ready to audit payrolls
```

### Authentication State Management

**Managed in `/App.tsx`:**
```typescript
const [currentView, setCurrentView] = useState<View>('landing');
const [selectedUserType, setSelectedUserType] = useState<UserType>(null);

// View options:
type View = 'landing' | 'signin' | 'login' | 'signup' | 'employee' | 'organisation' | 'admin';
type UserType = 'employee' | 'organisation' | 'admin' | null;

// Handlers:
handleSignUp() → setCurrentView('signup')
handleSignUpSuccess() → setCurrentView('login')
handleBackToLogin() → setCurrentView('login')
handleLogin() → setCurrentView(selectedUserType) // 'organisation'
handleLogout() → setCurrentView('landing'), setSelectedUserType(null)
```

**Conditional Rendering in `/App.tsx`:**
```typescript
{currentView === 'signup' && selectedUserType === 'organisation' && (
  <OrganisationSignUp 
    onSignUpSuccess={handleSignUpSuccess} 
    onBack={handleBackToSignIn}
    onSwitchToLogin={handleBackToLogin}
  />
)}
```

---

## E) Interaction Map ("What Runs When I Click")

### Organisation Dashboard
**File:** `/components/dashboards/OrganisationDashboardPage.tsx`
**Wrapper:** `/components/dashboards/OrganisationDashboardWrapper.tsx`

#### 1. "New Bulk Audit" Button (Top-right header)
- **File:** Rendered in `/components/dashboards/OrganisationDashboardPage.tsx`
- **Component:** `/components/ui/button.tsx`
- **Icon:** Upload icon from `lucide-react`
- **Label:** "New Bulk Audit"
- **Location:** Page header, right side
- **Current behavior:** Opens Bulk Audit Wizard modal
- **Intended behavior:** Same as current
- **Action type:** Modal/page open
- **Handler:** `handleNewBulkAudit()` → `setCurrentView('bulk-audit-wizard')` in wrapper
- **Data:** None
- **UI update:** Full-page navigation to `/components/organisation/BulkAuditWizard.tsx`
- **Loading state:** N/A
- **What changes:** Page changes to wizard

#### 2. "View All Results" Link/Button
- **File:** Rendered in `/components/dashboards/OrganisationDashboardPage.tsx`
- **Component:** `/components/ui/button.tsx` or text link
- **Label:** "View All Results"
- **Location:** Dashboard content area
- **Current behavior:** Navigates to Audit Results page
- **Intended behavior:** Same as current
- **Action type:** Page navigation
- **Handler:** `handleViewAuditResults()` → `setCurrentView('audit-results')` in wrapper
- **Data:** Optional audit ID
- **UI update:** Full-page change to `/components/organisation/AuditResultsPage.tsx`

#### 3. "View History" Link
- **File:** Rendered in `/components/dashboards/OrganisationDashboardPage.tsx`
- **Component:** Text link or `/components/ui/button.tsx` with `variant="link"`
- **Label:** "View History"
- **Location:** Dashboard content area
- **Current behavior:** Navigates to Audit History page
- **Intended behavior:** Same as current
- **Action type:** Page navigation
- **Handler:** Direct state change → `setCurrentView('audit-history')` in wrapper
- **Data:** None
- **UI update:** Full-page change to `/components/organisation/AuditHistoryPage.tsx`

#### 4. "Review Now" Button (in Review Queue card)
- **File:** Rendered in `/components/dashboards/OrganisationDashboardPage.tsx`
- **Component:** `/components/ui/button.tsx`
- **Label:** "Review Now"
- **Location:** Review Queue summary card on dashboard
- **Current behavior:** Navigates to Review Queue page
- **Intended behavior:** Same as current
- **Action type:** Page navigation
- **Handler:** Direct state change → `setCurrentView('review-queue')` in wrapper
- **Data:** None
- **UI update:** Full-page change to `/components/organisation/ReviewQueuePage.tsx`

#### 5. Employee Table Row Click
- **File:** Rendered in `/components/dashboards/OrganisationDashboardPage.tsx`
- **Component:** `/components/ui/table.tsx` - `<TableRow>` elements
- **Label:** Any row in high-risk employees table
- **Location:** Main dashboard employee table
- **Current behavior:** Not implemented / placeholder
- **Intended behavior:** Open employee detail modal or navigate to employee page
- **Action type:** Modal or navigation
- **Handler:** `handleEmployeeClick(employeeId)` (conceptual)
- **Possible implementation:**
  - Option A: Open modal with employee details using `/components/ui/dialog.tsx`
  - Option B: Navigate to employee detail page
- **Data:** Employee ID from clicked row
- **Styling:** Rows have `cursor-pointer hover:bg-muted` classes

#### 6. Filter Controls
- **File:** Rendered in `/components/dashboards/OrganisationDashboardPage.tsx`
- **Components:** 
  - **Status Filter:** `/components/ui/select.tsx` (All, Underpaid, OK, Needs Review)
  - **Department Filter:** `/components/ui/select.tsx` (dropdown)
  - **Search Box:** `/components/ui/input.tsx` with search icon
- **Location:** Above employee table
- **Current behavior:** Filters employee table data
- **Intended behavior:** Send filters to API, update table
- **Action type:** Data filtering
- **Handler:** `handleFilterChange()` updates filter state, re-fetches data
- **Data:** Filter values (status, department, search query)
- **UI update:** Table rows filtered/updated

#### 7. Root Cause Analysis Chart
- **File:** Rendered in `/components/dashboards/OrganisationDashboardPage.tsx`
- **Component:** Recharts `BarChart`
- **Label:** Interactive bar chart
- **Location:** Dashboard analytics section
- **Current behavior:** Static chart display
- **Intended behavior:** Click bar → drill down to affected employees
- **Action type:** Chart interaction
- **Handler:** `handleChartClick(category)` (future)
- **Data:** Root cause category (e.g., "Evening penalties", "Casual loading")

#### 8. Trend Chart (Weekly)
- **File:** Rendered in `/components/dashboards/OrganisationDashboardPage.tsx`
- **Component:** Recharts `LineChart`
- **Label:** Weekly underpayment trend
- **Location:** Dashboard analytics section
- **Current behavior:** Static chart display
- **Intended behavior:** Hover → show tooltip with details
- **Already implemented:** Tooltip shows date + amount

---

### Bulk Audit Wizard
**File:** `/components/organisation/BulkAuditWizard.tsx`

**5-Step Modal Flow**

#### Overall Navigation

| Action | Button/Element | Component File | Handler | Behavior |
|--------|---------------|----------------|---------|----------|
| Close wizard | X button (top-right) | `/components/ui/button.tsx` with X icon | `onClose()` | Close wizard, return to dashboard |
| Next step | "Next" button | `/components/ui/button.tsx` | `handleNext(data)` | Save data, advance to next step |
| Previous step | "Back" button | `/components/ui/button.tsx` | `handleBack()` | Go to previous step (data preserved) |
| Jump to step | Click step in left sidebar | `/components/design-system/ProgressStepper.tsx` | `handleStepClick(stepNumber)` | Only works for completed steps |

#### Step 1: Configure Audit
**File:** Step component within `/components/organisation/BulkAuditWizard.tsx`

**Form Fields:**
1. **Organisation Name**
   - Component: `/components/ui/input.tsx`
   - Default: "BrightSteps Early Learning (VIC)"
   - Required: Yes

2. **Audit Period**
   - Component: Date range picker (using `/components/ui/calendar.tsx` or date inputs)
   - Default: "01 Jul 2025 – 14 Jul 2025"
   - Required: Yes

3. **Award**
   - Component: `/components/ui/select.tsx`
   - Default: "Children's Services Award 2010"
   - Options: List of awards
   - Required: Yes

4. **State**
   - Component: `/components/ui/select.tsx`
   - Default: "VIC"
   - Options: NSW, VIC, QLD, SA, WA, TAS, NT, ACT

5. **Include Public Holidays**
   - Component: `/components/ui/checkbox.tsx`
   - Default: Unchecked

**Buttons:**
- **"Next"**: Validates → `handleNext(configData)` → Step 2
  - Component: `/components/ui/button.tsx`
- **"Cancel"**: Closes wizard → `onClose()`
  - Component: `/components/ui/button.tsx` with `variant="outline"`

#### Step 2: Upload Employee Data
**File:** Step component within `/components/organisation/BulkAuditWizard.tsx`

**Upload Methods:**

1. **CSV Upload**
   - Component: Drag-and-drop zone built with `/components/ui/card.tsx`
   - Formats: CSV
   - Max size: 50MB (or appropriate limit)
   - Display: Drag-and-drop zone or "Browse Files" button
   - Status: Shows file name + row count when uploaded
   - Actions: "Change File" or "Remove" buttons (using `/components/ui/button.tsx`)
   - Validation: Required before Next

2. **Manual Entry** (Alternative)
   - Component: Table-like interface for entering employee data
   - Fields: Name, Role, Employment Type, Hours, etc.
   - Not currently implemented

3. **Template Download**
   - Component: `/components/ui/button.tsx` with `variant="link"`
   - Label: "Download CSV Template"
   - Action: Downloads sample CSV file

**CSV Format Expected:**
```csv
employee_id,name,role,employment_type,hours_ordinary,hours_evening,hours_weekend,base_rate,paid_amount
E001,Sarah Chen,Educator,Casual,16,2,0,28.50,540.00
E002,Michael O'Brien,Room Leader,Full-time,38,0,0,32.00,1216.00
...
```

**Upload Process:**
- Current: File stored in component state
- Intended: 
  - Upload to server: `POST /api/audit/upload-employees`
  - Receive: `{ fileId: string, rowCount: number, preview: [] }`
  - Validate CSV format server-side

**Buttons:**
- **"Back"**: Return to Step 1 → `handleBack()`
  - Component: `/components/ui/button.tsx` with `variant="outline"`
- **"Next"**: Validates file uploaded → `handleNext({ employeeFile })` → Step 3
  - Component: `/components/ui/button.tsx`

#### Step 3: Review & Confirm
**File:** Step component within `/components/organisation/BulkAuditWizard.tsx`

**Display: Summary of Configuration + Employee Preview**

Uses `/components/ui/card.tsx` for sections:

1. **Audit Configuration Summary**
   - Organisation: BrightSteps Early Learning (VIC)
   - Period: 01 Jul 2025 – 14 Jul 2025
   - Award: Children's Services Award 2010
   - State: VIC
   - Employees: 12
   - "Edit" button → Go back to Step 1

2. **Employee Preview Table**
   - Component: `/components/ui/table.tsx`
   - Shows first 10 rows from CSV
   - Columns: Name, Role, Employment Type, Total Hours, Paid Amount
   - "View All" button → Expand to show all employees

3. **Validation Warnings**
   - Component: `/components/ui/alert.tsx` with warning variant
   - Show yellow warning if:
     - Missing data in CSV
     - Invalid award classification
     - Dates outside expected range
   - Purpose: Flag potential issues before processing

**Buttons:**
- **"Back"**: Return to Step 2 → `handleBack()`
  - Component: `/components/ui/button.tsx` with `variant="outline"`
- **"Start Audit"**: Confirms data → `handleNext()` → Step 4 (processing)
  - Component: `/components/ui/button.tsx`

#### Step 4: Processing (10 Agents)
**File:** Step component within `/components/organisation/BulkAuditWizard.tsx`

**Display: Live AI Agent Processing**

Similar to Employee wizard Step 4, but for bulk processing.

**Agent Pipeline (10 Agents):**
Each agent card uses:
- `/components/ui/card.tsx` for container
- `/components/design-system/StatusBadge.tsx` for status (Running, Done, Failed)
- `/components/ui/progress.tsx` for progress bar
- `/components/ui/collapsible.tsx` for expandable logs

1. **Award Agent** - Verify award applicability
2. **CSV Parser Agent** - Parse and validate employee data
3. **Classification Agent** - Map employees to award classifications
4. **Contract Agent** (Batch) - Process all employee contracts
5. **Timesheet Agent** (Batch) - Process all timesheets
6. **Payslip Agent** (Batch) - Process all payslips
7. **Calculator Agent** (Batch) - Calculate entitlements for all
8. **Underpayment Detector** (Batch) - Identify underpayments
9. **Explanation Agent** (Batch) - Generate explanations
10. **Guardrail Agent** - Quality checks on all results

**UI Display:**
- Overall progress: "Processing 8 of 12 employees..."
- Per-agent progress bar
- Estimated time remaining
- Current employee being processed (if applicable)

**Current Implementation:**
- Simulated with `setTimeout()` delays
- Hardcoded to always succeed

**Intended Implementation:**
- WebSocket connection: `ws://api/audit/${auditId}/progress`
- Real-time updates as each agent completes
- Handle failures: Retry button, skip employee, error details
- Logs streamed live

**Auto-Advance:**
- When all agents complete successfully → `handleNext({ results })` → Step 5

#### Step 5: Results Summary
**File:** Step component within `/components/organisation/BulkAuditWizard.tsx`

**Display: High-Level Summary**

Uses `/components/ui/card.tsx` for metric cards:

**Summary Metrics:**
- Total Employees Processed: 12
- Underpaid: 8 (66.7%)
  - Badge: `/components/design-system/SeverityBadge.tsx` with "underpaid" variant
- OK: 4 (33.3%)
- Total Underpayment: -$1,248.00
- Average Underpayment per Employee: -$156.00

**Top Issues:**
- Component: List with bullet points
- "Evening penalties not paid (5 employees)"
- "Casual loading miscalculated (3 employees)"
- "Split shift allowance missing (2 employees)"

**Buttons:**
- **"View Full Report"**: Navigate to Comprehensive Audit Review page
  - Component: `/components/ui/button.tsx`
  - Handler: `handleViewFullReport()` → `onComplete(auditId)` → `setCurrentView('comprehensive-review')`
- **"Download CSV"**: Export results as CSV
  - Component: `/components/ui/button.tsx` with `variant="outline"`
  - Handler: `handleDownloadCSV()`
  - API: `GET /api/audit/${auditId}/export/csv`
- **"Done"**: Return to dashboard
  - Component: `/components/ui/button.tsx` with `variant="outline"`
  - Handler: `onClose()`

---

### Comprehensive Audit Review
**File:** `/components/organisation/ComprehensiveAuditReview.tsx`

**Triggered by:** Clicking "View Full Report" in wizard Step 5

**Display:** 3-tab detailed review page

**Top Header:**
- Component: Custom header or `/components/design-system/PageHeader.tsx`
- Back button → Returns to dashboard
  - Component: `/components/ui/button.tsx` with ArrowLeft icon
- Audit title: "Bulk Audit: BrightSteps Early Learning"
- Date: "14 Jul 2025"
- Status badge: "Completed"
  - Component: `/components/design-system/StatusBadge.tsx`

**3 Tabs:**
Uses `/components/ui/tabs.tsx` for navigation:

#### Tab 1: All Employees
- **Component:** `/components/ui/table.tsx`
- **Columns:** Name, Role, Status, Underpayment, Actions
- **Features:**
  - Sortable columns
  - Filter by status (using `/components/ui/select.tsx`)
  - Search by name (using `/components/ui/input.tsx`)
  - Color-coded status badges (`/components/design-system/SeverityBadge.tsx`)
  - "View Details" button per row → Opens employee detail (conceptual)

**Sample Row:**
- Sarah Chen | Educator | Underpaid | -$72.00 | [View Details]
- Status shown with `/components/design-system/SeverityBadge.tsx`

#### Tab 2: Analytics & Insights
**Display:** Charts and root cause analysis

Uses Recharts library components and `/components/ui/card.tsx`:

1. **Payment Status Distribution** (4 cards)
   - OK Employees: 4 (33.3%)
   - Underpaid: 8 (66.7%)
   - Overpaid: 0 (0%)
   - Needs Review: 0 (0%)
   - Each card uses `/components/ui/card.tsx` with colored border

2. **Root Cause Analysis**
   - Component: Recharts `BarChart`
   - X-axis: Issue categories
   - Y-axis: Number of affected employees
   - Bars: Evening penalties (5), Casual loading (3), Split shift (2)

3. **Underpayment by Day of Week**
   - Component: Recharts `BarChart`
   - Shows which days most underpayments occur

4. **Underpayment by Pay Code**
   - Component: Recharts `BarChart`
   - Shows which pay components are miscalculated

5. **High-Risk Pattern Recommendations**
   - Component: `/components/ui/card.tsx` with list
   - "Review all evening shift calculations"
   - "Verify casual loading formula in payroll system"
   - "Check split shift allowance logic"

**Interactions:**
- Click chart bar → Filter employee table to show affected employees (conceptual)

#### Tab 3: Human Review (HITL)
**Display:** Queue of employees needing manual review

- **Component:** `/components/ui/table.tsx`
- **Columns:** Employee Name, Issue, Confidence, Actions
- **Features:**
  - Low-confidence results flagged for review
  - "Review" button per row → Opens review modal
    - Component: `/components/ui/dialog.tsx`
  - Approve/Reject actions

**Sample Row:**
- Michael O'Brien | Complex classification | 67% | [Review]
- Confidence shown with `/components/design-system/AnomalyScorePill.tsx`

**Review Modal:**
- Component: `/components/ui/dialog.tsx`
- Shows:
  - Employee details
  - AI reasoning
  - Extracted data
  - Suggested action
- Actions:
  - "Approve" button → Mark as reviewed
  - "Override" button → Manually adjust values
  - "Flag for Follow-up" button → Add to follow-up queue
  - All buttons use `/components/ui/button.tsx`

**Buttons at Bottom:**
- **"Download Full Report"**: Export PDF
  - Component: `/components/ui/button.tsx`
  - Handler: `handleDownloadReport()`
  - API: `GET /api/audit/${auditId}/report/pdf`
- **"Done"**: Return to dashboard
  - Component: `/components/ui/button.tsx` with `variant="outline"`
  - Handler: `onBack()`

---

### Audit History Page
**File:** `/components/organisation/AuditHistoryPage.tsx`

**Triggered by:** Clicking "View History" from dashboard

**Display:** List of all past audit requests

**Top Header:**
- Component: Custom header or `/components/design-system/PageHeader.tsx`
- Back button → Returns to dashboard
  - Component: `/components/ui/button.tsx` with ArrowLeft icon
- Title: "Audit History"
- Action button: "New Bulk Audit"
  - Component: `/components/ui/button.tsx`
  - Opens wizard

**Summary Cards (Top Section):**
Uses `/components/ui/card.tsx`:
- Total Audits: 24
- Employees Audited: 1,432
- Total Underpayment Found: $18,492
- Average per Audit: $770.50

**Filter Controls:**
Uses various components:
1. **Search Box**
   - Component: `/components/ui/input.tsx` with search icon
   - Placeholder: "Search by organisation, period, or audit ID..."
2. **Status Filter**
   - Component: `/components/ui/select.tsx`
   - Options: All Status, Completed, Processing, Failed
3. **Date Range Filter**
   - Component: Date range picker
4. **"Show underpaid only" Checkbox**
   - Component: `/components/ui/checkbox.tsx`
   - Filters to only show audits with underpayments

**Audit History Table:**
- **Component:** `/components/ui/table.tsx`
- **Columns:** 
  - Audit ID (e.g., "AUD-2025-007")
  - Organisation Name
  - Period
  - Employees Audited
  - Underpaid Count
  - Total Underpayment
  - Status (using `/components/design-system/StatusBadge.tsx`)
  - Date Completed
  - Actions

**Sample Row:**
- AUD-2025-007 | BrightSteps Early Learning | 01-14 Jul | 12 | 8 | -$1,248 | ✓ Completed | 14 Jul 2025 | [View]

**Interactions:**

1. **Table Row Click**
   - Handler: `handleRowClick(auditId)`
   - Action: Navigate to Audit Detail Page
   - Target: `/components/organisation/AuditDetailPage.tsx`
   - State change: `onViewDetail(auditId)` → `setCurrentView('audit-detail')` + `setSelectedAuditId(auditId)`

2. **"View" Button**
   - Component: `/components/ui/button.tsx` with `size="sm"`
   - Same as row click

3. **Filter Changes**
   - Handler: `handleFilterChange()`
   - Updates table data based on filters
   - Current: Filters inline array
   - Intended: Call API with filter params

4. **Sort Columns**
   - Handler: `handleSort(column)`
   - Toggles ascending/descending
   - Current: Sorts inline array
   - Intended: Call API with sort params

**Buttons at Bottom:**
- **"Export History"**: Download all audit history as CSV
  - Component: `/components/ui/button.tsx` with `variant="outline"`
  - API: `GET /api/audit/export/history`

**Pagination:**
- Component: `/components/ui/pagination.tsx` (if available) or custom
- Shows: "Showing 1-10 of 24"
- Next/Previous buttons

---

### Audit Detail Page
**File:** `/components/organisation/AuditDetailPage.tsx`

**Triggered by:** Clicking audit row in Audit History

**Display:** 6-tab detailed view of single audit

**Top Header:**
- Component: Custom header
- Back button → Returns to Audit History
  - Component: `/components/ui/button.tsx` with ArrowLeft icon
- Audit ID badge: "AUD-2025-007"
  - Component: `/components/ui/badge.tsx`
- Organisation: "BrightSteps Early Learning"
- Period: "01–14 Jul 2025"
- Status: "Completed"
  - Component: `/components/design-system/StatusBadge.tsx`

**Key Metrics Row:**
Uses `/components/ui/card.tsx` or similar:
- Employees Audited: 12
- Underpaid: 8
- Total Underpayment: -$1,248.00
- Status: Completed

**6 Tabs:**
Uses `/components/ui/tabs.tsx` for navigation:

#### Tab 1: Original Inputs
**Display:** The configuration and data used for this audit

Uses `/components/ui/card.tsx` for sections:

1. **Audit Configuration**
   - Organisation: BrightSteps Early Learning (VIC)
   - Period: 01 Jul 2025 – 14 Jul 2025
   - Award: Children's Services Award 2010
   - State: VIC
   - Submitted By: Jane Smith (auditor@brightsteps.com)
   - Submitted Date: 14 Jul 2025, 09:15 AM

2. **Employee Data Source**
   - Upload Method: CSV File
   - File Name: "employees_july_2025.csv"
   - Row Count: 12
   - "Download Original File" button
     - Component: `/components/ui/button.tsx` with `variant="link"`
     - Downloads original CSV

3. **Input Validation Results**
   - Component: `/components/ui/alert.tsx` (if warnings) or success message
   - "All inputs validated successfully" or
   - Warning: "2 employees missing base rate data (used default)"

#### Tab 2: Processing & Agents
**Display:** Agent execution timeline and logs

Uses `/components/ui/card.tsx` for each agent:

**Agent Pipeline Display (10 Agents):**
Similar to wizard Step 4, but showing completed status:

1. Award Agent - ✓ Done (2.3s)
2. CSV Parser Agent - ✓ Done (1.8s)
3. Classification Agent - ✓ Done (3.1s)
4. Contract Agent (Batch) - ✓ Done (12.5s)
5. Timesheet Agent (Batch) - ✓ Done (15.2s)
6. Payslip Agent (Batch) - ✓ Done (11.8s)
7. Calculator Agent (Batch) - ✓ Done (8.4s)
8. Underpayment Detector - ✓ Done (4.2s)
9. Explanation Agent (Batch) - ✓ Done (7.6s)
10. Guardrail Agent - ✓ Done (3.9s)

**Each agent card shows:**
- Agent name
- Status badge (`/components/design-system/StatusBadge.tsx`)
- Duration
- "View Logs" expandable (using `/components/ui/collapsible.tsx`)
  - Shows detailed logs when expanded

**Overall Stats:**
- Total Processing Time: 1m 14s
- Start: 14 Jul 2025, 09:15:23 AM
- End: 14 Jul 2025, 09:16:37 AM

#### Tab 3: Employee Results
**Display:** Same as "All Employees" tab in Comprehensive Audit Review

- **Component:** `/components/ui/table.tsx`
- **Columns:** Name, Role, Status, Underpayment, Confidence, Actions
- **Features:**
  - Sortable columns
  - Filter by status
  - Search by name
  - Color-coded status badges
  - "View Details" button per row

**Interactions:**
- Click row or "View Details" → Open employee detail modal (conceptual)
  - Component: `/components/ui/dialog.tsx`
  - Shows: Employee calculation breakdown, evidence, explanation

#### Tab 4: Analytics & Insights
**Display:** Identical to Tab 2 in Comprehensive Audit Review

Uses Recharts and `/components/ui/card.tsx`:

1. Payment Status Distribution Cards
2. Root Cause Analysis Chart
3. Underpayment by Day Chart
4. Underpayment by Pay Code Chart
5. High-Risk Pattern Recommendations

Same components and interactions as Comprehensive Audit Review Tab 2.

#### Tab 5: Human Review (HITL)
**Display:** Identical to Tab 3 in Comprehensive Audit Review

- **Component:** `/components/ui/table.tsx`
- Shows employees flagged for manual review
- Review modal (using `/components/ui/dialog.tsx`)
- Approve/Reject actions

#### Tab 6: Audit Timeline
**Display:** Chronological log of all events

- **Component:** List structure with `/components/ui/card.tsx` or custom timeline
- Shows:
  - Audit created
  - Configuration saved
  - Employees uploaded
  - Each agent execution (with timestamp)
  - Analysis complete
  - Report generated
  - Human reviews conducted
  - Audit finalized

**Each timeline event shows:**
- Time: "14 Jul 2025, 09:15:23 AM"
- Event: "Audit created by Jane Smith"
- Agent/Actor: "System" or agent name
- Status badge (`/components/design-system/StatusBadge.tsx`)
- Details: Expandable to show more info

**Buttons at Bottom:**
- **"Download Full Report"**: Export PDF
  - Component: `/components/ui/button.tsx`
  - API: `GET /api/audit/${auditId}/report/pdf`
- **"Export as CSV"**: Export employee results
  - Component: `/components/ui/button.tsx` with `variant="outline"`
  - API: `GET /api/audit/${auditId}/export/csv`

---

### Review Queue Page
**File:** `/components/organisation/ReviewQueuePage.tsx`

**Triggered by:** Clicking "Review Now" from dashboard

**Display:** Human-in-the-loop review queue

**Top Header:**
- Component: Custom header
- Back button → Returns to dashboard
  - Component: `/components/ui/button.tsx` with ArrowLeft icon
- Title: "Review Queue"
- Subtitle: "8 items need your attention"

**Summary Cards:**
Uses `/components/ui/card.tsx`:
- Pending Reviews: 8
- Reviewed Today: 4
- Average Confidence: 72%
- High Priority: 3

**Filter Controls:**
Uses various components:
1. **Priority Filter**
   - Component: `/components/ui/select.tsx`
   - Options: All, High, Medium, Low
2. **Audit Filter**
   - Component: `/components/ui/select.tsx`
   - Options: All Audits, AUD-2025-007, AUD-2025-006, etc.
3. **Confidence Range**
   - Component: Slider or number inputs
   - Filter by confidence score (e.g., 0-50%, 50-75%, 75-100%)

**Review Queue Table:**
- **Component:** `/components/ui/table.tsx`
- **Columns:**
  - Priority (icon: alert, info)
  - Employee Name
  - Audit ID
  - Issue Description
  - Confidence Score (using `/components/design-system/AnomalyScorePill.tsx`)
  - Flagged Date
  - Actions

**Sample Row:**
- ⚠️ High | Michael O'Brien | AUD-2025-007 | Complex classification mapping | 67% | 14 Jul 2025 | [Review]

**Interactions:**

1. **"Review" Button**
   - Component: `/components/ui/button.tsx` with `size="sm"`
   - Handler: `handleReviewClick(itemId)`
   - Opens review modal
   - Modal component: `/components/ui/dialog.tsx`

**Review Modal Structure:**
Uses `/components/ui/dialog.tsx`:

**Modal Header:**
- Title: "Review: Michael O'Brien"
- Subtitle: "Audit AUD-2025-007 • Casual Educator"
- Close button (X)

**Modal Content:**
Tabs or sections using `/components/ui/tabs.tsx` or card layout:

1. **AI Analysis**
   - Shows extracted data
   - Shows calculated entitlement
   - Shows AI reasoning
   - Confidence score

2. **Evidence**
   - Contract excerpt
   - Timesheet excerpt
   - Payslip excerpt
   - Award clause citations

3. **Issue Details**
   - "AI classified employee as Level 2, but contract shows Level 3"
   - "Recommended Action: Verify classification with contract"

**Modal Actions:**
Uses `/components/ui/button.tsx`:
1. **"Approve AI Result"**
   - Accept AI analysis as-is
   - Handler: `handleApprove(itemId)`
   - API: `POST /api/review/${itemId}/approve`
   - Closes modal, removes from queue

2. **"Override & Edit"**
   - Opens inline editor to manually adjust values
   - Shows editable fields (using `/components/ui/input.tsx`)
   - "Save Changes" button
   - Handler: `handleOverride(itemId, newValues)`
   - API: `POST /api/review/${itemId}/override`

3. **"Flag for Follow-up"**
   - Add to follow-up queue
   - Add notes (using `/components/ui/textarea.tsx`)
   - Handler: `handleFlag(itemId, notes)`
   - API: `POST /api/review/${itemId}/flag`

4. **"Reject & Exclude"**
   - Exclude employee from audit results
   - Add reason (using `/components/ui/textarea.tsx`)
   - Handler: `handleReject(itemId, reason)`
   - API: `POST /api/review/${itemId}/reject`

**Modal Footer:**
- Shows: "8 items remaining in queue"
- "Previous" button → Load previous item
- "Next" button → Load next item
  - Auto-loads next item after action taken

**Bulk Actions:**
At top of table:
- "Approve All Low-Risk" button
  - Component: `/components/ui/button.tsx`
  - Approves all items with confidence > 80%
- "Export Queue" button
  - Downloads CSV of queue items

---

## F) Data Model Reference

**Note:** These TypeScript interfaces are for documentation and type safety. They represent the expected data structure when the app is connected to a real backend.

**Recommended Location:** Create `/types/organisation.ts` to house these interfaces

### Core Types

```typescript
// ============================================================
// BULK AUDIT REQUEST & RESPONSE
// ============================================================

/**
 * Represents a bulk audit request for multiple employees
 * Used by:
 * - /components/organisation/BulkAuditWizard.tsx (wizard)
 * - /components/organisation/AuditHistoryPage.tsx (history list)
 * - /components/organisation/AuditDetailPage.tsx (detail view)
 * - /components/organisation/ComprehensiveAuditReview.tsx (review page)
 */
interface BulkAuditRequest {
  id: string;                          // Unique audit ID (e.g., "AUD-2025-007")
  
  // Configuration (from wizard Step 1)
  organisationName: string;            // "BrightSteps Early Learning (VIC)"
  auditPeriodStart: Date;              // "2025-07-01"
  auditPeriodEnd: Date;                // "2025-07-14"
  awardName: string;                   // "Children's Services Award 2010"
  state: AustralianState;              // "VIC"
  includePublicHolidays: boolean;
  
  // Employee data (from wizard Step 2)
  employeeCount: number;               // 12
  employeeDataSource: 'csv' | 'manual' | 'api';
  csvFileUrl?: string;                 // S3 URL if uploaded via CSV
  employees: BulkAuditEmployee[];      // Array of employee data
  
  // Processing status (from wizard Step 4)
  status: AuditStatus;                 // 'processing' | 'completed' | 'failed'
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  processingDuration?: number;         // Seconds
  
  // Results summary (from wizard Step 5)
  resultsummary: {
    totalEmployees: number;
    underpaidCount: number;
    okCount: number;
    needsReviewCount: number;
    totalUnderpayment: number;         // Sum of all underpayments
    averageUnderpayment: number;
    topIssues: string[];               // ["Evening penalties", "Casual loading"]
  };
  
  // Analytics data (for charts in Tab 2)
  analytics: {
    rootCauseBreakdown: Array<{
      category: string;
      count: number;
    }>;
    underpaymentByDay: Array<{
      day: string;
      amount: number;
    }>;
    underpaymentByPayCode: Array<{
      payCode: string;
      amount: number;
    }>;
  };
  
  // HITL queue (Tab 3)
  hitlQueue: HITLReviewItem[];
  
  // Metadata
  createdBy: string;                   // User ID or email
  createdAt: Date;
  lastModifiedAt: Date;
}

type AuditStatus = 'draft' | 'processing' | 'completed' | 'failed' | 'cancelled';
// Rendered using /components/design-system/StatusBadge.tsx

type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

/**
 * Single employee within a bulk audit
 * Displayed in employee table using /components/ui/table.tsx
 * Status shown with /components/design-system/SeverityBadge.tsx
 */
interface BulkAuditEmployee {
  employeeId: string;                  // "E001"
  name: string;                        // "Sarah Chen"
  role: string;                        // "Educator"
  employmentType: EmploymentType;      // "Casual"
  
  // Hours worked (from CSV or manual entry)
  hoursOrdinary: number;
  hoursEvening?: number;
  hoursWeekend?: number;
  hoursPublicHoliday?: number;
  
  // Pay rates (from contract or CSV)
  baseRate: number;                    // $/hr
  eveningRate?: number;
  weekendRate?: number;
  
  // Amounts
  paidAmount: number;                  // From payslip
  entitledAmount: number;              // Calculated
  difference: number;                  // Underpayment (negative) or overpayment (positive)
  
  // Analysis
  status: PaymentSeverity;             // 'ok' | 'underpaid' | 'needs-review'
  confidence: number;                  // 0.0-1.0
  issues: string[];                    // ["Evening penalties not paid"]
  explanation?: string;                // Plain English explanation
  
  // Evidence
  evidenceItems: Evidence[];           // Supporting documents/citations
  
  // HITL flag
  requiresReview: boolean;             // If true, added to HITL queue
  reviewPriority?: 'high' | 'medium' | 'low';
}

type EmploymentType = 'full-time' | 'part-time' | 'casual';

type PaymentSeverity = 'ok' | 'underpaid' | 'overpaid' | 'needs-review';
// Rendered using /components/design-system/SeverityBadge.tsx

/**
 * Evidence item (same as Employee experience)
 * Displayed with /components/ui/card.tsx
 */
interface Evidence {
  type: 'contract' | 'timesheet' | 'payslip' | 'award';
  title: string;
  excerpt: string;
  reference: string;
  confidence: number;
}

// ============================================================
// HUMAN-IN-THE-LOOP (HITL) REVIEW
// ============================================================

/**
 * Item in HITL review queue
 * Used by:
 * - /components/organisation/ReviewQueuePage.tsx (full queue)
 * - /components/organisation/ComprehensiveAuditReview.tsx (Tab 3)
 * - /components/organisation/AuditDetailPage.tsx (Tab 5)
 */
interface HITLReviewItem {
  id: string;                          // Unique review item ID
  auditId: string;                     // Parent audit ID
  employeeId: string;
  employeeName: string;
  
  // Issue details
  issueType: string;                   // "Complex classification", "Low confidence", etc.
  issueDescription: string;            // Detailed explanation
  confidence: number;                  // 0.0-1.0 (shown with AnomalyScorePill.tsx)
  priority: 'high' | 'medium' | 'low'; // Based on confidence or issue type
  
  // AI analysis
  aiReasoning: string;                 // Why flagged for review
  suggestedAction: string;             // Recommended next step
  
  // Evidence
  evidenceItems: Evidence[];
  
  // Review status
  reviewStatus: 'pending' | 'approved' | 'overridden' | 'rejected' | 'flagged';
  reviewedBy?: string;                 // User ID
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // If overridden
  originalValues?: {
    paidAmount: number;
    entitledAmount: number;
    difference: number;
  };
  overriddenValues?: {
    paidAmount: number;
    entitledAmount: number;
    difference: number;
    reason: string;
  };
  
  // Metadata
  flaggedAt: Date;
}

// ============================================================
// AGENT EXECUTION (Wizard Step 4, Audit Detail Tab 2)
// ============================================================

/**
 * Status of one agent in the 10-agent pipeline (bulk version)
 * Displayed using:
 * - /components/ui/card.tsx for container
 * - /components/design-system/StatusBadge.tsx for status
 * - /components/ui/progress.tsx for progress bar
 */
interface BulkAgentStatus {
  id: string;
  name: string;                        // "CSV Parser Agent", "Calculator Agent (Batch)", etc.
  sequenceNumber: number;              // 1-10
  status: 'pending' | 'running' | 'done' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;                   // Seconds
  progress?: number;                   // 0-100
  progressMessage?: string;            // "Processing 8 of 12 employees..."
  errorMessage?: string;
  logs: AgentLog[];
}

interface AgentLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}

// ============================================================
// DASHBOARD METRICS
// ============================================================

/**
 * Dashboard summary data
 * Used by: /components/dashboards/OrganisationDashboardPage.tsx
 * Fetched from API: GET /api/organisation/dashboard
 */
interface OrganisationDashboardMetrics {
  // Key metrics (displayed in cards using /components/ui/card.tsx)
  totalEmployees: number;              // 143
  underpaidEmployees: number;          // 12
  reviewQueueCount: number;            // 8
  totalAtRisk: number;                 // $4,284
  
  // High-risk employees (for table using /components/ui/table.tsx)
  highRiskEmployees: Array<{
    employeeId: string;
    name: string;
    role: string;
    status: PaymentSeverity;           // Shown with /components/design-system/SeverityBadge.tsx
    underpayment: number;
    lastAuditDate: string;
  }>;
  
  // Root cause breakdown (for chart using Recharts BarChart)
  rootCauses: Array<{
    category: string;                  // "Evening penalties", "Casual loading", etc.
    count: number;
    amount: number;
  }>;
  
  // Weekly trend (for chart using Recharts LineChart)
  weeklyTrend: Array<{
    week: string;                      // "Week 1", "Week 2", etc.
    underpaymentCount: number;
    totalAmount: number;
  }>;
  
  // Recent audits (for quick access)
  recentAudits: Array<{
    auditId: string;
    organisationName: string;
    period: string;
    employeeCount: number;
    underpaidCount: number;
    completedDate: string;
  }>;
}

// ============================================================
// AUDIT HISTORY
// ============================================================

/**
 * Summary data for audit history list
 * Used by: /components/organisation/AuditHistoryPage.tsx
 * Displayed in table using /components/ui/table.tsx
 */
interface AuditHistorySummary {
  id: string;                          // "AUD-2025-007"
  organisationName: string;            // "BrightSteps Early Learning"
  period: string;                      // "01–14 Jul"
  employeeCount: number;               // 12
  underpaidCount: number;              // 8
  totalUnderpayment: number;           // -$1,248
  status: AuditStatus;                 // Shown with /components/design-system/StatusBadge.tsx
  completedDate: string;               // "14 Jul 2025"
  createdBy: string;                   // User name or email
}

// ============================================================
// CSV UPLOAD
// ============================================================

/**
 * CSV upload response (Wizard Step 2)
 * Received from API: POST /api/audit/upload-employees
 */
interface CSVUploadResponse {
  fileId: string;
  fileName: string;
  rowCount: number;
  validRows: number;
  invalidRows: number;
  preview: Array<{                     // First 10 rows
    employeeId: string;
    name: string;
    role: string;
    employmentType: string;
    totalHours: number;
    paidAmount: number;
  }>;
  validationErrors?: Array<{
    row: number;
    field: string;
    error: string;
  }>;
}

// ============================================================
// EXPORT FORMATS
// ============================================================

/**
 * Export request for audit results
 * API: GET /api/audit/${auditId}/export/csv
 * API: GET /api/audit/${auditId}/report/pdf
 */
interface ExportRequest {
  auditId: string;
  format: 'csv' | 'pdf' | 'xlsx';
  includeEvidence?: boolean;           // For PDF
  includeCharts?: boolean;             // For PDF
}

// ============================================================
// API RESPONSE WRAPPERS
// ============================================================

/**
 * Standard API response wrapper
 * Used by all API services in /services/
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
  };
}

// ============================================================
// WIZARD STATE (Internal to BulkAuditWizard.tsx)
// ============================================================

/**
 * Wizard data structure
 * Used internally by /components/organisation/BulkAuditWizard.tsx
 * Passed between wizard steps as props
 */
interface BulkAuditWizardData {
  // Step 1: Configuration
  organisationName: string;
  auditPeriodStart: string;            // ISO date string
  auditPeriodEnd: string;
  awardName: string;
  state: string;
  includePublicHolidays: boolean;
  
  // Step 2: Employee data
  employeeFile: File | null;
  csvData?: CSVUploadResponse;
  
  // Step 3: Review
  confirmedData?: any;                 // Validated configuration
  
  // Step 4-5: Results
  auditId?: string;
  results?: BulkAuditRequest;
}
```

---

## G) Implementation Guidelines

### Overview
This section explains HOW a developer would wire the existing UI to real backend systems, APIs, and databases. It does NOT provide implementation code, but conceptual steps and file locations.

**Key Principle:** All components are UI-ready. Data flows need to be connected to real APIs.

---

### 1. Replace Sample Data with API Calls

#### Current State
All Organisation/Auditor pages use inline sample data:
- `/components/dashboards/OrganisationDashboardPage.tsx`: Dashboard KPIs, employee list, charts
- `/components/organisation/AuditHistoryPage.tsx`: List of past audits (7 sample audits)
- `/components/organisation/AuditDetailPage.tsx`: Detailed audit data with 6 tabs
- `/components/organisation/ComprehensiveAuditReview.tsx`: Employee results, analytics

#### Steps to Replace with Real Data

**Step 1: Create API Service Layer**

Create new file: `/services/auditApi.ts`

```typescript
// Conceptual structure (not actual code)
// File: /services/auditApi.ts

export async function fetchDashboardMetrics(): Promise<OrganisationDashboardMetrics>
export async function fetchAuditHistory(): Promise<AuditHistorySummary[]>
export async function fetchAuditDetail(auditId: string): Promise<BulkAuditRequest>
export async function submitBulkAudit(data: BulkAuditWizardData): Promise<{ auditId: string }>
export async function uploadEmployeeCSV(file: File): Promise<CSVUploadResponse>
export async function startBulkAuditProcessing(auditId: string): Promise<{ websocketUrl: string }>
export async function fetchHITLQueue(): Promise<HITLReviewItem[]>
export async function submitReview(itemId: string, action: string, data?: any): Promise<void>
```

**Step 2: Add Data Fetching Hooks**

Create custom hooks in `/hooks/useAuditData.ts`:

```typescript
// File: /hooks/useAuditData.ts
// Conceptual

export function useDashboardMetrics() {
  const [data, setData] = useState<OrganisationDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    fetchDashboardMetrics()  // from /services/auditApi.ts
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  return { data, loading, error, refetch };
}

export function useAuditHistory(filters?: any) {
  // Similar pattern
}

export function useAuditDetail(auditId: string) {
  // Similar pattern
}

export function useHITLQueue() {
  // Similar pattern
}
```

**Step 3: Replace Sample Data in Components**

**In `/components/dashboards/OrganisationDashboardPage.tsx`:**
- Remove inline sample data (dashboard metrics, employees, chart data)
- Add: `const { data, loading, error } = useDashboardMetrics()`
- Add loading spinner: `{loading && <Skeleton />}` (using `/components/ui/skeleton.tsx`)
- Add error display: `{error && <Alert variant="destructive">{error.message}</Alert>}` (using `/components/ui/alert.tsx`)

**In `/components/organisation/AuditHistoryPage.tsx`:**
- Remove inline audit history array
- Add: `const { data: audits, loading, error } = useAuditHistory(filters)`
- Use `audits` to populate table

**In `/components/organisation/AuditDetailPage.tsx`:**
- Remove inline audit detail data
- Add: `const { data: auditData, loading, error } = useAuditDetail(auditId)`
- Use `auditData` to populate all 6 tabs

---

### 2. Implement Bulk Audit Wizard with Real Processing

**File:** `/components/organisation/BulkAuditWizard.tsx`

#### Step 1: Configure Audit (No API Yet)
- Store form data in local state
- Validation is already implemented in component
- No API call needed until submission

#### Step 2: Upload Employee Data
**File:** Step component within `/components/organisation/BulkAuditWizard.tsx`

**Current:** CSV file stored in component state only

**Implement:**
1. Create upload handler:
   ```typescript
   // In /components/organisation/BulkAuditWizard.tsx
   const handleCSVUpload = async (file: File) => {
     setUploading(true);
     try {
       const result = await uploadEmployeeCSV(file);  // from /services/auditApi.ts
       // result = CSVUploadResponse with fileId, rowCount, preview, errors
       setCSVData(result);
       return result.fileId;
     } catch (error) {
       setError('Failed to upload CSV');
     } finally {
       setUploading(false);
     }
   };
   ```

2. Upload on file selection
3. Show upload progress using `/components/ui/progress.tsx`
4. Display preview table (first 10 rows) using `/components/ui/table.tsx`
5. Show validation errors if any using `/components/ui/alert.tsx`

#### Step 3: Review & Confirm
**File:** Step component within `/components/organisation/BulkAuditWizard.tsx`

**Display:** Summary of configuration + employee preview

- No API call needed
- Just displays data from Steps 1 & 2
- User confirms before processing starts

#### Step 4: Processing (10 Agents)
**File:** Step component within `/components/organisation/BulkAuditWizard.tsx`

**Current:** Simulated with setTimeout

**Implement:**
1. Create WebSocket connection:
   ```typescript
   // In /components/organisation/BulkAuditWizard.tsx Step 4
   useEffect(() => {
     const startProcessing = async () => {
       // Submit audit and start processing
       const { auditId, websocketUrl } = await startBulkAuditProcessing({  // from /services/auditApi.ts
         ...wizardData,
         csvFileId: csvData.fileId
       });
       
       // Connect to WebSocket for live updates
       const ws = new WebSocket(websocketUrl);
       
       ws.onopen = () => {
         console.log('Connected to audit processing stream');
       };
       
       ws.onmessage = (event) => {
         const update = JSON.parse(event.data);
         // update = { agentId, status, progress, message, logs, currentEmployee }
         
         // Update UI
         updateAgentStatus(update.agentId, {
           status: update.status,          // Update /components/design-system/StatusBadge.tsx
           progress: update.progress,      // Update /components/ui/progress.tsx
           progressMessage: update.message, // e.g., "Processing 8 of 12 employees..."
           logs: [...existingLogs, ...update.logs]
         });
         
         // Check if all agents complete
         if (update.type === 'COMPLETE') {
           setResults(update.results);
           handleNext({ results: update.results });
         }
       };
       
       ws.onerror = (error) => {
         setError('Processing failed');
       };
       
       return () => ws.close();
     };
     
     startProcessing();
   }, []);
   ```

2. Backend implements:
   - Orchestrates 10 agents in sequence
   - Processes all employees in batch
   - Sends WebSocket updates:
     - Per-agent progress
     - Overall progress (e.g., "8 of 12 employees processed")
     - Individual employee completion
   - Message format: `{ agentId, name, status, duration, progress, progressMessage, logs[] }`

3. Handle failures:
   - If agent fails for specific employee, continue with others
   - Show "Retry" button for failed items
   - Allow skipping failed employees
   - Show detailed error logs using `/components/ui/collapsible.tsx`

#### Step 5: Results Summary
**File:** Step component within `/components/organisation/BulkAuditWizard.tsx`

**Display:** High-level summary metrics

**After Step 4:** Results already received from WebSocket, stored in wizard state

**No additional API needed** - just display results using:
- `/components/ui/card.tsx` for metrics
- `/components/design-system/SeverityBadge.tsx` for status

---

### 3. Implement Review Queue with HITL Actions

**File:** `/components/organisation/ReviewQueuePage.tsx`

#### Current State
- Static queue with sample data
- Review modal is placeholder

#### Steps to Implement

**Step 1: Fetch Queue Data**

```typescript
// In /components/organisation/ReviewQueuePage.tsx
const { data: queueItems, loading, error, refetch } = useHITLQueue();  // from /hooks/useAuditData.ts

// Display in table using /components/ui/table.tsx
{queueItems.map(item => (
  <TableRow key={item.id}>
    <TableCell>{item.priority}</TableCell>
    <TableCell>{item.employeeName}</TableCell>
    <TableCell>{item.issueDescription}</TableCell>
    <TableCell>
      <AnomalyScorePill score={item.confidence * 100} />  {/* /components/design-system/AnomalyScorePill.tsx */}
    </TableCell>
    <TableCell>
      <Button onClick={() => openReviewModal(item.id)}>Review</Button>
    </TableCell>
  </TableRow>
))}
```

**Step 2: Implement Review Modal**

```typescript
// In /components/organisation/ReviewQueuePage.tsx
const [reviewModalOpen, setReviewModalOpen] = useState(false);
const [currentReviewItem, setCurrentReviewItem] = useState<HITLReviewItem | null>(null);

const openReviewModal = async (itemId: string) => {
  const item = queueItems.find(i => i.id === itemId);
  setCurrentReviewItem(item);
  setReviewModalOpen(true);
};

// Modal component: /components/ui/dialog.tsx
<Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Review: {currentReviewItem?.employeeName}</DialogTitle>
    </DialogHeader>
    
    {/* Tabs or sections showing AI analysis, evidence, issue details */}
    <Tabs defaultValue="analysis">  {/* /components/ui/tabs.tsx */}
      <TabsList>
        <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        <TabsTrigger value="evidence">Evidence</TabsTrigger>
        <TabsTrigger value="issue">Issue Details</TabsTrigger>
      </TabsList>
      
      <TabsContent value="analysis">
        {/* Show AI reasoning, confidence, suggested action */}
      </TabsContent>
      
      <TabsContent value="evidence">
        {/* Show evidence items using /components/ui/card.tsx */}
      </TabsContent>
      
      <TabsContent value="issue">
        {/* Show issue description and recommended next steps */}
      </TabsContent>
    </Tabs>
    
    <DialogFooter>
      <Button onClick={handleApprove} variant="default">Approve AI Result</Button>  {/* /components/ui/button.tsx */}
      <Button onClick={handleOverride} variant="secondary">Override & Edit</Button>
      <Button onClick={handleFlag} variant="outline">Flag for Follow-up</Button>
      <Button onClick={handleReject} variant="destructive">Reject & Exclude</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Step 3: Implement Review Actions**

```typescript
// In /components/organisation/ReviewQueuePage.tsx
const handleApprove = async () => {
  try {
    await submitReview(currentReviewItem.id, 'approve');  // from /services/auditApi.ts
    toast.success('Review approved');  // from sonner@2.0.3
    refetch();  // Refresh queue
    setReviewModalOpen(false);
  } catch (error) {
    toast.error('Failed to approve review');
  }
};

const handleOverride = async (newValues: any) => {
  try {
    await submitReview(currentReviewItem.id, 'override', newValues);
    toast.success('Override saved');
    refetch();
    setReviewModalOpen(false);
  } catch (error) {
    toast.error('Failed to save override');
  }
};

const handleFlag = async (notes: string) => {
  try {
    await submitReview(currentReviewItem.id, 'flag', { notes });
    toast.success('Flagged for follow-up');
    refetch();
    setReviewModalOpen(false);
  } catch (error) {
    toast.error('Failed to flag item');
  }
};

const handleReject = async (reason: string) => {
  try {
    await submitReview(currentReviewItem.id, 'reject', { reason });
    toast.success('Item rejected');
    refetch();
    setReviewModalOpen(false);
  } catch (error) {
    toast.error('Failed to reject item');
  }
};
```

**Step 4: API Endpoints**

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/review/queue` | Fetch HITL queue | None | `HITLReviewItem[]` |
| POST | `/api/review/:itemId/approve` | Approve AI result | None | Success message |
| POST | `/api/review/:itemId/override` | Override with manual values | `{ paidAmount, entitledAmount, difference, reason }` | Success message |
| POST | `/api/review/:itemId/flag` | Flag for follow-up | `{ notes: string }` | Success message |
| POST | `/api/review/:itemId/reject` | Reject and exclude | `{ reason: string }` | Success message |

---

### 4. Implement Charts with Real Data

**Files:**
- `/components/dashboards/OrganisationDashboardPage.tsx`
- `/components/organisation/ComprehensiveAuditReview.tsx` (Tab 2)
- `/components/organisation/AuditDetailPage.tsx` (Tab 4)

#### Current State
- Charts use hardcoded sample data
- Recharts already implemented

#### Steps to Connect Real Data

**Step 1: Root Cause Analysis Chart**

```typescript
// In /components/dashboards/OrganisationDashboardPage.tsx
const { data: dashboardData, loading } = useDashboardMetrics();

// Use real data for chart
const rootCauseData = dashboardData?.rootCauses || [];

// Recharts BarChart already implemented
<BarChart data={rootCauseData}>
  <XAxis dataKey="category" />
  <YAxis />
  <Bar dataKey="count" fill="#ef4444" />
</BarChart>
```

**Step 2: Weekly Trend Chart**

```typescript
// In /components/dashboards/OrganisationDashboardPage.tsx
const trendData = dashboardData?.weeklyTrend || [];

<LineChart data={trendData}>
  <XAxis dataKey="week" />
  <YAxis />
  <Line type="monotone" dataKey="underpaymentCount" stroke="#ef4444" />
</LineChart>
```

**Step 3: Analytics Charts in Audit Review**

```typescript
// In /components/organisation/ComprehensiveAuditReview.tsx Tab 2
const { data: auditData } = useAuditDetail(auditId);

const paymentDistribution = [
  { status: 'OK', count: auditData.resultSummary.okCount },
  { status: 'Underpaid', count: auditData.resultSummary.underpaidCount },
  { status: 'Needs Review', count: auditData.resultSummary.needsReviewCount }
];

// Display as cards with /components/ui/card.tsx
{paymentDistribution.map(item => (
  <Card key={item.status}>
    <CardHeader>
      <CardTitle>{item.count}</CardTitle>
      <CardDescription>{item.status}</CardDescription>
    </CardHeader>
  </Card>
))}

// Root cause chart
<BarChart data={auditData.analytics.rootCauseBreakdown}>
  <XAxis dataKey="category" />
  <YAxis />
  <Bar dataKey="count" fill="#ef4444" />
</BarChart>
```

---

### 5. Implement Export Functionality

#### Evidence Pack / Report Export

**Files to modify:**
- `/components/organisation/ComprehensiveAuditReview.tsx`
- `/components/organisation/AuditDetailPage.tsx`

**Implement:**
```typescript
// In both files
const handleDownloadReport = async () => {
  setDownloading(true);
  try {
    const blob = await fetch(`/api/audit/${auditId}/report/pdf`).then(r => r.blob());
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Report_${auditId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Report downloaded');  // from sonner@2.0.3
  } catch (error) {
    toast.error('Download failed');
  } finally {
    setDownloading(false);
  }
};

// Button component: /components/ui/button.tsx
<Button onClick={handleDownloadReport} disabled={downloading}>
  Download Full Report
</Button>
```

#### CSV Export

```typescript
// In /components/organisation/AuditDetailPage.tsx and ComprehensiveAuditReview.tsx
const handleDownloadCSV = async () => {
  setDownloading(true);
  try {
    const blob = await fetch(`/api/audit/${auditId}/export/csv`).then(r => r.blob());
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Results_${auditId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  } catch (error) {
    toast.error('Download failed');
  } finally {
    setDownloading(false);
  }
};
```

---

### 6. Add Loading and Error States

#### Current State
Minimal loading/error handling

#### Steps to Implement

**Step 1: Add to Dashboard**

```typescript
// In /components/dashboards/OrganisationDashboardPage.tsx
const { data, loading, error } = useDashboardMetrics();

{loading && <Skeleton className="h-32 w-full" />}  {/* /components/ui/skeleton.tsx */}
{error && <Alert variant="destructive">{error.message}</Alert>}  {/* /components/ui/alert.tsx */}
{data && (
  <>
    {/* Render dashboard content */}
  </>
)}
```

**Step 2: Add to Audit History**

```typescript
// In /components/organisation/AuditHistoryPage.tsx
{loading && <Skeleton className="h-64 w-full" />}
{error && <Alert variant="destructive">{error.message}</Alert>}
{!loading && !error && audits.length === 0 && (
  <EmptyState   {/* /components/design-system/EmptyState.tsx */}
    title="No audits yet"
    description="Run your first bulk audit to get started"
    action={<Button onClick={() => setCurrentView('bulk-audit-wizard')}>New Bulk Audit</Button>}
  />
)}
```

**Step 3: Add Toast Notifications**

```typescript
import { toast } from 'sonner@2.0.3';

// On success
toast.success('Audit completed successfully!');

// On error
toast.error('Failed to process audit. Please try again.');

// On info
toast.info('Processing 8 of 12 employees...');
```

---

### 7. File Locations Summary

| Task | Files to Modify | New Files to Create |
|------|-----------------|---------------------|
| Replace sample data | `/components/dashboards/OrganisationDashboardPage.tsx`<br>`/components/organisation/AuditHistoryPage.tsx`<br>`/components/organisation/AuditDetailPage.tsx`<br>`/components/organisation/ComprehensiveAuditReview.tsx` | `/services/auditApi.ts`<br>`/hooks/useAuditData.ts`<br>`/types/organisation.ts` |
| Add loading/error states | All data-fetching components | N/A (use existing `/components/ui/skeleton.tsx`, `/components/ui/alert.tsx`) |
| Real CSV upload | `/components/organisation/BulkAuditWizard.tsx` (Step 2) | Update `/services/auditApi.ts` |
| WebSocket for agents | `/components/organisation/BulkAuditWizard.tsx` (Step 4) | `/services/websocketService.ts` (optional) |
| HITL review actions | `/components/organisation/ReviewQueuePage.tsx` | Update `/services/auditApi.ts` |
| Charts with real data | `/components/dashboards/OrganisationDashboardPage.tsx`<br>`/components/organisation/ComprehensiveAuditReview.tsx`<br>`/components/organisation/AuditDetailPage.tsx` | N/A (data from existing APIs) |
| Export functionality | `/components/organisation/ComprehensiveAuditReview.tsx`<br>`/components/organisation/AuditDetailPage.tsx` | Update `/services/auditApi.ts` |

---

### 8. Backend API Endpoints (Reference)

**Note:** This is a conceptual list of endpoints the frontend would call. Backend implementation is out of scope.

**Service File:** `/services/auditApi.ts`

| Method | Endpoint | Purpose | Request | Response | Called From |
|--------|----------|---------|---------|----------|-------------|
| GET | `/api/organisation/dashboard` | Dashboard metrics | None | `OrganisationDashboardMetrics` | `OrganisationDashboardPage.tsx` via `useDashboardMetrics()` |
| GET | `/api/audit/history` | List all audits | `?filters=...` | `AuditHistorySummary[]` | `AuditHistoryPage.tsx` via `useAuditHistory()` |
| GET | `/api/audit/:id` | Single audit detail | None | `BulkAuditRequest` | `AuditDetailPage.tsx`, `ComprehensiveAuditReview.tsx` via `useAuditDetail(id)` |
| POST | `/api/audit/upload-employees` | Upload CSV file | FormData with file | `CSVUploadResponse` | `BulkAuditWizard.tsx` Step 2 |
| POST | `/api/audit/submit` | Submit new audit | `BulkAuditWizardData` | `{ auditId: string }` | `BulkAuditWizard.tsx` Step 3 |
| POST | `/api/audit/start` | Start processing | `{ auditId: string }` | `{ websocketUrl: string }` | `BulkAuditWizard.tsx` Step 4 |
| WebSocket | `/ws/audit/:id/progress` | Live agent updates | N/A | Stream of `{ agentId, status, progress, message }` | `BulkAuditWizard.tsx` Step 4 |
| GET | `/api/audit/:id/report/pdf` | Download PDF report | None | Blob (PDF) | `ComprehensiveAuditReview.tsx`, `AuditDetailPage.tsx` |
| GET | `/api/audit/:id/export/csv` | Download CSV results | None | Blob (CSV) | `ComprehensiveAuditReview.tsx`, `AuditDetailPage.tsx` |
| GET | `/api/audit/export/history` | Export all audit history | `?filters=...` | Blob (CSV) | `AuditHistoryPage.tsx` |
| GET | `/api/review/queue` | Fetch HITL queue | None | `HITLReviewItem[]` | `ReviewQueuePage.tsx` via `useHITLQueue()` |
| POST | `/api/review/:itemId/approve` | Approve AI result | None | Success | `ReviewQueuePage.tsx` |
| POST | `/api/review/:itemId/override` | Override with manual values | `{ paidAmount, entitledAmount, difference, reason }` | Success | `ReviewQueuePage.tsx` |
| POST | `/api/review/:itemId/flag` | Flag for follow-up | `{ notes: string }` | Success | `ReviewQueuePage.tsx` |
| POST | `/api/review/:itemId/reject` | Reject and exclude | `{ reason: string }` | Success | `ReviewQueuePage.tsx` |

---

## Summary

This document provides a comprehensive reference for the **Organisation/Auditor experience** in PayGuard without modifying any code. It covers:

✅ **Navigation flows** between all pages with **full file paths**  
✅ **Route/state mapping** for the React app managed in `OrganisationDashboardWrapper.tsx`  
✅ **Page ownership** mapping every screen to its `.tsx` file  
✅ **Complete interaction map** for every button, table, chart, filter with **component file references**  
✅ **TypeScript data models** for all entities with **file usage notes**  
✅ **Implementation guidelines** for wiring to real APIs with **specific file locations**  

**Every feature, component, and interaction now includes:**
- 📁 **Component file paths** (e.g., `/components/ui/button.tsx`)
- 🎨 **UI component references** (e.g., uses `SeverityBadge.tsx`)
- 🔧 **Service file locations** (e.g., `/services/auditApi.ts`)
- 📊 **Data type files** (e.g., `/types/organisation.ts`)
- 📈 **Chart libraries** (e.g., Recharts `BarChart`, `LineChart`)

**Next Steps for Development:**
1. Create API service layer (`/services/auditApi.ts`)
2. Create TypeScript types file (`/types/organisation.ts`)
3. Implement data fetching hooks (`/hooks/useAuditData.ts`)
4. Replace sample data in `/components/dashboards/OrganisationDashboardPage.tsx`
5. Add loading/error states using `/components/ui/skeleton.tsx` and `/components/ui/alert.tsx`
6. Implement real CSV upload in `/components/organisation/BulkAuditWizard.tsx` Step 2
7. Connect WebSocket in `/components/organisation/BulkAuditWizard.tsx` Step 4
8. Wire HITL review actions in `/components/organisation/ReviewQueuePage.tsx`
9. Connect charts to real data in dashboard and review pages
10. Implement export functionality (PDF, CSV) in review and detail pages

**Key Files to Focus On:**
- `/components/dashboards/OrganisationDashboardWrapper.tsx` (main state orchestrator)
- `/components/dashboards/OrganisationDashboardPage.tsx` (main dashboard)
- `/components/organisation/BulkAuditWizard.tsx` (5-step wizard)
- `/components/organisation/ComprehensiveAuditReview.tsx` (3-tab post-wizard review)
- `/components/organisation/AuditHistoryPage.tsx` (audit list)
- `/components/organisation/AuditDetailPage.tsx` (6-tab detail view)
- `/components/organisation/ReviewQueuePage.tsx` (HITL queue)

**Special Features:**
- **10-Agent Pipeline:** Bulk processing with WebSocket updates in `BulkAuditWizard.tsx`
- **HITL Review Queue:** Manual review with approve/override/flag actions in `ReviewQueuePage.tsx`
- **Analytics Dashboard:** Real-time charts with Recharts in dashboard and review pages
- **CSV Import/Export:** Bulk employee data handling with validation
- **Multi-Tab Views:** 3-tab Comprehensive Review, 6-tab Audit Detail

---

**Document Version:** 1.1 (Updated with file paths throughout)  
**Created:** January 2, 2026  
**Updated:** January 2, 2026  
**Purpose:** Reference and handoff documentation only — no code changes
