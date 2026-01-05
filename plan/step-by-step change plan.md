Employee Backend Integration Plan



1\) Employee Scope Map

2\) Step-by-Step Plan (Steps 1–8)

3\) Shared Architecture Rules



-----------------------------

Each step includes:

A. Goal

B. Files to Modify/Create

C. API Design

D. Amazon Q Prompt

E. Frontend Integration Plan

F. Stop Point

G. Test Checklist

H. Definition of Done



----------------------------



Employee Scope Map

| Employee Page/Component | Current Sample Data Location | Required Backend Data |



|------------------------|------------------------------|----------------------|



| Employee Sign Up (/components/auth/EmployeeSignUp.tsx) | Simulated API call (line 68-72) | POST /api/auth/employee/signup - Create user account |



| Login (/components/LoginForm.tsx) | Hardcoded demo credentials (line 55) | POST /api/auth/employee/login - Authenticate, return JWT |



| Dashboard Header (/components/dashboards/EmployeeDashboardPage.tsx lines 180-240) | Hardcoded "Ava Nguyen" (line 182) | GET /api/employee/profile - User info for header |



| Profile Setup (/components/employee/ProfileSetup.tsx) | Sample extraction data (lines 65-81) | POST /api/employee/profile/extract + PUT /api/employee/profile - Extract \& save profile |



| Dashboard Requests Table (/components/dashboards/EmployeeDashboardPage.tsx lines 127-170) | requests array (lines 127-170) | GET /api/employee/requests - List pay check requests |



| Latest Result Card (/components/dashboards/EmployeeDashboardPage.tsx lines 152-179) | latestResult object (lines 152-179) | Derived from requests list (first item) |



| Pay Check Wizard Step 1 (/components/employee/wizard-steps/MetaDetailsStep.tsx) | Form state only | No API (client-side form) |



| Pay Check Wizard Step 2 (/components/employee/wizard-steps/UploadDocumentsStep.tsx) | File state only | POST /api/upload/presigned-url - Get S3 presigned URLs for upload |



| Pay Check Wizard Step 3 (/components/employee/wizard-steps/ReviewExtractedStep.tsx) | Sample extracted data | POST /api/check/extract - Extract data from uploaded files |



| Pay Check Wizard Step 4 (/components/employee/wizard-steps/RunAgenticCheckStep.tsx) | Simulated agents | POST /api/check/submit + WebSocket /ws/check/{id}/progress - Submit \& stream progress |



| Pay Check Wizard Step 5 (/components/employee/wizard-steps/ResultsStep.tsx) | Sample results | Results from Step 4 WebSocket + GET /api/check/{id} - Full request data |



| Request Detail Page (/components/employee/RequestDetailPage.tsx) | requestDataMap object (lines 54-200+) | GET /api/check/{id} - Full request details |



| Award Chat Page (/components/employee/AwardChatPage.tsx) | Keyword-based responses (lines 71-150+) | POST /api/chat/message - RAG-powered chat |



| Document Upload Modal (/components/employee/DocumentUploadModal.tsx) | Simulated upload | POST /api/upload/presigned-url - Get S3 presigned URL |



| Quick Reference Card (/components/dashboards/EmployeeDashboardPage.tsx lines 421-494) | Hardcoded rates (lines 439-454) | GET /api/employee/profile - Rates from saved profile |



| Award Pack Card (/components/dashboards/EmployeeDashboardPage.tsx lines 364-419) | Hardcoded award info (lines 383-397) | GET /api/employee/profile - Award info from saved profile |





----------------------------------------------------------------------------

Step 1: Employee Sign Up

----------------------------------------------------------------------------



Step 1: Employee Sign Up

A. Goal

Replace simulated sign up in /components/auth/EmployeeSignUp.tsx with real AWS API Gateway + Lambda backend. Create new employee account with email/password, store in DynamoDB, return user ID.



B. Files to Modify/Create

Frontend:



Create: src/services/authApi.ts

Create: src/types/employee.ts (base types)

Modify: src/components/auth/EmployeeSignUp.tsx (line 68-72, replace setTimeout with API call)

Create: src/hooks/useAuth.ts (optional, for token management)

Backend (AWS):



Lambda: payroll-eip-employee-signup (Python 3.12)

API Gateway: Route POST /api/auth/employee/signup

DynamoDB Table: payroll-eip-employees

IAM Role: payroll-eip-employee-signup-role

CloudWatch Log Group: /aws/lambda/payroll-eip-employee-signup

C. API Design

Endpoint: POST /api/auth/employee/signup



Request:



{

&nbsp; "fullName": "John Smith",

&nbsp; "email": "john.smith@company.com",

&nbsp; "password": "SecurePass123!"

}





Response (Success - 201):



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "userId": "emp\_abc123xyz",

&nbsp;   "email": "john.smith@company.com",

&nbsp;   "fullName": "John Smith",

&nbsp;   "createdAt": "2025-01-15T10:30:00Z"

&nbsp; }

}

Response (Error - 400):



{

&nbsp; "success": false,

&nbsp; "error": {

&nbsp;   "code": "EMAIL\_EXISTS",

&nbsp;   "message": "An account with this email already exists"

&nbsp; }

}





Validation:



Email: Valid format, unique in database

Password: Minimum 8 characters

Full name: Non-empty string

Error codes: EMAIL\_EXISTS, INVALID\_EMAIL, WEAK\_PASSWORD, MISSING\_FIELD

Auth: None (public endpoint)



D. Amazon Q Prompt

Create an AWS Lambda function named payroll-eip-employee-signup using Python 3.12 runtime.



Requirements:

1\. Function name: payroll-eip-employee-signup

2\. Runtime: Python 3.12

3\. Handler: lambda\_function.lambda\_handler

4\. Create API Gateway HTTP API route: POST /api/auth/employee/signup

5\. Create DynamoDB table named payroll-eip-employees with:

&nbsp;  - Partition key: userId (String)

&nbsp;  - GSI: email-index (Partition key: email, String)

&nbsp;  - Enable point-in-time recovery

6\. Create IAM role payroll-eip-employee-signup-role with permissions:

&nbsp;  - dynamodb:PutItem on payroll-eip-employees table

&nbsp;  - dynamodb:Query on payroll-eip-employees table (for email-index GSI)

&nbsp;  - logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents

7\. CloudWatch log group: /aws/lambda/payroll-eip-employee-signup



Function logic:

\- Accept JSON request body: { fullName, email, password }

\- Validate: email format, password min 8 chars, fullName non-empty

\- Check if email exists using email-index GSI (return 400 if exists)

\- Hash password using bcrypt (cost factor 12)

\- Generate userId: "emp\_" + UUID4

\- Store in DynamoDB: { userId, email, fullName, passwordHash, createdAt (ISO string), updatedAt }

\- Return 201 with { success: true, data: { userId, email, fullName, createdAt } }

\- Return 400 for validation errors with error code and message

\- Log all requests/responses in structured JSON format

\- Handle exceptions: return 500 with generic error message





E. Frontend Integration Plan

1\. Create src/types/employee.ts:



export interface SignUpRequest {

&nbsp; fullName: string;

&nbsp; email: string;

&nbsp; password: string;

}



export interface SignUpResponse {

&nbsp; success: boolean;

&nbsp; data?: {

&nbsp;   userId: string;

&nbsp;   email: string;

&nbsp;   fullName: string;

&nbsp;   createdAt: string;

&nbsp; };

&nbsp; error?: {

&nbsp;   code: string;

&nbsp;   message: string;

&nbsp; };

}





2\. Create src/services/authApi.ts:



import type { SignUpRequest, SignUpResponse } from '../types/employee';



const API\_BASE\_URL = import.meta.env.VITE\_API\_BASE\_URL || 'https://your-api-id.execute-api.region.amazonaws.com';



