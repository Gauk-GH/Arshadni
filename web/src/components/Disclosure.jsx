// Disclosure.jsx: pieces for «يفتح لك» on screen 3 (DESIGN.md §6: Unlock pill, Expand card,
// Mini ticks, Chain steps).
import { fmtNumber } from '../lib/format.js';
import { t } from '../lib/strings.js';
import { ChevronDownIcon, ChevronUpIcon } from './Icons.jsx';

// «يفتح {n}» pill: a real button. 32px visible pill inside a 48px tap area.
// Open: filled ink, chevron up.
export function UnlockPill({ count, open, controls, onClick }) {
  return (
    <button type="button" className="pill-btn" aria-expanded={open} aria-controls={controls} onClick={onClick}>
      <span className="pill">
        {t('remaining.unlocks', { n: count })}
        {open ? <ChevronUpIcon /> : <ChevronDownIcon size={16} />}
      </span>
    </button>
  );
}

// The area that opens under a row. Height + opacity over 200ms (none with reduced motion).
// While closed it stays in the page (so aria-controls points at something) but is inert and hidden.
export function Expand({ id, open, children }) {
  return (
    <div id={id} className={`expand${open ? ' is-open' : ''}`} inert={!open} aria-hidden={!open}>
      <div className="expand__inner">{children}</div>
    </div>
  );
}

// Mini ticks: solid = unlocked directly, dashed = unlocked later. ~20px each, wraps to the card width.
export function MiniTicks({ solid, dashed }) {
  return (
    <div className="mini-ticks" aria-hidden="true">
      {Array.from({ length: solid }, (_, i) => <i key={`s${i}`} className="mini-ticks__solid" />)}
      {Array.from({ length: dashed }, (_, i) => <i key={`d${i}`} className="mini-ticks__dashed" />)}
    </div>
  );
}

// Step label: 1 «متاح الحين», 2 «الترم اللي بعده», 3+ «أقرب وقت: بعد ترمين / ٣ أترام / ١١ ترم».
function stepLabel(index) {
  if (index === 0) return t('remaining.chain.now');
  if (index === 1) return t('remaining.chain.next');
  // step 3 = after 2 terms («بعد ترمين»), step 4 = after 3 terms («بعد ٣ أترام»)… (plural helper)
  return t('remaining.chain.after', { n: index });
}

// Numbered path: step dots on a rail (circles: the ONE place radius 50% is allowed, DESIGN.md §4).
// Step 1 filled (available now), middle steps outlined, the last (the course itself) dashed.
export function ChainSteps({ courses }) {
  const last = courses.length - 1;
  return (
    <ol className="chain">
      {courses.map((c, i) => {
        const kind = i === 0 ? 'now' : i === last ? 'target' : 'next';
        return (
          <li key={c.code} className={`chain__step chain__step--${kind}`}>
            <span className="chain__rail" aria-hidden="true">
              <span className="chain__dot">{fmtNumber(i + 1)}</span>
              {i < last && <span className="chain__line" />}
            </span>
            <span className="chain__text">
              <span className="chain__course">
                <span className="code chain__code" dir="ltr">{c.code}</span> <bdi>{c.name}</bdi>
              </span>
              <span className="caption">{stepLabel(i)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
