// CopyCodes.jsx: «انسخ رموز الترم الجاي ({n})» in the first term card (design PlanNames, HANDOFF rule 24).
// idle → done («✓ انسخت ٥ رموز», the copied text, «الصقها في نظام التسجيل…»)
//      → failed (the text selected in the box + «ما قدرنا ننسخ…»).
// The button stays tappable (copies again). The parent gives it key={path.id}, so a new path resets it.
import { useEffect, useRef, useState } from 'react';
import { SecondaryButton } from '../../components/Button.jsx';
import { CheckIcon, CopyIcon } from '../../components/Icons.jsx';
import { copyText } from '../../lib/plan.js';
import { devCopy } from '../../lib/devState.js';
import { t } from '../../lib/strings.js';

// The older way: select text in a hidden textarea and run the "copy" command.
// Deprecated, but still works in many in-app browsers where the clipboard API is blocked.
function legacyCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  area.style.fontSize = '16px'; // stops iPhone zooming in
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

async function copyToClipboard(text) {
  if (import.meta.env.DEV && devCopy() === 'fail') return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // blocked or not allowed: fall through to the older way, once
  }
  return legacyCopy(text);
}

export default function CopyCodes({ codes }) {
  const [state, setState] = useState('idle'); // 'idle' | 'done' | 'failed'
  const boxRef = useRef(null);
  const rootRef = useRef(null);
  const text = copyText(codes);
  const n = codes.length;

  // After copying, bring the result into view above the sticky footer (short phones).
  useEffect(() => {
    if (state === 'idle') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rootRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [state]);

  // Failed: select the codes in the box so a long-press offers «Copy».
  useEffect(() => {
    if (state !== 'failed' || !boxRef.current) return;
    const range = document.createRange();
    range.selectNodeContents(boxRef.current);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }, [state]);

  async function onCopy() {
    setState((await copyToClipboard(text)) ? 'done' : 'failed');
  }

  return (
    <div ref={rootRef} className="copy-codes">
      <SecondaryButton icon={state === 'done' ? <CheckIcon stroke={2.5} /> : <CopyIcon />} onClick={onCopy}>
        {state === 'done' ? t('plan.copy.done', { n }) : t('plan.copy', { n })}
      </SecondaryButton>
      {state !== 'idle' && (
        <>
          {/* Same text as copied; each code kept on one line so «ISLM 102» never splits. */}
          <div ref={boxRef} className="copy-codes__box code" dir="ltr">
            {codes.map((code, i) => (
              <span key={code}>{i > 0 && ', '}<span className="copy-codes__code">{code}</span></span>
            ))}
          </div>
          <p className={`caption${state === 'failed' ? ' copy-codes__failed' : ''}`} role={state === 'failed' ? 'alert' : 'status'}>
            {state === 'done' ? t('plan.copy.hint') : t('plan.copy.failed')}
          </p>
        </>
      )}
    </div>
  );
}
