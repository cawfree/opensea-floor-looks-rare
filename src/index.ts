#!/usr/bin/env node

import chalk from 'chalk';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import {scrollPageToBottom} from 'puppeteer-autoscroll-down';
import {printTable} from 'console-table-printer';
import yargs from 'yargs/yargs';

const {
  executable_path = '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
  collection_slug: maybeCollectionSlug,
  number_of_steps: maybeNumberOfSteps,
  reference_collection_slug: maybeReferenceCollectionSlug,
} = yargs(process.argv).argv as {
  readonly executable_path?: string;
  readonly collection_slug?: string;
  readonly number_of_steps?: string;
  readonly reference_collection_slug?: string;
};

// Assume one-to-one with OpenSea?
const collection_slug = maybeCollectionSlug || 'boredapeyachtclub';
const number_of_steps = maybeNumberOfSteps || 8;
const reference_collection_slug = maybeReferenceCollectionSlug || collection_slug;

const collect = ({page, x}: {
  readonly page: puppeteerCore.Page;
  readonly x: string;
}) => {
  return page.$x(x)
    .then(els => Promise.all(
      els.map(el => page.evaluate(el => el.textContent, el)),
    ));
};

const colorForRank = (rank: string) => {
  const ranking = parseInt(rank.substring(1).trim());
  if (ranking < 2000) {
    return chalk.green;
  } else if (ranking < 6000) {
    return chalk.yellow;
  }
  return chalk.white;
};

// https://stackoverflow.com/a/60779547
function toChunkedArray<T>(
  arr: readonly T[],
  chunkSize: number
) {
  return arr.reduce((acc, _, i) => {
    i % chunkSize === 0 && acc.push(arr.slice(i, i + chunkSize));
    return acc;
  }, [] as T[][]);
}

void (async () => {

  puppeteer.use(stealth());

  const browser = await puppeteer.launch({
    executablePath: executable_path,
    headless: true,
  });
  const page = await browser.newPage();

  await page.goto(
    `https://opensea.io/collection/${collection_slug}?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW`
  );

  const idsToPrices = {} as Record<string, string>;

  for (let i = 0; i < number_of_steps; i += 1) {
    await scrollPageToBottom(page as unknown as puppeteerCore.Page, {
      size: 500,
      delay: 240,
      stepsLimit: 1,
    });
    const [ids, prices] = await Promise.all([
      page.$x("//a[contains(@class, 'Asset--anchor')]")
        .then(els => Promise.all(
          els.map(el => page.evaluate(el => el.href, el)),
        ))
        .then(arr => arr.map(e => e.substring(e.lastIndexOf('/') + 1))),
      collect({
        page: page as unknown as puppeteerCore.Page,
        x: "//div[contains(@class, 'AssetCardFooter--price')]",
      })
        .then(arr => arr.filter((_, i) => i % 2 === 1)),
    ]);

    for (let j = 0; j < ids.length; j += 1) {
      const id = ids[j];
      idsToPrices[id] = prices[j];
    }
  }

  const chunkedIdsToPrices = toChunkedArray(
    Object.entries(idsToPrices).filter(([k]) => k.length),
    12
  );

  const results = [];

  for (let i = 0; i < chunkedIdsToPrices.length; i += 1) {
    const chunked = chunkedIdsToPrices[i];
    const nextResults = (await Promise.all(
      chunked.map(async ([k, price]) => {
        const page = await browser.newPage();
        await page.goto(`https://rarity.tools/${reference_collection_slug}/view/${k}`);
        try {
          const x = "//span[contains(@class, 'font-bold whitespace-nowrap')]";
          await page.waitForXPath(x);
          const [res] = await collect({
            page: page as unknown as puppeteerCore.Page,
            x,
          });
          await page.close();
          if (res) {
            const rank = res.substring('Rarity Rank: '.length);
            console.error(chalk.green`Succeeded in determining rarity for ${k}. (${rank} at ${price.trim()}Ξ)`);
            return [k, price, rank];
          }
        } catch (e) {
          await page.close();
          console.error(chalk.red`Failed to determine rarity for ${k}.`);
        }
        return null;
      }),
    ))
    .filter(Boolean);

    for (const result of nextResults) {
      results.push(result);
    }
  }

  await browser.close();

  console.clear();
  console.log();
  console.log();

  if (results.length) {
    console.log(`🛳️  OpenSea floor rarity for ${chalk.green(chalk.bold(collection_slug))}:`);
    console.log();
    console.log();
    if (maybeReferenceCollectionSlug) {
      console.log(chalk.yellow`Please note! Rarity values shown are for the reference collection "${maybeReferenceCollectionSlug}".`);
      console.log();
      console.log();
    }
    printTable(
      results.map(([id, price, rank]) => ({
        'Token ID': chalk.bold`#${id}`,
        'Price': `${price.trim()}Ξ`,
        'Ranking on rarity.tools™': colorForRank(rank)(rank),
      })),
    );
  } else {
    console.log(chalk.red`No results found. You may want to increase --number_of_steps.`);
  }

  console.log();
  console.log();

})();


