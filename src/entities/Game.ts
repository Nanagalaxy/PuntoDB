import DBWrapper from "../db/DBWrapper";
import Result, {ResultStatus} from "../db/Result";
import BaseEntityManager from "./BaseEntityManager";
import {MySQLPunto, MySQLCard, MySQLPuntoPlayer} from "./Game/MySQLGame";
import {SQLitePunto, SQLiteCard, SQLitePuntoPlayer} from "./Game/SQLiteGame";
import MongoPunto, {MongoCard, MongoPuntoPlayer} from "./Game/MongoGame";

import Cards from "../game/Card";
import UserManager from "./User";
import Board from "../game/Board";

/**
 * The MySQL entity used in this class.
 * It is used to type the {@link GameManager.mySqlEntity} member.
 * It's composed of the MySQL entities of the punto, cards, and players.
 * @property {MySQLPunto} punto The MySQL entity of the punto.
 * @property {MySQLCard[]} cards The MySQL entities of the cards.
 * @property {MySQLPuntoPlayer[]} players The MySQL entities of the players.
 * @memberof GameManager
 */
type MySQLGameEntity = {
    punto: MySQLPunto;
    cards: MySQLCard[];
    players: MySQLPuntoPlayer[];
};

/**
 * The SQLite entity used in this class.
 * It is used to type the {@link GameManager.sqliteEntity} member.
 * It's composed of the SQLite entities of the punto, cards, and players.
 * @property {SQLitePunto} punto The SQLite entity of the punto.
 * @property {SQLiteCard[]} cards The SQLite entities of the cards.
 * @property {SQLitePuntoPlayer[]} players The SQLite entities of the players.
 * @memberof GameManager
 */
type SQLiteGameEntity = {
    punto: SQLitePunto;
    cards: SQLiteCard[];
    players: SQLitePuntoPlayer[];
};

class GameManager extends BaseEntityManager {
    /**
     * The MySQL entity used in this class. Replace {@link BaseEntityManager.mySqlEntity} with the specific MySQL entity for this class.
     * This is a protected member.
     * @protected
     * @type {MySQLGameEntity}
     * @memberof GameManager
     */
    protected mySqlEntity?: MySQLGameEntity;

    /**
     * The SQLite entity used in this class. Replace {@link BaseEntityManager.sqliteEntity} with the specific SQLite entity for this class.
     * This is a protected member.
     * @protected
     * @type {SQLiteGameEntity}
     * @memberof GameManager
     */
    protected sqliteEntity?: SQLiteGameEntity;

    /**
     * The MongoDB entity used in this class. Replace {@link BaseEntityManager.mongoEntity} with the specific MongoDB entity for this class.
     * This is a protected member.
     * @protected
     * @type {MongoUser}
     * @memberof GameManager
     */
    protected mongoEntity?: MongoPunto;

    /**
     * Flag that indicates if the entities were built with the {@link GameManager.buildEntities} method.
     * @type {boolean}
     * @memberof GameManager
     * @private
     */
    private unbuiltEntities: boolean = true;

    /**
     * The type of the game repository to be used. If not specified, the default Punto repository will be used.
     * Specify `GameRepoType.Punto` for punto repository, `GameRepoType.Player` for player repository, and `GameRepoType.Card` for card repository.
     * You can specify nothing for punto repository. (For MongoDB, the punto repository is the only repository that is used.)
     * @type {GameRepoType}
     * @memberof GameManager
     * @static
     * @private
     */
    private static gameRepoType?: GameRepoType;

    /**
     * Creates an instance of GameManager.
     * After creating an instance of this class, you should call {@link GameManager.buildEntities} to build the entities.
     *
     * @param {DBWrapper} dbWrapper The DBWrapper instance to be used in this class.
     * @memberof GameManager
     *
     * @example
     * const gameManager = new GameManager(dbWrapper);
     *
     * gameManager.buildEntities(cards, players, winType, playersStatus);
     *
     * // You can now uses the DB methods
     * gameManager.save();
     */
    public constructor(dbWrapper: DBWrapper) {
        super(dbWrapper);

        GameManager.initRepositories();
    }

