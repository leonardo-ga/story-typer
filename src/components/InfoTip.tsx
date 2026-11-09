import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

export function InfoTip({
  label,
  children,
  align = 'end',
}: {
  label: string;
  children: string;
  align?: 'start' | 'end';
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  useLayoutEffect(() => {
    if (!open || !anchor.current || !panel.current) {
      setPosition(null);
      return;
    }
    const target = anchor.current.getBoundingClientRect();
    const dialog = anchor.current.closest('dialog')?.getBoundingClientRect();
    const bounds =
      dialog && dialog.width > 0
        ? dialog
        : {
            left: 0,
            top: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            width: window.innerWidth,
          };
    const width = Math.min(230, Math.max(100, bounds.width - 24));
    panel.current.style.width = `${width}px`;
    const height = panel.current.getBoundingClientRect().height || 70;
    const left = Math.max(
      bounds.left + 12,
      Math.min(
        align === 'start' ? target.left : target.right - width,
        bounds.right - width - 12,
      ),
    );
    const top = Math.max(
      bounds.top + 8,
      Math.min(target.top - height - 8, bounds.bottom - height - 8),
    );
    setPosition({ left, top, width });
  }, [open, align, children]);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const outside = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node)) close();
    };
    window.addEventListener('resize', close);
    document.addEventListener('scroll', close, true);
    document.addEventListener('pointerdown', outside);
    return () => {
      window.removeEventListener('resize', close);
      document.removeEventListener('scroll', close, true);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);
  return (
    <span
      ref={anchor}
      className={`info-tip info-tip--${align}`}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setOpen(false);
      }}
    >
      <button
        type="button"
        className="info-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen(!open)}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
        }}
      >
        i
      </button>
      {open && (
        <span
          ref={panel}
          id={id}
          role="tooltip"
          className="info-panel"
          style={{ ...position, visibility: position ? 'visible' : 'hidden' }}
        >
          {children}
        </span>
      )}
    </span>
  );
}
