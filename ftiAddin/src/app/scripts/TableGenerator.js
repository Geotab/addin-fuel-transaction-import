export class TableGenerator {
   constructor(headers, rows) {
     this.headers = headers;
     this.rows = rows;
   }
 
   generateTable() {
     let table = '<table class=\'ftiTable\'>';
 
     // generate table headers
     table += '<thead><tr>';
     this.headers.forEach(header => {
       table += `<th>${header}</th>`;
     });
     table += '</tr></thead>';
 
     // generate table rows
     table += '<tbody>';
     this.rows.forEach(row => {
       table += '<tr>';
       row.forEach(cell => {
         table += `<td>${cell}</td>`;
       });
       table += '</tr>';
     });
     table += '</tbody></table>';
 
     return table;
   }
 }
 
// example usage
/*
const headers = ['Name', 'Age', 'Gender'];
const rows = [
  ['John', 25, 'Male'],
  ['Jane', 30, 'Female'],
  ['Bob', 42, 'Male'],
];

const tableGenerator = new HTMLTableGenerator(headers, rows);
const table = tableGenerator.generateTable();
console.log(table);
*/
 
 
 
 
 