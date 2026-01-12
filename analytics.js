// Simple Microsoft Clarity bootstrapper with basic privacy safeguards.
// Replace CLARITY_PROJECT_ID with your actual Clarity project ID after signup.
(function () {
  var doNotTrack =
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.msDoNotTrack === "1";

  if (doNotTrack) return;

  var CLARITY_PROJECT_ID = (window.CLARITY_PROJECT_ID || "u6aao36xsq").trim();

  if (!CLARITY_PROJECT_ID || CLARITY_PROJECT_ID === "YOUR_CLARITY_PROJECT_ID") {
    if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      console.warn(
        "[analytics] Microsoft Clarity project ID missing; replace YOUR_CLARITY_PROJECT_ID in analytics.js."
      );
    }
    return;
  }

  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", CLARITY_PROJECT_ID);
})();


