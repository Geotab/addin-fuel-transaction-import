'use strict';

const { DateTime } = require('luxon');
const { DateError } = require('./date-error');
 
// class DateError extends Error {
//    constructor(message) {
//      super(message);
//    }
// }

/**
 * Formats a date/time unit to 2 places if only a single value.
 * @param {*} unit The date/time unit to format.
 * @returns A double digit date/time unit.
 */
function formatDateUnit(unit) {
   let output = unit.toString();
   if (output.length === 1) {
      output = '0' + output;
   }
   // console.log(output);
   return output;
}

/**
 * Formats the JavaScript date in the ISO 8601 format (less the Z) e.g. 2017-07-15T14:00:00.000
 * @param {*} date The date to format
 * @returns An ISO 8601 formatted date e.g. 2017-07-15T14:00:00.000
 */
function getISODateFormat(date) {
   const myDate = 
      date.getFullYear() + '-' 
      + formatDateUnit(date.getMonth() + 1) + '-' 
      + formatDateUnit(date.getDate());
   const myTime = 
      formatDateUnit(date.getHours()) + ':' 
      + formatDateUnit(date.getMinutes()) + ':' 
      + formatDateUnit(date.getSeconds()) + '.000';
   const isoDate = myDate + 'T' + myTime;
   //console.log(`isoDate ${isoDate}`);
   return isoDate;
}

/**
 * Gets a local javascript date adjusted from a remotely created one.
 * @param {Object} inputDate A javascript date object.
 * @param {String} remoteZone The remote time zone string. e.g. Europe/Zurich
 * @param {String} localZone The local time zone string.
 * @returns A javascript date object containing the local representation of the input date.
 */
function getDateAdjusted(inputDate, remoteZone, localZone) {
   // console.log(`inputDate toLocaleString: ${inputDate.toLocaleString()}`);
   // console.log(`inputDate toISOString: ${inputDate.toISOString()}`);
   const isoDate = getISODateFormat(inputDate);
   // console.log(`isoDate: ${isoDate}`);
   const remoteDate = DateTime.fromISO(isoDate, { zone: remoteZone });
   //const remoteDate = DateTime.fromISO(inputDate.toISOString().slice(0, -1), { zone: remoteZone });
   // console.log(`remoteDate: ${remoteDate.toString()}`);
   const localDate = remoteDate.setZone(localZone);
   // console.log(`localDate: ${localDate.toString()}`);
   return localDate.toJSDate();
}

/**
 * isEmpty check
 * @param {*} value 
 * @returns 
 */
function isEmpty(value) {
   return (value == null || value.length === 0);
}

/**
 * Tests whether an input is a JavaScript date object
 * @param {*} date The input date.
 * @returns true if yes and false if no.
 */
function isDateObject(date) {
   if (typeof (date) == 'object') {
       return true;
   }
   return false;
}

function getDataType(date) {
   switch (typeof(date)) {
      case 'number':
         return 
   }
}

/**
 * The method combines two separate date and time values to produce a single date object;
 * @param {*} date The date representation of the new date/time.
 * @param {*} time The time representation of the new date/time.
 * @param {object} Contains the error message translations
 * @returns A new date/time object combining the date and time inputs to a single date. If the inputs don't match any expected value a null is returned.
 */
function combineDateAndTime(date, time, combineDateTimeErrorMessageTranslations) {
   // if the date and time are date objects
   if ((isDateObject(date)) && (isDateObject(time))) {
      const datetime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                        time.getHours(), time.getMinutes(), time.getSeconds());
      return datetime;
   } else if ((isDateObject(date) == false) && (isDateObject(time) == false)) {
       return date.trim() + ' ' + time.trim();
   } else {
      let errorMessage = `${combineDateTimeErrorMessageTranslations.part1} ${date}, ${combineDateTimeErrorMessageTranslations.part2} ${time}. ${combineDateTimeErrorMessageTranslations.part3}`;
      throw new DateError(errorMessage);
   }
}

/**
 * Using the Luxon library a JavaScript date is produced from a date string and it's relevant format.
 * Uses the Luxon library implementation.
 * @param {string} dateString A date in string format.
 * @param {string} format A luxon format string.
 * @returns 
 */
function getJSDateFromString(dateString, format) {
   const date = DateTime.fromFormat(dateString, format);
   if (date.isValid === false) {
      throw new DateError('Invalid date found.');
   }
   return date.toJSDate();
}

/**
 * Replaces getJSDate
 * @param {JSON} configuration The import configuration.
 * @param {Array} inputDate The input date array containing the date and/or the time.
 * @param {object} Contains the error message translations for the combineDateAndTime method.
 */
