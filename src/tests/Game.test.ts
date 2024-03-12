import {testAssert} from "./Tests.test";
import {BoardOptions} from "../game/Board";
import CreatePunto from "../game/CreatePunto";
import {PuntoOptions} from "../game/Punto";

export function testAllPunto(n: number = 1) {
    testPuntoPlayerName(n);
    testPuntoCardsCorrect2Players(n);
    testPuntoCardsCorrect4Players(n);
    testPuntoCardsCorrect3Players(n);
    testPuntoImpossiblePlayerNumber(n);
    testPuntoNumberOfTotalCards(n);
    testPuntoPlaceCards(n);
}

function testPuntoPlaceCards(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const boardOptions: BoardOptions = {
            nbrPlayers: 2,
            listPlayerOptions: [
                {
                    name: "Player 1",
                    points: 0,
                    isTurn: true,
                },
                {
                    name: "Player 2",
                    points: 0,
                    isTurn: false,
                },
            ],
        };

        const puntoOptions: PuntoOptions = {
            boardOption: boardOptions,
        };

        const createPunto = new CreatePunto(puntoOptions);

        createPunto.createPunto();

        const punto = createPunto.getPunto();

        const board = punto?.board;

        if (board === undefined) {
            throw new Error("Board is undefined");
        }

        const player = board.getPlayerTurn();

        if (player === undefined) {
            throw new Error("Player is undefined");
        }

        const playerDeck = player.deck;

        const card1 = playerDeck.find((card) => card.value < 9);

        if (card1 === undefined) {
            throw new Error("Card1 is undefined");
        }

        player.hand = card1;

        const playResult1 = board.playCard(player, 0, card1, 0, 0);

        testAssert(
            "playResult1",
            playResult1 === "The card was successfully placed.",
            "The play result should be 'The card was successfully placed.', but it is '" +
                playResult1 +
                "'.",
        );

        const playResult2 = board.playCard(player, 0, card1, 0, 0);

        testAssert(
            "playResult2",
            playResult2 === "The player does not have the card in hand.",
            "The play result should be 'The player does not have the card in hand.', but it is '" +
                playResult2 +
                "'.",
        );

        const card2 = playerDeck.find((card) => card.value <= card1.value);

        if (card2 === undefined) {
            throw new Error("Card2 is undefined");
        }

        player.hand = card2;

        const playResult3 = board.playCard(player, 0, card2, 0, 0);

        testAssert(
            "playResult3",
            playResult3 === "The card could not be placed.",
            "The play result should be 'The card could not be placed.', but it is '" +
                playResult3 +
                "'.",
        );

        testAssert(
            "board.cards.length === 1",
            board.cards.length === 1,
            "The board should have 1 cards, but it has " +
                board.cards.length +
                " cards.",
        );

        testAssert(
            "board.cards[0].x === 0 && board.cards[0].y === 0",
            board.cards[0].x === 0 && board.cards[0].y === 0,
            "The card should be at the coordinates (0, 0), but it is at the coordinates (" +
                board.cards[0].x +
                ", " +
                board.cards[0].y +
                ").",
        );

        const card3 = playerDeck.find((card) => card.value > card1.value);

        if (card3 === undefined) {
            throw new Error("Card3 is undefined");
        }

        player.hand = card3;

        const playResult4 = board.playCard(player, 1, card3, 0, 0);

        testAssert(
            "playResult4",
            playResult4 === "The card was successfully placed.",
            "The play result should be 'The card was successfully placed.', but it is '" +
                playResult4 +
                "'.",
        );

        testAssert(
            "board.cards.length === 2",
            board.cards.length === 2,
            "The board should have 2 cards, but it has " +
                board.cards.length +
                " cards.",
        );

        testAssert(
            "board.cards[1].x === 0 && board.cards[1].y === 0",
            board.cards[1].x === 0 && board.cards[1].y === 0,
            "The card should be at the coordinates (0, 0), but it is at the coordinates (" +
                board.cards[1].x +
                ", " +
                board.cards[1].y +
                ").",
        );

        const drawnCardResult4 = player.drawCard();

        if (drawnCardResult4 === false) {
            throw new Error("Drawn card result is false");
        }

        const card4 = player.cardInHand();

        if (card4 === false) {
            throw new Error("Card is false");
        }

        const playResult5 = board.playCard(player, 2, card4, 1, 0);

        testAssert(
            "playResult5",
            playResult5 === "The card was successfully placed.",
            "The play result should be 'The card was successfully placed.', but it is '" +
                playResult5 +
                "'.",
        );

        testAssert(
            "board.cards.length === 3",
            board.cards.length === 3,
            "The board should have 3 cards, but it has " +
                board.cards.length +
                " cards.",
        );

        testAssert(
            "board.cards[2].x === 1 && board.cards[2].y === 0",
            board.cards[2].x === 1 && board.cards[2].y === 0,
            "The card should be at the coordinates (1, 0), but it is at the coordinates (" +
                board.cards[2].x +
                ", " +
                board.cards[2].y +
                ").",
        );
    }
}

