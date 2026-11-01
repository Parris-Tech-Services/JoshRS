import * as rsbuf from '#/network/rsbuf/index.js';

import { isBotPlayer } from '#/engine/entity/Player.js';
import { Interaction } from '#/engine/entity/Interaction.js';
import { LunaSparSession } from '#/engine/entity/LunaSparSession.js';
import { NetworkPlayer } from '#/engine/entity/NetworkPlayer.js';
import ServerTriggerType from '#/engine/script/ServerTriggerType.js';
import World from '#/engine/World.js';
import ClientGameMessageHandler from '#/network/game/client/ClientGameMessageHandler.js';
import OpPlayer from '#/network/game/client/model/OpPlayer.js';
import UnsetMapFlag from '#/network/game/server/model/UnsetMapFlag.js';

export default class OpPlayerHandler extends ClientGameMessageHandler<OpPlayer> {
    handle(message: OpPlayer, player: NetworkPlayer): boolean {
        const { playerSlot } = message;

        if (player.delayed) {
            // normal: cannot interact while delayed
            player.write(new UnsetMapFlag());
            return false;
        }

        const other = World.getPlayer(playerSlot);
        if (!other) {
            // bad client or lag: player does not exist
            player.write(new UnsetMapFlag());
            return false;
        }

        if (!rsbuf.hasPlayer(player.slot, other.slot) && !isBotPlayer(other)) {
            // bad client or lag: player is not visible on client
            player.write(new UnsetMapFlag());
            return false;
        }

        // Route friendly Challenge / Spar clicks on BotPlayer (Luna) outside the Duel Arena & Wilderness
        if (
            isBotPlayer(other) &&
            (message.op === 1 || message.op === 2) &&
            !LunaSparSession.isInRealDuelArena(player) &&
            !LunaSparSession.isInWilderness(player)
        ) {
            player.clearPendingAction();
            other.handleChallengeFrom(player, message.op, World.currentTick);
            player.opcalled = true;
            return true;
        }

        const trigger: ServerTriggerType = ServerTriggerType.APPLAYER1 + (message.op - 1);
        player.clearPendingAction();
        player.setInteraction(Interaction.ENGINE, other, trigger);
        player.opcalled = true;
        return true;
    }
}
