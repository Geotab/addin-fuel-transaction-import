/**
 * Processes the product type from the input file and configuration file.
 * It handles the following:
 * 1. Checks if there is a regular expression statement defined in the first section of the configuration file.
 * 2. If there is, it will check the productType against the regular expression and return the key value.
 * 3. If there is not, it will return the productType as is.
 * 4. It will then format the product type to match the MyGeotab product type.
 * 5. If the product type is not found, it will return 'Unknown'.
 * @param {*} productType The product type input value.
 * @param {*} configuration The configuration file.
 * @returns The MyGeotab product type.
 */
const getProductType = (productType, configuration) => {
    let output = formatProductType(getProductTypeRegex(productType, configuration));
    return output;
};

/**
* Parse product type from code for generic files
* @param {any} productType - The generic product type
* @returns {any} params - The MyGeotab product type
*/
const formatProductType = (productType) => {
    !productType ? productType = '': productType;
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
 * Checks if there is a regular expression statement defined in the first section of the configuration file.
 * If there is, it will check the productType against the regular expression and return the key value.
 * If there is not, it will return the productType as is.
 * @param {*} productType The product type to check or the value defined in the input file.
 * @param {*} configuration The configuration file.
 * @returns The product type key value.
 */
const getProductTypeRegex = (productType, configuration) => {

    // check if regex is provided and if so then apply the regex to the productType.
    if ((configuration.productTypeRegex) && (configuration.productTypeRegex.length > 0)) {
        for (const key in configuration.productTypeRegex) {
            const regexObj = configuration.productTypeRegex[key];
            const keyValue = Object.keys(regexObj)[0];
            const value = Object.values(regexObj)[0];
            const regex = new RegExp(value);
            console.log(`productType: ${productType}, regex: ${regex}, keyValue: ${keyValue}`);
            // console.log('keyValue: ' + keyValue);
            // console.log('value: ' + value);
            if (regex.test(productType)) {
                return keyValue;
            }
        }
        return productType;
    } else {
        return productType;
    }
}

module.exports = {
    getProductType
}