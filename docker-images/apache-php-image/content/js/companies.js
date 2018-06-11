$(function(){
       console.log("loading companies");

           function loadCompanies() {
                   $.getJSON( "/api/companies/", function( companies ) {
                           console.log(companies);
                           var message = "No Company";
                           if ( companies.length > 0 ) {
                                   message = companies[0].company + " | " + companies[0].email + " | " + companies[0].city + "[" + companies[0].country + "]" + " > " + companies[0].number + " < ";
                               }
                           $(".company").text(message);
                       });
               };
       loadCompanies();
       setInterval( loadCompanies , 2000 );
});
