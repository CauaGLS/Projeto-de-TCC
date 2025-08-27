$backend = ".\backend\.env"
$frontend = ".\frontend\.env"
$origem = ".\.env"

Copy-Item -Path $origem -Destination $backend -Force
Copy-Item -Path $origem -Destination $frontend -Force


Write-Host ".env atualizados"
