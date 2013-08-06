// libsamplerate function wrappers

files = {}

function addTaglibFile(file, content) {
  var ptr = _malloc(1);
  files[ptr] = {
    file: file,
    content: content,
    position: 0
  }

  if (content) {
    files[ptr].length = content.byteLength;
  } else {
    files[ptr].length = file.size;
  }

  return ptr;
};

function getTaglibFile(ptr) {
  return files[ptr];
}

function removeTaglibFile(ptr) {
  if (!files[ptr]) {
    return;
  }

  files[ptr] = null;
  _free(ptr);
}

function guessFormat(fname) {
  if (/\.mp3$/i.test(fname)) {
    return "mpeg";
  }

  if (/\.ogg$/i.test(fname)) {
    return "ogg/vorbis";
  }

  if (/\.mp4$/i.test(fname)) {
    return "mp4";
  }

  if (/\.aac$/i.test(fname)) {
    return "mp4";
  }

  if (/\.m4a$/i.test(fname)) {
    return "mp4";
  }

  if (/\.wav$/i.test(fname)) {
    return "wav";
  }
}

function readFile(file, format, content) {
  var strArray;

  var _file = addTaglibFile(file, content);

  var allocString = function (s) {
    var strArray = intArrayFromString(s);
    var _ptr = _malloc(strArray.length);
    Module.HEAPU8.subarray(_ptr, _ptr+strArray.length).set(strArray);
    setValue(_ptr+strArray.length+1, 0, "i8");
    return _ptr;
  }

  var _filename = allocString(file.name);
  var _format = allocString(format || guessFormat(file.name));

  var _taglib = _taglib_js_open(_format, _filename, _file);
  _free(_format);
  _free(_filename);

  _taglib_js_get_metadata(_taglib, _file);
  _taglib_js_get_audio_properties(_taglib, _file);

  var data = getTaglibFile(_file);

  removeTaglibFile(_file);
  _taglib_js_close(_taglib);

  var ret = {};
  if (data.metadata) {
    ret.metadata = data.metadata;
  }
  if (data.audio) {
    ret.audio = data.audio;
  }

  return ret;
};

function asyncTaglibRead(file, format, path, cb) {
  var script = "var window;\
                self.onmessage = function (e) {\
                  var data = e.data;\
                  importScripts(data.path);\
                  postMessage(readFile(data.file, data.format));\
                };";
  var blob = new Blob([script], {type: "text/javascript"});

  var worker = new Worker(URL.createObjectURL(blob));
  worker.onmessage = function (e) {
    cb(e.data);
    worker.terminate();
  };

  worker.postMessage({
    file: file,
    format: format,
    path: path
  });
}

function syncTaglibRead(file, format, cb) {
  var reader = new FileReader;
  reader.onload = function (e) {
    cb(readFile(file, format, e.target.result));
  };
  reader.readAsArrayBuffer(file);
}

if (typeof window != "undefined") {
  window.File.prototype.readTaglibMetadata = function (args, cb) {
    if (!cb) {
      cb = args;
    }
    args = args || {};
    var path = args.path;
    var format = args.format;

    if (args.worker) {
      return asyncTaglibRead(this, format, path, cb); 
    } else {
      return syncTaglibRead(this, format, cb);
    }
  };
}

}).call(context)})();
