# Distributed Payment Gateway System

## Project Overview

This project is a distributed payment gateway system inspired by platforms like Stripe, Razorpay, and Paytm.

The project primarily focuses on:
- payment orchestration
- distributed systems
- transaction management
- retries and fault tolerance
- idempotency
- ledger systems
- event-driven architecture

The system will allow merchants to integrate with the gateway, create payment sessions, redirect customers to hosted checkout pages, process wallet-based payments, and receive asynchronous payment updates.

The focus of the project is backend engineering and distributed systems design rather than frontend development.

---

# Actors

## Merchant

A business/platform integrating with the payment gateway.

Examples:
- Amazon
- Flipkart
- Swiggy
- Netflix

Merchant responsibilities:
- create payment sessions
- redirect customers to gateway checkout
- receive webhook notifications
- query payment status

---

## Customer

The end user making the payment.

Customer responsibilities:
- select payment method
- authorize payment
- complete payment flow

---

## Payment Gateway

The core system responsible for:
- merchant authentication
- payment session creation
- hosted checkout management
- payment orchestration
- ledger management
- retries and fault tolerance
- transaction storage
- webhook delivery

---

## Wallet Provider

External payment provider responsible for actual payment execution.

For MVP, wallet providers will be mocked internally.

Example providers:
- Mobikwik
- Paytm Wallet
- PhonePe

---

# High-Level Payment Flow

1. Customer clicks "Pay Now" on merchant website.
2. Merchant backend creates payment session using gateway API.
3. Gateway authenticates merchant and validates request.
4. Gateway creates payment session and stores payment record.
5. Gateway returns hosted checkout URL.
6. Merchant redirects customer browser to gateway checkout page.
7. Gateway renders payment methods.
8. Customer selects wallet provider.
9. Gateway communicates with wallet provider.
10. Wallet provider returns payment result.
11. Gateway updates ledger and transaction records.
12. Gateway sends webhook event to merchant backend.
13. Customer is redirected back to merchant success/failure page.

---

# Functional Requirements

# Merchant Management

## Merchant Registration

The system should allow merchants to register with the gateway.

During registration:
- merchant_id should be generated
- api_key should be generated
- api_secret should be generated securely

---

## Merchant Authentication

Merchant APIs should require:
- API key
- signed requests

The system should validate:
- merchant authenticity
- request signature
- timestamp validity
- replay attack prevention

---

## Merchant Configuration

Merchant should be able to configure:
- webhook URL
- redirect URL
- settlement preferences

---

# Payment Session Management

## Create Payment Session

Merchant backend should be able to create payment sessions.

### Request Payload

```json
{
  "order_id": "ORD_123",
  "amount": 1500,
  "currency": "INR",
  "customer": {
    "name": "Rahul",
    "email": "rahul@example.com"
  },
  "redirect_url": "https://amazon.com/payment/result"
}
```

---

## Payment Session Creation

Gateway should:
- authenticate merchant
- validate payload
- create payment record
- generate payment_id
- generate session_id
- store initial payment state

---

## Hosted Checkout URL

Gateway should generate a hosted checkout URL.

Example:

```text
https://gateway.com/checkout/session_123
```

Merchant frontend should redirect customer browser to this URL.

---

## Payment Session States

Supported states:
- CREATED
- PENDING
- PROCESSING
- SUCCESS
- FAILED
- REFUNDED
- EXPIRED

---

# Hosted Checkout

## Checkout Rendering

Gateway should render hosted checkout page containing:
- merchant information
- amount
- available payment methods

---

## Supported Payment Methods (MVP)

Initial MVP supports:
- wallet payments only

Supported wallet providers:
- Mobikwik
- Paytm Wallet
- PhonePe

---

## Payment Method Selection

Customer should be able to:
- choose wallet provider
- continue payment flow

---

# Wallet Provider Integration

## Provider Orchestration

Gateway should route payment requests to wallet providers.

For MVP:
- providers will be mocked internally
- real wallet integrations are out of scope

---

## Provider Response Handling

Gateway should process:
- payment success
- payment failure
- timeout responses
- delayed responses

---

## Async Payment Updates

System should support asynchronous payment updates from providers.

---

# Idempotency and Duplicate Prevention

## Idempotency Support

System should support idempotency keys.

Repeated requests with same key should:
- not create duplicate payments
- return existing payment result

---

## Duplicate Payment Prevention

System should prevent:
- duplicate payment creation
- double debit
- duplicate retries

---

## Concurrent Request Handling

System should safely handle:
- concurrent payment requests
- concurrent retry attempts

---

# Ledger and Balance Management

## Double Entry Ledger

Every successful transaction should create:
- one debit entry
- one matching credit entry

---

## Immutable Ledger

Ledger entries should never be updated or deleted after creation.

---

## Balance Tracking

System should maintain balances for:
- customer accounts
- merchant accounts
- system accounts

---

# Refund Management

## Refund Creation

Merchant should be able to:
- create full refund
- create partial refund

---

## Refund Validation

System should validate:
- payment existence
- refundable balance
- duplicate refund requests

---

## Refund Processing

Refund flow should:
- reverse ledger entries
- update balances
- store refund records

---

# Webhooks and Notifications

## Webhook Delivery

Gateway should notify merchants about:
- payment success
- payment failure
- refund completion

---

## Webhook Retry

Failed webhook deliveries should be retried automatically.

---

## Webhook Security

Webhook payloads should be signed securely.

Merchant backend should verify webhook signatures before processing events.

---

# Transaction History

## Payment History

Merchant should be able to fetch:
- payment history
- payment details
- payment status

---

## Refund History

Merchant should be able to fetch:
- refund history
- refund status

---

## Auditability

System should maintain immutable transaction history for auditing purposes.

---

# Reliability and Fault Tolerance

## Retry Handling

System should safely retry:
- failed provider calls
- webhook failures
- temporary infrastructure failures

---

## Failure Recovery

System should recover safely from:
- service crashes
- network failures
- provider downtime
- partial transaction failures

---

## Timeout Handling

System should handle:
- provider timeouts
- delayed payment confirmations
- session expiration
- retry flows

---

# Non-Functional Requirements

## Scalability

System should support horizontal scaling.

The architecture should support high transaction throughput.

---

## Reliability

System should avoid:
- duplicate payments
- inconsistent balances
- lost transactions

---

## Availability

System should remain operational during partial infrastructure failures.

---

## Consistency

Financial transactions and ledger updates should remain strongly consistent.

Ledger updates must remain atomic.

---

## Observability

System should expose:
- logs
- metrics
- tracing information

---

## Security

System should support:
- signed requests
- secure secret storage
- request validation
- replay attack prevention

---

# Assumptions

- Only INR currency is supported initially
- Only wallet-based payments are supported for MVP
- Wallet providers are mocked internally
- Single region deployment for MVP
- Settlement occurs once daily
- Merchants are trusted business entities

---

# Out of Scope

The following features are intentionally excluded from the MVP:

- real banking integration
- UPI integration
- card payments
- fraud detection
- international payments
- multi-region deployment
- subscription billing
- chargebacks
- KYC verification

---