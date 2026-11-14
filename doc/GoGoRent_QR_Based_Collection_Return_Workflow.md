# GoGoRent: QR-Based In-Person Collection and Return Workflow

## 1. Overview

GoGoRent is a C2C marketplace for renting electronic devices. For in-person exchanges, the platform uses QR-code verification to record device collection and return.

The owner and renter meet in person, scan a booking-specific QR code, inspect the device, and confirm the exchange. The platform stores verification records and condition evidence.

**Core principle:** QR verification confirms participation in the exchange. It does not, by itself, prove the device's physical condition or establish who caused damage.

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
| 7 | Owner | Uploads initial device-condition photos. |
| 8 | Renter | Confirms the device condition and selects **Received Device**. |
| 9 | Owner | Selects **Confirm Handover**. |
| 10 | Platform | Records both confirmations and, if all required checks pass, changes the booking status to `ACTIVE`. |

### Collection confirmation requirements

- QR token is valid, unexpired and unused.
- QR token belongs to the correct booking and collection event.
- Owner and renter are the booking's authorized participants.
- Initial condition photos are uploaded.
- Both parties explicitly confirm the handover.

The rental should not become active until the required checks and both confirmations are complete.

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
   - **Cancel booking:** The booking is cancelled and payment/deposit handling follows the cancellation policy.

### System behaviour

- Keep the booking out of `ACTIVE` while the collection fault is unresolved.
- Record the fault report, evidence, timestamps and agreed resolution.
- Do not treat the QR scan alone as acceptance of the device.
- Activate the rental only after the issue is resolved and both parties complete confirmation.

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
| Confirmation | Both parties | Both parties |
| Successful result | Rental becomes `ACTIVE` after inspection and confirmation | Physical return is verified; completion and settlement follow the return-condition process |

### Business rules

1. Collection and return must use different QR tokens.
2. Each token must be single-use and expire after a defined period (for example, five minutes).
3. Each token must be linked to the correct booking and event type.
4. Only the booking's authorized owner and renter can complete their respective confirmations.
5. Both parties must explicitly confirm the exchange.
6. Store collection and return photos as separate condition records.
7. A collection fault must prevent rental activation until resolved.
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
BOTH_PARTIES_CONFIRM <--------------------+
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
| Both parties confirm collection | Must have |
| Upload initial condition photos | Must have |
| Report fault during collection | Must have |
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

The QR process should be combined with device-condition photos, explicit confirmation from both parties, and separate fault/damage reporting. This gives GoGoRent a practical record of the device's custody journey while allowing owners and renters to manage the physical exchange themselves.
