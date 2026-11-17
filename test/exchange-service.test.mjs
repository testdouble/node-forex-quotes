import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExchangeService } from '../index.mjs'
import { queueRandom, NO_FAILURE, FAILURE, NO_DELAY } from './support/random.mjs'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('ExchangeService.getRate', () => {
  it('goes down when the failure draw lands on 1', async () => {
    queueRandom([FAILURE])

    await expect(ExchangeService.getRate('JPY', 'USD')).rejects.toThrow(
      "We're going down",
    )
  })

  it('stays up for the other nineteen draws in twenty', async () => {
    for (let draw = 0; draw < 20; draw += 1) {
      if (draw === 1) continue

      vi.restoreAllMocks()
      // (draw + 0.5) / 20 sits in the middle of the draw's bucket, so
      // floor(r * 20) === draw without any floating point ambiguity.
      queueRandom([(draw + 0.5) / 20, NO_DELAY, 0.5])

      await expect(ExchangeService.getRate('JPY', 'USD')).resolves.toBeTypeOf(
        'number',
      )
    }
  })

  it('fails before it sleeps, so a failure costs no time', async () => {
    vi.useFakeTimers()
    queueRandom([FAILURE])

    await expect(ExchangeService.getRate('JPY', 'USD')).rejects.toThrow(
      "We're going down",
    )
    expect(vi.getTimerCount()).toBe(0)
  })

  const delayCases = [
    { draw: 0.1, expectedMs: 0 },
    { draw: 0.4, expectedMs: 1000 },
    { draw: 0.8, expectedMs: 2000 },
  ]

  it.each(delayCases)(
    'sleeps $expectedMs ms when the delay draw is $draw',
    async ({ draw, expectedMs }) => {
      vi.useFakeTimers()
      queueRandom([NO_FAILURE, draw, 0.5])

      let settled = false
      const promise = ExchangeService.getRate('JPY', 'USD').then((rate) => {
        settled = true
        return rate
      })

      if (expectedMs > 0) {
        await vi.advanceTimersByTimeAsync(expectedMs - 1)
        expect(settled).toBe(false)
      }

      await vi.advanceTimersByTimeAsync(1)
      expect(settled).toBe(true)
      await promise
    },
  )

  it('returns a rate inside the 1.45 to 1.5 range', async () => {
    queueRandom([NO_FAILURE, NO_DELAY, 0.5])

    await expect(ExchangeService.getRate('JPY', 'USD')).resolves.toBeCloseTo(
      1.475,
      10,
    )
  })

  it('maps the boundary draws to the ends of the range', async () => {
    queueRandom([NO_FAILURE, NO_DELAY, 0])
    const lowest = await ExchangeService.getRate('JPY', 'USD')
    expect(lowest).toBeCloseTo(1.45, 10)
    expect(lowest).toBeGreaterThanOrEqual(1.45)

    vi.restoreAllMocks()
    // The largest double below 1. Floating point rounding lands this exactly
    // on 1.5, so the top of the range is reachable, as it is in Ruby's
    // inclusive rand(1.45..1.5).
    queueRandom([NO_FAILURE, NO_DELAY, 0.9999999999999999])
    const highest = await ExchangeService.getRate('JPY', 'USD')
    expect(highest).toBeLessThanOrEqual(1.5)
    expect(highest).toBeCloseTo(1.5, 10)
  })

  it('ignores the currency pair it is handed', async () => {
    queueRandom([NO_FAILURE, NO_DELAY, 0.5])
    const forwards = await ExchangeService.getRate('JPY', 'USD')

    vi.restoreAllMocks()
    queueRandom([NO_FAILURE, NO_DELAY, 0.5])
    const backwards = await ExchangeService.getRate('USD', 'JPY')

    expect(forwards).toBe(backwards)
  })
})

describe('ExchangeService.validCurrency', () => {
  it('accepts the two supported currencies', () => {
    expect(ExchangeService.validCurrency('USD')).toBe(true)
    expect(ExchangeService.validCurrency('JPY')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(ExchangeService.validCurrency('EUR')).toBe(false)
    expect(ExchangeService.validCurrency('usd')).toBe(false)
    expect(ExchangeService.validCurrency(undefined)).toBe(false)
  })
})
