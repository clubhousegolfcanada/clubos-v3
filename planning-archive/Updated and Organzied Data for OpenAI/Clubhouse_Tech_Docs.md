# Tech

## Clubhouse Admin Tasks - Monthly Checklist - Start of Month Procedures

```
Start of Month Clubhouse Admin Task List
```

## Computer Maintenance Checklist - Update Drivers, Windows, Game Software - Subscription Management: Trackman, Kisi, Hubspot, Skedda

```
Computers:
	• Update drivers
	• Update Windows
	• Update game software
	• Check usernames
	• Verify game settings
	• Dust system
	• Update music PCs

Check Subscriptions List
Trackman, Kisi, Hubspot, Skedda, specific (Critical Subs).
```

## Financial Reconciliation - Receipts, Gross Revenue vs Expenses - Quarterly Feedback

```
• Receipts reconcile
• Record each location gross rev. vs expenses.
• Email Quarterly update and ask for feedback or what the team want to see
```

## HubSpot Customer Database Review - Optimize Monthly Forms and Lists

```
• Review customer database
• Optimize forms and lists from the previous month
```

## Marketing Update - Google Ads, Website Pages, Giveaways, Emails - October 2023

```
Update:
	• Google Ads
	• Website pages (home, promo, etc.)
	• Replace last month’s giveaways
	• Winner post (Instagram)
	• Update advertising PCs (remote)
Email
	• Winner email and new giveaway announcement
	• Membership loss/renewal/Club+ renewal email
	• Check for new standard members
	• Members-only update?
	• Google review email
```

## Skedda Booking Analysis - Review Tags and Gift Card Utilization - Promo Adjustments

```
• Review tags
• Compare gift card tags with the number of bookings and activation dates
• Review location utilization and adjust promo if necessary
```

## Tournament Management - Review Payouts and Create New Events - Update and Post

```
• Review tournaments and pay out winners
• Create new tournaments and update/post
•
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

## 24/7 Expert Support - No Hiring or Training - Facility Efficiency & Visibility

```
* No more hiring, training, or stress
* Customers get expert support, 24/7
* Your facility runs like it’s fully staffed—with no added labor
* You gain visibility and peace of mind
```

## AI Decision Support Tools - Blind Spot Detection, Cognitive Dashboard, Delta Tracker

```
• Can be used personally or team-wide
• Best when paired with:
	o Blind spot detection system
	o Cognitive dashboard (track overload vs underuse)
	o Delta tracker (log misalignments between AI + human decisions)
```

## AI-Human Collaboration - Prevent Over-Reliance - Agile Scaling & Cognitive Alignment

```
• Prevents over-reliance on either party (human or AI)
• Ensures scaling decisions are paired with cognitive alignment
• Designed to stay agile as capability boundaries shift over time
```

## AI Workflow Optimization - Overcome Perfectionism, Value Hoarding, and Passive Drift

```
• Stalling from Perfectionism:
Don’t wait for a perfect AI workflow before offloading. If it’s 80% effective, start using it.
• Ego-Based Value Hoarding:
Avoid saying “I have to do this” just because you’ve always done it. That’s not leverage — that’s friction.
• Passive Drift:
Every few weeks, re-audit. What was once cutting-edge delegation can become outdated without realizing.
```

## Automation Add-Ons - Remote Door Unlock, Projector AV Control, Live Monitoring

```
• Remote door unlock
• Projector + AV control
• Live usage monitoring + analytics
```

## BenQ LK935ST/LK936ST Projector - 4K Short-Throw Laser - 5500+ Lumens - $3,500

```
BenQ LK935ST or LK936ST – 4K short-throw, laser-powered, 5500+ lumens. Future-compatible with newer BenQ models as released.
Cost: $3,500
```

## Clubhost System Specs - Flex Range Cost - Modular & Scalable Design

```
• Flex Range: $14K cost swing is primarily due to launch monitor selection.
• Modular Design: Every component is optimized for repairability and swap-out during upgrades.
• Scalability: All systems are designed to scale across multiple locations with repeatable wiring and mounting logic.

This document is maintained in the Clubhost-branded system and will auto-update as specs evolve. Always reference this file before procurement or install planning.
```

## Clubhouse Admin Tasks - Monthly Checklist - Start of Month Procedures

```
Start of Month Clubhouse Admin Task List
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

## Clubhouse Partnership - Simulator Box Project at River Oaks - Trackman Tech & Branding

```
### **Simulator Box Project**

* **Location**: Inside the River Oaks clubhouse
* **Technology**: Trackman-powered with full Clubhouse branding and automation
* **Dual-Sided Support**: Configured for both left- and right-handed players
* **Ownership**: Tech and signage remain Clubhouse property; walls or slabs = River Oaks property
* **Deposit**: \$12,500 (invoiced by Clubhouse, refundable via e-transfer, Visa, etc.)

  * The deposit will be **returned in full after 12–18 months** of consistent usage and mutual satisfaction of partnership conditions
  * If there is ever disagreement about damage, **Clubhouse will simply take care of it** — all systems are monitored by video and logs
* **Timeline**: Installed by **end of August 2025** to allow for testing before winter
* **Access**: Clubhouse retains full operational access

  * Exceptions: Staff parties (e.g., Christmas), approved charity events, case-by-case collaboration
* **Testbed Use**: River Oaks is a designated **pilot location** for new Clubhouse technology and UI testing, including single-box layout environments, updated user flows, and full Ubiquiti access control systems

  * **Jason** is overseeing backend and interface testing for this one-box setup
* **Staffing**: This is a fully automated simulator box. There are **no on-site Clubhouse staff** — all access, troubleshooting, and customer service is remote
* **Financial Structure**: Clubhouse owns and operates the simulator fully. River Oaks has no equipment costs, fees, or revenue-sharing obligations
* **Signage Opportunity**: Clubhouse and River Oaks will explore possible **collaborative signage** on or near the new roadside sign. Visual mockups and branding concepts will be created and reviewed with Graeme before implementation

### **Branding and Identity: “Powered by Clubhouse”**

* All simulator boxes at River Oaks will be marketed as **“Powered by Clubhouse”**.
* Customers will experience the same seamless automation and premium standards as standalone Clubhouse locations.
* Allows River Oaks to elevate indoor offerings while keeping full control of their space and community identity.

### **Event Integration: The Invitational**

* **Event Name**: *The Invitational* (by Clubhouse)
* **Date**: October 29, 2025
* **Purpose**: Outdoor season send-off + indoor sim season launch
* **Personal Origin**: Inspired by Dylan’s golf history with his father (Dale)
* **Tone**: Not cheesy or sentimental — grounded, legacy-minded, thoughtful

### **Golf Pass Program**

* **Offer**: 50 physical golf passes = 200 simulator hours
* **Usage**: For giveaways, membership perks, promo tools
* **Rationale**: A fairer exchange aligned with simulator capacity and market value
```

## Clubhouse Partnership Vision - Graeme's Insights on Collaborative Golf Spaces

```
* **Graeme** appreciates companies that listen, care about the experience, and don't try to dominate the space.
* **Clubhouse** excels by being collaborative, adaptive, and obsessively detailed.
* This partnership sets the tone for future installations **where Clubhouse integrates into traditional golf spaces** and expands beyond standalone units.
```

## Clubhouse Simulator Box Cost Breakdown - Budgeting & Installation Planning - Investor Visibility

```
Last Updated: June 13, 2025
Branded format: Poppins font, Clubhouse Green (#152F2F), white background. Structured for easy updates. Optimized for budgeting, installation planning, and investor visibility.
```

## ClubOS 24/7 Support - Solve Tech Issues, System Resets, Booking Disputes

```
Most sim facilities lean on owners or part-timers for:

• Late-night tech issues
• System resets
• Refund calls, access issues, or booking disputes

Result: burnout, inconsistency, and lost revenue from returns or customer accommodations… and what if you have 100 bookings a day?  
ClubOS replaces this chaos with embedded 24/7 support—built and run by real operators.

Picture is of internal Clubhouse systems used.
```

## ClubOS Booking Beta Testing - Upcoming Features and Updates

```
Now beta testing: ClubOS Booking
```

## ClubOS Booking Infrastructure Testing - Future Managed System Support - Centralized Operations

```
We are currently testing ClubOS booking infrastructure internally and may offer fully managed booking system support as an optional layer in the near future. This would further centralize ops under one expert-driven system—without adding work on your end.
```

## ClubOS Human-Led Operating System - Unattended Simulator Locations Support

```
ClubOS is not software.
It’s a fully managed, **human-led operating system for unattended sim locations**.

We don’t just automate. We run support *for you*—with trained simulator professionals in the loop at all times.
```

## ClubOS Performance Metrics - Automated Sim Support - 10,000+ Bookings

```
Proven Results
• 10,000+ bookings supported
• 220+ 5-star customer reviews
• 99.98% resolution without owner involvement
• Estimated response time to customer is less than 1 minute. Fix is less than 5. 
Why ClubOS?
Not just software. A full operating system for automated sim locations.
We don’t replace your support team. We are the support team, at scale with your business info and practices. And if we must contact you? We update the system so next time we don’t.
```

## ClubOS Success Metrics - 10,000+ Bookings & 250+ Reviews - Unattended Golf Facilities

```
* 10,000+ bookings supported
* 250+ five-star reviews
* 99.98% resolution success rate without owner intervention

We’ve used ClubOS to run our own fully unattended Clubhouse 24/7 Golf facilities. Now, we offer the same system to other operators who want to scale without friction.
```

## ClubOS Support Structure - Two Categories for Clarity and Control

```
**ClubOS support is structured into two categories for clarity and control:**
```

## ClubOS Support Subscription - Real Sim Operators - Unattended Facility Assistance

```
Built by real sim operators, for unattended facilities that need real support.
```

## ClubOS Support Suite Proposal - Clubhouse 24/7 Golf - Simulator Facility

```
**Prepared For:** \[Simulator Facility / Investor Name]**Prepared By:** Clubhouse 24/7 Golf – Internal Systems Division**Date:** \[Insert Date]
```

## Commercial Golf Simulator Enclosure - Great North Golf - Dimensions & Setup

```
Commercial-grade enclosure with impact screen, turf underlayer, and full frame protection. Either custom-built or pre-fabricated from Great North Golf (formerly Northern Golf Company). Includes blackout screen mounted behind the impact screen to block light bleed.

Recommended Dimensions:
• Width: 16 feet or more
• Height: 10.5 to 11 feet
• Depth (total room length): 25 to 35 feet
o ~10 feet from hitting strip to screen
o +1 foot behind screen for padding and airflow
o ~15 to 20 feet of space behind the golfer for radar clearance and swing safety

Infrastructure Notes:
• Projector cabling requires a wall penetration or ceiling conduit 20–25 feet from the screen
• TrackMan mounts 3.5 feet forward from the hitting strip, centered
• Electrical outlets required in three locations: ceiling (projector/sound), table location (PC/touchscreen), and at least one side wall

Cost: $13,000
```

## Computer Maintenance Tasks - Update Drivers, Windows, Game Software - Subscription Check: Trackman, Kisi, Hubspot, Skedda

```
Computers:
	• Update drivers
	• Update Windows
	• Update game software
	• Check usernames
	• Verify game settings
	• Dust system
	• Update music PCs

Check Subscriptions List
Trackman, Kisi, Hubspot, Skedda, specific (Critical Subs).
```

## Content Categorization and Organization - Emergency, Booking, Tech, Brand - Detailed Instructions

```
1. Identify which assistant category this content fits: emergency, booking, tech, or brand
2. Split the document into logical sections based on headers, topics, or natural breaks
3. Extract the exact original titles and content - DO NOT rewrite or summarize
4. Keep all specific details, procedures, names, numbers, and exact wording
5. Only organize/split the content, never change the actual text
```

## Customer Interaction Logging - Time-Stamped Visibility - ClubOS Friction Analysis

```
* Every customer interaction, reset, refund, or escalation is time-stamped and logged
* You receive ongoing visibility into what’s happening at your facility
* ClubOS identifies recurring friction points and provides recommendations—without requiring you to dig through data
```

## Customer Support Breakdown - Outside/Inside Sim - TrackMan/Foresight Troubleshooting

