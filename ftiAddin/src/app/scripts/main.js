/**
 * @returns {{initialize: Function, focus: Function, blur: Function, startup; Function, shutdown: Function}}
 */
geotab.addin.ftiAddin = function () {
  'use strict';

  const configHelper = require('./ConfigHelper');
  const excelHelper = require('./ExcelHelper');
  const importHelper = require('./ImportHelper');
  const transactionHelper = require('./TransactionHelper');
  const moment = require('moment-timezone');

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
  /** The errorDiv section */
  let elErrorDiv = document.getElementById('errorDiv');
  /** The error title element */
  let elErrorTitle = document.getElementById('errorTitle');
  /** The error text message element */
  let elErrorMessage = document.getElementById('errorMessage');
  /** The output title element */
  let elOutputTitle = document.getElementById('outputTitle');
  /** The output message element */
  let elOutputMessage = document.getElementById('outputMessage');
  /** The parse button */
  let elParseButton = document.getElementById('parseButton');
  /** The import button */
  let elImportButton = document.getElementById('importButton');
  /** The import file input element */
  let elImportFile = document.getElementById('importFile');
  /** The provider configuration file */
  let configurationFile;
  /** The provider configuration object */
  let configuration;
  /** The excel file containing the transactions to be imported */
  let importFile;
  /** The excel transaction */
  let transactionsExcel;
  /** The json transactions */
  let transactionsJson;
  let elProgressDiv = document.getElementById('progressDiv');
  let elProgressText = document.getElementById('progressText');
  let elProgressBar = document.getElementById('progressBar');

  /**
   * Manages the provider file selection change event.
   * @param {*} event The event object.
   */
  var providerFileSelectionChangeEvent = async function (event) {
    toggleWindowDisplayState(true, false, false);
    let file = elProviderFile.files[0];
    if (file) {
      configurationFile = await getJsonObjectFromFileAsync(file);
      populateProviderDropdown(configurationFile);
    }
  };

  /**
   * Clears the fuel provider dropdown when the config file selection receives the focus.
   */
  function providerFileFocusEvent() {
    toggleWindowDisplayState(true, false, false);
    initialiseProviderDropdown('None selected');
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
      setErrorDisplay(title, alert);
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
   * Sets the providerConfiguration variable to an array of the providerName supplied.
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
   * @param {Boolean} error true to display the error section.
   * @param {Boolean} progress true to display the progress section.
   */
  function toggleWindowDisplayState(input = true, output = false, error = false, progress = false) {
    input ? elInputDiv.classList.remove('ftiHidden') : elInputDiv.classList.add('ftiHidden');
    output ? elOutputDiv.classList.remove('ftiHidden') : elOutputDiv.classList.add('ftiHidden');
    error ? elErrorDiv.classList.remove('ftiHidden') : elErrorDiv.classList.add('ftiHidden');
    progress ? elProgressDiv.classList.remove('ftiHidden') : elProgressDiv.classList.add('ftiHidden');
  }

  /**
   * Sets the errorDiv title and text elements.
   * @param {string} title The title heading text element.
   * @param {string} message The error message text element.
   */
  function setErrorDisplay(title, message) {
    elErrorTitle.innerText = title;
    elErrorMessage.innerText = message;
    toggleWindowDisplayState(true, false, true);
  }

  /**
   * Sets the outputDiv title and message elements.
   * @param {*} title The title
   * @param {*} message The message
   */
  function setOutputDisplay(title, message) {
    elOutputTitle.innerText = title;
    elOutputMessage.innerText = message;
    //toggleWindowDisplayState(true, true, false);
  }

  /**
   * Initialises the global importFile variable.
   */
  function getImportFile() {
    if (elImportFile) {
      importFile = elImportFile.files[0];
    } else {
      setErrorDisplay('No import file selected', 'Please select an import file prior to this operation.');
    }
  }

  /**
   * The parse button click event.
   */
  async function parseClickEvent() {
    getImportFile();
    // Check initial state.
    if (!importFile) {
      setErrorDisplay('File Not Found', 'Please select an import file.');
      return;
    }

    // Execute the pasing process - starts with the excel process
    excelHelper.convertExcelToJsonPromise(api, importFile)
      .then(request => {
        // return the parsed transaction results to the next step.
        return excelHelper.parseTransactions(request);;
      })
      .then(results => {
        // set the excel transactions variable to the results.
        transactionsExcel = results;
        console.log('transactionsExcel: ' + JSON.stringify(transactionsExcel));
      })
      .then(() => {
        // validate the configuration data
        var result = configHelper.validateConfiguration(configuration);
        console.log('validation result, isValid: ' + result.isValid);
        console.log('validation result, reason: ' + result.reason);
        if (result.isValid === false) {
          setErrorDisplay('Configuration File Validation Problem', result.reason)
          return;
        }
        // parse the configuration defaults
        configHelper.parseConfigDefaults(configuration);
        //console.log(configuration);
        // setOutputDisplay('Ready for Import', 'The config and import files have been set up ready for the import operation. Hit the Import button to execute the import process.');
        //console.log(result);
        // console.log('results: ' + results.data[0]['ColumnA']);      
        // console.log('results: ' + results.data[1]['ColumnA']);      
        // var headings = parsers.getHeadings(results.data);
        // console.log(headings);
      })
      .then(result => {
        // parse and get the json transaction.
        return transactionHelper.ParseAndBuildTransactions(transactionsExcel, configuration);
      })
      .then((results) => {
        transactionsJson = results;
        setOutputDisplay('Ready for Import', 'The config and import files have been set up ready for the import operation. Hit the Import button to execute the import process.');
      })
      .catch(error => {
        console.log('Preview process error experienced:');
        console.log(error);
      });
  }

  /**
   * Resets the window state when the import file input receives the focus.
   */
  function importFileFocusEvent() {
    toggleWindowDisplayState(true, false, false);
  }

  /**
   * Import transactions click event
   */
  async function importButtonClickEvent() {
    //console.log('transactionsJson: ' + {transactionsJson});
    toggleWindowDisplayState(true, true, false, true);
    // let output = importHelper.importTransactions(api, transactionsJson, elProgressText, elProgressBar);
    importHelper.importTrans(api, transactionsJson, elProgressText, elProgressBar, reportErrors);
    //importHelper.importTransAsync(api, transactionsJson, elProgressText, elProgressBar, reportErrors);
    //let output = importHelper.importTransAsync(api, transactionsJson, elProgressText, elProgressBar);
    // output
    //   .then((output) => {
    //     console.log('output before: ' + output);
    //     reportErrors(output);
    //     console.log('Import transactions completed. Output:');
    //     console.log('output after: ' + output);
    //   });
    // await importHelper.importTransactionsAsync(api, transactionsJson, elProgressText, elProgressBar)
    //   .then(result => {
    //     console.log('Import process success');
    //     console.log('Import result: ', result);
    //     setOutputDisplay('Import Success', 'Transactions imported successfully.');
    //   })
    //   .catch(error => {
    //     console.log('Import process error experienced:');
    //     console.log(error);
    //   });
  }

  function reportErrors(errors) {
    if (errors) {
      let table = document.createElement('table');
      let thead = document.createElement('thead');
      let tbody = document.createElement('tbody');
      table.id = 'myTable';

      table.appendChild(thead);
      table.appendChild(tbody);

      // let row = document.createElement('tr');
      // let cell = document.createElement('td')
      // cell.innerHTML = 'cell 1';
      // let cell1 = document.createElement('td')
      // cell1.innerHTML = 'cell 2';
      // row.appendChild(cell);
      // row.appendChild(cell1);
      // tbody.appendChild(row);

      errors.forEach((error, i) => {
        let row = document.createElement('tr');
        // let cell = document.createElement('td')
        let cell = document.createElement('td')
        cell.innerHTML = error[0];
        let cell1 = document.createElement('td')
        cell1.innerHTML = error[1];
        row.appendChild(cell);
        row.appendChild(cell1);
        tbody.appendChild(row);
      });
      //setErrorDisplay('Errors', errors.toString());
      elErrorTitle.innerText = 'Errors';
      elErrorDiv.appendChild(table);
      toggleWindowDisplayState(true, false, true, true);
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
  }

  /**
   * Wire up all events on initialisation.
   */
  function addEvents() {
    elProviderFile.addEventListener('change', providerFileSelectionChangeEvent, false);
    elProviderFile.addEventListener('focus', providerFileFocusEvent, false);
    elProviderDropdown.addEventListener('change', providerDropdownChangeEvent, false);
    elParseButton.addEventListener('click', parseClickEvent, false);
    elImportFile.addEventListener('focus', importFileFocusEvent, false);
    elImportButton.addEventListener('click', importButtonClickEvent, false);
  }

  /**
   * Decouple events on blur.
   */
  function removeEvents() {
    elProviderFile.removeEventListener('change', providerFileSelectionChangeEvent, false);
    elProviderFile.removeEventListener('focus', providerFileFocusEvent, false);
    elProviderDropdown.removeEventListener('change', providerDropdownChangeEvent, false);
    elParseButton.removeEventListener('click', parseClickEvent, false);
    elImportFile.removeEventListener('focus', importFileFocusEvent, false);
    elImportButton.removeEventListener('click', importButtonClickEvent, false);
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
      freshApi.getSession(session => {
        elAddin.querySelector('#ftiAddin-user').textContent = session.userName;
      });

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