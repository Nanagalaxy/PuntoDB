import BaseId from "./BaseId";
import Player from "./Player";

/**
 * Represents a card in a card game.
 * Inherits a unique ID from BaseId class
 * and has a color, value, coordinates, turn played, position played, and player who played it.
 */
class Card extends BaseId {
    /**
     * The color attribute of the card, represented as a string.
     * @type {string}
     */
    public readonly color: string;

    /**
     * The numerical value of the card.
     * @type {number}
     */
    public readonly value: number;

    /**
     * The coordinates of the card on the board.
     * @type {Coordinates}
     */
    public coordinates: Coordinates;

    /**
     * The x-coordinate of the card on the board.
     * @type {number}
     */
    public get x(): number {
        return this.coordinates.x;
    }
    public set x(x: number) {
        this.coordinates.x = x;
    }

    /**
     * The y-coordinate of the card on the board.
     * @type {number}
     */
    public get y(): number {
        return this.coordinates.y;
    }
    public set y(y: number) {
        this.coordinates.y = y;
    }

    /**
     * The turn the card was played on.
     * @type {number}
     */
    public playedTurn: number;

    /**
     * The position of the card in the turn it was played on.
     * @type {number}
     */
    public playedIn: number;

    /**
     * The player who played the card.
     * @type {Player}
     */
    public playedBy?: Player;

    /**
     * Displays the ID of the Card instance in the console.
     */
    public listIds(): void {
        this.displayId();
    }

    /**
     * Constructs a new card with the specified color and value.
     * @param {string} color - The color of the card.
     * @param {number} value - The numerical value of the card.
     * @param {number} x - The x-coordinate of the card on the board.
     * @param {number} y - The y-coordinate of the card on the board.
     * @param {number} playedTurn - The turn the card was played on.
     * @param {number} playedIn - The position of the card in the turn it was played on.
     * @param {Player} playerBy - The player who played the card.
     */
    constructor(
        color: string,
        value: number,
        x: number = NaN,
        y: number = NaN,
        playedTurn: number = -1,
        playedIn: number = -1,
        playerBy?: Player,
    ) {
        super();

        this.color = color;

        this.value = value;

        this.coordinates = {x, y};

        this.playedTurn = playedTurn;

        this.playedIn = playedIn;

        this.playedBy = playerBy;
    }

    public static build(
        color: string,
        value: number,
        x: number,
        y: number,
        playedTurn: number,
        playedIn: number,
        playerBy?: Player,
    ): Card {
        return new Card(color, value, x, y, playedTurn, playedIn, playerBy);
    }

    /**
     * Returns the coordinates of the card on the board.
     * @param {boolean} isString Whether to return the coordinates as a string or as an object.
     * @returns {string | Coordinates} The coordinates of the card on the board.
     */
    public getCoordinates(isString: boolean = true): Coordinates | string {
        if (isString) {
            return `(${this.coordinates.x}, ${this.coordinates.y})`;
        } else {
            return this.coordinates;
        }
    }

    /**
     * Returns whether the card has the same coordinates as the given card.
     * @param {Card} card The card to compare to.
     * @returns {boolean} `true` if the cards have the same coordinates, `false` otherwise.
     */
    public sameCoordinates(card: Card): boolean {
        return (
            this.coordinates.x === card.coordinates.x &&
            this.coordinates.y === card.coordinates.y
        );
    }
}

type Coordinates = {
    x: number;
    y: number;
};

export default Card;

export {Card, Coordinates};
