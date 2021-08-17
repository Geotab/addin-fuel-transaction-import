# XMLHttpRequest and fetch

`XMLHttpRequest` and `fetch` browser APIs enable binary data transfer between
web browser clients and web servers.  Since this library works in web browsers,
server conversion work can be offloaded to the client!  This demo shows a few
common scenarios involving browser APIs and popular wrapper libraries.

## Demos

The included demos focus on an editable table.  There are two separate flows:

- When the page is accessed, the browser will attempt to download `sheetjs.xlsx`
  and read the workbook.  The old table will be replaced with an editable table
  whose contents match the first worksheet.  The table is generated using the
  `sheet_to_html` utility with `editable:true` option

- When the upload button is clicked, the browser will generate a new worksheet
  using `table_to_book` and build up a new workbook.  It will then attempt to
  generate a file and upload it to the server.

### Demo Server

The `server.js` nodejs server serves static files on `GET` request.  On a `POST`
request to `/upload`, the server processes the body and looks for uploaded file.
It will write the data for the first file to the indicated file name.

To start the demo, run `npm start` and navigate to <http://localhost:7262/>


## XMLHttpRequest

For downloading data, the `arraybuffer` response type generates an `ArrayBuffer`
that can be viewed as an `Uint8Array` and fed to `XLSX.read` using `array` type:

```js
/* set up an async GET request */
var req = new XMLHttpRequest();
req.open("GET", url, true);
req.responseType = "arraybuffer";

req.onload = function(e) {
  /* parse the data when it is received */
  var data = new Uint8Array(req.response);
  var workbook = XLSX.read(data, {type:"array"});
  /* DO SOMETHING WITH workbook HERE */
};
req.send();
```

For uploading data, this demo populates a `FormData` object with an ArrayBuffer
generated with the `array` output type:

```js
/* generate XLSX as array buffer */
var data = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});

/* build FormData with the generated file */
var fd = new FormData();
fd.append('data', new File([data], 'sheetjs.xlsx'));

/* send data */
var req = new XMLHttpRequest();
req.open("POST", "/upload", true);
req.send(fd);
```

### superagent Wrapper Library

The `superagent` library usage mirrors XHR:

```js
/* set up an async GET request with superagent */
superagent.get(url).responseType('arraybuffer').end(function(err, res) {
  /* parse the data when it is received */
  var data = new Uint8Array(res.body);
  var workbook = XLSX.read(data, {type:"array"});

  /* DO SOMETHING WITH workbook HERE */
});
```

The upload portion only differs in the actual request command:

```js
/* send data (fd is the FormData object) */
superagent.post("/upload").send(fd);
```

### axios Wrapper Library

The `axios` library presents a Promise interface.  The axios demo uses a single
promise, but for production deployments it may make sense to separate parsing:

```js
/* set up an async GET request with axios */
axios(url, {responseType:'arraybuffer'}).catch(function(err) {
  /* error in getting data */
}).then(function(res) {
  /* parse the data when it is received */
  var data = new Uint8Array(res.data);
  var workbook = XLSX.read(data, {type:"array"});
  return workbook;
}).catch(function(err) {
  /* error in parsing */
}).then(function(workbook) {
  /* DO SOMETHING WITH workbook HERE */
});
```

The upload portion only differs in the actual request command:

```js
/* send data (fd is the FormData object) */
axios("/upload", {method: "POST", data: fd});
```

## fetch

For downloading data, `response.arrayBuffer()` resolves to an `ArrayBuffer` that
can be converted to `Uint8Array` and passed to `XLSX.read`:

```js
fetch(url).then(function(res) {
  /* get the data as a Blob */
  if(!res.ok) throw new Error("fetch failed");
  return res.arrayBuffer();
}).then(function(ab) {
  /* parse the data when it is received */
  var data = new Uint8Array(ab);
  var workbook = XLSX.read(data, {type:"array"});

  /* DO SOMETHING WITH workbook HERE */
});
```

The upload code is identical to `axios`, except for the variable name:

```js
fetch("/upload", {method: "POST", body: fd});
```

[![Analytics](https://ga-beacon.appspot.com/UA-36810333-1/SheetJS/js-xlsx?pixel)](https://github.com/SheetJS/js-xlsx)
