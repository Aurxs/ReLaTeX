(function () {
  "use strict";

  const MAX_TEX_LENGTH = 8000;
  const RENDERED_ATTR = "data-relatex-rendered";
  const SKIP_SELECTOR = [
    "script",
    "style",
    "textarea",
    "input",
    "select",
    "button",
    "pre",
    "code",
    "kbd",
    "samp",
    ".katex",
    ".relatex-math",
    "[contenteditable='true']",
    "[role='textbox']",
    `[${RENDERED_ATTR}]`
  ].join(",");

  const MATRIX_ENVS = new Set([
    "matrix",
    "pmatrix",
    "bmatrix",
    "Bmatrix",
    "vmatrix",
    "Vmatrix",
    "smallmatrix"
  ]);

  const KNOWN_COMMANDS = new Set([
    "alpha",
    "beta",
    "gamma",
    "Gamma",
    "delta",
    "Delta",
    "epsilon",
    "varepsilon",
    "zeta",
    "eta",
    "theta",
    "Theta",
    "vartheta",
    "iota",
    "kappa",
    "lambda",
    "Lambda",
    "mu",
    "nu",
    "xi",
    "Xi",
    "pi",
    "Pi",
    "rho",
    "varrho",
    "sigma",
    "Sigma",
    "tau",
    "upsilon",
    "Upsilon",
    "phi",
    "Phi",
    "varphi",
    "chi",
    "psi",
    "Psi",
    "omega",
    "Omega",
    "begin",
    "end",
    "left",
    "right",
    "frac",
    "dfrac",
    "tfrac",
    "sqrt",
    "text",
    "mathrm",
    "mathbf",
    "mathit",
    "mathbb",
    "mathcal",
    "mathsf",
    "mathtt",
    "vec",
    "overrightarrow",
    "overline",
    "underline",
    "hat",
    "bar",
    "tilde",
    "dot",
    "ddot",
    "sin",
    "cos",
    "tan",
    "cot",
    "sec",
    "csc",
    "log",
    "ln",
    "lim",
    "max",
    "min",
    "det",
    "dim",
    "rank",
    "sum",
    "prod",
    "int",
    "iint",
    "iiint",
    "oint",
    "to",
    "mapsto",
    "in",
    "notin",
    "subset",
    "subseteq",
    "supset",
    "supseteq",
    "cup",
    "cap",
    "emptyset",
    "infty",
    "partial",
    "nabla",
    "forall",
    "exists",
    "pm",
    "mp",
    "times",
    "div",
    "cdot",
    "circ",
    "le",
    "leq",
    "ge",
    "geq",
    "ne",
    "neq",
    "approx",
    "equiv",
    "sim",
    "simeq",
    "cong",
    "propto",
    "quad",
    "qquad",
    "ldots",
    "cdots",
    "vdots",
    "ddots",
    "dots",
    "colon",
    "mid",
    "parallel",
    "perp",
    "angle",
    "triangle",
    "because",
    "therefore",
    "implies",
    "iff",
    "Rightarrow",
    "Leftarrow",
    "Leftrightarrow"
  ]);

  function isEscaped(text, index) {
    let slashCount = 0;
    for (let i = index - 1; i >= 0 && text[i] === "\\"; i -= 1) {
      slashCount += 1;
    }
    return slashCount % 2 === 1;
  }

  function isDelimiterStart(text, index) {
    if (text.startsWith("$$", index)) {
      return { open: "$$", close: "$$", displayMode: true, length: 2 };
    }
    if (text[index] === "$") {
      return { open: "$", close: "$", displayMode: false, length: 1 };
    }
    if (text.startsWith("\\(", index)) {
      return { open: "\\(", close: "\\)", displayMode: false, length: 2 };
    }
    if (text.startsWith("\\[", index)) {
      return { open: "\\[", close: "\\]", displayMode: true, length: 2 };
    }
    return null;
  }

  function findClosingDelimiter(text, start, delimiter) {
    for (let i = start; i < text.length; i += 1) {
      if (isEscaped(text, i)) {
        continue;
      }
      if (text.startsWith(delimiter.close, i)) {
        if (delimiter.close === "$" && text.startsWith("$$", i)) {
          continue;
        }
        return i;
      }
    }
    return -1;
  }

  function findMathSegments(text) {
    const segments = [];
    let cursor = 0;

    while (cursor < text.length) {
      const delimiter = isDelimiterStart(text, cursor);
      if (!delimiter || isEscaped(text, cursor)) {
        cursor += 1;
        continue;
      }

      const contentStart = cursor + delimiter.length;
      const closeIndex = findClosingDelimiter(text, contentStart, delimiter);
      if (closeIndex === -1) {
        cursor += delimiter.length;
        continue;
      }

      const rawTex = text.slice(contentStart, closeIndex);
      if (rawTex.trim() && rawTex.length <= MAX_TEX_LENGTH) {
        segments.push({
          start: cursor,
          end: closeIndex + delimiter.close.length,
          tex: rawTex,
          displayMode: delimiter.displayMode || rawTex.includes("\\begin{")
        });
      }
      cursor = closeIndex + delimiter.close.length;
    }

    return segments;
  }

  function readCommandName(text, start) {
    let end = start;
    while (end < text.length && /[A-Za-z]/.test(text[end])) {
      end += 1;
    }
    return {
      name: text.slice(start, end),
      end
    };
  }

  function repairMatrixBody(body) {
    let fixed = "";

    for (let i = 0; i < body.length; i += 1) {
      const char = body[i];
      if (char !== "\\") {
        fixed += char;
        continue;
      }

      const next = body[i + 1];
      if (next === "\\") {
        fixed += "\\\\";
        i += 1;
        continue;
      }

      if (!next) {
        fixed += char;
        continue;
      }

      if (/[A-Za-z]/.test(next)) {
        const command = readCommandName(body, i + 1);
        if (KNOWN_COMMANDS.has(command.name)) {
          fixed += `\\${command.name}`;
        } else {
          fixed += `\\\\${command.name}`;
        }
        i = command.end - 1;
        continue;
      }

      if (/[0-9+\-.([]/.test(next)) {
        fixed += `\\\\${next}`;
        i += 1;
        continue;
      }

      fixed += char;
    }

    return fixed;
  }

  function repairMatrixRows(tex) {
    return tex.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (match, env, body) => {
      if (!MATRIX_ENVS.has(env)) {
        return match;
      }
      return `\\begin{${env}}${repairMatrixBody(body)}\\end{${env}}`;
    });
  }

  function normalizeTex(rawTex) {
    return repairMatrixRows(rawTex)
      .replace(/\u2212/g, "-")
      .replace(/\u00a0/g, " ")
      .trim();
  }

  function shouldSkipTextNode(textNode) {
    const parent = textNode.parentElement;
    if (!parent || !textNode.nodeValue || !textNode.nodeValue.includes("$") && !textNode.nodeValue.includes("\\(") && !textNode.nodeValue.includes("\\[")) {
      return true;
    }
    return Boolean(parent.closest(SKIP_SELECTOR));
  }

  function shouldSkipElement(element) {
    return !element || element.nodeType !== Node.ELEMENT_NODE || Boolean(element.closest(SKIP_SELECTOR));
  }

  function renderMath(tex, displayMode) {
    const wrapper = document.createElement("span");
    wrapper.className = displayMode ? "relatex-math relatex-math-display" : "relatex-math";
    wrapper.setAttribute(RENDERED_ATTR, "true");

    try {
      window.katex.render(normalizeTex(tex), wrapper, {
        displayMode,
        throwOnError: false,
        strict: "ignore",
        trust: false,
        output: "html"
      });
    } catch (error) {
      wrapper.classList.add("relatex-render-error");
      wrapper.textContent = `$${tex}$`;
    }

    return wrapper;
  }

  function replaceTextNode(textNode) {
    if (shouldSkipTextNode(textNode)) {
      return;
    }

    const text = textNode.nodeValue;
    const segments = findMathSegments(text);
    if (!segments.length) {
      return;
    }

    const fragment = document.createDocumentFragment();
    let cursor = 0;

    for (const segment of segments) {
      if (segment.start > cursor) {
        fragment.append(document.createTextNode(text.slice(cursor, segment.start)));
      }
      fragment.append(renderMath(segment.tex, segment.displayMode));
      cursor = segment.end;
    }

    if (cursor < text.length) {
      fragment.append(document.createTextNode(text.slice(cursor)));
    }

    textNode.replaceWith(fragment);
  }

  function textForSplitNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || shouldSkipElement(node)) {
      return null;
    }
    return node.textContent || "";
  }

  function findOpeningAtTrimmedStart(text) {
    const start = text.search(/\S/);
    if (start === -1) {
      return null;
    }

    const delimiter = isDelimiterStart(text, start);
    if (!delimiter || isEscaped(text, start)) {
      return null;
    }

    return { delimiter, start };
  }

  function processSplitMathChildren(parent) {
    if (!parent || !parent.childNodes || parent.childNodes.length < 2) {
      return;
    }
    if (parent.nodeType === Node.ELEMENT_NODE && parent.matches(SKIP_SELECTOR)) {
      return;
    }

    let index = 0;
    while (index < parent.childNodes.length) {
      const startNode = parent.childNodes[index];
      const startText = textForSplitNode(startNode);
      if (startText === null) {
        index += 1;
        continue;
      }

      const opening = findOpeningAtTrimmedStart(startText);
      if (!opening) {
        index += 1;
        continue;
      }

      const prefix = startText.slice(0, opening.start);
      if (prefix.trim()) {
        index += 1;
        continue;
      }

      let tex = startText.slice(opening.start + opening.delimiter.length);
      const nodesToReplace = [startNode];
      let replaced = false;

      for (let cursor = index + 1; cursor < parent.childNodes.length; cursor += 1) {
        const node = parent.childNodes[cursor];
        const nodeText = textForSplitNode(node);
        if (nodeText === null) {
          break;
        }

        nodesToReplace.push(node);
        const closeIndex = findClosingDelimiter(nodeText, 0, opening.delimiter);
        if (closeIndex === -1) {
          tex += `\n${nodeText}`;
          continue;
        }

        const suffix = nodeText.slice(closeIndex + opening.delimiter.close.length);
        if (suffix.trim()) {
          break;
        }

        tex += `\n${nodeText.slice(0, closeIndex)}`;
        if (tex.trim() && tex.length <= MAX_TEX_LENGTH) {
          const rendered = renderMath(tex, true);
          parent.insertBefore(rendered, nodesToReplace[0]);
          nodesToReplace.forEach((replaceNode) => replaceNode.remove());
          replaced = true;
        }
        break;
      }

      index = replaced ? index + 1 : index + 1;
    }
  }

  function processRoot(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE && root.matches(SKIP_SELECTOR)) {
      return;
    }

    const splitRoots = root.nodeType === Node.ELEMENT_NODE ? [root] : [];
    if (root.querySelectorAll) {
      splitRoots.push(...root.querySelectorAll("*"));
    }
    splitRoots.forEach(processSplitMathChildren);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(textNode) {
        return shouldSkipTextNode(textNode) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }
    nodes.forEach(replaceTextNode);
  }

  let pending = false;
  const pendingRoots = new Set();

  function schedule(root) {
    if (root) {
      pendingRoots.add(root);
    }
    if (pending) {
      return;
    }

    pending = true;
    window.setTimeout(() => {
      pending = false;
      const roots = Array.from(pendingRoots);
      pendingRoots.clear();
      roots.forEach(processRoot);
    }, 100);
  }

  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            replaceTextNode(node);
            schedule(node.parentElement);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            schedule(node);
            schedule(node.parentElement);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (!window.katex) {
    return;
  }

  processRoot(document.body);
  startObserver();
}());
