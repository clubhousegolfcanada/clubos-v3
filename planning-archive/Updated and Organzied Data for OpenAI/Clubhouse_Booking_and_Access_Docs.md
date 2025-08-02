# Booking and Access

## Admin Dashboard - View Bookings, Modify Block-out Times, Run Reports, CRM Notes

```
[Admin Dashboard]
        |
  View Bookings (All Locations)
        |
[Filter by Location or Tags]
        |
Modify / Create Block-out Times
        |
 Track Rebooking Count & Flag Abuse
        |
  [Run Reports or Export Data]
        |
     CRM Notes Review
        |
 Apply or Adjust Tags (manual or automated)
```

## Admin Tools - Create Block-Out Times & Access Automated Reporting - Monthly Summaries & Real-Time Reports

```
• Admins can:
• Create block-out times for maintenance, private events, etc.
• Access automated reporting:
• Monthly booking summaries
• Real-time reports (e.g., deposits collected, booking activity)
```

## Advanced Automation - Tag Assignments & Booking Activity Triggers - Hidden Features Access

```
• Tags and booking activity trigger:
• Automated tag assignments based on customer behavior.
• Exclusive access to hidden features/slots based on tags.
```

## Advanced CRM Insights - Customer Lifetime Value & Behavior-Based Upselling

```
8. Advanced CRM & Data Utilization
• Customer Lifetime Insights: Admins receive insights on high-value customers, highlighting those most likely to respond positively to upsells, special offers, or events.
• Behavior-Based Upselling: System automatically identifies opportunities to upsell coaching or premium features based on user activity (e.g., frequent golfer with declining scores gets a coaching recommendation).
```

## Automated Follow-Ups - CRM Notes - SMS & Email Notifications - Post-Booking Surveys

```
• Automated follow-ups:
• Post-booking satisfaction surveys.
• Membership details after certain actions (e.g., after 3 bookings).
• SMS and email notifications required.
• CRM-style notes on customer profiles visible in the booking platform (e.g., noise complaints, late departures, messy behavior).
```

## Booking Automation Rules - No Last-Minute Bookings - Advance Limit & Waitlist

```
• Rules for:
• No last-minute bookings within 1 hour of start time.
• Advance booking limit (e.g., no bookings more than 30 days out).
• Automatic waitlist feature for fully booked slots.
```

## Booking Change Procedure - Process Returns for Price Adjustments - Customer Notification

```
If a customer wants to switch to a booking that is either more or less expensive, first process a standard return using the regular procedure. After the return is complete, notify the customer that they can book a new time at their convenience.
```

## Booking Confirmation Features - Quick Book Again Option - EARLY_ACCESS UI Enhancements

```
On booking confirmation: Offer a “Quick Book Again” option based on previous simulator or time preferences.
• Tag-triggered UI: If user has EARLY_ACCESS tag, show extra booking slots directly on their calendar view.
• “Favorite Sim” Toggle: When selecting a simulator, users can click “Set as Favorite”, speeding up future bookings.
```

## Booking Flow Enhancements - One-Click Rebooking, Member Notifications, Personalized Offers

```
Example Implementation Ideas in Your Booking Flow:
• On booking confirmation, offer “Book Same box Again Next Week?” one-click option.
• When a user gains a new tag (e.g., “Standard member”), trigger a special notification: “Congrats! You’re now a Standard member. Enjoy a discount and added benefits just for coming out!
• During checkout, display a personalized recommendation: “Based on your recent scores, we recommend a coaching session. Book now at 10% off.”
• After a user’s 10th booking, automatically trigger an SMS: “Thanks for being a regular! Your next booking is on us!”
```

## Booking Flow Process - Calendar View to Confirmation - Payment Options & Follow-up

```
[Homepage/Customer Dashboard]
            |
      Click "Book Now"
            |
      [Calendar View]
            |
   Select Date & Simulator
            |
[Sim_Detail Card] + Available Times
            |
   Select Slot & Add-ons
            |
[Apply Discount Code or Loyalty Points]
            |
         Checkout
            |
  [Deposit or Full Payment Option]
            |
      Confirmation Email + SMS
            |
(Optional: Calendar Invite + Reminder)
            |
        Session Day
            |
   PIN Code or Manual Check-in
            |
   [Post-Session Follow-up]
         (Survey, CRM Notes, etc.)
```

