// TickBar.jsx: the signature (DESIGN.md §6). One tick per course, filled = completed.
// It fills from the RIGHT: in an RTL flex row the first child sits at the right,
// so we simply render the filled ticks first.
//
// size: 'large' (28px, gap 3) | 'small' (12px, gap 2). dense: gap 1px for very long plans.
// groups: plan version, e.g. [5, 5, 4]: remaining ticks as outlines, grouped per term.
export function TickBar({ total, filled, size = 'large', dense = false, groups = null, label, animate = false }) {
  const cls = ['tick-bar', `tick-bar--${size}`, dense && 'tick-bar--dense', animate && 'tick-bar--animate']
    .filter(Boolean).join(' ');

  if (groups) {
    let index = 0; // running index for the drop-in stagger
    return (
      <div className={cls} role="img" aria-label={label}>
        <span className="tick-bar__group" style={{ '--n': filled }}>
          {Array.from({ length: filled }, (_, i) => <span key={i} className="tick tick--filled" />)}
        </span>
        {groups.map((count, g) => (
          <span key={g} className="tick-bar__group" style={{ '--n': count }}>
            {Array.from({ length: count }, (_, i) => (
              <span key={i} className="tick tick--outline" style={{ '--i': index++ }} />
            ))}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={cls} role="img" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`tick ${i < filled ? 'tick--filled' : 'tick--empty'}`} style={{ '--i': i }} />
      ))}
    </div>
  );
}
