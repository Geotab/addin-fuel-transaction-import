const utils = require('./Utils');
const parsers = require('./Parsers');

/**
 * Sends the excel file to the ExcelToJson API call and returns the data in JSON format if successful.
 * @param {GeotabApi} The Geotab api.
 * @param {File} The file object.
 */
function convertExcelToJsonPromise (api, file) {
    return new Promise((resolve, reject) => {

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
                fd.append('fileToUpload', file);

                // upload completed
                xhr.addEventListener('load', resolve, false);
                xhr.addEventListener('error', reject, false);
                xhr.addEventListener('abort', reject, false);

                xhr.open('POST', utils.getUrl());
                xhr.send(fd);
            } else {
                //ie9
                //iframeUpload(elForm, getUrl(), parameters);
            }
            database = credentials.database;
        });
    });
};


/**
 * Parses an xhr (XMLHttpRequest) request response.
 * If successful the data object will contain the imported JSON formatted configuration file.
 * @param {XMLHttpRequest} request The XMLHttpRequest object.
 * @returns An object containing two properties: data and error. The data property contains the JSON formatted configuration data and the error property contains any errors that might have occurred during importing.
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
 * Executes when the excel transactions are converted to Json and the ExcelToJson call has completed.
 * This function serves as a transaction data parser and to finally set the transactions variable with the result. 
 * @param {XMLHttpRequest} request A request containing the transactions in json format.
 * @returns The parsed json transaction results or any errors encountered.
 */
function parseTransactions(request) {
    return new Promise((resolve, reject) => {
        console.log('in uploadCompletePromise...');
        console.log(request);
        var results = resultsParser(request);
        console.log(results);
        //var newResult = parsers.addBlanckColumn(result);
        if (results.error) {
            reject(results.error.message);
        }
        else if (results.data.length == 1) {
            reject('The file doesn\'t contain any transactions');
        }
        console.log(results.data);
        resolve(results.data);
    });
};

module.exports = {
    convertExcelToJsonPromise,
    parseTransactions
}