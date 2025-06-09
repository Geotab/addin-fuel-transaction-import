/**
 * @returns {{initialize: Function, focus: Function, blur: Function, startup; Function, shutdown: Function}}
 */
geotab.addin.ftiAddin = function () {
  'use strict';

  // Classes
  const { ImportError } = require('./ImportError');
  const { TableGenerator } = require('./TableGenerator');
  // External libraries
  const configHelper = require('./ConfigHelper');
  const importHelper = require('./ImportHelper');
  const transactionHelper = require('./TransactionHelper');
  const moment = require('moment-timezone');
  const XLSX = require('xlsx');

  let versionNumber = '4.2.5';
  let api;
  let state;
  let currentUser;
  let currentUserTimeZoneId;
  /** The root container. */
  let elAddin = document.getElementById('ftiAddin');
  let elVersion = document.getElementById('ftiVersion');
  /** The provider file input element. */
  let elProviderFile = document.getElementById('providerFile');
  /** The fuel provider dropdown box */
  let elProviderDropdown = document.getElementById('providerDropdown');
  /** The time zone dropdown */
  let elTimeZoneDropdown = document.getElementById('timeZoneDropdown');
  /** The inputDiv section */
  let elInputDiv = document.getElementById('ftiInputDiv');
  /** The outputDiv section */
  let elOutputDiv = document.getElementById('outputDiv');
  /** The output title element */
  let elOutputTitle = document.getElementById('outputTitle');
  /** The output message element */
  let elOutputMessage = document.getElementById('outputMessage');
  /** The sheet number element */
  let elSheetNumber = document.getElementById('sheetNumber');
  /** The user guide element */
  let elUserGuide = document.getElementById('userGuide');
  /** Import stuff */
  let elFieldGroup1 = document.getElementById('fieldGroup1');
  let elFieldGroup2 = document.getElementById('fieldGroup2');
  let elFieldGroup3 = document.getElementById('fieldGroup3');
  let elFieldGroup4 = document.getElementById('fieldGroup4');
  let elFieldGroup5 = document.getElementById('fieldGroup5');
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
  /** The json transactions */
  let transactionsJson;
  /** Progress DOM items */
  let elProgressDiv = document.getElementById('progressDiv');
  let elProgressHeader = elProgressDiv.querySelector('h2');
  let elProgressText = document.getElementById('progressText');
  let elProgressBar = document.getElementById('progressBar');
  let elSpinner = document.getElementById('spinner');
  /** The browser timezone index for later resets. */
  let selectedTimezoneIndex;
  const TableElementId = 'ErrorTable';
  const ErrorListTitleId = 'ErrorListTitle';
  const TableImportSummaryElementId = 'ImportSummaryTable';
  /** Text/Messages for translation */
  let workingText = 'Working';
  let importedText = 'Imported';
  let skippedText = 'Skipped';
  let errorsText = 'Errors';
  let alertText = 'Alert';
  let noProvidersFoundText = 'no providers found...';
  let chooseProviderText = 'Choose provider';
  let importSummaryText = 'Import Summary';
  let errorListText = 'Error List';
  let errorListTitleText = 'List of transactions that produced errors.';
  let transactionText = 'Transaction';
  let exceptionText = 'Exception';
  let errorEntryText = 'Error Entry';
  let errorText = 'Error';
  let inputErrorText = 'Input Error';
  let unexpectedErrorText = 'Unexpected Error in importTransactions';
  let dataIssueText = 'Data Issue';
  let noTransactionsFoundText = 'No transactions found. Please try again...';
  let parsingAndBuildingText = 'Busy parsing and building the transactions...<br />If this import contains requests for physical addresses to be parsed to geographic coordinates this process could be time consuming depending on the number of transactions involded. Each transaction requires a unique request.';
  let validationProblemText = 'Configuration File Validation Problem';
  let busyParsingText = 'Busy parsing the excel file...';
  let fileNotFoundText = 'File Not Found';
  let selectFileText = 'Please select an import file.';
  let noFileSelectedText = 'No import file selected';
  let pleaseSelectFileText = 'Please select an import file prior to this operation.';
  let versionText = 'Version';
  let transactionsOfText = 'transactions of';
  let processedText = 'processed...';
  let rateLimitText = '\nRate limit reached, retrying batch again in 60 seconds...';
  let validationMessages = {
    providerNameRequired: 'A provider name is required.',
    dateFormatRequired: 'The dateFormat property is required.',
    noDeviceIdentifier: 'No device identifier has been defined.',
    noDateTime: 'No date and time defined.',
    dateTimeIncorrectFormat: 'The date and time defined is incorrectly formatted. Reason:',
    noVolume: 'No volume defined.',
    noCost: 'No cost defined.',
    noCurrency: 'No currency code defined.'
  };
  let luxonDateParserMessages = {
    condition1: 'Does not have a CAPITAL M and LOWER d and yy',
    condition2: 'Longer than 11 characters and does not contain h and m.',
    condition3: 'Contains disallowed characters other than Y, M, D, h, m, s, S or Z.',
    condition4: 'Shorter than 6 characters.',
    condition5: 'Greater than 24 characters.'
  };
  let combineDateTimeErrorMessageTranslations = {
    part1: 'Date and/or time are in the incorrect state. Date:',
    part2: 'Time:',
    part3: 'Most likely one of them is formatted as a date and the other is not.'
  };

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
    clearImportFile(elImportFile, importFile);
    elSheetNumber.value = 1;
  };

  /**
   * Clears the fuel provider dropdown when the config file selection receives the focus.
   */
  function providerFileFocusEvent() {
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
    if (providerConfigurationFile && providerConfigurationFile.providers) {
      initialiseProviderDropdown(chooseProviderText);
      let option;
      for (let i = 0; i < providerConfigurationFile.providers.length; i++) {
        option = document.createElement('option');
        option.text = providerConfigurationFile.providers[i].Name;
        elProviderDropdown.appendChild(option);
      }
    } else {
      let title = alertText;
      let alert = noProvidersFoundText;
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
    // console.log('providerName: ' + providerName);
    // console.log('providerConfiguration before update: ' + configuration);
    if (configurationFile) {
      // console.log('providerConfigurationFile: ' + configurationFile);
      // sets the providerConfiguration array to the providerName
      var configurationArray = configurationFile.providers.filter(provider =>
        provider.Name === providerName
      );
      configuration = configurationArray[0];
      // console.log('configuration set: ' + JSON.stringify(configuration));
    }
    // console.log('configuration selected: ' + configuration.Name);
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
      elProgressText.innerText = ''; 
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
    resetOutputDiv();
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
      setOutputDisplay(noFileSelectedText, pleaseSelectFileText);
    }
  }

  /**
   * Converts the excel file to binary format and then uses the XLSX library to convert the file into JSON format.
   * @param {File} excelFile The excel file to import.
   * @param {int} sheetIndex The sheet index (zero based). Default = 0.
   * @returns A promise resolved true when the excel transaction file has been converted to a JSON object.
   */
  function convertExcelToJsonAsync(excelFile, sheetIndex = 0) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
  
      reader.onload = (event) => {
        var data = event.target.result;
        var workbook = XLSX.read(data, {
          type: 'binary',
          cellDates: true
        });
        let jsonObject = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[sheetIndex]], {
            'header': 'A'
          });
          // console.log(jsonObject)
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
      setOutputDisplay(state.translate(fileNotFoundText), state.translate(selectFileText));
      return;
    }

    // ****** UI ******
    // disable form controls
    setControlState(false);
    // display the spinner
    elSpinner.style.display = 'inline-block';
    setOutputDisplay(workingText, state.translate(busyParsingText));
    // ****** UI ******

    let transactionsLocal;
    let sheetNumber = elSheetNumber.value - 1;
    // console.log(`sheetNumber: ${sheetNumber}`);
    convertExcelToJsonAsync(importFile, elSheetNumber.value-1)
    .then(results => {
      transactionsLocal = results;
    })
    .then(() => {
      // validate the configuration data
      var result = configHelper.validateConfiguration(configuration, validationMessages, luxonDateParserMessages);
      if (result.isValid === false) {
        var message = state.translate(validationProblemText);
        throw new ImportError(message, result.reason);
      }
      // parse the configuration defaults
      configHelper.parseConfigDefaults(configuration);
    })
    .then(() => {
      const remoteTimeZone = elTimeZoneDropdown.options[elTimeZoneDropdown.selectedIndex].value;
      setOutputDisplay(workingText, parsingAndBuildingText)
      return transactionHelper.ParseAndBuildTransactionsAsync(
        transactionsLocal, configuration, api, remoteTimeZone, currentUserTimeZoneId, combineDateTimeErrorMessageTranslations);
    })
    .then((results) => {
      resetOutputDiv();
      elSpinner.style.display = 'none';
      transactionsJson = results;
      toggleWindowDisplayState(true, true, true);
      if (transactionsJson) {
        // Import the transactions
        return importHelper.importTransactionsPromise(api, transactionsJson, elProgressText, elProgressBar, 200, 60000, transactionsOfText, processedText, rateLimitText);
      } else {
        //setOutputDisplay('Data Issue', 'No transactions found. Please try again...');
        throw new ImportError(dataIssueText, noTransactionsFoundText);
      }
    }).then((summary) => {
      if (summary) {
        importSummaryOutput(summary);
      }
      setControlState(true);
    })
    .catch(error => {
      elSpinner.style.display = 'none';
      resetOutputDiv();
      switch (error.name)
      {
        case 'InputError':
          const headers = [errorEntryText, errorText];
          const rows = [
            [JSON.stringify(error.entity), error.message]
          ];
          const tableGenerator = new TableGenerator(headers, rows);
          setOutputDisplay(inputErrorText, tableGenerator.generateTable());
          break;
        case 'ImportError':
          setOutputDisplay(error.message, error.moreInfo);
          break;
        default:
          setOutputDisplay(unexpectedErrorText, error);
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
    elSheetNumber.disabled = !isEnabled;
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
    // printImportSummary(importSummary, 'importSummaryOutput function');
    let table = document.createElement('table');
    let tbody = document.createElement('tbody');
    let tr1 = document.createElement('tr');
    let cell1 = document.createElement('td');
    cell1.innerHTML = importedText;
    let cellValue1 = document.createElement('td');
    cellValue1.innerHTML = importSummary.imported;
    cellValue1.className = 'ftiSuccess';
    tr1.appendChild(cell1);
    tr1.appendChild(cellValue1);
    tbody.appendChild(tr1);
    let tr2 = document.createElement('tr');
    let cell2 = document.createElement('td');
    let cellValue2 = document.createElement('td');
    cell2.innerHTML = skippedText;
    cellValue2.innerHTML = importSummary.skipped;
    tr2.appendChild(cell2);
    tr2.appendChild(cellValue2);
    tbody.appendChild(tr2);
    let tr3 = document.createElement('tr');
    let cell3 = document.createElement('td');
    let cellValue3 = document.createElement('td');
    cell3.innerHTML = errorsText;
    cellValue3.innerHTML = importSummary.errors.count;
    cellValue3.className = 'ftiFailed';
    tr3.appendChild(cell3);
    tr3.appendChild(cellValue3);
    tbody.appendChild(tr3);
    table.id = TableImportSummaryElementId;
    table.appendChild(tbody);
    table.className = 'ftiSummaryTable';
    elOutputDiv.appendChild(table);
    elOutputTitle.textContent = importSummaryText;
    elOutputMessage.textContent = '';
    if (importSummary.errors.failedCalls.length > 0) {
      reportErrors(importSummary.errors.failedCalls);
    }
  }

  function reportErrors(errors) {
    let title = document.createElement('h2');
    title.id = ErrorListTitleId;
    title.textContent = errorListText
    title.title = errorListTitleText
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
      th.innerHTML = transactionText;
      tr.appendChild(th);
      th1.innerHTML = exceptionText;
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
      
    }
  }

  function isEmpty(value){
    return (value == null || value.length === 0);
  }

  /**
   * Loads the time zone dropdown (select) with all global time zones and sets the selected item to the item passed in. If the argument is empty the browser time zone is set.
   * @param {string} selectedZone The default zone to select.
   * 
   */
  function loadTimeZoneList(selectedZone) {
    let option;
    elTimeZoneDropdown.innerHTML = '';
    if (isEmpty(selectedZone)) {
      selectedZone = moment.tz.guess();
      // console.log(selectedZone);
    }
    let timeZones = moment.tz.names();
    timeZones.forEach((timeZone) => {
      option = document.createElement('option');
      option.textContent = `${timeZone} (GMT${moment.tz(timeZone).format('Z')})`;
      option.value = timeZone;
      if (timeZone == selectedZone) {
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
    elSheetNumber.value = 1;
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

  /**
   * Translate the text fields
   */
  function translateText() {
    elImportButton.title = state.translate(elImportButton.title);
    elFieldGroup1.title = state.translate(elFieldGroup1.title);
    elFieldGroup2.title = state.translate(elFieldGroup2.title);
    elFieldGroup3.title = state.translate(elFieldGroup3.title);
    elFieldGroup4.title = state.translate(elFieldGroup4.title);
    elFieldGroup5.title = state.translate(elFieldGroup5.title);
    workingText = state.translate(workingText);
    importedText = state.translate(importedText);
    skippedText = state.translate(skippedText);
    errorsText = state.translate(errorsText);
    alertText = state.translate(alertText);
    noProvidersFoundText = state.translate(noProvidersFoundText);
    chooseProviderText = state.translate(chooseProviderText);
    importSummaryText = state.translate(importSummaryText);
    errorListText = state.translate(errorListText);
    errorListTitleText = state.translate(errorListTitleText);
    transactionText = state.translate(transactionText);
    exceptionText = state.translate(exceptionText);
    errorEntryText = state.translate(errorEntryText);
    errorText = state.translate(errorText);
    inputErrorText = state.translate(inputErrorText);
    unexpectedErrorText = state.translate(unexpectedErrorText);
    dataIssueText = state.translate(dataIssueText);
    noTransactionsFoundText = state.translate(noTransactionsFoundText);
    parsingAndBuildingText = state.translate(parsingAndBuildingText);
    validationProblemText = state.translate(validationProblemText);
    busyParsingText = state.translate(busyParsingText);
    fileNotFoundText = state.translate(fileNotFoundText);
    selectFileText = state.translate(selectFileText);
    noFileSelectedText = state.translate(noFileSelectedText);
    pleaseSelectFileText = state.translate(pleaseSelectFileText);
    elProgressHeader.innerText = state.translate(elProgressHeader.innerText);
    versionText = state.translate(versionText);
    transactionsOfText = state.translate(transactionsOfText);
    processedText = state.translate(processedText);
    validationMessages.dateFormatRequired = state.translate(validationMessages.dateFormatRequired);
    validationMessages.dateTimeIncorrectFormat = state.translate(validationMessages.dateTimeIncorrectFormat);
    validationMessages.noCost = state.translate(validationMessages.noCost);
    validationMessages.noCurrency = state.translate(validationMessages.noCurrency);
    validationMessages.noDateTime = state.translate(validationMessages.noDateTime);
    validationMessages.noDeviceIdentifier = state.translate(validationMessages.noDeviceIdentifier);
    validationMessages.noVolume = state.translate(validationMessages.noVolume);
    validationMessages.providerNameRequired = state.translate(validationMessages.providerNameRequired);
    luxonDateParserMessages.condition1 = state.translate(luxonDateParserMessages.condition1);
    luxonDateParserMessages.condition2 = state.translate(luxonDateParserMessages.condition2);
    luxonDateParserMessages.condition3 = state.translate(luxonDateParserMessages.condition3);
    luxonDateParserMessages.condition4 = state.translate(luxonDateParserMessages.condition4);
    luxonDateParserMessages.condition5 = state.translate(luxonDateParserMessages.condition5);
    combineDateTimeErrorMessageTranslations.part1 = state.translate(combineDateTimeErrorMessageTranslations.part1);
    combineDateTimeErrorMessageTranslations.part2 = state.translate(combineDateTimeErrorMessageTranslations.part2);
    combineDateTimeErrorMessageTranslations.part3 = state.translate(combineDateTimeErrorMessageTranslations.part3);
  };

  /**
   *  clears the import file previously set.
   * */
  function clearImportFile(elImportFile, importFile) {
    elImportFile.value = '';
    importFile = null;
  }


  /**
   * Sets the secondary user guide link.
   * @param {*} href The href link.
   * @param {*} text The text to display.
   */
  function setGuide(href, text) {
    let link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.textContent = text;
    elUserGuide.appendChild(link);
  }

  /**
   * Sets the secondary user guide link based on the browser language.
   * @param {*} navLang The navigator language. 
   */
  const setUserGuide = (navLang) => {
    let href = '';
    elUserGuide.innerHTML = '';
    switch (navLang) {
      case 'fr':
      case 'fr-FR':
        // console.log('French');
        href = 'https://docs.google.com/document/d/1DKh61wPUbR9DLw703QylcB36XXbPCoWpZrNJgx7jFN8/edit?usp=sharing';
        setGuide(href, 'Guide de l\'utilisateur (FR)');
        break;
      case 'de':
      case 'de-DE':
        // console.log('German');
        href = 'https://docs.google.com/document/d/1Wz1hg46nQk8IACRAKQkvWYmXvR44bghI8P0MW0HUOfY/edit?usp=sharing';
        setGuide(href, 'Benutzerhandbuch (DE)');
        break;
      case 'es':
      case 'es-ES':
        // console.log('Spanish');
        href = 'https://docs.google.com/document/d/1e1YHyWjLSTdBu1WD690zTwCEOMaEtqkhwgHd8PH-iEk/edit?usp=sharing';
        setGuide(href, 'Guía del usuario (ES)');
        break;
      case 'it':
      case 'it-IT':
        // console.log('Italian');
        href = 'https://docs.google.com/document/d/18HJQxlfHjyGKLfNqy60cJS8zMm0PUGz0U28zNwkXNOA/edit?usp=sharing';
        setGuide(href, 'Guida per l\'utente (IT)');
        break;
      // default:
      //   console.log('English and other');
      //   break;
    }
  };

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
      state = freshState;

      // Loading HTML translations
      if (freshState.translate) {
        freshState.translate(elAddin || '');
      }

      setUserGuide(navigator.language);
      addEvents();
      translateText();

      // Add the version information
      elVersion.innerText = versionText + ': ' + versionNumber;

      api.getSession(function (credentials, server) {
        api.call('Get', {
               typeName: 'User',
               search: {
                   name: credentials.userName
               }
           }, function (result) {
              if (result) {
                currentUser = result[0];
                // console.log(currentUser);
                currentUserTimeZoneId = currentUser.timeZoneId;
                // console.log(currentUserTimeZoneId);
                loadTimeZoneList(currentUserTimeZoneId); 
              } else {
                   var msg = 'Could not find user: ' + credentials.userName;
                  //  console.log(msg);
               }
           }, function (error) {
               console.log(error);
           });
       }, false);
       
      //loadTimeZoneList(currentUserTimeZoneId);

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
      // translateTitles();

      toggleWindowDisplayState(true, false, false);

      // Add the version information
      elVersion.innerText = versionText + ': ' + versionNumber;

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

