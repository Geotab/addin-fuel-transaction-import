const assert = require('chai').assert;
const configHelper = require('../../src/app/scripts/ConfigHelper');
const providerConfigMock = require('./mocks/providerConfigMock.json');

describe('Test configuration validation', function() {
    it('should be an invalid configuration - missing device identifier', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[2]).isValid);
    });
    it('should be an invalid configuration - missing cost', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[3]).isValid);
    });
    it('should be an invalid configuration - missing currency code', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[4]).isValid);
    });
    it('should be an invalid configuration - missing dateTime column indicator', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[5]).isValid);
    });
    it('should be an invalid configuration - missing volume', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[6]).isValid);
    });
    it('should be an invalid configuration - missing Name', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[7]).isValid);
    });
    it('should be an invalid configuration - missing dateTime format', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[8]).isValid);
    });
    it('should be an invalid configuration - missing dateTime format', function() {
        assert.isFalse(configHelper.validateConfiguration(providerConfigMock.providers[9]).isValid);
    });
    it('should be a valid configuration', function() {
        assert.isTrue(configHelper.validateConfiguration(providerConfigMock.providers[0]).isValid);
    });
    it('should be a valid configuration', function() {
        assert.isTrue(configHelper.validateConfiguration(providerConfigMock.providers[1]).isValid);
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