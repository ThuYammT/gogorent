# GoGoRent – Phase 1 Essential Notifications

## 1. Purpose

This document defines the essential notifications for the initial GoGoRent MVP release.

Notifications cover the core rental lifecycle:

1. Booking
2. In-person device collection and QR verification
3. Device fault reporting
4. Active rental and return reminders
5. In-person device return and QR verification
6. Damage and dispute reporting
7. Rental completion and payment/deposit updates

**Recommended MVP channel:** In-app notifications. Email or push notifications can be added for important events such as booking decisions, upcoming returns, disputes and payment updates.

---

## 2. Booking Notifications

| ID | Notification event | Recipient | Notification message |
|---|---|---|---|
| P1-001 | New booking request | Owner | A renter has requested to rent your device. Please review the booking request. |
| P1-002 | Booking accepted | Renter | Your booking has been accepted by the owner. Please review the collection details. |
| P1-003 | Booking rejected | Renter | Unfortunately, the owner has declined your booking request. |
| P1-004 | Booking cancelled | Other party | The booking has been cancelled. Please review the booking details. |

**Trigger notes:**
- P1-001 is sent when a renter submits a booking request.
- P1-002 or P1-003 is sent when the owner accepts or rejects the request.
- P1-004 is sent to the other party when either party successfully cancels a booking. If cancellation affects both parties, send the notification to both.

## 3. In-Person Collection and QR Verification Notifications

For collection, the owner generates the QR code and the renter scans it. Both parties then inspect the device and confirm the handover.

| ID | Notification event | Recipient | Notification message |
|---|---|---|---|
| P1-005 | Collection QR generated | Renter | The owner has generated a Collection QR code. Please scan it to verify device collection. |
| P1-006 | Collection QR scanned successfully | Owner | The renter has successfully scanned your Collection QR code. Please complete the handover confirmation. |
| P1-007 | QR verification failed | User who scanned | QR verification failed. Please check the code and try again. |
| P1-008 | Collection QR expired | Owner | Your Collection QR code has expired. Please generate a new code. |
| P1-009 | Collection confirmation pending | Party whose confirmation is pending | Device collection is awaiting your confirmation. Please review the device and confirm the handover. |
| P1-010 | Owner confirmed handover | Renter | The owner has confirmed the device handover. Please confirm that you have received the device. |
| P1-011 | Renter confirmed collection | Owner | The renter has confirmed receipt of the device. Please complete your handover confirmation. |
| P1-012 | Collection completed | Both | Device collection has been successfully verified. Your rental is now active. |

**Trigger notes:**
- P1-007 should be sent to the scanning user after an invalid, mismatched or already-used QR code. Avoid sending a notification for every transient camera or network error.
- P1-008 is sent to the owner who generated the expired QR code. The renter can see the expired state in the booking screen.
- P1-009 is a reminder or status notification only when a confirmation remains pending; avoid repeatedly notifying users.
- P1-012 is sent only after QR validation, required inspection evidence and both parties' confirmations are complete. The rental should not become active from a QR scan alone.

## 4. Device Fault Notifications

These notifications apply when a renter discovers a fault during collection or while using the device.

| ID | Notification event | Recipient | Notification message |
|---|---|---|---|
| P1-013 | New device fault reported | Owner | The renter has reported a problem with your device. Please review the fault report. |
| P1-014 | Fault report submitted | Renter | Your device fault report has been submitted successfully. You will be notified when the owner responds. |

**Trigger notes:**
- P1-013 is sent when the renter submits a fault report.
- P1-014 confirms that the platform has saved the report.
- A fault found during collection must prevent the rental from becoming active until the issue is resolved and both parties confirm the handover.
- Fault resolution, replacement and fault-dispute notifications can be added in a later phase unless those workflows are included in the MVP.

## 5. Active Rental and Return Reminder Notifications

| ID | Notification event | Recipient | Notification message |
|---|---|---|---|
| P1-015 | Rental started | Both | Your rental period has officially started. Please check your booking for the return deadline. |
| P1-016 | Rental expiry reminder – 24 hours | Renter | Your rental period will expire in 24 hours. Please arrange the device return with the owner. |
| P1-017 | Rental expired / return due | Renter | Your rental period has ended. Please return the device to the owner as soon as possible. |

