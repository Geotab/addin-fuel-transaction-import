const assert = require('chai').assert;
const parsers = require('../../src/app/scripts/Parsers');
const transactionsExcelMock = require('./mocks/transactionsExcelMock.json');
const configurationMock = require('./mocks/configurationMock.json');

describe('Parsers', function(){
    it('String parsing 1', function(){
        assert.equal(parsers.parseStringValue('test'), 'test');
    });
    it('String parsing 2', function(){
        assert.equal(parsers.parseStringValue(''), '');
    });
    it('String parsing 3', function(){
        assert.equal(parsers.parseStringValue('(null)'), '');
    });
    it('parseString - integer test', function () {
        let result = parsers.parseString(23432);
        assert.isNotNull(result);
    });
    it('parseString - truncate test', function () {
        let result = parsers.parseString('This is a string truncate check', 10);
        assert.equal(result === 'This is a ', true);
    });
    it('parseString - boolean test', function () {
        let result = parsers.parseString(true);
        assert.equal(result === 'true', true);
    });
    it('parseString - Null test', function () {
        assert.throws(
            () => parsers.parseString(null),
            Error
        );
    });
    it('Float parsing - should work', function(){
        assert.equal(parsers.parseFloatValue(1.234), 1.234);
    });
    it('Float parsing - should work', function(){
        assert.equal(parsers.parseFloatValue('1.234'), 1.234);
    });
    it('Float parsing - Error produced', function(){
        assert.throws(
            () => parsers.parseFloatValue('test'),
            Error
        );
    });
    it('String length parsing', function(){
        assert.isTrue(parsers.parseStringLength('This is a long string', 4) === 'This');
    });
});