const parsers = require('./Parsers');
const dateHelper = require('./DateHelper');
const converters = require('./Converters');
const productTypeHelper = require('./ProductTypeHelper');
const myGeotabHelper = require('./MyGeotabHelper');

/**
 * Transforms the transaction from raw/unparsed excel format (JSON) and produces the final parsed transactions.
 * @param {Array} transactionsRaw An array of raw/unparsed transaction objects (imported from excel).
 * @param {JSON} configuration The fuel provider configuration.
 * @param {String} timeZone The time zone.
 * @param {Object} api The MyGeotab API service.
 * @param {*} remoteZone The remote time zone. The transaction time zone.
 * @param {*} localZone The local import time zone.
 * @param {object} Contains the error message translations for the combineDateAndTime method.
 * @returns The final parsed and ready for import transactions.
 */
function ParseAndBuildTransactionsAsync(
    transactionsRaw,
    configuration,
    api,
    remoteTimeZone,
    localTimeZone,
    combineDateTimeTranslations) {
    return new Promise(async (resolve, reject) => {
        let transactionsOutput = [];
        let addressesToBatch = []
        let entitiesToBatch = []
        let parsedResult;
        for (var i = 0; i < transactionsRaw.length; i++) {
            var transaction = transactionsRaw[i];
            if (i === 0) {
                // ignore the first row as it is the header...
            } else {
                try {
                    parsedResult = await parseTransactionAsync(
                        transaction, configuration, remoteTimeZone, localTimeZone, combineDateTimeTranslations);
                    // console.log('parsed transaction entity: ' + entity);
                    if (parsedResult?.address) {
                        addressesToBatch.push(parsedResult.address);
                        entitiesToBatch.push(parsedResult.entity);
                    } else {
                        transactionsOutput.push(parsedResult.entity);
                    }
                }
                catch (error) {
                    // Transactions are rejected if they cannot be parsed before the import process.
                    reject(error);
                }
            }
        }

        // Process batched addresses if any exist
        if (addressesToBatch.length > 0) {
            try {
                const batchProcessedEntities = await processBatchedAddressesAsync(api, addressesToBatch, entitiesToBatch);
                transactionsOutput.push(...batchProcessedEntities);
            } catch (error) {
                reject(error);
            }
        }


        // console.log('transactionsOutput: ' + JSON.stringify(transactionsOutput));
        resolve(transactionsOutput)
    });
}

