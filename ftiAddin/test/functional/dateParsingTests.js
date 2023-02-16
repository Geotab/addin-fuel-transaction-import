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
        assert.equal(parsers.parseMomentDate(
            {}, new Array()), null);
    });
    it('Date supplied, no time, co config, valid date returned', 
        function(){
            assert.equal(
                parsers.parseMomentDate(
                    {}, 
                    new Array(new Date("2009-09-09")))
                    , "2009-09-09T00:00:00.000Z");
    });
    it('Date object supplied, no time, config, valid date returned', 
        function(){
            assert.equal(
                parsers.parseMomentDate(
                    {"isCellDateType": "Y"}, 
                    new Array(new Date("2009-09-09")))
                    , "2009-09-09T00:00:00.000Z");
    });
    it('Date string supplied, time string supplied, date format not supplied. Returns null', 
        function(){
            assert.equal(
                parsers.parseMomentDate(
                    {"isCellDateType": "N"}, 
                    new Array("2009-09-09", "1335"))
                    , null);
    });
    it('Date string supplied, time string supplied, date & time format supplied. valid date returned', 
        function(){
            assert.equal(
                parsers.parseMomentDate(
                    {
                        "dateFormat": "YYYY-MM-DD",
                        "timeFormat": "HHmm",
                        "isCellDateType": "N"
                    }, 
                    new Array("2009-09-14", "1335"))
                    , "2009-09-14T13:35:00.000Z");
    });
    it('Date object supplied, time object supplied, notformat supplied. valid date returned', 
    function(){
        assert.equal(
            parsers.parseMomentDate(
                {
                    "isCellDateType": "N"
                }, 
                new Array(
                    new Date("2009-09-14"), 
                    new Date("2009-09-09 14:55:00")))
                , "2009-09-14T12:55:00.000Z");
});
    // it('Date parsing - not date formatted - single cell', function(){
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[0], transactionsMockDates[0].dateTime), '2020-05-25T00:00:00.000Z');
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[1], transactionsMockDates[1].dateTime), '2020-05-25T20:29:00.000Z');
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[2], transactionsMockDates[2].dateTime), '2020-05-25T00:00:00.000Z');
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[3], transactionsMockDates[3].dateTime), '2020-05-25T21:29:00.000Z');
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[4], transactionsMockDates[4].dateTime), '2020-05-25T00:00:00.000Z');
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[5], transactionsMockDates[5].dateTime), '2020-05-25T20:29:00.000Z');
    // });
    // it('Date parsing - not date formatted - date and time split', function(){
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[9], transactionsMockDates[9].dateTime), '2020-02-23T12:54:00.000Z');
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[10], transactionsMockDates[10].dateTime), '2020-02-23T12:54:00.000Z');
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[11], transactionsMockDates[11].dateTime), '2020-02-23T12:54:00.000Z');
    // });
    // it('Date parsing - date formatted - single cell', function(){
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[6], transactionsMockDates[6].dateTime), '2020-02-22T23:00:00.000Z');
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[7], transactionsMockDates[7].dateTime), '2020-07-23T22:00:00.000Z');
    //     assert.equal(parsers.parseMomentDate(configurationMockDates.providers[8], transactionsMockDates[8].dateTime), '2020-12-24T23:00:00.000Z');
    // });

});