export async function signUpEmployee(data: SignUpRequest): Promise<SignUpResponse> {

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/auth/employee/signup`, {

&nbsp;   method: 'POST',

&nbsp;   headers: { 'Content-Type': 'application/json' },

&nbsp;   body: JSON.stringify(data)

&nbsp; });

&nbsp; 

&nbsp; if (!response.ok) {

&nbsp;   const error = await response.json();

&nbsp;   throw new Error(error.error?.message || 'Sign up failed');

&nbsp; }

&nbsp; 

&nbsp; return response.json();

}





3\. Modify src/components/auth/EmployeeSignUp.tsx:



Import: import { signUpEmployee } from '../../services/authApi';

Replace lines 68-72 (setTimeout) with:

try {

&nbsp; const result = await signUpEmployee({ fullName, email, password });

&nbsp; if (result.success) {

&nbsp;   onSignUpSuccess();

&nbsp; }

} catch (error) {

&nbsp; setErrors({ submit: error.message });

} finally {

&nbsp; setIsLoading(false);

}

Add error state display for API errors

4\. Environment variable:



Create .env file: VITE\_API\_BASE\_URL=https://your-api-id.execute-api.region.amazonaws.com

F. Stop Point

Before proceeding, verify:



✅ User can sign up with valid email/password

✅ Duplicate email shows error message

✅ Invalid input shows validation errors

✅ User record created in DynamoDB

✅ No hardcoded credentials or secrets in code

G. Test Checklist

UI Tests:



\[ ] Submit valid form → redirects to login page

\[ ] Submit duplicate email → shows "Email already exists" error

\[ ] Submit invalid email → shows validation error

\[ ] Submit password < 8 chars → shows validation error

\[ ] Loading spinner shows during API call

\[ ] Network error shows user-friendly message

API Tests (curl/Postman):



\# Success

curl -X POST https://your-api-id.execute-api.region.amazonaws.com/api/auth/employee/signup \\

&nbsp; -H "Content-Type: application/json" \\

&nbsp; -d '{"fullName":"John Smith","email":"john@test.com","password":"SecurePass123!"}'



\# Duplicate email

curl -X POST ... (same email twice)



\# Invalid email

curl -X POST ... -d '{"fullName":"John","email":"invalid","password":"Pass123!"}'





Expected Outputs:



Success: 201 response with userId

Duplicate: 400 with EMAIL\_EXISTS code

Invalid: 400 with validation error code

H. Definition of Done

✅ Lambda function payroll-eip-employee-signup deployed and accessible

✅ API Gateway route POST /api/auth/employee/signup returns correct responses

✅ DynamoDB table payroll-eip-employees stores user records

✅ Frontend successfully creates accounts and handles errors

✅ CloudWatch logs show structured request/response logging

✅ No hardcoded secrets (API URL in environment variable)

---



----------------------------------------------------------------------------

Step 2: Login + Header User Info

----------------------------------------------------------------------------





Step 2: Login + Header User Info

A. Goal

Replace hardcoded demo credentials in /components/LoginForm.tsx with JWT-based authentication. After login, display real user info in dashboard header (/components/dashboards/EmployeeDashboardPage.tsx).



B. Files to Modify/Create

Frontend:



Modify: src/services/authApi.ts (add login function)

Modify: src/types/employee.ts (add login types)

Create: src/utils/tokenStorage.ts (JWT storage utility)

Modify: src/components/LoginForm.tsx (line 50-60, replace hardcoded check)

Modify: src/components/dashboards/EmployeeDashboardPage.tsx (line 182, replace hardcoded user name)

Create: src/hooks/useEmployeeProfile.ts (fetch user profile)

Backend (AWS):



Lambda: payroll-eip-employee-login (Python 3.12)

Lambda: payroll-eip-employee-profile (Python 3.12)

API Gateway: Route POST /api/auth/employee/login

API Gateway: Route GET /api/employee/profile (protected, requires JWT)

Secrets Manager: Secret payroll-eip-jwt-secret (JWT signing key)

IAM Role: payroll-eip-employee-login-role

IAM Role: payroll-eip-employee-profile-role

CloudWatch Log Groups: /aws/lambda/payroll-eip-employee-login, /aws/lambda/payroll-eip-employee-profile

C. API Design

Endpoint 1: POST /api/auth/employee/login



Request:



{

&nbsp; "email": "john.smith@company.com",

&nbsp; "password": "SecurePass123!"

}





Response (Success - 200):



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

&nbsp;   "expiresIn": 3600,

&nbsp;   "user": {

&nbsp;     "userId": "emp\_abc123xyz",

&nbsp;     "email": "john.smith@company.com",

&nbsp;     "fullName": "John Smith"

&nbsp;   }

&nbsp; }

}





Response (Error - 401):



{

&nbsp; "success": false,

&nbsp; "error": {

&nbsp;   "code": "INVALID\_CREDENTIALS",

&nbsp;   "message": "Invalid email or password"

&nbsp; }

}





Endpoint 2: GET /api/employee/profile



Headers:



Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...





Response (Success - 200):



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "userId": "emp\_abc123xyz",

&nbsp;   "email": "john.smith@company.com",

&nbsp;   "fullName": "John Smith",

&nbsp;   "organisationName": "BrightSteps Early Learning",

&nbsp;   "organisationType": "Childcare",

&nbsp;   "employmentType": "Casual",

&nbsp;   "roleTitle": "Educator",

&nbsp;   "state": "VIC",

&nbsp;   "createdAt": "2025-01-15T10:30:00Z"

&nbsp; }

}

Auth:



Login: None (public)

Profile: JWT required (Authorization header)

JWT Token:



Algorithm: HS256

Payload: { userId, email, fullName, exp, iat }

Expiration: 1 hour

Secret: Stored in AWS Secrets Manager

D. Amazon Q Prompt

Create two AWS Lambda functions using Python 3.12 runtime:



1\. Function: payroll-eip-employee-login

&nbsp;  - Handler: lambda\_function.lambda\_handler

&nbsp;  - API Gateway route: POST /api/auth/employee/login

&nbsp;  - IAM role: payroll-eip-employee-login-role

&nbsp;  - Permissions:

&nbsp;    \* dynamodb:Query on payroll-eip-employees table (email-index GSI)

&nbsp;    \* secretsmanager:GetSecretValue on payroll-eip-jwt-secret

&nbsp;    \* logs permissions

&nbsp;  - CloudWatch log group: /aws/lambda/payroll-eip-employee-login



2\. Function: payroll-eip-employee-profile

&nbsp;  - Handler: lambda\_function.lambda\_handler

&nbsp;  - API Gateway route: GET /api/employee/profile (requires JWT)

&nbsp;  - IAM role: payroll-eip-employee-profile-role

&nbsp;  - Permissions:

&nbsp;    \* dynamodb:GetItem on payroll-eip-employees table

&nbsp;    \* logs permissions

&nbsp;  - CloudWatch log group: /aws/lambda/payroll-eip-employee-profile



3\. Create AWS Secrets Manager secret:

&nbsp;  - Name: payroll-eip-jwt-secret

&nbsp;  - Value: Generate secure random string (32+ characters)

&nbsp;  - Description: JWT signing secret for employee authentication



Login function logic:

\- Accept JSON: { email, password }

\- Query DynamoDB email-index GSI for email

\- If not found: return 401 INVALID\_CREDENTIALS

\- Verify password with bcrypt (compare with passwordHash)

\- If invalid: return 401 INVALID\_CREDENTIALS

\- Retrieve JWT secret from Secrets Manager

\- Generate JWT token (HS256) with payload: { userId, email, fullName, exp: now+3600, iat: now }

\- Return 200 with { success: true, data: { token, expiresIn: 3600, user: { userId, email, fullName } } }

\- Log authentication attempts (without password)



Profile function logic:

\- Extract JWT from Authorization header (Bearer token)

\- Validate JWT signature using secret from Secrets Manager

\- Check expiration (exp claim)

\- Extract userId from token

\- GetItem from DynamoDB payroll-eip-employees table (partition key: userId)

\- Return 200 with user profile (exclude passwordHash)

\- Return 401 if token invalid/expired

\- Return 404 if user not found



Both functions:

\- Structured JSON logging

\- Error handling (500 for exceptions)

\- CORS headers if needed





E. Frontend Integration Plan

1\. Update src/types/employee.ts:



export interface LoginRequest {

&nbsp; email: string;

&nbsp; password: string;

}



export interface LoginResponse {

&nbsp; success: boolean;

&nbsp; data?: {

&nbsp;   token: string;

&nbsp;   expiresIn: number;

&nbsp;   user: {

&nbsp;     userId: string;

&nbsp;     email: string;

&nbsp;     fullName: string;

&nbsp;   };

&nbsp; };

&nbsp; error?: {

&nbsp;   code: string;

&nbsp;   message: string;

&nbsp; };

}



export interface EmployeeProfile {

&nbsp; userId: string;

&nbsp; email: string;

&nbsp; fullName: string;

&nbsp; organisationName?: string;

&nbsp; organisationType?: string;

&nbsp; employmentType?: string;

&nbsp; roleTitle?: string;

&nbsp; state?: string;

&nbsp; createdAt: string;

}





2\. Create src/utils/tokenStorage.ts:



const TOKEN\_KEY = 'payroll\_eip\_token';



export function saveToken(token: string): void {

&nbsp; localStorage.setItem(TOKEN\_KEY, token);

}



export function getToken(): string | null {

&nbsp; return localStorage.getItem(TOKEN\_KEY);

}



export function removeToken(): void {

&nbsp; localStorage.removeItem(TOKEN\_KEY);

}





3\. Update src/services/authApi.ts:



import { getToken } from '../utils/tokenStorage';

import type { EmployeeProfile } from '../types/employee';



export async function loginEmployee(email: string, password: string): Promise<LoginResponse> {

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/auth/employee/login`, {

&nbsp;   method: 'POST',

&nbsp;   headers: { 'Content-Type': 'application/json' },

&nbsp;   body: JSON.stringify({ email, password })

&nbsp; });

