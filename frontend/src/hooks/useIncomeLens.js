import { useEffect, useMemo, useState } from "react";
import { getHealth, getSchema, predict } from "../api/incomeApi";
import { guessInputType } from "../utils/heuristics";
import { normalizeValue } from "../utils/formatters";

const HISTORY_KEY = "incomeLens.history.v1";

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function useIncomeLens() {
  const [health, setHealth] = useState(null);
  const [schema, setSchema] = useState(null);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);

  const [loadingSchema, setLoadingSchema] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState(() => loadHistory());

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

        const initial = {};
        for (const f of s.expected_features) initial[f] = "";
        setForm(initial);
      } catch (e) {
        setError("Failed to connect to backend or load schema.");
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

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function clear() {
    if (!schema) return;
    const empty = {};
    for (const f of schema.expected_features) empty[f] = "";
    setForm(empty);
    setResult(null);
    setError("");
  }

  function fillExample() {
    const sample = { ...form };
    const candidates = {
      age: 37,
      workclass: "Private",
      education: "Bachelors",
      occupation: "Exec-managerial",
      relationship: "Husband",
      race: "White",
      sex: "Male",
      fnlwgt: 180000,
      "education-num": 13,
      "education.num": 13,
      "capital-gain": 0,
      "capital.gain": 0,
      "capital-loss": 0,
      "capital.loss": 0,
      "hours-per-week": 45,
      "hours.per.week": 45,
      "native-country": "United-States",
      "native.country": "United-States",
      "marital-status": "Married-civ-spouse",
      "marital.status": "Married-civ-spouse",
    };

    for (const k of Object.keys(sample)) {
      if (candidates[k] !== undefined) sample[k] = String(candidates[k]);
    }
    setForm(sample);
  }

  async function submit() {
    setError("");
    setResult(null);

    try {
      setLoadingPredict(true);

      const featuresObj = {};
      for (const f of fields) {
        featuresObj[f.name] = normalizeValue(f.type, form[f.name]);
      }

      const out = await predict(featuresObj);
      setResult(out);

      // Save history (local)
      const item = {
        t: Date.now(),
        label: out?.label ?? "—",
        probability: Number(out?.probability ?? 0),
        model: out?.model ?? health?.model ?? "Model",
      };

      const next = [item, ...history].slice(0, 20);
      setHistory(next);
      saveHistory(next);
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

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  const apiOnline = !!health;
  const modelLoaded = !!(health?.model_loaded ?? health?.loaded ?? true);
  const modelName = health?.model_name || health?.model || "—";

  return {
    health,
    schema,
    fields,
    form,
    setField,
    result,
    error,
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
  };
}
