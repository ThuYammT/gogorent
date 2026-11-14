# GoGoRent – Complete Notification Requirements

## 1. Overview

GoGoRent notifications cover the rental lifecycle, from booking requests to device collection, fault reporting, returns, damage disputes, payment and deposit settlement, reviews, and admin operations.

**Recommended approach:** Use in-app notifications as the primary channel. Add email and push notifications for important or time-sensitive events.

## 2. Booking Notifications

| ID | Notification event | Recipient | Message / Purpose |
|---|---|---|---|
| N001 | New booking request | Owner | A renter has requested to rent your device. |
| N002 | Booking accepted | Renter | Your booking has been accepted by the owner. |
| N003 | Booking rejected | Renter | Unfortunately, the owner declined your booking. |
| N004 | Booking cancelled by renter | Owner | The renter has cancelled the booking. |
| N005 | Booking cancelled by owner | Renter | The owner has cancelled your booking. |
| N006 | Booking cancellation confirmed | Both | Your booking has been cancelled successfully. |
| N007 | Booking payment successful | Renter | Your booking payment has been received. |
| N008 | Payment failed | Renter | Your payment could not be processed. Please try again. |
| N009 | Booking reminder | Both | Your device collection is scheduled for tomorrow. |
| N010 | Booking date changed | Both | The booking schedule has been updated. |

## 3. In-Person Collection and QR Notifications

| ID | Notification event | Recipient | Message / Purpose |
|---|---|---|---|
| N011 | Collection QR generated | Renter | The owner has generated a QR code. You can now verify device collection. |
| N012 | QR successfully scanned | Owner | The renter has successfully scanned your collection QR code. |
| N013 | QR verification failed | Scanner | QR verification failed. Please try again. |
| N014 | QR expired | Both | The collection QR code has expired. Generate a new code. |
| N015 | Collection confirmation pending | Owner / Renter | Waiting for the other party to confirm device handover. |
| N016 | Owner confirmed handover | Renter | The owner has confirmed the device handover. |
| N017 | Renter confirmed collection | Owner | The renter has confirmed receipt of the device. |
| N018 | Collection completed | Both | Device collection has been successfully verified. Your rental is now active. |
| N019 | Collection verification timeout | Both | Collection verification was not completed. Please arrange another meeting. |

## 4. Device Fault Notifications

These notifications apply when the renter discovers a problem during collection or while using the device.

| ID | Notification event | Recipient | Message / Purpose |
|---|---|---|---|
| N020 | New fault reported | Owner | The renter has reported a problem with your device. |
| N021 | Fault report received | Renter | Your device fault report has been submitted successfully. |
| N022 | Fault report updated | Renter | The owner has responded to your reported device fault. |
| N023 | Owner agrees to replace device | Renter | The owner has agreed to provide a replacement device. |
| N024 | Replacement device proposed | Renter | The owner has proposed another device. Please review and confirm. |
| N025 | Replacement accepted | Owner | The renter has accepted the replacement device. |
| N026 | Fault resolution agreed | Both | Both parties have agreed on the fault resolution. |
| N027 | Fault unresolved | Admin | A device fault remains unresolved and requires admin attention. |
| N028 | Fault dispute submitted | Admin | The owner and renter disagree about the reported device fault. |
| N029 | Fault dispute resolution | Both | The admin has completed the fault dispute review. |
| N030 | Booking cancelled due to fault | Both | The booking has been cancelled because the device fault could not be resolved. |

## 5. Active Rental Notifications

| ID | Notification event | Recipient | Message / Purpose |
|---|---|---|---|
| N031 | Rental started | Both | Your rental period has officially started. |
| N032 | Rental reminder – 24 hours before expiry | Renter | Your rental period will expire tomorrow. Please prepare the device for return. |
| N033 | Rental reminder – 3 hours before expiry | Renter | Your rental period will expire in three hours. Please arrange the return. |
| N034 | Rental expired | Renter | Your rental period has ended. Please return the device. |
| N035 | Return overdue | Renter | Your device return is overdue. Please contact the owner. |
| N036 | Return overdue notification | Owner | The renter has not yet completed the device return. |
| N037 | Late return fee notification | Renter | A late return fee may apply according to your rental agreement. |

