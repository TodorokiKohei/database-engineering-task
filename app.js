
function loadStatistic() {
    let endpoint = 'https://query.wikidata.org/sparql?';
    let query = "SELECT ?prefectureLabel ?population ( round (?population / ?japanPopulation * 1000) / 10 AS ?percentage )\n" + 
    "WHERE {\n" + 
      "?prefecture wdt:P31 wd:Q50337;\n" + 
                  "wdt:P1082 ?population.\n" + 
      "wd:Q17 wdt:P1082 ?japanPopulation.\n" + 
      "FILTER NOT EXISTS {\n" + 
        "?prefecture wdt:P31 wd:Q19953632.\n" + 
      "}\n" + 
      "SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],ja\". }\n" + 
    "}"
    let settings = {
        headers: { 
            Accept: 'application/sparql-results+json'
        },
        data : { query : query}
    }
    $.ajax( endpoint, settings ).then( function ( data ) {
        let results = data["results"]["bindings"];
        for (let i = 0; i < results.length; i++) {
          console.log(results[i]["prefectureLabel"]["value"]);
          console.log(results[i]["population"]["value"]);
          console.log(results[i]["percentage"]["value"]);
        }
    });

}

$(document).ready(function() {
    loadStatistic()
    $('#jmap').jmap();
});