    /**
     * Builds the entities of the punto from the given board.
     * This method should be called before any other DB method is invoked like {@link GameManager.save}.
     * When the entities are built, you cannot call this method again and update the entities.
     *
     * @param {Board} board The board of the punto.
     * @returns {Promise<void>} A promise that resolves when the entities are built.
     *
     * @example
     * const gameManager = new GameManager(dbWrapper);
     *
     * await gameManager.buildEntities(board);
     *
     * // You can now uses the DB methods
     * await gameManager.save();
     */
    public async buildEntities(board: Board): Promise<void> {
        if (!this.unbuiltEntities) {
            return;
        }

        const players = board.players;

        const winners = board.winners;
        const losers = board.losers;

        const cards = board.cards;

        const winType = board.winType;

        const distributedCardsByPlayer: {[key: string]: Cards[]} = {};

        // Distribute the cards by player
        for (const card of cards) {
            const playerId = card.playedBy?.id ? card.playedBy.id : "none";

            if (!distributedCardsByPlayer[playerId]) {
                distributedCardsByPlayer[playerId] = [];
            }

            distributedCardsByPlayer[playerId].push(card);
        }

        const mySqlPuntoPlayers: MySQLPuntoPlayer[] = [];
        const mySqlCards: MySQLCard[] = [];

        const sqlitePuntoPlayers: SQLitePuntoPlayer[] = [];
        const sqliteCards: SQLiteCard[] = [];

        const mongoPuntoPlayers: MongoPuntoPlayer[] = [];
        const mongoCards: MongoCard[] = [];

        for (const player of players) {
            const playerId = player.id;

            const name = player.name;
            const points = player.points;
            const status = winners.includes(player)
                ? "winner"
                : losers.includes(player)
                ? "loser"
                : "none";

            // Retrieve the player ID from the database(s)

            const findResult = await UserManager.find(name);

            const mySqlData = Array.isArray(findResult.mySqlRepo?.data)
                ? findResult.mySqlRepo?.data[0]
                : undefined;
            const sqliteData = Array.isArray(findResult.sqliteRepo?.data)
                ? findResult.sqliteRepo?.data[0]
                : undefined;
            const mongoData = Array.isArray(findResult.mongoRepo?.data)
                ? findResult.mongoRepo?.data[0]
                : undefined;

            let mySqlPlayerID: number | undefined;
            let sqlitePlayerID: number | undefined;
            // let mongoPlayerID: ObjectId | undefined;
            let mongoPlayerID: string | undefined;

            let finded = false;

            if (mySqlData && sqliteData && mongoData) {
                finded = true;
            }

            if (finded) {
                const user = await UserManager.build(name);

                mySqlPlayerID = user.mySqlId;
                sqlitePlayerID = user.sqliteId;
                // mongoPlayerID = user.mongoId;
                mongoPlayerID = user.name;
            } else {
                // If the user is not found or is not in all databases

                // If the user is not found in any database, create a new user
                if (!mySqlData && !sqliteData && !mongoData) {
                    const user = new UserManager(GameManager.dbWrapper, name);

                    await user.save();

                    mySqlPlayerID = user.mySqlId;
                    sqlitePlayerID = user.sqliteId;
                    // mongoPlayerID = user.mongoId;
                    mongoPlayerID = user.name;
                }
                // If the user is found in at least one database, but not in all databases
                else {
                    // Build the user from the database(s)
                    const user = await UserManager.build(name);

                    // Rebuild the user for the databases that it is not found in
                    await user.rebuild();

                    // Add the user to the databases that it is not found in
                    await user.save();

                    mySqlPlayerID = user.mySqlId;
                    sqlitePlayerID = user.sqliteId;
                    // mongoPlayerID = user.mongoId;
                    mongoPlayerID = user.name;
                }
            }

            if (mySqlPlayerID) {
                const mySqlPuntoPlayer = new MySQLPuntoPlayer(
                    mySqlPlayerID,
                    points,
                    status,
                );
                mySqlPuntoPlayers.push(mySqlPuntoPlayer);
            }

            if (sqlitePlayerID) {
                const sqlitePuntoPlayer = new SQLitePuntoPlayer(
                    sqlitePlayerID,
                    points,
                    status,
                );
                sqlitePuntoPlayers.push(sqlitePuntoPlayer);
            }

            if (mongoPlayerID) {
                const mongoPuntoPlayer = new MongoPuntoPlayer(
                    mongoPlayerID,
                    points,
                    status,
                );

                mongoPuntoPlayers.push(mongoPuntoPlayer);
            }

            // If there are cards that are played by the player
            if (distributedCardsByPlayer[playerId] !== undefined) {
                // Construct the cards of the player
                for (const card of distributedCardsByPlayer[playerId]) {
                    const x = card.x;
                    const y = card.y;
                    const color = card.color;
                    const value = card.value;
                    const playedTurn = card.playedTurn;
                    const playedIn = card.playedIn;

                    const mySqlPlayedBy = mySqlPlayerID;
                    const sqlitePlayedBy = sqlitePlayerID;
                    const mongoPlayedBy = mongoPlayerID;

                    const mySqlCard = new MySQLCard(
                        x,
                        y,
                        color,
                        value,
                        playedTurn,
                        playedIn,
                        mySqlPlayedBy,
                    );

                    const sqliteCard = new SQLiteCard(
                        x,
                        y,
                        color,
                        value,
                        playedTurn,
                        playedIn,
                        sqlitePlayedBy,
                    );

                    const mongoCard = new MongoCard(
                        x,
                        y,
                        color,
                        value,
                        playedTurn,
                        playedIn,
                        mongoPlayedBy,
                    );

                    mySqlCards.push(mySqlCard);
                    sqliteCards.push(sqliteCard);
                    mongoCards.push(mongoCard);
                }
            }

            // If there are cards that are not played
            if (distributedCardsByPlayer["none"] !== undefined) {
                // Adds unplayed cards (playerId = "none")
                for (const card of distributedCardsByPlayer["none"]) {
                    const x = card.x;
                    const y = card.y;
                    const color = card.color;
                    const value = card.value;
                    const playedTurn = card.playedTurn;
                    const playedIn = card.playedIn;
                    const playedBy = undefined;

                    const mySqlCard = new MySQLCard(
                        x,
                        y,
                        color,
                        value,
                        playedTurn,
                        playedIn,
                        playedBy,
                    );

                    const sqliteCard = new SQLiteCard(
                        x,
                        y,
                        color,
                        value,
                        playedTurn,
                        playedIn,
                        playedBy,
                    );

                    const mongoCard = new MongoCard(
                        x,
                        y,
                        color,
                        value,
                        playedTurn,
                        playedIn,
                        playedBy,
                    );

                    mySqlCards.push(mySqlCard);
                    sqliteCards.push(sqliteCard);
                    mongoCards.push(mongoCard);
                }
            }
        }

        this.mySqlEntity = {
            punto: new MySQLPunto(winType),
            cards: mySqlCards,
            players: mySqlPuntoPlayers,
        };

        this.sqliteEntity = {
            punto: new SQLitePunto(winType),
            cards: sqliteCards,
            players: sqlitePuntoPlayers,
        };

        this.mongoEntity = new MongoPunto(
            mongoCards,
            mongoPuntoPlayers,
            winType,
        );

        this.unbuiltEntities = false;
    }

