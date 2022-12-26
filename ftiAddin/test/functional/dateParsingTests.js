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
    it('Date parsing - not date formatted - single cell', function(){
        assert.equal(parsers.parseDate(configurationMockDates.providers[0], transactionsMockDates[0].dateTime, 'Europe/Berlin'), '2020-05-24T22:00:00.000Z');
        assert.equal(parsers.parseDate(configurationMockDates.providers[1], transactionsMockDates[1].dateTime, 'Europe/Berlin'), '2020-05-25T18:29:00.000Z');
        assert.equal(parsers.parseDate(configurationMockDates.providers[2], transactionsMockDates[2].dateTime, 'Europe/Berlin'), '2020-05-24T22:00:00.000Z');
        assert.equal(parsers.parseDate(configurationMockDates.providers[3], transactionsMockDates[3].dateTime, 'Europe/Berlin'), '2020-05-25T19:29:00.000Z');
        assert.equal(parsers.parseDate(configurationMockDates.providers[4], transactionsMockDates[4].dateTime, 'Europe/Berlin'), '2020-05-24T22:00:00.000Z');
        assert.equal(parsers.parseDate(configurationMockDates.providers[5], transactionsMockDates[5].dateTime, 'Europe/London'), '2020-05-25T19:29:00.000Z');
    });
    it('Date parsing - not date formatted - date and time split', function(){
        assert.equal(parsers.parseDate(configurationMockDates.providers[9], transactionsMockDates[9].dateTime, 'Europe/Berlin'), '2020-02-23T11:54:00.000Z');
        assert.equal(parsers.parseDate(configurationMockDates.providers[10], transactionsMockDates[10].dateTime, 'Europe/Berlin'), '2020-02-23T11:54:00.000Z');
        assert.equal(parsers.parseDate(configurationMockDates.providers[11], transactionsMockDates[11].dateTime, 'Europe/Berlin'), '2020-02-23T11:54:00.000Z');
    });
    it('Date parsing - date formatted - single cell', function(){
        assert.equal(parsers.parseDate(configurationMockDates.providers[6], transactionsMockDates[6].dateTime, 'Europe/Berlin'), '2020-02-22T23:00:00.000Z');
        assert.equal(parsers.parseDate(configurationMockDates.providers[7], transactionsMockDates[7].dateTime, 'Europe/Berlin'), '2020-07-23T22:00:00.000Z');
        assert.equal(parsers.parseDate(configurationMockDates.providers[8], transactionsMockDates[8].dateTime, 'Europe/London'), '2020-12-24T23:00:00.000Z');
    });
});