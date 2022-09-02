/**
 * @returns The correctly formed Geotab API URL
 */
    var getUrl = function () {
        console.log('window.location.hostname: ' + window.location.hostname);
        if(window.location.hostname === 'localhost'){
            return 'https://my517.geotab.com/apiv1';    
        }
    return window.location.protocol + '//' + window.location.hostname + '/apiv1';
};

module.exports = {
    getUrl
}