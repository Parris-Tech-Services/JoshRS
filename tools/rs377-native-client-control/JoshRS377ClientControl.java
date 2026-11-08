package jagex2.client;

import jagex2.config.IdkType;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Opt-in, loopback-only, isolated-Harness-client controls for revision 377.
 * Never starts in an ordinary family/game client, never changes server state
 * except by the exact normal legacy IF_PLAYERDESIGN packet on acceptance.
 *
 * Client state is touched ONLY from Client.update(), not the socket thread.
 * This is a separate native-client companion, NOT a privileged engine API.
 *
 * Env: JOSHRS_377_CLIENT_CONTROL_ENABLED=true
 *      JOSHRS_377_CLIENT_CONTROL_WORLD=isolated-...
 *      JOSHRS_377_CLIENT_CONTROL_BOT=Harness...
 *      JOSHRS_377_CLIENT_CONTROL_PORT=19083 (loopback only)
 *      JOSHRS_377_CLIENT_GAME_PORT=15402 (isolated world, NOT 52402)
 *      JOSHRS_377_CLIENT_CONTROL_TOKEN=<32+ ASCII chars>
 *
 * One authenticated request per TCP connection:
 *   token TAB action arg \n
 * Actions: status, setTab(0..13), randomizeCharacterDesign,
 *          acceptCharacterDesign. Responses describe local state or packet
 * enqueue ONLY: never claim account-save/relogin/quest verification.
 */
public final class JoshRS377ClientControl {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int PLAYER_KIT_INTERFACE = 3559; // pinned Content pack/interface.pack
    private final ArrayBlockingQueue<Request> queue = new ArrayBlockingQueue<Request>(8);
    private final String token;
    private final String bot;
    private final int gamePort;
    private final ServerSocket server;

    private static final class Request {
        final String action;
        final int argument;
        final CountDownLatch done = new CountDownLatch(1);
        volatile String result = "ERR|controller_not_ready";
        Request(String action, int argument) { this.action = action; this.argument = argument; }
    }

    public JoshRS377ClientControl() {
        String enabled = System.getenv("JOSHRS_377_CLIENT_CONTROL_ENABLED");
        String world = System.getenv("JOSHRS_377_CLIENT_CONTROL_WORLD");
        String username = System.getenv("JOSHRS_377_CLIENT_CONTROL_BOT");
        String secret = System.getenv("JOSHRS_377_CLIENT_CONTROL_TOKEN");
        String portText = System.getenv("JOSHRS_377_CLIENT_CONTROL_PORT");
        String gamePortText = System.getenv("JOSHRS_377_CLIENT_GAME_PORT");
        if (!"true".equals(enabled)) {
            token = null; bot = null; server = null; gamePort = -1;
            return;
        }
        if (world == null || !world.matches("isolated-[a-zA-Z0-9_-]{4,64}") ||
            username == null || !username.matches("Harness[A-Za-z0-9_-]{1,10}") ||
            secret == null || secret.length() < 32 || secret.length() > 128 ||
            !secret.matches("[A-Za-z0-9_-]+") ||
            portText == null || !portText.matches("[0-9]{4,5}") ||
            gamePortText == null || !gamePortText.matches("[0-9]{4,5}")) {
            throw new IllegalArgumentException("Invalid isolated JoshRS client control configuration");
        }
        int port = Integer.parseInt(portText);
        int targetGamePort = Integer.parseInt(gamePortText);
        if (targetGamePort < 1024 || targetGamePort > 65535 ||
            targetGamePort == 52402 || targetGamePort == 8888 ||
            targetGamePort == port) {
            throw new IllegalArgumentException("Never attach client controls to a family game port");
        }
        if (port < 1024 || port > 65535 || port == 52402 || port == 8888 ||
            port == 15402 || port == 18880 || port == 18881) {
            throw new IllegalArgumentException("Dedicated non-family loopback client-control port required");
        }
        try {
            server = new ServerSocket(port, 2, InetAddress.getByName("127.0.0.1"));
            server.setSoTimeout(3000);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot open isolated loopback native-client control", e);
        }
        token = secret;
        bot = username;
        gamePort = targetGamePort;
        Thread thread = new Thread(new Runnable() {
            public void run() { listen(); }
        }, "JoshRS377-isolated-client-control");
        thread.setDaemon(true);
        thread.start();
    }

    private static String readLineBounded(Socket socket) throws Exception {
        java.io.InputStream input = socket.getInputStream();
        byte[] bytes = new byte[300];
        int size = 0;
        while (size < bytes.length) {
            int ch = input.read();
            if (ch == -1 || ch == '\n') break;
            if (ch == '\r' || ch < 32 || ch > 126) {
                if (ch != '\t') throw new IllegalArgumentException("invalid_control_character");
            }
            bytes[size++] = (byte) ch;
        }
        if (size == 0 || size >= bytes.length) throw new IllegalArgumentException("invalid_control_frame");
        return new String(bytes, 0, size, StandardCharsets.US_ASCII);
    }

