const moment = require('moment-timezone');

/**
 * Parses string values and returns a zero length string empty values.
 * @param {*} s The string to parse.
 * @returns The string returned.
 */
var parseStringValue = function (s) {
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

/**
 * Parses the length of a string and if it is greater than the length it is truncated to that length. 
 * @param {string} string The string to parse.
 * @param {number} length The length to check.
 * @returns The truncated string.
 */
function parseStringLength(string, length) {
    if (string.length > length) {
        return string.substring(0, length);
    }
    return string;
}



/** 
 *  returns a float value for a valid float or 0.0 otherwise
 */
var parseFloatValue = function (float) {
    var value = parseFloat(float);
    return isNaN(value) ? 0.0 : value;
};

/**
 * Parses the input date and produces an ISO 8601 formatted result where possible.
 * If the date is not an ISO formatted input date (not a valid date format) an attempt is made to apply the time zone to the result.
 * @param {JSON} configuration The JSON configuration.
 * @param {Array} inputDate The input date array.
 * @param {string} timeZone The time zone required.
 * @returns An ISO 8601 (GMT time zone) formatted date.
 */
function parseDate(configuration, inputDate, timeZone) {
    let date;
    let dateFormat;

    if (configuration.timeFormat.length > 0) {
        // date and time are split into two columns.
        date = combineDateAndTime(inputDate[0], inputDate[1]);
        dateFormat = configuration.dateFormat + ' ' + configuration.timeFormat;
        // If date and time are split cell date type can't be set.
        configuration.isCellDateType = 'N';
    } else {
        // date or date and time is/are contained in a single column.
        date = inputDate[0];
        dateFormat = configuration.dateFormat;
    }

    if (configuration.isCellDateType === 'Y') {
        // ISO 8601 format is a UTC and therefore does not require time zone calculation.
        if ((isIsoDate(date))||(typeof date === 'object')) {
            return date;
        }
    } else {
        if (moment.tz(date, dateFormat, timeZone).isValid()) {
            return moment.tz(date, dateFormat, timeZone).toISOString();
        } else {
            return null;
        }
    }
}

/**
 * The method combines two separate date and time values to produce a date object;
 * @param {*} date The date representation of the new date/time.
 * @param {*} time The time representation of the new date/time.
 * @returns A new date/time object combining the date and time inputs to a single date. If the inputs don't match any expected value a null is returned.
 */
function combineDateAndTime(date, time)
{
    // if the date and time are date objects
    if ((isDateObject(date)) && (isDateObject(time))) {
        return new Date(date.toDateString() + ' ' + time.toLocaleTimeString());
    }
    if ((isDateObject(date)) && (isDateObject(time) == false))
    {
        return new Date(date.toDateString() + ' ' + time.trim());
    }
    if ((isDateObject(date) == false) && (isDateObject(time) == false))
    {
        return date.trim() + ' ' + time.trim();
    }
    return null;
}

function isDateObject(date)
{
    if (typeof(date) == 'object') {
        return true;
    }
    return false;
}

/**
 * Checks whether the input string is an ISO 8601 formatted date value.
 * @param {String} str The input test string.
 * @returns True if the input string is a valid ISO date and False otherwise.
 */
function isIsoDate(str) {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
    const d = new Date(str);
    return d instanceof Date && !isNaN(d) && d.toISOString() === str; // valid date 
}

/**
 * Parses the date format string submitted in the configuration file. e.g. YYYYMMDD or MM-DD-YYYY HH:mm:ss etc.
 * @param {String} format The format to parse
 * @returns An object containing a boolean (ReturnValue) indicating a good structure (true) or a poorly formatted date (false) and a reason (Problem) if the date is poorly formatted.
 */
function parseDateFormat(format) {
    let output = {
        'ReturnValue': false,
        'Problem': ''
    };
    let regex = new RegExp('^(?=.*DD)(?=.*MM)(?=.*YY).*$');
    // Test1 - Must contain CAPITAL YYYY, MM and DD
    if (regex.test(format)) {
        console.log('Contains - CAPITAL YY, MM and DD')
    } else {
        output.ReturnValue = false;
        output.Problem = 'Does not contain CAPITAL YY, MM and DD';
        console.log(output.Problem)
        return output;
    }

    // Test2 - If longer than 11 characters then must contain h and m (any case)
    if (format.length > 11) {
        regex = new RegExp('^(?=.*[H|h])(?=.*m).*$');
        if (regex.test(format)) {
            console.log('Longer than 11 characters then must contain h and m = TRUE')
        } else {
            output.ReturnValue = false;
            output.Problem = 'Longer than 11 characters and does not contain h and m.';
            console.log(output.Problem)
            return output;
        }
    }
    // Test3 - Only characters allowed -  Y, M, D, h, m, s, S or Z
    regex = new RegExp('^[^abcefgijklnopqrtuvwxzABCEFGIJKLNOPQRUVWX]+$');
    if (regex.test(format)) {
        console.log('Contains only allowed characters.')
    } else {
        output.ReturnValue = false;
        output.Problem = 'Contains disallowed characters other than Y, M, D, h, m, s, S or Z.';
        console.log(output.Problem)
        return output;
    }

    // Test4 - Min number of characters = 6
    if (format.length < 6) {
        output.ReturnValue = false;
        output.Problem = 'Shorter than 6 characters.';
        console.log(output.Problem)
        return output;
    }
    // Test5 - Max number of characters = 24
    if (format.length > 24) {
        output.ReturnValue = false;
        output.Problem = 'Greater than 24 characters.';
        console.log(output.Problem)
        return output;
    }

    // all rules satisfied so return true
    output.ReturnValue = true;
    return output;
}

/**
 * Gets the headings from the transaction data
 * @param {object} data The JSON configuration data object section.
 * @returns 
 */
function getHeadings(data) {
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

/**
 * todo: Not clear why this was in the existing release - add the documentation for this later if used.
 * @param {*} transactions An object containing the fuel transaction data (and error data which is irrelevant to this process).
 * @returns 
 */
var addBlanckColumn = function (transactions) {
    for (var i = 0; i < transactions.data.length; i++) {
        // get Headers object as master to compare, because header cannot 
        // be empty
        var keysHeader = Object.keys(transactions.data[0]);
        var keysTempTransaction = Object.keys(transactions.data[i]);

        var z = 0;
        var tempVar = z;
        for (z; z < keysHeader.length; z++) {
            // Compare the column header with the transaction column
            // if not match I add column with key equal to Header name
            // and value=null
            if (keysHeader[z] != keysTempTransaction[tempVar]) {
                transactions.data[i][keysHeader[z]] = '';
                keysTempTransaction = Object.keys(transactions.data[i]);
            }
            else { tempVar++; }
        }
    }
    return transactions;
};

/**
 * Gets the location coordinates from the transaction based on the configuration data settings.
 * @param {object} configuration The JSON configuration input.
 * @param {object} transaction The JSON transaction input.
 * @returns A JSON object containing the geographical location coordinates. X indicates longitude and y latitude. null is returned if no validate location data is found.
 */
function parseLocation(value) {
    let output = null;
    if (Array.isArray(value) && (value.length === 2)) {
        output = {
            'x': value[0],
            'y': value[1]
        }
    }
    return output;
}

module.exports = {
    parseStringValue,
    parseStringLength,
    parseFloatValue,
    isIsoDate,
    parseDate,
    getHeadings,
    addBlanckColumn,
    parseDateFormat,
    parseLocation
}