import { assert } from 'chai';
import * as converters from '../../src/app/scripts/Converters.js';

describe('Converters', function () {
    it('should convert miles to km', function () {
        assert.equal(converters.milesToKm(1), 1.6093470878864444);
    });
    it('convert gallons to litres', function () {
        assert.equal(converters.gallonsToLitres(1), 3.785);
    });
});