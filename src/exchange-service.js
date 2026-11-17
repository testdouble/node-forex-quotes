/*
  This library is provided without warranty under the MIT license
*/

'use strict'

/**
 * Stands in for a third party exchange rate API.
 *
 * Nothing here talks to a network. The randomness, the failure rate and the
 * latency are all simulated so that consumers have to cope with a dependency
 * that is slow and occasionally unavailable.
 */
class ExchangeService {
  static validCurrency(currency) {
    return ['USD', 'JPY'].includes(currency)
  }

  // Note: This is set to mimic a 3rd party api that is making an external request
  static async getRate(to, from) {
    if (Math.floor(Math.random() * 20) === 1) {
      throw new Error("We're going down")
    }

    await new Promise((resolve) => {
      setTimeout(resolve, Math.floor(Math.random() * 3) * 1000)
    })

    return 1.45 + Math.random() * 0.05
  }
}

module.exports = { ExchangeService }
