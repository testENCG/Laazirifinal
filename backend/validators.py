"""Input validation and data sanitization utilities."""
import re
from typing import Dict, Any, Tuple, Optional


class ValidationError(Exception):
    """Custom validation exception."""
    pass


class Validator:
    """Data validation utilities."""
    
    # Email regex pattern (RFC 5322 simplified)
    EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    # Phone number pattern (supports international formats)
    PHONE_PATTERN = r'^\+?[1-9]\d{1,14}$'
    
    # Min/Max constraints
    PASSWORD_MIN_LENGTH = 8
    NAME_MIN_LENGTH = 2
    NAME_MAX_LENGTH = 100
    TELEPHONE_MAX_LENGTH = 20
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Validate and return email."""
        if not email or not isinstance(email, str):
            raise ValidationError('Email est requis')
        email = email.strip().lower()
        if not re.match(Validator.EMAIL_PATTERN, email):
            raise ValidationError('Email invalide')
        if len(email) > 120:
            raise ValidationError('Email trop long')
        return email
    
    @staticmethod
    def validate_password(password: str) -> str:
        """Validate password strength."""
        if not password or not isinstance(password, str):
            raise ValidationError('Mot de passe requis')
        if len(password) < 6:
            raise ValidationError('Le mot de passe doit contenir au moins 6 caractères')
        return password
    
    @staticmethod
    def validate_name(name: str, field_name: str = 'Nom') -> str:
        """Validate name fields."""
        if not name or not isinstance(name, str):
            raise ValidationError(f'{field_name} est requis')
        name = name.strip()
        if len(name) < Validator.NAME_MIN_LENGTH:
            raise ValidationError(f'{field_name} doit contenir au moins {Validator.NAME_MIN_LENGTH} caractères')
        if len(name) > Validator.NAME_MAX_LENGTH:
            raise ValidationError(f'{field_name} doit contenir moins de {Validator.NAME_MAX_LENGTH} caractères')
        if not re.match(r"^[a-zA-ZÀ-ÿ\s'-]+$", name):
            raise ValidationError(f'{field_name} contient des caractères invalides')
        return name
    
    @staticmethod
    def validate_telephone(telephone: Optional[str]) -> Optional[str]:
        """Validate telephone number."""
        if not telephone:
            return None
        telephone = str(telephone).strip()
        if len(telephone) > Validator.TELEPHONE_MAX_LENGTH:
            raise ValidationError('Numéro de téléphone trop long')
        if not re.match(r'^\+?[\d\s\-\(\)]{9,}$', telephone):
            raise ValidationError('Numéro de téléphone invalide')
        return telephone
    
    @staticmethod
    def validate_role(role: str) -> str:
        """Validate user role."""
        valid_roles = ['client', 'agence', 'chauffeur', 'admin']
        if role not in valid_roles:
            raise ValidationError(f'Rôle invalide. Doit être l\'un de: {", ".join(valid_roles)}')
        return role
    
    @staticmethod
    def validate_number(value: Any, field_name: str, min_val: int = 1, max_val: int = 1000) -> int:
        """Validate positive integer."""
        try:
            num = int(value)
            if num < min_val or num > max_val:
                raise ValidationError(
                    f'{field_name} doit être entre {min_val} et {max_val}'
                )
            return num
        except (ValueError, TypeError):
            raise ValidationError(f'{field_name} doit être un nombre')
    
    @staticmethod
    def validate_float(value: Any, field_name: str, min_val: float = 0) -> float:
        """Validate float number."""
        try:
            num = float(value)
            if num < min_val:
                raise ValidationError(f'{field_name} doit être >= {min_val}')
            return num
        except (ValueError, TypeError):
            raise ValidationError(f'{field_name} doit être un nombre')


def validate_register_data(data: Dict) -> Tuple[bool, Optional[str]]:
    """Validate registration form data."""
    try:
        if not data:
            return False, 'Les données sont requises'
        
        # Required fields
        required = ['nom', 'prenom', 'email', 'password']
        missing = [f for f in required if f not in data or not data[f]]
        if missing:
            return False, f'Champs requis: {", ".join(missing)}'
        
        # Validate each field
        Validator.validate_name(data['nom'], 'Nom')
        Validator.validate_name(data['prenom'], 'Prénom')
        Validator.validate_email(data['email'])
        Validator.validate_password(data['password'])
        
        if 'telephone' in data and data['telephone']:
            Validator.validate_telephone(data['telephone'])
        
        if 'role' in data:
            Validator.validate_role(data['role'])
        
        return True, None
    
    except ValidationError as e:
        return False, str(e)


def validate_login_data(data: Dict) -> Tuple[bool, Optional[str]]:
    """Validate login form data."""
    try:
        if not data:
            return False, 'Les données sont requises'
        
        if not data.get('email') or not data.get('password'):
            return False, 'Email et mot de passe requis'
        
        Validator.validate_email(data['email'])
        
        return True, None
    
    except ValidationError as e:
        return False, str(e)


def validate_reservation_data(data: Dict) -> Tuple[bool, Optional[str]]:
    """Validate reservation form data."""
    try:
        if not data:
            return False, 'Les données sont requises'
        
        required = ['type_service', 'depart', 'destination', 'date_depart']
        missing = [f for f in required if f not in data or not data[f]]
        if missing:
            return False, f'Champs requis: {", ".join(missing)}'
        
        if 'nombre_pax' in data:
            Validator.validate_number(data['nombre_pax'], 'Nombre de passagers', 1, 14)
        
        if 'tarif' in data and data['tarif']:
            Validator.validate_float(data['tarif'], 'Tarif', 0)
        
        return True, None
    
    except ValidationError as e:
        return False, str(e)
