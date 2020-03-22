import express from "express";
import { Server } from "http";

const app = express();


export class XXEServer {

  server?: Server;

  address: string;
  port: number;
  started: boolean

  public constructor(address = "127.0.0.1", port = 7777) {
    this.address = address;
    this.port = port;
    this.started = false;
  }

  public getServerUrl(): string {
    return `http://${this.address}:${this.port}`;
  }

  public addRoute(route: string, responseContent: string, printQueryString = false): string {
    if (process.env.NODE_ENV !== "test") console.log("Setting route " + route);

    app.get(route, (request, response) => {
      if (process.env.NODE_ENV !== "test") {
        console.log("-----------------------------------------------------------");
        console.log(`[${new Date().toISOString()}] - Serving route ${route} to ip ${request.ip}`);
      }

      if (printQueryString) console.log(request.query);

      response.send(responseContent);
    });

    return this.getServerUrl() + route;
  }

  public addExtractionRoute() {
    this.addRoute("/", "", true);
  }

  public getServer() {
    return app;
  }


  public start() {

    if (!this.started) {

      if (process.env.NODE_ENV !== "test") {
        console.log(`Starting server at ${this.getServerUrl()}`);
        console.log("-----------------------------------------------------------");
      }
      this.server = app.listen(this.port, this.address);
      this.started = true;
    }
  }

  public stop() {
    if (process.env.NODE_ENV !== "test") console.log("Stopping server");
    this.server?.close();
    this.started = false;
  }

}