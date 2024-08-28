document.addEventListener('DOMContentLoaded', function () {
  let editor = CodeMirror(document.getElementById('editor'), {
    mode: 'application/json',
    theme: 'dracula',
    lineNumbers: true,
    value: `{"hello": "world"}`
  });
});