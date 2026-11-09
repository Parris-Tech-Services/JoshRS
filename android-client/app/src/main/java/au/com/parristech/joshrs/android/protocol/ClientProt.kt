package au.com.parristech.joshrs.android.protocol

/**
 * Revision-377 client-bound opcode table, generated verbatim from
 * `LostCityRS/Engine-TS` src/network/game/client/ClientGameProt.ts (MIT License,
 * Copyright (c) 2023-2026 Lost City).
 *
 * `length` semantics: >= 0 is a fixed byte count, -1 means a 1-byte length
 * prefix follows the opcode, -2 means a 2-byte length prefix.
 *
 * Generated file — regenerate with tools/android377-phone/generate-prot-tables.mjs.
 */
enum class ClientProt(override val id: Int, override val length: Int) : Prot {
    NO_TIMEOUT(40, 0),
    IDLE_TIMER(202, 0),
    EVENT_MOUSE_CLICK(19, 4),
    EVENT_MOUSE_MOVE(171, -1),
    EVENT_APPLET_FOCUS(187, 1),
    EVENT_CAMERA_POSITION(140, 4),
    EVENT_HAS_WINDOW(78, 4),
    EVENT_SYNTH_ERROR(80, 2),
    ANTICHEAT_OPLOGIC1(95, 4),
    ANTICHEAT_OPLOGIC2(165, 1),
    ANTICHEAT_OPLOGIC3(157, 4),
    ANTICHEAT_OPLOGIC4(222, 3),
    ANTICHEAT_OPLOGIC5(126, 1),
    ANTICHEAT_CYCLELOGIC1(244, -1),
    ANTICHEAT_CYCLELOGIC2(168, 0),
    ANTICHEAT_CYCLELOGIC3(197, 4),
    ANTICHEAT_CYCLELOGIC4(173, 3),
    ANTICHEAT_CYCLELOGIC5(248, 0),
    ANTICHEAT_CYCLELOGIC6(22, 2),
    OPOBJ1(77, 6),
    OPOBJ2(100, 6),
    OPOBJ3(71, 6),
    OPOBJ4(54, 6),
    OPOBJ5(230, 6),
    OPOBJT(83, 8),
    OPOBJU(211, 12),
    OPNPC1(112, 2),
    OPNPC2(67, 2),
    OPNPC3(13, 2),
    OPNPC4(42, 2),
    OPNPC5(8, 2),
    OPNPCT(104, 4),
    OPNPCU(57, 8),
    OPLOC1(181, 6),
    OPLOC2(241, 6),
    OPLOC3(50, 6),
    OPLOC4(136, 6),
    OPLOC5(55, 6),
    OPLOCT(210, 8),
    OPLOCU(152, 12),
    OPPLAYER1(245, 2),
    OPPLAYER2(233, 2),
    OPPLAYER3(194, 2),
    OPPLAYER4(116, 2),
    OPPLAYER5(45, 2),
    OPPLAYERT(31, 4),
    OPPLAYERU(143, 8),
    OPHELD1(203, 6),
    OPHELD2(24, 6),
    OPHELD3(161, 6),
    OPHELD4(228, 6),
    OPHELD5(4, 6),
    OPHELDT(36, 8),
    OPHELDU(1, 12),
    INV_BUTTON1(3, 6),
    INV_BUTTON2(177, 6),
    INV_BUTTON3(91, 6),
    INV_BUTTON4(231, 6),
    INV_BUTTON5(158, 6),
    IF_BUTTON(79, 2),
    RESUME_PAUSEBUTTON(226, 2),
    CLOSE_MODAL(110, 0),
    RESUME_P_COUNTDIALOG(75, 4),
    TUT_CLICKSIDE(119, 1),
    RESUME_P_NAMEDIALOG(206, 8),
    MAP_BUILD_COMPLETE(6, 0),
    MOVE_OPCLICK(247, -1),
    REPORT_ABUSE(184, 10),
    MOVE_MINIMAPCLICK(213, -1),
    INV_BUTTOND(123, 7),
    IGNORELIST_DEL(160, 8),
    IGNORELIST_ADD(217, 8),
    IDK_SAVEDESIGN(163, 13),
    CHAT_SETMODE(176, 3),
    MESSAGE_PRIVATE(227, -1),
    FRIENDLIST_DEL(141, 8),
    FRIENDLIST_ADD(120, 8),
    CLIENT_CHEAT(56, -1),
    MESSAGE_PUBLIC(49, -1),
    MOVE_GAMECLICK(28, -1),
    ;

    companion object {
        private val BY_ID: Map<Int, ClientProt> = entries.associateBy { it.id }

        fun byId(id: Int): ClientProt? = BY_ID[id]
    }
}
