let areas = [
    { code: 1, name: "北海道" },
    { code: 2, name: "青森" },
    { code: 3, name: "岩手" },
    { code: 4, name: "宮城" },
    { code: 5, name: "秋田" },
    { code: 6, name: "山形" },
    { code: 7, name: "福島" },
    { code: 8, name: "茨城" },
    { code: 9, name: "栃木" },
    { code: 10, name: "群馬" },
    { code: 11, name: "埼玉" },
    { code: 12, name: "千葉" },
    { code: 13, name: "東京" },
    { code: 14, name: "神奈川" },
    { code: 15, name: "新潟" },
    { code: 16, name: "富山" },
    { code: 17, name: "石川" },
    { code: 18, name: "福井" },
    { code: 19, name: "山梨" },
    { code: 20, name: "長野" },
    { code: 21, name: "岐阜" },
    { code: 22, name: "静岡" },
    { code: 23, name: "愛知" },
    { code: 24, name: "三重" },
    { code: 25, name: "滋賀" },
    { code: 26, name: "京都" },
    { code: 27, name: "大阪" },
    { code: 28, name: "兵庫" },
    { code: 29, name: "奈良" },
    { code: 30, name: "和歌山" },
    { code: 31, name: "鳥取" },
    { code: 32, name: "島根" },
    { code: 33, name: "岡山" },
    { code: 34, name: "広島" },
    { code: 35, name: "山口" },
    { code: 36, name: "徳島" },
    { code: 37, name: "香川" },
    { code: 38, name: "愛媛" },
    { code: 39, name: "高知" },
    { code: 40, name: "福岡" },
    { code: 41, name: "佐賀" },
    { code: 42, name: "長崎" },
    { code: 43, name: "熊本" },
    { code: 44, name: "大分" },
    { code: 45, name: "宮崎" },
    { code: 46, name: "鹿児島" },
    { code: 47, name: "沖縄" }
]

let mapSettings = {
    height: '75%',
    skew: '10',
    showRoundedPrefecture: true,
    prefectureBackgroundColor: '#62B34C',
    prefectureBackgroundHoverColor: '#95A834',
    prefectureRadius: '15px',
    areas: areas,
    onHover: function(e, data){
        html = `<div>${data.name}</div>\n`
        if (data.option.number) {
            html += `<strong>${data.option.hoverText}</strong>\n`
        }
        $(this).html(html);
    },
    onMouseout: function(e, data){
        $(this).html(`<div>${data.name}</div>`);
    },
    onSelect: function(e, data) {
        $('#prefectureModal').find('#modalLabel')
        .text(`${data.name}(${data.alphabet})`)
        .end().find('.modal-body')
        .html(data.option.selectHTML)
        .end().modal('show');
    }
}

function clearMapSettings(){
    for (area of areas) {
        delete area['number']
        delete area['hoverText']
        delete area['selectHTML']
        delete area['color']
        delete area['fontColor']
    }
    mapSettings['showHeatmap'] = false
    mapSettings['showHeatlabel'] = false
}

function enableHeatmap(unit){
    mapSettings['showHeatmap'] = true
    mapSettings['heatmapLabelUnit'] = unit
    mapSettings['showHeatlabel'] = true
}


function reloadMap() {
    $('#jmap').jmap('update').empty();
    $('#jmap').jmap(mapSettings);
}

function runQuery(query) {
    let endpoint = 'https://query.wikidata.org/sparql?';
    let settings = {
        headers: {
            Accept: 'application/sparql-results+json'
        },
        data: { query: query }
    }
    return $.ajax(endpoint, settings)
}


// 人口割合を描画
function viewPopulation() {
    let query = `
SELECT ?prefecture ?prefectureLabel ?year ?population ( round (?population / ?japanPopulation * 1000) / 10 AS ?percentage )
WHERE {
  ?prefecture wdt:P31 wd:Q50337;
              wdt:P1082 ?population.
  ?prefecture p:P1082 [pq:P585 ?year].
  wd:Q17 wdt:P1082 ?japanPopulation.
  
  FILTER NOT EXISTS {
    ?prefecture wdt:P31 wd:Q19953632.
  }
  FILTER (?prefecture = ?p && ?year = ?recentYear)
  {
    SELECT ?p ( MAX(?y) as ?recentYear)
    WHERE {
      ?p wdt:P31 wd:Q50337.
      ?p p:P1082 [pq:P585 ?y].
    FILTER NOT EXISTS {
      ?p wdt:P31 wd:Q19953632.
    }
    }
    GROUP BY ?p
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],ja". }
}
    `
    return runQuery(query).then(
        function (data) {
            let results = data["results"]["bindings"];
            let prefectureData = {}
            for (let i = 0; i < results.length; i++) {
                prefectureLabel = results[i]["prefectureLabel"]["value"].replace(/県|府|都$/, '')
                prefectureValue = parseFloat(results[i]["percentage"]["value"])
                prefectureData[prefectureLabel] = { 
                    "number": prefectureValue,
                    "hoverText": prefectureValue + " %",
                    "selectHTML": `
                        <p>人口(Population): <strong>${Number(results[i]["population"]["value"]).toLocaleString()} [人]</strong></p>
                        <p>人口割合(PopulationPercentage): <strong>${results[i]["percentage"]["value"]} [%]</strong></p>
                        <p>集計された日(AggregatedDate): <strong>${results[i]["year"]["value"]}</strong></p>
                        <p>Wikidata: 
                        <a href="${results[i]["prefecture"]["value"]}" target="_blank">
                            ${results[i]["prefecture"]["value"]}
                        </a></p>
                    `,
                }
            }
            for (area of areas) {
                area['number'] = prefectureData[area['name']]['number']
                area['hoverText'] = prefectureData[area['name']]['hoverText']
                area['selectHTML'] = prefectureData[area['name']]['selectHTML']
            }
            enableHeatmap('%')
        })
}


