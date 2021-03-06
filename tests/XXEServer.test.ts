import { XXEServer } from '../src/XXEServer';

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);



describe('XXE Server', () => {

  it('should start server with extraction route', () => {
    const s = new XXEServer("127.0.0.1", 18365);
    s.addExtractionRoute();
    s.start();

    chai.request(s.getServer()).get("/").then(res => {
      expect(res.status).to.equal(200);
      s.stop();
    });



  });


});