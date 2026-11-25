// Screen 2: علّم المقررات اللي خلصتها (HANDOFF §2, design HiDone + StatesDone).
// States: default (tick bar + count) · empty · loading · search not found · all ticked · full (> 60, dense bar).
// Above 20 courses the list is grouped by code prefix (design DoneGroups, HANDOFF rules 26–31).
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/StoreProvider.jsx';
import { navigate } from '../../App.jsx';
import { PrimaryButton, SecondaryButton } from '../../components/Button.jsx';
import { SearchField } from '../../components/Field.jsx';
import { CheckRow } from '../../components/CourseRow.jsx';
import { Skeleton, Toast } from '../../components/Feedback.jsx';
import { TickBar } from '../../components/TickBar.jsx';
import { Screen, StepRow, Footer } from '../../components/Screen.jsx';
import { CheckIcon, PlusIcon } from '../../components/Icons.jsx';
import { groupCourses, groupTickAction, looksLikeCode, normalizeCode, searchCourses } from '../../lib/courses.js';
import { t } from '../../lib/strings.js';
import { CourseGroup } from './CourseGroup.jsx';
import './done.css';

const SEARCH_THRESHOLD = 20; // decision 7; also the grouping threshold (rule 26)
const DENSE_THRESHOLD = 60;  // above this many ticks, the bar uses 1px gaps (HANDOFF §4: 72 courses)
const TOAST_MS = 5000;

