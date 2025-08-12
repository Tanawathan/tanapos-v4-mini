// Cross-browser helpers for MediaQueryList change events (iOS 12 Safari uses addListener/removeListener)
export type MqlLike = MediaQueryList & {
  addListener?: (listener: (e: MediaQueryListEvent | { matches: boolean }) => void) => void;
  removeListener?: (listener: (e: MediaQueryListEvent | { matches: boolean }) => void) => void;
};

export function addMqlChangeListener(mql: MqlLike, handler: (e: MediaQueryListEvent | { matches: boolean }) => void) {
  if (!mql) return;
  if (typeof (mql as any).addEventListener === 'function') {
    (mql as any).addEventListener('change', handler);
  } else if (typeof mql.addListener === 'function') {
    mql.addListener(handler as any);
  }
}

export function removeMqlChangeListener(mql: MqlLike, handler: (e: MediaQueryListEvent | { matches: boolean }) => void) {
  if (!mql) return;
  if (typeof (mql as any).removeEventListener === 'function') {
    (mql as any).removeEventListener('change', handler);
  } else if (typeof mql.removeListener === 'function') {
    mql.removeListener(handler as any);
  }
}
