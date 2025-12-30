Phase 0.4 Frontend - Fraternity Selection UI (Option C)
Overview
Build the frontend UI for fraternity selection using Option C (Hybrid Approach) with verification system integration:

Optional step after campus selection in onboarding
Skip functionality to allow users to continue without joining
Home page prompt for users who skipped (non-intrusive)
Event creation requirement check (prompt if no fraternity or unverified)
Verification system UI (email verification, status display, progress indicators)
Permission gates based on verification status
Architecture Flow
Redirect
User Choice
Join Existing
Create New
Skip
Select
Submit
Success
Success
Check Fraternity
No
Yes
Check
No
Campus Selection Complete
Fraternity Selection Page
User Action
Search Fraternities
Create Fraternity Form
Welcome Page
Add User to Fraternity
Create + Add as Admin
Has Fraternity?
Show Home Page Prompt
Normal Home Page
User Tries to Create Event
Show Fraternity Required Modal


Current Onboarding Flow
Before Phase 0.4:

Email Signup → Profile Setup → Campus Selection → Welcome
After Phase 0.4:

Email Signup → Profile Setup → Campus Selection → [OPTIONAL] Fraternity Selection → Welcome


Implementation Steps
Step 1: Update Campus Selection Redirect
File: app/onboarding/campus/page.jsChanges:

After successful campus linking, redirect to /onboarding/fraternity instead of /welcome
Pass returnTo parameter to fraternity page
Code Location:

handleConfirmDetected function (line ~234)
handleSelectSchool function (line ~247)
Update:

// After successful campus linking:
const returnTo = searchParams.get('returnTo') || '/welcome'
router.push(`/onboarding/fraternity?returnTo=${encodeURIComponent(returnTo)}`)


Step 2: Create Fraternity Selection Page
File: app/onboarding/fraternity/page.jsPurpose: Main page for fraternity selection in onboarding flowFeatures:

Welcome message: "Great! You're connected to [School Name]"
Three action buttons:
"I'm part of a fraternity" → Show search UI
"I want to create a fraternity" → Show create form
"Skip for now" → Continue to welcome
State Management:

mode: 'select' | 'search' | 'create' | 'loading'
userFraternities: Array of user's existing fraternities (if any)
loading: Boolean for async operations
error: Error message string
Flow:

Check if user already has fraternities (show different UI if yes)
Show initial selection screen
Handle user choice (search/create/skip)
Redirect to welcome after completion or skip
Props/Data Needed:

User ID from auth context
User's school (from campus selection)
Server Actions: getUserFraternitiesAction, searchFraternitiesAction, createFraternityAction, addMemberAction
Step 3: Create FraternitySelector Component
File: components/FraternitySelector.jsPurpose: Reusable component for searching and selecting fraternitiesProps:

schoolId: School ID to filter fraternities
onSelect: Function(fraternityId) called when user selects
onCreate: Function() called when user wants to create new
loading: Boolean for loading state
error: Error message string
onSearch: Function(query) for searching fraternities
Features:

Search input with debounced search (300ms)
Search results list (name, type, member count)
"Create new fraternity" button
Loading states
Error handling
Empty state: "No fraternities found"
UI Elements:

Search icon input
Scrollable results list
Fraternity cards showing:
Name
Type (Fraternity/Sorority/Other)
Member count (optional)
Verified badge (if verified)
Step 4: Create FraternityForm Component
File: components/FraternityForm.jsPurpose: Form for creating a new fraternityFields:

Name (required): Text input
Type (required): Radio buttons or dropdown
Options: "Fraternity", "Sorority", "Other"
Verification Email (optional): Email input
Label: "Fraternity Contact Email (Optional)"
Helper text: "If your fraternity has an official email, we can verify it for faster verification. Otherwise, you'll be verified once you have 7+ verified members."
Placeholder: "president@alphaphi.org (optional)"
Note: Many fraternities don't have custom emails - this is completely optional
Photo (optional): Photo upload component (reuse PhotoUpload pattern)
Description (optional): Textarea
Validation:

Name: Required, min 2 characters, max 100
Type: Required, must be one of the options
Verification Email: Optional, valid email format IF provided (can be left empty)
Photo: Optional, max 5MB, image formats only
Actions:

