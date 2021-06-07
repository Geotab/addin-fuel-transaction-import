/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */



geotab.addin.addinFuelTransactionImport20 = function () {
  'use strict';

  // Geotab Addin variables
  var api;

  // DOM Elements
  var elContainer;
  var elFiles;
  var elParseButton;
  var elImportButton;
  var elCancelButton;
  var elFleet;
  var elExampleButton;
  var elFileName;
  var elTransactionList;
  var elTransactionContainer;
  var elFileSelectContainer;
  var elAlertSuccess;
  var elAlertInfo;
  var elAlertError;
  var elSample;
  var elForm;
  var elListCount;
  
  var elFileJsonSelectContainer;
  var elFilesJson;
  var elFileNameJson;
  var elParseButtonJson;
  var elJsonDropDownMenu;
  var elConnectionTest;
  var elSelector;
  var elFileSelectContainerProvider;

  var elFileProvider;
  var elFileNameProvider;
  var elParseButtonProvider;

  // scoped vars
  var transactions;
  var database;
  var version;
  var ROW_LIMIT = 10;

  var fileJsonToParse;
  var fileXlsToJson;

  var objProviderTemplate;
  
  
  
  // functions

  var toggleParse = function (toggle) {
    if (toggle) {
        elParseButton.removeAttribute('disabled');
        toggleImport(false);
    } else {
        elParseButton.setAttribute('disabled', 'disabled');
    }
};


// enable or disable (grayout) the button to import the Json file
var toggleParseJson = function (toggle) {
    if (toggle) {
        //make visible the button to import the Json file
        elParseButtonJson.removeAttribute('disabled');
        toggleImport(false);
    } else {
         //hide the button to import the Json file
        elParseButtonJson.setAttribute('disabled', 'disabled');
    }
};

// enable or disable (grayout) the button of the provider xls section 
var toggleParseProvider = function (toggle) {
    if (toggle) {
        //make visible the button of the provider xls section 
        elParseButtonProvider.removeAttribute('disabled');
        toggleImport(false);
    } else {
         //hide the button of the provider xls section 
         elParseButtonProvider.setAttribute('disabled', 'disabled');
    }
};

var toggleImport = function (toggle) {
    if (toggle) {
        elImportButton.removeAttribute('disabled');
    } else {
        elImportButton.setAttribute('disabled', 'disabled');
        toggleFleet(false);
        clearFleets();
    }
};

var toggleFleet = function (toggle) {
    if (toggle) {
        elFleet.removeAttribute('disabled');
    } else {
        elFleet.setAttribute('disabled', 'disabled');
    }
};

var toggleBrowse = function (toggle) {
    if (toggle) {
        elFiles.removeAttribute('disabled');
    } else {
        elFiles.setAttribute('disabled', 'disabled');
    }
};

var toggleBrowseJson = function (toggle) {
    if (toggle) {
        elFilesJson.removeAttribute('disabled');
    } else {
        elFilesJson.setAttribute('disabled', 'disabled');
    }
};


var toggleAlert = function (el, content) {
    elAlertSuccess.style.display = 'none';
    elAlertInfo.style.display = 'none';
    elAlertError.style.display = 'none';
    if (el) {
        el.querySelector('span').textContent = content;toggleParse
        el.style.display = 'block';
    }
};

var clearFleets = function () {
    while (elFleet.firstChild) {
        elFleet.removeChild(elFleet.firstChild);
    }
};

var setFleetSelection = function (fleets) {
    clearFleets();
    fleets.sort();
    fleets.forEach(function (fleet) {
        var el = document.createElement('OPTION');
        el.textContent = fleet;
        el.value = fleet;
        elFleet.appendChild(el);
    });
    if (fleets.length > 0) {
        toggleFleet(true);
    }
};

var clearTransactionsList = function () {
    //container that hide the transaction
    elTransactionContainer.style.display = 'none';
    //container that show the File selection
    elFileSelectContainer.style.display = 'block';
    elFileSelectContainerProvider.style.display = 'none';
    while (elTransactionList.firstChild) {
        elTransactionList.removeChild(elTransactionList.firstChild);
    }
    transactions = [];
};

var clearTransactions = function () {
    clearTransactionsList();
    clearFleets();
    toggleParse(false);
    toggleImport(false);
};

var renderTransactions = function () {
    var elBody;
    var visibleCount = 0;
    var totalRowsCount = 0;
    var fleetName = elFleet.options[elFleet.selectedIndex].value;
    var getColumnHeading = function (column) {
        var columnHeadings = {
            'vehicleIdentificationNumber': 'VIN',
            'description': 'Description',
            'serialNumber': 'Device Serial Number',
            'licencePlate': 'Licence Plate',
            'comments': 'Comment',
            'dateTime': 'Date (UTC)',
            'volume': 'Volume Added (litres)',
            'odometer': 'Odometer (km)',
            'cost': 'Cost',
            'currencyCode': 'Currency',
            'location': 'Location (lon,lat)',
            'provider': 'File Provider',
            'driverName': 'Driver Name',
            'productType': 'Product Type'
        };
        return columnHeadings[column] || column;
    };
    var createRow = function (row, isHeading) {
        var elRow = document.createElement('TR');
        var createColumn = function (columnName) {
            if (columnName === 'sourceData' || columnName === 'fleet') {
                return;
            }
            var elColumn = document.createElement(isHeading ? 'TH' : 'TD');
            elColumn.textContent = isHeading ? getColumnHeading(columnName) : JSON.stringify(row[columnName]);
            if (!isHeading) {
                elColumn.setAttribute('data-th', columnName);
            }
            elRow.appendChild(elColumn);
        };

        Object.keys(row).forEach(createColumn);

        return elRow;
    };

    elTransactionContainer.style.display = 'none';
    elFileSelectContainer.style.display = 'block';

    while (elTransactionList.firstChild) {
        elTransactionList.removeChild(elTransactionList.firstChild);
    }

    elBody = document.createElement('TBODY');
    transactions.forEach(function (transaction, i) {
        var elHead;

        if (i === 0) {
            elHead = document.createElement('THEAD');
            elHead.appendChild(createRow(transaction, true));
            elTransactionList.appendChild(elHead);
        }
        if (!fleetName || transaction.fleet === fleetName) {
            totalRowsCount++;
            if (visibleCount < ROW_LIMIT) {
                visibleCount++;
                elBody.appendChild(createRow(transaction));
            }
        }
    });
    elListCount.textContent = (ROW_LIMIT === visibleCount ? 'top ' : '') + visibleCount + '/' + totalRowsCount;
    elTransactionList.appendChild(elBody);
    elTransactionContainer.style.display = 'block';
    elFileSelectContainer.style.display = 'none';
};

var clearFiles = function () {
    elFiles.value = null;
    elFileName.value = '';
};
var clearFilesJson = function () {
    elFilesJson.value = null;
    elFileNameJson.value = '';

    toggleParseJson();
};


var clearFilesProvider = function () {
    elFileProvider.value = null;
    elFileNameProvider.value = ''; 
    
    toggleParseProvider();
};



var getUrl = function () {
    return window.location.protocol + '//' + window.location.hostname + '/apiv1';
};

var fileSelected = function (e) {
    var file;
    if (e.target.files) {
        file = e.target.files[0];
    } else {
        // ie9
        file = { name: elFiles.value.substring(elFiles.value.lastIndexOf('\\') + 1, elFiles.length) };
    }
    if (file) {
        elFileName.value = file.name;
        toggleParse(true);
        clearTransactionsList();
    }
    toggleAlert();
};


// section that select the xls transaction file related to the provider fileProviderSelected
var fileProviderSelected = function (e) {
    var file;
    if (e.target.files) {
        file = e.target.files[0];
    } else {
        // ie9
        file = { name: elFileNameProvider.value.substring(elFileNameProvider.value.lastIndexOf('\\') + 1, elFileNameProvider.length) };
    }
    if (file) {
        elFileNameProvider.value = file.name;
        toggleParseProvider(true);
        
    }
    toggleAlert();
};


// Section for Json file selected
var fileSelectedJson = function (e) {
    
    if (e.target.files) {
        fileJsonToParse = e.target.files[0];
    } else {
        // ie9
        fileJsonToParse = { name: elFileNameJson.value.substring(elFileNameJson.value.lastIndexOf('\\') + 1, elFileNameJson.length) };
    }
    if (fileJsonToParse) {
        elFileNameJson.value = fileJsonToParse.name;

        // enable or disable (grayout) the button to import the Json file
        toggleParseJson(true);

        //clearTransactionsList();
    }
    toggleAlert();
};


var FuelTransaction = function (vin, description, serialNumber, licencePlate, comments, dateTime, volume, odometer, cost, currencyCode, location, provider, driverName, sourceData, productType) {
    var self = {
        vehicleIdentificationNumber: vin || '',
        description: description || '',
        serialNumber: serialNumber || '',
        licencePlate: licencePlate || '',
        comments: comments || '',
        dateTime: dateTime,
        volume: volume,
        odometer: odometer,
        cost: cost,
        currencyCode: currencyCode,
        location: location,
        provider: provider,
        driverName: driverName,
        sourceData: sourceData,
        productType: productType
    };
    return self;
};

var FuelTransactionProvider = function (cardNumber,comments,description,device,driver,driverName,externalReference,licencePlate,provider,serialNumber,siteName,sourceData,vehicleIdentificationNumber,cost,currencyCode,dateTime,location,odometer,productType,volume,version,id) {
    var self = {

        cardNumber: cardNumber || '',
        comments: comments || '',
        description: description || '',
        device:device,
        driver: driver,
        driverName: driverName,
        externalReference: externalReference,
        licencePlate: licencePlate || '',
        provider:provider,
        serialNumber: serialNumber || '',
        siteName:siteName,
        sourceData: sourceData,
        vehicleIdentificationNumber: vehicleIdentificationNumber || '',
        cost: cost,
        currencyCode: currencyCode,
        dateTime: dateTime,
        location: location,
        odometer: odometer,
        productType:productType,
        volume: volume,
        version:version,
        id:id
    };
    return self;
};

var FuelTransactionParser = function () {
    var self = this;
    var regex = new RegExp(' ', 'g');
    var Providers = {
        unknown: 0,
        wex: 2,
        wexCustomer: 3,
        fleetcore: 4,
        geotab: 1000,
        fuelProvider : 5
    };

    var isVersionSupportted = (serverVersion) => {
        var parts = serverVersion.split('.');
        return parseInt(parts[2], 10) >= 1606;
    };

    // value parsers
    var getStringValue = function (s) {
        let length = s.length;
        if (length > 0 && s[0] === '"') {
            s = s.substring(1, s.length);
            length--;

            if (length > 0 && s[length - 1] === '"') {
                s = s.substring(0, s.length - 1);
            }
        }
        return (s === '(null)' ? '' : s.trim());
    };

    var getFloatValue = function (float) {
        var value = parseFloat(float);
        return isNaN(value) ? 0.0 : value;
    };

    var getDateValue = function (date) {
        var fromStringDateUtc;
        var fromStringDate = new Date(date);
        var fromOADate = function (oaDateValue) {
            var oaDate = new Date(Date.UTC(1899, 11, 30));
            var millisecondsOfaDay = 24 * 60 * 60 * 1000;
            var result = new Date();
            result.setTime((oaDateValue * millisecondsOfaDay) + Date.parse(oaDate));
            return result;
        };

        // date in iso format
        if (date.indexOf('T') > -1) {
            return fromStringDate.toISOString();
        }

        // date in non oaDate format
        fromStringDateUtc = new Date(Date.UTC(fromStringDate.getFullYear(), fromStringDate.getMonth(), fromStringDate.getDate(), fromStringDate.getHours(), fromStringDate.getMinutes(), fromStringDate.getMilliseconds()));
        if (!isNaN(fromStringDateUtc.getTime())) {
            return fromStringDateUtc.toISOString();
        }

        return fromOADate(getFloatValue(date)).toISOString();
    };

    var milesToKm = function (miles) {
        return miles / 0.62137;
    };
    var gallonsToLitres = function (gallons) {
        return gallons * 3.785;
    };

    /**
     * Provider file parsers, must return a promise resolved with parsed transactions or rejected
     */
    var parsers = {
        wex: function (headings, data) {
             /**
             * Parse product type from code for WEX classic and millennium files
             * @param {any} productType - The WEX prododuct type
             * @returns {any} params - The MyGeotab product type
             */
            let getProductType = productType => {
                let productCode = parseInt(productType, 10) || 0;
                switch (productCode)
                {
                    case 21:
                    case 22:
                    case 23:
                    case 24:
                    case 25:
                    case 26:
                    case 27:
                    case 28:
                    case 29:
                    case 30:
                    case 31:
                    case 32:
                    case 33:
                    case 34:
                    case 35:
                    case 36:
                    case 37:
                    case 38:
                    case 39:
                    case 41:
                    case 42:
                    case 43:
                    case 44:
                    case 45:
                    case 46:
                    case 47:
                    case 49:
                    case 50:
                    case 52:
                    case 53:
                    case 54:
                    case 55:
                    case 56:
                    case 57:
                    case 58:
                    case 59:
                    case 60:
                    case 62:
                    case 63:
                    case 64:
                    case 65:
                    case 66:
                    case 67:
                    case 68:
                    case 70:
                    case 71:
                    case 72:
                    case 73:
                    case 74:
                    case 79:
                    case 80:
                    case 81:
                    case 82:
                    case 83:
                    case 84:
                    case 85:
                    case 90:
                        return 'NonFuel';
                    case 3:
                    case 7:
                    case 12:
                    case 15:
                        return 'Regular';
                    case 4:
                    case 6:
                    case 8:
                    case 13:
                    case 14:
                    case 16:
                    case 17:
                    case 20:
                        return 'Premium';
                    case 2:
                    case 9:
                        return 'Diesel';
                    case 1:
                        return 'E85';
                    case 11:
                        return 'CNG';
                    case 10:
                        return 'LPG';
                    default:
                        return 'Unknown';
                }
            };

            return new Promise(function (resolve) {
                var transactionList = [];

                data.forEach(function (dataRow) {
                    var rawTransaction = {},
                        fuelTransaction;

                    Object.keys(headings).forEach(function (heading) {
                        rawTransaction[headings[heading].replace(regex, '')] = dataRow[heading];
                    });

                    if (dataRow.ColumnN) {
                        fuelTransaction = new FuelTransaction(
                            getStringValue(dataRow.ColumnJ),
                            getStringValue(dataRow.ColumnI),
                            '',
                            getStringValue(dataRow.ColumnG),
                            '',
                            getDateValue(getStringValue(dataRow.ColumnAK)), // may need convert to UTC date, columAK may not exist
                            gallonsToLitres(getFloatValue(getStringValue(dataRow.ColumnN))),
                            milesToKm(getFloatValue(getStringValue(dataRow.ColumnAH))),
                            getFloatValue(getStringValue(dataRow.ColumnO)),
                            'USD',
                            { x: getFloatValue(getStringValue(dataRow.ColumnAM)), y: getFloatValue(getStringValue(dataRow.ColumnAL)) },
                            'Wex',
                            (getStringValue(dataRow.ColumnU) + ' ' + getStringValue(dataRow.ColumnV) + ' ' + getStringValue(dataRow.ColumnT)).trim(),
                            JSON.stringify(rawTransaction),
                            getProductType(getStringValue(dataRow.ColumnQ))
                        );

                        fuelTransaction.fleet = getStringValue(dataRow.ColumnA);
                        transactionList.push(fuelTransaction);
                    }
                });

                return resolve(transactionList);
            });
        },
        wexCustomer: function (headings, data) {
            if (!isVersionSupportted(version)) {
                return new Promise(function (resolve, reject) {
                    reject(new Error(`Your server is not running a version that supports WEX Customer files. The minimum version is 5.7.1606.0 this server is ${version}.`));
                });
            }
            return new Promise(function (resolve, reject) {
                var transactionList = [];
                var addressesLookup = {};
                var addresses = [];
                var promiseChain = new Promise(resolved => { resolved(); });
                var chunkSize = 100;
                var parsingAddressesMessage = 'Parsing: converting addresses to coordinates... ';
                var parsingTimeZonesMessage = 'Parsing: finding timezone of coordinates... ';
                /**
                 * Make an API request and aggregate the results
                 * @param  {any} method - The method to call
                 * @param  {any} params - The parameters to use in the call
                 * @param  {any} message - The message to update the IU
                 * @param  {any} total - The total expected in aggregate (used for message)
                 */
                var aggregateRequests = function (method, params, message, total) {
                    return function (results) {
                        return new Promise(function (resolved) {
                            api.call(method, params, function (result) {
                                var aggegate = results.concat(result);
                                toggleAlert(elAlertInfo, message + aggegate.length + '/' + total);
                                resolved(aggegate);
                            }, reject);
                        });
                    };
                };
                /**
                * Get coordinates from addresses chuncked into more managable request sizes and aggregate results
                */
                var getCoordinatesFromAddresses = () => {
                    var i;
                    var getCoordinates = new Promise(resolved => {
                        resolved([]);
                    });
                    toggleAlert(elAlertInfo, parsingAddressesMessage);
                    // chunk resquests into more managable pieces
                    for (i = 0; i < addresses.length; i += chunkSize) {
                        getCoordinates = getCoordinates.then(aggregateRequests('GetCoordinates', { addresses: addresses.slice(i, i + chunkSize) }, parsingAddressesMessage, addresses.length));
                    }
                    return new Promise(resolved => {
                        getCoordinates.then((coordinates) => {
                            resolved({ addresses, coordinates });
                        });
                    });
                };
                /**
                 * Process the results of getting coordinates for addesses, when no result found return these as addresses to retry
                 * @param  {any} results - The coordinates
                 */
                var processCoordinateResults = (results) => {
                    var retry = [];
                    results.addresses.forEach((address, index) => {
                        var coordinate = results.coordinates[index];
                        if (coordinate) {
                            addressesLookup[address].coordinates = coordinate;
                        } else {
                            retry.push(address);
                        }
                    });
                    return retry;
                };
                /**
                 * Retry getting coordinates for addesses without street
                 * @param  {any} results - The coordinates
                 */
                var retryLowerResolutionAddress = (retry) => {
                    // retry zero-results addresses with less specific address string
                    var i;
                    var getCoordinates = new Promise(resolved => {
                        resolved([]);
                    });
                    var lowerAddressResolution = missed => {
                        var parts = missed.split(',');
                        return parts.slice(1, parts.length).join(',');
                    };

                    // chunk resquests into more managable pieces
                    for (i = 0; i < retry.length; i += chunkSize) {
                        getCoordinates = getCoordinates.then(aggregateRequests('GetCoordinates', {
                            addresses: retry.slice(i, i + chunkSize).map(lowerAddressResolution)
                        }));
                    }
                    return new Promise(resolved => {
                        getCoordinates.then((coordinates) => {
                            resolved({ addresses: retry, coordinates });
                        });
                    });
                };
                /**
                * Get time zones for coordinates
                */
                var getTimeZones = () => {
                    var i;
                    var now = new Date().toISOString();
                    var timeZonesPromise = new Promise(resolved => {
                        resolved([]);
                    });
                    var toTemporalCoordinate = address => {
                        var location = addressesLookup[address].coordinates;
                        return {
                            x: location.x,
                            y: location.y,
                            dateTime: now // hack to do less look ups
                        };
                    };

                    toggleAlert(elAlertInfo, parsingAddressesMessage);
                    // chunk resquests into more managable pieces
                    for (i = 0; i < addresses.length; i += chunkSize) {
                        timeZonesPromise = timeZonesPromise.then(aggregateRequests('GetCoordinateTimeZones', {
                            coordinates: addresses.slice(i, i + chunkSize).map(toTemporalCoordinate)
                        }, parsingTimeZonesMessage, addresses.length));
                    }
                    return timeZonesPromise;
                };
                /**
                 * Process the results of getting time zones
                 * @param  {any} timezones - The time zone results
                 */
                var processTimeZoneResults = timezones => {
                    addresses.forEach((address, index) => {
                        addressesLookup[address].timezone = timezones[index];
                    });
                };
                /**
                 * Add coordinate to fuel transactions and convert date times from local time zone to UTC
                 */
                var augmentTransactions = () => {
                    transactionList.forEach(transaction => {
                        var info = addressesLookup[transaction.address];

                        if (!info.coordinates || (info.coordinates.x === 0 && info.coordinates.y === 0)) {
                            console.log('Invalid coordinates returned for address: ' + transaction.address);
                        } else {
                            transaction.location = info.coordinates;
                        }

                        if (!info.timezone) {
                            console.log('Invalid timezone returned for coordinates: ' + transaction.address + ' ' + JSON.stringify(transaction.location));
                        } else {
                            transaction.dateTime = toUtcTimeFromTimeZone(transaction.dateTime, info.timezone.id);
                        }

                        delete transaction.address;
                    });
                };

                /**
                 * Convert date time to UTC
                 * @param  {any} dateTime
                 * @param  {any} timezoneid
                 */
                var toUtcTimeFromTimeZone = (dateTime, timezoneid) => {
                    if (!timezoneid) {
                        return dateTime;
                    }
                    return moment.tz(dateTime.replace('T', ' ').replace('Z', ''), timezoneid).toISOString();
                };

                /**
                 * Parse product type from code for WEX customer files
                 * @param {any} productType - The WEX prododuct type
                 * @returns {any} params - The MyGeotab product type
                 */
                var getProductType = (productType) => {
                    switch (productType) {
                        // case '':
                        //     return 'NonFuel';
                        case 'UNa':
                        case 'UNb':
                        case 'UNc':
                        case 'UNL':
                        case 'UNLEADED':
                        case 'UNLALC57':
                        case 'UNLALC10':
                        case 'UNLALC77':
                            return 'Regular';
                        // case '':
                        //     return 'Midgrade';
                        case 'SUP':
                        case 'UN+':
                        case 'U+c':
                        case 'U+a':
                        case 'SUa':
                        case 'U+b':
                        case 'SUb':
                        case 'SUc':
                        case 'SUPER UN':
                        case 'UNL PLUS':
                        case 'UN+ALC57':
                        case 'UN+ALC10':
                        case 'SUPALC10':
                        case 'UN+ALC77':
                        case 'SUPALC77':
                        case 'SUPALC57':
                        case 'PREMIUM':
                        case 'UN+EADED PLUS':
                        case 'SUPER UNLEADED':
                            return 'Premium';
                        // case '':
                        //     return 'Super';
                        case 'DIESEL':
                        case 'PREM DSL':
                        case 'DSL':
                        case 'DS+':
                        case 'DSLDIESEL':
                            return 'Diesel';
                        case 'ETHANL85':
                        case 'E85':
                        case 'E85ETHANOL85':
                            return 'E85';
                        case 'CNG':
                            return 'CNG';
                        case 'PRO':
                        case 'PROPANE':
                            return 'LPG';
                        default:
                            return 'Unknown';
                    }
                };

                // Convert spread sheet rows to Fuel Transaction objects
                data.forEach(function (dataRow) {
                    var rawTransaction = {},
                        fuelTransaction;

                    Object.keys(headings).forEach(function (heading) {
                        rawTransaction[headings[heading].replace(regex, '')] = dataRow[heading];
                    });

                    if (dataRow.ColumnS) {
                        fuelTransaction = new FuelTransaction(
                            '',
                            getStringValue(dataRow.ColumnC),
                            '',
                            '',
                            '',
                            getDateValue((getFloatValue(dataRow.ColumnD) + getFloatValue(dataRow.ColumnE)).toFixed(15)),
                            gallonsToLitres(getFloatValue(dataRow.ColumnS)),
                            milesToKm(getFloatValue(dataRow.ColumnO)),
                            getFloatValue(dataRow.ColumnAA), // ColumnU: Fuel Cost, ColumnV: Non-Fuel Cost, ColumnW: Gross Cost (Fuel + Non Fuel), ColumnAA: Net Cost (Fuel Cost - Tax Exempt + Trans Fee)
                            'USD',
                            null,
                            'WexCustomer',
                            getStringValue(dataRow.ColumnL),
                            JSON.stringify(rawTransaction),
                            getProductType(getStringValue(dataRow.ColumnR))
                        );

                        fuelTransaction.address = getStringValue(dataRow.ColumnH) + ', ' + getStringValue(dataRow.ColumnI) + ', ' + getStringValue(dataRow.ColumnJ) + ', ' + getStringValue(dataRow.ColumnK);
                        addressesLookup[fuelTransaction.address] = { coordinates: null, timezone: null };

                        fuelTransaction.fleet = getStringValue(database);
                        transactionList.push(fuelTransaction);
                    } else {
                        console.log('Skipped row');
                    }
                });

                addresses = Object.keys(addressesLookup);

                // populate transcations with coordinates and UTC date/time
                promiseChain
                    .then(getCoordinatesFromAddresses)
                    .then(processCoordinateResults)
                    .then(retryLowerResolutionAddress)
                    .then(processCoordinateResults)
                    .then(getTimeZones)
                    .then(processTimeZoneResults)
                    .then(augmentTransactions)
                    .then(() => {
                        resolve(transactionList);
                    })
                    .catch(reject);
            });
        },
         geotab: function (headings, data) {
            /**
            * Parse product type from code for generic files
            * @param {any} productType - The generic product type
            * @returns {any} params - The MyGeotab product type
            */
            var getProductType = (productType) => {
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
                    case 'e85':
                        return 'E85';
                    case 'cng':
                        return 'CNG';
                    case 'lpg':
                        return 'LPG';
                    default:
                        return 'Unknown';
                }
            };

            return new Promise(function (resolve) {
                var transactionList = [];                

                data.forEach(function (dataRow) {
                    var rawTransaction = {},
                        fuelTransaction;

                    Object.keys(headings).forEach(function (heading) {
                        rawTransaction[headings[heading].replace(regex, '')] = dataRow[heading];
                    });
                    
                    if (dataRow.hasOwnProperty('ColumnM')) {
                        fuelTransaction = new FuelTransaction(
                            getStringValue(dataRow.ColumnA),
                            getStringValue(dataRow.ColumnB),
                            getStringValue(dataRow.ColumnC),
                            getStringValue(dataRow.ColumnD),
                            getStringValue(dataRow.ColumnE),
                            getDateValue(dataRow.ColumnF),
                            getFloatValue(dataRow.ColumnG),
                            getFloatValue(dataRow.ColumnJ),
                            getFloatValue(dataRow.ColumnH),
                            getStringValue(dataRow.ColumnI),
                            { x: getFloatValue(dataRow.ColumnK), y: getFloatValue(dataRow.ColumnL) }, // x = lon, y = lat
                            'Unknown',
                            getStringValue(dataRow.ColumnM),
                            JSON.stringify(rawTransaction),
                            getProductType(getStringValue(dataRow.ColumnN))
                            
                            
                        );                     

                        fuelTransaction.fleet = getStringValue(database);
                        transactionList.push(fuelTransaction);                     
                    }
                });              
                return resolve(transactionList);
            });
        }
    };

    var getHeadings = function (data) {
        var headRow = data[0];
        var isHeadingRow = true;
        Object.keys(headRow).forEach(function (columName) {
            if (!isNaN(parseInt(columName, 10))) {
                isHeadingRow = false;
            }
        });
        if (isHeadingRow) {
            return data.shift();
        }
        return [];
    };

    var determineProvider = function (headings) {
        if (headings.ColumnA === 'VIN' && headings.ColumnM === 'Driver Name') {
            return Providers.geotab;
        } else if (getStringValue(headings.ColumnA) === 'Fleet Name' && getStringValue(headings.ColumnB) === 'ACCOUNT NUMBER 5') {
            return Providers.wex;
        } else if (getStringValue(headings.ColumnA) === 'Card Number' && getStringValue(headings.ColumnB) === 'Vehicle Card Department') {
            return Providers.wexCustomer;
        }
        
        return Providers.unknown;
    };

    var rowsToFuelTransactions = function (provider, headings, data) {
        switch (provider) {
            case Providers.wex:
                return parsers.wex(headings, data);
            case Providers.wexCustomer:
                return parsers.wexCustomer(headings, data);
            case Providers.geotab:
                return parsers.geotab(headings, data);
            case Providers.fuelProvider:
                return parsers.geotab(headings, data);
            default:
                return null;
        }
    };

    self.parse = function (data) {
        var headings = getHeadings(data);
        var provider;

        if (!headings) {
          return new Promise(function (resolve, reject) {
              reject(new Error('missing row headings in file'));
          });
        }

        provider = determineProvider(headings);
        if (provider === Providers.unknown) {
          return new Promise(function (resolve, reject) {
              reject(new Error('unrecognised file provider'));
          });
        }

        return rowsToFuelTransactions(provider, headings, data);
        
    };
    
    return self;
    
};

