# Lead Management App Specification

## Simple Web Demo

A lightweight single-page web app is bundled with this repository so stakeholders can try the MVP concepts without any build tools:

- Open `index.html` in a modern desktop or mobile browser.
- Capture leads from the **Add a lead** form and schedule the next reminder in one step.
- Review due reminders in the **Today’s follow-ups** column and mark them complete or reschedule with one click.
- Scan every record in the **Pipeline** table, filter by status, and update outcomes (won, lost, hold, reopen) from the inline actions.
- All data is stored in your browser’s local storage so you can experiment freely and reset by clearing site data.

## Core User Flows

### Flow A: Add a Lead
1. User taps **"+ Lead"**.
2. User enters required and optional details:
   - **Name** (required)
   - **Contact information** (email or phone)
   - **Source** (free text or dropdown)
   - **Lead value** (optional)
   - **Note** (e.g., “Met at coworking, interested in website redesign in March.”)
3. App auto-creates:
   - Lead with status set to **Open**
   - First follow-up scheduled for 2–3 days later (default rule, configurable in the future)

### Flow B: See Who to Follow Up With Today
1. User opens app and lands on the **“Today”** tab.
2. Displays summary such as: **“You have 4 follow-ups today.”**
3. Shows list items per lead: `[Lead name] – last contacted [X days ago] – goal: [Close / Check in]`.
4. Tapping a lead navigates to **Lead Details** containing:
   - Timeline of notes and follow-ups
   - Button labeled **“Generate message”**

### Flow C: Generate AI Follow-Up Message
1. On the lead detail screen, user taps **“Generate message”**.
2. App sends the AI service the lead context (name, notes, last interaction, follow-up goal, chosen channel).
3. AI returns 2–3 message options.
4. User selects an option, copies it, and manually sends via email/WhatsApp/etc.
5. User taps **“Mark as done & schedule next”** and chooses one of:
   - **In 2 days**
   - **In 7 days**
   - **In 30 days**
   - **Custom**

### Flow D: Close a Lead
1. Inside the lead detail screen, user can tap buttons **Won**, **Lost**, or **On hold**.
2. Once closed, the lead is removed from the **Today** view and its follow-ups stop.

## Architecture Overview

### Frontend (Mobile)
- **Preferred options:** React Native (Expo) for fast development and future web sharing, or Flutter if the team favors it.
- **Screens:**
  - Auth screen
  - Today (follow-ups list)
  - All Leads (search/sort)
  - Lead Detail (timeline + AI button)
  - Create/Edit Lead
  - Settings (tone presets, timezone, default follow-up intervals)

### Backend
- **Server:** Node.js (Express/Fastify) or Python (FastAPI).
- **Database:** PostgreSQL, with Supabase or Firebase acceptable for rapid prototyping.
- **Auth:** JWT-based token authentication.
- **Push notifications:** OneSignal or Firebase Cloud Messaging (with APNs for iOS).
- **AI integration:** Backend invokes LLM APIs (OpenAI, etc.); clients do not call AI directly.

### Background Processing
- Scheduled job (cron or hosted scheduler):
  - Runs every X minutes.
  - Finds follow-ups due between now and the next 15–60 minutes.
  - Sends grouped push notifications such as **“3 follow-ups due now”** or a single daily reminder at 9 AM.

## Data Model (MVP)

### `users`
- `id` (primary key)
- `email`
- `password_hash` (or external OAuth identifier)
- `created_at`

### `leads`
- `id` (primary key)
- `user_id` (foreign key)
- `name`
- `contact_email`
- `contact_phone`
- `source`
- `value`
- `status` (`open`, `won`, `lost`, `hold`)
- `created_at`
- `updated_at`

### `lead_events`
- `id` (primary key)
- `lead_id` (foreign key)
- `type` (`note`, `followup_scheduled`, `followup_done`, `status_change`)
- `content` (text or JSON)
- `created_at`

### `followups`
- `id` (primary key)
- `lead_id` (foreign key)
- `due_at` (timestamp)
- `status` (`pending`, `done`, `skipped`)
- `goal` (e.g., `check_in`, `send_proposal`, `close_sale`, or free text)
- `channel` (`email`, `phone`, `whatsapp`, `other`)
- `created_at`
- `completed_at` (nullable)

> **Note:** Follow-ups could also be represented as a specialized `lead_event`, but a dedicated table simplifies queries such as “What’s due today?”.

## Branding and Messaging Direction

Design should reassure seasoned, relationship-driven real estate and traditional business professionals while still feeling modern enough for a mobile workflow. Use the following guardrails when creating visual and verbal assets:

- **Color palette:** Deep navy or evergreen primaries paired with warm neutrals (cream, sand) and limited use of energetic accents (burnt orange or gold) for calls to action. Avoid neon or overly playful hues.
- **Typography:** Pair a confident, high-legibility serif or slab-serif for headings (e.g., Freight Display, Sentinel) with a clean humanist sans-serif body font (e.g., Source Sans, Work Sans). Maintain generous sizing and contrast for easy reading.
- **Imagery and motifs:** Favor photography or iconography that evokes established professionals closing deals—handshakes, property walkthroughs, contract reviews—over tech-forward abstractions.
- **Tone of voice:** Friendly, consultative, and sales-focused. Messages should sound like a trusted advisor nudging a colleague—positive, respectful, and never pushy or overly casual.
- **Interaction cues:** Prominent buttons, clear affordances, and minimal clutter so users who are wary of new tools can navigate confidently.

## Additional Inputs Needed to Build the MVP

To turn this specification into a working application, clarify the following areas so the team can translate the flows into concrete implementation tasks:

1. **Design implementation details**
   - Provide logo files, iconography, and final accessibility requirements (contrast ratios, minimum tap targets, localization) that complement the established branding direction.

2. **Platform priorities and release targets**
   - Decide whether the first release should target iOS, Android, or both.
   - Define the launch timeline, beta strategy, and required store assets (screenshots, descriptions).

3. **Authentication and onboarding**
   - Determine whether to support email/password, social logins, or single sign-on providers at launch.
   - Confirm password complexity rules, verification flows, and password-reset channels.

4. **AI follow-up behavior**
   - Supply sample prompts and guardrails so the AI consistently delivers the friendly, sales-focused advisor tone described above, including acceptable language variations.
   - Provide any industry-specific compliance or privacy wording that must appear in AI-generated content.

5. **Notification strategy**
   - Identify daily send times, quiet hours, and escalation rules for overdue follow-ups.
   - Decide whether in-app badges or email reminders accompany push notifications.

6. **Data retention and compliance**
   - Outline policies for storing contact information, handling deletion requests, and complying with GDPR/CCPA if applicable.
   - Provide requirements for audit logs or exports (CSV, CRM integrations).

7. **Integration roadmap**
   - Note any third-party CRMs, calendaring tools, or communication platforms that must be integrated in later milestones.
   - Clarify API keys, rate limits, and sandbox environments for those services.

8. **Success metrics and analytics**
   - Define the KPIs to instrument from day one (e.g., leads created per user, follow-ups completed, AI message usage).
   - Confirm the analytics provider (Mixpanel, Amplitude, Firebase Analytics) and required event taxonomy.

9. **Team workflows**
   - Identify stakeholders for product, design, engineering, and QA sign-offs.
   - Decide on tooling for project tracking (Jira, Linear, Trello) and release management.
