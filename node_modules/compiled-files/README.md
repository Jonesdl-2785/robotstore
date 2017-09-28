# compiled-files

[![build status][1]][2] [![NPM version][3]][4] [![Coverage Status][5]][6]
[![gemnasium Dependency Status][7]][8] [![Davis Dependency status][9]][10]

statically serve compiled files with gzip & cache

## Example

CompiledFiles will generate a route handler that serves a file
   including running it through a custom compilation step,
   optional caching and optional gzipping.

```js
var CompiledFiles = require("compiled-files")
var resolve = require("resolve")
var path = require("path")
var url = require("url")
var browserify = require("browserify")
var http = require("http")

var ServeBrowserify = CompiledFiles({
    // custom function to take the Request and 'parse' what
    // resource the HTTP client has asked for.
    // This function finds the last part so `/js/foo` returns
    // `$opts.root/foo`
    findResource: function findResource(req, res, opts) {
        var pathname = url.parse(req.url).pathname
        var parts = pathname.split("/")
        return path.join(opts.root, parts[parts.length - 1])
    },
    // A custom compilation function. The notion is that you
    // are serving files that have a compilation step
    // here you just take the location returned from findResource
    // and return a string to the callback
    compile: function (location, opts, callback) {
        resolve(location, function (err, fileUri) {
            if (err) {
                return callback(err)
            }

            var b = browserify([fileUri])
            b.bundle(opts, callback)
        })
    },
    contentType: "application/json"
})

/* The ServeBrowserify that is returned is a function that takes
  options (which are passed to findResource & compile). It also
  takes default options like `cache` and `gzip` used to enable
  HTTP/compilation caching and gzipping support.
*/

http.createServer(ServeBrowserify({
    cache: true,
    gzip: true,
    root: path.join(__dirname, "scripts")
}))
```

## Installation

`npm install compiled-files`

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Colingo/compiled-files.png
  [2]: https://travis-ci.org/Colingo/compiled-files
  [3]: https://badge.fury.io/js/compiled-files.png
  [4]: https://badge.fury.io/js/compiled-files
  [5]: https://coveralls.io/repos/Colingo/compiled-files/badge.png
  [6]: https://coveralls.io/r/Colingo/compiled-files
  [7]: https://gemnasium.com/Colingo/compiled-files.png
  [8]: https://gemnasium.com/Colingo/compiled-files
  [9]: https://david-dm.org/Colingo/compiled-files.png
  [10]: https://david-dm.org/Colingo/compiled-files
  [11]: https://ci.testling.com/Colingo/compiled-files.png
  [12]: https://ci.testling.com/Colingo/compiled-files
