// In-memory Convex WebSocket transport shared by QA specs that submit the
// contact form. It never connects to a real deployment.
// Diagnostic-looking failure text; the UI must never show it verbatim.
export const SYNTHETIC_FAILURE = '[Request ID: synthetic-audit] Server Error\n    at syntheticStack (fixture.js:1:1)';

function encodedTimestamp(value) {
  // Convex encodes its unsigned little-endian timestamps as base64 strings.
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes.toString('base64');
}

export function createConvexTransportMock() {
  const state = {
    connections: 0,
    mutations: [],
    pending: new Map(),
    nextTimestamp: 0,
  };

  function sendOutcome(webSocket, message, outcome, errorData) {
    if (outcome === 'failure') {
      webSocket.send(JSON.stringify({
        type: 'MutationResponse',
        requestId: message.requestId,
        success: false,
        result: SYNTHETIC_FAILURE,
        ...(errorData === undefined ? {} : { errorData }),
        logLines: [],
      }));
      return;
    }

    const startTimestamp = encodedTimestamp(state.nextTimestamp);
    state.nextTimestamp += 1;
    const timestamp = encodedTimestamp(state.nextTimestamp);
    webSocket.send(JSON.stringify({
      type: 'MutationResponse',
      requestId: message.requestId,
      success: true,
      result: { success: true },
      ts: timestamp,
      logLines: [],
    }));
    // A successful Convex mutation is resolved after the client observes a
    // transition at or beyond the mutation response timestamp.
    webSocket.send(JSON.stringify({
      type: 'Transition',
      startVersion: { querySet: 0, ts: startTimestamp, identity: 0 },
      endVersion: { querySet: 0, ts: timestamp, identity: 0 },
      modifications: [],
    }));
  }

  return {
    state,
    connect(webSocket) {
      state.connections += 1;
      webSocket.onMessage((rawMessage) => {
        const message = JSON.parse(String(rawMessage));
        if (message.type !== 'Mutation') return;

        state.mutations.push(message);
        // The first request is held to make the pending and duplicate-submit
        // states observable. Later requests complete successfully unless the
        // test explicitly releases the held request as a failure.
        if (state.mutations.length === 1) {
          state.pending.set(message.requestId, { webSocket, message });
          return;
        }
        sendOutcome(webSocket, message, 'success');
      });
    },
    releasePending(outcome, errorData) {
      const pending = [...state.pending.values()][0];
      if (!pending) throw new Error('No pending synthetic mutation to release');
      state.pending.delete(pending.message.requestId);
      sendOutcome(pending.webSocket, pending.message, outcome, errorData);
    },
  };
}
