import fs from 'fs';
import * as Axios from 'axios';
import * as Https from 'https';
import { PayloadGenerator } from './PayloadGenerator';
import { HTTPParser, RequestStruct } from './HTTPParser';




export class Requester {

  public static async fromFile(templatePath: string, payload: string, line?: string): Promise<[Axios.AxiosResponse, string?]> {

    return new Promise((resolve, reject) => {
      HTTPParser.fromFile(templatePath).then((parsedRequest) => {
        Requester.doRequest(parsedRequest, payload).then((response) => { resolve([response, line]); }).catch(err => reject([err, line]));
      });

    });
  }

  public static async fromString(requestContent: string, payload: string, line?: string): Promise<[Axios.AxiosResponse, string?]> {

    return new Promise((resolve, reject) => {
      const parsedRequest = HTTPParser.fromString(requestContent);
      Requester.doRequest(parsedRequest, payload).then((response) => { resolve([response, line]); }).catch(err => reject([err, line]));
    });
  }


  private static async doRequest(parsedRequest: RequestStruct | null, payload: string): Promise<Axios.AxiosResponse> {
    return new Promise((resolve, reject) => {
      if (parsedRequest === null)
        reject("Error parsing request");
      else {
        const tmp = Requester.preparePayload(parsedRequest.headers, parsedRequest.body, payload);
        const headers = tmp[0];
        const body = tmp[1];

        const r = Axios.default({
          method: parsedRequest.method,
          url: parsedRequest.url,
          headers: headers,
          httpsAgent: new Https.Agent({
            rejectUnauthorized: false
          }),
          data: body
        });

        r.then(resp => { resolve(resp); }).catch(err => { reject(err); });

      }
    });
  }


  // public static saveResponse(r: Axios.AxiosResponse): string {
  //   const rawResponse = HTTPParser.axiosResponseToString(r);
  //   const date = new Date().toISOString();
  //   const filename = `xxexploiter_response_${date}.txt`;
  //   fs.writeFileSync(filename, rawResponse);
  //   return filename;
  // }

  private static preparePayload(headers: any, body: string, payload: string) {

    const newHeaders: any = {};
    headers = Object.keys(headers).map((k: string) => {
      let v: string = headers[k];
      if (v.includes(PayloadGenerator.PLACEHOLDER))
        v = v.replace(PayloadGenerator.PLACEHOLDER, payload.replace("\n", ""));

      if (v.includes(PayloadGenerator.PLACEHOLDER_REQUEST_B64))
        v = v.replace(PayloadGenerator.PLACEHOLDER, Buffer.from(payload.replace("\n", "")).toString("base64"));

      newHeaders[k] = v;
    });

    if (body.includes(PayloadGenerator.PLACEHOLDER))
      body = body.replace(PayloadGenerator.PLACEHOLDER, payload);

    if (body.includes(PayloadGenerator.PLACEHOLDER_REQUEST_B64))
      body = body.replace(PayloadGenerator.PLACEHOLDER, Buffer.from(payload).toString("base64"));

    return [newHeaders, body];
  }



}