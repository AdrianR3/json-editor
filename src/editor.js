document.addEventListener('DOMContentLoaded', function () {
  // var editor = CodeMirror(document.getElementById('editor'), {
  //   mode: 'application/json',
  //   theme: 'dracula',
  //   lineNumbers: true,
  //   value: `{"hello": "world"}`
  // });

  var editor = CodeMirror(document.getElementById('editor'), {
    mode: 'application/json',
    theme: 'dracula',
    lineNumbers: true,
    value: `{"hello": "world"}`,
    autoCloseBrackets: true,
    matchBrackets: true,
    extraKeys: {
      "Space": "autocomplete"
    }
  });

  editor.setSize("100%", "90vh");

  console.log(editor.doc.getValue())

  document.querySelectorAll('#nav > button.nav-button').forEach(button => button.addEventListener('click', (e) => {
    // e.stopPropagation()
    const button = e.currentTarget.getAttribute('name');
    switch (button) {
      case 'export': 
        
        let editorText = editor.doc.getValue().replace(/\n/g, "\r\n");
        let textFileAsBlob = new Blob([editorText], {type:'application/json'});
        
        const now = new Date();
        let fileName = `simple_json_${now.getUTCMonth()}_${now.getUTCDate()}_${now.getUTCFullYear()}.json`;
        
        let downloadLink = document.createElement("a");
        downloadLink.download = fileName;
        
        window.URL = window.URL || window.webkitURL;
        
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);

        downloadLink.click();
        
        function destroyClickedElement(event) {
          document.body.removeChild(event.target);
        }
  
        break;
      case 'beautify':

        editor.doc.setValue(
          JSON.stringify(JSON.parse(editor.doc.getValue()), null, 2)
        );

        break;
      case 'minify':

        editor.doc.setValue(
          JSON.stringify(JSON.parse(editor.doc.getValue()))
        )

        break;
      case 'clear':
        editor.doc.setValue('');
        break;
    }
  }))

});