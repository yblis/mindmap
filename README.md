# 🧠 MindMap Web Application

Une application de MindMapping légère, esthétique et **conteneurisée**, conçue pour créer, éditer et partager des cartes mentales simplement.

![MindMap Screenshot](https://via.placeholder.com/800x400?text=MindMap+App+Preview)

## ✨ Fonctionnalités

- **Interface Moderne & Sombre** : Design épuré inspiré des meilleurs outils de diagramme (Dark Mode).
- **Édition Intuitive** :
    - Ajoutez des noeuds enfants d'un simple clic.
    - Double-cliquez pour éditer le texte.
    - Supprimez des branches entières.
- **Persistance Locale** : Vos travaux sont sauvegardés automatiquement dans votre navigateur (`LocalStorage`). Vous ne perdez rien en rafraîchissant la page.
- **Partage Facile** : Générez un lien unique pour partager votre MindMap en **lecture seule** avec vos collaborateurs.
- **Import / Export JSON** :
    - Exportez votre travail pour le sauvegarder ou le transférer.
    - Importez n'importe quelle structure JSON compatible pour reprendre le travail.
- **Conteneurisation Docker** : Déploiement facile et isolé via Docker Compose.

## 🛠️ Stack Technique

- **Frontend** : HTML5, CSS3, **D3.js (v7)** pour le rendu graphique interactif.
- **Backend** : **Python Flask** pour servir l'application et gérer l'API de partage.
- **Base de Données** : **SQLite** (fichier léger) pour stocker les cartes partagées.
- **Infrastructure** : **Docker** & **Docker Compose**.

## 🚀 Installation & Démarrage rapide

### Pré-requis
- [Docker](https://www.docker.com/products/docker-desktop) installé sur votre machine.

### Lancer l'application

1. **Naviguez dans le dossier du projet** :
   ```bash
   cd mindmap
   ```

2. **Lancez le conteneur** (Build & Run) :
   ```bash
   docker compose up -d --build
   ```

3. **Accédez à l'application** :
   Ouvrez votre navigateur et allez sur :
   👉 **[http://localhost:5000](http://localhost:5000)**

### Arrêter l'application
```bash
docker compose down
```

## 📖 Guide d'Utilisation

### 1. Création et Édition
- **Ajouter un noeud** : Sélectionnez un noeud existant (bordure orange) puis cliquez sur le bouton `+ Enfant` dans le panneau de contrôle.
- **Modifier le texte** : Double-cliquez sur n'importe quel noeud pour transformer le texte en champ d'édition. Appuyez sur `Entrée` ou cliquez ailleurs pour valider.
- **Supprimer un noeud** : Sélectionnez un noeud et cliquez sur `- Supprimer`. **Attention**, cela supprime également tous ses enfants !
- **Zoom & Pan** : Utilisez la molette de la souris pour zoomer/dézoomer et cliquez-glissez sur le fond pour vous déplacer.

### 2. Sauvegarde et Partage
- **Sauvegarde Auto** : Tout changement est immédiatement enregistré dans votre navigateur.
- **Partager** : Cliquez sur le bouton `Partager`. Un lien unique (ex: `/view/550e8400-e29b...`) sera généré. Vous pouvez envoyer ce lien à n'importe qui ; ils pourront voir la carte mais **ne pourront pas la modifier**.

### 3. Import / Export
- **Export JSON** : Télécharge un fichier `.json` contenant toute la structure de votre arbre.
- **Import JSON** : Ouvrez la fenêtre d'import, collez le contenu d'un fichier JSON exporté pour restaurer une carte.

## 📂 Structure du Projet

```
mindmap/
├── app.py                 # Point d'entrée Backend Flask
├── db.py                  # Module de gestion base de données SQLite
├── Dockerfile             # Configuration de l'image Docker
├── docker-compose.yml     # Orchestration des conteneurs
├── requirements.txt       # Dépendances Python
├── dbs/                   # Dossier monté (Volume) pour la persistance SQLite
└── static/
    ├── css/style.css      # Styles (Thème sombre, animations)
    └── js/main.js         # Cœur de l'application (Logique D3.js)
└── templates/
    └── index.html         # Template HTML unique (Vue & Édition)
```

## 🛡️ Notes Techniques
- La base de données SQLite est persistée via un volume Docker dans `./dbs`.
- Le serveur Flask tourne en mode développement par défaut (Debug=True). Pour la production, préférez un serveur WSGI comme Gunicorn (déjà inclus dans requirements.txt).

---
*Développé avec ❤️ par Antigravity*
