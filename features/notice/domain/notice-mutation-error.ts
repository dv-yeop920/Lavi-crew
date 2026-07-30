export const noticeMutationErrorMessages = {
  FORBIDDEN: '이 작업을 수행할 권한이 없습니다.',
  IDEMPOTENCY_KEY_REUSED: '이미 사용한 요청입니다. 화면을 새로고침해 주세요.',
  INVALID_INPUT: '공지 입력 내용을 확인해 주세요.',
  NOTICE_NOT_FOUND: '공지를 찾지 못했거나 이미 삭제되었습니다.',
  STALE_NOTICE: '공지가 변경되었습니다. 최신 상태를 다시 불러와 주세요.',
} as const

export function getNoticeMutationError(message: string) {
  const code = (
    Object.keys(noticeMutationErrorMessages) as Array<keyof typeof noticeMutationErrorMessages>
  ).find((candidate) => message.includes(candidate))
  return {
    code: code ?? 'NOTICE_SAVE_FAILED',
    message: (code && noticeMutationErrorMessages[code]) ?? '공지를 저장하지 못했습니다.',
  }
}
