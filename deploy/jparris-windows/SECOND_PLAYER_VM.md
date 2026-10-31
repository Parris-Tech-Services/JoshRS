# Play JoshRS from a Windows VM as a second player

This is a **client-only** launcher for the existing JParris Desktop revision-377 server. It does not install another engine, start another world, migrate any account data or change player saves.

## Supported configuration

- Original JoshRS server already runs on the Windows host.
- Windows 11 guest using VirtualBox's default NAT networking (guest normally 10.0.2.15, host reachable as 10.0.2.2).
- Host has both game TCP 52402 and HTTP 8888 available to the guest.
- Guest has internet access to fetch the pinned Java client and, if missing, a free portable Java 21 JDK. Git and winget are not required.
- A separate game account for the second player. Account registration/login is handled by the game server, not this launcher.

Check the connection **inside the VM**:

~~~powershell
Test-NetConnection 10.0.2.2 -Port 52402
Test-NetConnection 10.0.2.2 -Port 8888
~~~

Both should show TcpTestSucceeded: True. If either fails, **do not** run the regular JoshRS setup in the VM. Confirm the host game is still running and the VM is attached to the expected NAT network. The launcher does the same preflight and exits without installing anything when a port is inaccessible.

## One-time install on the Windows VM

In the VM's PowerShell, paste this single command (change the player name if desired):

~~~powershell
$ErrorActionPreference='Stop';$r=Join-Path $env:LOCALAPPDATA 'JoshRS-SecondPlayer';$z=Join-Path $env:TEMP 'JoshRS-SecondPlayer.zip';Invoke-WebRequest 'https://github.com/Parris-Tech-Services/JoshRS/archive/refs/heads/main.zip' -OutFile $z;Expand-Archive -LiteralPath $z -DestinationPath (Join-Path $r 'launcher') -Force;powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $r 'launcher\JoshRS-main\deploy\jparris-windows\second-player-vm.ps1') -HostAddress 10.0.2.2 -PlayerName "SecondPlayer"
~~~

What the script does:
1. Checks the *existing* host's game and web ports **before installing**.
2. Uses an existing JDK 21 or downloads a portable Eclipse Temurin JDK 21 ZIP, verifying the provider's SHA-256 checksum. No Git or winget required.
3. Downloads the pinned Client-Java source ZIP at the exact commit specified in upstreams.json.
4. Patches **only the VM's local copy** of Client.java to connect to 10.0.2.2 and allows this host in the client's host validator.
5. Compiles the client with the Gradle wrapper.
6. Creates the VM desktop shortcut **Play JoshRS - Second Player**, and starts the Java game client.

Enter the separate character name at the RuneScape login screen. The display name passed to the script is a **prompt**, not an automatically provisioned account. Use a different password from the existing character; do not put passwords into command arguments or GitHub.

## Subsequent play sessions

Start the existing server on JParris Desktop first. Then remote into the VM and double-click **Play JoshRS - Second Player**. This starts **only** the VM Java client.

## Troubleshooting

- **A host port is unreachable**: Check that JoshRS is running on JParris Desktop, and that the VM is using VirtualBox NAT with loopback access. Some custom VM/network setups cannot reach host loopback through 10.0.2.2.
- **Game launches but cannot log in**: Check whether the two endpoints respond and review the existing server's login/registration logs. Two open TCP ports are not proof that game login is working.
- **Missing custom map UI or tweaks**: The launcher uses the pinned *upstream* Java 377 client, not a customised copy of your host's Java source. Gameworld data still comes from the existing host.
- **Compilation fails**: Read the Gradle error in the PowerShell window. The installer does not replace the original game server or player saves.
- **Different game ports**: The helper currently uses the pinned launcher manifest (52402 and 8888). Verify actual ports on the host instead of changing the original server to fit the VM.

The source is in [second-player-vm.ps1](second-player-vm.ps1). All client files are under %LOCALAPPDATA%\JoshRS-SecondPlayer on the VM and do not leave that Windows user profile unless explicitly copied.

## Fast recovery after the first installer's missing Git/winget error

The first launcher downloaded the whole JoshRS repository and stopped before installing its client. Reuse those existing setup files; fetch only the corrected script:

~~~powershell
$p="$env:LOCALAPPDATA\JoshRS-SecondPlayer\launcher\JoshRS-main\deploy\jparris-windows";Invoke-WebRequest 'https://raw.githubusercontent.com/Parris-Tech-Services/JoshRS/main/deploy/jparris-windows/second-player-vm.ps1' -OutFile "$p\second-player-vm.ps1";powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$p\second-player-vm.ps1" -PlayerName Sylvie
~~~

This is for existing installations only; new VM setups can use the one-time-install command above.
