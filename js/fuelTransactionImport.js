geotab.addin.addinTemplate = function () {
    "use strict";

    // Geotab Addin variables
    var api,
        state;

    // DOM Elements
    var elContainer;
    var elFiles;
    var elParseButton;
    var elImportButton;
    var elFleet;
    var elExampleButton;
    var elFileName;
    var elTransactionList;
    var elTransactionContainer;
    var elAlertSuccess;
    var elAlertInfo;
    var elAlertError;
    var elSample;
    var elForm;
    var elListCount;

    // scoped vars
    var transactions;
    var database;
    var ROW_LIMIT = 10;

    // functions
    var toggleParse = function (toggle) {
        if (toggle) {
            elParseButton.removeAttribute("disabled");
            toggleImport(false);
        } else {
            elParseButton.setAttribute("disabled", "disabled");
        }
    };

    var toggleImport = function (toggle) {
        if (toggle) {
            elImportButton.removeAttribute("disabled");
        } else {
            elImportButton.setAttribute("disabled", "disabled");
            toggleFleet(false);
            clearFleets();
        }
    };

    var toggleFleet = function (toggle) {
        if (toggle) {
            elFleet.removeAttribute("disabled");
        } else {
            elFleet.setAttribute("disabled", "disabled");
        }
    };

    var toggleBrowse = function (toggle) {
        if (toggle) {
            elFiles.removeAttribute("disabled");
        } else {
            elFiles.setAttribute("disabled", "disabled");
        }
    };

    var toggleAlert = function (el, content) {
        elAlertSuccess.style.display = "none";
        elAlertInfo.style.display = "none";
        elAlertError.style.display = "none";
        if (el) {
            el.querySelector("span").textContent = content;
            el.style.display = "block";
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
            var el = document.createElement("OPTION");
            el.textContent = fleet;
            el.value = fleet;
            elFleet.appendChild(el);
        });
        if (fleets.length > 0) {
            toggleFleet(true);
        }
    };

    var clearTransactionsList = function () {
        elTransactionContainer.style.display = "none";

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
        var createRow = function (row, isHeading) {
            var elRow = document.createElement("TR");
            var createColumn = function (columnName) {
                if (columnName === "sourceData" || columnName === "fleet") {
                    return;
                }
                var elColumn = document.createElement(isHeading ? "TH" : "TD");
                elColumn.textContent = isHeading ? columnName : JSON.stringify(row[columnName]);
                if (!isHeading) {
                    elColumn.setAttribute("data-th", columnName);
                }
                elRow.appendChild(elColumn);
            };

            Object.keys(row).forEach(createColumn);

            return elRow;
        };

        elTransactionContainer.style.display = "none";

        while (elTransactionList.firstChild) {
            elTransactionList.removeChild(elTransactionList.firstChild);
        }

        elBody = document.createElement("TBODY");
        transactions.forEach(function (transaction, i) {
            var elHead;

            if (i === 0) {
                elHead = document.createElement("THEAD");
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
        elListCount.textContent = (ROW_LIMIT === visibleCount ? "top " : "") + visibleCount + "/" + totalRowsCount;
        elTransactionList.appendChild(elBody);
        elTransactionContainer.style.display = "block";
    };

    var clearFiles = function () {
        elFiles.value = null;
        elFileName.value = "";
    };

    var getUrl = function () {
        return window.location.protocol + "//" + window.location.host + "/apiv1";
    };

    var fileSelected = function (e) {
        var file;
        if (e.target.files) {
            file = e.target.files[0];
        } else {
            // ie9
            file = {name: elFiles.value.substring(elFiles.value.lastIndexOf("\\") + 1, elFiles.length)};
        }
        if (file) {
            elFileName.value = file.name;
            toggleParse(true);
            clearTransactionsList();
        }
        toggleAlert();
    };

    // ie9
    var iframeUpload = function (form, action_url, parameters) {
        var eventHandler = function (e) {
            var content;

            e.preventDefault();
            e.stopPropagation();

            elIframe.removeEventListener("load", eventHandler, false);

            // Message from server...
            if (elIframe.contentDocument) {
                content = elIframe.contentDocument.body.innerHTML;
            } else if (elIframe.contentWindow) {
                content = elIframe.contentWindow.document.body.innerHTML;
            } else if (elIframe.document) {
                content = elIframe.document.body.innerHTML;
            }

            // complete
            uploadComplete({target: {responseText: content}});

            // Del the iframe...
            setTimeout(function () {
                elIframe.parentNode.removeChild(elIframe);
            }, 250);
        };

        var hiddenField = form.querySelector("input[type='hidden']");
        hiddenField.value = parameters;

        var elIframe = document.createElement("iframe");

        elIframe.setAttribute("id", "upload_iframe");
        elIframe.setAttribute("name", "upload_iframe");
        elIframe.setAttribute("width", "0");
        elIframe.setAttribute("height", "0");
        elIframe.setAttribute("border", "0");
        elIframe.setAttribute("style", "width: 0; height: 0; border: none;");

        // Add to document...
        form.parentNode.appendChild(elIframe);
        window.frames.upload_iframe.name = "upload_iframe";

        elIframe.addEventListener("load", eventHandler, true);

        // Set properties of form...
        form.setAttribute("target", "upload_iframe");
        form.setAttribute("action", action_url);
        form.setAttribute("method", "post");
        form.setAttribute("enctype", "multipart/form-data");
        form.setAttribute("encoding", "multipart/form-data");

        // Submit the form...
        form.submit();
    };

    var uploadFile = function () {
        toggleAlert(elAlertInfo, "Parsing... transferring file");
        api.getSession(function (credentials) {
            var fd;
            var xhr;
            var parameters = JSON.stringify({
                id: -1,
                method: "ExcelToJson",
                params: {
                    minColumnsAmount: 12,
                    credentials: credentials
                }
            });

            if (window.FormData) {
                fd = new FormData();
                xhr = new XMLHttpRequest();

                fd.append("fileToUpload", elFiles.files[0]);
                fd.append("JSON-RPC", parameters);

                xhr.upload.addEventListener("progress", uploadProgress, false);
                xhr.addEventListener("load", uploadComplete, false);
                xhr.addEventListener("error", uploadFailed, false);
                xhr.addEventListener("abort", uploadFailed, false);
                xhr.open("POST", getUrl());

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
                toggleAlert(elAlertInfo, "Parsing: transferring file " + percentComplete.toString() + "%");
            } else {
                toggleAlert(elAlertInfo, "Parsing: converting csv to fuel transactions");
            }

        }
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
            error = {message: "No data"};
        }
        return {
            error: error,
            data: data
        };
    };

    var uploadComplete = function (e) {
        var results;
        var fuelTransactionParser = new FuelTransactionParser();
        var getFleets = function (transactions) {
            var fleets = {};
            transactions.forEach(function (transaction) {
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

        transactions = fuelTransactionParser.parse(results.data);
        if (transactions === null) {
            toggleAlert(elAlertError, "Can not determine file provider type, try converting to MyGeotab file type");
            return;
        }
        if (!transactions.length) {
            toggleAlert(elAlertError, "No transactions found in file");
            return;
        }

        setFleetSelection(getFleets(transactions));
        toggleImport(true);
        renderTransactions(transactions);
        toggleAlert();
    };

    var uploadFailed = function (e) {
        toggleAlert(elAlertError, "There was an error attempting to upload the file.");
    };

    var FuelTransaction = function (vin, description, serialNumber, licencePlate, comments, dateTime, volume, odometer, cost, currencyCode, location, provider, driverName, sourceData) {
        var self = {
            vehicleIdentificationNumber: vin || "",
            description: description || "",
            serialNumber: serialNumber || "",
            licencePlate: licencePlate || "",
            comments: comments || "",
            dateTime: dateTime,
            volume: volume,
            odometer: odometer,
            cost: cost,
            currencyCode: currencyCode,
            location: location,
            provider: provider,
            driverName: driverName,
            sourceData: sourceData
        };
        return self;
    };

    var FuelTransactionParser = function () {
        var self = this;
        var regex = new RegExp(" ", "g");
        var Providers = {
            unknown: 0,
            wex: 2,
            fleetcore: 3,
            geotab: 1000
        };

        // value parsers
        var getStringValue = function (string) {
            return (string === "(null)" ? "" : string.trim());
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
            if(date.indexOf("T") > -1) {
                return fromStringDate.toISOString();
            }

            // date in non oaDate format
            fromStringDateUtc = new Date(Date.UTC(fromStringDate.getFullYear(), fromStringDate.getMonth(), fromStringDate.getDate(), fromStringDate.getHours(), fromStringDate.getMinutes(), fromStringDate.getMilliseconds()));
            if(!isNaN(fromStringDateUtc.getTime())){
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

        var parsers = {
            wex: function (headings, data) {
                var transactions = [];

                // TODO : millennium file?
                data.forEach(function (dataRow) {
                    var rawTransaction = {},
                        fuelTransaction;

                    Object.keys(headings).forEach(function (heading) {
                        rawTransaction[headings[heading].replace(regex, "")] = dataRow[heading];
                    });

                    if (dataRow.ColumnN) {
                        fuelTransaction = new FuelTransaction(
                            getStringValue(dataRow.ColumnJ),
                            getStringValue(dataRow.ColumnI),
                            "",
                            getStringValue(dataRow.ColumnG),
                            "",
                            getDateValue(dataRow.ColumnAK), // may need convert to UTC date, columAK may not exist
                            gallonsToLitres(getFloatValue(dataRow.ColumnN)),
                            milesToKm(getFloatValue(dataRow.ColumnAH)),
                            getFloatValue(dataRow.ColumnO),
                            "USD",
                            {x: getFloatValue(dataRow.ColumnAM), y: getFloatValue(dataRow.ColumnAL)},
                            "Wex",
                            (getStringValue(dataRow.ColumnU) + " " + getStringValue(dataRow.ColumnV) + " " + getStringValue(dataRow.ColumnT)).trim(),
                            JSON.stringify(rawTransaction)
                        );

                        fuelTransaction.fleet = getStringValue(dataRow.ColumnA);
                        transactions.push(fuelTransaction);
                    }
                });

                return transactions;
            },
            geotab: function (headings, data) {
                var transactions = [];

                data.forEach(function (dataRow) {
                    var rawTransaction = {},
                        fuelTransaction;

                    Object.keys(headings).forEach(function (heading) {
                        rawTransaction[headings[heading].replace(regex, "")] = dataRow[heading];
                    });

                    if (dataRow.ColumnM) {
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
                            {x: getFloatValue(dataRow.ColumnL), y: getFloatValue(dataRow.ColumnK)},
                            "Unknown",
                            getStringValue(dataRow.ColumnM),
                            JSON.stringify(rawTransaction)
                        );

                        fuelTransaction.fleet = getStringValue(database);
                        transactions.push(fuelTransaction);
                    }
                });

                return transactions;
            }
        };

        var getHeadings = function (data) {
            var headRow = data[0];
            var isHeadingRow = true;
            Object.keys(headRow).forEach(function (columName) {
                if (!isNaN(parseInt(columName, 10))) {
                    isHeadingRow = false;
                    return;
                }
            });
            if (isHeadingRow) {
                return data.shift();
            }
            return [];
        };

        var determineProvider = function (headings, data) {
            // TODO: overly simplified here. Needs good logic.
            if (headings.ColumnA === "VIN" && headings.ColumnM === "Driver Name") {
                return Providers.geotab;
            } else if (headings.ColumnA === "Fleet Name" && headings.ColumnB === "ACCOUNT NUMBER 5") {
                return Providers.wex;
            }
            return Providers.unknown;
        };

        var rowsToFuelTransactions = function (provider, headings, data) {
            switch (provider) {
                case Providers.wex:
                    return parsers.wex(headings, data);
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
                toggleAlert(elAlertError, "missing row headings in file");
                return;
            }
            provider = determineProvider(headings, data);
            return rowsToFuelTransactions(provider, headings, data);
        };

        return self;
    };

    var importFile = function () {
        var fleetName = elFleet.options[elFleet.selectedIndex].value;
        var callSets = [];
        var callSet = [];
        var caller;
        var callLimit = 500;
        var i;
        var totalAdded = 0;
        var total = 0;
        var message = "Importing fuel transactions...";
        var updateTotal = function (results) {
            totalAdded += typeof results === "string" ? 1 : results.length;
        };
        var doCalls = function (calls) {
            return api.multiCall(calls, function () {
            }, function () {
            });
        };
        toggleImport(false);
        toggleBrowse(false);
        toggleAlert(elAlertInfo, message);
        transactions.forEach(function (transaction, i) {
            if (!fleetName || transaction.fleet === fleetName) {
                callSet.push(["Add", {typeName: "FuelTransaction", entity: transaction}]);
                total++;
            }
            if (callSet.length === callLimit || i === transactions.length - 1) {
                callSets.push(callSet);
                callSet = [];
            }
        });

        caller = doCalls(callSets.pop()).fail(function (e) {
            toggleBrowse(true);
            toggleAlert(elAlertError, e.toString());
        });

        for (i = 0; i < callSets.length; i++) {
            caller = caller.andThen((function () {
                var calls = callSets.pop();
                return function (results) {
                    updateTotal(results);
                    toggleAlert(elAlertInfo, message + " " + totalAdded + "/" + total);
                    return doCalls(calls);
                };
            }()));
            i--;
        }
        caller.andThen(function (results) {
            updateTotal(results);
            clearTransactions();
            toggleAlert(elAlertSuccess, totalAdded);
            toggleBrowse(true);
        });
    };

    var toggleExample = function (e) {
        var checked = e.target.checked;
        if (!checked) {
            e.target.parentNode.className = e.target.parentNode.className.replace("active", "");
        } else {
            e.target.parentNode.className += " active";
        }
        elSample.style.display = checked ? "block" : "none";
    };

    return {
        initialize: function (geotabApi, pageState, initializeCallback) {
            api = geotabApi;
            state = pageState;

            elContainer =  document.getElementById("importFuelTransactionsId");
            elFiles = document.getElementById("files");
            elParseButton = document.getElementById("parseButton");
            elImportButton = document.getElementById("importButton");
            elFleet = document.getElementById("fleet");
            elExampleButton = document.getElementById("exampleButton");
            elFileName = document.getElementById("fileName");
            elTransactionList = document.getElementById("transactionList");
            elTransactionContainer = document.getElementById("transactionContainer");
            elAlertInfo = document.getElementById("alertInfo");
            elAlertSuccess = document.getElementById("alertSuccess");
            elAlertError = document.getElementById("alertError");
            elSample = document.getElementById("sample");
            elForm = document.getElementById("form");
            elListCount = document.getElementById("listCount");
            initializeCallback();
        },

        focus: function () {
            // events
            elFiles.addEventListener("change", fileSelected, false);
            elParseButton.addEventListener("click", uploadFile, false);
            elImportButton.addEventListener("click", importFile, false);
            elFleet.addEventListener("change", renderTransactions, false);
            elExampleButton.addEventListener("change", toggleExample, false);

            elContainer.style.display = "block";
        },

        blur: function () {
            // events
            elFiles.removeEventListener("change", fileSelected, false);
            elParseButton.removeEventListener("click", uploadFile, false);
            elImportButton.removeEventListener("click", importFile, false);
            elFleet.removeEventListener("change", renderTransactions, false);
            elExampleButton.removeEventListener("change", toggleExample, false);
        }
    };
};
