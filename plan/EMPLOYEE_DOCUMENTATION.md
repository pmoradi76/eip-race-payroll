# PayGuard Employee Experience - Complete Documentation

**Version:** 1.2  
**Last Updated:** January 3, 2026  
**Purpose:** Reference documentation for the Employee workflow - NO CODE CHANGES

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
The Employee experience is a state-based single-page application managed by `/components/dashboards/EmployeeDashboardPage.tsx`. Navigation between pages is handled through React state changes (within `EmployeeDashboardPage.tsx`), not traditional routing. The workflow centers around two main features: submitting pay check requests (via `/components/employee/PayCheckWizard.tsx`) and chatting with the Award Assistant (via `/components/employee/AwardChatPage.tsx`).

### Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Landing Page                              │
│                       (Not in scope)                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    Sign In → Select User Type
                               │
                    Login as "Employee"
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌───────────────────┐          ┌──────────────────┐
    │   LOGIN PAGE      │          │  SIGN UP PAGE    │
    │   /components/    │◄─────────│  /components/    │
    │   LoginForm.tsx   │ "Sign In │  auth/Employee   │
    │                   │  Instead"│  SignUp.tsx      │
    │ • Enter creds     │          │                  │
    │ • "Sign up" link  │          │ • Full name      │
    │ • "Reset here"    │          │ • Email          │
    │ • Demo button     │          │ • Password       │
    └─────────┬─────────┘          │ • Confirm pass   │
              │                    │ • Accept terms   │
              │                    └────────┬─────────┘
              │                             │
              │  After sign up success ────┘
              │  (redirects to login)
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EMPLOYEE DASHBOARD                             │
│  File: /components/dashboards/EmployeeDashboardPage.tsx         │
│  State: Default view                                             │
│                                                                   │
│  User Profile: Ava Nguyen                                        │
│  • BrightSteps Early Learning                                    │
│  • Casual Educator                                               │
│                                                                   │
│  Latest Result Card (if exists):                                 │
│  • Pay period: 01–14 Aug 2025                                   │
│  • Paid: $540 | Entitled: $612                                   │
│  • Status: Underpaid -$72                                        │
│  • Uses: /components/ui/card.tsx                                 │
│  • Status badge: /components/design-system/SeverityBadge.tsx    │
│                                                                   │
│  Recent Requests Table:                                          │
│  • REQ-2025-003: Underpaid -$72                                 │
│  • REQ-2025-002: OK                                              │
│  • REQ-2025-001: OK                                              │
│  • Uses: /components/ui/table.tsx                                │
│                                                                   │
│  Agent Activity Log (right sidebar):                             │
│  • Recent AI agents that processed checks                        │
│  • Uses: /components/design-system/StatusBadge.tsx              │
│                                                                   │
│  Award Assistant Chat (embedded):                                │
│  • Inline chat interface with suggested questions                │
│  • Upload Supporting Document button                             │
│  • Uses: /components/ui/input.tsx for message input              │
│                                                                   │
│  Actions Available:                                              │
│  [New Pay Check Request] → /components/employee/PayCheckWizard.tsx (5 steps) │
│  [Chat with Award Assistant] → /components/employee/AwardChatPage.tsx        │
│  Request row click → /components/employee/RequestDetailPage.tsx (4 tabs)     │
│  [Upload Supporting Document] → /components/employee/DocumentUploadModal.tsx │
└──────────────────────────┬──────────────────┬──────────────────┘
                           │                   │
        ┌──────────────────┴────┐             │
        │                       │             │
        ▼                       ▼             ▼
┌──────────────┐   ┌───────────────┐   ┌─────────────┐
│ PAY CHECK    │   │ REQUEST       │   │ AWARD CHAT  │
│ WIZARD       │   │ DETAIL        │   │ PAGE        │
│ (5 steps)    │   │ (4 tabs)      │   │ (Full       │
│              │   │               │   │  screen)    │
│ PayCheckWiz- │   │ RequestDetail-│   │ AwardChat-  │
│ ard.tsx      │   │ Page.tsx      │   │ Page.tsx    │
│              │   │               │   │             │
│ 1. Meta      │   │ Uses:         │   │             │
│    Details   │   │ /components/  │   │ RAG-powered │
│    (MetaDet- │   │ ui/tabs.tsx   │   │ Q&A about   │
│    ailsStep. │   │               │   │ award       │
│    tsx)      │   │ Tabs:         │   │ entitlement │
│ 2. Upload    │   │ • Summary     │   │             │
│    Documents │   │ • Calculation │   │ + Document  │
│    (UploadD- │   │ • Evidence    │   │   Upload    │
│    ocuments- │   │ • Timeline    │   │   Modal     │
│    Step.tsx) │   └───────────────┘   │   (Document │
│ 3. Review    │                       │   UploadMod-│
│    Extracted │                       │   al.tsx)   │
│    (ReviewEx-│                       └─────────────┘
│    tractedS- │
│    tep.tsx)  │
│ 4. Run       │
│    Agentic   │
│    Check     │
│    (RunAgent-│
│    icCheckS- │
│    tep.tsx)  │
│ 5. Results   │
│    (Results- │
│    Step.tsx) │
│    (4 tabs)  │
└──────────────┘

