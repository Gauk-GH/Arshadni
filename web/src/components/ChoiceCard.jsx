// ChoiceCard.jsx: a big tappable choice (DESIGN.md §6 Choice card), used on screen 1's start state.
// variant: 'filled' (ink, the recommended choice) | 'outlined'. The chevron points LEFT: forward in RTL.
import { ChevronForwardIcon } from './Icons.jsx';

export function ChoiceCard({ variant = 'outlined', icon, tag = null, title, sub, onClick, ...rest }) {
  return (
    <button type="button" className={`choice choice--${variant}`} onClick={onClick} {...rest}>
      <span className="choice__icon">{icon}</span>
      <span className="choice__text">
        {tag && <span className="choice__tag">{tag}</span>}
        <span className="choice__title">{title}</span>
        <span className="choice__sub">{sub}</span>
      </span>
      <ChevronForwardIcon />
    </button>
  );
}
