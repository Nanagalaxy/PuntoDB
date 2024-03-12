import {AssertionError, ok} from "assert";
import {testAllPunto} from "./Game.test";
import {testAllDB} from "./DB.test";

const testGame = true;
const testDB = true;

let nbrTestPassed = 0;

export function testAssert(id: string, condition: boolean, message: string) {
    try {
        ok(condition, message);

        // console.log("Test passed");

        nbrTestPassed++;
    } catch (error) {
        const assertError = error as AssertionError;

        console.log("Number of tests passed: ", nbrTestPassed);

        console.error(
            "Test failed: ",
            id,
            "\n",
            assertError.message,
            "\n",
            "Expected: ",
            assertError.expected,
            "\n",
            "Actual: ",
            assertError.actual,
            "\n",
            "With operator: ",
            assertError.operator,
        );

        process.exit(1);
    }
}

(async () => {
    if (testGame) testAllPunto();

    if (testDB) await testAllDB();

    console.log("Number of tests passed: ", nbrTestPassed);
})();
