/**
 * This is the entry point for your app
 * Include any assets to be bundled in here
 * (css/images/js/etc)
 */

// Allowing babel to work with older versions of IE
const regeneratorRuntime = require('regenerator-runtime');

if(!geotab.addin.importFuelTransactions_fp){
    
    require('./scripts/main');
    require('bluebird');
    require('moment');    
    require('moment-timezone');




    require('./scripts/timezone');
    
}

require('./styles/main.css');
