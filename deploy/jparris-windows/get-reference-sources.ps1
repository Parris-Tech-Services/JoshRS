[CmdletBinding()]
param([switch]$IncludeExperimental)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$exe=Get-Command git.exe -ErrorAction Stop
$specs=@(
  @{Path='integrations/reference-sources/runelite';Url='https://github.com/runelite/runelite.git';Commit='71250e778a9f3c6e8abc06abc9a4112f7051743a';Experimental=$false},
  @{Path='integrations/reference-sources/rs-map-viewer';Url='https://github.com/dennisdev/rs-map-viewer.git';Commit='d3c569b1cde38aac6182dd141fc4c84beaf06798';Experimental=$false},
  @{Path='integrations/reference-sources/jar-re';Url='https://github.com/boriitoo/jar-re.git';Commit='1144ca46937ff77f0e4db6769e015f22bd5be6f4';Experimental=$false},
  @{Path='integrations/reference-sources/web-client-377';Url='https://github.com/reinismu/runescape-web-client-377.git';Commit='e017366aa6eba47b01ba60ddf98418abd222e75b';Experimental=$true},
  @{Path='integrations/reference-sources/refactored-client-377';Url='https://github.com/Promises/refactored-client-377.git';Commit='c4f513540fc8654d2394be1e38324de24ed116dc';Experimental=$true},
  @{Path='integrations/reference-sources/refactored-client-317';Url='https://github.com/Rabrg/refactored-client.git';Commit='7ce18d0ef017ed7e9edcc5b38cf21ea2c85bdd54';Experimental=$true},
  @{Path='integrations/reference-sources/osrs-steam';Url='https://github.com/Runescape-Reversed/OSRS-Steam.git';Commit='e1c182afc7eda45775b9dbe8cea49e892a3578b3';Experimental=$true},
  @{Path='integrations/reference-sources/runescape-worldmap';Url='https://github.com/eduardocopat/runescape-worldmap.git';Commit='f6be4ed4919f40238acef458e9c946c4d02c5007';Experimental=$true}
)
foreach($spec in $specs){
 if($spec.Experimental -and -not $IncludeExperimental){continue}
 $dest=Join-Path $repo $spec.Path
 if(Test-Path -LiteralPath $dest){
   if(-not (Test-Path -LiteralPath $dest -PathType Container)){throw "Destination is a file: $dest"}
   if(Test-Path -LiteralPath (Join-Path $dest '.git')){
     $head=(& $exe.Source -C $dest rev-parse HEAD).Trim()
     if($head -ne $spec.Commit){Write-Warning "Existing checkout differs for $($spec.Path): $head (expected $($spec.Commit)). No changes made."}
     else{Write-Host "Already pinned: $($spec.Path)"}
     continue
   }
   $children=@(Get-ChildItem -LiteralPath $dest -Force)
   if($children.Count -gt 0){throw "Destination exists with files but no Git checkout: $dest. Refusing overwrite."}
   # GitHub source ZIPs may contain empty placeholder directories for submodules.
   Remove-Item -LiteralPath $dest -Force
 }
 New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force | Out-Null
 & $exe.Source clone --quiet --no-checkout $spec.Url $dest
 if($LASTEXITCODE -ne 0){throw "Clone failed: $($spec.Path)"}
 & $exe.Source -C $dest checkout --quiet --detach $spec.Commit
 if($LASTEXITCODE -ne 0){throw "Could not checkout pin for $($spec.Path)"}
 Write-Host "Ready: $($spec.Path)"
}
Write-Host 'Reference source downloads complete. No JoshRS runtime, game cache or player saves changed.'
