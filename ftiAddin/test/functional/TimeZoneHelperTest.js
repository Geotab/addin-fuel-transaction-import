const assert = require('chai').assert;
const timeZoneHelper = require('../../src/app/scripts/TimeZoneHelper');

describe('Time Zone Tests', function(){
   it('Same time zone - should return a zero offset', function(){
      let source = 'Europe/Zurich'; //+1
      let dest = 'Europe/Amsterdam'; //+1
      assert.equal(timeZoneHelper.GetTimeZoneOffset(source, dest), 0);
   });
   it('Different time zones - should return a 2 hour difference', function(){
      let source = 'Africa/Djibouti';//+3
      let dest = 'Africa/Kinshasa';//+1
      assert.equal(timeZoneHelper.GetTimeZoneOffset(source, dest), -2);
   });
   it('Different time zones - should return a 1 hour difference', function(){
      let source = 'CET';//+1
      let dest = 'Etc/GMT';//0
      assert.equal(timeZoneHelper.GetTimeZoneOffset(source, dest), -1);
   });
   it('Different time zones - should return a -3 hour difference', function(){
      let source = 'Canada/Eastern';//-5
      let dest = 'Brazil/DeNoronha';//-2
      assert.equal(timeZoneHelper.GetTimeZoneOffset(source, dest), 3);
   });
   it('Different time zones - should return a -3 hour difference', function(){
      let source = 'Canada/Eastern';//-5
      let dest = 'Europe/Zurich';//+1
      assert.equal(timeZoneHelper.GetTimeZoneOffset(source, dest), 6);
   });
});