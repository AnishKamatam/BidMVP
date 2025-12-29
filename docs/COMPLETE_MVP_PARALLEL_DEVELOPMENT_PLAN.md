# Complete MVP Parallel Development Plan

## Team Structure
- **Abhinav (Backend)**: Database functions, API layer, Supabase integration, data validation
- **Andrew (Frontend/UI)**: Components, pages, styling, user experience, interactions

## Core Development Pattern (Applied to All Phases)
1. **Backend creates functions + mocks** → Abhinav builds real functions, creates mock versions
2. **Frontend builds UI with mocks** → Andrew builds components using mock data
3. **Integration checkpoint** → Both connect real functions, test together
4. **Merge & move to next phase**

---

# PHASE 0: FOUNDATIONS

## 0.1 Database Schema ✅ COMPLETE
- Database tables, RLS policies, functions all set up

## 0.2 User Profile System

### Backend (Abhinav)
**Files:**
- `lib/supabase/users.js` - getUserProfile, createUserProfile, updateUserProfile, checkProfileComplete
- `lib/supabase/phone.js` - sendPhoneVerificationCode, verifyPhoneCode
- `lib/storage/upload.js` - uploadProfilePhoto
- `lib/mocks/userFunctions.js` - Mock versions of all user functions

**Deliverables:**
- Functions work with real database
- Mock functions match real function signatures
- Photo upload to Supabase Storage working

### Frontend (Andrew)
**Files:**
- `components/ProfileSetupForm.js` - Name, year, gender, photo (required), social links (optional)
- `components/PhoneVerificationModal.js` - Phone input, code verification
- `components/PhotoUpload.js` - Photo upload UI with preview
- Extend `components/AuthModal.js` - Multi-step: signup → phone → profile
- `app/onboarding/page.js` - Profile completion check & redirect

**Deliverables:**
- Complete UI flow using mocks
- Styled and polished components
- Error states and loading states

**Integration Checkpoint:** Full profile setup flow working end-to-end

---

## 0.3 Campus Detection

### Backend (Abhinav)
**Files:**
- `lib/supabase/schools.js` - getSchoolByDomain, createSchool, linkUserToSchool
- `lib/campus.js` - detectCampusFromEmail, autoLinkUser
- `lib/mocks/schoolData.js` - Mock school data

**Deliverables:**
- Campus detection from email domain
- Auto-create schools if missing
- Link users to schools

### Frontend (Andrew)
**Files:**
- `app/onboarding/campus/page.js` - Campus selection UI (if multiple matches)
- `components/CampusSelector.js` - Campus selection component
- Update onboarding flow to include campus step

**Deliverables:**
- Campus selection UI
- Integration with profile setup flow

**Integration Checkpoint:** Campus auto-detection and linking working

---

## 0.4 Host/Fraternity Account System

### Backend (Abhinav)
**Files:**
- `lib/supabase/fraternities.js` - createFraternity, getFraternity, updateFraternity
- `lib/supabase/groupMembers.js` - addMember, removeMember, getMembers, checkIsAdmin
- `lib/mocks/fraternityData.js` - Mock fraternity and member data

**Deliverables:**
- Fraternity CRUD operations
- Member management functions
- Admin role checking

### Frontend (Andrew)
**Files:**
- `app/fraternities/create/page.js` - Create fraternity form
- `app/fraternities/[id]/page.js` - Fraternity dashboard
- `app/fraternities/[id]/members/page.js` - Member management page
- `components/FraternityCard.js` - Display component
- `components/FraternityInviteModal.js` - Invite members modal
- `contexts/FraternityContext.js` - Fraternity state management

**Deliverables:**
- Complete fraternity management UI
- Member invitation flow
- Admin dashboard

**Integration Checkpoint:** Fraternity creation and member management working

---

## 0.5 Friend System (MVP)

### Backend (Abhinav)
**Files:**
- `lib/supabase/friendships.js` - sendFriendRequest, acceptRequest, removeFriend, getFriends
- `lib/supabase/friendships.js` - getPeopleYouMet (suggestions algorithm)
- `lib/mocks/friendshipData.js` - Mock friend data

