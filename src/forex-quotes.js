/*
  This library is provided without warranty under the MIT license
*/

'use strict'

const { ExchangeService } = require('./exchange-service')

/**
 * Raised whenever the underlying exchange service fails for any reason.
 */
class ExchangeServiceDownError extends Error {
  constructor(message, options) {
    super(message, options)
    this.name = 'ExchangeServiceDownError'
  }
}

class ForexDataClient {
  #apiKey

  constructor(apiKey) {
    this.#apiKey = apiKey
  }

  /**
   * The rate to convert from one currency to another.
   *
   * @param {{ to: string, from: string }} params
   * @returns {Promise<Record<string, number>>} e.g. { JPY: 1.4733 }
   */
  async getRate({ to, from }) {
    try {
      const rate = await this.#exchangeRate(to, from)
      return { [to]: rate }
    } catch (error) {
      throw new ExchangeServiceDownError('Exchange Service is offline.', {
        cause: error,
      })
    }
  }

  /**
   * Convert a specific amount from one currency to another.
   *
   * @param {{ to: string, from: string, amount: number }} params
   * @returns {Promise<Record<string, number>>} e.g. { JPY: 147.33 }
   */
  async convert({ to, from, amount }) {
    try {
      const total = amount * (await this.#exchangeRate(to, from))
      return { [to]: total }
    } catch (error) {
      throw new ExchangeServiceDownError('Exchange Service is offline.', {
        cause: error,
      })
    }
  }

  async #exchangeRate(to, from) {
    if (to === from) return 1
    return ExchangeService.getRate(to, from)
  }
}

module.exports = { ForexDataClient, ExchangeServiceDownError }
