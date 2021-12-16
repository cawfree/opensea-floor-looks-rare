# opensea-floor-looks-rare

## 📚 How it works

This project depends on [__Puppeteer__](https://github.com/puppeteer/puppeteer) to programmatically scrape [__OpenSea__](https://opensea.io/) and [__rarity.tools__](https://rarity.tools/) for data, since it's not directly available using an API.

`opensea-floor-looks-rare` browses a specified NFT collection on OpenSea (ordered by `BUY_NOW`, `PRICE_ASCENDING`, i.e. sorts by the cheapest available to purchase), and parses the webpage for the currently available floor prices. Once collected, it combines the collected information with rarity data sourced by rarity tools.

This means you'll need to have a [__Chromium Browser__](https://www.chromium.org/) installed and `opensea-floor-looks-rare` will try to programmatically automate a browser window. It'll _look_ scary, but it isn't.

## 🚀 Usage

To invoke, use `npx opensea-floor-looks-rare`:

```sh
npx opensea-floor-looks-rare --collection_slug="rumble-kong-league" --number_of_steps=5
```

You may specify a `collection_slug` to control which collection of NFTs to search for, and a `number_of_steps` to roughly control how many NFTs on the OpenSea floor are processed.

With no parameters specified, it'll default to `--collection_slug=boredapeyachtclub --number_of_steps=15`.

## ✌️ License
[__MIT__](./LICENSE.md)
