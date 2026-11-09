package au.com.parristech.joshrs.android.protocol

/**
 * Revision-377 server-bound opcode table, generated verbatim from
 * `LostCityRS/Engine-TS` src/network/game/server/ServerGameProt.ts (MIT License,
 * Copyright (c) 2023-2026 Lost City).
 *
 * `length` semantics: >= 0 is a fixed byte count, -1 means a 1-byte length
 * prefix follows the opcode, -2 means a 2-byte length prefix.
 *
 * Generated file — regenerate with tools/android377-phone/generate-prot-tables.mjs.
 */
enum class ServerProt(override val id: Int, override val length: Int) : Prot {
    IF_OPENCHAT(109, 2),
    IF_OPENMAIN_SIDE(128, 4),
    IF_CLOSE(29, 0),
    IF_SETTAB(10, 3),
    IF_SETTAB_ACTIVE(252, 1),
    IF_OPENMAIN(159, 2),
    IF_OPENSIDE(246, 2),
    IF_OPENOVERLAY(50, 2),
    IF_OPENFULL(253, 4),
    IF_SETANGLE(186, 8),
    IF_SETCOLOUR(218, 4),
    IF_SETHIDE(82, 3),
    IF_SETOBJECT(21, 6),
    IF_SETMODEL(216, 4),
    IF_SETROTATION(18, 6),
    IF_SETANIM(2, 4),
    IF_SETPLAYERHEAD(255, 2),
    IF_SETTEXT(232, -2),
    IF_SETNPCHEAD(162, 4),
    IF_SETPOSITION(166, 6),
    IF_SETSCROLLPOS(200, 4),
    TUT_FLASH(238, 1),
    TUT_OPEN(158, 2),
    UPDATE_INV_STOP_TRANSMIT(219, 2),
    UPDATE_INV_FULL(206, -2),
    UPDATE_INV_PARTIAL(134, -2),
    CAM_LOOKAT(167, 6),
    CAM_SHAKE(67, 4),
    CAM_MOVETO(3, 6),
    CAM_RESET(148, 0),
    NPC_INFO(71, -2),
    PLAYER_INFO(90, -2),
    FRIENDLIST_LOADED(251, 1),
    MESSAGE_GAME(63, -1),
    UPDATE_IGNORELIST(226, -2),
    CHAT_FILTER_SETTINGS(201, 3),
    MESSAGE_PRIVATE(135, -1),
    UPDATE_FRIENDLIST(78, 9),
    UNSET_MAP_FLAG(61, 0),
    UPDATE_RUNWEIGHT(174, 2),
    HINT_ARROW(199, 6),
    UPDATE_REBOOT_TIMER(190, 2),
    UPDATE_STAT(49, 6),
    UPDATE_RUNENERGY(125, 1),
    RESET_ANIMS(13, 0),
    UPDATE_PID(126, 3),
    LAST_LOGIN_INFO(76, 23),
    LOGOUT(5, 0),
    P_COUNTDIALOG(58, 0),
    SET_MULTIWAY(233, 1),
    SET_PLAYER_OP(157, -1),
    P_NAMEDIALOG(6, 0),
    MINIMAP_TOGGLE(156, 1),
    REBUILD_NORMAL(222, 4),
    REBUILD_REGION(53, -1),
    VARP_SMALL(182, 3),
    VARP_LARGE(115, 6),
    RESET_CLIENT_VARCACHE(113, 0),
    SYNTH_SOUND(26, 5),
    MIDI_SONG(220, 2),
    MIDI_JINGLE(249, 5),
    UPDATE_ZONE_PARTIAL_FOLLOWS(75, 2),
    UPDATE_ZONE_FULL_FOLLOWS(40, 2),
    UPDATE_ZONE_PARTIAL_ENCLOSED(183, -2),
    ;

    companion object {
        private val BY_ID: Map<Int, ServerProt> = entries.associateBy { it.id }

        fun byId(id: Int): ServerProt? = BY_ID[id]
    }
}
