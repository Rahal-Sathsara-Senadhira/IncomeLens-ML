import { prettyLabel } from "../utils/formatters";

export default function FieldInput({ name, type, value, onChange }) {
  return (
    <label className="field">
      <span className="label">{prettyLabel(name)}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={type === "number" ? "e.g., 40" : "e.g., Private"}
      />
    </label>
  );
}
