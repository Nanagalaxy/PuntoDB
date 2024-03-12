import {testAssert} from "./Tests.test";
import DBWrapper, {DBList} from "../db/DBWrapper";
import User from "../entities/User";
import {ResultStatus} from "../db/Result";

export async function testAllDB(n: number = 1) {
    await testDBMongoConnection(n);
    await testDBMySqlConnection(n);
    await testDBSQLiteConnection(n);
    await testDBMongoUser(n);
    await testDBMySqlUser(n);
    await testDBSqliteUser(n);
    await testDBUsers(n);
}

async function testDBUsers(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const dbWrapper = DBWrapper.getInstance();

        await dbWrapper.init();

        const user = new User(dbWrapper, "John Doe");

        const saveResults1 = await user.save();

        const nameMySql = (saveResults1.mySqlRepo?.data as {name: string}).name;
        const nameSqlite = (saveResults1.sqliteRepo?.data as {name: string})
            .name;
        const nameMongo = (saveResults1.mongoRepo?.data as {name: string}).name;

        testAssert(
            "testDBUsersSave",
            saveResults1.mySqlRepo?.status === ResultStatus.Success &&
                nameMySql === "John Doe" &&
                saveResults1.sqliteRepo?.status === ResultStatus.Success &&
                nameSqlite === "John Doe" &&
                saveResults1.mongoRepo?.status === ResultStatus.Success &&
                nameMongo === "John Doe",
            "User not saved",
        );

        user.name = "John Doe updated";

        const saveResults2 = await user.save();

        const nameMySqlUpdated = (
            saveResults2.mySqlRepo?.data as {name: string}
        ).name;
        const nameSqliteUpdated = (
            saveResults2.sqliteRepo?.data as {name: string}
        ).name;
        const nameMongoUpdated = (
            saveResults2.mongoRepo?.data as {name: string}
        ).name;

        testAssert(
            "testDBUsersUpdate",
            saveResults2.mySqlRepo?.status === ResultStatus.Success &&
                nameMySqlUpdated === "John Doe updated" &&
                saveResults2.sqliteRepo?.status === ResultStatus.Success &&
                nameSqliteUpdated === "John Doe updated" &&
                saveResults2.mongoRepo?.status === ResultStatus.Success &&
                nameMongoUpdated === "John Doe updated",
            "User not saved",
        );

        const removeResults = await user.remove();

        testAssert(
            "testDBUsersDelete",
            removeResults.mySqlRepo?.status === ResultStatus.Success &&
                removeResults.sqliteRepo?.status === ResultStatus.Success &&
                removeResults.mongoRepo?.status === ResultStatus.Success,
            "User not deleted",
        );

        await dbWrapper.close();
    }
}

async function testDBSqliteUser(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const dbWrapper = DBWrapper.getInstance();

        await dbWrapper.init([DBList.SQLite]);

        const user = new User(dbWrapper, "John Doe");

        const saveResults1 = await user.save();

        const nameSqlite = (saveResults1.sqliteRepo?.data as {name: string})
            .name;

        testAssert(
            "testDBUsersSave",
            saveResults1.sqliteRepo?.status === ResultStatus.Success &&
                nameSqlite === "John Doe",
            "User not saved",
        );

        user.name = "John Doe updated";

        const saveResults2 = await user.save();

        const nameSqliteUpdated = (
            saveResults2.sqliteRepo?.data as {name: string}
        ).name;

        testAssert(
            "testDBUsersUpdate",
            saveResults2.sqliteRepo?.status === ResultStatus.Success &&
                nameSqliteUpdated === "John Doe updated",
            "User not saved",
        );

        const removeResults = await user.remove();

        testAssert(
            "testDBUsersDelete",
            removeResults.sqliteRepo?.status === ResultStatus.Success,
            "User not deleted",
        );

        await dbWrapper.close();
    }
}

async function testDBMySqlUser(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const dbWrapper = DBWrapper.getInstance();

        await dbWrapper.init([DBList.MySql]);

        const user = new User(dbWrapper, "John Doe");

        const saveResults1 = await user.save();

        const nameMySql = (saveResults1.mySqlRepo?.data as {name: string}).name;

        testAssert(
            "testDBUsersSave",
            saveResults1.mySqlRepo?.status === ResultStatus.Success &&
                nameMySql === "John Doe",
            "User not saved",
        );

        user.name = "John Doe updated";

        const saveResults2 = await user.save();

        const nameMySqlUpdated = (
            saveResults2.mySqlRepo?.data as {name: string}
        ).name;

        testAssert(
            "testDBUsersUpdate",
            saveResults2.mySqlRepo?.status === ResultStatus.Success &&
                nameMySqlUpdated === "John Doe updated",
            "User not saved",
        );

        const removeResults = await user.remove();

        testAssert(
            "testDBUsersDelete",
            removeResults.mySqlRepo?.status === ResultStatus.Success,
            "User not deleted",
        );

        await dbWrapper.close();
    }
}

async function testDBMongoUser(n: number = 1) {
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const dbWrapper = DBWrapper.getInstance();

        await dbWrapper.init([DBList.Mongo]);

        const user = new User(dbWrapper, "John Doe");

        const saveResults1 = await user.save();

        const nameMongo = (saveResults1.mongoRepo?.data as {name: string}).name;

        testAssert(
            "testDBUsersSave",
            saveResults1.mongoRepo?.status === ResultStatus.Success &&
                nameMongo === "John Doe",
            "User not saved",
        );

        user.name = "John Doe updated";

        const saveResults2 = await user.save();

        const nameMongoUpdated = (
            saveResults2.mongoRepo?.data as {name: string}
        ).name;

        testAssert(
            "testDBUsersUpdate",
            saveResults2.mongoRepo?.status === ResultStatus.Success &&
                nameMongoUpdated === "John Doe updated",
            "User not saved",
        );

        const removeResults = await user.remove();

        testAssert(
            "testDBUsersDelete",
            removeResults.mongoRepo?.status === ResultStatus.Success,
            "User not deleted",
        );

        await dbWrapper.close();
    }
}

async function testDBSQLiteConnection(n: number = 1) {
    n = 1;
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const dbWrapper = DBWrapper.getInstance();

        testAssert(
            "testInitDBSQLite",
            await dbWrapper.init([DBList.SQLite]),
            "Initialization of DB failed",
        );

        testAssert(
            "testConnectionDBSQLite",
            dbWrapper.SqliteConnection?.isInitialized ? true : false,
            "Connection to DB is not initialized",
        );

        await dbWrapper.close();
    }
}

async function testDBMySqlConnection(n: number = 1) {
    n = 1;
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const dbWrapper = DBWrapper.getInstance();

        testAssert(
            "testInitDBMySql",
            await dbWrapper.init([DBList.MySql]),
            "Initialization of DB failed",
        );

        testAssert(
            "testConnectionDBMySql",
            dbWrapper.MySqlConnection?.isInitialized ? true : false,
            "Connection to DB is not initialized",
        );

        await dbWrapper.close();
    }
}

async function testDBMongoConnection(n: number = 1) {
    n = 1;
    for (let nbrTest = 0; nbrTest < n; nbrTest++) {
        const dbWrapper = DBWrapper.getInstance();

        testAssert(
            "testInitDBMongo",
            await dbWrapper.init([DBList.Mongo]),
            "Initialization of DB failed",
        );

        testAssert(
            "testConnectionDBMongo",
            dbWrapper.MongoConnection?.isInitialized ? true : false,
            "Connection to DB is not initialized",
        );

        await dbWrapper.close();
    }
}
