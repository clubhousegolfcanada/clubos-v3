# UI/UX Context

## Current State
Last Updated: 2025-08-01

### Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Mobile-first design

### Pages Built
- ✅ `/` - Dashboard/Thread list
- ✅ `/login` - Authentication
- ✅ `/threads/[id]` - Thread detail
- ✅ `/tickets/create` - Create ticket
- ✅ `/admin/sops` - SOP management

### Components Created
```
/components/
  - ThreadList
  - ThreadDetail  
  - ActionButton
  - MessageBubble
  - StatusBadge
```

### Design System

#### Colors
```css
--primary: #000000 (Clubhouse black)
--success: #10b981
--warning: #f59e0b  
--error: #ef4444
--gray: #6b7280
```

#### Spacing
- Mobile: 16px padding
- Desktop: 24px padding
- Card gap: 12px

#### Typography
- Headers: Inter font
- Body: System font
- Monospace: For codes

### State Management
- Local state for UI
- Server state via API
- No global store yet

### Mobile Considerations
- Touch targets: min 44px
- Swipe gestures planned
- Bottom nav for mobile
- PWA support planned

## Patterns

### Component Structure
```tsx
export default function ComponentName({ props }) {
  // Hooks first
  // Local state
  // Effects
  // Handlers
  // Render
}
```

### API Integration
```tsx
// Using fetch for now
const response = await fetch('/api/endpoint');
const data = await response.json();
```

---
*Update when adding new UI elements*