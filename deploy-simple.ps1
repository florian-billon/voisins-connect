# Automated deployment script for voisins_connect
Write-Host "Automated deployment script - voisins_connect" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js not installed. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js $nodeVersion installed" -ForegroundColor Green

# Environment variables
$databaseUrl = "postgresql://neondb_owner:npg_iVuGFgOAzM64@ep-jolly-water-ahsgdocs-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
$mongodbUrl = "mongodb+srv://helloworld:helloworld@cluster0.o2z1nqe.mongodb.net/?appName=Cluster0"
$jwtSecret = "super_secret_jwt_key_change_in_production_12345"
$port = "3001"

Write-Host ""
Write-Host "Deployment configuration:" -ForegroundColor Cyan
Write-Host "  - GitHub repo: florian-billon/voisins-connect" -ForegroundColor White
Write-Host "  - Backend: Docker (Render)" -ForegroundColor White
Write-Host "  - Frontend: Next.js (Vercel)" -ForegroundColor White
Write-Host ""

Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
npm install -g vercel
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing Vercel CLI" -ForegroundColor Red
    exit 1
}
Write-Host "Vercel CLI installed" -ForegroundColor Green

Write-Host ""
Write-Host "Deploying frontend to Vercel..." -ForegroundColor Yellow
Write-Host "Please login to Vercel in the window that will open" -ForegroundColor Cyan

Set-Location frontend
vercel --prod --yes
Set-Location ..

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend deployed successfully!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "For backend deployment, please visit https://render.com:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor White
    Write-Host "1. https://render.com -> New Web Service" -ForegroundColor Gray
    Write-Host "2. Connect GitHub repo: florian-billon/voisins-connect" -ForegroundColor Gray
    Write-Host "3. Runtime: Docker, Docker Context: /backend" -ForegroundColor Gray
    Write-Host "4. Environment variables:" -ForegroundColor Gray
    Write-Host "   DATABASE_URL = $databaseUrl" -ForegroundColor Gray
    Write-Host "   MONGODB_URL = $mongodbUrl" -ForegroundColor Gray
    Write-Host "   JWT_SECRET = $jwtSecret" -ForegroundColor Gray
    Write-Host "   PORT = $port" -ForegroundColor Gray
    Write-Host "5. Deploy" -ForegroundColor Gray
} else {
    Write-Host "Error deploying frontend" -ForegroundColor Red
}

Write-Host ""
Write-Host "For more information, see QUICK_DEPLOY.md" -ForegroundColor Green
Write-Host ""
