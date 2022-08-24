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
 * Parses an xhr response text to confirm it is valid Json format.
 * @param {XMLHttpRequest} request The XMLHttpRequest object.
 * @returns An object containing two properties: data and error. The data property contains the JSON data and the error property contains any errors that might have occurred.
 */
    var resultsParser = function (request) {
    var jsonResponse,
        data,
        error;
    if (request.target && request.target.responseText.length > 0) {
        jsonResponse = JSON.parse(request.target.responseText);
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
    parseFloatValue,
    parseDateValue,
    resultsParser,
    addBlanckColumn
}