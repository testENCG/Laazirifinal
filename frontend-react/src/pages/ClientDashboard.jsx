import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch, serviceIcon, formatDate, formatPrice, STATUT_MAP, PAIEMENT_STATUT_MAP, PAIEMENT_MODE_MAP } from '../services/api';

function badgeHTML(statut) {
  const s = STATUT_MAP[statut] || { label: statut, cls: 'badge-muted' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export default function ClientDashboard() {
  const { user, login } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('reservations');
  
  const [reservations, setReservations] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [detailModal, setDetailModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  
  // Profil state
  const [profilForm, setProfilForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    telephone: user?.telephone || '',
    password: ''
  });
  const [profilMsg, setProfilMsg] = useState({ type: '', text: '' });

  // Avis state
  const [avisRating, setAvisRating] = useState(5);
  const [avisComment, setAvisComment] = useState('');
  const [avisMsg, setAvisMsg] = useState({ type: '', text: '' });

  // Rec state
  const [recForm, setRecForm] = useState({ sujet: '', message: '' });
  const [recMsg, setRecMsg] = useState({ type: '', text: '' });

  // Payment modal state
  const [payModal, setPayModal] = useState(null);
  const [payMode, setPayMode] = useState('especes');
  const [payCarteNum, setPayCarteNum] = useState('');
  const [payCarteExpiry, setPayCarteExpiry] = useState('');
  const [payCarteCVV, setPayCarteCVV] = useState('');
  const [payCarteName, setPayCarteName] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    if (activeSection === 'reservations' || activeSection === 'historique') {
      loadReservations();
    } else if (activeSection === 'reclamation') {
      loadReclamations();
    }
  }, [activeSection]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/reservations');
      setReservations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadReclamations = async () => {
    try {
      const data = await apiFetch('/reclamations');
      setReclamations(data);
    } catch (e) {
      console.error(e);
    }
  };

  const annuler = async (id) => {
    if (!window.confirm("Confirmer l'annulation?")) return;
    try {
      await apiFetch(`/reservations/${id}/annuler`, { method: 'PUT' });
      alert("Réservation annulée");
      loadReservations();
    } catch (e) {
      alert("Erreur: " + e.message);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/reservations/${editModal.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          date_depart: editModal.date_depart,
          nombre_pax: parseInt(editModal.nombre_pax),
          notes: editModal.notes
        })
      });
      setEditModal(null);
      alert("Réservation modifiée!");
      loadReservations();
    } catch (e) {
      alert("Erreur: " + e.message);
    }
  };

  const saveProfil = async () => {
    setProfilMsg({ type: '', text: '' });
    try {
      const data = await apiFetch('/auth/update', {
        method: 'PUT',
        body: JSON.stringify({
          prenom: profilForm.prenom,
          nom: profilForm.nom,
          telephone: profilForm.telephone,
          password: profilForm.password || undefined
        })
      });
      login(localStorage.getItem('lt_token'), data); // update context
      setProfilMsg({ type: 'success', text: '✅ Profil mis à jour!' });
    } catch (e) {
      setProfilMsg({ type: 'danger', text: `❌ ${e.message}` });
    }
  };

  const submitAvis = async () => {
    if (!avisComment.trim()) {
      setAvisMsg({ type: 'danger', text: 'Écrivez un commentaire' });
      return;
    }
    try {
      await apiFetch('/avis', { 
        method: 'POST', 
        body: JSON.stringify({ note: avisRating, commentaire: avisComment }) 
      });
      setAvisMsg({ type: 'success', text: '✅ Merci pour votre avis!' });
      setAvisComment('');
      setAvisRating(5);
    } catch (e) {
      setAvisMsg({ type: 'danger', text: `❌ ${e.message}` });
    }
  };

  const submitReclamation = async () => {
    if (!recForm.sujet || !recForm.message) {
      setRecMsg({ type: 'danger', text: 'Remplissez tous les champs' });
      return;
    }
    try {
      await apiFetch('/reclamations', { 
        method: 'POST', 
        body: JSON.stringify(recForm) 
      });
      setRecMsg({ type: 'success', text: '✅ Réclamation envoyée!' });
      setRecForm({ sujet: '', message: '' });
      loadReclamations();
    } catch (e) {
      setRecMsg({ type: 'danger', text: `❌ ${e.message}` });
    }
  };

  const processPayment = async () => {
    if (payMode === 'carte') {
      if (!payCarteNum || payCarteNum.replace(/\s/g,'').length < 16) {
        setPayError('Numéro de carte invalide'); return;
      }
      if (!payCarteExpiry || payCarteExpiry.length < 5) {
        setPayError('Date d\'expiration invalide'); return;
      }
      if (!payCarteCVV || payCarteCVV.length < 3) {
        setPayError('CVV invalide'); return;
      }
    }
    setPayLoading(true);
    setPayError('');
    try {
      await apiFetch(`/reservations/${payModal.id}/payer`, {
        method: 'PUT',
        body: JSON.stringify({
          mode_paiement: payMode,
          carte_numero: payMode === 'carte' ? payCarteNum.replace(/\s/g,'') : ''
        })
      });
      setPayModal(null);
      alert(payMode === 'carte' ? '💳 Paiement par carte effectué!' : '💵 Paiement en espèces confirmé!');
      loadReservations();
    } catch (e) {
      setPayError(`❌ ${e.message}`);
    } finally {
      setPayLoading(false);
    }
  };

  const openPayModal = (r) => {
    setPayModal(r);
    setPayMode(r.mode_paiement === 'carte' ? 'carte' : 'especes');
    setPayError('');
    setPayCarteNum(''); setPayCarteExpiry(''); setPayCarteCVV(''); setPayCarteName('');
  };

  const activeRes = reservations.filter(r => !['terminee','annulee'].includes(r.statut));
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const switchSection = (s) => { setActiveSection(s); setSidebarOpen(false); };
  
  return (
    <div className="dash-layout">
      {/* MOBILE SIDEBAR TOGGLE */}
      <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>
      {sidebarOpen && <div className="mobile-menu-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div style={{padding:'12px 16px 20px', borderBottom:'1px solid var(--border)', marginBottom:'12px'}}>
          <div style={{width:'48px', height:'48px', borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', fontWeight:700, marginBottom:'8px'}}>
            {(user?.prenom || '?')[0].toUpperCase()}
          </div>
          <div className="font-bold">{user?.prenom} {user?.nom}</div>
          <div className="text-xs text-muted mt-1">{user?.email}</div>
        </div>
        <button className={`sidebar-item ${activeSection==='reservations'?'active':''}`} onClick={() => switchSection('reservations')}><span className="sidebar-icon">📋</span> Mes Réservations</button>
        <button className={`sidebar-item ${activeSection==='historique'?'active':''}`} onClick={() => switchSection('historique')}><span className="sidebar-icon">🕐</span> Historique</button>
        <button className={`sidebar-item ${activeSection==='profil'?'active':''}`} onClick={() => switchSection('profil')}><span className="sidebar-icon">👤</span> Mon Profil</button>
        <button className={`sidebar-item ${activeSection==='avis'?'active':''}`} onClick={() => switchSection('avis')}><span className="sidebar-icon">⭐</span> Donner un Avis</button>
        <button className={`sidebar-item ${activeSection==='reclamation'?'active':''}`} onClick={() => switchSection('reclamation')}><span className="sidebar-icon">📣</span> Réclamation</button>
        <button className={`sidebar-item ${activeSection==='aide'?'active':''}`} onClick={() => switchSection('aide')}><span className="sidebar-icon">❓</span> Aide</button>
        <button className={`sidebar-item ${activeSection==='contact'?'active':''}`} onClick={() => switchSection('contact')}><span className="sidebar-icon">📞</span> Contacter l'agence</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dash-content">
        
        {/* RESERVATIONS */}
        {activeSection === 'reservations' && (
          <div>
            <div className="dash-header">
              <h2>📋 Mes Réservations</h2>
              <p>Consultez et gérez vos réservations actives</p>
            </div>
            {loading ? <div className="spinner"></div> : activeRes.length === 0 ? (
              <div className="alert alert-warning">Aucune réservation active. <a href="/search" className="text-primary">Réserver maintenant →</a></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Référence</th><th>Service</th><th>Destination</th><th>Date</th><th>Tarif</th><th>Paiement</th><th>Statut</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {activeRes.map(r => {
                      const ps = PAIEMENT_STATUT_MAP[r.statut_paiement] || PAIEMENT_STATUT_MAP.non_paye;
                      const pm = PAIEMENT_MODE_MAP[r.mode_paiement] || PAIEMENT_MODE_MAP.non_defini;
                      return (
                        <tr key={r.id}>
                          <td className="font-bold text-primary">{r.reference}</td>
                          <td>{serviceIcon(r.type_service)}</td>
                          <td>{r.destination}</td>
                          <td>{formatDate(r.date_depart)}</td>
                          <td>{formatPrice(r.tarif)}</td>
                          <td>
                            <span className={`badge ${ps.cls}`}>{ps.icon} {ps.label}</span>
                            {r.statut_paiement === 'paye' && <div className="text-xs text-muted mt-1">{pm.icon} {pm.label}</div>}
                          </td>
                          <td>{badgeHTML(r.statut)}</td>
                          <td className="flex gap-2" style={{flexWrap:'wrap'}}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal(r)}>👁️</button>
                            {r.statut_paiement !== 'paye' && r.statut !== 'annulee' && (
                              <button className="btn btn-primary btn-sm" onClick={() => openPayModal(r)}>💰 Payer</button>
                            )}
                            {r.statut === 'en_attente' && (
                              <>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditModal({...r, date_depart: r.date_depart ? r.date_depart.slice(0,16) : ''})}>✏️</button>
                                <button className="btn btn-danger btn-sm" onClick={() => annuler(r.id)}>✕</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* HISTORIQUE */}
        {activeSection === 'historique' && (
          <div>
            <div className="dash-header">
              <h2>🕐 Historique des Commandes</h2>
              <p>Toutes vos réservations passées</p>
            </div>
            {loading ? <div className="spinner"></div> : reservations.length === 0 ? (
              <div className="alert alert-warning">Aucune réservation.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Référence</th><th>Service</th><th>Destination</th><th>Date</th><th>Tarif</th><th>Paiement</th><th>Statut</th><th>Chauffeur</th></tr>
                  </thead>
                  <tbody>
                    {reservations.map(r => {
                      const ps = PAIEMENT_STATUT_MAP[r.statut_paiement] || PAIEMENT_STATUT_MAP.non_paye;
                      const pm = PAIEMENT_MODE_MAP[r.mode_paiement] || PAIEMENT_MODE_MAP.non_defini;
                      return (
                        <tr key={r.id}>
                          <td className="font-bold text-primary">{r.reference}</td>
                          <td>{serviceIcon(r.type_service)}</td>
                          <td>{r.destination}</td>
                          <td>{formatDate(r.date_depart)}</td>
                          <td>{formatPrice(r.tarif)}</td>
                          <td><span className={`badge ${ps.cls}`}>{ps.icon} {ps.label}</span>{r.statut_paiement === 'paye' && <div className="text-xs text-muted mt-1">{pm.icon} {pm.label}</div>}</td>
                          <td>{badgeHTML(r.statut)}</td>
                          <td>{r.chauffeur ? r.chauffeur.nom_complet : <span className="text-muted">—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PROFIL */}
        {activeSection === 'profil' && (
          <div>
            <div className="dash-header"><h2>👤 Mon Profil</h2><p>Gérez vos informations personnelles</p></div>
            <div className="card p-4" style={{maxWidth:'500px'}}>
              {profilMsg.text && <div className={`alert alert-${profilMsg.type} mb-3`}>{profilMsg.text}</div>}
              <div className="form-group mb-3">
                <label className="form-label">Prénom</label>
                <input className="form-control" value={profilForm.prenom} onChange={e=>setProfilForm({...profilForm, prenom: e.target.value})} />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Nom</label>
                <input className="form-control" value={profilForm.nom} onChange={e=>setProfilForm({...profilForm, nom: e.target.value})} />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Téléphone</label>
                <input className="form-control" value={profilForm.telephone} onChange={e=>setProfilForm({...profilForm, telephone: e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                <input type="password" className="form-control" placeholder="••••••••" value={profilForm.password} onChange={e=>setProfilForm({...profilForm, password: e.target.value})} />
              </div>
              <button className="btn btn-primary" onClick={saveProfil}>💾 Enregistrer</button>
            </div>
          </div>
        )}

        {/* AVIS */}
        {activeSection === 'avis' && (
          <div>
            <div className="dash-header"><h2>⭐ Donner un Avis</h2><p>Partagez votre expérience</p></div>
            <div className="card p-4" style={{maxWidth:'500px'}}>
              {avisMsg.text && <div className={`alert alert-${avisMsg.type} mb-3`}>{avisMsg.text}</div>}
              <div className="form-group mb-3">
                <label className="form-label">Note</label>
                <div className="stars">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} className={`star ${n <= avisRating ? 'filled' : ''}`} onClick={() => setAvisRating(n)} style={{cursor:'pointer'}}>★</span>
                  ))}
                </div>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Commentaire</label>
                <textarea className="form-control" rows="4" placeholder="Partagez votre expérience..." value={avisComment} onChange={e=>setAvisComment(e.target.value)}></textarea>
              </div>
              <button className="btn btn-primary" onClick={submitAvis}>✅ Envoyer l'avis</button>
            </div>
          </div>
        )}

        {/* RECLAMATION */}
        {activeSection === 'reclamation' && (
          <div>
            <div className="dash-header"><h2>📣 Réclamation</h2><p>Signalez un problème</p></div>
            <div className="card p-4" style={{maxWidth:'500px'}}>
              {recMsg.text && <div className={`alert alert-${recMsg.type} mb-3`}>{recMsg.text}</div>}
              <div className="form-group mb-3">
                <label className="form-label">Sujet</label>
                <input className="form-control" placeholder="Objet de la réclamation" value={recForm.sujet} onChange={e=>setRecForm({...recForm, sujet:e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Message</label>
                <textarea className="form-control" rows="5" placeholder="Décrivez votre problème..." value={recForm.message} onChange={e=>setRecForm({...recForm, message:e.target.value})}></textarea>
              </div>
              <button className="btn btn-primary" onClick={submitReclamation}>📤 Envoyer</button>
            </div>
            
            <div className="mt-4">
              {reclamations.length > 0 && (
                <>
                  <h3 className="mb-3">Mes réclamations</h3>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Sujet</th><th>Statut</th><th>Date</th></tr></thead>
                      <tbody>
                        {reclamations.map(r => (
                          <tr key={r.id}>
                            <td>{r.sujet}</td>
                            <td>{badgeHTML(r.statut === 'ouverte' ? 'en_attente' : r.statut === 'traitee' ? 'confirmee' : 'annulee')}</td>
                            <td>{formatDate(r.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* AIDE */}
        {activeSection === 'aide' && (
          <div>
            <div className="dash-header"><h2>❓ Aide & FAQ</h2></div>
            <div style={{maxWidth:'600px'}}>
              {[
                ['Comment annuler une réservation?', 'Vous pouvez annuler depuis la section "Mes Réservations" en cliquant sur le bouton Annuler. Les annulations sont possibles 24h avant la date de départ.'],
                ['Comment modifier une réservation?', 'Cliquez sur "Modifier" dans votre réservation pour changer la date ou le nombre de voyageurs.'],
                ['Comment suivre mon chauffeur?', 'Une fois votre réservation confirmée, le statut de votre course est visible en temps réel dans vos réservations.'],
                ['Quels modes de paiement?', 'Paiement en espèces au chauffeur ou par carte bancaire directement dans l\'application.'],
                ['Comment nous contacter?', 'Via WhatsApp au +212 600-594828, sur Instagram @laaziritravel ou par email à contact@laaziritravel.com — disponible 24h/24.'],
              ].map(([q,a], i) => (
                <div key={i} className="card p-3 mb-3">
                  <div className="font-bold mb-2">❓ {q}</div>
                  <div className="text-sm text-muted">{a}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTACT */}
        {activeSection === 'contact' && (
          <div>
            <div className="dash-header"><h2>📞 Contacter l'Agence</h2></div>
            <div className="grid-2" style={{maxWidth:'700px', gap:'16px'}}>
              <a href="https://wa.me/212600594828" target="_blank" rel="noreferrer" className="card p-3 text-center" style={{textDecoration:'none'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'10px'}}>💬</div>
                <div className="font-bold">WhatsApp</div>
                <div className="text-muted text-sm mt-1">+212 600-594828</div>
                <div className="btn btn-primary btn-sm mt-3" style={{justifyContent:'center'}}>Ouvrir</div>
              </a>
              <a href="tel:+212600594828" className="card p-3 text-center" style={{textDecoration:'none'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'10px'}}>📱</div>
                <div className="font-bold">Appeler</div>
                <div className="text-muted text-sm mt-1">+212 600-594828</div>
                <div className="btn btn-outline btn-sm mt-3" style={{justifyContent:'center'}}>Appeler</div>
              </a>
              <a href="https://www.instagram.com/laaziritravel" target="_blank" rel="noreferrer" className="card p-3 text-center" style={{textDecoration:'none'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'10px'}}>📸</div>
                <div className="font-bold">Instagram</div>
                <div className="text-muted text-sm mt-1">@laaziritravel</div>
                <div className="btn btn-outline btn-sm mt-3" style={{justifyContent:'center'}}>Suivre</div>
              </a>
              <a href="mailto:contact@laaziritravel.com" className="card p-3 text-center" style={{textDecoration:'none'}}>
                <div style={{fontSize:'2.5rem', marginBottom:'10px'}}>✉️</div>
                <div className="font-bold">Email</div>
                <div className="text-muted text-sm mt-1">contact@laaziritravel.com</div>
                <div className="btn btn-outline btn-sm mt-3" style={{justifyContent:'center'}}>Écrire</div>
              </a>
            </div>
          </div>
        )}

      </main>

      {/* DETAIL MODAL */}
      {detailModal && (
        <div className="modal-overlay open" onClick={(e) => { if(e.target.className === 'modal-overlay open') setDetailModal(null) }}>
          <div className="modal">
            <div className="modal-header"><span className="modal-title">📋 Détail de la réservation</span><button className="modal-close" onClick={() => setDetailModal(null)}>×</button></div>
            <div className="card p-3 mb-3" style={{background:'rgba(0,168,232,0.08)', borderColor:'rgba(0,168,232,0.3)'}}>
              <div className="flex justify-between"><span className="font-bold">{detailModal.reference}</span>{badgeHTML(detailModal.statut)}</div>
            </div>
            <div className="grid-2 gap-3">
              <div><div className="text-xs text-muted">Service</div><div className="font-bold mt-1">{serviceIcon(detailModal.type_service)} {detailModal.nom_service}</div></div>
              <div><div className="text-xs text-muted">Tarif</div><div className="font-bold mt-1 text-primary">{formatPrice(detailModal.tarif)}</div></div>
              <div><div className="text-xs text-muted">Départ</div><div className="mt-1">{detailModal.depart}</div></div>
              <div><div className="text-xs text-muted">Destination</div><div className="mt-1">{detailModal.destination}</div></div>
              <div><div className="text-xs text-muted">Date</div><div className="mt-1">{formatDate(detailModal.date_depart)}</div></div>
              <div><div className="text-xs text-muted">Voyageurs</div><div className="mt-1">👥 {detailModal.nombre_pax}</div></div>
              <div><div className="text-xs text-muted">Paiement</div><div className="mt-1"><span className={`badge ${(PAIEMENT_STATUT_MAP[detailModal.statut_paiement]||{}).cls||'badge-muted'}`}>{(PAIEMENT_STATUT_MAP[detailModal.statut_paiement]||{}).icon||'❓'} {(PAIEMENT_STATUT_MAP[detailModal.statut_paiement]||{}).label||detailModal.statut_paiement}</span></div></div>
              <div><div className="text-xs text-muted">Mode</div><div className="mt-1">{(PAIEMENT_MODE_MAP[detailModal.mode_paiement]||{}).icon||'❓'} {(PAIEMENT_MODE_MAP[detailModal.mode_paiement]||{}).label||detailModal.mode_paiement}{detailModal.carte_derniers_chiffres ? ` •••• ${detailModal.carte_derniers_chiffres}` : ''}</div></div>
              {detailModal.transaction_id && <div style={{gridColumn:'1/-1'}}><div className="text-xs text-muted">Transaction ID</div><div className="mt-1 text-sm font-bold">{detailModal.transaction_id}</div></div>}
              {detailModal.chauffeur && <div className="grid-2" style={{gridColumn:'1/-1'}}><div className="text-xs text-muted">Chauffeur assigné</div><div className="mt-1 font-bold">🚗 {detailModal.chauffeur.nom_complet} — {detailModal.chauffeur.vehicule_marque}</div></div>}
              {detailModal.notes && <div style={{gridColumn:'1/-1'}}><div className="text-xs text-muted">Notes</div><div className="mt-1 text-sm">{detailModal.notes}</div></div>}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && (
        <div className="modal-overlay open" onClick={(e) => { if(e.target.className === 'modal-overlay open') setEditModal(null) }}>
          <div className="modal">
            <div className="modal-header"><span className="modal-title">✏️ Modifier la réservation</span><button className="modal-close" onClick={() => setEditModal(null)}>×</button></div>
            <form onSubmit={saveEdit}>
              <div className="form-group mb-3">
                <label className="form-label">Date & Heure</label>
                <input type="datetime-local" className="form-control" value={editModal.date_depart} onChange={e=>setEditModal({...editModal, date_depart: e.target.value})} required />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Nombre de voyageurs</label>
                <input type="number" className="form-control" min="1" max="14" value={editModal.nombre_pax} onChange={e=>setEditModal({...editModal, nombre_pax: e.target.value})} required />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows="3" value={editModal.notes || ''} onChange={e=>setEditModal({...editModal, notes: e.target.value})}></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center'}}>💾 Enregistrer</button>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {payModal && (
        <div className="modal-overlay open" onClick={(e) => { if(e.target.className === 'modal-overlay open') setPayModal(null) }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">💰 Payer la réservation</span>
              <button className="modal-close" onClick={() => setPayModal(null)}>×</button>
            </div>
            
            <div className="card p-3 mb-4" style={{background:'rgba(0,168,232,0.08)', borderColor:'rgba(0,168,232,0.3)'}}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">{payModal.reference}</div>
                  <div className="text-sm text-muted">{serviceIcon(payModal.type_service)} {payModal.nom_service}</div>
                </div>
                <div style={{fontSize:'1.4rem', fontWeight:800, color:'var(--primary)'}}>{formatPrice(payModal.tarif)}</div>
              </div>
            </div>

            {payError && <div className="alert alert-danger mb-3">{payError}</div>}
            
            <div className="form-group mb-3">
              <label className="form-label">Mode de paiement</label>
              <div style={{display:'flex', gap:'10px'}}>
                <button type="button" className={`btn ${payMode === 'especes' ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{flex:1, justifyContent:'center'}} onClick={() => setPayMode('especes')}>
                  💵 Espèces
                </button>
                <button type="button" className={`btn ${payMode === 'carte' ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{flex:1, justifyContent:'center'}} onClick={() => setPayMode('carte')}>
                  💳 Carte bancaire
                </button>
              </div>
            </div>

            {payMode === 'carte' && (
              <div style={{background:'rgba(0,168,232,0.06)', border:'1px solid rgba(0,168,232,0.2)', borderRadius:'12px', padding:'16px', marginBottom:'16px'}}>
                <div className="form-group mb-3">
                  <label className="form-label">Nom sur la carte</label>
                  <input className="form-control" placeholder="Nom complet" value={payCarteName} onChange={e => setPayCarteName(e.target.value)} />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Numéro de carte</label>
                  <input className="form-control" placeholder="4242 4242 4242 4242" maxLength="19"
                    value={payCarteNum}
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g,'').slice(0,16);
                      v = v.replace(/(.{4})/g, '$1 ').trim();
                      setPayCarteNum(v);
                    }}
                  />
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                  <div className="form-group">
                    <label className="form-label">Expiration</label>
                    <input className="form-control" placeholder="MM/AA" maxLength="5"
                      value={payCarteExpiry}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g,'').slice(0,4);
                        if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
                        setPayCarteExpiry(v);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input className="form-control" placeholder="1234" maxLength="4" type="password"
                      value={payCarteCVV}
                      onChange={e => setPayCarteCVV(e.target.value.replace(/\D/g,'').slice(0,4))}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted mt-2">🔒 Paiement sécurisé — Vos données sont protégées</div>
              </div>
            )}

            {payMode === 'especes' && (
              <div className="text-sm text-muted mb-3" style={{background:'rgba(255,183,3,0.08)', border:'1px solid rgba(255,183,3,0.2)', borderRadius:'10px', padding:'12px'}}>
                💵 En confirmant, vous indiquez que le paiement en espèces a été effectué au chauffeur.
              </div>
            )}

            <button className="btn btn-accent" style={{width:'100%', justifyContent:'center', fontSize:'1rem'}} onClick={processPayment} disabled={payLoading}>
              {payLoading ? '⏳ Traitement...' : payMode === 'carte' ? `💳 Payer ${formatPrice(payModal.tarif)}` : '💵 Confirmer le paiement espèces'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
