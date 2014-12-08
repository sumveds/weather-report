var http = require('http');
var async = require('async');

var express = require('express');
var router = express.Router();

/* GET weather reporting page. */
router.get('/report', function(req, res) {

	var items = [
		{city: "Campbell", state: "CA"},
		{city: "Omaha", state: "NE"},
		{city: "Austin", state: "TX"},
		{city: "Timonium", state: "MD"}
	];

	var reports = [];

	async.each(items, function (item, callback) {
		http.get("http://api.wunderground.com/api/1cac84a45266295a/conditions/q/" + item.state + "/" + item.city + ".json", function(response) {
			var body = '';
        	response.on('data', function(d) {
            	body += d;
        	});
        	response.on('end', function() {
        		var fullWeatherReport = JSON.parse(body);
        		if(fullWeatherReport.current_observation == null) {
        			callback(getError(item, 404, 'Resource not found'));
        		} else {
	        		reports.push(getMinimalWeatherReport(fullWeatherReport));
	        		callback();
        		}
        	});
		}).on('error', function(err) {
			callback(getError(item, 500, 'Internal server error'));
		});
	}, function (err) {
		if(err) {
			res.status(err.status).send(JSON.stringify(
				{
					city: err.city, 
					state: err.state, 
					message: err.message
				})
			);
		} else {
			console.log(JSON.stringify(reports, null, "\t"));
			res.render('weather.jade', { reports: reports, title: 'weather reporting tool' });
		}
	});
});

function getMinimalWeatherReport(fullWeatherReport) {
	var minimalWeatherReport = {
		city: fullWeatherReport.current_observation.display_location.full,
		location: fullWeatherReport.current_observation.display_location.longitude + ', ' + fullWeatherReport.current_observation.display_location.latitude,
		station_id: fullWeatherReport.current_observation.station_id,
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
