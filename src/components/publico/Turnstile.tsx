import { useEffect, useRef } from 'react';

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_ID = 'cf-turnstile-script';

/** True si hay captcha configurado en este despliegue (VITE_TURNSTILE_SITE_KEY). */
export const turnstileActivo = Boolean(SITE_KEY);

/**
 * Captcha de Cloudflare Turnstile. Sin VITE_TURNSTILE_SITE_KEY no muestra nada.
 * El token es de un solo uso: para pedir otro, cambia `reinicio` y el widget se vuelve a crear.
 */
export const Turnstile = ({ onToken, reinicio = 0 }: { onToken: (token: string) => void; reinicio?: number }) => {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !contenedor.current) return;
    let idWidget: string | undefined;
    let cancelado = false;

    const montar = () => {
      if (cancelado || !window.turnstile || !contenedor.current) return;
      idWidget = window.turnstile.render(contenedor.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };

    onToken('');
    if (window.turnstile) {
      montar();
    } else {
      let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', montar);
    }

    return () => {
      cancelado = true;
      if (idWidget && window.turnstile) window.turnstile.remove(idWidget);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reinicio]);

  if (!SITE_KEY) return null;
  return <div ref={contenedor} className="my-2" />;
};
