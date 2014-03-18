var http = require('http')
  , version="0.0.2"
  , platform="nodejs"
  , origin="plot";


module.exports = Plotly;

function Plotly(username,api_key) {
    if (!(this instanceof Plotly))  {
        return new Plotly(username,api_key);
    }
    this.username = username;
    this.api_key = api_key;
    return this;
}



Plotly.prototype.stream = function(opts, callback) {
  if (typeof opts === "string") {
    // allow users to pass in an object or string
    opts = {token: opts}
  }
  var options = {
    host: opts.host || 'stream.plot.ly',
    port: opts.port || 80,
    path: '/',
    method: 'POST',
    agent: false,
    headers: { "plotly-streamtoken" : opts.token }
  };

  var stream = http.request(options, function (res) {
                 parseRes(res, function (err, body) {

                 });
  if (stream.setTimeout) stream.setTimeout(Math.pow(2, 32) * 1000);
  callback(null, stream);
  return this;
};


Plotly.prototype.plot = function(data, layout, callback) {
  var opts = {};
  /*
   * permit Plotly.plot(options, callback)
   * where options is {data: [], layout: {}, host: host, port: port}.
   */
  if (typeof data === 'object' && typeof layout === 'function') {
    opts = data;
    callback = layout;
    layout = opts.layout || {};
    data = opts.data || [];
  }

  // allow users to just pass in an object for the data, data = {x:[],y:[]}
  if (!Array.isArray(data)) data = [data];

  var urlencoded = '',
      pack = {
        'platform': platform,
        'version': version,
        'args': JSON.stringify(data),
        'kwargs': JSON.stringify(layout),
        'un': this.username,
        'key': this.api_key,
        'origin': origin
      }

  for (var key in pack) {
    urlencoded += key + "=" + pack[key] + "&"
  }

  // trim off last ambersand
  urlencoded = urlencoded.substring(0, urlencoded.length - 1)

  var options = {
    host: opts.host || 'plot.ly',
    port: opts.port || 80,
    path: '/clientresp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': urlencoded.length
    }
  };

  http.request(options, function(res) {
    parseRes(res, function (err, body) {
      if (err || res.statusCode !== 200)
        callback({err: err, msg: body, statusCode: res.statusCode})
      else callback({msg: body, statusCode: res.statusCode)
    })
  })
  .on('error', function(e) {
    callback(e);
  })
  .write(urlencoded)
  .end();

  return this;
};

Plotly.prototype.signup = function(un, email, callback) {
  var opts = {}
    , pack = {'version': version, 'un': un, 'email': email, 'platform':platform}
    , urlencoded = '';

  /*
   * permit Plotly.signup(options, callback)
   * where options is {email: [], un: {}, host: host, port: port}.
   */
  if (typeof un === 'object' && typeof email === 'function') {
    opts = un;
    callback = email;
    un = opts.un;
    email = opts.email;
  }

  for (var key in pack) {
    urlencoded += key + "=" + pack[key] + "&"
  }
  urlencoded = urlencoded.substring(0, urlencoded.length - 1)

  var options = {
    host: opts.host || 'plot.ly',
    port: opts.port || 80,
    path: '/apimkacct',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': urlencoded.length
    }
  };

  http.request(options, function (res) {
    parseRes(res, function (err, body) {
      if (err || res.statusCode !== 200)
        callback({err: err, msg: body, statusCode: res.statusCode})
      else callback({msg: body, statusCode: res.statusCode)
    }
  })
  .on('error', function(err) {
      callback(err)
  })
  .write(urlencoded)
  .end();

  return this;

};


function parseRes (res, cb) {
  var body = ''
  res.setEncoding('utf8')
  res.on('data', function (data) {
    body += data
    if (body.length > 1e4) {
      // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQ
      res.connection.destroy()
      res.writeHead(413, {'Content-Type': 'text/plain'})
      res.end("req body too large")
      return cb("body overflow")
    }
  })

  res.on('end', function () {
    cb(null, body)
  })
}