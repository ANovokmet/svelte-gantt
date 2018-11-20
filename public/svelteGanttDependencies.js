var SvelteGanttDependencies = (function () {
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

	function createElement(name) {
		return document.createElement(name);
	}

	function createSvgElement(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
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

	/* src\modules\dependencies\Arrow.html generated by Svelte v2.13.4 */

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
	function data() {
	    return {
	        startX: 0,
	        startY: 0,
	        endX: 100,
	        endY: 100,
	        minLen: 12
	    }
	}
	var methods = {
	    test() {
	        console.log('CLICKED ARROW');
	    }
	};

	function oncreate() {

	}
	const file = "src\\modules\\dependencies\\Arrow.html";

	function create_main_fragment(component, ctx) {
		var svg, path_1, path_2, current;

		function click_handler(event) {
			component.test();
		}

		return {
			c: function create() {
				svg = createSvgElement("svg");
				path_1 = createSvgElement("path");
				path_2 = createSvgElement("path");
				addListener(path_1, "click", click_handler);
				setAttribute(path_1, "d", ctx.path);
				setAttribute(path_1, "stroke", "red");
				setAttribute(path_1, "fill", "transparent");
				setAttribute(path_1, "class", "select-area svelte-m8v62h");
				addLoc(path_1, file, 1, 2, 114);
				setAttribute(path_2, "d", ctx.arrowPath);
				setAttribute(path_2, "fill", "red");
				addLoc(path_2, file, 3, 2, 210);
				setAttribute(svg, "xmlns", "http://www.w3.org/2000/svg");
				setAttribute(svg, "shape-rendering", "crispEdges");
				setAttribute(svg, "class", "arrow svelte-m8v62h");
				setAttribute(svg, "height", "100%");
				setAttribute(svg, "width", "100%");
				addLoc(svg, file, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, svg, anchor);
				append(svg, path_1);
				append(svg, path_2);
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

				removeListener(path_1, "click", click_handler);
			}
		};
	}

	function Arrow(options) {
		this._debugName = '<Arrow>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this._state = assign(data(), options.data);
		this._recompute({ endY: 1, startY: 1, endX: 1, startX: 1, minLen: 1, width: 1, height: 1 }, this._state);
		if (!('endY' in this._state)) console.warn("<Arrow> was created without expected data property 'endY'");
		if (!('startY' in this._state)) console.warn("<Arrow> was created without expected data property 'startY'");
		if (!('endX' in this._state)) console.warn("<Arrow> was created without expected data property 'endX'");
		if (!('startX' in this._state)) console.warn("<Arrow> was created without expected data property 'startX'");
		if (!('minLen' in this._state)) console.warn("<Arrow> was created without expected data property 'minLen'");
		this._intro = !!options.intro;

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

	assign(Arrow.prototype, protoDev);
	assign(Arrow.prototype, methods);

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

	/* src\modules\dependencies\Dependency.html generated by Svelte v2.13.4 */

	function data$1() {
	    return {}
	}
	var methods$1 = {
	    update() {
	        const { dependency } = this.get();
	        const result = dependency.update();
	        //this.set(result);
	        this.set({ dependency });
	    }
	};

	function oncreate$1() { 
	    const a = this.get().dependency;
	    if(!a)return;
	    const { fromTask, toTask } = this.get().dependency;
	    fromTask.subscribe(this);
	    toTask.subscribe(this);
	}
	function ondestroy() {
	    const { fromTask, toTask } = this.get().dependency;
	    fromTask.unsubscribe(this);
	    toTask.unsubscribe(this);
	}
	function onupdate({ changed, current, previous }){
	    if(changed.dependency && previous && current.dependency !== previous.dependency){
	        previous.dependency.fromTask.unsubscribe(this);
	        previous.dependency.toTask.unsubscribe(this);

	        current.dependency.fromTask.subscribe(this);
	        current.dependency.toTask.subscribe(this);
	    }
	}
	const file$1 = "src\\modules\\dependencies\\Dependency.html";

	function create_main_fragment$1(component, ctx) {
		var div, current;

		var arrow_initial_data = {
		 	startX: ctx.dependency.startX,
		 	startY: ctx.dependency.startY,
		 	endX: ctx.dependency.endX,
		 	endY: ctx.dependency.endY
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
				addLoc(div, file$1, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				arrow._mount(div, null);
				current = true;
			},

			p: function update(changed, ctx) {
				var arrow_changes = {};
				if (changed.dependency) arrow_changes.startX = ctx.dependency.startX;
				if (changed.dependency) arrow_changes.startY = ctx.dependency.startY;
				if (changed.dependency) arrow_changes.endX = ctx.dependency.endX;
				if (changed.dependency) arrow_changes.endY = ctx.dependency.endY;
				arrow._set(arrow_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (arrow) arrow._fragment.o(outrocallback);
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
		this._state = assign(data$1(), options.data);
		if (!('dependency' in this._state)) console.warn("<Dependency> was created without expected data property 'dependency'");
		this._intro = !!options.intro;
		this._handlers.update = [onupdate];

		this._handlers.destroy = [ondestroy];

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

	assign(Dependency.prototype, protoDev);
	assign(Dependency.prototype, methods$1);

	Dependency.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	class SvelteDependency {
	    constructor(gantt, model){
	        this.model = model;
	        this.gantt = gantt;

	        const {_taskCache} = gantt.get();
	        this.fromTask = _taskCache[model.fromTask];
	        this.toTask = _taskCache[model.toTask];

	        this.update();
	    }

	    update() {
	        const {rows, rowHeight} = this.gantt.store.get();

	        let startX = this.fromTask.left + this.fromTask.width;
	        let endX = this.toTask.left;

	        //can be sped up by caching indices of rows
	        let startIndex = rows.indexOf(this.fromTask.row); 
	        let endIndex = rows.indexOf(this.toTask.row); 

	        let startY = (startIndex + 0.5) * rowHeight;
	        let endY = (endIndex + 0.5) * rowHeight;

	        const result = {startX, startY, endX, endY};
	        Object.assign(this, result);
	        return result;
	    }

	    updateView() {
	        if(this.component) {
	            this.component.set({dependency: this});
	        }
	    }
	}

	/* src\modules\dependencies\GanttDependencies.html generated by Svelte v2.13.4 */

	function data$2() {
	    return {
	        _gantt: null, //gantt this
	        _options: {}, //gantt this.get()
	        visibleDependencies: [],
	        dependencies: []
	    }
	}
	var methods$2 = {
	    initModule (options) {
	        this.set(options);
	        const {_gantt} = this.get();
	        /*const {dependencies, _allTasks} = _gantt.get();

	        for(let i=0; i < dependencies.length; i++){
	            let dependency = dependencies[i];
	            const fromTask = _allTasks.find(t => t.id == dependency.fromTask);
	            const toTask = _allTasks.find(t => t.id == dependency.toTask);
	            dependency.fromTask = fromTask;
	            dependency.toTask = toTask;

	            dependencies[i] = new SvelteDependency(dependency, _gantt.store.get());
	        }*/
	    },
	    onGanttCreated() {
	        const {_gantt} = this.get();
	        const {dependencies, _allTasks, _taskCache} = _gantt.get();

	        /*for(let i=0; i < dependencies.length; i++){
	            let dependency = dependencies[i];
	            const fromTask = _taskCache[dependency.fromTask]; //_allTasks.find(t => t.id == dependency.fromTask);
	            const toTask = _taskCache[dependency.toTask];//_allTasks.find(t => t.id == dependency.toTask);
	            dependency.fromTask = fromTask;
	            dependency.toTask = toTask;

	            dependencies[i] = new SvelteDependency(_gantt, dependency);
	        }*/

	        //this.updateVisible({scrollAmount:0, viewportHeight:400});
	        //this.set({visibleDependencies});
	    },
	    initData(data){
	        const {_gantt, visibleDependencies} = this.get();

	        const dependencies = [];
	        //this.set({dependencies: [], visibleDependencies: []});
	        for(let i=0; i < data.dependencies.length; i++){
	            const dependency = data.dependencies[i];
	            dependencies.push(new SvelteDependency(_gantt, dependency));
	        }
	        this.set({dependencies});
	    },
	    updateVisible({scrollAmount, viewportHeight}){
	        const { dependencies } = this.get();//._options;

	        //interval tree or just debounce a bit
	        const visibleDependencies = [];
	        
	        const viewportTop = scrollAmount;
	        const viewportBottom = scrollAmount + viewportHeight;

	        for(let i = 0; i < dependencies.length; i++){
	            const dependency = dependencies[i];
	            let { startY, endY } = dependency;
	            
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

	            if(!(yMax < viewportTop && yMin < viewportTop || yMax > viewportBottom && yMin > viewportBottom)) {
	                //cant see dependency
	                visibleDependencies.push(dependency);
	            }
	        }

	        this.set({ visibleDependencies });
	    },
	    updateView({from, to, headers}){
	        const { dependencies } = this.get();
	        dependencies.forEach(dependency => {
	            dependency.update();
	        });
	        this.set({ visibleDependencies: this.get().visibleDependencies });
	    }
	};

	function oncreate$2() {
	    this.fire('init', {module: this});
	}
	function setup(component) {
	    component.bindToGantt = function (params) {
	        params.ganttBodyModules.push(component);
	    };
	}
	const file$2 = "src\\modules\\dependencies\\GanttDependencies.html";

	function create_main_fragment$2(component, ctx) {
		var div, each_blocks_1 = [], each_lookup = blankObject(), current;

		var each_value = ctx.visibleDependencies;

		const get_key = ctx => ctx.dependency.model.id;

		for (var i = 0; i < each_value.length; i += 1) {
			let child_ctx = get_each_context(ctx, each_value, i);
			let key = get_key(child_ctx);
			each_blocks_1[i] = each_lookup[key] = create_each_block(component, key, child_ctx);
		}

		return {
			c: function create() {
				div = createElement("div");

				for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].c();
				div.className = "dependency-container svelte-mvwfh8";
				addLoc(div, file$2, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);

				for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].i(div, null);

				current = true;
			},

			p: function update(changed, ctx) {
				const each_value = ctx.visibleDependencies;
				each_blocks_1 = updateKeyedEach(each_blocks_1, component, changed, get_key, 1, ctx, each_value, each_lookup, div, outroAndDestroyBlock, create_each_block, "i", null, get_each_context);
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
			}
		};
	}

	// (2:4) {#each visibleDependencies as dependency (dependency.model.id)}
	function create_each_block(component, key_1, ctx) {
		var first, current;

		var dependency_initial_data = { dependency: ctx.dependency };
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
				insert(target, first, anchor);
				dependency._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var dependency_changes = {};
				if (changed.visibleDependencies) dependency_changes.dependency = ctx.dependency;
				dependency._set(dependency_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (dependency) dependency._fragment.o(outrocallback);
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

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.dependency = list[i];
		child_ctx.each_value = list;
		child_ctx.dependency_index = i;
		return child_ctx;
	}

	function GanttDependencies(options) {
		this._debugName = '<GanttDependencies>';
		if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
		init(this, options);
		this._state = assign(data$2(), options.data);
		if (!('visibleDependencies' in this._state)) console.warn("<GanttDependencies> was created without expected data property 'visibleDependencies'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$2(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$2.call(this);
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

	assign(GanttDependencies.prototype, protoDev);
	assign(GanttDependencies.prototype, methods$2);

	GanttDependencies.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	setup(GanttDependencies);

	return GanttDependencies;

}());
//# sourceMappingURL=svelteGanttDependencies.js.map
