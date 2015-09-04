

describe('Targeting', function () {
	it("should look by content", function*() {
		yield browser.url("file:///" + __dirname + "/examples/labels.html")

		var content = yield browser.getHTML("Content Item")
		content.should.equal('<div>Content Item</div>');
	});

	it('will look by id', function* () {
		yield browser.url("file:///" + __dirname + "/examples/labels.html")

		var content = yield browser.getHTML("label-id")
		content.should.equal('<div id="label-id">ID Item</div>');
	});

	it("should look by class", function*() {
		yield browser.url("file:///" + __dirname + "/examples/labels.html")

		var content = yield browser.getHTML("div-class")
		content.should.equal('<div class="div-class">Class Item</div>');
	});

	it.skip("should look at attributes by value", function*() {
		yield browser.url("file:///" + __dirname + "/examples/labels.html")

		var content = yield browser.getHTML("attribute-value")
		content.should.equal('<div data-key="attribute-value">Attribute Item</div>');
	});
});