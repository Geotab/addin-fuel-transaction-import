/**
 * @returns {{initialize: Function, focus: Function, blur: Function, startup; Function, shutdown: Function}}
 */
geotab.addin.ftiAddin = function () {
  'use strict';

  const fuelTransactionParser = require('./FuelTransactionParser');

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
  /** The transaction Array list */
  var transactions;

  function ParseFuelTransaction(){
      fuelTransactionParser.FuelTransactionParser();
  }

  /**
   * Manages the provider file selection change event.
   * @param {*} event The event object.
   */
  var ProviderFileSelectionChangeEvent = async function (event) {
    ToggleWindowDisplayState(true, false, false);
    let file = elProviderFile.files[0];
    if(file){
      var jsonObject = await GetJsonObjectFromFileAsync(file);
      PopulateProviderDropdown(jsonObject);
    }
  };

  /**
   * clears the fuel provider dropdown when the config file selection receives the focus.
   */
  function ProviderFileFocusEvent() {
    InitialiseProviderDropdown('None selected');
  }

  /**
   * Returns a json object from a file object.
   * @param {*} fileInput file object.
   */
  function GetJsonObjectFromFileAsync(file) {
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
  
  function InitialiseProviderDropdown(text){
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
  function PopulateProviderDropdown(providerConfiguration){
    if(providerConfiguration && providerConfiguration.providers){
      InitialiseProviderDropdown('Choose provider');
      let option;
      for (let i = 0; i < providerConfiguration.providers.length; i++) {
          option = document.createElement('option');
          option.text = providerConfiguration.providers[i].Name;
          elProviderDropdown.appendChild(option);
      }
    } else {
      let title = 'Alert';
      let alert = 'no providers found...';
      SetErrorDiv(title, alert);
    }
  }

  /**
   * Toggles the window display state for the 3 main sections - input, output and error.
   * @param {Boolean} input true to display the input section.
   * @param {Boolean} output true to display the output section.
   * @param {Boolean} error true to display the error section.
   */
  function ToggleWindowDisplayState(input, output, error){
    input ? elInputDiv.classList.remove('ftiHidden'): elInputDiv.classList.add('ftiHidden');
    output ? elOutputDiv.classList.remove('ftiHidden'): elOutputDiv.classList.add('ftiHidden');
    error ? elErrorDiv.classList.remove('ftiHidden'): elErrorDiv.classList.add('ftiHidden');
  }


  /**
   * Sets the errorDiv title and text elements.
   * @param {*} title The title heading text element.
   * @param {*} alert The alert message text element.
   */
  function SetErrorDiv(title, alert){
    ToggleWindowDisplayState(true, false, true);
    elErrorTitle.innerText = title;
    elErrorMessage.innerText = alert;
  }

  /**
   * Wire up all events on initialisation.
   */
  function addEvents(){
    elProviderFile.addEventListener('change', ProviderFileSelectionChangeEvent, false);
    elProviderFile.addEventListener('focus', ProviderFileFocusEvent, false);
  }

  /**
   * Decouple events on blur.
   */
  function removeEvents(){
    elProviderFile.removeEventListener('change', ProviderFileSelectionChangeEvent, false);
    elProviderFile.removeEventListener('focus', ProviderFileFocusEvent, false);
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
          
      ToggleWindowDisplayState(true, false, false);
          
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