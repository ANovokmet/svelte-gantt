<div align="center">
    <a href="https://anovokmet.github.io/svelte-gantt" target="_blank">
        <img src="./packages/docs-mdsvex/static/favicon.svg" width="150"/>
    </a>
</div>

<h1 align="center">
    svelte-gantt
</h1>

<br/>
<p align="center">
    <a href="https://anovokmet.github.io/svelte-gantt">Website</a>
    ·
    <a href="https://anovokmet.github.io/svelte-gantt/docs">Quickstart</a>
    ·
    <a href="https://anovokmet.github.io/svelte-gantt/docs">Documentation</a>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/svelte-gantt">
        <img src="https://img.shields.io/npm/v/svelte-gantt" alt="npm">
    </a>
    <a href="https://www.npmjs.com/package/svelte-gantt">
        <img src="https://img.shields.io/npm/dm/svelte-gantt" alt="npm downloads">
    </a>
    <a href="https://github.com/ANovokmet/svelte-gantt/blob/main/LICENSE.txt">
        <img src="https://img.shields.io/github/license/ANovokmet/svelte-gantt" alt="MIT">
    </a>
<p>

A **lightweight** and **fast** interactive gantt chart/resource booking component made with [Svelte](https://svelte.technology/). Compatible with any JS library or framework. ZERO dependencies.

![svelte-gantt](https://i.imgur.com/IqT5PL4.png)

# Features

- High performance - display large datasets
- Interactive - drag and drop elements
- Tree view
- Zoom in/out
- Dependencies
- Date ranges
- ...

# Getting started

```
npm install svelte-gantt
```

Import the component:

```js
import { SvelteGantt } from 'svelte-gantt';
```

or use the IIFE build:

```html
<script src="node_modules/svelte-gantt/index.iife.js"></script>
```

Initialize svelte-gantt:

```js
var options = {
    /* ... */
};

var gantt = new SvelteGantt({
    // target a DOM element
    target: document.getElementById('example-gantt'),
    // svelte-gantt options
    props: options
});
```

# Need help?

I am happy to help you. [Post an issue](https://github.com/ANovokmet/svelte-gantt/issues) or [contact me](https://github.com/ANovokmet).
