import {createServer} from 'node:http';
import {createHash,timingSafeEqual} from 'node:crypto';
/**
 * Local-only, authenticated RS-SDK gateway for revision-377.
 * Supports both:
 * 1) Pinned MaxBittker/rs-sdk WebSocket protocol (sdk_connect, sdk_connected,
 *    sdk_state, sdk_action, sdk_action_result, sdk_error) with single-controller
 *    lease pre-emption, strict observe-mode action blocking, bot/world binding,
 *    and actionId replay protection.
 * 2) Loopback HTTP Bearer endpoints (/sdk_state, /sdk_action, /status/:username).
 */
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function constantTimeMatch(aStr, bStr) {
  const a = Buffer.from(String(aStr ?? ''), 'utf8');
  const b = Buffer.from(String(bStr ?? ''), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function encodeWsFrame(opcode, payloadBuf) {
  const len = payloadBuf.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x80 | opcode, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payloadBuf]);
}

function createWsPeer(socket, maxBodyBytes) {
  let buffer = Buffer.alloc(0);
  let closed = false;
  const listeners = { message: [], close: [] };

  const sendJson = obj => {
    if (closed || socket.destroyed) return;
    const raw = Buffer.from(JSON.stringify(obj), 'utf8');
    socket.write(encodeWsFrame(0x01, raw));
  };

  const close = (code = 1000, reason = '') => {
    if (closed) return;
    closed = true;
    try {
      const reasonBuf = Buffer.from(String(reason).slice(0, 120), 'utf8');
      const body = Buffer.alloc(2 + reasonBuf.length);
      body.writeUInt16BE(code, 0);
      reasonBuf.copy(body, 2);
      socket.write(encodeWsFrame(0x08, body));
      socket.end();
    } catch {
      try { socket.destroy(); } catch {}
    }
  };

  socket.on('data', chunk => {
    if (closed) return;
    buffer = Buffer.concat([buffer, chunk]);
    if (buffer.length > maxBodyBytes * 4) {
      close(1009, 'Frame too large');
      return;
    }
    while (buffer.length >= 2) {
      const b0 = buffer[0];
      const b1 = buffer[1];
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let payloadLen = b1 & 0x7f;
      let offset = 2;
      if (payloadLen === 126) {
        if (buffer.length < 4) return;
        payloadLen = buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (buffer.length < 10) return;
        const bigLen = buffer.readBigUInt64BE(2);
        if (bigLen > BigInt(maxBodyBytes)) {
          close(1009, 'Payload too large');
          return;
        }
        payloadLen = Number(bigLen);
        offset = 10;
      }
      if (payloadLen > maxBodyBytes) {
        close(1009, 'Payload exceeds limit');
        return;
      }
      const maskLen = masked ? 4 : 0;
      if (buffer.length < offset + maskLen + payloadLen) return;
      const mask = masked ? buffer.subarray(offset, offset + 4) : null;
      const payload = Buffer.from(buffer.subarray(offset + maskLen, offset + maskLen + payloadLen));
      buffer = buffer.subarray(offset + maskLen + payloadLen);
      if (mask) {
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= mask[i & 3];
        }
      }
      if (opcode === 0x08) {
        closed = true;
        try { socket.end(); } catch {}
        listeners.close.forEach(fn => fn());
        return;
      }
      if (opcode === 0x09) {
        if (!closed && !socket.destroyed) socket.write(encodeWsFrame(0x0a, payload));
        continue;
      }
      if (opcode === 0x01) {
        const text = payload.toString('utf8');
        listeners.message.forEach(fn => fn(text));
      }
    }
  });

  socket.on('close', () => {
    if (!closed) {
      closed = true;
      listeners.close.forEach(fn => fn());
    }
  });
  socket.on('error', () => {
    if (!closed) {
      closed = true;
      listeners.close.forEach(fn => fn());
    }
  });

  return {
    sendJson,
    close,
    isClosed: () => closed,
    onMessage: fn => listeners.message.push(fn),
    onClose: fn => listeners.close.push(fn)
  };
}

