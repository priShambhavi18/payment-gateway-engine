function writeLog(level, message, meta) {
    const logEntry = {
        level,
        message,
        timestamp: new Date().toISOString()
    };

    if(meta !== undefined){
        logEntry.meta = meta;
    }

    const serializedLog = JSON.stringify(logEntry);

    if(level === "error"){
        console.error(serializedLog);
        return;
    }

    if(level === "warn"){
        console.warn(serializedLog);
        return;
    }

    console.log(serializedLog);
}

module.exports = {
    info(message, meta) {
        writeLog("info", message, meta);
    },
    warn(message, meta) {
        writeLog("warn", message, meta);
    },
    error(message, meta) {
        writeLog("error", message, meta);
    }
};
