document.addEventListener('DOMContentLoaded', function () {
  var editor = CodeMirror(document.getElementById('editor'), {
    mode: 'application/json',
    theme: 'dracula',
    lineNumbers: true,
    value: `{"hello": "world"}`
  });

  console.log(editor.doc.getValue())

  document.querySelectorAll('#nav > button.nav-button').forEach(button => button.addEventListener('click', (e) => {
    // e.stopPropagation()
    const button = e.currentTarget.getAttribute('name');
    switch (button) {
      case 'export': 
        
        // Not Implemented Yet
  
        break;
      case 'beautify':

        editor.doc.setValue(
          JSON.stringify(JSON.parse(editor.doc.getValue()), null, 2)
        );

        break;
      case 'minify':

        // Not Implemented Yet

        break;
      case 'clear':
        editor.doc.setValue('');
        break;
    }
  }))

});