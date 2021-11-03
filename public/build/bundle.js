
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
            set_current_component(null);
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
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
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
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Button.svelte generated by Svelte v3.44.1 */

    const { console: console_1 } = globals;
    const file$1 = "src/Button.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let button;
    	let t0_value = /*audio*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let audio_1;
    	let audio_1_src_value;
    	let audio_1_loop_value;
    	let audio_1_is_paused = true;
    	let audio_1_updating = false;
    	let audio_1_animationframe;
    	let mounted;
    	let dispose;

    	function audio_1_timeupdate_handler() {
    		cancelAnimationFrame(audio_1_animationframe);

    		if (!audio_1.paused) {
    			audio_1_animationframe = raf(audio_1_timeupdate_handler);
    			audio_1_updating = true;
    		}

    		/*audio_1_timeupdate_handler*/ ctx[9].call(audio_1);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			audio_1 = element("audio");
    			set_style(button, "--color", /*audio*/ ctx[1].color);
    			attr_dev(button, "class", "svelte-chps6m");
    			add_location(button, file$1, 38, 4, 844);
    			attr_dev(audio_1, "sty", "");
    			if (!src_url_equal(audio_1.src, audio_1_src_value = /*audio*/ ctx[1].src)) attr_dev(audio_1, "src", audio_1_src_value);
    			audio_1.loop = audio_1_loop_value = /*audio*/ ctx[1].loop;
    			add_location(audio_1, file$1, 39, 4, 930);
    			attr_dev(div, "class", "col-4 svelte-chps6m");
    			add_location(div, file$1, 37, 0, 820);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t0);
    			append_dev(div, t1);
    			append_dev(div, audio_1);

    			if (!isNaN(/*volume*/ ctx[0])) {
    				audio_1.volume = /*volume*/ ctx[0];
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "mouseup", /*onClick*/ ctx[4], false, false, false),
    					listen_dev(audio_1, "play", /*audio_1_play_pause_handler*/ ctx[8]),
    					listen_dev(audio_1, "pause", /*audio_1_play_pause_handler*/ ctx[8]),
    					listen_dev(audio_1, "timeupdate", audio_1_timeupdate_handler),
    					listen_dev(audio_1, "volumechange", /*audio_1_volumechange_handler*/ ctx[10]),
    					listen_dev(audio_1, "ended", /*finished*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*audio*/ 2 && t0_value !== (t0_value = /*audio*/ ctx[1].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*audio*/ 2) {
    				set_style(button, "--color", /*audio*/ ctx[1].color);
    			}

    			if (dirty & /*audio*/ 2 && !src_url_equal(audio_1.src, audio_1_src_value = /*audio*/ ctx[1].src)) {
    				attr_dev(audio_1, "src", audio_1_src_value);
    			}

    			if (dirty & /*audio*/ 2 && audio_1_loop_value !== (audio_1_loop_value = /*audio*/ ctx[1].loop)) {
    				prop_dev(audio_1, "loop", audio_1_loop_value);
    			}

    			if (dirty & /*paused*/ 4 && audio_1_is_paused !== (audio_1_is_paused = /*paused*/ ctx[2])) {
    				audio_1[audio_1_is_paused ? "pause" : "play"]();
    			}

    			if (!audio_1_updating && dirty & /*currentTime*/ 8 && !isNaN(/*currentTime*/ ctx[3])) {
    				audio_1.currentTime = /*currentTime*/ ctx[3];
    			}

    			audio_1_updating = false;

    			if (dirty & /*volume*/ 1 && !isNaN(/*volume*/ ctx[0])) {
    				audio_1.volume = /*volume*/ ctx[0];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, []);
    	const dispatch = createEventDispatcher();
    	let { audio } = $$props;
    	let { volume = 1 } = $$props;

    	let { volumeDown = () => {
    		console.log('down');
    		$$invalidate(2, paused = true);
    	} } = $$props;

    	let { volumeUp = () => {
    		console.log('up');
    		$$invalidate(0, volume = 1);
    	} } = $$props;

    	let paused = true;
    	let currentTime = 0;

    	let onClick = () => {
    		if (!paused) {
    			$$invalidate(2, paused = true);
    			dispatch('volumeup');
    		} else {
    			$$invalidate(2, paused = false);

    			if (audio.reset) {
    				dispatch('volumedown');
    				$$invalidate(3, currentTime = 0);
    			}
    		}
    	};

    	let finished = () => {
    		$$invalidate(2, paused = true);
    		$$invalidate(3, currentTime = 0);
    		dispatch('volumeup');
    	};

    	const writable_props = ['audio', 'volume', 'volumeDown', 'volumeUp'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function audio_1_play_pause_handler() {
    		paused = this.paused;
    		$$invalidate(2, paused);
    	}

    	function audio_1_timeupdate_handler() {
    		currentTime = this.currentTime;
    		$$invalidate(3, currentTime);
    	}

    	function audio_1_volumechange_handler() {
    		volume = this.volume;
    		$$invalidate(0, volume);
    	}

    	$$self.$$set = $$props => {
    		if ('audio' in $$props) $$invalidate(1, audio = $$props.audio);
    		if ('volume' in $$props) $$invalidate(0, volume = $$props.volume);
    		if ('volumeDown' in $$props) $$invalidate(6, volumeDown = $$props.volumeDown);
    		if ('volumeUp' in $$props) $$invalidate(7, volumeUp = $$props.volumeUp);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		audio,
    		volume,
    		volumeDown,
    		volumeUp,
    		paused,
    		currentTime,
    		onClick,
    		finished
    	});

    	$$self.$inject_state = $$props => {
    		if ('audio' in $$props) $$invalidate(1, audio = $$props.audio);
    		if ('volume' in $$props) $$invalidate(0, volume = $$props.volume);
    		if ('volumeDown' in $$props) $$invalidate(6, volumeDown = $$props.volumeDown);
    		if ('volumeUp' in $$props) $$invalidate(7, volumeUp = $$props.volumeUp);
    		if ('paused' in $$props) $$invalidate(2, paused = $$props.paused);
    		if ('currentTime' in $$props) $$invalidate(3, currentTime = $$props.currentTime);
    		if ('onClick' in $$props) $$invalidate(4, onClick = $$props.onClick);
    		if ('finished' in $$props) $$invalidate(5, finished = $$props.finished);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		volume,
    		audio,
    		paused,
    		currentTime,
    		onClick,
    		finished,
    		volumeDown,
    		volumeUp,
    		audio_1_play_pause_handler,
    		audio_1_timeupdate_handler,
    		audio_1_volumechange_handler
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			audio: 1,
    			volume: 0,
    			volumeDown: 6,
    			volumeUp: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*audio*/ ctx[1] === undefined && !('audio' in props)) {
    			console_1.warn("<Button> was created without expected prop 'audio'");
    		}
    	}

    	get audio() {
    		return this.$$.ctx[1];
    	}

    	set audio(audio) {
    		this.$$set({ audio });
    		flush();
    	}

    	get volume() {
    		return this.$$.ctx[0];
    	}

    	set volume(volume) {
    		this.$$set({ volume });
    		flush();
    	}

    	get volumeDown() {
    		return this.$$.ctx[6];
    	}

    	set volumeDown(volumeDown) {
    		this.$$set({ volumeDown });
    		flush();
    	}

    	get volumeUp() {
    		return this.$$.ctx[7];
    	}

    	set volumeUp(volumeUp) {
    		this.$$set({ volumeUp });
    		flush();
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.1 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (44:12) {#each audios.slice(1) as audio}
    function create_each_block(ctx) {
    	let button;
    	let current;

    	button = new Button({
    			props: { audio: /*audio*/ ctx[7] },
    			$$inline: true
    		});

    	button.$on("volumedown", /*volumedown_handler*/ ctx[4]);
    	button.$on("volumeup", /*volumeup_handler*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(44:12) {#each audios.slice(1) as audio}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div3;
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let button0;
    	let t2;
    	let t3;
    	let div2;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;
    	let button0_props = { audio: /*audios*/ ctx[1][0] };
    	button0 = new Button({ props: button0_props, $$inline: true });
    	/*button0_binding*/ ctx[3](button0);
    	let each_value = /*audios*/ ctx[1].slice(1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Música Luch";
    			t1 = space();
    			create_component(button0.$$.fragment);
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div2 = element("div");
    			button1 = element("button");
    			button1.textContent = "Recargar";
    			attr_dev(h1, "class", "svelte-4kna5d");
    			add_location(h1, file, 40, 16, 862);
    			attr_dev(div0, "class", "col-12 title svelte-4kna5d");
    			add_location(div0, file, 39, 12, 819);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file, 38, 8, 789);
    			attr_dev(button1, "class", "svelte-4kna5d");
    			add_location(button1, file, 48, 12, 1197);
    			attr_dev(div2, "class", "col-12 reload svelte-4kna5d");
    			add_location(div2, file, 47, 8, 1157);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file, 37, 4, 757);
    			attr_dev(main, "class", "svelte-4kna5d");
    			add_location(main, file, 36, 0, 746);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div1, t1);
    			mount_component(button0, div1, null);
    			append_dev(div1, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, button1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button1, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const button0_changes = {};
    			button0.$set(button0_changes);

    			if (dirty & /*audios, bg*/ 3) {
    				each_value = /*audios*/ ctx[1].slice(1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
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
    			transition_in(button0.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*button0_binding*/ ctx[3](null);
    			destroy_component(button0);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;

    	let audios = [
    		{
    			name: 'Musica de fondo',
    			reset: false,
    			loop: true,
    			from: 0,
    			to: null,
    			src: 'bg.mp3',
    			color: '#dba7ef'
    		},
    		{
    			name: 'Payaso plin plin',
    			reset: true,
    			loop: false,
    			from: 0,
    			to: null,
    			src: 'payaso.mp3',
    			color: '#cd6f6f'
    		},
    		{
    			name: 'Disco rayado',
    			reset: true,
    			loop: false,
    			from: 0,
    			to: null,
    			src: 'disco.mp3',
    			color: '#90cb8a'
    		}
    	];

    	let bg;
    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function button0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			bg = $$value;
    			$$invalidate(0, bg);
    		});
    	}

    	const volumedown_handler = () => {
    		bg.volumeDown();
    	};

    	const volumeup_handler = () => {
    		bg.volumeUp();
    	};

    	const click_handler = () => {
    		location.reload(true);
    	};

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ Button, name, audios, bg });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('audios' in $$props) $$invalidate(1, audios = $$props.audios);
    		if ('bg' in $$props) $$invalidate(0, bg = $$props.bg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		bg,
    		audios,
    		name,
    		button0_binding,
    		volumedown_handler,
    		volumeup_handler,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[2] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Ramiro'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
