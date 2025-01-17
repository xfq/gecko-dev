// This test is used to check that pasting files removes all non-file data from
// event.clipboardData.

add_task(function*() {
  var searchbar = document.getElementById("searchbar");

  searchbar.focus();
  searchbar.value = "Text";
  searchbar.select();

  yield new Promise((resolve, reject) => {
    searchbar.addEventListener("copy", function copyEvent(event) {
      searchbar.removeEventListener("copy", copyEvent, true);
      event.clipboardData.setData("text/plain", "Alternate");
      // For this test, it doesn't matter that the file isn't actually a file.
      event.clipboardData.setData("application/x-moz-file", "Sample");
      event.preventDefault();
      resolve();
    }, true)

    EventUtils.synthesizeKey("c", { accelKey: true });
  });

  let tab = yield BrowserTestUtils.openNewForegroundTab(gBrowser,
              "https://example.com/browser/browser/base/content/test/general/clipboard_pastefile.html");
  let browser = tab.linkedBrowser;

  yield ContentTask.spawn(browser, { }, function* (arg) {
    content.document.getElementById("input").focus();
  });

  yield BrowserTestUtils.synthesizeKey("v", { accelKey: true }, browser);

  let output = yield ContentTask.spawn(browser, { }, function* (arg) {
    return content.document.getElementById("output").textContent;
  });
  is (output, "Passed", "Paste file");

  searchbar.focus();

  yield new Promise((resolve, reject) => {
    searchbar.addEventListener("paste", function copyEvent(event) {
      searchbar.removeEventListener("paste", copyEvent, true);

      let dt = event.clipboardData;
      is(dt.types.length, 3, "number of types");
      ok(dt.types.includes("text/plain"), "text/plain exists in types");
      ok(dt.mozTypesAt(0).contains("text/plain"), "text/plain exists in mozTypesAt");
      is(dt.getData("text/plain"), "Alternate", "text/plain returned in getData");
      is(dt.mozGetDataAt("text/plain", 0), "Alternate", "text/plain returned in mozGetDataAt");

      resolve();
    }, true);

    EventUtils.synthesizeKey("v", { accelKey: true });
  });

  yield BrowserTestUtils.removeTab(tab);
});