&nbsp; 

&nbsp; if (!response.ok) {

&nbsp;   const error = await response.json();

&nbsp;   throw new Error(error.error?.message || 'Login failed');

&nbsp; }

&nbsp; 

&nbsp; const result = await response.json();

&nbsp; if (result.success \&\& result.data?.token) {

&nbsp;   saveToken(result.data.token);

&nbsp; }

&nbsp; return result;

}



export async function getEmployeeProfile(): Promise<EmployeeProfile> {

&nbsp; const token = getToken();

&nbsp; if (!token) throw new Error('Not authenticated');

&nbsp; 

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/employee/profile`, {

&nbsp;   headers: {

&nbsp;     'Authorization': `Bearer ${token}`,

&nbsp;     'Content-Type': 'application/json'

&nbsp;   }

&nbsp; });

&nbsp; 

&nbsp; if (!response.ok) {

&nbsp;   if (response.status === 401) {

&nbsp;     removeToken();

&nbsp;     throw new Error('Session expired');

&nbsp;   }

&nbsp;   throw new Error('Failed to fetch profile');

&nbsp; }

&nbsp; 

&nbsp; const result = await response.json();

&nbsp; return result.data;

}





4\. Create src/hooks/useEmployeeProfile.ts:



import { useState, useEffect } from 'react';

import { getEmployeeProfile } from '../services/authApi';

import type { EmployeeProfile } from '../types/employee';



export function useEmployeeProfile() {

&nbsp; const \[profile, setProfile] = useState<EmployeeProfile | null>(null);

&nbsp; const \[loading, setLoading] = useState(true);

&nbsp; const \[error, setError] = useState<Error | null>(null);

&nbsp; 

&nbsp; useEffect(() => {

&nbsp;   getEmployeeProfile()

&nbsp;     .then(setProfile)

&nbsp;     .catch(setError)

&nbsp;     .finally(() => setLoading(false));

&nbsp; }, \[]);

&nbsp; 

&nbsp; return { profile, loading, error };

}





5\. Modify src/components/LoginForm.tsx:



Import: import { loginEmployee } from '../../services/authApi';

Replace lines 50-60 with:

try {

&nbsp; const result = await loginEmployee(username, password);

&nbsp; if (result.success) {

&nbsp;   onLogin();

&nbsp; }

} catch (error) {

&nbsp; setError(error.message);

}





6\. Modify src/components/dashboards/EmployeeDashboardPage.tsx:



Import: import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';

Replace hardcoded "Ava Nguyen" (line 182) with:

const { profile, loading: profileLoading } = useEmployeeProfile();

// In JSX: {profile?.fullName || 'Loading...'}





F. Stop Point

Before proceeding, verify:



✅ User can login with valid credentials

✅ Invalid credentials show error

✅ JWT token stored in localStorage

✅ Dashboard header shows real user name from API

✅ Token included in Authorization header for profile request

✅ Expired/invalid token handled gracefully

G. Test Checklist

UI Tests:



\[ ] Login with valid credentials → redirects to dashboard

\[ ] Login with invalid credentials → shows error

\[ ] Dashboard header displays user's full name from API

\[ ] Token persists after page refresh

\[ ] Logout clears token (if logout implemented)

API Tests:



\# Login

curl -X POST https://your-api-id.execute-api.region.amazonaws.com/api/auth/employee/login \\

&nbsp; -H "Content-Type: application/json" \\

&nbsp; -d '{"email":"john@test.com","password":"SecurePass123!"}'



\# Get Profile (use token from login response)

curl -X GET https://your-api-id.execute-api.region.amazonaws.com/api/employee/profile \\

&nbsp; -H "Authorization: Bearer YOUR\_TOKEN\_HERE"





Expected Outputs:



Login: 200 with JWT token and user info

Profile: 200 with full profile data

Invalid token: 401 Unauthorized

H. Definition of Done

✅ Lambda functions payroll-eip-employee-login and payroll-eip-employee-profile deployed

✅ JWT secret stored in AWS Secrets Manager

✅ Login returns valid JWT token

✅ Profile endpoint validates JWT and returns user data

✅ Frontend stores token and uses it for authenticated requests

✅ Dashboard header displays real user name



---

----------------------------------------------------------------------------

Step 3: Complete Profile ("Extract Information" → "Save Profile")

----------------------------------------------------------------------------



Step 3: Complete Profile ("Extract Information" → "Save Profile")

A. Goal

Replace sample extraction data in /components/employee/ProfileSetup.tsx with real backend. Implement two-phase flow: (1) Extract information from uploaded contract, (2) Save profile to database.



B. Files to Modify/Create

Frontend:



Modify: src/services/authApi.ts (add profile extraction and save functions)

Modify: src/types/employee.ts (add ProfileData, ExtractionRequest types)

Modify: src/components/employee/ProfileSetup.tsx (lines 89-98 extract, lines 100+ save)

Create: src/services/uploadApi.ts (S3 presigned URL generation)

Backend (AWS):



Lambda: payroll-eip-profile-extract (Python 3.12)

Lambda: payroll-eip-profile-save (Python 3.12)

API Gateway: Route POST /api/employee/profile/extract

API Gateway: Route PUT /api/employee/profile

API Gateway: Route POST /api/upload/presigned-url

S3 Bucket: payroll-eip-documents

IAM Roles: payroll-eip-profile-extract-role, payroll-eip-profile-save-role, payroll-eip-upload-role

DynamoDB: Update payroll-eip-employees table (add profile fields)

CloudWatch Log Groups: /aws/lambda/payroll-eip-profile-extract, /aws/lambda/payroll-eip-profile-save

C. API Design

Endpoint 1: POST /api/upload/presigned-url



Headers: Authorization: Bearer {token}



Request:



{

&nbsp; "fileName": "contract.pdf",

&nbsp; "fileType": "application/pdf",

&nbsp; "purpose": "profile-contract"

}





Response:



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "uploadUrl": "https://payroll-eip-documents.s3.amazonaws.com/...",

&nbsp;   "fileKey": "profile-contracts/emp\_abc123/contract\_xyz.pdf",

&nbsp;   "expiresIn": 300

&nbsp; }

}





Endpoint 2: POST /api/employee/profile/extract



Headers: Authorization: Bearer {token}



Request:



{

&nbsp; "contractFileKey": "profile-contracts/emp\_abc123/contract\_xyz.pdf",

&nbsp; "organisationType": "Childcare",

&nbsp; "organisationName": "BrightSteps Early Learning",

&nbsp; "state": "VIC"

}





Response:



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "employmentType": "Casual",

&nbsp;   "roleTitle": "Educator",

&nbsp;   "classificationLevel": "Level 3",

&nbsp;   "awardName": "Children's Services Award 2010",

&nbsp;   "awardCode": "MA000120",

&nbsp;   "baseRate": 28.00,

&nbsp;   "casualLoading": 25,

&nbsp;   "eveningRate": 34.00,

&nbsp;   "saturdayRate": 42.00,

&nbsp;   "sundayRate": 56.00,

&nbsp;   "publicHolidayRate": 70.00,

&nbsp;   "minimumShift": 2,

&nbsp;   "paidBreak": "10 min (4+ hrs)",

&nbsp;   "mealAllowance": 15.20,

&nbsp;   "splitShiftAllowance": 18.50,

&nbsp;   "confidence": 0.92

&nbsp; }

}





Endpoint 3: PUT /api/employee/profile



Headers: Authorization: Bearer {token}



Request:



{

&nbsp; "organisationType": "Childcare",

&nbsp; "organisationName": "BrightSteps Early Learning",

&nbsp; "placeOfWork": "BrightSteps Richmond",

&nbsp; "workAddress": "123 Collins Street, Melbourne",

&nbsp; "state": "VIC",

&nbsp; "contractFileKey": "profile-contracts/emp\_abc123/contract\_xyz.pdf",

&nbsp; "extracted": {

&nbsp;   "employmentType": "Casual",

&nbsp;   "roleTitle": "Educator",

&nbsp;   "classificationLevel": "Level 3",

&nbsp;   "awardName": "Children's Services Award 2010",

&nbsp;   "awardCode": "MA000120",

&nbsp;   "baseRate": 28.00,

&nbsp;   "casualLoading": 25,

&nbsp;   "eveningRate": 34.00,

&nbsp;   "saturdayRate": 42.00,

&nbsp;   "sundayRate": 56.00,

&nbsp;   "publicHolidayRate": 70.00,

&nbsp;   "minimumShift": 2,

&nbsp;   "paidBreak": "10 min (4+ hrs)",

&nbsp;   "mealAllowance": 15.20,

&nbsp;   "splitShiftAllowance": 18.50

&nbsp; }

}





Response:



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "userId": "emp\_abc123",

&nbsp;   "updatedAt": "2025-01-15T11:00:00Z"

&nbsp; }

}





Auth: All endpoints require JWT



D. Amazon Q Prompt

Create three AWS Lambda functions using Python 3.12:



1\. Function: payroll-eip-upload (presigned URL generation)

&nbsp;  - Handler: lambda\_function.lambda\_handler

&nbsp;  - API Gateway: POST /api/upload/presigned-url

&nbsp;  - IAM role: payroll-eip-upload-role

&nbsp;  - Permissions:

&nbsp;    \* s3:PutObject on payroll-eip-documents bucket

&nbsp;    \* logs permissions

&nbsp;  - CloudWatch: /aws/lambda/payroll-eip-upload



2\. Function: payroll-eip-profile-extract (document extraction)

&nbsp;  - Handler: lambda\_function.lambda\_handler

&nbsp;  - API Gateway: POST /api/employee/profile/extract

&nbsp;  - IAM role: payroll-eip-profile-extract-role

&nbsp;  - Permissions:

&nbsp;    \* s3:GetObject on payroll-eip-documents bucket

&nbsp;    \* dynamodb:GetItem on payroll-eip-employees (for user context)

&nbsp;    \* logs permissions

&nbsp;  - CloudWatch: /aws/lambda/payroll-eip-profile-extract

&nbsp;  - Runtime: 60 seconds (extraction may take time)

&nbsp;  - Memory: 1024 MB (for document processing)



3\. Function: payroll-eip-profile-save

&nbsp;  - Handler: lambda\_function.lambda\_handler

&nbsp;  - API Gateway: PUT /api/employee/profile

&nbsp;  - IAM role: payroll-eip-profile-save-role

&nbsp;  - Permissions:

&nbsp;    \* dynamodb:UpdateItem on payroll-eip-employees table

&nbsp;    \* logs permissions

&nbsp;  - CloudWatch: /aws/lambda/payroll-eip-profile-save



4\. Create S3 bucket:

&nbsp;  - Name: payroll-eip-documents

&nbsp;  - Versioning: Enabled

&nbsp;  - Encryption: AES256

&nbsp;  - CORS: Allow PUT from frontend domain

&nbsp;  - Lifecycle: Move to Glacier after 90 days (optional)



5\. Update DynamoDB table payroll-eip-employees:

&nbsp;  - Add attributes: organisationType, organisationName, placeOfWork, workAddress, state, contractFileKey, extracted (map), profileCompleted (boolean), updatedAt



Presigned URL function:

\- Extract JWT, get userId

\- Validate fileType (pdf, docx, doc only)

\- Generate S3 key: profile-contracts/{userId}/{timestamp}\_{fileName}

\- Generate presigned PUT URL (expires 5 minutes)

\- Return uploadUrl, fileKey, expiresIn



Extract function:

\- Extract JWT, get userId

\- Validate user exists

\- Get contract file from S3 using contractFileKey

\- Run AI extraction (use document parsing library or external service)

\- Extract: employmentType, roleTitle, classificationLevel, awardName, awardCode, rates, entitlements

\- Return structured extraction data with confidence score

\- Handle extraction errors gracefully



Save function:

\- Extract JWT, get userId

\- Update DynamoDB payroll-eip-employees:

&nbsp; - SET organisationType, organisationName, placeOfWork, workAddress, state, contractFileKey

&nbsp; - SET extracted = {employmentType, roleTitle, ...} (map type)

&nbsp; - SET profileCompleted = true, updatedAt = current timestamp

\- Return success with updatedAt



All functions:

\- JWT validation (reuse from Step 2)

\- Structured logging

\- Error handling (400 for validation, 500 for exceptions)

\- CORS headers





E. Frontend Integration Plan

1\. Create src/services/uploadApi.ts:



import { getToken } from '../utils/tokenStorage';



export interface PresignedUrlRequest {

&nbsp; fileName: string;

&nbsp; fileType: string;

&nbsp; purpose: string;

}



export interface PresignedUrlResponse {

&nbsp; success: boolean;

&nbsp; data?: {

&nbsp;   uploadUrl: string;

&nbsp;   fileKey: string;

&nbsp;   expiresIn: number;

&nbsp; };

}



export async function getPresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {

&nbsp; const token = getToken();

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/upload/presigned-url`, {

&nbsp;   method: 'POST',

&nbsp;   headers: {

&nbsp;     'Authorization': `Bearer ${token}`,

&nbsp;     'Content-Type': 'application/json'

&nbsp;   },

&nbsp;   body: JSON.stringify(request)

&nbsp; });

