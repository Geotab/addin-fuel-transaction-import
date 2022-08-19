/**
* Parse product type from code for WEX classic and millennium files
* @param {any} productType - The WEX product type
* @returns {any} params - The MyGeotab product type
*/
    let getWexProductType = productType => {
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

/**
 * Parse product type from code for WEX customer files
 * @param {any} productType - The WEX prododuct type
 * @returns {any} params - The MyGeotab product type
 */
    var getWexCustomerProductType = (productType) => {
    switch (productType) {
        // case '':
        //     return 'NonFuel';
        case 'UNa':
        case 'UNb':
        case 'UNc':
        case 'UNL':
        case 'UNLEADED':
        case 'UNLALC57':
        case 'UNLALC10':
        case 'UNLALC77':
            return 'Regular';
        // case '':
        //     return 'Midgrade';
        case 'SUP':
        case 'UN+':
        case 'U+c':
        case 'U+a':
        case 'SUa':
        case 'U+b':
        case 'SUb':
        case 'SUc':
        case 'SUPER UN':
        case 'UNL PLUS':
        case 'UN+ALC57':
        case 'UN+ALC10':
        case 'SUPALC10':
        case 'UN+ALC77':
        case 'SUPALC77':
        case 'SUPALC57':
        case 'PREMIUM':
        case 'UN+EADED PLUS':
        case 'SUPER UNLEADED':
            return 'Premium';
        // case '':
        //     return 'Super';
        case 'DIESEL':
        case 'PREM DSL':
        case 'DSL':
        case 'DS+':
        case 'DSLDIESEL':
            return 'Diesel';
        case 'ETHANL85':
        case 'E85':
        case 'E85ETHANOL85':
            return 'E85';
        case 'CNG':
            return 'CNG';
        case 'PRO':
        case 'PROPANE':
            return 'LPG';
        default:
            return 'Unknown';
    }
};

module.exports = {
    getWexProductType,
    getWexCustomerProductType
}