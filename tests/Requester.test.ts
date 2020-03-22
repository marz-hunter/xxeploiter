import { XXEServer } from "../src/XXEServer";
import { Requester } from "../src/Requester";
import path from 'path';
import { expect } from "chai";


describe('Requester', () => {




  it('should make request', async () => {
    const s = new XXEServer("127.0.0.1", 18364);
    s.addRoute("/", "body");
    s.start();

    const req = await Requester.fromFile(path.join(__dirname, "requester_test.txt"), "PAYLOADHERE");
    expect(req.config.headers["Test"]).to.eq("PAYLOADHERE");
    expect(req.data).to.eq("body");
    s.stop();
  });

});