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
    it('String length parsing', function(){
        assert.isTrue(parsers.parseStringLength('This is a long string', 4) === 'This');
    });
    it('Date parsing - should work', function(){
        assert.equal(parsers.parseDate('16/2/2022','DD/M/YYYY', 'America/Los_Angeles'), '2022-02-16T08:00:00.000Z');
    });
    it('Date parsing - not sure', function(){
        assert.equal(parsers.parseDate('16/2/2022','M/D/YYYY', 'America/Los_Angeles'), null);
    });
    it('Date parsing - checking 1', function(){
        assert.equal(parsers.parseDate('16/2/2022','garbage', 'America/Los_Angeles'), null);
    });
    it('Date parsing - checking 2', function(){
        assert.equal(parsers.parseDate('16/2/2022 10:00:00','d/m/y', 'America/Los_Angeles'), null);
    });
    it('Date parsing - checking 3', function(){
        assert.equal(parsers.parseDate('16/2/2022 10:00:00','DD/MM/YYYY HH:mm:ss', 'America/Los_Angeles'), '2022-02-16T18:00:00.000Z');
    });
    it('Date parsing - minimum character check', function(){
        assert.equal(parsers.parseDate('220225','YYMMDD', 'America/Los_Angeles'), '2022-02-25T08:00:00.000Z');
    });
    it('Date format parsing', function() {
        assert.isFalse(parsers.parseDateFormat('DMY').ReturnValue);
    });
    it('Date format parsing', function() {
        assert.isFalse(parsers.parseDateFormat('YDM').ReturnValue);
    });
    it('Date format parsing', function() {
        assert.isFalse(parsers.parseDateFormat('MDY').ReturnValue);
    });
    it('Date format parsing :- Test1 - Must contain CAPITAL YY, MM and DD', function() {
        assert.isTrue(parsers.parseDateFormat('DDMMYY').ReturnValue);
    });
    it('Date format parsing :- Test1 - Must contain CAPITAL YY, MM and DD', function() {
        assert.isFalse(parsers.parseDateFormat('MMYY').ReturnValue);
    });
    it('Date format parsing :- Test1 - Must contain CAPITAL YY, MM and DD', function() {
        assert.isTrue(parsers.parseDateFormat('DDMMYYYY').ReturnValue);
    });
    it('Date format parsing :- Test1 - Must contain CAPITAL YY, MM and DD', function() {
        assert.isTrue(parsers.parseDateFormat('MMDDYYYY').ReturnValue);
    });
    it('Date format parsing :- Test1 - Must contain CAPITAL YY, MM and DD', function() {
        assert.isTrue(parsers.parseDateFormat('YYYYMMDD').ReturnValue);
    });
    it('Date format parsing :- Test1 - Must contain CAPITAL YY, MM and DD', function() {
        assert.isTrue(parsers.parseDateFormat('YYYYMMDD').ReturnValue);
    });
    it('Date format parsing :- Test2 - If longer than 11 characters then must contain h and m (any case)', function() {
        assert.isFalse(parsers.parseDateFormat('YYYY-MM-DD Pz').ReturnValue);
    });
    it('Date format parsing :- Test2 - If longer than 11 characters then must contain h and m (any case)', function() {
        assert.isTrue(parsers.parseDateFormat('MM-DD-YYYYTHH:mm:ss.SSSZ').ReturnValue);
    });
    it('Date format parsing :- Test2 - If longer than 11 characters then must contain h and m (any case)', function() {
        assert.isTrue(parsers.parseDateFormat('MMDDYYYYTh:m:sZ').ReturnValue);
    });
    it('Date format parsing :- Test2 - If longer than 11 characters then must contain h and m (any case)', function() {
        assert.isFalse(parsers.parseDateFormat('YY-MM-DDTYY:mm:ss.SSSZ').ReturnValue);
    });
    it('Date format parsing :- Test2 - If longer than 11 characters then must contain h and m (any case)', function() {
        assert.isFalse(parsers.parseDateFormat('YYMMDDTHH:MM:ss').ReturnValue);
    });
    it('Date format parsing :- Test2 - If longer than 11 characters then must contain h and m (any case)', function() {
        assert.isFalse(parsers.parseDateFormat('YY-MM-DD      ').ReturnValue);
    });
    it('Date format parsing :- Test3 - Only characters allowed -  Y, M, D, h, m, s, S or Z', function() {
        assert.isFalse(parsers.parseDateFormat('YY-MM-DD pqrst').ReturnValue);
    }); 
    it('Date format parsing :- Test3 - Only characters allowed -  Y, M, D, h, m, s, S or Z', function() {
        assert.isFalse(parsers.parseDateFormat('ABCEFGIJKLNOPQRUVWX').ReturnValue);
    }); 
    it('Date format parsing :- Test3 - Only characters allowed -  Y, M, D, h, m, s, S or Z', function() {
        assert.isFalse(parsers.parseDateFormat('abcefgijklnopqrtuvwxz').ReturnValue);
    }); 
    it('Date format parsing :- Test4 - Min number of characters = 6', function() {
        assert.isFalse(parsers.parseDateFormat('YMD').ReturnValue);
    }); 
    it('Date format parsing :- Test5 - Max number of characters = 24', function() {
        assert.isFalse(parsers.parseDateFormat('YY-MM-DD AND A WHOLE LOT MORE CHARS').ReturnValue);
    }); 
    it('Date format parsing', function() {
        assert.isTrue(parsers.parseDateFormat('DD/MM/YYYY').ReturnValue);
    }); 
    it('Location parsing', function(){
        myTestValue = parsers.parseLocation('6.08279037,46.1454582', ',');
        assert.isNotNull(myTestValue);
        assert.isTrue(myTestValue[0].y === 6.08279037);
        assert.isTrue(myTestValue[0].x === 46.1454582);
        assert.isTrue(Array.isArray(myTestValue));
    })
});