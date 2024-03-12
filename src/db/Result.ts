/**
 * Class representing a Result with various properties.
 */
class Result {
    /**
     * Unique identifier for the Result. Auto-generated if not specified.
     * @type {string}
     */
    public readonly id: string;

    /**
     * Represents the status of the Result, based on the ResultStatus enum.
     * @type {ResultStatus}
     */
    public readonly status: ResultStatus;

    /**
     * Optional message associated with the Result.
     * @type {string}
     */
    public readonly message?: string;

    /**
     * Optional data payload of the Result.
     * @type {unknown}
     */
    public readonly data?: unknown;

    /**
     * Optional error information of the Result.
     * @type {unknown}
     */
    public readonly error?: unknown;

    /**
     * Constructs a new Result instance.
     * @param {Object} params - Parameters for the result including id, status, message, data, and error.
     */
    constructor({
        id,
        status,
        message,
        data,
        error,
    }: {
        id?: string;
        status: ResultStatus;
        message?: string;
        data?: unknown;
        error?: unknown;
    }) {
        this.id = id ?? this.generateUUID();
        this.status = status;
        this.message = message;
        this.data = data;
        this.error = error;
    }

    /**
     * Generates a UUID.
     * @returns {string} - A new UUID string.
     */
    private generateUUID(): string {
        return crypto.randomUUID();
    }
}

/**
 * Enumeration for possible Result statuses.
 */
enum ResultStatus {
    /**
     * Indicates a successful Result.
     */
    Success,

    /**
     * Indicates a failed Result.
     */
    Fail,
}

export default Result;
export {Result, ResultStatus};
