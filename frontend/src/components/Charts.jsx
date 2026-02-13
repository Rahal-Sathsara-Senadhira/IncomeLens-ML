import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>Confidence</span>
        <span style={{ fontWeight: 700 }}>{pct}%</span>
      </div>

      <div
        style={{
          height: 12,
          borderRadius: 999,
          border: "1px solid var(--line)",
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${p * 100}%`,
            background: "linear-gradient(90deg, var(--primary), var(--primary2))",
          }}
        />
      </div>

      <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 12 }}>
        0% <span style={{ float: "right" }}>100%</span>
      </div>
    </div>
  );
}

export function TopFactorsChart({ top_factors }) {
  if (!Array.isArray(top_factors) || top_factors.length === 0) return null;

  // Normalize to { name, value }
  const data = top_factors.slice(0, 8).map((x) => ({
    name: x.feature,
    value: Number(x.importance ?? x.weight ?? 0),
  }));

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>
        Feature influence (Top 8)
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={170} />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