## Booking Policy - 30-Minute Increments - Customer Control & Pricing Adjustments

```
• Bookings available in 30-minute increments, with a minimum booking time of 1 hour.
• Customers can modify existing bookings (time/date) within system limits.
• Set booking conditions:
• No bookings shorter than 1 hour.
• Pricing adjustments depending on booking length or time of day.
```

## Booking Requirements - Reservation Policies - Terms and Conditions Overview

```
1. Booking Requirements
```

## Booking System Specifications - Platform Requirements - Full Documentation

```
Full Booking & Platform Requirements
```

## Calendar Booking UI - Clean Interface & Streamlined Flow - Avoid Skedda Confusion

```
• Clean, calendar-based booking UI.
• Streamlined booking flow:
• Avoid confusing elements (e.g., no plus button like in Skedda).
• User-friendly, intuitive interaction.
```

## Calendar Interface Layout - Admin & Customer Views - Location Management & Booking Alerts

```
1. Calendar View (Admin + Customer)
• Grid-style view
• Support Day View and Week View
• Filterable by location, user type, time of day

2. Location Handling
• Support multiple locations
• Customers can view one location or all
• Admin can turn visibility on/off per location

3. Booking Notices / Alerts
• Admin can post alerts tied to locations (e.g. “side screens down”)
• Message should show on booking confirmation and calendar UI until resolved
```

## Clubhouse 247 Staff Guide - Procedures, Codes, and Emergency Protocols

```

```

## Clubhouse Booking Platform - Developer Guide - Backend System Implementation for Jason

```
For: Jason – Backend Booking System Build
Last Updated: June 17, 2025

This document breaks down all functional booking platform requirements into developer-ready language, organized by system layer. Everything here mirrors the master spec but is translated into implementation terms.
```

## Clubhouse Golf Canada - Organizational Chart

```
Name	Title	Reports To	Notes
Mike	CEO / Founder	-	Top leadership
Dylan	VP, Operations & Customer Experience	Mike	Oversees Operations + Customer Experience
Contract Cleaning Services	Contract Cleaning Services	Dylan/Nick	Third-party contractor
Nick Goerz	CX Support	Dylan	Customer support
Alanna	Assistant Marketing Manager	Dylan	Supports marketing initiatives
Jason	CTO	Mike	Technology and IT lead
Nick	Director of Buildouts & Facilities	Mike	Facilities and buildouts
Matt Graham	Commercial Real Estate	Nick	Real estate acquisition
Insurance Broker	Insurance Broker	Nick	Handles insurance policies
Steele Auto	Vehicles Acquisition	Insurance Broker	Manages vehicle purchases
Expansion Lead (Future)	Expansion Lead (Future)	Nick / Jason	Planned future role
Nick Goerz	Facilities Support	Expansion Lead (Future)	Additional facilities role
Fitz & Co (Rob)	Accounting / Bookkeeping	Mike/Dylan	Financial services
```

## Communication & UX Prompts - Booking Confirmation, Upsell, Post-Session Logic

```
1. Booking Confirmation
• Send Email + SMS on:

o Booking created

o Booking changed

o Booking canceled

2. Smart Upsell Prompt
• 10 minutes before session ends, send SMS prompt to extend

o 40% of the time only

o Include booking link, optional discount pricing

3. Post-Session Logic
• Auto-trigger “Book same time next week?” after confirmation
• CRM notes triggered if behavior flags are raised (e.g., messy, noise complaints)
```

## Concierge-Style Automation - Smart Follow-Ups - Personalized Data-Driven Emails

```
9. Concierge-Style Automation
• Smart Follow-Ups: Personalized, data-driven follow-up emails suggesting optimal future booking times based on user patterns or post-session feedback.
```

## Core Booking Logic - Time Rules, Change Logic, Multi-Sim Support, Admin Block Offs

