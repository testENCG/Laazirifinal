from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Now your import should work
from config import config
app = Flask(__name__)

# This is the "Placeholder". 
# It tells the app: "When you are running, look for a secret called 'DATABASE_URL'."
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')

db = SQLAlchemy(app)
import os, random, string, logging
from functools import wraps

# Import configuration and utilities
from .config import config
from validators import (
    Validator, ValidationError, validate_register_data, 
    validate_login_data, validate_reservation_data
)
from email_service import send_welcome_email, send_reservation_confirmation, send_payment_confirmation
from logger import setup_logging, get_logger

# Initialize Flask app
basedir = os.path.abspath(os.path.dirname(__file__))
FRONTEND = os.path.realpath(os.path.join(basedir, '..', 'frontend-react', 'dist'))
app = Flask(__name__, static_folder=None)

# Load configuration from environment or use default
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config.get(env, config['default']))

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})

# Setup logging
logger = setup_logging(app)
logger = get_logger(__name__)


# ===================== MODELS =====================

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    telephone = db.Column(db.String(20))
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), default='client')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reservations = db.relationship('Reservation', back_populates='client', foreign_keys='Reservation.client_id')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {'id': self.id, 'nom': self.nom, 'prenom': self.prenom,
                'email': self.email, 'telephone': self.telephone,
                'role': self.role, 'created_at': self.created_at.isoformat()}


class Chauffeur(db.Model):
    __tablename__ = 'chauffeurs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    nom_complet = db.Column(db.String(200), nullable=False)
    telephone = db.Column(db.String(20))
    vehicule_type = db.Column(db.String(100))
    vehicule_marque = db.Column(db.String(100))
    plaque = db.Column(db.String(20))
    statut = db.Column(db.String(20), default='disponible')
    note_moyenne = db.Column(db.Float, default=5.0)
    total_courses = db.Column(db.Integer, default=0)
    user = db.relationship('User', backref='chauffeur_profile')
    courses = db.relationship('Reservation', back_populates='chauffeur')

    def to_dict(self):
        return {'id': self.id, 'nom_complet': self.nom_complet,
                'telephone': self.telephone, 'vehicule_type': self.vehicule_type,
                'vehicule_marque': self.vehicule_marque, 'plaque': self.plaque,
                'statut': self.statut, 'note_moyenne': self.note_moyenne,
                'total_courses': self.total_courses}


class Reservation(db.Model):
    __tablename__ = 'reservations'
    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(20), unique=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    chauffeur_id = db.Column(db.Integer, db.ForeignKey('chauffeurs.id'), nullable=True)
    type_service = db.Column(db.String(50))
    nom_service = db.Column(db.String(200))
    depart = db.Column(db.String(200))
    destination = db.Column(db.String(200))
    date_depart = db.Column(db.DateTime)
    nombre_pax = db.Column(db.Integer, default=1)
    tarif = db.Column(db.Float)
    statut = db.Column(db.String(30), default='en_attente')
    notes = db.Column(db.Text)
    repas_inclus = db.Column(db.Boolean, default=False)
    guide_inclus = db.Column(db.Boolean, default=False)
    activites = db.Column(db.String(200))
    # Payment fields
    mode_paiement = db.Column(db.String(30), default='non_defini')  # non_defini, especes, carte
    statut_paiement = db.Column(db.String(30), default='non_paye')  # non_paye, paye, rembourse
    moment_paiement = db.Column(db.String(30), default='apres_course')  # a_la_reservation, apres_course
    paiement_date = db.Column(db.DateTime, nullable=True)
    carte_derniers_chiffres = db.Column(db.String(4), nullable=True)
    transaction_id = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    client = db.relationship('User', back_populates='reservations', foreign_keys=[client_id])
    chauffeur = db.relationship('Chauffeur', back_populates='courses')

    def to_dict(self):
        return {'id': self.id, 'reference': self.reference,
                'type_service': self.type_service, 'nom_service': self.nom_service,
                'depart': self.depart, 'destination': self.destination,
                'date_depart': self.date_depart.isoformat() if self.date_depart else None,
                'nombre_pax': self.nombre_pax, 'tarif': self.tarif, 'statut': self.statut,
                'notes': self.notes, 'repas_inclus': self.repas_inclus,
                'guide_inclus': self.guide_inclus, 'activites': self.activites,
                'mode_paiement': self.mode_paiement,
                'statut_paiement': self.statut_paiement,
                'moment_paiement': self.moment_paiement,
                'paiement_date': self.paiement_date.isoformat() if self.paiement_date else None,
                'carte_derniers_chiffres': self.carte_derniers_chiffres,
                'transaction_id': self.transaction_id,
                'created_at': self.created_at.isoformat(),
                'client': self.client.to_dict() if self.client else None,
                'chauffeur': self.chauffeur.to_dict() if self.chauffeur else None}


