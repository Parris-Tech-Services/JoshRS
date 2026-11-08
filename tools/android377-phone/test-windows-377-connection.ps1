# A byte-accurate Windows socket client for a genuine, separate, disposable
# LostCity Engine-TS rev-377 game listener. Never sends a password or touches saves.
# Run only against a server whose 377 source and loopback configuration were
# independently verified. This is NOT an authenticated player or game test.
[CmdletBinding()]
param(
    [ValidateRange(1,65535)][int]$GamePort = 15402,
    [ValidateRange(1,65535)][int]$WebPort = 18880
)
$ErrorActionPreference = 'Stop'

$client = [System.Net.Sockets.TcpClient]::new()
try {
    $client.ReceiveTimeout = 6000
    $client.SendTimeout = 6000
    $client.Connect('127.0.0.1', $GamePort)
    $stream = $client.GetStream()
    $request = [byte[]]@(14, 0)
    $stream.Write($request, 0, $request.Length)
    $response = [byte[]]::new(17)
    $received = 0
    while ($received -lt $response.Length) {
        $n = $stream.Read($response, $received, $response.Length - $received)
        if ($n -le 0) { throw "377 server closed after $received response bytes" }
        $received += $n
    }
    for ($i = 0; $i -lt 9; $i++) {
        if ($response[$i] -ne 0) { throw "377 login negotiation rejected at header byte $i" }
    }
    # The final eight bytes contain a server nonce. Do not log or retain it.
} finally {
    $client.Dispose()
}
$web = [System.Net.Sockets.TcpClient]::new()
try {
    $web.Connect('127.0.0.1', $WebPort)
} finally {
    $web.Dispose()
}
Write-Output 'VERIFIED_WINDOWS_377_NEGOTIATION: 17-byte handshake and separate web port. NO account login or game state asserted.'
