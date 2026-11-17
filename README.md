# node-forex-quotes

`forex-quotes` is a Node library for fetching realtime forex quotes.

> **Heads up:** this package makes no network calls. It is a deliberately
> flaky fake, built as a port of
> [testdouble/ruby-forex-quotes](https://github.com/testdouble/ruby-forex-quotes).
> Rates are random, roughly 1 call in 20 fails, and every successful call sleeps
> for 0-2 seconds. See [Simulated behavior](#simulated-behavior).

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [Instantiate the client](#instantiate-the-client)
  - [Get the rate for a currency pair](#get-the-rate-for-a-currency-pair)
  - [Convert an amount](#convert-an-amount)
  - [Handling failures](#handling-failures)
- [Simulated behavior](#simulated-behavior)
- [Development](#development)
- [License and Terms](#license-and-terms)

## Requirements

Node 18 or newer. No runtime dependencies.

## Installation

```sh
npm install forex-quotes
```

Both module systems work:

```js
import { ForexDataClient } from 'forex-quotes'   // ESM
const { ForexDataClient } = require('forex-quotes')  // CommonJS
```

## Usage

### Instantiate the client

```js
const client = new ForexDataClient('YOUR_API_KEY')
```

The API key is accepted and stored, but never used — there is no service to
authenticate against.

### Get the rate for a currency pair

Every method returns a Promise.

```js
await client.getRate({ from: 'USD', to: 'JPY' })
// { JPY: 1.4731089620478527 }
```

The result is keyed by the `to` currency.

### Convert an amount

Note this expects cents, not dollars.

```js
await client.convert({ from: 'USD', to: 'JPY', amount: 100 })
// { JPY: 147.31089620478527 }
```

When `from` and `to` are the same currency the rate short circuits to `1`, with
no delay and no chance of failure.

### Handling failures

Any failure in the underlying service surfaces as an `ExchangeServiceDownError`.
Expect it, and retry:

```js
import { ForexDataClient, ExchangeServiceDownError } from 'forex-quotes'

const client = new ForexDataClient('YOUR_API_KEY')

try {
  const rate = await client.getRate({ from: 'USD', to: 'JPY' })
  console.log(rate)
} catch (error) {
  if (error instanceof ExchangeServiceDownError) {
    console.error(error.message)  // "Exchange Service is offline."
    console.error(error.cause)    // the original failure
  } else {
    throw error
  }
}
```

## Simulated behavior

`ExchangeService` stands in for a third party HTTP API. On every call, in order:

| Step | Behavior |
| --- | --- |
| Failure | Throws `"We're going down"` on a 1-in-20 draw (5%), **before** sleeping — failures are instant |
| Latency | Sleeps 0, 1 or 2 whole seconds, each equally likely |
| Rate | Returns a uniformly random rate in `[1.45, 1.5]`, regardless of the currency pair |

These numbers are hardcoded to match the Ruby gem. There is no configuration to
turn them off. To get deterministic behavior in your own tests, stub
`Math.random` and use fake timers — see `test/support/random.mjs` for the
draw order.

`ExchangeService.validCurrency(currency)` reports whether a currency is one of
`USD` or `JPY`. Nothing calls it, and currencies are never validated.

## Development

```sh
npm install
npm test          # vitest run
npm run test:watch
node example-usage.mjs
node example-usage.cjs
```

The Node version is pinned in `.tool-versions` (24.14.1). The library itself runs
on Node 18+, but Vitest 4 requires `^20 || ^22 || >=24` and its install needs
npm 11+. If `npm install` fails with `Cannot read properties of null (reading
'edgesOut')`, your `npm` is older than your `node` — check with:

```sh
node --version && npm --version
```

With asdf, `asdf reshim nodejs` usually realigns them.

## License and Terms

This library is provided without warranty under the MIT license.
