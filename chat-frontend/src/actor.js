import { HttpAgent } from "@icp-sdk/core/agent";
import { safeGetCanisterEnv } from "@icp-sdk/core/agent/canister-env";
import { createActor } from "./bindings/chat_backend";

const canisterEnv = safeGetCanisterEnv();

const canisterId = canisterEnv?.["PUBLIC_CANISTER_ID:chat-backend"];

if (!canisterId) {
  throw new Error(
    "Canister ID for 'chat-backend' not found. Run 'icp deploy' first."
  );
}

const chatBackendReady = (async () => {
  const agent = HttpAgent.createSync({ host: window.location.origin });
  await agent.fetchRootKey();
  return createActor(canisterId, { agent });
})();

export const chatBackend = new Proxy(
  {},
  {
    get(_target, prop) {
      return (...args) => chatBackendReady.then((b) => b[prop](...args));
    },
  }
);
