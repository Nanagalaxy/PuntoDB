import BaseId from "./BaseId";
import Player, {PlayerOptions} from "./Player";
import Card, {Coordinates} from "./Card";

/**
 * Represents the game board for a card game. It extends the BaseId class to include
 * a unique identifier for each board instance. The Board manages the state of the game,
 * including the cards on the board, the players, the deck, and the discard pile,
 * as well as the turn number, the type of win condition that ends the game,
 * and the winner(s) of the game.
 */
class Board extends BaseId {
    /**
     * Cards currently on the board.
     * @type {Card[]}
     */
    private _cards: Card[] = [];
    public get cards(): Card[] {
        return this._cards;
    }

    /**
     * List of players in the game.
     * @type {Player[]}
     */
    private _players: Player[];
    public get players(): Player[] {
        return this._players;
    }

    /**
     * The current turn number in the game.
     * @type {number}
     */
    private _turn: number = 0;
    public get turn(): number {
        return this._turn;
    }

    /**
     * Describes the type of win.
     * @type {WinType}
     */
    private _winType: WinType = WinType.None;
    public get winType(): string {
        return this._winType;
    }

    /**
     * Array of the player(s) who have won the game.
     * @type {Player[]}
     */
    private _winners: Player[] = [];
    public get winners(): Player[] {
        return this._winners;
    }

    /**
     * Array of the player(s) who have lost the game.
     */
    private _losers: Player[] = [];
    public get losers(): Player[] {
        return this._losers;
    }

    /**
     * Displays the ID of the Board instance in the console
     * and calls the listIds method to display the IDs of the Card and Player instances.
     */
    public listIds(): void {
        this.displayId();

        this._cards.forEach((card: Card) => {
            card.listIds();
        });

        this._players.forEach((player: Player) => {
            player.listIds();
        });
    }

    /**
     * The constructor initializes the Board with a default set of values,
     * including a single card and player to start with.
     * @param {BoardOptions} boardOptions An object containing the options for the board.
     */
    constructor(boardOptions: BoardOptions) {
        super();

        const {nbrPlayers, listPlayerOptions} = boardOptions;

        if (nbrPlayers < 2 || nbrPlayers > 4) {
            throw new Error("The number of players must be between 2 and 4.");
        }

        const listPlayer = [];

        let aPlayerHaveATurn = false;

        for (let i = 0; i < nbrPlayers; i++) {
            const currentPlayerOptions = listPlayerOptions[i];

            listPlayer.push(new Player(currentPlayerOptions));

            if (currentPlayerOptions.isTurn) {
                aPlayerHaveATurn = true;
            }
        }

        this._players = listPlayer;

        if (!aPlayerHaveATurn) {
            this.randomizePlayerTurn();
        }

        this.cardDistribution();
    }

    public static build(
        cards: Card[],
        players: Player[],
        turn: number,
        winType: WinType,
        winners: Player[],
        losers: Player[],
    ): Board {
        const board = new Board({
            nbrPlayers: players.length,
            listPlayerOptions: players.map((player) => {
                return {
                    id: player.id,
                    name: player.name,
                    isTurn: player.isTurn,
                };
            }),
        });

        board._cards = cards;
        board._players = players;
        board._turn = turn;
        board._winType = winType;
        board._winners = winners;
        board._losers = losers;

        return board;
    }

    /**
     * Distributes the cards to the players.
     */
    private cardDistribution(): void {
        const listPlayer = this._players;

        const nbrPlayers = listPlayer.length;

        const colors: string[] = ["red", "blue", "green", "yellow"];

        const numbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

        // Each color has twice each card from 1 to 9
        const listCard: {[key: string]: Card[]} = {};

        colors.forEach((color) => {
            listCard[color] = [];

            numbers.forEach((number) => {
                listCard[color].push(new Card(color, number));
                listCard[color].push(new Card(color, number));
            });
        });

        // For 2 players, each player all cards of two colors (random colors)
        // for 3 players, each player has all the cards of a suit + 6 cards of the last suit (random color)
        // for 4 players, each player has all the cards of one color (random color)

        if (nbrPlayers === 2) {
            listPlayer.forEach((player) => {
                const color1 =
                    colors[Math.floor(Math.random() * colors.length)];

                // Remove color1 from colors
                colors.splice(colors.indexOf(color1), 1);

                const color2 =
                    colors[Math.floor(Math.random() * colors.length)];

                // Remove color2 from colors
                colors.splice(colors.indexOf(color2), 1);

                player.color = [color1, color2];

                // Distribute cards
                player.color.forEach((color) => {
                    player.fillDeck(listCard[color]);
                });
            });
        } else if (nbrPlayers === 3) {
            listPlayer.forEach((player) => {
                const color = colors[Math.floor(Math.random() * colors.length)];

                // Remove color from colors
                colors.splice(colors.indexOf(color), 1);

                player.color = [color];
            });

            // Distribute cards
            const lastColor = colors[0];

            listPlayer.forEach((player) => {
                player.color.forEach((color) => {
                    player.fillDeck(listCard[color]);
                });

                const listOf6RandomCards: Card[] = [];

                for (let i = 0; i < 6; i++) {
                    const randomCard =
                        listCard[lastColor][
                            Math.floor(
                                Math.random() * listCard[lastColor].length,
                            )
                        ];

                    // Remove randomCard from listCard
                    listCard[lastColor].splice(
                        listCard[lastColor].indexOf(randomCard),
                        1,
                    );

                    listOf6RandomCards.push(randomCard);
                }

                player.fillDeck(listOf6RandomCards);
            });
        } else {
            // nbrPlayers === 4
            listPlayer.forEach((player) => {
                const color = colors[Math.floor(Math.random() * colors.length)];

                // Remove color from colors
                colors.splice(colors.indexOf(color), 1);

                player.color = [color];

                // Distribute cards
                player.color.forEach((color) => {
                    player.fillDeck(listCard[color]);
                });
            });
        }
    }

