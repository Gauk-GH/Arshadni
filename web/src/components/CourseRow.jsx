// CourseRow.jsx: list item (DESIGN.md §6), checkbox, badge, chip.
// Row order from the start (right): [checkbox] → code (72px) → name → trailing badge or delete button.
import { CheckIcon } from './Icons.jsx';

// highlight: 'new' (fades from wash-new over 1.2s) | 'target' (duplicate target) | null
// mutedCode: grey code (locked rows on the Remaining screen).
export function CourseRow({ code, name, sub = null, leading = null, trailing = null, highlight = null, mutedCode = false, className = '', as: Tag = 'li', ...rest }) {
  const cls = ['course-row', highlight && `course-row--${highlight}`, className].filter(Boolean).join(' ');
  return (
    <Tag className={cls} {...rest}>
      {leading}
      <span className={`course-row__code code${mutedCode ? ' course-row__code--muted' : ''}`} dir="ltr">{code}</span>
      <span className="course-row__body">
        <span className="course-row__name"><bdi>{name}</bdi></span>
        {sub && <span className="course-row__sub">{sub}</span>}
      </span>
      {trailing}
    </Tag>
  );
}

// Checkbox: 24px, ink when checked. The whole row is the <label>, so it's a 56px tap target.
export function CheckRow({ code, name, checked, onChange, highlight = null }) {
  return (
    <li>
      <CourseRow
        as="label"
        code={code}
        name={name}
        highlight={highlight}
        className="course-row--tappable"
        leading={
          <span className="checkbox">
            <input type="checkbox" checked={checked} onChange={onChange} />
            <span className="checkbox__mark"><CheckIcon size={16} stroke={3} /></span>
          </span>
        }
      />
    </li>
  );
}

// Badge: kind 'available' (متاح) | 'locked' (بعد CS 210, dashed) | 'conflict' (متعارض).
export function Badge({ kind, children }) {
  return <span className={`badge badge--${kind}`}>{children}</span>;
}

// Chip: a course code inside a term card.
export function Chip({ children }) {
  return <span className="chip code" dir="ltr">{children}</span>;
}
