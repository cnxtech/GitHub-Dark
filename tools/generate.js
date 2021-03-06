#!/usr/bin/env node
"use strict";

const css = require("css");
const cssMediaQuery = require("css-mediaquery");
const fetch = require("make-fetch-happen");
const fs = require("fs-extra");
const parse5 = require("parse5");
const path = require("path");
const perfectionist = require("perfectionist");
const urlToolkit = require("url-toolkit");

// This list maps old declarations to new ones. Ordering is significant.
// $ indicates a special value that will generate a set of rules.
let mappings = {
  // ==========================================================================
  // Background
  // ==========================================================================
  "$background: #fff":    "#181818",
  "$background: #fdfdfd": "#1c1c1c",
  "$background: #fafbfc": "#181818",
  "$background: #f6f8fa": "#202020",
  "$background: #f4f4f4": "#242424",
  "$background: #eff3f6": "#343434",
  "$background: #eaecef": "#343434",
  "$background: #e6ebf1": "#444",
  "$background: #e1e4e8": "#343434",
  "$background: #dfe2e5": "#383838",
  "$background: #d6e2f1": "#444",
  "$background: #d3e2f4": "#383838",
  "$background: #d1d5da": "#404040",
  "$background: #c6cbd1": "#484848",
  "$background: #6a737d": "#303030",
  "$background: #24292e": "#181818",
  "$background: #f9f9f9": "#181818",
  "$background: #4183C4": "/*[[base-color]]*/ #4f8cc9",
  "$background: hsla(0,0%,100%,.125)": "hsla(0,0%,100%,.05)",
  "$background: hsla(0,0%,100%,.175)": "hsla(0,0%,100%,.1)",

  // ==========================================================================
  // Border
  // ==========================================================================
  "$border: transparent": "transparent", // needs to come before the color variants
  "$border: rgba(27,31,35,.1)": "rgba(200,200,200,.1)",
  "$border: rgba(27,31,35,.15)": "rgba(200,200,200,.15)",

  "$border: #959da5": "#484848",
  "$border: #c3c8cf": "#484848",
  "$border: #dfe2e5": "#343434",
  "$border: #d1d5da": "#404040",
  "$border: #ddd":    "#343434",
  "$border: #e1e4e8": "#343434",
  "$border: #e6ebf1": "#343434",
  "$border: #eaecef": "#343434",
  "$border: #eee":    "#343434",
  "$border: #f6f8fa": "#202020",
  "$border: #f8f8f8": "#343434",
  "$border: #fff":    "#181818",

  "border-top: 8px solid rgba(27,31,35,.15)": "border-top-color: rgba(200,200,200,.15)",
  "border-bottom-color: #e36209": "border-bottom-color: #eee",

  "border: 1px solid": "border-color: #181818",
  "border-top: 7px solid #fff": "border-top-color: #181818",
  "border-color: #dfe2e5 #dfe2e5 #fff": "border-color: #343434 #343434 #181818",

  // ==========================================================================
  // Box-Shadow
  // ==========================================================================

  "box-shadow: 0 0 0 .2em rgba(3,102,214,.3)": `
     box-shadow: 0 0 0 2px rgba(79,140,201,.3);
     box-shadow: 0 0 0 2px rgba(/*[[base-color-rgb]]*/, .3);
  `,

  "box-shadow: 0 0 0 .2em #c8e1ff": `
     box-shadow: 0 0 0 2px rgba(79,140,201,.3);
     box-shadow: 0 0 0 2px rgba(/*[[base-color-rgb]]*/, .3);
  `,

  "box-shadow: inset 0 1px 2px rgba(27,31,35,.075),0 0 0 .2em rgba(3,102,214,.3)": `
    box-shadow: 0 0 0 2px rgba(79,140,201,.3);
    box-shadow: 0 0 0 2px rgba(/*[[base-color-rgb]]*/, .3);
  `,

  "box-shadow: 0 1px 0 0 rgba(16,116,231,.5)": `
    box-shadow: 0 1px 0 0 rgba(79,140,201,.5);
    box-shadow: 0 1px 0 0 rgba(/*[[base-color-rgb]]*/, .5);
  `,

  "box-shadow: 0 1px 0 0 #1074e7": `
    box-shadow: 0 1px 0 0 #4f8cc9;
    box-shadow: 0 1px 0 0 /*[[base-color]]*/;
  `,

  "box-shadow: inset 0 1px 2px rgba(27,31,35,0.075),0 0 0 0.2em rgba(3,102,214,0.3)": `
    box-shadow: inset 0 1px 2px 0 rgba(27,31,35,.04),0 0 0 0.1em rgba(79, 140, 201, 6);
    box-shadow: inset 0 1px 2px 0 rgba(27,31,35,.04),0 0 0 0.1em rgba(/*[[base-color-rgb]]*/, .6);
  `,

  "box-shadow: 0 0 0 .2em rgba(203,36,49,.4)": "box-shadow: 0 0 0 .2em rgba(255,68,68,.4)",

  "box-shadow: 0 1px 5px rgba(27,31,35,.15)": "box-shadow: 0 1px 5px #000",

  "box-shadow: inset 0 0 0 1px #e1e4e8,0 2px 4px rgba(0,0,0,.15)": "box-shadow: inset 0 0 0 1px #555",
  "box-shadow: inset 0 0 0 1px #e1e4e8": "box-shadow: inset 0 0 0 1px #555",
  "box-shadow: inset 0 1px 0 0 #e1e4e8": "box-shadow: inset 0 1px 0 0 #555",
  "box-shadow: inset 0 -1px 0 #c6cbd1": "box-shadow: inset 0 -2px 0 #343434",

  "box-shadow: 0 1px 0 0 #0058a2": "box-shadow: 0 1px 0 0 /*[[base-color]]*/ #4f8cc9",

  // ==========================================================================
  // Color / Background
  // ==========================================================================

  "color: #05264c": "color: #bebebe", // big commit title
  "color: #333": "color: #bebebe",
  "color: #3c4146": "color: #bebebe",
  "color: #444d56": "color: #afafaf",
  "color: #1b1f23": "color: #afafaf",
  "color: #666"   : "color: #8e8e8e",
  "color: #6a737d": "color: #8e8e8e",
  "color: #959da5": "color: #757575",
  "color: #767676": "color: #767676",
  "color: #a3aab1": "color: #757575",
  "color: #c3c8cf": "color: #5a5a5a",
  "color: #c6cbd1": "color: #5a5a5a",
  "color: #d1d5da": "color: #404040",
  "color: #4183C4": `
    color: rgba(79,140,201,.9);
    color: rgba(/*[[base-color-rgb]]*/,.9);
  `,
  "color: #005b9e": `
    color: rgba(79,140,201,1);
    color: rgba(/*[[base-color-rgb]]*/,1);
  `,
  "color: rgba(27,31,35,.6)": "color: #9daccc",
  "color: rgba(27,31,35,.85)": "color: rgba(230,230,230,.85)",
  "color: rgba(27,31,35,.3)": "color: rgba(230,230,230,.3)",
  "color: hsla(0,0%,100%,.5)": "color: hsla(0,0%,100%,.5)",
  "color: hsla(0,0%,100%,.6)": "color: hsla(0,0%,100%,.6)",
  "color: hsla(0,0%,100%,.75)": "color: hsla(0,0%,100%,.75)",
  "fill: #959da5": "fill: #757575",

  // needs to be after #333 for .btn vs .btn-outline
  "color: #0366d6": "color: /*[[base-color]]*/ #4f8cc9",
  "color: #1074e7": "color: /*[[base-color]]*/ #4f8cc9",
  // needs to be after #0366d3 for .btn-link vs .text-gray
  "color: #586069": "color: #949494",
  "color: rgba(88,96,105,.5)": "color: rgba(148,148,148,.5)",
  // needs to be after #0366d3 for .btn-link vs .text-gray-dark
  "color: #24292e": "color: #d2d2d2",
  "color: #2f363d": "color: #bebebe",

  // blue
  "color: #264c72": "color: #9daccc",
  "color: #032f62": "color: #9daccc",
  "$background: #f1f8ff": "#182030",
  "$background: #032f62": "#182030",
  "$background: #dbedff": "#182030",
  "$border: #f1f8ff": "#182030",

  "color: #c0d3eb": "color: #224466",
  "$border: #c8e1ff": "#224466",
  "$border: #c0d3eb": "#224466",

  // blue (base-color)
  "color: #327fc7": "color: /*[[base-color]]*/ #4f8cc9",
  "$background: #0366d6": "/*[[base-color]]*/ #4f8cc9; color: #fff",
  "$border: #0366d6": "/*[[base-color]]*/ #4f8cc9",
  "filter: drop-shadow(-.25em 0 0 #c8e1ff)": `
    filter: drop-shadow(-.25em 0 0 rgba(79,140,201,.3));
    filter: drop-shadow(-.25em 0 0 rgba(/*[[base-color-rgb]]*/, .3))
  `,
  "filter: drop-shadow(0 -.28em 0 #c8e1ff)": `
    filter: drop-shadow(0 -.28em 0 rgba(79,140,201,.3));
    filter: drop-shadow(0 -.28em 0 rgba(/*[[base-color-rgb]]*/, .3))
  `,
  "$border: #2188ff": "/*[[base-color]]*/ #4f8cc9",

  // red
  "color: #cb2431": "color: #f44",
  "color: #86181d": "color: #f44",
  "$background: #d73a49": "#f44",
  "$background: #cb2431": "#911",
  "$background: #ffdce0": "#300",
  "fill: #cb2431": "fill: #f44",
  "$border: #d73a49": "#b00",

  // orange
  "color: #a04100": "color: #f3582c",
  "$background: #d15704": "#f3582c",
  "$background: #fb8532": "#f3582c",

  // green
  "color: #28a745": "color: #6cc644",
  "color: #165c26": "color: #6cc644",
  "$background: #28a745": "#6cc644",
  "$background: #2cbe4e": "#163",
  "$background: #dcffe4": "#002800",
  "$background: rgba(108,198,68,.1)": "#002800",
  "fill: #2cbe4e": "fill: #6cc644",
  "$border: #34d058": "#34d058",

  // yellow
  "color: rgba(47,38,6,.5)": "color: #cb4",
  "color: #b08800": "color: #cb4",
  "color: #735c0f": "color: #bba257",
  "color: #613A00": "color: #bba257",
  "$background: #ffd33d": "#cb4",
  "$background: #ffdf5d": "#cb4",
  "$background: #fffbdd": "#261d08",
  "fill: #dbab09": "fill: #cb4",
  "$border: #fffbdd": "#321",
  "$border: #ffdf5d": "#321",
  "$border: #d9d0a5": "#542",
  "$border: #dca874": "#542",

  // light yellow
  "$background: #fff5b1": "#651",

  // purple
  "color: #6f42c1": "color: #8368aa",
  "$background: #6f42c1": "#8368aa",
  "$background: #f8f4ff": "#213",
  "$background: #f5f0ff": "#213",
  "$border: #6f42c1": "#8368aa",
  "$border: #8a63d2": "#8368aa",

  "fill: currentColor": "fill: currentColor",
  "color: inherit": "color: inherit",
  "box-shadow: none": "box-shadow: none",
  "$background: none": "none",
};

