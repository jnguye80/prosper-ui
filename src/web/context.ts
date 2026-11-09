import { createContext, useContext, type Dispatch } from 'react';
import type { Assessment } from '../data/sample';
import type { Action, Screen, WebState } from './store';

export interface WebContextValue {
  state: WebState;
  dispatch: Dispatch<Action>;
  toast: (msg: string) => void;
  go: (screen: Screen) => void;
  assessment: (id: string) => Assessment;
}

export const WebContext = createContext<WebContextValue | null>(null);

export function useWeb() {
  const ctx = useContext(WebContext);
  if (!ctx) throw new Error('useWeb must be used inside <WebApp>');
  return ctx;
}
