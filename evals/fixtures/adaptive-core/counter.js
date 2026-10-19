// Deliberate deterministic lost-update defect for controlled evaluations.
export function createCounter() {
  let value = 0;
  return {
    read: () => value,
    increment: async () => {
      const previous = value;
      await Promise.resolve();
      value = previous + 1;
      return value;
    },
  };
}
