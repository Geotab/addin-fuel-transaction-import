const providerConfigMock = require('./mocks/configurationMockRegex.json');
const productTypeHelper = require('../../src/app/scripts/ProductTypeHelper');
const assert = require('yeoman-assert');

describe('Regex tests', function () {
   it('Regex - basic functionality should succeed', function () {
      let inputValue = 'diesel';
      let response = productTypeHelper.getProductType(inputValue, providerConfigMock.providers[0]);
      assert.equal(response, 'Diesel');
      assert.notEqual(response, 'diesel');
      inputValue = 'diesel';
      response = productTypeHelper.getProductType(inputValue, providerConfigMock.providers[0]);
      assert.equal(response, 'Diesel');
      assert.notEqual(response, 'diesel');
      inputValue = 'petrol';
      response = productTypeHelper.getProductType(inputValue, providerConfigMock.providers[0]);
      assert.equal(response, 'CNG');
      inputValue = 'adblue';
      response = productTypeHelper.getProductType(inputValue, providerConfigMock.providers[0]);
      assert.equal(response, 'DieselExhaustFluid');
      inputValue = 'Unknown';
      response = productTypeHelper.getProductType(inputValue, providerConfigMock.providers[0]);
      assert.equal(response, 'Unknown');
   });
   it('Test state', function () {
      let inputValue = 'bladebla';
      let response = productTypeHelper.getProductType(inputValue, providerConfigMock.providers[1]);
      assert.equal(response, 'Unknown');
      response = '';
      response = productTypeHelper.getProductType(inputValue, providerConfigMock.providers[2]);
      assert.equal(response, 'Unknown');
   });
});
