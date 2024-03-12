import {
    EntityTarget,
    MongoRepository,
    ObjectLiteral,
    Repository,
} from "typeorm";
import DBWrapper from "../db/DBWrapper";
import Result from "../db/Result";

abstract class BaseEntityManager {
    /**
     * Instance of DBWrapper.
     * This is a protected and static member of BaseEntityManager.
     * For more information, refer to DBWrapper documentation.
     * @protected
     * @static
     * @type {DBWrapper}
     * @memberof BaseEntityManager
     * @see DBWrapper
     */
    protected static dbWrapper: DBWrapper;

    /**
     * Repository for MySQL. It gets initialized when {@link BaseEntityManager.initRepositories} is invoked with the MySQL entity.
     * To obtain the repository, use the {@link DBWrapper.retrieveRepository} method.
     * @protected
     * @static
     * @type {Repository<ObjectLiteral>}
     * @memberof BaseEntityManager
     */
    protected static mySqlRepo?: Repository<ObjectLiteral>;

    /**
     * Repository for SQLite. It gets initialized when {@link BaseEntityManager.initRepositories} is called with the SQLite entity.
     * To retrieve the repository, use the {@link DBWrapper.retrieveRepository} method.
     * @protected
     * @static
     * @type {Repository<ObjectLiteral>}
     * @memberof BaseEntityManager
     */
    protected static sqliteRepo?: Repository<ObjectLiteral>;

    /**
     * Repository for MongoDB. This is initialized upon calling {@link BaseEntityManager.initRepositories} with the MongoDB entity.
     * The repository can be retrieved using the {@link DBWrapper.retrieveRepository} method.
     * @protected
     * @static
     * @type {Repository<ObjectLiteral>}
     * @memberof BaseEntityManager
     */
    protected static mongoRepo?: Repository<ObjectLiteral>;

    /**
     * The MySQL entity used in this class. Replace with the specific MySQL entity of the child class.
     * This is a protected and abstract member.
     * @protected
     * @abstract
     * @type {ObjectLiteral}
     * @memberof BaseEntityManager
     */
    protected abstract mySqlEntity?: ObjectLiteral;

    /**
     * The SQLite entity used in this class. Replace with the specific SQLite entity of the child class.
     * This is a protected and abstract member.
     * @protected
     * @abstract
     * @type {ObjectLiteral}
     * @memberof BaseEntityManager
     */
    protected abstract sqliteEntity?: ObjectLiteral;

    /**
     * The MongoDB entity used in this class. Replace with the specific MongoDB entity of the child class.
     * This is a protected and abstract member.
     * @protected
     * @abstract
     * @type {ObjectLiteral}
     * @memberof BaseEntityManager
     */
    protected abstract mongoEntity?: ObjectLiteral;

    /**
     * Creates an instance of BaseEntityManager.
     * @param {DBWrapper} dbWrapper The DBWrapper instance to be used in this class.
     * @memberof BaseEntityManager
     */
    public constructor(dbWrapper: DBWrapper) {
        BaseEntityManager.dbWrapper = dbWrapper;
    }

    /**
     * Initializes the repositories for MySQL, SQLite, and MongoDB.
     * This method should be called before any other method in this class is invoked.
     * @param {EntityTarget<ObjectLiteral>} MySQLEntity The MySQL entity to be used in this class.
     * @param {EntityTarget<ObjectLiteral>} SQLiteEntity The SQLite entity to be used in this class.
     * @param {EntityTarget<ObjectLiteral>} MongoEntity The MongoDB entity to be used in this class.
     * @protected
     * @static
     * @memberof BaseEntityManager
     */
    protected static initRepositories(
        MySQLEntity: EntityTarget<ObjectLiteral>,
        SQLiteEntity: EntityTarget<ObjectLiteral>,
        MongoEntity: EntityTarget<ObjectLiteral>,
    ): void {
        if (!BaseEntityManager.dbWrapper) {
            BaseEntityManager.dbWrapper = DBWrapper.getInstance();
        }

        BaseEntityManager.mySqlRepo =
            BaseEntityManager.dbWrapper.retrieveRepository(
                MySQLEntity,
                BaseEntityManager.dbWrapper.MySqlConnection,
            );
        BaseEntityManager.sqliteRepo =
            BaseEntityManager.dbWrapper.retrieveRepository(
                SQLiteEntity,
                BaseEntityManager.dbWrapper.SqliteConnection,
            );
        BaseEntityManager.mongoRepo =
            BaseEntityManager.dbWrapper.retrieveRepository(
                MongoEntity,
                BaseEntityManager.dbWrapper.MongoConnection,
            ) as MongoRepository<ObjectLiteral>;
    }

    /**
     * Builds the entity from the database(s).
     * Each child class also implements a static `build` method that can be used to directly build the entity.
     *
     * @returns {Promise<BaseEntityManager>} The built entity.
     */
    public abstract build(): Promise<BaseEntityManager>;

    /**
     * Rebuilds the entity from the database(s).
     *
     * @returns {Promise<void>} A promise that resolves when the entity has been rebuilt.
     */
    public abstract rebuild(): Promise<void>;

    /**
     * Saves the entity to the database(s).
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
    public abstract save(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }>;

    /**
     * Removes the entity from the database(s).
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
    public abstract remove(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }>;

    /**
     * Removes all entities from the database(s).
     * Each child class also implements a static `removeAll` method that can be used to remove all entities.
     *
     * @returns {Promise<{
     *    mySqlRepo?: Result;
     *    sqliteRepo?: Result;
     *    mongoRepo?: Result;
     * }>} The results of the remove operation. For each repository:
     * - If the operation was successful, the status will be `Success` and there is no `data`.
     * - If the operation was unsuccessful, the status will be `Fail` and the `error` will be the error that occurred.
     * - If `undefined` is returned, it means that the repository was not initialized and the operation was not performed.
     */
    public abstract removeAll(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }>;

    /**
     * Finds the entity in the database(s) using the specified options defined in the child class.
     * Each child class also implements a static `find` method that can be used to find the entity by passing it the options defined in the child class.
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
    public abstract find(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }>;

    /**
     * Finds all entities in the database(s).
     * Each child class also implements a static `findAll` method that can be used to find all entities.
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
    public abstract findAll(): Promise<{
        mySqlRepo?: Result;
        sqliteRepo?: Result;
        mongoRepo?: Result;
    }>;
}

export default BaseEntityManager;
export {BaseEntityManager};
