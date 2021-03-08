const auth    = require("./auth.js");
const prompts = require("prompts");
const { API } = require("./api.js");

let api;

(async () => {
    const username = await prompts({
        type: 'text',
        name: 'value',
        message: 'Epostadress:'
    });

    const password = await prompts({
        type: 'password',
        name: 'value',
        message: 'Lösenord:'
    });

    console.log('[INFO]\t Logging in to digilär.')
    let login = await auth.login(username.value, password.value);
    if(!login){
        console.log("Fel användarnamn eller lösenord.");
        return;
    }

    api = new API(login);

    let user = login["user"];
    console.log("Välkommen " + user["name"] + "!");

    console.log('[INFO]\t Getting courses for user.')
    api.getCourses().then(c => {
        console.log(c);
    })
})()