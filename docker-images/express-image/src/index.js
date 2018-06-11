var Chance = require('chance');
var chance = new Chance();

const express = require('express');
const app = express();

var cnt = 0;
app.get('/',function(req, res) {
    res.send( companies() );
});

app.listen(3000, function() {
    console.log('Accepting HTTP requests on port 3000!');
});

function companies(){
    cnt++;

    var numberOfCompanies = chance.integer({
        min: 0,
        max: 10
    });

    console.log(numberOfCompanies);
    var companies = [];
    for(var i = 0; i < numberOfCompanies; i++){

        var company = chance.company();
        var country = chance.country();

        companies.push({
           company: company,
           email: chance.email(),
           phone: chance.phone({ country: country }),
           city: chance.city(),
           country: country,
           number: cnt
        });
    }
    console.log(companies);
    return companies;
}