function ParseAndBuildTransactionsPromiseTest(
    transactionsRaw,
    configuration,
    api,
    remoteTimeZone,
    localTimeZone,
    combineDateTimeTranslations) {
    // let transactionsOutput = [];
    // Remove the first item in the array. It is the excel header row.
    transactionsRaw.shift();
    // console.log('Before map.');
    const promises = transactionsRaw.map(transaction => {
        return parseTransactionAsync(transaction, configuration, api, remoteTimeZone, localTimeZone, combineDateTimeTranslations);
    });
    // let entity = await parseTransactionAsync(
    //     transaction, configuration, api, remoteTimeZone, localTimeZone);
    // // console.log('parsed transaction entity: ' + entity);
    // transactionsOutput.push(entity);
    // return;
    // console.log('After map. Before allSettled.');
    return Promise.allSettled(promises);
};

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
function GetColumnText(sourceString, prefixString) {
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
 * @param {*} remoteTimeZone The remote time zone. The transaction time zone.
 * @param {*} localTimeZone The local import time zone.
 * @param {object} combineDateTimeTranslations Contains the error message translations for the combineDateAndTime method.
 * @returns A FuelTransaction entity ready to be imported into the database.
 */
async function parseTransactionAsync(transactionRaw, configuration, remoteTimeZone, localTimeZone, combineDateTimeTranslations) {

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
        let address = undefined;
        for (var i = 0; i < configKeys.length; i++) {
            let key = configKeys[i];
            let keyValue = configuration.data[key];
            // console.log('key: ' + key);
            // console.log('key value: ' + keyValue);
            value = [];

            // Formats the value Array based on whether it has multiple elements or not.
            if (Array.isArray(keyValue)) {
                columnHeaderChar[0] = GetColumnText(keyValue[0], prefixString);
                columnHeaderChar[1] = GetColumnText(keyValue[1], prefixString);
                value[0] = transactionRaw[columnHeaderChar[0]];
                value[1] = transactionRaw[columnHeaderChar[1]];
                // console.log('columnHeaderChar[0]: ' + columnHeaderChar[0]);
                // console.log('columnHeaderChar[1]: ' + columnHeaderChar[1]);
                // console.log('value[0]: ' + value[0]);
                // console.log('value[1]: ' + value[1]);
            }
            else {
                columnHeaderChar[0] = GetColumnText(keyValue, prefixString);
                value[0] = transactionRaw[columnHeaderChar[0]];
                // console.log('columnHeaderChar[0]: ' + columnHeaderChar[0]);
                // console.log('value[0]: ' + value[0]);
            }

            if (value[0]) {
                switch (key) {
                    case 'address':
                        address = value[0];
                        break;
                    case 'dateTime':
                        entity[key] = dateHelper.parseDate(configuration, value, remoteTimeZone, localTimeZone, combineDateTimeTranslations);
                        break;
                    case 'location':
                        entity[key] = parsers.parseLocation(value);
                        break;
                    case 'licencePlate':
                        entity[key] = parsers.parseString(value[0], 255);
                        //entity[key] = parsers.parseStringLength(value[0].toString(), 255).trim();
                        break;
                    case 'comments':
                        entity[key] = parsers.parseString(value[0], 1024);
                        //entity[key] = parsers.parseStringValue(parsers.parseStringLength(value[0], 1024));
                        break;
                    case 'description':
                        entity[key] = parsers.parseString(value[0], 255);
                        //entity[key] = parsers.parseStringValue(parsers.parseStringLength(value[0], 255));
                        break;
                    case 'currencyCode':
                        entity[key] = value[0].trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
                        break;
                    case 'serialNumber':
                    case 'vehicleIdentificationNumber':
                        entity[key] = parsers.parseString(value[0]).toUpperCase().trim();
                        break;
                    case 'provider':
                        entity[key] = getProvider(value[0]);
                        break;
                    case 'productType':
                        entity[key] = productTypeHelper.getProductType(value[0], configuration);
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
                        entity[key] = parsers.parseString(value[0]);
                        break;
                }
            } else {
                // if currencyCode does not exist the global value should be assigned.
                if (key === 'currencyCode') {
                    entity[key] = configuration.currencyCodeMapped.trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
                }
            }

        }
        return {entity: entity, address: address};
    }
    catch (error) {
        throw new InputError(error.message, transactionRaw);
    }
}

/**
 * Processes addresses in batches and updates the corresponding entities with location data
 * @param {Object} api The MyGeotab API service
 * @param {Array} addresses Array of addresses to geocode
 * @param {Array} entities Array of entities corresponding to the addresses
 * @param {Number} batchSize Maximum number of addresses to process in one batch (default: 100)
 * @returns Array of fuel transaction entities with updated location data
 */
async function processBatchedAddressesAsync(api, addresses, entities, batchSize = 100) {
    const processedEntities = [];
    const totalAddresses = addresses.length;
    
    for (let i = 0; i < totalAddresses; i += batchSize) {
        const addressBatch = addresses.slice(i, i + batchSize);
        const entityBatch = entities.slice(i, i + batchSize);
        
        try {
            const coords = await myGeotabHelper.GetCoordinates(api, addressBatch);
            
            if (coords && Array.isArray(coords)) {
                for (let j = 0; j < coords.length; j++) {
                    if (coords[j]) {
                        entityBatch[j].location = coords[j];
                    }
                }
            }
            
            processedEntities.push(...entityBatch);
        } catch (error) {
            throw new InputError(error.message, addressBatch);
        }
    }
    
    return processedEntities;
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
    ParseAndBuildTransactionsPromiseTest,
    parseTransactionAsync,
    processBatchedAddressesAsync,
    fuelTransactionProviders
}