&nbsp; return response.json();

}



export async function uploadToS3(file: File, uploadUrl: string): Promise<void> {

&nbsp; await fetch(uploadUrl, {

&nbsp;   method: 'PUT',

&nbsp;   body: file,

&nbsp;   headers: {

&nbsp;     'Content-Type': file.type

&nbsp;   }

&nbsp; });

}





2\. Update src/services/authApi.ts:



export async function extractProfileData(request: {

&nbsp; contractFileKey: string;

&nbsp; organisationType: string;

&nbsp; organisationName: string;

&nbsp; state: string;

}): Promise<any> {

&nbsp; const token = getToken();

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/employee/profile/extract`, {

&nbsp;   method: 'POST',

&nbsp;   headers: {

&nbsp;     'Authorization': `Bearer ${token}`,

&nbsp;     'Content-Type': 'application/json'

&nbsp;   },

&nbsp;   body: JSON.stringify(request)

&nbsp; });

&nbsp; return response.json();

}



export async function saveProfile(profileData: any): Promise<any> {

&nbsp; const token = getToken();

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/employee/profile`, {

&nbsp;   method: 'PUT',

&nbsp;   headers: {

&nbsp;     'Authorization': `Bearer ${token}`,

&nbsp;     'Content-Type': 'application/json'

&nbsp;   },

&nbsp;   body: JSON.stringify(profileData)

&nbsp; });

