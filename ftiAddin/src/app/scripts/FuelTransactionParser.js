const parsers = require('./Parsers');
const converters = require('./Converters');
const wexHelper = require('./WexHelper');
const productTypeHelper = require('./ProductTypeHelper');

/**
 * Parses the fuel transactions
 * @returns
 */
function FuelTransactionParser(transactions, headings, dateFormat) {
  transactions.forEach((transaction) => {
    console.log(transaction[0]);
  });
}

/**
 * Parse a single transaction asynchronously for the new provider implementation
 */
async function parseTransactionAsync(transaction, provider) {
  var newTranscationObj = new FuelTransactionProvider();

  for (var prop in provider) {
    if (provider[prop] == null) {
      provider[prop] = '';
    } //if json file has null field change in ''
  }

  //check of the mandatory fields
  //Stop the execution
  if (
    provider['licencePlate'] == '' &&
    provider['vehicleIdentificationNumber'] == '' &&
    provider['serialNumber'] == ''
  ) {
    console.log(
      'Not mapped into Json file, Licence Plate or Vin or Serial Number is needed'
    );
    // window.alert(
    //   'Licence Plate, VIN and Serial Number are not mapped into Json file at least one must be filled'
    // );
    // clearAllForException();
  } else {
    if (
      transaction[provider['licencePlate']] == '' ||
      transaction[provider['licencePlate']] == undefined
    ) {
      if (
        transaction[provider['vehicleIdentificationNumber']] == '' ||
        transaction[provider['vehicleIdentificationNumber']] == undefined
      ) {
        if (
          transaction[provider['serialNumber']] == '' ||
          transaction[provider['serialNumber']] == undefined
        ) {
          console.log('One of Licence Plate or Vin or Serial Number is needed');
          //   window.alert(
          //     'Licence Plate, VIN and Serial Number are not present, at least one must be filled'
          //   );
          //   clearAllForException();
        }
      }
    }
  }

  for (var prop in provider) {
    switch (prop) {
      case 'comments':
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          if (transaction[provider[prop]].length > 1024) {
            newTranscationObj[prop] = transaction[provider[prop]].substring(
              0,
              1024
            );
          }
          newTranscationObj[prop] = transaction[provider[prop]];
        }
        break;
      case 'description':
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          if (transaction[provider[prop]].length > 255) {
            newTranscationObj[prop] = transaction[provider[prop]].substring(
              0,
              255
            );
          }
          newTranscationObj[prop] = transaction[provider[prop]];
        }
        break;
      case 'driverName':
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          if (transaction[provider[prop]].length > 255) {
            newTranscationObj[prop] = transaction[provider[prop]].substring(
              0,
              255
            );
          }
          newTranscationObj[prop] = transaction[provider[prop]];
        }
        break;
      case 'externalReference':
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          if (transaction[provider[prop]].length > 255) {
            newTranscationObj[prop] = transaction[provider[prop]].substring(
              0,
              255
            );
          }
          newTranscationObj[prop] = transaction[provider[prop]];
        }
        break;
      case 'licencePlate':
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          if (transaction[provider[prop]].length > 255) {
            transaction[provider[prop]].substring(0, 255);
          }
          newTranscationObj[prop] = transaction[provider[prop]]
            .toUpperCase()
            .replace(/\s/g, '');
        }
        break;
      case 'serialNumber':
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          newTranscationObj[prop] = transaction[provider[prop]]
            .toUpperCase()
            .replace(/\s/g, '');
        }
        break;
      case 'siteName':
        if (provider[prop] != '') {
          if (typeof provider[prop] === 'object') {
            for (var inner in provider[prop]) {
              if (
                transaction[provider[prop][inner]] != '' &&
                transaction[provider[prop][inner]] != undefined
              ) {
                newTranscationObj[prop] +=
                  transaction[provider[prop][inner]] + ' ';
              }
            }
            newTranscationObj[prop] = newTranscationObj[prop].slice(0, -1);
            /*
                            //call the function to get the coordinates
                            locationCoordinatesProvider =await getCoordFromAddressProvider(newTranscationObj[prop]);
                            console.log('3:locationCoordinatesProvider ',locationCoordinatesProvider);  
                            console.log(locationCoordinatesProvider);
                            //newTranscationObj['location']['x']= locationCoordinatesProvider[0]['x'];
                            //newTranscationObj['location']['y']= locationCoordinatesProvider[0]['y'];
                            console.log(newTranscationObj);
                            //put locationCoordinatesProvider into location
                        */
          } else {
            newTranscationObj[prop] = transaction[provider[prop]];
          }
        }
        break;
      case 'vehicleIdentificationNumber':
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          newTranscationObj[prop] = transaction[provider[prop]]
            .toUpperCase()
            .replace(/\s/g, '');
        }
        break;
      case 'cost':
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          newTranscationObj[prop] = parseFloat(
            transaction[provider[prop]].replace(/,/g, '.')
          );
        } else {
          newTranscationObj[prop] = null;
        }
        break;
      case 'currencyCode':
        // check if currency is defined in the template, if not check in column mapping
        if (currencyCodeMapped != '' && currencyCodeMapped != undefined) {
          currencyCodeMapped = currencyCodeMapped.trim().toUpperCase();
          currencyCodeMapped = currencyCodeMapped.replace(/[^a-zA-Z]/g, '');
          if (!cc.codes().includes(currencyCodeMapped.toUpperCase())) {
            // window.alert(
            //   'Invalid format for currency: ' +
            //     currencyCodeMapped +
            //     '\n' +
            //     ' Please follow ISO 4217 3-letter standard for representing currency. Eg: USD'
            // );
            // clearAllForException();
          } else {
            newTranscationObj[prop] = currencyCodeMapped;
          }
        } else {
          if (
            transaction[provider[prop]] != undefined &&
            transaction[provider[prop]] != ''
          ) {
            currencyCodeMapped = transaction[provider[prop]]
              .trim()
              .toUpperCase();
            currencyCodeMapped = currencyCodeMapped.replace(/[^a-zA-Z]/g, '');

            if (!cc.codes().includes(currencyCodeMapped.toUpperCase())) {
              //   window.alert(
              //     'Invalid format for currency: ' +
              //       currencyCodeMapped +
              //       '\n' +
              //       ' Please follow ISO 4217 3-letter standard for representing currency. Eg: USD'
              //   );
              //   clearAllForException();
            } else {
              newTranscationObj[prop] = currencyCodeMapped;
            }
          } else {
            if (transaction[provider[prop]] != '') {
              newTranscationObj[prop] = null;
            }
          }
        }
        break;
      case 'dateTime':
        dateHoursComposed = dateFormat;
        if (provider[prop] != '') {
          isCellDateType = isCellDateType.toUpperCase();
          if (isCellDateType != 'Y' && isCellDateType != 'N') {
            console.log(
              'isCellDateType is the cell type in the xlsx, can be Y or N, please check the JSON mapping file'
            );
            // window.alert(
            //   'isCellDateType is the cell type in the xlsx, can be Y or N, please check the JSON mapping file'
            // );
            // clearAllForException();
          }
          //check if is an obj, if so means that date is composed by 2 cells
          if (typeof provider[prop] === 'object' && provider[prop].length > 1) {
            if (
              transaction[provider[prop][0]] != '' &&
              transaction[provider[prop][0]] != undefined &&
              transaction[provider[prop][1]] != undefined &&
              transaction[provider[prop][1]] != undefined
            ) {
              if (isCellDateType == 'Y') {
                dateHoursComposed = 'MM/DD/YYYY' + ' ' + hourFormat;
              } else {
                dateHoursComposed = dateFormat + ' ' + hourFormat;
              }

              //remove the spaces before and after
              transaction[provider[prop][0]] =
                transaction[provider[prop][0]].trim();
              transaction[provider[prop][1]] =
                transaction[provider[prop][1]].trim();
              transaction[provider[prop][0]] = transaction[
                provider[prop][0]
              ].slice(0, 10);

              if (transaction[provider[prop][1]].length >= hourFormat.length) {
                console.log(
                  'Split',
                  transaction[provider[prop][1]].slice(0, hourFormat.length)
                );
                transaction[provider[prop][1]] = transaction[
                  provider[prop][1]
                ].slice(0, hourFormat.length);
                console.log(
                  'Split',
                  transaction[provider[prop][1]].slice(0, hourFormat.length)
                );
              }
              newTranscationObj[prop] = getDateValueProvider(
                transaction[provider[prop][0]] +
                ' ' +
                transaction[provider[prop][1]]
              );
            } else {
              console.log('Date Fields are empty or invalid');
              //   window.alert('Date Fields are empty or invalid');
              //   clearAllForException();
            }
          } else {
            if (isCellDateType == 'Y') {
              dateHoursComposed = 'MM/DD/YYYY HH:mm:ss';
            } else {
              dateHoursComposed = dateFormat;
            }
            newTranscationObj[prop] = getDateValueProvider(
              transaction[provider[prop]]
            );
          }
        }
        break;
      case 'odometer':
        var tmp;
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          tmp = transaction[provider[prop]].replace(/,/g, '.');
          newTranscationObj[prop] = parseFloat(tmp).toFixed(1);
          unitOdoKm = unitOdoKm.toUpperCase();
          if (unitOdoKm != 'Y' && unitOdoKm != 'N') {
            console.log(
              'Units of Odometer field mapping in Json file must be 1 characters either Y or N'
            );
            // window.alert(
            //   'Units of Odometer field mapping in Json file must be 1 characters either Y or N'
            // );
            // clearAllForException();
          } else if (unitOdoKm != 'Y') {
            tmp = milesToKm(transaction[provider[prop]]);
            newTranscationObj[prop] = parseFloat(tmp).toFixed(1);
          }
        } else {
          if (
            transaction[provider[prop]] == '' ||
            transaction[provider[prop]] == undefined
          )
            newTranscationObj[prop] = null;
        }

        break;

      case 'productType':
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          newTranscationObj[prop] = getProductType(transaction[provider[prop]]);
        }
        break;
      case 'volume':
        var tmp;
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          tmp = transaction[provider[prop]].replace(/,/g, '.');
          newTranscationObj[prop] = parseFloat(tmp).toFixed(1);
          unitVolumeLiters = unitVolumeLiters.toUpperCase();
          if (unitVolumeLiters != 'Y' && unitVolumeLiters != 'N') {
            console.log(
              'Units of Fuel Volume field mapping in Json file must be 1 characters either Y or N'
            );
            // window.alert(
            //   'Units of Fuel Volume field mapping in Json file must be 1 characters either Y or N'
            // );
            // clearAllForException();
          } else if (unitVolumeLiters != 'Y') {
            tmp = gallonsToLitres(transaction[provider[prop]]);
            newTranscationObj[prop] = parseFloat(tmp).toFixed(1);
          }
        } else {
          if (
            transaction[provider[prop]] == '' ||
            transaction[provider[prop]] == undefined
          )
            newTranscationObj[prop] = null;
        }

        break;

      default:
        if (
          transaction[provider[prop]] != undefined &&
          transaction[provider[prop]] != ''
        ) {
          newTranscationObj[prop] = transaction[provider[prop]];
        }
        break;
    }
  }
  return newTranscationObj;
}

module.exports = {
  FuelTransactionParser,
};
