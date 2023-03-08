const assert = require('chai').assert;
const dateHelper = require('../../src/app/scripts/DateHelper');

describe('DateHelper Tests - getDateAdjusted tests', function(){
   it('getDateAdjusted - Dubai', function(){
      let date = new Date('2017-07-15T16:00:00.000Z'); //+4
      let resultDate = dateHelper.getDateAdjusted(date, 'Asia/Dubai', 'Europe/Zurich');
      //console.log(resultDate.toISOString());
      assert.equal(resultDate.toISOString(), '2017-07-15T12:00:00.000Z');
   });
   it('getDateAdjusted - Cayman', function(){
      let date = new Date('2017-07-15T16:00:00.000Z'); //-5
      let resultDate = dateHelper.getDateAdjusted(date, 'America/Cayman', 'Europe/Zurich');
      //console.log(resultDate.toISOString());
      assert.equal(resultDate.toISOString(), '2017-07-15T21:00:00.000Z');
   });
   it('getDateAdjusted GMT', function(){
      let date = new Date('2017-07-15T16:00:00.000Z');
      let resultDate = dateHelper.getDateAdjusted(date, 'GMT', 'Europe/Zurich');
      //console.log(resultDate.toISOString());
      assert.equal(resultDate.toISOString(), '2017-07-15T16:00:00.000Z');
   });
   it('getDateAdjusted Local', function(){
      let date = new Date('2017-07-15T16:00:00.000Z');
      let resultDate = dateHelper.getDateAdjusted(date, 'Europe/Zurich', 'Europe/Zurich');
      //console.log(resultDate.toISOString());
      assert.equal(resultDate.toISOString(), '2017-07-15T14:00:00.000Z');
   });
});