```
1. Time Rules
• Bookings must be in minimum 1-hour blocks
• After the first hour, customers may book in 30-minute increments (e.g., 1.5h, 2h, 2.5h)
• All bookings require a $10 deposit upfront, with the remaining amount charged at the time of the booking
• Customers can reschedule once with no penalty
• A second change is allowed but will flag the user for staff review
• No booking allowed less than 1 hour before slot start time
• Advance Booking Limits:

o New Customers: Max 14 days in advance

o Existing Customers: Max 30 days in advance

2. Change Logic
• Customers can reschedule once via UI
• System should block additional reschedules unless done by admin
• Flag user accounts if excessive changes (>2) are detected

3. Minimum Advance Booking Limits
• Customers cannot book more than 30 days in advance
• System must reject invalid date windows

4. Multi-Sim Support
• Users must be able to select multiple simulator boxes in a single booking
• System should prevent overlap or overbooking

5. Staff/Admin Block Offs
• Admin UI must allow fast block-off for:

o Cleaning

o Maintenance

o Testing/Setup
• Blocked times must be hidden from customer booking interface
```

## Customer and Staff Notifications - Email Confirmations, Calendar Invites, Booking Modifications

```
• Optional customer notifications:
• Confirmation email
• Calendar invite
• Reminder email
• (Reminder emails may be optional if using a PIN-code entry system)
• Internal staff notification on how many times a booking has been modified/rebooked.
```

## Customer FAQs - Session Extension, Projector Issues, Food Policy - Contact Dylan or Jason

```
1. “Can we extend our session?”
• Yes, if the next slot is free. Encourage them to book online or do it on their behalf.
2. “Something’s off with the projector/Trackman.”
• Try restarting the simulator software. If still glitchy, contact Dylan or Jason (IT).
3. “Do you allow outside food or drinks?”
• Policy may vary by location, but generally yes, as long as it’s not disruptive or messy. Remind them to dispose of trash properly.
```

## Customer Notification Procedure - Return Completion and Refund Timeline

```
• Reach out to the customer and let them know the return has been completed.
• Inform them that refunds can take 1–2 business days to appear on their end.
```

## Customer Return Process - Notification Template - Booking Instructions

```
After processing a return, send the following message to the customer: 'The return is complete, so now you can book a new time at your convenience.'
```

## Customer Service Best Practices - Solutions and Experience Protection

```
• “Treat every customer like a regular.”
• “Never say no without offering a solution or alternative.”
• “Protect the experience, not the policy.”
```

## Customer Tier Tags - Color Labeling, Auto-Tagging, Promo Codes - Booking System

```
1. Color Labeling
• Users must be tagged and colored in the booking calendar:

o Yellow = Member

o Blue = New Customer

o Green = Promo (50% off)

2. Auto-Tagging Rules
• After 3 bookings, tag user as “Standard Member”
• After 10 bookings, trigger “Frequent Booker” tag
• Tags can trigger UI perks, hidden slots, etc.

3. Tag-Triggered Features
• Tags may unlock:

o Early access to time slots

o Discount pricing

o Loyalty perks (free hour, surprise reward, etc.)

4. Promo/Gift Code Support
• Accept user-entered codes during checkout
• Code can apply discount or assign tags
• Jason has partial gift card system built — integrate promo logic into that
```

## Custom Tagging System - Discounts, Early Booking, Recurring Bookings - Automated Tags and UI Changes

```
• Custom tagging system for groups or individuals:
• Discounts
• Early booking access
• Recurring bookings
• Other special permissions
• Automated tagging:
• Tags like “Frequent Booker” applied after certain actions (e.g., 10 bookings).
• Tags can trigger exclusive UI changes, such as showing hidden slots or early-access availability.
```

## Daily Operations - Online Booking via Skedda - KISI Access - Stock & Cleaning Protocols

