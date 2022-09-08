/**
 * Imports the fuel transactions asynchronously of the selected file for the config provider file implementation
 */
async function importTransactionsAsync(api, transactions, elProgressText, elprogressBar) {
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
                    elprogressBar.value = (currentCount / transactionCount) * 100;
                    elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
                    currentCount++;

                }, function (error) {
                    console.log('ERROR - issue ADDING transaction. Error: ' + error);
                    failedCalls.push(currentCall);
                    elprogressBar.value = (currentCount / transactionCount) * 100;
                    elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
                    currentCount++;
                });
            setTimeout(() => { console.log('waiting...'); }, 5000);
            //currentCount++;
            //elprogressBar.value = (currentCount / transactionCount) * 100;
            //elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
        });
        resolve(failedCalls);
    });
};

/**
 * Imports the fuel transactions synchronously of the selected file for the config provider file implementation
 */
function importTransactions(api, transactions, elProgressText, elprogressBar) {
    const transactionCount = transactions.length;
    let currentCount = 0;
    console.log('trans count: ' + transactionCount);
    // prepare the calls
    var currentCall = [];
    var failedCalls = new Array();
    transactions.forEach(function (transaction, j) {
        currentCall = { typeName: 'FuelTransaction', entity: transaction };
        console.log('Executing currentCall: ' + JSON.stringify(currentCall));
        api.call('Add', currentCall,
            function (result) {
                if (result) {
                    console.log('transaction added...');
                } else {
                    console.log('WARNING - issue ADDING transaction');
                    failedCalls.push([JSON.stringify(currentCall), 'Unknown error - empty result returned by call.']);
                }
                // elprogressBar.value = (currentCount / transactionCount) * 100;
                // elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
                // currentCount++;

            }, function (error) {
                console.log('ERROR - issue ADDING transaction. Error: ' + error);
                failedCalls.push([JSON.stringify(currentCall), error]);
                // elprogressBar.value = (currentCount / transactionCount) * 100;
                // elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
                // currentCount++;
            });
        //        setTimeout(() => { console.log('waiting...'); }, 5000);
        currentCount++;
        elprogressBar.value = (currentCount / transactionCount) * 100;
        elProgressText.innerText = currentCount + ' transaction/s of ' + transactionCount + ' processed...';
    });
    console.log('failed calls: ' + failedCalls);
    return failedCalls;
}

function importTransAsync(api, transactions, elProgressText, elprogressBar, callback) {
    const transactionCount = transactions.length;
    let currentCount = 0;
    console.log('trans count: ' + transactionCount);
    // prepare the calls
    var currentCall = [];
    var failedCalls = [];
    for (let i = 0; i < transactions.length; i++) {
        currentCall = { typeName: 'FuelTransaction', entity: transactions[i] };
        console.log('Executing currentCall: ' + JSON.stringify(currentCall));

        api.call('Add', currentCall,
            function (result) {
                if (result) {
                    console.log('transaction added...');
                } else {
                    console.log('WARNING - issue ADDING transaction');
                    failedCalls.push([JSON.stringify(currentCall), 'Unknown error - empty result returned by call.']);
                }
                elprogressBar.value = (currentCount / transactionCount) * 100;
                elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
                currentCount++;

            }, function (error) {
                console.log('ERROR - issue ADDING transaction. Error: ' + error);
                failedCalls.push([JSON.stringify(currentCall), error]);
                elprogressBar.value = (currentCount / transactionCount) * 100;
                elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
                currentCount++;
            });

        // var promise = executeApiCall(api, 'Add', currentCall);
        // //await promise;
        // promise
        // .then(result => {
        //     currentCount++;
        //     elprogressBar.value = (currentCount / transactionCount) * 100;
        //     elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
        // })
        // .catch(error => {
        //     console.log('ERROR - issue ADDING transaction. Error: ' + error);
        //     failedCalls.push([JSON.stringify(currentCall), error]);
        //     elprogressBar.value = (currentCount / transactionCount) * 100;
        //     elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
        //     currentCount++;
        // });
        //currentCount++;
        //elprogressBar.value = (currentCount / transactionCount) * 100;
        //elProgressText.innerText = currentCount + ' transaction of ' + transactionCount + ' processed...';
    };
    callback(failedCalls);
}

async function importTrans(api, transactions, elProgressText, elprogressBar, callback) {
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

// function executeApiCall(api, method, call) {
//     return new Promise(function (resolve, reject) {
//         api.call(method, call, resolve, reject);
//     });
// }

function executeApiCall(api, method, call) {
    return new Promise(async function (resolve, reject) {
        await api.call(method, call, resolve, reject);
    });
}

module.exports = {
    importTransactionsAsync,
    importTransactions,
    importTransAsync,
    importTrans
}