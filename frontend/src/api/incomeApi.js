import { api } from "./client";

export async function getHealth() {
  const res = await api.get("/health");
  return res.data;
}

export async function getSchema() {
  const res = await api.get("/schema");
  return res.data;
}

export async function predict(features) {
  const res = await api.post("/predict", { features });
  return res.data;
}
