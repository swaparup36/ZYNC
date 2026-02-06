export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error("Sleep aborted"));
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      cleanup();
      reject(new Error("Sleep aborted"));
    }

    function cleanup() {
      signal?.removeEventListener("abort", onAbort);
    }

    signal?.addEventListener("abort", onAbort);
  });
}

export async function sleepWithJitter(
  baseMs: number,
  jitterPercent = 0.2,
  signal?: AbortSignal
) {
  const jitterRange = baseMs * jitterPercent;
  const randomOffset = (Math.random() * 2 - 1) * jitterRange;

  const finalMs = Math.max(0, baseMs + randomOffset);

  await sleep(finalMs, signal);
}
