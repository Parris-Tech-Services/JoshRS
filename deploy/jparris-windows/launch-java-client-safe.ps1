[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ClientPath,
    [Parameter(Mandatory)][ValidateRange(1,65535)][int]$PortOffset
)
$ErrorActionPreference = 'Stop'

# The standard 377 Client-Java build.gradle declares jagex2.client.Client
# as the application entry point. Gradle owns its genuine runtime classpath.
# Launch via 'run' with --no-daemon instead of constructing a fragile Java
# -D/-cp/-jar command line in Windows PowerShell 5.1.
$client = (Resolve-Path -LiteralPath $ClientPath -ErrorAction Stop).Path
$wrapper = Join-Path $client 'gradlew.bat'
if (-not (Test-Path -LiteralPath $wrapper -PathType Leaf)) {
    throw "Expected Java client Gradle wrapper is missing: $wrapper"
}
$buildFile = Join-Path $client 'build.gradle'
if (-not (Test-Path -LiteralPath $buildFile -PathType Leaf)) {
    throw 'The configured client has no build.gradle; refusing to launch an unknown client.'
}
if (-not (Select-String -LiteralPath $buildFile -Pattern 'jagex2\.client\.Client' -Quiet)) {
    throw 'The configured Java client has an unexpected main class. No fallback launch attempted.'
}

$clientArguments = "10 $PortOffset highmem members 32"
$oldJavaOptions = $env:JAVA_TOOL_OPTIONS
try {
    # This recognised JVM environment variable bypasses Windows PowerShell
    # 5.1's fragile native argument marshalling of -Dxxx=value options.
    # The correct Java2D property is sun.java2d.d3d, not java2d.d3d.
    if ($oldJavaOptions -notmatch '(?:^|\s)-Dsun\.java2d\.d3d=') {
        $env:JAVA_TOOL_OPTIONS = (($oldJavaOptions + ' -Dsun.java2d.d3d=false').Trim())
    }
    Push-Location -LiteralPath $client
    try {
        Write-Host "Starting JoshRS Java client using Gradle without a persistent daemon (args: $clientArguments)"
        & $wrapper --no-daemon run "--args=$clientArguments"
        $result = $LASTEXITCODE
        if ($result -ne 0) { throw "Java client launcher exited with code $result" }
    } finally {
        Pop-Location
    }
} finally {
    # Restore this process's environment, never change permanent Java settings.
    $env:JAVA_TOOL_OPTIONS = $oldJavaOptions
}
