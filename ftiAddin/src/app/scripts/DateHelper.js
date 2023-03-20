'use strict';

const { DateTime } = require('luxon');

class DateError extends Error {
   constructor(message) {
     super(message);
   }
}

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
      + formatDateUnit(date.getUTCDate());
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

/**
 * The method combines two separate date and time values to produce a single date object;
 * @param {*} date The date representation of the new date/time.
 * @param {*} time The time representation of the new date/time.
 * @returns A new date/time object combining the date and time inputs to a single date. If the inputs don't match any expected value a null is returned.
 */
function combineDateAndTime(date, time) {
   // if the date and time are date objects
   if ((isDateObject(date)) && (isDateObject(time))) {
      const datetime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                        time.getHours(), time.getMinutes(), time.getSeconds());
      return datetime;
   } else if ((isDateObject(date) == false) && (isDateObject(time) == false)) {
       return date.trim() + ' ' + time.trim();
   } else {
      throw new DateError(`Date and/or time are in the incorrect state. Date: ${date}, Time: ${time}. Most likely one of them is formatted as a date and the other is not.`);
   }
}

/**
 * Using the Luxon library a JavaScript date is produced from a date string and it's relevant format.
 * Uses the Luxon library implementation.
 * @param {*} dateString 
 * @param {*} format 
 * @returns 
 */
function getJSDateFromString(dateString, format) {
   const date = DateTime.fromFormat(dateString, format);
   return date.toJSDate();
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
      throw new DateError('No input date at inception of getJSDate.');
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
 * The primary date parsing method.
 * @param {*} configuration The JSON configuration
 * @param {*} inputDate The input date array
 * @param {*} remoteZone The remote time zone. The transaction time zone.
 * @param {*} localZone The local import time zone.
 * @returns An accurate JavaScript date for the relevant transaction.
 */
function parseDate(configuration, inputDate, remoteZone, localZone) {
   const jsDate = getJSDate(configuration, inputDate);
   const outputDate = getDateAdjusted(jsDate, remoteZone, localZone);
   return outputDate;
}

module.exports = {
   parseDate,
   getDateAdjusted,
   getJSDate
}