    /**
     * Places a card on the board at the given coordinates.
     * @param card The card to place on the board.
     * @param x The x coordinate to place the card at.
     * @param y The y coordinate to place the card at.
     * @param turn The turn the card was played on.
     * @param player The player who played the card.
     * @param playerTurn The position of the player in the turn order.
     * @returns {boolean} `true` if the card was successfully placed, `false` otherwise.
     */
    private placeCard(
        card: Card,
        x: number,
        y: number,
        turn: number,
        player: Player,
        playerTurn: number,
    ): boolean {
        if (this.cardCanBePlaced(card, x, y)) {
            card.x = x;
            card.y = y;

            card.playedTurn = turn;
            card.playedIn = playerTurn;
            card.playedBy = player;

            this._cards.push(card);

            return true;
        } else {
            return false;
        }
    }

    /**
     * Checks whether a card can be placed on the board at the given coordinates.
     * @param card The card to place on the board.
     * @param x The x coordinate to place the card at.
     * @param y The y coordinate to place the card at.
     * @returns `true` if the card can be placed at the given coordinates, `false` otherwise.
     */
    public cardCanBePlaced(card: Card, x: number, y: number): boolean {
        if (x > 5 || x < -5 || y > 5 || y < -5) {
            return false;
        }

        const coordinates: Coordinates = {x, y};

        if (this.lineExceedsLimit(coordinates, 6)) {
            return false;
        }

        let canPlaceCard = true;

        if (!this.boardIsEmpty()) {
            const availablesCoordinates = this.availableCoordinates(card.value);

            if (availablesCoordinates.length === 0) {
                canPlaceCard = false;
            } else {
                let canPlaceCardAtCoordinates = false;

                availablesCoordinates.forEach((coordinates) => {
                    if (coordinates.x === x && coordinates.y === y) {
                        canPlaceCardAtCoordinates = true;
                    }
                });

                if (!canPlaceCardAtCoordinates) {
                    canPlaceCard = false;
                }
            }
        }

        return canPlaceCard;
    }

    /**
     * Plays a card on the board at the given coordinates from the current player's hand (with player turn flag)
     * @param player The player who is playing the card.
     * @param playerTurn The position of the player in the turn order.
     * @param card The card to play.
     * @param x The x coordinate to place the card at.
     * @param y The y coordinate to place the card at.
     * @returns {string} A message describing the result of the play.
     */
    public playCard(
        player: Player,
        playerTurn: number,
        card: Card,
        x: number,
        y: number,
    ): string {
        if (!player.cardInHand()) {
            return "The player does not have the card in hand.";
        }

        if (this.placeCard(card, x, y, this._turn, player, playerTurn)) {
            const removedResult = player.removeCardFromHand();

            if (!removedResult) {
                return "The card could not be removed from the player's hand.";
            }
        } else {
            return "The card could not be placed.";
        }

        return "The card was successfully placed.";
    }

    /**
     * Checks if victory conditions are met.
     * @returns {winType: WinType, winners: Player[], losers: Player[]} The type of win achieved and the winner(s) and loser(s) of the game.
     * - `WinType.Win` if a player has won the game.
     * - `WinType.Draw` if the game is a draw.
     * - `WinType.Drop` if a player has dropped out of the game.
     * - `WinType.None` if no player has won the game.
     */
    protected checkVictory(): {
        winType: WinType;
        winners: Player[];
        losers: Player[];
    } {
        let winners: Player[] = [];
        let losers: Player[] = this._players;

        // Check whether a player has won by forming a row, column or diagonal
        if (this.nbrPlayers() === 2) {
            // 5 for 2 players
            const winner = this.hasWinningSeries(5);

            if (winner) {
                winners.push(winner);
            }

            if (winners.length > 0) {
                losers = losers.filter(
                    (player) => winners.indexOf(player) === -1,
                );

                return {
                    winType: WinType.Win,
                    winners: winners,
                    losers: losers,
                };
            }
        } else {
            // 4 for 3 or 4 players
            const winner = this.hasWinningSeries(4);

            if (winner) {
                winners.push(winner);
            }

            if (winners.length > 0) {
                losers = losers.filter(
                    (player) => winners.indexOf(player) === -1,
                );

                return {
                    winType: WinType.Win,
                    winners: winners,
                    losers: losers,
                };
            }
        }

        // Check if a player can no longer play (blocked game condition)
        if (this.isGameBlocked()) {
            winners = this.determineWinnerForBlockedGame();

            losers = losers.filter((player) => winners.indexOf(player) === -1);

            let winType: WinType = WinType.Win;

            if (winners.length === 0) {
                winType = WinType.Draw;
            }

            return {
                winType: winType,
                winners: winners,
                losers: losers,
            };
        }

        // No victory conditions encountered
        return {
            winType: WinType.None,
            winners: winners,
            losers: losers,
        };
    }

