# Run from a source checkout with dsh and npm on PATH. Keep the isolated profile for inspection.
param([Parameter(Mandatory)][string]$Tarball)
$ErrorActionPreference = 'Stop'
$archive = (Resolve-Path -LiteralPath $Tarball).Path
$driver = (Resolve-Path (Join-Path $PSScriptRoot 'driver.cjs')).Path.Replace('\','/').Replace("'","''")
$runDir = New-Item -ItemType Directory -Path (Join-Path ([IO.Path]::GetTempPath()) ('dsh-swarm-' + [guid]::NewGuid()))
$previous = $env:DSH_HOME
Push-Location $runDir
try {
  $env:DSH_HOME = Join-Path $runDir 'home'
  dsh headless --dump-config | Out-Null
  if ($LASTEXITCODE) { throw 'Could not initialize the isolated DSH profile' }
  dsh plugin --profile headless add $archive
  if ($LASTEXITCODE) { throw 'Tarball installation failed' }
  @"
- id: headless-runner
  disabled: true
- insert:
    - id: swarm-package-smoke
      name: '$driver'
"@ | Set-Content smoke.yml -Encoding utf8
  $output = dsh headless --patch (Join-Path $runDir 'smoke.yml') check
  $output | Out-Host
  if ($LASTEXITCODE -ne 0 -or -not ($output -match '^SMOKE PASS:')) { throw 'Swarm runtime assertions did not pass' }
} finally {
  Pop-Location
  $env:DSH_HOME = $previous
  Write-Host "Isolated DSH profile: $runDir"
}
