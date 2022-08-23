const assert = require('chai').assert;
const fuelTransactionParser = require('../../src/app/scripts/FuelTransactionParser');

dateFormat = 'DD/MM/YYYY';
transactions = [
    {
        vehicleIdentificationNumber: '',
        description: '',
        serialNumber: 'XXXXXXXXXX',
        licencePlate: '',
        comments: '',
        dateTime: '12/05/2020',
        volume: 100,
        odometer: 121212,
        cost: 158.26,
        currencyCode: 'CHF',
        location: '',
        provider: 'TEST',
        driverName: '',
        sourceData: '',
        productType: 'UNKNOWN'
    }
];

describe('FuelTransactionParser unit tests', function(){
   it('fuel trans parse', function(){
    assert.isNotNull(fuelTransactionParser.FuelTransactionParser(transactions,'', dateFormat));
   });
});