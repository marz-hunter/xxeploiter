#!/usr/bin/env node

import { Menu } from "./Menu";
import { Handler } from "./Handler";


const main = async () => {
  console.log(Menu.asciiArt());


  const opts = Menu.parseOptions();
  const handler = new Handler(opts);

  if (opts.fuzz) handler.fuzz();
  else handler.doWork();

};



main();
