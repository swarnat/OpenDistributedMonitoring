export default {
    database: {
        host: 'localhost',
        user: 'fdm',
        password: '',
        database: '',
    },
    slack: {
        'webhook': "",
        'displayName': "",
    },
    redis: {
        host: "localhost",
        port: 6379
    },
    
    enable_daily_reports: true,

    // random uuid
    UUID_NAMESPACE: '12345678-230b-4050-8b32-4729ddc716c7',

    http_port: 4000,

    topic_prefix: "odm1_",

    report_auth: {
        'username': 'admin',
        'password': 'odm-report'
    },
}