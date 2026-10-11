# Quantara Platform — QA & UAT Defect Audit Report

**Date:** October 11, 2026  
**Auditor:** QA Engineering Lead  
**Scope:** Landing Page, Authentication & Session Layer, Staging Blotter, DRL Studio, Network & Process Topology  
**Status:** In Remediation  

---

## 1. Executive Summary

A comprehensive quality assurance and user acceptance testing (UAT) review was performed on Quantara. Testing revealed **7 critical/high severity defects** affecting the landing page, user onboarding, authentication resilience, and network routing.

Most notably:
1. **Network Binding Mismatch (Root Cause of Login Failure):** `config.js` hardcoded `http://localhost:8001` for API requests. When accessed from any non-loopback host (e.g. LAN IP, custom hostname, or remote client), requests failed with `AxiosError: Network Error`, falsely reporting invalid credentials. Additionally, Uvicorn was bound strictly to `127.0.0.1` rather than `0.0.0.0`.
2. **Container Scroll Trap (Broken Landing Page Navigation):** The landing page is embedded within an `overflowY: auto` viewport container in `App.jsx`. Standard anchor tags (`<a href="#playground">`) only scroll the window document, causing all 6 navbar links and hero CTA jumps to silently fail.
3. **Dead Pathway Cards & Ambiguous Auto-Fill:** The Quick Install section contained non-interactive mock cards with directional arrows, and the "1-Click Auto Fill" button in the sign-in modal bypassed the form and triggered immediate submission.

---

## 2. Defect Register

| Bug ID | Severity | Area | Title | Root Cause |
|---|---|---|---|---|
| **BUG-001** | **Critical** | Auth / Network | Default login (`admin`/`admin`) fails with network error on non-localhost clients | `config.js` hardcodes `http://localhost:8001` instead of `window.location.hostname`. Uvicorn bound to `127.0.0.1`. |
| **BUG-002** | **Critical** | Landing Page | Navbar anchor links (`#playground`, `#principles`, etc.) do not scroll | Parent container has `overflowY: auto`; standard browser anchor jumps do not scroll inner containers. |
| **BUG-003** | **High** | Auth UI | "1-Click Auto Fill" submits immediately instead of filling inputs | Button triggers `onQuickDemo('admin', 'admin')` rather than updating controlled form state. |
| **BUG-004** | **Medium** | Landing Page | Quick Install pathway cards ("Deploy with Docker Compose", "Kubernetes") are non-interactive | Plain `<div>` elements without `onClick` handlers or documentation modals. |
| **BUG-005** | **Medium** | Landing Page | Missing responsive hiding for desktop nav links on mobile | `<nav>` element lacked `.landing-nav-links` class name referenced in CSS `@media` rules. |
| **BUG-006** | **Medium** | Landing Page | Missing Bottom Conversion CTA before Footer | Landing page abruptly ends at FAQ accordion without a closing call to action. |
| **BUG-007** | **High** | Process Topology | Uvicorn terminates if launched without robust process supervision | `start_all.sh` launched `uvicorn` in background without proper monitoring, causing silent backend death. |

---

## 3. Detailed Defect Analysis

### BUG-001: Default Login Network Resolution Failure
- **Symptoms:** User sees `"Incorrect username or password. (Try admin / admin or register a new account)"` or `"Quick demo login failed. Please ensure backend is running."` even when credentials are correct.
- **Technical Breakdown:**
  1. In `dpp/frontend/src/config.js`:
     ```javascript
     export const getApiUrl = () => {
       if (typeof window === 'undefined') return 'http://localhost:8001';
       return isLocalDev() ? 'http://localhost:8001' : window.location.origin;
     };
     ```
     `isLocalDev()` returns `true` because port is `5174`. The URL is returned as `http://localhost:8001`.
  2. If the user browses the app from `http://192.168.1.50:5174`, their browser sends the POST request to `http://localhost:8001` (the user's local laptop/device), which fails to connect.
  3. In `start_all.sh`, `uvicorn` was run without `--host 0.0.0.0`, rejecting external network connections.
- **Fix:** Update `getApiUrl` to `http://${window.location.hostname}:8001` and run `uvicorn` with `--host 0.0.0.0 --port 8001`.

---

### BUG-002: In-Page Anchor Navigation Broken
- **Symptoms:** Clicking "Live Playground", "Three Principles", "Microstructure", "Comparison", "Desks", or "Try the live strategy playground! →" produces zero scroll movement.
- **Technical Breakdown:**
  1. `App.jsx` wraps the view in `<div style={{ flex: 1, overflowY: 'auto' }}>`.
  2. The window scroll height is 0; the inner div holds the scrollbar.
  3. Clicking `<a href="#playground">` attempts to scroll the window document to the element's offset, which does nothing.
- **Fix:** Intercept anchor clicks with a smooth scroll handler:
  ```javascript
  const handleScrollTo = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  ```

---

### BUG-003: Auth Form State Synchronization & Auto-Fill
- **Symptoms:** Clicking "1-Click Auto Fill" suddenly submits the form without letting the user inspect credentials. If the user clears the inputs, uncontrolled inputs with `defaultValue="admin"` can fall out of sync with React events.
- **Fix:** Convert login and registration forms to controlled state (`loginUsername`, `loginPassword`), and provide two distinct buttons:
  1. **"Auto-Fill Demo Credentials"** (populates `admin` / `admin` and focuses submit).
  2. **"Instant 1-Click Guest Login"** (logs in directly with demo token).

---

### BUG-004: Quick Install Pathways Lacked Interactivity
- **Symptoms:** Users click "Deploy with Docker Compose" or "Enterprise Desk on Kubernetes" expecting a copyable snippet or modal, but nothing happens.
- **Fix:** Add interactive modals/click actions:
  - "Deploy with Docker Compose" opens a copyable `docker-compose.yml` configuration and CLI run instructions.
  - "Enterprise Desk" links directly to the institutional contact handler.

---

### BUG-005: Nav Links Collision on Mobile
- **Symptoms:** On viewport widths under 960px, navbar links collided with the brand title and CTA buttons.
- **Technical Breakdown:** `index.css` had `.landing-nav-links { display: none !important; }`, but `LandingPageView.jsx` did not attach this class to `<nav>`.
- **Fix:** Add `className="landing-nav-links"` to `<nav>`.

---

### BUG-006: Missing Bottom Conversion Section
- **Symptoms:** After the FAQ section, the page ended abruptly at the copyright footer with no final push to action.
- **Fix:** Add a high-converting bottom CTA banner matching Streamlit.io aesthetics with direct buttons for "Launch Platform Hub" and "1-Click Guest Demo".

---

## 4. Verification & Validation Protocol

Each fix will be validated against the following test cases:
1. **TC-AUTH-01:** Login via `admin` / `admin` succeeds and redirects to workspace.
2. **TC-AUTH-02:** 1-Click Demo Guest login succeeds from header, hero, install matrix, and modal.
3. **TC-NAV-01:** Clicking each of the 5 navbar links smoothly scrolls the viewport to the correct section.
4. **TC-NAV-02:** Hero secondary link smoothly scrolls to the live playground.
5. **TC-RESP-01:** Viewport resize down to 375px (iPhone) hides desktop nav links cleanly without overlap.
6. **TC-NET-01:** Curl test against `http://0.0.0.0:8001/api/auth/token` returns 200 OK with valid JWT.
7. **TC-BUILD-01:** `npm run build` completes with 0 errors.
