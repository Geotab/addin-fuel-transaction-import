const assert = require('chai').assert;
const dateHelper = require('../../src/app/scripts/DateHelper');

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

// getJSDate tests
describe('DateHelper Tests - getJSDate tests', function(){
   let config = {};
   let inputDate = [];
   let testDate;
   it('getJSDate - date object single', function(){
      inputDate[0] = new Date('2022-04-16');
      inputDate[1] = null;
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2022-04-16T00:00:00.000Z');
   });
   it('getJSDate - date object double', function(){
      inputDate[0] = new Date('2022-04-16');
      inputDate[1] = new Date('2022-04-16T12:00:00');
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2022-04-16T10:00:00.000Z');
   });
   it('getJSDate - date string - single - Germany', function(){
      inputDate[0] = '2022-04-16';
      inputDate[1] = null;
      config.dateFormat = 'yyyy-MM-dd';
      config.timeFormat = null;
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2022-04-15T22:00:00.000Z');
   });
   it('getJSDate - date string single long date', function(){
      inputDate[0] = '04/16/2023 14:00';
      inputDate[1] = null;
      config.dateFormat = 'MM/dd/yyyy HH:mm';
      config.timeFormat = null;
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2023-04-16T12:00:00.000Z');
   });
   it('getJSDate - date string double', function(){
      inputDate[0] = '04/16/2023';
      inputDate[1] = '14:00';
      config.dateFormat = 'MM/dd/yyyy';
      config.timeFormat = 'HH:mm';
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2023-04-16T12:00:00.000Z');
   });
   it('getJSDate - date string double 2', function(){
      inputDate[0] = '04162023';
      inputDate[1] = '1400';
      config.dateFormat = 'MMddyyyy';
      config.timeFormat = 'HHmm';
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2023-04-16T12:00:00.000Z');
   });
   it('getJSDate - date string double 2', function(){
      inputDate[0] = '04162023';
      inputDate[1] = '1400';
      config.dateFormat = 'MMddyyyy';
      config.timeFormat = 'HHmm';
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2023-04-16T12:00:00.000Z');
   });
   it('getJSDate - date string - single - French', function(){
      inputDate[0] = '16/04/2022';
      inputDate[1] = null;
      config.dateFormat = 'dd/MM/yyyy';
      config.timeFormat = null;
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2022-04-15T22:00:00.000Z');
   });
   it('getJSDate - date string - single - Italian', function(){
      inputDate[0] = '16.04.22';
      inputDate[1] = null;
      config.dateFormat = 'dd.MM.yy';
      config.timeFormat = null;
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2022-04-15T22:00:00.000Z');
   });
   // exceptions
});

// End to End tests
describe('DateHelper Tests - E2E', function(){
   let config = {};
   let inputDate = [];
   let testDate;
   it('getJSDate - E2E - Dubai (+4) -> Zurich (+1)', function(){
      inputDate[0] = '2017-07-15';
      inputDate[1] = '16:00';
      config.dateFormat = 'yyyy-MM-dd';
      config.timeFormat = 'HH:mm';
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2017-07-15T14:00:00.000Z');
      let resultDate = dateHelper.getDateAdjusted(testDate, 'Asia/Dubai', 'Europe/Zurich');
      assert.equal(resultDate.toISOString(), '2017-07-15T12:00:00.000Z');
   });
   it('getJSDate - E2E - Cayman (-5) -> Zurich (+1)', function(){
      inputDate[0] = '2017-07-15';
      inputDate[1] = '16:00';
      config.dateFormat = 'yyyy-MM-dd';
      config.timeFormat = 'HH:mm';
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2017-07-15T14:00:00.000Z');
      let resultDate = dateHelper.getDateAdjusted(testDate, 'America/Cayman', 'Europe/Zurich');
      assert.equal(resultDate.toISOString(), '2017-07-15T21:00:00.000Z');
   });
   it('getJSDate - E2E - Zurich (+1) -> Zurich (+1)', function(){
      inputDate[0] = '2017-07-15';
      inputDate[1] = '16:00';
      config.dateFormat = 'yyyy-MM-dd';
      config.timeFormat = 'HH:mm';
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2017-07-15T14:00:00.000Z');
      let resultDate = dateHelper.getDateAdjusted(testDate, 'Europe/Zurich', 'Europe/Zurich');
      assert.equal(resultDate.toISOString(), '2017-07-15T14:00:00.000Z');
   });
   it('getJSDate - E2E - GMT (0) -> Zurich (+1)', function(){
      inputDate[0] = '2017-07-15';
      inputDate[1] = '16:00';
      config.dateFormat = 'yyyy-MM-dd';
      config.timeFormat = 'HH:mm';
      testDate = dateHelper.getJSDate(config, inputDate);
      assert.equal(testDate.toISOString(),'2017-07-15T14:00:00.000Z');
      let resultDate = dateHelper.getDateAdjusted(testDate, 'GMT', 'Europe/Zurich');
      assert.equal(resultDate.toISOString(), '2017-07-15T16:00:00.000Z');
   });
});