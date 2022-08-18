/**
 * @returns {{initialize: Function, focus: Function, blur: Function, startup; Function, shutdown: Function}}
 */
geotab.addin.ftiAddin = function () {
  'use strict';
  /** The root container. */
  var elAddin = document.getElementById('ftiAddin');
  /** The provider file input element. */
  var elProviderFile = document.getElementById('providerFile');
  let elProviderDropdown = document.getElementById('providerDropdown');

  /**
   * Manages the provider file selection change event.
   * @param {*} event The event object.
   */
  var ProviderFileSelectionChangeEvent = async function (event) {
    let file = elProviderFile.files[0];
    if(file){
      //let jsonObject = GetJsonObjectFromFileAsync(file);
      var ojb = await GetJsonObjectFromFileAsync(file);
      PopulateProviderDropdown(ojb);
    }
  };

  /**
   * Gets the json object from a file object.
   * @param {*} fileInput file input element.
   */
  function GetJsonObjectFromFileAsync(file) {
    return new Promise(function(resolve, reject){
      let reader = new FileReader();
      reader.readAsText(file);
      reader.addEventListener('loadend', () => {
        let jsonObject = JSON.parse(reader.result);
        //PopulateProviderDropdown(jsonObject);
        resolve(jsonObject);
      });
      //reject('Nothing returned...');
    });
  }
  

  /**
   * Populates the provider dropdown from the providerConfiguration JSON object
   * @param {*} providerConfiguration provider configuration json object
   */
  function PopulateProviderDropdown(providerConfiguration){
    // if(providerConfiguration){
      console.log(providerConfiguration);
      elProviderDropdown.length = 0;
      let defaultOption = document.createElement('option');
      defaultOption.text = 'Choose Provider';
      elProviderDropdown.appendChild(defaultOption);
      elProviderDropdown.selectedIndex = 0;
      let option;
      for (let i = 0; i < providerConfiguration.providers.length; i++) {
          option = document.createElement('option');
          option.text = providerConfiguration.providers[i].Name;
          elProviderDropdown.appendChild(option);
      }
    // }
  }

  /**
   * Wire up all events on initialisation.
   */
  function addEvents(){
    elProviderFile.addEventListener('change', ProviderFileSelectionChangeEvent, false);
  }
  /**
   * Decouple events on blur.
   */
  function removeEvents(){
    elProviderFile.removeEventListener('change', ProviderFileSelectionChangeEvent, false);
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