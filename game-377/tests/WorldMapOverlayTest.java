package jagex2.client;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.List;
import java.util.Properties;
import javax.imageio.ImageIO;

/**
 * Automated verification suite for the client-side interactive WorldMapOverlay.
 */
public class WorldMapOverlayTest {

	private static void assertTrue(boolean cond, String msg) {
		if (!cond) {
			throw new AssertionError("Assertion failed: " + msg);
		}
	}

	private static void assertEquals(Object expected, Object actual, String msg) {
		if (expected == null ? actual != null : !expected.equals(actual)) {
			throw new AssertionError(msg + " - expected: " + expected + ", actual: " + actual);
		}
	}

	public static void main(String[] args) throws Exception {
		System.out.println("=== Running WorldMapOverlay Client Verification Suite ===");
		WorldMapOverlay map = new WorldMapOverlay(null);

		// 1. Verify worldmap_377.png loaded
		assertTrue(map.mapImage != null, "worldmap_377.png must load");
		assertEquals(Integer.valueOf(3328), Integer.valueOf(map.mapImage.getWidth()), "Map width");
		assertEquals(Integer.valueOf(2560), Integer.valueOf(map.mapImage.getHeight()), "Map height");
		System.out.println("  [PASS] Loaded worldmap_377.png (3328x2560)");

		// 2. Verify destinations & labels
		assertTrue(WorldMapOverlay.DESTINATIONS.size() >= 35, "Expected >= 35 destinations");
		assertTrue(WorldMapOverlay.LABELS.size() >= 90, "Expected >= 90 map labels");
		assertTrue(WorldMapOverlay.getDestinationById("varrock") != null, "Varrock present");
		assertTrue(WorldMapOverlay.getDestinationById("varrock_portal_hub") != null, "Portal Hub present");
		assertTrue(WorldMapOverlay.getDestinationById("yanille") != null, "Yanille present");
		System.out.println("  [PASS] Verified " + WorldMapOverlay.DESTINATIONS.size() + " destinations and " + WorldMapOverlay.LABELS.size() + " map labels");

		// 3. Verify zoom and pan math
		BufferedImage canvas = new BufferedImage(1148, 755, BufferedImage.TYPE_INT_RGB);
		Graphics2D g = canvas.createGraphics();
		map.visible = true;
		map.centerX = 3213.0;
		map.centerZ = 3424.0;
		map.zoom = 1.0;
		map.render(g, 1148, 755);

		int sx = map.tileToScreenX(3213);
		int sy = map.tileToScreenY(3424);
		double roundTripX = map.screenToTileX(sx);
		double roundTripZ = map.screenToTileZ(sy);
		assertTrue(Math.abs(roundTripX - 3213.0) < 1.0, "Round-trip tile X");
		assertTrue(Math.abs(roundTripZ - 3424.0) < 1.0, "Round-trip tile Z");

		map.adjustZoom(1.5, sx, sy);
		assertTrue(Math.abs(map.zoom - 1.5) < 0.01, "Zoom in updated zoom factor");
		map.handleMousePressed(sx + 50, sy + 50, 1);
		map.handleMouseDragged(sx + 10, sy + 20);
		map.handleMouseReleased(sx + 10, sy + 20);
		assertTrue(map.centerX > 3213.0, "Dragging left pans centerX east");
		System.out.println("  [PASS] Verified smooth zoom and click-and-drag pan coordinate math");

		// 4. Verify search, category, and region filtering
		map.searchQuery = "Varrock";
		map.categoryFilter = "All";
		map.regionFilter = "All Regions";
		List<WorldMapOverlay.Destination> varrockMatches = map.getFilteredDestinations();
		assertTrue(varrockMatches.size() >= 3, "Search 'Varrock' should match Varrock Square, Portal Hub, Varrock Sewers");

		map.searchQuery = "";
		map.categoryFilter = "Guilds";
		List<WorldMapOverlay.Destination> guildMatches = map.getFilteredDestinations();
		assertTrue(guildMatches.size() >= 5, "Category 'Guilds' should have >= 5 guilds");

		map.categoryFilter = "Cities";
		map.regionFilter = "Kandarin";
		List<WorldMapOverlay.Destination> kandarinCities = map.getFilteredDestinations();
		assertTrue(kandarinCities.size() >= 5, "Kandarin Cities should include Camelot, Seers, Catherby, Ardougne, Yanille");
		map.categoryFilter = "All";
		map.regionFilter = "All Regions";
		System.out.println("  [PASS] Verified search, category, and region filtering");

		// 5. Verify dangerous teleport confirmation & command queueing
		Client.pendingCheatCommands.clear();
		map.confirmDangerous = true;
		WorldMapOverlay.Destination sewers = WorldMapOverlay.getDestinationById("varrock_sewers");
		map.requestTeleport(sewers, false);
		assertEquals(sewers, map.pendingDangerousDestination, "Dangerous destination must open confirmation modal first");
		assertTrue(Client.pendingCheatCommands.isEmpty(), "Must not queue command before confirmation");

		map.requestTeleport(sewers, true);
		assertEquals(null, map.pendingDangerousDestination, "Confirmation clears pending modal");
		assertEquals("tele_dest varrock_sewers confirm", Client.pendingCheatCommands.poll(), "Queued server teleport command");
		System.out.println("  [PASS] Verified dangerous teleport confirmation modal & command queueing");

		// 6. Verify preferences persistence (savePreferences -> loadPreferences)
		map.toggleFavourite("yanille");
		assertTrue(map.favourites.contains("yanille"), "Added Yanille to favourites");
		Properties savedProps = new Properties();
		map.savePreferences(savedProps);

		WorldMapOverlay restored = new WorldMapOverlay(null);
		restored.loadPreferences(savedProps);
		assertEquals(Double.valueOf(map.zoom), Double.valueOf(restored.zoom), "Restored zoom");
		assertTrue(restored.favourites.contains("yanille"), "Restored favourite 'yanille'");
		assertTrue(restored.recentIds.contains("varrock_sewers"), "Restored recent destination 'varrock_sewers'");
		System.out.println("  [PASS] Verified map preferences persistence (zoom, center, favourites, recents)");

		// 7. Render preview image of the interactive World Map UI
		map.visible = true;
		map.centerX = 3150.0;
		map.centerZ = 3380.0;
		map.zoom = 1.15;
		map.selectedDestination = WorldMapOverlay.getDestinationById("varrock_portal_hub");
		map.render(g, 1148, 755);
		g.dispose();

		File previewOut = new File("/home/josh/.gemini/antigravity-cli/brain/daef29d7-525d-4b33-8178-d25d318bf5f2/worldmap_ui_preview.png");
		if (previewOut.getParentFile() != null && previewOut.getParentFile().exists()) {
			ImageIO.write(canvas, "png", previewOut);
			System.out.println("  [PASS] Rendered World Map UI screenshot to " + previewOut.getAbsolutePath());
		}

		System.out.println("\nALL WORLD MAP OVERLAY CLIENT TESTS PASSED!");
	}
}