function getDate(configuration, inputDate, combineDateTimeErrorMessageTranslations) {
   let output;
   let date;
   let dateFormat = getDateFormat(configuration, inputDate);
   let isTimePresent = false;

   // Check the pre-conditions
   if (isEmpty(inputDate[0])) {
      throw new DateError('Pre-Condition: No input date found.');
   }
   if (isEmpty(configuration.dateFormat)) {
      throw new DateError('Pre-Condition: No configuration dateFormat found.');
   }
   isTimePresent = (isEmpty(inputDate[1]) === false);
   if (isTimePresent && (isEmpty(configuration.timeFormat))) {
      throw new DateError('Pre-Condition: Time found with no configuration timeFormat provided.');
   }

   switch (typeof (inputDate[0])) {
      case 'string':
         date = isTimePresent ? combineDateAndTime(inputDate[0], inputDate[1], combineDateTimeErrorMessageTranslations) : inputDate[0];
         output = getJSDateFromString(date, dateFormat);
         break;
      case 'object':
         output = isTimePresent ? combineDateAndTime(inputDate[0], inputDate[1], combineDateTimeErrorMessageTranslations) : inputDate[0];
         break;
      case 'number':
         date = isTimePresent ? combineDateAndTime(inputDate[0].toString(), inputDate[1].toString(), combineDateTimeErrorMessageTranslations) : inputDate[0].toString();
         output = getJSDateFromString(date, dateFormat);
         break;
      default:
         throw new DateError('Unexpected date format received.');
   }

   return output;
}


/**
 * Gets a valid javascript date from the input data if possible
 * @param {JSON} configuration JSON configuration.
 * @param {*} inputDate The input date.
 * @returns A JavaScript date Object
 */
function getJSDate(configuration, inputDate) {
   
   let output;
   let date;
   let dateFormat;

   if (isEmpty(inputDate[0])) {
      //TODO: state issue to fix.
      throw new DateError(state.translate('No input date at inception of getJSDate.'));
   } else {
       // date is populated
       if (inputDate[1]) {
           // time is populated
           date = combineDateAndTime(inputDate[0], inputDate[1]);
           if (isDateObject(date) === false)
           {
               // the date is a string object and therefore requires a format.
               // Both date and time formats must be provided as the date and time are stored in separate columns.
               if ((configuration.dateFormat) && (configuration.timeFormat)) {
                     dateFormat = configuration.dateFormat + ' ' + configuration.timeFormat;
               } else {
                  // the time format has not been supplied and therefore an exception.
                  return null;
               }
               // get the javascript date from the string format
               output = getJSDateFromString(date, dateFormat);
            } else {
               output = date;
            }
       } else {
         // time is NOT populated. date and time contained in a single cell.
         date = inputDate[0];
         if (isDateObject(date) === false)
         {
            dateFormat = configuration.dateFormat
            output = getJSDateFromString(date, dateFormat);
         } else {
            output = date;
         }
       }
   }
   return output;
}

/**
 * Retreives the date and time format string to be used for the Luxon API request.
 * @param {Object} configuration The configuration object
 * @param {Array} inputDate The date and/or time array
 * @returns 
 */
function getDateFormat(configuration, inputDate) {
   if (inputDate[1]){
      if ((configuration.dateFormat) && (configuration.timeFormat)) {
            return configuration.dateFormat + ' ' + configuration.timeFormat;
      } else {
         // the time format has not been supplied and therefore an exception.
         throw new DateError('The time has been supplied but no time format has been provided in the configuration file.');
      }
   } else {
      return configuration.dateFormat;
   }
}

/**
 * The primary date parsing method.
 * @param {*} configuration The JSON configuration
 * @param {*} inputDate The input date array
 * @param {*} remoteZone The remote time zone. The transaction time zone.
 * @param {*} localZone The local import time zone.
 * @param {object} Contains the error message translations for the combineDateAndTime method.
 * @returns An accurate JavaScript date for the relevant transaction.
 */
function parseDate(configuration, inputDate, remoteZone, localZone, combineDateTimeErrorMessageTranslations) {
   const jsDate = getDate(configuration, inputDate, combineDateTimeErrorMessageTranslations);
   // const jsDate = getJSDate(configuration, inputDate);
   const outputDate = getDateAdjusted(jsDate, remoteZone, localZone);
   return outputDate;
}

module.exports = {
   parseDate,
   getDateAdjusted,
   getJSDate,
   getDate
}