Uses:
/components/design-system/ProgressStepper.tsx (left sidebar)
```

### Entry Points from Dashboard
**File:** `/components/dashboards/EmployeeDashboardPage.tsx`

| Button/Link | Target View | Target File | State Change | Handler |
|-------------|-------------|-------------|--------------|---------|
| "New Pay Check Request" (header button, uses `/components/ui/button.tsx`) | Pay Check Wizard | `/components/employee/PayCheckWizard.tsx` | `setShowWizard(true)` | Opens wizard modal |
| "Chat with Award Assistant" (header button, uses `/components/ui/button.tsx`) | Award Chat Page | `/components/employee/AwardChatPage.tsx` | `setShowAwardChat(true)` | Full page navigation |
| Request table row click (rendered with `/components/ui/table.tsx`) | Request Detail Page | `/components/employee/RequestDetailPage.tsx` | `setViewingRequestId(id)` | Navigate to detail |
| "View Full Details" link | Request Detail Page | `/components/employee/RequestDetailPage.tsx` | `setViewingRequestId(id)` | Same as row click |
| "Upload Supporting Document" (in chat, uses `/components/ui/button.tsx`) | Document Upload Modal | `/components/employee/DocumentUploadModal.tsx` | Opens modal overlay | File upload flow |
| Suggested question click | (Inline action) | N/A (inline in dashboard) | Sends message to chat | Populates and submits message |

### Back Navigation Patterns

| From Page | From File | Back Button → Target | Handler | Back Button Uses |
|-----------|-----------|----------------------|---------|------------------|
| Pay Check Wizard | `/components/employee/PayCheckWizard.tsx` | Dashboard | `onClose()` closes modal | `/components/ui/button.tsx` |
| Request Detail Page | `/components/employee/RequestDetailPage.tsx` | Dashboard | `onBack()` sets `viewingRequestId` to null | `/components/ui/button.tsx` with ArrowLeft icon |
| Award Chat Page | `/components/employee/AwardChatPage.tsx` | Dashboard | `onBack()` sets `showAwardChat` to false | `/components/ui/button.tsx` with ArrowLeft icon |
| Document Upload Modal | `/components/employee/DocumentUploadModal.tsx` | Award Chat | `onClose()` closes modal | X button (Close icon) |

### Modal Flows

**Pay Check Wizard** (Modal overlay)
- **File:** `/components/employee/PayCheckWizard.tsx`
- **Uses:** `/components/design-system/ProgressStepper.tsx` for left sidebar navigation
- Trigger: "New Pay Check Request" button
- Display: Full-screen modal with 5-step wizard
- Steps: Meta Details → Upload → Review → Processing → Results
- Navigation: Linear progression using `ProgressStepper.tsx`, can jump back to previous steps
- Exit: Close button (X icon) or "Done" on final step

**Document Upload Modal** (Modal overlay)
- **File:** `/components/employee/DocumentUploadModal.tsx`
- Trigger: "Upload Supporting Document" button in Award Chat
- Display: File upload interface with drag-and-drop
- Actions: Browse files, drag/drop, upload, cancel
- Exit: Close button (X), Cancel button, or click outside modal

**Request Detail Page** (Full page replacement)
- **File:** `/components/employee/RequestDetailPage.tsx`
- **Uses:** `/components/ui/tabs.tsx` for tab navigation
- Trigger: Click any request row in dashboard table
- Display: 4-tab detailed view of single request
- Tabs: Summary, Calculation Details, Evidence, Timeline
- Exit: Back button returns to dashboard

---

## B) Route Table

**Note:** The application uses React state-based navigation in `/components/dashboards/EmployeeDashboardPage.tsx`, NOT URL-based routing. The "routes" below are conceptual paths representing different application states.

| State Value | Page Name | File | Purpose | Required Params | Conceptual URL (if routed) |
|-------------|-----------|------|---------|-----------------|----------------------------|
| Default (base) | Employee Dashboard | `/components/dashboards/EmployeeDashboardPage.tsx` | Main overview with recent checks | None | `/employee` |
| `showWizard=true` | Pay Check Wizard | `/components/employee/PayCheckWizard.tsx` | 5-step flow to submit new request | None | `/employee/check/new` |
| `viewingRequestId={id}` | Request Detail | `/components/employee/RequestDetailPage.tsx` | Detailed view of single request | `requestId` (required) | `/employee/check/{id}` |
| `showAwardChat=true` | Award Chat Page | `/components/employee/AwardChatPage.tsx` | Full-screen RAG-powered Q&A | None | `/employee/assistant` |
| Modal state | Document Upload Modal | `/components/employee/DocumentUploadModal.tsx` | Upload contract/docs for chat | None | (Modal overlay) |

### State Management

**Current implementation in `/components/dashboards/EmployeeDashboardPage.tsx`:**
```typescript
// File: /components/dashboards/EmployeeDashboardPage.tsx
const [showWizard, setShowWizard] = useState(false);
const [viewingRequestId, setViewingRequestId] = useState<string | null>(null);
const [showAwardChat, setShowAwardChat] = useState(false);
```

**Rendering logic in `/components/dashboards/EmployeeDashboardPage.tsx`:**
```typescript
// Returns different components based on state:
if (showAwardChat) return <AwardChatPage onBack={() => setShowAwardChat(false)} />; // /components/employee/AwardChatPage.tsx
if (viewingRequestId) return <RequestDetailPage requestId={viewingRequestId} onBack={...} />; // /components/employee/RequestDetailPage.tsx
if (showWizard) return <PayCheckWizard modal overlay />; // /components/employee/PayCheckWizard.tsx (modal, not full page)
return <Dashboard />; // Default view
```

**To convert to URL routing (future):**
- Use React Router or Next.js App Router
- Map each state to a URL path
- Pass `requestId` as URL parameter: `/employee/check/:id`
- Enable browser back/forward navigation
- Enable direct linking to specific requests
- Preserve wizard state in URL query params

---

## C) Page → TSX Ownership Map

### Primary Components

| Page/View | TSX File | Purpose | Props Interface | UI Components Used |
|-----------|----------|---------|-----------------|-------------------|
| **Login Form** | `/components/LoginForm.tsx` | Employee login page | `{ userType: 'employee'; onLogin: () => void; onBack: () => void; onSignUp?: () => void }` | `button.tsx`, `input.tsx`, `card.tsx` |
| **Sign Up Page** | `/components/auth/EmployeeSignUp.tsx` | Employee registration | `{ onBack: () => void; onSignUpSuccess: () => void; onSwitchToLogin: () => void }` | `button.tsx`, `input.tsx`, `card.tsx`, `checkbox.tsx` |
| **Main Page** | `/components/dashboards/EmployeeDashboardPage.tsx` | State orchestrator, renders all views | `{ onLogout: () => void }` | `button.tsx`, `card.tsx`, `table.tsx`, `input.tsx` |
| **Dashboard (old)** | `/components/dashboards/EmployeeDashboard.tsx` | Legacy component (may not be used) | N/A | N/A |
| **Pay Check Wizard** | `/components/employee/PayCheckWizard.tsx` | 5-step modal wizard for new check | `{ onClose: () => void }` | `button.tsx`, `ProgressStepper.tsx` |
| **Request Detail** | `/components/employee/RequestDetailPage.tsx` | 4-tab detailed request view | `{ requestId: string; onBack: () => void }` | `card.tsx`, `tabs.tsx`, `table.tsx`, `progress.tsx` |
| **Award Chat Page** | `/components/employee/AwardChatPage.tsx` | Full-screen chat with RAG assistant | `{ onBack?: () => void }` | `card.tsx`, `input.tsx`, `button.tsx`, `badge.tsx` |
| **Document Upload Modal** | `/components/employee/DocumentUploadModal.tsx` | Upload contract for chat context | `{ onClose: () => void; onUpload: (fileName: string) => void }` | `button.tsx`, `card.tsx` |
| **Award Pack Setup Modal** | `/components/employee/AwardPackSetupModal.tsx` | Configure award context (may be deprecated) | Props defined in file | Various |
| **Knowledge Base Building** | `/components/employee/KnowledgeBaseBuildingScreen.tsx` | Loading screen for RAG setup (may be deprecated) | Props defined in file | Various |

### Wizard Step Components (5 Steps)
**Parent:** `/components/employee/PayCheckWizard.tsx`

| Step | TSX File | Purpose | Props Interface | UI Components Used |
|------|----------|---------|-----------------|-------------------|
| **Step 1** | `/components/employee/wizard-steps/MetaDetailsStep.tsx` | Collect job/period metadata | `{ data: WizardData; onNext: (data) => void; onCancel: () => void }` | `input.tsx`, `select.tsx`, `checkbox.tsx`, `button.tsx` |
| **Step 2** | `/components/employee/wizard-steps/UploadDocumentsStep.tsx` | Upload contract, timesheet, payslip | `{ data: WizardData; onNext: (data) => void; onBack: () => void }` | `button.tsx`, `card.tsx` (drag-drop zones) |
| **Step 3** | `/components/employee/wizard-steps/ReviewExtractedStep.tsx` | Review AI-extracted data | `{ data: WizardData; onNext: (data) => void; onBack: () => void }` | `card.tsx`, `input.tsx`, `button.tsx`, `badge.tsx` |
| **Step 4** | `/components/employee/wizard-steps/RunAgenticCheckStep.tsx` | Live AI processing with 10 agents | `{ data: WizardData; onNext: (data) => void }` | `card.tsx`, `StatusBadge.tsx`, `progress.tsx` |
| **Step 5** | `/components/employee/wizard-steps/ResultsStep.tsx` | Final results with 4 tabs | `{ data: WizardData; onClose: () => void }` | `tabs.tsx`, `card.tsx`, `table.tsx`, `button.tsx` |

### Shared Components (Design System)

| Component | File | Purpose | Used By |
|-----------|------|---------|---------|
| **StatusBadge** | `/components/design-system/StatusBadge.tsx` | Done/Running/Pending/Failed badges | Agent status in `RunAgenticCheckStep.tsx`, timeline in `RequestDetailPage.tsx` |
| **SeverityBadge** | `/components/design-system/SeverityBadge.tsx` | OK/Underpaid/Needs Review status | Payment status in `EmployeeDashboardPage.tsx`, `RequestDetailPage.tsx`, `ResultsStep.tsx` |
| **AnomalyScorePill** | `/components/design-system/AnomalyScorePill.tsx` | 0-100 confidence score display | Results in `ResultsStep.tsx`, `RequestDetailPage.tsx` |
| **PageHeader** | `/components/design-system/PageHeader.tsx` | Page title + actions | Dashboard in `EmployeeDashboardPage.tsx`, detail pages |
| **ProgressStepper** | `/components/design-system/ProgressStepper.tsx` | Visual step indicator | Wizard left sidebar in `PayCheckWizard.tsx` |
| **EmptyState** | `/components/design-system/EmptyState.tsx` | No data message | Dashboard in `EmployeeDashboardPage.tsx` if no requests |
| **Card** | `/components/ui/card.tsx` | Card container (shadcn/ui) | All pages for content grouping |
| **Table** | `/components/ui/table.tsx` | Data table (shadcn/ui) | Dashboard requests table, calculation breakdown tables |
| **Tabs** | `/components/ui/tabs.tsx` | Tab navigation | Detail pages (`RequestDetailPage.tsx`, `ResultsStep.tsx`) |
| **Button** | `/components/ui/button.tsx` | All buttons | Everywhere across all components |
| **Input** | `/components/ui/input.tsx` | Text input | Chat input, form fields in `MetaDetailsStep.tsx` |
| **Progress** | `/components/ui/progress.tsx` | Progress bar | Agent processing in `RunAgenticCheckStep.tsx` |

### Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| **EmployeeDashboardShell** | `/components/shells/EmployeeDashboardShell.tsx` | Sidebar + top bar wrapper (not used by all pages) |

**Note:** `/components/dashboards/EmployeeDashboardPage.tsx` implements its own top navigation bar directly in the file, not using the shell wrapper, for a cleaner focused experience.

### Sample Data Location

All pages currently use **inline sample data** defined as constants within each component file:

| File | Line Range | Data |
|------|-----------|------|
| `/components/dashboards/EmployeeDashboardPage.tsx` | Lines 18-71 | `latestResult`, `requests`, `agentActivity` arrays |
| `/components/employee/RequestDetailPage.tsx` | Lines 54-200+ | `requestDataMap` object with multiple sample requests |
| `/components/employee/AwardChatPage.tsx` | Lines 35-48 | initial messages, suggested prompts arrays |
| Wizard steps | Various | Each step has sample extracted data |

**To wire to real data:**
- Create `/services/checkApi.ts` for API calls
- Create `/hooks/useCheckData.ts` for data fetching hooks
- Replace inline constants with API responses
- Add loading/error states using `/components/ui/skeleton.tsx` and error components

---

## D) Authentication & Sign Up Flow

### Authentication Pages (Before Dashboard Access)

#### 1. Employee Login Page
**File:** `/components/LoginForm.tsx` (shared component, `userType='employee'`)

**Purpose:** Authenticate existing employees with username/password or demo credentials

**UI Elements:**
- Email/Username input field (uses `/components/ui/input.tsx`)
- Password input field with show/hide toggle (Eye/EyeOff icons from `lucide-react`)
- "Sign In" button (uses `/components/ui/button.tsx`)
- "Use Demo" button to auto-fill credentials
- "Sign up" link → navigates to Employee Sign Up page
- "Reset here" link → password reset flow (placeholder)
- "Back" button → returns to user type selection

**Demo Credentials:**
- Email: `ava.nguyen@brightsteps.edu.au`
- Password: `demo123`
- Role: Casual Educator at BrightSteps Early Learning

**Navigation:**
- **onLogin()** → Sets `currentView='employee'` in `/App.tsx` → Shows Employee Dashboard
- **onBack()** → Sets `currentView='signin'` → Returns to user type selection
- **onSignUp()** → Sets `currentView='signup'` → Shows Employee Sign Up page

#### 2. Employee Sign Up Page
**File:** `/components/auth/EmployeeSignUp.tsx`

**Purpose:** Create new employee account with minimal required information

**Required Fields:**
1. **Full Name** (Text input)
   - Component: `/components/ui/input.tsx` with User icon
   - Validation: Cannot be empty
   - Example: "John Smith"

2. **Email Address** (Email input)
   - Component: `/components/ui/input.tsx` with Mail icon
   - Validation: Must be valid email format (regex check)
   - Example: "john.smith@company.com"

3. **Password** (Password input with toggle)
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

4. **Confirm Password** (Password input with toggle)
   - Component: `/components/ui/input.tsx` with Lock icon
   - Validation: Must match Password field exactly
   - Shows green checkmark when passwords match
   - Shows red error if passwords don't match

5. **Terms & Conditions** (Checkbox)
   - Component: `/components/ui/checkbox.tsx`
   - Label: "I agree to the Terms of Service and Privacy Policy"
   - Validation: Must be checked to submit
   - Links to Terms (placeholder) and Privacy Policy (placeholder)

**Form Validation:**
- All validation happens on submit (`handleSignUp`)
- Individual field errors shown as red text below each input
- Errors clear when user starts typing in that field
- Submit button disabled during account creation (shows loading spinner)

**Validation Rules:**
```typescript
{
  fullName: 'Full name is required',
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
- **"Create Account"** (Primary button)
  - Shows loading spinner during submit
  - Simulates 1.5s API call
  - On success: calls `onSignUpSuccess()` → returns to login page
  
- **"Sign In Instead"** (Outline button)
  - Calls `onSwitchToLogin()` → returns to login page

- **"Back to User Type"** (Ghost button, top-left)
  - Calls `onBack()` → returns to user type selection

**UI Components Used:**
- `/components/ui/card.tsx` - Main form container
- `/components/ui/input.tsx` - All text/password inputs
- `/components/ui/label.tsx` - Field labels
- `/components/ui/button.tsx` - All buttons
- `/components/ui/checkbox.tsx` - Terms checkbox
- Icons from `lucide-react`: Shield, ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle2

**Current Implementation:**
- Simulated sign up (no real API call)
- 1.5 second timeout to simulate account creation
- Success redirects to login page

**Intended Implementation:**
- Call API: `POST /api/auth/signup`
- Request body:
  ```typescript
  {
    fullName: string,
    email: string,
    password: string
  }
  ```
- Response:
  ```typescript
  {
    success: boolean,
    userId?: string,
    message?: string
  }
  ```
- On success: Redirect to login with success message
- On error: Show error message (email already exists, etc.)

**Footer Note:**
"PayGuard is designed to help employees understand their pay entitlements. Not for collecting PII or securing sensitive data."

### Sign Up User Journey

**Complete Flow:**
```
Landing Page
  ↓ Click "Sign In"
  
User Type Selection (/components/SignInPage.tsx)
  ↓ Select "Employee"
  
Login Page (/components/LoginForm.tsx)
  ↓ Click "Sign up" link
  
Sign Up Page (/components/auth/EmployeeSignUp.tsx)
  ↓ Fill form:
    - Full Name: "John Smith"
    - Email: "john.smith@company.com"
    - Password: "SecurePass123!"
    - Confirm Password: "SecurePass123!"
    - ✓ Agree to terms
  ↓ Click "Create Account"
  ↓ 1.5s loading...
  ↓ Account created successfully
  
Login Page (/components/LoginForm.tsx)
  ↓ Enter new credentials:
    - Email: "john.smith@company.com"
    - Password: "SecurePass123!"
  ↓ Click "Sign In"
  
Employee Dashboard (/components/dashboards/EmployeeDashboardPage.tsx)
  ✓ Authenticated, ready to use app
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
handleLogin() → setCurrentView(selectedUserType) // 'employee'
handleLogout() → setCurrentView('landing'), setSelectedUserType(null)
```

**Conditional Rendering in `/App.tsx`:**
```typescript
{currentView === 'signup' && selectedUserType === 'employee' && (
  <EmployeeSignUp 
    onSignUpSuccess={handleSignUpSuccess} 
    onBack={handleBackToSignIn}
    onSwitchToLogin={handleBackToLogin}
  />
)}
```

---

## E) Interaction Map ("What Runs When I Click")

### Employee Dashboard 
**File:** `/components/dashboards/EmployeeDashboardPage.tsx`

#### 1. "New Pay Check Request" Button (Top-right header)
- **File:** Rendered in `/components/dashboards/EmployeeDashboardPage.tsx`
- **Component:** `/components/ui/button.tsx`
- **Icon:** Upload icon from `lucide-react`
- **Label:** "New Pay Check Request"
- **Location:** Page header, right side (with Upload icon)
- **Current behavior:** Opens Pay Check Wizard modal
- **Intended behavior:** Same as current
- **Action type:** Modal open
- **Handler:** `onClick={() => setShowWizard(true)}` (line ~90)
- **Data:** None
- **UI update:** Full-screen modal overlay with `/components/employee/PayCheckWizard.tsx`
- **Loading state:** N/A
- **What changes:** Modal appears over dashboard

#### 2. "Chat with Award Assistant" Button (Top-right header)
- **File:** Rendered in `/components/dashboards/EmployeeDashboardPage.tsx`
- **Component:** `/components/ui/button.tsx` with `variant="outline"`
- **Icon:** MessageCircle icon from `lucide-react`
- **Label:** "Chat with Award Assistant"
- **Location:** Page header, left of New Request button
- **Current behavior:** Navigates to full-screen Award Chat page
- **Intended behavior:** Same as current
- **Action type:** Page navigation
- **Handler:** `onClick={() => setShowAwardChat(true)}` (line ~86)
- **Data:** None
- **UI update:** Full page change to `/components/employee/AwardChatPage.tsx`
- **Loading state:** N/A

#### 3. Latest Result Card - "View Full Details" Link
- **File:** Rendered in `/components/dashboards/EmployeeDashboardPage.tsx`
- **Component:** `/components/ui/card.tsx` with link button
- **Label:** "View Full Details →"
- **Location:** Inside "Latest Result" card (if request exists)
- **Current behavior:** Opens Request Detail page
- **Intended behavior:** Navigate to detailed 4-tab view
- **Action type:** Navigation
- **Handler:** `onClick={() => setViewingRequestId(latestResult.requestId)}`
- **Data:** Request ID from latest result
- **UI update:** Full page change to `/components/employee/RequestDetailPage.tsx`

#### 4. Request Table Row Click
- **File:** Rendered in `/components/dashboards/EmployeeDashboardPage.tsx`
- **Component:** `/components/ui/table.tsx` - `<TableRow>` elements
- **Label:** Any row in "Recent Requests" table
- **Location:** Main content area, below latest result card
- **Current behavior:** Opens Request Detail page
- **Intended behavior:** Same as current
- **Action type:** Navigation
- **Handler:** `onClick={() => setViewingRequestId(request.id)}` on `<TableRow>`
- **Data:** Request ID from clicked row
- **UI update:** Full page change to `/components/employee/RequestDetailPage.tsx`
- **Styling:** Rows have `cursor-pointer hover:bg-muted` classes

#### 5. Embedded Chat - Suggested Question Click
- **File:** Rendered in `/components/dashboards/EmployeeDashboardPage.tsx`
- **Component:** `/components/ui/button.tsx` with `variant="outline"`
- **Label:** Suggested questions (e.g., "What are my entitlements for evening shifts?")
- **Location:** Embedded chat section, right sidebar
- **Current behavior:** Populates chat input and sends message
- **Intended behavior:** Same as current
- **Action type:** Chat interaction
- **Handler:** `handleQuestionClick(question)` → Sets input value → `handleSendMessage()`
- **Data:** Pre-defined question string
- **UI update:** Message appears in chat, AI response generated
- **Loading state:** Brief delay (800ms) simulating AI thinking

#### 6. Embedded Chat - Send Message Button
- **File:** Rendered in `/components/dashboards/EmployeeDashboardPage.tsx`
- **Component:** `/components/ui/button.tsx` with Send icon
- **Icon:** Send icon from `lucide-react`
- **Label:** Send icon button (paper plane)
- **Location:** Chat input area, right side
- **Current behavior:** Sends user message, generates AI response
- **Intended behavior:** Send to RAG API, get real AI response
- **Action type:** API call (future)
- **Handler:** `handleSendMessage()` (line ~33-55)
- **Current implementation:**
  - Adds user message to `chatMessages` state
  - Uses `getAIResponse()` function with keyword matching (line ~57-82)
  - Simulates 800ms delay with `setTimeout`
  - Adds AI response to messages
- **Intended implementation:**
  - Call API: `POST /api/chat/message`
  - Request: `{ message: string, context?: contractData }`
  - Response: `{ response: string, citations: [] }`
  - Stream response for real-time typing effect
- **Data read:** `chatMessage` input state (from `/components/ui/input.tsx`)
- **Data write:** `chatMessages` array state
- **Loading state:** Show "typing..." indicator while waiting

#### 7. Agent Activity Log (Right Sidebar)
- **File:** Rendered in `/components/dashboards/EmployeeDashboardPage.tsx`
- **Component:** `/components/ui/card.tsx` with `/components/design-system/StatusBadge.tsx`
- **Label:** Recent agent names and timestamps
- **Location:** Right sidebar, "Recent Agent Activity" section
- **Current behavior:** Static display, not interactive
- **Intended behavior:** Could be clickable to show agent details
- **Possible future interaction:**
  - Click agent name → Show modal with agent logs
  - Click "View All" → Navigate to full activity history

#### 8. Empty State (If No Requests)
- **File:** Rendered in `/components/dashboards/EmployeeDashboardPage.tsx`
- **Component:** `/components/design-system/EmptyState.tsx`
- **Display:** When `requests.length === 0`
- **Message:** "No pay check requests yet. Submit your first check to get started!"
- **Action button:** "Submit First Check" → Opens wizard via `setShowWizard(true)`

---

### Pay Check Wizard
**File:** `/components/employee/PayCheckWizard.tsx`

**5-Step Modal Flow**

#### Overall Navigation

| Action | Button/Element | Component File | Handler | Behavior |
|--------|---------------|----------------|---------|----------|
| Close wizard | X button (top-right) | `/components/ui/button.tsx` with X icon | `onClose()` | Close modal, return to dashboard |
| Next step | "Next" button | `/components/ui/button.tsx` | `handleNext(data)` (line ~66-71) | Save data, advance to next step |
| Previous step | "Back" button | `/components/ui/button.tsx` | `handleBack()` (line ~73-75) | Go to previous step (data preserved) |
| Jump to step | Click step in left sidebar | `/components/design-system/ProgressStepper.tsx` | `handleStepClick(stepNumber)` (line ~77-81) | Only works for completed steps |

#### Step 1: Meta Details
**File:** `/components/employee/wizard-steps/MetaDetailsStep.tsx`

**Form Fields:**
1. **Organisation Type** (Dropdown)
   - Component: `/components/ui/select.tsx`
   - Options: Childcare, Retail, Healthcare, Hospitality
   - Default: "Childcare" (pre-filled for Ava)
   - Required: Yes
   - Validation: Must select option

2. **Organisation Name** (Text input)
   - Component: `/components/ui/input.tsx`
   - Default: "BrightSteps Early Learning" (pre-filled)
   - Required: Yes
   - Validation: Non-empty string

3. **Employment Type** (Dropdown)
   - Component: `/components/ui/select.tsx`
   - Options: Full-time, Part-time, Casual
   - Default: "Casual" (pre-filled)
   - Required: Yes

4. **Role Title** (Text input)
   - Component: `/components/ui/input.tsx`
   - Default: "Educator" (pre-filled)
   - Required: Yes
   - Purpose: For award classification matching

5. **Classification Level** (Text input)
   - Component: `/components/ui/input.tsx`
   - Optional field
   - Purpose: Specific award level (e.g., "Level 3")
   - Helps narrow down entitlements

6. **Pay Period** (Date pickers)
   - Component: `/components/ui/calendar.tsx` or date input
   - Start date and end date
   - Default: "2025-08-01" to "2025-08-14"
   - Required: Yes
   - Validation: End date must be after start date

7. **State** (Dropdown)
   - Component: `/components/ui/select.tsx`
   - Options: NSW, VIC, QLD, SA, WA, TAS, NT, ACT
   - Default: "VIC"
   - Purpose: State-specific award variations

8. **Public Holiday** (Checkbox)
   - Component: `/components/ui/checkbox.tsx`
   - Label: "This period included a public holiday"
   - Default: Unchecked
   - Purpose: Triggers public holiday penalty checks

**Buttons:**
- **"Next"**: Validates all required fields → `onNext(formData)` → Advances to Step 2
  - Component: `/components/ui/button.tsx`
- **"Cancel"**: Closes wizard → `onCancel()`
  - Component: `/components/ui/button.tsx` with `variant="outline"`

**Validation:**
- All required fields must be filled
- Date range must be valid
- Show error messages below invalid fields

#### Step 2: Upload Documents
**File:** `/components/employee/wizard-steps/UploadDocumentsStep.tsx`

**3 Upload Zones:**

1. **Employment Contract** (Required)
   - Component: Custom drag-and-drop zone built with `/components/ui/card.tsx`
   - Formats: PDF, DOCX, DOC
   - Max size: 10MB
   - Display: Drag-and-drop zone or "Browse Files" button
   - Status: Shows file name + size when uploaded
   - Actions: "Change File" or "Remove" buttons (using `/components/ui/button.tsx`)
   - Validation: Required before Next

2. **Timesheet/Worksheet** (Required)
   - Same components as Employment Contract
   - Formats: PDF, DOCX, XLS, XLSX, CSV
   - Max size: 10MB
   - Purpose: Records of hours worked

3. **Payslip** (Required)
   - Same components as Employment Contract
   - Formats: PDF, DOCX
   - Max size: 10MB
   - Purpose: What employer actually paid

**Upload Process:**
- Current: Files stored in component state, not uploaded yet
- Intended: 
  - Upload to server: `POST /api/upload/document`
  - Receive: `{ fileUrl: string, fileId: string }`
  - Store file IDs for next steps

**Buttons:**
- **"Back"**: Return to Step 1 → `onBack()`
  - Component: `/components/ui/button.tsx` with `variant="outline"`
- **"Next"**: Validates all 3 files present → `onNext({ contractFile, worksheetFile, payslipFile })` → Step 3
  - Component: `/components/ui/button.tsx`

**Helper Features:**
- "Demo Files" button: Auto-fills with sample files
- File preview icon (future): Show first page thumbnail

#### Step 3: Review Extracted Info
**File:** `/components/employee/wizard-steps/ReviewExtractedStep.tsx`

**Display: AI-Extracted Data Review**

**Purpose:** Show what AI extracted from uploaded documents before processing

**Extracted Data Cards:**
Uses `/components/ui/card.tsx` for each section:

1. **From Contract:**
   - Base hourly rate (e.g., "$28.50/hr")
   - Evening rate (if specified)
   - Weekend rates
   - Other penalties
   - Classification level
   - Source: Contract clause references

2. **From Timesheet:**
   - Total hours worked
   - Breakdown by day (using `/components/ui/table.tsx`)
   - Breakdown by time period (ordinary, evening, weekend)
   - Dates and times
   - Source: Worksheet row references

3. **From Payslip:**
   - Total paid amount
   - Breakdown by pay component (using `/components/ui/table.tsx`)
   - Ordinary hours × rate
   - Penalty hours × rate (if any)
   - Deductions
   - Source: Payslip line items

**Editable Fields:**
- Each extracted value has an "Edit" icon button (using `/components/ui/button.tsx`)
- Click edit → Inline text input appears (using `/components/ui/input.tsx`)
- Change value → Updates `extractedData` in wizard state
- Purpose: Correct any OCR/extraction errors

**Validation Warnings:**
- Uses `/components/ui/badge.tsx` or `/components/ui/alert.tsx` for warnings
- Show yellow warning badge if:
  - Contract rate < Award minimum
  - Hours worked don't match payslip hours
  - Missing expected penalty rates
- Purpose: Flag potential issues before analysis

**Buttons:**
- **"Back"**: Return to Step 2 → `onBack()`
  - Component: `/components/ui/button.tsx` with `variant="outline"`
- **"Looks Good, Continue"**: Confirms data → `onNext({ extractedData })` → Step 4
  - Component: `/components/ui/button.tsx`

**Current Implementation:**
- Shows sample extracted data (hardcoded)
- Edit functionality may be placeholder

**Intended Implementation:**
- Call API after upload: `POST /api/extract/parse` with file IDs
- Receive structured JSON with extracted values
- Allow user to correct errors
- Save confirmed data for analysis

#### Step 4: Run Agentic Check
**File:** `/components/employee/wizard-steps/RunAgenticCheckStep.tsx`

**Display: Live AI Agent Processing**

**Purpose:** Show 10 AI agents running in sequence to analyze documents

**Agent Pipeline (10 Agents):**
Each agent card uses:
- `/components/ui/card.tsx` for container
- `/components/design-system/StatusBadge.tsx` for status (Running, Done, Failed)
- `/components/ui/progress.tsx` for progress bar
- `/components/ui/collapsible.tsx` for expandable logs

1. **Award Agent**
   - Purpose: Identify applicable award from job details
   - Input: Org type, state, role
   - Output: Award name, clauses

2. **Contract Agent**
   - Purpose: Parse contract for rates and terms
   - Input: Contract file
   - Output: Base rate, penalty rates, clauses

3. **Worksheet Agent**
   - Purpose: Extract hours from timesheet
   - Input: Worksheet file
   - Output: Hours by day, by type

4. **Payslip Agent**
   - Purpose: Extract payment data
   - Input: Payslip file
   - Output: Amount paid, line items

5. **Retrieval Agent**
   - Purpose: Fetch relevant award clauses from RAG database
   - Input: Award name, job type
   - Output: Award clause text

6. **Time Categorisation Agent**
   - Purpose: Classify hours (ordinary, evening, weekend, etc.)
   - Input: Timesheet hours
   - Output: Categorized hours

7. **Calculator Agent**
   - Purpose: Calculate entitlements based on award + contract
   - Input: Hours, rates, award clauses
   - Output: Entitled amount per category

8. **Underpayment Detector**
   - Purpose: Compare paid vs. entitled
   - Input: Paid amount, entitled amount
   - Output: Difference, flagged issues

9. **Explanation Agent**
   - Purpose: Generate human-readable explanation
   - Input: Calculation results
   - Output: Plain English explanation

10. **Guardrail Agent**
    - Purpose: Quality checks, validate logic
    - Input: All results
    - Output: Pass/fail, warnings

**UI Display:**
- Each agent shown as a card with:
  - Agent name
  - Status badge (Running, Done, Failed) using `/components/design-system/StatusBadge.tsx`
  - Progress bar (if running) using `/components/ui/progress.tsx`
  - Duration (when done)
  - Error count (if any) using `/components/ui/badge.tsx`
  - Expandable logs (click to show details) using `/components/ui/collapsible.tsx`

**Current Implementation:**
- Simulated with `setTimeout()` delays
- Each agent "completes" after 1-2 seconds
- Hardcoded to always succeed

**Intended Implementation:**
- WebSocket connection to backend:
  ```typescript
  const ws = new WebSocket(`ws://api/check/${checkId}/progress`);
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    // update = { agentId, status, progress, message, logs }
    updateAgentStatus(update);
  };
  ```
- Real-time updates as each agent completes
- Handle failures: Retry button, error details
- Logs streamed live

**Auto-Advance:**
- When all agents complete successfully → `onNext({ results })` → Step 5
- No button needed, auto-advances

**Error Handling:**
- If agent fails:
  - Show "Retry" button (using `/components/ui/button.tsx`)
  - Display error message (using `/components/ui/alert.tsx`)
  - Allow user to proceed anyway or fix and retry

#### Step 5: Results
**File:** `/components/employee/wizard-steps/ResultsStep.tsx`

**Display: Final Results with 4 Tabs**

This is the same component structure as `/components/employee/RequestDetailPage.tsx`, embedded in wizard.

**Summary Banner:**
Uses `/components/ui/card.tsx` and various design system components:
- Large status indicator: OK (green) or Underpaid (red) or Needs Review (amber)
  - Component: `/components/design-system/SeverityBadge.tsx`
- Key numbers:
  - Paid: $540.00
  - Entitled: $612.00
  - Difference: -$72.00 (underpaid)
- Confidence score: 86/100
  - Component: `/components/design-system/AnomalyScorePill.tsx`

**4 Tabs:**
Uses `/components/ui/tabs.tsx` for navigation:

1. **Summary Tab**
   - Uses `/components/ui/card.tsx` for metrics cards
   - Key metrics cards
   - Severity badge (`/components/design-system/SeverityBadge.tsx`)
   - Primary explanation
   - Top issues list
   - Recommendation: "You may be entitled to $72.00 in back pay"

2. **Calculation Details Tab**
   - Uses `/components/ui/table.tsx` for breakdown table
   - Line-item breakdown table:
     - Component | Hours | Rate | Expected | Paid | Difference
     - Ordinary hours | 16 | $28.00 | $448 | $448 | $0
     - Evening hours | 2 | $34.00 | $68 | $56 | -$12
     - Casual loading | — | 25% | $129 | $36 | -$60
   - Total row at bottom
   - Explanation of each line

3. **Evidence Tab**
   - Uses `/components/ui/card.tsx` for each evidence item
   - Evidence cards showing:
     - Contract excerpt with highlighted clause
     - Worksheet excerpt with relevant rows
     - Payslip excerpt with line items
     - Award clause citations
   - Each card has:
     - Document type icon (from `lucide-react`)
     - Title
     - Excerpt text
     - Reference (page/clause)
     - Confidence score pill (`/components/design-system/AnomalyScorePill.tsx`)

4. **Timeline Tab**
   - Uses list structure with status badges
   - Chronological list of events:
     - Request submitted
     - Documents uploaded
     - Each agent execution
     - Analysis complete
   - Shows timestamps, agent names, status badges (`/components/design-system/StatusBadge.tsx`)

**Buttons:**
- **"Download Evidence Pack"**: Export PDF with all details
  - Component: `/components/ui/button.tsx`
  - API: `GET /api/check/{id}/evidence-pack`
  - Triggers browser download
- **"Done"**: Close wizard, return to dashboard
  - Component: `/components/ui/button.tsx`
  - Handler: `onClose()`
  - Dashboard will now show this request in table

---

### Request Detail Page
**File:** `/components/employee/RequestDetailPage.tsx`

**Triggered by:** Click request row in dashboard

**Display:** Full-page 4-tab view (same tabs as Wizard Step 5 Results)

**Top Header:**
Uses `/components/design-system/PageHeader.tsx` (implied) or custom header:
- Back button (arrow left icon from `lucide-react`) → Returns to dashboard
  - Component: `/components/ui/button.tsx` with `variant="ghost"`
- Request ID badge (e.g., "REQ-2025-003")
  - Component: `/components/ui/badge.tsx`
- Pay period: "01–14 Aug 2025"
- Organisation: "BrightSteps Early Learning • Childcare"
- Submitted date: "15 Aug 2025"
- Status badge: Done
  - Component: `/components/design-system/StatusBadge.tsx`

**Key Metrics Row (Below Header):**
Uses `/components/ui/card.tsx` or similar:
- Paid: $540.00
- Entitled: $612.00
- Difference: -$72.00 (with severity badge from `/components/design-system/SeverityBadge.tsx`)

**4 Tabs (Same as Wizard Results):**
Uses `/components/ui/tabs.tsx`

See "Step 5: Results" above for detailed tab breakdown - same components and structure.

**Interactions:**

1. **Back Button**
   - File: Rendered in `/components/employee/RequestDetailPage.tsx`
   - Component: `/components/ui/button.tsx` with ArrowLeft icon
   - Handler: `onBack()` → `setViewingRequestId(null)` in parent (`EmployeeDashboardPage.tsx`)
   - Returns to dashboard

2. **Tab Navigation**
   - File: `/components/ui/tabs.tsx`
   - Click tab trigger → Switch active tab
   - Handler: Built into `<Tabs>` component
   - State: `defaultValue="summary"`

3. **Download Evidence Pack Button**
   - File: Rendered in `/components/employee/RequestDetailPage.tsx`
   - Component: `/components/ui/button.tsx`
   - Location: Top-right corner or bottom of page
   - Handler: `handleDownload()`
   - API: `GET /api/check/${requestId}/evidence-pack`
   - Downloads PDF with:
     - Cover page
     - Summary
     - Full calculation breakdown
     - Evidence excerpts with highlights
     - Timeline

4. **Export to CSV** (Conceptual, may not exist)
   - Export calculation table as CSV
   - For importing into spreadsheet

5. **Flag for Dispute** (Future Feature)
   - If underpaid, allow flagging for employer dispute
   - Opens modal to add notes
   - Submits formal dispute request

**Data Source:**
- Current: `requestDataMap` object with hardcoded sample data for different request IDs (lines 54-200+)
- Intended: 
  - API call: `GET /api/check/${requestId}` from `/services/checkApi.ts`
  - Response: Full `CheckRequest` object with all data
  - Loading state while fetching (using `/components/ui/skeleton.tsx`)

---

### Award Chat Page
**File:** `/components/employee/AwardChatPage.tsx`

**Full-Screen RAG-Powered Q&A Interface**

#### Layout

**Left Sidebar (30% width):**
Uses `/components/ui/card.tsx` for sections:

1. **Uploaded Documents Section**
   - Shows list of uploaded contracts
   - Each document card shows:
     - File name
     - Upload date
     - "Remove" button (using `/components/ui/button.tsx`)
   - Purpose: Context for personalized answers

2. **Upload Supporting Document Button**
   - Component: `/components/ui/button.tsx`
   - Icon: Upload icon from `lucide-react`
   - Opens `/components/employee/DocumentUploadModal.tsx`
   - Allows adding contract for personalized context

3. **"Use contract context" Checkbox**
   - Component: `/components/ui/checkbox.tsx` with `/components/ui/label.tsx`
   - When checked: Answers reference user's specific contract
   - When unchecked: Generic award information only
   - Handler: `setUseContractContext(!useContractContext)`

4. **Suggested Prompts**
   - Component: Multiple `/components/ui/button.tsx` with `variant="outline"`
   - Pre-written questions user can click:
     - "What are penalty rates after 6pm in childcare?"
     - "Do I get allowances for split shifts?"
     - "What evidence do I need to raise an underpayment issue?"
     - "How are evening hours defined under my award?"
   - Click → Populates input and sends

**Main Chat Area (70% width):**

- **Header:**
  - Component: Custom header using `/components/ui/card.tsx`
  - Award Assistant title
  - Award badge: "Children's Services Award 2010" (using `/components/ui/badge.tsx`)
  - Back button (if accessed from dashboard) using `/components/ui/button.tsx` with ArrowLeft icon

- **Message List:**
  - Scrollable chat history
  - Uses `/components/ui/scroll-area.tsx` (implied)
  - User messages: Right-aligned, blue background
  - AI messages: Left-aligned, grey background
  - Each AI message includes:
    - Response text (supports Markdown)
    - Citations section (if applicable):
      - Citation text
      - Reference (e.g., "Award p.12, Clause 25.3")
      - Clickable to view source (using `/components/ui/button.tsx`)
  - Height: `h-[calc(100vh-12rem)]` (increased for better visibility)
  - Message bubbles: `max-w-[95%]` (wide bubbles for readability)

- **Input Area (Bottom):**
  - Component: `/components/ui/input.tsx` or `/components/ui/textarea.tsx`
  - Text input field with placeholder: "Ask about your award entitlements..."
  - Send button (paper plane icon from `lucide-react`) using `/components/ui/button.tsx`
  - Character count (optional)
  - Auto-resize textarea

#### Interactions

1. **Send Message Button**
   - **File:** `/components/employee/AwardChatPage.tsx`
   - **Component:** `/components/ui/button.tsx` with Send icon
   - **Handler:** `handleSendMessage()` (lines ~61-90+)
   - **Current implementation:**
     - Adds user message to `messages` state
     - Calls `getAIResponse()` with keyword matching
     - 11 pre-defined response patterns (lines ~71-150+):
       - Penalty rates / evening
       - Overtime
       - Leave entitlements
       - Public holidays
       - Contract upload
       - Split shifts
       - Evidence/underpayment
       - Minimum wage
       - Classifications
       - Breaks
       - Default fallback
     - Simulates 800ms delay
     - Adds AI response with citations
   - **Intended implementation:**
     - API call from `/services/chatApi.ts`: `POST /api/chat/message`
     - Request:
       ```json
       {
         "message": "What are evening penalty rates?",
         "context": {
           "useContract": true,
           "contractFileId": "...",
           "award": "Children's Services Award 2010",
           "employmentType": "Casual"
         }
       }
       ```
     - Response:
       ```json
       {
         "response": "Based on your contract and the award...",
         "citations": [
           { "text": "Evening penalty", "reference": "Award p.12, Clause 25.3" }
         ],
         "confidence": 0.92
       }
       ```
     - Stream response for typing effect (Server-Sent Events or WebSocket)
     - Real RAG retrieval from award database

2. **Suggested Prompt Click**
   - **File:** `/components/employee/AwardChatPage.tsx`
   - **Component:** `/components/ui/button.tsx` with `variant="outline"`
   - **Handler:** `onClick={() => { setMessageInput(prompt); handleSendMessage(); }}`
   - Auto-fills input and submits immediately
   - User sees their question appear in chat

3. **Upload Supporting Document Button**
   - **File:** `/components/employee/AwardChatPage.tsx`
   - **Component:** `/components/ui/button.tsx` with Upload icon
   - **Handler:** `onClick={() => setShowUploadModal(true)}`
   - Opens `/components/employee/DocumentUploadModal.tsx`

4. **Citation Click** (Future)
   - Click citation reference → Opens modal or sidebar with full award clause
   - Shows PDF page with highlighted text
   - API: `GET /api/award/clause/${clauseId}`

5. **Copy Message Button** (Future)
   - Copy AI response to clipboard
   - Shows "Copied!" toast using `sonner@2.0.3`

6. **Regenerate Response Button** (Future)
   - Re-run RAG query for different answer
   - API: Same as send message, with `regenerate: true` flag

7. **Thumbs Up/Down** (Future)
   - Feedback on answer quality
   - API: `POST /api/chat/feedback`
   - Improves RAG ranking over time

8. **Clear Chat Button** (Conceptual)
   - Clears all messages
   - Confirmation modal using `/components/ui/alert-dialog.tsx`: "Are you sure?"

9. **Export Chat Button** (Conceptual)
   - Download chat history as PDF or TXT
   - API: `GET /api/chat/export?format=pdf`

#### Chat Message Flow

**User sends:** "What are my entitlements for evening shifts?"

**AI responds:**
```
Under the Children's Services Award, hours worked after 6pm are paid at the evening rate. For your role, this is typically higher than the ordinary rate...

