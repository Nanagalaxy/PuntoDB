import "reflect-metadata";
import {
    DataSource,
    EntityTarget,
    MongoRepository,
    ObjectLiteral,
    Repository,
} from "typeorm";
import UserManager, {MySQLUser, SQLiteUser, MongoUser} from "../entities/User";
import {
    MySQLPunto,
    MySQLCard,
    MySQLPuntoPlayer,
} from "../entities/Game/MySQLGame";
import {
    SQLitePunto,
    SQLiteCard,
    SQLitePuntoPlayer,
} from "../entities/Game/SQLiteGame";
import MongoPunto from "../entities/Game/MongoGame";
import {Neogma, RelationshipPropertiesI} from "neogma";
import Result, {ResultStatus} from "./Result";
import Neo4jManager, {Neo4jUser, NeogmaCardInstance} from "./Neo4jManager";
import Board, {WinType} from "../game/Board";
import Card from "../game/Card";
import Player from "../game/Player";
import GameManager from "../entities/Game";

const MySqlDataSource = new DataSource({
    name: "mysqlConnection",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "root",
    database: "punto",
    entities: [MySQLUser, MySQLPunto, MySQLCard, MySQLPuntoPlayer],
    synchronize: true,
});

const SQLiteDataSource = new DataSource({
    name: "sqliteConnection",
    type: "sqlite",
    database: process.cwd() + "/punto.sqlite",
    entities: [SQLiteUser, SQLitePunto, SQLiteCard, SQLitePuntoPlayer],
    synchronize: true,
});

const MongoDataSource = new DataSource({
    name: "mongoConnection",
    type: "mongodb",
    host: "localhost",
    port: 27017,
    database: "punto",
    entities: [MongoUser, MongoPunto],
    synchronize: true,
});

const NeogmaConnection = new Neogma({
    url: "bolt://localhost:7687",
    username: "neo4j",
    password: "password",
});

class DBWrapper {
    /**
     * Instance of DBWrapper
     * @type {DBWrapper}
     */
    private static _instance: DBWrapper;

    /**
     * Enum to specify which database to use
     * @type {DBType}
     */
    private _dbToUse: DBType = [];
    /**
     * Retrive the type of connection used. If `All`, all connections are used
     * @type {string[]}
     */
    public get dbToUse(): DBType {
        return this._dbToUse;
    }

    /**
     * Connection to the MySQL database, undefined if not initialized
     * @type {DataSource}
     */
    private _MySqlConnection?: DataSource = undefined;
    /**
     * Connection to the MySQL database, undefined if not initialized
     * @type {DataSource}
     */
    public get MySqlConnection(): DataSource | undefined {
        return this._MySqlConnection;
    }

    /**
     * Connection to the SQLite database, undefined if not initialized
     * @type {DataSource}
     */
    private _SqliteConnection?: DataSource = undefined;
    /**
     * Connection to the SQLite database, undefined if not initialized
     * @type {DataSource}
     */
    public get SqliteConnection(): DataSource | undefined {
        return this._SqliteConnection;
    }

    /**
     * Connection to the MongoDB database, undefined if not initialized
     * @type {DataSource}
     */
    private _MongoConnection?: DataSource = undefined;
    /**
     * Connection to the MongoDB database, undefined if not initialized
     * @type {DataSource}
     */
    public get MongoConnection(): DataSource | undefined {
        return this._MongoConnection;
    }

    /**
     * Connection to the Neo4j database, undefined if not initialized
     * @type {Neogma}
     */
    private _Neo4jConnection?: Neogma = undefined;
    /**
     * Connection to the Neo4j database, undefined if not initialized
     * @type {Neogma}
     */
    public get Neo4jConnection(): Neogma | undefined {
        return this._Neo4jConnection;
    }

    /**
     * Constructor of DBWrapper
     */
    private constructor() {}

    /**
     * Get the instance of DBWrapper
     */
    public static getInstance(): DBWrapper {
        if (!DBWrapper._instance) {
            DBWrapper._instance = new DBWrapper();
        }

        return DBWrapper._instance;
    }

