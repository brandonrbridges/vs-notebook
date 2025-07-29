"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));
var path3 = __toESM(require("path"));
var fs3 = __toESM(require("fs"));

// src/notes-provider.ts
var vscode = __toESM(require("vscode"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));

// node_modules/chokidar/esm/index.js
var import_fs2 = require("fs");
var import_promises3 = require("fs/promises");
var import_events = require("events");
var sysPath2 = __toESM(require("path"), 1);

// node_modules/readdirp/esm/index.js
var import_promises = require("node:fs/promises");
var import_node_stream = require("node:stream");
var import_node_path = require("node:path");
var EntryTypes = {
  FILE_TYPE: "files",
  DIR_TYPE: "directories",
  FILE_DIR_TYPE: "files_directories",
  EVERYTHING_TYPE: "all"
};
var defaultOptions = {
  root: ".",
  fileFilter: (_entryInfo) => true,
  directoryFilter: (_entryInfo) => true,
  type: EntryTypes.FILE_TYPE,
  lstat: false,
  depth: 2147483648,
  alwaysStat: false,
  highWaterMark: 4096
};
Object.freeze(defaultOptions);
var RECURSIVE_ERROR_CODE = "READDIRP_RECURSIVE_ERROR";
var NORMAL_FLOW_ERRORS = /* @__PURE__ */ new Set(["ENOENT", "EPERM", "EACCES", "ELOOP", RECURSIVE_ERROR_CODE]);
var ALL_TYPES = [
  EntryTypes.DIR_TYPE,
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE,
  EntryTypes.FILE_TYPE
];
var DIR_TYPES = /* @__PURE__ */ new Set([
  EntryTypes.DIR_TYPE,
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE
]);
var FILE_TYPES = /* @__PURE__ */ new Set([
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE,
  EntryTypes.FILE_TYPE
]);
var isNormalFlowError = (error) => NORMAL_FLOW_ERRORS.has(error.code);
var wantBigintFsStats = process.platform === "win32";
var emptyFn = (_entryInfo) => true;
var normalizeFilter = (filter) => {
  if (filter === void 0)
    return emptyFn;
  if (typeof filter === "function")
    return filter;
  if (typeof filter === "string") {
    const fl = filter.trim();
    return (entry) => entry.basename === fl;
  }
  if (Array.isArray(filter)) {
    const trItems = filter.map((item) => item.trim());
    return (entry) => trItems.some((f) => entry.basename === f);
  }
  return emptyFn;
};
var ReaddirpStream = class extends import_node_stream.Readable {
  constructor(options = {}) {
    super({
      objectMode: true,
      autoDestroy: true,
      highWaterMark: options.highWaterMark
    });
    const opts = { ...defaultOptions, ...options };
    const { root, type } = opts;
    this._fileFilter = normalizeFilter(opts.fileFilter);
    this._directoryFilter = normalizeFilter(opts.directoryFilter);
    const statMethod = opts.lstat ? import_promises.lstat : import_promises.stat;
    if (wantBigintFsStats) {
      this._stat = (path4) => statMethod(path4, { bigint: true });
    } else {
      this._stat = statMethod;
    }
    this._maxDepth = opts.depth ?? defaultOptions.depth;
    this._wantsDir = type ? DIR_TYPES.has(type) : false;
    this._wantsFile = type ? FILE_TYPES.has(type) : false;
    this._wantsEverything = type === EntryTypes.EVERYTHING_TYPE;
    this._root = (0, import_node_path.resolve)(root);
    this._isDirent = !opts.alwaysStat;
    this._statsProp = this._isDirent ? "dirent" : "stats";
    this._rdOptions = { encoding: "utf8", withFileTypes: this._isDirent };
    this.parents = [this._exploreDir(root, 1)];
    this.reading = false;
    this.parent = void 0;
  }
  async _read(batch) {
    if (this.reading)
      return;
    this.reading = true;
    try {
      while (!this.destroyed && batch > 0) {
        const par = this.parent;
        const fil = par && par.files;
        if (fil && fil.length > 0) {
          const { path: path4, depth } = par;
          const slice = fil.splice(0, batch).map((dirent) => this._formatEntry(dirent, path4));
          const awaited = await Promise.all(slice);
          for (const entry of awaited) {
            if (!entry)
              continue;
            if (this.destroyed)
              return;
            const entryType = await this._getEntryType(entry);
            if (entryType === "directory" && this._directoryFilter(entry)) {
              if (depth <= this._maxDepth) {
                this.parents.push(this._exploreDir(entry.fullPath, depth + 1));
              }
              if (this._wantsDir) {
                this.push(entry);
                batch--;
              }
            } else if ((entryType === "file" || this._includeAsFile(entry)) && this._fileFilter(entry)) {
              if (this._wantsFile) {
                this.push(entry);
                batch--;
              }
            }
          }
        } else {
          const parent = this.parents.pop();
          if (!parent) {
            this.push(null);
            break;
          }
          this.parent = await parent;
          if (this.destroyed)
            return;
        }
      }
    } catch (error) {
      this.destroy(error);
    } finally {
      this.reading = false;
    }
  }
  async _exploreDir(path4, depth) {
    let files;
    try {
      files = await (0, import_promises.readdir)(path4, this._rdOptions);
    } catch (error) {
      this._onError(error);
    }
    return { files, depth, path: path4 };
  }
  async _formatEntry(dirent, path4) {
    let entry;
    const basename5 = this._isDirent ? dirent.name : dirent;
    try {
      const fullPath = (0, import_node_path.resolve)((0, import_node_path.join)(path4, basename5));
      entry = { path: (0, import_node_path.relative)(this._root, fullPath), fullPath, basename: basename5 };
      entry[this._statsProp] = this._isDirent ? dirent : await this._stat(fullPath);
    } catch (err) {
      this._onError(err);
      return;
    }
    return entry;
  }
  _onError(err) {
    if (isNormalFlowError(err) && !this.destroyed) {
      this.emit("warn", err);
    } else {
      this.destroy(err);
    }
  }
  async _getEntryType(entry) {
    if (!entry && this._statsProp in entry) {
      return "";
    }
    const stats = entry[this._statsProp];
    if (stats.isFile())
      return "file";
    if (stats.isDirectory())
      return "directory";
    if (stats && stats.isSymbolicLink()) {
      const full = entry.fullPath;
      try {
        const entryRealPath = await (0, import_promises.realpath)(full);
        const entryRealPathStats = await (0, import_promises.lstat)(entryRealPath);
        if (entryRealPathStats.isFile()) {
          return "file";
        }
        if (entryRealPathStats.isDirectory()) {
          const len = entryRealPath.length;
          if (full.startsWith(entryRealPath) && full.substr(len, 1) === import_node_path.sep) {
            const recursiveError = new Error(`Circular symlink detected: "${full}" points to "${entryRealPath}"`);
            recursiveError.code = RECURSIVE_ERROR_CODE;
            return this._onError(recursiveError);
          }
          return "directory";
        }
      } catch (error) {
        this._onError(error);
        return "";
      }
    }
  }
  _includeAsFile(entry) {
    const stats = entry && entry[this._statsProp];
    return stats && this._wantsEverything && !stats.isDirectory();
  }
};
function readdirp(root, options = {}) {
  let type = options.entryType || options.type;
  if (type === "both")
    type = EntryTypes.FILE_DIR_TYPE;
  if (type)
    options.type = type;
  if (!root) {
    throw new Error("readdirp: root argument is required. Usage: readdirp(root, options)");
  } else if (typeof root !== "string") {
    throw new TypeError("readdirp: root argument must be a string. Usage: readdirp(root, options)");
  } else if (type && !ALL_TYPES.includes(type)) {
    throw new Error(`readdirp: Invalid type passed. Use one of ${ALL_TYPES.join(", ")}`);
  }
  options.root = root;
  return new ReaddirpStream(options);
}

