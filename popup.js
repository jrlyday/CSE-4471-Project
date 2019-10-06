// all java scripts for functionality (can build a cookie helper folder if we need to)


// adds desired cookies
function setCookies(){
    document.cookie = "name=" + document.myform.name.value;
    document.cookie = "email=" + document.myform.email.value;

}

// builds array of all session cookies (just prints them in log right now.)
document.addEventListener('DOMContentLoaded', function(){
    document.querySelector('button').addEventListener('click', getCookies, false)
    function getCookies(){
        console.log("hey")
        var cookie_array = document.cookie.split(";");
        console.log(cookie_array[0]);
    }
}, false)

// deletes all cookies on page
function deleteAllCookies(){

}
