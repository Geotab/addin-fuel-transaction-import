    const parsers = require('./Parsers');
    const converters = require('./Converters');
    const wexHelper = require('./WexHelper');
    /**
     * Parses the fuel transactions
     * @returns 
     */
     export function FuelTransactionParser(transactions) {
        var regex = new RegExp(' ', 'g');
        var Providers = {
            unknown: 0,
            wex: 2,
            wexCustomer: 3,
            fleetcore: 4,
            geotab: 1000
        };

        /**
         * Provider file parsers, must return a promise resolved with parsed transactions or rejected
         */
        var parsers = {
            wex: function (headings, data) {
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
                                parsers.getStringValue(dataRow.ColumnJ),
                                parsers.getStringValue(dataRow.ColumnI),
                                '',
                                parsers.getStringValue(dataRow.ColumnG),
                                '',
                                parsers.getDateValue(parsers.getStringValue(dataRow.ColumnAK)), // may need convert to UTC date, columAK may not exist
                                converters.gallonsToLitres(parsers.getFloatValue(parsers.getStringValue(dataRow.ColumnN))),
                                converters.milesToKm(parsers.getFloatValue(parsers.getStringValue(dataRow.ColumnAH))),
                                parsers.getFloatValue(parsers.getStringValue(dataRow.ColumnO)),
                                'USD',
                                { x: parsers.getFloatValue(parsers.getStringValue(dataRow.ColumnAM)), y: parsers.getFloatValue(parsers.getStringValue(dataRow.ColumnAL)) },
                                'Wex',
                                (parsers.getStringValue(dataRow.ColumnU) + ' ' + parsers.getStringValue(dataRow.ColumnV) + ' ' + parsers.getStringValue(dataRow.ColumnT)).trim(),
                                JSON.stringify(rawTransaction),
                                getProductType(parsers.getStringValue(dataRow.ColumnQ))
                            );

                            fuelTransaction.fleet = parsers.getStringValue(dataRow.ColumnA);
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
                                parsers.getStringValue(dataRow.ColumnC),
                                '',
                                '',
                                '',
                                getDateValue((parsers.getFloatValue(dataRow.ColumnD) + parsers.getFloatValue(dataRow.ColumnE)).toFixed(15)),
                                gallonsToLitres(parsers.getFloatValue(dataRow.ColumnS)),
                                milesToKm(parsers.getFloatValue(dataRow.ColumnO)),
                                parsers.getFloatValue(dataRow.ColumnAA), // ColumnU: Fuel Cost, ColumnV: Non-Fuel Cost, ColumnW: Gross Cost (Fuel + Non Fuel), ColumnAA: Net Cost (Fuel Cost - Tax Exempt + Trans Fee)
                                'USD',
                                null,
                                'WexCustomer',
                                parsers.getStringValue(dataRow.ColumnL),
                                JSON.stringify(rawTransaction),
                                getProductType(parsers.getStringValue(dataRow.ColumnR))
                            );

                            fuelTransaction.address = parsers.getStringValue(dataRow.ColumnH) + ', ' + parsers.getStringValue(dataRow.ColumnI) + ', ' + parsers.getStringValue(dataRow.ColumnJ) + ', ' + parsers.getStringValue(dataRow.ColumnK);
                            addressesLookup[fuelTransaction.address] = { coordinates: null, timezone: null };

                            fuelTransaction.fleet = parsers.getStringValue(database);
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
                                parsers.getStringValue(dataRow.ColumnA),
                                parsers.getStringValue(dataRow.ColumnB),
                                parsers.getStringValue(dataRow.ColumnC),
                                parsers.getStringValue(dataRow.ColumnD),
                                parsers.getStringValue(dataRow.ColumnE),
                                getDateValue(dataRow.ColumnF),
                                parsers.getFloatValue(dataRow.ColumnG),
                                parsers.getFloatValue(dataRow.ColumnJ),
                                parsers.getFloatValue(dataRow.ColumnH),
                                parsers.getStringValue(dataRow.ColumnI),
                                { x: parsers.getFloatValue(dataRow.ColumnK), y: parsers.getFloatValue(dataRow.ColumnL) }, // x = lon, y = lat
                                'Unknown',
                                parsers.getStringValue(dataRow.ColumnM),
                                JSON.stringify(rawTransaction),
                                getProductType(parsers.getStringValue(dataRow.ColumnN))
                            );

                            fuelTransaction.fleet = parsers.getStringValue(database);
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
            } else if (parsers.getStringValue(headings.ColumnA) === 'Fleet Name' && parsers.getStringValue(headings.ColumnB) === 'ACCOUNT NUMBER 5') {
                return Providers.wex;
            } else if (parsers.getStringValue(headings.ColumnA) === 'Card Number' && parsers.getStringValue(headings.ColumnB) === 'Vehicle Card Department') {
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