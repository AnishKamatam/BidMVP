---
name: Phase 1.1 Frontend - Event Creation UI
overview: Frontend implementation plan for Phase 1.1 Event Creation, including event creation page, form components, date/time pickers, event type selector, and QR code display. Connects directly to backend Server Actions.
todos: []
---

# Phase 1.1 Frontend

- Event Creation UI

## Overview

Frontend implementation for Phase 1.1 Event Creation system. This includes the event creation page, reusable form components, date/time pickers, event type selector, and QR code display functionality.**Prerequisites:**

- Phase 0.5 (Friend System) integration complete
- Backend Server Actions available (`app/actions/events.js`)
- User must be authenticated
- User must be admin of a verified fraternity (quality_member_count >= 7)

**Development Strategy:**

- Connect directly to `app/actions/events.js` Server Actions
- Follow existing patterns from fraternity creation flow
- Combine separate date and time inputs into single TIMESTAMP for backend
- **UI Inspiration:** Layout inspired by DoorList's create event page, but using current design system colors (light theme)

**UI Layout Inspiration (from DoorList):**The following UI patterns are inspired by DoorList's create event page design:

1. **Top Navigation Bar:**

- X button (cancel) on left
- Page title in center
- Checkmark button (submit) on right
- Sticky header for easy access

2. **Header Card:**

- Decorative card at top with "Create Event" title
- Optional illustration or icon
- Light gradient background (using current design system colors)

3. **Form Layout:**

- Vertically stacked form fields
- Clean, organized spacing
- Scrollable content area

4. **Starts/Ends Fields:**

- Visually connected with dotted vertical line
- Starts shows formatted date + time (e.g., "Sun, Jan 4 at 7:00 PM")
- Ends shows time only (e.g., "9:00 PM")
- Both displayed as pill-shaped buttons

5. **Additional Options:**

- Horizontal scrollable row of pill buttons
- Options like "+ Link", "+ Photo Album", etc.
- For future phases, can be placeholders

**Color Scheme (Maintain Current Design System):**