&nbsp; return response.json();

}





3\. Modify src/components/employee/ProfileSetup.tsx:



Replace handleExtract (lines 89-98):

const handleExtract = async () => {

&nbsp; if (!contractFile) return;

&nbsp; 

&nbsp; setIsExtracting(true);

&nbsp; try {

&nbsp;   // Get presigned URL and upload

&nbsp;   const presignedResponse = await getPresignedUrl({

&nbsp;     fileName: contractFile.name,

&nbsp;     fileType: contractFile.type,

&nbsp;     purpose: 'profile-contract'

&nbsp;   });

&nbsp;   

&nbsp;   await uploadToS3(contractFile, presignedResponse.data.uploadUrl);

&nbsp;   

&nbsp;   // Extract data

&nbsp;   const extractResponse = await extractProfileData({

&nbsp;     contractFileKey: presignedResponse.data.fileKey,

&nbsp;     organisationType,

&nbsp;     organisationName,

&nbsp;     state: workState

&nbsp;   });

&nbsp;   

&nbsp;   if (extractResponse.success) {

&nbsp;     setExtractedData(extractResponse.data);

&nbsp;     setStep('review');

&nbsp;   }

&nbsp; } catch (error) {

&nbsp;   // Handle error

&nbsp; } finally {

&nbsp;   setIsExtracting(false);

&nbsp; }

};





Replace handleSave (lines 100+):

const handleSave = async () => {

&nbsp; try {

&nbsp;   const result = await saveProfile({

&nbsp;     organisationType,

&nbsp;     organisationName,

&nbsp;     placeOfWork,

&nbsp;     workAddress,

&nbsp;     state: workState,

&nbsp;     contractFileKey: /\* from upload \*/,

&nbsp;     extracted: extractedData

&nbsp;   });

&nbsp;   

&nbsp;   if (result.success) {

&nbsp;     onComplete({ /\* profile data \*/ });

&nbsp;   }

&nbsp; } catch (error) {

&nbsp;   // Handle error

&nbsp; }

};





F. Stop Point

Before proceeding, verify:



✅ User can upload contract file to S3

✅ Extraction API returns structured data

✅ Profile data saves to DynamoDB

✅ Profile completion status updated

✅ Loading states show during upload/extraction

G. Test Checklist

UI Tests:



\[ ] Upload contract file → file uploads to S3

\[ ] Click "Extract Information" → shows loading, then extracted data

\[ ] Edit extracted data → changes saved

\[ ] Click "Save Profile" → profile saved, returns to dashboard

\[ ] Profile data persists after refresh

API Tests:



\# Get presigned URL

curl -X POST https://your-api-id.execute-api.region.amazonaws.com/api/upload/presigned-url \\

&nbsp; -H "Authorization: Bearer TOKEN" \\

&nbsp; -H "Content-Type: application/json" \\

&nbsp; -d '{"fileName":"contract.pdf","fileType":"application/pdf","purpose":"profile-contract"}'



\# Upload to S3 (use uploadUrl from response)

curl -X PUT "UPLOAD\_URL" \\

&nbsp; --upload-file contract.pdf \\

&nbsp; -H "Content-Type: application/pdf"



\# Extract

curl -X POST https://your-api-id.execute-api.region.amazonaws.com/api/employee/profile/extract \\

&nbsp; -H "Authorization: Bearer TOKEN" \\

&nbsp; -H "Content-Type: application/json" \\

&nbsp; -d '{"contractFileKey":"...","organisationType":"Childcare","organisationName":"Test","state":"VIC"}'



\# Save

curl -X PUT https://your-api-id.execute-api.region.amazonaws.com/api/employee/profile \\

&nbsp; -H "Authorization: Bearer TOKEN" \\

&nbsp; -H "Content-Type: application/json" \\

&nbsp; -d '{...profile data...}'





H. Definition of Done

✅ S3 bucket payroll-eip-documents created with proper permissions

✅ Presigned URL generation works

✅ File uploads to S3 successfully

✅ Extraction API returns structured data

✅ Profile save updates DynamoDB

✅ Frontend completes full profile setup flow

---



----------------------------------------------------------------------------

Step 4: New Pay Check Request Wizard

----------------------------------------------------------------------------





Step 4: New Pay Check Request Wizard

A. Goal

Replace sample data in Pay Check Wizard steps with real backend. Implement: Step 2 (Upload Documents), Step 3 (Review Extracted), Step 4 (Run Agentic Check), Step 5 (Results).



B. Files to Modify/Create

Frontend:



Create: src/services/checkApi.ts

Modify: src/types/employee.ts (add CheckRequest, WizardData types)

Modify: src/components/employee/wizard-steps/UploadDocumentsStep.tsx

Modify: src/components/employee/wizard-steps/ReviewExtractedStep.tsx

Modify: src/components/employee/wizard-steps/RunAgenticCheckStep.tsx

Modify: src/components/employee/wizard-steps/ResultsStep.tsx

Create: src/hooks/useCheckRequest.ts

Backend (AWS):



Lambda: payroll-eip-check-submit (Python 3.12)

Lambda: payroll-eip-check-extract (Python 3.12)

Lambda: payroll-eip-check-start (Python 3.12)

API Gateway: POST /api/check/submit, POST /api/check/extract, POST /api/check/start

API Gateway WebSocket: /ws/check/{id}/progress

DynamoDB Table: payroll-eip-check-requests

S3: Use existing payroll-eip-documents bucket

Step Functions (optional): payroll-eip-check-orchestrator

IAM Roles: payroll-eip-check-submit-role, payroll-eip-check-extract-role, payroll-eip-check-start-role

CloudWatch Log Groups: /aws/lambda/payroll-eip-check-\*

C. API Design

Endpoint 1: POST /api/check/submit



Headers: Authorization: Bearer {token}Request:



{

&nbsp; "organisationType": "Childcare",

&nbsp; "organisationName": "BrightSteps Early Learning",

&nbsp; "employmentType": "Casual",

&nbsp; "roleTitle": "Educator",

&nbsp; "classificationLevel": "Level 3",

&nbsp; "payPeriodStart": "2025-08-01",

&nbsp; "payPeriodEnd": "2025-08-14",

&nbsp; "state": "VIC",

&nbsp; "hasPublicHoliday": false,

&nbsp; "contractFileKey": "check-requests/emp\_abc/contract\_xyz.pdf",

&nbsp; "worksheetFileKey": "check-requests/emp\_abc/worksheet\_xyz.pdf",

&nbsp; "payslipFileKey": "check-requests/emp\_abc/payslip\_xyz.pdf"

}





Response:



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "requestId": "REQ-2025-003",

&nbsp;   "status": "draft",

&nbsp;   "createdAt": "2025-01-15T12:00:00Z"

&nbsp; }

}





Endpoint 2: POST /api/check/extract



Headers: Authorization: Bearer {token}



Request:



{

&nbsp; "requestId": "REQ-2025-003"

}





Response:



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "extractedData": {

&nbsp;     "contract": { "baseRate": 28.50, ... },

&nbsp;     "worksheet": { "totalHours": 18.5, ... },

&nbsp;     "payslip": { "totalGross": 540.00, ... }

&nbsp;   },

&nbsp;   "extractionStatus": "completed"

&nbsp; }

}





Endpoint 3: POST /api/check/start



Headers: Authorization: Bearer {token}



Request:



{

&nbsp; "requestId": "REQ-2025-003",

&nbsp; "extractedData": { /\* confirmed extracted data \*/ }

}





Response:



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "requestId": "REQ-2025-003",

&nbsp;   "websocketUrl": "wss://api-id.execute-api.region.amazonaws.com/ws/check/REQ-2025-003/progress",

