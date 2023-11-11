import * as params from '@params';

let miniSearch;
let resList = document.getElementById('searchResults');
let sInput = document.getElementById('searchInput');
let first, last, current_elem = null;
let resultsAvailable = false;

// load our search index and options
window.onload = function () {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                let data = JSON.parse(xhr.responseText);
                if (data) {
                    // minisearch.js options
                    let options = {
                        fields: ['title', 'summary', 'content'],
                        storeFields: ['title', 'summary', 'content'],
                        searchOptions: {
                            prefix: true,
                            fuzzy: true
                        }
                    };
                    if (params.minisearchOpts) {
                        let fields = params.minisearchOpts.fields ?? ['title', 'summary', 'content'];
                        options = {
                            fields: fields,
                            storeFields: fields, // due to some reason this particular storeFields parameter is not working with passed value
                            searchOptions: {
                                prefix: params.minisearchOpts.prefix ?? true, 
                                fuzzy: params.minisearchOpts.fuzzy ?? true,
                                combineWith: params.minisearchOpts.combinewith ?? "OR",
                                boost: params.minisearchOpts.boost ?? {},
                                weights: params.minisearchOpts.weights ?? { fuzzy: 0.45, prefix: 0.375 }
                            }
                        }
                    }
                    miniSearch = new MiniSearch(options);
                    miniSearch.addAll(data);
                }
                sInput.dispatchEvent(new Event('keyup')); // trigger a search query
            } 
            else {
                console.log(xhr.responseText);
            }
        }
    };
    xhr.open('GET', "../index.json");
    xhr.send();
}


function activeToggle(ae) {
    document.querySelectorAll('.focus').forEach(function (element) {
        // rm focus class
        element.classList.remove("focus")
    });
    if (ae) {
        ae.focus()
        document.activeElement = current_elem = ae;
        ae.parentElement.classList.add("focus")
    } else {
        document.activeElement.parentElement.classList.add("focus")
    }
}


function reset() {
    resultsAvailable = false;
    resList.innerHTML = sInput.value = ''; // clear inputbox and searchResults
    sInput.focus(); // shift focus to input box
}


// execute search as each character is typed
sInput.onkeyup = function (e) {
    // run a search query (for "term") every time a letter is typed
    // in the search box
    if (miniSearch) {
        let results;
        let limitResults = 1000;
        if (params.minisearchOpts) {
            limitResults = params.minisearchOpts.limit ?? 1000;
        }
        results = miniSearch.search(this.value.trim()).slice(0, limitResults);

        if (results.length !== 0) {
            // build our html if result exists
            let resultSet = ''; // our results bucket
            
            for (let item in results) {
                resultSet += `<li class="post-entry"><header class="entry-header">${results[item].title}</header><footer class="entry-footer">${results[item].summary}</footer>` +
                    `<a href="${results[item].id}" aria-label="${results[item].title}"></a></li>`
            }

            resList.innerHTML = resultSet;
            resultsAvailable = true;
            first = resList.firstChild;
            last = resList.lastChild;
        } 
        else {
            resultsAvailable = false;
            resList.innerHTML = '';
        }
    }
}

sInput.addEventListener('search', function (e) {
    // clicked on x
    if (!this.value) reset()
})

// kb bindings
document.onkeydown = function (e) {
    let key = e.key;
    let ae = document.activeElement;

    let inbox = document.getElementById("searchbox").contains(ae);

    if (ae === sInput) {
        let elements = document.getElementsByClassName('focus');
        while (elements.length > 0) {
            elements[0].classList.remove('focus');
        }
    } else if (current_elem) ae = current_elem;

    if (key === "Escape") {
        reset()
    } else if (!resultsAvailable || !inbox) {
        return
    } else if (key === "ArrowDown") {
        e.preventDefault();
        if (ae == sInput) {
            // if the currently focused element is the search input, focus the <a> of first <li>
            activeToggle(resList.firstChild.lastChild);
        } else if (ae.parentElement != last) {
            // if the currently focused element's parent is last, do nothing
            // otherwise select the next search result
            activeToggle(ae.parentElement.nextSibling.lastChild);
        }
    } else if (key === "ArrowUp") {
        e.preventDefault();
        if (ae.parentElement == first) {
            // if the currently focused element is first item, go to input box
            activeToggle(sInput);
        } else if (ae != sInput) {
            // if the currently focused element is input box, do nothing
            // otherwise select the previous search result
            activeToggle(ae.parentElement.previousSibling.lastChild);
        }
    } else if (key === "ArrowRight") {
        ae.click(); // click on active link
    }
}
