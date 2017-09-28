var test = require("tape")
var FakeResponse = require("hammock/response")

var CompiledFiles = require("../index")

function compileId(uri, opts, callback) { callback(null, uri) }
function returnUrl(req) { return req.url }

test("CompiledFiles is a function", function (assert) {
    assert.equal(typeof CompiledFiles, "function")
    assert.end()
})

test("CompiledFiles throws without findResource", function (assert) {
    assert.throws(function () {
        CompiledFiles()
    }, /Must pass in a resource finding function/)

    assert.end()
})

test("CompiledFiles throws without compile", function (assert) {
    assert.throws(function () {
        CompiledFiles({
            findResource: function () {}
        })
    }, /Must pass in a compile function/)

    assert.end()
})

test("CompiledFiles returns a function", function (assert) {
    var ServeFile = CompiledFiles({
        findResource: returnUrl,
        compile: compileId
    })

    assert.equal(typeof ServeFile, "function")

    assert.end()
})

test("CompiledFiles can be used to serve files", function (assert) {
    var ServeFile = CompiledFiles({
        findResource: returnUrl,
        compile: compileId,
        contentType: "application/foobar"
    })

    var routeHandler = ServeFile()
    var req = { url: "/foo", headers: {} }
    var res = FakeResponse(function (err, res) {
        assert.ifError(err)
        assert.equal(res.body, "/foo")
        assert.equal(res.headers["content-type"], "application/foobar")
        assert.equal(res.statusCode, 200)

        assert.end()
    })

    routeHandler(req, res)
})

test("setting cache option only calls compile once", function (assert) {
    var compilationCount = 0
    var ServeFile = CompiledFiles({
        findResource: returnUrl,
        compile: function compile(uri, opts, callback) {
            compilationCount++
            callback(null, uri)
        },
        hash: function (value) {
            return "~~" + value + "~~"
        }
    })

    var routeHandler = ServeFile({ cache: true })
    var req1 = { url: "/foo", headers: {} }
    var res1 = FakeResponse(function (err, res) {
        assert.ifError(err)

        assert.equal(res.body, "/foo")
        assert.equal(res.headers["content-type"], "text/plain")
        assert.equal(res.headers["cache-control"],
            "max-age=300, must-revalidate")
        assert.equal(res.headers.etag, "~~/foo~~")
        assert.equal(res.statusCode, 200)
    })

    routeHandler(req1, res1)

    assert.equal(compilationCount, 1)

    var req2 = { url: "/foo", headers: {
        "if-none-match": "~~/foo~~"
    } }
    var res2 = FakeResponse(function (err, res) {
        assert.ifError(err)

        assert.equal(res.body, "")
        assert.equal(res.statusCode, 304)
        assert.equal(res.headers["content-type"], "text/plain")
    })

    routeHandler(req2, res2)

    assert.equal(compilationCount, 1)

    assert.end()
})

test("sends errors on compilation error", function (assert) {
    var ServeFile = CompiledFiles({
        findResource: returnUrl,
        compile: function (uri, opts, callback) {
            callback(new Error("compilation error"))
        }
    })

    var routeHandler = ServeFile()
    var req1 = { url: "/foo", headers: {} }
    var res1 = FakeResponse(function (err, res) {
        assert.ifError(err)

        assert.equal(res.body, "compilation error")
        assert.equal(res.headers["content-type"], "text/plain")
        assert.equal(res.statusCode, 500)
    })

    routeHandler(req1, res1)

    var ServeFile2 = CompiledFiles({
        findResource: returnUrl,
        compile: function (uri, opts, callback) {
            callback(new Error("compilation error"))
        },
        sendError: function (req, res, err) {
            res.statusCode = 501
            res.end("Fail :( " + err.message)
        }
    })

    var routeHandler2 = ServeFile2()
    var req2 = { url: "/foo", headers: {} }
    var res2 = FakeResponse(function (err, res) {
        assert.ifError(err)

        assert.equal(res.body, "Fail :( compilation error")
        assert.equal(res.headers["content-type"], "text/plain")
        assert.equal(res.statusCode, 501)
    })

    routeHandler2(req2, res2)

    assert.end()
})

test("test gzipping", function (assert) {
    var ServeFile = CompiledFiles({
        findResource: returnUrl,
        compile: compileId,
        compress: function (x, callback) {
            callback(null, "@@" + x + "@@")
        }
    })

    var routeHandler = ServeFile({ gzip: true })
    var req1 = { url: "/foo", headers: {} }
    var res1 = FakeResponse(function (err, res) {
        assert.ifError(err)

        assert.equal(res.body, "/foo")
        assert.equal(res.statusCode, 200)
        assert.equal(res.headers["content-type"], "text/plain")
    })

    routeHandler(req1, res1)

    var req2 = { url: "/foo", headers: {
        "accept-encoding": "any gzip "
    } }
    var res2 = FakeResponse(function (err, res) {
        assert.ifError(err)

        assert.equal(res.statusCode, 200)
        assert.equal(res.body, "@@/foo@@")
        assert.equal(res.headers["content-type"], "text/plain")
        assert.equal(res.headers["content-encoding"], "gzip")
    })

    routeHandler(req2, res2)

    assert.end()
})

test("gzip errors are handled", function (assert) {
    var ServeFile = CompiledFiles({
        findResource: returnUrl,
        compile: compileId,
        compress: function (x, callback) {
            callback(new Error("compression error"))
        }
    })

    var routeHandler = ServeFile({ gzip: true })
    var req1 = { url: "/foo", headers: {} }
    var res1 = FakeResponse(function (err, res) {
        assert.ifError(err)

        assert.equal(res.statusCode, 200)
        assert.equal(res.body, "/foo")
        assert.equal(res.headers["content-type"], "text/plain")
    })

    routeHandler(req1, res1)

    var req2 = { url: "/foo", headers: {
        "accept-encoding": "any gzip "
    } }
    var res2 = FakeResponse(function (err, res) {
        assert.ifError(err)

        assert.equal(res.statusCode, 500)
        assert.equal(res.body, "compression error")
        assert.equal(res.headers["content-type"], "text/plain")
    })

    routeHandler(req2, res2)

    assert.end()
})
