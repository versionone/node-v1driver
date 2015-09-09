describe("overrides", function(){
	it("should use overwritten methods in addCommand", function*() {
		browser.addCommand("customCommand", function () {
			return this.getHTML("box2>inner-box#2>Item A");
		})

		yield browser.url("file:///" + __dirname + "/examples/nth.html")
		var content = yield browser.customCommand();
		content.should.equal('<div class="item-2">Item A</div>');
	});
})