📎 Citations:
• Evening penalty window - Award p.12, Clause 25.3
• Casual loading interaction - Award p.15, Clause 12.2
```

**If contract uploaded:**
```
Based on your contract with BrightSteps Early Learning:
• Your base rate: $28.50/hr
• Your evening rate: $31.35/hr (10% penalty + 25% casual loading)

Under the Children's Services Award 2010, you are entitled to...

📎 Citations:
• Your contract, Clause 4.2
• Award p.12, Clause 25.3
```

---

### Document Upload Modal
**File:** `/components/employee/DocumentUploadModal.tsx`

**Modal Overlay for Uploading Contract/Docs to Chat**

#### UI Components

**Header:**
Uses `/components/ui/dialog.tsx` or custom modal structure:
- Title: "Upload Supporting Document"
- Description: "Add your contract or other documents to get personalized answers"
- Close button (X icon from `lucide-react`) using `/components/ui/button.tsx`

**Drag-and-Drop Zone:**
Uses custom drag-and-drop zone built with `/components/ui/card.tsx`:
- Border: Dashed, changes to primary color on drag-over
- Icon: Upload icon (cloud with arrow) from `lucide-react`
- Text: "Drag and drop your document here, or"
- "Browse files" button (fake file input) using `/components/ui/button.tsx`
- Supported formats: "PDF, DOCX (max 10MB)"

**After File Selected:**
- Green checkmark icon from `lucide-react`
- "File selected: [filename]"
- "Choose different file" button using `/components/ui/button.tsx`

**Suggested Documents Section:**
Uses `/components/ui/card.tsx`:
- 2-column grid of suggestions:
  - [📄 Employment Contract]
  - [📄 Enterprise Agreement]
- Purpose: Help users know what to upload
- Not interactive (just informational)

**Privacy Notice:**
Uses `/components/ui/alert.tsx` with info variant:
- Blue info box at bottom
- "Privacy: Your documents are encrypted and only used to provide personalized answers. They are not shared with third parties."

**Action Buttons:**
Both use `/components/ui/button.tsx`:
- **"Upload Document"** (primary button)
  - Disabled until file selected
  - Handler: `handleUpload()`
  - Current: Calls `onUpload(fileName)` prop
  - Intended: Upload file to server, add to chat context
- **"Cancel"** (secondary button with `variant="outline"`)
  - Handler: `onClose()`
  - Closes modal without uploading

#### Interactions

1. **Drag and Drop**
   - **Events:** `onDragEnter`, `onDragOver`, `onDragLeave`, `onDrop`
   - **Handler:** `handleDrag()`, `handleDrop()`
   - **Behavior:**
     - Highlight zone when dragging over
     - Read dropped file
     - Validate file type and size
     - Set `selectedFile` state

2. **Browse Files Button**
   - **Component:** `/components/ui/button.tsx` triggering hidden `<input type="file">`
   - **Handler:** Triggers hidden `<input type="file">`
   - **Event:** `onChange={handleFileSelect}`
   - **Accept:** `.pdf,.docx,.doc`
   - **Max size:** 10MB (validated in handler)

3. **Choose Different File**
   - **Component:** `/components/ui/button.tsx`
   - **Handler:** `onClick={() => setSelectedFile(null)}`
   - Clears selected file, returns to drop zone

4. **Upload Document Button**
   - **Component:** `/components/ui/button.tsx`
   - **Handler:** `handleUpload()`
   - **Current implementation:**
     ```typescript
     if (selectedFile) {
       onUpload(selectedFile); // Just passes filename
     }
     ```
   - **Intended implementation:**
     - Create FormData
     - Upload to server via `/services/chatApi.ts`: `POST /api/upload/contract`
     - Show progress bar (0-100%) using `/components/ui/progress.tsx`
     - On success: Add to chat context
     - On error: Show error message using `/components/ui/alert.tsx`
     - Close modal

5. **Cancel Button**
   - **Component:** `/components/ui/button.tsx` with `variant="outline"`
   - **Handler:** `onClose()`
   - No upload, just closes modal

6. **Close Button (X)**
   - **Component:** `/components/ui/button.tsx` with X icon
   - Same as Cancel

7. **Click Outside Modal**
   - **Handler:** Added to backdrop `onClick={onClose}`
   - Inner card: `onClick={(e) => e.stopPropagation()}`
   - Closes modal when clicking dark background

---

## F) Data Model Reference

**Note:** These TypeScript interfaces are for documentation and type safety. They represent the expected data structure when the app is connected to a real backend.

**Recommended Location:** Create `/types/employee.ts` to house these interfaces

### Core Types

```typescript
// ============================================================
// PAY CHECK REQUEST & RESPONSE
// ============================================================

