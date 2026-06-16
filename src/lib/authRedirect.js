const basePath = () => {
    const base = import.meta.env.BASE_URL || '/';
    return base.endsWith('/') ? base : `${base}/`;
};

/** Full redirect URL for Supabase auth emails (includes Vite base path). */
export function getAuthRedirectUrl(hash = 'login') {
    const fragment = hash.replace(/^#/, '');
    return `${window.location.origin}${basePath()}#${fragment}`;
}

/** Parse Supabase auth callback params from hash and query string. */
export function parseAuthCallback() {
    let hashRaw = window.location.hash.slice(1);
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

export function isRecoveryFromUrl() {
    const hash = window.location.hash;
    const { type, code } = parseAuthCallback();
    return (
        hash.includes('reset-password') ||
        type === 'recovery' ||
        (hash.includes('access_token') && hash.includes('type=recovery')) ||
        (Boolean(code) && hash.includes('reset-password'))
    );
}

export function isRecoveryCallback() {
    return isRecoveryFromUrl();
}

export function isSignupConfirmCallback() {
    const { type } = parseAuthCallback();
    const hash = window.location.hash;
    return type === 'signup' || type === 'email' || type === 'invite' || hash.includes('confirm-email');
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

/** Remove ?code= from URL but keep hash route (and base path). */
export function sanitizeAuthUrl(hash = 'login') {
    const fragment = hash.replace(/^#/, '');
    window.history.replaceState(null, '', `${window.location.origin}${basePath()}#${fragment}`);
}

/** @deprecated use sanitizeAuthUrl */
export function clearAuthParamsFromUrl(hash = 'login') {
    sanitizeAuthUrl(hash);
}

let inflightCallback = null;

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
        sanitizeAuthUrl(isRecoveryFromUrl() ? 'reset-password' : 'login');
        return { kind: callback.type === 'recovery' ? 'recovery' : callback.type };
    }

    if (callback.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(callback.code);
        if (error) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { error: error.message, kind: 'pkce' };
            }
        }
        sanitizeAuthUrl(isRecoveryFromUrl() ? 'reset-password' : 'confirm-email');
        return { kind: isRecoveryFromUrl() ? 'recovery' : 'session' };
    }

    if (callback.access_token) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            sanitizeAuthUrl(isRecoveryFromUrl() ? 'reset-password' : 'login');
            return { kind: isRecoveryFromUrl() ? 'recovery' : 'session' };
        }
    }

    return { kind: null };
}

/** Exchange token_hash / PKCE code from email links (single-flight). */
export function completeAuthCallback(supabase) {
    if (!inflightCallback) {
        inflightCallback = doCompleteAuthCallback(supabase).finally(() => {
            inflightCallback = null;
        });
    }
    return inflightCallback;
}
