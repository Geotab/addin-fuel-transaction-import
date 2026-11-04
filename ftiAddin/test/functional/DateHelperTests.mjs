import { assert } from 'chai';
import * as dateHelper from '../../src/app/scripts/DateHelper.js';
import { DateError } from '../../src/app/scripts/date-error.js';

// getDateAdjusted tests
describe('DateHelper Tests - getDateAdjusted tests', function(){
   it('getDateAdjusted - Dubai', function(){
      let date = new Date('2017-07-15T16:00:00.000'); //+4
      let resultDate = dateHelper.getDateAdjusted(date, 'Asia/Dubai', 'Europe/Zurich');
      assert.equal(resultDate.toISOString(), '2017-07-15T12:00:00.000Z');
   });
   it('getDateAdjusted - Cayman', function(){
      let date = new Date('2017-07-15T16:00:00.000'); //-5
      let resultDate = dateHelper.getDateAdjusted(date, 'America/Cayman', 'Europe/Zurich');
      //console.log(resultDate.toISOString());
      assert.equal(resultDate.toISOString(), '2017-07-15T21:00:00.000Z');
   });
   it('getDateAdjusted GMT', function(){
      let date = new Date('2017-07-15T16:00:00.000');
      let resultDate = dateHelper.getDateAdjusted(date, 'GMT', 'Europe/Zurich');
      //console.log(resultDate.toISOString());
      assert.equal(resultDate.toISOString(), '2017-07-15T16:00:00.000Z');
   });
   it('getDateAdjusted Local', function(){
      let date = new Date('2017-07-15T16:00:00.000');
      let resultDate = dateHelper.getDateAdjusted(date, 'Europe/Zurich', 'Europe/Zurich');
      //console.log(resultDate.toISOString());
      assert.equal(resultDate.toISOString(), '2017-07-15T14:00:00.000Z');
   });
});