export function createSdk377Gateway({
  runtime,
  token,
  botName = 'HarnessBot',
  expectedWorld = null,
  host = '127.0.0.1',
  maxBodyBytes = 8192,
  actionTimeoutMs = 9000,
  actionPollMs = 120
} = {}) {
  if (!runtime || typeof runtime.getSdkState !== 'function' || typeof runtime.action !== 'function')
    throw new Error('sdk_runtime_required');
  if (host !== '127.0.0.1' && host !== '::1') throw new Error('gateway_must_bind_loopback');
  if (typeof token !== 'string' || Buffer.byteLength(token) < 32) throw new Error('gateway_token_required');
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes < 512 || maxBodyBytes > 65536)
    throw new Error('invalid_gateway_body_limit');

  const expectedAuthHeader = 'Bearer ' + token;
  const seenActionIds = new Set();
  const rememberActionId = actionId => {
    if (seenActionIds.has(actionId)) return false;
    seenActionIds.add(actionId);
    if (seenActionIds.size > 4096) {
      const oldest = seenActionIds.values().next().value;
      seenActionIds.delete(oldest);
    }
    return true;
  };

  let activeController = null;
  const connectedPeers = new Set();

  const broadcastState = async () => {
    try {
      const current = await runtime.getSdkState();
      if (!current?.state) return null;
      const msg = { type: 'sdk_state', state: current.state, stateReceivedAt: Date.now() };
      for (const peer of connectedPeers) {
        if (peer.authenticated && !peer.ws.isClosed()) {
          peer.ws.sendJson(msg);
        }
      }
      return current;
    } catch {
      return null;
    }
  };

  const server = createServer(async (req, res) => {
    const reply = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify(body));
    };
    if (!constantTimeMatch(req.headers.authorization ?? '', expectedAuthHeader)) {
      reply(401, { error: 'unauthorized' });
      return;
    }
    if (req.method === 'GET' && req.url === '/sdk_state') {
      try {
        const result = await runtime.getSdkState();
        reply(200, result);
      } catch {
        reply(409, { error: 'authoritative_sdk_state_unavailable' });
      }
      return;
    }
    if (req.method === 'GET' && req.url?.startsWith('/status/')) {
      const targetUser = decodeURIComponent(req.url.slice('/status/'.length));
      if (botName && targetUser !== botName) {
        reply(403, { error: 'forbidden_bot_identity' });
        return;
      }
      try {
        const current = await runtime.getSdkState();
        reply(200, {
          connected: true,
          inGame: Boolean(current?.state?.inGame),
          username: botName,
          world: current?.source?.instanceId ?? expectedWorld,
          tick: current?.state?.tick ?? null
        });
      } catch {
        reply(200, { connected: false, inGame: false, username: botName, world: expectedWorld });
      }
      return;
    }
    if (req.method === 'POST' && req.url === '/sdk_action') {
      let data = '', size = 0;
      try {
        for await (const chunk of req) {
          size += chunk.length;
          if (size > maxBodyBytes) throw new Error('oversized');
          data += chunk.toString('utf8');
        }
        const body = JSON.parse(data);
        const allowedKeys = ['action', 'actionId', 'username', 'verifyEffect', 'timeoutMs'];
        if (!body || typeof body !== 'object' || Array.isArray(body) ||
            Object.keys(body).some(k => !allowedKeys.includes(k)) || !body.action) {
          throw new Error('invalid');
        }
        if (body.username !== undefined && body.username !== botName) {
          reply(403, { error: 'forbidden_bot_identity' });
          return;
        }
        if (body.actionId !== undefined) {
          if (typeof body.actionId !== 'string' || body.actionId.length < 1 || body.actionId.length > 128) {
            reply(400, { error: 'invalid_action_id' });
            return;
          }
          if (!rememberActionId(body.actionId)) {
            reply(409, { error: 'replayed_action_id', actionId: body.actionId });
            return;
          }
        }
        if (body.verifyEffect === true && typeof runtime.executeVerifiedAction === 'function') {
          const outcome = await runtime.executeVerifiedAction(body.action, {
            timeoutMs: Number.isInteger(body.timeoutMs) ? body.timeoutMs : actionTimeoutMs,
            pollMs: actionPollMs
          });
          await broadcastState();
          reply(200, {
            ...outcome,
            ...(body.actionId ? { actionId: body.actionId } : {})
          });
          return;
        }
        const result = await runtime.action(body.action);
        reply(200, {
          ...result,
          ...(body.actionId ? { actionId: body.actionId } : {})
        });
      } catch {
        reply(400, { error: 'invalid_or_refused_sdk_action' });
      }
      return;
    }
    reply(404, { error: 'not_found' });
  });

  server.on('upgrade', (req, socket) => {
    const remote = req.socket.remoteAddress ?? '';
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote)) {
      socket.destroy();
      return;
    }
    const key = req.headers['sec-websocket-key'];
    if (typeof key !== 'string' || !key) {
      socket.destroy();
      return;
    }
    const accept = createHash('sha1').update(key + WS_GUID).digest('base64');
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );

    const ws = createWsPeer(socket, maxBodyBytes);
    const peer = { ws, authenticated: false, mode: 'observe', username: null };
    connectedPeers.add(peer);

    ws.onClose(() => {
      connectedPeers.delete(peer);
      if (activeController === peer) {
        activeController = null;
      }
    });

    ws.onMessage(async rawText => {
      let msg;
      try {
        msg = JSON.parse(rawText);
      } catch {
        ws.sendJson({ type: 'sdk_error', error: 'Invalid JSON message' });
        return;
      }
      if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
        ws.sendJson({ type: 'sdk_error', error: 'Invalid message envelope' });
        return;
      }

      if (msg.type === 'sdk_connect') {
        const { username, password, mode = 'control' } = msg;
        if (!constantTimeMatch(password ?? '', token)) {
          ws.sendJson({ type: 'sdk_connected', success: false, error: 'Invalid gateway token' });
          ws.close(4001, 'Unauthorized');
          return;
        }
        if (typeof username !== 'string' || username !== botName) {
          ws.sendJson({ type: 'sdk_connected', success: false, error: 'Unauthorized bot username' });
          ws.close(4003, 'Forbidden bot username');
          return;
        }
        if (mode !== 'control' && mode !== 'observe') {
          ws.sendJson({ type: 'sdk_connected', success: false, error: 'Invalid connection mode' });
          ws.close(4000, 'Invalid mode');
          return;
        }
        if (mode === 'control' && activeController && activeController !== peer && !activeController.ws.isClosed()) {
          activeController.ws.sendJson({ type: 'sdk_error', error: 'Pre-empted by new controller' });
          activeController.ws.close(4002, 'Pre-empted by new controller');
          activeController = null;
        }
        peer.authenticated = true;
        peer.mode = mode;
        peer.username = username;
        if (mode === 'control') {
          activeController = peer;
        }
        ws.sendJson({
          type: 'sdk_connected',
          success: true,
          mode,
          otherControllers: 0,
          maxMessageLength: 80
        });
        try {
          const current = await runtime.getSdkState();
          if (current?.state) {
            ws.sendJson({
              type: 'sdk_state',
              state: current.state,
              stateReceivedAt: Date.now()
            });
          }
        } catch {
          // State will be pushed when available
        }
        return;
      }

      if (!peer.authenticated) {
        ws.sendJson({ type: 'sdk_error', error: 'Not authenticated: send sdk_connect first' });
        ws.close(4001, 'Unauthenticated');
        return;
      }

      if (msg.type === 'sdk_action') {
        const { username, action, actionId } = msg;
        if (typeof actionId !== 'string' || actionId.length < 1 || actionId.length > 128) {
          ws.sendJson({ type: 'sdk_error', error: 'Valid actionId required' });
          return;
        }
        if (peer.mode !== 'control' || activeController !== peer) {
          ws.sendJson({
            type: 'sdk_action_result',
            actionId,
            status: 'rejected',
            result: {
              success: false,
              message: 'Observe-only connection cannot dispatch actions',
              phase: 'validation',
              reason: 'observe_only'
            }
          });
          return;
        }
        if (username !== undefined && username !== peer.username) {
          ws.sendJson({
            type: 'sdk_action_result',
            actionId,
            status: 'rejected',
            result: {
              success: false,
              message: 'Cross-bot action rejected',
              phase: 'validation',
              reason: 'wrong_bot_identity'
            }
          });
          return;
        }
        if (!rememberActionId(actionId)) {
          ws.sendJson({
            type: 'sdk_action_result',
            actionId,
            status: 'rejected',
            result: {
              success: false,
              message: 'Duplicate actionId rejected (replay protection)',
              phase: 'validation',
              reason: 'replay_detected'
            }
          });
          return;
        }

        try {
          if (typeof runtime.executeVerifiedAction === 'function') {
            const outcome = await runtime.executeVerifiedAction(action, {
              timeoutMs: actionTimeoutMs,
              pollMs: actionPollMs
            });
            await broadcastState();
            ws.sendJson({
              type: 'sdk_action_result',
              actionId,
              status: outcome.status,
              verifiedEffect: outcome.verifiedEffect,
              tick: outcome.tick,
              observedTick: outcome.observedTick,
              result: outcome.sdkResult
            });
          } else {
            const res = await runtime.action(action);
            await broadcastState();
            ws.sendJson({
              type: 'sdk_action_result',
              actionId,
              status: res.status ?? 'dispatched_unverified',
              verifiedEffect: Boolean(res.verifiedEffect),
              result: {
                success: res.status === 'verified_success',
                message: `Action status: ${res.status ?? 'dispatched_unverified'}`,
                phase: 'dispatch'
              }
            });
          }
        } catch (err) {
          ws.sendJson({
            type: 'sdk_action_result',
            actionId,
            status: 'rejected',
            verifiedEffect: false,
            result: {
              success: false,
              message: err instanceof Error ? err.message : 'Action failed',
              phase: 'validation',
              reason: 'rejected'
            }
          });
        }
        return;
      }

      if (msg.type === 'sdk_screenshot_request') {
        ws.sendJson({
          type: 'sdk_error',
          actionId: msg.actionId,
          error: 'Screenshots are not supported by the headless native 377 observer'
        });
        return;
      }

      ws.sendJson({ type: 'sdk_error', error: `Unsupported gateway message type: ${String(msg.type)}` });
    });
  });

  return Object.freeze({
    server,
    broadcastState,
    listen: port => new Promise((resolve, reject) => {
      if (!Number.isInteger(port) || port < 1024 || port > 65535 || [8888, 52402, 45099, 43500].includes(port))
        return reject(new Error('isolated_gateway_port_required'));
      server.once('error', reject);
      server.listen(port, host, () => {
        server.removeListener('error', reject);
        resolve(server.address());
      });
    }),
    close: () => new Promise((resolve, reject) => {
      for (const peer of connectedPeers) {
        peer.ws.close(1001, 'Gateway shutting down');
      }
      connectedPeers.clear();
      activeController = null;
      server.close(err => err ? reject(err) : resolve());
    })
  });
}
