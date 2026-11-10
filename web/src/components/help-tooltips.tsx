'use client';

import { useEffect, useState } from 'react';
import { TARGETS, explanation } from './help-explanation';

type Tip = { text: string; left: number; top: number; below: boolean };

function targetFrom(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  return node.closest<HTMLElement>(TARGETS);
}

/** One delegated listener also covers dialogs and content that appears after loading. */
export function HelpTooltips() {
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    let active: HTMLElement | null = null;
    let timer: number | undefined;
    let originalTitle: string | null = null;
    let originalDescription: string | null = null;
    let pointerFocus = false;

    const hide = () => {
      window.clearTimeout(timer);
      if (active) {
        if (originalTitle !== null) active.setAttribute('title', originalTitle);
        if (originalDescription === null) active.removeAttribute('aria-describedby');
        else active.setAttribute('aria-describedby', originalDescription);
      }
      active = null;
      originalTitle = null;
      originalDescription = null;
      setTip(null);
    };

    const show = (element: HTMLElement, immediate = false) => {
      if (element === active) return;
      hide();
      const text = explanation(element);
      if (!text) return;
      active = element;
      originalTitle = element.getAttribute('title');
      originalDescription = element.getAttribute('aria-describedby');
      if (originalTitle !== null) element.removeAttribute('title');
      element.setAttribute('aria-describedby', [originalDescription, 'plaza-help-tooltip'].filter(Boolean).join(' '));
      timer = window.setTimeout(() => {
        if (active !== element || !element.isConnected) return;
        const box = element.getBoundingClientRect();
        const below = box.top < 125;
        const edge = Math.min(160, window.innerWidth / 2);
        setTip({
          text,
          left: Math.max(edge, Math.min(box.left + box.width / 2, window.innerWidth - edge)),
          top: below ? box.bottom + 10 : box.top - 10,
          below,
        });
      }, immediate ? 0 : 350);
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const target = targetFrom(event.target);
      if (target) show(target);
      else hide();
    };
    const onOut = (event: PointerEvent) => {
      if (active && !active.contains(event.relatedTarget as Node | null)) hide();
    };
    const onFocus = (event: FocusEvent) => {
      if (pointerFocus) return;
      const target = targetFrom(event.target);
      if (target) show(target, true);
    };
    const onBlur = (event: FocusEvent) => {
      if (active && !active.contains(event.relatedTarget as Node | null)) hide();
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') hide(); };
    const onPointerDown = () => {
      pointerFocus = true;
      hide();
      window.setTimeout(() => { pointerFocus = false; }, 0);
    };
    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    window.addEventListener('keydown', onKey);
    return () => {
      hide();
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return tip ? (
    <div
      id="plaza-help-tooltip"
      className="help-tooltip"
      role="tooltip"
      style={{ left: tip.left, top: tip.top, transform: tip.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)' }}
    >
      {tip.text}
    </div>
  ) : null;
}