```
1. OUTSIDE-THE-SIM SUPPORT
Handles customer questions before/after sessions:
• Booking/payment issues
• Access problems
• Forgotten items
• General questions

How it works:
• QR code signage in every bay → instant SMS support
• Facility support line (text-only)
• Answers matched to your pre-filled policies
• All interactions logged

2. INSIDE-THE-SIM SUPPORT
Support during live sessions:
• TrackMan / Foresight troubleshooting
• Remote resets
• Live SMS walk-throughs
• Optional video monitoring

Setup:
• Secure remote desktop software
• Discreet bay camera (1 per bay)
• ClubOS intake form (your pricing/policies)
• Access system: Kisi / Ubiquiti / similar
• UPS backup (recommended)
• Booking/refund access (if outside support enabled)
```

## Durable Seating Set - Table and Two Chairs for Social/Tournament Use - $500

```
Table and two durable chairs for social or tournament use.
Cost: $500
```

## Financial Reconciliation - Receipts, Gross Revenue vs Expenses - Quarterly Update Feedback

```
• Receipts reconcile
• Record each location gross rev. vs expenses.
• Email Quarterly update and ask for feedback or what the team want to see
```

## Financial Report Breakdown - Revenue, Expenses, Profit Analysis - Q3 2023

```

```

## Golf Club Storage Solutions - 2x Vertical Holders - Amazon Accessories Update

```
2x vertical golf club holders, Amazon-sourced. Updated estimate includes minor accessory changes.
Cost: $150
```

## High-End Hitting Mat & Commercial Putting Turf Installation - $1,500 Cost

```
High-end hitting mat ($500) combined with commercial putting turf installation ($1,000). Softened underlay used where required.
Cost: $1,500
```

## HubSpot Customer Database Review - Optimize Monthly Forms and Lists

```
• Review customer database
• Optimize forms and lists from the previous month
```

## Human-Managed Support - Real Operators & Sim Ops Experts - Fast Response

```
* All support is monitored and managed by real operators—not just AI
* If automation doesn’t resolve it, the issue routes to our internal specialist network (up to 10 sim ops experts)
* Customers get fast, clear responses from people who know sim systems inside and out
```

## Key Stakeholders & Leadership Dynamics - Carson Wei, Graeme Burke, Brady Burke, Justin Burke, Jordan Oakey

```
### **Carson Wei** – Owner

* Has not visited River Oaks since **2022**.
* Diagnosed with ASD; avoids social situations.
* Derives emotional satisfaction from **hearing positive feedback** about the course.
* Delegated full operational authority to Graeme Burke.

### **Graeme Burke** – General Manager (GM)

* Day-to-day decision-maker and operational leader.
* Values autonomy, collaboration, and respect.
* Proud of Carson’s trust in him.
* Rejected Better Golf for their arrogance.
* Believes in **presentation and experience-first operations**.
* Appreciates brands that don’t posture, overpromise, or try to dominate — collaboration and humility matter.

### **Brady Burke** – Family

* Son of Graeme Burke.
* Well-liked within the community.
* Maintains a close relationship with Justin Burke.

### **Justin Burke** – Clubhouse Advocate

* Half-brother of Graeme.
* Loyal Clubhouse user and supporter.
* Very close with Brady Burke.

### **Jordan Oakey** – Influencer

* Close friend of Graeme Burke.
* Well-connected regionally (Brightwood member).
```

## Marketing Updates - Google Ads, Website, Giveaways, Emails - October 2023

```
Update:
	• Google Ads
	• Website pages (home, promo, etc.)
	• Replace last month’s giveaways
	• Winner post (Instagram)
	• Update advertising PCs (remote)
Email
	• Winner email and new giveaway announcement
	• Membership loss/renewal/Club+ renewal email
	• Check for new standard members
	• Members-only update?
	• Google review email
```

## Mounting & Cabling Tools - HDMI, USB, Surge Protection, Laser Alignment - Installation Kit

```
Includes HDMI, USB, surge protection, raceways, wall fasteners, mounting brackets, and laser alignment tools used during install calibration.
Cost: $600
```

## Operator-Led Support - Real People, Full Transparency - Ticket Logging & Insights

```
REAL PEOPLE
• 100% operator-led
• 5+ sim support specialists
• We complete refunds based on your SOP when needed
• You only get involved if we can’t solve it

FULL TRANSPARENCY
• Every ticket logged
• Timestamped session data
• Monthly insights and escalation trends
```

## Outside-the-Sim Support - Booking Issues, Access, Payments, Inquiries - QR Code Text Support

```
Covers anything *before or after* the booking session:

* Booking issues
* Entry/access problems
* Forgotten items
* Payment questions
* General inquiries

We can fully handle these on your behalf if your system allows it. If not, they’re cleanly routed to you or your team with full context and history attached.

This support is initiated through clearly placed signage in every bay. Customers scan a QR code that routes directly to our system, allowing them to text us for support. Additionally, we provide a dedicated support contact line listed on your facility's website. This line is **text-only**—any voice calls to the number will trigger an automatic message instructing the caller to text instead. If you choose to offer phone support separately, you retain control of that.

What this looks like in practice:

* A customer scans the bay signage or texts the support number
* Messages like “I’m having trouble booking,” “Do you have clubs on site?” or “How many people can I bring?” are all routed to us
* Our team uses your facility’s pre-filled policy questionnaire to answer on your behalf, exactly how *you* would
* Every interaction is logged and stored for reference in case of disputes
```

## Proactive Refund Policy - Immediate Branded Refunds - Customer Issue Escalation

```
* If a problem can’t be resolved live, we issue a branded refund immediately
* We notify the customer that the issue was escalated to the operator for resolution
* You’re only looped in when absolutely necessary
```

## Rack-Mounted Gaming PC - Intel i7/i9 - NVIDIA RTX 5070+ - 1TB NVMe SSD - $3,500

```
Clubhouse-standard rack-mounted PC, wall-installed. Built for sim graphics and performance headroom.

Required Specs:
• Intel i7 or i9 CPU
• NVIDIA RTX 5070 or better
• 1TB NVMe SSD (7000+ MB/s read/write)
• 800W+ power supply
• 32–64GB RAM
• CPU air cooler (preferred); water cooler (optional)

Included Accessories:
• Logitech K400 Plus wireless keyboard + trackpad combo
• 3x SmallRig phone holders per bay (for swing capture/media use)

Cost: $3,500
```

## Range Pods Pilot Project - Foresight Falcon Launch Monitor - River Oaks Clubhouse

```
### **Concept**

* Clubhouse is testing **Range Pods** at River Oaks — self-contained, weatherproof practice pods with advanced tracking.
* Each Range Pod is equipped with a **Foresight Falcon** launch monitor, providing industry-leading precision in outdoor conditions.
* These units allow golfers to practice with full feedback on tempo, ball flight, and club path even during off-peak hours or poor weather.

### **Operational Notes**

* Range Pods will be **seasonal** — operational spring through fall, then **stored indoors during winter** to protect sensitive equipment.
* Electronics will be removed or secured as needed for winter storage.

### **Goal**

* Extend practice utility of the range even when traditional range hours or weather limit access.
* Eventually tie into the Clubhouse ecosystem for swing data tracking, leaderboard challenges, and off-season competitions.
```

## Remote Door Access - Projector AV Control - Live Monitoring Upgrades

```
* Remote door access setup + customer unlock support
* Projector and AV control
* Live usage monitoring + trend tracking
```

## Richelieu Flush-Mount Wireless Chargers - Seating Area Integration - Cost $100

```
2x Richelieu flush-mount wireless chargers integrated into the seating area or side shelf.
Cost: $100
```

## River Oaks Golf Club - Clubhouse Partnership - Trackman Simulator Installation

```
**Location**: River Oaks Golf Club, Nova Scotia
**Partnership Type**: Indoor simulator box installation + broader infrastructure support
**Clubhouse Role**: Technology provider, indoor simulator operator, experience designer
**River Oaks Role**: Venue provider and community-facing golf course

River Oaks is the **first-ever outdoor golf course to partner with Clubhouse**. This represents a major step forward in Clubhouse’s growth: expanding from standalone indoor locations to a fully integrated, hybrid model within traditional golf environments.

Clubhouse is installing and managing a premium Trackman-powered golf simulator box inside the River Oaks clubhouse. This is part of a long-term strategy to blur the line between indoor and outdoor golf, make River Oaks a year-round destination, and demonstrate the future of automated Clubhouse installations hosted within partner venues.
```

## River Oaks Golf Innovations - Clubhouse Integration - Foresight Falcon Testing

```
* River Oaks is a **flagship proof-of-concept** for:

  * Seamless indoor/outdoor golf season transitions
  * Tech-forward infrastructure upgrades (Wi-Fi, automation)
  * Mutually beneficial partnerships where the golf course remains fully in control, and Clubhouse powers the experience behind the scenes
  * **“Powered by Clubhouse” installations** that enhance traditional golf venues while maintaining their identity
  * Testing of **Range Pods with Foresight Falcon launch monitors** as a scalable innovation for outdoor year-round training
  * Operational learnings on **seasonal shutdowns and winter protection for outdoor systems**
  * **First hybrid integration of a Clubhouse system inside a real golf course**
  * Pilot site for **Jason’s backend and system interface testing**
  * **Blueprint for national partner-hosted Clubhouse expansions**
```

## River Oaks Physical Upgrades - Clubhouse Equipment Ownership - Simulator Testing Pilot

```
* **All physical upgrades (walls, slabs, etc.) belong to River Oaks**
* **All equipment, tech, and signage remains Clubhouse property**
* **Simulator will be tested over several months to ensure winter readiness**
* **This is a pilot for future Clubhouse x Golf Course integrations across Atlantic Canada**
* **River Oaks serves as the blueprint for partner-hosted Clubhouse installations at other courses**
```

## River Oaks Wi-Fi Expansion - Ubiquiti UniFi Mesh - Full Course Coverage Plan

```
### **Summary**

River Oaks will offer the **farthest-reaching Wi-Fi coverage of any golf course in the region**, with the ability to expand to full course coverage in the future. This infrastructure benefits the demographic that values staying connected for work but would rather spend their day at River Oaks.

This system uses **power-only, wireless backhaul infrastructure** to eliminate trenching and Ethernet runs. All gear is **fully owned by River Oaks**, ensuring long-term independence regardless of future partnerships.

### **Technical Infrastructure Plan**

#### Clubhouse (Main Hub)

* 1x UDM and 24-port PoE switch (pre-installed)
* 3x **Device Bridge Pro Sector** units for long-range directional broadcasting
* 1x **U7 Outdoor Access Point** for local clubhouse coverage
* 1x **U7 Long-Range Access Point** (optional directional boost)

#### Powered Remote Sites (No Ethernet)

Each powered site includes:

* 1x **Device Bridge Pro** (receiving signal)
* 1x **Switch Flex Utility** (weatherproof PoE passthrough)
* 1x **U7 Outdoor** or **U7 Long-Range** Access Point

#### Confirmed Node Locations

1. **Storage Building** (235m from clubhouse, power available)
2. **Parking Lot Pole** (~100m from clubhouse, power will be added)
3. **Future Expansion**: Additional nodes across the course as power becomes available

### **Equipment List Summary**

* 3x Device Bridge Pro Sector
* 3x Device Bridge Pro
* 3x U7 Outdoor Access Points
* 2x U7 Long-Range Access Points
* 3x Switch Flex Utility
* 1x UniFi Cat6 Cable Box
* 5x PoE+ Injectors (optional backups)
* 1x Switch Flex 3-Pack (optional future expansion)

### **Coverage Expectations**

* Wi-Fi signal extends **up to 700 feet in all directions** from each node using pro-grade gear
* Initial install will cover: clubhouse, parking lot, and storage shed areas
* System is preconfigured to add 2 more APs anytime, anywhere on the course
* Designed to prioritize **tee boxes and greens** where golfers use phones for yardages, scoring, or tournaments
* Full course coverage estimated to require 10–15 nodes over time

### **Installation & Expansion Timeline**

* Base install covers clubhouse + 2 powered nodes
* Additional nodes will be **free to install** — River Oaks pays only for new gear (~\$500/node)

### **Marketing & Strategic Value**

* Solves mobile dead zones without disrupting the grounds
* Reinforces River Oaks’ reputation as a tech-forward, innovative course
* Helps **pressure carriers to improve local cell tower service** by showing real user demand

### **Ownership Terms**

* All Wi-Fi infrastructure is fully owned by River Oaks
* If Clubhouse partnership ever ends, network remains fully operational and under River Oaks’ control

### **Technical Details**

* **Cost**: \$5,000 + tax (all-inclusive install)
* **Technology**: Ubiquiti UniFi Mesh architecture

  * Outdoor-rated access points
  * Centrally managed cloud controller
  * Real-time analytics and monitoring
* **Initial Coverage**: Clubhouse, patio, upper practice area, front lot, and start of Hole 1
* **Scalability**: Additional nodes can be added over time to cover the full 18 holes

### **Strategic Value**

* Converts a known customer complaint (bad reception) into a strategic brand differentiator
* Enables better pace-of-play tracking, range data syncing, and future integrations
* Gives River Oaks a first-mover advantage in golf tech infrastructure in Atlantic Canada

### **Marketing Opportunities**

* Highlighted as part of new River Oaks digital transformation
* Messaging framed around: “No more dropping off the grid to play a round”
* Tied to Clubhouse brand as part of a modernized experience
```

