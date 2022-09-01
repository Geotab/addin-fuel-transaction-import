const parsers = require('./Parsers');
const converters = require('./Converters');

function ParseAndBuildTransactions(transactionsExcel, configuration) {
    return new Promise((resolve, reject) => {
        // var data = JSON.stringify(transactionsExcel);
        // data = JSON.parse(data);
        let transactionsOutput = [];
        transactionsExcel.forEach((transaction, i) => {
            if (i === 0) {
                // title row so ignore
            } else {
                transactionsOutput.push(parseTransaction(transaction, configuration));
            }
        });
        console.log('transactionsOutput: ' + JSON.stringify(transactionsOutput));
        resolve('ParseAndBuildTransactions completed.')
    });
}

function parseTransaction(transaction, configuration) {
    // let transOutput;
    let entity = {};
    let value;
    // let unitVolumeLiters = configuration.unitVolumeLiters;
    // let unitOdoKm = configuration.unitOdoKm;
    // let isCellDateType = configuration.isCellDateType;
    // let dateFormat = configuration.dateFormat;
    // let timeFormat = configuration.timeFormat;
    // let currencyCodeMapped = configuration.currencyCodeMapped;

    console.log('Parsing provider: ' + configuration.Name);

    // loop through the data properties of the transaction object
    // key = property
    Object.keys(configuration.data).forEach(key => {
        console.log(key, configuration.data[key]);
        // reset value prior to setting the new value to be safe.
        value = undefined;
        // set the new value.
        value = transaction[key];
        if (value) {
            switch (key) {
                case 'licencePlate':
                    entity[key] = parsers.parseStringLength(value, 255).toUpperCase().replace(/\s/g, '');
                    break;
                case 'driverName':
                case 'externalReference':
                case 'comments':
                    entity[key] = parsers.parseStringValue(parsers.parseStringLength(value, 1024));
                    break;
                case 'description':
                    entity[key] = parsers.parseStringValue(parsers.parseStringLength(value, 255));
                    break;
                case 'currencyCode':
                    entity[key] = value.trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
                    break;
                case 'serialNumber':
                case 'vehicleIdentificationNumber':
                    entity[key] = value.toUpperCase().replace(/\s/g, '');
                    break;
                case 'provider':
                    entity[key] = getProvider(value);
                    break;
                case 'productType':
                    entity[key] = getProductType(value);
                    break;
                case 'cost':
                    entity[key] = parsers.parseFloatValue(value);
                    break;
                case 'dateTime':
                    entity[key] = parsers.parseDateValue(value);
                    break;
                case 'odometer':
                    if (configuration.unitOdoKm === 'N') {
                        // value in miles so convert to kilometres.
                        value = converters.milesToKm(value);
                    }
                    entity[key] = parsers.parseFloatValue(value);
                    break;
                case 'volume':
                    if (configuration.unitVolumeLiters === 'N') {
                        // value in miles so convert to kilometres.
                        value = converters.gallonsToLitres(value);
                    }
                    entity[key] = parsers.parseFloatValue(value);
                    break;
                default:
                    entity[key] = parsers.parseStringValue(value);
                    break;
            }
        } else {
            // if currencyCode does not exist the global value should be assigned.
            if (key === 'currencyCode') {
                entity[key] = configuration.currencyCodeMapped.trim().toUpperCase().replace(/[^a-zA-Z]/g, '');
            }
            console.log('value is null or undefined...');
        }
    });

    console.log('parseTransaction output for entity: ', JSON.stringify(entity));
    return entity;
}


/**
 * Parses and gets the product type based on the transaction test value
 * @param {*} input The test value to parse.
 * @returns A valid product type
 */
function getProductType(input) {
    if (fuelTransactionProductType.hasOwnProperty(input)) {
        return input;
    } else {
        return Object.keys(fuelTransactionProductType)[12]
    }
}

/**
 * The currently valid fuel transaction product types
 */
var fuelTransactionProductType = {
    'CNG': 'CNG (Compressed Natural Gas)',
    'Diesel': 'Diesel fuel',
    'DieselExhaustFluid': 'Diesel exhaust fluid',
    'E85': 'E85 (Ethanol 85%)',
    'Electric': 'Electric',
    'Hydrogen': 'Hydrogen',
    'LPG': 'LPG (Liquid Propane Gas)',
    'Midgrade': 'Mid grade gasoline (88-89 Octane : 92-93 Ron)',
    'NonFuel': 'A non-fuel purchase',
    'Premium': 'Premium grade gasoline (90-91 Octane : 94-95 Ron)',
    'Regular': 'Regular grade gasoline (86-87 Octane : 90-91 Ron)',
    'Super': '	Super grade gasoline (92-94+ Octane : 96-99+ Ron)',
    'Unknown': 'Unknown product type'
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
    fuelTransactionProductType,
    fuelTransactionProviders
}