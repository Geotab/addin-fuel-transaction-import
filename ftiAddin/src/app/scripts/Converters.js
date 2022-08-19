/**
 * converts miles to kilometres
 * @param {*} miles 
 * @returns 
 */
    var milesToKm = function (miles) {
    return miles / 0.62137;
};

/**
 * converts gallons to litres
 * @param {*} gallons 
 * @returns 
 */
var gallonsToLitres = function (gallons) {
    return gallons * 3.785;
};

module.exports = {
    milesToKm,
    gallonsToLitres
}