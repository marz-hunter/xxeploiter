import * as fs from 'fs';


const pkg = JSON.parse(fs.readFileSync("package.json").toString());
fs.writeFileSync("src/Version.ts",
  `export class Version { public static version = '${pkg.version}';}`);