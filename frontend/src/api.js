import axios from "axios";

// Your FastAPI base URL
export const API_BASE = "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

export async function getSchema() {
  const res = await api.get("/schema");
  return res.data;
}

export async function predict(features) {
  const res = await api.post("/predict", { features });
  return res.data;
}

export async function getHealth() {
  const res = await api.get("/health");
  return res.data;
}
