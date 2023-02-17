const parsers = require('./Parsers');
const converters = require('./Converters');
const productTypeHelper = require('./ProductTypeHelper');
const myGeotabHelper = require('./MyGeotabHelper');

/**
 * Transforms the transaction from raw/unparsed excel format (JSON) and produces the final parsed transactions.
 * @param {JSON} transactionsRaw The raw/unparsed transactions (imported from excel).
 * @param {JSON} configuration The fuel provider configuration.
 * @param {String} timeZone The time zone.
 * @param {Object} api The MyGeotab API service.
 * @returns The final parsed and ready for import transactions.
 */
function ParseAndBuildTransactionsAsync(
    transactionsRaw, configuration, api, timeZoneOffset) {
    return new Promise(async (resolve, reject) => {
        let transactionsOutput = [];
        let entity;
        for (var i = 0; i < transactionsRaw.length; i++) {
            var transaction = transactionsRaw[i];
            if (i === 0) {
                // ignore the first row as it is the header...
            } else {
                try {
                    entity = await parseTransactionAsync(
                        transaction, configuration, api, timeZoneOffset);
                    // console.log('parsed transaction entity: ' + entity);
                    transactionsOutput.push(entity);
                }
                catch(error) {
                    reject(error);
                }
            }
        }
        // console.log('transactionsOutput: ' + JSON.stringify(transactionsOutput));
        resolve(transactionsOutput)
    });
}

/**
 * Gets a key for the value from a JSON object
 * @param {*} obj The JSON object.
 * @param {*} value The value to check.
 * @returns The key related to the value submitted.
 */
function getObjKey(obj, value) {
    return Object.keys(obj).find(key => obj[key].toLowerCase() === value.toLowerCase());
}

/**
 * Gets the suffix column text letter from the string source.
 * @param {string} sourceString 
 * @param {string} prefixString
 * @returns The string suffix following the prefixString argument.
 */
function GetColumnText(sourceString, prefixString)
{
    let output = '';
    if (sourceString) {
        let targetIndex = prefixString.length;
        if (targetIndex !== -1) {
            output = sourceString.substring(targetIndex, sourceString.length);
        }
    }
    return output;
}

/**
 * Parses a single raw transaction to produce a single FuelTransaction entity.
 * @param {JSON} transactionRaw The raw transaction to parse.
 * @param {JSON} configuration The configuration for this instance. Shows each transaction property and it's relative mapping like "cardNumber": "ColumnA", "comments": "ColumnB" etc.
 * @param {String} timeZone The currently selected time zone.
 * @param {Object} api The MyGeotab API service.
 * @returns A FuelTransaction entity ready to be imported into the database.
 */
