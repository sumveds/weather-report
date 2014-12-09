var http = require('http');
var async = require('async');

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
	res.render('weather', { title: 'Weather reporting tool' });
});

/* GET weather reporting page. */
router.post('/report', function(req, res) {

	console.log(req.body);

	var cities = req.body.cities.split(',');

	// console.log(cities);

	/*var _db = [
		{city: "Campbell", state: "CA"},
		{city: "Omaha", state: "NE"},
		{city: "Austin", state: "TX"},
		{city: "Timonium", state: "MD"}
	];*/
	var _db = {
		"Campbell":"CA",
		"Omaha":"NE",
		"Austin":"TX",
		"Timonium":"MD"
	};

	var reports = [];

	async.each(cities, function (city, callback) {
		console.log("City: " + city + " & State: " + _db[city]);
		var url = "http://api.wunderground.com/api/1cac84a45266295a/conditions/q/" + _db[city] + "/" + city + ".json";
		console.log(url);
		http.get(url, function(response) {
			var body = '';
        	response.on('data', function(d) {
            	body += d;
        	});
        	response.on('end', function() {
        		var fullWeatherReport = JSON.parse(body);
        		if(fullWeatherReport.current_observation == null) {
        			callback(getError({city: city, state: _db[city]}, 404, 'Resource not found'));
        		} else {
	        		reports.push(getMinimalWeatherReport(fullWeatherReport));
	        		callback();
        		}
        	});
		}).on('error', function(err) {
			callback(getError({city: city, state: _db[city]}, 500, 'Internal server error'));
		});
	}, function (err) {
		if(err) {
			console.log(err);
			res.status(err.status).send(JSON.stringify(
				{
					city: err.city, 
					state: err.state, 
					message: err.message
				})
			);
		} else {
			console.log(JSON.stringify(reports, null, "\t"));
			res.render('report', { reports: reports, title: 'Weather reporting tool' });
		}
	});

	/*var reports = [
        {
                "city": "Omaha, NE",
                "location": "-95.93376160,41.26331329",
                "weather": "Clear",
                "temperature": "47.6 F (8.7 C)",
                "humidity": "56%"
        },
        {
                "city": "Timonium, MD",
                "location": "-76.65486145,39.43494034",
                "weather": "Overcast",
                "temperature": "32.9 F (0.5 C)",
                "humidity": "63%"
        },
        {
                "city": "Campbell, CA",
                "location": "-121.95592499,37.27999878",
                "weather": "Partly Cloudy",
                "temperature": "66.9 F (19.4 C)",
                "humidity": "71%"
        },
        {
                "city": "Austin, TX",
                "location": "-97.74169922,30.27115822",
                "weather": "Clear",
                "temperature": "62.8 F (17.1 C)",
                "humidity": "66%"
        }
	];
	res.render('report', { reports: reports, title: 'Weather reporting tool' });*/
});

router.all('/', function(req, res) {
	res.render('error', { title: 'URL not supported' });
});

function getMinimalWeatherReport(fullWeatherReport) {
	var minimalWeatherReport = {
		city: fullWeatherReport.current_observation.display_location.full,
		location: fullWeatherReport.current_observation.display_location.longitude + ',' + fullWeatherReport.current_observation.display_location.latitude,
		weather: fullWeatherReport.current_observation.weather,
		temperature: fullWeatherReport.current_observation.temperature_string,
		humidity: fullWeatherReport.current_observation.relative_humidity
	}

	return minimalWeatherReport;
}

function getError(item, statusCode, message) {
	var err = new Error(message);
	err.status = statusCode;
	err.city = item.city;
	err.state = item.state;

	return err;
}

module.exports = router;
