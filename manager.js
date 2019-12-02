// A simple Timer class.
function Timer() {
  this.start_ = new Date();
  this.elapsed = function() {
    return new Date() - this.start_;
  };
  this.reset = function() {
    this.start_ = new Date();
  };
}

// Compares cookies for "key" (name, domain, etc.) equality, but not "value"
// equality.
function cookieMatch(c1, c2) {
  return (
    c1.name == c2.name &&
    c1.domain == c2.domain &&
    c1.hostOnly == c2.hostOnly &&
    c1.path == c2.path &&
    c1.secure == c2.secure &&
    c1.httpOnly == c2.httpOnly &&
    c1.session == c2.session &&
    c1.storeId == c2.storeId
  );
}

// Returns an array of sorted keys from an associative array.
function sortedKeys(array) {
  var keys = [];
  for (var i in array) {
    keys.push(i);
  }
  keys.sort();
  return keys;
}

// Shorthand for document.querySelector.
function select(selector) {
  return document.querySelector(selector);
}

// An object used for caching data about the browser's cookies, which we update
// as notifications come in.
function CookieCache() {
  this.cookies_ = {};
  this.reset = function() {
    this.cookies_ = {};
  };
  this.add = function(cookie) {
    var domain = cookie.domain;
    if (!this.cookies_[domain]) {
      this.cookies_[domain] = [];
    }
    this.cookies_[domain].push(cookie);
  };
  this.remove = function(cookie) {
    var domain = cookie.domain;
    if (this.cookies_[domain]) {
      var i = 0;
      while (i < this.cookies_[domain].length) {
        if (cookieMatch(this.cookies_[domain][i], cookie)) {
          this.cookies_[domain].splice(i, 1);
        } else {
          i++;
        }
      }
      if (this.cookies_[domain].length == 0) {
        delete this.cookies_[domain];
      }
    }
  };

  // Returns a sorted list of cookie domains that match |filter|. If |filter| is
  //  null, returns all domains.
  this.getDomains = function(filter) {
    var result = [];
    sortedKeys(this.cookies_).forEach(function(domain) {
      if (!filter || domain.indexOf(filter) != -1) {
        result.push(domain);
      }
    });
    return result;
  };
  this.getCookies = function(domain) {
    return this.cookies_[domain];
  };

  this.encryptCookies = function(domain) {
    this.cookies_[domain].forEach(function(cookie) {
      cookie.value = CryptoJS.AES.encrypt(
        cookie.value,
        encryptionKey()
      ).toString();

      updateCookieValue(cookie);
    });
  };

  this.decryptCookies = function(domain) {
    this.cookies_[domain].forEach(function(cookie) {
      cookie.value = CryptoJS.AES.decrypt(
        cookie.value,
        encryptionKey()
      ).toString(CryptoJS.enc.Utf8);

      updateCookieValue(cookie);
    });
  };
}

function updateCookieValue(cookie) {
  var url =
    "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
  debugger;
  chrome.cookies.set(
    {
      url: url,
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      storeId: cookie.storeId
    },
    function(cookie) {
      console.log(JSON.stringify(cookie));
      console.log(chrome.extension.lastError);
      console.log(chrome.runtime.lastError);
    }
  );
}

var cache = new CookieCache();
function removeAllForFilter() {
  var filter = select("#filter").value;
  var timer = new Timer();
  cache.getDomains(filter).forEach(function(domain) {
    removeCookiesForDomain(domain);
  });
}

function removeAll() {
  var all_cookies = [];
  cache.getDomains().forEach(function(domain) {
    cache.getCookies(domain).forEach(function(cookie) {
      all_cookies.push(cookie);
    });
  });
  cache.reset();
  var count = all_cookies.length;
  var timer = new Timer();
  for (var i = 0; i < count; i++) {
    removeCookie(all_cookies[i]);
  }
  timer.reset();
  chrome.cookies.getAll({}, function(cookies) {
    for (var i in cookies) {
      cache.add(cookies[i]);
      removeCookie(cookies[i]);
    }
  });
}

function removeCookie(cookie) {
  var url =
    "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
  chrome.cookies.remove({ url: url, name: cookie.name });
}

function removeCookiesForDomain(domain) {
  var timer = new Timer();
  cache.getCookies(domain).forEach(function(cookie) {
    removeCookie(cookie);
  });
}

function resetTable() {
  var table = select("#cookies");
  while (table.rows.length > 1) {
    table.deleteRow(table.rows.length - 1);
  }
}

var reload_scheduled = false;
function scheduleReloadCookieTable() {
  if (!reload_scheduled) {
    reload_scheduled = true;
    setTimeout(reloadCookieTable, 250);
  }
}

function showDomainDetails(domain) {
  var existingDetails = document
    .getElementsByClassName("cookie_detail_overlay display-block")
    .item(0);
  existingDetails && existingDetails.classList.remove("display-block");

  var details = select(`#domain${replaceEndAndDotDomain(domain)}`);
  details.className += " " + "display-block";
}

