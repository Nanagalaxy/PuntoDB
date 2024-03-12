import {
    NeogmaModel,
    Neo4jSupportedProperties,
    NeogmaInstance,
    Neogma,
    ModelFactory,
} from "neogma";
import Board from "../game/Board";
import Card from "../game/Card";

class Neo4jManager {
    private static _neogma: Neogma;
    public static get neogma(): Neogma {
        return Neo4jManager._neogma;
    }

    private _neo4jUser: Neo4jUser[] = [];
    public get neo4jUser(): Neo4jUser[] {
        return this._neo4jUser;
    }

    private _neo4jPunto?: Neo4jPunto;
    public get neo4jPunto(): Neo4jPunto | undefined {
        return this._neo4jPunto;
    }

    private _neo4jCard: Neo4jCard[] = [];
    public get neo4jCard(): Neo4jCard[] {
        return this._neo4jCard;
    }

    private static _instance: Neo4jManager;
    public static get instance(): Neo4jManager {
        return Neo4jManager._instance;
    }

    private constructor(neogma: Neogma) {
        Neo4jManager._neogma = neogma;
    }

    public static getInstance(neogma: Neogma): Neo4jManager {
        if (!Neo4jManager._instance) {
            Neo4jManager._instance = new Neo4jManager(neogma);
        }

        return Neo4jManager._instance;
    }

    public async createIfNotExist(board: Board) {
        const players = board.players;
        const cards = board.cards;

        Neo4jUser.initModel(Neo4jManager.neogma);
        Neo4jPunto.initModel(Neo4jManager.neogma);
        Neo4jCard.initModel(Neo4jManager.neogma);

        Neo4jUser.initModel(Neo4jManager.neogma);
        Neo4jPunto.initModel(Neo4jManager.neogma);
        Neo4jCard.initModel(Neo4jManager.neogma);

        // Create nodes
        for (const player of players) {
            const neo4jUser = new Neo4jUser(player.name);
            await neo4jUser.createIfNotExist();
            this._neo4jUser.push(neo4jUser);
        }

        const neo4jPunto = new Neo4jPunto(board.id, board.winType);
        await neo4jPunto.createIfNotExist();
        this._neo4jPunto = neo4jPunto;

        for (const card of cards) {
            const neo4jCard = new Neo4jCard(card);
            await neo4jCard.createIfNotExist();
            this._neo4jCard.push(neo4jCard);
        }

        // Create relationships
        for (const player of players) {
            const neo4jUser = this._neo4jUser.find(
                (neo4jUser) => neo4jUser.name === player.name,
            );

            if (!neo4jUser) {
                throw new Error("Neo4jUser is undefined");
                // continue;
            }

            await neo4jUser.user?.relateTo({
                alias: "Punto",
                where: {
                    _id: neo4jPunto.id,
                },
                properties: {
                    points: player.points,
                    status: board.winners.includes(player) ? "winner" : "loser",
                },
            });
        }

        for (const card of cards) {
            const neo4jCard = this._neo4jCard.find(
                (neo4jCard) => neo4jCard.id === card.id,
            );

            if (!neo4jCard) {
                throw new Error("Neo4jCard is undefined");
                // continue;
            }

            await neo4jCard.card?.relateTo({
                alias: "Punto",
                where: {
                    _id: neo4jPunto.id,
                },
            });

            const neo4jUser = this._neo4jUser.find(
                (neo4jUser) => neo4jUser.name === card.playedBy?.name,
            );

            if (!neo4jUser) {
                throw new Error("Neo4jUser is undefined");
                // continue;
            }

            await neo4jCard.card?.relateTo({
                alias: "Player",
                where: {
                    name: neo4jUser.name,
                },
            });
        }
    }

    public async save(): Promise<void> {
        for (const neo4jUser of this.neo4jUser) {
            await neo4jUser.save();
        }

        await this.neo4jPunto?.save();

        for (const neo4jCard of this.neo4jCard) {
            await neo4jCard.save();
        }
    }

    public async delete(): Promise<void> {
        for (const neo4jUser of this.neo4jUser) {
            await neo4jUser.delete();
        }

        await this.neo4jPunto?.delete();

        for (const neo4jCard of this.neo4jCard) {
            await neo4jCard.delete();
        }
    }