// node_modules/chokidar/esm/handler.js
var import_fs = require("fs");
var import_promises2 = require("fs/promises");
var sysPath = __toESM(require("path"), 1);
var import_os = require("os");
var STR_DATA = "data";
var STR_END = "end";
var STR_CLOSE = "close";
var EMPTY_FN = () => {
};
var pl = process.platform;
var isWindows = pl === "win32";
var isMacos = pl === "darwin";
var isLinux = pl === "linux";
var isFreeBSD = pl === "freebsd";
var isIBMi = (0, import_os.type)() === "OS400";
var EVENTS = {
  ALL: "all",
  READY: "ready",
  ADD: "add",
  CHANGE: "change",
  ADD_DIR: "addDir",
  UNLINK: "unlink",
  UNLINK_DIR: "unlinkDir",
  RAW: "raw",
  ERROR: "error"
};
var EV = EVENTS;
var THROTTLE_MODE_WATCH = "watch";
var statMethods = { lstat: import_promises2.lstat, stat: import_promises2.stat };
var KEY_LISTENERS = "listeners";
var KEY_ERR = "errHandlers";
var KEY_RAW = "rawEmitters";
var HANDLER_KEYS = [KEY_LISTENERS, KEY_ERR, KEY_RAW];
var binaryExtensions = /* @__PURE__ */ new Set([
  "3dm",
  "3ds",
  "3g2",
  "3gp",
  "7z",
  "a",
  "aac",
  "adp",
  "afdesign",
  "afphoto",
  "afpub",
  "ai",
  "aif",
  "aiff",
  "alz",
  "ape",
  "apk",
  "appimage",
  "ar",
  "arj",
  "asf",
  "au",
  "avi",
  "bak",
  "baml",
  "bh",
  "bin",
  "bk",
  "bmp",
  "btif",
  "bz2",
  "bzip2",
  "cab",
  "caf",
  "cgm",
  "class",
  "cmx",
  "cpio",
  "cr2",
  "cur",
  "dat",
  "dcm",
  "deb",
  "dex",
  "djvu",
  "dll",
  "dmg",
  "dng",
  "doc",
  "docm",
  "docx",
  "dot",
  "dotm",
  "dra",
  "DS_Store",
  "dsk",
  "dts",
  "dtshd",
  "dvb",
  "dwg",
  "dxf",
  "ecelp4800",
  "ecelp7470",
  "ecelp9600",
  "egg",
  "eol",
  "eot",
  "epub",
  "exe",
  "f4v",
  "fbs",
  "fh",
  "fla",
  "flac",
  "flatpak",
  "fli",
  "flv",
  "fpx",
  "fst",
  "fvt",
  "g3",
  "gh",
  "gif",
  "graffle",
  "gz",
  "gzip",
  "h261",
  "h263",
  "h264",
  "icns",
  "ico",
  "ief",
  "img",
  "ipa",
  "iso",
  "jar",
  "jpeg",
  "jpg",
  "jpgv",
  "jpm",
  "jxr",
  "key",
  "ktx",
  "lha",
  "lib",
  "lvp",
  "lz",
  "lzh",
  "lzma",
  "lzo",
  "m3u",
  "m4a",
  "m4v",
  "mar",
  "mdi",
  "mht",
  "mid",
  "midi",
  "mj2",
  "mka",
  "mkv",
  "mmr",
  "mng",
  "mobi",
  "mov",
  "movie",
  "mp3",
  "mp4",
  "mp4a",
  "mpeg",
  "mpg",
  "mpga",
  "mxu",
  "nef",
  "npx",
  "numbers",
  "nupkg",
  "o",
  "odp",
  "ods",
  "odt",
  "oga",
  "ogg",
  "ogv",
  "otf",
  "ott",
  "pages",
  "pbm",
  "pcx",
  "pdb",
  "pdf",
  "pea",
  "pgm",
  "pic",
  "png",
  "pnm",
  "pot",
  "potm",
  "potx",
  "ppa",
  "ppam",
  "ppm",
  "pps",
  "ppsm",
  "ppsx",
  "ppt",
  "pptm",
  "pptx",
  "psd",
  "pya",
  "pyc",
  "pyo",
  "pyv",
  "qt",
  "rar",
  "ras",
  "raw",
  "resources",
  "rgb",
  "rip",
  "rlc",
  "rmf",
  "rmvb",
  "rpm",
  "rtf",
  "rz",
  "s3m",
  "s7z",
  "scpt",
  "sgi",
  "shar",
  "snap",
  "sil",
  "sketch",
  "slk",
  "smv",
  "snk",
  "so",
  "stl",
  "suo",
  "sub",
  "swf",
  "tar",
  "tbz",
  "tbz2",
  "tga",
  "tgz",
  "thmx",
  "tif",
  "tiff",
  "tlz",
  "ttc",
  "ttf",
  "txz",
  "udf",
  "uvh",
  "uvi",
  "uvm",
  "uvp",
  "uvs",
  "uvu",
  "viv",
  "vob",
  "war",
  "wav",
  "wax",
  "wbmp",
  "wdp",
  "weba",
  "webm",
  "webp",
  "whl",
  "wim",
  "wm",
  "wma",
  "wmv",
  "wmx",
  "woff",
  "woff2",
  "wrm",
  "wvx",
  "xbm",
  "xif",
  "xla",
  "xlam",
  "xls",
  "xlsb",
  "xlsm",
  "xlsx",
  "xlt",
  "xltm",
  "xltx",
  "xm",
  "xmind",
  "xpi",
  "xpm",
  "xwd",
  "xz",
  "z",
  "zip",
  "zipx"
]);
var isBinaryPath = (filePath) => binaryExtensions.has(sysPath.extname(filePath).slice(1).toLowerCase());
var foreach = (val, fn) => {
  if (val instanceof Set) {
    val.forEach(fn);
  } else {
    fn(val);
  }
};
var addAndConvert = (main, prop, item) => {
  let container = main[prop];
  if (!(container instanceof Set)) {
    main[prop] = container = /* @__PURE__ */ new Set([container]);
  }
  container.add(item);
};
var clearItem = (cont) => (key) => {
  const set = cont[key];
  if (set instanceof Set) {
    set.clear();
  } else {
    delete cont[key];
  }
};
var delFromSet = (main, prop, item) => {
  const container = main[prop];
  if (container instanceof Set) {
    container.delete(item);
  } else if (container === item) {
    delete main[prop];
  }
};
var isEmptySet = (val) => val instanceof Set ? val.size === 0 : !val;
var FsWatchInstances = /* @__PURE__ */ new Map();
function createFsWatchInstance(path4, options, listener, errHandler, emitRaw) {
  const handleEvent = (rawEvent, evPath) => {
    listener(path4);
    emitRaw(rawEvent, evPath, { watchedPath: path4 });
    if (evPath && path4 !== evPath) {
      fsWatchBroadcast(sysPath.resolve(path4, evPath), KEY_LISTENERS, sysPath.join(path4, evPath));
    }
  };
  try {
    return (0, import_fs.watch)(path4, {
      persistent: options.persistent
    }, handleEvent);
  } catch (error) {
    errHandler(error);
    return void 0;
  }
}
var fsWatchBroadcast = (fullPath, listenerType, val1, val2, val3) => {
  const cont = FsWatchInstances.get(fullPath);
  if (!cont)
    return;
  foreach(cont[listenerType], (listener) => {
    listener(val1, val2, val3);
  });
};
var setFsWatchListener = (path4, fullPath, options, handlers) => {
  const { listener, errHandler, rawEmitter } = handlers;
  let cont = FsWatchInstances.get(fullPath);
  let watcher;
  if (!options.persistent) {
    watcher = createFsWatchInstance(path4, options, listener, errHandler, rawEmitter);
    if (!watcher)
      return;
    return watcher.close.bind(watcher);
  }
  if (cont) {
    addAndConvert(cont, KEY_LISTENERS, listener);
    addAndConvert(cont, KEY_ERR, errHandler);
    addAndConvert(cont, KEY_RAW, rawEmitter);
  } else {
    watcher = createFsWatchInstance(
      path4,
      options,
      fsWatchBroadcast.bind(null, fullPath, KEY_LISTENERS),
      errHandler,
      // no need to use broadcast here
      fsWatchBroadcast.bind(null, fullPath, KEY_RAW)
    );
    if (!watcher)
      return;
    watcher.on(EV.ERROR, async (error) => {
      const broadcastErr = fsWatchBroadcast.bind(null, fullPath, KEY_ERR);
      if (cont)
        cont.watcherUnusable = true;
      if (isWindows && error.code === "EPERM") {
        try {
          const fd = await (0, import_promises2.open)(path4, "r");
          await fd.close();
          broadcastErr(error);
        } catch (err) {
        }
      } else {
        broadcastErr(error);
      }
    });
    cont = {
      listeners: listener,
      errHandlers: errHandler,
      rawEmitters: rawEmitter,
      watcher
    };
    FsWatchInstances.set(fullPath, cont);
  }
  return () => {
    delFromSet(cont, KEY_LISTENERS, listener);
    delFromSet(cont, KEY_ERR, errHandler);
    delFromSet(cont, KEY_RAW, rawEmitter);
    if (isEmptySet(cont.listeners)) {
      cont.watcher.close();
      FsWatchInstances.delete(fullPath);
      HANDLER_KEYS.forEach(clearItem(cont));
      cont.watcher = void 0;
      Object.freeze(cont);
    }
  };
};
var FsWatchFileInstances = /* @__PURE__ */ new Map();
var setFsWatchFileListener = (path4, fullPath, options, handlers) => {
  const { listener, rawEmitter } = handlers;
  let cont = FsWatchFileInstances.get(fullPath);
  const copts = cont && cont.options;
  if (copts && (copts.persistent < options.persistent || copts.interval > options.interval)) {
    (0, import_fs.unwatchFile)(fullPath);
    cont = void 0;
  }
  if (cont) {
    addAndConvert(cont, KEY_LISTENERS, listener);
    addAndConvert(cont, KEY_RAW, rawEmitter);
  } else {
    cont = {
      listeners: listener,
      rawEmitters: rawEmitter,
      options,
      watcher: (0, import_fs.watchFile)(fullPath, options, (curr, prev) => {
        foreach(cont.rawEmitters, (rawEmitter2) => {
          rawEmitter2(EV.CHANGE, fullPath, { curr, prev });
        });
        const currmtime = curr.mtimeMs;
        if (curr.size !== prev.size || currmtime > prev.mtimeMs || currmtime === 0) {
          foreach(cont.listeners, (listener2) => listener2(path4, curr));
        }
      })
    };
    FsWatchFileInstances.set(fullPath, cont);
  }
  return () => {
    delFromSet(cont, KEY_LISTENERS, listener);
    delFromSet(cont, KEY_RAW, rawEmitter);
    if (isEmptySet(cont.listeners)) {
      FsWatchFileInstances.delete(fullPath);
      (0, import_fs.unwatchFile)(fullPath);
      cont.options = cont.watcher = void 0;
      Object.freeze(cont);
    }
  };
};
var NodeFsHandler = class {
  constructor(fsW) {
    this.fsw = fsW;
    this._boundHandleError = (error) => fsW._handleError(error);
  }
  /**
   * Watch file for changes with fs_watchFile or fs_watch.
   * @param path to file or dir
   * @param listener on fs change
   * @returns closer for the watcher instance
   */
  _watchWithNodeFs(path4, listener) {
    const opts = this.fsw.options;
    const directory = sysPath.dirname(path4);
    const basename5 = sysPath.basename(path4);
    const parent = this.fsw._getWatchedDir(directory);
    parent.add(basename5);
    const absolutePath = sysPath.resolve(path4);
    const options = {
      persistent: opts.persistent
    };
    if (!listener)
      listener = EMPTY_FN;
    let closer;
    if (opts.usePolling) {
      const enableBin = opts.interval !== opts.binaryInterval;
      options.interval = enableBin && isBinaryPath(basename5) ? opts.binaryInterval : opts.interval;
      closer = setFsWatchFileListener(path4, absolutePath, options, {
        listener,
        rawEmitter: this.fsw._emitRaw
      });
    } else {
      closer = setFsWatchListener(path4, absolutePath, options, {
        listener,
        errHandler: this._boundHandleError,
        rawEmitter: this.fsw._emitRaw
      });
    }
    return closer;
  }
  /**
   * Watch a file and emit add event if warranted.
   * @returns closer for the watcher instance
   */
  _handleFile(file, stats, initialAdd) {
    if (this.fsw.closed) {
      return;
    }
    const dirname4 = sysPath.dirname(file);
    const basename5 = sysPath.basename(file);
    const parent = this.fsw._getWatchedDir(dirname4);
    let prevStats = stats;
    if (parent.has(basename5))
      return;
    const listener = async (path4, newStats) => {
      if (!this.fsw._throttle(THROTTLE_MODE_WATCH, file, 5))
        return;
      if (!newStats || newStats.mtimeMs === 0) {
        try {
          const newStats2 = await (0, import_promises2.stat)(file);
          if (this.fsw.closed)
            return;
          const at = newStats2.atimeMs;
          const mt = newStats2.mtimeMs;
          if (!at || at <= mt || mt !== prevStats.mtimeMs) {
            this.fsw._emit(EV.CHANGE, file, newStats2);
          }
          if ((isMacos || isLinux || isFreeBSD) && prevStats.ino !== newStats2.ino) {
            this.fsw._closeFile(path4);
            prevStats = newStats2;
            const closer2 = this._watchWithNodeFs(file, listener);
            if (closer2)
              this.fsw._addPathCloser(path4, closer2);
          } else {
            prevStats = newStats2;
          }
        } catch (error) {
          this.fsw._remove(dirname4, basename5);
        }
      } else if (parent.has(basename5)) {
        const at = newStats.atimeMs;
        const mt = newStats.mtimeMs;
        if (!at || at <= mt || mt !== prevStats.mtimeMs) {
          this.fsw._emit(EV.CHANGE, file, newStats);
        }
        prevStats = newStats;
      }
    };
    const closer = this._watchWithNodeFs(file, listener);
    if (!(initialAdd && this.fsw.options.ignoreInitial) && this.fsw._isntIgnored(file)) {
      if (!this.fsw._throttle(EV.ADD, file, 0))
        return;
      this.fsw._emit(EV.ADD, file, stats);
    }
    return closer;
  }
  /**
   * Handle symlinks encountered while reading a dir.
   * @param entry returned by readdirp
   * @param directory path of dir being read
   * @param path of this item
   * @param item basename of this item
   * @returns true if no more processing is needed for this entry.
   */
  async _handleSymlink(entry, directory, path4, item) {
    if (this.fsw.closed) {
      return;
    }
    const full = entry.fullPath;
    const dir = this.fsw._getWatchedDir(directory);
    if (!this.fsw.options.followSymlinks) {
      this.fsw._incrReadyCount();
      let linkPath;
      try {
        linkPath = await (0, import_promises2.realpath)(path4);
      } catch (e) {
        this.fsw._emitReady();
        return true;
      }
      if (this.fsw.closed)
        return;
      if (dir.has(item)) {
        if (this.fsw._symlinkPaths.get(full) !== linkPath) {
          this.fsw._symlinkPaths.set(full, linkPath);
          this.fsw._emit(EV.CHANGE, path4, entry.stats);
        }
      } else {
        dir.add(item);
        this.fsw._symlinkPaths.set(full, linkPath);
        this.fsw._emit(EV.ADD, path4, entry.stats);
      }
      this.fsw._emitReady();
      return true;
    }
    if (this.fsw._symlinkPaths.has(full)) {
      return true;
    }
    this.fsw._symlinkPaths.set(full, true);
  }
  _handleRead(directory, initialAdd, wh, target, dir, depth, throttler) {
    directory = sysPath.join(directory, "");
    throttler = this.fsw._throttle("readdir", directory, 1e3);
    if (!throttler)
      return;
    const previous = this.fsw._getWatchedDir(wh.path);
    const current = /* @__PURE__ */ new Set();
    let stream = this.fsw._readdirp(directory, {
      fileFilter: (entry) => wh.filterPath(entry),
      directoryFilter: (entry) => wh.filterDir(entry)
    });
    if (!stream)
      return;
    stream.on(STR_DATA, async (entry) => {
      if (this.fsw.closed) {
        stream = void 0;
        return;
      }
      const item = entry.path;
      let path4 = sysPath.join(directory, item);
      current.add(item);
      if (entry.stats.isSymbolicLink() && await this._handleSymlink(entry, directory, path4, item)) {
        return;
      }
      if (this.fsw.closed) {
        stream = void 0;
        return;
      }
      if (item === target || !target && !previous.has(item)) {
        this.fsw._incrReadyCount();
        path4 = sysPath.join(dir, sysPath.relative(dir, path4));
        this._addToNodeFs(path4, initialAdd, wh, depth + 1);
      }
    }).on(EV.ERROR, this._boundHandleError);
    return new Promise((resolve5, reject) => {
      if (!stream)
        return reject();
      stream.once(STR_END, () => {
        if (this.fsw.closed) {
          stream = void 0;
          return;
        }
        const wasThrottled = throttler ? throttler.clear() : false;
        resolve5(void 0);
        previous.getChildren().filter((item) => {
          return item !== directory && !current.has(item);
        }).forEach((item) => {
          this.fsw._remove(directory, item);
        });
        stream = void 0;
        if (wasThrottled)
          this._handleRead(directory, false, wh, target, dir, depth, throttler);
      });
    });
  }
  /**
   * Read directory to add / remove files from `@watched` list and re-read it on change.
   * @param dir fs path
   * @param stats
   * @param initialAdd
   * @param depth relative to user-supplied path
   * @param target child path targeted for watch
   * @param wh Common watch helpers for this path
   * @param realpath
   * @returns closer for the watcher instance.
   */
  async _handleDir(dir, stats, initialAdd, depth, target, wh, realpath2) {
    const parentDir = this.fsw._getWatchedDir(sysPath.dirname(dir));
    const tracked = parentDir.has(sysPath.basename(dir));
    if (!(initialAdd && this.fsw.options.ignoreInitial) && !target && !tracked) {
      this.fsw._emit(EV.ADD_DIR, dir, stats);
    }
    parentDir.add(sysPath.basename(dir));
    this.fsw._getWatchedDir(dir);
    let throttler;
    let closer;
    const oDepth = this.fsw.options.depth;
    if ((oDepth == null || depth <= oDepth) && !this.fsw._symlinkPaths.has(realpath2)) {
      if (!target) {
        await this._handleRead(dir, initialAdd, wh, target, dir, depth, throttler);
        if (this.fsw.closed)
          return;
      }
      closer = this._watchWithNodeFs(dir, (dirPath, stats2) => {
        if (stats2 && stats2.mtimeMs === 0)
          return;
        this._handleRead(dirPath, false, wh, target, dir, depth, throttler);
      });
    }
    return closer;
  }
  /**
   * Handle added file, directory, or glob pattern.
   * Delegates call to _handleFile / _handleDir after checks.
   * @param path to file or ir
   * @param initialAdd was the file added at watch instantiation?
   * @param priorWh depth relative to user-supplied path
   * @param depth Child path actually targeted for watch
   * @param target Child path actually targeted for watch
   */
  async _addToNodeFs(path4, initialAdd, priorWh, depth, target) {
    const ready = this.fsw._emitReady;
    if (this.fsw._isIgnored(path4) || this.fsw.closed) {
      ready();
      return false;
    }
    const wh = this.fsw._getWatchHelpers(path4);
    if (priorWh) {
      wh.filterPath = (entry) => priorWh.filterPath(entry);
      wh.filterDir = (entry) => priorWh.filterDir(entry);
    }
    try {
      const stats = await statMethods[wh.statMethod](wh.watchPath);
      if (this.fsw.closed)
        return;
      if (this.fsw._isIgnored(wh.watchPath, stats)) {
        ready();
        return false;
      }
      const follow = this.fsw.options.followSymlinks;
      let closer;
      if (stats.isDirectory()) {
        const absPath = sysPath.resolve(path4);
        const targetPath = follow ? await (0, import_promises2.realpath)(path4) : path4;
        if (this.fsw.closed)
          return;
        closer = await this._handleDir(wh.watchPath, stats, initialAdd, depth, target, wh, targetPath);
        if (this.fsw.closed)
          return;
        if (absPath !== targetPath && targetPath !== void 0) {
          this.fsw._symlinkPaths.set(absPath, targetPath);
        }
      } else if (stats.isSymbolicLink()) {
        const targetPath = follow ? await (0, import_promises2.realpath)(path4) : path4;
        if (this.fsw.closed)
          return;
        const parent = sysPath.dirname(wh.watchPath);
        this.fsw._getWatchedDir(parent).add(wh.watchPath);
        this.fsw._emit(EV.ADD, wh.watchPath, stats);
        closer = await this._handleDir(parent, stats, initialAdd, depth, path4, wh, targetPath);
        if (this.fsw.closed)
          return;
        if (targetPath !== void 0) {
          this.fsw._symlinkPaths.set(sysPath.resolve(path4), targetPath);
        }
      } else {
        closer = this._handleFile(wh.watchPath, stats, initialAdd);
      }
      ready();
      if (closer)
        this.fsw._addPathCloser(path4, closer);
      return false;
    } catch (error) {
      if (this.fsw._handleError(error)) {
        ready();
        return path4;
      }
    }
  }
};

