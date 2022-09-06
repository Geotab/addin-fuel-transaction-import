/**
 * Imports the fuel transactions of the selected file for the config provider file implementation
 */
function importTransactions(api, transactions, elProgressText, elprogressBar) {
    return new Promise(function (resolve, reject) {
        const transactionCount = transactions.length;
        let currentCount = 0;
        console.log('trans count: ' + transactionCount);
        // prepare the calls
        var currentCall = [];
        var failedCalls = [];
        transactions.forEach(function (transaction, j) {
            currentCall = { typeName: 'FuelTransaction', entity: transaction };
            console.log('Executing currentCall: ' + JSON.stringify(currentCall));
            api.call('Add', currentCall,
                function (result) {
                    if (result) {
                        console.log('transaction added...');
                    } else {
                        console.log('WARNING - issue ADDING transaction');
                        failedCalls.push(currentCall);
                    }
                }, function (error) {
                    console.log('ERROR - issue ADDING transaction. Error: ' + error);
                    failedCalls.push(currentCall);
                });
            currentCount++;
            elprogressBar.value = (currentCount / transactionCount) * 100;
            elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
        });
        resolve(failedCalls);
    });
};

module.exports = {
    importTransactions
}