    public async deleteAll(): Promise<void> {
        await Neo4jUser.deleteAll();
        await Neo4jPunto.deleteAll();
        await Neo4jCard.deleteAll();
    }

    public async findAll(): Promise<{
        users: NeogmaUserInstance[];
        puntos: NeogmaPuntoInstance[];
        cards: NeogmaCardInstance[];
    }> {
        return await Neo4jManager.findAll();
    }

    public static async findAll(neogma?: Neogma): Promise<{
        users: NeogmaUserInstance[];
        puntos: NeogmaPuntoInstance[];
        cards: NeogmaCardInstance[];
    }> {
        if (!Neo4jManager.neogma) {
            if (!neogma) {
                throw new Error("Neogma is undefined");
            }

            Neo4jManager._neogma = neogma;
        }

        Neo4jUser.initModel(Neo4jManager.neogma);
        Neo4jPunto.initModel(Neo4jManager.neogma);
        Neo4jCard.initModel(Neo4jManager.neogma);

        Neo4jUser.initModel(Neo4jManager.neogma);
        Neo4jPunto.initModel(Neo4jManager.neogma);
        Neo4jCard.initModel(Neo4jManager.neogma);
        
        const users = await Neo4jUser.findAll();
        const puntos = await Neo4jPunto.findAll();
        const cards = await Neo4jCard.findAll();

        return {
            users,
            puntos,
            cards,
        };
    }

    public async retrieveAll(): Promise<Board[]> {
        const boards: Board[] = [];

        return boards;
    }
}

type NeogmaUserModel = NeogmaModel<
    Neo4jSupportedProperties,
    {Punto: unknown; Card: unknown}
>;
type NeogmaUserInstance = NeogmaInstance<
    Neo4jSupportedProperties,
    {Punto: unknown; Card: unknown}
>;

class Neo4jUser {
    private static _model: NeogmaUserModel;
    public static get model(): NeogmaUserModel {
        return Neo4jUser._model;
    }

    private _name: string;
    public get name(): string {
        return this._name;
    }

    private _user?: NeogmaUserInstance;
    public get user(): NeogmaUserInstance | undefined {
        return this._user;
    }
    public set user(value: NeogmaUserInstance) {
        this._user = value;
    }

    constructor(name: string) {
        this._name = name;
    }

    public static initModel(neogma: Neogma): void {
        if (!neogma) {
            throw new Error("Neogma is undefined");
        }

        Neo4jUser._model = ModelFactory(
            {
                label: "User",
                schema: {
                    name: {
                        type: "string",
                        required: true,
                    },
                },
                primaryKeyField: "name",
                relationships: {
                    Punto: {
                        model: Neo4jPunto.model,
                        direction: "out",
                        name: "PLAYED_IN",
                        properties: {
                            points: {
                                property: "points",
                                schema: {type: "number"},
                            },
                            status: {
                                property: "status",
                                schema: {type: "string"},
                            },
                        },
                    },
                    Card: {
                        model: Neo4jCard.model,
                        direction: "in",
                        name: "PLAYED_BY",
                    },
                },
            },
            neogma,
        );
    }

    public async createIfNotExist(): Promise<NeogmaUserInstance> {
        this._user = await Neo4jUser._model.createOne(
            {
                name: this._name,
            },
            {
                merge: true,
            },
        );

        return this._user;
    }

    public async save(): Promise<NeogmaUserInstance | undefined> {
        // this._user = await this._user?.save();
        this.createIfNotExist();

        return this._user;
    }

    /**
     * Deletes the user from the database.
     * @returns {Promise<NeogmaUserInstance | undefined>} The deleted user.
     */
    public async delete(): Promise<NeogmaUserInstance | undefined> {
        const nbr = await this._user?.delete({detach: true});

        return nbr === 1 ? this._user : undefined;
    }

    public static async deleteAll(): Promise<void> {
        await Neo4jUser._model.delete({where: {}, detach: true});
    }

