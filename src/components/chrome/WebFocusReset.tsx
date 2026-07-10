import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Global web CSS: kill default focus rings on native-ish inputs.
 * Outer field containers handle focus styling in React instead.
 */
export function WebFocusReset() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.setAttribute('data-restora-focus-reset', 'true');
    style.textContent = `
      input, textarea, select, [contenteditable="true"] {
        outline: none !important;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent;
      }
      input:focus, textarea:focus, select:focus {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  return null;
}