class Tarif(db.Model):
    __tablename__ = 'tarifs'
    id = db.Column(db.Integer, primary_key=True)
    type_service = db.Column(db.String(50))
    nom_fr = db.Column(db.String(200))
    nom_en = db.Column(db.String(200))
    depart = db.Column(db.String(100))
    destination = db.Column(db.String(100))
    pax_min = db.Column(db.Integer, default=1)
    pax_max = db.Column(db.Integer, default=7)
    prix = db.Column(db.Float)
    repas_inclus = db.Column(db.Boolean, default=False)
    guide_inclus = db.Column(db.Boolean, default=False)
    activites = db.Column(db.String(200))
    duree = db.Column(db.String(50))
    actif = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {'id': self.id, 'type_service': self.type_service,
                'nom_fr': self.nom_fr, 'nom_en': self.nom_en,
                'depart': self.depart, 'destination': self.destination,
                'pax_min': self.pax_min, 'pax_max': self.pax_max, 'prix': self.prix,
                'repas_inclus': self.repas_inclus, 'guide_inclus': self.guide_inclus,
                'activites': self.activites, 'duree': self.duree}


class Avis(db.Model):
    __tablename__ = 'avis'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reservation_id = db.Column(db.Integer, db.ForeignKey('reservations.id'), nullable=True)
    note = db.Column(db.Integer)
    commentaire = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    client = db.relationship('User')

    def to_dict(self):
        return {'id': self.id, 'note': self.note, 'commentaire': self.commentaire,
                'created_at': self.created_at.isoformat(),
                'client': self.client.to_dict() if self.client else None}


class Reclamation(db.Model):
    __tablename__ = 'reclamations'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sujet = db.Column(db.String(200))
    message = db.Column(db.Text)
    statut = db.Column(db.String(20), default='ouverte')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    client = db.relationship('User')

    def to_dict(self):
        return {'id': self.id, 'sujet': self.sujet, 'message': self.message,
                'statut': self.statut, 'created_at': self.created_at.isoformat(),
                'client': self.client.to_dict() if self.client else None}


# ===================== ERROR HANDLERS & HELPERS =====================

def generate_reference():
    """Generate unique reservation reference."""
    return 'LZ' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


def error_response(message, status_code=400):
    """Return standardized error response."""
    logger.warning(f"Error response: {message} (Status: {status_code})")
    return jsonify({'success': False, 'error': message}), status_code


def success_response(data=None, message=None, status_code=200):
    """Return standardized success response."""
    response = {'success': True}
    if data is not None:
        response['data'] = data
    if message:
        response['message'] = message
    return jsonify(response), status_code


@app.errorhandler(400)
def bad_request(error):
    """Handle bad requests."""
    logger.error(f"Bad request: {error}")
    return error_response('Requête invalide', 400)


@app.errorhandler(404)
def not_found(error):
    """Handle not found errors."""
    return error_response('Ressource non trouvée', 404)


@app.errorhandler(500)
def internal_error(error):
    """Handle server errors."""
    logger.error(f"Internal server error: {error}")
    db.session.rollback()
    return error_response('Erreur serveur interne', 500)