"Create Fraternity" button (primary)
"Cancel" button (secondary) → Return to selection
On Submit:

Call createFraternityAction Server Action
Duplicate Name Warning: If duplicate name detected, show warning modal:
"A fraternity with this name already exists at your school. Are you sure you want to create another?"
Options: "Continue Anyway" | "Cancel"
If continued, fraternity is flagged for review
Automatically add creator as admin (if creator has verified email + completed profile)
Show success message with verification info:
If email provided: "Fraternity created! Check your verification email for optional verification. You'll need 7+ quality members (or 5+ with email verification) to create events."
If no email: "Fraternity created! Add 6 more verified members to unlock event creation."
If duplicate warning: "Fraternity created but flagged for review due to duplicate name."
Redirect to welcome page (or fraternity dashboard if created)
Step 5: Create FraternityCard Component
File: components/FraternityCard.jsPurpose: Display component for fraternity informationProps:

fraternity: Fraternity object
onClick: Optional click handler
showMemberCount: Boolean (default: false)
variant: 'default' | 'compact' | 'detailed'
Displays:

Fraternity name
Type badge (Fraternity/Sorority/Other)
Photo (if available)
Verification status badges:
Email verified badge (if email_verified)
Member verified badge (if member_verified)
Fully verified badge (if verified)
Member count (if showMemberCount is true)
Verification progress indicator (optional)
Variants:

default: Full card with photo, name, type
compact: Smaller card for lists
detailed: Includes member count, description
Step 6: Update Welcome Page
File: app/welcome/page.jsChanges:

Check if user has fraternities
If no fraternities, show non-intrusive prompt banner
Prompt text: "Join a fraternity to start hosting events"
"Join Now" button → Navigate to /fraternities/join
Dismissible (store in localStorage)
UI:

Banner at top of page (not blocking)
Can be dismissed
Only shows if user has no fraternities
Step 7: Create Home Page Fraternity Prompt
File: components/FraternityPrompt.jsPurpose: Reusable prompt component for home pageProps:

onJoin: Function() called when user clicks "Join"
onDismiss: Function() called when user dismisses
variant: 'banner' | 'card' | 'modal'
Features:

Non-intrusive design
Clear call-to-action
Dismissible
Only shows if user has no fraternities
Usage:

Add to home page (app/page.js) when user is logged in
Check fraternity status on mount
Show/hide based on user's fraternities
Step 8: Create Verification Status Component
File: components/VerificationStatus.jsPurpose: Display fraternity verification status and progressProps:

fraternity: Fraternity object with verification fields
variant: 'compact' | 'detailed' | 'progress'
Features:

Shows verification badges (email optional, member primary, full)
Primary progress: "3/7 quality members needed to unlock events" (member-based, increased threshold)
Optional bonus: "Email verified ✓ | 2/7 quality members needed (or 5+ with email)" (if email provided)
Shows quality member count (only verified users with completed profiles count)
Click to view detailed status
Used in fraternity dashboard and cards
States:

Unverified (< 7 quality members): "Add X more verified members to unlock events" (primary message)
Email verified (optional): "Email verified ✓ | Add X more verified members (or 5+ with email)" (if email provided)
Member verified (7+ quality members): "Ready to create events! ✓" (no email required)
Fully verified (10+ quality members): "Fully verified ✓"
Step 9: Create Fraternity Context
File: contexts/FraternityContext.jsPurpose: Manage fraternity state across the appState:

userFraternities: Array of user's fraternities
loading: Boolean
error: Error message
selectedFraternity: Currently selected fraternity (for event creation)
Functions:

fetchUserFraternities(): Load user's fraternities
refreshFraternities(): Reload after changes
selectFraternity(fraternityId): Set active fraternity
Usage:

Wrap app in FraternityProvider (in app/layout.js)
Use useFraternity() hook in components
Step 10: Create Event Creation Requirement Check (with Verification)
File: components/EventCreationGuard.js (or add to event creation page)Purpose: Check if user has fraternity before allowing event creationImplementation Options:Option A: Modal Guard

