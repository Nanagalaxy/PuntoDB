import * as readlinePromises from "node:readline/promises";
import {Coordinates} from "../game/Card";
import ReadlineSingleton from "./ReadlineSingleton";
import {PlayerOptions} from "../game/Player";
import {BoardOptions} from "../game/Board";
import CreatePunto from "../game/CreatePunto";
import Punto, {PuntoOptions, DisplayBoardMode} from "../game/Punto";
import DBWrapper, {DBList} from "../db/DBWrapper";
import UserManager from "../entities/User";
import {ResultStatus} from "../db/Result";
import GameManager from "../entities/Game";
import Neo4jManager from "../db/Neo4jManager";

enum InterfaceType {
    None = "None",
    Console = "Console",
    Web = "Web",
}

/**
 * Represents the interface to the user.
 */
class Interface {
    private _state: IInterfaceState;

    constructor() {
        this._state = this.determineInterfaceType();
    }

    private determineInterfaceType(): IInterfaceState {
        if (typeof window === "object") {
            return new WebState();
        } else if (typeof process === "object") {
            return new ConsoleState();
        } else {
            return new NoneState();
        }
    }

    /**
     * Gets the type of interface.
     * @param isString Determines whether to return the interface type as a string or as an enum.
     * @returns The type of interface.
     */
    public getInterfaceType(isString: boolean = false): InterfaceType | string {
        return this._state.getInterfaceType(isString);
    }

    /**
     * Gets the coordinates of the card to play.
     * @param options Options for the coordinates.
     * @returns The coordinates of the card to play. If the player refused to play, returns false.
     */
    public async getCoordinates(
        options: unknown = {},
    ): Promise<Coordinates | false> {
        return await this._state.getCoordinates(options);
    }

    /**
     * Launches the program.
     * @param game Determines whether the game is launched or not. If not, the program will launch in a test mode.
     */
    public async launch(game: boolean): Promise<void> {
        return await this._state.launch(game);
    }
}

/**
 * Interface for interfaces states.
 */
interface IInterfaceState {
    /**
     * Instance of DBWrapper.
     * @see DBWrapper
     */
    dbWrapper: DBWrapper;

    /**
     * Gets the type of interface.
     * @param {boolean} isString Determines whether to return the interface type as a string or as an enum. Default: false.
     * @returns {InterfaceType | string} The type of interface.
     */
    getInterfaceType(isString: boolean): InterfaceType | string;

    /**
     * Gets the coordinates of the card to play.
     * @param {unknown} options Options for the coordinates.
     * @returns {Promise<Coordinates | false>} The coordinates of the card to play. If the player refused to play, returns false.
     */
    getCoordinates(options: unknown): Promise<Coordinates | false>;

    /**
     * Launches the program.
     * @param {boolean} game Determines whether the game is launched or not. If not, the program will launch in a test mode.
     */
    launch(game: boolean): Promise<void>;
}

/**
 * Represents the console interface.
 */
class ConsoleState implements IInterfaceState {
    /**
     * Instance of DBWrapper.
     * This is a public and readonly member of ConsoleState.
     * For more information, refer to DBWrapper documentation.
     * @public
     * @readonly
     * @type {DBWrapper}
     * @memberof ConsoleState
     * @see DBWrapper
     */
    public readonly dbWrapper: DBWrapper = DBWrapper.getInstance();

    /**
     * Determines whether the terminal supports user input.
     * @private
     * @type {boolean}
     * @memberof ConsoleState
     */
    private _terminalSupportUserInput: boolean = false;

    /**
     * Determines whether the terminal supports user input.
     * @public
     * @readonly
     * @type {boolean}
     * @memberof ConsoleState
     */
    public get terminalSupportUserInput(): boolean {
        return this._terminalSupportUserInput;
    }

    /**
     * Instance of readline.Interface.
     * @private
     * @type {readline.Interface}
     * @memberof ConsoleState
     */
    private _rl: readlinePromises.Interface =
        ReadlineSingleton.getReadlineInterface();

    /**
     * Instance of readline.Interface.
     * This is a public and readonly member of ConsoleState.
     * For more information, refer to Node.js documentation.
     * @public
     * @readonly
     * @type {readline.Interface}
     * @memberof ConsoleState
     */
    public get rl(): readlinePromises.Interface {
        return this._rl;
    }

    /**
     * Gets the type of interface.
     * @param {boolean} isString Determines whether to return the interface type as a string or as an enum. Default: false.
     * @returns {InterfaceType | string} The type of interface.
     * @see InterfaceType
     */
    public getInterfaceType(isString: boolean): InterfaceType | string {
        if (isString) {
            return InterfaceType[InterfaceType.Console];
        } else {
            return InterfaceType.Console;
        }
    }

