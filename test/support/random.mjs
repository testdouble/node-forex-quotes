import { vi } from 'vitest'

/**
 * Queue up the exact values Math.random() will return, in order.
 *
 * ExchangeService.getRate draws in this order:
 *   1. the failure draw   floor(r * 20) === 1
 *   2. the delay draw     floor(r * 3) seconds
 *   3. the rate draw      1.45 + r * 0.05
 *
 * No fallback value is queued, so an unexpected extra draw yields undefined
 * and the assertion fails loudly instead of silently passing.
 */
export function queueRandom(values) {
  const spy = vi.spyOn(Math, 'random')
  values.forEach((value) => spy.mockReturnValueOnce(value))
  return spy
}

/** floor(0 * 20) === 0, so the service stays up. */
export const NO_FAILURE = 0

/** floor(0.06 * 20) === 1, the one draw in twenty that takes it down. */
export const FAILURE = 0.06

/** floor(0 * 3) === 0 seconds. */
export const NO_DELAY = 0

/** 1.45 + 0 * 0.05 === 1.45, the bottom of the rate range. */
export const LOWEST_RATE_DRAW = 0
