// Fingerprint of a day's blocks (id + done status) — used to detect whether the
// end-of-day bilan is stale relative to the current state of the plan.
export function computeBlocksSignature(
  blocks: { id: string; done: boolean }[],
): string {
  return blocks
    .map((b) => `${b.id}:${b.done ? 1 : 0}`)
    .sort()
    .join(",");
}
