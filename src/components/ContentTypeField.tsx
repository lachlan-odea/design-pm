import { useMemo, useState } from "react";
import { CONTENT_TYPES } from "../constants";
import { normaliseContentTypes } from "../contentTypes";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

// Multi-select content types. Toggle chips rather than a <select multiple>,
// which is near-unusable with a mouse and gives no indication that
// ctrl-click is required. No cap — a project can carry as many as apply.
//
// The old free-text "Other…" escape hatch is kept: teams coin content types
// faster than CONTENT_TYPES gets updated, and anything already saved that
// isn't in the constant still needs to render and stay removable.
export function ContentTypeField({ value, onChange }: Props) {
  const [addingOther, setAddingOther] = useState(false);
  const [draft, setDraft] = useState("");

  const selected = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [
    value,
  ]);

  // Custom values live alongside the known ones so a project's full set reads
  // as a single row, rather than hiding the bespoke ones somewhere else.
  const customValues = useMemo(
    () =>
      value.filter(
        (v) =>
          !(CONTENT_TYPES as readonly string[]).some(
            (known) => known.toLowerCase() === v.toLowerCase(),
          ),
      ),
    [value],
  );

  function toggle(next: string) {
    const isOn = selected.has(next.toLowerCase());
    onChange(
      isOn
        ? value.filter((v) => v.toLowerCase() !== next.toLowerCase())
        : normaliseContentTypes([...value, next]),
    );
  }

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed) onChange(normaliseContentTypes([...value, trimmed]));
    setDraft("");
    setAddingOther(false);
  }

  return (
    <div className="content-type-field">
      <div className="content-type-chips">
        {CONTENT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`assignee-chip ${selected.has(type.toLowerCase()) ? "active" : ""}`}
            onClick={() => toggle(type)}
          >
            {type}
          </button>
        ))}
        {customValues.map((type) => (
          <button
            key={type}
            type="button"
            className="assignee-chip active custom"
            onClick={() => toggle(type)}
            title={`Remove ${type}`}
          >
            {type}
          </button>
        ))}
        {!addingOther && (
          <button
            type="button"
            className="assignee-chip add-other"
            onClick={() => setAddingOther(true)}
          >
            + Other…
          </button>
        )}
      </div>
      {addingOther && (
        <div className="content-type-other">
          <input
            autoFocus
            placeholder="Type a content type"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDraft();
              }
              if (e.key === "Escape") {
                setDraft("");
                setAddingOther(false);
              }
            }}
            onBlur={commitDraft}
          />
        </div>
      )}
    </div>
  );
}
