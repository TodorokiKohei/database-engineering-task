# データベースエンジニアリング課題


## クエリ
### 都道府県の人口数
最新の人口のみを取得する
```
SELECT ?prefectureLabel ?year ?population ( round (?population / ?japanPopulation * 1000) / 10 AS ?percentage )
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
```

### 都道府県の最高点
最高点となる山とその標高を取得する
```
SELECT ?prefectureLabel ?mountainLabel ?high
WHERE {
  ?prefecture wdt:P31 wd:Q50337;
              wdt:P610 ?mountain.
  ?mountain wdt:P2044 ?high.
  FILTER NOT EXISTS {
    ?prefecture wdt:P31 wd:Q19953632.
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],ja". }
}
```

### 都道府県の面積
面積を取得する
```
SELECT ?prefectureLabel ?area 
WHERE {
  ?prefecture wdt:P31 wd:Q50337;
              wdt:P2046 ?area.
  
  FILTER NOT EXISTS {
    ?prefecture wdt:P31 wd:Q19953632.
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],ja". }
}
```