**Trigger notes:**
- P1-015 is sent when the collection workflow successfully activates the rental.
- P1-016 is scheduled for 24 hours before the agreed rental end time.
- P1-017 is sent when the rental end time is reached and the return has not yet been verified.
- Any late fee must follow the rental agreement and platform policy; do not imply an automatic fee unless it is actually configured.

## 6. In-Person Return and QR Verification Notifications

For return, the renter generates a new Return QR code and the owner scans it. The parties inspect the device and confirm the physical return.

| ID | Notification event | Recipient | Notification message |
|---|---|---|---|
| P1-018 | Return initiated | Owner | The renter has initiated the device return process. Please arrange the return inspection. |
| P1-019 | Return QR generated | Owner | The renter has generated a Return QR code. Please scan it to verify the device return. |
| P1-020 | Return QR scanned successfully | Renter | The owner has successfully scanned your Return QR code. Please complete the return confirmation. |
| P1-021 | Return QR verification failed | User who scanned | Return QR verification failed. Please check the code and try again. |
| P1-022 | Return QR expired | Renter | Your Return QR code has expired. Please generate a new code. |
| P1-023 | Return confirmation pending | Party whose confirmation is pending | Device return is awaiting your confirmation. Please complete the return inspection and confirmation. |
| P1-024 | Owner confirmed device receipt | Renter | The owner has confirmed receipt of the returned device. |
| P1-025 | Renter confirmed device return | Owner | The renter has confirmed that the device has been handed back. |
| P1-026 | Device return verified | Both | The physical device return has been successfully verified. |

**Trigger notes:**
- Return verification must use a new, single-use QR token linked to the same booking and the `RETURN` event type.
- P1-021 is sent to the scanning user after an invalid, mismatched or already-used QR code.
- P1-022 is sent to the renter who generated the expired Return QR code.
- P1-026 confirms physical return only. It does not mean that the device has been accepted as damage-free or that a damage claim has been resolved.

## 7. Damage and Dispute Notifications

| ID | Notification event | Recipient | Notification message |
|---|---|---|---|
| P1-027 | Damage reported | Renter | The owner has reported damage to the returned device. Please review the damage report and respond. |
| P1-028 | Damage claim submitted | Owner | Your damage report has been submitted successfully. |
| P1-029 | Dispute submitted | Admin | A rental dispute has been submitted and requires review. |

**Trigger notes:**
- P1-027 is sent when the owner submits a damage claim during return inspection.
- P1-028 confirms that the damage claim has been saved.
- P1-029 is sent when a party formally disputes a damage claim or another rental issue.
- Physical return verification and damage-claim handling should be tracked separately. A damage claim must not prevent the platform from recording that the device was physically returned.
- Admin resolution and additional-evidence notifications can be added in a later phase if they are not part of the initial MVP.

## 8. Rental Completion and Payment/Deposit Notifications

| ID | Notification event | Recipient | Notification message |
|---|---|---|---|
| P1-030 | Rental completed | Both | Your rental transaction has been completed. Thank you for using GoGoRent. |
| P1-031 | Deposit refund initiated | Renter | Your security deposit refund has been initiated. |
| P1-032 | Deposit refund successful | Renter | Your security deposit has been refunded successfully. |
| P1-033 | Payment or settlement status updated | Relevant user | Your rental payment or settlement status has been updated. Please review the transaction details. |
| P1-034 | Payment or settlement failed | Relevant user / Admin | A payment or settlement could not be completed. Please review the transaction status or contact support. |

**Trigger notes:**
- P1-030 is sent when the return and required completion conditions are satisfied.
- P1-031 and P1-032 are separate events: initiating a refund does not mean the refund has reached the renter.
- P1-033 should use a specific message for the affected transaction, such as payment received, owner payout initiated or owner payout completed.
- P1-034 should be sent only when a payment provider or settlement process reports a failure. Do not tell users that a transaction failed merely because its status is still pending.
- If a damage dispute affects the deposit, settlement should follow the platform's dispute policy.

---

## 9. Phase 1 Notification Summary

