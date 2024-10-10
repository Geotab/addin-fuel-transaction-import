# Fuel Transaction Import Add-In

## Provider Configuration File Structure

This describes the configuration file structure with it's properties and how to correctly compile it in order to successfully import [fuel transaction data](https://developers.geotab.com/myGeotab/apiReference/objects/FuelTransaction) into the MyGeotab database system.

## Configuration File properties

**Name** (**Required**): Represents the name of the Fuel Provider. This name will be listed in a dropdown menu in the Add-in to fascilitate the provider selection in the import process.

**unitVolumeLiters** (default = Y): Y/N (boolean) value that specifies if the fuel in the transaction file is expressed in liters or gallons. Accepts only “Y” or “N".

**unitOdoKm** (default = Y): Y/N (boolean) value that specifies if the odometer in the transaction file is expressed in km or miles. Accepts only “Y” or “N”.

**isCellDateType** (default = Y): Y/N (boolean) value that specifies if the date cell in the Excel file is of a Date format or not. By default, the value is “Y” and indicates that the format is a date in Excel. If it is a date, the software does not check how the dateFormat field is filled. If it is date and time composed by multiple cells (for example, ColumnC + ColumnB), it is mandatory to fill out both fields dateFormat and timeFormat.

**dateFormat** (**Required**): Specifies the date format to be expected in the transaction file. This property can include the time depending on whether the time is contained in the same excel column or not, refer to the [date & time rules](#DateTimeRules) below. The [luxon library](https://moment.github.io/luxon/#/?id=luxon) has been used to handle dates so where string dates are used, a format needs to be supplied and the correct implementation of these formats can be found here:
[Luxon format tokens reference](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).

**timeFormat**: Defines the time format if the date and time values are contained in separate excel columns in the import file e.g. HHmmss or HH:mm:ss etc. Refer to the [date & time rules](#date-and-time-rules) below.

**currencyCodeMapped** (default = USD): The ISO formatted currency code to be used if no currency code is found in the import excel file. Examples - https://www.iso.org/iso-4217-currency-codes.html.

**productTypeRegex** A regular expression can be applied to the productType property if required. It expects and array or objects, the first property of the object is the output required e.g. Diesel or CNG and the second property is the regular expression to be applied. If a match is found the output will be returned for the productType input operation.

**Note:** The [JavaScript regular expression test method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test) has been implemented as the comparison mechanism for this solution.

Example:

```
"productTypeRegex": [
{ "Diesel": "([w ]*[Dd]iesel[w ]*)|([w ]*[Nn]estle[w ]*)" },
{ "CNG": "([w ]*[Pp]etrol[w ]*)|([w ]*[Gg]as[w ]*)" },
{
    "DieselExhaustFluid": "([w ]*[Aa]dblue[w ]*)|([w ]*[Ee]xhaustFluid[w ]*)"
}
],
```

**data**: a JSON object containing some or all of the [FuelTransaction](https://developers.geotab.com/myGeotab/apiReference/objects/FuelTransaction) properties.

The data object in the configuration file contains the Fuel Transaction fields to be imported and their column reference.

<table>
<tr><th>Data Metric</th><th>Details</th><th>Example</th></tr>
<tr>
    <td>Location</td>
    <td>Provide the location data (longitude & latitude) in an array</td>
<td>
"location": ["ColumnQ","ColumnR"],
</td>
</tr>
<tr><td>Address (Location)</td><td>Provide the address information in a single column</td><td>"address":"ColumnX"</td></tr>
</table>

## Examples

- A shell source file can be found here [source.json](source.json).
- The generic source reference file can be downloaded from [here](generic.json).

## <a id="DateTimeRules" name="DateTimeRules">Date And Time Rules</a>

1. **dateFormat** is required
2. If **date** and **time** are submitted in a **single** excel column then the complete **date and time format** should be provided in the **dateFormat** property of the configuration file.
3. If **date** and **time** are submitted in **separate** excel columns then the **date format** should be provided in the **dateFormat** property and the **time format** should be provided in the **timeFormat** of the configuration file.
4. Both **date** and **time** must be in the same format so either both are formatted as dates or both are formatted as text.
5. If **date** and **time** are formatted as text then the corresponding format configurations are required i.e. **dateFormat** and/or **timeFormat**.
