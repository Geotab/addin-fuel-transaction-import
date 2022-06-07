/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */



geotab.addin.addinFuelTransactionImport_fp = function () {
    'use strict';

    // Geotab Addin variables
    var api;

    // DOM Elements
    var elContainer;
    var elFiles;
    // Open File button
    var elParseButton;
    var elImportButton;
    var elCancelButton;
    var elImportButtonProvider;
    var elCancelButtonProvider;
    var elFleet;
    var elExampleButton;
    var elFileName;
    var elTransactionList;
    var elTransactionListProvider;
    var elTransactionContainer;
    var elTransactionContainerProvider;
    var elFileSelectContainer;
    var elAlertSuccess;
    var elAlertInfo;
    var elAlertError;
    var elSample;
    var elForm;
    var elListCount;
    var elListCountProvider;

    var elFileJsonSelectContainer;
    var elFilesJson;
    var elFileNameJson;
    // Import Json File Button
    var elParseButtonJson;
    var elJsonDropDownMenu;
    var elSelector;
    var elFileSelectContainerProvider;

    var elFileProvider;
    var elFileNameProvider;
    // Provider Open File Button
    var elParseButtonProvider;

    var elTimezonePicker;
    var elTimezoneCheckbox;



    // scoped vars
    var transactions;
    var database;
    var version;
    var ROW_LIMIT = 10;
    var unitVolumeLiters;
    var unitOdoKm;
    var dateFormat;
    var hourFormat;
    var dateHoursComposed;
    var fileJsonToParse;
    var objProviderTemplate;
    var timezoneFromPicker;
    var currencyCodeMapped;
    var locationCoordinatesProvider;
    var isCellDateType;

    const moment = require('moment');
    const cc = require('currency-codes');

    /**
     * Toggles enabled/disabled property of the Open File button
     * @param  {boolean} toggle true or false
     */
    var toggleParse = function (toggle) {
        if (toggle) {
            elParseButton.removeAttribute('disabled');
            toggleImport(false);
        } else {
            elParseButton.setAttribute('disabled', 'disabled');
        }
    };


    /**
     * Toggles enabled/disabled property of the Import Json File button
     * @param  {boolean} toggle true or false
     */
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

    /**
     * Toggles enabled/disabled property of the Provider Open File button
     * @param  {boolean} toggle true or false
     */
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

    var toggleImportProvider = function (toggle) {
        if (toggle) {
            elImportButtonProvider.removeAttribute('disabled');
        } else {
            elImportButtonProvider.setAttribute('disabled', 'disabled');
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
            el.querySelector('span').textContent = content; toggleParse;
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

    var clearTransactionsListProvider = function () {
        //container that hide the transaction
        elTransactionContainerProvider.style.display = 'none';

        elFileSelectContainerProvider.style.display = 'none';
        elFileJsonSelectContainer.style.display = 'block';


    };

    var clearTransactions = function () {
        clearTransactionsList();
        clearFleets();
        toggleParse(false);
        toggleImport(false);
    };

    var clearTransactionsProvider = function () {
        clearTransactionsListProvider();
        clearFleets();
        toggleParse(false);
        toggleImport(false);
        toggleAlert();
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

    var renderTransactionsProvider = function (transactions) {

        var elBody;
        var visibleCount = 0;
        var totalRowsCount = 0;

        var getColumnHeading = function (column) {
            var columnHeadings = {
                'cardNumber': "Card Number",
                'comments': 'Comments',
                'description': 'Description',
                'driverName': 'Driver Name',
                'externalReference': 'External Reference',
                'licencePlate': 'Licence Plate',
                'provider': 'Fuel Provider',
                'siteName': 'Site Name',
                'vehicleIdentificationNumber': 'VIN',
                'cost': 'Cost',
                'currencyCode': 'Currency',
                'dateTime': 'Date (UTC)',
                'odometer': 'Odometer',
                'productType': 'Product Type',
                'volume': 'Volume Added',

            };
            return columnHeadings[column] || column;
        };
        var createRow = function (row, isHeading) {
            var elRow = document.createElement('TR');
            //elRow.setAttribute('border: 1px solid black');
            var createColumn = function (columnName) {
                if (columnName === 'device' || columnName === 'driver' || columnName === 'serialNumber' || columnName === 'sourceData' || columnName === 'location' || columnName === 'version' || columnName === 'id' || columnName === 'fleet') {
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

        elTransactionContainerProvider.style.display = 'none';
        elFileSelectContainerProvider.style.display = 'block';

        while (elTransactionListProvider.firstChild) {
            elTransactionListProvider.removeChild(elTransactionListProvider.firstChild);
        }

        elBody = document.createElement('TBODY');

        transactions.forEach(function (transaction, i) {
            var elHead;

            if (i === 0) {
                elHead = document.createElement('THEAD');
                elHead.appendChild(createRow(transaction, true));
                elTransactionListProvider.appendChild(elHead);
            }

            totalRowsCount++;
            if (visibleCount < ROW_LIMIT) {
                visibleCount++;
                elBody.appendChild(createRow(transaction));
            }

        });
        elListCountProvider.textContent = (ROW_LIMIT === visibleCount ? 'top ' : '') + visibleCount + '/' + totalRowsCount;
        elTransactionListProvider.appendChild(elBody);
        elTransactionContainerProvider.style.display = 'block';
        elFileSelectContainerProvider.style.display = 'none';
        elFileJsonSelectContainer.style.display = 'none';



    };


    var clearFiles = function () {
        elFiles.value = null;
        elFileName.value = '';
    };
    var clearFilesJson = function () {
        elFilesJson.value = null;
        elFileNameJson.value = null;
        elJsonDropDownMenu.style.display = 'none';
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

        clearTransactionsProvider();


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

    var FuelTransactionProvider = function (cardNumber, comments, description, driverName, externalReference, licencePlate, provider, serialNumber, siteName, vehicleIdentificationNumber, cost, currencyCode, dateTime, odometer, productType, volume) {
        var self = {

            cardNumber: cardNumber || '',
            comments: comments || '',
            description: description || '',
            driverName: driverName || '',
            externalReference: externalReference || '',
            licencePlate: licencePlate || '',
            provider: provider || '',
            serialNumber: serialNumber || '',
            siteName: siteName || '',
            vehicleIdentificationNumber: vehicleIdentificationNumber || '',
            cost: cost || '',
            currencyCode: currencyCode || '',
            dateTime: dateTime || '',
            odometer: odometer || '',
            productType: productType || '',
            volume: volume || '',

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

    var FuelTransactionParser = function () {
        var self = this;
        var regex = new RegExp(' ', 'g');
        var Providers = {
            unknown: 0,
            wex: 2,
            wexCustomer: 3,
            fleetcore: 4,
            geotab: 1000
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
                    switch (productCode) {
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

                if (getUrl() == 'http://localhost/apiv1') {
                    xhr.open('POST', 'https://proxy.geotab.com/apiv1');
                }
                else {
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

    var uploadFailed = function (e) {
        toggleAlert(elAlertError, 'There was an error attempting to upload the file.');
        console.log(e);
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
            console.log("results: ", results);
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

    var importFileProvider = function () {

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




        toggleImportProvider(false);

        toggleAlert(elAlertInfo, message);
        transactions.forEach(function (transaction, j) {

            callSet.push(['Add', { typeName: 'FuelTransaction', entity: transaction }]);
            total++;

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


            var temp = JSON.stringify(results);

            console.log("Transaction Imported with ID: ", temp.replace(/[\[\]"]+/g, ""));

            //window.alert("Transaction ID: "+temp.replace(/[\[\]"]+/g, ""));
            clearTransactionsProvider();
            toggleAlert(elAlertSuccess, totalAdded);

        }).catch(function (e) {

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

    async function parsingTransactionWithProviderAsync(transactions, provider) {
        var arrayOfParsedTransaction = [];

        //loop transaction list row by row
        for (var k = 0; k < transactions.length; k++) {
            arrayOfParsedTransaction.push(await loopParseTransactionInTemplateAsync(transactions[k], provider[0].data));
        }
        try {
            var jsonObjParsed = JSON.parse(JSON.stringify(arrayOfParsedTransaction));


        } catch (e) {
            console.log("Error: ", e);
        }

        //jsonObjParsed will be the object with the transaction parsed into
        //API template for fuel transaction and will returned into
        //fuelTransactionImport object in uploadCompleteProviderAsync function
        return jsonObjParsed;
    }
    async function loopParseTransactionInTemplateAsync(singleTransaction, provider) {
        var newTranscationObj = new FuelTransactionProvider();

        for (var prop in provider) {
            if (provider[prop] == null) {provider[prop] = "";}//if json file has null field change in ""        
        }


        //check of the mandatory fields
        //Stop the execution

        if (provider["licencePlate"] == "" && provider["vehicleIdentificationNumber"] == "" && provider["serialNumber"] == "") {
            console.log("Not mapped into Json file, Licence Plate or Vin or Serial Number is needed");
            window.alert("Licence Plate, VIN and Serial Number are not mapped into Json file at least one must be filled");
            clearAllForException();

        }
        else {
            if (singleTransaction[provider["licencePlate"]] == "" || singleTransaction[provider["licencePlate"]] == undefined) {
                if (singleTransaction[provider["vehicleIdentificationNumber"]] == "" || singleTransaction[provider["vehicleIdentificationNumber"]] == undefined) {
                    if (singleTransaction[provider["serialNumber"]] == "" || singleTransaction[provider["serialNumber"]] == undefined) {
                        console.log("One of Licence Plate or Vin or Serial Number is needed");
                        window.alert("Licence Plate, VIN and Serial Number are not present, at least one must be filled");
                        clearAllForException();
                    }
                }
            }


        }


        for (var prop in provider) {

            switch (prop) {
                case "comments":
                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {
                        if (singleTransaction[provider[prop]].length > 1024) {newTranscationObj[prop] = singleTransaction[provider[prop]].substring(0, 1024);}
                        newTranscationObj[prop] = singleTransaction[provider[prop]];
                    }
                    break;
                case "description":
                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {
                        if (singleTransaction[provider[prop]].length > 255) {newTranscationObj[prop] = singleTransaction[provider[prop]].substring(0, 255);}
                        newTranscationObj[prop] = singleTransaction[provider[prop]];
                    }
                    break;
                case "driverName":
                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {
                        if (singleTransaction[provider[prop]].length > 255) {newTranscationObj[prop] = singleTransaction[provider[prop]].substring(0, 255);}
                        newTranscationObj[prop] = singleTransaction[provider[prop]];
                    }
                    break;
                case "externalReference":
                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {
                        if (singleTransaction[provider[prop]].length > 255) {newTranscationObj[prop] = singleTransaction[provider[prop]].substring(0, 255);}
                        newTranscationObj[prop] = singleTransaction[provider[prop]];
                    }
                    break;
                case "licencePlate":

                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {

                        if (singleTransaction[provider[prop]].length > 255) {singleTransaction[provider[prop]].substring(0, 255);}
                        newTranscationObj[prop] = singleTransaction[provider[prop]].toUpperCase().replace(/\s/g, '');
                    }

                    break;
                case "serialNumber":

                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {
                        newTranscationObj[prop] = singleTransaction[provider[prop]].toUpperCase().replace(/\s/g, '');

                    }

                    break;

                case "siteName":
                    if (provider[prop] != "") {
                        if (typeof (provider[prop]) === "object") {
                            for (var inner in provider[prop]) {
                                if (singleTransaction[provider[prop][inner]] != "" && singleTransaction[provider[prop][inner]] != undefined) {newTranscationObj[prop] += singleTransaction[provider[prop][inner]] + " ";}
                            }
                            newTranscationObj[prop] = newTranscationObj[prop].slice(0, -1);
                            /*
                             //call the function to get the coordinates
                             locationCoordinatesProvider =await getCoordFromAddressProvider(newTranscationObj[prop]);
                             console.log("3:locationCoordinatesProvider ",locationCoordinatesProvider);  
                             console.log(locationCoordinatesProvider);
                             //newTranscationObj["location"]["x"]= locationCoordinatesProvider[0]["x"];
                             //newTranscationObj["location"]["y"]= locationCoordinatesProvider[0]["y"];
                             console.log(newTranscationObj);
                             //put locationCoordinatesProvider into location
                            */

                        }
                        else {newTranscationObj[prop] = singleTransaction[provider[prop]];}
                    }

                    break;


                case "vehicleIdentificationNumber":

                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {
                        newTranscationObj[prop] = singleTransaction[provider[prop]].toUpperCase().replace(/\s/g, '');
                    }
                    break;

                case "cost":
                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {

                        newTranscationObj[prop] = parseFloat(singleTransaction[provider[prop]].replace(/,/g, '.'));

                    }


                    break;
                case "currencyCode":

                    // check if currency is defined in the template, if not check in column mapping
                    if (currencyCodeMapped != "" && currencyCodeMapped != undefined) {
                        currencyCodeMapped = currencyCodeMapped.trim().toUpperCase();
                        currencyCodeMapped = currencyCodeMapped.replace(/[^a-zA-Z]/g, '');
                        if (!cc.codes().includes(currencyCodeMapped.toUpperCase())) {
                            window.alert("Invalid format for currency: " + currencyCodeMapped + "\n" + " Please follow ISO 4217 3-letter standard for representing currency. Eg: USD");
                            clearAllForException();
                        }
                        else {
                            newTranscationObj[prop] = currencyCodeMapped;
                        }
                    }
                    else {

                        if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {
                            currencyCodeMapped = singleTransaction[provider[prop]].trim().toUpperCase();
                            currencyCodeMapped = currencyCodeMapped.replace(/[^a-zA-Z]/g, '');

                            if (!cc.codes().includes(currencyCodeMapped.toUpperCase())) {
                                window.alert("Invalid format for currency: " + currencyCodeMapped + "\n" + " Please follow ISO 4217 3-letter standard for representing currency. Eg: USD");
                                clearAllForException();
                            }
                            else {
                                newTranscationObj[prop] = currencyCodeMapped;
                            }
                        }
                        else {
                            if (singleTransaction[provider[prop]] != "") {newTranscationObj[prop] = null;}
                        }

                    }




                    break;

                case "dateTime":


                    dateHoursComposed = dateFormat;
                    if (provider[prop] != "") {
                        isCellDateType = isCellDateType.toUpperCase();
                        if (isCellDateType != "Y" && isCellDateType != "N") {
                            console.log("isCellDateType is the cell type in the xlsx, can be Y or N, please check the JSON mapping file");
                            window.alert("isCellDateType is the cell type in the xlsx, can be Y or N, please check the JSON mapping file");
                            clearAllForException();
                        }



                        //check if is an obj, if so means that date is composed by 2 cells
                        if (typeof (provider[prop]) === "object" && provider[prop].length > 1) {

                            if (singleTransaction[provider[prop][0]] != "" && singleTransaction[provider[prop][0]] != undefined && singleTransaction[provider[prop][1]] != undefined && singleTransaction[provider[prop][1]] != undefined) {


                                if (isCellDateType == "Y") {dateHoursComposed = "MM/DD/YYYY" + " " + hourFormat;}
                                else {dateHoursComposed = dateFormat + " " + hourFormat;}


                                //remove the spaces before and after
                                singleTransaction[provider[prop][0]] = singleTransaction[provider[prop][0]].trim();
                                singleTransaction[provider[prop][1]] = singleTransaction[provider[prop][1]].trim();
                                singleTransaction[provider[prop][0]] = singleTransaction[provider[prop][0]].slice(0, 10);

                                if(singleTransaction[provider[prop][1]].length >= hourFormat.length)
                                {
                                    console.log("Split", singleTransaction[provider[prop][1]].slice(0, hourFormat.length));
                                    singleTransaction[provider[prop][1]] = singleTransaction[provider[prop][1]].slice(0,hourFormat.length);
                                    console.log("Split", singleTransaction[provider[prop][1]].slice(0, hourFormat.length));

                                }
                                newTranscationObj[prop] = getDateValueProvider(singleTransaction[provider[prop][0]] + " " + singleTransaction[provider[prop][1]]);
                            }
                            else {
                                console.log("Date Fields are empty or invalid");
                                window.alert("Date Fields are empty or invalid");
                                clearAllForException();

                            }


                        }
                        else {

                            if (isCellDateType == "Y") {dateHoursComposed = "MM/DD/YYYY HH:mm:ss";}
                            else {dateHoursComposed = dateFormat;}

                            newTranscationObj[prop] = getDateValueProvider(singleTransaction[provider[prop]]);
                        }



                    }




                    break;



                case "odometer":
                    var tmp;
                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {
                        tmp = singleTransaction[provider[prop]].replace(/,/g, '.');
                        newTranscationObj[prop] = parseFloat(tmp).toFixed(1);
                        unitOdoKm = unitOdoKm.toUpperCase();
                        if (unitOdoKm != "Y" && unitOdoKm != "N") {
                            console.log("Units of Odometer field mapping in Json file must be 1 characters either Y or N");
                            window.alert("Units of Odometer field mapping in Json file must be 1 characters either Y or N");
                            clearAllForException();
                        }
                        else if (unitOdoKm != "Y") {
                            tmp = milesToKm(singleTransaction[provider[prop]]);
                            newTranscationObj[prop] = parseFloat(tmp).toFixed(1);
                        }
                    }
                    break;

                case "productType":

                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {
                        newTranscationObj[prop] = getProductType(singleTransaction[provider[prop]]);
                    }
                    break;
                case "volume":
                    var tmp;
                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {
                        tmp = singleTransaction[provider[prop]].replace(/,/g, '.');
                        newTranscationObj[prop] = parseFloat(tmp).toFixed(1);
                        unitVolumeLiters = unitVolumeLiters.toUpperCase();
                        if (unitVolumeLiters != "Y" && unitVolumeLiters != "N") {
                            console.log("Units of Fuel Volume field mapping in Json file must be 1 characters either Y or N");
                            window.alert("Units of Fuel Volume field mapping in Json file must be 1 characters either Y or N");
                            clearAllForException();
                        }
                        else if (unitVolumeLiters != "Y") {
                            tmp = gallonsToLitres(singleTransaction[provider[prop]]);
                            newTranscationObj[prop] = parseFloat(tmp).toFixed(1);
                        }
                    }
                    break;

                default:
                    if (singleTransaction[provider[prop]] != undefined && singleTransaction[provider[prop]] != "") {newTranscationObj[prop] = singleTransaction[provider[prop]];}
                    break;
            }
        }

        return newTranscationObj;
    }



    var getDateValueProvider = function (date) {

        var dateFormatted;

        var dateFormats = {

            //YYYY 0 to 39
            "id0": "YYYY-MM-DD",
            "id1": "YYYY-MM-DDTHH:mm:ss",
            "id2": "YYYY-MM-DDTh:m:s",
            "id3": "YYYY-MM-DD HH:mm",
            "id4": "YYYY-MM-DD HH:mm:ss",
            "id5": "YYYY-MM-DD h:m:s",
            "id6": "YYYY-MM-DDTHH:mm:ssZ",
            "id7": "YYYY-MM-DDTh:m:sZ",
            "id8": "YYYY-MM-DD HHmm",
            "id9": "YYYY-MM-DD HHmmss",
            "id10": "YYYY-MM-DDTHH:mm:ss.SSSZ",
            "id11": "YYYY-MM-DD HH.mm",
            "id12": "YYYY-MM-DD HH.mm:ss",
            "id13": "YYYY-MM-DD h.m.s",
            "id14": "YY-MM-DD",
            "id15": "YY-MM-DDTHH:mm:ss",
            "id16": "YY-MM-DDTh:m:s",
            "id17": "YY-MM-DD HH:mm",
            "id18": "YY-MM-DD HH:mm:ss",
            "id19": "YY-MM-DD h:m:s",
            "id20": "YY-MM-DDTHH:mm:ssZ",
            "id21": "YY-MM-DDTh:m:sZ",
            "id22": "YY-MM-DD HHmm",
            "id23": "YY-MM-DD HHmmss",
            "id24": "YY-MM-DDTHH:mm:ss.SSSZ",
            "id25": "YY-MM-DD HH.mm",
            "id26": "YY-MM-DD HH.mm:ss",
            "id27": "YY-MM-DD h.m.s",
            "id28": "YY-MM-DD H.mm",
            "id29": "YY-MM-DD H.m",

            //40 to 79
            "id40": "YYYY/MM/DD",
            "id41": "YYYY/MM/DDTHH:mm:ss",
            "id42": "YYYY/MM/DDTh:m:s",
            "id43": "YYYY/MM/DD HH:mm",
            "id44": "YYYY/MM/DD HH:mm:ss",
            "id45": "YYYY/MM/DD h:m:s",
            "id46": "YYYY/MM/DDTHH:mm:ssZ",
            "id47": "YYYY/MM/DDTh:m:sZ",
            "id48": "YYYY/MM/DD HHmm",
            "id49": "YYYY/MM/DD HHmmss",
            "id50": "YYYY/MM/DDTHH:mm:ss.SSSZ",
            "id51": "YYYY/MM/DD HH.mm",
            "id52": "YYYY/MM/DD HH.mm:ss",
            "id53": "YYYY/MM/DD h.m.s",
            "id54": "YY/MM/DD",
            "id55": "YY/MM/DDTHH:mm:ss",
            "id56": "YY/MM/DDTh:m:s",
            "id57": "YY/MM/DD HH:mm",
            "id58": "YY/MM/DD HH:mm:ss",
            "id59": "YY/MM/DD h:m:s",
            "id60": "YY/MM/DDTHH:mm:ssZ",
            "id61": "YY/MM/DDTh:m:sZ",
            "id62": "YY/MM/DD HHmm",
            "id63": "YY/MM/DD HHmmss",
            "id64": "YY/MM/DDTHH:mm:ss.SSSZ",
            "id65": "YY/MM/DD HH.mm",
            "id66": "YY/MM/DD HH.mm:ss",
            "id67": "YY/MM/DD h.m.s",
            "id68": "YY/MM/DD H.mm",
            "id69": "YY/MM/DD H.m",

            //80 to 119
            "id80": "YYYYMMDD",
            "id81": "YYYYMMDDTHH:mm:ss",
            "id82": "YYYYMMDDTh:m:s",
            "id83": "YYYYMMDD HH:mm",
            "id84": "YYYYMMDD HH:mm:ss",
            "id85": "YYYYMMDD h:m:s",
            "id86": "YYYYMMDDTHH:mm:ssZ",
            "id87": "YYYYMMDDTh:m:sZ",
            "id88": "YYYYMMDD HHmm",
            "id89": "YYYYMMDD HHmmss",
            "id90": "YYYYMMDDTHH:mm:ss.SSSZ",
            "id91": "YYYYMMDD HH.mm",
            "id92": "YYYYMMDD HH.mm.ss",
            "id93": "YYYYMMDD h.m.s",
            "id94": "YYMMDD",
            "id95": "YYMMDDTHH:mm:ss",
            "id96": "YYMMDDTh:m:s",
            "id97": "YYMMDD HH:mm",
            "id98": "YYMMDD HH:mm:ss",
            "id99": "YYMMDD h:m:s",
            "id100": "YYMMDDTHH:mm:ssZ",
            "id101": "YYMMDDTh:m:sZ",
            "id102": "YYMMDD HHmm",
            "id103": "YYMMDD HHmmss",
            "id104": "YYMMDDTHH:mm:ss.SSSZ",
            "id105": "YYMMDD HH.mm",
            "id106": "YYMMDD HH.mm.ss",
            "id107": "YYMMDD h.m.s",
            "id108": "YYMMDD H.mm",
            "id109": "YYMMDD H.m",

            //MM from 120 to 159

            "id120": "MM-DD-YYYY",
            "id121": "MM-DD-YYYYTHH:mm:ss",
            "id122": "MM-DD-YYYYTh:m:s",
            "id123": "MM-DD-YYYY HH:mm",
            "id124": "MM-DD-YYYY HH:mm:ss",
            "id125": "MM-DD-YYYY h:m:s",
            "id126": "MM-DD-YYYYTHH:mm:ssZ",
            "id127": "MM-DD-YYYYTh:m:sZ",
            "id128": "MM-DD-YYYY HHmm",
            "id129": "MM-DD-YYYY HHmmss",
            "id130": "MM-DD-YYYYTHH:mm:ss.SSSZ",
            "id131": "MM-DD-YYYY HH.mm",
            "id132": "MM-DD-YYYY HH.mm.ss",
            "id133": "MM-DD-YYYY h.m.s",
            "id134": "MM-DD-YY",
            "id135": "MM-DD-YYTHH:mm:ss",
            "id136": "MM-DD-YYTh:m:s",
            "id137": "MM-DD-YY HH:mm",
            "id138": "MM-DD-YY HH:mm:ss",
            "id139": "MM-DD-YY h:m:s",
            "id140": "MM-DD-YYTHH:mm:ssZ",
            "id141": "MM-DD-YYTh:m:sZ",
            "id142": "MM-DD-YY HHmm",
            "id143": "MM-DD-YY HHmmss",
            "id144": "MM-DD-YYTHH:mm:ss.SSSZ",
            "id145": "MM-DD-YY HH.mm",
            "id146": "MM-DD-YY HH.mm.ss",
            "id147": "MM-DD-YY h.m.s",
            "id148": "MM-DD-YY H.mm",
            "id149": "MM-DD-YY H.m",

            //MM from 160 to 199
            "id160": "MM/DD/YYYY",
            "id161": "MM/DD/YYYYTHH:mm:ss",
            "id162": "MM/DD/YYYYTh:m:s",
            "id163": "MM/DD/YYYY HH:mm",
            "id164": "MM/DD/YYYY HH:mm:ss",
            "id165": "MM/DD/YYYY h:m:s",
            "id166": "MM/DD/YYYYTHH:mm:ssZ",
            "id167": "MM/DD/YYYYTh:m:sZ",
            "id168": "MM/DD/YYYY HHmm",
            "id169": "MM/DD/YYYY HHmmss",
            "id170": "MM/DD/YYYYTHH:mm:ss.SSSZ",
            "id171": "MM/DD/YYYY HH.mm",
            "id172": "MM/DD/YYYY HH.mm.ss",
            "id173": "MM/DD/YYYY h.m.s",
            "id174": "MM/DD/YY",
            "id175": "MM/DD/YYTHH:mm:ss",
            "id176": "MM/DD/YYTh:m:s",
            "id177": "MM/DD/YY HH:mm",
            "id178": "MM/DD/YY HH:mm:ss",
            "id179": "MM/DD/YY h:m:s",
            "id180": "MM/DD/YYTHH:mm:ssZ",
            "id181": "MM/DD/YYTh:m:sZ",
            "id182": "MM/DD/YY HHmm",
            "id183": "MM/DD/YY HHmmss",
            "id184": "MM/DD/YYTHH:mm:ss.SSSZ",
            "id185": "MM/DD/YY HH.mm",
            "id186": "MM/DD/YY HH.mm.ss",
            "id187": "MM/DD/YY h.m.s",
            "id188": "MM/DD/YY H.mm",
            "id189": "MM/DD/YY H.m",

            //MM from 200 to 239
            "id200": "MMDDYYYY",
            "id201": "MMDDYYYYTHH:mm:ss",
            "id202": "MMDDYYYYTh:m:s",
            "id203": "MMDDYYYY HH:mm",
            "id204": "MMDDYYYY HH:mm:ss",
            "id205": "MMDDYYYY h:m:s",
            "id206": "MMDDYYYYTHH:mm:ssZ",
            "id207": "MMDDYYYYTh:m:sZ",
            "id208": "MMDDYYYY HHmm",
            "id209": "MMDDYYYY HHmmss",
            "id210": "MMDDYYYYTHH:mm:ss.SSSZ",
            "id211": "MMDDYYYY HH.mm",
            "id212": "MMDDYYYY HH.mm.ss",
            "id213": "MMDDYYYY h.m.s",
            "id214": "MMDDYY",
            "id215": "MMDDYYTHH:mm:ss",
            "id216": "MMDDYYTh:m:s",
            "id217": "MMDDYY HH:mm",
            "id218": "MMDDYY HH:mm:ss",
            "id219": "MMDDYY h:m:s",
            "id220": "MMDDYYTHH:mm:ssZ",
            "id221": "MMDDYYTh:m:sZ",
            "id222": "MMDDYY HHmm",
            "id223": "MMDDYY HHmmss",
            "id224": "MMDDYYTHH:mm:ss.SSSZ",
            "id225": "MMDDYY HH.mm",
            "id226": "MMDDYY HH.mm.ss",
            "id227": "MMDDYY h.m.s",
            "id228": "MMDDYY H.mm",
            "id229": "MMDDYY H.m",

            //DD  from 240 to 279      

            "id240": "DD-MM-YYYY",
            "id241": "DD-MM-YYYYTHH:mm:ss",
            "id242": "DD-MM-YYYYTh:m:s",
            "id243": "DD-MM-YYYY HH:mm",
            "id244": "DD-MM-YYYY HH:mm:ss",
            "id245": "DD-MM-YYYY h:m:s",
            "id246": "DD-MM-YYYYTHH:mm:ssZ",
            "id247": "DD-MM-YYYYTh:m:sZ",
            "id248": "DD-MM-YYYY HHmm",
            "id249": "DD-MM-YYYY HHmmss",
            "id250": "DD-MM-YYYYTHH:mm:ss.SSSZ",
            "id251": "DD-MM-YYYY HH.mm",
            "id252": "DD-MM-YYYY HH.mm.ss",
            "id253": "DD-MM-YYYY h.m.s",
            "id254": "DD-MM-YY",
            "id255": "DD-MM-YYTHH:mm:ss",
            "id256": "DD-MM-YYTh:m:s",
            "id257": "DD-MM-YY HH:mm",
            "id258": "DD-MM-YY HH:mm:ss",
            "id259": "DD-MM-YY h:m:s",
            "id260": "DD-MM-YYTHH:mm:ssZ",
            "id261": "DD-MM-YYTh:m:sZ",
            "id262": "DD-MM-YY HHmm",
            "id263": "DD-MM-YY HHmmss",
            "id264": "DD-MM-YYTHH:mm:ss.SSSZ",
            "id265": "DD-MM-YY HH.mm",
            "id266": "DD-MM-YY HH.mm.ss",
            "id267": "DD-MM-YY h.m.s",
            "id268": "DD-MM-YY H.mm",
            "id269": "DD-MM-YY H.m",

            // from 280 to 319 

            "id280": "DD/MM/YYYY",
            "id281": "DD/MM/YYYYTHH:mm:ss",
            "id282": "DD/MM/YYYYTh:m:s",
            "id283": "DD/MM/YYYY HH:mm",
            "id284": "DD/MM/YYYY HH:mm:ss",
            "id285": "DD/MM/YYYY h:m:s",
            "id286": "DD/MM/YYYYTHH:mm:ssZ",
            "id287": "DD/MM/YYYYTh:m:sZ",
            "id288": "DD/MM/YYYY HHmm",
            "id289": "DD/MM/YYYY HHmmss",
            "id290": "DD/MM/YYYYTHH:mm:ss.SSSZ",
            "id291": "DD/MM/YYYY HH.mm",
            "id192": "DD/MM/YYYY HH.mm.ss",
            "id193": "DD/MM/YYYY h.m.s",
            "id294": "DD/MM/YY",
            "id295": "DD/MM/YYTHH:mm:ss",
            "id296": "DD/MM/YYTh:m:s",
            "id297": "DD/MM/YY HH:mm",
            "id298": "DD/MM/YY HH:mm:ss",
            "id299": "DD/MM/YY h:m:s",
            "id300": "DD/MM/YYTHH:mm:ssZ",
            "id301": "DD/MM/YYTh:m:sZ",
            "id302": "DD/MM/YY HHmm",
            "id303": "DD/MM/YY HHmmss",
            "id304": "DD/MM/YYTHH:mm:ss.SSSZ",
            "id305": "DD/MM/YY HH.mm",
            "id306": "DD/MM/YY HH.mm.ss",
            "id307": "DD/MM/YY h.m.s",
            "id308": "DD/MM/YY H.mm",
            "id309": "DD/MM/YY H.m",

            // from 320 to 359

            "id320": "DDMMYYYY",
            "id321": "DDMMYYYYTHH:mm:ss",
            "id322": "DDMMYYYYTh:m:s",
            "id323": "DDMMYYYY HH:mm",
            "id324": "DDMMYYYY HH:mm:ss",
            "id325": "DDMMYYYY h:m:s",
            "id326": "DDMMYYYYTHH:mm:ssZ",
            "id327": "DDMMYYYYTh:m:sZ",
            "id328": "DDMMYYYY HHmm",
            "id329": "DDMMYYYY HHmmss",
            "id330": "DDMMYYYYTHH:mm:ss.SSSZ",
            "id331": "DDMMYYYY HH.mm",
            "id332": "DDMMYYYY HH.mm.ss",
            "id333": "DDMMYYYY h.m.s",
            "id334": "DDMMYY",
            "id335": "DDMMYYTHH:mm:ss",
            "id336": "DDMMYYTh:m:s",
            "id337": "DDMMYY HH:mm",
            "id338": "DDMMYY HH:mm:ss",
            "id339": "DDMMYY h:m:s",
            "id340": "DDMMYYTHH:mm:ssZ",
            "id341": "DDMMYYTh:m:sZ",
            "id342": "DDMMYY HHmm",
            "id343": "DDMMYY HHmmss",
            "id344": "DDMMYYTHH:mm:ss.SSSZ",
            "id345": "DDMMYY HH.mm",
            "id346": "DDMMYY HH.mm.ss",
            "id347": "DDMMYY h.m.s",
            "id348": "DDMMYY H.mm",
            "id349": "DDMMYY H.m",

        };
        function getFormat(dateInput) {

            for (var prop in dateFormats) {
                if (dateFormats[prop] == dateHoursComposed) {
                    console.log("Date Input: ", dateInput);
                    console.log("dateHours Composed: ", dateHoursComposed);

                    if (moment(dateInput, dateHoursComposed, true).isValid()) {
                        return dateFormats[prop];
                    }
                    else {
                        console.log("Mapping allowed but date in file transaction not correspoding");
                        console.log(dateFormats[prop]);
                        window.alert("Mapping allowed but date in file transaction not correspoding");
                        clearAllForException();
                    }
                }
            }
            return null;
        }

        var formatFound = getFormat(date);

        if (formatFound !== null) {

            var offsetInNumber;
            var guessed;

            console.log("Offest from OS: ", moment(new Date()).utcOffset());
            console.log("offest calc from picker: ", timezoneFromPicker);

            guessed = moment.tz.guess();


            if (elTimezoneCheckbox.checked) {offsetInNumber = moment().tz(timezoneFromPicker).utcOffset();}
            else {offsetInNumber = moment().tz(guessed).utcOffset();}

            console.log("offset In Number taken from picker: ", offsetInNumber);
            console.log("Date not formatted: ", date);
            dateFormatted = moment.utc(date, formatFound, true).utcOffset(offsetInNumber, true).format();

            console.log("dateFormatted: ", dateFormatted);


        }
        else {
            console.log("Date Format in mapping file not allowed or missing");
            console.log("Date: ", date);
            window.alert("Date Format in mapping file not allowed or missing");
            clearAllForException();
        }
        return dateFormatted;
    };


    var clearAllForException = function () {
        clearFiles();
        clearFilesJson();
        clearTransactions();
        clearTransactionsProvider();
        toggleAlert();
        elTransactionContainerProvider.style.display = 'none';
        elFileJsonSelectContainer.style.display = 'block';
        elFileSelectContainer.style.display = 'none';
        elFileSelectContainerProvider.style.display = 'none';
        elJsonDropDownMenu.style.display = "none";
        throw new Error('Execution aborted');
    };

    var gallonsToLitres = function (gallons) {
        return gallons * 3.785;
    };

    var milesToKm = function (miles) {
        return miles / 0.62137;
    };

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

    var toggleJsonDropDownMenu = function () {
        var itemIndexSelected = elJsonDropDownMenu.selectedIndex;
        var itemValueSelected = elJsonDropDownMenu.options[elJsonDropDownMenu.selectedIndex].value;
        var lengthDropDownMenu = elJsonDropDownMenu.length;
        if (itemIndexSelected != "0") {
            //container that show the File selection
            clearFilesProvider();
            elFileSelectContainerProvider.style.display = 'block';

            setSelectedIndexTimezonePicker();

            toggleTimeZonePicker(false);


        }
        else {

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
        if (upload) {
            // Make sure a file was selected
            if (upload.files.length > 0) {
                var reader = new FileReader(); // File reader to read the file 
                // This event listener will happen when the reader has read the file 
                reader.addEventListener('load', function () {
                    if (validateIfJsonFIle(reader.result)) {
                        result = JSON.parse(reader.result); // Parse the result into an object
                        objProviderTemplate = result;

                        ok = true;

                    }
                    else {
                        alert('Please select JSON files only!');
                        ok = false;
                        clearFilesJson();
                    }

                });

                reader.readAsText(upload.files[0]); // Read the uploaded file
                //when the load is ended, I check if file uploaded was Json file and flagged as true
                // I build the dropdown menu 
                reader.addEventListener('loadend', function () {
                    if (ok) {

                        elJsonDropDownMenu.length = 0;
                        elJsonDropDownMenu.style.display = "block";

                        let defaultOption = document.createElement('option');
                        defaultOption.text = 'Choose Provider';

                        elJsonDropDownMenu.appendChild(defaultOption);
                        elJsonDropDownMenu.selectedIndex = 0;

                        let option;
                        for (let i = 0; i < result.providers.length; i++) {
                            option = document.createElement('option');
                            option.text = result.providers[i].Name;
                            elJsonDropDownMenu.appendChild(option);



                        }
                    }
                });
            }
        }
    };

    var validateIfJsonFIle = function (fileJsonToCheck) {
        try {
            JSON.parse(fileJsonToCheck);
        }
        catch (err) {
            console.log(err);
            return false;

        }
        return true;
    };

    var showSelectorSection = function () {

        for (var i = 0; i < elSelector.length; i++) {
            if (elSelector[i].checked) {
                switch (elSelector[i].id) {
                    case "providerSelector":
                        clearFiles();
                        clearFilesJson();
                        clearTransactions();
                        clearTransactionsProvider();
                        elTransactionContainerProvider.style.display = 'none';

                        elFileJsonSelectContainer.style.display = 'block';
                        elFileSelectContainer.style.display = 'none';
                        elFileSelectContainerProvider.style.display = 'none';
                        elJsonDropDownMenu.style.display = "none";

                        break;

                    default:
                        clearFiles();
                        clearFilesJson();
                        clearTransactions();
                        clearTransactionsProvider();
                        elFileJsonSelectContainer.style.display = 'none';
                        elFileSelectContainer.style.display = 'block';
                        elFileSelectContainerProvider.style.display = 'none';
                        elTransactionContainerProvider.style.display = 'none';
                }
            }
        }
    };

    var addBlanckColumn = function (transactionsToBeChecked) {
        for (var i = 0; i < transactionsToBeChecked.data.length; i++) {
            // get Headers object as master to compare, because header cannot 
            // be empty
            var keysHeader = Object.keys(transactionsToBeChecked.data[0]);
            var keysTempTransaction = Object.keys(transactionsToBeChecked.data[i]);

            var z = 0;
            var tempVar = z;
            for (z; z < keysHeader.length; z++) {
                //compare the column header with the transaction column
                //if not match I add column with key equal to Header name
                // and value=null
                if (keysHeader[z] != keysTempTransaction[tempVar]) {
                    transactionsToBeChecked.data[i][keysHeader[z]] = "";
                    keysTempTransaction = Object.keys(transactionsToBeChecked.data[i]);
                }
                else {tempVar++;}
            }
        }
        return transactionsToBeChecked;
    };

    var uploadFileProvider = function (e) {
        //get browser timezone and set the global variale
        getTimezonePicker();

        e.preventDefault();
        if (elFileProvider.files[0].name.split('.').pop() != "xlsx") {
            alert('Please select xlsx files only!');
            clearAllForException();
        }


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
                xhr.addEventListener('load', uploadCompleteProviderAsync, false);
                xhr.addEventListener('error', uploadFailed, false);
                xhr.addEventListener('abort', uploadFailed, false);

                if (getUrl() == 'http://localhost/apiv1') {
                    xhr.open('POST', 'https://proxy.geotab.com/apiv1');
                }
                else {
                    xhr.open('POST', getUrl());
                }


                xhr.send(fd);

                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {

                        var data = JSON.parse(xhr.responseText);

                        if (data['error']['message'] = "Incorrect login credentials") {
                            console.log(data['error']['message']);
                            window.alert("Incorrect Login Credentials");
                            xhr.abort();
                            toggleAlert(elAlertError, 'There was an error attempting to upload the file.');
                            clearAllForException();
                        }

                        if (data['error']['message'] = "data['error']['message']"){;}
                        {
                            console.log(data['error']['message']);
                            alert("Error importing transaction file" + "\n" + "Please check your xlsx file");
                            clearAllForException();
                        }

                    }
                };



            } else {
                iframeUpload(elForm, getUrl(), parameters);
            }
            database = credentials.database;
            toggleParse(false);
        });
    };



    //function return the provider selected 
    var getTemplateProviderNameFromSelection = function () {
        if (elJsonDropDownMenu.selectedIndex != 0) {
            return elJsonDropDownMenu.options[elJsonDropDownMenu.selectedIndex].value;
        }
        else {
            console.log("json dropdown menu error, provider not selected");
        }

    };

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

    async function uploadCompleteProviderAsync(e) {

        var results;
        var headingsExtracted;
        // retrieve the name of the provider selected
        var providerSelected = getTemplateProviderNameFromSelection();
        // retrieve the keys of the provider selected from the full template ojbect
        var extractedProviderTemplate = objProviderTemplate.providers.filter((provider) => provider.Name === providerSelected);

        unitVolumeLiters = extractedProviderTemplate[0]["unitVolumeLiters"];
        unitOdoKm = extractedProviderTemplate[0]["unitOdoKm"];
        dateFormat = extractedProviderTemplate[0]["dateFormat"];
        hourFormat = extractedProviderTemplate[0]["timeFormat"];
        currencyCodeMapped = extractedProviderTemplate[0]["currencyCodeMapped"];
        isCellDateType = extractedProviderTemplate[0]["isCellDateType"];


        results = addBlanckColumn(resultsParser(e));
        if (results.error) {
            toggleAlert(elAlertError, results.error.message);
            return;
        }
        else if (results.data.length == 1) {
            window.alert("The file doesn't contain any transactions");
            clearAllForException();
        }
        //remove the heading from transaction
        headingsExtracted = getHeadings(results.data);
        transactions = await parsingTransactionWithProviderAsync(results.data, extractedProviderTemplate);



        clearFilesJson();
        clearFilesProvider();

        if (transactions === null) {
            toggleAlert(elAlertError, 'Can not determine file provider type, try converting to MyGeotab file type');
            return;
        }
        if (!transactions.length) {
            toggleAlert(elAlertError, 'No transactions found in file');
            clearTransactionsProvider();
            return;
        }

        toggleImportProvider(true);
        renderTransactionsProvider(transactions);
        toggleAlert();;
    };



    var getTimezonePicker = function getTimezonePicker() {
        timezoneFromPicker = elTimezonePicker.value;
        console.log("Offset of value selected ", timezoneFromPicker, " ", moment().tz(timezoneFromPicker).utcOffset());

    };

    var setSelectedIndexTimezonePicker = function setSelectedIndexTimezonePicker() {

        var DetectedTimeZoneCountry = moment.tz.guess();
        console.log("Detected Time Zone Country: ", DetectedTimeZoneCountry);

        for (var x = 0; x < elTimezonePicker.length; x++) {
            if (elTimezonePicker.options[x].value == DetectedTimeZoneCountry) {
                elTimezonePicker.options[x].selected = true;
            }
        }

    };

    var toggleTimeZonePicker = function (toggle) {
        if (toggle) {


            //make visible the timezone dropdown
            elTimezonePicker.removeAttribute('disabled');

        } else {
            //hide the button of the provider xls section 

            elTimezonePicker.setAttribute('disabled', 'disabled');
        }
    };


    var timezoneCheckbox = function () {

        if (elTimezoneCheckbox.checked) {toggleTimeZonePicker(true);}
        else {toggleTimeZonePicker(false);}
    };
    /*
        async function  getCoordFromAddressProvider (location) {
    
            api.call("GetCoordinates", {
                addresses: [location]
            }, (result) => {
                return result;  
                console.log(": 1",locationCoordinatesProvider); 
                  
            }, (e) => {
                console.error("Failed:", e);
            });
    
            //return result;  
        };
    */


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

            elContainer = document.getElementById('importFuelTransactions_fp');
            elFiles = document.getElementById('files');
            elParseButton = document.getElementById('parseButton');
            elImportButton = document.getElementById('importButton');
            elImportButtonProvider = document.getElementById('importButtonProvider');
            elCancelButton = document.getElementById('cancelButton');
            elCancelButtonProvider = document.getElementById('cancelButtonProvider');
            elFleet = document.getElementById('fleet');
            elExampleButton = document.getElementById('exampleButton');
            elFileName = document.getElementById('fileName');
            elTransactionList = document.getElementById('transactionList');
            elTransactionListProvider = document.getElementById('transactionListProvider');
            elTransactionContainer = document.getElementById('transactionContainer');
            elTransactionContainerProvider = document.getElementById('transactionContainerProvider');
            elFileSelectContainer = document.getElementById('fileSelectContainer');
            elAlertInfo = document.getElementById('alertInfo');
            elAlertSuccess = document.getElementById('alertSuccess');
            elAlertError = document.getElementById('alertError');
            elSample = document.getElementById('sample');
            elForm = document.getElementById('form');
            elListCount = document.getElementById('listCount');
            elListCountProvider = document.getElementById('listCountProvider');

            elFilesJson = document.getElementById('filesJson');

            elParseButtonJson = document.getElementById('importJsonFile');

            elFileJsonSelectContainer = document.getElementById('jsonfileSelectContainer');
            elFileNameJson = document.getElementById('fileNameJson');
            elJsonDropDownMenu = document.getElementById('providerDropMenu');
            elSelector = document.querySelectorAll('input[name="selector"]');

            elFileSelectContainerProvider = document.getElementById('fileSelectContainerProvider');
            elFileProvider = document.getElementById('filesProvider');
            elFileNameProvider = document.getElementById('fileNameProvider');
            elParseButtonProvider = document.getElementById('parseButtonProvider');

            elTimezonePicker = document.getElementById('timezone');
            elTimezoneCheckbox = document.getElementById('checkboxDifferentTimezone');

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
                //elContainer.querySelector('#importFuelTransactions_fp-user').textContent = session.userName;
            });

            elContainer.className = '';

            // show main content
            // events
            elFiles.addEventListener('change', fileSelected, false);
            elParseButton.addEventListener('click', uploadFile, false);
            elImportButton.addEventListener('click', importFile, false);
            elImportButtonProvider.addEventListener('click', importFileProvider, false);
            elFleet.addEventListener('change', renderTransactions, false);
            elExampleButton.addEventListener('change', toggleExample, false);
            elCancelButton.addEventListener('click', clearTransactions, false);
            elCancelButtonProvider.addEventListener('click', clearTransactionsProvider, false);

            elParseButtonJson.addEventListener('click', parseJsonMapping, false);

            elFilesJson.addEventListener('change', fileSelectedJson, false);
            elJsonDropDownMenu.addEventListener('change', toggleJsonDropDownMenu, false);
            elContainer.style.display = 'block';
            for (var i = 0; i < elSelector.length; i++) {
                elSelector[i].addEventListener('change', showSelectorSection, false);
            }

            elFileProvider.addEventListener('change', fileProviderSelected, false);
            elParseButtonProvider.addEventListener('click', uploadFileProvider, false);

            elTimezonePicker.addEventListener('change', getTimezonePicker, false);
            elTimezoneCheckbox.addEventListener('change', timezoneCheckbox, false);



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
            elContainer.className += 'hidden';



            // events
            elFiles.removeEventListener('change', fileSelected, false);
            elParseButton.removeEventListener('click', uploadFile, false);

            elImportButton.removeEventListener('click', importFile, false);
            elImportButtonProvider.removeEventListener('click', importFileProvider, false);
            elFleet.removeEventListener('change', renderTransactions, false);
            elExampleButton.removeEventListener('change', toggleExample, false);
            elCancelButton.removeEventListener('click', clearTransactions, false);
            elCancelButtonProvider.removeEventListener('click', clearTransactionsProvider, false);


            elFilesJson.removeEventListener('change', fileSelectedJson, false);
            elParseButtonJson.removeEventListener('click', parseJsonMapping, false);
            elJsonDropDownMenu.removeEventListener('change', toggleJsonDropDownMenu, false);

            for (var i = 0; i < elSelector.length; i++) {
                elSelector[i].removeEventListener('change', showSelectorSection, false);
            }
            elFileProvider.removeEventListener('change', fileProviderSelected, false);
            elParseButtonProvider.removeEventListener('click', uploadFileProvider, false);

            elTimezonePicker.removeEventListener('change', getTimezonePicker, false);
            elTimezoneCheckbox.removeEventListener('change', timezoneCheckbox, false);


        }
    };
};
