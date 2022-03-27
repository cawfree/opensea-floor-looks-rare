#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import {scrollPageToBottom} from 'puppeteer-autoscroll-down';
import {printTable} from 'console-table-printer';
import yargs from 'yargs/yargs';

const {
  collection_slug: maybeCollectionSlug,
  number_of_steps: maybeNumberOfSteps,
  reference_collection_slug: maybeReferenceCollectionSlug,
} = yargs(process.argv).argv as {
  readonly collection_slug?: string;
  readonly number_of_steps?: string;
  readonly reference_collection_slug?: string;
};

// Assume one-to-one with OpenSea?
const collection_slug = maybeCollectionSlug || 'boredapeyachtclub';
const number_of_steps = maybeNumberOfSteps || 8;
const reference_collection_slug = maybeReferenceCollectionSlug || collection_slug;

const collect = ({page, x}: {
  readonly page: puppeteer.Page;
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

void (async () => {

  const browser = await puppeteer.launch({headless: false});
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
      collect({page, x: "//div[contains(@class, 'AssetCardFooter--price')]"})
        .then(arr => arr.filter((_, i) => i % 2 === 1)),
    ]);

    for (let j = 0; j < ids.length; j += 1) {
      const id = ids[j];
      idsToPrices[id] = prices[j];
    }
  }

  // Next, determine their rarity.
  const results = await Promise.all(
    Object.entries(idsToPrices)
      .map(async ([k, v]) => {
        const page = await browser.newPage();
        await page.goto(`https://rarity.tools/${reference_collection_slug}/view/${k}`);
        const x = "//span[contains(@class, 'font-bold whitespace-nowrap')]";
        await page.waitForXPath(x);
        const [res] = await collect({page, x});
        if (res) {
          const rank = res.substring('Rarity Rank: '.length);
          return [k, v, rank];
        }
        return null;
      }),
  );

  await browser.close();

  console.clear();
  console.log();
  console.log();
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

  console.log();
  console.log();

})();


