const assert = require('chai').assert;
const fuelTransactionParser = require('../../src/app/scripts/FuelTransactionParser');
const providerConfigMock = require('./mocks/providerConfigMock.json');

describe('Test provider configuration validation', function() {
    it('should be an invalid configuration - missing device identifier', function() {
        assert.isFalse(fuelTransactionParser.validateProviderConfiguration(providerConfigMock.providers[2]).isValid);
    });
    it('should be an invalid configuration - missing cost', function() {
        assert.isFalse(fuelTransactionParser.validateProviderConfiguration(providerConfigMock.providers[3]).isValid);
    });
    it('should be an invalid configuration - missing currency code', function() {
        assert.isFalse(fuelTransactionParser.validateProviderConfiguration(providerConfigMock.providers[4]).isValid);
    });
    it('should be an invalid configuration - missing date and time', function() {
        assert.isFalse(fuelTransactionParser.validateProviderConfiguration(providerConfigMock.providers[5]).isValid);
    });
    it('should be an invalid configuration - missing volume', function() {
        assert.isFalse(fuelTransactionParser.validateProviderConfiguration(providerConfigMock.providers[6]).isValid);
    });
    it('should be a valid configuration', function() {
        assert.isTrue(fuelTransactionParser.validateProviderConfiguration(providerConfigMock.providers[0]).isValid);
    });
    it('should be a valid configuration', function() {
        assert.isTrue(fuelTransactionParser.validateProviderConfiguration(providerConfigMock.providers[1]).isValid);
    });
});



// dateFormat = 'DD/MM/YYYY';
// transactions = [
//     {
//         vehicleIdentificationNumber: '',
//         description: '',
//         serialNumber: 'XXXXXXXXXX',
//         licencePlate: '',
//         comments: '',
//         dateTime: '12/05/2020',
//         volume: 100,
//         odometer: 121212,
//         cost: 158.26,
//         currencyCode: 'CHF',
//         location: '',
//         provider: 'TEST',
//         driverName: '',
//         sourceData: '',
//         productType: 'UNKNOWN'
//     }
// ];

// describe('FuelTransactionParser unit tests', function(){
//    it('fuel trans parse', function(){
//     assert.isNotNull(fuelTransactionParser.FuelTransactionParser(transactions,'', dateFormat));
//    });
// });