    /**
     * Initializes the repositories for MySQL, SQLite, and MongoDB.
     * This method should be called before any other method in this class is invoked.
     * For change the type of the game repository to be used, change the {@link GameManager.gameRepoType} member.
     *
     * @example
     * // For punto repository
     * GameManager.gameRepoType = GameRepoType.Punto;
     * GameManager.initRepositories();
     *
     * // For player repository
     * GameManager.gameRepoType = GameRepoType.Player;
     * GameManager.initRepositories();
     *
     * // For card repository
     * GameManager.gameRepoType = GameRepoType.Card;
     * GameManager.initRepositories();
     *
     * @protected
     * @static
     * @memberof GameManager
     */
    protected static initRepositories(): void {
        switch (GameManager.gameRepoType) {
            case GameRepoType.Punto:
                BaseEntityManager.initRepositories(
                    MySQLPunto,
                    SQLitePunto,
                    MongoPunto,
                );
                break;

            case GameRepoType.Player:
                BaseEntityManager.initRepositories(
                    MySQLPuntoPlayer,
                    SQLitePuntoPlayer,
                    MongoPunto,
                );
                break;

            case GameRepoType.Card:
                BaseEntityManager.initRepositories(
                    MySQLCard,
                    SQLiteCard,
                    MongoPunto,
                );
                break;

            default:
                BaseEntityManager.initRepositories(
                    MySQLPunto,
                    SQLitePunto,
                    MongoPunto,
                );
        }
    }

    /**
     * Builds a punto from the database(s).
     * This builds a punto from the database(s) and returns it.
     * The puntos constructed are not necessarily the same,
     * because only the first punto returned by the {@link GameManager.find} method is used.
     *
     * @returns {Promise<GameManager>} The built punto. It is the same as calling {@link GameManager.build}.
     */
    public async build(): Promise<GameManager> {
        return await GameManager.build();
    }

    /**
     * Builds a punto from the database(s).
     * This builds a punto from the database(s) and returns it.
     * The puntos constructed are not necessarily the same,
     * because only the first punto returned by the {@link GameManager.find} method is used.
     *
     * @returns {Promise<GameManager>} The built punto.
     */
    public static async build(): Promise<GameManager> {
        GameManager.initRepositories();

        const buildedPunto = new GameManager(GameManager.dbWrapper);

        const puntosFromDBs = await GameManager.find();

        const mySqlPuntoData = puntosFromDBs.mySqlRepo?.data;
        const sqlitePuntoData = puntosFromDBs.sqliteRepo?.data;
        const mongoPuntoData = puntosFromDBs.mongoRepo?.data;

        if (
            mySqlPuntoData &&
            Array.isArray(mySqlPuntoData) &&
            mySqlPuntoData.length > 0
        ) {
            const mySqlPunto = mySqlPuntoData[0];

            buildedPunto.mySqlEntity = mySqlPunto;
        }

        if (
            sqlitePuntoData &&
            Array.isArray(sqlitePuntoData) &&
            sqlitePuntoData.length > 0
        ) {
            const sqlitePunto = sqlitePuntoData[0];

            buildedPunto.sqliteEntity = sqlitePunto;
        }

        if (
            mongoPuntoData &&
            Array.isArray(mongoPuntoData) &&
            mongoPuntoData.length > 0
        ) {
            const mongoPunto = mongoPuntoData[0];

            buildedPunto.mongoEntity = mongoPunto;
        }

        if (
            buildedPunto.mySqlEntity &&
            buildedPunto.sqliteEntity &&
            buildedPunto.mongoEntity
        ) {
            buildedPunto.unbuiltEntities = false;
        }

        return buildedPunto;
    }

