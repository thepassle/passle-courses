import * as adapter from '@astrojs/netlify/netlify-functions.js';
import shorthash from 'shorthash';
import serializeJavaScript from 'serialize-javascript';
import { parse } from 'lightcookie';
import jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
import mongoose__default from 'mongoose';
import { v4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import _renderer0 from 'custom-elements-ssr/server.js';

/**
 * Copyright (C) 2017-present by Andrea Giammarchi - @WebReflection
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

const {replace} = '';
const ca = /[&<>'"]/g;

const esca = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
};
const pe = m => esca[m];

/**
 * Safely escape HTML entities such as `&`, `<`, `>`, `"`, and `'`.
 * @param {string} es the input to safely escape
 * @returns {string} the escaped input, and it **throws** an error if
 *  the input type is unexpected, except for boolean and numbers,
 *  converted as string.
 */
const escape = es => replace.call(es, ca, pe);

const escapeHTML = escape;
class HTMLString extends String {
}
const markHTMLString = (value) => {
  if (value instanceof HTMLString) {
    return value;
  }
  if (typeof value === "string") {
    return new HTMLString(value);
  }
  return value;
};

function serializeListValue(value) {
  const hash = {};
  push(value);
  return Object.keys(hash).join(" ");
  function push(item) {
    if (item && typeof item.forEach === "function")
      item.forEach(push);
    else if (item === Object(item))
      Object.keys(item).forEach((name) => {
        if (item[name])
          push(name);
      });
    else {
      item = item == null ? "" : String(item).trim();
      if (item) {
        item.split(/\s+/).forEach((name) => {
          hash[name] = true;
        });
      }
    }
  }
}
function hydrationSpecifier(hydrate) {
  return `astro/client/${hydrate}.js`;
}

function serializeProps(value) {
  return serializeJavaScript(value);
}
const HydrationDirectives = ["load", "idle", "media", "visible", "only"];
function extractDirectives(inputProps) {
  let extracted = {
    hydration: null,
    props: {}
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith("client:")) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: "",
          value: "",
          componentUrl: "",
          componentExport: { value: "" }
        };
      }
      switch (key) {
        case "client:component-path": {
          extracted.hydration.componentUrl = value;
          break;
        }
        case "client:component-export": {
          extracted.hydration.componentExport.value = value;
          break;
        }
        case "client:component-hydration": {
          break;
        }
        default: {
          extracted.hydration.directive = key.split(":")[1];
          extracted.hydration.value = value;
          if (HydrationDirectives.indexOf(extracted.hydration.directive) < 0) {
            throw new Error(`Error: invalid hydration directive "${key}". Supported hydration methods: ${HydrationDirectives.map((d) => `"client:${d}"`).join(", ")}`);
          }
          if (extracted.hydration.directive === "media" && typeof extracted.hydration.value !== "string") {
            throw new Error('Error: Media query must be provided for "client:media", similar to client:media="(max-width: 600px)"');
          }
          break;
        }
      }
    } else if (key === "class:list") {
      extracted.props[key.slice(0, -5)] = serializeListValue(value);
    } else {
      extracted.props[key] = value;
    }
  }
  return extracted;
}
async function generateHydrateScript(scriptOptions, metadata) {
  const { renderer, result, astroId, props } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;
  if (!componentExport) {
    throw new Error(`Unable to resolve a componentExport for "${metadata.displayName}"! Please open an issue.`);
  }
  let hydrationSource = ``;
  hydrationSource += renderer.clientEntrypoint ? `const [{ ${componentExport.value}: Component }, { default: hydrate }] = await Promise.all([import("${await result.resolve(componentUrl)}"), import("${await result.resolve(renderer.clientEntrypoint)}")]);
  return (el, children) => hydrate(el)(Component, ${serializeProps(props)}, children);
` : `await import("${await result.resolve(componentUrl)}");
  return () => {};
`;
  const hydrationScript = {
    props: { type: "module", "data-astro-component-hydration": true },
    children: `import setup from '${await result.resolve(hydrationSpecifier(hydrate))}';
${`import '${await result.resolve("astro:scripts/before-hydration.js")}';`}
setup("${astroId}", {name:"${metadata.displayName}",${metadata.hydrateArgs ? `value: ${JSON.stringify(metadata.hydrateArgs)}` : ""}}, async () => {
  ${hydrationSource}
});
`
  };
  return hydrationScript;
}

class Metadata {
  constructor(filePathname, opts) {
    this.modules = opts.modules;
    this.hoisted = opts.hoisted;
    this.hydratedComponents = opts.hydratedComponents;
    this.clientOnlyComponents = opts.clientOnlyComponents;
    this.hydrationDirectives = opts.hydrationDirectives;
    this.mockURL = new URL(filePathname, "http://example.com");
    this.metadataCache = /* @__PURE__ */ new Map();
  }
  resolvePath(specifier) {
    return specifier.startsWith(".") ? new URL(specifier, this.mockURL).pathname : specifier;
  }
  getPath(Component) {
    const metadata = this.getComponentMetadata(Component);
    return (metadata == null ? void 0 : metadata.componentUrl) || null;
  }
  getExport(Component) {
    const metadata = this.getComponentMetadata(Component);
    return (metadata == null ? void 0 : metadata.componentExport) || null;
  }
  *hydratedComponentPaths() {
    const found = /* @__PURE__ */ new Set();
    for (const metadata of this.deepMetadata()) {
      for (const component of metadata.hydratedComponents) {
        const path = metadata.getPath(component);
        if (path && !found.has(path)) {
          found.add(path);
          yield path;
        }
      }
    }
  }
  *clientOnlyComponentPaths() {
    const found = /* @__PURE__ */ new Set();
    for (const metadata of this.deepMetadata()) {
      for (const component of metadata.clientOnlyComponents) {
        const path = metadata.resolvePath(component);
        if (path && !found.has(path)) {
          found.add(path);
          yield path;
        }
      }
    }
  }
  *hydrationDirectiveSpecifiers() {
    const found = /* @__PURE__ */ new Set();
    for (const metadata of this.deepMetadata()) {
      for (const directive of metadata.hydrationDirectives) {
        if (!found.has(directive)) {
          found.add(directive);
          yield hydrationSpecifier(directive);
        }
      }
    }
  }
  *hoistedScriptPaths() {
    for (const metadata of this.deepMetadata()) {
      let i = 0, pathname = metadata.mockURL.pathname;
      while (i < metadata.hoisted.length) {
        yield `${pathname}?astro&type=script&index=${i}`;
        i++;
      }
    }
  }
  *deepMetadata() {
    yield this;
    const seen = /* @__PURE__ */ new Set();
    for (const { module: mod } of this.modules) {
      if (typeof mod.$$metadata !== "undefined") {
        const md = mod.$$metadata;
        for (const childMetdata of md.deepMetadata()) {
          if (!seen.has(childMetdata)) {
            seen.add(childMetdata);
            yield childMetdata;
          }
        }
      }
    }
  }
  getComponentMetadata(Component) {
    if (this.metadataCache.has(Component)) {
      return this.metadataCache.get(Component);
    }
    const metadata = this.findComponentMetadata(Component);
    this.metadataCache.set(Component, metadata);
    return metadata;
  }
  findComponentMetadata(Component) {
    const isCustomElement = typeof Component === "string";
    for (const { module, specifier } of this.modules) {
      const id = this.resolvePath(specifier);
      for (const [key, value] of Object.entries(module)) {
        if (isCustomElement) {
          if (key === "tagName" && Component === value) {
            return {
              componentExport: key,
              componentUrl: id
            };
          }
        } else if (Component === value) {
          return {
            componentExport: key,
            componentUrl: id
          };
        }
      }
    }
    return null;
  }
}
function createMetadata(filePathname, options) {
  return new Metadata(filePathname, options);
}

var __defProp$6 = Object.defineProperty;
var __defProps$1 = Object.defineProperties;
var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$1 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$1.call(b, prop))
      __defNormalProp$1(a, prop, b[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b)) {
      if (__propIsEnum$1.call(b, prop))
        __defNormalProp$1(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$1.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$1.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const voidElementNames = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes = /^(allowfullscreen|async|autofocus|autoplay|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|loop|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|itemscope)$/i;
const htmlEnumAttributes = /^(contenteditable|draggable|spellcheck|value)$/i;
const svgEnumAttributes = /^(autoReverse|externalResourcesRequired|focusable|preserveAlpha)$/i;
async function _render(child) {
  child = await child;
  if (child instanceof HTMLString) {
    return child;
  } else if (Array.isArray(child)) {
    return markHTMLString((await Promise.all(child.map((value) => _render(value)))).join(""));
  } else if (typeof child === "function") {
    return _render(child());
  } else if (typeof child === "string") {
    return markHTMLString(escapeHTML(child));
  } else if (!child && child !== 0) ; else if (child instanceof AstroComponent || Object.prototype.toString.call(child) === "[object AstroComponent]") {
    return markHTMLString(await renderAstroComponent(child));
  } else {
    return child;
  }
}
class AstroComponent {
  constructor(htmlParts, expressions) {
    this.htmlParts = htmlParts;
    this.expressions = expressions;
  }
  get [Symbol.toStringTag]() {
    return "AstroComponent";
  }
  *[Symbol.iterator]() {
    const { htmlParts, expressions } = this;
    for (let i = 0; i < htmlParts.length; i++) {
      const html = htmlParts[i];
      const expression = expressions[i];
      yield markHTMLString(html);
      yield _render(expression);
    }
  }
}
function isAstroComponent(obj) {
  return typeof obj === "object" && Object.prototype.toString.call(obj) === "[object AstroComponent]";
}
async function render(htmlParts, ...expressions) {
  return new AstroComponent(htmlParts, expressions);
}
function createComponent(cb) {
  cb.isAstroComponentFactory = true;
  return cb;
}
async function renderSlot(_result, slotted, fallback) {
  if (slotted) {
    return await _render(slotted);
  }
  return fallback;
}
const Fragment = Symbol("Astro.Fragment");
function guessRenderers(componentUrl) {
  const extname = componentUrl == null ? void 0 : componentUrl.split(".").pop();
  switch (extname) {
    case "svelte":
      return ["@astrojs/svelte"];
    case "vue":
      return ["@astrojs/vue"];
    case "jsx":
    case "tsx":
      return ["@astrojs/react", "@astrojs/preact"];
    default:
      return ["@astrojs/react", "@astrojs/preact", "@astrojs/vue", "@astrojs/svelte"];
  }
}
function formatList(values) {
  if (values.length === 1) {
    return values[0];
  }
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}
async function renderComponent(result, displayName, Component, _props, slots = {}) {
  var _a;
  Component = await Component;
  if (Component === Fragment) {
    const children2 = await renderSlot(result, slots == null ? void 0 : slots.default);
    if (children2 == null) {
      return children2;
    }
    return markHTMLString(children2);
  }
  if (Component && Component.isAstroComponentFactory) {
    const output = await renderToString(result, Component, _props, slots);
    return markHTMLString(output);
  }
  if (Component === null && !_props["client:only"]) {
    throw new Error(`Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`);
  }
  const { renderers } = result._metadata;
  const metadata = { displayName };
  const { hydration, props } = extractDirectives(_props);
  let html = "";
  if (hydration) {
    metadata.hydrate = hydration.directive;
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }
  const probableRendererNames = guessRenderers(metadata.componentUrl);
  if (Array.isArray(renderers) && renderers.length === 0 && typeof Component !== "string" && !componentIsHTMLElement(Component)) {
    const message = `Unable to render ${metadata.displayName}!

There are no \`integrations\` set in your \`astro.config.mjs\` file.
Did you mean to add ${formatList(probableRendererNames.map((r) => "`" + r + "`"))}?`;
    throw new Error(message);
  }
  const children = await renderSlot(result, slots == null ? void 0 : slots.default);
  let renderer;
  if (metadata.hydrate !== "only") {
    for (const r of renderers) {
      if (await r.ssr.check(Component, props, children)) {
        renderer = r;
        break;
      }
    }
    if (!renderer && typeof HTMLElement === "function" && componentIsHTMLElement(Component)) {
      const output = renderHTMLElement(result, Component, _props, slots);
      return output;
    }
  } else {
    if (metadata.hydrateArgs) {
      const rendererName = metadata.hydrateArgs;
      renderer = renderers.filter(({ name }) => name === `@astrojs/${rendererName}` || name === rendererName)[0];
    }
    if (!renderer && renderers.length === 1) {
      renderer = renderers[0];
    }
    if (!renderer) {
      const extname = (_a = metadata.componentUrl) == null ? void 0 : _a.split(".").pop();
      renderer = renderers.filter(({ name }) => name === `@astrojs/${extname}` || name === extname)[0];
    }
  }
  if (!renderer) {
    if (metadata.hydrate === "only") {
      throw new Error(`Unable to render ${metadata.displayName}!

Using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.
Did you mean to pass <${metadata.displayName} client:only="${probableRendererNames.map((r) => r.replace("@astrojs/", "")).join("|")}" />
`);
    } else if (typeof Component !== "string") {
      const matchingRenderers = renderers.filter((r) => probableRendererNames.includes(r.name));
      const plural = renderers.length > 1;
      if (matchingRenderers.length === 0) {
        throw new Error(`Unable to render ${metadata.displayName}!

There ${plural ? "are" : "is"} ${renderers.length} renderer${plural ? "s" : ""} configured in your \`astro.config.mjs\` file,
but ${plural ? "none were" : "it was not"} able to server-side render ${metadata.displayName}.

Did you mean to enable ${formatList(probableRendererNames.map((r) => "`" + r + "`"))}?`);
      } else if (matchingRenderers.length === 1) {
        renderer = matchingRenderers[0];
        ({ html } = await renderer.ssr.renderToStaticMarkup(Component, props, children, metadata));
      } else {
        throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
      }
    }
  } else {
    if (metadata.hydrate === "only") {
      html = await renderSlot(result, slots == null ? void 0 : slots.fallback);
    } else {
      ({ html } = await renderer.ssr.renderToStaticMarkup(Component, props, children, metadata));
    }
  }
  if (!html && typeof Component === "string") {
    html = await renderAstroComponent(await render`<${Component}${spreadAttributes(props)}${markHTMLString((children == null || children == "") && voidElementNames.test(Component) ? `/>` : `>${children == null ? "" : children}</${Component}>`)}`);
  }
  if (!hydration) {
    return markHTMLString(html.replace(/\<\/?astro-fragment\>/g, ""));
  }
  const astroId = shorthash.unique(`<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(props)}`);
  result.scripts.add(await generateHydrateScript({ renderer, result, astroId, props }, metadata));
  const needsAstroTemplate = children && !/<\/?astro-fragment\>/.test(html);
  const template = needsAstroTemplate ? `<template data-astro-template>${children}</template>` : "";
  return markHTMLString(`<astro-root uid="${astroId}"${needsAstroTemplate ? " tmpl" : ""}>${html ?? ""}${template}</astro-root>`);
}
function createDeprecatedFetchContentFn() {
  return () => {
    throw new Error("Deprecated: Astro.fetchContent() has been replaced with Astro.glob().");
  };
}
function createAstroGlobFn() {
  const globHandler = (importMetaGlobResult, globValue) => {
    let allEntries = [...Object.values(importMetaGlobResult)];
    if (allEntries.length === 0) {
      throw new Error(`Astro.glob(${JSON.stringify(globValue())}) - no matches found.`);
    }
    return Promise.all(allEntries.map((fn) => fn()));
  };
  return globHandler;
}
function createAstro(filePathname, _site, projectRootStr) {
  const site = new URL(_site);
  const url = new URL(filePathname, site);
  const projectRoot = new URL(projectRootStr);
  return {
    site,
    fetchContent: createDeprecatedFetchContentFn(),
    glob: createAstroGlobFn(),
    resolve(...segments) {
      let resolved = segments.reduce((u, segment) => new URL(segment, u), url).pathname;
      if (resolved.startsWith(projectRoot.pathname)) {
        resolved = "/" + resolved.substr(projectRoot.pathname.length);
      }
      return resolved;
    }
  };
}
const toAttributeString = (value, shouldEscape = true) => shouldEscape ? String(value).replace(/&/g, "&#38;").replace(/"/g, "&#34;") : value;
const STATIC_DIRECTIVES = /* @__PURE__ */ new Set(["set:html", "set:text"]);
function addAttribute(value, key, shouldEscape = true) {
  if (value == null) {
    return "";
  }
  if (value === false) {
    if (htmlEnumAttributes.test(key) || svgEnumAttributes.test(key)) {
      return markHTMLString(` ${key}="false"`);
    }
    return "";
  }
  if (STATIC_DIRECTIVES.has(key)) {
    console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
    return "";
  }
  if (key === "class:list") {
    return markHTMLString(` ${key.slice(0, -5)}="${toAttributeString(serializeListValue(value))}"`);
  }
  if (value === true && (key.startsWith("data-") || htmlBooleanAttributes.test(key))) {
    return markHTMLString(` ${key}`);
  } else {
    return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
  }
}
function spreadAttributes(values, shouldEscape = true) {
  let output = "";
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, shouldEscape);
  }
  return markHTMLString(output);
}
function defineStyleVars(selector, vars) {
  let output = "\n";
  for (const [key, value] of Object.entries(vars)) {
    output += `  --${key}: ${value};
`;
  }
  return markHTMLString(`${selector} {${output}}`);
}
function defineScriptVars(vars) {
  let output = "";
  for (const [key, value] of Object.entries(vars)) {
    output += `let ${key} = ${JSON.stringify(value)};
`;
  }
  return markHTMLString(output);
}
async function replaceHeadInjection(result, html) {
  let template = html;
  if (template.indexOf("<!--astro:head-->") > -1) {
    template = template.replace("<!--astro:head-->", await renderHead(result));
  }
  return template;
}
async function renderToString(result, componentFactory, props, children) {
  const Component = await componentFactory(result, props, children);
  if (!isAstroComponent(Component)) {
    const response = Component;
    throw response;
  }
  let template = await renderAstroComponent(Component);
  return replaceHeadInjection(result, template);
}
const uniqueElements = (item, index, all) => {
  const props = JSON.stringify(item.props);
  const children = item.children;
  return index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children);
};
async function renderHead(result) {
  const styles = Array.from(result.styles).filter(uniqueElements).map((style) => {
    const styleChildren = !result._metadata.legacyBuild ? "" : style.children;
    return renderElement("style", {
      children: styleChildren,
      props: __spreadProps$1(__spreadValues$1({}, style.props), { "astro-style": true })
    });
  });
  let needsHydrationStyles = false;
  const scripts = Array.from(result.scripts).filter(uniqueElements).map((script, i) => {
    if ("data-astro-component-hydration" in script.props) {
      needsHydrationStyles = true;
    }
    return renderElement("script", __spreadProps$1(__spreadValues$1({}, script), {
      props: __spreadProps$1(__spreadValues$1({}, script.props), { "astro-script": result._metadata.pathname + "/script-" + i })
    }));
  });
  if (needsHydrationStyles) {
    styles.push(renderElement("style", {
      props: { "astro-style": true },
      children: "astro-root, astro-fragment { display: contents; }"
    }));
  }
  const links = Array.from(result.links).filter(uniqueElements).map((link) => renderElement("link", link, false));
  return markHTMLString(links.join("\n") + styles.join("\n") + scripts.join("\n") + "\n<!--astro:head:injected-->");
}
async function renderAstroComponent(component) {
  let template = [];
  for await (const value of component) {
    if (value || value === 0) {
      template.push(value);
    }
  }
  return markHTMLString(await _render(template));
}
function componentIsHTMLElement(Component) {
  return typeof HTMLElement !== "undefined" && HTMLElement.isPrototypeOf(Component);
}
async function renderHTMLElement(result, constructor, props, slots) {
  const name = getHTMLElementName(constructor);
  let attrHTML = "";
  for (const attr in props) {
    attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
  }
  return markHTMLString(`<${name}${attrHTML}>${await renderSlot(result, slots == null ? void 0 : slots.default)}</${name}>`);
}
function getHTMLElementName(constructor) {
  const definedName = customElements.getName(constructor);
  if (definedName)
    return definedName;
  const assignedName = constructor.name.replace(/^HTML|Element$/g, "").replace(/[A-Z]/g, "-$&").toLowerCase().replace(/^-/, "html-");
  return assignedName;
}
function renderElement(name, { props: _props, children = "" }, shouldEscape = true) {
  const _a = _props, { lang: _, "data-astro-id": astroId, "define:vars": defineVars } = _a, props = __objRest(_a, ["lang", "data-astro-id", "define:vars"]);
  if (defineVars) {
    if (name === "style") {
      if (props["is:global"]) {
        children = defineStyleVars(`:root`, defineVars) + "\n" + children;
      } else {
        children = defineStyleVars(`.astro-${astroId}`, defineVars) + "\n" + children;
      }
      delete props["is:global"];
      delete props["is:scoped"];
    }
    if (name === "script") {
      delete props.hoist;
      children = defineScriptVars(defineVars) + "\n" + children;
    }
  }
  return `<${name}${spreadAttributes(props, shouldEscape)}>${children}</${name}>`;
}

var index_astro_astro_type_style_index_0_lang$1 = '';

const createToken = ({id, name, admin, email, active, picture}) => jwt.sign({id, name, admin, email, active, picture}, "oVZ55cxTVo", {expiresIn: '7d'});

async function isLoggedIn(req) {
	let authed = false;
	let user = {};
	const cookie = req.headers.get('cookie');

	if(cookie) {
    const parsed = parse(cookie);
    if(parsed.jwt) {
      jwt.verify(parsed.jwt, "oVZ55cxTVo", (e, decoded) => {
        if(!e && !!decoded) {
          user = {
            name: decoded.name,
            email: decoded.email,
            picture: decoded.picture,
            active: decoded.active,
            id: decoded.id,
            admin: decoded.admin
          };
          authed = true;
        }
      });
    }
	}

	return {
		authed,
		...user
	}
}

function sevenDaysFromNow() {
  const d = new Date();
  const time = 7 * 24 * 60 * 60 * 1000;
  d.setTime(d.getTime() + (time));
  return d.toUTCString();
}

function createHeaders({jwt, location}) {
  const expires = sevenDaysFromNow();
  const headers = new Headers();
  
  headers.append('Set-Cookie', `jwt=${jwt}; Expires=${expires}; Path=/; HttpOnly; Secure;`);
  headers.append('Location', location);
  
  return headers;
}

const Authorization = {'Authorization': `Bearer ${"test_qtgbbfxvyAqf6KhrkkT8BNtqWcfSVJ"}`};
const ContentType = {'Content-Type': 'application/json'};

