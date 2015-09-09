describe('Nth', function () {
	before(function*() {
		yield browser.url("file:///" + __dirname + "/examples/nth.html")
	});

	it("should get the nth item", function*() {
		var content = yield browser.getHTML("box1>Item A#2")
		content.should.equal('<div class="item-2">Item A</div>');
	});

	it("should get the nth container for an item", function*() {
		var content = yield browser.getHTML("box2>inner-box#2>Item A")
		content.should.equal('<div class="item-2">Item A</div>');
	});

	it("should get the nth container for an item", function*() {
		browser.addCommand("foobar", function () {
			return this.getHTML("box2>inner-box#2>Item A");
		})

		var content = yield browser.foobar();
		//var content = yield c2.getHTML("box2>inner-box#2>Item A")
		content.should.equal('<div class="item-2">Item A</div>');
	});
});