// node_modules/chokidar/esm/index.js
var SLASH = "/";
var SLASH_SLASH = "//";
var ONE_DOT = ".";
var TWO_DOTS = "..";
var STRING_TYPE = "string";
var BACK_SLASH_RE = /\\/g;
var DOUBLE_SLASH_RE = /\/\//;
var DOT_RE = /\..*\.(sw[px])$|~$|\.subl.*\.tmp/;
var REPLACER_RE = /^\.[/\\]/;
function arrify(item) {
  return Array.isArray(item) ? item : [item];
}
var isMatcherObject = (matcher) => typeof matcher === "object" && matcher !== null && !(matcher instanceof RegExp);
function createPattern(matcher) {
  if (typeof matcher === "function")
    return matcher;
  if (typeof matcher === "string")
    return (string) => matcher === string;
  if (matcher instanceof RegExp)
    return (string) => matcher.test(string);
  if (typeof matcher === "object" && matcher !== null) {
    return (string) => {
      if (matcher.path === string)
        return true;
      if (matcher.recursive) {
        const relative3 = sysPath2.relative(matcher.path, string);
        if (!relative3) {
          return false;
        }
        return !relative3.startsWith("..") && !sysPath2.isAbsolute(relative3);
      }
      return false;
    };
  }
  return () => false;
}
function normalizePath(path4) {
  if (typeof path4 !== "string")
    throw new Error("string expected");
  path4 = sysPath2.normalize(path4);
  path4 = path4.replace(/\\/g, "/");
  let prepend = false;
  if (path4.startsWith("//"))
    prepend = true;
  const DOUBLE_SLASH_RE2 = /\/\//;
  while (path4.match(DOUBLE_SLASH_RE2))
    path4 = path4.replace(DOUBLE_SLASH_RE2, "/");
  if (prepend)
    path4 = "/" + path4;
  return path4;
}
function matchPatterns(patterns, testString, stats) {
  const path4 = normalizePath(testString);
  for (let index = 0; index < patterns.length; index++) {
    const pattern = patterns[index];
    if (pattern(path4, stats)) {
      return true;
    }
  }
  return false;
}
function anymatch(matchers, testString) {
  if (matchers == null) {
    throw new TypeError("anymatch: specify first argument");
  }
  const matchersArray = arrify(matchers);
  const patterns = matchersArray.map((matcher) => createPattern(matcher));
  if (testString == null) {
    return (testString2, stats) => {
      return matchPatterns(patterns, testString2, stats);
    };
  }
  return matchPatterns(patterns, testString);
}
var unifyPaths = (paths_) => {
  const paths = arrify(paths_).flat();
  if (!paths.every((p) => typeof p === STRING_TYPE)) {
    throw new TypeError(`Non-string provided as watch path: ${paths}`);
  }
  return paths.map(normalizePathToUnix);
};
var toUnix = (string) => {
  let str = string.replace(BACK_SLASH_RE, SLASH);
  let prepend = false;
  if (str.startsWith(SLASH_SLASH)) {
    prepend = true;
  }
  while (str.match(DOUBLE_SLASH_RE)) {
    str = str.replace(DOUBLE_SLASH_RE, SLASH);
  }
  if (prepend) {
    str = SLASH + str;
  }
  return str;
};
var normalizePathToUnix = (path4) => toUnix(sysPath2.normalize(toUnix(path4)));
var normalizeIgnored = (cwd = "") => (path4) => {
  if (typeof path4 === "string") {
    return normalizePathToUnix(sysPath2.isAbsolute(path4) ? path4 : sysPath2.join(cwd, path4));
  } else {
    return path4;
  }
};
var getAbsolutePath = (path4, cwd) => {
  if (sysPath2.isAbsolute(path4)) {
    return path4;
  }
  return sysPath2.join(cwd, path4);
};
var EMPTY_SET = Object.freeze(/* @__PURE__ */ new Set());
var DirEntry = class {
  constructor(dir, removeWatcher) {
    this.path = dir;
    this._removeWatcher = removeWatcher;
    this.items = /* @__PURE__ */ new Set();
  }
  add(item) {
    const { items } = this;
    if (!items)
      return;
    if (item !== ONE_DOT && item !== TWO_DOTS)
      items.add(item);
  }
  async remove(item) {
    const { items } = this;
    if (!items)
      return;
    items.delete(item);
    if (items.size > 0)
      return;
    const dir = this.path;
    try {
      await (0, import_promises3.readdir)(dir);
    } catch (err) {
      if (this._removeWatcher) {
        this._removeWatcher(sysPath2.dirname(dir), sysPath2.basename(dir));
      }
    }
  }
  has(item) {
    const { items } = this;
    if (!items)
      return;
    return items.has(item);
  }
  getChildren() {
    const { items } = this;
    if (!items)
      return [];
    return [...items.values()];
  }
  dispose() {
    this.items.clear();
    this.path = "";
    this._removeWatcher = EMPTY_FN;
    this.items = EMPTY_SET;
    Object.freeze(this);
  }
};
var STAT_METHOD_F = "stat";
var STAT_METHOD_L = "lstat";
var WatchHelper = class {
  constructor(path4, follow, fsw) {
    this.fsw = fsw;
    const watchPath = path4;
    this.path = path4 = path4.replace(REPLACER_RE, "");
    this.watchPath = watchPath;
    this.fullWatchPath = sysPath2.resolve(watchPath);
    this.dirParts = [];
    this.dirParts.forEach((parts) => {
      if (parts.length > 1)
        parts.pop();
    });
    this.followSymlinks = follow;
    this.statMethod = follow ? STAT_METHOD_F : STAT_METHOD_L;
  }
  entryPath(entry) {
    return sysPath2.join(this.watchPath, sysPath2.relative(this.watchPath, entry.fullPath));
  }
  filterPath(entry) {
    const { stats } = entry;
    if (stats && stats.isSymbolicLink())
      return this.filterDir(entry);
    const resolvedPath = this.entryPath(entry);
    return this.fsw._isntIgnored(resolvedPath, stats) && this.fsw._hasReadPermissions(stats);
  }
  filterDir(entry) {
    return this.fsw._isntIgnored(this.entryPath(entry), entry.stats);
  }
};
var FSWatcher = class extends import_events.EventEmitter {
  // Not indenting methods for history sake; for now.
  constructor(_opts = {}) {
    super();
    this.closed = false;
    this._closers = /* @__PURE__ */ new Map();
    this._ignoredPaths = /* @__PURE__ */ new Set();
    this._throttled = /* @__PURE__ */ new Map();
    this._streams = /* @__PURE__ */ new Set();
    this._symlinkPaths = /* @__PURE__ */ new Map();
    this._watched = /* @__PURE__ */ new Map();
    this._pendingWrites = /* @__PURE__ */ new Map();
    this._pendingUnlinks = /* @__PURE__ */ new Map();
    this._readyCount = 0;
    this._readyEmitted = false;
    const awf = _opts.awaitWriteFinish;
    const DEF_AWF = { stabilityThreshold: 2e3, pollInterval: 100 };
    const opts = {
      // Defaults
      persistent: true,
      ignoreInitial: false,
      ignorePermissionErrors: false,
      interval: 100,
      binaryInterval: 300,
      followSymlinks: true,
      usePolling: false,
      // useAsync: false,
      atomic: true,
      // NOTE: overwritten later (depends on usePolling)
      ..._opts,
      // Change format
      ignored: _opts.ignored ? arrify(_opts.ignored) : arrify([]),
      awaitWriteFinish: awf === true ? DEF_AWF : typeof awf === "object" ? { ...DEF_AWF, ...awf } : false
    };
    if (isIBMi)
      opts.usePolling = true;
    if (opts.atomic === void 0)
      opts.atomic = !opts.usePolling;
    const envPoll = process.env.CHOKIDAR_USEPOLLING;
    if (envPoll !== void 0) {
      const envLower = envPoll.toLowerCase();
      if (envLower === "false" || envLower === "0")
        opts.usePolling = false;
      else if (envLower === "true" || envLower === "1")
        opts.usePolling = true;
      else
        opts.usePolling = !!envLower;
    }
    const envInterval = process.env.CHOKIDAR_INTERVAL;
    if (envInterval)
      opts.interval = Number.parseInt(envInterval, 10);
    let readyCalls = 0;
    this._emitReady = () => {
      readyCalls++;
      if (readyCalls >= this._readyCount) {
        this._emitReady = EMPTY_FN;
        this._readyEmitted = true;
        process.nextTick(() => this.emit(EVENTS.READY));
      }
    };
    this._emitRaw = (...args) => this.emit(EVENTS.RAW, ...args);
    this._boundRemove = this._remove.bind(this);
    this.options = opts;
    this._nodeFsHandler = new NodeFsHandler(this);
    Object.freeze(opts);
  }
  _addIgnoredPath(matcher) {
    if (isMatcherObject(matcher)) {
      for (const ignored of this._ignoredPaths) {
        if (isMatcherObject(ignored) && ignored.path === matcher.path && ignored.recursive === matcher.recursive) {
          return;
        }
      }
    }
    this._ignoredPaths.add(matcher);
  }
  _removeIgnoredPath(matcher) {
    this._ignoredPaths.delete(matcher);
    if (typeof matcher === "string") {
      for (const ignored of this._ignoredPaths) {
        if (isMatcherObject(ignored) && ignored.path === matcher) {
          this._ignoredPaths.delete(ignored);
        }
      }
    }
  }
  // Public methods
  /**
   * Adds paths to be watched on an existing FSWatcher instance.
   * @param paths_ file or file list. Other arguments are unused
   */
  add(paths_, _origAdd, _internal) {
    const { cwd } = this.options;
    this.closed = false;
    this._closePromise = void 0;
    let paths = unifyPaths(paths_);
    if (cwd) {
      paths = paths.map((path4) => {
        const absPath = getAbsolutePath(path4, cwd);
        return absPath;
      });
    }
    paths.forEach((path4) => {
      this._removeIgnoredPath(path4);
    });
    this._userIgnored = void 0;
    if (!this._readyCount)
      this._readyCount = 0;
    this._readyCount += paths.length;
    Promise.all(paths.map(async (path4) => {
      const res = await this._nodeFsHandler._addToNodeFs(path4, !_internal, void 0, 0, _origAdd);
      if (res)
        this._emitReady();
      return res;
    })).then((results) => {
      if (this.closed)
        return;
      results.forEach((item) => {
        if (item)
          this.add(sysPath2.dirname(item), sysPath2.basename(_origAdd || item));
      });
    });
    return this;
  }
  /**
   * Close watchers or start ignoring events from specified paths.
   */
  unwatch(paths_) {
    if (this.closed)
      return this;
    const paths = unifyPaths(paths_);
    const { cwd } = this.options;
    paths.forEach((path4) => {
      if (!sysPath2.isAbsolute(path4) && !this._closers.has(path4)) {
        if (cwd)
          path4 = sysPath2.join(cwd, path4);
        path4 = sysPath2.resolve(path4);
      }
      this._closePath(path4);
      this._addIgnoredPath(path4);
      if (this._watched.has(path4)) {
        this._addIgnoredPath({
          path: path4,
          recursive: true
        });
      }
      this._userIgnored = void 0;
    });
    return this;
  }
  /**
   * Close watchers and remove all listeners from watched paths.
   */
  close() {
    if (this._closePromise) {
      return this._closePromise;
    }
    this.closed = true;
    this.removeAllListeners();
    const closers = [];
    this._closers.forEach((closerList) => closerList.forEach((closer) => {
      const promise = closer();
      if (promise instanceof Promise)
        closers.push(promise);
    }));
    this._streams.forEach((stream) => stream.destroy());
    this._userIgnored = void 0;
    this._readyCount = 0;
    this._readyEmitted = false;
    this._watched.forEach((dirent) => dirent.dispose());
    this._closers.clear();
    this._watched.clear();
    this._streams.clear();
    this._symlinkPaths.clear();
    this._throttled.clear();
    this._closePromise = closers.length ? Promise.all(closers).then(() => void 0) : Promise.resolve();
    return this._closePromise;
  }
  /**
   * Expose list of watched paths
   * @returns for chaining
   */
  getWatched() {
    const watchList = {};
    this._watched.forEach((entry, dir) => {
      const key = this.options.cwd ? sysPath2.relative(this.options.cwd, dir) : dir;
      const index = key || ONE_DOT;
      watchList[index] = entry.getChildren().sort();
    });
    return watchList;
  }
  emitWithAll(event, args) {
    this.emit(event, ...args);
    if (event !== EVENTS.ERROR)
      this.emit(EVENTS.ALL, event, ...args);
  }
  // Common helpers
  // --------------
  /**
   * Normalize and emit events.
   * Calling _emit DOES NOT MEAN emit() would be called!
   * @param event Type of event
   * @param path File or directory path
   * @param stats arguments to be passed with event
   * @returns the error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  async _emit(event, path4, stats) {
    if (this.closed)
      return;
    const opts = this.options;
    if (isWindows)
      path4 = sysPath2.normalize(path4);
    if (opts.cwd)
      path4 = sysPath2.relative(opts.cwd, path4);
    const args = [path4];
    if (stats != null)
      args.push(stats);
    const awf = opts.awaitWriteFinish;
    let pw;
    if (awf && (pw = this._pendingWrites.get(path4))) {
      pw.lastChange = /* @__PURE__ */ new Date();
      return this;
    }
    if (opts.atomic) {
      if (event === EVENTS.UNLINK) {
        this._pendingUnlinks.set(path4, [event, ...args]);
        setTimeout(() => {
          this._pendingUnlinks.forEach((entry, path5) => {
            this.emit(...entry);
            this.emit(EVENTS.ALL, ...entry);
            this._pendingUnlinks.delete(path5);
          });
        }, typeof opts.atomic === "number" ? opts.atomic : 100);
        return this;
      }
      if (event === EVENTS.ADD && this._pendingUnlinks.has(path4)) {
        event = EVENTS.CHANGE;
        this._pendingUnlinks.delete(path4);
      }
    }
    if (awf && (event === EVENTS.ADD || event === EVENTS.CHANGE) && this._readyEmitted) {
      const awfEmit = (err, stats2) => {
        if (err) {
          event = EVENTS.ERROR;
          args[0] = err;
          this.emitWithAll(event, args);
        } else if (stats2) {
          if (args.length > 1) {
            args[1] = stats2;
          } else {
            args.push(stats2);
          }
          this.emitWithAll(event, args);
        }
      };
      this._awaitWriteFinish(path4, awf.stabilityThreshold, event, awfEmit);
      return this;
    }
    if (event === EVENTS.CHANGE) {
      const isThrottled = !this._throttle(EVENTS.CHANGE, path4, 50);
      if (isThrottled)
        return this;
    }
    if (opts.alwaysStat && stats === void 0 && (event === EVENTS.ADD || event === EVENTS.ADD_DIR || event === EVENTS.CHANGE)) {
      const fullPath = opts.cwd ? sysPath2.join(opts.cwd, path4) : path4;
      let stats2;
      try {
        stats2 = await (0, import_promises3.stat)(fullPath);
      } catch (err) {
      }
      if (!stats2 || this.closed)
        return;
      args.push(stats2);
    }
    this.emitWithAll(event, args);
    return this;
  }
  /**
   * Common handler for errors
   * @returns The error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  _handleError(error) {
    const code = error && error.code;
    if (error && code !== "ENOENT" && code !== "ENOTDIR" && (!this.options.ignorePermissionErrors || code !== "EPERM" && code !== "EACCES")) {
      this.emit(EVENTS.ERROR, error);
    }
    return error || this.closed;
  }
  /**
   * Helper utility for throttling
   * @param actionType type being throttled
   * @param path being acted upon
   * @param timeout duration of time to suppress duplicate actions
   * @returns tracking object or false if action should be suppressed
   */
  _throttle(actionType, path4, timeout) {
    if (!this._throttled.has(actionType)) {
      this._throttled.set(actionType, /* @__PURE__ */ new Map());
    }
    const action = this._throttled.get(actionType);
    if (!action)
      throw new Error("invalid throttle");
    const actionPath = action.get(path4);
    if (actionPath) {
      actionPath.count++;
      return false;
    }
    let timeoutObject;
    const clear = () => {
      const item = action.get(path4);
      const count = item ? item.count : 0;
      action.delete(path4);
      clearTimeout(timeoutObject);
      if (item)
        clearTimeout(item.timeoutObject);
      return count;
    };
    timeoutObject = setTimeout(clear, timeout);
    const thr = { timeoutObject, clear, count: 0 };
    action.set(path4, thr);
    return thr;
  }
  _incrReadyCount() {
    return this._readyCount++;
  }
  /**
   * Awaits write operation to finish.
   * Polls a newly created file for size variations. When files size does not change for 'threshold' milliseconds calls callback.
   * @param path being acted upon
   * @param threshold Time in milliseconds a file size must be fixed before acknowledging write OP is finished
   * @param event
   * @param awfEmit Callback to be called when ready for event to be emitted.
   */
  _awaitWriteFinish(path4, threshold, event, awfEmit) {
    const awf = this.options.awaitWriteFinish;
    if (typeof awf !== "object")
      return;
    const pollInterval = awf.pollInterval;
    let timeoutHandler;
    let fullPath = path4;
    if (this.options.cwd && !sysPath2.isAbsolute(path4)) {
      fullPath = sysPath2.join(this.options.cwd, path4);
    }
    const now = /* @__PURE__ */ new Date();
    const writes = this._pendingWrites;
    function awaitWriteFinishFn(prevStat) {
      (0, import_fs2.stat)(fullPath, (err, curStat) => {
        if (err || !writes.has(path4)) {
          if (err && err.code !== "ENOENT")
            awfEmit(err);
          return;
        }
        const now2 = Number(/* @__PURE__ */ new Date());
        if (prevStat && curStat.size !== prevStat.size) {
          writes.get(path4).lastChange = now2;
        }
        const pw = writes.get(path4);
        const df = now2 - pw.lastChange;
        if (df >= threshold) {
          writes.delete(path4);
          awfEmit(void 0, curStat);
        } else {
          timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval, curStat);
        }
      });
    }
    if (!writes.has(path4)) {
      writes.set(path4, {
        lastChange: now,
        cancelWait: () => {
          writes.delete(path4);
          clearTimeout(timeoutHandler);
          return event;
        }
      });
      timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval);
    }
  }
  /**
   * Determines whether user has asked to ignore this path.
   */
  _isIgnored(path4, stats) {
    if (this.options.atomic && DOT_RE.test(path4))
      return true;
    if (!this._userIgnored) {
      const { cwd } = this.options;
      const ign = this.options.ignored;
      const ignored = (ign || []).map(normalizeIgnored(cwd));
      const ignoredPaths = [...this._ignoredPaths];
      const list = [...ignoredPaths.map(normalizeIgnored(cwd)), ...ignored];
      this._userIgnored = anymatch(list, void 0);
    }
    return this._userIgnored(path4, stats);
  }
  _isntIgnored(path4, stat4) {
    return !this._isIgnored(path4, stat4);
  }
  /**
   * Provides a set of common helpers and properties relating to symlink handling.
   * @param path file or directory pattern being watched
   */
  _getWatchHelpers(path4) {
    return new WatchHelper(path4, this.options.followSymlinks, this);
  }
  // Directory helpers
  // -----------------
  /**
   * Provides directory tracking objects
   * @param directory path of the directory
   */
  _getWatchedDir(directory) {
    const dir = sysPath2.resolve(directory);
    if (!this._watched.has(dir))
      this._watched.set(dir, new DirEntry(dir, this._boundRemove));
    return this._watched.get(dir);
  }
  // File helpers
  // ------------
  /**
   * Check for read permissions: https://stackoverflow.com/a/11781404/1358405
   */
  _hasReadPermissions(stats) {
    if (this.options.ignorePermissionErrors)
      return true;
    return Boolean(Number(stats.mode) & 256);
  }
  /**
   * Handles emitting unlink events for
   * files and directories, and via recursion, for
   * files and directories within directories that are unlinked
   * @param directory within which the following item is located
   * @param item      base path of item/directory
   */
  _remove(directory, item, isDirectory) {
    const path4 = sysPath2.join(directory, item);
    const fullPath = sysPath2.resolve(path4);
    isDirectory = isDirectory != null ? isDirectory : this._watched.has(path4) || this._watched.has(fullPath);
    if (!this._throttle("remove", path4, 100))
      return;
    if (!isDirectory && this._watched.size === 1) {
      this.add(directory, item, true);
    }
    const wp = this._getWatchedDir(path4);
    const nestedDirectoryChildren = wp.getChildren();
    nestedDirectoryChildren.forEach((nested) => this._remove(path4, nested));
    const parent = this._getWatchedDir(directory);
    const wasTracked = parent.has(item);
    parent.remove(item);
    if (this._symlinkPaths.has(fullPath)) {
      this._symlinkPaths.delete(fullPath);
    }
    let relPath = path4;
    if (this.options.cwd)
      relPath = sysPath2.relative(this.options.cwd, path4);
    if (this.options.awaitWriteFinish && this._pendingWrites.has(relPath)) {
      const event = this._pendingWrites.get(relPath).cancelWait();
      if (event === EVENTS.ADD)
        return;
    }
    this._watched.delete(path4);
    this._watched.delete(fullPath);
    const eventName = isDirectory ? EVENTS.UNLINK_DIR : EVENTS.UNLINK;
    if (wasTracked && !this._isIgnored(path4))
      this._emit(eventName, path4);
    this._closePath(path4);
  }
  /**
   * Closes all watchers for a path
   */
  _closePath(path4) {
    this._closeFile(path4);
    const dir = sysPath2.dirname(path4);
    this._getWatchedDir(dir).remove(sysPath2.basename(path4));
  }
  /**
   * Closes only file-specific watchers
   */
  _closeFile(path4) {
    const closers = this._closers.get(path4);
    if (!closers)
      return;
    closers.forEach((closer) => closer());
    this._closers.delete(path4);
  }
  _addPathCloser(path4, closer) {
    if (!closer)
      return;
    let list = this._closers.get(path4);
    if (!list) {
      list = [];
      this._closers.set(path4, list);
    }
    list.push(closer);
  }
  _readdirp(root, opts) {
    if (this.closed)
      return;
    const options = { type: EVENTS.ALL, alwaysStat: true, lstat: true, ...opts, depth: 0 };
    let stream = readdirp(root, options);
    this._streams.add(stream);
    stream.once(STR_CLOSE, () => {
      stream = void 0;
    });
    stream.once(STR_END, () => {
      if (stream) {
        this._streams.delete(stream);
        stream = void 0;
      }
    });
    return stream;
  }
};
function watch(paths, options = {}) {
  const watcher = new FSWatcher(options);
  watcher.add(paths);
  return watcher;
}

