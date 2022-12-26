const assert = require('chai').assert;
const parsers = require('../../src/app/scripts/Parsers');
const transactionsExcelMock = require('./mocks/transactionsExcelMock.json');
const configurationMock = require('./mocks/configurationMock.json');

describe('Parsers', function(){
    it('String parsing', function(){
        assert.equal(parsers.parseStringValue('test'), 'test');
    });
    it('String parsing', function(){
        assert.equal(parsers.parseStringValue(''), '');
    });
    it('String parsing', function(){
        assert.equal(parsers.parseStringValue('(null)'), '');
    });
    it('Float parsing', function(){
        assert.equal(parsers.parseFloatValue(1.234), 1.234);
    });
    it('Float parsing', function(){
        assert.equal(parsers.parseFloatValue('1.234'), 1.234);
    });
    it('Float parsing', function(){
        assert.equal(parsers.parseFloatValue('test'), 0);
    });
    it('String length parsing', function(){
        assert.isTrue(parsers.parseStringLength('This is a long string', 4) === 'This');
    });
});