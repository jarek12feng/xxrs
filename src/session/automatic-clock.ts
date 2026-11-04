/** Presentation timer only. Eligibility and actual advancement remain with commands. */
export function startAutomaticClock(
  eligible: () => boolean,
  step: () => Promise<unknown>,
  failed: (error: unknown) => void,
  interval = 800,
) {
  let pending = false,
    stopped = false;
  const timer = setInterval(() => {
    if (stopped || pending || !eligible()) return;
    pending = true;
    void Promise.resolve()
      .then(() => {
        if (!stopped && eligible()) return step();
      })
      .catch((error) => {
        stopped = true;
        clearInterval(timer);
        failed(error);
      })
      .finally(() => {
        pending = false;
      });
  }, interval);
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