var _page11 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  createToken: createToken,
  isLoggedIn: isLoggedIn,
  createHeaders: createHeaders,
  Authorization: Authorization,
  ContentType: ContentType
}, Symbol.toStringTag, { value: 'Module' }));

var Main_astro_astro_type_style_index_0_lang = '';

var Header_astro_astro_type_style_index_0_lang = '';

const $$metadata$j = createMetadata("/src/components/Header.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$j = createAstro("/src/components/Header.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Header = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$j, $$props, $$slots);
  Astro2.self = $$Header;
  const { user } = Astro2.props;
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render`
<header class="astro-Z4LKC6HD">
  <a class="passle astro-Z4LKC6HD" href="/">Passle Courses</a>
  ${user.authed ? render`<div class="authed astro-Z4LKC6HD">
        <a class="logout auth-link astro-Z4LKC6HD" href="/auth/logout">Logout</a>
        <a class="settings astro-Z4LKC6HD" href="/settings" aria-label="Settings"><img referrerpolicy="no-referrer" alt="" width="40" height="40"${addAttribute(user.picture, "src")} class="astro-Z4LKC6HD"></a>
      </div>` : render`<a class="logout auth-link astro-Z4LKC6HD" href="/auth/login">Login</a>`}
</header>`;
});

var $$module1$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$j,
  'default': $$Header
}, Symbol.toStringTag, { value: 'Module' }));

var Footer_astro_astro_type_style_index_0_lang = '';

var twitter = "/assets/asset.6ba87f98.svg";

var $$module1$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': twitter
}, Symbol.toStringTag, { value: 'Module' }));

var github = "/assets/asset.d2025cf9.svg";

var $$module2$4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': github
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$i = createMetadata("/src/components/Footer.astro", { modules: [{ module: $$module1$1, specifier: "../assets/twitter.svg", assert: {} }, { module: $$module2$4, specifier: "../assets/github.svg", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$i = createAstro("/src/components/Footer.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Footer = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$i, $$props, $$slots);
  Astro2.self = $$Footer;
  const { user = { authed: true } } = Astro2.props;
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render`
<footer class="astro-KBJGW2SY">
  
  <div class="footer-card astro-KBJGW2SY">
    <h2 class="astro-KBJGW2SY">Passle Courses</h2>
    <p class="astro-KBJGW2SY">🚀 Built with Astro SSR</p>
    <ul class="social-icon-links astro-KBJGW2SY">
      <li class="astro-KBJGW2SY">
        <a class="social-icon-link astro-KBJGW2SY" aria-label="twitter" href="https://twitter.com/passle_">
          <img${addAttribute(twitter, "src")} alt="" class="astro-KBJGW2SY">
        </a>
      </li>
      <li class="astro-KBJGW2SY">
        <a class="social-icon-link astro-KBJGW2SY" aria-label="github" href="https://www.github.com/thepassle/passle-courses">
          <img${addAttribute(github, "src")} alt="" class="astro-KBJGW2SY">
        </a>
      </li>
    </ul>
  </div>

  ${user.authed ? render`<a class="logout linkbutton-secondary outline astro-KBJGW2SY" href="/auth/logout">Sign out</a>` : ""}

  <nav class="astro-KBJGW2SY">
    <ul class="links astro-KBJGW2SY">
      <li class="astro-KBJGW2SY"><a target="_blank" href="https://twitter.com/passle_" class="astro-KBJGW2SY">Twitter</a></li>
      <li class="astro-KBJGW2SY"><a target="_blank" href="https://dev.to/thepassle/trying-out-astro-ssr-astro-10-hackaton-3h0g" class="astro-KBJGW2SY">Blog</a></li>
      <li class="astro-KBJGW2SY"><a href="mailto:pascalschilp@gmail.com" class="astro-KBJGW2SY">Contact</a></li>
    </ul>
    <p class="astro-KBJGW2SY">© 2022 Pascal Schilp</p>
  </nav>
</footer>`;
});

var $$module2$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$i,
  'default': $$Footer
}, Symbol.toStringTag, { value: 'Module' }));

var __freeze$4 = Object.freeze;
var __defProp$5 = Object.defineProperty;
var __template$4 = (cooked, raw) => __freeze$4(__defProp$5(cooked, "raw", { value: __freeze$4(raw || cooked.slice()) }));
var _a$4;
const $$metadata$h = createMetadata("/src/layouts/Main.astro", { modules: [{ module: $$module1$2, specifier: "../components/Header.astro", assert: {} }, { module: $$module2$3, specifier: "../components/Footer.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$h = createAstro("/src/layouts/Main.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Main = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$h, $$props, $$slots);
  Astro2.self = $$Main;
  const { title = "Passle Courses", user = { authed: false } } = Astro2.props;
  const prod = "prod" === "prod";
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render(_a$4 || (_a$4 = __template$4(['<html lang="en">\n	<head>\n		<meta charset="utf-8">\n    <meta name="google-site-verification" content="xha97nsr2kN1ULeHUIQ80B7P3Gz0jN9F8hkqcsL7Z0A">\n		<meta name="viewport" content="width=device-width">\n		<link rel="preconnect" href="https://fonts.googleapis.com">\n		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <script src="https://accounts.google.com/gsi/client" async defer><\/script>\n\n		<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;800" rel="stylesheet">\n		<title>', "</title>\n		\n	<!--astro:head--></head>\n	<body>\n		", "\n\n		<main>\n      ", "\n		</main>\n\n    ", "\n    <script>", "\n      if(prod && 'serviceWorker' in navigator) {\n        let refreshing = false;\n\n        navigator.serviceWorker.register('./sw.js')\n          .then(() => {\n            console.log('sw registered');\n          })\n          .catch(() => {\n            console.log('failed to register sw');\n          });\n\n        navigator.serviceWorker.addEventListener('controllerchange', () => {\n          if (refreshing) return;\n          window.location.reload();\n          refreshing = true;\n        });\n      };\n    <\/script>\n	</body>\n</html>"])), title, renderComponent($$result, "Header", $$Header, { "user": user }), renderSlot($$result, $$slots["default"]), renderComponent($$result, "Footer", $$Footer, { "user": user }), defineScriptVars({ prod }));
});

var $$module2$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$h,
  'default': $$Main
}, Symbol.toStringTag, { value: 'Module' }));

var instructor = "/assets/asset.5ce68a92.png";

var $$module3$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': instructor
}, Symbol.toStringTag, { value: 'Module' }));

var swcourse = "/assets/asset.82e99692.png";

var $$module4$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': swcourse
}, Symbol.toStringTag, { value: 'Module' }));

var wccourse = "/assets/asset.89c3d329.png";

var $$module5$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': wccourse
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$g = createMetadata("/src/pages/index.astro", { modules: [{ module: _page11, specifier: "./utils/auth.js", assert: {} }, { module: $$module2$2, specifier: "../layouts/Main.astro", assert: {} }, { module: $$module3$3, specifier: "../assets/instructor.png", assert: {} }, { module: $$module4$2, specifier: "../assets/swcourse.png", assert: {} }, { module: $$module5$2, specifier: "../assets/wccourse.png", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$g = createAstro("/src/pages/index.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Index$2 = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$g, $$props, $$slots);
  Astro2.self = $$Index$2;
  const user = await isLoggedIn(Astro2.request);
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render`
${renderComponent($$result, "Main", $$Main, { "user": user, "class": "astro-6NYF452Z" }, { "default": () => render`<div class="section courses astro-6NYF452Z">
		<h1 class="big-title astro-6NYF452Z">Courses</h1>
		<div class="course-cards astro-6NYF452Z">
			<div class="card-wrapper astro-6NYF452Z">
				<a class="course-link sw astro-6NYF452Z"${addAttribute(user?.active ? "/sw/chapter/0/lesson/0" : "/sw/subscribe", "href")}>
					<div class="course-card astro-6NYF452Z">
						<img${addAttribute(swcourse, "src")} alt="" class="astro-6NYF452Z">
					</div>
				</a>
				${user?.active ? render`<h2 class="astro-6NYF452Z">Start course</h2>` : render`<div class="astro-6NYF452Z">
							<h2 class="astro-6NYF452Z">The Mental Gymnastics<br class="astro-6NYF452Z">of Service Worker</h2>
							<p class="astro-6NYF452Z">Learn everything there is to know about Service Workers, and become a true master of offline first!</p>	
							<a class="try astro-6NYF452Z" href="/sw/chapter/0/lesson/0">Try it out for free!</a>
						</div>`}
			</div>
			<div class="card-wrapper astro-6NYF452Z">
				<div class="course-link wc astro-6NYF452Z" href="/sw/subscribe">
					<div class="course-card astro-6NYF452Z">
						<img${addAttribute(wccourse, "src")} alt="" class="astro-6NYF452Z">
					</div>
				</div>
				${user?.active ? render`<h2 class="astro-6NYF452Z">Not available yet</h2>` : render`<div class="astro-6NYF452Z">
							<h2 class="astro-6NYF452Z">Web Components:<br class="astro-6NYF452Z">From Zero to Hero</h2>
							<p class="astro-6NYF452Z">Learn everything about the browser's native component model, from standalone components, to applications!</p>
					</div>`}
			</div>
			
		</div>
	</div>${!user?.active ? render`<div class="astro-6NYF452Z">
				<div class="section testimonials astro-6NYF452Z">
					<h1 class="big-title astro-6NYF452Z">Testimonials</h1>
					<div class="testimonials-wrapper astro-6NYF452Z">
						<ul class="astro-6NYF452Z">
							<li class="astro-6NYF452Z">
								<p class="quote astro-6NYF452Z">"This course has literally changed my life."</p>
								<p class="author astro-6NYF452Z">— Barack Obama</p>
							</li>
							
							<li class="astro-6NYF452Z">
								<p class="quote astro-6NYF452Z">"What an amazing course."</p>
								<p class="author astro-6NYF452Z">— Arnold Schwarzenegger</p>
							</li>

							<li class="astro-6NYF452Z">
								<p class="quote astro-6NYF452Z">"This is the best course I've ever seen."</p>
								<p class="author astro-6NYF452Z">— Ludwig Ahgren</p>
							</li>
						</ul>
					</div>
				</div>

				<div class="section instructor astro-6NYF452Z">
					<h1 class="big-title astro-6NYF452Z">The instructor</h1>
					<div class="instructor-wrapper astro-6NYF452Z">
						<div class="instructor-image astro-6NYF452Z">
							<img${addAttribute(instructor, "src")} alt="Picture of the instructor, Pascal Schilp" class="astro-6NYF452Z">
						</div>
						<div class="instructor-info astro-6NYF452Z">
							<h2 class="astro-6NYF452Z">Pascal Schilp</h2>
							<p class="astro-6NYF452Z">It me. Ya boi. Pascal Schilp is a software developer based in the Netherlands, who currently works for ING.</p>
							<p class="astro-6NYF452Z">In his free time, he enjoys hacking on hobby projects, playing phasmaphobia or PUBG and spending time with his partner.</p>
						</div>
					</div>
				</div>
			</div>` : ""}` })}
`;
});

var _page0 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$g,
  'default': $$Index$2
}, Symbol.toStringTag, { value: 'Module' }));

var settings_astro_astro_type_style_index_0_lang = '';

const userSchema = new mongoose__default.Schema({
  id: {
    type: String,
    unique: true
  },
  admin: {
    type: Boolean
  },
  username: {
    type: String,
  },
  subscriptionActive: {
    type: Boolean,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
  },
  mollieId: {
    type: String
  },
  subscriptionId: {
    type: String
  },
  picture: {
    type: String
  }
});

userSchema.statics.findOneOrCreate = async function findOneOrCreate(condition, doc) {
  let one;
  try {
    one = await this.findOne(condition);
  } catch {

  }

  return one || this.create(doc);
};

let User;
try {
  User = mongoose__default.model('user');
} catch {
  User = mongoose__default.model('user', userSchema);
}

var _page16 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get User () { return User; }
}, Symbol.toStringTag, { value: 'Module' }));

var CanvasBg_astro_astro_type_style_index_0_lang = '';

const $$metadata$f = createMetadata("/src/layouts/CanvasBg.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$f = createAstro("/src/layouts/CanvasBg.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$CanvasBg = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$f, $$props, $$slots);
  Astro2.self = $$CanvasBg;
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render`
<div class="canvas-bg astro-4Z7W2JCY">
	<div class="canvas-container astro-4Z7W2JCY">
		${renderSlot($$result, $$slots["default"])}
	</div>
</div>`;
});

var $$module3$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$f,
  'default': $$CanvasBg
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$e = createMetadata("/src/pages/settings.astro", { modules: [{ module: mongoose, specifier: "mongoose", assert: {} }, { module: _page11, specifier: "./utils/auth.js", assert: {} }, { module: _page16, specifier: "./db/User.js", assert: {} }, { module: $$module2$2, specifier: "../layouts/Main.astro", assert: {} }, { module: $$module3$2, specifier: "../layouts/CanvasBg.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$e = createAstro("/src/pages/settings.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Settings = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$e, $$props, $$slots);
  Astro2.self = $$Settings;
  const user = await isLoggedIn(Astro2.request);
  if (!user.authed) {
    return Astro2.redirect("/");
  }
  let subscription;
  if (!!user?.active) {
    try {
      await mongoose__default.connect("mongodb://uqn1avha6p85dp24dwgt:lREgtE1JLoFuNt3qcOsr@ble51fmrod0cif1-mongodb.services.clever-cloud.com:27017/ble51fmrod0cif1");
    } catch {
    }
    const mongoUser = await User.findOne({ id: user.id });
    subscription = await fetch(`https://api.mollie.com/v2/customers/${mongoUser.mollieId}/subscriptions/${mongoUser.subscriptionId}`, { headers: { ...Authorization } }).then((r) => r.json());
  }
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render`

${renderComponent($$result, "Main", $$Main, { "title": "Settings", "user": user, "class": "astro-XOSSXTZI" }, { "default": () => render`${renderComponent($$result, "CanvasBg", $$CanvasBg, { "class": "astro-XOSSXTZI" }, { "default": () => render`<h1 class="astro-XOSSXTZI">Details</h1><div class="card astro-XOSSXTZI">
			<dl class="astro-XOSSXTZI">
				<div class="row astro-XOSSXTZI">
					<dt class="astro-XOSSXTZI">Name</dt>
					<dd class="astro-XOSSXTZI">${user.name}</dd>
				</div>
				<div class="row astro-XOSSXTZI">
					<dt class="astro-XOSSXTZI">Email</dt>
					<dd class="astro-XOSSXTZI">${user.email}</dd>
				</div>
			</dl>
		</div><h1 class="astro-XOSSXTZI">Subscriptions</h1><div class="card astro-XOSSXTZI">
			${user.active ? render`<div class="astro-XOSSXTZI">
						<h2 class="astro-XOSSXTZI">Mental Gymnastics of Service Worker</h2>


						<div class="row astro-XOSSXTZI">
							<dt class="astro-XOSSXTZI">status</dt>
							<dd class="astro-XOSSXTZI"><span${addAttribute(`${subscription?.status} status astro-XOSSXTZI`, "class")}>${subscription?.status}</span></dd>
						</div>
						<div class="row astro-XOSSXTZI">
							<dt class="astro-XOSSXTZI">createdAt</dt>
							<dd class="astro-XOSSXTZI">${new Date(subscription?.createdAt).toUTCString()}</dd>
						</div>
						<div class="row astro-XOSSXTZI">
							<dt class="astro-XOSSXTZI">startDate</dt>
							<dd class="astro-XOSSXTZI">${new Date(subscription?.startDate).toUTCString()}</dd>
						</div>
						<div class="row astro-XOSSXTZI">
							<dt class="astro-XOSSXTZI">nextPaymentDate</dt>
							<dd class="astro-XOSSXTZI">${new Date(subscription?.nextPaymentDate).toUTCString()}</dd>
						</div>
						<div class="row astro-XOSSXTZI">
							<dt class="astro-XOSSXTZI">description</dt>
							<dd class="astro-XOSSXTZI">${subscription?.description}</dd>
						</div>
						<div class="row astro-XOSSXTZI">
							<dt class="astro-XOSSXTZI">amount</dt>
							<dd class="astro-XOSSXTZI">${subscription?.amount?.currency} ${subscription?.amount?.value}</dd>
						</div>
						
						<br class="astro-XOSSXTZI">

						<p class="astro-XOSSXTZI">You are subscribed. Would you like to cancel?</p>
						<a class="linkbutton-secondary outline astro-XOSSXTZI" href="/mollie/cancel-subscription">Cancel</a>
					</div>` : render`<div class="astro-XOSSXTZI">
					<p class="not-subscribed astro-XOSSXTZI">You are not subscribed.</p>
					<p class="astro-XOSSXTZI">Would you like to subscribe?</p>
					<a class="linkbutton-secondary outline astro-XOSSXTZI" href="/sw/subscribe#register">Subscribe</a>
				</div>`}
		</div><a class="linkbutton-main astro-XOSSXTZI" href="/auth/logout">Sign out</a>${!!user?.admin && render`<a class="admin linkbutton-secondary outline astro-XOSSXTZI" href="/admin/">Admin</a>`}` })}` })}
`;
});

var _page1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$e,
  'default': $$Settings
}, Symbol.toStringTag, { value: 'Module' }));

async function get$3(_, req) {
  const user = await isLoggedIn(req);

  try {
    await mongoose__default.connect("mongodb://uqn1avha6p85dp24dwgt:lREgtE1JLoFuNt3qcOsr@ble51fmrod0cif1-mongodb.services.clever-cloud.com:27017/ble51fmrod0cif1");
  } catch {
    return new Response(null, {status: 302, headers: {'Location': '/error?code=DB_CON'}});
  }
  
  let mongoUser;
  try {
    mongoUser = await User.findOne({id: user.id});
  } catch {
    return new Response(null, {status: 302, headers: {'Location': '/error?code=FAILED_TO_FIND_USER'}});
  }
  

  if(mongoUser) {
    const cancelRequest = await fetch(`https://api.mollie.com/v2/customers/${mongoUser.mollieId}/subscriptions/${mongoUser.subscriptionId}`,
      {
        method: 'DELETE',
        headers: { ...Authorization },
      });
    
    if(cancelRequest.ok) {
      try {
        mongoUser.subscriptionActive = false;
        mongoUser.subscriptionId = '';
        await mongoUser.save();
        
        
        /** We have to update the jwt now */
        const jwt = createToken({
          name: mongoUser.username,
          email: mongoUser.email,
          picture: mongoUser.picture,
          id: mongoUser.id,
          admin: mongoUser.admin,
          active: false
        });


        const headers = createHeaders({jwt, location: '/mollie/cb?code=CANCEL_OK'});

        return new Response(null, {status: 302, headers});
      } catch(e) {
        return new Response(null, {status: 302, headers: {'Location': '/error?code=CANCEL_DB_USER_SAVE_FAILED'}});
      }
    } else {
      return new Response(null, {status: 302, headers: {'Location': '/error?code=CANCEL_FAILED'}});
    }
  } else {
    return new Response(null, {status: 302, headers: {'Location': '/error?code=NO_DB_USER_FOUND'}});
  }
}

var _page2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get: get$3
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$d = createMetadata("/src/pages/mollie/webhook-test.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [{ type: "inline", value: `
      function post(opts) {
        fetch('/mollie/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: 'id=tr_rU2tQ5GcTB'
        });
      }

      paidFirst.addEventListener('click', () => {
        post({
          status: 'paid',
          sequenceType: 'first'
        });
      });
      canceledFirst.addEventListener('click', () => {
        post({
          status: 'canceled',
          sequenceType: 'first'
        });     
     });
      failedFirst.addEventListener('click', () => {
        post({
          status: 'failed',
          sequenceType: 'first'
        });
      });


      paidRec.addEventListener('click', () => {
        post({
          status: 'paid',
          sequenceType: 'recurring'
        });
      });
      canceledRec.addEventListener('click', () => {
        post({
          status: 'canceled',
          sequenceType: 'recurring'
        });
      });
      failedRec.addEventListener('click', () => {
        post({
          status: 'failed',
          sequenceType: 'recurring'
        });
      });
    ` }] });
const $$Astro$d = createAstro("/src/pages/mollie/webhook-test.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$WebhookTest = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$d, $$props, $$slots);
  Astro2.self = $$WebhookTest;
  {
    return Astro2.redirect("/");
  }
});

var _page3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$d,
  'default': $$WebhookTest
}, Symbol.toStringTag, { value: 'Module' }));

async function post$1(_, req) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const id = params.get('id');

  const transactionRequest = await fetch(`https://api.mollie.com/v2/payments/${id}`,
    { headers: { 'Authorization': `Bearer ${"test_qtgbbfxvyAqf6KhrkkT8BNtqWcfSVJ"}` } }
  );
  if (transactionRequest.ok) {
    const transaction = await transactionRequest.json();

    const { status, customerId } = transaction;

    if(!customerId) {
      return new Response('', {status: 200});
    }

    try {
      await mongoose__default.connect("mongodb://uqn1avha6p85dp24dwgt:lREgtE1JLoFuNt3qcOsr@ble51fmrod0cif1-mongodb.services.clever-cloud.com:27017/ble51fmrod0cif1");
    } catch {
      throw new Error('Failed to connect to db.');
    }

    const mollieId = customerId;

    let mongoUser;
    try {
      mongoUser = await User.findOne({ mollieId });
    } catch {
      throw new Error('Failed to find db user.');
    }

    /**
     * Payment === canceled OR failed
     * 
     * If a recurring payment is canceled or failed, we want to cancel the subscription
     * In dutch we say "voor niks gaat de zon op"
     */
    if (status === 'canceled' || status === 'failed') {

      if (transaction.sequenceType === 'recurring') {
        const cancelRequest = await fetch(`https://api.mollie.com/v2/customers/${mongoUser.mollieId}/subscriptions/${mongoUser.subscriptionId}`,
          {
            method: 'DELETE',
            headers: { ...Authorization },
          });
        if (cancelRequest.ok) {
          try {
            mongoUser.subscriptionActive = false;
            mongoUser.subscriptionId = '';
            await mongoUser.save();
          } catch (e) {
            throw new Error('Failed to save user to db after cancelling subscription.');
          }
        } else {
          throw new Error('Failed to call cancel subscription endpoint after cancelled payment.');
        }
      }
    }

    /**
     * Payment === paid
     */
    if (status === 'paid') {
      if (transaction.sequenceType === 'first') {

        const mandatesRequest = await fetch(`https://api.mollie.com/v2/customers/${mollieId}/mandates`,
          {
            headers: { ...Authorization }
          });

        if (mandatesRequest.ok) {
          const mandates = await mandatesRequest.json();
          const mandate = mandates._embedded.mandates.find(({ status }) => status === 'pending' || status === 'valid');

          if (!mandate) {
            throw new Error('No valid or pending mandate found. Set up first payment for customer.');
          } else {

            const createSubscriptionRequest = await fetch(`https://api.mollie.com/v2/customers/${mollieId}/subscriptions`,
              {
                method: 'POST',
                headers: {
                  ...Authorization,
                  ...ContentType,
                },
                body: JSON.stringify({
                  amount: {
                    value: '10.00',
                    currency: 'EUR',
                  },
                  startDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  interval: '1 month',
                  description: "Passle courses recurring payment",
                  ...({ webhookUrl: `${"https://my-astro-course.netlify.app"}/mollie/webhook` } ),
                })
              });

            let subscription;
            try {
              subscription = await createSubscriptionRequest.json();
            } catch (e) {
            }

            if (createSubscriptionRequest.ok) {
              try {
                mongoUser.subscriptionActive = true;
                mongoUser.subscriptionId = subscription.id;
                await mongoUser.save();
              } catch {
                throw new Error('Failed to save subscription id on the db user.');
              }
            } else {
              throw new Error('Failed to create subscription.');
            }
          }
        } else {
          throw new Error('Mandates request failed.');
        }
      }
    }
  } else {
    throw new Error(`Failed to get transaction ${id}`);
  }

  return new Response(null, { status: 200 });
}

