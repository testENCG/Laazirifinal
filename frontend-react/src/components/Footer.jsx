import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo-icon.svg';

export default function Footer() {
  return (
    <>
      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
              <img src={logo} alt="LAAZIRI TRAVEL" style={{height:'42px',width:'42px',objectFit:'contain'}} />
              <span style={{fontSize:'1.3rem',fontWeight:800,color:'var(--primary)',letterSpacing:'0.5px'}}>LAAZIRI TRAVEL</span>
            </div>
            <p>Votre agence touristique de confiance à Marrakech. Transferts, excursions et circuits sur mesure depuis 2010.</p>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <Link to="/search?type=transfert">Transferts</Link>
            <Link to="/search?type=excursion">Excursions</Link>
            <Link to="/search?type=circuit">Circuits</Link>
            <Link to="/search?type=agafay">Agafay</Link>
          </div>
          <div className="footer-col">
            <h4>Compte</h4>
            <Link to="/login">Connexion</Link>
            <Link to="/register">Inscription</Link>
            <Link to="/dashboard">Mon espace</Link>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href="tel:+212600594828">+212 600-594828</a>
            <a href="mailto:contact@laaziritravel.com">contact@laaziritravel.com</a>
            <a href="https://www.instagram.com/laaziritravel" target="_blank" rel="noreferrer">📸 @laaziritravel</a>
            <a href="https://wa.me/212600594828" target="_blank" rel="noreferrer">💬 WhatsApp</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 LAAZIRI TRAVEL — Tous droits réservés</p>
          <div className="flex gap-3 items-center" style={{justifyContent:'center'}}>
            <a href="https://www.instagram.com/laaziritravel" target="_blank" rel="noreferrer" style={{fontSize:'1.2rem',textDecoration:'none'}} title="Instagram">📸</a>
            <a href="https://wa.me/212600594828" target="_blank" rel="noreferrer" style={{fontSize:'1.2rem',textDecoration:'none'}} title="WhatsApp">💬</a>
          </div>
        </div>
      </footer>
      <a className="wa-float" href="https://wa.me/212600594828" target="_blank" rel="noreferrer">💬</a>
    </>
  );
}
