/**
 * Imports the fuel transactions of the selected file for the config provider file implementation
 */
    function importTransactions(api, transactions) {
    return new Promise (function (resolve, reject) {
        var callset,
        callSets
        transactions.forEach(function (transaction, j) {
            console.log(transaction);
            // callSet.push(['Add', { typeName: 'FuelTransaction', entity: transaction }]);
            // total++;
            // if (callSet.length === callLimit || j === transactions.length - 1) {
            //     callSets.push(callSet);
            //     callSet = [];
            // }
        });
        resolve('all good');
    });
};

module.exports = {
    importTransactions
}