import "./styles.css";
import Badge from "./components/Badge";
import FieldInput from "./components/FieldInput";
import ResultPanel from "./components/ResultPanel";
import { useIncomeLens } from "./hooks/useIncomeLens";
import { API_BASE } from "./api/client";

export default function App() {
  const {
    schema,
    fields,
    form,
    setField,
    error,
    result,
    loadingSchema,
    loadingPredict,
    apiOnline,
    modelLoaded,
    modelName,
    fillExample,
    clear,
    submit,
    history,
    clearHistory,
  } = useIncomeLens();

  function onSubmit(e) {
    e.preventDefault();
    submit();
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <h1>IncomeLens ML</h1>
          <p className="sub">Full-stack ML demo — React UI + FastAPI model inference</p>
        </div>

        <div className="badgeWrap">
          <Badge ok={apiOnline}>API: {apiOnline ? "Online" : "Offline"}</Badge>
          <Badge ok={modelLoaded}>Model: {modelLoaded ? "Loaded" : "Not loaded"}</Badge>
        </div>
      </header>

      <main className="dashboard">
        {/* LEFT: FORM */}
        <section className="card formCard">
          <div className="cardHead">
            <h2>Input Features</h2>
            <div className="actions">
              <button type="button" onClick={fillExample} className="btn ghost">
                Fill example
              </button>
              <button type="button" onClick={clear} className="btn ghost">
                Clear
              </button>
            </div>
          </div>

          {loadingSchema && <p className="hint">Loading schema…</p>}

          {!loadingSchema && schema && (
            <>
              <p className="hint">
                Fields are auto-generated from <code>/schema</code>. You can leave some fields empty.
              </p>

              <form onSubmit={onSubmit} className="form">
                <div className="formScroll">
                  <div className="formGrid">
                    {fields.map((f) => (
                      <FieldInput
                        key={f.name}
                        name={f.name}
                        type={f.type}
                        value={form[f.name]}
                        onChange={setField}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn primary" disabled={loadingPredict}>
                  {loadingPredict ? "Predicting…" : "Predict"}
                </button>

                <div className="footerMini">
                  Backend: <code>{API_BASE}</code>
                </div>
              </form>
            </>
          )}

          {!schema && !loadingSchema && (
            <div className="errorBox">
              Could not load schema. Make sure backend is running at <code>{API_BASE}</code>.
            </div>
          )}
        </section>

        {/* RIGHT: RESULTS */}
        <div className="rightStack">
          <ResultPanel
            modelName={modelName}
            error={error}
            result={result}
            history={history}
            onClearHistory={clearHistory}
          />
        </div>
      </main>
    </div>
  );
}