    /**
     * Gets the coordinates of the card to play.
     * @param {unknown} options Options for the coordinates.
     * @returns {Promise<Coordinates | false>} The coordinates of the card to play. If the player refused to play, returns false.
     */
    public async getCoordinates(
        options: unknown = {},
    ): Promise<Coordinates | false> {
        const {
            firstTimeToDemandeCoordinates,
            playerName,
            cardColor,
            cardValue,
        } = options as {
            firstTimeToDemandeCoordinates: boolean | undefined;
            playerName: string | undefined;
            cardColor: string | undefined;
            cardValue: number | undefined;
        };

        await this.sleep();

        if (!firstTimeToDemandeCoordinates) {
            this.writeInConsole(
                "The coordinates you entered are invalid\nYou can refuse to play if you don't have any coordinates available",
                2,
                1,
            );

            await this.sleep();
        } else {
            this.writeInConsole(`${playerName}'s turn`, 2);

            await this.sleep();
        }

        this.writeInConsole(`Card to play: ${cardColor} ${cardValue}`, 2);

        await this.sleep();

        return new Promise<Coordinates | false>((resolve) => {
            const questionX = async () => {
                const answerX = await this.askQuestion(
                    'X ("auto" for auto play of refuse if no x is available): ',
                );

                if (answerX === false) {
                    this.writeInConsole("You refused to play", 2, 1);

                    await this.sleep();

                    resolve(false);
                } else if (answerX === "auto") {
                    this.writeInConsole("Auto play", 2, 1);

                    await this.sleep();

                    questionY(Infinity);
                } else {
                    const x = Number.parseInt(answerX);

                    if (Number.isNaN(x)) {
                        this.writeInConsole(
                            "Please enter a valid number",
                            2,
                            1,
                        );

                        await this.sleep();

                        questionX();
                    } else {
                        questionY(x);
                    }
                }
            };

            const questionY = async (x: number) => {
                if (x === Infinity) {
                    resolve({x, y: Infinity});
                    return;
                }

                const answerY = await this.askQuestion(
                    'Y ("auto" for auto play or refuse if no y is available): ',
                );

                if (answerY === false) {
                    this.writeInConsole("You refused to play", 2, 1);

                    await this.sleep();

                    resolve(false);
                } else if (answerY === "auto") {
                    this.writeInConsole("Auto play", 2, 1);

                    await this.sleep();

                    resolve({x, y: Infinity});
                } else {
                    const y = Number.parseInt(answerY);

                    if (Number.isNaN(y)) {
                        this.writeInConsole(
                            "Please enter a valid number",
                            2,
                            1,
                        );

                        await this.sleep();

                        questionY(x);
                    } else {
                        this.writeInConsole(
                            `Coordinates entered: (${x}, ${y})`,
                            2,
                            1,
                        );

                        await this.sleep();

                        resolve({x, y});
                    }
                }
            };

            this.writeInConsole(
                "Please enter the coordinates of the card you want to play",
                2,
            );

            questionX();
        });
    }

    /**
     * Sleeps for `ms` milliseconds.
     * @param {number} ms The number of milliseconds to sleep.
     * @returns {Promise<void>} A promise that resolves when the sleep is over.
     *
     * Use it with `await`, else the sleep will be ignored.
     *
     * @example
     * await this.sleep(); // Sleeps for 200 milliseconds
     * await this.sleep(1000); // Sleeps for 1 second
     *
     */
    private async sleep(ms: number = 200): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Writes a message in the console.
     * @param {string} message The message to write.
     * @param {number} nbrLineBreakAfter The number of line breaks to add after the message. Default: 0.
     * @param {number} nbrLineBreakBefore The number of line breaks to add before the message. Default: 0.
     * @returns {void}
     */
    private writeInConsole(
        message: string,
        nbrLineBreakAfter: number = 0,
        nbrLineBreakBefore: number = 0,
    ): void {
        if (this._terminalSupportUserInput) {
            const messageToWrite =
                "\n".repeat(nbrLineBreakBefore) +
                message +
                "\n".repeat(nbrLineBreakAfter);
            this._rl.write(messageToWrite);
        } else {
            const messageToWrite =
                "\n".repeat(nbrLineBreakBefore) +
                message +
                (nbrLineBreakAfter !== 0
                    ? "\n".repeat(nbrLineBreakAfter - 1)
                    : "");
            console.log(messageToWrite);
        }
    }

    /**
     * Launches the program.
     * @param {boolean} game Determines whether the game is launched or not. If not, the program will launch in a test mode.
     * @returns {Promise<void>} A promise that resolves when the program has been launched and closed.
     */
    public async launch(game: boolean): Promise<void> {
        if (game) {
            process.stdout.write("\x1b]0;PuntoDB\x07");

            if (process.stdin.isTTY) {
                this._terminalSupportUserInput = true;

                this.writeInConsole("Terminal support user input", 1, 1);

                const chooseProgramMode = async () => {
                    this.writeInConsole(
                        "Type 'exit' to exit the program",
                        2,
                        1,
                    );

                    await this.sleep();

                    this.writeInConsole(
                        "Type 'game' to play a game (not saved by default)",
                        2,
                    );

                    await this.sleep();

                    this.writeInConsole(
                        "Type 'db' to use database commands (for example, toggle saving in the database)",
                        2,
                    );

                    await this.sleep();

                    const answer = await this.askQuestion(
                        "What do you want to do? ",
                    );

                    if (answer === false) {
                        return;
                    } else if (answer.toLowerCase() === "game") {
                        this.writeInConsole("Game mode", 2, 1);
                        await this.launchGameUserInput();
                    } else if (answer.toLowerCase() === "db") {
                        this.writeInConsole("DB mode", 2, 1);
                        await this.launchDBUserInput();
                    } else {
                        this.writeInConsole(
                            `Unknown command "${answer}"`,
                            1,
                            1,
                        );
                    }

                    await this.sleep();

                    await chooseProgramMode();
                };

                await chooseProgramMode();
            } else {
                this.writeInConsole(
                    "Terminal doesn't support user input",
                    2,
                    1,
                );

                await this.launchGameNoUserInput();
            }
        } else {
            process.stdout.write("\x1b]0;Test\x07");

            this.writeInConsole("Test mode", 1);

            await this.testMode();
        }

        await this.dbWrapper.close();

        this._rl.close();

        return;
    }