    /**
     * Checks if a player has formed a winning series of cards.
     * @param length The length of the series to be considered as a winning series.
     * @returns {Player[]} The player(s) who have formed a winning series.
     */
    private hasWinningSeries(length: number): Player | undefined {
        const seriesOfCards = this.determineSeriesOfCards(length);

        const playersWithPossibleWinningSeries: {
            player: Player;
            serie: Card[];
        }[] = [];

        seriesOfCards.forEach((series) => {
            let player: Player | undefined;

            series.forEach((card, index, serie) => {
                if (player) {
                    if (card.playedBy !== player) {
                        return; // Exit the inner loop
                    } else {
                        if (index === length - 1) {
                            playersWithPossibleWinningSeries.push({
                                player: player,
                                serie: serie,
                            });

                            return; // Exit the inner loop
                        }
                    }
                } else {
                    player = card.playedBy;
                }
            });
        });

        let playerWithWinningSerie: Player | undefined;

        if (playersWithPossibleWinningSeries.length === 1) {
            playerWithWinningSerie = playersWithPossibleWinningSeries[0].player;
        }

        return playerWithWinningSerie;
    }

    /**
     * Determines whether the game is blocked.
     * @returns {boolean} `true` if the game is blocked, `false` otherwise.
     */
    private isGameBlocked(): boolean {
        if (this.boardIsFull()) {
            return true;
        }

        const playerWhoCantPlay = this.getPlayerTurn();

        const cardNotPlayable = playerWhoCantPlay?.cardInHand();

        if (cardNotPlayable) {
            // The player still has his card in his hand, so he hasn't been able to play it.
            return true;
        } else {
            // The card is no longer in the player's hand, so the game is not blocked (for this turn).
            return false;
        }
    }

    /**
     * Determines the winner(s) of the game in case of a blocked game.
     * @returns {Player[]} The winner(s) of the game.
     */
    private determineWinnerForBlockedGame(): Player[] {
        const length = 3;

        const seriesOfCards = this.determineSeriesOfCards(length);

        const playersWithPossibleWinningSeries: {
            player: Player;
            serie: Card[];
        }[] = [];

        seriesOfCards.forEach((series) => {
            let player: Player | undefined;

            series.forEach((card, index, serie) => {
                if (player) {
                    if (card.playedBy !== player) {
                        return; // Exit the inner loop
                    } else {
                        if (index === length - 1) {
                            playersWithPossibleWinningSeries.push({
                                player: player,
                                serie: serie,
                            });

                            return; // Exit the inner loop
                        }
                    }
                } else {
                    player = card.playedBy;
                }
            });
        });

        const playersWithWinningSeries: Player[] = [];

        if (playersWithPossibleWinningSeries.length > 1) {
            // Count the number of serie of cards of each player
            const countSeriesOfCards: {
                player: Player;
                count: number;
            }[] = [];

            playersWithPossibleWinningSeries.forEach(
                (playerWithPossibleWinningSeries) => {
                    const player = playerWithPossibleWinningSeries.player;

                    let count = 0;

                    seriesOfCards.forEach((series) => {
                        if (series[0].playedBy === player) {
                            count++;
                        }
                    });

                    countSeriesOfCards.push({
                        player: player,
                        count: count,
                    });
                },
            );

            // Retrieve the player with the most series of cards
            let maxCount = 0;

            countSeriesOfCards.forEach((playerWithCount) => {
                if (playerWithCount.count > maxCount) {
                    maxCount = playerWithCount.count;
                }
            });

            const playersWithMaxCount = countSeriesOfCards.filter(
                (playerWithCount) => {
                    return playerWithCount.count === maxCount;
                },
            );

            // Remove potential duplicates in playersWithMaxCount
            const seenPlayersMaxCount = new Set();

            playersWithMaxCount.forEach((playerWithCount) => {
                if (!seenPlayersMaxCount.has(playerWithCount.player.id)) {
                    seenPlayersMaxCount.add(playerWithCount.player.id);
                } else {
                    // Remove duplicates
                    const index = playersWithMaxCount.indexOf(playerWithCount);
                    if (index > -1) {
                        playersWithMaxCount.splice(index, 1);
                    }
                }
            });

            if (playersWithMaxCount.length > 1) {
                // Retrive the player with the minimal sum of the values of the cards in the series
                let minSum = Infinity;

                playersWithMaxCount.forEach((playerWithCount) => {
                    const player = playerWithCount.player;

                    let sum = 0;

                    seriesOfCards.forEach((series) => {
                        if (series[0].playedBy === player) {
                            series.forEach((card) => {
                                sum += card.value;
                            });
                        }
                    });

                    if (sum < minSum) {
                        minSum = sum;
                    }
                });

                const playersWithMinSum = playersWithMaxCount.filter(
                    (playerWithCount) => {
                        const player = playerWithCount.player;

                        let sum = 0;

                        seriesOfCards.forEach((series) => {
                            if (series[0].playedBy === player) {
                                series.forEach((card) => {
                                    sum += card.value;
                                });
                            }
                        });

                        return sum === minSum;
                    },
                );

                // Remove potential duplicates in playersWithMinSum
                const seenPlayersMinSum = new Set();

                playersWithMinSum.forEach((playerWithCount) => {
                    if (!seenPlayersMinSum.has(playerWithCount.player.id)) {
                        seenPlayersMinSum.add(playerWithCount.player.id);
                    } else {
                        // Remove duplicates
                        const index =
                            playersWithMinSum.indexOf(playerWithCount);
                        if (index > -1) {
                            playersWithMinSum.splice(index, 1);
                        }
                    }
                });

                playersWithMinSum.forEach((playerWithMinSum) => {
                    playersWithWinningSeries.push(playerWithMinSum.player);
                });
            } else {
                playersWithWinningSeries.push(playersWithMaxCount[0].player);
            }
        }

        return playersWithWinningSeries;
    }

