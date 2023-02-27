


async function fetchImage(url) {
    const img = new Image();
    return new Promise((res, rej) => {
        img.onload = () => res(img);
        img.onerror = e => rej(e);
        img.src = url;
    });
}

async function getUser() {

    let book = document.querySelector('.title').textContent;

    let title = book.toLowerCase().replaceAll(' ', '+');

    let isbn;
    let api_url = "https://openlibrary.org/search.json?q=";
    let thumbnail_api_url = "https://covers.openlibrary.org/b/ISBN/$value-M.jpg"
    console.log(book)
    // Making an API call (request)
    // and getting the response back
    let response = await fetch(api_url.concat(title));

    // Parsing it to JSON format
    let data = await response.json();
    if (data.docs.length > 0) {
        console.log(data)

        isbn = data.docs[0].isbn[0];
        author = data.docs[0].author_name[0];


        let div_isbn = document.querySelector('.ISBN');
        div_isbn.innerHTML = "ISBN: " + isbn;

        let div_author = document.querySelector('.author');
        div_author.innerHTML = author;

        let url = thumbnail_api_url.replace("$value", isbn);
        const img = await fetchImage(url);
        const w = img.width;
        const h = img.height;
        console.log(w)

        if (w > 10) {

            document.getElementById("cover").src = img.src;
        } else {
            document.getElementById("cover").src = "assets/rect.png";
            document.getElementById("cover").style = "width:150px"
        }

        console.log(img)
    }
    else {
        let div_isbn = document.querySelector('.ISBN');
        div_isbn.innerHTML = "sorry, i don't have a Mandarin book database yet :'(";
        let div_author = document.querySelector('.author');
        div_author.innerHTML = "";
        document.getElementById("cover").src = "assets/rect.png";
        document.getElementById("cover").style = "width:150px"
    }
}

getUser();



