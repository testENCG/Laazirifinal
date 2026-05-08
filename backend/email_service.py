"""Email service for LAAZIRI TRAVEL - Professional email notifications."""
import smtplib
import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

logger = logging.getLogger(__name__)

# Email configuration
MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
MAIL_FROM_NAME = 'LAAZIRI TRAVEL'


def send_email(to_email, subject, html_body):
    """Send an email. Returns True if successful, False otherwise."""
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        logger.warning("Email not configured (MAIL_USERNAME/MAIL_PASSWORD missing). Skipping email.")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f'{MAIL_FROM_NAME} <{MAIL_USERNAME}>'
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        if MAIL_USE_TLS:
            server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_USERNAME, to_email, msg.as_string())
        server.quit()
        
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


def email_header():
    return """
    <div style="background:#0A1628; padding:30px 20px; text-align:center; border-radius:12px 12px 0 0;">
        <div style="font-size:28px; font-weight:800; color:#00A8E8; letter-spacing:1px;">LAAZIRI TRAVEL</div>
        <div style="color:#8899AA; font-size:13px; margin-top:6px;">Votre agence touristique de confiance à Marrakech</div>
    </div>
    """


def email_footer():
    return """
    <div style="background:#0F1C2E; padding:24px 20px; text-align:center; border-radius:0 0 12px 12px; border-top:1px solid #1A2A3A;">
        <div style="color:#8899AA; font-size:12px; line-height:1.8;">
            📞 +212 600-594828 &nbsp;|&nbsp; 📸 @laaziritravel &nbsp;|&nbsp; ✉️ laaziritravel@gmail.com<br>
            📍 Marrakech, Maroc<br><br>
            © 2026 LAAZIRI TRAVEL — Tous droits réservés
        </div>
    </div>
    """