function testPuntoNumberOfTotalCards(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const boardOptions2Players: BoardOptions = {
            nbrPlayers: 2,
            listPlayerOptions: [
                {
                    name: "Player 1",
                    points: 0,
                    isTurn: true,
                },
                {
                    name: "Player 2",
                    points: 0,
                    isTurn: false,
                },
            ],
        };

        const puntoOptions2Players: PuntoOptions = {
            boardOption: boardOptions2Players,
        };

        const createPunto2Players = new CreatePunto(puntoOptions2Players);

        createPunto2Players.createPunto();

        const board2Players = createPunto2Players.getPunto()?.board;

        const totalCards2Players = board2Players?.players.reduce(
            (acc, player) => acc + player.deck.length,
            0,
        );

        testAssert(
            "totalCards2Players === 72",
            totalCards2Players === 72,
            "The total number of cards should be 72, but it is " +
                totalCards2Players +
                ".",
        );

        const boardOptions3Players: BoardOptions = {
            nbrPlayers: 3,
            listPlayerOptions: [
                {
                    name: "Player 3",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 4",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 5",
                    points: 0,
                    isTurn: false,
                },
            ],
        };

        const puntoOptions3Players: PuntoOptions = {
            boardOption: boardOptions3Players,
        };

        const createPunto3Players = new CreatePunto(puntoOptions3Players);

        createPunto3Players.createPunto();

        const board3Players = createPunto3Players.getPunto()?.board;

        const totalCards3Players = board3Players?.players.reduce(
            (acc, player) => acc + player.deck.length,
            0,
        );

        testAssert(
            "totalCards3Players === 72",
            totalCards3Players === 72,
            "The total number of cards should be 72, but it is " +
                totalCards3Players +
                ".",
        );

        const boardOptions4Players: BoardOptions = {
            nbrPlayers: 4,
            listPlayerOptions: [
                {
                    name: "Player 6",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 7",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 8",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 9",
                    points: 0,
                    isTurn: false,
                },
            ],
        };

        const puntoOptions4Players: PuntoOptions = {
            boardOption: boardOptions4Players,
        };

        const createPunto4Players = new CreatePunto(puntoOptions4Players);

        createPunto4Players.createPunto();

        const board4Players = createPunto4Players.getPunto()?.board;

        const totalCards4Players = board4Players?.players.reduce(
            (acc, player) => acc + player.deck.length,
            0,
        );

        testAssert(
            "totalCards4Players === 72",
            totalCards4Players === 72,
            "The total number of cards should be 72, but it is " +
                totalCards4Players +
                ".",
        );
    }
}

