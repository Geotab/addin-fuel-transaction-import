const assert = require('chai').assert;
const providerHelper = require('../../src/app/scripts/ProviderHelper');
const providerConfigMock = require('./mocks/providerConfigMock.json');

describe('Test provider configuration validation', function() {
    it('should be an invalid configuration - missing device identifier', function() {
        assert.isFalse(providerHelper.validateProviderConfiguration(providerConfigMock.providers[2]).isValid);
    });
    it('should be an invalid configuration - missing cost', function() {
        assert.isFalse(providerHelper.validateProviderConfiguration(providerConfigMock.providers[3]).isValid);
    });
    it('should be an invalid configuration - missing currency code', function() {
        assert.isFalse(providerHelper.validateProviderConfiguration(providerConfigMock.providers[4]).isValid);
    });
    it('should be an invalid configuration - missing date and time', function() {
        assert.isFalse(providerHelper.validateProviderConfiguration(providerConfigMock.providers[5]).isValid);
    });
    it('should be an invalid configuration - missing volume', function() {
        assert.isFalse(providerHelper.validateProviderConfiguration(providerConfigMock.providers[6]).isValid);
    });
    it('should be a valid configuration', function() {
        assert.isTrue(providerHelper.validateProviderConfiguration(providerConfigMock.providers[0]).isValid);
    });
    it('should be a valid configuration', function() {
        assert.isTrue(providerHelper.validateProviderConfiguration(providerConfigMock.providers[1]).isValid);
    });
});