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
  let elPreviewButton = document.getElementById('previewButton');
  /** The import button */
  let elImportButton = document.getElementById('importButton');
  /** The import file input element */
  let elImportFile = document.getElementById('importFile');
  /** The provider configuration file */
  let providerConfigurationFile;
  /** The provider configuration object */
  var providerConfiguration;
  /** The excel transactions */
  var transactionsExcel;
  /** The json transactions */
  var transactionsJson;

  function ParseFuelTransaction(){
      fuelTransactionParser.FuelTransactionParser();
  }

  /**
   * Manages the provider file selection change event.
   * @param {*} event The event object.
   */
  var providerFileSelectionChangeEvent = async function (event) {
    toggleWindowDisplayState(true, false, false);
    let file = elProviderFile.files[0];
    if(file){
      providerConfigurationFile = await getJsonObjectFromFileAsync(file);
      populateProviderDropdown(providerConfigurationFile);
    }
  };

  /**
   * clears the fuel provider dropdown when the config file selection receives the focus.
   */
  function providerFileFocusEvent() {
    initialiseProviderDropdown('None selected');
  }

  /**
   * Returns a json object from a file object.
   * @param {*} fileInput file object.
   */
  function getJsonObjectFromFileAsync(file) {
    return new Promise(function(resolve, reject){
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
  
  function initialiseProviderDropdown(text){
    elProviderDropdown.length = 0;
    let defaultOption = document.createElement('option');
    defaultOption.text = text;
    elProviderDropdown.appendChild(defaultOption);
    elProviderDropdown.selectedIndex = 0;
  }

  /**
   * Populates the provider dropdown from the provider configuration JSON object
   * @param {*} providerConfiguration provider configuration json object
   */
  function populateProviderDropdown(providerConfiguration){
    if(providerConfiguration && providerConfiguration.providers){
      initialiseProviderDropdown('Choose provider');
      let option;
      for (let i = 0; i < providerConfiguration.providers.length; i++) {
          option = document.createElement('option');
          option.text = providerConfiguration.providers[i].Name;
          elProviderDropdown.appendChild(option);
      }
    } else {
      let title = 'Alert';
      let alert = 'no providers found...';
      setErrorDiv(title, alert);
    }
  }

  async function providerDropdownOnchangeEvent(event){
    console.log(providerConfigurationFile);
    console.log(event);
    var selectedIndex = elProviderDropdown.selectedIndex;
    console.log(selectedIndex);
    var selectedValue = elProviderDropdown.options[elProviderDropdown.selectedIndex].value;
    console.log(selectedValue);
    var dropdownItemCount = elProviderDropdown.length;
    console.log(dropdownItemCount);
    if (selectedIndex != '0') {
      console.log('Index selected: ' + selectedIndex);
    }
  }

  /**
   * Toggles the window display state for the 3 main sections - input, output and error.
   * @param {Boolean} input true to display the input section.
   * @param {Boolean} output true to display the output section.
   * @param {Boolean} error true to display the error section.
   */
  function toggleWindowDisplayState(input, output, error){
    input ? elInputDiv.classList.remove('ftiHidden'): elInputDiv.classList.add('ftiHidden');
    output ? elOutputDiv.classList.remove('ftiHidden'): elOutputDiv.classList.add('ftiHidden');
    error ? elErrorDiv.classList.remove('ftiHidden'): elErrorDiv.classList.add('ftiHidden');
  }


  /**
   * Sets the errorDiv title and text elements.
   * @param {*} title The title heading text element.
   * @param {*} alert The alert message text element.
   */
  function setErrorDiv(title, alert) {
    toggleWindowDisplayState(true, false, true);
    elErrorTitle.innerText = title;
    elErrorMessage.innerText = alert;
  }

  async function preview() {
    let file = elImportFile.files[0];
    fileOperations.uploadFilePromise(api, file)
    .then (request => {
      console.log('File upload completed...');
      return fileOperations.uploadCompletePromise(request);
    })
    .then (results => {
      console.log('Process the results...');
      // console.log('results: ' + results.data[0]['ColumnA']);      
      // console.log('results: ' + results.data[1]['ColumnA']);      
      var headings = parsers.getHeadings(results.data);
      console.log(headings);
    })
    .catch (error => {
      console.log('Preview process error experienced:');
      console.log(error);
    });
  }

  /**
   * Wire up all events on initialisation.
   */
  function addEvents(){
    elProviderFile.addEventListener('change', providerFileSelectionChangeEvent, false);
    elProviderFile.addEventListener('focus', providerFileFocusEvent, false);
    elProviderDropdown.addEventListener('change', providerDropdownOnchangeEvent, false);
    elPreviewButton.addEventListener('click', preview, false);
  }

  /**
   * Decouple events on blur.
   */
  function removeEvents(){
    elProviderFile.removeEventListener('change', providerFileSelectionChangeEvent, false);
    elProviderFile.removeEventListener('focus', providerFileFocusEvent, false);
    elProviderDropdown.removeEventListener('change', providerDropdownOnchangeEvent, false);
    elPreviewButton.removeEventListener('click', preview, false);
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
      //ToggleWindowState(true, false, false);
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