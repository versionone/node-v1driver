describe('Targeting', function () {
	before(function*() {
		yield browser.url("file:///" + __dirname + "/examples/labels.html")
	})

	it("should look by content", function*() {
		var content = yield browser.getHTML("Content Item")
		content.should.equal('<div>Content Item</div>');
	});

	it("should look by content as contains", function*() {
		var content = yield browser.getHTML("Item Contains")
		content.should.equal('<div>This Item Contains Text</div>');
	});

	it('will look by id', function* () {
		var content = yield browser.getHTML("label-id")
		content.should.equal('<div id="label-id">ID Item</div>');
	});

	it("should look by class", function*() {
		var content = yield browser.getHTML("div-class")
		content.should.equal('<div class="div-class">Class Item</div>');
	});

	it("should look by node type", function*() {
		var content = yield browser.getHTML("button")
		content.should.equal('<button class="button-direct">Button</button>');
	});

	it.skip("should look at attributes by value", function*() {
		var content = yield browser.getHTML("attribute-value")
		content.should.equal('<div data-key="attribute-value">Attribute Item</div>');
	});

	it("should look by node type", function*() {
		var content = yield browser.getHTML("text and nodes#1")
		content.should.equal('<div class="text-with-nodes">\n        This item has text and nodes\n        <div>Inner Text</div>\n        <span>More Text</span>\n    </div>');
	});

	it("should look by custom labels", function* () {
		yield browser.addElementLabel(function () {
			return this.element(".random>div#2")
		}, "customlabel");

		var content = yield browser.getHTML("customlabel");
		content.should.equal('<div>Other Custom Data</div>');
	});

	it("should show an error if element not found", function*() {
		yield browser.getHTML("item-not-found").catch(function(err){
			err.message.should.equal("Element not found: item-not-found")
		})
	});
});