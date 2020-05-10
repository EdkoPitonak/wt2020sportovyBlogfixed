function processOpnFrmData(event) {
  //1.prevent normal event (form sending) processing
  event.preventDefault();

  //2. Read and adjust data from the form (here we remove white spaces before and after the strings)
  const Name = document.getElementById("validationCustom01").value;
  const email = document.getElementById("inputEmail3").value;
  const checkBox = document.getElementById("gridCheck1").checked;
  const comment = document.getElementById("exampleFormControlTextarea1").value;
  const klucove = document.getElementById("klucove-vyber").value;
  const priloha = document.getElementById("exampleFormControlFile1").value;
  const radi = document.getElementById("gridRadios1").value;

  //3. Verify the data

  //3. Add the data to the array opinions and local storage
  const newOpinion = {
    Meno: Name,
    Email: email,
    Vyhrame: checkBox,
    Comment: comment,
    Klucove: klucove,
    Priloha: priloha,
    Radi: radi,
    created: new Date()
  };

  let opinions = [];

  if (localStorage.myTreesComments) {
    opinions = JSON.parse(localStorage.myTreesComments);
  }

  opinions.push(newOpinion);
  localStorage.myTreesComments = JSON.stringify(opinions);

  //5. Go to the opinions
  window.location.hash = "#opinions";
}
