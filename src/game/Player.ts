import Interface from "../interface/Interface";
import BaseId from "./BaseId";
import Card, {Coordinates} from "./Card";

/**
 * Represents a player in a card game. Each player is assigned a unique ID from the BaseId class,
 * has a name, a hand of cards, a points tally, and a flag to indicate if it's their turn.
 */
class Player extends BaseId {
    /**
     * The name of the player.
     * @type {string}
     */
    private _name: string;
    public get name(): string {
        return this._name;
    }
    public set name(name: string) {
        this._name = name;
    }

    /**
     * Deck of cards yet to be drawn.
     * @type {Card[]}
     */
    private _deck: Card[] = [];
    public get deck(): Card[] {
        return this._deck;
    }
    public set deck(deck: Card[]) {
        this._deck = deck;
    }

    /**
     * Hand of cards currently held by the player.
     * @type {Card}
     */
    private _hand: Card | null = null;
    public get hand(): Card | null {
        return this._hand;
    }
    public set hand(hand: Card) {
        this._hand = hand;
    }

    /**
     * The number of points the player has accumulated.
     * @type {number}
     */
    private _points: number;
    public get points(): number {
        return this._points;
    }

    /**
     * A boolean indicating whether it is this player's turn.
     * @type {boolean}
     */
    public isTurn: boolean;

    /**
     * The color attribute of the card, represented as a string.
     */
    public color: string[] = [];

    /**
     * The number of times the player was the first to play.
     */
    public nbrFirstPlayer = 0;

    /**
     * Displays the ID of the Player instance in the console
     * and calls the listIds method to display the IDs of the Card instances.
     */
    public listIds(): void {
        this.displayId();

        this._hand?.listIds();
    }

    /**
     * Constructs a new player with the provided name, points and isTurn flag.
     * @param {PlayerOptions} playerOptions An object containing the options for the player.
     */
    constructor(playerOptions: PlayerOptions) {
        super();

        const {name, points, isTurn} = playerOptions;

        this._name = name;

        this._points = points ?? 0;

        this.isTurn = isTurn ?? false;
    }

    public static build(
        name: string,
        deck: Card[],
        hand: Card | null,
        points: number,
        isTurn: boolean,
        color: string[],
        nbrFirstPlayer: number,
    ): Player {
        const playerOptions = {
            name,
            points,
            isTurn,
        };

        const player = new Player(playerOptions);

        player._deck = deck;
        player._hand = hand;
        player.color = color;
        player.nbrFirstPlayer = nbrFirstPlayer;

        return player;
    }

    /**
     * Fills the deck with cards.
     * @param {Card[]} cards An array of Card objects to fill the deck with.
     */
    public fillDeck(cards: Card[]): void {
        this._deck.push(...cards);

        this.shuffleDeck();
    }

    /**
     * Shuffles the deck of cards.
     */
    public shuffleDeck(): void {
        for (let i = this._deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [this._deck[i], this._deck[j]] = [this._deck[j], this._deck[i]];
        }
    }

    /**
     * Draws a card from the deck and adds it to the player's hand.
     * @returns {boolean} `true` if the card was successfully drawn, `false` otherwise.
     */
    public drawCard(): boolean {
        const drawnCard = this._deck.pop();

        if (drawnCard) {
            this._hand = drawnCard;

            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns the actual card from the player's hand.
     * @returns {Card|false} The card from the player's hand, or `false` if the hand is empty.
     */
    public cardInHand(): Card | false {
        const card = this._hand;

        if (card) {
            return card;
        } else {
            return false;
        }
    }

    /**
     * Removes the card from the player's hand.
     * @returns {boolean} `true` if the card was successfully removed, `false` otherwise.
     */
    public removeCardFromHand(): boolean {
        if (this._hand) {
            this._hand = null;
            return true;
        } else {
            return false;
        }
    }

    /**
     * Sets the player's points to the given value.
     * @param {number} points The new points value for the player.
     */
    public addPoints(points: number): void {
        this._points += points;
    }

    /**
     * Resets the player's deck, hand, and isTurn flag.
     */
    public reset(): void {
        this._deck = [];
        this._hand = null;
        this._points = 0;
        this.isTurn = false;
        this.color = [];
    }

    /**
     * Asks the player for the coordinates of the card they want to play.
     * @param {Card} card The card the player wants to play.
     * @param {boolean} firstTimeToDemandeCoordinates Whether it is the first time the player is asked for coordinates.
     * @returns {Promise<Coordinates|false>} The coordinates of the card the player wants to play.
     */
    public async askCoordinates(
        card: Card,
        firstTimeToDemandeCoordinates: boolean,
    ): Promise<Coordinates | false> {
        return new Promise((resolve) => {
            const questionInterface = new Interface();

            const options = {
                firstTimeToDemandeCoordinates,
                playerName: this._name,
                cardColor: card.color,
                cardValue: card.value,
            };

            questionInterface
                .getCoordinates(options)
                .then((coordinates) => {
                    resolve(coordinates);
                })
                .catch(() => {
                    resolve(false);
                });
        });
    }
}

type PlayerOptions = {
    name: string;
    points?: number;
    isTurn?: boolean;
};

export default Player;

export {Player, PlayerOptions};