var _page4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  post: post$1
}, Symbol.toStringTag, { value: 'Module' }));

const activationTokenSchema = new mongoose__default.Schema({
  token: {
    type: String,
    unique: true
  },
  expireAt: { type: Date, default: Date.now, index: { expires: '15m' } },
});


let ActivationToken;
try {
  ActivationToken = mongoose__default.model('activationToken');
} catch {
  ActivationToken = mongoose__default.model('activationToken', activationTokenSchema);
}

var _page15 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get ActivationToken () { return ActivationToken; }
}, Symbol.toStringTag, { value: 'Module' }));

async function get$2(_, req) {
  const user = await isLoggedIn(req);

  if(!user.authed) {
    return new Response(null, {status: 302, headers: {'Location': '/error?code=AUTH'}});
  }
  
  try {
    await mongoose__default.connect("mongodb://uqn1avha6p85dp24dwgt:lREgtE1JLoFuNt3qcOsr@ble51fmrod0cif1-mongodb.services.clever-cloud.com:27017/ble51fmrod0cif1");
  } catch {
    return new Response(null, {status: 302, headers: {'Location': '/error?code=DB_CON'}});
  }

  /** First try to see if the mongo user has a mollie ID */
  let hasMollieId = false;
  let mongoUser = false;
  try {
    mongoUser = await User.findOne({id: user.id});
  } catch {
    /** No mongoUser found */
  }

  hasMollieId = !!mongoUser?.mollieId;
  
  /** No mollie id exists yet, and we have a mongoUser, we need to create a mollie user */
  let mollieUser;
  if(!hasMollieId && !!mongoUser) {
    try {
      const mollieUserRequest = await fetch('https://api.mollie.com/v2/customers', 
      {
        method: 'POST',
        headers: {
          ...Authorization,
          ...ContentType
        },
        body: JSON.stringify({
          ...({email: user?.email} || {}),
          ...({name: user?.name} || {}),
        })
      });
      
      if(mollieUserRequest.ok) {
        mollieUser = await mollieUserRequest.json();
        
        try {
          mongoUser.mollieId = mollieUser.id;
          await mongoUser.save();
        } catch(e) {
          throw new Error('SAVE_MOLLIE_ID_DB');
        }
      } else {
        throw new Error('CREATE_MOLLIE_FAILED');
      }
    } catch(e) {
      return new Response(null, {status: 302, headers: {'Location': `/error?code=${e.message}`}});
    }
  }

  let mollieId;
  if(hasMollieId) {
    mollieId = mongoUser.mollieId;
  } else {
    mollieId = mollieUser.id;
  }

  /**
   * We don't want anyone to just navigate to the `/mollie/payment-cb` and have a subscription activated
   * So we store a token, and in the `/mollie/[token]/payment-cb` we check to see if the token exists/is valid
   */
  const token = v4();
  await ActivationToken.create({token});

  const createPaymentRequest = await fetch('https://api.mollie.com/v2/payments', 
    {
      method: 'POST',
      headers: {
        ...Authorization,
        ...ContentType
      },
      body: JSON.stringify({
        amount: {
          currency: 'EUR',
          value: '10.00'
        },
        customerId: mollieId,
        sequenceType: 'first',
        description: "Passle courses first payment",
        ...({webhookUrl: `${"https://my-astro-course.netlify.app"}/mollie/webhook`} ),
        redirectUrl: `${"https://my-astro-course.netlify.app"}/mollie/${token}/payment-cb`,
      }),
    });
  

  if(createPaymentRequest.ok) {
    const payment = await createPaymentRequest.json();

    const redirectUrl = payment._links.checkout.href;
    return new Response(null, {status: 302, headers: {'Location': redirectUrl}});
  } else {
    return new Response(null, {status: 302, headers: {'Location': `/error?code=CREATE_PAYMENT_FAILED`}});
  }
}

var _page5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get: get$2
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$c = createMetadata("/src/pages/mollie/cb.astro", { modules: [{ module: $$module2$2, specifier: "../../layouts/Main.astro", assert: {} }, { module: $$module3$2, specifier: "../../layouts/CanvasBg.astro", assert: {} }, { module: _page11, specifier: "../utils/auth.js", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$c = createAstro("/src/pages/mollie/cb.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Cb = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$c, $$props, $$slots);
  Astro2.self = $$Cb;
  const user = await isLoggedIn(Astro2.request);
  const params = new URL(Astro2.request.url);
  const code = params.searchParams.get("code");
  let message;
  let title;
  switch (code) {
    case "CANCEL_OK":
      title = "Cancel";
      message = "Successfully canceled subscription.";
      break;
    case "FIRST_PAYMENT_OK":
      title = "Subscription";
      message = "Successfully subscribed.";
      break;
    default:
      title = "";
      message = "";
  }
  return render`${renderComponent($$result, "Main", $$Main, { "title": "Success", "user": user }, { "default": () => render`${renderComponent($$result, "CanvasBg", $$CanvasBg, {}, { "default": () => render`<h1>${title}</h1><div class="card">
			<p>${message}</p>
			${code === "FIRST_PAYMENT_OK" ? render`<a href="/sw/chapter/0/lesson/0" class="linkbutton-secondary outline">Start course</a>` : ""}
		</div>` })}` })}
`;
});

var _page6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$c,
  'default': $$Cb
}, Symbol.toStringTag, { value: 'Module' }));

async function get$1({token}, req) {
	const user = await isLoggedIn(req);

	await mongoose__default.connect("mongodb://uqn1avha6p85dp24dwgt:lREgtE1JLoFuNt3qcOsr@ble51fmrod0cif1-mongodb.services.clever-cloud.com:27017/ble51fmrod0cif1");

	const activationToken = await ActivationToken.findOne({token});
	if(!!activationToken) {
		const mongoUser = await User.findOne({id: user.id});
		mongoUser.subscriptionActive = true;
		await mongoUser.save();
		await ActivationToken.deleteOne({_id: activationToken._id});
	
		/** Create jwt */
		const jwt = createToken({
			name: mongoUser.username,
			email: mongoUser.email,
			picture: mongoUser.picture,
			id: mongoUser.id,
			admin: mongoUser.admin,
			active: true
		});
	
		/** Set headers */
		const headers = createHeaders({jwt, location: '/mollie/cb?code=FIRST_PAYMENT_OK'});
	
		return new Response(null, {
			status: 302,
			headers,
		});
	} else {
		return new Response(null, {status: 302, headers: {'Location': '/error?code=INVALID_ACTIVATION_TOKEN'}});
	}
}

var _page7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get: get$1
}, Symbol.toStringTag, { value: 'Module' }));

var index_astro_astro_type_style_index_0_lang = '';

const $$metadata$b = createMetadata("/src/pages/admin/index.astro", { modules: [{ module: mongoose, specifier: "mongoose", assert: {} }, { module: _page11, specifier: "../utils/auth.js", assert: {} }, { module: _page16, specifier: "../db/User.js", assert: {} }, { module: $$module2$2, specifier: "../../layouts/Main.astro", assert: {} }, { module: $$module3$2, specifier: "../../layouts/CanvasBg.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$b = createAstro("/src/pages/admin/index.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Index$1 = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$b, $$props, $$slots);
  Astro2.self = $$Index$1;
  const user = await isLoggedIn(Astro2.request);
  if (!user.admin) {
    return Astro2.redirect("/");
  }
  try {
    await mongoose__default.connect("mongodb://uqn1avha6p85dp24dwgt:lREgtE1JLoFuNt3qcOsr@ble51fmrod0cif1-mongodb.services.clever-cloud.com:27017/ble51fmrod0cif1");
  } catch {
  }
  const amountOfSubscriptions = await User.countDocuments({ subscriptionActive: true });
  const users = await User.find();
  const amountOfUsers = users.length;
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render`

${renderComponent($$result, "Main", $$Main, { "title": "Settings", "user": user, "class": "astro-4P5LU2AH" }, { "default": () => render`${renderComponent($$result, "CanvasBg", $$CanvasBg, { "class": "astro-4P5LU2AH" }, { "default": () => render`<h1 class="astro-4P5LU2AH">Admin</h1><div class="card astro-4P5LU2AH">
			<dl class="astro-4P5LU2AH">
				<div class="row astro-4P5LU2AH">
					<dt class="astro-4P5LU2AH">Active subscriptions</dt>
					<dd class="astro-4P5LU2AH">${amountOfSubscriptions}</dd>
				</div>
				<div class="row astro-4P5LU2AH">
					<dt class="astro-4P5LU2AH">Total users</dt>
					<dd class="astro-4P5LU2AH">${amountOfUsers}</dd>
				</div>
			</dl>
		</div><h1 class="astro-4P5LU2AH">Users</h1><div class="card astro-4P5LU2AH">
      <ul class="astro-4P5LU2AH">
        ${users.map((user2) => render`<a${addAttribute(`/admin/${user2.id}`, "href")} class="astro-4P5LU2AH">
            <li class="astro-4P5LU2AH">
              <span class="subscribed astro-4P5LU2AH">${user2.subscriptionActive ? render`<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000" class="astro-4P5LU2AH"><path d="M0 0h24v24H0V0z" fill="none" class="astro-4P5LU2AH"></path><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" class="astro-4P5LU2AH"></path></svg>` : ""}</span>
              <span class="astro-4P5LU2AH">${user2.username}</span>
            </li>
          </a>`)}
      </ul>
		</div>` })}` })}
`;
});

var _page8 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$b,
  'default': $$Index$1
}, Symbol.toStringTag, { value: 'Module' }));

var _user__astro_astro_type_style_index_0_lang = '';

const $$metadata$a = createMetadata("/src/pages/admin/[user].astro", { modules: [{ module: _page11, specifier: "../utils/auth.js", assert: {} }, { module: _page16, specifier: "../db/User.js", assert: {} }, { module: $$module2$2, specifier: "../../layouts/Main.astro", assert: {} }, { module: $$module3$2, specifier: "../../layouts/CanvasBg.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$a = createAstro("/src/pages/admin/[user].astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$user = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$a, $$props, $$slots);
  Astro2.self = $$user;
  const user = await isLoggedIn(Astro2.request);
  if (!user.admin) {
    return Astro2.redirect("/");
  }
  const mongoUser = await User.findOne({ id: Astro2.params.user });
  let mollieCustomer;
  let payments;
  if (!!mongoUser?.mollieId) {
    mollieCustomer = await fetch(`https://api.mollie.com/v2/customers/${mongoUser.mollieId}`, { headers: { ...Authorization } }).then((r) => r.json());
    payments = await fetch(`https://api.mollie.com/v2/customers/${mongoUser.mollieId}/payments`, { headers: { ...Authorization } }).then((r) => r.json());
  }
  let subscription;
  if (!!mongoUser?.subscriptionId) {
    subscription = await fetch(`https://api.mollie.com/v2/customers/${mongoUser.mollieId}/subscriptions/${mongoUser.subscriptionId}`, { headers: { ...Authorization } }).then((r) => r.json());
  }
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render`

${renderComponent($$result, "Main", $$Main, { "title": "Admin", "user": user, "class": "astro-HL3PZUWV" }, { "default": () => render`${renderComponent($$result, "CanvasBg", $$CanvasBg, { "class": "astro-HL3PZUWV" }, { "default": () => render`<div class="admin astro-HL3PZUWV">
      <a class="back astro-HL3PZUWV" href="/admin/">Back to Admin</a>
      <h1 class="astro-HL3PZUWV">User</h1>
      <div class="card astro-HL3PZUWV">
        <img${addAttribute(mongoUser?.picture, "src")} alt="" class="astro-HL3PZUWV">
        <dl class="astro-HL3PZUWV">
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">id</dt>
            <dd class="astro-HL3PZUWV">${mongoUser?.id}</dd>
          </div>
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">username</dt>
            <dd class="astro-HL3PZUWV">${mongoUser?.username}</dd>
          </div>
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">email</dt>
            <dd class="astro-HL3PZUWV">${mongoUser?.email}</dd>
          </div>
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">subscriptionActive</dt>
            <dd class="astro-HL3PZUWV">${mongoUser?.subscriptionActive}</dd>
          </div>
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">mollieId</dt>
            <dd class="astro-HL3PZUWV">${mongoUser?.mollieId}</dd>
          </div>

          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">subscriptionId</dt>
            <dd class="astro-HL3PZUWV">${mongoUser?.subscriptionId}</dd>
          </div>
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">admin</dt>
            <dd class="astro-HL3PZUWV">${mongoUser?.admin}</dd>
          </div>
        </dl>
      </div>

      ${mongoUser?.mollieId && mollieCustomer && render`<h1 class="astro-HL3PZUWV">Mollie User</h1><div class="card astro-HL3PZUWV">
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">createdAt</dt>
            <dd class="astro-HL3PZUWV">${new Date(mollieCustomer?.createdAt).toUTCString()}</dd>
          </div>
        </div>`}
      
      ${mongoUser?.subscriptionId && subscription && render`<h1 class="astro-HL3PZUWV">Subscription</h1><div class="card astro-HL3PZUWV">
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">status</dt>
            <dd class="astro-HL3PZUWV"><span${addAttribute(`${subscription?.status} status astro-HL3PZUWV`, "class")}>${subscription?.status}</span></dd>
          </div>
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">createdAt</dt>
            <dd class="astro-HL3PZUWV">${new Date(subscription?.createdAt).toUTCString()}</dd>
          </div>
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">startDate</dt>
            <dd class="astro-HL3PZUWV">${new Date(subscription?.startDate).toUTCString()}</dd>
          </div>
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">nextPaymentDate</dt>
            <dd class="astro-HL3PZUWV">${new Date(subscription?.nextPaymentDate).toUTCString()}</dd>
          </div>
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">description</dt>
            <dd class="astro-HL3PZUWV">${subscription?.description}</dd>
          </div>
          <div class="row astro-HL3PZUWV">
            <dt class="astro-HL3PZUWV">amount</dt>
            <dd class="astro-HL3PZUWV">${subscription?.amount?.currency} ${subscription?.amount?.value}</dd>
          </div>
        </div>`}

      ${mongoUser?.mollieId && payments?._embedded?.payments?.length > 0 && render`<h1 class="astro-HL3PZUWV">Payments</h1>${payments._embedded.payments.map((payment) => render`<div class="card astro-HL3PZUWV">
            <div class="row astro-HL3PZUWV">
              <dt class="astro-HL3PZUWV">resource</dt>
              <dd class="astro-HL3PZUWV">${payment?.resource}</dd>
            </div>
            <div class="row astro-HL3PZUWV">
              <dt class="astro-HL3PZUWV">createdAt</dt>
              <dd class="astro-HL3PZUWV">${new Date(payment?.createdAt).toUTCString()}</dd>
            </div>
            <div class="row astro-HL3PZUWV">
              <dt class="astro-HL3PZUWV">paidAt</dt>
              <dd class="astro-HL3PZUWV">${payment?.paidAt && new Date(payment?.paidAt).toUTCString()}</dd>
            </div>
            <div class="row astro-HL3PZUWV">
              <dt class="astro-HL3PZUWV">status</dt>
              <dd class="astro-HL3PZUWV"><span${addAttribute(`${payment?.status} status astro-HL3PZUWV`, "class")}>${payment?.status}</span></dd>
            </div>
            <div class="row astro-HL3PZUWV">
              <dt class="astro-HL3PZUWV">description</dt>
              <dd class="astro-HL3PZUWV">${payment?.description}</dd>
            </div>
            <div class="row astro-HL3PZUWV">
              <dt class="astro-HL3PZUWV">method</dt>
              <dd class="astro-HL3PZUWV">${payment?.method}</dd>
            </div>
            <div class="row astro-HL3PZUWV">
              <dt class="astro-HL3PZUWV">sequenceType</dt>
              <dd class="astro-HL3PZUWV">${payment?.sequenceType}</dd>
            </div>
            <div class="row astro-HL3PZUWV">
              <dt class="astro-HL3PZUWV">amount</dt>
              <dd class="astro-HL3PZUWV">${payment?.amount?.currency} ${payment?.amount?.value}</dd>
            </div>
          </div>`)}`}
    </div>` })}` })}
`;
});

var _page9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$a,
  'default': $$user
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$9 = createMetadata("/src/pages/error.astro", { modules: [{ module: $$module2$2, specifier: "../layouts/Main.astro", assert: {} }, { module: $$module3$2, specifier: "../layouts/CanvasBg.astro", assert: {} }, { module: _page11, specifier: "./utils/auth.js", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$9 = createAstro("/src/pages/error.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Error = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$Error;
  const user = await isLoggedIn(Astro2.request);
  const params = new URL(Astro2.request.url);
  const error = params.searchParams.get("code");
  let errorMessage;
  switch (error) {
    case "AUTH":
      errorMessage = "User is not authenticated.";
      break;
    case "SAVE_MOLLIE_ID_DB":
      errorMessage = "Failed to save mollie ID in the db.";
      break;
    case "CREATE_MOLLIE_FAILED":
      errorMessage = "Failed to create a mollie user.";
      break;
    case "CREATE_PAYMENT_FAILED":
      errorMessage = "Failed to create a mollie payment.";
      break;
    case "CANCEL_FAILED":
      errorMessage = "Failed request to cancel subscription.";
      break;
    case "CANCEL_DB_USER_SAVE_FAILED":
      errorMessage = "Failed to save user in db after cancelling subscription.";
      break;
    case "FAILED_TO_FIND_USER":
      errorMessage = "Db request to find user failed.";
      break;
    case "NO_DB_USER_FOUND":
      errorMessage = "Failed to find user in the db.";
      break;
    case "INVALID_ACTIVATION_TOKEN":
      errorMessage = "Invalid activation token.";
      break;
    case "DB_CON":
      errorMessage = "Failed to connect to the db.";
      break;
    case "LESSON_NOT_FOUND":
    case "OUT_OF_BOUNDS":
      errorMessage = "Lesson does not exist.";
      break;
    default:
      errorMessage = "Something went wrong.";
  }
  return render`${renderComponent($$result, "Main", $$Main, { "title": "Error", "user": user }, { "default": () => render`${renderComponent($$result, "CanvasBg", $$CanvasBg, {}, { "default": () => render`<h1>Uh oh!</h1><div class="card">
			<p>${errorMessage}</p>
		</div>` })}` })}
`;
});

var _page10 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$9,
  'default': $$Error
}, Symbol.toStringTag, { value: 'Module' }));

const CLIENT_ID = "120459150147-600c7qgmmfdv41j8dm4iifrmpar2bqgc.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

async function post(_, req) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const token = params.get('credential');

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });
  const payload = ticket.getPayload();

  /** Find user, or create one if its a new sign in */
  await mongoose__default.connect("mongodb://uqn1avha6p85dp24dwgt:lREgtE1JLoFuNt3qcOsr@ble51fmrod0cif1-mongodb.services.clever-cloud.com:27017/ble51fmrod0cif1");

  const user = await User.findOneOrCreate(
    {
      id: payload.sub
    }, 
    {
      id: payload.sub,
      username: payload.name,
      email: payload.email,
      picture: payload.picture,
      subscriptionActive: false,
      admin: false
    }
  );
  
  const active = !!user?.subscriptionActive;
  
  const jwt = createToken({ ...payload, id: payload.sub, admin: user?.admin, active });

  /** Set headers */
  const headers = createHeaders({jwt, location: '/'});

  return new Response(null, {
    status: 302,
    headers,
  });
}

var _page12 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  post: post
}, Symbol.toStringTag, { value: 'Module' }));

async function get() {
  const headers = new Headers();

  headers.append('Set-Cookie', 'jwt=""; Max-Age=1; Path=/; HttpOnly; Secure;');
  headers.append('Location', '/');

  return new Response(null, {
    status: 302,
    headers,
  });
}

var _page13 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get: get
}, Symbol.toStringTag, { value: 'Module' }));

var __freeze$3 = Object.freeze;
var __defProp$4 = Object.defineProperty;
var __template$3 = (cooked, raw) => __freeze$3(__defProp$4(cooked, "raw", { value: __freeze$3(raw || cooked.slice()) }));
var _a$3;
const $$metadata$8 = createMetadata("/src/pages/auth/login.astro", { modules: [{ module: _page11, specifier: "../utils/auth.js", assert: {} }, { module: $$module2$2, specifier: "../../layouts/Main.astro", assert: {} }, { module: $$module3$2, specifier: "../../layouts/CanvasBg.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$8 = createAstro("/src/pages/auth/login.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$Login;
  const user = await isLoggedIn(Astro2.request);
  const uri = "https://my-astro-course.netlify.app";
  return render`${renderComponent($$result, "Main", $$Main, { "user": user }, { "default": () => render`${renderComponent($$result, "CanvasBg", $$CanvasBg, {}, { "default": () => render(_a$3 || (_a$3 = __template$3(['<h1>Log in</h1><div class="card">\n			', "\n		</div><script>", `
			window.onload = function () { 
				google.accounts.id.initialize({ 
					client_id: '120459150147-600c7qgmmfdv41j8dm4iifrmpar2bqgc.apps.googleusercontent.com', 
					ux_mode: "redirect", 
					login_uri: \`\${uri}/auth/success\`
				});

				google.accounts.id.renderButton(
					document.getElementById("buttonDiv"), 
					{ type: 'button', theme: "filled_blue", size: "large" 
				}) 
			};
		<\/script>`], ['<h1>Log in</h1><div class="card">\n			', "\n		</div><script>", `
			window.onload = function () { 
				google.accounts.id.initialize({ 
					client_id: '120459150147-600c7qgmmfdv41j8dm4iifrmpar2bqgc.apps.googleusercontent.com', 
					ux_mode: "redirect", 
					login_uri: \\\`\\\${uri}/auth/success\\\`
				});

				google.accounts.id.renderButton(
					document.getElementById("buttonDiv"), 
					{ type: 'button', theme: "filled_blue", size: "large" 
				}) 
			};
		<\/script>`])), user.authed ? render`<div>
						<p>Welcome ${user.name}</p>
					</div>` : render`<div>
						<p>Please log in.</p>
						<div id="buttonDiv"></div>
				</div>`, defineScriptVars({ uri })) })}` })}
`;
});

var _page14 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$8,
  'default': $$Login
}, Symbol.toStringTag, { value: 'Module' }));