def email_template(content):
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0; padding:0; background:#0A1628; font-family:Arial, Helvetica, sans-serif;">
        <div style="max-width:600px; margin:20px auto; background:#0A1628; border-radius:12px; overflow:hidden; border:1px solid #1A2A3A;">
            {email_header()}
            <div style="padding:30px 24px; color:#E0E8F0; font-size:14px; line-height:1.7;">
                {content}
            </div>
            {email_footer()}
        </div>
    </body>
    </html>
    """


# ==================== EMAIL TEMPLATES ====================

def send_welcome_email(user):
    """Send welcome email after registration."""
    content = f"""
    <h2 style="color:#00A8E8; margin:0 0 20px;">Bienvenue {user.prenom} ! 🎉</h2>
    <p>Merci de nous avoir rejoint ! Votre compte <strong>LAAZIRI TRAVEL</strong> a été créé avec succès.</p>
    
    <div style="background:#0F1C2E; border:1px solid #1A2A3A; border-radius:10px; padding:20px; margin:20px 0;">
        <div style="color:#8899AA; font-size:12px; margin-bottom:4px;">VOS INFORMATIONS</div>
        <table style="width:100%; color:#E0E8F0; font-size:14px;">
            <tr><td style="padding:6px 0; color:#8899AA;">Nom complet</td><td style="padding:6px 0; text-align:right; font-weight:bold;">{user.prenom} {user.nom}</td></tr>
            <tr><td style="padding:6px 0; color:#8899AA;">Email</td><td style="padding:6px 0; text-align:right;">{user.email}</td></tr>
            <tr><td style="padding:6px 0; color:#8899AA;">Téléphone</td><td style="padding:6px 0; text-align:right;">{user.telephone or '—'}</td></tr>
        </table>
    </div>
    
    <p>Vous pouvez maintenant :</p>
    <div style="margin:16px 0;">
        <div style="padding:8px 0;">✈️ Réserver des transferts aéroport</div>
        <div style="padding:8px 0;">🏔️ Planifier des excursions (Ouzoud, Essaouira, Agadir...)</div>
        <div style="padding:8px 0;">🗺️ Organiser des circuits multi-jours</div>
        <div style="padding:8px 0;">♨️ Réserver des hammams et restaurants</div>
    </div>
    
    <div style="text-align:center; margin:30px 0;">
        <a href="https://wa.me/212600594828" style="display:inline-block; background:#25D366; color:white; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:15px;">💬 Nous contacter sur WhatsApp</a>
    </div>
    
    <p style="color:#8899AA; font-size:12px;">Si vous n'avez pas créé ce compte, veuillez nous contacter immédiatement.</p>
    """
    return send_email(user.email, "Bienvenue chez LAAZIRI TRAVEL ! 🌴", email_template(content))


def send_reservation_confirmation(reservation, user):
    """Send reservation confirmation email."""
    
    # Payment info
    if reservation.statut_paiement == 'paye':
        pay_badge = '<span style="background:#198754; color:white; padding:4px 12px; border-radius:20px; font-size:12px;">✅ Payé</span>'
        pay_detail = f"Mode: {'💳 Carte' if reservation.mode_paiement == 'carte' else '💵 Espèces'}"
    else:
        pay_badge = '<span style="background:#FFC107; color:#000; padding:4px 12px; border-radius:20px; font-size:12px;">⏳ En attente</span>'
        if reservation.moment_paiement == 'apres_course':
            pay_detail = f"Paiement {'par carte' if reservation.mode_paiement == 'carte' else 'en espèces'} après la course"
        else:
            pay_detail = "Paiement prévu à la prise en charge"
    
    date_formatted = reservation.date_depart.strftime('%d/%m/%Y à %Hh%M') if reservation.date_depart else '—'
    
    content = f"""
    <h2 style="color:#00A8E8; margin:0 0 20px;">Réservation confirmée ! ✅</h2>
    <p>Bonjour <strong>{user.prenom}</strong>, votre réservation a été enregistrée avec succès.</p>
    
    <div style="background:#0F1C2E; border:1px solid #1A2A3A; border-radius:10px; padding:20px; margin:20px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <span style="background:#00A8E8; color:white; padding:6px 14px; border-radius:8px; font-weight:bold; font-size:14px;">{reservation.reference}</span>
            {pay_badge}
        </div>
        <table style="width:100%; color:#E0E8F0; font-size:14px; border-collapse:collapse;">
            <tr><td style="padding:8px 0; color:#8899AA; border-bottom:1px solid #1A2A3A;">Service</td><td style="padding:8px 0; text-align:right; border-bottom:1px solid #1A2A3A; font-weight:bold;">{reservation.nom_service}</td></tr>
            <tr><td style="padding:8px 0; color:#8899AA; border-bottom:1px solid #1A2A3A;">Trajet</td><td style="padding:8px 0; text-align:right; border-bottom:1px solid #1A2A3A;">{reservation.depart} → {reservation.destination}</td></tr>
            <tr><td style="padding:8px 0; color:#8899AA; border-bottom:1px solid #1A2A3A;">Date</td><td style="padding:8px 0; text-align:right; border-bottom:1px solid #1A2A3A;">{date_formatted}</td></tr>
            <tr><td style="padding:8px 0; color:#8899AA; border-bottom:1px solid #1A2A3A;">Voyageurs</td><td style="padding:8px 0; text-align:right; border-bottom:1px solid #1A2A3A;">👥 {reservation.nombre_pax}</td></tr>
            <tr><td style="padding:8px 0; color:#8899AA; border-bottom:1px solid #1A2A3A;">Paiement</td><td style="padding:8px 0; text-align:right; border-bottom:1px solid #1A2A3A;">{pay_detail}</td></tr>
            <tr><td style="padding:8px 0; color:#8899AA;"><strong>TOTAL</strong></td><td style="padding:8px 0; text-align:right; font-size:20px; font-weight:bold; color:#00A8E8;">{reservation.tarif:,.0f} MAD</td></tr>
        </table>
    </div>
    
    <div style="background:#0F1C2E; border-left:4px solid #00A8E8; padding:16px; border-radius:0 8px 8px 0; margin:20px 0;">
        <strong style="color:#00A8E8;">📋 Prochaines étapes :</strong>
        <div style="margin-top:10px; color:#C0C8D0;">
            1. Notre équipe confirme votre réservation sous 24h<br>
            2. Un chauffeur professionnel vous sera attribué<br>
            3. Vous recevrez les détails de votre chauffeur par SMS/WhatsApp
        </div>
    </div>
    
    <div style="text-align:center; margin:30px 0;">
        <a href="https://wa.me/212600594828?text=Bonjour, je viens de réserver (Réf: {reservation.reference})" style="display:inline-block; background:#25D366; color:white; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:bold;">💬 Contacter l'agence</a>
    </div>
    
    <p style="color:#8899AA; font-size:12px;">Pour toute modification, connectez-vous à votre espace client ou contactez-nous au +212 600-594828.</p>
    """
    return send_email(user.email, f"Réservation {reservation.reference} — {reservation.nom_service} ✅ LAAZIRI TRAVEL", email_template(content))


def send_payment_confirmation(reservation, user):
    """Send payment confirmation email."""
    
    date_formatted = reservation.paiement_date.strftime('%d/%m/%Y à %Hh%M') if reservation.paiement_date else datetime.utcnow().strftime('%d/%m/%Y à %Hh%M')
    mode = '💳 Carte bancaire' if reservation.mode_paiement == 'carte' else '💵 Espèces'
    carte_info = f" (••••{reservation.carte_derniers_chiffres})" if reservation.carte_derniers_chiffres else ""
    
    content = f"""
    <h2 style="color:#198754; margin:0 0 20px;">Paiement reçu ! 💰</h2>
    <p>Bonjour <strong>{user.prenom}</strong>, nous confirmons la réception de votre paiement.</p>
    
    <div style="background:#0F1C2E; border:1px solid #198754; border-radius:10px; padding:20px; margin:20px 0;">
        <div style="text-align:center; margin-bottom:16px;">
            <div style="font-size:32px; font-weight:800; color:#198754;">{reservation.tarif:,.0f} MAD</div>
            <div style="color:#8899AA; font-size:13px; margin-top:4px;">Paiement confirmé</div>
        </div>
        <table style="width:100%; color:#E0E8F0; font-size:14px;">
            <tr><td style="padding:6px 0; color:#8899AA;">Réservation</td><td style="padding:6px 0; text-align:right; font-weight:bold;">{reservation.reference}</td></tr>
            <tr><td style="padding:6px 0; color:#8899AA;">Service</td><td style="padding:6px 0; text-align:right;">{reservation.nom_service}</td></tr>
            <tr><td style="padding:6px 0; color:#8899AA;">Mode</td><td style="padding:6px 0; text-align:right;">{mode}{carte_info}</td></tr>
            <tr><td style="padding:6px 0; color:#8899AA;">Transaction</td><td style="padding:6px 0; text-align:right; font-family:monospace;">{reservation.transaction_id or '—'}</td></tr>
            <tr><td style="padding:6px 0; color:#8899AA;">Date</td><td style="padding:6px 0; text-align:right;">{date_formatted}</td></tr>
        </table>
    </div>
    
    <p>Merci pour votre confiance ! 🙏</p>
    <p style="color:#8899AA; font-size:12px;">Ce reçu fait office de confirmation de paiement. Conservez-le pour vos dossiers.</p>
    """
    return send_email(user.email, f"Paiement confirmé — {reservation.reference} 💰 LAAZIRI TRAVEL", email_template(content))
