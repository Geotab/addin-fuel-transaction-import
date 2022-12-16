
/**
 * New module testing XLSX functionality - hopefully replace TransactionHelper.js
 */

/**
 * Transforms the transaction in raw unparsed excel-to-json format and produces the final json formated transactions.
 * @param {Array} transactionsRaw The raw unparsed transactions (excel-to-json).
 * @param {*} configuration The fuel provider configurations.
 * @param {String} timeZone The required time zone.
 * @param {*} api The MyG API service.
 * @returns The ready to be inserted/parsed transactions.
 */
function ParseAndBuildTransactionsAsync(transactionsRaw, configuration, timeZone, api) {
    return new Promise(async (resolve, reject) => {
        let transactionsOutput = [];
        let mapping;
        let entity;
        console.log('timeZone: ');
        console.log(timeZone);
        console.log('configuration: ');
        console.log(configuration);
        for (var i = 0; i < transactionsRaw.length; i++) {
            var transaction = transactionsRaw[i];
            console.log('transaction: ');
            console.log(transaction);
            // if (i === 0) {
            //     // get the mapping (or header) to be used in the transaction parsing process that follows.
            //     mapping = transaction;
            // } else {
                entity = await parseTransactionAsync(transaction, configuration, timeZone, api);
                console.log('parsed transaction entity: ' + entity);
                transactionsOutput.push(entity);
            // }
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
 * @param {*} transactionRaw The raw transaction to parse.
 * @param {*} configuration The configuration settings for this instance. From the json config file. Shows each transaction property and it's relative mapping like "cardNumber": "ColumnA", "comments": "ColumnB" etc.
 * @param {*} mapping The mapping object (or transaction header mappings) e.g. "ColumnA": "cardNumber" - indicates the excel column mapped to the fuel transaction property.
 * @param {String} timeZone The currently selected time zone.
 * @param {*} api The MyGeotab API service.
 * @returns A FuelTransaction entity ready to be imported into the database.
 */
async function parseTransactionAsync(transactionRaw, configuration, timeZone, api) {

    if (transactionRaw === undefined) {
        throw new Error('parseTransaction transaction argument not submitted.');
    }

    if (configuration === undefined) {
        throw new Error('parseTransaction configuration argument not submitted.');
    }

    if (timeZone === undefined) {
        throw new Error('parseTransaction timeZone argument not submitted.');
    }

    let entity = {};
    /** The configuration data property value which will be the column or columns e.g. ColumnL or an array of columns */
    let value;
    console.log('Parsing provider: ' + configuration.Name);
    let configKeys = Object.keys(configuration.data);
    for (var i = 0; i < configKeys.length; i++)
    {
        let key = configKeys[i];
        console.log('key: ' + key);
        console.log('excel column: ' + configuration.data[key]);
        value = undefined;
        // set the new value.
        // let falseKey = getObjKey(mapping, key);
        // value = transactionRaw[falseKey];
        // console.log('value: ' + value);
        // if(key === 'dateTime')
        // {
        //     value = 'dateTime';
        // }
        // console.log('current key item: ' + key + ', value: ' + value);
        // if (value) {
        //     switch (key) {
        //         case 'address':
        //             var coords = await myGeotabHelper.GetCoordinates(api, value);
        //             if(coords){
        //                 if (Array.isArray(coords)){
        //                     entity.location = coords[0];
        //                 }
        //             }
        //             break;
        //         case 'dateTime':
        //             // entity[configDataItem] = parsers.parseDate(value, configuration.dateFormat, timeZone);
        //             entity[key] = parsers.parseDateNew(configuration, transactionRaw, timeZone);
        //             break;
        //         case 'location':
        //             // entity[configDataItem] = parsers.parseLocation(value, ',');
        //             entity[key] = parsers.parseLocation(configuration, transactionRaw);
        //             break;
        //         case 'licencePlate':
        //             entity[key] = parsers.parseStringLength(value, 255).toUpperCase().replace(/\s/g, '');
        //             break;
        //         case 'comments':
        //             entity[key] = parsers.parseStringValue(parsers.parseStringLength(value, 1024));
        //             break;
        //         case 'description':
        //             entity[key] = parsers.parseStringValue(parsers.parseStringLength(value, 255));
        //             break;
        //         case 'currencyCode':
        //             entity[key] = value.trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
        //             break;
        //         case 'serialNumber':
        //         case 'vehicleIdentificationNumber':
        //             entity[key] = value.toUpperCase().replace(/\s/g, '');
        //             break;
        //         case 'provider':
        //             entity[key] = getProvider(value);
        //             break;
        //         case 'productType':
        //             entity[key] = productTypeHelper.getProductType(value);
        //             break;
        //         case 'cost':
        //             entity[key] = parsers.parseFloatValue(value);
        //             break;
        //         case 'odometer':
        //             if (configuration.unitOdoKm === 'N') {
        //                 // value in miles so convert to kilometres.
        //                 value = converters.milesToKm(value);
        //             }
        //             entity[key] = parsers.parseFloatValue(value);
        //             break;
        //         case 'volume':
        //             if (configuration.unitVolumeLiters === 'N') {
        //                 // value in miles so convert to kilometres.
        //                 value = converters.gallonsToLitres(value);
        //             }
        //             entity[key] = parsers.parseFloatValue(value);
        //             break;
        //         default:
        //             // handles any unhandled values and parses the result to string.
        //             entity[key] = parsers.parseStringValue(value);
        //             break;
        //     }
        // } else {
        //     // if currencyCode does not exist the global value should be assigned.
        //     if (key === 'currencyCode') {
        //         entity[key] = configuration.currencyCodeMapped.trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
        //     }
        //     console.log('value is null or undefined...');
        // }

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
    // parseTransactionAsync,
    // fuelTransactionProviders
}