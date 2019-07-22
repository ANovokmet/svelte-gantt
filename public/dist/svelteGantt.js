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

	function addResizeListener(element, fn) {
		if (getComputedStyle(element).position === 'static') {
			element.style.position = 'relative';
		}

		const object = document.createElement('object');
		object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
		object.type = 'text/html';

		let win;

		object.onload = () => {
			win = object.contentDocument.defaultView;
			win.addEventListener('resize', fn);
		};

		if (/Trident/.test(navigator.userAgent)) {
			element.appendChild(object);
			object.data = 'about:blank';
		} else {
			object.data = 'about:blank';
			element.appendChild(object);
		}

		return {
			cancel: () => {
				win && win.removeEventListener && win.removeEventListener('resize', fn);
				element.removeChild(object);
			}
		};
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

	function isLeftClick(event) {
	    return event.which === 1;
	}
	/**
	 * Gets mouse position within an element
	 * @param node
	 * @param event
	 */
	function getRelativePos(node, event) {
	    const rect = node.getBoundingClientRect();
	    const x = event.clientX - rect.left; //x position within the element.
	    const y = event.clientY - rect.top; //y position within the element.
	    return {
	        x: x,
	        y: y
	    };
	}
	/**
	 * Adds an event listener that triggers once.
	 * @param target
	 * @param type
	 * @param listener
	 * @param addOptions
	 * @param removeOptions
	 */
	function addEventListenerOnce(target, type, listener, addOptions, removeOptions) {
	    target.addEventListener(type, function fn(event) {
	        target.removeEventListener(type, fn, removeOptions);
	        listener.apply(this, arguments, addOptions);
	    });
	}
	/**
	 * Sets the cursor on an element. Globally by default.
	 * @param cursor
	 * @param node
	 */
	function setCursor(cursor, node = document.body) {
	    node.style.cursor = cursor;
	}
	function debounce(func, wait, immediate) {
	    var timeout;
	    return function () {
	        var context = this, args = arguments;
	        var later = function () {
	            timeout = null;
	            if (!immediate)
	                func.apply(context, args);
	        };
	        var callNow = immediate && !timeout;
	        clearTimeout(timeout);
	        timeout = setTimeout(later, wait);
	        if (callNow)
	            func.apply(context, args);
	    };
	}
	//# sourceMappingURL=domUtils.js.map

	const V_SCROLLBAR_WIDTH = 17;
	const MIN_DRAG_X = 2;
	const MIN_DRAG_Y = 2;
	//# sourceMappingURL=constants.js.map

	function draggable(node, settings, provider) {
	    const { onDown, onResize, onDrag, onDrop, dragAllowed, resizeAllowed } = settings;
	    let mouseStartPosX, mouseStartPosY;
	    let mouseStartRight;
	    let direction;
	    let dragging = false, resizing = false;
	    let initialX, initialY;
	    let resizeTriggered = false;
	    const onmousedown = (event) => {
	        if (!isLeftClick(event)) {
	            return;
	        }
	        const { posX, posY } = provider.getPos();
	        const widthT = provider.getWidth();
	        event.stopPropagation();
	        event.preventDefault();
	        const canDrag = typeof (dragAllowed) === 'function' ? dragAllowed() : dragAllowed;
	        const canResize = typeof (resizeAllowed) === 'function' ? resizeAllowed() : resizeAllowed;
	        if (canDrag || canResize) {
	            initialX = event.clientX;
	            initialY = event.clientY;
	            mouseStartPosX = getRelativePos(settings.container, event).x - posX;
	            mouseStartPosY = getRelativePos(settings.container, event).y - posY;
	            mouseStartRight = posX + widthT;
	            if (canResize && mouseStartPosX < settings.resizeHandleWidth) {
	                direction = 'left';
	                resizing = true;
	                onDown({
	                    posX,
	                    widthT,
	                    posY,
	                    resizing: true
	                });
	            }
	            else if (canResize && mouseStartPosX > widthT - settings.resizeHandleWidth) {
	                direction = 'right';
	                resizing = true;
	                onDown({
	                    posX,
	                    widthT,
	                    posY,
	                    resizing: true
	                });
	            }
	            else if (canDrag) {
	                dragging = true;
	                onDown({
	                    posX,
	                    widthT,
	                    posY,
	                    dragging: true
	                });
	            }
	            window.addEventListener('mousemove', onmousemove, false);
	            addEventListenerOnce(window, 'mouseup', onmouseup);
	        }
	    };
	    const onmousemove = (event) => {
	        if (!resizeTriggered) {
	            if (Math.abs(event.clientX - initialX) > MIN_DRAG_X || Math.abs(event.clientY - initialY) > MIN_DRAG_Y) {
	                console.log('trigger resize');
	                resizeTriggered = true;
	            }
	            else {
	                return;
	            }
	        }
	        event.preventDefault();
	        if (resizing) {
	            const mousePos = getRelativePos(settings.container, event);
	            const { posX } = provider.getPos();
	            const widthT = provider.getWidth();
	            if (direction === 'left') { //resize ulijevo
	                if (mousePos.x > posX + widthT) {
	                    direction = 'right';
	                    onResize({
	                        posX: mouseStartRight,
	                        widthT: mouseStartRight - mousePos.x
	                    });
	                    mouseStartRight = mouseStartRight + widthT;
	                }
	                else {
	                    onResize({
	                        posX: mousePos.x,
	                        widthT: mouseStartRight - mousePos.x
	                    });
	                }
	            }
	            else if (direction === 'right') { //resize desno
	                if (mousePos.x <= posX) {
	                    direction = 'left';
	                    onResize({
	                        posX: mousePos.x,
	                        widthT: posX - mousePos.x
	                    });
	                    mouseStartRight = posX;
	                }
	                else {
	                    onResize({
	                        posX,
	                        widthT: mousePos.x - posX
	                    });
	                }
	            }
	        }
	        // mouseup
	        if (dragging) {
	            const mousePos = getRelativePos(settings.container, event);
	            onDrag({
	                posX: mousePos.x - mouseStartPosX,
	                posY: mousePos.y - mouseStartPosY
	            });
	        }
	    };
	    const onmouseup = (event) => {
	        const { posX, posY } = provider.getPos();
	        const widthT = provider.getWidth();
	        onDrop({
	            posX,
	            posY,
	            widthT,
	            event,
	            dragging,
	            resizing
	        });
	        dragging = false;
	        resizing = false;
	        direction = null;
	        resizeTriggered = false;
	        window.removeEventListener('mousemove', onmousemove, false);
	    };
	    node.addEventListener('mousedown', onmousedown, false);
	    return {
	        destroy() {
	            node.removeEventListener('mousedown', onmousedown, false);
	            node.removeEventListener('mousemove', onmousemove, false);
	            node.removeEventListener('mouseup', onmouseup, false);
	        }
	    };
	}
	class DragDropManager {
	    constructor(gantt) {
	        this.handlerMap = {};
	        this.gantt = gantt;
	        this.register('row', (event) => {
	            let elements = document.elementsFromPoint(event.clientX, event.clientY);
	            let rowElement = elements.find((element) => !!element.getAttribute("data-row-id"));
	            if (rowElement !== undefined) {
	                const rowId = parseInt(rowElement.getAttribute("data-row-id"));
	                const { rowMap } = this.gantt.store.get();
	                const targetRow = rowMap[rowId];
	                if (targetRow.model.enableDragging) {
	                    return targetRow;
	                }
	            }
	            return null;
	        });
	    }
	    register(target, handler) {
	        this.handlerMap[target] = handler;
	    }
	    getTarget(target, event) {
	        //const rowCenterX = this.root.refs.mainContainer.getBoundingClientRect().left + this.root.refs.mainContainer.getBoundingClientRect().width / 2;
	        var handler = this.handlerMap[target];
	        if (handler) {
	            return handler(event);
	        }
	    }
	}
	//# sourceMappingURL=draggable.js.map

	class ComponentPosProvider {
	    constructor(component) {
	        this.component = component;
	    }
	    getPos() {
	        const { posX, posY } = this.component.get();
	        return { posX, posY };
	    }
	    getWidth() {
	        const { widthT } = this.component.get();
	        return widthT;
	    }
	}
	//# sourceMappingURL=componentPosProvider.js.map

	/* src\Task.html generated by Svelte v2.16.0 */



	function selected({$selection, model}) {
		return $selection.indexOf(model.id) !== -1;
	}

	function row({$rowMap, model}) {
		return $rowMap[model.resourceId];
	}

	function data() {
	    return {
	        dragging: false,
	        selected: false,
	        resizing: false,

	        widthT: null,
	        posX: null,
	        posY: null
	    }
	}
	var methods = {
	    select(event){
	        const { model } = this.get();
	        if(event.ctrlKey){
	            this.root.selectionManager.toggleSelection(model.id);
	        }
	        else{
	            this.root.selectionManager.selectSingle(model.id);
	        }
	        
	        if(this.get().selected){
	            this.root.api.tasks.raise.select(model);
	        }
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

	function onstate({ changed, current, previous }) {
	    if(!current.dragging && !current.resizing){
	        this.set({
	            posX: current.left,
	            widthT: current.width,
	            posY: current.top,
	        });
	    }
			}
	function drag(node) {
	                const { rowContainerElement, resizeHandleWidth } = this.store.get();

	                const ondrop = ({ posX, posY, widthT, event, dragging, resizing }) => {
	                    const { model } = this.get();
	                    const { taskMap, rowMap, rowPadding } = this.store.get();

	                    let rowChangeValid = true;
	                    //row switching
	                    if(dragging){
	                        const sourceRow = rowMap[model.resourceId];
	                        const targetRow = this.root.dndManager.getTarget('row', event);
	                        if(targetRow){
	                            model.resourceId = targetRow.model.id;
	                            this.root.api.tasks.raise.switchRow(this, targetRow, sourceRow);
	                        }
	                        else{
	                            rowChangeValid = false;
	                        }
	                    }
	                    
	                    this.set({dragging: false, resizing: false});
	                    const task = taskMap[model.id];

	                    if(rowChangeValid) {
	                        const newFrom = this.root.utils.roundTo(this.root.utils.getDateByPosition(posX)); 
	                        const newTo = this.root.utils.roundTo(this.root.utils.getDateByPosition(posX+widthT));
	                        const newLeft = this.root.utils.getPositionByDate(newFrom);
	                        const newRight = this.root.utils.getPositionByDate(newTo);

	                        Object.assign(model, {
	                            from: newFrom,
	                            to: newTo
	                        });
	                        
	                        this.store.updateTask({
	                            ...task,
	                            left: newLeft,
	                            width: newRight - newLeft,
	                            top: rowPadding + rowMap[model.resourceId].posY,
	                            model
	                        });
	                    }
	                    else {
	                        // reset position
	                        this.store.updateTask({
	                            ...task
	                        });
	                    }

	                    setCursor('default');
	                };

	                return draggable(node, {
	                    onDown: ({dragging, resizing}) => {
	                        //this.set({dragging, resizing});
	                        if(dragging) {
	                            setCursor('move');
	                        }
	                        if(resizing) {
	                            setCursor('e-resize');
	                        }
	                    }, 
	                    onResize: (state) => {
	                        this.set({...state, resizing: true});
	                    }, 
	                    onDrag: ({posX, posY}) => {
	                        this.set({posX, posY, dragging: true});
	                    }, 
	                    dragAllowed: () => {
	                        const { model } = this.get();
	                        const { rowMap } = this.store.get();
	                        const row = rowMap[model.resourceId];
	                        return row.model.enableDragging && model.enableDragging
	                    },
	                    resizeAllowed: () => {
	                        const { model } = this.get();
	                        const { rowMap } = this.store.get();
	                        const row = rowMap[model.resourceId];
	                        return row.model.enableDragging && model.enableDragging
	                    },
	                    onDrop: ondrop, 
	                    container: rowContainerElement, 
	                    resizeHandleWidth
	                }, new ComponentPosProvider(this));
	            }
	const file = "src\\Task.html";

	function create_main_fragment(component, ctx) {
		var div2, div0, text0, div1, text1, span, text2, text3_value = ctx.posX|0, text3, text4, text5_value = ctx.posY|0, text5, text6, text7_value = ctx.left|0, text7, text8, text9_value = ctx.top|0, text9, text10, div2_class_value, drag_action, current;

		function select_block_type(ctx) {
			if (ctx.model.html) return create_if_block_1;
			if (ctx.$taskContent) return create_if_block_2;
			return create_else_block;
		}

		var current_block_type = select_block_type(ctx);
		var if_block0 = current_block_type(component, ctx);

		var if_block1 = (ctx.model.showButton) && create_if_block(component, ctx);

		function click_handler(event) {
			component.select(event);
		}

		return {
			c: function create() {
				div2 = createElement("div");
				div0 = createElement("div");
				text0 = createText("\r\n    ");
				div1 = createElement("div");
				if_block0.c();
				text1 = createText("\r\n        ");
				span = createElement("span");
				text2 = createText("x:");
				text3 = createText(text3_value);
				text4 = createText(" y:");
				text5 = createText(text5_value);
				text6 = createText(", x:");
				text7 = createText(text7_value);
				text8 = createText(" y:");
				text9 = createText(text9_value);
				text10 = createText("\r\n        \r\n\r\n        ");
				if (if_block1) if_block1.c();
				div0.className = "sg-task-background svelte-1qtvn5p";
				setStyle(div0, "width", "" + ctx.model.amountDone + "%");
				addLoc(div0, file, 10, 4, 288);
				span.className = "debug svelte-1qtvn5p";
				addLoc(span, file, 19, 8, 594);
				div1.className = "sg-task-content svelte-1qtvn5p";
				addLoc(div1, file, 11, 4, 366);
				addListener(div2, "click", click_handler);
				div2.className = div2_class_value = "sg-task " + ctx.model.classes + " svelte-1qtvn5p";
				setStyle(div2, "width", "" + ctx.widthT + "px");
				setStyle(div2, "height", "" + ctx.height + "px");
				setStyle(div2, "transform", "translate(" + ctx.posX + "px, " + ctx.posY + "px)");
				toggleClass(div2, "selected", ctx.selected);
				toggleClass(div2, "moving", ctx.dragging||ctx.resizing);
				addLoc(div2, file, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div2, anchor);
				append(div2, div0);
				append(div2, text0);
				append(div2, div1);
				if_block0.m(div1, null);
				append(div1, text1);
				append(div1, span);
				append(span, text2);
				append(span, text3);
				append(span, text4);
				append(span, text5);
				append(span, text6);
				append(span, text7);
				append(span, text8);
				append(span, text9);
				append(div1, text10);
				if (if_block1) if_block1.m(div1, null);
				component.refs.taskElement = div2;
				drag_action = drag.call(component, div2) || {};
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

				if ((changed.posX) && text3_value !== (text3_value = ctx.posX|0)) {
					setData(text3, text3_value);
				}

				if ((changed.posY) && text5_value !== (text5_value = ctx.posY|0)) {
					setData(text5, text5_value);
				}

				if ((changed.left) && text7_value !== (text7_value = ctx.left|0)) {
					setData(text7, text7_value);
				}

				if ((changed.top) && text9_value !== (text9_value = ctx.top|0)) {
					setData(text9, text9_value);
				}

				if (ctx.model.showButton) {
					if (if_block1) {
						if_block1.p(changed, ctx);
					} else {
						if_block1 = create_if_block(component, ctx);
						if_block1.c();
						if_block1.m(div1, null);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if ((changed.model) && div2_class_value !== (div2_class_value = "sg-task " + ctx.model.classes + " svelte-1qtvn5p")) {
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
				removeListener(div2, "click", click_handler);
				if (component.refs.taskElement === div2) component.refs.taskElement = null;
				if (drag_action && typeof drag_action.destroy === 'function') drag_action.destroy.call(component);
			}
		};
	}

	// (17:8) {:else}
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

	// (15:30) 
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

	// (13:8) {#if model.html}
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

	// (23:8) {#if model.showButton}
	function create_if_block(component, ctx) {
		var span, raw_value = ctx.model.buttonHtml, span_class_value;

		function click_handler(event) {
			component.onclick(event);
		}

		return {
			c: function create() {
				span = createElement("span");
				addListener(span, "click", click_handler);
				span.className = span_class_value = "sg-task-button " + ctx.model.buttonClasses + " svelte-1qtvn5p";
				addLoc(span, file, 23, 12, 722);
			},

			m: function mount(target, anchor) {
				insert(target, span, anchor);
				span.innerHTML = raw_value;
			},

			p: function update(changed, ctx) {
				if ((changed.model) && raw_value !== (raw_value = ctx.model.buttonHtml)) {
					span.innerHTML = raw_value;
				}

				if ((changed.model) && span_class_value !== (span_class_value = "sg-task-button " + ctx.model.buttonClasses + " svelte-1qtvn5p")) {
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
		this._state = assign(assign(this.store._init(["selection","rowMap","taskContent"]), data()), options.data);
		this.store._add(this, ["selection","rowMap","taskContent"]);

		this._recompute({ $selection: 1, model: 1, $rowMap: 1 }, this._state);
		if (!('$selection' in this._state)) console.warn("<Task> was created without expected data property '$selection'");
		if (!('model' in this._state)) console.warn("<Task> was created without expected data property 'model'");
		if (!('$rowMap' in this._state)) console.warn("<Task> was created without expected data property '$rowMap'");
		if (!('widthT' in this._state)) console.warn("<Task> was created without expected data property 'widthT'");
		if (!('height' in this._state)) console.warn("<Task> was created without expected data property 'height'");
		if (!('posX' in this._state)) console.warn("<Task> was created without expected data property 'posX'");
		if (!('posY' in this._state)) console.warn("<Task> was created without expected data property 'posY'");

		if (!('dragging' in this._state)) console.warn("<Task> was created without expected data property 'dragging'");
		if (!('resizing' in this._state)) console.warn("<Task> was created without expected data property 'resizing'");
		if (!('$taskContent' in this._state)) console.warn("<Task> was created without expected data property '$taskContent'");
		if (!('left' in this._state)) console.warn("<Task> was created without expected data property 'left'");
		if (!('top' in this._state)) console.warn("<Task> was created without expected data property 'top'");
		this._intro = !!options.intro;

		this._handlers.state = [onstate];

		this._handlers.destroy = [removeFromStore];

		onstate.call(this, { changed: assignTrue({}, this._state), current: this._state });

		this._fragment = create_main_fragment(this, this._state);

		this.root._oncreate.push(() => {
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
	assign(Task.prototype, methods);

	Task.prototype._checkReadOnly = function _checkReadOnly(newState) {
		if ('selected' in newState && !this._updatingReadonlyProperty) throw new Error("<Task>: Cannot set read-only property 'selected'");
		if ('row' in newState && !this._updatingReadonlyProperty) throw new Error("<Task>: Cannot set read-only property 'row'");
	};

	Task.prototype._recompute = function _recompute(changed, state) {
		if (changed.$selection || changed.model) {
			if (this._differs(state.selected, (state.selected = selected(state)))) changed.selected = true;
		}

		if (changed.$rowMap || changed.model) {
			if (this._differs(state.row, (state.row = row(state)))) changed.row = true;
		}
	};

	/* src\Row.html generated by Svelte v2.16.0 */

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
	const file$1 = "src\\Row.html";

	function create_main_fragment$1(component, ctx) {
		var div, div_class_value, div_data_row_id_value, current;

		var if_block = (ctx.row.model.contentHtml) && create_if_block$1(component, ctx);

		return {
			c: function create() {
				div = createElement("div");
				if (if_block) if_block.c();
				div.className = div_class_value = "row " + ctx.row.model.classes + " svelte-1jglin1";
				setStyle(div, "height", "" + ctx.$rowHeight + "px");
				div.dataset.rowId = div_data_row_id_value = ctx.row.model.id;
				addLoc(div, file$1, 0, 0, 0);
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
						if_block = create_if_block$1(component, ctx);
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

				if ((changed.row) && div_data_row_id_value !== (div_data_row_id_value = ctx.row.model.id)) {
					div.dataset.rowId = div_data_row_id_value;
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

	// (2:4) {#if row.model.contentHtml}
	function create_if_block$1(component, ctx) {
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

		this._fragment = create_main_fragment$1(this, this._state);

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

	Row.prototype._checkReadOnly = function _checkReadOnly(newState) {
	};

	/* src\Column.html generated by Svelte v2.16.0 */

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
		this._state = assign({}, options.data);
		if (!('width' in this._state)) console.warn("<Column> was created without expected data property 'width'");
		if (!('left' in this._state)) console.warn("<Column> was created without expected data property 'left'");
		this._intro = !!options.intro;

		this._fragment = create_main_fragment$2(this, this._state);

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

	class GanttUtils {
	    constructor(gantt) {
	        this.gantt = gantt;
	    }
	    /**
	     * Returns position of date on a line if from and to represent length of width
	     * @param {*} date
	     */
	    getPositionByDate(date) {
	        const { from, to, width } = this.gantt.store.get();
	        return getPositionByDate(date, from, to, width);
	    }
	    getDateByPosition(x) {
	        const { from, to, width } = this.gantt.store.get();
	        return getDateByPosition(x, from, to, width);
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
	function getPositionByDate(date, from, to, width) {
	    if (!date) {
	        return undefined;
	    }
	    let durationTo = date.diff(from, 'milliseconds');
	    let durationToEnd = to.diff(from, 'milliseconds');
	    return durationTo / durationToEnd * width;
	}
	function getDateByPosition(x, from, to, width) {
	    let durationTo = x / width * to.diff(from, 'milliseconds');
	    let dateAtPosition = from.clone().add(durationTo, 'milliseconds');
	    return dateAtPosition;
	}
	//# sourceMappingURL=utils.js.map

	/* src\ColumnHeader.html generated by Svelte v2.16.0 */

	function columnWidth({$from, $to, $width, header}) {
	    return getPositionByDate($from.clone().add(header.offset || 1, header.unit), $from, $to, $width);
	}

	function columnCount({$width, columnWidth}) {
		return Math.ceil($width / columnWidth);
	}

	function headers({$from, columnWidth, columnCount, header, $width}) {
	    const headers = [];
	    let headerTime = $from.clone().startOf(header.unit);
	    const step = header.offset || 1;

	    for(let i = 0; i < columnCount; i++){
	        headers.push({
	            width: Math.min(columnWidth, $width), 
	            label: headerTime.format(header.format),
	            from: headerTime.clone(),
	            to: headerTime.clone().add(step, header.unit),
	            unit: header.unit
	        });
	        headerTime.add(step, header.unit);
	    }
	    return headers;
	}

	function data$1(){
	    return {
	        headers: [],
	        width: null
	    }
	}
	const file$3 = "src\\ColumnHeader.html";

	function click_handler(event) {
		const { component, ctx } = this._svelte;

		component.fire('selectDateTime', { from: ctx.header.from, to: ctx.header.to, unit: ctx.header.unit });
	}

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
				div.className = "column-header-row svelte-1jynpw1";
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
				div._svelte = { component, ctx };

				addListener(div, "click", click_handler);
				div.className = "column-header svelte-1jynpw1";
				setStyle(div, "width", "" + ctx.header.width + "px");
				addLoc(div, file$3, 2, 8, 96);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, text0);
				append(div, text1);
			},

			p: function update(changed, _ctx) {
				ctx = _ctx;
				if ((changed.headers) && text0_value !== (text0_value = ctx.header.label || 'N/A')) {
					setData(text0, text0_value);
				}

				div._svelte.ctx = ctx;
				if (changed.headers) {
					setStyle(div, "width", "" + ctx.header.width + "px");
				}
			},

			d: function destroy$$1(detach) {
				if (detach) {
					detachNode(div);
				}

				removeListener(div, "click", click_handler);
			}
		};
	}

	function ColumnHeader(options) {
		this._debugName = '<ColumnHeader>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}
		if (!options.store) {
			throw new Error("<ColumnHeader> references store properties, but no store was provided");
		}

		init(this, options);
		this._state = assign(assign(this.store._init(["from","to","width"]), data$1()), options.data);
		this.store._add(this, ["from","to","width"]);

		this._recompute({ $from: 1, $to: 1, $width: 1, header: 1, columnWidth: 1, columnCount: 1 }, this._state);
		if (!('$from' in this._state)) console.warn("<ColumnHeader> was created without expected data property '$from'");
		if (!('$to' in this._state)) console.warn("<ColumnHeader> was created without expected data property '$to'");
		if (!('$width' in this._state)) console.warn("<ColumnHeader> was created without expected data property '$width'");
		if (!('header' in this._state)) console.warn("<ColumnHeader> was created without expected data property 'header'");


		if (!('width' in this._state)) console.warn("<ColumnHeader> was created without expected data property 'width'");
		this._intro = !!options.intro;

		this._handlers.destroy = [removeFromStore];

		this._fragment = create_main_fragment$3(this, this._state);

		if (options.target) {
			if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}

		this._intro = true;
	}

	assign(ColumnHeader.prototype, protoDev);

	ColumnHeader.prototype._checkReadOnly = function _checkReadOnly(newState) {
		if ('columnWidth' in newState && !this._updatingReadonlyProperty) throw new Error("<ColumnHeader>: Cannot set read-only property 'columnWidth'");
		if ('columnCount' in newState && !this._updatingReadonlyProperty) throw new Error("<ColumnHeader>: Cannot set read-only property 'columnCount'");
		if ('headers' in newState && !this._updatingReadonlyProperty) throw new Error("<ColumnHeader>: Cannot set read-only property 'headers'");
	};

	ColumnHeader.prototype._recompute = function _recompute(changed, state) {
		if (changed.$from || changed.$to || changed.$width || changed.header) {
			if (this._differs(state.columnWidth, (state.columnWidth = columnWidth(state)))) changed.columnWidth = true;
		}

		if (changed.$width || changed.columnWidth) {
			if (this._differs(state.columnCount, (state.columnCount = columnCount(state)))) changed.columnCount = true;
		}

		if (changed.$from || changed.columnWidth || changed.columnCount || changed.header || changed.$width) {
			if (this._differs(state.headers, (state.headers = headers(state)))) changed.headers = true;
		}
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

	class GanttApi {
	    constructor() {
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

	function data$2(){
	    return {
	        resizing: false,
	        widthT: null,
	        posX: null
	    }
	}
	function onstate$1({ changed, current, previous }) {
	    if(!current.resizing){
	        this.set({
	            posX: current.left,
	            widthT: current.width
	        });
	    }
	}
	const file$4 = "src\\TimeRange.html";

	function create_main_fragment$4(component, ctx) {
		var div1, div0, text_value = ctx.model.label, text, current;

		return {
			c: function create() {
				div1 = createElement("div");
				div0 = createElement("div");
				text = createText(text_value);
				div0.className = "sg-time-range-label svelte-18yq9be";
				addLoc(div0, file$4, 1, 4, 96);
				div1.className = "sg-time-range svelte-18yq9be";
				setStyle(div1, "width", "" + ctx.widthT + "px");
				setStyle(div1, "left", "" + ctx.posX + "px");
				toggleClass(div1, "moving", ctx.resizing);
				addLoc(div1, file$4, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div0, text);
				current = true;
			},

			p: function update(changed, ctx) {
				if ((changed.model) && text_value !== (text_value = ctx.model.label)) {
					setData(text, text_value);
				}

				if (changed.widthT) {
					setStyle(div1, "width", "" + ctx.widthT + "px");
				}

				if (changed.posX) {
					setStyle(div1, "left", "" + ctx.posX + "px");
				}

				if (changed.resizing) {
					toggleClass(div1, "moving", ctx.resizing);
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
		this._state = assign(data$2(), options.data);
		if (!('resizing' in this._state)) console.warn("<TimeRange> was created without expected data property 'resizing'");
		if (!('widthT' in this._state)) console.warn("<TimeRange> was created without expected data property 'widthT'");
		if (!('posX' in this._state)) console.warn("<TimeRange> was created without expected data property 'posX'");
		if (!('model' in this._state)) console.warn("<TimeRange> was created without expected data property 'model'");
		this._intro = !!options.intro;

		this._handlers.state = [onstate$1];

		onstate$1.call(this, { changed: assignTrue({}, this._state), current: this._state });

		this._fragment = create_main_fragment$4(this, this._state);

		this.root._oncreate.push(() => {
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



	function data$3(){
	    return {
	        resizing: false,
	        widthT: null,
	        posX: null
	    }
	}
	function onstate$2({ changed, current, previous }) {
	    if(!current.resizing){
	        this.set({
	            posX: current.left,
	            widthT: current.width
	        });
	    }
			}
	function drag$1(node) {
	    const { rowContainerElement, resizeHandleWidth } = this.store.get();

	    const ondrop = ({ posX, widthT, event }) => {
	        const { model } = this.get();
	        
	        const newFrom = this.root.utils.roundTo(this.root.utils.getDateByPosition(posX)); 
	        const newTo = this.root.utils.roundTo(this.root.utils.getDateByPosition(posX+widthT));
	        const newLeft = this.root.utils.getPositionByDate(newFrom);
	        const newRight = this.root.utils.getPositionByDate(newTo);
	        
	        Object.assign(model, {
	            from: newFrom,
	            to: newTo
	        });

	        var state = {
	            resizing: false,
	            left: newLeft,
	            width: newRight - newLeft,
	            model
	        };

	        updateEntity(state);
	        window.removeEventListener('mousemove', onmousemove, false);
	    };
	    
	    const updateEntity = (state) => {
	        const { model } = this.get();
	        const { timeRangeMap } = this.store.get();
	        const entity = timeRangeMap[model.id];
	        this.store.updateTimeRange({...entity, ...state});
	    };

	    return draggable(node, {
	        onDown: (state) => {
	            updateEntity({...state, resizing: true});
	        }, 
	        onResize: ({posX, widthT}) => {
	            updateEntity({posX, widthT});
	        },
	        dragAllowed: false,
	        resizeAllowed: true,
	        onDrop: ondrop, 
	        container: rowContainerElement, 
	        resizeHandleWidth
	    }, new ComponentPosProvider(this));
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
				div0.className = "sg-time-range-handle-left svelte-16dwney";
				addLoc(div0, file$5, 1, 4, 80);
				div1.className = "sg-time-range-handle-right svelte-16dwney";
				addLoc(div1, file$5, 2, 4, 140);
				div2.className = "sg-time-range-control svelte-16dwney";
				setStyle(div2, "width", "" + ctx.widthT + "px");
				setStyle(div2, "left", "" + ctx.posX + "px");
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
				if (changed.widthT) {
					setStyle(div2, "width", "" + ctx.widthT + "px");
				}

				if (changed.posX) {
					setStyle(div2, "left", "" + ctx.posX + "px");
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
		this._state = assign(data$3(), options.data);
		if (!('widthT' in this._state)) console.warn("<TimeRangeHeader> was created without expected data property 'widthT'");
		if (!('posX' in this._state)) console.warn("<TimeRangeHeader> was created without expected data property 'posX'");
		this._intro = !!options.intro;

		this._handlers.state = [onstate$2];

		onstate$2.call(this, { changed: assignTrue({}, this._state), current: this._state });

		this._fragment = create_main_fragment$5(this, this._state);

		this.root._oncreate.push(() => {
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

	/* src\Milestone.html generated by Svelte v2.16.0 */



	function selected$1({$selection, model}) {
		return $selection.indexOf(model.id) !== -1;
	}

	function row$1({$rowMap, model}) {
		return $rowMap[model.resourceId];
	}

	function data$4() {
	    return {
	        dragging: false,
	        selected: false,

	        posX: null,
	        posY: null,
	        height: 20
	    }
	}
	var methods$1 = {
	    select(event){
	        const { model } = this.get();
	        if(event.ctrlKey){
	            this.root.selectionManager.toggleSelection(model.id);
	        }
	        else{
	            this.root.selectionManager.selectSingle(model.id);
	        }
	        
	        if(this.get().selected){
	            this.root.api.tasks.raise.select(model);
	        }
	    }
	};

	function oncreate$1(){

	    const { model } = this.get();

	    const left = this.root.utils.getPositionByDate(model.from);
	    const top = this.store.get().rowMap[model.resourceId].posY + this.store.get().rowPadding;
	    const height = this.store.get().rowMap[model.resourceId].height - 2 * this.store.get().rowPadding;

	    this.set({
	        left,
	        top,
	        height
	    });

	}
	function onstate$3({ changed, current, previous }) {
	    if(!current.dragging){
	        this.set({
	            posX: current.left,
	            posY: current.top,
	        });
	    }
			}
	function drag$2(node) {
	                const { rowContainerElement } = this.store.get();

	                const ondrop = ({ posX, posY, widthT, event, dragging }) => {
	                    const { model } = this.get();
	                    const { taskMap, rowMap, rowPadding } = this.store.get();

	                    let rowChangeValid = true;
	                    //row switching
	                    if(dragging){
	                        const sourceRow = rowMap[model.resourceId];
	                        const targetRow = this.root.dndManager.getTarget('row', event);
	                        if(targetRow){
	                            model.resourceId = targetRow.model.id;
	                            this.root.api.tasks.raise.switchRow(this, targetRow, sourceRow);
	                        }
	                        else{
	                            rowChangeValid = false;
	                        }
	                    }
	                    
	                    this.set({dragging: false});
	                    const task = taskMap[model.id];
	                    if(rowChangeValid) {
	                        const newFrom = this.root.utils.roundTo(this.root.utils.getDateByPosition(posX)); 
	                        const newLeft = this.root.utils.getPositionByDate(newFrom);

	                        Object.assign(model, {
	                            from: newFrom
	                        });
	                        
	                        this.store.updateTask({
	                            ...task,
	                            left: newLeft,
	                            top: rowPadding + rowMap[model.resourceId].posY,
	                            model
	                        });
	                    }
	                    else {
	                        // reset position
	                        this.store.updateTask({
	                            ...task
	                        });
	                    }
	                };

	                return draggable(node, {
	                    onDown: ({posX, posY}) => {
	                        //this.set({posX, posY});
	                    }, 
	                    onDrag: ({posX, posY}) => {
	                        this.set({posX, posY, dragging: true});
	                    },
	                    dragAllowed: () => {
	                        const { model } = this.get();
	                        const { rowMap } = this.store.get();
	                        const row = rowMap[model.resourceId];
	                        return row.model.enableDragging && model.enableDragging
	                    },
	                    resizeAllowed: false,
	                    onDrop: ondrop, 
	                    container: rowContainerElement, 
	                }, new ComponentPosProvider(this));
	            }
	const file$6 = "src\\Milestone.html";

	function create_main_fragment$6(component, ctx) {
		var div1, div0, text0, span, text1, text2_value = ctx.posX|0, text2, text3, text4_value = ctx.posY|0, text4, text5, text6_value = ctx.left|0, text6, text7, text8_value = ctx.top|0, text8, div1_class_value, drag_action, current;

		function click_handler(event) {
			component.select(event);
		}

		return {
			c: function create() {
				div1 = createElement("div");
				div0 = createElement("div");
				text0 = createText("\r\n        ");
				span = createElement("span");
				text1 = createText("x:");
				text2 = createText(text2_value);
				text3 = createText(" y:");
				text4 = createText(text4_value);
				text5 = createText(", x:");
				text6 = createText(text6_value);
				text7 = createText(" y:");
				text8 = createText(text8_value);
				div0.className = "inside svelte-fuyhwd";
				addLoc(div0, file$6, 7, 4, 269);
				span.className = "debug";
				addLoc(span, file$6, 8, 8, 305);
				addListener(div1, "click", click_handler);
				div1.className = div1_class_value = "sg-milestone " + ctx.model.classes + " svelte-fuyhwd";
				setStyle(div1, "transform", "translate(" + ctx.posX + "px, " + ctx.posY + "px)");
				setStyle(div1, "height", "" + ctx.height + "px");
				setStyle(div1, "width", "" + ctx.height + "px");
				toggleClass(div1, "selected", ctx.selected);
				toggleClass(div1, "moving", ctx.dragging);
				addLoc(div1, file$6, 0, 0, 0);
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div1, text0);
				append(div1, span);
				append(span, text1);
				append(span, text2);
				append(span, text3);
				append(span, text4);
				append(span, text5);
				append(span, text6);
				append(span, text7);
				append(span, text8);
				component.refs.milestoneElement = div1;
				drag_action = drag$2.call(component, div1) || {};
				current = true;
			},

			p: function update(changed, ctx) {
				if ((changed.posX) && text2_value !== (text2_value = ctx.posX|0)) {
					setData(text2, text2_value);
				}

				if ((changed.posY) && text4_value !== (text4_value = ctx.posY|0)) {
					setData(text4, text4_value);
				}

				if ((changed.left) && text6_value !== (text6_value = ctx.left|0)) {
					setData(text6, text6_value);
				}

				if ((changed.top) && text8_value !== (text8_value = ctx.top|0)) {
					setData(text8, text8_value);
				}

				if ((changed.model) && div1_class_value !== (div1_class_value = "sg-milestone " + ctx.model.classes + " svelte-fuyhwd")) {
					div1.className = div1_class_value;
				}

				if (changed.posX || changed.posY) {
					setStyle(div1, "transform", "translate(" + ctx.posX + "px, " + ctx.posY + "px)");
				}

				if (changed.height) {
					setStyle(div1, "height", "" + ctx.height + "px");
					setStyle(div1, "width", "" + ctx.height + "px");
				}

				if ((changed.model || changed.selected)) {
					toggleClass(div1, "selected", ctx.selected);
				}

				if ((changed.model || changed.dragging)) {
					toggleClass(div1, "moving", ctx.dragging);
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

				removeListener(div1, "click", click_handler);
				if (component.refs.milestoneElement === div1) component.refs.milestoneElement = null;
				if (drag_action && typeof drag_action.destroy === 'function') drag_action.destroy.call(component);
			}
		};
	}

	function Milestone(options) {
		this._debugName = '<Milestone>';
		if (!options || (!options.target && !options.root)) {
			throw new Error("'target' is a required option");
		}
		if (!options.store) {
			throw new Error("<Milestone> references store properties, but no store was provided");
		}

		init(this, options);
		this.refs = {};
		this._state = assign(assign(this.store._init(["selection","rowMap"]), data$4()), options.data);
		this.store._add(this, ["selection","rowMap"]);

		this._recompute({ $selection: 1, model: 1, $rowMap: 1 }, this._state);
		if (!('$selection' in this._state)) console.warn("<Milestone> was created without expected data property '$selection'");
		if (!('model' in this._state)) console.warn("<Milestone> was created without expected data property 'model'");
		if (!('$rowMap' in this._state)) console.warn("<Milestone> was created without expected data property '$rowMap'");
		if (!('posX' in this._state)) console.warn("<Milestone> was created without expected data property 'posX'");
		if (!('posY' in this._state)) console.warn("<Milestone> was created without expected data property 'posY'");
		if (!('height' in this._state)) console.warn("<Milestone> was created without expected data property 'height'");

		if (!('dragging' in this._state)) console.warn("<Milestone> was created without expected data property 'dragging'");
		if (!('left' in this._state)) console.warn("<Milestone> was created without expected data property 'left'");
		if (!('top' in this._state)) console.warn("<Milestone> was created without expected data property 'top'");
		this._intro = !!options.intro;

		this._handlers.state = [onstate$3];

		this._handlers.destroy = [removeFromStore];

		onstate$3.call(this, { changed: assignTrue({}, this._state), current: this._state });

		this._fragment = create_main_fragment$6(this, this._state);

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

	assign(Milestone.prototype, protoDev);
	assign(Milestone.prototype, methods$1);

	Milestone.prototype._checkReadOnly = function _checkReadOnly(newState) {
		if ('selected' in newState && !this._updatingReadonlyProperty) throw new Error("<Milestone>: Cannot set read-only property 'selected'");
		if ('row' in newState && !this._updatingReadonlyProperty) throw new Error("<Milestone>: Cannot set read-only property 'row'");
	};

	Milestone.prototype._recompute = function _recompute(changed, state) {
		if (changed.$selection || changed.model) {
			if (this._differs(state.selected, (state.selected = selected$1(state)))) changed.selected = true;
		}

		if (changed.$rowMap || changed.model) {
			if (this._differs(state.row, (state.row = row$1(state)))) changed.row = true;
		}
	};

	class TaskFactory {
	    constructor(gantt) {
	        this.gantt = gantt;
	    }
	    createTask(model) {
	        // id of task, every task needs to have a unique one
	        //task.id = task.id || undefined;
	        // completion %, indicated on task
	        model.amountDone = model.amountDone || 0;
	        // css classes
	        model.classes = model.classes || '';
	        // datetime task starts on, currently moment-js object
	        model.from = model.from || null;
	        // datetime task ends on, currently moment-js object
	        model.to = model.to || null;
	        // label of task
	        model.label = model.label || undefined;
	        // html content of task, will override label
	        model.html = model.html || undefined;
	        // show button bar
	        model.showButton = model.showButton || false;
	        // button classes, useful for fontawesome icons
	        model.buttonClasses = model.buttonClasses || '';
	        // html content of button
	        model.buttonHtml = model.buttonHtml || '';
	        // enable dragging of task
	        model.enableDragging = model.enableDragging === undefined ? true : model.enableDragging;
	        const left = this.gantt.utils.getPositionByDate(model.from);
	        const right = this.gantt.utils.getPositionByDate(model.to);
	        return {
	            model,
	            left: left,
	            width: right - left,
	            height: this.getHeight(model),
	            top: this.getPosY(model)
	        };
	    }
	    row(resourceId) {
	        return this.gantt.store.get().rowMap[resourceId];
	    }
	    getHeight(model) {
	        return this.row(model.resourceId).height - 2 * this.gantt.store.get().rowPadding;
	    }
	    getPosY(model) {
	        return this.row(model.resourceId).posY + this.gantt.store.get().rowPadding;
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

	class TimeRangeFactory {
	    constructor(gantt) {
	        this.gantt = gantt;
	    }
	    create(model) {
	        // enable dragging
	        model.enableResizing = model.enableResizing === undefined ? true : model.enableResizing;
	        const left = this.gantt.utils.getPositionByDate(model.from);
	        const right = this.gantt.utils.getPositionByDate(model.to);
	        return {
	            model,
	            left: left,
	            width: right - left,
	            resizing: false
	        };
	    }
	}
	//# sourceMappingURL=timeRange.js.map

	class GanttStore extends Store {
	    constructor(data) {
	        super(Object.assign({
	            taskIds: [],
	            taskMap: {},
	            rowIds: [],
	            rowMap: {},
	            timeRangeMap: {}
	        }, data), {
	            immutable: !true
	        });
	        this.compute('allTasks', ['taskIds', 'taskMap'], (ids, entities) => {
	            return ids.map(id => entities[id]);
	        });
	        this.compute('allRows', ['rowIds', 'rowMap'], (ids, entities) => {
	            return ids.map(id => entities[id]);
	        });
	    }
	    addTask(task) {
	        const { taskIds, taskMap } = this.get();
	        const newState = add(task, { ids: taskIds, entities: taskMap });
	        this.set({ taskIds: newState.ids, taskMap: newState.entities });
	    }
	    addAllTask(tasks) {
	        const newState = addAll(tasks);
	        this.set({ taskIds: newState.ids, taskMap: newState.entities });
	    }
	    addAllRow(rows) {
	        const newState = addAll(rows);
	        this.set({ rowIds: newState.ids, rowMap: newState.entities });
	    }
	    addRow(row) {
	        const { rowIds, rowMap } = this.get();
	        const newState = add(row, { ids: rowIds, entities: rowMap });
	        this.set({ rowIds: newState.ids, rowMap: newState.entities });
	    }
	    updateTask(task) {
	        const { taskMap } = this.get();
	        this.set({ taskMap: update(task, { entities: taskMap }).entities });
	    }
	    updateRow(row) {
	        const { rowMap } = this.get();
	        this.set({ rowMap: update(row, { entities: rowMap }) });
	    }
	    addTimeRange(timeRange) {
	        const { timeRangeMap } = this.get();
	        const newState = add(timeRange, { ids: [], entities: timeRangeMap });
	        this.set({ timeRangeMap: newState.entities });
	    }
	    updateTimeRange(timeRange) {
	        const { timeRangeMap } = this.get();
	        const n = update(timeRange, { entities: timeRangeMap });
	        this.set({ timeRangeMap: n.entities });
	    }
	}
	function add(entity, state) {
	    return {
	        ids: [...state.ids, entity.model.id],
	        entities: Object.assign({}, state.entities, { [entity.model.id]: entity })
	    };
	}
	function addAll(entities) {
	    const ids = [];
	    const newEntities = {};
	    for (const entity of entities) {
	        ids.push(entity.model.id);
	        newEntities[entity.model.id] = entity;
	    }
	    return {
	        ids: ids,
	        entities: newEntities
	    };
	}
	function update(entity, state) {
	    return {
	        entities: Object.assign({}, state.entities, { [entity.model.id]: entity })
	    };
	}
	// add(entity){
	//     const { ids, entities } = this.get();
	//     this.set({
	//         ids: [ ...ids, entity.id ],
	//         entities: {
	//             ...entities,
	//             [entity.id]: entity
	//         }
	//     });
	// }
	// addMany(entityArr){
	//     const { entities } = this.get();
	//     const newEntities = {
	//         ...entities,
	//         ...entityArr
	//     }
	//     this.set({
	//         ids: Object.keys(newEntities),
	//         entities: newEntities
	//     });
	// }
	// update(entity){
	//     const { entities } = this.get();
	//     this.set({
	//         entities: {
	//             ...entities,
	//             [entity.id]: entity
	//         }
	//     });
	// }
	// remove(id){
	//     const { ids, entities } = this.get();
	//     const { [id]: entity, ...newEntities } = entities;
	//     this.set({
	//         ids: ids.filter(i => i === id),
	//         entities: newEntities
	//     });
	// }
	//# sourceMappingURL=store.js.map

	/* src\Gantt.html generated by Svelte v2.16.0 */



	let SvelteGantt;

	function columnWidth$1({$from, $to, $width, $columnOffset, $columnUnit}) {
		return getPositionByDate($from.clone().add($columnOffset, $columnUnit), $from, $to, $width);
	}

	function columnCount$1({$width, columnWidth}) {
		return Math.ceil($width / columnWidth);
	}

	function columns({$from, columnWidth, columnCount, $columnOffset, $columnUnit, $to, $width}) {
	    const columns = [];
	    const columnFrom = $from.clone();
	    for(let i = 0; i < columnCount; i++){
	        columns.push({width: columnWidth, from: columnFrom.clone(), left: getPositionByDate(columnFrom, $from, $to, $width)});
	        columnFrom.add($columnOffset, $columnUnit);
	    }
	    return columns;
	}

	function rowContainerHeight({$allRows, $rowHeight}) {
		return $allRows.length * $rowHeight;
	}

	function startIndex({$scrollTop, $rowHeight}) {
		return Math.floor($scrollTop / $rowHeight);
	}

	function endIndex({startIndex, $visibleHeight, $rowHeight, $allRows}) {
		return Math.min(startIndex + Math.ceil($visibleHeight / $rowHeight ), $allRows.length - 1);
	}

	function paddingTop({startIndex, $rowHeight}) {
		return startIndex * $rowHeight;
	}

	function paddingBottom({$allRows, endIndex, $rowHeight}) {
		return ($allRows.length - endIndex - 1) * $rowHeight;
	}

	function visibleRows({$allRows, startIndex, endIndex}) {
		return $allRows.slice(startIndex, endIndex + 1);
	}

	function visibleTasks({$taskMap, visibleRows, rowTaskMap}) {
	    const visibleTasks = [];
	    visibleRows.forEach(row => {
	        if(!rowTaskMap[row.model.id])
	            return;

	        rowTaskMap[row.model.id].forEach(id => {
	            visibleTasks.push($taskMap[id]);
	        });
	    });
	    return visibleTasks;
	}

	function rowTaskMap({$allTasks}) {
	    const reducer = (cache, task) => {
	        if(!cache[task.model.resourceId])
	            cache[task.model.resourceId] = [];

	        cache[task.model.resourceId].push(task.model.id);
	        return cache;
	    };
	    console.log('recaculated map');
	    return $allTasks.reduce(reducer, {});
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

	        rows: [],

	        paddingTop: 0,
	        paddingBottom: 0,
	        Task, Milestone,

	        zooming: false
	    }
	}
	var methods$2 = {
	    onwheel(e){
	        if(e.ctrlKey){
	            e.preventDefault();
	            const { width, zoom, zoomLevels } = this.store.get();
	            this.set({zooming:true});

	            let columnOptions = {
	                columnUnit: 'minute',
	                columnOffset: 15,
	                width
	            };

	            let newZoom = zoom;
	            if(event.deltaY > 0) {
	                newZoom --;
	            }else {
	                newZoom ++;
	            }

	            if(zoomLevels[newZoom]){
	                Object.assign(
	                    columnOptions, 
	                    zoomLevels[newZoom],
	                    { zoom: newZoom }
	                );
	            }

	            const scale = columnOptions.width / width;
	            const node = this.refs.mainContainer;
	            const mousepos = getRelativePos(node, e);
	            const before = node.scrollLeft + mousepos.x;
	            const after = before * scale;
	            const scrollLeft = after - mousepos.x;

	            this.store.set(columnOptions);
	            this.root.api.gantt.raise.viewChanged();
	            this.recalculateGanttDimensions();
	            node.scrollLeft = scrollLeft;
	            this.stoppedZooming();
	            this.refreshTasks();
	        }
	    },
	    onWindowResizeEventHandler(event){
	        this.recalculateGanttDimensions();
	        if(this.store.get().stretchTimelineWidthToFit){
	            this.refreshTasks();
	        }
	    },
	    adjustVisibleDateRange({from, to, unit}){
	        console.log(from.format(), to.format());

	        this.store.set({
	            from: from.clone(), 
	            to: to.clone()
	        });
	        this.refreshTasks();

	    },
	    recalculateGanttDimensions() {
	        const parentWidth = this.refs.ganttElement.clientWidth;
	        const parentHeight = this.refs.ganttElement.clientHeight;
	        
	        this.store.set({parentWidth});
	        
	        const tableWidth = this.store.get().tableWidth || 0;

	        const height = parentHeight - this.refs.sideContainer.clientHeight;

	        // -17 only if side scrollbar shows (rowContainerHeight > height)
	        const { rowContainerHeight } = this.get();
	        const headerWidth = rowContainerHeight > height ? parentWidth - tableWidth - V_SCROLLBAR_WIDTH :  parentWidth - tableWidth;

	        this.store.set({
	            height, headerWidth
	        });

	        if(this.store.get().stretchTimelineWidthToFit){
	            this.store.set({width: headerWidth});
	        }
	    },
	    initRows(rowsData){
	        const rows = [];
	        let y = 0;
	        for(let i=0; i < rowsData.length; i++){
	            const currentRow = rowsData[i];
	            const row = new SvelteRow(this, currentRow);
	            rows.push(row);
	            row.posY = y;
	            y += row.height;
	        }

	        this.store.addAllRow(rows);
	    },
	    initTasks(taskData){
	        const tasks = [];

	        for(let i=0; i < taskData.length; i++){
	            const currentTask = taskData[i];
	            const task = this.taskFactory.createTask(currentTask);
	            tasks.push(task);
	        }

	        this.store.addAllTask(tasks);
	        //this.selectionManager.clearSelection();
	    },
	    initTimeRanges(timeRangeData){
	        const timeRangeMap = {};

	        for(let i = 0; i < timeRangeData.length; i++){
	            const currentTimeRange = timeRangeData[i];
	            const timeRange = this.timeRangeFactory.create(currentTimeRange);
	            timeRangeMap[currentTimeRange.id] = timeRange;
	        }

	        this.store.set({timeRangeMap});
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
	            this.api = new GanttApi();
	            this.taskFactory = new TaskFactory(this);
	            this.timeRangeFactory = new TimeRangeFactory(this);
	            this.dndManager = new DragDropManager(this);


	            this.api.registerEvent('tasks', 'move');
	            this.api.registerEvent('tasks', 'select');
	            this.api.registerEvent('tasks', 'switchRow');
	            this.api.registerEvent('tasks', 'moveEnd');
	            this.api.registerEvent('tasks', 'changed');
	            
	            this.api.registerEvent('gantt', 'viewChanged');

	            this.row = SvelteRow;
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
	    updateVisibleEntities(){
	        const { _timeRanges } = this.store.get();
	        _timeRanges.forEach(timeRange => {
	            timeRange.updatePosition();
	            timeRange.updateView();
	        });
	    },
	    refreshTasks(){
	        const { allTasks } = this.store.get();
	        allTasks.forEach(task => {

	            const newLeft = this.root.utils.getPositionByDate(task.model.from);
	            const newRight = this.root.utils.getPositionByDate(task.model.to);

	            task.left = newLeft;
	            task.width = newRight - newLeft;
	        });
	        this.store.set({taskMap: this.store.get().taskMap});
	        this.updateVisibleEntities();
	    },
	    updateView(options){ // {from, to, headers, width}
	        this.store.set(options);
	        if(this.store.get().stretchTimelineWidthToFit){
	            this.recalculateGanttDimensions();
	        }

	        this.refreshTasks();

	        this.broadcastModules('updateView', options);//{ from, to, headers });
	    },
	    selectTask(id) {
	        const { taskMap } = this.get();
	        const task = taskMap[id];
	        if(task) {
	            this.selectionManager.selectSingle(task);
	        }
	    }
	};

	function oncreate$2(){
	    const {initialRows, initialTasks, initialDependencies} = this.get();

	    this.refreshTasksDebounced = debounce(() => {
	        this.refreshTasks();
	    }, 250, false);

	    this.stoppedZooming = debounce(() => {
	        this.set({zooming:false});
	    }, 250, false);

	    this.initGantt();
	    this.initRows(initialRows);
	    this.recalculateGanttDimensions();
	    this.initTasks(initialTasks);
	    this.broadcastModules('onGanttCreated');
	}
	function setup(component){
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
	        zoomLevels: [
	            {
	                headers: [{unit: 'day', format: 'DD.MM.YYYY'}, {unit: 'hour', format: 'HH'}],
	                stretchTimelineWidthToFit: true
	            },
	            {
	                headers: [{unit: 'hour', format: 'ddd D/M, H A'}, {unit: 'minute', format: 'mm', offset: 15}],
	                width: 5000,
	                stretchTimelineWidthToFit: false
	            }
	        ],
	        zoom: 0,
	        // height of a single row in px
	        rowHeight: 52,
	        rowPadding: 6,
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
	        const ganttOptions = Object.assign({
	            scrollTop: 0,
	            scrollLeft: 0
	        }, SvelteGantt.defaults, ganttModules.defaults, options);
	        
	        const store = new GanttStore(ganttOptions);


	        return new SvelteGantt({
	            target,
	            data: newData,
	            store
	        });
	    };
	}
	function scrollable(node){
	    const { scrollables } = this.get();

	    const onscroll = (event) => {
	        const {scrollTop, scrollLeft} = node; 
	        for(let i=0; i< scrollables.length; i++){
	            const scrollable = scrollables[i];
	            if(scrollable.orientation === 'horizontal') {
	                scrollable.node.scrollLeft = scrollLeft;
	            }
	            else {
	                scrollable.node.scrollTop = scrollTop;
	            }
	        }
	        //TODO: only for vertical scroll
	        this.store.set({scrollTop, scrollLeft});

	        this.broadcastModules('updateVisible', {scrollTop});
	    };

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
	const file$7 = "src\\Gantt.html";

	function get_each7_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.module = list[i];
		return child_ctx;
	}

	function get_each6_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.task = list[i];
		return child_ctx;
	}

	function get_each5_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.id = list[i][0];
		child_ctx.timeRange = list[i][1];
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
		child_ctx.id = list[i][0];
		child_ctx.timeRange = list[i][1];
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

	function create_main_fragment$7(component, ctx) {
		var div9, each0_blocks_1 = [], each0_lookup = blankObject(), text0, div2, div1, div0, text1, each2_blocks_1 = [], each2_lookup = blankObject(), horizontalScrollListener_action, text2, div8, div7, div3, text3, div5, div4, each4_blocks_1 = [], each4_lookup = blankObject(), text4, div6, each5_blocks_1 = [], each5_lookup = blankObject(), text5, each6_blocks_1 = [], each6_lookup = blankObject(), text6, each7_blocks_1 = [], each7_lookup = blankObject(), div8_resize_listener, scrollable_action, div9_class_value, current;

		function onwindowresize(event) {
			component.onWindowResizeEventHandler(event);	}
		window.addEventListener("resize", onwindowresize);

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

		var each2_value = ctx.Object.entries(ctx.$timeRangeMap);

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

		var each5_value = ctx.Object.entries(ctx.$timeRangeMap);

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

		function div8_resize_handler() {
			component.store.set({ visibleHeight: div8.clientHeight, visibleWidth: div8.clientWidth });
		}

		function wheel_handler(event) {
			component.onwheel(event);
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
				div0.className = "header-container svelte-cv6c0r";
				setStyle(div0, "width", "" + ctx.$width + "px");
				addLoc(div0, file$7, 8, 12, 499);
				div1.className = "header-intermezzo svelte-cv6c0r";
				setStyle(div1, "width", "" + ctx.$headerWidth + "px");
				addLoc(div1, file$7, 7, 8, 392);
				div2.className = "main-header-container svelte-cv6c0r";
				addLoc(div2, file$7, 6, 4, 329);
				div3.className = "column-container svelte-cv6c0r";
				addLoc(div3, file$7, 25, 12, 1267);
				setStyle(div4, "transform", "translateY(" + ctx.paddingTop + "px)");
				addLoc(div4, file$7, 31, 16, 1543);
				div5.className = "row-container svelte-cv6c0r";
				setStyle(div5, "height", "" + ctx.rowContainerHeight + "px");
				addLoc(div5, file$7, 30, 12, 1442);
				div6.className = "sg-foreground svelte-cv6c0r";
				addLoc(div6, file$7, 37, 16, 1791);
				div7.className = "content svelte-cv6c0r";
				setStyle(div7, "width", "" + ctx.$width + "px");
				addLoc(div7, file$7, 24, 8, 1207);
				component.root._aftercreate.push(div8_resize_handler);
				addListener(div8, "wheel", wheel_handler);
				div8.className = "main-container svelte-cv6c0r";
				setStyle(div8, "height", "" + ctx.$height + "px");
				toggleClass(div8, "zooming", ctx.zooming);
				addLoc(div8, file$7, 19, 4, 951);
				div9.className = div9_class_value = "gantt " + ctx.$classes + " svelte-cv6c0r";
				addLoc(div9, file$7, 1, 0, 64);
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

				div8_resize_listener = addResizeListener(div8, div8_resize_handler);
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

				const each2_value = ctx.Object.entries(ctx.$timeRangeMap);
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

				const each5_value = ctx.Object.entries(ctx.$timeRangeMap);
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

				if (changed.zooming) {
					toggleClass(div8, "zooming", ctx.zooming);
				}

				if ((!current || changed.$classes) && div9_class_value !== (div9_class_value = "gantt " + ctx.$classes + " svelte-cv6c0r")) {
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
				window.removeEventListener("resize", onwindowresize);

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

				div8_resize_listener.cancel();
				removeListener(div8, "wheel", wheel_handler);
				if (component.refs.mainContainer === div8) component.refs.mainContainer = null;
				if (scrollable_action && typeof scrollable_action.destroy === 'function') scrollable_action.destroy.call(component);
				if (component.refs.ganttElement === div9) component.refs.ganttElement = null;
			}
		};
	}

	// (3:4) {#each _ganttTableModules as module (module.key)}
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

	// (10:16) {#each $headers as header}
	function create_each_block_6(component, ctx) {
		var current;

		var columnheader_initial_data = { header: ctx.header };
		var columnheader = new ColumnHeader({
			root: component.root,
			store: component.store,
			data: columnheader_initial_data
		});

		columnheader.on("selectDateTime", function(event) {
			component.adjustVisibleDateRange(event);
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

	// (13:16) {#each Object.entries($timeRangeMap) as [id, timeRange] (timeRange.id)}
	function create_each_block_5(component, key_1, ctx) {
		var first, current;

		var timerangeheader_spread_levels = [
			ctx.timeRange
		];

		var timerangeheader_initial_data = {};
		for (var i = 0; i < timerangeheader_spread_levels.length; i += 1) {
			timerangeheader_initial_data = assign(timerangeheader_initial_data, timerangeheader_spread_levels[i]);
		}
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
				var timerangeheader_changes = (changed.Object || changed.$timeRangeMap) ? getSpreadUpdate(timerangeheader_spread_levels, [
					ctx.timeRange
				]) : {};
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

	// (27:16) {#each columns as column}
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

	// (33:20) {#each visibleRows as row (row.model.id)}
	function create_each_block_3(component, key_1, ctx) {
		var first, current;

		var row_initial_data = { row: ctx.row };
		var row = new Row({
			root: component.root,
			store: component.store,
			data: row_initial_data
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

	// (39:20) {#each Object.entries($timeRangeMap) as [id, timeRange] (timeRange.id)}
	function create_each_block_2(component, key_1, ctx) {
		var first, current;

		var timerange_spread_levels = [
			ctx.timeRange
		];

		var timerange_initial_data = {};
		for (var i = 0; i < timerange_spread_levels.length; i += 1) {
			timerange_initial_data = assign(timerange_initial_data, timerange_spread_levels[i]);
		}
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
				var timerange_changes = (changed.Object || changed.$timeRangeMap) ? getSpreadUpdate(timerange_spread_levels, [
					ctx.timeRange
				]) : {};
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

	// (43:20) {#each visibleTasks as task (task.model.id)}
	function create_each_block_1(component, key_1, ctx) {
		var first, switch_instance_anchor, current;

		var switch_value = ctx.task.model.type === 'milestone' ? ctx.Milestone : ctx.Task;

		function switch_props(ctx) {
			var switch_instance_initial_data = {
			 	model: ctx.task.model,
			 	left: ctx.task.left,
			 	width: ctx.task.width,
			 	height: ctx.task.height,
			 	top: ctx.task.top
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
				if (changed.visibleTasks) switch_instance_changes.model = ctx.task.model;
				if (changed.visibleTasks) switch_instance_changes.left = ctx.task.left;
				if (changed.visibleTasks) switch_instance_changes.width = ctx.task.width;
				if (changed.visibleTasks) switch_instance_changes.height = ctx.task.height;
				if (changed.visibleTasks) switch_instance_changes.top = ctx.task.top;

				if (switch_value !== (switch_value = ctx.task.model.type === 'milestone' ? ctx.Milestone : ctx.Task)) {
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
		this._state = assign(assign(assign({ Object : Object }, this.store._init(["from","to","width","columnOffset","columnUnit","allRows","rowHeight","scrollTop","visibleHeight","taskMap","allTasks","classes","headerWidth","headers","timeRangeMap","height","visibleWidth"])), data$5()), options.data);
		this.store._add(this, ["from","to","width","columnOffset","columnUnit","allRows","rowHeight","scrollTop","visibleHeight","taskMap","allTasks","classes","headerWidth","headers","timeRangeMap","height","visibleWidth"]);

		this._recompute({ $from: 1, $to: 1, $width: 1, $columnOffset: 1, $columnUnit: 1, columnWidth: 1, columnCount: 1, $allRows: 1, $rowHeight: 1, $scrollTop: 1, startIndex: 1, $visibleHeight: 1, endIndex: 1, $allTasks: 1, $taskMap: 1, visibleRows: 1, rowTaskMap: 1 }, this._state);
		if (!('$from' in this._state)) console.warn("<Gantt> was created without expected data property '$from'");
		if (!('$to' in this._state)) console.warn("<Gantt> was created without expected data property '$to'");
		if (!('$width' in this._state)) console.warn("<Gantt> was created without expected data property '$width'");
		if (!('$columnOffset' in this._state)) console.warn("<Gantt> was created without expected data property '$columnOffset'");
		if (!('$columnUnit' in this._state)) console.warn("<Gantt> was created without expected data property '$columnUnit'");


		if (!('$allRows' in this._state)) console.warn("<Gantt> was created without expected data property '$allRows'");
		if (!('$rowHeight' in this._state)) console.warn("<Gantt> was created without expected data property '$rowHeight'");
		if (!('$scrollTop' in this._state)) console.warn("<Gantt> was created without expected data property '$scrollTop'");

		if (!('$visibleHeight' in this._state)) console.warn("<Gantt> was created without expected data property '$visibleHeight'");

		if (!('$taskMap' in this._state)) console.warn("<Gantt> was created without expected data property '$taskMap'");


		if (!('$allTasks' in this._state)) console.warn("<Gantt> was created without expected data property '$allTasks'");
		if (!('$classes' in this._state)) console.warn("<Gantt> was created without expected data property '$classes'");
		if (!('_ganttTableModules' in this._state)) console.warn("<Gantt> was created without expected data property '_ganttTableModules'");



		if (!('$headerWidth' in this._state)) console.warn("<Gantt> was created without expected data property '$headerWidth'");
		if (!('$headers' in this._state)) console.warn("<Gantt> was created without expected data property '$headers'");

		if (!('$timeRangeMap' in this._state)) console.warn("<Gantt> was created without expected data property '$timeRangeMap'");
		if (!('$height' in this._state)) console.warn("<Gantt> was created without expected data property '$height'");
		if (!('zooming' in this._state)) console.warn("<Gantt> was created without expected data property 'zooming'");
		if (!('$visibleWidth' in this._state)) console.warn("<Gantt> was created without expected data property '$visibleWidth'");


		if (!('Milestone' in this._state)) console.warn("<Gantt> was created without expected data property 'Milestone'");
		if (!('Task' in this._state)) console.warn("<Gantt> was created without expected data property 'Task'");
		if (!('_ganttBodyModules' in this._state)) console.warn("<Gantt> was created without expected data property '_ganttBodyModules'");
		this._intro = !!options.intro;

		this._handlers.destroy = [removeFromStore];

		this._fragment = create_main_fragment$7(this, this._state);

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

	assign(Gantt.prototype, protoDev);
	assign(Gantt.prototype, methods$2);

	Gantt.prototype._checkReadOnly = function _checkReadOnly(newState) {
		if ('columnWidth' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'columnWidth'");
		if ('columnCount' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'columnCount'");
		if ('columns' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'columns'");
		if ('rowContainerHeight' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'rowContainerHeight'");
		if ('startIndex' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'startIndex'");
		if ('endIndex' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'endIndex'");
		if ('paddingTop' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'paddingTop'");
		if ('paddingBottom' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'paddingBottom'");
		if ('visibleRows' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'visibleRows'");
		if ('rowTaskMap' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'rowTaskMap'");
		if ('visibleTasks' in newState && !this._updatingReadonlyProperty) throw new Error("<Gantt>: Cannot set read-only property 'visibleTasks'");
	};

	Gantt.prototype._recompute = function _recompute(changed, state) {
		if (changed.$from || changed.$to || changed.$width || changed.$columnOffset || changed.$columnUnit) {
			if (this._differs(state.columnWidth, (state.columnWidth = columnWidth$1(state)))) changed.columnWidth = true;
		}

		if (changed.$width || changed.columnWidth) {
			if (this._differs(state.columnCount, (state.columnCount = columnCount$1(state)))) changed.columnCount = true;
		}

		if (changed.$from || changed.columnWidth || changed.columnCount || changed.$columnOffset || changed.$columnUnit || changed.$to || changed.$width) {
			if (this._differs(state.columns, (state.columns = columns(state)))) changed.columns = true;
		}

		if (changed.$allRows || changed.$rowHeight) {
			if (this._differs(state.rowContainerHeight, (state.rowContainerHeight = rowContainerHeight(state)))) changed.rowContainerHeight = true;
		}

		if (changed.$scrollTop || changed.$rowHeight) {
			if (this._differs(state.startIndex, (state.startIndex = startIndex(state)))) changed.startIndex = true;
		}

		if (changed.startIndex || changed.$visibleHeight || changed.$rowHeight || changed.$allRows) {
			if (this._differs(state.endIndex, (state.endIndex = endIndex(state)))) changed.endIndex = true;
		}

		if (changed.startIndex || changed.$rowHeight) {
			if (this._differs(state.paddingTop, (state.paddingTop = paddingTop(state)))) changed.paddingTop = true;
		}

		if (changed.$allRows || changed.endIndex || changed.$rowHeight) {
			if (this._differs(state.paddingBottom, (state.paddingBottom = paddingBottom(state)))) changed.paddingBottom = true;
		}

		if (changed.$allRows || changed.startIndex || changed.endIndex) {
			if (this._differs(state.visibleRows, (state.visibleRows = visibleRows(state)))) changed.visibleRows = true;
		}

		if (changed.$allTasks) {
			if (this._differs(state.rowTaskMap, (state.rowTaskMap = rowTaskMap(state)))) changed.rowTaskMap = true;
		}

		if (changed.$taskMap || changed.visibleRows || changed.rowTaskMap) {
			if (this._differs(state.visibleTasks, (state.visibleTasks = visibleTasks(state)))) changed.visibleTasks = true;
		}
	};

	setup(Gantt);

	return Gantt;

}());
//# sourceMappingURL=svelteGantt.js.map
