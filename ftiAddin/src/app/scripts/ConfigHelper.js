/**
 * Configuration file helper module.
 * @module ConfigHelper
 */

/**
 * Validates the providerConfiguration. 
 * The required properties are:
 * 1. A device identifier:
 * - device (default null) - if null, best attempt will be auto matched to a device based on vehicleIdentificationNumber, serialNumber, licencePlate or comments properties.
 * - licencePlate (default = empty string)
 * - serialNumber (default = empty string)
 * - vehicleIdentificationNumber (default = empty string)
 * - description (default = empty string)
 * - comments (default = empty string)
 * 2. dateTime - The UTC date and time of the transaction.
 * 3. volume - The volume of fuel purchased in Liters. Default [0].
 * 4. cost - The cost of the fuel transaction. Default [0].
 * 5. currencyCode - The three digit ISO 427 currency code (http://www.xe.com/iso4217.php). Default ['USD'].
 * @param {*} providerConfiguration A single item array containing a JsonObject with the provider configuration.
 */
function validateProviderConfiguration(providerConfiguration) {

    var output = {
        isValid: false,
        reason: ''
    };

    // check for required properties
    // Name is required
    if (!providerConfiguration.Name){
        output.isValid = false;
        output.reason = 'A provider name is required.';
        return output;
    }

    // dateFormat is required
    if (!providerConfiguration.dateFormat){
        output.isValid = false;
        output.reason = 'The dateFormat property is required.';
        return output;
    }

    //device identifier validation
    if (providerConfiguration.data['device']) {
        output.isValid = true;
    } else {
        if (
            providerConfiguration.data['licencePlate'] ||
            providerConfiguration.data['serialNumber'] ||
            providerConfiguration.data['vehicleIdentificationNumber'] ||
            providerConfiguration.data['description'] ||
            providerConfiguration.data['comments']) {
            output.isValid = true;
        } else {
            output.isValid = false;
            output.reason = 'No device identifier defined.';
            return output;
        };
    }

    //dateTime validation
    if (!providerConfiguration.data['dateTime']) {
        output.isValid = false;
        output.reason = 'No date and time defined.';
        return output;
    }

    //volume validation
    if (!providerConfiguration.data['volume']) {
        output.isValid = false;
        output.reason = 'No volume defined.';
        return output;
    }

    //cost validation
    if (!providerConfiguration.data['cost']) {
        output.isValid = false;
        output.reason = 'No cost defined.';
        return output;
    }

    //currencyCode validation
    if (!providerConfiguration.data['currencyCode']) {
        output.isValid = false;
        output.reason = 'No currency code defined.';
        return output;
    }

    // final successful return if all require properties are present
    return output;
}

/**
 * The configuration file defaults
 * @returns {JsonObject} Config file default values.
 */
function getConfigDefaults() {
    return {
        'unitVolumeLiters': 'Y',
        "unitOdoKm": "Y",
        "isCellDateType": "Y",
        "currencyCodeMapped": "USD",
    };
}

/**
 * Checks the configuration for any problems like:
 * - missing required 
 */
function parseConfiguration(){

}

module.exports = {
    validateProviderConfiguration,
    getConfigDefaults,
};