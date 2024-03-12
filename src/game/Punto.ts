import BaseId from "./BaseId";
import Board, {BoardOptions} from "./Board";

/**
 * The Punto class, which is the main class of the game.
 * It extends BaseId to inherit ID management capabilities.
 */
class Punto extends BaseId {
    /**
     * The board of the game, represented by an instance of Board.
     * @type {Board}
     */
    private _board: Board;
    public get board(): Board {
        return this._board;
    }

    /**
     * The mode in which the board is displayed.
     * @type {DisplayBoardMode}
     */
    public displayBoardMode: DisplayBoardMode;

    /**
     * A boolean indicating whether the result of the game should be displayed.
     * @type {boolean}
     */
    public displayResultOfGame: boolean;

    /**
     * A boolean indicating whether the game is played automatically.
     * @type {boolean}
     */
    public auto: boolean;

    /**
     * Displays the ID of the Punto instance in the console
     * and calls the listIds method to display the IDs of the Board instances.
     */
    public listIds(): void {
        this.displayId();

        this._board.listIds();
    }

    /**
     * The constructor for the Punto class.
     * It initializes the game board.
     * @param {PuntoOptions} puntoOptions An object containing the options for the game.
     */
    constructor(puntoOptions: PuntoOptions) {
        super();

        const {displayBoard, displayResultOfGame, boardOption} = puntoOptions;

        this.displayBoardMode = displayBoard ?? DisplayBoardMode.noDisplay;

        this.displayResultOfGame = displayResultOfGame ?? false;

        this._board = new Board(boardOption);

        this.auto = puntoOptions.auto ?? false;
    }

    public static build(
        displayBoard: DisplayBoardMode,
        displayResultOfGame: boolean,
        boardOption: BoardOptions,
        auto: boolean,
    ): Punto {
        return new Punto({
            displayBoard,
            displayResultOfGame,
            boardOption,
            auto,
        });
    }

    /**
     * Plays a turn of the game.
     * @param {number} nbrTurn The number of turns to play.
     */
    private async playATurn(nbrTurn: number): Promise<void> {
        let displayEachPlayerTurn = false;

        if (this.displayBoardMode === DisplayBoardMode.eachPlayerTurn) {
            displayEachPlayerTurn = true;
        }

        for (let i = 0; i < nbrTurn; i++) {
            if (this._board.isGameOver()) {
                break;
            }

            await this._board.doATurn(this.auto, displayEachPlayerTurn);

            if (this.displayBoardMode === DisplayBoardMode.eachBoardTurn) {
                this._board.displayBoard();
            }
        }

        if (
            this.displayBoardMode === DisplayBoardMode.startAndEnd ||
            this.displayBoardMode === DisplayBoardMode.onlyEnd
        ) {
            this._board.displayBoard();
        }

        if (this.displayResultOfGame) {
            this.displayResult();
        }
    }

    private async playUntilGameOver(): Promise<void> {
        let displayEachPlayerTurn = false;

        if (this.displayBoardMode === DisplayBoardMode.eachPlayerTurn) {
            displayEachPlayerTurn = true;
        }

        while (!this._board.isGameOver()) {
            await this._board.doATurn(this.auto, displayEachPlayerTurn);

            if (this.displayBoardMode === DisplayBoardMode.eachBoardTurn) {
                this._board.displayBoard();
            }
        }

        if (
            this.displayBoardMode === DisplayBoardMode.startAndEnd ||
            this.displayBoardMode === DisplayBoardMode.onlyEnd
        ) {
            this._board.displayBoard();
        }

        if (this.displayResultOfGame) {
            this.displayResult();
        }
    }

    /**
     * Plays a game of Punto.
     * @param {number} nbrTurn The number of turns to play. If -1, the game is played until the end.
     */
    public async playGame(nbrTurn: number = -1): Promise<void> {
        if (this.displayBoardMode === DisplayBoardMode.startAndEnd) {
            this._board.displayBoard();
        }

        if (nbrTurn <= 0) {
            await this.playUntilGameOver();
        } else {
            await this.playATurn(nbrTurn);
        }
    }

    /**
     * Displays the board in the console.
     */
    public displayBoard(): void {
        this._board.displayBoard();
    }

    /**
     * Displays the result of the game in the console.
     */
    private displayResult(): void {
        if (this._board.winners.length === 1) {
            console.log(`The winner is ${this._board.winners[0].name}.`);
        } else {
            console.log(
                `The winners are ${this._board.winners
                    .map((player) => player.name)
                    .join(", ")}.`,
            );
        }

        if (this._board.losers.length === 1) {
            console.log(`The loser is ${this._board.losers[0].name}.`);
        } else {
            console.log(
                `The losers are ${this._board.losers
                    .map((player) => player.name)
                    .join(", ")}.`,
            );
        }

        console.log(`The game lasted ${this._board.turn} turns.\n`);
    }

    /**
     * Resets the game.
     */
    public reset(): void {
        this.regenerateId();
        this._board.reset();
    }
}

enum DisplayBoardMode {
    "eachBoardTurn",
    "eachPlayerTurn",
    "startAndEnd",
    "onlyEnd",
    "noDisplay",
}

type PuntoOptions = {
    displayBoard?: DisplayBoardMode;
    displayResultOfGame?: boolean;
    boardOption: BoardOptions;
    auto?: boolean;
};

export default Punto;

export {Punto, PuntoOptions, DisplayBoardMode};
