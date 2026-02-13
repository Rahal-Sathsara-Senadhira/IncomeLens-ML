import { useEffect, useMemo, useState } from "react";
import { getHealth, getSchema, predict, API_BASE } from "./api";
import "./styles.css";

function guessInputType(featureName) {
  // Simple heuristic to decide numeric inputs
  const lower = featureName.toLowerCase();
  const numericHints = [
    "age",
    "hours",
    "capital",
    "fnlwgt",
    "education-num",
    "education_num",
    "num",
    "count",
    "gain",
    "loss",
    "week",
    "per-week",
    "per_week",
  ];
  if (numericHints.some((h) => lower.includes(h))) return "number";
  return "text";
}

function normalizeValue(type, value) {
  if (value === "" || value === null || value === undefined) return null;
  if (type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return value;
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [schema, setSchema] = useState(null);
  const [form, setForm] = useState({});
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // load health + schema
  useEffect(() => {
    (async () => {
      try {
        setError("");
        const h = await getHealth();
        setHealth(h);

        setLoadingSchema(true);
        const s = await getSchema();
        setSchema(s);

        // initialize form fields with empty string
        const initial = {};
        for (const f of s.expected_features) initial[f] = "";
        setForm(initial);
      } catch (e) {
        setError(
          `Failed to connect to backend. Make sure FastAPI is running at ${API_BASE}.`
        );
      } finally {
        setLoadingSchema(false);
      }
    })();
  }, []);

  const fields = useMemo(() => {
    if (!schema?.expected_features) return [];
    return schema.expected_features.map((name) => ({
      name,
      type: guessInputType(name),
    }));
  }, [schema]);

  function onChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function fillExample() {
    // A decent default example; users can edit values
    const sample = { ...form };

    const candidates = {
      age: 37,
      workclass: "Private",
      education: "Bachelors",
      "marital-status": "Married-civ-spouse",
      occupation: "Exec-managerial",
      relationship: "Husband",
      race: "White",
      sex: "Male",
      "hours-per-week": 45,
      "native-country": "United-States",
      fnlwgt: 180000,
      "education-num": 13,
      "capital-gain": 0,
      "capital-loss": 0,
    };

    for (const k of Object.keys(sample)) {
      if (candidates[k] !== undefined) sample[k] = String(candidates[k]);
    }
    setForm(sample);
  }

  function clearForm() {
    if (!schema) return;
    const empty = {};
    for (const f of schema.expected_features) empty[f] = "";
    setForm(empty);
    setResult(null);
    setError("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    try {
      setLoadingPredict(true);

      // Build features object: convert numeric fields, keep text, null for empty
      const featuresObj = {};
      for (const f of fields) {
        featuresObj[f.name] = normalizeValue(f.type, form[f.name]);
      }

      const out = await predict(featuresObj);
      setResult(out);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Prediction failed. Check backend logs.";
      setError(String(msg));
    } finally {
      setLoadingPredict(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>IncomeLens ML</h1>
          <p className="sub">
            Full-stack ML demo — React UI + FastAPI model inference
          </p>
        </div>

        <div className="badgeWrap">
          <span className={`badge ${health?.model_loaded ? "ok" : "warn"}`}>
            API: {health ? "Online" : "Offline"}
          </span>
          <span className={`badge ${health?.model_loaded ? "ok" : "warn"}`}>
            Model: {health?.model_loaded ? "Loaded" : "Not loaded"}
          </span>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <div className="cardHead">
            <h2>Input Features</h2>
            <div className="actions">
              <button type="button" onClick={fillExample} className="btn ghost">
                Fill example
              </button>
              <button type="button" onClick={clearForm} className="btn ghost">
                Clear
              </button>
            </div>
          </div>

          {loadingSchema && <p>Loading schema…</p>}

          {!loadingSchema && schema && (
            <>
              <p className="hint">
                Form fields are auto-generated from <code>/schema</code>. You
                can leave some fields empty.
              </p>

              <form onSubmit={onSubmit} className="form">
                <div className="formGrid">
                  {fields.map((f) => (
                    <label key={f.name} className="field">
                      <span className="label">{f.name}</span>
                      <input
                        type={f.type}
                        value={form[f.name] ?? ""}
                        onChange={(e) => onChange(f.name, e.target.value)}
                        placeholder={f.type === "number" ? "e.g., 40" : "e.g., Private"}
                      />
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn primary"
                  disabled={loadingPredict}
                >
                  {loadingPredict ? "Predicting…" : "Predict"}
                </button>
              </form>
            </>
          )}

          {!schema && !loadingSchema && (
            <p className="error">
              Could not load schema. Make sure backend is running at{" "}
              <code>{API_BASE}</code>.
            </p>
          )}
        </section>

        <section className="card">
          <h2>Prediction Result</h2>

          {error && <div className="errorBox">{error}</div>}

          {!error && !result && (
            <p className="hint">
              Submit the form to get a prediction from the ML API.
            </p>
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
                  <span className="v">
                    {result.probability === null || result.probability === undefined
                      ? "—"
                      : `${(result.probability * 100).toFixed(1)}%`}
                  </span>
                  <span className="meta">
                    threshold: {result.threshold} | positive: {result.positive_label}
                  </span>
                </div>
              </div>

              <div className="resultBlock">
                <span className="k">Model</span>
                <span className="v">{result.model_name ?? result.model ?? "—"}</span>
              </div>

              <div className="resultBlock">
                <span className="k">Top factors</span>
                {result.top_factors?.length ? (
                  <ul className="factors">
                    {result.top_factors.slice(0, 8).map((x, idx) => (
                      <li key={idx}>
                        <code>{x.feature}</code>{" "}
                        {"weight" in x && (
                          <span className="small">weight: {Number(x.weight).toFixed(4)}</span>
                        )}
                        {"importance" in x && (
                          <span className="small">
                            importance: {Number(x.importance).toFixed(4)}
                          </span>
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
      </main>

      <footer className="footer">
        <span>
          Backend: <code>{API_BASE}</code>
        </span>
      </footer>
    </div>
  );
}
