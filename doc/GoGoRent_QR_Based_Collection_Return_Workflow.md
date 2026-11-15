# GoGoRent: QR-Based In-Person Collection and Return Workflow

## 1. Overview

GoGoRent is a C2C marketplace for renting electronic devices. For in-person exchanges, the platform uses QR-code verification to record device collection and return.

The owner and renter meet in person, scan a booking-specific QR code, inspect the device, and confirm the exchange. The platform stores verification records and condition evidence.

**Core principle:** QR verification confirms participation in the exchange. It does not, by itself, prove the device's physical condition or establish who caused damage.

**Current implementation:** After the collection QR is scanned, the renter
confirms receipt and that the device matches its listed condition. That
confirmation activates the rental and creates one pending rental payment
record for the rental amount plus deposit. No payment is charged. Pre-acceptance
fault reporting and agreed resolutions are implemented. Owner collection
confirmation, collection condition photos, payment processing, and the return
workflow described below are not yet implemented.

## 2. Device Collection (Owner → Renter)

### Scenario flow

| Step | Actor | Action |
|---|---|---|
| 1 | Owner | Opens the confirmed booking and selects **Generate Collection QR**. |
| 2 | Platform | Generates a unique, temporary QR token linked to the booking. |
| 3 | Renter | Opens the booking and selects **Scan Collection QR**. |
| 4 | Renter | Scans the QR code displayed on the owner's phone. |
| 5 | Platform | Validates the token, booking reference, token expiry and whether it has already been used. |
| 6 | Both | Inspect the device and accessories in person. |
| 7 | Renter | Confirms the listed device condition and receipt. |
| 8 | Platform | Records the renter's confirmation, changes the booking status to `ACTIVE`, and creates a pending payment record. |

### Collection confirmation requirements

- QR token is valid, unexpired and unused.
- QR token belongs to the correct booking and collection event.
- Owner and renter are the booking's authorized participants.
- The renter explicitly confirms receipt and the listed condition.

No payment is collected until a payment provider is integrated.

## 3. Fault Discovered During Collection

**Example:** The renter discovers that the laptop battery does not charge during inspection.

### Scenario flow

1. Renter identifies a fault before accepting the device.
2. Renter selects **Report Device Issue**.
3. Renter chooses a fault category and describes the issue.
4. Renter uploads supporting photos or videos where useful.
5. Owner receives a notification and reviews the report.
6. The parties agree on one of the available outcomes:
   - **Replace device:** Owner offers another suitable device, subject to renter agreement and an updated record.
   - **Resolve before handover:** Owner fixes the issue and both parties inspect the device again.
   - **Cancel booking:** The booking is cancelled by agreement. Existing transactions are flagged for manual review under the cancellation policy; no money moves automatically.

### Current system behaviour

- An unresolved issue blocks collection confirmation and ordinary cancellation.
- The owner proposes an outcome and the renter accepts or declines it. Repair
  requires both parties to confirm reinspection.
- Replacement must be an available device from the same owner. The original
  rental price and deposit remain unchanged, the faulty device stays
  unavailable, and a fresh collection QR must be generated and scanned.
- Reports may include up to five photos or videos, each at most 10 MB. Evidence
  requires a manually created private `collection-issue-evidence` Supabase
  bucket; reports without files do not require it.
- The QR scan alone is not acceptance. The renter must still confirm receipt
  and condition before the rental becomes active.

## 4. Device Return (Renter → Owner)

The return uses a **new QR token**. The collection QR must never be reused.

### Scenario flow

| Step | Actor | Action |
|---|---|---|
| 1 | Renter | Opens the active booking and selects **Initiate Return**. |
| 2 | Platform | Creates a unique, temporary Return QR token linked to the booking. |
| 3 | Owner | Opens the booking and selects **Scan Return QR**. |
| 4 | Owner | Scans the QR code displayed on the renter's phone. |
| 5 | Platform | Validates the token, booking reference, expiry and single-use status. |
| 6 | Both | Inspect the returned device and accessories. |
| 7 | Renter | Uploads return-condition photos. |
| 8 | Owner | Confirms that the device has been received. |
| 9 | Renter | Confirms that the device has been handed back. |
| 10 | Platform | Records both confirmations and marks the physical return as verified. |

**Important distinction:** Return verification confirms that the device was handed back. It does not automatically mean that the owner accepts the device as damage-free.

## 5. Damage Discovered During Return Inspection

**Example:** The owner discovers a cracked laptop screen.

### Scenario flow

1. Owner selects **Report Damage** during return inspection.
2. Owner describes the damage and uploads clear photos or videos.
3. Platform records the damage claim and notifies the renter.
4. Renter reviews the claim and can accept or dispute it.
5. Platform stores both parties' responses and evidence.
6. If disputed, the case is sent to an admin for review.
7. Admin compares collection and return evidence and applies the platform's damage policy.
8. Deposit settlement follows the agreed policy and dispute outcome.

### Suggested outcomes

- **Renter accepts responsibility:** Apply the agreed damage and compensation policy.
- **Renter disputes responsibility:** Admin reviews the evidence before deciding.
- **Pre-existing damage or normal wear and tear:** Handle according to the rental agreement; do not automatically charge the renter.
- **Insufficient evidence:** Admin applies the platform's dispute-resolution policy.

Do not automatically transfer the full deposit to the owner just because a damage claim has been submitted.

## 6. QR Verification Rules

| Attribute | Collection QR | Return QR |
|---|---|---|
| Generated by | Owner | Renter |
| Scanned by | Renter | Owner |
| Purpose | Verify device collection | Verify device return |
| Token | Unique collection token | New, unique return token |
| Expiration | Example: 5 minutes | Example: 5 minutes |
| Confirmation | Renter | Both parties (planned) |
| Successful result | Rental becomes `ACTIVE` after the renter confirms inspection and receipt | Physical return is verified; completion and settlement follow the return-condition process |