    /**
     * Determines the series of cards of the given length.
     * @param length The length of the series of cards to determine.
     * @returns {Card[][]} An array of series of cards.
     * @todo Implement diagonal series
     */
    private determineSeriesOfCards(length: number): Card[][] {
        const seriesOfCards: Card[][] = [];

        const cardsSameX: {[key: string]: Card[]} = {};

        const cardsSameY: {[key: string]: Card[]} = {};

        const cardsDiagonalLeftToRight: {[key: string]: Card[]} = {};
        const cardsDiagonalRightToLeft: {[key: string]: Card[]} = {};

        this._cards.forEach((card) => {
            const x = card.x;
            const y = card.y;

            const diagLeftToRightKey = card.x - card.y;
            const diagRightToLeftKey = card.x + card.y;

            if (!cardsSameX[x]) {
                cardsSameX[x] = [];
            }

            if (!cardsSameY[y]) {
                cardsSameY[y] = [];
            }

            if (!cardsDiagonalLeftToRight[diagLeftToRightKey]) {
                cardsDiagonalLeftToRight[diagLeftToRightKey] = [];
            }
            if (!cardsDiagonalRightToLeft[diagRightToLeftKey]) {
                cardsDiagonalRightToLeft[diagRightToLeftKey] = [];
            }

            for (let i = cardsSameX[x].length - 1; i >= 0; i--) {
                const cardInArray = cardsSameX[x][i];
                if (cardInArray.x === x && cardInArray.y === y) {
                    cardsSameX[x].splice(i, 1); // Deletes element at index i
                }
            }

            for (let i = cardsSameY[y].length - 1; i >= 0; i--) {
                const cardInArray = cardsSameY[y][i];
                if (cardInArray.x === x && cardInArray.y === y) {
                    cardsSameY[y].splice(i, 1); // Deletes element at index i
                }
            }

            for (
                let i = cardsDiagonalLeftToRight[diagLeftToRightKey].length - 1;
                i >= 0;
                i--
            ) {
                const cardInArray =
                    cardsDiagonalLeftToRight[diagLeftToRightKey][i];
                if (cardInArray.x === x && cardInArray.y === y) {
                    cardsDiagonalLeftToRight[diagLeftToRightKey].splice(i, 1); // Deletes element at index i
                }
            }
            for (
                let i = cardsDiagonalRightToLeft[diagRightToLeftKey].length - 1;
                i >= 0;
                i--
            ) {
                const cardInArray =
                    cardsDiagonalRightToLeft[diagRightToLeftKey][i];
                if (cardInArray.x === x && cardInArray.y === y) {
                    cardsDiagonalRightToLeft[diagRightToLeftKey].splice(i, 1); // Deletes element at index i
                }
            }

            cardsSameX[x].push(card);
            cardsSameY[y].push(card);

            cardsDiagonalLeftToRight[diagLeftToRightKey].push(card);
            cardsDiagonalRightToLeft[diagRightToLeftKey].push(card);
        });

        for (const key in cardsSameX) {
            cardsSameX[key].sort((card1, card2) => {
                return card1.y - card2.y; // Sort in ascending order of y
            });
        }

        for (const key in cardsSameY) {
            cardsSameY[key].sort((card1, card2) => {
                return card1.x - card2.x; // Sort in ascending order of x
            });
        }

        for (const key in cardsDiagonalLeftToRight) {
            cardsDiagonalLeftToRight[key].sort(
                (card1, card2) => card1.x - card2.x,
            );
        }
        for (const key in cardsDiagonalRightToLeft) {
            cardsDiagonalRightToLeft[key].sort(
                (card1, card2) => card1.x - card2.x,
            );
        }

        for (const i in cardsSameX) {
            let series: Card[] = [];
            let counter = 0;

            const cards = cardsSameX[i];

            cards.forEach((card) => {
                if (series.length === 0) {
                    series.push(card);
                    counter = 1;
                } else {
                    if (
                        card.y === series[counter - 1].y + 1 &&
                        card.color === series[counter - 1].color
                    ) {
                        series.push(card);
                        counter++;

                        if (series.length >= length) {
                            seriesOfCards.push(series);

                            series = [];
                            counter = 0;
                        }
                    } else {
                        if (series.length >= length) {
                            seriesOfCards.push(series);
                        }

                        series = [card];
                        counter = 1;
                    }
                }
            });
        }

        for (const i in cardsSameY) {
            let series: Card[] = [];
            let counter = 0;

            const cards = cardsSameY[i];

            cards.forEach((card) => {
                if (series.length === 0) {
                    series.push(card);
                    counter = 1;
                } else {
                    if (
                        card.x === series[counter - 1].x + 1 &&
                        card.color === series[counter - 1].color
                    ) {
                        series.push(card);
                        counter++;

                        if (series.length >= length) {
                            seriesOfCards.push(series);

                            series = [];
                            counter = 0;
                        }
                    } else {
                        if (series.length >= length) {
                            seriesOfCards.push(series);
                        }

                        series = [card];
                        counter = 1;
                    }
                }
            });
        }

        for (const key in cardsDiagonalLeftToRight) {
            const series = this.findSeriesInDiagonal(
                cardsDiagonalLeftToRight[key],
                length,
                true,
            );
            seriesOfCards.push(...series);
        }
        for (const key in cardsDiagonalRightToLeft) {
            const series = this.findSeriesInDiagonal(
                cardsDiagonalRightToLeft[key],
                length,
                false,
            );
            seriesOfCards.push(...series);
        }

        return seriesOfCards;
    }

