/* global document */
var tags = {};

(function () {
  "use strict";
  tags.toggle = function () {
    var x = document.getElementById("toggleDiv");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  };
  tags.toggle();
}());