### Business rules

1. Collection and return must use different QR tokens.
2. Each token must be single-use and expire after a defined period (for example, five minutes).
3. Each token must be linked to the correct booking and event type.
4. Only the booking's authorized owner and renter can complete their respective confirmations.
5. The renter must explicitly confirm collection; both parties' return confirmations are planned.
6. Collection and return photos are planned as separate condition records.
7. Fault reporting and resolution before activation are planned; until then, renters should not confirm a device with an unresolved fault.
8. A return damage claim must be recorded separately from physical return confirmation.
9. Store verification timestamps and an audit history for admin review.
10. Do not rely on QR scanning alone as proof of physical presence or device condition.

## 7. End-to-End Rental Lifecycle

```text
BOOKING_CONFIRMED
        |
        v
OWNER_GENERATES_COLLECTION_QR
        |
        v
RENTER_SCANS_COLLECTION_QR
        |
        v
QR_VALIDATION
        |
        v
DEVICE_INSPECTION
        |
        +---- Fault found? ---- Yes ----> REPORT_FAULT
        |                                  |
        |                                  v
        |                           RESOLVE_OR_CANCEL
        |                                  |
        |                         Resolved and agreed?
        |                                  |
        |                                 Yes
        |                                  |
        v                                  v
RENTER_CONFIRMS_COLLECTION <--------------+
        |
        v
      ACTIVE
        |
        v
RENTER_INITIATES_RETURN
        |
        v
PLATFORM_GENERATES_RETURN_QR
        |
        v
OWNER_SCANS_RETURN_QR
        |
        v
QR_VALIDATION
        |
        v
RETURN_INSPECTION
        |
        +---- Damage found? ---- Yes ----> REPORT_DAMAGE
        |                                  |
        |                                  v
        |                           REVIEW / DISPUTE
        |                                  |
        |                                  v
        |                           ADMIN_RESOLUTION
        |                                  |
        v                                  v
BOTH_PARTIES_CONFIRM_RETURN <--------------+
        |
        v
RETURN_VERIFIED
        |
        v
DEPOSIT_SETTLEMENT
        |
        v
    COMPLETED
```

The diagram is a conceptual workflow. In implementation, a damage claim can remain open after the physical return is verified; the booking and financial settlement should follow the platform's dispute policy.

## 8. Suggested Booking Statuses

| Status | Meaning |
|---|---|
| `CONFIRMED` | Owner accepted the booking. |
| `AWAITING_HANDOVER` | Waiting for in-person collection and verification. |
| `HANDOVER_VERIFIED` | Collection exchange and required confirmations completed. |
| `ACTIVE` | Rental period has started. |
| `FAULT_REPORTED` | A fault was reported during collection or rental. |
| `RETURN_PENDING` | Renter has initiated the return process. |
| `RETURN_VERIFIED` | Physical return was verified by both parties. |
| `DAMAGE_REPORTED` | Damage claim was submitted during return inspection. |
| `DISPUTE_UNDER_REVIEW` | Admin is reviewing a disputed issue. |
| `COMPLETED` | Return and required settlement processes are complete. |
| `CANCELLED` | Booking was cancelled under the platform policy. |

Use separate fault and dispute records rather than relying only on booking status. For example, a device fault can be resolved while the booking remains confirmed, and a damage dispute can remain open after physical return.

## 9. Suggested Database Tables

| Table | Purpose |
|---|---|
| `rental_handover` | Records collection and return events, QR verification and both parties' confirmations. |
| `handover_photos` | Stores condition photos associated with collection or return. |
| `device_fault_reports` | Stores faults reported before or during a rental. |
| `damage_claims` | Stores damage reported during return inspection. |
| `dispute_records` | Stores admin investigation, evidence references and resolution. |

### Example fields for `rental_handover`

| Column | Suggested type | Purpose |
|---|---|---|
| `handover_id` | `BIGSERIAL` | Primary key |
| `booking_id` | `BIGINT` | Related booking |
| `handover_type` | `VARCHAR(20)` | `COLLECTION` or `RETURN` |
| `initiated_by` | `BIGINT` | User who initiated the event |
| `qr_token_hash` | `VARCHAR(255)` | Hash of the one-time QR token |
| `token_expires_at` | `TIMESTAMP` | Token expiration time |
| `token_used_at` | `TIMESTAMP` | Time token was successfully used |
| `owner_confirmed_at` | `TIMESTAMP` | Owner confirmation time |
| `renter_confirmed_at` | `TIMESTAMP` | Renter confirmation time |
| `status` | `VARCHAR(30)` | Event verification status |
| `created_at` | `TIMESTAMP` | Record creation time |

Store a hash of the QR token rather than the raw secret token. Keep photos in file/object storage and store their references and metadata in the database.

## 10. MVP Implementation Priorities

| Feature | Priority |
|---|---|
| Generate collection QR | Must have |
| Scan and validate collection QR | Must have |
| Renter confirms collection | Implemented |
| Upload initial condition photos | Planned |
| Report fault during collection | Planned |
| Generate and scan a separate return QR | Must have |
| Both parties confirm return | Must have |
| Upload return-condition photos | Must have |
| Report damage during return | Must have |
| Admin dispute review | Must have |
| Verification audit history | Must have |

## 11. Final Recommendation

Implement one reusable QR verification component with two event types:

- `COLLECTION`: Owner generates the QR; renter scans it.
- `RETURN`: Renter generates a new QR; owner scans it.

This avoids building two separate QR systems and keeps the implementation simpler.

The current collection flow records the renter's confirmation. Condition photos,
fault/damage reporting and return confirmations remain planned features.
