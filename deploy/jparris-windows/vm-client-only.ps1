[CmdletBinding()]
param([string]$HostAddress='192.168.68.71',[switch]$Launch)
$ErrorActionPreference='Stop'
$root='C:\JoshRS-VM'
New-Item -ItemType Directory -Path $root -Force | Out-Null
function Test-Tcp([string]$addr,[int]$port) {
 $c=New-Object Net.Sockets.TcpClient
 try {$a=$c.BeginConnect($addr,$port,$null,$null);if(-not $a.AsyncWaitHandle.WaitOne(2500)){return $false};$c.EndConnect($a);return $true} catch{return $false} finally{$c.Dispose()}
}
if(-not (Test-Tcp $HostAddress 52402)){throw 'Host game port 52402 unavailable. Check server first.'}
Write-Host 'Host game port 52402 reachable.'
if(-not (Test-Tcp $HostAddress 8888)){Write-Warning 'Host web port 8888 unavailable; client may not load.'}
$svc=Get-Service iphlpsvc -ErrorAction SilentlyContinue
if($svc -and $svc.Status -ne 'Running'){try{Start-Service iphlpsvc}catch{Write-Warning 'IP Helper could not be started.'}}
foreach($p in @(52402,8888)){
 $rules=netsh interface portproxy show v4tov4 | Out-String
 $pattern='(?m)^\s*127\.0\.0\.1\s+'+$p+'\s+'+[regex]::Escape($HostAddress)+'\s+'+$p+'\s*$'
 if($rules -match $pattern){Write-Host "Forward $p already configured";continue}
 if(Test-Tcp '127.0.0.1' $p){Write-Warning "Local port $p is in use; not overriding.";continue}
 & netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=$p connectaddress=$HostAddress connectport=$p
 if($LASTEXITCODE -ne 0){throw "Port forward $p failed. Run as Administrator."}
}
$jdks=@(Get-ChildItem (Join-Path $root 'Java') -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue)
if($jdks.Count -eq 0){
 $jdk=Invoke-RestMethod 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jdk&os=windows&vendor=eclipse'
 $zip=Join-Path $env:TEMP 'joshrs-jdk21.zip'
 Remove-Item $zip -Force -ErrorAction SilentlyContinue
 Start-BitsTransfer -Source $jdk[0].binary.package.link -Destination $zip
 if((Get-Item $zip).Length -lt 100MB){throw 'Incomplete Java download.'}
 Expand-Archive $zip (Join-Path $root 'Java') -Force
 $jdks=@(Get-ChildItem (Join-Path $root 'Java') -Directory -Filter 'jdk-21*')
}
$env:JAVA_HOME=$jdks[0].FullName
$env:Path=(Join-Path $env:JAVA_HOME 'bin')+';'+$env:Path
& java -version
if($LASTEXITCODE -ne 0){throw 'Java 21 not working.'}
$client=Join-Path $root 'Client-Java-377'
if(-not (Test-Path (Join-Path $client 'gradlew.bat'))){
 $zip=Join-Path $env:TEMP 'joshrs-client377.zip'
 Remove-Item $zip -Force -ErrorAction SilentlyContinue
 $ProgressPreference='SilentlyContinue'
 Invoke-WebRequest 'https://github.com/LostCityRS/Client-Java/archive/refs/heads/377.zip' -OutFile $zip -UseBasicParsing
 if((Get-Item $zip).Length -lt 10000){throw 'Incomplete client download.'}
 Expand-Archive $zip $root -Force
 if(-not (Test-Path (Join-Path $client 'gradlew.bat'))){throw 'Client extraction failed.'}
}
Write-Host "Client found at $client"
Write-Host ('Host web/update reachable: '+(Test-Tcp $HostAddress 8888))
if(-not $Launch){Write-Host 'Rerun with -Launch to open the client.';exit 0}
if(-not (Test-Tcp $HostAddress 8888)){throw 'Host update port 8888 is unreachable. Fix host service first.'}
$env:GRADLE_OPTS='-Xmx512m -XX:MaxMetaspaceSize=256m'
Push-Location $client
try{
 & '.\gradlew.bat' '--no-daemon' 'run' '--args=10 8808 highmem members 32' '-Dorg.gradle.jvmargs=-Xmx512m -XX:MaxMetaspaceSize=256m'
 if($LASTEXITCODE -ne 0){throw "Client failed: $LASTEXITCODE"}
} finally {Pop-Location}
