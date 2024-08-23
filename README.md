# Repository pour le projet du Punto réalisé à l'IUT de Vannes

### Le code source est le même que celui qui a été rendu (le commit initial)

### Le fichier [Projet 1 \_ Punto.pdf](./Projet%201%20_%20Punto.pdf) contient le sujet du projet

-   Ce sujet à été modifié après le rendu, pour ajouter la base de donnée Neo4j.

### Le fichier [Punto_règles.pdf](./Punto_règles.pdf) contient les règles du jeu de Punto

---

# PuntoDB : Le Jeu de Punto avec Gestion de Base de Données

### Auteurs

-   Naexy

### Introduction

PuntoDB est un jeu de Punto implémenté avec une interface de terminal, permettant la liaison avec quatres bases de données différentes : MySQL, SQLite, MongoDB et Neo4j. Le programme offre une expérience interactive en ligne de commande, avec des options pour jouer, gérer les bases de données et générer des parties. L'entièreté du programme en anglais.

### Démonstration

Le fichier [demo](./demo.md) contient une démonstration du jeu avec des captures d'écran ainsi que des vérifications de la sauvegarde des parties dans les bases de données.

### Prérequis

-   Assurez-vous d'avoir installé MySQL, SQLite, MongoDB et Neo4j sur votre machine.
-   Node.js doit être installé pour exécuter le programme.

### Installation des Dépendances

Pour installer les dépendances nécessaires, exécutez :

```sh
pnpm install
```

### Construction du Projet

Pour construire le projet dans le dossier `dist` :

```sh
pnpm run build
```

### Exécution des Tests

Pour exécuter les tests :

```sh
pnpm run test
```

### Lancement du Programme

Pour démarrer le programme principal :

```sh
pnpm run start
```

### Nettoyage des Fichiers de Build

Pour nettoyer les fichiers de build :

```sh
pnpm run clean
```

-   Attention, cette commande utilise la commande `del` de Windows pour supprimer `tsconfig.tsbuildinfo`. Sous Linux, il faudra adapter la commande pour supprimer ce fichier.

### Documentation

Pour générer la documentation technique du projet dans le dossier `docs` :

```sh
pnpm run docs
```

La documentation générée est accessible via le fichier [index.html](./docs/index.html) dans le dossier `docs`.

### Utilisation du Programme

Au lancement, le programme offre plusieurs options :

-   Tapez `game` pour lancer une partie.
-   Tapez `db` pour accéder aux commandes de base de données.

#### Mode Base de Données

Dans ce mode, vous pouvez :

-   Activer ou désactiver les bases de données pour la sauvegarde des parties.
-   Vider les bases de données actives.

#### Mode Jeu

-   Jouez une partie de Punto ou générez plusieurs parties (`g100` pour 100 parties, par exemple).
-   Les résultats des parties seront automatiquement sauvegardés dans les bases de données activées.

#### Commandes Globales

Des commandes comme `exit`, `n`, `quit`, etc., sont disponibles à tout moment pour naviguer ou quitter le programme.
Voici la liste complète des commandes de "refus" :

-   `bye`
-   `exit`
-   `false`
-   `n`
-   `no`
-   `q`
-   `quit`
-   `refuse`
-   `stop`