**Deliverables:**
- Friend request system
- "People you might have met" algorithm
- Privacy tier enforcement

### Frontend (Andrew)
**Files:**
- `app/friends/page.js` - Friends list page
- `components/FriendRequestCard.js` - Friend request UI
- `components/PeopleYouMet.js` - Post-event suggestions component
- `components/FriendList.js` - Friends display

**Deliverables:**
- Friend management UI
- Friend request flow
- Suggestions UI

**Integration Checkpoint:** Friend system fully functional

---

## 0.6 Enhanced Authentication

### Backend (Abhinav)
**Files:**
- `lib/supabase/auth.js` - Phone auth helpers (if not done in 0.2)
- MFA setup functions

**Deliverables:**
- Phone authentication working
- MFA setup (optional for MVP)

### Frontend (Andrew)
**Files:**
- Update `components/AuthModal.js` - Add phone field if needed
- MFA setup UI (optional)

**Integration Checkpoint:** Enhanced auth working

---

# PHASE 1: DOORLIST CORE

## 1.1 Event Creation

### Backend (Abhinav)
**Files:**
- `lib/supabase/events.js` - createEvent, updateEvent, deleteEvent, getEvent
- `lib/qr/generator.js` - generateQRCode, validateQRCode
- `lib/mocks/eventData.js` - Mock event data

**Deliverables:**
- Event CRUD functions
- QR code generation (unique per event)
- Event validation logic

### Frontend (Andrew)
**Files:**
- `app/events/create/page.js` - Event creation form
- `components/EventForm.js` - Reusable event form component
- `components/DateTimePicker.js` - Date/time selection
- `components/EventTypeSelector.js` - Event type dropdown

**Deliverables:**
- Complete event creation UI
- Form validation
- QR code display

**Integration Checkpoint:** Events can be created and QR codes generated

---

## 1.2 Guest List & Requests

### Backend (Abhinav)
**Files:**
- `lib/supabase/guests.js` - createEventRequest, approveRequest, denyRequest, getEventRequests
- `lib/supabase/guests.js` - manuallyAddGuest, getGuestList
- `lib/supabase/revenue.js` - recordLineSkip, getEventRevenue (for paid line skip)
- `lib/mocks/guestData.js` - Mock guest list data

**Deliverables:**
- Guest request system
- Approval/denial functions
- Revenue tracking (line skip payments)

### Frontend (Andrew)
**Files:**
- `app/events/[id]/guests/page.js` - Guest list management page
- `components/GuestList.js` - Guest list table/display
- `components/RequestCard.js` - Request approval card (shows user photo, name, safety tier)
- `components/LineSkipButton.js` - Paid line skip UI
- `components/ManualAddGuest.js` - Manual add form

**Deliverables:**
- Guest list management UI
- Request approval flow
- Payment integration UI (Stripe or Supabase Payments)

**Integration Checkpoint:** Guest list system fully functional

---

## 1.3 QR Code Check-In

### Backend (Abhinav)
**Files:**
- `lib/supabase/checkin.js` - checkInUser, checkOutUser, getCheckedInUsers, isUserCheckedIn
- `lib/location/tracker.js` - trackUserLocation, autoCheckOut (geolocation)
- `lib/mocks/checkinData.js` - Mock check-in data

**Deliverables:**
- Check-in/check-out functions
- QR code validation
- Auto check-out via geolocation

### Frontend (Andrew)
**Files:**
- `app/events/[id]/checkin/page.js` - QR scanner page (host view)
- `app/events/[id]/qr/page.js` - User's QR code display
- `components/QRScanner.js` - Camera-based QR scanner
- `components/CheckInList.js` - Live attendee list (real-time)
- `components/ManualCheckOut.js` - Manual check-out button

**Deliverables:**
- QR scanner UI
- Check-in list with real-time updates
- User QR code display

**Integration Checkpoint:** QR check-in system working end-to-end

---

## 1.4 Event Feed

### Backend (Abhinav)
**Files:**
- `lib/supabase/events.js` - getCampusEvents, filterEvents (by type, visibility, rush-only)
- `lib/mocks/eventFeedData.js` - Mock event feed data

