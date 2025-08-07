Write-Host "🧠 Neural News Hub - Vercel Deployment" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

# Function to deploy backend
function Deploy-Backend {
    Write-Host "`n🚀 Deploying Backend..." -ForegroundColor Cyan
    
    # Check if .env file exists
    if (-not (Test-Path "api\.env")) {
        Write-Host "⚠️  Warning: api\.env file not found!" -ForegroundColor Yellow
        Write-Host "Please create api\.env with your environment variables:" -ForegroundColor Yellow
        Write-Host "OPENROUTER_API_KEY=your_key_here" -ForegroundColor Gray
        Write-Host "MONGODB_URI=your_mongodb_uri_here" -ForegroundColor Gray
    }
    
    # Navigate to api directory
    Set-Location "api"
    
    # Deploy to Vercel
    Write-Host "Deploying backend to Vercel..." -ForegroundColor Yellow
    vercel --prod
    
    # Return to root
    Set-Location ".."
}

# Function to deploy frontend
function Deploy-Frontend {
    Write-Host "`n🚀 Deploying Frontend..." -ForegroundColor Cyan
    
    # Check if .env.local file exists
    if (-not (Test-Path "frontend\.env.local")) {
        Write-Host "⚠️  Warning: frontend\.env.local file not found!" -ForegroundColor Yellow
        Write-Host "Please create frontend\.env.local with:" -ForegroundColor Yellow
        Write-Host "NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.vercel.app" -ForegroundColor Gray
    }
    
    # Navigate to frontend directory
    Set-Location "frontend"
    
    # Install dependencies
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    # Deploy to Vercel
    Write-Host "Deploying frontend to Vercel..." -ForegroundColor Yellow
    vercel --prod
    
    # Return to root
    Set-Location ".."
}

# Main deployment flow
Write-Host "`nChoose deployment option:" -ForegroundColor White
Write-Host "1. Deploy Backend only" -ForegroundColor Cyan
Write-Host "2. Deploy Frontend only" -ForegroundColor Cyan
Write-Host "3. Deploy Both (Backend first, then Frontend)" -ForegroundColor Cyan
Write-Host "4. Exit" -ForegroundColor Red

$choice = Read-Host "`nEnter your choice (1-4)"

switch ($choice) {
    "1" {
        Deploy-Backend
        Write-Host "`n✅ Backend deployment completed!" -ForegroundColor Green
        Write-Host "Don't forget to set environment variables in Vercel dashboard." -ForegroundColor Yellow
    }
    "2" {
        Deploy-Frontend
        Write-Host "`n✅ Frontend deployment completed!" -ForegroundColor Green
        Write-Host "Don't forget to set environment variables in Vercel dashboard." -ForegroundColor Yellow
    }
    "3" {
        Deploy-Backend
        Write-Host "`n⏳ Waiting 30 seconds before deploying frontend..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        Deploy-Frontend
        Write-Host "`n✅ Both deployments completed!" -ForegroundColor Green
        Write-Host "Don't forget to set environment variables in Vercel dashboard." -ForegroundColor Yellow
    }
    "4" {
        Write-Host "Deployment cancelled." -ForegroundColor Red
        exit 0
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""  # Blank line for spacing
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Set environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "2. Test your deployed application" -ForegroundColor White
Write-Host "3. Check the DEPLOYMENT.md file for troubleshooting" -ForegroundColor White
