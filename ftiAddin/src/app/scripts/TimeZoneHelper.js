const moment = require('moment-timezone');

/**
 * This produces the value to be added to the source time to adjust according to the relative time zone difference.
 * @param {string} sourceTz The source time zone database name e.g. Africa/Algiers or Europe/Zurich
 * @param {string} destTz The destination time zone database name e.g. Africa/Algiers or Europe/Zurich
 * @returns The net offset to be added to the source time to correct for time zone difference.
 */
function GetTimeZoneOffset(sourceTz, destTz)
{
   let output = 0;
   if (sourceTz !== destTz) {
      let sourceTzInt = parseInt(moment.tz(sourceTz).format('Z').split(':')[0]); 
      console.log(sourceTzInt);
      let destTzInt = parseInt(moment.tz(destTz).format('Z').split(':')[0]); 
      console.log(destTzInt);
      output = sourceTzInt - destTzInt;
   }
   return output;
}

module.exports = {
   GetTimeZoneOffset
}