    /**
     * Launches the game with user input.
     * @returns {Promise<void>} A promise that resolves when the game has been launched and closed.
     */
    private async launchGameUserInput(): Promise<void> {
        const answer = await this.askQuestion(
            "Would you like to play Punto? (Y / n / g[number]) ",
        );

        if (answer === false) {
            return;
        }

        if (answer.toLowerCase().startsWith("g")) {
            const numberOfGames = Number.parseInt(answer.slice(1));

            if (Number.isNaN(numberOfGames)) {
                this.writeInConsole("Please enter a valid number", 2, 1);

                await this.launchGameUserInput();

                return;
            } else {
                await this.generateGame(numberOfGames);

                await this.launchGameUserInput();

                return;
            }
        }

        await this.playGame();

        await this.launchGameUserInput();

        return;
    }

    /**
     * Asks a question to the user.
     * @param {string} question The question to ask.
     * @returns {Promise<string | false>} The answer to the question. If the answer is false, the user refused.
     */
    private async askQuestion(question: string): Promise<string | false> {
        const refuseAnswer = [
            "bye",

            "exit",

            "false",

            "n",
            "no",

            "q",
            "quit",

            "refuse",

            "stop",
        ];

        // this.writeInConsole(`Refuse answer: ${refuseAnswer.join(", ")}`, 1);

        const answer = await this._rl.question(question);

        if (refuseAnswer.includes(answer.toLowerCase())) {
            return false;
        }

        return answer;
    }

    /**
     * Plays the punto.
     * @param punto The punto to play.
     */
    private async playPunto(punto: Punto): Promise<void> {
        await punto.playGame();
    }

    /**
     * Resets the punto.
     * @param punto The punto to reset.
     */
    private resetPunto(punto: Punto): void {
        punto.reset();
    }

    /**
     * Displays the game results.
     * @param {Punto} punto The punto to display the results of.
     * @returns {Promise<void>} A promise that resolves when the results have been displayed.
     */
    private async displayGameResult(punto: Punto): Promise<void> {
        this.writeInConsole("Game results:", 1);

        await this.sleep();

        // let totalPoints = 0;
        // let totalParties = 0;

        punto.board.players.forEach((player) => {
            this.writeInConsole(
                `${player.name}: ${player.points} | nbrFirstPlayer : ${player.nbrFirstPlayer}`,
                1,
            );

            // totalPoints += player.points;
            // totalParties += player.nbrFirstPlayer;
        });

        // this.writeInConsole(
        //     `Total games won: ${totalPoints} / ${totalParties}`,
        //     2,
        //     1,
        // );

        this.writeInConsole("", 1);
    }

    /**
     * Generates and plays `numberOfGames` games.
     * @param {number} numberOfGames The number of games to generate and play.
     * @returns {Promise<void>} A promise that resolves when the games have been generated and played.
     */
    private async generateGame(numberOfGames: number): Promise<void> {
        let nbrPlayers = 2;

        const condToValidateNbrPlayers = (answerNbrPlayers: number) => {
            // Number.isFinite(n) // true if n is a number, false if n is Infinity or NaN or not a number (string, boolean, object, etc.)
            return (
                Number.isNaN(answerNbrPlayers) ||
                answerNbrPlayers < 2 ||
                answerNbrPlayers > 4
            );
        };

        do {
            const answerNbrPlayers = await this.askQuestion(
                "Number of players (blank for 2): ",
            );

            if (answerNbrPlayers === false) {
                return;
            } else if (answerNbrPlayers === "") {
                nbrPlayers = 2;
            } else {
                nbrPlayers = Number.parseInt(answerNbrPlayers);

                if (condToValidateNbrPlayers(nbrPlayers)) {
                    this.writeInConsole(
                        "Please enter a valid number (between 2 and 4)",
                        2,
                        1,
                    );
                }
            }
        } while (condToValidateNbrPlayers(nbrPlayers));

        const listPlayerOptions: PlayerOptions[] = [];

        let noPlayerFirstTurn = true;

        for (let i = 0; i < nbrPlayers; i++) {
            const answerPlayerName = await this.askQuestion(
                `Player ${i + 1} name (blank for "Player ${i + 1}"): `,
            );

            if (answerPlayerName === false) {
                return;
            }

            const playerName =
                answerPlayerName === "" ? `Player ${i + 1}` : answerPlayerName;

            let firstTurn = false;

            if (noPlayerFirstTurn) {
                const answerPlayerFirstTurn = await this.askQuestion(
                    `Is ${playerName} the first player? (Y / n) `,
                );

                if (
                    answerPlayerFirstTurn !== false &&
                    (answerPlayerFirstTurn === "" ||
                        answerPlayerFirstTurn.toLowerCase() === "y")
                ) {
                    firstTurn = true;
                    noPlayerFirstTurn = false;
                }
            }

            const playerOptions: PlayerOptions = {
                name: playerName,
                isTurn: firstTurn,
            };

            listPlayerOptions.push(playerOptions);
        }

        const boardOptions: BoardOptions = {
            nbrPlayers: nbrPlayers,
            listPlayerOptions: listPlayerOptions,
        };

        const puntoOptions: PuntoOptions = {
            displayBoard: DisplayBoardMode.noDisplay,
            displayResultOfGame: false,
            boardOption: boardOptions,
            auto: true,
        };

        const createPunto = new CreatePunto(puntoOptions);

        createPunto.createPunto();

        const punto = createPunto.getPunto();

        if (punto === null) {
            console.error("Punto is null");
            process.exit(1);
        }

        const startTime = Date.now();

        this.writeInConsole(`Playing ${numberOfGames} games...`, 1, 1);

        for (let i = 0; i < numberOfGames; i++) {
            await this.playPunto(punto);

            await this.savePunto(punto);

            this.resetPunto(punto);

            process.stdout.write(`\rGame ${i + 1}`);
        }

        const endTime = Date.now();

        this.writeInConsole(
            `Seconds elapsed: ${(endTime - startTime) / 1000}`,
            2,
            2,
        );

        // await this.displayGameResult(punto); // Not displaying because player points it's now reset
    }

