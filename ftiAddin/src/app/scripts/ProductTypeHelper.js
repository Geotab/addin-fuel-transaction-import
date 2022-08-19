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
        case 'e85':
            return 'E85';
        case 'cng':
            return 'CNG';
        case 'lpg':
            return 'LPG';
        default:
            return 'Unknown';
    }
};

module.exports = {
    getProductType
}