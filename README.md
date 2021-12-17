# opensea-floor-looks-rare

## 📚 How it works! [(video)](https://twitter.com/cawfree/status/1471599400187273223)

This project depends on [__Puppeteer__](https://github.com/puppeteer/puppeteer) to programmatically scrape [__OpenSea__](https://opensea.io/) and [__rarity.tools__](https://rarity.tools/) for data, since it's not directly available using an API.

`opensea-floor-looks-rare` browses a specified NFT collection on OpenSea (ordered by `BUY_NOW`, `PRICE_ASCENDING`, i.e. sorts by the cheapest available to purchase), and parses the webpage for the currently available floor prices. Once collected, it combines the collected information with rarity data sourced by rarity tools.

This means you'll need to have a [__Chromium Browser__](https://www.chromium.org/) installed and `opensea-floor-looks-rare` will try to programmatically automate a browser window. It'll _look_ scary, but it isn't (you can always `yarn build` the repo if you wish to be cautious).

## 🚀 Usage!

To invoke, use `npx opensea-floor-looks-rare`:

```sh
npx opensea-floor-looks-rare --collection_slug="rumble-kong-league" --number_of_steps=5
```

You may specify a `collection_slug` to control which collection of NFTs to search for, and a `number_of_steps` to roughly control how many NFTs on the OpenSea floor are processed.

With no parameters specified, it'll default to `--collection_slug=boredapeyachtclub --number_of_steps=15`.

Once finished, you'll be presented with a table of the calculated rarities. You'll be surprised by the variation!

```
┌──────────┬────────┬──────────────────────────┐
│ Token ID │  Price │ Ranking on rarity.tools™ │
├──────────┼────────┼──────────────────────────┤
│    #1413 │ 48.84Ξ │                    #6607 │
│    #1715 │  52.4Ξ │                    #9695 │
│    #3003 │    53Ξ │                    #7571 │
│    #3041 │ 50.53Ξ │                    #8938 │
│    #3583 │    51Ξ │                    #9705 │
│    #4093 │  52.5Ξ │                    #6985 │
└──────────┴────────┴──────────────────────────┘
```

## ✌️ License!
[__MIT__](./LICENSE.md)