| Workflow | Notification IDs | Count |
|---|---|---:|
| Booking | P1-001 – P1-004 | 4 |
| Collection and QR verification | P1-005 – P1-012 | 8 |
| Device faults | P1-013 – P1-014 | 2 |
| Active rental and reminders | P1-015 – P1-017 | 3 |
| Return and QR verification | P1-018 – P1-026 | 9 |
| Damage and disputes | P1-027 – P1-029 | 3 |
| Completion and payment/deposit | P1-030 – P1-034 | 5 |
| **Total** | **P1-001 – P1-034** | **34** |

## 10. Recommended Notification Channels

| Notification category | In-app | Email | Push |
|---|:---:|:---:|:---:|
| Booking updates | Yes | Optional | Recommended |
| Collection QR events | Yes | No | Recommended |
| Device fault reports | Yes | Optional | Recommended |
| Rental reminders | Yes | Optional | Recommended |
| Return QR events | Yes | No | Recommended |
| Damage and disputes | Yes | Recommended | Recommended |
| Rental completion | Yes | Optional | Optional |
| Payment and deposit updates | Yes | Recommended | Recommended |

For the MVP, implement in-app notifications first. Email and push notifications can be introduced incrementally.

## 11. Implementation Notes

### Centralized notification service

Use one notification service for all GoGoRent modules:

```text
Booking Service
      |
QR Verification Service
      |
Fault / Return Service
      |
Dispute Service
      |
Payment Service
      |
      v
Notification Service
      |
      v
Notifications Database
      |
      +---- In-app Notifications
      +---- Email Notifications (later)
      +---- Push Notifications (later)
```

### Suggested notification data fields

| Field | Suggested type | Description |
|---|---|---|
| `notification_id` | `BIGSERIAL` | Primary key |
| `user_id` | `BIGINT` | Recipient user ID |
| `booking_id` | `BIGINT` | Related booking ID; nullable for general notifications |
| `notification_type` | `VARCHAR(100)` | Event code, e.g. `COLLECTION_QR_GENERATED` |
| `title` | `VARCHAR(255)` | Notification title |
| `message` | `TEXT` | Notification content |
| `is_read` | `BOOLEAN` | Whether the recipient has read it |
| `created_at` | `TIMESTAMP` | Creation time |
| `read_at` | `TIMESTAMP` | Read time; nullable |

### General implementation rules

1. Send notifications only after the corresponding business event has been successfully recorded.
2. Send each notification to the correct recipient or recipients.
3. Avoid duplicate notifications when users retry an operation.
4. Do not expose QR tokens or other secret verification data in notification messages.
5. Store notification creation time and read status.
6. Make notifications link to the relevant booking, fault report, dispute or transaction screen.
7. Use asynchronous delivery for email and push channels.
8. Keep notification history available to users and relevant admins.
9. Do not send a success notification before the underlying operation succeeds.
10. Use configurable reminder timing so that rental reminder schedules can be adjusted.

## 12. MVP Acceptance Checklist

- [ ] Owner receives a notification when a renter submits a booking request.
- [ ] Renter receives the booking decision.
- [ ] Both parties receive the appropriate cancellation notification.
- [ ] Renter is notified when the owner generates a Collection QR code.
- [ ] Owner is notified when the renter scans the Collection QR code successfully.
- [ ] Invalid or expired QR attempts show an appropriate notification.
- [ ] Both parties are notified when collection confirmation is pending or completed.
- [ ] Owner receives a notification when the renter reports a device fault.
- [ ] Renter receives confirmation that the fault report was submitted.
- [ ] Both parties receive the rental-start notification.
- [ ] Renter receives the configured return reminder and return-due notification.
- [ ] Owner is notified when the renter initiates return and generates a Return QR code.
- [ ] Renter is notified when the owner scans the Return QR code successfully.
- [ ] Both parties receive the appropriate return confirmation.
- [ ] Renter is notified when the owner reports damage.
- [ ] Admin receives a notification when a dispute is submitted.
- [ ] Both parties receive the rental-completed notification when completion conditions are met.
- [ ] Renter receives separate deposit-refund initiated and successful notifications.
- [ ] Relevant users or admins are notified when payment or settlement status changes or fails.

---

## 13. Final Recommendation

Implement these **34 essential notification events** for the GoGoRent MVP, beginning with in-app notifications.

The notification service should be centralized and reusable across booking, QR verification, fault reporting, return, disputes and payment modules. This will make it easier to add email, push notifications and more advanced alerts in future releases.
