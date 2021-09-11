document.addEventListener('DOMContentLoaded', async function () {
    console.log('Hello!');
    console.log('config', config);
    console.log('places', places);
    
    var visitList = [];
    if(localStorage.getItem('visitList') !== null){
      visitList = localStorage.getItem('visitList');
    }

    var showDislikeFood = document.getElementById('dislike-food');
    var outputDislikeFood = "";
    var mainDish = []
    for(let i = 0; i < places.length; i++) {
      if (!(mainDish.includes(places[i].main_dish))) outputDislikeFood += `<input type='checkbox' id=${places[i].main_dish} /><label for=${places[i].main_dish}>${places[i].main_dish}</label><br>`;
      mainDish.push(places[i].main_dish);
    }
    showDislikeFood.innerHTML = outputDislikeFood;

    var resultArea = document.getElementById('result-area');

    var placesKey = Object.keys(places[0]);
    var outputStoreHTML = "<table border='1'>";

    var detail = ["来店歴", "店名", "各店舗のジャンル", "メイン料理", "最大人数", "パーティション", "テイクアウト", "座席間隔", "時間制限", "人数制限", "予算", "電話番号", "最寄り駅","最寄り駅からの時間(分)"];
    outputStoreHTML += "<tr>";
    for (let j = 0; j < detail.length; j++) {
      outputStoreHTML += "<th>" + detail[j] + "</th>";
    }

    outputStoreHTML += "</tr>";
    for(let i = 0; i < places.length; i++) {
      outputStoreHTML += "<tr>";
      if (visitList.includes(places[i].tel)) {
        outputStoreHTML += "<td>" + `<input type='checkbox' id=${places[i].tel} checked><label for="${places[i].tel}"></label>` + "</td>"; // ここに来店歴のチェックボックス
      } else {
        outputStoreHTML += "<td>" + `<input type='checkbox' id=${places[i].tel}><label for="${places[i].tel}"></label>` + "</td>";
      }
      for (let j = 0; j < 10; j++) {
        outputStoreHTML += "<td>" + places[i][placesKey[j]] + "</td>";
      }
      outputStoreHTML += "<td>" + places[i]['tel'] + "</td>";
      var nearestStation = await routeSearcher(i);
      outputStoreHTML += "<td>" + nearestStation + "</td>";

      var timeWalk = await routeCalcTime(i);
      outputStoreHTML += "<td>" + timeWalk + "</td>";

      outputStoreHTML += "</tr>";
    }

    outputStoreHTML += "</table>";

    resultArea.innerHTML = outputStoreHTML;
  });

    /*
    var placesName = [];
    for(let i = 0; i < places.length; i++) {
      placesName[i] = places[i].name;
    }
    console.log(placesName);
    */

    // 改行やインデントを入れた文字列に変換
    // var resultStr = JSON.stringify(route, null, 2);

    // 文字列の改行 -> HTMLにおける改行(<br>)
    // インデント入れるのに使われている半角スペース -> とりあえずHTMLで表示されるスペース
    // resultArea.innerHTML = resultStr.replace(/\n/g, '<br>').replace(/\ /g, '&nbsp;&nbsp;');




