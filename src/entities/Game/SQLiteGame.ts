import {Entity, PrimaryGeneratedColumn, Column, Index} from "typeorm";

@Entity({
    name: "puntos",
    orderBy: {
        winType: "ASC",
    },
})
class SQLitePunto {
    @PrimaryGeneratedColumn()
    _id!: number;

    @Column()
    @Index()
    winType: string;

    constructor(winType: string) {
        this.winType = winType;
    }
}

@Entity({
    name: "cards",
})
class SQLiteCard {
    @PrimaryGeneratedColumn()
    _id!: number;

    @Column()
    boardId!: number;

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

    @Column({
        nullable: true,
    })
    playedBy!: number;

    constructor(
        x: number,
        y: number,
        color: string,
        value: number,
        playedTurn: number,
        playedIn: number,
        playedBy?: number,
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

@Entity({
    name: "punto_players",
})
class SQLitePuntoPlayer {
    @PrimaryGeneratedColumn()
    _id!: number;

    @Column()
    @Index()
    playerID: number;

    @Column()
    @Index()
    boardId!: number;

    @Column()
    points: number;

    @Column()
    @Index()
    status: string;

    constructor(playerID: number, points: number, status: string) {
        this.playerID = playerID;
        this.points = points;
        this.status = status;
    }
}

export {SQLitePunto, SQLiteCard, SQLitePuntoPlayer};
