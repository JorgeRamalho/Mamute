import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  hasCookieConsent,
  saveCookieConsent,
  type CookieConsentChoice,
} from "../../lib/cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasCookieConsent());
  }, []);

  const respond = (choice: CookieConsentChoice) => {
    saveCookieConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-labelledby="cookie-banner-title" aria-live="polite">
      <div className="cookie-banner-inner">
        <div className="cookie-banner-copy">
          <p className="cookie-banner-kicker">Cookies e armazenamento local</p>
          <h2 id="cookie-banner-title">Sua privacidade na cabine Mamute</h2>
          <p>
            Usamos armazenamento local no navegador para salvar perfil de DJ, progresso da academia e
            preferências da rádio. Ao aceitar, você concorda com o uso descrito na nossa política de
            cookies. Serviços de terceiros (como players de vídeo) podem definir cookies próprios quando
            você os utiliza.
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button type="button" className="btn btn-solid" onClick={() => respond("all")}>
            Aceitar
          </button>
          <button type="button" className="btn" onClick={() => respond("essential")}>
            Apenas necessários
          </button>
          <Link className="cookie-banner-link" to="/#cookies">
            Ver política de cookies
          </Link>
        </div>
      </div>
    </div>
  );
}