    /**
     * Plays the punto.
     * @returns {Promise<void>} A promise that resolves when the game has been played.
     */
    private async playGame(): Promise<void> {
        let nbrPlayers = 2;

        const condToValidateNbrPlayers = (answerNbrPlayers: number) => {
            // Number.isFinite(n) // true if n is a number, false if n is Infinity or NaN or not a number (string, boolean, object, etc.)
            return (
                Number.isNaN(answerNbrPlayers) ||
                answerNbrPlayers < 2 ||
                answerNbrPlayers > 4
            );
        };

        do {
            const answerNbrPlayers = await this.askQuestion(
                "Number of players (blank for 2): ",
            );

            if (answerNbrPlayers === false) {
                return;
            } else if (answerNbrPlayers === "") {
                nbrPlayers = 2;
            } else {
                nbrPlayers = Number.parseInt(answerNbrPlayers);

                if (condToValidateNbrPlayers(nbrPlayers)) {
                    this.writeInConsole(
                        "Please enter a valid number (between 2 and 4)",
                        2,
                        1,
                    );
                }
            }
        } while (condToValidateNbrPlayers(nbrPlayers));

        /**
         * Contains the options of the players.
         * @type {PlayerOptions[]}
         */
        const listPlayerOptions: PlayerOptions[] = [];

        /**
         * Determines if a player has already been designated as the first player.
         * @type {boolean}
         */
        let noPlayerFirstTurn: boolean = true;

        /**
         * Contains the names of the players already entered.
         * @type {string[]}
         */
        const busyPlayerNames: string[] = [];

        for (let i = 0; i < nbrPlayers; i++) {
            const answerPlayerName = await this.askQuestion(
                `Player ${i + 1} name (blank for "Player ${i + 1}"): `,
            );

            if (answerPlayerName === false) {
                return;
            }

            const playerName: string =
                answerPlayerName === "" ? `Player ${i + 1}` : answerPlayerName;

            if (busyPlayerNames.includes(playerName)) {
                this.writeInConsole(
                    `The name "${playerName}" is already used`,
                    2,
                    1,
                );

                i--; // To ask the same player name again

                continue;
            } else {
                busyPlayerNames.push(playerName);
            }

            /**
             * Determines if the player is the first player.
             * @type {boolean}
             */
            let firstTurn: boolean = false;

            if (noPlayerFirstTurn) {
                const answerPlayerFirstTurn = await this.askQuestion(
                    `Is ${playerName} the first player? (Y / n) `,
                );

                if (
                    answerPlayerFirstTurn !== false &&
                    (answerPlayerFirstTurn === "" ||
                        answerPlayerFirstTurn.toLowerCase() === "y")
                ) {
                    firstTurn = true;
                    noPlayerFirstTurn = false;
                }
            }

            const playerOptions: PlayerOptions = {
                name: playerName,
                isTurn: firstTurn,
            };

            listPlayerOptions.push(playerOptions);
        }

        this.writeInConsole("Starting game...", 2, 1);

        await this.sleep();

        const boardOptions: BoardOptions = {
            nbrPlayers: nbrPlayers,
            listPlayerOptions: listPlayerOptions,
        };

        const puntoOptions: PuntoOptions = {
            displayBoard: DisplayBoardMode.eachPlayerTurn,
            displayResultOfGame: true,
            boardOption: boardOptions,
            auto: false,
        };

        const createPunto = new CreatePunto(puntoOptions);

        createPunto.createPunto();

        const punto = createPunto.getPunto();

        if (punto === null) {
            this.writeInConsole(
                "The game hasn't been correctly initialized. Please try again.",
                2,
                1,
            );
            return;
        }

        if (punto.board.boardIsEmpty()) {
            this.writeInConsole(
                "The board is empty, the first card will be played automatically by the first player in (0, 0)",
                2,
            );

            await this.sleep();
        }

        await this.playPunto(punto);

        await this.savePunto(punto);

        this.resetPunto(punto);

        await this.sleep();

        await this.displayGameResult(punto);
    }