When user tries to create event, check fraternity
If no fraternity, show modal: "You need a fraternity to create events"
Options: "Join Fraternity" | "Create Fraternity" | "Cancel"
Option B: Redirect Guard

Check on event creation page load
If no fraternity, redirect to /fraternities/join?returnTo=/events/create
Show message explaining requirement
Recommendation: Use Option A (Modal Guard) for better UXFile: components/FraternityRequiredModal.jsProps:

isOpen: Boolean
onClose: Function()
onJoin: Function() → Navigate to join page
onCreate: Function() → Navigate to create page
Content:

Title: "Verification Required"
Message: "You need a verified fraternity to create events."
If user has fraternity but not verified:
Primary message: "Add X more verified members to unlock events" (quality member-based)
Optional bonus: "Email verified ✓ | Add X more verified members (or 5+ with email)" (if email provided)
Show progress: "3/7 quality members needed" (primary) or "Email verified ✓ | 2/7 quality members needed" (if email)
Show quality member count: "Only members with verified emails and completed profiles count"
Buttons:
"Join Fraternity" (primary) - if no fraternity
"Create Fraternity" (secondary) - if no fraternity
"Add Members" (primary) - if fraternity exists but not verified (shows quality member count needed)
"Cancel" (tertiary)
Step 11: Create Fraternity Dashboard (Basic)
File: `app/fraternities/[id]/page.js`Purpose: Basic fraternity dashboard showing verification statusFeatures:

Fraternity info display
Verification status component
Member list
"Request Verification" button (if eligible)
Verification progress indicator
Verification UI:

Show current status (quality member count primary)
Show requirements: "Add X more verified members to unlock events" (primary message)
Show quality member count vs total member count (e.g., "5/7 quality members")
Optional: Link to verification email resend (only if email was provided)
Member count display prominently
Clear messaging that quality member count is primary verification method
Report Button: "Report Fraternity" button for reporting fake/duplicate fraternities
Step 12: Create Report Fraternity Component
File: components/ReportFraternityModal.jsPurpose: Modal for reporting fake/duplicate/inappropriate fraternitiesProps:

isOpen: Boolean
onClose: Function()
fraternityId: String
fraternityName: String
Features:

Form with reason dropdown:
"Fake fraternity" (not a real fraternity)
"Duplicate name" (another fraternity with same name exists)
"Inappropriate content" (inappropriate name/description)
"Other" (with text input)
Description textarea (required, min 10 chars)
Submit button calls reportFraternityAction
Success message: "Report submitted. Thank you for helping keep the platform safe."
Used in fraternity dashboard and fraternity cards
Usage:

Add "Report" button to FraternityCard component
Add "Report Fraternity" button to fraternity dashboard (`app/fraternities/[id]/page.js`)
Step 13: Create Join Fraternity Page (Post-Onboarding)
File: app/fraternities/join/page.jsPurpose: Standalone page for joining fraternities (accessed from home prompt or event creation)Features:

Same search/select UI as onboarding
Can create new fraternity
Can skip (but show reminder)
Flow:

User searches for fraternity
Selects one → Added as member
Or creates new → Added as admin
Redirects to returnTo parameter or home
Component Structure
FraternitySelectionPage
├── Initial Selection Screen
│   ├── Welcome Message
│   ├── "I'm part of a fraternity" Button
│   ├── "I want to create a fraternity" Button
│   └── "Skip for now" Button
├── Search Mode
│   ├── FraternitySelector Component
│   │   ├── Search Input
│   │   ├── Search Results List
│   │   │   └── FraternityCard (for each result)
│   │   └── "Create New" Button
│   └── Back Button
├── Create Mode
│   ├── FraternityForm Component
│   │   ├── Name Input
│   │   ├── Type Selector
│   │   ├── Photo Upload
│   │   ├── Description Textarea
│   │   ├── Create Button
│   │   └── Cancel Button
│   └── Back Button
└── Loading/Error States


Server Actions Needed
File: app/actions/fraternity.js (Backend will create this)Required Actions:

