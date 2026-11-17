import { createRequire } from 'node:module'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ExchangeService,
  ExchangeServiceDownError,
  ForexDataClient,
} from '../index.mjs'
import {
  queueRandom,
  NO_FAILURE,
  FAILURE,
  NO_DELAY,
  LOWEST_RATE_DRAW,
} from './support/random.mjs'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('ForexDataClient#getRate', () => {
  it('resolves an object keyed by the target currency', async () => {
    queueRandom([NO_FAILURE, NO_DELAY, LOWEST_RATE_DRAW])
    const client = new ForexDataClient('fake-api-key')

    const result = await client.getRate({ from: 'USD', to: 'JPY' })

    expect(Object.keys(result)).toEqual(['JPY'])
    expect(result.JPY).toBeCloseTo(1.45, 10)
  })

  it('short circuits to a rate of 1 when both currencies match', async () => {
    const getRate = vi.spyOn(ExchangeService, 'getRate')
    const client = new ForexDataClient('fake-api-key')

    await expect(client.getRate({ from: 'USD', to: 'USD' })).resolves.toEqual({
      USD: 1,
    })
    expect(getRate).not.toHaveBeenCalled()
  })

  it('surfaces a downed service as ExchangeServiceDownError', async () => {
    queueRandom([FAILURE])
    const client = new ForexDataClient('fake-api-key')

    await expect(client.getRate({ from: 'USD', to: 'JPY' })).rejects.toThrow(
      ExchangeServiceDownError,
    )
  })

  it('keeps the original failure as the error cause', async () => {
    queueRandom([FAILURE])
    const client = new ForexDataClient('fake-api-key')

    const error = await client.getRate({ from: 'USD', to: 'JPY' }).catch((e) => e)

    expect(error.name).toBe('ExchangeServiceDownError')
    expect(error.message).toBe('Exchange Service is offline.')
    expect(error.cause.message).toBe("We're going down")
  })
})

describe('ForexDataClient#convert', () => {
  it('multiplies the amount by the rate', async () => {
    queueRandom([NO_FAILURE, NO_DELAY, LOWEST_RATE_DRAW])
    const client = new ForexDataClient('fake-api-key')

    const result = await client.convert({
      from: 'USD',
      to: 'JPY',
      amount: 100,
    })

    expect(Object.keys(result)).toEqual(['JPY'])
    expect(result.JPY).toBeCloseTo(145, 10)
  })

  it('returns the amount untouched when both currencies match', async () => {
    const getRate = vi.spyOn(ExchangeService, 'getRate')
    const client = new ForexDataClient('fake-api-key')

    await expect(
      client.convert({ from: 'USD', to: 'USD', amount: 100 }),
    ).resolves.toEqual({ USD: 100 })
    expect(getRate).not.toHaveBeenCalled()
  })

  it('surfaces a downed service as ExchangeServiceDownError', async () => {
    queueRandom([FAILURE])
    const client = new ForexDataClient('fake-api-key')

    await expect(
      client.convert({ from: 'USD', to: 'JPY', amount: 100 }),
    ).rejects.toThrow('Exchange Service is offline.')
  })
})

describe('ExchangeServiceDownError', () => {
  it('is a real Error subclass', () => {
    const error = new ExchangeServiceDownError('nope')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ExchangeServiceDownError)
    expect(error.name).toBe('ExchangeServiceDownError')
  })
})

describe('module entry points', () => {
  it('exports the same classes through require() and import', () => {
    const require = createRequire(import.meta.url)
    const cjs = require('../index.js')

    expect(cjs.ForexDataClient).toBe(ForexDataClient)
    expect(cjs.ExchangeServiceDownError).toBe(ExchangeServiceDownError)
    expect(cjs.ExchangeService).toBe(ExchangeService)
  })
})