```
• Booking & Access:
• All customer bookings happen online. If a customer needs help, guide them to the booking page or do it on their behalf via Skedda.
• If door access fails, use KISI (remote lock/unlock) or contact IT.
• “Never Run Out” Stock:
• Check that each bay has enough balls, tees, and bottled water.
• If supplies are low, notify Natalie (COO) or log in the supply form immediately.
• Basic Cleaning Upkeep:
• Wipe screens/desks, pick up stray golf balls, empty trash.
• Vacuum if you spot heavy debris or daily recommended cleaning isn’t done yet.
```

## Deposit Policy & Payment Flexibility - Automated Refunds - Cancellation Alerts

```
• Ability to charge a deposit lower than the booking price.
• Customers can freely adjust bookings, but cancellations require an email to request a $10 refund or forfeit it.
• Automated refund system with triggers for alerts or account flags if there are excessive cancellations.
```

## Document Organization Instructions - Emergency, Booking, Tech, Brand Categories - JSON Structure

```
1. Identify which assistant category this content fits: emergency, booking, tech, or brand
2. Split the document into logical sections based on headers, topics, or natural breaks
3. Extract the exact original titles and content - DO NOT rewrite or summarize
4. Keep all specific details, procedures, names, numbers, and exact wording
5. Only organize/split the content, never change the actual text

Return a JSON object with:
{
  "primaryCategory": "emergency|booking|tech|brand",
  "possibleCategories": ["emergency", "booking", "tech", "brand"],
  "sections": [
    {
      "title": "Exact original title or first line",
      "content": "Exact original content with all details preserved",
      "confidence": 0.95
    },
    ...
  ]
}
```

## Emergency Response Procedures - Medical and Security - Contact 911 and Police

```
• Medical: If a customer is injured, call 911, then inform remote support.
• Security: If suspicious activity is noticed, call local police; notify remote support ASAP. message Mike personally 9024783209
```

## Enhanced Admin Tools - Predictive Analytics, Heat Maps, Staff Alerts

```
10. Enhanced Admin Tools & Reports
• Predictive Analytics: Anticipate busy or slow periods, suggest promotions proactively.
• Interactive Heat Maps: Visualize simulator usage, customer traffic patterns, and booking trends over time.
• Staff Alerts: Automatic flags if a customer’s behavior triggers predefined risk indicators (frequent cancellations, no-shows, complaints).
```

## Enhanced Tagging & Rewards - Secret Tags, Dynamic Pricing, Limited-Time Access

```
5. Enhanced Tagging & Rewards
• Secret Tags: Create surprise tags activated by unique achievements (e.g., booking at all locations, booking every simulator).
• Flexible Pricing with Dynamic Tags: Real-time special offers triggered when customers complete certain combinations of bookings, time slots, or repeat bookings.
• Limited-Time Access Tags: Automatically grant short-term exclusive access (e.g., “Black Friday Special,” “Summer Challenge”) visible on their dashboard.
Integrate the live scoreboard page at the clubhouse website into their app or interface.
```

## Friendly Communication Guidelines - Casual Respectful Tone - Solution-Oriented Approach

```
• Always be friendly, concise, and solution-oriented.
• Speak casually but respectfully—like you’re talking to a fellow golfer, not reading from a script.
```

## Gamification & Competition Integration - Leaderboard, Challenges, Badge System

```
1. Gamification & Competition Integration
• Leaderboard Integration: Customers earn points not just for bookings but for session length, frequency, timely check-ins, and survey completions.
• Weekly or Monthly Challenges: Customers completing bookings at less popular hours or consecutive bookings receive additional loyalty rewards.
• Badge System: Special badges earned through various achievements (e.g., “Early Bird,” “Weekend Warrior,” “Nocturnal”) visible on user profiles.
```

## Gateway Reference Code - Locate and Copy Payment Code 'ch_' - Booking Details

```
• Within the booking details, locate and copy the Gateway Reference Code associated with the payment. (at the top of the page and starts with “ch_”)
```

## Key Contacts - IT Support Jason/Dylan - Cleaning Natalie - Ownership Mike/Nick

```
• IT/Tech Support: Jason or Dylan via Slack/Phone
• Cleaning & Supply: Natalie
• Ownership/General: Mike or Nick
```

## Location-Specific Booking Settings - Adjustable Hours, Multi-Location Booking, Pricing Rules

