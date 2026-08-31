import { useCallback, useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";

const LONG_PRESS_DURATION_MS = 500;
const MOVE_CANCEL_THRESHOLD_PX = 10;

// Révèle un élément normalement affiché au survol (`group-hover:flex`) via un
// appui long tactile, puisque `:hover` n'existe pas sur mobile.

export function useLongPress<T extends HTMLElement>(): [
  (node: T | null) => void,
  boolean,
  {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
  },
] {
  const [revealed, setRevealed] = useState(false);
  const elementRef = useRef<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const setRef = useCallback((node: T | null) => {
    elementRef.current = node;
  }, []);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    timerRef.current = setTimeout(
      () => setRevealed(true),
      LONG_PRESS_DURATION_MS,
    );
  }

  function onTouchMove(e: TouchEvent) {
    if (!startPos.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startPos.current.x);
    const dy = Math.abs(touch.clientY - startPos.current.y);
    if (dx > MOVE_CANCEL_THRESHOLD_PX || dy > MOVE_CANCEL_THRESHOLD_PX) {
      clearTimer();
    }
  }

  function onTouchEnd() {
    clearTimer();
  }

  // Un tap ailleurs referme la bulle révélée
  useEffect(() => {
    if (!revealed) return;
    function handleOutside(e: globalThis.TouchEvent | MouseEvent) {
      if (
        elementRef.current &&
        !elementRef.current.contains(e.target as Node)
      ) {
        setRevealed(false);
      }
    }
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [revealed]);

  return [setRef, revealed, { onTouchStart, onTouchMove, onTouchEnd }];
}