&nbsp;   "status": "processing"

&nbsp; }

}





WebSocket: wss://api-id.execute-api.region.amazonaws.com/ws/check/{requestId}/progress



Messages (from server):



{

&nbsp; "type": "agent\_update",

&nbsp; "agentId": "award\_agent",

&nbsp; "agentName": "Award Agent",

&nbsp; "status": "running",

&nbsp; "progress": 50,

&nbsp; "message": "Identifying award..."

}



{

&nbsp; "type": "agent\_complete",

&nbsp; "agentId": "award\_agent",

&nbsp; "duration": 2.3

}



{

&nbsp; "type": "complete",

&nbsp; "requestId": "REQ-2025-003",

&nbsp; "results": { /\* full CheckRequest object \*/ }

}





D. Amazon Q Prompt

Create AWS Lambda functions for pay check request processing:



1\. Function: payroll-eip-check-submit

&nbsp;  - Handler: lambda\_function.lambda\_handler

&nbsp;  - API Gateway: POST /api/check/submit

&nbsp;  - IAM role: payroll-eip-check-submit-role

&nbsp;  - Permissions: dynamodb:PutItem on payroll-eip-check-requests, logs

&nbsp;  - CloudWatch: /aws/lambda/payroll-eip-check-submit



2\. Function: payroll-eip-check-extract

&nbsp;  - Handler: lambda\_function.lambda\_handler

&nbsp;  - API Gateway: POST /api/check/extract

&nbsp;  - IAM role: payroll-eip-check-extract-role

&nbsp;  - Permissions: s3:GetObject, dynamodb:GetItem/UpdateItem, logs

&nbsp;  - CloudWatch: /aws/lambda/payroll-eip-check-extract

&nbsp;  - Timeout: 60 seconds, Memory: 1024 MB



3\. Function: payroll-eip-check-start

&nbsp;  - Handler: lambda\_function.lambda\_handler

&nbsp;  - API Gateway: POST /api/check/start

&nbsp;  - IAM role: payroll-eip-check-start-role

&nbsp;  - Permissions: dynamodb:UpdateItem, logs, invoke Step Functions (if used)

&nbsp;  - CloudWatch: /aws/lambda/payroll-eip-check-start



4\. Create DynamoDB table: payroll-eip-check-requests

&nbsp;  - Partition key: requestId (String)

&nbsp;  - GSI: employeeId-index (Partition key: employeeId)

&nbsp;  - Attributes: employeeId, status, severity, paidAmount, entitledAmount, difference, extractedData (map), results (map), createdAt, updatedAt



5\. API Gateway WebSocket API: payroll-eip-websocket-api

&nbsp;  - Route: $connect, $disconnect, $default

&nbsp;  - Lambda integration for $default: payroll-eip-check-progress (new function)

&nbsp;  - CloudWatch: /aws/lambda/payroll-eip-check-progress



Submit function:

\- Extract JWT, get userId

\- Generate requestId: "REQ-" + YYYY + "-" + sequential number

\- PutItem to DynamoDB: { requestId, employeeId, status: "draft", ...metadata, createdAt }

\- Return requestId



Extract function:

\- Extract JWT, get userId

\- GetItem from DynamoDB (requestId)

\- Verify ownership (employeeId matches)

\- Get files from S3 (contractFileKey, worksheetFileKey, payslipFileKey)

\- Run extraction (document parsing)

\- UpdateItem: SET extractedData, status = "extracted"

\- Return extractedData



Start function:

\- Extract JWT, get userId

\- GetItem from DynamoDB

\- Verify ownership and status = "extracted"

\- UpdateItem: SET status = "processing", confirmedExtractedData

\- Initiate processing (Step Functions or direct Lambda invocation)

\- Return websocketUrl



WebSocket function:

\- Handle connection: Store connectionId in DynamoDB (payroll-eip-websocket-connections)

\- Handle disconnection: Remove connectionId

\- Handle messages: Route agent updates to connected clients

\- Send agent status updates as they complete

\- Send final results when all agents complete



All functions:

\- JWT validation

\- Structured logging

\- Error handling

\- CORS headers





E. Frontend Integration Plan

1\. Create src/services/checkApi.ts:



import { getToken } from '../utils/tokenStorage';



export async function submitCheckRequest(data: any): Promise<{ requestId: string }> {

&nbsp; const token = getToken();

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/check/submit`, {

&nbsp;   method: 'POST',

&nbsp;   headers: {

&nbsp;     'Authorization': `Bearer ${token}`,

&nbsp;     'Content-Type': 'application/json'

&nbsp;   },

&nbsp;   body: JSON.stringify(data)

&nbsp; });

&nbsp; return response.json();

}



export async function extractCheckData(requestId: string): Promise<any> {

&nbsp; const token = getToken();

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/check/extract`, {

&nbsp;   method: 'POST',

&nbsp;   headers: {

&nbsp;     'Authorization': `Bearer ${token}`,

&nbsp;     'Content-Type': 'application/json'

&nbsp;   },

&nbsp;   body: JSON.stringify({ requestId })

&nbsp; });

&nbsp; return response.json();

}



