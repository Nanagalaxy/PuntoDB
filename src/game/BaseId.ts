/**
 * The base class for the ID management.
 */
abstract class BaseId {
    /**
     * The ID of the object.
     * @type {string}
     */
    private _id: string;

    public get id(): string {
        return this._id;
    }

    public set id(id: string) {
        this._id = id;
    }

    /**
     * The constructor for the BaseId class. It initializes a unique ID for the instance.
     */
    constructor() {
        this._id = this.generateId();
    }

    /**
     * Generates a unique identifier combining a UUID and a timestamp.
     * @returns {string} The generated unique identifier.
     */
    private generateId(): string {
        const uuid: string = this.returnUUID();
        // const timestamp: number = this.returnTimestamp();
        // return `${uuid}-${timestamp}`;
        return uuid;
    }

    protected regenerateId(): void {
        this._id = this.generateId();
    }

    /**
     * Creates a Universally Unique Identifier (UUID).
     * @returns {string} A UUID string.
     */
    private returnUUID(): string {
        return crypto.randomUUID();
    }

    /**
     * Gets the current time as a timestamp.
     * @returns {number} The current time in milliseconds since the Unix epoch.
     */
    private returnTimestamp(): number {
        return new Date().getTime();
    }

    /**
     * Displays the ID of the object in the console.
     */
    public displayId(): void {
        console.log(`${this.constructor.name} ID: ${this._id}`);
    }

    /**
     * Abstract method to list the IDs of the object's children.
     */
    abstract listIds(): void;
}

export default BaseId;
