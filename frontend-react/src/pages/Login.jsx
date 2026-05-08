import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/logo-icon.svg';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    if (!email || !password) {
      setError('Remplissez tous les champs');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/auth/login', { 
        method: 'POST', 
        body: JSON.stringify({ email, password }) 
      });

      // Le backend retourne { success, data: { token, user } }
      const token = res.data ? res.data.token : res.token;
      const user = res.data ? res.data.user : res.user;

      if (!user || !token) {
        setError('❌ Réponse invalide du serveur');
        return;
      }

      login(token, user);
      
      // Redirect based on role
      if (user.role === 'agence') navigate('/admin');
      else if (user.role === 'chauffeur') navigate('/chauffeur');
      else navigate('/dashboard');
      
    } catch(e) {
      setError(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh'}}>
      <div style={{width:'100%', maxWidth:'420px', padding:'20px'}}>
        <div className="card" style={{padding:'40px 36px', borderRadius:'20px'}}>
          <div style={{textAlign:'center', marginBottom:'28px'}}>
            <img src={logo} alt="LAAZIRI TRAVEL Logo" style={{ height: '80px', width: '80px', objectFit: 'contain', marginBottom: '8px' }} />
            <div style={{fontSize:'1.1rem', fontWeight:800, color:'var(--primary)'}}>LAAZIRI TRAVEL</div>
          </div>
          <div style={{textAlign:'center', fontSize:'1.3rem', fontWeight:700, marginBottom:'6px'}}>Bon retour !</div>
          <div style={{textAlign:'center', color:'var(--muted)', fontSize:'.88rem', marginBottom:'28px'}}>Connectez-vous à votre compte</div>
          
          {error && <div className="alert alert-danger mb-3">{error}</div>}
          
          <div className="form-group mb-3">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="votre@email.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
            />
          </div>
          <div className="form-group mb-4">
            <label className="form-label">Mot de passe</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
            />
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{width:'100%', justifyContent:'center', fontSize:'1rem', height:'48px'}} 
            onClick={doLogin}
            disabled={loading}
          >
            {loading ? '⏳ Connexion...' : 'Se connecter'}
          </button>

          <div style={{display:'flex', alignItems:'center', gap:'12px', margin:'20px 0', color:'var(--muted)', fontSize:'.8rem'}}>
            <div style={{flex:1, height:'1px', background:'var(--border)'}}></div>
            ou
            <div style={{flex:1, height:'1px', background:'var(--border)'}}></div>
          </div>
          
          <p style={{textAlign:'center', fontSize:'.88rem', color:'var(--muted)'}}>
            Pas encore de compte ? <Link to="/register" style={{color:'var(--primary)', fontWeight:600}}>S'inscrire</Link>
          </p>
          
          <p style={{textAlign:'center', marginTop:'20px', fontSize:'.85rem'}}>
            <Link to="/" style={{color:'var(--muted)'}}>← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
