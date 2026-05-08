"""Script pour initialiser la base de données avec les données réelles de LAAZIRI TRAVEL"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app import app, db, User, Chauffeur, Reservation, Tarif, Avis
from datetime import datetime, timedelta
import random

TARIFS_DATA = [
    {'type_service':'transfert','nom_fr':'Aéroport Marrakech → Riad','nom_en':'Marrakech Airport → Riad','depart':'Aéroport Marrakech','destination':'Riad','pax_min':1,'pax_max':7,'prix':100,'repas_inclus':False,'guide_inclus':False,'activites':'','duree':'30 min'},
    {'type_service':'transfert','nom_fr':'Aéroport Marrakech → Riad (Grand Van)','nom_en':'Marrakech Airport → Riad (Van)','depart':'Aéroport Marrakech','destination':'Riad','pax_min':8,'pax_max':14,'prix':300,'repas_inclus':False,'guide_inclus':False,'activites':'','duree':'30 min'},
    {'type_service':'transfert','nom_fr':'Aéroport Marrakech → Aéroport Casablanca','nom_en':'Marrakech Airport → Casablanca Airport','depart':'Aéroport Marrakech','destination':'Aéroport Casablanca','pax_min':1,'pax_max':7,'prix':1500,'repas_inclus':False,'guide_inclus':False,'activites':'','duree':'2h30'},
    {'type_service':'transfert','nom_fr':'Marrakech → Casablanca Centre-ville','nom_en':'Marrakech → Casablanca City Center','depart':'Marrakech','destination':'Casablanca Centre-ville','pax_min':1,'pax_max':7,'prix':1700,'repas_inclus':False,'guide_inclus':False,'activites':'','duree':'2h30'},
    {'type_service':'excursion','nom_fr':"Cascade d'Ouzoud",'nom_en':'Ouzoud Waterfalls','depart':'Marrakech','destination':"Cascade d'Ouzoud",'pax_min':1,'pax_max':2,'prix':1650,'repas_inclus':True,'guide_inclus':True,'activites':'Visite','duree':'Journée complète'},
    {'type_service':'excursion','nom_fr':"Cascade d'Ouzoud",'nom_en':'Ouzoud Waterfalls','depart':'Marrakech','destination':"Cascade d'Ouzoud",'pax_min':3,'pax_max':4,'prix':1850,'repas_inclus':True,'guide_inclus':True,'activites':'Visite','duree':'Journée complète'},
    {'type_service':'excursion','nom_fr':"Cascade d'Ouzoud",'nom_en':'Ouzoud Waterfalls','depart':'Marrakech','destination':"Cascade d'Ouzoud",'pax_min':5,'pax_max':7,'prix':2350,'repas_inclus':True,'guide_inclus':True,'activites':'Visite','duree':'Journée complète'},
    {'type_service':'excursion','nom_fr':'Agadir - Journée Plage','nom_en':'Agadir - Beach Day','depart':'Marrakech','destination':'Agadir','pax_min':1,'pax_max':7,'prix':1800,'repas_inclus':False,'guide_inclus':False,'activites':'Plage, Marina','duree':'Journée complète'},
    {'type_service':'excursion','nom_fr':'Montgolfière au lever du soleil','nom_en':'Hot Air Balloon Sunrise','depart':'Marrakech','destination':'Ciel de Marrakech','pax_min':1,'pax_max':14,'prix':2050,'repas_inclus':True,'guide_inclus':True,'activites':'Vol en montgolfière, Petit-déjeuner berbère','duree':'5H'},
    {'type_service':'excursion','nom_fr':"Vallée d'Ourika",'nom_en':'Ourika Valley','depart':'Marrakech','destination':"Vallée d'Ourika",'pax_min':1,'pax_max':2,'prix':1240,'repas_inclus':True,'guide_inclus':True,'activites':'','duree':'Journée complète'},
    {'type_service':'excursion','nom_fr':"Vallée d'Ourika",'nom_en':'Ourika Valley','depart':'Marrakech','destination':"Vallée d'Ourika",'pax_min':3,'pax_max':7,'prix':1840,'repas_inclus':True,'guide_inclus':True,'activites':'','duree':'Journée complète'},
    {'type_service':'excursion','nom_fr':'Imlil & Atlas','nom_en':'Imlil & Atlas Mountains','depart':'Marrakech','destination':'Imlil','pax_min':1,'pax_max':2,'prix':1240,'repas_inclus':True,'guide_inclus':True,'activites':'','duree':'Journée complète'},
    {'type_service':'excursion','nom_fr':'Imlil & Atlas','nom_en':'Imlil & Atlas Mountains','depart':'Marrakech','destination':'Imlil','pax_min':3,'pax_max':7,'prix':1840,'repas_inclus':True,'guide_inclus':True,'activites':'','duree':'Journée complète'},
    {'type_service':'excursion','nom_fr':'Essaouira','nom_en':'Essaouira','depart':'Marrakech','destination':'Essaouira','pax_min':1,'pax_max':7,'prix':1200,'repas_inclus':False,'guide_inclus':False,'activites':'','duree':'Journée complète'},
    {'type_service':'excursion','nom_fr':'Ouarzazate & Aït Ben Haddou','nom_en':'Ouarzazate & Aït Ben Haddou','depart':'Marrakech','destination':'Ouarzazate','pax_min':1,'pax_max':2,'prix':1640,'repas_inclus':True,'guide_inclus':True,'activites':'','duree':'Journée complète'},
    {'type_service':'excursion','nom_fr':'Ouarzazate & Aït Ben Haddou','nom_en':'Ouarzazate & Aït Ben Haddou','depart':'Marrakech','destination':'Ouarzazate','pax_min':3,'pax_max':7,'prix':2240,'repas_inclus':True,'guide_inclus':True,'activites':'','duree':'Journée complète'},
    {'type_service':'agafay','nom_fr':'Agafay "La Dune" - Quad 1H','nom_en':'Agafay "La Dune" - 1H Quad','depart':'Marrakech','destination':'Agafay "La Dune"','pax_min':1,'pax_max':2,'prix':1800,'repas_inclus':True,'guide_inclus':False,'activites':'1H Quad','duree':'Demi-journée'},
    {'type_service':'agafay','nom_fr':'Agafay "La Dune" - Quad 1H','nom_en':'Agafay "La Dune" - 1H Quad','depart':'Marrakech','destination':'Agafay "La Dune"','pax_min':3,'pax_max':7,'prix':4300,'repas_inclus':True,'guide_inclus':False,'activites':'1H Quad','duree':'Demi-journée'},
    {'type_service':'agafay','nom_fr':'Agafay "La Dune" - Combo Quad+Chameau','nom_en':'Agafay "La Dune" - Combo','depart':'Marrakech','destination':'Agafay "La Dune"','pax_min':1,'pax_max':2,'prix':2100,'repas_inclus':True,'guide_inclus':False,'activites':'1H Quad + 1H Chameau','duree':'Demi-journée'},
    {'type_service':'circuit','nom_fr':'Circuit Merzouga 3 Jours','nom_en':'Merzouga 3-Day Circuit','depart':'Marrakech','destination':'Merzouga','pax_min':1,'pax_max':2,'prix':8950,'repas_inclus':True,'guide_inclus':True,'activites':'Dromadaires, Nuit en bivouac, Demi-pension','duree':'3 Jours'},
    {'type_service':'circuit','nom_fr':'Circuit Merzouga 3 Jours','nom_en':'Merzouga 3-Day Circuit','depart':'Marrakech','destination':'Merzouga','pax_min':3,'pax_max':7,'prix':11500,'repas_inclus':True,'guide_inclus':True,'activites':'Dromadaires, Nuit en bivouac, Demi-pension','duree':'3 Jours'},
    {'type_service':'circuit','nom_fr':'Circuit Merzouga 4 Jours','nom_en':'Merzouga 4-Day Circuit','depart':'Marrakech','destination':'Merzouga','pax_min':1,'pax_max':2,'prix':10450,'repas_inclus':True,'guide_inclus':True,'activites':'Dromadaires, Nuit en bivouac, Demi-pension','duree':'4 Jours'},
    {'type_service':'ville','nom_fr':'Visite de ville - Journée complète','nom_en':'Full Day City Tour','depart':'Riad','destination':'Marrakech','pax_min':1,'pax_max':7,'prix':1200,'repas_inclus':False,'guide_inclus':True,'activites':'Guide privé','duree':'8H'},
    {'type_service':'ville','nom_fr':'Visite de ville - Demi-journée','nom_en':'Half Day City Tour','depart':'Riad','destination':'Marrakech','pax_min':1,'pax_max':7,'prix':800,'repas_inclus':False,'guide_inclus':True,'activites':'Guide privé','duree':'4H'},
    {'type_service':'ville','nom_fr':'Mise à disposition 8H','nom_en':'Private Driver 8H','depart':'Riad','destination':'Marrakech','pax_min':1,'pax_max':7,'prix':1500,'repas_inclus':False,'guide_inclus':False,'activites':'Chauffeur privé','duree':'8H'},
    {'type_service':'hammam','nom_fr':'Séance Hammam Traditionnel','nom_en':'Traditional Hammam Session','depart':'Riad','destination':'Hammam','pax_min':1,'pax_max':4,'prix':350,'repas_inclus':False,'guide_inclus':False,'activites':'Gommage, savon beldi','duree':'1H30'},
    {'type_service':'hammam','nom_fr':'Séance SPA Luxe','nom_en':'Luxury SPA Session','depart':'Riad','destination':'SPA','pax_min':1,'pax_max':2,'prix':600,'repas_inclus':False,'guide_inclus':False,'activites':'Massage, hammam, aromathérapie','duree':'2H'},
    {'type_service':'restaurant','nom_fr':'Dîner Riad avec spectacle','nom_en':'Riad Dinner with Show','depart':'Riad','destination':'Restaurant Riad','pax_min':1,'pax_max':10,'prix':400,'repas_inclus':True,'guide_inclus':False,'activites':'Musique andalouse','duree':'3H'},
    {'type_service':'restaurant','nom_fr':'Déjeuner Panoramique','nom_en':'Panoramic Lunch','depart':'Riad','destination':'Restaurant Panoramique','pax_min':1,'pax_max':10,'prix':250,'repas_inclus':True,'guide_inclus':False,'activites':'Vue sur Marrakech','duree':'2H'},
]

def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("Tables créées.")

        # Personnel (Agence) - 24 users
        personnel_names = [
            ("LAAZIRI", "Travel"), ("El Idrissi", "Fatima"), ("Mansouri", "Hassan"), ("Bennis", "Sara"),
            ("Tahiri", "Othmane"), ("Alami", "Meryem"), ("Chraibi", "Anas"), ("Bennani", "Zineb"),
            ("Belkhayat", "Saad"), ("Tazi", "Salma"), ("Slaoui", "Amine"), ("Filali", "Kenza"),
            ("Amrani", "Nabil"), ("Kadiri", "Laila"), ("Berrada", "Mehdi"), ("Naciri", "Ghita"),
            ("Zahir", "Youssef"), ("Mernissi", "Asmaa"), ("Lahlou", "Karim"), ("Sqalli", "Hind"),
            ("Guessous", "Rachid"), ("Sbita", "Imane"), ("Kabbaj", "Faycal"), ("Benkirane", "Nora")
        ]
        for i, (nom, prenom) in enumerate(personnel_names):
            email = 'agence@laaziritravel.com' if i == 0 else f'personnel{i+1}@laaziritravel.com'
            u = User(nom=nom, prenom=prenom, email=email, telephone='+212 652 640 646', role='agence')
            u.set_password('agence2024')
            db.session.add(u)

        # Chauffeurs
        chauffeur_names = [
            "Ahmed El Mansouri", "Youssef Bennani", "Karim Alami", "Omar Tahiri",
            "Hassan Belkhayat", "Mustafa El Fassi", "Khalid Tazi", "Rachid Naciri",
            "Ibrahim Amrani", "Samir Kadiri", "Younes Berrada", "Adil Slaoui",
            "Fouad Filali", "Mohamed Chraibi", "Jamal El Amrani", "Saïd El Fassi",
            "Abdelkrim Tazi", "Hamza Bennani", "Walid Alami", "Tarik Mansouri",
            "Hicham Bakali"
        ]
        vehicles = [
            ("Mercedes Class E", "Executive"), ("Audi A6", "Comfort"),
            ("Skoda Superb", "Spacious"), ("Mercedes Vito", "VIP Minivan"),
            ("Toyota Land Cruiser", "SUV"), ("Ford Explorer", "All Terrain"),
            ("Hyundai Santa Fe", "SUV"), ("BMW Série 5", "Premium"),
        ]
        chauffeurs_list = []
        for i, full_name in enumerate(chauffeur_names):
            parts = full_name.split(' ', 1)
            nom = parts[1] if len(parts) > 1 else parts[0]
            prenom = parts[0]
            email = f"chauffeur{i+1}@laaziritravel.com"
            tel = f"+212 6{random.randint(10000000, 99999999)}"
            u = User(nom=nom, prenom=prenom, email=email, telephone=tel, role='chauffeur')
            u.set_password('chauffeur2024')
            db.session.add(u)
            db.session.flush()
            v_name, v_type = vehicles[i % len(vehicles)]
            plaque = f"{random.randint(1000,99999)}-{random.choice(['A','B'])}-26"
            ch = Chauffeur(user_id=u.id, nom_complet=full_name, telephone=tel,
                           vehicule_type=v_type, vehicule_marque=v_name, plaque=plaque,
                           statut='disponible', note_moyenne=round(random.uniform(4.5, 5.0), 1),
                           total_courses=random.randint(10, 80))
            db.session.add(ch)
            chauffeurs_list.append(ch)

        # Demo clients
        clients_data = [
            {'nom': 'Laloun', 'prenom': 'Omar', 'email': 'omar@client.com', 'tel': '+212 652 640 646'},
            {'nom': 'Lahrech', 'prenom': 'Meriem', 'email': 'meriem@client.com', 'tel': '+212 661 223 344'},
            {'nom': 'Mouakkal', 'prenom': 'Salma', 'email': 'salma@client.com', 'tel': '+212 670 112 233'},
            {'nom': 'Mas', 'prenom': 'Marwa', 'email': 'marwa@client.com', 'tel': '+212 665 334 455'},
        ]
        created_clients = []
        for c in clients_data:
            u = User(nom=c['nom'], prenom=c['prenom'], email=c['email'], telephone=c['tel'], role='client')
            u.set_password('client2024')
            db.session.add(u)
            created_clients.append(u)
        db.session.flush()

        # Demo avis (pas de réservations demo)
        if created_clients:
            avis_data = [
                (created_clients[0].id, 5, "Service impeccable, chauffeur très professionnel et ponctuel!"),
                (created_clients[1].id, 5, "Excursion magnifique, guide très compétent. Je recommande vivement!"),
                (created_clients[2].id, 4, "Très bonne expérience, organisation parfaite. Merci LAAZIRI TRAVEL!"),
                (created_clients[3].id, 5, "Circuit inoubliable dans le désert! L'équipe est au top, merci LAAZIRI!"),
            ]
            for cid, note, comm in avis_data:
                db.session.add(Avis(client_id=cid, note=note, commentaire=comm))

        # Tarifs
        for td in TARIFS_DATA:
            db.session.add(Tarif(**td))

        db.session.commit()
        print(f"Base initialisée: {len(chauffeur_names)} chauffeurs, {len(clients_data)} clients, {len(TARIFS_DATA)} tarifs.")
        print("\n=== COMPTES DEMO ===")
        print("Agence : agence@laaziritravel.com / agence2024")
        print("Client  : omar@client.com / client2024")
        print("Chauffeur: chauffeur1@laaziritravel.com / chauffeur2024")

if __name__ == '__main__':
    seed()
