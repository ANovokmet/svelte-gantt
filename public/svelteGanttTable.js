var SvelteGanttTable = (function () {
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

	function run(fn) {
		fn();
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor);
	}

	function detachNode(node) {
		node.parentNode.removeChild(node);
	}

	function detachBetween(before, after) {
		while (before.nextSibling && before.nextSibling !== after) {
			before.parentNode.removeChild(before.nextSibling);
		}
	}

	function destroyEach(iterations, detach) {
		for (var i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detach);
		}
	}

	function createElement(name) {
		return document.createElement(name);
	}

	function createText(data) {
		return document.createTextNode(data);
	}

	function createComment() {
		return document.createComment('');
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

	function flush(component) {
		component._lock = true;
		callAll(component._beforecreate);
		callAll(component._oncreate);
		callAll(component._aftercreate);
		component._lock = false;
	}

	function get() {
		return this._state;
	}

	function init(component, options) {
		component._handlers = blankObject();
		component._slots = blankObject();
		component._bind = options._bind;
		component._staged = {};

		component.options = options;
		component.root = options.root || component;
		component.store = options.store || component.root.store;

		if (!options.root) {
			component._beforecreate = [];
			component._oncreate = [];
			component._aftercreate = [];
		}
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

	function set(newState) {
		this._set(assign({}, newState));
		if (this.root._lock) return;
		flush(this.root);
	}

	function _set(newState) {
		var oldState = this._state,
			changed = {},
			dirty = false;

		newState = assign(this._staged, newState);
		this._staged = {};

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

	function _stage(newState) {
		assign(this._staged, newState);
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
		_stage,
		_mount,
		_differs
	};

	/* src\RowHeader.html generated by Svelte v2.13.4 */

	function data() {
	    return {
	        label: '',
	        row: null,
	        headers: null
	    }
	}
	function oncreate(){
	    
	}
	const file = "src\\RowHeader.html";

	function create_main_fragment(component, ctx) {
		var div, current;

		var each_value = ctx.headers;

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
				div.className = "row-header-row svelte-1lph4sq";
				setStyle(div, "height", "" + ctx.$rowHeight + "px");
				addLoc(div, file, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div, null);
				}

				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.headers || changed.row) {
					each_value = ctx.headers;

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

				if (changed.$rowHeight) {
					setStyle(div, "height", "" + ctx.$rowHeight + "px");
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

	// (2:4) {#each headers as header}
	function create_each_block(component, ctx) {
		var div;

		function select_block_type(ctx) {
			if (ctx.row.headerHtml) return create_if_block;
			return create_if_block_1;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(component, ctx);

		return {
			c: function create() {
				div = createElement("div");
				if_block.c();
				div.className = "row-header-cell";
				setStyle(div, "width", "" + ctx.header.width + "px");
				addLoc(div, file, 2, 8, 99);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				if_block.m(div, null);
			},

			p: function update(changed, ctx) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block.d(1);
					if_block = current_block_type(component, ctx);
					if_block.c();
					if_block.m(div, null);
				}

				if (changed.headers) {
					setStyle(div, "width", "" + ctx.header.width + "px");
				}
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				if_block.d();
			}
		};
	}

	// (4:12) {#if row.headerHtml}
	function create_if_block(component, ctx) {
		var raw_value = ctx.row.headerHtml, raw_before, raw_after;

		return {
			c: function create() {
				raw_before = createElement('noscript');
				raw_after = createElement('noscript');
			},

			m: function mount(target, anchor) {
				insert(target, raw_before, anchor);
				raw_before.insertAdjacentHTML("afterend", raw_value);
				insert(target, raw_after, anchor);
			},

			p: function update(changed, ctx) {
				if ((changed.row) && raw_value !== (raw_value = ctx.row.headerHtml)) {
					detachBetween(raw_before, raw_after);
					raw_before.insertAdjacentHTML("afterend", raw_value);
				}
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachBetween(raw_before, raw_after);
					detachNode(raw_before);
					detachNode(raw_after);
				}
			}
		};
	}

	// (6:12) {:else}
	function create_if_block_1(component, ctx) {
		var text_value = ctx.row[ctx.header.property], text;

		return {
			c: function create() {
				text = createText(text_value);
			},

			m: function mount(target, anchor) {
				insert(target, text, anchor);
			},

			p: function update(changed, ctx) {
				if ((changed.row || changed.headers) && text_value !== (text_value = ctx.row[ctx.header.property])) {
					setData(text, text_value);
				}
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(text);
				}
			}
		};
	}

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.header = list[i];
		child_ctx.each_value = list;
		child_ctx.header_index = i;
		return child_ctx;
	}

	function RowHeader(options) {
		this._debugName = '<RowHeader>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this._state = assign(assign(this.store._init(["rowHeight"]), data()), options.data);
		this.store._add(this, ["rowHeight"]);
		if (!('$rowHeight' in this._state)) console.warn("<RowHeader> was created without expected data property '$rowHeight'");
		if (!('headers' in this._state)) console.warn("<RowHeader> was created without expected data property 'headers'");
		if (!('row' in this._state)) console.warn("<RowHeader> was created without expected data property 'row'");
		this._intro = !!options.intro;

		this._handlers.destroy = [removeFromStore];

		this._fragment = create_main_fragment(this, this._state);

		this.root._oncreate.push(() => {
			oncreate.call(this);
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(RowHeader.prototype, protoDev);

	RowHeader.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\modules\table\Table.html generated by Svelte v2.13.4 */

	function scrollWidth({$tableHeaders}) {
	    let sum = 0;
	    $tableHeaders.forEach(header => {
	        sum += header.width;
	    });
	    return sum;
	}

	function height({$height}) {
		return $height - 17;
	}

	function data$1() {
	    return {
	        visibleRows: null
	    }
	}
	var methods = {
	    initModule (options) {
	        this.set(options);
	        const {_gantt} = this.get();
	        const {scrollables} = _gantt.get();
	        scrollables.push({node: this.refs.scrollable});
	    },
	    onGanttCreated() {
	        const {_gantt} = this.get();

	        const height = _gantt.refs.sideContainer.clientHeight;
	        this.refs.sideHeaderContainer.style.height = height + 'px';
	    }
	};

	function oncreate$1(){
	    this.fire('init', {module: this});
	}
	function setup(component) {
	    component.defaults = {
	        // list of columns used in the table
	        // title: label to display in the header
	        // property: property of row to display in the cell
	        // width: width of column
	        tableHeaders: [{title: 'Name', property: 'label', width: 100}],
	        // total width of the table, if width is smaller than sum of column widths, a scrollbar shows
	        tableWidth: 100
	    };

	    component.bindToGantt = function (params) {
	        params.ganttTableModules.push(component);
	        Object.assign(params.defaults, component.defaults);
	    };
	}
	const file$1 = "src\\modules\\table\\Table.html";

	function create_main_fragment$1(component, ctx) {
		var div, div_1, text_1, div_2, div_3, each_1_blocks_1 = [], each_1_lookup = blankObject(), current;

		var each_value = ctx.$tableHeaders;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(component, get_each_context$1(ctx, each_value, i));
		}

		var each_value_1 = ctx.visibleRows;

		const get_key = ctx => ctx.row.id;

		for (var i = 0; i < each_value_1.length; i += 1) {
			let child_ctx = get_each_1_context(ctx, each_value_1, i);
			let key = get_key(child_ctx);
			each_1_blocks_1[i] = each_1_lookup[key] = create_each_block_1(component, key, child_ctx);
		}

		return {
			c: function create() {
				div = createElement("div");
				div_1 = createElement("div");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				text_1 = createText("\r\n\r\n    ");
				div_2 = createElement("div");
				div_3 = createElement("div");

				for (i = 0; i < each_1_blocks_1.length; i += 1) each_1_blocks_1[i].c();
				div_1.className = "table-header-container svelte-18vb6b9";
				setStyle(div_1, "width", "" + ctx.scrollWidth + "px");
				addLoc(div_1, file$1, 1, 4, 66);
				div_3.className = "table-row-container svelte-18vb6b9";
				setStyle(div_3, "padding-top", "" + ctx.$paddingTop + "px");
				setStyle(div_3, "padding-bottom", "" + ctx.$paddingBottom + "px");
				setStyle(div_3, "height", "" + ctx.$rowContainerHeight + "px");
				setStyle(div_3, "width", "" + ctx.scrollWidth + "px");
				addLoc(div_3, file$1, 10, 8, 448);
				div_2.className = "table-scroll-container svelte-18vb6b9";
				setStyle(div_2, "height", "" + ctx.height + "px");
				addLoc(div_2, file$1, 9, 4, 360);
				div.className = "table-container svelte-18vb6b9";
				setStyle(div, "width", "" + ctx.$tableWidth + "px");
				addLoc(div, file$1, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, div_1);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div_1, null);
				}

				component.refs.sideHeaderContainer = div_1;
				append(div, text_1);
				append(div, div_2);
				append(div_2, div_3);

				for (i = 0; i < each_1_blocks_1.length; i += 1) each_1_blocks_1[i].i(div_3, null);

				component.refs.scrollable = div_2;
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.$tableHeaders) {
					each_value = ctx.$tableHeaders;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$1(component, child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div_1, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}

				if (!current || changed.scrollWidth) {
					setStyle(div_1, "width", "" + ctx.scrollWidth + "px");
				}

				const each_value_1 = ctx.visibleRows;
				each_1_blocks_1 = updateKeyedEach(each_1_blocks_1, component, changed, get_key, 1, ctx, each_value_1, each_1_lookup, div_3, outroAndDestroyBlock, create_each_block_1, "i", null, get_each_1_context);

				if (!current || changed.$paddingTop) {
					setStyle(div_3, "padding-top", "" + ctx.$paddingTop + "px");
				}

				if (!current || changed.$paddingBottom) {
					setStyle(div_3, "padding-bottom", "" + ctx.$paddingBottom + "px");
				}

				if (!current || changed.$rowContainerHeight) {
					setStyle(div_3, "height", "" + ctx.$rowContainerHeight + "px");
				}

				if (!current || changed.scrollWidth) {
					setStyle(div_3, "width", "" + ctx.scrollWidth + "px");
				}

				if (!current || changed.height) {
					setStyle(div_2, "height", "" + ctx.height + "px");
				}

				if (!current || changed.$tableWidth) {
					setStyle(div, "width", "" + ctx.$tableWidth + "px");
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				const countdown = callAfter(outrocallback, each_1_blocks_1.length);
				for (i = 0; i < each_1_blocks_1.length; i += 1) each_1_blocks_1[i].o(countdown);

				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				destroyEach(each_blocks, detach);

				if (component.refs.sideHeaderContainer === div_1) component.refs.sideHeaderContainer = null;

				for (i = 0; i < each_1_blocks_1.length; i += 1) each_1_blocks_1[i].d();

				if (component.refs.scrollable === div_2) component.refs.scrollable = null;
			}
		};
	}

	// (3:8) {#each $tableHeaders as header}
	function create_each_block$1(component, ctx) {
		var div, text_value = ctx.header.title, text;

		return {
			c: function create() {
				div = createElement("div");
				text = createText(text_value);
				div.className = "row-header-cell";
				setStyle(div, "width", "" + ctx.header.width + "px");
				addLoc(div, file$1, 3, 12, 211);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, text);
			},

			p: function update(changed, ctx) {
				if ((changed.$tableHeaders) && text_value !== (text_value = ctx.header.title)) {
					setData(text, text_value);
				}

				if (changed.$tableHeaders) {
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

	// (12:12) {#each visibleRows as row (row.id)}
	function create_each_block_1(component, key_1, ctx) {
		var first, current;

		var rowheader_initial_data = { row: ctx.row, headers: ctx.$tableHeaders };
		var rowheader = new RowHeader({
			root: component.root,
			store: component.store,
			data: rowheader_initial_data
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
				insert(target, first, anchor);
				rowheader._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var rowheader_changes = {};
				if (changed.visibleRows) rowheader_changes.row = ctx.row;
				if (changed.$tableHeaders) rowheader_changes.headers = ctx.$tableHeaders;
				rowheader._set(rowheader_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (rowheader) rowheader._fragment.o(outrocallback);
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

	function get_each_context$1(ctx, list, i) {
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

	function Table(options) {
		this._debugName = '<Table>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this.refs = {};
		this._state = assign(assign(this.store._init(["tableHeaders","height","tableWidth","paddingTop","paddingBottom","rowContainerHeight"]), data$1()), options.data);
		this.store._add(this, ["tableHeaders","height","tableWidth","paddingTop","paddingBottom","rowContainerHeight"]);
		this._recompute({ $tableHeaders: 1, $height: 1 }, this._state);
		if (!('$tableHeaders' in this._state)) console.warn("<Table> was created without expected data property '$tableHeaders'");
		if (!('$height' in this._state)) console.warn("<Table> was created without expected data property '$height'");
		if (!('$tableWidth' in this._state)) console.warn("<Table> was created without expected data property '$tableWidth'");


		if (!('$paddingTop' in this._state)) console.warn("<Table> was created without expected data property '$paddingTop'");
		if (!('$paddingBottom' in this._state)) console.warn("<Table> was created without expected data property '$paddingBottom'");
		if (!('$rowContainerHeight' in this._state)) console.warn("<Table> was created without expected data property '$rowContainerHeight'");
		if (!('visibleRows' in this._state)) console.warn("<Table> was created without expected data property 'visibleRows'");
		this._intro = !!options.intro;

		this._handlers.destroy = [removeFromStore];

		this._fragment = create_main_fragment$1(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$1.call(this);
			this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
		});

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);

			flush(this);
		}

		this._intro = true;
	}

	assign(Table.prototype, protoDev);
	assign(Table.prototype, methods);

	Table.prototype._checkReadOnly = function _checkReadOnly(newState) {
		if ('scrollWidth' in newState && !this._updatingReadonlyProperty) throw new Error("<Table>: Cannot set read-only property 'scrollWidth'");
		if ('height' in newState && !this._updatingReadonlyProperty) throw new Error("<Table>: Cannot set read-only property 'height'");
	};

	Table.prototype._recompute = function _recompute(changed, state) {
		if (changed.$tableHeaders) {
			if (this._differs(state.scrollWidth, (state.scrollWidth = scrollWidth(state)))) changed.scrollWidth = true;
		}

		if (changed.$height) {
			if (this._differs(state.height, (state.height = height(state)))) changed.height = true;
		}
	};

	setup(Table);

	return Table;

}());
//# sourceMappingURL=svelteGanttTable.js.map
