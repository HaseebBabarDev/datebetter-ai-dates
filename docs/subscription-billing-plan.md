# Subscription billing: implementation scope

Short reference for **unified paywall** (web Stripe + iOS IAP), what we implement **now**, and what can ship **later** without blocking mobile IAP.

---

## Product rules (unchanged)

- **Unlimited** — base plan ($15/mo marketing copy; web uses Stripe prices as configured).
- **Add-ons** — Text Simulator and Detachment Plan ($5/mo each); **only after Unlimited** is active.
- **Web** — Stripe Checkout + Customer Portal (no requirement to change Stripe products for this plan).
- **iOS** — In-App Purchase via RevenueCat; **native iOS only** (Android out of scope for this doc).

---

## Implementing now (reduced complexity)

- **Single subscription / billing screen** for all users; same layout and copy.
- **Checkout routing**
  - **Native iOS** with RevenueCat configured → **IAP** (`purchasePackage`, restore).
  - **Otherwise** → **existing Stripe** `create-checkout` flow (unchanged for web).
- **RevenueCat app integration**
  - Configure SDK once at app start.
  - `Purchases.logIn` / `logOut` tied to Supabase `user.id`.
  - Resolve current offering packages (env-based package ids optional; heuristics as fallback).
- **Fixed displayed prices** on paywall — $15 / $5 / $5 (not region-specific Store strings).
- **Database (minimal)**
  - Migration: store **Apple / RevenueCat–driven** entitlement state per `user_id` (e.g. Unlimited active, add-on flags, expiry, `updated_at`).
- **RevenueCat webhooks**
  - Supabase Edge Function: verify webhook, map events → **upsert** that row using `app_user_id` = Supabase user id (must match `logIn`).
- **C‑lite: `check-subscription`**
  - Keep **existing Stripe** logic as-is.
  - **Additionally** read the new DB row: if Stripe does not show an active Unlimited sub but **Apple row says active**, return **subscribed / unlimited** (and add-ons if stored). Same response shape `useSubscription` already expects.

---

## Already in the app (reference)

- `initPurchases()` from app bootstrap; RC auth linking in `AuthContext`.
- `Subscription.tsx`: IAP vs Stripe buttons, restore, add-ons gated on Unlimited from **current** `check-subscription` / Stripe-backed `plan`.

---

## Later (optional; increases scope)

- **Stripe webhooks → same DB row** — unify “source of truth” updates from both Apple and Stripe in one place (no Stripe *product* change required).
- **Full merge / edge cases** — rules when both Stripe and Apple have overlapping subs; “primary” billing source; cancellation semantics.
- **Manage subscription UX** — branch: **Apple** subscription management URL vs **Stripe** Customer Portal from stored `billing_provider` or equivalent.
- **Android IAP** — RevenueCat + Play Billing when in scope.
- **Stricter server enforcement** — RLS / edge APIs reading merged entitlements only (after DB + webhooks are trusted).
- **Ops** — dashboards, reconciliation, alerting on webhook failures.

---

## Explicit non-goals for the “now” slice

- Changing Stripe **products, prices, or Checkout** behavior on web.
- Replacing `check-subscription` entirely — only **extend** it (C‑lite).

---

## Success criteria (now)

- User can **subscribe on iOS** via IAP and see **correct** entitlement after **refetch** on **web and iOS** (via C‑lite + DB).
- User can **subscribe on web** via Stripe; behavior **unchanged** from today.
- **Add-ons** remain blocked until Unlimited is active on either channel.