## 6. Device Return and QR Notifications

| ID | Notification event | Recipient | Message / Purpose |
|---|---|---|---|
| N038 | Return initiated | Owner | The renter has initiated the device return process. |
| N039 | Return QR generated | Owner | The renter has generated a Return QR code. You can scan it to verify the return. |
| N040 | Return QR successfully scanned | Renter | The owner has successfully scanned your Return QR code. |
| N041 | Return QR verification failed | Scanner | Return QR verification failed. Please try again. |
| N042 | Return QR expired | Both | The Return QR code has expired. Generate a new code. |
| N043 | Return confirmation pending | Both | Waiting for the other party to confirm the device return. |
| N044 | Owner confirmed device receipt | Renter | The owner has confirmed receipt of the returned device. |
| N045 | Renter confirmed device return | Owner | The renter has confirmed that the device has been returned. |
| N046 | Device return verified | Both | The physical device return has been successfully verified. |
| N047 | Return verification incomplete | Both | Device return verification is incomplete. Please complete the confirmation process. |

## 7. Device Damage and Dispute Notifications

| ID | Notification event | Recipient | Message / Purpose |
|---|---|---|---|
| N048 | Damage reported | Renter | The owner has reported damage to the returned device. |
| N049 | Damage claim submitted | Owner | Your damage claim has been submitted successfully. |
| N050 | Damage claim received | Admin | A new device damage claim requires review. |
| N051 | Damage claim accepted | Owner | The renter has accepted responsibility for the reported damage. |
| N052 | Damage claim disputed | Owner | The renter has disputed your damage claim. |
| N053 | Dispute submitted | Admin | A new rental dispute requires investigation. |
| N054 | Additional evidence requested | Owner / Renter | The admin requires additional evidence to investigate the dispute. |
| N055 | Additional evidence submitted | Admin | A party has submitted additional dispute evidence. |
| N056 | Dispute under review | Both | Your dispute is currently being reviewed by the admin. |
| N057 | Dispute resolved | Both | The admin has completed the dispute investigation. |
| N058 | Damage compensation decision | Both | The damage compensation decision has been finalized. |

## 8. Payment and Deposit Notifications

| ID | Notification event | Recipient | Message / Purpose |
|---|---|---|---|
| N059 | Security deposit received | Renter | Your security deposit has been received. |
| N060 | Security deposit held | Renter | Your security deposit is being held during the rental period. |
| N061 | Deposit refund initiated | Renter | Your security deposit refund has been initiated. |
| N062 | Deposit refund successful | Renter | Your security deposit has been refunded successfully. |
| N063 | Deposit deduction proposed | Renter | A deduction from your security deposit has been proposed. |
| N064 | Deposit deduction finalized | Renter | Your security deposit settlement has been finalized. |
| N065 | Rental payment transferred | Owner | Your rental earnings have been transferred. |
| N066 | Commission deducted | Owner | GoGoRent's marketplace commission has been deducted from your rental earnings. |
| N067 | Payment settlement failed | Owner / Admin | A payment or settlement transaction failed and requires attention. |

## 9. Rental Completion and Review Notifications

| ID | Notification event | Recipient | Message / Purpose |
|---|---|---|---|
| N068 | Rental completed | Both | Your rental transaction has been successfully completed. |
| N069 | Submit owner review | Renter | Please rate your experience with the device owner. |
| N070 | Submit renter review | Owner | Please rate your experience with the renter. |
| N071 | Review received | Reviewer | Your review has been submitted successfully. |
| N072 | New review received | Owner / Renter | You have received a new review. |

## 10. Admin and System Notifications

| ID | Notification event | Recipient | Message / Purpose |
|---|---|---|---|
| N073 | New user registration | Admin | A new user has registered on GoGoRent. |
| N074 | User reported | Admin | A user has submitted a report about another user. |
| N075 | New support request | Admin | A user has submitted a support request. |
| N076 | Unresolved booking issue | Admin | A booking requires administrative attention. |
| N077 | Suspicious QR verification activity | Admin | Unusual QR verification activity has been detected. |
| N078 | Repeated failed QR attempts | Admin | Multiple unsuccessful QR verification attempts have occurred. |
| N079 | Payment processing alert | Admin | A payment processing issue requires attention. |
| N080 | Dispute resolution deadline | Admin | A pending dispute requires review within the expected resolution period. |

