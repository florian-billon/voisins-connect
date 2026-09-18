# Guide de Réinitialisation de la Base de Données Neon

## ⚠️ ATTENTION IMPORTANT

Ce processus va **supprimer toutes vos données** de la base de données Neon. Assurez-vous d'avoir exporté vos données avant de continuer.

## Étape 1 : Exporter vos données actuelles

1. **Allez sur Neon Console** → SQL Editor
2. **Exécutez le script** : `export_neon_data.sql`
3. **Copiez toutes les données CSV** qui apparaissent dans la sortie
4. **Sauvegardez-les** dans des fichiers séparés (users.csv, servers.csv, etc.)

## Étape 2 : Réinitialiser la base de données

1. **Dans Neon SQL Editor**, exécutez : `reset_neon_database.sql`
2. **Cela va supprimer** toutes les tables, triggers, types enum et extensions

## Étape 3 : Recréer le schéma

1. **Dans Neon SQL Editor**, exécutez : `backend/migrations/init.sql`
2. **Cela va recréer** toutes les tables avec le schéma correct

## Étape 4 : Réimporter vos données (optionnel)

Si vous voulez restaurer vos données précédentes :

1. **Modifiez** `import_neon_data.sql` avec les chemins de vos fichiers CSV
2. **Exécutez** `import_neon_data.sql` dans Neon SQL Editor

## Étape 5 : Mettre à jour Render

1. **Vérifiez** que Render a la variable d'environnement `DATABASE_URL` correcte
2. **Forcez un déploiement** sur Render
3. **Testez** l'application

## Fichiers disponibles

- `export_neon_data.sql` - Script d'export des données
- `reset_neon_database.sql` - Script de réinitialisation complète
- `import_neon_data.sql` - Script d'import des données
- `backend/migrations/init.sql` - Schéma de base de données à exécuter après réinitialisation

## Notes importantes

- Les messages et fichiers (MongoDB) ne sont pas inclus dans cet export
- Si vous avez des données MongoDB importantes, vous devez les exporter séparément
- Assurez-vous de tester l'application après la réinitialisation
- Gardez une sauvegarde de vos données exportées avant de continuer
