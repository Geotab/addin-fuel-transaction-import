function ParseAndBuildTransactions(transactionsExcel, configuration) {
    return new Promise((resolve, reject) => {
        // var data = JSON.stringify(transactionsExcel);
        // data = JSON.parse(data);
        transactionsExcel.forEach((transaction, i) => {
            if (i === 0) {
                // title row so ignore
            } else {
                parseTransaction(transaction, configuration);
            }
        });
        resolve('ParseAndBuildTransactions completed.')
    });
}

function parseTransaction(transaction, configuration) {
    let transOutput;
    let unitVolumeLiters = configuration.unitVolumeLiters;
    let unitOdoKm = configuration.unitOdoKm;
    let isCellDateType = configuration.isCellDateType;
    let dateFormat = configuration.dateFormat;
    let timeFormat = configuration.timeFormat;
    let currencyCodeMapped = configuration.currencyCodeMapped;

    console.log('Parsing provider: ' + configuration.Name);

    // loop through the data properties of the transaction object
    // key = property
    Object.keys(configuration.data).forEach(key => {
        console.log(key, configuration[key]);
    });

    // if (transaction['cardNumber']){
    //     console
    // }
}

module.exports = {
    ParseAndBuildTransactions
}