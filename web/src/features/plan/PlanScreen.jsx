// Screen 4: خطة التخرج (HANDOFF §2, design HiPlan + StatesPlan, rules 5–10 and 13).
// States: loading (900ms, pulsing ticks) · paths A/B/C with the signature tick drop ·
// pick a path · save (loading → done) · save error (private browsing) · no prerequisites · full (7 terms).
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/StoreProvider.jsx';
import { navigate } from '../../App.jsx';
import { PrimaryButton, SecondaryButton } from '../../components/Button.jsx';
import { FieldError } from '../../components/Field.jsx';
import { Chip } from '../../components/CourseRow.jsx';
import { Card } from '../../components/Feedback.jsx';
import { TickBar } from '../../components/TickBar.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Screen, Footer } from '../../components/Screen.jsx';
import { BackIcon, SpinnerIcon } from '../../components/Icons.jsx';
import { findCycle } from '../../lib/courses.js';
import { generatePaths, hasAnyPrerequisite } from '../../lib/plan.js';
import { devSave } from '../../lib/devState.js';
import { t } from '../../lib/strings.js';
import './plan.css';

const LOADING_MS = 900; // DESIGN.md §7: plan loading
const SAVE_MS = 700;    // DESIGN.md §7: save
const LETTER = { A: 'أ', B: 'ب', C: 'ج' };

