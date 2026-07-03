import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface Props {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagsInput({ label, value, onChange, placeholder = "Escribe y presiona Enter" }: Props) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const t = draft.trim().toLowerCase();
    if (t && !value.includes(t)) {
      onChange([...value, t]);
    }
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold text-gray-600">{label}</span>}
      <div className="flex flex-wrap items-center gap-1.5 rounded-input border border-[#E2DEFF] bg-white px-3 py-2 transition-colors focus-within:border-welve-500 focus-within:ring-2 focus-within:ring-welve-500/15">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-welve-50 px-2 py-1 text-xs font-medium text-welve-600"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-welve-400 hover:text-welve-700"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[100px] flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>
      <p className="text-[10px] text-gray-400">Presiona Enter o coma para agregar</p>
    </div>
  );
}
