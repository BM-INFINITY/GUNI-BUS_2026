# GUNI-BUS Driver App — Design Context

## App Overview
- **Who:** Bus drivers (non-technical, older adults, time-pressured)
- **What:** Scan student QR codes + manage daily bus trip milestones
- **Goal:** Simple, fast, minimal — one action at a time

---

## Screens

| Screen | Description |
|---|---|
| **Login** | Employee ID + password. Single form, large inputs, one CTA. |
| **Dashboard** | Central hub. Shows current trip phase + stats + action buttons. |
| **Scan QR** | Live camera scanner. Full-screen. Shows result after each scan. |
| **Route Details** | Static info about the driver's assigned route and stops. |

---

## Trip Phase Flow (Dashboard State Machine)

```
⏳ Not Started
    ↓ [Start Shift] — enter odometer KM
🟢 Boarding  ← scanning ENABLED
    ↓ [Reached University] — enter odometer KM
🏫 At University ← scanning DISABLED
    ↓ [Start Return] — enter odometer KM
🔵 Returning ← scanning ENABLED again
    ↓ [Reached Home] — enter odometer KM
✅ Completed ← all actions disabled
```

Each phase transition requires the driver to enter a numeric odometer reading (must always increase).

---

## Dashboard Layout Priority

1. **Phase Status Card** (most prominent — full-width, color-coded border)
   - Icon + phase name + student count
2. **Scan QR Button** (large, primary color — active only in Boarding/Returning)
3. **Trip Control Buttons** (grid of 4 — greyed out when not applicable):
   - Start Shift / Reached Uni / Start Return / Reached Home
4. **Stats Row** (Checked In · Total Booked · Revenue)

---

## Scan Result Screen

After every QR scan, show full-screen result:

**Success (green):**
- ✅ "Boarding Verified" or "Return Verified"
- Student photo (if available)
- Student name (large)
- Enrollment number
- Shift badge (Morning / Afternoon)
- Scan count `1/2` or `2/2`
- CTA: "📷 Scan Another Student" (primary)
- Link: "← Back to Dashboard" (secondary)

**Failure (red):**
- ❌ "Scan Rejected"
- Error message in plain English (e.g. "Wrong Route", "Already scanned")
- Same CTA buttons

---

## Key Constraints to reflect in UI

| Rule | UI Implication |
|---|---|
| Scanning only works in Boarding and Returning phases | Scan button disabled + greyed with label "Start your shift first" |
| Max 2 scans per student per day | Show live scan count `1/2`, `2/2` on result |
| Morning boarding cutoff: **8:30 AM** | Backend rejects after cutoff — show clear error |
| Shift mismatch blocks scan | Show "Shift Mismatch" error message |
| Wrong route blocks scan | Show "Wrong Route" error message |
| Odometer must always increase | Validate numeric input before submit |
| Each action requires odometer entry | Use a bottom-sheet modal for input |

---

## UX Rules

- **Touch targets:** All primary buttons ≥ 56px tall
- **One primary action per screen** — no multi-step flows
- **Disabled ≠ Hidden** — always show disabled buttons at 35% opacity
- **Instant feedback** — scan result shown immediately after scan
- **No jargon** — all labels in simple English
- **Large readable text** — driver names, phase labels at 20px+

---

## Color System

| Token | Color | Used For |
|---|---|---|
| `primary` | Blue | Scan button, active state, returning phase |
| `success` | Green | Boarding phase, successful scan |
| `warning` | Amber | At University phase |
| `danger` | Red | Errors, rejected scans, logout |
| `background` | Dark | App background |
| `surface` | Card dark | Cards, modals |
| `textSecondary` | Muted grey | Labels, hints |