var FuelTransactionParserProvider = function () {
    var self = this;
    var regex = new RegExp(' ', 'g');
    var Providers = {
        unknown: 0,
        wex: 2,
        wexCustomer: 3,
        fleetcore: 4,
        geotab: 1000,
        fuelProvider : 5
    };

    var isVersionSupportted = (serverVersion) => {
        var parts = serverVersion.split('.');
        return parseInt(parts[2], 10) >= 1606;
    };
    // value parsers
    var getStringValue = function (s) {
        let length = s.length;
        if (length > 0 && s[0] === '"') {
            s = s.substring(1, s.length);
            length--;

            if (length > 0 && s[length - 1] === '"') {
                s = s.substring(0, s.length - 1);
            }
        }
        return (s === '(null)' ? '' : s.trim());
    };
    var getFloatValue = function (float) {
        var value = parseFloat(float);
        return isNaN(value) ? 0.0 : value;
    };

    var getDateValue = function (date) {
        var fromStringDateUtc;
        var fromStringDate = new Date(date);
        var fromOADate = function (oaDateValue) {
            var oaDate = new Date(Date.UTC(1899, 11, 30));
            var millisecondsOfaDay = 24 * 60 * 60 * 1000;
            var result = new Date();
            result.setTime((oaDateValue * millisecondsOfaDay) + Date.parse(oaDate));
            return result;
        };

        // date in iso format
        if (date.indexOf('T') > -1) {
            return fromStringDate.toISOString();
        }

        // date in non oaDate format
        fromStringDateUtc = new Date(Date.UTC(fromStringDate.getFullYear(), fromStringDate.getMonth(), fromStringDate.getDate(), fromStringDate.getHours(), fromStringDate.getMinutes(), fromStringDate.getMilliseconds()));
        if (!isNaN(fromStringDateUtc.getTime())) {
            return fromStringDateUtc.toISOString();
        }

        return fromOADate(getFloatValue(date)).toISOString();
    };
    var milesToKm = function (miles) {
        return miles / 0.62137;
    };
    var gallonsToLitres = function (gallons) {
        return gallons * 3.785;
    };

    /**
     * Provider file parsers, must return a promise resolved with parsed transactions or rejected
     */
    var parsers = {
        providerSelected: function (headings, data) {
            /**
            * Parse product type from code for generic files
            * @param {any} productType - The generic product type
            * @returns {any} params - The MyGeotab product type
            */
            var getProductType = (productType) => {
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
                    case 'e85':
                        return 'E85';
                    case 'cng':
                        return 'CNG';
                    case 'lpg':
                        return 'LPG';
                    default:
                        return 'Unknown';
                }
            };

            return new Promise(function (resolve) {
                var transactionList = [];                

                data.forEach(function (dataRow) {
                    var rawTransaction = {},
                        fuelTransaction;

                    Object.keys(headings).forEach(function (heading) {
                        rawTransaction[headings[heading].replace(regex, '')] = dataRow[heading];
                    });
                    
                    if (dataRow.hasOwnProperty('ColumnM')) {
                        fuelTransaction = new FuelTransaction(
                            getStringValue(dataRow.ColumnA),
                            getStringValue(dataRow.ColumnB),
                            getStringValue(dataRow.ColumnC),
                            getStringValue(dataRow.ColumnD),
                            getStringValue(dataRow.ColumnE),
                            getDateValue(dataRow.ColumnF),
                            getFloatValue(dataRow.ColumnG),
                            getFloatValue(dataRow.ColumnJ),
                            getFloatValue(dataRow.ColumnH),
                            getStringValue(dataRow.ColumnI),
                            { x: getFloatValue(dataRow.ColumnK), y: getFloatValue(dataRow.ColumnL) }, // x = lon, y = lat
                            'Unknown',
                            getStringValue(dataRow.ColumnM),
                            JSON.stringify(rawTransaction),
                            getProductType(getStringValue(dataRow.ColumnN))
                            
                            
                        );                     

                        fuelTransaction.fleet = getStringValue(database);
                        transactionList.push(fuelTransaction);                     
                    }
                });              
                return resolve(transactionList);
            });
        }
    };

    var getHeadings = function (data) {
        var headRow = data[0];
        var isHeadingRow = true;
        Object.keys(headRow).forEach(function (columName) {
            if (!isNaN(parseInt(columName, 10))) {
                isHeadingRow = false;
            }
        });
        if (isHeadingRow) {
            return data.shift();
        }
        return [];
    };
    var determineProvider = function (headings) {
        
            return Providers.providerSelected;       
    };

    var rowsToFuelTransactions = function (provider, headings, data) {
        switch (provider) {
            case Providers.wex:
                return parsers.wex(headings, data);
            case Providers.wexCustomer:
                return parsers.wexCustomer(headings, data);
            case Providers.geotab:
                return parsers.geotab(headings, data);
            case Providers.fuelProvider:
                return parsers.geotab(headings, data);
            default:
                return null;
        }
    };

    self.parse = function (data) {
        var headings = getHeadings(data); 
        var provider = getTemplateProviderNameFromSelection();

        if (!headings) {
          return new Promise(function (resolve, reject) {
              reject(new Error('missing row headings in file'));
          });
        }

        provider = determineProvider(headings);
        if (provider === Providers.unknown) {
          return new Promise(function (resolve, reject) {
              reject(new Error('unrecognised file provider'));
          });
        }
     
        return rowsToFuelTransactions(provider, headings, data);
        
    };
    
    return self;
    
};

