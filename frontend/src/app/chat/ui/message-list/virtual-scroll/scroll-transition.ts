// Classifies how a message list changed between renders. Pure — no Angular,
// no DOM. `prepended` and `appended` are independent, not mutually
// exclusive: a history-load and a realtime message can resolve in the same
// render, so both need to be checkable at once.
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