## 11. Notification Priority for MVP

Not all notifications need to be implemented in the first release. The following phases provide a practical implementation plan.

### Phase 1 – Essential notifications

Implement these for the initial GoGoRent release:

- [ ] Booking request, acceptance and rejection
- [ ] Booking cancellation
- [ ] Collection QR generated and scanned
- [ ] QR verification failure and expiry
- [ ] Both parties' collection confirmation
- [ ] Collection completed
- [ ] Device fault reported
- [ ] Rental started and expiry reminders
- [ ] Return initiated
- [ ] Return QR generated and scanned
- [ ] Both parties' return confirmation
- [ ] Device damage reported
- [ ] Dispute submitted
- [ ] Rental completed
- [ ] Deposit refund and payment status

### Phase 2 – Marketplace enhancements

- [ ] Replacement device notifications
- [ ] Fault resolution updates
- [ ] Late return notifications
- [ ] Damage compensation updates
- [ ] Review and rating reminders
- [ ] Payment settlement updates
- [ ] Additional evidence requests

### Phase 3 – Admin and security

- [ ] Suspicious QR activity
- [ ] Repeated failed verification attempts
- [ ] Unresolved booking alerts
- [ ] Dispute deadlines
- [ ] Payment processing alerts
- [ ] User reports and support requests

## 12. Recommended Notification Channels

| Notification type | In-app | Email | Push |
|---|:---:|:---:|:---:|
| Booking updates | Yes | Yes | Yes |
| QR verification | Yes | No | Yes |
| Device fault | Yes | Yes | Yes |
| Rental reminders | Yes | Optional | Yes |
| Return reminders | Yes | Optional | Yes |
| Damage disputes | Yes | Yes | Yes |
| Payment and deposit | Yes | Yes | Yes |
| Reviews | Yes | Optional | Yes |
| Admin alerts | Yes | Yes | Optional |

For the MVP, start with in-app notifications. Add email and push notifications as later enhancements.

## 13. Suggested Database Design

Create a centralized `notifications` table rather than separate notification tables for booking, collection, return and disputes.

### `notifications`

| Column | Data type | Description |
|---|---|---|
| `notification_id` | `BIGSERIAL` | Primary key |
| `user_id` | `BIGINT` | Recipient user ID |
| `booking_id` | `BIGINT` | Related booking ID; nullable for general notifications |
| `notification_type` | `VARCHAR(100)` | Notification event code |
| `title` | `VARCHAR(255)` | Notification title |
| `message` | `TEXT` | Notification content |
| `is_read` | `BOOLEAN` | Read status |
| `created_at` | `TIMESTAMP` | Notification creation time |
| `read_at` | `TIMESTAMP` | Time notification was read |

### Example notification record

```json
{
  "user_id": 102,
  "booking_id": 501,
  "notification_type": "COLLECTION_QR_GENERATED",
  "title": "Collection QR Generated",
  "message": "The owner has generated a QR code. You can now verify device collection.",
  "is_read": false
}
```

## 14. Suggested Spring Boot Architecture

Create a centralized `NotificationService`. Booking, QR verification, fault, return and payment services should call it when relevant business events occur.

```text
Booking Service
      |
QR Verification Service
      |
Fault / Return Service
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
      |
      +---- Email Notifications
      |
      +---- Push Notifications
```

### Implementation recommendations

- Store notifications in PostgreSQL.
- Display unread notification counts in the application.
- Use asynchronous processing for email and push notifications.
- Avoid sending duplicate notifications when a user retries an operation.
- Ensure notifications are sent only to the intended recipients.
- Keep notification creation separate from the core business transaction where possible; use reliable event handling or an outbox pattern for important events.

## 15. Final Recommendation

Implement a centralized notification system that supports the complete GoGoRent rental lifecycle.

Prioritize booking, QR collection, fault reporting, rental reminders, QR return, damage disputes and payment notifications for the MVP. Add specialized replacement, review, security and admin notifications as their workflows are implemented.

This approach allows GoGoRent to expand its notification features without creating separate notification systems for each marketplace module.