function testPuntoImpossiblePlayerNumber(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const boardOptions1Player: BoardOptions = {
            nbrPlayers: 1,
            listPlayerOptions: [
                {
                    name: "Player 1",
                    points: 0,
                    isTurn: true,
                },
                {
                    name: "Player 2",
                    points: 0,
                    isTurn: false,
                },
            ],
        };

        const puntoOptions1Player: PuntoOptions = {
            boardOption: boardOptions1Player,
        };

        const createPunto1Player = new CreatePunto(puntoOptions1Player);

        try {
            createPunto1Player.createPunto();
        } catch (error) {
            const thisError = error as Error;

            testAssert(
                "thisError.message === 'The number of players must be between 2 and 4.'",
                thisError.message ===
                    "The number of players must be between 2 and 4.",
                "The error message should be 'The number of players must be between 2 and 4.', but it is '" +
                    thisError.message +
                    "'.",
            );
        }

        const boardOptions5Players: BoardOptions = {
            nbrPlayers: 5,
            listPlayerOptions: [
                {
                    name: "Player 1",
                    points: 0,
                    isTurn: true,
                },
                {
                    name: "Player 2",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 3",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 4",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 5",
                    points: 0,
                    isTurn: false,
                },
            ],
        };

        const puntoOptions5Players: PuntoOptions = {
            boardOption: boardOptions5Players,
        };

        const createPunto5Players = new CreatePunto(puntoOptions5Players);

        try {
            createPunto5Players.createPunto();
        } catch (error) {
            const thisError = error as Error;

            testAssert(
                "thisError.message === 'The number of players must be between 2 and 4.'",
                thisError.message ===
                    "The number of players must be between 2 and 4.",
                "The error message should be 'The number of players must be between 2 and 4.', but it is '" +
                    thisError.message +
                    "'.",
            );
        }
    }
}

function testPuntoCardsCorrect3Players(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const boardOptions: BoardOptions = {
            nbrPlayers: 3,
            listPlayerOptions: [
                {
                    name: "Player 3",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 4",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 5",
                    points: 0,
                    isTurn: false,
                },
            ],
        };

        const puntoOptions: PuntoOptions = {
            boardOption: boardOptions,
        };

        const createPunto = new CreatePunto(puntoOptions);

        createPunto.createPunto();

        createPunto.getPunto()?.board.players.forEach((player) => {
            const playerDeck = player.deck;

            testAssert(
                "playerDeck.length === 24",
                playerDeck.length === 24,
                "The deck should have 24 cards, but it has " +
                    playerDeck.length +
                    " cards.",
            );

            // Check if each color has 2 cards of each number
            const colors: string[] = player.color;

            colors.forEach((color) => {
                const cardsByColor = playerDeck.filter(
                    (card) => card.color === color,
                );

                if (player.color.includes(color)) {
                    testAssert(
                        "cardsByColor.length === 18",
                        cardsByColor.length === 18,
                        "The color " +
                            color +
                            " should have 18 cards, but it has " +
                            cardsByColor.length +
                            " cards.",
                    );
                } else {
                    testAssert(
                        "cardsByColor.length === 6",
                        cardsByColor.length === 6,
                        "The color " +
                            color +
                            " should have 6 cards, but it has " +
                            cardsByColor.length +
                            " cards.",
                    );
                }

                const numbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

                numbers.forEach((number) => {
                    const cards = playerDeck.filter(
                        (card) => card.color === color && card.value === number,
                    );

                    testAssert(
                        "cards.length === 2",
                        cards.length === 2,
                        "The color " +
                            color +
                            " and the number " +
                            number +
                            " should have 2 cards, but it has " +
                            cards.length +
                            " cards.",
                    );
                });
            });
        });
    }
}

