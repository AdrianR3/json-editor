document.addEventListener('DOMContentLoaded', function () {
  var editor = CodeMirror(document.getElementById('editor'), {
    mode: 'application/json',
    theme: localStorage.getItem('theme') || '3024-night',
    lineNumbers: true,
    value: `{}`,
    autoCloseBrackets: true,
    matchBrackets: true,
    allowMultipleSelections: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    extraKeys: {
      "Command-K": (cm) => { cm.foldCode(cm.getCursor()); }
      // "F10": "autocomplete"
    }
  });

  editor.setSize("100%");

  console.log(editor.doc.getValue())

  document.querySelectorAll('#nav > button.nav-button').forEach(button => button.addEventListener('click', (e) => {
    // e.stopPropagation()
    const button = e.currentTarget.getAttribute('name');
    const editorContent = editor.doc.getValue();
    switch (button) {
      case 'export': 
        
        let editorText = editorContent.replace(/\n/g, "\r\n");
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
          JSON.stringify(JSON.parse(editorContent), null, 2)
        );

        break;
      case 'minify':
        editor.doc.setValue(
          JSON.stringify(JSON.parse(editorContent))
        )

        break;
      case 'clear':
        editor.doc.setValue('');

        break;
      case 'validate':
        try {
          JSON.parse(editorContent);
        } catch (e) {
          alert("JSON is invalid.")
          break;
        }
        alert("JSON is valid!")
        // Create an error pane

        break;
    }
  }))

  document.getElementById('themeSelector').addEventListener('change', (elm) => {
    editor.setOption('theme', elm.target.value);
    localStorage.setItem('theme', elm.target.value);
  })

});