const parsers = require('./Parsers');
const converters = require('./Converters');
const productTypeHelper = require('./ProductTypeHelper');
const myGeotabHelper = require('./MyGeotabHelper');

/**
 * Receives the excel transactions and produces the json formated transaction entities.
 * @param {*} transactionsExcel The transactions in excel format.
 * @param {*} configuration The currently selected fuel provider configuration.
 * @param {String} timeZone The currently selected time zone.
 * @param {*} api The MyGeotab API service.
 * @returns The formatted transactions as an array of json objects.
 */
function ParseAndBuildTransactions(transactionsExcel, configuration, timeZone, api) {
    return new Promise((resolve, reject) => {
        let transactionsOutput = [];
        let mapping;
        let entity;
        transactionsExcel.forEach((transaction, i) => {
            if (i === 0) {
                // get the mapping (or header) to be used in the transaction parsing process that follows.
                mapping = transaction;
            } else {
                entity = parseTransaction(transaction, configuration, mapping, timeZone);
                console.log('parsed transaction entity: ' + entity);
                transactionsOutput.push(entity);
            }
        });
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
    return Object.keys(obj).find(key => obj[key] === value);
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
function parseTransaction(transaction, configuration, mapping, timeZone, api) {

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
    // let dateFormat = configuration.dateFormat;
    // if (configuration.timeFormat) {
    //     dateFormat = configuration.dateFormat + ' ' + configuration.timeFormat;
    // }
    // console.log('dateFormat: ' + dateFormat);

    // loop through the 'data' properties of the transaction object
    // keyItem = the specific data property e.g. cardNumber, description, dateTime, location etc.
    Object.keys(configuration.data).forEach(keyItem => {
        console.log(keyItem, configuration.data[keyItem]);
        // reset value prior to setting the new value to be safe.
        value = undefined;
        // set the new value.
        let falseKey = getObjKey(mapping, keyItem);
        value = transaction[falseKey];
        if(keyItem === 'dateTime')
        {
            value = 'dateTime';
        }
        console.log('current key item: ' + keyItem + ', value: ' + value);
        if (value) {
            switch (keyItem) {
                case 'address':
                    //entity[keyItem] = myGeotabHelper.GetCoordinates(api, value);
                    var addresses = myGeotabHelper.GetCoordinates(api, value);
                    console.log(addresses);
                    break;
                case 'dateTime':
                    // entity[keyItem] = parsers.parseDate(value, configuration.dateFormat, timeZone);
                    entity[keyItem] = parsers.parseDateNew(configuration, transaction, timeZone);
                    break;
                case 'location':
                    entity[keyItem] = parsers.parseLocation(value, ',');
                    break;
                case 'licencePlate':
                    entity[keyItem] = parsers.parseStringLength(value, 255).toUpperCase().replace(/\s/g, '');
                    break;
                case 'comments':
                    entity[keyItem] = parsers.parseStringValue(parsers.parseStringLength(value, 1024));
                    break;
                case 'description':
                    entity[keyItem] = parsers.parseStringValue(parsers.parseStringLength(value, 255));
                    break;
                case 'currencyCode':
                    entity[keyItem] = value.trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
                    break;
                case 'serialNumber':
                case 'vehicleIdentificationNumber':
                    entity[keyItem] = value.toUpperCase().replace(/\s/g, '');
                    break;
                case 'provider':
                    entity[keyItem] = getProvider(value);
                    break;
                case 'productType':
                    entity[keyItem] = productTypeHelper.getProductType(value);
                    break;
                case 'cost':
                    entity[keyItem] = parsers.parseFloatValue(value);
                    break;
                case 'odometer':
                    if (configuration.unitOdoKm === 'N') {
                        // value in miles so convert to kilometres.
                        value = converters.milesToKm(value);
                    }
                    entity[keyItem] = parsers.parseFloatValue(value);
                    break;
                case 'volume':
                    if (configuration.unitVolumeLiters === 'N') {
                        // value in miles so convert to kilometres.
                        value = converters.gallonsToLitres(value);
                    }
                    entity[keyItem] = parsers.parseFloatValue(value);
                    break;
                default:
                    // handles any unhandled values and parses the result to string.
                    entity[keyItem] = parsers.parseStringValue(value);
                    break;
            }
        } else {
            // if currencyCode does not exist the global value should be assigned.
            if (keyItem === 'currencyCode') {
                entity[keyItem] = configuration.currencyCodeMapped.trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
            }
            console.log('value is null or undefined...');
        }
    });

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
    ParseAndBuildTransactions,
    parseTransaction,
    fuelTransactionProviders
}