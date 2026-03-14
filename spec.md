# BharatRoads - Premium Ride & Rental Platform

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Home portal with 4 role-based modules: User App, Driver App, Fleet Owner Portal, Admin Panel
- User App: pickup/destination input, one-way/round-trip toggle, India fare engine (base fare + per km + GST 5% + driver allowance for round trip), ride booking flow, simulated driver search status, share tracking link
- Driver App: online/offline toggle, ride request cards, simulated earnings dashboard, navigation placeholder
- Fleet Owner Portal: vehicle list management, driver assignment, maintenance alerts
- Admin Panel: live trips counter, active drivers, revenue stats, fraud alert list
- India-specific fare engine: base fare 500, 13/km, 5% GST, round trip x2 + 300 driver allowance
- Role selection screen with clean card UI
- Simulated real-time driver location movement after booking
- Ride share tracking link generation
- Authorization component for role-based access

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Select authorization component
2. Generate Motoko backend for rides, drivers, fleet, admin data
3. Build frontend with 5 screens: Home, User, Driver, Fleet, Admin
4. India fare engine with GST calculation
5. Simulated GPS tracking with setInterval
6. Role-based navigation