    private findSeriesInDiagonal(
        cards: Card[],
        length: number,
        isLeftToRight: boolean,
    ): Card[][] {
        const series: Card[][] = [];
        let tempSeries: Card[] = [];

        for (let i = 0; i < cards.length; i++) {
            if (
                tempSeries.length === 0 ||
                (this.isNextInDiagonal(
                    tempSeries[tempSeries.length - 1],
                    cards[i],
                    isLeftToRight,
                ) &&
                    this.isSamePlayerAndColor(tempSeries[0], cards[i]))
            ) {
                tempSeries.push(cards[i]);
            } else {
                if (tempSeries.length >= length) {
                    series.push([...tempSeries]);
                }
                tempSeries = [cards[i]];
            }
        }

        if (tempSeries.length >= length) {
            series.push([...tempSeries]);
        }

        return series;
    }

    private isNextInDiagonal(
        prevCard: Card,
        currentCard: Card,
        isLeftToRight: boolean,
    ): boolean {
        return isLeftToRight
            ? currentCard.x === prevCard.x + 1 &&
                  currentCard.y === prevCard.y + 1
            : currentCard.x === prevCard.x + 1 &&
                  currentCard.y === prevCard.y - 1;
    }

    private isSamePlayerAndColor(card1: Card, card2: Card): boolean {
        return (
            card1.color === card2.color &&
            card1.playedBy?.id === card2.playedBy?.id
        );
    }

    /**
     * Retrieves the number of players in the game.
     * @returns {number} The number of players in the game.
     */
    public nbrPlayers(): number {
        return this._players.length;
    }

    /**
     * Retrieve the player whose turn it is.
     * @returns {Player|undefined} The player whose turn it is or undefined if no player has the turn.
     */
    public getPlayerTurn(): Player | undefined {
        return this._players.find((player) => player.isTurn === true);
    }

    /**
     * Randomizes the player whose turn it is and returns the player.
     * @param {boolean} onlyWinners Whether to only randomize the player whose turn it is among the winner(s) of the game. (if there are any, otherwise it will be randomized among all players)
     * @returns {Player} The player whose turn it is.
     */
    public randomizePlayerTurn(onlyWinners: boolean = false): Player {
        let playerWithTurn: Player;

        if (onlyWinners && this._winners.length > 0) {
            playerWithTurn =
                this._winners[
                    Math.floor(Math.random() * 1000) % this._winners.length
                ];
        } else {
            playerWithTurn =
                this._players[
                    Math.floor(Math.random() * 1000) % this._players.length
                ];
        }

        playerWithTurn.isTurn = true;

        return playerWithTurn;
    }

    /**
     * Select the player whose turn it is based on the number of times they have been the first player.
     * @param {boolean} byMax Whether to select the player with the most times as the first player or the least times.
     * @returns {Player} The player whose turn it is.
     */
    public playerTurnByNbrFirstPlayer(byMax: boolean = false): Player {
        // Initialize to the first player as a default
        let playerWithTurn: Player = this._players[0];

        // Initialize to the lowest possible value if byMax is true, otherwise initialize to the highest possible value
        let nbrFirstPlayer: number = byMax ? -Infinity : Infinity;

        this._players.forEach((player) => {
            if (byMax) {
                if (player.nbrFirstPlayer > nbrFirstPlayer) {
                    playerWithTurn = player;

                    nbrFirstPlayer = player.nbrFirstPlayer;
                }
            } else {
                if (player.nbrFirstPlayer < nbrFirstPlayer) {
                    playerWithTurn = player;

                    nbrFirstPlayer = player.nbrFirstPlayer;
                }
            }
        });

        playerWithTurn.isTurn = true;

        return playerWithTurn;
    }

    /**
     * Advances the turn number by 1.
     */
    public addTurn(): void {
        this._turn++;
    }