// list of sites to pull stylesheets from. Accepts fetch options. If `prefix`
// is  set, will prefix all selectors obtained from this source, unless they
// start with one of the selectors in `match`. If `url` ends with .css, will
// directly load that stylesheet.
const sources = [
  {url: "https://github.com"},
  {url: "https://gist.github.com"},
  {url: "https://help.github.com"},
  {
    url: "https://developer.github.com",
    prefix: "html[prefix]",
  },
  {
    url: "https://github.com/login",
    prefix: `body[class="page-responsive"]`,
    match: ["body", ".page-responsive"],
    opts: {headers: {"User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Mobile Safari/537.36"}},
  },
  {
    url: "https://raw.githubusercontent.com/sindresorhus/refined-github/master/source/content.css",
    prefix: "html.refined-github",
  },
  {
    url: "https://render.githubusercontent.com/view/pdf?enc_url=68747470733a2f2f7261772e67697468756275736572636f6e74656e742e636f6d2f74706e2f706466732f623037326638386234633836303762343561303866386236393331633037313630623462316466382f41253230436f75727365253230696e2532304d616368696e652532304c6561726e696e672532302863696d6c2d76305f392d616c6c292e706466",
  }
];

// list of regexes matching selectors that should be ignored
const ignoreSelectors = [
  /\.CodeMirror/,
  /\.cm-/, // CodeMirror
  /\.pl-/, // GitHub Pretty Lights Syntax highlighter
  /\spre$/,
  /:not\(li\.moved\)/,
  /^.Popover-message:before$/,
  /^.Popover-message:after$/,
  /^h[1-6] a$/, // weird styles from help.github.com
  /^\.bg-white$/,
  /^\.CircleBadge$/,
  /^table$/,
  /^.text-gray-dark$/,
  /^.markdown-body del$/, // this in not main page style
  /^.dashboard .js-all-activity-header \+ div$/, // weird background style from refined-github
];