/**
 * Represents a single employee pay check verification request
 * Used by: 
 * - /components/dashboards/EmployeeDashboardPage.tsx (requests table)
 * - /components/employee/RequestDetailPage.tsx (detail view)
 * - /components/employee/wizard-steps/ResultsStep.tsx (wizard results)
 */
interface CheckRequest {
  id: string;                          // Unique request ID (e.g., "REQ-2025-003")
  
  // Employee (from auth context or form)
  employeeId: string;                  // User ID
  employeeName: string;                // Display name
  
  // Job details (from Step 1: MetaDetailsStep.tsx)
  organisationType: OrganisationType;  // Childcare, Retail, etc.
  organisationName: string;
  employmentType: EmploymentType;      // Full-time, Part-time, Casual
  roleTitle: string;                   // Job title
  classificationLevel?: string;        // Award level (if applicable)
  state: AustralianState;              // VIC, NSW, etc.
  
  // Pay period (from Step 1: MetaDetailsStep.tsx)
  payPeriodStart: Date;
  payPeriodEnd: Date;
  payPeriodLabel: string;              // "01–14 Aug 2025"
  hasPublicHoliday: boolean;
  
  // Uploaded documents (from Step 2: UploadDocumentsStep.tsx)
  contractFileUrl: string;             // S3 URL
  worksheetFileUrl: string;
  payslipFileUrl: string;
  
