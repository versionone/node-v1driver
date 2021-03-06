describe('Containing', function () {
	before(function*() {
		yield browser.url("file:///" + __dirname + "/examples/containers.html")
	});

	it("should look inside a container", function*() {
		var content = yield browser.getHTML("box2>Item 1")
		content.should.equal('<div class="box2-item">Item 1</div>');
	});

	it("should traverse the dom looking for items in multiple containers", function*() {
		var content = yield browser.getHTML("Item 1 in box 3>Item 2")
		content.should.equal('<div class="box3-item-2">Item 2</div>');
	});

	it("should show a duplicate found error if container finds more than one", function*() {
		yield browser.getHTML("box4>Duplicate A").catch(function(err){
			err.message.should.equal("Promise was fulfilled but got rejected with the following reason: Error: Found 2 duplicates for: box4>Duplicate A")
		})
	});

	it("should traverse the dom looking for items in parent containers", function*() {
		var content = yield browser.getHTML("box5>inner-box>Item 1");
		content.should.equal('<div class="box5-item-1">Item 1</div>');
	});

	it("should only crawl parents til first find", function*() {
		var content = yield browser.getHTML("Item B>Item A");
		content.should.equal('<div class="box6-item-A">Item A</div>');
	});

	it("should look by class near a container", function*() {
		var content = yield browser.getHTML("box7>Item Content>class-name");
		content.should.equal('<div class="class-name"></div>');
	});

	it("should look by node type near a container", function*() {
		var content = yield browser.getHTML("Item Content>input-near-content");
		content.should.equal('<input class="input-near-content">');
	});

	it("should look within a custom label", function* () {
		yield browser.addElementLabel(function () {
			return this.element(".random>div#2")
		}, "customlabel");

		var content = yield browser.getHTML("box9>customlabel>Item 1")
		content.should.equal('<div class="box9-item-1">Item 1</div>');
	});

	it("should find the custom label in container", function*(){
		yield browser.addElementLabel(function () {
			return this.elements("custom-class")
		}, "customClassLabel");

		var content = yield browser.getHTML("Container Label For Custom Class>customClassLabel");
		content.should.equal('<div class="custom-class">Inside</div>');
	})

	it("Should limit and narrow the search to containers found", function*(){
		var content = yield browser.getHTML("reference 1>parent>target")
		content.should.equal('<div class="target-1">target</div>');
	})
});