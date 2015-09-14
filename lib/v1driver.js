var _ = require('lodash');

var customLabels = [];

module.exports = {
	init: function (browser) {
		var client = require('webdriverio').remote(browser.requestHandler.sessionID);

		var wrapMethods = ['addValue',
			'clearElement',
			'click',
			'doubleClick',
			'leftClick',
			'middleClick',
			'moveToObject',
			'rightClick',
			'selectByIndex',
			'selectByValue',
			'selectByVisibleText',
			'selectorExecute',
			'selectorExecuteAsync',
			'setValue',
			'submitForm',

			'getHTML',

			'element',

			'isSelected',

			'waitForEnabled',
			'waitForExist',
			'waitForSelected',
			'waitForText',
			'waitForValue',
			'waitForVisible'
		];

		_.each(wrapMethods, function (method) {
			browser.addCommand(method, function () {
				var args = arguments;
				var reference = args[0];

				return this.getCustomLabeledElements(reference).then(function (labels) {
					return this.lookupElementXPath(reference, labels).then(function (xpath) {
						args[0] = xpath;
						return client[method].apply(browser, args);
					});
				});
			}, true);
		});

		browser.addCommand('dragAndDrop', function () {
			var args = arguments;
			return browser.lookupElementXPath(args[0]).then(function (xpath) {
				return this.lookupElementXPath(args[1]).then(function (xpath2) {
					args[0] = xpath;
					args[1] = xpath2;
					return client[method].apply(browser, args);
				});
			});
		}, true);

		browser.addCommand('addElementLabel', function (lookup, label) {
			customLabels[label] = lookup;
		});

		browser.addCommand('getCustomLabeledElements', function (reference) {
			var labels = reference.split(">");

			var foundLabels = _.filter(labels, function (label) {
				return customLabels[label]
			});

			var labelLookup = {};
			if (foundLabels.length > 0) {
				return customLabels[foundLabels[0]].apply(this).then(function (element) {
					return this.getFullXPath(element.value).then(function (xpath) {
						labelLookup[foundLabels[0]] = xpath.value;
						return labelLookup;
					})
				});
			}

			return [];
		});

		browser.addCommand("getFullXPath", function (element) {
			return this.execute(function (element) {
				var path = "";

				var index = function (element) {
					var i = 1;
					var sibling = element;
					while (sibling = sibling.previousSibling) {
						if (sibling.nodeType == 1 && sibling.tagName == element.tagName) i++
					}

					return i;
				}

				while (element && element.nodeType == 1) {
					var i = index(element);
					var xname = element.tagName;
					xname += "[" + i + "]";
					path = "/" + xname + path;

					element = element.parentNode
				}
				return path;
			}, element)
		});

		browser.addCommand("lookupElementXPath", function (selector, customLabels) {
			return this.waitUntil(function () {
				return this.execute(function (selector, customLabels) {
					return (function () {
						unique = function (array) {
							var o = {}, i, l = array.length, r = [];
							for (i = 0; i < l; i += 1) o[array[i]] = array[i];
							for (i in o) r.push(o[i]);
							return r;
						};

						var traverseDomContains = function (origin, target) {
							try {
								var xpathResult = document.evaluate(".//*[not(self::script) and contains(text(),'" + target + "')]", origin, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

								var results = [];
								for (var i = 0; i < xpathResult.snapshotLength; i++) {
									results.push(xpathResult.snapshotItem(i));
								}

								if (results.length == 0) {
									var parent = origin.parentNode;
									if (!parent) return false;

									return traverseDomContains(parent, target);
								}

								return results;
							}
							catch (e) {
								return false;
							}
						};

						var traverseDom = function (origin, target) {
							try {
								var results = origin.querySelectorAll(target);
								if (results.length == 0) {
									var parent = origin.parentNode;
									if (!parent) return false;

									return traverseDom(parent, target);
								}

								return results;
							}
							catch (e) {
								return false;
							}
						};

						var Strategies = {
							getByCustomLabel: function(container, text) {
								if(!customLabels[text]) return false;

								var xpathResult = document.evaluate(customLabels[text], container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

								if(xpathResult.snapshotLength > 0)
									return [xpathResult.snapshotItem(0)];

								return false;
							},
							searchText: function (container, text) {
								return traverseDomContains(container, text)
							},
							searchID: function (container, text) {
								return traverseDom(container, "#" + text);
							},
							searchClass: function (container, text) {
								return traverseDom(container, "." + text);
							},
							searchType: function (container, text) {
								return traverseDom(container, text);
							}
						};

						var findElement = function (container, label) {
							var l = label.split("#")[0];

							var e = Strategies.getByCustomLabel(container, l);
							if (e && e.length > 0) return e;

							e = Strategies.searchText(container, l);
							if (e && e.length > 0) return e;

							e = Strategies.searchID(container, l);
							if (e && e.length > 0) return e;

							e = Strategies.searchClass(container, l);
							if (e && e.length > 0) return e;

							e = Strategies.searchType(container, l);
							if (e && e.length > 0) return e;
						};

						var indexOf = function (label) {
							var index = label.split("#")[1];
							return index ? index - 1 : -1;
						};

						var drillDown = function (label) {
							var body = document.querySelector("body");
							var labels = label.split(">");

							var targets = searchContainer(body, labels, 0)

							if (!targets) {
								return false;
							}
							else if (targets.length == 1) {
								return targets[0];
							}
							else if (targets.length > 1) {
								return {
									isError: true,
									message: "Found " + targets.length + " duplicates for: " + labels.join(">")
								};
							}
							else {
								return false;
							}
						};

						var searchContainer = function (container, labels, labelIndex) {
							var l = labels[labelIndex];
							var i = indexOf(l);

							var elements = findElement(container, l);

							if (!elements) return false;

							var lastItem = labelIndex + 1 === labels.length;
							if (lastItem) {
								if (i >= 0)
									return [elements[i]]
								else
									return elements;
							}
							else {
								// IS a container
								var targets = [];

								if (i >= 0) {
									var childContainer = elements[i];
									targets = targets.concat(Array.prototype.slice.call(searchContainer(childContainer, labels, labelIndex + 1)));
								}
								else {
									for (var c = 0; c < elements.length; c++) {
										var childContainer = elements[c];
										targets = targets.concat(Array.prototype.slice.call(searchContainer(childContainer, labels, labelIndex + 1)));
									}
								}

								return unique(targets);
							}
						}

						var xpath = function (element) {
							var path = "";
							while (element && element.nodeType == 1) {
								var i = index(element);
								var xname = element.tagName;
								xname += "[" + i + "]";
								path = "/" + xname + path;

								element = element.parentNode
							}

							return {xpath: path};
						}

						var index = function (element) {
							var i = 1;
							var sibling = element;
							while (sibling = sibling.previousSibling) {
								if (sibling.nodeType == 1 && sibling.tagName == element.tagName) i++
							}

							return i;
						}


						var search = function () {
							var targetElement = drillDown(selector);

							if (!targetElement) return {notFound: true}
							if (targetElement.isError) return targetElement;
							else return xpath(targetElement)
						};

						return search();
					})()

				}, selector, customLabels
				).then(function (res) {
					var val = res.value;
					if (val.isError) {
						throw new Error(val.message);
					}

					if (val.notFound)
						return false;

					return val.xpath;
				});
			}, 30000);
		});
	}
};