// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const server = express();
server.use(bodyParser.urlencoded({
    extended: true
}));

server.use(bodyParser.json());

const host = 'api.worldweatheronline.com';
const wwoApiKey = 'e533513f7e854fb2973182941180706';

server.post('/get-weather', (req, res) => {
  // Get the city and date from the request
  let city = req.body.result.parameters.city; // city is a required param

  // Get the date for the weather forecast (if present)
  let date = '';
  let date1 = req.body.result.parameters.date;
  if (date1.substr(0,10)) {
    date = date1.substr(0,10);
    console.log('Date: ' + date);
  } else { 
    date = new Date().toJSON().substr(0,10);
    console.log('Date: ' + date);
  }

  if (new Date(date1) > new Date()) {
    date = new Date().toJSON().substr(0,10);
  }

  // Call the weather API
  callWeatherApi(city, date).then((output) => {
    res.json({ 
      'speech': output,
      'displayText': output,
      'source': 'get-weather'
     }); // Return the results of the weather API to Dialogflow
  }).catch(() => {
    res.json({ 'speech': `I don't know the weather but I hope it's good!` });
  });
});

function callWeatherApi (city, date) {
  return new Promise((resolve, reject) => {
    // Create the path for the HTTP request to get the weather
    let path = '/premium/v1/past-weather.ashx?format=json&num_of_days=1&lang=pt' +
      '&q=' + encodeURIComponent(city) + '&key=' + wwoApiKey + '&date=' + date;
    console.log('API Request: ' + host + path);

    // Make the HTTP request to get the weather
    http.get({host: host, path: path}, (res) => {
      let body = ''; // var to store the response chunks
      res.on('data', (d) => { body += d; }); // store each response chunk
      res.on('end', () => {
        // After all the data has been received parse the JSON for desired data
        let response = JSON.parse(body);
        let forecast = response['data']['weather'][0];
        let location = response['data']['request'][0];
        //let conditions = response['data']['current_condition'][0];
        //let currentConditions = conditions['weatherDesc'][0]['value'];
        let hourly = forecast['hourly'];
        let condition06 = hourly[2];
        let temp06 = condition06.tempC;
        let weatherDesc06 = condition06.lang_pt[0]['value'];
        let condition18 = hourly[6];
        let temp18 = condition18.tempC;
        let weatherDesc18 = condition18.lang_pt[0]['value'];


        // Create response
        let output = `PREVISÃO DA DATA ${forecast['date']} para  ${location['query']} É:
        alta de ${forecast['maxtempC']}°C e baixa de ${forecast['mintempC']}°C.
        A temperatura para às 06:00 é ${temp06}°C e espera-se ${weatherDesc06}.
        Para às 18:00, espera-se ${weatherDesc18} com temperatura de ${temp18}°C`;

        // Resolve the promise with the output text
        
        resolve(output);
      });
      res.on('error', (error) => {
        console.log(`Error calling the weather API: ${error}`)
        reject();
      });
    });
  });
}

server.listen((process.env.PORT || 8000), () => {
  console.log("Server is up and running...");
});