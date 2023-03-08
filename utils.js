import fs from 'fs/promises';

/**
 * 
 * @param {string} path 
 * @returns 
 */
export async function safeLoadJSON(path) {
    try {
        const content = await fs.readFile(new URL(path, import.meta.url));
        return JSON.parse(content);
    } catch (err) {
        console.error(`Failed to read json at path ${path}`, err)
        return {};
    }
}

/**
 * 
 * @param {number} t in ms 
 * @returns {Promise}
 */
export function sleep(t) {
    return new Promise((resolve) => setTimeout(resolve, t));
}

/**
 * Writes json to a given path
 * @param {Object} content 
 * @return {Promise}
 */
export async function writeJSON(content, path) {
    return fs.writeFile(new URL(path, import.meta.url), JSON.stringify(content));
}

export const logger = {
    info: (...args) => console.log(`INFO ${new Date().toISOString()}`, ...args),
    error: (...args) => console.error(`ERROR ${new Date().toISOString()}`, ...args),
}
