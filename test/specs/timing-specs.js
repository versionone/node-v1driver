describe('Timing', function () {
	it("should look by content", function*() {
		yield browser.url("file:///" + __dirname + "/examples/timing.html")

		var content = yield browser.getHTML("Appearing Item")
		content.should.equal('<div>Appearing Item</div>');
	});
});