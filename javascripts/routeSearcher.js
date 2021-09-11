async function routeSearcher(index) {
    var url = config.ekispert.url + '/v1/json/geo/station';
    var params = {
        key: config.ekispert.key,
        geoPoint: places[index].lat + ',' + places[index].lng,
        type: "train",
        gcs: "wgs84"
    };

    var response = await axios.get(url, { params: params });
    // console.log('ResultSet2', response.data.ResultSet);
    var nearestStation = response.data.ResultSet.Point.Station.Name;
    return nearestStation;
}

async function routeCalcTime(index) {
    var url = config.ekispert.url + '/v1/json/geo/station';
    var params = {
        key: config.ekispert.key,
        geoPoint: places[index].lat + ',' + places[index].lng,
        type: "train",
        gcs: "wgs84"
    };

    var response = await axios.get(url, { params: params });

    var distance = response.data.ResultSet.Point.Distance;
    // 秒速 4/3 m  分速 80m 時速 4.8 km
    var speed = 80;
    var minute = Math.floor(distance / speed) + 1 ;

    return minute;
}

async function routeStationCalcTime(from_station, to_station) {
    var url = config.ekispert.url + '/v1/json/search/course/extreme';
    var params = {
        key: config.ekispert.key,
        viaList: from_station + ":" + to_station,
        gcs: "wgs84"
    };

    if(from_station == to_station){
        return 0;
    }

    // console.log(from_station + ":" + to_station)

    var response = await axios.get(url, { params: params });

    var timeOnBoard = response.data.ResultSet.Course[0].Route.timeOnBoard;
    //console.log(timeOnBoard);
    if (!(timeOnBoard instanceof Array)) timeOnBoard = [timeOnBoard];

    return Number(timeOnBoard[0]);

}

//大学からレストランまでの総時間を計算
async function routeSumCalcTime(restaurant) {
    var url = config.ekispert.url + '/v1/json/search/course/extreme';
    var params = {
        key: config.ekispert.key,
        viaList: "35.688306,139.738639" + ":" + restaurant,
        gcs: "wgs84"
    };

    console.log(params.viaList);
    // console.log(from_station + ":" + to_station)

    var response = await axios.get(url, { params: params });

    var timeOnBoard = response.data.ResultSet.Course[0].Route.timeOnBoard;
    var timeWalk = response.data.ResultSet.Course[0].Route.timeWalk;
    var timeOther = response.data.ResultSet.Course[0].Route.timeOther;
    
    var timeSum = Number(timeWalk) + Number(timeWalk) + Number(timeWalk);

    return timeSum;

}

//入力: 出発(大学 or 指定した駅)の座標と目的地(レストラン)の座標 出力:出発する時刻 関数
async function routeDepartureTime( fromCoordinate,restaurant, arrivalTime) {
    var url = config.ekispert.url + '/v1/json/search/course/extreme';
    var params = {
        key: config.ekispert.key,
        viaList: fromCoordinate + ":" + restaurant,
        time: arrivalTime,
        searchType: "arrival",
        gcs: "wgs84"
    };
    // console.log(from_station + ":" + to_station)
    var response = await axios.get(url, { params: params });
    console.log(params)
    console.log(response);

    var course = response.data.ResultSet.Course;
    if (!(course instanceof Array)) course = [course];

    var departureTime = course[0].Route.Line[0].DepartureState.Datetime.text;
    //console.log(response.data.ResultSet.Course[0].Route.Line);

    return departureTime;

}

async function findNearStations() {
    var url = config.ekispert.url + '/v1/json/geo/station';
    var params = {
        key: config.ekispert.key,
        geoPoint: "35.688306,139.738639,1500",
        type: "train",
        gcs: "wgs84"
    };

    var response = await axios.get(url, { params: params });
    var nearStationList = [];
    for(let i = 0; i < response.data.ResultSet.Point.length; i++) nearStationList.push(response.data.ResultSet.Point[i].Station.Name);
    // console.log(nearStationList);
    return nearStationList;
}