    /**
     * Plays the punto without user input.
     * @returns {Promise<void>} A promise that resolves when the game has been played.
     */
    private async launchGameNoUserInput(): Promise<void> {
        this.writeInConsole("Auto play", 2);

        await this.sleep();

        const nbrPlayers = 2;

        const player1: PlayerOptions = {
            name: "Player 1",
            isTurn: true,
        };

        const player2: PlayerOptions = {
            name: "Player 2",
        };

        const player3: PlayerOptions = {
            name: "Player 3",
        };

        const player4: PlayerOptions = {
            name: "Player 4",
        };

        this.writeInConsole("Starting game...", 2);

        await this.sleep();

        const boardOptions: BoardOptions = {
            nbrPlayers: nbrPlayers,
            listPlayerOptions: [player1, player2, player3, player4],
        };

        const puntoOptions: PuntoOptions = {
            displayBoard: DisplayBoardMode.onlyEnd,
            displayResultOfGame: true,
            boardOption: boardOptions,
            auto: true,
        };

        const createPunto = new CreatePunto(puntoOptions);

        createPunto.createPunto();

        const punto = createPunto.getPunto();

        if (punto === null) {
            console.error("Punto is null");
            process.exit(1);
        }

        await this.playPunto(punto);

        await this.savePunto(punto);

        this.resetPunto(punto);

        await this.sleep();

        await this.displayGameResult(punto);
    }

    /**
     * Saves the punto in the database(s).
     * @param {Punto} punto The punto to save.
     * @returns {Promise<void>} A promise that resolves when the punto has been saved.
     */
    private async savePunto(punto: Punto): Promise<void> {
        // Sauvegarder les joueurs

        const players = punto.board.players;

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const findResults = await UserManager.find(player.name);

            const isArrayWithData = (data: unknown): boolean => {
                return Array.isArray(data) && data.length > 0;
            };

            // Vérifier si l'utilisateur existe dans chaque base de données
            const userExistsInMySQL = isArrayWithData(
                findResults.mySqlRepo?.data,
            );
            const userExistsInSQLite = isArrayWithData(
                findResults.sqliteRepo?.data,
            );
            const userExistsInMongo = isArrayWithData(
                findResults.mongoRepo?.data,
            );

            // Si l'utilisateur n'existe dans aucune base de données ou s'il n'existe pas dans toutes les bases de données
            if (
                !userExistsInMySQL ||
                !userExistsInSQLite ||
                !userExistsInMongo
            ) {
                // Construire ou reconstruire l'utilisateur
                const user =
                    userExistsInMySQL || userExistsInSQLite || userExistsInMongo
                        ? await UserManager.build(player.name)
                        : new UserManager(this.dbWrapper, player.name);

                if (
                    userExistsInMySQL ||
                    userExistsInSQLite ||
                    userExistsInMongo
                ) {
                    await user.rebuild();
                }

                const saveResultsUsers = await user.save();

                const mySqlUserStatus = saveResultsUsers.mySqlRepo?.status;
                const sqliteUserStatus = saveResultsUsers.sqliteRepo?.status;
                const mongoUserStatus = saveResultsUsers.mongoRepo?.status;

                // Backup error handling
                if (
                    mySqlUserStatus !== undefined &&
                    mySqlUserStatus !== ResultStatus.Success
                ) {
                    console.error(saveResultsUsers.mySqlRepo?.error);
                }
                if (
                    sqliteUserStatus !== undefined &&
                    sqliteUserStatus !== ResultStatus.Success
                ) {
                    console.error(saveResultsUsers.sqliteRepo?.error);
                }
                if (
                    mongoUserStatus !== undefined &&
                    mongoUserStatus !== ResultStatus.Success
                ) {
                    console.error(saveResultsUsers.mongoRepo?.error);
                }
            } else {
                // L'utilisateur existe dans toutes les bases de données, aucune action n'est requise
            }
        }

        // Sauvegarder le jeu

        const board = punto.board;

        const game = new GameManager(this.dbWrapper);

        await game.buildEntities(board);

        const saveResultsGame = await game.save();

        // Save for Neo4j
        if (
            this.dbWrapper.Neo4jConnection &&
            this.dbWrapper.dbToUse.includes(DBList.Neo4j)
        ) {
            const neo4jManager = Neo4jManager.getInstance(
                this.dbWrapper.Neo4jConnection,
            );

            await neo4jManager.createIfNotExist(punto.board);
        }

        const mySqlGameStatus = saveResultsGame.mySqlRepo?.status;
        const sqliteGameStatus = saveResultsGame.sqliteRepo?.status;
        const mongoGameStatus = saveResultsGame.mongoRepo?.status;

