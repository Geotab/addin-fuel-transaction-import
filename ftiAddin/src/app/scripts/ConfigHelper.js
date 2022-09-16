const parsers = require('./Parsers');

/**
 * Configuration file helper module.
 * @module ConfigHelper
 */

/**
 * Validates the provider configuration object. 
 * The required properties are:
 * 1. A device identifier:
 * - device (default null) - if null, best attempt will be auto matched to a device based on vehicleIdentificationNumber, serialNumber, licencePlate or comments properties.
 * - licencePlate (default = empty string)
 * - serialNumber (default = empty string)
 * - vehicleIdentificationNumber (default = empty string)
 * - description (default = empty string)
 * - comments (default = empty string)
 * 2. dateTime - The UTC date and time of the transaction. And checks for valid date/time formatting.
 * 3. volume - The volume of fuel purchased in Liters. Default [0].
 * 4. cost - The cost of the fuel transaction. Default [0].
 * 5. currencyCode - The three digit ISO 427 currency code (http://www.xe.com/iso4217.php). Default ['USD'].
 * @param {*} configuration A single item array containing a JsonObject with the provider configuration.
 */
function validateConfiguration(configuration) {

    var output = {
        isValid: false,
        reason: ''
    };

    // check for required properties
    // Name is required
    if (!configuration.Name) {
        output.isValid = false;
        output.reason = 'A provider name is required.';
        return output;
    }

    // dateFormat is required
    if (!configuration.dateFormat) {
        output.isValid = false;
        output.reason = 'The dateFormat property is required.';
        return output;
    }

    //device identifier validation
    if (configuration.data['device']) {
        output.isValid = true;
    } else {
        if (
            configuration.data['licencePlate'] ||
            configuration.data['serialNumber'] ||
            configuration.data['vehicleIdentificationNumber'] ||
            configuration.data['description'] ||
            configuration.data['comments']) {
            output.isValid = true;
        } else {
            output.isValid = false;
            output.reason = 'No device identifier has been defined.';
            return output;
        };
    }

    //dateTime presence validation
    if (!configuration.data['dateTime']) {
        output.isValid = false;
        output.reason = 'No date and time defined.';
        return output;
    }

    //dateTime format validation
    var dateFormatTestResult = parsers.parseDateFormat(configuration.dateFormat);
    if(dateFormatTestResult.ReturnValue === false)
    {
        output.isValid = false;
        output.reason = `The date and time defined is incorrectly formatted. Reason: ${dateFormatTestResult.Problem}`;
        return output;
    }

    //volume validation
    if (!configuration.data['volume']) {
        output.isValid = false;
        output.reason = 'No volume defined.';
        return output;
    }

    //cost validation
    if (!configuration.data['cost']) {
        output.isValid = false;
        output.reason = 'No cost defined.';
        return output;
    }

    //currencyCode validation
    if (!configuration.data['currencyCode']) {
        output.isValid = false;
        output.reason = 'No currency code defined.';
        return output;
    }

    // final successful return if all require properties are present
    return output;
}

const configDefaults = {
    'unitVolumeLiters': 'Y',
    'unitOdoKm': 'Y',
    'isCellDateType': 'Y',
    'currencyCodeMapped': 'USD',
};

/**
 * Parses the configuration for any missing property values and applies the default where necessary.
 */
function parseConfigDefaults(configuration) {
    if (configuration['unitVolumeLiters'] !== 'Y' || configuration['unitVolumeLiters'] !== 'N') {
        configuration['unitVolumeLiters'] = configDefaults.unitVolumeLiters;
    }
    if (configuration['unitOdoKm'] !== 'Y' || configuration['unitOdoKm'] !== 'N') {
        configuration['unitOdoKm'] = configDefaults.unitOdoKm;
    }
    if (configuration['isCellDateType'] !== 'Y' || configuration['isCellDateType'] !== 'N') {
        configuration['isCellDateType'] = configDefaults.isCellDateType;
    }
    if (configuration['currencyCodeMapped'].length !== 3) {
        configuration['currencyCodeMapped'] = configDefaults.currencyCodeMapped;
    }
}

module.exports = {
    validateConfiguration,
    configDefaults,
    parseConfigDefaults,
};