// Segmented.jsx: segmented control (DESIGN.md §6), used as the path picker.
// A "radiogroup": one option is always selected; arrow keys move between options.
export function Segmented({ label, options, value, onChange }) {
  function onKeyDown(e) {
    const i = options.findIndex((o) => o.value === value);
    // In RTL, the "next" option is to the LEFT, so ArrowLeft moves forward.
    const step = { ArrowLeft: 1, ArrowDown: 1, ArrowRight: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = options[(i + step + options.length) % options.length];
    onChange(next.value);
    e.currentTarget.querySelector(`[data-value="${next.value}"]`)?.focus();
  }
  return (
    <div className="segmented" role="radiogroup" aria-label={label} onKeyDown={onKeyDown}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value} type="button" role="radio" data-value={o.value}
            aria-checked={selected} tabIndex={selected ? 0 : -1}
            className="segmented__item" onClick={() => onChange(o.value)}
          >
            {o.label}
            <span className="segmented__sub">{o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
