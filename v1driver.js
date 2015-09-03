/*
 "box": function(container) {
 return container.find(".box");
 },

 "box1": function(container) {
 return container.find(".box1");
 },

 "box2": function(container) {
 return container.find(".box2");
 },
 "Corporate Website>Edit": fuction() {

 }
 }

 window.traverseDom = function(origin, target) {
 var results = $(origin).find(target)
 if(results.length == 0) {
 var parent = $(origin).parent();
 if(parent.length == 0) return;

 return traverseDom(parent, target);
 }

 return results;
 }

 window.findElement = function(container, label) {
 var l = label.split("#")[0];
 if(targets[l]) {
 return targets[l](container)
 }

 return searchText(container, l)
 }

 window.indexOf = function(label) {
 var index = label.split("#")[1];
 return index - 1 || 0;
 }

 window.drillDown = function(label) {
 var target = $("body");
 _.each(label.split(">"), function(l) {
 var i = indexOf(l);
 var elements = findElement(target, l);
 var parentElement = elements.eq(i);
 target = parentElement;
 });

 return target;
 }

 window.click = function(target) {
 var index = indexOf(target);
 var targetElement = drillDown(target)
 targetElement.click()
 }
 */


module.exports = {
    config: function () {

    }
}