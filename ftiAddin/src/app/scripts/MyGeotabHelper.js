/**
 * Geocodes or looks up the latitude and longitude from a list of addresses.
 * @param {*} api The MyGeotab API service
 * @param {*} addresses The formatted addresses in an array of String(s).
 * @returns The array of Coordinate(s) for the address or null if it cannot be found.
 */
function GetCoordinates(api, addresses)
{
    api.call('GetCoordinates', {
        'addresses': addresses 
    }, function (result) {
        return result;
    });
}

module.exports = {
    GetCoordinates
}