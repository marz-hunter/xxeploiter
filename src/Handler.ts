import { PayloadGenerator } from "./PayloadGenerator";
import * as readline from 'readline';
import { Requester } from "./Requester";
import * as yargs from 'yargs';
import { HTTPParser } from "./HTTPParser";
import * as fs from 'fs';


export class Handler {

  public static VERBOSE = false;

  fuzzStats = { done: 0, found: 0 };
  fuzzResultsString = "[+] Fuzz - Requests Done/Success Results: ";

  opts: any;
  generator: PayloadGenerator

  public constructor(opts: any) {
    this.opts = opts;
    this.generator = new PayloadGenerator(opts.address, opts.port);
  }


  public async doRequest(opts: any, xmlPayload: string): Promise<any> {
    return new Promise((resolve, reject) => {

      Requester.fromString(opts.requestFile, xmlPayload, opts.fuzzLine).then(([r, line]) => {
        const resp = HTTPParser.axiosResponseToString(r);
        this.processResponse(opts, resp, line);
        resolve();

      }).catch(err => {
        console.error(`Error on request for ${err[1]} - ` + (err[0].errno || err[0]));
        resolve();//error is being "handled" here, so resolve :)
      });
    });
  }


  public processResponse(opts: any, resp: string, line?: string) {
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




    //if we need to output the response it may be to console or to file
    if (output) {

      const foo = opts.fuzz ? `\nResponse for ${line}\n\n${resp}\n\n` : `Response:\n\n${resp}\n\n`;

      if (opts.requestOutput) //output to file
        fs.appendFileSync(opts.requestOutput, foo); //TODO: this may be a bottleneck. Need to keep opening the files
      else  //output to console
        console.log(foo);

    }

    if (opts.fuzz) {
      this.fuzzStats.done++;
      if (output) this.fuzzStats.found++;
      if (process.env.NODE_ENV !== "test") this.updateFuzzedValues();
    }
  }


  public async doWork(opts: any = this.opts): Promise<any> {
    return new Promise((resolve, reject) => {


      let xmlPayload;

      //generate payload
      if (opts.xxeIterations)
        xmlPayload = PayloadGenerator.xee(opts.xxeIterations, opts.template);
      else
        xmlPayload = this.generator.generate(opts.type, opts.mode, opts.encoding, opts.commandarg, opts.template);



      //if doing a request do not output xml
      if (opts.requestFile) { //do the request
        this.doRequest(opts, xmlPayload).then(() => { resolve(); });
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

  public async fuzz(): Promise<any> {
    const opts = this.opts;

    this.fuzzStats = { done: 0, found: 0 };

    return new Promise((resolve, reject) => {

      const proms: Array<Promise<any>> = [];

      //wordlist is needed for fuzz. may need to change this when adding portscan
      if (!this.opts.wordlist) {
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
        proms.push(this.doWork(opts));
      });

      //check for all promises only when finished reading file
      rd.on('close', () => {
        Promise.all(proms).then(() => { resolve(); console.log("\n[+] All Done"); });
      });

    });
  }

  private updateFuzzedValues() {
    const t = `${this.fuzzResultsString} ${this.fuzzStats.done}/${this.fuzzStats.found}`;
    console.log(t);
  }

}