    /**
     * Initialize the connection to the MySQL database
     * @returns {Promise<boolean>} `true` if the connection is initialized, `false` otherwise
     */
    private async initMySql(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (
                this._MySqlConnection === undefined ||
                !this._MySqlConnection.isInitialized
            ) {
                MySqlDataSource.initialize()
                    .then(() => {
                        this._MySqlConnection = MySqlDataSource;
                        resolve(true);
                    })
                    .catch((error) => {
                        console.log(error);
                        reject(false);
                    });
            } else if (
                this._MySqlConnection !== undefined &&
                this._MySqlConnection.isInitialized
            ) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    /**
     * Initialize the connection to the SQLite database
     * @returns {Promise<boolean>} `true` if the connection is initialized, `false` otherwise
     */
    private async initSQLite(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (
                this._SqliteConnection === undefined ||
                !this._SqliteConnection.isInitialized
            ) {
                SQLiteDataSource.initialize()
                    .then(() => {
                        this._SqliteConnection = SQLiteDataSource;
                        resolve(true);
                    })
                    .catch((error) => {
                        console.log(error);
                        reject(false);
                    });
            } else if (
                this._SqliteConnection !== undefined &&
                this._SqliteConnection.isInitialized
            ) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    /**
     * Initialize the connection to the MongoDB database
     * @returns {Promise<boolean>} `true` if the connection is initialized, `false` otherwise
     */
    private async initMongo(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (
                this._MongoConnection === undefined ||
                !this._MongoConnection.isInitialized
            ) {
                MongoDataSource.initialize()
                    .then(() => {
                        this._MongoConnection = MongoDataSource;
                        resolve(true);
                    })
                    .catch((error) => {
                        console.log(error);
                        reject(false);
                    });
            } else if (
                this._MongoConnection !== undefined &&
                this._MongoConnection.isInitialized
            ) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    private async initNeo4j(): Promise<boolean> {
        return new Promise((resolve) => {
            if (this._Neo4jConnection === undefined) {
                this._Neo4jConnection = NeogmaConnection;
            }

            resolve(true);
        });
    }

    /**
     * Retrieve the list of database connections to use
     * @returns {DataSource[]} List of database connections to use
     */
    private retrieveDBConnections(): DataSource[] {
        const dbConnections: DataSource[] = [];

        if (this._dbToUse === "All") {
            if (this._MySqlConnection) {
                dbConnections.push(this._MySqlConnection);
            }
            if (this._SqliteConnection) {
                dbConnections.push(this._SqliteConnection);
            }
            if (this._MongoConnection) {
                dbConnections.push(this._MongoConnection);
            }
        } else {
            if (this._MySqlConnection && this._dbToUse.includes(DBList.MySql)) {
                dbConnections.push(this._MySqlConnection);
            }

            if (
                this._SqliteConnection &&
                this._dbToUse.includes(DBList.SQLite)
            ) {
                dbConnections.push(this._SqliteConnection);
            }

            if (this._MongoConnection && this._dbToUse.includes(DBList.Mongo)) {
                dbConnections.push(this._MongoConnection);
            }
        }

        return dbConnections;
    }

    /**
     * Retrieve the repository of the entity
     * @param {EntityTarget<Entity>} entity The entity to retrieve the repository
     * @param {DataSource} dataSource The database to use. If not specified, all connections are used. If specified, only the specified connection is used
     * @returns {Repository<Entity> | MongoRepository<Entity> | undefined} The repository of the entity, `undefined` if the entity is not present in the database
     * @throws {Error} If the entity is present in multiple connections and the connection is not specified
     */
    public retrieveRepository<Entity extends ObjectLiteral>(
        entity: EntityTarget<Entity>,
        dataSource?: DataSource,
    ): Repository<Entity> | MongoRepository<Entity> | undefined {
        let repository: Repository<Entity> | undefined = undefined;

        if (dataSource) {
            if (dataSource.hasMetadata(entity)) {
                if (dataSource === this._MongoConnection) {
                    repository = dataSource.getMongoRepository(entity);
                } else {
                    repository = dataSource.getRepository(entity);
                }
            } else {
                repository = undefined;
            }
        } else {
            this.retrieveDBConnections().forEach((dbConnection) => {
                if (dbConnection.hasMetadata(entity)) {
                    if (!repository) {
                        if (dbConnection === this._MongoConnection) {
                            repository =
                                dbConnection.getMongoRepository(entity);
                        } else {
                            repository = dbConnection.getRepository(entity);
                        }
                    } else {
                        throw new Error(
                            "The entity is present in multiple connections. Please specify the connection to use.",
                        );
                    }
                }
            });
        }

        return repository;
    }

    /**
     * Add a database to the list of database to use
     * @param {DBType} dbsToAdd The database to add to the list of database to use
     */
    private addToDbToUse(dbsToAdd: DBType) {
        if (this._dbToUse === "All") {
            return;
        }

        if (dbsToAdd === "All") {
            this._dbToUse = dbsToAdd;
            return;
        }

        for (let i = 0; i < dbsToAdd.length; i++) {
            const db = dbsToAdd[i];

            if (!this._dbToUse.includes(db)) {
                this._dbToUse.push(db);
            }
        }

        // Check if dbToUse contains all the databases in DBList
        if (containsAllEnumValues(DBList, this._dbToUse)) {
            this._dbToUse = "All";
        }
    }

    /**
     * Remove a database from the list of database to use
     * @param {DBList} dbToRemove The database to remove from the list of database to use
     */
    private removeFromDbToUse(dbToRemove: DBList) {
        if (this._dbToUse === "All") {
            this._dbToUse = getAllEnumValues(DBList);
        }

        if (this._dbToUse.includes(dbToRemove)) {
            this._dbToUse = this._dbToUse.filter((db) => db !== dbToRemove);
        }
    }

    /**
     * Initialize the connection to the database
     * @param {DBType} dbToUse List of database to use. If dbToUse is not specified or is `All`, all connections are initialized
     * @returns {Promise<boolean>} `true` if the connection is initialized, `false` otherwise
     *
     * @example
     * ```typescript
     * const dbWrapper = DBWrapper.getInstance();
     *
     * // Initialize only the MySQL connection to the database
     * await dbWrapper.init([DBList.MySql]);
     *
     * // Initialize the MySQL and MongoDB connections to the database
     * await dbWrapper.init([DBList.MySql, DBList.Mongo]);
     *
     * // Initialize all connections to the database
     * await dbWrapper.init(); // or dbWrapper.init("All");
     * ```
     */
    public async init(dbToUse: DBType = "All"): Promise<boolean> {
        if (dbToUse === "All") {
            this._dbToUse = dbToUse;
        } else {
            this.addToDbToUse(dbToUse);
        }

        let initResult = true;

        if (dbToUse === "All") {
            await this.initMySql().catch(() => {
                initResult = false;
            });
            await this.initSQLite().catch(() => {
                initResult = false;
            });
            await this.initMongo().catch(() => {
                initResult = false;
            });
            await this.initNeo4j().catch(() => {
                initResult = false;
            });
        } else {
            if (initResult && dbToUse.includes(DBList.MySql)) {
                await this.initMySql().catch(() => {
                    initResult = false;
                });
            }

            if (initResult && dbToUse.includes(DBList.SQLite)) {
                await this.initSQLite().catch(() => {
                    initResult = false;
                });
            }

            if (initResult && dbToUse.includes(DBList.Mongo)) {
                await this.initMongo().catch(() => {
                    initResult = false;
                });
            }

            if (initResult && dbToUse.includes(DBList.Neo4j)) {
                await this.initNeo4j().catch(() => {
                    initResult = false;
                });
            }
        }

        return initResult;
    }

    /**
     * Close the connection to the database.
     * @param {DBType} dbToClose List of database to close. If dbToClose is not specified or is `All`, all connections are closed
     *
     * @example
     * ```typescript
     * const dbWrapper = DBWrapper.getInstance();
     *
     * // Close only the MySQL connection to the database
     * await dbWrapper.close([DBList.MySql]);
     *
     * // Close the MySQL and MongoDB connections to the database
     * await dbWrapper.close([DBList.MySql, DBList.Mongo]);
     *
     * // Close all connections to the database
     * await dbWrapper.close(); // or dbWrapper.close("All");
     * ```
     */
    public async close(dbToClose: DBType = "All"): Promise<void> {
        if (dbToClose === "All") {
            if (this._MySqlConnection) {
                await this._MySqlConnection
                    .destroy()
                    .then(() => {
                        // Remove the connection from the list of connections
                        this._MySqlConnection = undefined;

                        this.removeFromDbToUse(DBList.MySql);
                    })
                    .catch(() => {});
            }

            if (this._SqliteConnection) {
                await this._SqliteConnection
                    .destroy()
                    .then(() => {
                        // Remove the connection from the list of connections
                        this._SqliteConnection = undefined;

                        this.removeFromDbToUse(DBList.SQLite);
                    })
                    .catch(() => {});
            }

            if (this._MongoConnection) {
                await this._MongoConnection
                    .destroy()
                    .then(() => {
                        // Remove the connection from the list of connections
                        this._MongoConnection = undefined;

                        this.removeFromDbToUse(DBList.Mongo);
                    })
                    .catch(() => {});
            }

            if (this._Neo4jConnection) {
                await this._Neo4jConnection.driver
                    .close()
                    .then(() => {
                        // Remove the connection from the list of connections
                        this._Neo4jConnection = undefined;
                    })
                    .catch(() => {});
            }
        } else {
            if (dbToClose.includes(DBList.MySql)) {
                if (this._MySqlConnection) {
                    await this._MySqlConnection
                        .destroy()
                        .then(() => {
                            // Remove the connection from the list of connections
                            this._MySqlConnection = undefined;

                            this.removeFromDbToUse(DBList.MySql);
                        })
                        .catch(() => {});
                }
            }

            if (dbToClose.includes(DBList.SQLite)) {
                if (this._SqliteConnection) {
                    await this._SqliteConnection
                        .destroy()
                        .then(() => {
                            // Remove the connection from the list of connections
                            this._SqliteConnection = undefined;

                            this.removeFromDbToUse(DBList.SQLite);
                        })
                        .catch(() => {});
                }
            }

            if (dbToClose.includes(DBList.Mongo)) {
                if (this._MongoConnection) {
                    await this._MongoConnection
                        .destroy()
                        .then(() => {
                            // Remove the connection from the list of connections
                            this._MongoConnection = undefined;

                            this.removeFromDbToUse(DBList.Mongo);
                        })
                        .catch(() => {});
                }
            }

            if (dbToClose.includes(DBList.Mongo)) {
                if (this._Neo4jConnection) {
                    await this._Neo4jConnection.driver
                        .close()
                        .then(() => {
                            // Remove the connection from the list of connections
                            this._Neo4jConnection = undefined;
                        })
                        .catch(() => {});
                }
            }
        }
    }

    public async transfer(
        source: DBList,
        destination: DBList,
    ): Promise<Result> {
        let status: ResultStatus | null = null;
        let message: string | undefined;
        let data: unknown | undefined;
        let error: unknown | undefined;

        if (source === destination) {
            return new Result({
                status: ResultStatus.Fail,
                message: "Source and destination are the same",
            });
        }

        // Check if source is the only database to use
        if (
            this._dbToUse === "All" ||
            this._dbToUse.length !== 1 ||
            this._dbToUse[0] !== source
        ) {
            await this.close();
            await this.init([source]);
        }

        const reconstructedBoards: Board[] = [];

        if (source === DBList.Neo4j && this._Neo4jConnection) {
            const result = await Neo4jManager.findAll(this._Neo4jConnection);
            const {users, puntos, cards} = result;

            // Traitement des puntos
            for (const punto of puntos) {
                const playersRelation = await punto.findRelationships({
                    alias: "Player",
                });
                const cardsRelation = await punto.findRelationships({
                    alias: "Card",
                });

                const players: Player[] = [];
                const winners: Player[] = [];
                const losers: Player[] = [];

                // Traitement des relations avec les joueurs
                for (const playerRelation of playersRelation) {
                    const playerData = playerRelation.target as Neo4jUser;
                    const relationData =
                        playerRelation.relationship as RelationshipPropertiesI;

                    const player = Player.build(
                        playerData.name,
                        [],
                        null,
                        relationData.points as number,
                        false,
                        [],
                        0,
                    );

                    players.push(player);

                    if (relationData.status === "winner") {
                        winners.push(player);
                    } else {
                        losers.push(player);
                    }
                }

                const listCards: Card[] = [];

                // Traitement des relations avec les cartes
                for (const cardRelation of cardsRelation) {
                    // const cardData = cardRelation.target as Neo4jCard;
                    const cardData = cardRelation.target as NeogmaCardInstance;

                    const playersNameWhoPlayedTheCard =
                        await cardData.findRelationships({alias: "Player"});
                    const playerNameWhoPlayedTheCard =
                        playersNameWhoPlayedTheCard[0] as (typeof playersNameWhoPlayedTheCard)[0];

                    const playerWhoPlayedTheCard = players.find(
                        (player) =>
                            player.name ===
                            (playerNameWhoPlayedTheCard.target as Neo4jUser)
                                .name,
                    );

                    const card = Card.build(
                        cardData.color as string,
                        cardData.value as number,
                        cardData.x as number,
                        cardData.y as number,
                        cardData.playedTurn as number,
                        cardData.playedIn as number,
                        playerWhoPlayedTheCard,
                    );

                    listCards.push(card);
                }

                // Get the card with the highest playedTurn
                const lastTurnCard = listCards.reduce((prev, current) => {
                    return prev.playedTurn > current.playedTurn
                        ? prev
                        : current;
                });

                const lastTurn = lastTurnCard.playedTurn;

                let winType: WinType = WinType.None;

                switch (punto.winType) {
                    case "Win":
                        winType = WinType.Win;
                        break;
                    case "Draw":
                        winType = WinType.Draw;
                        break;
                    case "Drop":
                        winType = WinType.Drop;
                        break;
                    default:
                        winType = WinType.None;
                        break;
                }

                const board = Board.build(
                    listCards,
                    players,
                    lastTurn,
                    winType,
                    winners,
                    losers,
                );

                reconstructedBoards.push(board);
            }
        } else {
            const gameManager = new GameManager(this);

            const result = await gameManager.findAll();

            let data = undefined;

            switch (source) {
                case DBList.MySql:
                    data = result.mySqlRepo?.data;
                    break;
                case DBList.SQLite:
                    data = result.sqliteRepo?.data;
                    break;
                case DBList.Mongo:
                    data = result.mongoRepo?.data as MongoPunto[];
                    break;
                default:
                    break;
            }

            if (source === DBList.Mongo && data && Array.isArray(data)) {
                for (const puntoFromDB of data) {
                    const players: Player[] = [];
                    const winners: Player[] = [];
                    const losers: Player[] = [];

                    for (const playerFromDB of puntoFromDB.players) {
                        const player = Player.build(
                            playerFromDB.playerName,
                            [],
                            null,
                            playerFromDB.points,
                            false,
                            [],
                            0,
                        );

                        players.push(player);

                        if (playerFromDB.status === "winner") {
                            winners.push(player);
                        } else {
                            losers.push(player);
                        }
                    }

                    const cards: Card[] = [];

                    for (const cardFromDB of puntoFromDB.board) {
                        const playerWhoPlayedTheCard = players.find(
                            (player) => player.name === cardFromDB.playedBy,
                        );

                        const card = Card.build(
                            cardFromDB.color,
                            cardFromDB.value,
                            cardFromDB.x,
                            cardFromDB.y,
                            cardFromDB.playedTurn,
                            cardFromDB.playedIn,
                            playerWhoPlayedTheCard,
                        );

                        cards.push(card);
                    }

                    const lastTurnCard = cards.reduce((prev, current) => {
                        return prev.playedTurn > current.playedTurn
                            ? prev
                            : current;
                    });

                    const lastTurn = lastTurnCard.playedTurn;

                    let winType: WinType = WinType.None;

                    switch (puntoFromDB.winType) {
                        case "Win":
                            winType = WinType.Win;
                            break;
                        case "Draw":
                            winType = WinType.Draw;
                            break;
                        case "Drop":
                            winType = WinType.Drop;
                            break;
                        default:
                            winType = WinType.None;
                            break;
                    }

                    const board = Board.build(
                        cards,
                        players,
                        lastTurn,
                        winType,
                        winners,
                        losers,
                    );

                    reconstructedBoards.push(board);
                }
            } else if (data) {
                let puntosData = undefined;
                let playersData = undefined;
                let cardsData = undefined;

                const userManager = new UserManager(this, "");

                const users = await userManager.findAll();

                switch (source) {
                    case DBList.MySql:
                        data = data as {
                            mySqlPunto: MySQLPunto[];
                            mySqlPlayers: MySQLPuntoPlayer[];
                            mySqlCards: MySQLCard[];
                        };

                        puntosData = data.mySqlPunto as MySQLPunto[];
                        playersData = data.mySqlPlayers as MySQLPuntoPlayer[];
                        cardsData = data.mySqlCards as MySQLCard[];
                        break;
                    case DBList.SQLite:
                        data = data as {
                            sqlitePunto: SQLitePunto[];
                            sqlitePlayers: SQLitePuntoPlayer[];
                            sqliteCards: SQLiteCard[];
                        };

                        puntosData = data.sqlitePunto as SQLitePunto[];
                        playersData = data.sqlitePlayers as SQLitePuntoPlayer[];
                        cardsData = data.sqliteCards as SQLiteCard[];
                        break;
                    default:
                        break;
                }

                if (
                    puntosData &&
                    playersData &&
                    cardsData &&
                    Array.isArray(puntosData) &&
                    Array.isArray(playersData) &&
                    Array.isArray(cardsData)
                ) {
                    for (const puntoFromDB of puntosData) {
                        const players: Player[] = [];
                        const winners: Player[] = [];
                        const losers: Player[] = [];

                        for (const playerFromDB of playersData) {
                            let name = "";

                            if (users.mySqlRepo) {
                                const user = (
                                    users.mySqlRepo.data as MySQLUser[]
                                ).find(
                                    (user) =>
                                        user._id === playerFromDB.playerID,
                                );

                                if (user) {
                                    name = user.name;
                                }
                            } else if (users.sqliteRepo) {
                                const user = (
                                    users.sqliteRepo.data as SQLiteUser[]
                                ).find(
                                    (user) =>
                                        user._id === playerFromDB.playerID,
                                );

                                if (user) {
                                    name = user.name;
                                }
                            } else {
                                return new Result({
                                    status: ResultStatus.Fail,
                                    message: "No user data found",
                                });
                            }

                            if (playerFromDB.boardId === puntoFromDB._id) {
                                const player = Player.build(
                                    name,
                                    [],
                                    null,
                                    playerFromDB.points,
                                    false,
                                    [],
                                    0,
                                );

                                players.push(player);

                                if (playerFromDB.status === "winner") {
                                    winners.push(player);
                                } else {
                                    losers.push(player);
                                }
                            }
                        }

                        const cards: Card[] = [];

                        for (const cardFromDB of cardsData) {
                            if (cardFromDB.boardId === puntoFromDB._id) {
                                let name = "";

                                if (users.mySqlRepo) {
                                    const user = (
                                        users.mySqlRepo.data as MySQLUser[]
                                    ).find(
                                        (user) =>
                                            user._id === cardFromDB.playedBy,
                                    );

                                    if (user) {
                                        name = user.name;
                                    }
                                } else if (users.sqliteRepo) {
                                    const user = (
                                        users.sqliteRepo.data as SQLiteUser[]
                                    ).find(
                                        (user) =>
                                            user._id === cardFromDB.playedBy,
                                    );

                                    if (user) {
                                        name = user.name;
                                    }
                                } else {
                                    return new Result({
                                        status: ResultStatus.Fail,
                                        message: "No user data found",
                                    });
                                }

                                const playerWhoPlayedTheCard = players.find(
                                    (player) => player.name === name,
                                );

                                const card = Card.build(
                                    cardFromDB.color,
                                    cardFromDB.value,
                                    cardFromDB.x,
                                    cardFromDB.y,
                                    cardFromDB.playedTurn,
                                    cardFromDB.playedIn,
                                    playerWhoPlayedTheCard,
                                );

                                cards.push(card);
                            }
                        }

                        const lastTurnCard = cards.reduce((prev, current) => {
                            return prev.playedTurn > current.playedTurn
                                ? prev
                                : current;
                        });

                        const lastTurn = lastTurnCard.playedTurn;

                        let winType: WinType = WinType.None;

                        switch (puntoFromDB.winType) {
                            case "Win":
                                winType = WinType.Win;
                                break;
                            case "Draw":
                                winType = WinType.Draw;
                                break;
                            case "Drop":
                                winType = WinType.Drop;
                                break;
                            default:
                                winType = WinType.None;
                                break;
                        }

                        const board = Board.build(
                            cards,
                            players,
                            lastTurn,
                            winType,
                            winners,
                            losers,
                        );

                        reconstructedBoards.push(board);
                    }
                }
            } else {
                return new Result({
                    status: ResultStatus.Fail,
                    message: "No data found",
                });
            }
        }

        await this.close([source]);
        await this.init([destination]);

        for (const board of reconstructedBoards) {
            const players = board.players;

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
                        userExistsInMySQL ||
                        userExistsInSQLite ||
                        userExistsInMongo
                            ? await UserManager.build(player.name)
                            : new UserManager(this, player.name);

                    if (
                        userExistsInMySQL ||
                        userExistsInSQLite ||
                        userExistsInMongo
                    ) {
                        await user.rebuild();
                    }

                    const saveResultsUsers = await user.save();

                    const mySqlUserStatus = saveResultsUsers.mySqlRepo?.status;
                    const sqliteUserStatus =
                        saveResultsUsers.sqliteRepo?.status;
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

            const game = new GameManager(this);

            await game.buildEntities(board);

            const saveResultsGame = await game.save();

            // Save for Neo4j
            if (this.Neo4jConnection && this.dbToUse.includes(DBList.Neo4j)) {
                const neo4jManager = Neo4jManager.getInstance(
                    this.Neo4jConnection,
                );

                await neo4jManager.createIfNotExist(board);
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
                status = ResultStatus.Fail;
            }
            if (
                sqliteGameStatus !== undefined &&
                sqliteGameStatus !== ResultStatus.Success
            ) {
                console.error(saveResultsGame.sqliteRepo?.error);
                status = ResultStatus.Fail;
            }
            if (
                mongoGameStatus !== undefined &&
                mongoGameStatus !== ResultStatus.Success
            ) {
                console.error(saveResultsGame.mongoRepo?.error);
                status = ResultStatus.Fail;
            }
        }

        await this.close([destination]);

        if (!status) {
            status = ResultStatus.Success;
        }

        return new Result({
            status,
            message,
            data,
            error,
        });
    }
}

/**
 * Enum to specify which database to use
 */
enum DBList {
    MySql = "MySql",
    SQLite = "SQLite",
    Mongo = "Mongo",
    Neo4j = "Neo4j",
}

type DBType = "All" | DBList[];

export default DBWrapper;

export {DBWrapper, DBType, DBList};

function getAllEnumValues<E>(enumObj: {[s: string]: E}): E[] {
    return Object.keys(enumObj)
        .map((key) => enumObj[key as keyof typeof enumObj])
        .filter((value): value is E => typeof value === "string") as E[];
}

function containsAllEnumValues(
    enumToCheck: typeof DBList,
    arrayToCheck: DBList[],
): boolean {
    const allValues = getAllEnumValues(enumToCheck);
    return allValues.every((value) => arrayToCheck.includes(value as DBList));
}
