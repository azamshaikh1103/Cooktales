'use client';

import { useEffect, useId, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'auto' | 'light' | 'dark';
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
    __cooktaleTurnstileReady?: Array<() => void>;
  }
}

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const SITE_KEY =
  process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

function loadTurnstileScript(onReady: () => void) {
  if (window.turnstile) {
    onReady();
    return;
  }

  window.__cooktaleTurnstileReady = window.__cooktaleTurnstileReady || [];
  window.__cooktaleTurnstileReady.push(onReady);

  if (document.getElementById(TURNSTILE_SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = TURNSTILE_SCRIPT_ID;
  script.src =
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__cooktaleOnTurnstileLoad';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  window.__cooktaleOnTurnstileLoad = () => {
    const callbacks = window.__cooktaleTurnstileReady || [];
    window.__cooktaleTurnstileReady = [];
    callbacks.forEach((callback) => callback());
  };
}

declare global {
  interface Window {
    __cooktaleOnTurnstileLoad?: () => void;
  }
}

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire: () => void;
};

export default function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const reactId = useId();
  const containerId = `turnstile-${reactId.replace(/:/g, '')}`;
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadTurnstileScript(() => {
      if (!isMounted || !window.turnstile || widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
        sitekey: SITE_KEY,
        theme: 'auto',
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': onExpire,
      });
    });

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [containerId, onExpire, onVerify]);

  return (
    <div className="flex min-h-[70px] items-center justify-center overflow-hidden rounded-2xl border border-white/50 bg-white/45 p-2 dark:border-white/10 dark:bg-white/5">
      <div id={containerId} />
    </div>
  );
}