// list of regexes matching selectors that shouldn't be merged with other
// selectors because they can generate invalid rules.
const unmergeableSelectors = [
  /(-moz-|-ms-|-o-|-webkit-).+/,
];

// list of shorthand properties where values are compared insensitively
// to their order, e.g. "1px solid red" is equal to "1px red solid".
const shorthands = [
  "border",
  "border-left",
  "border-right",
  "border-top",
  "border-bottom",
  "background",
  "font"
];

// a device we optimize for, used to remove mobile-only media queries
const device = {
  type: "screen",
  width: "1024px",
};

const perfOpts = {
  maxSelectorLength: 76, // -4 because of indentation and to accomodate ' {'
  indentSize: 2,
};

const replaceRe = /.*begin auto-generated[\s\S]+end auto-generated.*/gm;
const cssFile = path.join(__dirname, "..", "github-dark.css");

let mappingKeys;

async function writeOutput(generatedCss) {
  const css = await fs.readFile(cssFile, "utf8");
  await fs.writeFile(cssFile, css.replace(replaceRe, generatedCss));
}

async function extractStyleLinks(res) {
  const styleUrls = [];
  for (const href of extractStyleHrefs(await res.text())) {
    styleUrls.push(urlToolkit.buildAbsoluteURL(res.url, href));
  }
  return styleUrls;
}