function testPuntoCardsCorrect4Players(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const boardOptions: BoardOptions = {
            nbrPlayers: 4,
            listPlayerOptions: [
                {
                    name: "Player 6",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 7",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 8",
                    points: 0,
                    isTurn: false,
                },
                {
                    name: "Player 9",
                    points: 0,
                    isTurn: false,
                },
            ],
        };

        const puntoOptions: PuntoOptions = {
            boardOption: boardOptions,
        };

        const createPunto = new CreatePunto(puntoOptions);

        createPunto.createPunto();

        createPunto.getPunto()?.board.players.forEach((player) => {
            const playerDeck = player.deck;

            testAssert(
                "playerDeck.length === 18",
                playerDeck.length === 18,
                "The deck should have 18 cards, but it has " +
                    playerDeck.length +
                    " cards.",
            );

            // Check if each color has 2 cards of each number
            const colors: string[] = player.color;

            colors.forEach((color) => {
                const cards = playerDeck.filter((card) => card.color === color);

                testAssert(
                    "cards.length === 18 4Players",
                    cards.length === 18,
                    "The color " +
                        color +
                        " should have 18 cards, but it has " +
                        cards.length +
                        " cards.",
                );

                const numbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

                numbers.forEach((number) => {
                    const cards = playerDeck.filter(
                        (card) => card.color === color && card.value === number,
                    );

                    testAssert(
                        "cards.length === 2 4Players",
                        cards.length === 2,
                        "The color " +
                            color +
                            " and the number " +
                            number +
                            " should have 2 cards, but it has " +
                            cards.length +
                            " cards.",
                    );
                });
            });
        });
    }
}

function testPuntoCardsCorrect2Players(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const boardOptions: BoardOptions = {
            nbrPlayers: 2,
            listPlayerOptions: [
                {
                    name: "Player 1",
                    points: 0,
                    isTurn: true,
                },
                {
                    name: "Player 2",
                    points: 0,
                    isTurn: false,
                },
            ],
        };

        const puntoOptions: PuntoOptions = {
            boardOption: boardOptions,
        };

        const createPunto = new CreatePunto(puntoOptions);

        createPunto.createPunto();

        createPunto.getPunto()?.board.players.forEach((player) => {
            const playerDeck = player.deck;

            testAssert(
                "playerDeck.length === 36",
                playerDeck.length === 36,
                "The deck should have 36 cards, but it has " +
                    playerDeck.length +
                    " cards.",
            );

            // Check if each color has 2 cards of each number
            const colors: string[] = player.color;

            colors.forEach((color) => {
                const cards = playerDeck.filter((card) => card.color === color);

                testAssert(
                    "cards.length === 18 2Players",
                    cards.length === 18,
                    "The color " +
                        color +
                        " should have 18 cards, but it has " +
                        cards.length +
                        " cards.",
                );

                const numbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

                numbers.forEach((number) => {
                    const cards = playerDeck.filter(
                        (card) => card.color === color && card.value === number,
                    );

                    testAssert(
                        "cards.length === 2 2Players",
                        cards.length === 2,
                        "The color " +
                            color +
                            " and the number " +
                            number +
                            " should have 2 cards, but it has " +
                            cards.length +
                            " cards.",
                    );
                });
            });
        });
    }
}

function testPuntoPlayerName(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const boardOptions: BoardOptions = {
            nbrPlayers: 2,
            listPlayerOptions: [
                {
                    name: "Player 1",
                    points: 0,
                    isTurn: true,
                },
                {
                    name: "Player 2",
                    points: 0,
                    isTurn: false,
                },
            ],
        };

        const puntoOptions: PuntoOptions = {
            boardOption: boardOptions,
        };

        const createPunto = new CreatePunto(puntoOptions);

        createPunto.createPunto();

        const playersList = createPunto.getPunto()?.board.players;

        // Test if all names is correct
        ["Player 1", "Player 2"].forEach((name, index) => {
            testAssert(
                "playersList?.[index].name === name",
                playersList?.[index].name === name,
                "The name should be " +
                    name +
                    ", but it is " +
                    playersList?.[index].name +
                    ".",
            );
        });
    }
}
