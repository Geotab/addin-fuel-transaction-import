# Other JS Engines and Deployments

There are many JS engines and deployments outside of web browsers. NodeJS is the
most popular deployment, but there are many others for special use cases.  Some
optimize for low overhead and others optimize for ease of embedding within other
applications.  Since it was designed for ES3 engines, the library can be used in
those settings!  This demo tries to demonstrate a few alternative deployments.

Some engines provide no default global object.  To create a global reference:

```js
var global = (function(){ return this; }).call(null);
```


## Swift + JavaScriptCore

iOS and OSX ship with the JavaScriptCore framework for running JS scripts from
Swift and Objective-C.  Hybrid function invocation is tricky, but explicit data
passing is straightforward.  The demo shows a standalone example for OSX.  For
playgrounds, the library should be copied to shared playground data directory
(usually `~/Documents/Shared Playground Data`):

```swift
/* This only works in a playground, see SheetJSCore.swift for standalone use */
import JavaScriptCore;
import PlaygroundSupport;

/* build path variable for the library */
let shared_dir = PlaygroundSupport.playgroundSharedDataDirectory;
let lib_path = shared_dir.appendingPathComponent("xlsx.full.min.js");

/* prepare JS context */
var context: JSContext! = JSContext();
var src = "var global = (function(){ return this; }).call(null);";
context.evaluateScript(src);

/* load library */
var lib = try? String(contentsOf: lib_path);
context.evaluateScript(lib);
let XLSX: JSValue! = context.objectForKeyedSubscript("XLSX");

/* to verify the library was loaded, get the version string */
let XLSXversion: JSValue! = XLSX.objectForKeyedSubscript("version")
var version  = XLSXversion.toString();
```

Binary strings can be passed back and forth using `String.Encoding.isoLatin1`:

```swift
/* parse sheetjs.xls */
let file_path = shared_dir.appendingPathComponent("sheetjs.xls");
let data: String! = try String(contentsOf: file_path, encoding: String.Encoding.isoLatin1);
context.setObject(data, forKeyedSubscript: "payload" as (NSCopying & NSObjectProtocol)!);
src = "var wb = XLSX.read(payload, {type:'binary'});";
context.evaluateScript(src);

/* write to sheetjsw.xlsx  */
let out_path = shared_dir.appendingPathComponent("sheetjsw.xlsx");
src = "var out = XLSX.write(wb, {type:'binary', bookType:'xlsx'})";
context.evaluateScript(src);
let outvalue: JSValue! = context.objectForKeyedSubscript("out");
var out: String! = outvalue.toString();
try? out.write(to: out_path, atomically: false, encoding: String.Encoding.isoLatin1);
```


## Nashorn

Nashorn ships with Java 8.  It includes a command-line tool `jjs` for running JS
scripts.  It is somewhat limited but does offer access to the full Java runtime.

The `load` function in `jjs` can load the minified source directly:

```js
var global = (function(){ return this; }).call(null);
load('xlsx.full.min.js');
```

The Java `nio` API provides the `Files.readAllBytes` method to read a file into
a byte array.  To use in `XLSX.read`, the demo copies the bytes into a plain JS
array and calls `XLSX.read` with type `"array"`.


## Rhino

[Rhino](http://www.mozilla.org/rhino) is an ES3+ engine written in Java.  The
`SheetJSRhino` class and `com.sheetjs` package show a complete JAR deployment,
including the full XLSX source.

Due to code generation errors, optimization must be turned off:

```java
Context context = Context.enter();
context.setOptimizationLevel(-1);
```


## ChakraCore

ChakraCore is an embeddable JS engine written in C++.  The library and binary
distributions include a command-line tool `chakra` for running JS scripts.

The simplest way to interact with the engine is to pass Base64 strings. The make
target builds a very simple payload with the data.


## Duktape

[Duktape](http://duktape.org/) is an embeddable JS engine written in C.  The
amalgamation makes integration extremely simple!  It supports `Buffer` natively:

```C
/* parse a C char array as a workbook object */
duk_push_external_buffer(ctx);
duk_config_buffer(ctx, -1, buf, len);
duk_put_global_string(ctx, "buf");
duk_eval_string_noresult("workbook = XLSX.read(buf, {type:'buffer'});");

/* write a workbook object to a C char array */
duk_eval_string(ctx, "XLSX.write(workbook, {type:'array', bookType:'xlsx'})");
duk_size_t sz;
char *buf = (char *)duk_get_buffer_data(ctx, -1, sz);
duk_pop(ctx);
```


## QuickJS

QuickJS is an embeddable JS engine written in C.  It provides a separate set of
functions for interacting with the filesystem and the global object.  It can run
the browser dist build.

The `global` object is available as `std.global`.  To make it visible to the
loader, create a reference to itself:

```js
std.global.global = std.global;
std.loadScript("xlsx.full.min.js");
```

The filesystem interaction mirrors POSIX, including separate allocations:

```js
/* read file */
var rh = std.open(filename, "rb"); rh.seek(0, std.SEEK_END);
var sz = rh.tell(); rh.seek();
var ab = new ArrayBuffer(sz); rh.read(ab, 0, sz); rh.close();
var wb = XLSX.read(ab, {type: 'array'});

/* write file */
var ab = XLSX.write(wb, {type: 'array'});
var wh = std.open("sheetjs.qjs.xlsx", "wb");
wh.write(out, 0, ab.byteLength); wh.close();
```


## Goja

Goja is a pure Go implementation of ECMAScript 5.  As of this writing, there are
some issues with processing Unicode data, but the `xlsx.core.min.js` script can
be processed.  `[]byte` should be transformed to a binary string in the engine:

```go
/* read file */
data, _ := ioutil.ReadFile("sheetjs.xlsx")

/* load into engine */
vm.Set("buf", data)

/* convert to binary string */
_, _ = vm.RunString("var bstr = ''; for(var i = 0; i < buf.length; ++i) bstr += String.fromCharCode(buf[i]);")

/* parse */
wb, _ = vm.RunString("wb = XLSX.read(bstr, {type:'binary', cellNF:true});")
```

On the write side, `"base64"` strings can be decoded in Go:

```go
b64str, _ := vm.RunString("XLSX.write(wb, {type:'base64', bookType:'xlsx'})")
buf, _ := base64.StdEncoding.DecodeString(b64str.String())
_ = ioutil.WriteFile("sheetjs.xlsx", buf, 0644)
```

[![Analytics](https://ga-beacon.appspot.com/UA-36810333-1/SheetJS/js-xlsx?pixel)](https://github.com/SheetJS/js-xlsx)