export async function startCheckProcessing(requestId: string, extractedData: any): Promise<{ websocketUrl: string }> {

&nbsp; const token = getToken();

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/check/start`, {

&nbsp;   method: 'POST',

&nbsp;   headers: {

&nbsp;     'Authorization': `Bearer ${token}`,

&nbsp;     'Content-Type': 'application/json'

&nbsp;   },

&nbsp;   body: JSON.stringify({ requestId, extractedData })

&nbsp; });

&nbsp; return response.json();

}





2\. Modify wizard steps:



UploadDocumentsStep.tsx: Upload files using presigned URLs, store fileKeys in wizard state

ReviewExtractedStep.tsx: Call extractCheckData, display extracted data, allow editing

RunAgenticCheckStep.tsx: Call startCheckProcessing, connect to WebSocket, update agent status in real-time

ResultsStep.tsx: Display results from WebSocket or fetch from API

F. Stop Point

Before proceeding, verify:



✅ All 3 documents upload to S3

✅ Request created in DynamoDB

✅ Extraction returns structured data

✅ WebSocket connects and receives updates

✅ All 10 agents show progress

✅ Final results displayed in Step 5

G. Test Checklist

UI Tests:



\[ ] Complete wizard Step 1 → Step 2

\[ ] Upload 3 files → files upload to S3

\[ ] Step 3 shows extracted data

\[ ] Step 4 connects to WebSocket, shows agent progress

\[ ] Step 5 displays final results

\[ ] Request appears in dashboard table

API Tests:



\# Submit

curl -X POST https://your-api-id.execute-api.region.amazonaws.com/api/check/submit \\

&nbsp; -H "Authorization: Bearer TOKEN" \\

&nbsp; -d '{...wizard data...}'



\# Extract

curl -X POST https://your-api-id.execute-api.region.amazonaws.com/api/check/extract \\

&nbsp; -H "Authorization: Bearer TOKEN" \\

&nbsp; -d '{"requestId":"REQ-2025-003"}'



\# Start (test WebSocket separately)

curl -X POST https://your-api-id.execute-api.region.amazonaws.com/api/check/start \\

&nbsp; -H "Authorization: Bearer TOKEN" \\

&nbsp; -d '{"requestId":"REQ-2025-003","extractedData":{...}}'





H. Definition of Done

✅ All wizard steps integrated with backend

✅ Files upload to S3

✅ Extraction API works

✅ WebSocket delivers real-time updates

✅ Request saved to DynamoDB

✅ Results displayed correctly

---



----------------------------------------------------------------------------

Step 5: Chat with Award Assistant

----------------------------------------------------------------------------





Step 5: Chat with Award Assistant

A. Goal

Replace keyword-based responses in /components/employee/AwardChatPage.tsx with real RAG-powered chat API.



B. Files to Modify/Create

Frontend:



Create: src/services/chatApi.ts

Modify: src/types/employee.ts (add ChatMessage, ChatRequest types)

Modify: src/components/employee/AwardChatPage.tsx (lines 61-150, replace getAIResponse)

Backend (AWS):



Lambda: payroll-eip-chat-message (Python 3.12)

API Gateway: POST /api/chat/message

DynamoDB Table: payroll-eip-chat-conversations (optional, for history)

Bedrock/OpenAI Integration (for LLM)

Vector Database (optional, for RAG)

IAM Role: payroll-eip-chat-message-role

CloudWatch: /aws/lambda/payroll-eip-chat-message

C. API Design

Endpoint: POST /api/chat/message



Headers: Authorization: Bearer {token}Request:



{

&nbsp; "message": "What are my entitlements for evening shifts?",

&nbsp; "conversationId": "conv\_abc123",

&nbsp; "context": {

&nbsp;   "useContract": true,

&nbsp;   "contractFileId": "file\_xyz",

&nbsp;   "award": "Children's Services Award 2010",

&nbsp;   "employmentType": "Casual"

&nbsp; }

}





Response:



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "response": "Based on your contract and the Children's Services Award...",

&nbsp;   "citations": \[

&nbsp;     {

&nbsp;       "text": "Evening penalty window",

&nbsp;       "reference": "Award p.12, Clause 25.3"

&nbsp;     }

&nbsp;   ],

&nbsp;   "confidence": 0.92,

&nbsp;   "conversationId": "conv\_abc123"

&nbsp; }

}





D. Amazon Q Prompt

Create AWS Lambda function for RAG-powered chat:



Function: payroll-eip-chat-message

\- Handler: lambda\_function.lambda\_handler

\- API Gateway: POST /api/chat/message

\- IAM role: payroll-eip-chat-message-role

\- Permissions:

&nbsp; \* bedrock:InvokeModel (or appropriate LLM service)

&nbsp; \* s3:GetObject (for contract context)

&nbsp; \* dynamodb:PutItem/GetItem on payroll-eip-chat-conversations (optional)

&nbsp; \* logs permissions

\- CloudWatch: /aws/lambda/payroll-eip-chat-message

\- Timeout: 30 seconds

\- Memory: 512 MB



Optional: Create DynamoDB table payroll-eip-chat-conversations

\- Partition key: conversationId

\- GSI: employeeId-index



Function logic:

\- Extract JWT, get userId

\- Validate message (non-empty, max length)

\- If conversationId provided, retrieve conversation history

\- If useContract=true, get contract file from S3

\- Build prompt with:

&nbsp; \* User message

&nbsp; \* Contract context (if available)

&nbsp; \* Award context

&nbsp; \* Employment details

\- Call LLM (Bedrock/OpenAI) with prompt

\- Extract citations from response

\- Store conversation in DynamoDB (optional)

\- Return response with citations and confidence



Error handling:

\- 400: Invalid message

\- 401: Invalid token

\- 500: LLM service error





E. Frontend Integration Plan

1\. Create src/services/chatApi.ts:



export async function sendChatMessage(request: {

&nbsp; message: string;

&nbsp; conversationId?: string;

&nbsp; context?: any;

}): Promise<any> {

&nbsp; const token = getToken();

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/chat/message`, {

&nbsp;   method: 'POST',

&nbsp;   headers: {

&nbsp;     'Authorization': `Bearer ${token}`,

&nbsp;     'Content-Type': 'application/json'

&nbsp;   },

&nbsp;   body: JSON.stringify(request)

&nbsp; });

&nbsp; return response.json();

}





2\. Modify src/components/employee/AwardChatPage.tsx:



Replace getAIResponse function (lines 71-150+) with API call

Update handleSendMessage to call sendChatMessage

Display citations from API response

Store conversationId for follow-up messages

F. Stop Point

Before proceeding, verify:



✅ Chat messages sent to API

✅ Responses include citations

✅ Contract context used when enabled

✅ Conversation history maintained (if implemented)

G. Test Checklist

UI Tests:



\[ ] Send message → receives AI response

\[ ] Citations displayed below response

\[ ] Contract context checkbox works

\[ ] Multiple messages in conversation

\[ ] Error handling for API failures

API Tests:



curl -X POST https://your-api-id.execute-api.region.amazonaws.com/api/chat/message \\

&nbsp; -H "Authorization: Bearer TOKEN" \\

&nbsp; -H "Content-Type: application/json" \\

&nbsp; -d '{"message":"What are evening penalty rates?","context":{"useContract":true}}'





H. Definition of Done

✅ Chat API integrated

✅ Responses include citations

✅ Contract context works

✅ Error handling implemented

---



----------------------------------------------------------------------------

Step 6: Request History List + View Record

----------------------------------------------------------------------------



Step 6: Request History List + View Record

A. Goal

Replace sample data in dashboard requests table and RequestDetailPage with real API data.



B. Files to Modify/Create

Frontend:



Update: src/services/checkApi.ts (add list and get functions)

Create: src/hooks/useCheckRequests.ts

Modify: src/components/dashboards/EmployeeDashboardPage.tsx (lines 127-170, replace requests array)

Modify: src/components/employee/RequestDetailPage.tsx (lines 54-200+, replace requestDataMap)

Backend (AWS):



Lambda: payroll-eip-check-list (Python 3.12)

Lambda: payroll-eip-check-get (Python 3.12)

API Gateway: GET /api/employee/requests

API Gateway: GET /api/check/{id}

Use existing DynamoDB table: payroll-eip-check-requests

IAM Roles: payroll-eip-check-list-role, payroll-eip-check-get-role

CloudWatch: /aws/lambda/payroll-eip-check-list, /aws/lambda/payroll-eip-check-get

C. API Design

Endpoint 1: GET /api/employee/requests



Headers: Authorization: Bearer {token}



Query Parameters: ?limit=10\&offset=0



Response:



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "requests": \[

&nbsp;     {

&nbsp;       "requestId": "REQ-2025-003",

&nbsp;       "payPeriod": "01–14 Aug 2025",

&nbsp;       "status": "completed",

&nbsp;       "severity": "underpaid",

&nbsp;       "underpayment": -72,

&nbsp;       "submittedDate": "2025-08-15T10:00:00Z"

&nbsp;     }

&nbsp;   ],

&nbsp;   "total": 3,

&nbsp;   "limit": 10,

&nbsp;   "offset": 0

&nbsp; }

}





Endpoint 2: GET /api/check/{requestId}



Headers: Authorization: Bearer {token}



Response:



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "requestId": "REQ-2025-003",

&nbsp;   "status": "completed",

&nbsp;   "severity": "underpaid",

&nbsp;   "paidAmount": 540.00,

&nbsp;   "entitledAmount": 612.00,

&nbsp;   "difference": -72.00,

&nbsp;   "calculationBreakdown": \[...],

&nbsp;   "evidence": \[...],

&nbsp;   "timeline": \[...],

&nbsp;   "submittedDate": "2025-08-15T10:00:00Z"

&nbsp; }

}





D. Amazon Q Prompt

Create two AWS Lambda functions:



1\. Function: payroll-eip-check-list

&nbsp;  - Handler: lambda\_function.lambda\_handler

&nbsp;  - API Gateway: GET /api/employee/requests

&nbsp;  - IAM role: payroll-eip-check-list-role

&nbsp;  - Permissions: dynamodb:Query on payroll-eip-check-requests (employeeId-index), logs

&nbsp;  - CloudWatch: /aws/lambda/payroll-eip-check-list



2\. Function: payroll-eip-check-get

&nbsp;  - Handler: lambda\_function.lambda\_handler

&nbsp;  - API Gateway: GET /api/check/{requestId}

&nbsp;  - IAM role: payroll-eip-check-get-role

&nbsp;  - Permissions: dynamodb:GetItem on payroll-eip-check-requests, logs

&nbsp;  - CloudWatch: /aws/lambda/payroll-eip-check-get



List function:

\- Extract JWT, get userId

\- Query DynamoDB employeeId-index GSI (partition key: userId)

\- Sort by createdAt DESC

\- Apply limit/offset pagination

\- Return summary fields only (requestId, payPeriod, status, severity, underpayment, submittedDate)