// src/notes-provider.ts
var NotesProvider = class {
  constructor(workspaceRoot, isGlobal) {
    this.workspaceRoot = workspaceRoot;
    this.isGlobal = isGlobal;
  }
  _onDidChangeTreeData = new vscode.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  watcher;
  refreshTimeout;
  pollInterval;
  lastScan = /* @__PURE__ */ new Map();
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  startWatching() {
    if (!this.workspaceRoot) {
      return;
    }
    const notesPath = this.isGlobal ? this.workspaceRoot : path.join(this.workspaceRoot, ".vs-notebook");
    try {
      if (!fs.existsSync(notesPath)) {
        fs.mkdirSync(notesPath, { recursive: true });
      }
      this.watcher = watch(path.join(notesPath, "*.md"), {
        ignored: /^\./,
        persistent: true,
        ignoreInitial: true,
        usePolling: this.isGlobal,
        // Use polling for global notes to catch cross-instance changes
        interval: this.isGlobal ? 1e3 : void 0,
        // Poll every second for global notes
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100
        }
      });
      this.watcher.on("add", () => this.debouncedRefresh()).on("change", () => this.debouncedRefresh()).on("unlink", () => this.debouncedRefresh()).on("error", (error) => {
        console.error(
          `VS Notebook: Error watching ${this.isGlobal ? "global" : "workspace"} notes directory:`,
          error
        );
        setTimeout(() => {
          if (!this.watcher) {
            this.startWatching();
          }
        }, 5e3);
      });
      if (this.isGlobal) {
        this.startPollingFallback(notesPath);
      }
    } catch (error) {
      console.error(
        `VS Notebook: Failed to start ${this.isGlobal ? "global" : "workspace"} file watcher:`,
        error
      );
    }
  }
  debouncedRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.refreshTimeout = setTimeout(() => {
      this.refresh();
    }, 100);
  }
  startPollingFallback(notesPath) {
    this.scanDirectory(notesPath);
    this.pollInterval = setInterval(() => {
      if (this.scanDirectory(notesPath)) {
        this.debouncedRefresh();
      }
    }, 2e3);
  }
  scanDirectory(notesPath) {
    try {
      if (!fs.existsSync(notesPath)) {
        return false;
      }
      const files = fs.readdirSync(notesPath).filter((f) => f.endsWith(".md"));
      let hasChanges = false;
      const currentFiles = new Set(files);
      const lastFiles = new Set(this.lastScan.keys());
      if (currentFiles.size !== lastFiles.size) {
        hasChanges = true;
      } else {
        for (const file of currentFiles) {
          if (!lastFiles.has(file)) {
            hasChanges = true;
            break;
          }
        }
      }
      if (!hasChanges) {
        for (const file of files) {
          const filePath = path.join(notesPath, file);
          const stat4 = fs.statSync(filePath);
          const lastModified = this.lastScan.get(file);
          if (!lastModified || stat4.mtimeMs > lastModified) {
            hasChanges = true;
            this.lastScan.set(file, stat4.mtimeMs);
          }
        }
      } else {
        for (const file of files) {
          const filePath = path.join(notesPath, file);
          const stat4 = fs.statSync(filePath);
          this.lastScan.set(file, stat4.mtimeMs);
        }
      }
      for (const file of lastFiles) {
        if (!currentFiles.has(file)) {
          this.lastScan.delete(file);
        }
      }
      return hasChanges;
    } catch (error) {
      console.error("VS Notebook: Error scanning directory:", error);
      return false;
    }
  }
  dispose() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.watcher) {
      this.watcher.close();
    }
    this.lastScan.clear();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No workspace open");
      return Promise.resolve([]);
    }
    const notesPath = this.isGlobal ? this.workspaceRoot : path.join(this.workspaceRoot, ".vs-notebook");
    if (!fs.existsSync(notesPath)) {
      return Promise.resolve([]);
    }
    if (element && element instanceof GroupItem) {
      return Promise.resolve(element.children);
    }
    const files = fs.readdirSync(notesPath).filter((file) => file.endsWith(".md"));
    const notes = files.map((file) => {
      const fullPath = path.join(notesPath, file);
      return new NoteItem(file, fullPath);
    });
    const config = vscode.workspace.getConfiguration("vs-notebook");
    let groupBy = config.get("groupBy", "none");
    if (this.isGlobal && groupBy === "file") {
      groupBy = "tag";
    }
    if (groupBy === "none") {
      return Promise.resolve(notes);
    }
    const groups = this.groupNotes(notes, groupBy);
    return Promise.resolve(groups);
  }
  async search(query) {
    if (!this.workspaceRoot) {
      return [];
    }
    const notesPath = path.join(this.workspaceRoot, ".vs-notebook");
    if (!fs.existsSync(notesPath)) {
      return [];
    }
    const files = fs.readdirSync(notesPath).filter((f) => f.endsWith(".md"));
    const lowerQuery = query.toLowerCase();
    const matches = [];
    for (const file of files) {
      const fullPath = path.join(notesPath, file);
      const content = fs.readFileSync(fullPath, "utf-8").toLowerCase();
      if (content.includes(lowerQuery)) {
        matches.push(new NoteItem(file, fullPath));
      }
    }
    return matches;
  }
  groupNotes(notes, groupBy) {
    switch (groupBy) {
      case "file":
        return this.groupByFile(notes);
      case "tag":
        return this.groupByTag(notes);
      default:
        return notes;
    }
  }
  groupByFile(notes) {
    const groups = /* @__PURE__ */ new Map();
    for (const note of notes) {
      const metadata = NoteItem.readFrontmatter(note.fullPath);
      const fileName = metadata.file ? path.basename(metadata.file) : "Unknown File";
      if (!groups.has(fileName)) {
        groups.set(fileName, []);
      }
      groups.get(fileName).push(note);
    }
    const groupItems = [];
    for (const [fileName, groupNotes] of groups) {
      groupItems.push(new GroupItem(fileName, groupNotes, "file"));
    }
    return groupItems.sort((a, b) => a.label.localeCompare(b.label));
  }
  groupByTag(notes) {
    const groups = /* @__PURE__ */ new Map();
    for (const note of notes) {
      const metadata = NoteItem.readFrontmatter(note.fullPath);
      let tags = metadata.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
      let firstTag = tags.length > 0 ? tags[0] : "Untagged";
      if (!firstTag) {
        firstTag = "Untagged";
      }
      firstTag = firstTag.charAt(0).toUpperCase() + firstTag.slice(1);
      if (!groups.has(firstTag)) {
        groups.set(firstTag, []);
      }
      groups.get(firstTag).push(note);
    }
    const groupItems = [];
    for (const [tag, groupNotes] of groups) {
      groupItems.push(new GroupItem(tag, groupNotes, "tag"));
    }
    return groupItems.sort((a, b) => a.label.localeCompare(b.label));
  }
};
var GroupItem = class extends vscode.TreeItem {
  constructor(label, children, groupType) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.label = label;
    this.children = children;
    this.groupType = groupType;
    this.tooltip = `${this.children.length} note${this.children.length !== 1 ? "s" : ""}`;
    this.description = `${this.children.length}`;
    if (groupType === "file") {
      this.iconPath = new vscode.ThemeIcon("file");
    } else {
      this.iconPath = new vscode.ThemeIcon("tag");
    }
    this.contextValue = "groupItem";
  }
};
var NoteItem = class _NoteItem extends vscode.TreeItem {
  constructor(label, fullPath) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.label = label;
    this.fullPath = fullPath;
    const metadata = _NoteItem.readFrontmatter(fullPath);
    const tags = metadata.tags?.split(",").map((t) => t.trim()) ?? [];
    if (tags.includes("important")) {
      this.iconPath = new vscode.ThemeIcon(
        "alert",
        new vscode.ThemeColor("charts.red")
      );
    } else if (tags.includes("feature")) {
      this.iconPath = new vscode.ThemeIcon(
        "star",
        new vscode.ThemeColor("charts.green")
      );
    } else if (tags.includes("bug")) {
      this.iconPath = new vscode.ThemeIcon(
        "bug",
        new vscode.ThemeColor("errorForeground")
      );
    } else if (tags.includes("todo")) {
      this.iconPath = new vscode.ThemeIcon(
        "checklist",
        new vscode.ThemeColor("charts.yellow")
      );
    } else if (tags.includes("refactor")) {
      this.iconPath = new vscode.ThemeIcon(
        "tools",
        new vscode.ThemeColor("charts.blue")
      );
    } else {
      this.iconPath = new vscode.ThemeIcon("note");
    }
    this.tooltip = `${label}
${metadata.file ?? ""} : ${metadata.line ?? ""}${metadata.tags ? "\nTags: " + metadata.tags : ""}`;
    this.description = metadata.file ? `${path.basename(metadata.file)} ${metadata.tags ? ` \u2022 ${metadata.tags}` : ""}` : "";
    this.command = {
      command: "vs-notebook.openNote",
      title: "Open Note",
      arguments: [this.fullPath]
    };
    this.resourceUri = vscode.Uri.file(this.fullPath);
    this.contextValue = "noteItem";
  }
  static readFrontmatter(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const match = content.match(/^---\n([\s\S]+?)\n---/);
      if (match) {
        const frontmatter = match[1];
        const lines = frontmatter.split("\n");
        const meta = {};
        for (const line of lines) {
          const [key, ...rest] = line.split(":");
          meta[key.trim()] = rest.join(":").trim();
        }
        return { file: meta["file"], line: meta["line"], tags: meta["tags"] };
      }
    } catch (err) {
      console.error("Failed to read frontmatter:", err);
    }
    return {};
  }
};

