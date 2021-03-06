import { XXEServer } from "../src/XXEServer";
import { Type, Mode, Encoding } from "../src/PayloadGenerator";
import * as fs from 'fs';
import { Handler } from '../src/Handler';
import { expect } from "chai";

describe('Handler', () => {



  it('should fuzz and save to file filtered by success message', async () => {
    const s = new XXEServer("127.0.0.1", 18366);
    s.addRoute("/", "body");
    s.start();

    const opts = {
      type: Type.file,
      mode: Mode.XML,
      encoding: Encoding.NORMAL,
      template: "<root>{{XXE}}</root>",
      commandarg: "/root/{{FUZZ}}",
      requestFile: "GET http://localhost:18366/ HTTP/1.1\nHost: localhost\n\n{{XXE}}\n",
      //output: argv.o,
      fuzz: true,
      fuzzLine: "",
      wordlist: "tests/data/wordlist.txt",
      originalCommandarg: "/root/{{FUZZ}}", //with fuzz we are going to change commandarg, we need to keep the original
      successString: "body",
      //erroString: argv.n,
      requestOutput: "tests/data/fuzz_out.txt"

    };


    await new Handler(opts).fuzzer();

    //since requests come with date, we are going to remove it just to match :)
    const removeDates = (content: string): string => {
      const i = content.indexOf("date: ");
      const endOfLine = content.indexOf("\n", i);
      const line = content.substring(i, endOfLine);

      return content.replace(new RegExp(line, "gm"), "");
    };

    const output = fs.readFileSync("tests/data/fuzz_out.txt").toString();
    const expected = fs.readFileSync("tests/data/fuzz_expected_out.txt").toString();

    expect(removeDates(output)).to.eq(removeDates(expected));

    s.stop();

  });


  it('should fuzz and save to file filtered by error message', async () => {
    const s = new XXEServer("127.0.0.1", 18367);
    s.addRoute("/", "body");
    s.start();

    const opts = {
      type: Type.file,
      mode: Mode.XML,
      encoding: Encoding.NORMAL,
      template: "<root>{{XXE}}</root>",
      commandarg: "/root/{{FUZZ}}",
      requestFile: "GET http://localhost:18367/ HTTP/1.1\nHost: localhost\n\n{{XXE}}\n",
      //output: argv.o,
      fuzz: true,
      fuzzLine: "",
      wordlist: "tests/data/wordlist.txt",
      originalCommandarg: "/root/{{FUZZ}}", //with fuzz we are going to change commandarg, we need to keep the original
      erroString: "body",
      requestOutput: "tests/data/fuzz_out2.txt"

    };

    await new Handler(opts).fuzzer();
    const output = fs.readFileSync("tests/data/fuzz_out2.txt").toString();


    expect(output).to.eq("");

    s.stop();

  });
});