```
• Adjustable hours of availability per location (support for non-24/7 operations).
• Multi-location booking:
• Customers can view and book across multiple locations.
• Clear location and box confirmation step.
• Location-specific pricing and deposit rules (e.g., new locations may have introductory rates).
```

## Membership & Loyalty Features - Track Points & Automated Perks - Booking Rewards

```
• Track loyalty points or rewards based on booking frequency.
• Automated perks (e.g., unlock a free session after X bookings).
```

## Modify Customer Booking - Skedda Process - Create and Confirm New Booking

```
To modify a customer booking, create a new booking to trigger a confirmation email. Follow these steps: 1. Update the Original Booking to $0 in Skedda. 2. Delete the Original Booking. 3. Create a New Booking under the customer’s name, accepting terms and conditions. 4. Confirm the New Booking with a price of $0.
```

## On-Location Digital Check-In Kiosks - Instant Replay Video Snippets - Physical-Digital Integration

```
11. Physical-Digital Integration
• On-Location Digital Check-In Kiosks: Allow customers to modify add-ons, extend sessions (if available), or schedule follow-up bookings from in-store kiosks.
• “Instant Replay”: Offer video snippets or data snapshots of the best swings or shots from simulator sessions, sharable on social media.
```

## Payment & Checkout - Apply Discount Codes - Purchase Add-ons & Upsells

```
• Ability for customers to:
• Apply discount codes or credits at checkout to reduce manual interventions.
• Purchase add-ons such as:
• Storage locker rentals
• Memberships
• Coaching sessions
• Other upsells
```

## Privacy & Security Roles - Admin Access - Customizable Permissions for PGA Coach & More

```
• Regular members cannot see other customers’ names or booking info.
• Admins or designated roles (e.g., Manager, Event Coordinator) can view broader details.
• Additional role types (e.g., PGA Coach, Cleaner, Delivery Driver) with customizable permissions (e.g., limit number of modifications per month).
```

## Role-Based Access & Permissions - Admin, Staff, Cleaners, Coaches - CRM Notes Policy

```
1. Role-Based Access Tiers
• Admin: full access
• Staff: booking view/edit, limited control
• Cleaners: view-only schedule
• Coaches: view schedule + own clients

2. CRM Notes
• Add manual notes to customer profiles (e.g., “late last 3 visits”)
• Notes viewable by Admin/Staff only
```

## Simulator Booking Features - Display Images & Descriptions - Favorite Quick-Book Option

```
• Display image and description of each simulator when selecting a time slot.
• Option for “favorite simulator” quick-book based on customer preferences.
```

## Skedda Booking Management - Locate and Edit Booking Details - Daily View Tips

```
• Log in to Skedda.
• Find the specific booking that requires a return.
• Click “View/Edit Details” to open the full booking information.
Tip: go to daily view on the day associated with the return.
```

## Skedda Booking Removal Procedure - Refund Process - Calendar Update

```
• Now that the charge has been refunded and the booking is $0,
you can remove the booking from the calendar.
```

## Skedda Booking Update Procedure - Set Price to $0 - Save Changes

```
• Return to Skedda and change the booking price to $0.
• Click “Save” to update the record.
```

## Social Booking Features - Invite Friends via Booking Interface - Seamless Coordination

```
2. Social & Community Features
• Social Booking: Invite friends directly through the booking interface and coordinate bookings seamlessly.
```

## Staff Essentials Reference - Quick Guide for Daily Operations - On-Site Manager Resource

```
Purpose: Provide staff (or on-site managers) with a concise, front-and-center reference for day-to-day essentials—so they don’t have to dig into the full Operations Manual.
```

## Stripe Refund Process - Use Gateway Reference Code for Charge Search

```
• Open Stripe and paste the Gateway Reference Code into the search bar.
• The related charge should appear.
• Click on the charge, then click “Refund”, and confirm the return.
```

## UI Design Specifications - User Interface Requirements - Version 2

```
2. UI Requirements
```

## User Behavior Tracking - Reschedule Alerts, Usage Logs, Loyalty Rewards - Monthly Reports

