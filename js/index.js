// How to use:
// These steps need to be executed once:

// 1. install node (on ubuntu: "sudo apt install nodejs")
// 2. install npm (on ubuntu: "sudo apt install npm")
// 3. in the "js" folder, run "npm install" - this will install all required packages

// then, to execute the script, run 'node PATH/TO/index.js'

const { XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser");
const fs = require('fs')

const main = () => {

  const outputDir = './output'
  if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
  }

  const options = {
    ignoreAttributes: false,
    preserveOrder: true,
    format: true,
    commentPropName: '#comment',
    suppressEmptyNode: true,
    // to prevent deleting trailing white spaces in some values
    // of events, we need to disabled trimValues; but that makes
    // the XML file 3x the size because it inserts empty lines between
    // every element, so we clean it up later...
    trimValues: false,
  }

  const parser = new XMLParser(options);

  const fileNames = fs.readdirSync('./')
    .filter(path => /\.exb$/.test(path))

  for (const fileName of fileNames) {
    // parse the xml to javascript object for easier manipulation
    const xmlData = fs.readFileSync(fileName, 'utf8')
    const jObj = parser.parse(xmlData);

    // find the right tier
    const el = jObj
      .find(el => 'basic-transcription' in el)['basic-transcription']
      .find(el => 'basic-body' in el)['basic-body']
      .find(el => {
        if (!('tier' in el)) return false
        return el[':@']['@_category'] === 'tok_part'
      })

    // filter out events
    el.tier = el.tier.filter(el => {
      if (!('event' in el)) return true
      const text = el.event[0]['#text']
      //console.log(`A${text}A`)
      return !/^(\d|\d\d|•)$/g.test(text)
    })

    // rebuild XML
    const builder = new XMLBuilder(options);
    const xmlContent = builder.build(jObj);
    // remove annoying empty lines...
    const filteredContent = xmlContent.replace(/^\s*$(?:\r\n?|\n)/gm, '')
    fs.writeFileSync(`${outputDir}/${fileName}`, filteredContent, { encoding: 'utf8'})
  }

}

main()

