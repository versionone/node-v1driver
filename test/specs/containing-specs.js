describe('Containing', function () {
	before(function*() {
		yield browser.url("file:///" + __dirname + "/examples/containers.html")
	});

	it("should look inside a container", function*() {
		var content = yield browser.getHTML("box2>Item 1")
		content.should.equal('<div class="box2-item">Item 1</div>');
	});

	it("should traverse the dom looking for items in parent containers", function*() {
		var content = yield browser.getHTML("Item 1 in box 3>Item 2")
		content.should.equal('<div class="box3-item-2">Item 2</div>');
	});

	it("should traverse the dom looking for items in parent containers", function*() {
		yield browser.getHTML("box4>Duplicate A").catch(function(err){
			err.message.should.equal("Found 2 duplicates for: box4>Duplicate A")
		})
	});

	it("should traverse the dom looking for items in parent containers", function*() {
		var content = yield browser.getHTML("box5>inner-box>Item 1");
		content.should.equal('<div class="box5-item-1">Item 1</div>');
	});

	it("should search down only", function*() {
		var content = yield browser.getHTML("box5-item-2>Item 1");
		content.should.equal('<div class="box5-item-1">Item 1</div>');
	});
});