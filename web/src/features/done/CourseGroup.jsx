// CourseGroup.jsx: one prefix group on screen 2 (design DoneGroups, DESIGN.md §6 Group header).
// Header: [prefix] [«n من m» + 4px bar] [«علّم الكل» / «شيل الكل»] [chevron].
// The toggle and «علّم الكل» are two sibling buttons (a button can't sit inside another button).
// CSS "subgrid" lets the toggle cover the whole row while «علّم الكل» sits in its own column on top.
import { CheckRow } from '../../components/CourseRow.jsx';
import { Expand } from '../../components/Disclosure.jsx';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '../../components/Icons.jsx';
import { groupTickAction } from '../../lib/courses.js';
import { t } from '../../lib/strings.js';

// group: from groupCourses(). rows: the courses to show (all, or only the search hits).
export function CourseGroup({ group, rows, open, searching, onToggle, onTickAll, onToggleCourse }) {
  const label = group.isOthers ? t('done.group.others') : group.prefix;
  const done = rows.filter((c) => c.completed).length;
  const total = rows.length;
  const full = !searching && done === total;
  const action = groupTickAction(group);
  const regionId = `group-${group.key}`;

  let caption;
  if (searching) caption = t('done.group.results', { n: total, prefix: label });
  else if (full) caption = t('done.group.full', { n: total });
  else caption = t('done.group.count', { done, total });

  return (
    <section className="group">
      <div className={`group__head${searching ? ' group__head--no-all' : ''}`}>
        <button type="button" className="group__toggle" aria-expanded={open} aria-controls={regionId} onClick={onToggle}>
          {group.isOthers
            ? <span className="group__prefix">{label}</span>
            : <span className="group__prefix code" dir="ltr">{label}</span>}
          <span className="group__meta">
            <span className={`caption${full ? ' group__caption--full' : ''}`}>
              {full && <CheckIcon size={16} />}
              {caption}
            </span>
            <span className="group__bar" aria-hidden="true">
              <span className="group__fill" style={{ inlineSize: `${total ? (done / total) * 100 : 0}%` }} />
            </span>
          </span>
          <span className="group__chev" aria-hidden="true">
            {open ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
          </span>
        </button>
        {!searching && (
          <button
            type="button"
            className="pill-btn group__all"
            aria-label={t(action === 'mark' ? 'done.group.markAll.label' : 'done.group.unmarkAll.label', { prefix: label })}
            onClick={onTickAll}
          >
            <span className="pill">{t(action === 'mark' ? 'done.group.markAll' : 'done.group.unmarkAll')}</span>
          </button>
        )}
      </div>
      <Expand id={regionId} open={open}>
        <ul className="group__rows">
          {rows.map((c) => (
            <CheckRow key={c.code} code={c.code} name={c.name} checked={c.completed} onChange={() => onToggleCourse(c.code)} />
          ))}
        </ul>
      </Expand>
    </section>
  );
}
