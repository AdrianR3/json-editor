document.addEventListener('DOMContentLoaded', function () {
  CodeMirror.commands.autocomplete = (cm) => doAutocomplete(cm);

  // Initialize CodeMirror editor
  var editor = CodeMirror(document.getElementById('editor'), {
    mode: 'application/json',
    theme: localStorage.getItem('theme') || 'dracula',
    lineNumbers: true,
    value: localStorage.getItem('editorContent') || `{}`,
    lineWrapping: localStorage.getItem('lineWrapping') || false,
    autoCloseBrackets: true,
    matchBrackets: true,
    allowMultipleSelections: true,
    foldGutter: true,
    gutters: ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter" ],
    extraKeys: {
      "Command-K": (cm) => { cm.foldCode(cm.getCursor()); },
      "F10": "autocomplete"
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

    readPaste(pastesID).then(data => {
      editor.doc.setValue(data)
    }).catch(error => displayError(error));
  }

  document.querySelectorAll('#nav > button.nav-button').forEach(button => button.addEventListener('click', (e) => {
    const button = e.currentTarget.getAttribute('name');
    const editorContent = editor.doc.getValue();
    switch (button) {
      case 'export': 
        // Save file to computer
        
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
      case 'open':
        // Open file from computer

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'text/*,.json'
        // fileInput.accept = '.json, .txt, .csv, .xml, .html, .pdf';

        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
              const reader = new FileReader();

              reader.onload = (e) => {
                editor.doc.setValue(e.target.result);
              };

              reader.onerror = () => {
                displayError('Error reading file');
              };

              reader.readAsText(file);
            }
        });

        fileInput.click();

        break;
      case 'beautify':
        // Format JSON

        editor.doc.setValue(
          JSON.stringify(JSON.parse(editorContent), null, 2)
        );

        break;
      case 'minify':
        // Condense JSON

        editor.doc.setValue(
          JSON.stringify(JSON.parse(editorContent))
        )

        break;
      case 'clear':
        // Reset Editor

        if (window.confirm("Are you sure you want to CLEAR the editor?")) {
          editor.doc.setValue('');
        }

        break;
      case 'validate':
        // Check JSON for syntax errors

        try {
          JSON.parse(editorContent);
        } catch (e) {
          displayError(e)
          break;
        }
        alert("JSON is valid!")

        break;
      case 'settings':
        // Open settings window

        document.getElementById('popup').classList.remove('hidden');
        break;
      case 'publish':
        // Publish text to pastes.dev

        if (!window.confirm("Are you sure you want to make this text public?")) break;

        uploadContent(editorContent).then((id) => {
          console.log(`https://pastes.dev/${id}`)

          if ('URLSearchParams' in window) {
            const url = new URL(window.location)
            url.searchParams.set("id", id)
            history.pushState(null, '', url);
          }

          displayNotification(`
            SimpleJSON Link: <a href="${window.location.href}" target="_blank" class="mb-2">${window.location.href}</a><br>
            pastes.dev: <a href="https://pastes.dev/${id}" target="_blank" class="mb-2">https://pastes.dev/${id}</a>
          `)

        }).catch(error => displayError(error));
  
        break;
    }
  }))

  document.getElementById('themeSelector').addEventListener('change', (elm) => {
    editor.setOption('theme', elm.target.value);
    localStorage.setItem('theme', elm.target.value);
  })

  document.querySelectorAll('.setting-option').forEach((setting) => {
    setting.addEventListener('change', (elm) => {
      handleSetting(setting.id, elm.target.value)
      localStorage.setItem(setting.id, elm.target.value)
    })
  })

  // Set initial font size setting
  document.getElementById('lineWrapSetting').checked = (localStorage.getItem('lineWrapping') || false) != 'false';
  document.getElementById('fontSizeSetting').value = localStorage.getItem('fontSizeSetting') || 'fs-base';
  handleSetting('fontSizeSetting', document.getElementById('fontSizeSetting').value)

  document.querySelectorAll('.setting-option').forEach((setting) => {
    // setting.value = localStorage.getItem(setting.id)
    // setting.checked = localStorage.getItem(setting.id)
  })

  // Set initial line wrap setting
  document.getElementById('lineWrapSetting').addEventListener('change', function() {
    let shouldWrap = this.checked;

    console.log(shouldWrap) // Debug

    localStorage.setItem('lineWrapping', shouldWrap)
    editor.setOption('lineWrapping', shouldWrap);
  });

});

document.getElementById('closePopup').addEventListener('click', function() {
  document.getElementById('popup').classList.add('hidden');
});

document.getElementById('dismissNotification').addEventListener('click', function() {
  document.getElementById('notification').classList.add('hidden');
});

document.getElementById('closeError').addEventListener('click', function() {
  document.getElementById('error').classList.add('hidden');
});

// Prevent instant reloads (prompt before reload)
window.onbeforeunload = function() {
  return "Changes may not be saved!";
}

// Shows an error popup to the user
function displayError(error) {
  document.getElementById('errorText').innerText = error;
  document.getElementById('error').classList.remove('hidden');
}

// Shows a notification popup to the user
function displayNotification(htmlContent) {
  document.getElementById('notificationContent').innerHTML = htmlContent;
  document.getElementById('notification').classList.remove('hidden');
}

// Uploads `content` as JSON to pastes.dev
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

// Requests text from pastes.dev by its id (pastes.dev/:id)
async function readPaste(key) {
  if (!/^[a-zA-Z0-9]+$/.test(key)) {
    console.error('Invalid paste key: Key must be alphanumeric');
    return null;
  }
  
  try {
    const response = await fetch(`https://api.pastes.dev/${key}`);

    if (!response.ok) throw new Error(`Error fetching from pastes.dev! (https://api.pastes.dev/${key}) Status: ${response.status}`);

    const data = await response.text();

    return data;
  } catch (error) {
      console.error('Error reading paste:', error);
      return null;
  }
}

function handleSetting(elm, value) {
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

// Automatically save editor contents to localStorage
function autosave(editor) {
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