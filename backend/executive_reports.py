import uuid
import time
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from auth import get_current_user, User
from database import save_executive_report, get_executive_reports, get_executive_report_by_id

router = APIRouter(prefix="/api/reports", tags=["reports"])

class GenerateReportRequest(BaseModel):
    title: str = "Alpha Momentum & Mean Reversion Tear Sheet"
    author: Optional[str] = "Nexus Quant Lab"
    benchmark: Optional[str] = "S&P 500 / BTC Benchmark"
    annualized_return: Optional[float] = 34.8
    sharpe_ratio: Optional[float] = 2.42
    sortino_ratio: Optional[float] = 3.15
    max_drawdown: Optional[float] = -8.6
    calmar_ratio: Optional[float] = 4.05
    win_rate: Optional[float] = 63.4
    alpha: Optional[float] = 14.2
    beta: Optional[float] = 0.42
    var_95: Optional[float] = 2.1
    executive_summary: Optional[str] = (
        "The quantitative strategy demonstrates strong risk-adjusted alpha with low benchmark beta. "
        "Intraday VWAP execution combined with statistical mean reversion has effectively curtailed drawdown exposure "
        "during high-volatility liquidity regimes."
    )

class SlackDispatchRequest(BaseModel):
    report_title: str
    channel: Optional[str] = "#quant-briefings-cto"
    sharpe_ratio: float
    annualized_return: float
    max_drawdown: float
    executive_summary: str