function replaceEndAndDotDomain(domain) {
  var ending = "";
  var currentPos = domain.length - 1;
  var currentLetter = domain.charAt(currentPos);
  while (currentLetter != ".") {
    currentPos = currentPos - 1;
    ending = currentLetter + ending;
    currentLetter = domain.charAt(currentPos);
  }
  ending = "." + ending;
  domain = domain.replace(ending, "");
  currentPos = 0;
  while (currentPos < domain.length) {
    console.log(domain.charAt(currentPos));
    if (domain.charAt(currentPos) == ".") {
      domain = domain.replace(domain.charAt(currentPos), "");
    }
    currentPos++;
  }
  return domain;
}

function createDetailsOverlayHtml(domain) {
  var detailsHtml = "";
  cache.getCookies(domain).forEach(function(cookie) {
    detailsHtml += `<p>Name: ${cookie.name}</p><p>Value: ${cookie.value}</p><p>Experation: ${cookie.expirationDate}</p>`;
  });

  var overlayId = `domain${replaceEndAndDotDomain(domain)}`;

  return `<div id=${overlayId} class="cookie_detail_overlay">${detailsHtml}</div>`;
}

function encryptionKey() {
  return "encryption password";
}

function reloadCookieTable() {
  reload_scheduled = false;
  var filter = select("#filter").value;
  var domains = cache.getDomains(filter);
  select("#filter_count").innerText = domains.length;
  select("#total_count").innerText = cache.getDomains().length;
  select("#delete_all_button").innerHTML = "";
  if (domains.length) {
    var button = document.createElement("button");
    button.onclick = removeAllForFilter;
    button.innerText = "Delete all " + domains.length;
    button.setAttribute("class", "delete_all_button_css");
    select("#delete_all_button").appendChild(button);
  }
  resetTable();
  var table = select("#cookies");
  var overlayContainer = select("#cookie_overlay_container");
  domains.forEach(function(domain) {
    var cookies = cache.getCookies(domain);
    var row = table.insertRow(-1);
    var name = row.insertCell(-1);
    var nameButton = document.createElement("button");
    nameButton.innerText = domain;
    nameButton.setAttribute("class", "domain-buttons");
    nameButton.onclick = (function(dom) {
      return function() {
        showDomainDetails(dom);
      };
    })(domain);
    name.appendChild(nameButton);
    var cell = row.insertCell(-1);
    cell.innerText = cookies.length;
    cell.setAttribute("class", "cookie_count");
    var encryptButton = document.createElement("button");
    encryptButton.innerText = "Encrypt";
    encryptButton.setAttribute("class", "other-buttons");
    encryptButton.onclick = (function(dom) {
      return function() {
        cache.encryptCookies(domain);
      };
    })(domain);
    var decryptButton = document.createElement("button");
    decryptButton.innerText = "Decrypt";
    decryptButton.setAttribute("class", "other-buttons");
    decryptButton.onclick = (function(dom) {
      return function() {
        cache.decryptCookies(domain);
      };
    })(domain);
    var deleteButton = document.createElement("button");
    deleteButton.innerText = "Delete";
    deleteButton.setAttribute("class", "other-buttons");
    deleteButton.onclick = (function(dom) {
      return function() {
        removeCookiesForDomain(dom);
      };
    })(domain);
    var cell = row.insertCell(-1);
    cell.appendChild(encryptButton);
    cell.appendChild(decryptButton);
    cell.appendChild(deleteButton);
    cell.setAttribute("class", "button");
    detailsHtml = createDetailsOverlayHtml(domain);
    var cookieOverlay = document.createElement("div");
    cookieOverlay.innerHTML = detailsHtml;
    overlayContainer.appendChild(cookieOverlay);
  });
}

function focusFilter() {
  select("#filter").focus();
}

function resetFilter() {
  var filter = select("#filter");
  filter.focus();
  if (filter.value.length > 0) {
    filter.value = "";
    reloadCookieTable();
  }
}

var ESCAPE_KEY = 27;
window.onkeydown = function(event) {
  if (event.keyCode == ESCAPE_KEY) {
    resetFilter();
  }
};

function listener(info) {
  cache.remove(info.cookie);
  if (!info.removed) {
    cache.add(info.cookie);
  }
  scheduleReloadCookieTable();
}

function startListening() {
  chrome.cookies.onChanged.addListener(listener);
}

function stopListening() {
  chrome.cookies.onChanged.removeListener(listener);
}

function onload() {
  focusFilter();
  var timer = new Timer();
  chrome.cookies.getAll({}, function(cookies) {
    startListening();
    start = new Date();
    for (var i in cookies) {
      cache.add(cookies[i]);
    }
    timer.reset();
    reloadCookieTable();
  });
}

document.addEventListener("DOMContentLoaded", function() {
  onload();
  document
    .querySelector("#filter_div button")
    .addEventListener("click", resetFilter);
  document.body.addEventListener("click", focusFilter);
  document
    .querySelector("#filter_div input")
    .addEventListener("input", reloadCookieTable);
});