// 最高点を描画
function viewHightestPoint() {
    let query = `
SELECT ?prefecture ?prefectureLabel ?mountain ?mountainLabel ?high
WHERE {
    ?prefecture wdt:P31 wd:Q50337;
                wdt:P610 ?mountain.
    ?mountain wdt:P2044 ?high.
    FILTER NOT EXISTS {
    ?prefecture wdt:P31 wd:Q19953632.
    }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],ja". }
}    
    `
    return runQuery(query).then(
        function (data) {
            let results = data["results"]["bindings"];
            let prefectureData = {}
            for (let i = 0; i < results.length; i++) {
                prefectureLabel = results[i]["prefectureLabel"]["value"].replace(/県|府|都$/, '')
                prefectureValue = parseInt(results[i]["high"]["value"])
                prefectureData[prefectureLabel] = { 
                    "number": prefectureValue,
                    "hoverText": prefectureValue.toLocaleString() + " m",
                    "selectHTML": `
                        <p>最高点(HighestPoint): <strong>${prefectureValue.toLocaleString()} [m]</strong></p>
                        <p>山(Mountain): 
                        <a href="${results[i]["mountain"]["value"]}" target="_blank">
                            ${results[i]["mountainLabel"]["value"]}
                        </a>
                        </p>
                        <p>Wikidata: 
                        <a href="${results[i]["prefecture"]["value"]}" target="_blank">
                            ${results[i]["prefecture"]["value"]}
                        </a>
                        </p>
                `,
                }
            }
            for (area of areas) {
                area['number'] = prefectureData[area['name']]['number']
                area['hoverText'] = prefectureData[area['name']]['hoverText']
                area['selectHTML'] = prefectureData[area['name']]['selectHTML']
            }
            enableHeatmap('m')
        })
}


// 面積を描画
function viewArea() {
    let query = `
SELECT ?prefecture ?prefectureLabel ?area 
WHERE {
    ?prefecture wdt:P31 wd:Q50337;
                wdt:P2046 ?area.
    
    FILTER NOT EXISTS {
    ?prefecture wdt:P31 wd:Q19953632.
    }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],ja". }
}
    `
    return runQuery(query).then(
        function (data) {
            let results = data["results"]["bindings"];
            let prefectureData = {}
            for (let i = 0; i < results.length; i++) {
                prefectureLabel = results[i]["prefectureLabel"]["value"].replace(/県|府|都$/, '')
                prefectureValue = parseInt(results[i]["area"]["value"])
                prefectureData[prefectureLabel] = { 
                    "number": prefectureValue,
                    "hoverText": prefectureValue.toLocaleString() + " Km^2",
                    "selectHTML": `
                        <p>面積(Area): <strong>${prefectureValue.toLocaleString()} [Km^2]</strong></p>
                        <p>Wikidata: 
                        <a href="${results[i]["prefecture"]["value"]}" target="_blank">
                            ${results[i]["prefecture"]["value"]}
                        </a>
                        </p>
                `,
                }
            }
            for (area of areas) {
                area['number'] = prefectureData[area['name']]['number']
                area['hoverText'] = prefectureData[area['name']]['hoverText']
                area['selectHTML'] = prefectureData[area['name']]['selectHTML']
            }
            enableHeatmap('Km^2')
        })
}

function clickView() {
    $('#view').prop('disabled', true);
    let val = $('#statistics').val()
    if (val == 'population') {
        viewPopulation().then(reloadMap)
    } else if (val == 'hightest-point') {
        viewHightestPoint().then(reloadMap)
    } else if (val == 'area') {
        viewArea().then(reloadMap)
    } else {
        clearMapSettings()
        reloadMap()
    }
    $('#view').prop('disabled', false);
}

$(document).ready(function () {
    $('#jmap').jmap(mapSettings);
    $('#view').click(clickView)
});