    /**
     * Update the win type.
     * @param {WinType} winType The type of win achieved.
     */
    public updateWinType(winType: WinType): void {
        this._winType = winType;
    }

    /**
     * Updates the array of winner(s) of the game.
     * @param {Player[]} winner An array of Player objects who have won the game.
     */
    public updateWinner(winner: Player[]): void {
        this._winners = winner;
    }

    /**
     * Updates the array of loser(s) of the game.
     * @param {Player[]} loser An array of Player objects who have lost the game.
     */
    public updateLoser(loser: Player[]): void {
        this._losers = loser;
    }

    /**
     * Plays a turn of the game.
     * @param {boolean} auto Whether to play the turn automatically.
     * @param {boolean} displayEachPlayerTurn Whether to display the board after each player's turn.
     */
    public async doATurn(
        auto: boolean = false,
        displayEachPlayerTurn: boolean = false,
    ): Promise<void> {
        if (this._winType !== WinType.None) {
            throw new Error("The game is already over.");
        }

        let playerTurn = 0;

        for (const player of this._players) {
            if (this.isGameOver()) {
                return;
            }

            player.isTurn = true;

            // * do not use const card here because it will be false
            // * and this will cause an error with the code below
            // * (i.e if (card) { ... } will be false)

            if (!player.cardInHand()) {
                if (!player.drawCard()) {
                    const gameVictory = this.checkVictory();

                    this.endGame(
                        gameVictory.winType,
                        gameVictory.winners,
                        gameVictory.losers,
                    );

                    return;
                }
            } else {
                throw new Error("The player already has a card in hand.");
            }

            const card = player.cardInHand();

            if (card) {
                let x = 0;
                let y = 0;

                let cardCanBePlaced: boolean;

                let firstTimeToDemandeCoordinates = true;

                do {
                    if (this.boardIsEmpty()) {
                        cardCanBePlaced = this.cardCanBePlaced(card, x, y);
                    } else {
                        let coordinates: Coordinates | false;

                        if (auto) {
                            coordinates = this.determineCardCoordinates(
                                card.value,
                            );
                        } else {
                            coordinates = await player.askCoordinates(
                                card,
                                firstTimeToDemandeCoordinates,
                            );

                            if (
                                coordinates &&
                                (coordinates.x === Infinity ||
                                    coordinates.y === Infinity)
                            ) {
                                coordinates = this.determineCardCoordinates(
                                    card.value,
                                );
                            }
                        }

                        if (coordinates) {
                            x = coordinates.x;
                            y = coordinates.y;
                        } else {
                            const gameVictory = this.checkVictory();

                            this.endGame(
                                gameVictory.winType,
                                gameVictory.winners,
                                gameVictory.losers,
                            );

                            return;
                        }

                        cardCanBePlaced = this.cardCanBePlaced(card, x, y);

                        if (!cardCanBePlaced) {
                            firstTimeToDemandeCoordinates = false;
                        }
                    }
                } while (!cardCanBePlaced);

                const playResult = this.playCard(
                    player,
                    playerTurn,
                    card,
                    x,
                    y,
                );

                if (playResult !== "The card was successfully placed.") {
                    this.endGame(WinType.Drop, [], this._players);
                    return;
                }

                if (displayEachPlayerTurn) {
                    this.displayBoard();
                }

                const gameVictory = this.checkVictory();

                if (gameVictory.winType !== WinType.None) {
                    this.endGame(
                        gameVictory.winType,
                        gameVictory.winners,
                        gameVictory.losers,
                    );
                    return;
                }

                player.removeCardFromHand();
            } else {
                throw new Error("The player does not have a card in hand.");
            }

            player.isTurn = false;

            playerTurn++;
        }

        playerTurn = 0;

        this.addTurn();

        this._players[0].isTurn = true;
    }

    /**
     * Determines the coordinates of the card on the board.
     * @param {number} cardValue The value of the card to place on the board.
     * @returns {Coordinates|false} The coordinates of the card on the board or `false` if the card is no coordinates are available.
     */
    public determineCardCoordinates(cardValue: number): Coordinates | false {
        const availableCoordinates = this.availableCoordinates(cardValue);

        if (availableCoordinates.length === 0) {
            return false;
        }

        // Select a random coordinate
        const coordinates: Coordinates =
            availableCoordinates[
                Math.floor(Math.random() * availableCoordinates.length)
            ];

        return coordinates;
    }

