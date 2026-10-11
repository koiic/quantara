# Quantara Documentation & Specifications Hub

Welcome to the institutional documentation repository for **Quantara Platform**. This directory archives all technical architecture specifications, design systems, QA audits, and operational manuals.

---

## 📚 Document Index

### 1. Architecture & Research
* **[DRL Studio: Competitor Research & Architecture Spec](file:///home/calory/Work/tries/app/dpp/docs/architecture/drl_studio_competitor_research_and_architecture.md)**
  * *Overview:* In-depth competitive analysis covering QuantConnect, FinRL, Ray RLlib, TensorTrade, JupyterLab, and Bloomberg B-PIPE.
  * *Features:* 6-stage quantitative data pipeline architecture (Ingestion -> Lopez de Prado Fractional Differentiation -> Gymnasium Vectorized Env -> Actor-Critic / PPO Training -> Almgren-Chriss Slippage Simulation -> Streamlit CTO Tear Sheet Handoff).

### 2. Design System & Frontend Specifications
* **[Quantara Landing Page Redesign Plan](file:///home/calory/Work/tries/app/dpp/docs/specs/quantara_landing_page_redesign_plan.md)**
  * *Overview:* High-converting visual language inspired by Streamlit.io, Stripe, and Linear.
  * *Features:* Design tokens, color system, typography (`Inter` + `JetBrains Mono`), dark/light contrast rules, and responsive navigation hierarchy.
* **[Quantara Design System Review](file:///home/calory/Work/tries/app/dpp/docs/specs/quantara_design_system_review.md)**
  * *Overview:* Comprehensive component-level styling review covering button states, badge contrasts, and visual hierarchy across all platform modules.

### 3. Production Deployment & Operations
* **[Production Deployment Plan](file:///home/calory/Work/tries/app/dpp/docs/specs/production_deployment_plan.md)**
  * *Overview:* Zero-downtime containerized production deployment topology.
  * *Features:* Docker Compose orchestration, FastAPI backend clustering, NGINX SSL reverse proxy, DuckDB data lake volumes, Yjs CRDT WebSocket collaboration, and Streamlit background runtime.

### 4. QA & UAT Defect Audits
* **[QA & UAT Defect Audit Report](file:///home/calory/Work/tries/app/dpp/docs/reports/qa_uat_defect_report.md)**
  * *Overview:* End-to-end verification report cataloging functional, networking, and UI defects.
  * *Features:* Landing page CTA routing, credentials & auth tokens, WebSocket listener resilience, and browser compatibility testing.