async function parseTransactionAsync(transactionRaw, configuration, api, timeZoneOffset) {

    if (transactionRaw === undefined) {
        throw new Error('parseTransaction transaction argument not submitted.');
    }

    if (configuration === undefined) {
        throw new Error('parseTransaction configuration argument not submitted.');
    }

    try {
        //let mapping = configuration.data;
        let entity = {};
        /** The configuration data property value which will be the column or columns e.g. ColumnL or an array of columns */
        let value = [];
        let columnHeaderChar = [];
        let prefixString = 'Column';
        // console.log('Parsing provider: ' + configuration.Name);
        let configKeys = Object.keys(configuration.data);
        for (var i = 0; i < configKeys.length; i++)
        {
            let key = configKeys[i];
            let keyValue = configuration.data[key];
            // console.log('key: ' + key);
            // console.log('key value: ' + keyValue);
            value = [];

            // Formats the value Array based on whether it has multiple elements or not.
            if (Array.isArray(keyValue))
            {
                columnHeaderChar[0] = GetColumnText(keyValue[0], prefixString);
                columnHeaderChar[1] = GetColumnText(keyValue[1], prefixString);
                value[0] = transactionRaw[columnHeaderChar[0]];
                value[1] = transactionRaw[columnHeaderChar[1]];
                // console.log('columnHeaderChar[0]: ' + columnHeaderChar[0]);
                // console.log('columnHeaderChar[1]: ' + columnHeaderChar[1]);
                // console.log('value[0]: ' + value[0]);
                // console.log('value[1]: ' + value[1]);
            }
            else
            {
                columnHeaderChar[0] = GetColumnText(keyValue, prefixString);
                value[0] = transactionRaw[columnHeaderChar[0]];
                // console.log('columnHeaderChar[0]: ' + columnHeaderChar[0]);
                // console.log('value[0]: ' + value[0]);
            }

            if (value[0]) {
                switch (key) {
                    case 'address':
                        var coords = await myGeotabHelper.GetCoordinates(api, value[0]);
                        if(coords){
                            if (Array.isArray(coords)){
                                entity.location = coords[0];
                            }
                        }
                        break;
                    case 'dateTime':
                        //entity[key] = parsers.parseDate(configuration, value, timeZone);
                        entity[key] = parsers.parseDate(configuration, value, timeZoneOffset);
                        break;
                    case 'location':
                        entity[key] = parsers.parseLocation(value);
                        break;
                    case 'licencePlate':
                        entity[key] = parsers.parseStringLength(value[0], 255).trim();
                        break;
                    case 'comments':
                        entity[key] = parsers.parseStringValue(parsers.parseStringLength(value[0], 1024));
                        break;
                    case 'description':
                        entity[key] = parsers.parseStringValue(parsers.parseStringLength(value[0], 255));
                        break;
                    case 'currencyCode':
                        entity[key] = value[0].trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
                        break;
                    case 'serialNumber':
                    case 'vehicleIdentificationNumber':
                        entity[key] = value[0].toUpperCase().trim();
                        break;
                    case 'provider':
                        entity[key] = getProvider(value[0]);
                        break;
                    case 'productType':
                        entity[key] = productTypeHelper.getProductType(value[0]);
                        break;
                    case 'cost':
                        entity[key] = parsers.parseFloatValue(value[0]);
                        break;
                    case 'odometer':
                        if (configuration.unitOdoKm === 'N') {
                            // value in miles so convert to kilometres.
                            value[0] = converters.milesToKm(value[0]);
                        }
                        entity[key] = parsers.parseFloatValue(value[0]);
                        break;
                    case 'volume':
                        if (configuration.unitVolumeLiters === 'N') {
                            // value in miles so convert to kilometres.
                            value[0] = converters.gallonsToLitres(value[0]);
                        }
                        entity[key] = parsers.parseFloatValue(value[0]);
                        break;
                    default:
                        // handles any unhandled values and parses the result to string.
                        // try {
                            entity[key] = parsers.parseStringValue(value[0]);
                        // }
                        // catch(error) {
                        //     throw new InputError(error, transactionRaw);
                        // }
                        break;
                }
            } else {
                // if currencyCode does not exist the global value should be assigned.
                if (key === 'currencyCode') {
                    entity[key] = configuration.currencyCodeMapped.trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
                }
                // console.log('value is null or undefined...');
            }

        }
        // console.log('parseTransaction output for entity: ', JSON.stringify(entity));
        return entity;
    }
    catch(error) {
        throw new InputError(error, transactionRaw);
    }
}

class InputError extends Error {
    constructor(message, entity) {
      super(message); // (1)
      this.name = 'InputError'; // (2)
      this.entity = entity;
    }
  }

/**
 * Parses and gets the fuel card provider.
 * @param {*} input The test value.
 */
function getProvider(input) {
    if (fuelTransactionProviders.hasOwnProperty(input)) {
        return input;
    }
    return Object.keys(fuelTransactionProviders)[9];
}

/**
 * The currently valid fuel transaction providers.
 */
var fuelTransactionProviders = {
    'Allstar': 'Allstar Fuel Card provider',
    'Comdata': 'Comdata Fuel Card Provider.',
    'Drive': 'Drive Add-in.',
    'FuelTracker': 'Fuel Tracker App.',
    'Fuelman': 'Fuelman Fuel Card Provider.',
    'GFN': 'GFN Fuel Card provider',
    'Keyfuels': 'Keyfuels Fuel Card provider',
    'TFC': 'TFC Fuel Card provider',
    'UltramarCST': 'Ultramar CST Fuel Card provider',
    'Unknown': 'The FuelTransactionProvider is not known.',
    'Voyager': 'Voyager Fuel Card provider',
    'Wex': 'Wex Fuel Card Provider.',
    'WexCanada': 'WexCanada Fuel Card provider',
    'WexCustomer': 'Wex Fuel Card Provider, customer file format.',
    'WexLegacy': 'Wex Fuel Card Provider, legacy file format.'
}

module.exports = {
    ParseAndBuildTransactionsAsync,
    parseTransactionAsync,
    fuelTransactionProviders
}