var subscribe_astro_astro_type_style_index_0_lang = '';

var installing = "/assets/asset.8f38c983.png";

var $$module3$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': installing
}, Symbol.toStringTag, { value: 'Module' }));

var lifecycle = "/assets/asset.0c25aac9.png";

var $$module4$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': lifecycle
}, Symbol.toStringTag, { value: 'Module' }));

var interactive = "/assets/asset.e32599ab.gif";

var $$module5$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': interactive
}, Symbol.toStringTag, { value: 'Module' }));

var clientsClaim = "/assets/asset.7227378c.png";

var $$module6$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': clientsClaim
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$7 = createMetadata("/src/pages/[course]/subscribe.astro", { modules: [{ module: _page11, specifier: "../utils/auth.js", assert: {} }, { module: $$module2$2, specifier: "../../layouts/Main.astro", assert: {} }, { module: $$module3$1, specifier: "../../assets/installing4.png", assert: {} }, { module: $$module4$1, specifier: "../../assets/lifecycle11.png", assert: {} }, { module: $$module5$1, specifier: "../../assets/demo_interactive_latest.gif", assert: {} }, { module: $$module6$1, specifier: "../../assets/clients-claim5.png", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$7 = createAstro("/src/pages/[course]/subscribe.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Subscribe = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$Subscribe;
  const user = await isLoggedIn(Astro2.request);
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render`
${renderComponent($$result, "Main", $$Main, { "title": "Subscribe", "user": user, "class": "astro-YGC2JYKT" }, { "default": () => render`<div class="section interactive astro-YGC2JYKT">
    <h1 class="big-title astro-YGC2JYKT">Learn <br class="astro-YGC2JYKT">Service Worker</h1>
    <img loading="lazy" class="interactive-img astro-YGC2JYKT"${addAttribute(interactive, "src")} alt="">
  </div><div class="section sub astro-YGC2JYKT">
    <h1 class="big-title astro-YGC2JYKT">Try for free!</h1>
    <div class="sub-card card astro-YGC2JYKT">
      <p class="astro-YGC2JYKT">Try the first chapter of the course out for free.</p>
      <a class="subscribe linkbutton-secondary outline astro-YGC2JYKT" href="/sw/chapter/0/lesson/0">Try it out</a>  
    </div>
  </div><div class="section lifecycle astro-YGC2JYKT">
    <div class="lifecycle-wrapper astro-YGC2JYKT">
      <img loading="lazy" class="lifecycle-img astro-YGC2JYKT"${addAttribute(lifecycle, "src")} alt="">
      <div class="lifecycle-info astro-YGC2JYKT">
        <h2 class="astro-YGC2JYKT">Detailed illustrations</h2>
        <p class="astro-YGC2JYKT">Learn everything there is to know about Service Workers via interactive exercises, and detailed graphs and illustrations</p>
      </div>
    </div>
  </div><div class="section updating astro-YGC2JYKT">
    <h1 class="big-title astro-YGC2JYKT">Updating</h1>

    <div class="updating-wrapper astro-YGC2JYKT">
      <div class="updating-info astro-YGC2JYKT">
        <h2 class="astro-YGC2JYKT">Updating lifecycle</h2>
        <p class="astro-YGC2JYKT">Learn all about a Progressive Web App's update lifecycle</p>
      </div>
      <img class="updating-img astro-YGC2JYKT" loading="lazy"${addAttribute(clientsClaim, "src")} alt="">
    </div>
  </div><div class="section installing astro-YGC2JYKT">
    <h1 class="big-title astro-YGC2JYKT">Installability</h1>
    <img class="installing-img astro-YGC2JYKT" loading="lazy"${addAttribute(installing, "src")} alt="">
  </div><div class="section sub astro-YGC2JYKT">
    <h1 class="big-title astro-YGC2JYKT" id="register">Register!</h1>
    <div class="sub-card card astro-YGC2JYKT">
      <h2 class="astro-YGC2JYKT">Pricing</h2>
      <p class="astro-YGC2JYKT">For a measly <strong class="astro-YGC2JYKT">€10,00</strong> a month (21% VAT incl.), you'll have access to your favourite course.</p>
      <p class="notification astro-YGC2JYKT">For demoing purposes, this will take you to the sandbox payment environment. <br class="astro-YGC2JYKT">You can try it out for free, and then check out the interactive course part of this site.</p>
      ${user.authed ? render`<a class="subscribe linkbutton-secondary outline astro-YGC2JYKT" href="/mollie/pay">Subscribe</a>` : render`<div class="astro-YGC2JYKT">
          <p class="astro-YGC2JYKT">Please sign in first.</p>
          <a class="linkbutton-secondary outline astro-YGC2JYKT" href="/auth/login">Login</a>
        </div>`}
      
    </div>

  </div>` })}
`;
});

var _page17 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$7,
  'default': $$Subscribe
}, Symbol.toStringTag, { value: 'Module' }));

const courseIndex = {
  'sw': {
    chapters: [
      // Chapter 0
      {
        title: 'Introduction',
        lessons: [
          {
            kind: 'theory',
            title: 'Theory: Introduction',
            markdownLocation: './sw/theory/introduction.md'
          },
          {
            kind: 'exercise',
            title: 'Exercise: Registering',
            validatorsLocation: './sw/registering/index.js'
          },
          {
            kind: 'quiz',
            title: 'Quiz: Wrapping up',
            questions: [
              {
                question: 'During which lifecycle event should you be precaching assets?',
                options: [
                  'installing',
                  'activating',
                  'activated',
                  'redundant',
                ],
                answer: 0,
                explanation: 'Exactly! Good job'
              },
              {
                question: 'During which lifecycle event should you be cleaning up old caches?',
                options: [
                  'parsed',
                  'redundant',
                  'activating',
                  'installing'
                ],
                answer: 2
              },
            ]
          }
        ]
      },
      // Chapter 1
      {
        title: 'Caching strategies',
        lessons: [
          {
            kind: 'theory',
            title: 'Theory: Introduction to caching strategies',
            markdownLocation: './sw/theory/caching.md'
          },
          {
            kind: 'exercise',
            title: 'Exercise: caching',
            validatorsLocation: './sw/caching/index.js'
          },
          {
            kind: 'quiz',
            title: 'Quiz: Wrapping up',
            questions: [
              {
                question: 'When should you use a cache first strategy?',
                options: [
                  'For content that updates frequently, like articles',
                  'Resources where having the latest version is not essential, like avatars'
                ],
                answer: 0,
                explanation: 'You should only use a cache first strategy for resources that are considered dependencies.'
              },
              {
                question: 'When should you use a cache only strategy?',
                options: [
                  'For highly dynamic resources',
                  'For static resources',
                  'For user avatars'
                ],
                answer: 1
              },
            ]
          }
        ]
      },
      {
        title: 'Updating lifecycle',
        lessons: [
          {
            kind: 'theory',
            title: 'Theory: Service worker updates',
            markdownLocation: './sw/theory/caching.md'
          }
        ]
      },
      {
        title: 'Clients claim',
        lessons: [
          {
            kind: 'theory',
            title: 'Theory: Introduction to updates',
            markdownLocation: './sw/theory/caching.md'
          },
          {
            kind: 'theory',
            title: 'Theory: Clients claim',
            markdownLocation: './sw/theory/outro.md'
          }
        ]
      },
      {
        title: 'Skip waiting',
        lessons: [
          {
            kind: 'theory',
            title: 'Theory: Skip waiting',
            markdownLocation: './sw/theory/caching.md'
          }
        ]
      },
    ]
  }
};

var _page18 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  courseIndex: courseIndex
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$6 = createMetadata("/src/components/Md.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$6 = createAstro("/src/components/Md.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Md = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$Md;
  const { content } = Astro2.props;
  return render`${renderComponent($$result, "Fragment", Fragment, {}, { "default": () => render`${markHTMLString(content)}` })}`;
});

var $$module2$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$6,
  'default': $$Md
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$5 = createMetadata("/src/components/Next.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$5 = createAstro("/src/components/Next.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Next = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$Next;
  const { isLastLesson, hasNextChapter, next, nextLink } = Astro2.props;
  return render`${!isLastLesson && render`<a class="footer"${addAttribute(nextLink, "href")}>
    <footer>
      <div class="footer-title-container">
        <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 0 24 24" width="40px"><g><rect fill="none" height="24" width="24"></rect></g><g><path d="M22,12c0-5.52-4.48-10-10-10C6.48,2,2,6.48,2,12s4.48,10,10,10C17.52,22,22,17.52,22,12z M4,12c0-4.42,3.58-8,8-8 c4.42,0,8,3.58,8,8s-3.58,8-8,8C7.58,20,4,16.42,4,12z M16,12l-4,4l-1.41-1.41L12.17,13H8v-2h4.17l-1.59-1.59L12,8L16,12z"></path></g></svg>
        <h1 class="footer-title">Next up:</h1>
      </div>
      <p>${next}</p>
    </footer>
  </a>`}

${isLastLesson && hasNextChapter && render`<a class="footer"${addAttribute(nextLink, "href")}>
    <footer>
      <div class="footer-title-container">
        <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 0 24 24" width="40px"><g><rect fill="none" height="24" width="24"></rect></g><g><path d="M22,12c0-5.52-4.48-10-10-10C6.48,2,2,6.48,2,12s4.48,10,10,10C17.52,22,22,17.52,22,12z M4,12c0-4.42,3.58-8,8-8 c4.42,0,8,3.58,8,8s-3.58,8-8,8C7.58,20,4,16.42,4,12z M16,12l-4,4l-1.41-1.41L12.17,13H8v-2h4.17l-1.59-1.59L12,8L16,12z"></path></g></svg>
        <h1 class="footer-title">Next up:</h1>
      </div>
      <p>${next}</p>
    </footer>
  </a>`}`;
});

var $$module3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$5,
  'default': $$Next
}, Symbol.toStringTag, { value: 'Module' }));

const tagName$1 = 'quiz-question';

const styles$1 = `
<style>
  :host {
    display: block;
    background: white;
    border-radius: 6px;
    padding: 20px;
    box-shadow: rgb(0 0 0 / 12%) 0px 0px 4px 0px, rgb(0 0 0 / 24%) 0px 4px 4px 0px;
    margin-bottom: 40px;
  }

  h2 {
    margin: 0;
  }

  .options {
    margin-top: 20px;
    margin-bottom: 20px;
    font-weight: 300;
  }

  ::slotted(.options-list) {
    display: block;
  }

  .explanation {
    margin-top: 8px;
    font-weight: 300;
  }

  .emoji {
    margin-right: 8px;
  }
</style>
`;

class QuizQuestion extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    this.render();

    this.addEventListener('change', (e) => {
      const buttons = this.querySelectorAll('input');
      const answer = parseInt(this.getAttribute('answer'));

      this.answered = e.target === buttons[answer];
      
      this.render();

      this.dispatchEvent(new CustomEvent('question-answered', {composed: true, bubbles: true}));
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${styles$1}
      <div class="card">
        <h2>${this.getAttribute('question')}</h2>
        <div class="options">
          <slot name="options"></slot>
        </div>
        ${this.answered 
          ? `
            <div><span class="emoji">✅</span> Correct!</div>
            <div class="explanation">${this.getAttribute('explanation')}</div>
          ` 
          : `<div><span class="emoji">❌</span> Incorrect</div>`}
      </div>  
    `;
  }
}

customElements.define(tagName$1, QuizQuestion);

var $$module1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  tagName: tagName$1
}, Symbol.toStringTag, { value: 'Module' }));

const tagName = 'quiz-next-card';

const styles = `
<style>
  :host {
    display: none;
  }

  :host([show]) {
    display: block;
  }

  .card {
    display: block;
    background: white;
    border-radius: 6px;
    padding: 20px;
    box-shadow: rgb(0 0 0 / 12%) 0px 0px 4px 0px, rgb(0 0 0 / 24%) 0px 4px 4px 0px;
    margin-bottom: 40px;
  }

  .next-anchor:visited .next {
    color: black;
    text-decoration: none;
  }

  h1 {
    font-size: 26px;
    margin-top: 0;
    margin-bottom: 0;
  }

  .next-anchor {
    display: block;
    color: black;
    transition: transform 0.1s ease-in;
    border-radius: 6px;
    text-decoration: none;
  }

  a:focus {
    box-shadow: rgb(0, 82, 255) 0px 0px 12px, rgb(0, 82, 255) 0px 0px 0px 1px;
    outline: 1px;
    transition: box-shadow 0.1s ease-in-out 0s;
  }

  .next-anchor:hover,
  .next-anchor:focus {
    transform: scale(1.02);
    box-shadow: rgb(0, 82, 255) 0px 0px 12px, rgb(0, 82, 255) 0px 0px 0px 1px;
  }

  .next-header h1 {
    margin-bottom: 0;
  }

  .next-header svg {
    margin-right: 12px;
  }

  .next-anchor:hover .next-header,
  .next-anchor:focus .next-header {
    fill: rgb(0, 82, 225);
    color: rgb(0, 82, 255);
  }

  .next-header {
    align-items: center;
    display: flex;
  }


  .up-next {
    font-weight: 300;
    margin-bottom: 0;
  }

  .up-next-title {
    margin-top: 0;
  }

  .next {
    padding: 20px;

    box-shadow: rgb(0 0 0 / 12%) 0px 0px 4px 0px, rgb(0 0 0 / 24%) 0px 4px 4px 0px;
    background: white;
    border-radius: 6px;
  }
</style>
`;

class QuizNextCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${styles}
      <a class="next-anchor" href="${this.getAttribute('nextLink')}">
        <div class="next">
          <div class="next-header">
            <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 0 24 24" width="40px"><g><rect fill="none" height="24" width="24"/></g><g><path d="M22,12c0-5.52-4.48-10-10-10C6.48,2,2,6.48,2,12s4.48,10,10,10C17.52,22,22,17.52,22,12z M4,12c0-4.42,3.58-8,8-8 c4.42,0,8,3.58,8,8s-3.58,8-8,8C7.58,20,4,16.42,4,12z M16,12l-4,4l-1.41-1.41L12.17,13H8v-2h4.17l-1.59-1.59L12,8L16,12z"/></g></svg>
            <h1>Success!</h1>
          </div>
          <slot></slot>
          <p class="up-next">Up next:</p>
          <p class="up-next-title">${this.getAttribute('next')}</p>
        </div>
      </a>
    `;
  }
}

customElements.define(tagName, QuizNextCard);

var $$module2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  tagName: tagName
}, Symbol.toStringTag, { value: 'Module' }));

var __freeze$2 = Object.freeze;
var __defProp$3 = Object.defineProperty;
var __template$2 = (cooked, raw) => __freeze$2(__defProp$3(cooked, "raw", { value: __freeze$2(raw || cooked.slice()) }));
var _a$2;
const $$metadata$4 = createMetadata("/src/components/Quiz.astro", { modules: [{ module: $$module1, specifier: "./quiz-question.js", assert: {} }, { module: $$module2, specifier: "./quiz-next-card.js", assert: {} }], hydratedComponents: ["quiz-next-card", "quiz-question"], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set(["visible", "idle"]), hoisted: [] });
const $$Astro$4 = createAstro("/src/components/Quiz.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Quiz = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$Quiz;
  const { next, nextLink, questions, title } = Astro2.props;
  return render(_a$2 || (_a$2 = __template$2(["<h1>", '</h1>\n<div id="quiz-questions">\n\n  ', "\n\n\n  ", "\n</div>\n\n<script>\n  const questionsContainer = document.getElementById('quiz-questions');\n  questionsContainer.addEventListener('question-answered', event => {\n    const questions = document.querySelectorAll('quiz-question');\n    const allDone = [...questions].every(question => question.answered);\n\n    const nextCard = document.querySelector('quiz-next-card');\n    if (allDone) {\n      nextCard.setAttribute('show', '');\n    } else {\n      nextCard.removeAttribute('show');\n    }\n  });\n<\/script>"])), title, questions.map((question, questionId) => render`${renderComponent($$result, "quiz-question", "quiz-question", { "question": question.question, "explanation": question.explanation, "answer": String(question.answer), "client:visible": true, "client:component-hydration": "visible", "client:component-path": $$metadata$4.getPath("quiz-question"), "client:component-export": $$metadata$4.getExport("quiz-question") }, { "default": () => render`
      <div slot="options" class="options-list">
        ${question.options.map((option, optionId) => render`<div class="option">
            <input${addAttribute(`question-${questionId}`, "name")}${addAttribute(`option-${questionId}-${optionId}`, "id")} type="radio"${addAttribute(option, "value")}>
            <label${addAttribute(`option-${questionId}-${optionId}`, "for")}>${option}</label>
          </div>`)}
      </div>
    ` })}`), renderComponent($$result, "quiz-next-card", "quiz-next-card", { "nextLink": nextLink, "next": next, "client:idle": true, "client:component-hydration": "idle", "client:component-path": $$metadata$4.getPath("quiz-next-card"), "client:component-export": $$metadata$4.getExport("quiz-next-card") }, { "default": () => render`
    <p>🎉 You've answered all questions correctly. You can now move on to the next section.</p>
  ` }));
});

var $$module4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$4,
  'default': $$Quiz
}, Symbol.toStringTag, { value: 'Module' }));

var Sidebar_astro_astro_type_style_index_0_lang = '';

const $$metadata$3 = createMetadata("/src/components/Sidebar.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$3 = createAstro("/src/components/Sidebar.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Sidebar = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$Sidebar;
  const { subscribed, course, chapter, lesson, courseIndex, title } = Astro2.props;
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render`
<div class="sidebar astro-ESE5EPIR">
  <p class="course-title astro-ESE5EPIR">${title}</p>
  ${courseIndex[course].chapters.map((c, i) => {
    return render`<ul class="astro-ESE5EPIR">
        <details${addAttribute(parseInt(chapter) === i, "open")} class="astro-ESE5EPIR">
          <summary class="astro-ESE5EPIR">
            <li${addAttribute((parseInt(chapter) === i ? "active-chapter" : "") + " astro-ESE5EPIR", "class")}>
              <svg class="chevron astro-ESE5EPIR" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" class="astro-ESE5EPIR"></path>
                <polyline points="9 6 15 12 9 18" class="astro-ESE5EPIR"></polyline>
              </svg>
              ${c.title} ${!subscribed && i > 0 && render`<svg class="locked astro-ESE5EPIR" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g fill="none" class="astro-ESE5EPIR"><path d="M0 0h24v24H0V0z" class="astro-ESE5EPIR"></path><path d="M0 0h24v24H0V0z" opacity=".87" class="astro-ESE5EPIR"></path></g><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" class="astro-ESE5EPIR"></path></svg>`}
            </li>
          </summary>
          <ul class="lessons astro-ESE5EPIR">
            ${c.lessons.map((l, j) => {
      return parseInt(lesson) === j && parseInt(chapter) === i ? render`<li class="current-lesson astro-ESE5EPIR">${l.title}</li>` : render`<a class="sidebar-link astro-ESE5EPIR"${addAttribute(`/${course}/chapter/${i}/lesson/${j}`, "href")}>
                  <li${addAttribute((parseInt(lesson) === j ? "active-lesson" : "") + " astro-ESE5EPIR", "class")}>${l.title}</li>
                </a>`;
    })}
          </ul>
        </details>
      </ul>`;
  })}
</div>`;
});

var $$module5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$3,
  'default': $$Sidebar
}, Symbol.toStringTag, { value: 'Module' }));

var InteractiveExercise_astro_astro_type_style_index_0_lang = '';

