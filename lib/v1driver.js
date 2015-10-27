var _ = require('lodash');

module.exports = {
    init: function (browser) {
        var customLabels = [];

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

            'getAttribute',
            'getCssProperty',
            'getElementSize',
            'getHTML',
            'getLocation',
            'getLocationInView',
            'getTagName',
            'getText',
            'getValue',

            'element',

            'isSelected',
            'isExisting',

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
                var reference = args[0]

                if(!reference)
                    return client[method].apply(browser, args);

                if(reference.indexOf('wdio:') == 0) {
                    args[0] = reference.replace('wdio:', '');
                    return client[method].apply(browser, args);
                }

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
            var reference = args[0];
            var reference2 = args[1];
            return this.getCustomLabeledElements(reference).then(function (labels) {
                return this.lookupElementXPath(args[0], labels).then(function (xpath) {
                    this.getCustomLabeledElements(reference2).then(function (labels2) {
                        return this.lookupElementXPath(args[1], labels2).then(function (xpath2) {
                            args[0] = xpath;
                            args[1] = xpath2;
                            return client['dragAndDrop'].apply(browser, args);
                        });
                    });
                });
            })
        }, true);

        browser.addCommand("elements", function () {
            var args = arguments;
            var reference = args[0];

            return this.getCustomLabeledElements(reference).then(function (labels) {
                return this.lookupElementXPath(reference, labels, true).then(function (xpaths) {
                    args[0] = xpaths.join("|");
                    return client['elements'].apply(browser, args);
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

                    return this.getFullXPath(element).then(function (xpath) {
                        labelLookup[foundLabels[0]] = xpath;
                        return labelLookup;
                    })
                });
            }

            return [];
        });

        browser.addCommand("getFullXPath", function (e) {
            var element = e.value || e;
            return this.execute(function (s) {
                var result = [];

                var elements = s;

                if (!s.length)
                    elements = [s];

                for (var a = 0; a < elements.length; ++a) {
                    var element = elements[a];
                    var index = function (element) {
                        var i = 1;
                        var sibling = element;
                        while (sibling = sibling.previousSibling) {
                            if (sibling.nodeType == 1 && sibling.tagName == element.tagName) i++
                        }

                        return i;
                    }

                    var path = "";

                    while (element && element.nodeType == 1) {
                        var i = index(element);
                        var xname = "*[translate(name(),'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ')='" + element.tagName + "']";
                        xname += "[" + i + "]";
                        path = "/" + xname + path;

                        element = element.parentNode
                    }

                    result.push(path);
                }

                return result.join("|");
            }, element).then(function (res) {
                return res.value;
            });
        });

        browser.addCommand("lookupElementXPath", function (selector, customLabels, multiple) {
            return this.waitUntil(function () {
                return this.execute(function (selector, customLabels, multiple) {
                        return (function () {
                            var unique = function (array) {
                                var o = {}, i, l = array.length, r = [];
                                for (i = 0; i < l; i += 1) o[xpath(array[i]).xpath] = array[i];
                                for (i in o) r.push(o[i]);
                                return r;
                            };

                            var isDescendant = function(parent, child) {
                                var node = child.parentNode;
                                while (node != null) {
                                    if (node == parent) {
                                        return true;
                                    }
                                    node = node.parentNode;
                                }
                                return false;
                            };

                            var traverseDomContentMatch = function (origin, target) {
                                try {
                                    //
                                    // Exact match
                                    //
                                    var xpathResult = document.evaluate(".//*[not(self::script) and text()='" + target + "']", origin, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                                    var results = [];
                                    for (var i = 0; i < xpathResult.snapshotLength; i++) {
                                        results.push(xpathResult.snapshotItem(i));
                                    }

                                    if (results.length == 0) {
                                        //
                                        // Contains match
                                        //
                                        var xpathResult = document.evaluate(".//*[not(self::script) and contains(text(),'" + target + "')]", origin, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

                                        for (var i = 0; i < xpathResult.snapshotLength; i++) {
                                            results.push(xpathResult.snapshotItem(i));
                                        }

                                        if (results.length == 0) {
                                            var parent = origin.parentNode;
                                            if (!parent) return false;

                                            return traverseDomContentMatch(parent, target);
                                        }
                                    }

                                    return results;
                                }
                                catch (e) {
                                    return false;
                                }
                            };

                            var traverseDomByXpathResult = function (xpathResult, traverseFunc) {
                                try {
                                    var results = [];
                                    for (var i = 0; i < xpathResult.snapshotLength; i++) {
                                        results.push(xpathResult.snapshotItem(i));
                                    }

                                    if (results.length == 0) {
                                        var parent = origin.parentNode;
                                        if (!parent) return false;

                                        return traverseFunc(parent, target);
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

                            function traverseForCustomLabel(container, customLabel) {
                                try {
                                    var containerPath = xpath(container).xpath
                                    var labels = customLabel.split("|");
                                    var r = [];

                                    for (var i = 0; i < labels.length; ++i) {
                                        if (labels[i].indexOf(containerPath) == 0) {
                                            r.push(labels[i].replace(new RegExp(containerPath.replace(/\[/g, "\\[").replace(/\]/g, "\\]")), '.'));
                                        }
                                    }

                                    if (r.length == 0) {
                                        var parent = container.parentNode;
                                        if (!parent) return false;

                                        return traverseForCustomLabel(parent, customLabel);
                                    }

                                    var label = r.join("|");

                                    var xpathResult = document.evaluate(label, container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

                                    if (xpathResult.snapshotLength > 0) {
                                        var r = [];
                                        for (var i = 0; i < xpathResult.snapshotLength; ++i) {
                                            r.push(xpathResult.snapshotItem(i))
                                        }
                                        return r;
                                    }
                                    else {
                                        var parent = container.parentNode;
                                        if (!parent) return false;

                                        return traverseForCustomLabel(parent, customLabel);
                                    }

                                    return false;
                                }
                                catch (e) {
                                    return false;
                                }
                            }

                            var Strategies = {
                                getByCustomLabel: function (container, text) {
                                    var customLabel = customLabels[text];
                                    if (!customLabel) return false;

                                    return traverseForCustomLabel(container, customLabel);
                                },
                                searchTextExactMatch: function (container, text) {
                                    return traverseDomContentMatch(container, text)
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

                                e = Strategies.searchTextExactMatch(container, l);
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
                                var lastIndex = label.match(/#(\d*)$/);

                                var targets = searchContainer(body, labels, 0)

                                if (!targets) {
                                    return false;
                                }
                                else {

                                    if (lastIndex) {
                                        //
                                        // Assume last index is for all targets found
                                        //
                                        return [targets[lastIndex[1] - 1]];
                                    }
                                    else {
                                        return targets;
                                    }
                                }
                            };

                            var limitToReferences = function(elements, container) {
                                var elementContainsContainer = false;
                                var parentsContainingReference = [];
                                for(var e = 0; e < elements.length; ++e) {
                                    if(isDescendant(elements[e],container)) {
                                        elementContainsContainer = true;
                                        parentsContainingReference.push(elements[e]);
                                    }
                                }

                                if(elementContainsContainer)
                                    return parentsContainingReference;

                                return elements;
                            }

                            var searchContainer = function (container, labels, labelIndex) {
                                var l = labels[labelIndex];
                                var i = indexOf(l);

                                var elements = findElement(container, l);

                                if (!elements) return false;

                                elements = limitToReferences(elements, container);

                                var lastItem = labelIndex + 1 === labels.length;
                                if (lastItem) {
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
                                            var foundItems = Array.prototype.slice.call(searchContainer(childContainer, labels, labelIndex + 1));
                                            targets = targets.concat(foundItems);
                                        }
                                    }

                                    return unique(targets);
                                }
                            };

                            var xpath = function (element) {
                                var path = "";
                                while (element && element.nodeType == 1) {
                                    var i = index(element);
                                    var xname = "*[translate(name(),'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ')='" + element.tagName + "']";
                                    xname += "[" + i + "]";
                                    path = "/" + xname + path;

                                    element = element.parentNode
                                }

                                return {xpath: path};
                            };

                            var index = function (element) {
                                var i = 1;
                                var sibling = element;
                                while (sibling = sibling.previousSibling) {
                                    if (sibling.nodeType == 1 && sibling.tagName == element.tagName) i++
                                }

                                return i;
                            };


                            var search = function () {
                                var targetElement = drillDown(selector);

                                if (!targetElement) return {notFound: true}
                                var xpaths = [];

                                for (var i = 0; i < targetElement.length; i++) {
                                    xpaths.push(xpath(targetElement[i]).xpath);
                                }

                                return {xpaths: xpaths};
                            };

                            return search();
                        })()

                    }, selector, customLabels, multiple
                ).then(function (res) {
                    var val = res.value;

                    if (val.notFound)
                        return false;

                    if (multiple) {
                        return val.xpaths;
                    }
                    else {
                        if (val.xpaths.length > 1)
                            throw new Error("Found " + val.xpaths.length + " duplicates for: " + selector)
                        else
                            return val.xpaths[0]
                    }
                })
            }).catch(function (err) {
                if (err.message.indexOf('truthy') > -1)
                    throw new Error("Element not found: " + selector);
                else
                    throw err;
            });
        });
    }
};