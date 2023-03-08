const { DateTime } = require("luxon");

/**
 * Gets a local javascript date adjusted from a remotely created one.
 * @param {Object} inputDate A javascript date object.
 * @param {String} remoteZone The remote time zone string. e.g. Europe/Zurich
 * @param {String} localZone The local time zone string.
 * @returns A javascript date object containing the local representation of the input date.
 */
function getDateAdjusted(inputDate, remoteZone, localZone) {
   const remoteDate = DateTime.fromISO(inputDate.toISOString().slice(0, -1), { zone: remoteZone });
   console.log(`remoteDate: ${remoteDate.toString()}`);
   const localDate = remoteDate.setZone(localZone);
   console.log(`localDate: ${localDate.toString()}`);
   return localDate.toJSDate();
}

/**
 * Gets a local javascript date adjusted from a remotely created one.
 * @param {Object} inputDateISO An ISO 8601 formatted string.
 * @param {String} remoteZone The remote time zone string. e.g. Europe/Zurich
 * @param {String} localZone The local time zone string.
 * @returns A javascript date object containing the local representation of the input date.
 */
function getISODateAdjusted(inputDateISO, remoteZone, localZone) {
   const remoteDate = DateTime.fromISO(inputDateISO.slice(0, -1), { zone: remoteZone });
   console.log(`remoteDate: ${remoteDate.toString()}`);
   const localDate = remoteDate.setZone(localZone);
   console.log(`localDate: ${localDate.toString()}`);
   return localDate.toJSDate();
}

module.exports = {
   getDateAdjusted,
   getISODateAdjusted
}