```
1. Track Reschedule Count per User
• Alert if a user frequently changes bookings

2. Usage Logs & Export Tools
• Booking history by user
• Export monthly reports, customer activity, tag data

3. Loyalty Tracking
• Reward after 10 sessions (e.g., 11th is free)
• Badge/achievement system optional (not urgent)
```

## VIP Access & Early Booking - Exclusive Event & Tournament Features

```
4. Exclusive Event & Tournament Features
• VIP Access & Early Booking: Exclusive slots or early access for tournament participants or VIP members.
```

## Clubhouse Golf Canada - Organizational Chart

```
Name	Title	Reports To	Notes
Mike	CEO / Founder	-	Top leadership
Dylan	VP, Operations & Customer Experience	Mike	Oversees Operations + Customer Experience
Contract Cleaning Services	Contract Cleaning Services	Dylan/Nick	Third-party contractor
Nick Goerz	CX Support	Dylan	Customer support
Alanna	Assistant Marketing Manager	Dylan	Supports marketing initiatives
Jason	CTO	Mike	Technology and IT lead
Nick	Director of Buildouts & Facilities	Mike	Facilities and buildouts
Matt Graham	Commercial Real Estate	Nick	Real estate acquisition
Insurance Broker	Insurance Broker	Nick	Handles insurance policies
Steele Auto	Vehicles Acquisition	Insurance Broker	Manages vehicle purchases
Expansion Lead (Future)	Expansion Lead (Future)	Nick / Jason	Planned future role
Nick Goerz	Facilities Support	Expansion Lead (Future)	Additional facilities role
Fitz & Co (Rob)	Accounting / Bookkeeping	Mike/Dylan	Financial services
```

## Clubhouse Golf Canada - Organizational Chart

```
Name	Title	Reports To	Notes
Mike	CEO / Founder	-	Top leadership
Dylan	VP, Operations & Customer Experience	Mike	Oversees Operations + Customer Experience
Contract Cleaning Services	Contract Cleaning Services	Dylan/Nick	Third-party contractor
Nick Goerz	CX Support	Dylan	Customer support
Alanna	Assistant Marketing Manager	Dylan	Supports marketing initiatives
Jason	CTO	Mike	Technology and IT lead
Nick	Director of Buildouts & Facilities	Mike	Facilities and buildouts
Matt Graham	Commercial Real Estate	Nick	Real estate acquisition
Insurance Broker	Insurance Broker	Nick	Handles insurance policies
Steele Auto	Vehicles Acquisition	Insurance Broker	Manages vehicle purchases
Expansion Lead (Future)	Expansion Lead (Future)	Nick / Jason	Planned future role
Nick Goerz	Facilities Support	Expansion Lead (Future)	Additional facilities role
Fitz & Co (Rob)	Accounting / Bookkeeping	Mike/Dylan	Financial services
```

## Calendar Interface Layout - Admin & Customer Views - Location Management & Booking Alerts

```
1. Calendar View (Admin + Customer)
• Grid-style view
• Support Day View and Week View
• Filterable by location, user type, time of day

2. Location Handling
• Support multiple locations
• Customers can view one location or all
• Admin can turn visibility on/off per location

3. Booking Notices / Alerts
• Admin can post alerts tied to locations (e.g. “side screens down”)
• Message should show on booking confirmation and calendar UI until resolved
```

## Clubhouse Booking Platform - Developer Guide for Backend System - Jason's Implementation

```
For: Jason – Backend Booking System Build
Last Updated: June 17, 2025

This document breaks down all functional booking platform requirements into developer-ready language, organized by system layer. Everything here mirrors the master spec but is translated into implementation terms.
```

## Clubhouse Golf Canada - Organizational Chart