    /**
     * Base : Rebuilds the punto from the database(s).
     * This method should not be called beacaue it has no sence for punto and it throws an error.
     *
     * @returns {Promise<void>} A promise that resolves when the punto is rebuilt.
     * @throws {Error} Always throws an error because this method has no sence for punto.
     * @memberof GameManager
     */
    public async rebuild(): Promise<void> {
        throw new Error("Method have non sence for punto");
    }

    /**
     * Saves the punto in the database(s).
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     * }>} The results of the save operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the saved object.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public async save(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }> {
        if (this.unbuiltEntities) {
            throw new Error(
                "You should call the buildEntities method before saving the punto.",
            );
        }

        GameManager.gameRepoType = GameRepoType.Punto;
        GameManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
        };

        if (this.mySqlEntity && GameManager.mySqlRepo) {
            let puntoResult: Result | undefined;
            let cardsResult: Result | undefined;
            let playersResult: Result | undefined;

            GameManager.gameRepoType = GameRepoType.Punto;
            GameManager.initRepositories();

            await GameManager.mySqlRepo
                .save(this.mySqlEntity.punto)
                .then((result) => {
                    puntoResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    puntoResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            for (const player of this.mySqlEntity.players) {
                player.boardId = this.mySqlEntity.punto._id;
            }

            for (const card of this.mySqlEntity.cards) {
                card.boardId = this.mySqlEntity.punto._id;
            }

            GameManager.gameRepoType = GameRepoType.Player;
            GameManager.initRepositories();

            await GameManager.mySqlRepo
                .save(this.mySqlEntity.players)
                .then((result) => {
                    playersResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    playersResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            GameManager.gameRepoType = GameRepoType.Card;
            GameManager.initRepositories();

            await GameManager.mySqlRepo
                .save(this.mySqlEntity.cards)
                .then((result) => {
                    cardsResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    cardsResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            let data = {};
            let errors = {};

            if (puntoResult?.data) {
                data = {
                    ...data,
                    punto: puntoResult.data,
                };
            }
            if (cardsResult?.data) {
                data = {
                    ...data,
                    cards: cardsResult.data,
                };
            }
            if (playersResult?.data) {
                data = {
                    ...data,
                    players: playersResult.data,
                };
            }

            if (puntoResult?.error) {
                errors = {
                    ...errors,
                    punto: puntoResult.error,
                };
            }
            if (cardsResult?.error) {
                errors = {
                    ...errors,
                    cards: cardsResult.error,
                };
            }
            if (playersResult?.error) {
                errors = {
                    ...errors,
                    players: playersResult.error,
                };
            }

            results.mySqlRepo = new Result({
                status:
                    puntoResult?.status === ResultStatus.Success &&
                    cardsResult?.status === ResultStatus.Success &&
                    playersResult?.status === ResultStatus.Success
                        ? ResultStatus.Success
                        : ResultStatus.Fail,
                data: Object.keys(data).length !== 0 ? data : undefined,
                error: Object.keys(errors).length !== 0 ? errors : undefined,
            });
        }

        if (this.sqliteEntity && GameManager.sqliteRepo) {
            let puntoResult: Result | undefined;
            let cardsResult: Result | undefined;
            let playersResult: Result | undefined;

            GameManager.gameRepoType = GameRepoType.Punto;
            GameManager.initRepositories();

            await GameManager.sqliteRepo
                .save(this.sqliteEntity.punto)
                .then((result) => {
                    puntoResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    puntoResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            const thisBoardId = this.sqliteEntity.punto._id;

            for (const player of this.sqliteEntity.players) {
                player.boardId = thisBoardId;
            }

            for (const card of this.sqliteEntity.cards) {
                card.boardId = thisBoardId;
            }

            GameManager.gameRepoType = GameRepoType.Player;
            GameManager.initRepositories();

            await GameManager.sqliteRepo
                .save(this.sqliteEntity.players)
                .then((result) => {
                    playersResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    playersResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            GameManager.gameRepoType = GameRepoType.Card;
            GameManager.initRepositories();

            await GameManager.sqliteRepo
                .save(this.sqliteEntity.cards)
                .then((result) => {
                    cardsResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    cardsResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            let data = {};
            let errors = {};

            if (puntoResult?.data) {
                data = {
                    ...data,
                    punto: puntoResult.data,
                };
            }
            if (cardsResult?.data) {
                data = {
                    ...data,
                    cards: cardsResult.data,
                };
            }
            if (playersResult?.data) {
                data = {
                    ...data,
                    players: playersResult.data,
                };
            }

            if (puntoResult?.error) {
                errors = {
                    ...errors,
                    punto: puntoResult.error,
                };
            }
            if (cardsResult?.error) {
                errors = {
                    ...errors,
                    cards: cardsResult.error,
                };
            }
            if (playersResult?.error) {
                errors = {
                    ...errors,
                    players: playersResult.error,
                };
            }

            results.sqliteRepo = new Result({
                status:
                    puntoResult?.status === ResultStatus.Success &&
                    cardsResult?.status === ResultStatus.Success &&
                    playersResult?.status === ResultStatus.Success
                        ? ResultStatus.Success
                        : ResultStatus.Fail,
                data: Object.keys(data).length !== 0 ? data : undefined,
                error: Object.keys(errors).length !== 0 ? errors : undefined,
            });
        }

        if (this.mongoEntity && GameManager.mongoRepo) {
            // GameManager.gameRepoType = GameRepoType.Punto;
            // GameManager.initRepositories();

            await GameManager.mongoRepo
                .save(this.mongoEntity)
                .then((result) => {
                    results.mongoRepo = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    results.mongoRepo = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });
        }

        return results;
    }

    /**
     * Removes the punto from the database(s).
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     * }>} The results of the remove operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the removed object.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public async remove(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }> {
        if (this.unbuiltEntities) {
            throw new Error(
                "You should call the buildEntities method before removing the punto.",
            );
        }

        GameManager.gameRepoType = GameRepoType.Punto;
        GameManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
        };

        if (this.mySqlEntity && GameManager.mySqlRepo) {
            let puntoResult: Result | undefined;
            let cardsResult: Result | undefined;
            let playersResult: Result | undefined;

            GameManager.gameRepoType = GameRepoType.Punto;
            GameManager.initRepositories();

            await GameManager.mySqlRepo
                .remove(this.mySqlEntity.punto)
                .then((result) => {
                    puntoResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    puntoResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            GameManager.gameRepoType = GameRepoType.Player;
            GameManager.initRepositories();

            await GameManager.mySqlRepo
                .remove(this.mySqlEntity.players)
                .then((result) => {
                    playersResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    playersResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            GameManager.gameRepoType = GameRepoType.Card;
            GameManager.initRepositories();

            await GameManager.mySqlRepo
                .remove(this.mySqlEntity.cards)
                .then((result) => {
                    cardsResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    cardsResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            let data = {};
            let errors = {};

            if (puntoResult?.data) {
                data = {
                    ...data,
                    punto: puntoResult.data,
                };
            }
            if (cardsResult?.data) {
                data = {
                    ...data,
                    cards: cardsResult.data,
                };
            }
            if (playersResult?.data) {
                data = {
                    ...data,
                    players: playersResult.data,
                };
            }

            if (puntoResult?.error) {
                errors = {
                    ...errors,
                    punto: puntoResult.error,
                };
            }
            if (cardsResult?.error) {
                errors = {
                    ...errors,
                    cards: cardsResult.error,
                };
            }
            if (playersResult?.error) {
                errors = {
                    ...errors,
                    players: playersResult.error,
                };
            }

            results.mySqlRepo = new Result({
                status:
                    puntoResult?.status === ResultStatus.Success &&
                    cardsResult?.status === ResultStatus.Success &&
                    playersResult?.status === ResultStatus.Success
                        ? ResultStatus.Success
                        : ResultStatus.Fail,
                data: Object.keys(data).length !== 0 ? data : undefined,
                error: Object.keys(errors).length !== 0 ? errors : undefined,
            });
        }

        if (this.sqliteEntity && GameManager.sqliteRepo) {
            let puntoResult: Result | undefined;
            let cardsResult: Result | undefined;
            let playersResult: Result | undefined;

            GameManager.gameRepoType = GameRepoType.Punto;
            GameManager.initRepositories();

            await GameManager.sqliteRepo
                .remove(this.sqliteEntity.punto)
                .then((result) => {
                    puntoResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    puntoResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            GameManager.gameRepoType = GameRepoType.Player;
            GameManager.initRepositories();

            await GameManager.sqliteRepo
                .remove(this.sqliteEntity.players)
                .then((result) => {
                    playersResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    playersResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            GameManager.gameRepoType = GameRepoType.Card;
            GameManager.initRepositories();

            await GameManager.sqliteRepo
                .remove(this.sqliteEntity.cards)
                .then((result) => {
                    cardsResult = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    cardsResult = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });

            let data = {};
            let errors = {};

            if (puntoResult?.data) {
                data = {
                    ...data,
                    punto: puntoResult.data,
                };
            }
            if (cardsResult?.data) {
                data = {
                    ...data,
                    cards: cardsResult.data,
                };
            }
            if (playersResult?.data) {
                data = {
                    ...data,
                    players: playersResult.data,
                };
            }

            if (puntoResult?.error) {
                errors = {
                    ...errors,
                    punto: puntoResult.error,
                };
            }
            if (cardsResult?.error) {
                errors = {
                    ...errors,
                    cards: cardsResult.error,
                };
            }
            if (playersResult?.error) {
                errors = {
                    ...errors,
                    players: playersResult.error,
                };
            }

            results.sqliteRepo = new Result({
                status:
                    puntoResult?.status === ResultStatus.Success &&
                    cardsResult?.status === ResultStatus.Success &&
                    playersResult?.status === ResultStatus.Success
                        ? ResultStatus.Success
                        : ResultStatus.Fail,
                data: Object.keys(data).length !== 0 ? data : undefined,
                error: Object.keys(errors).length !== 0 ? errors : undefined,
            });
        }

        if (this.mongoEntity && GameManager.mongoRepo) {
            // GameManager.gameRepoType = GameRepoType.Punto;
            // GameManager.initRepositories();

            await GameManager.mongoRepo
                .remove(this.mongoEntity)
                .then((result) => {
                    console.log("result", result);

                    results.mongoRepo = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    console.log("error", error);

                    results.mongoRepo = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });
        }

        return results;
    }

    /**
     * Removes all the puntos from the database(s).
     * This method is the same as calling {@link GameManager.removeAll}
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *     sqliteRepo?: Result;
     *     mongoRepo?: Result;
     * }>} The results of the remove operation. For each repository:
     * - If the operation was successful, the status will be `Success` and there is no `data`.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public async removeAll(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }> {
        return GameManager.removeAll();
    }

    /**
     * Removes all the puntos from the database(s).
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *     sqliteRepo?: Result;
     *     mongoRepo?: Result;
     * }>} The results of the remove operation. For each repository:
     * - If the operation was successful, the status will be `Success` and there is no `data`.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public static async removeAll(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }> {
        GameManager.gameRepoType = GameRepoType.Punto;
        GameManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
        };

        let mySqlPuntoResult: Result | undefined;
        let mySqlCardsResult: Result | undefined;
        let mySqlPlayersResult: Result | undefined;

        let sqlitePuntoResult: Result | undefined;
        let sqliteCardsResult: Result | undefined;
        let sqlitePlayersResult: Result | undefined;

        await GameManager.mySqlRepo
            ?.clear()
            .then(() => {
                mySqlPuntoResult = new Result({
                    status: ResultStatus.Success,
                });
            })
            .catch((error) => {
                mySqlPuntoResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.sqliteRepo
            ?.clear()
            .then(() => {
                sqlitePuntoResult = new Result({
                    status: ResultStatus.Success,
                });
            })
            .catch((error) => {
                sqlitePuntoResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.mongoRepo
            ?.clear()
            .then(() => {
                results.mongoRepo = new Result({
                    status: ResultStatus.Success,
                });
            })
            .catch((error) => {
                results.mongoRepo = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        GameManager.gameRepoType = GameRepoType.Player;
        GameManager.initRepositories();

        await GameManager.mySqlRepo
            ?.clear()
            .then(() => {
                mySqlPlayersResult = new Result({
                    status: ResultStatus.Success,
                });
            })
            .catch((error) => {
                mySqlPlayersResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.sqliteRepo
            ?.clear()
            .then(() => {
                sqlitePlayersResult = new Result({
                    status: ResultStatus.Success,
                });
            })
            .catch((error) => {
                sqlitePlayersResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        GameManager.gameRepoType = GameRepoType.Card;
        GameManager.initRepositories();

        await GameManager.mySqlRepo
            ?.clear()
            .then(() => {
                mySqlCardsResult = new Result({
                    status: ResultStatus.Success,
                });
            })
            .catch((error) => {
                mySqlCardsResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.sqliteRepo
            ?.clear()
            .then(() => {
                sqliteCardsResult = new Result({
                    status: ResultStatus.Success,
                });
            })
            .catch((error) => {
                sqliteCardsResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        let errors = {};

        if (GameManager.mySqlRepo) {
            if (mySqlPuntoResult?.error) {
                errors = {
                    ...errors,
                    mySqlPunto: mySqlPuntoResult.error,
                };
            }
            if (mySqlPlayersResult?.error) {
                errors = {
                    ...errors,
                    mySqlPlayers: mySqlPlayersResult.error,
                };
            }
            if (mySqlCardsResult?.error) {
                errors = {
                    ...errors,
                    mySqlCards: mySqlCardsResult.error,
                };
            }

            results.mySqlRepo = new Result({
                status:
                    mySqlPuntoResult?.status === ResultStatus.Success &&
                    mySqlPlayersResult?.status === ResultStatus.Success &&
                    mySqlCardsResult?.status === ResultStatus.Success
                        ? ResultStatus.Success
                        : ResultStatus.Fail,
                error: Object.keys(errors).length !== 0 ? errors : undefined,
            });
        }

        if (GameManager.sqliteRepo) {
            if (sqlitePuntoResult?.error) {
                errors = {
                    ...errors,
                    sqlitePunto: sqlitePuntoResult.error,
                };
            }
            if (sqlitePlayersResult?.error) {
                errors = {
                    ...errors,
                    sqlitePlayers: sqlitePlayersResult.error,
                };
            }
            if (sqliteCardsResult?.error) {
                errors = {
                    ...errors,
                    sqliteCards: sqliteCardsResult.error,
                };
            }

            results.sqliteRepo = new Result({
                status:
                    sqlitePuntoResult?.status === ResultStatus.Success &&
                    sqlitePlayersResult?.status === ResultStatus.Success &&
                    sqliteCardsResult?.status === ResultStatus.Success
                        ? ResultStatus.Success
                        : ResultStatus.Fail,
                error: Object.keys(errors).length !== 0 ? errors : undefined,
            });
        }

        return results;
    }

    /**
     * Finds the punto in the database(s) by its properties.
     * This method is the same as calling {@link GameManager.find} with the properties of the punto as the parameter
     * except that this method uses the properties of the punto that calls this method as the parameter.
     * So, even if no such properties are specified in the actual code,
     * you must call {@link GameManager.buildEntities} before calling this method.
     * Also, as there are no properties, you can directly call {@link GameManager.findAll}.
     *
     * @example
     * const punto = new GameManager(dbWrapper);
     * await punto.buildEntities(board);
     * const results = await punto.find();
     *
     * // is the same as
     *
     * const results = await GameManager.find();
     *
     * // And the same as
     *
     * const results = await GameManager.findAll();
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     * }>} The results of the find operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the found object.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public async find(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }> {
        if (this.unbuiltEntities) {
            throw new Error(
                "You should call the buildEntities method before finding the punto.",
            );
        }

        GameManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
        };

        await GameManager.mySqlRepo
            ?.find({
                where: {
                    // TODO : add properties
                },
            })
            .then((result) => {
                results.mySqlRepo = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                results.mySqlRepo = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.sqliteRepo
            ?.find({
                where: {
                    // TODO : add properties
                },
            })
            .then((result) => {
                results.sqliteRepo = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                results.sqliteRepo = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.mongoRepo
            ?.find({
                where: {
                    // TODO : add properties
                },
            })
            .then((result) => {
                results.mongoRepo = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                results.mongoRepo = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        return results;
    }

    /**
     * Finds a punto in the database(s) by its properties.
     * But as there are no properties, you can directly call {@link GameManager.findAll}.
     *
     * @example
     * const results = await GameManager.find();
     *
     * // Is the same as
     *
     * const results = await GameManager.findAll();
     *
     * @returns {Promise<{
     *   mySqlRepo?: Result;
     *   sqliteRepo?: Result;
     *   mongoRepo?: Result;
     * }>} The results of the find operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the found object.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public static async find(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }> {
        GameManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
        };

        await GameManager.mySqlRepo
            ?.find({
                where: {
                    // TODO : add properties
                },
            })
            .then((result) => {
                results.mySqlRepo = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                results.mySqlRepo = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.sqliteRepo
            ?.find({
                where: {
                    // TODO : add properties
                },
            })
            .then((result) => {
                results.sqliteRepo = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                results.sqliteRepo = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.mongoRepo
            ?.find({
                where: {
                    // TODO : add properties
                },
            })
            .then((result) => {
                results.mongoRepo = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                results.mongoRepo = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        return results;
    }

    /**
     * Finds all puntos in the database(s). It is the same as calling {@link GameManager.findAll}.
     *
     * @example
     * const punto = new GameManager(dbWrapper);
     * const results = await punto.findAll();
     *
     * // is the same as
     *
     * const results = await GameManager.findAll();
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     * }>} The results of the find operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the found objects.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public async findAll(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }> {
        return GameManager.findAll();
    }

    /**
     * Finds all puntos in the database(s).
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     * }>} The results of the find operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the found objects.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public static async findAll(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }> {
        GameManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
        };

        let mySqlPuntoResult: Result | undefined;
        let mySqlCardsResult: Result | undefined;
        let mySqlPlayersResult: Result | undefined;

        let sqlitePuntoResult: Result | undefined;
        let sqliteCardsResult: Result | undefined;
        let sqlitePlayersResult: Result | undefined;

        await GameManager.mySqlRepo
            ?.find()
            .then((result) => {
                // results.mySqlRepo = new Result({
                //     status: result ? ResultStatus.Success : ResultStatus.Fail,
                //     data: result,
                // });
                mySqlPuntoResult = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                // results.mySqlRepo = new Result({
                //     status: ResultStatus.Fail,
                //     error,
                // });
                mySqlPuntoResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.sqliteRepo
            ?.find()
            .then((result) => {
                // results.sqliteRepo = new Result({
                //     status: result ? ResultStatus.Success : ResultStatus.Fail,
                //     data: result,
                // });
                sqlitePuntoResult = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                // results.sqliteRepo = new Result({
                //     status: ResultStatus.Fail,
                //     error,
                // });
                sqlitePuntoResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.mongoRepo
            ?.find()
            .then((result) => {
                results.mongoRepo = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                results.mongoRepo = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        GameManager.gameRepoType = GameRepoType.Player;
        GameManager.initRepositories();

        await GameManager.mySqlRepo
            ?.find()
            .then((result) => {
                mySqlPlayersResult = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                mySqlPlayersResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.sqliteRepo
            ?.find()
            .then((result) => {
                sqlitePlayersResult = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                sqlitePlayersResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        GameManager.gameRepoType = GameRepoType.Card;
        GameManager.initRepositories();

        await GameManager.mySqlRepo
            ?.find()
            .then((result) => {
                mySqlCardsResult = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                mySqlCardsResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await GameManager.sqliteRepo
            ?.find()
            .then((result) => {
                sqliteCardsResult = new Result({
                    status: result ? ResultStatus.Success : ResultStatus.Fail,
                    data: result,
                });
            })
            .catch((error) => {
                sqliteCardsResult = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        let data = {};
        let errors = {};

        if (mySqlPuntoResult?.data) {
            data = {
                ...data,
                mySqlPunto: mySqlPuntoResult.data,
            };
        }
        if (mySqlPlayersResult?.data) {
            data = {
                ...data,
                mySqlPlayers: mySqlPlayersResult.data,
            };
        }
        if (mySqlCardsResult?.data) {
            data = {
                ...data,
                mySqlCards: mySqlCardsResult.data,
            };
        }

        if (sqlitePuntoResult?.data) {
            data = {
                ...data,
                sqlitePunto: sqlitePuntoResult.data,
            };
        }
        if (sqlitePlayersResult?.data) {
            data = {
                ...data,
                sqlitePlayers: sqlitePlayersResult.data,
            };
        }
        if (sqliteCardsResult?.data) {
            data = {
                ...data,
                sqliteCards: sqliteCardsResult.data,
            };
        }

        if (mySqlPuntoResult?.error) {
            errors = {
                ...errors,
                mySqlPunto: mySqlPuntoResult.error,
            };
        }
        if (mySqlPlayersResult?.error) {
            errors = {
                ...errors,
                mySqlPlayers: mySqlPlayersResult.error,
            };
        }
        if (mySqlCardsResult?.error) {
            errors = {
                ...errors,
                mySqlCards: mySqlCardsResult.error,
            };
        }

        if (sqlitePuntoResult?.error) {
            errors = {
                ...errors,
                sqlitePunto: sqlitePuntoResult.error,
            };
        }
        if (sqlitePlayersResult?.error) {
            errors = {
                ...errors,
                sqlitePlayers: sqlitePlayersResult.error,
            };
        }
        if (sqliteCardsResult?.error) {
            errors = {
                ...errors,
                sqliteCards: sqliteCardsResult.error,
            };
        }

        results.mySqlRepo = new Result({
            status:
                mySqlPuntoResult?.status === ResultStatus.Success &&
                mySqlPlayersResult?.status === ResultStatus.Success &&
                mySqlCardsResult?.status === ResultStatus.Success
                    ? ResultStatus.Success
                    : ResultStatus.Fail,
            data: Object.keys(data).length !== 0 ? data : undefined,
            error: Object.keys(errors).length !== 0 ? errors : undefined,
        });

        results.sqliteRepo = new Result({
            status:
                sqlitePuntoResult?.status === ResultStatus.Success &&
                sqlitePlayersResult?.status === ResultStatus.Success &&
                sqliteCardsResult?.status === ResultStatus.Success
                    ? ResultStatus.Success
                    : ResultStatus.Fail,
            data: Object.keys(data).length !== 0 ? data : undefined,
            error: Object.keys(errors).length !== 0 ? errors : undefined,
        });

        return results;
    }
}

enum GameRepoType {
    Punto = "Punto",
    Player = "Player",
    Card = "Card",
}

export default GameManager;
export {GameRepoType, MySQLGameEntity, SQLiteGameEntity};
