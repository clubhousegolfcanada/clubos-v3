#!/bin/bash

# ClubOS V2: Problem-First Directory Structure
# Built for how YOUR brain works, not how coders think

echo "🧠 Creating Human Logic-First Structure"
echo "====================================="
echo ""

# Create problem-focused directories
echo "📁 Creating problem-solving structure..."

# Start with PROBLEMS, not code
mkdir -p problems/{pin-issues,booking-questions,tech-support,pricing,complaints}
mkdir -p solutions/{working,needs-improvement,failed}
mkdir -p conversations/{real-examples,test-scenarios,edge-cases}
mkdir -p logic/{business-rules,decision-trees,response-templates}
mkdir -p learning/{patterns,improvements,metrics}

echo ""
echo "📝 Creating your first problem to solve..."

# Create PIN problem example
cat > problems/pin-issues/story.md << 'EOF'
# PIN Access Problems

## The Problem
Customers can't remember their PIN or it's not working. This happens 20+ times per day.

## Current Manual Process
1. Customer texts/calls: "My PIN isn't working"
2. Staff checks booking system
3. Staff tells them PIN (last 4 of phone)
4. If still not working, staff gives backup PIN (0000)
5. Takes 3-5 minutes per incident

## Desired Automated Process
1. Customer texts: "My PIN isn't working"
2. ClubOS instantly responds with their PIN
3. Takes 5 seconds

## Real Examples
- "I forgot my PIN"
- "Access code not working" 
- "Can't get into bay 3"
- "What's my code?"
- "PIN???"

## Business Logic
- PIN is ALWAYS last 4 digits of phone number on booking
- Backup PIN is ALWAYS 0000
- Must verify they have active booking first
- Be friendly and helpful

## Success Metrics
- Resolve in <10 seconds
- No staff involvement needed
- Customer happy
EOF

# Create solution template
cat > logic/business-rules/pin-logic.md << 'EOF'
# PIN Access Logic

## Decision Tree
```
Customer mentions PIN/access/code problem
    ↓
Do they have active booking today?
    ├─ YES → Give them PIN (last 4 of phone)
    │    └─ Still not working? → Give backup (0000)
    └─ NO → Check if booking is at different location
         └─ Still no? → Ask for booking details
```

## Rules
1. ALWAYS verify active booking first
2. PIN = last 4 digits of phone on booking
3. Backup PIN = 0000
4. If no booking found, escalate to human

## Friendly Responses
- Found: "I found your booking! Your PIN is [XXXX] (last 4 of your phone number). If that doesn't work, try 0000."
- Not found: "I don't see an active booking under this number. What name or email did you use to book?"
- Multiple locations: "I see bookings at multiple locations. Which location are you at?"
EOF

# Create test scenarios
cat > conversations/test-scenarios/pin-variations.md << 'EOF'
# PIN Problem Variations to Test

## Basic Cases
1. "My PIN isn't working" → Standard response
2. "I forgot my PIN" → Standard response
3. "What's my access code?" → Standard response

## Edge Cases
1. "PIN not working at bay 5" → Include location check
2. "Neither PIN works" → Escalate to human
3. "I'm at the wrong location" → Help them find right location

## Angry Customer
1. "This stupid PIN never works" → Stay calm, help quickly
2. "I've been waiting 10 minutes!" → Apologize, solve fast

## Test Each With
- [ ] Customer has booking
- [ ] Customer has NO booking  
- [ ] Customer at wrong location
- [ ] Multiple bookings same day
EOF

echo ""
echo "🎯 Creating your problem-solving workflow..."

cat > START_HERE.md << 'EOF'
# ClubOS V2: Start Here!

## Your Problem-Solving Workflow

### Step 1: Pick a Problem (You've Done This!)
- PIN access issues ✓

### Step 2: Write the Solution Story
- See `/problems/pin-issues/story.md`
- Write how YOU would solve it

### Step 3: Define the Logic
- See `/logic/business-rules/pin-logic.md`
- What decisions need to be made?

### Step 4: Create Test Conversations
- See `/conversations/test-scenarios/pin-variations.md`
- Think of all the ways customers might ask

### Step 5: Build Just This Feature
```javascript
// Claude will write this part based on your logic
if (customerMessage.includes('PIN')) {
  // Your business logic here
}
```

### Step 6: Test with Real Customers
- Copy actual customer messages
- See if ClubOS handles them correctly
- Save failures for learning

### Step 7: Improve
- What patterns do you see in failures?
- Update logic
- Test again

## Today's Goal
Perfect the PIN problem solution:
1. ✓ Problem defined
2. ✓ Logic written  
3. □ Build the handler
4. □ Test with real messages
5. □ Deploy to one location
6. □ Monitor for 24 hours
7. □ Improve based on results

## Remember
- You're not coding, you're teaching the system your business
- Start with ONE problem and perfect it
- Real customer examples > theoretical edge cases
- If it works for PIN problems, apply same approach to everything else

## Your Advantages
1. You know what customers actually ask
2. You know the real business rules
3. You can test with real customers immediately
4. You can iterate faster than any developer

Let's solve PIN problems so well that you never have to answer "what's my PIN?" again!
EOF

echo ""
echo "✅ Human-logic structure created!"
echo ""
echo "📋 What we built:"
echo "- /problems - Real customer problems to solve"
echo "- /solutions - What's working and what isn't"
echo "- /conversations - Real examples to test"
echo "- /logic - YOUR business rules"
echo "- /learning - Patterns and improvements"
echo ""
echo "🎯 Your first mission:"
echo "1. Read START_HERE.md"
echo "2. Review /problems/pin-issues/story.md"
echo "3. Add any PIN variations you see daily"
echo "4. We'll build JUST the PIN solution first"
echo ""
echo "Remember: One perfect solution > 100 half-built features"