        // Backup error handling
        if (
            mySqlGameStatus !== undefined &&
            mySqlGameStatus !== ResultStatus.Success
        ) {
            console.error(saveResultsGame.mySqlRepo?.error);
        }
        if (
            sqliteGameStatus !== undefined &&
            sqliteGameStatus !== ResultStatus.Success
        ) {
            console.error(saveResultsGame.sqliteRepo?.error);
        }
        if (
            mongoGameStatus !== undefined &&
            mongoGameStatus !== ResultStatus.Success
        ) {
            console.error(saveResultsGame.mongoRepo?.error);
        }
    }

    /**
     * Launches the database mode with user input.
     * @returns {Promise<void>} A promise that resolves when the database mode has been launched and closed.
     */
    private async launchDBUserInput(): Promise<void> {
        // const answer = await this.askQuestion(
        //     "Use databases commands? (Y / n) ",
        // );

        // if (answer === false) {
        //     this.writeInConsole("Database mode canceled", 2, 1);
        //     return;
        // }

        let useMySQL: boolean = false;
        let useSQLite: boolean = false;
        let useMongo: boolean = false;
        let useNeo4j: boolean = false;

        const dbUsed = this.dbWrapper.dbToUse;

        if (dbUsed === "All") {
            useMySQL = true;
            useSQLite = true;
            useMongo = true;
            useNeo4j = true;
        } else {
            if (dbUsed.includes(DBList.MySql)) {
                useMySQL = true;
            }
            if (dbUsed.includes(DBList.SQLite)) {
                useSQLite = true;
            }
            if (dbUsed.includes(DBList.Mongo)) {
                useMongo = true;
            }
            if (dbUsed.includes(DBList.Neo4j)) {
                useNeo4j = true;
            }
        }

        this.writeInConsole("Type 'exit' to exit the database mode", 2);

        await this.sleep();

        this.writeInConsole(
            "Activated databases will be used for game saving." +
                "\nDeactivated databases will not be used for game saving.",
            1,
        );

        const writeDBUsed = () => {
            if (useMySQL && useSQLite && useMongo && useNeo4j) {
                this.writeInConsole("MySQL", 1);
                this.writeInConsole("SQLite", 1);
                this.writeInConsole("MongoDB", 1);
                this.writeInConsole("Neo4j", 1);
            } else if (!useMySQL && !useSQLite && !useMongo && !useNeo4j) {
                this.writeInConsole("None", 1);
            } else {
                if (useMySQL) {
                    this.writeInConsole("MySQL", 1);
                }
                if (useSQLite) {
                    this.writeInConsole("SQLite", 1);
                }
                if (useMongo) {
                    this.writeInConsole("MongoDB", 1);
                }
                if (useNeo4j) {
                    this.writeInConsole("Neo4j", 1);
                }
            }
        };

        this.writeInConsole("Currently used databases:", 2, 1);

        writeDBUsed();

        await this.sleep();

        this.writeInConsole("Type 'mysql' to toggle MySQL (ON/OFF)", 1, 1);

        await this.sleep();

        this.writeInConsole("Type 'sqlite' to toggle SQLite (ON/OFF)", 1);

        await this.sleep();

        this.writeInConsole("Type 'mongo' to toggle MongoDB (ON/OFF)", 1);

        await this.sleep();

        this.writeInConsole("Type 'neo4j' to toggle Neo4j (ON/OFF)", 1);

        await this.sleep();

        this.writeInConsole(
            "You can activate multiple databases. Enter the name of each one you wish to toggle.",
            1,
            1,
        );

        await this.sleep();

        this.writeInConsole("Type 'all' to toggle all databases (ON/OFF)", 1);

        await this.sleep();

        this.writeInConsole("Type 'empty' to empty the active databases", 1, 1);

        await this.sleep();

        this.writeInConsole("Type 'transfer' to transfer data", 2, 1);

        await this.sleep();

        const chooseDB = async () => {
            const answer = await this.askQuestion("What do you want to do? ");

            if (answer === false) {
                return;
            } else if (answer.toLowerCase() === "mysql") {
                if (useMySQL) {
                    await this.dbWrapper.close([DBList.MySql]);
                    this.writeInConsole("MySQL has been deactivated.", 2);
                    useMySQL = false;
                } else {
                    await this.dbWrapper.init([DBList.MySql]);
                    this.writeInConsole("MySQL has been activated.", 2);
                    useMySQL = true;
                }
            } else if (answer.toLowerCase() === "sqlite") {
                if (useSQLite) {
                    await this.dbWrapper.close([DBList.SQLite]);
                    this.writeInConsole("SQLite has been deactivated.", 2);
                    useSQLite = false;
                } else {
                    await this.dbWrapper.init([DBList.SQLite]);
                    this.writeInConsole("SQLite has been activated.", 2);
                    useSQLite = true;
                }
            } else if (answer.toLowerCase() === "mongo") {
                if (useMongo) {
                    await this.dbWrapper.close([DBList.Mongo]);
                    this.writeInConsole("MongoDB has been deactivated.", 2);
                    useMongo = false;
                } else {
                    await this.dbWrapper.init([DBList.Mongo]);
                    this.writeInConsole("MongoDB has been activated.", 2);
                    useMongo = true;
                }
            } else if (answer.toLowerCase() === "neo4j") {
                if (useNeo4j) {
                    await this.dbWrapper.close([DBList.Neo4j]);
                    this.writeInConsole("Neo4j has been deactivated.", 2);
                    useNeo4j = false;
                } else {
                    await this.dbWrapper.init([DBList.Neo4j]);
                    this.writeInConsole("Neo4j has been activated.", 2);
                    useNeo4j = true;
                }
            } else if (answer.toLowerCase() === "all") {
                if (useMySQL || useSQLite || useMongo || useNeo4j) {
                    await this.dbWrapper.close();
                    this.writeInConsole(
                        "All databases have been deactivated.",
                        2,
                    );
                    useMySQL = false;
                    useSQLite = false;
                    useMongo = false;
                    useNeo4j = false;
                } else {
                    await this.dbWrapper.init();
                    this.writeInConsole(
                        "All databases have been activated.",
                        2,
                    );
                    useMySQL = true;
                    useSQLite = true;
                    useMongo = true;
                    useNeo4j = true;
                }
            } else if (answer.toLowerCase() === "empty") {
                const gameResult = await GameManager.removeAll();
                const userResult = await UserManager.removeAll();

                if (this.dbWrapper.Neo4jConnection) {
                    const neo4jManager = Neo4jManager.getInstance(
                        this.dbWrapper.Neo4jConnection,
                    );

                    neo4jManager.deleteAll();

                    this.writeInConsole("Neo4j has been emptied.", 1);
                }

                const mySqlGameResultStatus = gameResult.mySqlRepo?.status;
                const sqliteGameResultStatus = gameResult.sqliteRepo?.status;
                const mongoGameResultStatus = gameResult.mongoRepo?.status;

                const mySqlUserResultStatus = userResult.mySqlRepo?.status;
                const sqliteUserResultStatus = userResult.sqliteRepo?.status;
                const mongoUserResultStatus = userResult.mongoRepo?.status;

                // Backup error handling
                if (
                    mySqlGameResultStatus !== undefined &&
                    mySqlGameResultStatus !== ResultStatus.Success &&
                    mySqlUserResultStatus !== undefined &&
                    mySqlUserResultStatus !== ResultStatus.Success
                ) {
                    console.error(gameResult.mySqlRepo?.error);
                    console.error(userResult.mySqlRepo?.error);
                } else {
                    if (useMySQL) {
                        this.writeInConsole("MySQL has been emptied.", 1);
                    }
                }

                if (
                    sqliteGameResultStatus !== undefined &&
                    sqliteGameResultStatus !== ResultStatus.Success &&
                    sqliteUserResultStatus !== undefined &&
                    sqliteUserResultStatus !== ResultStatus.Success
                ) {
                    console.error(gameResult.sqliteRepo?.error);
                    console.error(userResult.sqliteRepo?.error);
                } else {
                    if (useSQLite) {
                        this.writeInConsole("SQLite has been emptied.", 1);
                    }
                }

                if (
                    mongoGameResultStatus !== undefined &&
                    mongoGameResultStatus !== ResultStatus.Success &&
                    mongoUserResultStatus !== undefined &&
                    mongoUserResultStatus !== ResultStatus.Success
                ) {
                    // * Silently ignore error code 26 (NamespaceNotFound)
                    // * because it means that the collection is already empty
                    if (
                        (gameResult.mongoRepo?.error as {code: number}).code !==
                            26 &&
                        (userResult.mongoRepo?.error as {code: number}).code !==
                            26
                    ) {
                        console.error(gameResult.mongoRepo?.error);
                        console.error(userResult.mongoRepo?.error);
                    }
                } else {
                    if (useMongo) {
                        this.writeInConsole("MongoDB has been emptied.", 1);
                    }
                }

                this.writeInConsole("", 1);

                await this.sleep();
            } else if (answer.toLowerCase() === "transfer") {
                this.writeInConsole(
                    "Type the name of the source database",
                    1,
                    1,
                );

                await this.sleep();

                let sourceDB: DBList | undefined;

                let firstAskSourceDB = true;

                do {
                    if (!firstAskSourceDB) {
                        this.writeInConsole(
                            "Please enter a valid database name",
                            2,
                            1,
                        );
                    }

                    const answerSourceDB = await this.askQuestion(
                        "Source database: ",
                    );

                    if (answerSourceDB === false) {
                        return;
                    }

                    switch (answerSourceDB.toLowerCase()) {
                        case "mysql":
                            sourceDB = DBList.MySql;
                            break;
                        case "sqlite":
                            sourceDB = DBList.SQLite;
                            break;
                        case "mongo":
                            sourceDB = DBList.Mongo;
                            break;
                        case "neo4j":
                            sourceDB = DBList.Neo4j;
                            break;
                        default:
                            break;
                    }

                    if (firstAskSourceDB) {
                        firstAskSourceDB = false;
                    }
                } while (
                    sourceDB !== DBList.MySql &&
                    sourceDB !== DBList.SQLite &&
                    sourceDB !== DBList.Mongo &&
                    sourceDB !== DBList.Neo4j
                );

                this.writeInConsole(
                    "Type the name of the destination database",
                    1,
                    1,
                );

                await this.sleep();

                let destinationDB: DBList | undefined;

                let firstAskDestinationDB = true;

                do {
                    if (!firstAskDestinationDB) {
                        this.writeInConsole(
                            "Please enter a valid database name (different from the source database)",
                            2,
                            1,
                        );
                    }

                    const answerDestinationDB = await this.askQuestion(
                        "Destination database: ",
                    );

                    if (answerDestinationDB === false) {
                        return;
                    }

                    switch (answerDestinationDB.toLowerCase()) {
                        case "mysql":
                            destinationDB = DBList.MySql;
                            break;
                        case "sqlite":
                            destinationDB = DBList.SQLite;
                            break;
                        case "mongo":
                            destinationDB = DBList.Mongo;
                            break;
                        case "neo4j":
                            destinationDB = DBList.Neo4j;
                            break;
                        default:
                            break;
                    }

                    if (firstAskDestinationDB) {
                        firstAskDestinationDB = false;
                    }
                } while (
                    destinationDB !== DBList.MySql &&
                    destinationDB !== DBList.SQLite &&
                    destinationDB !== DBList.Mongo &&
                    destinationDB !== DBList.Neo4j &&
                    destinationDB !== sourceDB
                );

                const transferResult = await this.dbWrapper.transfer(
                    sourceDB,
                    destinationDB,
                );

                if (transferResult.status === ResultStatus.Success) {
                    this.writeInConsole(
                        `${sourceDB} has been transfered to ${destinationDB}`,
                        1,
                    );
                } else {
                    this.writeInConsole(`Error: ${transferResult.error}`, 1);
                }

                await this.sleep();

                this.writeInConsole("", 1);
            } else {
                this.writeInConsole(`Unknown command "${answer}"`, 1, 1);
            }

            await this.sleep();

            await chooseDB();
        };

        await chooseDB();

        this.writeInConsole("Used databases:", 2, 1);

        writeDBUsed();

        await this.sleep();

        this.writeInConsole("Database mode ended", 1, 1);
    }

    /**
     * Launches the test mode.
     * @returns {Promise<void>} A promise that resolves when the test mode has been launched and closed.
     */
    private async testMode(): Promise<void> {
        console.log("No test to do");
    }
}