// src/lens-provider.ts
var vscode2 = __toESM(require("vscode"));
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var NotesLensProvider = class {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.refreshNotes();
    this.startWatching();
  }
  _onDidChangeCodeLenses = new vscode2.EventEmitter();
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
  notes = {};
  watcher;
  refreshTimeout;
  refreshNotes() {
    this.notes = {};
    const notesDir = path2.join(this.workspaceRoot, ".vs-notebook");
    if (!fs2.existsSync(notesDir)) {
      return;
    }
    const files = fs2.readdirSync(notesDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const fullPath = path2.join(notesDir, file);
      const content = fs2.readFileSync(fullPath, "utf8");
      const match = content.match(/^---\n([\s\S]+?)\n---/);
      if (!match) {
        continue;
      }
      const frontmatter = Object.fromEntries(
        match[1].split("\n").map((line) => {
          const [key, ...rest] = line.split(":");
          return [key.trim(), rest.join(":").trim()];
        })
      );
      if (frontmatter.file && frontmatter.line) {
        const key = path2.resolve(frontmatter.file);
        const lineStr = frontmatter.line;
        let lineStart = null;
        let lineEnd = null;
        if (lineStr.includes("-")) {
          const parts = lineStr.split("-").map((n) => parseInt(n));
          if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
            lineStart = parts[0] - 1;
            lineEnd = parts[1] - 1;
          }
        } else {
          const n = parseInt(lineStr);
          if (!isNaN(n)) {
            lineStart = lineEnd = n - 1;
          }
        }
        if (lineStart !== null && lineEnd !== null) {
          if (!this.notes[key]) {
            this.notes[key] = [];
          }
          this.notes[key].push({ start: lineStart, end: lineEnd });
        }
      }
    }
  }
  refresh() {
    this.refreshNotes();
    this._onDidChangeCodeLenses.fire();
  }
  startWatching() {
    if (!this.workspaceRoot) {
      return;
    }
    const notesPath = path2.join(this.workspaceRoot, ".vs-notebook");
    if (!fs2.existsSync(notesPath)) {
      return;
    }
    try {
      this.watcher = watch(path2.join(notesPath, "*.md"), {
        ignored: /^\./,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100
        }
      });
      this.watcher.on("add", () => this.debouncedRefresh()).on("change", () => this.debouncedRefresh()).on("unlink", () => this.debouncedRefresh()).on("error", (error) => {
        console.error("VS Notebook: Error watching workspace notes for code lens:", error);
        setTimeout(() => {
          if (!this.watcher) {
            this.startWatching();
          }
        }, 5e3);
      });
    } catch (error) {
      console.error("VS Notebook: Failed to start code lens file watcher:", error);
    }
  }
  debouncedRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.refreshTimeout = setTimeout(() => {
      this.refresh();
    }, 100);
  }
  dispose() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    if (this.watcher) {
      this.watcher.close();
    }
  }
  provideCodeLenses(document) {
    const docPath = path2.resolve(document.uri.fsPath);
    const ranges = this.notes[docPath] ?? [];
    const grouped = ranges.reduce((acc, range) => {
      const key = range.start;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(range);
      return acc;
    }, {});
    const lenses = [];
    Object.entries(grouped).forEach(([startLineStr, ranges2]) => {
      const startLine = parseInt(startLineStr);
      const count = ranges2.length;
      const singleLine = ranges2.length === 1 && ranges2[0].start === ranges2[0].end;
      const title = singleLine ? `${count} note${count > 1 ? "s" : ""} for this line` : `${count} note${count > 1 ? "s" : ""} for lines ${ranges2[0].start + 1}-${ranges2[0].end + 1}`;
      lenses.push(
        new vscode2.CodeLens(new vscode2.Range(startLine, 0, startLine, 0), {
          title,
          command: singleLine ? "vs-notebook.openNotesForLine" : "vs-notebook.openNotesForRange",
          arguments: singleLine ? [docPath, startLine + 1] : [docPath, ranges2[0].start + 1, ranges2[0].end + 1]
        })
      );
    });
    return lenses;
  }
};