## Samsung 43” 6900 Series TVs - Dual Wall-Mounted - Full-Motion Swivel Brackets

```
Dual 43” Samsung 6900 series, wall-mounted on full-motion swivel brackets for ambidextrous layouts.
Cost: $1,200
```

## Simulator Box Cost Estimate - Hardware, Furniture, Branding - CAD $38,970–$52,970

```
$38,970 – $52,970 CAD (Excludes tax and labor)

This estimate includes all required hardware, furniture, and branding for a fully functional simulator box. Price range varies based on launch monitor choice and any optional finishes.
```

## Simulator Pricing Structure - $2500 Setup & $500 Monthly - Facility Maintenance Policy

```
• $2500 initial setup cost
• $500 per simulator per month (1-2 days revenue in season) to be almost fully hands off and able to open more locations.
Limits would be in place in case customers continue to call about negligence from owner for facilities (broken items not fixed). Clubhouse can support or replace in many cases as a one off charge to the facility or business owners, but expect it to be resolved quickly to avoid unneeded customer interaction.
```

## Skedda Review - Gift Card Tags vs Bookings - Location Utilization & Promo Adjustments

```
• Review tags
• Compare gift card tags with the number of bookings and activation dates
• Review location utilization and adjust promo if necessary
```

## Sound Bar Setup & Track-Style Lighting - Amazon Sourced - $500 Cost Per Bay

```
Standard moving forward is a sound bar setup per bay. Lighting is track-style directional, sourced from Amazon (approx. $200 per bay).
Cost: $500
```

## Three-Step Audit Cycle - Boundary Audit, Leverage Redefinition, Upstream Integrity

```
1. Boundary Audit
	o Ask: “What part of this task is currently being handled by me that could be offloaded?”
	o Identify where human time is still being spent unnecessarily — whether out of habit, fear, or lack of system trust.
	o Look for repetitive work, linear thinking, memory burden, or emotional labor not requiring human uniqueness.
2. Leverage Redefinition
	o Redefine the role of the human in the system:
		 What is your irreplaceable function?
		 Where does your cognition outperform automation — strategy, intuition, value setting, or relational discernment?
	o Use this to recenter effort around signal — not just output.
	o If AI handles 80%, what should the 20% be?
3. Upstream Integrity Enforcement
	o Ensure systems are designed with upstream leverage in mind.
		 Fix issues at the root: structure, interface, instructions, feedback loop.
	o Avoid duct-taping human time onto broken systems.
	o If a fix requires “more effort,” that’s often a sign of poor system design.
```

## Touchscreen Monitor - 27”–32” Full HD or 4K - Sim Interface & Customer Control

```
Mounted touchscreen used for sim interface and customer control. 27”–32”, full HD (1080p) or 4K resolution.
Cost: (Included in PC setup or quoted separately if upgraded)
```

## Tournament Management - Review Payouts and Create New Events - Update and Post

```
• Review tournaments and pay out winners
• Create new tournaments and update/post
•
```

## Trackman 4, Uneekor iXO2, Foresight Falcon - Premium Launch Monitors - Player Segment & Budget Guide

```
Trackman 4, Uneekor iXO2, or Foresight Falcon – selected based on player segment, budget, and software preference. All are premium-tier launch monitors suited for competitive and recreational play.
Cost: $14,000 – $28,000
```

## TrackMan Simulator Support - Live SMS Assistance - Remote Control & Diagnostics

```
Covers everything *during* the customer’s session:

* TrackMan or system issues
* Reset requests
* Software confusion or malfunction
* Any support needed while actively playing

We guide the customer live via SMS (on their cell phone) while remotely controlling the TrackMan system. The customer doesn’t touch anything confusing—we handle it directly.

As part of this, we install our support software on your simulator computers to enable remote control and diagnostics. We also install support cameras so our operators can see what the customer is doing in real time and guide them more effectively.

We request that each facility owner complete a detailed questionnaire outlining their refund policies, pricing structure, and any location-specific guidelines. This ensures ClubOS can respond to your customers exactly as *you* would.
```

## Upgraded Beverage Fridge - Best Buy - White or Black Finish - $450

```
Upgraded beverage fridge from Best Buy. White or black finish selected to match room design.
Cost: $450
```

## Wall Signage Branding Elements - Entrance and Exterior Design - Cost $500

```
Wall signage and optional branded design pieces. Typically mounted on entrance wall or enclosure exterior.
Cost: $500
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

## 24/7 Expert Support - No Hiring or Training - Facility Efficiency Without Added Labor

```
* No more hiring, training, or stress
* Customers get expert support, 24/7
* Your facility runs like it’s fully staffed—with no added labor
* You gain visibility and peace of mind
```

## 3D Printer Filament Replacement - Bambu Source - Hats Replacement TBD

```
Item	Source	Replacement time
Filament (3D Printer)	Bambu	
Hats	TBD
```

## Admin Control Panel Features - Fast Intuitive Backend - Discounts, Pricing, Access Control

```
• While customer-facing UI is critical, the internal backend interface must support fast, intuitive admin-level control.

Desired backend features:
• Apply tags or discounts to individual customers or groups.
• Set custom pricing for special events, days, or boxes.
• Designate free use days or hours for promotions.
• Override or modify booking durations on the fly.
• Add or revoke access rights instantly without delay.
• View and filter activity logs by user, bay, or location.
• Pause, suspend, or flag accounts for admin review.
• Set booking blackout windows for maintenance or events.
• Monitor live box status and booking overlap conflicts.
• Add one-click refund button tied to Stripe with automated reason logging.
```

## AI Decision Support Tools - Blind Spot Detection, Cognitive Dashboard, Delta Tracker

```
• Can be used personally or team-wide
• Best when paired with:
	o Blind spot detection system
	o Cognitive dashboard (track overload vs underuse)
	o Delta tracker (log misalignments between AI + human decisions)
```

## AI-Human Collaboration - Prevent Over-Reliance - Agile Scaling & Cognitive Alignment

```
• Prevents over-reliance on either party (human or AI)
• Ensures scaling decisions are paired with cognitive alignment
• Designed to stay agile as capability boundaries shift over time
```

## AI Workflow Optimization - Overcome Perfectionism and Value Hoarding - Regular Re-Audits

```
• Stalling from Perfectionism:
Don’t wait for a perfect AI workflow before offloading. If it’s 80% effective, start using it.
• Ego-Based Value Hoarding:
Avoid saying “I have to do this” just because you’ve always done it. That’s not leverage — that’s friction.
• Passive Drift:
Every few weeks, re-audit. What was once cutting-edge delegation can become outdated without realizing.
```

## Annual Equipment Audit - Upgrade Planning & Budget Analysis - SOP Update

```
Frequency: Once a year—often during a slow season or at fiscal year-end.
1. Equipment Upgrade Audit
• Projectors: Assess brightness, color performance—decide if a new lamp or upgrade is needed.
• PCs: Evaluate CPU/GPU performance; plan replacements if they no longer meet new software requirements.
2. Budget & ROI Analysis
• Compare upgrade costs with potential benefits (better visuals, less downtime, improved customer satisfaction).
• Prioritize which upgrades will have the biggest impact on the “no notice” experience.
3. Bulk Maintenance Scheduling
• If multiple items (e.g., screens, mats, projectors) need replacement, coordinate a short facility downtime or staged approach to minimize disruptions.
4. SOP & Tech Roadmap Update
• Document any changes to hardware, or new processes learned over the year.
• Adjust the upcoming year’s maintenance schedule based on real-world usage and any known vendor updates.
```

## Automation Add-Ons - Remote Door Unlock, Projector AV Control, Live Monitoring Analytics

```
• Remote door unlock
• Projector + AV control
• Live usage monitoring + analytics
```

## Automation Upgrades - Remote Door Access, AV Control, Usage Monitoring

```
* Remote door access setup + customer unlock support
* Projector and AV control
* Live usage monitoring + trend tracking
```

## BenQ LK935ST/LK936ST Projector - 4K Short-Throw Laser - 5500+ Lumens - $3,500

```
BenQ LK935ST or LK936ST – 4K short-throw, laser-powered, 5500+ lumens. Future-compatible with newer BenQ models as released.
Cost: $3,500
```

## Booking Software Transition Plan - New System Focus - River Oaks Test Deployment

```
• All development focus will be on the new system only — no further investment into legacy platform features.
• New booking system must first replicate core functionality of the current system before introducing any new features.

Simulations required to evaluate:
• Risks to customer experience.
• Potential loss of data (e.g. future bookings).
• Unintended friction in onboarding or UI/UX.

Action items:
• Create a clean migration path for all existing and future bookings.
• Notify customers at the right moment with simple, reassuring instructions.
• Delay rollout of new features (e.g. pin code entry) until proven reliability.
• Preserve the familiar customer booking flow to avoid negative feedback at the start of sim season.

Test deployment at River Oaks:
• The River Oaks course-based location offers an ideal low-risk environment for testing the new booking and access system.
• Customers at a golf course location are more likely to expect a unique or slightly different system, which reduces risk of confusion or dissatisfaction.
• Launch the system as a one-day, standalone test and monitor customer behavior, support requests, and ease-of-use.
```

## Cable Runs Per Bay - Cat6 Connections to TrackMan, PC, Camera, Projector - HDMI and DisplayPort Setup

```
• Cat6 → TrackMan
• Cat6 → PC
• Cat6 → Camera
• Cat6 → Projector
• HDMI → Projector (25–35 ft)
• DisplayPort/HDMI → Touchscreen Monitor
• HDMI x2 → Dual 43” TVs (50 ft max)
• Power Cord → Table (for in-table phone chargers)
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

## Camera Model Locking - In-Rack Cabling & Surge Protection - Redundant Connectivity Options

```
• Final camera model locking
• Patch panels, in-rack cabling, vent plates, and surge protection
• Redundant connectivity (Starlink, LTE)
• Optional: LED signage controls, kiosk APs, mounted charger ports
```

## Category Breakdown - Financial Analysis 2023 - Revenue, Expenses, Profit

```

```

## CEO and CTO Roles - Mike Belair and Jason Pearson - Strategic Leadership and IT Management

