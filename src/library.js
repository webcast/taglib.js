mergeInto(LibraryManager.library, {
  taglib_js_length: function (fileref) {
    return getTaglibFile(fileref).length;
  },
  taglib_js_tell: function (fileref) {
    return getTaglibFile(fileref).position;
  },
  taglib_js_seek: function (fileref, position) {
    getTaglibFile(fileref).position = position;
  },
  taglib_js_read: function (fileref, len, ptr) {
    var data = getTaglibFile(fileref);
    var position = data.position;

    if (data.position >= data.length) {
      return 0;
    }

    var result;
    if (!data.content) {
      result = (new FileReaderSync).readAsArrayBuffer(
        data.file.slice(position, position+len)
      );
    } else {
      result = data.content.slice(position, position+len);
    }

    data.position += result.byteLength;
    Module.HEAPU8.subarray(ptr, ptr+result.byteLength).set(new Uint8Array(result));

    return result.byteLength;
  },
  taglib_js_add_metadata: function (fileref, key, value) {
    if (!value) {
      return;
    }

    var data = getTaglibFile(fileref);
    data.metadata = data.metadata || {};
    key = Pointer_stringify(key);
    value = Pointer_stringify(value);
    data.metadata[key.toLowerCase()] = value;
  },
  taglib_js_add_audio_property: function (fileref, key, value) {
    if (!value) {
      return;
    }

    var data = getTaglibFile(fileref);
    data.audio = data.audio || {};
    key = Pointer_stringify(key);
    data.audio[key] = value;
  }
});