// src/extension.ts
function activate(context) {
  const rootPath = vscode3.workspace.workspaceFolders?.[0].uri.fsPath ?? "";
  const userHome = require("os").homedir();
  const globalNotesDir = path3.join(userHome, ".vs-notebook-global");
  const notesProvider = new NotesProvider(rootPath, false);
  vscode3.window.registerTreeDataProvider("vs-notebook-notes", notesProvider);
  notesProvider.startWatching();
  const globalNotesProvider = new NotesProvider(globalNotesDir, true);
  vscode3.window.registerTreeDataProvider(
    "vs-notebook-notes-global",
    globalNotesProvider
  );
  globalNotesProvider.startWatching();
  const lensProvider = new NotesLensProvider(rootPath);
  context.subscriptions.push(
    vscode3.languages.registerCodeLensProvider({ scheme: "file" }, lensProvider)
  );
  vscode3.commands.registerCommand("vs-notebook.openSettings", () => {
    vscode3.commands.executeCommand(
      "workbench.action.openSettings",
      "@ext:brandonbridges.vs-notebook"
    );
  });
  context.subscriptions.push(
    vscode3.commands.registerCommand(
      "vs-notebook.openNote",
      (notePath) => {
        vscode3.workspace.openTextDocument(notePath).then((doc) => {
          vscode3.window.showTextDocument(doc);
        });
      }
    ),
    vscode3.commands.registerCommand("vs-notebook.refreshNotes", () => {
      notesProvider.refresh();
      globalNotesProvider.refresh();
      lensProvider.refresh();
    })
  );
  const createNote = vscode3.commands.registerCommand(
    "vs-notebook.createNote",
    async () => {
      const title = await vscode3.window.showInputBox({
        prompt: "Enter note title"
      });
      if (!title) {
        return;
      }
      const description = await vscode3.window.showInputBox({
        prompt: "Enter note description"
      });
      const tags = await vscode3.window.showInputBox({
        prompt: "Enter tags (comma-separated, optional)"
      });
      const editor = vscode3.window.activeTextEditor;
      const filePath = editor?.document.uri.fsPath ?? "Unknown";
      const selection = editor?.selection;
      let contentFormatter = `title: ${title}
file: ${filePath}
`;
      if (selection?.isEmpty) {
        const lineNumber2 = selection.active.line + 1;
        contentFormatter += `line: ${lineNumber2}
`;
      } else if (selection) {
        const lineStart = selection.start.line + 1;
        const lineEnd = selection.end.line + 1;
        contentFormatter += `line: ${lineStart}-${lineEnd}
`;
      }
      contentFormatter += `tags: ${tags || ""}`;
      contentFormatter += `
url: `;
      const lineNumber = editor ? editor.selection.active.line + 1 : "Unknown";
      const workspaceFolders = vscode3.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode3.window.showErrorMessage("No workspace folder found.");
        return;
      }
      const rootPath2 = workspaceFolders[0].uri.fsPath;
      const notesDirectory = path3.join(rootPath2, ".vs-notebook");
      const notePath = path3.join(
        notesDirectory,
        `${title.replace(/\s+/g, "-")}.md`
      );
      if (!fs3.existsSync(notesDirectory)) {
        fs3.mkdirSync(notesDirectory, { recursive: true });
      }
      const content = `---
${contentFormatter}
---

${description || ""}`;
      fs3.writeFileSync(notePath, content);
      vscode3.window.showInformationMessage(`Note "${title}" created.`);
      vscode3.workspace.openTextDocument(notePath).then((doc) => {
        vscode3.window.showTextDocument(doc, {
          viewColumn: vscode3.ViewColumn.Beside,
          preserveFocus: false,
          preview: false
        });
      });
    }
  );
  const createGlobalNote = vscode3.commands.registerCommand(
    "vs-notebook.createGlobalNote",
    async () => {
      const title = await vscode3.window.showInputBox({
        prompt: "Enter global note title"
      });
      if (!title) {
        return;
      }
      const description = await vscode3.window.showInputBox({
        prompt: "Enter note description"
      });
      const tags = await vscode3.window.showInputBox({
        prompt: "Enter tags (comma-separated, optional)"
      });
      if (!fs3.existsSync(globalNotesDir)) {
        fs3.mkdirSync(globalNotesDir, { recursive: true });
      }
      const notePath = path3.join(
        globalNotesDir,
        `${title.replace(/\s+/g, "-")}.md`
      );
      const content = `---
title: ${title}
tags: ${tags || ""}
url: 
---

${description || ""}`;
      fs3.writeFileSync(notePath, content);
      vscode3.window.showInformationMessage(`Global note "${title}" created.`);
      vscode3.workspace.openTextDocument(notePath).then((doc) => {
        vscode3.window.showTextDocument(doc, {
          viewColumn: vscode3.ViewColumn.Beside,
          preserveFocus: false,
          preview: false
        });
      });
      globalNotesProvider.refresh();
    }
  );
  vscode3.commands.registerCommand(
    "vs-notebook.deleteNote",
    async (item) => {
      const notePath = item.fullPath;
      const confirm = await vscode3.window.showWarningMessage(
        "Are you sure you want to delete this note?",
        { modal: true },
        "Yes",
        "No"
      );
      if (confirm === "Yes") {
        await vscode3.workspace.fs.delete(vscode3.Uri.file(notePath));
        vscode3.window.showInformationMessage("Note deleted");
        notesProvider.refresh();
        globalNotesProvider.refresh();
        lensProvider.refresh();
      }
    }
  );
  vscode3.commands.registerCommand(
    "vs-notebook.renameNote",
    async (item) => {
      const notePath = item.fullPath;
      const oldName = path3.basename(notePath, ".md");
      const newName = await vscode3.window.showInputBox({
        prompt: "Enter new note name",
        value: oldName
      });
      if (!newName || newName === oldName) {
        return;
      }
      const newPath = path3.join(
        path3.dirname(notePath),
        `${newName.replace(/\s+/g, "-")}.md`
      );
      await vscode3.workspace.fs.rename(
        vscode3.Uri.file(notePath),
        vscode3.Uri.file(newPath)
      );
      vscode3.window.showInformationMessage("Note renamed");
      notesProvider.refresh();
      globalNotesProvider.refresh();
      lensProvider.refresh();
    }
  );
  vscode3.commands.registerCommand(
    "vs-notebook.openNotesForLine",
    (filePath, lineNumber) => {
      const notesPath = path3.join(rootPath, ".vs-notebook");
      if (!fs3.existsSync(notesPath)) {
        return;
      }
      const relatedNotes = fs3.readdirSync(notesPath).filter((f) => f.endsWith(".md")).map((f) => path3.join(notesPath, f)).filter((f) => {
        const content = fs3.readFileSync(f, "utf8");
        const match = content.match(/^---\n([\s\S]+?)\n---/);
        if (!match) {
          return false;
        }
        const meta = Object.fromEntries(
          match[1].split("\n").map((line) => {
            const [k, ...r] = line.split(":");
            return [k.trim(), r.join(":").trim()];
          })
        );
        return path3.resolve(meta.file ?? "") === path3.resolve(filePath) && parseInt(meta.line ?? "") === lineNumber;
      });
      if (relatedNotes.length === 0) {
        vscode3.window.showInformationMessage("No notes found for this line.");
      } else {
        relatedNotes.forEach((note) => {
          vscode3.workspace.openTextDocument(note).then(
            (doc) => vscode3.window.showTextDocument(doc, { preview: false })
          );
        });
      }
    }
  );
  vscode3.commands.registerCommand(
    "vs-notebook.openNotesForRange",
    (filePath, lineStart, lineEnd) => {
      const notesPath = path3.join(rootPath, ".vs-notebook");
      if (!fs3.existsSync(notesPath)) {
        return;
      }
      const relatedNotes = fs3.readdirSync(notesPath).filter((f) => f.endsWith(".md")).map((f) => path3.join(notesPath, f)).filter((f) => {
        const content = fs3.readFileSync(f, "utf8");
        const match = content.match(/^---\n([\s\S]+?)\n---/);
        if (!match) {
          return false;
        }
        const meta = Object.fromEntries(
          match[1].split("\n").map((line) => {
            const [k, ...r] = line.split(":");
            return [k.trim(), r.join(":").trim()];
          })
        );
        if (path3.resolve(meta.file ?? "") !== path3.resolve(filePath)) {
          return false;
        }
        const start = meta.lineStart ? parseInt(meta.lineStart) : null;
        const end = meta.lineEnd ? parseInt(meta.lineEnd) : null;
        if (start === null || end === null) {
          return false;
        }
        return !(end < lineStart || start > lineEnd);
      });
      if (relatedNotes.length === 0) {
        vscode3.window.showInformationMessage(
          "No notes found for this code block."
        );
      } else {
        relatedNotes.forEach((note) => {
          vscode3.workspace.openTextDocument(note).then(
            (doc) => vscode3.window.showTextDocument(doc, { preview: false })
          );
        });
      }
    }
  );
  vscode3.workspace.onDidSaveTextDocument((doc) => {
    if (doc.fileName.includes(".vs-notebook")) {
      notesProvider.refresh();
      globalNotesProvider.refresh();
      lensProvider.refresh();
    }
  });
  vscode3.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("vs-notebook.groupBy") || e.affectsConfiguration("vs-notebook.tagIcons")) {
      notesProvider.refresh();
      globalNotesProvider.refresh();
    }
  });
  context.subscriptions.push(createNote);
  context.subscriptions.push(createGlobalNote);
  context.subscriptions.push({
    dispose: () => {
      notesProvider.dispose();
      globalNotesProvider.dispose();
      lensProvider.dispose();
    }
  });
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
/*! Bundled license information:

chokidar/esm/index.js:
  (*! chokidar - MIT License (c) 2012 Paul Miller (paulmillr.com) *)
*/
//# sourceMappingURL=extension.js.map