```
Mike Belair’s Roles and Responsibilities as CEO and Owner (dylan shadows this role)
	1. Strategic Leadership
	• Oversee future planning, growth, and the overall strategic direction of the company.
	2. Hiring Authority
	• Approve all hires for the organization.
	3. Marketing and Customer Engagement
	• Lead marketing direction, organize tournaments, and manage customer relations to ensure strong brand presence and customer satisfaction.
	4. Operational Oversight
	• Oversee the organization and structure of the company.
	5. Innovation and System Improvements
	• Drive innovations to enhance operations and services.
	• Ensure systems are user-friendly and efficient, continuously improving throughput and customer experience.
	6. Team Cohesion
	• Foster collaboration and teamwork to ensure cohesive operations across all departments.

Jason Pearson’s Roles and Responsibilities as CTO
	1. IT Management
	• Oversee all IT aspects of the company.
	• Mentor Dylan, who provides close support and learns IT systems under Jason’s guidance.
	2. IT System Advancement
	• Lead the development and enhancement of IT systems to support rapid business expansion.
	3. Tech Approvals
	• Review and approve all technology updates and purchases.
	4. Strategic IT Leadership
	• Implement IT strategies and innovations to optimize business operations and future growth.

Nick’s Roles and Responsibilities at Clubhouse 247 Golf
	1. Building and Location Development
	• Oversee all building projects and new location developments.
	• Approve new locations and collaborate with Mike on innovative building designs and technology implementations.
	2. Facility Management
	• Manage all contract work, repairs, and facility upkeep.
	• Provide oversight for Dylan and Natalie in facility-related matters.
	3. Business Expertise and Growth
	• Use experience and expertise to scale businesses quickly and manage contractor issues in partnership with Natalie and Dylan.
	• Leverage his role as an owner-operator to support business growth and operational success.

Alanna’s Roles and Responsibilities as Assistant Marketing Manager
	1. Event Support
	• Assist with organizing and managing golf charity events.
	2. Photography and Media
	• Capture photos and create visual content during events.
	3. Marketing and Creative Tasks
	• Support marketing initiatives and participate in engaging or creative activities of her choice.
```

## Clubhost System Specs - Flex Range Cost Variability - Modular & Scalable Design

```
• Flex Range: $14K cost swing is primarily due to launch monitor selection.
• Modular Design: Every component is optimized for repairability and swap-out during upgrades.
• Scalability: All systems are designed to scale across multiple locations with repeatable wiring and mounting logic.

This document is maintained in the Clubhost-branded system and will auto-update as specs evolve. Always reference this file before procurement or install planning.
```

## Clubhouse 24/7 Golf SOP - Technology Tasks - Reporting & Improvement

```
• Division of Labor: This SOP covers technology-oriented tasks only—standard facility cleaning and housekeeping are handled separately.
• Reporting: Use Slack or a shared logging system to quickly flag any issues found during checks, so the remote support team or local tech can address them promptly.
• Continuous Improvement: If you find any tasks are redundant or need adjusting to better reflect real usage, update these lists.

By following this streamlined approach, Clubhouse 24/7 Golf ensures the simulators, projectors, PCs, and network infrastructure remain Best in class.
```

## Clubhouse 24/7 Golf - Technology Maintenance & Checklists - Streamlined Procedures

```
Streamlined Technology Maintenance & Checklists
```

## Clubhouse Admin Tasks - Monthly Checklist - Start of Month Procedures

```
Start of Month Clubhouse Admin Task List
```

## Clubhouse Booking Platform - Developer Guide for Backend System - Jason's Implementation

```
For: Jason – Backend Booking System Build
Last Updated: June 17, 2025

This document breaks down all functional booking platform requirements into developer-ready language, organized by system layer. Everything here mirrors the master spec but is translated into implementation terms.
```

## Clubhouse Expansion Protocol - Standardize Access - Kisi System Failover Plan

```
• As Clubhouse approaches 10+ locations, standardize fallback access at all sites.
• Maintain a mix of active and dormant Kisi systems, with a mapped failover plan.
• Identify key locations for first-tier activation (high traffic, central nodes).
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

## Clubhouse Infrastructure Strategy - High Availability, Redundancy, Scalability

```
To outline the long-term infrastructure strategy for maintaining high availability, redundancy, and scalability of Clubhouse access and backend systems. This document will evolve as the company grows.
```

## Clubhouse Innovation - Challenging Norms and Erasing Limitations - Myth Counterexamples

```
The world says “this is just how it works.”

Clubhouse says: prove it.

And then builds the counterexample that makes the myth obsolete.

We aren’t running a golf sim company. We’re erasing inherited limitations.
One contradiction at a time.
```

## Clubhouse Location Install Checklist - Hardware, Infrastructure, SOPs - 4-Bay Standard

```
Scope: Covers all core hardware, infrastructure, and install accessories required to launch a standardized 4-bay Clubhouse location. Includes on-hand inventory, install SOPs, and tech stack.
Last Updated: June 14, 2025 (Version Locked)
```

## Clubhouse Myth Inversions - System Design vs. Legacy Business Beliefs

```
Each of these legacy beliefs is something we intentionally prove wrong by system design:

Business Myth	Clubhouse Reality
You need a plan	No. You need upstream architecture that creates new plans by design.
You have to work hard to make money	No. You work hard once to build systems that remove future work.
Growth requires hiring	No. Growth requires modular systems that scale without headcount.
Don’t get too far ahead of yourself	No. Get upstream far enough to own the downstream.
One person with all the knowledge is a risk	Not if the system is the knowledge.
Keep control by doing it yourself	No. Keep control by documenting and automating everything.
Cleanliness and quality need staff	No. Build detection + escalation loops into the infrastructure.
You can’t be affordable and premium	Yes you can, if automation removes cost and adds consistency.
Competitors are threats	No. We build tools and offer support to them. Their success scales us.
You need to gatekeep your advantage	No. We share it. The moat is execution speed, not secrecy.
Make a brand, then build systems	No. Build systems so good they become the brand.
```

## Clubhouse Network Infrastructure - Version 1.0 - Updated June 13, 2025

```
Last Updated: June 13, 2025
```

## Clubhouse Partnership - Simulator Box Project at River Oaks - Trackman Tech & Branding

```
### **Simulator Box Project**

* **Location**: Inside the River Oaks clubhouse
* **Technology**: Trackman-powered with full Clubhouse branding and automation
* **Dual-Sided Support**: Configured for both left- and right-handed players
* **Ownership**: Tech and signage remain Clubhouse property; walls or slabs = River Oaks property
* **Deposit**: \$12,500 (invoiced by Clubhouse, refundable via e-transfer, Visa, etc.)

  * The deposit will be **returned in full after 12–18 months** of consistent usage and mutual satisfaction of partnership conditions
  * If there is ever disagreement about damage, **Clubhouse will simply take care of it** — all systems are monitored by video and logs
* **Timeline**: Installed by **end of August 2025** to allow for testing before winter
* **Access**: Clubhouse retains full operational access

  * Exceptions: Staff parties (e.g., Christmas), approved charity events, case-by-case collaboration
* **Testbed Use**: River Oaks is a designated **pilot location** for new Clubhouse technology and UI testing, including single-box layout environments, updated user flows, and full Ubiquiti access control systems

  * **Jason** is overseeing backend and interface testing for this one-box setup
* **Staffing**: This is a fully automated simulator box. There are **no on-site Clubhouse staff** — all access, troubleshooting, and customer service is remote
* **Financial Structure**: Clubhouse owns and operates the simulator fully. River Oaks has no equipment costs, fees, or revenue-sharing obligations
* **Signage Opportunity**: Clubhouse and River Oaks will explore possible **collaborative signage** on or near the new roadside sign. Visual mockups and branding concepts will be created and reviewed with Graeme before implementation

### **Branding and Identity: “Powered by Clubhouse”**

* All simulator boxes at River Oaks will be marketed as **“Powered by Clubhouse”**.
* Customers will experience the same seamless automation and premium standards as standalone Clubhouse locations.
* Allows River Oaks to elevate indoor offerings while keeping full control of their space and community identity.

### **Event Integration: The Invitational**

* **Event Name**: *The Invitational* (by Clubhouse)
* **Date**: October 29, 2025
* **Purpose**: Outdoor season send-off + indoor sim season launch
* **Personal Origin**: Inspired by Dylan’s golf history with his father (Dale)
* **Tone**: Not cheesy or sentimental — grounded, legacy-minded, thoughtful

### **Golf Pass Program**

* **Offer**: 50 physical golf passes = 200 simulator hours
* **Usage**: For giveaways, membership perks, promo tools
* **Rationale**: A fairer exchange aligned with simulator capacity and market value
```

## Clubhouse Partnership Vision - Graeme's Insights on Collaborative Golf Spaces

```
* **Graeme** appreciates companies that listen, care about the experience, and don't try to dominate the space.
* **Clubhouse** excels by being collaborative, adaptive, and obsessively detailed.
* This partnership sets the tone for future installations **where Clubhouse integrates into traditional golf spaces** and expands beyond standalone units.
```

## Clubhouse Server System Summary - Kisi Access Control Backup - Monthly Cost $200

```
• Primary System: Clubhouse-hosted server running custom backend software.
• Fallback System: Kisi access control, proven and stable.
• Monthly Kisi Plan Cost: $200
• Existing Kisi Kits Owned: 3 (enough for 3 backup-ready locations)
```

## Clubhouse Setup Plans - Contractor Notes - Ops and Tech Leads Guide

```
Last Updated: June 14, 2025

