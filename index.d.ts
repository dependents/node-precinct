export = precinct;
/**
 * Finds the list of dependencies for the given file
 *
 * @param {String|Object} content - File's content or AST
 * @param {Object} [options]
 * @param {String} [options.type] - The type of content being passed in. Useful if you want to use a non-JS detective
 * @param {Record<string, any>} [options.walker] - Options to pass to node-source-walk
 * @return {String[]}
 */
declare function precinct(content: string | Object, options?: {
    type?: string | undefined;
    walker?: Record<string, any> | undefined;
}): string[];
declare namespace precinct {
    /**
     * Returns the dependencies for the given file path
     *
     * @param {String} filename
     * @param {Object} [options]
     * @param {Boolean} [options.includeCore=true] - Whether or not to include core modules in the dependency list
     * @param {Object} [options.fileSystem=undefined] - An alternative fs implementation to use for reading the file path.
     * @param {Record<string, any>} [options.walker] - Options to pass to node-source-walk
     * @return {String[]}
     */
    function paperwork(filename: string, options?: {
        includeCore?: boolean | undefined;
        fileSystem?: Object | undefined;
        walker?: Record<string, any> | undefined;
    }): string[];
}