# ===================== ROUTES =====================

MIME = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.svg':'image/svg+xml','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'}

def serve_file(rel_path):
    full = os.path.join(FRONTEND, rel_path.lstrip('/'))
    if not os.path.isfile(full):
        logger.warning(f"File not found: {full}")
        return make_response('Not Found', 404)
    ext = os.path.splitext(full)[1]
    with open(full, 'rb') as f:
        content = f.read()
    resp = make_response(content)
    resp.headers['Content-Type'] = MIME.get(ext, 'application/octet-stream')
    return resp

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    if path.startswith('api/'):
        return make_response('Not Found', 404)
    
    full_path = os.path.join(FRONTEND, path)
    if path and os.path.isfile(full_path):
        return serve_file(path)
    
    # Serve index.html for SPA routing
    index_path = os.path.join(FRONTEND, 'index.html')
    if not os.path.isfile(index_path):
        return make_response(
            f'<h2>Frontend non trouvé</h2>'
            f'<p>Le dossier frontend cherché: <code>{FRONTEND}</code></p>'
            f'<p>Existe: <code>{os.path.exists(FRONTEND)}</code></p>'
            f'<p>Veuillez d\'abord builder le frontend React avec: <code>cd frontend-react && npm install && npm run build</code></p>'
            f'<p>Ou accédez directement à l\'API: <a href="/api/tarifs">/api/tarifs</a></p>',
            404, {'Content-Type': 'text/html; charset=utf-8'}
        )
    return serve_file('index.html')

# AUTH
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user with validation."""
    try:
        data = request.get_json() or {}
        
        # Validate input data
        is_valid, error_msg = validate_register_data(data)
        if not is_valid:
            return error_response(error_msg, 400)
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            logger.warning(f"Registration attempt with existing email: {data['email']}")
            return error_response('Cet email est déjà utilisé', 400)
        
        # Create new user
        user = User(
            nom=data['nom'],
            prenom=data['prenom'],
            email=data['email'],
            telephone=data.get('telephone', ''),
            role=data.get('role', 'client')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        token = create_access_token(identity=str(user.id))
        logger.info(f"New user registered: {user.email} ({user.role})")
        
        # Send welcome email (async-like: don't block if it fails)
        try:
            send_welcome_email(user)
        except Exception as e:
            logger.error(f"Welcome email error: {e}")
        
        return success_response({
            'token': token,
            'user': user.to_dict()
        }, 'Inscription réussie', 201)
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return error_response('Erreur lors de l\'inscription', 500)


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user with validation."""
    try:
        data = request.get_json() or {}
        
        # Validate input
        is_valid, error_msg = validate_login_data(data)
        if not is_valid:
            return error_response(error_msg, 400)
        
        user = User.query.filter_by(email=data['email']).first()
        if not user or not user.check_password(data['password']):
            logger.warning(f"Failed login attempt: {data['email']}")
            return error_response('Email ou mot de passe incorrect', 401)
        
        token = create_access_token(identity=str(user.id))
        logger.info(f"User logged in: {user.email}")
        
        return success_response({
            'token': token,
            'user': user.to_dict()
        }, 'Connexion réussie', 200)
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return error_response('Erreur lors de la connexion', 500)


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    """Get current user profile."""
    try:
        user = User.query.get(int(get_jwt_identity()))
        if not user:
            return error_response('Utilisateur non trouvé', 404)
        return success_response(user.to_dict())
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        return error_response('Erreur lors de la récupération du profil', 500)

@app.route('/api/auth/update', methods=['PUT'])
@jwt_required()
def update_profile():
    user = User.query.get(int(get_jwt_identity()))
    data = request.get_json()
    for f in ['nom', 'prenom', 'telephone']:
        if f in data:
            setattr(user, f, data[f])
    if 'password' in data and data['password']:
        user.set_password(data['password'])
    db.session.commit()
    return jsonify(user.to_dict())

