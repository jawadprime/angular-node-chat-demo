// Classifies how the list changed. prepended and appended can both be true at once.
export interface ScrollTransition {
  readonly initial: boolean;
  readonly prepended: boolean;
  readonly appended: boolean;
}

export function classifyScrollTransition(
  previousFirstId: string | null,
  previousLastId: string | null,
  newFirstId: string,
  newLastId: string,
): ScrollTransition {
  if (previousFirstId === null) {
    return { initial: true, prepended: false, appended: false };
  }
  return {
    initial: false,
    prepended: newFirstId !== previousFirstId,
    appended: newLastId !== previousLastId,
  };
}
