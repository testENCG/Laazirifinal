import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/logo-icon.svg';

export default function Register() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    tel: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const doRegister = async () => {
    const { prenom, nom, email, tel, password } = formData;
    
    if (!prenom.trim() || !nom.trim() || !email.trim() || !password) {
      setError('Remplissez tous les champs obligatoires');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await apiFetch('/auth/register', { 
        method: 'POST', 
        body: JSON.stringify({ 
          prenom: prenom.trim(), 
          nom: nom.trim(), 
          email: email.trim(), 
          telephone: tel.trim(), 
          password, 
          role: 'client' 
        }) 
      });
      const token = data.data ? data.data.token : data.token;
      const user = data.data ? data.data.user : data.user;
      login(token, user);
      navigate('/dashboard');
    } catch(e) {
      setError(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh', padding:'20px 0'}}>
      <div style={{width:'100%', maxWidth:'460px', padding:'20px'}}>
        <div className="card" style={{padding:'40px 36px', borderRadius:'20px'}}>
          <div style={{textAlign:'center', marginBottom:'28px'}}>
            <img src={logo} alt="LAAZIRI TRAVEL Logo" style={{ height: '80px', width: '80px', objectFit: 'contain', marginBottom: '8px' }} />
            <div style={{fontSize:'1.1rem', fontWeight:800, color:'var(--primary)'}}>LAAZIRI TRAVEL</div>
          </div>
          <div style={{textAlign:'center', fontSize:'1.3rem', fontWeight:700, marginBottom:'6px'}}>Créer un compte</div>
          <div style={{textAlign:'center', color:'var(--muted)', fontSize:'.88rem', marginBottom:'28px'}}>Rejoignez-nous et réservez vos aventures</div>
          
          {error && <div className="alert alert-danger mb-3">{error}</div>}
          
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}} className="mb-3">
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input className="form-control" name="prenom" placeholder="Votre prénom" value={formData.prenom} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input className="form-control" name="nom" placeholder="Votre nom" value={formData.nom} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" name="email" placeholder="votre@email.com" value={formData.email} onChange={handleChange} />
          </div>
          <div className="form-group mb-3">
            <label className="form-label">Téléphone</label>
            <input type="tel" className="form-control" name="tel" placeholder="+212 6XX XXX XXX" value={formData.tel} onChange={handleChange} />
          </div>
          <div className="form-group mb-4">
            <label className="form-label">Mot de passe</label>
            <input type="password" className="form-control" name="password" placeholder="Minimum 6 caractères" value={formData.password} onChange={handleChange} />
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{width:'100%', justifyContent:'center', fontSize:'1rem', height:'48px'}} 
            onClick={doRegister}
            disabled={loading}
          >
            {loading ? '⏳ Création...' : 'Créer mon compte'}
          </button>
          
          <p style={{textAlign:'center', marginTop:'20px', fontSize:'.88rem', color:'var(--muted)'}}>
            Déjà inscrit ? <Link to="/login" style={{color:'var(--primary)', fontWeight:600}}>Se connecter</Link>
          </p>
          <p style={{textAlign:'center', marginTop:'10px', fontSize:'.85rem'}}>
            <Link to="/" style={{color:'var(--muted)'}}>← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
