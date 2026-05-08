import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, formatPrice, formatDate } from '../services/api';
import logo from '../assets/logo-icon.svg';

const EXCURSION_IMGS = {
  "Ouzoud":      "https://images.pexels.com/photos/13584644/pexels-photo-13584644.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Agadir":      "https://images.pexels.com/photos/3264723/pexels-photo-3264723.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Essaouira":   "https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Ouarzazate":  "https://images.pexels.com/photos/4502967/pexels-photo-4502967.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Ourika":      "https://images.pexels.com/photos/4553618/pexels-photo-4553618.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Imlil":       "https://images.pexels.com/photos/4553618/pexels-photo-4553618.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Merzouga":    "https://images.pexels.com/photos/3889927/pexels-photo-3889927.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Montgolfière":"https://images.pexels.com/photos/2404046/pexels-photo-2404046.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
};

function getImg(dest) {
  for (const [k, v] of Object.entries(EXCURSION_IMGS)) {
    if (dest.includes(k)) return v;
  }
  return "https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1";
}

export default function Home() {
  const navigate = useNavigate();
  const [currentType, setCurrentType] = useState('transfert');
  const [searchParams, setSearchParams] = useState({ depart: '', pax: '', date: '' });
  
  const [featured, setFeatured] = useState([]);
  const [avis, setAvis] = useState([]);
  const [loadingExcursions, setLoadingExcursions] = useState(true);
  const [loadingAvis, setLoadingAvis] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiFetch('/tarifs?type=excursion');
        const seen = {};
        const items = data.filter(t => {
          if (seen[t.destination]) return false;
          seen[t.destination] = true;
          return true;
        }).slice(0, 6);
        setFeatured(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingExcursions(false);
      }

      try {
        const avisData = await apiFetch('/avis');
        setAvis(avisData.slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAvis(false);
      }
    }
    loadData();
  }, []);

  const doSearch = () => {
    const p = new URLSearchParams({ type: currentType });
    if (searchParams.pax) p.set('pax', searchParams.pax);
    if (searchParams.depart) p.set('depart', searchParams.depart);
    if (searchParams.date) p.set('date', searchParams.date);
    navigate(`/search?${p.toString()}`);
  };

  const goSearch = (type) => navigate(`/search?type=${type}`);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <img src={logo} alt="LAAZIRI TRAVEL Logo" className="hero-logo" style={{ height: '140px', width: '140px', objectFit: 'contain', marginBottom: '16px' }} />
          <h1>Votre aventure marocaine <span>commence ici</span></h1>
          <p>Transferts aéroport, excursions exclusives, circuits multi-jours et activités inoubliables. LAAZIRI TRAVEL, votre partenaire de confiance.</p>

          <div className="search-box mt-4">
            <div className="search-tabs">
              {[
                { id: 'transfert', icon: '✈️', label: 'Transfert' },
                { id: 'excursion', icon: '🏔️', label: 'Excursion' },
                { id: 'circuit', icon: '🗺️', label: 'Circuit' },
                { id: 'agafay', icon: '🏜️', label: 'Agafay' },
                { id: 'hammam', icon: '♨️', label: 'Hammam/SPA' },
                { id: 'restaurant', icon: '🍽️', label: 'Restaurant' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  className={`search-tab ${currentType === tab.id ? 'active' : ''}`} 
                  onClick={() => setCurrentType(tab.id)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <div className="search-fields">
              <div className="form-group">
                <label className="form-label">Départ</label>
                <select className="form-control" value={searchParams.depart} onChange={e => setSearchParams({...searchParams, depart: e.target.value})}>
                  <option value="">Tous les départs</option>
                  <option value="Aéroport Marrakech">🛬 Aéroport Marrakech</option>
                  <option value="Marrakech">🏙️ Marrakech</option>
                  <option value="Riad">🏠 Votre Riad</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Voyageurs</label>
                <select className="form-control" value={searchParams.pax} onChange={e => setSearchParams({...searchParams, pax: e.target.value})}>
                  <option value="">Tous</option>
                  <option value="1">1 personne</option>
                  <option value="2">2 personnes</option>
                  <option value="3">3 personnes</option>
                  <option value="4">4 personnes</option>
                  <option value="5">5+ personnes</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" min={new Date().toISOString().split('T')[0]} value={searchParams.date} onChange={e => setSearchParams({...searchParams, date: e.target.value})} />
              </div>
              <button className="btn btn-primary" onClick={doSearch} style={{height: '46px', whiteSpace: 'nowrap'}}>
                🔍 Rechercher
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar" style={{marginTop: '-1px'}}>
        <div className="stat-item"><div className="stat-value">5000+</div><div className="stat-label">Clients satisfaits</div></div>
        <div className="stat-item"><div className="stat-value">21</div><div className="stat-label">Chauffeurs experts</div></div>
        <div className="stat-item"><div className="stat-value">24</div><div className="stat-label">Personnel qualifié</div></div>
        <div className="stat-item"><div className="stat-value">⭐ 4.9</div><div className="stat-label">Note moyenne</div></div>
        <div className="stat-item"><div className="stat-value">24/7</div><div className="stat-label">Service client</div></div>
      </div>

      {/* SERVICES */}
      <section className="section" id="services">
        <h2 className="section-title">Nos Services</h2>
        <p className="section-sub">Tout ce dont vous avez besoin pour votre séjour à Marrakech</p>
        <div className="services-grid">
          {[
            { id: 'transfert', icon: '✈️', title: 'Transferts', desc: 'Aéroport, hôtel, riad', from: 'Dès 100 MAD' },
            { id: 'excursion', icon: '🏔️', title: 'Excursions', desc: 'Ouzoud, Ourika, Essaouira...', from: 'Dès 1 200 MAD' },
            { id: 'circuit', icon: '🗺️', title: 'Circuits Multi-jours', desc: 'Merzouga, kasbahs, désert', from: 'Dès 8 950 MAD' },
            { id: 'agafay', icon: '🏜️', title: 'Agafay Desert', desc: 'Quad, dromadaire, dîner', from: 'Dès 1 800 MAD' },
            { id: 'hammam', icon: '♨️', title: 'Hammam & SPA', desc: 'Gommage, massage, détente', from: 'Dès 350 MAD' },
            { id: 'restaurant', icon: '🍽️', title: 'Restaurants', desc: 'Dîners en riad avec spectacle', from: 'Dès 250 MAD' },
            { id: 'ville', icon: '🏙️', title: 'City Tour', desc: 'Médina, souks, palais', from: 'Dès 800 MAD' },
          ].map(s => (
            <div key={s.id} className="service-card" onClick={() => goSearch(s.id)}>
              <div className="icon">{s.icon}</div>
              <div className="title">{s.title}</div>
              <div className="text-muted text-xs mb-2">{s.desc}</div>
              <div className="from">{s.from}</div>
            </div>
          ))}
        </div>
      </section>

      {/* EXCURSIONS VEDETTES */}
      <section className="section" id="excursions" style={{background: 'rgba(22,32,53,0.5)'}}>
        <h2 className="section-title">⭐ Excursions Populaires</h2>
        <p className="section-sub">Les aventures préférées de nos voyageurs</p>
        <div className="excursion-grid">
          {loadingExcursions ? <div className="spinner"></div> : featured.length > 0 ? featured.map(t => (
            <div key={t.id} className="exc-card fade-in">
              <div className="exc-card-img" style={{background:'linear-gradient(135deg, #0077B6, #00A8E8)'}}>
                <img src={getImg(t.destination)} alt={t.destination} loading="lazy" onError={e => { e.target.style.display='none'; }} />
                <div className="price-tag">Dès {formatPrice(t.prix)}</div>
              </div>
              <div className="exc-card-body">
                <div className="card-badges mb-2">
                  {t.repas_inclus && <span className="badge badge-success">🍽️ Repas</span>}
                  {t.guide_inclus && <span className="badge badge-primary">🎤 Guide</span>}
                  <span className="badge badge-muted">⏱️ {t.duree}</span>
                </div>
                <div className="exc-card-title">{t.destination}</div>
                <div className="exc-card-route">📍 {t.depart} → {t.destination}</div>
                <div className="exc-card-footer">
                  <span className="text-xs text-muted">{t.pax_min}–{t.pax_max} pers.</span>
                  <button className="btn btn-primary btn-sm" onClick={() => goSearch('excursion')}>Réserver</button>
                </div>
              </div>
            </div>
          )) : <p className="text-muted text-center w-full">Impossible de charger les excursions.</p>}
        </div>
        <div className="text-center mt-4">
          <button className="btn btn-outline" onClick={() => goSearch('excursion')}>Voir toutes les excursions →</button>
        </div>
      </section>

      {/* AVIS */}
      <section className="section" id="avis">
        <h2 className="section-title">💬 Avis Clients</h2>
        <p className="section-sub">Ce que disent nos voyageurs</p>
        <div className="avis-grid">
          {loadingAvis ? <div className="spinner"></div> : avis.length > 0 ? avis.map(a => (
            <div key={a.id} className="card p-3 fade-in">
              <div className="flex gap-1 mb-2">{'⭐'.repeat(a.note)}</div>
              <p className="text-sm" style={{lineHeight: 1.65, fontStyle: 'italic', color: 'var(--text)'}}>"{a.commentaire}"</p>
              <div className="flex items-center gap-2 mt-3">
                <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.9rem', flexShrink:0}}>
                  {a.client ? a.client.prenom[0].toUpperCase() : '?'}
                </div>
                <div>
                  <div className="font-bold text-sm">{a.client ? a.client.prenom + ' ' + a.client.nom : 'Client'}</div>
                  <div className="text-xs text-muted">{formatDate(a.created_at).split(',')[0]}</div>
                </div>
              </div>
            </div>
          )) : <p className="text-muted">Aucun avis pour le moment.</p>}
        </div>
      </section>

      {/* CONTACT */}
      <section className="section" id="contact" style={{background: 'rgba(22,32,53,0.5)'}}>
        <div style={{maxWidth: '700px', margin: '0 auto', textAlign: 'center'}}>
          <h2 className="section-title">📞 Contactez-nous</h2>
          <p className="section-sub">Notre équipe est disponible 24h/24 pour vous accompagner</p>
          <div className="grid-4 mt-4">
            <a href="https://wa.me/212600594828" target="_blank" rel="noreferrer" className="card p-3 text-center" style={{textDecoration: 'none'}}>
              <div style={{fontSize: '2rem', marginBottom: '10px'}}>💬</div>
              <div className="font-bold">WhatsApp</div>
              <div className="text-muted text-sm mt-1">+212 600-594828</div>
              <div className="btn btn-primary btn-sm mt-3" style={{justifyContent: 'center', display: 'flex'}}>Écrire</div>
            </a>
            <a href="tel:+212600594828" className="card p-3 text-center" style={{textDecoration: 'none'}}>
              <div style={{fontSize: '2rem', marginBottom: '10px'}}>📱</div>
              <div className="font-bold">Appel</div>
              <div className="text-muted text-sm mt-1">+212 600-594828</div>
              <div className="btn btn-outline btn-sm mt-3" style={{justifyContent: 'center', display: 'flex'}}>Appeler</div>
            </a>
            <a href="https://www.instagram.com/laaziritravel" target="_blank" rel="noreferrer" className="card p-3 text-center" style={{textDecoration: 'none'}}>
              <div style={{fontSize: '2rem', marginBottom: '10px'}}>📸</div>
              <div className="font-bold">Instagram</div>
              <div className="text-muted text-sm mt-1">@laaziritravel</div>
              <div className="btn btn-outline btn-sm mt-3" style={{justifyContent: 'center', display: 'flex'}}>Suivre</div>
            </a>
            <a href="mailto:contact@laaziritravel.com" className="card p-3 text-center" style={{textDecoration: 'none'}}>
              <div style={{fontSize: '2rem', marginBottom: '10px'}}>✉️</div>
              <div className="font-bold">Email</div>
              <div className="text-muted text-sm mt-1">contact@laaziritravel.com</div>
              <div className="btn btn-outline btn-sm mt-3" style={{justifyContent: 'center', display: 'flex'}}>Écrire</div>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
