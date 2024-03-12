import {Entity, Column, ObjectIdColumn, ObjectId, Index} from "typeorm";

@Entity({
    name: "puntos",
    orderBy: {
        winType: "ASC",
    },
})
class MongoPunto {
    @ObjectIdColumn()
    _id!: ObjectId;

    @Column(() => MongoCard)
    board: MongoCard[];

    @Column(() => MongoPuntoPlayer)
    players: MongoPuntoPlayer[];

    @Column()
    @Index()
    winType: string;

    constructor(
        board: MongoCard[],
        players: MongoPuntoPlayer[],
        winType: string,
    ) {
        this.board = board;
        this.players = players;
        this.winType = winType;
    }
}

class MongoCard {
    @Column()
    x: number;

    @Column()
    y: number;

    @Column()
    color: string;

    @Column()
    value: number;

    @Column()
    playedTurn: number;

    @Column()
    playedIn: number;

    // @ObjectIdColumn({
    //     nullable: true,
    // })
    // @Column(() => ObjectId)
    // playedBy!: ObjectId;

    @Column({
        nullable: true,
    })
    playedBy!: string;

    constructor(
        x: number,
        y: number,
        color: string,
        value: number,
        playedTurn: number,
        playedIn: number,
        // playedBy?: ObjectId,
        playedBy?: string,
    ) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.value = value;
        this.playedTurn = playedTurn;
        this.playedIn = playedIn;
        // this.playedBy = playedBy;
        if (playedBy) {
            this.playedBy = playedBy;
        }
    }
}

class MongoPuntoPlayer {
    // @ObjectIdColumn()
    // @Column(() => ObjectId)
    // @Index()
    // playerID: ObjectId;

    @Column()
    playerName: string;

    @Column()
    points: number;

    @Column()
    @Index()
    status: string;

    constructor(
        /*playerID: ObjectId,*/ name: string,
        points: number,
        status: string,
    ) {
        // this.playerID = playerID;
        this.playerName = name;
        this.points = points;
        this.status = status;
    }
}

export default MongoPunto;
export {MongoCard, MongoPuntoPlayer};