    /**
     * Returns the available coordinates on the board.
     * @param {number} cardValue The value of the card to place on the board.
     * @returns {Coordinates[]} An array of available coordinates on the board.
     */
    public availableCoordinates(cardValue: number): Coordinates[] {
        const maxX = 5;
        const minX = -5;
        const maxY = 5;
        const minY = -5;

        const availableCoordinates: Coordinates[] = [];

        // For each card on the board, add the available coordinates around it (empty spaces)
        // And if a space is occupied by a card with a value less than the card to place, add it to the available coordinates

        this._cards.forEach((cardOnBoard) => {
            const x = cardOnBoard.x;
            const y = cardOnBoard.y;

            // Add the available coordinates around the card on the board

            const possibleCoordinates: Coordinates[] = [];

            possibleCoordinates.push({
                x: x,
                y: y,
            });

            if (x + 1 <= maxX) {
                possibleCoordinates.push({
                    x: x + 1,
                    y: y,
                });
            }

            if (x - 1 >= minX) {
                possibleCoordinates.push({
                    x: x - 1,
                    y: y,
                });
            }

            if (y + 1 <= maxY) {
                possibleCoordinates.push({
                    x: x,
                    y: y + 1,
                });
            }

            if (y - 1 >= minY) {
                possibleCoordinates.push({
                    x: x,
                    y: y - 1,
                });
            }

            if (x + 1 <= maxX && y + 1 <= maxY) {
                possibleCoordinates.push({
                    x: x + 1,
                    y: y + 1,
                });
            }

            if (x - 1 >= minX && y - 1 >= minY) {
                possibleCoordinates.push({
                    x: x - 1,
                    y: y - 1,
                });
            }

            if (x + 1 <= maxX && y - 1 >= minY) {
                possibleCoordinates.push({
                    x: x + 1,
                    y: y - 1,
                });
            }

            if (x - 1 >= minX && y + 1 <= maxY) {
                possibleCoordinates.push({
                    x: x - 1,
                    y: y + 1,
                });
            }

            // Remove the coordinates that are already occupied by a card with a value higher or equal to the card to place

            const availableCoordinatesAroundCard = possibleCoordinates.filter(
                (coordinates) => {
                    let canPlaceCard = true;

                    this._cards.forEach((cardOnBoard) => {
                        if (
                            cardOnBoard.x === coordinates.x &&
                            cardOnBoard.y === coordinates.y
                        ) {
                            if (cardOnBoard.value >= cardValue) {
                                canPlaceCard = false;
                            }
                        }
                    });

                    return canPlaceCard;
                },
            );

            availableCoordinates.push(...availableCoordinatesAroundCard);
        });

        // Remove the coordinates that create a line of +6 cards (i.e., 7 cards in a row)
        const validCoordinates = availableCoordinates.filter(
            (coordinates) => !this.lineExceedsLimit(coordinates, 6),
        );

        return validCoordinates;
    }

    private lineExceedsLimit(coordinates: Coordinates, limit: number): boolean {
        let extremeMaxX = 0;
        let extremeMinX = 0;
        let extremeMaxY = 0;
        let extremeMinY = 0;

        this._cards.forEach((cardOnBoard) => {
            if (cardOnBoard.x > extremeMaxX) {
                extremeMaxX = cardOnBoard.x;
            }

            if (cardOnBoard.x < extremeMinX) {
                extremeMinX = cardOnBoard.x;
            }

            if (cardOnBoard.y > extremeMaxY) {
                extremeMaxY = cardOnBoard.y;
            }

            if (cardOnBoard.y < extremeMinY) {
                extremeMinY = cardOnBoard.y;
            }
        });

        const xDistance = extremeMaxX - extremeMinX;
        const yDistance = extremeMaxY - extremeMinY;

        if (xDistance >= limit || yDistance >= limit) {
            return true;
        }

        const {x, y} = coordinates;

        if (x > extremeMaxX) {
            extremeMaxX = x;
        }

        if (x < extremeMinX) {
            extremeMinX = x;
        }

        if (y > extremeMaxY) {
            extremeMaxY = y;
        }

        if (y < extremeMinY) {
            extremeMinY = y;
        }

        const newXDistance = extremeMaxX - extremeMinX;
        const newYDistance = extremeMaxY - extremeMinY;

        if (newXDistance >= limit || newYDistance >= limit) {
            return true;
        }

        return false;
    }

