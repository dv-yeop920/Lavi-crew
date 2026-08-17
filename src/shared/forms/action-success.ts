export type ActionResultLike = { ok: boolean }

export function isNewSuccessfulActionResult<Result extends ActionResultLike>(
  previousResult: Result | null,
  currentResult: Result | null,
): currentResult is Result {
  return currentResult?.ok === true && currentResult !== previousResult
}