    private void listen() {
        while (server != null && !server.isClosed()) {
            try {
                Socket socket = server.accept();
                try {
                    socket.setSoTimeout(3000);
                    String line = readLineBounded(socket);
                    String[] parts = line.split("\t", -1);
                    String answer = "ERR|invalid_request";
                    if (parts.length == 3 &&
                        MessageDigest.isEqual(parts[0].getBytes(StandardCharsets.US_ASCII),
                                              token.getBytes(StandardCharsets.US_ASCII))) {
                        if (!parts[2].matches("[0-9]{1,2}")) {
                            answer = "ERR|invalid_argument";
                        } else {
                            int arg = Integer.parseInt(parts[2]);
                            Request request = new Request(parts[1], arg);
                            if (!queue.offer(request)) answer = "ERR|client_busy";
                            else if (!request.done.await(3500, TimeUnit.MILLISECONDS))
                                answer = "ERR|client_tick_timeout";
                            else answer = request.result;
                        }
                    }
                    BufferedWriter output = new BufferedWriter(
                        new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.US_ASCII));
                    output.write(answer);
                    output.write("\n");
                    output.flush();
                } finally { socket.close(); }
            } catch (java.net.SocketTimeoutException ignored) {
                // Reschedule so disabled/shutdown clients can eventually close.
            } catch (Exception ignored) {
                // Credentials and game state never enter logs or exceptions.
            }
        }
    }

    public void pump(Client client) {
        if (server == null) return;
        Request req = queue.poll();
        if (req == null) return;
        try { req.result = apply(client, req.action, req.argument); }
        catch (RuntimeException ignored) { req.result = "ERR|client_action_refused"; }
        finally { req.done.countDown(); }
    }

    private static boolean designOpen(Client client) {
        // This is the actual main interface used by [tutorial.rs2] and packed
        // Content '3559=player_kit'. Do not send design packets in other UI.
        return client.viewportInterfaceId == PLAYER_KIT_INTERFACE;
    }

    private static boolean designValid(Client client) {
        if (IdkType.field1699 == null || IdkType.field1698 <= 0) return false;
        for (int i = 0; i < 7; i++) {
            int kit = client.designKits[i];
            if (kit < 0 || kit >= IdkType.field1698 ||
                IdkType.field1699[kit] == null ||
                IdkType.field1699[kit].field1705 ||
                IdkType.field1699[kit].field1700 != i + (client.designGender ? 0 : 7)) return false;
        }
        for (int i = 0; i < 5; i++) {
            int colour = client.designColours[i];
            if (colour < 0 || colour >= Client.DESIGN_BODY_COLOUR[i].length) return false;
        }
        return true;
    }

    private static String status(Client client) {
        int sum = 0;
        for (int i = 0; i < 7; i++) sum = sum * 31 + client.designKits[i];
        for (int i = 0; i < 5; i++) sum = sum * 31 + client.designColours[i];
        return "OK|status|" + client.selectedTab + "|" +
            (designOpen(client) ? 1 : 0) + "|" + (client.designGender ? 0 : 1) +
            "|" + (sum & 0x7fffffff) + "|" + client.loopCycle;
    }

    private String apply(Client client, String action, int arg) {
        // The controller must never select a family user, login screen or
        // disconnected client. Separate isolated bot identity is mandatory.
        if (!client.ingame || client.username == null ||
            !client.username.equalsIgnoreCase(bot) ||
            Client.portOffset + 43594 != gamePort) return "ERR|isolated_bot_or_world_port_not_authenticated";
        if ("status".equals(action)) return status(client);
        if ("setTab".equals(action)) {
            if (arg < 0 || arg > 13 || client.tabInterfaceId[arg] == -1)
                return "ERR|tab_not_available";
            client.selectedTab = arg;
            client.redrawSidebar = true;
            client.redrawSideicons = true;
            return "OK|tab|" + client.selectedTab + "|" + client.loopCycle;
        }
        if (!designOpen(client)) return "ERR|player_kit_interface_not_open";
        if ("randomizeCharacterDesign".equals(action)) {
            if (IdkType.field1699 == null || IdkType.field1698 <= 0)
                return "ERR|identity_kits_not_loaded";
            boolean gender = RANDOM.nextBoolean();
            int[] kits = new int[7];
            for (int i = 0; i < 7; i++) {
                int count = 0;
                for (int j = 0; j < IdkType.field1698; j++) {
                    IdkType type = IdkType.field1699[j];
                    if (type != null && !type.field1705 &&
                        type.field1700 == i + (gender ? 0 : 7)) count++;
                }
                if (count < 1) return "ERR|identity_kit_category_unavailable";
                int selection = RANDOM.nextInt(count);
                for (int j = 0; j < IdkType.field1698; j++) {
                    IdkType type = IdkType.field1699[j];
                    if (type != null && !type.field1705 &&
                        type.field1700 == i + (gender ? 0 : 7)) {
                        if (selection-- == 0) { kits[i] = j; break; }
                    }
                }
            }
            client.designGender = gender;
            System.arraycopy(kits, 0, client.designKits, 0, 7);
            for (int i = 0; i < 5; i++)
                client.designColours[i] = RANDOM.nextInt(Client.DESIGN_BODY_COLOUR[i].length);
            client.updateDesignModel = true;
            return "OK|randomized|" + client.loopCycle + "|" + status(client);
        }
        if ("acceptCharacterDesign".equals(action)) {
            if (!designValid(client)) return "ERR|invalid_design_values";
            // Exact native Client-Java 377 handleInterfaceAction(clientCode=326).
            // Unlike server admin commands, this is a normal ISAAC gameplay
            // packet and has no authority to directly set another player.
            client.out.p1isaac(163);
            client.out.p1(client.designGender ? 0 : 1);
            for (int i = 0; i < 7; i++) client.out.p1(client.designKits[i]);
            for (int i = 0; i < 5; i++) client.out.p1(client.designColours[i]);
            return "OK|design_packet_queued_unverified|" + client.loopCycle;
        }
        return "ERR|unsupported_client_action";
    }
}