    /**
     * Displays the cards on the board in the console.
     * @returns {void}
     * @memberof Board
     */
    public displayBoard(): void {
        const size = 13;
        const halfSize = Math.floor(size / 2);
        let displayString = "";

        // Create the first row with column indices
        for (let j = -halfSize; j <= halfSize; j++) {
            if (j === -halfSize) {
                displayString += "yx";
            }

            displayString += j >= 0 ? ` 0${j} ` : ` ${j} `;

            if (j === halfSize) {
                displayString += "x";
            }
        }

        displayString += "\n";

        // Fill the table with values or spaces
        for (let i = -halfSize; i <= halfSize; i++) {
            for (let j = -halfSize; j <= halfSize; j++) {
                const filteredCards = this._cards.filter(
                    (card: Card) => card.x === j && card.y === i,
                );

                let card;
                if (filteredCards.length > 0) {
                    card = filteredCards.reduce(
                        (highestCard: Card, currentCard: Card) => {
                            return currentCard.value > highestCard.value
                                ? currentCard
                                : highestCard;
                        },
                    );
                } else {
                    card = null;
                }

                if (j === -halfSize) {
                    // Add the line index to the beginning of each line
                    displayString += i >= 0 ? `0${i}` : `${i}`;
                }

                const cardColor = card ? card.color : "";

                const colorReset = "\x1b[0m";
                // const colorBright = "\x1b[1m";
                // const colorDim = "\x1b[2m";

                const colorWhite = "\x1b[37m";
                const colorPink = "\x1b[35m";

                const colorRed = "\x1b[31m";
                // const colorGreen = "\x1b[32m";
                const colorGreen = "\x1b[92m"; // Bright green
                const colorYellow = "\x1b[33m";
                // const colorBlue = "\x1b[34m";
                const colorBlue = "\x1b[94m"; // Bright blue

                let coloredTextCard = "";

                if (card) {
                    switch (cardColor) {
                        case "red":
                            coloredTextCard = `${colorRed} ${card.color[0]}${card.value} ${colorReset}`;
                            break;
                        case "green":
                            coloredTextCard = `${colorGreen} ${card.color[0]}${card.value} ${colorReset}`;
                            break;
                        case "yellow":
                            coloredTextCard = `${colorYellow} ${card.color[0]}${card.value} ${colorReset}`;
                            break;
                        case "blue":
                            coloredTextCard = `${colorBlue} ${card.color[0]}${card.value} ${colorReset}`;
                            break;
                        default:
                            coloredTextCard = ` ${card.color[0]}${card.value} `;
                            break;
                    }
                }

                // displayString += card
                //     ? coloredTextCard
                //     : `${colorWhite} .. ${colorReset}`; // Use ".." for empty fields

                if (card) {
                    displayString += coloredTextCard;
                } else {
                    // Check if the empty field is adjacent to any card
                    displayString += this.isEmptyFieldAdjacent(j, i)
                        ? `${colorWhite} .. ${colorReset}`
                        : `${colorPink} XX ${colorReset}`;
                }
            }

            if (i === halfSize) {
                displayString += "\ny";
            }

            displayString += "\n";
        }

        // Display table
        console.log(displayString);

        console.log(
            `Played cards: ${this._cards.length}`,
            `Cards remaining: ${72 - this._cards.length}`,
            "\n",
        );
    }

    private isEmptyFieldAdjacent(x: number, y: number): boolean {
        const adjacentOffsets = [
            {dx: -1, dy: -1},
            {dx: 0, dy: -1},
            {dx: 1, dy: -1},
            {dx: -1, dy: 0},
            {dx: 1, dy: 0},
            {dx: -1, dy: 1},
            {dx: 0, dy: 1},
            {dx: 1, dy: 1},
        ];

        return adjacentOffsets.some((offset) => {
            return this._cards.some(
                (card) => card.x === x + offset.dx && card.y === y + offset.dy,
            );
        });
    }

    /**
     * Returns whether the board is empty.
     * @returns {boolean} `true` if the board is empty, `false` otherwise.
     */
    public boardIsEmpty(): boolean {
        return this._cards.length === 0;
    }

    /**
     * Returns whether the board is full.
     * @returns {boolean} `true` if the board is full, `false` otherwise.
     */
    public boardIsFull(): boolean {
        return this._cards.length === 72;
    }

    /**
     * Returns whether the game is over.
     * @returns {boolean} `true` if the game is over, `false` otherwise.
     */
    public isGameOver(): boolean {
        return this._winType !== WinType.None;
    }

    /**
     * Ends the game and determines the winner(s) and loser(s).
     * @param {WinType} winType The type of win.
     * @param {Player[]} winners The winner(s) of the game.
     * @param {Player[]} losers The loser(s) of the game.
     */
    private endGame(
        winType: WinType,
        winners: Player[],
        losers: Player[],
    ): void {
        this.updateWinType(winType);

        this.updateLoser(losers);

        this.updateWinner(winners);

        if (winType === WinType.Win) {
            this.addPoints();
        }
    }

    /**
     * Adds points to the winner(s) of the game.
     * @param {Player[]} players The player(s) to add points to. By default, the winner(s) of the game.
     * @param {number} pointsToAdd The number of points to add. By default, 1.
     */
    private addPoints(
        players: Player[] = this._winners,
        pointsToAdd: number = 1,
    ): void {
        players.forEach((player) => {
            player.addPoints(pointsToAdd);
        });
    }

    /**
     * Resets the board to its initial state.
     */
    public reset(): void {
        this.regenerateId();

        this._cards = [];

        this._players.forEach((player) => {
            player.reset();
        });

        this._turn = 0;

        this._winType = WinType.None;

        // const playerWithTurn = this.randomizePlayerTurn();
        const playerWithTurn = this.playerTurnByNbrFirstPlayer();

        playerWithTurn.nbrFirstPlayer++;

        this._winners = [];

        this._losers = [];

        this.cardDistribution();
    }
}

/**
 * The options for the board.
 */
type BoardOptions = {
    /**
     * The number of players in the game.
     * @default 2
     * @type {number}
     * @memberof BoardOptions
     */
    nbrPlayers: number;

    /**
     * The options for the players.
     * @type {PlayerOptions[]}
     * @memberof BoardOptions
     */
    listPlayerOptions: PlayerOptions[];
};

/**
 * The type of win achieved.
 */
enum WinType {
    /**
     * A player has won the game.
     * @type {string}
     */
    Win = "Win",

    /**
     * The game is a draw.
     * @type {string}
     */
    Draw = "Draw",

    /**
     * A player has dropped out of the game.
     * @type {string}
     */
    Drop = "Drop",

    /**
     * No player has won the game.
     * @type {string}
     */
    None = "None",
}

export default Board;

export {Board, BoardOptions, WinType};
