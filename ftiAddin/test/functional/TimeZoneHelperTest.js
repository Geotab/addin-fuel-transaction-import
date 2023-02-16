const assert = require('chai').assert;
const timeZoneHelper = require('../../src/app/scripts/TimeZoneHelper');

describe('Time Zone Tests', function(){
   it('Same time zone - should return a zero offset', function(){
      let source = 'Europe/Zurich';
      let dest = 'Europe/Amsterdam';
      assert.equal(timeZoneHelper.GetTimeZoneOffset(source, dest), 0);
   });
   it('Different time zones - should return a 2 hour difference', function(){
      let source = 'Africa/Djibouti';
      let dest = 'Africa/Kinshasa';
      assert.equal(timeZoneHelper.GetTimeZoneOffset(source, dest), 2);
   });
   it('Different time zones - should return a 1 hour difference', function(){
      let source = 'CET';
      let dest = 'Etc/GMT';
      assert.equal(timeZoneHelper.GetTimeZoneOffset(source, dest), 1);
   });
   it('Different time zones - should return a -3 hour difference', function(){
      let source = 'Canada/Eastern';
      let dest = 'Brazil/DeNoronha';
      assert.equal(timeZoneHelper.GetTimeZoneOffset(source, dest), -3);
   });
});