var __freeze$1 = Object.freeze;
var __defProp$2 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$2(cooked, "raw", { value: __freeze$1(raw || cooked.slice()) }));
var _a$1;
const $$metadata$2 = createMetadata("/src/layouts/InteractiveExercise.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [{ type: "inline", value: `
    window.MonacoEnvironment = {
      getWorkerUrl: function () {
        return './ts.worker.js';
      }
    };
  ` }] });
const $$Astro$2 = createAstro("/src/layouts/InteractiveExercise.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$InteractiveExercise = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$InteractiveExercise;
  const { validator, isLastLesson, hasNextChapter, course, lesson, chapter, next, title } = Astro2.props;
  const prod = "prod" === "prod";
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render(_a$1 || (_a$1 = __template$1(['<!DOCTYPE html><html lang="en">\n\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <script src="https://accounts.google.com/gsi/client" async defer><\/script>\n\n  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;800" rel="stylesheet">\n  <base href="/">\n\n  \n  <title>', '</title>\n  <link rel="stylesheet" href="./monaco-styles.css">\n<!--astro:head--></head>\n\n<body>\n  \n  ', '\n  \n  <div class="master">\n    ', "\n    ", '\n  </div>\n  <script type="module" src="./interactive-exercise.js"><\/script>\n  <script>', "\n    if(prod && 'serviceWorker' in navigator) {\n      let refreshing = false;\n\n      navigator.serviceWorker.register('./sw.js')\n        .then(() => {\n          console.log('sw registered');\n        })\n        .catch(() => {\n          console.log('failed to register sw');\n        });\n\n      navigator.serviceWorker.addEventListener('controllerchange', () => {\n        if (refreshing) return;\n        window.location.reload();\n        refreshing = true;\n      });\n    };\n  <\/script>\n</body>\n\n</html>"])), title, renderSlot($$result, $$slots["header"]), renderSlot($$result, $$slots["sidebar"]), renderComponent($$result, "interactive-exercise", "interactive-exercise", { "isLastLesson": isLastLesson, "hasNextChapter": hasNextChapter, "next": next, "course": course, "chapter": chapter, "lesson": lesson, "validator": validator }), defineScriptVars({ prod }));
});

var $$module6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$2,
  'default': $$InteractiveExercise
}, Symbol.toStringTag, { value: 'Module' }));

var Theory_astro_astro_type_style_index_0_lang = '';

var __freeze = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp$1(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$metadata$1 = createMetadata("/src/layouts/Theory.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$1 = createAstro("/src/layouts/Theory.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Theory = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Theory;
  const { isLastLesson, hasNextChapter, title, next, chapter, lesson } = Astro2.props;
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return render(_a || (_a = __template(['<!DOCTYPE html><html lang="en">\n\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <script src="https://accounts.google.com/gsi/client" async defer><\/script>\n\n  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;800" rel="stylesheet">\n  <base href="/">\n\n  \n  <title>', "</title>\n<!--astro:head--></head>\n\n<body>\n  ", '\n  \n  <div class="master">\n    ', '\n    <div class="md-content-container">\n      <div class="md-content">\n        ', "\n      </div>\n      ", "\n    </div>\n  </div>\n</body></html>"])), title, renderSlot($$result, $$slots["header"]), renderSlot($$result, $$slots["sidebar"]), renderSlot($$result, $$slots["content"]), renderSlot($$result, $$slots["next"]));
});

var $$module7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$1,
  'default': $$Theory
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata = createMetadata("/src/pages/[course]/[...all]/index.astro", { modules: [{ module: $$module1$2, specifier: "../../../components/Header.astro", assert: {} }, { module: $$module2$1, specifier: "../../../components/Md.astro", assert: {} }, { module: $$module3, specifier: "../../../components/Next.astro", assert: {} }, { module: $$module4, specifier: "../../../components/Quiz.astro", assert: {} }, { module: $$module5, specifier: "../../../components/Sidebar.astro", assert: {} }, { module: $$module6, specifier: "../../../layouts/InteractiveExercise.astro", assert: {} }, { module: $$module7, specifier: "../../../layouts/Theory.astro", assert: {} }, { module: _page11, specifier: "../../utils/auth.js", assert: {} }, { module: _page18, specifier: "./courseIndex.js", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro = createAstro("/src/pages/[course]/[...all]/index.astro", "https://my-astro-course.netlify.app/", "file:///Users/au87xu/my-astro-course/");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const user = await isLoggedIn(Astro2.request);
  const urlPattern = new URLPattern({ pathname: "/:course/chapter/:chapter/lesson/:lesson" });
  const match = urlPattern.exec(new URL(Astro2.request.url));
  const { course, chapter, lesson } = match.pathname.groups;
  if (!user.active && parseInt(chapter) !== 0) {
    return Astro2.redirect(`/${course}/subscribe#register`);
  }
  const currentLesson = courseIndex[course].chapters[chapter].lessons[lesson];
  const nextLesson = courseIndex[course].chapters[chapter].lessons[+lesson + 1];
  const nextChapter = courseIndex[course].chapters[+chapter + 1];
  if (!currentLesson) {
    return Astro2.redirect('/error?code="LESSON_NOT_FOUND');
  }
  let markdown = "";
  if (currentLesson?.markdownLocation) {
    try {
      const site = new URL(Astro2.request.url);
      const url = new URL(currentLesson?.markdownLocation, site.origin);
      markdown = await fetch(url.href).then((r) => r.text());
    } catch (e) {
      markdown = "Something went wrong.";
    }
  }
  const hasNextChapter = !!nextChapter;
  const isLastLesson = !nextLesson;
  let nextLink = "";
  if (!isLastLesson) {
    nextLink = `/${course}/chapter/${chapter}/lesson/${parseInt(lesson) + 1}`;
  }
  if (isLastLesson && hasNextChapter) {
    nextLink = `/${course}/chapter/${parseInt(chapter) + 1}/lesson/0`;
  }
  return render`${currentLesson?.kind === "theory" && render`${renderComponent($$result, "Theory", $$Theory, { "title": currentLesson.title, "hasNextChapter": hasNextChapter, "isLastLesson": isLastLesson, "next": nextLesson?.title ?? nextChapter?.title ?? "", "chapter": chapter, "lesson": lesson }, { "content": () => render`${renderComponent($$result, "Md", $$Md, { "slot": "content", "content": markdown })}`, "header": () => render`${renderComponent($$result, "Header", $$Header, { "slot": "header", "user": user })}`, "next": () => render`${renderComponent($$result, "Next", $$Next, { "slot": "next", "isLastLesson": isLastLesson, "hasNextChapter": hasNextChapter, "next": nextLesson?.title ?? nextChapter?.title ?? "", "nextLink": nextLink })}`, "sidebar": () => render`${renderComponent($$result, "Sidebar", $$Sidebar, { "slot": "sidebar", "subscribed": !!user?.active, "title": "Mental Gymnastics of Service Worker", "chapter": chapter, "lesson": lesson, "courseIndex": courseIndex, "course": course })}` })}`}

${currentLesson?.kind === "quiz" && render`${renderComponent($$result, "Theory", $$Theory, { "title": currentLesson.title, "hasNextChapter": hasNextChapter, "isLastLesson": isLastLesson, "next": nextLesson?.title ?? nextChapter?.title ?? "", "chapter": chapter, "lesson": lesson }, { "content": () => render`${renderComponent($$result, "Quiz", $$Quiz, { "title": currentLesson.title, "nextLink": nextLink, "next": nextLesson?.title ?? nextChapter?.title ?? "", "questions": currentLesson.questions, "slot": "content" })}`, "header": () => render`${renderComponent($$result, "Header", $$Header, { "slot": "header", "user": user })}`, "sidebar": () => render`${renderComponent($$result, "Sidebar", $$Sidebar, { "slot": "sidebar", "subscribed": !!user?.active, "title": "Mental Gymnastics of Service Worker", "chapter": chapter, "lesson": lesson, "courseIndex": courseIndex, "course": course })}` })}`}

${currentLesson?.kind === "exercise" && render`${renderComponent($$result, "InteractiveExercise", $$InteractiveExercise, { "title": currentLesson.title, "next": nextLesson?.title ?? nextChapter?.title ?? "", "hasNextChapter": hasNextChapter, "isLastLesson": isLastLesson, "course": course, "chapter": chapter, "lesson": lesson, "validator": currentLesson.validatorsLocation }, { "header": () => render`${renderComponent($$result, "Header", $$Header, { "slot": "header", "user": user })}`, "sidebar": () => render`${renderComponent($$result, "Sidebar", $$Sidebar, { "slot": "sidebar", "subscribed": !!user?.active, "title": "Mental Gymnastics of Service Worker", "chapter": chapter, "lesson": lesson, "courseIndex": courseIndex, "course": course })}` })}`}
`;
});

var _page19 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata,
  'default': $$Index
}, Symbol.toStringTag, { value: 'Module' }));

const pageMap = new Map([['src/pages/index.astro', _page0],['src/pages/settings.astro', _page1],['src/pages/mollie/cancel-subscription.js', _page2],['src/pages/mollie/webhook-test.astro', _page3],['src/pages/mollie/webhook.js', _page4],['src/pages/mollie/pay.js', _page5],['src/pages/mollie/cb.astro', _page6],['src/pages/mollie/[token]/payment-cb.js', _page7],['src/pages/admin/index.astro', _page8],['src/pages/admin/[user].astro', _page9],['src/pages/error.astro', _page10],['src/pages/utils/auth.js', _page11],['src/pages/auth/success.js', _page12],['src/pages/auth/logout.js', _page13],['src/pages/auth/login.astro', _page14],['src/pages/db/ActivationToken.js', _page15],['src/pages/db/User.js', _page16],['src/pages/[course]/subscribe.astro', _page17],['src/pages/[course]/[...all]/courseIndex.js', _page18],['src/pages/[course]/[...all]/index.astro', _page19],]);
const renderers = [Object.assign({"name":"custom-elements-ssr","serverEntrypoint":"custom-elements-ssr/server.js"}, { ssr: _renderer0 }),];

/** Named statements */


/** Custom name statements */


/** Deconstructs statements */


var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

/**
 * @param typeMap [Object] Map of MIME type -> Array[extensions]
 * @param ...
 */
function Mime$1() {
  this._types = Object.create(null);
  this._extensions = Object.create(null);

  for (let i = 0; i < arguments.length; i++) {
    this.define(arguments[i]);
  }

  this.define = this.define.bind(this);
  this.getType = this.getType.bind(this);
  this.getExtension = this.getExtension.bind(this);
}

/**
 * Define mimetype -> extension mappings.  Each key is a mime-type that maps
 * to an array of extensions associated with the type.  The first extension is
 * used as the default extension for the type.
 *
 * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
 *
 * If a type declares an extension that has already been defined, an error will
 * be thrown.  To suppress this error and force the extension to be associated
 * with the new type, pass `force`=true.  Alternatively, you may prefix the
 * extension with "*" to map the type to extension, without mapping the
 * extension to the type.
 *
 * e.g. mime.define({'audio/wav', ['wav']}, {'audio/x-wav', ['*wav']});
 *
 *
 * @param map (Object) type definitions
 * @param force (Boolean) if true, force overriding of existing definitions
 */
Mime$1.prototype.define = function(typeMap, force) {
  for (let type in typeMap) {
    let extensions = typeMap[type].map(function(t) {
      return t.toLowerCase();
    });
    type = type.toLowerCase();

    for (let i = 0; i < extensions.length; i++) {
      const ext = extensions[i];

      // '*' prefix = not the preferred type for this extension.  So fixup the
      // extension, and skip it.
      if (ext[0] === '*') {
        continue;
      }

      if (!force && (ext in this._types)) {
        throw new Error(
          'Attempt to change mapping for "' + ext +
          '" extension from "' + this._types[ext] + '" to "' + type +
          '". Pass `force=true` to allow this, otherwise remove "' + ext +
          '" from the list of extensions for "' + type + '".'
        );
      }

      this._types[ext] = type;
    }

    // Use first extension as default
    if (force || !this._extensions[type]) {
      const ext = extensions[0];
      this._extensions[type] = (ext[0] !== '*') ? ext : ext.substr(1);
    }
  }
};

/**
 * Lookup a mime type based on extension
 */
Mime$1.prototype.getType = function(path) {
  path = String(path);
  let last = path.replace(/^.*[/\\]/, '').toLowerCase();
  let ext = last.replace(/^.*\./, '').toLowerCase();

  let hasPath = last.length < path.length;
  let hasDot = ext.length < last.length - 1;

  return (hasDot || !hasPath) && this._types[ext] || null;
};

/**
 * Return file extension associated with a mime type
 */
Mime$1.prototype.getExtension = function(type) {
  type = /^\s*([^;\s]*)/.test(type) && RegExp.$1;
  return type && this._extensions[type.toLowerCase()] || null;
};

var Mime_1 = Mime$1;

var standard = {"application/andrew-inset":["ez"],"application/applixware":["aw"],"application/atom+xml":["atom"],"application/atomcat+xml":["atomcat"],"application/atomdeleted+xml":["atomdeleted"],"application/atomsvc+xml":["atomsvc"],"application/atsc-dwd+xml":["dwd"],"application/atsc-held+xml":["held"],"application/atsc-rsat+xml":["rsat"],"application/bdoc":["bdoc"],"application/calendar+xml":["xcs"],"application/ccxml+xml":["ccxml"],"application/cdfx+xml":["cdfx"],"application/cdmi-capability":["cdmia"],"application/cdmi-container":["cdmic"],"application/cdmi-domain":["cdmid"],"application/cdmi-object":["cdmio"],"application/cdmi-queue":["cdmiq"],"application/cu-seeme":["cu"],"application/dash+xml":["mpd"],"application/davmount+xml":["davmount"],"application/docbook+xml":["dbk"],"application/dssc+der":["dssc"],"application/dssc+xml":["xdssc"],"application/ecmascript":["es","ecma"],"application/emma+xml":["emma"],"application/emotionml+xml":["emotionml"],"application/epub+zip":["epub"],"application/exi":["exi"],"application/express":["exp"],"application/fdt+xml":["fdt"],"application/font-tdpfr":["pfr"],"application/geo+json":["geojson"],"application/gml+xml":["gml"],"application/gpx+xml":["gpx"],"application/gxf":["gxf"],"application/gzip":["gz"],"application/hjson":["hjson"],"application/hyperstudio":["stk"],"application/inkml+xml":["ink","inkml"],"application/ipfix":["ipfix"],"application/its+xml":["its"],"application/java-archive":["jar","war","ear"],"application/java-serialized-object":["ser"],"application/java-vm":["class"],"application/javascript":["js","mjs"],"application/json":["json","map"],"application/json5":["json5"],"application/jsonml+json":["jsonml"],"application/ld+json":["jsonld"],"application/lgr+xml":["lgr"],"application/lost+xml":["lostxml"],"application/mac-binhex40":["hqx"],"application/mac-compactpro":["cpt"],"application/mads+xml":["mads"],"application/manifest+json":["webmanifest"],"application/marc":["mrc"],"application/marcxml+xml":["mrcx"],"application/mathematica":["ma","nb","mb"],"application/mathml+xml":["mathml"],"application/mbox":["mbox"],"application/mediaservercontrol+xml":["mscml"],"application/metalink+xml":["metalink"],"application/metalink4+xml":["meta4"],"application/mets+xml":["mets"],"application/mmt-aei+xml":["maei"],"application/mmt-usd+xml":["musd"],"application/mods+xml":["mods"],"application/mp21":["m21","mp21"],"application/mp4":["mp4s","m4p"],"application/msword":["doc","dot"],"application/mxf":["mxf"],"application/n-quads":["nq"],"application/n-triples":["nt"],"application/node":["cjs"],"application/octet-stream":["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"],"application/oda":["oda"],"application/oebps-package+xml":["opf"],"application/ogg":["ogx"],"application/omdoc+xml":["omdoc"],"application/onenote":["onetoc","onetoc2","onetmp","onepkg"],"application/oxps":["oxps"],"application/p2p-overlay+xml":["relo"],"application/patch-ops-error+xml":["xer"],"application/pdf":["pdf"],"application/pgp-encrypted":["pgp"],"application/pgp-signature":["asc","sig"],"application/pics-rules":["prf"],"application/pkcs10":["p10"],"application/pkcs7-mime":["p7m","p7c"],"application/pkcs7-signature":["p7s"],"application/pkcs8":["p8"],"application/pkix-attr-cert":["ac"],"application/pkix-cert":["cer"],"application/pkix-crl":["crl"],"application/pkix-pkipath":["pkipath"],"application/pkixcmp":["pki"],"application/pls+xml":["pls"],"application/postscript":["ai","eps","ps"],"application/provenance+xml":["provx"],"application/pskc+xml":["pskcxml"],"application/raml+yaml":["raml"],"application/rdf+xml":["rdf","owl"],"application/reginfo+xml":["rif"],"application/relax-ng-compact-syntax":["rnc"],"application/resource-lists+xml":["rl"],"application/resource-lists-diff+xml":["rld"],"application/rls-services+xml":["rs"],"application/route-apd+xml":["rapd"],"application/route-s-tsid+xml":["sls"],"application/route-usd+xml":["rusd"],"application/rpki-ghostbusters":["gbr"],"application/rpki-manifest":["mft"],"application/rpki-roa":["roa"],"application/rsd+xml":["rsd"],"application/rss+xml":["rss"],"application/rtf":["rtf"],"application/sbml+xml":["sbml"],"application/scvp-cv-request":["scq"],"application/scvp-cv-response":["scs"],"application/scvp-vp-request":["spq"],"application/scvp-vp-response":["spp"],"application/sdp":["sdp"],"application/senml+xml":["senmlx"],"application/sensml+xml":["sensmlx"],"application/set-payment-initiation":["setpay"],"application/set-registration-initiation":["setreg"],"application/shf+xml":["shf"],"application/sieve":["siv","sieve"],"application/smil+xml":["smi","smil"],"application/sparql-query":["rq"],"application/sparql-results+xml":["srx"],"application/srgs":["gram"],"application/srgs+xml":["grxml"],"application/sru+xml":["sru"],"application/ssdl+xml":["ssdl"],"application/ssml+xml":["ssml"],"application/swid+xml":["swidtag"],"application/tei+xml":["tei","teicorpus"],"application/thraud+xml":["tfi"],"application/timestamped-data":["tsd"],"application/toml":["toml"],"application/trig":["trig"],"application/ttml+xml":["ttml"],"application/ubjson":["ubj"],"application/urc-ressheet+xml":["rsheet"],"application/urc-targetdesc+xml":["td"],"application/voicexml+xml":["vxml"],"application/wasm":["wasm"],"application/widget":["wgt"],"application/winhlp":["hlp"],"application/wsdl+xml":["wsdl"],"application/wspolicy+xml":["wspolicy"],"application/xaml+xml":["xaml"],"application/xcap-att+xml":["xav"],"application/xcap-caps+xml":["xca"],"application/xcap-diff+xml":["xdf"],"application/xcap-el+xml":["xel"],"application/xcap-ns+xml":["xns"],"application/xenc+xml":["xenc"],"application/xhtml+xml":["xhtml","xht"],"application/xliff+xml":["xlf"],"application/xml":["xml","xsl","xsd","rng"],"application/xml-dtd":["dtd"],"application/xop+xml":["xop"],"application/xproc+xml":["xpl"],"application/xslt+xml":["*xsl","xslt"],"application/xspf+xml":["xspf"],"application/xv+xml":["mxml","xhvml","xvml","xvm"],"application/yang":["yang"],"application/yin+xml":["yin"],"application/zip":["zip"],"audio/3gpp":["*3gpp"],"audio/adpcm":["adp"],"audio/amr":["amr"],"audio/basic":["au","snd"],"audio/midi":["mid","midi","kar","rmi"],"audio/mobile-xmf":["mxmf"],"audio/mp3":["*mp3"],"audio/mp4":["m4a","mp4a"],"audio/mpeg":["mpga","mp2","mp2a","mp3","m2a","m3a"],"audio/ogg":["oga","ogg","spx","opus"],"audio/s3m":["s3m"],"audio/silk":["sil"],"audio/wav":["wav"],"audio/wave":["*wav"],"audio/webm":["weba"],"audio/xm":["xm"],"font/collection":["ttc"],"font/otf":["otf"],"font/ttf":["ttf"],"font/woff":["woff"],"font/woff2":["woff2"],"image/aces":["exr"],"image/apng":["apng"],"image/avif":["avif"],"image/bmp":["bmp"],"image/cgm":["cgm"],"image/dicom-rle":["drle"],"image/emf":["emf"],"image/fits":["fits"],"image/g3fax":["g3"],"image/gif":["gif"],"image/heic":["heic"],"image/heic-sequence":["heics"],"image/heif":["heif"],"image/heif-sequence":["heifs"],"image/hej2k":["hej2"],"image/hsj2":["hsj2"],"image/ief":["ief"],"image/jls":["jls"],"image/jp2":["jp2","jpg2"],"image/jpeg":["jpeg","jpg","jpe"],"image/jph":["jph"],"image/jphc":["jhc"],"image/jpm":["jpm"],"image/jpx":["jpx","jpf"],"image/jxr":["jxr"],"image/jxra":["jxra"],"image/jxrs":["jxrs"],"image/jxs":["jxs"],"image/jxsc":["jxsc"],"image/jxsi":["jxsi"],"image/jxss":["jxss"],"image/ktx":["ktx"],"image/ktx2":["ktx2"],"image/png":["png"],"image/sgi":["sgi"],"image/svg+xml":["svg","svgz"],"image/t38":["t38"],"image/tiff":["tif","tiff"],"image/tiff-fx":["tfx"],"image/webp":["webp"],"image/wmf":["wmf"],"message/disposition-notification":["disposition-notification"],"message/global":["u8msg"],"message/global-delivery-status":["u8dsn"],"message/global-disposition-notification":["u8mdn"],"message/global-headers":["u8hdr"],"message/rfc822":["eml","mime"],"model/3mf":["3mf"],"model/gltf+json":["gltf"],"model/gltf-binary":["glb"],"model/iges":["igs","iges"],"model/mesh":["msh","mesh","silo"],"model/mtl":["mtl"],"model/obj":["obj"],"model/step+xml":["stpx"],"model/step+zip":["stpz"],"model/step-xml+zip":["stpxz"],"model/stl":["stl"],"model/vrml":["wrl","vrml"],"model/x3d+binary":["*x3db","x3dbz"],"model/x3d+fastinfoset":["x3db"],"model/x3d+vrml":["*x3dv","x3dvz"],"model/x3d+xml":["x3d","x3dz"],"model/x3d-vrml":["x3dv"],"text/cache-manifest":["appcache","manifest"],"text/calendar":["ics","ifb"],"text/coffeescript":["coffee","litcoffee"],"text/css":["css"],"text/csv":["csv"],"text/html":["html","htm","shtml"],"text/jade":["jade"],"text/jsx":["jsx"],"text/less":["less"],"text/markdown":["markdown","md"],"text/mathml":["mml"],"text/mdx":["mdx"],"text/n3":["n3"],"text/plain":["txt","text","conf","def","list","log","in","ini"],"text/richtext":["rtx"],"text/rtf":["*rtf"],"text/sgml":["sgml","sgm"],"text/shex":["shex"],"text/slim":["slim","slm"],"text/spdx":["spdx"],"text/stylus":["stylus","styl"],"text/tab-separated-values":["tsv"],"text/troff":["t","tr","roff","man","me","ms"],"text/turtle":["ttl"],"text/uri-list":["uri","uris","urls"],"text/vcard":["vcard"],"text/vtt":["vtt"],"text/xml":["*xml"],"text/yaml":["yaml","yml"],"video/3gpp":["3gp","3gpp"],"video/3gpp2":["3g2"],"video/h261":["h261"],"video/h263":["h263"],"video/h264":["h264"],"video/iso.segment":["m4s"],"video/jpeg":["jpgv"],"video/jpm":["*jpm","jpgm"],"video/mj2":["mj2","mjp2"],"video/mp2t":["ts"],"video/mp4":["mp4","mp4v","mpg4"],"video/mpeg":["mpeg","mpg","mpe","m1v","m2v"],"video/ogg":["ogv"],"video/quicktime":["qt","mov"],"video/webm":["webm"]};

