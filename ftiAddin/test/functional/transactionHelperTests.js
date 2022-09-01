const transactionHelper = require('../../src/app/scripts/TransactionHelper');
const assert = require('chai').assert;
const transactionMock = require('./mocks/transactionsMock.json');
const configurationMock = require('./mocks/configurationMock.json');

describe('Transaction parsing tests', () => {
    let entity;
    it('test transaction parsing - all should pass', () => {
        entity = transactionHelper.parseTransaction(transactionMock[0], configurationMock.providers[0]);
        assert.isTrue(entity.cardNumber === 'ABC1');
        assert.isTrue(entity.licencePlate === 'LICPLATE');
        assert.isTrue(entity.serialNumber === 'G7D020FC5C50');
        assert.isTrue(entity.cost === 124.56);
        assert.isTrue(entity.currencyCode === 'CHF');
        assert.isTrue(entity.dateTime === '2020-01-18T00:00:00.000Z');
        assert.isTrue(entity.odometer === 100000);
        assert.isTrue(entity.volume === 50);
    });
    it('test transaction parsing - all should pass', () => {
        entity = transactionHelper.parseTransaction(transactionMock[1], configurationMock.providers[0]);
        assert.isTrue(entity.cardNumber === 'ABC1');
        assert.isTrue(entity.licencePlate === 'LICPLATE');
        assert.isTrue(entity.serialNumber === 'G7D020FC5C50');
        assert.isTrue(entity.cost === 124.56);
        assert.isTrue(entity.currencyCode === 'CHF');
        assert.isTrue(entity.dateTime === '2020-01-18T00:00:00.000Z');
        assert.isTrue(entity.odometer === 100000);
        assert.isTrue(entity.volume === 50);
    });
});