function extractStyleHrefs(html) {
  return (html.match(/<link.+?>/g) || []).map(link => {
    const attrs = {};
    parse5.parseFragment(link).childNodes[0].attrs.forEach(attr => {
      attrs[attr.name] = attr.value;
    });
    if (attrs.rel === "stylesheet" && attrs.href) {
      return attrs.href;
    }
  }).filter(link => !!link);
}

function parseDeclarations(cssString, opts) {
  const decls = {};
  const stylesheet = css.parse(cssString).stylesheet;

  stylesheet.rules.forEach(rule => {
    if (rule.type === "media" && mediaMatches(rule.media)) {
      rule.rules.forEach(rule => parseRule(decls, rule, opts));
    }

    if (!rule.selectors || rule.selectors.length === 0) return;
    parseRule(decls, rule, opts);
  });

  return decls;
}

function parseRule(decls, rule, opts) {
  for (const decl of rule.declarations) {
    if (!decl.value) continue;
    for (const mapping of mappingKeys) {
      const [prop, val] = mapping.split(": ");
      if (decl.property !== prop) continue;
      if (!isEqualValue(prop, decl.value, val)) continue;

      let name = mapping;
      if (decl.value.trim().endsWith("!important")) {
        name = `${mapping} !important`;
      }

      if (!decls[name]) decls[name] = [];

      rule.selectors.forEach(selector => {
        // Skip potentially unmergeable selectors
        // TODO: Use clean-css or similar to merge rules later instead
        if (unmergeableSelectors.some(re => re.test(selector))) return;

        // Skip ignored selectors
        if (ignoreSelectors.some(re => re.test(selector))) return;

        // stylistic tweaks
        selector = selector.replace(/\+/g, " + ");
        selector = selector.replace(/~/g, " ~ ");
        selector = selector.replace(/>/g, " > ");
        selector = selector.replace(/ {2,}/g, " ");

        // add prefix
        if (opts.prefix) {
          // skip adding a prefix if it matches a selector in `match`
          let skip = false;
          if (opts.match) {
            for (const matchSelector of opts.match) {
              if (selector.split(/\s+/)[0].includes(matchSelector)) {
                skip = true;
                break;
              }
            }
          }

          if (!skip) {
            // incomplete check to avoid generating invalid "html :root" selectors
            if (selector.startsWith(":root ") && opts.prefix.startsWith("html")) {
              selector = `${opts.prefix} ${selector.substring(":root ".length)}`;
            } else {
              selector = `${opts.prefix} ${selector}`;
            }
          }
        }

        // add the new rule to our list, unless it's already on it
        if (!decls[name].includes(selector)) {
          decls[name].push(selector);
        }
      });
    }
  }
}

