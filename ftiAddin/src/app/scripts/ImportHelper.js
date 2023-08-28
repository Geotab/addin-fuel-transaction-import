/**
 * Primary entry point for the fuel transaction import process.
 * @param {Object} api The Geotab api.
 * @param {Array} transactions An Array of JSON transactions to be inserted.
 * @param {string} elProgressText The progress text reference.
 * @param {Object} elprogressBar The progress bar reference.
 * @param {number} batchSize The number of transaction calls to add per iteration.
 * @param {number} pauseLengthMs Time in milliseconds to pause between transaction call add iterations.
 */
function importTransactionsPromise(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs, transactionsOfText, processedText) {

    return new Promise ((resolve, reject) => {

        let importSummary = {
            imported: 0,
            skipped: 0,
            errors: {
                count: 0,
                failedCalls: []
            }
        }

        postFuelTransCallBatchesNewAsync(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs, importSummary, transactionsOfText, processedText)
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
async function postFuelTransCallBatchesNewAsync(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs, importSummary, transactionsOfText, processedText) {

    // total number of transactions
    let transactionCount = transactions.length;

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
            let transBatch = transactions.slice(i, endPoint);
            
            let transactionChunks = postFuelTransCallsPromise(api, transBatch, importSummary);
            await Promise.allSettled(transactionChunks);
            await updateProgress(endPoint, transactionCount, endPoint, transactionCount, elProgressText, elprogressBar, transactionsOfText, processedText);
            //await sleep(pauseLengthMs);
        }
        i++;
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
async function updateProgress(dividend, divisor, numberCompleted, total, elProgressText, elprogressBar, transactionsOfText, processedText) {
    return new Promise(resolve => {
        elprogressBar.value = (dividend / divisor) * 100;
        elProgressText.innerText = numberCompleted + '\u00a0' + transactionsOfText + '\u00a0' + total + '\u00a0' + processedText;
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
                            importSummary.skipped += 1;
                        } else {
                            importSummary.errors.count += 1;
                            importSummary.errors.failedCalls.push([JSON.stringify(currentCall.entity), error]);
                        }
                    }
                    else if (typeof(error) === 'string') {
                        // string error instance
                        // console.log('string error instance, value: ' + error);
                        if (error.includes('DuplicateException')) {
                            importSummary.skipped += 1;
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