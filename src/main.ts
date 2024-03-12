import Interface from "./interface/Interface";

const mainGame = true;

console.clear();

(async () => {
    const gameInterface = new Interface();

    await gameInterface.launch(mainGame);
})();
