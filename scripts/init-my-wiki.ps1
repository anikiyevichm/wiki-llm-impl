param(
  [string]$WikiPath = "my-wiki",
  [string]$Title = "Mikita's Local LLM Wiki"
)

$ErrorActionPreference = "Stop"

function New-DirIfMissing {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

$dirs = @(
  $WikiPath,
  (Join-Path $WikiPath "pages"),
  (Join-Path $WikiPath "pages/person"),
  (Join-Path $WikiPath "pages/project"),
  (Join-Path $WikiPath "pages/tasks"),
  (Join-Path $WikiPath "sources"),
  (Join-Path $WikiPath "sources/manifests"),
  (Join-Path $WikiPath "sources/raw"),
  (Join-Path $WikiPath "indexes"),
  (Join-Path $WikiPath "error-book"),
  (Join-Path $WikiPath "error-book/entries"),
  (Join-Path $WikiPath "runs"),
  (Join-Path $WikiPath "runs/ingest"),
  (Join-Path $WikiPath "runs/retrieval")
)

foreach ($dir in $dirs) {
  New-DirIfMissing $dir
}

$configPath = Join-Path $WikiPath "config.json"
if (-not (Test-Path -LiteralPath $configPath)) {
  $now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  $config = [ordered]@{
    schema_version = 1
    workspace_id = "wiki_local_mikita"
    title = $Title
    default_language = "mixed"
    privacy_mode = "personal"
    created_at = $now
    updated_at = $now
    notes = "Local dogfood workspace for wiki-llm-impl. This directory is intentionally gitignored."
  }
  $config | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $configPath -Encoding UTF8
}

$indexPath = Join-Path $WikiPath "index.md"
if (-not (Test-Path -LiteralPath $indexPath)) {
  @"
# Wiki Index

Content-oriented catalog for $Title.

No pages yet.
"@ | Set-Content -LiteralPath $indexPath -Encoding UTF8
}

$logPath = Join-Path $WikiPath "log.md"
if (-not (Test-Path -LiteralPath $logPath)) {
  $today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
  @"
# Wiki Log

Append-only chronological record of local wiki operations.

## [$today] init | $Title

- Workspace initialized.
"@ | Set-Content -LiteralPath $logPath -Encoding UTF8
}

Write-Host "Initialized wiki workspace at $WikiPath"
