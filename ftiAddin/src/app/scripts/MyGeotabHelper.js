/**
 * Geocodes or looks up the latitude and longitude from a list of addresses.
 * @param {*} api The MyGeotab API service
 * @param {*} addresses The formatted addresses in an array of String(s).
 * @returns The array of Coordinate(s) for the address or null if it cannot be found.
 */
let GetCoordinates = (api, addresses) => {
    return new Promise((resolve, reject) => {
        api.call('GetCoordinates', {
            'addresses': [addresses] 
        }, function (result) {
            resolve(result);
        }, function (error) {
            reject(error);
        });
    });
}

module.exports = {
    GetCoordinates
}