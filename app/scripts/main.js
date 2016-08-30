geotab.addin.importFuelTransactions = function () {
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

    // scoped vars
    var transactions;
    var database;
    var version;
    var ROW_LIMIT = 10;

    // functions
    var toggleParse = function (toggle) {
        if (toggle) {
            elParseButton.removeAttribute('disabled');
            toggleImport(false);
        } else {
            elParseButton.setAttribute('disabled', 'disabled');
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

    var toggleAlert = function (el, content) {
        elAlertSuccess.style.display = 'none';
        elAlertInfo.style.display = 'none';
        elAlertError.style.display = 'none';
        if (el) {
            el.querySelector('span').textContent = content;
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
        elTransactionContainer.style.display = 'none';
        elFileSelectContainer.style.display = 'block';

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
        var getFleets = function (trans) {
            var fleets = {};
            trans.forEach(function (transaction) {
                fleets[transaction.fleet] = transaction.fleet || database;
            });
            return Object.keys(fleets);
        };

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

                fd.append('fileToUpload', elFiles.files[0]);
                fd.append('JSON-RPC', parameters);

                xhr.upload.addEventListener('progress', uploadProgress, false);
                xhr.addEventListener('load', uploadComplete, false);
                xhr.addEventListener('error', uploadFailed, false);
                xhr.addEventListener('abort', uploadFailed, false);
                xhr.open('POST', getUrl());

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

    var toggleExample = function (e) {
        var checked = e.target.checked;
        if (!checked) {
            e.target.parentNode.className = e.target.parentNode.className.replace('active', '');
        } else {
            e.target.parentNode.className += ' active';
        }
        elSample.style.display = checked ? 'block' : 'none';
    };

    return {
        initialize: function (geotabApi, pageState, initializeCallback) {
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

            api.call('GetVersion', {}, (result) => {
                version = result;
                initializeCallback();
            }, (e) => {
                toggleAlert(elAlertError, e.toString());
                initializeCallback();
            });
        },

        focus: function () {
            // events
            elFiles.addEventListener('change', fileSelected, false);
            elParseButton.addEventListener('click', uploadFile, false);
            elImportButton.addEventListener('click', importFile, false);
            elFleet.addEventListener('change', renderTransactions, false);
            elExampleButton.addEventListener('change', toggleExample, false);
            elCancelButton.addEventListener('click', clearTransactions, false);

            elContainer.style.display = 'block';
        },

        blur: function () {
            // events
            elFiles.removeEventListener('change', fileSelected, false);
            elParseButton.removeEventListener('click', uploadFile, false);
            elImportButton.removeEventListener('click', importFile, false);
            elFleet.removeEventListener('change', renderTransactions, false);
            elExampleButton.removeEventListener('change', toggleExample, false);
            elCancelButton.removeEventListener('click', clearTransactions, false);
        }
    };
};
