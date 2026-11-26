import { useEffect, useState } from 'react';
import InputScreen from './features/input/InputScreen.jsx';
import DoneScreen from './features/done/DoneScreen.jsx';
import RemainingScreen from './features/remaining/RemainingScreen.jsx';
import PlanScreen from './features/plan/PlanScreen.jsx';

// Hash routing: the part after # in the URL picks the screen (#/input, #/done, ...).
// No library needed for 4 screens. Unknown paths fall back to screen 1.
const ROUTES = {
  '/input': InputScreen,
  '/done': DoneScreen,
  '/remaining': RemainingScreen,
  '/plan': PlanScreen,
};

function readPath() {
  const path = window.location.hash.replace(/^#/, '');
  return ROUTES[path] ? path : '/input';
}

export function navigate(path) {
  window.location.hash = path;
}

export default function App() {
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const onChange = () => {
      setPath(readPath());
      window.scrollTo(0, 0);
      // From 600px wide the app card scrolls inside itself (DESIGN.md §10): reset it too. No effect on phones.
      document.querySelector('.app')?.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const Screen = ROUTES[path];
  return (
    <div className="app">
      <Screen />
    </div>
  );
}