```
Name	Title	Reports To	Notes
Mike	CEO / Founder	-	Top leadership
Dylan	VP, Operations & Customer Experience	Mike	Oversees Operations + Customer Experience
Contract Cleaning Services	Contract Cleaning Services	Dylan/Nick	Third-party contractor
Nick Goerz	CX Support	Dylan	Customer support
Alanna	Assistant Marketing Manager	Dylan	Supports marketing initiatives
Jason	CTO	Mike	Technology and IT lead
Nick	Director of Buildouts & Facilities	Mike	Facilities and buildouts
Matt Graham	Commercial Real Estate	Nick	Real estate acquisition
Insurance Broker	Insurance Broker	Nick	Handles insurance policies
Steele Auto	Vehicles Acquisition	Insurance Broker	Manages vehicle purchases
Expansion Lead (Future)	Expansion Lead (Future)	Nick / Jason	Planned future role
Nick Goerz	Facilities Support	Expansion Lead (Future)	Additional facilities role
Fitz & Co (Rob)	Accounting / Bookkeeping	Mike/Dylan	Financial services
```

## Communication & UX Prompts - Booking Confirmation, Upsell, Post-Session Logic

```
1. Booking Confirmation
• Send Email + SMS on:

o Booking created

o Booking changed

o Booking canceled

2. Smart Upsell Prompt
• 10 minutes before session ends, send SMS prompt to extend

o 40% of the time only

o Include booking link, optional discount pricing

3. Post-Session Logic
• Auto-trigger “Book same time next week?” after confirmation
• CRM notes triggered if behavior flags are raised (e.g., messy, noise complaints)
```

## Core Booking Logic - Time Rules, Change Logic, Multi-Sim Support, Admin Block Offs

```
1. Time Rules
• Bookings must be in minimum 1-hour blocks
• After the first hour, customers may book in 30-minute increments (e.g., 1.5h, 2h, 2.5h)
• All bookings require a $10 deposit upfront, with the remaining amount charged at the time of the booking
• Customers can reschedule once with no penalty
• A second change is allowed but will flag the user for staff review
• No booking allowed less than 1 hour before slot start time
• Advance Booking Limits:

o New Customers: Max 14 days in advance

o Existing Customers: Max 30 days in advance

2. Change Logic
• Customers can reschedule once via UI
• System should block additional reschedules unless done by admin
• Flag user accounts if excessive changes (>2) are detected

3. Minimum Advance Booking Limits
• Customers cannot book more than 30 days in advance
• System must reject invalid date windows

4. Multi-Sim Support
• Users must be able to select multiple simulator boxes in a single booking
• System should prevent overlap or overbooking

5. Staff/Admin Block Offs
• Admin UI must allow fast block-off for:

o Cleaning

o Maintenance

o Testing/Setup
• Blocked times must be hidden from customer booking interface
```

## Customer Tier Tags - Color Labeling, Auto-Tagging, Promo Codes - Booking Calendar

```
1. Color Labeling
• Users must be tagged and colored in the booking calendar:

o Yellow = Member

o Blue = New Customer

o Green = Promo (50% off)

2. Auto-Tagging Rules
• After 3 bookings, tag user as “Standard Member”
• After 10 bookings, trigger “Frequent Booker” tag
• Tags can trigger UI perks, hidden slots, etc.

3. Tag-Triggered Features
• Tags may unlock:

o Early access to time slots

o Discount pricing

o Loyalty perks (free hour, surprise reward, etc.)

4. Promo/Gift Code Support
• Accept user-entered codes during checkout
• Code can apply discount or assign tags
• Jason has partial gift card system built — integrate promo logic into that
```

## Role-Based Access Permissions - Admin, Staff, Cleaners, Coaches - CRM Notes Policy

```
1. Role-Based Access Tiers
• Admin: full access
• Staff: booking view/edit, limited control
• Cleaners: view-only schedule
• Coaches: view schedule + own clients

2. CRM Notes
• Add manual notes to customer profiles (e.g., “late last 3 visits”)
• Notes viewable by Admin/Staff only
```

## User Behavior Tracking - Reschedule Alerts - Usage Logs & Loyalty Rewards System

```
1. Track Reschedule Count per User
• Alert if a user frequently changes bookings

2. Usage Logs & Export Tools
• Booking history by user
• Export monthly reports, customer activity, tag data

3. Loyalty Tracking
• Reward after 10 sessions (e.g., 11th is free)
• Badge/achievement system optional (not urgent)
```
