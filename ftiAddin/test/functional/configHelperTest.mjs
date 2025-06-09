import { assert } from 'chai';
import configHelper from '../../src/app/scripts/ConfigHelper.js';
import providerConfigMock from './mocks/providerConfigMock.json' assert { type: 'json' };

let validationMessages = {
    providerNameRequired: 'A provider name is required.',
    dateFormatRequired: 'The dateFormat property is required.',
    noDeviceIdentifier: 'No device identifier has been defined.',
    noDateTime: 'No date and time defined.',
    dateTimeIncorrectFormat: 'The date and time defined is incorrectly formatted. Reason:',
    noVolume: 'No volume defined.',
    noCost: 'No cost defined.',
    noCurrency: 'No currency code defined.'
};

let luxonDateParserMessages = {
    condition1: 'Does not have a CAPITAL M and LOWER d and yy',
    condition2: 'Longer than 11 characters and does not contain h and m.',
    condition3: 'Contains disallowed characters other than Y, M, D, h, m, s, S or Z.',
    condition4: 'Shorter than 6 characters.',
    condition5: 'Greater than 24 characters.'
};

describe('Test configuration validation', function() {
    it('should be an invalid configuration - missing device identifier', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[2], validationMessages, luxonDateParserMessages).isValid);
    });
    it('should be an invalid configuration - missing cost', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[3], validationMessages, luxonDateParserMessages).isValid);
    });
    it('should be an invalid configuration - missing currency code', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[4], validationMessages, luxonDateParserMessages).isValid);
    });
    it('should be an invalid configuration - missing dateTime column indicator', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[5], validationMessages, luxonDateParserMessages).isValid);
    });
    it('should be an invalid configuration - missing volume', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[6], validationMessages, luxonDateParserMessages).isValid);
    });
    it('should be an invalid configuration - missing Name', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[7], validationMessages, luxonDateParserMessages).isValid);
    });
    it('should be an invalid configuration - missing dateTime format', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[8], validationMessages, luxonDateParserMessages).isValid);
    });
    it('should be an invalid configuration - missing dateTime format', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[9], validationMessages, luxonDateParserMessages).isValid);
    });
    it('should be a valid configuration', function() {
        assert.isTrue(configHelper.validateConfiguration(providerConfigMock.providers[0], validationMessages, luxonDateParserMessages).isValid);
    });
    it('should be a valid configuration', function() {
        assert.isTrue(configHelper.validateConfiguration(providerConfigMock.providers[1], validationMessages, luxonDateParserMessages).isValid);
    });
});

describe('Test configuration defaults', function() {
    it('Should set the default values', function() {
        var config = providerConfigMock.providers[2];
        configHelper.parseConfigDefaults(config);
        assert.equal(config.unitVolumeLiters,'Y');
        assert.equal(config.unitOdoKm,'Y');
        assert.equal(config.isCellDateType,'Y');
        assert.equal(config.currencyCodeMapped,'USD');
    });
});