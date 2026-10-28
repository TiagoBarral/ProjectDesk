param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$migrationRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$cloneRoot = Split-Path -Parent $migrationRoot
$archivePath = Join-Path $migrationRoot 'projectdesk-private.7z'

$sevenZipCandidates = @(
  'C:\Program Files\7-Zip\7z.exe',
  'C:\Program Files\Git\usr\bin\7z.exe'
)
$sevenZipPath = $sevenZipCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1

if (-not $sevenZipPath) {
  throw '7-Zip was not found. Install 7-Zip, then run this script again.'
}

if (-not (Test-Path -LiteralPath $archivePath -PathType Leaf)) {
  throw "Missing encrypted archive: $archivePath"
}

if (-not (Test-Path -LiteralPath (Join-Path $cloneRoot 'package.json') -PathType Leaf)) {
  throw "The parent folder does not look like a ProjectDesk clone: $cloneRoot"
}

$securePassword = Read-Host 'Migration archive password' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$plainPassword = $null
$extractRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("projectdesk-migration-" + [guid]::NewGuid().ToString('N'))

try {
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  New-Item -ItemType Directory -Path $extractRoot | Out-Null

  & $sevenZipPath x $archivePath "-o$extractRoot" "-p$plainPassword" -y | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'The archive could not be extracted. Check the password and try again.'
  }

  $files = @(
    @{ Source = Join-Path $extractRoot '.env'; Destination = Join-Path $cloneRoot '.env' },
    @{ Source = Join-Path $extractRoot '_private\CREDENTIALS.md'; Destination = Join-Path $cloneRoot '_private\CREDENTIALS.md' },
    @{ Source = Join-Path $extractRoot '_private\JOURNAL.md'; Destination = Join-Path $cloneRoot '_private\JOURNAL.md' },
    @{ Source = Join-Path $extractRoot '_private\NEW_COMPUTER_HANDOFF.md'; Destination = Join-Path $cloneRoot '_private\NEW_COMPUTER_HANDOFF.md' }
  )

  New-Item -ItemType Directory -Force -Path (Join-Path $cloneRoot '_private') | Out-Null

  foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath $file.Source -PathType Leaf)) {
      throw "The archive is missing an expected file: $($file.Source)"
    }

    if ((Test-Path -LiteralPath $file.Destination) -and -not $Force) {
      throw "Refusing to overwrite existing file: $($file.Destination). Re-run with -Force only after checking it."
    }

    Copy-Item -LiteralPath $file.Source -Destination $file.Destination -Force:$Force
  }

  Write-Host "ProjectDesk private files restored to $cloneRoot"
  Write-Host 'Next: npm install, npm run test:run, npm run lint, npm run build, npm run dev'
}
finally {
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }

  $plainPassword = $null

  if (Test-Path -LiteralPath $extractRoot) {
    Remove-Item -LiteralPath $extractRoot -Recurse -Force
  }
}

