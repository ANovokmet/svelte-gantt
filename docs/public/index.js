var app = (function (moment$1) {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function noop$1() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location$1(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run$1(fn) {
        return fn();
    }
    function blank_object$1() {
        return Object.create(null);
    }
    function run_all$1(fns) {
        fns.forEach(run$1);
    }
    function is_function$1(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal$1(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function$1(action_result.destroy) ? action_result.destroy : noop$1;
    }

    function append$1(target, node) {
        target.appendChild(node);
    }
    function insert$1(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach$1(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element$1(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text$1(data) {
        return document.createTextNode(data);
    }
    function space$1() {
        return text$1(' ');
    }
    function empty() {
        return text$1('');
    }
    function listen$1(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr$1(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children$1(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        const z_index = (parseInt(computed_style.zIndex) || 0) - 1;
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element$1('iframe');
        iframe.setAttribute('style', `display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ` +
            `overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: ${z_index};`);
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = `data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>`;
            unsubscribe = listen$1(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen$1(iframe.contentWindow, 'resize', fn);
            };
        }
        append$1(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach$1(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event$1(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element$1(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert$1(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach$1);
        }
    }

    let current_component$1;
    function set_current_component$1(component) {
        current_component$1 = component;
    }
    function get_current_component$1() {
        if (!current_component$1)
            throw new Error(`Function called outside component initialization`);
        return current_component$1;
    }
    function beforeUpdate(fn) {
        get_current_component$1().$$.before_update.push(fn);
    }
    function onMount$1(fn) {
        get_current_component$1().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component$1().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component$1().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component$1();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event$1(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component$1().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component$1().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components$1 = [];
    const binding_callbacks$1 = [];
    const render_callbacks$1 = [];
    const flush_callbacks$1 = [];
    const resolved_promise$1 = Promise.resolve();
    let update_scheduled$1 = false;
    function schedule_update$1() {
        if (!update_scheduled$1) {
            update_scheduled$1 = true;
            resolved_promise$1.then(flush$1);
        }
    }
    function tick() {
        schedule_update$1();
        return resolved_promise$1;
    }
    function add_render_callback$1(fn) {
        render_callbacks$1.push(fn);
    }
    let flushing$1 = false;
    const seen_callbacks$1 = new Set();
    function flush$1() {
        if (flushing$1)
            return;
        flushing$1 = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components$1.length; i += 1) {
                const component = dirty_components$1[i];
                set_current_component$1(component);
                update$1(component.$$);
            }
            dirty_components$1.length = 0;
            while (binding_callbacks$1.length)
                binding_callbacks$1.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks$1.length; i += 1) {
                const callback = render_callbacks$1[i];
                if (!seen_callbacks$1.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks$1.add(callback);
                    callback();
                }
            }
            render_callbacks$1.length = 0;
        } while (dirty_components$1.length);
        while (flush_callbacks$1.length) {
            flush_callbacks$1.pop()();
        }
        update_scheduled$1 = false;
        flushing$1 = false;
        seen_callbacks$1.clear();
    }
    function update$1($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all$1($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback$1);
        }
    }
    const outroing$1 = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all$1(outros.c);
        }
        outros = outros.p;
    }
    function transition_in$1(block, local) {
        if (block && block.i) {
            outroing$1.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing$1.has(block))
                return;
            outroing$1.add(block);
            outros.c.push(() => {
                outroing$1.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals$1 = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in$1(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component$1(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback$1(() => {
            const new_on_destroy = on_mount.map(run$1).filter(is_function$1);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all$1(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback$1);
    }
    function destroy_component$1(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all$1($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty$1(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components$1.push(component);
            schedule_update$1();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init$1(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component$1;
        set_current_component$1(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object$1(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object$1(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty$1(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all$1($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children$1(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach$1);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in$1(component.$$.fragment);
            mount_component$1(component, options.target, options.anchor);
            flush$1();
        }
        set_current_component$1(parent_component);
    }
    class SvelteComponent$1 {
        $destroy() {
            destroy_component$1(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev$1(type, detail) {
        document.dispatchEvent(custom_event$1(type, Object.assign({ version: '3.23.0' }, detail)));
    }
    function append_dev$1(target, node) {
        dispatch_dev$1("SvelteDOMInsert", { target, node });
        append$1(target, node);
    }
    function insert_dev$1(target, node, anchor) {
        dispatch_dev$1("SvelteDOMInsert", { target, node, anchor });
        insert$1(target, node, anchor);
    }
    function detach_dev$1(node) {
        dispatch_dev$1("SvelteDOMRemove", { node });
        detach$1(node);
    }
    function listen_dev$1(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev$1("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen$1(node, event, handler, options);
        return () => {
            dispatch_dev$1("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev$1(node, attribute, value) {
        attr$1(node, attribute, value);
        if (value == null)
            dispatch_dev$1("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev$1("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev$1(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev$1("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots$1(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev$1 extends SvelteComponent$1 {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal$1(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop$1;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function$1(result) ? result : noop$1;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all$1(unsubscribers);
                cleanup();
            };
        });
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function createEntityStore() {
        const { subscribe, set, update } = writable({ ids: [], entities: {} });
        return {
            set,
            _update: update,
            subscribe,
            add: (item) => update(({ ids, entities }) => ({
                ids: [...ids, item.model.id],
                entities: Object.assign(Object.assign({}, entities), { [item.model.id]: item })
            })),
            delete: (id) => update(state => {
                const _a = state.entities, _b = id, _ = _a[_b], entities = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
                return {
                    ids: state.ids.filter(i => i !== id),
                    entities
                };
            }),
            deleteAll: (ids) => update(state => {
                const entities = Object.assign({}, state.entities);
                const idState = {};
                ids.forEach(id => {
                    delete entities[id];
                    idState[id] = true;
                });
                return {
                    ids: state.ids.filter(i => !idState[i]),
                    entities
                };
            }),
            update: (item) => update(({ ids, entities }) => ({
                ids,
                entities: Object.assign(Object.assign({}, entities), { [item.model.id]: item })
            })),
            upsert: (item) => update(({ ids, entities }) => {
                const hasIndex = ids.indexOf(item.model.id) !== -1;
                return {
                    ids: hasIndex ? ids : [...ids, item.model.id],
                    entities: Object.assign(Object.assign({}, entities), { [item.model.id]: item })
                };
            }),
            upsertAll: (items) => update(state => {
                const entities = Object.assign({}, state.entities);
                const ids = [...state.ids];
                items.forEach(item => {
                    if (!entities[item.model.id]) {
                        ids.push(item.model.id);
                    }
                    entities[item.model.id] = item;
                });
                return {
                    ids,
                    entities
                };
            }),
            addAll: (items) => {
                const ids = [];
                const entities = {};
                for (const entity of items) {
                    ids.push(entity.model.id);
                    entities[entity.model.id] = entity;
                }
                set({ ids, entities });
            },
            refresh: () => update(store => (Object.assign({}, store)))
        };
    }
    const taskStore = createEntityStore();
    const rowStore = createEntityStore();
    const timeRangeStore = createEntityStore();
    const allTasks = all(taskStore);
    const allRows = all(rowStore);
    const allTimeRanges = all(timeRangeStore);
    const rowTaskCache = derived(allTasks, $allTasks => {
        return $allTasks.reduce((cache, task) => {
            if (!cache[task.model.resourceId])
                cache[task.model.resourceId] = [];
            cache[task.model.resourceId].push(task.model.id);
            return cache;
        }, {});
    });
    function all(store) {
        return derived(store, ({ ids, entities }) => ids.map(id => entities[id]));
    }

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
    function throttle(func, limit) {
        var wait = false;
        return function () {
            if (!wait) {
                func.apply(null, arguments);
                wait = true;
                setTimeout(function () {
                    wait = false;
                }, limit);
            }
        };
    }

    const H_SCROLLBAR_WIDTH = 17;
    const MIN_DRAG_X = 2;
    const MIN_DRAG_Y = 2;

    /**
     * Applies dragging interaction to gantt elements
     */
    class Draggable {
        constructor(node, settings) {
            this.dragging = false;
            this.resizing = false;
            this.resizeTriggered = false;
            this.onmousedown = (event) => {
                if (!isLeftClick(event)) {
                    return;
                }
                event.stopPropagation();
                event.preventDefault();
                const canDrag = this.dragAllowed;
                const canResize = this.resizeAllowed;
                if (canDrag || canResize) {
                    const x = this.settings.getX(event);
                    const y = this.settings.getY(event);
                    const width = this.settings.getWidth();
                    this.initialX = event.clientX;
                    this.initialY = event.clientY;
                    this.mouseStartPosX = getRelativePos(this.settings.container, event).x - x;
                    this.mouseStartPosY = getRelativePos(this.settings.container, event).y - y;
                    this.mouseStartRight = x + width;
                    if (canResize && this.mouseStartPosX < this.settings.resizeHandleWidth) {
                        this.direction = 'left';
                        this.resizing = true;
                    }
                    if (canResize && this.mouseStartPosX > width - this.settings.resizeHandleWidth) {
                        this.direction = 'right';
                        this.resizing = true;
                    }
                    if (canDrag && !this.resizing) {
                        this.dragging = true;
                    }
                    if ((this.dragging || this.resizing) && this.settings.onDown) {
                        this.settings.onDown({
                            mouseEvent: event,
                            x,
                            width,
                            y,
                            resizing: this.resizing,
                            dragging: this.dragging
                        });
                    }
                    window.addEventListener('mousemove', this.onmousemove, false);
                    addEventListenerOnce(window, 'mouseup', this.onmouseup);
                }
            };
            this.onmousemove = (event) => {
                if (!this.resizeTriggered) {
                    if (Math.abs(event.clientX - this.initialX) > MIN_DRAG_X || Math.abs(event.clientY - this.initialY) > MIN_DRAG_Y) {
                        this.resizeTriggered = true;
                    }
                    else {
                        return;
                    }
                }
                event.preventDefault();
                if (this.resizing) {
                    const mousePos = getRelativePos(this.settings.container, event);
                    const x = this.settings.getX(event);
                    const width = this.settings.getWidth();
                    let resultX;
                    let resultWidth;
                    if (this.direction === 'left') { //resize ulijevo
                        if (mousePos.x > x + width) {
                            this.direction = 'right';
                            resultX = this.mouseStartRight;
                            resultWidth = this.mouseStartRight - mousePos.x;
                            this.mouseStartRight = this.mouseStartRight + width;
                        }
                        else {
                            resultX = mousePos.x;
                            resultWidth = this.mouseStartRight - mousePos.x;
                        }
                    }
                    else if (this.direction === 'right') { //resize desno
                        if (mousePos.x <= x) {
                            this.direction = 'left';
                            resultX = mousePos.x;
                            resultWidth = x - mousePos.x;
                            this.mouseStartRight = x;
                        }
                        else {
                            resultX = x;
                            resultWidth = mousePos.x - x;
                        }
                    }
                    this.settings.onResize && this.settings.onResize({
                        mouseEvent: event,
                        x: resultX,
                        width: resultWidth
                    });
                }
                // mouseup
                if (this.dragging && this.settings.onDrag) {
                    const mousePos = getRelativePos(this.settings.container, event);
                    this.settings.onDrag({
                        mouseEvent: event,
                        x: mousePos.x - this.mouseStartPosX,
                        y: mousePos.y - this.mouseStartPosY
                    });
                }
            };
            this.onmouseup = (event) => {
                const x = this.settings.getX(event);
                const y = this.settings.getY(event);
                const width = this.settings.getWidth();
                this.settings.onMouseUp && this.settings.onMouseUp();
                if (this.resizeTriggered && this.settings.onDrop) {
                    this.settings.onDrop({
                        mouseEvent: event,
                        x,
                        y,
                        width,
                        dragging: this.dragging,
                        resizing: this.resizing
                    });
                }
                this.dragging = false;
                this.resizing = false;
                this.direction = null;
                this.resizeTriggered = false;
                window.removeEventListener('mousemove', this.onmousemove, false);
            };
            this.settings = settings;
            this.node = node;
            node.addEventListener('mousedown', this.onmousedown, false);
        }
        get dragAllowed() {
            if (typeof (this.settings.dragAllowed) === 'function') {
                return this.settings.dragAllowed();
            }
            else {
                return this.settings.dragAllowed;
            }
        }
        get resizeAllowed() {
            if (typeof (this.settings.resizeAllowed) === 'function') {
                return this.settings.resizeAllowed();
            }
            else {
                return this.settings.resizeAllowed;
            }
        }
        destroy() {
            this.node.removeEventListener('mousedown', this.onmousedown, false);
            this.node.removeEventListener('mousemove', this.onmousemove, false);
            this.node.removeEventListener('mouseup', this.onmouseup, false);
        }
    }

    class DragDropManager {
        constructor(rowStore) {
            this.handlerMap = {};
            this.register('row', (event) => {
                let elements = document.elementsFromPoint(event.clientX, event.clientY);
                let rowElement = elements.find((element) => !!element.getAttribute('data-row-id'));
                if (rowElement !== undefined) {
                    const rowId = parseInt(rowElement.getAttribute('data-row-id'));
                    const { entities } = get_store_value(rowStore);
                    const targetRow = entities[rowId];
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

    class TaskFactory {
        constructor(columnService) {
            this.columnService = columnService;
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
            const left = this.columnService.getPositionByDate(model.from) | 0;
            const right = this.columnService.getPositionByDate(model.to) | 0;
            return {
                model,
                left: left,
                width: right - left,
                height: this.getHeight(model),
                top: this.getPosY(model),
                reflections: []
            };
        }
        createTasks(tasks) {
            return tasks.map(task => this.createTask(task));
        }
        row(resourceId) {
            return this.rowEntities[resourceId];
        }
        getHeight(model) {
            return this.row(model.resourceId).height - 2 * this.rowPadding;
        }
        getPosY(model) {
            return this.row(model.resourceId).y + this.rowPadding;
        }
    }
    function reflectTask(task, row, options) {
        const reflectedId = `reflected-task-${task.model.id}-${row.model.id}`;
        const model = Object.assign(Object.assign({}, task.model), { resourceId: row.model.id, id: reflectedId, enableDragging: false });
        return Object.assign(Object.assign({}, task), { model, top: row.y + options.rowPadding, reflected: true, reflectedOnParent: false, reflectedOnChild: true, originalId: task.model.id });
    }

    /* src\entities\Task.svelte generated by Svelte v3.23.0 */
    const file = "src\\entities\\Task.svelte";

    // (281:2) {#if model.amountDone}
    function create_if_block_4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			attr_dev$1(div, "class", "sg-task-background svelte-19txnoa");
    			set_style(div, "width", /*model*/ ctx[0].amountDone + "%");
    			add_location$1(div, file, 281, 2, 8357);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*model*/ 1) {
    				set_style(div, "width", /*model*/ ctx[0].amountDone + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(281:2) {#if model.amountDone}",
    		ctx
    	});

    	return block;
    }

    // (289:4) {:else}
    function create_else_block(ctx) {
    	let t_value = /*model*/ ctx[0].label + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text$1(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*model*/ 1 && t_value !== (t_value = /*model*/ ctx[0].label + "")) set_data_dev$1(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(t);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(289:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (287:27) 
    function create_if_block_3(ctx) {
    	let html_tag;
    	let raw_value = /*$taskContent*/ ctx[8](this) + "";

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag(null);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$taskContent*/ 256 && raw_value !== (raw_value = /*$taskContent*/ ctx[8](this) + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(287:27) ",
    		ctx
    	});

    	return block;
    }

    // (285:4) {#if model.html}
    function create_if_block_2(ctx) {
    	let html_tag;
    	let raw_value = /*model*/ ctx[0].html + "";

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag(null);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*model*/ 1 && raw_value !== (raw_value = /*model*/ ctx[0].html + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(285:4) {#if model.html}",
    		ctx
    	});

    	return block;
    }

    // (291:4) {#if model.showButton}
    function create_if_block_1(ctx) {
    	let span;
    	let raw_value = /*model*/ ctx[0].buttonHtml + "";
    	let span_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element$1("span");
    			attr_dev$1(span, "class", span_class_value = "sg-task-button " + /*model*/ ctx[0].buttonClasses + " svelte-19txnoa");
    			add_location$1(span, file, 291, 6, 8736);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, span, anchor);
    			span.innerHTML = raw_value;

    			if (!mounted) {
    				dispose = listen_dev$1(span, "click", /*onclick*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*model*/ 1 && raw_value !== (raw_value = /*model*/ ctx[0].buttonHtml + "")) span.innerHTML = raw_value;
    			if (dirty[0] & /*model*/ 1 && span_class_value !== (span_class_value = "sg-task-button " + /*model*/ ctx[0].buttonClasses + " svelte-19txnoa")) {
    				attr_dev$1(span, "class", span_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(291:4) {#if model.showButton}",
    		ctx
    	});

    	return block;
    }

    // (298:2) {#if model.labelBottom}
    function create_if_block(ctx) {
    	let label;
    	let t_value = /*model*/ ctx[0].labelBottom + "";
    	let t;

    	const block = {
    		c: function create() {
    			label = element$1("label");
    			t = text$1(t_value);
    			attr_dev$1(label, "class", "sg-label-bottom svelte-19txnoa");
    			add_location$1(label, file, 298, 4, 8911);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, label, anchor);
    			append_dev$1(label, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*model*/ 1 && t_value !== (t_value = /*model*/ ctx[0].labelBottom + "")) set_data_dev$1(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(label);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(298:2) {#if model.labelBottom}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let t1;
    	let t2;
    	let div1_data_task_id_value;
    	let div1_class_value;
    	let drag_action;
    	let mounted;
    	let dispose;
    	let if_block0 = /*model*/ ctx[0].amountDone && create_if_block_4(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*model*/ ctx[0].html) return create_if_block_2;
    		if (/*$taskContent*/ ctx[8]) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);
    	let if_block2 = /*model*/ ctx[0].showButton && create_if_block_1(ctx);
    	let if_block3 = /*model*/ ctx[0].labelBottom && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element$1("div");
    			if (if_block0) if_block0.c();
    			t0 = space$1();
    			div0 = element$1("div");
    			if_block1.c();
    			t1 = space$1();
    			if (if_block2) if_block2.c();
    			t2 = space$1();
    			if (if_block3) if_block3.c();
    			attr_dev$1(div0, "class", "sg-task-content svelte-19txnoa");
    			add_location$1(div0, file, 283, 2, 8438);
    			attr_dev$1(div1, "data-task-id", div1_data_task_id_value = /*model*/ ctx[0].id);
    			attr_dev$1(div1, "class", div1_class_value = "sg-task " + /*model*/ ctx[0].classes + " svelte-19txnoa");
    			set_style(div1, "width", /*_position*/ ctx[6].width + "px");
    			set_style(div1, "height", /*height*/ ctx[1] + "px");
    			set_style(div1, "transform", "translate(" + /*_position*/ ctx[6].x + "px, " + /*_position*/ ctx[6].y + "px)");
    			toggle_class(div1, "moving", /*_dragging*/ ctx[4] || /*_resizing*/ ctx[5]);
    			toggle_class(div1, "selected", /*selected*/ ctx[7]);
    			toggle_class(div1, "animating", /*animating*/ ctx[9]);
    			toggle_class(div1, "sg-task-reflected", /*reflected*/ ctx[2]);
    			add_location$1(div1, file, 271, 0, 8016);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev$1(div1, t0);
    			append_dev$1(div1, div0);
    			if_block1.m(div0, null);
    			append_dev$1(div0, t1);
    			if (if_block2) if_block2.m(div0, null);
    			append_dev$1(div1, t2);
    			if (if_block3) if_block3.m(div1, null);

    			if (!mounted) {
    				dispose = action_destroyer(drag_action = /*drag*/ ctx[12].call(null, div1));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*model*/ ctx[0].amountDone) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div0, t1);
    				}
    			}

    			if (/*model*/ ctx[0].showButton) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(div0, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*model*/ ctx[0].labelBottom) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(div1, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty[0] & /*model*/ 1 && div1_data_task_id_value !== (div1_data_task_id_value = /*model*/ ctx[0].id)) {
    				attr_dev$1(div1, "data-task-id", div1_data_task_id_value);
    			}

    			if (dirty[0] & /*model*/ 1 && div1_class_value !== (div1_class_value = "sg-task " + /*model*/ ctx[0].classes + " svelte-19txnoa")) {
    				attr_dev$1(div1, "class", div1_class_value);
    			}

    			if (dirty[0] & /*_position*/ 64) {
    				set_style(div1, "width", /*_position*/ ctx[6].width + "px");
    			}

    			if (dirty[0] & /*height*/ 2) {
    				set_style(div1, "height", /*height*/ ctx[1] + "px");
    			}

    			if (dirty[0] & /*_position*/ 64) {
    				set_style(div1, "transform", "translate(" + /*_position*/ ctx[6].x + "px, " + /*_position*/ ctx[6].y + "px)");
    			}

    			if (dirty[0] & /*model, _dragging, _resizing*/ 49) {
    				toggle_class(div1, "moving", /*_dragging*/ ctx[4] || /*_resizing*/ ctx[5]);
    			}

    			if (dirty[0] & /*model, selected*/ 129) {
    				toggle_class(div1, "selected", /*selected*/ ctx[7]);
    			}

    			if (dirty[0] & /*model, animating*/ 513) {
    				toggle_class(div1, "animating", /*animating*/ ctx[9]);
    			}

    			if (dirty[0] & /*model, reflected*/ 5) {
    				toggle_class(div1, "sg-task-reflected", /*reflected*/ ctx[2]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div1);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $rowStore;
    	let $taskStore;
    	let $rowPadding;
    	let $selection;
    	let $taskContent;
    	validate_store(rowStore, "rowStore");
    	component_subscribe($$self, rowStore, $$value => $$invalidate(18, $rowStore = $$value));
    	validate_store(taskStore, "taskStore");
    	component_subscribe($$self, taskStore, $$value => $$invalidate(19, $taskStore = $$value));
    	let { model } = $$props;
    	let { height } = $$props;
    	let { left } = $$props;
    	let { top } = $$props;
    	let { width } = $$props;
    	let { reflected = false } = $$props;
    	let animating = true;
    	let _dragging = false;
    	let _resizing = false;
    	let _position = { x: left, y: top, width };

    	function updatePosition(x, y, width) {
    		if (!_dragging && !_resizing) {
    			$$invalidate(6, _position.x = x, _position);
    			$$invalidate(6, _position.y = y, _position); //row.y + 6;
    			$$invalidate(6, _position.width = width, _position);
    		} // should NOT animate on resize/update of columns
    	}

    	const { dimensionsChanged } = getContext("dimensions");
    	const { rowContainer } = getContext("gantt");
    	const { taskContent, resizeHandleWidth, rowPadding, onTaskButtonClick, reflectOnParentRows, reflectOnChildRows } = getContext("options");
    	validate_store(taskContent, "taskContent");
    	component_subscribe($$self, taskContent, value => $$invalidate(8, $taskContent = value));
    	validate_store(rowPadding, "rowPadding");
    	component_subscribe($$self, rowPadding, value => $$invalidate(20, $rowPadding = value));
    	const { dndManager, api, utils, selectionManager, columnService } = getContext("services");

    	function drag(node) {
    		const ondrop = event => {
    			let rowChangeValid = true;

    			//row switching
    			if (event.dragging) {
    				const sourceRow = $rowStore.entities[model.resourceId];
    				const targetRow = dndManager.getTarget("row", event.mouseEvent);

    				if (targetRow) {
    					$$invalidate(0, model.resourceId = targetRow.model.id, model);
    					api.tasks.raise.switchRow(this, targetRow, sourceRow);
    				} else {
    					rowChangeValid = false;
    				}
    			}

    			$$invalidate(4, _dragging = $$invalidate(5, _resizing = false));
    			const task = $taskStore.entities[model.id];

    			if (rowChangeValid) {
    				const newFrom = $$invalidate(0, model.from = utils.roundTo(columnService.getDateByPosition(event.x)), model);
    				const newTo = $$invalidate(0, model.to = utils.roundTo(columnService.getDateByPosition(event.x + event.width)), model);
    				const newLeft = columnService.getPositionByDate(newFrom) | 0;
    				const newRight = columnService.getPositionByDate(newTo) | 0;
    				const targetRow = $rowStore.entities[model.resourceId];
    				const left = newLeft;
    				const width = newRight - newLeft;
    				const top = $rowPadding + targetRow.y;
    				updatePosition(left, top, width);
    				const newTask = { ...task, left, width, top, model };
    				taskStore.update(newTask);

    				// update shadow tasks
    				if (newTask.reflections) {
    					taskStore.deleteAll(newTask.reflections);
    				}

    				const reflectedTasks = [];

    				if (reflectOnChildRows && targetRow.allChildren) {
    					if (!newTask.reflections) newTask.reflections = [];
    					const opts = { rowPadding: $rowPadding };

    					targetRow.allChildren.forEach(r => {
    						const reflectedTask = reflectTask(newTask, r, opts);
    						newTask.reflections.push(reflectedTask.model.id);
    						reflectedTasks.push(reflectedTask);
    					});
    				}

    				if (reflectOnParentRows && targetRow.allParents.length > 0) {
    					if (!newTask.reflections) newTask.reflections = [];
    					const opts = { rowPadding: $rowPadding };

    					targetRow.allParents.forEach(r => {
    						const reflectedTask = reflectTask(newTask, r, opts);
    						newTask.reflections.push(reflectedTask.model.id);
    						reflectedTasks.push(reflectedTask);
    					});
    				}

    				if (reflectedTasks.length > 0) {
    					taskStore.upsertAll(reflectedTasks);
    				}

    				if (!(targetRow.allParents.length > 0) && !targetRow.allChildren) {
    					newTask.reflections = null;
    				}
    			} else {
    				// reset position
    				($$invalidate(6, _position.x = task.left, _position), $$invalidate(6, _position.width = task.width, _position), $$invalidate(6, _position.y = task.top, _position));
    			}
    		};

    		const draggable = new Draggable(node,
    		{
    				onDown: event => {
    					if (event.dragging) {
    						setCursor("move");
    					}

    					if (event.resizing) {
    						setCursor("e-resize");
    					}
    				},
    				onMouseUp: () => {
    					setCursor("default");
    				},
    				onResize: event => {
    					($$invalidate(6, _position.x = event.x, _position), $$invalidate(6, _position.width = event.width, _position), $$invalidate(5, _resizing = true));
    				},
    				onDrag: event => {
    					($$invalidate(6, _position.x = event.x, _position), $$invalidate(6, _position.y = event.y, _position), $$invalidate(4, _dragging = true));
    				},
    				dragAllowed: () => {
    					return row.model.enableDragging && model.enableDragging;
    				},
    				resizeAllowed: () => {
    					return row.model.enableDragging && model.enableDragging;
    				},
    				onDrop: ondrop,
    				container: rowContainer,
    				resizeHandleWidth,
    				getX: () => _position.x,
    				getY: () => _position.y,
    				getWidth: () => _position.width
    			});

    		return { destroy: () => draggable.destroy() };
    	}

    	function onclick(event) {
    		if (onTaskButtonClick) {
    			onTaskButtonClick(task);
    		}
    	}

    	let selection = selectionManager.selection;
    	validate_store(selection, "selection");
    	component_subscribe($$self, selection, value => $$invalidate(21, $selection = value));
    	let selected = false;
    	let row;
    	const writable_props = ["model", "height", "left", "top", "width", "reflected"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Task> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("Task", $$slots, []);

    	$$self.$set = $$props => {
    		if ("model" in $$props) $$invalidate(0, model = $$props.model);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("left" in $$props) $$invalidate(14, left = $$props.left);
    		if ("top" in $$props) $$invalidate(15, top = $$props.top);
    		if ("width" in $$props) $$invalidate(16, width = $$props.width);
    		if ("reflected" in $$props) $$invalidate(2, reflected = $$props.reflected);
    	};

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		afterUpdate,
    		getContext,
    		onMount: onMount$1,
    		onDestroy,
    		tick,
    		setCursor,
    		taskStore,
    		rowStore,
    		Draggable,
    		reflectTask,
    		model,
    		height,
    		left,
    		top,
    		width,
    		reflected,
    		animating,
    		_dragging,
    		_resizing,
    		_position,
    		updatePosition,
    		dimensionsChanged,
    		rowContainer,
    		taskContent,
    		resizeHandleWidth,
    		rowPadding,
    		onTaskButtonClick,
    		reflectOnParentRows,
    		reflectOnChildRows,
    		dndManager,
    		api,
    		utils,
    		selectionManager,
    		columnService,
    		drag,
    		onclick,
    		selection,
    		selected,
    		row,
    		$rowStore,
    		$taskStore,
    		$rowPadding,
    		$selection,
    		$taskContent
    	});

    	$$self.$inject_state = $$props => {
    		if ("model" in $$props) $$invalidate(0, model = $$props.model);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("left" in $$props) $$invalidate(14, left = $$props.left);
    		if ("top" in $$props) $$invalidate(15, top = $$props.top);
    		if ("width" in $$props) $$invalidate(16, width = $$props.width);
    		if ("reflected" in $$props) $$invalidate(2, reflected = $$props.reflected);
    		if ("animating" in $$props) $$invalidate(9, animating = $$props.animating);
    		if ("_dragging" in $$props) $$invalidate(4, _dragging = $$props._dragging);
    		if ("_resizing" in $$props) $$invalidate(5, _resizing = $$props._resizing);
    		if ("_position" in $$props) $$invalidate(6, _position = $$props._position);
    		if ("selection" in $$props) $$invalidate(13, selection = $$props.selection);
    		if ("selected" in $$props) $$invalidate(7, selected = $$props.selected);
    		if ("row" in $$props) row = $$props.row;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*left, top, width*/ 114688) {
    			 updatePosition(left, top, width);
    		}

    		if ($$self.$$.dirty[0] & /*$selection, model*/ 2097153) {
    			 $$invalidate(7, selected = $selection.indexOf(model.id) !== -1);
    		}

    		if ($$self.$$.dirty[0] & /*$rowStore, model*/ 262145) {
    			 row = $rowStore.entities[model.resourceId];
    		}
    	};

    	return [
    		model,
    		height,
    		reflected,
    		onclick,
    		_dragging,
    		_resizing,
    		_position,
    		selected,
    		$taskContent,
    		animating,
    		taskContent,
    		rowPadding,
    		drag,
    		selection,
    		left,
    		top,
    		width
    	];
    }

    class Task extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);

    		init$1(
    			this,
    			options,
    			instance,
    			create_fragment,
    			safe_not_equal$1,
    			{
    				model: 0,
    				height: 1,
    				left: 14,
    				top: 15,
    				width: 16,
    				reflected: 2,
    				onclick: 3
    			},
    			[-1, -1]
    		);

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Task",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*model*/ ctx[0] === undefined && !("model" in props)) {
    			console.warn("<Task> was created without expected prop 'model'");
    		}

    		if (/*height*/ ctx[1] === undefined && !("height" in props)) {
    			console.warn("<Task> was created without expected prop 'height'");
    		}

    		if (/*left*/ ctx[14] === undefined && !("left" in props)) {
    			console.warn("<Task> was created without expected prop 'left'");
    		}

    		if (/*top*/ ctx[15] === undefined && !("top" in props)) {
    			console.warn("<Task> was created without expected prop 'top'");
    		}

    		if (/*width*/ ctx[16] === undefined && !("width" in props)) {
    			console.warn("<Task> was created without expected prop 'width'");
    		}
    	}

    	get model() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set model(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reflected() {
    		throw new Error("<Task>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reflected(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onclick() {
    		return this.$$.ctx[3];
    	}

    	set onclick(value) {
    		throw new Error("<Task>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\entities\Row.svelte generated by Svelte v3.23.0 */
    const file$1 = "src\\entities\\Row.svelte";

    // (11:4) {#if row.model.contentHtml}
    function create_if_block$1(ctx) {
    	let html_tag;
    	let raw_value = /*row*/ ctx[0].model.contentHtml + "";

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag(null);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*row*/ 1 && raw_value !== (raw_value = /*row*/ ctx[0].model.contentHtml + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(11:4) {#if row.model.contentHtml}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let div_class_value;
    	let div_data_row_id_value;
    	let if_block = /*row*/ ctx[0].model.contentHtml && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			if (if_block) if_block.c();
    			attr_dev$1(div, "class", div_class_value = "sg-row " + /*row*/ ctx[0].model.classes + " svelte-ejtbeo");
    			attr_dev$1(div, "data-row-id", div_data_row_id_value = /*row*/ ctx[0].model.id);
    			set_style(div, "height", /*$rowHeight*/ ctx[4] + "px");
    			toggle_class(div, "sg-hover", /*$hoveredRow*/ ctx[2] == /*row*/ ctx[0].model.id);
    			toggle_class(div, "sg-selected", /*$selectedRow*/ ctx[3] == /*row*/ ctx[0].model.id);
    			add_location$1(div, file$1, 9, 0, 221);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			/*div_binding*/ ctx[8](div);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*row*/ ctx[0].model.contentHtml) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*row*/ 1 && div_class_value !== (div_class_value = "sg-row " + /*row*/ ctx[0].model.classes + " svelte-ejtbeo")) {
    				attr_dev$1(div, "class", div_class_value);
    			}

    			if (dirty & /*row*/ 1 && div_data_row_id_value !== (div_data_row_id_value = /*row*/ ctx[0].model.id)) {
    				attr_dev$1(div, "data-row-id", div_data_row_id_value);
    			}

    			if (dirty & /*$rowHeight*/ 16) {
    				set_style(div, "height", /*$rowHeight*/ ctx[4] + "px");
    			}

    			if (dirty & /*row, $hoveredRow, row*/ 5) {
    				toggle_class(div, "sg-hover", /*$hoveredRow*/ ctx[2] == /*row*/ ctx[0].model.id);
    			}

    			if (dirty & /*row, $selectedRow, row*/ 9) {
    				toggle_class(div, "sg-selected", /*$selectedRow*/ ctx[3] == /*row*/ ctx[0].model.id);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    			if (if_block) if_block.d();
    			/*div_binding*/ ctx[8](null);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $hoveredRow;
    	let $selectedRow;
    	let $rowHeight;
    	let { row } = $$props;
    	let rowElement;
    	const { rowHeight } = getContext("options");
    	validate_store(rowHeight, "rowHeight");
    	component_subscribe($$self, rowHeight, value => $$invalidate(4, $rowHeight = value));
    	const { hoveredRow, selectedRow } = getContext("gantt");
    	validate_store(hoveredRow, "hoveredRow");
    	component_subscribe($$self, hoveredRow, value => $$invalidate(2, $hoveredRow = value));
    	validate_store(selectedRow, "selectedRow");
    	component_subscribe($$self, selectedRow, value => $$invalidate(3, $selectedRow = value));
    	const writable_props = ["row"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Row> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("Row", $$slots, []);

    	function div_binding($$value) {
    		binding_callbacks$1[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, rowElement = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("row" in $$props) $$invalidate(0, row = $$props.row);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		row,
    		rowElement,
    		rowHeight,
    		hoveredRow,
    		selectedRow,
    		$hoveredRow,
    		$selectedRow,
    		$rowHeight
    	});

    	$$self.$inject_state = $$props => {
    		if ("row" in $$props) $$invalidate(0, row = $$props.row);
    		if ("rowElement" in $$props) $$invalidate(1, rowElement = $$props.rowElement);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		row,
    		rowElement,
    		$hoveredRow,
    		$selectedRow,
    		$rowHeight,
    		rowHeight,
    		hoveredRow,
    		selectedRow,
    		div_binding
    	];
    }

    class Row extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$1, create_fragment$1, safe_not_equal$1, { row: 0 });

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Row",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*row*/ ctx[0] === undefined && !("row" in props)) {
    			console.warn("<Row> was created without expected prop 'row'");
    		}
    	}

    	get row() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set row(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\entities\Milestone.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1 } = globals$1;
    const file$2 = "src\\entities\\Milestone.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let div1_class_value;
    	let drag_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element$1("div");
    			div0 = element$1("div");
    			attr_dev$1(div0, "class", "inside svelte-fuyhwd");
    			add_location$1(div0, file$2, 122, 4, 3677);
    			attr_dev$1(div1, "class", div1_class_value = "sg-milestone " + /*model*/ ctx[0].classes + " svelte-fuyhwd");
    			set_style(div1, "transform", "translate(" + /*x*/ ctx[5] + "px, " + /*y*/ ctx[6] + "px)");
    			set_style(div1, "height", /*height*/ ctx[1] + "px");
    			set_style(div1, "width", /*height*/ ctx[1] + "px");
    			toggle_class(div1, "selected", /*selected*/ ctx[7]);
    			toggle_class(div1, "moving", /*dragging*/ ctx[4]);
    			add_location$1(div1, file$2, 115, 0, 3407);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div1, anchor);
    			append_dev$1(div1, div0);
    			/*div1_binding*/ ctx[23](div1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(drag_action = /*drag*/ ctx[10].call(null, div1)),
    					listen_dev$1(div1, "click", /*select*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*model*/ 1 && div1_class_value !== (div1_class_value = "sg-milestone " + /*model*/ ctx[0].classes + " svelte-fuyhwd")) {
    				attr_dev$1(div1, "class", div1_class_value);
    			}

    			if (dirty & /*x, y*/ 96) {
    				set_style(div1, "transform", "translate(" + /*x*/ ctx[5] + "px, " + /*y*/ ctx[6] + "px)");
    			}

    			if (dirty & /*height*/ 2) {
    				set_style(div1, "height", /*height*/ ctx[1] + "px");
    			}

    			if (dirty & /*height*/ 2) {
    				set_style(div1, "width", /*height*/ ctx[1] + "px");
    			}

    			if (dirty & /*model, selected*/ 129) {
    				toggle_class(div1, "selected", /*selected*/ ctx[7]);
    			}

    			if (dirty & /*model, dragging*/ 17) {
    				toggle_class(div1, "moving", /*dragging*/ ctx[4]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div1);
    			/*div1_binding*/ ctx[23](null);
    			mounted = false;
    			run_all$1(dispose);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $rowStore;
    	let $taskStore;
    	let $rowPadding;
    	let $selection;
    	validate_store(rowStore, "rowStore");
    	component_subscribe($$self, rowStore, $$value => $$invalidate(14, $rowStore = $$value));
    	validate_store(taskStore, "taskStore");
    	component_subscribe($$self, taskStore, $$value => $$invalidate(15, $taskStore = $$value));
    	let milestoneElement;
    	const { rowPadding } = getContext("options");
    	validate_store(rowPadding, "rowPadding");
    	component_subscribe($$self, rowPadding, value => $$invalidate(16, $rowPadding = value));
    	const { selectionManager, api, rowContainer, dndManager, columnService } = getContext("services");
    	let { left } = $$props;
    	let { top } = $$props;
    	let { model } = $$props;
    	let { height = 20 } = $$props;
    	const selection = selectionManager.selection;
    	validate_store(selection, "selection");
    	component_subscribe($$self, selection, value => $$invalidate(17, $selection = value));
    	let dragging = false;
    	let x = null;
    	let y = null;

    	function drag(node) {
    		const ondrop = ({ x, y, currWidth, event, dragging }) => {
    			let rowChangeValid = true;

    			//row switching
    			if (dragging) {
    				const sourceRow = $rowStore.entities[model.resourceId];
    				const targetRow = dndManager.getTarget("row", event);

    				if (targetRow) {
    					$$invalidate(0, model.resourceId = targetRow.model.id, model);
    					api.tasks.raise.switchRow(this, targetRow, sourceRow);
    				} else {
    					rowChangeValid = false;
    				}
    			}

    			dragging = false;
    			const task = $taskStore.entities[model.id];

    			if (rowChangeValid) {
    				const newFrom = utils.roundTo(columnService.getDateByPosition(x));
    				const newLeft = columnService.getPositionByDate(newFrom);
    				Object.assign(model, { from: newFrom });

    				$taskStore.update({
    					...task,
    					left: newLeft,
    					top: rowPadding + $rowStore.entities[model.resourceId].y,
    					model
    				});
    			} else {
    				// reset position
    				$taskStore.update({ ...task });
    			}
    		};

    		const draggable = new Draggable(node,
    		{
    				onDown: ({ x, y }) => {
    					
    				}, //this.set({x, y});
    				onDrag: pos => {
    					($$invalidate(5, x = pos.x), $$invalidate(6, y = pos.y), $$invalidate(4, dragging = true));
    				},
    				dragAllowed: () => {
    					return row.model.enableDragging && model.enableDragging;
    				},
    				resizeAllowed: false,
    				onDrop: ondrop,
    				container: rowContainer,
    				getX: () => x,
    				getY: () => y
    			});

    		return {
    			destroy() {
    				draggable.destroy();
    			}
    		};
    	}

    	onMount$1(() => {
    		$$invalidate(5, x = $$invalidate(11, left = columnService.getPositionByDate(model.from)));
    		$$invalidate(6, y = $$invalidate(12, top = row.y + $rowPadding));
    		
    		$$invalidate(1, height = row.height - 2 * $rowPadding);
    	});

    	function select(event) {
    		if (event.ctrlKey) {
    			selectionManager.toggleSelection(model.id);
    		} else {
    			selectionManager.selectSingle(model.id);
    		}

    		if (selected) {
    			api.tasks.raise.select(model);
    		}
    	}

    	let selected = false;
    	let row;
    	const writable_props = ["left", "top", "model", "height"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Milestone> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("Milestone", $$slots, []);

    	function div1_binding($$value) {
    		binding_callbacks$1[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, milestoneElement = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("left" in $$props) $$invalidate(11, left = $$props.left);
    		if ("top" in $$props) $$invalidate(12, top = $$props.top);
    		if ("model" in $$props) $$invalidate(0, model = $$props.model);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    	};

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		onMount: onMount$1,
    		getContext,
    		milestoneElement,
    		Draggable,
    		rowStore,
    		taskStore,
    		rowPadding,
    		selectionManager,
    		api,
    		rowContainer,
    		dndManager,
    		columnService,
    		left,
    		top,
    		model,
    		height,
    		selection,
    		dragging,
    		x,
    		y,
    		drag,
    		select,
    		selected,
    		row,
    		$rowStore,
    		$taskStore,
    		$rowPadding,
    		$selection
    	});

    	$$self.$inject_state = $$props => {
    		if ("milestoneElement" in $$props) $$invalidate(3, milestoneElement = $$props.milestoneElement);
    		if ("left" in $$props) $$invalidate(11, left = $$props.left);
    		if ("top" in $$props) $$invalidate(12, top = $$props.top);
    		if ("model" in $$props) $$invalidate(0, model = $$props.model);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("dragging" in $$props) $$invalidate(4, dragging = $$props.dragging);
    		if ("x" in $$props) $$invalidate(5, x = $$props.x);
    		if ("y" in $$props) $$invalidate(6, y = $$props.y);
    		if ("selected" in $$props) $$invalidate(7, selected = $$props.selected);
    		if ("row" in $$props) row = $$props.row;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*dragging, left, top*/ 6160) {
    			 {
    				if (!dragging) {
    					($$invalidate(5, x = left), $$invalidate(6, y = top));
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$selection, model*/ 131073) {
    			 $$invalidate(7, selected = $selection.indexOf(model.id) !== -1);
    		}

    		if ($$self.$$.dirty & /*$rowStore, model*/ 16385) {
    			 row = $rowStore.entities[model.resourceId];
    		}
    	};

    	return [
    		model,
    		height,
    		select,
    		milestoneElement,
    		dragging,
    		x,
    		y,
    		selected,
    		rowPadding,
    		selection,
    		drag,
    		left,
    		top,
    		row,
    		$rowStore,
    		$taskStore,
    		$rowPadding,
    		$selection,
    		selectionManager,
    		api,
    		rowContainer,
    		dndManager,
    		columnService,
    		div1_binding
    	];
    }

    class Milestone extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$2, create_fragment$2, safe_not_equal$1, {
    			left: 11,
    			top: 12,
    			model: 0,
    			height: 1,
    			select: 2
    		});

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Milestone",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*left*/ ctx[11] === undefined && !("left" in props)) {
    			console.warn("<Milestone> was created without expected prop 'left'");
    		}

    		if (/*top*/ ctx[12] === undefined && !("top" in props)) {
    			console.warn("<Milestone> was created without expected prop 'top'");
    		}

    		if (/*model*/ ctx[0] === undefined && !("model" in props)) {
    			console.warn("<Milestone> was created without expected prop 'model'");
    		}
    	}

    	get left() {
    		throw new Error("<Milestone>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Milestone>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Milestone>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Milestone>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get model() {
    		throw new Error("<Milestone>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set model(value) {
    		throw new Error("<Milestone>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Milestone>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Milestone>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get select() {
    		return this.$$.ctx[2];
    	}

    	set select(value) {
    		throw new Error("<Milestone>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\entities\TimeRange.svelte generated by Svelte v3.23.0 */

    const file$3 = "src\\entities\\TimeRange.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*model*/ ctx[0].label + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element$1("div");
    			div0 = element$1("div");
    			t = text$1(t_value);
    			attr_dev$1(div0, "class", "sg-time-range-label svelte-18yq9be");
    			add_location$1(div0, file$3, 16, 4, 378);
    			attr_dev$1(div1, "class", "sg-time-range svelte-18yq9be");
    			set_style(div1, "width", /*_position*/ ctx[2].width + "px");
    			set_style(div1, "left", /*_position*/ ctx[2].x + "px");
    			toggle_class(div1, "moving", /*resizing*/ ctx[1]);
    			add_location$1(div1, file$3, 15, 0, 264);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div1, anchor);
    			append_dev$1(div1, div0);
    			append_dev$1(div0, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*model*/ 1 && t_value !== (t_value = /*model*/ ctx[0].label + "")) set_data_dev$1(t, t_value);

    			if (dirty & /*_position*/ 4) {
    				set_style(div1, "width", /*_position*/ ctx[2].width + "px");
    			}

    			if (dirty & /*_position*/ 4) {
    				set_style(div1, "left", /*_position*/ ctx[2].x + "px");
    			}

    			if (dirty & /*resizing*/ 2) {
    				toggle_class(div1, "moving", /*resizing*/ ctx[1]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div1);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { model } = $$props;
    	let { left } = $$props;
    	let { width } = $$props;
    	let { resizing = false } = $$props;
    	const _position = { width, x: left };
    	
    	const writable_props = ["model", "left", "width", "resizing"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TimeRange> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("TimeRange", $$slots, []);

    	$$self.$set = $$props => {
    		if ("model" in $$props) $$invalidate(0, model = $$props.model);
    		if ("left" in $$props) $$invalidate(3, left = $$props.left);
    		if ("width" in $$props) $$invalidate(4, width = $$props.width);
    		if ("resizing" in $$props) $$invalidate(1, resizing = $$props.resizing);
    	};

    	$$self.$capture_state = () => ({ model, left, width, resizing, _position });

    	$$self.$inject_state = $$props => {
    		if ("model" in $$props) $$invalidate(0, model = $$props.model);
    		if ("left" in $$props) $$invalidate(3, left = $$props.left);
    		if ("width" in $$props) $$invalidate(4, width = $$props.width);
    		if ("resizing" in $$props) $$invalidate(1, resizing = $$props.resizing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*left, width*/ 24) {
    			 {
    				($$invalidate(2, _position.x = left, _position), $$invalidate(2, _position.width = width, _position));
    			}
    		}
    	};

    	return [model, resizing, _position, left, width];
    }

    class TimeRange extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$3, create_fragment$3, safe_not_equal$1, { model: 0, left: 3, width: 4, resizing: 1 });

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimeRange",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*model*/ ctx[0] === undefined && !("model" in props)) {
    			console.warn("<TimeRange> was created without expected prop 'model'");
    		}

    		if (/*left*/ ctx[3] === undefined && !("left" in props)) {
    			console.warn("<TimeRange> was created without expected prop 'left'");
    		}

    		if (/*width*/ ctx[4] === undefined && !("width" in props)) {
    			console.warn("<TimeRange> was created without expected prop 'width'");
    		}
    	}

    	get model() {
    		throw new Error("<TimeRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set model(value) {
    		throw new Error("<TimeRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<TimeRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<TimeRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<TimeRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<TimeRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get resizing() {
    		throw new Error("<TimeRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set resizing(value) {
    		throw new Error("<TimeRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\entities\TimeRangeHeader.svelte generated by Svelte v3.23.0 */

    const { Object: Object_1$1 } = globals$1;
    const file$4 = "src\\entities\\TimeRangeHeader.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let drag_action;
    	let t;
    	let div1;
    	let drag_action_1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element$1("div");
    			div0 = element$1("div");
    			t = space$1();
    			div1 = element$1("div");
    			attr_dev$1(div0, "class", "sg-time-range-handle-left svelte-16dwney");
    			add_location$1(div0, file$4, 86, 4, 2560);
    			attr_dev$1(div1, "class", "sg-time-range-handle-right svelte-16dwney");
    			add_location$1(div1, file$4, 87, 4, 2620);
    			attr_dev$1(div2, "class", "sg-time-range-control svelte-16dwney");
    			set_style(div2, "width", /*_position*/ ctx[0].width + "px");
    			set_style(div2, "left", /*_position*/ ctx[0].x + "px");
    			add_location$1(div2, file$4, 85, 0, 2464);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div2, anchor);
    			append_dev$1(div2, div0);
    			append_dev$1(div2, t);
    			append_dev$1(div2, div1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(drag_action = /*drag*/ ctx[1].call(null, div0)),
    					action_destroyer(drag_action_1 = /*drag*/ ctx[1].call(null, div1))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*_position*/ 1) {
    				set_style(div2, "width", /*_position*/ ctx[0].width + "px");
    			}

    			if (dirty & /*_position*/ 1) {
    				set_style(div2, "left", /*_position*/ ctx[0].x + "px");
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div2);
    			mounted = false;
    			run_all$1(dispose);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const { rowContainer } = getContext("gantt");
    	const { utils, columnService } = getContext("services");
    	const { resizeHandleWidth } = getContext("options");
    	const { from, to, width: ganttWidth, visibleWidth } = getContext("dimensions");
    	let { model } = $$props;
    	let { width } = $$props;
    	let { left } = $$props;
    	const _position = { width, x: left };
    	

    	function drag(node) {
    		const ondrop = event => {
    			const newFrom = utils.roundTo(columnService.getDateByPosition(event.x));
    			const newTo = utils.roundTo(columnService.getDateByPosition(event.x + event.width));
    			const newLeft = columnService.getPositionByDate(newFrom);
    			const newRight = columnService.getPositionByDate(newTo);
    			Object.assign(model, { from: newFrom, to: newTo });

    			update({
    				left: newLeft,
    				width: newRight - newLeft,
    				model,
    				resizing: false
    			});

    			window.removeEventListener("mousemove", onmousemove, false);
    		};

    		function update(state) {
    			timeRangeStore.update(state);
    			$$invalidate(0, _position.x = state.left, _position);
    			$$invalidate(0, _position.width = state.width, _position);
    		}

    		return new Draggable(node,
    		{
    				onDown: event => {
    					update({
    						left: event.x,
    						width: event.width,
    						model,
    						resizing: true
    					});
    				},
    				onResize: event => {
    					update({
    						left: event.x,
    						width: event.width,
    						model,
    						resizing: true
    					});
    				},
    				dragAllowed: false,
    				resizeAllowed: true,
    				onDrop: ondrop,
    				container: rowContainer,
    				resizeHandleWidth,
    				getX: () => _position.x,
    				getY: () => 0,
    				getWidth: () => _position.width
    			});
    	}

    	const writable_props = ["model", "width", "left"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TimeRangeHeader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("TimeRangeHeader", $$slots, []);

    	$$self.$set = $$props => {
    		if ("model" in $$props) $$invalidate(2, model = $$props.model);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("left" in $$props) $$invalidate(4, left = $$props.left);
    	};

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		getContext,
    		Draggable,
    		timeRangeStore,
    		rowContainer,
    		utils,
    		columnService,
    		resizeHandleWidth,
    		from,
    		to,
    		ganttWidth,
    		visibleWidth,
    		model,
    		width,
    		left,
    		_position,
    		drag
    	});

    	$$self.$inject_state = $$props => {
    		if ("model" in $$props) $$invalidate(2, model = $$props.model);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("left" in $$props) $$invalidate(4, left = $$props.left);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*left, width*/ 24) {
    			 {
    				($$invalidate(0, _position.x = left, _position), $$invalidate(0, _position.width = width, _position));
    			}
    		}
    	};

    	return [_position, drag, model, width, left];
    }

    class TimeRangeHeader extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$4, create_fragment$4, safe_not_equal$1, { model: 2, width: 3, left: 4 });

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimeRangeHeader",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*model*/ ctx[2] === undefined && !("model" in props)) {
    			console.warn("<TimeRangeHeader> was created without expected prop 'model'");
    		}

    		if (/*width*/ ctx[3] === undefined && !("width" in props)) {
    			console.warn("<TimeRangeHeader> was created without expected prop 'width'");
    		}

    		if (/*left*/ ctx[4] === undefined && !("left" in props)) {
    			console.warn("<TimeRangeHeader> was created without expected prop 'left'");
    		}
    	}

    	get model() {
    		throw new Error("<TimeRangeHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set model(value) {
    		throw new Error("<TimeRangeHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<TimeRangeHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<TimeRangeHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<TimeRangeHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<TimeRangeHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\column\Column.svelte generated by Svelte v3.23.0 */

    const file$5 = "src\\column\\Column.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			attr_dev$1(div, "class", "column svelte-11nl46d");
    			set_style(div, "left", /*left*/ ctx[0] + "px");
    			set_style(div, "width", /*width*/ ctx[1] + "px");
    			add_location$1(div, file$5, 5, 0, 68);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*left*/ 1) {
    				set_style(div, "left", /*left*/ ctx[0] + "px");
    			}

    			if (dirty & /*width*/ 2) {
    				set_style(div, "width", /*width*/ ctx[1] + "px");
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { left } = $$props;
    	let { width } = $$props;
    	const writable_props = ["left", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Column> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("Column", $$slots, []);

    	$$self.$set = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({ left, width });

    	$$self.$inject_state = $$props => {
    		if ("left" in $$props) $$invalidate(0, left = $$props.left);
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [left, width];
    }

    class Column extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$5, create_fragment$5, safe_not_equal$1, { left: 0, width: 1 });

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Column",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*left*/ ctx[0] === undefined && !("left" in props)) {
    			console.warn("<Column> was created without expected prop 'left'");
    		}

    		if (/*width*/ ctx[1] === undefined && !("width" in props)) {
    			console.warn("<Column> was created without expected prop 'width'");
    		}
    	}

    	get left() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Column>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Column>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\column\ColumnHeaderRow.svelte generated by Svelte v3.23.0 */

    const { console: console_1 } = globals$1;
    const file$6 = "src\\column\\ColumnHeaderRow.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (52:4) {#each _headers as header}
    function create_each_block(ctx) {
    	let div;
    	let t0_value = (/*header*/ ctx[0].label || "N/A") + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[12](/*header*/ ctx[0], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			t0 = text$1(t0_value);
    			t1 = space$1();
    			attr_dev$1(div, "class", "column-header-cell svelte-86q30t");
    			set_style(div, "width", /*header*/ ctx[0].width + "px");
    			add_location$1(div, file$6, 52, 8, 1521);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    			append_dev$1(div, t0);
    			append_dev$1(div, t1);

    			if (!mounted) {
    				dispose = listen_dev$1(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*_headers*/ 2 && t0_value !== (t0_value = (/*header*/ ctx[0].label || "N/A") + "")) set_data_dev$1(t0, t0_value);

    			if (dirty & /*_headers*/ 2) {
    				set_style(div, "width", /*header*/ ctx[0].width + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(52:4) {#each _headers as header}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let each_value = /*_headers*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element$1("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev$1(div, "class", "column-header-row svelte-86q30t");
    			add_location$1(div, file$6, 50, 0, 1448);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*_headers, dispatch*/ 6) {
    				each_value = /*_headers*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $width;
    	let $from;
    	const dispatch = createEventDispatcher();
    	const { from, to, width } = getContext("dimensions");
    	validate_store(from, "from");
    	component_subscribe($$self, from, value => $$invalidate(10, $from = value));
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(9, $width = value));
    	let { header } = $$props;
    	let { baseWidth } = $$props;
    	let { baseDuration } = $$props;
    	let { columnWidth } = $$props;
    	let { columnCount } = $$props;
    	let _headers = [];
    	const writable_props = ["header", "baseWidth", "baseDuration", "columnWidth", "columnCount"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<ColumnHeaderRow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("ColumnHeaderRow", $$slots, []);

    	const click_handler = header => dispatch("dateSelected", {
    		from: header.from,
    		to: header.to,
    		unit: header.unit
    	});

    	$$self.$set = $$props => {
    		if ("header" in $$props) $$invalidate(0, header = $$props.header);
    		if ("baseWidth" in $$props) $$invalidate(7, baseWidth = $$props.baseWidth);
    		if ("baseDuration" in $$props) $$invalidate(8, baseDuration = $$props.baseDuration);
    		if ("columnWidth" in $$props) $$invalidate(5, columnWidth = $$props.columnWidth);
    		if ("columnCount" in $$props) $$invalidate(6, columnCount = $$props.columnCount);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		getContext,
    		dispatch,
    		moment: moment$1,
    		from,
    		to,
    		width,
    		header,
    		baseWidth,
    		baseDuration,
    		columnWidth,
    		columnCount,
    		_headers,
    		$width,
    		$from
    	});

    	$$self.$inject_state = $$props => {
    		if ("header" in $$props) $$invalidate(0, header = $$props.header);
    		if ("baseWidth" in $$props) $$invalidate(7, baseWidth = $$props.baseWidth);
    		if ("baseDuration" in $$props) $$invalidate(8, baseDuration = $$props.baseDuration);
    		if ("columnWidth" in $$props) $$invalidate(5, columnWidth = $$props.columnWidth);
    		if ("columnCount" in $$props) $$invalidate(6, columnCount = $$props.columnCount);
    		if ("_headers" in $$props) $$invalidate(1, _headers = $$props._headers);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*header, baseDuration, baseWidth*/ 385) {
    			 {
    				const offset = header.offset || 1;
    				const duration$1 = moment$1.duration(offset, header.unit).asMilliseconds();
    				const ratio = duration$1 / baseDuration;
    				$$invalidate(5, columnWidth = baseWidth * ratio);
    			}
    		}

    		if ($$self.$$.dirty & /*$width, columnWidth, columnCount*/ 608) {
    			 {
    				$$invalidate(6, columnCount = Math.ceil($width / columnWidth));

    				if (!isFinite(columnCount)) {
    					console.error("columnCount is not finite");
    					$$invalidate(6, columnCount = 0);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$from, header, columnCount, columnWidth, $width*/ 1633) {
    			 {
    				const headers = [];
    				let headerTime = $from.clone().startOf(header.unit);
    				const offset = header.offset || 1;

    				for (let i = 0; i < columnCount; i++) {
    					headers.push({
    						width: Math.min(columnWidth, $width),
    						label: headerTime.format(header.format),
    						from: headerTime.clone(),
    						to: headerTime.clone().add(offset, header.unit),
    						unit: header.unit
    					});

    					headerTime.add(offset, header.unit);
    				}

    				$$invalidate(1, _headers = headers);
    			}
    		}
    	};

    	return [
    		header,
    		_headers,
    		dispatch,
    		from,
    		width,
    		columnWidth,
    		columnCount,
    		baseWidth,
    		baseDuration,
    		$width,
    		$from,
    		to,
    		click_handler
    	];
    }

    class ColumnHeaderRow extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$6, create_fragment$6, safe_not_equal$1, {
    			header: 0,
    			baseWidth: 7,
    			baseDuration: 8,
    			columnWidth: 5,
    			columnCount: 6
    		});

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColumnHeaderRow",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*header*/ ctx[0] === undefined && !("header" in props)) {
    			console_1.warn("<ColumnHeaderRow> was created without expected prop 'header'");
    		}

    		if (/*baseWidth*/ ctx[7] === undefined && !("baseWidth" in props)) {
    			console_1.warn("<ColumnHeaderRow> was created without expected prop 'baseWidth'");
    		}

    		if (/*baseDuration*/ ctx[8] === undefined && !("baseDuration" in props)) {
    			console_1.warn("<ColumnHeaderRow> was created without expected prop 'baseDuration'");
    		}

    		if (/*columnWidth*/ ctx[5] === undefined && !("columnWidth" in props)) {
    			console_1.warn("<ColumnHeaderRow> was created without expected prop 'columnWidth'");
    		}

    		if (/*columnCount*/ ctx[6] === undefined && !("columnCount" in props)) {
    			console_1.warn("<ColumnHeaderRow> was created without expected prop 'columnCount'");
    		}
    	}

    	get header() {
    		throw new Error("<ColumnHeaderRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header(value) {
    		throw new Error("<ColumnHeaderRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get baseWidth() {
    		throw new Error("<ColumnHeaderRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set baseWidth(value) {
    		throw new Error("<ColumnHeaderRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get baseDuration() {
    		throw new Error("<ColumnHeaderRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set baseDuration(value) {
    		throw new Error("<ColumnHeaderRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columnWidth() {
    		throw new Error("<ColumnHeaderRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columnWidth(value) {
    		throw new Error("<ColumnHeaderRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columnCount() {
    		throw new Error("<ColumnHeaderRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columnCount(value) {
    		throw new Error("<ColumnHeaderRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class GanttUtils {
        constructor() {
        }
        /**
         * Returns position of date on a line if from and to represent length of width
         * @param {*} date
         */
        getPositionByDate(date) {
            return getPositionByDate(date, this.from, this.to, this.width);
        }
        getDateByPosition(x) {
            return getDateByPosition(x, this.from, this.to, this.width);
        }
        /**
         *
         * @param {Moment} date - Date
         * @returns {Moment} rounded date passed as parameter
         */
        roundTo(date) {
            let value = date.get(this.magnetUnit);
            value = Math.round(value / this.magnetOffset);
            date.set(this.magnetUnit, value * this.magnetOffset);
            //round all smaller units to 0
            const units = ['millisecond', 'second', 'minute', 'hour', 'date', 'month', 'year'];
            const indexOf = units.indexOf(this.magnetUnit);
            for (let i = 0; i < indexOf; i++) {
                date.set(units[i], 0);
            }
            return date;
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
    // Returns the object on the left and right in an array using the given cmp function.
    // The compare function defined which property of the value to compare (e.g.: c => c.left)
    function getIndicesOnly(input, value, comparer, strict) {
        let lo = -1;
        let hi = input.length;
        while (hi - lo > 1) {
            let mid = Math.floor((lo + hi) / 2);
            if (strict ? comparer(input[mid]) < value : comparer(input[mid]) <= value) {
                lo = mid;
            }
            else {
                hi = mid;
            }
        }
        if (!strict && input[lo] !== undefined && comparer(input[lo]) === value) {
            hi = lo;
        }
        return [lo, hi];
    }
    function get(input, value, comparer, strict) {
        let res = getIndicesOnly(input, value, comparer, strict);
        return [input[res[0]], input[res[1]]];
    }

    /* src\column\ColumnHeader.svelte generated by Svelte v3.23.0 */

    const { console: console_1$1 } = globals$1;

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (48:0) {#each headers as header}
    function create_each_block$1(ctx) {
    	let current;

    	const columnheaderrow = new ColumnHeaderRow({
    			props: {
    				header: /*header*/ ctx[13],
    				baseWidth: /*baseHeaderWidth*/ ctx[1],
    				baseDuration: /*baseHeaderDuration*/ ctx[2]
    			},
    			$$inline: true
    		});

    	columnheaderrow.$on("dateSelected", /*dateSelected_handler*/ ctx[12]);

    	const block = {
    		c: function create() {
    			create_component(columnheaderrow.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component$1(columnheaderrow, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const columnheaderrow_changes = {};
    			if (dirty & /*headers*/ 1) columnheaderrow_changes.header = /*header*/ ctx[13];
    			if (dirty & /*baseHeaderWidth*/ 2) columnheaderrow_changes.baseWidth = /*baseHeaderWidth*/ ctx[1];
    			if (dirty & /*baseHeaderDuration*/ 4) columnheaderrow_changes.baseDuration = /*baseHeaderDuration*/ ctx[2];
    			columnheaderrow.$set(columnheaderrow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(columnheaderrow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(columnheaderrow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component$1(columnheaderrow, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(48:0) {#each headers as header}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*headers*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev$1(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*headers, baseHeaderWidth, baseHeaderDuration*/ 7) {
    				each_value = /*headers*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in$1(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in$1(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in$1(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev$1(each_1_anchor);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $from;
    	let $to;
    	let $width;
    	let { headers } = $$props;
    	let { columnUnit } = $$props;
    	let { columnOffset } = $$props;
    	const { from, to, width } = getContext("dimensions");
    	validate_store(from, "from");
    	component_subscribe($$self, from, value => $$invalidate(9, $from = value));
    	validate_store(to, "to");
    	component_subscribe($$self, to, value => $$invalidate(10, $to = value));
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(11, $width = value));
    	let minHeader;
    	let baseHeaderWidth;
    	let baseHeaderDuration;
    	const writable_props = ["headers", "columnUnit", "columnOffset"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<ColumnHeader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("ColumnHeader", $$slots, []);

    	function dateSelected_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("headers" in $$props) $$invalidate(0, headers = $$props.headers);
    		if ("columnUnit" in $$props) $$invalidate(6, columnUnit = $$props.columnUnit);
    		if ("columnOffset" in $$props) $$invalidate(7, columnOffset = $$props.columnOffset);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		momentDuration: moment$1.duration,
    		getPositionByDate,
    		ColumnHeaderRow,
    		headers,
    		columnUnit,
    		columnOffset,
    		from,
    		to,
    		width,
    		minHeader,
    		baseHeaderWidth,
    		baseHeaderDuration,
    		$from,
    		$to,
    		$width
    	});

    	$$self.$inject_state = $$props => {
    		if ("headers" in $$props) $$invalidate(0, headers = $$props.headers);
    		if ("columnUnit" in $$props) $$invalidate(6, columnUnit = $$props.columnUnit);
    		if ("columnOffset" in $$props) $$invalidate(7, columnOffset = $$props.columnOffset);
    		if ("minHeader" in $$props) $$invalidate(8, minHeader = $$props.minHeader);
    		if ("baseHeaderWidth" in $$props) $$invalidate(1, baseHeaderWidth = $$props.baseHeaderWidth);
    		if ("baseHeaderDuration" in $$props) $$invalidate(2, baseHeaderDuration = $$props.baseHeaderDuration);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*headers, columnUnit, columnOffset*/ 193) {
    			 {
    				let result = null;
    				let minDuration = null;

    				[...headers, { unit: columnUnit, offset: columnOffset }].forEach(header => {
    					const offset = header.offset || 1;
    					const duration$1 = moment$1.duration(offset, header.unit).asMilliseconds();

    					if (duration$1 < minDuration || minDuration === null) {
    						minDuration = duration$1;
    						result = header;
    					}
    				});

    				$$invalidate(8, minHeader = result);
    			}
    		}

    		if ($$self.$$.dirty & /*$from, minHeader, $to, $width, baseHeaderWidth*/ 3842) {
    			 {
    				$$invalidate(1, baseHeaderWidth = getPositionByDate($from.clone().add(minHeader.offset || 1, minHeader.unit), $from, $to, $width) | 0);
    				if (baseHeaderWidth <= 0) console.error("baseHeaderWidth is invalid, columns or headers might be too short for the current view.");
    			}
    		}

    		if ($$self.$$.dirty & /*minHeader*/ 256) {
    			 {
    				$$invalidate(2, baseHeaderDuration = moment$1.duration(minHeader.offset || 1, minHeader.unit).asMilliseconds());
    			}
    		}
    	};

    	return [
    		headers,
    		baseHeaderWidth,
    		baseHeaderDuration,
    		from,
    		to,
    		width,
    		columnUnit,
    		columnOffset,
    		minHeader,
    		$from,
    		$to,
    		$width,
    		dateSelected_handler
    	];
    }

    class ColumnHeader extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$7, create_fragment$7, safe_not_equal$1, {
    			headers: 0,
    			columnUnit: 6,
    			columnOffset: 7
    		});

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColumnHeader",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*headers*/ ctx[0] === undefined && !("headers" in props)) {
    			console_1$1.warn("<ColumnHeader> was created without expected prop 'headers'");
    		}

    		if (/*columnUnit*/ ctx[6] === undefined && !("columnUnit" in props)) {
    			console_1$1.warn("<ColumnHeader> was created without expected prop 'columnUnit'");
    		}

    		if (/*columnOffset*/ ctx[7] === undefined && !("columnOffset" in props)) {
    			console_1$1.warn("<ColumnHeader> was created without expected prop 'columnOffset'");
    		}
    	}

    	get headers() {
    		throw new Error("<ColumnHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headers(value) {
    		throw new Error("<ColumnHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columnUnit() {
    		throw new Error("<ColumnHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columnUnit(value) {
    		throw new Error("<ColumnHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columnOffset() {
    		throw new Error("<ColumnHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columnOffset(value) {
    		throw new Error("<ColumnHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\column\Columns.svelte generated by Svelte v3.23.0 */
    const file$7 = "src\\column\\Columns.svelte";

    function create_fragment$8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			attr_dev$1(div, "class", "sg-columns svelte-1clwlpk");
    			set_style(div, "background-image", /*backgroundImage*/ ctx[0]);
    			add_location$1(div, file$7, 45, 0, 1199);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*backgroundImage*/ 1) {
    				set_style(div, "background-image", /*backgroundImage*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function lineAt(ctx, x) {
    	ctx.beginPath();
    	ctx.moveTo(x, 0);
    	ctx.lineTo(x, 20);
    	ctx.stroke();
    }

    function createBackground(columns) {
    	const canvas = document.createElement("canvas");
    	canvas.width = columns.length * columns[0].width;
    	canvas.height = 20;
    	const ctx = canvas.getContext("2d");
    	ctx.shadowColor = "rgba(128,128,128,0.5)";
    	ctx.shadowOffsetX = 0;
    	ctx.shadowOffsetY = 0;
    	ctx.shadowBlur = 0.5;
    	ctx.lineWidth = 1;
    	ctx.lineCap = "square";
    	ctx.strokeStyle = "#efefef";
    	ctx.translate(0.5, 0.5);

    	columns.forEach(column => {
    		lineAt(ctx, column.left);
    	});

    	const dataURL = canvas.toDataURL();
    	return `url("${dataURL}")`;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { columns = [] } = $$props;
    	let backgroundImage;
    	const writable_props = ["columns"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Columns> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("Columns", $$slots, []);

    	$$self.$set = $$props => {
    		if ("columns" in $$props) $$invalidate(1, columns = $$props.columns);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onMount: onMount$1,
    		Column,
    		columns,
    		lineAt,
    		createBackground,
    		backgroundImage
    	});

    	$$self.$inject_state = $$props => {
    		if ("columns" in $$props) $$invalidate(1, columns = $$props.columns);
    		if ("backgroundImage" in $$props) $$invalidate(0, backgroundImage = $$props.backgroundImage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*columns*/ 2) {
    			 {
    				$$invalidate(0, backgroundImage = createBackground(columns.slice(0, 4)));
    			}
    		}
    	};

    	return [backgroundImage, columns];
    }

    class Columns extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$8, create_fragment$8, safe_not_equal$1, { columns: 1 });

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Columns",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get columns() {
    		throw new Error("<Columns>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columns(value) {
    		throw new Error("<Columns>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ui\Resizer.svelte generated by Svelte v3.23.0 */
    const file$8 = "src\\ui\\Resizer.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let resizer_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			attr_dev$1(div, "class", "sg-resize svelte-1cpm1hk");
    			set_style(div, "left", /*x*/ ctx[0] + "px");
    			add_location$1(div, file$8, 38, 0, 991);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(resizer_action = /*resizer*/ ctx[1].call(null, div));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*x*/ 1) {
    				set_style(div, "left", /*x*/ ctx[0] + "px");
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { x = 240 } = $$props;
    	let { container } = $$props;
    	let dragging = false;

    	const dragOptions = {
    		onDrag: event => {
    			($$invalidate(0, x = event.x), dragging = true);
    			dispatch("resize", { left: x });
    			setCursor("col-resize");
    		},
    		onDrop: event => {
    			($$invalidate(0, x = event.x), dragging = false);
    			dispatch("resize", { left: x });
    			setCursor("default");
    		},
    		dragAllowed: true,
    		resizeAllowed: false,
    		container,
    		getX: () => x,
    		getY: () => 0,
    		getWidth: () => 0
    	};

    	function resizer(node) {
    		return new Draggable(node, dragOptions);
    	}

    	const writable_props = ["x", "container"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Resizer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("Resizer", $$slots, []);

    	$$self.$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("container" in $$props) $$invalidate(2, container = $$props.container);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount: onMount$1,
    		dispatch,
    		Draggable,
    		setCursor,
    		x,
    		container,
    		dragging,
    		dragOptions,
    		resizer
    	});

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("container" in $$props) $$invalidate(2, container = $$props.container);
    		if ("dragging" in $$props) dragging = $$props.dragging;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*container*/ 4) {
    			 dragOptions.container = container;
    		}
    	};

    	return [x, resizer, container];
    }

    class Resizer extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$9, create_fragment$9, safe_not_equal$1, { x: 0, container: 2 });

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Resizer",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*container*/ ctx[2] === undefined && !("container" in props)) {
    			console.warn("<Resizer> was created without expected prop 'container'");
    		}
    	}

    	get x() {
    		throw new Error("<Resizer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Resizer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get container() {
    		throw new Error("<Resizer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set container(value) {
    		throw new Error("<Resizer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class SelectionManager {
        constructor() {
            this.selection = writable([]);
        }
        selectSingle(item) {
            this.selection.set([item]);
        }
        toggleSelection(item) {
            this.selection.update(items => {
                const index = items.indexOf(item);
                if (index !== -1) {
                    items.splice(index, 1);
                }
                else {
                    items.push(item);
                }
                return items;
            });
        }
        clearSelection() {
            this.selection.set([]);
        }
    }

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

    class RowFactory {
        constructor() {
        }
        createRow(row, y) {
            // defaults
            // id of task, every task needs to have a unique one
            //row.id = row.id || undefined;
            // css classes
            row.classes = row.classes || '';
            // html content of row
            row.contentHtml = row.contentHtml || undefined;
            // enable dragging of tasks to and from this row 
            row.enableDragging = row.enableDragging === undefined ? true : row.enableDragging;
            // height of row element
            const height = row.height || this.rowHeight;
            return {
                model: row,
                y,
                height,
                expanded: true
            };
        }
        createRows(rows) {
            const ctx = { y: 0, result: [] };
            this.createChildRows(rows, ctx);
            return ctx.result;
        }
        createChildRows(rowModels, ctx, parent = null, level = 0, parents = []) {
            const rowsAtLevel = [];
            const allRows = [];
            if (parent) {
                parents = [...parents, parent];
            }
            rowModels.forEach(rowModel => {
                const row = this.createRow(rowModel, ctx.y);
                ctx.result.push(row);
                rowsAtLevel.push(row);
                allRows.push(row);
                row.childLevel = level;
                row.parent = parent;
                row.allParents = parents;
                ctx.y += row.height;
                if (rowModel.children) {
                    const nextLevel = this.createChildRows(rowModel.children, ctx, row, level + 1, parents);
                    row.children = nextLevel.rows;
                    row.allChildren = nextLevel.allRows;
                    allRows.push(...nextLevel.allRows);
                }
            });
            return {
                rows: rowsAtLevel,
                allRows
            };
        }
    }

    class TimeRangeFactory {
        constructor(columnService) {
            this.columnService = columnService;
        }
        create(model) {
            // enable dragging
            model.enableResizing = model.enableResizing === undefined ? true : model.enableResizing;
            const left = this.columnService.getPositionByDate(model.from);
            const right = this.columnService.getPositionByDate(model.to);
            return {
                model,
                left: left,
                width: right - left,
                resizing: false
            };
        }
    }

    function findByPosition(columns, x) {
        const result = get(columns, x, c => c.left);
        return result;
    }
    function findByDate(columns, x) {
        const result = get(columns, x, c => c.from);
        return result;
    }

    const callbacks = {};
    function onDelegatedEvent(type, attr, callback) {
        if (!callbacks[type])
            callbacks[type] = {};
        callbacks[type][attr] = callback;
    }
    function offDelegatedEvent(type, attr) {
        delete callbacks[type][attr];
    }
    function matches(cbs, element) {
        let data;
        for (let attr in cbs) {
            if (data = element.getAttribute(attr)) {
                return { attr, data };
            }
        }
    }
    function onEvent(e) {
        let { type, target } = e;
        const cbs = callbacks[type];
        if (!cbs)
            return;
        let match;
        let element = target;
        while (element && element != e.currentTarget) {
            if ((match = matches(cbs, element))) {
                break;
            }
            element = element.parentElement;
        }
        if (match && cbs[match.attr]) {
            cbs[match.attr](e, match.data, element);
        }
    }

    /* src\Gantt.svelte generated by Svelte v3.23.0 */

    const { console: console_1$2 } = globals$1;
    const file$9 = "src\\Gantt.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[112] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[115] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[118] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[121] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[118] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[112] = list[i];
    	return child_ctx;
    }

    // (565:4) {#each ganttTableModules as module}
    function create_each_block_5(ctx) {
    	let t;
    	let current;

    	const switch_instance_spread_levels = [
    		{
    			rowContainerHeight: /*rowContainerHeight*/ ctx[14]
    		},
    		{ paddingTop: /*paddingTop*/ ctx[15] },
    		{ paddingBottom: /*paddingBottom*/ ctx[16] },
    		{ tableWidth: /*tableWidth*/ ctx[1] },
    		/*$$restProps*/ ctx[43],
    		{ visibleRows: /*visibleRows*/ ctx[17] }
    	];

    	var switch_value = /*module*/ ctx[112];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("init", onModuleInit);
    	}

    	const resizer = new Resizer({
    			props: {
    				x: /*tableWidth*/ ctx[1],
    				container: /*ganttElement*/ ctx[7]
    			},
    			$$inline: true
    		});

    	resizer.$on("resize", /*onResize*/ ctx[40]);

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t = space$1();
    			create_component(resizer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component$1(switch_instance, target, anchor);
    			}

    			insert_dev$1(target, t, anchor);
    			mount_component$1(resizer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty[0] & /*rowContainerHeight, paddingTop, paddingBottom, tableWidth, visibleRows*/ 245762 | dirty[1] & /*$$restProps*/ 4096)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty[0] & /*rowContainerHeight*/ 16384 && {
    						rowContainerHeight: /*rowContainerHeight*/ ctx[14]
    					},
    					dirty[0] & /*paddingTop*/ 32768 && { paddingTop: /*paddingTop*/ ctx[15] },
    					dirty[0] & /*paddingBottom*/ 65536 && { paddingBottom: /*paddingBottom*/ ctx[16] },
    					dirty[0] & /*tableWidth*/ 2 && { tableWidth: /*tableWidth*/ ctx[1] },
    					dirty[1] & /*$$restProps*/ 4096 && get_spread_object(/*$$restProps*/ ctx[43]),
    					dirty[0] & /*visibleRows*/ 131072 && { visibleRows: /*visibleRows*/ ctx[17] }
    				])
    			: {};

    			if (switch_value !== (switch_value = /*module*/ ctx[112])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component$1(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("init", onModuleInit);
    					create_component(switch_instance.$$.fragment);
    					transition_in$1(switch_instance.$$.fragment, 1);
    					mount_component$1(switch_instance, t.parentNode, t);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}

    			const resizer_changes = {};
    			if (dirty[0] & /*tableWidth*/ 2) resizer_changes.x = /*tableWidth*/ ctx[1];
    			if (dirty[0] & /*ganttElement*/ 128) resizer_changes.container = /*ganttElement*/ ctx[7];
    			resizer.$set(resizer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in$1(switch_instance.$$.fragment, local);
    			transition_in$1(resizer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			transition_out(resizer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (switch_instance) destroy_component$1(switch_instance, detaching);
    			if (detaching) detach_dev$1(t);
    			destroy_component$1(resizer, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(565:4) {#each ganttTableModules as module}",
    		ctx
    	});

    	return block;
    }

    // (576:20) {#each $allTimeRanges as timeRange (timeRange.id)}
    function create_each_block_4(key_1, ctx) {
    	let first;
    	let current;
    	const timerangeheader_spread_levels = [/*timeRange*/ ctx[118]];
    	let timerangeheader_props = {};

    	for (let i = 0; i < timerangeheader_spread_levels.length; i += 1) {
    		timerangeheader_props = assign(timerangeheader_props, timerangeheader_spread_levels[i]);
    	}

    	const timerangeheader = new TimeRangeHeader({
    			props: timerangeheader_props,
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(timerangeheader.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, first, anchor);
    			mount_component$1(timerangeheader, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const timerangeheader_changes = (dirty[0] & /*$allTimeRanges*/ 8388608)
    			? get_spread_update(timerangeheader_spread_levels, [get_spread_object(/*timeRange*/ ctx[118])])
    			: {};

    			timerangeheader.$set(timerangeheader_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(timerangeheader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timerangeheader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(first);
    			destroy_component$1(timerangeheader, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(576:20) {#each $allTimeRanges as timeRange (timeRange.id)}",
    		ctx
    	});

    	return block;
    }

    // (589:24) {#each visibleRows as row (row.model.id)}
    function create_each_block_3(key_1, ctx) {
    	let first;
    	let current;

    	const row = new Row({
    			props: { row: /*row*/ ctx[121] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(row.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, first, anchor);
    			mount_component$1(row, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row_changes = {};
    			if (dirty[0] & /*visibleRows*/ 131072) row_changes.row = /*row*/ ctx[121];
    			row.$set(row_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(row.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(first);
    			destroy_component$1(row, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(589:24) {#each visibleRows as row (row.model.id)}",
    		ctx
    	});

    	return block;
    }

    // (595:20) {#each $allTimeRanges as timeRange (timeRange.id)}
    function create_each_block_2(key_1, ctx) {
    	let first;
    	let current;
    	const timerange_spread_levels = [/*timeRange*/ ctx[118]];
    	let timerange_props = {};

    	for (let i = 0; i < timerange_spread_levels.length; i += 1) {
    		timerange_props = assign(timerange_props, timerange_spread_levels[i]);
    	}

    	const timerange = new TimeRange({ props: timerange_props, $$inline: true });

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(timerange.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, first, anchor);
    			mount_component$1(timerange, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const timerange_changes = (dirty[0] & /*$allTimeRanges*/ 8388608)
    			? get_spread_update(timerange_spread_levels, [get_spread_object(/*timeRange*/ ctx[118])])
    			: {};

    			timerange.$set(timerange_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(timerange.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timerange.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(first);
    			destroy_component$1(timerange, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(595:20) {#each $allTimeRanges as timeRange (timeRange.id)}",
    		ctx
    	});

    	return block;
    }

    // (599:20) {#each visibleTasks as task (task.model.id)}
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let current;

    	const task_spread_levels = [
    		{ model: /*task*/ ctx[115].model },
    		{ left: /*task*/ ctx[115].left },
    		{ width: /*task*/ ctx[115].width },
    		{ height: /*task*/ ctx[115].height },
    		{ top: /*task*/ ctx[115].top },
    		/*task*/ ctx[115]
    	];

    	let task_props = {};

    	for (let i = 0; i < task_spread_levels.length; i += 1) {
    		task_props = assign(task_props, task_spread_levels[i]);
    	}

    	const task = new Task({ props: task_props, $$inline: true });

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(task.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, first, anchor);
    			mount_component$1(task, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const task_changes = (dirty[0] & /*visibleTasks*/ 262144)
    			? get_spread_update(task_spread_levels, [
    					{ model: /*task*/ ctx[115].model },
    					{ left: /*task*/ ctx[115].left },
    					{ width: /*task*/ ctx[115].width },
    					{ height: /*task*/ ctx[115].height },
    					{ top: /*task*/ ctx[115].top },
    					get_spread_object(/*task*/ ctx[115])
    				])
    			: {};

    			task.$set(task_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(task.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(task.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(first);
    			destroy_component$1(task, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(599:20) {#each visibleTasks as task (task.model.id)}",
    		ctx
    	});

    	return block;
    }

    // (604:16) {#each ganttBodyModules as module}
    function create_each_block$2(ctx) {
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ paddingTop: /*paddingTop*/ ctx[15] },
    		{ paddingBottom: /*paddingBottom*/ ctx[16] },
    		{ visibleRows: /*visibleRows*/ ctx[17] },
    		/*$$restProps*/ ctx[43]
    	];

    	var switch_value = /*module*/ ctx[112];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("init", onModuleInit);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component$1(switch_instance, target, anchor);
    			}

    			insert_dev$1(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty[0] & /*paddingTop, paddingBottom, visibleRows*/ 229376 | dirty[1] & /*$$restProps*/ 4096)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty[0] & /*paddingTop*/ 32768 && { paddingTop: /*paddingTop*/ ctx[15] },
    					dirty[0] & /*paddingBottom*/ 65536 && { paddingBottom: /*paddingBottom*/ ctx[16] },
    					dirty[0] & /*visibleRows*/ 131072 && { visibleRows: /*visibleRows*/ ctx[17] },
    					dirty[1] & /*$$restProps*/ 4096 && get_spread_object(/*$$restProps*/ ctx[43])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*module*/ ctx[112])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component$1(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("init", onModuleInit);
    					create_component(switch_instance.$$.fragment);
    					transition_in$1(switch_instance.$$.fragment, 1);
    					mount_component$1(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in$1(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(switch_instance_anchor);
    			if (switch_instance) destroy_component$1(switch_instance, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(604:16) {#each ganttBodyModules as module}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div9;
    	let t0;
    	let div8;
    	let div2;
    	let div1;
    	let div0;
    	let t1;
    	let each_blocks_4 = [];
    	let each1_lookup = new Map();
    	let horizontalScrollListener_action;
    	let div2_resize_listener;
    	let t2;
    	let div7;
    	let div6;
    	let t3;
    	let div4;
    	let div3;
    	let each_blocks_3 = [];
    	let each2_lookup = new Map();
    	let t4;
    	let div5;
    	let each_blocks_2 = [];
    	let each3_lookup = new Map();
    	let t5;
    	let each_blocks_1 = [];
    	let each4_lookup = new Map();
    	let t6;
    	let scrollable_action;
    	let div7_resize_listener;
    	let div9_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_5 = /*ganttTableModules*/ ctx[5];
    	validate_each_argument(each_value_5);
    	let each_blocks_5 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_5[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const out = i => transition_out(each_blocks_5[i], 1, 1, () => {
    		each_blocks_5[i] = null;
    	});

    	const columnheader = new ColumnHeader({
    			props: {
    				headers: /*headers*/ ctx[0],
    				columnUnit: /*columnUnit*/ ctx[2],
    				columnOffset: /*columnOffset*/ ctx[3]
    			},
    			$$inline: true
    		});

    	columnheader.$on("dateSelected", /*onDateSelected*/ ctx[42]);
    	let each_value_4 = /*$allTimeRanges*/ ctx[23];
    	validate_each_argument(each_value_4);
    	const get_key = ctx => /*timeRange*/ ctx[118].id;
    	validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		let child_ctx = get_each_context_4(ctx, each_value_4, i);
    		let key = get_key(child_ctx);
    		each1_lookup.set(key, each_blocks_4[i] = create_each_block_4(key, child_ctx));
    	}

    	const columns_1 = new Columns({
    			props: { columns: /*columns*/ ctx[11] },
    			$$inline: true
    		});

    	let each_value_3 = /*visibleRows*/ ctx[17];
    	validate_each_argument(each_value_3);
    	const get_key_1 = ctx => /*row*/ ctx[121].model.id;
    	validate_each_keys(ctx, each_value_3, get_each_context_3, get_key_1);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3(ctx, each_value_3, i);
    		let key = get_key_1(child_ctx);
    		each2_lookup.set(key, each_blocks_3[i] = create_each_block_3(key, child_ctx));
    	}

    	let each_value_2 = /*$allTimeRanges*/ ctx[23];
    	validate_each_argument(each_value_2);
    	const get_key_2 = ctx => /*timeRange*/ ctx[118].id;
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_2);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key_2(child_ctx);
    		each3_lookup.set(key, each_blocks_2[i] = create_each_block_2(key, child_ctx));
    	}

    	let each_value_1 = /*visibleTasks*/ ctx[18];
    	validate_each_argument(each_value_1);
    	const get_key_3 = ctx => /*task*/ ctx[115].model.id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key_3);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key_3(child_ctx);
    		each4_lookup.set(key, each_blocks_1[i] = create_each_block_1(key, child_ctx));
    	}

    	let each_value = /*ganttBodyModules*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div9 = element$1("div");

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].c();
    			}

    			t0 = space$1();
    			div8 = element$1("div");
    			div2 = element$1("div");
    			div1 = element$1("div");
    			div0 = element$1("div");
    			create_component(columnheader.$$.fragment);
    			t1 = space$1();

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t2 = space$1();
    			div7 = element$1("div");
    			div6 = element$1("div");
    			create_component(columns_1.$$.fragment);
    			t3 = space$1();
    			div4 = element$1("div");
    			div3 = element$1("div");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t4 = space$1();
    			div5 = element$1("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t5 = space$1();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space$1();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev$1(div0, "class", "header-container svelte-t99ngj");
    			set_style(div0, "width", /*$_width*/ ctx[20] + "px");
    			add_location$1(div0, file$9, 573, 16, 18651);
    			attr_dev$1(div1, "class", "sg-header-scroller svelte-t99ngj");
    			add_location$1(div1, file$9, 572, 12, 18572);
    			attr_dev$1(div2, "class", "sg-header svelte-t99ngj");
    			add_render_callback$1(() => /*div2_elementresize_handler*/ ctx[107].call(div2));
    			toggle_class(div2, "right-scrollbar-visible", /*rightScrollbarVisible*/ ctx[13]);
    			add_location$1(div2, file$9, 571, 8, 18411);
    			set_style(div3, "transform", "translateY(" + /*paddingTop*/ ctx[15] + "px)");
    			add_location$1(div3, file$9, 587, 20, 19479);
    			attr_dev$1(div4, "class", "sg-rows svelte-t99ngj");
    			set_style(div4, "height", /*rowContainerHeight*/ ctx[14] + "px");
    			add_location$1(div4, file$9, 586, 16, 19372);
    			attr_dev$1(div5, "class", "sg-foreground svelte-t99ngj");
    			add_location$1(div5, file$9, 593, 16, 19744);
    			attr_dev$1(div6, "class", "content svelte-t99ngj");
    			set_style(div6, "width", /*$_width*/ ctx[20] + "px");
    			add_location$1(div6, file$9, 584, 12, 19261);
    			attr_dev$1(div7, "class", "sg-timeline-body svelte-t99ngj");
    			add_render_callback$1(() => /*div7_elementresize_handler*/ ctx[110].call(div7));
    			toggle_class(div7, "zooming", /*zooming*/ ctx[12]);
    			add_location$1(div7, file$9, 582, 8, 19047);
    			attr_dev$1(div8, "class", "sg-timeline sg-view svelte-t99ngj");
    			add_location$1(div8, file$9, 570, 4, 18368);
    			attr_dev$1(div9, "class", div9_class_value = "sg-gantt " + /*classes*/ ctx[4] + " svelte-t99ngj");
    			toggle_class(div9, "sg-disable-transition", !/*disableTransition*/ ctx[19]);
    			add_location$1(div9, file$9, 563, 0, 17898);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div9, anchor);

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].m(div9, null);
    			}

    			append_dev$1(div9, t0);
    			append_dev$1(div9, div8);
    			append_dev$1(div8, div2);
    			append_dev$1(div2, div1);
    			append_dev$1(div1, div0);
    			mount_component$1(columnheader, div0, null);
    			append_dev$1(div0, t1);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].m(div0, null);
    			}

    			/*div2_binding*/ ctx[106](div2);
    			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[107].bind(div2));
    			append_dev$1(div8, t2);
    			append_dev$1(div8, div7);
    			append_dev$1(div7, div6);
    			mount_component$1(columns_1, div6, null);
    			append_dev$1(div6, t3);
    			append_dev$1(div6, div4);
    			append_dev$1(div4, div3);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(div3, null);
    			}

    			/*div4_binding*/ ctx[108](div4);
    			append_dev$1(div6, t4);
    			append_dev$1(div6, div5);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div5, null);
    			}

    			append_dev$1(div5, t5);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div5, null);
    			}

    			append_dev$1(div6, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div6, null);
    			}

    			/*div7_binding*/ ctx[109](div7);
    			div7_resize_listener = add_resize_listener(div7, /*div7_elementresize_handler*/ ctx[110].bind(div7));
    			/*div9_binding*/ ctx[111](div9);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(horizontalScrollListener_action = /*horizontalScrollListener*/ ctx[39].call(null, div1)),
    					action_destroyer(scrollable_action = /*scrollable*/ ctx[38].call(null, div7)),
    					listen_dev$1(div7, "wheel", /*onwheel*/ ctx[41], false, false, false),
    					listen_dev$1(div9, "click", onEvent, false, false, false),
    					listen_dev$1(div9, "mouseover", onEvent, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*tableWidth, ganttElement, ganttTableModules, rowContainerHeight, paddingTop, paddingBottom, visibleRows*/ 245922 | dirty[1] & /*onResize, $$restProps*/ 4608) {
    				each_value_5 = /*ganttTableModules*/ ctx[5];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks_5[i]) {
    						each_blocks_5[i].p(child_ctx, dirty);
    						transition_in$1(each_blocks_5[i], 1);
    					} else {
    						each_blocks_5[i] = create_each_block_5(child_ctx);
    						each_blocks_5[i].c();
    						transition_in$1(each_blocks_5[i], 1);
    						each_blocks_5[i].m(div9, t0);
    					}
    				}

    				group_outros();

    				for (i = each_value_5.length; i < each_blocks_5.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const columnheader_changes = {};
    			if (dirty[0] & /*headers*/ 1) columnheader_changes.headers = /*headers*/ ctx[0];
    			if (dirty[0] & /*columnUnit*/ 4) columnheader_changes.columnUnit = /*columnUnit*/ ctx[2];
    			if (dirty[0] & /*columnOffset*/ 8) columnheader_changes.columnOffset = /*columnOffset*/ ctx[3];
    			columnheader.$set(columnheader_changes);

    			if (dirty[0] & /*$allTimeRanges*/ 8388608) {
    				const each_value_4 = /*$allTimeRanges*/ ctx[23];
    				validate_each_argument(each_value_4);
    				group_outros();
    				validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);
    				each_blocks_4 = update_keyed_each(each_blocks_4, dirty, get_key, 1, ctx, each_value_4, each1_lookup, div0, outro_and_destroy_block, create_each_block_4, null, get_each_context_4);
    				check_outros();
    			}

    			if (!current || dirty[0] & /*$_width*/ 1048576) {
    				set_style(div0, "width", /*$_width*/ ctx[20] + "px");
    			}

    			if (dirty[0] & /*rightScrollbarVisible*/ 8192) {
    				toggle_class(div2, "right-scrollbar-visible", /*rightScrollbarVisible*/ ctx[13]);
    			}

    			const columns_1_changes = {};
    			if (dirty[0] & /*columns*/ 2048) columns_1_changes.columns = /*columns*/ ctx[11];
    			columns_1.$set(columns_1_changes);

    			if (dirty[0] & /*visibleRows*/ 131072) {
    				const each_value_3 = /*visibleRows*/ ctx[17];
    				validate_each_argument(each_value_3);
    				group_outros();
    				validate_each_keys(ctx, each_value_3, get_each_context_3, get_key_1);
    				each_blocks_3 = update_keyed_each(each_blocks_3, dirty, get_key_1, 1, ctx, each_value_3, each2_lookup, div3, outro_and_destroy_block, create_each_block_3, null, get_each_context_3);
    				check_outros();
    			}

    			if (!current || dirty[0] & /*paddingTop*/ 32768) {
    				set_style(div3, "transform", "translateY(" + /*paddingTop*/ ctx[15] + "px)");
    			}

    			if (!current || dirty[0] & /*rowContainerHeight*/ 16384) {
    				set_style(div4, "height", /*rowContainerHeight*/ ctx[14] + "px");
    			}

    			if (dirty[0] & /*$allTimeRanges*/ 8388608) {
    				const each_value_2 = /*$allTimeRanges*/ ctx[23];
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_2);
    				each_blocks_2 = update_keyed_each(each_blocks_2, dirty, get_key_2, 1, ctx, each_value_2, each3_lookup, div5, outro_and_destroy_block, create_each_block_2, t5, get_each_context_2);
    				check_outros();
    			}

    			if (dirty[0] & /*visibleTasks*/ 262144) {
    				const each_value_1 = /*visibleTasks*/ ctx[18];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key_3);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key_3, 1, ctx, each_value_1, each4_lookup, div5, outro_and_destroy_block, create_each_block_1, null, get_each_context_1);
    				check_outros();
    			}

    			if (dirty[0] & /*ganttBodyModules, paddingTop, paddingBottom, visibleRows*/ 229440 | dirty[1] & /*$$restProps*/ 4096) {
    				each_value = /*ganttBodyModules*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in$1(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in$1(each_blocks[i], 1);
    						each_blocks[i].m(div6, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty[0] & /*$_width*/ 1048576) {
    				set_style(div6, "width", /*$_width*/ ctx[20] + "px");
    			}

    			if (dirty[0] & /*zooming*/ 4096) {
    				toggle_class(div7, "zooming", /*zooming*/ ctx[12]);
    			}

    			if (!current || dirty[0] & /*classes*/ 16 && div9_class_value !== (div9_class_value = "sg-gantt " + /*classes*/ ctx[4] + " svelte-t99ngj")) {
    				attr_dev$1(div9, "class", div9_class_value);
    			}

    			if (dirty[0] & /*classes, disableTransition*/ 524304) {
    				toggle_class(div9, "sg-disable-transition", !/*disableTransition*/ ctx[19]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_5.length; i += 1) {
    				transition_in$1(each_blocks_5[i]);
    			}

    			transition_in$1(columnheader.$$.fragment, local);

    			for (let i = 0; i < each_value_4.length; i += 1) {
    				transition_in$1(each_blocks_4[i]);
    			}

    			transition_in$1(columns_1.$$.fragment, local);

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in$1(each_blocks_3[i]);
    			}

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in$1(each_blocks_2[i]);
    			}

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in$1(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in$1(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_5 = each_blocks_5.filter(Boolean);

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				transition_out(each_blocks_5[i]);
    			}

    			transition_out(columnheader.$$.fragment, local);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				transition_out(each_blocks_4[i]);
    			}

    			transition_out(columns_1.$$.fragment, local);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				transition_out(each_blocks_3[i]);
    			}

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				transition_out(each_blocks_2[i]);
    			}

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div9);
    			destroy_each(each_blocks_5, detaching);
    			destroy_component$1(columnheader);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].d();
    			}

    			/*div2_binding*/ ctx[106](null);
    			div2_resize_listener();
    			destroy_component$1(columns_1);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].d();
    			}

    			/*div4_binding*/ ctx[108](null);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].d();
    			}

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			destroy_each(each_blocks, detaching);
    			/*div7_binding*/ ctx[109](null);
    			div7_resize_listener();
    			/*div9_binding*/ ctx[111](null);
    			mounted = false;
    			run_all$1(dispose);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function onModuleInit(module) {
    	
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"rows","tasks","timeRanges","rowPadding","rowHeight","from","to","minWidth","fitWidth","classes","headers","zoomLevels","taskContent","tableWidth","resizeHandleWidth","onTaskButtonClick","magnetUnit","magnetOffset","columnUnit","columnOffset","ganttTableModules","ganttBodyModules","reflectOnParentRows","reflectOnChildRows","columnService","api","taskFactory","rowFactory","dndManager","timeRangeFactory","utils","refreshTimeRanges","refreshTasks","getRowContainer","selectTask","scrollToRow","scrollToTask","updateTask"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let $_from;
    	let $_to;
    	let $_width;
    	let $columnWidth;
    	let $dimensionsChanged;
    	let $taskStore;
    	let $hoveredRow;
    	let $selectedRow;
    	let $_minWidth;
    	let $_fitWidth;
    	let $_rowPadding;
    	let $rowStore;
    	let $allTasks;
    	let $allRows;
    	let $visibleHeight;
    	let $rowTaskCache;
    	let $headerHeight;
    	let $allTimeRanges;
    	let $visibleWidth;
    	validate_store(taskStore, "taskStore");
    	component_subscribe($$self, taskStore, $$value => $$invalidate(87, $taskStore = $$value));
    	validate_store(rowStore, "rowStore");
    	component_subscribe($$self, rowStore, $$value => $$invalidate(93, $rowStore = $$value));
    	validate_store(allTasks, "allTasks");
    	component_subscribe($$self, allTasks, $$value => $$invalidate(94, $allTasks = $$value));
    	validate_store(allRows, "allRows");
    	component_subscribe($$self, allRows, $$value => $$invalidate(95, $allRows = $$value));
    	validate_store(rowTaskCache, "rowTaskCache");
    	component_subscribe($$self, rowTaskCache, $$value => $$invalidate(96, $rowTaskCache = $$value));
    	validate_store(allTimeRanges, "allTimeRanges");
    	component_subscribe($$self, allTimeRanges, $$value => $$invalidate(23, $allTimeRanges = $$value));
    	let ganttElement;
    	let mainHeaderContainer;
    	let mainContainer;
    	let rowContainer;
    	let scrollables = [];
    	let mounted = false;
    	let { rows } = $$props;
    	let { tasks = [] } = $$props;
    	let { timeRanges = [] } = $$props;
    	let { rowPadding = 6 } = $$props;
    	let { rowHeight = 52 } = $$props;
    	const _rowHeight = writable(rowHeight);
    	const _rowPadding = writable(rowPadding);
    	validate_store(_rowPadding, "_rowPadding");
    	component_subscribe($$self, _rowPadding, value => $$invalidate(92, $_rowPadding = value));
    	let { from } = $$props;
    	let { to } = $$props;
    	const _from = writable(from);
    	validate_store(_from, "_from");
    	component_subscribe($$self, _from, value => $$invalidate(83, $_from = value));
    	const _to = writable(to);
    	validate_store(_to, "_to");
    	component_subscribe($$self, _to, value => $$invalidate(84, $_to = value));
    	let { minWidth = 800 } = $$props;
    	let { fitWidth = false } = $$props;
    	const _minWidth = writable(minWidth);
    	validate_store(_minWidth, "_minWidth");
    	component_subscribe($$self, _minWidth, value => $$invalidate(90, $_minWidth = value));
    	const _fitWidth = writable(fitWidth);
    	validate_store(_fitWidth, "_fitWidth");
    	component_subscribe($$self, _fitWidth, value => $$invalidate(91, $_fitWidth = value));
    	let { classes = [] } = $$props;
    	let { headers = [{ unit: "day", format: "MMMM Do" }, { unit: "hour", format: "H:mm" }] } = $$props;

    	let { zoomLevels = [
    		{
    			headers: [{ unit: "day", format: "DD.MM.YYYY" }, { unit: "hour", format: "HH" }],
    			minWidth: 800,
    			fitWidth: true
    		},
    		{
    			headers: [
    				{ unit: "hour", format: "ddd D/M, H A" },
    				{ unit: "minute", format: "mm", offset: 15 }
    			],
    			minWidth: 5000,
    			fitWidth: false
    		}
    	] } = $$props;

    	let { taskContent = null } = $$props;
    	let { tableWidth = 100 } = $$props;
    	let { resizeHandleWidth = 10 } = $$props;
    	let { onTaskButtonClick = null } = $$props;
    	let { magnetUnit = "minute" } = $$props;
    	let { magnetOffset = 15 } = $$props;
    	let { columnUnit = "minute" } = $$props;
    	let { columnOffset = 15 } = $$props;
    	let { ganttTableModules = [] } = $$props;
    	let { ganttBodyModules = [] } = $$props;
    	let { reflectOnParentRows = true } = $$props;
    	let { reflectOnChildRows = false } = $$props;
    	const visibleWidth = writable();
    	validate_store(visibleWidth, "visibleWidth");
    	component_subscribe($$self, visibleWidth, value => $$invalidate(24, $visibleWidth = value));
    	const visibleHeight = writable();
    	validate_store(visibleHeight, "visibleHeight");
    	component_subscribe($$self, visibleHeight, value => $$invalidate(21, $visibleHeight = value));
    	const headerHeight = writable();
    	validate_store(headerHeight, "headerHeight");
    	component_subscribe($$self, headerHeight, value => $$invalidate(22, $headerHeight = value));

    	const _width = derived([visibleWidth, _minWidth, _fitWidth], ([visible, min, stretch]) => {
    		return stretch && visible > min ? visible : min;
    	});

    	validate_store(_width, "_width");
    	component_subscribe($$self, _width, value => $$invalidate(20, $_width = value));

    	const columnService = {
    		getColumnByDate(date) {
    			const pair = findByDate(columns, date);
    			return !pair[0] ? pair[1] : pair[0];
    		},
    		getColumnByPosition(x) {
    			const pair = findByPosition(columns, x);
    			return !pair[0] ? pair[1] : pair[0];
    		},
    		getPositionByDate(date) {
    			if (!date) return null;
    			const column = this.getColumnByDate(date);
    			let durationTo = date.diff(column.from, "milliseconds");
    			const position = durationTo / column.duration * column.width;

    			//multiples - skip every nth col, use other duration
    			return column.left + position;
    		},
    		getDateByPosition(x) {
    			const column = this.getColumnByPosition(x);
    			x = x - column.left;
    			let positionDuration = column.duration / column.width * x;
    			const date = moment(column.from).add(positionDuration, "milliseconds");
    			return date;
    		},
    		/**
     * 
     * @param {Moment} date - Date
     * @returns {Moment} rounded date passed as parameter
     */
    		roundTo(date) {
    			let value = date.get(magnetUnit);
    			value = Math.round(value / magnetOffset);
    			date.set(magnetUnit, value * magnetOffset);

    			//round all smaller units to 0
    			const units = ["millisecond", "second", "minute", "hour", "date", "month", "year"];

    			const indexOf = units.indexOf(magnetUnit);

    			for (let i = 0; i < indexOf; i++) {
    				date.set(units[i], 0);
    			}

    			return date;
    		}
    	};

    	const columnWidth = writable(getPositionByDate($_from.clone().add(columnOffset, columnUnit), $_from, $_to, $_width) | 0);
    	validate_store(columnWidth, "columnWidth");
    	component_subscribe($$self, columnWidth, value => $$invalidate(85, $columnWidth = value));
    	let columnCount = Math.ceil($_width / $columnWidth);
    	let columns = getColumns($_from, columnCount, columnOffset, columnUnit, $columnWidth);

    	function getColumns(from, count, offset, unit, width) {
    		let columns = [];
    		let columnFrom = from.clone();
    		let left = 0;

    		for (let i = 0; i < count; i++) {
    			const from = columnFrom.clone();
    			const to = columnFrom.add(offset, unit);
    			const duration = to.diff(from, "milliseconds");
    			columns.push({ width, from, left, duration });
    			left += width;
    			columnFrom = to;
    		}

    		return columns;
    	}

    	const dimensionsChanged = derived([columnWidth, _from, _to], () => ({}));
    	validate_store(dimensionsChanged, "dimensionsChanged");
    	component_subscribe($$self, dimensionsChanged, value => $$invalidate(86, $dimensionsChanged = value));

    	setContext("dimensions", {
    		from: _from,
    		to: _to,
    		width: _width,
    		visibleWidth,
    		visibleHeight,
    		headerHeight,
    		dimensionsChanged
    	});

    	setContext("options", {
    		taskContent,
    		rowPadding: _rowPadding,
    		rowHeight: _rowHeight,
    		resizeHandleWidth,
    		reflectOnParentRows,
    		reflectOnChildRows,
    		onTaskButtonClick
    	});

    	const hoveredRow = writable();
    	validate_store(hoveredRow, "hoveredRow");
    	component_subscribe($$self, hoveredRow, value => $$invalidate(88, $hoveredRow = value));
    	const selectedRow = writable();
    	validate_store(selectedRow, "selectedRow");
    	component_subscribe($$self, selectedRow, value => $$invalidate(89, $selectedRow = value));
    	const ganttContext = { scrollables, hoveredRow, selectedRow };
    	setContext("gantt", ganttContext);

    	onMount$1(() => {
    		Object.assign(ganttContext, {
    			rowContainer,
    			mainContainer,
    			mainHeaderContainer
    		});

    		api.registerEvent("tasks", "move");
    		api.registerEvent("tasks", "select");
    		api.registerEvent("tasks", "switchRow");
    		api.registerEvent("tasks", "moveEnd");
    		api.registerEvent("tasks", "changed");
    		api.registerEvent("gantt", "viewChanged");
    		$$invalidate(75, mounted = true);
    	});

    	onDelegatedEvent("click", "data-task-id", (event, data, target) => {
    		const taskId = +data;

    		if (event.ctrlKey) {
    			selectionManager.toggleSelection(taskId);
    		} else {
    			selectionManager.selectSingle(taskId);
    		}

    		api.tasks.raise.select($taskStore.entities[taskId]);
    	});

    	onDelegatedEvent("mouseover", "data-row-id", (event, data, target) => {
    		set_store_value(hoveredRow, $hoveredRow = +data);
    	});

    	onDelegatedEvent("click", "data-row-id", (event, data, target) => {
    		set_store_value(selectedRow, $selectedRow = +data);
    	});

    	onDestroy(() => {
    		offDelegatedEvent("click", "data-task-id");
    		offDelegatedEvent("click", "data-row-id");
    	});

    	let __scrollTop = 0;
    	let __scrollLeft = 0;

    	function scrollable(node) {
    		const onscroll = event => {
    			const { scrollTop, scrollLeft } = node;

    			scrollables.forEach(scrollable => {
    				if (scrollable.orientation === "horizontal") {
    					scrollable.node.scrollLeft = scrollLeft;
    				} else {
    					scrollable.node.scrollTop = scrollTop;
    				}
    			});

    			$$invalidate(77, __scrollTop = scrollTop);
    			__scrollLeft = scrollLeft;
    		};

    		node.addEventListener("scroll", onscroll);

    		return {
    			destroy() {
    				node.removeEventListener("scroll", onscroll, false);
    			}
    		};
    	}

    	function horizontalScrollListener(node) {
    		scrollables.push({ node, orientation: "horizontal" });
    	}

    	function onResize(event) {
    		$$invalidate(1, tableWidth = event.detail.left);
    	}

    	let zoomLevel = 0;
    	let zooming = false;

    	async function onwheel(event) {
    		if (event.ctrlKey) {
    			event.preventDefault();
    			const prevZoomLevel = zoomLevel;

    			if (event.deltaY > 0) {
    				zoomLevel = Math.max(zoomLevel - 1, 0);
    			} else {
    				zoomLevel = Math.min(zoomLevel + 1, zoomLevels.length - 1);
    			}

    			if (prevZoomLevel != zoomLevel && zoomLevels[zoomLevel]) {
    				const options = {
    					columnUnit,
    					columnOffset,
    					minWidth: $_minWidth,
    					...zoomLevels[zoomLevel]
    				};

    				const scale = options.minWidth / $_width;
    				const node = mainContainer;
    				const mousepos = getRelativePos(node, event);
    				const before = node.scrollLeft + mousepos.x;
    				const after = before * scale;
    				const scrollLeft = after - mousepos.x + node.clientWidth / 2;
    				console.log("scrollLeft", scrollLeft);
    				$$invalidate(2, columnUnit = options.columnUnit);
    				$$invalidate(3, columnOffset = options.columnOffset);
    				set_store_value(_minWidth, $_minWidth = options.minWidth);
    				if (options.headers) $$invalidate(0, headers = options.headers);
    				if (options.fitWidth) set_store_value(_fitWidth, $_fitWidth = options.fitWidth);
    				api.gantt.raise.viewChanged();
    				$$invalidate(12, zooming = true);
    				await tick();
    				node.scrollLeft = scrollLeft;
    				$$invalidate(12, zooming = false);
    			}
    		}
    	}

    	function onDateSelected(event) {
    		set_store_value(_from, $_from = event.detail.from.clone());
    		set_store_value(_to, $_to = event.detail.to.clone());
    	}

    	function initRows(rowsData) {
    		const rows = rowFactory.createRows(rowsData);
    		rowStore.addAll(rows);
    	}

    	async function initTasks(taskData) {
    		await tick();
    		const tasks = [];
    		const opts = { rowPadding: $_rowPadding };

    		taskData.forEach(t => {
    			const task = taskFactory.createTask(t);
    			const row = $rowStore.entities[task.model.resourceId];
    			task.reflections = [];

    			if (reflectOnChildRows && row.allChildren) {
    				row.allChildren.forEach(r => {
    					const reflectedTask = reflectTask(task, r, opts);
    					task.reflections.push(reflectedTask.model.id);
    					tasks.push(reflectedTask);
    				});
    			}

    			if (reflectOnParentRows && row.allParents.length > 0) {
    				row.allParents.forEach(r => {
    					const reflectedTask = reflectTask(task, r, opts);
    					task.reflections.push(reflectedTask.model.id);
    					tasks.push(reflectedTask);
    				});
    			}

    			tasks.push(task);
    		});

    		taskStore.addAll(tasks);
    	}

    	function initTimeRanges(timeRangeData) {
    		const timeRanges = timeRangeData.map(timeRange => {
    			return timeRangeFactory.create(timeRange);
    		});

    		timeRangeStore.addAll(timeRanges);
    	}

    	async function tickWithoutCSSTransition() {
    		$$invalidate(19, disableTransition = false);
    		await tick();
    		ganttElement.offsetHeight; // force a reflow
    		$$invalidate(19, disableTransition = true);
    	}

    	const api = new GanttApi();
    	const selectionManager = new SelectionManager();
    	const taskFactory = new TaskFactory(columnService);
    	const rowFactory = new RowFactory();
    	const dndManager = new DragDropManager(rowStore);
    	const timeRangeFactory = new TimeRangeFactory(columnService);
    	const utils = new GanttUtils();

    	setContext("services", {
    		utils,
    		api,
    		dndManager,
    		selectionManager,
    		columnService
    	});

    	function refreshTimeRanges() {
    		timeRangeStore._update(({ ids, entities }) => {
    			ids.forEach(id => {
    				const timeRange = entities[id];
    				const newLeft = columnService.getPositionByDate(timeRange.model.from) | 0;
    				const newRight = columnService.getPositionByDate(timeRange.model.to) | 0;
    				timeRange.left = newLeft;
    				timeRange.width = newRight - newLeft;
    			});

    			return { ids, entities };
    		});
    	}

    	function refreshTasks() {
    		$allTasks.forEach(task => {
    			const newLeft = columnService.getPositionByDate(task.model.from) | 0;
    			const newRight = columnService.getPositionByDate(task.model.to) | 0;
    			task.left = newLeft;
    			task.width = newRight - newLeft;
    		});

    		taskStore.refresh();
    	}

    	function getRowContainer() {
    		return rowContainer;
    	}

    	function selectTask(id) {
    		const task = $taskStore.entities[id];

    		if (task) {
    			selectionManager.selectSingle(task);
    		}
    	}

    	function scrollToRow(id, scrollBehavior = "auto") {
    		const { scrollTop, clientHeight } = mainContainer;
    		const index = $allRows.findIndex(r => r.model.id == id);
    		if (index === -1) return;
    		const targetTop = index * rowHeight;

    		if (targetTop < scrollTop) {
    			mainContainer.scrollTo({ top: targetTop, behavior: scrollBehavior });
    		}

    		if (targetTop > scrollTop + clientHeight) {
    			mainContainer.scrollTo({
    				top: targetTop + rowHeight - clientHeight,
    				behavior: scrollBehavior
    			});
    		}
    	}

    	function scrollToTask(id, scrollBehavior = "auto") {
    		const { scrollLeft, scrollTop, clientWidth, clientHeight } = mainContainer;
    		const task = $taskStore.entities[id];
    		if (!task) return;
    		const targetLeft = task.left;
    		const rowIndex = $allRows.findIndex(r => r.model.id == task.model.resourceId);
    		const targetTop = rowIndex * rowHeight;

    		const options = {
    			top: undefined,
    			left: undefined,
    			behavior: scrollBehavior
    		};

    		if (targetLeft < scrollLeft) {
    			options.left = targetLeft;
    		}

    		if (targetLeft > scrollLeft + clientWidth) {
    			options.left = targetLeft + task.width - clientWidth;
    		}

    		if (targetTop < scrollTop) {
    			options.top = targetTop;
    		}

    		if (targetTop > scrollTop + clientHeight) {
    			options.top = targetTop + rowHeight - clientHeight;
    		}

    		mainContainer.scrollTo(options);
    	}

    	function updateTask(model) {
    		const task = taskFactory.createTask(model);
    		taskStore.upsert(task);
    	}

    	let filteredRows = [];
    	let rightScrollbarVisible;
    	let rowContainerHeight;
    	let startIndex;
    	let endIndex;
    	let paddingTop = 0;
    	let paddingBottom = 0;
    	let visibleRows = [];
    	let visibleTasks;
    	let disableTransition = true;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("Gantt", $$slots, []);

    	function div2_binding($$value) {
    		binding_callbacks$1[$$value ? "unshift" : "push"](() => {
    			$$invalidate(8, mainHeaderContainer = $$value);
    		});
    	}

    	function div2_elementresize_handler() {
    		$headerHeight = this.clientHeight;
    		headerHeight.set($headerHeight);
    	}

    	function div4_binding($$value) {
    		binding_callbacks$1[$$value ? "unshift" : "push"](() => {
    			$$invalidate(10, rowContainer = $$value);
    		});
    	}

    	function div7_binding($$value) {
    		binding_callbacks$1[$$value ? "unshift" : "push"](() => {
    			$$invalidate(9, mainContainer = $$value);
    		});
    	}

    	function div7_elementresize_handler() {
    		$visibleHeight = this.clientHeight;
    		visibleHeight.set($visibleHeight);
    		$visibleWidth = this.clientWidth;
    		visibleWidth.set($visibleWidth);
    	}

    	function div9_binding($$value) {
    		binding_callbacks$1[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, ganttElement = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(43, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("rows" in $$new_props) $$invalidate(47, rows = $$new_props.rows);
    		if ("tasks" in $$new_props) $$invalidate(48, tasks = $$new_props.tasks);
    		if ("timeRanges" in $$new_props) $$invalidate(49, timeRanges = $$new_props.timeRanges);
    		if ("rowPadding" in $$new_props) $$invalidate(50, rowPadding = $$new_props.rowPadding);
    		if ("rowHeight" in $$new_props) $$invalidate(51, rowHeight = $$new_props.rowHeight);
    		if ("from" in $$new_props) $$invalidate(52, from = $$new_props.from);
    		if ("to" in $$new_props) $$invalidate(53, to = $$new_props.to);
    		if ("minWidth" in $$new_props) $$invalidate(54, minWidth = $$new_props.minWidth);
    		if ("fitWidth" in $$new_props) $$invalidate(55, fitWidth = $$new_props.fitWidth);
    		if ("classes" in $$new_props) $$invalidate(4, classes = $$new_props.classes);
    		if ("headers" in $$new_props) $$invalidate(0, headers = $$new_props.headers);
    		if ("zoomLevels" in $$new_props) $$invalidate(56, zoomLevels = $$new_props.zoomLevels);
    		if ("taskContent" in $$new_props) $$invalidate(57, taskContent = $$new_props.taskContent);
    		if ("tableWidth" in $$new_props) $$invalidate(1, tableWidth = $$new_props.tableWidth);
    		if ("resizeHandleWidth" in $$new_props) $$invalidate(58, resizeHandleWidth = $$new_props.resizeHandleWidth);
    		if ("onTaskButtonClick" in $$new_props) $$invalidate(59, onTaskButtonClick = $$new_props.onTaskButtonClick);
    		if ("magnetUnit" in $$new_props) $$invalidate(60, magnetUnit = $$new_props.magnetUnit);
    		if ("magnetOffset" in $$new_props) $$invalidate(61, magnetOffset = $$new_props.magnetOffset);
    		if ("columnUnit" in $$new_props) $$invalidate(2, columnUnit = $$new_props.columnUnit);
    		if ("columnOffset" in $$new_props) $$invalidate(3, columnOffset = $$new_props.columnOffset);
    		if ("ganttTableModules" in $$new_props) $$invalidate(5, ganttTableModules = $$new_props.ganttTableModules);
    		if ("ganttBodyModules" in $$new_props) $$invalidate(6, ganttBodyModules = $$new_props.ganttBodyModules);
    		if ("reflectOnParentRows" in $$new_props) $$invalidate(62, reflectOnParentRows = $$new_props.reflectOnParentRows);
    		if ("reflectOnChildRows" in $$new_props) $$invalidate(63, reflectOnChildRows = $$new_props.reflectOnChildRows);
    	};

    	$$self.$capture_state = () => ({
    		onMount: onMount$1,
    		setContext,
    		tick,
    		onDestroy,
    		writable,
    		derived,
    		ganttElement,
    		mainHeaderContainer,
    		mainContainer,
    		rowContainer,
    		scrollables,
    		mounted,
    		rowStore,
    		taskStore,
    		timeRangeStore,
    		allTasks,
    		allRows,
    		allTimeRanges,
    		rowTaskCache,
    		Task,
    		Row,
    		TimeRange,
    		TimeRangeHeader,
    		Milestone,
    		Columns,
    		ColumnHeader,
    		Resizer,
    		GanttUtils,
    		getPositionByDate,
    		getRelativePos,
    		debounce,
    		throttle,
    		SelectionManager,
    		GanttApi,
    		TaskFactory,
    		reflectTask,
    		RowFactory,
    		TimeRangeFactory,
    		DragDropManager,
    		findByPosition,
    		findByDate,
    		onEvent,
    		onDelegatedEvent,
    		offDelegatedEvent,
    		rows,
    		tasks,
    		timeRanges,
    		rowPadding,
    		rowHeight,
    		_rowHeight,
    		_rowPadding,
    		from,
    		to,
    		_from,
    		_to,
    		minWidth,
    		fitWidth,
    		_minWidth,
    		_fitWidth,
    		classes,
    		headers,
    		zoomLevels,
    		taskContent,
    		tableWidth,
    		resizeHandleWidth,
    		onTaskButtonClick,
    		magnetUnit,
    		magnetOffset,
    		columnUnit,
    		columnOffset,
    		ganttTableModules,
    		ganttBodyModules,
    		reflectOnParentRows,
    		reflectOnChildRows,
    		visibleWidth,
    		visibleHeight,
    		headerHeight,
    		_width,
    		columnService,
    		columnWidth,
    		columnCount,
    		columns,
    		getColumns,
    		dimensionsChanged,
    		hoveredRow,
    		selectedRow,
    		ganttContext,
    		__scrollTop,
    		__scrollLeft,
    		scrollable,
    		horizontalScrollListener,
    		onResize,
    		zoomLevel,
    		zooming,
    		onwheel,
    		onDateSelected,
    		initRows,
    		initTasks,
    		initTimeRanges,
    		onModuleInit,
    		tickWithoutCSSTransition,
    		api,
    		selectionManager,
    		taskFactory,
    		rowFactory,
    		dndManager,
    		timeRangeFactory,
    		utils,
    		refreshTimeRanges,
    		refreshTasks,
    		getRowContainer,
    		selectTask,
    		scrollToRow,
    		scrollToTask,
    		updateTask,
    		filteredRows,
    		rightScrollbarVisible,
    		rowContainerHeight,
    		startIndex,
    		endIndex,
    		paddingTop,
    		paddingBottom,
    		visibleRows,
    		visibleTasks,
    		disableTransition,
    		$_from,
    		$_to,
    		$_width,
    		$columnWidth,
    		$dimensionsChanged,
    		$taskStore,
    		$hoveredRow,
    		$selectedRow,
    		$_minWidth,
    		$_fitWidth,
    		$_rowPadding,
    		$rowStore,
    		$allTasks,
    		$allRows,
    		$visibleHeight,
    		$rowTaskCache,
    		$headerHeight,
    		$allTimeRanges,
    		$visibleWidth
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("ganttElement" in $$props) $$invalidate(7, ganttElement = $$new_props.ganttElement);
    		if ("mainHeaderContainer" in $$props) $$invalidate(8, mainHeaderContainer = $$new_props.mainHeaderContainer);
    		if ("mainContainer" in $$props) $$invalidate(9, mainContainer = $$new_props.mainContainer);
    		if ("rowContainer" in $$props) $$invalidate(10, rowContainer = $$new_props.rowContainer);
    		if ("scrollables" in $$props) scrollables = $$new_props.scrollables;
    		if ("mounted" in $$props) $$invalidate(75, mounted = $$new_props.mounted);
    		if ("rows" in $$props) $$invalidate(47, rows = $$new_props.rows);
    		if ("tasks" in $$props) $$invalidate(48, tasks = $$new_props.tasks);
    		if ("timeRanges" in $$props) $$invalidate(49, timeRanges = $$new_props.timeRanges);
    		if ("rowPadding" in $$props) $$invalidate(50, rowPadding = $$new_props.rowPadding);
    		if ("rowHeight" in $$props) $$invalidate(51, rowHeight = $$new_props.rowHeight);
    		if ("from" in $$props) $$invalidate(52, from = $$new_props.from);
    		if ("to" in $$props) $$invalidate(53, to = $$new_props.to);
    		if ("minWidth" in $$props) $$invalidate(54, minWidth = $$new_props.minWidth);
    		if ("fitWidth" in $$props) $$invalidate(55, fitWidth = $$new_props.fitWidth);
    		if ("classes" in $$props) $$invalidate(4, classes = $$new_props.classes);
    		if ("headers" in $$props) $$invalidate(0, headers = $$new_props.headers);
    		if ("zoomLevels" in $$props) $$invalidate(56, zoomLevels = $$new_props.zoomLevels);
    		if ("taskContent" in $$props) $$invalidate(57, taskContent = $$new_props.taskContent);
    		if ("tableWidth" in $$props) $$invalidate(1, tableWidth = $$new_props.tableWidth);
    		if ("resizeHandleWidth" in $$props) $$invalidate(58, resizeHandleWidth = $$new_props.resizeHandleWidth);
    		if ("onTaskButtonClick" in $$props) $$invalidate(59, onTaskButtonClick = $$new_props.onTaskButtonClick);
    		if ("magnetUnit" in $$props) $$invalidate(60, magnetUnit = $$new_props.magnetUnit);
    		if ("magnetOffset" in $$props) $$invalidate(61, magnetOffset = $$new_props.magnetOffset);
    		if ("columnUnit" in $$props) $$invalidate(2, columnUnit = $$new_props.columnUnit);
    		if ("columnOffset" in $$props) $$invalidate(3, columnOffset = $$new_props.columnOffset);
    		if ("ganttTableModules" in $$props) $$invalidate(5, ganttTableModules = $$new_props.ganttTableModules);
    		if ("ganttBodyModules" in $$props) $$invalidate(6, ganttBodyModules = $$new_props.ganttBodyModules);
    		if ("reflectOnParentRows" in $$props) $$invalidate(62, reflectOnParentRows = $$new_props.reflectOnParentRows);
    		if ("reflectOnChildRows" in $$props) $$invalidate(63, reflectOnChildRows = $$new_props.reflectOnChildRows);
    		if ("columnCount" in $$props) $$invalidate(76, columnCount = $$new_props.columnCount);
    		if ("columns" in $$props) $$invalidate(11, columns = $$new_props.columns);
    		if ("__scrollTop" in $$props) $$invalidate(77, __scrollTop = $$new_props.__scrollTop);
    		if ("__scrollLeft" in $$props) __scrollLeft = $$new_props.__scrollLeft;
    		if ("zoomLevel" in $$props) zoomLevel = $$new_props.zoomLevel;
    		if ("zooming" in $$props) $$invalidate(12, zooming = $$new_props.zooming);
    		if ("filteredRows" in $$props) $$invalidate(80, filteredRows = $$new_props.filteredRows);
    		if ("rightScrollbarVisible" in $$props) $$invalidate(13, rightScrollbarVisible = $$new_props.rightScrollbarVisible);
    		if ("rowContainerHeight" in $$props) $$invalidate(14, rowContainerHeight = $$new_props.rowContainerHeight);
    		if ("startIndex" in $$props) $$invalidate(81, startIndex = $$new_props.startIndex);
    		if ("endIndex" in $$props) $$invalidate(82, endIndex = $$new_props.endIndex);
    		if ("paddingTop" in $$props) $$invalidate(15, paddingTop = $$new_props.paddingTop);
    		if ("paddingBottom" in $$props) $$invalidate(16, paddingBottom = $$new_props.paddingBottom);
    		if ("visibleRows" in $$props) $$invalidate(17, visibleRows = $$new_props.visibleRows);
    		if ("visibleTasks" in $$props) $$invalidate(18, visibleTasks = $$new_props.visibleTasks);
    		if ("disableTransition" in $$props) $$invalidate(19, disableTransition = $$new_props.disableTransition);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*rows*/ 65536 | $$self.$$.dirty[2] & /*mounted*/ 8192) {
    			 if (mounted) initRows(rows);
    		}

    		if ($$self.$$.dirty[1] & /*tasks*/ 131072 | $$self.$$.dirty[2] & /*mounted*/ 8192) {
    			 if (mounted) initTasks(tasks);
    		}

    		if ($$self.$$.dirty[1] & /*timeRanges*/ 262144 | $$self.$$.dirty[2] & /*mounted*/ 8192) {
    			 if (mounted) initTimeRanges(timeRanges);
    		}

    		if ($$self.$$.dirty[1] & /*from*/ 2097152) {
    			 set_store_value(_from, $_from = from);
    		}

    		if ($$self.$$.dirty[1] & /*to*/ 4194304) {
    			 set_store_value(_to, $_to = to);
    		}

    		if ($$self.$$.dirty[0] & /*columnOffset, columnUnit, $_width*/ 1048588 | $$self.$$.dirty[2] & /*$_from, $_to*/ 6291456) {
    			 set_store_value(columnWidth, $columnWidth = getPositionByDate($_from.clone().add(columnOffset, columnUnit), $_from, $_to, $_width) | 0);
    		}

    		if ($$self.$$.dirty[0] & /*$_width*/ 1048576 | $$self.$$.dirty[2] & /*$columnWidth*/ 8388608) {
    			 $$invalidate(76, columnCount = Math.ceil($_width / $columnWidth));
    		}

    		if ($$self.$$.dirty[0] & /*columnOffset, columnUnit*/ 12 | $$self.$$.dirty[2] & /*$_from, columnCount, $columnWidth*/ 10502144) {
    			 $$invalidate(11, columns = getColumns($_from, columnCount, columnOffset, columnUnit, $columnWidth));
    		}

    		if ($$self.$$.dirty[2] & /*$dimensionsChanged*/ 16777216) {
    			 {
    				if ($dimensionsChanged) {
    					refreshTasks();
    					refreshTimeRanges();
    				}
    			}
    		}

    		if ($$self.$$.dirty[2] & /*$_rowPadding*/ 1073741824 | $$self.$$.dirty[3] & /*$rowStore*/ 1) {
    			 {
    				$$invalidate(44, taskFactory.rowPadding = $_rowPadding, taskFactory);
    				$$invalidate(44, taskFactory.rowEntities = $rowStore.entities, taskFactory);
    			}
    		}

    		if ($$self.$$.dirty[1] & /*rowHeight*/ 1048576) {
    			 $$invalidate(45, rowFactory.rowHeight = rowHeight, rowFactory);
    		}

    		if ($$self.$$.dirty[0] & /*$_width*/ 1048576 | $$self.$$.dirty[1] & /*magnetOffset, magnetUnit*/ 1610612736 | $$self.$$.dirty[2] & /*$_from, $_to*/ 6291456) {
    			 {
    				$$invalidate(46, utils.from = $_from, utils);
    				$$invalidate(46, utils.to = $_to, utils);
    				$$invalidate(46, utils.width = $_width, utils);
    				$$invalidate(46, utils.magnetOffset = magnetOffset, utils);
    				$$invalidate(46, utils.magnetUnit = magnetUnit, utils);
    			}
    		}

    		if ($$self.$$.dirty[3] & /*$allRows*/ 4) {
    			 $$invalidate(80, filteredRows = $allRows.filter(row => !row.hidden));
    		}

    		if ($$self.$$.dirty[1] & /*rowHeight*/ 1048576 | $$self.$$.dirty[2] & /*filteredRows*/ 262144) {
    			 $$invalidate(14, rowContainerHeight = filteredRows.length * rowHeight);
    		}

    		if ($$self.$$.dirty[0] & /*rowContainerHeight, $visibleHeight*/ 2113536) {
    			 $$invalidate(13, rightScrollbarVisible = rowContainerHeight > $visibleHeight);
    		}

    		if ($$self.$$.dirty[1] & /*rowHeight*/ 1048576 | $$self.$$.dirty[2] & /*__scrollTop*/ 32768) {
    			 $$invalidate(81, startIndex = Math.floor(__scrollTop / rowHeight));
    		}

    		if ($$self.$$.dirty[0] & /*$visibleHeight*/ 2097152 | $$self.$$.dirty[1] & /*rowHeight*/ 1048576 | $$self.$$.dirty[2] & /*startIndex, filteredRows*/ 786432) {
    			 $$invalidate(82, endIndex = Math.min(startIndex + Math.ceil($visibleHeight / rowHeight), filteredRows.length - 1));
    		}

    		if ($$self.$$.dirty[1] & /*rowHeight*/ 1048576 | $$self.$$.dirty[2] & /*startIndex*/ 524288) {
    			 $$invalidate(15, paddingTop = startIndex * rowHeight);
    		}

    		if ($$self.$$.dirty[1] & /*rowHeight*/ 1048576 | $$self.$$.dirty[2] & /*filteredRows, endIndex*/ 1310720) {
    			 $$invalidate(16, paddingBottom = (filteredRows.length - endIndex - 1) * rowHeight);
    		}

    		if ($$self.$$.dirty[2] & /*filteredRows, startIndex, endIndex*/ 1835008) {
    			 $$invalidate(17, visibleRows = filteredRows.slice(startIndex, endIndex + 1));
    		}

    		if ($$self.$$.dirty[0] & /*visibleRows*/ 131072 | $$self.$$.dirty[2] & /*$taskStore*/ 33554432 | $$self.$$.dirty[3] & /*$rowTaskCache*/ 8) {
    			 {
    				const tasks = [];

    				visibleRows.forEach(row => {
    					if ($rowTaskCache[row.model.id]) {
    						$rowTaskCache[row.model.id].forEach(id => {
    							tasks.push($taskStore.entities[id]);
    						});
    					}
    				});

    				$$invalidate(18, visibleTasks = tasks);
    			}
    		}

    		if ($$self.$$.dirty[2] & /*$dimensionsChanged*/ 16777216) {
    			 if ($dimensionsChanged) tickWithoutCSSTransition();
    		}
    	};

    	return [
    		headers,
    		tableWidth,
    		columnUnit,
    		columnOffset,
    		classes,
    		ganttTableModules,
    		ganttBodyModules,
    		ganttElement,
    		mainHeaderContainer,
    		mainContainer,
    		rowContainer,
    		columns,
    		zooming,
    		rightScrollbarVisible,
    		rowContainerHeight,
    		paddingTop,
    		paddingBottom,
    		visibleRows,
    		visibleTasks,
    		disableTransition,
    		$_width,
    		$visibleHeight,
    		$headerHeight,
    		$allTimeRanges,
    		$visibleWidth,
    		_rowPadding,
    		_from,
    		_to,
    		_minWidth,
    		_fitWidth,
    		visibleWidth,
    		visibleHeight,
    		headerHeight,
    		_width,
    		columnWidth,
    		dimensionsChanged,
    		hoveredRow,
    		selectedRow,
    		scrollable,
    		horizontalScrollListener,
    		onResize,
    		onwheel,
    		onDateSelected,
    		$$restProps,
    		taskFactory,
    		rowFactory,
    		utils,
    		rows,
    		tasks,
    		timeRanges,
    		rowPadding,
    		rowHeight,
    		from,
    		to,
    		minWidth,
    		fitWidth,
    		zoomLevels,
    		taskContent,
    		resizeHandleWidth,
    		onTaskButtonClick,
    		magnetUnit,
    		magnetOffset,
    		reflectOnParentRows,
    		reflectOnChildRows,
    		columnService,
    		api,
    		dndManager,
    		timeRangeFactory,
    		refreshTimeRanges,
    		refreshTasks,
    		getRowContainer,
    		selectTask,
    		scrollToRow,
    		scrollToTask,
    		updateTask,
    		mounted,
    		columnCount,
    		__scrollTop,
    		__scrollLeft,
    		zoomLevel,
    		filteredRows,
    		startIndex,
    		endIndex,
    		$_from,
    		$_to,
    		$columnWidth,
    		$dimensionsChanged,
    		$taskStore,
    		$hoveredRow,
    		$selectedRow,
    		$_minWidth,
    		$_fitWidth,
    		$_rowPadding,
    		$rowStore,
    		$allTasks,
    		$allRows,
    		$rowTaskCache,
    		scrollables,
    		_rowHeight,
    		getColumns,
    		ganttContext,
    		initRows,
    		initTasks,
    		initTimeRanges,
    		tickWithoutCSSTransition,
    		selectionManager,
    		div2_binding,
    		div2_elementresize_handler,
    		div4_binding,
    		div7_binding,
    		div7_elementresize_handler,
    		div9_binding
    	];
    }

    class Gantt extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);

    		init$1(
    			this,
    			options,
    			instance$a,
    			create_fragment$a,
    			safe_not_equal$1,
    			{
    				rows: 47,
    				tasks: 48,
    				timeRanges: 49,
    				rowPadding: 50,
    				rowHeight: 51,
    				from: 52,
    				to: 53,
    				minWidth: 54,
    				fitWidth: 55,
    				classes: 4,
    				headers: 0,
    				zoomLevels: 56,
    				taskContent: 57,
    				tableWidth: 1,
    				resizeHandleWidth: 58,
    				onTaskButtonClick: 59,
    				magnetUnit: 60,
    				magnetOffset: 61,
    				columnUnit: 2,
    				columnOffset: 3,
    				ganttTableModules: 5,
    				ganttBodyModules: 6,
    				reflectOnParentRows: 62,
    				reflectOnChildRows: 63,
    				columnService: 64,
    				api: 65,
    				taskFactory: 44,
    				rowFactory: 45,
    				dndManager: 66,
    				timeRangeFactory: 67,
    				utils: 46,
    				refreshTimeRanges: 68,
    				refreshTasks: 69,
    				getRowContainer: 70,
    				selectTask: 71,
    				scrollToRow: 72,
    				scrollToTask: 73,
    				updateTask: 74
    			},
    			[-1, -1, -1, -1, -1]
    		);

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gantt",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*rows*/ ctx[47] === undefined && !("rows" in props)) {
    			console_1$2.warn("<Gantt> was created without expected prop 'rows'");
    		}

    		if (/*from*/ ctx[52] === undefined && !("from" in props)) {
    			console_1$2.warn("<Gantt> was created without expected prop 'from'");
    		}

    		if (/*to*/ ctx[53] === undefined && !("to" in props)) {
    			console_1$2.warn("<Gantt> was created without expected prop 'to'");
    		}
    	}

    	get rows() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tasks() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tasks(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timeRanges() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeRanges(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rowPadding() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rowPadding(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rowHeight() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rowHeight(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get from() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set from(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get to() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minWidth() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minWidth(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fitWidth() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fitWidth(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get headers() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headers(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoomLevels() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zoomLevels(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get taskContent() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set taskContent(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tableWidth() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tableWidth(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get resizeHandleWidth() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set resizeHandleWidth(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onTaskButtonClick() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onTaskButtonClick(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get magnetUnit() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set magnetUnit(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get magnetOffset() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set magnetOffset(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columnUnit() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columnUnit(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columnOffset() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columnOffset(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ganttTableModules() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ganttTableModules(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ganttBodyModules() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ganttBodyModules(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reflectOnParentRows() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reflectOnParentRows(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reflectOnChildRows() {
    		throw new Error("<Gantt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reflectOnChildRows(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columnService() {
    		return this.$$.ctx[64];
    	}

    	set columnService(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get api() {
    		return this.$$.ctx[65];
    	}

    	set api(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get taskFactory() {
    		return this.$$.ctx[44];
    	}

    	set taskFactory(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rowFactory() {
    		return this.$$.ctx[45];
    	}

    	set rowFactory(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dndManager() {
    		return this.$$.ctx[66];
    	}

    	set dndManager(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timeRangeFactory() {
    		return this.$$.ctx[67];
    	}

    	set timeRangeFactory(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get utils() {
    		return this.$$.ctx[46];
    	}

    	set utils(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get refreshTimeRanges() {
    		return this.$$.ctx[68];
    	}

    	set refreshTimeRanges(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get refreshTasks() {
    		return this.$$.ctx[69];
    	}

    	set refreshTasks(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getRowContainer() {
    		return this.$$.ctx[70];
    	}

    	set getRowContainer(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectTask() {
    		return this.$$.ctx[71];
    	}

    	set selectTask(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollToRow() {
    		return this.$$.ctx[72];
    	}

    	set scrollToRow(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollToTask() {
    		return this.$$.ctx[73];
    	}

    	set scrollToTask(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get updateTask() {
    		return this.$$.ctx[74];
    	}

    	set updateTask(value) {
    		throw new Error("<Gantt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\modules\table\TableTreeCell.svelte generated by Svelte v3.23.0 */
    const file$a = "src\\modules\\table\\TableTreeCell.svelte";

    // (18:4) {#if row.children}
    function create_if_block$2(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*row*/ ctx[0].expanded) return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			if_block.c();
    			attr_dev$1(div, "class", "sg-tree-expander svelte-1tpezbv");
    			add_location$1(div, file$a, 18, 8, 462);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    			if_block.m(div, null);

    			if (!mounted) {
    				dispose = listen_dev$1(div, "click", /*onExpandToggle*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(18:4) {#if row.children}",
    		ctx
    	});

    	return block;
    }

    // (22:12) {:else}
    function create_else_block$1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element$1("i");
    			attr_dev$1(i, "class", "fas fa-angle-right");
    			add_location$1(i, file$a, 22, 12, 634);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(i);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(22:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:12) {#if row.expanded}
    function create_if_block_1$1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element$1("i");
    			attr_dev$1(i, "class", "fas fa-angle-down");
    			add_location$1(i, file$a, 20, 12, 566);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(i);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(20:12) {#if row.expanded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let t;
    	let current;
    	let if_block = /*row*/ ctx[0].children && create_if_block$2(ctx);
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			if (if_block) if_block.c();
    			t = space$1();
    			if (default_slot) default_slot.c();
    			attr_dev$1(div, "class", "sg-cell-inner svelte-1tpezbv");
    			set_style(div, "padding-left", /*row*/ ctx[0].childLevel * 3 + "em");
    			add_location$1(div, file$a, 16, 0, 358);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev$1(div, t);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*row*/ ctx[0].children) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*row*/ 1) {
    				set_style(div, "padding-left", /*row*/ ctx[0].childLevel * 3 + "em");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { row } = $$props;
    	const dispatch = createEventDispatcher();

    	function onExpandToggle() {
    		if (row.expanded) {
    			dispatch("rowCollapsed", { row });
    		} else {
    			dispatch("rowExpanded", { row });
    		}
    	}

    	const writable_props = ["row"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TableTreeCell> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("TableTreeCell", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("row" in $$props) $$invalidate(0, row = $$props.row);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		getContext,
    		row,
    		dispatch,
    		onExpandToggle
    	});

    	$$self.$inject_state = $$props => {
    		if ("row" in $$props) $$invalidate(0, row = $$props.row);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [row, onExpandToggle, dispatch, $$scope, $$slots];
    }

    class TableTreeCell extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$b, create_fragment$b, safe_not_equal$1, { row: 0 });

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TableTreeCell",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*row*/ ctx[0] === undefined && !("row" in props)) {
    			console.warn("<TableTreeCell> was created without expected prop 'row'");
    		}
    	}

    	get row() {
    		throw new Error("<TableTreeCell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set row(value) {
    		throw new Error("<TableTreeCell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\modules\table\TableRow.svelte generated by Svelte v3.23.0 */
    const file$b = "src\\modules\\table\\TableRow.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (40:12) {:else}
    function create_else_block_1(ctx) {
    	let t;
    	let if_block1_anchor;
    	let if_block0 = /*row*/ ctx[1].model.iconClass && create_if_block_7(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*row*/ ctx[1].model.headerHtml) return create_if_block_4$1;
    		if (/*header*/ ctx[12].renderer) return create_if_block_5;
    		if (/*header*/ ctx[12].type === "resourceInfo") return create_if_block_6;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space$1();
    			if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev$1(target, t, anchor);
    			if_block1.m(target, anchor);
    			insert_dev$1(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*row*/ ctx[1].model.iconClass) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev$1(t);
    			if_block1.d(detaching);
    			if (detaching) detach_dev$1(if_block1_anchor);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(40:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:12) {#if header.type == 'tree'}
    function create_if_block$3(ctx) {
    	let current;

    	const tabletreecell = new TableTreeCell({
    			props: {
    				row: /*row*/ ctx[1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tabletreecell.$on("rowCollapsed", /*rowCollapsed_handler*/ ctx[10]);
    	tabletreecell.$on("rowExpanded", /*rowExpanded_handler*/ ctx[11]);

    	const block = {
    		c: function create() {
    			create_component(tabletreecell.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component$1(tabletreecell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tabletreecell_changes = {};
    			if (dirty & /*row*/ 2) tabletreecell_changes.row = /*row*/ ctx[1];

    			if (dirty & /*$$scope, row, headers*/ 32771) {
    				tabletreecell_changes.$$scope = { dirty, ctx };
    			}

    			tabletreecell.$set(tabletreecell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(tabletreecell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabletreecell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component$1(tabletreecell, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(24:12) {#if header.type == 'tree'}",
    		ctx
    	});

    	return block;
    }

    // (41:16) {#if row.model.iconClass}
    function create_if_block_7(ctx) {
    	let div;
    	let i;
    	let i_class_value;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			i = element$1("i");
    			attr_dev$1(i, "class", i_class_value = "" + (null_to_empty(/*row*/ ctx[1].model.iconClass) + " svelte-137zt6g"));
    			add_location$1(i, file$b, 42, 20, 1681);
    			attr_dev$1(div, "class", "sg-table-icon svelte-137zt6g");
    			add_location$1(div, file$b, 41, 16, 1632);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    			append_dev$1(div, i);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*row*/ 2 && i_class_value !== (i_class_value = "" + (null_to_empty(/*row*/ ctx[1].model.iconClass) + " svelte-137zt6g"))) {
    				attr_dev$1(i, "class", i_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(41:16) {#if row.model.iconClass}",
    		ctx
    	});

    	return block;
    }

    // (56:16) {:else}
    function create_else_block_2(ctx) {
    	let t_value = /*row*/ ctx[1].model[/*header*/ ctx[12].property] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text$1(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*row, headers*/ 3 && t_value !== (t_value = /*row*/ ctx[1].model[/*header*/ ctx[12].property] + "")) set_data_dev$1(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(t);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(56:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (51:57) 
    function create_if_block_6(ctx) {
    	let img;
    	let img_src_value;
    	let t0;
    	let div;
    	let t1_value = /*row*/ ctx[1].model[/*header*/ ctx[12].property] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			img = element$1("img");
    			t0 = space$1();
    			div = element$1("div");
    			t1 = text$1(t1_value);
    			attr_dev$1(img, "class", "sg-resource-image svelte-137zt6g");
    			if (img.src !== (img_src_value = /*row*/ ctx[1].model.imageSrc)) attr_dev$1(img, "src", img_src_value);
    			attr_dev$1(img, "alt", "");
    			add_location$1(img, file$b, 51, 20, 2036);
    			attr_dev$1(div, "class", "sg-resource-title");
    			add_location$1(div, file$b, 52, 20, 2124);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, img, anchor);
    			insert_dev$1(target, t0, anchor);
    			insert_dev$1(target, div, anchor);
    			append_dev$1(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*row*/ 2 && img.src !== (img_src_value = /*row*/ ctx[1].model.imageSrc)) {
    				attr_dev$1(img, "src", img_src_value);
    			}

    			if (dirty & /*row, headers*/ 3 && t1_value !== (t1_value = /*row*/ ctx[1].model[/*header*/ ctx[12].property] + "")) set_data_dev$1(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(img);
    			if (detaching) detach_dev$1(t0);
    			if (detaching) detach_dev$1(div);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(51:57) ",
    		ctx
    	});

    	return block;
    }

    // (49:42) 
    function create_if_block_5(ctx) {
    	let html_tag;
    	let raw_value = /*header*/ ctx[12].renderer(/*row*/ ctx[1]) + "";

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag(null);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*headers, row*/ 3 && raw_value !== (raw_value = /*header*/ ctx[12].renderer(/*row*/ ctx[1]) + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(49:42) ",
    		ctx
    	});

    	return block;
    }

    // (47:16) {#if row.model.headerHtml}
    function create_if_block_4$1(ctx) {
    	let html_tag;
    	let raw_value = /*row*/ ctx[1].model.headerHtml + "";

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag(null);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*row*/ 2 && raw_value !== (raw_value = /*row*/ ctx[1].model.headerHtml + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(47:16) {#if row.model.headerHtml}",
    		ctx
    	});

    	return block;
    }

    // (26:20) {#if row.model.iconClass}
    function create_if_block_3$1(ctx) {
    	let div;
    	let i;
    	let i_class_value;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			i = element$1("i");
    			attr_dev$1(i, "class", i_class_value = "" + (null_to_empty(/*row*/ ctx[1].model.iconClass) + " svelte-137zt6g"));
    			add_location$1(i, file$b, 27, 24, 1108);
    			attr_dev$1(div, "class", "sg-table-icon svelte-137zt6g");
    			add_location$1(div, file$b, 26, 20, 1055);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    			append_dev$1(div, i);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*row*/ 2 && i_class_value !== (i_class_value = "" + (null_to_empty(/*row*/ ctx[1].model.iconClass) + " svelte-137zt6g"))) {
    				attr_dev$1(i, "class", i_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(26:20) {#if row.model.iconClass}",
    		ctx
    	});

    	return block;
    }

    // (36:20) {:else}
    function create_else_block$2(ctx) {
    	let t_value = /*row*/ ctx[1].model[/*header*/ ctx[12].property] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text$1(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*row, headers*/ 3 && t_value !== (t_value = /*row*/ ctx[1].model[/*header*/ ctx[12].property] + "")) set_data_dev$1(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(t);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(36:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (34:46) 
    function create_if_block_2$1(ctx) {
    	let html_tag;
    	let raw_value = /*header*/ ctx[12].renderer(/*row*/ ctx[1]) + "";

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag(null);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*headers, row*/ 3 && raw_value !== (raw_value = /*header*/ ctx[12].renderer(/*row*/ ctx[1]) + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(34:46) ",
    		ctx
    	});

    	return block;
    }

    // (32:20) {#if row.model.headerHtml}
    function create_if_block_1$2(ctx) {
    	let html_tag;
    	let raw_value = /*row*/ ctx[1].model.headerHtml + "";

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag(null);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*row*/ 2 && raw_value !== (raw_value = /*row*/ ctx[1].model.headerHtml + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(32:20) {#if row.model.headerHtml}",
    		ctx
    	});

    	return block;
    }

    // (25:16) <TableTreeCell on:rowCollapsed on:rowExpanded {row}>
    function create_default_slot(ctx) {
    	let t;
    	let if_block1_anchor;
    	let if_block0 = /*row*/ ctx[1].model.iconClass && create_if_block_3$1(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*row*/ ctx[1].model.headerHtml) return create_if_block_1$2;
    		if (/*header*/ ctx[12].renderer) return create_if_block_2$1;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space$1();
    			if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev$1(target, t, anchor);
    			if_block1.m(target, anchor);
    			insert_dev$1(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*row*/ ctx[1].model.iconClass) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev$1(t);
    			if_block1.d(detaching);
    			if (detaching) detach_dev$1(if_block1_anchor);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(25:16) <TableTreeCell on:rowCollapsed on:rowExpanded {row}>",
    		ctx
    	});

    	return block;
    }

    // (22:4) {#each headers as header}
    function create_each_block$3(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*header*/ ctx[12].type == "tree") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			if_block.c();
    			t = space$1();
    			attr_dev$1(div, "class", "sg-table-body-cell sg-table-cell svelte-137zt6g");
    			set_style(div, "width", /*header*/ ctx[12].width + "px");
    			add_location$1(div, file$b, 22, 8, 798);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev$1(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in$1(if_block, 1);
    				if_block.m(div, t);
    			}

    			if (!current || dirty & /*headers*/ 1) {
    				set_style(div, "width", /*header*/ ctx[12].width + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(22:4) {#each headers as header}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div;
    	let div_class_value;
    	let div_data_row_id_value;
    	let current;
    	let each_value = /*headers*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element$1("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev$1(div, "class", div_class_value = "sg-table-row " + (/*row*/ ctx[1].model.class || "") + " svelte-137zt6g");
    			set_style(div, "height", /*$rowHeight*/ ctx[2] + "px");
    			attr_dev$1(div, "data-row-id", div_data_row_id_value = /*row*/ ctx[1].model.id);
    			toggle_class(div, "sg-row-expanded", /*row*/ ctx[1].expanded);
    			toggle_class(div, "sg-hover", /*$hoveredRow*/ ctx[3] == /*row*/ ctx[1].model.id);
    			toggle_class(div, "sg-selected", /*$selectedRow*/ ctx[4] == /*row*/ ctx[1].model.id);
    			add_location$1(div, file$b, 20, 0, 517);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*headers, row*/ 3) {
    				each_value = /*headers*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in$1(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in$1(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*row*/ 2 && div_class_value !== (div_class_value = "sg-table-row " + (/*row*/ ctx[1].model.class || "") + " svelte-137zt6g")) {
    				attr_dev$1(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*$rowHeight*/ 4) {
    				set_style(div, "height", /*$rowHeight*/ ctx[2] + "px");
    			}

    			if (!current || dirty & /*row*/ 2 && div_data_row_id_value !== (div_data_row_id_value = /*row*/ ctx[1].model.id)) {
    				attr_dev$1(div, "data-row-id", div_data_row_id_value);
    			}

    			if (dirty & /*row, row*/ 2) {
    				toggle_class(div, "sg-row-expanded", /*row*/ ctx[1].expanded);
    			}

    			if (dirty & /*row, $hoveredRow, row*/ 10) {
    				toggle_class(div, "sg-hover", /*$hoveredRow*/ ctx[3] == /*row*/ ctx[1].model.id);
    			}

    			if (dirty & /*row, $selectedRow, row*/ 18) {
    				toggle_class(div, "sg-selected", /*$selectedRow*/ ctx[4] == /*row*/ ctx[1].model.id);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in$1(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $rowHeight;
    	let $hoveredRow;
    	let $selectedRow;
    	let { headers = null } = $$props;
    	let { row = null } = $$props;
    	const { rowHeight } = getContext("options");
    	validate_store(rowHeight, "rowHeight");
    	component_subscribe($$self, rowHeight, value => $$invalidate(2, $rowHeight = value));
    	const { hoveredRow, selectedRow } = getContext("gantt");
    	validate_store(hoveredRow, "hoveredRow");
    	component_subscribe($$self, hoveredRow, value => $$invalidate(3, $hoveredRow = value));
    	validate_store(selectedRow, "selectedRow");
    	component_subscribe($$self, selectedRow, value => $$invalidate(4, $selectedRow = value));
    	const dispatch = createEventDispatcher();
    	let treeIndentationStyle = "";
    	const writable_props = ["headers", "row"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TableRow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("TableRow", $$slots, []);

    	function rowCollapsed_handler(event) {
    		bubble($$self, event);
    	}

    	function rowExpanded_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("headers" in $$props) $$invalidate(0, headers = $$props.headers);
    		if ("row" in $$props) $$invalidate(1, row = $$props.row);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		getContext,
    		TableTreeCell,
    		headers,
    		row,
    		rowHeight,
    		hoveredRow,
    		selectedRow,
    		dispatch,
    		treeIndentationStyle,
    		$rowHeight,
    		$hoveredRow,
    		$selectedRow
    	});

    	$$self.$inject_state = $$props => {
    		if ("headers" in $$props) $$invalidate(0, headers = $$props.headers);
    		if ("row" in $$props) $$invalidate(1, row = $$props.row);
    		if ("treeIndentationStyle" in $$props) treeIndentationStyle = $$props.treeIndentationStyle;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*row*/ 2) {
    			 {
    				treeIndentationStyle = row.parent
    				? `padding-left: ${row.childLevel * 3}em;`
    				: "";
    			}
    		}
    	};

    	return [
    		headers,
    		row,
    		$rowHeight,
    		$hoveredRow,
    		$selectedRow,
    		rowHeight,
    		hoveredRow,
    		selectedRow,
    		treeIndentationStyle,
    		dispatch,
    		rowCollapsed_handler,
    		rowExpanded_handler
    	];
    }

    class TableRow extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$c, create_fragment$c, safe_not_equal$1, { headers: 0, row: 1 });

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TableRow",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get headers() {
    		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headers(value) {
    		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get row() {
    		throw new Error("<TableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set row(value) {
    		throw new Error("<TableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\modules\table\Table.svelte generated by Svelte v3.23.0 */
    const file$c = "src\\modules\\table\\Table.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	return child_ctx;
    }

    // (115:8) {#each tableHeaders as header}
    function create_each_block_1$1(ctx) {
    	let div;
    	let t0_value = /*header*/ ctx[31].title + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			t0 = text$1(t0_value);
    			t1 = space$1();
    			attr_dev$1(div, "class", "sg-table-header-cell sg-table-cell svelte-s3b3pm");
    			set_style(div, "width", /*header*/ ctx[31].width + "px");
    			add_location$1(div, file$c, 115, 12, 3429);
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    			append_dev$1(div, t0);
    			append_dev$1(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*tableHeaders*/ 32 && t0_value !== (t0_value = /*header*/ ctx[31].title + "")) set_data_dev$1(t0, t0_value);

    			if (dirty[0] & /*tableHeaders*/ 32) {
    				set_style(div, "width", /*header*/ ctx[31].width + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(115:8) {#each tableHeaders as header}",
    		ctx
    	});

    	return block;
    }

    // (125:16) {#each visibleRows as row}
    function create_each_block$4(ctx) {
    	let current;

    	const tablerow = new TableRow({
    			props: {
    				row: /*row*/ ctx[28],
    				headers: /*tableHeaders*/ ctx[5]
    			},
    			$$inline: true
    		});

    	tablerow.$on("rowExpanded", /*onRowExpanded*/ ctx[14]);
    	tablerow.$on("rowCollapsed", /*onRowCollapsed*/ ctx[15]);

    	const block = {
    		c: function create() {
    			create_component(tablerow.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component$1(tablerow, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tablerow_changes = {};
    			if (dirty[0] & /*visibleRows*/ 16) tablerow_changes.row = /*row*/ ctx[28];
    			if (dirty[0] & /*tableHeaders*/ 32) tablerow_changes.headers = /*tableHeaders*/ ctx[5];
    			tablerow.$set(tablerow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(tablerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tablerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component$1(tablerow, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(125:16) {#each visibleRows as row}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div4;
    	let div0;
    	let t;
    	let div3;
    	let div2;
    	let div1;
    	let scrollListener_action;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*tableHeaders*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*visibleRows*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div4 = element$1("div");
    			div0 = element$1("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space$1();
    			div3 = element$1("div");
    			div2 = element$1("div");
    			div1 = element$1("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev$1(div0, "class", "sg-table-header svelte-s3b3pm");
    			set_style(div0, "height", /*$headerHeight*/ ctx[8] + "px");
    			add_location$1(div0, file$c, 113, 4, 3285);
    			attr_dev$1(div1, "class", "sg-table-rows svelte-s3b3pm");
    			set_style(div1, "padding-top", /*paddingTop*/ ctx[1] + "px");
    			set_style(div1, "padding-bottom", /*paddingBottom*/ ctx[2] + "px");
    			set_style(div1, "height", /*rowContainerHeight*/ ctx[3] + "px");
    			add_location$1(div1, file$c, 123, 12, 3756);
    			attr_dev$1(div2, "class", "sg-table-scroller svelte-s3b3pm");
    			add_location$1(div2, file$c, 122, 8, 3692);
    			attr_dev$1(div3, "class", "sg-table-body svelte-s3b3pm");
    			toggle_class(div3, "bottom-scrollbar-visible", /*bottomScrollbarVisible*/ ctx[7]);
    			add_location$1(div3, file$c, 121, 4, 3597);
    			attr_dev$1(div4, "class", "sg-table sg-view svelte-s3b3pm");
    			set_style(div4, "width", /*tableWidth*/ ctx[0] + "px");
    			add_location$1(div4, file$c, 112, 0, 3219);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div4, anchor);
    			append_dev$1(div4, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			/*div0_binding*/ ctx[27](div0);
    			append_dev$1(div4, t);
    			append_dev$1(div4, div3);
    			append_dev$1(div3, div2);
    			append_dev$1(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(scrollListener_action = /*scrollListener*/ ctx[13].call(null, div2));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*tableHeaders*/ 32) {
    				each_value_1 = /*tableHeaders*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (!current || dirty[0] & /*$headerHeight*/ 256) {
    				set_style(div0, "height", /*$headerHeight*/ ctx[8] + "px");
    			}

    			if (dirty[0] & /*visibleRows, tableHeaders, onRowExpanded, onRowCollapsed*/ 49200) {
    				each_value = /*visibleRows*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in$1(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in$1(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty[0] & /*paddingTop*/ 2) {
    				set_style(div1, "padding-top", /*paddingTop*/ ctx[1] + "px");
    			}

    			if (!current || dirty[0] & /*paddingBottom*/ 4) {
    				set_style(div1, "padding-bottom", /*paddingBottom*/ ctx[2] + "px");
    			}

    			if (!current || dirty[0] & /*rowContainerHeight*/ 8) {
    				set_style(div1, "height", /*rowContainerHeight*/ ctx[3] + "px");
    			}

    			if (dirty[0] & /*bottomScrollbarVisible*/ 128) {
    				toggle_class(div3, "bottom-scrollbar-visible", /*bottomScrollbarVisible*/ ctx[7]);
    			}

    			if (!current || dirty[0] & /*tableWidth*/ 1) {
    				set_style(div4, "width", /*tableWidth*/ ctx[0] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in$1(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div4);
    			destroy_each(each_blocks_1, detaching);
    			/*div0_binding*/ ctx[27](null);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const type = "table";

    function hide(children) {
    	children.forEach(row => {
    		if (row.children) hide(row.children);
    		row.hidden = true;
    	});
    }

    function show(children, hidden = false) {
    	children.forEach(row => {
    		if (row.children) show(row.children, !row.expanded);
    		row.hidden = hidden;
    	});
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $rowStore;
    	let $taskStore;
    	let $rowPadding;
    	let $width;
    	let $visibleWidth;
    	let $headerHeight;
    	validate_store(rowStore, "rowStore");
    	component_subscribe($$self, rowStore, $$value => $$invalidate(17, $rowStore = $$value));
    	validate_store(taskStore, "taskStore");
    	component_subscribe($$self, taskStore, $$value => $$invalidate(18, $taskStore = $$value));
    	const dispatch = createEventDispatcher();
    	let { tableWidth } = $$props;
    	let { paddingTop } = $$props;
    	let { paddingBottom } = $$props;
    	let { rowContainerHeight } = $$props;
    	let { visibleRows } = $$props;

    	let { tableHeaders = [
    		{
    			title: "Name",
    			property: "label",
    			width: 100
    		}
    	] } = $$props;

    	const { from, to, width, visibleWidth, headerHeight } = getContext("dimensions");
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(20, $width = value));
    	validate_store(visibleWidth, "visibleWidth");
    	component_subscribe($$self, visibleWidth, value => $$invalidate(21, $visibleWidth = value));
    	validate_store(headerHeight, "headerHeight");
    	component_subscribe($$self, headerHeight, value => $$invalidate(8, $headerHeight = value));
    	const { rowPadding } = getContext("options");
    	validate_store(rowPadding, "rowPadding");
    	component_subscribe($$self, rowPadding, value => $$invalidate(19, $rowPadding = value));

    	onMount$1(() => {
    		dispatch("init", { module: this });
    	});

    	const { scrollables } = getContext("gantt");
    	let headerContainer;

    	function scrollListener(node) {
    		scrollables.push({ node, orientation: "vertical" });

    		node.addEventListener("scroll", event => {
    			$$invalidate(6, headerContainer.scrollLeft = node.scrollLeft, headerContainer);
    		});

    		return {
    			destroy() {
    				node.removeEventListener("scroll");
    			}
    		};
    	}

    	let scrollWidth;

    	function onRowExpanded(event) {
    		const row = event.detail.row;
    		row.expanded = true;
    		if (row.children) show(row.children);
    		updateYPositions();
    	}

    	function onRowCollapsed(event) {
    		const row = event.detail.row;
    		row.expanded = false;
    		if (row.children) hide(row.children);
    		updateYPositions();
    	}

    	function updateYPositions() {
    		let y = 0;

    		$rowStore.ids.forEach(id => {
    			const row = $rowStore.entities[id];

    			if (!row.hidden) {
    				set_store_value(rowStore, $rowStore.entities[id].y = y, $rowStore);
    				y += 52;
    			}
    		});

    		$taskStore.ids.forEach(id => {
    			const task = $taskStore.entities[id];
    			const row = $rowStore.entities[task.model.resourceId];
    			set_store_value(taskStore, $taskStore.entities[id].top = row.y + $rowPadding, $taskStore);
    		});
    	}

    	// if gantt displays a bottom scrollbar and table does not, we need to pad out the table
    	let bottomScrollbarVisible;

    	const writable_props = [
    		"tableWidth",
    		"paddingTop",
    		"paddingBottom",
    		"rowContainerHeight",
    		"visibleRows",
    		"tableHeaders"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("Table", $$slots, []);

    	function div0_binding($$value) {
    		binding_callbacks$1[$$value ? "unshift" : "push"](() => {
    			$$invalidate(6, headerContainer = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("tableWidth" in $$props) $$invalidate(0, tableWidth = $$props.tableWidth);
    		if ("paddingTop" in $$props) $$invalidate(1, paddingTop = $$props.paddingTop);
    		if ("paddingBottom" in $$props) $$invalidate(2, paddingBottom = $$props.paddingBottom);
    		if ("rowContainerHeight" in $$props) $$invalidate(3, rowContainerHeight = $$props.rowContainerHeight);
    		if ("visibleRows" in $$props) $$invalidate(4, visibleRows = $$props.visibleRows);
    		if ("tableHeaders" in $$props) $$invalidate(5, tableHeaders = $$props.tableHeaders);
    	};

    	$$self.$capture_state = () => ({
    		type,
    		createEventDispatcher,
    		onMount: onMount$1,
    		getContext,
    		dispatch,
    		TableRow,
    		H_SCROLLBAR_WIDTH,
    		rowStore,
    		taskStore,
    		tableWidth,
    		paddingTop,
    		paddingBottom,
    		rowContainerHeight,
    		visibleRows,
    		tableHeaders,
    		from,
    		to,
    		width,
    		visibleWidth,
    		headerHeight,
    		rowPadding,
    		scrollables,
    		headerContainer,
    		scrollListener,
    		scrollWidth,
    		onRowExpanded,
    		onRowCollapsed,
    		updateYPositions,
    		hide,
    		show,
    		bottomScrollbarVisible,
    		$rowStore,
    		$taskStore,
    		$rowPadding,
    		$width,
    		$visibleWidth,
    		$headerHeight
    	});

    	$$self.$inject_state = $$props => {
    		if ("tableWidth" in $$props) $$invalidate(0, tableWidth = $$props.tableWidth);
    		if ("paddingTop" in $$props) $$invalidate(1, paddingTop = $$props.paddingTop);
    		if ("paddingBottom" in $$props) $$invalidate(2, paddingBottom = $$props.paddingBottom);
    		if ("rowContainerHeight" in $$props) $$invalidate(3, rowContainerHeight = $$props.rowContainerHeight);
    		if ("visibleRows" in $$props) $$invalidate(4, visibleRows = $$props.visibleRows);
    		if ("tableHeaders" in $$props) $$invalidate(5, tableHeaders = $$props.tableHeaders);
    		if ("headerContainer" in $$props) $$invalidate(6, headerContainer = $$props.headerContainer);
    		if ("scrollWidth" in $$props) $$invalidate(16, scrollWidth = $$props.scrollWidth);
    		if ("bottomScrollbarVisible" in $$props) $$invalidate(7, bottomScrollbarVisible = $$props.bottomScrollbarVisible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*tableHeaders*/ 32) {
    			 {
    				let sum = 0;

    				tableHeaders.forEach(header => {
    					sum += header.width;
    				});

    				$$invalidate(16, scrollWidth = sum);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*$width, $visibleWidth, scrollWidth, tableWidth*/ 3211265) {
    			 {
    				$$invalidate(7, bottomScrollbarVisible = $width > $visibleWidth && scrollWidth <= tableWidth);
    			}
    		}
    	};

    	return [
    		tableWidth,
    		paddingTop,
    		paddingBottom,
    		rowContainerHeight,
    		visibleRows,
    		tableHeaders,
    		headerContainer,
    		bottomScrollbarVisible,
    		$headerHeight,
    		width,
    		visibleWidth,
    		headerHeight,
    		rowPadding,
    		scrollListener,
    		onRowExpanded,
    		onRowCollapsed,
    		scrollWidth,
    		$rowStore,
    		$taskStore,
    		$rowPadding,
    		$width,
    		$visibleWidth,
    		dispatch,
    		from,
    		to,
    		scrollables,
    		updateYPositions,
    		div0_binding
    	];
    }

    class Table extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);

    		init$1(
    			this,
    			options,
    			instance$d,
    			create_fragment$d,
    			safe_not_equal$1,
    			{
    				tableWidth: 0,
    				paddingTop: 1,
    				paddingBottom: 2,
    				rowContainerHeight: 3,
    				visibleRows: 4,
    				tableHeaders: 5
    			},
    			[-1, -1]
    		);

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tableWidth*/ ctx[0] === undefined && !("tableWidth" in props)) {
    			console.warn("<Table> was created without expected prop 'tableWidth'");
    		}

    		if (/*paddingTop*/ ctx[1] === undefined && !("paddingTop" in props)) {
    			console.warn("<Table> was created without expected prop 'paddingTop'");
    		}

    		if (/*paddingBottom*/ ctx[2] === undefined && !("paddingBottom" in props)) {
    			console.warn("<Table> was created without expected prop 'paddingBottom'");
    		}

    		if (/*rowContainerHeight*/ ctx[3] === undefined && !("rowContainerHeight" in props)) {
    			console.warn("<Table> was created without expected prop 'rowContainerHeight'");
    		}

    		if (/*visibleRows*/ ctx[4] === undefined && !("visibleRows" in props)) {
    			console.warn("<Table> was created without expected prop 'visibleRows'");
    		}
    	}

    	get tableWidth() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tableWidth(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get paddingTop() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paddingTop(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get paddingBottom() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paddingBottom(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rowContainerHeight() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rowContainerHeight(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visibleRows() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visibleRows(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tableHeaders() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tableHeaders(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var SvelteGanttTable = Table;

    /* src\modules\dependencies\Arrow.svelte generated by Svelte v3.23.0 */
    const file$d = "src\\modules\\dependencies\\Arrow.svelte";

    function create_fragment$e(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev$1(path0, "d", /*path*/ ctx[2]);
    			attr_dev$1(path0, "stroke", /*stroke*/ ctx[0]);
    			attr_dev$1(path0, "stroke-width", /*strokeWidth*/ ctx[1]);
    			attr_dev$1(path0, "fill", "transparent");
    			attr_dev$1(path0, "class", "select-area svelte-5u2c1l");
    			add_location$1(path0, file$d, 53, 4, 1507);
    			attr_dev$1(path1, "d", /*arrowPath*/ ctx[3]);
    			attr_dev$1(path1, "fill", /*stroke*/ ctx[0]);
    			add_location$1(path1, file$d, 54, 4, 1609);
    			attr_dev$1(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev$1(svg, "shape-rendering", "crispEdges");
    			attr_dev$1(svg, "class", "arrow svelte-5u2c1l");
    			attr_dev$1(svg, "height", "100%");
    			attr_dev$1(svg, "width", "100%");
    			add_location$1(svg, file$d, 52, 0, 1391);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, svg, anchor);
    			append_dev$1(svg, path0);
    			append_dev$1(svg, path1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*path*/ 4) {
    				attr_dev$1(path0, "d", /*path*/ ctx[2]);
    			}

    			if (dirty & /*stroke*/ 1) {
    				attr_dev$1(path0, "stroke", /*stroke*/ ctx[0]);
    			}

    			if (dirty & /*strokeWidth*/ 2) {
    				attr_dev$1(path0, "stroke-width", /*strokeWidth*/ ctx[1]);
    			}

    			if (dirty & /*arrowPath*/ 8) {
    				attr_dev$1(path1, "d", /*arrowPath*/ ctx[3]);
    			}

    			if (dirty & /*stroke*/ 1) {
    				attr_dev$1(path1, "fill", /*stroke*/ ctx[0]);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(svg);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { startY } = $$props;
    	let { endY } = $$props;
    	let { endX } = $$props;
    	let { startX } = $$props;
    	let { minLen = 12 } = $$props;
    	let { arrowSize = 5 } = $$props;
    	let { stroke = "red" } = $$props;
    	let { strokeWidth = 2 } = $$props;

    	onMount$1(() => {
    		
    	});

    	let height;
    	let width;
    	let path;
    	let arrowPath;

    	const writable_props = [
    		"startY",
    		"endY",
    		"endX",
    		"startX",
    		"minLen",
    		"arrowSize",
    		"stroke",
    		"strokeWidth"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Arrow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("Arrow", $$slots, []);

    	$$self.$set = $$props => {
    		if ("startY" in $$props) $$invalidate(4, startY = $$props.startY);
    		if ("endY" in $$props) $$invalidate(5, endY = $$props.endY);
    		if ("endX" in $$props) $$invalidate(6, endX = $$props.endX);
    		if ("startX" in $$props) $$invalidate(7, startX = $$props.startX);
    		if ("minLen" in $$props) $$invalidate(8, minLen = $$props.minLen);
    		if ("arrowSize" in $$props) $$invalidate(9, arrowSize = $$props.arrowSize);
    		if ("stroke" in $$props) $$invalidate(0, stroke = $$props.stroke);
    		if ("strokeWidth" in $$props) $$invalidate(1, strokeWidth = $$props.strokeWidth);
    	};

    	$$self.$capture_state = () => ({
    		onMount: onMount$1,
    		startY,
    		endY,
    		endX,
    		startX,
    		minLen,
    		arrowSize,
    		stroke,
    		strokeWidth,
    		height,
    		width,
    		path,
    		arrowPath
    	});

    	$$self.$inject_state = $$props => {
    		if ("startY" in $$props) $$invalidate(4, startY = $$props.startY);
    		if ("endY" in $$props) $$invalidate(5, endY = $$props.endY);
    		if ("endX" in $$props) $$invalidate(6, endX = $$props.endX);
    		if ("startX" in $$props) $$invalidate(7, startX = $$props.startX);
    		if ("minLen" in $$props) $$invalidate(8, minLen = $$props.minLen);
    		if ("arrowSize" in $$props) $$invalidate(9, arrowSize = $$props.arrowSize);
    		if ("stroke" in $$props) $$invalidate(0, stroke = $$props.stroke);
    		if ("strokeWidth" in $$props) $$invalidate(1, strokeWidth = $$props.strokeWidth);
    		if ("height" in $$props) $$invalidate(10, height = $$props.height);
    		if ("width" in $$props) $$invalidate(11, width = $$props.width);
    		if ("path" in $$props) $$invalidate(2, path = $$props.path);
    		if ("arrowPath" in $$props) $$invalidate(3, arrowPath = $$props.arrowPath);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*endY, startY*/ 48) {
    			 $$invalidate(10, height = endY - startY);
    		}

    		if ($$self.$$.dirty & /*endX, startX*/ 192) {
    			 $$invalidate(11, width = endX - startX);
    		}

    		if ($$self.$$.dirty & /*startX, minLen, endX, startY, endY, height, width*/ 3568) {
    			 {
    				if (startX == NaN || startX == undefined) $$invalidate(2, path = "M0 0");
    				let result;

    				if (startX + minLen >= endX && startY != endY) {
    					result = `L ${startX + minLen} ${startY} 
                        L ${startX + minLen} ${startY + height / 2}
                        L ${endX - minLen} ${startY + height / 2}
                        L ${endX - minLen} ${endY} `;
    				} else {
    					result = `L ${startX + width / 2} ${startY} 
                        L ${startX + width / 2} ${endY}`;
    				}

    				// -2 so the line doesn't stick out of the arrowhead
    				$$invalidate(2, path = `M${startX} ${startY}` + result + `L ${endX - 2} ${endY}`);
    			}
    		}

    		if ($$self.$$.dirty & /*endX, arrowSize, endY*/ 608) {
    			 {
    				if (endX == NaN || endX == undefined) $$invalidate(3, arrowPath = "M0 0");
    				$$invalidate(3, arrowPath = `M${endX - arrowSize} ${endY - arrowSize} L${endX} ${endY} L${endX - arrowSize} ${endY + arrowSize} Z`);
    			}
    		}
    	};

    	return [
    		stroke,
    		strokeWidth,
    		path,
    		arrowPath,
    		startY,
    		endY,
    		endX,
    		startX,
    		minLen,
    		arrowSize
    	];
    }

    class Arrow extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$e, create_fragment$e, safe_not_equal$1, {
    			startY: 4,
    			endY: 5,
    			endX: 6,
    			startX: 7,
    			minLen: 8,
    			arrowSize: 9,
    			stroke: 0,
    			strokeWidth: 1
    		});

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Arrow",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*startY*/ ctx[4] === undefined && !("startY" in props)) {
    			console.warn("<Arrow> was created without expected prop 'startY'");
    		}

    		if (/*endY*/ ctx[5] === undefined && !("endY" in props)) {
    			console.warn("<Arrow> was created without expected prop 'endY'");
    		}

    		if (/*endX*/ ctx[6] === undefined && !("endX" in props)) {
    			console.warn("<Arrow> was created without expected prop 'endX'");
    		}

    		if (/*startX*/ ctx[7] === undefined && !("startX" in props)) {
    			console.warn("<Arrow> was created without expected prop 'startX'");
    		}
    	}

    	get startY() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startY(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get endY() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endY(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get endX() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endX(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startX() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startX(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minLen() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minLen(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get arrowSize() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set arrowSize(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stroke() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stroke(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get strokeWidth() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set strokeWidth(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\modules\dependencies\Dependency.svelte generated by Svelte v3.23.0 */
    const file$e = "src\\modules\\dependencies\\Dependency.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let current;

    	const arrow = new Arrow({
    			props: {
    				startX: /*fromTask*/ ctx[1].left + /*fromTask*/ ctx[1].width,
    				startY: /*fromTask*/ ctx[1].top + /*fromTask*/ ctx[1].height / 2,
    				endX: /*toTask*/ ctx[2].left,
    				endY: /*toTask*/ ctx[2].top + /*toTask*/ ctx[2].height / 2
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			create_component(arrow.$$.fragment);
    			attr_dev$1(div, "class", "sg-dependency svelte-fnf1gz");
    			set_style(div, "left", "0");
    			set_style(div, "top", "0");
    			attr_dev$1(div, "data-dependency-id", /*id*/ ctx[0]);
    			add_location$1(div, file$e, 16, 0, 317);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);
    			mount_component$1(arrow, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const arrow_changes = {};
    			if (dirty & /*fromTask*/ 2) arrow_changes.startX = /*fromTask*/ ctx[1].left + /*fromTask*/ ctx[1].width;
    			if (dirty & /*fromTask*/ 2) arrow_changes.startY = /*fromTask*/ ctx[1].top + /*fromTask*/ ctx[1].height / 2;
    			if (dirty & /*toTask*/ 4) arrow_changes.endX = /*toTask*/ ctx[2].left;
    			if (dirty & /*toTask*/ 4) arrow_changes.endY = /*toTask*/ ctx[2].top + /*toTask*/ ctx[2].height / 2;
    			arrow.$set(arrow_changes);

    			if (!current || dirty & /*id*/ 1) {
    				attr_dev$1(div, "data-dependency-id", /*id*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(arrow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arrow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);
    			destroy_component$1(arrow);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $taskStore;
    	validate_store(taskStore, "taskStore");
    	component_subscribe($$self, taskStore, $$value => $$invalidate(5, $taskStore = $$value));
    	let { id } = $$props;
    	let { fromId } = $$props;
    	let { toId } = $$props;
    	let fromTask;
    	let toTask;
    	const writable_props = ["id", "fromId", "toId"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dependency> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("Dependency", $$slots, []);

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("fromId" in $$props) $$invalidate(3, fromId = $$props.fromId);
    		if ("toId" in $$props) $$invalidate(4, toId = $$props.toId);
    	};

    	$$self.$capture_state = () => ({
    		Arrow,
    		taskStore,
    		id,
    		fromId,
    		toId,
    		fromTask,
    		toTask,
    		$taskStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("fromId" in $$props) $$invalidate(3, fromId = $$props.fromId);
    		if ("toId" in $$props) $$invalidate(4, toId = $$props.toId);
    		if ("fromTask" in $$props) $$invalidate(1, fromTask = $$props.fromTask);
    		if ("toTask" in $$props) $$invalidate(2, toTask = $$props.toTask);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$taskStore, fromId*/ 40) {
    			 $$invalidate(1, fromTask = $taskStore.entities[fromId]);
    		}

    		if ($$self.$$.dirty & /*$taskStore, toId*/ 48) {
    			 $$invalidate(2, toTask = $taskStore.entities[toId]);
    		}
    	};

    	return [id, fromTask, toTask, fromId, toId];
    }

    class Dependency extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$f, create_fragment$f, safe_not_equal$1, { id: 0, fromId: 3, toId: 4 });

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dependency",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
    			console.warn("<Dependency> was created without expected prop 'id'");
    		}

    		if (/*fromId*/ ctx[3] === undefined && !("fromId" in props)) {
    			console.warn("<Dependency> was created without expected prop 'fromId'");
    		}

    		if (/*toId*/ ctx[4] === undefined && !("toId" in props)) {
    			console.warn("<Dependency> was created without expected prop 'toId'");
    		}
    	}

    	get id() {
    		throw new Error("<Dependency>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Dependency>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fromId() {
    		throw new Error("<Dependency>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fromId(value) {
    		throw new Error("<Dependency>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toId() {
    		throw new Error("<Dependency>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toId(value) {
    		throw new Error("<Dependency>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\modules\dependencies\GanttDependencies.svelte generated by Svelte v3.23.0 */
    const file$f = "src\\modules\\dependencies\\GanttDependencies.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (39:4) {#each visibleDependencies as dependency (dependency.id)}
    function create_each_block$5(key_1, ctx) {
    	let first;
    	let current;
    	const dependency_spread_levels = [/*dependency*/ ctx[6]];
    	let dependency_props = {};

    	for (let i = 0; i < dependency_spread_levels.length; i += 1) {
    		dependency_props = assign(dependency_props, dependency_spread_levels[i]);
    	}

    	const dependency = new Dependency({ props: dependency_props, $$inline: true });

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(dependency.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, first, anchor);
    			mount_component$1(dependency, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dependency_changes = (dirty & /*visibleDependencies*/ 1)
    			? get_spread_update(dependency_spread_levels, [get_spread_object(/*dependency*/ ctx[6])])
    			: {};

    			dependency.$set(dependency_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in$1(dependency.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dependency.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(first);
    			destroy_component$1(dependency, detaching);
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(39:4) {#each visibleDependencies as dependency (dependency.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*visibleDependencies*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*dependency*/ ctx[6].id;
    	validate_each_keys(ctx, each_value, get_each_context$5, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$5(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$5(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element$1("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev$1(div, "class", "dependency-container svelte-hatx0f");
    			add_location$1(div, file$f, 37, 0, 1039);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev$1(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*visibleDependencies*/ 1) {
    				const each_value = /*visibleDependencies*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$5, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$5, null, get_each_context$5);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in$1(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev$1(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev$1("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const type$1 = "body";

    function instance$g($$self, $$props, $$invalidate) {
    	let $taskStore;
    	let $visibleHeight;
    	validate_store(taskStore, "taskStore");
    	component_subscribe($$self, taskStore, $$value => $$invalidate(4, $taskStore = $$value));
    	const { visibleHeight } = getContext("dimensions");
    	validate_store(visibleHeight, "visibleHeight");
    	component_subscribe($$self, visibleHeight, value => $$invalidate(5, $visibleHeight = value));
    	let { paddingTop } = $$props;
    	let { dependencies = [] } = $$props;
    	let visibleDependencies = [];
    	const writable_props = ["paddingTop", "dependencies"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GanttDependencies> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots$1("GanttDependencies", $$slots, []);

    	$$self.$set = $$props => {
    		if ("paddingTop" in $$props) $$invalidate(2, paddingTop = $$props.paddingTop);
    		if ("dependencies" in $$props) $$invalidate(3, dependencies = $$props.dependencies);
    	};

    	$$self.$capture_state = () => ({
    		type: type$1,
    		getContext,
    		Dependency,
    		taskStore,
    		visibleHeight,
    		paddingTop,
    		dependencies,
    		visibleDependencies,
    		$taskStore,
    		$visibleHeight
    	});

    	$$self.$inject_state = $$props => {
    		if ("paddingTop" in $$props) $$invalidate(2, paddingTop = $$props.paddingTop);
    		if ("dependencies" in $$props) $$invalidate(3, dependencies = $$props.dependencies);
    		if ("visibleDependencies" in $$props) $$invalidate(0, visibleDependencies = $$props.visibleDependencies);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*dependencies, $taskStore, paddingTop, $visibleHeight*/ 60) {
    			 {
    				const result = [];

    				for (let i = 0; i < dependencies.length; i++) {
    					const dependency = dependencies[i];
    					const map = $taskStore.entities;
    					const fromTask = map[dependency.fromId];
    					const toTask = map[dependency.toId];

    					if (fromTask && toTask && Math.min(fromTask.top, toTask.top) <= paddingTop + $visibleHeight && Math.max(fromTask.top, toTask.top) >= paddingTop) {
    						result.push(dependency);
    					}
    				}

    				$$invalidate(0, visibleDependencies = result);
    			}
    		}
    	};

    	return [visibleDependencies, visibleHeight, paddingTop, dependencies];
    }

    class GanttDependencies extends SvelteComponentDev$1 {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$g, create_fragment$g, safe_not_equal$1, { paddingTop: 2, dependencies: 3 });

    		dispatch_dev$1("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GanttDependencies",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*paddingTop*/ ctx[2] === undefined && !("paddingTop" in props)) {
    			console.warn("<GanttDependencies> was created without expected prop 'paddingTop'");
    		}
    	}

    	get paddingTop() {
    		throw new Error("<GanttDependencies>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paddingTop(value) {
    		throw new Error("<GanttDependencies>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dependencies() {
    		throw new Error("<GanttDependencies>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dependencies(value) {
    		throw new Error("<GanttDependencies>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var SvelteGanttDependencies = GanttDependencies;

    const defaults = {
        enabled: true,
        elementContent: () => {
            const element = document.createElement('div');
            element.innerHTML = 'New Task';
            Object.assign(element.style, {
                position: 'absolute',
                background: '#eee',
                padding: '0.5em 1em',
                fontSize: '12px',
                pointerEvents: 'none',
            });
            return element;
        }
    };
    class SvelteGanttExternal {
        constructor(node, options) {
            this.options = Object.assign({}, defaults, options);
            this.draggable = new Draggable(node, {
                onDrag: this.onDrag.bind(this),
                dragAllowed: () => this.options.enabled,
                resizeAllowed: false,
                onDrop: this.onDrop.bind(this),
                container: document.body,
                getX: (event) => event.pageX,
                getY: (event) => event.pageY,
                getWidth: () => 0
            });
        }
        onDrag({ x, y }) {
            if (!this.element) {
                this.element = this.options.elementContent();
                document.body.appendChild(this.element);
                this.options.dragging = true;
            }
            this.element.style.top = y + 'px';
            this.element.style.left = x + 'px';
        }
        onDrop(event) {
            var _a, _b, _c, _d;
            const gantt = this.options.gantt;
            const targetRow = gantt.dndManager.getTarget('row', event.mouseEvent);
            if (targetRow) {
                const mousePos = getRelativePos(gantt.getRowContainer(), event.mouseEvent);
                const date = gantt.utils.getDateByPosition(mousePos.x);
                (_b = (_a = this.options).onsuccess) === null || _b === void 0 ? void 0 : _b.call(_a, targetRow, date, gantt);
            }
            else {
                (_d = (_c = this.options).onfail) === null || _d === void 0 ? void 0 : _d.call(_c);
            }
            document.body.removeChild(this.element);
            this.options.dragging = false;
            this.element = null;
        }
    }

    // import { SvelteGanttTableComponent } from './modules/table';
    var SvelteGantt = Gantt;

    function time(input) {
        return moment(input, 'HH:mm');
    }

    const colors = ['blue', 'green', 'orange'];
    let generation = 0;
    let rowCount = 100;

    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    function generate() {
        const rows = [];
        const tasks = [];

        const ids = [...Array(rowCount).keys()];
        shuffle(ids);

        for (let i = 0; i < rowCount; i++) {
            let rand_bool = Math.random() < 0.2;

            rows.push({
                id: i,
                label: 'Row #' + i,
                age: (Math.random() * 80) | 0,
                enableDragging: true,
                imageSrc: 'Content/joe.jpg',
                classes: rand_bool ? ['row-disabled'] : undefined,
                enableDragging: !rand_bool,
                generation
            });

            rand_bool = Math.random() > 0.5;

            const rand_h = (Math.random() * 10) | 0;
            const rand_d = (Math.random() * 5) | 0 + 1;

            tasks.push({
                type: 'task',
                id: ids[i],
                resourceId: i,
                label: 'Task #' + ids[i],
                from: time(`${7 + rand_h}:00`),
                to: time(`${7 + rand_h + rand_d}:00`),
                classes: colors[(Math.random() * colors.length) | 0],
                generation
            });
        }

        generation += 1;

        return { rows, tasks };
    }

    const data = {
        rows: [{
            "id": 1,
            "label": "Preparation and Planning"
        }, {
            "id": 2,
            "label": "Development"
        }, {
            "id": 3,
            "label": "Implementation"
        }, {
            "id": 4,
            "label": "Training"
        }, {
            "id": 5,
            "label": "Roll-out product"
        }],
        tasks: [{
            "id": 1,
            "resourceId": 1,
            "label": "Preparation",
            "from": time("7:00"),
            "to": time("9:00"),
            "classes": "orange"
        }, {
            "id": 2,
            "resourceId": 1,
            "label": "Planning",
            "from": time("9:30"),
            "to": time("11:00"),
            "classes": "orange"
        }, {
            "id": 3,
            "resourceId": 2,
            "label": "Development",
            "from": time("12:00"),
            "to": time("13:30"),
            "classes": "orange"
        }, {
            "id": 4,
            "resourceId": 3,
            "label": "Implementation",
            "from": time("13:45"),
            "to": time("15:45"),
            "classes": "orange"
        }, {
            "id": 5,
            "resourceId": 5,
            "label": "Finish",
            "from": time("17:00"),
            "to": time("17:45"),
            "classes": "green"
        }, {
            "id": 6,
            "resourceId": 4,
            "label": "Training",
            "from": time("7:00"),
            "to": time("10:00"),
            "classes": "blue"
        }],
        dependencies: [{
            id: 1,
            fromId: 1,
            toId: 2
        }, {
            id: 2,
            fromId: 2,
            toId: 3
        }, {
            id: 3,
            fromId: 3,
            toId: 4
        }, {
            id: 4,
            fromId: 4,
            toId: 5
        }, {
            id: 5,
            fromId: 6,
            toId: 5
        }]
    };

    const data$1 = {
        rows: [{
            id: 10,
            label: "Accounting",
            class: 'row-group',
            iconClass: 'fas fa-calculator',
            children: [{
                id: 11,
                label: "Petunia Mulliner"
            }, {
                id: 12,
                label: "Mélina Giacovetti"
            }, {
                id: 13,
                label: "Marlène Lasslett"
            }, {
                id: 14,
                label: "Adda Youell"
            }]
        }, {
            id: 20,
            label: "Business Development",
            class: 'row-group',
            iconClass: 'fas fa-user-tie',
            children: [{
                id: 21,
                label: "Pietra Fallow"
            }, {
                id: 22,
                label: "Mariellen Torbard"
            }, {
                id: 23,
                label: "Renate Humbee"
            }]
        }, {
            id: 3,
            label: "Ida Flewan"
        }, {
            id: 4,
            label: "Lauréna Shrigley"
        }, {
            id: 5,
            label: "Ange Kembry"
        }],
        tasks: [{
            "id": 1,
            "resourceId": 11,
            "label": "LPCVD",
            "from": time("9:00"),
            "to": time("11:00"),
            "classes": "orange"
        }, {
            "id": 2,
            "resourceId": 12,
            "label": "Entrepreneurship",
            "from": time("10:00"),
            "to": time("12:30"),
            "classes": "orange"
        }, {
            "id": 3,
            "resourceId": 13,
            "label": "PET-CT",
            "from": time("13:30"),
            "to": time("15:00"),
            "classes": "orange"
        }, {
            "id": 4,
            "resourceId": 14,
            "label": "Auditing",
            "from": time("9:30"),
            "to": time("11:30"),
            "classes": "orange"
        }, {
            "id": 5,
            "resourceId": 21,
            "label": "Security Clearance",
            "from": time("15:15"),
            "to": time("16:00"),
            "classes": "green"
        }, {
            "id": 6,
            "resourceId": 22,
            "label": "Policy Analysis",
            "from": time("14:00"),
            "to": time("17:00"),
            "classes": "blue"
        }, {
            "id": 7,
            "resourceId": 23,
            "label": "Xbox 360",
            "from": time("13:30"),
            "to": time("14:30"),
            "classes": "blue"
        }, {
            "id": 8,
            "resourceId": 3,
            "label": "GNU/Linux",
            "from": time("14:00"),
            "to": time("15:30"),
            "classes": "blue"
        }, {
            "id": 9,
            "resourceId": 4,
            "label": "Electronic Trading",
            "from": time("15:00"),
            "to": time("17:00"),
            "classes": "green"
        }, {
            "id": 10,
            "resourceId": 5,
            "label": "Alternative Medicine",
            "from": time("14:30"),
            "to": time("15:30"),
            "classes": "orange"
        }],
        dependencies: []
    };

    /* docs\src\App.svelte generated by Svelte v3.23.0 */

    const { console: console_1$3 } = globals;
    const file$g = "docs\\src\\App.svelte";

    // (268:4) {#if showCode}
    function create_if_block$4(ctx) {
    	let pre;
    	let t;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			t = text(/*code*/ ctx[0]);
    			attr_dev(pre, "class", "code-float svelte-186nbj");
    			add_location(pre, file$g, 268, 4, 7758);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*code*/ 1) set_data_dev(t, /*code*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(268:4) {#if showCode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let header;
    	let div0;
    	let a;
    	let t1;
    	let div1;
    	let input0;
    	let t2;
    	let input1;
    	let t3;
    	let input2;
    	let t4;
    	let input3;
    	let t5;
    	let input4;
    	let t6;
    	let input5;
    	let t7;
    	let input6;
    	let t8;
    	let input7;
    	let t9;
    	let div3;
    	let div2;
    	let t10;
    	let mounted;
    	let dispose;
    	let if_block = /*showCode*/ ctx[5] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "Svelte-gantt";
    			t1 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			input3 = element("input");
    			t5 = space();
    			input4 = element("input");
    			t6 = space();
    			input5 = element("input");
    			t7 = space();
    			input6 = element("input");
    			t8 = space();
    			input7 = element("input");
    			t9 = space();
    			div3 = element("div");
    			div2 = element("div");
    			t10 = space();
    			if (if_block) if_block.c();
    			attr_dev(a, "href", "https://github.com/ANovokmet/svelte-gantt");
    			attr_dev(a, "class", "svelte-186nbj");
    			add_location(a, file$g, 247, 8, 6790);
    			attr_dev(div0, "class", "header-title svelte-186nbj");
    			add_location(div0, file$g, 246, 4, 6754);
    			attr_dev(input0, "type", "button");
    			input0.value = "Tree";
    			attr_dev(input0, "class", "svelte-186nbj");
    			add_location(input0, file$g, 251, 8, 6917);
    			attr_dev(input1, "type", "button");
    			input1.value = "Dependencies";
    			attr_dev(input1, "class", "svelte-186nbj");
    			add_location(input1, file$g, 252, 8, 6996);
    			attr_dev(input2, "type", "button");
    			input2.value = "Large";
    			attr_dev(input2, "class", "svelte-186nbj");
    			add_location(input2, file$g, 253, 8, 7092);
    			attr_dev(input3, "type", "button");
    			input3.value = "<";
    			attr_dev(input3, "class", "svelte-186nbj");
    			add_location(input3, file$g, 255, 8, 7176);
    			attr_dev(input4, "type", "button");
    			input4.value = "Day view";
    			attr_dev(input4, "class", "svelte-186nbj");
    			add_location(input4, file$g, 256, 8, 7246);
    			attr_dev(input5, "type", "button");
    			input5.value = ">";
    			attr_dev(input5, "class", "svelte-186nbj");
    			add_location(input5, file$g, 257, 8, 7319);
    			attr_dev(input6, "type", "button");
    			input6.value = "Week view";
    			attr_dev(input6, "class", "svelte-186nbj");
    			add_location(input6, file$g, 259, 8, 7387);
    			attr_dev(input7, "id", "new-task");
    			attr_dev(input7, "type", "button");
    			input7.value = "Drag to gantt";
    			attr_dev(input7, "class", "svelte-186nbj");
    			add_location(input7, file$g, 260, 8, 7462);
    			attr_dev(div1, "class", "header-controls svelte-186nbj");
    			add_location(div1, file$g, 249, 4, 6876);
    			attr_dev(header, "class", "header svelte-186nbj");
    			add_location(header, file$g, 245, 0, 6725);
    			attr_dev(div2, "id", "example-gantt");
    			attr_dev(div2, "class", "svelte-186nbj");
    			add_location(div2, file$g, 265, 4, 7700);
    			attr_dev(div3, "class", "container svelte-186nbj");
    			add_location(div3, file$g, 264, 0, 7671);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div0);
    			append_dev(div0, a);
    			append_dev(header, t1);
    			append_dev(header, div1);
    			append_dev(div1, input0);
    			append_dev(div1, t2);
    			append_dev(div1, input1);
    			append_dev(div1, t3);
    			append_dev(div1, input2);
    			append_dev(div1, t4);
    			append_dev(div1, input3);
    			append_dev(div1, t5);
    			append_dev(div1, input4);
    			append_dev(div1, t6);
    			append_dev(div1, input5);
    			append_dev(div1, t7);
    			append_dev(div1, input6);
    			append_dev(div1, t8);
    			append_dev(div1, input7);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div3, t10);
    			if (if_block) if_block.m(div3, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "click", /*click_handler*/ ctx[17], false, false, false),
    					listen_dev(input1, "click", /*click_handler_1*/ ctx[18], false, false, false),
    					listen_dev(input2, "click", /*click_handler_2*/ ctx[19], false, false, false),
    					listen_dev(input3, "click", /*onSetPreviousDay*/ ctx[4], false, false, false),
    					listen_dev(input4, "click", /*onSetDayView*/ ctx[1], false, false, false),
    					listen_dev(input5, "click", /*onSetNextDay*/ ctx[3], false, false, false),
    					listen_dev(input6, "click", /*onSetWeekView*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showCode*/ ctx[5]) if_block.p(ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function loadRoute(name) {
    	location.hash = `#/${name}`;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	const currentStart = time("06:00");
    	const currentEnd = time("18:00");
    	const colors = ["blue", "green", "orange"];

    	const timeRanges = [
    		{
    			id: 0,
    			from: time("10:00"),
    			to: time("12:00"),
    			classes: null,
    			label: "Lunch"
    		}
    	];

    	const options = {
    		rows: [],
    		tasks: [],
    		timeRanges,
    		headers: [{ unit: "day", format: "MMMM Do" }, { unit: "hour", format: "H:mm" }],
    		fitWidth: true,
    		from: currentStart,
    		to: currentEnd,
    		tableHeaders: [
    			{
    				title: "Label",
    				property: "label",
    				width: 140,
    				type: "tree"
    			}
    		],
    		tableWidth: 240,
    		ganttTableModules: [SvelteGanttTable],
    		ganttBodyModules: [SvelteGanttDependencies]
    	};

    	let gantt;

    	onMount(() => {
    		window.gantt = gantt = new SvelteGantt({
    				target: document.getElementById("example-gantt"),
    				props: options
    			});

    		//gantt.api.tasks.on.move((task) => console.log('Listener: task move', task));
    		//gantt.api.tasks.on.switchRow((task, row, previousRow) => console.log('Listener: task switched row', task));
    		gantt.api.tasks.on.select(task => console.log("Listener: task selected", task));

    		//gantt.api.tasks.on.moveEnd((task) => console.log('Listener: task move end', task));
    		gantt.api.tasks.on.changed(task => console.log("Listener: task changed", task));

    		const external = new SvelteGanttExternal(document.getElementById("new-task"),
    		{
    				gantt,
    				onsuccess: (row, date, gantt) => {
    					console.log(row.model.id, date.format());
    					const id = 5000 + Math.floor(Math.random() * 1000);

    					gantt.updateTask({
    						id,
    						label: `Task #${id}`,
    						from: date,
    						to: date.clone().add(3, "hour"),
    						classes: colors[Math.random() * colors.length | 0],
    						resourceId: row.model.id
    					});
    				},
    				elementContent: () => {
    					const element = document.createElement("div");
    					element.innerHTML = "New Task";
    					element.className = "sg-external-indicator";
    					return element;
    				}
    			});

    		router();
    	});

    	function onSetDayView() {
    		console.log("day view set");

    		gantt.$set({
    			fitWidth: true,
    			columnUnit: "minute",
    			columnOffset: 15,
    			from: currentStart,
    			to: currentEnd,
    			minWidth: 1000,
    			headers: [{ unit: "day", format: "DD.MM.YYYY" }, { unit: "hour", format: "HH" }]
    		});
    	}

    	

    	function onSetWeekView() {
    		console.log("week view set");

    		gantt.$set({
    			fitWidth: false,
    			columnUnit: "hour",
    			columnOffset: 1,
    			from: currentStart.clone().startOf("week"),
    			to: currentStart.clone().endOf("week"),
    			minWidth: 5000,
    			headers: [{ unit: "month", format: "MMMM YYYY" }, { unit: "day", format: "ddd DD" }]
    		});
    	}

    	

    	function onSetNextDay() {
    		currentStart.add(1, "day");
    		currentEnd.add(1, "day");
    		console.log("set next day");
    		gantt.$set({ from: currentStart, to: currentEnd });
    	}

    	

    	function onSetPreviousDay() {
    		currentStart.subtract(1, "day");
    		currentEnd.subtract(1, "day");
    		console.log("set previous day");
    		gantt.$set({ from: currentStart, to: currentEnd });
    	}

    	
    	let showCode = false;
    	let code = "";

    	function loadLarge() {
    		const data = generate();
    		gantt.$set({ ...data, dependencies: [] });
    		$$invalidate(0, code = JSON.stringify(data, null, "  "));
    	}

    	function loadDependencies() {
    		gantt.$set({ ...data });
    		$$invalidate(0, code = JSON.stringify(data, null, "  "));
    	}

    	function loadTree() {
    		gantt.$set({ ...data$1 });
    		$$invalidate(0, code = JSON.stringify(data$1, null, "  "));
    	}

    	const routes = {
    		"/dependencies": loadDependencies,
    		"/tree": loadTree,
    		"/large": loadLarge,
    		"": loadLarge
    	};

    	function router() {
    		const url = location.hash.slice(1);
    		routes[url]();
    	}

    	window.addEventListener("hashchange", router);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const click_handler = () => loadRoute("tree");
    	const click_handler_1 = () => loadRoute("dependencies");
    	const click_handler_2 = () => loadRoute("large");

    	$$self.$capture_state = () => ({
    		SvelteGantt,
    		SvelteGanttDependencies,
    		SvelteGanttExternal,
    		SvelteGanttTable,
    		onMount,
    		time,
    		currentStart,
    		currentEnd,
    		colors,
    		timeRanges,
    		options,
    		gantt,
    		onSetDayView,
    		onSetWeekView,
    		onSetNextDay,
    		onSetPreviousDay,
    		showCode,
    		code,
    		generateLarge: generate,
    		loadLarge,
    		dependencyData: data,
    		loadDependencies,
    		treeData: data$1,
    		loadTree,
    		loadRoute,
    		routes,
    		router
    	});

    	$$self.$inject_state = $$props => {
    		if ("gantt" in $$props) gantt = $$props.gantt;
    		if ("showCode" in $$props) $$invalidate(5, showCode = $$props.showCode);
    		if ("code" in $$props) $$invalidate(0, code = $$props.code);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		code,
    		onSetDayView,
    		onSetWeekView,
    		onSetNextDay,
    		onSetPreviousDay,
    		showCode,
    		gantt,
    		currentStart,
    		currentEnd,
    		colors,
    		timeRanges,
    		options,
    		loadLarge,
    		loadDependencies,
    		loadTree,
    		routes,
    		router,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    const app = new App({
        target: document.getElementById("app")
    });

    return app;

}(moment));
//# sourceMappingURL=index.js.map
