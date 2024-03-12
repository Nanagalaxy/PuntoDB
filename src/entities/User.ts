import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ObjectIdColumn,
    ObjectId,
    Index,
} from "typeorm";
import DBWrapper from "../db/DBWrapper";
import Result, {ResultStatus} from "../db/Result";
import BaseEntityManager from "./BaseEntityManager";

// ALTER TABLE users AUTO_INCREMENT = 0;
@Entity({
    name: "users",
    orderBy: {
        name: "ASC",
    },
})
class MySQLUser {
    @PrimaryGeneratedColumn()
    _id!: number;

    @Column()
    name: string;

    constructor(name: string = "") {
        this.name = name;
    }
}

// UPDATE sqlite_sequence SET seq = 0 WHERE name = users;
@Entity({
    name: "users",
    orderBy: {
        name: "ASC",
    },
})
class SQLiteUser {
    @PrimaryGeneratedColumn()
    _id!: number;

    @Column()
    name: string;

    constructor(name: string = "") {
        this.name = name;
    }
}

@Entity({
    name: "users",
    orderBy: {
        name: "ASC",
    },
})
class MongoUser {
    @ObjectIdColumn()
    _id!: ObjectId;

    @Column()
    @Index({unique: true})
    name: string;

    constructor(name: string = "") {
        this.name = name;
    }
}

class UserManager extends BaseEntityManager {
    /**
     * The MySQL entity used in this class. Replace {@link BaseEntityManager.mySqlEntity} with the specific MySQL entity for this class.
     * This is a protected member.
     * @protected
     * @type {MySQLUser}
     * @memberof UserManager
     */
    protected mySqlEntity?: MySQLUser;

    /**
     * The SQLite entity used in this class. Replace {@link BaseEntityManager.sqliteEntity} with the specific SQLite entity for this class.
     * This is a protected member.
     * @protected
     * @type {SQLiteUser}
     * @memberof UserManager
     */
    protected sqliteEntity?: SQLiteUser;

    /**
     * The MongoDB entity used in this class. Replace {@link BaseEntityManager.mongoEntity} with the specific MongoDB entity for this class.
     * This is a protected member.
     * @protected
     * @type {MongoUser}
     * @memberof UserManager
     */
    protected mongoEntity?: MongoUser;

    /**
     * Gets the name of the user.
     * @type {string | undefined}
     * @memberof UserManager
     */
    get name(): string | undefined {
        let name: string | undefined;

        if (this.mySqlEntity && this.mySqlEntity.name) {
            name = this.mySqlEntity.name;
        } else if (this.sqliteEntity && this.sqliteEntity.name) {
            name = this.sqliteEntity.name;
        } else if (this.mongoEntity && this.mongoEntity.name) {
            name = this.mongoEntity.name;
        }

        return name;
    }

    /**
     * Sets the name of the user for the existing entities.
     * @param {string} name The name of the user.
     * @memberof UserManager
     */
    set name(name: string) {
        if (this.mySqlEntity) {
            this.mySqlEntity.name = name;
        }
        if (this.sqliteEntity) {
            this.sqliteEntity.name = name;
        }
        if (this.mongoEntity) {
            this.mongoEntity.name = name;
        }
    }

    get mySqlId(): number | undefined {
        return this.mySqlEntity?._id;
    }
    get sqliteId(): number | undefined {
        return this.sqliteEntity?._id;
    }
    get mongoId(): ObjectId | undefined {
        return this.mongoEntity?._id;
    }

    /**
     * Creates an instance of UserManager.
     * @param {DBWrapper} dbWrapper The DBWrapper instance to be used in this class.
     * @param {string} name The name of the user to be used in this class.
     * @memberof UserManager
     */
    public constructor(dbWrapper: DBWrapper, name: string) {
        super(dbWrapper);

        UserManager.initRepositories();

        this.mySqlEntity = new MySQLUser(name);
        this.sqliteEntity = new SQLiteUser(name);
        this.mongoEntity = new MongoUser(name);
    }

    /**
     * Initializes the repositories for MySQL, SQLite, and MongoDB.
     * This method should be called before any other method in this class is invoked.
     * @protected
     * @static
     * @memberof UserManager
     */
    protected static initRepositories(): void {
        BaseEntityManager.initRepositories(MySQLUser, SQLiteUser, MongoUser);
    }