**Deliverables:**
- Event query functions
- Filtering logic
- Visibility rules (public, invite-only, rush-only)

### Frontend (Andrew)
**Files:**
- `app/events/page.js` - Event feed/list page
- `components/EventCard.js` - Event card component
- `components/EventFilters.js` - Filter UI (type, visibility)
- `components/EventFeed.js` - Feed container

**Deliverables:**
- Event feed UI
- Filtering UI
- Event cards with all info

**Integration Checkpoint:** Event feed displaying and filtering correctly

---

## 1.5 Chat/DM System

### Backend (Abhinav)
**Files:**
- `lib/supabase/messages.js` - createConversation, sendMessage, getMessages, getConversations
- `lib/supabase/messages.js` - createMessageRequest, acceptMessageRequest, markAsRead
- `lib/mocks/messageData.js` - Mock conversation and message data

**Deliverables:**
- Message CRUD functions
- Message request system
- Real-time subscription setup (Supabase Realtime)

### Frontend (Andrew)
**Files:**
- `app/messages/page.js` - Messages inbox
- `app/messages/[conversationId]/page.js` - Individual conversation page
- `components/MessageList.js` - Conversation list
- `components/MessageBubble.js` - Message UI component
- `components/MessageRequestCard.js` - Request approval UI
- `components/ChatWithHostButton.js` - "Chat with host" button for events
- `contexts/ChatContext.js` - Real-time chat state management

**Deliverables:**
- Complete messaging UI
- Real-time message updates
- Message request flow
- Online/offline indicators

**Integration Checkpoint:** Chat system fully functional with real-time updates

---

# PHASE 2: SAFETY & REPUTATION

## 2.1 Upvote/Downvote System

### Backend (Abhinav)
**Files:**
- `lib/supabase/interactions.js` - createInteraction, getInteractions, checkDuplicateInteraction
- `lib/mocks/interactionData.js` - Mock interaction data

**Deliverables:**
- Interaction creation (upvote/downvote)
- Duplicate prevention
- Query functions

### Frontend (Andrew)
**Files:**
- `components/InteractionModal.js` - Post-event feedback popup
- `components/ProfileInteractionButton.js` - Tap profile to upvote/downvote
- `components/InteractionList.js` - List of attendees for feedback

**Deliverables:**
- Post-event feedback UI
- Profile interaction UI
- Smooth UX flow

**Integration Checkpoint:** Upvote/downvote system working

---

## 2.2 Safety Score Calculation

### Backend (Abhinav)
**Files:**
- `lib/safety/calculator.js` - calculateSafetyScore (already in database, but may need client helpers)
- `lib/supabase/safety.js` - getSafetyTier, getSafetyScore (host-only queries)
- Database functions already created in Phase 0.1

**Deliverables:**
- Safety score query functions
- Tier retrieval functions
- Host-only access enforcement

### Frontend (Andrew)
**Files:**
- `components/SafetyBadge.js` - Color-coded tier badge (green/yellow/red)
- `components/SafetyTooltip.js` - Hover tooltip explaining tiers
- Update `components/GuestList.js` - Show safety tier badges
- Update `components/RequestCard.js` - Show safety tier

**Deliverables:**
- Safety tier visualization
- Host-facing safety UI
- Clear visual indicators

**Integration Checkpoint:** Safety scores displaying correctly for hosts

---

## 2.3 Reporting System

### Backend (Abhinav)
**Files:**
- `lib/supabase/reports.js` - createReport, getReports, checkReportCooldown
- `lib/safety/cooldown.js` - Cooldown logic (max 2 per week)
- `lib/mocks/reportData.js` - Mock report data

**Deliverables:**
- Report creation
- Cooldown enforcement
- Report query functions

### Frontend (Andrew)
**Files:**
- `components/ReportModal.js` - Report form with categories
- `components/ReportWarning.js` - Warning screen about false reporting
- `components/ReportCooldown.js` - Cooldown indicator

**Deliverables:**
- Report flow UI
- Warning screens
- Cooldown display

**Integration Checkpoint:** Reporting system working with cooldown

