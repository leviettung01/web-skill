var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
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

// node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "node_modules/postgres-array/index.js"(exports) {
    "use strict";
    exports.parse = function(source, transform) {
      return new ArrayParser(source, transform).parse();
    };
    var ArrayParser = class _ArrayParser {
      constructor(source, transform) {
        this.source = source;
        this.transform = transform || identity;
        this.position = 0;
        this.entries = [];
        this.recorded = [];
        this.dimension = 0;
      }
      isEof() {
        return this.position >= this.source.length;
      }
      nextCharacter() {
        var character = this.source[this.position++];
        if (character === "\\") {
          return {
            value: this.source[this.position++],
            escaped: true
          };
        }
        return {
          value: character,
          escaped: false
        };
      }
      record(character) {
        this.recorded.push(character);
      }
      newEntry(includeEmpty) {
        var entry;
        if (this.recorded.length > 0 || includeEmpty) {
          entry = this.recorded.join("");
          if (entry === "NULL" && !includeEmpty) {
            entry = null;
          }
          if (entry !== null) entry = this.transform(entry);
          this.entries.push(entry);
          this.recorded = [];
        }
      }
      consumeDimensions() {
        if (this.source[0] === "[") {
          while (!this.isEof()) {
            var char = this.nextCharacter();
            if (char.value === "=") break;
          }
        }
      }
      parse(nested) {
        var character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
          character = this.nextCharacter();
          if (character.value === "{" && !quote) {
            this.dimension++;
            if (this.dimension > 1) {
              parser = new _ArrayParser(this.source.substr(this.position - 1), this.transform);
              this.entries.push(parser.parse(true));
              this.position += parser.position - 2;
            }
          } else if (character.value === "}" && !quote) {
            this.dimension--;
            if (!this.dimension) {
              this.newEntry();
              if (nested) return this.entries;
            }
          } else if (character.value === '"' && !character.escaped) {
            if (quote) this.newEntry(true);
            quote = !quote;
          } else if (character.value === "," && !quote) {
            this.newEntry();
          } else {
            this.record(character.value);
          }
        }
        if (this.dimension !== 0) {
          throw new Error("array dimension not balanced");
        }
        return this.entries;
      }
    };
    function identity(value) {
      return value;
    }
  }
});

// node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS({
  "node_modules/pg-types/lib/arrayParser.js"(exports, module) {
    var array = require_postgres_array();
    module.exports = {
      create: function(source, transform) {
        return {
          parse: function() {
            return array.parse(source, transform);
          }
        };
      }
    };
  }
});

// node_modules/postgres-date/index.js
var require_postgres_date = __commonJS({
  "node_modules/postgres-date/index.js"(exports, module) {
    "use strict";
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
    var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
    var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
    var INFINITY = /^-?infinity$/;
    module.exports = function parseDate(isoDate) {
      if (INFINITY.test(isoDate)) {
        return Number(isoDate.replace("i", "I"));
      }
      var matches = DATE_TIME.exec(isoDate);
      if (!matches) {
        return getDate(isoDate) || null;
      }
      var isBC = !!matches[8];
      var year = parseInt(matches[1], 10);
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var hour = parseInt(matches[4], 10);
      var minute = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date;
      var offset = timeZoneOffset(isoDate);
      if (offset != null) {
        date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
        if (is0To99(year)) {
          date.setUTCFullYear(year);
        }
        if (offset !== 0) {
          date.setTime(date.getTime() - offset);
        }
      } else {
        date = new Date(year, month, day, hour, minute, second, ms);
        if (is0To99(year)) {
          date.setFullYear(year);
        }
      }
      return date;
    };
    function getDate(isoDate) {
      var matches = DATE.exec(isoDate);
      if (!matches) {
        return;
      }
      var year = parseInt(matches[1], 10);
      var isBC = !!matches[4];
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var date = new Date(year, month, day);
      if (is0To99(year)) {
        date.setFullYear(year);
      }
      return date;
    }
    function timeZoneOffset(isoDate) {
      if (isoDate.endsWith("+00")) {
        return 0;
      }
      var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
      if (!zone) return;
      var type = zone[1];
      if (type === "Z") {
        return 0;
      }
      var sign = type === "-" ? -1 : 1;
      var offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
      return offset * sign * 1e3;
    }
    function bcYearToNegativeYear(year) {
      return -(year - 1);
    }
    function is0To99(num) {
      return num >= 0 && num < 100;
    }
  }
});

// node_modules/xtend/mutable.js
var require_mutable = __commonJS({
  "node_modules/xtend/mutable.js"(exports, module) {
    module.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
  }
});

// node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS({
  "node_modules/postgres-interval/index.js"(exports, module) {
    "use strict";
    var extend = require_mutable();
    module.exports = PostgresInterval;
    function PostgresInterval(raw2) {
      if (!(this instanceof PostgresInterval)) {
        return new PostgresInterval(raw2);
      }
      extend(this, parse2(raw2));
    }
    var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
    PostgresInterval.prototype.toPostgres = function() {
      var filtered = properties.filter(this.hasOwnProperty, this);
      if (this.milliseconds && filtered.indexOf("seconds") < 0) {
        filtered.push("seconds");
      }
      if (filtered.length === 0) return "0";
      return filtered.map(function(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
        }
        return value + " " + property;
      }, this).join(" ");
    };
    var propertiesISOEquivalent = {
      years: "Y",
      months: "M",
      days: "D",
      hours: "H",
      minutes: "M",
      seconds: "S"
    };
    var dateProperties = ["years", "months", "days"];
    var timeProperties = ["hours", "minutes", "seconds"];
    PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
      var datePart = dateProperties.map(buildProperty, this).join("");
      var timePart = timeProperties.map(buildProperty, this).join("");
      return "P" + datePart + "T" + timePart;
      function buildProperty(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
        }
        return value + propertiesISOEquivalent[property];
      }
    };
    var NUMBER = "([+-]?\\d+)";
    var YEAR = NUMBER + "\\s+years?";
    var MONTH = NUMBER + "\\s+mons?";
    var DAY = NUMBER + "\\s+days?";
    var TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
    var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function(regexString) {
      return "(" + regexString + ")?";
    }).join("\\s*"));
    var positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    };
    var negatives = ["hours", "minutes", "seconds", "milliseconds"];
    function parseMilliseconds(fraction) {
      var microseconds = fraction + "000000".slice(fraction.length);
      return parseInt(microseconds, 10) / 1e3;
    }
    function parse2(interval) {
      if (!interval) return {};
      var matches = INTERVAL.exec(interval);
      var isNegative = matches[8] === "-";
      return Object.keys(positions).reduce(function(parsed, property) {
        var position = positions[property];
        var value = matches[position];
        if (!value) return parsed;
        value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
        if (!value) return parsed;
        if (isNegative && ~negatives.indexOf(property)) {
          value *= -1;
        }
        parsed[property] = value;
        return parsed;
      }, {});
    }
  }
});

// node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS({
  "node_modules/postgres-bytea/index.js"(exports, module) {
    "use strict";
    var bufferFrom = Buffer.from || Buffer;
    module.exports = function parseBytea(input2) {
      if (/^\\x/.test(input2)) {
        return bufferFrom(input2.substr(2), "hex");
      }
      var output = "";
      var i = 0;
      while (i < input2.length) {
        if (input2[i] !== "\\") {
          output += input2[i];
          ++i;
        } else {
          if (/[0-7]{3}/.test(input2.substr(i + 1, 3))) {
            output += String.fromCharCode(parseInt(input2.substr(i + 1, 3), 8));
            i += 4;
          } else {
            var backslashes = 1;
            while (i + backslashes < input2.length && input2[i + backslashes] === "\\") {
              backslashes++;
            }
            for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
              output += "\\";
            }
            i += Math.floor(backslashes / 2) * 2;
          }
        }
      }
      return bufferFrom(output, "binary");
    };
  }
});

// node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS({
  "node_modules/pg-types/lib/textParsers.js"(exports, module) {
    var array = require_postgres_array();
    var arrayParser = require_arrayParser();
    var parseDate = require_postgres_date();
    var parseInterval = require_postgres_interval();
    var parseByteA = require_postgres_bytea();
    function allowNull(fn) {
      return function nullAllowed(value) {
        if (value === null) return value;
        return fn(value);
      };
    }
    function parseBool(value) {
      if (value === null) return value;
      return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
    }
    function parseBoolArray(value) {
      if (!value) return null;
      return array.parse(value, parseBool);
    }
    function parseBaseTenInt(string) {
      return parseInt(string, 10);
    }
    function parseIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(parseBaseTenInt));
    }
    function parseBigIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(function(entry) {
        return parseBigInteger(entry).trim();
      }));
    }
    var parsePointArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parsePoint(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseFloatArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseFloat(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseStringArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value);
      return p.parse();
    };
    var parseDateArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseDate(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseIntervalArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseInterval(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseByteAArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(parseByteA));
    };
    var parseInteger = function(value) {
      return parseInt(value, 10);
    };
    var parseBigInteger = function(value) {
      var valStr = String(value);
      if (/^\d+$/.test(valStr)) {
        return valStr;
      }
      return value;
    };
    var parseJsonArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(JSON.parse));
    };
    var parsePoint = function(value) {
      if (value[0] !== "(") {
        return null;
      }
      value = value.substring(1, value.length - 1).split(",");
      return {
        x: parseFloat(value[0]),
        y: parseFloat(value[1])
      };
    };
    var parseCircle = function(value) {
      if (value[0] !== "<" && value[1] !== "(") {
        return null;
      }
      var point = "(";
      var radius = "";
      var pointParsed = false;
      for (var i = 2; i < value.length - 1; i++) {
        if (!pointParsed) {
          point += value[i];
        }
        if (value[i] === ")") {
          pointParsed = true;
          continue;
        } else if (!pointParsed) {
          continue;
        }
        if (value[i] === ",") {
          continue;
        }
        radius += value[i];
      }
      var result = parsePoint(point);
      result.radius = parseFloat(radius);
      return result;
    };
    var init = function(register) {
      register(20, parseBigInteger);
      register(21, parseInteger);
      register(23, parseInteger);
      register(26, parseInteger);
      register(700, parseFloat);
      register(701, parseFloat);
      register(16, parseBool);
      register(1082, parseDate);
      register(1114, parseDate);
      register(1184, parseDate);
      register(600, parsePoint);
      register(651, parseStringArray);
      register(718, parseCircle);
      register(1e3, parseBoolArray);
      register(1001, parseByteAArray);
      register(1005, parseIntegerArray);
      register(1007, parseIntegerArray);
      register(1028, parseIntegerArray);
      register(1016, parseBigIntegerArray);
      register(1017, parsePointArray);
      register(1021, parseFloatArray);
      register(1022, parseFloatArray);
      register(1231, parseFloatArray);
      register(1014, parseStringArray);
      register(1015, parseStringArray);
      register(1008, parseStringArray);
      register(1009, parseStringArray);
      register(1040, parseStringArray);
      register(1041, parseStringArray);
      register(1115, parseDateArray);
      register(1182, parseDateArray);
      register(1185, parseDateArray);
      register(1186, parseInterval);
      register(1187, parseIntervalArray);
      register(17, parseByteA);
      register(114, JSON.parse.bind(JSON));
      register(3802, JSON.parse.bind(JSON));
      register(199, parseJsonArray);
      register(3807, parseJsonArray);
      register(3907, parseStringArray);
      register(2951, parseStringArray);
      register(791, parseStringArray);
      register(1183, parseStringArray);
      register(1270, parseStringArray);
    };
    module.exports = {
      init
    };
  }
});

// node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS({
  "node_modules/pg-int8/index.js"(exports, module) {
    "use strict";
    var BASE = 1e6;
    function readInt8(buffer) {
      var high = buffer.readInt32BE(0);
      var low = buffer.readUInt32BE(4);
      var sign = "";
      if (high < 0) {
        high = ~high + (low === 0);
        low = ~low + 1 >>> 0;
        sign = "-";
      }
      var result = "";
      var carry;
      var t;
      var digits;
      var pad;
      var l;
      var i;
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        t = 4294967296 * carry + low;
        digits = "" + t % BASE;
        return sign + digits + result;
      }
    }
    module.exports = readInt8;
  }
});

// node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS({
  "node_modules/pg-types/lib/binaryParsers.js"(exports, module) {
    var parseInt64 = require_pg_int8();
    var parseBits = function(data, bits, offset, invert, callback) {
      offset = offset || 0;
      invert = invert || false;
      callback = callback || function(lastValue, newValue, bits2) {
        return lastValue * Math.pow(2, bits2) + newValue;
      };
      var offsetBytes = offset >> 3;
      var inv = function(value) {
        if (invert) {
          return ~value & 255;
        }
        return value;
      };
      var mask = 255;
      var firstBits = 8 - offset % 8;
      if (bits < firstBits) {
        mask = 255 << 8 - bits & 255;
        firstBits = bits;
      }
      if (offset) {
        mask = mask >> offset % 8;
      }
      var result = 0;
      if (offset % 8 + bits >= 8) {
        result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
      }
      var bytes = bits + offset >> 3;
      for (var i = offsetBytes + 1; i < bytes; i++) {
        result = callback(result, inv(data[i]), 8);
      }
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
      }
      return result;
    };
    var parseFloatFromBits = function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign = parseBits(data, 1);
      var exponent = parseBits(data, exponentBits, 1);
      if (exponent === 0) {
        return 0;
      }
      var precisionBitsCounter = 1;
      var parsePrecisionBits = function(lastValue, newValue, bits) {
        if (lastValue === 0) {
          lastValue = 1;
        }
        for (var i = 1; i <= bits; i++) {
          precisionBitsCounter /= 2;
          if ((newValue & 1 << bits - i) > 0) {
            lastValue += precisionBitsCounter;
          }
        }
        return lastValue;
      };
      var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
      if (exponent == Math.pow(2, exponentBits + 1) - 1) {
        if (mantissa === 0) {
          return sign === 0 ? Infinity : -Infinity;
        }
        return NaN;
      }
      return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    };
    var parseInt16 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 15, 1, true) + 1);
      }
      return parseBits(value, 15, 1);
    };
    var parseInt32 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 31, 1, true) + 1);
      }
      return parseBits(value, 31, 1);
    };
    var parseFloat32 = function(value) {
      return parseFloatFromBits(value, 23, 8);
    };
    var parseFloat64 = function(value) {
      return parseFloatFromBits(value, 52, 11);
    };
    var parseNumeric = function(value) {
      var sign = parseBits(value, 16, 32);
      if (sign == 49152) {
        return NaN;
      }
      var weight = Math.pow(1e4, parseBits(value, 16, 16));
      var result = 0;
      var digits = [];
      var ndigits = parseBits(value, 16);
      for (var i = 0; i < ndigits; i++) {
        result += parseBits(value, 16, 64 + 16 * i) * weight;
        weight /= 1e4;
      }
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return (sign === 0 ? 1 : -1) * Math.round(result * scale) / scale;
    };
    var parseDate = function(isUTC, value) {
      var sign = parseBits(value, 1);
      var rawValue = parseBits(value, 63, 1);
      var result = new Date((sign === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
      if (!isUTC) {
        result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
      }
      result.usec = rawValue % 1e3;
      result.getMicroSeconds = function() {
        return this.usec;
      };
      result.setMicroSeconds = function(value2) {
        this.usec = value2;
      };
      result.getUTCMicroSeconds = function() {
        return this.usec;
      };
      return result;
    };
    var parseArray = function(value) {
      var dim = parseBits(value, 32);
      var flags = parseBits(value, 32, 32);
      var elementType = parseBits(value, 32, 64);
      var offset = 96;
      var dims = [];
      for (var i = 0; i < dim; i++) {
        dims[i] = parseBits(value, 32, offset);
        offset += 32;
        offset += 32;
      }
      var parseElement = function(elementType2) {
        var length = parseBits(value, 32, offset);
        offset += 32;
        if (length == 4294967295) {
          return null;
        }
        var result;
        if (elementType2 == 23 || elementType2 == 20) {
          result = parseBits(value, length * 8, offset);
          offset += length * 8;
          return result;
        } else if (elementType2 == 25) {
          result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
          return result;
        } else {
          console.log("ERROR: ElementType not implemented: " + elementType2);
        }
      };
      var parse2 = function(dimension, elementType2) {
        var array = [];
        var i2;
        if (dimension.length > 1) {
          var count = dimension.shift();
          for (i2 = 0; i2 < count; i2++) {
            array[i2] = parse2(dimension, elementType2);
          }
          dimension.unshift(count);
        } else {
          for (i2 = 0; i2 < dimension[0]; i2++) {
            array[i2] = parseElement(elementType2);
          }
        }
        return array;
      };
      return parse2(dims, elementType);
    };
    var parseText = function(value) {
      return value.toString("utf8");
    };
    var parseBool = function(value) {
      if (value === null) return null;
      return parseBits(value, 8) > 0;
    };
    var init = function(register) {
      register(20, parseInt64);
      register(21, parseInt16);
      register(23, parseInt32);
      register(26, parseInt32);
      register(1700, parseNumeric);
      register(700, parseFloat32);
      register(701, parseFloat64);
      register(16, parseBool);
      register(1114, parseDate.bind(null, false));
      register(1184, parseDate.bind(null, true));
      register(1e3, parseArray);
      register(1007, parseArray);
      register(1016, parseArray);
      register(1008, parseArray);
      register(1009, parseArray);
      register(25, parseText);
    };
    module.exports = {
      init
    };
  }
});

// node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS({
  "node_modules/pg-types/lib/builtins.js"(exports, module) {
    module.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096
    };
  }
});

// node_modules/pg-types/index.js
var require_pg_types = __commonJS({
  "node_modules/pg-types/index.js"(exports) {
    var textParsers = require_textParsers();
    var binaryParsers = require_binaryParsers();
    var arrayParser = require_arrayParser();
    var builtinTypes = require_builtins();
    exports.getTypeParser = getTypeParser;
    exports.setTypeParser = setTypeParser;
    exports.arrayParser = arrayParser;
    exports.builtins = builtinTypes;
    var typeParsers = {
      text: {},
      binary: {}
    };
    function noParse(val) {
      return String(val);
    }
    function getTypeParser(oid, format) {
      format = format || "text";
      if (!typeParsers[format]) {
        return noParse;
      }
      return typeParsers[format][oid] || noParse;
    }
    function setTypeParser(oid, format, parseFn) {
      if (typeof format == "function") {
        parseFn = format;
        format = "text";
      }
      typeParsers[format][oid] = parseFn;
    }
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
  }
});

// node_modules/pg/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/pg/lib/defaults.js"(exports, module) {
    "use strict";
    var user;
    try {
      user = process.platform === "win32" ? process.env.USERNAME : process.env.USER;
    } catch {
    }
    module.exports = {
      // database host. defaults to localhost
      host: "localhost",
      // database user's name
      user,
      // name of database to connect
      database: void 0,
      // database user's password
      password: null,
      // a Postgres connection string to be used instead of setting individual connection items
      // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
      // in the defaults object.
      connectionString: void 0,
      // database port
      port: 5432,
      // number of rows to return at a time from a prepared statement's
      // portal. 0 will return all rows at once
      rows: 0,
      // binary result mode
      binary: false,
      // Connection pool options - see https://github.com/brianc/node-pg-pool
      // number of connections to use in connection pool
      // 0 will disable connection pooling
      max: 10,
      // max milliseconds a client can go unused before it is removed
      // from the pool and destroyed
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: false,
      // SSL negotiation style: 'postgres' (traditional SSLRequest) or 'direct'
      sslnegotiation: void 0,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: false,
      // max milliseconds any query using this connection will execute for before timing out in error.
      // false=unlimited
      statement_timeout: false,
      // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
      // false=unlimited
      lock_timeout: false,
      // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
      // false=unlimited
      idle_in_transaction_session_timeout: false,
      // max milliseconds to wait for query to complete (client side)
      query_timeout: false,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0
    };
    var pgTypes = require_pg_types();
    var parseBigInteger = pgTypes.getTypeParser(20, "text");
    var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
    module.exports.__defineSetter__("parseInt8", function(val) {
      pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
      pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
    });
  }
});

// node_modules/pg/lib/utils.js
var require_utils = __commonJS({
  "node_modules/pg/lib/utils.js"(exports, module) {
    "use strict";
    var defaults2 = require_defaults();
    var nodeUtils = __require("util");
    var { isDate } = __require("util/types");
    var invalidDateDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Sending an invalid date to Postgres is deprecated and will throw an error in the next major version of pg. Ensure any Date object passed as a query parameter is valid.",
      "PG_INVALID_DATE"
    );
    function escapeElement(elementRepresentation) {
      const escaped = elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return '"' + escaped + '"';
    }
    function arrayString(val) {
      let result = "{";
      for (let i = 0; i < val.length; i++) {
        if (i > 0) {
          result += ",";
        }
        let item = val[i];
        if (item == null) {
          result += "NULL";
        } else if (Array.isArray(item)) {
          result += arrayString(item);
        } else if (ArrayBuffer.isView(item)) {
          if (!(item instanceof Buffer)) {
            item = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
          }
          result += "\\\\x" + item.toString("hex");
        } else {
          result += escapeElement(prepareValue(item));
        }
      }
      result += "}";
      return result;
    }
    var prepareValue = function(val, seen) {
      if (val == null) {
        return null;
      }
      if (typeof val === "object") {
        if (val instanceof Buffer) {
          return val;
        }
        if (ArrayBuffer.isView(val)) {
          return Buffer.from(val.buffer, val.byteOffset, val.byteLength);
        }
        if (isDate(val)) {
          if (isNaN(val.getTime())) {
            invalidDateDeprecationNotice();
          }
          if (defaults2.parseInputDatesAsUTC) {
            return dateToStringUTC(val);
          } else {
            return dateToString(val);
          }
        }
        if (Array.isArray(val)) {
          return arrayString(val);
        }
        return prepareObject(val, seen);
      }
      return val.toString();
    };
    function prepareObject(val, seen) {
      if (val && typeof val.toPostgres === "function") {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
    function dateToString(date) {
      let offset = -date.getTimezoneOffset();
      let year = date.getFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
      if (offset < 0) {
        ret += "-";
        offset *= -1;
      } else {
        ret += "+";
      }
      ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
      if (isBCYear) ret += " BC";
      return ret;
    }
    function dateToStringUTC(date) {
      let year = date.getUTCFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
      ret += "+00:00";
      if (isBCYear) ret += " BC";
      return ret;
    }
    function normalizeQueryConfig(config, values, callback) {
      config = typeof config === "string" ? { text: config } : cloneQueryConfig(config);
      if (values) {
        if (typeof values === "function") {
          config.callback = values;
        } else {
          config.values = values;
        }
      }
      if (callback) {
        config.callback = callback;
      }
      return config;
    }
    function cloneQueryConfig(config) {
      if (config == null) {
        return config;
      }
      return Object.defineProperties(Object.create(Object.getPrototypeOf(config)), Object.getOwnPropertyDescriptors(config));
    }
    var escapeIdentifier2 = function(str) {
      return '"' + str.replace(/"/g, '""') + '"';
    };
    var escapeLiteral2 = function(str) {
      let hasBackslash = false;
      let escaped = "'";
      if (str == null) {
        return "''";
      }
      if (typeof str !== "string") {
        return "''";
      }
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === "'") {
          escaped += c + c;
        } else if (c === "\\") {
          escaped += c + c;
          hasBackslash = true;
        } else {
          escaped += c;
        }
      }
      escaped += "'";
      if (hasBackslash === true) {
        escaped = " E" + escaped;
      }
      return escaped;
    };
    module.exports = {
      prepareValue: function prepareValueWrapper(value) {
        return prepareValue(value);
      },
      normalizeQueryConfig,
      escapeIdentifier: escapeIdentifier2,
      escapeLiteral: escapeLiteral2
    };
  }
});

// node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS({
  "node_modules/pg/lib/crypto/utils.js"(exports, module) {
    var nodeCrypto = __require("crypto");
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes,
      deriveKey,
      sha256: sha2562,
      hashByName,
      hmacSha256,
      md5
    };
    var webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
    var subtleCrypto = webCrypto.subtle;
    var textEncoder = new TextEncoder();
    function randomBytes(length) {
      return webCrypto.getRandomValues(Buffer.alloc(length));
    }
    async function md5(string) {
      try {
        return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
      } catch (e) {
        const data = typeof string === "string" ? textEncoder.encode(string) : string;
        const hash = await subtleCrypto.digest("MD5", data);
        return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    async function postgresMd5PasswordHash(user, password, salt) {
      const inner = await md5(password + user);
      const outer = await md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    async function sha2562(text) {
      return await subtleCrypto.digest("SHA-256", text);
    }
    async function hashByName(hashName, text) {
      return await subtleCrypto.digest(hashName, text);
    }
    async function hmacSha256(keyBuffer, msg) {
      const key = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
    }
    async function deriveKey(password, salt, iterations) {
      const key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
      const params = { name: "PBKDF2", hash: "SHA-256", salt, iterations };
      return await subtleCrypto.deriveBits(params, key, 32 * 8, ["deriveBits"]);
    }
  }
});

// node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = __commonJS({
  "node_modules/pg/lib/crypto/cert-signatures.js"(exports, module) {
    function x509Error(msg, cert) {
      return new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
    }
    function readASN1Length(data, index) {
      let length = data[index++];
      if (length < 128) return { length, index };
      const lengthBytes = length & 127;
      if (lengthBytes > 4) throw x509Error("bad length", data);
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
        length = length << 8 | data[index++];
      }
      return { length, index };
    }
    function readASN1OID(data, index) {
      if (data[index++] !== 6) throw x509Error("non-OID data", data);
      const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
      index = indexAfterOIDLength;
      const lastIndex = index + OIDLength;
      const byte1 = data[index++];
      let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
      while (index < lastIndex) {
        let value = 0;
        while (index < lastIndex) {
          const nextByte = data[index++];
          value = value << 7 | nextByte & 127;
          if (nextByte < 128) break;
        }
        oid += "." + value;
      }
      return { oid, index };
    }
    function expectASN1Seq(data, index) {
      if (data[index++] !== 48) throw x509Error("non-sequence data", data);
      return readASN1Length(data, index);
    }
    function signatureAlgorithmHashFromCertificate(data, index) {
      if (index === void 0) index = 0;
      index = expectASN1Seq(data, index).index;
      const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
      index = indexAfterCertInfoLength + certInfoLength;
      index = expectASN1Seq(data, index).index;
      const { oid, index: indexAfterOID } = readASN1OID(data, index);
      switch (oid) {
        // RSA
        case "1.2.840.113549.1.1.4":
          return "MD5";
        case "1.2.840.113549.1.1.5":
          return "SHA-1";
        case "1.2.840.113549.1.1.11":
          return "SHA-256";
        case "1.2.840.113549.1.1.12":
          return "SHA-384";
        case "1.2.840.113549.1.1.13":
          return "SHA-512";
        case "1.2.840.113549.1.1.14":
          return "SHA-224";
        case "1.2.840.113549.1.1.15":
          return "SHA512-224";
        case "1.2.840.113549.1.1.16":
          return "SHA512-256";
        // ECDSA
        case "1.2.840.10045.4.1":
          return "SHA-1";
        case "1.2.840.10045.4.3.1":
          return "SHA-224";
        case "1.2.840.10045.4.3.2":
          return "SHA-256";
        case "1.2.840.10045.4.3.3":
          return "SHA-384";
        case "1.2.840.10045.4.3.4":
          return "SHA-512";
        // RSASSA-PSS: hash is indicated separately
        case "1.2.840.113549.1.1.10": {
          index = indexAfterOID;
          index = expectASN1Seq(data, index).index;
          if (data[index++] !== 160) throw x509Error("non-tag data", data);
          index = readASN1Length(data, index).index;
          index = expectASN1Seq(data, index).index;
          const { oid: hashOID } = readASN1OID(data, index);
          switch (hashOID) {
            // standalone hash OIDs
            case "1.2.840.113549.2.5":
              return "MD5";
            case "1.3.14.3.2.26":
              return "SHA-1";
            case "2.16.840.1.101.3.4.2.1":
              return "SHA-256";
            case "2.16.840.1.101.3.4.2.2":
              return "SHA-384";
            case "2.16.840.1.101.3.4.2.3":
              return "SHA-512";
          }
          throw x509Error("unknown hash OID " + hashOID, data);
        }
        // Ed25519 -- see https://github.com/openssl/openssl/issues/15477
        case "1.3.101.110":
        case "1.3.101.112":
          return "SHA-512";
        // Ed448 -- still not in pg 17.2 (if supported, digest would be SHAKE256 x 64 bytes)
        case "1.3.101.111":
        case "1.3.101.113":
          throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
      }
      throw x509Error("unknown OID " + oid, data);
    }
    module.exports = { signatureAlgorithmHashFromCertificate };
  }
});

// node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS({
  "node_modules/pg/lib/crypto/sasl.js"(exports, module) {
    "use strict";
    var crypto2 = require_utils2();
    var { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
    function saslprep(password) {
      const nonAsciiSpace = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g;
      const mappedToNothing = /[\u00AD\u034F\u1806\u180B\u180C\u180D\u200C\u200D\u2060\uFE00-\uFE0F\uFEFF]/g;
      return password.replace(nonAsciiSpace, " ").replace(mappedToNothing, "").normalize("NFKC");
    }
    var DEFAULT_MAX_SCRAM_ITERATIONS = 1e5;
    function startSession(mechanisms, stream, scramMaxIterations = DEFAULT_MAX_SCRAM_ITERATIONS) {
      const candidates = ["SCRAM-SHA-256"];
      if (stream) candidates.unshift("SCRAM-SHA-256-PLUS");
      const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
      if (!mechanism) {
        throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
      }
      if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") {
        throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
      }
      const clientNonce = crypto2.randomBytes(18).toString("base64");
      const gs2Header = mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n";
      return {
        mechanism,
        clientNonce,
        response: gs2Header + ",,n=*,r=" + clientNonce,
        message: "SASLInitialResponse",
        scramMaxIterations
      };
    }
    async function continueSession(session, password, serverData, stream) {
      if (session.message !== "SASLInitialResponse") {
        throw new Error("SASL: Last message was not SASLInitialResponse");
      }
      if (typeof password !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      }
      if (password === "") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      }
      const sv = parseServerFirstMessage(serverData);
      if (!sv.nonce.startsWith(session.clientNonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      } else if (sv.nonce.length === session.clientNonce.length) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      }
      const scramMaxIterations = typeof session.scramMaxIterations === "number" ? session.scramMaxIterations : DEFAULT_MAX_SCRAM_ITERATIONS;
      if (scramMaxIterations !== 0 && sv.iteration > scramMaxIterations) {
        throw new Error(
          "SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration count " + sv.iteration + " exceeds scramMaxIterations of " + scramMaxIterations
        );
      }
      const clientFirstMessageBare = "n=*,r=" + session.clientNonce;
      const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
      let channelBinding = stream ? "eSws" : "biws";
      if (session.mechanism === "SCRAM-SHA-256-PLUS") {
        const peerCert = stream.getPeerCertificate().raw;
        let hashName = signatureAlgorithmHashFromCertificate(peerCert);
        if (hashName === "MD5" || hashName === "SHA-1") hashName = "SHA-256";
        const certHash = await crypto2.hashByName(hashName, peerCert);
        const bindingData = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]);
        channelBinding = bindingData.toString("base64");
      }
      const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
      const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
      const saltBytes = Buffer.from(sv.salt, "base64");
      const saltedPassword = await crypto2.deriveKey(saslprep(password), saltBytes, sv.iteration);
      const clientKey = await crypto2.hmacSha256(saltedPassword, "Client Key");
      const storedKey = await crypto2.sha256(clientKey);
      const clientSignature = await crypto2.hmacSha256(storedKey, authMessage);
      const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
      const serverKey = await crypto2.hmacSha256(saltedPassword, "Server Key");
      const serverSignatureBytes = await crypto2.hmacSha256(serverKey, authMessage);
      session.message = "SASLResponse";
      session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
      session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
    }
    function finalizeSession(session, serverData) {
      if (session.message !== "SASLResponse") {
        throw new Error("SASL: Last message was not SASLResponse");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      }
      const { serverSignature } = parseServerFinalMessage(serverData);
      if (serverSignature !== session.serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
      }
    }
    function isPrintableChars(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: text must be a string");
      }
      return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    function isBase64(text) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
    }
    function parseAttributePairs(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: attribute pairs text must be a string");
      }
      return new Map(
        text.split(",").map((attrValue) => {
          if (!/^.=/.test(attrValue)) {
            throw new Error("SASL: Invalid attribute pair entry");
          }
          const name = attrValue[0];
          const value = attrValue.substring(2);
          return [name, value];
        })
      );
    }
    function parseServerFirstMessage(data) {
      const attrPairs = parseAttributePairs(data);
      const nonce = attrPairs.get("r");
      if (!nonce) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      } else if (!isPrintableChars(nonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      }
      const salt = attrPairs.get("s");
      if (!salt) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      } else if (!isBase64(salt)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      }
      const iterationText = attrPairs.get("i");
      if (!iterationText) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      }
      const iteration = parseInt(iterationText, 10);
      return {
        nonce,
        salt,
        iteration
      };
    }
    function parseServerFinalMessage(serverData) {
      const attrPairs = parseAttributePairs(serverData);
      const error = attrPairs.get("e");
      const serverSignature = attrPairs.get("v");
      if (error) {
        throw new Error(`SASL: SCRAM-SERVER-FINAL-MESSAGE: server returned error: "${error}"`);
      }
      if (!serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      } else if (!isBase64(serverSignature)) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      }
      return {
        serverSignature
      };
    }
    function xorBuffers(a, b) {
      if (!Buffer.isBuffer(a)) {
        throw new TypeError("first argument must be a Buffer");
      }
      if (!Buffer.isBuffer(b)) {
        throw new TypeError("second argument must be a Buffer");
      }
      if (a.length !== b.length) {
        throw new Error("Buffer lengths must match");
      }
      if (a.length === 0) {
        throw new Error("Buffers cannot be empty");
      }
      return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
    }
    module.exports = {
      startSession,
      continueSession,
      finalizeSession,
      DEFAULT_MAX_SCRAM_ITERATIONS
    };
  }
});

// node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS({
  "node_modules/pg/lib/type-overrides.js"(exports, module) {
    "use strict";
    var types2 = require_pg_types();
    function TypeOverrides2(userTypes) {
      this._types = userTypes || types2;
      this.text = {};
      this.binary = {};
    }
    TypeOverrides2.prototype.getOverrides = function(format) {
      switch (format) {
        case "text":
          return this.text;
        case "binary":
          return this.binary;
        default:
          return {};
      }
    };
    TypeOverrides2.prototype.setTypeParser = function(oid, format, parseFn) {
      if (typeof format === "function") {
        parseFn = format;
        format = "text";
      }
      this.getOverrides(format)[oid] = parseFn;
    };
    TypeOverrides2.prototype.getTypeParser = function(oid, format) {
      format = format || "text";
      return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    module.exports = TypeOverrides2;
  }
});

// node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS({
  "node_modules/pg-connection-string/index.js"(exports, module) {
    "use strict";
    function parse2(str, options = {}) {
      if (str.charAt(0) === "/") {
        const config2 = str.split(" ");
        return { host: config2[0], database: config2[1] };
      }
      const config = /* @__PURE__ */ Object.create(null);
      let result;
      let dummyHost = false;
      if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
        str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
      }
      try {
        try {
          result = new URL(str, "postgres://base");
        } catch (e) {
          result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
          dummyHost = true;
        }
      } catch (err) {
        err.input && (err.input = "*****REDACTED*****");
        throw err;
      }
      for (const entry of result.searchParams.entries()) {
        config[entry[0]] = entry[1];
      }
      config.user = config.user || decodeURIComponent(result.username);
      config.password = config.password || decodeURIComponent(result.password);
      if (result.protocol == "socket:") {
        config.host = decodeURI(result.pathname);
        config.database = result.searchParams.get("db");
        config.client_encoding = result.searchParams.get("encoding");
        return config;
      }
      const hostname = (dummyHost ? "" : result.hostname).replace(/^\[(.+)\]$/, "$1");
      if (!config.host) {
        config.host = decodeURIComponent(hostname);
      } else if (hostname && /^%2f/i.test(hostname)) {
        result.pathname = hostname + result.pathname;
      }
      if (!config.port) {
        config.port = result.port;
      }
      const pathname = result.pathname.slice(1) || null;
      config.database = pathname ? decodeURI(pathname) : null;
      if (config.ssl === "true" || config.ssl === "1") {
        config.ssl = true;
      }
      if (config.ssl === "0") {
        config.ssl = false;
      }
      if (config.sslcert || config.sslkey || config.sslrootcert || config.sslmode) {
        config.ssl = {};
      }
      if (config.sslnegotiation === "direct" && config.ssl === void 0) {
        config.ssl = true;
      }
      const fs = config.sslcert || config.sslkey || config.sslrootcert ? __require("fs") : null;
      if (config.sslcert) {
        config.ssl.cert = fs.readFileSync(config.sslcert).toString();
      }
      if (config.sslkey) {
        config.ssl.key = fs.readFileSync(config.sslkey).toString();
      }
      if (config.sslrootcert) {
        config.ssl.ca = fs.readFileSync(config.sslrootcert).toString();
      }
      if (options.useLibpqCompat && config.uselibpqcompat) {
        throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
      }
      if (config.uselibpqcompat === "true" || options.useLibpqCompat) {
        switch (config.sslmode) {
          case "disable": {
            config.ssl = false;
            break;
          }
          case "prefer": {
            config.ssl.rejectUnauthorized = false;
            break;
          }
          case "require": {
            if (config.sslrootcert) {
              config.ssl.checkServerIdentity = function() {
              };
            } else {
              config.ssl.rejectUnauthorized = false;
            }
            break;
          }
          case "verify-ca": {
            if (!config.ssl.ca) {
              throw new Error(
                "SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security."
              );
            }
            config.ssl.checkServerIdentity = function() {
            };
            break;
          }
          case "verify-full": {
            break;
          }
        }
      } else {
        switch (config.sslmode) {
          case "disable": {
            config.ssl = false;
            break;
          }
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full": {
            if (config.sslmode !== "verify-full") {
              deprecatedSslModeWarning(config.sslmode);
            }
            break;
          }
          case "no-verify": {
            config.ssl.rejectUnauthorized = false;
            break;
          }
        }
      }
      return config;
    }
    function toConnectionOptions(sslConfig) {
      const connectionOptions = Object.entries(sslConfig).reduce((c, [key, value]) => {
        if (value !== void 0 && value !== null) {
          c[key] = value;
        }
        return c;
      }, /* @__PURE__ */ Object.create(null));
      return connectionOptions;
    }
    function toClientConfig(config) {
      const poolConfig = Object.entries(config).reduce((c, [key, value]) => {
        if (key === "ssl") {
          const sslConfig = value;
          if (typeof sslConfig === "boolean") {
            c[key] = sslConfig;
          }
          if (typeof sslConfig === "object") {
            c[key] = toConnectionOptions(sslConfig);
          }
        } else if (value !== void 0 && value !== null) {
          if (key === "port") {
            if (value !== "") {
              const v = parseInt(value, 10);
              if (isNaN(v)) {
                throw new Error(`Invalid ${key}: ${value}`);
              }
              c[key] = v;
            }
          } else {
            c[key] = value;
          }
        }
        return c;
      }, /* @__PURE__ */ Object.create(null));
      return poolConfig;
    }
    function parseIntoClientConfig(str) {
      return toClientConfig(parse2(str));
    }
    function deprecatedSslModeWarning(sslmode) {
      if (!deprecatedSslModeWarning.warned && typeof process !== "undefined" && process.emitWarning) {
        deprecatedSslModeWarning.warned = true;
        process.emitWarning(`SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=${sslmode}'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.`);
      }
    }
    module.exports = parse2;
    parse2.parse = parse2;
    parse2.toClientConfig = toClientConfig;
    parse2.parseIntoClientConfig = parseIntoClientConfig;
  }
});

// node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS({
  "node_modules/pg/lib/connection-parameters.js"(exports, module) {
    "use strict";
    var dns = __require("dns");
    var defaults2 = require_defaults();
    var parse2 = require_pg_connection_string().parse;
    var val = function(key, config, envVar) {
      if (config[key]) {
        return config[key];
      }
      if (envVar === void 0) {
        envVar = process.env["PG" + key.toUpperCase()];
      } else if (envVar === false) {
      } else {
        envVar = process.env[envVar];
      }
      return envVar || defaults2[key];
    };
    var readSSLConfigFromEnvironment = function() {
      switch (process.env.PGSSLMODE) {
        case "disable":
          return false;
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full":
          return true;
        case "no-verify":
          return { rejectUnauthorized: false };
      }
      return defaults2.ssl;
    };
    var quoteParamValue = function(value) {
      return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    };
    var add = function(params, config, paramName) {
      const value = config[paramName];
      if (value !== void 0 && value !== null) {
        params.push(paramName + "=" + quoteParamValue(value));
      }
    };
    var ConnectionParameters = class {
      constructor(config) {
        config = typeof config === "string" ? parse2(config) : config || {};
        if (config.connectionString) {
          config = Object.assign({}, config, parse2(config.connectionString));
        }
        this.user = val("user", config);
        this.database = val("database", config);
        if (this.database === void 0) {
          this.database = this.user;
        }
        this.port = parseInt(val("port", config), 10);
        this.host = val("host", config);
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: val("password", config)
        });
        this.binary = val("binary", config);
        this.options = val("options", config);
        this.ssl = typeof config.ssl === "undefined" ? readSSLConfigFromEnvironment() : config.ssl;
        if (typeof this.ssl === "string") {
          if (this.ssl === "true") {
            this.ssl = true;
          }
        }
        if (this.ssl === "no-verify") {
          this.ssl = { rejectUnauthorized: false };
        }
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this.sslnegotiation = val("sslnegotiation", config, "PGSSLNEGOTIATION");
        if (this.sslnegotiation !== void 0 && this.sslnegotiation !== "postgres" && this.sslnegotiation !== "direct") {
          throw new Error(
            `Invalid sslnegotiation value: "${this.sslnegotiation}". Valid values are "postgres" and "direct".`
          );
        }
        if (this.sslnegotiation === "direct" && !this.ssl) {
          throw new Error("sslnegotiation=direct requires SSL to be enabled");
        }
        this.client_encoding = val("client_encoding", config);
        this.replication = val("replication", config);
        this.isDomainSocket = !(this.host || "").indexOf("/");
        this.application_name = val("application_name", config, "PGAPPNAME");
        this.fallback_application_name = val("fallback_application_name", config, false);
        this.statement_timeout = val("statement_timeout", config, false);
        this.lock_timeout = val("lock_timeout", config, false);
        this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config, false);
        this.query_timeout = val("query_timeout", config, false);
        if (config.connectionTimeoutMillis === void 0) {
          this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
        } else {
          this.connect_timeout = Math.floor(config.connectionTimeoutMillis / 1e3);
        }
        if (config.keepAlive === false) {
          this.keepalives = 0;
        } else if (config.keepAlive === true) {
          this.keepalives = 1;
        }
        if (typeof config.keepAliveInitialDelayMillis === "number") {
          this.keepalives_idle = Math.floor(config.keepAliveInitialDelayMillis / 1e3);
        }
      }
      getLibpqConnectionString(cb) {
        const params = [];
        add(params, this, "user");
        add(params, this, "password");
        add(params, this, "port");
        add(params, this, "application_name");
        add(params, this, "fallback_application_name");
        add(params, this, "connect_timeout");
        add(params, this, "options");
        const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
        add(params, ssl, "sslmode");
        add(params, ssl, "sslca");
        add(params, ssl, "sslkey");
        add(params, ssl, "sslcert");
        add(params, ssl, "sslrootcert");
        add(params, this, "sslnegotiation");
        if (this.database) {
          params.push("dbname=" + quoteParamValue(this.database));
        }
        if (this.replication) {
          params.push("replication=" + quoteParamValue(this.replication));
        }
        if (this.host) {
          params.push("host=" + quoteParamValue(this.host));
        }
        if (this.isDomainSocket) {
          return cb(null, params.join(" "));
        }
        if (this.client_encoding) {
          params.push("client_encoding=" + quoteParamValue(this.client_encoding));
        }
        dns.lookup(this.host, function(err, address) {
          if (err) return cb(err, null);
          params.push("hostaddr=" + quoteParamValue(address));
          return cb(null, params.join(" "));
        });
      }
    };
    module.exports = ConnectionParameters;
  }
});

// node_modules/pg/lib/result.js
var require_result = __commonJS({
  "node_modules/pg/lib/result.js"(exports, module) {
    "use strict";
    var types2 = require_pg_types();
    var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
    var Result2 = class {
      constructor(rowMode, types3) {
        this.command = null;
        this.rowCount = null;
        this.oid = null;
        this.rows = [];
        this.fields = [];
        this._parsers = void 0;
        this._types = types3;
        this.RowCtor = null;
        this.rowAsArray = rowMode === "array";
        if (this.rowAsArray) {
          this.parseRow = this._parseRowAsArray;
        }
        this._prebuiltEmptyResultObject = null;
      }
      // adds a command complete message
      addCommandComplete(msg) {
        let match2;
        if (msg.text) {
          match2 = matchRegexp.exec(msg.text);
        } else {
          match2 = matchRegexp.exec(msg.command);
        }
        if (match2) {
          this.command = match2[1];
          if (match2[3]) {
            this.oid = parseInt(match2[2], 10);
            this.rowCount = parseInt(match2[3], 10);
          } else if (match2[2]) {
            this.rowCount = parseInt(match2[2], 10);
          }
        }
      }
      _parseRowAsArray(rowData) {
        const row = new Array(rowData.length);
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          if (rawValue !== null) {
            row[i] = this._parsers[i](rawValue);
          } else {
            row[i] = null;
          }
        }
        return row;
      }
      parseRow(rowData) {
        const row = { ...this._prebuiltEmptyResultObject };
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          const field = this.fields[i].name;
          if (rawValue !== null) {
            const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
            row[field] = this._parsers[i](v);
          } else {
            row[field] = null;
          }
        }
        return row;
      }
      addRow(row) {
        this.rows.push(row);
      }
      addFields(fieldDescriptions) {
        this.fields = fieldDescriptions;
        if (this.fields.length) {
          this._parsers = new Array(fieldDescriptions.length);
        }
        const row = /* @__PURE__ */ Object.create(null);
        for (let i = 0; i < fieldDescriptions.length; i++) {
          const desc = fieldDescriptions[i];
          row[desc.name] = null;
          if (this._types) {
            this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text");
          } else {
            this._parsers[i] = types2.getTypeParser(desc.dataTypeID, desc.format || "text");
          }
        }
        this._prebuiltEmptyResultObject = { ...row };
      }
    };
    module.exports = Result2;
  }
});

// node_modules/pg/lib/query.js
var require_query = __commonJS({
  "node_modules/pg/lib/query.js"(exports, module) {
    "use strict";
    var { EventEmitter } = __require("events");
    var Result2 = require_result();
    var utils = require_utils();
    var Query2 = class extends EventEmitter {
      constructor(config, values, callback) {
        super();
        config = utils.normalizeQueryConfig(config, values, callback);
        this.text = config.text;
        this.values = config.values;
        this.rows = config.rows;
        this.types = config.types;
        this.name = config.name;
        this.queryMode = config.queryMode;
        this.binary = config.binary;
        this.portal = config.portal || "";
        this.callback = config.callback;
        this._rowMode = config.rowMode;
        if (process.domain && config.callback) {
          this.callback = process.domain.bind(config.callback);
        }
        this._result = new Result2(this._rowMode, this.types);
        this._results = this._result;
        this._canceledDueToError = false;
      }
      requiresPreparation() {
        if (this.queryMode === "extended") {
          return true;
        }
        if (this.name) {
          return true;
        }
        if (this.rows) {
          return true;
        }
        if (!this.text) {
          return false;
        }
        if (!this.values) {
          return false;
        }
        return this.values.length > 0;
      }
      _checkForMultirow() {
        if (this._result.command) {
          if (!Array.isArray(this._results)) {
            this._results = [this._result];
          }
          this._result = new Result2(this._rowMode, this._result._types);
          this._results.push(this._result);
        }
      }
      // associates row metadata from the supplied
      // message with this query object
      // metadata used when parsing row results
      handleRowDescription(msg) {
        this._checkForMultirow();
        this._result.addFields(msg.fields);
        this._accumulateRows = this.callback || !this.listeners("row").length;
      }
      handleDataRow(msg) {
        let row;
        if (this._canceledDueToError) {
          return;
        }
        try {
          row = this._result.parseRow(msg.fields);
        } catch (err) {
          this._canceledDueToError = err;
          return;
        }
        this.emit("row", row, this._result);
        if (this._accumulateRows) {
          this._result.addRow(row);
        }
      }
      handleCommandComplete(msg, connection) {
        this._checkForMultirow();
        this._result.addCommandComplete(msg);
        if (this.rows) {
          connection.sync();
        }
      }
      // if a named prepared statement is created with empty query text
      // the backend will send an emptyQuery message but *not* a command complete message
      // since we pipeline sync immediately after execute we don't need to do anything here
      // unless we have rows specified, in which case we did not pipeline the initial sync call
      handleEmptyQuery(connection) {
        if (this.rows) {
          connection.sync();
        }
      }
      handleError(err, connection) {
        if (this._canceledDueToError) {
          err = this._canceledDueToError;
          this._canceledDueToError = false;
        }
        if (this.callback) {
          return this.callback(err);
        }
        this.emit("error", err);
      }
      handleReadyForQuery(con) {
        if (this._canceledDueToError) {
          return this.handleError(this._canceledDueToError, con);
        }
        if (this.callback) {
          try {
            this.callback(null, this._results);
          } catch (err) {
            process.nextTick(() => {
              throw err;
            });
          }
        }
        this.emit("end", this._results);
      }
      submit(connection) {
        if (typeof this.text !== "string" && typeof this.name !== "string") {
          return new Error("A query must have either text or a name. Supplying neither is unsupported.");
        }
        const previous = connection.parsedStatements[this.name] || connection.submittedNamedStatements[this.name];
        if (this.text && previous && this.text !== previous) {
          return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
        }
        if (this.values && !Array.isArray(this.values)) {
          return new Error("Query values must be an array");
        }
        if (this.requiresPreparation()) {
          connection.stream.cork && connection.stream.cork();
          try {
            this.prepare(connection);
          } finally {
            connection.stream.uncork && connection.stream.uncork();
          }
        } else {
          connection.query(this.text);
        }
        return null;
      }
      hasBeenParsed(connection) {
        return this.name && (connection.parsedStatements[this.name] !== void 0 || connection.submittedNamedStatements[this.name] !== void 0);
      }
      handlePortalSuspended(connection) {
        this._getRows(connection, this.rows);
      }
      _getRows(connection, rows) {
        connection.execute({
          portal: this.portal,
          rows
        });
        if (!rows) {
          connection.sync();
        } else {
          connection.flush();
        }
      }
      // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
      prepare(connection) {
        if (!this.hasBeenParsed(connection)) {
          connection.parse({
            text: this.text,
            name: this.name,
            types: this.types
          });
          if (this.name) {
            connection.submittedNamedStatements[this.name] = this.text;
          }
        }
        try {
          connection.bind({
            portal: this.portal,
            statement: this.name,
            values: this.values,
            binary: this.binary,
            valueMapper: utils.prepareValue
          });
        } catch (err) {
          connection.close({ type: "S", name: this.name });
          connection.sync();
          this.handleError(err, connection);
          return;
        }
        connection.describe({
          type: "P",
          name: this.portal || ""
        });
        this._getRows(connection, this.rows);
      }
      handleCopyInResponse(connection) {
        connection.sendCopyFail("No source stream defined");
      }
      handleCopyData(msg, connection) {
      }
    };
    module.exports = Query2;
  }
});

// node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS({
  "node_modules/pg-protocol/dist/messages.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = void 0;
    exports.parseComplete = {
      name: "parseComplete",
      length: 5
    };
    exports.bindComplete = {
      name: "bindComplete",
      length: 5
    };
    exports.closeComplete = {
      name: "closeComplete",
      length: 5
    };
    exports.noData = {
      name: "noData",
      length: 5
    };
    exports.portalSuspended = {
      name: "portalSuspended",
      length: 5
    };
    exports.replicationStart = {
      name: "replicationStart",
      length: 4
    };
    exports.emptyQuery = {
      name: "emptyQuery",
      length: 4
    };
    exports.copyDone = {
      name: "copyDone",
      length: 4
    };
    var DatabaseError2 = class extends Error {
      constructor(message, length, name) {
        super(message);
        this.length = length;
        this.name = name;
      }
    };
    exports.DatabaseError = DatabaseError2;
    var CopyDataMessage = class {
      constructor(length, chunk) {
        this.length = length;
        this.chunk = chunk;
        this.name = "copyData";
      }
    };
    exports.CopyDataMessage = CopyDataMessage;
    var CopyResponse = class {
      constructor(length, name, binary, columnCount) {
        this.length = length;
        this.name = name;
        this.binary = binary;
        this.columnTypes = new Array(columnCount);
      }
    };
    exports.CopyResponse = CopyResponse;
    var Field = class {
      constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name;
        this.tableID = tableID;
        this.columnID = columnID;
        this.dataTypeID = dataTypeID;
        this.dataTypeSize = dataTypeSize;
        this.dataTypeModifier = dataTypeModifier;
        this.format = format;
      }
    };
    exports.Field = Field;
    var RowDescriptionMessage = class {
      constructor(length, fieldCount) {
        this.length = length;
        this.fieldCount = fieldCount;
        this.name = "rowDescription";
        this.fields = new Array(this.fieldCount);
      }
    };
    exports.RowDescriptionMessage = RowDescriptionMessage;
    var ParameterDescriptionMessage = class {
      constructor(length, parameterCount) {
        this.length = length;
        this.parameterCount = parameterCount;
        this.name = "parameterDescription";
        this.dataTypeIDs = new Array(this.parameterCount);
      }
    };
    exports.ParameterDescriptionMessage = ParameterDescriptionMessage;
    var ParameterStatusMessage = class {
      constructor(length, parameterName, parameterValue) {
        this.length = length;
        this.parameterName = parameterName;
        this.parameterValue = parameterValue;
        this.name = "parameterStatus";
      }
    };
    exports.ParameterStatusMessage = ParameterStatusMessage;
    var AuthenticationMD5Password = class {
      constructor(length, salt) {
        this.length = length;
        this.salt = salt;
        this.name = "authenticationMD5Password";
      }
    };
    exports.AuthenticationMD5Password = AuthenticationMD5Password;
    var BackendKeyDataMessage = class {
      constructor(length, processID, secretKey) {
        this.length = length;
        this.processID = processID;
        this.secretKey = secretKey;
        this.name = "backendKeyData";
      }
    };
    exports.BackendKeyDataMessage = BackendKeyDataMessage;
    var NotificationResponseMessage = class {
      constructor(length, processId, channel, payload) {
        this.length = length;
        this.processId = processId;
        this.channel = channel;
        this.payload = payload;
        this.name = "notification";
      }
    };
    exports.NotificationResponseMessage = NotificationResponseMessage;
    var ReadyForQueryMessage = class {
      constructor(length, status) {
        this.length = length;
        this.status = status;
        this.name = "readyForQuery";
      }
    };
    exports.ReadyForQueryMessage = ReadyForQueryMessage;
    var CommandCompleteMessage = class {
      constructor(length, text) {
        this.length = length;
        this.text = text;
        this.name = "commandComplete";
      }
    };
    exports.CommandCompleteMessage = CommandCompleteMessage;
    var DataRowMessage = class {
      constructor(length, fields) {
        this.length = length;
        this.fields = fields;
        this.name = "dataRow";
        this.fieldCount = fields.length;
      }
    };
    exports.DataRowMessage = DataRowMessage;
    var NoticeMessage = class {
      constructor(length, message) {
        this.length = length;
        this.message = message;
        this.name = "notice";
      }
    };
    exports.NoticeMessage = NoticeMessage;
  }
});

// node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS({
  "node_modules/pg-protocol/dist/buffer-writer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Writer = void 0;
    var Writer = class {
      constructor(size = 256) {
        this.size = size;
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(size);
      }
      ensure(size) {
        const remaining = this.buffer.length - this.offset;
        if (remaining < size) {
          const oldBuffer = this.buffer;
          const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
          this.buffer = Buffer.allocUnsafe(newSize);
          oldBuffer.copy(this.buffer, 0, 0, this.offset);
        }
      }
      addInt32(num) {
        this.ensure(4);
        this.buffer[this.offset++] = num >>> 24 & 255;
        this.buffer[this.offset++] = num >>> 16 & 255;
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addInt16(num) {
        this.ensure(2);
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addCString(string) {
        if (!string) {
          this.ensure(1);
        } else {
          const len = Buffer.byteLength(string);
          this.ensure(len + 1);
          this.buffer.write(string, this.offset, "utf-8");
          this.offset += len;
        }
        this.buffer[this.offset++] = 0;
        return this;
      }
      addString(string = "") {
        const len = Buffer.byteLength(string);
        this.ensure(len);
        this.buffer.write(string, this.offset);
        this.offset += len;
        return this;
      }
      // Write an Int32 byte-length prefix immediately followed by the string's UTF-8
      // bytes. Postgres' Bind wire format prefixes every parameter with its length,
      // and doing it in one method computes Buffer.byteLength ONCE — the previous
      // `addInt32(Buffer.byteLength(s)).addString(s)` pairing scanned the string
      // three times (byteLength for the prefix, byteLength again inside addString,
      // then the encode), which is costly for large text parameters.
      addInt32PrefixedString(string) {
        const len = Buffer.byteLength(string);
        this.ensure(4 + len);
        const buffer = this.buffer;
        let offset = this.offset;
        buffer[offset++] = len >>> 24 & 255;
        buffer[offset++] = len >>> 16 & 255;
        buffer[offset++] = len >>> 8 & 255;
        buffer[offset++] = len >>> 0 & 255;
        buffer.write(string, offset, "utf-8");
        this.offset = offset + len;
        return this;
      }
      add(otherBuffer) {
        this.ensure(otherBuffer.length);
        otherBuffer.copy(this.buffer, this.offset);
        this.offset += otherBuffer.length;
        return this;
      }
      /**
       * Appends an uninitialized block of {@link size} bytes to the buffer and returns its offset.
       */
      reserveUnsafe(size) {
        const offset = this.offset;
        this.ensure(size);
        this.offset += size;
        return offset;
      }
      join(code) {
        if (code) {
          this.buffer[this.headerPosition] = code;
          const length = this.offset - (this.headerPosition + 1);
          this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
      }
      flush(code) {
        const result = this.join(code);
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
        return result;
      }
      clear() {
        this.offset = 5;
        this.headerPosition = 0;
      }
    };
    exports.Writer = Writer;
  }
});

// node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS({
  "node_modules/pg-protocol/dist/serializer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serialize = void 0;
    var buffer_writer_1 = require_buffer_writer();
    var writer = new buffer_writer_1.Writer();
    var startup = (opts) => {
      writer.addInt16(3).addInt16(0);
      for (const key of Object.keys(opts)) {
        writer.addCString(key).addCString(opts[key]);
      }
      writer.addCString("client_encoding").addCString("UTF8");
      const bodyBuffer = writer.addCString("").flush();
      const length = bodyBuffer.length + 4;
      return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
    };
    var requestSsl = () => {
      const response = Buffer.allocUnsafe(8);
      response.writeInt32BE(8, 0);
      response.writeInt32BE(80877103, 4);
      return response;
    };
    var password = (password2) => {
      return writer.addCString(password2).flush(
        112
        /* code.startup */
      );
    };
    var sendSASLInitialResponseMessage = function(mechanism, initialResponse) {
      writer.addCString(mechanism).addInt32PrefixedString(initialResponse);
      return writer.flush(
        112
        /* code.startup */
      );
    };
    var sendSCRAMClientFinalMessage = function(additionalData) {
      return writer.addString(additionalData).flush(
        112
        /* code.startup */
      );
    };
    var query = (text) => {
      return writer.addCString(text).flush(
        81
        /* code.query */
      );
    };
    var emptyArray = [];
    var parse2 = (query2) => {
      const name = query2.name || "";
      if (name.length > 63) {
        console.error("Warning! Postgres only supports 63 characters for query names.");
        console.error("You supplied %s (%s)", name, name.length);
        console.error("This can cause conflicts and silent errors executing queries");
      }
      const types2 = query2.types || emptyArray;
      const len = types2.length;
      const buffer = writer.addCString(name).addCString(query2.text).addInt16(len);
      for (let i = 0; i < len; i++) {
        buffer.addInt32(types2[i]);
      }
      return writer.flush(
        80
        /* code.parse */
      );
    };
    var writeValues = function(values, valueMapper, formatsOffset) {
      const len = values.length;
      for (let i = 0; i < len; i++) {
        const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
        let formatByte = 0;
        if (mappedVal == null) {
          writer.addInt32(-1);
        } else if (mappedVal instanceof Buffer) {
          formatByte = 1;
          writer.addInt32(mappedVal.length);
          writer.add(mappedVal);
        } else {
          writer.addInt32PrefixedString(mappedVal);
        }
        const buf = writer.buffer;
        buf[formatsOffset++] = 0;
        buf[formatsOffset++] = formatByte;
      }
    };
    var bind = (config = {}) => {
      const portal = config.portal || "";
      const statement = config.statement || "";
      const binary = config.binary || false;
      const values = config.values || emptyArray;
      const len = values.length;
      writer.addCString(portal).addCString(statement);
      writer.addInt16(len);
      const formatsOffset = writer.reserveUnsafe(len * 2);
      writer.addInt16(len);
      try {
        writeValues(values, config.valueMapper, formatsOffset);
      } catch (err) {
        writer.clear();
        throw err;
      }
      writer.addInt16(1);
      writer.addInt16(
        binary ? 1 : 0
        /* ParamType.STRING */
      );
      return writer.flush(
        66
        /* code.bind */
      );
    };
    var emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
    var execute = (config) => {
      if (!config || !config.portal && !config.rows) {
        return emptyExecute;
      }
      const portal = config.portal || "";
      const rows = config.rows || 0;
      const portalLength = Buffer.byteLength(portal);
      const len = 4 + portalLength + 1 + 4;
      const buff = Buffer.allocUnsafe(1 + len);
      buff[0] = 69;
      buff.writeInt32BE(len, 1);
      buff.write(portal, 5, "utf-8");
      buff[portalLength + 5] = 0;
      buff.writeUInt32BE(rows, buff.length - 4);
      return buff;
    };
    var cancel = (processID, secretKey) => {
      const buffer = Buffer.allocUnsafe(16);
      buffer.writeInt32BE(16, 0);
      buffer.writeInt16BE(1234, 4);
      buffer.writeInt16BE(5678, 6);
      buffer.writeInt32BE(processID, 8);
      buffer.writeInt32BE(secretKey, 12);
      return buffer;
    };
    var cstringMessage = (code, string) => {
      const stringLen = Buffer.byteLength(string);
      const len = 4 + stringLen + 1;
      const buffer = Buffer.allocUnsafe(1 + len);
      buffer[0] = code;
      buffer.writeInt32BE(len, 1);
      buffer.write(string, 5, "utf-8");
      buffer[len] = 0;
      return buffer;
    };
    var emptyDescribePortal = writer.addCString("P").flush(
      68
      /* code.describe */
    );
    var emptyDescribeStatement = writer.addCString("S").flush(
      68
      /* code.describe */
    );
    var describe = (msg) => {
      return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
    };
    var close = (msg) => {
      const text = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text);
    };
    var copyData = (chunk) => {
      return writer.add(chunk).flush(
        100
        /* code.copyFromChunk */
      );
    };
    var copyFail = (message) => {
      return cstringMessage(102, message);
    };
    var codeOnlyBuffer = (code) => Buffer.from([code, 0, 0, 0, 4]);
    var flushBuffer = codeOnlyBuffer(
      72
      /* code.flush */
    );
    var syncBuffer = codeOnlyBuffer(
      83
      /* code.sync */
    );
    var endBuffer = codeOnlyBuffer(
      88
      /* code.end */
    );
    var copyDoneBuffer = codeOnlyBuffer(
      99
      /* code.copyDone */
    );
    var serialize2 = {
      startup,
      password,
      requestSsl,
      sendSASLInitialResponseMessage,
      sendSCRAMClientFinalMessage,
      query,
      parse: parse2,
      bind,
      execute,
      describe,
      close,
      flush: () => flushBuffer,
      sync: () => syncBuffer,
      end: () => endBuffer,
      copyData,
      copyDone: () => copyDoneBuffer,
      copyFail,
      cancel
    };
    exports.serialize = serialize2;
  }
});

// node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS({
  "node_modules/pg-protocol/dist/buffer-reader.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferReader = void 0;
    var BufferReader = class {
      constructor(offset = 0) {
        this.offset = offset;
        this.buffer = Buffer.allocUnsafe(0);
        this.encoding = "utf-8";
      }
      setBuffer(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer;
      }
      int16() {
        const result = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return result;
      }
      byte() {
        const result = this.buffer[this.offset];
        this.offset++;
        return result;
      }
      int32() {
        const result = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      uint32() {
        const result = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      string(length) {
        const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
      cstring() {
        const start = this.offset;
        let end = start;
        while (this.buffer[end++]) {
        }
        this.offset = end;
        return this.buffer.toString(this.encoding, start, end - 1);
      }
      bytes(length) {
        const result = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
    };
    exports.BufferReader = BufferReader;
  }
});

// node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS({
  "node_modules/pg-protocol/dist/parser.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = void 0;
    var messages_1 = require_messages();
    var buffer_reader_1 = require_buffer_reader();
    var CODE_LENGTH = 1;
    var LEN_LENGTH = 4;
    var HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
    var LATEINIT_LENGTH = -1;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var Parser = class {
      constructor(opts) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
        this.reader = new buffer_reader_1.BufferReader();
        if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") {
          throw new Error("Binary mode not supported yet");
        }
        this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
      }
      parse(buffer, callback) {
        this.mergeBuffer(buffer);
        const bufferFullLength = this.bufferOffset + this.bufferLength;
        let offset = this.bufferOffset;
        while (offset + HEADER_LENGTH <= bufferFullLength) {
          const code = this.buffer[offset];
          const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
          const fullMessageLength = CODE_LENGTH + length;
          if (fullMessageLength + offset <= bufferFullLength) {
            const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message);
            offset += fullMessageLength;
          } else {
            break;
          }
        }
        if (offset === bufferFullLength) {
          this.buffer = emptyBuffer;
          this.bufferLength = 0;
          this.bufferOffset = 0;
        } else {
          this.bufferLength = bufferFullLength - offset;
          this.bufferOffset = offset;
        }
      }
      mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
          const newLength = this.bufferLength + buffer.byteLength;
          const newFullLength = newLength + this.bufferOffset;
          if (newFullLength > this.buffer.byteLength) {
            let newBuffer;
            if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
              newBuffer = this.buffer;
            } else {
              let newBufferLength = this.buffer.byteLength * 2;
              while (newLength >= newBufferLength) {
                newBufferLength *= 2;
              }
              newBuffer = Buffer.allocUnsafe(newBufferLength);
            }
            this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
            this.buffer = newBuffer;
            this.bufferOffset = 0;
          }
          buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
          this.bufferLength = newLength;
        } else {
          this.buffer = buffer;
          this.bufferOffset = 0;
          this.bufferLength = buffer.byteLength;
        }
      }
      handlePacket(offset, code, length, bytes) {
        const { reader } = this;
        reader.setBuffer(offset, bytes);
        let message;
        switch (code) {
          case 50:
            message = messages_1.bindComplete;
            break;
          case 49:
            message = messages_1.parseComplete;
            break;
          case 51:
            message = messages_1.closeComplete;
            break;
          case 110:
            message = messages_1.noData;
            break;
          case 115:
            message = messages_1.portalSuspended;
            break;
          case 99:
            message = messages_1.copyDone;
            break;
          case 87:
            message = messages_1.replicationStart;
            break;
          case 73:
            message = messages_1.emptyQuery;
            break;
          case 68:
            message = parseDataRowMessage(reader);
            break;
          case 67:
            message = parseCommandCompleteMessage(reader);
            break;
          case 90:
            message = parseReadyForQueryMessage(reader);
            break;
          case 65:
            message = parseNotificationMessage(reader);
            break;
          case 82:
            message = parseAuthenticationResponse(reader, length);
            break;
          case 83:
            message = parseParameterStatusMessage(reader);
            break;
          case 75:
            message = parseBackendKeyData(reader);
            break;
          case 69:
            message = parseErrorMessage(reader, "error");
            break;
          case 78:
            message = parseErrorMessage(reader, "notice");
            break;
          case 84:
            message = parseRowDescriptionMessage(reader);
            break;
          case 116:
            message = parseParameterDescriptionMessage(reader);
            break;
          case 71:
            message = parseCopyInMessage(reader);
            break;
          case 72:
            message = parseCopyOutMessage(reader);
            break;
          case 100:
            message = parseCopyData(reader, length);
            break;
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
        reader.setBuffer(0, emptyBuffer);
        message.length = length;
        return message;
      }
    };
    exports.Parser = Parser;
    var parseReadyForQueryMessage = (reader) => {
      const status = reader.string(1);
      return new messages_1.ReadyForQueryMessage(LATEINIT_LENGTH, status);
    };
    var parseCommandCompleteMessage = (reader) => {
      const text = reader.cstring();
      return new messages_1.CommandCompleteMessage(LATEINIT_LENGTH, text);
    };
    var parseCopyData = (reader, length) => {
      const chunk = reader.bytes(length - 4);
      return new messages_1.CopyDataMessage(LATEINIT_LENGTH, chunk);
    };
    var parseCopyInMessage = (reader) => parseCopyMessage(reader, "copyInResponse");
    var parseCopyOutMessage = (reader) => parseCopyMessage(reader, "copyOutResponse");
    var parseCopyMessage = (reader, messageName) => {
      const isBinary = reader.byte() !== 0;
      const columnCount = reader.int16();
      const message = new messages_1.CopyResponse(LATEINIT_LENGTH, messageName, isBinary, columnCount);
      for (let i = 0; i < columnCount; i++) {
        message.columnTypes[i] = reader.int16();
      }
      return message;
    };
    var parseNotificationMessage = (reader) => {
      const processId = reader.int32();
      const channel = reader.cstring();
      const payload = reader.cstring();
      return new messages_1.NotificationResponseMessage(LATEINIT_LENGTH, processId, channel, payload);
    };
    var parseRowDescriptionMessage = (reader) => {
      const fieldCount = reader.int16();
      const message = new messages_1.RowDescriptionMessage(LATEINIT_LENGTH, fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        message.fields[i] = parseField(reader);
      }
      return message;
    };
    var parseField = (reader) => {
      const name = reader.cstring();
      const tableID = reader.uint32();
      const columnID = reader.int16();
      const dataTypeID = reader.uint32();
      const dataTypeSize = reader.int16();
      const dataTypeModifier = reader.int32();
      const mode = reader.int16() === 0 ? "text" : "binary";
      return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
    };
    var parseParameterDescriptionMessage = (reader) => {
      const parameterCount = reader.int16();
      const message = new messages_1.ParameterDescriptionMessage(LATEINIT_LENGTH, parameterCount);
      for (let i = 0; i < parameterCount; i++) {
        message.dataTypeIDs[i] = reader.uint32();
      }
      return message;
    };
    var parseDataRowMessage = (reader) => {
      const fieldCount = reader.int16();
      const fields = new Array(fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        const len = reader.int32();
        fields[i] = len === -1 ? null : reader.string(len);
      }
      return new messages_1.DataRowMessage(LATEINIT_LENGTH, fields);
    };
    var parseParameterStatusMessage = (reader) => {
      const name = reader.cstring();
      const value = reader.cstring();
      return new messages_1.ParameterStatusMessage(LATEINIT_LENGTH, name, value);
    };
    var parseBackendKeyData = (reader) => {
      const processID = reader.int32();
      const secretKey = reader.int32();
      return new messages_1.BackendKeyDataMessage(LATEINIT_LENGTH, processID, secretKey);
    };
    var parseAuthenticationResponse = (reader, length) => {
      const code = reader.int32();
      const message = {
        name: "authenticationOk",
        length
      };
      switch (code) {
        case 0:
          break;
        case 3:
          if (message.length === 8) {
            message.name = "authenticationCleartextPassword";
          }
          break;
        case 5:
          if (message.length === 12) {
            message.name = "authenticationMD5Password";
            const salt = reader.bytes(4);
            return new messages_1.AuthenticationMD5Password(LATEINIT_LENGTH, salt);
          }
          break;
        case 10:
          {
            message.name = "authenticationSASL";
            message.mechanisms = [];
            let mechanism;
            do {
              mechanism = reader.cstring();
              if (mechanism) {
                message.mechanisms.push(mechanism);
              }
            } while (mechanism);
          }
          break;
        case 11:
          message.name = "authenticationSASLContinue";
          message.data = reader.string(length - 8);
          break;
        case 12:
          message.name = "authenticationSASLFinal";
          message.data = reader.string(length - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + code);
      }
      return message;
    };
    var parseErrorMessage = (reader, name) => {
      const fields = {};
      let fieldType = reader.string(1);
      while (fieldType !== "\0") {
        fields[fieldType] = reader.cstring();
        fieldType = reader.string(1);
      }
      const messageValue = fields.M;
      const message = name === "notice" ? new messages_1.NoticeMessage(LATEINIT_LENGTH, messageValue) : new messages_1.DatabaseError(messageValue, LATEINIT_LENGTH, name);
      message.severity = fields.S;
      message.code = fields.C;
      message.detail = fields.D;
      message.hint = fields.H;
      message.position = fields.P;
      message.internalPosition = fields.p;
      message.internalQuery = fields.q;
      message.where = fields.W;
      message.schema = fields.s;
      message.table = fields.t;
      message.column = fields.c;
      message.dataType = fields.d;
      message.constraint = fields.n;
      message.file = fields.F;
      message.line = fields.L;
      message.routine = fields.R;
      return message;
    };
  }
});

// node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS({
  "node_modules/pg-protocol/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DatabaseError = exports.serialize = void 0;
    exports.parse = parse2;
    var messages_1 = require_messages();
    Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: function() {
      return messages_1.DatabaseError;
    } });
    var serializer_1 = require_serializer();
    Object.defineProperty(exports, "serialize", { enumerable: true, get: function() {
      return serializer_1.serialize;
    } });
    var parser_1 = require_parser();
    function parse2(stream, callback) {
      const parser = new parser_1.Parser();
      stream.on("data", (buffer) => parser.parse(buffer, callback));
      return new Promise((resolve) => stream.on("end", () => resolve()));
    }
  }
});

// node_modules/pg-cloudflare/dist/empty.js
var require_empty = __commonJS({
  "node_modules/pg-cloudflare/dist/empty.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {};
  }
});

// node_modules/pg/lib/stream.js
var require_stream = __commonJS({
  "node_modules/pg/lib/stream.js"(exports, module) {
    var { getStream, getSecureStream } = getStreamFuncs();
    module.exports = {
      /**
       * Get a socket stream compatible with the current runtime environment.
       * @returns {Duplex}
       */
      getStream,
      /**
       * Get a TLS secured socket, compatible with the current environment,
       * using the socket and other settings given in `options`.
       * @returns {Duplex}
       */
      getSecureStream
    };
    function getNodejsStreamFuncs() {
      function getStream2(ssl) {
        const net = __require("net");
        return new net.Socket();
      }
      function getSecureStream2(options) {
        const tls = __require("tls");
        return tls.connect(options);
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function getCloudflareStreamFuncs() {
      function getStream2(ssl) {
        const { CloudflareSocket } = require_empty();
        return new CloudflareSocket(ssl);
      }
      function getSecureStream2(options) {
        options.socket.startTls(options);
        return options.socket;
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function isCloudflareRuntime() {
      if (typeof navigator === "object" && navigator !== null && typeof navigator.userAgent === "string") {
        return navigator.userAgent === "Cloudflare-Workers";
      }
      if (typeof Response === "function") {
        const resp = new Response(null, { cf: { thing: true } });
        if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) {
          return true;
        }
      }
      return false;
    }
    function getStreamFuncs() {
      if (isCloudflareRuntime()) {
        return getCloudflareStreamFuncs();
      }
      return getNodejsStreamFuncs();
    }
  }
});

// node_modules/pg/lib/connection.js
var require_connection = __commonJS({
  "node_modules/pg/lib/connection.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var { parse: parse2, serialize: serialize2 } = require_dist();
    var stream = require_stream();
    var { getStream } = stream;
    var flushBuffer = serialize2.flush();
    var syncBuffer = serialize2.sync();
    var endBuffer = serialize2.end();
    var Connection2 = class extends EventEmitter {
      constructor(config) {
        super();
        config = config || {};
        this.stream = config.stream || getStream(config.ssl);
        if (typeof this.stream === "function") {
          this.stream = this.stream(config);
        }
        this._keepAlive = config.keepAlive;
        this._keepAliveInitialDelayMillis = config.keepAliveInitialDelayMillis;
        this.parsedStatements = {};
        this.submittedNamedStatements = {};
        this.ssl = config.ssl || false;
        this.sslNegotiation = config.sslNegotiation || "postgres";
        this._ending = false;
        this._emitMessage = false;
        const self = this;
        this.on("newListener", function(eventName) {
          if (eventName === "message") {
            self._emitMessage = true;
          }
        });
      }
      connect(port, host) {
        const self = this;
        this._connecting = true;
        this.stream.setNoDelay(true);
        this.stream.connect(port, host);
        this.stream.once("connect", function() {
          if (self._keepAlive) {
            self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
          }
          self.emit("connect");
        });
        const reportStreamError = function(error) {
          if (self._ending && (error.code === "ECONNRESET" || error.code === "EPIPE")) {
            return;
          }
          self.emit("error", error);
        };
        this.stream.on("error", reportStreamError);
        this.stream.on("close", function() {
          self.emit("end");
        });
        if (!this.ssl) {
          return this.attachListeners(this.stream);
        }
        if (this.sslNegotiation === "direct") {
          return this.stream.once("connect", function() {
            self.upgradeToSSL(host, reportStreamError);
          });
        }
        this.stream.once("data", function(buffer) {
          const responseCode = buffer.toString("utf8");
          switch (responseCode) {
            case "S":
              break;
            case "N":
              self.stream.end();
              return self.emit("error", new Error("The server does not support SSL connections"));
            default:
              self.stream.end();
              return self.emit("error", new Error("There was an error establishing an SSL connection"));
          }
          self.upgradeToSSL(host, reportStreamError);
        });
      }
      upgradeToSSL(host, reportStreamError) {
        const self = this;
        const options = {
          socket: self.stream,
          // tls.connect checks the server identity against `servername`, falling
          // back to `host` and then to 'localhost'. `servername` must stay unset
          // for IP addresses (see below), so `host` is needed to keep certificate
          // validation working when connecting to an IP address.
          host
        };
        if (self.ssl !== true) {
          Object.assign(options, self.ssl);
          if ("key" in self.ssl) {
            options.key = self.ssl.key;
          }
        }
        if (self.sslNegotiation === "direct") {
          options.ALPNProtocols = ["postgresql"];
        }
        const net = __require("net");
        if (net.isIP && net.isIP(host) === 0) {
          options.servername = host;
        }
        try {
          self.stream = stream.getSecureStream(options);
        } catch (err) {
          return self.emit("error", err);
        }
        self.attachListeners(self.stream);
        self.stream.on("error", reportStreamError);
        self.emit("sslconnect");
      }
      attachListeners(stream2) {
        parse2(stream2, (msg) => {
          const eventName = msg.name === "error" ? "errorMessage" : msg.name;
          if (this._emitMessage) {
            this.emit("message", msg);
          }
          this.emit(eventName, msg);
        });
      }
      requestSsl() {
        this.stream.write(serialize2.requestSsl());
      }
      startup(config) {
        this.stream.write(serialize2.startup(config));
      }
      cancel(processID, secretKey) {
        this._send(serialize2.cancel(processID, secretKey));
      }
      password(password) {
        this._send(serialize2.password(password));
      }
      sendSASLInitialResponseMessage(mechanism, initialResponse) {
        this._send(serialize2.sendSASLInitialResponseMessage(mechanism, initialResponse));
      }
      sendSCRAMClientFinalMessage(additionalData) {
        this._send(serialize2.sendSCRAMClientFinalMessage(additionalData));
      }
      _send(buffer) {
        if (!this.stream.writable) {
          return false;
        }
        return this.stream.write(buffer);
      }
      query(text) {
        this._send(serialize2.query(text));
      }
      // send parse message
      parse(query) {
        this._send(serialize2.parse(query));
      }
      // send bind message
      bind(config) {
        this._send(serialize2.bind(config));
      }
      // send execute message
      execute(config) {
        this._send(serialize2.execute(config));
      }
      flush() {
        if (this.stream.writable) {
          this.stream.write(flushBuffer);
        }
      }
      sync() {
        this._send(syncBuffer);
      }
      ref() {
        this.stream.ref();
      }
      unref() {
        this.stream.unref();
      }
      end() {
        this._ending = true;
        if (!this._connecting || !this.stream.writable) {
          this.stream.end();
          return;
        }
        return this.stream.write(endBuffer, () => {
          this.stream.end();
        });
      }
      close(msg) {
        this._send(serialize2.close(msg));
      }
      describe(msg) {
        this._send(serialize2.describe(msg));
      }
      sendCopyFromChunk(chunk) {
        this._send(serialize2.copyData(chunk));
      }
      endCopyFrom() {
        this._send(serialize2.copyDone());
      }
      sendCopyFail(msg) {
        this._send(serialize2.copyFail(msg));
      }
    };
    module.exports = Connection2;
  }
});

// node_modules/split2/index.js
var require_split2 = __commonJS({
  "node_modules/split2/index.js"(exports, module) {
    "use strict";
    var { Transform } = __require("stream");
    var { StringDecoder } = __require("string_decoder");
    var kLast = /* @__PURE__ */ Symbol("last");
    var kDecoder = /* @__PURE__ */ Symbol("decoder");
    function transform(chunk, enc2, cb) {
      let list;
      if (this.overflow) {
        const buf = this[kDecoder].write(chunk);
        list = buf.split(this.matcher);
        if (list.length === 1) return cb();
        list.shift();
        this.overflow = false;
      } else {
        this[kLast] += this[kDecoder].write(chunk);
        list = this[kLast].split(this.matcher);
      }
      this[kLast] = list.pop();
      for (let i = 0; i < list.length; i++) {
        try {
          push(this, this.mapper(list[i]));
        } catch (error) {
          return cb(error);
        }
      }
      this.overflow = this[kLast].length > this.maxLength;
      if (this.overflow && !this.skipOverflow) {
        cb(new Error("maximum buffer reached"));
        return;
      }
      cb();
    }
    function flush(cb) {
      this[kLast] += this[kDecoder].end();
      if (this[kLast]) {
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error) {
          return cb(error);
        }
      }
      cb();
    }
    function push(self, val) {
      if (val !== void 0) {
        self.push(val);
      }
    }
    function noop(incoming) {
      return incoming;
    }
    function split(matcher, mapper, options) {
      matcher = matcher || /\r?\n/;
      mapper = mapper || noop;
      options = options || {};
      switch (arguments.length) {
        case 1:
          if (typeof matcher === "function") {
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
            options = matcher;
            matcher = /\r?\n/;
          }
          break;
        case 2:
          if (typeof matcher === "function") {
            options = mapper;
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof mapper === "object") {
            options = mapper;
            mapper = noop;
          }
      }
      options = Object.assign({}, options);
      options.autoDestroy = true;
      options.transform = transform;
      options.flush = flush;
      options.readableObjectMode = true;
      const stream = new Transform(options);
      stream[kLast] = "";
      stream[kDecoder] = new StringDecoder("utf8");
      stream.matcher = matcher;
      stream.mapper = mapper;
      stream.maxLength = options.maxLength;
      stream.skipOverflow = options.skipOverflow || false;
      stream.overflow = false;
      stream._destroy = function(err, cb) {
        this._writableState.errorEmitted = false;
        cb(err);
      };
      return stream;
    }
    module.exports = split;
  }
});

// node_modules/pgpass/lib/helper.js
var require_helper = __commonJS({
  "node_modules/pgpass/lib/helper.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var Stream = __require("stream").Stream;
    var split = require_split2();
    var util = __require("util");
    var defaultPort = 5432;
    var isWin = process.platform === "win32";
    var warnStream = process.stderr;
    var S_IRWXG = 56;
    var S_IRWXO = 7;
    var S_IFMT = 61440;
    var S_IFREG = 32768;
    function isRegFile(mode) {
      return (mode & S_IFMT) == S_IFREG;
    }
    var fieldNames = ["host", "port", "database", "user", "password"];
    var nrOfFields = fieldNames.length;
    var passKey = fieldNames[nrOfFields - 1];
    function warn() {
      var isWritable = warnStream instanceof Stream && true === warnStream.writable;
      if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat("\n");
        warnStream.write(util.format.apply(util, args));
      }
    }
    Object.defineProperty(module.exports, "isWin", {
      get: function() {
        return isWin;
      },
      set: function(val) {
        isWin = val;
      }
    });
    module.exports.warnTo = function(stream) {
      var old = warnStream;
      warnStream = stream;
      return old;
    };
    module.exports.getFileName = function(rawEnv) {
      var env = rawEnv || process.env;
      var file = env.PGPASSFILE || (isWin ? path.join(env.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env.HOME || "./", ".pgpass"));
      return file;
    };
    module.exports.usePgPass = function(stats, fname) {
      if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) {
        return false;
      }
      if (isWin) {
        return true;
      }
      fname = fname || "<unkn>";
      if (!isRegFile(stats.mode)) {
        warn('WARNING: password file "%s" is not a plain file', fname);
        return false;
      }
      if (stats.mode & (S_IRWXG | S_IRWXO)) {
        warn('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
        return false;
      }
      return true;
    };
    var matcher = module.exports.match = function(connInfo, entry) {
      return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
        if (idx == 1) {
          if (Number(connInfo[field] || defaultPort) === Number(entry[field])) {
            return prev && true;
          }
        }
        return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
      }, true);
    };
    module.exports.getPassword = function(connInfo, stream, cb) {
      var pass;
      var lineStream = stream.pipe(split());
      function onLine(line) {
        var entry = parseLine(line);
        if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
          pass = entry[passKey];
          lineStream.end();
        }
      }
      var onEnd = function() {
        stream.destroy();
        cb(pass);
      };
      var onErr = function(err) {
        stream.destroy();
        warn("WARNING: error on reading file: %s", err);
        cb(void 0);
      };
      stream.on("error", onErr);
      lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
    };
    var parseLine = module.exports.parseLine = function(line) {
      if (line.length < 11 || line.match(/^\s+#/)) {
        return null;
      }
      var curChar = "";
      var prevChar = "";
      var fieldIdx = 0;
      var startIdx = 0;
      var endIdx = 0;
      var obj = {};
      var isLastField = false;
      var addToObj = function(idx, i0, i1) {
        var field = line.substring(i0, i1);
        if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) {
          field = field.replace(/\\([:\\])/g, "$1");
        }
        obj[fieldNames[idx]] = field;
      };
      for (var i = 0; i < line.length - 1; i += 1) {
        curChar = line.charAt(i + 1);
        prevChar = line.charAt(i);
        isLastField = fieldIdx == nrOfFields - 1;
        if (isLastField) {
          addToObj(fieldIdx, startIdx);
          break;
        }
        if (i >= 0 && curChar == ":" && prevChar !== "\\") {
          addToObj(fieldIdx, startIdx, i + 1);
          startIdx = i + 2;
          fieldIdx += 1;
        }
      }
      obj = Object.keys(obj).length === nrOfFields ? obj : null;
      return obj;
    };
    var isValidEntry = module.exports.isValidEntry = function(entry) {
      var rules = {
        // host
        0: function(x) {
          return x.length > 0;
        },
        // port
        1: function(x) {
          if (x === "*") {
            return true;
          }
          x = Number(x);
          return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
        },
        // database
        2: function(x) {
          return x.length > 0;
        },
        // username
        3: function(x) {
          return x.length > 0;
        },
        // password
        4: function(x) {
          return x.length > 0;
        }
      };
      for (var idx = 0; idx < fieldNames.length; idx += 1) {
        var rule = rules[idx];
        var value = entry[fieldNames[idx]] || "";
        var res = rule(value);
        if (!res) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/pgpass/lib/index.js
var require_lib = __commonJS({
  "node_modules/pgpass/lib/index.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var fs = __require("fs");
    var helper = require_helper();
    module.exports = function(connInfo, cb) {
      var file = helper.getFileName();
      fs.stat(file, function(err, stat) {
        if (err || !helper.usePgPass(stat, file)) {
          return cb(void 0);
        }
        var st = fs.createReadStream(file);
        helper.getPassword(connInfo, st, cb);
      });
    };
    module.exports.warnTo = helper.warnTo;
  }
});

// node_modules/pg/lib/client.js
var require_client = __commonJS({
  "node_modules/pg/lib/client.js"(exports, module) {
    var EventEmitter = __require("events").EventEmitter;
    var utils = require_utils();
    var nodeUtils = __require("util");
    var sasl = require_sasl();
    var TypeOverrides2 = require_type_overrides();
    var ConnectionParameters = require_connection_parameters();
    var Query2 = require_query();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var crypto2 = require_utils2();
    var activeQueryDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Client.activeQuery is deprecated and will be removed in pg@9.0"
    );
    var queryQueueDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Client.queryQueue is deprecated and will be removed in pg@9.0."
    );
    var pgPassDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "pgpass support is deprecated and will be removed in pg@9.0. You can provide an async function as the password property to the Client/Pool constructor that returns a password instead. Within this function you can call the pgpass module in your own code."
    );
    var byoPromiseDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Passing a custom Promise implementation to the Client/Pool constructor is deprecated and will be removed in pg@9.0."
    );
    var queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead."
    );
    function coerceNumberOrDefault(value, defaultValue) {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : defaultValue;
      }
      if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value);
        return Number.isFinite(n) ? n : defaultValue;
      }
      return defaultValue;
    }
    var Client2 = class extends EventEmitter {
      constructor(config) {
        super();
        this.connectionParameters = new ConnectionParameters(config);
        this.user = this.connectionParameters.user;
        this.database = this.connectionParameters.database;
        this.port = this.connectionParameters.port;
        this.host = this.connectionParameters.host;
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: this.connectionParameters.password
        });
        this.replication = this.connectionParameters.replication;
        const c = config || {};
        if (c.Promise) {
          byoPromiseDeprecationNotice();
        }
        this._Promise = c.Promise || global.Promise;
        this._types = new TypeOverrides2(c.types);
        this._ending = false;
        this._ended = false;
        this._connecting = false;
        this._connected = false;
        this._connectionError = false;
        this._queryable = true;
        this._activeQuery = null;
        this._txStatus = null;
        this.enableChannelBinding = Boolean(c.enableChannelBinding);
        this.scramMaxIterations = coerceNumberOrDefault(c.scramMaxIterations, sasl.DEFAULT_MAX_SCRAM_ITERATIONS);
        this.connection = c.connection || new Connection2({
          stream: c.stream,
          ssl: this.connectionParameters.ssl,
          sslNegotiation: this.connectionParameters.sslnegotiation,
          keepAlive: c.keepAlive || false,
          keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
          encoding: this.connectionParameters.client_encoding || "utf8"
        });
        this._queryQueue = [];
        this._sentQueryQueue = [];
        this.pipeline = Boolean(c.pipeline);
        this.binary = c.binary || defaults2.binary;
        this.processID = null;
        this.secretKey = null;
        this.ssl = this.connectionParameters.ssl || false;
        this.sslNegotiation = this.connectionParameters.sslnegotiation || "postgres";
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
      }
      get activeQuery() {
        activeQueryDeprecationNotice();
        return this._activeQuery;
      }
      set activeQuery(val) {
        activeQueryDeprecationNotice();
        this._activeQuery = val;
      }
      _getActiveQuery() {
        return this._activeQuery;
      }
      _errorAllQueries(err) {
        const enqueueError = (query) => {
          process.nextTick(() => {
            query.handleError(err, this.connection);
          });
        };
        const activeQuery = this._getActiveQuery();
        if (activeQuery) {
          enqueueError(activeQuery);
          this._activeQuery = null;
        }
        this._sentQueryQueue.forEach(enqueueError);
        this._sentQueryQueue.length = 0;
        this._queryQueue.forEach(enqueueError);
        this._queryQueue.length = 0;
      }
      _connect(callback) {
        const self = this;
        const con = this.connection;
        this._connectionCallback = callback;
        if (this._connecting || this._connected) {
          const err = new Error("Client has already been connected. You cannot reuse a client.");
          process.nextTick(() => {
            callback(err);
          });
          return;
        }
        this._connecting = true;
        if (this._connectionTimeoutMillis > 0) {
          this.connectionTimeoutHandle = setTimeout(() => {
            con._ending = true;
            con.stream.destroy(new Error("timeout expired"));
          }, this._connectionTimeoutMillis);
          if (this.connectionTimeoutHandle.unref) {
            this.connectionTimeoutHandle.unref();
          }
        }
        if (this.host && this.host.indexOf("/") === 0) {
          con.connect(this.host + "/.s.PGSQL." + this.port);
        } else {
          con.connect(this.port, this.host);
        }
        con.on("connect", function() {
          if (self.ssl) {
            if (self.sslNegotiation !== "direct") {
              con.requestSsl();
            }
          } else {
            con.startup(self.getStartupConf());
          }
        });
        con.on("sslconnect", function() {
          con.startup(self.getStartupConf());
        });
        this._attachListeners(con);
        con.once("end", () => {
          const error = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle);
          this._errorAllQueries(error);
          this._ended = true;
          if (!this._ending) {
            if (this._connecting && !this._connectionError) {
              if (this._connectionCallback) {
                this._connectionCallback(error);
              } else {
                this._handleErrorEvent(error);
              }
            } else if (!this._connectionError) {
              this._handleErrorEvent(error);
            }
          }
          process.nextTick(() => {
            this.emit("end");
          });
        });
      }
      connect(callback) {
        if (callback) {
          this._connect(callback);
          return;
        }
        return new this._Promise((resolve, reject) => {
          this._connect((error) => {
            if (error) {
              reject(error);
            } else {
              resolve(this);
            }
          });
        });
      }
      _attachListeners(con) {
        con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
        con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
        con.on("authenticationSASL", this._handleAuthSASL.bind(this));
        con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
        con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
        con.on("backendKeyData", this._handleBackendKeyData.bind(this));
        con.on("error", this._handleErrorEvent.bind(this));
        con.on("errorMessage", this._handleErrorMessage.bind(this));
        con.on("readyForQuery", this._handleReadyForQuery.bind(this));
        con.on("notice", this._handleNotice.bind(this));
        con.on("rowDescription", this._handleRowDescription.bind(this));
        con.on("dataRow", this._handleDataRow.bind(this));
        con.on("portalSuspended", this._handlePortalSuspended.bind(this));
        con.on("emptyQuery", this._handleEmptyQuery.bind(this));
        con.on("commandComplete", this._handleCommandComplete.bind(this));
        con.on("parseComplete", this._handleParseComplete.bind(this));
        con.on("copyInResponse", this._handleCopyInResponse.bind(this));
        con.on("copyData", this._handleCopyData.bind(this));
        con.on("notification", this._handleNotification.bind(this));
      }
      _getPassword(cb) {
        const con = this.connection;
        if (typeof this.password === "function") {
          this._Promise.resolve().then(() => this.password(this.connectionParameters)).then((pass) => {
            if (pass !== void 0) {
              if (typeof pass !== "string") {
                con.emit("error", new TypeError("Password must be a string"));
                return;
              }
              this.connectionParameters.password = this.password = pass;
            } else {
              this.connectionParameters.password = this.password = null;
            }
            cb();
          }).catch((err) => {
            con.emit("error", err);
          });
        } else if (this.password !== null) {
          cb();
        } else {
          try {
            const pgPass = require_lib();
            pgPass(this.connectionParameters, (pass) => {
              if (void 0 !== pass) {
                pgPassDeprecationNotice();
                this.connectionParameters.password = this.password = pass;
              }
              cb();
            });
          } catch (e) {
            this.emit("error", e);
          }
        }
      }
      _handleAuthCleartextPassword(msg) {
        this._getPassword(() => {
          this.connection.password(this.password);
        });
      }
      _handleAuthMD5Password(msg) {
        this._getPassword(async () => {
          try {
            const hashedPassword = await crypto2.postgresMd5PasswordHash(this.user, this.password, msg.salt);
            this.connection.password(hashedPassword);
          } catch (e) {
            this.emit("error", e);
          }
        });
      }
      _handleAuthSASL(msg) {
        this._getPassword(() => {
          try {
            this.saslSession = sasl.startSession(
              msg.mechanisms,
              this.enableChannelBinding && this.connection.stream,
              this.scramMaxIterations
            );
            this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
          } catch (err) {
            this.connection.emit("error", err);
          }
        });
      }
      async _handleAuthSASLContinue(msg) {
        try {
          await sasl.continueSession(
            this.saslSession,
            this.password,
            msg.data,
            this.enableChannelBinding && this.connection.stream
          );
          this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleAuthSASLFinal(msg) {
        try {
          sasl.finalizeSession(this.saslSession, msg.data);
          this.saslSession = null;
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleBackendKeyData(msg) {
        this.processID = msg.processID;
        this.secretKey = msg.secretKey;
      }
      _handleReadyForQuery(msg) {
        if (this._connecting) {
          this._connecting = false;
          this._connected = true;
          clearTimeout(this.connectionTimeoutHandle);
          if (this._connectionCallback) {
            this._connectionCallback(null, this);
            this._connectionCallback = null;
          }
          this.emit("connect");
        }
        const activeQuery = this._getActiveQuery();
        this._activeQuery = null;
        this._txStatus = msg?.status ?? null;
        this.readyForQuery = true;
        if (activeQuery) {
          activeQuery.handleReadyForQuery(this.connection);
        }
        this._pulseQueryQueue();
      }
      // if we receive an error event or error message
      // during the connection process we handle it here
      _handleErrorWhileConnecting(err) {
        if (this._connectionError) {
          return;
        }
        this._connectionError = true;
        clearTimeout(this.connectionTimeoutHandle);
        if (this._connectionCallback) {
          return this._connectionCallback(err);
        }
        this.emit("error", err);
      }
      // if we're connected and we receive an error event from the connection
      // this means the socket is dead - do a hard abort of all queries and emit
      // the socket error on the client as well
      _handleErrorEvent(err) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(err);
        }
        this._queryable = false;
        this._errorAllQueries(err);
        this.emit("error", err);
      }
      // handle error messages from the postgres backend
      _handleErrorMessage(msg) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(msg);
        }
        const activeQuery = this._getActiveQuery();
        if (!activeQuery) {
          this._handleErrorEvent(msg);
          return;
        }
        this._activeQuery = null;
        if (activeQuery.name) {
          delete this.connection.submittedNamedStatements[activeQuery.name];
        }
        activeQuery.handleError(msg, this.connection);
      }
      _handleRowDescription(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected rowDescription message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleRowDescription(msg);
      }
      _handleDataRow(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected dataRow message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleDataRow(msg);
      }
      _handlePortalSuspended(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected portalSuspended message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handlePortalSuspended(this.connection);
      }
      _handleEmptyQuery(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected emptyQuery message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleEmptyQuery(this.connection);
      }
      _handleCommandComplete(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected commandComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete() {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected parseComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        if (activeQuery.name) {
          this.connection.parsedStatements[activeQuery.name] = activeQuery.text;
          delete this.connection.submittedNamedStatements[activeQuery.name];
        }
      }
      _handleCopyInResponse(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected copyInResponse message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCopyInResponse(this.connection);
      }
      _handleCopyData(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected copyData message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCopyData(msg, this.connection);
      }
      _handleNotification(msg) {
        this.emit("notification", msg);
      }
      _handleNotice(msg) {
        this.emit("notice", msg);
      }
      getStartupConf() {
        const params = this.connectionParameters;
        const data = {
          user: params.user,
          database: params.database
        };
        const appName = params.application_name || params.fallback_application_name;
        if (appName) {
          data.application_name = appName;
        }
        if (params.replication) {
          data.replication = "" + params.replication;
        }
        if (params.statement_timeout) {
          data.statement_timeout = String(parseInt(params.statement_timeout, 10));
        }
        if (params.lock_timeout) {
          data.lock_timeout = String(parseInt(params.lock_timeout, 10));
        }
        if (params.idle_in_transaction_session_timeout) {
          data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
        }
        if (params.options) {
          data.options = params.options;
        }
        return data;
      }
      cancel(client, query) {
        if (client.activeQuery === query) {
          const con = this.connection;
          if (this.host && this.host.indexOf("/") === 0) {
            con.connect(this.host + "/.s.PGSQL." + this.port);
          } else {
            con.connect(this.port, this.host);
          }
          con.on("connect", function() {
            con.cancel(client.processID, client.secretKey);
          });
        } else if (client._queryQueue.indexOf(query) !== -1) {
          client._queryQueue.splice(client._queryQueue.indexOf(query), 1);
        } else if (client._sentQueryQueue.indexOf(query) !== -1) {
          query.callback = () => {
          };
        }
      }
      setTypeParser(oid, format, parseFn) {
        return this._types.setTypeParser(oid, format, parseFn);
      }
      getTypeParser(oid, format) {
        return this._types.getTypeParser(oid, format);
      }
      // escapeIdentifier and escapeLiteral moved to utility functions & exported
      // on PG
      // re-exported here for backwards compatibility
      escapeIdentifier(str) {
        return utils.escapeIdentifier(str);
      }
      escapeLiteral(str) {
        return utils.escapeLiteral(str);
      }
      _pulseQueryQueue() {
        if (this.pipeline) {
          this._pulsePipelinedQueryQueue();
          return;
        }
        if (this.readyForQuery === true) {
          this._activeQuery = this._queryQueue.shift();
          const activeQuery = this._getActiveQuery();
          if (activeQuery) {
            this.readyForQuery = false;
            this.hasExecuted = true;
            const queryError = activeQuery.submit(this.connection);
            if (queryError) {
              process.nextTick(() => {
                activeQuery.handleError(queryError, this.connection);
                this.readyForQuery = true;
                this._pulseQueryQueue();
              });
            }
          } else if (this.hasExecuted) {
            this._activeQuery = null;
            this.emit("drain");
          }
        }
      }
      _pulsePipelinedQueryQueue() {
        if (!this._connected || !this._queryable) {
          return;
        }
        while (this._queryQueue.length > 0) {
          const query = this._queryQueue.shift();
          this.hasExecuted = true;
          const queryError = query.submit(this.connection);
          if (queryError) {
            process.nextTick(() => {
              query.handleError(queryError, this.connection);
            });
            continue;
          }
          this._sentQueryQueue.push(query);
        }
        if (this.readyForQuery && !this._activeQuery && this._sentQueryQueue.length > 0) {
          this._activeQuery = this._sentQueryQueue.shift();
          this.readyForQuery = false;
        }
        if (!this._activeQuery && this._sentQueryQueue.length === 0 && this._queryQueue.length === 0 && this.hasExecuted) {
          this.emit("drain");
        }
      }
      query(config, values, callback) {
        let query;
        let result;
        if (config == null) {
          throw new TypeError("Client was passed a null or undefined query");
        }
        if (typeof config.submit === "function") {
          result = query = config;
          if (!query.callback) {
            if (typeof values === "function") {
              query.callback = values;
            } else if (callback) {
              query.callback = callback;
            }
          }
        } else {
          query = new Query2(config, values, callback);
          if (!query.callback) {
            result = new this._Promise((resolve, reject) => {
              query.callback = (err, res) => err ? reject(err) : resolve(res);
            }).catch((err) => {
              Error.captureStackTrace(err);
              throw err;
            });
          } else if (typeof query.callback !== "function") {
            throw new TypeError("callback is not a function");
          }
        }
        const readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        if (readTimeout) {
          const queryCallback = query.callback || (() => {
          });
          const readTimeoutTimer = setTimeout(() => {
            const error = new Error("Query read timeout");
            process.nextTick(() => {
              query.handleError(error, this.connection);
            });
            queryCallback(error);
            query.callback = () => {
            };
            const index = this._queryQueue.indexOf(query);
            if (index > -1) {
              this._queryQueue.splice(index, 1);
            } else if (this.pipeline) {
              this.connection.stream.destroy();
              return;
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query.callback = (err, res) => {
            clearTimeout(readTimeoutTimer);
            queryCallback(err, res);
          };
        }
        if (this.binary && !query.binary) {
          query.binary = true;
        }
        if (query._result && !query._result._types) {
          query._result._types = this._types;
        }
        if (this.pipeline) {
          const portalQuery = typeof config.submit === "function" && !(query instanceof Query2) ? "Custom query classes such as pg-cursor and pg-query-stream are" : query.rows ? "The `rows` option is" : null;
          if (portalQuery) {
            process.nextTick(() => {
              query.handleError(new Error(`${portalQuery} not supported in pipeline mode`), this.connection);
            });
            return result;
          }
        }
        if (!this._queryable) {
          process.nextTick(() => {
            query.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._ending) {
          process.nextTick(() => {
            query.handleError(new Error("Client was closed and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._queryQueue.length > 0 && !this.pipeline) {
          queryQueueLengthDeprecationNotice();
        }
        this._queryQueue.push(query);
        this._pulseQueryQueue();
        return result;
      }
      ref() {
        this.connection.ref();
      }
      unref() {
        this.connection.unref();
      }
      getTransactionStatus() {
        return this._txStatus;
      }
      end(cb) {
        this._ending = true;
        if (!this.connection._connecting || this._ended) {
          if (cb) {
            cb();
            return;
          } else {
            return this._Promise.resolve();
          }
        }
        if (!this._queryable) {
          this.connection.stream.destroy();
        } else if (this.pipeline && (this._getActiveQuery() || this._sentQueryQueue.length > 0 || this._queryQueue.length > 0)) {
          this.once("drain", () => this.connection.end());
        } else if (this._getActiveQuery()) {
          this.connection.stream.destroy();
        } else {
          this.connection.end();
        }
        if (cb) {
          this.connection.once("end", cb);
        } else {
          return new this._Promise((resolve) => {
            this.connection.once("end", resolve);
          });
        }
      }
      get queryQueue() {
        queryQueueDeprecationNotice();
        return this._queryQueue;
      }
    };
    Client2.Query = Query2;
    module.exports = Client2;
  }
});

// node_modules/pg-pool/index.js
var require_pg_pool = __commonJS({
  "node_modules/pg-pool/index.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var NOOP = function() {
    };
    var removeWhere = (list, predicate) => {
      const i = list.findIndex(predicate);
      return i === -1 ? void 0 : list.splice(i, 1)[0];
    };
    var IdleItem = class {
      constructor(client, idleListener, timeoutId) {
        this.client = client;
        this.idleListener = idleListener;
        this.timeoutId = timeoutId;
      }
    };
    var PendingItem = class {
      constructor(callback) {
        this.callback = callback;
      }
    };
    function throwOnDoubleRelease() {
      throw new Error("Release called on client which has already been released to the pool.");
    }
    function promisify(Promise2, callback) {
      if (callback) {
        return { callback, result: void 0 };
      }
      let rej;
      let res;
      const cb = function(err, client) {
        err ? rej(err) : res(client);
      };
      const result = new Promise2(function(resolve, reject) {
        res = resolve;
        rej = reject;
      }).catch((err) => {
        Error.captureStackTrace(err);
        throw err;
      });
      return { callback: cb, result };
    }
    function makeIdleListener(pool2, client) {
      return function idleListener(err) {
        err.client = client;
        client.removeListener("error", idleListener);
        client.on("error", () => {
          pool2.log("additional client error after disconnection due to error", err);
        });
        pool2._remove(client);
        pool2.emit("error", err, client);
      };
    }
    var Pool2 = class extends EventEmitter {
      constructor(options, Client2) {
        super();
        this.options = Object.assign({}, options);
        if (options != null && "password" in options) {
          Object.defineProperty(this.options, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: options.password
          });
        }
        if (options != null && options.ssl && options.ssl.key) {
          Object.defineProperty(this.options.ssl, "key", {
            enumerable: false
          });
        }
        this.options.max = this.options.max || this.options.poolSize || 10;
        this.options.min = this.options.min || 0;
        this.options.maxUses = this.options.maxUses || Infinity;
        this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
        this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
        this.log = this.options.log || function() {
        };
        this.Client = this.options.Client || Client2 || require_lib2().Client;
        this.Promise = this.options.Promise || global.Promise;
        if (typeof this.options.idleTimeoutMillis === "undefined") {
          this.options.idleTimeoutMillis = 1e4;
        }
        this._clients = [];
        this._idle = [];
        this._expired = /* @__PURE__ */ new WeakSet();
        this._pendingQueue = [];
        this._endCallback = void 0;
        this.ending = false;
        this.ended = false;
      }
      _promiseTry(f) {
        const Promise2 = this.Promise;
        if (typeof Promise2.try === "function") {
          return Promise2.try(f);
        }
        return new Promise2((resolve) => resolve(f()));
      }
      _isFull() {
        return this._clients.length >= this.options.max;
      }
      _isAboveMin() {
        return this._clients.length > this.options.min;
      }
      _pulseQueue() {
        this.log("pulse queue");
        if (this.ended) {
          this.log("pulse queue ended");
          return;
        }
        if (this.ending) {
          this.log("pulse queue on ending");
          if (this._idle.length) {
            this._idle.slice().map((item) => {
              this._remove(item.client);
            });
          }
          if (!this._clients.length) {
            this.ended = true;
            this._endCallback();
          }
          return;
        }
        if (!this._pendingQueue.length) {
          this.log("no queued requests");
          return;
        }
        if (!this._idle.length && this._isFull()) {
          return;
        }
        const pendingItem = this._pendingQueue.shift();
        if (this._idle.length) {
          const idleItem = this._idle.pop();
          clearTimeout(idleItem.timeoutId);
          const client = idleItem.client;
          client.ref && client.ref();
          const idleListener = idleItem.idleListener;
          return this._acquireClient(client, pendingItem, idleListener, false);
        }
        if (!this._isFull()) {
          return this.newClient(pendingItem);
        }
        throw new Error("unexpected condition");
      }
      _remove(client, callback) {
        const removed = removeWhere(this._idle, (item) => item.client === client);
        if (removed !== void 0) {
          clearTimeout(removed.timeoutId);
        }
        this._clients = this._clients.filter((c) => c !== client);
        const context = this;
        client.end(() => {
          context.emit("remove", client);
          if (typeof callback === "function") {
            callback();
          }
        });
      }
      connect(cb) {
        if (this.ending) {
          const err = new Error("Cannot use a pool after calling end on the pool");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        const response = promisify(this.Promise, cb);
        const result = response.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length) {
            process.nextTick(() => this._pulseQueue());
          }
          if (!this.options.connectionTimeoutMillis) {
            this._pendingQueue.push(new PendingItem(response.callback));
            return result;
          }
          const queueCallback = (err, res, done) => {
            clearTimeout(tid);
            response.callback(err, res, done);
          };
          const pendingItem = new PendingItem(queueCallback);
          const tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
            pendingItem.timedOut = true;
            response.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          if (tid.unref) {
            tid.unref();
          }
          this._pendingQueue.push(pendingItem);
          return result;
        }
        this.newClient(new PendingItem(response.callback));
        return result;
      }
      newClient(pendingItem) {
        const client = new this.Client(this.options);
        this._clients.push(client);
        const idleListener = makeIdleListener(this, client);
        this.log("checking client timeout");
        let tid;
        let timeoutHit = false;
        if (this.options.connectionTimeoutMillis) {
          tid = setTimeout(() => {
            if (client.connection) {
              this.log("ending client due to timeout");
              timeoutHit = true;
              client.connection.stream.destroy();
            } else if (!client.isConnected()) {
              this.log("ending client due to timeout");
              timeoutHit = true;
              client.end();
            }
          }, this.options.connectionTimeoutMillis);
        }
        this.log("connecting new client");
        client.connect((err) => {
          if (tid) {
            clearTimeout(tid);
          }
          client.on("error", idleListener);
          if (err) {
            this.log("client failed to connect", err);
            this._clients = this._clients.filter((c) => c !== client);
            if (timeoutHit) {
              err = new Error("Connection terminated due to connection timeout", { cause: err });
            }
            this._pulseQueue();
            if (!pendingItem.timedOut) {
              pendingItem.callback(err, void 0, NOOP);
            }
          } else {
            this.log("new client connected");
            if (this.options.onConnect) {
              this._promiseTry(() => this.options.onConnect(client)).then(
                () => {
                  this._afterConnect(client, pendingItem, idleListener);
                },
                (hookErr) => {
                  this._clients = this._clients.filter((c) => c !== client);
                  client.end(() => {
                    this._pulseQueue();
                    if (!pendingItem.timedOut) {
                      pendingItem.callback(hookErr, void 0, NOOP);
                    }
                  });
                }
              );
              return;
            }
            return this._afterConnect(client, pendingItem, idleListener);
          }
        });
      }
      _afterConnect(client, pendingItem, idleListener) {
        if (this.options.maxLifetimeSeconds !== 0) {
          const maxLifetimeTimeout = setTimeout(() => {
            this.log("ending client due to expired lifetime");
            this._expired.add(client);
            const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client);
            if (idleIndex !== -1) {
              this._acquireClient(
                client,
                new PendingItem((err, client2, clientRelease) => clientRelease()),
                idleListener,
                false
              );
            }
          }, this.options.maxLifetimeSeconds * 1e3);
          maxLifetimeTimeout.unref();
          client.once("end", () => clearTimeout(maxLifetimeTimeout));
        }
        return this._acquireClient(client, pendingItem, idleListener, true);
      }
      // acquire a client for a pending work item
      _acquireClient(client, pendingItem, idleListener, isNew) {
        if (isNew) {
          this.emit("connect", client);
        }
        this.emit("acquire", client);
        client.release = this._releaseOnce(client, idleListener);
        client.removeListener("error", idleListener);
        if (!pendingItem.timedOut) {
          if (isNew && this.options.verify) {
            this.options.verify(client, (err) => {
              if (err) {
                client.release(err);
                return pendingItem.callback(err, void 0, NOOP);
              }
              pendingItem.callback(void 0, client, client.release);
            });
          } else {
            pendingItem.callback(void 0, client, client.release);
          }
        } else {
          if (isNew && this.options.verify) {
            this.options.verify(client, client.release);
          } else {
            client.release();
          }
        }
      }
      // returns a function that wraps _release and throws if called more than once
      _releaseOnce(client, idleListener) {
        let released = false;
        return (err) => {
          if (released) {
            throwOnDoubleRelease();
          }
          released = true;
          this._release(client, idleListener, err);
        };
      }
      // release a client back to the poll, include an error
      // to remove it from the pool
      _release(client, idleListener, err) {
        client.on("error", idleListener);
        client._poolUseCount = (client._poolUseCount || 0) + 1;
        this.emit("release", err, client);
        if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
          if (client._poolUseCount >= this.options.maxUses) {
            this.log("remove expended client");
          }
          return this._remove(client, this._pulseQueue.bind(this));
        }
        const isExpired = this._expired.has(client);
        if (isExpired) {
          this.log("remove expired client");
          this._expired.delete(client);
          return this._remove(client, this._pulseQueue.bind(this));
        }
        let tid;
        if (this.options.idleTimeoutMillis && this._isAboveMin()) {
          tid = setTimeout(() => {
            if (this._isAboveMin()) {
              this.log("remove idle client");
              this._remove(client, this._pulseQueue.bind(this));
            }
          }, this.options.idleTimeoutMillis);
          if (this.options.allowExitOnIdle) {
            tid.unref();
          }
        }
        if (this.options.allowExitOnIdle) {
          client.unref();
        }
        this._idle.push(new IdleItem(client, idleListener, tid));
        this._pulseQueue();
      }
      query(text, values, cb) {
        if (typeof text === "function") {
          const response2 = promisify(this.Promise, text);
          setImmediate(function() {
            return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          });
          return response2.result;
        }
        if (typeof values === "function") {
          cb = values;
          values = void 0;
        }
        const response = promisify(this.Promise, cb);
        cb = response.callback;
        this.connect((err, client) => {
          if (err) {
            return cb(err);
          }
          let clientReleased = false;
          const onError = (err2) => {
            if (clientReleased) {
              return;
            }
            clientReleased = true;
            client.release(err2);
            cb(err2);
          };
          client.once("error", onError);
          this.log("dispatching query");
          try {
            client.query(text, values, (err2, res) => {
              this.log("query dispatched");
              client.removeListener("error", onError);
              if (clientReleased) {
                return;
              }
              clientReleased = true;
              client.release(err2);
              if (err2) {
                return cb(err2);
              }
              return cb(void 0, res);
            });
          } catch (err2) {
            client.release(err2);
            return cb(err2);
          }
        });
        return response.result;
      }
      end(cb) {
        this.log("ending");
        if (this.ending) {
          const err = new Error("Called end on pool more than once");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        this.ending = true;
        const promised = promisify(this.Promise, cb);
        this._endCallback = promised.callback;
        this._pulseQueue();
        return promised.result;
      }
      get waitingCount() {
        return this._pendingQueue.length;
      }
      get idleCount() {
        return this._idle.length;
      }
      get expiredCount() {
        return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
      }
      get totalCount() {
        return this._clients.length;
      }
    };
    module.exports = Pool2;
  }
});

// node_modules/pg/lib/native/query.js
var require_query2 = __commonJS({
  "node_modules/pg/lib/native/query.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var util = __require("util");
    var utils = require_utils();
    var NativeQuery = module.exports = function(config, values, callback) {
      EventEmitter.call(this);
      config = utils.normalizeQueryConfig(config, values, callback);
      this.text = config.text;
      this.values = config.values;
      this.name = config.name;
      this.queryMode = config.queryMode;
      this.callback = config.callback;
      this.state = "new";
      this._arrayMode = config.rowMode === "array";
      this._emitRowEvents = false;
      this.on(
        "newListener",
        function(event) {
          if (event === "row") this._emitRowEvents = true;
        }.bind(this)
      );
    };
    util.inherits(NativeQuery, EventEmitter);
    var errorFieldMap = {
      sqlState: "code",
      statementPosition: "position",
      messagePrimary: "message",
      messageDetail: "detail",
      messageHint: "hint",
      context: "where",
      schemaName: "schema",
      tableName: "table",
      columnName: "column",
      dataTypeName: "dataType",
      constraintName: "constraint",
      sourceFile: "file",
      sourceLine: "line",
      sourceFunction: "routine"
    };
    NativeQuery.prototype.handleError = function(err) {
      const fields = this.native && this.native.pq.resultErrorFields();
      if (fields) {
        for (const key in fields) {
          const normalizedFieldName = errorFieldMap[key] || key;
          err[normalizedFieldName] = fields[key];
        }
      }
      if (this.callback) {
        this.callback(err);
      } else {
        this.emit("error", err);
      }
      this.state = "error";
    };
    NativeQuery.prototype.then = function(onSuccess, onFailure) {
      return this._getPromise().then(onSuccess, onFailure);
    };
    NativeQuery.prototype.catch = function(callback) {
      return this._getPromise().catch(callback);
    };
    NativeQuery.prototype._getPromise = function() {
      if (this._promise) return this._promise;
      this._promise = new Promise(
        function(resolve, reject) {
          this._once("end", resolve);
          this._once("error", reject);
        }.bind(this)
      );
      return this._promise;
    };
    NativeQuery.prototype.submit = function(client) {
      this.state = "running";
      const self = this;
      this.native = client.native;
      client.native.arrayMode = this._arrayMode;
      let after = function(err, rows, results) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self.emit("_done");
        });
        if (err) {
          return self.handleError(err);
        }
        if (self._emitRowEvents) {
          if (results.length > 1) {
            rows.forEach((rowOfRows, i) => {
              rowOfRows.forEach((row) => {
                self.emit("row", row, results[i]);
              });
            });
          } else {
            rows.forEach(function(row) {
              self.emit("row", row, results);
            });
          }
        }
        self.state = "end";
        self.emit("end", results);
        if (self.callback) {
          self.callback(null, results);
        }
      };
      if (process.domain) {
        after = process.domain.bind(after);
      }
      if (this.name) {
        if (this.name.length > 63) {
          console.error("Warning! Postgres only supports 63 characters for query names.");
          console.error("You supplied %s (%s)", this.name, this.name.length);
          console.error("This can cause conflicts and silent errors executing queries");
        }
        const values = (this.values || []).map(utils.prepareValue);
        if (client.namedQueries[this.name] !== void 0) {
          if (this.text && client.namedQueries[this.name] !== this.text) {
            const err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
            return after(err);
          }
          return client.native.execute(this.name, values, after);
        }
        return client.native.prepare(this.name, this.text, values.length, function(err) {
          if (err) return after(err);
          client.namedQueries[self.name] = self.text;
          return self.native.execute(self.name, values, after);
        });
      } else if (this.values) {
        if (!Array.isArray(this.values)) {
          const err = new Error("Query values must be an array");
          return after(err);
        }
        const vals = this.values.map(utils.prepareValue);
        client.native.query(this.text, vals, after);
      } else if (this.queryMode === "extended") {
        client.native.query(this.text, [], after);
      } else {
        client.native.query(this.text, after);
      }
    };
  }
});

// node_modules/pg/lib/native/client.js
var require_client2 = __commonJS({
  "node_modules/pg/lib/native/client.js"(exports, module) {
    var nodeUtils = __require("util");
    var Native;
    try {
      Native = __require("pg-native");
    } catch (e) {
      throw e;
    }
    var TypeOverrides2 = require_type_overrides();
    var EventEmitter = __require("events").EventEmitter;
    var util = __require("util");
    var ConnectionParameters = require_connection_parameters();
    var NativeQuery = require_query2();
    var queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead."
    );
    var Client2 = module.exports = function(config) {
      EventEmitter.call(this);
      config = config || {};
      this._Promise = config.Promise || global.Promise;
      this._types = new TypeOverrides2(config.types);
      this.native = new Native({
        types: this._types
      });
      this._queryQueue = [];
      this._ending = false;
      this._connecting = false;
      this._connected = false;
      this._queryable = true;
      this.pipeline = Boolean(config.pipeline);
      this._pipelineInFlight = false;
      const cp = this.connectionParameters = new ConnectionParameters(config);
      if (config.nativeConnectionString) cp.nativeConnectionString = config.nativeConnectionString;
      this.user = cp.user;
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: cp.password
      });
      this.database = cp.database;
      this.host = cp.host;
      this.port = cp.port;
      this.namedQueries = {};
    };
    Client2.Query = NativeQuery;
    util.inherits(Client2, EventEmitter);
    Client2.prototype._errorAllQueries = function(err) {
      const enqueueError = (query) => {
        process.nextTick(() => {
          query.native = this.native;
          query.handleError(err);
        });
      };
      if (this._hasActiveQuery()) {
        enqueueError(this._activeQuery);
        this._activeQuery = null;
      }
      this._queryQueue.forEach(enqueueError);
      this._queryQueue.length = 0;
    };
    Client2.prototype._connect = function(cb) {
      const self = this;
      if (this._connecting) {
        process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
        return;
      }
      this._connecting = true;
      this.connectionParameters.getLibpqConnectionString(function(err, conString) {
        if (self.connectionParameters.nativeConnectionString) conString = self.connectionParameters.nativeConnectionString;
        if (err) return cb(err);
        self.native.connect(conString, function(err2) {
          if (err2) {
            self.native.end();
            return cb(err2);
          }
          self._connected = true;
          self.native.on("error", function(err3) {
            self._queryable = false;
            self._errorAllQueries(err3);
            self.emit("error", err3);
          });
          self.native.on("notification", function(msg) {
            self.emit("notification", {
              channel: msg.relname,
              payload: msg.extra
            });
          });
          self.emit("connect");
          self._pulseQueryQueue(true);
          cb(null, this);
        });
      });
    };
    Client2.prototype.connect = function(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error) => {
          if (error) {
            reject(error);
          } else {
            resolve(this);
          }
        });
      });
    };
    Client2.prototype.query = function(config, values, callback) {
      let query;
      let result;
      let readTimeout;
      let readTimeoutTimer;
      let queryCallback;
      if (config === null || config === void 0) {
        throw new TypeError("Client was passed a null or undefined query");
      } else if (typeof config.submit === "function") {
        readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        result = query = config;
        if (typeof values === "function") {
          config.callback = values;
        }
      } else {
        readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        query = new NativeQuery(config, values, callback);
        if (!query.callback) {
          let resolveOut, rejectOut;
          result = new this._Promise((resolve, reject) => {
            resolveOut = resolve;
            rejectOut = reject;
          }).catch((err) => {
            Error.captureStackTrace(err);
            throw err;
          });
          query.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
        }
      }
      if (readTimeout) {
        queryCallback = query.callback || (() => {
        });
        readTimeoutTimer = setTimeout(() => {
          const error = new Error("Query read timeout");
          process.nextTick(() => {
            query.handleError(error, this.connection);
          });
          queryCallback(error);
          query.callback = () => {
          };
          const index = this._queryQueue.indexOf(query);
          if (index > -1) {
            this._queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query.callback = (err, res) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err, res);
        };
      }
      if (!this._queryable) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client has encountered a connection error and is not queryable"));
        });
        return result;
      }
      if (this._ending) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client was closed and is not queryable"));
        });
        return result;
      }
      if (this._queryQueue.length > 0 && !this.pipeline) {
        queryQueueLengthDeprecationNotice();
      }
      this._queryQueue.push(query);
      this._pulseQueryQueue();
      return result;
    };
    Client2.prototype.end = function(cb) {
      const self = this;
      this._ending = true;
      if (this._connecting && !this._connected) {
        this.once("connect", () => {
          this.end(() => {
          });
        });
      }
      let result;
      if (!cb) {
        result = new this._Promise(function(resolve, reject) {
          cb = (err) => err ? reject(err) : resolve();
        });
      }
      const doEnd = function() {
        self.native.end(function() {
          self._connected = false;
          self._errorAllQueries(new Error("Connection terminated"));
          process.nextTick(() => {
            self.emit("end");
            if (cb) cb();
          });
        });
      };
      if (this.pipeline && (this._pipelineInFlight || this._queryQueue.length > 0)) {
        this.once("drain", doEnd);
      } else {
        doEnd();
      }
      return result;
    };
    Client2.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
    };
    Client2.prototype._pulseQueryQueue = function(initialConnection) {
      if (!this._connected) {
        return;
      }
      if (this.pipeline && !initialConnection) {
        return this._pulsePipelinedQueryQueue();
      }
      if (this._hasActiveQuery()) {
        return;
      }
      const query = this._queryQueue.shift();
      if (!query) {
        if (!initialConnection) {
          this.emit("drain");
        }
        return;
      }
      this._activeQuery = query;
      query.submit(this);
      const self = this;
      query.once("_done", function() {
        self._pulseQueryQueue();
      });
    };
    Client2.prototype._pulsePipelinedQueryQueue = function() {
      if (!this._connected || this._pipelineInFlight) {
        return;
      }
      if (this._queryQueue.length === 0) {
        if (this.hasExecuted) {
          this.emit("drain");
        }
        return;
      }
      this._pipelineInFlight = true;
      const self = this;
      const queries = [];
      const nativeQueries = [];
      const utils = require_utils();
      while (this._queryQueue.length > 0) {
        const query = this._queryQueue.shift();
        this.hasExecuted = true;
        nativeQueries.push(query);
        const values = query.values ? query.values.map(utils.prepareValue) : null;
        const pipelineEntry = { text: query.text, name: query.name, arrayMode: query._arrayMode };
        if (values) {
          pipelineEntry.values = values;
        }
        if (query.name && this.namedQueries[query.name]) {
          pipelineEntry._alreadyPrepared = true;
        }
        queries.push(pipelineEntry);
      }
      this.native.pipeline(queries, function(err, results) {
        self._pipelineInFlight = false;
        if (err) {
          self._connected = false;
          self._queryable = false;
          for (let i = 0; i < nativeQueries.length; i++) {
            const q = nativeQueries[i];
            q.native = self.native;
            q.handleError(err);
          }
          self._errorAllQueries(err);
          self.emit("error", err);
          self.emit("end");
          return;
        }
        for (let i = 0; i < nativeQueries.length; i++) {
          const q = nativeQueries[i];
          const r = results[i];
          q.native = self.native;
          if (r.err) {
            q.handleError(r.err);
          } else {
            if (q.name) {
              self.namedQueries[q.name] = q.text;
            }
            q.state = "end";
            q.emit("end", r.result);
            if (q.callback) {
              q.callback(null, r.result);
            }
          }
          setImmediate(function() {
            q.emit("_done");
          });
        }
        self._pulsePipelinedQueryQueue();
      });
    };
    Client2.prototype.cancel = function(query) {
      if (this._activeQuery === query) {
        this.native.cancel(function() {
        });
      } else if (this._queryQueue.indexOf(query) !== -1) {
        this._queryQueue.splice(this._queryQueue.indexOf(query), 1);
      }
    };
    Client2.prototype.ref = function() {
    };
    Client2.prototype.unref = function() {
    };
    Client2.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    Client2.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
    Client2.prototype.isConnected = function() {
      return this._connected;
    };
    Client2.prototype.getTransactionStatus = function() {
      return this.native.getTransactionStatus();
    };
  }
});

// node_modules/pg/lib/native/index.js
var require_native = __commonJS({
  "node_modules/pg/lib/native/index.js"(exports, module) {
    "use strict";
    module.exports = require_client2();
  }
});

// node_modules/pg/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/pg/lib/index.js"(exports, module) {
    "use strict";
    var Client2 = require_client();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var Result2 = require_result();
    var utils = require_utils();
    var Pool2 = require_pg_pool();
    var TypeOverrides2 = require_type_overrides();
    var { DatabaseError: DatabaseError2 } = require_dist();
    var { escapeIdentifier: escapeIdentifier2, escapeLiteral: escapeLiteral2 } = require_utils();
    var poolFactory = (Client3) => {
      return class BoundPool extends Pool2 {
        constructor(options) {
          super(options, Client3);
        }
      };
    };
    var PG = function(clientConstructor2) {
      this.defaults = defaults2;
      this.Client = clientConstructor2;
      this.Query = this.Client.Query;
      this.Pool = poolFactory(this.Client);
      this._pools = [];
      this.Connection = Connection2;
      this.types = require_pg_types();
      this.DatabaseError = DatabaseError2;
      this.TypeOverrides = TypeOverrides2;
      this.escapeIdentifier = escapeIdentifier2;
      this.escapeLiteral = escapeLiteral2;
      this.Result = Result2;
      this.utils = utils;
    };
    var clientConstructor = Client2;
    var forceNative = false;
    try {
      forceNative = !!process.env.NODE_PG_FORCE_NATIVE;
    } catch {
    }
    if (forceNative) {
      clientConstructor = require_native();
    }
    module.exports = new PG(clientConstructor);
    Object.defineProperty(module.exports, "native", {
      configurable: true,
      enumerable: false,
      get() {
        let native = null;
        try {
          native = new PG(require_native());
        } catch (err) {
          if (err.code !== "MODULE_NOT_FOUND") {
            throw err;
          }
        }
        Object.defineProperty(module.exports, "native", {
          value: native
        });
        return native;
      }
    });
  }
});

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler2;
      if (middleware[i]) {
        handler2 = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler2 = i === middleware.length && next || void 0;
      }
      if (handler2) {
        try {
          res = await handler2(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
};

// node_modules/hono/dist/utils/body.js
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form2 = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form2[key] = value;
    } else {
      handleParsingAllValues(form2, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form2).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form2, key, value);
        delete form2[key];
      }
    });
  }
  return form2;
}
var handleParsingAllValues = (form2, key, value) => {
  if (form2[key] !== void 0) {
    if (Array.isArray(form2[key])) {
      ;
      form2[key].push(value);
    } else {
      form2[key] = [form2[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form2[key] = value;
    } else {
      form2[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form2, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form2;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base2, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base2?.[0] === "/" ? "" : "/"}${base2}${sub === "/" ? "" : `${base2?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var escapeRe = /[&<>'"]/;
var stringBufferToString = async (buffer, callbacks) => {
  let str = "";
  callbacks ||= [];
  const resolvedBuffer = await Promise.all(buffer);
  for (let i = resolvedBuffer.length - 1; ; i--) {
    str += resolvedBuffer[i];
    i--;
    if (i < 0) {
      break;
    }
    let r = resolvedBuffer[i];
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    const isEscaped = r.isEscaped;
    r = await (typeof r === "object" ? r.toString() : r);
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    if (r.isEscaped ?? isEscaped) {
      str += r;
    } else {
      const buf = [str];
      escapeToBuffer(r, buf);
      str = buf[0];
    }
  }
  return raw(str, callbacks);
};
var escapeToBuffer = (str, buffer) => {
  const match2 = str.search(escapeRe);
  if (match2 === -1) {
    buffer[0] += str;
    return;
  }
  let escape;
  let index;
  let lastIndex = 0;
  for (index = match2; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escape = "&quot;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    buffer[0] += str.substring(lastIndex, index) + escape;
    lastIndex = index + 1;
  }
  buffer[0] += str.substring(lastIndex, index);
};
var resolveCallbackSync = (str) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return str;
  }
  const buffer = [str];
  const context = {};
  callbacks.forEach((c) => c({ phase: HtmlEscapedCallbackPhase.Stringify, buffer, context }));
  return buffer[0];
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html2, arg, headers) => {
    const res = (html22) => this.#newResponse(html22, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html2 === "object" ? resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html2);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler2) => {
          this.#addRoute(method, this.#path, handler2);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler2) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler2);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler2) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler2);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler2;
      if (app2.errorHandler === errorHandler) {
        handler2 = r.handler;
      } else {
        handler2 = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler2[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler2, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler2) => {
    this.errorHandler = handler2;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler2) => {
    this.#notFoundHandler = handler2;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler2 = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler2);
    return this;
  }
  #addRoute(method, path, handler2, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler: handler2
    };
    this.router.add(method, path, [handler2, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input2, requestInit, Env, executionCtx) => {
    if (input2 instanceof Request) {
      return this.fetch(requestInit ? new Request(input2, requestInit) : input2, Env, executionCtx);
    }
    input2 = input2.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input2) ? input2 : `http://localhost${mergePath("/", input2)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler2) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler2, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler2, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler2, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler2) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler2]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = (children) => {
  for (const _ in children) {
    return true;
  }
  return false;
};
var Node2 = class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler2, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler2) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler: handler2, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler2) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler: handler2,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler: handler2, params }) => [handler2, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler2) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler2);
      }
      return;
    }
    this.#node.insert(method, path, handler2);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var trimCookieWhitespace = (value) => {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const charCode = value.charCodeAt(start);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    start++;
  }
  while (end > start) {
    const charCode = value.charCodeAt(end - 1);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    end--;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
};
var parse = (cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.split(";");
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  for (const pairStr of pairs) {
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = trimCookieWhitespace(pairStr.substring(0, valueStartPos));
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName) || cookieName in parsedCookie) {
      continue;
    }
    let cookieValue = trimCookieWhitespace(pairStr.substring(valueStartPos + 1));
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = cookieValue.indexOf("%") !== -1 ? tryDecode(cookieValue, decodeURIComponent_) : cookieValue;
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
};
var _serialize = (name, value, opt = {}) => {
  if (!validCookieNameRegEx.test(name)) {
    throw new Error("Invalid cookie name");
  }
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) {
    throw new Error("__Secure- Cookie must have Secure attributes");
  }
  if (name.startsWith("__Host-")) {
    if (!opt.secure) {
      throw new Error("__Host- Cookie must have Secure attributes");
    }
    if (opt.path !== "/") {
      throw new Error('__Host- Cookie must have Path attributes with "/"');
    }
    if (opt.domain) {
      throw new Error("__Host- Cookie must not have Domain attributes");
    }
  }
  for (const key of ["domain", "path", "sameSite", "priority"]) {
    if (opt[key] && /[;\r\n]/.test(opt[key])) {
      throw new Error(`${key} must not contain ";", "\\r", or "\\n"`);
    }
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) {
      throw new Error(
        "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration."
      );
    }
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) {
      throw new Error(
        "Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future."
      );
    }
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  }
  if (opt.priority) {
    cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  }
  if (opt.partitioned) {
    if (!opt.secure) {
      throw new Error("Partitioned Cookie must have Secure attributes");
    }
    cookie += "; Partitioned";
  }
  return cookie;
};
var serialize = (name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
};

// node_modules/hono/dist/helper/cookie/index.js
var getCookie = (c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
};
var generateCookie = (name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, { path: "/", ...opt, secure: true });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  return cookie;
};
var setCookie = (c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
};
var deleteCookie = (c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", { ...opt, maxAge: 0 });
  return deletedCookie;
};

// src/lib/auth.ts
var enc = new TextEncoder();
var SALT = "srctool-ai-salt-v1";
var ITER = 1e5;
var COOKIE_NAME = "stk_session";
function b64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64url(str) {
  const bytes = enc.encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str) {
  const p = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(p + "=".repeat((4 - p.length % 4) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
async function hashPassword(password) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(SALT), iterations: ITER, hash: "SHA-256" },
    key,
    256
  );
  return "pbkdf2$" + b64(bits);
}
async function verifyPassword(password, stored) {
  if (stored.startsWith("SEED$")) return stored.slice(5) === password;
  const h = await hashPassword(password);
  return h === stored;
}
async function hmac(data, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64(sig).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function signToken(payload, secret) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + 1e3 * 60 * 60 * 24 * 30 }));
  const sig = await hmac(`${header}.${body}`, secret);
  return `${header}.${body}.${sig}`;
}
async function verifyToken(token, secret) {
  try {
    const [h, b, s] = token.split(".");
    if (!h || !b || !s) return null;
    const expected = await hmac(`${h}.${b}`, secret);
    if (expected !== s) return null;
    const payload = JSON.parse(b64urlDecode(b));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
function getSecret(c) {
  return c.env?.JWT_SECRET || "srctool-ai-dev-secret-change-in-production";
}
async function setSession(c, user) {
  const token = await signToken(
    { id: user.id, email: user.email, full_name: user.full_name, role: user.role, avatar_url: user.avatar_url },
    getSecret(c)
  );
  setCookie(c, COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 30
  });
}
function clearSession(c) {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}
async function getSession(c) {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;
  const payload = await verifyToken(token, getSecret(c));
  if (!payload) return null;
  return {
    id: payload.id,
    email: payload.email,
    full_name: payload.full_name,
    role: payload.role,
    avatar_url: payload.avatar_url
  };
}
function genCode(prefix, len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const arr = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length];
  return prefix + s;
}
function genLicenseKey() {
  const seg = () => genCode("", 4);
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

// src/lib/utils.ts
function formatVND(n) {
  if (n === null || n === void 0) return "0\u0111";
  return new Intl.NumberFormat("vi-VN").format(n) + "\u0111";
}
function discountPercent(price, original) {
  if (!original || original <= price) return 0;
  return Math.round((original - price) / original * 100);
}
function formatDate(s) {
  if (!s) return "\u2014";
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDateTime(s) {
  if (!s) return "\u2014";
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function parseJSON(s, fallback) {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}
function slugify(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}
var GRADIENTS = [
  ["#6366f1", "#a855f7"],
  ["#8b5cf6", "#ec4899"],
  ["#06b6d4", "#3b82f6"],
  ["#f59e0b", "#ef4444"],
  ["#10b981", "#06b6d4"],
  ["#ec4899", "#f43f5e"],
  ["#3b82f6", "#8b5cf6"],
  ["#14b8a6", "#22c55e"]
];
function gradientFor(id) {
  const [a, b] = GRADIENTS[id % GRADIENTS.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}
var PRODUCT_TYPE_LABEL = {
  course: "Kh\xF3a h\u1ECDc",
  skill: "Skill AI",
  chatbot: "Chatbot",
  app: "App Video AI",
  prompt: "B\u1ED9 Prompt",
  tool: "Ph\u1EA7n M\u1EC1m",
  source: "Source Code",
  combo: "Combo"
};
var PRODUCT_TYPE_ICON = {
  course: "fa-graduation-cap",
  skill: "fa-wand-magic-sparkles",
  chatbot: "fa-robot",
  app: "fa-mobile-screen-button",
  prompt: "fa-layer-group",
  tool: "fa-gears",
  source: "fa-code",
  combo: "fa-box-open"
};
function vietQrUrl(bankCode, account, amount, content, owner) {
  const p = new URLSearchParams({
    amount: String(amount),
    addInfo: content,
    accountName: owner
  });
  return `https://img.vietqr.io/image/${bankCode}-${account}-compact2.png?${p.toString()}`;
}

// src/lib/webhook.ts
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function verifyWebhookAuth(headers, expectedKey) {
  if (!expectedKey || expectedKey === "CHANGE_ME_SECRET") return false;
  const auth = headers.get("authorization") || "";
  const secureToken = headers.get("secure-token") || headers.get("x-secure-token") || "";
  const m = auth.match(/^(?:Apikey|Bearer)\s+(.+)$/i);
  if (m && safeEqual(m[1].trim(), expectedKey)) return true;
  if (secureToken && safeEqual(secureToken.trim(), expectedKey)) return true;
  return false;
}
function toInt(v) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.abs(n) : 0;
}
function normalizeSePay(p) {
  const isIn = String(p.transferType || "").toLowerCase() === "in";
  const amt = toInt(p.transferAmount);
  return {
    provider: "sepay",
    providerTxId: String(p.id ?? p.referenceCode ?? Date.now()),
    gateway: p.gateway ?? null,
    accountNumber: p.accountNumber ?? p.subAccount ?? null,
    transactionDate: p.transactionDate ?? null,
    amountIn: isIn ? amt : 0,
    amountOut: isIn ? 0 : amt,
    accumulated: toInt(p.accumulated),
    // content ưu tiên, fallback sang code/description
    content: String(p.content ?? p.code ?? p.description ?? ""),
    referenceCode: p.referenceCode ?? null
  };
}
function normalizeCasso(item) {
  const raw2 = Number(item.amount) || 0;
  return {
    provider: "casso",
    providerTxId: String(item.tid ?? item.id ?? Date.now()),
    gateway: item.bankName ?? item.bank_name ?? null,
    accountNumber: item.subAccId ?? item.bank_sub_acc_id ?? null,
    transactionDate: item.when ?? null,
    amountIn: raw2 > 0 ? Math.round(raw2) : 0,
    amountOut: raw2 < 0 ? Math.round(-raw2) : 0,
    accumulated: toInt(item.cusum_balance),
    content: String(item.description ?? ""),
    referenceCode: item.tid ?? null
  };
}
function extractTransactions(provider, body) {
  if (provider === "casso" || Array.isArray(body?.data)) {
    const arr = Array.isArray(body?.data) ? body.data : [];
    return arr.map(normalizeCasso);
  }
  return [normalizeSePay(body)];
}
function extractOrderCodes(content) {
  if (!content) return [];
  const upper = content.toUpperCase();
  const compact = upper.replace(/[^A-Z0-9]/g, "");
  const found = /* @__PURE__ */ new Set();
  const re = /DH[A-Z0-9]{8}/g;
  let m;
  while ((m = re.exec(compact)) !== null) {
    found.add(m[0]);
    re.lastIndex = m.index + 1;
  }
  const reWord = /\bDH[A-Z0-9]{8}\b/g;
  const priority = [];
  while ((m = reWord.exec(upper)) !== null) priority.push(m[0]);
  const ordered = [.../* @__PURE__ */ new Set([...priority, ...found])];
  return ordered;
}
function normalizeDate(d) {
  if (!d) return (/* @__PURE__ */ new Date()).toISOString();
  if (/^\d{4}-\d{2}-\d{2}T/.test(d)) return d;
  const m = d.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(:\d{2})?)/);
  if (m) return `${m[1]}T${m[2].length === 5 ? m[2] + ":00" : m[2]}.000Z`;
  const t = Date.parse(d);
  return Number.isFinite(t) ? new Date(t).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
}

// node_modules/hono/dist/jsx/constants.js
var DOM_RENDERER = /* @__PURE__ */ Symbol("RENDERER");
var DOM_ERROR_HANDLER = /* @__PURE__ */ Symbol("ERROR_HANDLER");
var DOM_INTERNAL_TAG = /* @__PURE__ */ Symbol("INTERNAL");
var PERMALINK = /* @__PURE__ */ Symbol("PERMALINK");

// node_modules/hono/dist/jsx/dom/utils.js
var setInternalTagFlag = (fn) => {
  ;
  fn[DOM_INTERNAL_TAG] = true;
  return fn;
};

// node_modules/hono/dist/jsx/dom/context.js
var createContextProviderFunction = (values) => ({ value, children }) => {
  if (!children) {
    return void 0;
  }
  const props = {
    children: [
      {
        tag: setInternalTagFlag(() => {
          values.push(value);
        }),
        props: {}
      }
    ]
  };
  if (Array.isArray(children)) {
    props.children.push(...children.flat());
  } else {
    props.children.push(children);
  }
  props.children.push({
    tag: setInternalTagFlag(() => {
      values.pop();
    }),
    props: {}
  });
  const res = { tag: "", props, type: "" };
  res[DOM_ERROR_HANDLER] = (err) => {
    values.pop();
    throw err;
  };
  return res;
};

// node_modules/hono/dist/jsx/context.js
var globalContexts = [];
var alsProbed = false;
var asyncLocalStorage;
var fallbackStore;
var fallbackRendersInFlight = 0;
var warnedFallbackDefault = false;
var loadAsyncLocalStorage = () => {
  if (alsProbed) {
    return asyncLocalStorage;
  }
  alsProbed = true;
  const global2 = globalThis;
  let AsyncLocalStorage;
  for (const probe of [
    // Node.js >= 20.16, Deno, Bun, Cloudflare Workers (nodejs_compat). Property
    // access only, so bundlers don't statically resolve `node:async_hooks`.
    () => global2.process?.getBuiltinModule?.("node:async_hooks")?.AsyncLocalStorage,
    // Node.js < 20.16 has no `process.getBuiltinModule`, but a CJS entrypoint
    // exposes the main module's `require` here.
    () => global2.process?.mainModule?.require?.("node:async_hooks")?.AsyncLocalStorage
  ]) {
    try {
      AsyncLocalStorage = probe();
    } catch {
    }
    if (AsyncLocalStorage) {
      break;
    }
  }
  if (AsyncLocalStorage) {
    asyncLocalStorage = new AsyncLocalStorage();
  }
  return asyncLocalStorage;
};
var getCurrentStore = () => {
  return loadAsyncLocalStorage()?.getStore() || fallbackStore;
};
var warnIfStorelessAccess = () => {
  if (fallbackRendersInFlight > 0 && !warnedFallbackDefault) {
    warnedFallbackDefault = true;
    console.warn(
      "hono/jsx: AsyncLocalStorage is unavailable in this runtime, so useContext() after an await in an async component falls back to the context default value during server-side rendering. To get provided values across await boundaries, use a runtime with AsyncLocalStorage (Node.js >= 20.16, Deno, Bun, or Cloudflare Workers with the nodejs_compat flag)."
    );
  }
};
var getContextValuesIn = (store, context) => {
  if (!store) {
    warnIfStorelessAccess();
    return context.values;
  }
  let values = store.get(context);
  if (!values) {
    values = [context.values[0]];
    store.set(context, values);
  }
  return values;
};
var readContextValueIn = (store, context) => {
  if (!store) {
    warnIfStorelessAccess();
    return context.values.at(-1);
  }
  const values = store.get(context);
  return values?.length ? values.at(-1) : context.values[0];
};
var captureContextValues = (store) => (store ? globalContexts.filter((c) => store.has(c)) : globalContexts).map((c) => [
  c,
  readContextValueIn(store, c)
]);
var resumeWithContextValues = (callback, store, contexts) => runWithRenderContext(() => {
  const currentStore = getCurrentStore();
  const valuesPerContext = contexts.map(([context, value]) => {
    const values = getContextValuesIn(currentStore, context);
    values.push(value);
    return values;
  });
  const popContextValues = () => {
    valuesPerContext.forEach((values) => {
      values.pop();
    });
  };
  try {
    const result = callback();
    if (result instanceof Promise) {
      return result.finally(popContextValues);
    }
    popContextValues();
    return result;
  } catch (e) {
    popContextValues();
    throw e;
  }
}, store);
var runWithRenderContext = (callback, resumeStore) => {
  if (getCurrentStore()) {
    return callback();
  }
  const store = resumeStore ?? /* @__PURE__ */ new WeakMap();
  const storage = loadAsyncLocalStorage();
  if (storage) {
    return storage.run(store, callback);
  }
  fallbackStore = store;
  let result;
  try {
    result = callback();
  } finally {
    fallbackStore = void 0;
  }
  if (!warnedFallbackDefault && result instanceof Promise) {
    fallbackRendersInFlight++;
    result = result.finally(() => {
      fallbackRendersInFlight--;
    });
  }
  return result;
};
var captureRenderContext = () => {
  const store = getCurrentStore();
  const contexts = captureContextValues(store);
  return (callback) => resumeWithContextValues(callback, store, contexts);
};
var createContext = (defaultValue) => {
  const values = [defaultValue];
  const context = ((props) => {
    const contextValues = getContextValuesIn(getCurrentStore(), context);
    contextValues.push(props.value);
    let string;
    try {
      string = props.children ? (Array.isArray(props.children) ? new JSXFragmentNode("", {}, props.children) : props.children).toString() : "";
    } catch (e) {
      contextValues.pop();
      throw e;
    }
    if (string instanceof Promise) {
      return string.finally(() => contextValues.pop()).then((resString) => raw(resString, resString.callbacks));
    } else {
      contextValues.pop();
      return raw(string);
    }
  });
  context.values = values;
  context.Provider = context;
  context[DOM_RENDERER] = createContextProviderFunction(values);
  globalContexts.push(context);
  return context;
};
var useContext = (context) => {
  return readContextValueIn(getCurrentStore(), context);
};

// node_modules/hono/dist/jsx/intrinsic-element/common.js
var deDupeKeyMap = {
  title: [],
  script: ["src"],
  style: ["data-href"],
  link: ["href"],
  meta: ["name", "httpEquiv", "charset", "itemProp"]
};
var domRenderers = {};
var dataPrecedenceAttr = "data-precedence";
var isStylesheetLinkWithPrecedence = (props) => props.rel === "stylesheet" && "precedence" in props;
var shouldDeDupeByKey = (tagName, supportSort) => {
  if (tagName === "link") {
    return supportSort;
  }
  return deDupeKeyMap[tagName].length > 0;
};

// node_modules/hono/dist/jsx/intrinsic-element/components.js
var components_exports = {};
__export(components_exports, {
  button: () => button,
  form: () => form,
  input: () => input,
  link: () => link,
  meta: () => meta,
  script: () => script,
  style: () => style,
  title: () => title
});

// node_modules/hono/dist/jsx/children.js
var toArray = (children) => Array.isArray(children) ? children : [children];

// node_modules/hono/dist/jsx/intrinsic-element/components.js
var metaTagMap = /* @__PURE__ */ new WeakMap();
var insertIntoHead = (tagName, tag, props, precedence) => ({ buffer, context }) => {
  if (!buffer) {
    return;
  }
  const map = metaTagMap.get(context) || {};
  metaTagMap.set(context, map);
  const tags = map[tagName] ||= [];
  let duped = false;
  const deDupeKeys = deDupeKeyMap[tagName];
  const deDupeByKey = shouldDeDupeByKey(tagName, precedence !== void 0);
  if (deDupeByKey) {
    LOOP: for (const [, tagProps] of tags) {
      if (tagName === "link" && !(tagProps.rel === "stylesheet" && tagProps[dataPrecedenceAttr] !== void 0)) {
        continue;
      }
      for (const key of deDupeKeys) {
        if ((tagProps?.[key] ?? null) === props?.[key]) {
          duped = true;
          break LOOP;
        }
      }
    }
  }
  if (duped) {
    buffer[0] = buffer[0].replaceAll(tag, "");
  } else if (deDupeByKey || tagName === "link") {
    tags.push([tag, props, precedence]);
  } else {
    tags.unshift([tag, props, precedence]);
  }
  if (buffer[0].indexOf("</head>") !== -1) {
    let insertTags;
    if (tagName === "link" || precedence !== void 0) {
      const precedences = [];
      insertTags = tags.map(([tag2, , tagPrecedence], index) => {
        if (tagPrecedence === void 0) {
          return [tag2, Number.MAX_SAFE_INTEGER, index];
        }
        let order = precedences.indexOf(tagPrecedence);
        if (order === -1) {
          precedences.push(tagPrecedence);
          order = precedences.length - 1;
        }
        return [tag2, order, index];
      }).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(([tag2]) => tag2);
    } else {
      insertTags = tags.map(([tag2]) => tag2);
    }
    insertTags.forEach((tag2) => {
      buffer[0] = buffer[0].replaceAll(tag2, "");
    });
    buffer[0] = buffer[0].replace(/(?=<\/head>)/, insertTags.join(""));
  }
};
var returnWithoutSpecialBehavior = (tag, children, props) => raw(new JSXNode(tag, props, toArray(children ?? [])).toString());
var documentMetadataTag = (tag, children, props, sort) => {
  if ("itemProp" in props) {
    return returnWithoutSpecialBehavior(tag, children, props);
  }
  let { precedence, blocking, ...restProps } = props;
  precedence = sort ? precedence ?? "" : void 0;
  if (sort) {
    restProps[dataPrecedenceAttr] = precedence;
  }
  const string = new JSXNode(tag, restProps, toArray(children || [])).toString();
  if (string instanceof Promise) {
    return string.then(
      (resString) => raw(string, [
        ...resString.callbacks || [],
        insertIntoHead(tag, resString, restProps, precedence)
      ])
    );
  } else {
    return raw(string, [insertIntoHead(tag, string, restProps, precedence)]);
  }
};
var title = ({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (nameSpaceContext2) {
    const context = useContext(nameSpaceContext2);
    if (context === "svg" || context === "head") {
      return new JSXNode(
        "title",
        props,
        toArray(children ?? [])
      );
    }
  }
  return documentMetadataTag("title", children, props, false);
};
var script = ({
  children,
  ...props
}) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (["src", "async"].some((k) => !props[k]) || nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("script", children, props);
  }
  return documentMetadataTag("script", children, props, false);
};
var style = ({
  children,
  ...props
}) => {
  if (!["href", "precedence"].every((k) => k in props)) {
    return returnWithoutSpecialBehavior("style", children, props);
  }
  props["data-href"] = props.href;
  delete props.href;
  return documentMetadataTag("style", children, props, true);
};
var link = ({ children, ...props }) => {
  if (["onLoad", "onError"].some((k) => k in props) || props.rel === "stylesheet" && (!("precedence" in props) || "disabled" in props)) {
    return returnWithoutSpecialBehavior("link", children, props);
  }
  return documentMetadataTag("link", children, props, isStylesheetLinkWithPrecedence(props));
};
var meta = ({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("meta", children, props);
  }
  return documentMetadataTag("meta", children, props, false);
};
var newJSXNode = (tag, { children, ...props }) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new JSXNode(tag, props, toArray(children ?? []))
);
var form = (props) => {
  if (typeof props.action === "function") {
    props.action = PERMALINK in props.action ? props.action[PERMALINK] : void 0;
  }
  return newJSXNode("form", props);
};
var formActionableElement = (tag, props) => {
  if (typeof props.formAction === "function") {
    props.formAction = PERMALINK in props.formAction ? props.formAction[PERMALINK] : void 0;
  }
  return newJSXNode(tag, props);
};
var input = (props) => formActionableElement("input", props);
var button = (props) => formActionableElement("button", props);

// node_modules/hono/dist/jsx/utils.js
var normalizeElementKeyMap = /* @__PURE__ */ new Map([
  ["className", "class"],
  ["htmlFor", "for"],
  ["crossOrigin", "crossorigin"],
  ["httpEquiv", "http-equiv"],
  ["itemProp", "itemprop"],
  ["fetchPriority", "fetchpriority"],
  ["noModule", "nomodule"],
  ["formAction", "formaction"]
]);
var normalizeIntrinsicElementKey = (key) => normalizeElementKeyMap.get(key) || key;
var invalidAttributeNameCharRe = /[\s"'<>/=`\\\x00-\x1f\x7f-\x9f]/;
var validAttributeNameCache = /* @__PURE__ */ new Set();
var validAttributeNameCacheMax = 1024;
var invalidTagNameCharRe = /^[!?]|[\s"'<>/=`\\\x00-\x1f\x7f-\x9f]/;
var validTagNameCache = /* @__PURE__ */ new Set();
var validTagNameCacheMax = 256;
var cacheValidName = (cache, max, name) => {
  if (cache.size >= max) {
    cache.clear();
  }
  cache.add(name);
};
var isValidTagName = (name) => {
  if (validTagNameCache.has(name)) {
    return true;
  }
  if (typeof name !== "string") {
    return false;
  }
  if (name.length === 0) {
    return true;
  }
  if (invalidTagNameCharRe.test(name)) {
    return false;
  }
  cacheValidName(validTagNameCache, validTagNameCacheMax, name);
  return true;
};
var isValidAttributeName = (name) => {
  if (validAttributeNameCache.has(name)) {
    return true;
  }
  const len = name.length;
  if (len === 0) {
    return false;
  }
  for (let i = 0; i < len; i++) {
    const c = name.charCodeAt(i);
    if (!(c >= 97 && c <= 122 || // a-z
    c >= 65 && c <= 90 || // A-Z
    c >= 48 && c <= 57 || // 0-9
    c === 45 || // -
    c === 95 || // _
    c === 46 || // .
    c === 58)) {
      if (!invalidAttributeNameCharRe.test(name)) {
        cacheValidName(validAttributeNameCache, validAttributeNameCacheMax, name);
        return true;
      } else {
        return false;
      }
    }
  }
  cacheValidName(validAttributeNameCache, validAttributeNameCacheMax, name);
  return true;
};
var invalidStylePropertyNameCharRe = /[\s"'():;\\/\[\]{}\x00-\x1f\x7f-\x9f]/;
var validStylePropertyNameCache = /* @__PURE__ */ new Set();
var validStylePropertyNameCacheMax = 1024;
var isValidStylePropertyName = (name) => {
  if (validStylePropertyNameCache.has(name)) {
    return true;
  }
  const len = name.length;
  if (len === 0) {
    return false;
  }
  for (let i = 0; i < len; i++) {
    const c = name.charCodeAt(i);
    if (!(c >= 97 && c <= 122 || // a-z
    c >= 65 && c <= 90 || // A-Z
    c >= 48 && c <= 57 || // 0-9
    c === 45 || // -
    c === 95)) {
      if (!invalidStylePropertyNameCharRe.test(name)) {
        cacheValidName(validStylePropertyNameCache, validStylePropertyNameCacheMax, name);
        return true;
      } else {
        return false;
      }
    }
  }
  cacheValidName(validStylePropertyNameCache, validStylePropertyNameCacheMax, name);
  return true;
};
var unsafeStyleValueCharRe = /[;"'\\/\[\](){}]/;
var hasUnsafeStyleValue = (value) => {
  if (!unsafeStyleValueCharRe.test(value)) {
    return false;
  }
  let quote = 0;
  const blockStack = [];
  for (let i = 0, len = value.length; i < len; i++) {
    const c = value.charCodeAt(i);
    if (c === 92) {
      if (i === len - 1) {
        return true;
      }
      i++;
    } else if (quote !== 0) {
      if (c === 10 || c === 12 || c === 13) {
        return true;
      }
      if (c === quote) {
        quote = 0;
      }
    } else if (c === 47 && value.charCodeAt(i + 1) === 42) {
      const end = value.indexOf("*/", i + 2);
      if (end === -1) {
        return true;
      }
      i = end + 1;
    } else if (c === 34 || c === 39) {
      quote = c;
    } else if (c === 40) {
      blockStack.push(41);
    } else if (c === 91) {
      blockStack.push(93);
    } else if (c === 123 || c === 125) {
      return true;
    } else if (c === 41 || c === 93) {
      if (blockStack[blockStack.length - 1] !== c) {
        return true;
      }
      blockStack.pop();
    } else if (c === 59 && blockStack.length === 0) {
      return true;
    }
  }
  return quote !== 0 || blockStack.length !== 0;
};
var styleObjectForEach = (style2, fn) => {
  for (const [k, v] of Object.entries(style2)) {
    const key = k[0] === "-" || !/[A-Z]/.test(k) ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    if (!isValidStylePropertyName(key)) {
      continue;
    }
    if (v == null) {
      fn(key, null);
      continue;
    }
    let value;
    if (typeof v === "number") {
      value = !key.match(
        /^(?:a|border-im|column(?:-c|s)|flex(?:$|-[^b])|grid-(?:ar|[^a])|font-w|li|or|sca|st|ta|wido|z)|ty$/
      ) ? `${v}px` : `${v}`;
    } else if (typeof v === "string") {
      if (hasUnsafeStyleValue(v)) {
        continue;
      }
      value = v;
    } else {
      continue;
    }
    fn(key, value);
  }
};

// node_modules/hono/dist/jsx/base.js
var nameSpaceContext = void 0;
var getNameSpaceContext = () => nameSpaceContext;
var toSVGAttributeName = (key) => /[A-Z]/.test(key) && // Presentation attributes are findable in style object. "clip-path", "font-size", "stroke-width", etc.
// Or other un-deprecated kebab-case attributes. "overline-position", "paint-order", "strikethrough-position", etc.
key.match(
  /^(?:al|basel|clip(?:Path|Rule)$|co|do|fill|fl|fo|gl|let|lig|i|marker[EMS]|o|pai|pointe|sh|st[or]|text[^L]|tr|u|ve|w)/
) ? key.replace(/([A-Z])/g, "-$1").toLowerCase() : key;
var emptyTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
var booleanAttributes = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "download",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
];
var childrenToStringToBuffer = (children, buffer) => {
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (typeof child === "string") {
      escapeToBuffer(child, buffer);
    } else if (typeof child === "boolean" || child === null || child === void 0) {
      continue;
    } else if (child instanceof JSXNode) {
      child.toStringToBuffer(buffer);
    } else if (typeof child === "number" || child.isEscaped) {
      ;
      buffer[0] += child;
    } else if (child instanceof Promise) {
      buffer.unshift("", child);
    } else {
      childrenToStringToBuffer(child, buffer);
    }
  }
};
var JSXNode = class {
  tag;
  props;
  key;
  children;
  isEscaped = true;
  suspendedContext;
  constructor(tag, props, children) {
    if (typeof tag !== "function" && !isValidTagName(tag)) {
      throw new Error(`Invalid JSX tag name: ${tag}`);
    }
    this.tag = tag;
    this.props = props;
    this.children = children;
  }
  get type() {
    return this.tag;
  }
  // Added for compatibility with libraries that rely on React's internal structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get ref() {
    return this.props.ref || null;
  }
  toString() {
    const render = () => {
      const buffer = [""];
      this.toStringToBuffer(buffer);
      return buffer.length === 1 ? "callbacks" in buffer ? resolveCallbackSync(raw(buffer[0], buffer.callbacks)).toString() : buffer[0] : stringBufferToString(buffer, buffer.callbacks);
    };
    return this.suspendedContext ? this.suspendedContext(render) : runWithRenderContext(render);
  }
  toStringToBuffer(buffer) {
    const tag = this.tag;
    const props = this.props;
    let { children } = this;
    buffer[0] += `<${tag}`;
    const normalizeKey = tag === "svg" || nameSpaceContext && useContext(nameSpaceContext) === "svg" ? (key) => toSVGAttributeName(normalizeIntrinsicElementKey(key)) : (key) => normalizeIntrinsicElementKey(key);
    for (let [key, v] of Object.entries(props)) {
      key = normalizeKey(key);
      if (!isValidAttributeName(key)) {
        continue;
      }
      if (key === "children") {
      } else if (key === "style" && typeof v === "object") {
        let styleStr = "";
        styleObjectForEach(v, (property, value) => {
          if (value != null) {
            styleStr += `${styleStr ? ";" : ""}${property}:${value}`;
          }
        });
        buffer[0] += ' style="';
        escapeToBuffer(styleStr, buffer);
        buffer[0] += '"';
      } else if (typeof v === "string") {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v, buffer);
        buffer[0] += '"';
      } else if (v === null || v === void 0) {
      } else if (typeof v === "number" || v.isEscaped) {
        buffer[0] += ` ${key}="${v}"`;
      } else if (typeof v === "boolean" && booleanAttributes.includes(key)) {
        if (v) {
          buffer[0] += ` ${key}=""`;
        }
      } else if (key === "dangerouslySetInnerHTML") {
        if (children.length > 0) {
          throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
        }
        children = [raw(v.__html)];
      } else if (v instanceof Promise) {
        buffer[0] += ` ${key}="`;
        buffer.unshift('"', v);
      } else if (typeof v === "function") {
        if (!key.startsWith("on") && key !== "ref") {
          throw new Error(`Invalid prop '${key}' of type 'function' supplied to '${tag}'.`);
        }
      } else {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v.toString(), buffer);
        buffer[0] += '"';
      }
    }
    if (emptyTags.includes(tag) && children.length === 0) {
      buffer[0] += "/>";
      return;
    }
    buffer[0] += ">";
    childrenToStringToBuffer(children, buffer);
    buffer[0] += `</${tag}>`;
  }
};
var JSXFunctionNode = class extends JSXNode {
  toStringToBuffer(buffer) {
    const { children } = this;
    const props = { ...this.props };
    if (children.length) {
      props.children = children.length === 1 ? children[0] : children;
    }
    const res = this.tag.call(null, props);
    if (typeof res === "boolean" || res == null) {
      return;
    } else if (res instanceof Promise) {
      if (globalContexts.length === 0) {
        buffer.unshift("", res);
      } else {
        const suspendedContext = captureRenderContext();
        buffer.unshift(
          "",
          res.then((childRes) => {
            if (childRes instanceof JSXNode) {
              childRes.suspendedContext = suspendedContext;
            }
            return childRes;
          })
        );
      }
    } else if (res instanceof JSXNode) {
      res.toStringToBuffer(buffer);
    } else if (typeof res === "number" || res.isEscaped) {
      buffer[0] += res;
      if (res.callbacks) {
        buffer.callbacks ||= [];
        buffer.callbacks.push(...res.callbacks);
      }
    } else {
      escapeToBuffer(res, buffer);
    }
  }
};
var JSXFragmentNode = class extends JSXNode {
  toStringToBuffer(buffer) {
    childrenToStringToBuffer(this.children, buffer);
  }
};
var initDomRenderer = false;
var jsxFn = (tag, props, children) => {
  if (!initDomRenderer) {
    for (const k in domRenderers) {
      ;
      components_exports[k][DOM_RENDERER] = domRenderers[k];
    }
    initDomRenderer = true;
  }
  if (typeof tag === "function") {
    return new JSXFunctionNode(tag, props, children);
  } else if (components_exports[tag]) {
    return new JSXFunctionNode(
      components_exports[tag],
      props,
      children
    );
  } else if (tag === "svg" || tag === "head") {
    nameSpaceContext ||= createContext("");
    return new JSXNode(tag, props, [
      new JSXFunctionNode(
        nameSpaceContext,
        {
          value: tag
        },
        children
      )
    ]);
  } else {
    return new JSXNode(tag, props, children);
  }
};
var Fragment = ({
  children
}) => {
  return new JSXFragmentNode(
    "",
    {
      children
    },
    Array.isArray(children) ? children : children ? [children] : []
  );
};

// node_modules/hono/dist/jsx/jsx-dev-runtime.js
function jsxDEV(tag, props, key) {
  let node;
  if (!props || !("children" in props)) {
    node = jsxFn(tag, props, []);
  } else {
    const children = props.children;
    node = Array.isArray(children) ? jsxFn(tag, props, children) : jsxFn(tag, props, [children]);
  }
  node.key = key;
  return node;
}

// src/components/Layout.tsx
var Layout = (props) => {
  const {
    title: title2,
    description,
    user,
    settings = {},
    cartCount = 0,
    active = "",
    canonical,
    children
  } = props;
  const siteName = settings.site_name || "WebSkill AI";
  const fullTitle = title2 ? `${title2} | ${siteName}` : `${siteName} \u2014 ${settings.site_tagline || ""}`;
  const desc = description || settings.site_tagline || "Kho source code & tool AI t\u1EA1o video";
  const nav = [
    { href: "/", label: "Trang ch\u1EE7", key: "home", icon: "fa-house" },
    { href: "/san-pham", label: "S\u1EA3n ph\u1EA9m", key: "products", icon: "fa-cubes" },
    { href: "/combo", label: "Combo", key: "combo", icon: "fa-box-open" },
    { href: "/bang-gia", label: "B\u1EA3ng gi\xE1", key: "pricing", icon: "fa-tags" },
    { href: "/blog", label: "Blog", key: "blog", icon: "fa-newspaper" },
    { href: "/affiliate", label: "Affiliate", key: "affiliate", icon: "fa-handshake" },
    { href: "/lien-he", label: "Li\xEAn h\u1EC7", key: "contact", icon: "fa-headset" }
  ];
  return /* @__PURE__ */ jsxDEV("html", { lang: "vi", class: "scroll-smooth", children: [
    /* @__PURE__ */ jsxDEV("head", { children: [
      /* @__PURE__ */ jsxDEV("meta", { charset: "UTF-8" }),
      /* @__PURE__ */ jsxDEV("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      /* @__PURE__ */ jsxDEV("title", { children: fullTitle }),
      /* @__PURE__ */ jsxDEV("meta", { name: "description", content: desc }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:title", content: fullTitle }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:description", content: desc }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:type", content: "website" }),
      props.ogImage && /* @__PURE__ */ jsxDEV("meta", { property: "og:image", content: props.ogImage }),
      canonical && /* @__PURE__ */ jsxDEV("link", { rel: "canonical", href: canonical }),
      /* @__PURE__ */ jsxDEV("link", { rel: "icon", href: "/static/favicon.svg", type: "image/svg+xml" }),
      /* @__PURE__ */ jsxDEV("link", { href: "/static/tailwind.css", rel: "stylesheet" }),
      /* @__PURE__ */ jsxDEV("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }),
      /* @__PURE__ */ jsxDEV("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }),
      /* @__PURE__ */ jsxDEV("link", { href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap", rel: "stylesheet" }),
      /* @__PURE__ */ jsxDEV("link", { href: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css", rel: "stylesheet" }),
      /* @__PURE__ */ jsxDEV("link", { href: "/static/style.css", rel: "stylesheet" })
    ] }),
    /* @__PURE__ */ jsxDEV("body", { class: "bg-[#080716] text-[#e2e1f5] antialiased " + (props.bodyClass || ""), children: [
      /* @__PURE__ */ jsxDEV("div", { class: "flex min-h-screen", children: [
        /* @__PURE__ */ jsxDEV("aside", { id: "sidebar", class: "fixed inset-y-0 left-0 z-50 w-64 bg-[#0f0e26] border-r border-[#1f1b4b] flex flex-col justify-between transition-all duration-300 transform -translate-x-full lg:translate-x-0", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex flex-col overflow-y-auto", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "h-16 flex items-center gap-3 px-6 border-b border-[#1f1b4b]", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-lg shadow-indigo-500/25", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-wand-magic-sparkles text-sm" }) }),
              /* @__PURE__ */ jsxDEV("div", { class: "leading-none sidebar-header-text", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "font-extrabold text-sm tracking-tight text-white", children: siteName }),
                /* @__PURE__ */ jsxDEV("div", { class: "text-[9px] text-[#9f9dbb] mt-0.5", children: "AI Video Templates" })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "px-3 py-5 flex flex-col gap-6", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { class: "px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 sidebar-text", children: "Kh\xE1m ph\xE1" }),
                /* @__PURE__ */ jsxDEV("nav", { class: "flex flex-col gap-1", children: [
                  /* @__PURE__ */ jsxDEV("a", { href: "/", class: `sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${active === "home" ? "text-indigo-400 bg-indigo-500/10" : "text-[#b9b8d9] hover:text-white hover:bg-white/5"}`, children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-house w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text", children: "Trang ch\u1EE7" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("a", { href: "/san-pham?sort=hot", class: "sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-fire w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text", children: "B\xE1n ch\u1EA1y nh\u1EA5t" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { class: "px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 sidebar-text", children: "S\u1EA3n ph\u1EA9m" }),
                /* @__PURE__ */ jsxDEV("nav", { class: "flex flex-col gap-1", children: [
                  /* @__PURE__ */ jsxDEV("a", { href: "/san-pham?type=course", class: "sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-graduation-cap w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text", children: "Kh\xF3a h\u1ECDc" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("a", { href: "/san-pham?type=skill", class: "sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-wand-magic-sparkles w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text", children: "Skill AI" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("a", { href: "/san-pham?type=chatbot", class: `sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${active === "chatbot" ? "text-indigo-400 bg-indigo-500/10" : "text-[#b9b8d9] hover:text-white hover:bg-white/5"}`, children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-robot w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text", children: "Chatbot" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("a", { href: "/san-pham?type=app", class: "sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-mobile-screen-button w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text", children: "App Video AI" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("a", { href: "/combo", class: "sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-box-open w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text flex-1 flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxDEV("span", { children: "Combo ti\u1EBFt ki\u1EC7m" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "sidebar-badge text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold leading-none", children: "-60%" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxDEV("a", { href: "/lien-he", class: "sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-video w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text flex-1 flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxDEV("span", { children: "Y\xEAu c\u1EA7u Video AI" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "sidebar-badge text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold leading-none", children: "NEW" })
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { class: "px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 sidebar-text", children: "Kh\xE1c" }),
                /* @__PURE__ */ jsxDEV("nav", { class: "flex flex-col gap-1", children: [
                  /* @__PURE__ */ jsxDEV("a", { href: "/lien-he", class: "sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-user-gear w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text", children: "Custom Chatbot" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("a", { href: "/bang-gia", class: `sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${active === "pricing" ? "text-indigo-400 bg-indigo-500/10" : "text-[#b9b8d9] hover:text-white hover:bg-white/5"}`, children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-tags w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text", children: "B\u1EA3ng gi\xE1" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("a", { href: "/gioi-thieu", class: "sidebar-menu-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition text-[#b9b8d9] hover:text-white hover:bg-white/5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-info-circle w-5 text-center text-slate-400" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text", children: "Gi\u1EDBi thi\u1EC7u" })
                  ] })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "p-3 border-t border-[#1f1b4b]", children: /* @__PURE__ */ jsxDEV("button", { id: "sidebar-toggle-btn", class: "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-angles-left w-5 text-center" }),
            /* @__PURE__ */ jsxDEV("span", { class: "sidebar-text", children: "Thu nh\u1ECF" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { id: "main-content-wrap", class: "flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 overflow-hidden", children: [
          /* @__PURE__ */ jsxDEV("header", { id: "site-header", class: "sticky top-0 z-40 bg-[#0f0e26]/85 backdrop-blur border-b border-[#1f1b4b]", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 sm:px-6", children: /* @__PURE__ */ jsxDEV("div", { class: "h-16 flex items-center justify-between gap-4", children: [
              /* @__PURE__ */ jsxDEV("a", { href: "/", class: "flex lg:hidden items-center gap-2 shrink-0 group", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-lg", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-wand-magic-sparkles text-xs" }) }),
                /* @__PURE__ */ jsxDEV("span", { class: "font-extrabold text-sm tracking-tight text-white", children: siteName })
              ] }),
              /* @__PURE__ */ jsxDEV("nav", { id: "main-nav", class: "hidden lg:flex items-center gap-1.5", children: nav.map((n) => /* @__PURE__ */ jsxDEV(
                "a",
                {
                  href: n.href,
                  class: `px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${active === n.key ? "text-indigo-400 bg-indigo-500/10" : "text-[#9f9dbb] hover:text-white"}`,
                  children: n.label
                }
              )) }),
              /* @__PURE__ */ jsxDEV("form", { action: "/san-pham", method: "get", class: "hidden md:flex flex-1 max-w-xs ml-auto", children: /* @__PURE__ */ jsxDEV("div", { class: "relative w-full", children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "text",
                    name: "q",
                    placeholder: "T\xECm s\u1EA3n ph\u1EA9m...",
                    id: "header-search",
                    class: "w-full h-9 pl-9 pr-3 rounded-lg bg-[#16143c] border border-transparent focus:border-indigo-500/50 text-xs text-white placeholder-slate-500 outline-none transition"
                  }
                ),
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" })
              ] }) }),
              /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxDEV("a", { href: "/gio-hang", id: "cart-btn", class: "relative w-9 h-9 grid place-items-center rounded-lg bg-[#16143c] hover:bg-white/5 text-[#b9b8d9] hover:text-white transition", children: [
                  /* @__PURE__ */ jsxDEV("i", { class: "fas fa-cart-shopping text-sm" }),
                  /* @__PURE__ */ jsxDEV("span", { id: "cart-badge", class: `absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center ${cartCount > 0 ? "" : "hidden"}`, children: cartCount })
                ] }),
                user ? /* @__PURE__ */ jsxDEV("div", { class: "relative", id: "user-menu-wrap", children: [
                  /* @__PURE__ */ jsxDEV("button", { id: "user-menu-btn", class: "flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg bg-[#16143c] hover:bg-white/5 text-[#b9b8d9] hover:text-white transition", children: [
                    /* @__PURE__ */ jsxDEV("div", { class: "w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center text-xs font-bold uppercase shadow-sm", children: user.full_name.charAt(0).toUpperCase() }),
                    /* @__PURE__ */ jsxDEV("span", { class: "hidden sm:block text-xs font-medium max-w-[90px] truncate", children: user.full_name }),
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-chevron-down text-[9px] text-slate-500" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { id: "user-dropdown", class: "hidden absolute right-0 mt-2 w-52 bg-[#0f0e26] rounded-xl shadow-xl border border-[#1f1b4b] py-1.5 overflow-hidden", children: [
                    /* @__PURE__ */ jsxDEV("div", { class: "px-4 py-2 border-b border-[#1f1b4b]", children: [
                      /* @__PURE__ */ jsxDEV("div", { class: "text-xs font-bold text-white truncate", children: user.full_name }),
                      /* @__PURE__ */ jsxDEV("div", { class: "text-[10px] text-slate-500 truncate", children: user.email })
                    ] }),
                    /* @__PURE__ */ jsxDEV("a", { href: "/tai-khoan", class: "flex items-center gap-2 px-4 py-2 text-xs text-[#b9b8d9] hover:bg-white/5 hover:text-white", children: [
                      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-gauge w-4 text-slate-500" }),
                      "T\u1ED5ng quan"
                    ] }),
                    /* @__PURE__ */ jsxDEV("a", { href: "/tai-khoan/san-pham", class: "flex items-center gap-2 px-4 py-2 text-xs text-[#b9b8d9] hover:bg-white/5 hover:text-white", children: [
                      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-box-archive w-4 text-slate-500" }),
                      "S\u1EA3n ph\u1EA9m c\u1EE7a t\xF4i"
                    ] }),
                    /* @__PURE__ */ jsxDEV("a", { href: "/tai-khoan/don-hang", class: "flex items-center gap-2 px-4 py-2 text-xs text-[#b9b8d9] hover:bg-white/5 hover:text-white", children: [
                      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-receipt w-4 text-slate-500" }),
                      "\u0110\u01A1n h\xE0ng"
                    ] }),
                    /* @__PURE__ */ jsxDEV("a", { href: "/tai-khoan/affiliate", class: "flex items-center gap-2 px-4 py-2 text-xs text-[#b9b8d9] hover:bg-white/5 hover:text-white", children: [
                      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-handshake w-4 text-slate-500" }),
                      "Affiliate"
                    ] }),
                    /* @__PURE__ */ jsxDEV("a", { href: "/tai-khoan/ho-so", class: "flex items-center gap-2 px-4 py-2 text-xs text-[#b9b8d9] hover:bg-white/5 hover:text-white", children: [
                      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-user-gear w-4 text-slate-500" }),
                      "H\u1ED3 s\u01A1"
                    ] }),
                    user.role === "admin" && /* @__PURE__ */ jsxDEV("a", { href: "/admin", class: "flex items-center gap-2 px-4 py-2 text-xs text-amber-400 hover:bg-white/5 border-t border-[#1f1b4b]", children: [
                      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-shield-halved w-4" }),
                      "Qu\u1EA3n tr\u1ECB"
                    ] }),
                    /* @__PURE__ */ jsxDEV("a", { href: "/dang-xuat", class: "flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-white/5 border-t border-[#1f1b4b]", children: [
                      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-right-from-bracket w-4" }),
                      "\u0110\u0103ng xu\u1EA5t"
                    ] })
                  ] })
                ] }) : /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsxDEV("a", { href: "/dang-nhap", class: "hidden sm:block px-3 h-9 leading-9 rounded-lg text-xs font-semibold text-[#b9b8d9] hover:bg-white/5 transition", children: "\u0110\u0103ng nh\u1EADp" }),
                  /* @__PURE__ */ jsxDEV("a", { href: "/dang-ky", class: "px-3.5 h-9 leading-9 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-90 shadow-md shadow-indigo-600/20 transition", children: "\u0110\u0103ng k\xFD" })
                ] }),
                /* @__PURE__ */ jsxDEV("button", { id: "mobile-menu-btn", class: "lg:hidden w-9 h-9 grid place-items-center rounded-lg bg-[#16143c] hover:bg-white/5 text-[#b9b8d9] hover:text-white", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-bars" }) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxDEV("div", { id: "mobile-nav", class: "hidden lg:hidden border-t border-[#1f1b4b] bg-[#0f0e26]", children: /* @__PURE__ */ jsxDEV("div", { class: "px-4 py-3 flex flex-col gap-2", children: [
              /* @__PURE__ */ jsxDEV("form", { action: "/san-pham", method: "get", class: "mb-2", children: /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "text",
                    name: "q",
                    placeholder: "T\xECm s\u1EA3n ph\u1EA9m...",
                    class: "w-full h-10 pl-10 pr-3 rounded-lg bg-[#16143c] border border-transparent text-xs text-white placeholder-slate-500 outline-none"
                  }
                ),
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" })
              ] }) }),
              /* @__PURE__ */ jsxDEV("div", { class: "grid grid-cols-2 gap-1.5", children: nav.map((n) => /* @__PURE__ */ jsxDEV("a", { href: n.href, class: `flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold ${active === n.key ? "bg-indigo-500/10 text-indigo-400" : "text-[#b9b8d9] hover:bg-white/5"}`, children: [
                /* @__PURE__ */ jsxDEV("i", { class: `fas ${n.icon} w-4 text-center text-slate-400` }),
                n.label
              ] })) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxDEV("main", { id: "main-content", class: "flex-1", children }),
          /* @__PURE__ */ jsxDEV("footer", { id: "site-footer", class: "bg-[#0b0a19] text-[#9f9dbb] border-t border-[#1f1b4b] mt-16", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 py-12", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2.5 mb-4", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white shadow-lg", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-wand-magic-sparkles text-sm" }) }),
                  /* @__PURE__ */ jsxDEV("span", { class: "font-extrabold text-base text-white", children: siteName })
                ] }),
                /* @__PURE__ */ jsxDEV("p", { class: "text-xs leading-relaxed mb-4", children: settings.site_tagline }),
                /* @__PURE__ */ jsxDEV("div", { class: "flex gap-2", children: [
                  /* @__PURE__ */ jsxDEV("a", { href: settings.facebook || "#", target: "_blank", rel: "noopener", class: "w-8 h-8 rounded-lg bg-[#16143c] hover:bg-indigo-600 grid place-items-center transition text-slate-300 hover:text-white", children: /* @__PURE__ */ jsxDEV("i", { class: "fab fa-facebook-f text-xs" }) }),
                  /* @__PURE__ */ jsxDEV("a", { href: `https://zalo.me/${settings.zalo}`, target: "_blank", rel: "noopener", class: "w-8 h-8 rounded-lg bg-[#16143c] hover:bg-[#0068ff] grid place-items-center transition text-slate-300 hover:text-white text-[10px] font-bold", children: "Zalo" }),
                  /* @__PURE__ */ jsxDEV("a", { href: "#", class: "w-8 h-8 rounded-lg bg-[#16143c] hover:bg-red-600 grid place-items-center transition text-slate-300 hover:text-white", children: /* @__PURE__ */ jsxDEV("i", { class: "fab fa-youtube text-xs" }) }),
                  /* @__PURE__ */ jsxDEV("a", { href: "#", class: "w-8 h-8 rounded-lg bg-[#16143c] hover:bg-slate-900 grid place-items-center transition text-slate-300 hover:text-white", children: /* @__PURE__ */ jsxDEV("i", { class: "fab fa-tiktok text-xs" }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("h4", { class: "text-white font-bold mb-4 text-xs uppercase tracking-wider", children: "S\u1EA3n ph\u1EA9m" }),
                /* @__PURE__ */ jsxDEV("ul", { class: "space-y-2 text-xs", children: [
                  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/san-pham?type=course", class: "hover:text-indigo-400 transition", children: "Kh\xF3a h\u1ECDc Video AI" }) }),
                  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/san-pham?type=skill", class: "hover:text-indigo-400 transition", children: "Skill T\u1EA1o Video AI" }) }),
                  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/san-pham?type=chatbot", class: "hover:text-indigo-400 transition", children: "Chatbot K\u1ECBch B\u1EA3n" }) }),
                  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/san-pham?type=app", class: "hover:text-indigo-400 transition", children: "App L\xE0m Video AI" }) }),
                  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/combo", class: "hover:text-indigo-400 transition", children: "Combo Tr\u1ECDn B\u1ED9" }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("h4", { class: "text-white font-bold mb-4 text-xs uppercase tracking-wider", children: "H\u1ED7 tr\u1EE3" }),
                /* @__PURE__ */ jsxDEV("ul", { class: "space-y-2 text-xs", children: [
                  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/huong-dan", class: "hover:text-indigo-400 transition", children: "H\u01B0\u1EDBng d\u1EABn mua h\xE0ng" }) }),
                  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/chinh-sach", class: "hover:text-indigo-400 transition", children: "Ch\xEDnh s\xE1ch b\u1EA3o h\xE0nh" }) }),
                  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/dieu-khoan", class: "hover:text-indigo-400 transition", children: "\u0110i\u1EC1u kho\u1EA3n s\u1EED d\u1EE5ng" }) }),
                  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/lien-he", class: "hover:text-indigo-400 transition", children: "Li\xEAn h\u1EC7 h\u1ED7 tr\u1EE3" }) }),
                  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/gioi-thieu", class: "hover:text-indigo-400 transition", children: "V\u1EC1 ch\xFAng t\xF4i" }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("h4", { class: "text-white font-bold mb-4 text-xs uppercase tracking-wider", children: "Li\xEAn h\u1EC7" }),
                /* @__PURE__ */ jsxDEV("ul", { class: "space-y-3 text-xs", children: [
                  /* @__PURE__ */ jsxDEV("li", { class: "flex gap-2.5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-phone-volume mt-0.5 text-indigo-400" }),
                    /* @__PURE__ */ jsxDEV("span", { children: [
                      "Hotline: ",
                      /* @__PURE__ */ jsxDEV("b", { class: "text-white", children: settings.hotline })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxDEV("li", { class: "flex gap-2.5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-envelope mt-0.5 text-indigo-400" }),
                    /* @__PURE__ */ jsxDEV("span", { children: settings.email })
                  ] }),
                  /* @__PURE__ */ jsxDEV("li", { class: "flex gap-2.5", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fab fa-facebook-messenger mt-0.5 text-indigo-400" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Chat Zalo/Messenger 24/7" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "mt-10 pt-6 border-t border-[#1f1b4b] flex flex-col md:flex-row items-center justify-between gap-3 text-[10px]", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                "\xA9 2026 ",
                siteName,
                ". T\u1EA5t c\u1EA3 c\xE1c quy\u1EC1n \u0111\u01B0\u1EE3c b\u1EA3o l\u01B0u."
              ] }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                "Ph\xE1t tri\u1EC3n v\u1EDBi ",
                /* @__PURE__ */ jsxDEV("span", { class: "text-rose-500", children: "\u2665" }),
                " t\u1EA1i Vi\u1EC7t Nam"
              ] })
            ] })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { id: "float-contact", class: "fixed right-4 bottom-4 z-45 flex flex-col gap-2.5", children: [
        /* @__PURE__ */ jsxDEV(
          "a",
          {
            href: `https://zalo.me/${settings.zalo}`,
            target: "_blank",
            rel: "noopener",
            class: "w-11 h-11 rounded-full bg-[#0068ff] text-white grid place-items-center shadow-xl hover:scale-110 transition text-[10px] font-bold",
            title: "Chat Zalo",
            children: "Zalo"
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "a",
          {
            href: `tel:${(settings.hotline || "").replace(/\s/g, "")}`,
            class: "w-11 h-11 rounded-full bg-emerald-500 text-white grid place-items-center shadow-xl hover:scale-110 transition text-sm",
            title: "G\u1ECDi ngay",
            children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-phone" })
          }
        ),
        /* @__PURE__ */ jsxDEV("button", { id: "back-to-top", class: "w-11 h-11 rounded-full bg-[#16143c] border border-[#1f1b4b] text-white grid place-items-center shadow-xl hover:scale-110 transition opacity-0 pointer-events-none text-sm", title: "L\xEAn \u0111\u1EA7u trang", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-up" }) })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { id: "toast-container", class: "fixed top-20 right-4 z-[100] flex flex-col gap-2" }),
      /* @__PURE__ */ jsxDEV("script", { src: "https://cdn.jsdelivr.net/npm/axios@1.6.7/dist/axios.min.js" }),
      /* @__PURE__ */ jsxDEV("script", { src: "/static/app.js" })
    ] })
  ] });
};

// src/components/ui.tsx
var Stars = ({ rating, size = "text-xs" }) => /* @__PURE__ */ jsxDEV("span", { class: `text-amber-400 ${size}`, children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxDEV("i", { class: `fa-star ${rating >= i ? "fas" : rating >= i - 0.5 ? "fas fa-star-half-stroke" : "far"}` })) });
var ProductCard = ({ p, compact }) => {
  const off = discountPercent(p.price, p.original_price);
  return /* @__PURE__ */ jsxDEV("article", { class: "product-card group bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-500/30 transition-all duration-300 flex flex-col", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "relative aspect-[10/16] overflow-hidden bg-[#080716]", style: p.thumbnail ? "" : `background:${gradientFor(p.id)}`, children: [
      p.thumbnail ? /* @__PURE__ */ jsxDEV("img", { src: p.thumbnail, alt: p.name, loading: "lazy", class: "w-full h-full object-cover group-hover:scale-105 transition duration-500" }) : /* @__PURE__ */ jsxDEV("div", { class: "w-full h-full grid place-items-center text-white/95 p-4 text-center", children: /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("i", { class: `fas ${PRODUCT_TYPE_ICON[p.product_type] || "fa-cube"} text-4xl mb-2 opacity-95` }),
        /* @__PURE__ */ jsxDEV("div", { class: "text-[11px] font-bold uppercase tracking-widest opacity-80", children: PRODUCT_TYPE_LABEL[p.product_type] || "S\u1EA3n ph\u1EA9m" })
      ] }) }),
      /* @__PURE__ */ jsxDEV("div", { class: "absolute top-3 left-3 flex flex-col gap-1.5 z-10", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-1 rounded bg-amber-500 text-black text-[9px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-crown text-[8px]" }),
          "Premium"
        ] }),
        off > 0 && /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold shadow-md", children: [
          "-",
          off,
          "%"
        ] }),
        p.is_hot === 1 && /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-0.5 rounded bg-orange-500 text-white text-[9px] font-bold shadow-md flex items-center gap-0.5", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-fire text-[8px]" }),
          "HOT"
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "absolute top-3 right-3 z-10", children: /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-1 rounded bg-[#0068ff] text-white text-[9px] font-black tracking-wider uppercase shadow-md", children: PRODUCT_TYPE_LABEL[p.product_type] || "S\u1EA3n ph\u1EA9m" }) }),
      p.demo_video_url && /* @__PURE__ */ jsxDEV("div", { class: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition duration-300 z-20", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: "w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition duration-300 cursor-pointer",
            "data-video": p.demo_video_url,
            "data-aspect": "vertical",
            title: "Xem Demo",
            children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-play text-sm ml-0.5" })
          }
        ),
        /* @__PURE__ */ jsxDEV("span", { class: "text-white text-xs font-semibold tracking-wide", children: "Xem Demo" })
      ] }),
      /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${p.slug}`, class: "absolute inset-0 z-10", "aria-label": `Xem chi ti\u1EBFt ${p.name}` })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "p-4 flex flex-col flex-1", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2 mb-2 text-[10px] text-[#9f9dbb]", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold uppercase", children: PRODUCT_TYPE_LABEL[p.product_type] }),
        /* @__PURE__ */ jsxDEV("span", { children: p.version })
      ] }),
      /* @__PURE__ */ jsxDEV("h3", { class: "font-semibold text-sm leading-snug text-white line-clamp-2 mb-2 group-hover:text-indigo-400 transition", children: /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${p.slug}`, children: p.name }) }),
      !compact && /* @__PURE__ */ jsxDEV("p", { class: "text-[12px] text-[#9f9dbb] line-clamp-2 mb-3 leading-relaxed", children: p.short_desc }),
      /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-3 text-[11px] text-[#9f9dbb] mb-4", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxDEV(Stars, { rating: p.rating }),
          /* @__PURE__ */ jsxDEV("b", { class: "text-white", children: p.rating.toFixed(1) })
        ] }),
        /* @__PURE__ */ jsxDEV("span", { children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-cart-shopping mr-1 text-slate-500" }),
          p.sold_count,
          " \u0111\xE3 b\xE1n"
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "mt-auto pt-3 border-t border-[#1f1b4b] flex items-end justify-between gap-2", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          p.original_price && p.original_price > p.price && /* @__PURE__ */ jsxDEV("div", { class: "text-[10px] text-slate-500 line-through leading-none mb-0.5", children: formatVND(p.original_price) }),
          /* @__PURE__ */ jsxDEV("div", { class: "text-base font-extrabold text-[#f43f5e] leading-none", children: formatVND(p.price) })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              class: "btn-wishlist w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:border-rose-500 text-slate-400 hover:text-rose-500 flex items-center justify-center transition",
              "data-id": p.id,
              title: "Y\xEAu th\xEDch",
              children: /* @__PURE__ */ jsxDEV("i", { class: "far fa-heart text-xs" })
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              class: "btn-add-cart h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition shadow-md shadow-indigo-600/10",
              "data-id": p.id,
              "data-name": p.name,
              children: "Th\xEAm"
            }
          )
        ] })
      ] })
    ] })
  ] });
};
var SectionTitle = ({ title: title2, subtitle, center, more }) => /* @__PURE__ */ jsxDEV("div", { class: `flex items-end justify-between gap-4 mb-7 ${center ? "flex-col items-center text-center" : ""}`, children: [
  /* @__PURE__ */ jsxDEV("div", { children: [
    /* @__PURE__ */ jsxDEV("h2", { class: "text-2xl md:text-3xl font-extrabold text-white tracking-tight", children: title2 }),
    subtitle && /* @__PURE__ */ jsxDEV("p", { class: "text-[#9f9dbb] mt-1.5 text-sm md:text-base", children: subtitle })
  ] }),
  more && /* @__PURE__ */ jsxDEV("a", { href: more.href, class: "shrink-0 text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:gap-2 flex items-center gap-1.5 transition-all", children: [
    more.label,
    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-right text-xs" })
  ] })
] });
var CategoryCard = ({ c }) => /* @__PURE__ */ jsxDEV("a", { href: `/danh-muc/${c.slug}`, class: "group relative p-5 rounded-2xl bg-[#0f0e26] border border-[#1f1b4b] hover:border-indigo-500/30 hover:shadow-lg transition-all overflow-hidden", children: [
  /* @__PURE__ */ jsxDEV("div", { class: `w-11 h-11 rounded-xl grid place-items-center text-white mb-3.5 shadow-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 group-hover:scale-110 transition`, children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${c.icon}` }) }),
  /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-1 group-hover:text-indigo-400 transition", children: c.name }),
  /* @__PURE__ */ jsxDEV("p", { class: "text-[13px] text-[#9f9dbb] line-clamp-2 leading-relaxed", children: c.description }),
  /* @__PURE__ */ jsxDEV("div", { class: "mt-3 text-xs font-semibold text-indigo-400", children: [
    c.product_count ?? 0,
    " s\u1EA3n ph\u1EA9m ",
    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-right ml-0.5 text-[10px]" })
  ] })
] });
var Breadcrumb = ({ items }) => /* @__PURE__ */ jsxDEV("nav", { class: "text-[13px] text-slate-500 mb-5", "aria-label": "Breadcrumb", children: /* @__PURE__ */ jsxDEV("ol", { class: "flex flex-wrap items-center gap-1.5", children: [
  /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/", class: "hover:text-brand-600", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-house" }) }) }),
  items.map((i) => /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("li", { class: "text-slate-300", children: "/" }),
    /* @__PURE__ */ jsxDEV("li", { children: i.href ? /* @__PURE__ */ jsxDEV("a", { href: i.href, class: "hover:text-brand-600", children: i.label }) : /* @__PURE__ */ jsxDEV("span", { class: "text-slate-800 font-medium", children: i.label }) })
  ] }))
] }) });
var Pagination = ({ page, totalPages, baseUrl }) => {
  if (totalPages <= 1) return /* @__PURE__ */ jsxDEV(Fragment, {});
  const sep = baseUrl.includes("?") ? "&" : "?";
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
  }
  return /* @__PURE__ */ jsxDEV("nav", { class: "flex items-center justify-center gap-1.5 mt-10", children: [
    page > 1 && /* @__PURE__ */ jsxDEV("a", { href: `${baseUrl}${sep}page=${page - 1}`, class: "h-9 px-3 grid place-items-center rounded-lg bg-white border border-slate-200 hover:border-brand-400 text-sm", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-chevron-left text-xs" }) }),
    pages.map((p, idx) => /* @__PURE__ */ jsxDEV(Fragment, { children: [
      idx > 0 && pages[idx - 1] !== p - 1 && /* @__PURE__ */ jsxDEV("span", { class: "px-1 text-slate-400", children: "\u2026" }),
      /* @__PURE__ */ jsxDEV(
        "a",
        {
          href: `${baseUrl}${sep}page=${p}`,
          class: `h-9 min-w-[36px] px-2 grid place-items-center rounded-lg text-sm font-medium border transition ${p === page ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-200 hover:border-brand-400"}`,
          children: p
        }
      )
    ] })),
    page < totalPages && /* @__PURE__ */ jsxDEV("a", { href: `${baseUrl}${sep}page=${page + 1}`, class: "h-9 px-3 grid place-items-center rounded-lg bg-white border border-slate-200 hover:border-brand-400 text-sm", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-chevron-right text-xs" }) })
  ] });
};
var EmptyState = ({ icon = "fa-box-open", title: title2, desc, action }) => /* @__PURE__ */ jsxDEV("div", { class: "text-center py-16 px-4", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "w-16 h-16 rounded-2xl bg-slate-100 grid place-items-center text-slate-400 text-2xl mx-auto mb-4", children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${icon}` }) }),
  /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-lg text-slate-800 mb-1.5", children: title2 }),
  desc && /* @__PURE__ */ jsxDEV("p", { class: "text-slate-500 text-sm mb-5 max-w-md mx-auto", children: desc }),
  action && /* @__PURE__ */ jsxDEV("a", { href: action.href, class: "inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition", children: action.label })
] });
var StatusBadge = ({ status }) => {
  const map = {
    pending: ["bg-amber-100 text-amber-700", "Ch\u1EDD thanh to\xE1n"],
    paid: ["bg-emerald-100 text-emerald-700", "\u0110\xE3 thanh to\xE1n"],
    cancelled: ["bg-slate-200 text-slate-600", "\u0110\xE3 hu\u1EF7"],
    refunded: ["bg-rose-100 text-rose-700", "\u0110\xE3 ho\xE0n ti\u1EC1n"],
    active: ["bg-emerald-100 text-emerald-700", "Ho\u1EA1t \u0111\u1ED9ng"],
    banned: ["bg-rose-100 text-rose-700", "B\u1ECB kho\xE1"],
    published: ["bg-emerald-100 text-emerald-700", "Hi\u1EC3n th\u1ECB"],
    draft: ["bg-slate-200 text-slate-600", "Nh\xE1p"],
    open: ["bg-blue-100 text-blue-700", "\u0110ang m\u1EDF"],
    closed: ["bg-slate-200 text-slate-600", "\u0110\xE3 \u0111\xF3ng"]
  };
  const [cls, label] = map[status] || ["bg-slate-100 text-slate-600", status];
  return /* @__PURE__ */ jsxDEV("span", { class: `inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${cls}`, children: label });
};
var PostCard = ({ p }) => /* @__PURE__ */ jsxDEV("article", { class: "group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition", children: [
  /* @__PURE__ */ jsxDEV("a", { href: `/blog/${p.slug}`, class: "block aspect-[16/9] relative", style: `background:${gradientFor(p.id + 3)}`, children: p.thumbnail ? /* @__PURE__ */ jsxDEV("img", { src: p.thumbnail, alt: p.title, loading: "lazy", class: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxDEV("div", { class: "w-full h-full grid place-items-center text-white/90 text-3xl", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-newspaper" }) }) }),
  /* @__PURE__ */ jsxDEV("div", { class: "p-4", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "text-[11px] text-slate-400 mb-2 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxDEV("span", { children: [
        /* @__PURE__ */ jsxDEV("i", { class: "far fa-calendar mr-1" }),
        formatDate(p.created_at)
      ] }),
      /* @__PURE__ */ jsxDEV("span", { children: [
        /* @__PURE__ */ jsxDEV("i", { class: "far fa-eye mr-1" }),
        p.view_count
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 leading-snug line-clamp-2 mb-2 group-hover:text-brand-600 transition", children: /* @__PURE__ */ jsxDEV("a", { href: `/blog/${p.slug}`, children: p.title }) }),
    /* @__PURE__ */ jsxDEV("p", { class: "text-[13px] text-slate-500 line-clamp-2 leading-relaxed", children: p.excerpt })
  ] })
] });

// src/pages/home.tsx
var BENEFITS = [
  { icon: "fa-bolt", title: "Giao h\xE0ng t\u1EF1 \u0111\u1ED9ng 24/7", desc: "Thanh to\xE1n xong nh\u1EADn link t\u1EA3i, link k\xEDch ho\u1EA1t ho\u1EB7c key b\u1EA3n quy\u1EC1n ngay trong t\xE0i kho\u1EA3n, kh\xF4ng c\u1EA7n ch\u1EDD admin." },
  { icon: "fa-infinity", title: "S\u1EDF h\u1EEFu tr\u1ECDn \u0111\u1EDDi", desc: "Mua m\u1ED9t l\u1EA7n d\xF9ng m\xE3i m\xE3i, kh\xF4ng ph\xED \u1EA9n, kh\xF4ng gi\u1EDBi h\u1EA1n th\u1EDDi gian, nh\u1EADn m\u1ECDi b\u1EA3n c\u1EADp nh\u1EADt mi\u1EC5n ph\xED." },
  { icon: "fa-wand-magic-sparkles", title: "Skill th\u1EF1c chi\u1EBFn, test k\u1EF9", desc: "M\u1ED7i skill, chatbot v\xE0 kh\xF3a h\u1ECDc \u0111\u1EC1u \u0111\xE3 ch\u1EA1y th\u1EF1c t\u1EBF ra video demo b\u1EA1n xem \u0111\u01B0\u1EE3c ngay tr\xEAn trang s\u1EA3n ph\u1EA9m." },
  { icon: "fa-headset", title: "H\u1ED7 tr\u1EE3 1-1", desc: "\u0110\u1ED9i ng\u0169 h\u1ED7 tr\u1EE3 qua Zalo/Ultraview, c\u1EA7m tay ch\u1EC9 vi\u1EC7c \u0111\u1EBFn khi b\u1EA1n t\u1EF1 l\xE0m \u0111\u01B0\u1EE3c video \u0111\u1EA7u ti\xEAn." },
  { icon: "fa-shield-halved", title: "B\u1EA3o h\xE0nh & ho\xE0n ti\u1EC1n", desc: "Ho\xE0n ti\u1EC1n 100% trong 7 ng\xE0y n\u1EBFu s\u1EA3n ph\u1EA9m kh\xF4ng \u0111\xFAng nh\u01B0 m\xF4 t\u1EA3 ho\u1EB7c video demo." },
  { icon: "fa-rocket", title: "C\u1EADp nh\u1EADt theo model m\u1EDBi", desc: "Skill v\xE0 kh\xF3a h\u1ECDc \u0111\u01B0\u1EE3c n\xE2ng c\u1EA5p li\xEAn t\u1EE5c theo Muse AI, Seedance, Veo, Flow... ho\xE0n to\xE0n mi\u1EC5n ph\xED." }
];
var STEPS = [
  { n: "01", icon: "fa-user-plus", title: "\u0110\u0103ng k\xFD t\xE0i kho\u1EA3n", desc: "T\u1EA1o t\xE0i kho\u1EA3n mi\u1EC5n ph\xED ch\u1EC9 v\u1EDBi email trong 30 gi\xE2y." },
  { n: "02", icon: "fa-cart-shopping", title: "Ch\u1ECDn s\u1EA3n ph\u1EA9m", desc: "Xem video demo, \u0111\u1ECDc m\xF4 t\u1EA3 chi ti\u1EBFt r\u1ED3i th\xEAm v\xE0o gi\u1ECF h\xE0ng." },
  { n: "03", icon: "fa-qrcode", title: "Thanh to\xE1n QR", desc: "Qu\xE9t m\xE3 VietQR chuy\u1EC3n kho\u1EA3n, h\u1EC7 th\u1ED1ng x\xE1c nh\u1EADn nhanh ch\xF3ng." },
  { n: "04", icon: "fa-download", title: "Nh\u1EADn s\u1EA3n ph\u1EA9m", desc: 'Link t\u1EA3i + license key xu\u1EA5t hi\u1EC7n ngay trong "S\u1EA3n ph\u1EA9m c\u1EE7a t\xF4i".' }
];
var FAQS = [
  { q: "Mua kh\xF3a h\u1ECDc / skill th\xEC t\xF4i nh\u1EADn \u0111\u01B0\u1EE3c g\xEC?", a: "B\u1EA1n nh\u1EADn to\xE0n b\u1ED9 n\u1ED9i dung s\u1ED1 c\u1EE7a s\u1EA3n ph\u1EA9m: video b\xE0i gi\u1EA3ng + t\xE0i li\u1EC7u v\u1EDBi kh\xF3a h\u1ECDc; b\u1ED9 prompt, quy tr\xECnh v\xE0 file c\u1EA5u h\xECnh v\u1EDBi skill; link chatbot ri\xEAng v\u1EDBi chatbot; b\u1ED9 c\xE0i/app v\u1EDBi app. T\u1EA5t c\u1EA3 \u0111\u01B0\u1EE3c giao t\u1EF1 \u0111\u1ED9ng ngay sau khi thanh to\xE1n." },
  { q: "T\xF4i kh\xF4ng bi\u1EBFt g\xEC v\u1EC1 AI th\xEC c\xF3 h\u1ECDc \u0111\u01B0\u1EE3c kh\xF4ng?", a: "C\xF3. M\u1ED7i kh\xF3a h\u1ECDc v\xE0 skill \u0111\u1EC1u thi\u1EBFt k\u1EBF cho ng\u01B0\u1EDDi m\u1EDBi: xem video demo tr\u01B0\u1EDBc khi mua, l\xE0m theo t\u1EEBng b\u01B0\u1EDBc c\xF3 h\xECnh \u1EA3nh minh ho\u1EA1. Ngo\xE0i ra ch\xFAng t\xF4i h\u1ED7 tr\u1EE3 1-1 qua Zalo n\u1EBFu b\u1EA1n c\u1EA7n." },
  { q: "Skill t\u1EA1o video AI ho\u1EA1t \u0111\u1ED9ng nh\u01B0 th\u1EBF n\xE0o?", a: "Sau khi mua, b\u1EA1n nh\u1EADn b\u1ED9 skill g\u1ED3m prompt, quy tr\xECnh v\xE0 file c\u1EA5u h\xECnh cho \u0111\xFAng ng\xE1ch c\u1EE7a m\xECnh (Thu\u1EF7 Sinh, L\xE0m V\u01B0\u1EDDn, Fitness...). Ch\u1EC9 c\u1EA7n l\xE0m theo l\xE0 ra video 30s \u0111\xFAng chu\u1EA9n \u0111\u1EC3 build page Reels/TikTok." },
  { q: "Thanh to\xE1n xong bao l\xE2u th\xEC nh\u1EADn \u0111\u01B0\u1EE3c h\xE0ng?", a: 'H\u1EC7 th\u1ED1ng giao t\u1EF1 \u0111\u1ED9ng. Ngay khi \u0111\u01A1n h\xE0ng \u0111\u01B0\u1EE3c x\xE1c nh\u1EADn thanh to\xE1n, link t\u1EA3i v\xE0 license key s\u1EBD xu\u1EA5t hi\u1EC7n trong m\u1EE5c "S\u1EA3n ph\u1EA9m c\u1EE7a t\xF4i".' },
  { q: "C\xF3 \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3 khi g\u1EB7p l\u1ED7i kh\xF4ng?", a: "C\xF3. M\u1ED7i s\u1EA3n ph\u1EA9m \u0111i k\xE8m h\u1ED7 tr\u1EE3 qua Zalo. V\u1EDBi g\xF3i Combo All-In-One b\u1EA1n c\xF2n \u0111\u01B0\u1EE3c \u01B0u ti\xEAn h\u1ED7 tr\u1EE3 1-1 tr\u1EF1c ti\u1EBFp." },
  { q: "T\xF4i c\xF3 th\u1EC3 d\xF9ng skill cho nhi\u1EC1u k\xEAnh kh\xF4ng?", a: "C\xF3. Skill mua m\u1ED9t l\u1EA7n d\xF9ng kh\xF4ng gi\u1EDBi h\u1EA1n cho m\u1ECDi k\xEAnh TikTok, Reels, YouTube Shorts c\u1EE7a ch\xEDnh b\u1EA1n." }
];
var DEMO_VIDEOS = [
  {
    id: "muse-ai",
    title: "Kh\xF3a H\u1ECDc Video Muse AI \u2014 T\u1EEB Prompt \u0110\u1EBFn Video 10s Chu\u1EA9n Viral",
    shortTitle: "Kh\xF3a h\u1ECDc Muse AI Pro 30s",
    tag: "Kh\xF3a h\u1ECDc",
    dur: "0:30",
    desc: "H\u1ECDc l\xE0m video AI b\u1EB1ng Muse AI t\u1EEB A-Z: vi\u1EBFt prompt kh\xF3a nh\xE2n v\u1EADt, render clip 10s c\xF3 lip-sync ti\u1EBFng Vi\u1EC7t t\u1EF1 nhi\xEAn, gh\xE9p th\xE0nh video ho\xE0n ch\u1EC9nh.",
    videoUrl: "/videos/demo-khoa-hoc-muse-ai.mp4",
    posterUrl: "/videos/posters/poster-khoa-hoc-muse-ai.jpg",
    slug: "khoa-hoc-video-muse-ai",
    price: 599e3,
    originalPrice: 1299e3
  },
  {
    id: "seedance-25",
    title: "Kh\xF3a H\u1ECDc Video Seedance 2.5 \u2014 One-Take 30s Build Page",
    shortTitle: "Seedance 2.5 \xB7 One-Take 30s",
    tag: "Kh\xF3a h\u1ECDc",
    dur: "0:30",
    desc: "L\xE0m ch\u1EE7 Seedance 2.5: quay one-take 30 gi\xE2y nh\xE2n v\u1EADt gi\u1EEF nguy\xEAn, \xE2m thanh native \u2014 c\xF4ng th\u1EE9c build page Reels/TikTok l\xEAn nhanh.",
    videoUrl: "/videos/demo-khoa-hoc-seedance.mp4",
    posterUrl: "/videos/posters/poster-khoa-hoc-seedance.jpg",
    slug: "khoa-hoc-video-seedance-25-30s",
    price: 699e3,
    originalPrice: 1399e3
  },
  {
    id: "skill-thuy-sinh",
    title: "Skill Video Thu\u1EF7 Sinh 30s \u2014 Build Page Reels",
    shortTitle: "Skill Video Thu\u1EF7 Sinh 30s",
    tag: "Skill AI",
    dur: "0:15",
    desc: "B\u1ED9 skill l\xE0m video thu\u1EF7 sinh 30s: prompt, quy tr\xECnh render v\xE0 checklist \u0111\u0103ng b\xE0i \u0111\u1EC3 build page Reels ng\xE1ch thu\u1EF7 sinh.",
    videoUrl: "/videos/demo-skill-thuy-sinh.mp4",
    posterUrl: "/videos/posters/poster-skill-thuy-sinh.jpg",
    slug: "skill-video-thuy-sinh-30s",
    price: 399e3,
    originalPrice: 799e3
  },
  {
    id: "skill-lam-vuon",
    title: "Skill Video DIY L\xE0m V\u01B0\u1EDDn 30s \u2014 Build Page Reels",
    shortTitle: "Skill L\xE0m V\u01B0\u1EDDn DIY 30s",
    tag: "Skill AI",
    dur: "0:25",
    desc: "Skill l\xE0m video DIY l\xE0m v\u01B0\u1EDDn 30s: c\xF4ng th\u1EE9c c\u1EA3nh quay, prompt m\u1EABu v\xE0 l\u1ECBch \u0111\u0103ng \u0111\u1EC3 build page Reels ng\xE1ch l\xE0m v\u01B0\u1EDDn.",
    videoUrl: "/videos/demo-skill-lam-vuon.mp4",
    posterUrl: "/videos/posters/poster-skill-lam-vuon.jpg",
    slug: "skill-video-diy-lam-vuon-30s",
    price: 399e3,
    originalPrice: 799e3
  },
  {
    id: "skill-fitness",
    title: "Skill Video Affiliate Fitness \u2014 Video 30s Ch\u1ED1t \u0110\u01A1n",
    shortTitle: "Skill Affiliate Fitness 30s",
    tag: "Skill AI",
    dur: "0:20",
    desc: "Skill l\xE0m video fitness 30s b\xE1n h\xE0ng affiliate: k\u1ECBch b\u1EA3n chuy\u1EC3n \u0111\u1ED5i cao, prompt v\xE0 quy tr\xECnh edit tay chi ti\u1EBFt.",
    videoUrl: "/videos/demo-skill-fitness.mp4",
    posterUrl: "/videos/posters/poster-skill-fitness.jpg",
    slug: "skill-video-affiliate-fitness",
    price: 449e3,
    originalPrice: 899e3
  }
];
var HomePage = (props) => {
  const { categories, featured, hot, newest, combos, posts, reviews, stats } = props;
  return /* @__PURE__ */ jsxDEV(Layout, { ...props, active: "home", children: [
    /* @__PURE__ */ jsxDEV("section", { id: "hero-section", class: "relative bg-slate-950 text-white overflow-hidden", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "absolute inset-0 hero-mesh" }),
      /* @__PURE__ */ jsxDEV("div", { class: "absolute inset-0 hero-grid" }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative max-w-7xl mx-auto px-4 py-14 md:py-20", children: /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-2 gap-10 xl:gap-12 items-center", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { class: "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur text-xs font-semibold mb-6", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" }),
            "\u0110\xE3 c\xF3 ",
            /* @__PURE__ */ jsxDEV("b", { class: "text-emerald-300", children: [
              stats.sold.toLocaleString("vi-VN"),
              "+"
            ] }),
            " l\u01B0\u1EE3t mua th\xE0nh c\xF4ng"
          ] }),
          /* @__PURE__ */ jsxDEV("h1", { class: "text-4xl md:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight mb-5", children: [
            "Kho ",
            /* @__PURE__ */ jsxDEV("span", { class: "bg-gradient-to-r from-brand-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent", children: "Chatbot, Skill & App AI" }),
            " l\xE0m video s\u1ED1 1 Vi\u1EC7t Nam"
          ] }),
          /* @__PURE__ */ jsxDEV("p", { class: "text-slate-300 text-base md:text-lg leading-relaxed mb-8 max-w-xl", children: "Kh\xF3a h\u1ECDc, skill, chatbot v\xE0 app l\xE0m video AI: Video Muse AI, Seedance 2.5 30s, Google Flow Veo \u2014 k\xE8m skill theo ng\xE1ch Thu\u1EF7 Sinh, L\xE0m V\u01B0\u1EDDn, Affiliate Fitness. Mua m\u1ED9t l\u1EA7n \u2014 s\u1EDF h\u1EEFu tr\u1ECDn \u0111\u1EDDi \u2014 giao h\xE0ng t\u1EF1 \u0111\u1ED9ng 24/7." }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-center gap-3 mb-9", children: [
            /* @__PURE__ */ jsxDEV("a", { href: "/san-pham", class: "h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-fuchsia-500 font-semibold shadow-xl shadow-brand-500/30 hover:opacity-90 transition", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-cubes" }),
              "Xem t\u1EA5t c\u1EA3 s\u1EA3n ph\u1EA9m"
            ] }),
            /* @__PURE__ */ jsxDEV("a", { href: "#theater", id: "heroTrailerBtn", class: "h-12 px-5 inline-flex items-center gap-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur font-semibold text-white transition shadow-lg", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "w-6 h-6 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 flex items-center justify-center text-[10px] text-white shadow", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-play ml-0.5" }) }),
              "Xem trailer 30s"
            ] }),
            /* @__PURE__ */ jsxDEV("a", { href: "/combo", class: "h-12 px-4 inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-box-open text-amber-400" }),
              "Combo -60%"
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "grid grid-cols-3 gap-4 max-w-md", children: [
            ["fa-cube", stats.products + "+", "S\u1EA3n ph\u1EA9m"],
            ["fa-users", stats.users.toLocaleString("vi-VN") + "+", "Kh\xE1ch h\xE0ng"],
            ["fa-star", "4.9/5", "\u0110\xE1nh gi\xE1"]
          ].map(([icon, num, label]) => /* @__PURE__ */ jsxDEV("div", { class: "text-center p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur", children: [
            /* @__PURE__ */ jsxDEV("i", { class: `fas ${icon} text-brand-400 mb-1.5` }),
            /* @__PURE__ */ jsxDEV("div", { class: "text-xl font-extrabold", children: num }),
            /* @__PURE__ */ jsxDEV("div", { class: "text-[11px] text-slate-400", children: label })
          ] })) })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "hero-stage-wrapper relative", children: [
          /* @__PURE__ */ jsxDEV("button", { id: "heroPrevPhoneBtn", class: "phone-nav-arrow phone-nav-prev", "aria-label": "Xem video tr\u01B0\u1EDBc", title: "Chuy\u1EC3n video tr\u01B0\u1EDBc (Tr\xE1i)", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-chevron-left" }) }),
          /* @__PURE__ */ jsxDEV("button", { id: "heroNextPhoneBtn", class: "phone-nav-arrow phone-nav-next", "aria-label": "Xem video ti\u1EBFp theo", title: "Chuy\u1EC3n video k\u1EBF ti\u1EBFp (Ph\u1EA3i)", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-chevron-right" }) }),
          /* @__PURE__ */ jsxDEV("div", { class: "hero-stage", id: "heroStage", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "phone phone-back phone-left", id: "heroLeftPhone", role: "button", tabindex: "0", title: "Nh\u1EA5p \u0111\u1EC3 xem video n\xE0y \u1EDF gi\u1EEFa", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "phone-notch-h" }),
              /* @__PURE__ */ jsxDEV(
                "video",
                {
                  id: "heroLeftVideo",
                  src: "/videos/demo-skill-thuy-sinh.mp4",
                  poster: "/videos/posters/poster-skill-thuy-sinh.jpg",
                  playsinline: true,
                  muted: true,
                  loop: true,
                  autoplay: true,
                  preload: "metadata"
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { class: "phone-side-hint phone-side-hint-left", children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-right mr-1" }),
                " B\u1EA5m xem Full"
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "phone phone-back phone-right", id: "heroRightPhone", role: "button", tabindex: "0", title: "Nh\u1EA5p \u0111\u1EC3 xem video n\xE0y \u1EDF gi\u1EEFa", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "phone-notch-h" }),
              /* @__PURE__ */ jsxDEV(
                "video",
                {
                  id: "heroRightVideo",
                  src: "/videos/demo-skill-fitness.mp4",
                  poster: "/videos/posters/poster-skill-fitness.jpg",
                  playsinline: true,
                  muted: true,
                  loop: true,
                  autoplay: true,
                  preload: "metadata"
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { class: "phone-side-hint phone-side-hint-right", children: [
                "B\u1EA5m xem Full ",
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-left ml-1" })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "phone phone-front", id: "heroFrontPhone", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "phone-notch-h" }),
              /* @__PURE__ */ jsxDEV(
                "video",
                {
                  id: "heroFrontVideo",
                  src: "/videos/demo-khoa-hoc-muse-ai.mp4",
                  poster: "/videos/posters/poster-khoa-hoc-muse-ai.jpg",
                  playsinline: true,
                  muted: true,
                  loop: true,
                  autoplay: true,
                  preload: "auto"
                }
              ),
              /* @__PURE__ */ jsxDEV("button", { id: "heroPlayCenterBtn", class: "phone-play-btn", "aria-label": "Ph\xE1t / t\u1EA1m d\u1EEBng", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-play text-white ml-0.5", id: "heroPlayCenterIcon" }) }),
              /* @__PURE__ */ jsxDEV("div", { class: "landscape-gui-overlay", id: "shortGuiOverlay", "data-platform": "tiktok", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "landscape-top-bar", id: "shortTopBar", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "landscape-top-left", id: "shortTopLeft", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "short-badge-live", children: [
                      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-play mr-1 text-rose-500" }),
                      /* @__PURE__ */ jsxDEV("span", { id: "heroPlatformBadge", children: "Video 16:9 G\u1ED1c" })
                    ] }),
                    /* @__PURE__ */ jsxDEV("span", { class: "landscape-title truncate max-w-[200px]", id: "heroVideoTitle", children: "Muse AI Pro \xB7 30s" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "landscape-top-right", children: /* @__PURE__ */ jsxDEV("button", { id: "heroSoundBtn", class: "short-sound-btn", "aria-label": "B\u1EADt ti\u1EBFng", title: "B\u1EADt / t\u1EAFt ti\u1EBFng", children: [
                    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-volume-xmark mr-1" }),
                    /* @__PURE__ */ jsxDEV("span", { id: "heroSoundText", children: "B\u1EADt ti\u1EBFng" })
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxDEV("div", { class: "landscape-bottom-bar", id: "shortBottomInfo", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between text-xs mb-1.5 px-1", children: [
                    /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2 min-w-0", children: [
                      /* @__PURE__ */ jsxDEV("span", { class: "short-author-handle font-bold text-white text-[11px]", id: "shortAuthorHandle", children: "@webskill.ai" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "short-verified-badge", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-check text-sky-400 text-[10px]" }) }),
                      /* @__PURE__ */ jsxDEV("span", { class: "text-[10px] text-white/80 truncate max-w-[180px] hidden sm:inline", id: "shortCaption", children: "L\xE0m video AI 30s li\u1EC1n m\u1EA1ch ch\u1EC9 v\u1EDBi 1 prompt chu\u1EA9n viral \u{1F680}" })
                    ] }),
                    /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxDEV("div", { class: "short-action-pill", id: "shortLikeBtn", role: "button", title: "Th\xEDch", children: [
                        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-heart text-white mr-1 text-[11px]", id: "shortLikeIcon" }),
                        /* @__PURE__ */ jsxDEV("span", { id: "shortLikeCount", class: "text-[10px] font-bold", children: "142.8K" })
                      ] }),
                      /* @__PURE__ */ jsxDEV("div", { class: "short-action-pill", id: "shortShareBtn", role: "button", title: "Chia s\u1EBB", children: [
                        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-share text-white mr-1 text-[11px]", id: "shortShareIcon" }),
                        /* @__PURE__ */ jsxDEV("span", { id: "shortShareCount", class: "text-[10px] font-bold", children: "3.9K" })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "short-progress-track", id: "heroProgressTrack", children: /* @__PURE__ */ jsxDEV("div", { class: "short-progress-fill", id: "heroProgressFill" }) })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "stage-nav-hint text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 backdrop-blur shadow-sm", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-left-right text-brand-400" }),
              " B\u1EA5m ",
              /* @__PURE__ */ jsxDEV("b", { children: "Tr\xE1i / Ph\u1EA3i" }),
              " ho\u1EB7c ",
              /* @__PURE__ */ jsxDEV("b", { children: "ch\u1EA1m 2 m\xE0n h\xECnh b\xEAn" }),
              " \u0111\u1EC3 \u0111\u1ED5i video"
            ] }),
            /* @__PURE__ */ jsxDEV("span", { class: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-semibold", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-film text-indigo-400" }),
              " Video ngang chu\u1EA9n 16:9 nguy\xEAn b\u1EA3n"
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative border-t border-white/5 bg-[#080716]/60 backdrop-blur py-3 marquee-wrap overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { class: "marquee-track flex gap-10 w-max text-slate-500 text-xs font-semibold whitespace-nowrap", children: [...Array(2)].map(() => /* @__PURE__ */ jsxDEV(Fragment, { children: ["Muse AI", "Seedance 2.5", "Veo 3", "Google Flow", "Kling AI", "ChatGPT", "Gemini", "CapCut", "Sora", "Runway"].map((b) => /* @__PURE__ */ jsxDEV("span", { class: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-nodes text-indigo-500/60" }),
        b
      ] })) })) }) })
    ] }),
    /* @__PURE__ */ jsxDEV("section", { class: "wall", id: "theater-wall", "aria-label": "Clip m\u1EABu l\xE0m b\u1EB1ng AI", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "wall-head", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "wall-kicker", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-wand-magic-sparkles text-brand-400" }),
          "L\xE0m b\u1EB1ng Muse AI & Seedance"
        ] }),
        /* @__PURE__ */ jsxDEV("span", { class: "wall-note", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-mouse-pointer text-slate-400 mr-1" }),
          "Clip th\u1EADt t\u1EEB repo, kh\xF4ng d\u1EF1ng l\u1EA1i. R\xEA chu\u1ED9t \u0111\u1EC3 d\u1EEBng \xB7 B\u1EA5m \u0111\u1EC3 xem l\u1EDBn."
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "wall-track-wrapper", children: /* @__PURE__ */ jsxDEV("div", { class: "wall-track", id: "wallTrack", children: [...DEMO_VIDEOS, ...DEMO_VIDEOS, ...DEMO_VIDEOS].map((v, idx) => /* @__PURE__ */ jsxDEV("div", { class: "wall-card", "data-video-index": idx % DEMO_VIDEOS.length, "data-src": v.videoUrl, "data-title": v.title, "data-slug": v.slug, "data-desc": v.desc, "data-poster": v.posterUrl, children: [
        /* @__PURE__ */ jsxDEV("video", { src: v.videoUrl, poster: v.posterUrl, playsinline: true, muted: true, loop: true, preload: "none" }),
        /* @__PURE__ */ jsxDEV("span", { class: "card-tag", children: v.tag }),
        /* @__PURE__ */ jsxDEV("span", { class: "card-dur", children: v.dur }),
        /* @__PURE__ */ jsxDEV("div", { class: "wall-card-play", children: /* @__PURE__ */ jsxDEV("div", { class: "wall-card-play-icon", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-play ml-0.5" }) }) }),
        /* @__PURE__ */ jsxDEV("div", { class: "card-info", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "card-title", children: v.shortTitle }),
          /* @__PURE__ */ jsxDEV("div", { class: "card-action", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-play text-[10px]" }),
            "B\u1EA5m \u0111\u1EC3 xem video"
          ] })
        ] })
      ] })) }) })
    ] }),
    /* @__PURE__ */ jsxDEV("section", { class: "theater-section reveal", id: "theater", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "text-center max-w-3xl mx-auto mb-10", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 font-mono text-xs uppercase font-bold tracking-wider mb-3", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-eye text-xs" }),
          "Xem T\u1EADn M\u1EAFt \xB7 Video AI Th\u1EADt"
        ] }),
        /* @__PURE__ */ jsxDEV("h2", { class: "text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3", children: "Xem Tr\u01B0\u1EDBc Khi S\u1EDF H\u1EEFu" }),
        /* @__PURE__ */ jsxDEV("p", { class: "text-slate-300 text-sm md:text-base leading-relaxed", children: "Trailer 30s, video h\u1ECDc vi\xEAn v\xE0 clip demo c\xE1c ng\xE1ch t\u1EEB kho repo. B\u1EA5m ch\u1ECDn video b\xEAn ph\u1EA3i \u0111\u1EC3 chuy\u1EC3n ngay l\u1EADp t\u1EE9c." })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "theater-layout", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "cinema-box", id: "cinemaScreenBox", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "player-frame", id: "theaterPlayerFrame", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "video-ambient-bg", id: "theaterAmbientBg", style: "background-image: url('/videos/posters/poster-khoa-hoc-muse-ai.jpg')" }),
            /* @__PURE__ */ jsxDEV(
              "video",
              {
                id: "theaterVideoElement",
                class: "main-video",
                src: DEMO_VIDEOS[0].videoUrl,
                poster: DEMO_VIDEOS[0].posterUrl,
                playsinline: true,
                preload: "metadata"
              }
            ),
            /* @__PURE__ */ jsxDEV("button", { class: "player-big-play", id: "theaterBigPlayBtn", "aria-label": "Ph\xE1t video", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-play text-white ml-1" }) }),
            /* @__PURE__ */ jsxDEV("div", { class: "player-bar", children: [
              /* @__PURE__ */ jsxDEV("button", { class: "theater-ctrl-btn", id: "theaterPlayBtn", "aria-label": "Ph\xE1t / t\u1EA1m d\u1EEBng", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-play", id: "theaterPlayIcon" }) }),
              /* @__PURE__ */ jsxDEV("div", { class: "theater-progress", id: "theaterProgressTrack", children: /* @__PURE__ */ jsxDEV("div", { class: "theater-progress-fill", id: "theaterProgressFill" }) }),
              /* @__PURE__ */ jsxDEV("span", { class: "theater-timecode", id: "theaterTimecode", children: "00:00 / 00:30" }),
              /* @__PURE__ */ jsxDEV("button", { class: "theater-ctrl-btn", id: "theaterSoundBtn", "aria-label": "B\u1EADt / t\u1EAFt ti\u1EBFng", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-volume-high", id: "theaterSoundIcon" }) }),
              /* @__PURE__ */ jsxDEV("button", { class: "theater-ctrl-btn", id: "theaterFullscreenBtn", "aria-label": "To\xE0n m\xE0n h\xECnh", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-expand" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "player-info border-t border-[#1f1b4b]", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-center justify-between gap-3 mb-2", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-400 text-xs font-bold uppercase tracking-wider", id: "activeVideoTag", children: DEMO_VIDEOS[0].tag }),
              /* @__PURE__ */ jsxDEV("span", { class: "font-mono text-xs text-slate-400", id: "activeVideoDur", children: [
                "Th\u1EDDi l\u01B0\u1EE3ng: ",
                DEMO_VIDEOS[0].dur
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("h3", { class: "text-xl md:text-2xl font-extrabold text-white mb-2", id: "activeVideoTitle", children: DEMO_VIDEOS[0].title }),
            /* @__PURE__ */ jsxDEV("p", { class: "text-slate-300 text-sm leading-relaxed mb-5", id: "activeVideoDesc", children: DEMO_VIDEOS[0].desc }),
            /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "flex items-baseline gap-2", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "text-2xl font-black text-white", id: "activeVideoPrice", children: formatVND(DEMO_VIDEOS[0].price) }),
                /* @__PURE__ */ jsxDEV("span", { class: "text-xs text-slate-500 line-through", id: "activeVideoOrigPrice", children: formatVND(DEMO_VIDEOS[0].originalPrice) })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "flex gap-2", children: /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${DEMO_VIDEOS[0].slug}`, id: "activeVideoLink", class: "h-10 px-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-fuchsia-500 text-white font-semibold text-xs hover:opacity-90 transition", children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-bolt" }),
                "Mua s\u1EA3n ph\u1EA9m n\xE0y"
              ] }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "playlist-panel", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between mb-4 pb-3 border-b border-[#1f1b4b]", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "text-sm font-bold text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-list-ul text-brand-400" }),
              "Danh s\xE1ch video (",
              DEMO_VIDEOS.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxDEV("span", { class: "text-[11px] text-slate-400 font-medium", children: "B\u1EA5m \u0111\u1EC3 \u0111\u1ED5i video" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "playlist", id: "theaterPlaylist", children: DEMO_VIDEOS.map((v, i) => /* @__PURE__ */ jsxDEV("div", { class: `playlist-item ${i === 0 ? "active" : ""}`, "data-index": i, children: [
            /* @__PURE__ */ jsxDEV("div", { class: "playlist-thumb-wrap", children: [
              /* @__PURE__ */ jsxDEV("img", { src: v.posterUrl, alt: v.shortTitle, loading: "lazy" }),
              /* @__PURE__ */ jsxDEV("span", { class: "thumb-dur", children: v.dur })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2 mb-1", children: /* @__PURE__ */ jsxDEV("span", { class: "text-[10px] uppercase font-bold text-brand-400", children: v.tag }) }),
              /* @__PURE__ */ jsxDEV("h4", { class: "text-xs font-bold text-white truncate group-hover:text-brand-300", children: v.shortTitle }),
              /* @__PURE__ */ jsxDEV("div", { class: "text-[11px] text-slate-400 mt-1 flex items-center gap-2", children: /* @__PURE__ */ jsxDEV("span", { class: "font-extrabold text-amber-400", children: formatVND(v.price) }) })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-slate-400 shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-play" }) })
          ] })) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxDEV("section", { id: "categories-section", class: "max-w-7xl mx-auto px-4 py-14 reveal", children: [
      /* @__PURE__ */ jsxDEV(SectionTitle, { title: "Danh m\u1EE5c s\u1EA3n ph\u1EA9m", subtitle: "Ch\u1ECDn \u0111\xFAng c\xF4ng c\u1EE5 b\u1EA1n c\u1EA7n cho h\xE0nh tr\xECnh l\xE0m video AI", more: { href: "/san-pham", label: "T\u1EA5t c\u1EA3" } }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4", children: categories.map((c) => /* @__PURE__ */ jsxDEV(CategoryCard, { c })) })
    ] }),
    featured.length > 0 && /* @__PURE__ */ jsxDEV("section", { id: "featured-section", class: "max-w-7xl mx-auto px-4 py-8 reveal", children: [
      /* @__PURE__ */ jsxDEV(SectionTitle, { title: "S\u1EA3n ph\u1EA9m n\u1ED5i b\u1EADt", subtitle: "\u0110\u01B0\u1EE3c l\u1EF1a ch\u1ECDn nhi\u1EC1u nh\u1EA5t b\u1EDFi c\u1ED9ng \u0111\u1ED3ng l\xE0m video AI", more: { href: "/san-pham?sort=featured", label: "Xem th\xEAm" } }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5", children: featured.slice(0, 8).map((p) => /* @__PURE__ */ jsxDEV(ProductCard, { p })) })
    ] }),
    combos.length > 0 && /* @__PURE__ */ jsxDEV("section", { id: "combo-section", class: "max-w-7xl mx-auto px-4 py-10 reveal", children: /* @__PURE__ */ jsxDEV("div", { class: "rounded-3xl bg-gradient-to-br from-[#0f0e26] via-[#1a184c] to-[#080716] p-7 md:p-10 text-white relative overflow-hidden border border-[#1f1b4b]", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "absolute inset-0 hero-mesh opacity-40" }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-end justify-between gap-4 mb-7", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { class: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-xs font-bold mb-3 pulse-ring", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-fire" }),
              "TI\u1EBET KI\u1EC6M \u0110\u1EBEN 60%"
            ] }),
            /* @__PURE__ */ jsxDEV("h2", { class: "text-2xl md:text-3xl font-extrabold tracking-tight", children: "Combo tr\u1ECDn b\u1ED9 \u2014 gi\xE1 c\u1EF1c h\u1EDDi" }),
            /* @__PURE__ */ jsxDEV("p", { class: "text-[#9f9dbb] mt-1.5 text-sm md:text-base", children: "Mua g\xF3i thay v\xEC mua l\u1EBB, ti\u1EBFt ki\u1EC7m h\xE0ng tri\u1EC7u \u0111\u1ED3ng" })
          ] }),
          /* @__PURE__ */ jsxDEV("a", { href: "/combo", class: "h-11 px-5 inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition", children: [
            "Xem t\u1EA5t c\u1EA3 combo",
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-right text-xs" })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "grid md:grid-cols-3 gap-4", children: combos.slice(0, 3).map((c) => {
          const off = c.original_price ? Math.round((c.original_price - c.price) / c.original_price * 100) : 0;
          return /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${c.slug}`, class: "group p-5 rounded-2xl bg-[#080716]/60 backdrop-blur border border-[#1f1b4b] hover:bg-white/5 transition", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "flex items-start justify-between gap-2 mb-3", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "w-10 h-10 rounded-xl bg-amber-400/10 text-amber-300 grid place-items-center", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-box-open" }) }),
              off > 0 && /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-0.5 rounded bg-rose-500 text-[11px] font-bold", children: [
                "-",
                off,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("h3", { class: "font-bold leading-snug mb-2 line-clamp-2 group-hover:text-indigo-400 transition", children: c.name }),
            /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-[#9f9dbb] line-clamp-2 mb-3.5 leading-relaxed", children: c.short_desc }),
            /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "text-base font-extrabold text-amber-400", children: formatVND(c.price) }),
              c.original_price && /* @__PURE__ */ jsxDEV("span", { class: "text-xs text-slate-500 line-through", children: formatVND(c.original_price) })
            ] })
          ] });
        }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxDEV("section", { id: "hot-new-section", class: "max-w-7xl mx-auto px-4 py-8 reveal", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-1 border-b border-[#1f1b4b] mb-7", children: [
        /* @__PURE__ */ jsxDEV("button", { class: "tab-btn active px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 transition", "data-tab": "hot", "data-group": "hp", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-fire mr-1.5 text-orange-500" }),
          "B\xE1n ch\u1EA1y nh\u1EA5t"
        ] }),
        /* @__PURE__ */ jsxDEV("button", { class: "tab-btn px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 transition", "data-tab": "new", "data-group": "hp", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-sparkles mr-1.5 text-indigo-400" }),
          "M\u1EDBi ra m\u1EAFt"
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "tab-panel", "data-tab": "hot", "data-group": "hp", children: /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5", children: hot.slice(0, 8).map((p) => /* @__PURE__ */ jsxDEV(ProductCard, { p })) }) }),
      /* @__PURE__ */ jsxDEV("div", { class: "tab-panel hidden", "data-tab": "new", "data-group": "hp", children: /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5", children: newest.slice(0, 8).map((p) => /* @__PURE__ */ jsxDEV(ProductCard, { p })) }) })
    ] }),
    /* @__PURE__ */ jsxDEV("section", { id: "benefits-section", class: "bg-[#0f0e26]/60 border-y border-[#1f1b4b] py-16 mt-10 reveal", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4", children: [
      /* @__PURE__ */ jsxDEV(SectionTitle, { center: true, title: "L\u1EE3i \xEDch khi mua t\u1EA1i WebSkill AI", subtitle: "Tr\u1EA3i nghi\u1EC7m tuy\u1EC7t v\u1EDDi c\xF9ng nh\u1EEFng \u01B0u \u0111i\u1EC3m v\u01B0\u1EE3t tr\u1ED9i" }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8", children: BENEFITS.map((b) => /* @__PURE__ */ jsxDEV("div", { class: "p-6 rounded-2xl border border-[#1f1b4b] bg-[#0f0e26] hover:border-indigo-500/20 hover:shadow-lg transition group", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center text-lg mb-4 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition", children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${b.icon}` }) }),
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-1.5", children: b.title }),
        /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-[#9f9dbb] leading-relaxed", children: b.desc })
      ] })) })
    ] }) }),
    /* @__PURE__ */ jsxDEV("section", { id: "how-section", class: "max-w-7xl mx-auto px-4 py-16 reveal", children: [
      /* @__PURE__ */ jsxDEV(SectionTitle, { center: true, title: "Mua h\xE0ng ch\u1EC9 4 b\u01B0\u1EDBc", subtitle: "\u0110\u01A1n gi\u1EA3n, nhanh ch\xF3ng, nh\u1EADn source code ngay l\u1EADp t\u1EE9c" }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8 relative", children: STEPS.map((s, i) => /* @__PURE__ */ jsxDEV("div", { class: "relative p-6 rounded-2xl bg-[#0f0e26] border border-[#1f1b4b] text-center", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-800 text-white text-xs font-bold", children: s.n }),
        /* @__PURE__ */ jsxDEV("div", { class: "w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 grid place-items-center text-xl mx-auto mt-2 mb-4", children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${s.icon}` }) }),
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-1.5", children: s.title }),
        /* @__PURE__ */ jsxDEV("p", { class: "text-[13px] text-[#9f9dbb] leading-relaxed", children: s.desc }),
        i < STEPS.length - 1 && /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-right absolute top-1/2 -right-4 text-slate-600 hidden lg:block" })
      ] })) })
    ] }),
    reviews.length > 0 && /* @__PURE__ */ jsxDEV("section", { id: "reviews-section", class: "bg-[#0f0e26] border-y border-[#1f1b4b] py-16 reveal", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "text-center mb-10", children: [
        /* @__PURE__ */ jsxDEV("h2", { class: "text-2xl md:text-3xl font-extrabold text-white tracking-tight", children: "Kh\xE1ch h\xE0ng n\xF3i g\xEC?" }),
        /* @__PURE__ */ jsxDEV("p", { class: "text-slate-400 mt-2", children: "C\u1EA3m nh\u1EADn t\u1EEB nh\u1EEFng ng\u01B0\u1EDDi \u0111\xE3 tr\u1EA3i nghi\u1EC7m s\u1EA3n ph\u1EA9m c\u1EE7a ch\xFAng t\xF4i" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid md:grid-cols-2 lg:grid-cols-3 gap-5", children: reviews.slice(0, 6).map((r) => /* @__PURE__ */ jsxDEV("div", { class: "p-6 rounded-2xl bg-[#080716]/80 border border-[#1f1b4b]", children: [
        /* @__PURE__ */ jsxDEV(Stars, { rating: r.rating, size: "text-sm" }),
        /* @__PURE__ */ jsxDEV("p", { class: "text-slate-300 text-sm leading-relaxed my-4", children: [
          '"',
          r.comment,
          '"'
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-3 pt-4 border-t border-[#1f1b4b]", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-bold text-sm", children: (r.full_name || "K").charAt(0).toUpperCase() }),
          /* @__PURE__ */ jsxDEV("div", { class: "min-w-0", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-white text-sm truncate", children: r.full_name }),
            /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${r.product_slug}`, class: "text-xs text-slate-400 truncate block hover:text-indigo-400", children: r.product_name })
          ] })
        ] })
      ] })) })
    ] }) }),
    posts.length > 0 && /* @__PURE__ */ jsxDEV("section", { id: "blog-section", class: "max-w-7xl mx-auto px-4 py-16 reveal", children: [
      /* @__PURE__ */ jsxDEV(SectionTitle, { title: "Ki\u1EBFn th\u1EE9c l\xE0m video AI", subtitle: "H\u01B0\u1EDBng d\u1EABn, m\u1EB9o hay v\xE0 case study th\u1EF1c t\u1EBF", more: { href: "/blog", label: "T\u1EA5t c\u1EA3 b\xE0i vi\u1EBFt" } }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 lg:grid-cols-4 gap-5", children: posts.slice(0, 4).map((p) => /* @__PURE__ */ jsxDEV(PostCard, { p })) })
    ] }),
    /* @__PURE__ */ jsxDEV("section", { id: "faq-section", class: "bg-[#080716] border-t border-[#1f1b4b] py-16 reveal", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-3xl mx-auto px-4", children: [
      /* @__PURE__ */ jsxDEV(SectionTitle, { center: true, title: "C\xE2u h\u1ECFi th\u01B0\u1EDDng g\u1EB7p", subtitle: "Nh\u1EEFng th\u1EAFc m\u1EAFc ph\u1ED5 bi\u1EBFn nh\u1EA5t t\u1EEB kh\xE1ch h\xE0ng" }),
      /* @__PURE__ */ jsxDEV("div", { class: "space-y-3 mt-8", children: FAQS.map((f, i) => /* @__PURE__ */ jsxDEV("div", { class: "rounded-xl border border-[#1f1b4b] bg-[#0f0e26] overflow-hidden", children: [
        /* @__PURE__ */ jsxDEV("button", { class: "faq-q w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition", children: [
          /* @__PURE__ */ jsxDEV("span", { class: "font-semibold text-white text-[15px]", children: f.q }),
          /* @__PURE__ */ jsxDEV("i", { class: "faq-icon fas fa-plus text-indigo-500 text-sm transition-transform shrink-0" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: `faq-a px-5 pb-4 text-sm text-[#9f9dbb] leading-relaxed ${i === 0 ? "" : "hidden"}`, children: f.a })
      ] })) })
    ] }) }),
    /* @__PURE__ */ jsxDEV("section", { id: "cta-section", class: "max-w-7xl mx-auto px-4 py-14 reveal", children: /* @__PURE__ */ jsxDEV("div", { class: "rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-fuchsia-600 p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-600/10", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "absolute inset-0 hero-grid opacity-20" }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
        /* @__PURE__ */ jsxDEV("h2", { class: "text-2xl md:text-4xl font-extrabold mb-3 tracking-tight", children: "S\u1EB5n s\xE0ng b\u1EAFt \u0111\u1EA7u ki\u1EBFm ti\u1EC1n v\u1EDBi video AI?" }),
        /* @__PURE__ */ jsxDEV("p", { class: "text-white/85 mb-7 max-w-2xl mx-auto", children: "Tham gia c\xF9ng h\xE0ng ngh\xECn ng\u01B0\u1EDDi \u0111ang d\xF9ng c\xF4ng c\u1EE5 c\u1EE7a ch\xFAng t\xF4i \u0111\u1EC3 s\u1EA3n xu\u1EA5t video b\xE1n h\xE0ng m\u1ED7i ng\xE0y." }),
        /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap justify-center gap-3", children: [
          /* @__PURE__ */ jsxDEV("a", { href: "/dang-ky", class: "h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-white text-indigo-900 font-bold hover:bg-slate-100 transition shadow-xl", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-user-plus" }),
            "\u0110\u0103ng k\xFD mi\u1EC5n ph\xED"
          ] }),
          /* @__PURE__ */ jsxDEV("a", { href: "/san-pham", class: "h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/30 backdrop-blur font-semibold hover:bg-white/25 transition", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-eye" }),
            "Xem s\u1EA3n ph\u1EA9m"
          ] })
        ] })
      ] })
    ] }) })
  ] });
};

// src/pages/products.tsx
var SORTS = [
  ["newest", "M\u1EDBi nh\u1EA5t"],
  ["bestseller", "B\xE1n ch\u1EA1y"],
  ["price_asc", "Gi\xE1 th\u1EA5p \u2192 cao"],
  ["price_desc", "Gi\xE1 cao \u2192 th\u1EA5p"],
  ["rating", "\u0110\xE1nh gi\xE1 cao"],
  ["featured", "N\u1ED5i b\u1EADt"]
];
var TYPES = [
  ["", "T\u1EA5t c\u1EA3 lo\u1EA1i"],
  ...Object.entries(PRODUCT_TYPE_LABEL)
];
var ProductListPage = (props) => {
  const {
    products,
    categories,
    total,
    page,
    totalPages,
    q,
    cat,
    sort,
    minPrice,
    maxPrice,
    type,
    heading,
    headingDesc,
    baseUrl,
    currentCategory
  } = props;
  return /* @__PURE__ */ jsxDEV(
    Layout,
    {
      ...props,
      active: currentCategory ? "products" : baseUrl === "/combo" ? "combo" : "products",
      title: heading,
      description: headingDesc,
      children: [
        /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] border-b border-[#1f1b4b]", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 py-7", children: [
          /* @__PURE__ */ jsxDEV(Breadcrumb, { items: currentCategory ? [{ label: "S\u1EA3n ph\u1EA9m", href: "/san-pham" }, { label: currentCategory.name }] : [{ label: heading }] }),
          /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl md:text-3xl font-extrabold text-white tracking-tight", children: heading }),
          headingDesc && /* @__PURE__ */ jsxDEV("p", { class: "text-[#9f9dbb] mt-2 max-w-3xl text-sm leading-relaxed", children: headingDesc }),
          /* @__PURE__ */ jsxDEV("div", { class: "mt-3 text-sm text-[#9f9dbb]", children: [
            "T\xECm th\u1EA5y ",
            /* @__PURE__ */ jsxDEV("b", { class: "text-white", children: total }),
            " s\u1EA3n ph\u1EA9m"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 py-8", children: /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[280px_1fr] gap-8", children: [
          /* @__PURE__ */ jsxDEV("aside", { class: "space-y-5", children: [
            /* @__PURE__ */ jsxDEV("form", { action: baseUrl, method: "get", id: "filter-form", class: "space-y-5", children: [
              sort && /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "sort", value: sort }),
              /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5", children: [
                /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-3.5 text-xs uppercase tracking-wider", children: "T\xECm ki\u1EBFm" }),
                /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "text",
                      name: "q",
                      value: q,
                      placeholder: "T\xEAn s\u1EA3n ph\u1EA9m...",
                      class: "w-full h-10 pl-9 pr-3 rounded-lg bg-[#16143c] border border-transparent focus:border-indigo-500/50 text-white placeholder-slate-500 outline-none text-sm transition"
                    }
                  ),
                  /* @__PURE__ */ jsxDEV("i", { class: "fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" })
                ] })
              ] }),
              baseUrl === "/san-pham" && /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5", children: [
                /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-3.5 text-xs uppercase tracking-wider", children: "Danh m\u1EE5c" }),
                /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap gap-1.5", children: [
                  /* @__PURE__ */ jsxDEV("a", { href: "/san-pham", class: `px-3 py-1.5 rounded-full text-xs font-semibold transition border ${!cat ? "bg-indigo-600 text-white border-transparent" : "bg-[#16143c]/80 border-[#1f1b4b] text-slate-300 hover:text-white hover:border-[#2e2a5e]"}`, children: "T\u1EA5t c\u1EA3" }),
                  categories.map((c) => /* @__PURE__ */ jsxDEV("a", { href: `/san-pham?cat=${c.slug}`, class: `px-3 py-1.5 rounded-full text-xs font-semibold transition border ${cat === c.slug ? "bg-indigo-600 text-white border-transparent" : "bg-[#16143c]/80 border-[#1f1b4b] text-slate-300 hover:text-white hover:border-[#2e2a5e]"}`, children: [
                    c.name,
                    " ",
                    /* @__PURE__ */ jsxDEV("span", { class: "opacity-60", children: [
                      "(",
                      c.product_count ?? 0,
                      ")"
                    ] })
                  ] }))
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5", children: [
                /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-3.5 text-xs uppercase tracking-wider", children: "Lo\u1EA1i s\u1EA3n ph\u1EA9m" }),
                /* @__PURE__ */ jsxDEV("select", { name: "type", class: "w-full h-10 px-3 rounded-lg bg-[#16143c] border border-transparent focus:border-indigo-500/50 text-white outline-none text-sm", children: TYPES.map(([v, l]) => /* @__PURE__ */ jsxDEV("option", { class: "bg-[#0f0e26] text-white", value: v, selected: type === v, children: l })) })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5", children: [
                /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-3.5 text-xs uppercase tracking-wider", children: "Kho\u1EA3ng gi\xE1" }),
                /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      name: "min",
                      value: minPrice,
                      placeholder: "T\u1EEB",
                      min: "0",
                      step: "10000",
                      class: "w-full h-10 px-3 rounded-lg bg-[#16143c] border border-transparent focus:border-indigo-500/50 text-white outline-none text-sm"
                    }
                  ),
                  /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "\u2013" }),
                  /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "number",
                      name: "max",
                      value: maxPrice,
                      placeholder: "\u0110\u1EBFn",
                      min: "0",
                      step: "10000",
                      class: "w-full h-10 px-3 rounded-lg bg-[#16143c] border border-transparent focus:border-indigo-500/50 text-white outline-none text-sm"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap gap-1.5 mt-3", children: [[0, 2e5, "< 200k"], [2e5, 5e5, "200-500k"], [5e5, 1e6, "500k-1tr"], [1e6, 0, "> 1tr"]].map(([mn, mx, lb]) => /* @__PURE__ */ jsxDEV(
                  "a",
                  {
                    href: `${baseUrl}?min=${mn}${mx ? "&max=" + mx : ""}`,
                    class: "px-2.5 py-1 rounded-md bg-[#16143c] border border-[#1f1b4b] text-slate-300 hover:text-white hover:border-indigo-500/30 text-[11px] font-medium transition",
                    children: lb
                  }
                )) })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "flex gap-2", children: [
                /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-md shadow-indigo-600/10", children: [
                  /* @__PURE__ */ jsxDEV("i", { class: "fas fa-filter mr-1.5" }),
                  "L\u1ECDc"
                ] }),
                /* @__PURE__ */ jsxDEV("a", { href: baseUrl, class: "h-10 px-4 grid place-items-center rounded-xl bg-[#16143c] hover:bg-white/5 text-[#b9b8d9] text-sm font-semibold transition", children: "Xo\xE1" })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-600/10", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-gift text-2xl mb-2.5 opacity-90" }),
              /* @__PURE__ */ jsxDEV("h3", { class: "font-bold mb-1.5", children: "Nh\u1EADn m\xE3 gi\u1EA3m 10%" }),
              /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-white/85 mb-3.5 leading-relaxed", children: [
                "D\xF9ng m\xE3 ",
                /* @__PURE__ */ jsxDEV("b", { class: "bg-white/20 px-1.5 py-0.5 rounded font-mono", children: "WELCOME10" }),
                " cho \u0111\u01A1n \u0111\u1EA7u ti\xEAn t\u1EEB 100k."
              ] }),
              /* @__PURE__ */ jsxDEV("button", { "data-copy": "WELCOME10", class: "w-full h-9 rounded-lg bg-white text-indigo-700 font-bold text-xs hover:bg-slate-100 transition shadow-md", children: [
                /* @__PURE__ */ jsxDEV("i", { class: "far fa-copy mr-1" }),
                "Sao ch\xE9p m\xE3"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-center justify-between gap-3 mb-5", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap gap-1.5", children: [
                q && /* @__PURE__ */ jsxDEV("span", { class: "px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold", children: [
                  "T\u1EEB kho\xE1: ",
                  q
                ] }),
                cat && /* @__PURE__ */ jsxDEV("span", { class: "px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold", children: categories.find((c) => c.slug === cat)?.name }),
                type && /* @__PURE__ */ jsxDEV("span", { class: "px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold", children: TYPES.find((t) => t[0] === type)?.[1] }),
                (minPrice || maxPrice) && /* @__PURE__ */ jsxDEV("span", { class: "px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold", children: [
                  minPrice ? formatVND(+minPrice) : "0\u0111",
                  " \u2013 ",
                  maxPrice ? formatVND(+maxPrice) : "\u221E"
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("form", { action: baseUrl, method: "get", class: "flex items-center gap-2 ml-auto", children: [
                q && /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "q", value: q }),
                cat && /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "cat", value: cat }),
                type && /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "type", value: type }),
                minPrice && /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "min", value: minPrice }),
                maxPrice && /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "max", value: maxPrice }),
                /* @__PURE__ */ jsxDEV("label", { class: "text-xs text-[#9f9dbb] whitespace-nowrap", children: "S\u1EAFp x\u1EBFp:" }),
                /* @__PURE__ */ jsxDEV("select", { name: "sort", "data-auto-submit": true, class: "h-9 px-3 pr-8 rounded-lg bg-[#16143c] border border-transparent text-white outline-none text-xs focus:border-indigo-500/50", children: SORTS.map(([v, l]) => /* @__PURE__ */ jsxDEV("option", { class: "bg-[#0f0e26] text-white", value: v, selected: sort === v, children: l })) })
              ] })
            ] }),
            products.length === 0 ? /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b]", children: /* @__PURE__ */ jsxDEV(
              EmptyState,
              {
                icon: "fa-magnifying-glass",
                title: "Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m n\xE0o",
                desc: "Th\u1EED thay \u0111\u1ED5i t\u1EEB kho\xE1 ho\u1EB7c b\u1ED9 l\u1ECDc \u0111\u1EC3 t\xECm s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p h\u01A1n.",
                action: { href: baseUrl, label: "Xo\xE1 b\u1ED9 l\u1ECDc" }
              }
            ) }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 xl:grid-cols-3 gap-5", children: products.map((p) => /* @__PURE__ */ jsxDEV(ProductCard, { p })) }),
              /* @__PURE__ */ jsxDEV(Pagination, { page, totalPages, baseUrl: baseUrl + "?" + new URLSearchParams(
                Object.entries({ q, cat, sort, type, min: minPrice, max: maxPrice }).filter(([, v]) => v)
              ).toString() })
            ] })
          ] })
        ] }) })
      ]
    }
  );
};

// src/pages/product-detail.tsx
var ProductDetailPage = (props) => {
  const { product: p, related, comboItems, reviews, owned, inWishlist, canReview, ratingBreakdown, user, settings } = props;
  const off = discountPercent(p.price, p.original_price);
  const features = parseJSON(p.features, []);
  const tech = parseJSON(p.tech_stack, []);
  const gallery = parseJSON(p.gallery, []);
  const save = (p.original_price || 0) - p.price;
  const isMp4 = !!p.demo_video_url && /\.mp4(\?|$)/i.test(p.demo_video_url);
  const demoPoster = isMp4 ? p.demo_video_url.replace(/\/videos\/demo-(.+)\.mp4/i, "/videos/posters/poster-$1.jpg") : void 0;
  return /* @__PURE__ */ jsxDEV(Layout, { ...props, active: "products", title: p.name, description: p.short_desc, ogImage: p.thumbnail || void 0, children: [
    /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] border-b border-[#1f1b4b]", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 pt-6 pb-8", children: [
      /* @__PURE__ */ jsxDEV(Breadcrumb, { items: [
        { label: "S\u1EA3n ph\u1EA9m", href: "/san-pham" },
        ...p.category_slug ? [{ label: p.category_name, href: `/danh-muc/${p.category_slug}` }] : [],
        { label: p.name }
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[1fr_1.1fr] gap-8 mt-4", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          p.demo_video_url ? (
            /* Vertical Phone Mockup Player */
            /* @__PURE__ */ jsxDEV("div", { class: "vertical-player-wrapper mx-auto mb-4 border-4 border-[#1f1b4b] shadow-2xl relative", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "video-mockup-overlay", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "video-mockup-header", children: [
                  /* @__PURE__ */ jsxDEV("span", { class: "text-xs font-semibold text-white tracking-wider bg-black/40 px-2.5 py-1 rounded", children: "VIDEO DEMO" }),
                  /* @__PURE__ */ jsxDEV("div", { class: "video-mockup-actions", children: /* @__PURE__ */ jsxDEV("button", { class: "video-mockup-btn btn-vol", title: "\xC2m thanh", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-volume-up" }) }) })
                ] }),
                /* @__PURE__ */ jsxDEV("div", { class: "video-mockup-footer", children: /* @__PURE__ */ jsxDEV("div", { class: "video-mockup-info", children: [
                  /* @__PURE__ */ jsxDEV("p", { class: "text-sm font-bold text-white", children: "@webskill.ai" }),
                  /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-white/90 mt-1 line-clamp-1", children: p.name })
                ] }) })
              ] }),
              isMp4 ? /* @__PURE__ */ jsxDEV("video", { src: p.demo_video_url, poster: demoPoster, class: "w-full h-full border-none bg-black", controls: true, playsinline: true, preload: "metadata" }) : /* @__PURE__ */ jsxDEV("iframe", { src: p.demo_video_url, class: "w-full h-full border-none", allow: "autoplay; encrypted-media", allowfullscreen: true })
            ] })
          ) : p.thumbnail ? /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl overflow-hidden border border-[#1f1b4b] bg-[#080716] aspect-[10/16] relative shadow-lg", children: /* @__PURE__ */ jsxDEV("img", { src: p.thumbnail, alt: p.name, class: "w-full h-full object-cover" }) }) : /* @__PURE__ */ jsxDEV(
            "div",
            {
              class: "rounded-2xl overflow-hidden border border-[#1f1b4b] bg-[#080716] aspect-[10/16] grid place-items-center text-white/95 relative shadow-lg",
              style: `background:${gradientFor(p.id)}`,
              children: /* @__PURE__ */ jsxDEV("div", { class: "text-center p-4", children: [
                /* @__PURE__ */ jsxDEV("i", { class: `fas ${PRODUCT_TYPE_ICON[p.product_type] || "fa-cube"} text-6xl mb-3 opacity-90` }),
                /* @__PURE__ */ jsxDEV("div", { class: "text-sm font-bold uppercase tracking-[0.2em] opacity-80", children: PRODUCT_TYPE_LABEL[p.product_type] })
              ] })
            }
          ),
          gallery.length > 0 && /* @__PURE__ */ jsxDEV("div", { class: "grid grid-cols-4 gap-2.5 mt-3", children: gallery.slice(0, 8).map((g, i) => /* @__PURE__ */ jsxDEV(
            "img",
            {
              src: g,
              alt: `${p.name} \u1EA3nh ${i + 1}`,
              loading: "lazy",
              class: "aspect-[9/16] object-cover rounded-lg border border-[#1f1b4b] cursor-pointer hover:border-indigo-500 transition"
            }
          )) }),
          /* @__PURE__ */ jsxDEV("div", { class: "grid grid-cols-2 gap-3 mt-5", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e26] to-[#16143c] border border-[#1f1b4b] flex items-center gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 grid place-items-center text-sm shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-bolt" }) }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { class: "text-[9px] text-slate-500 uppercase font-bold tracking-wider", children: "Giao h\xE0ng" }),
                /* @__PURE__ */ jsxDEV("div", { class: "text-xs font-bold text-white", children: "T\u1EF1 \u0111\u1ED9ng 24/7" })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e26] to-[#16143c] border border-[#1f1b4b] flex items-center gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 grid place-items-center text-sm shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-cubes" }) }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { class: "text-[9px] text-slate-500 uppercase font-bold tracking-wider", children: "N\u1ED9i dung" }),
                /* @__PURE__ */ jsxDEV("div", { class: "text-xs font-bold text-white", children: "Full t\xE0i li\u1EC7u + HDSD" })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e26] to-[#16143c] border border-[#1f1b4b] flex items-center gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 grid place-items-center text-sm shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-infinity" }) }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { class: "text-[9px] text-slate-500 uppercase font-bold tracking-wider", children: "Truy c\u1EADp" }),
                /* @__PURE__ */ jsxDEV("div", { class: "text-xs font-bold text-white", children: "Tr\u1ECDn \u0111\u1EDDi + update free" })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "p-3.5 rounded-xl bg-gradient-to-br from-[#0f0e26] to-[#16143c] border border-[#1f1b4b] flex items-center gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 grid place-items-center text-sm shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-headset" }) }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { class: "text-[9px] text-slate-500 uppercase font-bold tracking-wider", children: "H\u1ED7 tr\u1EE3" }),
                /* @__PURE__ */ jsxDEV("div", { class: "text-xs font-bold text-white", children: "1-1 qua Zalo" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "flex flex-col justify-start", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-bold", children: PRODUCT_TYPE_LABEL[p.product_type] }),
            p.category_name && /* @__PURE__ */ jsxDEV("a", { href: `/danh-muc/${p.category_slug}`, class: "px-2.5 py-1 rounded bg-[#16143c] text-slate-300 text-xs font-medium hover:text-white hover:bg-white/5 transition", children: p.category_name }),
            p.is_hot === 1 && /* @__PURE__ */ jsxDEV("span", { class: "px-2.5 py-1 rounded bg-orange-500/15 text-orange-400 text-xs font-bold", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-fire mr-1 animate-pulse" }),
              "HOT"
            ] }),
            p.is_new === 1 && /* @__PURE__ */ jsxDEV("span", { class: "px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-bold", children: "M\u1EDAI" })
          ] }),
          /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight mb-3 glow-text-brand", children: p.name }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-center gap-4 text-xs mb-4", children: [
            /* @__PURE__ */ jsxDEV("a", { href: "#reviews", class: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxDEV(Stars, { rating: p.rating, size: "text-xs" }),
              /* @__PURE__ */ jsxDEV("b", { class: "text-white text-sm", children: p.rating.toFixed(1) }),
              /* @__PURE__ */ jsxDEV("span", { class: "text-slate-400", children: [
                "(",
                p.rating_count,
                " \u0111\xE1nh gi\xE1)"
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("span", { class: "text-[#1f1b4b]", children: "|" }),
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-400", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-cart-shopping mr-1 text-slate-500" }),
              p.sold_count,
              " \u0111\xE3 b\xE1n"
            ] }),
            /* @__PURE__ */ jsxDEV("span", { class: "text-[#1f1b4b]", children: "|" }),
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-400", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-eye mr-1 text-slate-500" }),
              p.view_count,
              " xem"
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("p", { class: "text-[#9f9dbb] text-sm leading-relaxed mb-5", children: p.short_desc }),
          /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#0f0e26] via-[#1a184c]/50 to-[#0b0a19] p-5 mb-4 glow-brand relative overflow-hidden", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "flex items-end flex-wrap gap-3 mb-1.5", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "text-3xl md:text-4xl font-extrabold text-[#f43f5e] leading-none", children: formatVND(p.price) }),
              p.original_price && p.original_price > p.price && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                /* @__PURE__ */ jsxDEV("span", { class: "text-base text-slate-500 line-through leading-none", children: formatVND(p.original_price) }),
                /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold", children: [
                  "-",
                  off,
                  "%"
                ] })
              ] })
            ] }),
            save > 0 && /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-emerald-400 font-bold flex items-center gap-1", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-piggy-bank text-sm" }),
              "Ti\u1EBFt ki\u1EC7m ",
              formatVND(save)
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "mt-4 pt-3 border-t border-indigo-500/20 text-[11px] text-[#9f9dbb] flex flex-wrap gap-x-4 gap-y-1.5", children: [
              /* @__PURE__ */ jsxDEV("span", { children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-infinity text-indigo-400 mr-1" }),
                "S\u1EDF h\u1EEFu tr\u1ECDn \u0111\u1EDDi"
              ] }),
              /* @__PURE__ */ jsxDEV("span", { children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-bolt text-indigo-400 mr-1" }),
                "Giao t\u1EF1 \u0111\u1ED9ng"
              ] }),
              /* @__PURE__ */ jsxDEV("span", { children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-rotate-left text-indigo-400 mr-1" }),
                "Ho\xE0n ti\u1EC1n 7 ng\xE0y"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "mb-5 bg-[#16143c]/60 border border-[#1f1b4b] p-4 rounded-xl", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between text-xs mb-2", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "text-rose-400 font-bold flex items-center gap-1", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" }),
                "\u01AFu \u0111\xE3i s\u1EAFp h\u1EBFt h\u1EA1n!"
              ] }),
              /* @__PURE__ */ jsxDEV("span", { class: "text-slate-300 font-medium", children: [
                "Ch\u1EC9 c\xF2n ",
                /* @__PURE__ */ jsxDEV("b", { children: "7/20" }),
                " l\u01B0\u1EE3t t\u1EA3i \u01B0u \u0111\xE3i"
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "w-full h-2.5 rounded-full bg-[#080716] overflow-hidden p-0.5 border border-[#1f1b4b]", children: /* @__PURE__ */ jsxDEV("div", { class: "h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full", style: "width: 65%;" }) })
          ] }),
          owned ? /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 mb-4", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2.5 text-emerald-400 font-bold mb-2", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-check text-lg" }),
              "B\u1EA1n \u0111\xE3 s\u1EDF h\u1EEFu s\u1EA3n ph\u1EA9m n\xE0y"
            ] }),
            /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-emerald-300/80 mb-3.5 leading-relaxed", children: "Truy c\u1EADp link t\u1EA3i s\u1EA3n ph\u1EA9m v\xE0 license key trong khu v\u1EF1c t\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n." }),
            /* @__PURE__ */ jsxDEV("a", { href: "/tai-khoan/san-pham", class: "inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-download" }),
              "Truy c\u1EADp s\u1EA3n ph\u1EA9m"
            ] })
          ] }) : /* @__PURE__ */ jsxDEV("div", { class: "flex flex-col gap-2.5 mb-4", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap gap-2.5", children: [
              /* @__PURE__ */ jsxDEV("button", { class: "btn-buy-now flex-1 min-w-[150px] h-12 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold hover:opacity-95 transition shadow-lg shadow-rose-500/10", "data-id": p.id, children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-bolt mr-1.5" }),
                "Mua ngay"
              ] }),
              /* @__PURE__ */ jsxDEV("button", { class: "btn-add-cart flex-1 min-w-[150px] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-md shadow-indigo-600/10", "data-id": p.id, "data-name": p.name, children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-cart-plus mr-1.5" }),
                "Th\xEAm v\xE0o gi\u1ECF"
              ] }),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  class: `btn-wishlist w-12 h-12 rounded-xl border border-[#1f1b4b] hover:border-rose-500 transition flex items-center justify-center ${inWishlist ? "text-rose-500 bg-rose-500/10" : "text-slate-400 bg-white/5"}`,
                  "data-id": p.id,
                  title: "Y\xEAu th\xEDch",
                  children: /* @__PURE__ */ jsxDEV("i", { class: `${inWishlist ? "fas" : "far"} fa-heart` })
                }
              )
            ] }),
            /* @__PURE__ */ jsxDEV(
              "a",
              {
                href: `https://zalo.me/${settings?.zalo}`,
                target: "_blank",
                rel: "noopener",
                class: "flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-bold text-xs hover:bg-indigo-500/20 hover:text-white transition duration-200",
                children: [
                  /* @__PURE__ */ jsxDEV("i", { class: "fab fa-whatsapp text-sm" }),
                  "Li\xEAn h\u1EC7 t\u01B0 v\u1EA5n Zalo nh\u1EADn khuy\u1EBFn m\xE3i th\xEAm"
                ]
              }
            )
          ] }),
          p.demo_url && /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: p.demo_url,
              target: "_blank",
              rel: "noopener",
              class: "flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-[#1f1b4b] hover:border-indigo-500 text-indigo-400 hover:text-white hover:bg-[#16143c] font-semibold text-xs transition mb-5",
              children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-up-right-from-square" }),
                "Xem demo tr\u1EF1c ti\u1EBFp"
              ]
            }
          ),
          features.length > 0 && /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5 mb-4", children: [
            /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-3 text-xs uppercase tracking-wider", children: "B\u1EA1n nh\u1EADn \u0111\u01B0\u1EE3c" }),
            /* @__PURE__ */ jsxDEV("ul", { class: "space-y-2", children: features.map((f) => /* @__PURE__ */ jsxDEV("li", { class: "flex gap-2.5 text-xs text-[#9f9dbb]", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-check text-emerald-400 mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsxDEV("span", { children: f })
            ] })) })
          ] }),
          tech.length > 0 && /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5", children: [
            /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-3 text-xs uppercase tracking-wider", children: "C\xF4ng ngh\u1EC7 s\u1EED d\u1EE5ng" }),
            /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap gap-1.5", children: tech.map((t) => /* @__PURE__ */ jsxDEV("span", { class: "px-2.5 py-1 rounded-lg bg-[#16143c] text-[#e2e1f5] text-[10px] font-bold border border-[#1f1b4b]", children: t })) })
          ] })
        ] })
      ] })
    ] }) }),
    comboItems.length > 0 && /* @__PURE__ */ jsxDEV("section", { class: "max-w-7xl mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxDEV(SectionTitle, { title: "Combo n\xE0y bao g\u1ED3m", subtitle: `${comboItems.length} s\u1EA3n ph\u1EA9m \u2014 mua l\u1EBB t\u1ED1n ${formatVND(comboItems.reduce((s, i) => s + i.price, 0))}` }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 lg:grid-cols-4 gap-5", children: comboItems.map((i) => /* @__PURE__ */ jsxDEV(ProductCard, { p: i, compact: true })) })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 py-10", children: /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[1fr_320px] gap-8", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-1 border-b border-[#1f1b4b] mb-6 overflow-x-auto", children: [
          /* @__PURE__ */ jsxDEV("button", { class: "tab-btn active px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 whitespace-nowrap", "data-tab": "desc", "data-group": "pd", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-file-lines mr-1.5" }),
            "M\xF4 t\u1EA3 chi ti\u1EBFt"
          ] }),
          /* @__PURE__ */ jsxDEV("button", { class: "tab-btn px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 whitespace-nowrap", "data-tab": "rev", "data-group": "pd", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-star mr-1.5" }),
            "\u0110\xE1nh gi\xE1 (",
            p.rating_count,
            ")"
          ] }),
          /* @__PURE__ */ jsxDEV("button", { class: "tab-btn px-4 py-3 text-sm font-bold border-b-2 border-transparent text-slate-400 whitespace-nowrap", "data-tab": "policy", "data-group": "pd", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-shield-halved mr-1.5" }),
            "Ch\xEDnh s\xE1ch"
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "tab-panel bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-6 md:p-8", "data-tab": "desc", "data-group": "pd", children: /* @__PURE__ */ jsxDEV("div", { class: "prose-vn max-w-none", dangerouslySetInnerHTML: { __html: p.description || "<p>\u0110ang c\u1EADp nh\u1EADt m\xF4 t\u1EA3.</p>" } }) }),
        /* @__PURE__ */ jsxDEV("div", { class: "tab-panel hidden", "data-tab": "rev", "data-group": "pd", id: "reviews", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-6 mb-5", children: /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-[180px_1fr] gap-7 items-center", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "text-center", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "text-5xl font-extrabold text-white", children: p.rating.toFixed(1) }),
              /* @__PURE__ */ jsxDEV("div", { class: "my-2", children: /* @__PURE__ */ jsxDEV(Stars, { rating: p.rating, size: "text-base" }) }),
              /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-400", children: [
                p.rating_count,
                " \u0111\xE1nh gi\xE1"
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "space-y-1.5", children: [5, 4, 3, 2, 1].map((star) => {
              const cnt = ratingBreakdown[star] || 0;
              const totalR = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round(cnt / totalR * 100);
              return /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2.5 text-xs", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "w-10 text-slate-400 shrink-0", children: [
                  star,
                  " ",
                  /* @__PURE__ */ jsxDEV("i", { class: "fas fa-star text-amber-400" })
                ] }),
                /* @__PURE__ */ jsxDEV("div", { class: "flex-1 h-2 rounded-full bg-[#16143c] overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { class: "h-full bg-amber-400 rounded-full", style: `width:${pct}%` }) }),
                /* @__PURE__ */ jsxDEV("span", { class: "w-8 text-right text-slate-400", children: cnt })
              ] });
            }) })
          ] }) }),
          canReview && /* @__PURE__ */ jsxDEV("form", { action: "/api/reviews", method: "post", "data-ajax": true, "data-reload": "true", class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-6 mb-5", children: [
            /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-4", children: "Vi\u1EBFt \u0111\xE1nh gi\xE1 c\u1EE7a b\u1EA1n" }),
            /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "product_id", value: p.id }),
            /* @__PURE__ */ jsxDEV("div", { class: "mb-4", children: [
              /* @__PURE__ */ jsxDEV("label", { class: "block text-xs font-semibold text-[#9f9dbb] mb-2", children: "S\u1ED1 sao" }),
              /* @__PURE__ */ jsxDEV("select", { name: "rating", class: "h-10 px-3 rounded-lg border border-[#1f1b4b] bg-[#16143c] text-white outline-none focus:border-indigo-500/50 text-xs", children: [5, 4, 3, 2, 1].map((s) => /* @__PURE__ */ jsxDEV("option", { value: s, children: [
                s,
                " sao"
              ] })) })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "mb-4", children: [
              /* @__PURE__ */ jsxDEV("label", { class: "block text-xs font-semibold text-[#9f9dbb] mb-2", children: "Nh\u1EADn x\xE9t" }),
              /* @__PURE__ */ jsxDEV(
                "textarea",
                {
                  name: "comment",
                  rows: 4,
                  required: true,
                  placeholder: "Chia s\u1EBB tr\u1EA3i nghi\u1EC7m c\u1EE7a b\u1EA1n v\u1EC1 s\u1EA3n ph\u1EA9m n\xE0y...",
                  class: "w-full p-3 rounded-lg border border-[#1f1b4b] bg-[#16143c] text-white outline-none focus:border-indigo-500/50 text-xs resize-y"
                }
              )
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden text-xs text-rose-500 mb-3" }),
            /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/10", children: "G\u1EEDi \u0111\xE1nh gi\xE1" })
          ] }),
          !user && /* @__PURE__ */ jsxDEV("div", { class: "bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 mb-5 text-xs text-amber-300", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-info mr-1.5" }),
            /* @__PURE__ */ jsxDEV("a", { href: "/dang-nhap", class: "font-bold underline", children: "\u0110\u0103ng nh\u1EADp" }),
            " v\xE0 mua s\u1EA3n ph\u1EA9m \u0111\u1EC3 vi\u1EBFt \u0111\xE1nh gi\xE1."
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "space-y-3", children: [
            reviews.length === 0 && /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-10 text-center text-[#9f9dbb] text-xs", children: "Ch\u01B0a c\xF3 \u0111\xE1nh gi\xE1 n\xE0o. H\xE3y l\xE0 ng\u01B0\u1EDDi \u0111\u1EA7u ti\xEAn!" }),
            reviews.map((r) => /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5", children: /* @__PURE__ */ jsxDEV("div", { class: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center font-bold text-xs shrink-0", children: (r.full_name || "K").charAt(0).toUpperCase() }),
              /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsxDEV("b", { class: "text-xs text-white", children: r.full_name }),
                  /* @__PURE__ */ jsxDEV("span", { class: "px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold", children: "\u0110\xE3 mua" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "text-[10px] text-slate-500 ml-auto", children: formatDate(r.created_at) })
                ] }),
                /* @__PURE__ */ jsxDEV(Stars, { rating: r.rating }),
                /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-[#9f9dbb] mt-2 leading-relaxed", children: r.comment })
              ] })
            ] }) }))
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "tab-panel hidden bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-6 md:p-8", "data-tab": "policy", "data-group": "pd", children: /* @__PURE__ */ jsxDEV("div", { class: "prose-vn max-w-none", children: [
          /* @__PURE__ */ jsxDEV("h3", { children: "Ch\xEDnh s\xE1ch giao h\xE0ng" }),
          /* @__PURE__ */ jsxDEV("p", { children: [
            "S\u1EA3n ph\u1EA9m s\u1ED1 \u0111\u01B0\u1EE3c giao ",
            /* @__PURE__ */ jsxDEV("b", { children: "t\u1EF1 \u0111\u1ED9ng 100%" }),
            '. Ngay sau khi \u0111\u01A1n h\xE0ng chuy\u1EC3n sang tr\u1EA1ng th\xE1i "\u0110\xE3 thanh to\xE1n", link t\u1EA3i s\u1EA3n ph\u1EA9m v\xE0 license key s\u1EBD xu\u1EA5t hi\u1EC7n trong m\u1EE5c ',
            /* @__PURE__ */ jsxDEV("b", { children: "T\xE0i kho\u1EA3n \u2192 S\u1EA3n ph\u1EA9m c\u1EE7a t\xF4i" }),
            "."
          ] }),
          /* @__PURE__ */ jsxDEV("h3", { children: "Ch\xEDnh s\xE1ch b\u1EA3o h\xE0nh" }),
          /* @__PURE__ */ jsxDEV("ul", { children: [
            /* @__PURE__ */ jsxDEV("li", { children: "H\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt mi\u1EC5n ph\xED 6-12 th\xE1ng tu\u1EF3 s\u1EA3n ph\u1EA9m" }),
            /* @__PURE__ */ jsxDEV("li", { children: "Nh\u1EADn b\u1EA3n c\u1EADp nh\u1EADt mi\u1EC5n ph\xED tr\u1ECDn \u0111\u1EDDi" }),
            /* @__PURE__ */ jsxDEV("li", { children: "H\u1ED7 tr\u1EE3 c\xE0i \u0111\u1EB7t qua Zalo/Ultraview khi c\u1EA7n" })
          ] }),
          /* @__PURE__ */ jsxDEV("h3", { children: "Ch\xEDnh s\xE1ch ho\xE0n ti\u1EC1n" }),
          /* @__PURE__ */ jsxDEV("p", { children: [
            "Ho\xE0n ti\u1EC1n ",
            /* @__PURE__ */ jsxDEV("b", { children: "100%" }),
            " trong v\xF2ng ",
            /* @__PURE__ */ jsxDEV("b", { children: "7 ng\xE0y" }),
            " n\u1EBFu s\u1EA3n ph\u1EA9m kh\xF4ng \u0111\xFAng nh\u01B0 m\xF4 t\u1EA3 ho\u1EB7c kh\xF4ng th\u1EC3 c\xE0i \u0111\u1EB7t \u0111\u01B0\u1EE3c do l\u1ED7i t\u1EEB ph\xEDa ch\xFAng t\xF4i."
          ] }),
          /* @__PURE__ */ jsxDEV("h3", { children: "B\u1EA3n quy\u1EC1n s\u1EED d\u1EE5ng" }),
          /* @__PURE__ */ jsxDEV("ul", { children: [
            /* @__PURE__ */ jsxDEV("li", { children: "\u0110\u01B0\u1EE3c d\xF9ng cho d\u1EF1 \xE1n c\xE1 nh\xE2n v\xE0 th\u01B0\u01A1ng m\u1EA1i kh\xF4ng gi\u1EDBi h\u1EA1n" }),
            /* @__PURE__ */ jsxDEV("li", { children: "\u0110\u01B0\u1EE3c ch\u1EC9nh s\u1EEDa m\xE3 ngu\u1ED3n theo nhu c\u1EA7u" }),
            /* @__PURE__ */ jsxDEV("li", { children: "Kh\xF4ng \u0111\u01B0\u1EE3c b\xE1n l\u1EA1i nguy\xEAn b\u1EA3n source code cho b\xEAn th\u1EE9 ba" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxDEV("aside", { class: "space-y-4 lg:sticky-side", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl border border-[#1f1b4b] p-5", children: [
          /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-white mb-3.5 text-xs uppercase tracking-wider", children: "Cam k\u1EBFt c\u1EE7a ch\xFAng t\xF4i" }),
          /* @__PURE__ */ jsxDEV("ul", { class: "space-y-3 text-xs", children: [
            ["fa-bolt", "Giao h\xE0ng t\u1EF1 \u0111\u1ED9ng 24/7"],
            ["fa-infinity", "S\u1EDF h\u1EEFu tr\u1ECDn \u0111\u1EDDi, update free"],
            ["fa-headset", "H\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt 1-1 qua Zalo"],
            ["fa-shield-halved", "Ho\xE0n ti\u1EC1n 100% trong 7 ng\xE0y"],
            ["fa-lock", "Thanh to\xE1n an to\xE0n qua VietQR"]
          ].map(([ic, t]) => /* @__PURE__ */ jsxDEV("li", { class: "flex gap-2.5 text-[#9f9dbb]", children: [
            /* @__PURE__ */ jsxDEV("i", { class: `fas ${ic} text-indigo-400 mt-0.5 w-4` }),
            /* @__PURE__ */ jsxDEV("span", { children: t })
          ] })) })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "bg-[#0f0e26] rounded-2xl p-5 text-white border border-[#1f1b4b]", children: [
          /* @__PURE__ */ jsxDEV("h3", { class: "font-bold mb-1.5 text-xs uppercase tracking-wider text-white", children: "C\u1EA7n t\u01B0 v\u1EA5n th\xEAm?" }),
          /* @__PURE__ */ jsxDEV("p", { class: "text-[11px] text-[#9f9dbb] mb-4 leading-relaxed", children: "\u0110\u1ED9i ng\u0169 h\u1ED7 tr\u1EE3 s\u1EB5n s\xE0ng gi\u1EA3i \u0111\xE1p m\u1ECDi th\u1EAFc m\u1EAFc c\u1EE7a b\u1EA1n 24/7." }),
          /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: `https://zalo.me/${settings?.zalo}`,
              target: "_blank",
              rel: "noopener",
              class: "flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs transition mb-2",
              children: "Chat Zalo ngay"
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: `tel:${(settings?.hotline || "").replace(/\s/g, "")}`,
              class: "flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#16143c] border border-[#1f1b4b] text-[#e2e1f5] font-bold text-xs hover:bg-white/5 transition",
              children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-phone" }),
                settings?.hotline
              ]
            }
          )
        ] })
      ] })
    ] }) }),
    related.length > 0 && /* @__PURE__ */ jsxDEV("section", { class: "max-w-7xl mx-auto px-4 py-10", children: [
      /* @__PURE__ */ jsxDEV(SectionTitle, { title: "S\u1EA3n ph\u1EA9m li\xEAn quan", subtitle: "C\xF3 th\u1EC3 b\u1EA1n c\u0169ng quan t\xE2m" }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 lg:grid-cols-4 gap-5", children: related.map((r) => /* @__PURE__ */ jsxDEV(ProductCard, { p: r })) })
    ] })
  ] });
};

// src/pages/auth.tsx
var AuthShell = ({ title: title2, subtitle, children }) => /* @__PURE__ */ jsxDEV("div", { class: "min-h-[calc(100vh-64px)] grid lg:grid-cols-2", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "hidden lg:flex relative bg-slate-950 text-white p-12 flex-col justify-between overflow-hidden", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "absolute inset-0 hero-mesh" }),
    /* @__PURE__ */ jsxDEV("div", { class: "absolute inset-0 hero-grid" }),
    /* @__PURE__ */ jsxDEV("div", { class: "relative", children: /* @__PURE__ */ jsxDEV("a", { href: "/", class: "flex items-center gap-2.5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-wand-magic-sparkles" }) }),
      /* @__PURE__ */ jsxDEV("span", { class: "font-extrabold text-lg", children: "WebSkill AI" })
    ] }) }),
    /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
      /* @__PURE__ */ jsxDEV("h2", { class: "text-3xl xl:text-4xl font-extrabold leading-tight mb-4", children: [
        "Kho ",
        /* @__PURE__ */ jsxDEV("span", { class: "bg-gradient-to-r from-brand-400 to-fuchsia-400 bg-clip-text text-transparent", children: "Source Code & Tool AI" }),
        " t\u1EA1o video"
      ] }),
      /* @__PURE__ */ jsxDEV("p", { class: "text-slate-300 mb-8 max-w-md leading-relaxed", children: "Tham gia c\xF9ng h\xE0ng ngh\xECn creator \u0111ang d\xF9ng c\xF4ng c\u1EE5 c\u1EE7a ch\xFAng t\xF4i \u0111\u1EC3 s\u1EA3n xu\u1EA5t video b\xE1n h\xE0ng m\u1ED7i ng\xE0y." }),
      /* @__PURE__ */ jsxDEV("ul", { class: "space-y-3.5", children: [
        ["fa-bolt", "Giao h\xE0ng t\u1EF1 \u0111\u1ED9ng 24/7"],
        ["fa-infinity", "S\u1EDF h\u1EEFu tr\u1ECDn \u0111\u1EDDi, c\u1EADp nh\u1EADt mi\u1EC5n ph\xED"],
        ["fa-headset", "H\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt 1-1 qua Zalo"],
        ["fa-shield-halved", "Ho\xE0n ti\u1EC1n 100% trong 7 ng\xE0y"]
      ].map(([ic, t]) => /* @__PURE__ */ jsxDEV("li", { class: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "w-9 h-9 rounded-xl bg-white/10 border border-white/20 grid place-items-center text-brand-300 shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${ic}` }) }),
        /* @__PURE__ */ jsxDEV("span", { class: "text-slate-200 text-sm", children: t })
      ] })) })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "relative text-xs text-slate-500", children: "\xA9 2026 WebSkill AI \u2014 Ph\xE1t tri\u1EC3n t\u1EA1i Vi\u1EC7t Nam" })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-center p-6 md:p-12 bg-slate-50", children: /* @__PURE__ */ jsxDEV("div", { class: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight", children: title2 }),
    /* @__PURE__ */ jsxDEV("p", { class: "text-slate-500 mb-7", children: subtitle }),
    children
  ] }) })
] });
var inputCls = "w-full h-12 px-4 rounded-xl bg-white border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none text-sm transition";
var LoginPage = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, title: "\u0110\u0103ng nh\u1EADp", bodyClass: "bg-slate-50", children: /* @__PURE__ */ jsxDEV(AuthShell, { title: "\u0110\u0103ng nh\u1EADp", subtitle: "Ch\xE0o m\u1EEBng b\u1EA1n quay l\u1EA1i! \u0110\u0103ng nh\u1EADp \u0111\u1EC3 truy c\u1EADp s\u1EA3n ph\u1EA9m \u0111\xE3 mua.", children: [
  props.registered && /* @__PURE__ */ jsxDEV("div", { class: "mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800", children: [
    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-check mr-1.5" }),
    "\u0110\u0103ng k\xFD th\xE0nh c\xF4ng! Vui l\xF2ng \u0111\u0103ng nh\u1EADp."
  ] }),
  /* @__PURE__ */ jsxDEV("form", { action: "/api/auth/login", method: "post", "data-ajax": true, class: "space-y-4", children: [
    /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "next", value: props.next || "" }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "Email" }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
        /* @__PURE__ */ jsxDEV("input", { type: "email", name: "email", required: true, autocomplete: "email", placeholder: "email@example.com", class: inputCls + " pl-11", id: "login-email" }),
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between mb-1.5", children: [
        /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700", children: "M\u1EADt kh\u1EA9u" }),
        /* @__PURE__ */ jsxDEV("a", { href: "/quen-mat-khau", class: "text-xs text-brand-600 hover:underline", children: "Qu\xEAn m\u1EADt kh\u1EA9u?" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
        /* @__PURE__ */ jsxDEV("input", { type: "password", name: "password", required: true, autocomplete: "current-password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", class: inputCls + " pl-11", id: "login-password" }),
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700" }),
    /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "w-full h-12 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white font-bold hover:opacity-90 shadow-lg shadow-brand-500/25 transition", children: "\u0110\u0103ng nh\u1EADp" })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "mt-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-blue-900 mb-1.5", children: [
      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-flask mr-1.5" }),
      "T\xE0i kho\u1EA3n demo"
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "text-blue-800 space-y-0.5 text-xs", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        "\u{1F464} User: ",
        /* @__PURE__ */ jsxDEV("code", { class: "bg-white px-1.5 py-0.5 rounded", children: "demo@webskill.ai" }),
        " / ",
        /* @__PURE__ */ jsxDEV("code", { class: "bg-white px-1.5 py-0.5 rounded", children: "123456" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        "\u{1F6E1}\uFE0F Admin: ",
        /* @__PURE__ */ jsxDEV("code", { class: "bg-white px-1.5 py-0.5 rounded", children: "admin@webskill.ai" }),
        " / ",
        /* @__PURE__ */ jsxDEV("code", { class: "bg-white px-1.5 py-0.5 rounded", children: "123456" })
      ] })
    ] })
  ] }),
  /* @__PURE__ */ jsxDEV("p", { class: "mt-6 text-center text-sm text-slate-600", children: [
    "Ch\u01B0a c\xF3 t\xE0i kho\u1EA3n? ",
    /* @__PURE__ */ jsxDEV("a", { href: "/dang-ky", class: "font-semibold text-brand-600 hover:underline", children: "\u0110\u0103ng k\xFD ngay" })
  ] })
] }) });
var RegisterPage = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, title: "\u0110\u0103ng k\xFD", bodyClass: "bg-slate-50", children: /* @__PURE__ */ jsxDEV(AuthShell, { title: "T\u1EA1o t\xE0i kho\u1EA3n", subtitle: "\u0110\u0103ng k\xFD mi\u1EC5n ph\xED trong 30 gi\xE2y \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u mua s\u1EAFm.", children: [
  /* @__PURE__ */ jsxDEV("form", { action: "/api/auth/register", method: "post", "data-ajax": true, class: "space-y-4", children: [
    /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "ref", value: props.ref || "" }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "H\u1ECD v\xE0 t\xEAn" }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
        /* @__PURE__ */ jsxDEV("input", { type: "text", name: "full_name", required: true, placeholder: "Nguy\u1EC5n V\u0103n A", class: inputCls + " pl-11" }),
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "Email" }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
        /* @__PURE__ */ jsxDEV("input", { type: "email", name: "email", required: true, autocomplete: "email", placeholder: "email@example.com", class: inputCls + " pl-11" }),
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: [
        "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i ",
        /* @__PURE__ */ jsxDEV("span", { class: "text-slate-400 font-normal", children: "(tu\u1EF3 ch\u1ECDn)" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
        /* @__PURE__ */ jsxDEV("input", { type: "tel", name: "phone", placeholder: "0915967790", class: inputCls + " pl-11" }),
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "M\u1EADt kh\u1EA9u" }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
        /* @__PURE__ */ jsxDEV("input", { type: "password", name: "password", required: true, minlength: 6, autocomplete: "new-password", placeholder: "T\u1ED1i thi\u1EC3u 6 k\xFD t\u1EF1", class: inputCls + " pl-11" }),
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("label", { class: "flex items-start gap-2.5 text-sm text-slate-600 cursor-pointer", children: [
      /* @__PURE__ */ jsxDEV("input", { type: "checkbox", required: true, class: "mt-0.5 accent-brand-600" }),
      /* @__PURE__ */ jsxDEV("span", { children: [
        "T\xF4i \u0111\u1ED3ng \xFD v\u1EDBi ",
        /* @__PURE__ */ jsxDEV("a", { href: "/dieu-khoan", class: "text-brand-600 hover:underline", children: "\u0110i\u1EC1u kho\u1EA3n s\u1EED d\u1EE5ng" }),
        " v\xE0 ",
        /* @__PURE__ */ jsxDEV("a", { href: "/chinh-sach", class: "text-brand-600 hover:underline", children: "Ch\xEDnh s\xE1ch b\u1EA3o m\u1EADt" })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700" }),
    /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "w-full h-12 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white font-bold hover:opacity-90 shadow-lg shadow-brand-500/25 transition", children: "\u0110\u0103ng k\xFD t\xE0i kho\u1EA3n" })
  ] }),
  /* @__PURE__ */ jsxDEV("p", { class: "mt-6 text-center text-sm text-slate-600", children: [
    "\u0110\xE3 c\xF3 t\xE0i kho\u1EA3n? ",
    /* @__PURE__ */ jsxDEV("a", { href: "/dang-nhap", class: "font-semibold text-brand-600 hover:underline", children: "\u0110\u0103ng nh\u1EADp" })
  ] })
] }) });
var ForgotPage = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, title: "Qu\xEAn m\u1EADt kh\u1EA9u", bodyClass: "bg-slate-50", children: /* @__PURE__ */ jsxDEV(AuthShell, { title: "Qu\xEAn m\u1EADt kh\u1EA9u", subtitle: "Li\xEAn h\u1EC7 h\u1ED7 tr\u1EE3 \u0111\u1EC3 \u0111\u01B0\u1EE3c c\u1EA5p l\u1EA1i m\u1EADt kh\u1EA9u nhanh ch\xF3ng.", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "p-5 rounded-2xl bg-white border border-slate-200 space-y-4", children: [
    /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-slate-600 leading-relaxed", children: "Hi\u1EC7n t\u1EA1i vi\u1EC7c kh\xF4i ph\u1EE5c m\u1EADt kh\u1EA9u \u0111\u01B0\u1EE3c x\u1EED l\xFD th\u1EE7 c\xF4ng qua \u0111\u1ED9i ng\u0169 h\u1ED7 tr\u1EE3 \u0111\u1EC3 \u0111\u1EA3m b\u1EA3o an to\xE0n t\xE0i kho\u1EA3n. Vui l\xF2ng li\xEAn h\u1EC7 v\u1EDBi ch\xFAng t\xF4i k\xE8m email \u0111\xE3 \u0111\u0103ng k\xFD." }),
    /* @__PURE__ */ jsxDEV(
      "a",
      {
        href: `https://zalo.me/${props.settings?.zalo}`,
        target: "_blank",
        rel: "noopener",
        class: "flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition",
        children: "Chat Zalo h\u1ED7 tr\u1EE3"
      }
    ),
    /* @__PURE__ */ jsxDEV(
      "a",
      {
        href: `mailto:${props.settings?.email}`,
        class: "flex items-center justify-center gap-2 w-full h-12 rounded-xl border-2 border-slate-200 hover:border-brand-400 font-semibold text-sm transition",
        children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-envelope" }),
          "G\u1EEDi email h\u1ED7 tr\u1EE3"
        ]
      }
    )
  ] }),
  /* @__PURE__ */ jsxDEV("p", { class: "mt-6 text-center text-sm text-slate-600", children: /* @__PURE__ */ jsxDEV("a", { href: "/dang-nhap", class: "font-semibold text-brand-600 hover:underline", children: [
    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-left mr-1" }),
    "Quay l\u1EA1i \u0111\u0103ng nh\u1EADp"
  ] }) })
] }) });

// src/pages/cart.tsx
var CartPage = (props) => {
  const { items, subtotal } = props;
  return /* @__PURE__ */ jsxDEV(Layout, { ...props, title: "Gi\u1ECF h\xE0ng", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxDEV(Breadcrumb, { items: [{ label: "Gi\u1ECF h\xE0ng" }] }),
    /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-7", children: "Gi\u1ECF h\xE0ng c\u1EE7a b\u1EA1n" }),
    items.length === 0 ? /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200", children: /* @__PURE__ */ jsxDEV(
      EmptyState,
      {
        icon: "fa-cart-shopping",
        title: "Gi\u1ECF h\xE0ng \u0111ang tr\u1ED1ng",
        desc: "Kh\xE1m ph\xE1 kho source code v\xE0 tool AI c\u1EE7a ch\xFAng t\xF4i \u0111\u1EC3 t\xECm s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p.",
        action: { href: "/san-pham", label: "Xem s\u1EA3n ph\u1EA9m" }
      }
    ) }) : /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[1fr_360px] gap-6", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "space-y-3", children: [
        items.map((p) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-4 flex gap-4", children: [
          /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: `/san-pham/${p.slug}`,
              class: "w-24 sm:w-32 aspect-video rounded-xl overflow-hidden shrink-0 grid place-items-center text-white",
              style: p.thumbnail ? "" : `background:${gradientFor(p.id)}`,
              children: p.thumbnail ? /* @__PURE__ */ jsxDEV("img", { src: p.thumbnail, alt: p.name, class: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxDEV("i", { class: `fas ${p.product_type === "chatbot" ? "fa-robot" : p.product_type === "prompt" ? "fa-wand-magic-sparkles" : p.product_type === "combo" ? "fa-box-open" : "fa-code"} text-xl` })
            }
          ),
          /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "text-[11px] text-brand-600 font-bold mb-1", children: PRODUCT_TYPE_LABEL[p.product_type] }),
            /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5", children: /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${p.slug}`, class: "hover:text-brand-600", children: p.name }) }),
            /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 mb-2", children: [
              p.version,
              " \xB7 S\u1EDF h\u1EEFu tr\u1ECDn \u0111\u1EDDi"
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "flex items-end justify-between gap-3", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                p.original_price && p.original_price > p.price && /* @__PURE__ */ jsxDEV("span", { class: "text-xs text-slate-400 line-through mr-2", children: formatVND(p.original_price) }),
                /* @__PURE__ */ jsxDEV("span", { class: "text-lg font-extrabold text-rose-600", children: formatVND(p.price) })
              ] }),
              /* @__PURE__ */ jsxDEV("button", { class: "btn-remove-cart text-slate-400 hover:text-rose-500 text-sm transition", "data-id": p.id, title: "Xo\xE1", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-trash-can" }) })
            ] })
          ] })
        ] })),
        /* @__PURE__ */ jsxDEV("a", { href: "/san-pham", class: "inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline mt-2", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-left" }),
          "Ti\u1EBFp t\u1EE5c mua s\u1EAFm"
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("aside", { class: "lg:sticky-side", children: /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-4", children: "T\xF3m t\u1EAFt \u0111\u01A1n h\xE0ng" }),
        /* @__PURE__ */ jsxDEV("div", { class: "space-y-2.5 text-sm pb-4 border-b border-slate-100", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "S\u1ED1 s\u1EA3n ph\u1EA9m" }),
            /* @__PURE__ */ jsxDEV("b", { children: items.length })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "T\u1EA1m t\xEDnh" }),
            /* @__PURE__ */ jsxDEV("b", { children: formatVND(subtotal) })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "Ph\xED giao h\xE0ng" }),
            /* @__PURE__ */ jsxDEV("b", { class: "text-emerald-600", children: "Mi\u1EC5n ph\xED" })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between items-end py-4", children: [
          /* @__PURE__ */ jsxDEV("span", { class: "font-bold text-slate-900", children: "T\u1ED5ng c\u1ED9ng" }),
          /* @__PURE__ */ jsxDEV("span", { class: "text-2xl font-extrabold text-rose-600", children: formatVND(subtotal) })
        ] }),
        /* @__PURE__ */ jsxDEV("a", { href: "/thanh-toan", class: "flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white font-bold hover:opacity-90 shadow-lg shadow-brand-500/25 transition", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-lock" }),
          "Ti\u1EBFn h\xE0nh thanh to\xE1n"
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-bolt text-brand-500 w-4" }),
            "Nh\u1EADn source code ngay sau thanh to\xE1n"
          ] }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-shield-halved text-brand-500 w-4" }),
            "Ho\xE0n ti\u1EC1n 100% trong 7 ng\xE0y"
          ] }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-headset text-brand-500 w-4" }),
            "H\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt 1-1"
          ] })
        ] })
      ] }) })
    ] })
  ] }) });
};
var CheckoutPage = (props) => {
  const { items, subtotal, balance } = props;
  return /* @__PURE__ */ jsxDEV(Layout, { ...props, title: "Thanh to\xE1n", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 py-8", children: [
      /* @__PURE__ */ jsxDEV(Breadcrumb, { items: [{ label: "Gi\u1ECF h\xE0ng", href: "/gio-hang" }, { label: "Thanh to\xE1n" }] }),
      /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-7", children: "Thanh to\xE1n" }),
      /* @__PURE__ */ jsxDEV("form", { id: "checkout-form", class: "grid lg:grid-cols-[1fr_380px] gap-6", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "space-y-4", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
            /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-4", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-user mr-2 text-brand-500" }),
              "Th\xF4ng tin kh\xE1ch h\xE0ng"
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "H\u1ECD t\xEAn" }),
                /* @__PURE__ */ jsxDEV("input", { type: "text", value: props.user?.full_name, disabled: true, class: "w-full h-11 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-600" })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "Email nh\u1EADn s\u1EA3n ph\u1EA9m" }),
                /* @__PURE__ */ jsxDEV("input", { type: "email", value: props.user?.email, disabled: true, class: "w-full h-11 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-600" })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "mt-4", children: [
              /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: [
                "Ghi ch\xFA ",
                /* @__PURE__ */ jsxDEV("span", { class: "text-slate-400 font-normal", children: "(tu\u1EF3 ch\u1ECDn)" })
              ] }),
              /* @__PURE__ */ jsxDEV(
                "textarea",
                {
                  name: "note",
                  id: "checkout-note",
                  rows: 2,
                  placeholder: "Y\xEAu c\u1EA7u th\xEAm cho \u0111\u01A1n h\xE0ng...",
                  class: "w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm resize-y"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
            /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-4", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-credit-card mr-2 text-brand-500" }),
              "Ph\u01B0\u01A1ng th\u1EE9c thanh to\xE1n"
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "space-y-2.5", children: [
              /* @__PURE__ */ jsxDEV("label", { class: "flex items-center gap-3.5 p-4 rounded-xl border-2 border-brand-500 bg-brand-50 cursor-pointer", children: [
                /* @__PURE__ */ jsxDEV("input", { type: "radio", name: "payment_method", value: "bank", checked: true, class: "accent-brand-600" }),
                /* @__PURE__ */ jsxDEV("div", { class: "w-10 h-10 rounded-lg bg-white grid place-items-center text-brand-600 shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-qrcode" }) }),
                /* @__PURE__ */ jsxDEV("div", { class: "flex-1", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900 text-sm", children: "Chuy\u1EC3n kho\u1EA3n QR (VietQR)" }),
                  /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: "Qu\xE9t m\xE3 QR b\u1EB1ng app ng\xE2n h\xE0ng \u2014 x\xE1c nh\u1EADn nhanh nh\u1EA5t" })
                ] }),
                /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold", children: "KHUY\xCAN D\xD9NG" })
              ] }),
              /* @__PURE__ */ jsxDEV("label", { class: "flex items-center gap-3.5 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 cursor-pointer transition", children: [
                /* @__PURE__ */ jsxDEV("input", { type: "radio", name: "payment_method", value: "momo", class: "accent-brand-600" }),
                /* @__PURE__ */ jsxDEV("div", { class: "w-10 h-10 rounded-lg bg-pink-50 grid place-items-center text-pink-600 shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-wallet" }) }),
                /* @__PURE__ */ jsxDEV("div", { class: "flex-1", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900 text-sm", children: "V\xED MoMo" }),
                  /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: "Chuy\u1EC3n kho\u1EA3n qua v\xED \u0111i\u1EC7n t\u1EED MoMo" })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("label", { class: `flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition ${balance >= subtotal ? "border-slate-200 hover:border-slate-300" : "border-slate-200 opacity-50 cursor-not-allowed"}`, children: [
                /* @__PURE__ */ jsxDEV("input", { type: "radio", name: "payment_method", value: "balance", disabled: balance < subtotal, class: "accent-brand-600" }),
                /* @__PURE__ */ jsxDEV("div", { class: "w-10 h-10 rounded-lg bg-emerald-50 grid place-items-center text-emerald-600 shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-piggy-bank" }) }),
                /* @__PURE__ */ jsxDEV("div", { class: "flex-1", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900 text-sm", children: [
                    "S\u1ED1 d\u01B0 v\xED ",
                    /* @__PURE__ */ jsxDEV("span", { class: "text-emerald-600", children: [
                      "(",
                      formatVND(balance),
                      ")"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: balance >= subtotal ? "Thanh to\xE1n t\u1EE9c th\xEC, nh\u1EADn source ngay" : "S\u1ED1 d\u01B0 kh\xF4ng \u0111\u1EE7 cho \u0111\u01A1n h\xE0ng n\xE0y" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
            /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-4", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-ticket mr-2 text-brand-500" }),
              "M\xE3 gi\u1EA3m gi\xE1"
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "flex gap-2", children: [
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  id: "coupon-input",
                  placeholder: "Nh\u1EADp m\xE3 gi\u1EA3m gi\xE1",
                  style: "text-transform:uppercase",
                  class: "flex-1 h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm"
                }
              ),
              /* @__PURE__ */ jsxDEV("button", { type: "button", id: "apply-coupon", class: "h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition", children: "\xC1p d\u1EE5ng" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { id: "coupon-msg", class: "mt-2.5 text-sm hidden" }),
            /* @__PURE__ */ jsxDEV("div", { class: "mt-3 flex flex-wrap gap-1.5", children: ["WELCOME10", "SALE20", "GIAM100K"].map((c) => /* @__PURE__ */ jsxDEV("button", { type: "button", class: "coupon-quick px-2.5 py-1 rounded-md bg-slate-100 hover:bg-brand-100 hover:text-brand-700 text-xs font-semibold transition", "data-code": c, children: c })) })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("aside", { class: "lg:sticky-side", children: /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
          /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-4", children: [
            "\u0110\u01A1n h\xE0ng (",
            items.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "space-y-3 max-h-64 overflow-y-auto pb-4 border-b border-slate-100", children: items.map((p) => /* @__PURE__ */ jsxDEV("div", { class: "flex gap-3", children: [
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                class: "w-14 aspect-video rounded-lg shrink-0 grid place-items-center text-white text-xs",
                style: p.thumbnail ? "" : `background:${gradientFor(p.id)}`,
                children: p.thumbnail ? /* @__PURE__ */ jsxDEV("img", { src: p.thumbnail, alt: "", class: "w-full h-full object-cover rounded-lg" }) : /* @__PURE__ */ jsxDEV("i", { class: "fas fa-code" })
              }
            ),
            /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "text-[13px] font-semibold text-slate-800 line-clamp-2 leading-snug", children: p.name }),
              /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-rose-600 font-bold mt-0.5", children: formatVND(p.price) })
            ] })
          ] })) }),
          /* @__PURE__ */ jsxDEV("div", { class: "space-y-2.5 text-sm py-4 border-b border-slate-100", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "T\u1EA1m t\xEDnh" }),
              /* @__PURE__ */ jsxDEV("b", { id: "sum-subtotal", children: formatVND(subtotal) })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", id: "discount-row", style: "display:none", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "Gi\u1EA3m gi\xE1" }),
              /* @__PURE__ */ jsxDEV("b", { class: "text-emerald-600", id: "sum-discount", children: "-0\u0111" })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between items-end py-4", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "font-bold text-slate-900", children: "T\u1ED5ng thanh to\xE1n" }),
            /* @__PURE__ */ jsxDEV("span", { class: "text-2xl font-extrabold text-rose-600", id: "sum-total", "data-subtotal": subtotal, children: formatVND(subtotal) })
          ] }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "submit",
              id: "place-order-btn",
              class: "flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold hover:opacity-90 shadow-lg shadow-rose-500/25 transition",
              children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-check-circle" }),
                "\u0110\u1EB7t h\xE0ng ngay"
              ]
            }
          ),
          /* @__PURE__ */ jsxDEV("p", { class: "mt-3 text-[11px] text-slate-400 text-center leading-relaxed", children: [
            "B\u1EB1ng vi\u1EC7c \u0111\u1EB7t h\xE0ng, b\u1EA1n \u0111\u1ED3ng \xFD v\u1EDBi ",
            /* @__PURE__ */ jsxDEV("a", { href: "/dieu-khoan", class: "text-brand-600 hover:underline", children: "\u0110i\u1EC1u kho\u1EA3n s\u1EED d\u1EE5ng" }),
            " c\u1EE7a ch\xFAng t\xF4i."
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("script", { dangerouslySetInnerHTML: {
      __html: `
(function(){
  var subtotal = ${subtotal};
  var coupon = null, discount = 0;
  function fmt(n){ return new Intl.NumberFormat('vi-VN').format(n)+'\u0111'; }
  function render(){
    document.getElementById('sum-discount').textContent = '-'+fmt(discount);
    document.getElementById('discount-row').style.display = discount>0?'flex':'none';
    document.getElementById('sum-total').textContent = fmt(Math.max(0, subtotal-discount));
  }
  document.querySelectorAll('.coupon-quick').forEach(function(b){
    b.onclick=function(){ document.getElementById('coupon-input').value=b.dataset.code; document.getElementById('apply-coupon').click(); };
  });
  document.getElementById('apply-coupon').onclick=async function(){
    var code=(document.getElementById('coupon-input').value||'').trim().toUpperCase();
    var msg=document.getElementById('coupon-msg');
    if(!code){ return; }
    try{
      var r=await axios.post('/api/coupons/check',{code:code, subtotal:subtotal});
      coupon=code; discount=r.data.discount; render();
      msg.className='mt-2.5 text-sm text-emerald-600'; msg.innerHTML='<i class="fas fa-circle-check mr-1"></i>\xC1p d\u1EE5ng th\xE0nh c\xF4ng! Gi\u1EA3m '+fmt(discount);
      msg.classList.remove('hidden');
    }catch(e){
      coupon=null; discount=0; render();
      msg.className='mt-2.5 text-sm text-rose-600';
      msg.innerHTML='<i class="fas fa-circle-xmark mr-1"></i>'+((e.response&&e.response.data&&e.response.data.error)||'M\xE3 kh\xF4ng h\u1EE3p l\u1EC7');
      msg.classList.remove('hidden');
    }
  };
  document.getElementById('checkout-form').onsubmit=async function(e){
    e.preventDefault();
    var btn=document.getElementById('place-order-btn'); var o=btn.innerHTML;
    btn.disabled=true; btn.innerHTML='<span class="spinner"></span> \u0110ang t\u1EA1o \u0111\u01A1n...';
    try{
      var pm=document.querySelector('input[name=payment_method]:checked').value;
      var r=await axios.post('/api/orders/create',{
        payment_method: pm, coupon_code: coupon, note: document.getElementById('checkout-note').value
      });
      location.href='/don-hang/'+r.data.order_code;
    }catch(err){
      btn.disabled=false; btn.innerHTML=o;
      toast((err.response&&err.response.data&&err.response.data.error)||'Kh\xF4ng th\u1EC3 t\u1EA1o \u0111\u01A1n h\xE0ng','error');
    }
  };
})();`
    } })
  ] });
};
var OrderPage = (props) => {
  const { order, items, bank } = props;
  const content = order.order_code;
  const qr = vietQrUrl(bank.bank_code, bank.bank_account, order.total, content, bank.bank_owner);
  return /* @__PURE__ */ jsxDEV(Layout, { ...props, title: `\u0110\u01A1n h\xE0ng ${order.order_code}`, children: [
    /* @__PURE__ */ jsxDEV("div", { class: "max-w-5xl mx-auto px-4 py-8", children: [
      /* @__PURE__ */ jsxDEV(Breadcrumb, { items: [{ label: "\u0110\u01A1n h\xE0ng", href: "/tai-khoan/don-hang" }, { label: order.order_code }] }),
      order.status === "paid" && /* @__PURE__ */ jsxDEV("div", { class: "rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-6 mb-6 text-center", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "w-14 h-14 rounded-2xl bg-emerald-500 text-white grid place-items-center text-2xl mx-auto mb-3", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-check" }) }),
        /* @__PURE__ */ jsxDEV("h2", { class: "text-xl font-extrabold text-emerald-900 mb-1.5", children: "Thanh to\xE1n th\xE0nh c\xF4ng!" }),
        /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-emerald-700 mb-4", children: "S\u1EA3n ph\u1EA9m \u0111\xE3 \u0111\u01B0\u1EE3c k\xEDch ho\u1EA1t trong t\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n." }),
        /* @__PURE__ */ jsxDEV("a", { href: "/tai-khoan/san-pham", class: "inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-download" }),
          "Nh\u1EADn source code ngay"
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[1fr_340px] gap-6", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "space-y-4", children: [
          order.status === "pending" && /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border-2 border-amber-200 overflow-hidden", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "bg-amber-50 px-5 py-3.5 border-b border-amber-200", children: /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-amber-900", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-qrcode mr-2" }),
              "Qu\xE9t m\xE3 QR \u0111\u1EC3 thanh to\xE1n"
            ] }) }),
            /* @__PURE__ */ jsxDEV("div", { class: "p-5 grid sm:grid-cols-[220px_1fr] gap-6", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "text-center", children: [
                /* @__PURE__ */ jsxDEV("img", { src: qr, alt: "QR thanh to\xE1n", class: "w-full max-w-[220px] mx-auto rounded-xl border border-slate-200" }),
                /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-slate-500 mt-2", children: "M\u1EDF app ng\xE2n h\xE0ng v\xE0 qu\xE9t m\xE3" })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "space-y-3", children: [
                [
                  ["Ng\xE2n h\xE0ng", bank.bank_name],
                  ["S\u1ED1 t\xE0i kho\u1EA3n", bank.bank_account],
                  ["Ch\u1EE7 t\xE0i kho\u1EA3n", bank.bank_owner],
                  ["S\u1ED1 ti\u1EC1n", formatVND(order.total)],
                  ["N\u1ED9i dung CK", content]
                ].map(([lb, val], i) => /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100", children: [
                  /* @__PURE__ */ jsxDEV("span", { class: "text-sm text-slate-500 shrink-0", children: lb }),
                  /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsxDEV("b", { class: `text-sm truncate ${i === 3 ? "text-rose-600 text-base" : i === 4 ? "text-brand-600" : "text-slate-900"}`, children: val }),
                    i >= 1 && /* @__PURE__ */ jsxDEV("button", { "data-copy": i === 3 ? String(order.total) : val, class: "shrink-0 w-7 h-7 rounded-md bg-slate-100 hover:bg-brand-100 hover:text-brand-600 text-slate-500 text-xs transition", children: /* @__PURE__ */ jsxDEV("i", { class: "far fa-copy" }) })
                  ] })
                ] })),
                /* @__PURE__ */ jsxDEV("div", { class: "p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed", children: [
                  /* @__PURE__ */ jsxDEV("i", { class: "fas fa-triangle-exclamation mr-1" }),
                  /* @__PURE__ */ jsxDEV("b", { children: "Quan tr\u1ECDng:" }),
                  " Vui l\xF2ng chuy\u1EC3n \u0111\xFAng s\u1ED1 ti\u1EC1n v\xE0 ghi \u0111\xFAng n\u1ED9i dung ",
                  /* @__PURE__ */ jsxDEV("b", { children: content }),
                  " \u0111\u1EC3 h\u1EC7 th\u1ED1ng t\u1EF1 \u0111\u1ED9ng x\xE1c nh\u1EADn."
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "px-5 pb-5", children: [
              /* @__PURE__ */ jsxDEV("div", { id: "pay-status", class: "mb-3 p-3.5 rounded-xl bg-brand-50 border border-brand-200 flex items-center gap-3", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "spinner shrink-0" }),
                /* @__PURE__ */ jsxDEV("div", { class: "min-w-0", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "text-sm font-bold text-brand-900", children: "\u0110ang ch\u1EDD giao d\u1ECBch c\u1EE7a b\u1EA1n\u2026" }),
                  /* @__PURE__ */ jsxDEV("div", { id: "pay-status-msg", class: "text-xs text-brand-700 mt-0.5", children: "H\u1EC7 th\u1ED1ng t\u1EF1 \u0111\u1ED9ng ki\u1EC3m tra ng\xE2n h\xE0ng m\u1ED7i 5 gi\xE2y. Trang s\u1EBD t\u1EF1 chuy\u1EC3n khi nh\u1EADn \u0111\u01B0\u1EE3c ti\u1EC1n." })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("button", { id: "confirm-paid-btn", class: "w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:opacity-90 shadow-lg shadow-emerald-500/25 transition", children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-check-circle mr-1.5" }),
                "T\xF4i \u0111\xE3 chuy\u1EC3n kho\u1EA3n"
              ] }),
              /* @__PURE__ */ jsxDEV("p", { class: "text-[11px] text-slate-400 text-center mt-2.5", children: "B\u1EA5m n\xFAt n\xE0y sau khi chuy\u1EC3n kho\u1EA3n \u0111\u1EC3 h\u1EC7 th\u1ED1ng ki\u1EC3m tra ngay l\u1EADp t\u1EE9c." })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "px-5 py-3.5 border-b border-slate-200 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "Chi ti\u1EBFt \u0111\u01A1n h\xE0ng" }),
              /* @__PURE__ */ jsxDEV(StatusBadge, { status: order.status })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "p-5 space-y-3", children: items.map((it) => /* @__PURE__ */ jsxDEV("div", { class: "flex gap-3.5 items-center pb-3 border-b border-slate-100 last:border-0 last:pb-0", children: [
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  class: "w-16 aspect-video rounded-lg shrink-0 grid place-items-center text-white",
                  style: `background:${gradientFor(it.product_id)}`,
                  children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-code text-sm" })
                }
              ),
              /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900 text-sm line-clamp-2 leading-snug", children: it.product_name }),
                it.slug && /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${it.slug}`, class: "text-xs text-brand-600 hover:underline", children: "Xem s\u1EA3n ph\u1EA9m" })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "font-bold text-slate-900 text-sm shrink-0", children: formatVND(it.price) })
            ] })) })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("aside", { class: "space-y-4", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
            /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-4", children: "Th\xF4ng tin \u0111\u01A1n" }),
            /* @__PURE__ */ jsxDEV("div", { class: "space-y-2.5 text-sm", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "M\xE3 \u0111\u01A1n" }),
                /* @__PURE__ */ jsxDEV("b", { class: "text-brand-600", children: order.order_code })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "Ng\xE0y t\u1EA1o" }),
                /* @__PURE__ */ jsxDEV("b", { children: formatDateTime(order.created_at) })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "Thanh to\xE1n" }),
                /* @__PURE__ */ jsxDEV("b", { children: order.payment_method === "bank" ? "VietQR" : order.payment_method === "momo" ? "MoMo" : "S\u1ED1 d\u01B0 v\xED" })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "Tr\u1EA1ng th\xE1i" }),
                /* @__PURE__ */ jsxDEV(StatusBadge, { status: order.status })
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-sm", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "T\u1EA1m t\xEDnh" }),
                /* @__PURE__ */ jsxDEV("b", { children: formatVND(order.subtotal) })
              ] }),
              order.discount > 0 && /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: [
                  "Gi\u1EA3m gi\xE1 ",
                  order.coupon_code && `(${order.coupon_code})`
                ] }),
                /* @__PURE__ */ jsxDEV("b", { class: "text-emerald-600", children: [
                  "-",
                  formatVND(order.discount)
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between items-end pt-2.5 border-t border-slate-100", children: [
                /* @__PURE__ */ jsxDEV("span", { class: "font-bold text-slate-900", children: "T\u1ED5ng c\u1ED9ng" }),
                /* @__PURE__ */ jsxDEV("span", { class: "text-xl font-extrabold text-rose-600", children: formatVND(order.total) })
              ] })
            ] }),
            order.note && /* @__PURE__ */ jsxDEV("div", { class: "mt-4 pt-4 border-t border-slate-100", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 mb-1", children: "Ghi ch\xFA" }),
              /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-slate-700", children: order.note })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "bg-slate-900 rounded-2xl p-5 text-white", children: [
            /* @__PURE__ */ jsxDEV("h3", { class: "font-bold mb-1.5 text-sm", children: "C\u1EA7n h\u1ED7 tr\u1EE3?" }),
            /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-slate-400 mb-3.5", children: "Li\xEAn h\u1EC7 ngay n\u1EBFu b\u1EA1n g\u1EB7p v\u1EA5n \u0111\u1EC1 v\u1EDBi \u0111\u01A1n h\xE0ng." }),
            /* @__PURE__ */ jsxDEV(
              "a",
              {
                href: `https://zalo.me/${props.settings?.zalo}`,
                target: "_blank",
                rel: "noopener",
                class: "flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold text-sm transition",
                children: "Chat Zalo"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("script", { dangerouslySetInnerHTML: {
      __html: `
(function(){
  var CODE='${order.order_code}';
  var btn=document.getElementById('confirm-paid-btn');
  var box=document.getElementById('pay-status');
  var msg=document.getElementById('pay-status-msg');
  if(!btn||!box) return;

  var ticks=0, MAX=240; // 240 x 5s = 20 ph\xFAt
  var timer=null;

  function onPaid(){
    if(timer) clearInterval(timer);
    box.className='mb-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-3';
    box.innerHTML='<i class="fas fa-circle-check text-emerald-600 text-xl shrink-0"></i>'
      +'<div><div class="text-sm font-bold text-emerald-900">\u0110\xE3 nh\u1EADn \u0111\u01B0\u1EE3c ti\u1EC1n!</div>'
      +'<div class="text-xs text-emerald-700 mt-0.5">\u0110ang k\xEDch ho\u1EA1t s\u1EA3n ph\u1EA9m v\xE0 chuy\u1EC3n trang\u2026</div></div>';
    btn.disabled=true;
    if(window.toast) toast('Thanh to\xE1n th\xE0nh c\xF4ng! S\u1EA3n ph\u1EA9m \u0111\xE3 \u0111\u01B0\u1EE3c k\xEDch ho\u1EA1t.','success');
    setTimeout(function(){ location.reload(); },1200);
  }

  function stopWaiting(){
    if(timer) clearInterval(timer);
    box.className='mb-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3';
    box.innerHTML='<i class="fas fa-clock text-slate-400 text-xl shrink-0"></i>'
      +'<div><div class="text-sm font-bold text-slate-700">\u0110\xE3 t\u1EA1m d\u1EEBng ki\u1EC3m tra t\u1EF1 \u0111\u1ED9ng</div>'
      +'<div class="text-xs text-slate-500 mt-0.5">T\u1EA3i l\u1EA1i trang \u0111\u1EC3 ki\u1EC3m tra ti\u1EBFp, ho\u1EB7c li\xEAn h\u1EC7 Zalo n\u1EBFu b\u1EA1n \u0111\xE3 chuy\u1EC3n kho\u1EA3n.</div></div>';
  }

  async function check(silent){
    try{
      var r=await axios.get('/api/orders/'+CODE+'/status');
      if(r.data && r.data.status==='paid'){ onPaid(); return true; }
      if(r.data && (r.data.status==='cancelled'||r.data.status==='refunded')){ stopWaiting(); return true; }
    }catch(e){ /* b\u1ECF qua l\u1ED7i m\u1EA1ng t\u1EA1m th\u1EDDi */ }
    if(!silent && msg){
      msg.textContent='Ch\u01B0a th\u1EA5y giao d\u1ECBch. N\u1EBFu b\u1EA1n v\u1EEBa chuy\u1EC3n kho\u1EA3n, vui l\xF2ng \u0111\u1EE3i 10\u201360 gi\xE2y.';
    }
    return false;
  }

  // T\u1EF1 \u0111\u1ED9ng polling m\u1ED7i 5 gi\xE2y
  timer=setInterval(async function(){
    ticks++;
    if(ticks>MAX){ stopWaiting(); return; }
    await check(true);
  },5000);

  // B\u1EA5m n\xFAt -> ki\u1EC3m tra ngay
  btn.onclick=async function(){
    var old=btn.innerHTML;
    btn.disabled=true;
    btn.innerHTML='<span class="spinner"></span> \u0110ang ki\u1EC3m tra\u2026';
    try{
      var r=await axios.post('/api/orders/confirm',{order_code:CODE});
      if(r.data && r.data.status==='paid'){ onPaid(); return; }
      if(window.toast) toast(r.data.message||'\u0110ang ki\u1EC3m tra giao d\u1ECBch\u2026','info');
      var done=await check(false);
      if(!done){ btn.disabled=false; btn.innerHTML=old; }
    }catch(e){
      btn.disabled=false; btn.innerHTML=old;
      if(window.toast) toast((e.response&&e.response.data&&e.response.data.error)||'C\xF3 l\u1ED7i x\u1EA3y ra','error');
    }
  };

  // Ki\u1EC3m tra ngay khi t\u1EA3i trang
  check(true);
})();`
    } })
  ] });
};

// src/pages/account.tsx
var MENU = [
  { href: "/tai-khoan", icon: "fa-gauge", label: "T\u1ED5ng quan", key: "dash" },
  { href: "/tai-khoan/san-pham", icon: "fa-box-archive", label: "S\u1EA3n ph\u1EA9m c\u1EE7a t\xF4i", key: "products" },
  { href: "/tai-khoan/don-hang", icon: "fa-receipt", label: "\u0110\u01A1n h\xE0ng", key: "orders" },
  { href: "/tai-khoan/yeu-thich", icon: "fa-heart", label: "Y\xEAu th\xEDch", key: "wishlist" },
  { href: "/tai-khoan/affiliate", icon: "fa-handshake", label: "Affiliate", key: "affiliate" },
  { href: "/tai-khoan/ho-so", icon: "fa-user-gear", label: "H\u1ED3 s\u01A1", key: "profile" }
];
var AccountShell = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 py-8", children: /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[240px_1fr] gap-6", children: [
  /* @__PURE__ */ jsxDEV("aside", { class: "lg:sticky-side", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-4 mb-4", children: /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white grid place-items-center font-bold text-lg shrink-0", children: props.user?.full_name.charAt(0).toUpperCase() }),
      /* @__PURE__ */ jsxDEV("div", { class: "min-w-0", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "font-bold text-slate-900 truncate text-sm", children: props.user?.full_name }),
        /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 truncate", children: props.user?.email })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxDEV("nav", { class: "bg-white rounded-2xl border border-slate-200 p-2 space-y-0.5", children: [
      MENU.map((m) => /* @__PURE__ */ jsxDEV("a", { href: m.href, class: `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${props.activeKey === m.key ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" : "text-slate-600 hover:bg-slate-50"}`, children: [
        /* @__PURE__ */ jsxDEV("i", { class: `fas ${m.icon} w-4` }),
        m.label
      ] })),
      props.user?.role === "admin" && /* @__PURE__ */ jsxDEV("a", { href: "/admin", class: "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-50 transition", children: [
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-shield-halved w-4" }),
        "Trang qu\u1EA3n tr\u1ECB"
      ] }),
      /* @__PURE__ */ jsxDEV("a", { href: "/dang-xuat", class: "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition", children: [
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-right-from-bracket w-4" }),
        "\u0110\u0103ng xu\u1EA5t"
      ] })
    ] })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { children: [
    /* @__PURE__ */ jsxDEV("div", { class: "mb-6", children: [
      /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl font-extrabold text-slate-900 tracking-tight", children: props.heading }),
      props.sub && /* @__PURE__ */ jsxDEV("p", { class: "text-slate-500 text-sm mt-1", children: props.sub })
    ] }),
    props.children
  ] })
] }) }) });
var AccountDashboard = (props) => {
  const { stats, recentOrders, recentProducts } = props;
  return /* @__PURE__ */ jsxDEV(AccountShell, { ...props, activeKey: "dash", title: "T\xE0i kho\u1EA3n", heading: `Xin ch\xE0o, ${props.user?.full_name}! \u{1F44B}`, sub: "\u0110\xE2y l\xE0 t\u1ED5ng quan ho\u1EA1t \u0111\u1ED9ng t\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n.", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6", children: [
      ["fa-box-archive", "S\u1EA3n ph\u1EA9m s\u1EDF h\u1EEFu", String(stats.products), "from-brand-500 to-brand-600"],
      ["fa-receipt", "T\u1ED5ng \u0111\u01A1n h\xE0ng", String(stats.orders), "from-fuchsia-500 to-purple-600"],
      ["fa-wallet", "\u0110\xE3 chi ti\xEAu", formatVND(stats.spent), "from-emerald-500 to-teal-600"],
      ["fa-piggy-bank", "S\u1ED1 d\u01B0 v\xED", formatVND(stats.balance), "from-amber-500 to-orange-600"]
    ].map(([ic, lb, val, grad]) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: `w-11 h-11 rounded-xl bg-gradient-to-br ${grad} text-white grid place-items-center mb-3.5 shadow-lg`, children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${ic}` }) }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-2xl font-extrabold text-slate-900 leading-none mb-1", children: val }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: lb })
    ] })) }),
    /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-2 gap-5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "px-5 py-4 border-b border-slate-200 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "\u0110\u01A1n h\xE0ng g\u1EA7n \u0111\xE2y" }),
          /* @__PURE__ */ jsxDEV("a", { href: "/tai-khoan/don-hang", class: "text-xs font-semibold text-brand-600 hover:underline", children: "Xem t\u1EA5t c\u1EA3" })
        ] }),
        recentOrders.length === 0 ? /* @__PURE__ */ jsxDEV("div", { class: "p-8 text-center text-sm text-slate-500", children: "Ch\u01B0a c\xF3 \u0111\u01A1n h\xE0ng n\xE0o" }) : /* @__PURE__ */ jsxDEV("div", { class: "divide-y divide-slate-100", children: recentOrders.map((o) => /* @__PURE__ */ jsxDEV("a", { href: `/don-hang/${o.order_code}`, class: "flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "w-9 h-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center text-sm shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-receipt" }) }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900 text-sm", children: o.order_code }),
            /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: formatDate(o.created_at) })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "text-right shrink-0", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "font-bold text-slate-900 text-sm", children: formatVND(o.total) }),
            /* @__PURE__ */ jsxDEV(StatusBadge, { status: o.status })
          ] })
        ] })) })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "px-5 py-4 border-b border-slate-200 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "S\u1EA3n ph\u1EA9m m\u1EDBi nh\u1EADn" }),
          /* @__PURE__ */ jsxDEV("a", { href: "/tai-khoan/san-pham", class: "text-xs font-semibold text-brand-600 hover:underline", children: "Xem t\u1EA5t c\u1EA3" })
        ] }),
        recentProducts.length === 0 ? /* @__PURE__ */ jsxDEV("div", { class: "p-8 text-center", children: [
          /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-slate-500 mb-3", children: "B\u1EA1n ch\u01B0a s\u1EDF h\u1EEFu s\u1EA3n ph\u1EA9m n\xE0o" }),
          /* @__PURE__ */ jsxDEV("a", { href: "/san-pham", class: "inline-flex h-9 px-4 items-center rounded-lg bg-brand-600 text-white text-sm font-semibold", children: "Kh\xE1m ph\xE1 ngay" })
        ] }) : /* @__PURE__ */ jsxDEV("div", { class: "divide-y divide-slate-100", children: recentProducts.map((p) => /* @__PURE__ */ jsxDEV("a", { href: "/tai-khoan/san-pham", class: "flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "w-14 aspect-video rounded-lg shrink-0 grid place-items-center text-white text-xs", style: `background:${gradientFor(p.product_id)}`, children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-code" }) }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900 text-sm line-clamp-1", children: p.name }),
            /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: formatDate(p.created_at) })
          ] }),
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-chevron-right text-slate-300 text-xs" })
        ] })) })
      ] })
    ] })
  ] });
};
var MyProductsPage = (props) => /* @__PURE__ */ jsxDEV(
  AccountShell,
  {
    ...props,
    activeKey: "products",
    title: "S\u1EA3n ph\u1EA9m c\u1EE7a t\xF4i",
    heading: "S\u1EA3n ph\u1EA9m c\u1EE7a t\xF4i",
    sub: "Truy c\u1EADp link t\u1EA3i s\u1EA3n ph\u1EA9m, t\xE0i li\u1EC7u v\xE0 license key c\u1EE7a c\xE1c s\u1EA3n ph\u1EA9m b\u1EA1n \u0111\xE3 mua.",
    children: props.licenses.length === 0 ? /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200", children: /* @__PURE__ */ jsxDEV(
      EmptyState,
      {
        icon: "fa-box-archive",
        title: "B\u1EA1n ch\u01B0a s\u1EDF h\u1EEFu s\u1EA3n ph\u1EA9m n\xE0o",
        desc: "Sau khi thanh to\xE1n th\xE0nh c\xF4ng, link t\u1EA3i s\u1EA3n ph\u1EA9m s\u1EBD xu\u1EA5t hi\u1EC7n t\u1EA1i \u0111\xE2y.",
        action: { href: "/san-pham", label: "Kh\xE1m ph\xE1 s\u1EA3n ph\u1EA9m" }
      }
    ) }) : /* @__PURE__ */ jsxDEV("div", { class: "space-y-4", children: props.licenses.map((l) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { class: "p-5 flex flex-col sm:flex-row gap-4", children: [
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          class: "sm:w-40 aspect-video rounded-xl shrink-0 grid place-items-center text-white",
          style: l.thumbnail ? "" : `background:${gradientFor(l.product_id)}`,
          children: l.thumbnail ? /* @__PURE__ */ jsxDEV("img", { src: l.thumbnail, alt: "", class: "w-full h-full object-cover rounded-xl" }) : /* @__PURE__ */ jsxDEV("i", { class: `fas ${l.product_type === "chatbot" ? "fa-robot" : l.product_type === "prompt" ? "fa-wand-magic-sparkles" : "fa-code"} text-2xl` })
        }
      ),
      /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-center gap-2 mb-1.5", children: [
          /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[11px] font-bold", children: PRODUCT_TYPE_LABEL[l.product_type] }),
          /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[11px] font-bold", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-check mr-0.5" }),
            "\u0110\xE3 k\xEDch ho\u1EA1t"
          ] }),
          /* @__PURE__ */ jsxDEV("span", { class: "text-[11px] text-slate-400", children: l.version })
        ] }),
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 leading-snug mb-2", children: /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${l.slug}`, class: "hover:text-brand-600", children: l.name }) }),
        /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 mb-3 flex flex-wrap gap-x-4 gap-y-1", children: [
          /* @__PURE__ */ jsxDEV("span", { children: [
            /* @__PURE__ */ jsxDEV("i", { class: "far fa-calendar mr-1" }),
            "Mua ng\xE0y ",
            formatDate(l.created_at)
          ] }),
          /* @__PURE__ */ jsxDEV("span", { children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-download mr-1" }),
            l.download_count,
            " l\u01B0\u1EE3t t\u1EA3i"
          ] }),
          l.file_size && l.file_size !== "\u2014" && /* @__PURE__ */ jsxDEV("span", { children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-hard-drive mr-1" }),
            l.file_size
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "p-3 rounded-xl bg-slate-50 border border-slate-200 mb-3", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "text-[11px] text-slate-500 mb-1 font-semibold uppercase tracking-wide", children: "License Key" }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV("code", { class: "flex-1 font-mono text-sm text-brand-700 font-bold tracking-wider truncate", children: l.license_key }),
            /* @__PURE__ */ jsxDEV("button", { "data-copy": l.license_key, class: "shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-brand-400 hover:text-brand-600 text-slate-500 text-xs transition", children: /* @__PURE__ */ jsxDEV("i", { class: "far fa-copy" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap gap-2", children: [
          l.download_url ? /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: `/tai-xuong/${l.id}`,
              target: "_blank",
              rel: "noopener",
              class: "inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white font-semibold text-sm hover:opacity-90 shadow-lg shadow-brand-500/20 transition",
              children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-download" }),
                l.product_type === "chatbot" ? "M\u1EDF Chatbot" : l.product_type === "prompt" ? "M\u1EDF b\u1ED9 Prompt" : "T\u1EA3i Source Code"
              ]
            }
          ) : /* @__PURE__ */ jsxDEV("span", { class: "inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-amber-50 text-amber-700 font-semibold text-sm", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-clock" }),
            "\u0110ang chu\u1EA9n b\u1ECB link..."
          ] }),
          l.doc_url && /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: l.doc_url,
              target: "_blank",
              rel: "noopener",
              class: "inline-flex items-center gap-2 h-10 px-4 rounded-xl border-2 border-slate-200 hover:border-brand-400 hover:text-brand-600 font-semibold text-sm transition",
              children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-book" }),
                "T\xE0i li\u1EC7u"
              ]
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: `/san-pham/${l.slug}#reviews`,
              class: "inline-flex items-center gap-2 h-10 px-4 rounded-xl border-2 border-slate-200 hover:border-amber-400 hover:text-amber-600 font-semibold text-sm transition",
              children: [
                /* @__PURE__ */ jsxDEV("i", { class: "far fa-star" }),
                "\u0110\xE1nh gi\xE1"
              ]
            }
          )
        ] })
      ] })
    ] }) })) })
  }
);
var MyOrdersPage = (props) => /* @__PURE__ */ jsxDEV(AccountShell, { ...props, activeKey: "orders", title: "\u0110\u01A1n h\xE0ng", heading: "L\u1ECBch s\u1EED \u0111\u01A1n h\xE0ng", sub: "Theo d\xF5i tr\u1EA1ng th\xE1i v\xE0 chi ti\u1EBFt c\xE1c \u0111\u01A1n h\xE0ng c\u1EE7a b\u1EA1n.", children: props.orders.length === 0 ? /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200", children: /* @__PURE__ */ jsxDEV(EmptyState, { icon: "fa-receipt", title: "Ch\u01B0a c\xF3 \u0111\u01A1n h\xE0ng n\xE0o", action: { href: "/san-pham", label: "Mua s\u1EAFm ngay" } }) }) : /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
  /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
    /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "M\xE3 \u0111\u01A1n" }),
    /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Ng\xE0y" }),
    /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "S\u1EA3n ph\u1EA9m" }),
    /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "T\u1ED5ng ti\u1EC1n" }),
    /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "Tr\u1EA1ng th\xE1i" }),
    /* @__PURE__ */ jsxDEV("th", {})
  ] }) }),
  /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: props.orders.map((o) => /* @__PURE__ */ jsxDEV("tr", { children: [
    /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("b", { class: "text-brand-600", children: o.order_code }) }),
    /* @__PURE__ */ jsxDEV("td", { class: "text-slate-500 whitespace-nowrap", children: formatDate(o.created_at) }),
    /* @__PURE__ */ jsxDEV("td", { class: "text-slate-600 max-w-[240px]", children: /* @__PURE__ */ jsxDEV("div", { class: "line-clamp-1", children: o.product_names || "\u2014" }) }),
    /* @__PURE__ */ jsxDEV("td", { class: "text-right font-bold text-slate-900 whitespace-nowrap", children: formatVND(o.total) }),
    /* @__PURE__ */ jsxDEV("td", { class: "text-center", children: /* @__PURE__ */ jsxDEV(StatusBadge, { status: o.status }) }),
    /* @__PURE__ */ jsxDEV("td", { class: "text-right", children: /* @__PURE__ */ jsxDEV("a", { href: `/don-hang/${o.order_code}`, class: "inline-flex h-8 px-3 items-center rounded-lg bg-slate-100 hover:bg-brand-100 hover:text-brand-700 text-xs font-semibold transition", children: "Chi ti\u1EBFt" }) })
  ] })) })
] }) }) }) });
var WishlistPage = (props) => /* @__PURE__ */ jsxDEV(AccountShell, { ...props, activeKey: "wishlist", title: "Y\xEAu th\xEDch", heading: "S\u1EA3n ph\u1EA9m y\xEAu th\xEDch", sub: "Danh s\xE1ch s\u1EA3n ph\u1EA9m b\u1EA1n \u0111\xE3 l\u01B0u \u0111\u1EC3 mua sau.", children: props.items.length === 0 ? /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200", children: /* @__PURE__ */ jsxDEV(EmptyState, { icon: "fa-heart", title: "Ch\u01B0a c\xF3 s\u1EA3n ph\u1EA9m y\xEAu th\xEDch", action: { href: "/san-pham", label: "Kh\xE1m ph\xE1 s\u1EA3n ph\u1EA9m" } }) }) : /* @__PURE__ */ jsxDEV("div", { class: "space-y-3", children: props.items.map((p) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-4 flex gap-4", children: [
  /* @__PURE__ */ jsxDEV(
    "a",
    {
      href: `/san-pham/${p.slug}`,
      class: "w-28 aspect-video rounded-xl shrink-0 grid place-items-center text-white",
      style: `background:${gradientFor(p.id)}`,
      children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-code" })
    }
  ),
  /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
    /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 line-clamp-2 leading-snug mb-1.5", children: /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${p.slug}`, class: "hover:text-brand-600", children: p.name }) }),
    /* @__PURE__ */ jsxDEV("div", { class: "text-lg font-extrabold text-rose-600 mb-2", children: formatVND(p.price) }),
    /* @__PURE__ */ jsxDEV("div", { class: "flex gap-2", children: [
      /* @__PURE__ */ jsxDEV("button", { class: "btn-add-cart h-9 px-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition", "data-id": p.id, "data-name": p.name, children: [
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-cart-plus mr-1" }),
        "Th\xEAm gi\u1ECF"
      ] }),
      /* @__PURE__ */ jsxDEV("button", { class: "btn-wishlist h-9 px-3.5 rounded-lg border border-slate-200 text-rose-500 text-xs font-semibold hover:bg-rose-50 transition", "data-id": p.id, children: [
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-heart mr-1" }),
        "B\u1ECF th\xEDch"
      ] })
    ] })
  ] })
] })) }) });
var AffiliateDashboard = (props) => {
  const link2 = `${props.siteUrl}/dang-ky?ref=${props.affCode}`;
  return /* @__PURE__ */ jsxDEV(AccountShell, { ...props, activeKey: "affiliate", title: "Affiliate", heading: "Ch\u01B0\u01A1ng tr\xECnh Affiliate", sub: `Gi\u1EDBi thi\u1EC7u b\u1EA1n b\xE8 v\xE0 nh\u1EADn hoa h\u1ED3ng ${props.percent}% cho m\u1ED7i \u0111\u01A1n h\xE0ng th\xE0nh c\xF4ng.`, children: [
    /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-3 gap-4 mb-6", children: [
      ["fa-percent", "Hoa h\u1ED3ng", props.percent + "%", "from-brand-500 to-brand-600"],
      ["fa-users", "Ng\u01B0\u1EDDi gi\u1EDBi thi\u1EC7u", String(props.refCount), "from-fuchsia-500 to-purple-600"],
      ["fa-coins", "T\u1ED5ng hoa h\u1ED3ng", formatVND(props.earned), "from-emerald-500 to-teal-600"]
    ].map(([ic, lb, val, grad]) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: `w-11 h-11 rounded-xl bg-gradient-to-br ${grad} text-white grid place-items-center mb-3.5 shadow-lg`, children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${ic}` }) }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-2xl font-extrabold text-slate-900 leading-none mb-1", children: val }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: lb })
    ] })) }),
    /* @__PURE__ */ jsxDEV("div", { class: "bg-gradient-to-br from-brand-600 to-fuchsia-600 rounded-2xl p-6 text-white mb-6", children: [
      /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-lg mb-1.5", children: "Link gi\u1EDBi thi\u1EC7u c\u1EE7a b\u1EA1n" }),
      /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-white/80 mb-4", children: [
        "Chia s\u1EBB link n\xE0y, m\u1ED7i khi c\xF3 ng\u01B0\u1EDDi \u0111\u0103ng k\xFD v\xE0 mua h\xE0ng b\u1EA1n nh\u1EADn ",
        props.percent,
        "% hoa h\u1ED3ng."
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "flex flex-col sm:flex-row gap-2", children: [
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            value: link2,
            readonly: true,
            id: "aff-link",
            class: "flex-1 h-11 px-4 rounded-xl bg-white/15 border border-white/25 text-white text-sm outline-none backdrop-blur"
          }
        ),
        /* @__PURE__ */ jsxDEV("button", { "data-copy": link2, class: "h-11 px-5 rounded-xl bg-white text-brand-700 font-bold text-sm hover:bg-slate-100 transition whitespace-nowrap", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "far fa-copy mr-1.5" }),
          "Sao ch\xE9p link"
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-3 text-sm", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "text-white/80", children: "M\xE3 c\u1EE7a b\u1EA1n:" }),
        /* @__PURE__ */ jsxDEV("code", { class: "px-3 py-1 rounded-lg bg-white/20 font-mono font-bold tracking-widest", children: props.affCode }),
        /* @__PURE__ */ jsxDEV("button", { "data-copy": props.affCode, class: "text-white/80 hover:text-white text-xs", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "far fa-copy" }),
          " Copy m\xE3"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "px-5 py-4 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "Danh s\xE1ch ng\u01B0\u1EDDi b\u1EA1n gi\u1EDBi thi\u1EC7u" }) }),
      props.referrals.length === 0 ? /* @__PURE__ */ jsxDEV("div", { class: "p-10 text-center text-sm text-slate-500", children: "Ch\u01B0a c\xF3 ai \u0111\u0103ng k\xFD qua link c\u1EE7a b\u1EA1n. H\xE3y b\u1EAFt \u0111\u1EA7u chia s\u1EBB!" }) : /* @__PURE__ */ jsxDEV("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
        /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Th\xE0nh vi\xEAn" }),
          /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Ng\xE0y tham gia" }),
          /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "\u0110\xE3 mua" }),
          /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "Hoa h\u1ED3ng" })
        ] }) }),
        /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: props.referrals.map((r) => /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("td", { children: [
            /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900", children: r.full_name }),
            /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: r.email.replace(/(.{2}).*(@.*)/, "$1***$2") })
          ] }),
          /* @__PURE__ */ jsxDEV("td", { class: "text-slate-500", children: formatDate(r.created_at) }),
          /* @__PURE__ */ jsxDEV("td", { class: "text-right font-semibold", children: formatVND(r.spent || 0) }),
          /* @__PURE__ */ jsxDEV("td", { class: "text-right font-bold text-emerald-600", children: formatVND(Math.round((r.spent || 0) * props.percent / 100)) })
        ] })) })
      ] }) })
    ] })
  ] });
};
var ProfilePage = (props) => /* @__PURE__ */ jsxDEV(AccountShell, { ...props, activeKey: "profile", title: "H\u1ED3 s\u01A1", heading: "H\u1ED3 s\u01A1 c\xE1 nh\xE2n", sub: "C\u1EADp nh\u1EADt th\xF4ng tin v\xE0 m\u1EADt kh\u1EA9u t\xE0i kho\u1EA3n.", children: /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-2 gap-5", children: [
  /* @__PURE__ */ jsxDEV("form", { action: "/api/account/profile", method: "post", "data-ajax": true, class: "bg-white rounded-2xl border border-slate-200 p-6", children: [
    /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-5", children: [
      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-user mr-2 text-brand-500" }),
      "Th\xF4ng tin c\xE1 nh\xE2n"
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "space-y-4", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "H\u1ECD v\xE0 t\xEAn" }),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            name: "full_name",
            value: props.profile.full_name,
            required: true,
            class: "w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "Email" }),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "email",
            value: props.profile.email,
            disabled: true,
            class: "w-full h-11 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-500"
          }
        ),
        /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-slate-400 mt-1", children: "Email kh\xF4ng th\u1EC3 thay \u0111\u1ED5i" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i" }),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "tel",
            name: "phone",
            value: props.profile.phone || "",
            class: "w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700" }),
      /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition", children: "L\u01B0u thay \u0111\u1ED5i" })
    ] })
  ] }),
  /* @__PURE__ */ jsxDEV("form", { action: "/api/account/password", method: "post", "data-ajax": true, class: "bg-white rounded-2xl border border-slate-200 p-6 self-start", children: [
    /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-5", children: [
      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-key mr-2 text-brand-500" }),
      "\u0110\u1ED5i m\u1EADt kh\u1EA9u"
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "space-y-4", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "M\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i" }),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "password",
            name: "current_password",
            required: true,
            autocomplete: "current-password",
            class: "w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "M\u1EADt kh\u1EA9u m\u1EDBi" }),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "password",
            name: "new_password",
            required: true,
            minlength: 6,
            autocomplete: "new-password",
            class: "w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700" }),
      /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition", children: "\u0110\u1ED5i m\u1EADt kh\u1EA9u" })
    ] })
  ] })
] }) });

// src/pages/static.tsx
var BlogListPage = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, active: "blog", title: "Blog", description: "Ki\u1EBFn th\u1EE9c, h\u01B0\u1EDBng d\u1EABn v\xE0 case study v\u1EC1 l\xE0m video AI", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "bg-white border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxDEV(Breadcrumb, { items: [{ label: "Blog" }] }),
    /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight", children: "Ki\u1EBFn th\u1EE9c l\xE0m video AI" }),
    /* @__PURE__ */ jsxDEV("p", { class: "text-slate-500 mt-2 max-w-2xl", children: "H\u01B0\u1EDBng d\u1EABn chi ti\u1EBFt, m\u1EB9o hay v\xE0 case study th\u1EF1c t\u1EBF t\u1EEB c\u1ED9ng \u0111\u1ED3ng l\xE0m video AI." }),
    /* @__PURE__ */ jsxDEV("form", { action: "/blog", method: "get", class: "mt-5 max-w-md", children: /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "text",
          name: "q",
          value: props.q,
          placeholder: "T\xECm b\xE0i vi\u1EBFt...",
          class: "w-full h-11 pl-10 pr-3 rounded-xl bg-slate-100 focus:bg-white border border-transparent focus:border-brand-400 outline-none text-sm transition"
        }
      ),
      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" })
    ] }) })
  ] }) }),
  /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 py-8", children: props.posts.length === 0 ? /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200", children: /* @__PURE__ */ jsxDEV(EmptyState, { icon: "fa-newspaper", title: "Kh\xF4ng t\xECm th\u1EA5y b\xE0i vi\u1EBFt", action: { href: "/blog", label: "Xem t\u1EA5t c\u1EA3" } }) }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 lg:grid-cols-3 gap-5", children: props.posts.map((p) => /* @__PURE__ */ jsxDEV(PostCard, { p })) }),
    /* @__PURE__ */ jsxDEV(Pagination, { page: props.page, totalPages: props.totalPages, baseUrl: "/blog" + (props.q ? "?q=" + encodeURIComponent(props.q) : "") })
  ] }) })
] });
var BlogDetailPage = (props) => {
  const { post } = props;
  return /* @__PURE__ */ jsxDEV(Layout, { ...props, active: "blog", title: post.title, description: post.excerpt, children: /* @__PURE__ */ jsxDEV("article", { class: "max-w-4xl mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxDEV(Breadcrumb, { items: [{ label: "Blog", href: "/blog" }, { label: post.title }] }),
    /* @__PURE__ */ jsxDEV("h1", { class: "text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4", children: post.title }),
    /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-center gap-4 text-sm text-slate-500 pb-6 mb-7 border-b border-slate-200", children: [
      /* @__PURE__ */ jsxDEV("span", { children: [
        /* @__PURE__ */ jsxDEV("i", { class: "far fa-calendar mr-1.5" }),
        formatDate(post.created_at)
      ] }),
      /* @__PURE__ */ jsxDEV("span", { children: [
        /* @__PURE__ */ jsxDEV("i", { class: "far fa-eye mr-1.5" }),
        post.view_count,
        " l\u01B0\u1EE3t xem"
      ] }),
      post.tags && /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap gap-1.5", children: post.tags.split(",").map((t) => /* @__PURE__ */ jsxDEV("span", { class: "px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold", children: [
        "#",
        t.trim()
      ] })) })
    ] }),
    post.excerpt && /* @__PURE__ */ jsxDEV("p", { class: "text-lg text-slate-600 leading-relaxed mb-7 font-medium", children: post.excerpt }),
    /* @__PURE__ */ jsxDEV("div", { class: "prose-vn max-w-none", dangerouslySetInnerHTML: { __html: post.content || "" } }),
    /* @__PURE__ */ jsxDEV("div", { class: "mt-10 p-6 rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white text-center", children: [
      /* @__PURE__ */ jsxDEV("h3", { class: "text-xl font-extrabold mb-2", children: "B\u1EAFt \u0111\u1EA7u l\xE0m video AI ngay h\xF4m nay" }),
      /* @__PURE__ */ jsxDEV("p", { class: "text-white/85 text-sm mb-5", children: "Kh\xE1m ph\xE1 kho kh\xF3a h\u1ECDc, skill, chatbot v\xE0 app l\xE0m video AI \u0111\xE3 \u0111\u01B0\u1EE3c h\xE0ng ngh\xECn creator tin d\xF9ng." }),
      /* @__PURE__ */ jsxDEV("a", { href: "/san-pham", class: "inline-flex h-11 px-6 items-center gap-2 rounded-xl bg-white text-brand-700 font-bold text-sm hover:bg-slate-100 transition", children: [
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-cubes" }),
        "Xem s\u1EA3n ph\u1EA9m"
      ] })
    ] }),
    props.related.length > 0 && /* @__PURE__ */ jsxDEV("section", { class: "mt-12", children: [
      /* @__PURE__ */ jsxDEV(SectionTitle, { title: "B\xE0i vi\u1EBFt li\xEAn quan" }),
      /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-3 gap-5", children: props.related.map((p) => /* @__PURE__ */ jsxDEV(PostCard, { p })) })
    ] })
  ] }) });
};
var PLANS = [
  {
    name: "Starter",
    price: 299e3,
    tag: "Ng\u01B0\u1EDDi m\u1EDBi b\u1EAFt \u0111\u1EA7u",
    icon: "fa-seedling",
    highlight: false,
    desc: "Ch\u1ECDn 1 skill ho\u1EB7c chatbot \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u l\xE0m video AI ngay h\xF4m nay.",
    features: ["1 skill theo ng\xE1ch ho\u1EB7c 1 chatbot", "Video demo xem tr\u01B0\u1EDBc khi mua", "Truy c\u1EADp tr\u1ECDn \u0111\u1EDDi", "C\u1EADp nh\u1EADt mi\u1EC5n ph\xED", "H\u1ED7 tr\u1EE3 qua Zalo"],
    cta: "Xem skill",
    href: "/danh-muc/skill-video-ai"
  },
  {
    name: "Creator",
    price: 899e3,
    tag: "Ph\u1ED5 bi\u1EBFn nh\u1EA5t",
    icon: "fa-rocket",
    highlight: true,
    desc: "1 kh\xF3a h\u1ECDc video AI + 1 skill theo ng\xE1ch: h\u1ECDc xong l\xE0m \u0111\u01B0\u1EE3c ngay.",
    features: ["1 kh\xF3a h\u1ECDc (Muse AI / Seedance / Flow Veo)", "1 skill theo ng\xE1ch t\u1EF1 ch\u1ECDn", "Video demo th\u1EF1c t\u1EBF t\u1EEBng s\u1EA3n ph\u1EA9m", "H\u1ED7 tr\u1EE3 \u01B0u ti\xEAn 1-1 qua Zalo", "Truy c\u1EADp tr\u1ECDn \u0111\u1EDDi", "C\u1EADp nh\u1EADt mi\u1EC5n ph\xED"],
    cta: "Xem kh\xF3a h\u1ECDc",
    href: "/danh-muc/khoa-hoc-video-ai"
  },
  {
    name: "All-In-One",
    price: 1999e3,
    tag: "Ti\u1EBFt ki\u1EC7m 55%",
    icon: "fa-crown",
    highlight: false,
    desc: "Tr\u1ECDn b\u1ED9 WebSkill AI: 3 kh\xF3a h\u1ECDc + 3 skill + chatbot + app render.",
    features: ["3 kh\xF3a h\u1ECDc video AI", "3 skill theo ng\xE1ch", "Chatbot vi\u1EBFt k\u1ECBch b\u1EA3n + app render", "T\u1EB7ng s\u1EA3n ph\u1EA9m m\u1EDBi trong 12 th\xE1ng", "H\u1ED7 tr\u1EE3 \u01B0u ti\xEAn 1-1", "Truy c\u1EADp tr\u1ECDn \u0111\u1EDDi"],
    cta: "Mua combo",
    href: "/san-pham/combo-video-ai-all-in-one"
  }
];
var PricingPage = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, active: "pricing", title: "B\u1EA3ng gi\xE1", description: "B\u1EA3ng gi\xE1 c\xE1c g\xF3i kh\xF3a h\u1ECDc, skill, chatbot v\xE0 app l\xE0m video AI", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "bg-slate-950 text-white relative overflow-hidden", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "absolute inset-0 hero-mesh" }),
    /* @__PURE__ */ jsxDEV("div", { class: "relative max-w-7xl mx-auto px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsxDEV("h1", { class: "text-3xl md:text-4xl font-extrabold tracking-tight mb-3", children: "B\u1EA3ng gi\xE1 minh b\u1EA1ch" }),
      /* @__PURE__ */ jsxDEV("p", { class: "text-slate-300 max-w-2xl mx-auto", children: "Mua m\u1ED9t l\u1EA7n, s\u1EDF h\u1EEFu tr\u1ECDn \u0111\u1EDDi. Kh\xF4ng ph\xED duy tr\xEC, kh\xF4ng ph\xED \u1EA9n, kh\xF4ng gi\u1EDBi h\u1EA1n th\u1EDDi gian s\u1EED d\u1EE5ng." })
    ] })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "max-w-7xl mx-auto px-4 -mt-8 pb-14 relative", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-3 gap-5", children: PLANS.map((pl) => /* @__PURE__ */ jsxDEV("div", { class: `rounded-2xl p-7 relative ${pl.highlight ? "bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white shadow-2xl shadow-brand-500/30 lg:-mt-4 lg:mb-4" : "bg-white border border-slate-200"}`, children: [
      pl.highlight && /* @__PURE__ */ jsxDEV("div", { class: "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-extrabold whitespace-nowrap", children: [
        "\u2B50 ",
        pl.tag
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: `w-12 h-12 rounded-xl grid place-items-center text-lg mb-4 ${pl.highlight ? "bg-white/20" : "bg-brand-50 text-brand-600"}`, children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${pl.icon}` }) }),
      /* @__PURE__ */ jsxDEV("h3", { class: `text-xl font-extrabold mb-1 ${pl.highlight ? "" : "text-slate-900"}`, children: pl.name }),
      !pl.highlight && /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 mb-3", children: pl.tag }),
      /* @__PURE__ */ jsxDEV("p", { class: `text-sm mb-5 leading-relaxed ${pl.highlight ? "text-white/85" : "text-slate-500"}`, children: pl.desc }),
      /* @__PURE__ */ jsxDEV("div", { class: "mb-6", children: [
        /* @__PURE__ */ jsxDEV("span", { class: `text-3xl font-extrabold ${pl.highlight ? "" : "text-slate-900"}`, children: formatVND(pl.price) }),
        /* @__PURE__ */ jsxDEV("span", { class: `text-sm ml-1.5 ${pl.highlight ? "text-white/70" : "text-slate-400"}`, children: "/ tr\u1ECDn \u0111\u1EDDi" })
      ] }),
      /* @__PURE__ */ jsxDEV("ul", { class: "space-y-2.5 mb-7", children: pl.features.map((f) => /* @__PURE__ */ jsxDEV("li", { class: `flex gap-2.5 text-sm ${pl.highlight ? "text-white/90" : "text-slate-600"}`, children: [
        /* @__PURE__ */ jsxDEV("i", { class: `fas fa-circle-check mt-0.5 shrink-0 ${pl.highlight ? "text-emerald-300" : "text-emerald-500"}` }),
        f
      ] })) }),
      /* @__PURE__ */ jsxDEV(
        "a",
        {
          href: pl.href,
          class: `flex items-center justify-center gap-2 w-full h-12 rounded-xl font-bold text-sm transition ${pl.highlight ? "bg-white text-brand-700 hover:bg-slate-100" : "bg-brand-600 hover:bg-brand-700 text-white"}`,
          children: [
            pl.cta,
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-right text-xs" })
          ]
        }
      )
    ] })) }),
    /* @__PURE__ */ jsxDEV("div", { class: "mt-12 bg-white rounded-2xl border border-slate-200 p-6 md:p-8", children: [
      /* @__PURE__ */ jsxDEV("h2", { class: "text-xl font-extrabold text-slate-900 mb-6 text-center", children: "So s\xE1nh chi ti\u1EBFt c\xE1c g\xF3i" }),
      /* @__PURE__ */ jsxDEV("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full text-sm min-w-[600px]", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { class: "border-b-2 border-slate-200", children: [
          /* @__PURE__ */ jsxDEV("th", { class: "text-left py-3 font-bold text-slate-700", children: "T\xEDnh n\u0103ng" }),
          PLANS.map((p) => /* @__PURE__ */ jsxDEV("th", { class: "py-3 px-3 font-bold text-slate-900 text-center", children: p.name }))
        ] }) }),
        /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: [
          ["S\u1ED1 s\u1EA3n ph\u1EA9m", "1", "2", "8"],
          ["S\u1EDF h\u1EEFu tr\u1ECDn \u0111\u1EDDi", true, true, true],
          ["C\u1EADp nh\u1EADt mi\u1EC5n ph\xED", true, true, true],
          ["H\u1ED7 tr\u1EE3 Zalo", true, true, true],
          ["H\u1ED7 tr\u1EE3 \u01B0u ti\xEAn 1-1", false, true, true],
          ["Video demo xem tr\u01B0\u1EDBc", true, true, true],
          ["Kh\xF3a h\u1ECDc video AI", false, true, true],
          ["Skill theo ng\xE1ch", true, true, true],
          ["Chatbot + App render", false, false, true]
        ].map(([label, ...vals]) => /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("td", { class: "py-3 text-slate-600 font-medium", children: label }),
          vals.map((v) => /* @__PURE__ */ jsxDEV("td", { class: "py-3 px-3 text-center", children: typeof v === "boolean" ? v ? /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-check text-emerald-500" }) : /* @__PURE__ */ jsxDEV("i", { class: "fas fa-minus text-slate-300" }) : /* @__PURE__ */ jsxDEV("span", { class: "font-semibold text-slate-800", children: v }) }))
        ] })) })
      ] }) })
    ] })
  ] })
] });
var AboutPage = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, title: "Gi\u1EDBi thi\u1EC7u", description: "V\u1EC1 WebSkill AI \u2014 kho chatbot, skill v\xE0 app AI l\xE0m video h\xE0ng \u0111\u1EA7u Vi\u1EC7t Nam", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "bg-slate-950 text-white relative overflow-hidden", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "absolute inset-0 hero-mesh" }),
    /* @__PURE__ */ jsxDEV("div", { class: "relative max-w-4xl mx-auto px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsxDEV("h1", { class: "text-3xl md:text-4xl font-extrabold tracking-tight mb-4", children: "V\u1EC1 WebSkill AI" }),
      /* @__PURE__ */ jsxDEV("p", { class: "text-slate-300 leading-relaxed", children: "Ch\xFAng t\xF4i gi\xFAp ng\u01B0\u1EDDi Vi\u1EC7t l\xE0m video AI b\xE1n h\xE0ng m\u1ED9t c\xE1ch d\u1EC5 d\xE0ng nh\u1EA5t \u2014 th\xF4ng qua kh\xF3a h\u1ECDc th\u1EF1c chi\u1EBFn, skill theo ng\xE1ch, chatbot k\u1ECBch b\u1EA3n th\xF4ng minh v\xE0 app t\u1EA1o video t\u1EF1 \u0111\u1ED9ng." })
    ] })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "max-w-5xl mx-auto px-4 py-14", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-3 gap-5 mb-14", children: [
      ["fa-cube", props.stats.products + "+", "S\u1EA3n ph\u1EA9m"],
      ["fa-users", props.stats.users.toLocaleString("vi-VN") + "+", "Kh\xE1ch h\xE0ng"],
      ["fa-cart-shopping", props.stats.sold.toLocaleString("vi-VN") + "+", "L\u01B0\u1EE3t mua"]
    ].map(([ic, num, lb]) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-7 text-center", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white grid place-items-center mx-auto mb-3.5 shadow-lg", children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${ic}` }) }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-3xl font-extrabold text-slate-900", children: num }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-sm text-slate-500 mt-1", children: lb })
    ] })) }),
    /* @__PURE__ */ jsxDEV("div", { class: "prose-vn max-w-none bg-white rounded-2xl border border-slate-200 p-7 md:p-10", children: [
      /* @__PURE__ */ jsxDEV("h2", { children: "C\xE2u chuy\u1EC7n c\u1EE7a ch\xFAng t\xF4i" }),
      /* @__PURE__ */ jsxDEV("p", { children: "WebSkill AI ra \u0111\u1EDDi t\u1EEB nhu c\u1EA7u th\u1EF1c t\u1EBF: r\u1EA5t nhi\u1EC1u ng\u01B0\u1EDDi mu\u1ED1n l\xE0m video b\xE1n h\xE0ng b\u1EB1ng AI nh\u01B0ng kh\xF4ng bi\u1EBFt vi\u1EBFt prompt, kh\xF4ng bi\u1EBFt quay d\u1EF1ng v\xE0 c\u0169ng kh\xF4ng \u0111\u1EE7 ng\xE2n s\xE1ch thu\xEA agency." }),
      /* @__PURE__ */ jsxDEV("p", { children: [
        "Ch\xFAng t\xF4i b\u1EAFt \u0111\u1EA7u b\u1EB1ng vi\u1EC7c x\xE2y d\u1EF1ng nh\u1EEFng chatbot vi\u1EBFt k\u1ECBch b\u1EA3n chuy\xEAn ng\xE0nh, sau \u0111\xF3 ph\xE1t tri\u1EC3n c\xE1c ",
        /* @__PURE__ */ jsxDEV("b", { children: "skill t\u1EA1o video AI theo ng\xE1ch" }),
        " (Thu\u1EF7 Sinh, L\xE0m V\u01B0\u1EDDn, Fitness...) v\xE0 c\xE1c ",
        /* @__PURE__ */ jsxDEV("b", { children: "kh\xF3a h\u1ECDc th\u1EF1c chi\u1EBFn" }),
        " tr\xEAn Muse AI, Seedance 2.5, Google Flow Veo \u2014 t\u1EA5t c\u1EA3 \u0111\u1EC1u c\xF3 video demo th\u1EADt \u0111\u1EC3 b\u1EA1n xem tr\u01B0\u1EDBc khi mua."
      ] }),
      /* @__PURE__ */ jsxDEV("h2", { children: "Ch\xFAng t\xF4i cung c\u1EA5p g\xEC?" }),
      /* @__PURE__ */ jsxDEV("ul", { children: [
        /* @__PURE__ */ jsxDEV("li", { children: [
          /* @__PURE__ */ jsxDEV("b", { children: "Kh\xF3a h\u1ECDc video AI:" }),
          " h\u1ECDc theo l\u1ED9 tr\xECnh t\u1EEB c\u01A1 b\u1EA3n \u0111\u1EBFn n\xE2ng cao tr\xEAn Muse AI, Seedance 2.5 30s, Google Flow Veo"
        ] }),
        /* @__PURE__ */ jsxDEV("li", { children: [
          /* @__PURE__ */ jsxDEV("b", { children: "Skill t\u1EA1o video AI:" }),
          " b\u1ED9 skill \u0111\xF3ng g\xF3i theo ng\xE1ch \u2014 Thu\u1EF7 Sinh 30s, DIY L\xE0m V\u01B0\u1EDDn 30s, Affiliate Fitness \u2014 l\xE0m theo l\xE0 ra video chu\u1EA9n build page Reels/TikTok"
        ] }),
        /* @__PURE__ */ jsxDEV("li", { children: [
          /* @__PURE__ */ jsxDEV("b", { children: "Chatbot vi\u1EBFt k\u1ECBch b\u1EA3n:" }),
          " sinh s\u1EB5n prompt \u1EA3nh v\xE0 prompt video theo t\u1EEBng ng\xE0nh h\xE0ng"
        ] }),
        /* @__PURE__ */ jsxDEV("li", { children: [
          /* @__PURE__ */ jsxDEV("b", { children: "App l\xE0m video AI:" }),
          " ph\u1EA7n m\u1EC1m render h\xE0ng lo\u1EA1t, t\u1EF1 \u0111\u1ED9ng gh\xE9p voice - sub - nh\u1EA1c"
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("h2", { children: "Cam k\u1EBFt" }),
      /* @__PURE__ */ jsxDEV("ul", { children: [
        /* @__PURE__ */ jsxDEV("li", { children: "Giao s\u1EA3n ph\u1EA9m t\u1EF1 \u0111\u1ED9ng ngay sau khi thanh to\xE1n, kh\xF4ng ph\u1EA3i ch\u1EDD \u0111\u1EE3i" }),
        /* @__PURE__ */ jsxDEV("li", { children: "H\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt 1-1 cho \u0111\u1EBFn khi b\u1EA1n s\u1EED d\u1EE5ng \u0111\u01B0\u1EE3c" }),
        /* @__PURE__ */ jsxDEV("li", { children: "Ho\xE0n ti\u1EC1n 100% trong 7 ng\xE0y n\u1EBFu s\u1EA3n ph\u1EA9m kh\xF4ng \u0111\xFAng m\xF4 t\u1EA3" }),
        /* @__PURE__ */ jsxDEV("li", { children: "C\u1EADp nh\u1EADt mi\u1EC5n ph\xED tr\u1ECDn \u0111\u1EDDi theo API m\u1EDBi c\u1EE7a c\xE1c n\u1EC1n t\u1EA3ng AI" })
      ] }),
      /* @__PURE__ */ jsxDEV("h2", { children: "Gi\xE1 tr\u1ECB c\u1ED1t l\xF5i" }),
      /* @__PURE__ */ jsxDEV("p", { children: [
        /* @__PURE__ */ jsxDEV("b", { children: "Th\u1EF1c chi\u1EBFn:" }),
        " M\u1ECDi s\u1EA3n ph\u1EA9m \u0111\u1EC1u \u0111\u01B0\u1EE3c ch\xFAng t\xF4i t\u1EF1 d\xF9ng tr\u01B0\u1EDBc khi b\xE1n. ",
        /* @__PURE__ */ jsxDEV("b", { children: "Minh b\u1EA1ch:" }),
        " Gi\xE1 c\xF4ng khai, kh\xF4ng ph\xED \u1EA9n. ",
        /* @__PURE__ */ jsxDEV("b", { children: "\u0110\u1ED3ng h\xE0nh:" }),
        " Ch\xFAng t\xF4i h\u1ED7 tr\u1EE3 b\u1EA1n \u0111\u1EBFn khi th\xE0nh c\xF4ng, kh\xF4ng ch\u1EC9 b\xE1n xong l\xE0 h\u1EBFt."
      ] })
    ] })
  ] })
] });
var ContactPage = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, active: "contact", title: "Li\xEAn h\u1EC7", description: "Li\xEAn h\u1EC7 h\u1ED7 tr\u1EE3 WebSkill AI", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-6xl mx-auto px-4 py-10", children: [
  /* @__PURE__ */ jsxDEV(Breadcrumb, { items: [{ label: "Li\xEAn h\u1EC7" }] }),
  /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[1fr_360px] gap-7", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-6 md:p-8", children: [
      /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl font-extrabold text-slate-900 mb-2 tracking-tight", children: "G\u1EEDi y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3" }),
      /* @__PURE__ */ jsxDEV("p", { class: "text-slate-500 text-sm mb-6", children: "\u0110i\u1EC1n form b\xEAn d\u01B0\u1EDBi, ch\xFAng t\xF4i s\u1EBD ph\u1EA3n h\u1ED3i trong v\xF2ng 24 gi\u1EDD l\xE0m vi\u1EC7c." }),
      /* @__PURE__ */ jsxDEV("form", { action: "/api/tickets", method: "post", "data-ajax": true, class: "space-y-4", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "H\u1ECD t\xEAn *" }),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                name: "name",
                required: true,
                value: props.user?.full_name || "",
                class: "w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm"
              }
            )
          ] }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "Email *" }),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "email",
                name: "email",
                required: true,
                value: props.user?.email || "",
                class: "w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "Ti\xEAu \u0111\u1EC1 *" }),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              name: "subject",
              required: true,
              placeholder: "V\u1EA5n \u0111\u1EC1 b\u1EA1n g\u1EB7p ph\u1EA3i",
              class: "w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: "block text-sm font-medium text-slate-700 mb-1.5", children: "N\u1ED9i dung *" }),
          /* @__PURE__ */ jsxDEV(
            "textarea",
            {
              name: "message",
              rows: 6,
              required: true,
              placeholder: "M\xF4 t\u1EA3 chi ti\u1EBFt v\u1EA5n \u0111\u1EC1 c\u1EE7a b\u1EA1n...",
              class: "w-full p-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm resize-y"
            }
          )
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700" }),
        /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "h-12 px-6 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white font-bold hover:opacity-90 shadow-lg shadow-brand-500/25 transition", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-paper-plane mr-1.5" }),
          "G\u1EEDi y\xEAu c\u1EA7u"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("aside", { class: "space-y-4", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-4", children: "Th\xF4ng tin li\xEAn h\u1EC7" }),
        /* @__PURE__ */ jsxDEV("div", { class: "space-y-4", children: [
          ["fa-phone-volume", "Hotline", props.settings?.hotline, `tel:${(props.settings?.hotline || "").replace(/\s/g, "")}`],
          ["fa-envelope", "Email", props.settings?.email, `mailto:${props.settings?.email}`],
          ["fa-comment-dots", "Zalo", props.settings?.zalo, `https://zalo.me/${props.settings?.zalo}`],
          ["fa-clock", "Gi\u1EDD l\xE0m vi\u1EC7c", "8:00 \u2013 22:00 (T2\u2013CN)", ""]
        ].map(([ic, lb, val, href]) => /* @__PURE__ */ jsxDEV("div", { class: "flex gap-3.5", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${ic}` }) }),
          /* @__PURE__ */ jsxDEV("div", { class: "min-w-0", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: lb }),
            href ? /* @__PURE__ */ jsxDEV("a", { href, target: "_blank", rel: "noopener", class: "font-semibold text-slate-900 text-sm hover:text-brand-600 break-all", children: val }) : /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900 text-sm", children: val })
          ] })
        ] })) })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-gradient-to-br from-brand-600 to-fuchsia-600 rounded-2xl p-5 text-white", children: [
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-bolt text-2xl mb-2.5" }),
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold mb-1.5", children: "C\u1EA7n h\u1ED7 tr\u1EE3 g\u1EA5p?" }),
        /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-white/85 mb-4 leading-relaxed", children: "Chat Zalo l\xE0 k\xEAnh ph\u1EA3n h\u1ED3i nhanh nh\u1EA5t, th\u01B0\u1EDDng d\u01B0\u1EDBi 5 ph\xFAt trong gi\u1EDD l\xE0m vi\u1EC7c." }),
        /* @__PURE__ */ jsxDEV(
          "a",
          {
            href: `https://zalo.me/${props.settings?.zalo}`,
            target: "_blank",
            rel: "noopener",
            class: "flex items-center justify-center w-full h-11 rounded-xl bg-white text-brand-700 font-bold text-sm hover:bg-slate-100 transition",
            children: "Chat Zalo ngay"
          }
        )
      ] })
    ] })
  ] })
] }) });
var AffiliateLandingPage = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, active: "affiliate", title: "Ch\u01B0\u01A1ng tr\xECnh Affiliate", description: "Ki\u1EBFm hoa h\u1ED3ng khi gi\u1EDBi thi\u1EC7u s\u1EA3n ph\u1EA9m WebSkill AI", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "bg-slate-950 text-white relative overflow-hidden", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "absolute inset-0 hero-mesh" }),
    /* @__PURE__ */ jsxDEV("div", { class: "relative max-w-4xl mx-auto px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5", children: [
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-handshake text-amber-400" }),
        "Ch\u01B0\u01A1ng tr\xECnh \u0111\u1ED1i t\xE1c"
      ] }),
      /* @__PURE__ */ jsxDEV("h1", { class: "text-3xl md:text-5xl font-extrabold tracking-tight mb-4", children: [
        "Nh\u1EADn ",
        /* @__PURE__ */ jsxDEV("span", { class: "bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent", children: [
          props.percent,
          "% hoa h\u1ED3ng"
        ] }),
        " m\u1ED7i \u0111\u01A1n h\xE0ng"
      ] }),
      /* @__PURE__ */ jsxDEV("p", { class: "text-slate-300 max-w-2xl mx-auto mb-8", children: "Chia s\u1EBB link gi\u1EDBi thi\u1EC7u, ki\u1EBFm thu nh\u1EADp th\u1EE5 \u0111\u1ED9ng kh\xF4ng gi\u1EDBi h\u1EA1n. Kh\xF4ng c\u1EA7n v\u1ED1n, kh\xF4ng c\u1EA7n kho h\xE0ng." }),
      /* @__PURE__ */ jsxDEV(
        "a",
        {
          href: props.user ? "/tai-khoan/affiliate" : "/dang-ky",
          class: "inline-flex h-12 px-7 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold hover:opacity-90 shadow-xl transition",
          children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-rocket" }),
            props.user ? "V\xE0o trang Affiliate" : "Tham gia ngay \u2014 Mi\u1EC5n ph\xED"
          ]
        }
      )
    ] })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "max-w-6xl mx-auto px-4 py-14", children: [
    /* @__PURE__ */ jsxDEV(SectionTitle, { center: true, title: "C\xE1ch ho\u1EA1t \u0111\u1ED9ng", subtitle: "Ch\u1EC9 3 b\u01B0\u1EDBc \u0111\u01A1n gi\u1EA3n \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u ki\u1EBFm ti\u1EC1n" }),
    /* @__PURE__ */ jsxDEV("div", { class: "grid md:grid-cols-3 gap-5 mt-8 mb-14", children: [
      ["fa-user-plus", "1. \u0110\u0103ng k\xFD t\xE0i kho\u1EA3n", "T\u1EA1o t\xE0i kho\u1EA3n mi\u1EC5n ph\xED v\xE0 nh\u1EADn ngay m\xE3 gi\u1EDBi thi\u1EC7u ri\xEAng c\u1EE7a b\u1EA1n."],
      ["fa-share-nodes", "2. Chia s\u1EBB link", "\u0110\u0103ng link l\xEAn Facebook, TikTok, Zalo, group ho\u1EB7c g\u1EEDi tr\u1EF1c ti\u1EBFp cho b\u1EA1n b\xE8."],
      ["fa-coins", "3. Nh\u1EADn hoa h\u1ED3ng", `Nh\u1EADn ${props.percent}% gi\xE1 tr\u1ECB m\u1ED7i \u0111\u01A1n h\xE0ng ph\xE1t sinh t\u1EEB link c\u1EE7a b\u1EA1n.`]
    ].map(([ic, t, d]) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-7 text-center", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white grid place-items-center text-xl mx-auto mb-4 shadow-lg", children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${ic}` }) }),
      /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-2", children: t }),
      /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-slate-500 leading-relaxed", children: d })
    ] })) }),
    /* @__PURE__ */ jsxDEV(SectionTitle, { center: true, title: "Thu nh\u1EADp tham kh\u1EA3o", subtitle: "\u01AF\u1EDBc t\xEDnh d\u1EF1a tr\xEAn s\u1ED1 \u0111\u01A1n gi\u1EDBi thi\u1EC7u m\u1ED7i th\xE1ng" }),
    /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-3 gap-5 mt-8", children: [[5, 89e4], [20, 89e4], [50, 89e4]].map(([n, avg]) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-7 text-center", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "text-sm text-slate-500 mb-1", children: [
        n,
        " \u0111\u01A1n / th\xE1ng"
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-3xl font-extrabold text-emerald-600", children: formatVND(Math.round(n * avg * props.percent / 100)) }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-400 mt-1.5", children: [
        "Gi\xE1 tr\u1ECB \u0111\u01A1n TB ",
        formatVND(avg)
      ] })
    ] })) }),
    /* @__PURE__ */ jsxDEV("div", { class: "mt-14 bg-white rounded-2xl border border-slate-200 p-7 md:p-10", children: [
      /* @__PURE__ */ jsxDEV("h2", { class: "text-xl font-extrabold text-slate-900 mb-5", children: "\u0110i\u1EC1u kho\u1EA3n ch\u01B0\u01A1ng tr\xECnh" }),
      /* @__PURE__ */ jsxDEV("ul", { class: "space-y-3 text-sm text-slate-600", children: [
        `Hoa h\u1ED3ng ${props.percent}% tr\xEAn gi\xE1 tr\u1ECB \u0111\u01A1n h\xE0ng th\u1EF1c thu (sau gi\u1EA3m gi\xE1)`,
        'Hoa h\u1ED3ng \u0111\u01B0\u1EE3c ghi nh\u1EADn khi \u0111\u01A1n h\xE0ng chuy\u1EC3n sang tr\u1EA1ng th\xE1i "\u0110\xE3 thanh to\xE1n"',
        "R\xFAt hoa h\u1ED3ng t\u1ED1i thi\u1EC3u 200.000\u0111, x\u1EED l\xFD trong 1-3 ng\xE0y l\xE0m vi\u1EC7c",
        "Kh\xF4ng \xE1p d\u1EE5ng cho \u0111\u01A1n h\xE0ng t\u1EF1 mua b\u1EB1ng m\xE3 c\u1EE7a ch\xEDnh m\xECnh",
        "Nghi\xEAm c\u1EA5m spam, ch\u1EA1y qu\u1EA3ng c\xE1o tr\xEAn th\u01B0\u01A1ng hi\u1EC7u WebSkill AI"
      ].map((t) => /* @__PURE__ */ jsxDEV("li", { class: "flex gap-2.5", children: [
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-check text-emerald-500 mt-0.5 shrink-0" }),
        t
      ] })) })
    ] })
  ] })
] });
var DocPage = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, title: props.heading, children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-4xl mx-auto px-4 py-10", children: [
  /* @__PURE__ */ jsxDEV(Breadcrumb, { items: [{ label: props.heading }] }),
  /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-7", children: props.heading }),
  /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-6 md:p-9", children: /* @__PURE__ */ jsxDEV("div", { class: "prose-vn max-w-none", dangerouslySetInnerHTML: { __html: props.html } }) })
] }) });
var NotFoundPage = (props) => /* @__PURE__ */ jsxDEV(Layout, { ...props, title: "Kh\xF4ng t\xECm th\u1EA5y trang", children: /* @__PURE__ */ jsxDEV("div", { class: "max-w-lg mx-auto px-4 py-24 text-center", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "text-7xl font-extrabold bg-gradient-to-r from-brand-500 to-fuchsia-500 bg-clip-text text-transparent mb-4", children: "404" }),
  /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl font-extrabold text-slate-900 mb-2", children: "Kh\xF4ng t\xECm th\u1EA5y trang" }),
  /* @__PURE__ */ jsxDEV("p", { class: "text-slate-500 mb-7", children: "Trang b\u1EA1n t\xECm ki\u1EBFm kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 b\u1ECB di chuy\u1EC3n." }),
  /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap justify-center gap-3", children: [
    /* @__PURE__ */ jsxDEV("a", { href: "/", class: "h-11 px-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition", children: [
      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-house" }),
      "V\u1EC1 trang ch\u1EE7"
    ] }),
    /* @__PURE__ */ jsxDEV("a", { href: "/san-pham", class: "h-11 px-5 inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 hover:border-brand-400 font-semibold text-sm transition", children: [
      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-cubes" }),
      "Xem s\u1EA3n ph\u1EA9m"
    ] })
  ] })
] }) });

// src/pages/admin.tsx
var MENU2 = [
  { href: "/admin", icon: "fa-gauge-high", label: "Dashboard", key: "dash" },
  { href: "/admin/san-pham", icon: "fa-cubes", label: "S\u1EA3n ph\u1EA9m", key: "products" },
  { href: "/admin/danh-muc", icon: "fa-folder-tree", label: "Danh m\u1EE5c", key: "categories" },
  { href: "/admin/don-hang", icon: "fa-receipt", label: "\u0110\u01A1n h\xE0ng", key: "orders" },
  { href: "/admin/giao-dich", icon: "fa-building-columns", label: "Giao d\u1ECBch NH", key: "banktx" },
  { href: "/admin/thanh-vien", icon: "fa-users", label: "Th\xE0nh vi\xEAn", key: "users" },
  { href: "/admin/ma-giam-gia", icon: "fa-ticket", label: "M\xE3 gi\u1EA3m gi\xE1", key: "coupons" },
  { href: "/admin/bai-viet", icon: "fa-newspaper", label: "B\xE0i vi\u1EBFt", key: "posts" },
  { href: "/admin/danh-gia", icon: "fa-star", label: "\u0110\xE1nh gi\xE1", key: "reviews" },
  { href: "/admin/ho-tro", icon: "fa-headset", label: "H\u1ED7 tr\u1EE3", key: "tickets" },
  { href: "/admin/cai-dat", icon: "fa-gear", label: "C\xE0i \u0111\u1EB7t", key: "settings" }
];
var AdminShell = (props) => /* @__PURE__ */ jsxDEV("html", { lang: "vi", children: [
  /* @__PURE__ */ jsxDEV("head", { children: [
    /* @__PURE__ */ jsxDEV("meta", { charset: "UTF-8" }),
    /* @__PURE__ */ jsxDEV("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
    /* @__PURE__ */ jsxDEV("title", { children: [
      props.heading,
      " | Qu\u1EA3n tr\u1ECB WebSkill AI"
    ] }),
    /* @__PURE__ */ jsxDEV("meta", { name: "robots", content: "noindex,nofollow" }),
    /* @__PURE__ */ jsxDEV("link", { rel: "icon", href: "/static/favicon.svg", type: "image/svg+xml" }),
    /* @__PURE__ */ jsxDEV("script", { src: "https://cdn.tailwindcss.com" }),
    /* @__PURE__ */ jsxDEV("script", { dangerouslySetInnerHTML: {
      __html: `tailwind.config={theme:{extend:{colors:{brand:{50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81'}},fontFamily:{sans:['Be Vietnam Pro','system-ui','sans-serif']}}}}`
    } }),
    /* @__PURE__ */ jsxDEV("link", { href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap", rel: "stylesheet" }),
    /* @__PURE__ */ jsxDEV("link", { href: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css", rel: "stylesheet" }),
    /* @__PURE__ */ jsxDEV("link", { href: "/static/style.css", rel: "stylesheet" })
  ] }),
  /* @__PURE__ */ jsxDEV("body", { class: "bg-slate-100 text-slate-800 antialiased", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "flex min-h-screen", children: [
      /* @__PURE__ */ jsxDEV("aside", { id: "admin-sidebar", class: "w-60 bg-slate-900 text-slate-300 flex-col fixed inset-y-0 left-0 z-40 hidden lg:flex", children: [
        /* @__PURE__ */ jsxDEV("a", { href: "/admin", class: "h-16 flex items-center gap-2.5 px-5 border-b border-slate-800 shrink-0", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center text-white", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-shield-halved text-sm" }) }),
          /* @__PURE__ */ jsxDEV("div", { class: "leading-none", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "font-extrabold text-white text-sm", children: "Admin Panel" }),
            /* @__PURE__ */ jsxDEV("div", { class: "text-[10px] text-slate-500 mt-0.5", children: "WebSkill AI" })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("nav", { class: "flex-1 overflow-y-auto p-3 space-y-0.5", children: MENU2.map((m) => /* @__PURE__ */ jsxDEV("a", { href: m.href, class: `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${props.activeKey === m.key ? "bg-brand-600 text-white" : "hover:bg-slate-800 hover:text-white"}`, children: [
          /* @__PURE__ */ jsxDEV("i", { class: `fas ${m.icon} w-4 text-center` }),
          m.label
        ] })) }),
        /* @__PURE__ */ jsxDEV("div", { class: "p-3 border-t border-slate-800 space-y-0.5", children: [
          /* @__PURE__ */ jsxDEV("a", { href: "/", class: "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm hover:bg-slate-800 hover:text-white transition", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-left w-4 text-center" }),
            "V\u1EC1 trang ch\u1EE7"
          ] }),
          /* @__PURE__ */ jsxDEV("a", { href: "/dang-xuat", class: "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-950 transition", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-right-from-bracket w-4 text-center" }),
            "\u0110\u0103ng xu\u1EA5t"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "flex-1 lg:ml-60 min-w-0", children: [
        /* @__PURE__ */ jsxDEV("header", { class: "h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center gap-4 px-5", children: [
          /* @__PURE__ */ jsxDEV("button", { id: "admin-menu-btn", class: "lg:hidden w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-bars" }) }),
          /* @__PURE__ */ jsxDEV("div", { class: "min-w-0", children: [
            /* @__PURE__ */ jsxDEV("h1", { class: "font-extrabold text-slate-900 truncate", children: props.heading }),
            props.sub && /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-slate-500 truncate", children: props.sub })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "ml-auto flex items-center gap-3", children: [
            /* @__PURE__ */ jsxDEV("a", { href: "/", target: "_blank", class: "hidden sm:flex h-9 px-3.5 items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium transition", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-arrow-up-right-from-square text-xs" }),
              "Xem site"
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white grid place-items-center text-xs font-bold", children: props.user.full_name.charAt(0).toUpperCase() }),
              /* @__PURE__ */ jsxDEV("div", { class: "hidden md:block leading-none", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "text-sm font-semibold", children: props.user.full_name }),
                /* @__PURE__ */ jsxDEV("div", { class: "text-[11px] text-slate-500 mt-0.5", children: "Qu\u1EA3n tr\u1ECB vi\xEAn" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("main", { class: "p-5", children: props.children })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { id: "toast-container", class: "fixed top-20 right-4 z-[100] flex flex-col gap-2" }),
    /* @__PURE__ */ jsxDEV("script", { src: "https://cdn.jsdelivr.net/npm/axios@1.6.7/dist/axios.min.js" }),
    /* @__PURE__ */ jsxDEV("script", { src: "/static/app.js" }),
    /* @__PURE__ */ jsxDEV("script", { src: "/static/admin.js" })
  ] })
] });
var AdminDashboard = (props) => {
  const max = Math.max(...props.chart.map((c) => c.value), 1);
  return /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "dash", heading: "Dashboard", sub: "T\u1ED5ng quan ho\u1EA1t \u0111\u1ED9ng h\u1EC7 th\u1ED1ng", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5", children: [
      ["fa-sack-dollar", "Doanh thu", formatVND(props.stats.revenue), "from-emerald-500 to-teal-600", `${props.stats.paidOrders} \u0111\u01A1n \u0111\xE3 thanh to\xE1n`],
      ["fa-receipt", "T\u1ED5ng \u0111\u01A1n h\xE0ng", String(props.stats.orders), "from-brand-500 to-brand-600", `${props.stats.pendingOrders} \u0111\u01A1n ch\u1EDD x\u1EED l\xFD`],
      ["fa-users", "Th\xE0nh vi\xEAn", String(props.stats.users), "from-fuchsia-500 to-purple-600", `+${props.stats.newUsers} trong 30 ng\xE0y`],
      ["fa-cubes", "S\u1EA3n ph\u1EA9m", String(props.stats.products), "from-amber-500 to-orange-600", `${props.stats.totalSold} l\u01B0\u1EE3t b\xE1n`]
    ].map(([ic, lb, val, grad, note]) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "flex items-start justify-between mb-3.5", children: /* @__PURE__ */ jsxDEV("div", { class: `w-11 h-11 rounded-xl bg-gradient-to-br ${grad} text-white grid place-items-center shadow-lg`, children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${ic}` }) }) }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-2xl font-extrabold text-slate-900 leading-none mb-1.5", children: val }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: lb }),
      /* @__PURE__ */ jsxDEV("div", { class: "text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100", children: note })
    ] })) }),
    /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[1.4fr_1fr] gap-5 mb-5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-5", children: "Doanh thu 7 ng\xE0y g\u1EA7n nh\u1EA5t" }),
        /* @__PURE__ */ jsxDEV("div", { class: "flex items-end gap-2 h-48", children: props.chart.map((c) => /* @__PURE__ */ jsxDEV("div", { class: "flex-1 flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "text-[10px] font-bold text-slate-600", children: c.value > 0 ? (c.value / 1e3).toFixed(0) + "k" : "" }),
          /* @__PURE__ */ jsxDEV(
            "div",
            {
              class: "w-full bg-gradient-to-t from-brand-600 to-fuchsia-500 rounded-t-lg transition-all hover:opacity-80",
              style: `height:${Math.max(c.value / max * 100, 2)}%`,
              title: formatVND(c.value)
            }
          ),
          /* @__PURE__ */ jsxDEV("div", { class: "text-[10px] text-slate-500 whitespace-nowrap", children: c.label })
        ] })) })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "px-5 py-4 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "S\u1EA3n ph\u1EA9m b\xE1n ch\u1EA1y" }) }),
        /* @__PURE__ */ jsxDEV("div", { class: "divide-y divide-slate-100 max-h-64 overflow-y-auto", children: props.topProducts.map((p, i) => /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-3 px-5 py-3", children: [
          /* @__PURE__ */ jsxDEV("div", { class: `w-7 h-7 rounded-lg grid place-items-center text-xs font-bold shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`, children: i + 1 }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "text-sm font-semibold text-slate-800 line-clamp-1", children: p.name }),
            /* @__PURE__ */ jsxDEV("div", { class: "text-[11px] text-slate-500", children: [
              p.sold_count,
              " l\u01B0\u1EE3t b\xE1n"
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "text-sm font-bold text-slate-900 shrink-0", children: formatVND(p.price) })
        ] })) })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "px-5 py-4 border-b border-slate-200 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "\u0110\u01A1n h\xE0ng g\u1EA7n \u0111\xE2y" }),
        /* @__PURE__ */ jsxDEV("a", { href: "/admin/don-hang", class: "text-xs font-semibold text-brand-600 hover:underline", children: "Xem t\u1EA5t c\u1EA3" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
        /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "M\xE3 \u0111\u01A1n" }),
          /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Kh\xE1ch h\xE0ng" }),
          /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Ng\xE0y" }),
          /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "T\u1ED5ng ti\u1EC1n" }),
          /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "Tr\u1EA1ng th\xE1i" }),
          /* @__PURE__ */ jsxDEV("th", {})
        ] }) }),
        /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: props.recentOrders.map((o) => /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("b", { class: "text-brand-600", children: o.order_code }) }),
          /* @__PURE__ */ jsxDEV("td", { children: [
            /* @__PURE__ */ jsxDEV("div", { class: "font-medium text-slate-800", children: o.full_name }),
            /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: o.email })
          ] }),
          /* @__PURE__ */ jsxDEV("td", { class: "text-slate-500 whitespace-nowrap", children: formatDate(o.created_at) }),
          /* @__PURE__ */ jsxDEV("td", { class: "text-right font-bold", children: formatVND(o.total) }),
          /* @__PURE__ */ jsxDEV("td", { class: "text-center", children: /* @__PURE__ */ jsxDEV(StatusBadge, { status: o.status }) }),
          /* @__PURE__ */ jsxDEV("td", { class: "text-right", children: /* @__PURE__ */ jsxDEV("a", { href: `/admin/don-hang/${o.id}`, class: "text-brand-600 hover:underline text-xs font-semibold", children: "Chi ti\u1EBFt" }) })
        ] })) })
      ] }) })
    ] })
  ] });
};
var AdminProducts = (props) => /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "products", heading: "Qu\u1EA3n l\xFD s\u1EA3n ph\u1EA9m", sub: `${props.products.length} s\u1EA3n ph\u1EA9m hi\u1EC3n th\u1ECB`, children: [
  /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-center gap-3 mb-4", children: [
    /* @__PURE__ */ jsxDEV("form", { action: "/admin/san-pham", method: "get", class: "flex-1 min-w-[200px] max-w-sm", children: /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "text",
          name: "q",
          value: props.q,
          placeholder: "T\xECm s\u1EA3n ph\u1EA9m...",
          class: "w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 focus:border-brand-400 outline-none text-sm"
        }
      ),
      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" })
    ] }) }),
    /* @__PURE__ */ jsxDEV("a", { href: "/admin/san-pham/moi", class: "h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition ml-auto", children: [
      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-plus" }),
      "Th\xEAm s\u1EA3n ph\u1EA9m"
    ] })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
    /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "S\u1EA3n ph\u1EA9m" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Danh m\u1EE5c" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "Gi\xE1" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "\u0110\xE3 b\xE1n" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "Tr\u1EA1ng th\xE1i" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "Thao t\xE1c" })
    ] }) }),
    /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: props.products.map((p) => /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("td", { children: [
        /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900 line-clamp-1 max-w-xs", children: p.name }),
        /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 flex gap-2 mt-0.5", children: [
          /* @__PURE__ */ jsxDEV("span", { class: "px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-medium", children: PRODUCT_TYPE_LABEL[p.product_type] }),
          /* @__PURE__ */ jsxDEV("span", { children: p.version }),
          p.is_hot === 1 && /* @__PURE__ */ jsxDEV("span", { class: "text-orange-600 font-semibold", children: "HOT" }),
          p.is_featured === 1 && /* @__PURE__ */ jsxDEV("span", { class: "text-amber-600 font-semibold", children: "\u2605" })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-slate-600", children: p.category_name || "\u2014" }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-right", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "font-bold text-slate-900", children: formatVND(p.price) }),
        p.original_price > p.price && /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-400 line-through", children: formatVND(p.original_price) })
      ] }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-center font-semibold", children: p.sold_count }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-center", children: /* @__PURE__ */ jsxDEV(StatusBadge, { status: p.status }) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-right whitespace-nowrap", children: [
        /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${p.slug}`, target: "_blank", class: "inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-slate-100 text-slate-500", title: "Xem", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-eye text-xs" }) }),
        /* @__PURE__ */ jsxDEV("a", { href: `/admin/san-pham/${p.id}`, class: "inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-brand-50 text-brand-600", title: "S\u1EEDa", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-pen text-xs" }) }),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: "btn-delete inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-rose-50 text-rose-500",
            title: "Xo\xE1",
            "data-url": `/api/admin/products/${p.id}`,
            "data-name": p.name,
            children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-trash-can text-xs" })
          }
        )
      ] })
    ] })) })
  ] }) }) }),
  /* @__PURE__ */ jsxDEV(Pagination, { page: props.page, totalPages: props.totalPages, baseUrl: "/admin/san-pham" + (props.q ? "?q=" + encodeURIComponent(props.q) : "") })
] });
var fieldCls = "w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm";
var labelCls = "block text-sm font-medium text-slate-700 mb-1.5";
var AdminProductForm = (props) => {
  const p = props.product || {};
  return /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "products", heading: props.isNew ? "Th\xEAm s\u1EA3n ph\u1EA9m m\u1EDBi" : "Ch\u1EC9nh s\u1EEDa s\u1EA3n ph\u1EA9m", sub: props.isNew ? "" : p.name, children: /* @__PURE__ */ jsxDEV("form", { action: props.isNew ? "/api/admin/products" : `/api/admin/products/${p.id}/update`, method: "post", "data-ajax": true, class: "grid lg:grid-cols-[1fr_320px] gap-5", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "space-y-5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "Th\xF4ng tin c\u01A1 b\u1EA3n" }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "T\xEAn s\u1EA3n ph\u1EA9m *" }),
          /* @__PURE__ */ jsxDEV("input", { type: "text", name: "name", value: p.name || "", required: true, class: fieldCls })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Slug (URL) *" }),
            /* @__PURE__ */ jsxDEV("input", { type: "text", name: "slug", value: p.slug || "", required: true, placeholder: "ten-san-pham", class: fieldCls })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Phi\xEAn b\u1EA3n" }),
            /* @__PURE__ */ jsxDEV("input", { type: "text", name: "version", value: p.version || "v1.0", class: fieldCls })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "M\xF4 t\u1EA3 ng\u1EAFn" }),
          /* @__PURE__ */ jsxDEV("textarea", { name: "short_desc", rows: 2, class: "w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm resize-y", children: p.short_desc || "" })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "M\xF4 t\u1EA3 chi ti\u1EBFt (HTML)" }),
          /* @__PURE__ */ jsxDEV("textarea", { name: "description", rows: 12, class: "w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm font-mono resize-y", children: p.description || "" }),
          /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-slate-400 mt-1", children: "H\u1ED7 tr\u1EE3 HTML: <h3>, <p>, <ul><li>, <b>, <code>" })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-photo-film text-brand-500" }),
          "H\xECnh \u1EA3nh & Video m\xF4 t\u1EA3 s\u1EA3n ph\u1EA9m"
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "\u1EA2nh \u0111\u1EA1i di\u1EC7n s\u1EA3n ph\u1EA9m (URL)" }),
            /* @__PURE__ */ jsxDEV("input", { type: "url", name: "thumbnail", value: p.thumbnail || "", placeholder: "https://...", class: fieldCls })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Video Demo s\u1EA3n ph\u1EA9m (YouTube embed URL)" }),
            /* @__PURE__ */ jsxDEV("input", { type: "url", name: "demo_video_url", value: p.demo_video_url || "", placeholder: "Link YouTube embed ho\u1EB7c file MP4: /videos/demo-xxx.mp4", class: fieldCls })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "N\u1ED9i dung b\xE0n giao" }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "\u{1F517} Link source code (ch\u1EC9 hi\u1EC7n sau khi mua) *" }),
          /* @__PURE__ */ jsxDEV("input", { type: "url", name: "download_url", value: p.download_url || "", placeholder: "https://drive.google.com/...", class: fieldCls })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Link t\xE0i li\u1EC7u h\u01B0\u1EDBng d\u1EABn" }),
            /* @__PURE__ */ jsxDEV("input", { type: "url", name: "doc_url", value: p.doc_url || "", class: fieldCls })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Dung l\u01B0\u1EE3ng file" }),
            /* @__PURE__ */ jsxDEV("input", { type: "text", name: "file_size", value: p.file_size || "", placeholder: "248 MB", class: fieldCls })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Link demo tr\u1EF1c ti\u1EBFp" }),
          /* @__PURE__ */ jsxDEV("input", { type: "url", name: "demo_url", value: p.demo_url || "", class: fieldCls })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "T\xEDnh n\u0103ng & C\xF4ng ngh\u1EC7" }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Danh s\xE1ch t\xEDnh n\u0103ng (m\u1ED7i d\xF2ng 1 m\u1EE5c)" }),
          /* @__PURE__ */ jsxDEV("textarea", { name: "features_text", rows: 6, class: "w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm resize-y", children: (() => {
            try {
              return JSON.parse(p.features || "[]").join("\n");
            } catch {
              return "";
            }
          })() })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "C\xF4ng ngh\u1EC7 (m\u1ED7i d\xF2ng 1 m\u1EE5c)" }),
          /* @__PURE__ */ jsxDEV("textarea", { name: "tech_text", rows: 4, class: "w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm resize-y", children: (() => {
            try {
              return JSON.parse(p.tech_stack || "[]").join("\n");
            } catch {
              return "";
            }
          })() })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("aside", { class: "space-y-5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "Gi\xE1 b\xE1n" }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Gi\xE1 b\xE1n (VND) *" }),
          /* @__PURE__ */ jsxDEV("input", { type: "number", name: "price", value: p.price || 0, required: true, min: "0", step: "1000", class: fieldCls })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Gi\xE1 g\u1ED1c (g\u1EA1ch ngang)" }),
          /* @__PURE__ */ jsxDEV("input", { type: "number", name: "original_price", value: p.original_price || "", min: "0", step: "1000", class: fieldCls })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "Ph\xE2n lo\u1EA1i" }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Danh m\u1EE5c" }),
          /* @__PURE__ */ jsxDEV("select", { name: "category_id", class: fieldCls, children: props.categories.map((c) => /* @__PURE__ */ jsxDEV("option", { value: c.id, selected: p.category_id === c.id, children: c.name })) })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Lo\u1EA1i s\u1EA3n ph\u1EA9m" }),
          /* @__PURE__ */ jsxDEV("select", { name: "product_type", class: fieldCls, children: Object.entries(PRODUCT_TYPE_LABEL).map(([v, l]) => /* @__PURE__ */ jsxDEV("option", { value: v, selected: p.product_type === v, children: l })) })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Tr\u1EA1ng th\xE1i" }),
          /* @__PURE__ */ jsxDEV("select", { name: "status", class: fieldCls, children: [
            /* @__PURE__ */ jsxDEV("option", { value: "published", selected: p.status !== "draft", children: "Hi\u1EC3n th\u1ECB" }),
            /* @__PURE__ */ jsxDEV("option", { value: "draft", selected: p.status === "draft", children: "Nh\xE1p" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-3", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "\u0110\xE1nh d\u1EA5u" }),
        [["is_featured", "N\u1ED5i b\u1EADt (trang ch\u1EE7)"], ["is_hot", "B\xE1n ch\u1EA1y (HOT)"], ["is_new", "M\u1EDBi ra m\u1EAFt"]].map(([n, l]) => /* @__PURE__ */ jsxDEV("label", { class: "flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer", children: [
          /* @__PURE__ */ jsxDEV("input", { type: "checkbox", name: n, value: "1", checked: p[n] === 1, class: "accent-brand-600 w-4 h-4" }),
          l
        ] }))
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 mb-3" }),
        /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition mb-2", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-floppy-disk mr-1.5" }),
          props.isNew ? "T\u1EA1o s\u1EA3n ph\u1EA9m" : "L\u01B0u thay \u0111\u1ED5i"
        ] }),
        /* @__PURE__ */ jsxDEV("a", { href: "/admin/san-pham", class: "block text-center h-11 leading-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition", children: "Hu\u1EF7" })
      ] })
    ] })
  ] }) });
};
var AdminOrders = (props) => /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "orders", heading: "Qu\u1EA3n l\xFD \u0111\u01A1n h\xE0ng", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap gap-2 mb-4", children: [
    [["", "T\u1EA5t c\u1EA3"], ["pending", "Ch\u1EDD thanh to\xE1n"], ["paid", "\u0110\xE3 thanh to\xE1n"], ["cancelled", "\u0110\xE3 hu\u1EF7"], ["refunded", "Ho\xE0n ti\u1EC1n"]].map(([v, l]) => /* @__PURE__ */ jsxDEV(
      "a",
      {
        href: `/admin/don-hang${v ? "?status=" + v : ""}`,
        class: `h-9 px-4 inline-flex items-center rounded-xl text-sm font-semibold transition ${props.status === v ? "bg-brand-600 text-white" : "bg-white border border-slate-200 hover:border-brand-400"}`,
        children: l
      }
    )),
    /* @__PURE__ */ jsxDEV("form", { action: "/admin/don-hang", method: "get", class: "ml-auto", children: [
      props.status && /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "status", value: props.status }),
      /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            name: "q",
            value: props.q,
            placeholder: "M\xE3 \u0111\u01A1n / email...",
            class: "w-56 h-9 pl-8 pr-3 rounded-xl bg-white border border-slate-200 focus:border-brand-400 outline-none text-sm"
          }
        ),
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" })
      ] })
    ] })
  ] }),
  /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
    /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "M\xE3 \u0111\u01A1n" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Kh\xE1ch h\xE0ng" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Ng\xE0y" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Thanh to\xE1n" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "T\u1ED5ng" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "Tr\u1EA1ng th\xE1i" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "Thao t\xE1c" })
    ] }) }),
    /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: [
      props.orders.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colspan: 7, class: "text-center py-12 text-slate-500", children: "Kh\xF4ng c\xF3 \u0111\u01A1n h\xE0ng n\xE0o" }) }),
      props.orders.map((o) => /* @__PURE__ */ jsxDEV("tr", { children: [
        /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("a", { href: `/admin/don-hang/${o.id}`, class: "font-bold text-brand-600 hover:underline", children: o.order_code }) }),
        /* @__PURE__ */ jsxDEV("td", { children: [
          /* @__PURE__ */ jsxDEV("div", { class: "font-medium text-slate-800", children: o.full_name }),
          /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: o.email })
        ] }),
        /* @__PURE__ */ jsxDEV("td", { class: "text-slate-500 whitespace-nowrap text-xs", children: formatDateTime(o.created_at) }),
        /* @__PURE__ */ jsxDEV("td", { class: "text-slate-600 text-xs", children: o.payment_method === "bank" ? "VietQR" : o.payment_method === "momo" ? "MoMo" : "V\xED" }),
        /* @__PURE__ */ jsxDEV("td", { class: "text-right font-bold", children: formatVND(o.total) }),
        /* @__PURE__ */ jsxDEV("td", { class: "text-center", children: /* @__PURE__ */ jsxDEV(StatusBadge, { status: o.status }) }),
        /* @__PURE__ */ jsxDEV("td", { class: "text-right whitespace-nowrap", children: [
          o.status === "pending" && /* @__PURE__ */ jsxDEV(
            "button",
            {
              class: "btn-order-action h-8 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition",
              "data-id": o.id,
              "data-status": "paid",
              title: "X\xE1c nh\u1EADn thanh to\xE1n",
              children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-check mr-1" }),
                "Duy\u1EC7t"
              ]
            }
          ),
          /* @__PURE__ */ jsxDEV("a", { href: `/admin/don-hang/${o.id}`, class: "inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-slate-100 text-slate-500 ml-1", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-eye text-xs" }) })
        ] })
      ] }))
    ] })
  ] }) }) }),
  /* @__PURE__ */ jsxDEV(Pagination, { page: props.page, totalPages: props.totalPages, baseUrl: "/admin/don-hang?status=" + props.status })
] });
var AdminOrderDetail = (props) => {
  const { order, items } = props;
  return /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "orders", heading: `\u0110\u01A1n h\xE0ng ${order.order_code}`, sub: formatDateTime(order.created_at), children: /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[1fr_320px] gap-5", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "space-y-5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "px-5 py-4 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: [
          "S\u1EA3n ph\u1EA9m (",
          items.length,
          ")"
        ] }) }),
        /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: items.map((it) => /* @__PURE__ */ jsxDEV("tr", { children: [
          /* @__PURE__ */ jsxDEV("td", { children: [
            /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-800", children: it.product_name }),
            it.slug && /* @__PURE__ */ jsxDEV("a", { href: `/san-pham/${it.slug}`, target: "_blank", class: "text-xs text-brand-600 hover:underline", children: "Xem s\u1EA3n ph\u1EA9m" })
          ] }),
          /* @__PURE__ */ jsxDEV("td", { class: "text-right font-bold whitespace-nowrap", children: formatVND(it.price) })
        ] })) }) })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-4", children: "Thao t\xE1c" }),
        /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap gap-2", children: [
          order.status === "pending" && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("button", { class: "btn-order-action h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition", "data-id": order.id, "data-status": "paid", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-check-circle mr-1.5" }),
              "X\xE1c nh\u1EADn \u0111\xE3 thanh to\xE1n"
            ] }),
            /* @__PURE__ */ jsxDEV("button", { class: "btn-order-action h-11 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm transition", "data-id": order.id, "data-status": "cancelled", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-ban mr-1.5" }),
              "Hu\u1EF7 \u0111\u01A1n"
            ] })
          ] }),
          order.status === "paid" && /* @__PURE__ */ jsxDEV("button", { class: "btn-order-action h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition", "data-id": order.id, "data-status": "refunded", children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-rotate-left mr-1.5" }),
            "Ho\xE0n ti\u1EC1n"
          ] }),
          order.status !== "pending" && order.status !== "paid" && /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-slate-500", children: "\u0110\u01A1n h\xE0ng \u0111\xE3 k\u1EBFt th\xFAc, kh\xF4ng c\xF3 thao t\xE1c kh\u1EA3 d\u1EE5ng." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("aside", { class: "space-y-5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-4", children: "Kh\xE1ch h\xE0ng" }),
        /* @__PURE__ */ jsxDEV("div", { class: "space-y-2.5 text-sm", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "H\u1ECD t\xEAn:" }),
            " ",
            /* @__PURE__ */ jsxDEV("b", { children: order.full_name })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "Email:" }),
            " ",
            /* @__PURE__ */ jsxDEV("b", { class: "break-all", children: order.email })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "S\u0110T:" }),
            " ",
            /* @__PURE__ */ jsxDEV("b", { children: order.phone || "\u2014" })
          ] }),
          /* @__PURE__ */ jsxDEV("a", { href: `/admin/thanh-vien/${order.user_id}`, class: "inline-block text-xs text-brand-600 hover:underline mt-1", children: "Xem h\u1ED3 s\u01A1 \u2192" })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 mb-4", children: "Thanh to\xE1n" }),
        /* @__PURE__ */ jsxDEV("div", { class: "space-y-2.5 text-sm", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "T\u1EA1m t\xEDnh" }),
            /* @__PURE__ */ jsxDEV("b", { children: formatVND(order.subtotal) })
          ] }),
          order.discount > 0 && /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: [
              "Gi\u1EA3m (",
              order.coupon_code,
              ")"
            ] }),
            /* @__PURE__ */ jsxDEV("b", { class: "text-emerald-600", children: [
              "-",
              formatVND(order.discount)
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between pt-2.5 border-t border-slate-100", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "font-bold", children: "T\u1ED5ng" }),
            /* @__PURE__ */ jsxDEV("b", { class: "text-lg text-rose-600", children: formatVND(order.total) })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between pt-2", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "Tr\u1EA1ng th\xE1i" }),
            /* @__PURE__ */ jsxDEV(StatusBadge, { status: order.status })
          ] }),
          order.paid_at && /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "text-slate-500", children: "Thanh to\xE1n l\xFAc" }),
            /* @__PURE__ */ jsxDEV("b", { class: "text-xs", children: formatDateTime(order.paid_at) })
          ] })
        ] }),
        order.note && /* @__PURE__ */ jsxDEV("div", { class: "mt-4 pt-4 border-t border-slate-100", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 mb-1", children: "Ghi ch\xFA" }),
          /* @__PURE__ */ jsxDEV("p", { class: "text-sm", children: order.note })
        ] })
      ] })
    ] })
  ] }) });
};
var AdminUsers = (props) => /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "users", heading: "Qu\u1EA3n l\xFD th\xE0nh vi\xEAn", children: [
  /* @__PURE__ */ jsxDEV("form", { action: "/admin/thanh-vien", method: "get", class: "mb-4 max-w-sm", children: /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        type: "text",
        name: "q",
        value: props.q,
        placeholder: "T\xECm theo t\xEAn ho\u1EB7c email...",
        class: "w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 focus:border-brand-400 outline-none text-sm"
      }
    ),
    /* @__PURE__ */ jsxDEV("i", { class: "fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" })
  ] }) }),
  /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
    /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Th\xE0nh vi\xEAn" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "S\u0110T" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "\u0110\u01A1n h\xE0ng" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "\u0110\xE3 chi" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "S\u1ED1 d\u01B0" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "Vai tr\xF2" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "Tr\u1EA1ng th\xE1i" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right" })
    ] }) }),
    /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: props.users.map((u) => /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white grid place-items-center text-xs font-bold shrink-0", children: u.full_name.charAt(0).toUpperCase() }),
        /* @__PURE__ */ jsxDEV("div", { class: "min-w-0", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900 truncate", children: u.full_name }),
          /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 truncate", children: u.email })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-slate-600", children: u.phone || "\u2014" }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-center font-semibold", children: u.order_count || 0 }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-right font-bold", children: formatVND(u.spent || 0) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-right text-emerald-600 font-semibold", children: formatVND(u.balance) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-center", children: /* @__PURE__ */ jsxDEV("span", { class: `px-2 py-0.5 rounded text-[11px] font-bold ${u.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`, children: u.role === "admin" ? "Admin" : "User" }) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-center", children: /* @__PURE__ */ jsxDEV(StatusBadge, { status: u.status }) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-right whitespace-nowrap", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: "btn-user-action inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-slate-100 text-slate-500",
            title: u.status === "active" ? "Kho\xE1" : "M\u1EDF kho\xE1",
            "data-id": u.id,
            "data-action": "toggle-status",
            children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${u.status === "active" ? "fa-lock" : "fa-lock-open"} text-xs` })
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: "btn-user-action inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-amber-50 text-amber-600",
            title: "\u0110\u1ED5i vai tr\xF2",
            "data-id": u.id,
            "data-action": "toggle-role",
            children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-user-shield text-xs" })
          }
        )
      ] })
    ] })) })
  ] }) }) }),
  /* @__PURE__ */ jsxDEV(Pagination, { page: props.page, totalPages: props.totalPages, baseUrl: "/admin/thanh-vien" })
] });
var AdminCategories = (props) => /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "categories", heading: "Qu\u1EA3n l\xFD danh m\u1EE5c", children: /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[1fr_340px] gap-5", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
    /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Danh m\u1EE5c" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Slug" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "SP" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right" })
    ] }) }),
    /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: props.categories.map((c) => /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("div", { class: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "w-8 h-8 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0", children: /* @__PURE__ */ jsxDEV("i", { class: `fas ${c.icon} text-xs` }) }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900", children: c.name }),
          /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 line-clamp-1 max-w-xs", children: c.description })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-slate-500 font-mono text-xs", children: c.slug }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-center font-semibold", children: c.product_count || 0 }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-right", children: /* @__PURE__ */ jsxDEV(
        "button",
        {
          class: "btn-delete inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-rose-50 text-rose-500",
          "data-url": `/api/admin/categories/${c.id}`,
          "data-name": c.name,
          children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-trash-can text-xs" })
        }
      ) })
    ] })) })
  ] }) }),
  /* @__PURE__ */ jsxDEV("form", { action: "/api/admin/categories", method: "post", "data-ajax": true, "data-reload": "true", class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4 self-start", children: [
    /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "Th\xEAm danh m\u1EE5c" }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "T\xEAn *" }),
      /* @__PURE__ */ jsxDEV("input", { type: "text", name: "name", required: true, class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Slug *" }),
      /* @__PURE__ */ jsxDEV("input", { type: "text", name: "slug", required: true, placeholder: "ten-danh-muc", class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "M\xF4 t\u1EA3" }),
      /* @__PURE__ */ jsxDEV("textarea", { name: "description", rows: 3, class: "w-full p-3 rounded-xl border border-slate-200 focus:border-brand-400 outline-none text-sm" })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Icon (FontAwesome)" }),
      /* @__PURE__ */ jsxDEV("input", { type: "text", name: "icon", value: "fa-cube", class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700" }),
    /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition", children: "Th\xEAm danh m\u1EE5c" })
  ] })
] }) });
var AdminCoupons = (props) => /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "coupons", heading: "M\xE3 gi\u1EA3m gi\xE1", children: /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[1fr_340px] gap-5", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
    /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "M\xE3" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Gi\u1EA3m" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "\u0110\u01A1n t\u1ED1i thi\u1EC3u" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "\u0110\xE3 d\xF9ng" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "H\u1EBFt h\u1EA1n" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right" })
    ] }) }),
    /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: props.coupons.map((c) => /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("td", { children: /* @__PURE__ */ jsxDEV("code", { class: "px-2 py-1 rounded bg-brand-50 text-brand-700 font-bold text-xs", children: c.code }) }),
      /* @__PURE__ */ jsxDEV("td", { class: "font-semibold", children: c.type === "percent" ? c.value + "%" : formatVND(c.value) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-right text-slate-600", children: formatVND(c.min_order) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-center", children: [
        c.used_count,
        c.max_uses > 0 ? ` / ${c.max_uses}` : ""
      ] }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-slate-500 text-xs", children: formatDate(c.expires_at) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-right", children: /* @__PURE__ */ jsxDEV(
        "button",
        {
          class: "btn-delete inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-rose-50 text-rose-500",
          "data-url": `/api/admin/coupons/${c.id}`,
          "data-name": c.code,
          children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-trash-can text-xs" })
        }
      ) })
    ] })) })
  ] }) }) }),
  /* @__PURE__ */ jsxDEV("form", { action: "/api/admin/coupons", method: "post", "data-ajax": true, "data-reload": "true", class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4 self-start", children: [
    /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "T\u1EA1o m\xE3 m\u1EDBi" }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "M\xE3 *" }),
      /* @__PURE__ */ jsxDEV("input", { type: "text", name: "code", required: true, style: "text-transform:uppercase", class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Lo\u1EA1i gi\u1EA3m" }),
      /* @__PURE__ */ jsxDEV("select", { name: "type", class: fieldCls, children: [
        /* @__PURE__ */ jsxDEV("option", { value: "percent", children: "Ph\u1EA7n tr\u0103m (%)" }),
        /* @__PURE__ */ jsxDEV("option", { value: "fixed", children: "S\u1ED1 ti\u1EC1n c\u1ED1 \u0111\u1ECBnh" })
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Gi\xE1 tr\u1ECB *" }),
      /* @__PURE__ */ jsxDEV("input", { type: "number", name: "value", required: true, min: "1", class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "\u0110\u01A1n t\u1ED1i thi\u1EC3u" }),
      /* @__PURE__ */ jsxDEV("input", { type: "number", name: "min_order", value: "0", min: "0", step: "10000", class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "S\u1ED1 l\u1EA7n d\xF9ng t\u1ED1i \u0111a (0 = \u221E)" }),
      /* @__PURE__ */ jsxDEV("input", { type: "number", name: "max_uses", value: "0", min: "0", class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Ng\xE0y h\u1EBFt h\u1EA1n" }),
      /* @__PURE__ */ jsxDEV("input", { type: "date", name: "expires_at", class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700" }),
    /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition", children: "T\u1EA1o m\xE3 gi\u1EA3m gi\xE1" })
  ] })
] }) });
var AdminPosts = (props) => /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "posts", heading: "Qu\u1EA3n l\xFD b\xE0i vi\u1EBFt", children: /* @__PURE__ */ jsxDEV("div", { class: "grid lg:grid-cols-[1fr_400px] gap-5", children: [
  /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
    /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Ti\xEAu \u0111\u1EC1" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "L\u01B0\u1EE3t xem" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Ng\xE0y" }),
      /* @__PURE__ */ jsxDEV("th", { class: "text-right" })
    ] }) }),
    /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: props.posts.map((p) => /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("td", { children: [
        /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900 line-clamp-1 max-w-sm", children: p.title }),
        /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 font-mono", children: p.slug })
      ] }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-center", children: p.view_count }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-slate-500 text-xs whitespace-nowrap", children: formatDate(p.created_at) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-right whitespace-nowrap", children: [
        /* @__PURE__ */ jsxDEV("a", { href: `/blog/${p.slug}`, target: "_blank", class: "inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-slate-100 text-slate-500", children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-eye text-xs" }) }),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            class: "btn-delete inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-rose-50 text-rose-500",
            "data-url": `/api/admin/posts/${p.id}`,
            "data-name": p.title,
            children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-trash-can text-xs" })
          }
        )
      ] })
    ] })) })
  ] }) }),
  /* @__PURE__ */ jsxDEV("form", { action: "/api/admin/posts", method: "post", "data-ajax": true, "data-reload": "true", class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4 self-start", children: [
    /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "Vi\u1EBFt b\xE0i m\u1EDBi" }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Ti\xEAu \u0111\u1EC1 *" }),
      /* @__PURE__ */ jsxDEV("input", { type: "text", name: "title", required: true, class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Slug *" }),
      /* @__PURE__ */ jsxDEV("input", { type: "text", name: "slug", required: true, class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "M\xF4 t\u1EA3 ng\u1EAFn" }),
      /* @__PURE__ */ jsxDEV("textarea", { name: "excerpt", rows: 2, class: "w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm" })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "N\u1ED9i dung (HTML)" }),
      /* @__PURE__ */ jsxDEV("textarea", { name: "content", rows: 10, class: "w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-brand-400 text-sm font-mono" })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Tags (ph\xE2n c\xE1ch d\u1EA5u ph\u1EA9y)" }),
      /* @__PURE__ */ jsxDEV("input", { type: "text", name: "tags", placeholder: "veo3,huong-dan", class: fieldCls })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700" }),
    /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition", children: "\u0110\u0103ng b\xE0i" })
  ] })
] }) });
var AdminReviews = (props) => /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "reviews", heading: "Qu\u1EA3n l\xFD \u0111\xE1nh gi\xE1", children: /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
  /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
    /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Ng\u01B0\u1EDDi \u0111\xE1nh gi\xE1" }),
    /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "S\u1EA3n ph\u1EA9m" }),
    /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "Sao" }),
    /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "N\u1ED9i dung" }),
    /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Ng\xE0y" }),
    /* @__PURE__ */ jsxDEV("th", { class: "text-right" })
  ] }) }),
  /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: [
    props.reviews.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colspan: 6, class: "text-center py-12 text-slate-500", children: "Ch\u01B0a c\xF3 \u0111\xE1nh gi\xE1 n\xE0o" }) }),
    props.reviews.map((r) => /* @__PURE__ */ jsxDEV("tr", { children: [
      /* @__PURE__ */ jsxDEV("td", { children: [
        /* @__PURE__ */ jsxDEV("div", { class: "font-semibold text-slate-900", children: r.full_name }),
        /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500", children: r.email })
      ] }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-slate-600 max-w-[180px]", children: /* @__PURE__ */ jsxDEV("div", { class: "line-clamp-1", children: r.product_name }) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-center", children: /* @__PURE__ */ jsxDEV("span", { class: "text-amber-500 font-bold", children: [
        r.rating,
        "\u2605"
      ] }) }),
      /* @__PURE__ */ jsxDEV("td", { class: "max-w-xs", children: /* @__PURE__ */ jsxDEV("div", { class: "line-clamp-2 text-slate-600", children: r.comment }) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-slate-500 text-xs whitespace-nowrap", children: formatDate(r.created_at) }),
      /* @__PURE__ */ jsxDEV("td", { class: "text-right", children: /* @__PURE__ */ jsxDEV(
        "button",
        {
          class: "btn-delete inline-grid w-8 h-8 place-items-center rounded-lg hover:bg-rose-50 text-rose-500",
          "data-url": `/api/admin/reviews/${r.id}`,
          "data-name": "\u0111\xE1nh gi\xE1 n\xE0y",
          children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-trash-can text-xs" })
        }
      ) })
    ] }))
  ] })
] }) }) }) });
var AdminTickets = (props) => /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "tickets", heading: "Y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3", children: /* @__PURE__ */ jsxDEV("div", { class: "space-y-3", children: [
  props.tickets.length === 0 && /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200", children: /* @__PURE__ */ jsxDEV(EmptyState, { icon: "fa-headset", title: "Ch\u01B0a c\xF3 y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3 n\xE0o" }) }),
  props.tickets.map((t) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap items-start gap-3 mb-3", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: t.subject }),
        /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-500 mt-1", children: [
          /* @__PURE__ */ jsxDEV("b", { children: t.name }),
          " \xB7 ",
          t.email,
          " \xB7 ",
          formatDateTime(t.created_at)
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV(StatusBadge, { status: t.status })
    ] }),
    /* @__PURE__ */ jsxDEV("p", { class: "text-sm text-slate-600 leading-relaxed p-3.5 rounded-xl bg-slate-50 border border-slate-100", children: t.message }),
    /* @__PURE__ */ jsxDEV("div", { class: "mt-3 flex gap-2", children: [
      /* @__PURE__ */ jsxDEV(
        "a",
        {
          href: `mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject)}`,
          class: "h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition",
          children: [
            /* @__PURE__ */ jsxDEV("i", { class: "fas fa-reply" }),
            "Tr\u1EA3 l\u1EDDi email"
          ]
        }
      ),
      t.status === "open" && /* @__PURE__ */ jsxDEV("button", { class: "btn-ticket-close h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition", "data-id": t.id, children: [
        /* @__PURE__ */ jsxDEV("i", { class: "fas fa-check" }),
        "\u0110\xE1nh d\u1EA5u \u0111\xE3 x\u1EED l\xFD"
      ] })
    ] })
  ] }))
] }) });
var AdminSettings = (props) => {
  const s = props.settings;
  return /* @__PURE__ */ jsxDEV(AdminShell, { ...props, activeKey: "settings", heading: "C\xE0i \u0111\u1EB7t h\u1EC7 th\u1ED1ng", children: /* @__PURE__ */ jsxDEV("form", { action: "/api/admin/settings", method: "post", "data-ajax": true, class: "grid lg:grid-cols-2 gap-5", children: [
    /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4", children: [
      /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "Th\xF4ng tin website" }),
      [
        ["site_name", "T\xEAn website"],
        ["site_tagline", "Slogan"],
        ["hotline", "Hotline"],
        ["email", "Email h\u1ED7 tr\u1EE3"],
        ["zalo", "S\u1ED1 Zalo"],
        ["facebook", "Link Facebook"]
      ].map(([k, l]) => /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: l }),
        /* @__PURE__ */ jsxDEV("input", { type: "text", name: k, value: s[k] || "", class: fieldCls })
      ] }))
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "space-y-5", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "Th\xF4ng tin thanh to\xE1n" }),
        [
          ["bank_name", "T\xEAn ng\xE2n h\xE0ng"],
          ["bank_code", "M\xE3 bank (VietQR: MB, VCB, TCB...)"],
          ["bank_account", "S\u1ED1 t\xE0i kho\u1EA3n"],
          ["bank_owner", "Ch\u1EE7 t\xE0i kho\u1EA3n (IN HOA, kh\xF4ng d\u1EA5u)"]
        ].map(([k, l]) => /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: l }),
          /* @__PURE__ */ jsxDEV("input", { type: "text", name: k, value: s[k] || "", class: fieldCls })
        ] }))
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900", children: "Affiliate" }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Ph\u1EA7n tr\u0103m hoa h\u1ED3ng (%)" }),
          /* @__PURE__ */ jsxDEV("input", { type: "number", name: "affiliate_percent", value: s.affiliate_percent || "20", min: "0", max: "100", class: fieldCls })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5 space-y-4", children: [
        /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-bolt text-amber-500" }),
          "Webhook ng\xE2n h\xE0ng"
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Nh\xE0 cung c\u1EA5p" }),
          /* @__PURE__ */ jsxDEV("select", { name: "payment_provider", class: fieldCls, children: [["sepay", "SePay (sepay.vn)"], ["casso", "Casso (casso.vn)"], ["manual", "Th\u1EE7 c\xF4ng (kh\xF4ng webhook)"]].map(([v, l]) => /* @__PURE__ */ jsxDEV("option", { value: v, selected: (s.payment_provider || "sepay") === v, children: l })) })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Th\u1EDDi gian gi\u1EEF \u0111\u01A1n (ph\xFAt)" }),
          /* @__PURE__ */ jsxDEV("input", { type: "number", name: "payment_timeout_minutes", value: s.payment_timeout_minutes || "60", min: "5", class: fieldCls })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Sai s\u1ED1 cho ph\xE9p (VND)" }),
          /* @__PURE__ */ jsxDEV("input", { type: "number", name: "amount_tolerance", value: s.amount_tolerance || "0", min: "0", class: fieldCls }),
          /* @__PURE__ */ jsxDEV("p", { class: "text-[11px] text-slate-500 mt-1", children: "\u0110\u1EB7t 0 n\u1EBFu mu\u1ED1n kh\u1EDBp s\u1ED1 ti\u1EC1n tuy\u1EC7t \u0111\u1ED1i." })
        ] }),
        /* @__PURE__ */ jsxDEV("label", { class: "flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer", children: [
          /* @__PURE__ */ jsxDEV("input", { type: "checkbox", name: "auto_confirm_manual", value: "1", checked: s.auto_confirm_manual === "1", class: "mt-0.5" }),
          /* @__PURE__ */ jsxDEV("span", { class: "text-xs text-amber-800 leading-relaxed", children: [
            /* @__PURE__ */ jsxDEV("b", { children: "B\u1EADt ch\u1EBF \u0111\u1ED9 DEMO" }),
            " \u2014 cho kh\xE1ch t\u1EF1 x\xE1c nh\u1EADn \u0111\xE3 chuy\u1EC3n kho\u1EA3n m\xE0 kh\xF4ng c\u1EA7n webhook.",
            /* @__PURE__ */ jsxDEV("b", { class: "text-rose-700", children: " T\u1EAFt khi ch\u1EA1y th\u1EADt" }),
            ", n\u1EBFu kh\xF4ng kh\xE1ch c\xF3 th\u1EC3 nh\u1EADn h\xE0ng m\xE0 ch\u01B0a tr\u1EA3 ti\u1EC1n."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-5", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "form-error hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 mb-3" }),
        /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition", children: [
          /* @__PURE__ */ jsxDEV("i", { class: "fas fa-floppy-disk mr-1.5" }),
          "L\u01B0u c\xE0i \u0111\u1EB7t"
        ] })
      ] })
    ] })
  ] }) });
};
var TX_STATUS = {
  matched: { label: "\u0110\xE3 kh\u1EDBp", cls: "bg-emerald-100 text-emerald-700", icon: "fa-circle-check" },
  unmatched: { label: "Ch\u01B0a kh\u1EDBp", cls: "bg-amber-100 text-amber-700", icon: "fa-circle-question" },
  amount_mismatch: { label: "L\u1EC7ch ti\u1EC1n", cls: "bg-rose-100 text-rose-700", icon: "fa-triangle-exclamation" },
  duplicate: { label: "Tr\xF9ng l\u1EB7p", cls: "bg-violet-100 text-violet-700", icon: "fa-clone" },
  ignored: { label: "B\u1ECF qua", cls: "bg-slate-100 text-slate-500", icon: "fa-ban" }
};
var AdminBankTx = (props) => {
  const s = props.settings;
  const webhookUrl = `${props.origin}/api/webhook/bank`;
  const provider = s.payment_provider || "sepay";
  const keyReady = s.webhook_api_key && s.webhook_api_key !== "CHANGE_ME_SECRET";
  return /* @__PURE__ */ jsxDEV(
    AdminShell,
    {
      ...props,
      activeKey: "banktx",
      heading: "Giao d\u1ECBch ng\xE2n h\xE0ng",
      sub: "T\u1EF1 \u0111\u1ED9ng \u0111\u1ED1i so\xE1t chuy\u1EC3n kho\u1EA3n v\xE0 c\u1EA5p quy\u1EC1n t\u1EA3i source code",
      children: [
        /* @__PURE__ */ jsxDEV("section", { id: "webhook-config", class: "bg-white rounded-2xl border border-slate-200 p-5 mb-5", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "flex items-start justify-between gap-4 flex-wrap mb-4", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("h3", { class: "font-bold text-slate-900 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-plug text-brand-600" }),
                "C\u1EA5u h\xECnh Webhook"
              ] }),
              /* @__PURE__ */ jsxDEV("p", { class: "text-xs text-slate-500 mt-1", children: [
                "D\xE1n 2 th\xF4ng tin d\u01B0\u1EDBi \u0111\xE2y v\xE0o dashboard ",
                provider === "casso" ? "Casso" : "SePay",
                " \u2192 m\u1EE5c Webhook / T\xEDch h\u1EE3p."
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("span", { class: `h-7 px-3 inline-flex items-center gap-1.5 rounded-full text-xs font-bold ${keyReady ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`, children: [
              /* @__PURE__ */ jsxDEV("i", { class: `fas ${keyReady ? "fa-circle-check" : "fa-circle-exclamation"}` }),
              keyReady ? "\u0110\xE3 c\u1EA5u h\xECnh" : "Ch\u01B0a \u0111\u1EB7t API key"
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "grid md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "Webhook URL" }),
              /* @__PURE__ */ jsxDEV("div", { class: "flex gap-2", children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "text",
                    readonly: true,
                    value: webhookUrl,
                    class: "flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-700 outline-none"
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    "data-copy": webhookUrl,
                    title: "Copy",
                    class: "w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition",
                    children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-copy" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { class: labelCls, children: "API Key (Authorization: Apikey ...)" }),
              /* @__PURE__ */ jsxDEV("div", { class: "flex gap-2", children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "text",
                    id: "webhook-key",
                    readonly: true,
                    value: s.webhook_api_key || "",
                    class: "flex-1 h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-700 outline-none"
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    "data-copy": s.webhook_api_key || "",
                    title: "Copy",
                    class: "w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition",
                    children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-copy" })
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    id: "btn-regen-key",
                    title: "T\u1EA1o key m\u1EDBi",
                    class: "w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 transition",
                    children: /* @__PURE__ */ jsxDEV("i", { class: "fas fa-rotate" })
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("details", { class: "mt-4 rounded-xl bg-slate-50 border border-slate-200", children: [
            /* @__PURE__ */ jsxDEV("summary", { class: "px-4 py-3 cursor-pointer text-sm font-semibold text-slate-700", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-circle-info mr-1.5 text-brand-600" }),
              "H\u01B0\u1EDBng d\u1EABn chi ti\u1EBFt t\u1EEBng b\u01B0\u1EDBc"
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "px-4 pb-4 text-sm text-slate-600 leading-relaxed space-y-3", children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("b", { class: "text-slate-900", children: "B\u01B0\u1EDBc 1 \u2014 Li\xEAn k\u1EBFt ng\xE2n h\xE0ng" }),
                /* @__PURE__ */ jsxDEV("p", { children: [
                  "\u0110\u0103ng k\xFD t\u1EA1i ",
                  /* @__PURE__ */ jsxDEV("b", { children: provider === "casso" ? "casso.vn" : "sepay.vn" }),
                  ", th\xEAm t\xE0i kho\u1EA3n ng\xE2n h\xE0ng",
                  /* @__PURE__ */ jsxDEV("b", { class: "font-mono", children: [
                    " ",
                    s.bank_account || "(ch\u01B0a \u0111\u1EB7t)",
                    " "
                  ] }),
                  "(",
                  s.bank_name || "\u2014",
                  ") v\xE0 ch\u1EDD li\xEAn k\u1EBFt th\xE0nh c\xF4ng."
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("b", { class: "text-slate-900", children: "B\u01B0\u1EDBc 2 \u2014 T\u1EA1o Webhook" }),
                /* @__PURE__ */ jsxDEV("p", { children: [
                  "V\xE0o m\u1EE5c ",
                  /* @__PURE__ */ jsxDEV("i", { children: "Webhooks" }),
                  " \u2192 ",
                  /* @__PURE__ */ jsxDEV("i", { children: "Th\xEAm webhook" }),
                  ". D\xE1n ",
                  /* @__PURE__ */ jsxDEV("b", { children: "Webhook URL" }),
                  " \u1EDF tr\xEAn. Ch\u1ECDn ki\u1EC3u x\xE1c th\u1EF1c ",
                  /* @__PURE__ */ jsxDEV("b", { children: "API Key" }),
                  " v\xE0 d\xE1n ",
                  /* @__PURE__ */ jsxDEV("b", { children: "API Key" }),
                  " \u1EDF tr\xEAn. Ch\u1ECDn s\u1EF1 ki\u1EC7n ",
                  /* @__PURE__ */ jsxDEV("b", { children: "ti\u1EC1n v\xE0o (money in)" }),
                  "."
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("b", { class: "text-slate-900", children: "B\u01B0\u1EDBc 3 \u2014 T\u1EAFt ch\u1EBF \u0111\u1ED9 demo" }),
                /* @__PURE__ */ jsxDEV("p", { children: [
                  "V\xE0o ",
                  /* @__PURE__ */ jsxDEV("a", { href: "/admin/cai-dat", class: "text-brand-600 font-semibold hover:underline", children: "C\xE0i \u0111\u1EB7t" }),
                  " \u2192 b\u1ECF tick ",
                  /* @__PURE__ */ jsxDEV("i", { children: '"B\u1EADt ch\u1EBF \u0111\u1ED9 DEMO"' }),
                  " \u0111\u1EC3 bu\u1ED9c m\u1ECDi \u0111\u01A1n ph\u1EA3i c\xF3 giao d\u1ECBch th\u1EADt m\u1EDBi \u0111\u01B0\u1EE3c c\u1EA5p h\xE0ng."
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("b", { class: "text-slate-900", children: "B\u01B0\u1EDBc 4 \u2014 Ki\u1EC3m th\u1EED" }),
                /* @__PURE__ */ jsxDEV("p", { children: [
                  "T\u1EA1o 1 \u0111\u01A1n h\xE0ng, chuy\u1EC3n kho\u1EA3n \u0111\xFAng s\u1ED1 ti\u1EC1n v\u1EDBi n\u1ED9i dung l\xE0 ",
                  /* @__PURE__ */ jsxDEV("b", { children: "m\xE3 \u0111\u01A1n" }),
                  " (VD: ",
                  /* @__PURE__ */ jsxDEV("span", { class: "font-mono", children: "DHAB12CD34" }),
                  "). Giao d\u1ECBch s\u1EBD hi\u1EC7n trong b\u1EA3ng d\u01B0\u1EDBi v\u1EDBi tr\u1EA1ng th\xE1i ",
                  /* @__PURE__ */ jsxDEV("b", { class: "text-emerald-700", children: "\u0110\xE3 kh\u1EDBp" }),
                  " v\xE0 kh\xE1ch nh\u1EADn \u0111\u01B0\u1EE3c link t\u1EA3i ngay."
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("p", { class: "p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800", children: [
                /* @__PURE__ */ jsxDEV("i", { class: "fas fa-lightbulb mr-1" }),
                /* @__PURE__ */ jsxDEV("b", { children: "L\u01B0u \xFD:" }),
                " h\u1EC7 th\u1ED1ng t\xE1ch m\xE3 \u0111\u01A1n b\u1EB1ng regex ",
                /* @__PURE__ */ jsxDEV("span", { class: "font-mono", children: "DH + 8 k\xFD t\u1EF1" }),
                ", t\u1EF1 b\u1ECF d\u1EA5u c\xE1ch v\xE0 k\xFD t\u1EF1 l\u1EA1 n\xEAn v\u1EABn kh\u1EDBp khi ng\xE2n h\xE0ng ch\xE8n th\xEAm text. N\u1EBFu kh\xE1ch chuy\u1EC3n th\u1EEBa ti\u1EC1n, ph\u1EA7n th\u1EEBa \u0111\u01B0\u1EE3c c\u1ED9ng v\xE0o v\xED c\u1EE7a kh\xE1ch."
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5", children: [
          ["T\u1ED5ng giao d\u1ECBch", props.stats?.total || 0, "fa-list", "text-slate-600"],
          ["\u0110\xE3 kh\u1EDBp", props.stats?.matched || 0, "fa-circle-check", "text-emerald-600"],
          ["Ch\u01B0a kh\u1EDBp", props.stats?.unmatched || 0, "fa-circle-question", "text-amber-600"],
          ["L\u1EC7ch ti\u1EC1n", props.stats?.mismatch || 0, "fa-triangle-exclamation", "text-rose-600"],
          ["Doanh thu kh\u1EDBp", formatVND(props.stats?.revenue || 0), "fa-sack-dollar", "text-brand-600"]
        ].map(([label, val, icon, cls]) => /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 p-4", children: [
          /* @__PURE__ */ jsxDEV("div", { class: `text-xs font-medium text-slate-500 flex items-center gap-1.5`, children: [
            /* @__PURE__ */ jsxDEV("i", { class: `fas ${icon} ${cls}` }),
            label
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: `text-xl font-extrabold mt-1.5 ${cls}`, children: val })
        ] })) }),
        /* @__PURE__ */ jsxDEV("div", { class: "flex flex-wrap gap-2 mb-4", children: [
          [["", "T\u1EA5t c\u1EA3"], ["matched", "\u0110\xE3 kh\u1EDBp"], ["unmatched", "Ch\u01B0a kh\u1EDBp"], ["amount_mismatch", "L\u1EC7ch ti\u1EC1n"], ["duplicate", "Tr\xF9ng l\u1EB7p"], ["ignored", "B\u1ECF qua"]].map(([v, l]) => /* @__PURE__ */ jsxDEV(
            "a",
            {
              href: `/admin/giao-dich${v ? "?status=" + v : ""}`,
              class: `h-9 px-4 inline-flex items-center rounded-xl text-sm font-semibold transition ${props.status === v ? "bg-brand-600 text-white" : "bg-white border border-slate-200 hover:border-brand-400"}`,
              children: l
            }
          )),
          /* @__PURE__ */ jsxDEV("form", { action: "/admin/giao-dich", method: "get", class: "ml-auto", children: [
            props.status && /* @__PURE__ */ jsxDEV("input", { type: "hidden", name: "status", value: props.status }),
            /* @__PURE__ */ jsxDEV("div", { class: "relative", children: [
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  name: "q",
                  value: props.q,
                  placeholder: "N\u1ED9i dung / m\xE3 \u0111\u01A1n...",
                  class: "w-56 h-9 pl-8 pr-3 rounded-xl bg-white border border-slate-200 focus:border-brand-400 outline-none text-sm"
                }
              ),
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "bg-white rounded-2xl border border-slate-200 overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { class: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { class: "w-full admin-table text-sm", children: [
          /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Th\u1EDDi gian" }),
            /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "N\u1ED9i dung CK" }),
            /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "Bank" }),
            /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "Ti\u1EC1n v\xE0o" }),
            /* @__PURE__ */ jsxDEV("th", { class: "text-left", children: "\u0110\u01A1n h\xE0ng" }),
            /* @__PURE__ */ jsxDEV("th", { class: "text-center", children: "Tr\u1EA1ng th\xE1i" }),
            /* @__PURE__ */ jsxDEV("th", { class: "text-right", children: "Thao t\xE1c" })
          ] }) }),
          /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-100", children: [
            props.txs.length === 0 && /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colspan: 7, class: "text-center py-12 text-slate-500", children: [
              /* @__PURE__ */ jsxDEV("i", { class: "fas fa-inbox text-2xl block mb-2 text-slate-300" }),
              "Ch\u01B0a c\xF3 giao d\u1ECBch n\xE0o. H\xE3y c\u1EA5u h\xECnh webhook \u1EDF tr\xEAn."
            ] }) }),
            props.txs.map((t) => {
              const st = TX_STATUS[t.match_status] || TX_STATUS.ignored;
              return /* @__PURE__ */ jsxDEV("tr", { children: [
                /* @__PURE__ */ jsxDEV("td", { class: "text-xs text-slate-500 whitespace-nowrap", children: formatDateTime(t.transaction_date) }),
                /* @__PURE__ */ jsxDEV("td", { class: "max-w-[260px]", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "text-xs text-slate-700 font-mono break-words", children: t.content || "\u2014" }),
                  t.note && /* @__PURE__ */ jsxDEV("div", { class: "text-[11px] text-slate-400 mt-0.5", children: t.note })
                ] }),
                /* @__PURE__ */ jsxDEV("td", { class: "text-xs text-slate-600 whitespace-nowrap", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "font-medium", children: t.gateway || "\u2014" }),
                  /* @__PURE__ */ jsxDEV("div", { class: "text-slate-400", children: t.provider })
                ] }),
                /* @__PURE__ */ jsxDEV("td", { class: "text-right font-bold text-emerald-600 whitespace-nowrap", children: formatVND(t.amount_in) }),
                /* @__PURE__ */ jsxDEV("td", { children: t.matched_order_code ? /* @__PURE__ */ jsxDEV("span", { class: "font-mono text-xs font-bold text-brand-600", children: t.matched_order_code }) : /* @__PURE__ */ jsxDEV("span", { class: "text-xs text-slate-400", children: "\u2014" }) }),
                /* @__PURE__ */ jsxDEV("td", { class: "text-center", children: /* @__PURE__ */ jsxDEV("span", { class: `h-6 px-2.5 inline-flex items-center gap-1 rounded-full text-[11px] font-bold whitespace-nowrap ${st.cls}`, children: [
                  /* @__PURE__ */ jsxDEV("i", { class: `fas ${st.icon}` }),
                  st.label
                ] }) }),
                /* @__PURE__ */ jsxDEV("td", { class: "text-right whitespace-nowrap", children: ["unmatched", "amount_mismatch"].includes(t.match_status) && /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    class: "btn-tx-match h-8 px-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition",
                    "data-id": t.id,
                    "data-amount": t.amount_in,
                    title: "G\xE1n th\u1EE7 c\xF4ng cho \u0111\u01A1n h\xE0ng",
                    children: [
                      /* @__PURE__ */ jsxDEV("i", { class: "fas fa-link mr-1" }),
                      "G\xE1n \u0111\u01A1n"
                    ]
                  }
                ) })
              ] });
            })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsxDEV(Pagination, { page: props.page, totalPages: props.totalPages, baseUrl: "/admin/giao-dich?status=" + props.status })
      ]
    }
  );
};

// src/lib/docs.ts
var POLICY_DOCS = {
  "/huong-dan": {
    heading: "H\u01B0\u1EDBng d\u1EABn mua h\xE0ng",
    html: `
<h2>Quy tr\xECnh mua h\xE0ng 4 b\u01B0\u1EDBc</h2>
<p><b>B\u01B0\u1EDBc 1 \u2014 \u0110\u0103ng k\xFD t\xE0i kho\u1EA3n.</b> Truy c\u1EADp trang <a href="/dang-ky">\u0110\u0103ng k\xFD</a>, \u0111i\u1EC1n h\u1ECD t\xEAn, email v\xE0 m\u1EADt kh\u1EA9u. Qu\xE1 tr\xECnh ch\u1EC9 m\u1EA5t kho\u1EA3ng 30 gi\xE2y.</p>
<p><b>B\u01B0\u1EDBc 2 \u2014 Ch\u1ECDn s\u1EA3n ph\u1EA9m.</b> Duy\u1EC7t qua <a href="/san-pham">danh s\xE1ch s\u1EA3n ph\u1EA9m</a>, xem video demo v\xE0 \u0111\u1ECDc m\xF4 t\u1EA3 chi ti\u1EBFt. B\u1EA5m "Th\xEAm v\xE0o gi\u1ECF" ho\u1EB7c "Mua ngay".</p>
<p><b>B\u01B0\u1EDBc 3 \u2014 Thanh to\xE1n.</b> T\u1EA1i trang thanh to\xE1n, ch\u1ECDn ph\u01B0\u01A1ng th\u1EE9c (VietQR / MoMo / s\u1ED1 d\u01B0 v\xED), nh\u1EADp m\xE3 gi\u1EA3m gi\xE1 n\u1EBFu c\xF3 r\u1ED3i b\u1EA5m "\u0110\u1EB7t h\xE0ng ngay".</p>
<p><b>B\u01B0\u1EDBc 4 \u2014 Nh\u1EADn s\u1EA3n ph\u1EA9m.</b> Qu\xE9t m\xE3 QR chuy\u1EC3n kho\u1EA3n theo \u0111\xFAng s\u1ED1 ti\u1EC1n v\xE0 n\u1ED9i dung hi\u1EC3n th\u1ECB. Sau khi x\xE1c nh\u1EADn, link t\u1EA3i s\u1EA3n ph\u1EA9m v\xE0 license key s\u1EBD xu\u1EA5t hi\u1EC7n trong m\u1EE5c <a href="/tai-khoan/san-pham">S\u1EA3n ph\u1EA9m c\u1EE7a t\xF4i</a>.</p>

<h2>L\u01B0u \xFD khi chuy\u1EC3n kho\u1EA3n</h2>
<ul>
<li>Chuy\u1EC3n <b>\u0111\xFAng s\u1ED1 ti\u1EC1n</b> hi\u1EC3n th\u1ECB tr\xEAn trang \u0111\u01A1n h\xE0ng</li>
<li>Ghi <b>\u0111\xFAng n\u1ED9i dung chuy\u1EC3n kho\u1EA3n</b> (m\xE3 \u0111\u01A1n h\xE0ng) \u0111\u1EC3 h\u1EC7 th\u1ED1ng t\u1EF1 \u0111\u1ED9ng \u0111\u1ED1i so\xE1t</li>
<li>N\u1EBFu sai n\u1ED9i dung, vui l\xF2ng li\xEAn h\u1EC7 Zalo h\u1ED7 tr\u1EE3 k\xE8m \u1EA3nh ch\u1EE5p giao d\u1ECBch</li>
</ul>

<h2>C\xE1ch nh\u1EADn s\u1EA3n ph\u1EA9m</h2>
<p>Tu\u1EF3 lo\u1EA1i s\u1EA3n ph\u1EA9m, b\u1EA1n s\u1EBD nh\u1EADn \u0111\u01B0\u1EE3c:</p>
<ul>
<li><b>Source code:</b> link Google Drive ch\u1EE9a file .zip m\xE3 ngu\u1ED3n + t\xE0i li\u1EC7u c\xE0i \u0111\u1EB7t</li>
<li><b>Chatbot:</b> link truy c\u1EADp chatbot GPT/Gemini ri\xEAng</li>
<li><b>B\u1ED9 prompt:</b> link Google Sheet ho\u1EB7c Google Doc ch\u1EE9a to\xE0n b\u1ED9 prompt</li>
<li><b>Combo:</b> t\u1EA5t c\u1EA3 s\u1EA3n ph\u1EA9m con \u0111\u01B0\u1EE3c k\xEDch ho\u1EA1t c\xF9ng l\xFAc</li>
</ul>

<h2>G\u1EB7p v\u1EA5n \u0111\u1EC1?</h2>
<p>Li\xEAn h\u1EC7 \u0111\u1ED9i ng\u0169 h\u1ED7 tr\u1EE3 qua <a href="/lien-he">trang li\xEAn h\u1EC7</a> ho\u1EB7c chat Zalo tr\u1EF1c ti\u1EBFp. Ch\xFAng t\xF4i ph\u1EA3n h\u1ED3i trong v\xF2ng 24 gi\u1EDD (th\u01B0\u1EDDng d\u01B0\u1EDBi 5 ph\xFAt trong gi\u1EDD l\xE0m vi\u1EC7c 8:00\u201322:00).</p>
`
  },
  "/chinh-sach": {
    heading: "Ch\xEDnh s\xE1ch b\u1EA3o h\xE0nh & ho\xE0n ti\u1EC1n",
    html: `
<h2>Ch\xEDnh s\xE1ch giao h\xE0ng</h2>
<p>To\xE0n b\u1ED9 s\u1EA3n ph\u1EA9m tr\xEAn WebSkill AI l\xE0 s\u1EA3n ph\u1EA9m s\u1ED1, \u0111\u01B0\u1EE3c giao <b>t\u1EF1 \u0111\u1ED9ng 100%</b>. Ngay khi \u0111\u01A1n h\xE0ng chuy\u1EC3n sang tr\u1EA1ng th\xE1i "\u0110\xE3 thanh to\xE1n", link truy c\u1EADp v\xE0 license key s\u1EBD hi\u1EC3n th\u1ECB trong t\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n. Kh\xF4ng c\u1EA7n ch\u1EDD admin duy\u1EC7t th\u1EE7 c\xF4ng.</p>

<h2>Ch\xEDnh s\xE1ch b\u1EA3o h\xE0nh</h2>
<ul>
<li>H\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt mi\u1EC5n ph\xED <b>6\u201312 th\xE1ng</b> tu\u1EF3 t\u1EEBng s\u1EA3n ph\u1EA9m</li>
<li>Nh\u1EADn b\u1EA3n c\u1EADp nh\u1EADt mi\u1EC5n ph\xED <b>tr\u1ECDn \u0111\u1EDDi</b></li>
<li>H\u1ED7 tr\u1EE3 c\xE0i \u0111\u1EB7t qua Zalo ho\u1EB7c Ultraview khi b\u1EA1n g\u1EB7p kh\xF3 kh\u0103n</li>
<li>V\u1EDBi g\xF3i Combo All-In-One: t\u1EB7ng th\xEAm 2 bu\u1ED5i setup 1-1 tr\u1EF1c ti\u1EBFp</li>
</ul>

<h2>Ch\xEDnh s\xE1ch ho\xE0n ti\u1EC1n</h2>
<p>Ch\xFAng t\xF4i ho\xE0n ti\u1EC1n <b>100%</b> trong v\xF2ng <b>7 ng\xE0y</b> k\u1EC3 t\u1EEB ng\xE0y mua n\u1EBFu:</p>
<ul>
<li>S\u1EA3n ph\u1EA9m kh\xF4ng \u0111\xFAng nh\u01B0 m\xF4 t\u1EA3 tr\xEAn website</li>
<li>Source code kh\xF4ng th\u1EC3 c\xE0i \u0111\u1EB7t \u0111\u01B0\u1EE3c do l\u1ED7i t\u1EEB ph\xEDa ch\xFAng t\xF4i</li>
<li>Link truy c\u1EADp b\u1ECB l\u1ED7i v\xE0 kh\xF4ng \u0111\u01B0\u1EE3c kh\u1EAFc ph\u1EE5c trong 48 gi\u1EDD</li>
</ul>
<p><b>Kh\xF4ng \xE1p d\u1EE5ng ho\xE0n ti\u1EC1n</b> trong c\xE1c tr\u01B0\u1EDDng h\u1EE3p: b\u1EA1n \u0111\u1ED5i \xFD sau khi \u0111\xE3 t\u1EA3i source code, thi\u1EBFt b\u1ECB/m\xF4i tr\u01B0\u1EDDng c\u1EE7a b\u1EA1n kh\xF4ng \u0111\xE1p \u1EE9ng y\xEAu c\u1EA7u t\u1ED1i thi\u1EC3u, ho\u1EB7c b\u1EA1n t\u1EF1 \xFD ch\u1EC9nh s\u1EEDa code g\xE2y l\u1ED7i.</p>

<h2>Ch\xEDnh s\xE1ch b\u1EA3o m\u1EADt</h2>
<ul>
<li>Ch\xFAng t\xF4i ch\u1EC9 thu th\u1EADp th\xF4ng tin c\u1EA7n thi\u1EBFt: h\u1ECD t\xEAn, email, s\u1ED1 \u0111i\u1EC7n tho\u1EA1i</li>
<li>M\u1EADt kh\u1EA9u \u0111\u01B0\u1EE3c m\xE3 ho\xE1 b\u1EB1ng thu\u1EADt to\xE1n PBKDF2-SHA256, ch\xFAng t\xF4i kh\xF4ng th\u1EC3 xem \u0111\u01B0\u1EE3c m\u1EADt kh\u1EA9u c\u1EE7a b\u1EA1n</li>
<li>Kh\xF4ng chia s\u1EBB, b\xE1n ho\u1EB7c trao \u0111\u1ED5i th\xF4ng tin kh\xE1ch h\xE0ng cho b\xEAn th\u1EE9 ba</li>
<li>B\u1EA1n c\xF3 th\u1EC3 y\xEAu c\u1EA7u xo\xE1 t\xE0i kho\u1EA3n v\xE0 d\u1EEF li\u1EC7u b\u1EA5t c\u1EE9 l\xFAc n\xE0o qua k\xEAnh h\u1ED7 tr\u1EE3</li>
</ul>
`
  },
  "/dieu-khoan": {
    heading: "\u0110i\u1EC1u kho\u1EA3n s\u1EED d\u1EE5ng",
    html: `
<h2>1. Ch\u1EA5p nh\u1EADn \u0111i\u1EC1u kho\u1EA3n</h2>
<p>Khi truy c\u1EADp v\xE0 s\u1EED d\u1EE5ng website WebSkill AI, b\u1EA1n \u0111\u1ED3ng \xFD tu\xE2n th\u1EE7 c\xE1c \u0111i\u1EC1u kho\u1EA3n d\u01B0\u1EDBi \u0111\xE2y. N\u1EBFu kh\xF4ng \u0111\u1ED3ng \xFD, vui l\xF2ng ng\u1EEBng s\u1EED d\u1EE5ng d\u1ECBch v\u1EE5.</p>

<h2>2. T\xE0i kho\u1EA3n ng\u01B0\u1EDDi d\xF9ng</h2>
<ul>
<li>B\u1EA1n ch\u1ECBu tr\xE1ch nhi\u1EC7m b\u1EA3o m\u1EADt th\xF4ng tin \u0111\u0103ng nh\u1EADp c\u1EE7a m\xECnh</li>
<li>Kh\xF4ng \u0111\u01B0\u1EE3c chia s\u1EBB t\xE0i kho\u1EA3n cho ng\u01B0\u1EDDi kh\xE1c s\u1EED d\u1EE5ng</li>
<li>Th\xF4ng b\xE1o ngay cho ch\xFAng t\xF4i n\u1EBFu ph\xE1t hi\u1EC7n t\xE0i kho\u1EA3n b\u1ECB truy c\u1EADp tr\xE1i ph\xE9p</li>
<li>Ch\xFAng t\xF4i c\xF3 quy\u1EC1n kho\xE1 t\xE0i kho\u1EA3n vi ph\u1EA1m m\xE0 kh\xF4ng c\u1EA7n b\xE1o tr\u01B0\u1EDBc</li>
</ul>

<h2>3. B\u1EA3n quy\u1EC1n s\u1EA3n ph\u1EA9m</h2>
<p>Khi mua s\u1EA3n ph\u1EA9m, b\u1EA1n <b>\u0111\u01B0\u1EE3c ph\xE9p</b>:</p>
<ul>
<li>S\u1EED d\u1EE5ng cho d\u1EF1 \xE1n c\xE1 nh\xE2n v\xE0 th\u01B0\u01A1ng m\u1EA1i kh\xF4ng gi\u1EDBi h\u1EA1n</li>
<li>Ch\u1EC9nh s\u1EEDa m\xE3 ngu\u1ED3n theo nhu c\u1EA7u ri\xEAng</li>
<li>C\xE0i \u0111\u1EB7t tr\xEAn kh\xF4ng gi\u1EDBi h\u1EA1n s\u1ED1 domain c\u1EE7a ch\xEDnh b\u1EA1n</li>
</ul>
<p>B\u1EA1n <b>kh\xF4ng \u0111\u01B0\u1EE3c ph\xE9p</b>:</p>
<ul>
<li>B\xE1n l\u1EA1i nguy\xEAn b\u1EA3n source code cho b\xEAn th\u1EE9 ba</li>
<li>Chia s\u1EBB c\xF4ng khai link t\u1EA3i ho\u1EB7c license key</li>
<li>\u0110\u0103ng t\u1EA3i source code l\xEAn c\xE1c di\u1EC5n \u0111\xE0n chia s\u1EBB mi\u1EC5n ph\xED</li>
<li>S\u1EED d\u1EE5ng th\u01B0\u01A1ng hi\u1EC7u WebSkill AI khi b\xE1n l\u1EA1i s\u1EA3n ph\u1EA9m \u0111\xE3 ch\u1EC9nh s\u1EEDa</li>
</ul>
<p>Vi ph\u1EA1m b\u1EA3n quy\u1EC1n s\u1EBD d\u1EABn \u0111\u1EBFn vi\u1EC7c <b>hu\u1EF7 license v\u0129nh vi\u1EC5n</b> m\xE0 kh\xF4ng ho\xE0n ti\u1EC1n.</p>

<h2>4. Gi\u1EDBi h\u1EA1n tr\xE1ch nhi\u1EC7m</h2>
<p>Ch\xFAng t\xF4i cung c\u1EA5p s\u1EA3n ph\u1EA9m "nguy\xEAn tr\u1EA1ng". WebSkill AI kh\xF4ng ch\u1ECBu tr\xE1ch nhi\u1EC7m cho c\xE1c thi\u1EC7t h\u1EA1i gi\xE1n ti\u1EBFp ph\xE1t sinh t\u1EEB vi\u1EC7c s\u1EED d\u1EE5ng s\u1EA3n ph\u1EA9m, bao g\u1ED3m nh\u01B0ng kh\xF4ng gi\u1EDBi h\u1EA1n \u1EDF m\u1EA5t d\u1EEF li\u1EC7u, m\u1EA5t doanh thu ho\u1EB7c gi\xE1n \u0111o\u1EA1n kinh doanh.</p>
<p>C\xE1c s\u1EA3n ph\u1EA9m ph\u1EE5 thu\u1ED9c v\xE0o API b\xEAn th\u1EE9 ba (Veo 3, ChatGPT, Kling...). Ch\xFAng t\xF4i kh\xF4ng ch\u1ECBu tr\xE1ch nhi\u1EC7m n\u1EBFu c\xE1c n\u1EC1n t\u1EA3ng n\xE0y thay \u0111\u1ED5i ch\xEDnh s\xE1ch, t\u0103ng gi\xE1 ho\u1EB7c ng\u1EEBng d\u1ECBch v\u1EE5, tuy nhi\xEAn s\u1EBD c\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m mi\u1EC5n ph\xED trong kh\u1EA3 n\u0103ng c\xF3 th\u1EC3.</p>

<h2>5. Ch\u01B0\u01A1ng tr\xECnh Affiliate</h2>
<ul>
<li>Hoa h\u1ED3ng \u0111\u01B0\u1EE3c t\xEDnh tr\xEAn gi\xE1 tr\u1ECB \u0111\u01A1n h\xE0ng th\u1EF1c thu sau gi\u1EA3m gi\xE1</li>
<li>Kh\xF4ng \xE1p d\u1EE5ng cho \u0111\u01A1n t\u1EF1 mua b\u1EB1ng m\xE3 c\u1EE7a ch\xEDnh m\xECnh</li>
<li>Nghi\xEAm c\u1EA5m spam ho\u1EB7c ch\u1EA1y qu\u1EA3ng c\xE1o tr\xEAn th\u01B0\u01A1ng hi\u1EC7u WebSkill AI</li>
<li>Ch\xFAng t\xF4i c\xF3 quy\u1EC1n thu h\u1ED3i hoa h\u1ED3ng n\u1EBFu ph\xE1t hi\u1EC7n gian l\u1EADn</li>
</ul>

<h2>6. Thay \u0111\u1ED5i \u0111i\u1EC1u kho\u1EA3n</h2>
<p>Ch\xFAng t\xF4i c\xF3 th\u1EC3 c\u1EADp nh\u1EADt \u0111i\u1EC1u kho\u1EA3n n\xE0y b\u1EA5t c\u1EE9 l\xFAc n\xE0o. Phi\xEAn b\u1EA3n m\u1EDBi nh\u1EA5t lu\xF4n \u0111\u01B0\u1EE3c \u0111\u0103ng t\u1EA1i trang n\xE0y.</p>
`
  }
};

// node_modules/pg/esm/index.mjs
var import_lib = __toESM(require_lib2(), 1);
var Client = import_lib.default.Client;
var Pool = import_lib.default.Pool;
var Connection = import_lib.default.Connection;
var types = import_lib.default.types;
var Query = import_lib.default.Query;
var DatabaseError = import_lib.default.DatabaseError;
var escapeIdentifier = import_lib.default.escapeIdentifier;
var escapeLiteral = import_lib.default.escapeLiteral;
var Result = import_lib.default.Result;
var TypeOverrides = import_lib.default.TypeOverrides;
var defaults = import_lib.default.defaults;

// src/lib/pg.ts
types.setTypeParser(types.builtins.TIMESTAMP, (v) => v);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) => v);
types.setTypeParser(types.builtins.DATE, (v) => v);
types.setTypeParser(types.builtins.INT8, (v) => parseInt(v, 10));
var _pool = null;
function pgConnectionString() {
  if (typeof process !== "undefined" && process.env) {
    return process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
  }
  return void 0;
}
function pool() {
  if (!_pool) {
    const cs = pgConnectionString();
    if (!cs) throw new Error("Missing POSTGRES_URL / DATABASE_URL env var");
    _pool = new Pool({ connectionString: cs, max: 5, ssl: { rejectUnauthorized: false } });
  }
  return _pool;
}
var _override = null;
function getExecutor() {
  if (_override) return _override;
  const p = pool();
  return (sql, params) => p.query(sql, params);
}
function rewritePlaceholders(sql) {
  let out = "";
  let n = 0;
  let quote = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (quote) {
      out += ch;
      if (ch === quote) {
        if (quote === "'" && sql[i + 1] === "'") {
          out += sql[i + 1];
          i++;
        } else quote = null;
      }
    } else if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      out += ch;
    } else if (ch === "?" && /[0-9]/.test(sql[i + 1] || "")) {
      let num = "";
      while (/[0-9]/.test(sql[i + 1] || "")) {
        num += sql[i + 1];
        i++;
      }
      out += "$" + num;
      if (parseInt(num, 10) > n) n = parseInt(num, 10);
    } else if (ch === "?") {
      n++;
      out += "$" + n;
    } else {
      out += ch;
    }
  }
  return out;
}
var PgStmt = class _PgStmt {
  constructor(sql, params = []) {
    this.sql = sql;
    this.params = params;
  }
  sql;
  params;
  bind(...params) {
    return new _PgStmt(this.sql, params);
  }
  async execQuery() {
    let s = rewritePlaceholders(this.sql);
    if (/^\s*insert\s/i.test(s) && !/\sreturning\s/i.test(s)) {
      s += " RETURNING id";
    }
    return getExecutor()(s, this.params);
  }
  async all() {
    const r = await this.execQuery();
    return { results: r.rows };
  }
  async first() {
    const r = await this.execQuery();
    return r.rows[0] ?? null;
  }
  async run() {
    const r = await this.execQuery();
    const lastId = r.rows && r.rows[0] && r.rows[0].id != null ? Number(r.rows[0].id) : 0;
    return { success: true, meta: { changes: r.rowCount ?? 0, last_row_id: lastId } };
  }
};
var pgDb = {
  prepare: (sql) => new PgStmt(sql)
};

// src/index.tsx
var app = new Hono2();
app.use("*", async (c, next) => {
  if (!c.env.DB) {
    const cs = c.env.POSTGRES_URL || pgConnectionString();
    if (cs) c.env.DB = pgDb;
  }
  await next();
});
app.use("/api/*", cors());
app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith("/static/")) return next();
  const user = await getSession(c);
  c.set("user", user);
  let settings = {};
  try {
    const rs = await c.env.DB.prepare("SELECT key, value FROM settings").all();
    for (const r of rs.results) settings[r.key] = r.value;
  } catch {
  }
  c.set("settings", settings);
  let cartCount = 0;
  if (user) {
    try {
      const r = await c.env.DB.prepare("SELECT COUNT(*) c FROM cart_items WHERE user_id=?").bind(user.id).first();
      cartCount = r?.c || 0;
    } catch {
    }
  }
  c.set("cartCount", cartCount);
  await next();
});
function base(c) {
  return { user: c.get("user"), settings: c.get("settings"), cartCount: c.get("cartCount") };
}
async function requireAuth(c, next) {
  const u = c.get("user");
  if (!u) {
    if (c.req.path.startsWith("/api/")) return c.json({ error: "Vui l\xF2ng \u0111\u0103ng nh\u1EADp" }, 401);
    return c.redirect("/dang-nhap?next=" + encodeURIComponent(c.req.path));
  }
  await next();
}
async function requireAdmin(c, next) {
  const u = c.get("user");
  if (!u || u.role !== "admin") {
    if (c.req.path.startsWith("/api/")) return c.json({ error: "Kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp" }, 403);
    return c.redirect("/dang-nhap?next=" + encodeURIComponent(c.req.path));
  }
  await next();
}
app.get("/", async (c) => {
  const db = c.env.DB;
  const [cats, featured, hot, newest, combos, posts, reviews, stats] = await Promise.all([
    db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id AND p.status='published') product_count
                FROM categories c ORDER BY c.sort_order`).all(),
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE p.status='published' AND p.is_featured=1 ORDER BY p.sold_count DESC LIMIT 8`).all(),
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE p.status='published' ORDER BY p.sold_count DESC LIMIT 8`).all(),
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE p.status='published' ORDER BY p.id DESC LIMIT 8`).all(),
    db.prepare(`SELECT * FROM products WHERE status='published' AND product_type='combo' ORDER BY sold_count DESC LIMIT 3`).all(),
    db.prepare(`SELECT * FROM posts WHERE status='published' ORDER BY id DESC LIMIT 4`).all(),
    db.prepare(`SELECT r.*, u.full_name, p.name product_name, p.slug product_slug
                FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id
                WHERE r.rating>=4 ORDER BY r.id DESC LIMIT 6`).all(),
    db.prepare(`SELECT (SELECT COUNT(*) FROM products WHERE status='published') products,
                       (SELECT COUNT(*) FROM users) users,
                       (SELECT COALESCE(SUM(sold_count),0) FROM products) sold`).first()
  ]);
  return c.html(/* @__PURE__ */ jsxDEV(
    HomePage,
    {
      ...base(c),
      categories: cats.results,
      featured: featured.results,
      hot: hot.results,
      newest: newest.results,
      combos: combos.results,
      posts: posts.results,
      reviews: reviews.results,
      stats
    }
  ));
});
async function renderProductList(c, opts) {
  const db = c.env.DB;
  const q = (c.req.query("q") || "").trim();
  const cat = opts.catSlug || c.req.query("cat") || "";
  const sort = c.req.query("sort") || "newest";
  const type = opts.comboOnly ? "combo" : c.req.query("type") || "";
  const minPrice = c.req.query("min") || "";
  const maxPrice = c.req.query("max") || "";
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const perPage = 12;
  const where = [`p.status='published'`];
  const binds = [];
  if (q) {
    where.push(`(p.name LIKE ? OR p.short_desc LIKE ?)`);
    binds.push(`%${q}%`, `%${q}%`);
  }
  if (cat) {
    where.push(`c.slug = ?`);
    binds.push(cat);
  }
  if (type) {
    where.push(`p.product_type = ?`);
    binds.push(type);
  }
  if (minPrice) {
    where.push(`p.price >= ?`);
    binds.push(+minPrice);
  }
  if (maxPrice) {
    where.push(`p.price <= ?`);
    binds.push(+maxPrice);
  }
  const orderMap = {
    newest: "p.id DESC",
    bestseller: "p.sold_count DESC",
    price_asc: "p.price ASC",
    price_desc: "p.price DESC",
    rating: "p.rating DESC, p.rating_count DESC",
    featured: "p.is_featured DESC, p.sold_count DESC"
  };
  const orderBy = orderMap[sort] || orderMap.newest;
  const w = where.join(" AND ");
  const [cntRow, rows, cats, currentCat] = await Promise.all([
    db.prepare(`SELECT COUNT(*) n FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE ${w}`).bind(...binds).first(),
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE ${w} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage).all(),
    db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id AND p.status='published') product_count
                FROM categories c ORDER BY c.sort_order`).all(),
    opts.catSlug ? db.prepare("SELECT * FROM categories WHERE slug=?").bind(opts.catSlug).first() : Promise.resolve(null)
  ]);
  const total = cntRow?.n || 0;
  const heading = opts.comboOnly ? "Combo Tr\u1ECDn B\u1ED9" : currentCat ? currentCat.name : q ? `K\u1EBFt qu\u1EA3 cho "${q}"` : "T\u1EA5t c\u1EA3 s\u1EA3n ph\u1EA9m";
  const headingDesc = opts.comboOnly ? "G\xF3i combo ti\u1EBFt ki\u1EC7m t\u1EDBi 60% so v\u1EDBi mua l\u1EBB t\u1EEBng s\u1EA3n ph\u1EA9m" : currentCat ? currentCat.description : "Kh\xE1m ph\xE1 to\xE0n b\u1ED9 kh\xF3a h\u1ECDc, skill, chatbot v\xE0 app l\xE0m video AI c\u1EE7a ch\xFAng t\xF4i";
  const baseUrl = opts.comboOnly ? "/combo" : opts.catSlug ? `/danh-muc/${opts.catSlug}` : "/san-pham";
  return c.html(/* @__PURE__ */ jsxDEV(
    ProductListPage,
    {
      ...base(c),
      products: rows.results,
      categories: cats.results,
      total,
      page,
      totalPages: Math.ceil(total / perPage),
      q,
      cat: opts.catSlug ? "" : cat,
      sort,
      minPrice,
      maxPrice,
      type: opts.comboOnly ? "" : type,
      heading,
      headingDesc,
      baseUrl,
      currentCategory: currentCat
    }
  ));
}
app.get("/san-pham", (c) => renderProductList(c, {}));
app.get("/combo", (c) => renderProductList(c, { comboOnly: true }));
app.get("/danh-muc/:slug", (c) => renderProductList(c, { catSlug: c.req.param("slug") }));
app.get("/san-pham/:slug", async (c) => {
  const db = c.env.DB;
  const slug = c.req.param("slug");
  const user = c.get("user");
  const p = await db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug
    FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.status='published'`).bind(slug).first();
  if (!p) return c.html(/* @__PURE__ */ jsxDEV(NotFoundPage, { ...base(c) }), 404);
  await db.prepare("UPDATE products SET view_count=view_count+1 WHERE id=?").bind(p.id).run();
  const [related, comboItems, reviews, ownedRow, wishRow, breakdown] = await Promise.all([
    db.prepare(`SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id
                WHERE p.status='published' AND p.id!=? AND p.category_id=? ORDER BY p.sold_count DESC LIMIT 4`).bind(p.id, p.category_id).all(),
    p.product_type === "combo" ? db.prepare(`SELECT p.* FROM combo_items ci JOIN products p ON p.id=ci.product_id WHERE ci.combo_id=?`).bind(p.id).all() : Promise.resolve({ results: [] }),
    db.prepare(`SELECT r.*, u.full_name FROM reviews r JOIN users u ON u.id=r.user_id
                WHERE r.product_id=? AND r.status='approved' ORDER BY r.id DESC LIMIT 20`).bind(p.id).all(),
    user ? db.prepare("SELECT 1 x FROM licenses WHERE user_id=? AND product_id=?").bind(user.id, p.id).first() : Promise.resolve(null),
    user ? db.prepare("SELECT 1 x FROM wishlists WHERE user_id=? AND product_id=?").bind(user.id, p.id).first() : Promise.resolve(null),
    db.prepare("SELECT rating, COUNT(*) n FROM reviews WHERE product_id=? GROUP BY rating").bind(p.id).all()
  ]);
  const rb = {};
  for (const r of breakdown.results) rb[r.rating] = r.n;
  const owned = !!ownedRow;
  let canReview = false;
  if (owned && user) {
    const has = await db.prepare("SELECT 1 x FROM reviews WHERE user_id=? AND product_id=?").bind(user.id, p.id).first();
    canReview = !has;
  }
  return c.html(/* @__PURE__ */ jsxDEV(
    ProductDetailPage,
    {
      ...base(c),
      product: p,
      related: related.results,
      comboItems: comboItems.results,
      reviews: reviews.results,
      owned,
      inWishlist: !!wishRow,
      canReview,
      ratingBreakdown: rb
    }
  ));
});
app.get("/blog", async (c) => {
  const db = c.env.DB;
  const q = (c.req.query("q") || "").trim();
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const perPage = 9;
  const where = q ? `status='published' AND (title LIKE ? OR excerpt LIKE ?)` : `status='published'`;
  const binds = q ? [`%${q}%`, `%${q}%`] : [];
  const cnt = await db.prepare(`SELECT COUNT(*) n FROM posts WHERE ${where}`).bind(...binds).first();
  const rows = await db.prepare(`SELECT * FROM posts WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage).all();
  return c.html(/* @__PURE__ */ jsxDEV(
    BlogListPage,
    {
      ...base(c),
      posts: rows.results,
      page,
      totalPages: Math.ceil((cnt?.n || 0) / perPage),
      q
    }
  ));
});
app.get("/blog/:slug", async (c) => {
  const db = c.env.DB;
  const post = await db.prepare(`SELECT * FROM posts WHERE slug=? AND status='published'`).bind(c.req.param("slug")).first();
  if (!post) return c.html(/* @__PURE__ */ jsxDEV(NotFoundPage, { ...base(c) }), 404);
  await db.prepare("UPDATE posts SET view_count=view_count+1 WHERE id=?").bind(post.id).run();
  const related = await db.prepare(`SELECT * FROM posts WHERE status='published' AND id!=? ORDER BY id DESC LIMIT 3`).bind(post.id).all();
  return c.html(/* @__PURE__ */ jsxDEV(BlogDetailPage, { ...base(c), post, related: related.results }));
});
app.get("/bang-gia", (c) => c.html(/* @__PURE__ */ jsxDEV(PricingPage, { ...base(c) })));
app.get("/lien-he", (c) => c.html(/* @__PURE__ */ jsxDEV(ContactPage, { ...base(c) })));
app.get("/affiliate", (c) => c.html(/* @__PURE__ */ jsxDEV(
  AffiliateLandingPage,
  {
    ...base(c),
    percent: +(c.get("settings").affiliate_percent || 20)
  }
)));
app.get("/gioi-thieu", async (c) => {
  const stats = await c.env.DB.prepare(`SELECT (SELECT COUNT(*) FROM products WHERE status='published') products,
    (SELECT COUNT(*) FROM users) users, (SELECT COALESCE(SUM(sold_count),0) FROM products) sold`).first();
  return c.html(/* @__PURE__ */ jsxDEV(AboutPage, { ...base(c), stats }));
});
for (const [path, doc] of Object.entries(POLICY_DOCS)) {
  app.get(path, (c) => c.html(/* @__PURE__ */ jsxDEV(DocPage, { ...base(c), heading: doc.heading, html: doc.html })));
}
app.get("/dang-nhap", (c) => {
  if (c.get("user")) return c.redirect("/tai-khoan");
  return c.html(/* @__PURE__ */ jsxDEV(LoginPage, { ...base(c), next: c.req.query("next"), registered: c.req.query("registered") === "1" }));
});
app.get("/dang-ky", (c) => {
  if (c.get("user")) return c.redirect("/tai-khoan");
  return c.html(/* @__PURE__ */ jsxDEV(RegisterPage, { ...base(c), ref: c.req.query("ref") }));
});
app.get("/quen-mat-khau", (c) => c.html(/* @__PURE__ */ jsxDEV(ForgotPage, { ...base(c) })));
app.get("/dang-xuat", (c) => {
  clearSession(c);
  return c.redirect("/");
});
app.post("/api/auth/register", async (c) => {
  const db = c.env.DB;
  const b = await c.req.json();
  const email = (b.email || "").trim().toLowerCase();
  const password = b.password || "";
  const full_name = (b.full_name || "").trim();
  if (!email || !password || !full_name) return c.json({ error: "Vui l\xF2ng \u0111i\u1EC1n \u0111\u1EA7y \u0111\u1EE7 th\xF4ng tin" }, 400);
  if (password.length < 6) return c.json({ error: "M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: "Email kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
  const exists = await db.prepare("SELECT 1 x FROM users WHERE email=?").bind(email).first();
  if (exists) return c.json({ error: "Email n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u0103ng k\xFD" }, 400);
  let referred_by = null;
  if (b.ref) {
    const r = await db.prepare("SELECT id FROM users WHERE affiliate_code=?").bind(String(b.ref).toUpperCase()).first();
    if (r) referred_by = r.id;
  }
  const hash = await hashPassword(password);
  const affCode = genCode("AF", 6);
  const res = await db.prepare(
    `INSERT INTO users (email, password_hash, full_name, phone, affiliate_code, referred_by) VALUES (?,?,?,?,?,?)`
  ).bind(email, hash, full_name, b.phone || null, affCode, referred_by).run();
  const user = { id: res.meta.last_row_id, email, full_name, role: "user" };
  await setSession(c, user);
  return c.json({ ok: true, redirect: "/tai-khoan" });
});
app.post("/api/auth/login", async (c) => {
  const db = c.env.DB;
  const b = await c.req.json();
  const email = (b.email || "").trim().toLowerCase();
  const u = await db.prepare("SELECT * FROM users WHERE email=?").bind(email).first();
  if (!u) return c.json({ error: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng" }, 400);
  if (u.status === "banned") return c.json({ error: "T\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n \u0111\xE3 b\u1ECB kho\xE1" }, 403);
  const ok = await verifyPassword(b.password || "", u.password_hash);
  if (!ok) return c.json({ error: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng" }, 400);
  await setSession(c, { id: u.id, email: u.email, full_name: u.full_name, role: u.role, avatar_url: u.avatar_url });
  const next = b.next && String(b.next).startsWith("/") ? b.next : u.role === "admin" ? "/admin" : "/tai-khoan";
  return c.json({ ok: true, redirect: next });
});
app.post("/api/cart/add", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const { product_id } = await c.req.json();
  const p = await db.prepare(`SELECT id FROM products WHERE id=? AND status='published'`).bind(product_id).first();
  if (!p) return c.json({ error: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
  const owned = await db.prepare("SELECT 1 x FROM licenses WHERE user_id=? AND product_id=?").bind(u.id, product_id).first();
  if (owned) {
    const cnt2 = await db.prepare("SELECT COUNT(*) c FROM cart_items WHERE user_id=?").bind(u.id).first();
    return c.json({ ok: true, owned: true, count: cnt2?.c || 0 });
  }
  const exist = await db.prepare("SELECT 1 x FROM cart_items WHERE user_id=? AND product_id=?").bind(u.id, product_id).first();
  if (!exist) await db.prepare("INSERT INTO cart_items (user_id, product_id) VALUES (?,?)").bind(u.id, product_id).run();
  const cnt = await db.prepare("SELECT COUNT(*) c FROM cart_items WHERE user_id=?").bind(u.id).first();
  return c.json({ ok: true, exists: !!exist, count: cnt?.c || 0 });
});
app.post("/api/cart/remove", requireAuth, async (c) => {
  const u = c.get("user");
  const { product_id } = await c.req.json();
  await c.env.DB.prepare("DELETE FROM cart_items WHERE user_id=? AND product_id=?").bind(u.id, product_id).run();
  const cnt = await c.env.DB.prepare("SELECT COUNT(*) c FROM cart_items WHERE user_id=?").bind(u.id).first();
  return c.json({ ok: true, count: cnt?.c || 0 });
});
app.post("/api/wishlist/toggle", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const { product_id } = await c.req.json();
  const ex = await db.prepare("SELECT id FROM wishlists WHERE user_id=? AND product_id=?").bind(u.id, product_id).first();
  if (ex) {
    await db.prepare("DELETE FROM wishlists WHERE id=?").bind(ex.id).run();
    return c.json({ ok: true, added: false });
  }
  await db.prepare("INSERT INTO wishlists (user_id, product_id) VALUES (?,?)").bind(u.id, product_id).run();
  return c.json({ ok: true, added: true });
});
app.get("/gio-hang", requireAuth, async (c) => {
  const u = c.get("user");
  const rows = await c.env.DB.prepare(
    `SELECT p.* FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=? ORDER BY ci.id DESC`
  ).bind(u.id).all();
  const items = rows.results;
  return c.html(/* @__PURE__ */ jsxDEV(CartPage, { ...base(c), items, subtotal: items.reduce((s, i) => s + i.price, 0) }));
});
app.get("/thanh-toan", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const rows = await db.prepare(
    `SELECT p.* FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=?`
  ).bind(u.id).all();
  const items = rows.results;
  if (items.length === 0) return c.redirect("/gio-hang");
  const me = await db.prepare("SELECT balance FROM users WHERE id=?").bind(u.id).first();
  return c.html(/* @__PURE__ */ jsxDEV(CheckoutPage, { ...base(c), items, subtotal: items.reduce((s, i) => s + i.price, 0), balance: me?.balance || 0 }));
});
app.post("/api/coupons/check", async (c) => {
  const { code, subtotal } = await c.req.json();
  const cp = await c.env.DB.prepare(`SELECT * FROM coupons WHERE code=? AND status='active'`).bind(String(code).toUpperCase()).first();
  if (!cp) return c.json({ error: "M\xE3 gi\u1EA3m gi\xE1 kh\xF4ng t\u1ED3n t\u1EA1i" }, 400);
  if (cp.expires_at && new Date(cp.expires_at) < /* @__PURE__ */ new Date()) return c.json({ error: "M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 h\u1EBFt h\u1EA1n" }, 400);
  if (cp.max_uses > 0 && cp.used_count >= cp.max_uses) return c.json({ error: "M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 h\u1EBFt l\u01B0\u1EE3t s\u1EED d\u1EE5ng" }, 400);
  if (subtotal < cp.min_order) return c.json({ error: `\u0110\u01A1n h\xE0ng t\u1ED1i thi\u1EC3u ${formatVND(cp.min_order)}` }, 400);
  const discount = cp.type === "percent" ? Math.floor(subtotal * cp.value / 100) : Math.min(cp.value, subtotal);
  return c.json({ ok: true, discount, code: cp.code });
});
async function grantLicenses(db, userId, orderId) {
  const items = await db.prepare("SELECT product_id FROM order_items WHERE order_id=?").bind(orderId).all();
  for (const it of items.results) {
    const p = await db.prepare("SELECT product_type FROM products WHERE id=?").bind(it.product_id).first();
    const ids = [it.product_id];
    if (p?.product_type === "combo") {
      const ci = await db.prepare("SELECT product_id FROM combo_items WHERE combo_id=?").bind(it.product_id).all();
      for (const x of ci.results) ids.push(x.product_id);
    }
    for (const pid of ids) {
      const ex = await db.prepare("SELECT 1 x FROM licenses WHERE user_id=? AND product_id=?").bind(userId, pid).first();
      if (!ex) {
        await db.prepare("INSERT INTO licenses (user_id, product_id, order_id, license_key) VALUES (?,?,?,?)").bind(userId, pid, orderId, genLicenseKey()).run();
      }
      await db.prepare("UPDATE products SET sold_count=sold_count+1 WHERE id=?").bind(pid).run();
    }
  }
}
app.post("/api/orders/create", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const b = await c.req.json();
  const rows = await db.prepare(
    `SELECT p.* FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=?`
  ).bind(u.id).all();
  const items = rows.results;
  if (items.length === 0) return c.json({ error: "Gi\u1ECF h\xE0ng tr\u1ED1ng" }, 400);
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  let discount = 0, couponCode = null;
  if (b.coupon_code) {
    const cp = await db.prepare(`SELECT * FROM coupons WHERE code=? AND status='active'`).bind(String(b.coupon_code).toUpperCase()).first();
    if (cp && subtotal >= cp.min_order && (cp.max_uses === 0 || cp.used_count < cp.max_uses)) {
      discount = cp.type === "percent" ? Math.floor(subtotal * cp.value / 100) : Math.min(cp.value, subtotal);
      couponCode = cp.code;
      await db.prepare("UPDATE coupons SET used_count=used_count+1 WHERE id=?").bind(cp.id).run();
    }
  }
  const total = Math.max(0, subtotal - discount);
  const pm = ["bank", "momo", "balance"].includes(b.payment_method) ? b.payment_method : "bank";
  let status = "pending";
  if (pm === "balance") {
    const me = await db.prepare("SELECT balance FROM users WHERE id=?").bind(u.id).first();
    if ((me?.balance || 0) < total) return c.json({ error: "S\u1ED1 d\u01B0 v\xED kh\xF4ng \u0111\u1EE7" }, 400);
    await db.prepare("UPDATE users SET balance=balance-? WHERE id=?").bind(total, u.id).run();
    status = "paid";
  }
  const code = genCode("DH", 8);
  const ord = await db.prepare(
    `INSERT INTO orders (order_code, user_id, subtotal, discount, total, coupon_code, payment_method, status, note, paid_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    code,
    u.id,
    subtotal,
    discount,
    total,
    couponCode,
    pm,
    status,
    b.note || null,
    status === "paid" ? (/* @__PURE__ */ new Date()).toISOString() : null
  ).run();
  const orderId = ord.meta.last_row_id;
  for (const it of items) {
    await db.prepare("INSERT INTO order_items (order_id, product_id, product_name, price) VALUES (?,?,?,?)").bind(orderId, it.id, it.name, it.price).run();
  }
  await db.prepare("DELETE FROM cart_items WHERE user_id=?").bind(u.id).run();
  if (status === "paid") {
    await grantLicenses(db, u.id, orderId);
    await creditAffiliate(db, u.id, total);
  }
  return c.json({ ok: true, order_code: code });
});
async function creditAffiliate(db, userId, total) {
  const me = await db.prepare("SELECT referred_by FROM users WHERE id=?").bind(userId).first();
  if (!me?.referred_by) return;
  const st = await db.prepare(`SELECT value FROM settings WHERE key='affiliate_percent'`).first();
  const pct = +(st?.value || 20);
  const commission = Math.floor(total * pct / 100);
  await db.prepare("UPDATE users SET affiliate_earned=affiliate_earned+?, balance=balance+? WHERE id=?").bind(commission, commission, me.referred_by).run();
}
async function settleOrder(db, order, opts) {
  await db.prepare(
    `UPDATE orders SET status='paid', paid_at=?, paid_amount=?, paid_via=?, bank_tx_id=? WHERE id=?`
  ).bind((/* @__PURE__ */ new Date()).toISOString(), opts.paidAmount, opts.paidVia, opts.bankTxId ?? null, order.id).run();
  await grantLicenses(db, order.user_id, order.id);
  await creditAffiliate(db, order.user_id, order.total);
}
async function processTransaction(db, tx, rawPayload, tolerance) {
  const dup = await db.prepare(
    `SELECT id, match_status, matched_order_code FROM bank_transactions WHERE provider=? AND provider_tx_id=?`
  ).bind(tx.provider, tx.providerTxId).first();
  if (dup) {
    return {
      tx_id: tx.providerTxId,
      status: dup.match_status,
      order: dup.matched_order_code,
      message: "Giao d\u1ECBch \u0111\xE3 \u0111\u01B0\u1EE3c x\u1EED l\xFD tr\u01B0\u1EDBc \u0111\xF3 (b\u1ECF qua)"
    };
  }
  if (tx.amountIn <= 0) {
    await insertTx(db, tx, rawPayload, {
      matchStatus: "ignored",
      note: "Giao d\u1ECBch ti\u1EC1n ra ho\u1EB7c s\u1ED1 ti\u1EC1n = 0"
    });
    return { tx_id: tx.providerTxId, status: "ignored", message: "Giao d\u1ECBch ti\u1EC1n ra, b\u1ECF qua" };
  }
  const codes = extractOrderCodes(tx.content);
  if (codes.length === 0) {
    const id = await insertTx(db, tx, rawPayload, {
      matchStatus: "unmatched",
      note: "Kh\xF4ng t\xECm th\u1EA5y m\xE3 \u0111\u01A1n trong n\u1ED9i dung chuy\u1EC3n kho\u1EA3n"
    });
    return {
      tx_id: tx.providerTxId,
      status: "unmatched",
      message: `Kh\xF4ng t\xECm th\u1EA5y m\xE3 \u0111\u01A1n (bank_tx #${id}) \u2014 c\u1EA7n \u0111\u1ED1i so\xE1t th\u1EE7 c\xF4ng`
    };
  }
  let order = null;
  let matchedCode = "";
  for (const code of codes) {
    const o = await db.prepare("SELECT * FROM orders WHERE order_code=?").bind(code).first();
    if (o) {
      order = o;
      matchedCode = code;
      break;
    }
  }
  if (!order) {
    const id = await insertTx(db, tx, rawPayload, {
      matchStatus: "unmatched",
      matchedOrderCode: codes[0],
      note: `M\xE3 ${codes.join(", ")} kh\xF4ng t\u1ED3n t\u1EA1i trong h\u1EC7 th\u1ED1ng`
    });
    return {
      tx_id: tx.providerTxId,
      status: "unmatched",
      order: codes[0],
      message: `M\xE3 \u0111\u01A1n ${codes[0]} kh\xF4ng t\u1ED3n t\u1EA1i (bank_tx #${id})`
    };
  }
  if (order.status === "paid") {
    const id = await insertTx(db, tx, rawPayload, {
      matchStatus: "duplicate",
      matchedOrderId: order.id,
      matchedOrderCode: matchedCode,
      note: "\u0110\u01A1n h\xE0ng \u0111\xE3 \u1EDF tr\u1EA1ng th\xE1i paid \u2014 c\xF3 th\u1EC3 kh\xE1ch chuy\u1EC3n kho\u1EA3n 2 l\u1EA7n"
    });
    return {
      tx_id: tx.providerTxId,
      status: "duplicate",
      order: matchedCode,
      message: `\u0110\u01A1n ${matchedCode} \u0111\xE3 thanh to\xE1n tr\u01B0\u1EDBc \u0111\xF3 (bank_tx #${id}) \u2014 ki\u1EC3m tra ho\xE0n ti\u1EC1n`
    };
  }
  if (order.status !== "pending") {
    const id = await insertTx(db, tx, rawPayload, {
      matchStatus: "amount_mismatch",
      matchedOrderId: order.id,
      matchedOrderCode: matchedCode,
      note: `\u0110\u01A1n \u0111ang \u1EDF tr\u1EA1ng th\xE1i '${order.status}', kh\xF4ng th\u1EC3 t\u1EF1 \u0111\u1ED9ng c\u1EA5p h\xE0ng`
    });
    return {
      tx_id: tx.providerTxId,
      status: "order_not_pending",
      order: matchedCode,
      message: `\u0110\u01A1n ${matchedCode} \u0111ang \u1EDF tr\u1EA1ng th\xE1i ${order.status} (bank_tx #${id})`
    };
  }
  if (tx.amountIn + tolerance < order.total) {
    const id = await insertTx(db, tx, rawPayload, {
      matchStatus: "amount_mismatch",
      matchedOrderId: order.id,
      matchedOrderCode: matchedCode,
      note: `Thi\u1EBFu ti\u1EC1n: nh\u1EADn ${tx.amountIn}\u0111 / c\u1EA7n ${order.total}\u0111`
    });
    return {
      tx_id: tx.providerTxId,
      status: "amount_mismatch",
      order: matchedCode,
      message: `\u0110\u01A1n ${matchedCode}: nh\u1EADn ${tx.amountIn}\u0111 nh\u01B0ng c\u1EA7n ${order.total}\u0111 (bank_tx #${id})`
    };
  }
  const txId = await insertTx(db, tx, rawPayload, {
    matchStatus: "matched",
    matchedOrderId: order.id,
    matchedOrderCode: matchedCode,
    note: tx.amountIn > order.total ? `Kh\xE1ch chuy\u1EC3n th\u1EEBa ${tx.amountIn - order.total}\u0111` : "Kh\u1EDBp ch\xEDnh x\xE1c"
  });
  await settleOrder(db, order, { paidVia: "webhook", paidAmount: tx.amountIn, bankTxId: txId });
  const excess = tx.amountIn - order.total;
  if (excess > 0) {
    await db.prepare("UPDATE users SET balance=balance+? WHERE id=?").bind(excess, order.user_id).run();
  }
  return {
    tx_id: tx.providerTxId,
    status: "matched",
    order: matchedCode,
    message: `\u2705 \u0110\xE3 x\xE1c nh\u1EADn \u0111\u01A1n ${matchedCode} (${tx.amountIn}\u0111) v\xE0 c\u1EA5p quy\u1EC1n t\u1EA3i`
  };
}
async function insertTx(db, tx, rawPayload, o) {
  const r = await db.prepare(
    `INSERT INTO bank_transactions
      (provider, provider_tx_id, gateway, account_number, transaction_date,
       amount_in, amount_out, accumulated, content, reference_code,
       matched_order_id, matched_order_code, match_status, note, raw_payload)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    tx.provider,
    tx.providerTxId,
    tx.gateway,
    tx.accountNumber,
    normalizeDate(tx.transactionDate),
    tx.amountIn,
    tx.amountOut,
    tx.accumulated,
    tx.content,
    tx.referenceCode,
    o.matchedOrderId ?? null,
    o.matchedOrderCode ?? null,
    o.matchStatus,
    o.note ?? null,
    rawPayload.slice(0, 4e3)
  ).run();
  return r.meta.last_row_id;
}
app.post("/api/webhook/bank", async (c) => {
  const db = c.env.DB;
  const st = await db.prepare(
    `SELECT key, value FROM settings WHERE key IN ('webhook_api_key','payment_provider','amount_tolerance')`
  ).all();
  const cfg = {};
  for (const r of st.results) cfg[r.key] = r.value;
  if (!verifyWebhookAuth(c.req.raw.headers, cfg.webhook_api_key || "")) {
    return c.json({ success: false, error: "Unauthorized: sai ho\u1EB7c thi\u1EBFu API key" }, 401);
  }
  let body;
  const rawText = await c.req.text();
  try {
    body = JSON.parse(rawText);
  } catch {
    return c.json({ success: false, error: "Payload kh\xF4ng ph\u1EA3i JSON h\u1EE3p l\u1EC7" }, 400);
  }
  const provider = cfg.payment_provider === "casso" ? "casso" : "sepay";
  const txs = extractTransactions(provider, body);
  if (txs.length === 0) return c.json({ success: true, message: "Kh\xF4ng c\xF3 giao d\u1ECBch n\xE0o", results: [] });
  const tolerance = +(cfg.amount_tolerance || 0);
  const results = [];
  for (const tx of txs) {
    try {
      results.push(await processTransaction(db, tx, rawText, tolerance));
    } catch (err) {
      results.push({ tx_id: tx.providerTxId, status: "error", message: String(err?.message || err) });
    }
  }
  return c.json({ success: true, processed: results.length, results });
});
app.post("/api/orders/confirm", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const { order_code } = await c.req.json();
  const o = await db.prepare("SELECT * FROM orders WHERE order_code=? AND user_id=?").bind(order_code, u.id).first();
  if (!o) return c.json({ error: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng" }, 404);
  if (o.status === "paid") return c.json({ ok: true, status: "paid", message: "\u0110\u01A1n \u0111\xE3 \u0111\u01B0\u1EE3c thanh to\xE1n" });
  if (o.status !== "pending") return c.json({ error: "\u0110\u01A1n h\xE0ng \u0111\xE3 \u0111\u01B0\u1EE3c x\u1EED l\xFD" }, 400);
  const st = await db.prepare(`SELECT value FROM settings WHERE key='auto_confirm_manual'`).first();
  const autoConfirm = st?.value === "1";
  if (autoConfirm) {
    await settleOrder(db, o, { paidVia: "manual", paidAmount: o.total });
    return c.json({ ok: true, status: "paid", message: "\u0110\xE3 x\xE1c nh\u1EADn (ch\u1EBF \u0111\u1ED9 demo)" });
  }
  return c.json({
    ok: true,
    status: "pending",
    message: "\u0110\xE3 ghi nh\u1EADn. H\u1EC7 th\u1ED1ng \u0111ang ki\u1EC3m tra giao d\u1ECBch, th\u01B0\u1EDDng m\u1EA5t 10\u201360 gi\xE2y. Trang s\u1EBD t\u1EF1 c\u1EADp nh\u1EADt."
  });
});
app.get("/api/orders/:code/status", requireAuth, async (c) => {
  const u = c.get("user");
  const o = await c.env.DB.prepare(
    "SELECT order_code, status, total, paid_amount, paid_at, paid_via FROM orders WHERE order_code=? AND user_id=?"
  ).bind(c.req.param("code"), u.id).first();
  if (!o) return c.json({ error: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng" }, 404);
  return c.json({ ok: true, ...o });
});
app.get("/don-hang/:code", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const o = await db.prepare("SELECT * FROM orders WHERE order_code=? AND user_id=?").bind(c.req.param("code"), u.id).first();
  if (!o) return c.html(/* @__PURE__ */ jsxDEV(NotFoundPage, { ...base(c) }), 404);
  const items = await db.prepare(
    `SELECT oi.*, p.slug FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`
  ).bind(o.id).all();
  const s = c.get("settings");
  return c.html(/* @__PURE__ */ jsxDEV(
    OrderPage,
    {
      ...base(c),
      order: o,
      items: items.results,
      bank: { bank_name: s.bank_name, bank_code: s.bank_code, bank_account: s.bank_account, bank_owner: s.bank_owner }
    }
  ));
});
app.get("/tai-khoan", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const [st, orders, prods] = await Promise.all([
    db.prepare(`SELECT (SELECT COUNT(*) FROM orders WHERE user_id=?1) orders,
      (SELECT COUNT(*) FROM licenses WHERE user_id=?1) products,
      (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=?1 AND status='paid') spent,
      (SELECT balance FROM users WHERE id=?1) balance`).bind(u.id).first(),
    db.prepare("SELECT * FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 5").bind(u.id).all(),
    db.prepare(`SELECT l.*, p.name, p.slug FROM licenses l JOIN products p ON p.id=l.product_id
                WHERE l.user_id=? ORDER BY l.id DESC LIMIT 5`).bind(u.id).all()
  ]);
  return c.html(/* @__PURE__ */ jsxDEV(AccountDashboard, { ...base(c), stats: st, recentOrders: orders.results, recentProducts: prods.results }));
});
app.get("/tai-khoan/san-pham", requireAuth, async (c) => {
  const u = c.get("user");
  const rows = await c.env.DB.prepare(
    `SELECT l.*, p.name, p.slug, p.thumbnail, p.product_type, p.version, p.download_url, p.doc_url, p.file_size
     FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.user_id=? ORDER BY l.id DESC`
  ).bind(u.id).all();
  return c.html(/* @__PURE__ */ jsxDEV(MyProductsPage, { ...base(c), licenses: rows.results }));
});
app.get("/tai-xuong/:licenseId", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const l = await db.prepare(
    `SELECT l.id, p.download_url FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.id=? AND l.user_id=?`
  ).bind(c.req.param("licenseId"), u.id).first();
  if (!l?.download_url) return c.html(/* @__PURE__ */ jsxDEV(NotFoundPage, { ...base(c) }), 404);
  await db.prepare("UPDATE licenses SET download_count=download_count+1, last_download_at=? WHERE id=?").bind((/* @__PURE__ */ new Date()).toISOString(), l.id).run();
  return c.redirect(l.download_url);
});
app.get("/tai-khoan/don-hang", requireAuth, async (c) => {
  const u = c.get("user");
  const rows = await c.env.DB.prepare(
    `SELECT o.*, (SELECT STRING_AGG(product_name, ', ') FROM order_items WHERE order_id=o.id) product_names
     FROM orders o WHERE o.user_id=? ORDER BY o.id DESC`
  ).bind(u.id).all();
  return c.html(/* @__PURE__ */ jsxDEV(MyOrdersPage, { ...base(c), orders: rows.results }));
});
app.get("/tai-khoan/yeu-thich", requireAuth, async (c) => {
  const u = c.get("user");
  const rows = await c.env.DB.prepare(
    `SELECT p.* FROM wishlists w JOIN products p ON p.id=w.product_id WHERE w.user_id=? ORDER BY w.id DESC`
  ).bind(u.id).all();
  return c.html(/* @__PURE__ */ jsxDEV(WishlistPage, { ...base(c), items: rows.results }));
});
app.get("/tai-khoan/affiliate", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const me = await db.prepare("SELECT affiliate_code, affiliate_earned FROM users WHERE id=?").bind(u.id).first();
  const refs = await db.prepare(
    `SELECT u.id, u.full_name, u.email, u.created_at,
     (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=u.id AND status='paid') spent
     FROM users u WHERE u.referred_by=? ORDER BY u.id DESC`
  ).bind(u.id).all();
  const origin = new URL(c.req.url).origin;
  return c.html(/* @__PURE__ */ jsxDEV(
    AffiliateDashboard,
    {
      ...base(c),
      affCode: me?.affiliate_code || "",
      earned: me?.affiliate_earned || 0,
      refCount: refs.results.length,
      percent: +(c.get("settings").affiliate_percent || 20),
      referrals: refs.results,
      siteUrl: origin
    }
  ));
});
app.get("/tai-khoan/ho-so", requireAuth, async (c) => {
  const u = c.get("user");
  const profile = await c.env.DB.prepare("SELECT * FROM users WHERE id=?").bind(u.id).first();
  return c.html(/* @__PURE__ */ jsxDEV(ProfilePage, { ...base(c), profile }));
});
app.post("/api/account/profile", requireAuth, async (c) => {
  const u = c.get("user");
  const b = await c.req.json();
  const full_name = (b.full_name || "").trim();
  if (!full_name) return c.json({ error: "H\u1ECD t\xEAn kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng" }, 400);
  await c.env.DB.prepare("UPDATE users SET full_name=?, phone=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(full_name, b.phone || null, u.id).run();
  await setSession(c, { ...u, full_name });
  return c.json({ ok: true, message: "C\u1EADp nh\u1EADt h\u1ED3 s\u01A1 th\xE0nh c\xF4ng!" });
});
app.post("/api/account/password", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const b = await c.req.json();
  if (!b.new_password || b.new_password.length < 6) return c.json({ error: "M\u1EADt kh\u1EA9u m\u1EDBi ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1" }, 400);
  const row = await db.prepare("SELECT password_hash FROM users WHERE id=?").bind(u.id).first();
  const ok = await verifyPassword(b.current_password || "", row.password_hash);
  if (!ok) return c.json({ error: "M\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i kh\xF4ng \u0111\xFAng" }, 400);
  await db.prepare("UPDATE users SET password_hash=? WHERE id=?").bind(await hashPassword(b.new_password), u.id).run();
  return c.json({ ok: true, message: "\u0110\u1ED5i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng!" });
});
app.post("/api/reviews", requireAuth, async (c) => {
  const db = c.env.DB, u = c.get("user");
  const b = await c.req.json();
  const pid = +b.product_id;
  const owned = await db.prepare("SELECT 1 x FROM licenses WHERE user_id=? AND product_id=?").bind(u.id, pid).first();
  if (!owned) return c.json({ error: "B\u1EA1n c\u1EA7n mua s\u1EA3n ph\u1EA9m tr\u01B0\u1EDBc khi \u0111\xE1nh gi\xE1" }, 403);
  const dup = await db.prepare("SELECT 1 x FROM reviews WHERE user_id=? AND product_id=?").bind(u.id, pid).first();
  if (dup) return c.json({ error: "B\u1EA1n \u0111\xE3 \u0111\xE1nh gi\xE1 s\u1EA3n ph\u1EA9m n\xE0y r\u1ED3i" }, 400);
  const rating = Math.min(5, Math.max(1, +b.rating || 5));
  if (!b.comment?.trim()) return c.json({ error: "Vui l\xF2ng nh\u1EADp n\u1ED9i dung \u0111\xE1nh gi\xE1" }, 400);
  await db.prepare("INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)").bind(pid, u.id, rating, b.comment.trim()).run();
  const agg = await db.prepare(`SELECT AVG(rating) a, COUNT(*) n FROM reviews WHERE product_id=? AND status='approved'`).bind(pid).first();
  await db.prepare("UPDATE products SET rating=?, rating_count=? WHERE id=?").bind(Math.round((agg?.a || 5) * 10) / 10, agg?.n || 0, pid).run();
  return c.json({ ok: true, message: "C\u1EA3m \u01A1n b\u1EA1n \u0111\xE3 \u0111\xE1nh gi\xE1!" });
});
app.post("/api/tickets", async (c) => {
  const b = await c.req.json();
  if (!b.name?.trim() || !b.email?.trim() || !b.subject?.trim() || !b.message?.trim())
    return c.json({ error: "Vui l\xF2ng \u0111i\u1EC1n \u0111\u1EA7y \u0111\u1EE7 th\xF4ng tin" }, 400);
  const u = c.get("user");
  await c.env.DB.prepare("INSERT INTO tickets (user_id, name, email, subject, message) VALUES (?,?,?,?,?)").bind(u?.id || null, b.name.trim(), b.email.trim(), b.subject.trim(), b.message.trim()).run();
  return c.json({ ok: true, message: "\u0110\xE3 g\u1EEDi y\xEAu c\u1EA7u! Ch\xFAng t\xF4i s\u1EBD ph\u1EA3n h\u1ED3i trong 24 gi\u1EDD." });
});
app.get("/admin", requireAdmin, async (c) => {
  const db = c.env.DB;
  const [stats, recentOrders, topProducts, chartRows] = await Promise.all([
    db.prepare(`SELECT
      (SELECT COALESCE(SUM(total),0) FROM orders WHERE status='paid') revenue,
      (SELECT COUNT(*) FROM orders) orders,
      (SELECT COUNT(*) FROM orders WHERE status='paid') paidOrders,
      (SELECT COUNT(*) FROM orders WHERE status='pending') pendingOrders,
      (SELECT COUNT(*) FROM users) users,
      (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') newUsers,
      (SELECT COUNT(*) FROM products) products,
      (SELECT COALESCE(SUM(sold_count),0) FROM products) totalSold`).first(),
    db.prepare(`SELECT o.*, u.full_name, u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT 8`).all(),
    db.prepare(`SELECT name, price, sold_count FROM products ORDER BY sold_count DESC LIMIT 6`).all(),
    db.prepare(`SELECT created_at::date d, COALESCE(SUM(total),0) v FROM orders
                WHERE status='paid' AND created_at >= NOW() - INTERVAL '7 days' GROUP BY created_at::date`).all()
  ]);
  const map = {};
  for (const r of chartRows.results) map[r.d] = r.v;
  const chart = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const key = d.toISOString().slice(0, 10);
    chart.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: map[key] || 0 });
  }
  return c.html(/* @__PURE__ */ jsxDEV(
    AdminDashboard,
    {
      user: c.get("user"),
      activeKey: "dash",
      heading: "Dashboard",
      stats,
      recentOrders: recentOrders.results,
      topProducts: topProducts.results,
      chart
    }
  ));
});
app.get("/admin/san-pham", requireAdmin, async (c) => {
  const db = c.env.DB;
  const q = (c.req.query("q") || "").trim();
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const perPage = 20;
  const where = q ? "p.name LIKE ?" : "1=1";
  const binds = q ? [`%${q}%`] : [];
  const cnt = await db.prepare(`SELECT COUNT(*) n FROM products p WHERE ${where}`).bind(...binds).first();
  const rows = await db.prepare(`SELECT p.*, c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id
    WHERE ${where} ORDER BY p.id DESC LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage).all();
  const cats = await db.prepare("SELECT * FROM categories ORDER BY sort_order").all();
  return c.html(/* @__PURE__ */ jsxDEV(
    AdminProducts,
    {
      user: c.get("user"),
      activeKey: "products",
      heading: "Qu\u1EA3n l\xFD s\u1EA3n ph\u1EA9m",
      products: rows.results,
      categories: cats.results,
      page,
      totalPages: Math.ceil((cnt?.n || 0) / perPage),
      q
    }
  ));
});
app.get("/admin/san-pham/moi", requireAdmin, async (c) => {
  const cats = await c.env.DB.prepare("SELECT * FROM categories ORDER BY sort_order").all();
  return c.html(/* @__PURE__ */ jsxDEV(
    AdminProductForm,
    {
      user: c.get("user"),
      activeKey: "products",
      heading: "Th\xEAm s\u1EA3n ph\u1EA9m",
      product: {},
      categories: cats.results,
      isNew: true
    }
  ));
});
app.get("/admin/san-pham/:id", requireAdmin, async (c) => {
  const db = c.env.DB;
  const p = await db.prepare("SELECT * FROM products WHERE id=?").bind(c.req.param("id")).first();
  if (!p) return c.redirect("/admin/san-pham");
  const cats = await db.prepare("SELECT * FROM categories ORDER BY sort_order").all();
  return c.html(/* @__PURE__ */ jsxDEV(
    AdminProductForm,
    {
      user: c.get("user"),
      activeKey: "products",
      heading: "S\u1EEDa s\u1EA3n ph\u1EA9m",
      product: p,
      categories: cats.results,
      isNew: false
    }
  ));
});
function productFields(b) {
  const toArr = (s) => JSON.stringify(String(s || "").split("\n").map((x) => x.trim()).filter(Boolean));
  return {
    name: (b.name || "").trim(),
    slug: (b.slug || slugify(b.name || "")).trim(),
    category_id: +b.category_id || null,
    short_desc: b.short_desc || "",
    description: b.description || "",
    features: toArr(b.features_text),
    tech_stack: toArr(b.tech_text),
    version: b.version || "v1.0",
    price: +b.price || 0,
    original_price: b.original_price ? +b.original_price : null,
    thumbnail: b.thumbnail || null,
    demo_video_url: b.demo_video_url || null,
    demo_url: b.demo_url || null,
    download_url: b.download_url || null,
    doc_url: b.doc_url || null,
    file_size: b.file_size || null,
    product_type: b.product_type || "source",
    is_featured: b.is_featured ? 1 : 0,
    is_hot: b.is_hot ? 1 : 0,
    is_new: b.is_new ? 1 : 0,
    status: b.status || "published"
  };
}
app.post("/api/admin/products", requireAdmin, async (c) => {
  const f = productFields(await c.req.json());
  if (!f.name || !f.slug) return c.json({ error: "Thi\u1EBFu t\xEAn ho\u1EB7c slug" }, 400);
  const dup = await c.env.DB.prepare("SELECT 1 x FROM products WHERE slug=?").bind(f.slug).first();
  if (dup) return c.json({ error: "Slug \u0111\xE3 t\u1ED3n t\u1EA1i" }, 400);
  await c.env.DB.prepare(`INSERT INTO products
    (name,slug,category_id,short_desc,description,features,tech_stack,version,price,original_price,thumbnail,
     demo_video_url,demo_url,download_url,doc_url,file_size,product_type,is_featured,is_hot,is_new,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    f.name,
    f.slug,
    f.category_id,
    f.short_desc,
    f.description,
    f.features,
    f.tech_stack,
    f.version,
    f.price,
    f.original_price,
    f.thumbnail,
    f.demo_video_url,
    f.demo_url,
    f.download_url,
    f.doc_url,
    f.file_size,
    f.product_type,
    f.is_featured,
    f.is_hot,
    f.is_new,
    f.status
  ).run();
  return c.json({ ok: true, redirect: "/admin/san-pham" });
});
app.post("/api/admin/products/:id/update", requireAdmin, async (c) => {
  const f = productFields(await c.req.json());
  await c.env.DB.prepare(`UPDATE products SET name=?,slug=?,category_id=?,short_desc=?,description=?,features=?,
    tech_stack=?,version=?,price=?,original_price=?,thumbnail=?,demo_video_url=?,demo_url=?,download_url=?,
    doc_url=?,file_size=?,product_type=?,is_featured=?,is_hot=?,is_new=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(
    f.name,
    f.slug,
    f.category_id,
    f.short_desc,
    f.description,
    f.features,
    f.tech_stack,
    f.version,
    f.price,
    f.original_price,
    f.thumbnail,
    f.demo_video_url,
    f.demo_url,
    f.download_url,
    f.doc_url,
    f.file_size,
    f.product_type,
    f.is_featured,
    f.is_hot,
    f.is_new,
    f.status,
    c.req.param("id")
  ).run();
  return c.json({ ok: true, message: "\u0110\xE3 l\u01B0u thay \u0111\u1ED5i!", redirect: "/admin/san-pham" });
});
app.delete("/api/admin/products/:id", requireAdmin, async (c) => {
  const id = c.req.param("id");
  const db = c.env.DB;
  await db.prepare("DELETE FROM cart_items WHERE product_id=?").bind(id).run();
  await db.prepare("DELETE FROM wishlists WHERE product_id=?").bind(id).run();
  await db.prepare("DELETE FROM combo_items WHERE combo_id=? OR product_id=?").bind(id, id).run();
  await db.prepare("DELETE FROM products WHERE id=?").bind(id).run();
  return c.json({ ok: true });
});
app.get("/admin/don-hang", requireAdmin, async (c) => {
  const db = c.env.DB;
  const status = c.req.query("status") || "";
  const q = (c.req.query("q") || "").trim();
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const perPage = 20;
  const w = ["1=1"];
  const binds = [];
  if (status) {
    w.push("o.status=?");
    binds.push(status);
  }
  if (q) {
    w.push("(o.order_code LIKE ? OR u.email LIKE ?)");
    binds.push(`%${q}%`, `%${q}%`);
  }
  const where = w.join(" AND ");
  const cnt = await db.prepare(`SELECT COUNT(*) n FROM orders o JOIN users u ON u.id=o.user_id WHERE ${where}`).bind(...binds).first();
  const rows = await db.prepare(`SELECT o.*, u.full_name, u.email FROM orders o JOIN users u ON u.id=o.user_id
    WHERE ${where} ORDER BY o.id DESC LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage).all();
  return c.html(/* @__PURE__ */ jsxDEV(
    AdminOrders,
    {
      user: c.get("user"),
      activeKey: "orders",
      heading: "Qu\u1EA3n l\xFD \u0111\u01A1n h\xE0ng",
      orders: rows.results,
      page,
      totalPages: Math.ceil((cnt?.n || 0) / perPage),
      status,
      q
    }
  ));
});
app.get("/admin/don-hang/:id", requireAdmin, async (c) => {
  const db = c.env.DB;
  const o = await db.prepare(`SELECT o.*, u.full_name, u.email, u.phone FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?`).bind(c.req.param("id")).first();
  if (!o) return c.redirect("/admin/don-hang");
  const items = await db.prepare(`SELECT oi.*, p.slug FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`).bind(o.id).all();
  return c.html(/* @__PURE__ */ jsxDEV(
    AdminOrderDetail,
    {
      user: c.get("user"),
      activeKey: "orders",
      heading: "Chi ti\u1EBFt \u0111\u01A1n h\xE0ng",
      order: o,
      items: items.results
    }
  ));
});
app.post("/api/admin/orders/:id/status", requireAdmin, async (c) => {
  const db = c.env.DB;
  const { status } = await c.req.json();
  if (!["paid", "cancelled", "refunded"].includes(status)) return c.json({ error: "Tr\u1EA1ng th\xE1i kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
  const o = await db.prepare("SELECT * FROM orders WHERE id=?").bind(c.req.param("id")).first();
  if (!o) return c.json({ error: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng" }, 404);
  if (status === "paid" && o.status !== "paid") {
    await settleOrder(db, o, { paidVia: "admin", paidAmount: o.total });
    return c.json({ ok: true });
  }
  await db.prepare("UPDATE orders SET status=?, paid_at=? WHERE id=?").bind(status, status === "paid" ? (/* @__PURE__ */ new Date()).toISOString() : o.paid_at, o.id).run();
  if (status === "refunded" && o.status === "paid") {
    await db.prepare("DELETE FROM licenses WHERE order_id=?").bind(o.id).run();
    await db.prepare("UPDATE users SET balance=balance+? WHERE id=?").bind(o.total, o.user_id).run();
  }
  return c.json({ ok: true });
});
app.get("/admin/giao-dich", requireAdmin, async (c) => {
  const db = c.env.DB;
  const st = (c.req.query("status") || "").trim();
  const q = (c.req.query("q") || "").trim();
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const perPage = 25;
  const w = ["1=1"];
  const binds = [];
  if (st) {
    w.push("match_status=?");
    binds.push(st);
  }
  if (q) {
    w.push("(content LIKE ? OR matched_order_code LIKE ? OR reference_code LIKE ?)");
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const where = w.join(" AND ");
  const [cnt, rows, stats] = await Promise.all([
    db.prepare(`SELECT COUNT(*) n FROM bank_transactions WHERE ${where}`).bind(...binds).first(),
    db.prepare(`SELECT * FROM bank_transactions WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage).all(),
    db.prepare(`SELECT
        COUNT(*) total,
        COALESCE(SUM(CASE WHEN match_status='matched' THEN 1 ELSE 0 END),0) matched,
        COALESCE(SUM(CASE WHEN match_status='unmatched' THEN 1 ELSE 0 END),0) unmatched,
        COALESCE(SUM(CASE WHEN match_status='amount_mismatch' THEN 1 ELSE 0 END),0) mismatch,
        COALESCE(SUM(CASE WHEN match_status='matched' THEN amount_in ELSE 0 END),0) revenue
      FROM bank_transactions`).first()
  ]);
  return c.html(/* @__PURE__ */ jsxDEV(
    AdminBankTx,
    {
      user: c.get("user"),
      activeKey: "banktx",
      heading: "Giao d\u1ECBch ng\xE2n h\xE0ng",
      txs: rows.results,
      stats,
      page,
      totalPages: Math.ceil((cnt?.n || 0) / perPage),
      status: st,
      q,
      settings: c.get("settings"),
      origin: new URL(c.req.url).origin
    }
  ));
});
app.post("/api/admin/banktx/:id/match", requireAdmin, async (c) => {
  const db = c.env.DB;
  const { order_code } = await c.req.json();
  const tx = await db.prepare("SELECT * FROM bank_transactions WHERE id=?").bind(c.req.param("id")).first();
  if (!tx) return c.json({ error: "Kh\xF4ng t\xECm th\u1EA5y giao d\u1ECBch" }, 404);
  if (tx.match_status === "matched") return c.json({ error: "Giao d\u1ECBch n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u1ED1i so\xE1t" }, 400);
  const o = await db.prepare("SELECT * FROM orders WHERE order_code=?").bind(String(order_code || "").trim().toUpperCase()).first();
  if (!o) return c.json({ error: "M\xE3 \u0111\u01A1n h\xE0ng kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
  if (o.status === "paid") return c.json({ error: "\u0110\u01A1n h\xE0ng n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c thanh to\xE1n" }, 400);
  await settleOrder(db, o, { paidVia: "manual", paidAmount: tx.amount_in, bankTxId: tx.id });
  await db.prepare(
    `UPDATE bank_transactions SET match_status='matched', matched_order_id=?, matched_order_code=?,
     note=COALESCE(note,'') || ' | \u0110\u1ED1i so\xE1t th\u1EE7 c\xF4ng b\u1EDFi admin' WHERE id=?`
  ).bind(o.id, o.order_code, tx.id).run();
  return c.json({ ok: true, message: `\u0110\xE3 g\xE1n giao d\u1ECBch cho \u0111\u01A1n ${o.order_code} v\xE0 c\u1EA5p quy\u1EC1n t\u1EA3i` });
});
app.post("/api/admin/webhook/regenerate-key", requireAdmin, async (c) => {
  const key = genCode("whk_", 32).toLowerCase();
  await c.env.DB.prepare(
    "INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=?"
  ).bind("webhook_api_key", key, key).run();
  return c.json({ ok: true, key, message: "\u0110\xE3 t\u1EA1o API key m\u1EDBi. H\xE3y c\u1EADp nh\u1EADt l\u1EA1i trong dashboard SePay/Casso!" });
});
app.get("/admin/thanh-vien", requireAdmin, async (c) => {
  const db = c.env.DB;
  const q = (c.req.query("q") || "").trim();
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const perPage = 20;
  const where = q ? "(full_name LIKE ? OR email LIKE ?)" : "1=1";
  const binds = q ? [`%${q}%`, `%${q}%`] : [];
  const cnt = await db.prepare(`SELECT COUNT(*) n FROM users WHERE ${where}`).bind(...binds).first();
  const rows = await db.prepare(`SELECT u.*,
    (SELECT COUNT(*) FROM orders WHERE user_id=u.id) order_count,
    (SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=u.id AND status='paid') spent
    FROM users u WHERE ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage).all();
  return c.html(/* @__PURE__ */ jsxDEV(
    AdminUsers,
    {
      user: c.get("user"),
      activeKey: "users",
      heading: "Qu\u1EA3n l\xFD th\xE0nh vi\xEAn",
      users: rows.results,
      page,
      totalPages: Math.ceil((cnt?.n || 0) / perPage),
      q
    }
  ));
});
app.post("/api/admin/users/:id/action", requireAdmin, async (c) => {
  const db = c.env.DB;
  const { action } = await c.req.json();
  const id = +c.req.param("id");
  const me = c.get("user");
  if (id === me.id) return c.json({ error: "Kh\xF4ng th\u1EC3 thao t\xE1c tr\xEAn ch\xEDnh t\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n" }, 400);
  const u = await db.prepare("SELECT * FROM users WHERE id=?").bind(id).first();
  if (!u) return c.json({ error: "Kh\xF4ng t\xECm th\u1EA5y th\xE0nh vi\xEAn" }, 404);
  if (action === "toggle-status") {
    await db.prepare("UPDATE users SET status=? WHERE id=?").bind(u.status === "active" ? "banned" : "active", id).run();
  } else if (action === "toggle-role") {
    await db.prepare("UPDATE users SET role=? WHERE id=?").bind(u.role === "admin" ? "user" : "admin", id).run();
  } else return c.json({ error: "H\xE0nh \u0111\u1ED9ng kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
  return c.json({ ok: true });
});
app.get("/admin/danh-muc", requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id=c.id) product_count
    FROM categories c ORDER BY c.sort_order`).all();
  return c.html(/* @__PURE__ */ jsxDEV(AdminCategories, { user: c.get("user"), activeKey: "categories", heading: "Qu\u1EA3n l\xFD danh m\u1EE5c", categories: rows.results }));
});
app.post("/api/admin/categories", requireAdmin, async (c) => {
  const b = await c.req.json();
  const slug = (b.slug || slugify(b.name || "")).trim();
  if (!b.name?.trim() || !slug) return c.json({ error: "Thi\u1EBFu t\xEAn ho\u1EB7c slug" }, 400);
  const dup = await c.env.DB.prepare("SELECT 1 x FROM categories WHERE slug=?").bind(slug).first();
  if (dup) return c.json({ error: "Slug \u0111\xE3 t\u1ED3n t\u1EA1i" }, 400);
  await c.env.DB.prepare("INSERT INTO categories (slug,name,description,icon) VALUES (?,?,?,?)").bind(slug, b.name.trim(), b.description || "", b.icon || "fa-cube").run();
  return c.json({ ok: true, message: "\u0110\xE3 th\xEAm danh m\u1EE5c!" });
});
app.delete("/api/admin/categories/:id", requireAdmin, async (c) => {
  const n = await c.env.DB.prepare("SELECT COUNT(*) n FROM products WHERE category_id=?").bind(c.req.param("id")).first();
  if (n?.n > 0) return c.json({ error: `C\xF2n ${n.n} s\u1EA3n ph\u1EA9m trong danh m\u1EE5c n\xE0y` }, 400);
  await c.env.DB.prepare("DELETE FROM categories WHERE id=?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});
app.get("/admin/ma-giam-gia", requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare("SELECT * FROM coupons ORDER BY id DESC").all();
  return c.html(/* @__PURE__ */ jsxDEV(AdminCoupons, { user: c.get("user"), activeKey: "coupons", heading: "M\xE3 gi\u1EA3m gi\xE1", coupons: rows.results }));
});
app.post("/api/admin/coupons", requireAdmin, async (c) => {
  const b = await c.req.json();
  const code = (b.code || "").trim().toUpperCase();
  if (!code || !b.value) return c.json({ error: "Thi\u1EBFu m\xE3 ho\u1EB7c gi\xE1 tr\u1ECB" }, 400);
  const dup = await c.env.DB.prepare("SELECT 1 x FROM coupons WHERE code=?").bind(code).first();
  if (dup) return c.json({ error: "M\xE3 n\xE0y \u0111\xE3 t\u1ED3n t\u1EA1i" }, 400);
  await c.env.DB.prepare("INSERT INTO coupons (code,type,value,min_order,max_uses,expires_at) VALUES (?,?,?,?,?,?)").bind(code, b.type || "percent", +b.value, +b.min_order || 0, +b.max_uses || 0, b.expires_at || null).run();
  return c.json({ ok: true, message: "\u0110\xE3 t\u1EA1o m\xE3 gi\u1EA3m gi\xE1!" });
});
app.delete("/api/admin/coupons/:id", requireAdmin, async (c) => {
  await c.env.DB.prepare("DELETE FROM coupons WHERE id=?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});
app.get("/admin/bai-viet", requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare("SELECT * FROM posts ORDER BY id DESC").all();
  return c.html(/* @__PURE__ */ jsxDEV(AdminPosts, { user: c.get("user"), activeKey: "posts", heading: "Qu\u1EA3n l\xFD b\xE0i vi\u1EBFt", posts: rows.results }));
});
app.post("/api/admin/posts", requireAdmin, async (c) => {
  const b = await c.req.json();
  const slug = (b.slug || slugify(b.title || "")).trim();
  if (!b.title?.trim() || !slug) return c.json({ error: "Thi\u1EBFu ti\xEAu \u0111\u1EC1 ho\u1EB7c slug" }, 400);
  const dup = await c.env.DB.prepare("SELECT 1 x FROM posts WHERE slug=?").bind(slug).first();
  if (dup) return c.json({ error: "Slug \u0111\xE3 t\u1ED3n t\u1EA1i" }, 400);
  await c.env.DB.prepare("INSERT INTO posts (slug,title,excerpt,content,tags) VALUES (?,?,?,?,?)").bind(slug, b.title.trim(), b.excerpt || "", b.content || "", b.tags || "").run();
  return c.json({ ok: true, message: "\u0110\xE3 \u0111\u0103ng b\xE0i!" });
});
app.delete("/api/admin/posts/:id", requireAdmin, async (c) => {
  await c.env.DB.prepare("DELETE FROM posts WHERE id=?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});
app.get("/admin/danh-gia", requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare(`SELECT r.*, u.full_name, u.email, p.name product_name
    FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id ORDER BY r.id DESC LIMIT 100`).all();
  return c.html(/* @__PURE__ */ jsxDEV(AdminReviews, { user: c.get("user"), activeKey: "reviews", heading: "Qu\u1EA3n l\xFD \u0111\xE1nh gi\xE1", reviews: rows.results }));
});
app.delete("/api/admin/reviews/:id", requireAdmin, async (c) => {
  const db = c.env.DB;
  const r = await db.prepare("SELECT product_id FROM reviews WHERE id=?").bind(c.req.param("id")).first();
  await db.prepare("DELETE FROM reviews WHERE id=?").bind(c.req.param("id")).run();
  if (r) {
    const agg = await db.prepare(`SELECT AVG(rating) a, COUNT(*) n FROM reviews WHERE product_id=?`).bind(r.product_id).first();
    await db.prepare("UPDATE products SET rating=?, rating_count=? WHERE id=?").bind(Math.round((agg?.a || 5) * 10) / 10, agg?.n || 0, r.product_id).run();
  }
  return c.json({ ok: true });
});
app.get("/admin/ho-tro", requireAdmin, async (c) => {
  const rows = await c.env.DB.prepare("SELECT * FROM tickets ORDER BY id DESC LIMIT 100").all();
  return c.html(/* @__PURE__ */ jsxDEV(AdminTickets, { user: c.get("user"), activeKey: "tickets", heading: "Y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3", tickets: rows.results }));
});
app.post("/api/admin/tickets/:id/close", requireAdmin, async (c) => {
  await c.env.DB.prepare(`UPDATE tickets SET status='closed' WHERE id=?`).bind(c.req.param("id")).run();
  return c.json({ ok: true });
});
app.get("/admin/cai-dat", requireAdmin, (c) => c.html(/* @__PURE__ */ jsxDEV(AdminSettings, { user: c.get("user"), activeKey: "settings", heading: "C\xE0i \u0111\u1EB7t h\u1EC7 th\u1ED1ng", settings: c.get("settings") })));
app.post("/api/admin/settings", requireAdmin, async (c) => {
  const b = await c.req.json();
  for (const [k, v] of Object.entries(b)) {
    await c.env.DB.prepare("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=?").bind(k, String(v), String(v)).run();
  }
  return c.json({ ok: true, message: "\u0110\xE3 l\u01B0u c\xE0i \u0111\u1EB7t!" });
});
app.get("/robots.txt", (c) => {
  const origin = new URL(c.req.url).origin;
  return c.text(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /tai-khoan
Disallow: /api

Sitemap: ${origin}/sitemap.xml`);
});
app.get("/sitemap.xml", async (c) => {
  const origin = new URL(c.req.url).origin;
  const db = c.env.DB;
  const [prods, cats, posts] = await Promise.all([
    db.prepare(`SELECT slug, updated_at FROM products WHERE status='published'`).all(),
    db.prepare("SELECT slug FROM categories").all(),
    db.prepare(`SELECT slug, created_at FROM posts WHERE status='published'`).all()
  ]);
  const urls = [
    ["", "1.0", "daily"],
    ["/san-pham", "0.9", "daily"],
    ["/combo", "0.8", "weekly"],
    ["/bang-gia", "0.8", "weekly"],
    ["/blog", "0.8", "daily"],
    ["/affiliate", "0.6", "monthly"],
    ["/gioi-thieu", "0.6", "monthly"],
    ["/lien-he", "0.5", "monthly"]
  ].map(([p, pr, cf]) => `<url><loc>${origin}${p}/</loc><priority>${pr}</priority><changefreq>${cf}</changefreq></url>`);
  for (const x of cats.results) urls.push(`<url><loc>${origin}/danh-muc/${x.slug}</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>`);
  for (const x of prods.results) urls.push(`<url><loc>${origin}/san-pham/${x.slug}</loc><priority>0.7</priority><changefreq>weekly</changefreq></url>`);
  for (const x of posts.results) urls.push(`<url><loc>${origin}/blog/${x.slug}</loc><priority>0.6</priority><changefreq>monthly</changefreq></url>`);
  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`,
    200,
    { "Content-Type": "application/xml; charset=utf-8" }
  );
});
app.notFound((c) => c.html(/* @__PURE__ */ jsxDEV(NotFoundPage, { ...base(c) }), 404));
app.onError((err, c) => {
  console.error("[ERROR]", err);
  if (c.req.path.startsWith("/api/")) return c.json({ error: "L\u1ED7i h\u1EC7 th\u1ED1ng, vui l\xF2ng th\u1EED l\u1EA1i" }, 500);
  return c.html(/* @__PURE__ */ jsxDEV(NotFoundPage, { ...base(c) }), 500);
});
var src_default = app;

// api/index.ts
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
async function handler(req, res) {
  try {
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const url = new URL(req.url || "/", `${proto}://${host}`);
    const method = (req.method || "GET").toUpperCase();
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v === void 0 || k === "content-length") continue;
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, String(x)));
      else headers.set(k, String(v));
    }
    const rawBody = method === "GET" || method === "HEAD" ? void 0 : await readBody(req);
    const request = new Request(url.toString(), {
      method,
      headers,
      body: rawBody && rawBody.length ? rawBody : void 0
    });
    const env = { ...process.env };
    const response = await src_default.fetch(request, env);
    res.statusCode = response.status;
    const setCookies = response.headers.getSetCookie?.();
    response.headers.forEach((v, k) => {
      const lk = k.toLowerCase();
      if (lk === "set-cookie" || lk === "content-encoding" || lk === "content-length") return;
      res.setHeader(k, v);
    });
    if (setCookies && setCookies.length) res.setHeader("set-cookie", setCookies);
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } catch (e) {
    console.error("[vercel-handler]", e);
    if (!res.headersSent) res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
export {
  handler as default
};
