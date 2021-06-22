/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
 const excelToJson = require('convert-excel-to-json');


geotab.addin.addinFuelTransactionImport20 = function () {
  'use strict';

  // Geotab Addin variables
  var api;

  // DOM Elements
  var elContainer;
  var elFiles;
  var elParseButton;
  var elImportButton;
  var elCancelButton;
  var elFleet;
  var elExampleButton;
  var elFileName;
  var elTransactionList;
  var elTransactionContainer;
  var elFileSelectContainer;
  var elAlertSuccess;
  var elAlertInfo;
  var elAlertError;
  var elSample;
  var elForm;
  var elListCount;
  
  var elFileJsonSelectContainer;
  var elFilesJson;
  var elFileNameJson;
  var elParseButtonJson;
  var elJsonDropDownMenu;
  var elConnectionTest;
  var elSelector;
  var elFileSelectContainerProvider;

  var elFileProvider;
  var elFileNameProvider;
  var elParseButtonProvider;

  // scoped vars
  var transactions;
  var database;
  var version;
  var ROW_LIMIT = 10;

  var fileJsonToParse;
  var fileXlsToJson;

  var objProviderTemplate;
  
  
  
  // functions

  var toggleParse = function (toggle) {
    if (toggle) {
        elParseButton.removeAttribute('disabled');
        toggleImport(false);
    } else {
        elParseButton.setAttribute('disabled', 'disabled');
    }
};


// enable or disable (grayout) the button to import the Json file
var toggleParseJson = function (toggle) {
    if (toggle) {
        //make visible the button to import the Json file
        elParseButtonJson.removeAttribute('disabled');
        toggleImport(false);
    } else {
         //hide the button to import the Json file
        elParseButtonJson.setAttribute('disabled', 'disabled');
    }
};

// enable or disable (grayout) the button of the provider xls section 
var toggleParseProvider = function (toggle) {
    if (toggle) {
        //make visible the button of the provider xls section 
        elParseButtonProvider.removeAttribute('disabled');
        toggleImport(false);
    } else {
         //hide the button of the provider xls section 
         elParseButtonProvider.setAttribute('disabled', 'disabled');
    }
};

var toggleImport = function (toggle) {
    if (toggle) {
        elImportButton.removeAttribute('disabled');
    } else {
        elImportButton.setAttribute('disabled', 'disabled');
        toggleFleet(false);
        clearFleets();
    }
};

var toggleFleet = function (toggle) {
    if (toggle) {
        elFleet.removeAttribute('disabled');
    } else {
        elFleet.setAttribute('disabled', 'disabled');
    }
};

var toggleBrowse = function (toggle) {
    if (toggle) {
        elFiles.removeAttribute('disabled');
    } else {
        elFiles.setAttribute('disabled', 'disabled');
    }
};

var toggleBrowseJson = function (toggle) {
    if (toggle) {
        elFilesJson.removeAttribute('disabled');
    } else {
        elFilesJson.setAttribute('disabled', 'disabled');
    }
};


var toggleAlert = function (el, content) {
    elAlertSuccess.style.display = 'none';
    elAlertInfo.style.display = 'none';
    elAlertError.style.display = 'none';
    if (el) {
        el.querySelector('span').textContent = content;toggleParse
        el.style.display = 'block';
    }
};

var clearFleets = function () {
    while (elFleet.firstChild) {
        elFleet.removeChild(elFleet.firstChild);
    }
};

var setFleetSelection = function (fleets) {
    clearFleets();
    fleets.sort();
    fleets.forEach(function (fleet) {
        var el = document.createElement('OPTION');
        el.textContent = fleet;
        el.value = fleet;
        elFleet.appendChild(el);
    });
    if (fleets.length > 0) {
        toggleFleet(true);
    }
};

var clearTransactionsList = function () {
    //container that hide the transaction
    elTransactionContainer.style.display = 'none';
    //container that show the File selection
    elFileSelectContainer.style.display = 'block';
    elFileSelectContainerProvider.style.display = 'none';
    while (elTransactionList.firstChild) {
        elTransactionList.removeChild(elTransactionList.firstChild);
    }
    transactions = [];
};

var clearTransactions = function () {
    clearTransactionsList();
    clearFleets();
    toggleParse(false);
    toggleImport(false);
};

var renderTransactions = function () {
    var elBody;
    var visibleCount = 0;
    var totalRowsCount = 0;
    var fleetName = elFleet.options[elFleet.selectedIndex].value;
    var getColumnHeading = function (column) {
        var columnHeadings = {
            'vehicleIdentificationNumber': 'VIN',
            'description': 'Description',
            'serialNumber': 'Device Serial Number',
            'licencePlate': 'Licence Plate',
            'comments': 'Comment',
            'dateTime': 'Date (UTC)',
            'volume': 'Volume Added (litres)',
            'odometer': 'Odometer (km)',
            'cost': 'Cost',
            'currencyCode': 'Currency',
            'location': 'Location (lon,lat)',
            'provider': 'File Provider',
            'driverName': 'Driver Name',
            'productType': 'Product Type'
        };
        return columnHeadings[column] || column;
    };
    var createRow = function (row, isHeading) {
        var elRow = document.createElement('TR');
        var createColumn = function (columnName) {
            if (columnName === 'sourceData' || columnName === 'fleet') {
                return;
            }
            var elColumn = document.createElement(isHeading ? 'TH' : 'TD');
            elColumn.textContent = isHeading ? getColumnHeading(columnName) : JSON.stringify(row[columnName]);
            if (!isHeading) {
                elColumn.setAttribute('data-th', columnName);
            }
            elRow.appendChild(elColumn);
        };

        Object.keys(row).forEach(createColumn);

        return elRow;
    };

    elTransactionContainer.style.display = 'none';
    elFileSelectContainer.style.display = 'block';

    while (elTransactionList.firstChild) {
        elTransactionList.removeChild(elTransactionList.firstChild);
    }

    elBody = document.createElement('TBODY');
    transactions.forEach(function (transaction, i) {
        var elHead;

        if (i === 0) {
            elHead = document.createElement('THEAD');
            elHead.appendChild(createRow(transaction, true));
            elTransactionList.appendChild(elHead);
        }
        if (!fleetName || transaction.fleet === fleetName) {
            totalRowsCount++;
            if (visibleCount < ROW_LIMIT) {
                visibleCount++;
                elBody.appendChild(createRow(transaction));
            }
        }
    });
    elListCount.textContent = (ROW_LIMIT === visibleCount ? 'top ' : '') + visibleCount + '/' + totalRowsCount;
    elTransactionList.appendChild(elBody);
    elTransactionContainer.style.display = 'block';
    elFileSelectContainer.style.display = 'none';
};

var renderTransactionsProvider = function (transactions) {

   
    var elBody;
    var visibleCount = 0;
    var totalRowsCount = 0;
    //var fleetName = elFleet.options[elFleet.selectedIndex].value;
    var getColumnHeading = function (column) {
        var columnHeadings = {
            'vehicleIdentificationNumber': 'VIN',
            'description': 'Description',
            'serialNumber': 'Device Serial Number',
            'licencePlate': 'Licence Plate',
            'comments': 'Comment',
            'dateTime': 'Date (UTC)',
            'volume': 'Volume Added (litres)',
            'odometer': 'Odometer (km)',
            'cost': 'Cost',
            'currencyCode': 'Currency',
            'location': 'Location (lon,lat)',
            'provider': 'File Provider',
            'driverName': 'Driver Name',
            'productType': 'Product Type'
        };
        return columnHeadings[column] || column;
    };
    var createRow = function (row, isHeading) {
        var elRow = document.createElement('TR');
        var createColumn = function (columnName) {
            if (columnName === 'sourceData' || columnName === 'fleet') {
                return;
            }
            var elColumn = document.createElement(isHeading ? 'TH' : 'TD');
            elColumn.textContent = isHeading ? getColumnHeading(columnName) : JSON.stringify(row[columnName]);
            if (!isHeading) {
                elColumn.setAttribute('data-th', columnName);
            }
            elRow.appendChild(elColumn);
        };

        Object.keys(row).forEach(createColumn);

        return elRow;
    };

    elTransactionContainer.style.display = 'none';
    elFileSelectContainer.style.display = 'block';

    while (elTransactionList.firstChild) {
        elTransactionList.removeChild(elTransactionList.firstChild);
    }

    elBody = document.createElement('TBODY');
    transactions.forEach(function (transaction, i) {
        var elHead;

        if (i === 0) {
            elHead = document.createElement('THEAD');
            elHead.appendChild(createRow(transaction, true));
            elTransactionList.appendChild(elHead);
        }
        /*
        if (!fleetName || transaction.fleet === fleetName) {
            totalRowsCount++;
            if (visibleCount < ROW_LIMIT) {
                visibleCount++;
                elBody.appendChild(createRow(transaction));
            }
        }*/
    });
    elListCount.textContent = (ROW_LIMIT === visibleCount ? 'top ' : '') + visibleCount + '/' + totalRowsCount;
    elTransactionList.appendChild(elBody);
    elTransactionContainer.style.display = 'none';
    elFileSelectContainer.style.display = 'none';
};

var clearFiles = function () {
    elFiles.value = null;
    elFileName.value = '';
};
var clearFilesJson = function () {
    elFilesJson.value = null;
    elFileNameJson.value =null;
    elJsonDropDownMenu.style.display = 'none';

    

    

    toggleParseJson();
};


var clearFilesProvider = function () {
    elFileProvider.value = null;
    elFileNameProvider.value = ''; 
  
    
    toggleParseProvider();
};



var getUrl = function () {
    return window.location.protocol + '//' + window.location.hostname + '/apiv1';
};

var fileSelected = function (e) {
    var file;
    if (e.target.files) {
        file = e.target.files[0];
    } else {
        // ie9
        file = { name: elFiles.value.substring(elFiles.value.lastIndexOf('\\') + 1, elFiles.length) };
    }
    if (file) {
        elFileName.value = file.name;
        toggleParse(true);
        clearTransactionsList();
    }
    toggleAlert();
};


// section that select the xls transaction file related to the provider fileProviderSelected
var fileProviderSelected = function (e) {
    var file;
    if (e.target.files) {
        file = e.target.files[0];
    } else {
        // ie9
        file = { name: elFileNameProvider.value.substring(elFileNameProvider.value.lastIndexOf('\\') + 1, elFileNameProvider.length) };
    }
    if (file) {
        elFileNameProvider.value = file.name;
        toggleParseProvider(true);
        
    }
    toggleAlert();
};


// Section for Json file selected
var fileSelectedJson = function (e) {
    
    if (e.target.files) {
        fileJsonToParse = e.target.files[0];
    } else {
        // ie9
        fileJsonToParse = { name: elFileNameJson.value.substring(elFileNameJson.value.lastIndexOf('\\') + 1, elFileNameJson.length) };
    }
    if (fileJsonToParse) {
        elFileNameJson.value = fileJsonToParse.name;

        // enable or disable (grayout) the button to import the Json file
        toggleParseJson(true);

        //clearTransactionsList();
    }
    toggleAlert();
};


var FuelTransaction = function (vin, description, serialNumber, licencePlate, comments, dateTime, volume, odometer, cost, currencyCode, location, provider, driverName, sourceData, productType) {
    var self = {
        vehicleIdentificationNumber: vin || '',
        description: description || '',
        serialNumber: serialNumber || '',
        licencePlate: licencePlate || '',
        comments: comments || '',
        dateTime: dateTime,
        volume: volume,
        odometer: odometer,
        cost: cost,
        currencyCode: currencyCode,
        location: location,
        provider: provider,
        driverName: driverName,
        sourceData: sourceData,
        productType: productType
    };
    return self;
};

var FuelTransactionProvider = function (cardNumber,comments,description,device,driver,driverName,externalReference,licencePlate,provider,serialNumber,siteName,sourceData,vehicleIdentificationNumber,cost,currencyCode,dateTime,location,odometer,productType,volume,version,id) {
    var self = {

        cardNumber: cardNumber || '',
        comments: comments || '',
        description: description || '',
        device:device || '',
        driver: driver|| '',
        driverName: driverName|| '',
        externalReference: externalReference|| '',
        licencePlate: licencePlate || '',
        provider:provider || '',
        serialNumber: serialNumber || '',
        siteName:siteName || '',
        sourceData: sourceData || '',
        vehicleIdentificationNumber: vehicleIdentificationNumber || '',
        cost: cost || '',
        currencyCode: currencyCode || '',
        dateTime: dateTime || '',
        location: location || '',
        odometer: odometer || '',
        productType:productType || '',
        volume: volume || '',
        version:version || '',
        id:id || '',
    };
    return self;
};

var resultsParser = function (xhr) {
    var jsonResponse,
        data,
        error;
    if (xhr.target && xhr.target.responseText.length > 0) {
        jsonResponse = JSON.parse(xhr.target.responseText);
        if (!jsonResponse.error) {
            data = jsonResponse.result;
        } else {
            error = jsonResponse.error;
        }
    }
    else {
        error = { message: 'No data' };
    }
    return {
        error: error,
        data: data
    };
};

var uploadComplete = function (e) {
    var results;
    var fuelTransactionParser = new FuelTransactionParser();

    // For each transaction check if fleet field is empty,
    // if so, is filled with database name
    var getFleets = function (trans) {
        var fleets = {};
        trans.forEach(function (transaction) {
            fleets[transaction.fleet] = transaction.fleet || database;
        });
        return Object.keys(fleets);
    };
    // -------------

    clearFiles();
    results = resultsParser(e);
    
    if (results.error) {
        toggleAlert(elAlertError, results.error.message);
        return;
        }
        
    fuelTransactionParser.parse(results.data)
        .then(function (result) {
           
            transactions = result;
            if (transactions === null) {
                toggleAlert(elAlertError, 'Can not determine file provider type, try converting to MyGeotab file type');
                return;
            }
            if (!transactions.length) {
                toggleAlert(elAlertError, 'No transactions found in file');
                return;
            }
            setFleetSelection(getFleets(transactions));
            toggleImport(true);
            renderTransactions(transactions);
            toggleAlert();
        })
        .catch(function (err) {
            console.log(err);
            toggleAlert(elAlertError, 'Error parsing file: ' + (err.message || err));
        });
};

// ie9
var iframeUpload = function (form, actionUrl, parameters) {
    var elIframe = document.createElement('iframe');
    var hiddenField = form.querySelector('input[type="hidden"]');
    var eventHandler = function (e) {
        var content;

        e.preventDefault();
        e.stopPropagation();

        elIframe.removeEventListener('load', eventHandler, false);

        // Message from server...
        if (elIframe.contentDocument) {
            content = elIframe.contentDocument.body.innerHTML;
        } else if (elIframe.contentWindow) {
            content = elIframe.contentWindow.document.body.innerHTML;
        } else if (elIframe.document) {
            content = elIframe.document.body.innerHTML;
        }

        // complete
        uploadComplete({ target: { responseText: content } });

        // Del the iframe...
        setTimeout(function () {
            elIframe.parentNode.removeChild(elIframe);
        }, 250);
    };

    hiddenField.value = parameters;

    elIframe.setAttribute('id', 'upload_iframe');
    elIframe.setAttribute('name', 'upload_iframe');
    elIframe.setAttribute('width', '0');
    elIframe.setAttribute('height', '0');
    elIframe.setAttribute('border', '0');
    elIframe.setAttribute('style', 'width: 0; height: 0; border: none;');

    // Add to document...
    form.parentNode.appendChild(elIframe);
    window.frames.upload_iframe.name = 'upload_iframe';

    elIframe.addEventListener('load', eventHandler, true);

    // Set properties of form...
    form.setAttribute('target', 'upload_iframe');
    form.setAttribute('action', actionUrl);
    form.setAttribute('method', 'post');
    form.setAttribute('enctype', 'multipart/form-data');
    form.setAttribute('encoding', 'multipart/form-data');

    // Submit the form...
    form.submit();
};

var uploadFile = function (e) {
    e.preventDefault();
    toggleAlert(elAlertInfo, 'Parsing... transferring file');
    api.getSession(function (credentials) {
        var fd;
        var xhr;
        var parameters = JSON.stringify({
            id: -1,
            method: 'ExcelToJson',
            params: {
                minColumnsAmount: 28,
                credentials: credentials
            }
        });               

        if (window.FormData) {
            fd = new FormData();
            xhr = new XMLHttpRequest();

            fd.append('JSON-RPC', parameters);
            fd.append('fileToUpload', elFiles.files[0]);

            xhr.upload.addEventListener('progress', uploadProgress, false);
            xhr.addEventListener('load', uploadComplete, false);
            xhr.addEventListener('error', uploadFailed, false);
            xhr.addEventListener('abort', uploadFailed, false);
           
            if(getUrl()=='http://localhost/apiv1')
            {
                xhr.open('POST','https://my501.geotab.com/apiv1')
            }
            else
            {
                xhr.open('POST', getUrl());
            }
            //xhr.open('POST', getUrl());
            xhr.send(fd);
        } else {
            iframeUpload(elForm, getUrl(), parameters);
        }
        database = credentials.database;
        toggleParse(false);
    });
};



var uploadProgress = function (e) {
    if (e.lengthComputable) {
        var percentComplete = Math.round(e.loaded * 100 / e.tota);
        if (percentComplete < 100) {
            toggleAlert(elAlertInfo, 'Parsing: transferring file ' + percentComplete.toString() + '%');
        } else {
            toggleAlert(elAlertInfo, 'Parsing: converting csv to fuel transactions');
        }

    }
};

var uploadFailed = function (e) {
    toggleAlert(elAlertError, 'There was an error attempting to upload the file.');
    console.log(e);
};

var importFile = function () {
    var fleetName = elFleet.options[elFleet.selectedIndex].value;
    var callSets = [];
    var callSet = [];
    var caller;
    var callLimit = 100;
    var i;
    var totalAdded = 0;
    var total = 0;
    var message = 'Importing fuel transactions...';
    var updateTotal = function (results) {
        totalAdded += typeof results === 'string' ? 1 : results.length;
    };
    var doCalls = function (calls) {
        return new Promise(function (resolve, reject) {
            api.multiCall(calls, resolve, reject);
        });
    };
    var popNextCall = function () {
        var calls = callSets.pop();
        return function (results) {
            updateTotal(results);
            toggleAlert(elAlertInfo, message + ' ' + totalAdded + '/' + total);
            return doCalls(calls);
        };
    };
    toggleImport(false);
    toggleBrowse(false);
    toggleAlert(elAlertInfo, message);
    transactions.forEach(function (transaction, j) {
        if (!fleetName || transaction.fleet === fleetName) {
            callSet.push(['Add', { typeName: 'FuelTransaction', entity: transaction }]);
            total++;
        }
        if (callSet.length === callLimit || j === transactions.length - 1) {
            callSets.push(callSet);
            callSet = [];
        }
    });

    caller = doCalls(callSets.pop());

    for (i = 0; i < callSets.length; i++) {
        caller = caller.then(popNextCall());
        i--;
    }

    caller.then(function (results) {
        updateTotal(results);
        clearTransactions();
        toggleAlert(elAlertSuccess, totalAdded);
        toggleBrowse(true);
    }).catch(function (e) {
        toggleBrowse(true);
        toggleAlert(elAlertError, e.toString());
    });
};

// Generic format button
var toggleExample = function (e) {
    var checked = e.target.checked;
    if (!checked) {
      
        e.target.parentNode.className = e.target.parentNode.className.replace('active', '');
          

    } else {
     
        e.target.parentNode.className += ' active';
        
    }
    elSample.style.display = checked ? 'block' : 'none';
};

var parsingTransactionWithProvider = function(transactions,provider)
{
    var arrayOfParsedTransaction = [];
    
    //loop transaction list row by row
    for (var k=0;k<transactions.length;k++)
    {
        arrayOfParsedTransaction.push(loopParseTransactionInTemplate(transactions[k],provider[0].data));   
    }   
    try {
        var jsonObjParsed= JSON.parse(JSON.stringify(arrayOfParsedTransaction));
        console.log(jsonObjParsed);
        
    } catch(e) {        
        console.log("Error: ",e );
    }

    //jsonObjParsed will be the object with the transaction parsed into
    //API template for fuel transaction and will returned into
    //fuelTransactionImport object in uploadCompleteProvider function
    return jsonObjParsed;
}
var loopParseTransactionInTemplate = function(singleTransaction,provider)
{
    var newTranscationObj = new FuelTransactionProvider();
    for (var prop in provider) {
         
        if(provider[prop]!=null && typeof(provider[prop])=="object")
        {
           var temp;
            for(var inner in provider[prop])
            {
                newTranscationObj[prop] += singleTransaction[provider[prop][inner]]+" ";   
            }
            newTranscationObj[prop]=newTranscationObj[prop].slice(0,-1);
        }
        else
        {
            if(provider[prop]==null)newTranscationObj[prop] = null;
            else newTranscationObj[prop]= singleTransaction[provider[prop]];           
        }  
      }
    return newTranscationObj;
}


var toggleJsonDropDownMenu = function()
{
    var itemIndexSelected = elJsonDropDownMenu.selectedIndex;
    var itemValueSelected = elJsonDropDownMenu.options[elJsonDropDownMenu.selectedIndex].value;
    var lengthDropDownMenu = elJsonDropDownMenu.length;
    if(itemIndexSelected != "0")
    {
        //container that show the File selection
    clearFilesProvider();
    elFileSelectContainerProvider.style.display = 'block';


    }
    else
    {

    }



};

// Function fired when user click Import,
// function is parsing the json file with providers
var parseJsonMapping = function (event) {

event.preventDefault();   
// get the file
var upload = document.getElementById('filesJson');
var result;
var ok;

// Make sure the DOM element exists
if (upload) 
{
    // Make sure a file was selected
    if (upload.files.length > 0) 
    {
        var reader = new FileReader(); // File reader to read the file 
        // This event listener will happen when the reader has read the file 
        reader.addEventListener('load', function() 
        {
            if(validateIfJsonFIle(reader.result))
            {
                result = JSON.parse(reader.result); // Parse the result into an object
                objProviderTemplate = result;
                
                ok = true;
                             
            }
            else
            {
                alert('Please select JSON files only!');
                ok = false;
                clearFilesJson();
            }           
                       
      });
      
        reader.readAsText(upload.files[0]); // Read the uploaded file
        //when the load is ended, I check if file uploaded was Json file and flagged as true
        // I build the dropdown menu 
        reader.addEventListener('loadend',function()
          {
              if(ok)
              {
                
                elJsonDropDownMenu.length = 0;
                elJsonDropDownMenu.style.display = "block";
    
                let defaultOption = document.createElement('option');
                defaultOption.text = 'Choose Provider';
    
                elJsonDropDownMenu.appendChild(defaultOption);
                elJsonDropDownMenu.selectedIndex = 0;
    
                let option;  
                for (let i = 0; i < result.providers.length; i++) 
                {
                option = document.createElement('option');
                option.text = result.providers[i].Name;
                elJsonDropDownMenu.appendChild(option);
                }

              }
              else
              {

              }
          
              
          
          })   


    }
}
    
    
}

var validateIfJsonFIle = function(fileJsonToCheck)
{
    try 
    { 
        JSON.parse(fileJsonToCheck); 
    }
    catch(err)
    {
        console.log(err);
        return false; 
        
    }  
    return true;


}

var showSelectorSection = function()
{
    
    for(var i = 0; i < elSelector.length; i++) {
                
        if(elSelector[i].checked)
        {
           
           switch(elSelector[i].id)
           {
               case "providerSelector": 
                clearFiles();
                clearFilesJson();
                clearTransactions();
                
                elFileJsonSelectContainer.style.display = 'block';
                elFileSelectContainer.style.display = 'none';
                elFileSelectContainerProvider.style.display = 'none';
                elJsonDropDownMenu.style.display = "none";

                break;
               

               default: 
               clearFiles();
               clearFilesJson();
               clearTransactions();
               elFileJsonSelectContainer.style.display = 'none';
               elFileSelectContainer.style.display = 'block';
               elFileSelectContainerProvider.style.display = 'none';
            
           }
           
            
        }
        

    }

}

var addNullCloumn = function(transactionsToBeChecked)
{    
    for (var i=0; i<transactionsToBeChecked.data.length;i++ )
    {
    // get Headers object as master to compare, because header cannot 
    // be empty
    var keysHeader = Object.keys(transactionsToBeChecked.data[0]);
    var keysTempTransaction = Object.keys(transactionsToBeChecked.data[i]);
   
    var z=0;
    var tempVar = z;
        for (z;z<keysHeader.length;z++)
        {        
            //compare the column header with the transaction column
            //if not match I add column with key equal to Header name
            // and value=null
            if(keysHeader[z]!=keysTempTransaction[tempVar])
            {
                transactionsToBeChecked.data[i][keysHeader[z]]=null;
                keysTempTransaction = Object.keys(transactionsToBeChecked.data[i]);
            }
            else tempVar++;
        } 
    }      
    return transactionsToBeChecked;
}



var uploadFileProvider = function(e)
{
    e.preventDefault();
   

    toggleAlert(elAlertInfo, 'Parsing... transferring file');
    api.getSession(function (credentials) {
        var fd;
        var xhr;
        var parameters = JSON.stringify({
            id: -1,
            method: 'ExcelToJson',
            params: {
                minColumnsAmount: 28,
                credentials: credentials
            }
        });  

        if (window.FormData) {
            fd = new FormData();
            xhr = new XMLHttpRequest();

            fd.append('JSON-RPC', parameters);
            fd.append('fileToUpload', elFileProvider.files[0]);

            xhr.upload.addEventListener('progress', uploadProgress, false);
            xhr.addEventListener('load', uploadCompleteProvider, false);
            xhr.addEventListener('error', uploadFailed, false);
            xhr.addEventListener('abort', uploadFailed, false);
            
            if(getUrl()=='http://localhost/apiv1')
            {
                xhr.open('POST','https://my501.geotab.com/apiv1')
            }
            else
            {
                xhr.open('POST', getUrl());
            }
                    

            xhr.send(fd);
        
            xhr.onreadystatechange=function(){
                if (xhr.readyState==4 && xhr.status==200)
                {
                           
                   var data = JSON.parse(xhr.responseText);
                   
                   if(data['result'].length>0)
                   {
                   }
                   else
                   {
                            var uploadResult = data['error']['message'];
                            console.log('uploadResult=',uploadResult);
                            if(uploadResult =="Incorrect login credentials")
                            {
                                window.alert("Incorrect Login Credentials");
                                xhr.abort();
                                toggleAlert(elAlertError, 'There was an error attempting to upload the file.');
                            }
                    }                   
                }
             }



        } else {
            iframeUpload(elForm, getUrl(), parameters);
        }
        database = credentials.database;
        toggleParse(false);
    });
}



//function return the provider selected 
var getTemplateProviderNameFromSelection = function()
{
  if(elJsonDropDownMenu.selectedIndex!=0)
  {
        return elJsonDropDownMenu.options[elJsonDropDownMenu.selectedIndex].value;
    }
    else
    {
        console.log("json dropdown menu error, provider not selected")
    }

}

var getHeadings = function getHeadings(data) {
    var headRow = data[0];
    var isHeadingRow = true;
    Object.keys(headRow).forEach(function (columName) {
      if (!isNaN(parseInt(columName, 10))) {
        isHeadingRow = false;
      }
    });

    if (isHeadingRow) {
      return data.shift();
    }

    return [];
  };

var uploadCompleteProvider = function (e) {

   
   
    var results;
    var headingsExtracted;    
    // retrieve the name of the provider selected
    var providerSelected = getTemplateProviderNameFromSelection();
    // retrieve the keys of the provider selected from the full template ojbect
    var extractedProviderTemplate = objProviderTemplate.providers.filter((provider) => provider.Name ===providerSelected);    
    
   

    results = addNullCloumn(resultsParser(e));
    if (results.error) {
        toggleAlert(elAlertError, results.error.message);
        return;
        }     

    //remove the heading from transaction
    headingsExtracted= getHeadings(results.data);
    var fuelTransctionImport = {};
    fuelTransctionImport = parsingTransactionWithProvider(results.data,extractedProviderTemplate);

    clearFilesJson();
    clearFilesProvider();
 
   
    //////// new code that need to be tested

    // For each transaction check if fleet field is empty,
        // if so, is filled with database name
        /*var getFleets = function (trans) {
            var fleets = {};
            trans.forEach(function (transaction) {
                fleets[transaction.fleet] = transaction.fleet || database;
            });
            return Object.keys(fleets);
        };
        */
        // -------------

    if (fuelTransctionImport === null) {
        toggleAlert(elAlertError, 'Can not determine file provider type, try converting to MyGeotab file type');
        return;
    }
    if (!fuelTransctionImport.length) {
        toggleAlert(elAlertError, 'No transactions found in file');
        return;
    }

    //setFleetSelection(getFleets(fuelTransctionImport));
                toggleImport(true);
                renderTransactionsProvider(fuelTransctionImport);
                toggleAlert();


    ////////// end of new code need to be tested






};


var connectionTest = function()
{
    api.call('Get', {
        typeName: 'Device',
        resultsLimit: 10
      }, function(err, devices) {
        if(err){
          console.log('Error', err);
          return;
        }
        console.log('Devices', devices);
      });
}


    // the root container
    //var elAddin = document.getElementById('addinFuelTransactionImport20');
  
  return {
    /**
     * initialize() is called only once when the Add-In is first loaded. Use this function to initialize the
     * Add-In's state such as default values or make API requests (MyGeotab or external) to ensure interface
     * is ready for the user.
     * @param {object} geotabApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     * @param {function} initializeCallback - Call this when your initialize route is complete. Since your initialize routine
     *        might be doing asynchronous operations, you must call this method when the Add-In is ready
     *        for display to the user.
     */
    initialize: function (geotabApi, freshState, initializeCallback) {

      api = geotabApi;

      elContainer = document.getElementById('importFuelTransactions');
      elFiles = document.getElementById('files');
      elParseButton = document.getElementById('parseButton');
      elImportButton = document.getElementById('importButton');
      elCancelButton = document.getElementById('cancelButton');
      elFleet = document.getElementById('fleet');
      elExampleButton = document.getElementById('exampleButton');
      elFileName = document.getElementById('fileName');
      elTransactionList = document.getElementById('transactionList');
      elTransactionContainer = document.getElementById('transactionContainer');
      elFileSelectContainer = document.getElementById('fileSelectContainer');
      elAlertInfo = document.getElementById('alertInfo');
      elAlertSuccess = document.getElementById('alertSuccess');
      elAlertError = document.getElementById('alertError');
      elSample = document.getElementById('sample');
      elForm = document.getElementById('form');
      elListCount = document.getElementById('listCount');

      elFilesJson = document.getElementById('filesJson');
        
      elParseButtonJson = document.getElementById('importJsonFile');

      elFileJsonSelectContainer = document.getElementById('jsonfileSelectContainer');
      elFileNameJson = document.getElementById('fileNameJson');
      elJsonDropDownMenu = document.getElementById('providerDropMenu');
      elConnectionTest = document.getElementById('buttonConnTest');

      elSelector = document.querySelectorAll('input[name="selector"]');

      elFileSelectContainerProvider = document.getElementById('fileSelectContainerProvider');
      elFileProvider = document.getElementById('filesProvider');
      elFileNameProvider = document.getElementById('fileNameProvider');
      elParseButtonProvider = document.getElementById('parseButtonProvider');


    // Loading translations if available
    if (freshState.translate) {
      freshState.translate(elContainer || '');
    }
    // MUST call initializeCallback when done any setup
    api.call('GetVersion', {}, (result) => {
      version = result;
      initializeCallback();
  }, (e) => {
      toggleAlert(elAlertError, e.toString());
      initializeCallback();
  });
    },

    /**
     * focus() is called whenever the Add-In receives focus.
     *
     * The first time the user clicks on the Add-In menu, initialize() will be called and when completed, focus().
     * focus() will be called again when the Add-In is revisited. Note that focus() will also be called whenever
     * the global state of the MyGeotab application changes, for example, if the user changes the global group
     * filter in the UI.
     *
     * @param {object} geotabApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     */
    focus: function (geotabApi, freshState) {
      
          // getting the current user to display in the UI
          geotabApi.getSession(session => {
            elContainer.querySelector('#importFuelTransactions-user').textContent = session.userName;
          });
                    
          elContainer.className = '';
          
      // show main content
            // events
            elFiles.addEventListener('change', fileSelected, false);
            elParseButton.addEventListener('click', uploadFile, false);
            elImportButton.addEventListener('click', importFile, false);
            elFleet.addEventListener('change', renderTransactions, false);
            elExampleButton.addEventListener('change', toggleExample, false);
            elCancelButton.addEventListener('click', clearTransactions, false);

            elParseButtonJson.addEventListener('click', parseJsonMapping, false);
            
            elFilesJson.addEventListener('change', fileSelectedJson, false);
            elJsonDropDownMenu.addEventListener('change', toggleJsonDropDownMenu, false);
            elContainer.style.display = 'block';

            elConnectionTest.addEventListener('click', connectionTest, false);
            //elSelector.addEventListener('click',showSelectorSection,false);

            for (var i = 0 ; i < elSelector.length; i++) {
                elSelector[i].addEventListener('change' , showSelectorSection , false ) ; 
             }

             elFileProvider.addEventListener('change',fileProviderSelected,false);
             elParseButtonProvider.addEventListener('click',uploadFileProvider,false);
          

      
    },

    /**
     * blur() is called whenever the user navigates away from the Add-In.
     *
     * Use this function to save the page state or commit changes to a data store or release memory.
     *
     * @param {object} geotabApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     */
    blur: function () {
      // hide main content
      elContainer.className += ' hidden';

      // events
      elFiles.removeEventListener('change', fileSelected, false);
      elParseButton.removeEventListener('click', uploadFile, false);
  
      elImportButton.removeEventListener('click', importFile, false);
      elFleet.removeEventListener('change', renderTransactions, false);
      elExampleButton.removeEventListener('change', toggleExample, false);
      elCancelButton.removeEventListener('click', clearTransactions, false);

      elFilesJson.removeListener('change', fileSelectedJson, false);
      elParseButtonJson.removeEventListener('click', parseJsonMapping, false);
      elJsonDropDownMenu.removeEventListener('change', toggleJsonDropDownMenu, false);

     //elSelector.removeEventListener('click',showSelectorSection,false);

      for (var i = 0 ; i < elSelector.length; i++) {
        elSelector[i].removeEventListener('change' , showSelectorSection , false ) ; 
     }
     elFileProvider.removeEventListener('change',fileProviderSelected,false);
     elParseButtonProvider.removeEventListener('click',uploadFileProvider,false);
  

    }
  };
};
