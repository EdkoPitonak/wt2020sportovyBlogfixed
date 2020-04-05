function komentare(opinion){
    const nazor=
        `
    <section>
       <b><p class="pridane">${opinion.Meno} <i>(${(new Date(opinion.created)).toDateString()})</i></p></b>

     
       <p class="pridane">${opinion.Email}</p>
       <p class="pridane">${opinion.Vyhrame?"Jasne ze vyhrate.":"Nie ste slabucky."}</p>
       <p class="pridane">${opinion.Priloha?"Bola":"Nebola"}</p>
       <p class="pridane">${opinion.Radi?"Ano":"Absolutne"}</p>
       <p class="pridane">${opinion.Klucove}</p>
       <p class="pridane">${opinion.Comment}</p>
  
    </section>`;
    return nazor;
}

function opinionArray2html(sourceData){
    return sourceData.reduce((htmlWithOpinions,opn) => htmlWithOpinions+ komentare(opn),"");
}

let opinions=[];

const opinionsElm=document.getElementById("opinionsContainer")

if(localStorage.chosenOnesComments){
    opinions=JSON.parse(localStorage.chosenOnesComments);
}

opinionsElm.innerHTML=opinionArray2html(opinions);
console.log(opinions);

let myFrmElm=document.getElementById('formular');

myFrmElm.addEventListener
("submit",processOpnFrmData);

function processOpnFrmData(event){

    event.preventDefault();

    const Name = document.getElementById("validationCustom01").value;
    const email = document.getElementById("inputEmail3").value;
    const checkBox = document.getElementById("gridCheck1").checked;
    const comment = document.getElementById("exampleFormControlTextarea1").value;
    const klucove = document.getElementById("klucove-vyber").value;
    const priloha = document.getElementById("exampleFormControlFile1").value;
    const radi = document.getElementById("gridRadios1").value;


    const newData =
        {
            Meno: Name,
            Email: email,
            Vyhrame: checkBox,
            Comment: comment,
            Klucove: klucove,
            Priloha: priloha,
            Radi: radi,
            created: new Date()
        };

    console.log("NovÃ½ Älen:\n "+JSON.stringify(newData));

    opinions.push(newData);

    localStorage.chosenOnesComments = JSON.stringify(opinions);
    opinionsElm.innerHTML+=komentare(newData);

    window.alert("VaÅ¡e Ãºdaje a komentÃ¡re  boli uloÅ¾ene. Pozrite konzolu alebo strÃ¡nku");
    console.log("PridanÃ½ novÃ½ Älen");
    console.log(opinions);

}


function removeButon() {
    let m_komentare =[];

    for (const komentar of opinions){
        const dateNow = Date.now();
        const dateCreated = new Date(komentar.created).getTime();

        if (dateNow - dateCreated < 8640000) {
            m_komentare.push(komentar);
        }
    }
    opinions = m_komentare;
    refreshOpinions();
}

function refreshOpinions() {
    localStorage.chosenOnesComments = JSON.stringify(opinions);
    opinionsElm.innerHTML = opinionArray2html(opinions);
}
