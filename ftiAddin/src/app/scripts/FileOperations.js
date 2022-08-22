const { rejects } = require("yeoman-assert");
const utils = require('./Utils');

/**
 * Sends the excel file to the ExcelToJson API call and returns the data in JSON format if successful.
 * If successful the uploadComplete function is executed.
 * The function is executed when the open file button is pushed. 
 * @param {*} api 
 */
function uploadFile (api) {
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
                fd.append('fileToUpload', elFiles.files[0]);

                // upload completed
                xhr.addEventListener('load', resolve, false);
                xhr.addEventListener('error', reject, false);
                xhr.addEventListener('abort', reject, false);

                xhr.open('POST', utils.getUrl());
                // if (getUrl() == 'http://localhost/apiv1') {
                //     xhr.open('POST', 'https://proxy.geotab.com/apiv1');
                // }
                // else {
                //     xhr.open('POST', utils.getUrl());
                // }

                xhr.send(fd);
            } else {
                //ie9
                //iframeUpload(elForm, getUrl(), parameters);
            }
            database = credentials.database;
        });
    });
};

module.exports = {
    uploadFile
}