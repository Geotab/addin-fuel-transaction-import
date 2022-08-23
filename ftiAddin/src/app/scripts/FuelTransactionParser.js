    const parsers = require('./Parsers');
    const converters = require('./Converters');
    const wexHelper = require('./WexHelper');
    const productTypeHelper = require('./ProductTypeHelper');

    /**
     * Parses the fuel transactions
     * @returns 
     */
     function FuelTransactionParser(transactions, headings, dateFormat) {
        transactions.forEach(transaction => {
            console.log(transaction[0])
        });

    };

    module.exports = {
        FuelTransactionParser
    }