import { XXEServer } from "../src/XXEServer";
import { Requester } from "../src/Requester";
import path from 'path';
import { expect } from "chai";


describe('Requester', () => {




  it('should make request and save output', async () => {
    const s = new XXEServer("127.0.0.1", 18364);
    s.addRoute("/", "body");
    s.start();

    const req = await Requester.fromFile("tests/data/requester_test.txt", "PAYLOADHERE");
    expect(req[0].config.headers["Test"]).to.eq("PAYLOADHERE");
    expect(req[0].data).to.eq("body");
    s.stop();

  });

});