// Screen.jsx: the frame every screen uses: back row, header, scrolling body, sticky footer.
import { t } from '../lib/strings.js';
import { BackIcon } from './Icons.jsx';

export function Screen({ children }) {
  return <main className="screen">{children}</main>;
}

// Back button: 48px, chevron pointing right, at the start. label says where it goes.
export function BackButton({ label, onClick }) {
  return (
    <div className="back-row">
      <button type="button" className="back-btn" aria-label={label} onClick={onClick}>
        <BackIcon />
      </button>
    </div>
  );
}

// Step indicator: «الخطوة ١ من ٢» + 4px bar filling from the right.
export function StepIndicator({ step, total }) {
  return (
    <div className="step">
      <span>{t('common.step', { n: step, total })}</span>
      <span className="step__track" aria-hidden="true">
        <span className="step__fill" style={{ inlineSize: `${(step / total) * 100}%` }} />
      </span>
    </div>
  );
}

// Footer: sticky at the bottom, 1px rule on top. Holds the one primary button.
export function Footer({ children }) {
  return <footer className="footer">{children}</footer>;
}
