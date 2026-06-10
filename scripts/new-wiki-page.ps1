param(
  [Parameter(Mandatory = $true)]
  [string]$Title,

  [ValidateSet("source", "entity", "synthesis", "correction")]
  [string]$Type = "synthesis",

  [string]$WikiPath = "my-wiki",
  [string]$Folder = "pages/synthesis",
  [string]$Status = "draft",
  [string]$Confidence = "unknown"
)

$ErrorActionPreference = "Stop"

function ConvertTo-Slug {
  param([string]$Value)
  $slug = $Value.ToLowerInvariant()
  $slug = $slug -replace "[^a-z0-9]+", "-"
  $slug = $slug.Trim("-")
  if ([string]::IsNullOrWhiteSpace($slug)) {
    $slug = "page"
  }
  return $slug
}

$slug = ConvertTo-Slug $Title
$targetDir = Join-Path $WikiPath $Folder
if (-not (Test-Path -LiteralPath $targetDir)) {
  New-Item -ItemType Directory -Path $targetDir | Out-Null
}

$targetPath = Join-Path $targetDir "$slug.md"
if (Test-Path -LiteralPath $targetPath) {
  throw "Page already exists: $targetPath"
}

$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$frontmatter = [ordered]@{
  id = "page_$($Type)_$($slug -replace '-', '_')"
  type = $Type
  title = $Title
  created_at = $now
  updated_at = $now
  sources = @()
  confidence = $Confidence
  status = $Status
  links = @()
}

$json = $frontmatter | ConvertTo-Json -Depth 10
$body = @(
  "---"
  $json
  "---"
  ""
  "# $Title"
  ""
  "## Notes"
  ""
  "- TODO"
  ""
) -join [Environment]::NewLine

Set-Content -LiteralPath $targetPath -Value $body -Encoding UTF8
Write-Host "Created page $targetPath"
