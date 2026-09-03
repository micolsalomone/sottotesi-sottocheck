---
name: tesicheck-checkout-smoke
description: Run a focused browser smoke test for the guest TesiCheck checkout flow only. Use only when explicitly invoked to verify login, registration, email verification, payment transition, gateway boundary, and authenticated report routing.
disable-model-invocation: true
---

# TesiCheck checkout smoke test

Test ONLY the guest TesiCheck checkout flow.

Do not edit code.
Do not inspect unrelated features.
Do not test Student, Coach, Admin, History, Profile, or other routes.

## Setup

1. Start the existing dev server if it is not already running.
2. Open the application in the browser.
3. Clear only the prototype TesiCheck account/pre-check state required to simulate a new visitor.
4. Do not clear unrelated application data.

## Flow to test

### New user

1. Open `/public`.
2. Upload a valid PDF or DOCX <= 50 MB.
3. Wait for character count and price.
4. Click `Procedi al pagamento`.
5. Verify the checkout shows:
   - login form;
   - `Riepilogo TesiCheck`;
   - same document;
   - same character count;
   - same total.
6. Switch to `Crea account`.
7. Verify registration stays inside the same checkout.
8. Fill the minimum registration fields.
9. Submit.
10. Verify the email-verification step appears.
11. Verify the order summary is still unchanged.
12. Enter a valid demo 6-digit verification code.
13. Confirm email.
14. Verify the checkout moves directly to `Completa il pagamento`.
15. Verify Account and Email are completed states.
16. Click `Vai al pagamento`.
17. Verify the payment-provider redirect/interstitial appears.
18. Test the success outcome.
19. Verify only a brief processing state appears.
20. Verify automatic navigation to `/public-view/report/:checkId`.
21. Verify the report is inside the authenticated Public shell.
22. Reload the report route and verify it still works.

## Returning user

Repeat only the minimum necessary steps to verify:

1. Existing verified account can log in.
2. Login goes directly to payment.
3. No email verification step appears.
4. Order summary remains unchanged.

## Resume

Verify:

1. Start checkout.
2. Return to `/public`.
3. The landing shows `Hai un TesiCheck in corso`.
4. `Riprendi il checkout` restores the correct stage and order summary.

## Responsive check

Check only:
- desktop checkout: summary visible/sticky;
- mobile checkout: summary stacked or collapsible and usable.

Do not perform a broad visual review.

## Failure criteria

Report FAIL if any of these occur:

- login/registration navigates outside checkout;
- document/count/price changes unexpectedly;
- payment becomes available before account + verified email;
- a standalone `Account completato`, `Pagamento completato`, or `Check completato` page appears;
- success does not reach the authenticated report;
- report opens outside the Public authenticated shell;
- console shows a new runtime error during this flow.

## Output

Return only:

- PASS or FAIL
- failed step numbers, if any
- concise observed issue
- relevant console error, if any
- no implementation suggestions unless asked