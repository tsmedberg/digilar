const fetch       = require('node-fetch');
const querystring = require('querystring');
const uuid        = require('uuid');
const { https }   = require('follow-redirects');

module.exports = {
    login
}

function login(user, password){
    return new Promise(resolve => {
        getSignatureCookies().then(cookieStr => {
            fetch("https://konto.nok.se/login/home/login", {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                    "cookie": cookieStr
                },
                "body": querystring.stringify({
                    login: user,
                    password: password,
                }),
                "method": "POST"
            }).then(res => {
                let code = res.url.split("code=")[1].split("&")[0];
                getAccessToken(code).then(token => {
                    getUserInfo(token).then(info => {
                        resolve({"user": info, "authCode": code, "accessToken": token});
                    });
                });
            })
        });
    });
}

function getSignatureCookies(){
    return new Promise(resolve => {
        let data = querystring.stringify({
            'client_id' : 'app.digilar.se',
            'redirect_uri': 'https://app.digilar.se/login',
            'response_type': 'code',
            'state': uuid.v4(),
            'scope': "openid profile offline_access",
            "prompt": 'consent register onboarding'
        });

        let options = {
            host: 'konto.nok.se',
            path: '/auth?' + data
        };

        options.beforeRedirect = (options, {headers}) => {
            let setCookie = headers["set-cookie"];
            if (setCookie != null) {
                const cookies = [];
                for(let cookie of setCookie){
                    cookies.push(cookie.split("; ")[0]);
                }

                resolve(cookies.join("; "));
            }
        };

        https.request(options).end();
    });
}

function getAccessToken(authCode){
    return new Promise(resolve => {
        fetch("https://konto.nok.se/token", {
            "headers": {
                "accept": "application/json",
                "content-type": "application/x-www-form-urlencoded",
            },
            "body": querystring.stringify({
                "code": authCode,
                "client_id": "app.digilar.se",
                "grant_type": "authorization_code",
                "redirect_uri": "https://app.digilar.se/login"
            }),
            "method": "POST",
            "mode": "cors"
        }).then(res => res.json()).then(json => resolve(json["access_token"]));
    });
}

function getUserInfo(authToken){
    return new Promise(resolve => {
        fetch("https://konto.nok.se/me", {
            "headers": {
                "accept": "application/json",
                "authorization": "Bearer " + authToken,
            },
            "method": "GET",
            "mode": "cors"
        }).then(response => response.json())
          .then(json => resolve({"uuid": json["sub"], "name": json["name"]}));
    });
}