---

## 2.4 Safety UI for Hosts

### Backend (Abhinav)
**Files:**
- Already covered in 2.2, may need additional query helpers

### Frontend (Andrew)
**Files:**
- Enhance safety badges and tooltips
- Safety tier filtering in guest lists
- Safety alerts UI

**Integration Checkpoint:** Complete safety UI for hosts

---

# PHASE 3: RUSH OS

## 3.1 Rushing Toggle

### Backend (Abhinav)
**Files:**
- `lib/supabase/users.js` - updateRushingStatus (add to existing file)
- Simple function to toggle rushing boolean

**Deliverables:**
- Rushing toggle function

### Frontend (Andrew)
**Files:**
- Update `components/ProfileForm.js` - Add rushing toggle switch
- Update `app/profile/page.js` - Include rushing toggle

**Deliverables:**
- Rushing toggle UI in profile

**Integration Checkpoint:** Rushing toggle working

---

## 3.2 PNM List

### Backend (Abhinav)
**Files:**
- `lib/supabase/rush.js` - getPNMList, filterPNMs (by safety tier, events attended)
- `lib/mocks/pnmData.js` - Mock PNM data

**Deliverables:**
- PNM query functions
- Filtering logic
- Frat-only access enforcement

### Frontend (Andrew)
**Files:**
- `app/fraternities/[id]/rush/pnms/page.js` - PNM list view
- `components/PNMCard.js` - PNM profile card
- `components/PNMFilters.js` - Filter UI (safety tier, attendance)

**Deliverables:**
- PNM list UI
- Filtering UI
- PNM cards with all info

**Integration Checkpoint:** PNM list displaying correctly

---

## 3.3 Rush Event Tools

### Backend (Abhinav)
**Files:**
- `lib/supabase/rush.js` - createRushNote, getRushNotes, getPNMAttendance
- `lib/supabase/rush.js` - getEngagementAnalytics (attendance tracking)
- `lib/mocks/rushData.js` - Mock rush notes and analytics

**Deliverables:**
- Rush notes CRUD
- Attendance tracking
- Engagement analytics queries

### Frontend (Andrew)
**Files:**
- `app/fraternities/[id]/rush/events/page.js` - Rush events list
- `app/fraternities/[id]/rush/events/[eventId]/page.js` - Rush event dashboard
- `components/RushNotesPanel.js` - Notes input component
- `components/PNMAttendanceCard.js` - Attendance tracking display
- `components/EngagementIndicator.js` - Rising/falling interest indicator

**Deliverables:**
- Rush event management UI
- Notes panel
- Attendance tracking UI
- Analytics display

**Integration Checkpoint:** Rush event tools working

---

## 3.4 Funnel Analytics

### Backend (Abhinav)
**Files:**
- `lib/supabase/analytics.js` - getRushFunnel, getEngagementRankings, getDropOffPoints
- `lib/mocks/analyticsData.js` - Mock analytics data

**Deliverables:**
- Analytics query functions
- Funnel calculations
- Engagement metrics

### Frontend (Andrew)
**Files:**
- `app/fraternities/[id]/rush/analytics/page.js` - Analytics dashboard
- `components/RushFunnelChart.js` - Funnel visualization (use recharts)
- `components/EngagementChart.js` - Engagement over time chart
- `components/TopPNMsList.js` - Engagement rankings

**Deliverables:**
- Analytics dashboard UI
- Charts and visualizations
- Rankings display

**Integration Checkpoint:** Analytics dashboard working

---

# PHASE 4: LIVE EVENT DASHBOARD

## 4.1 Live Ratio Tracking

### Backend (Abhinav)
**Files:**
- `lib/supabase/realtime.js` - Real-time subscriptions setup
- `lib/supabase/events.js` - getEventRatio (M/F/X calculation)
- `lib/location/tracker.js` - Enhanced geolocation tracking
- `lib/mocks/realtimeData.js` - Mock real-time data

**Deliverables:**
- Real-time ratio calculation
- Geolocation auto check-out
- Real-time subscriptions