var other = {"application/prs.cww":["cww"],"application/vnd.1000minds.decision-model+xml":["1km"],"application/vnd.3gpp.pic-bw-large":["plb"],"application/vnd.3gpp.pic-bw-small":["psb"],"application/vnd.3gpp.pic-bw-var":["pvb"],"application/vnd.3gpp2.tcap":["tcap"],"application/vnd.3m.post-it-notes":["pwn"],"application/vnd.accpac.simply.aso":["aso"],"application/vnd.accpac.simply.imp":["imp"],"application/vnd.acucobol":["acu"],"application/vnd.acucorp":["atc","acutc"],"application/vnd.adobe.air-application-installer-package+zip":["air"],"application/vnd.adobe.formscentral.fcdt":["fcdt"],"application/vnd.adobe.fxp":["fxp","fxpl"],"application/vnd.adobe.xdp+xml":["xdp"],"application/vnd.adobe.xfdf":["xfdf"],"application/vnd.ahead.space":["ahead"],"application/vnd.airzip.filesecure.azf":["azf"],"application/vnd.airzip.filesecure.azs":["azs"],"application/vnd.amazon.ebook":["azw"],"application/vnd.americandynamics.acc":["acc"],"application/vnd.amiga.ami":["ami"],"application/vnd.android.package-archive":["apk"],"application/vnd.anser-web-certificate-issue-initiation":["cii"],"application/vnd.anser-web-funds-transfer-initiation":["fti"],"application/vnd.antix.game-component":["atx"],"application/vnd.apple.installer+xml":["mpkg"],"application/vnd.apple.keynote":["key"],"application/vnd.apple.mpegurl":["m3u8"],"application/vnd.apple.numbers":["numbers"],"application/vnd.apple.pages":["pages"],"application/vnd.apple.pkpass":["pkpass"],"application/vnd.aristanetworks.swi":["swi"],"application/vnd.astraea-software.iota":["iota"],"application/vnd.audiograph":["aep"],"application/vnd.balsamiq.bmml+xml":["bmml"],"application/vnd.blueice.multipass":["mpm"],"application/vnd.bmi":["bmi"],"application/vnd.businessobjects":["rep"],"application/vnd.chemdraw+xml":["cdxml"],"application/vnd.chipnuts.karaoke-mmd":["mmd"],"application/vnd.cinderella":["cdy"],"application/vnd.citationstyles.style+xml":["csl"],"application/vnd.claymore":["cla"],"application/vnd.cloanto.rp9":["rp9"],"application/vnd.clonk.c4group":["c4g","c4d","c4f","c4p","c4u"],"application/vnd.cluetrust.cartomobile-config":["c11amc"],"application/vnd.cluetrust.cartomobile-config-pkg":["c11amz"],"application/vnd.commonspace":["csp"],"application/vnd.contact.cmsg":["cdbcmsg"],"application/vnd.cosmocaller":["cmc"],"application/vnd.crick.clicker":["clkx"],"application/vnd.crick.clicker.keyboard":["clkk"],"application/vnd.crick.clicker.palette":["clkp"],"application/vnd.crick.clicker.template":["clkt"],"application/vnd.crick.clicker.wordbank":["clkw"],"application/vnd.criticaltools.wbs+xml":["wbs"],"application/vnd.ctc-posml":["pml"],"application/vnd.cups-ppd":["ppd"],"application/vnd.curl.car":["car"],"application/vnd.curl.pcurl":["pcurl"],"application/vnd.dart":["dart"],"application/vnd.data-vision.rdz":["rdz"],"application/vnd.dbf":["dbf"],"application/vnd.dece.data":["uvf","uvvf","uvd","uvvd"],"application/vnd.dece.ttml+xml":["uvt","uvvt"],"application/vnd.dece.unspecified":["uvx","uvvx"],"application/vnd.dece.zip":["uvz","uvvz"],"application/vnd.denovo.fcselayout-link":["fe_launch"],"application/vnd.dna":["dna"],"application/vnd.dolby.mlp":["mlp"],"application/vnd.dpgraph":["dpg"],"application/vnd.dreamfactory":["dfac"],"application/vnd.ds-keypoint":["kpxx"],"application/vnd.dvb.ait":["ait"],"application/vnd.dvb.service":["svc"],"application/vnd.dynageo":["geo"],"application/vnd.ecowin.chart":["mag"],"application/vnd.enliven":["nml"],"application/vnd.epson.esf":["esf"],"application/vnd.epson.msf":["msf"],"application/vnd.epson.quickanime":["qam"],"application/vnd.epson.salt":["slt"],"application/vnd.epson.ssf":["ssf"],"application/vnd.eszigno3+xml":["es3","et3"],"application/vnd.ezpix-album":["ez2"],"application/vnd.ezpix-package":["ez3"],"application/vnd.fdf":["fdf"],"application/vnd.fdsn.mseed":["mseed"],"application/vnd.fdsn.seed":["seed","dataless"],"application/vnd.flographit":["gph"],"application/vnd.fluxtime.clip":["ftc"],"application/vnd.framemaker":["fm","frame","maker","book"],"application/vnd.frogans.fnc":["fnc"],"application/vnd.frogans.ltf":["ltf"],"application/vnd.fsc.weblaunch":["fsc"],"application/vnd.fujitsu.oasys":["oas"],"application/vnd.fujitsu.oasys2":["oa2"],"application/vnd.fujitsu.oasys3":["oa3"],"application/vnd.fujitsu.oasysgp":["fg5"],"application/vnd.fujitsu.oasysprs":["bh2"],"application/vnd.fujixerox.ddd":["ddd"],"application/vnd.fujixerox.docuworks":["xdw"],"application/vnd.fujixerox.docuworks.binder":["xbd"],"application/vnd.fuzzysheet":["fzs"],"application/vnd.genomatix.tuxedo":["txd"],"application/vnd.geogebra.file":["ggb"],"application/vnd.geogebra.tool":["ggt"],"application/vnd.geometry-explorer":["gex","gre"],"application/vnd.geonext":["gxt"],"application/vnd.geoplan":["g2w"],"application/vnd.geospace":["g3w"],"application/vnd.gmx":["gmx"],"application/vnd.google-apps.document":["gdoc"],"application/vnd.google-apps.presentation":["gslides"],"application/vnd.google-apps.spreadsheet":["gsheet"],"application/vnd.google-earth.kml+xml":["kml"],"application/vnd.google-earth.kmz":["kmz"],"application/vnd.grafeq":["gqf","gqs"],"application/vnd.groove-account":["gac"],"application/vnd.groove-help":["ghf"],"application/vnd.groove-identity-message":["gim"],"application/vnd.groove-injector":["grv"],"application/vnd.groove-tool-message":["gtm"],"application/vnd.groove-tool-template":["tpl"],"application/vnd.groove-vcard":["vcg"],"application/vnd.hal+xml":["hal"],"application/vnd.handheld-entertainment+xml":["zmm"],"application/vnd.hbci":["hbci"],"application/vnd.hhe.lesson-player":["les"],"application/vnd.hp-hpgl":["hpgl"],"application/vnd.hp-hpid":["hpid"],"application/vnd.hp-hps":["hps"],"application/vnd.hp-jlyt":["jlt"],"application/vnd.hp-pcl":["pcl"],"application/vnd.hp-pclxl":["pclxl"],"application/vnd.hydrostatix.sof-data":["sfd-hdstx"],"application/vnd.ibm.minipay":["mpy"],"application/vnd.ibm.modcap":["afp","listafp","list3820"],"application/vnd.ibm.rights-management":["irm"],"application/vnd.ibm.secure-container":["sc"],"application/vnd.iccprofile":["icc","icm"],"application/vnd.igloader":["igl"],"application/vnd.immervision-ivp":["ivp"],"application/vnd.immervision-ivu":["ivu"],"application/vnd.insors.igm":["igm"],"application/vnd.intercon.formnet":["xpw","xpx"],"application/vnd.intergeo":["i2g"],"application/vnd.intu.qbo":["qbo"],"application/vnd.intu.qfx":["qfx"],"application/vnd.ipunplugged.rcprofile":["rcprofile"],"application/vnd.irepository.package+xml":["irp"],"application/vnd.is-xpr":["xpr"],"application/vnd.isac.fcs":["fcs"],"application/vnd.jam":["jam"],"application/vnd.jcp.javame.midlet-rms":["rms"],"application/vnd.jisp":["jisp"],"application/vnd.joost.joda-archive":["joda"],"application/vnd.kahootz":["ktz","ktr"],"application/vnd.kde.karbon":["karbon"],"application/vnd.kde.kchart":["chrt"],"application/vnd.kde.kformula":["kfo"],"application/vnd.kde.kivio":["flw"],"application/vnd.kde.kontour":["kon"],"application/vnd.kde.kpresenter":["kpr","kpt"],"application/vnd.kde.kspread":["ksp"],"application/vnd.kde.kword":["kwd","kwt"],"application/vnd.kenameaapp":["htke"],"application/vnd.kidspiration":["kia"],"application/vnd.kinar":["kne","knp"],"application/vnd.koan":["skp","skd","skt","skm"],"application/vnd.kodak-descriptor":["sse"],"application/vnd.las.las+xml":["lasxml"],"application/vnd.llamagraphics.life-balance.desktop":["lbd"],"application/vnd.llamagraphics.life-balance.exchange+xml":["lbe"],"application/vnd.lotus-1-2-3":["123"],"application/vnd.lotus-approach":["apr"],"application/vnd.lotus-freelance":["pre"],"application/vnd.lotus-notes":["nsf"],"application/vnd.lotus-organizer":["org"],"application/vnd.lotus-screencam":["scm"],"application/vnd.lotus-wordpro":["lwp"],"application/vnd.macports.portpkg":["portpkg"],"application/vnd.mapbox-vector-tile":["mvt"],"application/vnd.mcd":["mcd"],"application/vnd.medcalcdata":["mc1"],"application/vnd.mediastation.cdkey":["cdkey"],"application/vnd.mfer":["mwf"],"application/vnd.mfmp":["mfm"],"application/vnd.micrografx.flo":["flo"],"application/vnd.micrografx.igx":["igx"],"application/vnd.mif":["mif"],"application/vnd.mobius.daf":["daf"],"application/vnd.mobius.dis":["dis"],"application/vnd.mobius.mbk":["mbk"],"application/vnd.mobius.mqy":["mqy"],"application/vnd.mobius.msl":["msl"],"application/vnd.mobius.plc":["plc"],"application/vnd.mobius.txf":["txf"],"application/vnd.mophun.application":["mpn"],"application/vnd.mophun.certificate":["mpc"],"application/vnd.mozilla.xul+xml":["xul"],"application/vnd.ms-artgalry":["cil"],"application/vnd.ms-cab-compressed":["cab"],"application/vnd.ms-excel":["xls","xlm","xla","xlc","xlt","xlw"],"application/vnd.ms-excel.addin.macroenabled.12":["xlam"],"application/vnd.ms-excel.sheet.binary.macroenabled.12":["xlsb"],"application/vnd.ms-excel.sheet.macroenabled.12":["xlsm"],"application/vnd.ms-excel.template.macroenabled.12":["xltm"],"application/vnd.ms-fontobject":["eot"],"application/vnd.ms-htmlhelp":["chm"],"application/vnd.ms-ims":["ims"],"application/vnd.ms-lrm":["lrm"],"application/vnd.ms-officetheme":["thmx"],"application/vnd.ms-outlook":["msg"],"application/vnd.ms-pki.seccat":["cat"],"application/vnd.ms-pki.stl":["*stl"],"application/vnd.ms-powerpoint":["ppt","pps","pot"],"application/vnd.ms-powerpoint.addin.macroenabled.12":["ppam"],"application/vnd.ms-powerpoint.presentation.macroenabled.12":["pptm"],"application/vnd.ms-powerpoint.slide.macroenabled.12":["sldm"],"application/vnd.ms-powerpoint.slideshow.macroenabled.12":["ppsm"],"application/vnd.ms-powerpoint.template.macroenabled.12":["potm"],"application/vnd.ms-project":["mpp","mpt"],"application/vnd.ms-word.document.macroenabled.12":["docm"],"application/vnd.ms-word.template.macroenabled.12":["dotm"],"application/vnd.ms-works":["wps","wks","wcm","wdb"],"application/vnd.ms-wpl":["wpl"],"application/vnd.ms-xpsdocument":["xps"],"application/vnd.mseq":["mseq"],"application/vnd.musician":["mus"],"application/vnd.muvee.style":["msty"],"application/vnd.mynfc":["taglet"],"application/vnd.neurolanguage.nlu":["nlu"],"application/vnd.nitf":["ntf","nitf"],"application/vnd.noblenet-directory":["nnd"],"application/vnd.noblenet-sealer":["nns"],"application/vnd.noblenet-web":["nnw"],"application/vnd.nokia.n-gage.ac+xml":["*ac"],"application/vnd.nokia.n-gage.data":["ngdat"],"application/vnd.nokia.n-gage.symbian.install":["n-gage"],"application/vnd.nokia.radio-preset":["rpst"],"application/vnd.nokia.radio-presets":["rpss"],"application/vnd.novadigm.edm":["edm"],"application/vnd.novadigm.edx":["edx"],"application/vnd.novadigm.ext":["ext"],"application/vnd.oasis.opendocument.chart":["odc"],"application/vnd.oasis.opendocument.chart-template":["otc"],"application/vnd.oasis.opendocument.database":["odb"],"application/vnd.oasis.opendocument.formula":["odf"],"application/vnd.oasis.opendocument.formula-template":["odft"],"application/vnd.oasis.opendocument.graphics":["odg"],"application/vnd.oasis.opendocument.graphics-template":["otg"],"application/vnd.oasis.opendocument.image":["odi"],"application/vnd.oasis.opendocument.image-template":["oti"],"application/vnd.oasis.opendocument.presentation":["odp"],"application/vnd.oasis.opendocument.presentation-template":["otp"],"application/vnd.oasis.opendocument.spreadsheet":["ods"],"application/vnd.oasis.opendocument.spreadsheet-template":["ots"],"application/vnd.oasis.opendocument.text":["odt"],"application/vnd.oasis.opendocument.text-master":["odm"],"application/vnd.oasis.opendocument.text-template":["ott"],"application/vnd.oasis.opendocument.text-web":["oth"],"application/vnd.olpc-sugar":["xo"],"application/vnd.oma.dd2+xml":["dd2"],"application/vnd.openblox.game+xml":["obgx"],"application/vnd.openofficeorg.extension":["oxt"],"application/vnd.openstreetmap.data+xml":["osm"],"application/vnd.openxmlformats-officedocument.presentationml.presentation":["pptx"],"application/vnd.openxmlformats-officedocument.presentationml.slide":["sldx"],"application/vnd.openxmlformats-officedocument.presentationml.slideshow":["ppsx"],"application/vnd.openxmlformats-officedocument.presentationml.template":["potx"],"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":["xlsx"],"application/vnd.openxmlformats-officedocument.spreadsheetml.template":["xltx"],"application/vnd.openxmlformats-officedocument.wordprocessingml.document":["docx"],"application/vnd.openxmlformats-officedocument.wordprocessingml.template":["dotx"],"application/vnd.osgeo.mapguide.package":["mgp"],"application/vnd.osgi.dp":["dp"],"application/vnd.osgi.subsystem":["esa"],"application/vnd.palm":["pdb","pqa","oprc"],"application/vnd.pawaafile":["paw"],"application/vnd.pg.format":["str"],"application/vnd.pg.osasli":["ei6"],"application/vnd.picsel":["efif"],"application/vnd.pmi.widget":["wg"],"application/vnd.pocketlearn":["plf"],"application/vnd.powerbuilder6":["pbd"],"application/vnd.previewsystems.box":["box"],"application/vnd.proteus.magazine":["mgz"],"application/vnd.publishare-delta-tree":["qps"],"application/vnd.pvi.ptid1":["ptid"],"application/vnd.quark.quarkxpress":["qxd","qxt","qwd","qwt","qxl","qxb"],"application/vnd.rar":["rar"],"application/vnd.realvnc.bed":["bed"],"application/vnd.recordare.musicxml":["mxl"],"application/vnd.recordare.musicxml+xml":["musicxml"],"application/vnd.rig.cryptonote":["cryptonote"],"application/vnd.rim.cod":["cod"],"application/vnd.rn-realmedia":["rm"],"application/vnd.rn-realmedia-vbr":["rmvb"],"application/vnd.route66.link66+xml":["link66"],"application/vnd.sailingtracker.track":["st"],"application/vnd.seemail":["see"],"application/vnd.sema":["sema"],"application/vnd.semd":["semd"],"application/vnd.semf":["semf"],"application/vnd.shana.informed.formdata":["ifm"],"application/vnd.shana.informed.formtemplate":["itp"],"application/vnd.shana.informed.interchange":["iif"],"application/vnd.shana.informed.package":["ipk"],"application/vnd.simtech-mindmapper":["twd","twds"],"application/vnd.smaf":["mmf"],"application/vnd.smart.teacher":["teacher"],"application/vnd.software602.filler.form+xml":["fo"],"application/vnd.solent.sdkm+xml":["sdkm","sdkd"],"application/vnd.spotfire.dxp":["dxp"],"application/vnd.spotfire.sfs":["sfs"],"application/vnd.stardivision.calc":["sdc"],"application/vnd.stardivision.draw":["sda"],"application/vnd.stardivision.impress":["sdd"],"application/vnd.stardivision.math":["smf"],"application/vnd.stardivision.writer":["sdw","vor"],"application/vnd.stardivision.writer-global":["sgl"],"application/vnd.stepmania.package":["smzip"],"application/vnd.stepmania.stepchart":["sm"],"application/vnd.sun.wadl+xml":["wadl"],"application/vnd.sun.xml.calc":["sxc"],"application/vnd.sun.xml.calc.template":["stc"],"application/vnd.sun.xml.draw":["sxd"],"application/vnd.sun.xml.draw.template":["std"],"application/vnd.sun.xml.impress":["sxi"],"application/vnd.sun.xml.impress.template":["sti"],"application/vnd.sun.xml.math":["sxm"],"application/vnd.sun.xml.writer":["sxw"],"application/vnd.sun.xml.writer.global":["sxg"],"application/vnd.sun.xml.writer.template":["stw"],"application/vnd.sus-calendar":["sus","susp"],"application/vnd.svd":["svd"],"application/vnd.symbian.install":["sis","sisx"],"application/vnd.syncml+xml":["xsm"],"application/vnd.syncml.dm+wbxml":["bdm"],"application/vnd.syncml.dm+xml":["xdm"],"application/vnd.syncml.dmddf+xml":["ddf"],"application/vnd.tao.intent-module-archive":["tao"],"application/vnd.tcpdump.pcap":["pcap","cap","dmp"],"application/vnd.tmobile-livetv":["tmo"],"application/vnd.trid.tpt":["tpt"],"application/vnd.triscape.mxs":["mxs"],"application/vnd.trueapp":["tra"],"application/vnd.ufdl":["ufd","ufdl"],"application/vnd.uiq.theme":["utz"],"application/vnd.umajin":["umj"],"application/vnd.unity":["unityweb"],"application/vnd.uoml+xml":["uoml"],"application/vnd.vcx":["vcx"],"application/vnd.visio":["vsd","vst","vss","vsw"],"application/vnd.visionary":["vis"],"application/vnd.vsf":["vsf"],"application/vnd.wap.wbxml":["wbxml"],"application/vnd.wap.wmlc":["wmlc"],"application/vnd.wap.wmlscriptc":["wmlsc"],"application/vnd.webturbo":["wtb"],"application/vnd.wolfram.player":["nbp"],"application/vnd.wordperfect":["wpd"],"application/vnd.wqd":["wqd"],"application/vnd.wt.stf":["stf"],"application/vnd.xara":["xar"],"application/vnd.xfdl":["xfdl"],"application/vnd.yamaha.hv-dic":["hvd"],"application/vnd.yamaha.hv-script":["hvs"],"application/vnd.yamaha.hv-voice":["hvp"],"application/vnd.yamaha.openscoreformat":["osf"],"application/vnd.yamaha.openscoreformat.osfpvg+xml":["osfpvg"],"application/vnd.yamaha.smaf-audio":["saf"],"application/vnd.yamaha.smaf-phrase":["spf"],"application/vnd.yellowriver-custom-menu":["cmp"],"application/vnd.zul":["zir","zirz"],"application/vnd.zzazz.deck+xml":["zaz"],"application/x-7z-compressed":["7z"],"application/x-abiword":["abw"],"application/x-ace-compressed":["ace"],"application/x-apple-diskimage":["*dmg"],"application/x-arj":["arj"],"application/x-authorware-bin":["aab","x32","u32","vox"],"application/x-authorware-map":["aam"],"application/x-authorware-seg":["aas"],"application/x-bcpio":["bcpio"],"application/x-bdoc":["*bdoc"],"application/x-bittorrent":["torrent"],"application/x-blorb":["blb","blorb"],"application/x-bzip":["bz"],"application/x-bzip2":["bz2","boz"],"application/x-cbr":["cbr","cba","cbt","cbz","cb7"],"application/x-cdlink":["vcd"],"application/x-cfs-compressed":["cfs"],"application/x-chat":["chat"],"application/x-chess-pgn":["pgn"],"application/x-chrome-extension":["crx"],"application/x-cocoa":["cco"],"application/x-conference":["nsc"],"application/x-cpio":["cpio"],"application/x-csh":["csh"],"application/x-debian-package":["*deb","udeb"],"application/x-dgc-compressed":["dgc"],"application/x-director":["dir","dcr","dxr","cst","cct","cxt","w3d","fgd","swa"],"application/x-doom":["wad"],"application/x-dtbncx+xml":["ncx"],"application/x-dtbook+xml":["dtb"],"application/x-dtbresource+xml":["res"],"application/x-dvi":["dvi"],"application/x-envoy":["evy"],"application/x-eva":["eva"],"application/x-font-bdf":["bdf"],"application/x-font-ghostscript":["gsf"],"application/x-font-linux-psf":["psf"],"application/x-font-pcf":["pcf"],"application/x-font-snf":["snf"],"application/x-font-type1":["pfa","pfb","pfm","afm"],"application/x-freearc":["arc"],"application/x-futuresplash":["spl"],"application/x-gca-compressed":["gca"],"application/x-glulx":["ulx"],"application/x-gnumeric":["gnumeric"],"application/x-gramps-xml":["gramps"],"application/x-gtar":["gtar"],"application/x-hdf":["hdf"],"application/x-httpd-php":["php"],"application/x-install-instructions":["install"],"application/x-iso9660-image":["*iso"],"application/x-iwork-keynote-sffkey":["*key"],"application/x-iwork-numbers-sffnumbers":["*numbers"],"application/x-iwork-pages-sffpages":["*pages"],"application/x-java-archive-diff":["jardiff"],"application/x-java-jnlp-file":["jnlp"],"application/x-keepass2":["kdbx"],"application/x-latex":["latex"],"application/x-lua-bytecode":["luac"],"application/x-lzh-compressed":["lzh","lha"],"application/x-makeself":["run"],"application/x-mie":["mie"],"application/x-mobipocket-ebook":["prc","mobi"],"application/x-ms-application":["application"],"application/x-ms-shortcut":["lnk"],"application/x-ms-wmd":["wmd"],"application/x-ms-wmz":["wmz"],"application/x-ms-xbap":["xbap"],"application/x-msaccess":["mdb"],"application/x-msbinder":["obd"],"application/x-mscardfile":["crd"],"application/x-msclip":["clp"],"application/x-msdos-program":["*exe"],"application/x-msdownload":["*exe","*dll","com","bat","*msi"],"application/x-msmediaview":["mvb","m13","m14"],"application/x-msmetafile":["*wmf","*wmz","*emf","emz"],"application/x-msmoney":["mny"],"application/x-mspublisher":["pub"],"application/x-msschedule":["scd"],"application/x-msterminal":["trm"],"application/x-mswrite":["wri"],"application/x-netcdf":["nc","cdf"],"application/x-ns-proxy-autoconfig":["pac"],"application/x-nzb":["nzb"],"application/x-perl":["pl","pm"],"application/x-pilot":["*prc","*pdb"],"application/x-pkcs12":["p12","pfx"],"application/x-pkcs7-certificates":["p7b","spc"],"application/x-pkcs7-certreqresp":["p7r"],"application/x-rar-compressed":["*rar"],"application/x-redhat-package-manager":["rpm"],"application/x-research-info-systems":["ris"],"application/x-sea":["sea"],"application/x-sh":["sh"],"application/x-shar":["shar"],"application/x-shockwave-flash":["swf"],"application/x-silverlight-app":["xap"],"application/x-sql":["sql"],"application/x-stuffit":["sit"],"application/x-stuffitx":["sitx"],"application/x-subrip":["srt"],"application/x-sv4cpio":["sv4cpio"],"application/x-sv4crc":["sv4crc"],"application/x-t3vm-image":["t3"],"application/x-tads":["gam"],"application/x-tar":["tar"],"application/x-tcl":["tcl","tk"],"application/x-tex":["tex"],"application/x-tex-tfm":["tfm"],"application/x-texinfo":["texinfo","texi"],"application/x-tgif":["*obj"],"application/x-ustar":["ustar"],"application/x-virtualbox-hdd":["hdd"],"application/x-virtualbox-ova":["ova"],"application/x-virtualbox-ovf":["ovf"],"application/x-virtualbox-vbox":["vbox"],"application/x-virtualbox-vbox-extpack":["vbox-extpack"],"application/x-virtualbox-vdi":["vdi"],"application/x-virtualbox-vhd":["vhd"],"application/x-virtualbox-vmdk":["vmdk"],"application/x-wais-source":["src"],"application/x-web-app-manifest+json":["webapp"],"application/x-x509-ca-cert":["der","crt","pem"],"application/x-xfig":["fig"],"application/x-xliff+xml":["*xlf"],"application/x-xpinstall":["xpi"],"application/x-xz":["xz"],"application/x-zmachine":["z1","z2","z3","z4","z5","z6","z7","z8"],"audio/vnd.dece.audio":["uva","uvva"],"audio/vnd.digital-winds":["eol"],"audio/vnd.dra":["dra"],"audio/vnd.dts":["dts"],"audio/vnd.dts.hd":["dtshd"],"audio/vnd.lucent.voice":["lvp"],"audio/vnd.ms-playready.media.pya":["pya"],"audio/vnd.nuera.ecelp4800":["ecelp4800"],"audio/vnd.nuera.ecelp7470":["ecelp7470"],"audio/vnd.nuera.ecelp9600":["ecelp9600"],"audio/vnd.rip":["rip"],"audio/x-aac":["aac"],"audio/x-aiff":["aif","aiff","aifc"],"audio/x-caf":["caf"],"audio/x-flac":["flac"],"audio/x-m4a":["*m4a"],"audio/x-matroska":["mka"],"audio/x-mpegurl":["m3u"],"audio/x-ms-wax":["wax"],"audio/x-ms-wma":["wma"],"audio/x-pn-realaudio":["ram","ra"],"audio/x-pn-realaudio-plugin":["rmp"],"audio/x-realaudio":["*ra"],"audio/x-wav":["*wav"],"chemical/x-cdx":["cdx"],"chemical/x-cif":["cif"],"chemical/x-cmdf":["cmdf"],"chemical/x-cml":["cml"],"chemical/x-csml":["csml"],"chemical/x-xyz":["xyz"],"image/prs.btif":["btif"],"image/prs.pti":["pti"],"image/vnd.adobe.photoshop":["psd"],"image/vnd.airzip.accelerator.azv":["azv"],"image/vnd.dece.graphic":["uvi","uvvi","uvg","uvvg"],"image/vnd.djvu":["djvu","djv"],"image/vnd.dvb.subtitle":["*sub"],"image/vnd.dwg":["dwg"],"image/vnd.dxf":["dxf"],"image/vnd.fastbidsheet":["fbs"],"image/vnd.fpx":["fpx"],"image/vnd.fst":["fst"],"image/vnd.fujixerox.edmics-mmr":["mmr"],"image/vnd.fujixerox.edmics-rlc":["rlc"],"image/vnd.microsoft.icon":["ico"],"image/vnd.ms-dds":["dds"],"image/vnd.ms-modi":["mdi"],"image/vnd.ms-photo":["wdp"],"image/vnd.net-fpx":["npx"],"image/vnd.pco.b16":["b16"],"image/vnd.tencent.tap":["tap"],"image/vnd.valve.source.texture":["vtf"],"image/vnd.wap.wbmp":["wbmp"],"image/vnd.xiff":["xif"],"image/vnd.zbrush.pcx":["pcx"],"image/x-3ds":["3ds"],"image/x-cmu-raster":["ras"],"image/x-cmx":["cmx"],"image/x-freehand":["fh","fhc","fh4","fh5","fh7"],"image/x-icon":["*ico"],"image/x-jng":["jng"],"image/x-mrsid-image":["sid"],"image/x-ms-bmp":["*bmp"],"image/x-pcx":["*pcx"],"image/x-pict":["pic","pct"],"image/x-portable-anymap":["pnm"],"image/x-portable-bitmap":["pbm"],"image/x-portable-graymap":["pgm"],"image/x-portable-pixmap":["ppm"],"image/x-rgb":["rgb"],"image/x-tga":["tga"],"image/x-xbitmap":["xbm"],"image/x-xpixmap":["xpm"],"image/x-xwindowdump":["xwd"],"message/vnd.wfa.wsc":["wsc"],"model/vnd.collada+xml":["dae"],"model/vnd.dwf":["dwf"],"model/vnd.gdl":["gdl"],"model/vnd.gtw":["gtw"],"model/vnd.mts":["mts"],"model/vnd.opengex":["ogex"],"model/vnd.parasolid.transmit.binary":["x_b"],"model/vnd.parasolid.transmit.text":["x_t"],"model/vnd.sap.vds":["vds"],"model/vnd.usdz+zip":["usdz"],"model/vnd.valve.source.compiled-map":["bsp"],"model/vnd.vtu":["vtu"],"text/prs.lines.tag":["dsc"],"text/vnd.curl":["curl"],"text/vnd.curl.dcurl":["dcurl"],"text/vnd.curl.mcurl":["mcurl"],"text/vnd.curl.scurl":["scurl"],"text/vnd.dvb.subtitle":["sub"],"text/vnd.fly":["fly"],"text/vnd.fmi.flexstor":["flx"],"text/vnd.graphviz":["gv"],"text/vnd.in3d.3dml":["3dml"],"text/vnd.in3d.spot":["spot"],"text/vnd.sun.j2me.app-descriptor":["jad"],"text/vnd.wap.wml":["wml"],"text/vnd.wap.wmlscript":["wmls"],"text/x-asm":["s","asm"],"text/x-c":["c","cc","cxx","cpp","h","hh","dic"],"text/x-component":["htc"],"text/x-fortran":["f","for","f77","f90"],"text/x-handlebars-template":["hbs"],"text/x-java-source":["java"],"text/x-lua":["lua"],"text/x-markdown":["mkd"],"text/x-nfo":["nfo"],"text/x-opml":["opml"],"text/x-org":["*org"],"text/x-pascal":["p","pas"],"text/x-processing":["pde"],"text/x-sass":["sass"],"text/x-scss":["scss"],"text/x-setext":["etx"],"text/x-sfv":["sfv"],"text/x-suse-ymp":["ymp"],"text/x-uuencode":["uu"],"text/x-vcalendar":["vcs"],"text/x-vcard":["vcf"],"video/vnd.dece.hd":["uvh","uvvh"],"video/vnd.dece.mobile":["uvm","uvvm"],"video/vnd.dece.pd":["uvp","uvvp"],"video/vnd.dece.sd":["uvs","uvvs"],"video/vnd.dece.video":["uvv","uvvv"],"video/vnd.dvb.file":["dvb"],"video/vnd.fvt":["fvt"],"video/vnd.mpegurl":["mxu","m4u"],"video/vnd.ms-playready.media.pyv":["pyv"],"video/vnd.uvvu.mp4":["uvu","uvvu"],"video/vnd.vivo":["viv"],"video/x-f4v":["f4v"],"video/x-fli":["fli"],"video/x-flv":["flv"],"video/x-m4v":["m4v"],"video/x-matroska":["mkv","mk3d","mks"],"video/x-mng":["mng"],"video/x-ms-asf":["asf","asx"],"video/x-ms-vob":["vob"],"video/x-ms-wm":["wm"],"video/x-ms-wmv":["wmv"],"video/x-ms-wmx":["wmx"],"video/x-ms-wvx":["wvx"],"video/x-msvideo":["avi"],"video/x-sgi-movie":["movie"],"video/x-smv":["smv"],"x-conference/x-cooltalk":["ice"]};

