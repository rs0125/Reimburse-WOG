type Props = { className?: string; size?: number };

const s = (size?: number) => ({ width: size ?? 14, height: size ?? 14 });

export function IconEdit({ className, size }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s(size)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export function IconX({ className, size }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s(size)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function IconEye({ className, size }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s(size)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconPlus({ className, size }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s(size)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconPaperclip({ className, size }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s(size)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export function IconArrowRight({ className, size }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s(size)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
