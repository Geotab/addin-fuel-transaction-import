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
        let value = transaction[configuration.data[key]];
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
                case 'serialNumber':
                case 'vehicleIdentificationNumber':
                    entity[key] = value.toUpperCase().replace(/\s/g, '');
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
            }
        } else {
            console.log('value is null or undefined...');
        }
    });

    console.log(configuration.Name, JSON.stringify(entity));
    return entity;
}

module.exports = {
    ParseAndBuildTransactions
}