# TARIFS
@app.route('/api/tarifs', methods=['GET'])
def get_tarifs():
    type_service = request.args.get('type')
    pax = request.args.get('pax', type=int)
    depart = request.args.get('depart')
    destination = request.args.get('destination')
    query = Tarif.query.filter_by(actif=True)
    if type_service:
        query = query.filter_by(type_service=type_service)
    if pax:
        query = query.filter(Tarif.pax_min <= pax, Tarif.pax_max >= pax)
    if depart:
        query = query.filter(Tarif.depart.ilike(f'%{depart}%'))
    if destination:
        query = query.filter(Tarif.destination.ilike(f'%{destination}%'))
    return jsonify([t.to_dict() for t in query.all()])

@app.route('/api/tarifs/<int:tid>', methods=['PUT'])
@jwt_required()
def update_tarif(tid):
    user = User.query.get(int(get_jwt_identity()))
    if user.role != 'agence':
        return jsonify({'error': 'Non autorisé'}), 403
    tarif = Tarif.query.get_or_404(tid)
    data = request.get_json()
    for k, v in data.items():
        if hasattr(tarif, k):
            setattr(tarif, k, v)
    db.session.commit()
    return jsonify(tarif.to_dict())

@app.route('/api/tarifs', methods=['POST'])
@jwt_required()
def create_tarif():
    user = User.query.get(int(get_jwt_identity()))
    if user.role != 'agence':
        return jsonify({'error': 'Non autorisé'}), 403
    data = request.get_json()
    tarif = Tarif(**data)
    db.session.add(tarif)
    db.session.commit()
    return jsonify(tarif.to_dict()), 201

# RESERVATIONS
@app.route('/api/reservations', methods=['GET'])
@jwt_required()
def get_reservations():
    user = User.query.get(int(get_jwt_identity()))
    if user.role == 'client':
        res = Reservation.query.filter_by(client_id=user.id).order_by(Reservation.created_at.desc()).all()
    elif user.role == 'agence':
        statut = request.args.get('statut')
        q = Reservation.query
        if statut:
            q = q.filter_by(statut=statut)
        res = q.order_by(Reservation.created_at.desc()).all()
    elif user.role == 'chauffeur':
        ch = Chauffeur.query.filter_by(user_id=user.id).first()
        res = Reservation.query.filter_by(chauffeur_id=ch.id).order_by(Reservation.date_depart.desc()).all() if ch else []
    else:
        res = []
    return jsonify([r.to_dict() for r in res])

