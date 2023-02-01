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

        postFuelTransCallBatchesNewAsync(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs, importSummary)
        .then( _ => {
            console.log('After all transaction inserts are finished...');
            printImportSummary(importSummary);
            resolve(importSummary);
        })
        .catch( rej => {
            console.log('After ExecutePromises exception: ' + rej);
            printImportSummary(importSummary);
            reject(importSummary);
        });

    });
}

function printImportSummary(importSummary){
    console.log('Log Import Summary:')
    console.log('imported: ' + importSummary.imported);
    console.log('skipped: ' + importSummary.skipped);
    console.log('errors: ' + importSummary.errors.count);
    console.log('Timestamp: ' + new Date().toISOString());
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
 * Note: this works nicely but the progress bar does not work with this implementation.
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
        const transBatch = transactions.slice(i, i + batchSize);
        transactionChunks.push(postFuelTransCallsPromise(api, transBatch, importSummary));
        elprogressBar.value = (batchSize / transactionCount) * 100;
        elProgressText.innerText = batchSize + ' transaction/s of ' + transactionCount + ' processed...';
        console.log('importSummary.imported: ' + importSummary.imported);
        //await updateProgress(batchSize, transactionCount, batchSize, transactionCount, elProgressText, elprogressBar);
        await sleep(pauseLengthMs);
    };
    elprogressBar.value = (transactionCount / transactionCount) * 100;
    elProgressText.innerText = transactionCount + ' transaction/s of ' + transactionCount + ' processed...';
    //await updateProgress(transactionCount, transactionCount, transactionCount, transactionCount, elProgressText, elprogressBar);
}

/**
 * Fuel transaction batch manager (New).
 * @param {Object} api The Geotab api.
 * @param {Array} transactions An Array of JSON transactions to be inserted.
 * @param {string} elProgressText The progress text reference.
 * @param {Object} elprogressBar The progress bar reference.
 * @param {number} batchSize The number of transaction calls to add per iteration.
 * @param {number} pauseLengthMs Time in milliseconds to pause between transaction call add iterations.
 * @param {JSON} importSummary The import summary.
 */
async function postFuelTransCallBatchesNewAsync(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs, importSummary) {

    let transactionCount = transactions.length;
    let transactionChunks = [];

    let i = 0;
    let endPoint = 0;
    for (transaction in transactions)
    {
        if (i % batchSize === 0)
        {
            endPoint = i + batchSize;
            if (endPoint > transactionCount) {
                endPoint = transactionCount;
            }
            console.log('endPoint: ' + endPoint);
            const transBatch = transactions.slice(i, endPoint);
            transactionChunks.push(postFuelTransCallsPromise(api, transBatch, importSummary));
            await updateProgress(endPoint, transactionCount, endPoint, transactionCount, elProgressText, elprogressBar);
            await Promise.allSettled(transactionChunks);
            await sleep(pauseLengthMs);
        }
        i++;
    }
}

async function updateProgress(dividend, divisor, numberCompleted, total, elProgressText, elprogressBar) {
    return new Promise(resolve => {
        elprogressBar.value = (dividend / divisor) * 100;
        elProgressText.innerText = numberCompleted + ' transaction/s of ' + total + ' processed...';
        resolve();
    });
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
                //console.log('posting call: ' + JSON.stringify(currentCall));

                api.call('Add', currentCall,
                    function () {
                        // Successful import
                        importSummary.imported += 1;
                        printImportSummary(importSummary);
                        resolve();
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
                        else {
                            // unknown error instance
                            console.log('Unexpected error instance, value: ' + error);
                            importSummary.errors.count += 1;
                            importSummary.errors.failedCalls.push([JSON.stringify(currentCall.entity), 'Unexpected error']);
                        }
                        resolve();
                    });

            }));
            resolve();
    });
}

module.exports = {
    importTransactionsPromise
}