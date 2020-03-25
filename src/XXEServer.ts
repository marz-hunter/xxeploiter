import express from "express";
import { Server } from "http";
import { Handler } from "./Handler";

const app = express();


export class XXEServer {

  server?: Server;

  address: string;
  port: number;
  started: boolean

  definedRoutes: Array<string> = [];

  public constructor(address = "127.0.0.1", port = 7777) {
    this.address = address;
    this.port = port;
    this.started = false;
  }

  public getServerUrl(): string {
    return `http://${this.address}:${this.port}`;
  }

  public addRoute(route: string, responseContent: string, printQueryString = false): string {
    //route alread defined, just skip it
    if (this.definedRoutes.includes(route)) return this.getServerUrl() + route;

    this.definedRoutes.push(route);

    if (Handler.DEBUG) console.log("Setting route " + route);

    app.get(route, (request, response) => {
      if (Handler.DEBUG) {
        console.log(`\n[${new Date().toISOString()}] - Serving route ${route} to ip ${request.ip}`);
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

      if (Handler.DEBUG) {
        console.log(`Starting server at ${this.getServerUrl()}`);
        console.log("-----------------------------------------------------------");
      }
      this.server = app.listen(this.port, this.address);
      this.started = true;
    }
  }

  public stop() {
    if (Handler.DEBUG) console.log("Stopping server");
    this.server?.close();
    this.started = false;
  }

}