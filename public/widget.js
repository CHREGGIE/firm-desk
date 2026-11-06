/* Ainsworth Gorkin desk loader.
   Squarespace pastes a script tag that points here. This file stays
   dependency-free so the host page does not need React or Tailwind.
   The panel is an iframe on this app's origin. Chat requests never
   run from the Squarespace page, which will not allow that. */
(function () {
  if (window.__calderWrenDesk) return;

  var script = document.currentScript;
  if (!script) {
    var found = document.getElementsByTagName("script");
    for (var i = found.length - 1; i >= 0; i -= 1) {
      if (found[i].src && found[i].src.indexOf("/widget.js") !== -1) {
        script = found[i];
        break;
      }
    }
  }

  if (!script || !script.src || script.src.indexOf("/widget.js") === -1) {
    console.warn(
      "Ainsworth Gorkin desk: paste the script tag from the install page. Copying this file into Squarespace will not work.",
    );
    return;
  }

  var origin;
  try {
    origin = new URL(script.src).origin;
  } catch (error) {
    return;
  }

  window.__calderWrenDesk = true;

  var rawLabel = script.getAttribute("data-label") || "Ask the desk";
  var label = String(rawLabel).replace(/\s+/g, " ").trim().slice(0, 40) || "Ask the desk";
  var messageSource = "calder-wren-desk";
  var open = false;
  var iframeReady = false;
  var observedBody = null;
  var observer = null;

  function paint(node, props) {
    Object.keys(props).forEach(function (key) {
      node.style.setProperty(key, props[key], "important");
    });
  }

  function ensureStyle() {
    if (document.getElementById("cw-desk-style")) return;
    var style = document.createElement("style");
    style.id = "cw-desk-style";
    style.textContent = [
      "#cw-desk-root{all:initial;position:fixed !important;inset:0 !important;z-index:2147483000 !important;pointer-events:none !important;color-scheme:light;}",
      "#cw-desk-launcher{all:unset;box-sizing:border-box !important;position:fixed !important;z-index:2147483000 !important;right:16px !important;bottom:max(16px, env(safe-area-inset-bottom)) !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;height:48px !important;margin:0 !important;padding:0 20px !important;border:0 !important;border-radius:999px !important;background:#723034 !important;color:#f7f4ee !important;font-family:Georgia,'Iowan Old Style',Palatino,'Palatino Linotype',serif !important;font-size:16px !important;font-weight:600 !important;line-height:1 !important;letter-spacing:0 !important;text-transform:none !important;cursor:pointer !important;pointer-events:auto !important;box-shadow:0 12px 40px -16px rgba(60,24,28,.55) !important;}",
      "#cw-desk-launcher:focus-visible{outline:2px solid #723034 !important;outline-offset:3px !important;}",
      "#cw-desk-panel{box-sizing:border-box !important;position:fixed !important;z-index:2147483000 !important;right:16px !important;bottom:16px !important;width:min(400px, calc(100vw - 32px)) !important;height:min(640px, calc(100dvh - 32px)) !important;margin:0 !important;padding:0 !important;border:1px solid rgba(80,40,36,.2) !important;background:#f3efe6 !important;overflow:hidden !important;pointer-events:auto !important;box-shadow:0 24px 80px -28px rgba(40,16,18,.55) !important;}",
      "#cw-desk-panel iframe{display:block !important;width:100% !important;height:100% !important;border:0 !important;background:#f3efe6 !important;color-scheme:light;}",
      "#cw-desk-launcher[hidden],#cw-desk-panel[hidden]{display:none !important;}",
      "@media (max-width:640px){#cw-desk-panel{top:0 !important;right:0 !important;bottom:0 !important;left:0 !important;width:100% !important;height:100% !important;}}",
    ].join("");
    (document.head || document.documentElement).appendChild(style);
  }

  function focusPanel() {
    var frame = document.getElementById("cw-desk-frame");
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ source: messageSource, type: "focus" }, origin);
  }

  function setOpen(next, restoreFocus) {
    var root = document.getElementById("cw-desk-root");
    var button = document.getElementById("cw-desk-launcher");
    var panel = document.getElementById("cw-desk-panel");
    var frame = document.getElementById("cw-desk-frame");
    if (!root || !button || !panel || !frame) return;
    open = next;
    if (next) {
      panel.hidden = false;
      panel.removeAttribute("aria-hidden");
      panel.setAttribute("aria-modal", "true");
      try {
        panel.inert = false;
      } catch (error) {
        /* Older browsers have no inert. hidden is enough. */
      }
      button.hidden = true;
      button.setAttribute("aria-expanded", "true");
      if (!iframeReady) {
        iframeReady = true;
        frame.src = origin + "/embed?widget=1";
      } else {
        focusPanel();
      }
    } else {
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
      panel.removeAttribute("aria-modal");
      try {
        panel.inert = true;
      } catch (error) {
        /* Older browsers have no inert. hidden is enough. */
      }
      button.hidden = false;
      button.setAttribute("aria-expanded", "false");
      if (restoreFocus) button.focus();
    }
  }

  function mount() {
    if (!document.body || document.getElementById("cw-desk-root")) return;
    open = false;
    iframeReady = false;
    ensureStyle();

    var root = document.createElement("div");
    root.id = "cw-desk-root";

    var button = document.createElement("button");
    button.id = "cw-desk-launcher";
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "cw-desk-panel");
    paint(button, {
      "background-color": "#723034",
      color: "#f7f4ee",
      "font-family": "Georgia, 'Iowan Old Style', Palatino, 'Palatino Linotype', serif",
      "font-size": "16px",
      "font-weight": "600",
      "border-radius": "999px",
      "z-index": "2147483000",
    });
    button.addEventListener("click", function () {
      setOpen(!open, false);
    });

    var panel = document.createElement("div");
    panel.id = "cw-desk-panel";
    panel.hidden = true;
    try {
      panel.inert = true;
    } catch (error) {
      /* Older browsers have no inert. hidden is enough. */
    }
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", label);
    panel.setAttribute("aria-hidden", "true");

    var frame = document.createElement("iframe");
    frame.id = "cw-desk-frame";
    frame.title = label;
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.addEventListener("load", function () {
      if (open) focusPanel();
    });

    panel.appendChild(frame);
    root.appendChild(button);
    root.appendChild(panel);
    document.body.appendChild(root);
  }

  function arm() {
    var body = document.body;
    if (!body) return;
    mount();
    if (observedBody === body) return;
    if (observer) observer.disconnect();
    observer = new MutationObserver(function () {
      if (!document.getElementById("cw-desk-root")) mount();
    });
    observer.observe(body, { childList: true });
    observedBody = body;
  }

  function start() {
    arm();
    window.setInterval(arm, 1500);
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data;
    if (!data || data.source !== messageSource || data.type !== "close") return;
    setOpen(false, true);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && open) setOpen(false, true);
  });

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
