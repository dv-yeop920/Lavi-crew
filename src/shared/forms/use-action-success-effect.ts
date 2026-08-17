'use client'

import { useEffect, useRef } from 'react'

import { type ActionResultLike, isNewSuccessfulActionResult } from './action-success'

export function useActionSuccessEffect<Result extends ActionResultLike>(
  result: Result | null,
  onSuccess: (result: Result) => void,
) {
  const handledResultRef = useRef<Result | null>(null)
  const onSuccessRef = useRef(onSuccess)

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    if (!isNewSuccessfulActionResult(handledResultRef.current, result)) return
    handledResultRef.current = result
    onSuccessRef.current(result)
  }, [result])
}