\- Return total count



Get function:

\- Extract JWT, get userId

\- GetItem from DynamoDB (requestId)

\- Verify ownership (employeeId matches)

\- Return full request object (all fields)

\- Return 404 if not found or unauthorized



Both functions:

\- JWT validation

\- Structured logging

\- Error handling

\- CORS headers





E. Frontend Integration Plan

1\. Update src/services/checkApi.ts:



export async function getMyRequests(limit = 10, offset = 0): Promise<any> {

&nbsp; const token = getToken();

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/employee/requests?limit=${limit}\&offset=${offset}`, {

&nbsp;   headers: {

&nbsp;     'Authorization': `Bearer ${token}`

&nbsp;   }

&nbsp; });

&nbsp; return response.json();

}



export async function getCheckRequest(requestId: string): Promise<any> {

&nbsp; const token = getToken();

&nbsp; const response = await fetch(`${API\_BASE\_URL}/api/check/${requestId}`, {

&nbsp;   headers: {

&nbsp;     'Authorization': `Bearer ${token}`

&nbsp;   }

&nbsp; });

&nbsp; return response.json();

}





2\. Create src/hooks/useCheckRequests.ts:



export function useCheckRequests() {

&nbsp; const \[requests, setRequests] = useState(\[]);

&nbsp; const \[loading, setLoading] = useState(true);

&nbsp; const \[error, setError] = useState(null);

&nbsp; 

&nbsp; useEffect(() => {

&nbsp;   getMyRequests()

&nbsp;     .then(result => setRequests(result.data.requests))

&nbsp;     .catch(setError)

&nbsp;     .finally(() => setLoading(false));

&nbsp; }, \[]);

&nbsp; 

&nbsp; return { requests, loading, error };

}





3\. Modify components:



EmployeeDashboardPage.tsx: Replace requests array with useCheckRequests() hook

RequestDetailPage.tsx: Replace requestDataMap with API call using requestId prop

F. Stop Point

Before proceeding, verify:



✅ Dashboard shows real requests from API

✅ Clicking request opens detail page

✅ Detail page shows full request data

✅ Loading states displayed

✅ Error handling works

G. Test Checklist

UI Tests:



\[ ] Dashboard loads requests from API

\[ ] Latest result derived from first request

\[ ] Click request row → opens detail page

\[ ] Detail page shows all tabs (Summary, Calculation, Evidence, Timeline)

\[ ] Loading skeleton shown during fetch

\[ ] Error message shown on failure

API Tests:



\# List

curl -X GET https://your-api-id.execute-api.region.amazonaws.com/api/employee/requests \\

&nbsp; -H "Authorization: Bearer TOKEN"



\# Get detail

curl -X GET https://your-api-id.execute-api.region.amazonaws.com/api/check/REQ-2025-003 \\

&nbsp; -H "Authorization: Bearer TOKEN"





H. Definition of Done

✅ Requests list API integrated

✅ Request detail API integrated

✅ Dashboard displays real data

✅ Detail page shows complete information

✅ Loading and error states handled

---



----------------------------------------------------------------------------

Step 7: Quick Reference

----------------------------------------------------------------------------



Step 7: Quick Reference

A. Goal

Replace hardcoded rates in Quick Reference card (/components/dashboards/EmployeeDashboardPage.tsx lines 421-494) with data from saved profile.



B. Files to Modify/Create

Frontend:



Modify: src/components/dashboards/EmployeeDashboardPage.tsx (lines 435-494, replace hardcoded rates)

Use existing: useEmployeeProfile hook from Step 2

Backend (AWS):



Use existing: GET /api/employee/profile endpoint from Step 2

Profile data already includes rates from Step 3

C. API Design

Uses existing GET /api/employee/profile endpoint. Response includes extracted field with rates:



{

&nbsp; "extracted": {

&nbsp;   "baseRate": 28.00,

&nbsp;   "casualLoading": 25,

&nbsp;   "eveningRate": 34.00,

&nbsp;   "saturdayRate": 42.00,

&nbsp;   "sundayRate": 56.00,

&nbsp;   "publicHolidayRate": 70.00,

&nbsp;   "minimumShift": 2,

&nbsp;   "paidBreak": "10 min (4+ hrs)",

&nbsp;   "mealAllowance": 15.20,

&nbsp;   "splitShiftAllowance": 18.50

&nbsp; }

}





D. Amazon Q Prompt

No new backend required. Uses existing profile endpoint from Step 2.



E. Frontend Integration Plan

Modify src/components/dashboards/EmployeeDashboardPage.tsx:



Use useEmployeeProfile() hook (already imported from Step 2)

Replace hardcoded rates (lines 439-454) with profile?.extracted?.baseRate, etc.

Replace hardcoded entitlements (lines 460-485) with profile?.extracted?.minimumShift, etc.

Show loading state if profile not loaded

Show "Complete your profile" message if profile incomplete

F. Stop Point

Before proceeding, verify:



✅ Quick Reference shows rates from profile

✅ Rates update when profile is saved

✅ Loading state shown during fetch

✅ Empty state shown if profile incomplete

G. Test Checklist

UI Tests:



\[ ] Quick Reference displays rates from profile API

\[ ] Rates match saved profile data

\[ ] After profile update, Quick Reference refreshes

\[ ] If profile incomplete, shows message to complete profile

API Tests:



Uses existing profile endpoint (tested in Step 2).



H. Definition of Done

✅ Quick Reference uses real profile data

✅ Rates displayed correctly

✅ Updates when profile changes

✅ Handles incomplete profile state

---







--------------------------------------------

Step 8: Award Pac

---------------------------------------------



Step 8: Award Pac





Step 7: Quick Reference

A. Goal

Replace hardcoded rates in Quick Reference card (/components/dashboards/EmployeeDashboardPage.tsx lines 421-494) with data from saved profile.



B. Files to Modify/Create

Frontend:



Modify: src/components/dashboards/EmployeeDashboardPage.tsx (lines 435-494, replace hardcoded rates)

Use existing: useEmployeeProfile hook from Step 2

Backend (AWS):



Use existing: GET /api/employee/profile endpoint from Step 2

Profile data already includes rates from Step 3

C. API Design

Uses existing GET /api/employee/profile endpoint. Response includes extracted field with rates:



{

&nbsp; "extracted": {

&nbsp;   "baseRate": 28.00,

&nbsp;   "casualLoading": 25,

&nbsp;   "eveningRate": 34.00,

&nbsp;   "saturdayRate": 42.00,

&nbsp;   "sundayRate": 56.00,

&nbsp;   "publicHolidayRate": 70.00,

&nbsp;   "minimumShift": 2,

&nbsp;   "paidBreak": "10 min (4+ hrs)",

&nbsp;   "mealAllowance": 15.20,

&nbsp;   "splitShiftAllowance": 18.50

&nbsp; }

}





D. Amazon Q Prompt

No new backend required. Uses existing profile endpoint from Step 2.



E. Frontend Integration Plan

Modify src/components/dashboards/EmployeeDashboardPage.tsx:



Use useEmployeeProfile() hook (already imported from Step 2)

Replace hardcoded rates (lines 439-454) with profile?.extracted?.baseRate, etc.

Replace hardcoded entitlements (lines 460-485) with profile?.extracted?.minimumShift, etc.

Show loading state if profile not loaded

Show "Complete your profile" message if profile incomplete

F. Stop Point

Before proceeding, verify:



✅ Quick Reference shows rates from profile

✅ Rates update when profile is saved

✅ Loading state shown during fetch

✅ Empty state shown if profile incomplete

G. Test Checklist

UI Tests:



\[ ] Quick Reference displays rates from profile API

\[ ] Rates match saved profile data

\[ ] After profile update, Quick Reference refreshes

\[ ] If profile incomplete, shows message to complete profile

API Tests:



Uses existing profile endpoint (tested in Step 2).



H. Definition of Done

✅ Quick Reference uses real profile data

✅ Rates displayed correctly

✅ Updates when profile changes

✅ Handles incomplete profile state

---



