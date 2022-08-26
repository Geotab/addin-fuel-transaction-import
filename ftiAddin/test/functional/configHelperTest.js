const assert = require('chai').assert;
const configHelper = require('../../src/app/scripts/ConfigHelper');
const providerConfigMock = require('./mocks/providerConfigMock.json');

describe('Test provider configuration validation', function() {
    it('should be an invalid configuration - missing device identifier', function() {
        assert.isFalse(configHelper.validateProviderConfiguration(providerConfigMock.providers[2]).isValid);
    });
    it('should be an invalid configuration - missing cost', function() {
        assert.isFalse(configHelper.validateProviderConfiguration(providerConfigMock.providers[3]).isValid);
    });
    it('should be an invalid configuration - missing currency code', function() {
        assert.isFalse(configHelper.validateProviderConfiguration(providerConfigMock.providers[4]).isValid);
    });
    it('should be an invalid configuration - missing dateTime column indicator', function() {
        assert.isFalse(configHelper.validateProviderConfiguration(providerConfigMock.providers[5]).isValid);
    });
    it('should be an invalid configuration - missing volume', function() {
        assert.isFalse(configHelper.validateProviderConfiguration(providerConfigMock.providers[6]).isValid);
    });
    it('should be an invalid configuration - missing Name', function() {
        assert.isFalse(configHelper.validateProviderConfiguration(providerConfigMock.providers[7]).isValid);
    });
    it('should be an invalid configuration - missing dateTime format', function() {
        assert.isFalse(configHelper.validateProviderConfiguration(providerConfigMock.providers[8]).isValid);
    });
    it('should be an invalid configuration - missing dateTime format', function() {
        assert.isFalse(configHelper.validateProviderConfiguration(providerConfigMock.providers[9]).isValid);
    });
    it('should be a valid configuration', function() {
        assert.isTrue(configHelper.validateProviderConfiguration(providerConfigMock.providers[0]).isValid);
    });
    it('should be a valid configuration', function() {
        assert.isTrue(configHelper.validateProviderConfiguration(providerConfigMock.providers[1]).isValid);
    });
});