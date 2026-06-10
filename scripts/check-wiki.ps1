param(
  [string]$WikiPath = "my-wiki"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $WikiPath)) {
  throw "Wiki path does not exist: $WikiPath"
}

$pagesRoot = Join-Path $WikiPath "pages"
if (-not (Test-Path -LiteralPath $pagesRoot)) {
  throw "Missing pages directory: $pagesRoot"
}

$required = @("id", "type", "title", "created_at", "updated_at", "sources", "confidence", "status", "links")
$errors = New-Object System.Collections.Generic.List[string]
$pages = Get-ChildItem -Path $pagesRoot -Filter "*.md" -Recurse

foreach ($page in $pages) {
  $content = Get-Content -LiteralPath $page.FullName -Raw
  if (-not $content.StartsWith("---")) {
    $errors.Add("Missing frontmatter: $($page.FullName)")
    continue
  }

  $match = [regex]::Match($content, "(?s)^---\s*(.*?)\s*---")
  if (-not $match.Success) {
    $errors.Add("Invalid frontmatter fence: $($page.FullName)")
    continue
  }

  try {
    $meta = $match.Groups[1].Value | ConvertFrom-Json
  } catch {
    $errors.Add("Invalid JSON frontmatter: $($page.FullName)")
    continue
  }

  foreach ($field in $required) {
    if (-not $meta.PSObject.Properties.Name.Contains($field)) {
      $errors.Add("Missing '$field' in $($page.FullName)")
    }
  }
}

if ($errors.Count -gt 0) {
  $errors | ForEach-Object { Write-Error $_ }
  throw "Wiki validation failed with $($errors.Count) error(s)."
}

Write-Host "Wiki validation passed: $($pages.Count) page(s)."