let Mime = Mime_1;
new Mime(standard, other);

if (typeof process !== 'undefined') {
	(process.env);
	process.stdout && process.stdout.isTTY;
}

var util$1 = {};

var types = {};

/* eslint complexity: [2, 18], max-statements: [2, 33] */
var shams$1 = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

var hasSymbols$2 = shams$1;

var shams = function hasToStringTagShams() {
	return hasSymbols$2() && !!Symbol.toStringTag;
};

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = shams$1;

var hasSymbols$1 = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr$1 = Object.prototype.toString;
var funcType = '[object Function]';

var implementation$1 = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$1.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var implementation = implementation$1;

var functionBind = Function.prototype.bind || implementation;

var bind$1 = functionBind;

var src = bind$1.call(Function.call, Object.prototype.hasOwnProperty);

var undefined$1;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD$1 = Object.getOwnPropertyDescriptor;
if ($gOPD$1) {
	try {
		$gOPD$1({}, '');
	} catch (e) {
		$gOPD$1 = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD$1
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD$1(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = hasSymbols$1();

var getProto$1 = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto$1(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto$1([][Symbol.iterator]()) : undefined$1,
	'%AsyncFromSyncIteratorPrototype%': undefined$1,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto$1(getProto$1([][Symbol.iterator]())) : undefined$1,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined$1 : getProto$1(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined$1 : getProto$1(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto$1(''[Symbol.iterator]()) : undefined$1,
	'%Symbol%': hasSymbols ? Symbol : undefined$1,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto$1(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = functionBind;
var hasOwn$1 = src;
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn$1(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn$1(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

var getIntrinsic = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn$1(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined$1;
			}
			if ($gOPD$1 && (i + 1) >= parts.length) {
				var desc = $gOPD$1(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn$1(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

var callBind$1 = {exports: {}};

(function (module) {

var bind = functionBind;
var GetIntrinsic = getIntrinsic;

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}
}(callBind$1));

var GetIntrinsic$1 = getIntrinsic;

var callBind = callBind$1.exports;

var $indexOf$1 = callBind(GetIntrinsic$1('String.prototype.indexOf'));

var callBound$3 = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic$1(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf$1(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

var hasToStringTag$3 = shams();
var callBound$2 = callBound$3;

var $toString$2 = callBound$2('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag$3 && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString$2(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString$2(value) !== '[object Array]' &&
		$toString$2(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

var isArguments = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag$2 = shams();
var getProto = Object.getPrototypeOf;
var getGeneratorFunc = function () { // eslint-disable-line consistent-return
	if (!hasToStringTag$2) {
		return false;
	}
	try {
		return Function('return function*() {}')();
	} catch (e) {
	}
};
var GeneratorFunction;

var isGeneratorFunction = function isGeneratorFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}
	if (isFnRegex.test(fnToStr.call(fn))) {
		return true;
	}
	if (!hasToStringTag$2) {
		var str = toStr.call(fn);
		return str === '[object GeneratorFunction]';
	}
	if (!getProto) {
		return false;
	}
	if (typeof GeneratorFunction === 'undefined') {
		var generatorFunc = getGeneratorFunc();
		GeneratorFunction = generatorFunc ? getProto(generatorFunc) : false;
	}
	return getProto(fn) === GeneratorFunction;
};

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

var foreach = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};

var possibleNames = [
	'BigInt64Array',
	'BigUint64Array',
	'Float32Array',
	'Float64Array',
	'Int16Array',
	'Int32Array',
	'Int8Array',
	'Uint16Array',
	'Uint32Array',
	'Uint8Array',
	'Uint8ClampedArray'
];

var g$2 = typeof globalThis === 'undefined' ? commonjsGlobal : globalThis;

var availableTypedArrays$2 = function availableTypedArrays() {
	var out = [];
	for (var i = 0; i < possibleNames.length; i++) {
		if (typeof g$2[possibleNames[i]] === 'function') {
			out[out.length] = possibleNames[i];
		}
	}
	return out;
};

var GetIntrinsic = getIntrinsic;

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

var getOwnPropertyDescriptor = $gOPD;

var forEach$1 = foreach;
var availableTypedArrays$1 = availableTypedArrays$2;
var callBound$1 = callBound$3;

var $toString$1 = callBound$1('Object.prototype.toString');
var hasToStringTag$1 = shams();

var g$1 = typeof globalThis === 'undefined' ? commonjsGlobal : globalThis;
var typedArrays$1 = availableTypedArrays$1();

var $indexOf = callBound$1('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var $slice$1 = callBound$1('String.prototype.slice');
var toStrTags$1 = {};
var gOPD$1 = getOwnPropertyDescriptor;
var getPrototypeOf$1 = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag$1 && gOPD$1 && getPrototypeOf$1) {
	forEach$1(typedArrays$1, function (typedArray) {
		var arr = new g$1[typedArray]();
		if (Symbol.toStringTag in arr) {
			var proto = getPrototypeOf$1(arr);
			var descriptor = gOPD$1(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf$1(proto);
				descriptor = gOPD$1(superProto, Symbol.toStringTag);
			}
			toStrTags$1[typedArray] = descriptor.get;
		}
	});
}

var tryTypedArrays$1 = function tryAllTypedArrays(value) {
	var anyTrue = false;
	forEach$1(toStrTags$1, function (getter, typedArray) {
		if (!anyTrue) {
			try {
				anyTrue = getter.call(value) === typedArray;
			} catch (e) { /**/ }
		}
	});
	return anyTrue;
};

var isTypedArray$1 = function isTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag$1 || !(Symbol.toStringTag in value)) {
		var tag = $slice$1($toString$1(value), 8, -1);
		return $indexOf(typedArrays$1, tag) > -1;
	}
	if (!gOPD$1) { return false; }
	return tryTypedArrays$1(value);
};

var forEach = foreach;
var availableTypedArrays = availableTypedArrays$2;
var callBound = callBound$3;

var $toString = callBound('Object.prototype.toString');
var hasToStringTag = shams();

var g = typeof globalThis === 'undefined' ? commonjsGlobal : globalThis;
var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = getOwnPropertyDescriptor;
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof g[typedArray] === 'function') {
			var arr = new g[typedArray]();
			if (Symbol.toStringTag in arr) {
				var proto = getPrototypeOf(arr);
				var descriptor = gOPD(proto, Symbol.toStringTag);
				if (!descriptor) {
					var superProto = getPrototypeOf(proto);
					descriptor = gOPD(superProto, Symbol.toStringTag);
				}
				toStrTags[typedArray] = descriptor.get;
			}
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var foundName = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!foundName) {
			try {
				var name = getter.call(value);
				if (name === typedArray) {
					foundName = name;
				}
			} catch (e) {}
		}
	});
	return foundName;
};

var isTypedArray = isTypedArray$1;

var whichTypedArray = function whichTypedArray(value) {
	if (!isTypedArray(value)) { return false; }
	if (!hasToStringTag || !(Symbol.toStringTag in value)) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};

(function (exports) {

var isArgumentsObject = isArguments;
var isGeneratorFunction$1 = isGeneratorFunction;
var whichTypedArray$1 = whichTypedArray;
var isTypedArray = isTypedArray$1;

function uncurryThis(f) {
  return f.call.bind(f);
}

var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';

var ObjectToString = uncurryThis(Object.prototype.toString);

var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);

if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}

if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}

function checkBoxedPrimitive(value, prototypeValueOf) {
  if (typeof value !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch(e) {
    return false;
  }
}

exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction$1;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
	return (
		(
			typeof Promise !== 'undefined' &&
			input instanceof Promise
		) ||
		(
			input !== null &&
			typeof input === 'object' &&
			typeof input.then === 'function' &&
			typeof input.catch === 'function'
		)
	);
}
exports.isPromise = isPromise;

function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }

  return (
    isTypedArray(value) ||
    isDataView(value)
  );
}
exports.isArrayBufferView = isArrayBufferView;


function isUint8Array(value) {
  return whichTypedArray$1(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;

function isUint8ClampedArray(value) {
  return whichTypedArray$1(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;

function isUint16Array(value) {
  return whichTypedArray$1(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;

function isUint32Array(value) {
  return whichTypedArray$1(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;

function isInt8Array(value) {
  return whichTypedArray$1(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;

function isInt16Array(value) {
  return whichTypedArray$1(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;

function isInt32Array(value) {
  return whichTypedArray$1(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;

function isFloat32Array(value) {
  return whichTypedArray$1(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;

function isFloat64Array(value) {
  return whichTypedArray$1(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;

function isBigInt64Array(value) {
  return whichTypedArray$1(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;

function isBigUint64Array(value) {
  return whichTypedArray$1(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;

function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = (
  typeof Map !== 'undefined' &&
  isMapToString(new Map())
);

function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }

  return isMapToString.working
    ? isMapToString(value)
    : value instanceof Map;
}
exports.isMap = isMap;

function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = (
  typeof Set !== 'undefined' &&
  isSetToString(new Set())
);
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }

  return isSetToString.working
    ? isSetToString(value)
    : value instanceof Set;
}
exports.isSet = isSet;

function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = (
  typeof WeakMap !== 'undefined' &&
  isWeakMapToString(new WeakMap())
);
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }

  return isWeakMapToString.working
    ? isWeakMapToString(value)
    : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;

function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = (
  typeof WeakSet !== 'undefined' &&
  isWeakSetToString(new WeakSet())
);
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;

function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  isArrayBufferToString(new ArrayBuffer())
);
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }

  return isArrayBufferToString.working
    ? isArrayBufferToString(value)
    : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  typeof DataView !== 'undefined' &&
  isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
);
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }

  return isDataViewToString.working
    ? isDataViewToString(value)
    : value instanceof DataView;
}
exports.isDataView = isDataView;

// Store a copy of SharedArrayBuffer in case it's deleted elsewhere
var SharedArrayBufferCopy = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined;
function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBufferCopy === 'undefined') {
    return false;
  }

  if (typeof isSharedArrayBufferToString.working === 'undefined') {
    isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy());
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBufferCopy;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;

function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;

function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;

function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;

function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;

function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;

function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;

function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;

function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;

function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;

function isBoxedPrimitive(value) {
  return (
    isNumberObject(value) ||
    isStringObject(value) ||
    isBooleanObject(value) ||
    isBigIntObject(value) ||
    isSymbolObject(value)
  );
}
exports.isBoxedPrimitive = isBoxedPrimitive;

function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (
    isArrayBuffer(value) ||
    isSharedArrayBuffer(value)
  );
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;

['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function(method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});
}(types));

var isBuffer = function isBuffer(arg) {
  return arg instanceof Buffer;
};

var inherits = {exports: {}};

var inherits_browser = {exports: {}};

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  inherits_browser.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    }
  };
} else {
  // old school shim for old browsers
  inherits_browser.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function () {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    }
  };
}

try {
  var util = require('util');
  /* istanbul ignore next */
  if (typeof util.inherits !== 'function') throw '';
  inherits.exports = util.inherits;
} catch (e) {
  /* istanbul ignore next */
  inherits.exports = inherits_browser.exports;
}

(function (exports) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/,/g, '$|^')
    .toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function(set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var length = output.reduce(function(prev, cur) {
    if (cur.indexOf('\n') >= 0) ;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types = types;

function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
exports.types.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = inherits.exports;

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
};

exports.promisify.custom = kCustomPromisifiedSymbol;

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb.bind(null, null, ret)); },
            function(rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)); });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;
}(util$1));

var eastasianwidth = {exports: {}};

(function (module) {
var eaw = {};

{
  module.exports = eaw;
}

eaw.eastAsianWidth = function(character) {
  var x = character.charCodeAt(0);
  var y = (character.length == 2) ? character.charCodeAt(1) : 0;
  var codePoint = x;
  if ((0xD800 <= x && x <= 0xDBFF) && (0xDC00 <= y && y <= 0xDFFF)) {
    x &= 0x3FF;
    y &= 0x3FF;
    codePoint = (x << 10) | y;
    codePoint += 0x10000;
  }

  if ((0x3000 == codePoint) ||
      (0xFF01 <= codePoint && codePoint <= 0xFF60) ||
      (0xFFE0 <= codePoint && codePoint <= 0xFFE6)) {
    return 'F';
  }
  if ((0x20A9 == codePoint) ||
      (0xFF61 <= codePoint && codePoint <= 0xFFBE) ||
      (0xFFC2 <= codePoint && codePoint <= 0xFFC7) ||
      (0xFFCA <= codePoint && codePoint <= 0xFFCF) ||
      (0xFFD2 <= codePoint && codePoint <= 0xFFD7) ||
      (0xFFDA <= codePoint && codePoint <= 0xFFDC) ||
      (0xFFE8 <= codePoint && codePoint <= 0xFFEE)) {
    return 'H';
  }
  if ((0x1100 <= codePoint && codePoint <= 0x115F) ||
      (0x11A3 <= codePoint && codePoint <= 0x11A7) ||
      (0x11FA <= codePoint && codePoint <= 0x11FF) ||
      (0x2329 <= codePoint && codePoint <= 0x232A) ||
      (0x2E80 <= codePoint && codePoint <= 0x2E99) ||
      (0x2E9B <= codePoint && codePoint <= 0x2EF3) ||
      (0x2F00 <= codePoint && codePoint <= 0x2FD5) ||
      (0x2FF0 <= codePoint && codePoint <= 0x2FFB) ||
      (0x3001 <= codePoint && codePoint <= 0x303E) ||
      (0x3041 <= codePoint && codePoint <= 0x3096) ||
      (0x3099 <= codePoint && codePoint <= 0x30FF) ||
      (0x3105 <= codePoint && codePoint <= 0x312D) ||
      (0x3131 <= codePoint && codePoint <= 0x318E) ||
      (0x3190 <= codePoint && codePoint <= 0x31BA) ||
      (0x31C0 <= codePoint && codePoint <= 0x31E3) ||
      (0x31F0 <= codePoint && codePoint <= 0x321E) ||
      (0x3220 <= codePoint && codePoint <= 0x3247) ||
      (0x3250 <= codePoint && codePoint <= 0x32FE) ||
      (0x3300 <= codePoint && codePoint <= 0x4DBF) ||
      (0x4E00 <= codePoint && codePoint <= 0xA48C) ||
      (0xA490 <= codePoint && codePoint <= 0xA4C6) ||
      (0xA960 <= codePoint && codePoint <= 0xA97C) ||
      (0xAC00 <= codePoint && codePoint <= 0xD7A3) ||
      (0xD7B0 <= codePoint && codePoint <= 0xD7C6) ||
      (0xD7CB <= codePoint && codePoint <= 0xD7FB) ||
      (0xF900 <= codePoint && codePoint <= 0xFAFF) ||
      (0xFE10 <= codePoint && codePoint <= 0xFE19) ||
      (0xFE30 <= codePoint && codePoint <= 0xFE52) ||
      (0xFE54 <= codePoint && codePoint <= 0xFE66) ||
      (0xFE68 <= codePoint && codePoint <= 0xFE6B) ||
      (0x1B000 <= codePoint && codePoint <= 0x1B001) ||
      (0x1F200 <= codePoint && codePoint <= 0x1F202) ||
      (0x1F210 <= codePoint && codePoint <= 0x1F23A) ||
      (0x1F240 <= codePoint && codePoint <= 0x1F248) ||
      (0x1F250 <= codePoint && codePoint <= 0x1F251) ||
      (0x20000 <= codePoint && codePoint <= 0x2F73F) ||
      (0x2B740 <= codePoint && codePoint <= 0x2FFFD) ||
      (0x30000 <= codePoint && codePoint <= 0x3FFFD)) {
    return 'W';
  }
  if ((0x0020 <= codePoint && codePoint <= 0x007E) ||
      (0x00A2 <= codePoint && codePoint <= 0x00A3) ||
      (0x00A5 <= codePoint && codePoint <= 0x00A6) ||
      (0x00AC == codePoint) ||
      (0x00AF == codePoint) ||
      (0x27E6 <= codePoint && codePoint <= 0x27ED) ||
      (0x2985 <= codePoint && codePoint <= 0x2986)) {
    return 'Na';
  }
  if ((0x00A1 == codePoint) ||
      (0x00A4 == codePoint) ||
      (0x00A7 <= codePoint && codePoint <= 0x00A8) ||
      (0x00AA == codePoint) ||
      (0x00AD <= codePoint && codePoint <= 0x00AE) ||
      (0x00B0 <= codePoint && codePoint <= 0x00B4) ||
      (0x00B6 <= codePoint && codePoint <= 0x00BA) ||
      (0x00BC <= codePoint && codePoint <= 0x00BF) ||
      (0x00C6 == codePoint) ||
      (0x00D0 == codePoint) ||
      (0x00D7 <= codePoint && codePoint <= 0x00D8) ||
      (0x00DE <= codePoint && codePoint <= 0x00E1) ||
      (0x00E6 == codePoint) ||
      (0x00E8 <= codePoint && codePoint <= 0x00EA) ||
      (0x00EC <= codePoint && codePoint <= 0x00ED) ||
      (0x00F0 == codePoint) ||
      (0x00F2 <= codePoint && codePoint <= 0x00F3) ||
      (0x00F7 <= codePoint && codePoint <= 0x00FA) ||
      (0x00FC == codePoint) ||
      (0x00FE == codePoint) ||
      (0x0101 == codePoint) ||
      (0x0111 == codePoint) ||
      (0x0113 == codePoint) ||
      (0x011B == codePoint) ||
      (0x0126 <= codePoint && codePoint <= 0x0127) ||
      (0x012B == codePoint) ||
      (0x0131 <= codePoint && codePoint <= 0x0133) ||
      (0x0138 == codePoint) ||
      (0x013F <= codePoint && codePoint <= 0x0142) ||
      (0x0144 == codePoint) ||
      (0x0148 <= codePoint && codePoint <= 0x014B) ||
      (0x014D == codePoint) ||
      (0x0152 <= codePoint && codePoint <= 0x0153) ||
      (0x0166 <= codePoint && codePoint <= 0x0167) ||
      (0x016B == codePoint) ||
      (0x01CE == codePoint) ||
      (0x01D0 == codePoint) ||
      (0x01D2 == codePoint) ||
      (0x01D4 == codePoint) ||
      (0x01D6 == codePoint) ||
      (0x01D8 == codePoint) ||
      (0x01DA == codePoint) ||
      (0x01DC == codePoint) ||
      (0x0251 == codePoint) ||
      (0x0261 == codePoint) ||
      (0x02C4 == codePoint) ||
      (0x02C7 == codePoint) ||
      (0x02C9 <= codePoint && codePoint <= 0x02CB) ||
      (0x02CD == codePoint) ||
      (0x02D0 == codePoint) ||
      (0x02D8 <= codePoint && codePoint <= 0x02DB) ||
      (0x02DD == codePoint) ||
      (0x02DF == codePoint) ||
      (0x0300 <= codePoint && codePoint <= 0x036F) ||
      (0x0391 <= codePoint && codePoint <= 0x03A1) ||
      (0x03A3 <= codePoint && codePoint <= 0x03A9) ||
      (0x03B1 <= codePoint && codePoint <= 0x03C1) ||
      (0x03C3 <= codePoint && codePoint <= 0x03C9) ||
      (0x0401 == codePoint) ||
      (0x0410 <= codePoint && codePoint <= 0x044F) ||
      (0x0451 == codePoint) ||
      (0x2010 == codePoint) ||
      (0x2013 <= codePoint && codePoint <= 0x2016) ||
      (0x2018 <= codePoint && codePoint <= 0x2019) ||
      (0x201C <= codePoint && codePoint <= 0x201D) ||
      (0x2020 <= codePoint && codePoint <= 0x2022) ||
      (0x2024 <= codePoint && codePoint <= 0x2027) ||
      (0x2030 == codePoint) ||
      (0x2032 <= codePoint && codePoint <= 0x2033) ||
      (0x2035 == codePoint) ||
      (0x203B == codePoint) ||
      (0x203E == codePoint) ||
      (0x2074 == codePoint) ||
      (0x207F == codePoint) ||
      (0x2081 <= codePoint && codePoint <= 0x2084) ||
      (0x20AC == codePoint) ||
      (0x2103 == codePoint) ||
      (0x2105 == codePoint) ||
      (0x2109 == codePoint) ||
      (0x2113 == codePoint) ||
      (0x2116 == codePoint) ||
      (0x2121 <= codePoint && codePoint <= 0x2122) ||
      (0x2126 == codePoint) ||
      (0x212B == codePoint) ||
      (0x2153 <= codePoint && codePoint <= 0x2154) ||
      (0x215B <= codePoint && codePoint <= 0x215E) ||
      (0x2160 <= codePoint && codePoint <= 0x216B) ||
      (0x2170 <= codePoint && codePoint <= 0x2179) ||
      (0x2189 == codePoint) ||
      (0x2190 <= codePoint && codePoint <= 0x2199) ||
      (0x21B8 <= codePoint && codePoint <= 0x21B9) ||
      (0x21D2 == codePoint) ||
      (0x21D4 == codePoint) ||
      (0x21E7 == codePoint) ||
      (0x2200 == codePoint) ||
      (0x2202 <= codePoint && codePoint <= 0x2203) ||
      (0x2207 <= codePoint && codePoint <= 0x2208) ||
      (0x220B == codePoint) ||
      (0x220F == codePoint) ||
      (0x2211 == codePoint) ||
      (0x2215 == codePoint) ||
      (0x221A == codePoint) ||
      (0x221D <= codePoint && codePoint <= 0x2220) ||
      (0x2223 == codePoint) ||
      (0x2225 == codePoint) ||
      (0x2227 <= codePoint && codePoint <= 0x222C) ||
      (0x222E == codePoint) ||
      (0x2234 <= codePoint && codePoint <= 0x2237) ||
      (0x223C <= codePoint && codePoint <= 0x223D) ||
      (0x2248 == codePoint) ||
      (0x224C == codePoint) ||
      (0x2252 == codePoint) ||
      (0x2260 <= codePoint && codePoint <= 0x2261) ||
      (0x2264 <= codePoint && codePoint <= 0x2267) ||
      (0x226A <= codePoint && codePoint <= 0x226B) ||
      (0x226E <= codePoint && codePoint <= 0x226F) ||
      (0x2282 <= codePoint && codePoint <= 0x2283) ||
      (0x2286 <= codePoint && codePoint <= 0x2287) ||
      (0x2295 == codePoint) ||
      (0x2299 == codePoint) ||
      (0x22A5 == codePoint) ||
      (0x22BF == codePoint) ||
      (0x2312 == codePoint) ||
      (0x2460 <= codePoint && codePoint <= 0x24E9) ||
      (0x24EB <= codePoint && codePoint <= 0x254B) ||
      (0x2550 <= codePoint && codePoint <= 0x2573) ||
      (0x2580 <= codePoint && codePoint <= 0x258F) ||
      (0x2592 <= codePoint && codePoint <= 0x2595) ||
      (0x25A0 <= codePoint && codePoint <= 0x25A1) ||
      (0x25A3 <= codePoint && codePoint <= 0x25A9) ||
      (0x25B2 <= codePoint && codePoint <= 0x25B3) ||
      (0x25B6 <= codePoint && codePoint <= 0x25B7) ||
      (0x25BC <= codePoint && codePoint <= 0x25BD) ||
      (0x25C0 <= codePoint && codePoint <= 0x25C1) ||
      (0x25C6 <= codePoint && codePoint <= 0x25C8) ||
      (0x25CB == codePoint) ||
      (0x25CE <= codePoint && codePoint <= 0x25D1) ||
      (0x25E2 <= codePoint && codePoint <= 0x25E5) ||
      (0x25EF == codePoint) ||
      (0x2605 <= codePoint && codePoint <= 0x2606) ||
      (0x2609 == codePoint) ||
      (0x260E <= codePoint && codePoint <= 0x260F) ||
      (0x2614 <= codePoint && codePoint <= 0x2615) ||
      (0x261C == codePoint) ||
      (0x261E == codePoint) ||
      (0x2640 == codePoint) ||
      (0x2642 == codePoint) ||
      (0x2660 <= codePoint && codePoint <= 0x2661) ||
      (0x2663 <= codePoint && codePoint <= 0x2665) ||
      (0x2667 <= codePoint && codePoint <= 0x266A) ||
      (0x266C <= codePoint && codePoint <= 0x266D) ||
      (0x266F == codePoint) ||
      (0x269E <= codePoint && codePoint <= 0x269F) ||
      (0x26BE <= codePoint && codePoint <= 0x26BF) ||
      (0x26C4 <= codePoint && codePoint <= 0x26CD) ||
      (0x26CF <= codePoint && codePoint <= 0x26E1) ||
      (0x26E3 == codePoint) ||
      (0x26E8 <= codePoint && codePoint <= 0x26FF) ||
      (0x273D == codePoint) ||
      (0x2757 == codePoint) ||
      (0x2776 <= codePoint && codePoint <= 0x277F) ||
      (0x2B55 <= codePoint && codePoint <= 0x2B59) ||
      (0x3248 <= codePoint && codePoint <= 0x324F) ||
      (0xE000 <= codePoint && codePoint <= 0xF8FF) ||
      (0xFE00 <= codePoint && codePoint <= 0xFE0F) ||
      (0xFFFD == codePoint) ||
      (0x1F100 <= codePoint && codePoint <= 0x1F10A) ||
      (0x1F110 <= codePoint && codePoint <= 0x1F12D) ||
      (0x1F130 <= codePoint && codePoint <= 0x1F169) ||
      (0x1F170 <= codePoint && codePoint <= 0x1F19A) ||
      (0xE0100 <= codePoint && codePoint <= 0xE01EF) ||
      (0xF0000 <= codePoint && codePoint <= 0xFFFFD) ||
      (0x100000 <= codePoint && codePoint <= 0x10FFFD)) {
    return 'A';
  }

  return 'N';
};

eaw.characterLength = function(character) {
  var code = this.eastAsianWidth(character);
  if (code == 'F' || code == 'W' || code == 'A') {
    return 2;
  } else {
    return 1;
  }
};

// Split a string considering surrogate-pairs.
function stringToArray(string) {
  return string.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
}

eaw.length = function(string) {
  var characters = stringToArray(string);
  var len = 0;
  for (var i = 0; i < characters.length; i++) {
    len = len + this.characterLength(characters[i]);
  }
  return len;
};

eaw.slice = function(text, start, end) {
  textLen = eaw.length(text);
  start = start ? start : 0;
  end = end ? end : 1;
  if (start < 0) {
      start = textLen + start;
  }
  if (end < 0) {
      end = textLen + end;
  }
  var result = '';
  var eawLen = 0;
  var chars = stringToArray(text);
  for (var i = 0; i < chars.length; i++) {
    var char = chars[i];
    var charLen = eaw.length(char);
    if (eawLen >= start - (charLen == 2 ? 1 : 0)) {
        if (eawLen + charLen <= end) {
            result += char;
        } else {
            break;
        }
    }
    eawLen += charLen;
  }
  return result;
};
}(eastasianwidth));

function getLoggerLocale() {
  const defaultLocale = "en-US";
  if (process.env.LANG) {
    const extractedLocale = process.env.LANG.split(".")[0].replace(/_/g, "-");
    if (extractedLocale.length < 2)
      return defaultLocale;
    else
      return extractedLocale.substring(0, 5);
  } else
    return defaultLocale;
}
new Intl.DateTimeFormat(getLoggerLocale(), {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});
if (typeof process !== "undefined") {
  if (process.argv.includes("--verbose")) ; else if (process.argv.includes("--silent")) ; else ;
}

function createRouteData(pattern, params, component, pathname, type, segments) {
  return {
    type,
    pattern,
    params,
    component,
    generate: () => "",
    pathname: pathname || void 0,
    segments
  };
}
function deserializeRouteData(rawRouteData) {
  const { component, params, pathname, type, segments } = rawRouteData;
  const pattern = new RegExp(rawRouteData.pattern);
  return createRouteData(pattern, params, component, pathname, type, segments);
}

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push(__spreadProps(__spreadValues({}, serializedRoute), {
      routeData: deserializeRouteData(serializedRoute.routeData)
    }));
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  return __spreadProps(__spreadValues({}, serializedManifest), {
    routes
  });
}

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) ; else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

const STYLE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".css",
  ".pcss",
  ".postcss",
  ".scss",
  ".sass",
  ".styl",
  ".stylus",
  ".less"
]);
new RegExp(`\\.(${Array.from(STYLE_EXTENSIONS).map((s) => s.slice(1)).join("|")})($|\\?)`);