@app.route('/api/reservations', methods=['POST'])
@jwt_required()
def create_reservation():
    """Create a new reservation with validation."""
    try:
        user = User.query.get(int(get_jwt_identity()))
        if not user:
            return error_response('Utilisateur non trouvé', 404)
        
        data = request.get_json() or {}
        
        # Validate reservation data
        is_valid, error_msg = validate_reservation_data(data)
        if not is_valid:
            return error_response(error_msg, 400)
        
        # Parse date safely
        try:
            date_depart = datetime.fromisoformat(data['date_depart'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return error_response('Format de date invalide', 400)
        
        ref = generate_reference()
        
        mode_paiement = data.get('mode_paiement', 'non_defini')
        moment_paiement = data.get('moment_paiement', 'apres_course')
        
        r = Reservation(
            reference=ref,
            client_id=user.id,
            type_service=data['type_service'],
            nom_service=data.get('nom_service', ''),
            depart=data['depart'],
            destination=data['destination'],
            date_depart=date_depart,
            nombre_pax=data.get('nombre_pax', 1),
            tarif=data.get('tarif', 0),
            notes=data.get('notes', ''),
            repas_inclus=data.get('repas_inclus', False),
            guide_inclus=data.get('guide_inclus', False),
            activites=data.get('activites', ''),
            mode_paiement=mode_paiement,
            moment_paiement=moment_paiement,
            statut_paiement='non_paye'
        )
        
        # If paying by card at reservation time, simulate payment
        if mode_paiement == 'carte' and moment_paiement == 'a_la_reservation':
            carte_num = data.get('carte_numero', '')
            if len(carte_num) >= 4:
                r.carte_derniers_chiffres = carte_num[-4:]
            r.statut_paiement = 'paye'
            r.paiement_date = datetime.utcnow()
            r.transaction_id = 'TXN-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        
        db.session.add(r)
        db.session.commit()
        
        # Send reservation confirmation email
        try:
            send_reservation_confirmation(r, user)
        except Exception as e:
            logger.error(f"Reservation email error: {e}")
        
        logger.info(f"Reservation created: {ref} by user {user.email}")
        return success_response(r.to_dict(), 'Réservation créée avec succès', 201)
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating reservation: {str(e)}")
        return error_response('Erreur lors de la création de la réservation', 500)

@app.route('/api/reservations/<int:rid>', methods=['GET'])
@jwt_required()
def get_reservation(rid):
    return jsonify(Reservation.query.get_or_404(rid).to_dict())

@app.route('/api/reservations/<int:rid>', methods=['PUT'])
@jwt_required()
def update_reservation(rid):
    user = User.query.get(int(get_jwt_identity()))
    r = Reservation.query.get_or_404(rid)
    data = request.get_json()
    if user.role == 'client':
        if r.client_id != user.id:
            return jsonify({'error': 'Non autorisé'}), 403
        for f in ['nombre_pax', 'notes']:
            if f in data:
                setattr(r, f, data[f])
        if 'date_depart' in data:
            try:
                r.date_depart = datetime.fromisoformat(data['date_depart'].replace('Z', '+00:00'))
            except:
                r.date_depart = datetime.strptime(data['date_depart'][:16], '%Y-%m-%dT%H:%M')
    elif user.role == 'agence':
        for k, v in data.items():
            if hasattr(r, k) and k not in ['id', 'client_id', 'created_at']:
                if k == 'date_depart' and v:
                    try:
                        setattr(r, k, datetime.fromisoformat(v.replace('Z', '+00:00')))
                    except:
                        setattr(r, k, datetime.strptime(v[:16], '%Y-%m-%dT%H:%M'))
                else:
                    setattr(r, k, v)
    r.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(r.to_dict())

@app.route('/api/reservations/<int:rid>/annuler', methods=['PUT'])
@jwt_required()
def annuler_reservation(rid):
    user = User.query.get(int(get_jwt_identity()))
    r = Reservation.query.get_or_404(rid)
    if user.role == 'client' and r.client_id != user.id:
        return jsonify({'error': 'Non autorisé'}), 403
    r.statut = 'annulee'
    r.updated_at = datetime.utcnow()
    if r.chauffeur_id:
        ch = Chauffeur.query.get(r.chauffeur_id)
        if ch:
            ch.statut = 'disponible'
    db.session.commit()
    return jsonify(r.to_dict())

@app.route('/api/reservations/<int:rid>/affecter', methods=['PUT'])
@jwt_required()
def affecter_chauffeur(rid):
    user = User.query.get(int(get_jwt_identity()))
    if user.role != 'agence':
        return jsonify({'error': 'Non autorisé'}), 403
    data = request.get_json()
    r = Reservation.query.get_or_404(rid)
    ch = Chauffeur.query.get_or_404(data['chauffeur_id'])
    r.chauffeur_id = ch.id
    r.statut = 'confirmee'
    ch.statut = 'en_course'
    r.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(r.to_dict())

# CHAUFFEURS
@app.route('/api/chauffeurs', methods=['GET'])
@jwt_required()
def get_chauffeurs():
    user = User.query.get(int(get_jwt_identity()))
    if user.role != 'agence':
        return jsonify({'error': 'Non autorisé'}), 403
    statut = request.args.get('statut')
    q = Chauffeur.query
    if statut:
        q = q.filter_by(statut=statut)
    return jsonify([c.to_dict() for c in q.all()])

@app.route('/api/chauffeurs', methods=['POST'])
@jwt_required()
def create_chauffeur():
    user = User.query.get(int(get_jwt_identity()))
    if user.role != 'agence':
        return jsonify({'error': 'Non autorisé'}), 403
    data = request.get_json()
    ch = Chauffeur(nom_complet=data['nom_complet'], telephone=data.get('telephone', ''),
                   vehicule_type=data.get('vehicule_type', ''),
                   vehicule_marque=data.get('vehicule_marque', ''),
                   plaque=data.get('plaque', ''))
    db.session.add(ch)
    db.session.commit()
    return jsonify(ch.to_dict()), 201

@app.route('/api/chauffeurs/<int:cid>', methods=['PUT'])
@jwt_required()
def update_chauffeur(cid):
    user = User.query.get(int(get_jwt_identity()))
    if user.role != 'agence':
        return jsonify({'error': 'Non autorisé'}), 403
    ch = Chauffeur.query.get_or_404(cid)
    data = request.get_json()
    for k, v in data.items():
        if hasattr(ch, k):
            setattr(ch, k, v)
    db.session.commit()
    return jsonify(ch.to_dict())

@app.route('/api/courses/<int:rid>/statut', methods=['PUT'])
@jwt_required()
def update_course_statut(rid):
    r = Reservation.query.get_or_404(rid)
    data = request.get_json()
    r.statut = data['statut']
    r.updated_at = datetime.utcnow()
    if data['statut'] == 'terminee' and r.chauffeur_id:
        ch = Chauffeur.query.get(r.chauffeur_id)
        if ch:
            ch.statut = 'disponible'
            ch.total_courses += 1
    db.session.commit()
    return jsonify(r.to_dict())

@app.route('/api/chauffeur/profil', methods=['GET'])
@jwt_required()
def chauffeur_profil():
    user = User.query.get(int(get_jwt_identity()))
    ch = Chauffeur.query.filter_by(user_id=user.id).first()
    if not ch:
        return jsonify({'error': 'Profil non trouvé'}), 404
    return jsonify(ch.to_dict())

@app.route('/api/chauffeur/courses', methods=['GET'])
@jwt_required()
def chauffeur_courses():
    user = User.query.get(int(get_jwt_identity()))
    ch = Chauffeur.query.filter_by(user_id=user.id).first()
    if not ch:
        return jsonify({'error': 'Profil chauffeur non trouvé'}), 404
    courses = Reservation.query.filter_by(chauffeur_id=ch.id).order_by(Reservation.date_depart.desc()).all()
    return jsonify([r.to_dict() for r in courses])

# AVIS
@app.route('/api/avis', methods=['GET'])
def get_avis():
    avis = Avis.query.order_by(Avis.created_at.desc()).limit(20).all()
    return jsonify([a.to_dict() for a in avis])

@app.route('/api/avis', methods=['POST'])
@jwt_required()
def create_avis():
    user = User.query.get(int(get_jwt_identity()))
    data = request.get_json()
    a = Avis(client_id=user.id, note=data.get('note', 5),
             commentaire=data.get('commentaire', ''),
             reservation_id=data.get('reservation_id'))
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201

# RECLAMATIONS
@app.route('/api/reclamations', methods=['GET'])
@jwt_required()
def get_reclamations():
    user = User.query.get(int(get_jwt_identity()))
    if user.role == 'client':
        recs = Reclamation.query.filter_by(client_id=user.id).order_by(Reclamation.created_at.desc()).all()
    elif user.role == 'agence':
        recs = Reclamation.query.order_by(Reclamation.created_at.desc()).all()
    else:
        recs = []
    return jsonify([r.to_dict() for r in recs])

@app.route('/api/reclamations', methods=['POST'])
@jwt_required()
def create_reclamation():
    user = User.query.get(int(get_jwt_identity()))
    data = request.get_json()
    r = Reclamation(client_id=user.id, sujet=data.get('sujet', ''), message=data.get('message', ''))
    db.session.add(r)
    db.session.commit()
    return jsonify(r.to_dict()), 201

# PAIEMENT
@app.route('/api/reservations/<int:rid>/payer', methods=['PUT'])
@jwt_required()
def payer_reservation(rid):
    """Process payment for a reservation."""
    user = User.query.get(int(get_jwt_identity()))
    r = Reservation.query.get_or_404(rid)
    if user.role == 'client' and r.client_id != user.id:
        return jsonify({'error': 'Non autorisé'}), 403
    if r.statut_paiement == 'paye':
        return jsonify({'error': 'Cette réservation est déjà payée'}), 400
    
    data = request.get_json()
    mode = data.get('mode_paiement', 'especes')
    
    r.mode_paiement = mode
    r.statut_paiement = 'paye'
    r.paiement_date = datetime.utcnow()
    r.updated_at = datetime.utcnow()
    
    if mode == 'carte':
        carte_num = data.get('carte_numero', '')
        if len(carte_num) >= 4:
            r.carte_derniers_chiffres = carte_num[-4:]
        r.transaction_id = 'TXN-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    elif mode == 'especes':
        r.transaction_id = 'CASH-' + ''.join(random.choices(string.digits, k=8))
    
    db.session.commit()
    logger.info(f"Payment processed for reservation {r.reference}: {mode}")
    
    # Send payment confirmation email
    try:
        client = User.query.get(r.client_id)
        if client:
            send_payment_confirmation(r, client)
    except Exception as e:
        logger.error(f"Payment email error: {e}")
    
    return jsonify(r.to_dict())

# STATS
@app.route('/api/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user = User.query.get(int(get_jwt_identity()))
    if user.role != 'agence':
        return jsonify({'error': 'Non autorisé'}), 403
    total = Reservation.query.count()
    by_statut = {s: Reservation.query.filter_by(statut=s).count()
                 for s in ['en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee']}
    revenue = db.session.query(func.sum(Reservation.tarif)).filter_by(statut='terminee').scalar() or 0
    by_service = db.session.query(Reservation.type_service,
                                  func.count(Reservation.id),
                                  func.sum(Reservation.tarif)).group_by(Reservation.type_service).all()
    total_ch = Chauffeur.query.count()
    dispo_ch = Chauffeur.query.filter_by(statut='disponible').count()
    total_clients = User.query.filter_by(role='client').count()
    total_personnel = User.query.filter_by(role='agence').count()
    revenue_payee = db.session.query(func.sum(Reservation.tarif)).filter_by(statut_paiement='paye').scalar() or 0
    revenue_en_attente = db.session.query(func.sum(Reservation.tarif)).filter(
        Reservation.statut_paiement == 'non_paye',
        Reservation.statut != 'annulee'
    ).scalar() or 0
    paiements_carte = Reservation.query.filter_by(mode_paiement='carte', statut_paiement='paye').count()
    paiements_especes = Reservation.query.filter_by(mode_paiement='especes', statut_paiement='paye').count()
    return jsonify({
        'reservations': {'total': total, **by_statut},
        'revenue': float(revenue),
        'revenue_payee': float(revenue_payee),
        'revenue_en_attente': float(revenue_en_attente),
        'paiements': {'carte': paiements_carte, 'especes': paiements_especes},
        'by_service': [{'type': r[0], 'count': r[1], 'revenue': float(r[2] or 0)} for r in by_service],
        'chauffeurs': {'total': total_ch, 'disponibles': dispo_ch},
        'clients': total_clients,
        'personnel': total_personnel
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get('PORT', 5000))
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except:
        local_ip = "???"
    print(f"\n{'='*50}")
    print(f"  LAAZIRI TRAVEL - Serveur démarré")
    print(f"  PC:       http://127.0.0.1:{port}")
    print(f"  Mobile:   http://{local_ip}:{port}")
    print(f"  Frontend: {FRONTEND}")
    print(f"{'='*50}\n")
    app.run(debug=False, port=port, host='0.0.0.0')