var resultsParser = function (xhr) {
    var jsonResponse,
        data,
        error;
    if (xhr.target && xhr.target.responseText.length > 0) {
        jsonResponse = JSON.parse(xhr.target.responseText);
        if (!jsonResponse.error) {
            data = jsonResponse.result;
        } else {
            error = jsonResponse.error;
        }
    }
    else {
        error = { message: 'No data' };
    }
    return {
        error: error,
        data: data
    };
};

var uploadComplete = function (e) {
    var results;
    var fuelTransactionParser = new FuelTransactionParser();

    // For each transaction check if fleet field is empty,
    // if so, is filled with database name
    var getFleets = function (trans) {
        var fleets = {};
        trans.forEach(function (transaction) {
            fleets[transaction.fleet] = transaction.fleet || database;
        });
        return Object.keys(fleets);
    };
    // -------------

    clearFiles();
    results = resultsParser(e);
    
    if (results.error) {
        toggleAlert(elAlertError, results.error.message);
        return;
        }
        
    fuelTransactionParser.parse(results.data)
        .then(function (result) {
           
            transactions = result;
            if (transactions === null) {
                toggleAlert(elAlertError, 'Can not determine file provider type, try converting to MyGeotab file type');
                return;
            }
            if (!transactions.length) {
                toggleAlert(elAlertError, 'No transactions found in file');
                return;
            }
            setFleetSelection(getFleets(transactions));
            toggleImport(true);
            renderTransactions(transactions);
            toggleAlert();
        })
        .catch(function (err) {
            console.log(err);
            toggleAlert(elAlertError, 'Error parsing file: ' + (err.message || err));
        });

        



};

