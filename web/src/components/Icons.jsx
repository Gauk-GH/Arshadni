// Icons.jsx: inline stroke SVGs from the design (DESIGN.md §8). 24px viewBox, round caps.
// Decorative: aria-hidden. The text next to the icon carries the meaning.

function Svg({ size = 24, stroke = 2, className, children }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" className={className}
    >
      {children}
    </svg>
  );
}

export const CheckIcon = ({ size = 20, stroke = 2.5 }) => (
  <Svg size={size} stroke={stroke}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
);

export const SpinnerIcon = ({ size = 20 }) => (
  <Svg size={size} stroke={2.5} className="icon-spin"><path d="M12 3a9 9 0 1 0 9 9" /></Svg>
);

export const PlusIcon = ({ size = 20 }) => (
  <Svg size={size}><path d="M12 5v14M5 12h14" /></Svg>
);

export const CloseIcon = ({ size = 20 }) => (
  <Svg size={size}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);

export const AlertIcon = ({ size = 16 }) => (
  <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></Svg>
);

export const FileUploadIcon = ({ size = 24 }) => (
  <Svg size={size}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M12 18v-6M9.5 14.5L12 12l2.5 2.5" />
  </Svg>
);

// Back: points RIGHT (the start side in RTL). DESIGN.md: stroke 1.75.
export const BackIcon = ({ size = 24 }) => (
  <Svg size={size} stroke={1.75}><path d="M9 6l6 6-6 6" /></Svg>
);

export const SearchIcon = ({ size = 20 }) => (
  <Svg size={size}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>
);

export const ChevronDownIcon = ({ size = 20 }) => (
  <Svg size={size}><path d="M6 9l6 6 6-6" /></Svg>
);

// Forward in RTL = pointing LEFT (choice cards).
export const ChevronForwardIcon = ({ size = 20 }) => (
  <Svg size={size}><path d="M15 6l-6 6 6 6" /></Svg>
);

export const PencilIcon = ({ size = 24 }) => (
  <Svg size={size}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Svg>
);

export const ChevronUpIcon = ({ size = 16 }) => (
  <Svg size={size}><path d="M6 15l6-6 6 6" /></Svg>
);

export const CopyIcon = ({ size = 20 }) => (
  <Svg size={size}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Svg>
);

// Three bars of different heights: the plan's "shape" line.
export const BarsIcon = ({ size = 16 }) => (
  <Svg size={size}><path d="M4 18h4V10H4zM10 18h4V6h-4zM16 18h4v-4h-4z" /></Svg>
);
