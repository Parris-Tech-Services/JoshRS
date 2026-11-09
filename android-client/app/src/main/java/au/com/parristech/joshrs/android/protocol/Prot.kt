package au.com.parristech.joshrs.android.protocol

/** Shared view of a revision-377 opcode: id plus on-wire length rule. */
interface Prot {
    val id: Int

    /**
     * `>= 0` fixed payload size, `-1` a 1-byte length prefix follows the opcode,
     * `-2` a 2-byte (big-endian) length prefix follows the opcode.
     */
    val length: Int
}