getUserFraternitiesAction(userId) - Get user's fraternities
searchFraternitiesAction(query, schoolId, limit) - Search fraternities at school
createFraternityAction(fraternityData) - Create new fraternity (includes verification_email)
addMemberAction(groupId, userId, role) - Add user to fraternity
getFraternityAction(fraternityId) - Get fraternity details
checkVerificationStatusAction(fraternityId) - Get verification status
canCreateEventsAction(fraternityId) - Check if can create events
verifyFraternityEmailAction(fraternityId, token) - Verify email (from email link)
reportFraternityAction(fraternityId, reason, description) - Report fake/duplicate fraternity
UI/UX Considerations
1. Onboarding Flow
Keep it quick: Fraternity selection should be fast
Clear options: Make it obvious user can skip
School context: Show school name in welcome message
Progress indicator: Show user is in onboarding (optional)
2. Search Experience
Debounced search: 300ms delay
Empty states: "No fraternities found at [School]"
Loading states: Show spinner during search
Error handling: Clear error messages
3. Create Experience
Simple form: Only essential fields
Photo optional: Don't block on photo upload
Validation: Real-time feedback
Success feedback: Clear confirmation
4. Home Page Prompt
Non-intrusive: Banner, not modal
Dismissible: User can hide it
Contextual: Only show if relevant
Action-oriented: Clear next step
5. Event Creation Guard
Helpful: Explain why fraternity is needed
Actionable: Easy path to join/create/verify
Non-blocking: User can cancel and do later
Verification-aware: Show different message if fraternity exists but not verified
6. Verification Status Display
Clear indicators: Visual badges for verification levels
Progress tracking: Show what's needed to unlock features
Actionable: Link to verification email or member management
Contextual: Show in fraternity cards, dashboard, and event creation guard
Integration Points
1. Campus Selection → Fraternity Selection
File: app/onboarding/campus/page.js

Update redirect after campus linking
Pass returnTo parameter
2. Fraternity Selection → Welcome
File: app/onboarding/fraternity/page.js

Redirect to welcome after completion or skip
Pass returnTo parameter
3. Welcome Page → Fraternity Prompt
File: app/welcome/page.js

Check fraternity status
Show prompt if needed
4. Home Page → Fraternity Prompt
File: app/page.js

Add FraternityPrompt component
Check fraternity status when user is logged in
5. Event Creation → Requirement Check
File: app/events/create/page.js (Future)

