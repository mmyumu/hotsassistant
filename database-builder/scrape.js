var request = require('request');
var cheerio = require('cheerio');
var https = require('https');
var fs = require('fs');
var async = require('async');

const DB_PATH = "../functions/db.json";

var writeFileQueue = async.queue((task, callback) => {
	var file = fs.readFileSync(DB_PATH, 'utf8');	
	var dbJson = JSON.parse(file);
	//console.log('after read dbjson=' + JSON.stringify(dbJson) + ' task=' + JSON.stringify(task));
	
	var heroName = task.name;
	var hero = task.data;
	
	// console.log('Hero to be written: ' + heroName);
	// console.log('Data to be written: ' + JSON.stringify(hero));
	
	dbJson.heroes[heroName] = hero;
	// console.log('JSON to be written: ' + JSON.stringify(dbJson));
	fs.writeFileSync(DB_PATH, JSON.stringify(dbJson, null, 2), 'utf8', (err) => {
		if(err) {
			return console.log('Error writing file='+err);
		}
	});

    callback();
}, 1);

writeFileQueue.drain = () => {
    console.log('Heroes have been written into file');
}

fs.writeFileSync(DB_PATH, JSON.stringify({heroes: {}}, null, 2), 'utf8', (err) => {
	if(err) {
		return console.log('error writing file='+err);
	}
});

request('https://www.icy-veins.com/heroes/', (error, response, html) => {
	if (!error && response.statusCode == 200) {
		var loadedHTML = cheerio.load(html);
		
		getHeroCategory(loadedHTML, 'assassins');
		getHeroCategory(loadedHTML, 'warriors');
		getHeroCategory(loadedHTML, 'support');
		getHeroCategory(loadedHTML, 'specialists');
	} else {
		console.log('error requesting heroes = ' + error);
	}
});

function getHeroCategory(loadedHTML, heroCategory) {
	console.log('Retrieving category ' + heroCategory + '...');
	
	var $ = loadedHTML;
	$('#nav_' + heroCategory + '_section > div.nav_content_block.nav_content_block_heroes.nav_content_block_heroes_hero > div.nav_content_entries > div.nav_content_block_entry_heroes_hero > a > span:not(.free_rotation_marker)').each(function(i, element) {
		getHero($(this).text());
	});
}

function getHero(heroName) {
	console.log('Retrieving hero ' + heroName + '...');
	
	var hero = {
		name : heroName.toLowerCase(),
		data: {
			counters : [],
			synergies: []
		}
	}
	
	var heroUrl = getUrl(heroName);
	console.log('heroUrl=' + heroUrl);
	var requestUrl = 'https://www.icy-veins.com/heroes/' + heroUrl + '-build-guide';
	request(requestUrl, (error, response, html) => {
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(html);
			
			var heroToPush = {};
			
			$('div.heroes_tldr_matchups_countered_by > p').each((i, element) => {
				var reason = $(element).text();
				hero.data.counterReason = reason.replace(/\n/g, ' ');
			});
			
			$('div.heroes_tldr_matchups_works_well_with > p').each((i, element) => {
				var reason = $(element).text();
				hero.data.synergieReason = reason.replace(/\n/g, ' ');
			});
			
			$('div.heroes_tldr_matchups_countered_by').children('div.heroes_tldr_matchups_hero_list').find('img.hero_portrait_bad').each((i, element) => {
				var params = {};
				params.type = 'counter';
				params.title = $(element).attr('title');
				prepareHeroQueue.push(params);
			});
			$('div.heroes_tldr_matchups_works_well_with').children('div.heroes_tldr_matchups_hero_list').find('img.hero_portrait_good').each((i, element) => {
				var params = {};
				params.type = 'synergie';
				params.title = $(element).attr('title');
				prepareHeroQueue.push(params);
			});
		} else {
			console.log('Error requesting hero ' + hero.name + ' = ' + error);
		}
	});
	
	var prepareHeroQueue = async.queue((params, callback) => {
		if(params.type == 'counter') {
			var counter = {
				name: params.title
			};
			hero.data.counters.push(counter);
		} else {
			var synergie = {
				name: params.title
			};
			hero.data.synergies.push(synergie);
		}

		
		callback();
	}, 1);

	prepareHeroQueue.drain = () => {
		console.log('Hero ' + hero.name + ' is ready to be written!');
		writeFileQueue.push(hero);
	}
}

function getUrl(heroName) {
	return heroName
				.replace(/Kel'Thuzad/g, 'Kel-Thuzad')
				.replace(/D.Va/g, 'DVa')
				.replace(/ú/g, 'u')
				.replace(/'/g, '')
				.replace(/\. /g, '-')
				.replace(/ /g, '-')
				.replace(/\.$/g, '')
				.replace(/\./g, '-')
				.toLowerCase()
}