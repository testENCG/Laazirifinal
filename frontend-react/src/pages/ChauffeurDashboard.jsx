import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch, serviceIcon, formatDate, STATUT_MAP } from '../services/api';

function badgeHTML(statut) {
  const s = STATUT_MAP[statut] || { label: statut, cls: 'badge-muted' };
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}

export default function ChauffeurDashboard() {
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('courses');

  const [profil, setProfil] = useState(null);
  const [courses, setCourses] = useState([]);
  const [filterStatut, setFilterStatut] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const p = await apiFetch('/chauffeur/profil');
      setProfil(p);
    } catch (e) { console.error(e); }
    loadCourses('');
  };

  const loadCourses = async (statut = '') => {
    setFilterStatut(statut);
    setLoading(true);
    try {
      const data = await apiFetch('/chauffeur/courses');
      setCourses(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const updateStatut = async (id, statut) => {
    const labels = { en_cours: 'Démarrer', terminee: 'Terminer' };
    if (!window.confirm(`Confirmer: ${labels[statut] || statut} la course?`)) return;
    try {
      await apiFetch(`/courses/${id}/statut`, { method: 'PUT', body: JSON.stringify({ statut }) });
      alert(statut === 'en_cours' ? '▶️ Course démarrée!' : '✅ Course terminée!');
      loadCourses(filterStatut);
    } catch (e) { alert(`Erreur: ${e.message}`); }
  };

  const callClient = (tel) => {
    if (tel) window.open('tel:' + tel);
  };

  const filteredCourses = filterStatut ? courses.filter(r => r.statut === filterStatut) : courses;
  const enCoursCount = courses.filter(r => r.statut === 'en_cours').length;
  const termineeCount = courses.filter(r => r.statut === 'terminee').length;

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
          <div style={{width:'48px', height:'48px', borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', marginBottom:'8px'}}>🚗</div>
          <div className="font-bold">{profil ? profil.nom_complet : user?.prenom}</div>
          <div className="text-xs text-muted mt-1">{profil ? `${profil.vehicule_marque} — ${profil.plaque}` : ''}</div>
        </div>
        <button className={`sidebar-item ${activeSection==='courses'?'active':''}`} onClick={() => switchSection('courses')}><span className="sidebar-icon">📋</span> Mes Courses</button>
        <button className={`sidebar-item ${activeSection==='profil'?'active':''}`} onClick={() => switchSection('profil')}><span className="sidebar-icon">👤</span> Mon Profil</button>
      </aside>

      <main className="dash-content">
        
        {activeSection === 'courses' && (
          <div>
            <div className="dash-header"><h2>📋 Mes Courses</h2><p>Consultez et gérez vos courses assignées</p></div>
            <div className="grid-4 mb-4">
              <div className="card p-3 text-center"><div className="stat-value">{courses.length}</div><div className="stat-label">Total courses</div></div>
              <div className="card p-3 text-center"><div className="stat-value" style={{color:'var(--warning)'}}>{enCoursCount}</div><div className="stat-label">En cours</div></div>
              <div className="card p-3 text-center"><div className="stat-value" style={{color:'var(--success)'}}>{termineeCount}</div><div className="stat-label">Terminées</div></div>
              <div className="card p-3 text-center"><div className="stat-value">⭐ {profil?.note_moyenne || 5}</div><div className="stat-label">Ma note</div></div>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button className={`btn btn-ghost btn-sm ${filterStatut===''?'active':''}`} onClick={()=>loadCourses('')}>Toutes</button>
              <button className={`btn btn-ghost btn-sm ${filterStatut==='confirmee'?'active':''}`} onClick={()=>loadCourses('confirmee')}>✅ Assignées</button>
              <button className={`btn btn-ghost btn-sm ${filterStatut==='en_cours'?'active':''}`} onClick={()=>loadCourses('en_cours')}>🔄 En cours</button>
              <button className={`btn btn-ghost btn-sm ${filterStatut==='terminee'?'active':''}`} onClick={()=>loadCourses('terminee')}>🏁 Terminées</button>
            </div>

            {loading ? <div className="spinner"></div> : filteredCourses.length === 0 ? (
              <div className="alert alert-warning">Aucune course trouvée.</div>
            ) : (
              <div>
                {filteredCourses.map(r => (
                  <div key={r.id} className="card p-4 mb-3 fade-in">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="font-bold text-primary">{r.reference}</span>
                        <span className="text-muted text-sm ml-2">{serviceIcon(r.type_service)}</span>
                      </div>
                      <span dangerouslySetInnerHTML={{__html: badgeHTML(r.statut)}} />
                    </div>
                    <div className="grid-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-muted">Client</div>
                        <div className="font-bold mt-1">{r.client ? `${r.client.prenom} ${r.client.nom}` : '—'}</div>
                        <div className="text-sm text-muted">{r.client?.telephone || ''}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted">Date & Heure</div>
                        <div className="font-bold mt-1">{formatDate(r.date_depart)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted">Départ</div>
                        <div className="mt-1">📍 {r.depart}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted">Destination</div>
                        <div className="mt-1">🏁 {r.destination}</div>
                      </div>
                    </div>
                    {r.notes && <div className="text-sm text-muted mb-3">📝 {r.notes}</div>}
                    <div className="flex gap-2 mt-2">
                      {r.statut === 'confirmee' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={()=>updateStatut(r.id, 'en_cours')}>▶️ Démarrer la course</button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>callClient(r.client?.telephone)}>📞 Appeler le client</button>
                        </>
                      )}
                      {r.statut === 'en_cours' && (
                        <>
                          <button className="btn btn-accent btn-sm" onClick={()=>updateStatut(r.id, 'terminee')}>✅ Terminer la course</button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>callClient(r.client?.telephone)}>📞 Appeler le client</button>
                        </>
                      )}
                      {r.statut === 'terminee' && <span className="badge badge-success">🏁 Course terminée</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'profil' && profil && (
          <div>
            <div className="dash-header"><h2>👤 Mon Profil</h2></div>
            <div className="card p-4" style={{maxWidth:'500px'}}>
              <div className="grid-2 gap-4 mb-4">
                <div><div className="text-xs text-muted">Nom complet</div><div className="font-bold mt-1">{profil.nom_complet}</div></div>
                <div><div className="text-xs text-muted">Téléphone</div><div className="font-bold mt-1">{profil.telephone}</div></div>
                <div><div className="text-xs text-muted">Véhicule</div><div className="font-bold mt-1">🚗 {profil.vehicule_marque}</div></div>
                <div><div className="text-xs text-muted">Type</div><div className="font-bold mt-1">{profil.vehicule_type}</div></div>
                <div><div className="text-xs text-muted">Plaque</div><div className="font-bold mt-1">{profil.plaque}</div></div>
                <div><div className="text-xs text-muted">Statut</div><div className="mt-1" dangerouslySetInnerHTML={{__html: badgeHTML(profil.statut==='ouverte'?'en_attente':profil.statut==='disponible'?'confirmee':profil.statut==='en_course'?'en_cours':'annulee')}} /></div>
              </div>
              <div className="flex gap-4 p-3" style={{background:'rgba(0,168,232,0.08)', borderRadius:'10px'}}>
                <div className="text-center" style={{flex:1}}><div className="stat-value">⭐ {profil.note_moyenne}</div><div className="stat-label">Note</div></div>
                <div className="text-center" style={{flex:1}}><div className="stat-value">{profil.total_courses}</div><div className="stat-label">Courses totales</div></div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
