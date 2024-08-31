document.addEventListener('DOMContentLoaded', function () {
  CodeMirror.commands.autocomplete = (cm) => doAutocomplete(cm);

  var editor = CodeMirror(document.getElementById('editor'), {
    mode: 'application/json',
    theme: localStorage.getItem('theme') || 'dracula',
    lineNumbers: true,
    value: localStorage.getItem('editorContent') || `{}`,
    lineWrapping: localStorage.getItem('lineWrapping') || false,
    autoCloseBrackets: true,
    matchBrackets: true,
    // allowMultipleSelections: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers", ],
    extraKeys: {
      "Command-K": (cm) => { cm.foldCode(cm.getCursor()); },
      // "F10": "autocomplete"
    },
    lint: true
  });

  // Autosave
  setInterval(() => autosave(editor), 5000);

  editor.setSize("100%");

  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  if (params.has('id')) {
    const pastesID = params.get('id');
    console.log(`Parameter 'id' is present with value: ${pastesID}`);

    readPaste(pastesID).then(data => {
      editor.doc.setValue(data)
    }).catch(error => displayError(error));
  }

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
        if (window.confirm("Are you sure you want to CLEAR the editor?")) {
          editor.doc.setValue('');
        }

        break;
      case 'validate':
        try {
          JSON.parse(editorContent);
        } catch (e) {
          displayError(e)
          break;
        }
        alert("JSON is valid!")
        // Create an error pane

        break;
      case 'settings':
        // editor.doc.setValue('');
        document.getElementById('popup').classList.remove('hidden');
        break;
      case 'publish':
        if (!window.confirm("Are you sure you want to publish this text?")) break;

        uploadContent(editorContent).then((id) => {
          console.log(`https://pastes.dev/${id}`)

          if ('URLSearchParams' in window) {
            const url = new URL(window.location)
            url.searchParams.set("id", id)
            history.pushState(null, '', url);
          }

          alert(`https://pastes.dev/${id}`)

          // document.getElementById('notification').innerHTML = `<a href="https://pastes.dev/${id}"></a>`;
          // document.getElementById('notification').classList.remove('hidden');
        }).catch(error => displayError(error));
  
        break;
    }
  }))

  document.getElementById('themeSelector').addEventListener('change', (elm) => {
    editor.setOption('theme', elm.target.value);
    localStorage.setItem('theme', elm.target.value);
  })

  document.querySelectorAll('.setting-option').forEach((setting) => {
    setting.addEventListener('change', (elm) => handleSetting(setting.id, elm.target.value))
  })

  document.getElementById('lineWrapSetting').addEventListener('change', function() {
    let shouldWrap = this.checked;

    localStorage.setItem('lineWrapping', shouldWrap)
    editor.setOption('lineWrapping', shouldWrap);
  });

});

document.getElementById('closePopup').addEventListener('click', function() {
  document.getElementById('popup').classList.add('hidden');
});

document.getElementById('closeError').addEventListener('click', function() {
  document.getElementById('error').classList.add('hidden');
});

window.onbeforeunload = function() {

  // Actually broken
  // const editor = EditorView.findFromDOM(); 
  // console.debug(`editor.doc.getValue(): ${console.info(editor.doc.getValue())}`)
  // console.debug(`localStorage.getItem('editorContent'): ${localStorage.getItem('editorContent')}`)

  // if (editor.doc.getValue() != localStorage.getItem('editorContent')) 
  return "Changes may not be saved!";
}

function displayError(error) {
  document.getElementById('errorText').innerText = error;
  document.getElementById('error').classList.remove('hidden');
}

async function uploadContent(content, language = 'json') {
  try {
    const response = await fetch('https://api.pastes.dev/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: content
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const locationHeader = response.headers.get('Location');
    if (locationHeader) {
      console.log(`locationHeader: ${locationHeader}`)
      const key = locationHeader.split('/').pop();
      return key;
    }

    const responseBody = await response.json();
    if (responseBody.key) {
      return responseBody.key;
    }

    throw new Error('Paste key not found in response');
  } catch (error) {
    console.error('Error uploading content:', error);
    return null;
  }
}

async function readPaste(key) {
  if (!/^[a-zA-Z0-9]+$/.test(key)) {
    console.error('Invalid paste key: Key must be alphanumeric');
    return null;
  }
  
  try {
    const response = await fetch(`https://api.pastes.dev/${key}`);

    if (!response.ok) throw new Error(`Error fetching from pastes.dev! (https://api.pastes.dev/${key}) Status: ${response.status}`);

    // console.log(`response.headers: ${JSON.stringify(await response.headers)}`)
    // console.log(response.headers)

    // const contentType = response.headers.get('Content-Type');
    // if (!contentType) throw new Error('Content-Type header missing');
    
    // const languageMatch = contentType.match(/^text\/(.+)$/);
    // if (!languageMatch) throw new Error('Invalid Content-Type format');
    
    // const language = languageMatch[1];
    // const content = await response;
    // console.log({ content /*, language */})
    const data = await response.text();

    return data;
  } catch (error) {
      console.error('Error reading paste:', error);
      return null;
  }
}

function handleSetting(elm, value) {
  console.log(`value: ${value}`)

  switch (elm.slice(0, -7)) {
    case 'lineWrap':
      console.log(value)
      break;
    case 'fontSize':
      document.getElementById('app').classList.remove('fs-sm', 'fs-base', 'fs-lg', 'fs-xl')
      document.getElementById('app').classList.add(value)

      break;
    case 'indentation':
      console.log(value)
      break;
  }

}

function autosave(editor) {
  console.info("Autosaving...")
  const editorContent = editor.doc.getValue();

  localStorage.setItem('editorContent', editorContent)
}

function getSetting(settingName) {
  return document.getElementById(`${settingName}Setting`).value;
}

function doAutocomplete(cm) {
  cm.showHint({ 
    hint: CodeMirror.hint.json 
  });
}