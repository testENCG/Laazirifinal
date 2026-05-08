import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch, formatPrice } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const DEST_IMAGES = {
  "Cascade d'Ouzoud": "https://images.pexels.com/photos/13584644/pexels-photo-13584644.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Agadir":           "https://images.pexels.com/photos/3264723/pexels-photo-3264723.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Essaouira":        "https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Ouarzazate":       "https://images.pexels.com/photos/4502967/pexels-photo-4502967.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Vallée d'Ourika":  "https://images.pexels.com/photos/4553618/pexels-photo-4553618.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Imlil":            "https://images.pexels.com/photos/4553618/pexels-photo-4553618.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Merzouga":         "https://images.pexels.com/photos/3889927/pexels-photo-3889927.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Ciel de Marrakech":"https://images.pexels.com/photos/2404046/pexels-photo-2404046.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Marrakech":        "https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Riad":             "https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Aéroport":         "https://images.pexels.com/photos/62623/wing-plane-flying-airplane-62623.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Agafay":           "https://images.pexels.com/photos/4502967/pexels-photo-4502967.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Hammam":           "https://images.pexels.com/photos/3188/love-romantic-bath-candlelight.jpg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "SPA":              "https://images.pexels.com/photos/3188/love-romantic-bath-candlelight.jpg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Restaurant":       "https://images.pexels.com/photos/2290753/pexels-photo-2290753.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
  "Casablanca":       "https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1",
};

const EMOJIS = { transfert:'✈️', excursion:'🏔️', circuit:'🗺️', agafay:'🏜️', hammam:'♨️', restaurant:'🍽️', ville:'🏙️', golf:'⛳' };
const TITLES = { transfert:'✈️ Transferts', excursion:'🏔️ Excursions', circuit:'🗺️ Circuits', agafay:'🏜️ Agafay Desert', hammam:'♨️ Hammam & SPA', restaurant:'🍽️ Restaurants', ville:'🏙️ City Tours', golf:'⛳ Golfs' };

function getDestImage(dest) {
  if (!dest) return "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop&q=80";
  const d = dest.toLowerCase();
  for (const [key, url] of Object.entries(DEST_IMAGES)) {
    if (d.includes(key.toLowerCase()) || key.toLowerCase().includes(d.split(' ')[0].toLowerCase())) return url;
  }
  // Fallback: Marrakech landscape
  return "https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1";
}

