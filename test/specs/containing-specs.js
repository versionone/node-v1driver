describe('Containing', function () {
	it("should look inside a container", function*() {
		yield browser.url("file:///" + __dirname + "/examples/containers.html")

		var content = yield browser.getHTML("box2>Item 1")
		content.should.equal('<div class="box2-item">Item 1</div>');
	});

	it("should traverse the dom looking for items in parent containers", function*() {
		yield browser.url("file:///" + __dirname + "/examples/containers.html")

		var content = yield browser.getHTML("Item 1 in box 3>Item 2")
		content.should.equal('<div class="box3-item-2">Item 2</div>');
	});
});