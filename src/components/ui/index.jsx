import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Button({ variant = "primary", size = "default", className, children, ...props }) {
  return <button className={cn("ui-button", `ui-button--${variant}`, `ui-button--${size}`, className)} {...props}>{children}</button>;
}

export function Card({ className, children, ...props }) {
  return <section className={cn("ui-card", className)} {...props}>{children}</section>;
}

export function Badge({ status = "neutral", children }) {
  return <span className={cn("ui-badge", `ui-badge--${status}`)}>{children}</span>;
}

export function Progress({ value = 0, label = "ความคืบหน้า" }) {
  return <div className="ui-progress" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function Dialog({ open, onClose, title, description, children, size = "medium" }) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
    focusable?.[0]?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && focusable?.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={panelRef} className={cn("dialog-panel", `dialog-panel--${size}`)} role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby={description ? "dialog-description" : undefined}>
        <header className="dialog-header">
          <div><h2 id="dialog-title">{title}</h2>{description && <p id="dialog-description">{description}</p>}</div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="ปิดหน้าต่าง"><X size={20} /></Button>
        </header>
        <div className="dialog-body">{children}</div>
      </section>
    </div>
  );
}
