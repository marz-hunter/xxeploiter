
import { expect } from "chai";
import * as Axios from 'axios';
import { XXEServer } from "../src/XXEServer";
import { HTTPParser } from "../src/HTTPParser";
import fs from 'fs';
import path from 'path';

describe('HTTPParser', () => {


  it('should parse http request from string', () => {
    const request = `GET http://localhost:8000/ HTTP/1.1\nHost: localhost:8000\nConnection: keep-alive\n\ntest`;

    const parsed = HTTPParser.fromString(request);
    expect(Object.keys(parsed?.headers || {}).length).to.eq(2);
    expect(parsed?.body).to.eq("test");
    expect(parsed?.url).to.eq("http://localhost:8000/");
    expect(parsed?.method).to.eq("GET");

  });

  it("should parse axios response object", () => {
    const s = new XXEServer("127.0.0.1", 18363);
    s.addRoute("/", "body");
    s.start();

    const r = Axios.default({
      method: "GET",
      url: "http://127.0.0.1:18363/",
    });

    r.then(resp => {
      const respString = HTTPParser.axiosResponseToString(resp);
      expect(respString).to.contain("HTTP/1.1 200 OK");
      expect(respString).to.contain("x-powered-by: Express");
      expect(respString).to.contain("\n\nbody");
      expect(respString).to.contain("connection: close");

      s.stop();
    });

  });


  it("should parse request from filepath", () => {
    HTTPParser.fromFile("tests/data/request.txt").then((parsed) => {
      expect(Object.keys(parsed?.headers || {}).length).to.eq(2);
      expect(parsed?.body).to.eq("test");
      expect(parsed?.url).to.eq("http://localhost:8000/");
      expect(parsed?.method).to.eq("GET");
    });
  });

});