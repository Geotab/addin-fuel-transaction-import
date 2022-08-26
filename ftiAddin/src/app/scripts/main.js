/**
 * @returns {{initialize: Function, focus: Function, blur: Function, startup; Function, shutdown: Function}}
 */
geotab.addin.ftiAddin = function () {
  'use strict';

  const fuelTransactionParser = require('./FuelTransactionParser');
  const fileOperations = require('./FileOperations');
  const parsers = require('./Parsers');

  let api;
  /** The root container. */
  var elAddin = document.getElementById('ftiAddin');
  /** The provider file input element. */
  var elProviderFile = document.getElementById('providerFile');
  /** The fuel provider dropdown box */
  let elProviderDropdown = document.getElementById('providerDropdown');
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
  /** The preview button */
  let elParseButton = document.getElementById('parseButton');
  /** The import button */
  let elImportButton = document.getElementById('importButton');
  /** The import file input element */
  let elImportFile = document.getElementById('importFile');
  /** The provider configuration file */
  let providerConfigurationFile;
  /** The provider configuration object */
  let providerConfiguration;
  /** The excel file containing the transactions to be imported */
  let importFile;
  /** The excel transactions */
  var transactionsExcel;
  /** The json transactions */
  var transactionsJson;

  /**
   * todo: add the documentation when ready.
   */
  function ParseFuelTransaction() {
    fuelTransactionParser.FuelTransactionParser();
  }

  /**
   * Manages the provider file selection change event.
   * @param {*} event The event object.
   */
  var providerFileSelectionChangeEvent = async function (event) {
    toggleWindowDisplayState(true, false, false);
    let file = elProviderFile.files[0];
    if (file) {
      providerConfigurationFile = await getJsonObjectFromFileAsync(file);
      populateProviderDropdown(providerConfigurationFile);
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
      setErrorDiv(title, alert);
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
    console.log('providerConfiguration before update: ' + providerConfiguration);
    if (providerConfigurationFile) {
      console.log('providerConfigurationFile: ' + providerConfigurationFile);
      // sets the providerConfiguration array to the providerName
      providerConfiguration = providerConfigurationFile.providers.filter(provider =>
        provider.Name === providerName
      );
    }
    console.log('providerConfiguration selected: ' + providerConfiguration[0].Name);
  }

  /**
   * Toggles the window display state for the 3 main sections - input, output and error.
   * @param {Boolean} input true to display the input section.
   * @param {Boolean} output true to display the output section.
   * @param {Boolean} error true to display the error section.
   */
  function toggleWindowDisplayState(input, output, error) {
    input ? elInputDiv.classList.remove('ftiHidden') : elInputDiv.classList.add('ftiHidden');
    output ? elOutputDiv.classList.remove('ftiHidden') : elOutputDiv.classList.add('ftiHidden');
    error ? elErrorDiv.classList.remove('ftiHidden') : elErrorDiv.classList.add('ftiHidden');
  }


  /**
   * Sets the errorDiv title and text elements.
   * @param {string} title The title heading text element.
   * @param {string} alert The alert message text element.
   */
  function setErrorDiv(title, alert) {
    toggleWindowDisplayState(true, false, true);
    elErrorTitle.innerText = title;
    elErrorMessage.innerText = alert;
  }

  /**
   * Initialises the global importFile variable.
   */
  function getImportFile() {
    if (elImportFile) {
      importFile = elImportFile.files[0];
    } else {
      setErrorDiv('No import file selected', 'Please select an import file prior to this operation.');
    }
  }

  /**
   * The parse button click event.
   */
  async function parseClickEvent() {
    getImportFile();
    // Check initial state.
    if (!importFile) {
      setErrorDiv('File Not Found', 'Please select an import file.');
      return;
    }
    fileOperations.uploadFilePromise(api, importFile)
      .then(request => {
        console.log('File upload completed...');
        return fileOperations.uploadCompletePromise(request);
      })
      .then(results => {
        console.log('Process the results...');
        var result = fuelTransactionParser.validateProviderConfiguration(providerConfiguration[0].data);
        console.log('validation result, isValid: ' + result.isValid);
        console.log('validation result, reason: ' + result.reason);
        //console.log(result);
        // console.log('results: ' + results.data[0]['ColumnA']);      
        // console.log('results: ' + results.data[1]['ColumnA']);      
        var headings = parsers.getHeadings(results.data);
        console.log(headings);
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
   * Wire up all events on initialisation.
   */
  function addEvents() {
    elProviderFile.addEventListener('change', providerFileSelectionChangeEvent, false);
    elProviderFile.addEventListener('focus', providerFileFocusEvent, false);
    elProviderDropdown.addEventListener('change', providerDropdownChangeEvent, false);
    elParseButton.addEventListener('click', parseClickEvent, false);
    elImportFile.addEventListener('focus', importFileFocusEvent, false);
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