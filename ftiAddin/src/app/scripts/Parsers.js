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
 * @param {*} string The string to parse.
 * @param {*} length The length to check.
 * @returns 
 */
function parseStringLength(string, length){
    if(string.length > length){
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
 * Parses date values to ISO format 8601 (UTC I believe).
 * The timezone is always zero UTC offset, as denoted by the suffix Z
 * @param {*} date The date value to parse
 * @returns The ISO format date
 */
var parseDateValue = function (date) {
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

    return fromOADate(parseFloatValue(date)).toISOString();
};

/**
 * input - date and format. the date must be checked against the format and ensured it is a valid date.
 * @param {*} date 
 * @param {*} format 
 * @param {String} timeZone The currently selected time zone.
 * @returns if a valid date then it is returned otherwise null if an invalid date.
 */
function parseDate(date, format, timeZone){
    // parses and returns the date if valid otherwise reports a moment invalid date type.
    // let myDate = moment(date, format);
    // let myDate = moment.tz(date, format, timeZone).format();
    if(moment.tz(date, format, timeZone).isValid()){
        return moment.tz(date, format, timeZone).toISOString();
    } else {
        return null;
    }
}

/**
 * Parses the date format string submitted in the configuration file. e.g. YYYYMMDD or MM-DD-YYYY HH:mm:ss etc.
 * @param {*} format The format to parse
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
    if (format.length > 11){
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
    if(format.length < 6){
        output.ReturnValue = false;
        output.Problem = 'Shorter than 6 characters.';
        console.log(output.Problem)
        return output;
    }
    // Test5 - Max number of characters = 24
    if(format.length > 24){
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
 * @param {*} data 
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

module.exports = {
    parseStringValue,
    parseStringLength,
    parseFloatValue,
    parseDateValue,
    parseDate,
    getHeadings,
    addBlanckColumn,
    parseDateFormat
}