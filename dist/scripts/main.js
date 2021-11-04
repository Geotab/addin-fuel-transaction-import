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
    var elParseButtonJson;
    var elJsonDropDownMenu;
    var elSelector;
    var elFileSelectContainerProvider;
  
    var elFileProvider;
    var elFileNameProvider;
    var elParseButtonProvider;
    var elTableTransactions;
    var elTimezonePicker;
    //var elDaylightPicker;

  
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
    
    
    
    const moment= require('moment');
    const cc = require('currency-codes');

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
              'cardNumber' : "Card Number",
              'comments': 'Comments',
              'description': 'Description',
              'driverName' : 'Driver Name',
              'externalReference' : 'External Reference',
              'licencePlate' : 'Licence Plate',
              'provider' : 'Fuel Provider',
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
              if (columnName === 'device' || columnName === 'driver' || columnName === 'serialNumber' || columnName === 'sourceData' || columnName === 'location' || columnName === 'version' || columnName === 'id'|| columnName === 'fleet') {
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
      elFileNameJson.value =null;
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
  
  var FuelTransactionProvider = function (cardNumber,comments,description,driverName,externalReference,licencePlate,provider,serialNumber,siteName,vehicleIdentificationNumber,cost,currencyCode,dateTime,odometer,productType,volume) {
      var self = {
  
          cardNumber: cardNumber || '',
          comments: comments || '',
          description: description || '',         
          driverName: driverName|| '',
          externalReference: externalReference|| '',
          licencePlate: licencePlate || '',
          provider:provider || '',
          serialNumber: serialNumber || '',
          siteName:siteName || '',          
          vehicleIdentificationNumber: vehicleIdentificationNumber || '',
          cost: cost || '',
          currencyCode: currencyCode || '',
          dateTime: dateTime || '',         
          odometer: odometer || '',
          productType:productType || '',
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
                  xhr.open('POST','https://my1612.geotab.com/apiv1')
              }
              else
              {
                  xhr.open('POST', getUrl());
              }
              //xhr.open('POST', getUrl());
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
      //toggleBrowse(false);
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
         
          console.log("Transaction Imported with ID: ",temp.replace(/[\[\]"]+/g, ""));
         
          window.alert("Transaction ID: "+temp.replace(/[\[\]"]+/g, ""));
          clearTransactionsProvider();
          toggleAlert(elAlertSuccess, totalAdded);
          //toggleBrowse(true);
      }).catch(function (e) {
          //toggleBrowse(true);
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
  
  async function parsingTransactionWithProviderAsync(transactions,provider)
  {
      var arrayOfParsedTransaction = [];
      
      //loop transaction list row by row
      for (var k=0;k<transactions.length;k++)
      {
          arrayOfParsedTransaction.push(await loopParseTransactionInTemplateAsync(transactions[k],provider[0].data));   
      }   
      try {
          var jsonObjParsed= JSON.parse(JSON.stringify(arrayOfParsedTransaction));
         
          
      } catch(e) {        
          console.log("Error: ",e );
      }
  
      //jsonObjParsed will be the object with the transaction parsed into
      //API template for fuel transaction and will returned into
      //fuelTransactionImport object in uploadCompleteProviderAsync function
      return jsonObjParsed;
  }
  async function loopParseTransactionInTemplateAsync(singleTransaction,provider)
  {
      var newTranscationObj = new FuelTransactionProvider();
  
      for (var prop in provider) 
      {
          if(provider[prop]==null)provider[prop]="";//if json file has null field change in ""        
      }
  
  
      //check of the mandatory fields
      //Stop the execution
  
      if(provider["licencePlate"]==""&&provider["vehicleIdentificationNumber"]==""&&provider["serialNumber"]=="")
      {
          console.log("Not mapped into Json file, Licence Plate or Vin or Serial Number is needed");
          window.alert("Licence Plate, VIN and Serial Number are not mapped into Json file at least one must be filled");
          clearAllForException(); 
  
      }
      else
      {        
          if(singleTransaction[provider["licencePlate"]]==""||singleTransaction[provider["licencePlate"]]==undefined)
          {
              if(singleTransaction[provider["vehicleIdentificationNumber"]]==""||singleTransaction[provider["vehicleIdentificationNumber"]]==undefined)
              {
                  if(singleTransaction[provider["serialNumber"]]==""||singleTransaction[provider["serialNumber"]]==undefined)
                  {
                      console.log("One of Licence Plate or Vin or Serial Number is needed");
                      window.alert("Licence Plate, VIN and Serial Number are not present, at least one must be filled");
                       clearAllForException();
                  }
              }
          }
          
         
      }
      
  
      for (var prop in provider) 
      {
  
          switch(prop)
          {          
              case "comments":                
                  if(singleTransaction[provider[prop]]!=undefined && singleTransaction[provider[prop]]!="")
                  {
                      if(singleTransaction[provider[prop]].length>1024)newTranscationObj[prop]=singleTransaction[provider[prop]].substring(0,1024);
                      newTranscationObj[prop]=singleTransaction[provider[prop]];
                  }
                  break;
              case "description":
                  if(singleTransaction[provider[prop]]!=undefined && singleTransaction[provider[prop]]!="")
                  {
                      if(singleTransaction[provider[prop]].length>255)newTranscationObj[prop]=singleTransaction[provider[prop]].substring(0,255);
                      newTranscationObj[prop]=singleTransaction[provider[prop]];
                  }
                  break;   
              case "driverName":                
                  if(singleTransaction[provider[prop]]!=undefined && singleTransaction[provider[prop]]!="")
                  {
                      if(singleTransaction[provider[prop]].length>255)newTranscationObj[prop]=singleTransaction[provider[prop]].substring(0,255);
                      newTranscationObj[prop]=singleTransaction[provider[prop]];
                  }
              break;
              case "externalReference":                
                  if(singleTransaction[provider[prop]]!=undefined && singleTransaction[provider[prop]]!="")
                  {
                      if(singleTransaction[provider[prop]].length>255)newTranscationObj[prop]=singleTransaction[provider[prop]].substring(0,255);
                      newTranscationObj[prop]=singleTransaction[provider[prop]];
                  }
              break;
              case "licencePlate":
                  
                  if(singleTransaction[provider[prop]]!=undefined && singleTransaction[provider[prop]]!="")
                  {
                      
                      if(singleTransaction[provider[prop]].length>255)singleTransaction[provider[prop]].substring(0,255);
                      newTranscationObj[prop]= singleTransaction[provider[prop]].toUpperCase().replace(/\s/g, '');  
                  }
  
              break;
              case "serialNumber":
                 
                  if(singleTransaction[provider[prop]]!=undefined && singleTransaction[provider[prop]]!="")
                  {
                      newTranscationObj[prop]= singleTransaction[provider[prop]].toUpperCase().replace(/\s/g, ''); 
                      
                  }                   
                 
              break;   
              
              case "siteName":
                  if(provider[prop]!="")
                   {                    
                      if(typeof(provider[prop])=="object")
                      {
                          for(var inner in provider[prop])
                          {
                              if(singleTransaction[provider[prop][inner]]!=""&&singleTransaction[provider[prop][inner]]!=undefined)newTranscationObj[prop] += singleTransaction[provider[prop][inner]]+" "; 
                          }
                          newTranscationObj[prop]=newTranscationObj[prop].slice(0,-1);
                      }
                      else newTranscationObj[prop]= singleTransaction[provider[prop]];
                   }
                   
                  break;
  
          
              case "vehicleIdentificationNumber":
                  
                  if(singleTransaction[provider[prop]]!=undefined&&singleTransaction[provider[prop]]!="")
                  {
                      newTranscationObj[prop]= singleTransaction[provider[prop]].toUpperCase().replace(/\s/g, '');  
                  }
              break;
  
              case "cost":
                  if(singleTransaction[provider[prop]]!=undefined&&singleTransaction[provider[prop]]!="")
                  {
                      
                      newTranscationObj[prop]= parseFloat(singleTransaction[provider[prop]].replace(/,/g, '.')); 
     
                  }
                             
  
              break;
              case "currencyCode":
                  var currency;            
  
                  if(singleTransaction[provider[prop]]!=undefined&&singleTransaction[provider[prop]]!="")
                  {
                      currency= singleTransaction[provider[prop]].trim().toUpperCase();
                      currency = currency.replace(/[^a-zA-Z]/g, '');                    
  
                      if (!cc.codes().includes(currency.toUpperCase())) 
                      {
                          window.alert("Invalid format for currency: " + currency + "\n"+" Please follow ISO 4217 3-letter standard for representing currency. Eg: USD");
                          clearAllForException(); 
                      }    
                      else
                      {
                          newTranscationObj[prop]= currency;  
                      }
                  }
                  else
                  {
                      if(singleTransaction[provider[prop]]!="")newTranscationObj[prop]=null;
                  }
              break;
  
              case "dateTime":

                var temp="";
                dateHoursComposed =dateFormat;
               
                  if(provider[prop]!="")
                    {
                        
                        if(typeof(provider[prop])=="object"&&provider[prop].length>1)
                        {
                            dateHoursComposed = dateFormat + " "+hourFormat;
                            for(var inner in provider[prop])
                            {
                                                   
                                    if(singleTransaction[provider[prop][inner]]!=""&&singleTransaction[provider[prop][inner]]!=undefined)
                                    {                                             
                                         
                                        if(singleTransaction[provider[prop][0]].length==19)
                                        {
                                            //if you are here is because the Date cell in excel has Date format
                                           
                                            //I change the date format into US
                                            dateFormat="MM/DD/YYYY";
                                            dateHoursComposed = dateFormat + " "+hourFormat;
                                            singleTransaction[provider[prop][0]]= (moment(singleTransaction[provider[prop][0]].slice(0,10)).format(dateFormat));
                                            console.log(singleTransaction[provider[prop][0]]);
                                        }
                                        if(singleTransaction[provider[prop][1]].length==16)
                                        {
                                            singleTransaction[provider[prop][1]]= singleTransaction[provider[prop][1]].slice(0,8);
                                            console.log(singleTransaction[provider[prop][1]]);
                                           
                                        }
                                        

                                        temp = newTranscationObj[prop] += singleTransaction[provider[prop][inner]]+" ";
                                    }                                        
                            }
                            temp = temp.slice(0,-1);    
                                                                            
                            newTranscationObj[prop] = getDateValueProvider(temp);
                        }
                        else
                        {
                            
                            if(singleTransaction[provider[prop]].length==19)
                            {
                                dateFormat="MM/DD/YYYY";
                                dateHoursComposed =dateFormat;
                                newTranscationObj[prop] = getDateValueProvider(singleTransaction[provider[prop]].slice(0,10));
                            }
                            else newTranscationObj[prop] = getDateValueProvider(singleTransaction[provider[prop]]);
                        } 

                    }
                break;
                    
                
              
              case "odometer":
                  var tmp;
                  if(singleTransaction[provider[prop]]!=undefined&&singleTransaction[provider[prop]]!="")
                  {
                      tmp = singleTransaction[provider[prop]].replace(/,/g, '.');
                      newTranscationObj[prop]= parseFloat(tmp).toFixed(1);
                      unitOdoKm=unitOdoKm.toUpperCase();
                      if(unitOdoKm!="Y"&&unitOdoKm!="N")
                      {
                          console.log("Units of Odometer field mapping in Json file must be 1 characters either Y or N");
                          window.alert("Units of Odometer field mapping in Json file must be 1 characters either Y or N");
                          clearAllForException();
                      }
                      else if(unitOdoKm!="Y")
                      {
                          tmp= milesToKm(singleTransaction[provider[prop]]);
                          newTranscationObj[prop]= parseFloat(tmp).toFixed(1);
                      }   
                  }
                  break;
  
              case "productType":
                  
                  if(singleTransaction[provider[prop]]!=undefined&&singleTransaction[provider[prop]]!="")
                  {
                      newTranscationObj[prop]= getProductType(singleTransaction[provider[prop]]);
                  }               
              break;
              case "volume": 
                  var tmp;
                  if(singleTransaction[provider[prop]]!=undefined&&singleTransaction[provider[prop]]!="")
                  {
                      tmp = singleTransaction[provider[prop]].replace(/,/g, '.');
                      newTranscationObj[prop]= parseFloat(tmp).toFixed(1);
                      unitVolumeLiters = unitVolumeLiters.toUpperCase();
                      if(unitVolumeLiters!="Y"&&unitVolumeLiters!="N")
                      {
                          console.log("Units of Fuel Volume field mapping in Json file must be 1 characters either Y or N");
                          window.alert("Units of Fuel Volume field mapping in Json file must be 1 characters either Y or N");
                          clearAllForException();
                      }
                      else if(unitVolumeLiters!="Y")
                      {
                          tmp = gallonsToLitres(singleTransaction[provider[prop]]);
                          newTranscationObj[prop]= parseFloat(tmp).toFixed(1);
                      }
                  }               
                  break;
  
              default:
                  if(singleTransaction[provider[prop]]!=undefined&&singleTransaction[provider[prop]]!="")newTranscationObj[prop]= singleTransaction[provider[prop]];  
                  break;
          }
      }
     
      return newTranscationObj;
  }
  
  
  
  var getDateValueProvider = function (date) {
  
      var dateFormatted;
      
      var dateFormats = {

        //YYYY
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

          "id20": "YYYY/MM/DD",          
          "id21": "YYYY/MM/DDTHH:mm:ss",
          "id22": "YYYY/MM/DDTh:m:s",
          "id23": "YYYY/MM/DD HH:mm",
          "id24": "YYYY/MM/DD HH:mm:ss",
          "id25": "YYYY/MM/DD h:m:s",
          "id26": "YYYY/MM/DDTHH:mm:ssZ",
          "id27": "YYYY/MM/DDTh:m:sZ",
          "id28": "YYYY/MM/DD HHmm",
          "id29": "YYYY/MM/DD HHmmss",
          "id30": "YYYY/MM/DDTHH:mm:ss.SSSZ",         

          "id40": "YYYYMMDD",
          "id41": "YYYYMMDDTHH:mm:ss",
          "id42": "YYYYMMDDTh:m:s",
          "id43": "YYYYMMDD HH:mm",
          "id44": "YYYYMMDD HH:mm:ss",
          "id45": "YYYYMMDD h:m:s",
          "id46": "YYYYMMDDTHH:mm:ssZ",          
          "id47": "YYYYMMDDTh:m:sZ",
          "id48": "YYYYMMDD HHmm",
          "id49": "YYYYMMDD HHmmss",
          "id50": "YYYYMMDDTHH:mm:ss.SSSZ",
          
          //MM

          "id60": "MM-DD-YYYY",
          "id61": "MM-DD-YYYYTHH:mm:ss",
          "id62": "MM-DD-YYYYTh:m:s",
          "id63": "MM-DD-YYYY HH:mm",
          "id64": "MM-DD-YYYY HH:mm:ss",
          "id65": "MM-DD-YYYY h:m:s",
          "id66": "MM-DD-YYYYTHH:mm:ssZ",          
          "id67": "MM-DD-YYYYTh:m:sZ",
          "id68": "MM-DD-YYYY HHmm",
          "id69": "MM-DD-YYYY HHmmss",
          "id70": "MM-DD-YYYYTHH:mm:ss.SSSZ",
         
          "id80": "MM/DD/YYYY",          
          "id81": "MM/DD/YYYYTHH:mm:ss",
          "id82": "MM/DD/YYYYTh:m:s",
          "id83": "MM/DD/YYYY HH:mm",
          "id84": "MM/DD/YYYY HH:mm:ss",
          "id85": "MM/DD/YYYY h:m:s",
          "id86": "MM/DD/YYYYTHH:mm:ssZ",
          "id87": "MM/DD/YYYYTh:m:sZ",
          "id88": "MM/DD/YYYY HHmm",
          "id89": "MM/DD/YYYY HHmmss",
          "id90": "MM/DD/YYYYTHH:mm:ss.SSSZ",          

          "id100": "MMDDYYYY",
          "id101": "MMDDYYYYTHH:mm:ss",
          "id102": "MMDDYYYYTh:m:s",
          "id103": "MMDDYYYY HH:mm",
          "id104": "MMDDYYYY HH:mm:ss",
          "id105": "MMDDYYYY h:m:s",
          "id106": "MMDDYYYYTHH:mm:ssZ",          
          "id107": "MMDDYYYYTh:m:sZ",
          "id108": "MMDDYYYY HHmm",
          "id109": "MMDDYYYY HHmmss",
          "id110": "MMDDYYYYTHH:mm:ss.SSSZ", 

          //DD        
        
          "id120": "DD-MM-YYYY",
          "id121": "DD-MM-YYYYTHH:mm:ss",
          "id122": "DD-MM-YYYYTh:m:s",
          "id123": "DD-MM-YYYY HH:mm",
          "id124": "DD-MM-YYYY HH:mm:ss",
          "id125": "DD-MM-YYYY h:m:s",
          "id126": "DD-MM-YYYYTHH:mm:ssZ",          
          "id127": "DD-MM-YYYYTh:m:sZ",
          "id128": "DD-MM-YYYY HHmm",
          "id129": "DD-MM-YYYY HHmmss",
          "id130": "DD-MM-YYYYTHH:mm:ss.SSSZ",          

          "id140": "DD/MM/YYYY",          
          "id141": "DD/MM/YYYYTHH:mm:ss",
          "id142": "DD/MM/YYYYTh:m:s",
          "id143": "DD/MM/YYYY HH:mm",
          "id144": "DD/MM/YYYY HH:mm:ss",
          "id145": "DD/MM/YYYY h:m:s",
          "id146": "DD/MM/YYYYTHH:mm:ssZ",
          "id147": "DD/MM/YYYYTh:m:sZ",
          "id148": "DD/MM/YYYY HHmm",
          "id149": "DD/MM/YYYY HHmmss",
          "id150": "DD/MM/YYYYTHH:mm:ss.SSSZ",          

          "id160": "DDMMYYY",
          "id161": "DDMMYYYYTHH:mm:ss",
          "id162": "DDMMYYYYTh:m:s",
          "id163": "DDMMYYYY HH:mm",
          "id164": "DDMMYYYY HH:mm:ss",
          "id165": "DDMMYYYY h:m:s",
          "id166": "DDMMYYYYTHH:mm:ssZ",          
          "id167": "DDMMYYYYTh:m:sZ",
          "id168": "DDMMYYYY HHmm",
          "id169": "DDMMYYYY HHmmss",
          "id170": "DDMMYYYYTHH:mm:ss.SSSZ", 
       
        }
        
        function getFormat(dateInput){

            for (var prop in dateFormats) {               
                if(dateFormats[prop]==dateHoursComposed)
                {                  
                    console.log("Date Input: ",dateInput, "dateHours Composed: ",dateHoursComposed);
                    if(moment(dateInput, dateHoursComposed,true).isValid())
                    {
                        return dateFormats[prop];
                    }
                    else
                    {
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
        
        if(formatFound !==null)
        {  
           
           // var temp2;
            //var finalTemp;
            var rightNow = new Date();
            rightNow = moment(rightNow).utcOffset();

            console.log("offest calcolato da picker: ",timezoneFromPicker);

            var offsetInNumber = moment().tz(timezoneFromPicker).utcOffset();
            /*

            temp2=rightNow.toString().split('+');
            console.log("this is rightNow date: ",temp2[1]);
            temp2= temp2[1].slice(0, 4);
            finalTemp= temp2.slice(0, 2) + ":" + temp2.slice(2);
            console.log(finalTemp);
            finalTemp = "+"+finalTemp;
            console.log("finalTemp: ",finalTemp);
            let [hours2, minutes2]=finalTemp.split(':');
            temp2= (+hours2 * 60) + (+minutes2);
            console.log("temp2: ",temp2);          

           var newOffsetBetweenLocalAndTransactions;
           newOffsetBetweenLocalAndTransactions = temp2;
*/

           console.log("Offest Browser: ",rightNow);
           console.log("date: ",date);
           
           dateFormatted= moment.utc(date,formatFound,true).utcOffset(offsetInNumber,false).format();
           //dateFormatted= moment.utc(date,formatFound,false).format();
           
           console.log("dateFormatted: ",dateFormatted);
           console.log("offsetInNumber: ",offsetInNumber);




           /*
           var tmp;    
           let [hours, minutes] = timezoneFromPicker.split(':');
           console.log("Timezone picker: ",timezoneFromPicker);        
           tmp= (+hours * 60) + (+minutes);
      
           console.log("Picker selected: ",tmp);
           console.log("Offest from UTC: ",moment().utcOffset());
           console.log("Offset Diff. between Local and Transaction: ",tmp+(moment().utcOffset()));
           console.log("data NON UTC con offest applicato da picker: ", moment(date).utcOffset(tmp,true).format());
           console.log("data  UTC con offest applicato da picker: ", moment.utc(date).utcOffset(tmp,true).format());
           */
           
          
       
        }
        else
        {
            console.log("Date Format in mapping file not allowed or missing");
            console.log("Date: ",date);      
            window.alert("Date Format in mapping file not allowed or missing");
            clearAllForException(); 
        }
        return dateFormatted;
  };
  
  
  var clearAllForException = function()
  {
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
  }
  
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
  
  var toggleJsonDropDownMenu = function()
  {
      var itemIndexSelected = elJsonDropDownMenu.selectedIndex;
      var itemValueSelected = elJsonDropDownMenu.options[elJsonDropDownMenu.selectedIndex].value;
      var lengthDropDownMenu = elJsonDropDownMenu.length;
      if(itemIndexSelected != "0")
      {
          //container that show the File selection
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
      
      for(var i = 0; i < elSelector.length; i++) 
      {                  
          if(elSelector[i].checked)
          {             
             switch(elSelector[i].id)
             {
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
  }
  
  var addBlanckColumn = function(transactionsToBeChecked)
  {    
      for (var i=0; i<transactionsToBeChecked.data.length;i++ )
      {
      // get Headers object as master to compare, because header cannot 
      // be empty
      var keysHeader = Object.keys(transactionsToBeChecked.data[0]);
      var keysTempTransaction = Object.keys(transactionsToBeChecked.data[i]);
     
      var z=0;
      var tempVar = z;
          for (z;z<keysHeader.length;z++)
          {        
              //compare the column header with the transaction column
              //if not match I add column with key equal to Header name
              // and value=null
              if(keysHeader[z]!=keysTempTransaction[tempVar])
              {
                  transactionsToBeChecked.data[i][keysHeader[z]]="";
                  keysTempTransaction = Object.keys(transactionsToBeChecked.data[i]);
              }
              else tempVar++;
          } 
      }      
      return transactionsToBeChecked;
  }
  
  var uploadFileProvider = function(e)
  {
      //get browser timezone and set the global variale
      getTimezonePicker();
    
      e.preventDefault();
      if(elFileProvider.files[0].name.split('.').pop()!="xlsx")
      {
        alert('Please select xlsx files only!');     
        clearAllForException();
      }
      

      //// New part Excel to Json
      /*
      console.log(elFileProvider.files[0]);
      console.log(elFileProvider.files[0].name);
      //const wb = xlsx.readFile("/src/app/scripts/Repostaje Mes Junio 21.xlsx");
      const wb = xlsx.readFile(elFileProvider.files[0]);      
      console.log(wb.SheetNames);
      */
      ///// End of the test




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
              
              if(getUrl()=='http://localhost/apiv1')
              {
                  xhr.open('POST','https://my1612.geotab.com/apiv1')
              }
              else
              {
                  xhr.open('POST', getUrl());
              }
                      
  
              xhr.send(fd);
          
              xhr.onreadystatechange=function(){
                  if (xhr.readyState==4 && xhr.status==200)
                  {
                             
                     var data = JSON.parse(xhr.responseText);
                    
                     if(data['error']['message']="Incorrect login credentials")
                     {
                        console.log(data['error']['message']);
                        window.alert("Incorrect Login Credentials");
                        xhr.abort();
                        toggleAlert(elAlertError, 'There was an error attempting to upload the file.');
                        clearAllForException();
                     }

                     if(data['error']['message']="data['error']['message']");
                     {
                        console.log(data['error']['message']);
                        alert("Error importing transaction file"+"\n"+"Please check your xlsx file");
                        clearAllForException();
                     }
   
                  }
               }
  
  
  
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
  
  async function uploadCompleteProviderAsync(e) {
  
      var results;
      var headingsExtracted;    
      // retrieve the name of the provider selected
      var providerSelected = getTemplateProviderNameFromSelection();
      // retrieve the keys of the provider selected from the full template ojbect
      var extractedProviderTemplate = objProviderTemplate.providers.filter((provider) => provider.Name ===providerSelected);    
      
      unitVolumeLiters = extractedProviderTemplate[0]["unitVolumeLiters"];
      unitOdoKm = extractedProviderTemplate[0]["unitOdoKm"];
      dateFormat = extractedProviderTemplate[0]["dateFormat"];
      hourFormat = extractedProviderTemplate[0]["timeFormat"];
      
  
      results = addBlanckColumn(resultsParser(e));
      if (results.error) {
          toggleAlert(elAlertError, results.error.message);
          return;
          }     
      else if(results.data.length==1)
      {
          window.alert("The file doesn't contain any transactions");
          clearAllForException();
      }
      //remove the heading from transaction
      headingsExtracted= getHeadings(results.data);
      transactions = await parsingTransactionWithProviderAsync(results.data,extractedProviderTemplate);
  
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

    /*
    var setDaylightPicker = function setDaylightPicker()
    {
        
        var selection = elDaylightPicker.value;
        var optionValues;
        var optionCaption;
        
        if(selection=="Yes")
        {
            
            optionValues=["-11:00,0","-10:00,0","-09:00,0","-08:00,1","-07:00,1","-06:00,0","-06:00,1","-05:00,0","-05:00,1","-04:00,0","-04:00,1","-03:00,1","-03:00,0","-02:30,1","-02:00,1","-02:00,0","-01:00,1","00:00,1","00:00,0","+01:00,0","+01:00,1","+02:00,1","+02:00,0","+03:00,1","+03:00,0","+04:00,1","+04:00,0","+04:30,0","+05:00,0","+05:00,1","+05:30,0","+06:00,1","+06:00,0","+06:30,0","+06:45,0","+07:00,0","+07:00,1","+07:30,0","+08:00,1","+08:00,0","+09:00,0","+09:00,1","+10:00,1","+10:00,0","+10:30,0","+10:30,1","+11:00,0","+11:00,1","+12:00,0","+13:00,1","+13:00,0","+14:00,0"];
            optionCaption=["-11:00 International Date Line West","-10:00 Midway Island, Samoa","-09:00 Hawaii","-08:00 Alaska","-07:00 Pacific Time (US & Canada)","-06:00 Arizona","-06:00 Mountain Time (US & Canada)","-05:00 Central America, Saskatchewan","-05:00 Central Time (US & Canada), Guadalajara, Mexico city","-04:00 Indiana, Bogota, Lima, Quito, Rio Branco  ","-04:00 Eastern time (US & Canada)","-03:00 Atlantic time (Canada), Manaus, Santiago","-03:00 Caracas, La Paz","-02:30 Newfoundland","-02:00 Greenland, Brasilia, Montevideo","-02:00 Buenos Aires, Georgetown","-01:00 Mid-Atlantic","00:00 Azores","00:00 Cape Verde Is.","+01:00 Casablanca, Monrovia, Reykjavik","+01:00 GMT: Dublin, Edinburgh, Lisbon, London","+02:00 Amsterdam, Berlin, Rome, Vienna, Prague, Brussels","+02:00 West Central Africa","+03:00 Amman, Athens, Istanbul, Beirut, Cairo, Jerusalem","+04:00 Harare, Pretoria","+04:00 Baghdad, Moscow, St. Petersburg, Volgograd","+04:00 Kuwait, Riyadh, Nairobi, Tbilisi","+04:30 Tehran","+05:00 Abu Dhadi, Muscat","+05:00 Baku, Yerevan","+05:30 Kabul","+06:00 Ekaterinburg","+06:00 Islamabad, Karachi, Tashkent","+06:30 Chennai, Kolkata, Mumbai, New Delhi, Sri Jayawardenepura","+06:45 Kathmandu","+07:00 Astana, Dhaka","+07:00 Almaty, Nonosibirsk","+07:30 Yangon (Rangoon)","+08:00 Krasnoyarsk","+08:00 Bangkok, Hanoi, Jakarta","+09:00 Beijing, Hong Kong, Singapore, Taipei","+09:00 Irkutsk, Ulaan Bataar, Perth","+10:00 Yakutsk","+10:00 Seoul, Osaka, Sapporo, Tokyo","+10:30 Darwin","+10:30 Adelaide","+11:00 Brisbane, Guam, Port Moresby","+11:00 Canberra, Melbourne, Sydney, Hobart, Vladivostok","+12:00 Magadan, Solomon Is., New Caledonia","+13:00 Auckland, Wellington","+13:00 Fiji, Kamchatka, Marshall Is.","+14:00 Nuku'alofa"];
        
        }
        else
        {
            optionValues=["-12:00,0","-11:00,0","-10:00,0","-09:00,1","-08:00,1","-07:00,0","-07:00,1","-06:00,0","-06:00,1","-05:00,0","-05:00,1","-04:00,1","-04:00,0","-03:30,1","-03:00,1","-03:00,0","-02:00,1","-01:00,1","-01:00,0","00:00,0","00:00,1","+01:00,1","+01:00,0","+02:00,1","+02:00,0","+03:00,1","+03:00,0","+03:30,0","+04:00,0","+04:00,1","+04:30,0","+05:00,1","+05:00,0","+05:30,0","+05:45,0","+06:00,0","+06:00,1","+06:30,0","+07:00,1","+07:00,0","+08:00,0","+08:00,1","+09:00,1","+09:00,0","+09:30,0","+09:30,1","+10:00,0","+10:00,1","+11:00,0","+12:00,1","+12:00,0","+13:00,0"];
            optionCaption=["-12:00 International Date Line West","-11:00 Midway Island, Samoa","-10:00 Hawaii","-09:00 Alaska","-08:00 Pacific Time (US & Canada)","-07:00 Arizona","-07:00 Mountain Time (US & Canada)","-06:00 Central America, Saskatchewan","-06:00 Central Time (US & Canada), Guadalajara, Mexico city","-05:00 Indiana, Bogota, Lima, Quito, Rio Branco  ","-05:00 Eastern time (US & Canada)","-04:00 Atlantic time (Canada), Manaus, Santiago","-04:00 Caracas, La Paz","-03:30 Newfoundland","-03:00 Greenland, Brasilia, Montevideo","-03:00 Buenos Aires, Georgetown","-02:00 Mid-Atlantic","-01:00 Azores","-01:00 Cape Verde Is.","00:00 Casablanca, Monrovia, Reykjavik","00:00 GMT: Dublin, Edinburgh, Lisbon, London","+01:00 Amsterdam, Berlin, Rome, Vienna, Prague, Brussels","+01:00 West Central Africa","+02:00 Amman, Athens, Istanbul, Beirut, Cairo, Jerusalem","+02:00 Harare, Pretoria","+03:00 Baghdad, Moscow, St. Petersburg, Volgograd","+03:00 Kuwait, Riyadh, Nairobi, Tbilisi","+03:30 Tehran","+04:00 Abu Dhadi, Muscat","+04:00 Baku, Yerevan","+04:30 Kabul","+05:00 Ekaterinburg","+05:00 Islamabad, Karachi, Tashkent","+05:30 Chennai, Kolkata, Mumbai, New Delhi, Sri Jayawardenepura","+05:45 Kathmandu","+06:00 Astana, Dhaka","+06:00 Almaty, Nonosibirsk","+06:30 Yangon (Rangoon)","+07:00 Krasnoyarsk","+07:00 Bangkok, Hanoi, Jakarta","+08:00 Beijing, Hong Kong, Singapore, Taipei","+08:00 Irkutsk, Ulaan Bataar, Perth","+09:00 Yakutsk","+09:00 Seoul, Osaka, Sapporo, Tokyo","+09:30 Darwin","+09:30 Adelaide","+10:00 Brisbane, Guam, Port Moresby","+10:00 Canberra, Melbourne, Sydney, Hobart, Vladivostok","+11:00 Magadan, Solomon Is., New Caledonia","+12:00 Auckland, Wellington","+12:00 Fiji, Kamchatka, Marshall Is.","+13:00 Nuku'alofa"];
        }

        var strValue = "";
        
        for (var i=0;i<optionValues.length;i++) {

            strValue += "<option value="+optionValues[i]+">" + optionCaption[i] + "</option>";
           
          }
          elTimezonePicker.innerHTML=strValue;
          //elTimezonePicker.value=strValue;
          calculate_time_zone();
          getTimezonePicker();
          


    }
*/

    var getTimezonePicker = function getTimezonePicker()
    {
        
        
        //tmp = tmp.substring(0,tmp.length - 2);
        timezoneFromPicker = elTimezonePicker.value;
        
        console.log("Offset of value selected ",timezoneFromPicker," ",moment().tz(timezoneFromPicker).utcOffset());

    };


/*
    function calculate_time_zone() {
        var rightNow = new Date();
        
        console.log("rightNow :",rightNow);
        var jan1 = new Date(rightNow.getFullYear(), 0, 1, 0, 0, 0, 0);  // jan 1st
        console.log("jan1 :",jan1);	
        var june1 = new Date(rightNow.getFullYear(), 6, 1, 0, 0, 0, 0); // june 1st 
        console.log("june1 :",june1);      
        var temp = jan1.toGMTString();      
        console.log("temp :",temp);
        var jan2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
        console.log("jan2 :",jan2);    
        temp = june1.toGMTString();
        console.log("temp :",temp);     
    
        var june2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
        console.log("june2 :",june2);
    
        var std_time_offset = (jan1 - jan2) / (1000 * 60 * 60);
        console.log("std_time_offset :",std_time_offset);
        
        var daylight_time_offset = (june1 - june2) / (1000 * 60 * 60);
        console.log("daylight_time_offset :",daylight_time_offset);
       
        var dst;
        if (std_time_offset == daylight_time_offset) {
            dst = "0"; // daylight savings time is NOT observed
        } else {
            // positive is southern, negative is northern hemisphere
            var hemisphere = std_time_offset - daylight_time_offset;
            if (hemisphere >= 0)
                std_time_offset = daylight_time_offset;
            dst = "1"; // daylight savings time is observed
        }
        console.log("dst: ",dst);
        
        /////
        var temp2;
        var finalTemp;
        temp2=rightNow.toString().split('+');
        console.log(temp2[1]);
        temp2= temp2[1].slice(0, 4);
        finalTemp= temp2.slice(0, 2) + ":" + temp2.slice(2);
        console.log(finalTemp);
        finalTemp = "+"+finalTemp;
        console.log("finalTemp: ",finalTemp);
        /////


        var i;
        // check just to avoid error messages
        if (document.getElementById('timezone')) {
            for (i = 0; i < document.getElementById('timezone').options.length; i++)
            {
                console.log("comparazione ora con lista html: ",convert(std_time_offset)+","+dst);
                console.log(document.getElementById('timezone').options[i].value);
                
                if (document.getElementById('timezone').options[i].value == finalTemp+","+dst) {
                    document.getElementById('timezone').selectedIndex = i;
                    break;
                }
                
            }
        }
    
    }
    
    function convert(value) {
        var hours = parseInt(value);
           value -= parseInt(value);
        value *= 60;
        var mins = parseInt(value);
           value -= parseInt(value);
        value *= 60;
        var secs = parseInt(value);
        var display_hours = hours;
        // handle GMT case (00:00)
        if (hours == 0) {
            display_hours = "00";
        } else if (hours > 0) {
            // add a plus sign and perhaps an extra 0
            display_hours = (hours < 10) ? "+0"+hours : "+"+hours;
        } else {
            // add an extra 0 if needed 
            display_hours = (hours > -10) ? "-0"+Math.abs(hours) : hours;
        }
        
        mins = (mins < 10) ? "0"+mins : mins;
       
        return display_hours+":"+mins;
    }
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
  

        console.log("rightNow = moment(rightNow).utcOffset()",moment(new Date()).utcOffset());

        
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
        elTableTransactions = document.getElementById('tableTransactions');

        //calculate_time_zone();
        
        elTimezonePicker = document.getElementById('timezone');
        //elDaylightPicker = document.getElementById('dayLightPicker');
        

        

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
              elContainer.querySelector('#importFuelTransactions_fp-user').textContent = session.userName;
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
              for (var i = 0 ; i < elSelector.length; i++) {
                  elSelector[i].addEventListener('change' , showSelectorSection , false ) ; 
               }
  
               elFileProvider.addEventListener('change',fileProviderSelected,false);
               elParseButtonProvider.addEventListener('click',uploadFileProvider,false);

               elTimezonePicker.addEventListener('change',getTimezonePicker,false);
               //elDaylightPicker.addEventListener('change',setDaylightPicker,false);
              
            
  
        
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
  
        for (var i = 0 ; i < elSelector.length; i++) {
          elSelector[i].removeEventListener('change' , showSelectorSection , false ) ; 
       }
       elFileProvider.removeEventListener('change',fileProviderSelected,false);
       elParseButtonProvider.removeEventListener('click',uploadFileProvider,false);

       elTimezonePicker.removeEventListener('change',getTimezonePicker,false);
       //elDaylightPicker.removeEventListener('change',setDaylightPicker,false);
    
  
      }
    };
  };
  