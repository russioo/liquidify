import { config, agent } from "./config.js";
import { runCycle } from "./run.js";

console.log("═══════════════════════════════════");
console.log("  Liquidify Agent");
console.log("═══════════════════════════════════");
console.log(`  Mint:     ${config.mint.toBase58()}`);
console.log(`  Agent:    ${agent.publicKey.toBase58()}`);
console.log(`  Cycle:    ${config.cycleMs / 1000}s`);
console.log(`  OpenAI:   ${config.openaiKey ? "yes" : "no (fallback)"}`);
console.log("═══════════════════════════════════\n");

async function loop() {
  while (true) {
    try {
      await runCycle();
    } catch (err) {
      console.error("[loop] Unhandled error:", err);
    }
    await new Promise((r) => setTimeout(r, config.cycleMs));
  }
}

loop();
