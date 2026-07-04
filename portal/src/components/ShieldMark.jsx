import './components.css';

/* Generic demo mark: filled shield with an inner ring and a bold check.
   Replaces org-specific seals so the demo stays agency-neutral. Colors come
   from CSS (currentColor for the shield; the ring and check knock out). */
export default function ShieldMark({ className = '', title = 'Aegis demo mark' }) {
  const a11y = title
    ? { role: 'img', 'aria-label': title }
    : { 'aria-hidden': true };
  return (
    <svg className={`shield-mark ${className}`} viewBox="0 0 24 24" {...a11y}>
      <path fill="currentColor"
        d="M12 1.5 21 5v6.2c0 5.9-3.7 10.1-9 11.8-5.3-1.7-9-5.9-9-11.8V5l9-3.5z" />
      <path fill="none" stroke="var(--shield-ring, #fff)" strokeWidth="1.1"
        d="M12 3.6 19 6.3v4.9c0 4.9-3 8.4-7 9.9-4-1.5-7-5-7-9.9V6.3l7-2.7z" />
      <path fill="none" stroke="var(--shield-check, #fff)" strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round"
        d="m8.1 12.2 2.7 2.7 5.1-5.6" />
    </svg>
  );
}
