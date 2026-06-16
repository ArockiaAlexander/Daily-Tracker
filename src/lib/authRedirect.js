const basePath = () => {
    const base = import.meta.env.BASE_URL || '/';
    return base.endsWith('/') ? base : `${base}/`;
};

/** Full redirect URL for Supabase auth emails (includes Vite base path). */
export function getAuthRedirectUrl(hash = 'login') {
    const fragment = hash.replace(/^#/, '');
    return `${window.location.origin}${basePath()}#${fragment}`;
}

/** Parse Supabase auth callback params from hash (implicit flow). */
export function parseAuthCallback() {
    let hashRaw = window.location.hash.slice(1);
    const hashRoutePrefixes = ['reset-password', 'login', 'signup'];
    for (const prefix of hashRoutePrefixes) {
        if (hashRaw === prefix) break;
        if (hashRaw.startsWith(`${prefix}&`)) {
            hashRaw = hashRaw.slice(prefix.length + 1);
            break;
        }
    }

    const hashParams = new URLSearchParams(hashRaw.includes('=') ? hashRaw : '');
    const get = (key) => hashParams.get(key);

    return {
        type: get('type'),
        token_hash: get('token_hash'),
        access_token: get('access_token'),
        error: get('error') || get('error_description'),
    };
}

export function isRecoveryFromUrl() {
    const hash = window.location.hash;
    const { type } = parseAuthCallback();
    return type === 'recovery' || (hash.includes('access_token') && hash.includes('type=recovery'));
}

export function isRecoveryCallback() {
    return isRecoveryFromUrl();
}

export function isAuthCallbackUrl() {
    const { token_hash, access_token, type, error } = parseAuthCallback();
    const hash = window.location.hash;
    return Boolean(
        token_hash ||
        access_token ||
        type ||
        error ||
        hash.includes('access_token')
    );
}

export function sanitizeAuthUrl(hash = 'login') {
    const fragment = hash.replace(/^#/, '');
    window.history.replaceState(null, '', `${window.location.origin}${basePath()}#${fragment}`);
}

export function clearAuthParamsFromUrl(hash = 'login') {
    sanitizeAuthUrl(hash);
}

let inflightCallback = null;

/** Let Supabase parse implicit hash tokens — no PKCE code exchange. */
async function doCompleteAuthCallback(supabase) {
    const callback = parseAuthCallback();

    if (callback.error) {
        return { error: callback.error, kind: callback.type || 'auth' };
    }

    if (callback.token_hash && callback.type) {
        const { error } = await supabase.auth.verifyOtp({
            type: callback.type,
            token_hash: callback.token_hash,
        });
        if (error) return { error: error.message, kind: callback.type };
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return { error: error.message, kind: null };

    if (session) {
        const recovery = isRecoveryFromUrl() || callback.type === 'recovery';
        sanitizeAuthUrl(recovery ? 'reset-password' : 'login');
        return { kind: recovery ? 'recovery' : 'session' };
    }

    return { kind: null };
}

export function completeAuthCallback(supabase) {
    if (!inflightCallback) {
        inflightCallback = doCompleteAuthCallback(supabase).finally(() => {
            inflightCallback = null;
        });
    }
    return inflightCallback;
}
