import { useMemo, useState } from "react";
import { formatNumber, formatPercent } from "../utils/formatters";
import { HistoryLineChart, ProbabilityBar, TopFactorsChart } from "./Charts";

export default function ResultPanel({ modelName, error, result, history, onClearHistory }) {
  const [tab, setTab] = useState("summary");

  const hasResult = Boolean(result);

  const summary = useMemo(() => {
    if (!hasResult) return { label: "—", p: 0 };
    return {
      label: result.label ?? "—",
      p: Number(result.probability ?? 0),
      threshold: result.threshold,
      positive: result.positive_label,
      model: result.model ?? modelName,
      top: Array.isArray(result.top_factors) ? result.top_factors : [],
    };
  }, [hasResult, result, modelName]);

  return (
    <section className="card">
      <div className="cardHead">
        <h2>Prediction</h2>
      </div>

      <div className="resultHeaderLine">
        <span>Backend model:</span> <code>{modelName}</code>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {!error && !hasResult && (
        <p className="hint">Submit the form to get a prediction from the ML API.</p>
      )}

      {hasResult && (
        <>
          <div className="summaryTop">
            <div className="pill">
              <div className="muted small">Predicted</div>
              <div className="big">{summary.label}</div>
            </div>

            <div className="pill">
              <div className="muted small">Probability</div>
              <div className="big">{formatPercent(summary.p)}</div>
              <div className="muted tiny">
                threshold: {summary.threshold} | positive: {summary.positive}
              </div>
            </div>
          </div>

          <ProbabilityBar probability={summary.p} />
        </>
      )}

      <div className="tabs">
        <button
          className={`tabBtn ${tab === "summary" ? "active" : ""}`}
          onClick={() => setTab("summary")}
        >
          Summary
        </button>
        <button
          className={`tabBtn ${tab === "explain" ? "active" : ""}`}
          onClick={() => setTab("explain")}
        >
          Explain
        </button>
        <button
          className={`tabBtn ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </div>

      <div className="tabPanel">
        {tab === "summary" && (
          <div className="block">
            {hasResult ? (
              <>
                <div className="muted small">Model used</div>
                <div className="strong">{summary.model}</div>
              </>
            ) : (
              <p className="hint">No prediction yet.</p>
            )}
          </div>
        )}

        {tab === "explain" && (
          <>
            <div className="block">
              <div className="muted small">Top factors</div>

              {hasResult && summary.top.length ? (
                <ul className="factors">
                  {summary.top.slice(0, 8).map((x, idx) => (
                    <li key={idx}>
                      <code>{x.feature}</code>
                      <span className="muted">
                        {" "}
                        importance: {formatNumber(x.importance ?? x.weight ?? 0, 4)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">Run a prediction to see explanations.</p>
              )}
            </div>

            {hasResult && <TopFactorsChart top_factors={summary.top} />}
          </>
        )}

        {tab === "history" && (
          <>
            <div className="historyHead">
              <div className="muted">Saved locally (last 20)</div>
              <button
                className="btn ghost"
                onClick={onClearHistory}
                disabled={!history?.length}
                type="button"
              >
                Clear history
              </button>
            </div>

            {history?.length ? (
              <>
                <HistoryLineChart history={history} />

                <div className="historyList">
                  {history.slice(0, 10).map((h, i) => (
                    <div key={i} className="historyRow">
                      <div className="strong">{h.label}</div>
                      <div className="muted">{formatPercent(h.probability)}</div>
                      <div className="muted tiny">{new Date(h.t).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="hint">No history yet. Run a few predictions.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
