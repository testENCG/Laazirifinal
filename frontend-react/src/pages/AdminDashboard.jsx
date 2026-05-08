import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch, serviceIcon, formatDate, formatPrice, STATUT_MAP, PAIEMENT_STATUT_MAP, PAIEMENT_MODE_MAP } from '../services/api';

function badgeHTML(statut) {
  const s = STATUT_MAP[statut] || { label: statut, cls: 'badge-muted' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function payBadge(r) {
  const ps = PAIEMENT_STATUT_MAP[r.statut_paiement] || PAIEMENT_STATUT_MAP.non_paye;
  const pm = PAIEMENT_MODE_MAP[r.mode_paiement] || PAIEMENT_MODE_MAP.non_defini;
  return (
    <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
      <span className={`badge ${ps.cls}`} style={{display:'inline-flex', alignItems:'center', gap:'4px'}}>
        {r.statut_paiement === 'paye' ? '✅' : r.statut_paiement === 'rembourse' ? '↩️' : '⏳'} {ps.label}
      </span>
      {r.statut_paiement === 'paye' && (
        <span className="text-xs text-muted" style={{display:'flex', alignItems:'center', gap:'3px'}}>
          {r.mode_paiement === 'carte' ? '💳' : '💵'} {pm.label}
          {r.carte_derniers_chiffres && <span> ••{r.carte_derniers_chiffres}</span>}
        </span>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('overview');

  // Data states
  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [affecterModal, setAffecterModal] = useState(null); // reservation object
  const [selectedChauffeur, setSelectedChauffeur] = useState('');
  const [detailModal, setDetailModal] = useState(null); // reservation object
  const [tarifModal, setTarifModal] = useState(null); // tarif object
  const [addChauffeurModal, setAddChauffeurModal] = useState(false);
  const [newChauffeur, setNewChauffeur] = useState({ nom_complet: '', telephone: '', vehicule_marque: '', vehicule_type: '', plaque: '' });
  
  const [resStatusFilter, setResStatusFilter] = useState('');
  const [tarifTypeFilter, setTarifTypeFilter] = useState('');

  useEffect(() => {
    if (activeSection === 'overview') loadOverview();
    else if (activeSection === 'reservations') loadReservations(resStatusFilter);
    else if (activeSection === 'chauffeurs') loadChauffeurs();
    else if (activeSection === 'tarifs') loadTarifs(tarifTypeFilter);
    else if (activeSection === 'reclamations') loadReclamations();
    else if (activeSection === 'stats') loadOverview();
  }, [activeSection, resStatusFilter, tarifTypeFilter]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const [st, res, ch] = await Promise.all([
        apiFetch('/stats'), apiFetch('/reservations'), apiFetch('/chauffeurs')
      ]);
      setStats(st);
      setReservations(res);
      setChauffeurs(ch);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadReservations = async (statut = '') => {
    setLoading(true);
    try {
      const res = await apiFetch(`/reservations${statut ? '?statut='+statut : ''}`);
      setReservations(res);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadChauffeurs = async () => {
    setLoading(true);
    try {
      const ch = await apiFetch('/chauffeurs');
      setChauffeurs(ch);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadTarifs = async (type = '') => {
    setLoading(true);
    try {
      const t = await apiFetch(`/tarifs${type ? '?type='+type : ''}`);
      setTarifs(t);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadReclamations = async () => {
    setLoading(true);
    try {
      const recs = await apiFetch('/reclamations');
      setReclamations(recs);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const confirmerAffectation = async () => {
    if (!selectedChauffeur) return alert("Sélectionnez un chauffeur");
    try {
      await apiFetch(`/reservations/${affecterModal.id}/affecter`, {
        method: 'PUT',
        body: JSON.stringify({ chauffeur_id: parseInt(selectedChauffeur) })
      });
      alert('Chauffeur affecté!');
      setAffecterModal(null);
      loadReservations(resStatusFilter);
    } catch (e) { alert(e.message); }
  };

  const addChauffeur = async () => {
    try {
      await apiFetch('/chauffeurs', { method: 'POST', body: JSON.stringify(newChauffeur) });
      alert("Chauffeur ajouté");
      setAddChauffeurModal(false);
      setNewChauffeur({ nom_complet: '', telephone: '', vehicule_marque: '', vehicule_type: '', plaque: '' });
      loadChauffeurs();
    } catch (e) { alert(e.message); }
  };

  const saveTarif = async () => {
    try {
      await apiFetch(`/tarifs/${tarifModal.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          prix: parseFloat(tarifModal.prix),
          nom_fr: tarifModal.nom_fr,
          duree: tarifModal.duree,
          repas_inclus: tarifModal.repas_inclus,
          guide_inclus: tarifModal.guide_inclus
        })
      });
      alert("Tarif mis à jour");
      setTarifModal(null);
      loadTarifs(tarifTypeFilter);
    } catch (e) { alert(e.message); }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const switchSection = (s) => { setActiveSection(s); setSidebarOpen(false); };

  return (
    <div className="dash-layout">
      <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>
      {sidebarOpen && <div className="mobile-menu-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div style={{padding:'12px 16px 20px', borderBottom:'1px solid var(--border)', marginBottom:'12px'}}>
          <div style={{fontWeight:700}}>Administration</div>
          <div className="text-xs text-muted mt-1">LAAZIRI TRAVEL</div>
        </div>
        <button className={`sidebar-item ${activeSection==='overview'?'active':''}`} onClick={()=>switchSection('overview')}><span className="sidebar-icon">📊</span> Tableau de Bord</button>
        <button className={`sidebar-item ${activeSection==='reservations'?'active':''}`} onClick={()=>switchSection('reservations')}><span className="sidebar-icon">📋</span> Réservations</button>
        <button className={`sidebar-item ${activeSection==='chauffeurs'?'active':''}`} onClick={()=>switchSection('chauffeurs')}><span className="sidebar-icon">🚗</span> Chauffeurs</button>
        <button className={`sidebar-item ${activeSection==='tarifs'?'active':''}`} onClick={()=>switchSection('tarifs')}><span className="sidebar-icon">💰</span> Tarifs</button>
        <button className={`sidebar-item ${activeSection==='reclamations'?'active':''}`} onClick={()=>switchSection('reclamations')}><span className="sidebar-icon">📣</span> Réclamations</button>
        <button className={`sidebar-item ${activeSection==='stats'?'active':''}`} onClick={()=>switchSection('stats')}><span className="sidebar-icon">📈</span> Statistiques</button>
      </aside>

      <main className="dash-content">
        
        {activeSection === 'overview' && stats && (
          <div>
            <div className="dash-header"><h2>📊 Tableau de Bord</h2><p>Vue d'ensemble de l'activité</p></div>
            <div className="grid-4 mb-4">
              <div className="card p-3 text-center"><div className="stat-value">{stats.reservations.total}</div><div className="stat-label">Réservations Total</div></div>
              <div className="card p-3 text-center"><div className="stat-value" style={{color:'var(--warning)'}}>{stats.reservations.en_attente}</div><div className="stat-label">En Attente</div></div>
              <div className="card p-3 text-center"><div className="stat-value" style={{color:'var(--success)'}}>{formatPrice(stats.revenue_payee || 0)}</div><div className="stat-label">💰 Revenue Payée</div></div>
              <div className="card p-3 text-center"><div className="stat-value" style={{color:'var(--primary)'}}>{formatPrice(stats.revenue_en_attente || 0)}</div><div className="stat-label">⏳ Paiements en attente</div></div>
            </div>
            <div className="grid-4 mb-4">
              <div className="card p-3 text-center"><div className="stat-value" style={{color:'var(--success)'}}>{stats.chauffeurs.total}</div><div className="stat-label">🚗 Chauffeurs</div></div>
              <div className="card p-3 text-center"><div className="stat-value">{stats.clients}</div><div className="stat-label">👥 Clients</div></div>
              <div className="card p-3 text-center"><div className="stat-value">{stats.paiements?.carte || 0}</div><div className="stat-label">💳 Paiements Carte</div></div>
              <div className="card p-3 text-center"><div className="stat-value">{stats.paiements?.especes || 0}</div><div className="stat-label">💵 Paiements Espèces</div></div>
            </div>
            <div className="grid-2">
              <div>
                <h3 className="mb-3">🕐 Dernières réservations</h3>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Réf.</th><th>Client</th><th>Service</th><th>Paiement</th><th>Statut</th></tr></thead>
                    <tbody>
                      {reservations.slice(0,5).map(r => (
                        <tr key={r.id}>
                          <td className="text-primary font-bold">{r.reference}</td>
                          <td>{r.client?.prenom||''} {r.client?.nom||''}</td>
                          <td>{serviceIcon(r.type_service)}</td>
                          <td>{payBadge(r)}</td>
                          <td>{badgeHTML(r.statut)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3 className="mb-3">🚗 Disponibilité chauffeurs ({chauffeurs.filter(c=>c.statut==='disponible').length}/{chauffeurs.length})</h3>
                <div style={{maxHeight:'400px', overflowY:'auto'}}>
                  {chauffeurs.map(c=>(
                    <div key={c.id} className="card p-3 mb-2 flex items-center gap-3">
                      <div style={{width:'40px', height:'40px', borderRadius:'50%', background: c.statut==='disponible' ? 'var(--success)' : c.statut==='en_course' ? 'var(--warning)' : 'var(--danger)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.9rem', flexShrink:0}}>🚗</div>
                      <div style={{flex:1, minWidth:0}}>
                        <div className="font-bold text-sm">{c.nom_complet}</div>
                        <div className="text-xs text-muted">{c.vehicule_marque} — {c.plaque}</div>
                      </div>
                      <span className={`badge ${c.statut==='disponible' ? 'badge-success' : c.statut==='en_course' ? 'badge-warning' : 'badge-danger'}`} style={{flexShrink:0}}>
                        {c.statut==='disponible' ? '✅ Dispo' : c.statut==='en_course' ? '🚗 En course' : '⛔ Indispo'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'reservations' && (
          <div>
            <div className="dash-header"><h2>📋 Gestion des Réservations</h2><p>Confirmez, affectez et suivez les réservations</p></div>
            <div className="flex gap-2 mb-4">
              <button className={`btn btn-ghost btn-sm ${resStatusFilter===''?'active':''}`} onClick={()=>setResStatusFilter('')}>Toutes</button>
              <button className={`btn btn-ghost btn-sm ${resStatusFilter==='en_attente'?'active':''}`} onClick={()=>setResStatusFilter('en_attente')}>⏳ En attente</button>
              <button className={`btn btn-ghost btn-sm ${resStatusFilter==='confirmee'?'active':''}`} onClick={()=>setResStatusFilter('confirmee')}>✅ Confirmées</button>
              <button className={`btn btn-ghost btn-sm ${resStatusFilter==='annulee'?'active':''}`} onClick={()=>setResStatusFilter('annulee')}>❌ Annulées</button>
              <button className={`btn btn-ghost btn-sm ${resStatusFilter==='terminee'?'active':''}`} onClick={()=>setResStatusFilter('terminee')}>🏁 Terminées</button>
            </div>
            {loading ? <div className="spinner"></div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Réf.</th><th>Client</th><th>Service</th><th>Destination</th><th>Date</th><th>Tarif</th><th>Paiement</th><th>Statut</th><th>Chauffeur</th><th>Actions</th></tr></thead>
                  <tbody>
                    {reservations.map(r=>(
                      <tr key={r.id}>
                        <td className="text-primary font-bold">{r.reference}</td>
                        <td>{r.client?`${r.client.prenom} ${r.client.nom}`:'-'}</td>
                        <td>{serviceIcon(r.type_service)}</td>
                        <td>{r.destination}</td>
                        <td>{formatDate(r.date_depart)}</td>
                        <td>{formatPrice(r.tarif)}</td>
                        <td>{payBadge(r)}</td>
                        <td>{badgeHTML(r.statut)}</td>
                        <td>{r.chauffeur?r.chauffeur.nom_complet:<span className="text-muted">—</span>}</td>
                        <td className="flex gap-2">
                          <button className="btn btn-ghost btn-sm" onClick={()=>setDetailModal(r)}>👁️</button>
                          {r.statut==='en_attente' && <button className="btn btn-primary btn-sm" onClick={()=>setAffecterModal(r)}>🚗</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSection === 'chauffeurs' && (
          <div>
            <div className="dash-header flex justify-between items-center">
              <div><h2>🚗 Gestion des Chauffeurs</h2></div>
              <button className="btn btn-primary btn-sm" onClick={()=>setAddChauffeurModal(true)}>+ Ajouter</button>
            </div>
            {loading ? <div className="spinner"></div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Nom</th><th>Téléphone</th><th>Véhicule</th><th>Plaque</th><th>Statut</th><th>Note</th><th>Courses</th></tr></thead>
                  <tbody>
                    {chauffeurs.map(c=>(
                      <tr key={c.id}>
                        <td className="font-bold">{c.nom_complet}</td>
                        <td>{c.telephone}</td>
                        <td>{c.vehicule_marque} <span className="text-muted text-xs">({c.vehicule_type})</span></td>
                        <td>{c.plaque}</td>
                        <td>{badgeHTML(c.statut==='ouverte'?'en_attente':c.statut==='disponible'?'confirmee':c.statut==='en_course'?'en_cours':'annulee')}</td>
                        <td>⭐ {c.note_moyenne}</td>
                        <td>{c.total_courses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSection === 'tarifs' && (
          <div>
            <div className="dash-header"><h2>💰 Gestion des Tarifs</h2></div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {['','transfert','excursion','circuit','agafay','hammam','restaurant'].map(t=>(
                <button key={t} className={`btn btn-ghost btn-sm ${tarifTypeFilter===t?'active':''}`} onClick={()=>setTarifTypeFilter(t)}>{t||'Tous'}</button>
              ))}
            </div>
            {loading ? <div className="spinner"></div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Service</th><th>Nom</th><th>Départ</th><th>Destination</th><th>Pax</th><th>Prix</th><th>Repas</th><th>Guide</th><th>Action</th></tr></thead>
                  <tbody>
                    {tarifs.map(t=>(
                      <tr key={t.id}>
                        <td>{serviceIcon(t.type_service)}</td>
                        <td>{t.nom_fr}</td>
                        <td>{t.depart}</td>
                        <td>{t.destination}</td>
                        <td>{t.pax_min}–{t.pax_max}</td>
                        <td className="font-bold text-primary">{formatPrice(t.prix)}</td>
                        <td>{t.repas_inclus?'✅':'—'}</td>
                        <td>{t.guide_inclus?'✅':'—'}</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={()=>setTarifModal(t)}>✏️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSection === 'reclamations' && (
          <div>
            <div className="dash-header"><h2>📣 Réclamations Clients</h2></div>
            {loading ? <div className="spinner"></div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Client</th><th>Sujet</th><th>Message</th><th>Statut</th><th>Date</th></tr></thead>
                  <tbody>
                    {reclamations.map(r=>(
                      <tr key={r.id}>
                        <td>{r.client?.prenom} {r.client?.nom}</td>
                        <td className="font-bold">{r.sujet}</td>
                        <td className="text-sm text-muted">{(r.message||'').slice(0,80)}...</td>
                        <td>{badgeHTML(r.statut==='ouverte'?'en_attente':r.statut==='traitee'?'confirmee':'annulee')}</td>
                        <td>{formatDate(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSection === 'stats' && stats && (
          <div>
            <div className="dash-header"><h2>📈 Statistiques</h2></div>
            <div className="grid-4 mb-4">
              <div className="card p-3 text-center"><div className="stat-value">{stats.reservations.total}</div><div className="stat-label">Total Réservations</div></div>
              <div className="card p-3 text-center"><div className="stat-value" style={{color:'var(--success)'}}>{formatPrice(stats.revenue)}</div><div className="stat-label">Chiffre d'Affaires Total</div></div>
              <div className="card p-3 text-center"><div className="stat-value" style={{color:'var(--success)'}}>{formatPrice(stats.revenue_payee)}</div><div className="stat-label">💰 CA Encaissé</div></div>
              <div className="card p-3 text-center"><div className="stat-value" style={{color:'var(--warning)'}}>{formatPrice(stats.revenue_en_attente)}</div><div className="stat-label">⏳ En attente de paiement</div></div>
            </div>
            <div className="grid-4 mb-4">
              <div className="card p-3 text-center"><div className="stat-value">{stats.clients}</div><div className="stat-label">👥 Clients</div></div>
              <div className="card p-3 text-center"><div className="stat-value">{stats.chauffeurs.total}</div><div className="stat-label">🚗 Chauffeurs</div></div>
              <div className="card p-3 text-center"><div className="stat-value">{stats.paiements?.carte || 0}</div><div className="stat-label">💳 Paiements Carte</div></div>
              <div className="card p-3 text-center"><div className="stat-value">{stats.paiements?.especes || 0}</div><div className="stat-label">💵 Paiements Espèces</div></div>
            </div>
            <div className="grid-2">
              <div>
                <h3 className="mb-3">📊 Par statut</h3>
                <div className="card p-4">
                  {Object.entries(stats.reservations).filter(([k])=>k!=='total').map(([k,v])=>(
                    <div key={k}>
                      <div className="flex justify-between items-center mb-3">
                        <span>{badgeHTML(k)}</span><span className="font-bold">{v}</span>
                      </div>
                      <div style={{background:'var(--border)', borderRadius:'4px', height:'6px', marginBottom:'12px'}}>
                        <div style={{background:'var(--primary)', height:'6px', borderRadius:'4px', width:`${stats.reservations.total?Math.round((v/stats.reservations.total)*100):0}%`}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3">🌟 Par service</h3>
                <div className="card p-4">
                  {stats.by_service.map(s=>(
                    <div key={s.type} className="flex justify-between items-center mb-3" style={{flexWrap:'wrap', gap:'8px'}}>
                      <span>{serviceIcon(s.type)}</span>
                      <span className="text-sm">{s.count} réservation{s.count > 1 ? 's' : ''}</span>
                      <span className="font-bold text-primary">{formatPrice(s.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODALS */}
      
      {affecterModal && (
        <div className="modal-overlay open" onClick={(e)=>{if(e.target.className==='modal-overlay open') setAffecterModal(null)}}>
          <div className="modal">
            <div className="modal-header"><span className="modal-title">🚗 Affecter un chauffeur</span><button className="modal-close" onClick={()=>setAffecterModal(null)}>×</button></div>
            <div className="form-group mb-4">
              <label className="form-label">Sélectionner un chauffeur disponible</label>
              <select className="form-control" value={selectedChauffeur} onChange={e=>setSelectedChauffeur(e.target.value)}>
                <option value="">-- Choisir --</option>
                {chauffeurs.filter(c=>c.statut==='disponible').map(c=>(
                  <option key={c.id} value={c.id}>{c.nom_complet} — {c.vehicule_marque} ({c.plaque})</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} onClick={confirmerAffectation}>✅ Confirmer l'affectation</button>
          </div>
        </div>
      )}

      {detailModal && (
        <div className="modal-overlay open" onClick={(e)=>{if(e.target.className==='modal-overlay open') setDetailModal(null)}}>
          <div className="modal" style={{maxWidth:'600px'}}>
            <div className="modal-header"><span className="modal-title">📋 Détail réservation</span><button className="modal-close" onClick={()=>setDetailModal(null)}>×</button></div>
            <div className="grid-2 gap-3">
              <div><div className="text-xs text-muted">Référence</div><div className="font-bold text-primary mt-1">{detailModal.reference}</div></div>
              <div><div className="text-xs text-muted">Statut</div><div className="mt-1">{badgeHTML(detailModal.statut)}</div></div>
              <div><div className="text-xs text-muted">Client</div><div className="mt-1">{detailModal.client?.prenom} {detailModal.client?.nom}</div></div>
              <div><div className="text-xs text-muted">Téléphone</div><div className="mt-1">{detailModal.client?.telephone||'-'}</div></div>
              <div><div className="text-xs text-muted">Service</div><div className="mt-1">{serviceIcon(detailModal.type_service)} {detailModal.nom_service}</div></div>
              <div><div className="text-xs text-muted">Tarif</div><div className="font-bold text-primary mt-1">{formatPrice(detailModal.tarif)}</div></div>
              <div><div className="text-xs text-muted">Départ</div><div className="mt-1">{detailModal.depart}</div></div>
              <div><div className="text-xs text-muted">Destination</div><div className="mt-1">{detailModal.destination}</div></div>
              <div><div className="text-xs text-muted">Date</div><div className="mt-1">{formatDate(detailModal.date_depart)}</div></div>
              <div><div className="text-xs text-muted">Voyageurs</div><div className="mt-1">👥 {detailModal.nombre_pax}</div></div>
              {detailModal.chauffeur && <div style={{gridColumn:'1/-1'}}><div className="text-xs text-muted">Chauffeur</div><div className="mt-1 font-bold">🚗 {detailModal.chauffeur.nom_complet} — {detailModal.chauffeur.vehicule_marque} — {detailModal.chauffeur.plaque}</div></div>}
              {detailModal.notes && <div style={{gridColumn:'1/-1'}}><div className="text-xs text-muted">Notes</div><div className="mt-1 text-sm">{detailModal.notes}</div></div>}
            </div>
          </div>
        </div>
      )}

      {tarifModal && (
        <div className="modal-overlay open" onClick={(e)=>{if(e.target.className==='modal-overlay open') setTarifModal(null)}}>
          <div className="modal">
            <div className="modal-header"><span className="modal-title">💰 Modifier le tarif</span><button className="modal-close" onClick={()=>setTarifModal(null)}>×</button></div>
            <div className="form-group mb-3"><label className="form-label">Prix (MAD)</label><input type="number" className="form-control" value={tarifModal.prix} onChange={e=>setTarifModal({...tarifModal, prix: e.target.value})} /></div>
            <div className="form-group mb-3"><label className="form-label">Nom FR</label><input className="form-control" value={tarifModal.nom_fr} onChange={e=>setTarifModal({...tarifModal, nom_fr: e.target.value})} /></div>
            <div className="form-group mb-3"><label className="form-label">Durée</label><input className="form-control" value={tarifModal.duree || ''} onChange={e=>setTarifModal({...tarifModal, duree: e.target.value})} /></div>
            <div className="flex gap-3 mb-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={tarifModal.repas_inclus} onChange={e=>setTarifModal({...tarifModal, repas_inclus: e.target.checked})} /> Repas inclus</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={tarifModal.guide_inclus} onChange={e=>setTarifModal({...tarifModal, guide_inclus: e.target.checked})} /> Guide inclus</label>
            </div>
            <button className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} onClick={saveTarif}>💾 Enregistrer</button>
          </div>
        </div>
      )}

      {addChauffeurModal && (
        <div className="modal-overlay open" onClick={(e)=>{if(e.target.className==='modal-overlay open') setAddChauffeurModal(false)}}>
          <div className="modal">
            <div className="modal-header"><span className="modal-title">➕ Ajouter un chauffeur</span><button className="modal-close" onClick={()=>setAddChauffeurModal(false)}>×</button></div>
            <div className="form-group mb-3"><label className="form-label">Nom complet</label><input className="form-control" value={newChauffeur.nom_complet} onChange={e=>setNewChauffeur({...newChauffeur, nom_complet:e.target.value})} /></div>
            <div className="form-group mb-3"><label className="form-label">Téléphone</label><input className="form-control" value={newChauffeur.telephone} onChange={e=>setNewChauffeur({...newChauffeur, telephone:e.target.value})} /></div>
            <div className="form-group mb-3"><label className="form-label">Marque véhicule</label><input className="form-control" placeholder="Mercedes, Audi..." value={newChauffeur.vehicule_marque} onChange={e=>setNewChauffeur({...newChauffeur, vehicule_marque:e.target.value})} /></div>
            <div className="form-group mb-3"><label className="form-label">Type véhicule</label><input className="form-control" placeholder="Executive, SUV..." value={newChauffeur.vehicule_type} onChange={e=>setNewChauffeur({...newChauffeur, vehicule_type:e.target.value})} /></div>
            <div className="form-group mb-4"><label className="form-label">Plaque</label><input className="form-control" placeholder="12345-A-26" value={newChauffeur.plaque} onChange={e=>setNewChauffeur({...newChauffeur, plaque:e.target.value})} /></div>
            <button className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} onClick={addChauffeur}>Ajouter</button>
          </div>
        </div>
      )}

    </div>
  );
}