### Frontend (Andrew)
**Files:**
- `app/events/[id]/live/page.js` - Live event dashboard
- `components/RatioMeter.js` - M/F/X ratio display
- `components/HeatMap.js` - Location heat map (optional)
- `components/LiveAttendeeList.js` - Real-time attendee list

**Deliverables:**
- Live dashboard UI
- Ratio visualization
- Real-time updates

**Integration Checkpoint:** Live ratio tracking working

---

## 4.2 Capacity Warnings

### Backend (Abhinav)
**Files:**
- `lib/supabase/events.js` - getEventCapacity, checkCapacityStatus
- Real-time capacity monitoring

**Deliverables:**
- Capacity calculation functions
- Warning thresholds (80%, 90%, 100%)

### Frontend (Andrew)
**Files:**
- `components/CapacityAlert.js` - Warning banners
- `components/CapacityBar.js` - Visual capacity indicator
- Update `app/events/[id]/live/page.js` - Add capacity monitoring

**Deliverables:**
- Capacity warning UI
- Visual indicators
- Alert system

**Integration Checkpoint:** Capacity warnings working

---

## 4.3 Flagged User Alerts

### Backend (Abhinav)
**Files:**
- `lib/supabase/checkin.js` - checkSafetyTierOnCheckIn (enhance existing)
- `lib/supabase/safety.js` - getSafetyTier (already exists)

**Deliverables:**
- Safety tier check on check-in
- Alert generation for RED users

### Frontend (Andrew)
**Files:**
- `components/SafetyAlert.js` - Alert banner for flagged users
- Update check-in flow to show alerts
- Host accept/deny UI for flagged users

**Deliverables:**
- Safety alert UI
- Host decision flow

**Integration Checkpoint:** Flagged user alerts working

---

## 4.4 Revenue Dashboard

### Backend (Abhinav)
**Files:**
- `lib/supabase/revenue.js` - getEventRevenue, getRevenueByType, getRevenueCurve
- `lib/mocks/revenueData.js` - Mock revenue data

**Deliverables:**
- Revenue query functions
- Revenue analytics
- Export functionality (CSV)

### Frontend (Andrew)
**Files:**
- `app/events/[id]/revenue/page.js` - Revenue page
- `components/RevenueChart.js` - Revenue over time chart
- `components/RevenueBreakdown.js` - Revenue by type
- `components/ExportButton.js` - CSV export button

**Deliverables:**
- Revenue dashboard UI
- Charts and visualizations
- Export functionality

**Integration Checkpoint:** Revenue dashboard working

---

## 4.5 Risk Chair Tools

### Backend (Abhinav)
**Files:**
- `lib/supabase/risk.js` - getRiskAlerts, getCrowdMetrics, getHistoricalMetrics
- `lib/mocks/riskData.js` - Mock risk data

**Deliverables:**
- Risk monitoring functions
- Alert generation
- Historical data queries

### Frontend (Andrew)
**Files:**
- `app/fraternities/[id]/risk/page.js` - Risk chair dashboard
- `components/RiskAlerts.js` - Alert panel
- `components/CrowdMetrics.js` - Crowd monitoring display
- `components/RiskChart.js` - Historical trend charts

**Deliverables:**
- Risk dashboard UI
- Alert system
- Metrics visualization

**Integration Checkpoint:** Risk chair dashboard working

---

# DEVELOPMENT WORKFLOW

## Daily Standup Structure
1. **What I built yesterday** (show progress, files created)
2. **What I'm building today** (declare files you'll touch)
3. **Any blockers** (need help from other person)
4. **Interface changes** (if data structures need to change)

## File Ownership Rules
- **Backend files** (`lib/supabase/*`, `lib/*`, `lib/storage/*`): Abhinav owns
- **Frontend files** (`components/*`, `app/*/page.js`): Andrew owns
- **Shared files** (`contexts/*`, `app/layout.js`, `middleware.js`): Coordinate changes
- **Mock files** (`lib/mocks/*`): Abhinav creates, both can reference

## Git Workflow
1. Work on separate branches: `abhinav/backend-*` and `andrew/frontend-*`
2. Commit frequently with clear messages
3. Merge to `main` only after integration checkpoint completion
4. Use pull requests for integration checkpoints
5. Tag each other for reviews

