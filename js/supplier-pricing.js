/* Confirmed supplier quotes, 22 October 2026. Prices include cutting and edge work.
   These are quotes for the listed pieces, not square-metre rates for other sizes.
   The curved quote applies only to the supplier's agreed sample contour. */
(function (root) {
  'use strict';
  var quotes = {
    'rect:600:1200': { silver: 2282, clear: 4150 },
    'rect:600:800': { silver: 1608, clear: 2854 },
    'rect:500:1400': { silver: 2417, clear: 4234 },
    'circle:900:900': { silver: 3628, clear: 5730 },
    'curved:800:900': { silver: 7900, clear: 12500 }
  };
  function lookup(shape, material, width, height, edge) {
    var standardEdge = edge === 'none' || edge === 'grind';
    var key = shape + ':' + Math.min(width, height) + ':' + Math.max(width, height);
    var quote = standardEdge && quotes[key];
    var cost = quote && quote[material];
    return {
      cost: typeof cost === 'number' ? cost : null,
      needsQuote: shape === 'curved' && typeof cost !== 'number'
    };
  }
  var api = { lookup: lookup };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MirrorSupplierPricing = api;
})(typeof window === 'object' ? window : globalThis);
