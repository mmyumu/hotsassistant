// Copyright 2016, Google, Inc.
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

process.env.DEBUG = 'actions-on-google:*';
const { DialogflowApp } = require('actions-on-google');
const functions = require('firebase-functions');

const HERO_PARAM = 'hero';

// API.AI Intent names
const HERO_INFO_INTENT = 'hotsassistant.heroInfo';
const REASON_INTENT = 'hotsassistant.reason';
const MAP_INFO_INTENT = 'hotsassistant.mapInfo';

const COUNTER_ACTION = 'contrer';
const SYNERGIE_ACTION = 'synergie';

const FORT_LEVEL = 'fort';
const FAIBLE_LEVEL = 'faible';

const DATABASE_FILE = 'db.json';

var fs = require('fs');
var formatMessage = require('format-message');
var speechPatterns = require('./speechPatterns.js');

exports.hotsassistant = functions.https.onRequest((request, response) => {
	const app = new DialogflowApp({request, response});
	console.log('Request headers: ' + JSON.stringify(request.headers));
	console.log('Request body: ' + JSON.stringify(request.body));

	const lang = request.body.lang;
	
	// Fulfill action business logic
	function heroInfo(app) {
		fs.readFile(DATABASE_FILE, 'utf8', (err, contents) => {
			if (err) {
				return console.log(err);
			}
			var root = JSON.parse(contents);
			
			var heroName = request.body.result.parameters.hero;
			var action = request.body.result.parameters.action;

			var heroKey = heroName.toLowerCase();
			
			
			if(action == COUNTER_ACTION) {
				var heroes = root.heroes[heroKey].counters;
				var speechPattern = speechPatterns.get(lang).counter;
			} else if(action == SYNERGIE_ACTION) {
				var heroes = root.heroes[heroKey].synergies;
				var speechPattern = speechPatterns.get(lang).synergie;
			} else {
				return app.ask(formatMessage(speechPatterns.get(lang).error, {action:action}));
			}
				
			var heroesAsString = heroes.map(elem => elem.name).join(', ');
			var msg = formatMessage(speechPattern, { hero: heroName, count:heroes.length, heroes: heroesAsString});
			app.ask(msg);
		});
	}
  
	function reason(app) {
		fs.readFile(DATABASE_FILE, 'utf8', (err, contents) => {
			if (err) {
				return console.log(err);
			}
			var root = JSON.parse(contents);
			
			var heroName = request.body.result.parameters.hero;
			var action = request.body.result.parameters.action;
			
			var heroKey = heroName.toLowerCase();	
			
			if(action == COUNTER_ACTION) {
				var reason = root.heroes[heroKey].counterReason;
			} else if(action == SYNERGIE_ACTION) {
				var reason = root.heroes[heroKey].synergieReason;
			} else {
				return app.ask(formatMessage(speechPatterns.get(lang).error, {action:action}));
			}

			app.ask(reason);
		});
	}
  
	function mapInfo(app) {
		fs.readFile(DATABASE_FILE, 'utf8', (err, contents) => {
			if (err) {
				return console.log(err);
			}
			var root = JSON.parse(contents);
			
			var heroName = request.body.result.parameters.hero;
			var level = request.body.result.parameters.level;

			var heroKey = heroName.toLowerCase();
			
			
			if(level == FORT_LEVEL) {
				var maps = root.heroes[heroKey].mapsStronger;
			} else if(level == FAIBLE_LEVEL) {
				var maps = root.heroes[heroKey].mapsWeaker;
			} else {
				return app.ask(formatMessage(speechPatterns.get(lang).error, {level:level}));
			}
				
			var mapsAsString = maps.map(elem => elem.name).join(', ');
			var levelAsString = formatMessage(speechPatterns.get(lang).level, {level: level});
			var msg = formatMessage(speechPatterns.get(lang).map, { hero: heroName, level:levelAsString , count:maps.length, maps: mapsAsString});
			app.ask(msg);
		});
	}

	const actionMap = new Map();
	actionMap.set(HERO_INFO_INTENT, heroInfo);
	actionMap.set(REASON_INTENT, reason);
	actionMap.set(MAP_INFO_INTENT, mapInfo);

	app.handleRequest(actionMap);
});
