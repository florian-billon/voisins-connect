# Script de déploiement automatisé pour voisins_connect
# Ce script guide et automatise le déploiement sur Render et Vercel

Write-Host "🚀 Script de déploiement automatisé - voisins_connect" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Node.js est installé
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion installé" -ForegroundColor Green

# Demander les informations nécessaires
Write-Host ""
Write-Host "🔑 Configuration du déploiement" -ForegroundColor Yellow
Write-Host ""

# Variables d'environnement
$databaseUrl = "postgresql://neondb_owner:npg_iVuGFgOAzM64@ep-jolly-water-ahsgdocs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
$mongodbUrl = "mongodb+srv://helloworld:helloworld@cluster0.o2z1nqe.mongodb.net/?appName=Cluster0"
$jwtSecret = "super_secret_jwt_key_change_in_production_12345"
$port = "3001"

Write-Host "📊 Résumé de la configuration :" -ForegroundColor Cyan
Write-Host "  - Dépôt GitHub : florian-billon/voisins-connect" -ForegroundColor White
Write-Host "  - Backend : Docker (Render)" -ForegroundColor White
Write-Host "  - Frontend : Next.js (Vercel)" -ForegroundColor White
Write-Host ""

# Option 1 : déploiement automatique avec CLI
Write-Host "🎯 Options de déploiement :" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Déploiement automatisé (recommandé)" -ForegroundColor Green
Write-Host "   - Installe les CLI Vercel et Render" -ForegroundColor Gray
Write-Host "   - Configure et déploie automatiquement" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Déploiement manuel (fallback)" -ForegroundColor Yellow
Write-Host "   - Ouvre les guides dans le navigateur" -ForegroundColor Gray
Write-Host "   - Vous suivez les instructions manuellement" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Choisissez une option (1 ou 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "🔧 Installation des CLI..." -ForegroundColor Yellow

    # Installer Vercel CLI
    Write-Host "Installation de Vercel CLI..." -ForegroundColor Cyan
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation de Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI installé" -ForegroundColor Green

    # Déployer le frontend
    Write-Host ""
    Write-Host "🎨 Déploiement du frontend sur Vercel..." -ForegroundColor Yellow
    Write-Host "Veuillez vous connecter à Vercel dans la fenêtre qui va s'ouvrir" -ForegroundColor Cyan
    
    Set-Location frontend
    vercel --prod --yes
    Set-Location ..

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend déployé avec succès !" -ForegroundColor Green
        $frontendUrl = Read-Host "Entrez l'URL du frontend (ex: https://voisins-connect.vercel.app)"
        
        # Mettre à jour .env.production
        $envContent = "NEXT_PUBLIC_API_URL=https://voisins-connect-backend.onrender.com"
        Set-Content -Path "frontend/.env.production" -Value $envContent
        
        Write-Host ""
        Write-Host "⚠️  Pour le backend, Render n'a pas de CLI gratuite." -ForegroundColor Yellow
        Write-Host "Veuillez vous rendre sur https://render.com pour configurer manuellement :" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Instructions :" -ForegroundColor White
        Write-Host "1. Connectez-vous sur https://render.com" -ForegroundColor Gray
        Write-Host "2. New Web Service → Connect GitHub repo: florian-billon/voisins-connect" -ForegroundColor Gray
        Write-Host "3. Runtime: Docker, Docker Context: /backend" -ForegroundColor Gray
        Write-Host "4. Variables d'environnement :" -ForegroundColor Gray
        Write-Host "   - DATABASE_URL = $databaseUrl" -ForegroundColor Gray
        Write-Host "   - MONGODB_URL = $mongodbUrl" -ForegroundColor Gray
        Write-Host "   - JWT_SECRET = $jwtSecret" -ForegroundColor Gray
        Write-Host "   - PORT = $port" -ForegroundColor Gray
        Write-Host "5. Déployez" -ForegroundColor Gray
    } else {
        Write-Host "❌ Erreur lors du déploiement du frontend" -ForegroundColor Red
    }

} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "📖 Ouverture des guides de déploiement..." -ForegroundColor Yellow
    
    # Ouvrir le guide de déploiement
    Start-Process "https://github.com/florian-billon/voisins-connect/blob/main/QUICK_DEPLOY.md"
    
    Write-Host ""
    Write-Host "🎯 Instructions rapides :" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 BACKEND (Render) :" -ForegroundColor Yellow
    Write-Host "1. https://render.com → New Web Service" -ForegroundColor Gray
    Write-Host "2. Connect GitHub: florian-billon/voisins-connect" -ForegroundColor Gray
    Write-Host "3. Runtime: Docker, Context: /backend" -ForegroundColor Gray
    Write-Host "4. Variables :" -ForegroundColor Gray
    Write-Host "   DATABASE_URL = $databaseUrl" -ForegroundColor Gray
    Write-Host "   MONGODB_URL = $mongodbUrl" -ForegroundColor Gray
    Write-Host "   JWT_SECRET = $jwtSecret" -ForegroundColor Gray
    Write-Host "   PORT = $port" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎨 FRONTEND (Vercel) :" -ForegroundColor Yellow
    Write-Host "1. https://vercel.com → Add New Project" -ForegroundColor Gray
    Write-Host "2. Connect GitHub: florian-billon/voisins-connect" -ForegroundColor Gray
    Write-Host "3. Framework: Next.js, Root: frontend" -ForegroundColor Gray
    Write-Host "4. NEXT_PUBLIC_API_URL = https://voisins-connect-backend.onrender.com" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host "❌ Option invalide" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Pour plus d'informations, consultez QUICK_DEPLOY.md" -ForegroundColor Green
Write-Host ""
