const assert = require('chai').assert;
const parsers = require('../../src/app/scripts/Parsers')

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
    it('Date parsing', function(){
        assert.equal(parsers.parseDateValue('2/15/2022'), '2022-02-15T00:00:00.000Z');
    });
    it('String length parsing', function(){
        assert.isTrue(parsers.parseStringLength('This is a long string', 4) === 'This');
    });
    // it('Date parsing', function(){
    //     assert.equal(parsers.parseDateValue('16/2/2022'), '2022-02-16T00:00:00.000Z');
    // });
    // it('Date parsing', function(){
    //     assert.equal(parsers.parseDateValue('16/2/2022 16:23'), '2022-02-16T16:23:00.000Z');
    // });
    // it('Date parsing', function(){
    //     assert.equal(parsers.parseDateValue('16/02/2022'), '2022-02-16T00:00:00.000Z');
    // });
    // it('Date parsing', function(){
    //     assert.equal(parsers.parseDateValue('16/2/22'), '2022-02-16T00:00:00.000Z');
    // });
});