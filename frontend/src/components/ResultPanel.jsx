import { formatNumber, formatPercent } from "../utils/formatters";

export default function ResultPanel({ modelName, error, result }) {
  return (
    <section className="card">
      <h2>Prediction Result</h2>

      <p className="hint">
        Backend model: <code>{modelName}</code>
      </p>

      {error && <div className="errorBox">{error}</div>}

      {!error && !result && (
        <p className="hint">Submit the form to get a prediction from the ML API.</p>
      )}

      {result && (
        <div className="result">
          <div className="resultTop">
            <div className="resultBlock">
              <span className="k">Predicted</span>
              <span className="v big">{result.label}</span>
            </div>

            <div className="resultBlock">
              <span className="k">Probability</span>
              <span className="v">{formatPercent(result.probability)}</span>
              <span className="meta">
                threshold: {result.threshold} | positive: {result.positive_label}
              </span>
            </div>
          </div>

          <div className="resultBlock">
            <span className="k">Model</span>
            <span className="v">{result.model ?? "—"}</span>
          </div>

          <div className="resultBlock">
            <span className="k">Top factors</span>
            {result.top_factors?.length ? (
              <ul className="factors">
                {result.top_factors.slice(0, 8).map((x, idx) => (
                  <li key={idx}>
                    <code>{x.feature}</code>
                    {"weight" in x && (
                      <span className="small"> weight: {formatNumber(x.weight)}</span>
                    )}
                    {"importance" in x && (
                      <span className="small"> importance: {formatNumber(x.importance)}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">No explanation data available.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
