const { Curl }    = require('node-libcurl');
const fetch       = require('node-fetch');
const querystring = require('querystring');
const uuid        = require('uuid');

module.exports = {
    login
}

function login(user, password){
    return new Promise(resolve => {
        getSignatureCookies().then(cookieStr => {
            const curl = new Curl();
            curl.setOpt('URL', 'https://konto.nok.se/login/home/login');
            curl.setOpt('FOLLOWLOCATION', true);

            curl.setOpt(Curl.option.HTTPHEADER, ['content-type: application/x-www-form-urlencoded', 'cookie: ' + cookieStr])
            curl.setOpt(Curl.option.POSTFIELDS, querystring.stringify({
                login: user,
                password: password
            }));

            curl.on('end', function (statusCode, data, headers) {
                this.close();

                if(headers.length < 2){
                    resolve(false);
                } else {
                    let code = headers[1]["location"].split("code=")[1].split("&")[0];
                    getAccessToken(code).then(token => {
                        getUserInfo(token).then(info => {
                            resolve({"user": info, "authCode": code, "accessToken": token});
                        });
                    });
                }
            });

            curl.on('error', curl.close.bind(curl));
            curl.perform();
        });
    });
}

function getSignatureCookies(){
    return new Promise(resolve => {
        const curl = new Curl();
        curl.setOpt('URL', 'https://konto.nok.se/auth?client_id=app.digilar.se&redirect_uri=https://app.digilar.se/login&response_type=code'
            + '&state=' + uuid.v4() + '&scope=openid%20profile%20offline_access&prompt=consent%20register%20onboarding');
        curl.setOpt('FOLLOWLOCATION', true);

        curl.on('end', function (statusCode, data, headers) {
            this.close();

            const cookies = [];
            for(let cookie of headers[0]["Set-Cookie"]){
                cookies.push(cookie.split("; ")[0]);
            }

            resolve(cookies.join("; "));
        });

        curl.on('error', curl.close.bind(curl));
        curl.perform();
    });
}

function getAccessToken(authCode){
    return new Promise(resolve => {
        fetch("https://konto.nok.se/token", {
            "headers": {
                "accept": "application/json",
                "content-type": "application/x-www-form-urlencoded",
            },
            "body": "code=" + authCode + "&client_id=app.digilar.se&grant_type=authorization_code&redirect_uri=https%3A%2F%2Fapp.digilar.se%2Flogin",
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

            "body": null,
            "method": "GET",
            "mode": "cors"
        }).then(response => response.json())
            .then(json => resolve({"uuid": json["sub"], "name": json["name"]}));
    });
}
