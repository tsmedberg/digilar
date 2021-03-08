const fetch = require("node-fetch");

class API {
    constructor(auth) {
        this.auth = auth;
    }

    getCourses() {
        return new Promise(resolve => {
            fetch("https://api.digilar.se/api/v1/meta/users/" + this.auth["user"]["uuid"] + "/courses", {
                "headers": {
                    "accept": "application/vnd.api+json",
                    "authorization": "Bearer " + this.auth["accessToken"]
                },
                "body": null,
                "method": "GET",
                "mode": "cors"
            }).then(response => response.json()).then(json => {
                // Maybe use an implementation meant for this kind of data? https://jsonapi.org/implementations/
                let data = json["data"];
                let courses = [];
                for (let obj of data) {
                    courses.push({
                        "uuid": obj["id"],
                        "name": obj["attributes"]["name"]
                    });
                }

                resolve(courses);
            });
        });
    }
}

module.exports = {
    API
}