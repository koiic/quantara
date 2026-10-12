# Quantara Documentation & Specifications Hub

Welcome to the institutional documentation repository for **Quantara Platform**. This directory archives all technical architecture specifications, design systems, QA audits, concept encyclopedias, and pitch guides.

---

## 📚 Document Index

### 1. Concept Guides & Learning
* **[Quantara ELI5 Concept Encyclopedia (Explain Like I'm Five)](file:///home/calory/Work/tries/app/dpp/docs/concepts/ELI5_QUANT_AND_DRL_CONCEPTS_GUIDE.md)**
  * *Target Audience:* Software engineers, junior quants, and newcomers to Deep Reinforcement Learning in finance.
  * *Overview:* Defines every single concept in the platform using simple real-world metaphors (Super Mario, Pokémon cards, roller coasters, puppy training) followed by exact technical formulas, why it exists, and how it works in Quantara.
  * *Topics Covered:* DRL fundamentals (Agents, Environments, Observations, Action Spaces, Rewards, Policy Gradients, Actor-Critic, Shannon Entropy, Moody-Saffell Differential Sharpe), Market Microstructure (L2 Book, Bids/Asks, Spread, Slippage, Almgren-Chriss, OFI, VPIN), Mathematical Engineering (Stationarity vs. Memory, Marcos López de Prado Fractional Differentiation, Cross-Sectional Ranking, Amihud Illiquidity, Garman-Klass Volatility), and Portfolio Risk (Alpha, Beta, Sharpe, Sortino, Drawdown, VaR 95%, Expected Shortfall, Stress Testing).

### 2. Product Explainer & Dual-Track Pitch
* **[Quantara Product Explainer & Dual-Track Pitch Guide](file:///home/calory/Work/tries/app/dpp/docs/pitch/QUANTARA_PRODUCT_EXPLAINER_TECHNICAL_AND_BUSINESS.md)**
  * *Target Audience:* Dual-track guide designed for speaking to both **Technical** (CTOs, Quant Researchers, ML Engineers) and **Non-Technical** (Investors, Fund Managers, Executives, Clients) audiences.
  * *Track A (Non-Technical):* The 1-sentence hook ("Canva meets Bloomberg Terminal for AI"), the $50B quant bottleneck, 3 product pillars, business ROI, and a word-for-word 60-second elevator pitch.
  * *Track B (Technical):* System topology, high-throughput DuckDB + PyArrow ingestion across 3,000+ assets, mathematical rigor, vectorized Gymnasium training, real-time WebSocket L2 ladder, CRDT multiplayer collaboration, full tech stack breakdown, and answers to tough technical objections (lookahead bias, execution latency).

### 3. Architecture & Research
* **[DRL Studio: Competitor Research & Architecture Spec](file:///home/calory/Work/tries/app/dpp/docs/architecture/drl_studio_competitor_research_and_architecture.md)**
  * *Overview:* In-depth competitive analysis covering QuantConnect, FinRL, Ray RLlib, TensorTrade, JupyterLab, and Bloomberg B-PIPE.
  * *Features:* 6-stage quantitative data pipeline architecture (Ingestion -> Lopez de Prado Fractional Differentiation -> Gymnasium Vectorized Env -> Actor-Critic / PPO Training -> Almgren-Chriss Slippage Simulation -> Streamlit CTO Tear Sheet Handoff).

### 4. Design System & Frontend Specifications
* **[Quantara Landing Page Redesign Plan](file:///home/calory/Work/tries/app/dpp/docs/specs/quantara_landing_page_redesign_plan.md)**
  * *Overview:* High-converting visual language inspired by Streamlit.io, Stripe, and Linear.
  * *Features:* Design tokens, color system, typography (`Inter` + `JetBrains Mono`), dark/light contrast rules, and responsive navigation hierarchy.
* **[Quantara Design System Review](file:///home/calory/Work/tries/app/dpp/docs/specs/quantara_design_system_review.md)**
  * *Overview:* Comprehensive component-level styling review covering button states, badge contrasts, and visual hierarchy across all platform modules.

### 5. Production Deployment & Operations
* **[Production Deployment Plan](file:///home/calory/Work/tries/app/dpp/docs/specs/production_deployment_plan.md)**
  * *Overview:* Zero-downtime containerized production deployment topology.
  * *Features:* Docker Compose orchestration, FastAPI backend clustering, NGINX SSL reverse proxy, DuckDB data lake volumes, Yjs CRDT WebSocket collaboration, and Streamlit background runtime.

### 6. QA & UAT Defect Audits
* **[QA & UAT Defect Audit Report](file:///home/calory/Work/tries/app/dpp/docs/reports/qa_uat_defect_report.md)**
  * *Overview:* End-to-end verification report cataloging functional, networking, and UI defects.
  * *Features:* Landing page CTA routing, credentials & auth tokens, WebSocket listener resilience, and browser compatibility testing.
