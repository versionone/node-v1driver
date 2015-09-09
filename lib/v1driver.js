var _ = require('lodash');

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
				return this.lookupElementXPath(args[0]).then(function (xpath) {
					args[0] = xpath;
					return client[method].apply(browser, args);
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

		browser.addCommand("lookupElementXPath", function (selector) {
			return this.timeoutsAsyncScript(30000).executeAsync(function (selector, done) {
					(function () {
						var GLOBALfind = document.querySelectorAll;

						Array.prototype.unique = function () {
							var o = {}, i, l = this.length, r = [];
							for (i = 0; i < l; i += 1) o[this[i]] = this[i];
							for (i in o) r.push(o[i]);
							return r;
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

							for (var i = 0; i < results.length; ++i) {
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
							},
							searchType: function (container, text) {
								return traverseDom(container, text);
							}
						};

						var findElement = function (container, label) {
							var l = label.split("#")[0];
							//if (labels[l]) {
							//	return targets[l](container)
							//}

							var e = Strategies.searchText(container, l);
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
								return;
							}
							else if (targets.length == 1) {
								return targets[0];
							}
							else if (targets.length > 1) {
								throw new Error("Found " + targets.length + " duplicates for: " + labels.join(">"))
							}
							else {
								return;
							}
						};

						var searchContainer = function (container, labels, labelIndex) {
							var l = labels[labelIndex];
							var i = indexOf(l);

							var elements = findElement(container, l);

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

								return targets.unique();
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

							return path;
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
							setTimeout(function () {
								var targetElement = drillDown(selector);

								if (!targetElement) search();
								else done(xpath(targetElement))
							}, 1);
						};

						search()
					})()

				}
				,
				selector
			).then(function (res) {
					var result = res && res.value;
					if (result && result.message === 'NoSuchElement') {
						throw new ErrorHandler(7);
					}

					return result;

				});

		});
	}
};