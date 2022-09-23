/**
* Parse product type from code for generic files
* @param {any} productType - The generic product type
* @returns {any} params - The MyGeotab product type
*/
var getProductType = (productType) => {
    let pt = productType.toLowerCase().replace(' ', '');
    switch (pt) {
        case 'nonfuel':
            return 'NonFuel';
        case 'regular':
            return 'Regular';
        case 'midgrade':
            return 'Midgrade';
        case 'premium':
            return 'Premium';
        case 'super':
            return 'Super';
        case 'diesel':
            return 'Diesel';
        case 'dieselexhaustfluid':
            return 'DieselExhaustFluid';
        case 'e85':
            return 'E85';
        case 'electric':
            return 'Electric';
        case 'hydrogen':
            return 'Hydrogen';
        case 'cng':
            return 'CNG';
        case 'lpg':
            return 'LPG';
        default:
            return 'Unknown';
    }
};

/**
 * The Wex provider type implementation.
 * @param {*} productType 
 * @returns 
 */
    let getProductTypeWex = (productType) => {
        let productCode = parseInt(productType, 10) || 0;
        switch (productCode) {
            case 21:
            case 22:
            case 23:
            case 24:
            case 25:
            case 26:
            case 27:
            case 28:
            case 29:
            case 30:
            case 31:
            case 32:
            case 33:
            case 34:
            case 35:
            case 36:
            case 37:
            case 38:
            case 39:
            case 41:
            case 42:
            case 43:
            case 44:
            case 45:
            case 46:
            case 47:
            case 49:
            case 50:
            case 52:
            case 53:
            case 54:
            case 55:
            case 56:
            case 57:
            case 58:
            case 59:
            case 60:
            case 62:
            case 63:
            case 64:
            case 65:
            case 66:
            case 67:
            case 68:
            case 70:
            case 71:
            case 72:
            case 73:
            case 74:
            case 79:
            case 80:
            case 81:
            case 82:
            case 83:
            case 84:
            case 85:
            case 90:
                return 'NonFuel';
            case 3:
            case 7:
            case 12:
            case 15:
                return 'Regular';
            case 4:
            case 6:
            case 8:
            case 13:
            case 14:
            case 16:
            case 17:
            case 20:
                return 'Premium';
            case 2:
            case 9:
                return 'Diesel';
            case 1:
                return 'E85';
            case 11:
                return 'CNG';
            case 10:
                return 'LPG';
            default:
                return 'Unknown';
        }
    };

module.exports = {
    getProductType,
    getProductTypeWex
}