- **Background:** White (#FFFFFF) - NOT dark theme
- **Cards:** White with light gray borders (#F9FAFB)
- **Primary Accent:** Blue (#3B82F6) for buttons and active states
- **Text:** Black (#000000) on white backgrounds
- **Input Fields:** White background with gray borders (#E5E7EB)
- **Pills/Buttons:** White or light gray backgrounds with gray borders

---

## Files to Create

### File: `app/events/create/page.js`

**Purpose:** Event creation page with UI layout inspired by DoorList's create event page, using current design system colors (light theme)**UI Layout Inspiration (from DoorList):**

- Top navigation bar with X button (cancel) on left, checkmark button (submit) on right
- Header card/illustration at top with "Create Event" title
- Scrollable form with vertically stacked input fields
- Starts/Ends fields visually connected with dotted line indicator
- Additional options as horizontal scrollable pill buttons
- Clean, organized layout with proper spacing

**Color Scheme (Maintain Current Design System):**

- Background: White (#FFFFFF) - not dark theme
- Cards: White with light gray borders (#F9FAFB)
- Primary accent: Blue (#3B82F6) for buttons and active states
- Text: Black (#000000) on white backgrounds
- Input fields: White background with gray borders (#E5E7EB)
- Follow existing design.json specifications

**Implementation Steps:**

1. **Authentication & Authorization Check**

- Use `useAuth()` hook to get current user
- Use `useFraternity()` hook to get user's fraternities
- Filter to admin fraternities only
- Check if any admin fraternity is verified using `canCreateEventsAction` from `app/actions/fraternity.js`
- Show `FraternityRequiredModal` if no verified fraternity
- Redirect to home if not authenticated

2. **Fraternity Selection Logic**

- If user has multiple verified fraternities, show selector dropdown
- If single verified fraternity, use it automatically
- Store selected `frat_id` in state
- Pass selected `frat_id` to `EventForm` component

3. **Form Submission Handler**

- Call `createEventAction` from `app/actions/events.js`
- Include `image_url` (illustration URL) in event data if uploaded
- Handle loading state during submission
- Handle error states and display error messages
- On success: Redirect to event detail page (`/events/[id]`) or fraternity dashboard
- Show success message (optional)

4. **Loading States**

- Show loading spinner while checking auth/fraternities
- Show loading state on form submission
- Disable form inputs during submission

5. **State Management**

- Loading state for auth/fraternity checks
- Loading state for form submission
- Error state for displaying errors
- Selected fraternity ID
- Illustration URL state (for event image upload)

**Page Layout Structure:**

```javascript
<main className="min-h-screen w-screen bg-white">
  {/* Top Navigation Bar */}
  <div className="sticky top-0 z-10 bg-white border-b border-gray-border px-4 py-3 flex items-center justify-between">
    <Button variant="text" onClick={handleCancel} className="p-2">
      <XIcon className="w-6 h-6" />
    </Button>
    <h1 className="text-heading2 text-neutral-black">Create Event</h1>
    <Button variant="text" onClick={handleSubmit} className="p-2" disabled={loading}>
      <CheckIcon className="w-6 h-6 text-primary-ui" />
    </Button>
  </div>

  {/* Scrollable Content */}
  <div className="overflow-y-auto pb-20">
    {/* Header Card with Illustration Upload */}
    <div className="mx-4 mt-4 mb-6">
      <Card className="bg-gradient-to-br from-primary-ui/10 to-primary-ui/5 p-6 text-center relative">
        <h2 className="text-heading2 text-neutral-black mb-2">Create Event</h2>
        {/* Event Illustration Upload */}
        <EventIllustrationUpload
          value={illustrationUrl}
          onChange={setIllustrationUrl}
          userId={user?.id}
        />
      </Card>
    </div>

    {/* Event Form */}
    <div className="px-4">
      <EventForm
        fratId={selectedFratId}
        userFraternities={verifiedFraternities}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        error={error}
      />
    </div>
  </div>
</main>
```

**Component Structure:**

```javascript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import { createEventAction } from '@/app/actions/events'
import { canCreateEventsAction } from '@/app/actions/fraternity'
import EventForm from '@/components/EventForm'
import EventIllustrationUpload from '@/components/EventIllustrationUpload'
import FraternityRequiredModal from '@/components/FraternityRequiredModal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
// Icons (use heroicons or similar)
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/outline'
```

**References:**

- Pattern: `app/fraternities/create/page.js` (lines 16-241)
- Modal: `components/FraternityRequiredModal.js` (for verification check)
- Context: `contexts/AuthContext.js`, `contexts/FraternityContext.js`

---

### File: `components/EventIllustrationUpload.js`

**Purpose:** Event illustration/image upload component for header card (similar to PhotoUpload but styled for event header)**Implementation:**

- Use `PhotoUpload` component pattern from `components/PhotoUpload.js`
- **Props:**
- `value`: string (current image URL)
- `onChange`: Function(imageUrl) - Called with uploaded image URL
- `userId`: string (required) - User ID for upload
- **Upload Function:**
- Call `uploadEventImageAction` from `app/actions/events.js`
- Use `uploadType="event"` or create separate upload function
- Handle temp upload path during event creation (eventId not yet available)
- **Styling:**
- Display in header card area
- Show as overlay or button in bottom-right corner of header card
- Small upload icon/button (similar to DoorList's picture frame icon)
- Preview image fills header card background if uploaded
- If no image, show gradient background with upload button
- **Layout:**
- Positioned in header card (absolute positioning for overlay button)
- Upload button: Small rounded square with picture frame + plus icon
- Preview: Image fills card background, upload button overlays bottom-right
- Use current design system colors (white/light backgrounds, not dark)

**Component Structure:**

```javascript
'use client'

import { useState } from 'react'
import { uploadEventImageAction } from '@/app/actions/events'
import { useAuth } from '@/contexts/AuthContext'

export default function EventIllustrationUpload({ value, onChange, userId }) {
  // Similar to PhotoUpload but:
  // - Styled for header card display
  // - Smaller upload button overlay
  // - Image fills card background
  // - Uses uploadEventImageAction
}
```

**References:**

- Pattern: `components/PhotoUpload.js` (lines 1-226)
- Upload action: `app/actions/events.js` (uploadEventImageAction)
- Design: Header card with image background and overlay upload button

---

### File: `components/EventForm.js`

**Purpose:** Reusable event form component with DoorList-inspired layout, using current design system colors**Layout Inspiration:**

- Vertically stacked form fields with consistent spacing
- Starts/Ends fields visually connected (dotted line or visual indicator)
- Additional options as horizontal scrollable pills
- Clean, organized field layout
- Use white backgrounds, gray borders, black text (current design system)

**Form Fields to Implement:**

1. **Fraternity Selection** (if multiple fraternities)

- Dropdown/select for fraternity selection
- Only show verified fraternities user is admin of
- Required field
- Show fraternity name

2. **Event Type** (Required)

- Use `EventTypeSelector` component
- Options: 'party', 'mixer', 'rush', 'invite-only'
- Display labels: "Party", "Mixer", "Rush Event", "Invite Only"

3. **Starts/Ends Section** (DoorList-inspired connected layout)

- **Starts Field** (Required):
- Label: "Starts*" on the left
- Use `DateTimePicker` component with `type="date"` and `type="time"` combined
- Display format: "Sun, Jan 4 at 7:00 PM" (formatted date + time)
- Show as pill-shaped button/field on the right side
- Opens date/time picker modal when clicked
- Min date: today (allow today, prevent past dates)
- Use user's timezone for validation
- **Ends Field** (Optional):
- Label: "Ends" on the left
- Use `DateTimePicker` component with `type="time"` only (uses same date as Starts)
- Display format: "9:00 PM" (time only)
- Show as pill-shaped button/field on the right side
- Opens time picker when clicked
- Validation: Must be after start_time (when combined with date)
- **Visual Connection:**
- Add dotted vertical line connecting "Starts" and "Ends" labels on the left
- Creates visual grouping to show they're related (duration)
- Layout: Two fields stacked vertically with connecting line

**Layout Example:**

```javascript
┌─────────────────────────────────┐
│ Starts*          [Sun, Jan 4...]│
│ │                                │
│ │  (dotted line)                 │
│ │                                │
│ Ends              [9:00 PM]     │
└─────────────────────────────────┘
```



6. **Visibility** (Required)

- Options: 'public', 'invite-only', 'rush-only'
- Radio buttons (match design.json radio button style)
- Display labels: "Public", "Invite Only", "Rush Only"
- Default: 'public'

7. **Description** (Optional)

- Textarea input
- Max length validation (suggest 500 characters)
- Label: "Description" with document icon
- Placeholder text

8. **Additional Options** (DoorList-inspired horizontal pills)

- Horizontal scrollable row of pill-shaped buttons
- Options (for future phases, can be placeholders now):
- "+ Link" - Add event link
- "+ Photo Album" - Add photos
- "+ Artist" - Add artist/performer
- "+ Additional Info" - Add more details
- Styled as small rounded pills with plus icon
- Use current design system colors (white background, gray border, primary-ui for icons)
- Horizontal scroll if options overflow

**Client-Side Validation:**

- Required fields: frat_id, date, start_time, event_type, visibility
- Date validation: Date must be today or in the future (use user's timezone)
- Time validation: When combined with date, end_time TIMESTAMP > date TIMESTAMP (if provided)
- Description: Max length check
- Show validation errors inline below each field
- Prevent form submission if validation fails

**Form State Management:**

- Form field values (frat_id, event_type, date, start_time, end_time, visibility, description)
- Validation errors object
- Pending submit state (to prevent double submission)

**Props Interface:**

```javascript
{
  fratId: string | null, // Pre-selected fraternity ID (if single)
  userFraternities: Array, // List of verified fraternities user is admin of
  onSubmit: Function(eventData), // Called with form data on submit
  onCancel: Function(), // Called when cancel button clicked
  loading: boolean, // Loading state from parent
  error: string | null // Error message from parent
}
```

**Form Data Structure:**

```javascript
{
  frat_id: string,
  date: string, // ISO 8601 TIMESTAMP (date + start_time combined)
  end_time: string | null, // Optional, ISO 8601 TIMESTAMP (date + end_time combined)
  event_type: 'party' | 'mixer' | 'rush' | 'invite-only',
  visibility: 'public' | 'invite-only' | 'rush-only',
  description: string | null, // Optional
  image_url: string | null // Optional, from illustration upload
}
```

**Date/Time Combination Implementation:**Frontend collects date and start_time separately, then combines them into a single ISO 8601 TIMESTAMP string. Here's the implementation pattern:

```javascript
// Helper function to combine date and time into ISO 8601 TIMESTAMP
const combineDateTime = (dateStr, timeStr) => {
  // dateStr format: "YYYY-MM-DD" (from date input)
  // timeStr format: "HH:MM" (from time input)
  // Creates a Date object in user's local timezone, then converts to ISO string
  const dateTime = new Date(`${dateStr}T${timeStr}`)
  return dateTime.toISOString() // Returns ISO 8601 TIMESTAMP (UTC)
}

// Usage in form submission:
const eventData = {
  frat_id: selectedFratId,
  date: combineDateTime(date, start_time), // Combine date + start_time
  end_time: end_time ? combineDateTime(date, end_time) : null, // Combine date + end_time if provided
  event_type: eventType,
  visibility: visibility,
  description: description || null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Send user's timezone for backend validation
}
```

**Note:** The `timezone` field is sent to help backend validate dates correctly in the user's timezone. The `date` and `end_time` fields are always ISO 8601 TIMESTAMP strings (UTC format).**Styling:**

- Follow `design.json` specifications
- Use existing UI components: `Input`, `Button`, `Card`
- **Color Scheme:** White backgrounds (#FFFFFF), gray borders (#E5E7EB), black text (#000000)
- **Pill Buttons:** For date/time display and additional options - rounded-full, padding, gray border
- **Connected Fields:** Use dotted line (border-dashed) or visual indicator for Starts/Ends connection
- **Form Field Spacing:** Consistent vertical spacing (1.5rem between fields)
- **Horizontal Scroll:** For additional options row - use `overflow-x-auto` with `flex` layout
- Use design system spacing, colors, typography
- Match overall styling from `components/FraternityForm.js` but with DoorList-inspired layout

**References:**

- Pattern: `components/FraternityForm.js` (lines 19-263)
- UI Components: `components/ui/Input.js`, `components/ui/Button.js`
- Design: `design.json` (input fields, buttons, radio buttons)

---

### File: `components/DateTimePicker.js`

**Purpose:** Date and time selection component with support for combined date/time display (DoorList-style)**Display Modes:**

1. **Date + Time Combined** (for Starts field):

- Shows formatted string like "Sun, Jan 4 at 7:00 PM"
- Opens modal/picker with both date and time selection
- Returns combined TIMESTAMP

2. **Time Only** (for Ends field):

- Shows formatted time like "9:00 PM"
- Opens time picker only
- Uses date from Starts field

3. **Separate Date/Time** (alternative):

- Can also be used as separate date and time inputs if needed

**Implementation:**

1. **Date Picker Mode**

- Use native HTML5 `<input type="date">` (or custom calendar if needed)
- Format: YYYY-MM-DD
- Min date: today (allow today's date, prevent past dates)
- Styled to match design.json input styles
- **Timezone Note:** Use user's local timezone for min date calculation (e.g., `new Date().toISOString().split('T')[0]` to get today's date in user's timezone)

2. **Time Picker Mode**

- Use native HTML5 `<input type="time">` (or custom time picker if needed)
- Format: HH:MM (24-hour format)
- Styled to match design.json input styles

3. **DateTime Mode** (optional, if needed)

- Combine date and time inputs
- Or use single datetime-local input

**Props Interface:**

```javascript
{
  type: 'date' | 'time' | 'datetime', // What to show
  value: string, // ISO date/time string or formatted string
  onChange: Function(value), // Called with new value (ISO string)
  label: string, // Label text
  required: boolean, // Required field indicator
  error: string | null, // Error message to display
  minDate?: string, // Minimum date (YYYY-MM-DD) for date picker
  maxDate?: string, // Maximum date (YYYY-MM-DD) for date picker
  placeholder?: string, // Placeholder text
  displayFormat?: 'pill' | 'input', // Display as pill button or input field
  showTime?: boolean, // For datetime type, whether to show time picker
  baseDate?: string // For time-only mode, the date to use when combining
}
```

**Display Format (Pill Style):**

- When `displayFormat="pill"`, show as rounded pill button with formatted date/time
- Background: white or light gray (#F9FAFB)
- Border: gray (#E5E7EB)
- Text: black (#000000)
- Padding: 0.75rem 1rem
- Border radius: rounded-full or large rounded
- Opens picker modal when clicked

**Styling:**

- Match `components/ui/Input.js` styling exactly
- Use design.json input styles:
- Border: 1px solid #E5E7EB
- Border radius: 0.5rem
- Padding: 0.75rem 1rem
- Font size: 1rem
- Background: white
- Focus state: Border color #3B82F6, outline with box shadow
- Error state: Border color #EF4444
- Disabled state: Background #F3F4F6, text #9CA3AF

**Error Display:**

- Show error message below input
- Use text-bodySmall text-error styling
- Match error display pattern from Input component

**Date/Time Formatting:**

- Use JavaScript `Intl.DateTimeFormat` for user-friendly display
- Format examples:
- Date + Time: "Sun, Jan 4 at 7:00 PM" (e.g., `new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })`)
- Time only: "9:00 PM" (e.g., `new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })`)

**Alternative Consideration:**

- Could use `react-datepicker` library if more advanced features needed
- For MVP, native HTML5 inputs with custom formatting are sufficient and accessible
- Consider modal/popover for date/time picker to match DoorList UX

**References:**

- Pattern: `components/ui/Input.js` (styling and structure)
- Design: `design.json` input styles (lines 609-637)

---

### File: `components/EventTypeSelector.js`

**Purpose:** Event type selection component**Implementation:**

1. **Selection Options**

- Options: 'party', 'mixer', 'rush', 'invite-only'
- Display labels: "Party", "Mixer", "Rush Event", "Invite Only"
- Use radio buttons (match design.json radio button style)

2. **Layout**

- Vertical list of radio button options
- Each option: Radio button + label
- Spacing between options: 0.5rem

3. **Styling**

- Match design.json radio button styles (lines 402-437)
- Default state: Border #E5E7EB, background white
- Selected state: Border color varies by option (or use primary blue), background white
- Hover state: Border color, background #F9FAFB
- Padding: 1rem
- Border radius: 0.75rem
- Border: 2px solid

**Props Interface:**

```javascript
{
  value: string, // Selected event_type: 'party' | 'mixer' | 'rush' | 'invite-only'
  onChange: Function(eventType), // Called with selected event_type
  error: string | null, // Error message to display
  required: boolean // Required field indicator
}
```

**Visual Design:**

- Radio button: 4px size, primary blue color when selected
- Label: text-bodySmall, text-neutral-black
- Error message: Display below all options, text-bodySmall text-error

**References:**

- Pattern: Type selection in `components/FraternityForm.js` (lines 149-180)
- Design: `design.json` radio button styles (lines 402-437)

---

### QR Code Display Component

**Purpose:** Display QR code after event creation or in event detail view**Implementation Location:**

- Could be part of event creation success page (Phase 1.1)
- Or part of event detail page (`app/events/[id]/page.js`) in Phase 1.4
- For Phase 1.1: Show QR code after successful event creation

**Implementation:**

1. **QR Code Image Generation**

- Use `qrcode` npm package (client-side)
- Import: `import QRCode from 'qrcode'`
- Generate QR code image from `event.qr_code` string
- Use `QRCode.toDataURL()` to generate image data URL

2. **Display Component**

- Show QR code image in Card component
- Display event information (date, type, fraternity name)
- Option to download QR code image
- Option to share QR code (future enhancement)

3. **Styling**

- QR code centered in card
- Minimum size: 200x200px for scanning
- Event info above or below QR code
- Download button styled per design.json

**Usage Example:**

```javascript
import QRCode from 'qrcode'

// Generate QR code image
const [qrImage, setQrImage] = useState(null)

useEffect(() => {
  if (event?.qr_code) {
    QRCode.toDataURL(event.qr_code)
      .then(url => setQrImage(url))
      .catch(err => console.error('Error generating QR code:', err))
  }
}, [event?.qr_code])

// Display
{qrImage && (
  <img src={qrImage} alt="Event QR Code" className="w-64 h-64 mx-auto" />
)}
```

**Download Functionality:**

- Button to download QR code as PNG
- Use `QRCode.toDataURL()` or `QRCode.toCanvas()` for download
- Trigger download via anchor tag with download attribute

**Package Installation:**

- `npm install qrcode`
- Package supports both Node.js and browser environments

**Note:** QR code generation happens on frontend; backend only generates the QR code string---

## Integration with Backend

### Data Structure Alignment

**Ensure consistency between frontend and backend:**

- Event data structure matches backend response
- Date/time formats: Use ISO 8601 TIMESTAMP strings (full date + time combined)
- Combine separate date and time inputs into single TIMESTAMP before sending to backend (see example code in EventForm section)
- **Timezone Handling:** Use `Intl.DateTimeFormat().resolvedOptions().timeZone` to get user's timezone and send it as `timezone` parameter in eventData. This helps backend validate dates correctly. When combining date/time, use `new Date()` which respects local timezone, then convert to ISO string.
- Handle nested objects: Event responses may include joined fraternity data
- Error handling: Backend returns `{ data, error }` structure

### Verification Flow Integration

**Pre-Creation Check Flow:**

1. Page loads → Check authentication
2. Check user's fraternities
3. Filter to admin fraternities
4. Check verification status using `canCreateEventsAction`
5. Show `FraternityRequiredModal` if no verified fraternity
6. Allow creation only if verified fraternity exists

**Backend Validation:**

- Backend validates admin status and verification
- Frontend should handle backend validation errors gracefully
- Display clear error messages from backend

---

## Testing Checklist

### Event Creation Page (`app/events/create/page.js`)

- [ ] Page loads and checks authentication
- [ ] Redirects to home if not authenticated
- [ ] Top navigation bar renders correctly (X button, title, checkmark button)
- [ ] Header card displays correctly
- [ ] Event illustration upload component renders in header card
- [ ] Illustration upload works correctly (select, upload, preview)
- [ ] Uploaded illustration displays in header card background
- [ ] Illustration upload button overlays correctly
- [ ] Shows loading state while checking fraternities
- [ ] Shows `FraternityRequiredModal` if no verified fraternity
- [ ] Displays fraternity selector if multiple verified fraternities
- [ ] Auto-selects fraternity if single verified fraternity
- [ ] Form submission works correctly (via checkmark button)
- [ ] Cancel button (X) works correctly
- [ ] Loading state during form submission
- [ ] Error messages display correctly
- [ ] Success redirect works
- [ ] Scrollable layout works correctly
- [ ] UI matches DoorList-inspired layout with current color scheme

### Event Form (`components/EventForm.js`)

- [ ] All form fields render correctly
- [ ] Required field validation works
- [ ] Date validation (allows today, prevents past dates) works
- [ ] Time validation (end_time > start_time) works
- [ ] Date and time are correctly combined into ISO 8601 TIMESTAMP
- [ ] Timezone is correctly detected and sent to backend
- [ ] Form submission triggers onSubmit with correct data
- [ ] Validation errors display inline
- [ ] Form prevents submission with invalid data
- [ ] Loading state disables form
- [ ] Error prop displays correctly
- [ ] Cancel button calls onCancel

### DateTimePicker (`components/DateTimePicker.js`)

- [ ] Date picker renders correctly
- [ ] Time picker renders correctly
- [ ] Combined date/time picker works (for Starts field)
- [ ] Pill display format renders correctly
- [ ] Formatted date/time display works (e.g., "Sun, Jan 4 at 7:00 PM")
- [ ] Value prop updates display
- [ ] onChange called with correct ISO string value
- [ ] Min date constraint works (date picker)
- [ ] Styling matches design.json (white backgrounds, gray borders)
- [ ] Error state displays correctly
- [ ] Required indicator shows
- [ ] Label displays correctly
- [ ] Accessibility attributes present
- [ ] Picker modal/popover opens and closes correctly

### EventTypeSelector (`components/EventTypeSelector.js`)

- [ ] All options render correctly
- [ ] Selected value displays correctly
- [ ] onChange called when option selected
- [ ] Styling matches design.json radio buttons
- [ ] Error message displays correctly
- [ ] Required indicator shows
- [ ] Accessibility attributes present

### QR Code Display

- [ ] QR code image generates from string
- [ ] QR code displays correctly
- [ ] QR code is scannable (minimum size)
- [ ] Download functionality works
- [ ] Error handling if generation fails
- [ ] Event info displays with QR code

### Integration Testing

- [ ] Form submits to backend correctly
- [ ] Date and time are combined into TIMESTAMP correctly
- [ ] Illustration image URL is included in form submission
- [ ] Event is created with image_url field correctly
- [ ] Real error responses handled correctly
- [ ] Success flow works end-to-end
- [ ] Data structure matches backend expectations
- [ ] Authentication/authorization enforced
- [ ] Verification check works correctly

---

## File Structure

```javascript
app/
  events/
    create/
      page.js                    # Event creation page

components/
  EventForm.js                   # Event creation form component
  EventIllustrationUpload.js     # Event illustration/image upload component
  DateTimePicker.js              # Date/time picker component
  EventTypeSelector.js           # Event type selection component
  (QR code display - can be inline or separate component)
```

---

## Dependencies

**New NPM Package:**

- `qrcode` - QR code image generation
- Install: `npm install qrcode`
- Usage: Client-side QR code image generation from strings
- Documentation: https://www.npmjs.com/package/qrcode

**Existing Dependencies (Already in package.json):**

- `react` - Component framework
- `next` - Next.js framework
- All UI components and contexts
- `PhotoUpload` component pattern (for EventIllustrationUpload - reuse pattern, not import)

**Optional Dependencies (Consider for future):**

- `react-datepicker` - If more advanced date picker needed (currently using native HTML5)

---

## Design System Compliance

All UI components must follow `design.json` specifications:

### General Guidelines

- Use design system colors, typography, spacing
- Match button, input, card styles
- Follow mobile-first responsive design
- Ensure touch targets are 44x44px minimum
- Use proper border radius, shadows, spacing scale

### Specific Design References

**Input Fields** (`design.json` lines 609-637):

- Border: 1px solid #E5E7EB
- Border radius: 0.5rem
- Padding: 0.75rem 1rem
- Font size: 1rem
- Focus: Border #3B82F6, box shadow
- Error: Border #EF4444

**Buttons** (`design.json` lines 294-360):

- Primary: Background #3B82F6, text white
- Secondary: Background #E5E7EB, text #4B5563
- Border radius: 0.5rem
- Padding: 0.75rem 1.5rem (large)
- Font size: 1rem (large)

**Cards** (`design.json` lines 273-292):

- Background: #FFFFFF
- Border radius: 0.75rem
- Padding: 1.5rem
- Box shadow: md (0 4px 6px -1px rgba(0, 0, 0, 0.1))

**Radio Buttons** (`design.json` lines 402-437):

- Border: 2px solid #E5E7EB
- Border radius: 0.75rem
- Padding: 1rem
- Selected: Border color (primary blue), background white
- Hover: Background #F9FAFB

**Typography:**

- Headings: Use heading1, heading2, heading3 classes
- Body text: Use body, bodySmall classes
- Labels: Use bodySmall with font-semibold
- Errors: Use bodySmall text-error

**Spacing:**

- Form field spacing: 1.5rem between fields
- Label margin bottom: 0.5rem
- Error margin top: 0.25rem
- Card gap: 1rem

---

## Accessibility

- All form inputs have proper labels
- Error messages associated with inputs (aria-describedby)
- Required fields marked with asterisk and aria-required