// ie9
var iframeUpload = function (form, actionUrl, parameters) {
    var elIframe = document.createElement('iframe');
    var hiddenField = form.querySelector('input[type="hidden"]');
    var eventHandler = function (e) {
        var content;

        e.preventDefault();
        e.stopPropagation();

        elIframe.removeEventListener('load', eventHandler, false);

        // Message from server...
        if (elIframe.contentDocument) {
            content = elIframe.contentDocument.body.innerHTML;
        } else if (elIframe.contentWindow) {
            content = elIframe.contentWindow.document.body.innerHTML;
        } else if (elIframe.document) {
            content = elIframe.document.body.innerHTML;
        }

        // complete
        uploadComplete({ target: { responseText: content } });

        // Del the iframe...
        setTimeout(function () {
            elIframe.parentNode.removeChild(elIframe);
        }, 250);
    };

    hiddenField.value = parameters;

    elIframe.setAttribute('id', 'upload_iframe');
    elIframe.setAttribute('name', 'upload_iframe');
    elIframe.setAttribute('width', '0');
    elIframe.setAttribute('height', '0');
    elIframe.setAttribute('border', '0');
    elIframe.setAttribute('style', 'width: 0; height: 0; border: none;');

    // Add to document...
    form.parentNode.appendChild(elIframe);
    window.frames.upload_iframe.name = 'upload_iframe';

    elIframe.addEventListener('load', eventHandler, true);

    // Set properties of form...
    form.setAttribute('target', 'upload_iframe');
    form.setAttribute('action', actionUrl);
    form.setAttribute('method', 'post');
    form.setAttribute('enctype', 'multipart/form-data');
    form.setAttribute('encoding', 'multipart/form-data');

    // Submit the form...
    form.submit();
};

