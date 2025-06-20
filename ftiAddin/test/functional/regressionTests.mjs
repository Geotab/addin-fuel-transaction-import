import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
// import mocks from './mocks/mocks.js';
// import { assert } from 'chai';

dotenv.config({
   path: '../../.env'
});

// puppeteer options
const opts = {
   headless: false,
   slowMo: 0,
   timeout: 10000,
   defaultViewport: null,
};

(async () => {

   let browser,
      page;

   browser = await puppeteer.launch(opts);
   page = await browser.newPage();
   //Login
   await page.goto('http://localhost:9000/');
   await page.waitForSelector('#loginDialog');
   await page.type('#email', process.env.EMAIL);
   await page.type('#password', process.env.PASSWORD);
   await page.type('#database', process.env.DATABASE);
   await page.type('#server', process.env.SERVER);
   await page.click('#loginBtn');

   const inputFileProviderFile = await page.waitForSelector('#providerFile');
   await inputFileProviderFile.uploadFile('./regression/qa.json');
   await page.select('#providerDropdown', 'Test6-Good');
   const inputFileImportFile = await page.waitForSelector('#importFile');
   await inputFileImportFile.uploadFile('./regression/qaGood.xlsx');
   await page.click('#importButton');

   console.log('clicked import button');
   // const data = await page.$$eval('#outputDiv', results => {
   //    //console.log('results', results);
   //    return results;
   //    // return results.map(row => {
   //    //    const columns = row.querySelectorAll('td');
   //    //    return Array.from(columns).map(column => column.innerText);
   //    // });
   //    // results.map(row => {
   //    //    const columns = row.querySelectorAll('td');
   //    //    return Array.from(columns).map(column => column.innerText);
   //    // });
   // });

   //const result = await page.$eval('#ftiParentDiv > h2', el => el.innerText);
   // const result = await page.$$eval('#ftiParentDiv > h2', el => {
   //       return el.map(e => e.innerText);
   //    });

   await page.waitForSelector('#ImportSummaryTable');

   // #checkmateContent > #ftiAddin > #ftiParentDiv > #outputDiv > table#ImportSummaryTable > tbody > tr > td
   // this works
   // const result = await page.$$eval('table#ImportSummaryTable > tbody > tr > td', data => {
   //    return data.map(td => {
   //       return td.innerText;
   //    });
   // });

   const result = await page.$$eval('table#ImportSummaryTable > tbody > tr', rows => {
      return Array.from(rows, row => {
         const columns = row.querySelectorAll('td');
         return Array.from(columns, column => column.innerText);
      });
   });

   if(result[0][1]) {
      const imported = parseInt(result[0][1]);
      const skipped = parseInt(result[1][1]);
      const errors = parseInt(result[2][1]);
      console.log(`Imported: ${imported}, skipped: ${skipped}, errors: ${errors}`);
   }
   //console.log(result[1][1]);

   console.log('finished');

   // Close Page
   // after(async () => {
   //    await browser.close();
   // });
   await browser.close();

})();