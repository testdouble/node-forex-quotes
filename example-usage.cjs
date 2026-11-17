const { ForexDataClient } = require('./index.js')

// The key is stored but never used - this library makes no network calls.
const client = new ForexDataClient('fake-api-key')

async function main() {
  console.log(await client.getRate({ from: 'USD', to: 'JPY' }))
  console.log(await client.convert({ from: 'USD', to: 'JPY', amount: 100 }))
}

main()
