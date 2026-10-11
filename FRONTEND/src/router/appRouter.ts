import { useSyncExternalStore } from 'react';

function getSnapshot() {
  return window.location.pathname || '/';
}

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

export function useAppPath() {
  return useSyncExternalStore(subscribe, getSnapshot, () => '/');
}

export function navigate(path: string) {
  if (window.location.pathname === path) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
