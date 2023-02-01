const { ImportError } = require('./ImportError');

/**
 * @returns {{initialize: Function, focus: Function, blur: Function, startup; Function, shutdown: Function}}
 */
geotab.addin.ftiAddin = function () {
  'use strict';

  const configHelper = require('./ConfigHelper');
  const importHelper = require('./ImportHelper');
  const transactionHelper = require('./TransactionHelper');
  const moment = require('moment-timezone');
  const XLSX = require('xlsx');

  let api;
  /** The root container. */
  var elAddin = document.getElementById('ftiAddin');
  /** The provider file input element. */
  var elProviderFile = document.getElementById('providerFile');
  /** The fuel provider dropdown box */
  let elProviderDropdown = document.getElementById('providerDropdown');
  /** The time zone dropdown */
  let elTimeZoneDropdown = document.getElementById('timeZoneDropdown');
  /** The inputDiv section */
  let elInputDiv = document.getElementById('inputDiv');
  /** The outputDiv section */
  let elOutputDiv = document.getElementById('outputDiv');
  /** The output title element */
  let elOutputTitle = document.getElementById('outputTitle');
  /** The output message element */
  let elOutputMessage = document.getElementById('outputMessage');
  /** The import button */
  let elImportButton = document.getElementById('importButton');
  let elResetButton = document.getElementById('resetButton');
  /** The import file input element */
  let elImportFile = document.getElementById('importFile');
  /** The provider configuration file */
  let configurationFile;
  /** The provider configuration object */
  let configuration;
  /** The excel file containing the transactions to be imported */
  let importFile;
  /** The raw/unparsed excel transactions that have been converted to Json */
  let transactionsRaw;
  /** The json transactions */
  let transactionsJson;
  let elProgressDiv = document.getElementById('progressDiv');
  let elProgressText = document.getElementById('progressText');
  let elProgressBar = document.getElementById('progressBar');
  /** The browser timezone index for later resets. */
  let selectedTimezoneIndex;
  const TableElementId = 'ErrorTable';
  const ErrorListTitleId = 'ErrorListTitle';
  const TableImportSummaryElementId = 'ImportSummaryTable';

  /**
   * Manages the provider file selection change event.
   * @param {*} event The event object.
   */
  var providerFileSelectionChangeEvent = async function (event) {
    console.log('providerFile change event');
    toggleWindowDisplayState(true, false, false);
    let file = elProviderFile.files[0];
    if (file) {
      configurationFile = await getJsonObjectFromFileAsync(file);
      populateProviderDropdown(configurationFile);
    }
    clearImportFile(elImportFile, importFile);
  };

  /**
   * Clears the fuel provider dropdown when the config file selection receives the focus.
   */
  function providerFileFocusEvent() {
    console.log('providerFile focus event');
    toggleWindowDisplayState(true, false, false);
  }

  /**
   * Returns a json object from a file object.
   * @param {*} file The file object.
   */
  function getJsonObjectFromFileAsync(file) {
    return new Promise(function (resolve, reject) {
      try {
        let reader = new FileReader();
        reader.readAsText(file);
        reader.addEventListener('loadend', () => {
          let jsonObject = JSON.parse(reader.result);
          resolve(jsonObject);
        });
      }
      catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initialises the provider dropdown box.
   * @param {string} defaultOptionText The default option text to display.
   */
  function initialiseProviderDropdown(defaultOptionText) {
    elProviderDropdown.length = 0;
    let defaultOption = document.createElement('option');
    defaultOption.text = defaultOptionText;
    elProviderDropdown.appendChild(defaultOption);
    elProviderDropdown.selectedIndex = 0;
  }

  /**
   * Populates the provider dropdown from the provider configuration JSON object
   * @param {jsonObject} providerConfigurationFile The provider configuration file.
   */
  function populateProviderDropdown(providerConfigurationFile) {
    console.log('populateProviderDropdown');
    if (providerConfigurationFile && providerConfigurationFile.providers) {
      initialiseProviderDropdown('Choose provider');
      let option;
      for (let i = 0; i < providerConfigurationFile.providers.length; i++) {
        option = document.createElement('option');
        option.text = providerConfigurationFile.providers[i].Name;
        elProviderDropdown.appendChild(option);
      }
    } else {
      let title = 'Alert';
      let alert = 'no providers found...';
      setOutputDisplay(title, alert);
    }
  }

  /**
   * The value change event for the provider dropdown selector.
   * @param {Event} event The event object.
   */
  async function providerDropdownChangeEvent(event) {
    toggleWindowDisplayState(true, false, false);
    let element = event.target;
    // console.log(providerConfigurationFile);
    var selectedIndex = element.selectedIndex;
    // console.log('selected index: ' + selectedIndex);
    var selectedValue = element.value;
    // console.log('selected value (providerName): ' + selectedValue);
    // Don't allow selection of the zero indexed item = Choose provider
    if (selectedIndex != '0') {
      setProviderConfigurationVariable(selectedValue);
    }
  }

  /**
   * Sets the configuration variable to an array of the providerName supplied.
   * @param {string} providerName The provider name.
   */
  function setProviderConfigurationVariable(providerName) {
    console.log('providerName: ' + providerName);
    console.log('providerConfiguration before update: ' + configuration);
    if (configurationFile) {
      console.log('providerConfigurationFile: ' + configurationFile);
      // sets the providerConfiguration array to the providerName
      var configurationArray = configurationFile.providers.filter(provider =>
        provider.Name === providerName
      );
      configuration = configurationArray[0];
      console.log('configuration set: ' + JSON.stringify(configuration));
    }
    console.log('configuration selected: ' + configuration.Name);
  }

  /**
   * Toggles the window display state for the 3 main sections - input, output and error.
   * @param {Boolean} input true to display the input section.
   * @param {Boolean} output true to display the output section.
   * @param {Boolean} progress true to display the progress section.
   */
  function toggleWindowDisplayState(input = true, output = false, progress = false) {
    input ? elInputDiv.classList.remove('ftiHidden') : elInputDiv.classList.add('ftiHidden');
    if(progress) {
      elProgressDiv.classList.remove('ftiHidden')
    } else {
      elProgressDiv.classList.add('ftiHidden');
      resetProgressDiv();
    }
    if (output) {
        elOutputDiv.classList.remove('ftiHidden');
    } else { 
        elOutputDiv.classList.add('ftiHidden');
        resetOutputDiv();
    }
  }

  /**
   * Sets the outputDiv title and message elements.
   * @param {*} title The title
   * @param {*} message The message
   */
  function setOutputDisplay(title, message) {
    elOutputTitle.innerHTML = title;
    elOutputMessage.innerHTML = message;
    toggleWindowDisplayState(true, true, false);
  }

  /**
   * Resets the progressDiv and elements
   */
  function resetProgressDiv()
  {
    elProgressBar.value = 0;
  }

  /**
   * Resets the OutputDiv of any additional elements and resets the title and message.
   */
  function resetOutputDiv()
  {
    let elErrorTable = document.getElementById(TableElementId);
    if(elErrorTable) {
      elErrorTable.parentNode.removeChild(elErrorTable);
    }
    let elErrorListTitle = document.getElementById(ErrorListTitleId);
    if(elErrorListTitle) {
      elErrorListTitle.parentNode.removeChild(elErrorListTitle);
    }
    let elImportSummaryTable = document.getElementById(TableImportSummaryElementId);
    if (elImportSummaryTable) {
      elImportSummaryTable.parentNode.removeChild(elImportSummaryTable);
    }
    elOutputTitle.textContent = '';
    elOutputMessage.textContent = '';
  }

  /**
   * Initialises the global importFile variable.
   * todo: set this on file input change
   */
  function getImportFile() {
    if (elImportFile) {
      importFile = elImportFile.files[0];
    } else {
      setOutputDisplay('No import file selected', 'Please select an import file prior to this operation.');
    }
  }

  /**
   * Converts the excel file to binary format and then uses the XLSX library to convert the file into JSON format.
   * @param {File} excelFile The excel file to import.
   * @returns A promise resolved true when the excel transaction file has been converted to a JSON object.
   */
  function convertExcelToJsonAsync(excelFile) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
  
      reader.onload = (event) => {
        var data = event.target.result;
        var workbook = XLSX.read(data, {
          type: 'binary',
          cellDates: true
        });
        let jsonObject = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
            'header': 'A'
          });
          console.log(jsonObject)
          resolve(jsonObject);
        };
  
      reader.onerror = reject;
  
      reader.readAsBinaryString(excelFile);
    })
  }

   /**
   * Import
   * The import button click event.
   */
  async function importTransactions() {

    // set initial window state.
    toggleWindowDisplayState(true, false, false);

    getImportFile();

    // Check initial state.
    if (!importFile) {
      setOutputDisplay('File Not Found', 'Please select an import file.');
      return;
    }

    // disable form controls
    setControlState(false);

    let transactionsLocal;
    convertExcelToJsonAsync(importFile)
    .then(results => {
      transactionsLocal = results;
    })
    .then(() => {
      // validate the configuration data
      var result = configHelper.validateConfiguration(configuration);
      console.log('validation result, isValid: ' + result.isValid);
      console.log('validation result, reason: ' + result.reason);
      if (result.isValid === false) {
        var mesage = 'Configuration File Validation Problem';
        throw new ImportError(mesage, result.reason);
      }
      // parse the configuration defaults
      configHelper.parseConfigDefaults(configuration);
    })
    .then(() => {
      // parse and get the json transaction.
      return transactionHelper.ParseAndBuildTransactionsAsync(transactionsLocal, configuration, elTimeZoneDropdown.value, api);
    })
    .then((results) => {
      transactionsJson = results;
      toggleWindowDisplayState(true, true, true);
      if (transactionsJson) {
        return importHelper.importTransactionsPromise(api, transactionsJson, elProgressText, elProgressBar, 250, 1000);
      } else {
        setOutputDisplay('Data Issue', 'No transactions found. Please try again...');
      }
    }).then((summary) => {
      if (summary) {
        console.log(summary);
        importSummaryOutput(summary);
      }
      setControlState(true);
    })
    .catch(error => {
      switch (error.name)
      {
        case 'InputError':
          let suggestion = 'Please correct the error in the input file (import file) and try again.';
          let message = 'Entry containing the error: ' + JSON.stringify(error.entity) + '<br><br>' + suggestion;
          setOutputDisplay('Input Error', message);
          break;
        case 'ImportError':
          setOutputDisplay(error.message, error.moreInfo);
          break;
        default:
          console.log(error);
          setOutputDisplay('Unexpected Error in importTransactions', error);
      }
      setControlState(true);
    });
  }

  /**
   * Sets the state of the controls on the page. Moves the state between enabled and disabled.
   * @param {boolean} isEnabled True to enable controls and vice versa.
   */
  function setControlState(isEnabled){
    elImportButton.disabled = !isEnabled;
    elResetButton.disabled = !isEnabled;
    elProviderFile.disabled = !isEnabled;
    elProviderDropdown.disabled = !isEnabled;
    elImportFile.disabled = !isEnabled;
    elTimeZoneDropdown.disabled = !isEnabled;
  }

  /**
   * Resets the window state when the import file input receives the focus.
   */
  function importFileFocusEvent() {
    toggleWindowDisplayState(true, false, false);
  }

  /**
   * Displays the import summary output data
   * @param {*} importSummary 
   */
  function importSummaryOutput(importSummary){
    console.log('Import Summary');
    console.log(`Imported: ${importSummary.imported}`);
    console.log(`Skipped: ${importSummary.skipped}`);
    console.log(`Errors: ${importSummary.errors.count}`);

    let table = document.createElement('table');
    let tbody = document.createElement('tbody');
    let tr1 = document.createElement('tr');
    let cell1 = document.createElement('td');
    cell1.innerHTML = 'Imported';
    let cellValue1 = document.createElement('td');
    cellValue1.innerHTML = importSummary.imported;
    cellValue1.className = 'ftiSuccess';
    tr1.appendChild(cell1);
    tr1.appendChild(cellValue1);
    tbody.appendChild(tr1);
    let tr2 = document.createElement('tr');
    let cell2 = document.createElement('td');
    let cellValue2 = document.createElement('td');
    cell2.innerHTML = 'Skipped';
    cellValue2.innerHTML = importSummary.skipped;
    tr2.appendChild(cell2);
    tr2.appendChild(cellValue2);
    tbody.appendChild(tr2);
    let tr3 = document.createElement('tr');
    let cell3 = document.createElement('td');
    let cellValue3 = document.createElement('td');
    cell3.innerHTML = 'Errors';
    cellValue3.innerHTML = importSummary.errors.count;
    cellValue3.className = 'ftiFailed';
    tr3.appendChild(cell3);
    tr3.appendChild(cellValue3);
    tbody.appendChild(tr3);
    table.id = TableImportSummaryElementId;
    table.appendChild(tbody);
    table.className = 'ftiSummaryTable';
    elOutputDiv.appendChild(table);
    elOutputTitle.textContent = 'Import Summary';
    elOutputMessage.textContent = '';
    if (importSummary.errors.failedCalls.length > 0) {
      reportErrors(importSummary.errors.failedCalls);
    }
  }

  function reportErrors(errors) {
    let title = document.createElement('h2');
    title.id = ErrorListTitleId;
    title.textContent = 'Error List'
    title.title = 'List of transactions that produced errors.'
    elOutputDiv.appendChild(title);
    if (errors) {
      let table = document.createElement('table');
      let thead = document.createElement('thead');
      let tbody = document.createElement('tbody');
      table.id = TableElementId;

      table.appendChild(thead);

      let tr = document.createElement('tr');
      let th = document.createElement('th');
      let th1 = document.createElement('th');
      th.innerHTML = 'Transaction';
      tr.appendChild(th);
      th1.innerHTML = 'Exception';
      tr.appendChild(th1);
      thead.appendChild(tr);

      table.appendChild(tbody);

      errors.forEach((error, i) => {
        let row = document.createElement('tr');
        let cell = document.createElement('td')
        cell.innerHTML = error[0];
        let cell1 = document.createElement('td')
        cell1.innerHTML = error[1];
        row.appendChild(cell);
        row.appendChild(cell1);
        tbody.appendChild(row);
      });
      elOutputDiv.appendChild(table);
      table.className = 'ftiTable';
      toggleWindowDisplayState(true, true, true);
    } else {
      console.log('No erros reported...');
    }
  }

  /**
   * Loads the time zone dropdown (select) with all global time zones.
   */
  function loadTimeZoneList() {
    let option;
    elTimeZoneDropdown.innerHTML = '';
    let browserTimeZone = moment.tz.guess();
    console.log(browserTimeZone);
    let timeZones = moment.tz.names();
    timeZones.forEach((timeZone) => {
      option = document.createElement('option');
      option.textContent = `${timeZone} (GMT${moment.tz(timeZone).format('Z')})`;
      option.value = timeZone;
      if (timeZone == browserTimeZone) {
        option.selected = true;
      }
      elTimeZoneDropdown.appendChild(option);
    });
    selectedTimezoneIndex = elTimeZoneDropdown.selectedIndex;
  }

  function resetButtonClickEvent(){
    elProviderFile.value = null;
    elProviderDropdown.selectedIndex = 0;
    elImportFile.value = null;
    elTimeZoneDropdown.selectedIndex = selectedTimezoneIndex;
    toggleWindowDisplayState(true, false, false);
  }

  /**
   * Wire up all events on initialisation.
   */
  function addEvents() {
    elProviderFile.addEventListener('change', providerFileSelectionChangeEvent, false);
    elProviderFile.addEventListener('focus', providerFileFocusEvent, false);
    elProviderDropdown.addEventListener('change', providerDropdownChangeEvent, false);
    elImportFile.addEventListener('focus', importFileFocusEvent, false);
    elImportButton.addEventListener('click', importTransactions, false);
    elResetButton.addEventListener('click', resetButtonClickEvent, false);
  }

  /**
   * Decouple events on blur.
   */
  function removeEvents() {
    elProviderFile.removeEventListener('change', providerFileSelectionChangeEvent, false);
    elProviderFile.removeEventListener('focus', providerFileFocusEvent, false);
    elProviderDropdown.removeEventListener('change', providerDropdownChangeEvent, false);
    elImportFile.removeEventListener('focus', importFileFocusEvent, false);
    elImportButton.removeEventListener('click', importTransactions, false);
    elResetButton.removeEventListener('click', resetButtonClickEvent, false);
  }

  return {

    /**
     * initialize() is called only once when the Add-In is first loaded. Use this function to initialize the
     * Add-In's state such as default values or make API requests (MyGeotab or external) to ensure interface
     * is ready for the user.
     * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     * @param {function} initializeCallback - Call this when your initialize route is complete. Since your initialize routine
     *        might be doing asynchronous operations, you must call this method when the Add-In is ready
     *        for display to the user.
     */
    initialize: function (freshApi, freshState, initializeCallback) {
      // set the global api reference.
      api = freshApi;
      // Loading translations if available
      if (freshState.translate) {
        freshState.translate(elAddin || '');
      }
      // ToggleWindowState(true, false, false);
      addEvents();

      loadTimeZoneList();

      // MUST call initializeCallback when done any setup
      initializeCallback();
    },

    /**
     * focus() is called whenever the Add-In receives focus.
     *
     * The first time the user clicks on the Add-In menu, initialize() will be called and when completed, focus().
     * focus() will be called again when the Add-In is revisited. Note that focus() will also be called whenever
     * the global state of the MyGeotab application changes, for example, if the user changes the global group
     * filter in the UI.
     *
     * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
    */
    focus: function (freshApi, freshState) {

      // getting the current user to display in the UI
      // freshApi.getSession(session => {
      //   elAddin.querySelector('#ftiAddin-user').textContent = session.userName;
      // });

      loadTimeZoneList();

      toggleWindowDisplayState(true, false, false);

      elAddin.className = '';
      // show main content

    },

    /**
     * blur() is called whenever the user navigates away from the Add-In.
     *
     * Use this function to save the page state or commit changes to a data store or release memory.
     *
     * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
    */
    blur: function () {
      removeEvents();
      // hide main content
      elAddin.className += ' hidden';
    }
  };
};

/**
 *  clears the import file previously set.
 * */ 
function clearImportFile(elImportFile, importFile) {
  elImportFile.value = '';
  importFile = null;
}
