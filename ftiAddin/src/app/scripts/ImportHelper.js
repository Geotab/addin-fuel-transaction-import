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
    var failedCalls = [];
    const promises = transactions.map(transaction =>
        new Promise((resolve, reject) => {
            currentCall = { typeName: 'FuelTransaction', entity: transaction };
            console.log('Executing currentCall: ' + JSON.stringify(currentCall));

            api.call('Add', currentCall,
                function (result) {
                    elprogressBar.value = (currentCount / transactionCount) * 100;
                    elProgressText.innerText = currentCount + ' transaction/s of ' + transactionCount + ' processed...';
                    currentCount++;
                    resolve(null);
                }, function (error) {
                    console.log('ERROR - issue ADDING transaction. Error: ' + error);
                    failedCalls.push([JSON.stringify(currentCall), error]);
                    elprogressBar.value = (currentCount / transactionCount) * 100;
                    elProgressText.innerText = currentCount + ' transaction/s of ' + transactionCount + ' processed...';
                    currentCount++;
                    resolve(null);
                });
        }));
    await Promise.all(promises)
    callback(failedCalls);
}

module.exports = {
    importTransactionsAsync
}