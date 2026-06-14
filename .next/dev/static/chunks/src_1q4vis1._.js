(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "agenciesApi",
    ()=>agenciesApi,
    "apiRequest",
    ()=>apiRequest,
    "authApi",
    ()=>authApi,
    "cleanersApi",
    ()=>cleanersApi,
    "customersApi",
    ()=>customersApi,
    "dashboardApi",
    ()=>dashboardApi,
    "getAuthToken",
    ()=>getAuthToken,
    "invoicesApi",
    ()=>invoicesApi,
    "serviceRecordsApi",
    ()=>serviceRecordsApi,
    "servicesApi",
    ()=>servicesApi,
    "setAuthToken",
    ()=>setAuthToken,
    "settingsApi",
    ()=>settingsApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use client";
const API_BASE = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL || '/api';
let authToken = null;
function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}
function getAuthToken() {
    if (authToken) return authToken;
    authToken = localStorage.getItem('token');
    return authToken;
}
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include'
    });
    if (!response.ok) {
        const error = await response.json().catch(()=>({
                error: 'Request failed'
            }));
        throw new Error(error.error || error.message || 'Request failed');
    }
    return response.json();
}
const authApi = {
    login: (email, password)=>apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password
            })
        }),
    register: (email, password, role)=>apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
                role
            })
        }),
    logout: ()=>apiRequest('/auth/logout', {
            method: 'POST'
        }),
    me: ()=>apiRequest('/auth/me'),
    updatePassword: (currentPassword, newPassword)=>apiRequest('/auth/password', {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        })
};
const cleanersApi = {
    getAll: (params)=>{
        const query = new URLSearchParams();
        if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
        if (params?.search) query.set('search', params.search);
        return apiRequest(`/cleaners?${query}`);
    },
    getById: (id)=>apiRequest(`/cleaners/${id}`),
    create: (data)=>apiRequest('/cleaners', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id, data)=>apiRequest(`/cleaners/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id)=>apiRequest(`/cleaners/${id}`, {
            method: 'DELETE'
        }),
    toggleActive: (id)=>apiRequest(`/cleaners/${id}/toggle-active`, {
            method: 'PATCH'
        })
};
const customersApi = {
    getAll: (params)=>{
        const query = new URLSearchParams();
        if (params?.search) query.set('search', params.search);
        return apiRequest(`/customers?${query}`);
    },
    getById: (id)=>apiRequest(`/customers/${id}`),
    create: (data)=>apiRequest('/customers', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id, data)=>apiRequest(`/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id)=>apiRequest(`/customers/${id}`, {
            method: 'DELETE'
        })
};
const agenciesApi = {
    getAll: (params)=>{
        const query = new URLSearchParams();
        if (params?.search) query.set('search', params.search);
        return apiRequest(`/agencies?${query}`);
    },
    getById: (id)=>apiRequest(`/agencies/${id}`),
    create: (data)=>apiRequest('/agencies', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id, data)=>apiRequest(`/agencies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id)=>apiRequest(`/agencies/${id}`, {
            method: 'DELETE'
        })
};
const servicesApi = {
    getAll: (params)=>{
        const query = new URLSearchParams();
        if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
        if (params?.search) query.set('search', params.search);
        return apiRequest(`/services?${query}`);
    },
    getById: (id)=>apiRequest(`/services/${id}`),
    create: (data)=>apiRequest('/services', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id, data)=>apiRequest(`/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id)=>apiRequest(`/services/${id}`, {
            method: 'DELETE'
        }),
    toggleActive: (id)=>apiRequest(`/services/${id}/toggle-active`, {
            method: 'PATCH'
        }),
    getOptions: ()=>apiRequest('/services/options/all')
};
const serviceRecordsApi = {
    getAll: (params)=>{
        const query = new URLSearchParams();
        if (params?.date) query.set('date', params.date);
        if (params?.status) query.set('status', params.status);
        return apiRequest(`/service-records?${query}`);
    },
    getById: (id)=>apiRequest(`/service-records/${id}`),
    create: (data)=>apiRequest('/service-records', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id, data)=>apiRequest(`/service-records/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    updateStatus: (id, status)=>apiRequest(`/service-records/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({
                status
            })
        }),
    clockIn: (id, cleanerId)=>apiRequest(`/service-records/${id}/clock-in`, {
            method: 'POST',
            body: JSON.stringify({
                cleanerId
            })
        }),
    clockOut: (id, cleanerId, workingTime, photos)=>apiRequest(`/service-records/${id}/clock-out`, {
            method: 'POST',
            body: JSON.stringify({
                cleanerId,
                workingTime,
                photos
            })
        }),
    delete: (id)=>apiRequest(`/service-records/${id}`, {
            method: 'DELETE'
        })
};
const invoicesApi = {
    getAll: (params)=>{
        const query = new URLSearchParams();
        if (params?.status) query.set('status', params.status);
        if (params?.search) query.set('search', params.search);
        return apiRequest(`/invoices?${query}`);
    },
    getById: (id)=>apiRequest(`/invoices/${id}`),
    create: (data)=>apiRequest('/invoices', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    pay: (id)=>apiRequest(`/invoices/${id}/pay`, {
            method: 'PATCH'
        }),
    delete: (id)=>apiRequest(`/invoices/${id}`, {
            method: 'DELETE'
        })
};
const dashboardApi = {
    getStats: ()=>apiRequest('/dashboard/stats'),
    getCalendar: (startDate, endDate)=>apiRequest(`/dashboard/calendar?startDate=${startDate}&endDate=${endDate}`),
    getCleanerSchedule: (cleanerId)=>apiRequest(`/dashboard/cleaner-schedule/${cleanerId}`)
};
const settingsApi = {
    getAll: ()=>apiRequest('/settings'),
    update: (key, value)=>apiRequest(`/settings/${key}`, {
            method: 'PUT',
            body: JSON.stringify({
                value
            })
        }),
    create: (key, value)=>apiRequest('/settings', {
            method: 'POST',
            body: JSON.stringify({
                key,
                value
            })
        })
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [userRole, setUserRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [entityId, setEntityId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthToken"])();
            if (token) {
                fetchCurrentUser();
            } else {
                setLoading(false);
            }
        }
    }["AuthProvider.useEffect"], []);
    const fetchCurrentUser = async ()=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].me();
            setUser(result.user);
            setUserRole(result.user.role);
            setEntityId(result.user.entityId || null);
        } catch (err) {
            console.error('Error fetching user:', err);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(null);
            setUser(null);
            setUserRole(null);
            setEntityId(null);
        } finally{
            setLoading(false);
        }
    };
    const signIn = async (email, password)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].login(email, password);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(result.token);
            setUser(result.user);
            setUserRole(result.user.role);
            setEntityId(result.user.entityId || null);
            return {
                error: null,
                success: true
            };
        } catch (err) {
            return {
                error: err,
                success: false
            };
        }
    };
    const signUp = async (email, password, role)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].register(email, password, role);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(result.token);
            setUser(result.user);
            setUserRole(result.user.role);
            return {
                error: null,
                success: true
            };
        } catch (err) {
            return {
                error: err,
                success: false
            };
        }
    };
    const signOut = async ()=>{
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAuthToken"])(null);
            setUser(null);
            setUserRole(null);
            setEntityId(null);
        }
    };
    const hasPermission = (permission)=>{
        if (!userRole) return false;
        if (userRole === 'admin') return true;
        const perms = {
            admin: [
                '*'
            ],
            manager: [
                'view_all',
                'manage_cleaners',
                'manage_customers',
                'manage_services',
                'manage_schedules',
                'view_invoices',
                'manage_invoices'
            ],
            cleaner_manager: [
                'view_cleaners',
                'manage_cleaner_schedules',
                'manage_timesheets',
                'view_cleaner_details'
            ],
            customer: [
                'view_own_invoices',
                'request_extra_cleaning',
                'reschedule_cleaning',
                'view_own_services'
            ],
            cleaner: [
                'clock_in_out',
                'upload_photos',
                'view_own_schedule',
                'view_own_records'
            ],
            agency_manager: [
                'manage_agency_properties',
                'manage_agency_staff',
                'view_agency_invoices',
                'manage_agency_payments',
                'view_agency_services'
            ],
            agency_bookkeeper: [
                'view_agency_invoices',
                'manage_agency_payments'
            ],
            agency_staff: [
                'view_property_status',
                'request_cleaner',
                'set_expected_arrival',
                'view_assigned_properties'
            ]
        };
        return perms[userRole]?.includes(permission) ?? false;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            userRole,
            entityId,
            loading,
            signIn,
            signUp,
            signOut,
            hasPermission
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/AuthContext.tsx",
        lineNumber: 107,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "9pTgpQlMMxu/28CVesXGDlKf7UI=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/layout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RootLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.tsx [app-client] (ecmascript)");
"use client";
;
;
;
function RootLayout({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("html", {
        lang: "en",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("body", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthProvider"], {
                children: children
            }, void 0, false, {
                fileName: "[project]/src/app/layout.tsx",
                lineNumber: 14,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/layout.tsx",
            lineNumber: 13,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/layout.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
_c = RootLayout;
var _c;
__turbopack_context__.k.register(_c, "RootLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_1q4vis1._.js.map