    /**
     * Finds the user in the database with the specified name in this object.
     * @param {boolean} createIfNotExist If true, the user will be created if it does not exist.
     * @returns {Promise<NeogmaUserInstance | undefined>} The found user.
     *
     * @example
     * // Assume that the user "John" does not exist in the database.
     * const user = new Neo4jUser(neogma, "John");
     *
     * const findedUser = await user.find(); // Returns undefined;
     *
     * await user.createIfNotExist();
     *
     * const findedUser = await user.find(); // Returns the created user;
     *
     * // OR (assuming that the user "John" does not exist in the database)
     *
     * const findedUser = await user.find(true); // Returns the created user;
     */
    public async find(
        createIfNotExist: boolean = false,
    ): Promise<NeogmaUserInstance | undefined> {
        const findedUser = await Neo4jUser._model.findOne({
            where: {
                name: this._name,
            },
        });

        if (findedUser) {
            this._user = findedUser;
        } else if (createIfNotExist) {
            this._user = await this.createIfNotExist();
        }

        return this._user;
    }

    public static async find(
        name: string,
    ): Promise<NeogmaUserInstance | undefined> {
        const findedUser = await Neo4jUser._model.findOne({
            where: {
                name: name,
            },
        });

        if (findedUser) {
            return findedUser;
        } else {
            return undefined;
        }
    }

    public static async findAll(): Promise<NeogmaUserInstance[]> {
        const findedUsers = await Neo4jUser._model.findMany();

        return findedUsers;
    }
}

type NeogmaPuntoModel = NeogmaModel<
    Neo4jSupportedProperties,
    {Player: unknown; Card: unknown}
>;
type NeogmaPuntoInstance = NeogmaInstance<
    Neo4jSupportedProperties,
    {Player: unknown; Card: unknown}
>;
class Neo4jPunto {
    private static _model: NeogmaPuntoModel;

    public static get model(): NeogmaPuntoModel {
        return Neo4jPunto._model;
    }

    private _punto?: NeogmaPuntoInstance;
    public get punto(): NeogmaPuntoInstance | undefined {
        return this._punto;
    }

    private _id: string;
    public get id(): string {
        return this._id;
    }

    private _winType: string;
    public get winType(): string {
        return this._winType;
    }

    constructor(id: string, winType: string) {
        this._id = id;
        this._winType = winType;
    }

    public static initModel(neogma: Neogma): void {
        if (!neogma) {
            throw new Error("Neogma is undefined");
        }

        Neo4jPunto._model = ModelFactory(
            {
                label: "Punto",
                schema: {
                    _id: {
                        type: "string",
                        required: true,
                    },
                    winType: {
                        type: "string",
                        required: true,
                    },
                },
                primaryKeyField: "_id",
                relationships: {
                    Player: {
                        model: Neo4jUser.model,
                        direction: "in",
                        name: "PLAYED_IN",
                        properties: {
                            points: {
                                property: "points",
                                schema: {type: "number"},
                            },
                            status: {
                                property: "status",
                                schema: {type: "string"},
                            },
                        },
                    },
                    Card: {
                        model: Neo4jCard.model,
                        direction: "out",
                        name: "CONTAINS_CARD",
                    },
                },
            },
            neogma,
        );
    }

    public async createIfNotExist(): Promise<NeogmaPuntoInstance> {
        this._punto = await Neo4jPunto._model.createOne(
            {
                _id: this._id,
                winType: this._winType,
            },
            {
                merge: true,
            },
        );

        return this._punto;
    }

    public async save(): Promise<NeogmaPuntoInstance | undefined> {
        this._punto = await this._punto?.save();

        return this._punto;
    }

    public async delete(): Promise<NeogmaPuntoInstance | undefined> {
        const nbr = await this._punto?.delete({detach: true});

        return nbr === 1 ? this._punto : undefined;
    }

    public static async deleteAll(): Promise<void> {
        await Neo4jPunto._model.delete({where: {}, detach: true});
    }

    public static async find(
        id: string,
    ): Promise<NeogmaPuntoInstance | undefined> {
        const findedPunto = await Neo4jPunto._model.findOne({
            where: {
                _id: id,
            },
        });

        if (findedPunto) {
            return findedPunto;
        } else {
            return undefined;
        }
    }

