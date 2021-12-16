#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const puppeteer_autoscroll_down_1 = require("puppeteer-autoscroll-down");
const console_table_printer_1 = require("console-table-printer");
const collection_slug = 'boredapeyachtclub';
const stepsLimit = 15;
const collect = ({ page, x }) => {
    return page.$x(x)
        .then(els => Promise.all(els.map(el => page.evaluate(el => el.textContent, el))));
};
const colorForRank = (rank) => {
    const ranking = parseInt(rank.substring(1).trim());
    if (ranking < 2000) {
        return chalk_1.default.green;
    }
    else if (ranking < 6000) {
        return chalk_1.default.yellow;
    }
    return chalk_1.default.white;
};
void (async () => {
    const browser = await puppeteer_1.default.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(`https://opensea.io/collection/${collection_slug}?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW`);
    const namesToPrices = {};
    for (let i = 0; i < stepsLimit; i += 1) {
        await (0, puppeteer_autoscroll_down_1.scrollPageToBottom)(page, {
            size: 500,
            delay: 240,
            stepsLimit: 1,
        });
        const [names, prices,] = await Promise.all([
            collect({ page, x: "//div[contains(@class, 'AssetCardFooter--name')]" }),
            collect({ page, x: "//div[contains(@class, 'AssetCardFooter--price')]" })
                .then(arr => arr.filter((_, i) => i % 2 === 1)),
        ]);
        for (let j = 0; j < names.length; j += 1) {
            const name = names[j];
            namesToPrices[name] = prices[j];
        }
    }
    const results = await Promise.all(Object.entries(namesToPrices)
        .map(async ([k, v]) => {
        const page = await browser.newPage();
        await page.goto(`https://rarity.tools/${collection_slug}/view/${k}`);
        const x = "//span[contains(@class, 'font-bold whitespace-nowrap')]";
        await page.waitForXPath(x);
        const [res] = await collect({ page, x });
        if (res) {
            const rank = res.substring('Rarity Rank: '.length);
            return [k, v, rank];
        }
        return null;
    }));
    await browser.close();
    console.clear();
    console.log();
    console.log();
    console.log(`🛳️  OpenSea floor rarity for ${chalk_1.default.green(chalk_1.default.bold(collection_slug))}:`);
    console.log();
    console.log();
    (0, console_table_printer_1.printTable)(results.map(([id, price, rank]) => ({
        'Token ID': chalk_1.default.bold `#${id}`,
        'Price': `${price.trim()}Ξ`,
        'Ranking on rarity.tools™': colorForRank(rank)(rank),
    })));
    console.log();
    console.log();
})();
//# sourceMappingURL=index.js.map