/**
 * Imports the fuel transactions of the selected file for the config provider file implementation
 * @param {Object} api The Geotab api interface.
 * @param {JSON} transactions The JSON transaction list to be inserted.
 * @param {string} elProgressText The progress text html element reference.
 * @param {Object} elprogressBar The progress bar html element reference.
 * @param {callback} callback The callback for completion.
 */
async function importTransactionsAsync(api, transactions, elProgressText, elprogressBar, callback) {
    new Promise((resolve, reject) => {
        const transactionCount = transactions.length;
        let currentCount = 1;
        // prepare the calls
        var currentCall = [];
        //var failedCalls = [];
        let importSummary = {
            imported: 0,
            skipped: 0,
            errors: {
                count: 0,
                failedCalls: []
            }
        }
    
        const promises = transactions.map(transaction =>
            new Promise((resolve, reject) => {
                currentCall = { typeName: 'FuelTransaction', entity: transaction };
                console.log('Executing currentCall: ' + JSON.stringify(currentCall));

                api.call('Add', currentCall,
                    function (result) {
                        // Successful import
                        elprogressBar.value = (currentCount / transactionCount) * 100;
                        elProgressText.innerText = currentCount + ' transaction/s of ' + transactionCount + ' processed...';
                        currentCount++;
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
                        elprogressBar.value = (currentCount / transactionCount) * 100;
                        elProgressText.innerText = currentCount + ' transaction/s of ' + transactionCount + ' processed...';
                        currentCount++;
                        resolve(null);
                    });
            }));

        Promise.allSettled(promises)
        .then(() => {
            console.log('all settled...');
            callback(importSummary);
            resolve(importSummary);
        })
        .catch(err => {
            console.log(`Unexpected error in ImportHelper promise.all catch: ${err}`);
            callback(importSummary);
            resolve(importSummary);
        });
    });
}

function executePromises (transactionChunks, pauseLengthMs) {
    return new Promise((resolve) => {
        for (batch of transactionChunks) {
            sleep(pauseLengthMs)
            .then( _ => {
                console.log('executing promise batch.')
                Promise.allSettled(batch)
                .then((results) => {
                    console.log('success...')
                    results.forEach((result) => console.log(result))
                })
                .catch((errors) => {
                    console.log('failure.')
                    errors.forEach((error) => console.log(error))
                });
            });
        }
        resolve('resolved execute promises...');
    });
}

async function executePromisesNew (transactionChunks, pauseLengthMs) {
    for (const batch of transactionChunks) {
      await Promise.allSettled(batch);
      await sleep(pauseLengthMs);
      await Promise.resolve(console.log('executed a batch...'));
    }
  }

function addTransactionsByBatchPromise(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs) {

    return new Promise ((resolve, reject) => {

        let importSummary = {
            imported: 0,
            skipped: 0,
            errors: {
                count: 0,
                failedCalls: []
            }
        }

        let transactionChunks = [];
        for (let i = 0; i < transactions.length; i += batchSize) {
            console.log('Outer batch count: ' + i);
            const transBatch = transactions.slice(i, i + batchSize);
            transactionChunks.push(addFuelTransactionsPromises(api, transBatch, importSummary));
        };
    });
}

function importTransactionsBatchPromise(api, transactions, elProgressText, elprogressBar, batchSize, pauseLengthMs) {

    return new Promise ((resolve, reject) => {

        let importSummary = {
            imported: 0,
            skipped: 0,
            errors: {
                count: 0,
                failedCalls: []
            }
        }

        // let transactionChunks = [];
        // for (let i = 0; i < transactions.length; i += batchSize) {
        //     console.log('Outer batch count: ' + i);
        //     const transBatch = transactions.slice(i, i + batchSize);
        //     transactionChunks.push(addFuelTransactionsPromises(api, transBatch, importSummary));
        // };

        // executePromisesNew(transactionChunks, pauseLengthMs)
        addTransactions(api, transactions, batchSize, pauseLengthMs, importSummary, elProgressText, elprogressBar)
        .then( _ => {
            console.log('After ExecutePromises...');
            console.log('importSummary: ' + importSummary);
            resolve(importSummary);
            //return importSummary;
        })
        .catch( rej => {
            console.log('After ExecutePromises exception: ' + rej);
            reject(importSummary);
            //return importSummary;
        });

    });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function addTransactions(api, transactions, batchSize, pauseLengthMs, importSummary, elProgressText, elprogressBar) {
    let transactionCount = transactions.length;
    let transactionChunks = [];
    for (let i = 0; i < transactions.length; i += batchSize) {
        console.log('Outer batch count: ' + i);
        const transBatch = transactions.slice(i, i + batchSize);
        //transactionChunks.push(addFuelTransactionsPromises(api, transBatch, importSummary));
        transactionChunks.push(postFuelTransCallsAsync(api, transBatch, importSummary));
        elprogressBar.value = (batchSize / transactionCount) * 100;
        elProgressText.innerText = batchSize + ' transaction/s of ' + transactionCount + ' processed...';
        await sleep(pauseLengthMs);
    };
    elprogressBar.value = (transactionCount / transactionCount) * 100;
    elProgressText.innerText = transactionCount + ' transaction/s of ' + transactionCount + ' processed...';
}

function postFuelTransCallsAsync(api, transactions, importSummary) {
    new Promise((resolve, reject) => {

        // prepare the calls
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
                        resolve(null);
                    });
            }));

    });
}

/**
 * Imports the fuel transactions of the selected file for the config provider file implementation
 * @param {Object} api The Geotab api interface.
 * @param {JSON} transactions The JSON transaction list to be inserted.
 * @param {string} elProgressText The progress text html element reference.
 * @param {Object} elprogressBar The progress bar html element reference.
 * @param {callback} callback The callback for completion.
 */
function addFuelTransactionsPromises(api, transactions, summary) { 

    let promises = [];
    transactions.map(function(transaction){
        promises.push(new Promise(function(resolve) {
            currentCall = { typeName: 'FuelTransaction', entity: transaction };
            //console.log('Executing currentCall: ' + JSON.stringify(currentCall));
            // executing the current call
            api.call('Add', currentCall,
                function (result) {
                    summary.imported += 1;
                    resolve(result);
                }, function (error) {
                    summary.errors.count += 1;
                    resolve(error);
                });
            }))
        });
    return promises;
}

module.exports = {
    importTransactionsAsync,
    importTransactionsBatchPromise
}