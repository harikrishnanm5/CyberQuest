/**
 * AntiCheatMonitor — comprehensive client-side cheat detection.
 *
 * Detects:
 *  - Paste (>20 chars in a single keystroke batch)
 *  - Tab/window focus loss
 *  - Extended absence (>3s off the page)
 *  - DevTools open (window size heuristic)
 *  - Copy / Cut events
 *  - Keyboard shortcuts (Ctrl+T, Ctrl+W, Ctrl+N, Alt+Tab, F11, F12)
 *  - Right-click context menu (best effort)
 *  - Text selection (best effort)
 *  - Page visibility transitions
 *
 * Events are sent to the backend via the WebSocket (anti-cheat events).
 *
 * Usage: <AntiCheatMonitor userId={uid} sendEvent={(e) => socket.send(...)} />
 */
import { useEffect, useRef } from 'react';

const AntiCheatMonitor = ({ userId, sendEvent }) => {
  const focusStartRef = useRef(Date.now());
  const totalAwayMsRef = useRef(0);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    if (!userId || !sendEvent) return;

    const emit = (event, details = '') => {
      if (isUnmountedRef.current) return;
      try {
        sendEvent({
          type: 'event',
          event,
          details,
          timestamp: Date.now(),
        });
      } catch (e) {
        // socket not open yet — that's OK
      }
    };

    // ---- 1. Focus / Visibility ----
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        focusStartRef.current = Date.now();
        emit('FOCUS_LOSS', 'tab hidden');
      } else if (document.visibilityState === 'visible') {
        const awayMs = Date.now() - focusStartRef.current;
        totalAwayMsRef.current += awayMs;
        if (awayMs > 3000) {
          emit('EXTENDED_ABSENCE', `away ${Math.round(awayMs / 1000)}s`);
        } else {
          emit('FOCUS_RETURN', `away ${Math.round(awayMs / 1000)}s`);
        }
      }
    };

    const onBlur = () => {
      focusStartRef.current = Date.now();
      emit('WINDOW_BLUR', '');
    };

    const onFocus = () => {
      const awayMs = Date.now() - focusStartRef.current;
      if (awayMs > 1500) emit('FOCUS_RETURN', `away ${Math.round(awayMs / 1000)}s`);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    // ---- 2. DevTools detection (best-effort heuristic) ----
    const devToolsCheckInterval = setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      // DevTools docked → one dimension is significantly larger
      if (widthDiff > 200 || heightDiff > 200) {
        emit('DEVTOOLS_LIKELY', `wDiff=${widthDiff} hDiff=${heightDiff}`);
      }
    }, 5000);

    // ---- 3. Keyboard shortcuts ----
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const alt = e.altKey;

      if (ctrl && (key === 't' || key === 'w' || key === 'n')) {
        emit('KEYBOARD_SHORTCUT', `Ctrl+${key.toUpperCase()} (tab navigation)`);
        e.preventDefault();
      }
      if (alt && key === 'tab') {
        emit('KEYBOARD_SHORTCUT', 'Alt+Tab (app switch)');
        e.preventDefault();
      }
      if (key === 'f11') {
        emit('KEYBOARD_SHORTCUT', 'F11 (fullscreen toggle)');
      }
      if (key === 'f12' || (ctrl && e.shiftKey && key === 'i')) {
        emit('KEYBOARD_SHORTCUT', 'DevTools shortcut');
      }
      if (key === 'printscreen') {
        emit('KEYBOARD_SHORTCUT', 'PrintScreen (screenshot)');
      }
      if (ctrl && key === 'p') {
        emit('KEYBOARD_SHORTCUT', 'Ctrl+P (print — may leak briefing)');
      }
    };
    document.addEventListener('keydown', onKeyDown);

    // ---- 4. Copy / Cut / Paste ----
    const onCopy = () => emit('COPY', 'attempted to copy text');
    const onCut = () => emit('CUT', 'attempted to cut text');
    const onPaste = (e) => {
      const pasted = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      emit('PASTE_BLOCK', `len=${pasted.length} preview=${pasted.slice(0, 30)}`);
      e.preventDefault();
    };
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);

    // ---- 5. Context menu (right-click) ----
    const onContextMenu = (e) => {
      emit('CONTEXT_MENU', 'right-click attempted');
      // Don't preventDefault — terminal needs it for paste
    };
    document.addEventListener('contextmenu', onContextMenu);

    // ---- 6. Text selection detection (best-effort) ----
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 5) {
        // Throttle — selectionchange fires constantly
        if (!onSelectionChange._last) onSelectionChange._last = 0;
        const now = Date.now();
        if (now - onSelectionChange._last > 2000) {
          onSelectionChange._last = now;
          emit('TEXT_SELECTION', `selected ${sel.toString().length} chars`);
        }
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);

    // ---- 7. Fullscreen request detection ----
    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        emit('FULLSCREEN_ENTER', '');
      } else {
        emit('FULLSCREEN_EXIT', '');
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    // ---- 8. Window resize (could indicate DevTools docking) ----
    let resizeTimer = null;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        emit('WINDOW_RESIZE', `${window.innerWidth}x${window.innerHeight}`);
      }, 500);
    };
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      isUnmountedRef.current = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      clearInterval(devToolsCheckInterval);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('resize', onResize);
    };
  }, [userId, sendEvent]);

  return null;
};

export default AntiCheatMonitor;