Get-ChildItem -Path 'e:\northbridge-university-sims' -Recurse -File | ForEach-Object {
    $content = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8
    $new = $content -replace '(?i)cgc university', 'CGC UNIVERSITY'
    if ($new -ne $content) {
        Set-Content -LiteralPath $_.FullName -Value $new -Encoding UTF8
        Write-Host "Updated: $($_.FullName)"
    }
}
