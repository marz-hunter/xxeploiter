import express from "express";
import { Server } from "http";

const app = express();


export class XXEServer {

  public static address = "127.0.0.1";
  public static port = 7777;
  server?: Server;


  public static getServerUrl(): string {
    return `http://${XXEServer.address}:${XXEServer.port}`;
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

    return XXEServer.getServerUrl() + route;
  }

  public addExtractionRoute() {
    this.addRoute("/", "", true);
  }

  public getServer() {
    return app;
  }


  public start() {
    if (process.env.NODE_ENV !== "test") {
      console.log(`Starting server at ${XXEServer.getServerUrl()}`);
      console.log("-----------------------------------------------------------");
    }
    this.server = app.listen(XXEServer.port, XXEServer.address);
  }

  public stop() {
    if (process.env.NODE_ENV !== "test") console.log("Stopping server");
    this.server?.close();
  }

}