/**
 * Represents the web interface.
 * Currently not implemented.
 */
class WebState implements IInterfaceState {
    /**
     * Instance of DBWrapper.
     * This is a public and readonly member of WebState.
     * For more information, refer to DBWrapper documentation.
     * @public
     * @readonly
     * @type {DBWrapper}
     * @memberof WebState
     * @see DBWrapper
     */
    public readonly dbWrapper: DBWrapper = DBWrapper.getInstance();

    /**
     * Gets the type of interface.
     * @param {boolean} isString Determines whether to return the interface type as a string or as an enum. Default: false.
     * @returns {InterfaceType | string} The type of interface.
     */
    public getInterfaceType(isString: boolean): InterfaceType | string {
        if (isString) {
            return InterfaceType[InterfaceType.Web];
        } else {
            return InterfaceType.Web;
        }
    }

    /**
     * Gets the coordinates of the card to play.
     * @param {unknown} options Options for the coordinates.
     * @returns {Promise<Coordinates | false>} The coordinates of the card to play. If the player refused to play, returns false.
     */
    public async getCoordinates(
        options: unknown = {},
    ): Promise<Coordinates | false> {
        const {firstTimeToDemandeCoordinates} = options as {
            firstTimeToDemandeCoordinates: boolean | undefined;
        };

        console.log(firstTimeToDemandeCoordinates);

        return Promise.reject("Not implemented");
    }

