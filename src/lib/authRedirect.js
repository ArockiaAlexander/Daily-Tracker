/** Parse Supabase auth callback params from hash and query string. */
export function parseAuthCallback() {
    let hashRaw = window.location.hash.slice(1);
    // Handle `#reset-password&access_token=...` or `#confirm-email&...`
    const hashRoutePrefixes = ['reset-password', 'confirm-email', 'login', 'signup'];
    for (const prefix of hashRoutePrefixes) {
        if (hashRaw === prefix) break;
        if (hashRaw.startsWith(`${prefix}&`)) {
            hashRaw = hashRaw.slice(prefix.length + 1);
            break;
        }
    }

    const hashParams = new URLSearchParams(hashRaw.includes('=') ? hashRaw : '');
    const searchParams = new URLSearchParams(window.location.search);

    const get = (key) => hashParams.get(key) || searchParams.get(key);

    return {
        type: get('type'),
        token_hash: get('token_hash'),
        access_token: get('access_token'),
        code: get('code'),
        error: get('error') || get('error_description'),
    };
}

export function isRecoveryCallback() {
    const { type, access_token } = parseAuthCallback();
    const hash = window.location.hash;
    return type === 'recovery' || (hash.includes('access_token') && hash.includes('type=recovery'));
}

export function isSignupConfirmCallback() {
    const { type } = parseAuthCallback();
    return type === 'signup' || type === 'email' || type === 'invite';
}

export function isAuthCallbackUrl() {
    const { token_hash, access_token, code, type, error } = parseAuthCallback();
    const hash = window.location.hash;
    return Boolean(
        token_hash ||
        access_token ||
        code ||
        type ||
        error ||
        hash.includes('access_token') ||
        hash.includes('type=recovery') ||
        hash.includes('type=signup')
    );
}

export function clearAuthParamsFromUrl() {
    const path = window.location.pathname;
    window.history.replaceState(null, '', `${path}#login`);
}

/** Exchange token_hash / PKCE code from email links before getSession(). */
export async function completeAuthCallback(supabase) {
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
        clearAuthParamsFromUrl();
        return { kind: callback.type };
    }

    if (callback.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(callback.code);
        if (error) return { error: error.message, kind: 'pkce' };
        clearAuthParamsFromUrl();
        return { kind: isRecoveryCallback() ? 'recovery' : 'session' };
    }

    return { kind: null };
}
