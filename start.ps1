# Ensure the script stops if any command fails
$ErrorActionPreference = "Stop"

Write-Host "Starting Docker Compose..." -ForegroundColor Cyan

# Start Docker Compose in detached mode
docker-compose up -d --build

# Function to display logs in a new detached Command Prompt
function Show-ContainerLogs {
    param (
        [string]$ContainerName = ""
    )

    if ($ContainerName) {
        Write-Host "Showing logs for container: $ContainerName" -ForegroundColor Yellow
        Start-Process "cmd.exe" -ArgumentList "/k docker logs -f $ContainerName"
    } else {
        Write-Host "Showing logs for all containers..." -ForegroundColor Yellow
        Start-Process "cmd.exe" -ArgumentList "/k docker-compose logs -f"
    }
}

# Function to test the health status of Docker containers
function Test-ContainerHealth {
    Write-Host "Checking container health..." -ForegroundColor Yellow
    $unhealthyContainers = docker ps --filter "health=unhealthy" --format "{{.Names}}"
    $exitedContainers = docker ps -a --filter "status=exited" --format "{{.Names}}"

    if ($unhealthyContainers) {
        Write-Host "Some containers are unhealthy:" -ForegroundColor Red
        Write-Host $unhealthyContainers -ForegroundColor Red
        docker-compose ps

        foreach ($container in $unhealthyContainers) {
            Show-ContainerLogs -ContainerName $container
        }

        exit 1
    }

    if ($exitedContainers) {
        Write-Host "Some containers have exited with errors:" -ForegroundColor Red
        Write-Host $exitedContainers -ForegroundColor Red
        docker-compose ps

        foreach ($container in $exitedContainers) {
            Show-ContainerLogs -ContainerName $container
        }

        exit 1
    }

    Write-Host "All containers are healthy!" -ForegroundColor Green
}

# Wait a few seconds to give containers time to initialize
Start-Sleep -Seconds 10

# Perform the container health check
Test-ContainerHealth

Write-Host "Opening log monitoring in a new Command Prompt..." -ForegroundColor Cyan

# Open a new Command Prompt window to monitor all container logs
Show-ContainerLogs

Write-Host "Monitoring logs. Press Ctrl+C in the log window to stop." -ForegroundColor Cyan

# Keep the PowerShell script running to prevent it from closing prematurely
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "Stopping log monitoring..." -ForegroundColor Yellow
    docker-compose down
    exit 0
}