## Communication Protocol
- **Before changing interfaces**: Message immediately
- **After completing checkpoint**: Tag for review
- **Blockers**: Ask immediately, don't wait
- **Daily sync**: Quick 10-min standup

## Mock Data Strategy

### Backend Creates Mocks
Abhinav creates comprehensive mock functions:
```javascript
// lib/mocks/functions.js
export const mockGetUserProfile = async (userId) => {
  return { id, name, email, year, gender, profile_pic, ... }
}
export const mockCreateEvent = async (eventData) => {
  return { id: 'mock-id', ...eventData }
}
// ... all functions
```

### Frontend Uses Mocks
Andrew imports mocks during development:
```javascript
// During development
import { mockGetUserProfile } from '@/lib/mocks/functions'

// When ready to integrate
import { getUserProfile } from '@/lib/supabase/users'
```

### Easy Toggle
```javascript
// lib/config.js
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
```

## Checkpoint System

### Checkpoint Format
```
CHECKPOINT [Phase].[Feature] - [Backend/Frontend]
✅ Created: [list files]
✅ Tested: [what works]
📋 Ready: [what other person can use]
⚠️  Known: [what doesn't work yet]
🔗 Integration: [what needs to be connected]
```

### Integration Checklist (Each Phase)
- [ ] Backend: All functions tested and working
- [ ] Backend: Mock functions match real function signatures
- [ ] Frontend: All UI components built and styled
- [ ] Frontend: Components use mock functions successfully
- [ ] Both: Replace mocks with real functions
- [ ] Both: Test end-to-end flow
- [ ] Both: Fix data structure mismatches
- [ ] Both: Test error handling
- [ ] Both: Code review each other's work
- [ ] Both: Merge to main

---

# TIMELINE ESTIMATE

## Phase 0: Foundations (Weeks 1-2)
- 0.2: Profile System (Week 1)
- 0.3: Campus Detection (Week 1-2)
- 0.4: Groups/Fraternities (Week 2)
- 0.5: Friend System (Week 2)
- 0.6: Enhanced Auth (Week 2)

## Phase 1: DoorList Core (Weeks 3-5)
- 1.1: Event Creation (Week 3)
- 1.2: Guest List (Week 3-4)
- 1.3: QR Check-In (Week 4)
- 1.4: Event Feed (Week 4-5)
- 1.5: Chat System (Week 5)

## Phase 2: Safety & Reputation (Weeks 6-7)
- 2.1: Upvote/Downvote (Week 6)
- 2.2: Safety Score (Week 6)
- 2.3: Reporting (Week 7)
- 2.4: Safety UI (Week 7)

## Phase 3: Rush OS (Weeks 8-9)
- 3.1: Rushing Toggle (Week 8)
- 3.2: PNM List (Week 8)
- 3.3: Rush Events (Week 9)
- 3.4: Analytics (Week 9)

## Phase 4: Live Dashboard (Weeks 10-11)
- 4.1: Live Ratio (Week 10)
- 4.2: Capacity Warnings (Week 10)
- 4.3: Flagged Alerts (Week 11)
- 4.4: Revenue Dashboard (Week 11)
- 4.5: Risk Chair Tools (Week 11)

**Total: ~11 weeks for complete MVP**

---

# SUCCESS METRICS

## Phase 0 Completion
- Users can create profiles and join groups
- Friend system functional
- Campus detection working

## Phase 1 Completion
- A frat can fully replace DoorList
- Events created, guest lists managed, QR check-in working
- Chat system operational

## Phase 2 Completion
- Safety scores calculating correctly
- Reporting system preventing abuse
- Hosts can filter by safety tier

## Phase 3 Completion
- Rush chairs managing PNMs effectively
- Analytics providing insights
- Rush events tracked end-to-end

## Phase 4 Completion
- Live dashboard operational during events
- Risk chairs monitoring in real-time
- Revenue tracking accurate

---

This plan enables parallel development across all features while maintaining clear interfaces and checkpoints for integration.

