import { runCycle } from "./run.js";

console.log("Running single cycle...\n");
runCycle()
  .then(() => {
    console.log("\nDone.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
