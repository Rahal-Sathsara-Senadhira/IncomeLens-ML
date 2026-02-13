export default function Badge({ ok, children }) {
  return <span className={`badge ${ok ? "ok" : "warn"}`}>{children}</span>;
}