export default function DoneScreen() {
  const { status, courses, toggleCompleted, setTicks, setDraft } = useStore();
  const [query, setQuery] = useState('');
  // Open groups (rule 29: all start closed; screen memory only). While searching, groups with hits
  // are open unless closed by hand (searchClosed); openKeys is left alone, so clearing the search
  // puts every group back the way it was (rule 31).
  const [openKeys, setOpenKeys] = useState(() => new Set());
  const [searchClosed, setSearchClosed] = useState(() => new Set());
  const [toast, setToast] = useState(null); // { text, undo }
  // True right after «علّم الكل», so the course change it causes doesn't close its own toast.
  const ownChange = useRef(false);
  const loading = status === 'loading';

  const total = courses.length;
  const completed = courses.filter((c) => c.completed).length;
  const remaining = total - completed;
  const isEmpty = !loading && total === 0;
  const allDone = !loading && total > 0 && remaining === 0;
  const dense = total > DENSE_THRESHOLD;
  // Design: no search once everything is ticked (StatesDone ٤).
  const showSearch = !allDone && (loading || total > SEARCH_THRESHOLD);
  // A query only counts while its field is on screen (it hides once everything is ticked).
  const activeQuery = showSearch ? query : '';
  const visible = searchCourses(courses, activeQuery);
  const q = activeQuery.trim();
  const searching = q !== '';
  const notFound = searching && visible.length === 0;
  const shownQuery = looksLikeCode(q) ? normalizeCode(q) : q;

  // Rule 26: groups above 20 courses, unless the only group would be «مقررات ثانية».
  const groups = groupCourses(courses);
  const grouped = !loading && total > SEARCH_THRESHOLD && groups.some((g) => !g.isOthers);
  const shownGroups = groups
    .map((g) => ({ group: g, rows: searching ? searchCourses(g.courses, q) : g.courses }))
    .filter((x) => x.rows.length > 0);

  // Rule 30: the toast closes after 5s, and as soon as any other tick changes.
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (ownChange.current) { ownChange.current = false; return; }
    setToast(null);
  }, [courses]);

  function changeQuery(value) {
    if (value.trim() === '') setSearchClosed(new Set());
    setQuery(value);
  }

  function isOpen(key) {
    return searching ? !searchClosed.has(key) : openKeys.has(key);
  }

  function toggleGroup(key) {
    const flip = (set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    };
    if (searching) setSearchClosed(flip);
    else setOpenKeys(flip);
  }

  // «علّم الكل» / «شيل الكل» with «تراجع» (rule 30).
  function tickAll(group) {
    const target = groupTickAction(group) === 'mark';
    const before = group.courses.map((c) => ({ code: c.code, completed: c.completed }));
    const changed = group.courses.filter((c) => c.completed !== target).length;
    const prefix = group.isOthers ? t('done.group.others') : group.prefix;
    ownChange.current = true;
    setTicks(group.courses.map((c) => ({ code: c.code, completed: target })));
    setToast({
      text: t(target ? 'done.group.marked' : 'done.group.unmarked', { n: changed, prefix }),
      undo: () => setTicks(before),
    });
  }

  function addMissing() {
    setDraft(looksLikeCode(q) ? { code: shownQuery } : { name: q });
    navigate('/input');
  }

  return (
    <Screen>
      <StepRow step={2} total={2} backLabel={t('done.back')} onBack={() => navigate('/input')} />

      <header className="done-header">
        <h1 className="title done-title">{t('done.title')}</h1>
        {loading && (
          <>
            <Skeleton block={12} />
            <p className="caption" aria-live="polite">{t('done.loading', { n: total })}</p>
          </>
        )}
        {!loading && !isEmpty && (
          <>
            <TickBar total={total} filled={completed} size="small" dense={dense} label={t('done.count', { n: completed, total })} />
            <p className="caption" aria-live="polite">
              {t('done.count', { n: completed, total })}
              {dense && `، ${t('done.longHint')}`}
              {grouped && completed === 0 && `، ${t('done.groupedHint')}`}
            </p>
          </>
        )}
      </header>

      {isEmpty ? (
        <section className="done-empty">
          <div className="done-empty__row" aria-hidden="true">
            <span className="done-empty__box" />
            <span className="course-row__code">— — —</span>
            <span>— — — — —</span>
          </div>
          <h2 className="section-heading">{t('done.empty.title')}</h2>
          <p className="subtitle">{t('done.empty.body')}</p>
        </section>
      ) : (
        <>
          {showSearch && (
            <div className="done-search">
              <SearchField
                value={query} onChange={changeQuery} disabled={loading}
                label={t('done.search.label')}
                placeholder={dense ? t('input.search', { n: total }) : t('done.search')}
              />
            </div>
          )}

          {allDone && (
            <div className="done-note" role="status">
              <CheckIcon size={24} stroke={2} />
              <div className="done-note__text">
                <strong className="section-heading">{t('done.success.title')}</strong>
                <span className="caption">{t('done.success.body')}</span>
              </div>
            </div>
          )}

          {loading && (
            <ul className="done-list" aria-busy="true">
              {['100%', '55%', '70%', '45%'].map((w) => (
                <li key={w} className="course-row"><Skeleton inline={24} block={24} /><Skeleton inline={64} /><Skeleton inline={w} /></li>
              ))}
            </ul>
          )}

          {notFound && (
            <section className="done-notfound" role="status">
              <h2 className="section-heading">{t('done.error.title', { query: shownQuery })}</h2>
              <p className="subtitle">{t('done.error.body')}</p>
              <SecondaryButton icon={<PlusIcon />} onClick={addMissing}>{t('done.error.button', { query: shownQuery })}</SecondaryButton>
            </section>
          )}

          {grouped && searching && !notFound && (
            <p className="caption done-results" aria-live="polite">{t('done.search.results', { n: visible.length })}</p>
          )}

          {grouped && !notFound && (
            <div className="done-list">
              {shownGroups.map(({ group, rows }) => (
                <CourseGroup
                  key={group.key}
                  group={group}
                  rows={rows}
                  open={isOpen(group.key)}
                  searching={searching}
                  onToggle={() => toggleGroup(group.key)}
                  onTickAll={() => tickAll(group)}
                  onToggleCourse={toggleCompleted}
                />
              ))}
            </div>
          )}

          {!loading && !grouped && !notFound && (
            <ul className="done-list">
              {visible.map((c) => (
                <CheckRow key={c.code} code={c.code} name={c.name} checked={c.completed} onChange={() => toggleCompleted(c.code)} />
              ))}
            </ul>
          )}
        </>
      )}

      <Footer>
        {toast && (
          <div className="footer__toast">
            <Toast actionLabel={t('common.undo')} onAction={() => { toast.undo(); setToast(null); }}>{toast.text}</Toast>
          </div>
        )}
        {isEmpty ? (
          <PrimaryButton onClick={() => navigate('/input')}>{t('done.empty.button')}</PrimaryButton>
        ) : loading ? (
          <PrimaryButton disabled>{t('done.next.loading')}</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => navigate('/remaining')}>{t('done.next', { n: remaining })}</PrimaryButton>
        )}
      </Footer>
    </Screen>
  );
}
