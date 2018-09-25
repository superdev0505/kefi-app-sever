import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const express = require("express");
const app = express();
const cron = require('node-cron');
const request = require('request');
const checkreminderTime = function (time) {
    if (time.userId !== null && time.rTime !== null) {
        return true;
    }
    return false;
};
const checkArticle = function (article) {
    if (article.header !== null && article.text !== null) {
        return true;
    }
    return false;
};
const sendPushNotification = function (token) {
    console.log("onefire - start sendPushNotification");
    // Check that all your push tokens appear to be valid Expo push tokens
    admin.database().ref("/articles/").orderByChild("id").limitToLast(1).once("value", function (snapshot) {
        snapshot.forEach((element) => {
            const article = element.val();
            console.log("onefire - lastest article", article);
            if (!checkArticle(article)) {
                return;
            }
            const title = "A New Kefigram Delivered";
            const content = "A New Kefigram Delivered "+article.text+" A New Kefigram Delivered";
            const endpoint = "https://exp.host/--/api/v2/push/send";
            const requestData = {
                "to": token,
                "title": title,
                "body": content,
                //"sound": "default"
            };
            console.log("onefire - requestData", requestData);
            request({
                url: endpoint,
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Accept': 'application/json'
                },
                body: JSON.stringfy(requestData),
            }, function (error, resp, body) {
                console.log("onefire - sendpush", body);
            });
        });
    });
};
const readUserToken = function (userId) {
    console.log("onefire - start readUserToken");
    admin.database().ref("/users/" + userId).once("value", function (snap) {
        const user = snap.val();
        if (user !== null) {
            if (user.token !== null) {
                const token = user.token;
                console.log("onefire - token", token);
                if (token !== null && token !== undefined) {
                    sendPushNotification(toekn);
                }
                else {
                    console.log("onefire - can't find the token");
                }
            }
        }
    });
};
const readDatabase = function () {
    console.log("onefire - start readDatabase");
    const dataRef = admin.database().ref("/reminderTime/");
    dataRef.once("value", function (snapshot) {
        const date = new Date();
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();
        const timestamp = hour * 60 + minute;
        if (snapshot.val() !== null) {
            snapshot.forEach((element) => {
                const time = element.val();
                console.log("onefire - time:", time, "rTime", time.rTime);
                console.log("onefire - date:", date.toString(), "hour:", hour, "min:", minute, "unixTime", timestamp, "local:", date.toLocaleTimeString());
                if (checkreminderTime(time)) {
                    if (time.rTime === timestamp) {
                        readUserToken(time.userId);
                    }
                }
            });
        }
    });
};
const task = cron.schedule('* * * * *', function () {
    console.log('onefire - running a task');
    readDatabase();
});
app.get("/", function (req, res) {
    res.send("helloworld function http request - 1");
});
app.get("/start", function (req, res) {
    task.stop();
    task.start();
    res.send("cron start");
});
app.get("/stop", function (req, res) {
    task.stop();
    res.send("cron stop");
});
app.get("/destroy", function (req, res) {
    task.destroy();
    res.send("cron destroy");
});
app.get("/readDatabase", function (req, res) {
    readDatabase();
    res.send("ok readDatabase");
});
app.post("/readUserToken", function (req, res) {
    const userId = req.body.userId;
    if (userId !== null) {
        readUserToken(userId);
        res.send({ result: "ok", userId: userId });
    }
    else {
        res.send({ result: "error", userId: null });
    }
});
app.post("/sendPushNotification", function (req, res) {
    const token = req.body.token;
    if (token !== null) {
        sendPushNotification(token);
        res.send({ result: "ok", token: token });
    }
    else {
        res.send({ result: "error", token: null });
    }
});
exports.widgets = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map