export default function Search() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentType = searchParams.get('type') || 'transfert';
  const filterDepart = searchParams.get('depart') || '';
  const filterPax = searchParams.get('pax') || '';
  const filterDate = searchParams.get('date') || '';

  const [rawTarifs, setRawTarifs] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [sortOption, setSortOption] = useState('prix_asc');

  // Booking Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [bookDate, setBookDate] = useState(filterDate ? `${filterDate}T09:00` : '');
  const [bookPax, setBookPax] = useState('');
  const [bookNotes, setBookNotes] = useState('');
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState('');
  // Payment state
  const [payMode, setPayMode] = useState('especes');
  const [payMoment, setPayMoment] = useState('apres_course');
  const [carteNumero, setCarteNumero] = useState('');
  const [carteExpiry, setCarteExpiry] = useState('');
  const [carteCVV, setCarteCVV] = useState('');
  const [carteName, setCarteName] = useState('');

  useEffect(() => {
    loadResults();
  }, [currentType, filterDepart, filterPax]);

  const loadResults = async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams({ type: currentType });
      if (filterPax) q.set('pax', filterPax);
      if (filterDepart) q.set('depart', filterDepart);
      
      const data = await apiFetch(`/tarifs?${q.toString()}`);
      setRawTarifs(data);
      
      // Group logic
      const paxSelected = parseInt(filterPax) || 0;
      const groups = {};
      data.forEach(t => {
        const key = t.nom_fr.replace(/\s*\(\d[^)]*\)\s*/g,'').trim() + '|' + t.destination;
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      });
      
      const grouped = Object.values(groups).map(group => {
        if (!paxSelected) return group[0];
        const match = group.find(t => t.pax_min <= paxSelected && t.pax_max >= paxSelected);
        return match || group[0];
      });
      
      applySort(grouped, sortOption);
    } catch (e) {
      setError('Erreur de chargement. Vérifiez que le serveur est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const applySort = (data, sortVal) => {
    let sorted = [...data];
    if (sortVal === 'prix_asc') sorted.sort((a,b) => a.prix - b.prix);
    else if (sortVal === 'prix_desc') sorted.sort((a,b) => b.prix - a.prix);
    else if (sortVal === 'nom_asc') sorted.sort((a,b) => a.nom_fr.localeCompare(b.nom_fr));
    setResults(sorted);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    applySort(results, e.target.value);
  };

  const switchType = (type) => {
    const p = new URLSearchParams(searchParams);
    p.set('type', type);
    setSearchParams(p);
  };

  const updateFilters = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val);
    else p.delete(key);
    setSearchParams(p);
  };

  const openBook = (tarifId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const t = rawTarifs.find(x => x.id === tarifId);
    if (t) {
      setSelectedTarif(t);
      setBookPax(filterPax || t.pax_min.toString());
      setBookError('');
      setModalOpen(true);
    }
  };

  const confirmBook = async () => {
    if (!bookDate) {
      setBookError('Veuillez choisir une date');
      return;
    }
    if (payMode === 'carte' && payMoment === 'a_la_reservation') {
      if (!carteNumero || carteNumero.replace(/\s/g,'').length < 16) {
        setBookError('Numéro de carte invalide (16 chiffres)');
        return;
      }
      if (!carteExpiry || carteExpiry.length < 5) {
        setBookError('Date d\'expiration invalide (MM/AA)');
        return;
      }
      if (!carteCVV || carteCVV.length < 3) {
        setBookError('CVV invalide (3 chiffres)');
        return;
      }
    }
    setBookLoading(true);
    try {
      await apiFetch('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          type_service: selectedTarif.type_service,
          nom_service: selectedTarif.nom_fr,
          depart: selectedTarif.depart,
          destination: selectedTarif.destination,
          date_depart: bookDate,
          nombre_pax: parseInt(bookPax),
          tarif: selectedTarif.prix,
          notes: bookNotes,
          repas_inclus: selectedTarif.repas_inclus,
          guide_inclus: selectedTarif.guide_inclus,
          activites: selectedTarif.activites,
          mode_paiement: payMode,
          moment_paiement: payMoment,
          carte_numero: payMode === 'carte' ? carteNumero.replace(/\s/g,'') : ''
        })
      });
      setModalOpen(false);
      const payMsg = payMode === 'carte' && payMoment === 'a_la_reservation' 
        ? '💳 Paiement effectué par carte!' 
        : payMode === 'especes' 
          ? '💵 Paiement en espèces prévu.' 
          : '💳 Paiement par carte après la course.';
      alert(`✅ Réservation créée!\n${payMsg}\nVous serez contacté sous 24h.`);
      navigate('/dashboard');
    } catch(e) {
      setBookError(`❌ ${e.message}`);
    } finally {
      setBookLoading(false);
    }
  };

  return (
    <div style={{paddingTop:'64px'}}>
      {/* SEARCH BAR */}
      <div style={{background:'var(--dark-2)', borderBottom:'1px solid var(--border)', padding:'20px 40px'}}>
        <div className="search-box" style={{maxWidth:'900px', margin:'0 auto', padding:'16px 20px'}}>
          <div className="search-tabs">
            {[
              { id: 'transfert', icon: '✈️', label: 'Transfert' },
              { id: 'excursion', icon: '🏔️', label: 'Excursion' },
              { id: 'circuit', icon: '🗺️', label: 'Circuit' },
              { id: 'agafay', icon: '🏜️', label: 'Agafay' },
              { id: 'hammam', icon: '♨️', label: 'Hammam/SPA' },
              { id: 'restaurant', icon: '🍽️', label: 'Restaurant' },
              { id: 'ville', icon: '🏙️', label: 'City Tour' }
            ].map(tab => (
              <button 
                key={tab.id}
                className={`search-tab ${currentType === tab.id ? 'active' : ''}`} 
                onClick={() => switchType(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="search-fields">
            <div className="form-group">
              <label className="form-label">Départ</label>
              <select className="form-control" value={filterDepart} onChange={e => updateFilters('depart', e.target.value)}>
                <option value="">Tous les départs</option>
                <option value="Aéroport Marrakech">🛬 Aéroport Marrakech</option>
                <option value="Marrakech">🏙️ Marrakech</option>
                <option value="Riad">🏠 Riad</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Voyageurs</label>
              <select className="form-control" value={filterPax} onChange={e => updateFilters('pax', e.target.value)}>
                <option value="">Tous</option>
                <option value="1">1 personne</option>
                <option value="2">2 personnes</option>
                <option value="3">3 personnes</option>
                <option value="4">4 personnes</option>
                <option value="5">5 personnes</option>
                <option value="7">6-7 personnes</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" min={new Date().toISOString().split('T')[0]} value={filterDate} onChange={e => updateFilters('date', e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={loadResults} style={{height:'46px'}}>🔍</button>
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div style={{maxWidth:'1000px', margin:'0 auto', padding:'32px 40px'}}>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 style={{fontSize:'1.4rem', fontWeight:800}}>{TITLES[currentType] || 'Résultats'}</h2>
            <p className="text-muted text-sm mt-1">{results.length} résultat(s) trouvé(s)</p>
          </div>
          <select className="form-control" style={{width:'190px'}} value={sortOption} onChange={handleSortChange}>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
            <option value="nom_asc">Nom A→Z</option>
          </select>
        </div>
        
        <div id="results-list">
          {loading ? <div className="spinner"></div> : error ? <div className="alert alert-danger">{error}</div> : results.length === 0 ? (
            <div className="no-results">
              <div className="icon">🔍</div>
              <h3 className="mb-2">Aucun résultat</h3>
              <p className="text-muted">Essayez de changer vos filtres ou choisissez une autre catégorie.</p>
            </div>
          ) : (
            results.map(t => {
              const imgUrl = getDestImage(t.destination);
              const variants = rawTarifs.filter(r => r.destination === t.destination);
              const cleanTitle = t.nom_fr.replace(/\s*\(\d[^)]*\)\s*/g,'').trim();
              
              return (
                <div key={t.id} className="result-card fade-in" style={{display:'flex', gap:0, background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', marginBottom:'20px'}}>
                  <div style={{width:'220px', minHeight:'160px', flexShrink:0, overflow:'hidden', background:'linear-gradient(135deg, #0077B6, #00A8E8)'}}>
                    <img src={imgUrl} alt={t.destination} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} onError={e => { e.target.style.display='none'; }} />
                  </div>
                  <div style={{flex:1, padding:'20px 24px', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                    <div>
                      <div className="card-badges mb-2">
                        {t.repas_inclus && <span className="badge badge-success">🍽️ Repas inclus</span>}
                        {t.guide_inclus && <span className="badge badge-primary">🎤 Guide inclus</span>}
                        <span className="badge badge-muted">⏱️ {t.duree}</span>
                      </div>
                      <div style={{fontSize:'1.15rem', fontWeight:700, marginBottom:'6px'}}>{cleanTitle}</div>
                      <div style={{color:'var(--muted)', fontSize:'.85rem', marginBottom:'10px'}}>📍 {t.depart} → {t.destination}</div>
                      {t.activites && <div className="text-xs text-muted">✅ {t.activites}</div>}
                    </div>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'12px', flexWrap:'wrap', gap:'10px'}}>
                      <div>
                        {variants.length > 1 && (
                          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <label style={{fontSize:'.8rem', color:'var(--muted)'}}>Voyageurs :</label>
                            <select 
                              style={{background:'rgba(255,255,255,0.07)', border:'1px solid var(--border)', color:'var(--text)', padding:'6px 10px', borderRadius:'8px', fontSize:'.85rem'}}
                              onChange={(e) => {
                                const newT = rawTarifs.find(x => x.id === parseInt(e.target.value));
                                // Hacky way for React to re-render just this item's price: 
                                // Ideally we'd map state per item, but let's just trigger openBook with the selected variant
                                // We will update the selected variant in openBook based on a local state if needed.
                                // For simplicity here, we assume the variant is selected at booking time in the modal.
                              }}
                            >
                              {variants.map(v => (
                                <option key={v.id} value={v.id}>
                                  {v.pax_min === v.pax_max ? v.pax_min+' pers.' : v.pax_min+'-'+v.pax_max+' pers.'} — {formatPrice(v.prix)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div style={{fontSize:'1.5rem', fontWeight:800, color:'var(--primary)', marginTop:'4px'}}>
                          {formatPrice(t.prix)} <small style={{fontSize:'.75rem', color:'var(--muted)', fontWeight:400}}>/ groupe</small>
                        </div>
                      </div>
                      <button className="btn btn-accent" onClick={() => openBook(t.id)}>Réserver →</button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* BOOKING MODAL */}
      {modalOpen && selectedTarif && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.className === 'modal-overlay open') setModalOpen(false) }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">📋 Confirmer la réservation</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            
            <div className="card p-3 mb-4" style={{background:'rgba(0,168,232,0.08)', borderColor:'rgba(0,168,232,0.3)'}}>
              <div className="font-bold mb-1">{selectedTarif.nom_fr.replace(/\s*\(\d[^)]*\)\s*/g,'').trim()}</div>
              <div className="text-sm text-muted">📍 {selectedTarif.depart} → {selectedTarif.destination} &nbsp;|&nbsp; ⏱️ {selectedTarif.duree}</div>
              <div style={{fontSize:'1.5rem', fontWeight:800, color:'var(--primary)', marginTop:'8px'}}>
                {formatPrice(selectedTarif.prix)} <small style={{fontSize:'.75rem', color:'var(--muted)'}}>pour {selectedTarif.pax_min === selectedTarif.pax_max ? selectedTarif.pax_min : selectedTarif.pax_min+'-'+selectedTarif.pax_max} pers.</small>
              </div>
            </div>
            
            {bookError && <div className="alert alert-danger mb-3">{bookError}</div>}
            
            <div className="form-group mb-3">
              <label className="form-label">Date & Heure de départ</label>
              <input type="datetime-local" className="form-control" value={bookDate} onChange={e => setBookDate(e.target.value)} required />
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Nombre de voyageurs</label>
              <select className="form-control" value={bookPax} onChange={e => setBookPax(e.target.value)}>
                {Array.from({length: selectedTarif.pax_max - selectedTarif.pax_min + 1}, (_,i) => selectedTarif.pax_min+i).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Notes / Informations complémentaires</label>
              <textarea className="form-control" rows="3" placeholder="N° de vol, heure d'arrivée, demandes spéciales..." value={bookNotes} onChange={e => setBookNotes(e.target.value)}></textarea>
            </div>

            {/* PAYMENT SECTION */}
            <div style={{borderTop:'1px solid var(--border)', paddingTop:'20px', marginBottom:'20px'}}>
              <div style={{fontSize:'1rem', fontWeight:700, marginBottom:'16px'}}>💰 Paiement</div>
              
              <div className="form-group mb-3">
                <label className="form-label">Mode de paiement</label>
                <div style={{display:'flex', gap:'10px'}}>
                  <button 
                    type="button"
                    className={`btn ${payMode === 'especes' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                    style={{flex:1, justifyContent:'center'}}
                    onClick={() => setPayMode('especes')}
                  >
                    💵 Espèces
                  </button>
                  <button 
                    type="button"
                    className={`btn ${payMode === 'carte' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                    style={{flex:1, justifyContent:'center'}}
                    onClick={() => setPayMode('carte')}
                  >
                    💳 Carte bancaire
                  </button>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Quand payer ?</label>
                <div style={{display:'flex', gap:'10px'}}>
                  <button 
                    type="button"
                    className={`btn ${payMoment === 'a_la_reservation' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                    style={{flex:1, justifyContent:'center'}}
                    onClick={() => setPayMoment('a_la_reservation')}
                  >
                    🔒 Maintenant
                  </button>
                  <button 
                    type="button"
                    className={`btn ${payMoment === 'apres_course' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                    style={{flex:1, justifyContent:'center'}}
                    onClick={() => setPayMoment('apres_course')}
                  >
                    🕐 Après la course
                  </button>
                </div>
              </div>

              {payMode === 'carte' && payMoment === 'a_la_reservation' && (
                <div style={{background:'rgba(0,168,232,0.06)', border:'1px solid rgba(0,168,232,0.2)', borderRadius:'12px', padding:'16px', marginTop:'12px'}}>
                  <div style={{fontSize:'.85rem', fontWeight:600, marginBottom:'12px', color:'var(--primary)'}}>💳 Informations de la carte</div>
                  <div className="form-group mb-3">
                    <label className="form-label">Nom sur la carte</label>
                    <input className="form-control" placeholder="Nom complet" value={carteName} onChange={e => setCarteName(e.target.value)} />
                  </div>
                  <div className="form-group mb-3">
                    <label className="form-label">Numéro de carte</label>
                    <input className="form-control" placeholder="4242 4242 4242 4242" maxLength="19"
                      value={carteNumero}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g,'').slice(0,16);
                        v = v.replace(/(.{4})/g, '$1 ').trim();
                        setCarteNumero(v);
                      }}
                    />
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                    <div className="form-group">
                      <label className="form-label">Expiration</label>
                      <input className="form-control" placeholder="MM/AA" maxLength="5"
                        value={carteExpiry}
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g,'').slice(0,4);
                          if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
                          setCarteExpiry(v);
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVV</label>
                      <input className="form-control" placeholder="1234" maxLength="4" type="password"
                        value={carteCVV}
                        onChange={e => setCarteCVV(e.target.value.replace(/\D/g,'').slice(0,4))}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-2">🔒 Paiement sécurisé — Vos données sont protégées</div>
                </div>
              )}

              {payMode === 'especes' && (
                <div className="text-sm text-muted" style={{background:'rgba(255,183,3,0.08)', border:'1px solid rgba(255,183,3,0.2)', borderRadius:'10px', padding:'12px', marginTop:'8px'}}>
                  💵 Le paiement se fera {payMoment === 'a_la_reservation' ? "à la prise en charge par le chauffeur" : "à la fin de la course"} directement au chauffeur.
                </div>
              )}

              {payMode === 'carte' && payMoment === 'apres_course' && (
                <div className="text-sm text-muted" style={{background:'rgba(0,168,232,0.08)', border:'1px solid rgba(0,168,232,0.2)', borderRadius:'10px', padding:'12px', marginTop:'8px'}}>
                  💳 Vous pourrez effectuer le paiement par carte depuis votre espace client après la course.
                </div>
              )}
            </div>

            <button className="btn btn-accent" style={{width:'100%', justifyContent:'center', fontSize:'1rem'}} onClick={confirmBook} disabled={bookLoading}>
              {bookLoading ? '⏳ Envoi en cours...' : payMode === 'carte' && payMoment === 'a_la_reservation' ? `💳 Payer ${formatPrice(selectedTarif.prix)} et réserver` : '✅ Confirmer la réservation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