  // Extracted data (from Step 3: ReviewExtractedStep.tsx)
  extractedData: ExtractedData;
  
  // Results (from Step 4-5: RunAgenticCheckStep.tsx, ResultsStep.tsx)
  status: CheckStatus;                 // 'processing' | 'completed' | 'failed'
  severity: PaymentSeverity;           // 'ok' | 'underpaid' | 'needs-review'
  
  // Amounts (displayed in ResultsStep.tsx and RequestDetailPage.tsx)
  paidAmount: number;                  // From payslip
  entitledAmount: number;              // Calculated
  difference: number;                  // Underpayment (negative) or overpayment (positive)
  
  // AI analysis (displayed with AnomalyScorePill.tsx)
  anomalyScore: number;                // 0-100 confidence score
  confidence: number;                  // 0.0-1.0 probability
  explanation: string;                 // Plain English explanation
  
  // Breakdown (displayed in Calculation tab using /components/ui/table.tsx)
  calculationBreakdown: CalculationLine[];
  evidence: Evidence[];
  timeline: TimelineEvent[];
  
  // Metadata
  submittedDate: Date;
  completedDate?: Date;
  processingDuration?: number;         // Seconds
  
  // Award context (identified by Award Agent in Step 4)
  awardName: string;                   // "Children's Services Award 2010"
  awardCode?: string;                  // "MA000120"
  relevantClauses: AwardClause[];
}