Add EventCreationGuard or check on page load
Show modal if no fraternity
Files to Create
New Files
app/onboarding/fraternity/page.js - Fraternity selection page
components/FraternitySelector.js - Search/select component
components/FraternityForm.js - Create fraternity form (with verification_email)
components/FraternityCard.js - Display component (with verification badges)
components/FraternityPrompt.js - Home page prompt
components/FraternityRequiredModal.js - Event creation guard (with verification check)
components/VerificationStatus.js - Verification status display component
components/ReportFraternityModal.js - Modal for reporting fake/duplicate fraternities
contexts/FraternityContext.js - Fraternity state management (with verification)
app/fraternities/join/page.js - Standalone join page
`app/fraternities/[id]/page.js` - Basic fraternity dashboard (with verification UI)
`app/fraternities/[id]/verify/page.js` - Email verification callback page (optional)
Modified Files
app/onboarding/campus/page.js - Update redirect
app/welcome/page.js - Add fraternity prompt
app/page.js - Add fraternity prompt for logged-in users
app/layout.js - Add FraternityProvider (optional)
Testing Checklist
Onboarding Flow
[ ] Campus selection redirects to fraternity selection
[ ] User can search and select existing fraternity
[ ] User can create new fraternity
[ ] User can skip fraternity selection
[ ] All paths redirect to welcome page correctly
Search Functionality
[ ] Search finds fraternities by name
[ ] Search filters by school
[ ] Empty state shows when no results
[ ] Loading states display during search
[ ] Error states handle gracefully
Create Functionality
[ ] Form validates required fields (verification_email is optional)
[ ] Photo upload works (optional)
[ ] User becomes admin after creation
[ ] Verification email is sent after creation ONLY if email provided (optional)
[ ] Success message displays with verification info (different messages for email vs no email)
[ ] Redirects to welcome after creation
Verification System
[ ] Verification email field is optional in form (can be skipped)
[ ] Verification status displays correctly (quality member count primary)
[ ] Progress indicators show quality member count requirements ("X/7 quality members needed")
[ ] Shows quality member count vs total member count
[ ] Email verification link works (if email provided - optional)
[ ] Auto-verification updates when members join (quality member count based)
[ ] Permission gates prevent unverified event creation (< 7 quality members)
[ ] Verification status updates in real-time
[ ] UI clearly shows quality member count is primary verification method
[ ] Duplicate name warning modal appears when creating duplicate fraternity
[ ] Report fraternity modal works and submits reports
[ ] Member quality check prevents adding unverified users or users with incomplete profiles
Home Page Prompt
[ ] Prompt shows when user has no fraternities
[ ] Prompt is dismissible
[ ] Prompt doesn't show if user has fraternities
[ ] "Join Now" button navigates correctly
Event Creation Guard
[ ] Modal shows when user tries to create event without fraternity
[ ] "Join Fraternity" button works
[ ] "Create Fraternity" button works
[ ] User can cancel and continue later
Success Criteria
✅ Users can optionally select/create fraternity after campus selection
✅ Users can skip fraternity selection without blocking
✅ Home page shows non-intrusive prompt for users without fraternities
✅ Event creation requires verified fraternity (7+ quality members, email optional)
✅ Verification system UI displays quality member count progress (primary)
✅ Email verification field is optional (can be skipped)
✅ Permission gates prevent unverified event creation (< 7 quality members)
✅ UI clearly communicates quality member count is primary verification method
✅ Duplicate name warning appears when creating duplicate fraternity
✅ Reporting system allows users to report fake/duplicate fraternities
✅ Member quality check prevents adding unverified users or users with incomplete profiles
✅ All UI components are polished and responsive
✅ Error handling is robust
✅ Loading states provide good feedback
✅ System works for fraternities without custom email domains
✅ Increased threshold (7+ quality members) makes it harder to create fake fraternities
Edge Cases
1. User Already Has Fraternity
Check on fraternity selection page load
Show different UI: "You're already part of [Fraternity Name]"
Option to join additional fraternities
Option to skip
2. No Fraternities at School
Show empty state: "No fraternities found at [School]"
Encourage creating first fraternity
Make "Create" button prominent
3. User Dismisses Home Prompt
Store dismissal in localStorage
Don't show again for 7 days
Or show again when user tries to create event
4. Multiple Fraternities
User can be member of multiple fraternities
Show list of fraternities in selection
Allow selecting which one to use for events
Show verification status for each fraternity
5. Verification Email Not Received (Optional)
Only relevant if email was provided
Show "Resend verification email" option (if email exists)
Link to check spam folder
Allow updating verification_email if needed (admin only)
Note: Email is optional - users can verify via member count (5+) instead
6. Unverified Fraternity Tries to Create Event
Show clear message about verification requirements
Primary message: "Add X more verified members to unlock events" (quality member-based)
Optional bonus: "Email verified ✓ | Add X more verified members (or 5+ with email)" (if email provided)
Show current status: "3/7 quality members needed" (primary) or "Email verified ✓ | 2/7 quality members needed" (if email)
Show quality member count explanation: "Only members with verified emails and completed profiles count"
Provide path to verification: "Add Members" button (primary action)
Optional: "Resend email" button (only if email was provided)
7. Duplicate Name Warning
When creating fraternity with duplicate name:
Show warning modal: "A fraternity with this name already exists at your school. Are you sure you want to create another?"
Options: "Continue Anyway" | "Cancel"
If continued, fraternity is created but flagged for review
Success message includes: "Fraternity created but flagged for review due to duplicate name."
8. Reporting Fake Fraternities
"Report" button on fraternity cards and dashboard
Opens ReportFraternityModal with reason dropdown and description
Submits report via reportFraternityAction
Success message: "Report submitted. Thank you for helping keep the platform safe."
Reports go to admin review queue (can build admin dashboard later)
9. Member Quality Check
When adding members, validate:
User has verified email (email_verified = TRUE)
User has completed profile (name, year, gender, school)
If user doesn't meet requirements:
Show error: "User must have verified email and completed profile to join fraternities"
Prevent adding member
Only quality members count toward verification threshold (7+)