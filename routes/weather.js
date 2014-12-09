var http = require('http');
var async = require('async');

var express = require('express');
var router = express.Router();

var _db = require('./cities');

router.get('/', function (req, res) {
	res.render('weather', { title: 'Weather reporting tool' });
});

/* GET weather reporting page. */
router.post('/report', function(req, res) {

	var cities = req.body.cities.split(',');

	var data = {};
	var reports = [];
	var errors = [];

	async.each(cities, function (city, callback) {
		console.log("City: " + city + " & State: " + _db[city]);
		var url = "http://api.wunderground.com/api/1cac84a45266295a/conditions/q/" + _db[city] + "/" + city + ".json";
		console.log(url);
		var request = http.get(url, function(response) {
			var body = '';
        	response.on('data', function(d) {
            	body += d;
        	});
        	response.on('end', function() {
        		var fullWeatherReport = JSON.parse(body);
        		if(fullWeatherReport.current_observation == null) {
        			var e = getError({city: city, state: _db[city]}, 404, 'Resource not found');
        			console.error(e);
        			errors.push(city);
        		} else {
	        		reports.push(getMinimalWeatherReport(fullWeatherReport));
        		}
        		callback();
        	});
		});
		request.on('error', function(err) {
			var e = getError({city: city, state: _db[city]}, 500, 'Internal server error');
			console.error(e);
			errors.push(city);
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
			data.errors = errors;
			data.reports = reports;
			console.log(JSON.stringify(data, null, "\t"));
			res.render('report', { data: data, title: 'Weather reporting tool' });
		}
	});
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