    /**
     * Builds a user from the database(s).
     *
     * @returns {Promise<UserManager>} The built user. It is the same as calling {@link UserManager.build} with the name of the user as the parameter.
     * @memberof UserManager
     * @throws {Error} If the name of the user is undefined.
     */
    public async build(): Promise<UserManager> {
        // return await UserManager.build(this.name);
        if (!this.name) {
            throw new Error(
                "Name is undefined, cannot build user. Please set the name before building the user or use the static build method.",
            );
        } else {
            return await UserManager.build(this.name);
        }
    }

    /**
     * Builds a user from the database(s).
     *
     * @param {string} name The name of the user to build.
     * @returns {Promise<UserManager>} The built user.
     * @memberof UserManager
     */
    public static async build(name: string): Promise<UserManager> {
        UserManager.initRepositories();

        const buildedUser = new UserManager(UserManager.dbWrapper, name);

        const usersFromDBs = await UserManager.find(name);

        const mySqlUserData = usersFromDBs.mySqlRepo?.data;
        const sqliteUserData = usersFromDBs.sqliteRepo?.data;
        const mongoUserData = usersFromDBs.mongoRepo?.data;

        if (
            mySqlUserData &&
            Array.isArray(mySqlUserData) &&
            mySqlUserData.length > 0
        ) {
            const mySqlUser = mySqlUserData[0];

            buildedUser.mySqlEntity = mySqlUser;
        }

        if (
            sqliteUserData &&
            Array.isArray(sqliteUserData) &&
            sqliteUserData.length > 0
        ) {
            const sqliteUser = sqliteUserData[0];

            buildedUser.sqliteEntity = sqliteUser;
        }

        if (
            mongoUserData &&
            Array.isArray(mongoUserData) &&
            mongoUserData.length > 0
        ) {
            const mongoUser = mongoUserData[0];

            buildedUser.mongoEntity = mongoUser;
        }

        return buildedUser;
    }

    /**
     * Rebuilds the user from the database(s).
     *
     * @returns {Promise<void>} A promise that resolves when the user is rebuilt.
     * @memberof UserManager
     * @throws {Error} If the name of the user is undefined.
     */
    public async rebuild(): Promise<void> {
        if (!this.name) {
            throw new Error(
                "Name is undefined, cannot rebuild user. Please set the name before rebuilding the user.",
            );
        }

        const usersFromDBs = await UserManager.find(this.name);

        const mySqlUserData = usersFromDBs.mySqlRepo?.data;
        const sqliteUserData = usersFromDBs.sqliteRepo?.data;
        const mongoUserData = usersFromDBs.mongoRepo?.data;

        if (
            mySqlUserData &&
            Array.isArray(mySqlUserData) &&
            mySqlUserData.length > 0
        ) {
            const mySqlUser = mySqlUserData[0];

            this.mySqlEntity = mySqlUser;
        } else {
            this.mySqlEntity = new MySQLUser(this.name);
        }

        if (
            sqliteUserData &&
            Array.isArray(sqliteUserData) &&
            sqliteUserData.length > 0
        ) {
            const sqliteUser = sqliteUserData[0];

            this.sqliteEntity = sqliteUser;
        } else {
            this.sqliteEntity = new SQLiteUser(this.name);
        }

        if (
            mongoUserData &&
            Array.isArray(mongoUserData) &&
            mongoUserData.length > 0
        ) {
            const mongoUser = mongoUserData[0];

            this.mongoEntity = mongoUser;
        } else {
            this.mongoEntity = new MongoUser(this.name);
        }
    }

    /**
     * Saves the user in the database(s).
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     *    neo4jResult?: Result;
     * }>} The results of the save operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the saved object.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     * @memberof UserManager
     */
    public async save(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
        neo4jResult?: Result;
    }> {
        UserManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
            neo4jResult?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
            neo4jResult: undefined,
        };

        if (this.mySqlEntity) {
            await UserManager.mySqlRepo
                ?.save(this.mySqlEntity)
                .then((result) => {
                    results.mySqlRepo = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    results.mySqlRepo = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });
        }

        if (this.sqliteEntity) {
            await UserManager.sqliteRepo
                ?.save(this.sqliteEntity)
                .then((result) => {
                    results.sqliteRepo = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    results.sqliteRepo = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });
        }

