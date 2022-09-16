/**
 * Imports the fuel transactions of the selected file for the config provider file implementation
 * @param {*} api The Geotab api interface.
 * @param {*} transactions The JSON transaction list to be inserted.
 * @param {*} elProgressText The progress text html element reference.
 * @param {*} elprogressBar The progress bar html element reference.
 * @param {*} callback The callback for completion.
 */
async function importTransactionsAsync(api, transactions, elProgressText, elprogressBar, callback) {
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
                    console.log('ERROR - issue ADDING transaction. Error: ' + error);
                    //failedCalls.push([JSON.stringify(currentCall.entity), error]);
                    elprogressBar.value = (currentCount / transactionCount) * 100;
                    elProgressText.innerText = currentCount + ' transaction/s of ' + transactionCount + ' processed...';
                    currentCount++;
                    if (error.includes('Duplicate Data')) {
                        importSummary.skipped += 1;
                    } else {
                        importSummary.errors.count += 1;
                        importSummary.errors.failedCalls.push([JSON.stringify(currentCall.entity), error]);
                    }
                    resolve(null);
                });
        }));
    await Promise.all(promises)
    callback(importSummary);
}

module.exports = {
    importTransactionsAsync
}