var uploadFile = function (e) {
    e.preventDefault();
    toggleAlert(elAlertInfo, 'Parsing... transferring file');
    api.getSession(function (credentials) {
        var fd;
        var xhr;
        var parameters = JSON.stringify({
            id: -1,
            method: 'ExcelToJson',
            params: {
                minColumnsAmount: 28,
                credentials: credentials
            }
        });               

        if (window.FormData) {
            fd = new FormData();
            xhr = new XMLHttpRequest();

            fd.append('JSON-RPC', parameters);
            fd.append('fileToUpload', elFiles.files[0]);

            xhr.upload.addEventListener('progress', uploadProgress, false);
            xhr.addEventListener('load', uploadComplete, false);
            xhr.addEventListener('error', uploadFailed, false);
            xhr.addEventListener('abort', uploadFailed, false);
            if(getUrl()=='http://localhost/apiv1')
            {
                xhr.open('POST','https://my1250.geotab.com/apiv1')
            }
            else
            {
                xhr.open('POST', getUrl());
            }
            xhr.send(fd);
        } else {
            iframeUpload(elForm, getUrl(), parameters);
        }
        database = credentials.database;
        toggleParse(false);
    });
};


var uploadProgress = function (e) {
    if (e.lengthComputable) {
        var percentComplete = Math.round(e.loaded * 100 / e.tota);
        if (percentComplete < 100) {
            toggleAlert(elAlertInfo, 'Parsing: transferring file ' + percentComplete.toString() + '%');
        } else {
            toggleAlert(elAlertInfo, 'Parsing: converting csv to fuel transactions');
        }

    }
};

