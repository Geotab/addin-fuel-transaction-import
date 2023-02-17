const assert = require('chai').assert;
const parsers = require('../../src/app/scripts/Parsers');
const transactionsMockDates = require('./mocks/transactionsMockDates.json');
const configurationMockDates = require('./mocks/configurationMockDates.json');

describe('Date Parsing', function(){
    it('Test ISO formatting - is a valid ISO format', function(){
        assert.equal(parsers.isIsoDate('2020-05-19T23:00:00.000Z'), true);
    });
    it('Test ISO formatting - are not valid ISO formats', function(){
        assert.equal(parsers.isIsoDate('2020-05-1923:00:00.000Z'), false);
        assert.equal(parsers.isIsoDate('2020-05-19'), false);
        assert.equal(parsers.isIsoDate('2020/05/19T23:00:00.000Z'), false);
        assert.equal(parsers.isIsoDate('20200519T23:00:00.000Z'), false);
        assert.equal(parsers.isIsoDate('29/05/2021'), false);
    });
    it('Date is not populated', function(){
        assert.equal(parsers.getDate(
            {}, new Array()), null);
    });
    it('Date supplied, no time, co config, valid date returned', 
        function(){
            assert.equal(
                parsers.getDate(
                    {}, 
                    new Array(new Date("2009-09-09"))).toISOString()
                    , "2009-09-09T00:00:00.000Z");
    });
    it('Date object supplied, no time, config, valid date returned', 
        function(){
            assert.equal(
                parsers.getDate(
                    {"isCellDateType": "Y"}, 
                    new Array(new Date("2009-09-09"))).toISOString()
                    , "2009-09-09T00:00:00.000Z");
    });
    it('Date string supplied, time string supplied, date format not supplied. Returns null', 
        function(){
            assert.equal(
                parsers.getDate(
                    {"isCellDateType": "N"}, 
                    new Array("2009-09-09", "1335"))
                    , null);
    });
    it('Date string supplied, time string supplied, date & time format supplied. valid date returned', 
        function(){
            assert.equal(
                parsers.getDate(
                    {
                        "dateFormat": "YYYY-MM-DD",
                        "timeFormat": "HHmm",
                        "isCellDateType": "N"
                    }, 
                    new Array("2009-09-14", "1335")).toISOString()
                    , "2009-09-14T11:35:00.000Z");
    });
    it('Date object supplied, time object supplied, notformat supplied. valid date returned', 
    function(){
        assert.equal(
            parsers.getDate(
                {
                    "isCellDateType": "N"
                }, 
                new Array(
                    new Date("2009-09-14"), 
                    new Date("2009-09-09 14:55:00"))).toISOString()
                , "2009-09-14T12:55:00.000Z");
    });

});