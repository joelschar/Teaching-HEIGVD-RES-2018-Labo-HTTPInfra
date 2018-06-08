var Chance = require('chance');
var chance = new Chance();

const express = require('express');
const app = express();

// counter for the server
var inc = 0;

app.get('/',function(req, res) {
    res.send( generateStudents() );
});

app.listen(3000, function() {
    console.log('Accepting HTTP requests on port 3000!');
});

function generateStudents(){

    inc++;

    var numberOfStudents = chance.integer({
        min: 0,
        max: 10
    });

    console.log(numberOfStudents);
    var students = [];
    for(var i = 0; i < numberOfStudents; i++){

        var gender = chance.gender();

        var birthYear = chance.year({
            min: 1986,
            max: 1996
        });

        students.push({
            firstName: chance.first({
                gender: gender
            }),
            lastName: chance.last(),
            gender: gender,
            birthday: chance.birthday({
                year: birthYear
            }),
            count: inc
        });
    }
    console.log(students);
    return students;
}
