document.addEventListener('DOMContentLoaded', function () {
  var editor = CodeMirror(document.getElementById('editor'), {
    mode: 'javascript',
    // theme: 'dracula',
    lineNumbers: true,
    value: 'console.log("Hello, world!");'
  });
});