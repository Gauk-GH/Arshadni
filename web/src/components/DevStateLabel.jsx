// DevStateLabel: DEV ONLY. While a ?state= test is open, nothing is saved (devState.js),
// so this small fixed label says so on every screen. It never blocks taps (pointer-events: none).
// main.jsx renders it only when import.meta.env.DEV is true, so it is not in the production build.
import { t } from '../lib/strings.js';

export default function DevStateLabel() {
  return <p className="dev-state-label">{t('dev.state')}</p>;
}