    /**
     * Launches the program.
     * @param {boolean} game Determines whether the game is launched or not. If not, the program will launch in a test mode.
     * @returns {Promise<void>} A promise that resolves when the program has been launched and closed.
     */
    public async launch(game: boolean): Promise<void> {
        return Promise.reject(`game = ${game}, Not implemented`);
    }
}

/**
 * Represents state when no interface is available.
 * Using this state will throw an error or reject a promise.
 */
class NoneState implements IInterfaceState {
    /**
     * Instance of DBWrapper.
     * This is a public and readonly member of NoneState.
     * For more information, refer to DBWrapper documentation.
     * @public
     * @readonly
     * @type {DBWrapper}
     * @memberof NoneState
     * @see DBWrapper
     */
    public readonly dbWrapper: DBWrapper = DBWrapper.getInstance();

    /**
     * Gets the type of interface.
     * @param {boolean} isString Determines whether to return the interface type as a string or as an enum. Default: false.
     * @returns {InterfaceType | string} The type of interface.
     */
    public getInterfaceType(isString: boolean): InterfaceType | string {
        if (isString) {
            return InterfaceType[InterfaceType.None];
        } else {
            return InterfaceType.None;
        }
    }

    /**
     * Rejects the promise to get the coordinates.
     * @param {unknown} options Parameters for respect the interface.
     * @returns {Promise<Coordinates | false>} A promise that rejects with an error.
     * @memberof NoneState
     * @see Interface.getCoordinates
     */
    public async getCoordinates(
        options: unknown = {},
    ): Promise<Coordinates | false> {
        const {firstTimeToDemandeCoordinates} = options as {
            firstTimeToDemandeCoordinates: boolean | undefined;
        };

        console.log(firstTimeToDemandeCoordinates);

        return Promise.reject("No interface available");
    }

    /**
     * Rejects the promise to launch the program.
     * @param {boolean} game Parameters for respect the interface.
     * @returns {Promise<void>} A promise that rejects with an error.
     * @memberof NoneState
     * @see Interface.launch
     */
    public async launch(game: boolean): Promise<void> {
        return Promise.reject(`game = ${game}, No interface available`);
    }
}

export default Interface;

export {Interface, InterfaceType, IInterfaceState};