function format(css) {
  return String(perfectionist.process(css, perfOpts));
}

function buildOutput(decls) {
  let output = "/* begin auto-generated rules - use tools/generate.js to generate them */\n";

  for (const [fromValue, toValue] of Object.entries(mappings)) {
    const normalSelectors = decls[fromValue];
    const importantSelectors = decls[`${fromValue} !important`];

    if (normalSelectors && normalSelectors.length) {
      const newValue = toValue.trim().replace(/;$/, "");
      output += `/* auto-generated rule for "${fromValue}" */\n`;
      output += format(`${normalSelectors.join(",")} {${newValue};}`);
    }

    if (importantSelectors && importantSelectors.length) {
      const newValue = toValue.trim().replace(/;$/, "").split(";").map(v => `${v} !important`).join(";");
      output += `/* auto-generated rule for "${fromValue} !important" */\n`;
      output += format(`${importantSelectors.join(",")} {${newValue};}`);
    }
  }
  output += "/* end auto-generated rules */";
  return output.split("\n").map(line => "  " + line).join("\n");
}

function isEqualValue(prop, a, b) {
  a = a.replace(/!important$/g, "").trim().toLowerCase();
  b = b.replace(/!important$/g, "").trim().toLowerCase();

  // try to ignore order in shorthands
  if (shorthands.includes(prop)) {
    return a.split(" ").sort().join(" ") === b.split(" ").sort().join(" ");
  } else {
    return a === b;
  }
}

function mediaMatches(query) {
  try {
    return cssMediaQuery.match(query, device);
  } catch (err) {
    // this library has a few bugs. In case of error, we include the rule.
    return true;
  }
}

function exit(err) {
  if (err) console.error(err);
  process.exit(err ? 1 : 0);
}

