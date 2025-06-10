/**
 * Primary entry point for the fuel transaction import process.
 * @param {Object} api The Geotab api.
 * @param {Array} transactions An Array of JSON transactions to be inserted.
 * @param {string} elProgressText The progress text reference.
 * @param {Object} elprogressBar The progress bar reference.
 * @param {number} batchSize The number of transaction calls to add per iteration.
 * @param {number} pauseLengthMs Time in milliseconds to pause between transaction call add iterations.
 */
function importTransactionsPromise(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs, transactionsOfText, processedText, rateLimitText) {

    return new Promise ((resolve, reject) => {

        let importSummary = {
            imported: 0,
            skipped: 0,
            errors: {
                count: 0,
                failedCalls: []
            }
        }

        postFuelTransCallBatchesNewAsync(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs, importSummary, transactionsOfText, processedText, rateLimitText)
        .then( _ => {
            resolve(importSummary);
        })
        .catch( rej => {
            reject(importSummary);
        });

    });
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
async function postFuelTransCallBatchesNewAsync(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs, importSummary, transactionsOfText, processedText, rateLimitText) {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    let transactionCount = transactions.length;
    let i = 0;
    let isRetryAttempt = false;

    await updateProgress(0, transactionCount, elProgressText, elprogressBar, transactionsOfText, processedText);
    
    while (i < transactionCount) {
        let endPoint = i + batchSize;
        let transBatch = transactions.slice(i, endPoint);
        
        try {
            let transactionChunks = postFuelTransCallsPromise(api, transBatch, importSummary, isRetryAttempt);
            await Promise.all(transactionChunks);
            
            await updateProgress(endPoint, transactionCount, elProgressText, elprogressBar, transactionsOfText, processedText);
            
            i = endPoint;
            isRetryAttempt = false;
        } catch (error) {
            // If we catch a rate limit error wait and retry the same batch
            if ((error instanceof Object && error.name.includes('OverLimitException')) ||
                (typeof error === 'string' && error.includes('OverLimitException'))) {
                await updateProgress(endPoint - batchSize, transactionCount, elProgressText, elprogressBar, transactionsOfText, processedText, rateLimitText);
                await sleep(pauseLengthMs);
                isRetryAttempt = true;
            } else {
                importSummary.errors.count += Math.min(batchSize, transactionCount - i);
                i = endPoint;
                isRetryAttempt = false;
            }
        }
    }
}

/**
 * Updates the progess of the import task in terms of 
 * @param {*} dividend 
 * @param {*} divisor 
 * @param {*} numberCompleted 
 * @param {*} total 
 * @param {*} elProgressText 
 * @param {*} elprogressBar 
 * @returns 
 */
async function updateProgress(numberCompleted, total, elProgressText, elprogressBar, transactionsOfText, processedText, rateLimitText = '') {
    return new Promise(resolve => {
        numberCompleted = Math.min(numberCompleted, total);
        elprogressBar.value = (numberCompleted / total) * 100;
        elProgressText.innerText = numberCompleted + '\u00a0' + transactionsOfText + '\u00a0' + total + '\u00a0' + processedText + rateLimitText;
        resolve();
    });
}

/**
 * Posts all transactions supplied to the Geotab api.
 * @param {Object} api The Geotab api.
 * @param {Array} transactions An Array of JSON transactions to be inserted
 * @param {JSON} importSummary The import summary.
 * @param {boolean} isRetryAttempt Indicates if this is a retry attempt after a rate limit error.
 * @returns A promise
 * */
function postFuelTransCallsPromise(api, transactions, importSummary, isRetryAttempt) {
    return transactions.map(transaction => 
        new Promise((resolve, reject) => {
            var currentCall = { typeName: 'FuelTransaction', entity: transaction };
            //console.log('posting call: ' + JSON.stringify(currentCall));

            api.call('Add', currentCall,
                function (result) {
                    // Successful import
                    importSummary.imported += 1;
                    // printImportSummary(importSummary);
                    resolve();
                }, function (error) {
                    if (error instanceof Object) {
                        //MyGeotab API call error object
                        // console.log('message: ' + error.message);
                        // console.log('name: ' + error.name);
                        // console.log('isAuthenticationException: ' + error.isAuthenticationException);
                        // console.log('isDBInitializingException: ' + error.isDBInitializingException);
                        // console.log('isServerException: ' + error.isDBInitializingException);
                        if (error.name.includes('DuplicateException')) {
                            if (!isRetryAttempt) {
                                importSummary.skipped += 1;
                            }
                        } else if (error.name.includes('OverLimitException')) {
                            reject(error);
                            return;
                        } else {
                            importSummary.errors.count += 1;
                            importSummary.errors.failedCalls.push([JSON.stringify(currentCall.entity), error]);
                        }
                    }
                    else if (typeof(error) === 'string') {
                        // string error instance
                        // console.log('string error instance, value: ' + error);
                        if (error.includes('DuplicateException')) {
                            if (!isRetryAttempt) {
                                importSummary.skipped += 1;
                            }
                        } else if (error.includes('OverLimitException')) {
                            reject(error);
                            return;
                        } else {
                            importSummary.errors.count += 1;
                            importSummary.errors.failedCalls.push([JSON.stringify(currentCall.entity), error]);
                        }
                    }
                    else {
                        // unknown error instance
                        // console.log('Unexpected error instance, value: ' + error);
                        importSummary.errors.count += 1;
                        importSummary.errors.failedCalls.push([JSON.stringify(currentCall.entity), 'Unexpected error']);
                    }
                    resolve();
                });

        }));
}

module.exports = {
    importTransactionsPromise
}