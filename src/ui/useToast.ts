import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast(duration = 3000) {
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback(
    (msg: string) => {
      setMessage(msg);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMessage(''), duration);
    },
    [duration],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { message, show };
}
