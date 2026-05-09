export = precinct;
/**
 * Finds the list of dependencies for the given file
 *
 * @param {string|object} content - File's content or AST
 * @param {object} [options]
 * @param {string} [options.type] - The type of content being passed in. Useful if you want to use a non-JS detective
 * @param {Record<string, any>} [options.walker] - Options to pass to node-source-walk
 * @return {string[]}
 */
declare function precinct(content: string | object, options?: {
    type?: string | undefined;
    walker?: Record<string, any> | undefined;
}): string[];
declare namespace precinct {
    /**
     * Returns the dependencies for the given file path
     *
     * @param {string} filename
     * @param {object} [options]
     * @param {boolean} [options.includeCore=true] - Whether or not to include core modules in the dependency list
     * @param {object} [options.fileSystem=undefined] - An alternative fs implementation to use for reading the file path.
     * @param {Record<string, any>} [options.walker] - Options to pass to node-source-walk
     * @return {string[]}
     */
    function paperwork(filename: string, options?: {
        includeCore?: boolean | undefined;
        fileSystem?: object | undefined;
        walker?: Record<string, any> | undefined;
    }): string[];
}
