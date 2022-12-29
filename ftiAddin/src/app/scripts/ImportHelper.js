/**
 * Primary entry point for the fuel transaction import process.
 * @param {Object} api The Geotab api.
 * @param {Array} transactions An Array of JSON transactions to be inserted.
 * @param {string} elProgressText The progress text reference.
 * @param {Object} elprogressBar The progress bar reference.
 * @param {number} batchSize The number of transaction calls to add per iteration.
 * @param {number} pauseLengthMs Time in milliseconds to pause between transaction call add iterations.
 */
function importTransactionsPromise(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs) {

    return new Promise ((resolve, reject) => {

        let importSummary = {
            imported: 0,
            skipped: 0,
            errors: {
                count: 0,
                failedCalls: []
            }
        }

        postFuelTransCallBatchesAsync(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs, importSummary)
        .then( _ => {
            console.log('After ExecutePromises...');
            console.log('importSummary: ' + importSummary);
            resolve(importSummary);
        })
        .catch( rej => {
            console.log('After ExecutePromises exception: ' + rej);
            reject(importSummary);
        });

    });
}

/**
 * An asynchronous sleep implementation.
 * @param {*} ms Time in milliseconds to pause.
 * @returns 
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fuel transaction batch manager.
 * @param {Object} api The Geotab api.
 * @param {Array} transactions An Array of JSON transactions to be inserted.
 * @param {string} elProgressText The progress text reference.
 * @param {Object} elprogressBar The progress bar reference.
 * @param {number} batchSize The number of transaction calls to add per iteration.
 * @param {number} pauseLengthMs Time in milliseconds to pause between transaction call add iterations.
 * @param {JSON} importSummary The import summary.
 * @returns 
 * */
async function postFuelTransCallBatchesAsync(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs, importSummary) {
    let transactionCount = transactions.length;
    let transactionChunks = [];
    for (let i = 0; i < transactions.length; i += batchSize) {
        await sleep(pauseLengthMs);
        const transBatch = transactions.slice(i, i + batchSize);
        transactionChunks.push(postFuelTransCallsPromise(api, transBatch, importSummary));
        elprogressBar.value = (batchSize / transactionCount) * 100;
        elProgressText.innerText = batchSize + ' transaction/s of ' + transactionCount + ' processed...';
    };
    elprogressBar.value = (transactionCount / transactionCount) * 100;
    elProgressText.innerText = transactionCount + ' transaction/s of ' + transactionCount + ' processed...';
}

/**
 * Posts all transactions supplied to the Geotab api.
 * @param {Object} api The Geotab api.
 * @param {Array} transactions An Array of JSON transactions to be inserted
 * @param {JSON} importSummary The import summary.
 * @returns A promise
 * */
function postFuelTransCallsPromise(api, transactions, importSummary) {
    new Promise((resolve, reject) => {

        var currentCall = [];
        const promises = transactions.map(transaction => 
            new Promise((resolve, reject) => {
                currentCall = { typeName: 'FuelTransaction', entity: transaction };
                console.log('posting call: ' + JSON.stringify(currentCall));

                api.call('Add', currentCall,
                    function (result) {
                        // Successful import
                        importSummary.imported += 1;
                        resolve(null);
                    }, function (error) {
                        if (error instanceof Object) {
                            //MyGeotab API call error object
                            console.log('message: ' + error.message);
                            console.log('name: ' + error.name);
                            console.log('isAuthenticationException: ' + error.isAuthenticationException);
                            console.log('isDBInitializingException: ' + error.isDBInitializingException);
                            console.log('isServerException: ' + error.isDBInitializingException);
                            if (error.name.includes('DuplicateException')) {
                                importSummary.skipped += 1;
                            } else {
                                importSummary.errors.count += 1;
                                importSummary.errors.failedCalls.push([JSON.stringify(currentCall.entity), error]);
                            }
                        }
                        else if (typeof(error) === 'string') {
                            // string error instance
                            console.log('string error instance, value: ' + error);
                            if (error.includes('DuplicateException')) {
                                importSummary.skipped += 1;
                            } else {
                                importSummary.errors.count += 1;
                                importSummary.errors.failedCalls.push([JSON.stringify(currentCall.entity), error]);
                            }
                        }
                        // resolve(null);
                    });

            }));
            resolve(null);
    });
}

module.exports = {
    importTransactionsPromise
}