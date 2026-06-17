# PR #26 Understanding Checklist

This document tracks your understanding of the security, consent, and reliability fixes in PR #26.

---

## ✅ Problem Understanding

### High-Level Issues
- [ ] **Why did the Horizons messaging need lockdown?**
  - What attack vector was being prevented?
  - What's the difference between `window.parent.postMessage(..., '*')` and targeted origin validation?
  
- [ ] **Why was there a threshold mismatch in email retry?**
  - What happens when `pending` uses 5-minute threshold but `sending` uses 10 minutes?
  - How could this delay email delivery?
  
- [ ] **Why was consent disclosure important?**
  - What legal/privacy requirements drove this?
  - What's the difference between "necessary" and "analytics" cookies?

### Technical Root Causes
- [ ] **Race Condition Prevention**: How does the atomic claiming pattern prevent duplicate email sends?
- [ ] **State Machine Design**: Why do we need separate `pending`, `sending`, `retrying`, and `sent` states?
- [ ] **Origin Validation**: Why check both `Host` and `Origin` headers on the `/api/apply-edit` endpoint?

---

## ✅ Solution Understanding

### Security Fixes
- [ ] **isTrustedParentEvent() function**: 
  - How does it validate postMessage events?
  - What makes an event "trusted"?
  - Where is this used? (Name at least 3 files)

- [ ] **Dev Server Hardening**:
  - Why change from `::` to `127.0.0.1`?
  - What does the CORS regex `/https?:\/\/localhost.*|https?:\/\/127\.0\.0\.1.*|https?:\/\/\[::1\].*/` match?
  - What's the IPv6 edge case mentioned in the review?

### Backend Reliability
- [ ] **Optimistic Concurrency Control (OCC)**:
  - How does `claimEmailNotificationAttempt()` prevent race conditions?
  - What happens if two cron workers try to claim the same lead simultaneously?

- [ ] **Threshold Alignment**:
  - What was changed from 10 minutes to 5 minutes?
  - Why use `args.cutoff` instead of `now - EMAIL_ATTEMPT_STALE_MS` for `sending` leads?
  - How does this improve recovery time?

- [ ] **Transient Error Handling**:
  - Which HTTP status codes are treated as transient? (List them)
  - Which are permanent failures?
  - Why reset `pending` → `sending` → `pending` on transient errors?

### Consent & Privacy
- [ ] **Cookie Consent Flow**:
  - What's in `DEFAULT_COOKIE_CONSENT_PREFERENCES`?
  - Why is `necessary: true` always enforced?
  - How does `Layout.jsx` conditionally load Google Analytics?

- [ ] **Data Policy Changes**:
  - What new section was added?
  - What services are explicitly mentioned? (Name 2)

### Accessibility
- [ ] **Reduced Motion**:
  - How does `useReducedMotion()` work?
  - What changes when `prefers-reduced-motion: reduce` is detected?
  - Name at least 3 components that respect reduced motion

---

## ✅ Edge Cases & Design Decisions

### Email Retry Logic
- [ ] What happens if a lead gets stuck in `sending` for exactly 5 minutes? Will it be retried?
- [ ] Why is `EMAIL_RETRY_BATCH_SIZE` set to 20?
- [ ] What happens if there are 100 stale pending emails? Will they all be processed immediately?

### Security Edge Cases
- [ ] What happens if someone sends a postMessage from an attacker iframe?
- [ ] Can the `/api/apply-edit` endpoint be called from production? Why or why not?
- [ ] Why remove error handlers in production (`isDev` check)?

### Migration Guards
- [ ] Why validate batch size ≤100?
- [ ] Why check for negative timestamps?
- [ ] Why check for far-future timestamps (>1 year)?

---

## ✅ Testing Strategy

### Test Coverage
- [ ] **New Tests Added** (list them):
  1. ?
  2. ?
  3. ?
  4. ?
  5. ?

- [ ] **Why was the stale `sending` test important?**
  - What scenario does it validate?
  - What bug could occur without this test?

### Manual Testing
- [ ] How would you test the cookie consent banner manually?
- [ ] How would you test reduced motion behavior?
- [ ] How would you verify Horizons messaging still works after lockdown?

---

## ✅ Broader Context

### Production Impact
- [ ] What services will this code interact with in production? (List them)
- [ ] What monitoring should be added post-deployment?
- [ ] What happens if Resend API is down?

### Maintenance & Future Work
- [ ] Why was `tools/generate-llms.js` removed?
- [ ] What's the purpose of `EMAIL_ATTEMPT_STALE_MS` constant?
- [ ] Why keep the constant even though it now matches `PENDING_EMAIL_RETRY_THRESHOLD_MS`?

### Dependencies
- [ ] What's the relationship between Convex crons and email sending?
- [ ] How does the cron job trigger `claimStaleEmailNotificationRetries`?
- [ ] What's the difference between `internalAction` and `internalMutation`?

---

## ✅ Code Quality

### Design Patterns
- [ ] **State Machine Pattern**: Draw the state transitions for email notification status
- [ ] **Guard Clauses**: Where are validation guards used? (Name 2 places)
- [ ] **Atomic Operations**: What makes a Convex mutation atomic?

### Code Review Findings
- [ ] **Critical Issues Found**: How many? (Answer: 0)
- [ ] **Important Issues Found**: How many were fixed? (Answer: 2)
- [ ] **What changed in commit 132b5b4?** (List 3 things)

---

## Quiz Questions

Once you've reviewed the checklist, I can quiz you on:

1. **Multiple Choice**: "Which HTTP status codes trigger email retry?"
   - A) 200, 201
   - B) 400, 404
   - C) 429, 500, 502, 503
   - D) 301, 302

2. **Open-Ended**: "Explain how the atomic email claiming pattern prevents race conditions."

3. **Debugging**: "A user reports that stuck emails are taking 10 minutes to retry. What line of code would you check first?"

4. **Code Reading**: I'll show you the `claimStaleEmailNotificationRetries` function and ask you to explain what each section does.

5. **Architecture**: "Why does the cron run every 10 minutes but claim leads after 5 minutes? Is this a bug?"

---

## Next Steps

1. **Read the full review**: `/workspace/docs/reviews/2026-06-17-pr26-code-review.md`
2. **Check off items above** as you understand them
3. **Ask questions** on anything unclear - I can explain at any level:
   - ELI5 (Explain Like I'm 5)
   - ELI14 (Teen level)
   - ELII (Explain Like I'm an Intern)
4. **Take the quiz** when ready
5. **Review the actual code** - I can walk through specific files

**When you're ready, let me know:**
- "I've read the review, explain X to me"
- "Quiz me on email retry logic"
- "ELI5 the OCC pattern"
- "Show me the code for Y"
- "I don't understand Z"

---

**Created**: 2026-06-17  
**For**: PR #26 Code Review  
**Status**: Ready for your review
