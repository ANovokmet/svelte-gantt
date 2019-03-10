var SvelteGantt = (function () {
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

	function addListener(node, event, handler, options) {
		node.addEventListener(event, handler, options);
	}

	function removeListener(node, event, handler, options) {
		node.removeEventListener(event, handler, options);
	}

	function setData(text, data) {
		text.data = '' + data;
	}

	function setStyle(node, key, value) {
		node.style.setProperty(key, value);
	}

	function toggleClass(element, name, toggle) {
		element.classList[toggle ? 'add' : 'remove'](name);
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

	function getSpreadUpdate(levels, updates) {
		var update = {};

		var to_null_out = {};
		var accounted_for = {};

		var i = levels.length;
		while (i--) {
			var o = levels[i];
			var n = updates[i];

			if (n) {
				for (var key in o) {
					if (!(key in n)) to_null_out[key] = 1;
				}

				for (var key in n) {
					if (!accounted_for[key]) {
						update[key] = n[key];
						accounted_for[key] = 1;
					}
				}

				levels[i] = n;
			} else {
				for (var key in o) {
					accounted_for[key] = 1;
				}
			}
		}

		for (var key in to_null_out) {
			if (!(key in update)) update[key] = undefined;
		}

		return update;
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

	class DOMUtils {
	    isTaskVisible() {
	    }
	    isRowVisible() {
	    }
	    //get mouse position within the element
	    static getRelativePos(node, event) {
	        const rect = node.getBoundingClientRect();
	        const x = event.clientX - rect.left; //x position within the element.
	        const y = event.clientY - rect.top; //y position within the element.
	        return {
	            x: x,
	            y: y
	        };
	    }
	    //does mouse position intersect element
	    static intersects(node, event) {
	    }
	    static addEventListenerOnce(target, type, listener, addOptions, removeOptions) {
	        target.addEventListener(type, function fn(event) {
	            target.removeEventListener(type, fn, removeOptions);
	            listener.apply(this, arguments, addOptions);
	        });
	    }
	}
	//# sourceMappingURL=domUtils.js.map

	/* src\Row.html generated by Svelte v2.16.0 */

	var methods = {
	    taskMoved() {
	        console.log('Task moved');
	    },
	    taskAdded() {
	        //when task moving to row, need to update row to show new task
	        const { row } = this.get();
	        //console.log('Task moved to row', row);
	        this.set({ row });
	    },
	    taskRemoved() {
	        const { row } = this.get();
	        //console.log('Task removed from row', row);
	        this.set({ row });
	    },
	    taskDropped(task) {
	        //this.handleOverlaps();
	    },
	    handleOverlaps(){
	        this.sortTasks();
	        const { row } = this.get();
	        const overlaps = [];
	        let previous = row.tasks[0];
	        for(let i = 1; i < row.tasks.length; i++){
	            const current = row.tasks[i];

	            if(current.overlaps(previous))
	            {
	                if(current.overlapping !== true){
	                    current.overlapping = true;
	                    current.component.set({ task: current });
	                }
	                if(previous.overlapping !== true){
	                    previous.overlapping = true;
	                    previous.component.set({ task: previous });
	                }

	                if(overlaps.indexOf(current.id) === -1){
	                    overlaps.push(current.id);
	                }

	                if(overlaps.indexOf(previous.id) === -1){
	                    overlaps.push(previous.id);
	                }
	            }

	            if (previous.left + previous.width < current.left + current.width) {
	                previous = current;
	            }
	        }

	        for(let i = 0; i < row.tasks.length; i++){
	            const current = row.tasks[i];
	            if(overlaps.indexOf(current.id) === -1){
	                if(!!current.overlapping) {
	                    current.overlapping = false;
	                    current.component.set({ task: current });
	                }
	            }
	        }
	    },
	    sortTasks() {
	        const { row } =  this.get();
	        row.tasks.sort(function (a, b) {
	            if (a.left < b.left) {
	                return -1
	            } else if (a.left > b.left) {
	                return 1
	            }
	            return 0
	        });
	    },
	    updateVisible(){
	        const { row } = this.get();

	        const visibleTasks = this.visibleTasks(row);
	        this.set({visibleTasks});
	    },
	    visibleTasks(row){
	        const { gantt, from, to } = this.store.get();
	        const scrollLeft = gantt.refs.mainContainer.scrollLeft;
	        const clientWidth = gantt.refs.mainContainer.clientWidth;
	        //finish this
	        //this.store.set({scrollLeft, clientWidth});

	        //da su sortirani -> index prvog, zadnjeg, i onda slice
	        //da su sortirani -> nakon zadnjeg break
	        const visibleTasks = [];
	        row.tasks.forEach(task => {
	            if(!(task.to < from || task.from > to)){
	                visibleTasks.push(task);
	            }
	        });
	        //console.log(visibleTasks.length);
	        return visibleTasks;
	    }
	};

	function oncreate() {
	    const { row } = this.get();
	    row.rowElement = this.refs.row;
	    row.component = this;

	    if(!row.classes){ //default
	        row.classes = [];
	    }
	}
	function ondestroy(){
	    const { row } = this.get();
	    row.rowElement = null;
	    row.component = null;
	}
	function onupdate({ changed, current, previous }) {
	    if(changed.row){
	        current.row.rowElement = this.refs.row;
	        current.row.component = this;
	    }
	}
	const file = "src\\Row.html";

	function create_main_fragment(component, ctx) {
		var div, div_class_value, current;

		var if_block = (ctx.row.model.contentHtml) && create_if_block(component, ctx);

		return {
			c: function create() {
				div = createElement("div");
				if (if_block) if_block.c();
				div.className = div_class_value = "row " + ctx.row.model.classes + " svelte-1jglin1";
				setStyle(div, "height", "" + ctx.$rowHeight + "px");
				addLoc(div, file, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				if (if_block) if_block.m(div, null);
				component.refs.row = div;
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.row.model.contentHtml) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block(component, ctx);
						if_block.c();
						if_block.m(div, null);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if ((changed.row) && div_class_value !== (div_class_value = "row " + ctx.row.model.classes + " svelte-1jglin1")) {
					div.className = div_class_value;
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

				if (if_block) if_block.d();
				if (component.refs.row === div) component.refs.row = null;
			}
		};
	}

	// (9:4) {#if row.model.contentHtml}
	function create_if_block(component, ctx) {
		var raw_value = ctx.row.model.contentHtml, raw_before, raw_after;

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
				if ((changed.row) && raw_value !== (raw_value = ctx.row.model.contentHtml)) {
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

	function Row(options) {
		this._debugName = '<Row>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}
		if (!options.store) {
			throw new Error("<Row> references store properties, but no store was provided");
		}

		init(this, options);
		this.refs = {};
		this._state = assign(this.store._init(["rowHeight"]), options.data);
		this.store._add(this, ["rowHeight"]);
		if (!('row' in this._state)) console.warn("<Row> was created without expected data property 'row'");
		if (!('$rowHeight' in this._state)) console.warn("<Row> was created without expected data property '$rowHeight'");
		this._intro = !!options.intro;
		this._handlers.update = [onupdate];

		this._handlers.destroy = [ondestroy, removeFromStore];

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

	assign(Row.prototype, protoDev);
	assign(Row.prototype, methods);

	Row.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Task.html generated by Svelte v2.16.0 */

	function selected({$selection, model}) {
		return $selection.indexOf(model) !== -1;
	}

	function data() {
	    return {
	        dragging: false,
	        overlapping: false,
	        selected: false,
	        resizing: false
	    }
	}
	var methods$1 = {
	    updateCursor(cursor){
	        const element = this.refs.taskElement;
	        element.style.cursor = cursor || 'default';
	    },
	    onclick(event){
	        const { onTaskButtonClick } = this.store.get();
	        if(onTaskButtonClick) {
	            event.stopPropagation();
	            const { task } = this.get();
	            onTaskButtonClick(task);
	        }
	    }
	};

	function oncreate$1() {
	    
	}
	function ondestroy$1() {
	    
	}
	function onupdate$1({ changed, current, previous }) {
	    if(changed.task){
	        //console.log('current', current.task);
	        //console.log('previous', previous && previous.task);
	        //current.row.rowElement = this.refs.row;
	        current.task.component = this;
	    }

	    if(changed.task && changed.row){
	        current.task.row = current.row;
	    }
	}
	function drag(node) {
	                const { rowContainerElement, ganttUtils, gantt, resizeHandleWidth } = this.store.get();
	                const windowElement = window;

	                let { model } = this.get();
	                //update reference when tasks are loaded with new data
	                // const listener = this.on('update', ({ changed, current, previous }) => {
	                //     if(changed.task){
	                //         task = current.task;
	                //     }
	                // });

	                let mouseStartPosX, mouseStartPosY;
	                let mouseStartRight;
	                
	                let originalRow;
	                let taskOriginalFrom, taskOriginalTo;
	                
	                    
	                const onmousedown = (event) => {
	                    if(event.which !== 1){
	                        //debugger;
	                        return;
	                    }

	                    const { left, posY, width } = this.get();

	                    event.stopPropagation();
	                    event.preventDefault();
	                    
	                    const { _rowCache } = gantt.get();
	                    originalRow = _rowCache[model.resourceId];
	                    taskOriginalFrom = model.from.clone();
	                    taskOriginalTo = model.to.clone();

	                    if(originalRow.model.enableDragging && model.enableDragging){
	                        mouseStartPosX = DOMUtils.getRelativePos(rowContainerElement, event).x - left;
	                        mouseStartPosY = DOMUtils.getRelativePos(rowContainerElement, event).y - posY;
	                        mouseStartRight = left + width;

	                        if(mouseStartPosX < resizeHandleWidth) {
	                            this.set({
	                                resizing: true,
	                                direction: 'left'
	                            });
	                            //gantt.includeInRender = task;
	                        }
	                        else if(mouseStartPosX > width - resizeHandleWidth) {

	                            this.set({
	                                resizing: true,
	                                direction: 'right'
	                            });
	                            //gantt.includeInRender = task;
	                        }
	                        else {
	                            this.set({
	                                dragging: true
	                            });
	                            // gantt.includeInRender = task;
	                        }

	                        windowElement.addEventListener('mousemove', onmousemove, false);
	                        DOMUtils.addEventListenerOnce(windowElement, 'mouseup', onmouseup);
	                    }
	                };
	                
	                const onmousemove = (event) => {

	                    const { resizing, dragging } = this.get();

	                    event.preventDefault();
	                    if(resizing) {
	                        const mousePos = DOMUtils.getRelativePos(rowContainerElement, event);
	                        const { direction, left, width } = this.get();
	                        
	                        if(direction === 'left') { //resize ulijevo
	                            if(mousePos.x > left + width) {
	                                this.set({
	                                    left: mouseStartRight,
	                                    posX: mouseStartRight,
	                                    width: mouseStartRight - mousePos.x,
	                                    widthT: mouseStartRight - mousePos.x,
	                                    direction: 'right',
	                                    mouseStartRight: mouseStartRight + width
	                                });
	                            }
	                            else{
	                                this.set({
	                                    left: mousePos.x,
	                                    posX: mousePos.x,
	                                    width: mouseStartRight - mousePos.x,
	                                    widthT: mouseStartRight - mousePos.x
	                                });
	                            }
	                        }
	                        else if(direction === 'right') {//resize desno
	                            if(mousePos.x <= left) {
	                                this.set({
	                                    width: left - mousePos.x,
	                                    widthT: left - mousePos.x,
	                                    left: mousePos.x,
	                                    posX: mousePos.x,
	                                    direction: 'left',
	                                    mouseStartRight: mousePos.x + left - mousePos.x
	                                });
	                            }
	                            else {
	                                this.set({
	                                    width: mousePos.x - left,
	                                    widthT: mousePos.x - left
	                                });
	                            }
	                        }
	                    }

	                    // mouseup
	                    if(dragging) {
	                        const mousePos = DOMUtils.getRelativePos(rowContainerElement, event);

	                        this.set({
	                            left: mousePos.x - mouseStartPosX,
	                            posX: mousePos.x - mouseStartPosX,
	                            posY: mousePos.y - mouseStartPosY
	                        });
	                    }
	                    
	                };

	                const onmouseup = (event) => {
	                    
	                    const { left, width, dragging } = this.get();

	                    const { _taskCache, gantt } = this.store.get();

	                    if(dragging) {
	                        //row switching
	                        const rowCenterX = gantt.refs.mainContainer.getBoundingClientRect().left + gantt.refs.mainContainer.getBoundingClientRect().width / 2;
	                        const { _rowCache } = gantt.get();
	                        const sourceRow = _rowCache[model.resourceId];

	                        let elements = document.elementsFromPoint(rowCenterX, event.clientY);
	                        let rowElement = elements.find((element) => element.classList.contains('row'));
	                        if(rowElement !== undefined && rowElement !== sourceRow.rowElement) {

	                            const { rows } = gantt.store.get(); //visibleRows
	                            const targetRow = rows.find((r) => r.rowElement === rowElement); //vr

	                            if(targetRow.model.enableDragging){
	                                //targetRow.moveTask(this);
	                                model.resourceId = targetRow.model.id;
	                                
	                                sourceRow.component.taskRemoved();
	                                targetRow.component.taskAdded();
	                                gantt.api.tasks.raise.switchRow(this, targetRow, sourceRow);
	                            }
	                        }
	                    }
	                    
	                    this.set({
	                        posX: Math.ceil(left),
	                        posY: model.resourceId * 52,
	                        widthT: Math.ceil(width),
	                        
	                        dragging: false,
	                        resizing: false,
	                        direction: null,
	                    });

	                    _taskCache[model.id].updateDate();
	                    _taskCache[model.id].updatePosition();
	                    this.store.set({ _taskCache });


	                    //gantt.includeInRender = null;
	                    windowElement.removeEventListener('mousemove', onmousemove, false);
	                    //component.fire('taskDropped', { task });
	                    //component.set({task});

	                    //code this better
	                    const { _rowCache } = gantt.get();
	                    if(originalRow && originalRow !== _rowCache[model.resourceId]) ;

	                    // gantt.api.tasks.raise.moveEnd(task, task.row, originalRow);
	                    // if(!taskOriginalFrom.isSame(task.model.from) || !taskOriginalTo.isSame(task.model.to) || (originalRow && originalRow !== task.row)) {
	                    //     gantt.api.tasks.raise.changed(task, task.row, originalRow);
	                    // }
	                };

	                node.addEventListener('mousedown', onmousedown, false);

	                const cursorOnMove = (e) => {
	                    const { left, width } = this.get();

	                    const mouseStartPosX = DOMUtils.getRelativePos(rowContainerElement, e).x - left;

	                    //TODO globally set cursor ON mousedown
	                    if(mouseStartPosX < resizeHandleWidth || mouseStartPosX > width - resizeHandleWidth) {
	                        this.updateCursor('e-resize');
	                    }
	                    else{
	                        this.updateCursor();
	                    }

	                };
	                node.addEventListener('mousemove', cursorOnMove, false);

		return {
			update() {

			},

			destroy() {
				node.removeEventListener('mousedown', onmousedown, false);
				//windowElement.removeEventListener('mousemove', onmousemove, false);
				node.removeEventListener('mousemove', onmousemove, false);
	                        node.removeEventListener('mouseup', onmouseup, false);
			}
		}
	            }
	function selectable(node) {
	    const { gantt } = this.store.get();
	    node.addEventListener('click', (e) => {
	        const { model } = this.get();
	        if(e.ctrlKey){
	            gantt.selectionManager.toggleSelection(model);
	        }
	        else{
	            gantt.selectionManager.selectSingle(model);
	        }

	        if(model.selected){
	            gantt.api.tasks.raise.select(model);
	        }
	    });
	}
	const file$1 = "src\\Task.html";

	function create_main_fragment$1(component, ctx) {
		var div2, div0, text0, div1, text1, div2_class_value, drag_action, selectable_action, current;

		function select_block_type(ctx) {
			if (ctx.model.html) return create_if_block_1;
			if (ctx.$taskContent) return create_if_block_2;
			return create_else_block;
		}

		var current_block_type = select_block_type(ctx);
		var if_block0 = current_block_type(component, ctx);

		var if_block1 = (ctx.model.showButton) && create_if_block$1(component, ctx);

		return {
			c: function create() {
				div2 = createElement("div");
				div0 = createElement("div");
				text0 = createText("\r\n    ");
				div1 = createElement("div");
				if_block0.c();
				text1 = createText("\r\n\r\n        ");
				if (if_block1) if_block1.c();
				div0.className = "task-background svelte-1j9ey43";
				setStyle(div0, "width", "" + ctx.model.amountDone + "%");
				addLoc(div0, file$1, 11, 4, 312);
				div1.className = "task-content svelte-1j9ey43";
				addLoc(div1, file$1, 12, 4, 387);
				div2.className = div2_class_value = "task " + ctx.model.classes + " svelte-1j9ey43";
				setStyle(div2, "width", "" + ctx.widthT + "px");
				setStyle(div2, "height", "" + ctx.height + "px");
				setStyle(div2, "transform", "translate(" + ctx.posX + "px, " + ctx.posY + "px)");
				toggleClass(div2, "overlapping", ctx.overlapping);
				toggleClass(div2, "selected", ctx.selected);
				toggleClass(div2, "moving", ctx.dragging||ctx.resizing);
				addLoc(div2, file$1, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div2, anchor);
				append(div2, div0);
				append(div2, text0);
				append(div2, div1);
				if_block0.m(div1, null);
				append(div1, text1);
				if (if_block1) if_block1.m(div1, null);
				component.refs.taskElement = div2;
				drag_action = drag.call(component, div2) || {};
				selectable_action = selectable.call(component, div2) || {};
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.model) {
					setStyle(div0, "width", "" + ctx.model.amountDone + "%");
				}

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
					if_block0.p(changed, ctx);
				} else {
					if_block0.d(1);
					if_block0 = current_block_type(component, ctx);
					if_block0.c();
					if_block0.m(div1, text1);
				}

				if (ctx.model.showButton) {
					if (if_block1) {
						if_block1.p(changed, ctx);
					} else {
						if_block1 = create_if_block$1(component, ctx);
						if_block1.c();
						if_block1.m(div1, null);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if ((changed.model) && div2_class_value !== (div2_class_value = "task " + ctx.model.classes + " svelte-1j9ey43")) {
					div2.className = div2_class_value;
				}

				if (changed.widthT) {
					setStyle(div2, "width", "" + ctx.widthT + "px");
				}

				if (changed.height) {
					setStyle(div2, "height", "" + ctx.height + "px");
				}

				if (changed.posX || changed.posY) {
					setStyle(div2, "transform", "translate(" + ctx.posX + "px, " + ctx.posY + "px)");
				}

				if ((changed.model || changed.overlapping)) {
					toggleClass(div2, "overlapping", ctx.overlapping);
				}

				if ((changed.model || changed.selected)) {
					toggleClass(div2, "selected", ctx.selected);
				}

				if ((changed.model || changed.dragging || changed.resizing)) {
					toggleClass(div2, "moving", ctx.dragging||ctx.resizing);
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div2);
				}

				if_block0.d();
				if (if_block1) if_block1.d();
				if (component.refs.taskElement === div2) component.refs.taskElement = null;
				if (drag_action && typeof drag_action.destroy === 'function') drag_action.destroy.call(component);
				if (selectable_action && typeof selectable_action.destroy === 'function') selectable_action.destroy.call(component);
			}
		};
	}

	// (18:8) {:else}
	function create_else_block(component, ctx) {
		var text_value = ctx.model.label, text;

		return {
			c: function create() {
				text = createText(text_value);
			},

			m: function mount(target, anchor) {
				insert(target, text, anchor);
			},

			p: function update(changed, ctx) {
				if ((changed.model) && text_value !== (text_value = ctx.model.label)) {
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

	// (16:30) 
	function create_if_block_2(component, ctx) {
		var raw_value = ctx.$taskContent(this), raw_before, raw_after;

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
				if ((changed.$taskContent) && raw_value !== (raw_value = ctx.$taskContent(this))) {
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

	// (14:8) {#if model.html}
	function create_if_block_1(component, ctx) {
		var raw_value = ctx.model.html, raw_before, raw_after;

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
				if ((changed.model) && raw_value !== (raw_value = ctx.model.html)) {
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

	// (22:8) {#if model.showButton}
	function create_if_block$1(component, ctx) {
		var span, raw_value = ctx.model.buttonHtml, span_class_value;

		function click_handler(event) {
			component.onclick(event);
		}

		return {
			c: function create() {
				span = createElement("span");
				addListener(span, "click", click_handler);
				span.className = span_class_value = "task-button " + ctx.model.buttonClasses + " svelte-1j9ey43";
				addLoc(span, file$1, 22, 12, 650);
			},

			m: function mount(target, anchor) {
				insert(target, span, anchor);
				span.innerHTML = raw_value;
			},

			p: function update(changed, ctx) {
				if ((changed.model) && raw_value !== (raw_value = ctx.model.buttonHtml)) {
					span.innerHTML = raw_value;
				}

				if ((changed.model) && span_class_value !== (span_class_value = "task-button " + ctx.model.buttonClasses + " svelte-1j9ey43")) {
					span.className = span_class_value;
				}
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(span);
				}

				removeListener(span, "click", click_handler);
			}
		};
	}

	function Task(options) {
		this._debugName = '<Task>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}
		if (!options.store) {
			throw new Error("<Task> references store properties, but no store was provided");
		}

		init(this, options);
		this.refs = {};
		this._state = assign(assign(this.store._init(["selection","taskContent"]), data()), options.data);
		this.store._add(this, ["selection","taskContent"]);

		this._recompute({ $selection: 1, model: 1 }, this._state);
		if (!('$selection' in this._state)) console.warn("<Task> was created without expected data property '$selection'");
		if (!('model' in this._state)) console.warn("<Task> was created without expected data property 'model'");
		if (!('widthT' in this._state)) console.warn("<Task> was created without expected data property 'widthT'");
		if (!('height' in this._state)) console.warn("<Task> was created without expected data property 'height'");
		if (!('posX' in this._state)) console.warn("<Task> was created without expected data property 'posX'");
		if (!('posY' in this._state)) console.warn("<Task> was created without expected data property 'posY'");
		if (!('overlapping' in this._state)) console.warn("<Task> was created without expected data property 'overlapping'");

		if (!('dragging' in this._state)) console.warn("<Task> was created without expected data property 'dragging'");
		if (!('resizing' in this._state)) console.warn("<Task> was created without expected data property 'resizing'");
		if (!('$taskContent' in this._state)) console.warn("<Task> was created without expected data property '$taskContent'");
		this._intro = !!options.intro;
		this._handlers.update = [onupdate$1];

		this._handlers.destroy = [ondestroy$1, removeFromStore];

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

	assign(Task.prototype, protoDev);
	assign(Task.prototype, methods$1);

	Task.prototype._checkReadOnly = function _checkReadOnly(newState) {
		if ('selected' in newState && !this._updatingReadonlyProperty) throw new Error("<Task>: Cannot set read-only property 'selected'");
	};

	Task.prototype._recompute = function _recompute(changed, state) {
		if (changed.$selection || changed.model) {
			if (this._differs(state.selected, (state.selected = selected(state)))) changed.selected = true;
		}
	};

	/* src\Column.html generated by Svelte v2.16.0 */

	function data$1(){
	    return {}
	}
	function oncreate$2() {
	}
	const file$2 = "src\\Column.html";

	function create_main_fragment$2(component, ctx) {
		var div, current;

		return {
			c: function create() {
				div = createElement("div");
				div.className = "column svelte-11nl46d";
				setStyle(div, "width", "" + ctx.width + "px");
				setStyle(div, "left", "" + ctx.left + "px");
				addLoc(div, file$2, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.width) {
					setStyle(div, "width", "" + ctx.width + "px");
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
			}
		};
	}

	function Column(options) {
		this._debugName = '<Column>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign(data$1(), options.data);
		if (!('width' in this._state)) console.warn("<Column> was created without expected data property 'width'");
		if (!('left' in this._state)) console.warn("<Column> was created without expected data property 'left'");
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

	assign(Column.prototype, protoDev);

	Column.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\ColumnHeader.html generated by Svelte v2.16.0 */

	function data$2(){
	    return {
	        headers: [],
	        width: null
	    }
	}
	var methods$2 = {
	    initHeaders() {
	        this.root.initGantt();
	        const { header } = this.get();
	        const { from, width, gantt } = this.store.get();
	        const columnWidth = gantt.utils.getPositionByDate(from.clone().add(1, header.unit));
	        const columnCount = Math.ceil(width / columnWidth); 

	        const headers = [];
	        let headerTime = from.clone();

	        for(let i=0; i< columnCount; i++){
	            headers.push({width: columnWidth, label: headerTime.format(header.format)});
	            headerTime.add(1, header.unit);
	        }

	        this.set({headers});
	    }
	};

	function oncreate$3() {
	    this.initHeaders();
	}
	function onupdate$2({ changed, current, previous }){
	    if(previous != null){
	        this.initHeaders();
	    }
	}
	const file$3 = "src\\ColumnHeader.html";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.header = list[i];
		return child_ctx;
	}

	function create_main_fragment$3(component, ctx) {
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
				div.className = "column-header-row svelte-17yyvyj";
				setStyle(div, "width", "" + ctx.width + "px");
				addLoc(div, file$3, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div, null);
				}

				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.headers) {
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

	// (2:4) {#each headers as header}
	function create_each_block(component, ctx) {
		var div, text0_value = ctx.header.label || 'N/A', text0, text1;

		return {
			c: function create() {
				div = createElement("div");
				text0 = createText(text0_value);
				text1 = createText("\r\n        ");
				div.className = "column-header svelte-17yyvyj";
				setStyle(div, "width", "" + ctx.header.width + "px");
				addLoc(div, file$3, 2, 8, 96);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, text0);
				append(div, text1);
			},

			p: function update(changed, ctx) {
				if ((changed.headers) && text0_value !== (text0_value = ctx.header.label || 'N/A')) {
					setData(text0, text0_value);
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

	function ColumnHeader(options) {
		this._debugName = '<ColumnHeader>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign(data$2(), options.data);
		if (!('width' in this._state)) console.warn("<ColumnHeader> was created without expected data property 'width'");
		if (!('headers' in this._state)) console.warn("<ColumnHeader> was created without expected data property 'headers'");
		this._intro = !!options.intro;
		this._handlers.update = [onupdate$2];

		this._fragment = create_main_fragment$3(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$3.call(this);
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

	assign(ColumnHeader.prototype, protoDev);
	assign(ColumnHeader.prototype, methods$2);

	ColumnHeader.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

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

			this._dependents
				.filter(dependent => {
					const componentState = {};
					let dirty = false;

					for (let j = 0; j < dependent.props.length; j += 1) {
						const prop = dependent.props[j];
						if (prop in changed) {
							componentState['$' + prop] = this._state[prop];
							dirty = true;
						}
					}

					if (dirty) {
						dependent.component._stage(componentState);
						return true;
					}
				})
				.forEach(dependent => {
					dependent.component.set({});
				});

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
				if (this._computed[key]) throw new Error(`'${key}' is a read-only computed property`);
				if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
			}
			if (!dirty) return;

			this._set(newState, changed);
		}
	});

	class SelectionManager {
	    constructor(store) {
	        this.store = store;
	        this.store.set({ selection: [] });
	    }
	    selectSingle(item) {
	        this.store.set({ selection: [item] });
	    }
	    toggleSelection(item) {
	        const { selection } = this.store.get();
	        const index = selection.indexOf(item);
	        if (index !== -1) {
	            selection.splice(index, 1);
	        }
	        else {
	            selection.push(item);
	        }
	        this.store.set({ selection });
	    }
	    clearSelection() {
	        this.store.set({ selection: [] });
	    }
	}
	//# sourceMappingURL=selectionManager.js.map

	class GanttUtils {
	    constructor(gantt) {
	        this.gantt = gantt;
	    }
	    /**
	     * Returns position of date on a line if from and to represent length of width
	     * @param {*} date
	     */
	    getPositionByDate(date) {
	        if (!date) {
	            return undefined;
	        }
	        const { from, to, width } = this.gantt.store.get();
	        let durationTo = date.diff(from, 'milliseconds');
	        let durationToEnd = to.diff(from, 'milliseconds');
	        return durationTo / durationToEnd * width;
	    }
	    getDateByPosition(x) {
	        const { from, to, width } = this.gantt.store.get();
	        let durationTo = x / width * to.diff(from, 'milliseconds');
	        let dateAtPosition = from.clone().add(durationTo, 'milliseconds');
	        return dateAtPosition;
	    }
	    /**
	     *
	     * @param {Moment} date - Date
	     * @returns {Moment} rounded date passed as parameter
	     */
	    roundTo(date) {
	        const { magnetUnit, magnetOffset } = this.gantt.store.get();
	        let value = date.get(magnetUnit);
	        value = Math.round(value / magnetOffset);
	        date.set(magnetUnit, value * magnetOffset);
	        //round all smaller units to 0
	        const units = ['millisecond', 'second', 'minute', 'hour', 'date', 'month', 'year'];
	        const indexOf = units.indexOf(magnetUnit);
	        for (let i = 0; i < indexOf; i++) {
	            date.set(units[i], 0);
	        }
	        return date;
	    }
	    /**
	     * Returns ID of element
	     * @param value
	     * @param compareFn
	     */
	    binarySearch(sortedArray, value, compareFn) {
	    }
	}
	//# sourceMappingURL=utils.js.map

	class GanttApi {
	    constructor(gantt) {
	        this.gantt = gantt;
	        this.listeners = [];
	        this.listenersMap = {};
	    }
	    registerEvent(featureName, eventName) {
	        if (!this[featureName]) {
	            this[featureName] = {};
	        }
	        const feature = this[featureName];
	        if (!feature.on) {
	            feature.on = {};
	            feature.raise = {};
	        }
	        let eventId = 'on:' + featureName + ':' + eventName;
	        feature.raise[eventName] = (...params) => {
	            //todo add svelte? event listeners, looping isnt effective unless rarely used
	            this.listeners.forEach(listener => {
	                if (listener.eventId === eventId) {
	                    listener.handler(params);
	                }
	            });
	        };
	        // Creating on event method featureName.oneventName
	        feature.on[eventName] = (handler) => {
	            // track our listener so we can turn off and on
	            let listener = {
	                handler: handler,
	                eventId: eventId
	            };
	            this.listenersMap[eventId] = listener;
	            this.listeners.push(listener);
	            const removeListener = () => {
	                const index = this.listeners.indexOf(listener);
	                this.listeners.splice(index, 1);
	            };
	            return removeListener;
	        };
	    }
	}
	//# sourceMappingURL=api.js.map

	/* src\TimeRange.html generated by Svelte v2.16.0 */

	function data$3(){
	    return {
	        timeRange: null
	    }
	}
	function oncreate$4() {
	    const { timeRange } = this.get();
	    timeRange.component = this;
	}
	function ondestroy$2(){
	    const { timeRange } = this.get();
	    timeRange.component = null;
	}
	const file$4 = "src\\TimeRange.html";

	function create_main_fragment$4(component, ctx) {
		var div1, div0, text_value = ctx.timeRange.model.label, text, current;

		return {
			c: function create() {
				div1 = createElement("div");
				div0 = createElement("div");
				text = createText(text_value);
				div0.className = "s-g-time-range-label svelte-jnqdw2";
				addLoc(div0, file$4, 1, 4, 126);
				div1.className = "s-g-time-range svelte-jnqdw2";
				setStyle(div1, "width", "" + ctx.timeRange.width + "px");
				setStyle(div1, "left", "" + ctx.timeRange.left + "px");
				toggleClass(div1, "moving", ctx.timeRange.resizing);
				addLoc(div1, file$4, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div0, text);
				current = true;
			},

			p: function update(changed, ctx) {
				if ((changed.timeRange) && text_value !== (text_value = ctx.timeRange.model.label)) {
					setData(text, text_value);
				}

				if (changed.timeRange) {
					setStyle(div1, "width", "" + ctx.timeRange.width + "px");
					setStyle(div1, "left", "" + ctx.timeRange.left + "px");
					toggleClass(div1, "moving", ctx.timeRange.resizing);
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div1);
				}
			}
		};
	}

	function TimeRange(options) {
		this._debugName = '<TimeRange>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign(data$3(), options.data);
		if (!('timeRange' in this._state)) console.warn("<TimeRange> was created without expected data property 'timeRange'");
		this._intro = !!options.intro;

		this._handlers.destroy = [ondestroy$2];

		this._fragment = create_main_fragment$4(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$4.call(this);
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

	assign(TimeRange.prototype, protoDev);

	TimeRange.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\TimeRangeHeader.html generated by Svelte v2.16.0 */

	function data$4(){
	    return {
	        timeRange: null
	    }
	}
	function oncreate$5() {
	    const { timeRange } = this.get();
	    timeRange.handle = this;
	}
	function drag$1(node) {
	    const { rowContainerElement, ganttUtils, gantt, resizeHandleWidth } = this.store.get();
	    const windowElement = window;

	    let mouseStartPosX;
	    let mouseStartRight;
	    
	    const { timeRange } = this.get();
	    
	    const onmousedown = (event) => {
	        event.stopPropagation();
	        event.preventDefault();
	        
	        {
	            mouseStartPosX = DOMUtils.getRelativePos(rowContainerElement, event).x - timeRange.left;
	            mouseStartRight = timeRange.left + timeRange.width;

	            if(mouseStartPosX < resizeHandleWidth) {
	                timeRange.resizing = true;
	                timeRange.direction = 'left';
	            }
	            else if(mouseStartPosX > timeRange.width - resizeHandleWidth) {
	                timeRange.resizing = true;
	                timeRange.direction = 'right';
	            }
	            else {
	                timeRange.dragging = true;
	            }

	            windowElement.addEventListener('mousemove', onmousemove, false);
	            DOMUtils.addEventListenerOnce(windowElement, 'mouseup', onmouseup);
	        }
	    };
	    
	    const onmousemove = (event) => {
	        event.preventDefault();
	        if(timeRange.resizing) {
	            const mousePos = DOMUtils.getRelativePos(rowContainerElement, event);
	            
	            if(timeRange.direction === 'left') { 
	                if(mousePos.x > timeRange.left + timeRange.width) {
	                    timeRange.left = mouseStartRight;
	                    timeRange.width = timeRange.left - mousePos.x;
	                    timeRange.direction = 'right';
	                    mouseStartRight = timeRange.left + timeRange.width;
	                }
	                else{
	                    timeRange.left = mousePos.x;
	                    timeRange.width = mouseStartRight - mousePos.x;
	                }
	            }
	            else if(timeRange.direction === 'right') {//resize desno
	                if(mousePos.x <= timeRange.left) {
	                    timeRange.width = timeRange.left - mousePos.x;
	                    timeRange.left = mousePos.x;
	                    timeRange.direction = 'left';
	                    mouseStartRight = timeRange.left + timeRange.width;
	                }
	                else {
	                    timeRange.width = mousePos.x - timeRange.left;
	                }
	            }
	        }

	        if(timeRange.resizing){
	            timeRange.updateView();
	        }
	    };

	    const onmouseup = (event) => {
	        timeRange.updateDate();
	        timeRange.updatePosition();
	        
	        timeRange.dragging = false;
	        timeRange.resizing = false;
	        timeRange.direction = null;
	        timeRange.updateView();

	        windowElement.removeEventListener('mousemove', onmousemove, false);
	    };

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
	const file$5 = "src\\TimeRangeHeader.html";

	function create_main_fragment$5(component, ctx) {
		var div2, div0, drag_action, text, div1, drag_action_1, current;

		return {
			c: function create() {
				div2 = createElement("div");
				div0 = createElement("div");
				text = createText("\r\n    ");
				div1 = createElement("div");
				div0.className = "s-g-time-range-handle-left svelte-yev7ut";
				addLoc(div0, file$5, 1, 4, 100);
				div1.className = "s-g-time-range-handle-right svelte-yev7ut";
				addLoc(div1, file$5, 2, 4, 161);
				div2.className = "s-g-time-range-control svelte-yev7ut";
				setStyle(div2, "width", "" + ctx.timeRange.width + "px");
				setStyle(div2, "left", "" + ctx.timeRange.left + "px");
				addLoc(div2, file$5, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div2, anchor);
				append(div2, div0);
				drag_action = drag$1.call(component, div0) || {};
				append(div2, text);
				append(div2, div1);
				drag_action_1 = drag$1.call(component, div1) || {};
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.timeRange) {
					setStyle(div2, "width", "" + ctx.timeRange.width + "px");
					setStyle(div2, "left", "" + ctx.timeRange.left + "px");
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: run,

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div2);
				}

				if (drag_action && typeof drag_action.destroy === 'function') drag_action.destroy.call(component);
				if (drag_action_1 && typeof drag_action_1.destroy === 'function') drag_action_1.destroy.call(component);
			}
		};
	}

	function TimeRangeHeader(options) {
		this._debugName = '<TimeRangeHeader>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}

		init(this, options);
		this._state = assign(data$4(), options.data);
		if (!('timeRange' in this._state)) console.warn("<TimeRangeHeader> was created without expected data property 'timeRange'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$5(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$5.call(this);
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

	assign(TimeRangeHeader.prototype, protoDev);

	TimeRangeHeader.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	class SvelteTask {
	    constructor(gantt, task) {
	        // defaults, todo object.assign these
	        // id of task, every task needs to have a unique one
	        //task.id = task.id || undefined;
	        // completion %, indicated on task
	        task.amountDone = task.amountDone || 0;
	        // css classes
	        task.classes = task.classes || '';
	        // datetime task starts on, currently moment-js object
	        task.from = task.from || null;
	        // datetime task ends on, currently moment-js object
	        task.to = task.to || null;
	        // label of task
	        task.label = task.label || undefined;
	        // html content of task, will override label
	        task.html = task.html || undefined;
	        // show button bar
	        task.showButton = task.showButton || false;
	        // button classes, useful for fontawesome icons
	        task.buttonClasses = task.buttonClasses || '';
	        // html content of button
	        task.buttonHtml = task.buttonHtml || '';
	        // enable dragging of task
	        task.enableDragging = task.enableDragging === undefined ? true : task.enableDragging;
	        this.gantt = gantt;
	        this.model = task;
	        this.row = gantt.get()._rowCache[task.resourceId];
	        this.row.addTask(this);
	        //height, translateX, translateY, resourceId
	        this.height = this.getHeight();
	        this.updatePosition();
	        // TODO extract to update vertical position
	        this.posY = this.getPosY();
	    }
	    getHeight() {
	        return this.row.height;
	    }
	    getPosY() {
	        return this.row.posY;
	    }
	    updatePosition() {
	        const left = this.gantt.utils.getPositionByDate(this.model.from);
	        const right = this.gantt.utils.getPositionByDate(this.model.to);
	        this.left = left;
	        this.width = right - left;
	        if (!this.dragging && !this.resizing) {
	            this.posX = Math.ceil(this.left);
	            this.widthT = Math.ceil(this.width);
	        }
	    }
	    updateDate() {
	        const from = this.gantt.utils.getDateByPosition(this.left);
	        const to = this.gantt.utils.getDateByPosition(this.left + this.width);
	        const roundedFrom = this.gantt.utils.roundTo(from);
	        const roundedTo = this.gantt.utils.roundTo(to);
	        if (!roundedFrom.isSame(roundedTo)) {
	            this.model.from = roundedFrom;
	            this.model.to = roundedTo;
	        }
	    }
	    overlaps(other) {
	        return !(this.left + this.width <= other.left || this.left >= other.left + other.width);
	    }
	    updateView() {
	        if (this.component) {
	            this.component.set({ task: this });
	        }
	    }
	}
	//# sourceMappingURL=task.js.map

	class SvelteRow {
	    constructor(gantt, row) {
	        // defaults
	        // id of task, every task needs to have a unique one
	        //row.id = row.id || undefined;
	        // css classes
	        row.classes = row.classes || '';
	        // html content of row
	        row.contentHtml = row.contentHtml || undefined;
	        // enable dragging of tasks to and from this row 
	        row.enableDragging = row.enableDragging === undefined ? true : row.enableDragging;
	        //
	        this.height = row.height || gantt.store.get().rowHeight;
	        // translateY
	        this.gantt = gantt;
	        this.model = row;
	        this.tasks = [];
	    }
	    addTask(task) {
	        //task.model.resourceId = this.model.id;
	        task.row = this;
	        this.tasks.push(task);
	    }
	    moveTask(task) {
	        //task.row.removeTask(task);
	        this.addTask(task);
	    }
	    removeTask(task) {
	        //task.model.resourceId
	        //task.row = this;
	        const index = this.tasks.indexOf(task);
	        if (index !== -1) {
	            this.tasks.splice(index, 1);
	        }
	    }
	    updateView() {
	        if (this.component) {
	            this.component.set({ row: this });
	        }
	    }
	}
	//# sourceMappingURL=row.js.map

	class SvelteTimeRange {
	    constructor(gantt, timeRange) {
	        this.gantt = gantt;
	        this.model = timeRange;
	        this.updatePosition();
	    }
	    updatePosition() {
	        const left = this.gantt.utils.getPositionByDate(this.model.from);
	        const right = this.gantt.utils.getPositionByDate(this.model.to);
	        this.left = left;
	        this.width = right - left;
	    }
	    updateDate() {
	        const from = this.gantt.utils.getDateByPosition(this.left);
	        const to = this.gantt.utils.getDateByPosition(this.left + this.width);
	        const roundedFrom = this.gantt.utils.roundTo(from);
	        const roundedTo = this.gantt.utils.roundTo(to);
	        if (!roundedFrom.isSame(roundedTo)) {
	            this.model.from = roundedFrom;
	            this.model.to = roundedTo;
	        }
	    }
	    overlaps(other) {
	        return !(this.left + this.width <= other.left || this.left >= other.left + other.width);
	    }
	    updateView() {
	        if (this.component) {
	            this.component.set({ timeRange: this });
	        }
	        if (this.handle) {
	            this.handle.set({ timeRange: this });
	        }
	    }
	}
	//# sourceMappingURL=timeRange.js.map

	/*! *****************************************************************************
	Copyright (c) Microsoft Corporation. All rights reserved.
	Licensed under the Apache License, Version 2.0 (the "License"); you may not use
	this file except in compliance with the License. You may obtain a copy of the
	License at http://www.apache.org/licenses/LICENSE-2.0

	THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
	KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
	WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
	MERCHANTABLITY OR NON-INFRINGEMENT.

	See the Apache Version 2.0 License for specific language governing permissions
	and limitations under the License.
	***************************************************************************** */

	function __rest(s, e) {
	    var t = {};
	    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
	        t[p] = s[p];
	    if (s != null && typeof Object.getOwnPropertySymbols === "function")
	        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
	            t[p[i]] = s[p[i]];
	    return t;
	}

	class GanttStore extends Store {
	    constructor() {
	        super({
	            ids: [],
	            entities: []
	        }, { immutable: true });
	        this.compute('selectAll', ['ids', 'entities'], (ids, entities) => {
	            return ids.map(id => entities[id]);
	        });
	    }
	    add(entity) {
	        const { ids, entities } = this.get();
	        this.set({
	            ids: [...ids, entity.id],
	            entities: Object.assign({}, entities, { [entity.id]: entity })
	        });
	    }
	    update(entity) {
	        const { entities } = this.get();
	        this.set({
	            entities: Object.assign({}, entities, { [entity.id]: entity })
	        });
	    }
	    remove(id) {
	        const { ids, entities } = this.get();
	        const _a = id, entity = entities[_a], newEntities = __rest(entities, [typeof _a === "symbol" ? _a : _a + ""]);
	        this.set({
	            ids: ids.filter(i => i === id),
	            entities: newEntities
	        });
	    }
	}

	/* src\Gantt.html generated by Svelte v2.16.0 */



	window.test = new GanttStore();

	let SvelteGantt;

	function rowContainerHeight({$rows, $rowHeight}) {
		return $rows.length * $rowHeight;
	}

	function startIndex({scrollTop, $rowHeight}) {
		return Math.floor(scrollTop / $rowHeight);
	}

	function endIndex({startIndex, viewportHeight, $rowHeight, $rows}) {
		return Math.min(startIndex + Math.ceil(viewportHeight / $rowHeight ), $rows.length - 1);
	}

	function paddingTop({startIndex, $rowHeight}) {
		return startIndex * $rowHeight;
	}

	function paddingBottom({$rows, endIndex, $rowHeight}) {
		return ($rows.length - endIndex - 1) * $rowHeight;
	}

	function visibleRows({$rows, startIndex, endIndex}) {
		return $rows.slice(startIndex, endIndex + 1);
	}

	function visibleTasks({$_taskCache, visibleRows}) {
	    const visibleTasks = [];
	    visibleRows.forEach(row => {
	        Array.prototype.push.apply(visibleTasks, row.tasks);
	    });
	    return visibleTasks;
	}

	function data$5() {
	    return {
	        columns: [],
	        scrollables: [],
	        visibleRows: [],
	        visibleTasks: [],
	        _ganttBodyModules: [],
	        _ganttTableModules: [],
	        _modules: [],

	        _allTasks: [],
	        rows: [],

	        paddingTop: 0,
	        paddingBottom: 0,
	        scrollTop: 0
	    }
	}
	var methods$3 = {
	    onWindowResizeEventHandler(event){
	        this.recalculateGanttDimensions();
	        if(this.store.get().stretchTimelineWidthToFit){
	            this.initColumns();
	            this.refreshTasks();
	        }
	    },
	    recalculateGanttDimensions() {
	        const parentWidth = this.refs.ganttElement.clientWidth;
	        const parentHeight = this.refs.ganttElement.clientHeight;
	        
	        this.store.set({parentWidth});
	        
	        const tableWidth = this.store.get().tableWidth || 0;

	        const height = parentHeight - this.refs.sideContainer.clientHeight;

	        // -17 only if side scrollbar shows (rowContainerHeight > height)
	        const { rowContainerHeight } = this.get();
	        const headerWidth = rowContainerHeight > height ? parentWidth - tableWidth - 17 :  parentWidth - tableWidth;

	        this.store.set({
	            height, headerWidth
	        });

	        if(this.store.get().stretchTimelineWidthToFit){
	            this.store.set({width: headerWidth});
	        }
	    },
	    initRows(rowsData){
	        const rows = [];
	        const _rowCache = {};
	        let y = 0;
	        for(let i=0; i < rowsData.length; i++){
	            const currentRow = rowsData[i];
	            const row = new SvelteRow(this, currentRow);
	            rows.push(row);
	            _rowCache[row.model.id] = row;
	            row.posY = y;
	            y += row.height;
	        }
	        this.set({
	            _rowCache,
	            rows
	        });
	        this.store.set({rows});
	    },
	    initTimeRanges(timeRangeData){
	        const _timeRanges = [];
	        const _timeRangeCache = [];

	        for(let i = 0; i < timeRangeData.length; i++){
	            const currentTimeRange = timeRangeData[i];
	            const timeRange = new SvelteTimeRange(this, currentTimeRange);
	            _timeRanges.push(timeRange);
	            _timeRangeCache[currentTimeRange.id] = timeRange;
	        }

	        this.store.set({_timeRanges, _timeRangeCache});
	    },
	    initTasks(taskData){
	        const _allTasks = [];
	        const tasks = _allTasks;
	        const _taskCache = {};

	        for(let i=0; i < taskData.length; i++){
	            const currentTask = taskData[i];
	            const task = new SvelteTask(this, currentTask);
	            _allTasks.push(task);
	            _taskCache[task.model.id] = task;
	        }

	        this.set({
	            _allTasks,
	            _taskCache,
	            tasks,
	        });
	        this.store.set({tasks, _taskCache});
	        this.selectionManager.clearSelection();
	    },
	    initGantt(){
	        if(!this.store.get().gantt){
	            this.store.set({
	                bodyElement: this.refs.mainContainer, 
	                rowContainerElement: this.refs.rowContainer,
	                gantt: this
	            });
	            
	            this.selectionManager = new SelectionManager(this.store);
	            this.utils = new GanttUtils(this);
	            this.api = new GanttApi(this);

	            this.api.registerEvent('tasks', 'move');
	            this.api.registerEvent('tasks', 'select');
	            this.api.registerEvent('tasks', 'switchRow');
	            this.api.registerEvent('tasks', 'moveEnd');
	            this.api.registerEvent('tasks', 'changed');

	            this.row = SvelteRow;
	            this.task = SvelteTask;
	        }
	    },
	    initModule(module){
	        const moduleOptions = Object.assign({
	            _gantt: this,
	            _options: this.get()
	        }, {});//merge with module specific data, modules[module.constructor.key]);
	        module.initModule(moduleOptions);
	        
	        const {_modules} = this.get();
	        _modules.push(module);
	    },
	    broadcastModules(event, data) {
	        const {_modules} = this.get();
	        _modules.forEach((module) => {
	            if (typeof module[event] === 'function') {
	                module[event](data);
	            }
	        });
	    },
	    updateVisibleRows(){
	        // const { scrollTop, viewportHeight } = this.get();
	        // const { rows, rowHeight } = this.store.get();



	        // const visibleRows = rows.slice(startIndex, endIndex + 1);

	        // const visibleTasks = []
	        // if(this.includeInRender || visibleTasks.indexOf(this.includeInRender) !== -1){
	        //     visibleTasks.push(this.includeInRender);
	        // }

	        // this.set({ visibleRows, paddingTop, paddingBottom, visibleTasks });
	        // this.store.set({ visibleRows, paddingTop, paddingBottom, visibleTasks });
	    },
	    updateVisibleEntities(){
	        const { _timeRanges } = this.store.get();
	        _timeRanges.forEach(timeRange => {
	            timeRange.updatePosition();
	            timeRange.updateView();
	        });
	    },
	    updateViewport(){
	        const {scrollTop, clientHeight} = this.refs.mainContainer;
	        this.store.set({scrollTop, viewportHeight: clientHeight});
	        this.set({scrollTop, viewportHeight: clientHeight});
	        this.updateVisibleRows();
	        this.broadcastModules('updateVisible', {scrollAmount: scrollTop, viewportHeight: clientHeight});
	    },
	    initColumns() {
	        const {columnOffset, columnUnit, from, width, headers} = this.store.get();
	        const columnWidth = this.utils.getPositionByDate(from.clone().add(columnOffset, columnUnit));
	        const columnCount = Math.ceil((width) / columnWidth); 

	        const columns = [];
	        const columnFrom = from.clone();
	        for(let i = 0; i < columnCount; i++){
	            columns.push({width: columnWidth, from: columnFrom.clone(), left: this.utils.getPositionByDate(columnFrom)});
	            columnFrom.add(columnOffset, columnUnit);
	        }
	        
	        this.set({ columns });
	        this.store.set({ headers });
	    },
	    refreshTasks(){
	        const { _allTasks } = this.get();
	        _allTasks.forEach(task => {
	            task.updatePosition();
	            task.updateView();
	        });
	        this.updateVisibleEntities();
	    },
	    updateView(options){ // {from, to, headers, width}
	        this.store.set(options);
	        if(this.store.get().stretchTimelineWidthToFit){
	            this.recalculateGanttDimensions();
	        }
	        else{
	            this.initColumns();
	        }

	        this.refreshTasks();

	        this.broadcastModules('updateView', options);//{ from, to, headers });
	    },
	    selectTask(id) {
	        const { _taskCache } = this.get();
	        const task = _taskCache[id];
	        if(task) {
	            this.selectionManager.selectSingle(task);
	            task.updateView();
	        }
	    }
	};

	function oncreate$6(){
	    const {rows, initialRows, initialTasks, initialDependencies} = this.get();

	    this.initGantt();
	    
	    this.initRows(initialRows);
	    window.addEventListener('resize', this.onWindowResizeEventHandler.bind(this)); // or this.onW... .bind(this);
	    this.recalculateGanttDimensions();
	    this.initColumns();

	    this.initTasks(initialTasks);
	    
	    this.broadcastModules('onGanttCreated');
	    this.updateViewport();
	}
	function ondestroy$3(){
	    //remove event listener
	    window.removeEventListener('resize', this.onWindowResizeEventHandler);
	}
	function onstate(){

	}
	function setup$1(component){
	    SvelteGantt = component;
	    SvelteGantt.defaults = {
	        // datetime timeline starts on, currently moment-js object
	        from: null,
	        // datetime timeline ends on, currently moment-js object
	        to: null,
	        // width of main gantt area in px
	        width: 800, //rename to timelinewidth
	        // should timeline stretch width to fit, true overrides timelineWidth
	        stretchTimelineWidthToFit: false,
	        // height of main gantt area in px
	        height: 400,
	        // minimum unit of time task date values will round to 
	        magnetUnit: 'minute',
	        // amount of units task date values will round to
	        magnetOffset: 15,
	        // duration unit of columns
	        columnUnit: 'minute',
	        // duration width of column
	        columnOffset: 15,
	        // list of headers used for main gantt area
	        // unit: time unit used, e.g. day will create a cell in the header for each day in the timeline
	        // format: datetime format used for header cell label
	        headers: [{unit: 'day', format: 'DD.MM.YYYY'}, {unit: 'hour', format: 'HH'}],
	        // height of a single row in px
	        rowHeight: 52,
	        // modules used in gantt
	        modules: [],
	        // enables right click context menu
	        enableContextMenu: false,
	        // sets top level gantt class which can be used for styling
	        classes: '',
	        // width of handle for resizing task
	        resizeHandleWidth: 10,
	        // handler of button clicks
	        onTaskButtonClick: null, // e.g. (task) => {debugger},
	        // task content factory function
	        taskContent: null, // e.g. (task) => '<div>Custom task content</div>'

	        rows: [],
	        tasks: [],
	        _timeRanges: []
	    };

	    SvelteGantt.create = function(target, data, options) {

	        // bind gantt modules
	        const ganttModules = {
	            ganttBodyModules: [],
	            ganttTableModules: [],
	            defaults: {}
	        };

	        if(options.modules) {
	            options.modules.forEach((module) => {
	                module.bindToGantt(ganttModules);
	            });
	        }

	        // initialize gantt state
	        const newData = {
	            initialRows: data.rows,
	            initialTasks: data.tasks,
	            initialDependencies: data.dependencies,
	            _ganttBodyModules: ganttModules.ganttBodyModules,
	            _ganttTableModules: ganttModules.ganttTableModules
	        };

	        // initialize all the gantt options
	        const ganttOptions = Object.assign({}, SvelteGantt.defaults, ganttModules.defaults, options);
	        
	        const store = new Store(ganttOptions);

	        // store.compute(
	        //     'paddingTop',
	        //     ['startIndex', 'rowHeight'],
	        //     (startIndex, rowHeight) => startIndex * rowHeight
	        // );

	        // store.compute(
	        //     'paddingBottom',
	        //     ['rows', 'endIndex', 'rowHeight'],
	        //     (rows, endIndex, rowHeight) => (rows.length - endIndex - 1) * rowHeight
	        // );

	        // store.compute(
	        //     'startIndex',
	        //     ['scrollTop', 'rowHeight'],
	        //     (scrollTop, rowHeight) => Math.floor(scrollTop / rowHeight)
	        // );
	        
	        // store.compute(
	        //     'endIndex',
	        //     ['startIndex', 'viewportHeight', 'rowHeight', 'rows'],
	        //     (startIndex, viewportHeight, rowHeight, rows) => Math.min(startIndex + Math.ceil(viewportHeight / rowHeight ), rows.length - 1)
	        // );

	        return new SvelteGantt({
	            target,
	            data: newData,
	            store
	        });
	    };
	}
	function scrollable(node){
	    const { scrollables } = this.get();
	    const self = this;

	    function onscroll(event) {
	        const scrollAmount = node.scrollTop; 
	        for(let i=0; i< scrollables.length; i++){
	            const scrollable = scrollables[i];
	            if(scrollable.orientation === 'horizontal') {
	                scrollable.node.scrollLeft = node.scrollLeft;
	            }
	            else {
	                scrollable.node.scrollTop = scrollAmount;
	            }
	        }
	        //TODO: only for vertical scroll
	        self.set({scrollTop: scrollAmount, clientHeight: node.clientHeight});
	        self.store.set({scrollTop: scrollAmount, clientHeight: node.clientHeight});
	        self.updateVisibleRows();

	        self.broadcastModules('updateVisible', {scrollAmount, viewportHeight: node.clientHeight});
	    }

	    node.addEventListener('scroll', onscroll);
	    return {
						destroy() {
							node.removeEventListener('scroll', onscroll, false);
						}
	    }
	}
	function horizontalScrollListener(node){
	    const { scrollables } = this.get();
	    scrollables.push({node, orientation: 'horizontal'});
	}
	const file$6 = "src\\Gantt.html";

	function get_each7_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.module = list[i];
		return child_ctx;
	}

	function get_each6_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.task = list[i];
		child_ctx.each6_value = list;
		child_ctx.task_index = i;
		return child_ctx;
	}

	function get_each5_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.timeRange = list[i];
		return child_ctx;
	}

	function get_each4_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.row = list[i];
		return child_ctx;
	}

	function get_each3_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.column = list[i];
		return child_ctx;
	}

	function get_each2_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.timeRange = list[i];
		return child_ctx;
	}

	function get_each1_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.header = list[i];
		return child_ctx;
	}

	function get_each0_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.module = list[i];
		return child_ctx;
	}

	function create_main_fragment$6(component, ctx) {
		var div9, each0_blocks_1 = [], each0_lookup = blankObject(), text0, div2, div1, div0, text1, each2_blocks_1 = [], each2_lookup = blankObject(), horizontalScrollListener_action, text2, div8, div7, div3, text3, div5, div4, each4_blocks_1 = [], each4_lookup = blankObject(), text4, div6, each5_blocks_1 = [], each5_lookup = blankObject(), text5, each6_blocks_1 = [], each6_lookup = blankObject(), text6, each7_blocks_1 = [], each7_lookup = blankObject(), scrollable_action, div9_class_value, current;

		var each0_value = ctx._ganttTableModules;

		const get_key = ctx => ctx.module.key;

		for (var i = 0; i < each0_value.length; i += 1) {
			let child_ctx = get_each0_context(ctx, each0_value, i);
			let key = get_key(child_ctx);
			each0_blocks_1[i] = each0_lookup[key] = create_each_block_7(component, key, child_ctx);
		}

		var each1_value = ctx.$headers;

		var each1_blocks = [];

		for (var i = 0; i < each1_value.length; i += 1) {
			each1_blocks[i] = create_each_block_6(component, get_each1_context(ctx, each1_value, i));
		}

		function outroBlock(i, detach, fn) {
			if (each1_blocks[i]) {
				each1_blocks[i].o(() => {
					if (detach) {
						each1_blocks[i].d(detach);
						each1_blocks[i] = null;
					}
					if (fn) fn();
				});
			}
		}

		var each2_value = ctx.$_timeRanges;

		const get_key_1 = ctx => ctx.timeRange.id;

		for (var i = 0; i < each2_value.length; i += 1) {
			let child_ctx = get_each2_context(ctx, each2_value, i);
			let key = get_key_1(child_ctx);
			each2_blocks_1[i] = each2_lookup[key] = create_each_block_5(component, key, child_ctx);
		}

		var each3_value = ctx.columns;

		var each3_blocks = [];

		for (var i = 0; i < each3_value.length; i += 1) {
			each3_blocks[i] = create_each_block_4(component, get_each3_context(ctx, each3_value, i));
		}

		function outroBlock_1(i, detach, fn) {
			if (each3_blocks[i]) {
				each3_blocks[i].o(() => {
					if (detach) {
						each3_blocks[i].d(detach);
						each3_blocks[i] = null;
					}
					if (fn) fn();
				});
			}
		}

		var each4_value = ctx.visibleRows;

		const get_key_2 = ctx => ctx.row.model.id;

		for (var i = 0; i < each4_value.length; i += 1) {
			let child_ctx = get_each4_context(ctx, each4_value, i);
			let key = get_key_2(child_ctx);
			each4_blocks_1[i] = each4_lookup[key] = create_each_block_3(component, key, child_ctx);
		}

		var each5_value = ctx.$_timeRanges;

		const get_key_3 = ctx => ctx.timeRange.id;

		for (var i = 0; i < each5_value.length; i += 1) {
			let child_ctx = get_each5_context(ctx, each5_value, i);
			let key = get_key_3(child_ctx);
			each5_blocks_1[i] = each5_lookup[key] = create_each_block_2(component, key, child_ctx);
		}

		var each6_value = ctx.visibleTasks;

		const get_key_4 = ctx => ctx.task.model.id;

		for (var i = 0; i < each6_value.length; i += 1) {
			let child_ctx = get_each6_context(ctx, each6_value, i);
			let key = get_key_4(child_ctx);
			each6_blocks_1[i] = each6_lookup[key] = create_each_block_1(component, key, child_ctx);
		}

		var each7_value = ctx._ganttBodyModules;

		const get_key_5 = ctx => ctx.module.key;

		for (var i = 0; i < each7_value.length; i += 1) {
			let child_ctx = get_each7_context(ctx, each7_value, i);
			let key = get_key_5(child_ctx);
			each7_blocks_1[i] = each7_lookup[key] = create_each_block$1(component, key, child_ctx);
		}

		return {
			c: function create() {
				div9 = createElement("div");

				for (i = 0; i < each0_blocks_1.length; i += 1) each0_blocks_1[i].c();

				text0 = createText("\r\n\r\n    ");
				div2 = createElement("div");
				div1 = createElement("div");
				div0 = createElement("div");

				for (var i = 0; i < each1_blocks.length; i += 1) {
					each1_blocks[i].c();
				}

				text1 = createText("\r\n                ");

				for (i = 0; i < each2_blocks_1.length; i += 1) each2_blocks_1[i].c();

				text2 = createText("\r\n\r\n    ");
				div8 = createElement("div");
				div7 = createElement("div");
				div3 = createElement("div");

				for (var i = 0; i < each3_blocks.length; i += 1) {
					each3_blocks[i].c();
				}

				text3 = createText("\r\n            ");
				div5 = createElement("div");
				div4 = createElement("div");

				for (i = 0; i < each4_blocks_1.length; i += 1) each4_blocks_1[i].c();

				text4 = createText("\r\n                ");
				div6 = createElement("div");

				for (i = 0; i < each5_blocks_1.length; i += 1) each5_blocks_1[i].c();

				text5 = createText("\r\n\r\n                    ");

				for (i = 0; i < each6_blocks_1.length; i += 1) each6_blocks_1[i].c();

				text6 = createText("\r\n            ");

				for (i = 0; i < each7_blocks_1.length; i += 1) each7_blocks_1[i].c();
				div0.className = "header-container";
				setStyle(div0, "width", "" + ctx.$width + "px");
				addLoc(div0, file$6, 7, 12, 435);
				div1.className = "header-intermezzo svelte-5w9ayr";
				setStyle(div1, "width", "" + ctx.$headerWidth + "px");
				addLoc(div1, file$6, 6, 8, 328);
				div2.className = "main-header-container svelte-5w9ayr";
				addLoc(div2, file$6, 5, 4, 265);
				div3.className = "column-container svelte-5w9ayr";
				addLoc(div3, file$6, 20, 12, 979);
				setStyle(div4, "transform", "translateY(" + ctx.paddingTop + "px)");
				addLoc(div4, file$6, 28, 16, 1359);
				div5.className = "row-container svelte-5w9ayr";
				setStyle(div5, "height", "" + ctx.rowContainerHeight + "px");
				addLoc(div5, file$6, 25, 12, 1154);
				div6.className = "s-g-foreground svelte-5w9ayr";
				addLoc(div6, file$6, 35, 16, 1660);
				div7.className = "content svelte-5w9ayr";
				setStyle(div7, "width", "" + ctx.$width + "px");
				addLoc(div7, file$6, 19, 8, 919);
				div8.className = "main-container svelte-5w9ayr";
				setStyle(div8, "height", "" + ctx.$height + "px");
				addLoc(div8, file$6, 18, 4, 821);
				div9.className = div9_class_value = "gantt " + ctx.$classes + " svelte-5w9ayr";
				addLoc(div9, file$6, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div9, anchor);

				for (i = 0; i < each0_blocks_1.length; i += 1) each0_blocks_1[i].i(div9, null);

				append(div9, text0);
				append(div9, div2);
				append(div2, div1);
				append(div1, div0);

				for (var i = 0; i < each1_blocks.length; i += 1) {
					each1_blocks[i].i(div0, null);
				}

				append(div0, text1);

				for (i = 0; i < each2_blocks_1.length; i += 1) each2_blocks_1[i].i(div0, null);

				horizontalScrollListener_action = horizontalScrollListener.call(component, div1) || {};
				component.refs.sideContainer = div2;
				append(div9, text2);
				append(div9, div8);
				append(div8, div7);
				append(div7, div3);

				for (var i = 0; i < each3_blocks.length; i += 1) {
					each3_blocks[i].i(div3, null);
				}

				append(div7, text3);
				append(div7, div5);
				append(div5, div4);

				for (i = 0; i < each4_blocks_1.length; i += 1) each4_blocks_1[i].i(div4, null);

				component.refs.rowContainer = div5;
				append(div7, text4);
				append(div7, div6);

				for (i = 0; i < each5_blocks_1.length; i += 1) each5_blocks_1[i].i(div6, null);

				append(div6, text5);

				for (i = 0; i < each6_blocks_1.length; i += 1) each6_blocks_1[i].i(div6, null);

				append(div7, text6);

				for (i = 0; i < each7_blocks_1.length; i += 1) each7_blocks_1[i].i(div7, null);

				component.refs.mainContainer = div8;
				scrollable_action = scrollable.call(component, div8) || {};
				component.refs.ganttElement = div9;
				current = true;
			},

			p: function update(changed, ctx) {
				const each0_value = ctx._ganttTableModules;
				each0_blocks_1 = updateKeyedEach(each0_blocks_1, component, changed, get_key, 1, ctx, each0_value, each0_lookup, div9, outroAndDestroyBlock, create_each_block_7, "i", text0, get_each0_context);

				if (changed.$headers) {
					each1_value = ctx.$headers;

					for (var i = 0; i < each1_value.length; i += 1) {
						const child_ctx = get_each1_context(ctx, each1_value, i);

						if (each1_blocks[i]) {
							each1_blocks[i].p(changed, child_ctx);
						} else {
							each1_blocks[i] = create_each_block_6(component, child_ctx);
							each1_blocks[i].c();
						}
						each1_blocks[i].i(div0, text1);
					}
					for (; i < each1_blocks.length; i += 1) outroBlock(i, 1);
				}

				const each2_value = ctx.$_timeRanges;
				each2_blocks_1 = updateKeyedEach(each2_blocks_1, component, changed, get_key_1, 1, ctx, each2_value, each2_lookup, div0, outroAndDestroyBlock, create_each_block_5, "i", null, get_each2_context);

				if (!current || changed.$width) {
					setStyle(div0, "width", "" + ctx.$width + "px");
				}

				if (!current || changed.$headerWidth) {
					setStyle(div1, "width", "" + ctx.$headerWidth + "px");
				}

				if (changed.columns) {
					each3_value = ctx.columns;

					for (var i = 0; i < each3_value.length; i += 1) {
						const child_ctx = get_each3_context(ctx, each3_value, i);

						if (each3_blocks[i]) {
							each3_blocks[i].p(changed, child_ctx);
						} else {
							each3_blocks[i] = create_each_block_4(component, child_ctx);
							each3_blocks[i].c();
						}
						each3_blocks[i].i(div3, null);
					}
					for (; i < each3_blocks.length; i += 1) outroBlock_1(i, 1);
				}

				const each4_value = ctx.visibleRows;
				each4_blocks_1 = updateKeyedEach(each4_blocks_1, component, changed, get_key_2, 1, ctx, each4_value, each4_lookup, div4, outroAndDestroyBlock, create_each_block_3, "i", null, get_each4_context);

				if (!current || changed.paddingTop) {
					setStyle(div4, "transform", "translateY(" + ctx.paddingTop + "px)");
				}

				if (!current || changed.rowContainerHeight) {
					setStyle(div5, "height", "" + ctx.rowContainerHeight + "px");
				}

				const each5_value = ctx.$_timeRanges;
				each5_blocks_1 = updateKeyedEach(each5_blocks_1, component, changed, get_key_3, 1, ctx, each5_value, each5_lookup, div6, outroAndDestroyBlock, create_each_block_2, "i", text5, get_each5_context);

				const each6_value = ctx.visibleTasks;
				each6_blocks_1 = updateKeyedEach(each6_blocks_1, component, changed, get_key_4, 1, ctx, each6_value, each6_lookup, div6, outroAndDestroyBlock, create_each_block_1, "i", null, get_each6_context);

				const each7_value = ctx._ganttBodyModules;
				each7_blocks_1 = updateKeyedEach(each7_blocks_1, component, changed, get_key_5, 1, ctx, each7_value, each7_lookup, div7, outroAndDestroyBlock, create_each_block$1, "i", null, get_each7_context);

				if (!current || changed.$width) {
					setStyle(div7, "width", "" + ctx.$width + "px");
				}

				if (!current || changed.$height) {
					setStyle(div8, "height", "" + ctx.$height + "px");
				}

				if ((!current || changed.$classes) && div9_class_value !== (div9_class_value = "gantt " + ctx.$classes + " svelte-5w9ayr")) {
					div9.className = div9_class_value;
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				outrocallback = callAfter(outrocallback, 8);

				const countdown = callAfter(outrocallback, each0_blocks_1.length);
				for (i = 0; i < each0_blocks_1.length; i += 1) each0_blocks_1[i].o(countdown);

				each1_blocks = each1_blocks.filter(Boolean);
				const countdown_1 = callAfter(outrocallback, each1_blocks.length);
				for (let i = 0; i < each1_blocks.length; i += 1) outroBlock(i, 0, countdown_1);

				const countdown_2 = callAfter(outrocallback, each2_blocks_1.length);
				for (i = 0; i < each2_blocks_1.length; i += 1) each2_blocks_1[i].o(countdown_2);

				each3_blocks = each3_blocks.filter(Boolean);
				const countdown_3 = callAfter(outrocallback, each3_blocks.length);
				for (let i = 0; i < each3_blocks.length; i += 1) outroBlock_1(i, 0, countdown_3);

				const countdown_4 = callAfter(outrocallback, each4_blocks_1.length);
				for (i = 0; i < each4_blocks_1.length; i += 1) each4_blocks_1[i].o(countdown_4);

				const countdown_5 = callAfter(outrocallback, each5_blocks_1.length);
				for (i = 0; i < each5_blocks_1.length; i += 1) each5_blocks_1[i].o(countdown_5);

				const countdown_6 = callAfter(outrocallback, each6_blocks_1.length);
				for (i = 0; i < each6_blocks_1.length; i += 1) each6_blocks_1[i].o(countdown_6);

				const countdown_7 = callAfter(outrocallback, each7_blocks_1.length);
				for (i = 0; i < each7_blocks_1.length; i += 1) each7_blocks_1[i].o(countdown_7);

				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div9);
				}

				for (i = 0; i < each0_blocks_1.length; i += 1) each0_blocks_1[i].d();

				destroyEach(each1_blocks, detach);

				for (i = 0; i < each2_blocks_1.length; i += 1) each2_blocks_1[i].d();

				if (horizontalScrollListener_action && typeof horizontalScrollListener_action.destroy === 'function') horizontalScrollListener_action.destroy.call(component);
				if (component.refs.sideContainer === div2) component.refs.sideContainer = null;

				destroyEach(each3_blocks, detach);

				for (i = 0; i < each4_blocks_1.length; i += 1) each4_blocks_1[i].d();

				if (component.refs.rowContainer === div5) component.refs.rowContainer = null;

				for (i = 0; i < each5_blocks_1.length; i += 1) each5_blocks_1[i].d();

				for (i = 0; i < each6_blocks_1.length; i += 1) each6_blocks_1[i].d();

				for (i = 0; i < each7_blocks_1.length; i += 1) each7_blocks_1[i].d();

				if (component.refs.mainContainer === div8) component.refs.mainContainer = null;
				if (scrollable_action && typeof scrollable_action.destroy === 'function') scrollable_action.destroy.call(component);
				if (component.refs.ganttElement === div9) component.refs.ganttElement = null;
			}
		};
	}

	// (2:4) {#each _ganttTableModules as module (module.key)}
	function create_each_block_7(component, key_1, ctx) {
		var first, switch_instance_anchor, current;

		var switch_value = ctx.module;

		function switch_props(ctx) {
			var switch_instance_initial_data = {
			 	rowContainerHeight: ctx.rowContainerHeight,
			 	paddingTop: ctx.paddingTop,
			 	paddingBottom: ctx.paddingBottom,
			 	visibleRows: ctx.visibleRows
			 };
			return {
				root: component.root,
				store: component.store,
				data: switch_instance_initial_data
			};
		}

		if (switch_value) {
			var switch_instance = new switch_value(switch_props(ctx));
		}

		function switch_instance_init(event) {
			component.initModule(event.module);
		}

		if (switch_instance) switch_instance.on("init", switch_instance_init);

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				if (switch_instance) switch_instance._fragment.c();
				switch_instance_anchor = createComment();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insert(target, first, anchor);

				if (switch_instance) {
					switch_instance._mount(target, anchor);
				}

				insert(target, switch_instance_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var switch_instance_changes = {};
				if (changed.rowContainerHeight) switch_instance_changes.rowContainerHeight = ctx.rowContainerHeight;
				if (changed.paddingTop) switch_instance_changes.paddingTop = ctx.paddingTop;
				if (changed.paddingBottom) switch_instance_changes.paddingBottom = ctx.paddingBottom;
				if (changed.visibleRows) switch_instance_changes.visibleRows = ctx.visibleRows;

				if (switch_value !== (switch_value = ctx.module)) {
					if (switch_instance) {
						const old_component = switch_instance;
						old_component._fragment.o(() => {
							old_component.destroy();
						});
					}

					if (switch_value) {
						switch_instance = new switch_value(switch_props(ctx));
						switch_instance._fragment.c();
						switch_instance._mount(switch_instance_anchor.parentNode, switch_instance_anchor);

						switch_instance.on("init", switch_instance_init);
					} else {
						switch_instance = null;
					}
				}

				else if (switch_value) {
					switch_instance._set(switch_instance_changes);
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (switch_instance) switch_instance._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
					detachNode(switch_instance_anchor);
				}

				if (switch_instance) switch_instance.destroy(detach);
			}
		};
	}

	// (9:16) {#each $headers as header}
	function create_each_block_6(component, ctx) {
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

				if (columnheader) columnheader._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				columnheader.destroy(detach);
			}
		};
	}

	// (12:16) {#each $_timeRanges as timeRange (timeRange.id)}
	function create_each_block_5(component, key_1, ctx) {
		var first, current;

		var timerangeheader_initial_data = { timeRange: ctx.timeRange };
		var timerangeheader = new TimeRangeHeader({
			root: component.root,
			store: component.store,
			data: timerangeheader_initial_data
		});

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				timerangeheader._fragment.c();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insert(target, first, anchor);
				timerangeheader._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var timerangeheader_changes = {};
				if (changed.$_timeRanges) timerangeheader_changes.timeRange = ctx.timeRange;
				timerangeheader._set(timerangeheader_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (timerangeheader) timerangeheader._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
				}

				timerangeheader.destroy(detach);
			}
		};
	}

	// (22:16) {#each columns as column}
	function create_each_block_4(component, ctx) {
		var current;

		var column_spread_levels = [
			ctx.column
		];

		var column_initial_data = {};
		for (var i = 0; i < column_spread_levels.length; i += 1) {
			column_initial_data = assign(column_initial_data, column_spread_levels[i]);
		}
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
				var column_changes = changed.columns ? getSpreadUpdate(column_spread_levels, [
					ctx.column
				]) : {};
				column._set(column_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (column) column._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				column.destroy(detach);
			}
		};
	}

	// (30:16) {#each visibleRows as row (row.model.id)}
	function create_each_block_3(component, key_1, ctx) {
		var first, current;

		var row_initial_data = { row: ctx.row };
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
				insert(target, first, anchor);
				row._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var row_changes = {};
				if (changed.visibleRows) row_changes.row = ctx.row;
				row._set(row_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (row) row._fragment.o(outrocallback);
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

	// (37:20) {#each $_timeRanges as timeRange (timeRange.id)}
	function create_each_block_2(component, key_1, ctx) {
		var first, current;

		var timerange_initial_data = { timeRange: ctx.timeRange };
		var timerange = new TimeRange({
			root: component.root,
			store: component.store,
			data: timerange_initial_data
		});

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				timerange._fragment.c();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insert(target, first, anchor);
				timerange._mount(target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var timerange_changes = {};
				if (changed.$_timeRanges) timerange_changes.timeRange = ctx.timeRange;
				timerange._set(timerange_changes);
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (timerange) timerange._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
				}

				timerange.destroy(detach);
			}
		};
	}

	// (41:20) {#each visibleTasks as task (task.model.id)}
	function create_each_block_1(component, key_1, ctx) {
		var first, taskcomponent_updating = {}, current;

		var taskcomponent_initial_data = { model: ctx.task.model };
		if (ctx.task.left !== void 0) {
			taskcomponent_initial_data.left = ctx.task.left;
			taskcomponent_updating.left = true;
		}
		if (ctx.task.width !== void 0) {
			taskcomponent_initial_data.width = ctx.task.width;
			taskcomponent_updating.width = true;
		}
		if (ctx.task.height !== void 0) {
			taskcomponent_initial_data.height = ctx.task.height;
			taskcomponent_updating.height = true;
		}
		if (ctx.task.widthT !== void 0) {
			taskcomponent_initial_data.widthT = ctx.task.widthT;
			taskcomponent_updating.widthT = true;
		}
		if (ctx.task.posX !== void 0) {
			taskcomponent_initial_data.posX = ctx.task.posX;
			taskcomponent_updating.posX = true;
		}
		if (ctx.task.posY !== void 0) {
			taskcomponent_initial_data.posY = ctx.task.posY;
			taskcomponent_updating.posY = true;
		}
		var taskcomponent = new Task({
			root: component.root,
			store: component.store,
			data: taskcomponent_initial_data,
			_bind(changed, childState) {
				var newState = {};
				if (!taskcomponent_updating.left && changed.left) {
					ctx.task.left = childState.left;

					newState.visibleTasks = ctx.visibleTasks;
				}

				if (!taskcomponent_updating.width && changed.width) {
					ctx.task.width = childState.width;

					newState.visibleTasks = ctx.visibleTasks;
				}

				if (!taskcomponent_updating.height && changed.height) {
					ctx.task.height = childState.height;

					newState.visibleTasks = ctx.visibleTasks;
				}

				if (!taskcomponent_updating.widthT && changed.widthT) {
					ctx.task.widthT = childState.widthT;

					newState.visibleTasks = ctx.visibleTasks;
				}

				if (!taskcomponent_updating.posX && changed.posX) {
					ctx.task.posX = childState.posX;

					newState.visibleTasks = ctx.visibleTasks;
				}

				if (!taskcomponent_updating.posY && changed.posY) {
					ctx.task.posY = childState.posY;

					newState.visibleTasks = ctx.visibleTasks;
				}
				component._set(newState);
				taskcomponent_updating = {};
			}
		});

		component.root._beforecreate.push(() => {
			taskcomponent._bind({ left: 1, width: 1, height: 1, widthT: 1, posX: 1, posY: 1 }, taskcomponent.get());
		});

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				taskcomponent._fragment.c();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insert(target, first, anchor);
				taskcomponent._mount(target, anchor);
				current = true;
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				var taskcomponent_changes = {};
				if (changed.visibleTasks) taskcomponent_changes.model = ctx.task.model;
				if (!taskcomponent_updating.left && changed.visibleTasks) {
					taskcomponent_changes.left = ctx.task.left;
					taskcomponent_updating.left = ctx.task.left !== void 0;
				}
				if (!taskcomponent_updating.width && changed.visibleTasks) {
					taskcomponent_changes.width = ctx.task.width;
					taskcomponent_updating.width = ctx.task.width !== void 0;
				}
				if (!taskcomponent_updating.height && changed.visibleTasks) {
					taskcomponent_changes.height = ctx.task.height;
					taskcomponent_updating.height = ctx.task.height !== void 0;
				}
				if (!taskcomponent_updating.widthT && changed.visibleTasks) {
					taskcomponent_changes.widthT = ctx.task.widthT;
					taskcomponent_updating.widthT = ctx.task.widthT !== void 0;
				}
				if (!taskcomponent_updating.posX && changed.visibleTasks) {
					taskcomponent_changes.posX = ctx.task.posX;
					taskcomponent_updating.posX = ctx.task.posX !== void 0;
				}
				if (!taskcomponent_updating.posY && changed.visibleTasks) {
					taskcomponent_changes.posY = ctx.task.posY;
					taskcomponent_updating.posY = ctx.task.posY !== void 0;
				}
				taskcomponent._set(taskcomponent_changes);
				taskcomponent_updating = {};
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (taskcomponent) taskcomponent._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
				}

				taskcomponent.destroy(detach);
			}
		};
	}

	// (51:12) {#each _ganttBodyModules as module (module.key)}
	function create_each_block$1(component, key_1, ctx) {
		var first, switch_instance_anchor, current;

		var switch_value = ctx.module;

		function switch_props(ctx) {
			return {
				root: component.root,
				store: component.store
			};
		}

		if (switch_value) {
			var switch_instance = new switch_value(switch_props(ctx));
		}

		function switch_instance_init(event) {
			component.initModule(event.module);
		}

		if (switch_instance) switch_instance.on("init", switch_instance_init);

		return {
			key: key_1,

			first: null,

			c: function create() {
				first = createComment();
				if (switch_instance) switch_instance._fragment.c();
				switch_instance_anchor = createComment();
				this.first = first;
			},

			m: function mount(target, anchor) {
				insert(target, first, anchor);

				if (switch_instance) {
					switch_instance._mount(target, anchor);
				}

				insert(target, switch_instance_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (switch_value !== (switch_value = ctx.module)) {
					if (switch_instance) {
						const old_component = switch_instance;
						old_component._fragment.o(() => {
							old_component.destroy();
						});
					}

					if (switch_value) {
						switch_instance = new switch_value(switch_props(ctx));
						switch_instance._fragment.c();
						switch_instance._mount(switch_instance_anchor.parentNode, switch_instance_anchor);

						switch_instance.on("init", switch_instance_init);
					} else {
						switch_instance = null;
					}
				}
			},

			i: function intro(target, anchor) {
				if (current) return;

				this.m(target, anchor);
			},

			o: function outro(outrocallback) {
				if (!current) return;

				if (switch_instance) switch_instance._fragment.o(outrocallback);
				current = false;
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(first);
					detachNode(switch_instance_anchor);
				}

				if (switch_instance) switch_instance.destroy(detach);
			}
		};
	}

	function Gantt(options) {
		this._debugName = '<Gantt>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}
		if (!options.store) {
			throw new Error("<Gantt> references store properties, but no store was provided");
		}

		init(this, options);
		this.refs = {};
		this._state = assign(assign(this.store._init(["rows","rowHeight","_taskCache","classes","headerWidth","width","headers","_timeRanges","height"]), data$5()), options.data);
		this.store._add(this, ["rows","rowHeight","_taskCache","classes","headerWidth","width","headers","_timeRanges","height"]);

		this._recompute({ $rows: 1, $rowHeight: 1, scrollTop: 1, startIndex: 1, viewportHeight: 1, endIndex: 1, $_taskCache: 1, visibleRows: 1 }, this._state);
		if (!('$rows' in this._state)) console.warn("<Gantt> was created without expected data property '$rows'");
		if (!('$rowHeight' in this._state)) console.warn("<Gantt> was created without expected data property '$rowHeight'");
		if (!('scrollTop' in this._state)) console.warn("<Gantt> was created without expected data property 'scrollTop'");

		if (!('viewportHeight' in this._state)) console.warn("<Gantt> was created without expected data property 'viewportHeight'");

		if (!('$_taskCache' in this._state)) console.warn("<Gantt> was created without expected data property '$_taskCache'");

		if (!('$classes' in this._state)) console.warn("<Gantt> was created without expected data property '$classes'");
		if (!('_ganttTableModules' in this._state)) console.warn("<Gantt> was created without expected data property '_ganttTableModules'");



		if (!('$headerWidth' in this._state)) console.warn("<Gantt> was created without expected data property '$headerWidth'");
		if (!('$width' in this._state)) console.warn("<Gantt> was created without expected data property '$width'");
		if (!('$headers' in this._state)) console.warn("<Gantt> was created without expected data property '$headers'");
		if (!('$_timeRanges' in this._state)) console.warn("<Gantt> was created without expected data property '$_timeRanges'");
		if (!('$height' in this._state)) console.warn("<Gantt> was created without expected data property '$height'");
		if (!('columns' in this._state)) console.warn("<Gantt> was created without expected data property 'columns'");

		if (!('_ganttBodyModules' in this._state)) console.warn("<Gantt> was created without expected data property '_ganttBodyModules'");
		this._intro = !!options.intro;

		this._handlers.state = [onstate];

		this._handlers.destroy = [ondestroy$3, removeFromStore];

		onstate.call(this, { changed: assignTrue({}, this._state), current: this._state });

		this._fragment = create_main_fragment$6(this, this._state);

		this.root._oncreate.push(() => {
			oncreate$6.call(this);
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

	assign(Gantt.prototype, protoDev);
	assign(Gantt.prototype, methods$3);

	Gantt.prototype._checkReadOnly = function _checkReadOnly(newState) {
		if ('rowContainerHeight' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'rowContainerHeight'");
		if ('startIndex' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'startIndex'");
		if ('endIndex' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'endIndex'");
		if ('paddingTop' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'paddingTop'");
		if ('paddingBottom' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'paddingBottom'");
		if ('visibleRows' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'visibleRows'");
		if ('visibleTasks' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'visibleTasks'");
	};

	Gantt.prototype._recompute = function _recompute(changed, state) {
		if (changed.$rows || changed.$rowHeight) {
			if (this._differs(state.rowContainerHeight, (state.rowContainerHeight = rowContainerHeight(state)))) changed.rowContainerHeight = true;
		}

		if (changed.scrollTop || changed.$rowHeight) {
			if (this._differs(state.startIndex, (state.startIndex = startIndex(state)))) changed.startIndex = true;
		}

		if (changed.startIndex || changed.viewportHeight || changed.$rowHeight || changed.$rows) {
			if (this._differs(state.endIndex, (state.endIndex = endIndex(state)))) changed.endIndex = true;
		}

		if (changed.startIndex || changed.$rowHeight) {
			if (this._differs(state.paddingTop, (state.paddingTop = paddingTop(state)))) changed.paddingTop = true;
		}

		if (changed.$rows || changed.endIndex || changed.$rowHeight) {
			if (this._differs(state.paddingBottom, (state.paddingBottom = paddingBottom(state)))) changed.paddingBottom = true;
		}

		if (changed.$rows || changed.startIndex || changed.endIndex) {
			if (this._differs(state.visibleRows, (state.visibleRows = visibleRows(state)))) changed.visibleRows = true;
		}

		if (changed.$_taskCache || changed.visibleRows) {
			if (this._differs(state.visibleTasks, (state.visibleTasks = visibleTasks(state)))) changed.visibleTasks = true;
		}
	};

	setup$1(Gantt);

	return Gantt;

}());
//# sourceMappingURL=svelteGantt.js.map
