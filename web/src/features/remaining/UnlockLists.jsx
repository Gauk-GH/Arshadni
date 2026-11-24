// UnlockLists.jsx: screen 3's two lists with «يفتح لك» (design Unlocks; HANDOFF rules 20–23).
// Available: sorted by how many courses each unlocks directly, «يفتح {n}» pill opens a card.
// Locked: the whole row is a button that opens «الطريق له:», the path from an available course.
// Only one card is open at a time, across both lists.
import { useEffect, useId, useMemo, useState } from 'react';
import { Badge } from '../../components/CourseRow.jsx';
import { ChainSteps, Expand, MiniTicks, UnlockPill } from '../../components/Disclosure.jsx';
import { analyzeUnlocks } from '../../lib/unlocks.js';
import { t } from '../../lib/strings.js';

function ListTitle({ titleKey, n }) {
  return (
    <h2 className="section-heading remaining-list__title">
      {t(titleKey)} <span className="remaining-list__count">{t('common.count', { n })}</span>
    </h2>
  );
}

function Code({ code, muted = false }) {
  return <span className={`course-row__code code${muted ? ' course-row__code--muted' : ''}`} dir="ltr">{code}</span>;
}

export default function UnlockLists({ courses, summary }) {
  const u = useMemo(() => analyzeUnlocks(courses), [courses]);
  const available = useMemo(() => u.sortAvailable(summary.available), [u, summary.available]);
  const [openKey, setOpenKey] = useState(null); // 'a:CS 210' | 'l:CS 410' | null
  const idBase = useId();
  const toggle = (key) => setOpenKey((k) => (k === key ? null : key));

  // After a card opens (200ms), scroll it into view so it isn't hidden behind the sticky footer
  // on short phones (scroll-margin in remaining.css keeps it above the footer).
  useEffect(() => {
    if (!openKey) return undefined;
    const id = setTimeout(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(panelId(openKey))?.closest('.unlock-item')
        ?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }, 220);
    return () => clearTimeout(id);
  }, [openKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const panelId = (key) => `${idBase}-${key.replace(/\W+/g, '-')}`;

  return (
    <>
      {available.length > 0 && (
        <>
          <ListTitle titleKey="remaining.available.title" n={available.length} />
          <p className="caption unlock-sorted">{t('remaining.available.sorted')}</p>
          <ul>
            {available.map((c, i) => {
              const key = `a:${c.code}`;
              const direct = u.direct(c.code);
              const later = u.later(c.code);
              const open = openKey === key;
              const most = i === 0 && direct.length > 0;
              return (
                <li key={c.code} className={`unlock-item${open ? ' is-open' : ''}`}>
                  <div className="course-row unlock-item__row">
                    <Code code={c.code} />
                    <span className="course-row__body">
                      {most && <span className="unlock-most">{t('remaining.unlocks.most')}</span>}
                      <span className="course-row__name"><bdi>{c.name}</bdi></span>
                    </span>
                    {direct.length > 0 && (
                      <UnlockPill count={direct.length} open={open} controls={panelId(key)} onClick={() => toggle(key)} />
                    )}
                  </div>
                  {direct.length > 0 && (
                    <Expand id={panelId(key)} open={open}>
                      <p className="unlock-card__title">{t('remaining.unlocks.title')}</p>
                      <ul>
                        {direct.map((d) => (
                          <li key={d.code} className="unlock-card__row">
                            <Code code={d.code} />
                            <span className="course-row__name"><bdi>{d.name}</bdi></span>
                          </li>
                        ))}
                      </ul>
                      <div className="unlock-card__later">
                        <MiniTicks solid={direct.length} dashed={later.length} />
                        {later.length > 0 && (
                          <p className="caption">{t('remaining.unlocks.later', { n: later.length, codes: later.map((l) => l.code) })}</p>
                        )}
                      </div>
                    </Expand>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {summary.locked.length > 0 && (
        <>
          <div className="remaining-list__gap" />
          <ListTitle titleKey="remaining.locked.title" n={summary.locked.length} />
          <ul>
            {summary.locked.map(({ course, waitingFor }) => {
              const key = `l:${course.code}`;
              const open = openKey === key;
              return (
                <li key={course.code} className={`unlock-item${open ? ' is-open' : ''}`}>
                  <button
                    type="button" className="course-row unlock-item__row unlock-item__toggle"
                    aria-expanded={open} aria-controls={panelId(key)} onClick={() => toggle(key)}
                  >
                    <Code code={course.code} muted />
                    <span className="course-row__body"><span className="course-row__name"><bdi>{course.name}</bdi></span></span>
                    <Badge kind="locked">{t('remaining.badge.locked', { code: waitingFor })}</Badge>
                  </button>
                  <Expand id={panelId(key)} open={open}>
                    <p className="unlock-card__title unlock-card__title--chain">{t('remaining.chain.title')}</p>
                    {open && <ChainSteps courses={u.chainTo(course.code)} />}
                  </Expand>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
