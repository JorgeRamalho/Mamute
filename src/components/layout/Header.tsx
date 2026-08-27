import { useState } from "react";
import { NavLink } from "react-router";
import { publicAsset } from "../../lib/base";

const LINKS = [
  { to: "/", label: "Início" },
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
      <NavLink to="/" className="brand" aria-label="Harako início">
        <img className="brand-mark" src={publicAsset("favicon.svg")} alt="" width={38} height={38} />
        <span>
          <span className="brand-name">HARAKO</span>
          <span className="brand-sub">MIXER PLAYER</span>
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
        <NavLink className="btn" to="/mixer">
          Cabine
        </NavLink>
        <NavLink className="btn btn-solid" to="/dj">
          Cadastrar DJ
        </NavLink>
      </div>
    </header>
  );
}
