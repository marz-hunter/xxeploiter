export class CliUtils {

  public static printError(error: string) {
    if (process.env.NODE_ENV !== "test")
      console.error(`\x1b[31m[-] ${error}\x1b[0m`);
  }

  public static printInfo(info: string) {
    if (process.env.NODE_ENV !== "test")
      console.log(`[+] ${info}`);
  }

  public static printSuccess(info: string) {
    if (process.env.NODE_ENV !== "test")
      console.log(`\x1b[32m[#] ${info}\x1b[0m`);
  }
}