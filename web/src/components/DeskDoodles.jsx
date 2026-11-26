// DeskDoodles.jsx: the card's decorative background (DESIGN.md §11), the only decoration allowed.
// One layer behind ALL content: fixed to the card, so the content scrolls over it; never takes taps
// (pointer-events: none) and hidden from screen readers (aria-hidden). Layout: lib/doodles.js.
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { layoutDoodles } from '../lib/doodles.js';

export default function DeskDoodles() {
  const ref = useRef(null);
  const [box, setBox] = useState(null); // { w, h } of the card, measured before the first paint

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // Like the artboard: the layer sits inside the card's border, but the layout uses the card's
    // OUTER size (the border is 0 on phones, 1px from 600px wide).
    const measure = () => {
      const border = parseFloat(getComputedStyle(el.parentElement).borderTopWidth) || 0;
      const w = Math.round(el.clientWidth + 2 * border);
      const h = Math.round(el.clientHeight + 2 * border);
      setBox((b) => (b && b.w === w && b.h === h ? b : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const icons = useMemo(() => (box ? layoutDoodles(box.w, box.h) : []), [box]);

  return (
    <div ref={ref} className="doodles" aria-hidden="true">
      {icons.map((i, n) => (
        <svg
          key={n} viewBox="0 0 24 24" fill="none" className="doodles__icon"
          style={{ insetInlineStart: i.x, insetBlockStart: i.y, inlineSize: i.size, blockSize: i.size, transform: `rotate(${i.rotate}deg)` }}
        >
          <path d={i.d} vectorEffect="non-scaling-stroke" />
        </svg>
      ))}
    </div>
  );
}