        if (this.mongoEntity) {
            await UserManager.mongoRepo
                ?.save(this.mongoEntity)
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
     * Removes the user from the database(s).
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     *    neo4jResult?: Result;
     * }>} The results of the remove operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the removed object.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public async remove(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
        neo4jResult?: Result;
    }> {
        UserManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
            neo4jResult?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
            neo4jResult: undefined,
        };

        if (this.mySqlEntity) {
            await UserManager.mySqlRepo
                ?.remove(this.mySqlEntity)
                .then((result) => {
                    results.mySqlRepo = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    results.mySqlRepo = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });
        }

        if (this.sqliteEntity) {
            await UserManager.sqliteRepo
                ?.remove(this.sqliteEntity)
                .then((result) => {
                    results.sqliteRepo = new Result({
                        status: result
                            ? ResultStatus.Success
                            : ResultStatus.Fail,
                        data: result,
                    });
                })
                .catch((error) => {
                    results.sqliteRepo = new Result({
                        status: ResultStatus.Fail,
                        error,
                    });
                });
        }

        if (this.mongoEntity) {
            await UserManager.mongoRepo
                ?.remove(this.mongoEntity)
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
     * Removes all users from the database(s). It is the same as calling {@link UserManager.removeAll}.
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     *    neo4jResult?: Result;
     * }>} The results of the remove operation. For each repository:
     * - If the operation was successful, the status will be `Success` and there is no `data`.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public async removeAll(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
        neo4jResult?: Result;
    }> {
        return UserManager.removeAll();
    }

    /**
     * Removes all users from the database(s).
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     *    neo4jResult?: Result;
     * }>} The results of the remove operation. For each repository:
     * - If the operation was successful, the status will be `Success` and there is no `data`.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public static async removeAll(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
        neo4jResult?: Result;
    }> {
        UserManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
            neo4jResult?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
            neo4jResult: undefined,
        };

        await UserManager.mySqlRepo
            ?.clear()
            .then(() => {
                results.mySqlRepo = new Result({
                    status: ResultStatus.Success,
                });
            })
            .catch((error) => {
                results.mySqlRepo = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await UserManager.sqliteRepo
            ?.clear()
            .then(() => {
                results.sqliteRepo = new Result({
                    status: ResultStatus.Success,
                });
            })
            .catch((error) => {
                results.sqliteRepo = new Result({
                    status: ResultStatus.Fail,
                    error,
                });
            });

        await UserManager.mongoRepo
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

        return results;
    }

    /**
     * Finds the user in the database(s) by its name.
     * This method is the same as calling {@link UserManager.find} with the name of the user as the parameter.
     *
     * @example
     * const user = new UserManager(dbWrapper, "John");
     *
     * const results = await user.find();
     *
     * // is the same as
     *
     * const results = await UserManager.find("John");
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     *    neo4jResult?: Result;
     * }>} The results of the find operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the found object.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public async find(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
        neo4jResult?: Result;
    }> {
        UserManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
            neo4jResult?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
            neo4jResult: undefined,
        };

        await UserManager.mySqlRepo
            ?.find({
                where: {
                    name: this.name,
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

        await UserManager.sqliteRepo
            ?.find({
                where: {
                    name: this.name,
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

        await UserManager.mongoRepo
            ?.find({
                where: {
                    name: this.name,
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
     * Finds a user in the database(s) by its name.
     *
     * @param {string} name The name of the user to find.
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     *    neo4jResult?: Result;
     * }>} The results of the find operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the found object.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public static async find(name: string): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
        neo4jResult?: Result;
    }> {
        UserManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
            neo4jResult?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
            neo4jResult: undefined,
        };

        await UserManager.mySqlRepo
            ?.find({
                where: {
                    name,
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

        await UserManager.sqliteRepo
            ?.find({
                where: {
                    name,
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

        await UserManager.mongoRepo
            ?.find({
                where: {
                    name,
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
     * Finds all users in the database(s). It is the same as calling {@link UserManager.findAll}.
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     *    neo4jResult?: Result;
     * }>} The results of the find operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the found objects.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public async findAll(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
        neo4jResult?: Result;
    }> {
        return UserManager.findAll();
    }

    /**
     * Finds all users in the database(s).
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     *    neo4jResult?: Result;
     * }>} The results of the find operation. For each repository:
     * - If the operation was successful, the status will be `Success` and the `data` will be the found objects.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public static async findAll(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
        neo4jResult?: Result;
    }> {
        UserManager.initRepositories();

        const results: {
            mySqlRepo?: Result;
            sqliteRepo?: Result;
            mongoRepo?: Result;
            neo4jResult?: Result;
        } = {
            mySqlRepo: undefined,
            sqliteRepo: undefined,
            mongoRepo: undefined,
            neo4jResult: undefined,
        };

        await UserManager.mySqlRepo
            ?.find()
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

        await UserManager.sqliteRepo
            ?.find()
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

        await UserManager.mongoRepo
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

        return results;
    }
}

export default UserManager;
export {MySQLUser, SQLiteUser, MongoUser};
