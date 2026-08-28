import { useState } from "react";
import { NavLink } from "react-router";
import { publicAsset } from "../../lib/base";

const LINKS = [
  { to: "/mixer", label: "Mixer CDJ" },
  { to: "/academia", label: "Academia" },
  { to: "/radio", label: "Rádio" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/dj", label: "Área DJ" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink to="/" className="brand" aria-label="Mamute DJPLAYER">
          <img
            className="brand-mark"
            src={`${publicAsset("logo-mamute.png")}?v=mamute2`}
            alt=""
            width={52}
            height={52}
          />
          <span className="brand-lockup">
            <span className="brand-name">Mamute</span>
            <span className="brand-product">DJPLAYER</span>
          </span>
        </NavLink>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
        <nav id="site-nav" className={open ? "nav open" : "nav"} aria-label="Principal">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-cta">
          <NavLink className="btn btn-solid" to="/dj">
            Cadastrar DJ
          </NavLink>
        </div>
      </div>
    </header>
  );
}