// getDate tests
describe('DateHelper Tests - New getDate tests', function () {
   let config = {
      dateFormat: 'yyyy-MM-dd',
      timeFormat: 'HH:mm:ss'
   };
   let inputDate = [];
   let testDate;
   it('getDate: date object, date only test', function () {
      inputDate[0] = new Date('2022-04-16');
      inputDate[1] = null;
      testDate = dateHelper.getDate(config, inputDate);
      assert.equal(testDate.toISOString(), '2022-04-16T00:00:00.000Z');
   });
   it('getDate: date object, date and time test', function () {
      inputDate[0] = new Date('2022-04-16');
      inputDate[1] = new Date('2022-04-16T12:00:00');
      testDate = dateHelper.getDate(config, inputDate);
      assert.equal(testDate.toISOString(), '2022-04-16T10:00:00.000Z');
   });
   it('getDate: date string, date only, Germany', function () {
      inputDate[0] = '2022-04-16';
      inputDate[1] = null;
      config.dateFormat = 'yyyy-MM-dd';
      config.timeFormat = null;
      testDate = dateHelper.getDate(config, inputDate);
      assert.equal(testDate.toISOString(), '2022-04-15T22:00:00.000Z');
   });
   it('getDate: date string, date only test', function () {
      inputDate[0] = '04/16/2023 14:00';
      inputDate[1] = null;
      config.dateFormat = 'MM/dd/yyyy HH:mm';
      config.timeFormat = null;
      testDate = dateHelper.getDate(config, inputDate);
      assert.equal(testDate.toISOString(), '2023-04-16T12:00:00.000Z');
   });
   it('getDate: date string, date and time test', function () {
      inputDate[0] = '04/16/2023';
      inputDate[1] = '14:00';
      config.dateFormat = 'MM/dd/yyyy';
      config.timeFormat = 'HH:mm';
      testDate = dateHelper.getDate(config, inputDate);
      assert.equal(testDate.toISOString(), '2023-04-16T12:00:00.000Z');
   });
   it('getDate: date string, date and time', function () {
      inputDate[0] = '04162023';
      inputDate[1] = '1400';
      config.dateFormat = 'MMddyyyy';
      config.timeFormat = 'HHmm';
      testDate = dateHelper.getDate(config, inputDate);
      assert.equal(testDate.toISOString(), '2023-04-16T12:00:00.000Z');
   });
   it('getDate: date number, date and time test', function () {
      inputDate[0] = 20230416;
      inputDate[1] = 1400;
      config.dateFormat = 'yyyyMMdd';
      config.timeFormat = 'HHmm';
      testDate = dateHelper.getDate(config, inputDate);
      assert.equal(testDate.toISOString(), '2023-04-16T12:00:00.000Z');
   });
   it('getDate: date number, date test', function () {
      inputDate[0] = 20230416;
      inputDate[1] = null;
      config.dateFormat = 'yyyyMMdd';
      config.timeFormat = null;
      testDate = dateHelper.getDate(config, inputDate);
      assert.equal(testDate.toISOString(), '2023-04-15T22:00:00.000Z');
   });
   it('getDate: date string - single - French', function () {
      inputDate[0] = '16/04/2022';
      inputDate[1] = null;
      config.dateFormat = 'dd/MM/yyyy';
      config.timeFormat = null;
      testDate = dateHelper.getDate(config, inputDate);
      assert.equal(testDate.toISOString(), '2022-04-15T22:00:00.000Z');
   });
   it('getDate: date string - single - Italian', function () {
      inputDate[0] = '16.04.22';
      inputDate[1] = null;
      config.dateFormat = 'dd.MM.yy';
      config.timeFormat = null;
      testDate = dateHelper.getDate(config, inputDate);
      assert.equal(testDate.toISOString(), '2022-04-15T22:00:00.000Z');
   });
   it('getDate: 1. Invalid date passed - should throw an error', function () {
      inputDate[0] = true;
      inputDate[1] = null;
      config.dateFormat = 'dd.MM.yy';
      config.timeFormat = null;
      assert.throws(
         (testDate) => dateHelper.getDate(config, inputDate),
         DateError
      );
   });
   it('getDate: 2. Invalid date passed - should throw an error', function () {
      inputDate[0] = undefined;
      inputDate[1] = null;
      config.dateFormat = 'dd.MM.yy';
      config.timeFormat = null;
      assert.throws(
         (testDate) => dateHelper.getDate(config, inputDate),
         DateError
      );
   });
   it('getDate: 3. Invalid date passed - should throw an error', function () {
      inputDate[0] = null;
      inputDate[1] = null;
      config.dateFormat = 'dd.MM.yy';
      config.timeFormat = null;
      assert.throws(
         (testDate) => dateHelper.getDate(config, inputDate),
         DateError
      );
   });
   it('getDate: date string, date only, Germany', function () {
      inputDate[0] = '20220416';
      inputDate[1] = null;
      config.dateFormat = 'yyyy-MM-dd';
      config.timeFormat = null;
      assert.throws(
         (testDate) => dateHelper.getDate(config, inputDate),
         DateError
      )
   });
});

describe('Date/time parsing from Excel date cells and text time cells', function () {
   const config = {
      dateFormat: 'dd/MM/yyyy',
      timeFormat: 'HH:mm'
   };

   it('trims padded HH:mm and defaults seconds to zero', function () {
      // EDC sample row: Excel date cell plus padded time text from column C.
      const date = new Date(2026, 8, 10, 0, 0, 0, 0);
      const result = dateHelper.getDate(config, [date, '  09:57']);

      assert.deepEqual(
         [result.getFullYear(), result.getMonth(), result.getDate(), result.getHours(), result.getMinutes(), result.getSeconds(), result.getMilliseconds()],
         [2026, 8, 10, 9, 57, 0, 0]
      );
   });

   it('trims padded HH:mm:ss and preserves explicit seconds', function () {
      const date = new Date(2026, 8, 10, 0, 0, 0, 0);
      const result = dateHelper.getDate(config, [date, '  09:57:42 ']);

      assert.deepEqual(
         [result.getFullYear(), result.getMonth(), result.getDate(), result.getHours(), result.getMinutes(), result.getSeconds(), result.getMilliseconds()],
         [2026, 8, 10, 9, 57, 42, 0]
      );
   });

   it('rejects malformed and out-of-range text times', function () {
      const date = new Date(2026, 8, 10, 0, 0, 0, 0);
      const invalidTimes = ['9', '   ', '24:00', '09:60', '09:57:60', '09:57:59.9', '09:57:', '09::57', '09:57:00:01', 957, 0.415];

      invalidTimes.forEach(time => {
         assert.throws(() => dateHelper.getDate(config, [date, time]), DateError);
      });
   });
});
