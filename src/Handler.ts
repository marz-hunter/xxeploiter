import { PayloadGenerator } from "./PayloadGenerator";
import * as readline from 'readline';
import { Requester } from "./Requester";
import * as yargs from 'yargs';
import { HTTPParser } from "./HTTPParser";
import * as fs from 'fs';


export class Handler {

  public static async doRequest(opts: any, xmlPayload: string): Promise<any> {
    return new Promise((resolve, reject) => {

      Requester.fromString(opts.requestFile, xmlPayload, opts.fuzzLine).then(([r, line]) => {
        const resp = HTTPParser.axiosResponseToString(r);
        Handler.processRequestResponse(opts, resp, line);
        resolve();

      }).catch(err => {
        console.error(`Error on request for ${err[1]} - ` + (err[0].errno || err[0]));
        reject();
      });
    });
  }


  public static processRequestResponse(opts: any, resp: string, line?: string) {
    //check if needs to output response
    //if errorstring or success string are not provided print everything
    //other wise only print if expected success pattern occurs
    let output = true;

    if (opts.erroString && resp.includes(opts.erroString))
      output = false;

    if (opts.successString) {
      if (resp.includes(opts.successString))
        output = true;
      else
        output = false;
    }


    //if we need to output the response it may to console or to file
    if (output) {
      if (opts.fuzz) {
        const o = `Response for ${line}\n\n${resp}\n\n---------------------------------------------------------------\n`;


        if (opts.requestOutput) //output fuzz to file
          fs.appendFileSync(opts.requestOutput, o);
        else //output fuzz to console
          console.log(o);
      }
      else { //output single request
        if (opts.requestOutput)
          fs.writeFileSync(opts.requestOutput, resp);
        else {
          console.log("Response: ");
          console.log("");
          console.log(resp);
        }
      }

    }
  }


  public static async doWork(opts: any): Promise<any> {

    return new Promise((resolve, reject) => {


      let xmlPayload;

      //generate payload
      if (opts.xxeIterations)
        xmlPayload = PayloadGenerator.xee(opts.xxeIterations, opts.template);
      else {
        const generator = new PayloadGenerator(opts.address, opts.port);
        xmlPayload = generator.generate(opts.type, opts.mode, opts.encoding, opts.commandarg, opts.template);
      }


      //if doing a request do not output xml
      if (opts.requestFile) { //do the request
        Handler.doRequest(opts, xmlPayload).then(() => { resolve(); });
      }
      else if (opts.output) { //output xml
        fs.writeFile(opts.output as string, xmlPayload, () => {
          console.log("XML Payload written to " + opts.output);
          resolve();
        });
      }
      else { console.log(xmlPayload); resolve(); }

    });
  }

  public static async fuzz(opts: any): Promise<any> {
    return new Promise((resolve, reject) => {

      const proms: Array<Promise<any>> = [];

      //wordlist is needed for fuzz. may need to change this when adding portscan
      if (!opts.wordlist) {
        yargs.showHelp();
        process.exit();
      }

      //check if checklist exists
      if (!fs.existsSync(opts.wordlist)) {
        console.error("Wordlist file not found");
        process.exit();
      }

      //create a file to be appended with results
      if (opts.requestOutput) {
        if (fs.existsSync(opts.requestOutput)) fs.unlinkSync(opts.requestOutput);
        fs.writeFileSync(opts.requestOutput, "");
      }
      //read wordlist a line at a time
      const rd = readline.createInterface({ input: fs.createReadStream(opts.wordlist) });
      rd.on('line', (line) => {
        opts.fuzzLine = line;
        opts.commandarg = opts.originalCommandarg.replace("{{FUZZ}}", line);
        proms.push(Handler.doWork(opts));
      });

      //check for all promises only when finished reading file
      rd.on('close', () => {
        Promise.all(proms).then(() => { resolve(); });
      });

    });
  }

}