const SCRIPT_EXTENSIONS = /* @__PURE__ */ new Set([".js", ".ts"]);
new RegExp(`\\.(${Array.from(SCRIPT_EXTENSIONS).map((s) => s.slice(1)).join("|")})($|\\?)`);

const _manifest = Object.assign(deserializeManifest({"routes":[{"file":"","links":["assets/asset.13a4314d.css"],"scripts":[],"routeData":{"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/"}},{"file":"","links":["assets/asset.1a99e231.css"],"scripts":[],"routeData":{"type":"page","pattern":"^\\/settings\\/?$","segments":[[{"content":"settings","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/settings.astro","pathname":"/settings"}},{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","pattern":"^\\/mollie\\/cancel-subscription$","segments":[[{"content":"mollie","dynamic":false,"spread":false}],[{"content":"cancel-subscription","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/mollie/cancel-subscription.js","pathname":"/mollie/cancel-subscription"}},{"file":"","links":[],"scripts":["entry.c4b37ab1.js"],"routeData":{"type":"page","pattern":"^\\/mollie\\/webhook-test\\/?$","segments":[[{"content":"mollie","dynamic":false,"spread":false}],[{"content":"webhook-test","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/mollie/webhook-test.astro","pathname":"/mollie/webhook-test"}},{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","pattern":"^\\/mollie\\/webhook$","segments":[[{"content":"mollie","dynamic":false,"spread":false}],[{"content":"webhook","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/mollie/webhook.js","pathname":"/mollie/webhook"}},{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","pattern":"^\\/mollie\\/pay$","segments":[[{"content":"mollie","dynamic":false,"spread":false}],[{"content":"pay","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/mollie/pay.js","pathname":"/mollie/pay"}},{"file":"","links":["assets/asset.1c905fcc.css"],"scripts":[],"routeData":{"type":"page","pattern":"^\\/mollie\\/cb\\/?$","segments":[[{"content":"mollie","dynamic":false,"spread":false}],[{"content":"cb","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/mollie/cb.astro","pathname":"/mollie/cb"}},{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","pattern":"^\\/mollie\\/([^/]+?)\\/payment-cb$","segments":[[{"content":"mollie","dynamic":false,"spread":false}],[{"content":"token","dynamic":true,"spread":false}],[{"content":"payment-cb","dynamic":false,"spread":false}]],"params":["token"],"component":"src/pages/mollie/[token]/payment-cb.js"}},{"file":"","links":["assets/asset.578b007c.css"],"scripts":[],"routeData":{"type":"page","pattern":"^\\/admin\\/?$","segments":[[{"content":"admin","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/admin/index.astro","pathname":"/admin"}},{"file":"","links":["assets/asset.e288dee8.css"],"scripts":[],"routeData":{"type":"page","pattern":"^\\/admin\\/([^/]+?)\\/?$","segments":[[{"content":"admin","dynamic":false,"spread":false}],[{"content":"user","dynamic":true,"spread":false}]],"params":["user"],"component":"src/pages/admin/[user].astro"}},{"file":"","links":["assets/asset.1c905fcc.css"],"scripts":[],"routeData":{"type":"page","pattern":"^\\/error\\/?$","segments":[[{"content":"error","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/error.astro","pathname":"/error"}},{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","pattern":"^\\/utils\\/auth$","segments":[[{"content":"utils","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/utils/auth.js","pathname":"/utils/auth"}},{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","pattern":"^\\/auth\\/success$","segments":[[{"content":"auth","dynamic":false,"spread":false}],[{"content":"success","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/auth/success.js","pathname":"/auth/success"}},{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","pattern":"^\\/auth\\/logout$","segments":[[{"content":"auth","dynamic":false,"spread":false}],[{"content":"logout","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/auth/logout.js","pathname":"/auth/logout"}},{"file":"","links":["assets/asset.1c905fcc.css"],"scripts":[],"routeData":{"type":"page","pattern":"^\\/auth\\/login\\/?$","segments":[[{"content":"auth","dynamic":false,"spread":false}],[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/auth/login.astro","pathname":"/auth/login"}},{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","pattern":"^\\/db\\/ActivationToken$","segments":[[{"content":"db","dynamic":false,"spread":false}],[{"content":"ActivationToken","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/db/ActivationToken.js","pathname":"/db/ActivationToken"}},{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","pattern":"^\\/db\\/User$","segments":[[{"content":"db","dynamic":false,"spread":false}],[{"content":"User","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/db/User.js","pathname":"/db/User"}},{"file":"","links":["assets/asset.adad2329.css"],"scripts":[],"routeData":{"type":"page","pattern":"^\\/([^/]+?)\\/subscribe\\/?$","segments":[[{"content":"course","dynamic":true,"spread":false}],[{"content":"subscribe","dynamic":false,"spread":false}]],"params":["course"],"component":"src/pages/[course]/subscribe.astro"}},{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","pattern":"^\\/([^/]+?)(?:\\/(.*?))?\\/courseIndex$","segments":[[{"content":"course","dynamic":true,"spread":false}],[{"content":"...all","dynamic":true,"spread":true}],[{"content":"courseIndex","dynamic":false,"spread":false}]],"params":["course","...all"],"component":"src/pages/[course]/[...all]/courseIndex.js"}},{"file":"","links":["assets/asset.d2e214b0.css"],"scripts":["entry.e9b8519c.js"],"routeData":{"type":"page","pattern":"^\\/([^/]+?)(?:\\/(.*?))?\\/?$","segments":[[{"content":"course","dynamic":true,"spread":false}],[{"content":"...all","dynamic":true,"spread":true}]],"params":["course","...all"],"component":"src/pages/[course]/[...all]/index.astro"}}],"site":"https://my-astro-course.netlify.app/","markdown":{"mode":"mdx","drafts":false,"syntaxHighlight":"shiki","shikiConfig":{"langs":[],"theme":"github-dark","wrap":false},"remarkPlugins":[],"rehypePlugins":[]},"pageMap":null,"renderers":[],"entryModules":{"/src/pages/mollie/webhook-test.astro/hoisted.js":"entry.c4b37ab1.js","/src/components/quiz-next-card.js":"entry.b6d72022.js","/src/components/quiz-question.js":"entry.ade8cbe0.js","astro/client/visible.js":"entry.9125fc96.js","astro/client/idle.js":"entry.3dd0b2fa.js","/src/pages/[course]/[...all]/index.astro/hoisted.js":"entry.e9b8519c.js","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","astro:scripts/before-hydration.js":"data:text/javascript;charset=utf-8,//[no before-hydration script]"}}), {
	pageMap: pageMap,
	renderers: renderers
});
const _args = {};

const _exports = adapter.createExports(_manifest, _args);
const handler = _exports['handler'];

const _start = 'start';
if(_start in adapter) {
	adapter[_start](_manifest, _args);
}

export { handler };