var uploadFailed = function () {
    toggleAlert(elAlertError, 'There was an error attempting to upload the file.');
};

var importFile = function () {
    var fleetName = elFleet.options[elFleet.selectedIndex].value;
    var callSets = [];
    var callSet = [];
    var caller;
    var callLimit = 100;
    var i;
    var totalAdded = 0;
    var total = 0;
    var message = 'Importing fuel transactions...';
    var updateTotal = function (results) {
        totalAdded += typeof results === 'string' ? 1 : results.length;
    };
    var doCalls = function (calls) {
        return new Promise(function (resolve, reject) {
            api.multiCall(calls, resolve, reject);
        });
    };
    var popNextCall = function () {
        var calls = callSets.pop();
        return function (results) {
            updateTotal(results);
            toggleAlert(elAlertInfo, message + ' ' + totalAdded + '/' + total);
            return doCalls(calls);
        };
    };
    toggleImport(false);
    toggleBrowse(false);
    toggleAlert(elAlertInfo, message);
    transactions.forEach(function (transaction, j) {
        if (!fleetName || transaction.fleet === fleetName) {
            callSet.push(['Add', { typeName: 'FuelTransaction', entity: transaction }]);
            total++;
        }
        if (callSet.length === callLimit || j === transactions.length - 1) {
            callSets.push(callSet);
            callSet = [];
        }
    });

    caller = doCalls(callSets.pop());

    for (i = 0; i < callSets.length; i++) {
        caller = caller.then(popNextCall());
        i--;
    }

    caller.then(function (results) {
        updateTotal(results);
        clearTransactions();
        toggleAlert(elAlertSuccess, totalAdded);
        toggleBrowse(true);
    }).catch(function (e) {
        toggleBrowse(true);
        toggleAlert(elAlertError, e.toString());
    });
};

// Generic format button
var toggleExample = function (e) {
    var checked = e.target.checked;
    if (!checked) {
      
        e.target.parentNode.className = e.target.parentNode.className.replace('active', '');
          

    } else {
     
        e.target.parentNode.className += ' active';
        
    }
    elSample.style.display = checked ? 'block' : 'none';
};

var parsingTransactionWithProvider = function(transactions,provider)
{
    var jsonObjParsed = {};

    
    //loop transaction list row by row
    console.log(transactions);
    console.log(provider);

    var newTranscationObj = new FuelTransactionProvider(); 

    for (var k=0;k<transactions.length;k++)
    {
       

       console.log("Array Nuovo Mappato: " +  newTranscationObj);
    }
    return newTranscationObj;
}

