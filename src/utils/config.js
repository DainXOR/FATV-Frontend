/**
 * @param {string | undefined} value
 * @param {string} name
 * @returns {string}
 */
function requireEnv(value, name) {
    if (!value || value.length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

/**
 * @param {string | undefined} value
 * * @param {string} name
 * @returns {string | null}
 */
function optionalEnv(value, name) {
    if (!value || value.length === 0) {
        console.warn('Optional environment variable not set:', name);
    }

    return value || null;
}

export const config = {
    backendUrl: requireEnv(
        process.env.REACT_APP_BACKEND_URL,
        "REACT_APP_BACKEND_URL"
    ),
    apiHealthPath: requireEnv(
        process.env.REACT_APP_BACKEND_HEALTH_PATH,
        "REACT_APP_BACKEND_HEALTH_PATH"
    ),
    apiRouteVersionPath: requireEnv(
        process.env.REACT_APP_ROUTE_VERSION_PATH,
        "REACT_APP_ROUTE_VERSION_PATH"
    ),

    apiRouteVersion: optionalEnv(
        process.env.REACT_APP_FORCE_ROUTE_VERSION,
        "REACT_APP_FORCE_ROUTE_VERSION"
    )
};
