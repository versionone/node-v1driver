describe('Targeting', function () {
    it('will do something', function* () {
        yield browser.url("file:///" + __dirname + "/examples/labels.html");
        //yield browser.url('http://google.com');

        var title = yield browser.getTitle()
        console.log("Title:", title);
    });
});