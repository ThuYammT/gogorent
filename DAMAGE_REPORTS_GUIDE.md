# Damage Reports Feature - Complete Setup Guide

## Overview
The Admin > Damage Reports page now displays all historical and current damage reports from both renters and owners in a unified dashboard.

## Why Reports Weren't Showing

The database was **empty** - there were no damage reports in the system. This has been fixed by:

1. ✅ Enhancing the seed script to generate sample damage reports
2. ✅ Running the seed script to populate the database with test data
3. ✅ Improving the Admin UI to show reporter roles clearly

## Complete Setup Steps

### Step 1: Run the Seed Script
To populate your database with sample data including damage reports:

```bash
npx tsx scripts/seed-demo.ts
```

**Output:**
```
✅ Added 2 users, 2 devices, 3 rentals, and 3 damage reports
```

This creates:
- 2 demo users (1 owner, 1 renter)
- 2 sample devices
- 3 rental transactions
- **3 damage reports** with different statuses

### Step 2: Access the Admin Dashboard

1. Login as admin
2. Navigate to **Admin Dashboard**
3. Click **Damage Reports** in the sidebar

### Step 3: View Sample Reports

You'll now see 3 sample damage reports:

#### Report 1: Renter Report (OPEN)
- **Reporter**: Alex Renter 🔵 RENTER
- **Status**: Open (red badge)
- **Description**: Device has a small scratch on the lens
- **Estimated Cost**: $150

#### Report 2: Owner Report (UNDER REVIEW)
- **Reporter**: Mali Owner 🟠 OWNER
- **Status**: Under Review (amber badge)
- **Description**: Battery not holding charge properly
- **Estimated Cost**: $200

#### Report 3: Renter Report (RESOLVED)
- **Reporter**: Alex Renter 🔵 RENTER
- **Status**: Resolved (green badge)
- **Description**: Minor screen dust - cleaned during inspection
- **Estimated Cost**: $0

## UI Features

### Dashboard Cards
- **Open reports**: Count of OPEN status reports
- **Under review**: Count of UNDER_REVIEW status reports
- **Resolved**: Count of RESOLVED status reports

### Search & Filter
- Search by: device name, reporter name, or email
- Filter by: All, Open, Under Review, Resolved, Dismissed
- Pagination: Browse reports in pages of 10

### Report Details Displayed
✅ Device image, name, and condition  
✅ Report ID and Rental ID references  
✅ Reporter name and **role badge** (NEW!)  
✅ Renter and owner involved in the rental  
✅ Report creation date and time  
✅ Current status with color coding  

### Role Badges
- 🔵 Blue badge: **RENTER** reported the damage
- 🟠 Orange badge: **OWNER** reported the damage

## Database Schema

### DamageReport Table
```typescript
model DamageReport {
  id              String       @id @default(cuid())
  rentalId        String       // Links to rental
  reporterId      String       // Links to reporter user
  description     String       // What happened
  estimatedCost   Decimal?     // Repair/replacement cost
  deductionAmount Decimal?     // Amount deducted from deposit
  status          DamageStatus // OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
  createdAt       DateTime     // When reported
  updatedAt       DateTime     // Last updated
  
  rental   Rental @relation(...)
  reporter User   @relation(...)
  images   DamageImage[]
}
```

## Status Workflow

| Status | Meaning | Use Case |
|--------|---------|----------|
| OPEN | New report, not yet reviewed | Initial damage report submission |
| UNDER_REVIEW | Admin investigating | Collecting evidence, assessing damage |
| RESOLVED | Issue concluded | Repair completed, deduction applied |
| DISMISSED | Report deemed invalid | No actual damage or false claim |

## Admin Actions

From the Admin > Damage Reports page, you can:

1. **Search reports** - Find specific damage by device or reporter
2. **Filter by status** - Focus on open vs resolved issues
3. **Review details** - See full damage description and cost
4. **Identify reporter** - Know whether renter or owner reported it
5. **Track financials** - See estimated costs and deductions
6. **Manage workflow** - Update status as you investigate (future enhancement)

## Testing Locally

### Test Data
Run the seed script to get sample data:
```bash
npx tsx scripts/seed-demo.ts
```

### View Data
Access the Admin > Damage Reports page to verify:
- All 3 sample reports appear
- Role badges display correctly (blue for renter, orange for owner)
- Status cards show correct counts
- Search and filter work as expected

### Live Dev Server
```bash
npm run dev
# Navigate to http://localhost:3000/admin/damage-reports
```

## How Damage Reports Are Created

### For Renters
When a renter picks up a device at collection, they can:
1. Report issues immediately using QR scan workflow
2. Report damage after the rental period

### For Owners
After a rental is returned, owners can:
1. Inspect the device
2. Report any damage found
3. Document cost of repairs needed

## Future Enhancements

Potential improvements to consider:
- [ ] Admin action panel to update report status
- [ ] Automatic deduction calculation
- [ ] Photo evidence gallery for each report
- [ ] Email notifications to involved parties
- [ ] Dispute resolution workflow
- [ ] Admin notes/timeline for investigation
- [ ] Bulk export of damage reports

## Troubleshooting

### No Reports Showing
**Problem**: Database is empty  
**Solution**: Run `npx tsx scripts/seed-demo.ts` to populate seed data

### Wrong Reporter Showing
**Problem**: Reporter name doesn't match expectations  
**Solution**: Check the `reporter.role` badge - confirms who reported it

### Status Counts Wrong
**Problem**: Dashboard card counts don't match report list  
**Solution**: Verify query filters - counts exclude DISMISSED reports

## Related Files

- **UI Component**: [app/admin/damage-reports/page.tsx](/app/admin/damage-reports/page.tsx)
- **Seed Script**: [scripts/seed-demo.ts](/scripts/seed-demo.ts)
- **Dashboard**: [app/admin/dashboard/page.tsx](/app/admin/dashboard/page.tsx)
- **Database Schema**: [prisma/schema.prisma](/prisma/schema.prisma)

## Recent Commits

```
b048eb2 - feat: Add sample damage reports to seed data
abc1af0 - feat: Display damage reports from both renters and owners in Admin panel
817feb4 - Fix: Remove incompatible runtime export from Omise webhook route
```
