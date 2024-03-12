import * as readlinePromises from "node:readline/promises";

class ReadlineSingleton {
    private static instance: readlinePromises.Interface;

    private constructor() {}

    public static getReadlineInterface(): readlinePromises.Interface {
        if (!ReadlineSingleton.instance) {
            ReadlineSingleton.instance = readlinePromises.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: true,
                prompt: ">> ",
            });

            ReadlineSingleton.instance.on("close", () => {
                ReadlineSingleton.instance.write("\nBye bye !\n\n");

                process.stdin.unref();
                process.exit(0);
            });

            ReadlineSingleton.instance.on("SIGINT", () => {
                ReadlineSingleton.instance.close();
            });
        }

        return ReadlineSingleton.instance;
    }
}

export default ReadlineSingleton;
