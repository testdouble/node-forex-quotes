import { ForexDataClient } from './index.mjs'

// The key is stored but never used - this library makes no network calls.
const client = new ForexDataClient('fake-api-key')

console.log(await client.getRate({ from: 'USD', to: 'JPY' }))
console.log(await client.convert({ from: 'USD', to: 'JPY', amount: 100 }))
