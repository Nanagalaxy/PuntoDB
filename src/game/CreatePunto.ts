import {BoardOptions} from "./Board";
import Punto, {PuntoOptions} from "./Punto";

class CreatePunto {
    private _puntoOptions: PuntoOptions;

    private _punto: Punto | null = null;

    constructor(puntoOptions: PuntoOptions) {
        this._puntoOptions = puntoOptions;
    }

    //#region listOfBoardOptions
    public getBoardOption(): BoardOptions {
        return this._puntoOptions.boardOption;
    }

    public setBoardOption(boardOptions: BoardOptions): void {
        this._puntoOptions.boardOption = boardOptions;
    }
    //#endregion

    //#region punto
    public getPunto(): Punto | null {
        return this._punto;
    }

    public createPunto(): void {
        this._punto = new Punto(this._puntoOptions);
    }

    public displayPunto(verbose: boolean = false): void {
        if (this._punto !== null) {
            console.log("Punto ID: ", this._punto.id, "\n");

            if (verbose) {
                const thisBoard = this._punto.board;

                console.log("Board ID: ", thisBoard.id);

                console.log("Number of players: ", thisBoard.nbrPlayers());

                thisBoard.players.forEach((player) => {
                    console.log("Name: ", player.name);
                });

                console.log("\n");
            }
        } else {
            console.log("Punto is null");
        }
    }
    //#endregion
}

export default CreatePunto;
