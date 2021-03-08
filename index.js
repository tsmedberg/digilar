const auth    = require("./auth.js");
const prompts = require("prompts");
const { API } = require("./api.js");

let api;

(async () => {
    const username = await prompts({
        type: 'text',
        name: 'value',
        message: 'Användarnamn:'
    });

    const password = await prompts({
        type: 'password',
        name: 'value',
        message: 'Lösenord:'
    });

    let login = await auth.login(username.value, password.value);
    if(!login){
        console.log("Fel användarnamn eller lösenord.");
        return;
    }

    api = new API(login);

    let user = login["user"];
    console.log("Välkommen " + user["name"] + "!");

    api.getCourses().then(c => {
        console.log(c);
    })
})()