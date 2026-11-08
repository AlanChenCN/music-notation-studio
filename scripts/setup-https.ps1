param(
  [Parameter(Mandatory = $true)]
  [string]$LanIp,
  [switch]$NewAuthority
)
$ErrorActionPreference = 'Stop'
$parsedIp = $null
if (-not [System.Net.IPAddress]::TryParse($LanIp, [ref]$parsedIp) -or $parsedIp.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) {
  throw 'LanIp must be a valid IPv4 address.'
}
$projectRoot = Split-Path -Parent $PSScriptRoot
$certDirectory = Join-Path $projectRoot '.cert'
$opensslCommand = Get-Command openssl -ErrorAction SilentlyContinue
$opensslPath = if ($opensslCommand) { $opensslCommand.Source } else { 'C:\Program Files\Git\usr\bin\openssl.exe' }
if (-not (Test-Path -LiteralPath $opensslPath)) { throw 'Install OpenSSL or Git for Windows before running this script.' }
New-Item -ItemType Directory -Force -Path $certDirectory | Out-Null
function Invoke-CertificateCommand([string[]]$CommandArguments) {
  & $opensslPath @CommandArguments
  if ($LASTEXITCODE -ne 0) { throw 'OpenSSL certificate command failed.' }
}
Push-Location $certDirectory
try {
  $caKeyExists = Test-Path -LiteralPath 'local-ca-key.pem'
  $caExists = Test-Path -LiteralPath 'local-ca.pem'
  if ($caKeyExists -ne $caExists) { throw 'The existing CA pair is incomplete. Restore it before continuing.' }
  if ($NewAuthority -and $caExists) {
    $backupDirectory = Join-Path $certDirectory ('archive/' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
    New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
    Get-ChildItem -LiteralPath $certDirectory -File | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $backupDirectory }
    Write-Output "Previous certificates backed up to $backupDirectory"
  }
  if (-not $caExists -or $NewAuthority) {
    @'
[req]
prompt = no
distinguished_name = dn
x509_extensions = ca
[dn]
CN = Local Development CA
[ca]
basicConstraints = critical,CA:TRUE,pathlen:0
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
'@ | Set-Content -LiteralPath 'root.cnf' -Encoding ascii
    Invoke-CertificateCommand @('req', '-x509', '-newkey', 'rsa:3072', '-sha256', '-nodes', '-days', '3650', '-keyout', 'local-ca-key.pem', '-out', 'local-ca.pem', '-config', 'root.cnf')
  }
  @"
[req]
prompt = no
distinguished_name = dn
[dn]
CN = $LanIp
[server]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @names
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
[names]
DNS.1 = localhost
IP.1 = $LanIp
IP.2 = 127.0.0.1
IP.3 = ::1
"@ | Set-Content -LiteralPath 'server.cnf' -Encoding ascii
  Invoke-CertificateCommand @('req', '-new', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-keyout', 'server-key.pem', '-out', 'server.csr', '-config', 'server.cnf')
  Invoke-CertificateCommand @('x509', '-req', '-in', 'server.csr', '-CA', 'local-ca.pem', '-CAkey', 'local-ca-key.pem', '-CAcreateserial', '-out', 'server.pem', '-days', '365', '-sha256', '-extfile', 'server.cnf', '-extensions', 'server')
  Invoke-CertificateCommand @('x509', '-in', 'local-ca.pem', '-outform', 'DER', '-out', 'local-ca.cer')
  Invoke-CertificateCommand @('verify', '-CAfile', 'local-ca.pem', 'server.pem')
  Write-Output "HTTPS certificate ready for https://${LanIp}:8120/ and localhost."
} finally { Pop-Location }
