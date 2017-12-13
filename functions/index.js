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

const COUNTER_PATTERN = 'counter';
const SYNERGIE_PATTERN = 'synergie';
const MAP_PATTERN = 'map';
const LEVEL_PATTERN = 'level';
const ERROR_PATTERN = 'error';

var speechPatterns = { "fr": {}, "en":{}};
speechPatterns['fr'][COUNTER_PATTERN] = `{
   count, plural,
	=0 {Il n'y a pas de contre de {hero}.}
	one {Le contre de {hero} est {heroes}}
	other {Les contres de {hero} sont {heroes}}
}`;
speechPatterns['fr'][SYNERGIE_PATTERN] = `{
	count, plural,
	=0 {{hero} n'a de synergie avec aucun autre héro.}
	other {{hero} a une synergie avec {heroes}}
}`;
speechPatterns['fr'][MAP_PATTERN] = `{
	count, plural,
	=0 {Il n'y a pas de {level} map pour {hero}.}
	one{La {level} map de {hero} est {maps}.}
	other {Les {level}s maps de {hero} sont {maps}}
}`;
speechPatterns['fr'][LEVEL_PATTERN] = ` {
	level, select,
	fort {bonne}
	faible {mauvaise}
	other {level}
}`;
speechPatterns['fr'][ERROR_PATTERN] = `Je ne comprends pas ce que vous voulez dire par {action}`;

speechPatterns['en'][COUNTER_PATTERN] = `{
   count, plural,
	=0 {There is no counter for {hero}.}
	one {The counter for {hero} is {heroes}}
	other {The counters for {hero} are {heroes}}
}`;
speechPatterns['en'][SYNERGIE_PATTERN] = `{
	count, plural,
	=0 {{hero} has no synergy.}
	other {{hero} has synergy with {heroes}}
}`;
speechPatterns['en'][MAP_PATTERN] = `{
	count, plural,
	=0 {Il There is no {level} map for {hero}.}
	one{The {level} map for {hero} is {maps}.}
	other {The {level} maps for {hero} are {maps}}
}`;
speechPatterns['en'][LEVEL_PATTERN] = ` {
	level, select,
	fort {good}
	faible {bad}
	other {level}
}`;
speechPatterns['en'][ERROR_PATTERN] = `I do not understand what do you mean by {action}`;


var fs = require('fs');
var formatMessage = require('format-message');

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
				var speechPattern = speechPatterns[lang][COUNTER_PATTERN];
			} else if(action == SYNERGIE_ACTION) {
				var heroes = root.heroes[heroKey].synergies;
				var speechPattern = speechPatterns[lang][SYNERGIE_PATTERN];
			} else {
				return app.ask(formatMessage(speechPatterns[lang][ERROR_PATTERN], {action:action}));
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
				return app.ask(formatMessage(speechPatterns[lang][ERROR_PATTERN], {action:action}));
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
				return app.ask(formatMessage(speechPatterns[lang][ERROR_PATTERN], {level:level}));
			}
				
			var mapsAsString = maps.map(elem => elem.name).join(', ');
			var levelAsString = formatMessage(speechPatterns[lang][LEVEL_PATTERN], {level: level});
			var msg = formatMessage(speechPatterns[lang][MAP_PATTERN], { hero: heroName, level:levelAsString , count:maps.length, maps: mapsAsString});
			app.ask(msg);
		});
	}

	const actionMap = new Map();
	actionMap.set(HERO_INFO_INTENT, heroInfo);
	actionMap.set(REASON_INTENT, reason);
	actionMap.set(MAP_INFO_INTENT, mapInfo);

	app.handleRequest(actionMap);
});
