import { render } from "mustache";

//an array, defining the routes

export default[

    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },

    {
        hash:"articles",
        target:"router-view",
        getTemplate: fetchAndDisplayArticles
    },


    {
        hash:"opinions",
        target:"router-view",
        getTemplate: createHtml4opinions
    },

    {
        hash:"addOpinion",
        target:"router-view",
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML
    },

    {
        hash:"clanok2",
        target:"router-view",
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("clanok2").innerHTML
    },

    {
        hash:"article",
        target:"router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },

    {
        hash:"artEdit",
        target:"router-view",
        getTemplate: editArticle
    },

    {
        hash:"addpost",
        target:"router-view",
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addpost").innerHTML
    }

];

const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;

function createHtml4opinions(targetElm){
    const opinionsFromStorage=localStorage.myTreesComments;
    let opinions=[];

    if(opinionsFromStorage){
        opinions=JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn = opinion.willReturn?"I will return to this page.":"Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );
}

const serverUrl = "http://wt.kpi.fei.tuke.sk/api/article";

//length of the content preview strings
const previewStringLenght=200;

const articlesElm = document.getElementById("router-view");
const errorElm = document.getElementById("template-articles-error");


let tmpHtmlElm2CreatePreview = document.createElement("div");

let articleList =[];


function errorHandler(error) {
    errorElm.innerHTML=`Error reading data from the server. ${error}`; //write an error message to the page
}

function renderArticles(articles) {
    articlesElm.innerHTML=render(document.getElementById("template-articles").innerHTML, articles); //write some of the response object content to the page using Mustache
}

function fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash){

    const offset=Number(offsetFromHash);
    const totalCount=Number(totalCountFromHash);

    let urlQuery = "";

    if (offset && totalCount){
        urlQuery=`?offset=${offset}&max=${articlesPerPage}`;
    }else{
        urlQuery=`?max=${articlesPerPage}`;
    }

    const url = `${urlBase}/article${urlQuery}`;


    fetch(url)  //there may be a second parameter, an object wih options, but we do not need it now.
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{
                return Promise.reject(new Error(`Failed to access the list of articles. Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
            }
        })
        .then(responseJSON => {
            addArtDetailLink2ResponseJson(responseJSON);
            articleList=responseJSON.articles;
            console.log(JSON.parse(JSON.stringify(articleList)));
            return Promise.resolve();
        })
        .then( ()=> {
            let cntRequests = articleList.map(
                article => fetch(`${serverUrl}/${article.id}`)
            );

            return Promise.all(cntRequests);
        })
        .then(responses =>{
            let failed="";
            for(let response of responses) {
                if(!response.ok) failed+=response.url+" ";
            }
            if(failed===""){
                return responses;
            }else{
                return Promise.reject(new Error(`Failed to access the content of the articles with urls ${failed}.`));
            }
        })
        .then(responses => Promise.all(responses.map(resp => resp.json())))
        .then(articles => {
            articles.forEach((article,index) =>{
                tmpHtmlElm2CreatePreview.innerHTML=article.content;
                articleList[index].contentPrev=tmpHtmlElm2CreatePreview.textContent.substring(0,previewStringLenght)+"...";

            });
            console.log(JSON.parse(JSON.stringify(articleList)));
            return Promise.resolve();
        })
        .then( () => {
            let commRequests = articleList.map(
                article => fetch(`${serverUrl}/${article.id}/comment`)
            );
            return Promise.all(commRequests)
        })
        .then(responses =>{
            let failed="";
            for(let response of responses) {
                if(!response.ok) failed+=response.url+" ";
            }
            if(failed===""){
                return responses;
            }else{
                return Promise.reject(new Error(`Failed to access the comments with urls ${failed}.`));
            }
        })
        .then(responses => Promise.all(responses.map(resp => resp.json())))
        .then(comments => {
            comments.forEach((artComments,index) =>{
                articleList[index].comments=artComments.comments;
            });

            return Promise.resolve();
        }).then( () =>{
        renderArticles(articleList);
    })
        .catch(error => errorHandler && errorHandler(error));

}


function addArtDetailLink2ResponseJson(responseJSON){
    responseJSON.articles =
        responseJSON.articles.map(
            article =>(
                {
                    ...article,
                    detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
                }
            )
        );
}

function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,false);
}


/**
 * Gets an article record from a server and processes it to html according to the value of the forEdit parameter.
 * Assumes existence of the urlBase global variable with the base of the server url (e.g. "https://wt.kpi.fei.tuke.sk/api"),
 * availability of the Mustache.render() function and Mustache templates with id="template-article" (if forEdit=false)
 * and id="template-article-form" (if forEdit=true).
 * @param targetElm - id of the element to which the acquired article record will be rendered using the corresponding template
 * @param artIdFromHash - id of the article to be acquired
 * @param offsetFromHash - current offset of the article list display to which the user should return
 * @param totalCountFromHash - total number of articles on the server
 * @param forEdit - if false, the function renders the article to HTML using the template-article for display.
 *                  If true, it renders using template-article-form for editing.
 */
function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash,forEdit) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            if(forEdit){
                responseJSON.formTitle="Article Edit";
                responseJSON.formSubmitCall =
                    `processArtEditFrmData(event,${artIdFromHash},${offsetFromHash},${totalCountFromHash},'${urlBase}')`;
                responseJSON.submitBtTitle="Save article";
                responseJSON.urlBase=urlBase;

                responseJSON.backLink=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
            }else{

                responseJSON.backLink=`#articles/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink=`#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink=`#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
            }

        })
        .catch (error => { ////here we process all the failed promises
            const errMsgObj = {errMessage:error};
            document.getElementById(targetElm).innerHTML =
                render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });

}

function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,true);
}




function addNewArticle(outputEmlId, urlBase) {

    window.alert(urlBase);
    window.alert(outputEmlId);

    const articleElm = document.getElementById(outputEmlId);

    //1. Gather and check the form data

    const newArtData = {
        title: document.getElementById("title2").value.trim(),
        content: document.getElementById("content2").value.trim(),
        author: document.getElementById("author2").value.trim()
    };

    if (!(newArtData.title && newArtData.content)) {
        window.alert("Please, enter article title and content");
        return;
    }

    if (!newArtData.author) {
        newArtData.author = "Anonymous";
    }

    const postReqSettings = //an object wih settings of the request
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
            },
            body: JSON.stringify(newArtData)
        };

    fetch(`${urlBase}/article`, postReqSettings)  //now we need the second parameter, an object wih settings of the request.
        .then(response => {      //fetch promise fullfilled (operation completed successfully)
            if (response.ok) {    //successful execution includes an error response from the server. So we have to check the return status of the response here.
                return response.json(); //we return a new promise with the response data in JSON to be processed
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`)); //we return a rejected promise to be catched later
            }
        })
        .then(responseJSON => { //here we process the returned response data in JSON ...
            articleElm.innerHTML =
                `
                    <h2>Article successfully posted with id=${responseJSON.id}</h2>
                    <h3>${responseJSON.title}</h3><div>${responseJSON.content}
                `;
            console.log(responseJSON);
        })
        .catch(error => { ////here we process all the failed promises
            articleElm.innerHTML =
                `
                    <h2>Error reading data from the server</h2>
                    ${error}
                `;
        });
}