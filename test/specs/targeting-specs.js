var v1driver = require('../../lib/v1driver');

describe('Targeting', function () {
	it('will look by id', function* () {
		v1driver.init(browser);

		yield browser.url("file:///" + __dirname + "/examples/labels.html")
		/*var content = yield browser.lookupElementXPath("label-id")
			.then(function (xpath) {
				return this.getHTML(xpath);
			});*/

		var content = yield browser.getHTML("label-id")
		content.should.equal('<div id="label-id">ID Item</div>');
});
});