Purpose:
Real install plans and working notes for setting up a Clubhouse location — no checklists, just specifics I actually said. Used by contractors, ops team, and tech leads.
```

## Clubhouse Simulator Box Cost Breakdown - Budgeting & Installation Planning - Investor Visibility

```
Last Updated: June 13, 2025
Branded format: Poppins font, Clubhouse Green (#152F2F), white background. Structured for easy updates. Optimized for budgeting, installation planning, and investor visibility.
```

## Clubhouse Tech Infrastructure - Failover Strategy - June 2025 Update

```
Last Updated: June 7, 2025
```

## ClubOS 24/7 Support - Solve Late-Night Tech Issues & Booking Disputes

```
Most sim facilities lean on owners or part-timers for:

• Late-night tech issues
• System resets
• Refund calls, access issues, or booking disputes

Result: burnout, inconsistency, and lost revenue from returns or customer accommodations… and what if you have 100 bookings a day?  
ClubOS replaces this chaos with embedded 24/7 support—built and run by real operators.

Picture is of internal Clubhouse systems used.
```

## ClubOS Booking Beta Testing - Upcoming Features and Updates

```
Now beta testing: ClubOS Booking
```

## ClubOS Booking Infrastructure Testing - Future Managed System Support - Centralized Operations

```
We are currently testing ClubOS booking infrastructure internally and may offer fully managed booking system support as an optional layer in the near future. This would further centralize ops under one expert-driven system—without adding work on your end.
```

## ClubOS Cleaning Checklists - HubSpot Site Updates - Google Calendar Scheduling

```
1. Cleaning Checklists: ClubOS
	• Create detailed daily, weekly, and monthly cleaning lists.
	• Include deeper cleaning tasks on the weekly and monthly lists.
	• Add turf replacement to the monthly cleaning checklist.
	2. HubSpot Cleaning Site:
	• Update and create a cleaning section on HubSpot to:
	• Track all cleaning activities.
	• Allow for photo uploads to report issues or broken items.
	• Enable urgent issue linking for immediate notifications.
	3. Scheduling:
	• Add a weekly or bi-weekly deep cleaning schedule to Google Calendar:
	• Share appointments with Mike (mike@clubhouse247golf.com) and Dylan (via calendar invites). And Nick
	• Ensure schedules are added two weeks in advance. (send email when complete)
	4. Cleaning Optimization:
	• Develop a plan to organize cleaning better as the business scales:
	• Consider shifting most cleaning to overnight hours to avoid disruptions during customer bookings.
```

## ClubOS Human-Led Operating System - Managed Support for Unattended Sim Locations

```
ClubOS is not software.
It’s a fully managed, **human-led operating system for unattended sim locations**.

We don’t just automate. We run support *for you*—with trained simulator professionals in the loop at all times.
```

## ClubOS Inversion Identity Module - Contradiction as Advantage - Core Operating Philosophy

```
Core Operating Philosophy: Contradiction as Advantage

Clubhouse isn’t just different. It’s structurally inverted.

We don’t reject legacy business myths by arguing with them.
We build systems where the opposite is true, and demonstrably better.

This isn’t branding. It’s architecture.
```

## ClubOS Performance Metrics - 10,000+ Bookings - Automated Sim Support

```
Proven Results
• 10,000+ bookings supported
• 220+ 5-star customer reviews
• 99.98% resolution without owner involvement
• Estimated response time to customer is less than 1 minute. Fix is less than 5. 
Why ClubOS?
Not just software. A full operating system for automated sim locations.
We don’t replace your support team. We are the support team, at scale with your business info and practices. And if we must contact you? We update the system so next time we don’t.
```

## ClubOS Success Metrics - 10,000+ Bookings & 250+ Reviews - Unattended Golf Facilities

```
* 10,000+ bookings supported
* 250+ five-star reviews
* 99.98% resolution success rate without owner intervention

We’ve used ClubOS to run our own fully unattended Clubhouse 24/7 Golf facilities. Now, we offer the same system to other operators who want to scale without friction.
```

## ClubOS Support Structure - Two Categories for Clarity and Control

```
**ClubOS support is structured into two categories for clarity and control:**
```

## ClubOS Support Subscription - Real Sim Operators - Unattended Facility Assistance

```
Built by real sim operators, for unattended facilities that need real support.
```

## ClubOS Support Suite Proposal - Clubhouse 24/7 Golf - Simulator Facility

```
**Prepared For:** \[Simulator Facility / Investor Name]**Prepared By:** Clubhouse 24/7 Golf – Internal Systems Division**Date:** \[Insert Date]
```

## Commercial Golf Enclosure - Great North Golf - Impact Screen & Structure Specs

```
Commercial-grade enclosure with impact screen, turf underlayer, and full frame protection. Either custom-built or pre-fabricated from Great North Golf (formerly Northern Golf Company). Includes blackout screen mounted behind the impact screen to block light bleed.

Recommended Dimensions:
• Width: 16 feet or more
• Height: 10.5 to 11 feet
• Depth (total room length): 25 to 35 feet
o ~10 feet from hitting strip to screen
o +1 foot behind screen for padding and airflow
o ~15 to 20 feet of space behind the golfer for radar clearance and swing safety

Infrastructure Notes:
• Projector cabling requires a wall penetration or ceiling conduit 20–25 feet from the screen
• TrackMan mounts 3.5 feet forward from the hitting strip, centered
• Electrical outlets required in three locations: ceiling (projector/sound), table location (PC/touchscreen), and at least one side wall

Cost: $13,000
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

## Computer Maintenance Tasks - Update Drivers & Software - Subscription Check: Trackman, Kisi, Hubspot, Skedda

```
Computers:
	• Update drivers
	• Update Windows
	• Update game software
	• Check usernames
	• Verify game settings
	• Dust system
	• Update music PCs

Check Subscriptions List
Trackman, Kisi, Hubspot, Skedda, specific (Critical Subs).
```

## Content Categorization Instructions - Emergency, Booking, Tech, Brand - Section Organization

```
1. Identify which assistant category this content fits: emergency, booking, tech, or brand
2. Split the document into logical sections based on headers, topics, or natural breaks
3. Extract the exact original titles and content - DO NOT rewrite or summarize
4. Keep all specific details, procedures, names, numbers, and exact wording
5. Only organize/split the content, never change the actual text
```

## Contract Cleaner Issue Reporting - Photo Uploads - Employee Deficiency Reporting via Slack

```
• Allow contract cleaners to report issues with photo uploads.
	• Ensure employees report deficiencies via Slack.
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

## Core Infrastructure Philosophy - Skedda Booking - Kisi Access Control - Modular Systems

```
• Use simple, proven systems from reputable companies (e.g. Skedda for booking, Kisi for access control) to ensure reliability.
• Build Clubhouse software complexity incrementally, layering on features and intelligence as the company scales.
• Avoid unnecessary fragility by keeping core systems modular and swappable.
```

## Customer Experience Policy - No Notice Environment - Technology Performance Focus

```
We want to maintain a “no notice” environment for customers, focusing on technology performance. They shouldn’t notice, lag, blurry screens, out of calibration, or missing accessories.  Standard building cleaning (vacuuming floors, emptying trash, etc.) is handled separately by cleaning staff, so it isn’t included here.
```

## Customer Interaction Logging - Time-Stamped Records - ClubOS Friction Analysis

```
* Every customer interaction, reset, refund, or escalation is time-stamped and logged
* You receive ongoing visibility into what’s happening at your facility
* ClubOS identifies recurring friction points and provides recommendations—without requiring you to dig through data
```

## Customer Support Breakdown - Outside/Inside Sim - TrackMan/Foresight Troubleshooting

```
1. OUTSIDE-THE-SIM SUPPORT
Handles customer questions before/after sessions:
• Booking/payment issues
• Access problems
• Forgotten items
• General questions

How it works:
• QR code signage in every bay → instant SMS support
• Facility support line (text-only)
• Answers matched to your pre-filled policies
• All interactions logged

2. INSIDE-THE-SIM SUPPORT
Support during live sessions:
• TrackMan / Foresight troubleshooting
• Remote resets
• Live SMS walk-throughs
• Optional video monitoring

Setup:
• Secure remote desktop software
• Discreet bay camera (1 per bay)
• ClubOS intake form (your pricing/policies)
• Access system: Kisi / Ubiquiti / similar
• UPS backup (recommended)
• Booking/refund access (if outside support enabled)
```

## Customer Support Differentiators - Operator-Led Service - Full Transparency

```
REAL PEOPLE
• 100% operator-led
• 5+ sim support specialists
• We complete refunds based on your SOP when needed
• You only get involved if we can’t solve it

FULL TRANSPARENCY
• Every ticket logged
• Timestamped session data
• Monthly insights and escalation trends
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

## CyberPower 1500VA Battery Backup - Gaming PC, Ubiquiti Core, Modem, Door Access, Audio Rack

```
• 1x per Gaming PC (4 total)
• 1x for Ubiquiti Core (UDM-SE + PoE switch/miniPC)
• 1x for Modem
• 1x for Door Access System
• 1x for Audio Rack (if applicable)
```

## CyberPower OR1500PFCRT2U UPS - 1500VA Pure Sine Wave - Rackmount Backup for Gaming PCs and Access Systems

```
CyberPower OR1500PFCRT2U
• 1500VA pure sine wave UPS
• 2U rackmount format
• Powers UDM-SE, switch, modem, APs, and Access gear during outage

Additional UPS Guidelines:
• Each Gaming PC must have its own CyberPower 1500VA UPS (tower or rackmount)
• All Access Control Systems must be backed up by a dedicated 1500VA UPS
• Primary Internet Modem (Eastlink or Bell Alliant) must be connected to its own 1500VA UPS
```

## Daily Tech Checklist - Simulator Software Check - Visual Inspection - System Health

```
Frequency: Once per day.
1. Simulator Software Check
• Restart PC and Launch the simulator program (e.g., Trackman) to confirm it loads without errors.
• Quickly verify it can load into the practice range, and then return to the main screen.
2. Visual Inspection (Tech Focus)
• Look for major projector misalignment (e.g., if the image is significantly off-center or very blurry).
• Confirm the hitting mat is not noticeably work (e.g., no indent in the middle, no turf pulling up around the edges).
3. System Health Snapshot
• Ensure each PC is powered on and not displaying critical error messages.
• Check for any cables visibly disconnected or pinched in doors or hardware—reseat if necessary.
4. Displays & Audio
• Confirm any TVs or signage used for promotions or scoreboard are powered on and displaying correct content.
• Test audio level in the simulator bay and location to ensure it’s functioning (not muted or blaring static).
5. Immediate Follow-Up
• If you spot an issue (e.g., software glitch, partial projector failure), log it in Slack or your ticket system for prompt resolution.
```

## Default Bay Quantity - 4 Bays Standard - Approval Required from Jason, Dylan, Nick, Mike

```
Quantities default to 4 bays unless explicitly stated.
Deviations from spec must be cleared with Jason, Dylan, Nick, or Mike.
```

## Design Mandate Principles - Generosity, Intelligence, Scalability, Affordability

```
No value is true unless it’s structural.
	•	Generosity = free support + automated comps + tournament tools for others
	•	Intelligence = no remembering needed, clarity defaults, no stupid options available
	•	Scalability = one person can run what used to take a team
	•	Affordability = value increases while cost-to-operate drops

We don’t add values after. We bake them in from the first line of code.
```

## Door & Access Control Systems - Magnetic Locks, Electric Strikes, Kisi Kit, Ubiquiti Wiring

```
• Magnetic Locks or Electric Strike Locks (Ubiquiti)
• Kisi Kit – fallback access system (being phased out)
• Wiring + Door Power Supply – Ubiquiti 2-pair cable
• Backup Access Keypads or Tags
```

## Door Access Infrastructure - Unifi Access Ultra Preference - Kisi Fallback System

```
• Prefer Unifi Access Ultra where possible (no hub required)
• Do not use Unifi G2 reader
• Lock options: mag lock or Unifi strike lock based on site
• Kisi used as fallback system with passive install
• Kisi system is stable, costs $200/month
• 3 Kisi kits already owned; enough for 3 locations
• At scale, fallback standard is 1 device/location (~$2,000 total per site)
• Fallback devices can remain dormant and non-bandwidth consuming
• Explore auto failover for seamless fallback
```

## Durable Seating Set - Table and Two Chairs for Social or Tournament Use - $500

```
Table and two durable chairs for social or tournament use.
Cost: $500
```

## Dylan's CEO & VP Roles - Clubhouse Golf Canada - Tech Leadership, Customer Relations, Team Development

```
1. Technology Leadership
	• Oversee all aspects of technology, including:
	• Health checks.
	• Updates, advancements, and improvements.
	• Collaborate with Jason Pearson to automate processes and enhance operational efficiency.
	2. Customer Relations
	• Ensure excellent customer service and maintain strong relationships with clients.
	3. Team Development
	• Lead hiring efforts for future employees, with support from Mike.
	4. Business Management
	• Oversee all aspects of business operations.
	• Work closely with other owners and employees to maintain effective collaboration and ensure smooth operations.
```

## Email Trigger System - Automated Customer Engagement - Booking Behavior Responses

```
• Implement a rule-based email system that responds to booking behavior:
	o After 2nd visit: Send an automated review request email.
	o After 3rd visit: Send a congratulatory message — “You’re officially a Clubhouse Member”.
	o After 5th visit: Automatically issue a 1-hour free session credit.

Notes:
• These emails should be personalized and timed without overwhelming frequency.
• All emails should include clear call-to-action, such as next steps or referral invites.
```

## Facility Management SOP - Cleaning, Maintenance, Supplies - Dylan & Team Responsibilities

```
1. Standard Operating Procedures (SOP)
	• Oversee cleaning, maintenance, and supplies management.
	2. Cleaning & Maintenance Schedule
	• Develop and maintain a cleaning schedule for each facility.
	• Coordinate with the cleaning crew to ensure tasks are completed.
	• Address urgent cleaning/maintenance issues immediately.
	• Review and update cleaning/maintenance lists created by the crew every two months (in collaboration with Nick and Dylan).
	3. Supplies Ordering
	• Manage ordering and restocking for:
	• Vice, Amazon, Ikea accounts.
	• 3D printer filament.
	• Ubiquiti (tech equipment).
	• Turf, flooring, vacuums, and consumables.
	4. Monthly Location Reviews
	• Conduct a full-location review every month with a two-person team (including Natalie).
• Create an evolving checklist in Hubspot and maintain the cleaning site (Mike can teach out)
	5. Organizational Cleaning Instructions
	• Define cleaning instructions and responsibilities for contract cleaners. (this should include cleaning, restocking of simulator equipment, bottle restock)
	6. Tech Health Checks
	• Delegate technology health checks to Dylan but ensure it falls under her oversight.
```

## Facility Operations Essentials - IKEA, Purell, COBB Lights, Dyson - Signage and Accessibility

```
• Framed Photos – x8 (IKEA + custom prints)
• Soap Dispensers – x2 minimum
• Purell Dispenser – x1 minimum
• Automated Paper Towel Machines – x2 minimum
• Toilet Paper Holder
• Handicap-Accessible Rails
• COBB String Lights – for bay monitors and Big X
• Extension Cables – x6
• Smallrig Phone Holders – x3 per bay
• Signage:
  o Bathroom
  o Bay
  o House Rules
  o Google Reviews
  o Outside Door Sign
  o WiFi Password Sign
  o Sidescreen Signage
  o Table Support Signage
  o Bathroom Support/Area Signage
  o BIG X
  o Metal Outdoor Bright Sign
  o Club Calibration Center
• Box/Outdoor Signage – Locally sourced (Nick Stewart)
• Couch + Chairs – IKEA
• Clubs – Vice
• Balls – Vice
• Lights for Common Areas – IKEA or Amazon
• Mailbox – if applicable
• Dyson Vacuum and Mop
```

## Financial Reconciliation - Receipts, Gross Revenue vs Expenses - Quarterly Update Feedback

```
• Receipts reconcile
• Record each location gross rev. vs expenses.
• Email Quarterly update and ask for feedback or what the team want to see
```

## Golf Simulator Bay Layout - Dimensions and Setup - Projector and Screen Guidelines

```
• 16 feet wide or more
• Height: 10.5 to 11 feet
• Depth varies: 5 to 20 feet depending on layout
• Hitting strip is 10 feet from the screen
• Behind screen: 1 foot clearance + blackout screen
• Behind hitting area: 15–20 feet ideally
• Projector cable hole: 20–25 feet from screen
```

## HDBaseT Projector Control - Soft Session End Logic - Network Power Management

```
• Explore using HDBaseT-capable projectors to remotely control power state via network cable.

New session logic concept:
• Instead of disabling access, only the projector is powered down when a session expires.
• The touchscreen monitor remains active, but the 16:10 projection screen goes black.
• This acts as a soft visual cue that the session is over, encouraging exit without confrontation.
• Ideal for use in scenarios like the final hole of a round or lingering beyond booking time.
```

## High-End Hitting Mat & Commercial Putting Turf Installation - Softened Underlay - $1,500

```
High-end hitting mat ($500) combined with commercial putting turf installation ($1,000). Softened underlay used where required.
Cost: $1,500
```

## HubSpot Customer Database Review - Optimize Monthly Forms and Lists

```
• Review customer database
• Optimize forms and lists from the previous month
```

## Human-Managed Support - Real Operators & Sim Ops Experts - Fast Responses

```
* All support is monitored and managed by real operators—not just AI
* If automation doesn’t resolve it, the issue routes to our internal specialist network (up to 10 sim ops experts)
* Customers get fast, clear responses from people who know sim systems inside and out
```

## Internal Audit Tools - Monitor Uptime, Latency, Fallback Device Status - Monthly Health Reports

```
• Build internal audit tools to:
	o Monitor uptime and latency of both systems.
	o Track fallback device status (power, connectivity).
	o Generate health reports monthly.
```

## Key Stakeholders & Leadership Dynamics - Carson Wei, Graeme Burke, Brady Burke

```
### **Carson Wei** – Owner

* Has not visited River Oaks since **2022**.
* Diagnosed with ASD; avoids social situations.
* Derives emotional satisfaction from **hearing positive feedback** about the course.
* Delegated full operational authority to Graeme Burke.

### **Graeme Burke** – General Manager (GM)

* Day-to-day decision-maker and operational leader.
* Values autonomy, collaboration, and respect.
* Proud of Carson’s trust in him.
* Rejected Better Golf for their arrogance.
* Believes in **presentation and experience-first operations**.
* Appreciates brands that don’t posture, overpromise, or try to dominate — collaboration and humility matter.

### **Brady Burke** – Family

* Son of Graeme Burke.
* Well-liked within the community.
* Maintains a close relationship with Justin Burke.

### **Justin Burke** – Clubhouse Advocate

* Half-brother of Graeme.
* Loyal Clubhouse user and supporter.
* Very close with Brady Burke.

### **Jordan Oakey** – Influencer

* Close friend of Graeme Burke.
* Well-connected regionally (Brightwood member).
```

## Live Resource Document - Continuous Updates - Key Terms and Topics

```

```

## Locker System Integration - Ubiquiti Ultra Access Modules - Automated Member Assignment

```
• Explore adding locker access using Ubiquiti Ultra Access modules (~$200 per locker, not including physical locks).

Logic:
• When a customer becomes a member and there is an available locker, the system automatically assigns a locker to their account.
• Locker can be unlocked only by the authorized customer via their profile-linked access.
• Entire flow would be automated end-to-end, requiring no staff interaction.
• Consideration for upscale experience or high-usage customers.
• Could be paired with membership status, multi-visit history, or upsell logic.

Flagged as a low-priority exploratory idea for long-term infrastructure vision.
```

## Logitech K400 Plus - SmallRig Phone Holders - Laser Alignment Tools - Wireless Chargers

```
• Logitech K400 Plus wireless keyboard/mouse combo
• 3 SmallRig phone holders per bay
• Laser alignment tools (already added into calibration cost)
• Wireless chargers (included in main cost breakdown)
```

## Marketing Update - Google Ads, Website Pages, Giveaways, Email Campaigns

```
Update:
	• Google Ads
	• Website pages (home, promo, etc.)
	• Replace last month’s giveaways
	• Winner post (Instagram)
	• Update advertising PCs (remote)
Email
	• Winner email and new giveaway announcement
	• Membership loss/renewal/Club+ renewal email
	• Check for new standard members
	• Members-only update?
	• Google review email
```

## Monthly Tech Checklist - System Updates, Display Maintenance, Security Checks

```
Frequency: Once a month (align with other monthly tasks).
1. System & OS Updates
• Install any Windows (or relevant OS) updates. Reboot PCs afterward during off-hours if possible.
2. Projector & Display Maintenance
• Clean projector lens only if you notice dust or a drop in clarity. Use a microfiber cloth or compressed air as recommended by the manufacturer.
• Quickly confirm color/brightness looks consistent across all bays.
3. Hardware & Cabling
• Inspect essential cables (PC-to-projector, sensor cables) for wear or loose connections. Reseat or replace if necessary.
4. Sensor & Calibration Check
• If the simulator software offers a calibration or advanced setup test, run it to confirm everything’s accurate.
5. Security / Remote Access
• Confirm door access systems (KISI) and security camera feeds (if applicable) show no recurring errors.
6. Summary & Next Steps
• Compile short notes on any upcoming replacement needs or persistent minor issues.
```

## Mounting & Cabling Tools - HDMI, USB, Surge Protection, Laser Alignment - Installation Kit

```
Includes HDMI, USB, surge protection, raceways, wall fasteners, mounting brackets, and laser alignment tools used during install calibration.
Cost: $600
```

## Network & Power Setup - UDM-SE, Ubiquiti Flex, CyberPower - Simulator Infrastructure

```
• UDM-SE at each main location
• Run network cable to each simulator box
• Use Ubiquiti Flex switch inside each box to split to:
  o Projector
  o TrackMan
  o PC
• CyberPower 1500VA battery backups required for:
  o Each PC
  o Internet modem (Eastlink or Bell Alliant)
  o Any door access system (especially Kisi)
• Add 4TB HDD for storage at UDM-SE location
• Mini PC (Ubuntu server) runs access control unless fallback to Kisi is needed
```

## Operating Rules - Prioritization, Automation, Decision-Making - Business Logic Framework

```
3. Operating Rules
	•	Present ≠ Priority
Urgent ≠ important. Customer urgency is respected, but business logic is built upstream.
	•	Each Interaction is a Trigger
Every booking, error, or win is a dataset — not just a service moment.
	•	Automate the Present, Architect the Future
If it happens more than once, automate it. If it doesn’t happen yet, plan for its inverse.
	•	Decisions are Seeds
Good now-decisions aren’t just correct — they create branches.
E.g., running our own support system → now deployable to other sims → now a revenue stream.
```

## Outside-the-Sim Support - Booking, Access, Payment, Inquiries - QR Code Text System

```
Covers anything *before or after* the booking session:

* Booking issues
* Entry/access problems
* Forgotten items
* Payment questions
* General inquiries

We can fully handle these on your behalf if your system allows it. If not, they’re cleanly routed to you or your team with full context and history attached.

This support is initiated through clearly placed signage in every bay. Customers scan a QR code that routes directly to our system, allowing them to text us for support. Additionally, we provide a dedicated support contact line listed on your facility's website. This line is **text-only**—any voice calls to the number will trigger an automatic message instructing the caller to text instead. If you choose to offer phone support separately, you retain control of that.

What this looks like in practice:

* A customer scans the bay signage or texts the support number
* Messages like “I’m having trouble booking,” “Do you have clubs on site?” or “How many people can I bring?” are all routed to us
* Our team uses your facility’s pre-filled policy questionnaire to answer on your behalf, exactly how *you* would
* Every interaction is logged and stored for reference in case of disputes
```

## Power Requirements - Ceiling Projector and Table Area - Electrical Setup

```
• Power must be run to ceiling (for projector)
• Power needed to table area and at least one wall
```

## Proactive Refund Policy - Immediate Branded Refunds - Customer Issue Escalation

```
* If a problem can’t be resolved live, we issue a branded refund immediately
* We notify the customer that the issue was escalated to the operator for resolution
* You’re only looped in when absolutely necessary
```

## QR Code Payment Activation - RangeBox Integration - Instant Payment & Refund Process

```
• Goal: Enable customers to scan a QR code at a RangeBox and go straight to a payment page.
• Support instant payment methods: Google Pay, Apple Pay, etc.
• Upon payment, RangeBox could optionally activate the two side TVs instead of full simulator software.
• May be a lighter, passive solution for 2025 while backend infrastructure is refined.
• All bookings must attach payment ID to the booking record so refunds can be efficiently processed.

Ideal solution: Add a Refund Button in backend admin panel that will:
• Automatically refund payment via Stripe.
• Pre-fill refund reason with: “Customer requested to change booking”.
```

## Quarterly Tech Maintenance Checklist - Projector Filters, Firmware Updates, Simulator Calibration

```
Frequency: Every 3 months (4x a year).
1. Deeper Maintenance
• Projector Filters (if applicable): Clean or replace filters if recommended by the manufacturer.
• PC Interiors: Lightly blow out dust using compressed air (only if comfortable handling PC components).
2. Firmware & Driver Updates
• Check if any projectors, GPUs, or other hardware have recommended (stable) firmware updates.
• Update only if needed, to avoid unnecessary risk on well-functioning systems.
3. Full Simulator Calibration
• Perform a more detailed calibration routine or advanced diagnostic within Trackman or your sim software.
• Confirm sensor alignment, especially if you’ve noticed data discrepancies.
4. Network & Bandwidth
• Quick check that your internet speed is still meeting location needs—particularly if usage has grown or new services were added.
5. Condition Assessment
• Evaluate the state of hitting mats, screens, and major hardware for end-of-life or near-end-of-life signs. Note these for the annual plan.
```

## Rack-Mounted Gaming PC - Intel i7/i9 - NVIDIA RTX 5070+ - 1TB NVMe SSD - $3,500

```
Clubhouse-standard rack-mounted PC, wall-installed. Built for sim graphics and performance headroom.

Required Specs:
• Intel i7 or i9 CPU
• NVIDIA RTX 5070 or better
• 1TB NVMe SSD (7000+ MB/s read/write)
• 800W+ power supply
• 32–64GB RAM
• CPU air cooler (preferred); water cooler (optional)

Included Accessories:
• Logitech K400 Plus wireless keyboard + trackpad combo
• 3x SmallRig phone holders per bay (for swing capture/media use)

Cost: $3,500
```

## Range Pods Pilot Project - Foresight Falcon Launch Monitor - River Oaks Clubhouse

```
### **Concept**

* Clubhouse is testing **Range Pods** at River Oaks — self-contained, weatherproof practice pods with advanced tracking.
* Each Range Pod is equipped with a **Foresight Falcon** launch monitor, providing industry-leading precision in outdoor conditions.
* These units allow golfers to practice with full feedback on tempo, ball flight, and club path even during off-peak hours or poor weather.

### **Operational Notes**

* Range Pods will be **seasonal** — operational spring through fall, then **stored indoors during winter** to protect sensitive equipment.
* Electronics will be removed or secured as needed for winter storage.

### **Goal**

* Extend practice utility of the range even when traditional range hours or weather limit access.
* Eventually tie into the Clubhouse ecosystem for swing data tracking, leaderboard challenges, and off-season competitions.
```

## Redundancy Plan - Kisi Device Backup - Cost Estimate $2000 per Location

```
• Equip each new location with a dedicated Kisi device as a backup system.
• If not actively used, devices can remain offline or on a low-tier plan to reduce cost.
• Maintain devices in a ready-to-activate state.
• Target Cost Estimate: $2,000 per location for hardware and setup.

Note for consideration:
• As we add advanced features to the custom Clubhouse system, reverting to a fallback like Kisi may result in temporary loss of enhanced functionality.
• While still valuable as an access backup, the Kisi system may be better suited as a lightweight fallback for simpler deployments like Pickleball or range-only facilities.
• Jason to evaluate strategic value of maintaining this balance in complexity vs. reliability.
```

## Remote Control Standards - Device Management - Power and Diagnostics Evaluation

```
• Every device and system component must be remotely controllable.
• Example: side screens must be enabled/disabled via software; physical power buttons to be disabled if possible.
• All new devices should be evaluated for remote power, diagnostics, and reboot capability before deployment.
```

## Replacement Parts List - Club Adjust Tool, Ikea Board, Signage, Tables, Chargers, TV, Projector, PC, Monitor

```
Item	Source	Replacement time
Club Adjust Tool	Amazon	When broken or stolen
Ikea Board Parts	Ikea	Broken
Signage (Clubhouse)	Vistaprint	Broken or damaged
Tables	Ikea	Broken
Wireless Chargers	Home Depot	When broken 
43inch TV (Samsung 6K)	BBY/Amazon	When broken
Projector	BenQ	See Mike
PC/Trackman	Trackman/Custom	See Mike/Dylan
Monitor	Lenovo	When broken
```

## Richelieu Flush-Mount Wireless Chargers - Seating Area Integration - Cost $100

```
2x Richelieu flush-mount wireless chargers integrated into the seating area or side shelf.
Cost: $100
```

## River Oaks Golf Club - Clubhouse Partnership - Trackman Simulator Installation

```
**Location**: River Oaks Golf Club, Nova Scotia
**Partnership Type**: Indoor simulator box installation + broader infrastructure support
**Clubhouse Role**: Technology provider, indoor simulator operator, experience designer
**River Oaks Role**: Venue provider and community-facing golf course

River Oaks is the **first-ever outdoor golf course to partner with Clubhouse**. This represents a major step forward in Clubhouse’s growth: expanding from standalone indoor locations to a fully integrated, hybrid model within traditional golf environments.

Clubhouse is installing and managing a premium Trackman-powered golf simulator box inside the River Oaks clubhouse. This is part of a long-term strategy to blur the line between indoor and outdoor golf, make River Oaks a year-round destination, and demonstrate the future of automated Clubhouse installations hosted within partner venues.
```

## River Oaks Golf Innovations - Clubhouse Tech Integration - Range Pods & Partnerships

```
* River Oaks is a **flagship proof-of-concept** for:

  * Seamless indoor/outdoor golf season transitions
  * Tech-forward infrastructure upgrades (Wi-Fi, automation)
  * Mutually beneficial partnerships where the golf course remains fully in control, and Clubhouse powers the experience behind the scenes
  * **“Powered by Clubhouse” installations** that enhance traditional golf venues while maintaining their identity
  * Testing of **Range Pods with Foresight Falcon launch monitors** as a scalable innovation for outdoor year-round training
  * Operational learnings on **seasonal shutdowns and winter protection for outdoor systems**
  * **First hybrid integration of a Clubhouse system inside a real golf course**
  * Pilot site for **Jason’s backend and system interface testing**
  * **Blueprint for national partner-hosted Clubhouse expansions**
```

## River Oaks Physical Upgrades - Clubhouse Equipment Policy - Simulator Testing Pilot

```
* **All physical upgrades (walls, slabs, etc.) belong to River Oaks**
* **All equipment, tech, and signage remains Clubhouse property**
* **Simulator will be tested over several months to ensure winter readiness**
* **This is a pilot for future Clubhouse x Golf Course integrations across Atlantic Canada**
* **River Oaks serves as the blueprint for partner-hosted Clubhouse installations at other courses**
```

## River Oaks Wi-Fi Expansion - Ubiquiti UniFi Mesh - Full Course Coverage Plan

```
### **Summary**

River Oaks will offer the **farthest-reaching Wi-Fi coverage of any golf course in the region**, with the ability to expand to full course coverage in the future. This infrastructure benefits the demographic that values staying connected for work but would rather spend their day at River Oaks.

This system uses **power-only, wireless backhaul infrastructure** to eliminate trenching and Ethernet runs. All gear is **fully owned by River Oaks**, ensuring long-term independence regardless of future partnerships.

### **Technical Infrastructure Plan**

#### Clubhouse (Main Hub)

* 1x UDM and 24-port PoE switch (pre-installed)
* 3x **Device Bridge Pro Sector** units for long-range directional broadcasting
* 1x **U7 Outdoor Access Point** for local clubhouse coverage
* 1x **U7 Long-Range Access Point** (optional directional boost)

#### Powered Remote Sites (No Ethernet)

Each powered site includes:

* 1x **Device Bridge Pro** (receiving signal)
* 1x **Switch Flex Utility** (weatherproof PoE passthrough)
* 1x **U7 Outdoor** or **U7 Long-Range** Access Point

#### Confirmed Node Locations

1. **Storage Building** (235m from clubhouse, power available)
2. **Parking Lot Pole** (~100m from clubhouse, power will be added)
3. **Future Expansion**: Additional nodes across the course as power becomes available

### **Equipment List Summary**

* 3x Device Bridge Pro Sector
* 3x Device Bridge Pro
* 3x U7 Outdoor Access Points
* 2x U7 Long-Range Access Points
* 3x Switch Flex Utility
* 1x UniFi Cat6 Cable Box
* 5x PoE+ Injectors (optional backups)
* 1x Switch Flex 3-Pack (optional future expansion)

### **Coverage Expectations**

* Wi-Fi signal extends **up to 700 feet in all directions** from each node using pro-grade gear
* Initial install will cover: clubhouse, parking lot, and storage shed areas
* System is preconfigured to add 2 more APs anytime, anywhere on the course
* Designed to prioritize **tee boxes and greens** where golfers use phones for yardages, scoring, or tournaments
* Full course coverage estimated to require 10–15 nodes over time

### **Installation & Expansion Timeline**

* Base install covers clubhouse + 2 powered nodes
* Additional nodes will be **free to install** — River Oaks pays only for new gear (~\$500/node)

### **Marketing & Strategic Value**

* Solves mobile dead zones without disrupting the grounds
* Reinforces River Oaks’ reputation as a tech-forward, innovative course
* Helps **pressure carriers to improve local cell tower service** by showing real user demand

### **Ownership Terms**

* All Wi-Fi infrastructure is fully owned by River Oaks
* If Clubhouse partnership ever ends, network remains fully operational and under River Oaks’ control

### **Technical Details**

* **Cost**: \$5,000 + tax (all-inclusive install)
* **Technology**: Ubiquiti UniFi Mesh architecture

  * Outdoor-rated access points
  * Centrally managed cloud controller
  * Real-time analytics and monitoring
* **Initial Coverage**: Clubhouse, patio, upper practice area, front lot, and start of Hole 1
* **Scalability**: Additional nodes can be added over time to cover the full 18 holes

### **Strategic Value**

* Converts a known customer complaint (bad reception) into a strategic brand differentiator
* Enables better pace-of-play tracking, range data syncing, and future integrations
* Gives River Oaks a first-mover advantage in golf tech infrastructure in Atlantic Canada

### **Marketing Opportunities**

* Highlighted as part of new River Oaks digital transformation
* Messaging framed around: “No more dropping off the grid to play a round”
* Tied to Clubhouse brand as part of a modernized experience
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

## Samsung 43” 6900 Series TVs - Dual Wall-Mounted - Full-Motion Swivel Brackets

```
Dual 43” Samsung 6900 series, wall-mounted on full-motion swivel brackets for ambidextrous layouts.
Cost: $1,200
```

## Samsung 65”+ TV Scoreboard Display - Central Audio System Setup - Rack-mount Receiver, Speakers, Subwoofer

```
• Scoreboard Display – Samsung 65”+ TV (1 per location)
• Central Audio System – Rack-mount receiver, speakers, subwoofer
```

## Server Rack Mounting & Layout - Network Gear & Gaming PCs - Ventilation & Locking

```
Use Case	Rack Size	Notes
Network gear only	6U Rackmount	Fits UDM-SE, switch, UPS, patch panel
With Gaming PCs	15U Rackmount	Holds 2x full-size PCs, + all infra gear
• All racks should be ventilated and lockable
• Wall-mounted preferred for small spaces, floor rack for PC-heavy sites
```

## Server-Side Training Q3 2025 - Dylan Shadows Jason - System Stability & Stress Test Protocols

```
• Dylan to shadow Jason on server-side training in Q3 2025.

Dylan’s role includes:
• Gaining a functional understanding of system stability, recovery logic, and infrastructure design.
• Knowing enough to guide outside developers in the event custom coding is needed.
• Building and managing pre-launch stress test protocols for on-location validation (since Jason will likely not be on site during launches).
```

## Session Logs and Manual Installs - Live Updates - Key Procedures

```

```

## Simulator Box Cost Estimate - $38,970 to $52,970 CAD - Hardware, Furniture, Branding

```
$38,970 – $52,970 CAD (Excludes tax and labor)

This estimate includes all required hardware, furniture, and branding for a fully functional simulator box. Price range varies based on launch monitor choice and any optional finishes.
```

## Simulator Hardware Setup - TrackMan I.O., Ryzen X3D, BenQ Projector - Per Bay Equipment List

```
• Launch Monitor (TrackMan I.O. preferred)
• Gaming PC (Ryzen X3D or i7 with 5070Ti or better)
• Touchscreen Display (27”+, 1080p or better)
• Dual TVs (x2 per bay) – Samsung 43” or equivalent
• Projector – BenQ LK935ST or LK936ST
• Projector Mount – 1 per bay
• Enclosure & Screen System (Foresight or Great North Golf)
• Turf & Hitting Mat – 3D Pro / JordansContact
• Hitting Strips – 3D Pro
• Club Storage Rack – Amazon
• Seating – Bench or Chairs (IKEA)
• Table – for PC & accessories
• Mini Fridge – Best Buy or Amazon
• Wireless Phone Chargers – 2 per bay (in-table, Richelieu or similar)
• Keyboard + Mouse Combo – Logitech K400+ or equivalent
• Wall-Mounted Club Holders – x2 per bay (3D printed)
• USB Cameras – 2 per bay (TBD)
• IKEA SKADIS wall accessory mounts – 3D print holders or buy
• Soundbar – 1 per bay
• Overhead Track Lighting – 1 per bay (Amazon)
• Blackout Curtains / Rear Screen Protection – per bay
• Side Impact Mats – Canada Mats or Commercial enclosure
• Mounts, Cables, and Power Bars
```

## Simulator Pricing and Maintenance Policy - $2500 Setup - $500 Monthly - Clubhouse Support

```
• $2500 initial setup cost
• $500 per simulator per month (1-2 days revenue in season) to be almost fully hands off and able to open more locations.
Limits would be in place in case customers continue to call about negligence from owner for facilities (broken items not fixed). Clubhouse can support or replace in many cases as a one off charge to the facility or business owners, but expect it to be resolved quickly to avoid unneeded customer interaction.
```

## Skedda Booking Analysis - Review Tags and Gift Card Utilization - Promo Adjustment

```
• Review tags
• Compare gift card tags with the number of bookings and activation dates
• Review location utilization and adjust promo if necessary
```

## Sound Bar Setup & Track Lighting - Amazon Sourced - $500 Cost Per Bay

```
Standard moving forward is a sound bar setup per bay. Lighting is track-style directional, sourced from Amazon (approx. $200 per bay).
Cost: $500
```

## Spare Inventory Pre-Stock - Launch Monitor, Gaming PC, Projector, PoE Injectors

```
• 1x Launch Monitor (spare can be centralized)
• 1x Gaming PC
• 1x Projector
• Misc. Touchscreens / TVs – 1–2 each
• 5x PoE Injectors
• Extra Hitting Mats – Fiberbuilt / 3D Pro
• Cables / Adapters / Mount Kits / Tools Bin
• Balls, bathroom, and cleaning consumables
```

## System Recovery Playbook - Server Failure Alerts - Auto-Degrade Mode - Kisi Access Control

```
• If the primary server fails, an email alert is triggered to Jason, Mike, and Dylan.
• If the secondary backup server fails to ping or respond, a text message and secondary email alert is issued to all three.
• Explore an auto-degrade mode that disables advanced features but keeps core functionality (access + booking).
• If graceful degradation is not possible, system should fail over to Kisi access control and manual booking entry until server is restored.
```

## Tech Box Consumables - Replacement Schedule - Vice, Amazon, Foresight Sources

```
Item	Source	Replacement time
Balls	Vice	Daily
Tee’s	3D Print / Amazon	Daily
Carpet Tape	Amazon	Monthly
Hitting pads	TBD	Monthly/Bi-monthly
Screen replacement	Foresight/GreatNorth	Yearly/6months
```

## Tech Health Checklist - Daily, Weekly, Monthly, Yearly Tasks - HUBSPOT FORM

```
1. Tech Health Checklist:
	• Create a comprehensive tech health check covering:
	• Daily Tasks: Quick system checks list HUBSPOT FORM
	• Weekly Tasks: Routine maintenance. list HUBSPOT FORM
	• Monthly Tasks: Detailed inspections. HUBSPOT FORM
	• Yearly Tasks: Replacement of long-life parts (e.g., keyboard batteries, system components). HUBSPOT FORM.
```

## Technical Feasibility - Auto-Failover, Booking Migration, QR Activation - Jason, Mike, Dylan

```
• Jason to assess technical feasibility of auto-failover.
• Mike to align fallback rollout with expansion schedule.
• Dylan to begin documentation of server ops with Jason.
• Team to begin planning and simulation of booking software migration, prioritizing UX consistency.
• Plan test deployment of new system at River Oaks as a trial ground for the new platform.
• Begin outlining backend logic and payment flow for QR-based range activation, targeting future monetization.
• Evaluate purchasing and configuring dual-server hardware failover setup with UPS protection.
• Jason to explore feasibility of HDBaseT projector control logic as soft session enforcement.
• Begin research on Ubiquiti video/motion-based presence validation for future deployment.
• Draft UI design for backend control panel aligned with operator priorities.
• Design and implement automated customer email logic tied to visit milestones.
• Jason to explore integration of facial recognition for booking verification using Ubiquiti AI capabilities.
• Dylan to develop pre-launch stress test checklist for all new system rollouts.
• Track opportunities for automated locker control in tandem with membership logic.
```

## Tech Sales and Support Strategies - Infrastructure Growth - Monopoly Planning

```
These aren’t slogans. They’re operations:
	•	We sell tech to other sims because supporting them strengthens our infrastructure.
	•	We run tournaments under their name because we want the ecosystem to grow.
	•	We offer our support stack because it forces us to make it cleaner, better, modular.
	•	We plan like a monopoly while executing like a single-operator startup.
```

## Three-Step Audit Cycle - Boundary Audit - Leverage Redefinition - Upstream Integrity

```
1. Boundary Audit
	o Ask: “What part of this task is currently being handled by me that could be offloaded?”
	o Identify where human time is still being spent unnecessarily — whether out of habit, fear, or lack of system trust.
	o Look for repetitive work, linear thinking, memory burden, or emotional labor not requiring human uniqueness.
2. Leverage Redefinition
	o Redefine the role of the human in the system:
		 What is your irreplaceable function?
		 Where does your cognition outperform automation — strategy, intuition, value setting, or relational discernment?
	o Use this to recenter effort around signal — not just output.
	o If AI handles 80%, what should the 20% be?
3. Upstream Integrity Enforcement
	o Ensure systems are designed with upstream leverage in mind.
		 Fix issues at the root: structure, interface, instructions, feedback loop.
	o Avoid duct-taping human time onto broken systems.
	o If a fix requires “more effort,” that’s often a sign of poor system design.
```

## Touchscreen Monitor - 27”–32” Full HD/4K - Sim Interface & Customer Control

```
Mounted touchscreen used for sim interface and customer control. 27”–32”, full HD (1080p) or 4K resolution.
Cost: (Included in PC setup or quoted separately if upgraded)
```

## Tournament Management - Review Payouts and Update Listings - Business Operations

```
• Review tournaments and pay out winners
• Create new tournaments and update/post
•
```

## Trackman 4, Uneekor iXO2, Foresight Falcon - Premium Launch Monitors - Player Segment & Budget Guide

```
Trackman 4, Uneekor iXO2, or Foresight Falcon – selected based on player segment, budget, and software preference. All are premium-tier launch monitors suited for competitive and recreational play.
Cost: $14,000 – $28,000
```

## TrackMan Simulator Support - Live Session Assistance - Remote Control & Diagnostics

```
Covers everything *during* the customer’s session:

* TrackMan or system issues
* Reset requests
* Software confusion or malfunction
* Any support needed while actively playing

We guide the customer live via SMS (on their cell phone) while remotely controlling the TrackMan system. The customer doesn’t touch anything confusing—we handle it directly.

As part of this, we install our support software on your simulator computers to enable remote control and diagnostics. We also install support cameras so our operators can see what the customer is doing in real time and guide them more effectively.

We request that each facility owner complete a detailed questionnaire outlining their refund policies, pricing structure, and any location-specific guidelines. This ensures ClubOS can respond to your customers exactly as *you* would.
```

## Ubiquiti Access Point Mounting - Pressure-Treated Post - Solar Panel Bracket

```
• Ubiquiti Access Points should be mounted to a pressure-treated post using a 2x6 or 2x8 crossbeam
• Crossbeam should be mounted to the post using galvanized lag or carriage bolts
• Solar panel bracket attaches to crossbeam
• Mount height is chosen based on range and obstruction needs
• Products sourced from Home Depot, Kent, or RONA
```

## Ubiquiti Network Infrastructure - Dream Machine SE, PoE Switch, Access Points, Cameras

```
• Ubiquiti Dream Machine SE (UDM-SE)
• PoE Switch – 1 Ubiquiti Flex per bay
• Ubiquiti Access Points – U6 LR
• Ubiquiti Cameras – 1 per bay + wide room cam
• PoE Injectors – As needed
• Server Rack – 12–15U, wall-mounted, dust-proof
• Mini PC – Ubuntu Door Server
• Cat6 Network Cable – 2x 500ft boxes (1000ft total)
```

## Ubiquiti Smart Access Integration - Motion Detection, Facial Recognition, Security Sync

```
• Evaluate using Ubiquiti door access + camera systems to monitor locations more intelligently.

Explore:
• Motion detection or video triggers based on expected presence.
• Facial recognition mapping to customer profiles.
	o Identify and associate frequent customers (e.g. Tommy Blackburn) with facial ID.
	o If a booking is assigned to one customer, but a different person is detected, trigger an internal flag.
	o After 2–3 flags, escalate to email-based operator alert.

Behavioral Pattern Flagging:
• Flag unusual activity such as late-night 1-hour bookings where 3–4 people are present.
• Very unlikely that multiple people will stay for only one hour during off-peak hours.
• These cases can be reviewed for potential abuse or misaligned pricing incentives.

Security Sync for Customer Claims:
• If a customer contacts the support line, system will automatically flag and extract Ubiquiti footage for that session window.
• Video will be tagged from start to end of the customer’s booking, aiding quick verification in case of damage, abuse, or complaints.
```

## Ubiquiti UISP-Cable-C6-CMR Cat6 - Ethernet Backbone for PoE Devices and Network Distribution

```
Ubiquiti UISP-Cable-C6-CMR (Cat6, 500 ft)
• Solid copper, shielded, CM rated
• Used for APs, table/kiosk ports, PoE devices, door locks, cameras

Bay-Specific Network Distribution
• Run a single network cable to each simulator bay
• Terminate into a UniFi Flex Mini switch inside each bay
• From the Flex Mini, distribute to:
o TrackMan unit
o Gaming PC
o Projector (if applicable and requires Ethernet, e.g., for remote control or updates)
• Power the Flex Mini via PoE from the main switch or UDM-SE
```

## UniFi Access Control Solutions - Multi-Door and Single-Door Options - PoE, NFC, PIN

```
Option A: Multi-Door Sites or Expansion-Ready
• UniFi Access Hub (PoE-powered door controller)
• UniFi Access Reader Flex (with PIN pad)
• Compatible Door Lock: Either:
o Magnetic Lock (3rd-party)
o UniFi Electric Strike Lock (when available/compatible)
• UniFi Access Cards (optional for staff backup)

Option B: Single-Door Sites (Simplified)
• UniFi Access Ultra (all-in-one reader/controller/relay with battery)
• Supports PIN entry, NFC card, and mobile unlock
• Ideal for lean builds (e.g., one-bay or external shed setups)
```

## UniFi Dream Machine SE - Core Controller & Gateway - PoE Ports & Surveillance HDD

```
UniFi Dream Machine SE (UDM-SE)
• Centralized routing, switching, and network controller
• 8x PoE GbE ports (6x PoE+, 2x PoE)
• 1x 10G SFP+ WAN, 1x 10G SFP+ LAN
• 1x 3.5” HDD bay for UniFi Protect (optional)
• Internal 128GB SSD for local logs
• Recommended: Install 4TB 7200RPM Surveillance-Grade HDD
o Purpose: 24/7 recording via UniFi Protect
o Retention target: 7–30 days depending on resolution and camera count

Supplemental System:
• Mini PC running Ubuntu Server mounted next to UDM-SE
o Purpose: Dedicated backbone for ClubOS-based door access
o Typically active unless fallback to Kisi is triggered
o Mounted in the same rack with isolated power and cooling path
```

## UniFi Protect Camera System - Indoor/Outdoor Setup - PoE and Wide-Angle Models

```
Standardization in progress – subject to testing across sites.

Indoor Setup (Per Bay):
• Each simulator box will have its own PoE-powered camera
• Model may vary (G5 Bullet, G5 Flex, etc.) depending on mounting constraints

Facility Overview:
• One wide-angle ceiling-mounted camera positioned centrally to capture full-room activity
• Used for motion analysis, traffic flow, and support validation

Outdoor/Entry:
• One super wide-angle camera mounted above entry, facing signage and doorway
• Captures approach and parking zone

System Notes:
• All managed through UniFi Protect via UDM-SE
• Retention goal: 7–30 days depending on risk level and HDD size
```

## UniFi Switch 16 PoE - USW-16-POE - 16x GbE Ports, 2x SFP Uplinks, Rack-Mountable

```
UniFi Switch 16 PoE (USW-16-POE)
• 16x GbE ports (8x PoE+, 8x Standard)
• 2x SFP uplinks
• Rack-mountable, fanless design
• Powers cameras, signage, access readers, or range box devices
```

## UniFi U6 Long-Range Access Point - Wi-Fi 6 Indoor AP - 3,000-5,000 Sq Ft Coverage

```
UniFi U6 Long-Range
• Wi-Fi 6, long-range indoor AP
• Up to 3,000–5,000 sq ft coverage
• Wall or ceiling mount
• Typical: 1 per bay or 1 per open-floor Clubhouse site
```

## Upgraded Beverage Fridge - Best Buy - White or Black Finish - $450

```
Upgraded beverage fridge from Best Buy. White or black finish selected to match room design.
Cost: $450
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

## Vertical Golf Club Holders - Amazon Sourced - Accessory Update & Cost Estimate

```
2x vertical golf club holders, Amazon-sourced. Updated estimate includes minor accessory changes.
Cost: $150
```

## Wall Signage Branding - Entrance and Exterior Design - Cost $500

```
Wall signage and optional branded design pieces. Typically mounted on entrance wall or enclosure exterior.
Cost: $500
```

## Weekly Tech Checklist - Trackman Simulator Updates - Projector & Network Maintenance

```
Frequency: Once a week (preferably on a low-traffic day).
1. Simulator & Software Updates
• Check if your simulator software (Trackman) has pending updates; schedule or install if needed.
• Do a full reset on the trackman io (hold green power for 8 seconds with grip of a golf club. Be careful not to push too hard and misalign the Trackman)
2. Projector Alignment & Focus
• Briefly confirm the projector image is still sharp and aligned. Minor adjustments if image drift occurred.
3. Network Verification
• Confirm the location’s internet connection has no outage alerts. (No need for a detailed speed test—just ensure stable connectivity to the simulator PC.)
4. PC & Peripheral Review
• Check disk space on each PC, ensuring no major drive capacity issues.
• Verify keyboards/mice remain responsive and aren’t running out of battery (if wireless).
5. Light Dusting (Tech Only)
• If projector vents or PC vents are visibly dusty, do a light dusting (compressed air or cloth), focusing on technology components only.
6. Minor Issues Logging
• Note any slightly worn hitting mats or screen/projector issues for the monthly check.
```
