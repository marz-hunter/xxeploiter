#!/usr/bin/env node

import { Menu } from "./Menu";
import { Handler } from "./Handler";


const main = async () => {
  console.log(Menu.asciiArt());


  const opts = Menu.parseOptions();
  const handler = new Handler(opts);

  if (opts.fuzz) {
    await handler.fuzzer();
    process.exit();
  }
  else {
    await handler.doSingle();
    if (opts.requestFile) handler.generator.server.stop(); process.exit(); //after doing single request we can stop server
  }

};



main();