type CheckStatus = 'draft' | 'processing' | 'completed' | 'failed';
// Rendered using /components/design-system/StatusBadge.tsx

type PaymentSeverity = 'ok' | 'underpaid' | 'overpaid' | 'needs-review';
// Rendered using /components/design-system/SeverityBadge.tsx

type OrganisationType = 'childcare' | 'retail' | 'healthcare' | 'hospitality' | 'other';
type EmploymentType = 'full-time' | 'part-time' | 'casual';
type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

/**
 * Data extracted from uploaded documents by AI (Step 3: ReviewExtractedStep.tsx)
 * Displayed in cards using /components/ui/card.tsx
 * Editable fields use /components/ui/input.tsx
 */
interface ExtractedData {
  // From contract (parsed by Contract Agent in Step 4)
  contract: {
    baseRate: number;                  // $/hr
    eveningRate?: number;
    saturdayRate?: number;
    sundayRate?: number;
    publicHolidayRate?: number;
    casualLoading?: number;            // % (e.g., 25)
    classificationLevel?: string;
    effectiveDate?: Date;
    clauses: Array<{
      clauseNumber: string;
      text: string;
    }>;
  };
  
  // From timesheet (parsed by Worksheet Agent in Step 4)
  worksheet: {
    totalHours: number;
    breakdown: Array<{
      date: string;                    // "2025-08-05"
      dayOfWeek: string;               // "Wednesday"
      timeRange: string;               // "18:00-20:00"
      hours: number;
      category: HourCategory;          // "ordinary" | "evening" | "weekend"
      isPublicHoliday: boolean;
    }>;
    summary: {
      ordinaryHours: number;
      eveningHours: number;
      weekendHours: number;
      publicHolidayHours: number;
    };
  };
  
  // From payslip (parsed by Payslip Agent in Step 4)
  payslip: {
    totalGross: number;
    totalNet: number;
    lineItems: Array<{
      description: string;             // "Ordinary hours"
      hours?: number;
      rate?: number;
      amount: number;
    }>;
    deductions: Array<{
      description: string;
      amount: number;
    }>;
    payDate: Date;
  };
}

type HourCategory = 'ordinary' | 'evening' | 'saturday' | 'sunday' | 'public-holiday' | 'overtime';

/**
 * Single line in calculation breakdown table
 * Displayed in Calculation tab using /components/ui/table.tsx
 */
interface CalculationLine {
  id: string;
  component: string;                   // "Ordinary hours", "Evening hours", etc.
  hours?: number;                      // If hourly component
  rate?: number;                       // $/hr
  percentage?: number;                 // For loadings (e.g., 25%)
  expected: number;                    // Amount should have been paid
  paid: number;                        // Amount actually paid
  difference: number;                  // Underpayment (negative) or overpayment (positive)
  explanation?: string;                // Why this component matters
  awardClauseRef?: string;             // Clause number
}

/**
 * Evidence item from documents
 * Displayed in Evidence tab using /components/ui/card.tsx
 * Confidence shown with /components/design-system/AnomalyScorePill.tsx
 */
interface Evidence {
  type: 'contract' | 'worksheet' | 'payslip' | 'award';
  title: string;                       // Short summary
  excerpt: string;                     // Relevant text excerpt
  reference: string;                   // "Page 3, Clause 4.2" or "Row 5"
  confidence: number;                  // 0.0-1.0 AI confidence in extraction
  highlightedText?: string;            // Text to highlight in UI
  sourceUrl?: string;                  // Link to full document
}

/**
 * Timeline event during processing
 * Displayed in Timeline tab with /components/design-system/StatusBadge.tsx
 */
interface TimelineEvent {
  time: string;                        // ISO timestamp or display string
  event: string;                       // "Contract parsed", "Underpayment detected"
  agent: string;                       // "Contract Agent", "System"
  status?: 'done' | 'running' | 'failed';
  details?: string;                    // Additional context
}

/**
 * Award clause citation
 * Displayed in Evidence tab
 */
interface AwardClause {
  clauseNumber: string;                // "25.3"
  clauseTitle: string;                 // "Evening penalty rates"
  text: string;                        // Full clause text
  page?: number;                       // Page in PDF
  relevance: string;                   // Why this clause applies
  url?: string;                        // Link to official source
}

// ============================================================
// AGENT EXECUTION (Step 4: RunAgenticCheckStep.tsx)
// ============================================================

/**
 * Status of one agent in the 10-agent pipeline
 * Displayed using:
 * - /components/ui/card.tsx for container
 * - /components/design-system/StatusBadge.tsx for status
 * - /components/ui/progress.tsx for progress bar
 */
interface AgentStatus {
  id: string;
  name: string;                        // "Award Agent", "Calculator Agent", etc.
  sequenceNumber: number;              // 1-10
  status: 'pending' | 'running' | 'done' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;                   // Seconds
  progress?: number;                   // 0-100
  errorMessage?: string;
  logs: AgentLog[];
}

interface AgentLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}

// ============================================================
// AWARD CHAT & RAG (/components/employee/AwardChatPage.tsx)
// ============================================================

/**
 * Chat message in Award Assistant
 * Displayed as message bubbles in chat area
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;                     // Markdown-formatted text
  citations?: Citation[];
  timestamp: Date;
  confidence?: number;                 // AI confidence in answer (0-1)
}

/**
 * Citation in AI response
 * Displayed below message with reference links
 */
interface Citation {
  text: string;                        // Short label (e.g., "Evening penalty window")
  reference: string;                   // "Award p.12, Clause 25.3"
  clauseId?: string;                   // For linking to full clause
  url?: string;                        // Link to source document
}

/**
 * Chat request to RAG API
 * Sent from /components/employee/AwardChatPage.tsx
 * API service: /services/chatApi.ts
 */
interface ChatRequest {
  message: string;                     // User's question
  context?: ChatContext;               // Optional personalized context
  conversationId?: string;             // For multi-turn conversations
}

interface ChatContext {
  useContract: boolean;                // From checkbox in AwardChatPage.tsx
  contractFileId?: string;             // Uploaded contract reference
  award: string;                       // "Children's Services Award 2010"
  employmentType: EmploymentType;
  state: AustralianState;
  roleTitle?: string;
}

/**
 * Chat response from RAG API
 * Received in /components/employee/AwardChatPage.tsx
 */
interface ChatResponse {
  response: string;                    // AI-generated answer (Markdown)
  citations: Citation[];
  confidence: number;                  // 0.0-1.0
  conversationId: string;              // For follow-up questions
  relatedQuestions?: string[];         // Suggested follow-ups
}

/**
 * Uploaded document for chat context
 * Uploaded via /components/employee/DocumentUploadModal.tsx
 * Displayed in sidebar of /components/employee/AwardChatPage.tsx
 */
interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: 'contract' | 'enterprise-agreement' | 'other';
  fileSize: number;                    // Bytes
  uploadDate: Date;
  status: 'processing' | 'ready' | 'failed';
  s3Url: string;
  extractedSummary?: string;           // AI summary of contents
}

// ============================================================
// USER PROFILE
// ============================================================

/**
 * Employee user profile
 * Used for personalization throughout app
 */
interface EmployeeUser {
  id: string;
  email: string;
  name: string;                        // Displayed in EmployeeDashboardPage.tsx header
  
  // Employment details (shown in dashboard header)
  organisationName: string;            // "BrightSteps Early Learning"
  organisationType: OrganisationType;
  employmentType: EmploymentType;      // "Casual"
  roleTitle: string;                   // "Educator"
  state: AustralianState;              // "VIC"
  startDate?: Date;
  
  // Award context (pre-fills wizard fields)
  applicableAward?: string;
  classificationLevel?: string;
  
  // Settings
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  
  // Metadata
  createdDate: Date;
  lastLogin?: Date;
}

// ============================================================
// DASHBOARD METRICS (/components/dashboards/EmployeeDashboardPage.tsx)
// ============================================================

/**
 * Dashboard summary data
 * Fetched from API: GET /api/employee/dashboard
 */
interface DashboardMetrics {
  // Latest result (displayed in card using /components/ui/card.tsx)
  latestResult?: {
    requestId: string;
    payPeriod: string;
    paid: number;
    entitled: number;
    difference: number;
    severity: PaymentSeverity;         // Shown with /components/design-system/SeverityBadge.tsx
    processedDate: string;
  };
  
  // Summary stats
  totalRequests: number;
  underpaidCount: number;
  okCount: number;
  totalUnderpayment: number;          // Sum of all underpayments
  
  // Recent requests (for table using /components/ui/table.tsx)
  recentRequests: CheckRequest[];     // Last 5-10 requests
  
  // Agent activity (for sidebar)
  recentAgentActivity: Array<{
    agent: string;
    timestamp: string;
    status: 'done' | 'running' | 'failed'; // Shown with /components/design-system/StatusBadge.tsx
    requestId?: string;
  }>;
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
// WIZARD STATE (/components/employee/PayCheckWizard.tsx)
// ============================================================

/**
 * Wizard data structure (used internally by PayCheckWizard.tsx)
 * Passed between wizard steps as props
 */
interface WizardData {
  // Step 1: Meta details (MetaDetailsStep.tsx)
  organisationType: string;
  organisationName: string;
  employmentType: string;
  roleTitle: string;
  classificationLevel: string;
  periodStart: string;                 // ISO date string
  periodEnd: string;
  state: string;
  hasPublicHoliday: boolean;
  
  // Step 2: Documents (UploadDocumentsStep.tsx)
  contractFile: File | null;
  worksheetFile: File | null;
  payslipFile: File | null;
  
  // Step 3: Extracted data (ReviewExtractedStep.tsx)
  extractedData: ExtractedData | null;
  
