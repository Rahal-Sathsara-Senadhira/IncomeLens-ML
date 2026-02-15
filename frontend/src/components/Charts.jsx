import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function ProbabilityBar({ probability }) {
  const p = clamp01(probability);
  const pct = (p * 100).toFixed(1);

  return (
    <div className="probWrap">
      <div className="probTop">
        <span className="muted">Confidence</span>
        <span className="strong">{pct}%</span>
      </div>

      <div className="probTrack">
        <div className="probFill" style={{ width: `${p * 100}%` }} />
      </div>

      <div className="probAxis">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export function TopFactorsChart({ top_factors }) {
  if (!Array.isArray(top_factors) || top_factors.length === 0) return null;

  const data = top_factors.slice(0, 8).map((x) => ({
    name: x.feature,
    value: Number(x.importance ?? x.weight ?? 0),
  }));

  return (
    <div className="chartBox">
      <div className="chartTitle">Feature influence (Top 8)</div>
      <div className="chartCanvas">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(110,168,254,0.95)" />
                <stop offset="100%" stopColor="rgba(155,123,255,0.95)" />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.10)" strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fill: "rgba(232,240,255,0.70)" }} />
            <YAxis
              type="category"
              dataKey="name"
              width={190}
              tick={{ fill: "rgba(232,240,255,0.70)" }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10,14,22,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "rgba(232,240,255,0.95)",
              }}
            />
            <Bar dataKey="value" fill="url(#barGrad)" radius={[8, 8, 8, 8]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function HistoryLineChart({ history }) {
  if (!Array.isArray(history) || history.length === 0) return null;

  const data = [...history]
    .slice(0, 12)
    .reverse()
    .map((h) => ({
      time: new Date(h.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      p: Number(h.probability ?? 0),
      label: h.label,
    }));

  return (
    <div className="chartBox">
      <div className="chartTitle">Prediction history (last 12)</div>
      <div className="chartCanvas">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: 10, right: 10 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(110,168,254,0.95)" />
                <stop offset="100%" stopColor="rgba(155,123,255,0.95)" />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.10)" strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: "rgba(232,240,255,0.70)" }} />
            <YAxis domain={[0, 1]} tick={{ fill: "rgba(232,240,255,0.70)" }} />
            <Tooltip
              formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`}
              contentStyle={{
                background: "rgba(10,14,22,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "rgba(232,240,255,0.95)",
              }}
            />
            <Line
              type="monotone"
              dataKey="p"
              stroke="url(#lineGrad)"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