    public static async findAll(): Promise<NeogmaPuntoInstance[]> {
        const findedPuntos = await Neo4jPunto._model.findMany();

        return findedPuntos;
    }
}

type NeogmaCardModel = NeogmaModel<
    Neo4jSupportedProperties,
    {Punto: unknown; Player: unknown}
>;
type NeogmaCardInstance = NeogmaInstance<
    Neo4jSupportedProperties,
    {Punto: unknown; Player: unknown}
>;

class Neo4jCard {
    private static _model: NeogmaCardModel;
    public static get model(): NeogmaCardModel {
        return Neo4jCard._model;
    }

    private _card?: NeogmaCardInstance;
    public get card(): NeogmaCardInstance | undefined {
        return this._card;
    }

    private _id: string;
    public get id(): string {
        return this._id;
    }

    private _x: number;
    public get x(): number {
        return this._x;
    }

    private _y: number;
    public get y(): number {
        return this._y;
    }

    private _color: string;
    public get color(): string {
        return this._color;
    }

    private _value: number;
    public get value(): number {
        return this._value;
    }

    private _playedTurn: number;
    public get playedTurn(): number {
        return this._playedTurn;
    }

    private _playedIn: number;
    public get playedIn(): number {
        return this._playedIn;
    }

    constructor(card: Card) {
        this._id = card.id;
        this._x = card.x;
        this._y = card.y;
        this._color = card.color;
        this._value = card.value;
        this._playedTurn = card.playedTurn;
        this._playedIn = card.playedIn;
    }

    public static initModel(neogma: Neogma): void {
        if (!neogma) {
            throw new Error("Neogma is undefined");
        }

        Neo4jCard._model = ModelFactory(
            {
                label: "Card",
                schema: {
                    _id: {
                        type: "string",
                        required: true,
                    },
                    x: {
                        type: "number",
                        required: true,
                    },
                    y: {
                        type: "number",
                        required: true,
                    },
                    color: {
                        type: "string",
                        required: true,
                    },
                    value: {
                        type: "number",
                        required: true,
                    },
                    playedTurn: {
                        type: "number",
                        required: true,
                    },
                    playedIn: {
                        type: "number",
                        required: true,
                    },
                },
                primaryKeyField: "_id",
                relationships: {
                    Punto: {
                        model: Neo4jPunto.model,
                        direction: "in",
                        name: "CONTAINS_CARD",
                    },
                    Player: {
                        model: Neo4jUser.model,
                        direction: "out",
                        name: "PLAYED_BY",
                    },
                },
            },
            neogma,
        );
    }

    public async createIfNotExist(): Promise<NeogmaCardInstance> {
        this._card = await Neo4jCard._model.createOne(
            {
                _id: this._id,
                x: this._x,
                y: this._y,
                color: this._color,
                value: this._value,
                playedTurn: this._playedTurn,
                playedIn: this._playedIn,
            },
            {
                merge: true,
            },
        );

        return this._card;
    }

    public async save(): Promise<NeogmaCardInstance | undefined> {
        this._card = await this._card?.save();

        return this._card;
    }

    public async delete(): Promise<NeogmaCardInstance | undefined> {
        const nbr = await this._card?.delete({detach: true});

        return nbr === 1 ? this._card : undefined;
    }

    public static async deleteAll(): Promise<void> {
        await Neo4jCard._model.delete({where: {}, detach: true});
    }

    public static async find(
        id: string,
    ): Promise<NeogmaCardInstance | undefined> {
        const findedCard = await Neo4jCard._model.findOne({
            where: {
                _id: id,
            },
        });

        if (findedCard) {
            return findedCard;
        } else {
            return undefined;
        }
    }

    public static async findAll(): Promise<NeogmaCardInstance[]> {
        const findedCards = await Neo4jCard._model.findMany();

        return findedCards;
    }
}

export default Neo4jManager;
export {
    Neo4jUser,
    Neo4jPunto,
    Neo4jCard,
    NeogmaUserInstance,
    NeogmaUserModel,
    NeogmaPuntoInstance,
    NeogmaPuntoModel,
    NeogmaCardInstance,
    NeogmaCardModel,
};