var GetFuelTransaction = function(transaction,providerMapping)
{
  var fuelTransaction;
  

    for (var i=0;i<provider.length;i++){
        console.log(transactions[k][provider[i]]);
                newTranscationObj[provider[i]]= (transactions[k][provider[i]]);
        
                         
                for (let [key, value] of Object.entries(transactions[k])) {
        
                    if(provider[i] == `${key}`)
                    {
                        //console.log(`${key}`);
                        //jsonObjParsed['`${key}`'] = `${value}`;  
                        newTranscationObj['`${key}`']= `${value}`;  
                        //newTranscationObj.comments = transactions[k].colonnapresadaproviers[1];   
                                        
                    }            
                  }
                
               }

//return json object


}

var toggleJsonDropDownMenu = function()
{
    var itemIndexSelected = elJsonDropDownMenu.selectedIndex;
    var itemValueSelected = elJsonDropDownMenu.options[elJsonDropDownMenu.selectedIndex].value;
    var lengthDropDownMenu = elJsonDropDownMenu.length;
    if(itemIndexSelected != "0")
    {
        //container that show the File selection
    //elFileSelectContainer.style.display = 'block';
    clearFilesProvider();
    elFileSelectContainerProvider.style.display = 'block';


    }
    else
    {

    }



};


// Function fired when user click Import,
// function is parsing the json file with providers
var parseJsonMapping = function (event) {

event.preventDefault();   
// get the file
var upload = document.getElementById('filesJson');
var result;
var ok;

// Make sure the DOM element exists
if (upload) 
{
    // Make sure a file was selected
    if (upload.files.length > 0) 
    {
        var reader = new FileReader(); // File reader to read the file 
        // This event listener will happen when the reader has read the file 
        reader.addEventListener('load', function() 
        {
            if(validateIfJsonFIle(reader.result))
            {
                result = JSON.parse(reader.result); // Parse the result into an object
                objProviderTemplate = result;
                
                ok = true;
                             
            }
            else
            {
                alert('Please select JSON files only!');
                ok = false;
                clearFilesJson();
            }           
                       
      });
      
        reader.readAsText(upload.files[0]); // Read the uploaded file
        //when the load is ended, I check if file uploaded was Json file and flagged as true
        // I build the dropdown menu 
        reader.addEventListener('loadend',function()
          {
              if(ok)
              {
                
                elJsonDropDownMenu.length = 0;
                elJsonDropDownMenu.style.display = "block";
    
                let defaultOption = document.createElement('option');
                defaultOption.text = 'Choose Provider';
    
                elJsonDropDownMenu.appendChild(defaultOption);
                elJsonDropDownMenu.selectedIndex = 0;
    
                let option;  
                for (let i = 0; i < result.providers.length; i++) 
                {
                option = document.createElement('option');
                option.text = result.providers[i].Name;
                elJsonDropDownMenu.appendChild(option);
                }

              }
              else
              {

              }
          
              
          
          })   


    }
}
    
    
}

var validateIfJsonFIle = function(fileJsonToCheck)
{
    try 
    { 
        JSON.parse(fileJsonToCheck); 
    }
    catch(err)
    {
        console.log(err);
        return false; 
        
    }  
    return true;


}


var showSelectorSection = function()
{
    
    for(var i = 0; i < elSelector.length; i++) {
                
        if(elSelector[i].checked)
        {
           
           switch(elSelector[i].id)
           {
               case "providerSelector": 
                clearFiles();
                clearFilesJson();
                clearTransactions();
                
                elFileJsonSelectContainer.style.display = 'block';
                elFileSelectContainer.style.display = 'none';
                elFileSelectContainerProvider.style.display = 'none';
                elJsonDropDownMenu.style.display = "none";

                break;
               

               default: 
               clearFiles();
               clearFilesJson();
               elFileJsonSelectContainer.style.display = 'none';
               elFileSelectContainer.style.display = 'block';
               elFileSelectContainerProvider.style.display = 'none';
            
           }
           
            
        }
        

    }

}

var uploadFileProvider = function(e)
{
    e.preventDefault();

    toggleAlert(elAlertInfo, 'Parsing... transferring file');
    api.getSession(function (credentials) {
        var fd;
        var xhr;
        var parameters = JSON.stringify({
            id: -1,
            method: 'ExcelToJson',
            params: {
                minColumnsAmount: 28,
                credentials: credentials
            }
        });  

        if (window.FormData) {
            fd = new FormData();
            xhr = new XMLHttpRequest();

            fd.append('JSON-RPC', parameters);
            fd.append('fileToUpload', elFileProvider.files[0]);

            xhr.upload.addEventListener('progress', uploadProgress, false);
            xhr.addEventListener('load', uploadCompleteProvider, false);
            xhr.addEventListener('error', uploadFailed, false);
            xhr.addEventListener('abort', uploadFailed, false);
            if(getUrl()=='http://localhost/apiv1')
            {
                xhr.open('POST','https://my1250.geotab.com/apiv1')
            }
            else
            {
                xhr.open('POST', getUrl());
            }
            xhr.send(fd);
        } else {
            iframeUpload(elForm, getUrl(), parameters);
        }
        database = credentials.database;
        toggleParse(false);
    });





}

//function return the provider selected 
var getTemplateProviderNameFromSelection = function()
{
  if(elJsonDropDownMenu.selectedIndex!=0)
  {
        return elJsonDropDownMenu.options[elJsonDropDownMenu.selectedIndex].value;
    }
    else
    {
        console.log("json dropdown menu error, provider not selected")
    }

}

var getHeadings = function getHeadings(data) {
    var headRow = data[0];
    var isHeadingRow = true;
    Object.keys(headRow).forEach(function (columName) {
      if (!isNaN(parseInt(columName, 10))) {
        isHeadingRow = false;
      }
    });

    if (isHeadingRow) {
      return data.shift();
    }

    return [];
  };

var uploadCompleteProvider = function (e) {

    var results;
    var headingsExtracted;
    var arrayColumns = new Array();
    
    // retrieve the name of the provider selected
    var providerSelected = getTemplateProviderNameFromSelection();
    // retrieve the keys of the provider selected from the full template ojbect
    var extractedProviderTemplate = objProviderTemplate.providers.filter((provider) => provider.Name ===providerSelected);    
    
    results = resultsParser(e);


//remove the heading from transaction
headingsExtracted= getHeadings(results.data);
//console.log("header Transactions");
//console.log(headingsExtracted);
//console.log("Transactions from Excel");
//console.log(results.data);

//

//Insert HERE the function that get the right column based on the provider selected

for (let [key, value] of Object.entries(extractedProviderTemplate[0].data)) {
    //console.log(`${key}: ${value}`);
    arrayColumns.push(`${value}`);
  }

  var fuelTransctionImport = {};

  fuelTransctionImport = parsingTransactionWithProvider(results.data,extractedProviderTemplate);


//loop transaction -> json object
//create array


  //console.log(arrayColumns);
// --------

/*
    fuelTransactionProvider = new FuelTransactionProvider(
        //cardNumber -> arrayColumns[0] = columnA
        //comments -> arrayColumns[1] = columnH
        //description -> arrayColumns[2]
        //device -> arrayColumns[3]
        //driver
        //driverName
        //externalReference
        //licencePlate//provider
        //serialNumber
        //siteName
        //sourceData
        //vehicleIdentificationNumber
        //cost
        //currencyCode
        //dateTime
        //location
        //odometer
        //productType
        //volume
        //version
        //id
        /*
        getStringValue(dataRow.ColumnA),
        getStringValue(dataRow.ColumnB),
        getStringValue(dataRow.ColumnC),
        getStringValue(dataRow.ColumnD),
        getStringValue(dataRow.ColumnE),
        getDateValue(dataRow.ColumnF),
        getFloatValue(dataRow.ColumnG),
        getFloatValue(dataRow.ColumnJ),
        getFloatValue(dataRow.ColumnH),
        getStringValue(dataRow.ColumnI),
        { x: getFloatValue(dataRow.ColumnK), y: getFloatValue(dataRow.ColumnL) }, // x = lon, y = lat
        'Unknown',
        getStringValue(dataRow.ColumnM),
        JSON.stringify(rawTransaction),
        getProductType(getStringValue(dataRow.ColumnN))  
           
        
    );    
    transactionList.push(fuelTransactionProvider); 
       */
    
};