async function showCalcTime() {
    var inputStationNameList = []
    inputStationNameList.push(document.getElementById('station-name-1').value);
    inputStationNameList.push(document.getElementById('station-name-2').value);
    inputStationNameList.push(document.getElementById('station-name-3').value);
    inputStationNameList.push(document.getElementById('station-name-4').value);
    console.log(inputStationNameList);

    var resultArea = document.getElementById('result-area');

    var budget = Number(document.getElementById('budget').value);
    var kind = document.getElementById('kind').value;

    var isPartition = document.getElementById('partition').value;
    var isSeatDistance = document.getElementById('seat-distance').value;
    var isTimeLimit = document.getElementById('time-limit').value;
    var isLimitNumPeople = document.getElementById('limit-num-people').value;

    var outputStoreHTML = "<table border='1'>";

    var detail = ["来店歴","店名", "各店舗のジャンル", "メイン料理", "最大人数", "パーティション", "テイクアウト", "座席間隔", "時間制限", "人数制限", "予算", "電話番号", "最寄り駅","最寄り駅からの時間(分)","総所要時間(分)"];

    var mainDish = [] //メイン料理のリスト(重複なし)
    for (let i = 0; i < places.length; i++) {
      if (!(mainDish.includes(places[i].main_dish))) mainDish.push(places[i].main_dish);
    }
    var dislikeMainDish = [];
    for(let i = 0; i < mainDish.length; i++) {
      if(document.getElementById(`${mainDish[i]}`).checked) dislikeMainDish.push(mainDish[i]);
    }

    var storeDataList = [];

    var visitList = [];
    if(localStorage.getItem('visitList') !== null){
      visitList = localStorage.getItem('visitList');
    }

    for (let i = 0; i < places.length; i++) {
      var timeSum = 0;
      var nearestStation = await routeSearcher(i);
      for (let j = 0; j < inputStationNameList.length; j++) {
          if (inputStationNameList[j] != '') {
            timeSum += await routeStationCalcTime(inputStationNameList[j], nearestStation) + await routeCalcTime(i);
          }
      }

      if(isPartition=="あり" && places[i].partition!=isPartition) continue;
      if(isSeatDistance=="1" && places[i].seat_distance < 0.6) continue;
      if(isTimeLimit=="1" && places[i].time_limit == 0) continue;
      if(isLimitNumPeople=="1" && places[i].limit_num_people == 0) continue;

      if (budget == 3000 && budget < places[i].price) continue;
      if (budget == 3001 && budget >= places[i].price) continue;

      if (kind != "0" && kind != places[i].kind) continue;

      //嫌いな料理を省く
      if(dislikeMainDish.includes(places[i].main_dish)) continue;

      //感染対策のスコアを計算
      var score = 0;
      if (places[i].partition=="あり") score += 16;
      if (places[i].seat_distance >= 0.6) score += 8;
      if (places[i].time_limit != 0) score += 4;
      if (places[i].limit_num_people != 0) score += 2;
      if (places[i]. max_num_people > 30) score += 1;

      var visited = 0;
      if(visitList.includes(places[i].tel)) {
        visited = 1;
      }


      var timeWalk = await routeCalcTime(i);
      //departureTimeの計算


      var storeData = {
        "name": places[i].name,
        "kind": places[i].kind,
        "main_dish": places[i].main_dish,
        "max_num_people": places[i].max_num_people,
        "partition": places[i].partition,
        "takeout": places[i].takeout,
        "seat_distance": places[i].seat_distance,
        "time_limit": places[i].time_limit,
        "limit_num_people": places[i].limit_num_people,
        "price": places[i].price,
        "tel": places[i].tel,
        "nearestStation": nearestStation,
        "timeWalk": timeWalk,
        "timeSum": timeSum,
        "score": score,
        "visited": visited,
      };
      storeDataList.push(storeData);
    }

    var isVisited = document.getElementById('is-visited').checked;

    console.log(storeDataList);
    // if( array.length === 0 )
    if(storeDataList.length===0) {
      outputStoreHTML = "<p>該当する店舗はありません。</p>";
      resultArea.innerHTML = outputStoreHTML;
    }else {
      var sortAlgorithm = document.getElementById('sort-algorithm').value;

      if (sortAlgorithm=="1"){
        storeDataList.sort(function(a, b){

            if(isVisited) {
              if(a.visited < b.visited) return -1;
              if(a.visited > b.visited) return 1;
            }

            // 感染対策順で並び替え
            if(a.score < b.score) return 1;
            if(a.score > b.score) return -1;

            if(a.timeSum < b.timeSum) return -1;
            if(a.timeSum > b.timeSum) return 1;

            return 0;
        });
      } else{
        storeDataList.sort(function(a, b){

            if(isVisited) {
              if(a.visited < b.visited) return -1;
              if(a.visited > b.visited) return 1;
            }

            // かかる時間順で並び替え
            if(a.timeSum < b.timeSum) return -1;
            if(a.timeSum > b.timeSum) return 1;

            if(a.score < b.score) return 1;
            if(a.score > b.score) return -1;

            return 0;
        });
      }


      var placesKey = Object.keys(storeDataList[0]);
      //console.log(storeDataList);
      outputStoreHTML += "<tr>";
      for (let j = 0; j < detail.length; j++) {
        outputStoreHTML += "<th>" + detail[j] + "</th>";
      }

      outputStoreHTML += "</tr>";
      for(let i = 0; i < storeDataList.length ; i++) { 
        outputStoreHTML += "<tr>";
        if (visitList.includes(storeDataList[i].tel)) {
          outputStoreHTML += "<td>" + `<input type='checkbox' id=${storeDataList[i].tel} checked><label for="${storeDataList[i].tel}"></label>` + "</td>"; // ここに来店歴のチェックボックス
        } else {
          outputStoreHTML += "<td>" + `<input type='checkbox' id=${storeDataList[i].tel}><label for="${storeDataList[i].tel}"></label>` + "</td>";
        }
        for (let j = 0; j < detail.length - 1; j++) {
          outputStoreHTML += "<td>" + storeDataList[i][placesKey[j]] + "</td>";
        }
      outputStoreHTML += "</tr>";
      }

      outputStoreHTML += "</table>";

      resultArea.innerHTML = outputStoreHTML;

    }

  }

function saveVisitData() {
  var visitList = [];
  for(let i = 0; i < places.length; i++) {
    if(document.getElementById(`${places[i].tel}`).checked) visitList.push(places[i].tel);
  }
  localStorage.setItem('visitList', visitList);
  alert('来店歴を保存しました');
}