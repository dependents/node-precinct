export default precinct;
export type PrecinctOptions = Partial<Record<string, Record<string, any>>> & {
    type?: string;
    walker?: Record<string, any>;
};
export type PaperworkOptions = PrecinctOptions & {
    includeCore?: boolean;
    fileSystem?: {
        readFileSync: (path: string, encoding: "utf8") => string;
    };
};
/**
 * @typedef {Partial<Record<string, Record<string, any>>> & {
 *   type?: string,
 *   walker?: Record<string, any>
 * }} PrecinctOptions
 */
/**
 * @typedef {PrecinctOptions & {
 *   includeCore?: boolean,
 *   fileSystem?: { readFileSync: (path: string, encoding: 'utf8') => string }
 * }} PaperworkOptions
 */
/**
 * Finds the list of dependencies for the given file
 *
 * @param {string | Record<string, any>} content - File's content or AST
 * @param {PrecinctOptions} [options]
 * @return {string[]}
 */
declare function precinct(content: string | Record<string, any>, options?: PrecinctOptions): string[];
declare namespace precinct {
    /**
     * Returns the dependencies for the given file path
     *
     * @param {string} filename
     * @param {PaperworkOptions} [options]
     * @return {string[]}
     */
    function paperwork(filename: string, options?: PaperworkOptions): string[];
}