var connectionTest = function()
{
    api.call('Get', {
        typeName: 'Device',
        resultsLimit: 10
      }, function(err, devices) {
        if(err){
          console.log('Error', err);
          return;
        }
        console.log('Devices', devices);
      });
}


    // the root container
    //var elAddin = document.getElementById('addinFuelTransactionImport20');
  
  return {
    /**
     * initialize() is called only once when the Add-In is first loaded. Use this function to initialize the
     * Add-In's state such as default values or make API requests (MyGeotab or external) to ensure interface
     * is ready for the user.
     * @param {object} geotabApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     * @param {function} initializeCallback - Call this when your initialize route is complete. Since your initialize routine
     *        might be doing asynchronous operations, you must call this method when the Add-In is ready
     *        for display to the user.
     */
    initialize: function (geotabApi, freshState, initializeCallback) {

      api = geotabApi;

      elContainer = document.getElementById('importFuelTransactions');
      elFiles = document.getElementById('files');
      elParseButton = document.getElementById('parseButton');
      elImportButton = document.getElementById('importButton');
      elCancelButton = document.getElementById('cancelButton');
      elFleet = document.getElementById('fleet');
      elExampleButton = document.getElementById('exampleButton');
      elFileName = document.getElementById('fileName');
      elTransactionList = document.getElementById('transactionList');
      elTransactionContainer = document.getElementById('transactionContainer');
      elFileSelectContainer = document.getElementById('fileSelectContainer');
      elAlertInfo = document.getElementById('alertInfo');
      elAlertSuccess = document.getElementById('alertSuccess');
      elAlertError = document.getElementById('alertError');
      elSample = document.getElementById('sample');
      elForm = document.getElementById('form');
      elListCount = document.getElementById('listCount');

      elFilesJson = document.getElementById('filesJson');
        
      elParseButtonJson = document.getElementById('importJsonFile');

      elFileJsonSelectContainer = document.getElementById('jsonfileSelectContainer');
      elFileNameJson = document.getElementById('fileNameJson');
      elJsonDropDownMenu = document.getElementById('providerDropMenu');
      elConnectionTest = document.getElementById('buttonConnTest');

      elSelector = document.querySelectorAll('input[name="selector"]');

      elFileSelectContainerProvider = document.getElementById('fileSelectContainerProvider');
      elFileProvider = document.getElementById('filesProvider');
      elFileNameProvider = document.getElementById('fileNameProvider');
      elParseButtonProvider = document.getElementById('parseButtonProvider');


    // Loading translations if available
    if (freshState.translate) {
      freshState.translate(elContainer || '');
    }
    // MUST call initializeCallback when done any setup
    api.call('GetVersion', {}, (result) => {
      version = result;
      initializeCallback();
  }, (e) => {
      toggleAlert(elAlertError, e.toString());
      initializeCallback();
  });
    },

    /**
     * focus() is called whenever the Add-In receives focus.
     *
     * The first time the user clicks on the Add-In menu, initialize() will be called and when completed, focus().
     * focus() will be called again when the Add-In is revisited. Note that focus() will also be called whenever
     * the global state of the MyGeotab application changes, for example, if the user changes the global group
     * filter in the UI.
     *
     * @param {object} geotabApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     */
    focus: function (geotabApi, freshState) {
      
          // getting the current user to display in the UI
          geotabApi.getSession(session => {
            elContainer.querySelector('#importFuelTransactions-user').textContent = session.userName;
          });
                    
          elContainer.className = '';
          
      // show main content
            // events
            elFiles.addEventListener('change', fileSelected, false);
            elParseButton.addEventListener('click', uploadFile, false);
            elImportButton.addEventListener('click', importFile, false);
            elFleet.addEventListener('change', renderTransactions, false);
            elExampleButton.addEventListener('change', toggleExample, false);
            elCancelButton.addEventListener('click', clearTransactions, false);

            elParseButtonJson.addEventListener('click', parseJsonMapping, false);
            
            elFilesJson.addEventListener('change', fileSelectedJson, false);
            elJsonDropDownMenu.addEventListener('change', toggleJsonDropDownMenu, false);
            elContainer.style.display = 'block';

            elConnectionTest.addEventListener('click', connectionTest, false);
            //elSelector.addEventListener('click',showSelectorSection,false);

            for (var i = 0 ; i < elSelector.length; i++) {
                elSelector[i].addEventListener('change' , showSelectorSection , false ) ; 
             }

             elFileProvider.addEventListener('change',fileProviderSelected,false);
             elParseButtonProvider.addEventListener('click',uploadFileProvider,false);
          

      
    },

    /**
     * blur() is called whenever the user navigates away from the Add-In.
     *
     * Use this function to save the page state or commit changes to a data store or release memory.
     *
     * @param {object} geotabApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     */
    blur: function () {
      // hide main content
      elContainer.className += ' hidden';

      // events
      elFiles.removeEventListener('change', fileSelected, false);
      elParseButton.removeEventListener('click', uploadFile, false);
  
      elImportButton.removeEventListener('click', importFile, false);
      elFleet.removeEventListener('change', renderTransactions, false);
      elExampleButton.removeEventListener('change', toggleExample, false);
      elCancelButton.removeEventListener('click', clearTransactions, false);

      elFilesJson.removeListener('change', fileSelectedJson, false);
      elParseButtonJson.removeEventListener('click', parseJsonMapping, false);
      elJsonDropDownMenu.removeEventListener('change', toggleJsonDropDownMenu, false);

     //elSelector.removeEventListener('click',showSelectorSection,false);

      for (var i = 0 ; i < elSelector.length; i++) {
        elSelector[i].removeEventListener('change' , showSelectorSection , false ) ; 
     }
     elFileProvider.removeEventListener('change',fileProviderSelected,false);
     elParseButtonProvider.removeEventListener('click',uploadFileProvider,false);
  

    }
  };
};