function termName(i, count) {
  if (i === count - 1) return t('plan.term.last'); // «ترم التخرج»
  if (i === 0) return t('plan.term.next');
  if (i === 1) return t('plan.term.after');
  return i + 1 <= 10 ? t(`plan.term.${i + 1}`) : t('plan.term.n', { n: i + 1 });
}
const termCount = (n) => t(n >= 3 && n <= 10 ? 'plan.term.count.few' : 'plan.term.count.other', { n });
const sameTerms = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default function PlanScreen() {
  const { status, courses, settings, savedPath, savePath } = useStore();
  const max = settings.maxCoursesPerTerm;
  const storeLoading = status === 'loading';

  const [arranging, setArranging] = useState(true); // the 900ms "جاري ترتيب" state on open
  const [ignorePrereqs, setIgnorePrereqs] = useState(false);
  const [selected, setSelected] = useState(null);
  const [save, setSave] = useState('idle'); // 'idle' | 'saving' | 'done' | 'failed'

  const remaining = courses.filter((c) => !c.completed).length;
  const hasCycle = !storeLoading && findCycle(courses) !== null;
  const noPrereqs = !storeLoading && !hasAnyPrerequisite(courses) && !ignorePrereqs;

  // Nothing to plan (rule 11) or a loop (rule 5): screen 3 explains both, so go back there.
  useEffect(() => {
    if (!storeLoading && (remaining === 0 || hasCycle)) navigate('/remaining');
  }, [storeLoading, remaining, hasCycle]);

  // Rules 6–9: computed from the student's own courses, never hard-coded.
  const { termCount: terms, paths } = useMemo(
    () => generatePaths(courses, max, { ignorePrerequisites: ignorePrereqs }),
    [courses, max, ignorePrereqs],
  );

  // Open on the saved path if there is one, else the first.
  const path = paths.find((p) => p.id === selected)
    ?? paths.find((p) => p.id === savedPath?.pathId)
    ?? paths[0];

  // Show "saved" when the shown path is exactly the one stored on this device.
  useEffect(() => {
    if (path && savedPath && savedPath.pathId === path.id && sameTerms(savedPath.terms, path.terms)) setSave('done');
  }, [path, savedPath]);

  // generatePaths: the 900ms arranging state each time the screen opens (or after «رتّبها بدونها»).
  useEffect(() => {
    if (noPrereqs) return undefined;
    setArranging(true);
    const id = setTimeout(() => setArranging(false), LOADING_MS);
    return () => clearTimeout(id);
  }, [noPrereqs, ignorePrereqs]);

  function pick(id) {
    setSelected(id);
    setSave('idle');
  }

  function onSave() {
    setSave('saving');
    setTimeout(() => {
      // Rule 13: if the browser refuses, keep the plan on screen and show the error.
      const ok = import.meta.env.DEV && devSave() === 'fail' ? false : savePath(path);
      setSave(ok ? 'done' : 'failed');
    }, SAVE_MS);
  }

  const header = (
    <div className="plan-top">
      <button type="button" className="back-btn" aria-label={t('plan.back')} onClick={() => navigate('/remaining')}>
        <BackIcon />
      </button>
      <span className="plan-top__title">{t('plan.header')}</span>
      <span className="plan-top__spacer" aria-hidden="true" />
    </div>
  );

  // Rule 6: no prerequisites at all.
  if (noPrereqs) {
    return (
      <Screen>
        {header}
        <section className="plan-empty">
          <div className="plan-empty__ticks" aria-hidden="true">
            {[0, 1].map((g) => <span key={g}>{[0, 1, 2].map((i) => <i key={i} />)}</span>)}
          </div>
          <h1 className="title">{t('plan.empty.title')}</h1>
          <p className="subtitle">{t('plan.empty.body', { n: remaining })}</p>
        </section>
        <Footer>
          <PrimaryButton onClick={() => navigate('/input')}>{t('plan.empty.primary')}</PrimaryButton>
          <SecondaryButton onClick={() => setIgnorePrereqs(true)}>{t('plan.empty.secondary', { max })}</SecondaryButton>
        </Footer>
      </Screen>
    );
  }

  if (storeLoading || arranging || !path) {
    return (
      <Screen>
        {header}
        <section className="plan-loading" aria-live="polite">
          <h1 className="title plan-loading__title"><SpinnerIcon />{t('plan.loading', { n: remaining })}</h1>
          <div className="plan-loading__ticks" aria-hidden="true">
            {Array.from({ length: Math.max(remaining, 1) }, (_, i) => <span key={i} style={{ '--i': i }} />)}
          </div>
          <p className="caption">{t('plan.loading.sub', { max })}</p>
        </section>
      </Screen>
    );
  }

  const letter = LETTER[path.id];
  const options = paths.map((p) => ({ value: p.id, label: t(`plan.path.${p.id}`), sub: t(`plan.strategy.${p.strategy}`) }));

  return (
    <Screen>
      {header}

      <section className="plan-summary">
        <h1 className="title">{t('plan.title', { n: terms })}</h1>
        <p className="caption">{t('plan.sub', { max })}</p>
        <div className="plan-summary__ticks">
          {/* key: the signature drop replays when another path is picked */}
          <TickBar key={path.id} filled={0} groups={path.terms.map((term) => term.length)} animate
            label={t('plan.title', { n: terms })} />
        </div>
      </section>

      {paths.length > 1 && (
        <div className="plan-picker">
          <Segmented label={t('plan.pick')} options={options} value={path.id} onChange={pick} />
        </div>
      )}

      <ol className="plan-terms" key={path.id}>
        {path.terms.map((term, i) => (
          <li key={i} className="plan-terms__item" style={{ '--i': i }}>
            <Card title={termName(i, path.terms.length)} count={termCount(term.length)}>
              <div className="chips">{term.map((code) => <Chip key={code}>{code}</Chip>)}</div>
            </Card>
          </li>
        ))}
      </ol>

      <Footer>
        {save === 'failed' && <FieldError>{t('plan.error.save')}</FieldError>}
        {/* Rule 10: the disclaimer is always shown. */}
        <span className="caption footer__center">{t('plan.disclaimer')}</span>
        {save === 'done' && <span className="caption footer__center" role="status">{t('plan.saved.sub')}</span>}
        <PrimaryButton
          status={save === 'saving' ? 'loading' : save === 'done' ? 'done' : 'default'}
          onClick={onSave}
        >
          {save === 'saving' ? t('plan.saving')
            : save === 'done' ? t('plan.saved', { letter })
            : save === 'failed' ? t('plan.error.retry', { letter })
            : t('plan.save', { letter })}
        </PrimaryButton>
      </Footer>
    </Screen>
  );
}
