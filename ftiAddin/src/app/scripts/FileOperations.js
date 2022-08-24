const utils = require('./Utils');
const parsers = require('./Parsers');

/**
 * Sends the excel file to the ExcelToJson API call and returns the data in JSON format if successful.
 * If successful the uploadComplete function is executed.
 * The function is executed when the open file button is pushed. 
 * @param {*} api 
 */
function uploadFilePromise (api, file) {
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
                //fd.append('fileToUpload', elFiles.files[0]);

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
 * Provide file implementation...
 * Executes when the excel transactions are converted to Json and the ExcelToJson call has completed.
 * This function seems to serve as a transaction data parser and to finally set the transactions variable with the result. 
 * It then sets the UI state ready to import the transactions.
 * @param {XMLHttpRequest} request An XMLHttpRequest object containing the transactions
 * @returns Nothing is returned
 */
function uploadCompletePromise(request) {
    console.log('in uploadCompletePromise...');
    var result = parsers.resultsParser(request);
    console.log(request);
    console.log(result);
};

module.exports = {
    uploadFilePromise,
    uploadCompletePromise
}