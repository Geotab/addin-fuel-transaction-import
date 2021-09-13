/**
 * This is the entry point for your app
 * Include any assets to be bundled in here
 * (css/images/js/etc)
 */

// Allowing babel to work with older versions of IE
const regeneratorRuntime = require('regenerator-runtime');

if(!geotab.addin.importFuelTransactions){
    
    require('./scripts/main');
    require('bluebird');
    require('moment');
    //require('bootstrap');
    require('moment-timezone');
    require('jquery');

    
}

require('./styles/main.css');
