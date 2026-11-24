// Feedback.jsx: term card, alert card, toast, skeleton (DESIGN.md §6).
import { AlertIcon, CheckIcon } from './Icons.jsx';

// Card (term card): header row = title at start, count at end; children below.
export function Card({ title, count, children, className = '', ...rest }) {
  return (
    <section className={`card ${className}`} {...rest}>
      {(title || count) && (
        <header className="card__header">
          <h3 className="card__title">{title}</h3>
          {count && <span className="card__count">{count}</span>}
        </header>
      )}
      {children}
    </section>
  );
}

// Alert card (blocking error): 2px error-ink border, title with 20px icon, 13px body.
export function AlertCard({ title, children, action = null }) {
  return (
    <div className="alert-card" role="alert">
      <p className="alert-card__title"><AlertIcon size={20} /><span>{title}</span></p>
      <div className="alert-card__body">{children}</div>
      {action}
    </div>
  );
}

// Toast (success): ink background, 16px check at start, optional action link («تراجع») at end.
export function Toast({ children, actionLabel, onAction }) {
  return (
    <div className="toast" role="status">
      <CheckIcon size={16} />
      <span className="toast__text">{children}</span>
      {actionLabel && (
        <button type="button" className="toast__action" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}

// Skeleton block: pulses while loading.
export function Skeleton({ inline = '100%', block = 16 }) {
  return <span className="skeleton" style={{ inlineSize: inline, blockSize: block }} aria-hidden="true" />;
}
