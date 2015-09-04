var _ = require('lodash');

module.exports = {
	init: function (browser) {
		browser.getHTML = _.wrap(browser.getHTML, function (func) {
			var args = Array.prototype.slice.call(arguments, 1);
			return browser.lookupElementXPath(args[0]).then(function (xpath) {
				args[0] = xpath;
				return func.apply(browser, args);
			});
		});

		browser.addCommand("lookupElementXPath", function (selector) {
			return this.execute(function (selector) {
				var GLOBALfind = document.querySelectorAll;

				var targets = {
					/*"box": function(container) {
					 return container.find(".box");
					 }*/
				};

				var traverseDomContains = function (origin, target) {
					var xpathResult = document.evaluate(".//*[contains(.,'" + target + "')]", origin, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

					var results = [];
					for (var i = 0; i < xpathResult.snapshotLength; i++) {
						results.push(xpathResult.snapshotItem(i));
					}

					if (results.length == 0) {
						var parent = origin.parentNode;
						if (!parent) return;

						return traverseDomContains(parent, target);
					}

					var matched = [];

					for (var i in results) {
						var e = results[i];
						if (e.innerHTML === target)
							matched.push(e);
					}

					return matched;
				};

				var traverseDom = function (origin, target) {
					var results = origin.querySelectorAll(target);
					if (results.length == 0) {
						var parent = origin.parentNode;
						if (!parent) return;

						return traverseDom(parent, target);
					}

					return results;
				};

				var Strategies = {
					searchText: function (container, text) {
						return traverseDomContains(container, text)
					},
					searchID: function (container, text) {
						return traverseDom(container, "#" + text);
					},
					searchClass: function (container, text) {
						return traverseDom(container, "." + text);
					}
				};

				var findElement = function (container, label) {
					var l = label.split("#")[0];
					if (targets[l]) {
						return targets[l](container)
					}

					var e = Strategies.searchText(container, l);
					if (e) return e;

					e = Strategies.searchID(container, l);
					if (e) return e;

					e = Strategies.searchClass(container, l);
					if (e) return e;
				};

				var indexOf = function (label) {
					var index = label.split("#")[1];
					return index - 1 || 0;
				};

				var drillDown = function (label) {
					var target = document.querySelector("body");
					var labels = label.split(">");
					for (var n in labels) {
						var l = labels[n];
						var i = indexOf(l);
						var elements = findElement(target, l);

						if (elements.length == 1) {
							target = elements[i];
						}
						else if(elements.length > 1) {
							throw new Error("Found " + elements.length + " duplicates for: " + labels.splice(0,n+1).join(">"))
						}
						else {
							return;
						}
					}

					return target;
				};

				function xpath(element) {
					var path = "";
					while (element && element.nodeType == 1) {
						var i = index(element);
						var xname = element.tagName;
						xname += "[" + i + "]";
						path = "/" + xname + path;

						element = element.parentNode
					}

					return path;
				}

				function index(element) {
					var i = 1;
					var sibling = element;
					while (sibling = sibling.previousSibling) {
						if (sibling.nodeType == 1 && sibling.tagName == element.tagName) i++
					}

					return i;
				}

				var targetElement = drillDown(selector);
				return xpath(targetElement);
			}, selector).then(function (res) {
				var result = res && res.value;
				if (result && result.message === 'NoSuchElement') {
					throw new ErrorHandler(7);
				}

				return result;

			});

		});
	}
};