function prepareMappings(mappings) {
  const newMappings = {};
  for (const [key, value] of Object.entries(mappings)) {
    if (key.startsWith("$border: ")) {
      const oldValue = key.substring("$border: ".length);
      newMappings[`border: 1px solid ${oldValue}`] = `border-color: ${value}`;
      newMappings[`border: 1px dashed ${oldValue}`] = `border-color: ${value}`;
      newMappings[`border: 2px solid ${oldValue}`] = `border-color: ${value}`;
      newMappings[`border: 2px dashed ${oldValue}`] = `border-color: ${value}`;
      newMappings[`border: 5px solid ${oldValue}`] = `border-color: ${value}`;
      newMappings[`border-color: ${oldValue}`] = `border-color: ${value}`;
      newMappings[`border-top: 1px solid ${oldValue}`] = `border-top-color: ${value}`;
      newMappings[`border-bottom: 1px solid ${oldValue}`] = `border-bottom-color: ${value}`;
      newMappings[`border-left: 1px solid ${oldValue}`] = `border-left-color: ${value}`;
      newMappings[`border-right: 1px solid ${oldValue}`] = `border-right-color: ${value}`;
      newMappings[`border-top: 1px dashed ${oldValue}`] = `border-top-color: ${value}`;
      newMappings[`border-bottom: 1px dashed ${oldValue}`] = `border-bottom-color: ${value}`;
      newMappings[`border-left: 1px dashed ${oldValue}`] = `border-left-color: ${value}`;
      newMappings[`border-right: 1px dashed ${oldValue}`] = `border-right-color: ${value}`;
      newMappings[`border-top: 2px solid ${oldValue}`] = `border-top-color: ${value}`;
      newMappings[`border-bottom: 2px solid ${oldValue}`] = `border-bottom-color: ${value}`;
      newMappings[`border-left: 2px solid ${oldValue}`] = `border-left-color: ${value}`;
      newMappings[`border-right: 2px solid ${oldValue}`] = `border-right-color: ${value}`;
      newMappings[`border-top: 2px dashed ${oldValue}`] = `border-top-color: ${value}`;
      newMappings[`border-bottom: 2px dashed ${oldValue}`] = `border-bottom-color: ${value}`;
      newMappings[`border-left: 2px dashed ${oldValue}`] = `border-left-color: ${value}`;
      newMappings[`border-right: 2px dashed ${oldValue}`] = `border-right-color: ${value}`;
      newMappings[`border-top: 5px solid ${oldValue}`] = `border-top-color: ${value}`;
      newMappings[`border-bottom: 5px solid ${oldValue}`] = `border-bottom-color: ${value}`;
      newMappings[`border-left: 5px solid ${oldValue}`] = `border-left-color: ${value}`;
      newMappings[`border-right: 5px solid ${oldValue}`] = `border-right-color: ${value}`;
      newMappings[`border-top-color: ${oldValue}`] = `border-top-color: ${value}`;
      newMappings[`border-bottom-color: ${oldValue}`] = `border-bottom-color: ${value}`;
      newMappings[`border-left-color: ${oldValue}`] = `border-left-color: ${value}`;
      newMappings[`border-right-color: ${oldValue}`] = `border-right-color: ${value}`;
    } else if (key.startsWith("$background: ")) {
      const oldValue = key.substring("$background: ".length);
      newMappings[`background: ${oldValue}`] = `background: ${value}`;
      newMappings[`background-color: ${oldValue}`] = `background-color: ${value}`;
    } else {
      newMappings[key] = value;
    }
  }
  return newMappings;
}

async function main() {
  mappings = prepareMappings(mappings);
  mappingKeys = Object.keys(mappings);

  const sourceResponses = await Promise.all(sources.map(source => {
    return source.url.endsWith(".css") ? null : fetch(source.url, source.opts);
  }));

  for (const [index, response] of Object.entries(sourceResponses)) {
    const source = sources[index];
    if (response) {
      source.styles = await extractStyleLinks(response);
    } else {
      source.styles = [source.url];
    }
  }

  const cssResponses = await Promise.all(sources.map(source => {
    return Promise.all(source.styles.map(url => fetch(url).then(res => res.text())));
  }));

  for (const [index, responses] of Object.entries(cssResponses)) {
    sources[index].css = responses.join("\n");
  }

  const decls = {};
  for (const source of sources) {
    const opts = {prefix: source.prefix, match: source.match};
    for (const [key, values] of Object.entries(parseDeclarations(source.css, opts))) {
      if (!decls[key]) decls[key] = [];
      decls[key].push(...values);
      decls[key] = Array.from(new Set(decls[key]));
    }
  }

  await writeOutput(buildOutput(decls));
}

main().then(exit).catch(exit);
