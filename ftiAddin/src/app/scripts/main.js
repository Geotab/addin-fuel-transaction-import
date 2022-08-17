/**
 * @returns {{initialize: Function, focus: Function, blur: Function, startup; Function, shutdown: Function}}
 */
geotab.addin.ftiAddin = function () {
  'use strict';
  /** The root container. */
  var elAddin = document.getElementById('ftiAddin');
  /** The provider file input html reference. */
  var elProviderFile = document.getElementById('providerFile');
  let elProviderDropdown = document.getElementById('providerDropdown');

  /**
   * Selects the first file (if many) and enables the open file button, clears
   * the transaction list and disables all alerts.
   * @param {Event} e The event emitter
   */
    var fileSelected = function (e) {
      let file = elProviderFile.files[0];
      let jsonObject;
      let reader = new FileReader();
      reader.readAsText(file);
      reader.addEventListener('loadend', () => {
        //let data = reader.result;
        jsonObject = JSON.parse(reader.result);
        console.log(jsonObject);
        // populate the dropdown provider list
        elProviderDropdown.length = 0;
        elProviderDropdown.style.display = 'block';
        let defaultOption = document.createElement('option');
        defaultOption.text = 'Choose Provider';
        elProviderDropdown.appendChild(defaultOption);
        elProviderDropdown.selectedIndex = 0;
        let option;
        for (let i = 0; i < jsonObject.providers.length; i++) {
            option = document.createElement('option');
            option.text = jsonObject.providers[i].Name;
            elProviderDropdown.appendChild(option);
        }
      });
      
      // var jsonObject;
      // var file;
      // if (e.target.files) {
      //     file = e.target.files[0];
      // } else {
      //     // ie9
      //     file = { name: elFiles.value.substring(elFiles.value.lastIndexOf('\\') + 1, elFiles.length) };
      // }
      // if (file) {
      //   var reader = new FileReader();
      //   reader.addEventListener('load', function() {
      //     jsonObject = JSON.parse(reader.result);
      //   })
      //     console.log('file selected...');
      //     console.log(file.name);
      //     console.log(jsonObject);
      // }
    };

  function addEvents(){
    elProviderFile.addEventListener('change', fileSelected, false);
  }

  function removeEvents(){
    elProviderFile.removeEventListener('change', fileSelected, false);
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
