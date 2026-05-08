import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/logo-icon.svg';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'agence') return '/admin';
    if (user.role === 'chauffeur') return '/chauffeur';
    return '/dashboard';
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <Link className="navbar-brand" to="/" onClick={closeMenu}>
          <img src={logo} alt="LAAZIRI TRAVEL Logo" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
          <span>LAAZIRI TRAVEL</span>
        </Link>
        
        {/* Hamburger button - mobile only */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
        </button>

        {/* Desktop nav */}
        <div className="navbar-nav desktop-nav">
          <a className="nav-link" href="#services" onClick={(e) => scrollToSection(e, 'services')}>Services</a>
          <a className="nav-link" href="#excursions" onClick={(e) => scrollToSection(e, 'excursions')}>Excursions</a>
          <a className="nav-link" href="#avis" onClick={(e) => scrollToSection(e, 'avis')}>Avis</a>
          <a className="nav-link" href="#contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a>
          {!user ? (
            <div className="flex gap-2">
              <Link className="btn btn-ghost btn-sm" to="/login">Connexion</Link>
              <Link className="btn btn-primary btn-sm" to="/register">S'inscrire</Link>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <Link className="btn btn-ghost btn-sm" to={getDashboardLink()}>👤 {user.prenom}</Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Déconnexion</button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && <div className="mobile-menu-overlay" onClick={closeMenu}></div>}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a className="mobile-menu-item" href="#services" onClick={(e) => scrollToSection(e, 'services')}>✈️ Services</a>
        <a className="mobile-menu-item" href="#excursions" onClick={(e) => scrollToSection(e, 'excursions')}>🏔️ Excursions</a>
        <a className="mobile-menu-item" href="#avis" onClick={(e) => scrollToSection(e, 'avis')}>⭐ Avis</a>
        <a className="mobile-menu-item" href="#contact" onClick={(e) => scrollToSection(e, 'contact')}>📞 Contact</a>
        <div style={{borderTop:'1px solid var(--border)', margin:'12px 0'}}></div>
        {!user ? (
          <>
            <Link className="mobile-menu-item" to="/login" onClick={closeMenu}>🔑 Connexion</Link>
            <Link className="mobile-menu-item highlight" to="/register" onClick={closeMenu}>✨ S'inscrire</Link>
          </>
        ) : (
          <>
            <Link className="mobile-menu-item" to={getDashboardLink()} onClick={closeMenu}>👤 Mon espace ({user.prenom})</Link>
            <button className="mobile-menu-item" onClick={handleLogout} style={{width:'100%', textAlign:'left'}}>🚪 Déconnexion</button>
          </>
        )}
      </div>
    </>
  );
}
