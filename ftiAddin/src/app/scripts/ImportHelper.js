/**
 * Imports the fuel transactions of the selected file for the config provider file implementation
 */
function importTransactions(api, transactions) {
    return new Promise(function (resolve, reject) {
        // prepare the calls
        var currentCall = [];
        var failedCalls = [];
        transactions.forEach(function (transaction, j) {
            currentCall = { typeName: 'FuelTransaction', entity: transaction };
            console.log('Executing currentCall: ' + currentCall);
            api.call('Add', currentCall,
                function (result) {
                    if (result) {
                        console.log('transaction added...');
                    } else {
                        console.log('WARNING - issue ADDING transaction', currentCall);
                        failedCalls.push(currentCall);
                    }
                }, function (error) {
                    console.log(error);
                    failedCalls.push(currentCall);
                });
        });
        resolve(failedCalls);
    });
};

module.exports = {
    importTransactions
}