  // Step 4-5: Results (RunAgenticCheckStep.tsx, ResultsStep.tsx)
  results: CheckRequest | null;
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
All Employee pages use inline sample data:
- `/components/dashboards/EmployeeDashboardPage.tsx`: Lines 18-71 (latest result, requests, agent activity)
- `/components/employee/RequestDetailPage.tsx`: Lines 54-200+ (`requestDataMap` with multiple sample requests)
- `/components/employee/AwardChatPage.tsx`: Initial messages and suggested prompts hardcoded
- Wizard steps: Sample extracted data

#### Steps to Replace with Real Data

**Step 1: Create API Service Layer**

Create new file: `/services/checkApi.ts`

```typescript
// Conceptual structure (not actual code)
// File: /services/checkApi.ts

export async function fetchMyRequests(): Promise<CheckRequest[]>
export async function fetchRequestDetail(requestId: string): Promise<CheckRequest>
export async function submitCheckRequest(data: WizardData): Promise<{ requestId: string }>
export async function uploadDocument(file: File, type: string): Promise<{ fileId: string, fileUrl: string }>
export async function extractDocumentData(fileIds: string[]): Promise<ExtractedData>
export async function startAgenticCheck(requestId: string): Promise<{ websocketUrl: string }>
```

**Step 2: Create Chat API Service**

Create file: `/services/chatApi.ts`

```typescript
// File: /services/chatApi.ts

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse>
export async function uploadContractForChat(file: File): Promise<UploadedDocument>
export async function fetchChatHistory(conversationId?: string): Promise<ChatMessage[]>
```

**Step 3: Add Data Fetching Hooks**

Create custom hooks in `/hooks/useCheckData.ts`:

```typescript
// File: /hooks/useCheckData.ts
// Conceptual

export function useMyRequests() {
  const [data, setData] = useState<CheckRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    fetchMyRequests()  // from /services/checkApi.ts
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  return { data, loading, error, refetch };
}

export function useRequestDetail(requestId: string) {
  // Similar pattern
}
```

**Step 4: Replace Sample Data in Components**

**In `/components/dashboards/EmployeeDashboardPage.tsx`:**
- Remove `latestResult` object (lines 19-27)
- Remove `requests` array (lines 29-57)
- Add: `const { data: requests, loading, error } = useMyRequests()`
- Derive `latestResult` from `requests[0]`
- Add loading spinner: `{loading && <Skeleton />}` (using `/components/ui/skeleton.tsx`)
- Add error display: `{error && <ErrorAlert message={error.message} />}`

**In `/components/employee/RequestDetailPage.tsx`:**
- Remove `requestDataMap` (lines 54-200+)
- Add: `const { data: requestData, loading, error } = useRequestDetail(requestId)`
- Use `requestData` instead of `requestDataMap[requestId]`

---

### 2. Implement Pay Check Wizard with Real Processing

#### Step 1: Meta Details (No API Yet)
**File:** `/components/employee/wizard-steps/MetaDetailsStep.tsx`
- Store form data in local state
- Validation is already implemented
- No API call needed until submission

#### Step 2: Upload Documents
**File:** `/components/employee/wizard-steps/UploadDocumentsStep.tsx`

**Current:** Files stored in component state only

**Implement:**
1. Create upload handler:
   ```typescript
   // In /components/employee/wizard-steps/UploadDocumentsStep.tsx
   const handleFileUpload = async (file: File, type: string) => {
     setUploading(true);
     try {
       const result = await uploadDocument(file, type);  // from /services/checkApi.ts
       // result = { fileId, fileUrl }
       return result.fileId;
     } catch (error) {
       setError(`Failed to upload ${type}`);
     } finally {
       setUploading(false);
     }
   };
   ```

2. Upload immediately on file selection or wait until Next
   - Option A: Upload on selection (better UX, instant feedback)
   - Option B: Upload on Next button (simpler, batch operation)

3. Show upload progress:
   - Use `XMLHttpRequest` or `axios` with progress callback
   - Update progress bar using `/components/ui/progress.tsx`: `setUploadProgress(percentage)`

4. Store file IDs in wizard state:
   ```typescript
   onNext({
     contractFileId: 'file_abc123',
     worksheetFileId: 'file_def456',
     payslipFileId: 'file_ghi789'
   });
   ```

#### Step 3: Review Extracted Data
**File:** `/components/employee/wizard-steps/ReviewExtractedStep.tsx`

**Current:** Shows hardcoded sample extraction

**Implement:**
1. On step mount, call extraction API:
   ```typescript
   // In /components/employee/wizard-steps/ReviewExtractedStep.tsx
   useEffect(() => {
     const extractData = async () => {
       setExtracting(true);
       try {
         const extracted = await extractDocumentData([  // from /services/checkApi.ts
           wizardData.contractFileId,
           wizardData.worksheetFileId,
           wizardData.payslipFileId
         ]);
         setExtractedData(extracted);
       } catch (error) {
         setError('Failed to extract data');
       } finally {
         setExtracting(false);
       }
     };
     extractData();
   }, []);
   ```

2. API endpoint: `POST /api/extract/parse`
   - Request: `{ fileIds: string[], metadata: { orgType, employmentType, etc. } }`
   - Response: `ExtractedData` object
   - Processing time: 5-15 seconds (show loading using `/components/ui/progress.tsx`)

3. Display extracted data in editable fields (using `/components/ui/input.tsx`)
4. Save user corrections to state
5. Pass confirmed data to next step

#### Step 4: Run Agentic Check
**File:** `/components/employee/wizard-steps/RunAgenticCheckStep.tsx`

**Current:** Simulated with setTimeout

**Implement:**
1. Create WebSocket connection:
   ```typescript
   // In /components/employee/wizard-steps/RunAgenticCheckStep.tsx
   useEffect(() => {
     const startCheck = async () => {
       // Create check request on backend
       const { requestId, websocketUrl } = await startAgenticCheck({  // from /services/checkApi.ts
         ...wizardData,
         extractedData: confirmedData
       });
       
       // Connect to WebSocket for live updates
       const ws = new WebSocket(websocketUrl);
       
       ws.onopen = () => {
         console.log('Connected to agent stream');
       };
       
       ws.onmessage = (event) => {
         const update = JSON.parse(event.data);
         // update = { agentId, status, progress, message, logs }
         
         // Update UI using state
         updateAgentStatus(update.agentId, {
           status: update.status,          // Update /components/design-system/StatusBadge.tsx
           progress: update.progress,      // Update /components/ui/progress.tsx
           logs: [...existingLogs, ...update.logs]
         });
         
         // Check if all agents complete
         if (update.type === 'COMPLETE') {
           setResults(update.results);
           onNext({ results: update.results });
         }
       };
       
       ws.onerror = (error) => {
         setError('Processing failed');
       };
       
       return () => ws.close();
     };
     
     startCheck();
   }, []);
   ```

2. Backend implements:
   - Orchestrates 10 agents in sequence
   - Sends WebSocket updates after each agent
   - Message format: `{ agentId, name, status, duration, logs[] }`

3. Handle failures:
   - If agent fails, show "Retry" button (using `/components/ui/button.tsx`)
   - Allow skipping failed agent
   - Show detailed error logs (using `/components/ui/collapsible.tsx`)

#### Step 5: Results
**File:** `/components/employee/wizard-steps/ResultsStep.tsx`

**Current:** Shows sample results

**After Step 4:** Results already received from WebSocket, stored in wizard state

**No additional API needed** - just display results using:
- `/components/ui/tabs.tsx` for tab navigation
- `/components/ui/table.tsx` for calculation breakdown
- `/components/ui/card.tsx` for evidence items

---

### 3. Implement Award Chat with Real RAG

**File:** `/components/employee/AwardChatPage.tsx`

#### Current State
- Keyword-based responses with 11 pre-defined patterns (lines ~71-150+)
- Simulated 800ms delay
- Fake citations

#### Steps to Implement Real RAG

**Step 1: Set Up Chat Service**

Create `/services/chatApi.ts`:
```typescript
// File: /services/chatApi.ts
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  return response.json();
}
```

**Step 2: Replace Keyword Matching**

In `/components/employee/AwardChatPage.tsx`, replace `getAIResponse()` (line ~57-82):
```typescript
// In /components/employee/AwardChatPage.tsx
const handleSendMessage = async () => {
  if (!messageInput.trim()) return;
  
  // Add user message immediately to chat
  const userMsg: ChatMessage = {
    id: generateId(),
    role: 'user',
    content: messageInput,
    timestamp: new Date()
  };
  setMessages(prev => [...prev, userMsg]);
  setMessageInput('');  // Clear input (using /components/ui/input.tsx)
  setIsTyping(true);
  
  try {
    // Call real RAG API
    const response = await sendMessage({  // from /services/chatApi.ts
      message: messageInput,
      context: {
        useContract: useContractContext,  // from checkbox state
        contractFileId: uploadedContract?.id,
        award: 'Children\'s Services Award 2010',
        employmentType: 'Casual', // From user profile
        state: 'VIC',
        roleTitle: 'Educator'
      },
      conversationId: currentConversationId
    });
    
    // Add AI response to chat
    const aiMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: response.response,
      citations: response.citations,
      timestamp: new Date(),
      confidence: response.confidence
    };
    setMessages(prev => [...prev, aiMsg]);
    setCurrentConversationId(response.conversationId);
    
  } catch (error) {
    // Show error message in chat
    const errorMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errorMsg]);
  } finally {
    setIsTyping(false);
  }
};
```

**Step 3: Implement Streaming (Optional)**

For real-time typing effect, use Server-Sent Events:
```typescript
// In /components/employee/AwardChatPage.tsx
const handleSendMessageStreaming = async () => {
  // ... add user message ...
  
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: messageInput, context })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let aiMessage = '';
  const aiMsgId = generateId();
  
  // Add empty AI message that will be updated
  setMessages(prev => [...prev, {
    id: aiMsgId,
    role: 'assistant',
    content: '',
    timestamp: new Date()
  }]);
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    aiMessage += chunk;
    
    // Update message in real-time
    setMessages(prev => prev.map(msg => 
      msg.id === aiMsgId 
        ? { ...msg, content: aiMessage }
        : msg
    ));
  }
};
```

**Step 4: Document Upload for Context**

In `/components/employee/DocumentUploadModal.tsx`, implement real upload:
```typescript
// In /components/employee/DocumentUploadModal.tsx
const handleUpload = async () => {
  if (!selectedFile) return;
  
  setUploading(true);
  try {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', 'contract');
    
    const result = await uploadContractForChat(selectedFile);  // from /services/chatApi.ts
    // result = { id, fileName, status, s3Url }
    
    onUpload(result); // Pass to parent /components/employee/AwardChatPage.tsx
    onClose();
  } catch (error) {
    setError('Upload failed');  // Show error in modal
  } finally {
    setUploading(false);
  }
};
```

Show uploaded documents in chat sidebar (in `/components/employee/AwardChatPage.tsx`):
```typescript
// In /components/employee/AwardChatPage.tsx sidebar
{uploadedDocuments.map(doc => (
  <div key={doc.id} className="document-card">  {/* Uses /components/ui/card.tsx */}
    <FileText icon />  {/* from lucide-react */}
    <span>{doc.fileName}</span>
    <Button onClick={() => removeDocument(doc.id)}>Remove</Button>  {/* /components/ui/button.tsx */}
  </div>
))}
```

**Step 5: Backend RAG Implementation (Out of Scope)**
- Vector database with award clauses
- Embeddings for semantic search
- LLM for answer generation
- Citation extraction
- Contract context injection

---

### 4. Add Loading and Error States

#### Current State
Minimal loading/error handling

#### Steps to Implement

**Step 1: Create Shared Components**
- `/components/ui/skeleton.tsx`: Already exists (shadcn/ui)
- `/components/ui/alert.tsx`: Already exists for errors
- `/components/design-system/EmptyState.tsx`: Already exists

**Step 2: Add to Dashboard**

In `/components/dashboards/EmployeeDashboardPage.tsx`:
```typescript
// Wrap requests table
{loading && <Skeleton className="h-32 w-full" />}  {/* /components/ui/skeleton.tsx */}
{error && <Alert variant="destructive">{error.message}</Alert>}  {/* /components/ui/alert.tsx */}
{!loading && !error && requests.length === 0 && (
  <EmptyState   {/* /components/design-system/EmptyState.tsx */}
    title="No requests yet"
    description="Submit your first pay check to get started"
    action={<Button onClick={() => setShowWizard(true)}>Submit First Check</Button>}
  />
)}
{!loading && !error && requests.length > 0 && (
  <Table>...</Table>  {/* /components/ui/table.tsx */}
)}
```

**Step 3: Add to Request Detail**

In `/components/employee/RequestDetailPage.tsx`:
```typescript
// Show skeleton loader while fetching
{loading && (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />  {/* /components/ui/skeleton.tsx */}
    <Skeleton className="h-64 w-full" />
  </div>
)}
```

**Step 4: Add to Wizard Steps**
- Step 2 (`/components/employee/wizard-steps/UploadDocumentsStep.tsx`): Show progress bar per file using `/components/ui/progress.tsx`
- Step 3 (`/components/employee/wizard-steps/ReviewExtractedStep.tsx`): Show "Extracting data..." spinner
- Step 4 (`/components/employee/wizard-steps/RunAgenticCheckStep.tsx`): Already has per-agent progress

**Step 5: Add Toast Notifications**

Use existing `sonner@2.0.3` for success/error toasts:
```typescript
import { toast } from 'sonner@2.0.3';

// On success
toast.success('Pay check submitted successfully!');

// On error
toast.error('Failed to upload document. Please try again.');
```

---

### 5. Implement Export Functionality

#### Evidence Pack Export

**Current:** "Download Evidence Pack" button exists but may be static

**Files to modify:**
- `/components/employee/RequestDetailPage.tsx`
- `/components/employee/wizard-steps/ResultsStep.tsx`

**Implement:**
```typescript
// In both files above
const handleDownloadEvidencePack = async () => {
  setDownloading(true);
  try {
    const blob = await fetch(`/api/check/${requestId}/evidence-pack`).then(r => r.blob());
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PayGuard_Evidence_${requestId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Evidence pack downloaded');  // from sonner@2.0.3
  } catch (error) {
    toast.error('Download failed');
  } finally {
    setDownloading(false);
  }
};
```

Backend generates PDF with:
- Cover page (request ID, period, employee name)
- Summary (paid vs. entitled, severity badge)
- Full calculation breakdown table
- Evidence excerpts with highlights
- Award clause citations
- Timeline of processing

#### Chat Export

**File to modify:** `/components/employee/AwardChatPage.tsx`

**Implement:**
1. Add "Export Chat" button
2. Generate PDF or TXT with full conversation
3. API: `GET /api/chat/export?conversationId=...&format=pdf`

---

### 6. Implement Notifications

#### Conceptual Feature (Future)

**Step 1: WebSocket for Real-Time Notifications**
- Connect to notification service when user logs in
- Listen for events:
  - Check processing complete
  - Underpayment detected
  - New message from Award Assistant (if async)

**Step 2: Display in UI**
- Bell icon in top bar (currently static in `/components/dashboards/EmployeeDashboardPage.tsx`)
- Badge with count of unread notifications (using `/components/ui/badge.tsx`)
- Dropdown menu showing recent notifications (using `/components/ui/dropdown-menu.tsx`)
- Click notification → Navigate to relevant page

**Step 3: Email Notifications**
- Backend sends email when check completes
- Include summary and link to view details

---

### 7. File Locations Summary

| Task | Files to Modify | New Files to Create |
|------|-----------------|---------------------|
| Replace sample data | `/components/dashboards/EmployeeDashboardPage.tsx`<br>`/components/employee/RequestDetailPage.tsx`<br>`/components/employee/AwardChatPage.tsx` | `/services/checkApi.ts`<br>`/services/chatApi.ts`<br>`/hooks/useCheckData.ts`<br>`/types/employee.ts` |
| Add loading/error states | All data-fetching components | `/components/ui/ErrorBoundary.tsx` (if not exist) |
| Real file upload | `/components/employee/wizard-steps/UploadDocumentsStep.tsx` | Update `/services/checkApi.ts` |
| Document extraction | `/components/employee/wizard-steps/ReviewExtractedStep.tsx` | Update `/services/checkApi.ts` |
| WebSocket for agents | `/components/employee/wizard-steps/RunAgenticCheckStep.tsx` | `/services/websocketService.ts` (optional) |
| RAG chat | `/components/employee/AwardChatPage.tsx` | Update `/services/chatApi.ts` |
| Document upload modal | `/components/employee/DocumentUploadModal.tsx` | Update `/services/chatApi.ts` |
| Export functionality | `/components/employee/RequestDetailPage.tsx`<br>`/components/employee/wizard-steps/ResultsStep.tsx` | `/utils/exportHelpers.ts` (optional) |
| Notifications | `/components/dashboards/EmployeeDashboardPage.tsx` | `/services/notificationService.ts` |

---

### 8. Backend API Endpoints (Reference)

**Note:** This is a conceptual list of endpoints the frontend would call. Backend implementation is out of scope.

**Service Files:**
- `/services/checkApi.ts` - Pay check request APIs
- `/services/chatApi.ts` - Award assistant chat APIs

| Method | Endpoint | Purpose | Request | Response | Called From |
|--------|----------|---------|---------|----------|-------------|
| GET | `/api/employee/requests` | List my requests | None | `CheckRequest[]` | `EmployeeDashboardPage.tsx` via `useMyRequests()` hook |
| GET | `/api/check/:id` | Single request detail | None | `CheckRequest` | `RequestDetailPage.tsx` via `useRequestDetail(id)` hook |
| POST | `/api/upload/document` | Upload single document | FormData with file | `{ fileId, fileUrl }` | `UploadDocumentsStep.tsx` |
| POST | `/api/extract/parse` | Extract data from docs | `{ fileIds: [], metadata }` | `ExtractedData` | `ReviewExtractedStep.tsx` |
| POST | `/api/check/submit` | Submit new check request | `WizardData` | `{ requestId }` | `RunAgenticCheckStep.tsx` |
| POST | `/api/check/start` | Start agent processing | `{ requestId }` | `{ websocketUrl }` | `RunAgenticCheckStep.tsx` |
| WebSocket | `/ws/check/:id/progress` | Live agent updates | N/A | Stream of `{ agentId, status, progress }` | `RunAgenticCheckStep.tsx` |
| GET | `/api/check/:id/evidence-pack` | Download evidence PDF | None | Blob (PDF) | `RequestDetailPage.tsx`, `ResultsStep.tsx` |
| POST | `/api/chat/message` | Send chat message | `ChatRequest` | `ChatResponse` | `AwardChatPage.tsx` |
| POST | `/api/chat/stream` | Streaming chat | `ChatRequest` | SSE stream of text chunks | `AwardChatPage.tsx` (future) |
| POST | `/api/chat/upload-contract` | Upload contract for chat | FormData with file | `UploadedDocument` | `DocumentUploadModal.tsx` |
| GET | `/api/chat/history` | Get chat history | `?conversationId=` | `ChatMessage[]` | `AwardChatPage.tsx` |
| GET | `/api/chat/export` | Export chat | `?conversationId=&format=` | Blob (PDF/TXT) | `AwardChatPage.tsx` (future) |
| GET | `/api/employee/dashboard` | Dashboard metrics | None | `DashboardMetrics` | `EmployeeDashboardPage.tsx` |

---

## Summary

This document provides a comprehensive reference for the **Employee experience** in PayGuard without modifying any code. It covers:

✅ **Navigation flows** between all pages and modals with **full file paths**  
✅ **Route/state mapping** for the React app managed in `EmployeeDashboardPage.tsx`  
✅ **Page ownership** mapping every screen to its `.tsx` file  
✅ **Complete interaction map** for every button, form field, chat input, upload with **component file references**  
✅ **TypeScript data models** for all entities with **file usage notes**  
✅ **Implementation guidelines** for wiring to real APIs with **specific file locations**  

**Every feature, component, and interaction now includes:**
- 📁 **Component file paths** (e.g., `/components/ui/button.tsx`)
- 🎨 **UI component references** (e.g., uses `SeverityBadge.tsx`)
- 🔧 **Service file locations** (e.g., `/services/checkApi.ts`)
- 📊 **Data type files** (e.g., `/types/employee.ts`)

**Next Steps for Development:**
1. Create API service layer (`/services/checkApi.ts`, `/services/chatApi.ts`)
2. Create TypeScript types file (`/types/employee.ts`)
3. Implement data fetching hooks (`/hooks/useCheckData.ts`)
4. Replace sample data in `/components/dashboards/EmployeeDashboardPage.tsx`
5. Add loading/error states using `/components/ui/skeleton.tsx` and `/components/ui/alert.tsx`
6. Implement real file upload in `/components/employee/wizard-steps/UploadDocumentsStep.tsx`
7. Wire document extraction API in `/components/employee/wizard-steps/ReviewExtractedStep.tsx`
8. Connect WebSocket in `/components/employee/wizard-steps/RunAgenticCheckStep.tsx`
9. Replace keyword-based chat in `/components/employee/AwardChatPage.tsx` with real RAG API
10. Implement document upload in `/components/employee/DocumentUploadModal.tsx`

**Key Files to Focus On:**
- `/components/dashboards/EmployeeDashboardPage.tsx` (main state orchestrator)
- `/components/employee/PayCheckWizard.tsx` (5-step wizard)
- `/components/employee/wizard-steps/` (individual step components)
- `/components/employee/RequestDetailPage.tsx` (4-tab detail view)
- `/components/employee/AwardChatPage.tsx` (RAG-powered chat)
- `/components/employee/DocumentUploadModal.tsx` (file upload)

**Special Features:**
- **10-Agent Pipeline:** Real-time processing with WebSocket updates in `RunAgenticCheckStep.tsx`
- **RAG-Powered Chat:** Award Assistant with document context and citations in `AwardChatPage.tsx`
- **Evidence Pack Export:** Comprehensive PDF generation from `RequestDetailPage.tsx`
- **Inline Chat:** Embedded chat on dashboard in `EmployeeDashboardPage.tsx`

---

**Document Version:** 1.1 (Updated with file paths throughout)  
**Created:** January 2, 2026  
**Updated:** January 2, 2026  
**Purpose:** Reference and handoff documentation only — no code changes
