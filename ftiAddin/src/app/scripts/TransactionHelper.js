const parsers = require('./Parsers');
const converters = require('./Converters');
const productTypeHelper = require('./ProductTypeHelper');
const myGeotabHelper = require('./MyGeotabHelper');

/**
 * Receives the excel transactions and produces the json formated transaction entities.
 * @param {Array} transactionsExcel The transactions in excel format.
 * @param {*} configuration The currently selected fuel provider configuration.
 * @param {String} timeZone The currently selected time zone.
 * @param {*} api The MyGeotab API service.
 * @returns The formatted transactions as an array of json objects.
 */
function ParseAndBuildTransactionsAsync(transactionsExcel, configuration, timeZone, api) {
    return new Promise(async (resolve, reject) => {
        let transactionsOutput = [];
        let mapping;
        let entity;
        for (var i = 0; i < transactionsExcel.length; i++) {
            var transaction = transactionsExcel[i];
            if (i === 0) {
                // get the mapping (or header) to be used in the transaction parsing process that follows.
                mapping = transaction;
            } else {
                entity = await parseTransactionAsync(transaction, configuration, mapping, timeZone, api);
                console.log('parsed transaction entity: ' + entity);
                transactionsOutput.push(entity);
            }
        }
        console.log('transactionsOutput: ' + JSON.stringify(transactionsOutput));
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
 * Parse each transaction property.
 * @param {*} transaction The transaction to parse.
 * @param {*} configuration The configuration settings for this instance. From the json config file. Shows each transaction property and it's relative mapping like "cardNumber": "ColumnA", "comments": "ColumnB" etc.
 * @param {*} mapping The mapping object (or transaction header mappings) e.g. "ColumnA": "cardNumber" - indicates the excel column mapped to the fuel transaction property.
 * @param {String} timeZone The currently selected time zone.
 * @param {*} api The MyGeotab API service.
 * @returns A FuelTransaction entity ready to be imported into the database.
 */
async function parseTransactionAsync(transaction, configuration, mapping, timeZone, api) {

    if (transaction === undefined) {
        throw new Error('parseTransaction transaction argument not submitted.');
    }

    if (configuration === undefined) {
        throw new Error('parseTransaction configuration argument not submitted.');
    }

    if (mapping === undefined) {
        throw new Error('parseTransaction mapping argument not submitted.');
    }

    if (timeZone === undefined) {
        throw new Error('parseTransaction timeZone argument not submitted.');
    }

    let entity = {};
    /** The configuration data property value which will be the column or columns e.g. ColumnL or an array of columns */
    let value;
    console.log('Parsing provider: ' + configuration.Name);
    let configDataKeys = Object.keys(configuration.data);
    for (var i = 0; i < configDataKeys.length; i++)
    {
        let configDataItem = configDataKeys[i];
        console.log('configDataItem: ' + configDataItem);
        console.log('configuration data: ' + configuration.data[configDataItem]);
        value = undefined;
        // set the new value.
        let falseKey = getObjKey(mapping, configDataItem);
        value = transaction[falseKey];
        console.log('value: ' + value);
        if(configDataItem === 'dateTime')
        {
            value = 'dateTime';
        }
        console.log('current key item: ' + configDataItem + ', value: ' + value);
        if (value) {
            switch (configDataItem) {
                case 'address':
                    var coords = await myGeotabHelper.GetCoordinates(api, value);
                    if(coords){
                        if (Array.isArray(coords)){
                            entity.location = coords[0];
                        }
                    }
                    break;
                case 'dateTime':
                    // entity[configDataItem] = parsers.parseDate(value, configuration.dateFormat, timeZone);
                    entity[configDataItem] = parsers.parseDateNew(configuration, transaction, timeZone);
                    break;
                case 'location':
                    entity[configDataItem] = parsers.parseLocation(value, ',');
                    break;
                case 'licencePlate':
                    entity[configDataItem] = parsers.parseStringLength(value, 255).toUpperCase().replace(/\s/g, '');
                    break;
                case 'comments':
                    entity[configDataItem] = parsers.parseStringValue(parsers.parseStringLength(value, 1024));
                    break;
                case 'description':
                    entity[configDataItem] = parsers.parseStringValue(parsers.parseStringLength(value, 255));
                    break;
                case 'currencyCode':
                    entity[configDataItem] = value.trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
                    break;
                case 'serialNumber':
                case 'vehicleIdentificationNumber':
                    entity[configDataItem] = value.toUpperCase().replace(/\s/g, '');
                    break;
                case 'provider':
                    entity[configDataItem] = getProvider(value);
                    break;
                case 'productType':
                    entity[configDataItem] = productTypeHelper.getProductType(value);
                    break;
                case 'cost':
                    entity[configDataItem] = parsers.parseFloatValue(value);
                    break;
                case 'odometer':
                    if (configuration.unitOdoKm === 'N') {
                        // value in miles so convert to kilometres.
                        value = converters.milesToKm(value);
                    }
                    entity[configDataItem] = parsers.parseFloatValue(value);
                    break;
                case 'volume':
                    if (configuration.unitVolumeLiters === 'N') {
                        // value in miles so convert to kilometres.
                        value = converters.gallonsToLitres(value);
                    }
                    entity[configDataItem] = parsers.parseFloatValue(value);
                    break;
                default:
                    // handles any unhandled values and parses the result to string.
                    entity[configDataItem] = parsers.parseStringValue(value);
                    break;
            }
        } else {
            // if currencyCode does not exist the global value should be assigned.
            if (configDataItem === 'currencyCode') {
                entity[configDataItem] = configuration.currencyCodeMapped.trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
            }
            console.log('value is null or undefined...');
        }

    }
    console.log('parseTransaction output for entity: ', JSON.stringify(entity));
    return entity;
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