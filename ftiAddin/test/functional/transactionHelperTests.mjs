import { assert } from 'chai';
import * as transactionHelper from '../../src/app/scripts/TransactionHelper.js';
import transactionsExcelMock from './mocks/transactionsExcelMock.json' assert { type: 'json' };
import transactionsExcelErrorMock from './mocks/transactionsExcelErrorMock.json' assert { type: 'json' };
import configurationMock from './mocks/configurationMock.json' assert { type: 'json' };

describe('Transaction parsing tests', () => {
    let entity;
    it('test transaction parsing - all should pass - 1', async () => {
        entity = (await transactionHelper.parseTransactionAsync(transactionsExcelMock[1], configurationMock.providers[0], 'europe/berlin', null)).entity;
        assert.isTrue(entity.cardNumber === 'ABC1');
        assert.isTrue(entity.comments === 'comments');
        assert.isTrue(entity.description === 'description');
        assert.isTrue(entity.driverName === 'driverName');
        assert.isTrue(entity.externalReference === 'externalReference');
        assert.isTrue(entity.licencePlate === 'LICPLATE');
        assert.isTrue(entity.providerProductDescription === 'providerProductDescription');
        assert.isTrue(entity.serialNumber === 'G7D020FC5C50');
        assert.isTrue(entity.siteName === 'siteName');
        assert.isTrue(entity.vehicleIdentificationNumber === 'vehicleIdentificationNumber'.toUpperCase());
        assert.isTrue(entity.sourceData === 'sourceData');
        assert.isTrue(entity.cost === 124.56);
        assert.isTrue(entity.currencyCode === 'CHF');
        //assert.isTrue(entity.dateTime === '2020-01-17T23:00:00.000Z');
        assert.isTrue(entity.odometer === 100000);
        assert.isTrue(entity.productType === 'Regular');
        assert.isUndefined(entity.provider);
        assert.isTrue(entity.volume === 50);
        
    });
    it('test transaction parsing - all should pass - 2', async () => {
        entity = (await transactionHelper.parseTransactionAsync(transactionsExcelMock[2], configurationMock.providers[0], 'europe/berlin', null)).entity;
        assert.isTrue(entity.cardNumber === 'CDE1');
        assert.isTrue(entity.comments.length === 1024);
        assert.isTrue(entity.description.length === 255);
        assert.isTrue(entity.driverName === 'Sam');
        assert.isTrue(entity.vehicleIdentificationNumber === 'SHSRE5780CU007020');
        assert.isTrue(entity.externalReference === 'external reference');
        assert.isTrue(entity.serialNumber === 'GANZUEZB8UF0');
        assert.isTrue(entity.cost === 25.3656);
        assert.isTrue(entity.currencyCode === 'USD');
        //assert.isTrue(entity.dateTime === '2020-03-23T23:00:00.000Z');
        assert.isTrue(entity.odometer === 10542.2356);
        assert.isTrue(entity.productType === 'Unknown');
        assert.isTrue(entity.provider === 'Allstar');
        assert.isTrue(entity.volume === 10.236);
    });
    it('test multiple transactions', async () => {
        return await transactionHelper.ParseAndBuildTransactionsAsync(transactionsExcelMock.slice(0,4), configurationMock.providers[0], 'europe/berlin', null)
            .then(results => {
                assert.isTrue(results[0].cardNumber === 'ABC1');
                assert.isTrue(results[1].provider === 'Allstar');
                assert.isTrue(results[2].serialNumber === 'G7D020FC5C50');
                //assert.isTrue(results[3].vehicleIdentificationNumber === 'SHSRE5780CU007020');
                //assert.isTrue(results[4].dateTime === '2020-03-26T23:00:00.000Z');
            });
    });
    it('test location', async () => {
        entity = (await transactionHelper.parseTransactionAsync(transactionsExcelMock[6], configurationMock.providers[5], 'europe/berlin', null)).entity;
        assert.isTrue(entity.location.y === 46.1454582);
        assert.isTrue(entity.location.x === 6.08279037);
        assert.isTrue(entity.cardNumber === 'CARDNO');
        assert.isTrue(entity.comments === 'comments');
        assert.isTrue(entity.description === 'description');
        assert.isTrue(entity.driverName === 'driverName');
        assert.isTrue(entity.externalReference === 'external reference');
        assert.isTrue(entity.providerProductDescription === 'providerProductDescription');
        assert.isTrue(entity.sourceData === 'sourceData');
    });
    it('test location', async () => {
        return transactionHelper.parseTransactionAsync(transactionsExcelMock[7], configurationMock.providers[5], 'europe/berlin', null)
        .then()
        .catch( error => {
            assert.isTrue(error.name == 'InputError');
            //assert.isTrue(error.message.includes('s.trim is not a function'));
            assert.isNotNull(error.entity);
        });
    });
    it('Exception Tests (TransactionHelper)', async () => {
        return transactionHelper.parseTransactionAsync(transactionsExcelErrorMock[1], configurationMock.providers[0], 'europe/berlin', null)
        .then()
        .catch( error => {
            assert.isTrue(error.name == 'InputError');
            assert.isNotNull(error.entity);
        });
    });
});