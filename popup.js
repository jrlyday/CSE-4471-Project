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
      
        var cookie_array = document.cookie.split(";");
        var ol = document.getElementById("cookie_list");
        var li = document.createElement("li");
        
        cookie_array.forEach(element => {
            li.setAttribute('id',element.value);
            li.appendChild(document.createTextNode(element.value));
            ol.appendChild(li);
        });
    }
}, false)

// deletes all cookies on page
function deleteAllCookies(){

}
