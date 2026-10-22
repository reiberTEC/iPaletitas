# Crea la base ipaletitas y aplica 001_schema.sql + 002_seed.sql
# Uso: clic derecho → Ejecutar con PowerShell, o:
#   cd database
#   .\crear.ps1

$ErrorActionPreference = 'Stop'
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$aqui = $PSScriptRoot

if (-not (Test-Path $psql)) {
  Write-Host "No encontré psql en: $psql"
  Write-Host "Ajusta la ruta en este script si tu versión de PostgreSQL es otra."
  exit 1
}

Write-Host "Conexión a PostgreSQL como usuario 'postgres'."
$seguro = Read-Host -AsSecureString "Contraseña de postgres"
$BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

$env:PGCLIENTENCODING = 'UTF8'

function Invoke-Psql([string[]]$ArgsExtra) {
  & $psql -U postgres -h 127.0.0.1 -v ON_ERROR_STOP=1 @ArgsExtra
  if ($LASTEXITCODE -ne 0) { throw "psql falló (código $LASTEXITCODE)" }
}

Write-Host ""
Write-Host "1/3 Creando base ipaletitas (si no existe)..."
$existe = & $psql -U postgres -h 127.0.0.1 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'ipaletitas'"
if ($existe -ne '1') {
  Invoke-Psql @('-d', 'postgres', '-c', "CREATE DATABASE ipaletitas WITH ENCODING 'UTF8' TEMPLATE template0")
  Write-Host "   Base creada."
} else {
  Write-Host "   Ya existía; se reutiliza."
}

Write-Host "2/3 Aplicando esquema (001_schema.sql)..."
Invoke-Psql @('-d', 'ipaletitas', '-f', (Join-Path $aqui '001_schema.sql'))

Write-Host "3/3 Semilla: planes, cupones, staff (002_seed.sql)..."
Invoke-Psql @('-d', 'ipaletitas', '-f', (Join-Path $aqui '002_seed.sql'))

$tablas = & $psql -U postgres -h 127.0.0.1 -d ipaletitas -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
$planes = & $psql -U postgres -h 127.0.0.1 -d ipaletitas -tAc "SELECT count(*) FROM planes"

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Listo. Tablas públicas: $tablas · Planes: $planes"
Write-Host "Staff de prueba: admin@ipaletitas.com / ipaletitas-dev"
Write-Host "Conexión: postgresql://postgres:***@127.0.0.1:5432/ipaletitas"
Write-Host ""
Write-Host "Punto 1 completado. Cuando confirmes, seguimos con el punto 2 (API + login)."
