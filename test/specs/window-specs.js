describe('Window', function () {
    it("should change focus to popup window", function*() {
        browser.addCommand("activateNewWindow", function () {
            return this.pause(1000).getTabIds().then(function (handles) {
                return this.getCurrentTabId().then(function (current) {
                    if (handles[0] == current)
                        return this.window(handles[1])
                    else
                        return this.window(handles[0])
                })
            })
        });

        browser.addCommand("activateOnlyWindow", function () {

            return this.pause(1000).getTabIds()
                .then(function (handles) {
                    return this.window(handles[0])
                })
        });


        yield browser.url("file:///" + __dirname + "/examples/window.html");
        yield browser.click("Popup");
        yield browser.activateNewWindow();
        var content = yield browser.getHTML("Popup Window")
        content.should.equal('<div>Popup Window</div>');

        yield browser.click("Close")
        yield browser.activateOnlyWindow();

        var content = yield browser.getHTML("Popup")
        content.should.equal('<a href="./new-window.html" target="_blank">Popup</a>');
    });
});