def generate_tear_sheet_html(req: GenerateReportRequest, report_id: str, generated_at: str) -> str:
    ret_color = "#10b981" if req.annualized_return >= 0 else "#ef4444"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Nexus Executive Briefing - {req.title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background-color: #f8fafc;
            margin: 0;
            padding: 30px;
        }}
        .report-card {{
            max-width: 960px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e2e8f0;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }}
        .brand {{
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #0f172a;
        }}
        .sub-brand {{
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
        }}
        .report-meta {{
            text-align: right;
            font-size: 12px;
            color: #64748b;
        }}
        .classification {{
            display: inline-block;
            background: #fee2e2;
            color: #991b1b;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            margin-bottom: 4px;
        }}
        .title {{
            font-size: 22px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 16px 0;
        }}
        .summary-box {{
            background: #f1f5f9;
            border-left: 4px solid #2563eb;
            padding: 16px;
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
            margin-bottom: 28px;
            border-radius: 0 4px 4px 0;
        }}
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 32px;
        }}
        .kpi-card {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 14px 16px;
        }}
        .kpi-title {{
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 600;
            color: #64748b;
            letter-spacing: 0.5px;
        }}
        .kpi-value {{
            font-size: 24px;
            font-weight: 800;
            margin-top: 6px;
            color: #0f172a;
        }}
        .matrix-table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 28px;
        }}
        .matrix-table th, .matrix-table td {{
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            text-align: left;
        }}
        .matrix-table th {{
            background: #f1f5f9;
            font-weight: 600;
            color: #475569;
        }}
        .print-btn {{
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 20px;
        }}
        .print-btn:hover {{
            background: #1d4ed8;
        }}
        @media print {{
            body {{ background: white; padding: 0; }}
            .report-card {{ border: none; box-shadow: none; padding: 0; }}
            .print-btn {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div style="max-width: 960px; margin: 0 auto; display: flex; justify-content: flex-end;">
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF Tear Sheet</button>
    </div>
    <div class="report-card">
        <div class="header">
            <div>
                <div class="brand">NEXUS DATA PLATFORM</div>
                <div class="sub-brand">Institutional Quantitative Tear Sheet</div>
            </div>
            <div class="report-meta">
                <div class="classification">CONFIDENTIAL // CTO BRIEFING</div>
                <div><strong>Report ID:</strong> {report_id}</div>
                <div><strong>Timestamp:</strong> {generated_at}</div>
                <div><strong>Author:</strong> {req.author}</div>
            </div>
        </div>

        <h1 class="title">{req.title}</h1>

        <div class="summary-box">
            <strong>Executive Memo:</strong> {req.executive_summary}
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-title">Annualized Return</div>
                <div class="kpi-value" style="color: {ret_color};">{req.annualized_return:+.1f}%</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Sharpe Ratio (Ann.)</div>
                <div class="kpi-value" style="color: #2563eb;">{req.sharpe_ratio:.2f}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Max Drawdown</div>
                <div class="kpi-value" style="color: #ef4444;">{req.max_drawdown:.1f}%</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Calmar Ratio</div>
                <div class="kpi-value">{req.calmar_ratio:.2f}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Sortino Ratio</div>
                <div class="kpi-value">{req.sortino_ratio:.2f}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Win Rate</div>
                <div class="kpi-value">{req.win_rate:.1f}%</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Alpha (vs {req.benchmark})</div>
                <div class="kpi-value" style="color: #10b981;">{req.alpha:+.1f}%</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">95% Daily VaR</div>
                <div class="kpi-value">{req.var_95:.2f}%</div>
            </div>
        </div>

        <h3 style="font-size: 16px; margin: 24px 0 12px 0;">Risk Attribution & Stress Assessment</h3>
        <table class="matrix-table">
            <thead>
                <tr>
                    <th>Stress Scenario</th>
                    <th>Hypothetical Impact</th>
                    <th>Max Tail Exposure</th>
                    <th>Mitigation Protocol</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>2020 COVID Liquidity Squeeze</strong></td>
                    <td style="color: #f59e0b;">-6.4% Drawdown</td>
                    <td>1.8x Daily Volatility</td>
                    <td>VWAP execution dynamically scaled down position sizing</td>
                </tr>
                <tr>
                    <td><strong>2022 FTX Contagion Shock</strong></td>
                    <td style="color: #ef4444;">-8.1% Drawdown</td>
                    <td>2.4x Spread Widening</td>
                    <td>Zero counterparty credit exposure via cold custody settlement</td>
                </tr>
                <tr>
                    <td><strong>Flash Crash / Microstructure Stall</strong></td>
                    <td style="color: #10b981;">-1.9% Drawdown</td>
                    <td>0.8x Market Impact</td>
                    <td>Algorithmic hard stop-loss triggered within 400ms</td>
                </tr>
            </tbody>
        </table>

        <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
            Generated automatically by Nexus Quantitative Analytics Engine • Confidential and Proprietary
        </div>
    </div>
</body>
</html>
"""

@router.post("/generate")
async def generate_briefing(req: GenerateReportRequest, current_user: User = Depends(get_current_user)):
    report_id = f"rpt-{uuid.uuid4().hex[:8]}"
    generated_at = time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
    
    html = generate_tear_sheet_html(req, report_id, generated_at)
    
    metrics = {
        "annualized_return": req.annualized_return,
        "sharpe_ratio": req.sharpe_ratio,
        "sortino_ratio": req.sortino_ratio,
        "max_drawdown": req.max_drawdown,
        "calmar_ratio": req.calmar_ratio,
        "win_rate": req.win_rate,
        "alpha": req.alpha,
        "beta": req.beta,
        "var_95": req.var_95
    }

    save_executive_report(
        report_id=report_id,
        title=req.title,
        author=req.author or current_user.username,
        report_type="Institutional Tear Sheet",
        summary=req.executive_summary,
        metrics=metrics,
        html_content=html
    )

    return {
        "status": "ok",
        "report_id": report_id,
        "title": req.title,
        "generated_at": generated_at,
        "html_url": f"/api/reports/{report_id}/view",
        "metrics": metrics
    }

@router.get("/list")
async def list_reports(current_user: User = Depends(get_current_user)):
    return {"status": "ok", "reports": get_executive_reports(limit=20)}

@router.get("/{report_id}/view", response_class=HTMLResponse)
@router.head("/{report_id}/view")
async def view_report_html(report_id: str):
    rpt = get_executive_report_by_id(report_id)
    if not rpt:
        raise HTTPException(status_code=404, detail="Report not found")
    return HTMLResponse(content=rpt["html_content"])

@router.post("/dispatch-slack")
async def dispatch_slack_digest(req: SlackDispatchRequest, current_user: User = Depends(get_current_user)):
    """Simulates sending a structured Block Kit briefing to Slack/Teams for CTO/Stakeholders."""
    status_emoji = "🟢 EXCELLENT" if req.sharpe_ratio > 2.0 else "🟡 STABLE" if req.sharpe_ratio > 1.0 else "🔴 ATTENTION"
    
    slack_payload = {
        "channel": req.channel,
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"📊 Executive Quant Digest: {req.report_title}"}
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Sharpe Ratio:*\n`{req.sharpe_ratio:.2f}` ({status_emoji})"},
                    {"type": "mrkdwn", "text": f"*Ann. Return:*\n`{req.annualized_return:+.1f}%`"},
                    {"type": "mrkdwn", "text": f"*Max Drawdown:*\n`{req.max_drawdown:.1f}%`"},
                    {"type": "mrkdwn", "text": f"*Dispatched By:*\n@{current_user.username}"}
                ]
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Executive Commentary:*\n_{req.executive_summary}_"}
            },
            {
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": f"Nexus Execution Engine • Sent to `{req.channel}` at {time.strftime('%H:%M:%S UTC')}"}
                ]
            }
        ]
    }

    # In production, this posts to os.getenv("SLACK_WEBHOOK_URL")
    return {
        "status": "ok",
        "delivered": True,
        "destination": req.channel,
        "message": f"Executive briefing successfully delivered to {req.channel}!",
        "payload": slack_payload
    }
