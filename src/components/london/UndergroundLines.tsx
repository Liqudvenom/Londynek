/**
 * Decorative Underground-style route lines drawn once on load (stroke-dashoffset).
 * Purely decorative: aria-hidden, and drawing is skipped for reduced motion via global CSS.
 */
export function UndergroundLines({ className = '' }: { className?: string }) {
  return (
    <svg className={`ug-lines ${className}`} viewBox="0 0 1440 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="ug-lines__path ug-lines__path--red" pathLength={1} d="M30 0 V470 Q30 520 80 520 H1360 Q1410 520 1410 470 V0" />
      <path className="ug-lines__path ug-lines__path--blue" pathLength={1} d="M0 548 H1440" />
      <path className="ug-lines__path ug-lines__path--yellow" pathLength={1} d="M0 576 H520 Q560 576 560 600" />
      <path className="ug-lines__path ug-lines__path--green" pathLength={1} d="M880 600 Q880 576 920 576 H1440" />
    </svg>
  );
}
