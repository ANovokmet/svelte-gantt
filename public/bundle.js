var app = (function () {
	'use strict';

	function noop() {}

	function assign(tar, src) {
		for (var k in src) tar[k] = src[k];
		return tar;
	}

	function assignTrue(tar, src) {
		for (var k in src) tar[k] = 1;
		return tar;
	}

	function callAfter(fn, i) {
		if (i === 0) fn();
		return () => {
			if (!--i) fn();
		};
	}

	function addLoc(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function appendNode(node, target) {
		target.appendChild(node);
	}

	function insertNode(node, target, anchor) {
		target.insertBefore(node, anchor);
	}

	function detachNode(node) {
		node.parentNode.removeChild(node);
	}

	function destroyEach(iterations, detach) {
		for (var i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detach);
		}
	}

	function createElement(name) {
		return document.createElement(name);
	}

	function createSvgElement(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	function createText(data) {
		return document.createTextNode(data);
	}

	function createComment() {
		return document.createComment('');
	}

	function addListener(node, event, handler) {
		node.addEventListener(event, handler, false);
	}

	function removeListener(node, event, handler) {
		node.removeEventListener(event, handler, false);
	}

	function setAttribute(node, attribute, value) {
		node.setAttribute(attribute, value);
	}

	function setData(text, data) {
		text.data = '' + data;
	}

	function setStyle(node, key, value) {
		node.style.setProperty(key, value);
	}

	function destroyBlock(block, lookup) {
		block.d(1);
		lookup[block.key] = null;
	}

	function outroAndDestroyBlock(block, lookup) {
		block.o(function() {
			destroyBlock(block, lookup);
		});
	}

	function updateKeyedEach(old_blocks, component, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, intro_method, next, get_context) {
		var o = old_blocks.length;
		var n = list.length;

		var i = o;
		var old_indexes = {};
		while (i--) old_indexes[old_blocks[i].key] = i;

		var new_blocks = [];
		var new_lookup = {};
		var deltas = {};

		var i = n;
		while (i--) {
			var child_ctx = get_context(ctx, list, i);
			var key = get_key(child_ctx);
			var block = lookup[key];

			if (!block) {
				block = create_each_block(component, key, child_ctx);
				block.c();
			} else if (dynamic) {
				block.p(changed, child_ctx);
			}

			new_blocks[i] = new_lookup[key] = block;

			if (key in old_indexes) deltas[key] = Math.abs(i - old_indexes[key]);
		}

		var will_move = {};
		var did_move = {};

		function insert(block) {
			block[intro_method](node, next);
			lookup[block.key] = block;
			next = block.first;
			n--;
		}

		while (o && n) {
			var new_block = new_blocks[n - 1];
			var old_block = old_blocks[o - 1];
			var new_key = new_block.key;
			var old_key = old_block.key;

			if (new_block === old_block) {
				// do nothing
				next = new_block.first;
				o--;
				n--;
			}

			else if (!new_lookup[old_key]) {
				// remove old block
				destroy(old_block, lookup);
				o--;
			}

			else if (!lookup[new_key] || will_move[new_key]) {
				insert(new_block);
			}

			else if (did_move[old_key]) {
				o--;

			} else if (deltas[new_key] > deltas[old_key]) {
				did_move[new_key] = true;
				insert(new_block);

			} else {
				will_move[old_key] = true;
				o--;
			}
		}

		while (o--) {
			var old_block = old_blocks[o];
			if (!new_lookup[old_block.key]) destroy(old_block, lookup);
		}

		while (n) insert(new_blocks[n - 1]);

		return new_blocks;
	}

	function blankObject() {
		return Object.create(null);
	}

	function destroy(detach) {
		this.destroy = noop;
		this.fire('destroy');
		this.set = noop;

		this._fragment.d(detach !== false);
		this._fragment = null;
		this._state = {};
	}

	function destroyDev(detach) {
		destroy.call(this, detach);
		this.destroy = function() {
			console.warn('Component was already destroyed');
		};
	}

	function _differs(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function _differsImmutable(a, b) {
		return a != a ? b == b : a !== b;
	}

	function fire(eventName, data) {
		var handlers =
			eventName in this._handlers && this._handlers[eventName].slice();
		if (!handlers) return;

		for (var i = 0; i < handlers.length; i += 1) {
			var handler = handlers[i];

			if (!handler.__calling) {
				try {
					handler.__calling = true;
					handler.call(this, data);
				} finally {
					handler.__calling = false;
				}
			}
		}
	}

	function get() {
		return this._state;
	}

	function init(component, options) {
		component._handlers = blankObject();
		component._bind = options._bind;

		component.options = options;
		component.root = options.root || component;
		component.store = options.store || component.root.store;
	}

	function on(eventName, handler) {
		var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
		handlers.push(handler);

		return {
			cancel: function() {
				var index = handlers.indexOf(handler);
				if (~index) handlers.splice(index, 1);
			}
		};
	}

	function run(fn) {
		fn();
	}

	function set(newState) {
		this._set(assign({}, newState));
		if (this.root._lock) return;
		this.root._lock = true;
		callAll(this.root._beforecreate);
		callAll(this.root._oncreate);
		callAll(this.root._aftercreate);
		this.root._lock = false;
	}

	function _set(newState) {
		var oldState = this._state,
			changed = {},
			dirty = false;

		for (var key in newState) {
			if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
		}
		if (!dirty) return;

		this._state = assign(assign({}, oldState), newState);
		this._recompute(changed, this._state);
		if (this._bind) this._bind(changed, this._state);

		if (this._fragment) {
			this.fire("state", { changed: changed, current: this._state, previous: oldState });
			this._fragment.p(changed, this._state);
			this.fire("update", { changed: changed, current: this._state, previous: oldState });
		}
	}

	function setDev(newState) {
		if (typeof newState !== 'object') {
			throw new Error(
				this._debugName + '.set was called without an object of data key-values to update.'
			);
		}

		this._checkReadOnly(newState);
		set.call(this, newState);
	}

	function callAll(fns) {
		while (fns && fns.length) fns.shift()();
	}

	function _mount(target, anchor) {
		this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
	}

	function removeFromStore() {
		this.store._remove(this);
	}

	var protoDev = {
		destroy: destroyDev,
		get,
		fire,
		on,
		set: setDev,
		_recompute: noop,
		_set,
		_mount,
		_differs
	};

	var hookCallback;

	function hooks () {
	    return hookCallback.apply(null, arguments);
	}

	// This is done to register the method called with moment()
	// without creating circular dependencies.
	function setHookCallback (callback) {
	    hookCallback = callback;
	}

	function isArray(input) {
	    return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
	}

	function isObject(input) {
	    // IE8 will treat undefined and null as object if it wasn't for
	    // input != null
	    return input != null && Object.prototype.toString.call(input) === '[object Object]';
	}

	function isObjectEmpty(obj) {
	    if (Object.getOwnPropertyNames) {
	        return (Object.getOwnPropertyNames(obj).length === 0);
	    } else {
	        var k;
	        for (k in obj) {
	            if (obj.hasOwnProperty(k)) {
	                return false;
	            }
	        }
	        return true;
	    }
	}

	function isUndefined(input) {
	    return input === void 0;
	}

	function isNumber(input) {
	    return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
	}

	function isDate(input) {
	    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
	}

	function map(arr, fn) {
	    var res = [], i;
	    for (i = 0; i < arr.length; ++i) {
	        res.push(fn(arr[i], i));
	    }
	    return res;
	}

	function hasOwnProp(a, b) {
	    return Object.prototype.hasOwnProperty.call(a, b);
	}

	function extend(a, b) {
	    for (var i in b) {
	        if (hasOwnProp(b, i)) {
	            a[i] = b[i];
	        }
	    }

	    if (hasOwnProp(b, 'toString')) {
	        a.toString = b.toString;
	    }

	    if (hasOwnProp(b, 'valueOf')) {
	        a.valueOf = b.valueOf;
	    }

	    return a;
	}

	function createUTC (input, format, locale, strict) {
	    return createLocalOrUTC(input, format, locale, strict, true).utc();
	}

	function defaultParsingFlags() {
	    // We need to deep clone this object.
	    return {
	        empty           : false,
	        unusedTokens    : [],
	        unusedInput     : [],
	        overflow        : -2,
	        charsLeftOver   : 0,
	        nullInput       : false,
	        invalidMonth    : null,
	        invalidFormat   : false,
	        userInvalidated : false,
	        iso             : false,
	        parsedDateParts : [],
	        meridiem        : null,
	        rfc2822         : false,
	        weekdayMismatch : false
	    };
	}

	function getParsingFlags(m) {
	    if (m._pf == null) {
	        m._pf = defaultParsingFlags();
	    }
	    return m._pf;
	}

	var some;
	if (Array.prototype.some) {
	    some = Array.prototype.some;
	} else {
	    some = function (fun) {
	        var t = Object(this);
	        var len = t.length >>> 0;

	        for (var i = 0; i < len; i++) {
	            if (i in t && fun.call(this, t[i], i, t)) {
	                return true;
	            }
	        }

	        return false;
	    };
	}

	function isValid(m) {
	    if (m._isValid == null) {
	        var flags = getParsingFlags(m);
	        var parsedParts = some.call(flags.parsedDateParts, function (i) {
	            return i != null;
	        });
	        var isNowValid = !isNaN(m._d.getTime()) &&
	            flags.overflow < 0 &&
	            !flags.empty &&
	            !flags.invalidMonth &&
	            !flags.invalidWeekday &&
	            !flags.weekdayMismatch &&
	            !flags.nullInput &&
	            !flags.invalidFormat &&
	            !flags.userInvalidated &&
	            (!flags.meridiem || (flags.meridiem && parsedParts));

	        if (m._strict) {
	            isNowValid = isNowValid &&
	                flags.charsLeftOver === 0 &&
	                flags.unusedTokens.length === 0 &&
	                flags.bigHour === undefined;
	        }

	        if (Object.isFrozen == null || !Object.isFrozen(m)) {
	            m._isValid = isNowValid;
	        }
	        else {
	            return isNowValid;
	        }
	    }
	    return m._isValid;
	}

	function createInvalid (flags) {
	    var m = createUTC(NaN);
	    if (flags != null) {
	        extend(getParsingFlags(m), flags);
	    }
	    else {
	        getParsingFlags(m).userInvalidated = true;
	    }

	    return m;
	}

	// Plugins that add properties should also add the key here (null value),
	// so we can properly clone ourselves.
	var momentProperties = hooks.momentProperties = [];

	function copyConfig(to, from) {
	    var i, prop, val;

	    if (!isUndefined(from._isAMomentObject)) {
	        to._isAMomentObject = from._isAMomentObject;
	    }
	    if (!isUndefined(from._i)) {
	        to._i = from._i;
	    }
	    if (!isUndefined(from._f)) {
	        to._f = from._f;
	    }
	    if (!isUndefined(from._l)) {
	        to._l = from._l;
	    }
	    if (!isUndefined(from._strict)) {
	        to._strict = from._strict;
	    }
	    if (!isUndefined(from._tzm)) {
	        to._tzm = from._tzm;
	    }
	    if (!isUndefined(from._isUTC)) {
	        to._isUTC = from._isUTC;
	    }
	    if (!isUndefined(from._offset)) {
	        to._offset = from._offset;
	    }
	    if (!isUndefined(from._pf)) {
	        to._pf = getParsingFlags(from);
	    }
	    if (!isUndefined(from._locale)) {
	        to._locale = from._locale;
	    }

	    if (momentProperties.length > 0) {
	        for (i = 0; i < momentProperties.length; i++) {
	            prop = momentProperties[i];
	            val = from[prop];
	            if (!isUndefined(val)) {
	                to[prop] = val;
	            }
	        }
	    }

	    return to;
	}

	var updateInProgress = false;

	// Moment prototype object
	function Moment(config) {
	    copyConfig(this, config);
	    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
	    if (!this.isValid()) {
	        this._d = new Date(NaN);
	    }
	    // Prevent infinite loop in case updateOffset creates new moment
	    // objects.
	    if (updateInProgress === false) {
	        updateInProgress = true;
	        hooks.updateOffset(this);
	        updateInProgress = false;
	    }
	}

	function isMoment (obj) {
	    return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
	}

	function absFloor (number) {
	    if (number < 0) {
	        // -0 -> 0
	        return Math.ceil(number) || 0;
	    } else {
	        return Math.floor(number);
	    }
	}

	function toInt(argumentForCoercion) {
	    var coercedNumber = +argumentForCoercion,
	        value = 0;

	    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
	        value = absFloor(coercedNumber);
	    }

	    return value;
	}

	// compare two arrays, return the number of differences
	function compareArrays(array1, array2, dontConvert) {
	    var len = Math.min(array1.length, array2.length),
	        lengthDiff = Math.abs(array1.length - array2.length),
	        diffs = 0,
	        i;
	    for (i = 0; i < len; i++) {
	        if ((dontConvert && array1[i] !== array2[i]) ||
	            (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
	            diffs++;
	        }
	    }
	    return diffs + lengthDiff;
	}

	function warn(msg) {
	    if (hooks.suppressDeprecationWarnings === false &&
	            (typeof console !==  'undefined') && console.warn) {
	        console.warn('Deprecation warning: ' + msg);
	    }
	}

	function deprecate(msg, fn) {
	    var firstTime = true;

	    return extend(function () {
	        if (hooks.deprecationHandler != null) {
	            hooks.deprecationHandler(null, msg);
	        }
	        if (firstTime) {
	            var args = [];
	            var arg;
	            for (var i = 0; i < arguments.length; i++) {
	                arg = '';
	                if (typeof arguments[i] === 'object') {
	                    arg += '\n[' + i + '] ';
	                    for (var key in arguments[0]) {
	                        arg += key + ': ' + arguments[0][key] + ', ';
	                    }
	                    arg = arg.slice(0, -2); // Remove trailing comma and space
	                } else {
	                    arg = arguments[i];
	                }
	                args.push(arg);
	            }
	            warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
	            firstTime = false;
	        }
	        return fn.apply(this, arguments);
	    }, fn);
	}

	var deprecations = {};

	function deprecateSimple(name, msg) {
	    if (hooks.deprecationHandler != null) {
	        hooks.deprecationHandler(name, msg);
	    }
	    if (!deprecations[name]) {
	        warn(msg);
	        deprecations[name] = true;
	    }
	}

	hooks.suppressDeprecationWarnings = false;
	hooks.deprecationHandler = null;

	function isFunction(input) {
	    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
	}

	function set$1 (config) {
	    var prop, i;
	    for (i in config) {
	        prop = config[i];
	        if (isFunction(prop)) {
	            this[i] = prop;
	        } else {
	            this['_' + i] = prop;
	        }
	    }
	    this._config = config;
	    // Lenient ordinal parsing accepts just a number in addition to
	    // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
	    // TODO: Remove "ordinalParse" fallback in next major release.
	    this._dayOfMonthOrdinalParseLenient = new RegExp(
	        (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
	            '|' + (/\d{1,2}/).source);
	}

	function mergeConfigs(parentConfig, childConfig) {
	    var res = extend({}, parentConfig), prop;
	    for (prop in childConfig) {
	        if (hasOwnProp(childConfig, prop)) {
	            if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
	                res[prop] = {};
	                extend(res[prop], parentConfig[prop]);
	                extend(res[prop], childConfig[prop]);
	            } else if (childConfig[prop] != null) {
	                res[prop] = childConfig[prop];
	            } else {
	                delete res[prop];
	            }
	        }
	    }
	    for (prop in parentConfig) {
	        if (hasOwnProp(parentConfig, prop) &&
	                !hasOwnProp(childConfig, prop) &&
	                isObject(parentConfig[prop])) {
	            // make sure changes to properties don't modify parent config
	            res[prop] = extend({}, res[prop]);
	        }
	    }
	    return res;
	}

	function Locale(config) {
	    if (config != null) {
	        this.set(config);
	    }
	}

	var keys;

	if (Object.keys) {
	    keys = Object.keys;
	} else {
	    keys = function (obj) {
	        var i, res = [];
	        for (i in obj) {
	            if (hasOwnProp(obj, i)) {
	                res.push(i);
	            }
	        }
	        return res;
	    };
	}

	var defaultCalendar = {
	    sameDay : '[Today at] LT',
	    nextDay : '[Tomorrow at] LT',
	    nextWeek : 'dddd [at] LT',
	    lastDay : '[Yesterday at] LT',
	    lastWeek : '[Last] dddd [at] LT',
	    sameElse : 'L'
	};

	function calendar (key, mom, now) {
	    var output = this._calendar[key] || this._calendar['sameElse'];
	    return isFunction(output) ? output.call(mom, now) : output;
	}

	var defaultLongDateFormat = {
	    LTS  : 'h:mm:ss A',
	    LT   : 'h:mm A',
	    L    : 'MM/DD/YYYY',
	    LL   : 'MMMM D, YYYY',
	    LLL  : 'MMMM D, YYYY h:mm A',
	    LLLL : 'dddd, MMMM D, YYYY h:mm A'
	};

	function longDateFormat (key) {
	    var format = this._longDateFormat[key],
	        formatUpper = this._longDateFormat[key.toUpperCase()];

	    if (format || !formatUpper) {
	        return format;
	    }

	    this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
	        return val.slice(1);
	    });

	    return this._longDateFormat[key];
	}

	var defaultInvalidDate = 'Invalid date';

	function invalidDate () {
	    return this._invalidDate;
	}

	var defaultOrdinal = '%d';
	var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

	function ordinal (number) {
	    return this._ordinal.replace('%d', number);
	}

	var defaultRelativeTime = {
	    future : 'in %s',
	    past   : '%s ago',
	    s  : 'a few seconds',
	    ss : '%d seconds',
	    m  : 'a minute',
	    mm : '%d minutes',
	    h  : 'an hour',
	    hh : '%d hours',
	    d  : 'a day',
	    dd : '%d days',
	    M  : 'a month',
	    MM : '%d months',
	    y  : 'a year',
	    yy : '%d years'
	};

	function relativeTime (number, withoutSuffix, string, isFuture) {
	    var output = this._relativeTime[string];
	    return (isFunction(output)) ?
	        output(number, withoutSuffix, string, isFuture) :
	        output.replace(/%d/i, number);
	}

	function pastFuture (diff, output) {
	    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
	    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
	}

	var aliases = {};

	function addUnitAlias (unit, shorthand) {
	    var lowerCase = unit.toLowerCase();
	    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
	}

	function normalizeUnits(units) {
	    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
	}

	function normalizeObjectUnits(inputObject) {
	    var normalizedInput = {},
	        normalizedProp,
	        prop;

	    for (prop in inputObject) {
	        if (hasOwnProp(inputObject, prop)) {
	            normalizedProp = normalizeUnits(prop);
	            if (normalizedProp) {
	                normalizedInput[normalizedProp] = inputObject[prop];
	            }
	        }
	    }

	    return normalizedInput;
	}

	var priorities = {};

	function addUnitPriority(unit, priority) {
	    priorities[unit] = priority;
	}

	function getPrioritizedUnits(unitsObj) {
	    var units = [];
	    for (var u in unitsObj) {
	        units.push({unit: u, priority: priorities[u]});
	    }
	    units.sort(function (a, b) {
	        return a.priority - b.priority;
	    });
	    return units;
	}

	function zeroFill(number, targetLength, forceSign) {
	    var absNumber = '' + Math.abs(number),
	        zerosToFill = targetLength - absNumber.length,
	        sign = number >= 0;
	    return (sign ? (forceSign ? '+' : '') : '-') +
	        Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
	}

	var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

	var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

	var formatFunctions = {};

	var formatTokenFunctions = {};

	// token:    'M'
	// padded:   ['MM', 2]
	// ordinal:  'Mo'
	// callback: function () { this.month() + 1 }
	function addFormatToken (token, padded, ordinal, callback) {
	    var func = callback;
	    if (typeof callback === 'string') {
	        func = function () {
	            return this[callback]();
	        };
	    }
	    if (token) {
	        formatTokenFunctions[token] = func;
	    }
	    if (padded) {
	        formatTokenFunctions[padded[0]] = function () {
	            return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
	        };
	    }
	    if (ordinal) {
	        formatTokenFunctions[ordinal] = function () {
	            return this.localeData().ordinal(func.apply(this, arguments), token);
	        };
	    }
	}

	function removeFormattingTokens(input) {
	    if (input.match(/\[[\s\S]/)) {
	        return input.replace(/^\[|\]$/g, '');
	    }
	    return input.replace(/\\/g, '');
	}

	function makeFormatFunction(format) {
	    var array = format.match(formattingTokens), i, length;

	    for (i = 0, length = array.length; i < length; i++) {
	        if (formatTokenFunctions[array[i]]) {
	            array[i] = formatTokenFunctions[array[i]];
	        } else {
	            array[i] = removeFormattingTokens(array[i]);
	        }
	    }

	    return function (mom) {
	        var output = '', i;
	        for (i = 0; i < length; i++) {
	            output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
	        }
	        return output;
	    };
	}

	// format date using native date object
	function formatMoment(m, format) {
	    if (!m.isValid()) {
	        return m.localeData().invalidDate();
	    }

	    format = expandFormat(format, m.localeData());
	    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

	    return formatFunctions[format](m);
	}

	function expandFormat(format, locale) {
	    var i = 5;

	    function replaceLongDateFormatTokens(input) {
	        return locale.longDateFormat(input) || input;
	    }

	    localFormattingTokens.lastIndex = 0;
	    while (i >= 0 && localFormattingTokens.test(format)) {
	        format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
	        localFormattingTokens.lastIndex = 0;
	        i -= 1;
	    }

	    return format;
	}

	var match1         = /\d/;            //       0 - 9
	var match2         = /\d\d/;          //      00 - 99
	var match3         = /\d{3}/;         //     000 - 999
	var match4         = /\d{4}/;         //    0000 - 9999
	var match6         = /[+-]?\d{6}/;    // -999999 - 999999
	var match1to2      = /\d\d?/;         //       0 - 99
	var match3to4      = /\d\d\d\d?/;     //     999 - 9999
	var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
	var match1to3      = /\d{1,3}/;       //       0 - 999
	var match1to4      = /\d{1,4}/;       //       0 - 9999
	var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

	var matchUnsigned  = /\d+/;           //       0 - inf
	var matchSigned    = /[+-]?\d+/;      //    -inf - inf

	var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
	var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

	var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

	// any word (or two) characters or numbers including two/three word month in arabic.
	// includes scottish gaelic two word and hyphenated months
	var matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;

	var regexes = {};

	function addRegexToken (token, regex, strictRegex) {
	    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
	        return (isStrict && strictRegex) ? strictRegex : regex;
	    };
	}

	function getParseRegexForToken (token, config) {
	    if (!hasOwnProp(regexes, token)) {
	        return new RegExp(unescapeFormat(token));
	    }

	    return regexes[token](config._strict, config._locale);
	}

	// Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
	function unescapeFormat(s) {
	    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
	        return p1 || p2 || p3 || p4;
	    }));
	}

	function regexEscape(s) {
	    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}

	var tokens = {};

	function addParseToken (token, callback) {
	    var i, func = callback;
	    if (typeof token === 'string') {
	        token = [token];
	    }
	    if (isNumber(callback)) {
	        func = function (input, array) {
	            array[callback] = toInt(input);
	        };
	    }
	    for (i = 0; i < token.length; i++) {
	        tokens[token[i]] = func;
	    }
	}

	function addWeekParseToken (token, callback) {
	    addParseToken(token, function (input, array, config, token) {
	        config._w = config._w || {};
	        callback(input, config._w, config, token);
	    });
	}

	function addTimeToArrayFromToken(token, input, config) {
	    if (input != null && hasOwnProp(tokens, token)) {
	        tokens[token](input, config._a, config, token);
	    }
	}

	var YEAR = 0;
	var MONTH = 1;
	var DATE = 2;
	var HOUR = 3;
	var MINUTE = 4;
	var SECOND = 5;
	var MILLISECOND = 6;
	var WEEK = 7;
	var WEEKDAY = 8;

	// FORMATTING

	addFormatToken('Y', 0, 0, function () {
	    var y = this.year();
	    return y <= 9999 ? '' + y : '+' + y;
	});

	addFormatToken(0, ['YY', 2], 0, function () {
	    return this.year() % 100;
	});

	addFormatToken(0, ['YYYY',   4],       0, 'year');
	addFormatToken(0, ['YYYYY',  5],       0, 'year');
	addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

	// ALIASES

	addUnitAlias('year', 'y');

	// PRIORITIES

	addUnitPriority('year', 1);

	// PARSING

	addRegexToken('Y',      matchSigned);
	addRegexToken('YY',     match1to2, match2);
	addRegexToken('YYYY',   match1to4, match4);
	addRegexToken('YYYYY',  match1to6, match6);
	addRegexToken('YYYYYY', match1to6, match6);

	addParseToken(['YYYYY', 'YYYYYY'], YEAR);
	addParseToken('YYYY', function (input, array) {
	    array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
	});
	addParseToken('YY', function (input, array) {
	    array[YEAR] = hooks.parseTwoDigitYear(input);
	});
	addParseToken('Y', function (input, array) {
	    array[YEAR] = parseInt(input, 10);
	});

	// HELPERS

	function daysInYear(year) {
	    return isLeapYear(year) ? 366 : 365;
	}

	function isLeapYear(year) {
	    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
	}

	// HOOKS

	hooks.parseTwoDigitYear = function (input) {
	    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
	};

	// MOMENTS

	var getSetYear = makeGetSet('FullYear', true);

	function getIsLeapYear () {
	    return isLeapYear(this.year());
	}

	function makeGetSet (unit, keepTime) {
	    return function (value) {
	        if (value != null) {
	            set$2(this, unit, value);
	            hooks.updateOffset(this, keepTime);
	            return this;
	        } else {
	            return get$1(this, unit);
	        }
	    };
	}

	function get$1 (mom, unit) {
	    return mom.isValid() ?
	        mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
	}

	function set$2 (mom, unit, value) {
	    if (mom.isValid() && !isNaN(value)) {
	        if (unit === 'FullYear' && isLeapYear(mom.year()) && mom.month() === 1 && mom.date() === 29) {
	            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value, mom.month(), daysInMonth(value, mom.month()));
	        }
	        else {
	            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
	        }
	    }
	}

	// MOMENTS

	function stringGet (units) {
	    units = normalizeUnits(units);
	    if (isFunction(this[units])) {
	        return this[units]();
	    }
	    return this;
	}


	function stringSet (units, value) {
	    if (typeof units === 'object') {
	        units = normalizeObjectUnits(units);
	        var prioritized = getPrioritizedUnits(units);
	        for (var i = 0; i < prioritized.length; i++) {
	            this[prioritized[i].unit](units[prioritized[i].unit]);
	        }
	    } else {
	        units = normalizeUnits(units);
	        if (isFunction(this[units])) {
	            return this[units](value);
	        }
	    }
	    return this;
	}

	function mod(n, x) {
	    return ((n % x) + x) % x;
	}

	var indexOf;

	if (Array.prototype.indexOf) {
	    indexOf = Array.prototype.indexOf;
	} else {
	    indexOf = function (o) {
	        // I know
	        var i;
	        for (i = 0; i < this.length; ++i) {
	            if (this[i] === o) {
	                return i;
	            }
	        }
	        return -1;
	    };
	}

	function daysInMonth(year, month) {
	    if (isNaN(year) || isNaN(month)) {
	        return NaN;
	    }
	    var modMonth = mod(month, 12);
	    year += (month - modMonth) / 12;
	    return modMonth === 1 ? (isLeapYear(year) ? 29 : 28) : (31 - modMonth % 7 % 2);
	}

	// FORMATTING

	addFormatToken('M', ['MM', 2], 'Mo', function () {
	    return this.month() + 1;
	});

	addFormatToken('MMM', 0, 0, function (format) {
	    return this.localeData().monthsShort(this, format);
	});

	addFormatToken('MMMM', 0, 0, function (format) {
	    return this.localeData().months(this, format);
	});

	// ALIASES

	addUnitAlias('month', 'M');

	// PRIORITY

	addUnitPriority('month', 8);

	// PARSING

	addRegexToken('M',    match1to2);
	addRegexToken('MM',   match1to2, match2);
	addRegexToken('MMM',  function (isStrict, locale) {
	    return locale.monthsShortRegex(isStrict);
	});
	addRegexToken('MMMM', function (isStrict, locale) {
	    return locale.monthsRegex(isStrict);
	});

	addParseToken(['M', 'MM'], function (input, array) {
	    array[MONTH] = toInt(input) - 1;
	});

	addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
	    var month = config._locale.monthsParse(input, token, config._strict);
	    // if we didn't find a month name, mark the date as invalid.
	    if (month != null) {
	        array[MONTH] = month;
	    } else {
	        getParsingFlags(config).invalidMonth = input;
	    }
	});

	// LOCALES

	var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
	var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
	function localeMonths (m, format) {
	    if (!m) {
	        return isArray(this._months) ? this._months :
	            this._months['standalone'];
	    }
	    return isArray(this._months) ? this._months[m.month()] :
	        this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
	}

	var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
	function localeMonthsShort (m, format) {
	    if (!m) {
	        return isArray(this._monthsShort) ? this._monthsShort :
	            this._monthsShort['standalone'];
	    }
	    return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
	        this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
	}

	function handleStrictParse(monthName, format, strict) {
	    var i, ii, mom, llc = monthName.toLocaleLowerCase();
	    if (!this._monthsParse) {
	        // this is not used
	        this._monthsParse = [];
	        this._longMonthsParse = [];
	        this._shortMonthsParse = [];
	        for (i = 0; i < 12; ++i) {
	            mom = createUTC([2000, i]);
	            this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
	            this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
	        }
	    }

	    if (strict) {
	        if (format === 'MMM') {
	            ii = indexOf.call(this._shortMonthsParse, llc);
	            return ii !== -1 ? ii : null;
	        } else {
	            ii = indexOf.call(this._longMonthsParse, llc);
	            return ii !== -1 ? ii : null;
	        }
	    } else {
	        if (format === 'MMM') {
	            ii = indexOf.call(this._shortMonthsParse, llc);
	            if (ii !== -1) {
	                return ii;
	            }
	            ii = indexOf.call(this._longMonthsParse, llc);
	            return ii !== -1 ? ii : null;
	        } else {
	            ii = indexOf.call(this._longMonthsParse, llc);
	            if (ii !== -1) {
	                return ii;
	            }
	            ii = indexOf.call(this._shortMonthsParse, llc);
	            return ii !== -1 ? ii : null;
	        }
	    }
	}

	function localeMonthsParse (monthName, format, strict) {
	    var i, mom, regex;

	    if (this._monthsParseExact) {
	        return handleStrictParse.call(this, monthName, format, strict);
	    }

	    if (!this._monthsParse) {
	        this._monthsParse = [];
	        this._longMonthsParse = [];
	        this._shortMonthsParse = [];
	    }

	    // TODO: add sorting
	    // Sorting makes sure if one month (or abbr) is a prefix of another
	    // see sorting in computeMonthsParse
	    for (i = 0; i < 12; i++) {
	        // make the regex if we don't have it already
	        mom = createUTC([2000, i]);
	        if (strict && !this._longMonthsParse[i]) {
	            this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
	            this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
	        }
	        if (!strict && !this._monthsParse[i]) {
	            regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
	            this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
	        }
	        // test the regex
	        if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
	            return i;
	        } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
	            return i;
	        } else if (!strict && this._monthsParse[i].test(monthName)) {
	            return i;
	        }
	    }
	}

	// MOMENTS

	function setMonth (mom, value) {
	    var dayOfMonth;

	    if (!mom.isValid()) {
	        // No op
	        return mom;
	    }

	    if (typeof value === 'string') {
	        if (/^\d+$/.test(value)) {
	            value = toInt(value);
	        } else {
	            value = mom.localeData().monthsParse(value);
	            // TODO: Another silent failure?
	            if (!isNumber(value)) {
	                return mom;
	            }
	        }
	    }

	    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
	    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
	    return mom;
	}

	function getSetMonth (value) {
	    if (value != null) {
	        setMonth(this, value);
	        hooks.updateOffset(this, true);
	        return this;
	    } else {
	        return get$1(this, 'Month');
	    }
	}

	function getDaysInMonth () {
	    return daysInMonth(this.year(), this.month());
	}

	var defaultMonthsShortRegex = matchWord;
	function monthsShortRegex (isStrict) {
	    if (this._monthsParseExact) {
	        if (!hasOwnProp(this, '_monthsRegex')) {
	            computeMonthsParse.call(this);
	        }
	        if (isStrict) {
	            return this._monthsShortStrictRegex;
	        } else {
	            return this._monthsShortRegex;
	        }
	    } else {
	        if (!hasOwnProp(this, '_monthsShortRegex')) {
	            this._monthsShortRegex = defaultMonthsShortRegex;
	        }
	        return this._monthsShortStrictRegex && isStrict ?
	            this._monthsShortStrictRegex : this._monthsShortRegex;
	    }
	}

	var defaultMonthsRegex = matchWord;
	function monthsRegex (isStrict) {
	    if (this._monthsParseExact) {
	        if (!hasOwnProp(this, '_monthsRegex')) {
	            computeMonthsParse.call(this);
	        }
	        if (isStrict) {
	            return this._monthsStrictRegex;
	        } else {
	            return this._monthsRegex;
	        }
	    } else {
	        if (!hasOwnProp(this, '_monthsRegex')) {
	            this._monthsRegex = defaultMonthsRegex;
	        }
	        return this._monthsStrictRegex && isStrict ?
	            this._monthsStrictRegex : this._monthsRegex;
	    }
	}

	function computeMonthsParse () {
	    function cmpLenRev(a, b) {
	        return b.length - a.length;
	    }

	    var shortPieces = [], longPieces = [], mixedPieces = [],
	        i, mom;
	    for (i = 0; i < 12; i++) {
	        // make the regex if we don't have it already
	        mom = createUTC([2000, i]);
	        shortPieces.push(this.monthsShort(mom, ''));
	        longPieces.push(this.months(mom, ''));
	        mixedPieces.push(this.months(mom, ''));
	        mixedPieces.push(this.monthsShort(mom, ''));
	    }
	    // Sorting makes sure if one month (or abbr) is a prefix of another it
	    // will match the longer piece.
	    shortPieces.sort(cmpLenRev);
	    longPieces.sort(cmpLenRev);
	    mixedPieces.sort(cmpLenRev);
	    for (i = 0; i < 12; i++) {
	        shortPieces[i] = regexEscape(shortPieces[i]);
	        longPieces[i] = regexEscape(longPieces[i]);
	    }
	    for (i = 0; i < 24; i++) {
	        mixedPieces[i] = regexEscape(mixedPieces[i]);
	    }

	    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
	    this._monthsShortRegex = this._monthsRegex;
	    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
	    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
	}

	function createDate (y, m, d, h, M, s, ms) {
	    // can't just apply() to create a date:
	    // https://stackoverflow.com/q/181348
	    var date = new Date(y, m, d, h, M, s, ms);

	    // the date constructor remaps years 0-99 to 1900-1999
	    if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
	        date.setFullYear(y);
	    }
	    return date;
	}

	function createUTCDate (y) {
	    var date = new Date(Date.UTC.apply(null, arguments));

	    // the Date.UTC function remaps years 0-99 to 1900-1999
	    if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
	        date.setUTCFullYear(y);
	    }
	    return date;
	}

	// start-of-first-week - start-of-year
	function firstWeekOffset(year, dow, doy) {
	    var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
	        fwd = 7 + dow - doy,
	        // first-week day local weekday -- which local weekday is fwd
	        fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

	    return -fwdlw + fwd - 1;
	}

	// https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
	function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
	    var localWeekday = (7 + weekday - dow) % 7,
	        weekOffset = firstWeekOffset(year, dow, doy),
	        dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
	        resYear, resDayOfYear;

	    if (dayOfYear <= 0) {
	        resYear = year - 1;
	        resDayOfYear = daysInYear(resYear) + dayOfYear;
	    } else if (dayOfYear > daysInYear(year)) {
	        resYear = year + 1;
	        resDayOfYear = dayOfYear - daysInYear(year);
	    } else {
	        resYear = year;
	        resDayOfYear = dayOfYear;
	    }

	    return {
	        year: resYear,
	        dayOfYear: resDayOfYear
	    };
	}

	function weekOfYear(mom, dow, doy) {
	    var weekOffset = firstWeekOffset(mom.year(), dow, doy),
	        week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
	        resWeek, resYear;

	    if (week < 1) {
	        resYear = mom.year() - 1;
	        resWeek = week + weeksInYear(resYear, dow, doy);
	    } else if (week > weeksInYear(mom.year(), dow, doy)) {
	        resWeek = week - weeksInYear(mom.year(), dow, doy);
	        resYear = mom.year() + 1;
	    } else {
	        resYear = mom.year();
	        resWeek = week;
	    }

	    return {
	        week: resWeek,
	        year: resYear
	    };
	}

	function weeksInYear(year, dow, doy) {
	    var weekOffset = firstWeekOffset(year, dow, doy),
	        weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
	    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
	}

	// FORMATTING

	addFormatToken('w', ['ww', 2], 'wo', 'week');
	addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

	// ALIASES

	addUnitAlias('week', 'w');
	addUnitAlias('isoWeek', 'W');

	// PRIORITIES

	addUnitPriority('week', 5);
	addUnitPriority('isoWeek', 5);

	// PARSING

	addRegexToken('w',  match1to2);
	addRegexToken('ww', match1to2, match2);
	addRegexToken('W',  match1to2);
	addRegexToken('WW', match1to2, match2);

	addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
	    week[token.substr(0, 1)] = toInt(input);
	});

	// HELPERS

	// LOCALES

	function localeWeek (mom) {
	    return weekOfYear(mom, this._week.dow, this._week.doy).week;
	}

	var defaultLocaleWeek = {
	    dow : 0, // Sunday is the first day of the week.
	    doy : 6  // The week that contains Jan 1st is the first week of the year.
	};

	function localeFirstDayOfWeek () {
	    return this._week.dow;
	}

	function localeFirstDayOfYear () {
	    return this._week.doy;
	}

	// MOMENTS

	function getSetWeek (input) {
	    var week = this.localeData().week(this);
	    return input == null ? week : this.add((input - week) * 7, 'd');
	}

	function getSetISOWeek (input) {
	    var week = weekOfYear(this, 1, 4).week;
	    return input == null ? week : this.add((input - week) * 7, 'd');
	}

	// FORMATTING

	addFormatToken('d', 0, 'do', 'day');

	addFormatToken('dd', 0, 0, function (format) {
	    return this.localeData().weekdaysMin(this, format);
	});

	addFormatToken('ddd', 0, 0, function (format) {
	    return this.localeData().weekdaysShort(this, format);
	});

	addFormatToken('dddd', 0, 0, function (format) {
	    return this.localeData().weekdays(this, format);
	});

	addFormatToken('e', 0, 0, 'weekday');
	addFormatToken('E', 0, 0, 'isoWeekday');

	// ALIASES

	addUnitAlias('day', 'd');
	addUnitAlias('weekday', 'e');
	addUnitAlias('isoWeekday', 'E');

	// PRIORITY
	addUnitPriority('day', 11);
	addUnitPriority('weekday', 11);
	addUnitPriority('isoWeekday', 11);

	// PARSING

	addRegexToken('d',    match1to2);
	addRegexToken('e',    match1to2);
	addRegexToken('E',    match1to2);
	addRegexToken('dd',   function (isStrict, locale) {
	    return locale.weekdaysMinRegex(isStrict);
	});
	addRegexToken('ddd',   function (isStrict, locale) {
	    return locale.weekdaysShortRegex(isStrict);
	});
	addRegexToken('dddd',   function (isStrict, locale) {
	    return locale.weekdaysRegex(isStrict);
	});

	addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
	    var weekday = config._locale.weekdaysParse(input, token, config._strict);
	    // if we didn't get a weekday name, mark the date as invalid
	    if (weekday != null) {
	        week.d = weekday;
	    } else {
	        getParsingFlags(config).invalidWeekday = input;
	    }
	});

	addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
	    week[token] = toInt(input);
	});

	// HELPERS

	function parseWeekday(input, locale) {
	    if (typeof input !== 'string') {
	        return input;
	    }

	    if (!isNaN(input)) {
	        return parseInt(input, 10);
	    }

	    input = locale.weekdaysParse(input);
	    if (typeof input === 'number') {
	        return input;
	    }

	    return null;
	}

	function parseIsoWeekday(input, locale) {
	    if (typeof input === 'string') {
	        return locale.weekdaysParse(input) % 7 || 7;
	    }
	    return isNaN(input) ? null : input;
	}

	// LOCALES

	var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
	function localeWeekdays (m, format) {
	    if (!m) {
	        return isArray(this._weekdays) ? this._weekdays :
	            this._weekdays['standalone'];
	    }
	    return isArray(this._weekdays) ? this._weekdays[m.day()] :
	        this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
	}

	var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
	function localeWeekdaysShort (m) {
	    return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
	}

	var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
	function localeWeekdaysMin (m) {
	    return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
	}

	function handleStrictParse$1(weekdayName, format, strict) {
	    var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
	    if (!this._weekdaysParse) {
	        this._weekdaysParse = [];
	        this._shortWeekdaysParse = [];
	        this._minWeekdaysParse = [];

	        for (i = 0; i < 7; ++i) {
	            mom = createUTC([2000, 1]).day(i);
	            this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
	            this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
	            this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
	        }
	    }

	    if (strict) {
	        if (format === 'dddd') {
	            ii = indexOf.call(this._weekdaysParse, llc);
	            return ii !== -1 ? ii : null;
	        } else if (format === 'ddd') {
	            ii = indexOf.call(this._shortWeekdaysParse, llc);
	            return ii !== -1 ? ii : null;
	        } else {
	            ii = indexOf.call(this._minWeekdaysParse, llc);
	            return ii !== -1 ? ii : null;
	        }
	    } else {
	        if (format === 'dddd') {
	            ii = indexOf.call(this._weekdaysParse, llc);
	            if (ii !== -1) {
	                return ii;
	            }
	            ii = indexOf.call(this._shortWeekdaysParse, llc);
	            if (ii !== -1) {
	                return ii;
	            }
	            ii = indexOf.call(this._minWeekdaysParse, llc);
	            return ii !== -1 ? ii : null;
	        } else if (format === 'ddd') {
	            ii = indexOf.call(this._shortWeekdaysParse, llc);
	            if (ii !== -1) {
	                return ii;
	            }
	            ii = indexOf.call(this._weekdaysParse, llc);
	            if (ii !== -1) {
	                return ii;
	            }
	            ii = indexOf.call(this._minWeekdaysParse, llc);
	            return ii !== -1 ? ii : null;
	        } else {
	            ii = indexOf.call(this._minWeekdaysParse, llc);
	            if (ii !== -1) {
	                return ii;
	            }
	            ii = indexOf.call(this._weekdaysParse, llc);
	            if (ii !== -1) {
	                return ii;
	            }
	            ii = indexOf.call(this._shortWeekdaysParse, llc);
	            return ii !== -1 ? ii : null;
	        }
	    }
	}

	function localeWeekdaysParse (weekdayName, format, strict) {
	    var i, mom, regex;

	    if (this._weekdaysParseExact) {
	        return handleStrictParse$1.call(this, weekdayName, format, strict);
	    }

	    if (!this._weekdaysParse) {
	        this._weekdaysParse = [];
	        this._minWeekdaysParse = [];
	        this._shortWeekdaysParse = [];
	        this._fullWeekdaysParse = [];
	    }

	    for (i = 0; i < 7; i++) {
	        // make the regex if we don't have it already

	        mom = createUTC([2000, 1]).day(i);
	        if (strict && !this._fullWeekdaysParse[i]) {
	            this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\\.?') + '$', 'i');
	            this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$', 'i');
	            this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$', 'i');
	        }
	        if (!this._weekdaysParse[i]) {
	            regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
	            this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
	        }
	        // test the regex
	        if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
	            return i;
	        } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
	            return i;
	        } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
	            return i;
	        } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
	            return i;
	        }
	    }
	}

	// MOMENTS

	function getSetDayOfWeek (input) {
	    if (!this.isValid()) {
	        return input != null ? this : NaN;
	    }
	    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
	    if (input != null) {
	        input = parseWeekday(input, this.localeData());
	        return this.add(input - day, 'd');
	    } else {
	        return day;
	    }
	}

	function getSetLocaleDayOfWeek (input) {
	    if (!this.isValid()) {
	        return input != null ? this : NaN;
	    }
	    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
	    return input == null ? weekday : this.add(input - weekday, 'd');
	}

	function getSetISODayOfWeek (input) {
	    if (!this.isValid()) {
	        return input != null ? this : NaN;
	    }

	    // behaves the same as moment#day except
	    // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
	    // as a setter, sunday should belong to the previous week.

	    if (input != null) {
	        var weekday = parseIsoWeekday(input, this.localeData());
	        return this.day(this.day() % 7 ? weekday : weekday - 7);
	    } else {
	        return this.day() || 7;
	    }
	}

	var defaultWeekdaysRegex = matchWord;
	function weekdaysRegex (isStrict) {
	    if (this._weekdaysParseExact) {
	        if (!hasOwnProp(this, '_weekdaysRegex')) {
	            computeWeekdaysParse.call(this);
	        }
	        if (isStrict) {
	            return this._weekdaysStrictRegex;
	        } else {
	            return this._weekdaysRegex;
	        }
	    } else {
	        if (!hasOwnProp(this, '_weekdaysRegex')) {
	            this._weekdaysRegex = defaultWeekdaysRegex;
	        }
	        return this._weekdaysStrictRegex && isStrict ?
	            this._weekdaysStrictRegex : this._weekdaysRegex;
	    }
	}

	var defaultWeekdaysShortRegex = matchWord;
	function weekdaysShortRegex (isStrict) {
	    if (this._weekdaysParseExact) {
	        if (!hasOwnProp(this, '_weekdaysRegex')) {
	            computeWeekdaysParse.call(this);
	        }
	        if (isStrict) {
	            return this._weekdaysShortStrictRegex;
	        } else {
	            return this._weekdaysShortRegex;
	        }
	    } else {
	        if (!hasOwnProp(this, '_weekdaysShortRegex')) {
	            this._weekdaysShortRegex = defaultWeekdaysShortRegex;
	        }
	        return this._weekdaysShortStrictRegex && isStrict ?
	            this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
	    }
	}

	var defaultWeekdaysMinRegex = matchWord;
	function weekdaysMinRegex (isStrict) {
	    if (this._weekdaysParseExact) {
	        if (!hasOwnProp(this, '_weekdaysRegex')) {
	            computeWeekdaysParse.call(this);
	        }
	        if (isStrict) {
	            return this._weekdaysMinStrictRegex;
	        } else {
	            return this._weekdaysMinRegex;
	        }
	    } else {
	        if (!hasOwnProp(this, '_weekdaysMinRegex')) {
	            this._weekdaysMinRegex = defaultWeekdaysMinRegex;
	        }
	        return this._weekdaysMinStrictRegex && isStrict ?
	            this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
	    }
	}


	function computeWeekdaysParse () {
	    function cmpLenRev(a, b) {
	        return b.length - a.length;
	    }

	    var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
	        i, mom, minp, shortp, longp;
	    for (i = 0; i < 7; i++) {
	        // make the regex if we don't have it already
	        mom = createUTC([2000, 1]).day(i);
	        minp = this.weekdaysMin(mom, '');
	        shortp = this.weekdaysShort(mom, '');
	        longp = this.weekdays(mom, '');
	        minPieces.push(minp);
	        shortPieces.push(shortp);
	        longPieces.push(longp);
	        mixedPieces.push(minp);
	        mixedPieces.push(shortp);
	        mixedPieces.push(longp);
	    }
	    // Sorting makes sure if one weekday (or abbr) is a prefix of another it
	    // will match the longer piece.
	    minPieces.sort(cmpLenRev);
	    shortPieces.sort(cmpLenRev);
	    longPieces.sort(cmpLenRev);
	    mixedPieces.sort(cmpLenRev);
	    for (i = 0; i < 7; i++) {
	        shortPieces[i] = regexEscape(shortPieces[i]);
	        longPieces[i] = regexEscape(longPieces[i]);
	        mixedPieces[i] = regexEscape(mixedPieces[i]);
	    }

	    this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
	    this._weekdaysShortRegex = this._weekdaysRegex;
	    this._weekdaysMinRegex = this._weekdaysRegex;

	    this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
	    this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
	    this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
	}

	// FORMATTING

	function hFormat() {
	    return this.hours() % 12 || 12;
	}

	function kFormat() {
	    return this.hours() || 24;
	}

	addFormatToken('H', ['HH', 2], 0, 'hour');
	addFormatToken('h', ['hh', 2], 0, hFormat);
	addFormatToken('k', ['kk', 2], 0, kFormat);

	addFormatToken('hmm', 0, 0, function () {
	    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
	});

	addFormatToken('hmmss', 0, 0, function () {
	    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
	        zeroFill(this.seconds(), 2);
	});

	addFormatToken('Hmm', 0, 0, function () {
	    return '' + this.hours() + zeroFill(this.minutes(), 2);
	});

	addFormatToken('Hmmss', 0, 0, function () {
	    return '' + this.hours() + zeroFill(this.minutes(), 2) +
	        zeroFill(this.seconds(), 2);
	});

	function meridiem (token, lowercase) {
	    addFormatToken(token, 0, 0, function () {
	        return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
	    });
	}

	meridiem('a', true);
	meridiem('A', false);

	// ALIASES

	addUnitAlias('hour', 'h');

	// PRIORITY
	addUnitPriority('hour', 13);

	// PARSING

	function matchMeridiem (isStrict, locale) {
	    return locale._meridiemParse;
	}

	addRegexToken('a',  matchMeridiem);
	addRegexToken('A',  matchMeridiem);
	addRegexToken('H',  match1to2);
	addRegexToken('h',  match1to2);
	addRegexToken('k',  match1to2);
	addRegexToken('HH', match1to2, match2);
	addRegexToken('hh', match1to2, match2);
	addRegexToken('kk', match1to2, match2);

	addRegexToken('hmm', match3to4);
	addRegexToken('hmmss', match5to6);
	addRegexToken('Hmm', match3to4);
	addRegexToken('Hmmss', match5to6);

	addParseToken(['H', 'HH'], HOUR);
	addParseToken(['k', 'kk'], function (input, array, config) {
	    var kInput = toInt(input);
	    array[HOUR] = kInput === 24 ? 0 : kInput;
	});
	addParseToken(['a', 'A'], function (input, array, config) {
	    config._isPm = config._locale.isPM(input);
	    config._meridiem = input;
	});
	addParseToken(['h', 'hh'], function (input, array, config) {
	    array[HOUR] = toInt(input);
	    getParsingFlags(config).bigHour = true;
	});
	addParseToken('hmm', function (input, array, config) {
	    var pos = input.length - 2;
	    array[HOUR] = toInt(input.substr(0, pos));
	    array[MINUTE] = toInt(input.substr(pos));
	    getParsingFlags(config).bigHour = true;
	});
	addParseToken('hmmss', function (input, array, config) {
	    var pos1 = input.length - 4;
	    var pos2 = input.length - 2;
	    array[HOUR] = toInt(input.substr(0, pos1));
	    array[MINUTE] = toInt(input.substr(pos1, 2));
	    array[SECOND] = toInt(input.substr(pos2));
	    getParsingFlags(config).bigHour = true;
	});
	addParseToken('Hmm', function (input, array, config) {
	    var pos = input.length - 2;
	    array[HOUR] = toInt(input.substr(0, pos));
	    array[MINUTE] = toInt(input.substr(pos));
	});
	addParseToken('Hmmss', function (input, array, config) {
	    var pos1 = input.length - 4;
	    var pos2 = input.length - 2;
	    array[HOUR] = toInt(input.substr(0, pos1));
	    array[MINUTE] = toInt(input.substr(pos1, 2));
	    array[SECOND] = toInt(input.substr(pos2));
	});

	// LOCALES

	function localeIsPM (input) {
	    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
	    // Using charAt should be more compatible.
	    return ((input + '').toLowerCase().charAt(0) === 'p');
	}

	var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
	function localeMeridiem (hours, minutes, isLower) {
	    if (hours > 11) {
	        return isLower ? 'pm' : 'PM';
	    } else {
	        return isLower ? 'am' : 'AM';
	    }
	}


	// MOMENTS

	// Setting the hour should keep the time, because the user explicitly
	// specified which hour they want. So trying to maintain the same hour (in
	// a new timezone) makes sense. Adding/subtracting hours does not follow
	// this rule.
	var getSetHour = makeGetSet('Hours', true);

	var baseConfig = {
	    calendar: defaultCalendar,
	    longDateFormat: defaultLongDateFormat,
	    invalidDate: defaultInvalidDate,
	    ordinal: defaultOrdinal,
	    dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
	    relativeTime: defaultRelativeTime,

	    months: defaultLocaleMonths,
	    monthsShort: defaultLocaleMonthsShort,

	    week: defaultLocaleWeek,

	    weekdays: defaultLocaleWeekdays,
	    weekdaysMin: defaultLocaleWeekdaysMin,
	    weekdaysShort: defaultLocaleWeekdaysShort,

	    meridiemParse: defaultLocaleMeridiemParse
	};

	// internal storage for locale config files
	var locales = {};
	var localeFamilies = {};
	var globalLocale;

	function normalizeLocale(key) {
	    return key ? key.toLowerCase().replace('_', '-') : key;
	}

	// pick the locale from the array
	// try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
	// substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
	function chooseLocale(names) {
	    var i = 0, j, next, locale, split;

	    while (i < names.length) {
	        split = normalizeLocale(names[i]).split('-');
	        j = split.length;
	        next = normalizeLocale(names[i + 1]);
	        next = next ? next.split('-') : null;
	        while (j > 0) {
	            locale = loadLocale(split.slice(0, j).join('-'));
	            if (locale) {
	                return locale;
	            }
	            if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
	                //the next array item is better than a shallower substring of this one
	                break;
	            }
	            j--;
	        }
	        i++;
	    }
	    return globalLocale;
	}

	function loadLocale(name) {
	    var oldLocale = null;
	    // TODO: Find a better way to register and load all the locales in Node
	    if (!locales[name] && (typeof module !== 'undefined') &&
	            module && module.exports) {
	        try {
	            oldLocale = globalLocale._abbr;
	            var aliasedRequire = require;
	            aliasedRequire('./locale/' + name);
	            getSetGlobalLocale(oldLocale);
	        } catch (e) {}
	    }
	    return locales[name];
	}

	// This function will load locale and then set the global locale.  If
	// no arguments are passed in, it will simply return the current global
	// locale key.
	function getSetGlobalLocale (key, values) {
	    var data;
	    if (key) {
	        if (isUndefined(values)) {
	            data = getLocale(key);
	        }
	        else {
	            data = defineLocale(key, values);
	        }

	        if (data) {
	            // moment.duration._locale = moment._locale = data;
	            globalLocale = data;
	        }
	        else {
	            if ((typeof console !==  'undefined') && console.warn) {
	                //warn user if arguments are passed but the locale could not be set
	                console.warn('Locale ' + key +  ' not found. Did you forget to load it?');
	            }
	        }
	    }

	    return globalLocale._abbr;
	}

	function defineLocale (name, config) {
	    if (config !== null) {
	        var locale, parentConfig = baseConfig;
	        config.abbr = name;
	        if (locales[name] != null) {
	            deprecateSimple('defineLocaleOverride',
	                    'use moment.updateLocale(localeName, config) to change ' +
	                    'an existing locale. moment.defineLocale(localeName, ' +
	                    'config) should only be used for creating a new locale ' +
	                    'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
	            parentConfig = locales[name]._config;
	        } else if (config.parentLocale != null) {
	            if (locales[config.parentLocale] != null) {
	                parentConfig = locales[config.parentLocale]._config;
	            } else {
	                locale = loadLocale(config.parentLocale);
	                if (locale != null) {
	                    parentConfig = locale._config;
	                } else {
	                    if (!localeFamilies[config.parentLocale]) {
	                        localeFamilies[config.parentLocale] = [];
	                    }
	                    localeFamilies[config.parentLocale].push({
	                        name: name,
	                        config: config
	                    });
	                    return null;
	                }
	            }
	        }
	        locales[name] = new Locale(mergeConfigs(parentConfig, config));

	        if (localeFamilies[name]) {
	            localeFamilies[name].forEach(function (x) {
	                defineLocale(x.name, x.config);
	            });
	        }

	        // backwards compat for now: also set the locale
	        // make sure we set the locale AFTER all child locales have been
	        // created, so we won't end up with the child locale set.
	        getSetGlobalLocale(name);


	        return locales[name];
	    } else {
	        // useful for testing
	        delete locales[name];
	        return null;
	    }
	}

	function updateLocale(name, config) {
	    if (config != null) {
	        var locale, tmpLocale, parentConfig = baseConfig;
	        // MERGE
	        tmpLocale = loadLocale(name);
	        if (tmpLocale != null) {
	            parentConfig = tmpLocale._config;
	        }
	        config = mergeConfigs(parentConfig, config);
	        locale = new Locale(config);
	        locale.parentLocale = locales[name];
	        locales[name] = locale;

	        // backwards compat for now: also set the locale
	        getSetGlobalLocale(name);
	    } else {
	        // pass null for config to unupdate, useful for tests
	        if (locales[name] != null) {
	            if (locales[name].parentLocale != null) {
	                locales[name] = locales[name].parentLocale;
	            } else if (locales[name] != null) {
	                delete locales[name];
	            }
	        }
	    }
	    return locales[name];
	}

	// returns locale data
	function getLocale (key) {
	    var locale;

	    if (key && key._locale && key._locale._abbr) {
	        key = key._locale._abbr;
	    }

	    if (!key) {
	        return globalLocale;
	    }

	    if (!isArray(key)) {
	        //short-circuit everything else
	        locale = loadLocale(key);
	        if (locale) {
	            return locale;
	        }
	        key = [key];
	    }

	    return chooseLocale(key);
	}

	function listLocales() {
	    return keys(locales);
	}

	function checkOverflow (m) {
	    var overflow;
	    var a = m._a;

	    if (a && getParsingFlags(m).overflow === -2) {
	        overflow =
	            a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
	            a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
	            a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
	            a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
	            a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
	            a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
	            -1;

	        if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
	            overflow = DATE;
	        }
	        if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
	            overflow = WEEK;
	        }
	        if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
	            overflow = WEEKDAY;
	        }

	        getParsingFlags(m).overflow = overflow;
	    }

	    return m;
	}

	// Pick the first defined of two or three arguments.
	function defaults(a, b, c) {
	    if (a != null) {
	        return a;
	    }
	    if (b != null) {
	        return b;
	    }
	    return c;
	}

	function currentDateArray(config) {
	    // hooks is actually the exported moment object
	    var nowValue = new Date(hooks.now());
	    if (config._useUTC) {
	        return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
	    }
	    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
	}

	// convert an array to a date.
	// the array should mirror the parameters below
	// note: all values past the year are optional and will default to the lowest possible value.
	// [year, month, day , hour, minute, second, millisecond]
	function configFromArray (config) {
	    var i, date, input = [], currentDate, expectedWeekday, yearToUse;

	    if (config._d) {
	        return;
	    }

	    currentDate = currentDateArray(config);

	    //compute day of the year from weeks and weekdays
	    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
	        dayOfYearFromWeekInfo(config);
	    }

	    //if the day of the year is set, figure out what it is
	    if (config._dayOfYear != null) {
	        yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

	        if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
	            getParsingFlags(config)._overflowDayOfYear = true;
	        }

	        date = createUTCDate(yearToUse, 0, config._dayOfYear);
	        config._a[MONTH] = date.getUTCMonth();
	        config._a[DATE] = date.getUTCDate();
	    }

	    // Default to current date.
	    // * if no year, month, day of month are given, default to today
	    // * if day of month is given, default month and year
	    // * if month is given, default only year
	    // * if year is given, don't default anything
	    for (i = 0; i < 3 && config._a[i] == null; ++i) {
	        config._a[i] = input[i] = currentDate[i];
	    }

	    // Zero out whatever was not defaulted, including time
	    for (; i < 7; i++) {
	        config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
	    }

	    // Check for 24:00:00.000
	    if (config._a[HOUR] === 24 &&
	            config._a[MINUTE] === 0 &&
	            config._a[SECOND] === 0 &&
	            config._a[MILLISECOND] === 0) {
	        config._nextDay = true;
	        config._a[HOUR] = 0;
	    }

	    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
	    expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay();

	    // Apply timezone offset from input. The actual utcOffset can be changed
	    // with parseZone.
	    if (config._tzm != null) {
	        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
	    }

	    if (config._nextDay) {
	        config._a[HOUR] = 24;
	    }

	    // check for mismatching day of week
	    if (config._w && typeof config._w.d !== 'undefined' && config._w.d !== expectedWeekday) {
	        getParsingFlags(config).weekdayMismatch = true;
	    }
	}

	function dayOfYearFromWeekInfo(config) {
	    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

	    w = config._w;
	    if (w.GG != null || w.W != null || w.E != null) {
	        dow = 1;
	        doy = 4;

	        // TODO: We need to take the current isoWeekYear, but that depends on
	        // how we interpret now (local, utc, fixed offset). So create
	        // a now version of current config (take local/utc/offset flags, and
	        // create now).
	        weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
	        week = defaults(w.W, 1);
	        weekday = defaults(w.E, 1);
	        if (weekday < 1 || weekday > 7) {
	            weekdayOverflow = true;
	        }
	    } else {
	        dow = config._locale._week.dow;
	        doy = config._locale._week.doy;

	        var curWeek = weekOfYear(createLocal(), dow, doy);

	        weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

	        // Default to current week.
	        week = defaults(w.w, curWeek.week);

	        if (w.d != null) {
	            // weekday -- low day numbers are considered next week
	            weekday = w.d;
	            if (weekday < 0 || weekday > 6) {
	                weekdayOverflow = true;
	            }
	        } else if (w.e != null) {
	            // local weekday -- counting starts from begining of week
	            weekday = w.e + dow;
	            if (w.e < 0 || w.e > 6) {
	                weekdayOverflow = true;
	            }
	        } else {
	            // default to begining of week
	            weekday = dow;
	        }
	    }
	    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
	        getParsingFlags(config)._overflowWeeks = true;
	    } else if (weekdayOverflow != null) {
	        getParsingFlags(config)._overflowWeekday = true;
	    } else {
	        temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
	        config._a[YEAR] = temp.year;
	        config._dayOfYear = temp.dayOfYear;
	    }
	}

	// iso 8601 regex
	// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
	var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
	var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

	var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

	var isoDates = [
	    ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
	    ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
	    ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
	    ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
	    ['YYYY-DDD', /\d{4}-\d{3}/],
	    ['YYYY-MM', /\d{4}-\d\d/, false],
	    ['YYYYYYMMDD', /[+-]\d{10}/],
	    ['YYYYMMDD', /\d{8}/],
	    // YYYYMM is NOT allowed by the standard
	    ['GGGG[W]WWE', /\d{4}W\d{3}/],
	    ['GGGG[W]WW', /\d{4}W\d{2}/, false],
	    ['YYYYDDD', /\d{7}/]
	];

	// iso time formats and regexes
	var isoTimes = [
	    ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
	    ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
	    ['HH:mm:ss', /\d\d:\d\d:\d\d/],
	    ['HH:mm', /\d\d:\d\d/],
	    ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
	    ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
	    ['HHmmss', /\d\d\d\d\d\d/],
	    ['HHmm', /\d\d\d\d/],
	    ['HH', /\d\d/]
	];

	var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

	// date from iso format
	function configFromISO(config) {
	    var i, l,
	        string = config._i,
	        match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
	        allowTime, dateFormat, timeFormat, tzFormat;

	    if (match) {
	        getParsingFlags(config).iso = true;

	        for (i = 0, l = isoDates.length; i < l; i++) {
	            if (isoDates[i][1].exec(match[1])) {
	                dateFormat = isoDates[i][0];
	                allowTime = isoDates[i][2] !== false;
	                break;
	            }
	        }
	        if (dateFormat == null) {
	            config._isValid = false;
	            return;
	        }
	        if (match[3]) {
	            for (i = 0, l = isoTimes.length; i < l; i++) {
	                if (isoTimes[i][1].exec(match[3])) {
	                    // match[2] should be 'T' or space
	                    timeFormat = (match[2] || ' ') + isoTimes[i][0];
	                    break;
	                }
	            }
	            if (timeFormat == null) {
	                config._isValid = false;
	                return;
	            }
	        }
	        if (!allowTime && timeFormat != null) {
	            config._isValid = false;
	            return;
	        }
	        if (match[4]) {
	            if (tzRegex.exec(match[4])) {
	                tzFormat = 'Z';
	            } else {
	                config._isValid = false;
	                return;
	            }
	        }
	        config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
	        configFromStringAndFormat(config);
	    } else {
	        config._isValid = false;
	    }
	}

	// RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
	var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;

	function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
	    var result = [
	        untruncateYear(yearStr),
	        defaultLocaleMonthsShort.indexOf(monthStr),
	        parseInt(dayStr, 10),
	        parseInt(hourStr, 10),
	        parseInt(minuteStr, 10)
	    ];

	    if (secondStr) {
	        result.push(parseInt(secondStr, 10));
	    }

	    return result;
	}

	function untruncateYear(yearStr) {
	    var year = parseInt(yearStr, 10);
	    if (year <= 49) {
	        return 2000 + year;
	    } else if (year <= 999) {
	        return 1900 + year;
	    }
	    return year;
	}

	function preprocessRFC2822(s) {
	    // Remove comments and folding whitespace and replace multiple-spaces with a single space
	    return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	}

	function checkWeekday(weekdayStr, parsedInput, config) {
	    if (weekdayStr) {
	        // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
	        var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
	            weekdayActual = new Date(parsedInput[0], parsedInput[1], parsedInput[2]).getDay();
	        if (weekdayProvided !== weekdayActual) {
	            getParsingFlags(config).weekdayMismatch = true;
	            config._isValid = false;
	            return false;
	        }
	    }
	    return true;
	}

	var obsOffsets = {
	    UT: 0,
	    GMT: 0,
	    EDT: -4 * 60,
	    EST: -5 * 60,
	    CDT: -5 * 60,
	    CST: -6 * 60,
	    MDT: -6 * 60,
	    MST: -7 * 60,
	    PDT: -7 * 60,
	    PST: -8 * 60
	};

	function calculateOffset(obsOffset, militaryOffset, numOffset) {
	    if (obsOffset) {
	        return obsOffsets[obsOffset];
	    } else if (militaryOffset) {
	        // the only allowed military tz is Z
	        return 0;
	    } else {
	        var hm = parseInt(numOffset, 10);
	        var m = hm % 100, h = (hm - m) / 100;
	        return h * 60 + m;
	    }
	}

	// date and time from ref 2822 format
	function configFromRFC2822(config) {
	    var match = rfc2822.exec(preprocessRFC2822(config._i));
	    if (match) {
	        var parsedArray = extractFromRFC2822Strings(match[4], match[3], match[2], match[5], match[6], match[7]);
	        if (!checkWeekday(match[1], parsedArray, config)) {
	            return;
	        }

	        config._a = parsedArray;
	        config._tzm = calculateOffset(match[8], match[9], match[10]);

	        config._d = createUTCDate.apply(null, config._a);
	        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

	        getParsingFlags(config).rfc2822 = true;
	    } else {
	        config._isValid = false;
	    }
	}

	// date from iso format or fallback
	function configFromString(config) {
	    var matched = aspNetJsonRegex.exec(config._i);

	    if (matched !== null) {
	        config._d = new Date(+matched[1]);
	        return;
	    }

	    configFromISO(config);
	    if (config._isValid === false) {
	        delete config._isValid;
	    } else {
	        return;
	    }

	    configFromRFC2822(config);
	    if (config._isValid === false) {
	        delete config._isValid;
	    } else {
	        return;
	    }

	    // Final attempt, use Input Fallback
	    hooks.createFromInputFallback(config);
	}

	hooks.createFromInputFallback = deprecate(
	    'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
	    'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
	    'discouraged and will be removed in an upcoming major release. Please refer to ' +
	    'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
	    function (config) {
	        config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
	    }
	);

	// constant that refers to the ISO standard
	hooks.ISO_8601 = function () {};

	// constant that refers to the RFC 2822 form
	hooks.RFC_2822 = function () {};

	// date from string and format string
	function configFromStringAndFormat(config) {
	    // TODO: Move this to another part of the creation flow to prevent circular deps
	    if (config._f === hooks.ISO_8601) {
	        configFromISO(config);
	        return;
	    }
	    if (config._f === hooks.RFC_2822) {
	        configFromRFC2822(config);
	        return;
	    }
	    config._a = [];
	    getParsingFlags(config).empty = true;

	    // This array is used to make a Date, either with `new Date` or `Date.UTC`
	    var string = '' + config._i,
	        i, parsedInput, tokens, token, skipped,
	        stringLength = string.length,
	        totalParsedInputLength = 0;

	    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

	    for (i = 0; i < tokens.length; i++) {
	        token = tokens[i];
	        parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
	        // console.log('token', token, 'parsedInput', parsedInput,
	        //         'regex', getParseRegexForToken(token, config));
	        if (parsedInput) {
	            skipped = string.substr(0, string.indexOf(parsedInput));
	            if (skipped.length > 0) {
	                getParsingFlags(config).unusedInput.push(skipped);
	            }
	            string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
	            totalParsedInputLength += parsedInput.length;
	        }
	        // don't parse if it's not a known token
	        if (formatTokenFunctions[token]) {
	            if (parsedInput) {
	                getParsingFlags(config).empty = false;
	            }
	            else {
	                getParsingFlags(config).unusedTokens.push(token);
	            }
	            addTimeToArrayFromToken(token, parsedInput, config);
	        }
	        else if (config._strict && !parsedInput) {
	            getParsingFlags(config).unusedTokens.push(token);
	        }
	    }

	    // add remaining unparsed input length to the string
	    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
	    if (string.length > 0) {
	        getParsingFlags(config).unusedInput.push(string);
	    }

	    // clear _12h flag if hour is <= 12
	    if (config._a[HOUR] <= 12 &&
	        getParsingFlags(config).bigHour === true &&
	        config._a[HOUR] > 0) {
	        getParsingFlags(config).bigHour = undefined;
	    }

	    getParsingFlags(config).parsedDateParts = config._a.slice(0);
	    getParsingFlags(config).meridiem = config._meridiem;
	    // handle meridiem
	    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

	    configFromArray(config);
	    checkOverflow(config);
	}


	function meridiemFixWrap (locale, hour, meridiem) {
	    var isPm;

	    if (meridiem == null) {
	        // nothing to do
	        return hour;
	    }
	    if (locale.meridiemHour != null) {
	        return locale.meridiemHour(hour, meridiem);
	    } else if (locale.isPM != null) {
	        // Fallback
	        isPm = locale.isPM(meridiem);
	        if (isPm && hour < 12) {
	            hour += 12;
	        }
	        if (!isPm && hour === 12) {
	            hour = 0;
	        }
	        return hour;
	    } else {
	        // this is not supposed to happen
	        return hour;
	    }
	}

	// date from string and array of format strings
	function configFromStringAndArray(config) {
	    var tempConfig,
	        bestMoment,

	        scoreToBeat,
	        i,
	        currentScore;

	    if (config._f.length === 0) {
	        getParsingFlags(config).invalidFormat = true;
	        config._d = new Date(NaN);
	        return;
	    }

	    for (i = 0; i < config._f.length; i++) {
	        currentScore = 0;
	        tempConfig = copyConfig({}, config);
	        if (config._useUTC != null) {
	            tempConfig._useUTC = config._useUTC;
	        }
	        tempConfig._f = config._f[i];
	        configFromStringAndFormat(tempConfig);

	        if (!isValid(tempConfig)) {
	            continue;
	        }

	        // if there is any input that was not parsed add a penalty for that format
	        currentScore += getParsingFlags(tempConfig).charsLeftOver;

	        //or tokens
	        currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

	        getParsingFlags(tempConfig).score = currentScore;

	        if (scoreToBeat == null || currentScore < scoreToBeat) {
	            scoreToBeat = currentScore;
	            bestMoment = tempConfig;
	        }
	    }

	    extend(config, bestMoment || tempConfig);
	}

	function configFromObject(config) {
	    if (config._d) {
	        return;
	    }

	    var i = normalizeObjectUnits(config._i);
	    config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
	        return obj && parseInt(obj, 10);
	    });

	    configFromArray(config);
	}

	function createFromConfig (config) {
	    var res = new Moment(checkOverflow(prepareConfig(config)));
	    if (res._nextDay) {
	        // Adding is smart enough around DST
	        res.add(1, 'd');
	        res._nextDay = undefined;
	    }

	    return res;
	}

	function prepareConfig (config) {
	    var input = config._i,
	        format = config._f;

	    config._locale = config._locale || getLocale(config._l);

	    if (input === null || (format === undefined && input === '')) {
	        return createInvalid({nullInput: true});
	    }

	    if (typeof input === 'string') {
	        config._i = input = config._locale.preparse(input);
	    }

	    if (isMoment(input)) {
	        return new Moment(checkOverflow(input));
	    } else if (isDate(input)) {
	        config._d = input;
	    } else if (isArray(format)) {
	        configFromStringAndArray(config);
	    } else if (format) {
	        configFromStringAndFormat(config);
	    }  else {
	        configFromInput(config);
	    }

	    if (!isValid(config)) {
	        config._d = null;
	    }

	    return config;
	}

	function configFromInput(config) {
	    var input = config._i;
	    if (isUndefined(input)) {
	        config._d = new Date(hooks.now());
	    } else if (isDate(input)) {
	        config._d = new Date(input.valueOf());
	    } else if (typeof input === 'string') {
	        configFromString(config);
	    } else if (isArray(input)) {
	        config._a = map(input.slice(0), function (obj) {
	            return parseInt(obj, 10);
	        });
	        configFromArray(config);
	    } else if (isObject(input)) {
	        configFromObject(config);
	    } else if (isNumber(input)) {
	        // from milliseconds
	        config._d = new Date(input);
	    } else {
	        hooks.createFromInputFallback(config);
	    }
	}

	function createLocalOrUTC (input, format, locale, strict, isUTC) {
	    var c = {};

	    if (locale === true || locale === false) {
	        strict = locale;
	        locale = undefined;
	    }

	    if ((isObject(input) && isObjectEmpty(input)) ||
	            (isArray(input) && input.length === 0)) {
	        input = undefined;
	    }
	    // object construction must be done this way.
	    // https://github.com/moment/moment/issues/1423
	    c._isAMomentObject = true;
	    c._useUTC = c._isUTC = isUTC;
	    c._l = locale;
	    c._i = input;
	    c._f = format;
	    c._strict = strict;

	    return createFromConfig(c);
	}

	function createLocal (input, format, locale, strict) {
	    return createLocalOrUTC(input, format, locale, strict, false);
	}

	var prototypeMin = deprecate(
	    'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
	    function () {
	        var other = createLocal.apply(null, arguments);
	        if (this.isValid() && other.isValid()) {
	            return other < this ? this : other;
	        } else {
	            return createInvalid();
	        }
	    }
	);

	var prototypeMax = deprecate(
	    'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
	    function () {
	        var other = createLocal.apply(null, arguments);
	        if (this.isValid() && other.isValid()) {
	            return other > this ? this : other;
	        } else {
	            return createInvalid();
	        }
	    }
	);

	// Pick a moment m from moments so that m[fn](other) is true for all
	// other. This relies on the function fn to be transitive.
	//
	// moments should either be an array of moment objects or an array, whose
	// first element is an array of moment objects.
	function pickBy(fn, moments) {
	    var res, i;
	    if (moments.length === 1 && isArray(moments[0])) {
	        moments = moments[0];
	    }
	    if (!moments.length) {
	        return createLocal();
	    }
	    res = moments[0];
	    for (i = 1; i < moments.length; ++i) {
	        if (!moments[i].isValid() || moments[i][fn](res)) {
	            res = moments[i];
	        }
	    }
	    return res;
	}

	// TODO: Use [].sort instead?
	function min () {
	    var args = [].slice.call(arguments, 0);

	    return pickBy('isBefore', args);
	}

	function max () {
	    var args = [].slice.call(arguments, 0);

	    return pickBy('isAfter', args);
	}

	var now = function () {
	    return Date.now ? Date.now() : +(new Date());
	};

	var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

	function isDurationValid(m) {
	    for (var key in m) {
	        if (!(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
	            return false;
	        }
	    }

	    var unitHasDecimal = false;
	    for (var i = 0; i < ordering.length; ++i) {
	        if (m[ordering[i]]) {
	            if (unitHasDecimal) {
	                return false; // only allow non-integers for smallest unit
	            }
	            if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
	                unitHasDecimal = true;
	            }
	        }
	    }

	    return true;
	}

	function isValid$1() {
	    return this._isValid;
	}

	function createInvalid$1() {
	    return createDuration(NaN);
	}

	function Duration (duration) {
	    var normalizedInput = normalizeObjectUnits(duration),
	        years = normalizedInput.year || 0,
	        quarters = normalizedInput.quarter || 0,
	        months = normalizedInput.month || 0,
	        weeks = normalizedInput.week || 0,
	        days = normalizedInput.day || 0,
	        hours = normalizedInput.hour || 0,
	        minutes = normalizedInput.minute || 0,
	        seconds = normalizedInput.second || 0,
	        milliseconds = normalizedInput.millisecond || 0;

	    this._isValid = isDurationValid(normalizedInput);

	    // representation for dateAddRemove
	    this._milliseconds = +milliseconds +
	        seconds * 1e3 + // 1000
	        minutes * 6e4 + // 1000 * 60
	        hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
	    // Because of dateAddRemove treats 24 hours as different from a
	    // day when working around DST, we need to store them separately
	    this._days = +days +
	        weeks * 7;
	    // It is impossible to translate months into days without knowing
	    // which months you are are talking about, so we have to store
	    // it separately.
	    this._months = +months +
	        quarters * 3 +
	        years * 12;

	    this._data = {};

	    this._locale = getLocale();

	    this._bubble();
	}

	function isDuration (obj) {
	    return obj instanceof Duration;
	}

	function absRound (number) {
	    if (number < 0) {
	        return Math.round(-1 * number) * -1;
	    } else {
	        return Math.round(number);
	    }
	}

	// FORMATTING

	function offset (token, separator) {
	    addFormatToken(token, 0, 0, function () {
	        var offset = this.utcOffset();
	        var sign = '+';
	        if (offset < 0) {
	            offset = -offset;
	            sign = '-';
	        }
	        return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
	    });
	}

	offset('Z', ':');
	offset('ZZ', '');

	// PARSING

	addRegexToken('Z',  matchShortOffset);
	addRegexToken('ZZ', matchShortOffset);
	addParseToken(['Z', 'ZZ'], function (input, array, config) {
	    config._useUTC = true;
	    config._tzm = offsetFromString(matchShortOffset, input);
	});

	// HELPERS

	// timezone chunker
	// '+10:00' > ['10',  '00']
	// '-1530'  > ['-15', '30']
	var chunkOffset = /([\+\-]|\d\d)/gi;

	function offsetFromString(matcher, string) {
	    var matches = (string || '').match(matcher);

	    if (matches === null) {
	        return null;
	    }

	    var chunk   = matches[matches.length - 1] || [];
	    var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
	    var minutes = +(parts[1] * 60) + toInt(parts[2]);

	    return minutes === 0 ?
	      0 :
	      parts[0] === '+' ? minutes : -minutes;
	}

	// Return a moment from input, that is local/utc/zone equivalent to model.
	function cloneWithOffset(input, model) {
	    var res, diff;
	    if (model._isUTC) {
	        res = model.clone();
	        diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
	        // Use low-level api, because this fn is low-level api.
	        res._d.setTime(res._d.valueOf() + diff);
	        hooks.updateOffset(res, false);
	        return res;
	    } else {
	        return createLocal(input).local();
	    }
	}

	function getDateOffset (m) {
	    // On Firefox.24 Date#getTimezoneOffset returns a floating point.
	    // https://github.com/moment/moment/pull/1871
	    return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
	}

	// HOOKS

	// This function will be called whenever a moment is mutated.
	// It is intended to keep the offset in sync with the timezone.
	hooks.updateOffset = function () {};

	// MOMENTS

	// keepLocalTime = true means only change the timezone, without
	// affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
	// 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
	// +0200, so we adjust the time as needed, to be valid.
	//
	// Keeping the time actually adds/subtracts (one hour)
	// from the actual represented time. That is why we call updateOffset
	// a second time. In case it wants us to change the offset again
	// _changeInProgress == true case, then we have to adjust, because
	// there is no such time in the given timezone.
	function getSetOffset (input, keepLocalTime, keepMinutes) {
	    var offset = this._offset || 0,
	        localAdjust;
	    if (!this.isValid()) {
	        return input != null ? this : NaN;
	    }
	    if (input != null) {
	        if (typeof input === 'string') {
	            input = offsetFromString(matchShortOffset, input);
	            if (input === null) {
	                return this;
	            }
	        } else if (Math.abs(input) < 16 && !keepMinutes) {
	            input = input * 60;
	        }
	        if (!this._isUTC && keepLocalTime) {
	            localAdjust = getDateOffset(this);
	        }
	        this._offset = input;
	        this._isUTC = true;
	        if (localAdjust != null) {
	            this.add(localAdjust, 'm');
	        }
	        if (offset !== input) {
	            if (!keepLocalTime || this._changeInProgress) {
	                addSubtract(this, createDuration(input - offset, 'm'), 1, false);
	            } else if (!this._changeInProgress) {
	                this._changeInProgress = true;
	                hooks.updateOffset(this, true);
	                this._changeInProgress = null;
	            }
	        }
	        return this;
	    } else {
	        return this._isUTC ? offset : getDateOffset(this);
	    }
	}

	function getSetZone (input, keepLocalTime) {
	    if (input != null) {
	        if (typeof input !== 'string') {
	            input = -input;
	        }

	        this.utcOffset(input, keepLocalTime);

	        return this;
	    } else {
	        return -this.utcOffset();
	    }
	}

	function setOffsetToUTC (keepLocalTime) {
	    return this.utcOffset(0, keepLocalTime);
	}

	function setOffsetToLocal (keepLocalTime) {
	    if (this._isUTC) {
	        this.utcOffset(0, keepLocalTime);
	        this._isUTC = false;

	        if (keepLocalTime) {
	            this.subtract(getDateOffset(this), 'm');
	        }
	    }
	    return this;
	}

	function setOffsetToParsedOffset () {
	    if (this._tzm != null) {
	        this.utcOffset(this._tzm, false, true);
	    } else if (typeof this._i === 'string') {
	        var tZone = offsetFromString(matchOffset, this._i);
	        if (tZone != null) {
	            this.utcOffset(tZone);
	        }
	        else {
	            this.utcOffset(0, true);
	        }
	    }
	    return this;
	}

	function hasAlignedHourOffset (input) {
	    if (!this.isValid()) {
	        return false;
	    }
	    input = input ? createLocal(input).utcOffset() : 0;

	    return (this.utcOffset() - input) % 60 === 0;
	}

	function isDaylightSavingTime () {
	    return (
	        this.utcOffset() > this.clone().month(0).utcOffset() ||
	        this.utcOffset() > this.clone().month(5).utcOffset()
	    );
	}

	function isDaylightSavingTimeShifted () {
	    if (!isUndefined(this._isDSTShifted)) {
	        return this._isDSTShifted;
	    }

	    var c = {};

	    copyConfig(c, this);
	    c = prepareConfig(c);

	    if (c._a) {
	        var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
	        this._isDSTShifted = this.isValid() &&
	            compareArrays(c._a, other.toArray()) > 0;
	    } else {
	        this._isDSTShifted = false;
	    }

	    return this._isDSTShifted;
	}

	function isLocal () {
	    return this.isValid() ? !this._isUTC : false;
	}

	function isUtcOffset () {
	    return this.isValid() ? this._isUTC : false;
	}

	function isUtc () {
	    return this.isValid() ? this._isUTC && this._offset === 0 : false;
	}

	// ASP.NET json date format regex
	var aspNetRegex = /^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

	// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
	// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
	// and further modified to allow for strings containing both week and day
	var isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

	function createDuration (input, key) {
	    var duration = input,
	        // matching against regexp is expensive, do it on demand
	        match = null,
	        sign,
	        ret,
	        diffRes;

	    if (isDuration(input)) {
	        duration = {
	            ms : input._milliseconds,
	            d  : input._days,
	            M  : input._months
	        };
	    } else if (isNumber(input)) {
	        duration = {};
	        if (key) {
	            duration[key] = input;
	        } else {
	            duration.milliseconds = input;
	        }
	    } else if (!!(match = aspNetRegex.exec(input))) {
	        sign = (match[1] === '-') ? -1 : 1;
	        duration = {
	            y  : 0,
	            d  : toInt(match[DATE])                         * sign,
	            h  : toInt(match[HOUR])                         * sign,
	            m  : toInt(match[MINUTE])                       * sign,
	            s  : toInt(match[SECOND])                       * sign,
	            ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
	        };
	    } else if (!!(match = isoRegex.exec(input))) {
	        sign = (match[1] === '-') ? -1 : (match[1] === '+') ? 1 : 1;
	        duration = {
	            y : parseIso(match[2], sign),
	            M : parseIso(match[3], sign),
	            w : parseIso(match[4], sign),
	            d : parseIso(match[5], sign),
	            h : parseIso(match[6], sign),
	            m : parseIso(match[7], sign),
	            s : parseIso(match[8], sign)
	        };
	    } else if (duration == null) {// checks for null or undefined
	        duration = {};
	    } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
	        diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

	        duration = {};
	        duration.ms = diffRes.milliseconds;
	        duration.M = diffRes.months;
	    }

	    ret = new Duration(duration);

	    if (isDuration(input) && hasOwnProp(input, '_locale')) {
	        ret._locale = input._locale;
	    }

	    return ret;
	}

	createDuration.fn = Duration.prototype;
	createDuration.invalid = createInvalid$1;

	function parseIso (inp, sign) {
	    // We'd normally use ~~inp for this, but unfortunately it also
	    // converts floats to ints.
	    // inp may be undefined, so careful calling replace on it.
	    var res = inp && parseFloat(inp.replace(',', '.'));
	    // apply sign while we're at it
	    return (isNaN(res) ? 0 : res) * sign;
	}

	function positiveMomentsDifference(base, other) {
	    var res = {milliseconds: 0, months: 0};

	    res.months = other.month() - base.month() +
	        (other.year() - base.year()) * 12;
	    if (base.clone().add(res.months, 'M').isAfter(other)) {
	        --res.months;
	    }

	    res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

	    return res;
	}

	function momentsDifference(base, other) {
	    var res;
	    if (!(base.isValid() && other.isValid())) {
	        return {milliseconds: 0, months: 0};
	    }

	    other = cloneWithOffset(other, base);
	    if (base.isBefore(other)) {
	        res = positiveMomentsDifference(base, other);
	    } else {
	        res = positiveMomentsDifference(other, base);
	        res.milliseconds = -res.milliseconds;
	        res.months = -res.months;
	    }

	    return res;
	}

	// TODO: remove 'name' arg after deprecation is removed
	function createAdder(direction, name) {
	    return function (val, period) {
	        var dur, tmp;
	        //invert the arguments, but complain about it
	        if (period !== null && !isNaN(+period)) {
	            deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
	            'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
	            tmp = val; val = period; period = tmp;
	        }

	        val = typeof val === 'string' ? +val : val;
	        dur = createDuration(val, period);
	        addSubtract(this, dur, direction);
	        return this;
	    };
	}

	function addSubtract (mom, duration, isAdding, updateOffset) {
	    var milliseconds = duration._milliseconds,
	        days = absRound(duration._days),
	        months = absRound(duration._months);

	    if (!mom.isValid()) {
	        // No op
	        return;
	    }

	    updateOffset = updateOffset == null ? true : updateOffset;

	    if (months) {
	        setMonth(mom, get$1(mom, 'Month') + months * isAdding);
	    }
	    if (days) {
	        set$2(mom, 'Date', get$1(mom, 'Date') + days * isAdding);
	    }
	    if (milliseconds) {
	        mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
	    }
	    if (updateOffset) {
	        hooks.updateOffset(mom, days || months);
	    }
	}

	var add      = createAdder(1, 'add');
	var subtract = createAdder(-1, 'subtract');

	function getCalendarFormat(myMoment, now) {
	    var diff = myMoment.diff(now, 'days', true);
	    return diff < -6 ? 'sameElse' :
	            diff < -1 ? 'lastWeek' :
	            diff < 0 ? 'lastDay' :
	            diff < 1 ? 'sameDay' :
	            diff < 2 ? 'nextDay' :
	            diff < 7 ? 'nextWeek' : 'sameElse';
	}

	function calendar$1 (time, formats) {
	    // We want to compare the start of today, vs this.
	    // Getting start-of-today depends on whether we're local/utc/offset or not.
	    var now = time || createLocal(),
	        sod = cloneWithOffset(now, this).startOf('day'),
	        format = hooks.calendarFormat(this, sod) || 'sameElse';

	    var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

	    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
	}

	function clone () {
	    return new Moment(this);
	}

	function isAfter (input, units) {
	    var localInput = isMoment(input) ? input : createLocal(input);
	    if (!(this.isValid() && localInput.isValid())) {
	        return false;
	    }
	    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
	    if (units === 'millisecond') {
	        return this.valueOf() > localInput.valueOf();
	    } else {
	        return localInput.valueOf() < this.clone().startOf(units).valueOf();
	    }
	}

	function isBefore (input, units) {
	    var localInput = isMoment(input) ? input : createLocal(input);
	    if (!(this.isValid() && localInput.isValid())) {
	        return false;
	    }
	    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
	    if (units === 'millisecond') {
	        return this.valueOf() < localInput.valueOf();
	    } else {
	        return this.clone().endOf(units).valueOf() < localInput.valueOf();
	    }
	}

	function isBetween (from, to, units, inclusivity) {
	    inclusivity = inclusivity || '()';
	    return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
	        (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
	}

	function isSame (input, units) {
	    var localInput = isMoment(input) ? input : createLocal(input),
	        inputMs;
	    if (!(this.isValid() && localInput.isValid())) {
	        return false;
	    }
	    units = normalizeUnits(units || 'millisecond');
	    if (units === 'millisecond') {
	        return this.valueOf() === localInput.valueOf();
	    } else {
	        inputMs = localInput.valueOf();
	        return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
	    }
	}

	function isSameOrAfter (input, units) {
	    return this.isSame(input, units) || this.isAfter(input,units);
	}

	function isSameOrBefore (input, units) {
	    return this.isSame(input, units) || this.isBefore(input,units);
	}

	function diff (input, units, asFloat) {
	    var that,
	        zoneDelta,
	        output;

	    if (!this.isValid()) {
	        return NaN;
	    }

	    that = cloneWithOffset(input, this);

	    if (!that.isValid()) {
	        return NaN;
	    }

	    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

	    units = normalizeUnits(units);

	    switch (units) {
	        case 'year': output = monthDiff(this, that) / 12; break;
	        case 'month': output = monthDiff(this, that); break;
	        case 'quarter': output = monthDiff(this, that) / 3; break;
	        case 'second': output = (this - that) / 1e3; break; // 1000
	        case 'minute': output = (this - that) / 6e4; break; // 1000 * 60
	        case 'hour': output = (this - that) / 36e5; break; // 1000 * 60 * 60
	        case 'day': output = (this - that - zoneDelta) / 864e5; break; // 1000 * 60 * 60 * 24, negate dst
	        case 'week': output = (this - that - zoneDelta) / 6048e5; break; // 1000 * 60 * 60 * 24 * 7, negate dst
	        default: output = this - that;
	    }

	    return asFloat ? output : absFloor(output);
	}

	function monthDiff (a, b) {
	    // difference in months
	    var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
	        // b is in (anchor - 1 month, anchor + 1 month)
	        anchor = a.clone().add(wholeMonthDiff, 'months'),
	        anchor2, adjust;

	    if (b - anchor < 0) {
	        anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
	        // linear across the month
	        adjust = (b - anchor) / (anchor - anchor2);
	    } else {
	        anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
	        // linear across the month
	        adjust = (b - anchor) / (anchor2 - anchor);
	    }

	    //check for negative zero, return zero if negative zero
	    return -(wholeMonthDiff + adjust) || 0;
	}

	hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
	hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

	function toString () {
	    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
	}

	function toISOString(keepOffset) {
	    if (!this.isValid()) {
	        return null;
	    }
	    var utc = keepOffset !== true;
	    var m = utc ? this.clone().utc() : this;
	    if (m.year() < 0 || m.year() > 9999) {
	        return formatMoment(m, utc ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ');
	    }
	    if (isFunction(Date.prototype.toISOString)) {
	        // native implementation is ~50x faster, use it when we can
	        if (utc) {
	            return this.toDate().toISOString();
	        } else {
	            return new Date(this.valueOf() + this.utcOffset() * 60 * 1000).toISOString().replace('Z', formatMoment(m, 'Z'));
	        }
	    }
	    return formatMoment(m, utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ');
	}

	/**
	 * Return a human readable representation of a moment that can
	 * also be evaluated to get a new moment which is the same
	 *
	 * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
	 */
	function inspect () {
	    if (!this.isValid()) {
	        return 'moment.invalid(/* ' + this._i + ' */)';
	    }
	    var func = 'moment';
	    var zone = '';
	    if (!this.isLocal()) {
	        func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
	        zone = 'Z';
	    }
	    var prefix = '[' + func + '("]';
	    var year = (0 <= this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
	    var datetime = '-MM-DD[T]HH:mm:ss.SSS';
	    var suffix = zone + '[")]';

	    return this.format(prefix + year + datetime + suffix);
	}

	function format (inputString) {
	    if (!inputString) {
	        inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
	    }
	    var output = formatMoment(this, inputString);
	    return this.localeData().postformat(output);
	}

	function from (time, withoutSuffix) {
	    if (this.isValid() &&
	            ((isMoment(time) && time.isValid()) ||
	             createLocal(time).isValid())) {
	        return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
	    } else {
	        return this.localeData().invalidDate();
	    }
	}

	function fromNow (withoutSuffix) {
	    return this.from(createLocal(), withoutSuffix);
	}

	function to (time, withoutSuffix) {
	    if (this.isValid() &&
	            ((isMoment(time) && time.isValid()) ||
	             createLocal(time).isValid())) {
	        return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
	    } else {
	        return this.localeData().invalidDate();
	    }
	}

	function toNow (withoutSuffix) {
	    return this.to(createLocal(), withoutSuffix);
	}

	// If passed a locale key, it will set the locale for this
	// instance.  Otherwise, it will return the locale configuration
	// variables for this instance.
	function locale (key) {
	    var newLocaleData;

	    if (key === undefined) {
	        return this._locale._abbr;
	    } else {
	        newLocaleData = getLocale(key);
	        if (newLocaleData != null) {
	            this._locale = newLocaleData;
	        }
	        return this;
	    }
	}

	var lang = deprecate(
	    'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
	    function (key) {
	        if (key === undefined) {
	            return this.localeData();
	        } else {
	            return this.locale(key);
	        }
	    }
	);

	function localeData () {
	    return this._locale;
	}

	function startOf (units) {
	    units = normalizeUnits(units);
	    // the following switch intentionally omits break keywords
	    // to utilize falling through the cases.
	    switch (units) {
	        case 'year':
	            this.month(0);
	            /* falls through */
	        case 'quarter':
	        case 'month':
	            this.date(1);
	            /* falls through */
	        case 'week':
	        case 'isoWeek':
	        case 'day':
	        case 'date':
	            this.hours(0);
	            /* falls through */
	        case 'hour':
	            this.minutes(0);
	            /* falls through */
	        case 'minute':
	            this.seconds(0);
	            /* falls through */
	        case 'second':
	            this.milliseconds(0);
	    }

	    // weeks are a special case
	    if (units === 'week') {
	        this.weekday(0);
	    }
	    if (units === 'isoWeek') {
	        this.isoWeekday(1);
	    }

	    // quarters are also special
	    if (units === 'quarter') {
	        this.month(Math.floor(this.month() / 3) * 3);
	    }

	    return this;
	}

	function endOf (units) {
	    units = normalizeUnits(units);
	    if (units === undefined || units === 'millisecond') {
	        return this;
	    }

	    // 'date' is an alias for 'day', so it should be considered as such.
	    if (units === 'date') {
	        units = 'day';
	    }

	    return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
	}

	function valueOf () {
	    return this._d.valueOf() - ((this._offset || 0) * 60000);
	}

	function unix () {
	    return Math.floor(this.valueOf() / 1000);
	}

	function toDate () {
	    return new Date(this.valueOf());
	}

	function toArray () {
	    var m = this;
	    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
	}

	function toObject () {
	    var m = this;
	    return {
	        years: m.year(),
	        months: m.month(),
	        date: m.date(),
	        hours: m.hours(),
	        minutes: m.minutes(),
	        seconds: m.seconds(),
	        milliseconds: m.milliseconds()
	    };
	}

	function toJSON () {
	    // new Date(NaN).toJSON() === null
	    return this.isValid() ? this.toISOString() : null;
	}

	function isValid$2 () {
	    return isValid(this);
	}

	function parsingFlags () {
	    return extend({}, getParsingFlags(this));
	}

	function invalidAt () {
	    return getParsingFlags(this).overflow;
	}

	function creationData() {
	    return {
	        input: this._i,
	        format: this._f,
	        locale: this._locale,
	        isUTC: this._isUTC,
	        strict: this._strict
	    };
	}

	// FORMATTING

	addFormatToken(0, ['gg', 2], 0, function () {
	    return this.weekYear() % 100;
	});

	addFormatToken(0, ['GG', 2], 0, function () {
	    return this.isoWeekYear() % 100;
	});

	function addWeekYearFormatToken (token, getter) {
	    addFormatToken(0, [token, token.length], 0, getter);
	}

	addWeekYearFormatToken('gggg',     'weekYear');
	addWeekYearFormatToken('ggggg',    'weekYear');
	addWeekYearFormatToken('GGGG',  'isoWeekYear');
	addWeekYearFormatToken('GGGGG', 'isoWeekYear');

	// ALIASES

	addUnitAlias('weekYear', 'gg');
	addUnitAlias('isoWeekYear', 'GG');

	// PRIORITY

	addUnitPriority('weekYear', 1);
	addUnitPriority('isoWeekYear', 1);


	// PARSING

	addRegexToken('G',      matchSigned);
	addRegexToken('g',      matchSigned);
	addRegexToken('GG',     match1to2, match2);
	addRegexToken('gg',     match1to2, match2);
	addRegexToken('GGGG',   match1to4, match4);
	addRegexToken('gggg',   match1to4, match4);
	addRegexToken('GGGGG',  match1to6, match6);
	addRegexToken('ggggg',  match1to6, match6);

	addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
	    week[token.substr(0, 2)] = toInt(input);
	});

	addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
	    week[token] = hooks.parseTwoDigitYear(input);
	});

	// MOMENTS

	function getSetWeekYear (input) {
	    return getSetWeekYearHelper.call(this,
	            input,
	            this.week(),
	            this.weekday(),
	            this.localeData()._week.dow,
	            this.localeData()._week.doy);
	}

	function getSetISOWeekYear (input) {
	    return getSetWeekYearHelper.call(this,
	            input, this.isoWeek(), this.isoWeekday(), 1, 4);
	}

	function getISOWeeksInYear () {
	    return weeksInYear(this.year(), 1, 4);
	}

	function getWeeksInYear () {
	    var weekInfo = this.localeData()._week;
	    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
	}

	function getSetWeekYearHelper(input, week, weekday, dow, doy) {
	    var weeksTarget;
	    if (input == null) {
	        return weekOfYear(this, dow, doy).year;
	    } else {
	        weeksTarget = weeksInYear(input, dow, doy);
	        if (week > weeksTarget) {
	            week = weeksTarget;
	        }
	        return setWeekAll.call(this, input, week, weekday, dow, doy);
	    }
	}

	function setWeekAll(weekYear, week, weekday, dow, doy) {
	    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
	        date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

	    this.year(date.getUTCFullYear());
	    this.month(date.getUTCMonth());
	    this.date(date.getUTCDate());
	    return this;
	}

	// FORMATTING

	addFormatToken('Q', 0, 'Qo', 'quarter');

	// ALIASES

	addUnitAlias('quarter', 'Q');

	// PRIORITY

	addUnitPriority('quarter', 7);

	// PARSING

	addRegexToken('Q', match1);
	addParseToken('Q', function (input, array) {
	    array[MONTH] = (toInt(input) - 1) * 3;
	});

	// MOMENTS

	function getSetQuarter (input) {
	    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
	}

	// FORMATTING

	addFormatToken('D', ['DD', 2], 'Do', 'date');

	// ALIASES

	addUnitAlias('date', 'D');

	// PRIORITY
	addUnitPriority('date', 9);

	// PARSING

	addRegexToken('D',  match1to2);
	addRegexToken('DD', match1to2, match2);
	addRegexToken('Do', function (isStrict, locale) {
	    // TODO: Remove "ordinalParse" fallback in next major release.
	    return isStrict ?
	      (locale._dayOfMonthOrdinalParse || locale._ordinalParse) :
	      locale._dayOfMonthOrdinalParseLenient;
	});

	addParseToken(['D', 'DD'], DATE);
	addParseToken('Do', function (input, array) {
	    array[DATE] = toInt(input.match(match1to2)[0]);
	});

	// MOMENTS

	var getSetDayOfMonth = makeGetSet('Date', true);

	// FORMATTING

	addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

	// ALIASES

	addUnitAlias('dayOfYear', 'DDD');

	// PRIORITY
	addUnitPriority('dayOfYear', 4);

	// PARSING

	addRegexToken('DDD',  match1to3);
	addRegexToken('DDDD', match3);
	addParseToken(['DDD', 'DDDD'], function (input, array, config) {
	    config._dayOfYear = toInt(input);
	});

	// HELPERS

	// MOMENTS

	function getSetDayOfYear (input) {
	    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
	    return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
	}

	// FORMATTING

	addFormatToken('m', ['mm', 2], 0, 'minute');

	// ALIASES

	addUnitAlias('minute', 'm');

	// PRIORITY

	addUnitPriority('minute', 14);

	// PARSING

	addRegexToken('m',  match1to2);
	addRegexToken('mm', match1to2, match2);
	addParseToken(['m', 'mm'], MINUTE);

	// MOMENTS

	var getSetMinute = makeGetSet('Minutes', false);

	// FORMATTING

	addFormatToken('s', ['ss', 2], 0, 'second');

	// ALIASES

	addUnitAlias('second', 's');

	// PRIORITY

	addUnitPriority('second', 15);

	// PARSING

	addRegexToken('s',  match1to2);
	addRegexToken('ss', match1to2, match2);
	addParseToken(['s', 'ss'], SECOND);

	// MOMENTS

	var getSetSecond = makeGetSet('Seconds', false);

	// FORMATTING

	addFormatToken('S', 0, 0, function () {
	    return ~~(this.millisecond() / 100);
	});

	addFormatToken(0, ['SS', 2], 0, function () {
	    return ~~(this.millisecond() / 10);
	});

	addFormatToken(0, ['SSS', 3], 0, 'millisecond');
	addFormatToken(0, ['SSSS', 4], 0, function () {
	    return this.millisecond() * 10;
	});
	addFormatToken(0, ['SSSSS', 5], 0, function () {
	    return this.millisecond() * 100;
	});
	addFormatToken(0, ['SSSSSS', 6], 0, function () {
	    return this.millisecond() * 1000;
	});
	addFormatToken(0, ['SSSSSSS', 7], 0, function () {
	    return this.millisecond() * 10000;
	});
	addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
	    return this.millisecond() * 100000;
	});
	addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
	    return this.millisecond() * 1000000;
	});


	// ALIASES

	addUnitAlias('millisecond', 'ms');

	// PRIORITY

	addUnitPriority('millisecond', 16);

	// PARSING

	addRegexToken('S',    match1to3, match1);
	addRegexToken('SS',   match1to3, match2);
	addRegexToken('SSS',  match1to3, match3);

	var token;
	for (token = 'SSSS'; token.length <= 9; token += 'S') {
	    addRegexToken(token, matchUnsigned);
	}

	function parseMs(input, array) {
	    array[MILLISECOND] = toInt(('0.' + input) * 1000);
	}

	for (token = 'S'; token.length <= 9; token += 'S') {
	    addParseToken(token, parseMs);
	}
	// MOMENTS

	var getSetMillisecond = makeGetSet('Milliseconds', false);

	// FORMATTING

	addFormatToken('z',  0, 0, 'zoneAbbr');
	addFormatToken('zz', 0, 0, 'zoneName');

	// MOMENTS

	function getZoneAbbr () {
	    return this._isUTC ? 'UTC' : '';
	}

	function getZoneName () {
	    return this._isUTC ? 'Coordinated Universal Time' : '';
	}

	var proto$1 = Moment.prototype;

	proto$1.add               = add;
	proto$1.calendar          = calendar$1;
	proto$1.clone             = clone;
	proto$1.diff              = diff;
	proto$1.endOf             = endOf;
	proto$1.format            = format;
	proto$1.from              = from;
	proto$1.fromNow           = fromNow;
	proto$1.to                = to;
	proto$1.toNow             = toNow;
	proto$1.get               = stringGet;
	proto$1.invalidAt         = invalidAt;
	proto$1.isAfter           = isAfter;
	proto$1.isBefore          = isBefore;
	proto$1.isBetween         = isBetween;
	proto$1.isSame            = isSame;
	proto$1.isSameOrAfter     = isSameOrAfter;
	proto$1.isSameOrBefore    = isSameOrBefore;
	proto$1.isValid           = isValid$2;
	proto$1.lang              = lang;
	proto$1.locale            = locale;
	proto$1.localeData        = localeData;
	proto$1.max               = prototypeMax;
	proto$1.min               = prototypeMin;
	proto$1.parsingFlags      = parsingFlags;
	proto$1.set               = stringSet;
	proto$1.startOf           = startOf;
	proto$1.subtract          = subtract;
	proto$1.toArray           = toArray;
	proto$1.toObject          = toObject;
	proto$1.toDate            = toDate;
	proto$1.toISOString       = toISOString;
	proto$1.inspect           = inspect;
	proto$1.toJSON            = toJSON;
	proto$1.toString          = toString;
	proto$1.unix              = unix;
	proto$1.valueOf           = valueOf;
	proto$1.creationData      = creationData;
	proto$1.year       = getSetYear;
	proto$1.isLeapYear = getIsLeapYear;
	proto$1.weekYear    = getSetWeekYear;
	proto$1.isoWeekYear = getSetISOWeekYear;
	proto$1.quarter = proto$1.quarters = getSetQuarter;
	proto$1.month       = getSetMonth;
	proto$1.daysInMonth = getDaysInMonth;
	proto$1.week           = proto$1.weeks        = getSetWeek;
	proto$1.isoWeek        = proto$1.isoWeeks     = getSetISOWeek;
	proto$1.weeksInYear    = getWeeksInYear;
	proto$1.isoWeeksInYear = getISOWeeksInYear;
	proto$1.date       = getSetDayOfMonth;
	proto$1.day        = proto$1.days             = getSetDayOfWeek;
	proto$1.weekday    = getSetLocaleDayOfWeek;
	proto$1.isoWeekday = getSetISODayOfWeek;
	proto$1.dayOfYear  = getSetDayOfYear;
	proto$1.hour = proto$1.hours = getSetHour;
	proto$1.minute = proto$1.minutes = getSetMinute;
	proto$1.second = proto$1.seconds = getSetSecond;
	proto$1.millisecond = proto$1.milliseconds = getSetMillisecond;
	proto$1.utcOffset            = getSetOffset;
	proto$1.utc                  = setOffsetToUTC;
	proto$1.local                = setOffsetToLocal;
	proto$1.parseZone            = setOffsetToParsedOffset;
	proto$1.hasAlignedHourOffset = hasAlignedHourOffset;
	proto$1.isDST                = isDaylightSavingTime;
	proto$1.isLocal              = isLocal;
	proto$1.isUtcOffset          = isUtcOffset;
	proto$1.isUtc                = isUtc;
	proto$1.isUTC                = isUtc;
	proto$1.zoneAbbr = getZoneAbbr;
	proto$1.zoneName = getZoneName;
	proto$1.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
	proto$1.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
	proto$1.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
	proto$1.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
	proto$1.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

	function createUnix (input) {
	    return createLocal(input * 1000);
	}

	function createInZone () {
	    return createLocal.apply(null, arguments).parseZone();
	}

	function preParsePostFormat (string) {
	    return string;
	}

	var proto$2 = Locale.prototype;

	proto$2.calendar        = calendar;
	proto$2.longDateFormat  = longDateFormat;
	proto$2.invalidDate     = invalidDate;
	proto$2.ordinal         = ordinal;
	proto$2.preparse        = preParsePostFormat;
	proto$2.postformat      = preParsePostFormat;
	proto$2.relativeTime    = relativeTime;
	proto$2.pastFuture      = pastFuture;
	proto$2.set             = set$1;

	proto$2.months            =        localeMonths;
	proto$2.monthsShort       =        localeMonthsShort;
	proto$2.monthsParse       =        localeMonthsParse;
	proto$2.monthsRegex       = monthsRegex;
	proto$2.monthsShortRegex  = monthsShortRegex;
	proto$2.week = localeWeek;
	proto$2.firstDayOfYear = localeFirstDayOfYear;
	proto$2.firstDayOfWeek = localeFirstDayOfWeek;

	proto$2.weekdays       =        localeWeekdays;
	proto$2.weekdaysMin    =        localeWeekdaysMin;
	proto$2.weekdaysShort  =        localeWeekdaysShort;
	proto$2.weekdaysParse  =        localeWeekdaysParse;

	proto$2.weekdaysRegex       =        weekdaysRegex;
	proto$2.weekdaysShortRegex  =        weekdaysShortRegex;
	proto$2.weekdaysMinRegex    =        weekdaysMinRegex;

	proto$2.isPM = localeIsPM;
	proto$2.meridiem = localeMeridiem;

	function get$2 (format, index, field, setter) {
	    var locale = getLocale();
	    var utc = createUTC().set(setter, index);
	    return locale[field](utc, format);
	}

	function listMonthsImpl (format, index, field) {
	    if (isNumber(format)) {
	        index = format;
	        format = undefined;
	    }

	    format = format || '';

	    if (index != null) {
	        return get$2(format, index, field, 'month');
	    }

	    var i;
	    var out = [];
	    for (i = 0; i < 12; i++) {
	        out[i] = get$2(format, i, field, 'month');
	    }
	    return out;
	}

	// ()
	// (5)
	// (fmt, 5)
	// (fmt)
	// (true)
	// (true, 5)
	// (true, fmt, 5)
	// (true, fmt)
	function listWeekdaysImpl (localeSorted, format, index, field) {
	    if (typeof localeSorted === 'boolean') {
	        if (isNumber(format)) {
	            index = format;
	            format = undefined;
	        }

	        format = format || '';
	    } else {
	        format = localeSorted;
	        index = format;
	        localeSorted = false;

	        if (isNumber(format)) {
	            index = format;
	            format = undefined;
	        }

	        format = format || '';
	    }

	    var locale = getLocale(),
	        shift = localeSorted ? locale._week.dow : 0;

	    if (index != null) {
	        return get$2(format, (index + shift) % 7, field, 'day');
	    }

	    var i;
	    var out = [];
	    for (i = 0; i < 7; i++) {
	        out[i] = get$2(format, (i + shift) % 7, field, 'day');
	    }
	    return out;
	}

	function listMonths (format, index) {
	    return listMonthsImpl(format, index, 'months');
	}

	function listMonthsShort (format, index) {
	    return listMonthsImpl(format, index, 'monthsShort');
	}

	function listWeekdays (localeSorted, format, index) {
	    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
	}

	function listWeekdaysShort (localeSorted, format, index) {
	    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
	}

	function listWeekdaysMin (localeSorted, format, index) {
	    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
	}

	getSetGlobalLocale('en', {
	    dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
	    ordinal : function (number) {
	        var b = number % 10,
	            output = (toInt(number % 100 / 10) === 1) ? 'th' :
	            (b === 1) ? 'st' :
	            (b === 2) ? 'nd' :
	            (b === 3) ? 'rd' : 'th';
	        return number + output;
	    }
	});

	// Side effect imports

	hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
	hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

	var mathAbs = Math.abs;

	function abs () {
	    var data           = this._data;

	    this._milliseconds = mathAbs(this._milliseconds);
	    this._days         = mathAbs(this._days);
	    this._months       = mathAbs(this._months);

	    data.milliseconds  = mathAbs(data.milliseconds);
	    data.seconds       = mathAbs(data.seconds);
	    data.minutes       = mathAbs(data.minutes);
	    data.hours         = mathAbs(data.hours);
	    data.months        = mathAbs(data.months);
	    data.years         = mathAbs(data.years);

	    return this;
	}

	function addSubtract$1 (duration, input, value, direction) {
	    var other = createDuration(input, value);

	    duration._milliseconds += direction * other._milliseconds;
	    duration._days         += direction * other._days;
	    duration._months       += direction * other._months;

	    return duration._bubble();
	}

	// supports only 2.0-style add(1, 's') or add(duration)
	function add$1 (input, value) {
	    return addSubtract$1(this, input, value, 1);
	}

	// supports only 2.0-style subtract(1, 's') or subtract(duration)
	function subtract$1 (input, value) {
	    return addSubtract$1(this, input, value, -1);
	}

	function absCeil (number) {
	    if (number < 0) {
	        return Math.floor(number);
	    } else {
	        return Math.ceil(number);
	    }
	}

	function bubble () {
	    var milliseconds = this._milliseconds;
	    var days         = this._days;
	    var months       = this._months;
	    var data         = this._data;
	    var seconds, minutes, hours, years, monthsFromDays;

	    // if we have a mix of positive and negative values, bubble down first
	    // check: https://github.com/moment/moment/issues/2166
	    if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
	            (milliseconds <= 0 && days <= 0 && months <= 0))) {
	        milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
	        days = 0;
	        months = 0;
	    }

	    // The following code bubbles up values, see the tests for
	    // examples of what that means.
	    data.milliseconds = milliseconds % 1000;

	    seconds           = absFloor(milliseconds / 1000);
	    data.seconds      = seconds % 60;

	    minutes           = absFloor(seconds / 60);
	    data.minutes      = minutes % 60;

	    hours             = absFloor(minutes / 60);
	    data.hours        = hours % 24;

	    days += absFloor(hours / 24);

	    // convert days to months
	    monthsFromDays = absFloor(daysToMonths(days));
	    months += monthsFromDays;
	    days -= absCeil(monthsToDays(monthsFromDays));

	    // 12 months -> 1 year
	    years = absFloor(months / 12);
	    months %= 12;

	    data.days   = days;
	    data.months = months;
	    data.years  = years;

	    return this;
	}

	function daysToMonths (days) {
	    // 400 years have 146097 days (taking into account leap year rules)
	    // 400 years have 12 months === 4800
	    return days * 4800 / 146097;
	}

	function monthsToDays (months) {
	    // the reverse of daysToMonths
	    return months * 146097 / 4800;
	}

	function as (units) {
	    if (!this.isValid()) {
	        return NaN;
	    }
	    var days;
	    var months;
	    var milliseconds = this._milliseconds;

	    units = normalizeUnits(units);

	    if (units === 'month' || units === 'year') {
	        days   = this._days   + milliseconds / 864e5;
	        months = this._months + daysToMonths(days);
	        return units === 'month' ? months : months / 12;
	    } else {
	        // handle milliseconds separately because of floating point math errors (issue #1867)
	        days = this._days + Math.round(monthsToDays(this._months));
	        switch (units) {
	            case 'week'   : return days / 7     + milliseconds / 6048e5;
	            case 'day'    : return days         + milliseconds / 864e5;
	            case 'hour'   : return days * 24    + milliseconds / 36e5;
	            case 'minute' : return days * 1440  + milliseconds / 6e4;
	            case 'second' : return days * 86400 + milliseconds / 1000;
	            // Math.floor prevents floating point math errors here
	            case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
	            default: throw new Error('Unknown unit ' + units);
	        }
	    }
	}

	// TODO: Use this.as('ms')?
	function valueOf$1 () {
	    if (!this.isValid()) {
	        return NaN;
	    }
	    return (
	        this._milliseconds +
	        this._days * 864e5 +
	        (this._months % 12) * 2592e6 +
	        toInt(this._months / 12) * 31536e6
	    );
	}

	function makeAs (alias) {
	    return function () {
	        return this.as(alias);
	    };
	}

	var asMilliseconds = makeAs('ms');
	var asSeconds      = makeAs('s');
	var asMinutes      = makeAs('m');
	var asHours        = makeAs('h');
	var asDays         = makeAs('d');
	var asWeeks        = makeAs('w');
	var asMonths       = makeAs('M');
	var asYears        = makeAs('y');

	function clone$1 () {
	    return createDuration(this);
	}

	function get$3 (units) {
	    units = normalizeUnits(units);
	    return this.isValid() ? this[units + 's']() : NaN;
	}

	function makeGetter(name) {
	    return function () {
	        return this.isValid() ? this._data[name] : NaN;
	    };
	}

	var milliseconds = makeGetter('milliseconds');
	var seconds      = makeGetter('seconds');
	var minutes      = makeGetter('minutes');
	var hours        = makeGetter('hours');
	var days         = makeGetter('days');
	var months       = makeGetter('months');
	var years        = makeGetter('years');

	function weeks () {
	    return absFloor(this.days() / 7);
	}

	var round = Math.round;
	var thresholds = {
	    ss: 44,         // a few seconds to seconds
	    s : 45,         // seconds to minute
	    m : 45,         // minutes to hour
	    h : 22,         // hours to day
	    d : 26,         // days to month
	    M : 11          // months to year
	};

	// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
	function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
	    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
	}

	function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
	    var duration = createDuration(posNegDuration).abs();
	    var seconds  = round(duration.as('s'));
	    var minutes  = round(duration.as('m'));
	    var hours    = round(duration.as('h'));
	    var days     = round(duration.as('d'));
	    var months   = round(duration.as('M'));
	    var years    = round(duration.as('y'));

	    var a = seconds <= thresholds.ss && ['s', seconds]  ||
	            seconds < thresholds.s   && ['ss', seconds] ||
	            minutes <= 1             && ['m']           ||
	            minutes < thresholds.m   && ['mm', minutes] ||
	            hours   <= 1             && ['h']           ||
	            hours   < thresholds.h   && ['hh', hours]   ||
	            days    <= 1             && ['d']           ||
	            days    < thresholds.d   && ['dd', days]    ||
	            months  <= 1             && ['M']           ||
	            months  < thresholds.M   && ['MM', months]  ||
	            years   <= 1             && ['y']           || ['yy', years];

	    a[2] = withoutSuffix;
	    a[3] = +posNegDuration > 0;
	    a[4] = locale;
	    return substituteTimeAgo.apply(null, a);
	}

	// This function allows you to set the rounding function for relative time strings
	function getSetRelativeTimeRounding (roundingFunction) {
	    if (roundingFunction === undefined) {
	        return round;
	    }
	    if (typeof(roundingFunction) === 'function') {
	        round = roundingFunction;
	        return true;
	    }
	    return false;
	}

	// This function allows you to set a threshold for relative time strings
	function getSetRelativeTimeThreshold (threshold, limit) {
	    if (thresholds[threshold] === undefined) {
	        return false;
	    }
	    if (limit === undefined) {
	        return thresholds[threshold];
	    }
	    thresholds[threshold] = limit;
	    if (threshold === 's') {
	        thresholds.ss = limit - 1;
	    }
	    return true;
	}

	function humanize (withSuffix) {
	    if (!this.isValid()) {
	        return this.localeData().invalidDate();
	    }

	    var locale = this.localeData();
	    var output = relativeTime$1(this, !withSuffix, locale);

	    if (withSuffix) {
	        output = locale.pastFuture(+this, output);
	    }

	    return locale.postformat(output);
	}

	var abs$1 = Math.abs;

	function sign(x) {
	    return ((x > 0) - (x < 0)) || +x;
	}

	function toISOString$1() {
	    // for ISO strings we do not use the normal bubbling rules:
	    //  * milliseconds bubble up until they become hours
	    //  * days do not bubble at all
	    //  * months bubble up until they become years
	    // This is because there is no context-free conversion between hours and days
	    // (think of clock changes)
	    // and also not between days and months (28-31 days per month)
	    if (!this.isValid()) {
	        return this.localeData().invalidDate();
	    }

	    var seconds = abs$1(this._milliseconds) / 1000;
	    var days         = abs$1(this._days);
	    var months       = abs$1(this._months);
	    var minutes, hours, years;

	    // 3600 seconds -> 60 minutes -> 1 hour
	    minutes           = absFloor(seconds / 60);
	    hours             = absFloor(minutes / 60);
	    seconds %= 60;
	    minutes %= 60;

	    // 12 months -> 1 year
	    years  = absFloor(months / 12);
	    months %= 12;


	    // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
	    var Y = years;
	    var M = months;
	    var D = days;
	    var h = hours;
	    var m = minutes;
	    var s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';
	    var total = this.asSeconds();

	    if (!total) {
	        // this is the same as C#'s (Noda) and python (isodate)...
	        // but not other JS (goog.date)
	        return 'P0D';
	    }

	    var totalSign = total < 0 ? '-' : '';
	    var ymSign = sign(this._months) !== sign(total) ? '-' : '';
	    var daysSign = sign(this._days) !== sign(total) ? '-' : '';
	    var hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

	    return totalSign + 'P' +
	        (Y ? ymSign + Y + 'Y' : '') +
	        (M ? ymSign + M + 'M' : '') +
	        (D ? daysSign + D + 'D' : '') +
	        ((h || m || s) ? 'T' : '') +
	        (h ? hmsSign + h + 'H' : '') +
	        (m ? hmsSign + m + 'M' : '') +
	        (s ? hmsSign + s + 'S' : '');
	}

	var proto$3 = Duration.prototype;

	proto$3.isValid        = isValid$1;
	proto$3.abs            = abs;
	proto$3.add            = add$1;
	proto$3.subtract       = subtract$1;
	proto$3.as             = as;
	proto$3.asMilliseconds = asMilliseconds;
	proto$3.asSeconds      = asSeconds;
	proto$3.asMinutes      = asMinutes;
	proto$3.asHours        = asHours;
	proto$3.asDays         = asDays;
	proto$3.asWeeks        = asWeeks;
	proto$3.asMonths       = asMonths;
	proto$3.asYears        = asYears;
	proto$3.valueOf        = valueOf$1;
	proto$3._bubble        = bubble;
	proto$3.clone          = clone$1;
	proto$3.get            = get$3;
	proto$3.milliseconds   = milliseconds;
	proto$3.seconds        = seconds;
	proto$3.minutes        = minutes;
	proto$3.hours          = hours;
	proto$3.days           = days;
	proto$3.weeks          = weeks;
	proto$3.months         = months;
	proto$3.years          = years;
	proto$3.humanize       = humanize;
	proto$3.toISOString    = toISOString$1;
	proto$3.toString       = toISOString$1;
	proto$3.toJSON         = toISOString$1;
	proto$3.locale         = locale;
	proto$3.localeData     = localeData;

	proto$3.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
	proto$3.lang = lang;

	// Side effect imports

	// FORMATTING

	addFormatToken('X', 0, 0, 'unix');
	addFormatToken('x', 0, 0, 'valueOf');

	// PARSING

	addRegexToken('x', matchSigned);
	addRegexToken('X', matchTimestamp);
	addParseToken('X', function (input, array, config) {
	    config._d = new Date(parseFloat(input, 10) * 1000);
	});
	addParseToken('x', function (input, array, config) {
	    config._d = new Date(toInt(input));
	});

	// Side effect imports

	//! moment.js

	hooks.version = '2.22.2';

	setHookCallback(createLocal);

	hooks.fn                    = proto$1;
	hooks.min                   = min;
	hooks.max                   = max;
	hooks.now                   = now;
	hooks.utc                   = createUTC;
	hooks.unix                  = createUnix;
	hooks.months                = listMonths;
	hooks.isDate                = isDate;
	hooks.locale                = getSetGlobalLocale;
	hooks.invalid               = createInvalid;
	hooks.duration              = createDuration;
	hooks.isMoment              = isMoment;
	hooks.weekdays              = listWeekdays;
	hooks.parseZone             = createInZone;
	hooks.localeData            = getLocale;
	hooks.isDuration            = isDuration;
	hooks.monthsShort           = listMonthsShort;
	hooks.weekdaysMin           = listWeekdaysMin;
	hooks.defineLocale          = defineLocale;
	hooks.updateLocale          = updateLocale;
	hooks.locales               = listLocales;
	hooks.weekdaysShort         = listWeekdaysShort;
	hooks.normalizeUnits        = normalizeUnits;
	hooks.relativeTimeRounding  = getSetRelativeTimeRounding;
	hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
	hooks.calendarFormat        = getCalendarFormat;
	hooks.prototype             = proto$1;

	// currently HTML5 input type only supports 24-hour formats
	hooks.HTML5_FMT = {
	    DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',             // <input type="datetime-local" />
	    DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss',  // <input type="datetime-local" step="1" />
	    DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS',   // <input type="datetime-local" step="0.001" />
	    DATE: 'YYYY-MM-DD',                             // <input type="date" />
	    TIME: 'HH:mm',                                  // <input type="time" />
	    TIME_SECONDS: 'HH:mm:ss',                       // <input type="time" step="1" />
	    TIME_MS: 'HH:mm:ss.SSS',                        // <input type="time" step="0.001" />
	    WEEK: 'YYYY-[W]WW',                             // <input type="week" />
	    MONTH: 'YYYY-MM'                                // <input type="month" />
	};

	class Utils {
	    /**
	     * Returns position of date on a line if from and to represent length of width
	     * @param {*} date 
	     * @param {*} from 
	     * @param {*} to 
	     * @param {*} width 
	     */
	    static getPositionByDate (date, from, to, width) {
	        if (!date) {
	          return undefined
	        }

	        let durationTo = date.diff(from, 'milliseconds');
	        let durationToEnd = to.diff(from, 'milliseconds');

	        return durationTo / durationToEnd * width;
	    }

	    static getDateByPosition (x, from, to, width) {
	        //x: width = res:to.diff(from, 'milliseconds') 

	        let durationTo = x / width * to.diff(from, 'milliseconds');
	        let dateAtPosition = from.clone().add(durationTo, 'milliseconds');
	        return dateAtPosition; 
	    }

	    /**
	     * 
	     * @param {Moment} date - Date
	     * @param {string} unit - Unit
	     * @param {number} offset - Magnet offset to round with 
	     * @returns {Moment} rounded date passed as parameter
	     */
	    static roundTo (date, unit, offset) {
	        offset = offset || 1;
	        let value = date.get(unit);
	    
	        value = Math.round(value / offset);
	    
	        let units = ['millisecond', 'second', 'minute', 'hour', 'date', 'month', 'year'];
	        date.set(unit, value * offset);
	    
	        let indexOf = units.indexOf(unit);
	        for (let i = 0; i < indexOf; i++) {
	          date.set(units[i], 0);
	        }
	    
	        return date
	    }

	    //get mouse position within the element
	    static getRelativePos(node, event) {
	        const rect = node.getBoundingClientRect();
	        const x = event.clientX - rect.left; //x position within the element.
	        const y = event.clientY - rect.top;  //y position within the element.
	        return {
	            x: x,
	            y: y
	        }
	    }

	    static addEventListenerOnce(target, type, listener, addOptions, removeOptions) {
	        target.addEventListener(type, function fn(event) {
	            target.removeEventListener(type, fn, removeOptions);
	            listener.apply(this, arguments, addOptions);
	        });
	    }
	}

	/* src\ContextMenu.html generated by Svelte v2.9.10 */

	function data() {
	    return {
	        actions: [],
	        top: 0,
	        left: 0
	    }
	}
	var methods = {
	    position(point) {
	        this.set({top: point.y, left: point.x});
	    },
	    execute(event, action) {
	        event.stopPropagation();
	        action.action();

	        this.options.onactionend();
	        //close();
	    },
	    close() {
	        //this.refs.yolo.remove();
	        this.destroy();
	    },
	    isTarget(event) {
	        return this.refs.contextMenu === event.target;
	    }
	};

	function oncreate(dsds) {
	    this.position(this.options.position);
	    //this.set({ actions: this.options.actions });
	}
	const file = "src\\ContextMenu.html";

	function create_main_fragment(component, ctx) {
		var div, current;

		var each_value = ctx.actions;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(component, get_each_context(ctx, each_value, i));
		}

		return {
			c: function create() {
				div = createElement("div");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				div.className = "context-menu svelte-1ps9bwa";
				setStyle(div, "top", "" + ctx.top + "px");
				setStyle(div, "left", "" + ctx.left + "px");
				addLoc(div, file, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insertNode(div, target, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div, null);
				}

				component.refs.contextMenu = div;
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.actions) {
					each_value = ctx.actions;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block(component, child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}

				if (changed.top) {
					setStyle(div, "top", "" + ctx.top + "px");
				}

				if (changed.left) {
					setStyle(div, "left", "" + ctx.left + "px");
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				destroyEach(each_blocks, detach);

				if (component.refs.contextMenu === div) component.refs.contextMenu = null;
			}
		};
	}

	// (2:4) {#each actions as action}
	function create_each_block(component, ctx) {
		var div, text_value = ctx.action.label, text;

		return {
			c: function create() {
				div = createElement("div");
				text = createText(text_value);
				div._svelte = { component, ctx };

				addListener(div, "click", click_handler);
				div.className = "context-option svelte-1ps9bwa";
				addLoc(div, file, 2, 8, 117);
			},

			m: function mount(target, anchor) {
				insertNode(div, target, anchor);
				appendNode(text, div);
			},

			p: function update(changed, ctx) {
				if ((changed.actions) && text_value !== (text_value = ctx.action.label)) {
					setData(text, text_value);
				}

				div._svelte.ctx = ctx;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				removeListener(div, "click", click_handler);
			}
		};
	}

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.action = list[i];
		child_ctx.each_value = list;
		child_ctx.action_index = i;
		return child_ctx;
	}

	function click_handler(event) {
		const { component, ctx } = this._svelte;

		component.execute(event, ctx.action);
	}

	function ContextMenu(options) {
		this._debugName = '<ContextMenu>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this.refs = {};
		this._state = assign(data(), options.data);
		if (!('top' in this._state)) console.warn("<ContextMenu> was created without expected data property 'top'");
		if (!('left' in this._state)) console.warn("<ContextMenu> was created without expected data property 'left'");
		if (!('actions' in this._state)) console.warn("<ContextMenu> was created without expected data property 'actions'");
		this._intro = !!options.intro;

		if (!options.root) {
			this._oncreate = [];
		}

		this._fragment = create_main_fragment(this, this._state);

		this.root._oncreate.push(() => {
			oncreate.call(this);
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			callAll(this._oncreate);
		}

		this._intro = true;
	}

	assign(ContextMenu.prototype, protoDev);
	assign(ContextMenu.prototype, methods);

	ContextMenu.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Task.html generated by Svelte v2.9.10 */

	const resizeHandleWidth = 15;

	let SvelteTask;

	function notify(task) {
	    if(task.dependencies){
	        for(let i = 0; i < task.dependencies.length; i++){
	            task.dependencies[i].update();
	        }
	    }
	}

	function updatePosition(task, ganttUtils){
	    const left = ganttUtils.getPositionByDate(task.from);
	    const right = ganttUtils.getPositionByDate(task.to); 

	    task.left = left;
	    task.width = right - left;
	}

	function data$1() {
	    return {
	        task: { dragging: false }
	    }
	}
	var methods$1 = {
				updateTaskPosition() {
	        const { ganttUtils } = this.store.get();
	        const { task } = this.get();
	    
	        //console.log(task.from.format('DD-MM-YYYY HH:mm:ss:SSS'), task.to.format('DD-MM-YYYY HH:mm:ss:SSS'));
	        updatePosition(task, ganttUtils);


	        //console.log(task.left, task.width);
	        //this.set({ task: task });
	    },
	    updateTaskDate() {
	        const { ganttUtils } = this.store.get();
	        const { task } = this.get();
	        
	        if(task) {
	            const from = ganttUtils.getDateByPosition(task.left);
	            const to = ganttUtils.getDateByPosition(task.left + task.width);
	            

	            task.from = this.magnetDate(from);
	            task.to = this.magnetDate(to);

	            //console.log(from.format('DD-MM-YYYY HH:mm'), to.format('DD-MM-YYYY HH:mm'));
	                    
	            //this.set({ task: task });
	        }
	        
	    },
	    magnetDate(date) {
	        const { ganttUtils } = this.store.get();
	        return ganttUtils.roundTo(date);
	    }
	};

	function oncreate$1() {
	    const { task, row } = this.get();
	    task.row = row;
	    task.component = this;

	    this.updateTaskPosition();
	}
	function ondestroy() {
	    const { task, row } = this.get();
	    if(task.component === this) {
	        task.component = null;
	    }
	}
	function setup(component) {
	    SvelteTask = component;
	    SvelteTask.updatePosition = updatePosition;
	}
	function drag(node) {
	                const { rowContainerElement, ganttUtils } = this.store.get();
	                const windowElement = window;

	                const { task } = this.get();

	                let mouseStartPosX;
	                let mouseStartRight;

	                function onmousedown(event) {
	                    event.stopPropagation();
	                    event.preventDefault();
	                    console.log('drag down');

	                    mouseStartPosX = Utils.getRelativePos(rowContainerElement, event).x - task.left;
	                    mouseStartRight = task.left + task.width;

	                    if(mouseStartPosX < resizeHandleWidth) {
	                        task.resizing = true;
	                        task.direction = 'left';
	                    }
	                    else if(mouseStartPosX > task.width - resizeHandleWidth) {
	                        task.resizing = true;
	                        task.direction = 'right';
	                    }
	                    else {
	                        task.dragging = true;
	                    }

	                    windowElement.addEventListener('mousemove', onmousemove, false);
	                    Utils.addEventListenerOnce(windowElement, 'mouseup', onmouseup);
	                }
	                
	                function onmousemove(event) {
	                    
	                    event.preventDefault();
	                    if(task.resizing) {
	                        const mousePos = Utils.getRelativePos(rowContainerElement, event);
	                        
	                        if(task.direction === 'left') { //resize ulijevo
	                            if(mousePos.x > task.left + task.width) {
	                                task.left = mouseStartRight; //mousePos.x //
	                                task.width = task.left - mousePos.x;
	                                task.direction = 'right';
	                                mouseStartRight = task.left + task.width;
	                            }
	                            else{
	                                task.left = mousePos.x;
	                                task.width = mouseStartRight - mousePos.x;
	                            }
	                        }
	                        else if(task.direction === 'right') {//resize desno
	                            if(mousePos.x <= task.left) {
	                                task.width = task.left - mousePos.x;
	                                task.left = mousePos.x;
	                                task.direction = 'left';
	                                mouseStartRight = task.left + task.width;
	                            }
	                            else {
	                                task.width = mousePos.x - task.left;
	                            }
	                        }

	                        console.log(mousePos.x, mouseStartPosX);

	                        task.component.updateTaskDate();
	                        task.component.updateTaskPosition();
	                        task.component.set({ task });
	                        task.component.fire('taskResized', { task: task });
	                    }

	                    if(task.dragging) {
	                        const mousePos = Utils.getRelativePos(rowContainerElement, event);
	                        task.left = mousePos.x - mouseStartPosX;

	                        task.component.updateTaskDate();//pomaknuti na kraj funkcije
	                        task.component.updateTaskPosition();
	                        
	                        //row switching
	                        const rowCenterX = rowContainerElement.getBoundingClientRect().left + rowContainerElement.getBoundingClientRect().width / 2;
	                        const sourceRow = task.row;

	                        let elements = document.elementsFromPoint(rowCenterX, event.clientY);
	                        let rowElement = elements.find((element) => element.classList.contains('row'));
	                        if(rowElement !== undefined && rowElement !== sourceRow.rowElement) {

	                            const { visibleRows } = task.component.store.get();

	                            const targetRow = visibleRows.find((r) => r.rowElement === rowElement);
	                            console.log('move task to '+targetRow.label, targetRow);

	                            task.row = targetRow;
	                            targetRow.tasks.push(task);
	                            
	                            let i, sourceTask;
	                            for (i = 0; i < sourceRow.tasks.length; i++) {
	                                sourceTask = sourceRow.tasks[i];
	                                if (sourceTask === task) {
	                                    break;
	                                }
	                            }
	                            sourceRow.tasks.splice(i, 1);
	                            task.component.store.set({visibleRows: visibleRows});
	                            
	                            task.component.fire('taskMovedRow', { task: task, row: targetRow });
	                            targetRow.component.moved();
	                        }
	                        task.component.fire('taskMoved', { task: task });
	                        //task.component.fire('updateVisibleRows');
	                    }
	                    task.component.set({task:task});
	                    notify(task);
	                }

	                function onmouseup(event) {
	                    console.log('drag up'); 
	                    task.dragging = false;
	                    task.resizing = false;
	                    task.direction = null;
	                    windowElement.removeEventListener('mousemove', onmousemove, false);
	                }

	                node.addEventListener('mousedown', onmousedown, false);

		return {
			update() {
	                        
			},

			destroy() {
				node.removeEventListener('mousedown', onmousedown, false);
				node.removeEventListener('mousemove', onmousemove, false);
				node.removeEventListener('mouseup', onmouseup, false);
			}
		}
	            }
	function contextMenu(node){
	    const { task } = this.get();
	    const { contextMenuManager } = this.store.get();

	    const options = [
	        {
	            label: 'Copy',
	            action: () => console.log('clicked action 1 for task ', task.id)
	        },
	        {
	            label: 'Clear dependencies',
	            action: () => console.log('clicked action 2 for task ', task.id)
	        }
	    ];

	    function onClose(event) {
	        //if(!contextMenu.isTarget(e))
	        contextMenuManager.close();
	    }

					node.addEventListener('mouseup', (e) => {
	        if(e.which === 3){
	            e.stopPropagation();
	            contextMenuManager.open(options, {x: e.x, y: e.y});

	            Utils.addEventListenerOnce(node, 'mousedown', onClose); //document.body
	        }
	    });

					return {
						destroy() {
	            contextMenuManager.close();
						}
					}
	}
	function selectable(node) {
	    const { task } = this.get();
	    const self = this;
	    //temporary fix, use class:selected directive
	    if(task.selected){
	        node.classList.add('selected'); 
	    }
	    else{
	        node.classList.remove('selected');
	    }

	    node.addEventListener('click', (e) => {
	        task.selected = !!!task.selected;
	        if(task.selected){
	            node.classList.add('selected'); 
	        }
	        else{
	            node.classList.remove('selected');
	        }
	        self.set({ task });
	    });
	}
	const file$1 = "src\\Task.html";

	function create_main_fragment$1(component, ctx) {
		var div, div_1, text, text_1_value = ctx.task.label, text_1, text_2, text_3_value = ctx.task.selected, text_3, drag_action, contextMenu_action, selectable_action, current;

		return {
			c: function create() {
				div = createElement("div");
				div_1 = createElement("div");
				text = createText("\r\n    ");
				text_1 = createText(text_1_value);
				text_2 = createText("\r\n    ");
				text_3 = createText(text_3_value);
				div_1.className = "task-background svelte-cbb6f";
				setStyle(div_1, "width", "" + ctx.task.amountDone + "%");
				addLoc(div_1, file$1, 5, 4, 135);
				div.className = "task svelte-cbb6f";
				setStyle(div, "left", "" + ctx.task.left + "px");
				setStyle(div, "width", "" + ctx.task.width + "px");
				drag_action = drag.call(component, div) || {};
				contextMenu_action = contextMenu.call(component, div) || {};
				selectable_action = selectable.call(component, div) || {};
				addLoc(div, file$1, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insertNode(div, target, anchor);
				appendNode(div_1, div);
				appendNode(text, div);
				appendNode(text_1, div);
				appendNode(text_2, div);
				appendNode(text_3, div);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.task) {
					setStyle(div_1, "width", "" + ctx.task.amountDone + "%");
				}

				if ((changed.task) && text_1_value !== (text_1_value = ctx.task.label)) {
					setData(text_1, text_1_value);
				}

				if ((changed.task) && text_3_value !== (text_3_value = ctx.task.selected)) {
					setData(text_3, text_3_value);
				}

				if (changed.task) {
					setStyle(div, "left", "" + ctx.task.left + "px");
					setStyle(div, "width", "" + ctx.task.width + "px");
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				if (typeof drag_action.destroy === 'function') drag_action.destroy.call(component);
				if (typeof contextMenu_action.destroy === 'function') contextMenu_action.destroy.call(component);
				if (typeof selectable_action.destroy === 'function') selectable_action.destroy.call(component);
			}
		};
	}

	function Task$1(options) {
		this._debugName = '<Task>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this._state = assign(data$1(), options.data);
		if (!('task' in this._state)) console.warn("<Task> was created without expected data property 'task'");
		this._intro = !!options.intro;

		this._handlers.destroy = [ondestroy];

		if (!options.root) {
			this._oncreate = [];
		}

		this._fragment = create_main_fragment$1(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$1.call(this);
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			callAll(this._oncreate);
		}

		this._intro = true;
	}

	assign(Task$1.prototype, protoDev);
	assign(Task$1.prototype, methods$1);

	Task$1.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	setup(Task$1);

	/* src\Row.html generated by Svelte v2.9.10 */

	var methods$2 = {
	    moved() {
	        console.log('WAT WAT');
	        const { row } = this.get();
	        this.set({ row });
	    }
	};

	function oncreate$2() {
	    const { row } = this.get();
	    row.rowElement = this.refs.row;
	    row.component = this;
	}
	function ondestroy$1(){
	    const { row } = this.get();
	    row.rowElement = null;
	    row.component = null;
	}
	function onupdate({ changed, current, previous }) {
	        //set previous null
	        //nije potrebno ako se u #each koristi (id)
	        /*const { row } = this.get();
	        row.rowElement = this.refs.row;
	        row.component = this;
	        console.log('update row', row.id);*/
	}
	function contextMenu$1(node){
	    const { row } = this.get();
	    const { contextMenuManager } = this.store.get();

	    const options = [
	        {
	            label: 'Copy row',
	            action: () => console.log('clicked action 1 for task ', row.id)
	        },
	        {
	            label: 'Clear dependencies',
	            action: () => console.log('clicked action 2 for task ', row.id)
	        }
	    ];


	    function onClose(event) {
	        //if(!contextMenu.isTarget(e))
	        contextMenuManager.close();
	    }

	    node.addEventListener('mouseup', (e) => {
	        //e.stopPropagation();
	        if(e.which === 3){
	            contextMenuManager.open(options, {x: e.x, y: e.y});

	            Utils.addEventListenerOnce(node, 'mousedown', onClose); //document.body
	        }
	    });

	    return {
	        destroy() {
	            contextMenuManager.close();
	        }
	    }
	}
	const file$2 = "src\\Row.html";

	function create_main_fragment$2(component, ctx) {
		var div, each_blocks_1 = [], each_lookup = blankObject(), contextMenu_action, current;

		var each_value = ctx.row.tasks;

		const get_key = ctx => ctx.task.id;

		for (var i = 0; i < each_value.length; i += 1) {
			let child_ctx = get_each_context$1(ctx, each_value, i);
			let key = get_key(child_ctx);
			each_blocks_1[i] = each_lookup[key] = create_each_block$1(component, key, child_ctx);
		}

		return {
			c: function create() {
				div = createElement("div");

				for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].c();
				div.className = "row svelte-xbfcv7";
				setStyle(div, "height", "" + ctx.$rowHeight + "px");
				contextMenu_action = contextMenu$1.call(component, div) || {};
				addLoc(div, file$2, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insertNode(div, target, anchor);

				for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].i(div, null);

				component.refs.row = div;
				current = true;
			},

			p: function update(changed, ctx) {
				const each_value = ctx.row.tasks;
				each_blocks_1 = updateKeyedEach(each_blocks_1, component, changed, get_key, 1, ctx, each_value, each_lookup, div, outroAndDestroyBlock, create_each_block$1, "i", null, get_each_context$1);

				if (!current || changed.$rowHeight) {
					setStyle(div, "height", "" + ctx.$rowHeight + "px");
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				const countdown = callAfter(outrocallback, each_blocks_1.length);
				for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].o(countdown);

				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].d();

				if (component.refs.row === div) component.refs.row = null;
				if (typeof contextMenu_action.destroy === 'function') contextMenu_action.destroy.call(component);
			}
		};
	}

	// (2:4) {#each row.tasks as task (task.id)}
	function create_each_block$1(component, key_1, ctx) {
		var first, current;

		var task_initial_data = { row: ctx.row, task: ctx.task };
		var task = new Task$1({
			root: component.root,
			store: component.store,
			data: task_initial_data
		});

		task.on("updateVisibleRows", function(event) {
			component.fire("updateVisibleRows", event);
		});
		task.on("taskMoved", function(event) {
			component.moved();
		});
		task.on("taskMovedRow", function(event) {
			component.moved();
		});
		task.on("taskResized", function(event) {
			component.moved();
		});

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				task._fragment.c();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insertNode(first, target, anchor);
				task._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var task_changes = {};
				if (changed.row) task_changes.row = ctx.row;
				if (changed.row) task_changes.task = ctx.task;
				task._set(task_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				task._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
				}

				task.destroy(detach);
			}
		};
	}

	function get_each_context$1(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.task = list[i];
		child_ctx.each_value = list;
		child_ctx.task_index = i;
		return child_ctx;
	}

	function Row(options) {
		this._debugName = '<Row>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this.refs = {};
		this._state = assign(this.store._init(["rowHeight"]), options.data);
		this.store._add(this, ["rowHeight"]);
		if (!('$rowHeight' in this._state)) console.warn("<Row> was created without expected data property '$rowHeight'");
		if (!('row' in this._state)) console.warn("<Row> was created without expected data property 'row'");
		this._intro = !!options.intro;
		this._handlers.update = [onupdate];

		this._handlers.destroy = [ondestroy$1, removeFromStore];

		if (!options.root) {
			this._oncreate = [];
			this._beforecreate = [];
			this._aftercreate = [];
		}

		this._fragment = create_main_fragment$2(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$2.call(this);
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			this._lock = true;
			callAll(this._beforecreate);
			callAll(this._oncreate);
			callAll(this._aftercreate);
			this._lock = false;
		}

		this._intro = true;
	}

	assign(Row.prototype, protoDev);
	assign(Row.prototype, methods$2);

	Row.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\RowHeader.html generated by Svelte v2.9.10 */

	const file$3 = "src\\RowHeader.html";

	function create_main_fragment$3(component, ctx) {
		var div, text, current;

		return {
			c: function create() {
				div = createElement("div");
				text = createText(ctx.label);
				div.className = "row-header svelte-1eq15f5";
				addLoc(div, file$3, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insertNode(div, target, anchor);
				appendNode(text, div);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.label) {
					setData(text, ctx.label);
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}
			}
		};
	}

	function RowHeader(options) {
		this._debugName = '<RowHeader>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this._state = assign({}, options.data);
		if (!('label' in this._state)) console.warn("<RowHeader> was created without expected data property 'label'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$3(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(RowHeader.prototype, protoDev);

	RowHeader.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Column.html generated by Svelte v2.9.10 */

	const file$4 = "src\\Column.html";

	function create_main_fragment$4(component, ctx) {
		var div, current;

		return {
			c: function create() {
				div = createElement("div");
				div.className = "column svelte-1ros3s7";
				setStyle(div, "width", "" + ctx.width + "px");
				addLoc(div, file$4, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insertNode(div, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.width) {
					setStyle(div, "width", "" + ctx.width + "px");
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}
			}
		};
	}

	function Column(options) {
		this._debugName = '<Column>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this._state = assign({}, options.data);
		if (!('width' in this._state)) console.warn("<Column> was created without expected data property 'width'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$4(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(Column.prototype, protoDev);

	Column.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\ColumnHeader.html generated by Svelte v2.9.10 */

	console.log(hooks());



	function data$2(){
	    return {
	        headers: []
	    }
	}
	function oncreate$3() {
	    
	    const { header } = this.get();

	    const {from, to, width } = this.store.get();
	    const columnWidth = Utils.getPositionByDate(from.clone().add(1, header.unit), from, to, width);
	    
	    const columnCount = Math.ceil(width / columnWidth); 

	    var headers = [];
	    
	    

	    var headerTime = from.clone();

	    for(let i=0; i< columnCount; i++){
	        headers.push({width: columnWidth, label: headerTime.format(header.format)});
	        headerTime.add(1, header.unit);
	    }

	    this.set({headers: headers});
	}
	const file$5 = "src\\ColumnHeader.html";

	function create_main_fragment$5(component, ctx) {
		var div, current;

		var each_value = ctx.headers;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(component, get_each_context$2(ctx, each_value, i));
		}

		return {
			c: function create() {
				div = createElement("div");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				div.className = "column-header-row svelte-1nf1z0q";
				setStyle(div, "width", "" + ctx.width + "px");
				addLoc(div, file$5, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insertNode(div, target, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div, null);
				}

				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.headers) {
					each_value = ctx.headers;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$2(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$2(component, child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}

				if (changed.width) {
					setStyle(div, "width", "" + ctx.width + "px");
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				destroyEach(each_blocks, detach);
			}
		};
	}

	// (3:4) {#each headers as header}
	function create_each_block$2(component, ctx) {
		var div, text_value = ctx.header.label || 'N/A', text;

		return {
			c: function create() {
				div = createElement("div");
				text = createText(text_value);
				div.className = "column-header svelte-1nf1z0q";
				setStyle(div, "width", "" + ctx.header.width + "px");
				addLoc(div, file$5, 3, 8, 98);
			},

			m: function mount(target, anchor) {
				insertNode(div, target, anchor);
				appendNode(text, div);
			},

			p: function update(changed, ctx) {
				if ((changed.headers) && text_value !== (text_value = ctx.header.label || 'N/A')) {
					setData(text, text_value);
				}

				if (changed.headers) {
					setStyle(div, "width", "" + ctx.header.width + "px");
				}
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}
			}
		};
	}

	function get_each_context$2(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.header = list[i];
		child_ctx.each_value = list;
		child_ctx.header_index = i;
		return child_ctx;
	}

	function ColumnHeader(options) {
		this._debugName = '<ColumnHeader>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this._state = assign(data$2(), options.data);
		if (!('width' in this._state)) console.warn("<ColumnHeader> was created without expected data property 'width'");
		if (!('headers' in this._state)) console.warn("<ColumnHeader> was created without expected data property 'headers'");
		this._intro = !!options.intro;

		if (!options.root) {
			this._oncreate = [];
		}

		this._fragment = create_main_fragment$5(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$3.call(this);
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			callAll(this._oncreate);
		}

		this._intro = true;
	}

	assign(ColumnHeader.prototype, protoDev);

	ColumnHeader.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Arrow.html generated by Svelte v2.9.10 */

	//dependency -> props: from-task, to-task
	//arrow -> start x,y -> end x,y
	/*M{startX} {startY} 
	  L {startX+width/2} {startY} 
	  L {startX+width/2} {startY+height/2}
	  L {startX-width/2} {startY+height/2}
	  L {startX-width/2} {startY+height}
	  L {endX} {endY}
	  
	  transform="translate(5,5)"*/ 


	  /*startX >= endX
	  
	  M{startX} {startY} 
	  L {startX+minLen} {startY} 
	  L {startX+minLen} {startY+height/2}
	  L {endX-minLen} {startY+height/2}
	  L {endX-minLen} {endY}
	  L {endX} {endY}
	  
	  */

	 /*normal
	 M{startX} {startY} 
	  L {startX+width/2} {startY} 
	  L {startX+width/2} {endY}
	  L {endX-5} {endY}
	 
	 */
	function height({ endY, startY }) {
		return endY-startY;
	}

	function width({ endX, startX }) {
		return endX-startX;
	}

	function path({startX, startY, endX, endY, minLen, width, height}) {
	    let result;

	    if(startX == NaN || startX == undefined) 
	        return 'M0 0';


	    if(startX + minLen >= endX && startY != endY) {
	        result = `L ${startX+minLen} ${startY} 
                L ${startX+minLen} ${startY+height/2}
                L ${endX-minLen} ${startY+height/2}
                L ${endX-minLen} ${endY} `;
	    }
	    else{
	        result = `L ${startX+width/2} ${startY} 
                L ${startX+width/2} ${endY}`;
	    }


	    return `M${startX} ${startY}` + result + `L ${endX-2} ${endY}` //so it doesnt stick out of arrow head

	}
	function arrowPath({endX, endY}){
	    
	    if(endX == NaN || endX == undefined) 
	        return 'M0 0';

	    return `M${endX-5} ${endY-5} L${endX} ${endY} L${endX-5} ${endY+5} Z`
	}
	function data$3() {
	    return {
	        startX: 0,
	        startY: 0,
	        endX: 100,
	        endY: 100,
	        minLen: 12
	    }
	}
	function oncreate$4() {

	}
	const file$6 = "src\\Arrow.html";

	function create_main_fragment$6(component, ctx) {
		var svg, path_1, path_2, current;

		return {
			c: function create() {
				svg = createSvgElement("svg");
				path_1 = createSvgElement("path");
				path_2 = createSvgElement("path");
				setAttribute(path_1, "d", ctx.path);
				setAttribute(path_1, "stroke", "red");
				setAttribute(path_1, "fill", "transparent");
				addLoc(path_1, file$6, 1, 2, 114);
				setAttribute(path_2, "d", ctx.arrowPath);
				setAttribute(path_2, "fill", "red");
				addLoc(path_2, file$6, 3, 2, 173);
				setAttribute(svg, "xmlns", "http://www.w3.org/2000/svg");
				setAttribute(svg, "shape-rendering", "crispEdges");
				setAttribute(svg, "class", "arrow svelte-1n3mchp");
				setAttribute(svg, "height", "100%");
				setAttribute(svg, "width", "100%");
				addLoc(svg, file$6, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insertNode(svg, target, anchor);
				appendNode(path_1, svg);
				appendNode(path_2, svg);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.path) {
					setAttribute(path_1, "d", ctx.path);
				}

				if (changed.arrowPath) {
					setAttribute(path_2, "d", ctx.arrowPath);
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(svg);
				}
			}
		};
	}

	function Arrow(options) {
		this._debugName = '<Arrow>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this._state = assign(data$3(), options.data);
		this._recompute({ endY: 1, startY: 1, endX: 1, startX: 1, minLen: 1, width: 1, height: 1 }, this._state);
		if (!('endY' in this._state)) console.warn("<Arrow> was created without expected data property 'endY'");
		if (!('startY' in this._state)) console.warn("<Arrow> was created without expected data property 'startY'");
		if (!('endX' in this._state)) console.warn("<Arrow> was created without expected data property 'endX'");
		if (!('startX' in this._state)) console.warn("<Arrow> was created without expected data property 'startX'");
		if (!('minLen' in this._state)) console.warn("<Arrow> was created without expected data property 'minLen'");
		this._intro = !!options.intro;

		if (!options.root) {
			this._oncreate = [];
		}

		this._fragment = create_main_fragment$6(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$4.call(this);
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			callAll(this._oncreate);
		}

		this._intro = true;
	}

	assign(Arrow.prototype, protoDev);

	Arrow.prototype._checkReadOnly = function _checkReadOnly(newState) {
		if ('height' in newState && !this._updatingReadonlyProperty) throw new Error("<Arrow>: Cannot set read-only property 'height'");
		if ('width' in newState && !this._updatingReadonlyProperty) throw new Error("<Arrow>: Cannot set read-only property 'width'");
		if ('path' in newState && !this._updatingReadonlyProperty) throw new Error("<Arrow>: Cannot set read-only property 'path'");
		if ('arrowPath' in newState && !this._updatingReadonlyProperty) throw new Error("<Arrow>: Cannot set read-only property 'arrowPath'");
	};

	Arrow.prototype._recompute = function _recompute(changed, state) {
		if (changed.endY || changed.startY) {
			if (this._differs(state.height, (state.height = height(state)))) changed.height = true;
		}

		if (changed.endX || changed.startX) {
			if (this._differs(state.width, (state.width = width(state)))) changed.width = true;
		}

		if (changed.startX || changed.startY || changed.endX || changed.endY || changed.minLen || changed.width || changed.height) {
			if (this._differs(state.path, (state.path = path(state)))) changed.path = true;
		}

		if (changed.endX || changed.endY) {
			if (this._differs(state.arrowPath, (state.arrowPath = arrowPath(state)))) changed.arrowPath = true;
		}
	};

	/* src\Dependency.html generated by Svelte v2.9.10 */

	function subscribe(dependency, task) {
	    if(!task.dependencies) {
	        task.dependencies = [];
	    }
	    task.dependencies.push(dependency);
	}

	function unsubscribe(dependency, task) {
	    let res = [];
	    for(let i = 0; i < task.dependencies.length; i++) {
	        if(task.dependencies[i] === dependency) {
	            res.push(dependency);
	        }
	    }

	    for(let i = 0; i < res.length; i++) {
	        let index = task.dependencies.indexOf(res[i]);
	        task.dependencies.splice(index, 1);
	    }
	}

	function update(fromTask, toTask, rows, rowHeight) {
	    let startX = fromTask.left + fromTask.width;
	    let endX = toTask.left;

	    let startIndex = rows.indexOf(fromTask.row); 
	    let endIndex = rows.indexOf(toTask.row); 

	    let startY = (startIndex + 0.5) * rowHeight;
	    let endY = (endIndex + 0.5) * rowHeight;

	    return {startX, startY, endX, endY};
	}

	function data$4() {
	    return {
	        startX: 0,
	        startY: 0,
	        endX: 100,
	        endY: 100
	    }
	}
	var methods$3 = {
	    update() {
	        const { rows, rowHeight } = this.store.get();
	        const { fromTask, toTask, dependency } = this.get();

	        let startX = fromTask.left + fromTask.width;
	        let endX = toTask.left;

	        let startIndex = rows.indexOf(fromTask.row); 
	        let endIndex = rows.indexOf(toTask.row); 

	        let startY = (startIndex + 0.5) * rowHeight;
	        let endY = (endIndex + 0.5) * rowHeight;

	        if(startX == NaN || startX == undefined) 
	            debugger;
	        this.set({startX, startY, endX, endY});
	        Object.assign(dependency, {startX, startY, endX, endY});
	    }
	};

	function oncreate$5() {            
	    this.update();

	    const { fromTask, toTask } = this.get();
	    subscribe(this, fromTask);
	    subscribe(this, toTask);
	}
	function ondestroy$2() {
	    const { fromTask, toTask } = this.get();
	    unsubscribe(this, fromTask);
	    unsubscribe(this, toTask);
	}
	function onupdate$1({ changed, current, previous }) {
	    //nije potrebno ako se u #each koristi (id)
	    /*console.log('Dependency state change', changed);
	    if(previous && previous.fromTask.dependencies && previous.toTask.dependencies){
	        unsubscribe(this, previous.fromTask);
	        unsubscribe(this, previous.toTask);
	    }
	    subscribe(this, current.fromTask);
	    subscribe(this, current.toTask);
	    this.update();*/
	}
	function setup$1(component){
	    component.subscribe = subscribe;
	    component.update = update;
	}
	const file$7 = "src\\Dependency.html";

	function create_main_fragment$7(component, ctx) {
		var div, current;

		var arrow_initial_data = {
		 	startX: ctx.startX,
		 	startY: ctx.startY,
		 	endX: ctx.endX,
		 	endY: ctx.endY
		 };
		var arrow = new Arrow({
			root: component.root,
			store: component.store,
			data: arrow_initial_data
		});

		return {
			c: function create() {
				div = createElement("div");
				arrow._fragment.c();
				div.className = "dependency svelte-1uamtlx";
				setStyle(div, "left", "" + 0 + "px");
				setStyle(div, "top", "" + 0 + "px");
				addLoc(div, file$7, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insertNode(div, target, anchor);
				arrow._mount(div, null);
				current = true;
			},

			p: function update(changed, ctx) {
				var arrow_changes = {};
				if (changed.startX) arrow_changes.startX = ctx.startX;
				if (changed.startY) arrow_changes.startY = ctx.startY;
				if (changed.endX) arrow_changes.endX = ctx.endX;
				if (changed.endY) arrow_changes.endY = ctx.endY;
				arrow._set(arrow_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				arrow._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				arrow.destroy();
			}
		};
	}

	function Dependency(options) {
		this._debugName = '<Dependency>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this._state = assign(data$4(), options.data);
		if (!('startX' in this._state)) console.warn("<Dependency> was created without expected data property 'startX'");
		if (!('startY' in this._state)) console.warn("<Dependency> was created without expected data property 'startY'");
		if (!('endX' in this._state)) console.warn("<Dependency> was created without expected data property 'endX'");
		if (!('endY' in this._state)) console.warn("<Dependency> was created without expected data property 'endY'");
		this._intro = !!options.intro;
		this._handlers.update = [onupdate$1];

		this._handlers.destroy = [ondestroy$2];

		if (!options.root) {
			this._oncreate = [];
			this._beforecreate = [];
			this._aftercreate = [];
		}

		this._fragment = create_main_fragment$7(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$5.call(this);
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			this._lock = true;
			callAll(this._beforecreate);
			callAll(this._oncreate);
			callAll(this._aftercreate);
			this._lock = false;
		}

		this._intro = true;
	}

	assign(Dependency.prototype, protoDev);
	assign(Dependency.prototype, methods$3);

	Dependency.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	setup$1(Dependency);

	function Store(state, options) {
		this._handlers = {};
		this._dependents = [];

		this._computed = blankObject();
		this._sortedComputedProperties = [];

		this._state = assign({}, state);
		this._differs = options && options.immutable ? _differsImmutable : _differs;
	}

	assign(Store.prototype, {
		_add(component, props) {
			this._dependents.push({
				component: component,
				props: props
			});
		},

		_init(props) {
			const state = {};
			for (let i = 0; i < props.length; i += 1) {
				const prop = props[i];
				state['$' + prop] = this._state[prop];
			}
			return state;
		},

		_remove(component) {
			let i = this._dependents.length;
			while (i--) {
				if (this._dependents[i].component === component) {
					this._dependents.splice(i, 1);
					return;
				}
			}
		},

		_set(newState, changed) {
			const previous = this._state;
			this._state = assign(assign({}, previous), newState);

			for (let i = 0; i < this._sortedComputedProperties.length; i += 1) {
				this._sortedComputedProperties[i].update(this._state, changed);
			}

			this.fire('state', {
				changed,
				previous,
				current: this._state
			});

			const dependents = this._dependents.slice(); // guard against mutations
			for (let i = 0; i < dependents.length; i += 1) {
				const dependent = dependents[i];
				const componentState = {};
				let dirty = false;

				for (let j = 0; j < dependent.props.length; j += 1) {
					const prop = dependent.props[j];
					if (prop in changed) {
						componentState['$' + prop] = this._state[prop];
						dirty = true;
					}
				}

				if (dirty) dependent.component.set(componentState);
			}

			this.fire('update', {
				changed,
				previous,
				current: this._state
			});
		},

		_sortComputedProperties() {
			const computed = this._computed;
			const sorted = this._sortedComputedProperties = [];
			const visited = blankObject();
			let currentKey;

			function visit(key) {
				const c = computed[key];

				if (c) {
					c.deps.forEach(dep => {
						if (dep === currentKey) {
							throw new Error(`Cyclical dependency detected between ${dep} <-> ${key}`);
						}

						visit(dep);
					});

					if (!visited[key]) {
						visited[key] = true;
						sorted.push(c);
					}
				}
			}

			for (const key in this._computed) {
				visit(currentKey = key);
			}
		},

		compute(key, deps, fn) {
			let value;

			const c = {
				deps,
				update: (state, changed, dirty) => {
					const values = deps.map(dep => {
						if (dep in changed) dirty = true;
						return state[dep];
					});

					if (dirty) {
						const newValue = fn.apply(null, values);
						if (this._differs(newValue, value)) {
							value = newValue;
							changed[key] = true;
							state[key] = value;
						}
					}
				}
			};

			this._computed[key] = c;
			this._sortComputedProperties();

			const state = assign({}, this._state);
			const changed = {};
			c.update(state, changed, true);
			this._set(state, changed);
		},

		fire,

		get,

		on,

		set(newState) {
			const oldState = this._state;
			const changed = this._changed = {};
			let dirty = false;

			for (const key in newState) {
				if (this._computed[key]) throw new Error(`'${key}' is a read-only property`);
				if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
			}
			if (!dirty) return;

			this._set(newState, changed);
		}
	});

	class ContextMenuManager {
	    constructor() {
	        this.current = null;
	    }

	    open(actions, position) {
	        if(this.current) {
	            this.current.close();
	        }
	        
	        const contextMenu = new ContextMenu({
	            target: document.body,
	            data: { actions },
	            position: position,
	            onactionend: () => contextMenu.close()
	        });

	        this.current = contextMenu;
	        return this.current;
	    }

	    close() {
	        if(this.current) {
	            this.current.close();
	            this.current = null;
	        }
	    }
	}

	class GanttUtils {
	    constructor({ from, to, width, magnetUnit, magnetOffset }) {
	        this.from = from;
	        this.to = to;
	        this.width = width;
	        this.magnetUnit = magnetUnit;
	        this.magnetOffset = magnetOffset || 1;
	    }

	    /**
	     * Returns position of date on a line if from and to represent length of width
	     * @param {*} date 
	     */
	    getPositionByDate (date) {
	        if (!date) {
	          return undefined
	        }

	        let durationTo = date.diff(this.from, 'milliseconds');
	        let durationToEnd = this.to.diff(this.from, 'milliseconds');

	        return durationTo / durationToEnd * this.width;
	    }

	    getDateByPosition (x) {
	        let durationTo = x / this.width * this.to.diff(this.from, 'milliseconds');
	        let dateAtPosition = this.from.clone().add(durationTo, 'milliseconds');
	        return dateAtPosition; 
	    }

	    /**
	     * 
	     * @param {Moment} date - Date
	     * @returns {Moment} rounded date passed as parameter
	     */
	    roundTo (date) {
	        let value = date.get(this.magnetUnit);
	    
	        value = Math.round(value / this.magnetOffset);
	    
	        date.set(this.magnetUnit, value * this.magnetOffset);

	        //round all smaller units to 0
	        const units = ['millisecond', 'second', 'minute', 'hour', 'date', 'month', 'year'];
	        const indexOf = units.indexOf(this.magnetUnit);
	        for (let i = 0; i < indexOf; i++) {
	            date.set(units[i], 0);
	        }
	        return date
	    }
	}

	/* src\Grid.html generated by Svelte v2.9.10 */

	let SvelteGantt;

	function rowContainerHeight({rows, $rowHeight}) {
		return rows.length * $rowHeight;
	}

	function data$5() {
	    return {
	        columns: [],
	        scrollables: [],
	        visibleRows: [],
	        visibleDependencies: []
	    }
	}
	var methods$4 = {
	    updateVisibleRows(scrollTop, viewportHeight){
	        console.log('update v rows');
	        const { rows, height, rowHeight } = this.store.get();

	        let startIndex = Math.floor(scrollTop / rowHeight);
	        let endIndex = Math.min(startIndex + Math.ceil(viewportHeight / rowHeight ), rows.length - 1);

	        console.log('['+startIndex+','+endIndex+']');

	        const paddingTop = startIndex * rowHeight;
	        const paddingBottom = rows.length * rowHeight - viewportHeight - paddingTop;


	        const visibleRows = rows.slice(startIndex, endIndex + 1);

	        this.set({ visibleRows: visibleRows, paddingTop: paddingTop, paddingBottom: paddingBottom });
	        this.store.set({ visibleRows });
	        //this.set({dependencies: this.get().dependencies});
	    },
	    updateViewport(){
	        console.log('update v port');
	        const {scrollTop, clientHeight} = this.refs.mainContainer;
	        this.updateVisibleRows(scrollTop, clientHeight);
	        this.updateVisibleDependencies(scrollTop, clientHeight);
	    },
	    updateVisibleDependencies(scrollTop, viewportHeight){
	        const { dependencies } = this.get();

	        //binary search
	        const visibleDependencies = [];
	        
	        const viewportTop = scrollTop;
	        const viewportBottom = scrollTop + viewportHeight;

	        for(let i = 0; i < dependencies.length; i++){
	            const dependency = dependencies[i];
	            let { startY, endY } = dependency; //init dependencies before components oncreate
	            
	            //let yMax = Math.max(startY, endY);//can be done 
	            //let yMin = Math.min(startY, endY);//with an if //todo research performance
	            let yMax, yMin;
	            if(startY > endY){
	                yMax = startY;
	                yMin = endY;
	            }
	            else{
	                yMax = endY;
	                yMin = startY;
	            }

	            if(yMax < viewportTop && yMin < viewportTop || yMax > viewportBottom && yMin > viewportBottom) ;
	            else {
	                visibleDependencies.push(dependency);
	            }
	        }

	        this.set({ visibleDependencies });
	    },
	    onContextMenu(event) {
	        event.preventDefault();
	        return false;
	    }
	};

	function oncreate$6(){
	    
	    const {ganttUtils, magnetOffset, magnetUnit} = this.store.get();
	    let diva;
	    const columnWidth = ganttUtils.getPositionByDate(ganttUtils.from.clone().add(magnetOffset, magnetUnit));
	    diva = ganttUtils.width / columnWidth;
	    const columnCount = Math.ceil(ganttUtils.width / columnWidth); 

	    var columns = [];
	    
	    for(let i=0; i< columnCount; i++){
	        columns.push({width: columnWidth});
	    }

	    this.store.set({
	        bodyElement: this.refs.mainContainer, 
	        rowContainerElement: this.refs.rowContainer
	    });

	    this.set({columns: columns});

	    for(let i=0; i< columnCount; i++){
	        columns.push({width: columnWidth});
	    }

	    /*for(let i=0; i < rows.length; i++){
	        Task.updatePosition(rows[i].tasks[0], this.store.get());
	    }*/

	    const { rows, rowHeight } = this.store.get();
	    const { dependencies } = this.get();
	    for(let i=0; i < dependencies.length; i++){
	        let dependency = dependencies[i];
	        const res = Dependency.update(dependency.fromTask, dependency.toTask, rows, rowHeight);
	        Object.assign(dependency, res);
	    }

	    this.updateVisibleRows(0, this.refs.mainContainer.clientHeight);
	    this.updateVisibleDependencies(0, this.refs.mainContainer.clientHeight);
	}
	function setup$2(component){
	    SvelteGantt = component;
	    SvelteGantt.defaults = {
					width: 800,
					height: 400,
					magnetOffset: 15,
					magnetUnit: 'minute',
					headerHeight: 100,
					headers: [{unit: 'day', format: 'DD.MM.YYYY'}, {unit: 'hour', format: 'HH'}],
					rowHeight: 24
	    };

	    SvelteGantt.create = function(target, data, options) {

	        const store = new Store();

	        const ganttOptions = Object.assign(SvelteGantt.defaults, options);
	        const ganttUtils = new GanttUtils(ganttOptions);

	        store.set(ganttOptions);
	        store.set({ 
	            rows: data.rows,
	            contextMenuManager: new ContextMenuManager(),
	            ganttUtils: ganttUtils
	        });

	        for(let i=0; i < data.rows.length; i++){
	            const row = data.rows[i];
	            for(let j=0; j < row.tasks.length; j++){
	                const task = row.tasks[j];
	                task.amountDone = task.amountDone || 0;
	                Task$1.updatePosition(task, ganttUtils);
	                task.row = row;
	            }
	        }

	        return new SvelteGantt({
	            target,
	            data,
	            store
	        })
	    };
	}
	function disableContextMenu(node) {
	    node.addEventListener('contextmenu', function(e) {
	        e.preventDefault();
	    }, false);
	    //ovo dolje radi kad stvoriš svelte contextmenu, klikne na sam contextmenu
	    document.addEventListener('contextmenu', function(e) {
	        e.preventDefault();
	    }, false);
	}
	function scrollable(node){
	    const { scrollables } = this.get();
	    const self = this;

	    function onscroll(event) {
	        const scrollAmount = node.scrollTop; 

	        console.log(scrollAmount);
	        for(let i=0; i< scrollables.length; i++){
	            const scrollable = scrollables[i];
	            if(scrollable.orientation === 'horizontal') {
	                scrollable.node.scrollLeft = node.scrollLeft;
	            }
	            else {
	                scrollable.node.scrollTop = scrollAmount;
	            }
	        }
	        self.updateVisibleRows(scrollAmount, node.clientHeight);
	        self.updateVisibleDependencies(scrollAmount, node.clientHeight);
	    }

	    node.addEventListener('scroll', onscroll);
	    return {
						destroy() {
							node.removeEventListener('scroll', onscroll, false);
						}
	    }
	}
	function scrollListener(node){
	    const { scrollables } = this.get();
	    scrollables.push({node});
	}
	function horizontalScrollListener(node){
	    const { scrollables } = this.get();
	    scrollables.push({node, orientation: 'horizontal'});
	}
	const file$8 = "src\\Grid.html";

	function create_main_fragment$8(component, ctx) {
		var div, div_1, text, div_2, div_3, horizontalScrollListener_action, text_3, div_4, div_5, each_1_blocks_1 = [], each_1_lookup = blankObject(), scrollListener_action, text_6, div_6, div_7, div_8, text_8, div_9, each_3_blocks_1 = [], each_3_lookup = blankObject(), text_10, div_10, each_4_blocks_1 = [], each_4_lookup = blankObject(), scrollable_action, disableContextMenu_action, current;

		var each_value = ctx.$headers;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$3(component, get_each_context$3(ctx, each_value, i));
		}

		function outroBlock(i, detach, fn) {
			if (each_blocks[i]) {
				each_blocks[i].o(() => {
					if (detach) {
						each_blocks[i].d(detach);
						each_blocks[i] = null;
					}
					if (fn) fn();
				});
			}
		}

		var each_value_1 = ctx.visibleRows;

		const get_key = ctx => ctx.row.id;

		for (var i = 0; i < each_value_1.length; i += 1) {
			let child_ctx = get_each_1_context(ctx, each_value_1, i);
			let key = get_key(child_ctx);
			each_1_blocks_1[i] = each_1_lookup[key] = create_each_block_1(component, key, child_ctx);
		}

		var each_value_2 = ctx.columns;

		var each_2_blocks = [];

		for (var i = 0; i < each_value_2.length; i += 1) {
			each_2_blocks[i] = create_each_block_2(component, get_each_2_context(ctx, each_value_2, i));
		}

		function outroBlock_1(i, detach, fn) {
			if (each_2_blocks[i]) {
				each_2_blocks[i].o(() => {
					if (detach) {
						each_2_blocks[i].d(detach);
						each_2_blocks[i] = null;
					}
					if (fn) fn();
				});
			}
		}

		var each_value_3 = ctx.visibleRows;

		const get_key_1 = ctx => ctx.row.id;

		for (var i = 0; i < each_value_3.length; i += 1) {
			let child_ctx = get_each_3_context(ctx, each_value_3, i);
			let key = get_key_1(child_ctx);
			each_3_blocks_1[i] = each_3_lookup[key] = create_each_block_3(component, key, child_ctx);
		}

		var each_value_4 = ctx.visibleDependencies;

		const get_key_2 = ctx => ctx.dependency.id;

		for (var i = 0; i < each_value_4.length; i += 1) {
			let child_ctx = get_each_4_context(ctx, each_value_4, i);
			let key = get_key_2(child_ctx);
			each_4_blocks_1[i] = each_4_lookup[key] = create_each_block_4(component, key, child_ctx);
		}

		return {
			c: function create() {
				div = createElement("div");
				div_1 = createElement("div");
				text = createText("\r\n\r\n    ");
				div_2 = createElement("div");
				div_3 = createElement("div");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				text_3 = createText("\r\n\r\n    ");
				div_4 = createElement("div");
				div_5 = createElement("div");

				for (i = 0; i < each_1_blocks_1.length; i += 1) each_1_blocks_1[i].c();

				text_6 = createText("\r\n\r\n    ");
				div_6 = createElement("div");
				div_7 = createElement("div");
				div_8 = createElement("div");

				for (var i = 0; i < each_2_blocks.length; i += 1) {
					each_2_blocks[i].c();
				}

				text_8 = createText("    \r\n            ");
				div_9 = createElement("div");

				for (i = 0; i < each_3_blocks_1.length; i += 1) each_3_blocks_1[i].c();

				text_10 = createText("\r\n\r\n            ");
				div_10 = createElement("div");

				for (i = 0; i < each_4_blocks_1.length; i += 1) each_4_blocks_1[i].c();
				div_1.className = "side-header-container svelte-95ghe2";
				setStyle(div_1, "height", "" + ctx.$headerHeight + "px");
				setStyle(div_1, "width", "100px");
				addLoc(div_1, file$8, 2, 4, 49);
				div_3.className = "header-container";
				setStyle(div_3, "width", "" + ctx.$width + "px");
				addLoc(div_3, file$8, 7, 8, 262);
				div_2.className = "main-header-container svelte-95ghe2";
				setStyle(div_2, "height", "" + ctx.$headerHeight + "px");
				horizontalScrollListener_action = horizontalScrollListener.call(component, div_2) || {};
				addLoc(div_2, file$8, 6, 4, 155);
				div_5.className = "row-header-container svelte-95ghe2";
				setStyle(div_5, "padding-top", "" + ctx.paddingTop + "px");
				setStyle(div_5, "padding-bottom", "" + ctx.paddingBottom + "px");
				setStyle(div_5, "height", "" + ctx.rowContainerHeight + "px");
				addLoc(div_5, file$8, 15, 8, 547);
				div_4.className = "side-container svelte-95ghe2";
				setStyle(div_4, "height", "" + ctx.$height + "px");
				scrollListener_action = scrollListener.call(component, div_4) || {};
				addLoc(div_4, file$8, 14, 4, 463);
				div_8.className = "column-container svelte-95ghe2";
				addLoc(div_8, file$8, 27, 12, 1034);
				div_9.className = "row-container svelte-95ghe2";
				setStyle(div_9, "padding-top", "" + ctx.paddingTop + "px");
				setStyle(div_9, "padding-bottom", "" + ctx.paddingBottom + "px");
				setStyle(div_9, "height", "" + ctx.rowContainerHeight + "px");
				addLoc(div_9, file$8, 32, 12, 1222);
				div_10.className = "dependency-container svelte-95ghe2";
				addLoc(div_10, file$8, 41, 12, 1638);
				div_7.className = "content svelte-95ghe2";
				setStyle(div_7, "width", "" + ctx.$width + "px");
				addLoc(div_7, file$8, 24, 8, 958);
				div_6.className = "main-container svelte-95ghe2";
				setStyle(div_6, "height", "" + ctx.$height + "px");
				scrollable_action = scrollable.call(component, div_6) || {};
				addLoc(div_6, file$8, 23, 4, 860);
				div.className = "grid svelte-95ghe2";
				disableContextMenu_action = disableContextMenu.call(component, div) || {};
				addLoc(div, file$8, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insertNode(div, target, anchor);
				appendNode(div_1, div);
				appendNode(text, div);
				appendNode(div_2, div);
				appendNode(div_3, div_2);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].i(div_3, null);
				}

				appendNode(text_3, div);
				appendNode(div_4, div);
				appendNode(div_5, div_4);

				for (i = 0; i < each_1_blocks_1.length; i += 1) each_1_blocks_1[i].i(div_5, null);

				appendNode(text_6, div);
				appendNode(div_6, div);
				appendNode(div_7, div_6);
				appendNode(div_8, div_7);

				for (var i = 0; i < each_2_blocks.length; i += 1) {
					each_2_blocks[i].i(div_8, null);
				}

				appendNode(text_8, div_7);
				appendNode(div_9, div_7);

				for (i = 0; i < each_3_blocks_1.length; i += 1) each_3_blocks_1[i].i(div_9, null);

				component.refs.rowContainer = div_9;
				appendNode(text_10, div_7);
				appendNode(div_10, div_7);

				for (i = 0; i < each_4_blocks_1.length; i += 1) each_4_blocks_1[i].i(div_10, null);

				component.refs.mainContainer = div_6;
				current = true;
			},

			p: function update(changed, ctx) {
				if (!current || changed.$headerHeight) {
					setStyle(div_1, "height", "" + ctx.$headerHeight + "px");
				}

				if (changed.$headers) {
					each_value = ctx.$headers;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$3(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$3(component, child_ctx);
							each_blocks[i].c();
						}
						each_blocks[i].i(div_3, null);
					}
					for (; i < each_blocks.length; i += 1) outroBlock(i, 1);
				}

				if (!current || changed.$width) {
					setStyle(div_3, "width", "" + ctx.$width + "px");
				}

				if (!current || changed.$headerHeight) {
					setStyle(div_2, "height", "" + ctx.$headerHeight + "px");
				}

				const each_value_1 = ctx.visibleRows;
				each_1_blocks_1 = updateKeyedEach(each_1_blocks_1, component, changed, get_key, 1, ctx, each_value_1, each_1_lookup, div_5, outroAndDestroyBlock, create_each_block_1, "i", null, get_each_1_context);

				if (!current || changed.paddingTop) {
					setStyle(div_5, "padding-top", "" + ctx.paddingTop + "px");
				}

				if (!current || changed.paddingBottom) {
					setStyle(div_5, "padding-bottom", "" + ctx.paddingBottom + "px");
				}

				if (!current || changed.rowContainerHeight) {
					setStyle(div_5, "height", "" + ctx.rowContainerHeight + "px");
				}

				if (!current || changed.$height) {
					setStyle(div_4, "height", "" + ctx.$height + "px");
				}

				if (changed.columns) {
					each_value_2 = ctx.columns;

					for (var i = 0; i < each_value_2.length; i += 1) {
						const child_ctx = get_each_2_context(ctx, each_value_2, i);

						if (each_2_blocks[i]) {
							each_2_blocks[i].p(changed, child_ctx);
						} else {
							each_2_blocks[i] = create_each_block_2(component, child_ctx);
							each_2_blocks[i].c();
						}
						each_2_blocks[i].i(div_8, null);
					}
					for (; i < each_2_blocks.length; i += 1) outroBlock_1(i, 1);
				}

				const each_value_3 = ctx.visibleRows;
				each_3_blocks_1 = updateKeyedEach(each_3_blocks_1, component, changed, get_key_1, 1, ctx, each_value_3, each_3_lookup, div_9, outroAndDestroyBlock, create_each_block_3, "i", null, get_each_3_context);

				if (!current || changed.paddingTop) {
					setStyle(div_9, "padding-top", "" + ctx.paddingTop + "px");
				}

				if (!current || changed.paddingBottom) {
					setStyle(div_9, "padding-bottom", "" + ctx.paddingBottom + "px");
				}

				if (!current || changed.rowContainerHeight) {
					setStyle(div_9, "height", "" + ctx.rowContainerHeight + "px");
				}

				const each_value_4 = ctx.visibleDependencies;
				each_4_blocks_1 = updateKeyedEach(each_4_blocks_1, component, changed, get_key_2, 1, ctx, each_value_4, each_4_lookup, div_10, outroAndDestroyBlock, create_each_block_4, "i", null, get_each_4_context);

				if (!current || changed.$width) {
					setStyle(div_7, "width", "" + ctx.$width + "px");
				}

				if (!current || changed.$height) {
					setStyle(div_6, "height", "" + ctx.$height + "px");
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				outrocallback = callAfter(outrocallback, 5);

				const countdown = callAfter(outrocallback, each_blocks.length);
				for (let i = 0; i < each_blocks.length; i += 1) outroBlock(i, 0, countdown);

				const countdown_1 = callAfter(outrocallback, each_1_blocks_1.length);
				for (i = 0; i < each_1_blocks_1.length; i += 1) each_1_blocks_1[i].o(countdown_1);

				const countdown_2 = callAfter(outrocallback, each_2_blocks.length);
				for (let i = 0; i < each_2_blocks.length; i += 1) outroBlock_1(i, 0, countdown_2);

				const countdown_3 = callAfter(outrocallback, each_3_blocks_1.length);
				for (i = 0; i < each_3_blocks_1.length; i += 1) each_3_blocks_1[i].o(countdown_3);

				const countdown_4 = callAfter(outrocallback, each_4_blocks_1.length);
				for (i = 0; i < each_4_blocks_1.length; i += 1) each_4_blocks_1[i].o(countdown_4);

				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				destroyEach(each_blocks, detach);

				if (typeof horizontalScrollListener_action.destroy === 'function') horizontalScrollListener_action.destroy.call(component);

				for (i = 0; i < each_1_blocks_1.length; i += 1) each_1_blocks_1[i].d();

				if (typeof scrollListener_action.destroy === 'function') scrollListener_action.destroy.call(component);

				destroyEach(each_2_blocks, detach);

				for (i = 0; i < each_3_blocks_1.length; i += 1) each_3_blocks_1[i].d();

				if (component.refs.rowContainer === div_9) component.refs.rowContainer = null;

				for (i = 0; i < each_4_blocks_1.length; i += 1) each_4_blocks_1[i].d();

				if (component.refs.mainContainer === div_6) component.refs.mainContainer = null;
				if (typeof scrollable_action.destroy === 'function') scrollable_action.destroy.call(component);
				if (typeof disableContextMenu_action.destroy === 'function') disableContextMenu_action.destroy.call(component);
			}
		};
	}

	// (9:12) {#each $headers as header}
	function create_each_block$3(component, ctx) {
		var current;

		var columnheader_initial_data = { header: ctx.header };
		var columnheader = new ColumnHeader({
			root: component.root,
			store: component.store,
			data: columnheader_initial_data
		});

		return {
			c: function create() {
				columnheader._fragment.c();
			},

			m: function mount(target, anchor) {
				columnheader._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var columnheader_changes = {};
				if (changed.$headers) columnheader_changes.header = ctx.header;
				columnheader._set(columnheader_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				columnheader._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				columnheader.destroy(detach);
			}
		};
	}

	// (17:12) {#each visibleRows as row (row.id)}
	function create_each_block_1(component, key_1, ctx) {
		var first, rowheader_updating = {}, current;

		var rowheader_initial_data = {};
		if (ctx.row.label !== void 0) {
			rowheader_initial_data.label = ctx.row.label;
			rowheader_updating.label = true;
		}
		var rowheader = new RowHeader({
			root: component.root,
			store: component.store,
			data: rowheader_initial_data,
			_bind(changed, childState) {
				var newState = {};
				if (!rowheader_updating.label && changed.label) {
					ctx.row.label = childState.label;

					newState.visibleRows = ctx.visibleRows;
				}
				component._set(newState);
				rowheader_updating = {};
			}
		});

		component.root._beforecreate.push(() => {
			rowheader._bind({ label: 1 }, rowheader.get());
		});

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				rowheader._fragment.c();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insertNode(first, target, anchor);
				rowheader._mount(target, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				var rowheader_changes = {};
				if (!rowheader_updating.label && changed.visibleRows) {
					rowheader_changes.label = ctx.row.label;
					rowheader_updating.label = ctx.row.label !== void 0;
				}
				rowheader._set(rowheader_changes);
				rowheader_updating = {};
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				rowheader._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
				}

				rowheader.destroy(detach);
			}
		};
	}

	// (29:16) {#each columns as column}
	function create_each_block_2(component, ctx) {
		var current;

		var column_initial_data = { width: ctx.column.width };
		var column = new Column({
			root: component.root,
			store: component.store,
			data: column_initial_data
		});

		return {
			c: function create() {
				column._fragment.c();
			},

			m: function mount(target, anchor) {
				column._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var column_changes = {};
				if (changed.columns) column_changes.width = ctx.column.width;
				column._set(column_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				column._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				column.destroy(detach);
			}
		};
	}

	// (35:16) {#each visibleRows as row (row.id)}
	function create_each_block_3(component, key_1, ctx) {
		var first, current;

		var row_initial_data = { row: ctx.row, width: ctx.width };
		var row = new Row({
			root: component.root,
			store: component.store,
			data: row_initial_data
		});

		row.on("updateVisibleRows", function(event) {
			component.updateViewport();
		});

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				row._fragment.c();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insertNode(first, target, anchor);
				row._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var row_changes = {};
				if (changed.visibleRows) row_changes.row = ctx.row;
				if (changed.width) row_changes.width = ctx.width;
				row._set(row_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				row._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
				}

				row.destroy(detach);
			}
		};
	}

	// (43:16) {#each visibleDependencies as dependency (dependency.id)}
	function create_each_block_4(component, key_1, ctx) {
		var first, current;

		var dependency_initial_data = {
		 	fromTask: ctx.dependency.fromTask,
		 	toTask: ctx.dependency.toTask,
		 	dependency: ctx.dependency
		 };
		var dependency = new Dependency({
			root: component.root,
			store: component.store,
			data: dependency_initial_data
		});

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				dependency._fragment.c();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insertNode(first, target, anchor);
				dependency._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var dependency_changes = {};
				if (changed.visibleDependencies) dependency_changes.fromTask = ctx.dependency.fromTask;
				if (changed.visibleDependencies) dependency_changes.toTask = ctx.dependency.toTask;
				if (changed.visibleDependencies) dependency_changes.dependency = ctx.dependency;
				dependency._set(dependency_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				dependency._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
				}

				dependency.destroy(detach);
			}
		};
	}

	function get_each_context$3(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.header = list[i];
		child_ctx.each_value = list;
		child_ctx.header_index = i;
		return child_ctx;
	}

	function get_each_1_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.row = list[i];
		child_ctx.each_value_1 = list;
		child_ctx.row_index = i;
		return child_ctx;
	}

	function get_each_2_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.column = list[i];
		child_ctx.each_value_2 = list;
		child_ctx.column_index = i;
		return child_ctx;
	}

	function get_each_3_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.row = list[i];
		child_ctx.each_value_3 = list;
		child_ctx.row_index_1 = i;
		return child_ctx;
	}

	function get_each_4_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.dependency = list[i];
		child_ctx.each_value_4 = list;
		child_ctx.dependency_index = i;
		return child_ctx;
	}

	function Grid(options) {
		this._debugName = '<Grid>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this.refs = {};
		this._state = assign(assign(this.store._init(["rowHeight","headerHeight","width","headers","height"]), data$5()), options.data);
		this.store._add(this, ["rowHeight","headerHeight","width","headers","height"]);
		this._recompute({ rows: 1, $rowHeight: 1 }, this._state);
		if (!('rows' in this._state)) console.warn("<Grid> was created without expected data property 'rows'");
		if (!('$rowHeight' in this._state)) console.warn("<Grid> was created without expected data property '$rowHeight'");
		if (!('$headerHeight' in this._state)) console.warn("<Grid> was created without expected data property '$headerHeight'");
		if (!('$width' in this._state)) console.warn("<Grid> was created without expected data property '$width'");
		if (!('$headers' in this._state)) console.warn("<Grid> was created without expected data property '$headers'");
		if (!('$height' in this._state)) console.warn("<Grid> was created without expected data property '$height'");
		if (!('paddingTop' in this._state)) console.warn("<Grid> was created without expected data property 'paddingTop'");
		if (!('paddingBottom' in this._state)) console.warn("<Grid> was created without expected data property 'paddingBottom'");

		if (!('visibleRows' in this._state)) console.warn("<Grid> was created without expected data property 'visibleRows'");
		if (!('columns' in this._state)) console.warn("<Grid> was created without expected data property 'columns'");
		if (!('width' in this._state)) console.warn("<Grid> was created without expected data property 'width'");
		if (!('visibleDependencies' in this._state)) console.warn("<Grid> was created without expected data property 'visibleDependencies'");
		this._intro = !!options.intro;

		this._handlers.destroy = [removeFromStore];

		if (!options.root) {
			this._oncreate = [];
			this._beforecreate = [];
			this._aftercreate = [];
		}

		this._fragment = create_main_fragment$8(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$6.call(this);
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			this._lock = true;
			callAll(this._beforecreate);
			callAll(this._oncreate);
			callAll(this._aftercreate);
			this._lock = false;
		}

		this._intro = true;
	}

	assign(Grid.prototype, protoDev);
	assign(Grid.prototype, methods$4);

	Grid.prototype._checkReadOnly = function _checkReadOnly(newState) {
		if ('rowContainerHeight' in newState && !this._updatingReadonlyProperty) throw new Error("<Grid>: Cannot set read-only property 'rowContainerHeight'");
	};

	Grid.prototype._recompute = function _recompute(changed, state) {
		if (changed.rows || changed.$rowHeight) {
			if (this._differs(state.rowContainerHeight, (state.rowContainerHeight = rowContainerHeight(state)))) changed.rowContainerHeight = true;
		}
	};

	setup$2(Grid);

	let startOfToday = hooks().startOf('day');

	let data$6 = {
		rows: [],
		dependencies: []
	};

	for(let i = 0; i < 500; i++){
		data$6.rows.push({
			id: i,
			label: 'Row #'+i,
			tasks: []
		});

		let a = i % 3;

		data$6.rows[i].tasks.push({
			id: i,
			label: 'Task #'+i,
			from: startOfToday.clone().set({'hour': 3 + 5*a, 'minute': 0}),
			to: startOfToday.clone().set({'hour': 6 + 5*a, 'minute': 0}),
			amountDone: Math.floor(Math.random() * 100)
		});
	}

	for(let i = 0; i < 499; i++){
		data$6.dependencies.push({
			id: i, 
			fromTask: data$6.rows[i].tasks[0], 
			toTask: data$6.rows[i+1].tasks[0] 
		});
	}

	let options = {
		from: startOfToday,
		to: hooks().endOf('day')
	};

	var app = Grid.create(document.body, data$6, options);

	return app;

}());
//# sourceMappingURL=bundle.js.map
