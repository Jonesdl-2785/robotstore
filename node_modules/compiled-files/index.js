var zlib = require("zlib")
var crypto = require("crypto")

var isGzip = /\bgzip\b/

module.exports = CompiledFiles

function CompiledFiles(config) {
    config = config || {}
    var contentType = config.contentType || "text/plain"
    var sendError = config.sendError || defaultSendError
    var compress = config.compress || zlib.gzip
    var hash = config.hash || defaultHash
    var compile = config.compile
    var findResource = config.findResource

    if (!config.findResource) {
        throw new Error("Must pass in a resource finding function")
    }

    if (!config.compile) {
        throw new Error("Must pass in a compile function")
    }

    return function ServeFile(opts) {
        opts = opts || {}
        var cache = opts.cache
        var gzip = opts.gzip
        var cacheControl = opts.cacheControl || "max-age=300, must-revalidate"
        var compiledCache = {}

        function routeHandler(req, res) {
            var location = findResource(req, res, opts)

            res.setHeader("content-type", contentType)

            if (cache && compiledCache[location]) {
                return sendResource(req, res, compiledCache[location])
            }

            compile(location, opts, prepareResource)

            function prepareResource(err, payload) {
                if (err) {
                    return sendError(req, res, err)
                }

                if (gzip && acceptsGzip(req)) {
                    compress(payload, function (err, buffer) {
                        if (err) {
                            return sendError(req, res, err)
                        }

                        sendGzipPlain({ plain: payload, gzip: buffer })
                    })
                } else {
                    sendGzipPlain({ plain: payload })
                }
            }

            function sendGzipPlain(types) {
                var chunk = new FileChunk(types.plain, types.gzip,
                    hash(types.plain))

                if (cache) {
                    compiledCache[location] = chunk
                }

                sendResource(req, res, chunk)
            }
        }

        function sendResource(req, res, chunk) {
            var reqEtag = req.headers["if-none-match"] || ""

            if (cache && reqEtag === chunk.hash) {
                res.statusCode = 304
                return res.end()
            }

            res.statusCode = 200

            if (cache) {
                res.setHeader("Etag", chunk.hash)
                res.setHeader("Cache-Control", cacheControl)
            }

            if (gzip && chunk.gzip && acceptsGzip(req)) {
                res.setHeader("content-encoding", "gzip")
                return res.end(chunk.gzip)
            }

            return res.end(chunk.plain)
        }

        return routeHandler
    }
}

function acceptsGzip(req) {
    var acceptEncoding = req.headers["accept-encoding"] || ""

    return !!acceptEncoding.match(isGzip)
}

function defaultHash(value) {
    return crypto
        .createHash("md5")
        .update(value)
        .digest("hex")
}

function defaultSendError(req, res, err) {
    res.statusCode = 500
    res.end(err.message)
}

function FileChunk(plain, gzip, hash) {
    this.plain = plain
    this.hash = hash
    this.gzip = gzip || null
}


